import test from "node:test";
import assert from "node:assert/strict";

import {
  assertValidRequirementModel,
  validateRequirementModel,
} from "../requirements-v2/validate/index.mjs";
import * as modelValidatorExports from "../requirements-v2/validate/model-validator.mjs";
import {
  CLIENT,
  PHASE,
  RISK,
  defineModule,
  defineRequirementModel,
} from "../requirements-v2/model.mjs";

function validFixture() {
  return {
    roles: [
      { id: "ROLE-STUDENT", label: "student" },
      { id: "ROLE-TEACHER", label: "teacher" },
    ],
    duties: [],
    optionSets: [{
      id: "OPT-BOOL",
      values: [{ code: "YES", label: "yes" }],
    }],
    metrics: [{
      id: "MET-TEST",
      ownerRef: "ROLE-STUDENT",
      eventIds: ["EVT-TEST-START", "EVT-TEST-END"],
      scope: "fixture",
      aggregation: "duration",
      target: "defined",
    }],
    modules: [{
      id: "SUB-001",
      phase: PHASE.FIRST,
      objects: [{
        id: "DAT-SUB-01",
        ownerRef: "ROLE-STUDENT",
        confirmerRef: "ROLE-STUDENT",
        states: ["DRAFT", "SUBMITTED"],
        fields: [{
          id: "SUB-F001",
          valueSource: { kind: "OPTION_SET", optionSetId: "OPT-BOOL" },
        }],
      }],
      actions: [{
        id: "SUB-ACT-01",
        targetObjectId: "DAT-SUB-01",
        inputFieldIds: ["SUB-F001"],
        outputFieldIds: [],
        transition: { from: "DRAFT", to: "SUBMITTED" },
        permissions: [
          { effect: "ALLOW", roleRef: "ROLE-STUDENT" },
          { effect: "DENY", roleRef: "ROLE-TEACHER" },
        ],
        scenarioIds: ["SUB-SCN-01", "SUB-SCN-02"],
      }],
      pages: [],
      scenarios: [
        { id: "SUB-SCN-01", kind: "SUCCESS", actionId: "SUB-ACT-01" },
        { id: "SUB-SCN-02", kind: "BOUNDARY", actionId: "SUB-ACT-01" },
      ],
    }, {
      id: "HW-001",
      phase: PHASE.FIRST,
      objects: [{
        id: "DAT-HW-01",
        ownerRef: "ROLE-TEACHER",
        confirmerRef: "ROLE-TEACHER",
        states: ["DRAFT"],
        fields: [{
          id: "HW-F001",
          valueSource: { kind: "SYSTEM" },
          mutability: "READ_ONLY",
        }],
      }],
      actions: [],
      pages: [],
      scenarios: [],
    }, {
      id: "REPORT-001",
      phase: PHASE.SECOND,
      objects: [{
        id: "DAT-REPORT-01",
        ownerRef: "ROLE-TEACHER",
        confirmerRef: "ROLE-TEACHER",
        states: ["AVAILABLE", "GENERATED"],
        fields: [{
          id: "REPORT-F001",
          valueSource: { kind: "SYSTEM" },
          mutability: "READ_ONLY",
        }],
      }],
      actions: [],
      pages: [],
      scenarios: [],
    }],
    flows: [{
      id: "DF-TEST",
      moduleIds: ["SUB-001"],
      steps: [{ actionId: "SUB-ACT-01" }],
    }],
    aiTasks: [],
    extensions: [],
  };
}

function moduleById(model, moduleId) {
  const module = model.modules.find(({ id }) => id === moduleId);
  assert.ok(module, `fixture module ${moduleId} must exist`);
  return module;
}

function errorCodes(errors) {
  return errors.map((error) => error.split(" ", 1)[0]);
}

function assertHasCode(errors, code) {
  assert.ok(
    errorCodes(errors).includes(code),
    `expected ${code} in:\n${errors.join("\n")}`,
  );
}

const ENTITY_CASES = [
  {
    label: "role",
    set(model, value) { model.roles[0] = value; },
  },
  {
    label: "duty",
    set(model, value) { model.duties = [value]; },
  },
  {
    label: "Option Set",
    set(model, value) { model.optionSets[0] = value; },
  },
  {
    label: "metric",
    set(model, value) { model.metrics[0] = value; },
  },
  {
    label: "module",
    set(model, value) { model.modules[0] = value; },
  },
  {
    label: "object",
    set(model, value) { moduleById(model, "SUB-001").objects[0] = value; },
  },
  {
    label: "field",
    set(model, value) {
      moduleById(model, "SUB-001").objects[0].fields[0] = value;
    },
  },
  {
    label: "action",
    set(model, value) { moduleById(model, "SUB-001").actions[0] = value; },
  },
  {
    label: "page",
    set(model, value) { moduleById(model, "SUB-001").pages = [value]; },
  },
  {
    label: "scenario",
    set(model, value) { moduleById(model, "SUB-001").scenarios[0] = value; },
  },
  {
    label: "Flow",
    set(model, value) { model.flows[0] = value; },
  },
  {
    label: "AI task",
    set(model, value) { model.aiTasks = [value]; },
  },
  {
    label: "extension",
    set(model, value) { model.extensions = [value]; },
  },
];

test("accepts the complete semantic fixture", () => {
  assert.deepEqual(validateRequirementModel(validFixture()), []);
});

test("rejects null and non-object requirement models", () => {
  for (const model of [null, 42, "requirement model"]) {
    assert.deepEqual(validateRequirementModel(model), [
      "INVALID_MODEL requirement model must be an object",
    ]);
  }
});

test("rejects missing required top-level collections", () => {
  const collectionNames = [
    "roles",
    "duties",
    "optionSets",
    "metrics",
    "modules",
    "flows",
    "aiTasks",
    "extensions",
  ];

  assert.deepEqual(
    validateRequirementModel({}),
    collectionNames
      .map((name) => `MISSING_MODEL_COLLECTION ${name} must be an array`)
      .sort(),
  );
});

test("accepts explicitly present empty top-level collections", () => {
  assert.deepEqual(validateRequirementModel({
    roles: [],
    duties: [],
    optionSets: [],
    metrics: [],
    modules: [],
    flows: [],
    aiTasks: [],
    extensions: [],
  }), []);
});

for (const entityCase of ENTITY_CASES) {
  test(`rejects null and primitive ${entityCase.label} entries`, () => {
    for (const value of [null, 42]) {
      const model = validFixture();
      entityCase.set(model, value);

      assertHasCode(validateRequirementModel(model), "INVALID_ENTITY_SHAPE");
    }
  });

  test(`rejects missing and non-string ${entityCase.label} IDs`, () => {
    for (const value of [{}, { id: 42 }]) {
      const model = validFixture();
      entityCase.set(model, value);

      assertHasCode(validateRequirementModel(model), "INVALID_ENTITY_SHAPE");
    }
  });
}

const INVALID_COLLECTION_SHAPE_CASES = [
  ["roles", "MISSING_MODEL_COLLECTION", (model) => { model.roles = {}; }],
  ["duties", "MISSING_MODEL_COLLECTION", (model) => { model.duties = {}; }],
  ["Option Set values", "INVALID_ENTITY_SHAPE", (model) => {
    model.optionSets[0].values = {};
  }],
  ["metric event IDs", "INVALID_ENTITY_SHAPE", (model) => {
    model.metrics[0].eventIds = {};
  }],
  ["module objects", "INVALID_ENTITY_SHAPE", (model) => {
    moduleById(model, "SUB-001").objects = {};
  }],
  ["object fields", "INVALID_ENTITY_SHAPE", (model) => {
    moduleById(model, "SUB-001").objects[0].fields = {};
  }],
  ["field value source", "INVALID_ENTITY_SHAPE", (model) => {
    moduleById(model, "SUB-001").objects[0].fields[0].valueSource = [];
  }],
  ["action permissions", "INVALID_ENTITY_SHAPE", (model) => {
    moduleById(model, "SUB-001").actions[0].permissions = {};
  }],
  ["page field IDs", "INVALID_ENTITY_SHAPE", (model) => {
    moduleById(model, "SUB-001").pages = [{
      id: "SUB-W01",
      objectId: "DAT-SUB-01",
      fieldIds: {},
      actionIds: [],
    }];
  }],
  ["scenario collection", "INVALID_ENTITY_SHAPE", (model) => {
    moduleById(model, "SUB-001").scenarios = {};
  }],
  ["Flow steps", "INVALID_ENTITY_SHAPE", (model) => {
    model.flows[0].steps = {};
  }],
  ["AI preview fields", "INVALID_ENTITY_SHAPE", (model) => {
    model.aiTasks = [{
      id: "AI-TASK-01",
      actionId: "SUB-ACT-01",
      writes: false,
      previewFieldIds: {},
      roleRefs: ["ROLE-STUDENT"],
    }];
  }],
  ["extension page IDs", "INVALID_ENTITY_SHAPE", (model) => {
    model.extensions = [{ id: "EXT-01", pageIds: {} }];
  }],
];

for (const [label, expectedCode, mutate] of INVALID_COLLECTION_SHAPE_CASES) {
  test(`rejects an invalid ${label} collection shape`, () => {
    const model = validFixture();
    mutate(model);

    assertHasCode(validateRequirementModel(model), expectedCode);
  });
}

test("does not invoke authored getters during validation", () => {
  const model = validFixture();
  Object.defineProperty(model.modules[0], "id", {
    enumerable: true,
    get() { throw new Error("getter must not run"); },
  });

  let errors;
  assert.doesNotThrow(() => { errors = validateRequirementModel(model); });
  assertHasCode(errors, "MALFORMED_MODEL");
});

test("does not coerce authored values while reporting validation errors", () => {
  const model = validFixture();
  model.metrics[0].ownerRef = {
    [Symbol.toPrimitive]() { throw new Error("coercion must not run"); },
  };

  let errors;
  assert.doesNotThrow(() => { errors = validateRequirementModel(model); });
  assertHasCode(errors, "MALFORMED_MODEL");
});

test("does not coerce null-prototype authored reference values", () => {
  const model = validFixture();
  const reference = Object.create(null);
  model.metrics[0].ownerRef = reference;
  model.flows[0].moduleIds = [reference];
  moduleById(model, "SUB-001").actions[0].transition.to = reference;

  let errors;
  assert.doesNotThrow(() => { errors = validateRequirementModel(model); });
  assert.ok(errors.length > 0);
  assert.equal(errors.every((error) => typeof error === "string"), true);
});

test("rejects functions, symbol keys, custom prototypes, and cycles", () => {
  const mutations = [
    (model) => { model.metrics[0].target = () => "target"; },
    (model) => { model.metrics[0][Symbol("private")] = true; },
    (model) => { Object.setPrototypeOf(model.metrics[0], { custom: true }); },
    (model) => { model.metrics[0].cycle = model; },
  ];

  for (const mutate of mutations) {
    const model = validFixture();
    mutate(model);

    assertHasCode(validateRequirementModel(model), "MALFORMED_MODEL");
  }
});

test("returns a stable malformed error for a revoked top-level Proxy", () => {
  const revocable = Proxy.revocable({}, {});
  revocable.revoke();

  let errors;
  assert.doesNotThrow(() => {
    errors = validateRequirementModel(revocable.proxy);
  });
  assert.deepEqual(errors, [
    "MALFORMED_MODEL model cannot be classified safely",
  ]);
});

test("rejects authored data beyond the maximum traversal depth", () => {
  const model = validFixture();
  let cursor = model;
  for (let depth = 0; depth < 80; depth += 1) {
    cursor.deep = {};
    cursor = cursor.deep;
  }

  let errors;
  assert.doesNotThrow(() => { errors = validateRequirementModel(model); });
  assert.ok(
    errors.some((error) => (
      error.startsWith("MALFORMED_MODEL ")
      && error.endsWith("exceeds maximum depth 64")
    )),
    errors.join("\n"),
  );
});

test("rejects sparse authored collection arrays", () => {
  const mutations = [
    (model) => { model.roles = new Array(1); },
    (model) => {
      moduleById(model, "SUB-001").objects[0].fields = new Array(1);
    },
  ];

  for (const mutate of mutations) {
    const model = validFixture();
    mutate(model);

    assertHasCode(validateRequirementModel(model), "MALFORMED_MODEL");
  }
});

test("exports stable model constants", () => {
  assert.deepEqual(PHASE, { FIRST: 1, SECOND: 2 });
  assert.deepEqual(RISK, { READ: "READ", LOW: "LOW", HIGH: "HIGH" });
  assert.deepEqual(CLIENT, { WEB: "WEB", APP: "APP" });
  assert.equal(Object.isFrozen(PHASE), true);
  assert.equal(Object.isFrozen(RISK), true);
  assert.equal(Object.isFrozen(CLIENT), true);
});

test("defineModule returns an independent clone without defaults", () => {
  const source = { id: "SUB-001", objects: [] };
  const module = defineModule(source);

  assert.deepEqual(module, source);
  assert.notEqual(module, source);
  assert.notEqual(module.objects, source.objects);
  assert.deepEqual(Object.keys(module), ["id", "objects"]);
});

test("defineRequirementModel returns an independent clone without defaults", () => {
  const source = { roles: [], modules: [] };
  const model = defineRequirementModel(source);

  assert.deepEqual(model, source);
  assert.notEqual(model, source);
  assert.notEqual(model.roles, source.roles);
  assert.notEqual(model.modules, source.modules);
  assert.deepEqual(Object.keys(model), ["roles", "modules"]);
});

test("rejects duplicate IDs", () => {
  const model = validFixture();
  model.roles.push({ id: "ROLE-STUDENT", label: "duplicate student" });

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "DUPLICATE_ID");
});

test("rejects duplicate IDs across entity categories", () => {
  const model = validFixture();
  moduleById(model, "HW-001").id = "ROLE-STUDENT";

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "DUPLICATE_ID");
});

test("does not include invalid IDs in duplicate lookup indexes", () => {
  const model = validFixture();
  model.roles = [{ id: "" }, { id: "" }];

  const errors = validateRequirementModel(model);

  assert.equal(errorCodes(errors).includes("DUPLICATE_ID"), false);
  assert.equal(
    errorCodes(errors).filter((code) => code === "INVALID_ENTITY_SHAPE").length,
    2,
  );
});

test("rejects missing and invalid module phases", () => {
  for (const phase of [undefined, 0, 3, "1"]) {
    const model = validFixture();
    const module = moduleById(model, "SUB-001");
    if (phase === undefined) delete module.phase;
    else module.phase = phase;

    assertHasCode(validateRequirementModel(model), "INVALID_MODULE_PHASE");
  }
});

test("accepts every supported field value-source kind", () => {
  const valueSources = [
    { kind: "OPTION_SET", optionSetId: "OPT-BOOL" },
    { kind: "SYSTEM" },
    { kind: "USER_INPUT" },
    { kind: "OBJECT_REF", targetObjectId: "DAT-HW-01" },
    { kind: "RUNTIME_QUERY", queryId: "QUERY-STUDENT-SCOPE" },
    { kind: "DERIVED" },
    { kind: "CONSTANT" },
  ];

  for (const valueSource of valueSources) {
    const model = validFixture();
    moduleById(model, "SUB-001").objects[0].fields[0].valueSource = valueSource;

    assert.deepEqual(validateRequirementModel(model), []);
  }
});

test("rejects missing and unknown field value-source kinds", () => {
  for (const valueSource of [{}, { kind: "" }, { kind: "LEGACY_TEMPLATE" }]) {
    const model = validFixture();
    moduleById(model, "SUB-001").objects[0].fields[0].valueSource = valueSource;

    assertHasCode(validateRequirementModel(model), "INVALID_VALUE_SOURCE");
  }
});

test("rejects missing kind-specific field value-source references", () => {
  const cases = [
    [{ kind: "OPTION_SET" }, "MISSING_OPTION_SET"],
    [{ kind: "OBJECT_REF" }, "MISSING_VALUE_SOURCE_REFERENCE"],
    [{ kind: "RUNTIME_QUERY" }, "MISSING_VALUE_SOURCE_REFERENCE"],
  ];

  for (const [valueSource, expectedCode] of cases) {
    const model = validFixture();
    moduleById(model, "SUB-001").objects[0].fields[0].valueSource = valueSource;

    assertHasCode(validateRequirementModel(model), expectedCode);
  }
});

test("rejects an object-reference value source targeting an unknown object", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").objects[0].fields[0].valueSource = {
    kind: "OBJECT_REF",
    targetObjectId: "DAT-MISSING",
  };

  assertHasCode(
    validateRequirementModel(model),
    "MISSING_VALUE_SOURCE_REFERENCE",
  );
});

test("rejects a choice field without an Option Set", () => {
  const model = validFixture();
  model.optionSets = [];

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_OPTION_SET");
});

test("rejects an action referencing a missing field", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").actions[0].inputFieldIds = ["SUB-F999"];

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_ACTION_FIELD");
});

test("rejects an action referencing a missing target object", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").actions[0].targetObjectId = "DAT-SUB-999";

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_ACTION_OBJECT");
});

test("rejects an action targeting an object owned by another module", () => {
  const model = validFixture();
  const action = moduleById(model, "SUB-001").actions[0];
  action.targetObjectId = "DAT-HW-01";
  action.inputFieldIds = [];
  action.transition = { from: "DRAFT", to: "DRAFT" };

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "INVALID_MODULE_OWNERSHIP");
});

test("rejects an action field not owned by its target object", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").actions[0].inputFieldIds = ["HW-F001"];

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "INVALID_OBJECT_OWNERSHIP");
});

test("rejects missing page object, field, and action references", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").pages.push({
    id: "SUB-W01",
    objectId: "DAT-SUB-999",
    fieldIds: ["SUB-F999"],
    actionIds: ["SUB-ACT-999"],
  });

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_PAGE_OBJECT");
  assertHasCode(errors, "MISSING_PAGE_FIELD");
  assertHasCode(errors, "MISSING_PAGE_ACTION");
});

test("rejects page references owned by another module", () => {
  const model = validFixture();
  moduleById(model, "HW-001").pages.push({
    id: "HW-W01",
    objectId: "DAT-SUB-01",
    fieldIds: ["SUB-F001"],
    actionIds: ["SUB-ACT-01"],
  });

  const errors = validateRequirementModel(model);

  assert.equal(
    errorCodes(errors).filter((code) => code === "INVALID_MODULE_OWNERSHIP").length,
    3,
  );
});

test("rejects a page field owned by a different object in the same module", () => {
  const model = validFixture();
  const submissionModule = moduleById(model, "SUB-001");
  submissionModule.objects.push({
    id: "DAT-SUB-02",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "ROLE-STUDENT",
    states: ["DRAFT"],
    fields: [{ id: "SUB-F002", valueSource: { kind: "SYSTEM" } }],
  });
  submissionModule.pages.push({
    id: "SUB-W01",
    objectId: "DAT-SUB-01",
    fieldIds: ["SUB-F002"],
    actionIds: [],
  });

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "INVALID_OBJECT_OWNERSHIP");
});

test("accepts page fields owned by one of its declared objects", () => {
  const model = validFixture();
  const submissionModule = moduleById(model, "SUB-001");
  submissionModule.objects.push({
    id: "DAT-SUB-02",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "ROLE-STUDENT",
    states: ["DRAFT"],
    fields: [{ id: "SUB-F002", valueSource: { kind: "SYSTEM" } }],
  });
  submissionModule.pages.push({
    id: "SUB-W01",
    objectIds: ["DAT-SUB-01", "DAT-SUB-02"],
    fieldIds: ["SUB-F002"],
    actionIds: [],
  });

  assert.deepEqual(validateRequirementModel(model), []);
});

test("rejects page fields without a declared object contract", () => {
  const objectDeclarations = [
    {},
    { objectId: "" },
    { objectIds: [] },
    { objectIds: [""] },
  ];

  for (const objectDeclaration of objectDeclarations) {
    const model = validFixture();
    moduleById(model, "SUB-001").pages.push({
      id: "SUB-W01",
      ...objectDeclaration,
      fieldIds: ["SUB-F001"],
      actionIds: [],
    });

    assertHasCode(validateRequirementModel(model), "MISSING_PAGE_OBJECT");
  }
});

test("rejects a scenario referencing a missing action", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").scenarios[0].actionId = "SUB-ACT-999";

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_SCENARIO_ACTION");
});

test("rejects a scenario action owned by another module", () => {
  const model = validFixture();
  moduleById(model, "HW-001").scenarios.push({
    id: "HW-SCN-01",
    kind: "BOUNDARY",
    actionId: "SUB-ACT-01",
  });

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "INVALID_MODULE_OWNERSHIP");
});

test("rejects missing Flow module and action references", () => {
  const model = validFixture();
  model.flows[0].moduleIds = ["SUB-999"];
  model.flows[0].steps[0].actionId = "SUB-ACT-999";

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_FLOW_MODULE");
  assertHasCode(errors, "MISSING_FLOW_ACTION");
});

test("rejects missing AI task action and preview-field references", () => {
  const model = validFixture();
  model.aiTasks.push({
    id: "AI-TASK-01",
    actionId: "SUB-ACT-999",
    risk: RISK.READ,
    writes: false,
    previewFieldIds: ["SUB-F999"],
    roleRefs: ["ROLE-STUDENT"],
  });

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_AI_ACTION");
  assertHasCode(errors, "MISSING_AI_PREVIEW_FIELD");
});

test("rejects missing role and duty references in AI tasks", () => {
  const model = validFixture();
  model.aiTasks.push({
    id: "AI-TASK-01",
    actionId: "SUB-ACT-01",
    risk: RISK.READ,
    writes: false,
    previewFieldIds: [],
    roleRefs: ["ROLE-MISSING"],
    dutyRefs: ["DUTY-MISSING"],
  });

  const errors = validateRequirementModel(model);

  assert.equal(
    errorCodes(errors).filter((code) => code === "MISSING_ACTOR_REFERENCE").length,
    2,
  );
});

test("rejects missing actor references throughout the model", () => {
  const model = validFixture();
  const submissionModule = moduleById(model, "SUB-001");
  submissionModule.objects[0].ownerRef = "ROLE-OWNER-MISSING";
  submissionModule.objects[0].confirmerRef = "DUTY-CONFIRMER-MISSING";
  submissionModule.actions[0].permissions[0].roleRef = "ROLE-PERMISSION-MISSING";
  model.metrics[0].ownerRef = "ROLE-METRIC-MISSING";

  const errors = validateRequirementModel(model);

  assert.equal(
    errorCodes(errors).filter((code) => code === "MISSING_ACTOR_REFERENCE").length,
    4,
  );
});

test("accepts explicit system actor categories in actor references", () => {
  const model = validFixture();
  const submissionModule = moduleById(model, "SUB-001");
  submissionModule.objects[0].ownerRef = "SYSTEM";
  submissionModule.objects[0].confirmerRef = "AI";
  submissionModule.actions[0].permissions[0].roleRef = "CURRENT_ACTOR";
  model.metrics[0].ownerRef = "SYSTEM";

  const errors = validateRequirementModel(model);

  assert.equal(errorCodes(errors).includes("MISSING_ACTOR_REFERENCE"), false);
  assert.equal(errorCodes(errors).includes("ORPHAN_OWNER_ROLE"), false);
});

test("does not export a mutable system actor category Set", () => {
  assert.equal(Object.hasOwn(modelValidatorExports, "SYSTEM_ACTOR_CATEGORIES"), false);
});

test("rejects a duty without a role attachment", () => {
  const model = validFixture();
  model.duties.push({ id: "DUTY-ORPHAN" });

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "INVALID_ENTITY_SHAPE");
});

test("rejects a duty attached to an unknown login role", () => {
  const model = validFixture();
  model.duties.push({ id: "DUTY-ORPHAN", roleId: "ROLE-MISSING" });

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_DUTY_ROLE");
});

test("rejects an invalid state transition", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").actions[0].transition.to = "ARCHIVED";

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "INVALID_STATE_TRANSITION");
});

test("rejects a flow whose declared modules and action modules differ", () => {
  const model = validFixture();
  const homeworkModule = moduleById(model, "HW-001");
  model.flows[0].moduleIds = [homeworkModule.id];

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "FLOW_PARTICIPANT_MISMATCH");
});

test("rejects an orphan Owner role", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").objects[0].ownerRef = "ROLE-ORPHAN";

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "ORPHAN_OWNER_ROLE");
});

for (const missingEffect of ["ALLOW", "DENY"]) {
  test(`rejects an action without an explicit ${missingEffect} permission`, () => {
    const model = validFixture();
    const action = moduleById(model, "SUB-001").actions[0];
    action.permissions = action.permissions.filter(({ effect }) => effect !== missingEffect);

    const errors = validateRequirementModel(model);

    assertHasCode(errors, "MISSING_ACTION_PERMISSION");
  });
}

test("returns validation errors for a null permission entry", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").actions[0].permissions = [
    null,
    { effect: "DENY", roleRef: "ROLE-TEACHER" },
  ];

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_ACTION_PERMISSION");
});

test("rejects an actor-less ALLOW permission", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").actions[0].permissions = [
    { effect: "ALLOW" },
    { effect: "DENY", roleRef: "ROLE-TEACHER" },
  ];

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_ACTOR_REFERENCE");
});

test("rejects an actor-less read-only AI task", () => {
  const model = validFixture();
  model.aiTasks.push({
    id: "AI-TASK-01",
    actionId: "SUB-ACT-01",
    risk: RISK.READ,
    writes: false,
    previewFieldIds: [],
  });

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_ACTOR_REFERENCE");
});

test("returns stable errors for a null AI task entry", () => {
  const model = validFixture();
  model.aiTasks.push(null);

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_AI_ACTION");
  assertHasCode(errors, "MISSING_ACTOR_REFERENCE");
});

test("rejects an action without success and negative scenario coverage", () => {
  const model = validFixture();
  const submissionModule = moduleById(model, "SUB-001");
  submissionModule.actions[0].scenarioIds = ["SUB-SCN-01"];
  submissionModule.scenarios = submissionModule.scenarios.filter(
    ({ kind }) => kind === "SUCCESS",
  );

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_ACTION_SCENARIO");
});

test("rejects scenario coverage whose IDs do not match the action", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").actions[0].scenarioIds = ["SUB-SCN-01"];

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_ACTION_SCENARIO");
});

test("rejects phase-two page contracts independently of actions", () => {
  const model = validFixture();
  const reportModule = moduleById(model, "REPORT-001");
  assert.deepEqual(reportModule.actions, []);
  reportModule.pages = [{
    id: "REPORT-W01",
    objectId: "DAT-REPORT-01",
    fieldIds: ["REPORT-F001"],
    actionIds: [],
  }];

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "PHASE_BOUNDARY_EXECUTABLE_PAGE");
});

test("rejects executable phase-two actions independently of pages", () => {
  const model = validFixture();
  const reportModule = moduleById(model, "REPORT-001");
  assert.deepEqual(reportModule.pages, []);
  reportModule.actions = [{
    id: "REPORT-ACT-01",
    targetObjectId: "DAT-REPORT-01",
    inputFieldIds: [],
    outputFieldIds: [],
    transition: { from: "AVAILABLE", to: "GENERATED" },
    permissions: [
      { effect: "ALLOW", roleRef: "ROLE-TEACHER" },
      { effect: "DENY", roleRef: "ROLE-STUDENT" },
    ],
    scenarioIds: ["REPORT-SCN-01", "REPORT-SCN-02"],
  }];
  reportModule.scenarios = [
    { id: "REPORT-SCN-01", kind: "SUCCESS", actionId: "REPORT-ACT-01" },
    { id: "REPORT-SCN-02", kind: "BOUNDARY", actionId: "REPORT-ACT-01" },
  ];

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "PHASE_BOUNDARY_EXECUTABLE_PAGE");
});

test("accepts metadata-only phase-two extension registrations", () => {
  const model = validFixture();
  model.extensions.push({
    id: "EXT-REPORT",
    metadata: { label: "guardian report" },
    dependencies: ["DAT-REPORT-01"],
  });

  assert.deepEqual(validateRequirementModel(model), []);
});

for (const [property, value] of [
  ["pageIds", ["EXT-W01"]],
  ["actionIds", ["EXT-ACT-01"]],
  ["pages", [{ id: "EXT-W01" }]],
  ["actions", [{ id: "EXT-ACT-01" }]],
]) {
  test(`rejects executable extension ${property}`, () => {
    const model = validFixture();
    model.extensions.push({ id: "EXT-REPORT", [property]: value });

    const errors = validateRequirementModel(model);

    assertHasCode(errors, "PHASE_BOUNDARY_EXECUTABLE_PAGE");
  });
}

test("rejects an AI write task without confirmation", () => {
  const model = validFixture();
  model.aiTasks = [{
    id: "AI-TASK-01",
    actionId: "SUB-ACT-01",
    risk: RISK.HIGH,
    writes: true,
    previewFieldIds: ["SUB-F001"],
  }];

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "AI_WRITE_WITHOUT_CONFIRMATION");
});

test("rejects role-only confirmation for an AI write task", () => {
  const model = validFixture();
  model.aiTasks.push({
    id: "AI-TASK-01",
    actionId: "SUB-ACT-01",
    risk: RISK.HIGH,
    writes: true,
    previewFieldIds: ["SUB-F001"],
    roleRefs: ["ROLE-STUDENT"],
    confirmerRef: "ROLE-TEACHER",
  });

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "AI_WRITE_WITHOUT_CONFIRMATION");
});

test("accepts authorized duty confirmation for an AI write task", () => {
  const model = validFixture();
  model.duties.push({
    id: "DUTY-SUBJECT-TEACHER",
    roleId: "ROLE-TEACHER",
    label: "subject teacher",
  });
  model.aiTasks.push({
    id: "AI-TASK-01",
    actionId: "SUB-ACT-01",
    risk: RISK.HIGH,
    writes: true,
    previewFieldIds: ["SUB-F001"],
    roleRefs: ["ROLE-STUDENT"],
    confirmerDutyRef: "DUTY-SUBJECT-TEACHER",
  });

  assert.deepEqual(validateRequirementModel(model), []);
});

test("rejects AI confirmation by a duty not attached to a login role", () => {
  const model = validFixture();
  model.duties.push({
    id: "DUTY-ORPHAN",
    roleId: "ROLE-MISSING",
  });
  model.aiTasks.push({
    id: "AI-TASK-01",
    actionId: "SUB-ACT-01",
    risk: RISK.HIGH,
    writes: true,
    previewFieldIds: ["SUB-F001"],
    roleRefs: ["ROLE-STUDENT"],
    confirmerDutyRef: "DUTY-ORPHAN",
  });

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_DUTY_ROLE");
  assertHasCode(errors, "AI_WRITE_WITHOUT_CONFIRMATION");
});

for (const previewFieldId of ["SUB-F002", "HW-F001"]) {
  test(`rejects unrelated AI write preview field ${previewFieldId}`, () => {
    const model = validFixture();
    model.duties.push({
      id: "DUTY-SUBJECT-TEACHER",
      roleId: "ROLE-TEACHER",
    });
    moduleById(model, "SUB-001").objects[0].fields.push({
      id: "SUB-F002",
      valueSource: { kind: "SYSTEM" },
    });
    model.aiTasks.push({
      id: "AI-TASK-01",
      actionId: "SUB-ACT-01",
      risk: RISK.HIGH,
      writes: true,
      previewFieldIds: [previewFieldId],
      roleRefs: ["ROLE-STUDENT"],
      confirmerDutyRef: "DUTY-SUBJECT-TEACHER",
    });

    const errors = validateRequirementModel(model);

    assertHasCode(errors, "INVALID_AI_PREVIEW_FIELD");
  });
}

test("accepts AI write preview fields from action inputs and outputs", () => {
  const model = validFixture();
  model.duties.push({
    id: "DUTY-SUBJECT-TEACHER",
    roleId: "ROLE-TEACHER",
  });
  const submissionModule = moduleById(model, "SUB-001");
  submissionModule.objects[0].fields.push({
    id: "SUB-F002",
    valueSource: { kind: "SYSTEM" },
  });
  submissionModule.actions[0].outputFieldIds = ["SUB-F002"];
  model.aiTasks.push({
    id: "AI-TASK-01",
    actionId: "SUB-ACT-01",
    risk: RISK.HIGH,
    writes: true,
    previewFieldIds: ["SUB-F001", "SUB-F002"],
    roleRefs: ["ROLE-STUDENT"],
    confirmerDutyRef: "DUTY-SUBJECT-TEACHER",
  });

  assert.deepEqual(validateRequirementModel(model), []);
});

test("rejects a baseline metric without an event mapping", () => {
  const model = validFixture();
  model.metrics[0].eventIds = [];

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_METRIC_EVENT");
});

test("rejects every incomplete metric contract field", () => {
  const requiredProperties = ["eventIds", "scope", "aggregation", "ownerRef", "target"];

  for (const property of requiredProperties) {
    const model = validFixture();
    model.metrics[0][property] = property === "eventIds" ? [] : "";

    assertHasCode(validateRequirementModel(model), "MISSING_METRIC_EVENT");
  }
});

test("accepts falsy but explicitly present metric targets", () => {
  for (const target of [0, false]) {
    const model = validFixture();
    model.metrics[0].target = target;

    assert.deepEqual(validateRequirementModel(model), []);
  }
});

test("accepts supported metric aggregations with sufficient events", () => {
  const cases = [
    ["duration", ["EVT-START", "EVT-END"]],
    ["ratio", ["EVT-NUMERATOR", "EVT-DENOMINATOR"]],
    ["conversion", ["EVT-ENTER", "EVT-COMPLETE"]],
    ["count", ["EVT-COUNT"]],
    ["boolean", ["EVT-FLAG"]],
  ];

  for (const [aggregation, eventIds] of cases) {
    const model = validFixture();
    model.metrics[0].aggregation = aggregation;
    model.metrics[0].eventIds = eventIds;

    assert.deepEqual(validateRequirementModel(model), []);
  }
});

test("rejects an unknown metric aggregation", () => {
  const model = validFixture();
  model.metrics[0].aggregation = "average";

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "INVALID_METRIC_AGGREGATION");
});

test("requires two distinct events for paired metric aggregations", () => {
  for (const aggregation of ["duration", "ratio", "conversion"]) {
    for (const eventIds of [["EVT-ONLY"], ["EVT-SAME", "EVT-SAME"]]) {
      const model = validFixture();
      model.metrics[0].aggregation = aggregation;
      model.metrics[0].eventIds = eventIds;

      assertHasCode(validateRequirementModel(model), "MISSING_METRIC_EVENT");
    }
  }
});

test("rejects invalid metric event IDs without counting them", () => {
  for (const invalidEventId of [null, "", 42]) {
    for (const [aggregation, eventIds] of [
      ["count", [invalidEventId]],
      ["duration", ["EVT-START", invalidEventId]],
    ]) {
      const model = validFixture();
      model.metrics[0].aggregation = aggregation;
      model.metrics[0].eventIds = eventIds;

      const errors = validateRequirementModel(model);

      assertHasCode(errors, "INVALID_ENTITY_SHAPE");
      assertHasCode(errors, "MISSING_METRIC_EVENT");
    }
  }
});

test("rejects every forbidden generic action template name", () => {
  const names = [
    "对象查询与范围筛选",
    "详情查看与版本追踪",
    "创建/修改/确认主动作",
    "AI 对话与草稿/执行",
    "审计、通知与下游失效",
  ];

  for (const name of names) {
    const model = validFixture();
    moduleById(model, "SUB-001").actions[0].name = name;

    assertHasCode(validateRequirementModel(model), "FORBIDDEN_GENERIC_TEMPLATE");
  }
});

test("rejects every forbidden generic page template name", () => {
  const names = ["列表/工作台", "详情/处理页", "预览/确认页", "历史/审计页"];

  for (const name of names) {
    const model = validFixture();
    moduleById(model, "SUB-001").pages.push({
      id: "SUB-W01",
      name,
      objectId: "DAT-SUB-01",
      fieldIds: ["SUB-F001"],
      actionIds: ["SUB-ACT-01"],
    });

    assertHasCode(validateRequirementModel(model), "FORBIDDEN_GENERIC_TEMPLATE");
  }
});

test("rejects forbidden generic names in every display-name field", () => {
  const model = validFixture();
  const submissionModule = moduleById(model, "SUB-001");
  submissionModule.actions[0].name = "submit answer";
  submissionModule.actions[0].label = "对象查询与范围筛选";
  submissionModule.pages.push({
    id: "SUB-W01",
    name: "submission desk",
    title: "列表/工作台",
    objectId: "DAT-SUB-01",
    fieldIds: ["SUB-F001"],
    actionIds: ["SUB-ACT-01"],
  });

  const errors = validateRequirementModel(model);

  assert.equal(
    errorCodes(errors).filter((code) => code === "FORBIDDEN_GENERIC_TEMPLATE").length,
    2,
  );
});

test("returns deterministic errors and does not stop at the first failure", () => {
  const model = validFixture();
  const action = moduleById(model, "SUB-001").actions[0];
  action.inputFieldIds = ["SUB-F999"];
  action.permissions = [];
  model.metrics[0].eventIds = [];

  const firstErrors = validateRequirementModel(model);
  const secondErrors = validateRequirementModel(model);

  const expectedErrors = [
    "MISSING_ACTION_FIELD SUB-ACT-01 -> SUB-F999",
    "MISSING_ACTION_PERMISSION SUB-ACT-01 requires ALLOW and DENY",
    "MISSING_METRIC_EVENT MET-TEST requires events, scope, aggregation, Owner, and target",
  ];
  assert.deepEqual(firstErrors, expectedErrors);
  assert.deepEqual(secondErrors, expectedErrors);
});

test("assertValidRequirementModel throws one aggregated validation error", () => {
  const model = validFixture();
  const action = moduleById(model, "SUB-001").actions[0];
  action.inputFieldIds = ["SUB-F999"];
  action.permissions = [];

  assert.throws(
    () => assertValidRequirementModel(model),
    (error) => {
      assert.match(error.message, /^Invalid requirement model:/);
      assert.match(error.message, /MISSING_ACTION_FIELD/);
      assert.match(error.message, /MISSING_ACTION_PERMISSION/);
      return true;
    },
  );
});
