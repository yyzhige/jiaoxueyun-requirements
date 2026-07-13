import test from "node:test";
import assert from "node:assert/strict";

import {
  assertValidRequirementModel,
  validateRequirementModel,
} from "../requirements-v2/validate/index.mjs";
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

test("accepts the complete semantic fixture", () => {
  assert.deepEqual(validateRequirementModel(validFixture()), []);
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

test("rejects a scenario referencing a missing action", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").scenarios[0].actionId = "SUB-ACT-999";

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_SCENARIO_ACTION");
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

  const firstErrors = validateRequirementModel(model);
  const secondErrors = validateRequirementModel(model);

  assert.deepEqual(firstErrors, secondErrors);
  assertHasCode(firstErrors, "MISSING_ACTION_FIELD");
  assertHasCode(firstErrors, "MISSING_ACTION_PERMISSION");
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
