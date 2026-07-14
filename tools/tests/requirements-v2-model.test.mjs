import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import {
  assertValidRequirementModel,
  validateRequirementModel,
} from "../requirements-v2/validate/index.mjs";
import * as modelValidatorExports from "../requirements-v2/validate/model-validator.mjs";
import * as requirementModelExports from "../requirements-v2/model.mjs";
import { prepareRequirementModel } from "../requirements-v2/validate/structure-validator.mjs";
import {
  CLIENT,
  PHASE,
  RISK,
  defineModule,
  defineRequirementModel,
} from "../requirements-v2/model.mjs";
import {
  baselineDecisions,
  duties,
  events,
  extensions,
  lifecyclePolicies,
  metrics,
  nfrs,
  optionSets,
  aiTasks,
  flows,
  modules,
  requirementModel,
  roles,
  sensitivities,
} from "../requirements-v2/facts/index.mjs";

function validField(id, overrides = {}) {
  return {
    id,
    label: `${id} label`,
    dataType: "STRING",
    required: true,
    valueSource: { kind: "SYSTEM" },
    mutability: "READ_ONLY",
    visibility: "AUTHORIZED_SCOPE",
    validation: "must match the declared data type",
    historyPolicy: "retain the accepted value with its source version",
    ...overrides,
  };
}

function validObject(id, ownerRef, field, overrides = {}) {
  return {
    id,
    label: `${id} label`,
    dataSubject: "FIXTURE_RECORD",
    controlSubject: "SCHOOL",
    producerRef: ownerRef,
    ownerRef,
    confirmerRef: ownerRef,
    stewardRef: ownerRef,
    lifecyclePolicyId: "LIFE-TEST",
    sensitivityId: "S2",
    readMode: "AUTHORIZED",
    states: ["DRAFT", "SUBMITTED"],
    fields: [field],
    ...overrides,
  };
}

function validScenario(id, actionId, kind, overrides = {}) {
  return {
    id,
    kind,
    actionId,
    pageId: "SUB-PAGE-01",
    ...(kind === "SUCCESS" ? {} : { resultCode: "PERMISSION_DENIED" }),
    given: "the actor has an active authorized context",
    when: "the actor performs the task-specific action",
    then: {
      expectedData: "the target data reflects the accepted request",
      expectedState: kind === "SUCCESS"
        ? { mode: "STATE", value: "SUBMITTED" }
        : { mode: "UNCHANGED" },
      expectedPermission: kind === "SUCCESS" ? "ALLOW" : "DENY",
      expectedVisibility: "only the authorized scope is visible",
    },
    ...overrides,
  };
}

function validAction(id, targetObjectId, inputFieldIds, scenarioIds, overrides = {}) {
  return {
    id,
    label: `${id} task action`,
    targetObjectId,
    inputFieldIds,
    outputFieldIds: [],
    transition: { from: "DRAFT", to: "SUBMITTED" },
    operationKind: "UPDATE",
    writes: true,
    risk: RISK.LOW,
    executionMode: "USER_TASK",
    clients: [CLIENT.WEB, CLIENT.APP],
    permissions: [
      { effect: "ALLOW", roleRef: "ROLE-STUDENT", condition: "owns target object" },
      { effect: "DENY", roleRef: "ROLE-TEACHER", condition: "outside assigned scope" },
    ],
    scenarioIds,
    idempotencyKey: `${id}:target-version:request-id`,
    auditMode: "REQUIRED",
    failureResults: ["PERMISSION_DENIED", "VERSION_CONFLICT"],
    ...overrides,
  };
}

function validPage(id, objectDeclaration, fieldIds, actionIds, overrides = {}) {
  return {
    id,
    label: `${id} task workspace`,
    clients: [CLIENT.WEB, CLIENT.APP],
    ...objectDeclaration,
    fieldIds,
    actionIds,
    regions: ["TASK_HEADER", "PRIMARY_WORK_AREA", "RESULT_STATUS"],
    viewStates: ["LOADING", "READY", "EMPTY", "ERROR", "FORBIDDEN"],
    ...overrides,
  };
}

function nonUserActionFixture(executionMode, trigger) {
  const model = validFixture();
  const module = moduleById(model, "SUB-001");
  const action = module.actions[0];
  action.executionMode = executionMode;
  action.trigger = structuredClone(trigger);
  action.auditMode = "REQUIRED";
  delete action.auditRequired;
  delete action.clients;
  action.permissions = [
    { effect: "ALLOW", actorRef: "SYSTEM", condition: "the verified trigger invokes it" },
    { effect: "DENY", actorRef: "CURRENT_ACTOR", condition: "users cannot invoke it" },
  ];
  module.pages[0].actionIds = [];
  for (const scenario of module.scenarios) {
    delete scenario.pageId;
    scenario.trigger = structuredClone(trigger);
  }
  return model;
}

function validFixture() {
  const submissionIdentityField = validField("SUB-F000", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_ID",
  });
  const submissionField = validField("SUB-F001", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-BOOL" },
    mutability: "EDITABLE",
  });
  const submissionVersionField = validField("SUB-F002", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  });
  const submissionScenarios = [
    validScenario("SUB-SCN-01", "SUB-ACT-01", "SUCCESS"),
    validScenario("SUB-SCN-02", "SUB-ACT-01", "BOUNDARY"),
    validScenario("SUB-SCN-03", "SUB-ACT-01", "FAILURE", {
      resultCode: "VERSION_CONFLICT",
    }),
  ];
  return {
    baselineDecisions: [{
      id: "BASE-TEST",
      statement: "fixture baseline decision",
      rationale: "fixture rationale",
      immutable: true,
    }],
    roles: [
      { id: "ROLE-STUDENT", label: "student" },
      { id: "ROLE-TEACHER", label: "teacher" },
      { id: "ROLE-PLATFORM-OPS", label: "platform operations" },
    ],
    duties: [],
    lifecyclePolicies: [{
      id: "LIFE-TEST",
      scope: "fixture",
      writeRule: "fixture writes are authorized",
      historyRule: "fixture history is retained",
      retentionOwner: "ROLE-STUDENT",
      expiryOrArchival: "fixture records expire by policy",
    }],
    sensitivities: [{
      id: "S2",
      label: "fixture internal data",
      handlingRule: "visible only inside the authorized fixture scope",
    }],
    optionSets: [{
      id: "OPT-BOOL",
      key: "yesNoFixture",
      label: "yes or no fixture",
      mode: "STATIC",
      values: [{ code: "YES", label: "yes" }],
    }],
    events: [{
      id: "EVT-TEST-START",
      label: "fixture start",
      definition: "fixture metric start event",
    }, {
      id: "EVT-TEST-END",
      label: "fixture end",
      definition: "fixture metric end event",
    }],
    metrics: [{
      id: "MET-TEST",
      ownerRef: "ROLE-STUDENT",
      eventIds: ["EVT-TEST-START", "EVT-TEST-END"],
      scope: "fixture",
      aggregation: "duration",
      target: "defined",
      exclusions: "none",
      window: "fixture run",
    }],
    nfrs: [{
      id: "NFR-TEST",
      statement: "fixture operations are observable",
      verification: "exercise success and failure paths",
    }],
    modules: [{
      id: "SUB-001",
      phase: PHASE.FIRST,
      priority: "P0",
      title: "Fixture submission",
      objective: "Accept one authorized fixture submission",
      entryConditions: ["an active fixture context exists"],
      exitConditions: ["the accepted version is observable"],
      baselineDecisionIds: ["BASE-TEST"],
      nfrIds: ["NFR-TEST"],
      objects: [validObject("DAT-SUB-01", "ROLE-STUDENT", submissionField, {
        fields: [submissionIdentityField, submissionField, submissionVersionField],
      })],
      relationships: [],
      actions: [validAction(
        "SUB-ACT-01",
        "DAT-SUB-01",
        ["SUB-F001"],
        submissionScenarios.map(({ id }) => id),
        { outputFieldIds: ["SUB-F001", "SUB-F002"] },
      )],
      pages: [validPage(
        "SUB-PAGE-01",
        { objectId: "DAT-SUB-01" },
        ["SUB-F001"],
        ["SUB-ACT-01"],
      )],
      scenarios: submissionScenarios,
    }, {
      id: "HW-001",
      phase: PHASE.FIRST,
      priority: "P0",
      title: "Fixture homework",
      objective: "Expose one authorized fixture homework fact",
      entryConditions: ["an active teacher context exists"],
      exitConditions: ["the homework fact remains readable"],
      baselineDecisionIds: ["BASE-TEST"],
      nfrIds: ["NFR-TEST"],
      objects: [validObject("DAT-HW-01", "ROLE-TEACHER", validField("HW-F001"), {
        fields: [
          validField("HW-F000", {
            dataType: "ID",
            valueSource: { kind: "SYSTEM" },
            mutability: "IMMUTABLE",
            idempotencyRole: "OBJECT_ID",
          }),
          validField("HW-F001"),
        ],
        states: ["DRAFT"],
      })],
      relationships: [],
      actions: [],
      pages: [],
      scenarios: [],
    }, {
      id: "REPORT-001",
      phase: PHASE.SECOND,
      objects: [validObject("DAT-REPORT-01", "ROLE-TEACHER", validField("REPORT-F001"), {
        states: ["AVAILABLE", "GENERATED"],
      })],
      actions: [],
      pages: [],
      scenarios: [],
    }],
    flows: [{
      id: "DF-TEST",
      label: "Fixture submission flow",
      phase: PHASE.FIRST,
      moduleIds: ["SUB-001"],
      steps: [{ order: 1, actionId: "SUB-ACT-01" }],
      sourceDataRefs: [{ objectId: "DAT-SUB-01", fieldId: "SUB-F000", version: "SUB-F002" }],
      targetDataRefs: [{ objectId: "DAT-SUB-01", fieldId: "SUB-F001", version: "SUB-F002" }],
      idempotencyKeyParts: {
        identityFieldIds: ["SUB-F000"],
        versionFieldIds: ["SUB-F002"],
        fanoutFieldId: "SUB-F000",
      },
      failureGranularity: "STEP",
      retryPolicy: {
        strategy: "BOUNDED",
        maxAttempts: 3,
        retryableFailureResults: ["VERSION_CONFLICT"],
      },
      compensation: {
        strategy: "NO_ROLLBACK_AFTER_ACCEPTANCE",
        description: "retry only the failed step before acceptance",
      },
      downstreamInvalidation: {
        strategy: "INVALIDATE_DERIVED_READ_MODELS",
        targets: ["fixture submission read model"],
      },
    }],
    aiTasks: [],
    extensions: [],
  };
}

function addLineageBindingFixture(model) {
  const submissionObject = moduleById(model, "SUB-001").objects[0];
  const targetVersionField = moduleById(model, "HW-001").objects[0].fields
    .find(({ id }) => id === "HW-F001");
  Object.assign(targetVersionField, {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  });
  submissionObject.fields.push(validField("SUB-F003", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "DAT-HW-01" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    versionBinding: {
      versionFieldId: "SUB-F002",
      targetVersionFieldId: "HW-F001",
    },
  }));
  submissionObject.lineageBindings = [{
    refFieldId: "SUB-F003",
    versionFieldId: "SUB-F002",
    targetObjectId: "DAT-HW-01",
    targetVersionFieldId: "HW-F001",
  }];
}

function addReadPolicyFixture(model) {
  const module = moduleById(model, "SUB-001");
  module.objects[0].readMode = "STUDENT_TIMED_RELEASE";
  module.objects[0].fields.push(validField("SUB-F003", { dataType: "DATETIME" }));
  module.objects[0].fields.push(validField("SUB-F004", {
    label: "internal correction trace",
    visibility: "INTERNAL",
  }));
  module.objects[0].fields
    .find(({ id }) => id === "SUB-F001").releaseRequirement = {
      readPolicyId: "SUB-RP-OWNED-RESULT",
      requiredState: "SUBMITTED",
      visibleAtFieldId: "SUB-F003",
    };
  const scenarios = [
    validScenario("SUB-READ-SCN-SUCCESS", "SUB-ACT-READ", "SUCCESS", {
      then: {
        expectedData: "returns the visible owned record fields",
        expectedState: { mode: "UNCHANGED" },
        expectedPermission: "ALLOW",
        expectedVisibility: "only the owned record is visible",
      },
    }),
    validScenario("SUB-READ-SCN-DENIED", "SUB-ACT-READ", "FAILURE", {
      resultCode: "PERMISSION_DENIED",
      then: {
        expectedData: "returns no record outside ownership",
        expectedState: { mode: "UNCHANGED" },
        expectedPermission: "DENY",
        expectedVisibility: "no unauthorized record is visible",
      },
    }),
  ];
  const readAction = validAction(
    "SUB-ACT-READ",
    "DAT-SUB-01",
    ["SUB-F000"],
    scenarios.map(({ id }) => id),
    {
      outputFieldIds: ["SUB-F000", "SUB-F001", "SUB-F002", "SUB-F003"],
      operationKind: "READ",
      writes: false,
      risk: RISK.READ,
      auditMode: "NOT_REQUIRED",
      failureResults: ["PERMISSION_DENIED"],
    },
  );
  delete readAction.transition;
  delete readAction.idempotencyKey;
  module.actions.push(readAction);
  module.scenarios.push(...scenarios);
  module.pages[0].actionIds.push("SUB-ACT-READ");
  module.pages[0].fieldIds = ["SUB-F000", "SUB-F001", "SUB-F002", "SUB-F003"];
  module.objects[0].readPolicies = [{
    id: "SUB-RP-OWNED-RESULT",
    actionId: "SUB-ACT-READ",
    subject: { roleRef: "ROLE-STUDENT" },
    scope: { kind: "OWN_RECORD", subjectFieldId: "SUB-F000" },
    requiredState: "SUBMITTED",
    safeMetadataFieldIds: ["SUB-F002"],
    timeGates: [{
      visibleAtFieldId: "SUB-F003",
      protectedFieldIds: ["SUB-F001"],
    }],
  }];
}

function validStaticOptionSet(overrides = {}) {
  return {
    id: "OPT-STATIC-TEST",
    key: "staticTest",
    label: "static test",
    mode: "STATIC",
    values: [{ code: "ONE", label: "one" }],
    ...overrides,
  };
}

function validRuntimeOptionSet(overrides = {}) {
  return {
    id: "OPT-RUNTIME-TEST",
    key: "runtimeTest",
    label: "runtime test",
    mode: "RUNTIME_QUERY",
    values: [],
    source: {
      queryId: "QUERY-AUTHORIZED-SCHOOLS",
      idKind: "OBJECT_ID",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: ["schoolId"],
    },
    ...overrides,
  };
}

function validExtension(overrides = {}) {
  return {
    id: "EXT-TEST",
    label: "test extension",
    phase: 2,
    status: "REGISTERED_ONLY",
    dependencies: ["dependency"],
    entryCriteria: ["entry criterion"],
    excludedFirstStageBehavior: ["excluded behavior"],
    ...overrides,
  };
}

function validMultiSeriesConversionModel() {
  const model = validFixture();
  const eventIds = [
    "EVT-SUBMISSION-START",
    "EVT-SUBMISSION-SUCCESS",
    "EVT-GRADING-START",
    "EVT-GRADING-SUCCESS",
    "EVT-PUBLICATION-START",
    "EVT-PUBLICATION-SUCCESS",
  ];
  model.events = eventIds.map((id) => ({
    id,
    label: id,
    definition: "multi-series fixture event",
  }));
  model.metrics[0] = {
    ...model.metrics[0],
    aggregation: "conversion",
    eventIds,
    series: [
      {
        id: "submission",
        startEventId: "EVT-SUBMISSION-START",
        successEventId: "EVT-SUBMISSION-SUCCESS",
        correlationKey: "submissionId",
        target: "100%",
      },
      {
        id: "grading",
        startEventId: "EVT-GRADING-START",
        successEventId: "EVT-GRADING-SUCCESS",
        correlationKey: "gradingId",
        target: "100%",
      },
      {
        id: "publication",
        startEventId: "EVT-PUBLICATION-START",
        successEventId: "EVT-PUBLICATION-SUCCESS",
        correlationKey: "publicationId",
        target: "100%",
      },
    ],
  };
  return model;
}

function assertDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  assert.equal(Object.isFrozen(value), true);
  for (const child of Object.values(value)) assertDeepFrozen(child, seen);
}

const REQUIRED_COLLECTION_NAMES = [
  "baselineDecisions",
  "roles",
  "duties",
  "lifecyclePolicies",
  "sensitivities",
  "optionSets",
  "events",
  "metrics",
  "nfrs",
  "modules",
  "flows",
  "aiTasks",
  "extensions",
];

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

function assertNoCode(errors, code) {
  assert.equal(
    errorCodes(errors).includes(code),
    false,
    `did not expect ${code} in:\n${errors.join("\n")}`,
  );
}

function successScenario(model) {
  return moduleById(model, "SUB-001").scenarios.find(({ kind }) => kind === "SUCCESS");
}

function reachableObjectStates(module, objectId, initialStates = []) {
  const reachable = new Set(initialStates);
  const successStateByActionId = new Map(module.scenarios
    .filter(({ kind }) => kind === "SUCCESS")
    .map((scenario) => [scenario.actionId, scenario.then.expectedState]));

  for (const action of module.actions) {
    if (action.targetObjectId !== objectId || action.operationKind !== "CREATE") continue;
    const expectedState = successStateByActionId.get(action.id);
    if (expectedState?.mode === "STATE") reachable.add(expectedState.value);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const action of module.actions) {
      if (
        action.targetObjectId !== objectId
        || !action.transition
        || !reachable.has(action.transition.from)
      ) continue;
      const actionStates = module.scenarios
        .filter(({ actionId }) => actionId === action.id)
        .map(({ then }) => then.expectedState)
        .filter(({ mode }) => mode === "STATE")
        .map(({ value }) => value);
      for (const state of actionStates) {
        if (reachable.has(state)) continue;
        reachable.add(state);
        changed = true;
      }
    }
  }
  return reachable;
}

const ENTITY_CASES = [
  {
    label: "baseline decision",
    set(model, value) { model.baselineDecisions = [value]; },
  },
  {
    label: "role",
    set(model, value) { model.roles[0] = value; },
  },
  {
    label: "duty",
    set(model, value) { model.duties = [value]; },
  },
  {
    label: "lifecycle policy",
    set(model, value) { model.lifecyclePolicies = [value]; },
  },
  {
    label: "sensitivity",
    set(model, value) { model.sensitivities = [value]; },
  },
  {
    label: "Option Set",
    set(model, value) { model.optionSets[0] = value; },
  },
  {
    label: "event",
    set(model, value) { model.events[0] = value; },
  },
  {
    label: "metric",
    set(model, value) { model.metrics[0] = value; },
  },
  {
    label: "NFR",
    set(model, value) { model.nfrs = [value]; },
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

test("rejects incomplete phase-one module contracts", () => {
  for (const property of [
    "priority",
    "title",
    "objective",
    "entryConditions",
    "exitConditions",
    "baselineDecisionIds",
    "nfrIds",
    "relationships",
  ]) {
    const model = validFixture();
    delete moduleById(model, "SUB-001")[property];

    assertHasCode(validateRequirementModel(model), "INVALID_MODULE_CONTRACT");
  }
});

test("rejects incomplete object and field contracts", () => {
  for (const property of [
    "label",
    "dataSubject",
    "controlSubject",
    "producerRef",
    "ownerRef",
    "confirmerRef",
    "stewardRef",
    "lifecyclePolicyId",
    "sensitivityId",
    "states",
    "fields",
  ]) {
    const model = validFixture();
    delete moduleById(model, "SUB-001").objects[0][property];

    assertHasCode(validateRequirementModel(model), "INVALID_OBJECT_CONTRACT");
  }

  for (const property of [
    "label",
    "dataType",
    "required",
    "valueSource",
    "mutability",
    "visibility",
    "validation",
    "historyPolicy",
  ]) {
    const model = validFixture();
    delete moduleById(model, "SUB-001").objects[0].fields[0][property];

    assertHasCode(validateRequirementModel(model), "INVALID_FIELD_CONTRACT");
  }
});

test("requires exactly one standard system identity on every phase-one object", () => {
  const mutations = [
    (object) => {
      object.fields = object.fields.filter(({ id }) => id !== "SUB-F000");
    },
    (object) => {
      delete object.fields.find(({ id }) => id === "SUB-F000").idempotencyRole;
    },
    (object) => {
      object.fields.push({
        ...structuredClone(object.fields.find(({ id }) => id === "SUB-F000")),
        id: "SUB-F004",
      });
    },
    (object) => {
      object.fields.find(({ id }) => id === "SUB-F000").dataType = "STRING";
    },
    (object) => {
      object.fields.find(({ id }) => id === "SUB-F000").valueSource = {
        kind: "USER_INPUT",
      };
    },
    (object) => {
      object.fields.find(({ id }) => id === "SUB-F000").mutability = "EDITABLE";
    },
  ];

  const results = mutations.map((mutate) => {
    const model = validFixture();
    mutate(moduleById(model, "SUB-001").objects[0]);
    return {
      model: errorCodes(validateRequirementModel(model)).includes("INVALID_OBJECT_CONTRACT"),
      structure: errorCodes(prepareRequirementModel(model).errors)
        .includes("INVALID_OBJECT_CONTRACT"),
    };
  });
  assert.deepEqual(results, mutations.map(() => ({ model: true, structure: true })));
});

test("accepts boolean or explicit conditional field required rules", () => {
  for (const required of [true, false, "required when activation mode is FIRST_LOGIN"]) {
    const model = validFixture();
    moduleById(model, "SUB-001").objects[0].fields[0].required = required;

    assert.deepEqual(validateRequirementModel(model), []);
  }
});

test("rejects invalid field required, mutability, and visibility rules", () => {
  const mutations = [
    (field) => { field.required = ""; },
    (field) => { field.required = 1; },
    (field) => { field.mutability = ""; },
    (field) => { field.visibility = ""; },
  ];

  for (const mutate of mutations) {
    const model = validFixture();
    mutate(moduleById(model, "SUB-001").objects[0].fields[0]);

    assertHasCode(validateRequirementModel(model), "INVALID_FIELD_CONTRACT");
  }
});

test("rejects unsupported field contract enum values", () => {
  for (const property of ["dataType", "mutability", "visibility"]) {
    const model = validFixture();
    moduleById(model, "SUB-001").objects[0].fields[0][property] = "BANANA";

    assertHasCode(validateRequirementModel(model), "INVALID_FIELD_CONTRACT");
  }
});

test("rejects missing lifecycle, sensitivity, baseline decision, and NFR references", () => {
  const model = validFixture();
  const module = moduleById(model, "SUB-001");
  module.baselineDecisionIds = ["BASE-MISSING"];
  module.nfrIds = ["NFR-MISSING"];
  module.objects[0].lifecyclePolicyId = "LIFE-MISSING";
  module.objects[0].sensitivityId = "S-MISSING";

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "MISSING_BASELINE_DECISION_REFERENCE");
  assertHasCode(errors, "MISSING_NFR_REFERENCE");
  assertHasCode(errors, "MISSING_LIFECYCLE_REFERENCE");
  assertHasCode(errors, "MISSING_SENSITIVITY_REFERENCE");
});

test("rejects malformed and cross-module relationships", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").relationships.push({
    id: "REL-SUB-HW",
    fromObjectId: "DAT-SUB-01",
    toObjectId: "DAT-HW-01",
    type: "REFERENCES",
    cardinality: "MANY_TO_ONE",
    ownershipScope: "SAME_SCHOOL",
    onSourceInvalidation: "retain accepted historical target version",
  });

  assertHasCode(validateRequirementModel(model), "INVALID_MODULE_OWNERSHIP");

  delete moduleById(model, "SUB-001").relationships[0].cardinality;
  assertHasCode(validateRequirementModel(model), "INVALID_RELATIONSHIP_CONTRACT");
});

test("rejects unsupported relationship type and cardinality values", () => {
  for (const property of ["type", "cardinality"]) {
    const model = validFixture();
    moduleById(model, "SUB-001").relationships.push({
      id: "REL-SUB-SUB",
      fromObjectId: "DAT-SUB-01",
      toObjectId: "DAT-SUB-01",
      type: "REFERENCES",
      cardinality: "ONE_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "retain the accepted target version",
      [property]: "BANANA",
    });

    assertHasCode(validateRequirementModel(model), "INVALID_RELATIONSHIP_CONTRACT");
  }
});

test("rejects missing or unsupported relationship ownership scopes", () => {
  for (const ownershipScope of [undefined, "BANANA"]) {
    const model = validFixture();
    const relationship = {
      id: "REL-SUB-SUB",
      fromObjectId: "DAT-SUB-01",
      toObjectId: "DAT-SUB-01",
      type: "REFERENCES",
      cardinality: "ONE_TO_ONE",
      onSourceInvalidation: "retain accepted source version",
    };
    if (ownershipScope !== undefined) relationship.ownershipScope = ownershipScope;
    moduleById(model, "SUB-001").relationships.push(relationship);

    assertHasCode(validateRequirementModel(model), "INVALID_RELATIONSHIP_CONTRACT");
  }
});

test("validates generic object lineage bindings without Field ID allowlists", () => {
  const validModel = validFixture();
  addLineageBindingFixture(validModel);
  assert.deepEqual(validateRequirementModel(validModel), []);

  const mutations = [
    (model) => {
      delete moduleById(model, "SUB-001").objects[0].fields
        .find(({ id }) => id === "SUB-F003").referenceIntegrity;
    },
    (model) => {
      const object = moduleById(model, "SUB-001").objects[0];
      const field = object.fields.find(({ id }) => id === "SUB-F003");
      delete field.referenceIntegrity;
      delete field.versionBinding;
      delete object.lineageBindings;
    },
    (model) => { delete moduleById(model, "SUB-001").objects[0].lineageBindings; },
    (model) => { moduleById(model, "SUB-001").objects[0].lineageBindings = []; },
    (model) => {
      const object = moduleById(model, "SUB-001").objects[0];
      object.lineageBindings.push(structuredClone(object.lineageBindings[0]));
    },
    (model) => {
      moduleById(model, "SUB-001").objects[0].fields
        .find(({ id }) => id === "SUB-F003").versionBinding.versionFieldId = "SUB-F001";
    },
    (model) => {
      moduleById(model, "SUB-001").objects[0].fields
        .find(({ id }) => id === "SUB-F003").versionBinding.targetVersionFieldId = "HW-F999";
    },
    (model) => {
      delete moduleById(model, "SUB-001").objects[0].fields
        .find(({ id }) => id === "SUB-F003").versionBinding;
    },
    (model) => { moduleById(model, "SUB-001").objects[0].lineageBindings[0].legacy = true; },
    (model) => { moduleById(model, "SUB-001").objects[0].lineageBindings[0].refFieldId = "SUB-F001"; },
    (model) => { moduleById(model, "SUB-001").objects[0].lineageBindings[0].versionFieldId = "HW-F001"; },
    (model) => { moduleById(model, "SUB-001").objects[0].lineageBindings[0].targetObjectId = "DAT-MISSING"; },
    (model) => { moduleById(model, "SUB-001").objects[0].lineageBindings[0].targetVersionFieldId = "SUB-F002"; },
    (model) => {
      moduleById(model, "SUB-001").objects[0].fields
        .find(({ id }) => id === "SUB-F003").valueSource.targetObjectId = "DAT-SUB-01";
    },
  ];

  for (const mutate of mutations) {
    const model = validFixture();
    addLineageBindingFixture(model);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_LINEAGE_BINDING");
  }
});

test("enforces identity-only object references without lineage containers", () => {
  const validModel = validFixture();
  const object = moduleById(validModel, "SUB-001").objects[0];
  const field = object.fields.find(({ id }) => id === "SUB-F001");
  Object.assign(field, {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "DAT-HW-01" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
  });
  assert.deepEqual(validateRequirementModel(validModel), []);

  const mutations = [
    (identityField, identityObject) => { delete identityField.referenceIntegrity; },
    (identityField) => { identityField.referenceIntegrity = "LEGACY"; },
    (identityField) => {
      identityField.versionBinding = {
        versionFieldId: "SUB-F002",
        targetVersionFieldId: "HW-F001",
      };
    },
    (_identityField, identityObject) => {
      identityObject.lineageBindings = [{
        refFieldId: "SUB-F001",
        versionFieldId: "SUB-F002",
        targetObjectId: "DAT-HW-01",
        targetVersionFieldId: "HW-F001",
      }];
    },
  ];

  for (const mutate of mutations) {
    const model = structuredClone(validModel);
    const identityObject = moduleById(model, "SUB-001").objects[0];
    const identityField = identityObject.fields.find(({ id }) => id === "SUB-F001");
    mutate(identityField, identityObject);
    assertHasCode(validateRequirementModel(model), "INVALID_LINEAGE_BINDING");
  }
});

test("requires object-reference integrity during structural preparation in every phase", () => {
  const model = validFixture();
  const reportField = moduleById(model, "REPORT-001").objects[0].fields[0];
  Object.assign(reportField, {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "DAT-HW-01" },
    mutability: "IMMUTABLE",
  });

  assertHasCode(prepareRequirementModel(model).errors, "INVALID_LINEAGE_BINDING");
});

test("covers every GRD and PUB versioned reference with one field-declared lineage binding", () => {
  const expectedRefs = new Map([
    ["GRD-OBJ-DECISION", [
      "GRD-DECISION-F-SUBMISSION-REF",
      "GRD-DECISION-F-ITEM-REF",
      "GRD-DECISION-F-RUBRIC-REF",
      "GRD-DECISION-F-CAPABILITY-RULE-REF",
    ]],
    ["PUB-OBJ-RESULT", [
      "PUB-RESULT-F-SOURCE-DECISION-REF",
      "PUB-RESULT-F-CORRECTION-DECISION-REF",
    ]],
  ]);

  for (const moduleId of ["GRD-001", "PUB-001"]) {
    for (const object of moduleById(requirementModel, moduleId).objects) {
      if (!expectedRefs.has(object.id)) continue;
      const markedRefs = object.fields
        .filter(({ referenceIntegrity }) => referenceIntegrity === "VERSION_PINNED")
        .map(({ id }) => id)
        .sort();
      assert.deepEqual(markedRefs, expectedRefs.get(object.id).toSorted(), object.id);
      const bindingRefs = object.lineageBindings.map(({ refFieldId }) => refFieldId).sort();
      assert.deepEqual(bindingRefs, markedRefs, object.id);
    }
  }
});

test("classifies every phase-one object reference with a closed integrity mode", () => {
  const objectRefs = modules.flatMap((module) => module.objects.flatMap((object) => (
    object.fields
      .filter(({ valueSource }) => valueSource?.kind === "OBJECT_REF")
      .map((field) => ({ module, object, field }))
  )));
  assert.equal(objectRefs.length, 11);
  assert.equal(objectRefs.filter(({ field }) => (
    field.referenceIntegrity === "VERSION_PINNED"
  )).length, 6);
  assert.equal(objectRefs.filter(({ field }) => (
    field.referenceIntegrity === "IDENTITY_ONLY"
  )).length, 5);

  const missingPinnedBinding = structuredClone(requirementModel);
  const gradingDecision = moduleById(missingPinnedBinding, "GRD-001").objects
    .find(({ id }) => id === "GRD-OBJ-DECISION");
  const submissionRef = gradingDecision.fields
    .find(({ id }) => id === "GRD-DECISION-F-SUBMISSION-REF");
  delete submissionRef.versionBinding;
  gradingDecision.lineageBindings = gradingDecision.lineageBindings
    .filter(({ refFieldId }) => refFieldId !== submissionRef.id);
  assertHasCode(validateRequirementModel(missingPinnedBinding), "INVALID_LINEAGE_BINDING");

  for (const { module, object, field } of objectRefs) {
    const model = structuredClone(requirementModel);
    const mutatedObject = moduleById(model, module.id).objects
      .find(({ id }) => id === object.id);
    delete mutatedObject.fields.find(({ id }) => id === field.id).referenceIntegrity;
    assertHasCode(validateRequirementModel(model), "INVALID_LINEAGE_BINDING");
  }
});

test("validates structured own-record read policies and time-gated outputs", () => {
  const validModel = validFixture();
  addReadPolicyFixture(validModel);
  assert.deepEqual(validateRequirementModel(validModel), []);

  const mutations = [
    (model) => { delete moduleById(model, "SUB-001").objects[0].readMode; },
    (model) => { moduleById(model, "SUB-001").objects[0].readMode = "AUTHORIZED"; },
    (model) => {
      const object = moduleById(model, "SUB-001").objects[0];
      delete object.fields.find(({ id }) => id === "SUB-F001").releaseRequirement;
      delete object.readPolicies;
    },
    (model) => { delete moduleById(model, "SUB-001").objects[0].readPolicies; },
    (model) => { moduleById(model, "SUB-001").objects[0].readPolicies = []; },
    (model) => { moduleById(model, "SUB-001").objects[0].readPolicies[0].legacy = true; },
    (model) => { moduleById(model, "SUB-001").objects[0].readPolicies[0].subject.dutyRef = "DUTY-SUBJECT-TEACHER"; },
    (model) => { moduleById(model, "SUB-001").objects[0].readPolicies[0].scope.kind = "ALL_RECORDS"; },
    (model) => { moduleById(model, "SUB-001").objects[0].readPolicies[0].actionId = "SUB-ACT-01"; },
    (model) => { moduleById(model, "SUB-001").objects[0].readPolicies[0].subject = { roleRef: "ROLE-TEACHER" }; },
    (model) => { moduleById(model, "SUB-001").objects[0].readPolicies[0].requiredState = "DRAFT"; },
    (model) => { moduleById(model, "SUB-001").objects[0].readPolicies[0].scope.subjectFieldId = "HW-F001"; },
    (model) => { moduleById(model, "SUB-001").objects[0].readPolicies[0].timeGates[0].visibleAtFieldId = "SUB-F002"; },
    (model) => { moduleById(model, "SUB-001").objects[0].readPolicies[0].timeGates[0].protectedFieldIds = ["SUB-F002"]; },
    (model) => { moduleById(model, "SUB-001").objects[0].readPolicies[0].timeGates[0].protectedFieldIds = ["SUB-F001", "SUB-F001"]; },
    (model) => {
      const policy = moduleById(model, "SUB-001").objects[0].readPolicies[0];
      policy.timeGates.push(structuredClone(policy.timeGates[0]));
    },
    (model) => { moduleById(model, "SUB-001").objects[0].readPolicies[0].timeGates[0].legacy = true; },
    (model) => {
      moduleById(model, "SUB-001").objects[0].fields
        .find(({ id }) => id === "SUB-F003").dataType = "INTEGER";
    },
    (model) => {
      moduleById(model, "SUB-001").objects[0].fields
        .find(({ id }) => id === "SUB-F001").releaseRequirement.readPolicyId = "SUB-RP-MISSING";
    },
    (model) => {
      delete moduleById(model, "SUB-001").objects[0].fields
        .find(({ id }) => id === "SUB-F001").releaseRequirement;
    },
    (model) => { moduleById(model, "SUB-001").pages[0].fieldIds = []; },
    (model) => { moduleById(model, "SUB-001").pages[0].fieldIds.push("SUB-F004"); },
    (model) => { moduleById(model, "SUB-001").actions.find(({ id }) => id === "SUB-ACT-READ").outputFieldIds.pop(); },
    (model) => { moduleById(model, "SUB-001").actions.find(({ id }) => id === "SUB-ACT-READ").outputFieldIds.push("SUB-F004"); },
    (model) => {
      const module = moduleById(model, "SUB-001");
      module.actions = module.actions.filter(({ id }) => id !== "SUB-ACT-READ");
    },
    (model) => { moduleById(model, "SUB-001").pages = []; },
    (model) => {
      moduleById(model, "SUB-001").actions.find(({ id }) => id === "SUB-ACT-READ")
        .permissions.push({
          effect: "ALLOW",
          roleRef: "ROLE-TEACHER",
          condition: "the teacher reads the student result",
        });
    },
    (model) => {
      moduleById(model, "SUB-001").actions.find(({ id }) => id === "SUB-ACT-READ")
        .permissions.push({
          effect: "ALLOW",
          roleRef: "ROLE-PLATFORM-OPS",
          condition: "platform operations reads the student result",
        });
    },
    (model) => {
      moduleById(model, "SUB-001").actions.find(({ id }) => id === "SUB-ACT-READ")
        .permissions.push({
          effect: "ALLOW",
          actorRef: "SYSTEM",
          condition: "the system reads through the student action",
        });
    },
    (model) => {
      moduleById(model, "SUB-001").actions.find(({ id }) => id === "SUB-ACT-READ")
        .permissions.push({
          effect: "DENY",
          roleRef: "ROLE-STUDENT",
          condition: "the student is denied by a conflicting rule",
        });
    },
  ];

  for (const mutate of mutations) {
    const model = validFixture();
    addReadPolicyFixture(model);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_READ_POLICY");
  }
});

test("rejects incomplete action execution contracts", () => {
  const properties = [
    ["label", "INVALID_ACTION_CONTRACT"],
    ["targetObjectId", "INVALID_ACTION_CONTRACT"],
    ["inputFieldIds", "INVALID_ACTION_CONTRACT"],
    ["outputFieldIds", "INVALID_ACTION_CONTRACT"],
    ["operationKind", "INVALID_ACTION_CONTRACT"],
    ["writes", "INVALID_ACTION_CONTRACT"],
    ["risk", "INVALID_ACTION_CONTRACT"],
    ["executionMode", "INVALID_ACTION_CONTRACT"],
    ["clients", "INVALID_ACTION_CONTRACT"],
    ["permissions", "INVALID_ACTION_CONTRACT"],
    ["scenarioIds", "INVALID_ACTION_CONTRACT"],
    ["auditMode", "INVALID_AUDIT_MODE"],
    ["failureResults", "INVALID_ACTION_CONTRACT"],
  ];
  for (const [property, errorCode] of properties) {
    const model = validFixture();
    delete moduleById(model, "SUB-001").actions[0][property];

    assertHasCode(validateRequirementModel(model), errorCode);
  }
});

test("requires write idempotency and validates action clients, risk, audit, and failures", () => {
  const mutations = [
    [(action) => { delete action.idempotencyKey; }, "INVALID_ACTION_CONTRACT"],
    [(action) => { action.clients = ["CLI"]; }, "INVALID_ACTION_CONTRACT"],
    [(action) => { action.risk = "CRITICAL"; }, "INVALID_ACTION_CONTRACT"],
    [(action) => { action.auditMode = "SOMETIMES"; }, "INVALID_AUDIT_MODE"],
    [(action) => { action.failureResults = []; }, "INVALID_ACTION_CONTRACT"],
  ];

  for (const [mutate, errorCode] of mutations) {
    const model = validFixture();
    mutate(moduleById(model, "SUB-001").actions[0]);

    assertHasCode(validateRequirementModel(model), errorCode);
  }
});

test("enforces READ CREATE and UPDATE operation contracts without action allowlists", () => {
  const mutations = [
    [(action) => { action.operationKind = "UPSERT"; }],
    [(action) => { action.operationKind = "READ"; }],
    [(action) => {
      action.operationKind = "READ";
      action.writes = false;
      action.risk = RISK.READ;
      action.auditMode = "NOT_REQUIRED";
      delete action.idempotencyKey;
      delete action.transition;
    }],
    [(action) => {
      action.operationKind = "CREATE";
      delete action.transition;
    }, (model) => {
      successScenario(model).then.expectedState = { mode: "UNCHANGED" };
    }],
    [(action) => {
      action.operationKind = "CREATE";
    }],
    [(action) => {
      action.operationKind = "UPDATE";
      delete action.transition;
    }],
    [(action) => {
      action.operationKind = "UPDATE";
      action.writes = false;
    }],
  ];

  for (const [mutateAction, mutateModel] of mutations) {
    const model = validFixture();
    mutateAction(moduleById(model, "SUB-001").actions[0]);
    mutateModel?.(model);

    assertHasCode(validateRequirementModel(model), "INVALID_ACTION_OPERATION");
  }

  const statePreservingUpdate = validFixture();
  const action = moduleById(statePreservingUpdate, "SUB-001").actions[0];
  action.transition = { from: "DRAFT", to: "DRAFT" };
  successScenario(statePreservingUpdate).then.expectedState = { mode: "STATE", value: "DRAFT" };
  assertNoCode(validateRequirementModel(statePreservingUpdate), "INVALID_ACTION_OPERATION");
});

test("rejects CREATE actions whose generic command semantics also express updates", () => {
  const mixedCommandNames = [
    "Create or Update a Record",
    "Maintain the Record Catalog",
    "Save Record Preferences",
    "Create or Reorder Record Items",
    "Upsert a Record",
    "Merge Record Changes",
    "合并写入记录",
    "存在则更新记录",
  ];

  for (const label of mixedCommandNames) {
    const model = validFixture();
    const action = moduleById(model, "SUB-001").actions[0];
    action.label = label;
    action.id = "SUB-ACT-CREATE-RECORD";
    action.operationKind = "CREATE";
    delete action.transition;
    action.outputFieldIds = ["SUB-F000", "SUB-F001", "SUB-F002"];
    for (const scenario of moduleById(model, "SUB-001").scenarios) {
      scenario.actionId = action.id;
    }
    action.scenarioIds = moduleById(model, "SUB-001").scenarios.map(({ id }) => id);
    moduleById(model, "SUB-001").pages[0].actionIds = [action.id];
    model.flows[0].steps[0].actionId = action.id;

    assertHasCode(validateRequirementModel(model), "INVALID_ACTION_OPERATION");
  }
});

test("uses task-specific CREATE and UPDATE actions for every mixed command surface", () => {
  const mixedCreatePattern = /(?:\bupdate\b|\bmaintain\b|\bsave\b|\breorder\b|\bupsert\b|\bmerge\b|(?:^|-)manage(?:-|$)|合并写入|存在则更新)/i;
  const mixedCreates = modules.flatMap((module) => (
    module.actions
      .filter(({ operationKind, id, label }) => (
        operationKind === "CREATE" && mixedCreatePattern.test(`${id} ${label}`)
      ))
      .map(({ id }) => `${module.id}:${id}`)
  ));
  assert.deepEqual(mixedCreates, []);
  assert.equal(modules.flatMap(({ actions }) => actions)
    .filter(({ operationKind }) => operationKind === "CREATE").length, 34);

  const requiredPairs = [
    ["ORG-001", "ORG-ACT-CREATE-GRADE", "ORG-ACT-UPDATE-GRADE"],
    ["ORG-001", "ORG-ACT-CREATE-CLASS", "ORG-ACT-UPDATE-CLASS"],
    ["ORG-001", "ORG-ACT-CREATE-SUBJECT", "ORG-ACT-UPDATE-SUBJECT"],
    ["ORG-001", "ORG-ACT-CREATE-COURSE", "ORG-ACT-UPDATE-COURSE"],
    ["ORG-001", "ORG-ACT-CREATE-TEACHER", "ORG-ACT-UPDATE-TEACHER"],
    ["ORG-001", "ORG-ACT-CREATE-STUDENT", "ORG-ACT-UPDATE-STUDENT"],
    ["CURR-001", "CURR-ACT-CREATE-CHAPTER", "CURR-ACT-REORDER-CHAPTER"],
    ["TEA-001", "TEA-ACT-CREATE-PREFERENCE", "TEA-ACT-UPDATE-PREFERENCE"],
  ];
  for (const [moduleId, createActionId, updateActionId] of requiredPairs) {
    const actionById = new Map(moduleById(requirementModel, moduleId).actions
      .map((action) => [action.id, action]));
    assert.equal(actionById.get(createActionId)?.operationKind, "CREATE", createActionId);
    assert.equal(actionById.get(updateActionId)?.operationKind, "UPDATE", updateActionId);
  }
});

test("requires CREATE actions to receive target identity only as a system output", () => {
  const validModel = validFixture();
  const action = moduleById(validModel, "SUB-001").actions[0];
  action.operationKind = "CREATE";
  delete action.transition;
  action.outputFieldIds = ["SUB-F000", "SUB-F001", "SUB-F002"];
  assertNoCode(validateRequirementModel(validModel), "INVALID_ACTION_OPERATION");

  const mutations = [
    (createAction) => { createAction.inputFieldIds.push("SUB-F000"); },
    (createAction) => {
      createAction.outputFieldIds = createAction.outputFieldIds
        .filter((fieldId) => fieldId !== "SUB-F000");
    },
  ];
  for (const mutate of mutations) {
    const model = structuredClone(validModel);
    mutate(moduleById(model, "SUB-001").actions[0]);
    assertHasCode(validateRequirementModel(model), "INVALID_ACTION_OPERATION");
  }

  const missingIdentityModel = structuredClone(validModel);
  const missingIdentityObject = moduleById(missingIdentityModel, "SUB-001").objects[0];
  const missingIdentityAction = moduleById(missingIdentityModel, "SUB-001").actions[0];
  delete missingIdentityObject.fields
    .find(({ id }) => id === "SUB-F000").idempotencyRole;
  missingIdentityAction.outputFieldIds = missingIdentityAction.outputFieldIds
    .filter((fieldId) => fieldId !== "SUB-F000");
  assertHasCode(
    validateRequirementModel(missingIdentityModel),
    "INVALID_ACTION_OPERATION",
  );
});

test("rejects ORG CREATE identity input output and marker-output bypasses", () => {
  const mutations = [
    (_gradeId, createGrade) => { createGrade.inputFieldIds.push("ORG-GRADE-F-ID"); },
    (_gradeId, createGrade) => {
      createGrade.outputFieldIds = createGrade.outputFieldIds
        .filter((fieldId) => fieldId !== "ORG-GRADE-F-ID");
    },
    (gradeId, createGrade) => {
      delete gradeId.idempotencyRole;
      createGrade.outputFieldIds = createGrade.outputFieldIds
        .filter((fieldId) => fieldId !== "ORG-GRADE-F-ID");
    },
  ];
  const results = mutations.map((mutate) => {
    const model = structuredClone(requirementModel);
    const organization = moduleById(model, "ORG-001");
    const gradeId = organization.objects.find(({ id }) => id === "ORG-OBJ-GRADE")
      .fields.find(({ id }) => id === "ORG-GRADE-F-ID");
    const createGrade = organization.actions
      .find(({ id }) => id === "ORG-ACT-CREATE-GRADE");
    mutate(gradeId, createGrade);
    return errorCodes(validateRequirementModel(model)).includes("INVALID_ACTION_OPERATION");
  });
  assert.deepEqual(results, mutations.map(() => true));
});

test("covers target identity input and output for every CREATE action", () => {
  const violations = modules.flatMap((module) => module.actions
    .filter(({ operationKind }) => operationKind === "CREATE")
    .flatMap((createAction) => {
      const targetObject = module.objects.find(({ id }) => id === createAction.targetObjectId);
      const identityFieldIds = targetObject?.fields
        .filter(({ idempotencyRole }) => idempotencyRole === "OBJECT_ID")
        .map(({ id }) => id) ?? [];
      if (identityFieldIds.length !== 1) {
        return [`${module.id}:${createAction.id}:identity-count=${identityFieldIds.length}`];
      }
      return identityFieldIds.filter((fieldId) => (
        createAction.inputFieldIds.includes(fieldId)
        || !createAction.outputFieldIds.includes(fieldId)
      ))
        .map((fieldId) => `${module.id}:${createAction.id}:${fieldId}`);
    }));
  assert.deepEqual(violations, []);
});

test("requires fail-closed audit behavior for high-risk actions", () => {
  const mutations = [
    [(action) => { action.auditMode = "NOT_REQUIRED"; }, "INVALID_AUDIT_MODE"],
    [(action) => { action.failureResults = ["PERMISSION_DENIED"]; }, "INVALID_ACTION_CONTRACT"],
  ];

  for (const [mutate, errorCode] of mutations) {
    const model = validFixture();
    const action = moduleById(model, "SUB-001").actions[0];
    action.risk = RISK.HIGH;
    action.failureResults.push("AUDIT_FAILED");
    mutate(action);

    assertHasCode(validateRequirementModel(model), errorCode);
  }
});

test("rejects unknown action permission effects", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").actions[0].permissions.push({
    effect: "CONDITIONAL",
    roleRef: "ROLE-STUDENT",
  });

  assertHasCode(validateRequirementModel(model), "INVALID_ACTION_CONTRACT");
});

test("rejects action permissions without an explicit boundary condition", () => {
  const model = validFixture();
  delete moduleById(model, "SUB-001").actions[0].permissions[0].condition;

  assertHasCode(validateRequirementModel(model), "INVALID_ACTION_CONTRACT");
});

test("rejects incomplete, unknown, and duplicate failure-result scenario coverage", () => {
  const mutations = [
    (module) => {
      delete module.scenarios[1].resultCode;
    },
    (module) => {
      module.scenarios[1].resultCode = "UNKNOWN_FAILURE";
    },
    (module) => {
      module.scenarios[2].resultCode = "PERMISSION_DENIED";
    },
  ];

  for (const mutate of mutations) {
    const model = validFixture();
    mutate(moduleById(model, "SUB-001"));

    assertHasCode(
      validateRequirementModel(model),
      "INVALID_FAILURE_RESULT_COVERAGE",
    );
  }
});

test("accepts non-user actions with verified triggers and no client or page exposure", () => {
  const eventModel = nonUserActionFixture("SYSTEM_EVENT", {
    kind: "EVENT",
    eventId: "EVT-TEST-START",
  });
  eventModel.events[0].triggeredActionIds = ["SUB-ACT-01"];
  assert.deepEqual(validateRequirementModel(eventModel), []);

  const flowModel = nonUserActionFixture("FLOW_INTERNAL", {
    kind: "FLOW",
    flowIds: ["DF-TEST"],
  });
  assert.deepEqual(validateRequirementModel(flowModel), []);
});

test("rejects non-user triggers without reverse event or Flow consistency", () => {
  const eventModel = nonUserActionFixture("SYSTEM_EVENT", {
    kind: "EVENT",
    eventId: "EVT-TEST-START",
  });
  eventModel.events[0].triggeredActionIds = [];
  assertHasCode(validateRequirementModel(eventModel), "INVALID_ACTION_TRIGGER");

  const flowModel = nonUserActionFixture("FLOW_INTERNAL", {
    kind: "FLOW",
    flowIds: ["DF-TEST"],
  });
  flowModel.flows[0].steps[0].actionId = "ACTION-MISSING";
  assertHasCode(validateRequirementModel(flowModel), "INVALID_ACTION_TRIGGER");
});

test("rejects non-user actions without a SYSTEM allow subject", () => {
  const model = nonUserActionFixture("SYSTEM_EVENT", {
    kind: "EVENT",
    eventId: "EVT-TEST-START",
  });
  model.events[0].triggeredActionIds = ["SUB-ACT-01"];
  moduleById(model, "SUB-001").actions[0].permissions[0] = {
    effect: "ALLOW",
    roleRef: "ROLE-STUDENT",
    condition: "a user attempts to invoke a system event",
  };

  assertHasCode(validateRequirementModel(model), "INVALID_PERMISSION_SUBJECT");
});

test("rejects USER_TASK actions whose ALLOW subjects are not users", () => {
  for (const actorRef of ["SYSTEM", "AI"]) {
    const model = validFixture();
    moduleById(model, "SUB-001").actions[0].permissions = [
      {
        effect: "ALLOW",
        actorRef,
        condition: "the platform attempts to execute a user task",
      },
      {
        effect: "DENY",
        roleRef: "ROLE-TEACHER",
        condition: "outside assigned scope",
      },
    ];

    assertHasCode(validateRequirementModel(model), "INVALID_PERMISSION_SUBJECT");
  }
});

test("accepts every supported user ALLOW subject for USER_TASK actions", () => {
  const models = [
    validFixture(),
    validFixture(),
    validFixture(),
    validFixture(),
  ];
  moduleById(models[1], "SUB-001").actions[0].permissions[0] = {
    effect: "ALLOW",
    actorRef: "CURRENT_ACTOR",
    condition: "the current actor owns the target object",
  };
  models[2].duties.push({
    id: "DUTY-FIXTURE",
    roleId: "ROLE-TEACHER",
    label: "fixture duty",
  });
  moduleById(models[2], "SUB-001").actions[0].permissions[0] = {
    effect: "ALLOW",
    dutyRef: "DUTY-FIXTURE",
    condition: "the assigned duty may execute the task",
  };
  moduleById(models[3], "SUB-001").actions[0].permissions.unshift({
    effect: "ALLOW",
    actorRef: "SYSTEM",
    condition: "the platform may assist the user task",
  });

  for (const model of models) {
    assert.deepEqual(validateRequirementModel(model), []);
  }
});

test("rejects legacy audit fields and atomic self-recording outside an audit sink", () => {
  const legacyModel = validFixture();
  moduleById(legacyModel, "SUB-001").actions[0].auditRequired = true;
  assertHasCode(validateRequirementModel(legacyModel), "INVALID_AUDIT_MODE");

  const atomicModel = nonUserActionFixture("SYSTEM_EVENT", {
    kind: "EVENT",
    eventId: "EVT-TEST-START",
  });
  atomicModel.events[0].triggeredActionIds = ["SUB-ACT-01"];
  moduleById(atomicModel, "SUB-001").actions[0].auditMode = "ATOMIC_SELF_RECORD";
  assertHasCode(validateRequirementModel(atomicModel), "INVALID_AUDIT_MODE");

  const readOnlyAtomicModel = structuredClone(requirementModel);
  const appendAudit = moduleById(readOnlyAtomicModel, "AUD-001").actions
    .find(({ id }) => id === "AUD-ACT-APPEND-EVENT");
  appendAudit.writes = false;
  delete appendAudit.idempotencyKey;
  assertHasCode(validateRequirementModel(readOnlyAtomicModel), "INVALID_AUDIT_MODE");
});

test("rejects incomplete page, scenario, and Flow contracts", () => {
  const model = validFixture();
  const module = moduleById(model, "SUB-001");
  module.pages.push(validPage(
    "SUB-W01",
    { objectId: "DAT-SUB-01" },
    ["SUB-F001"],
    ["SUB-ACT-01"],
  ));

  for (const property of ["label", "clients", "regions", "viewStates"]) {
    const candidate = structuredClone(model);
    delete moduleById(candidate, "SUB-001").pages[0][property];
    assertHasCode(validateRequirementModel(candidate), "INVALID_PAGE_CONTRACT");
  }

  for (const property of ["kind", "actionId", "pageId", "given", "when", "then"]) {
    const candidate = structuredClone(model);
    delete moduleById(candidate, "SUB-001").scenarios[0][property];
    assertHasCode(validateRequirementModel(candidate), "INVALID_SCENARIO_CONTRACT");
  }

  for (const property of [
    "label",
    "phase",
    "moduleIds",
    "steps",
    "sourceDataRefs",
    "targetDataRefs",
    "idempotencyKeyParts",
    "failureGranularity",
    "retryPolicy",
    "compensation",
    "downstreamInvalidation",
  ]) {
    const candidate = structuredClone(model);
    delete candidate.flows[0][property];
    assertHasCode(validateRequirementModel(candidate), "INVALID_FLOW_CONTRACT");
  }
});

test("rejects scenario pages that are missing, cross-module, or do not expose the action", () => {
  const mutations = [
    (model) => { moduleById(model, "SUB-001").scenarios[0].pageId = "PAGE-MISSING"; },
    (model) => {
      moduleById(model, "HW-001").pages.push(validPage(
        "HW-PAGE-01",
        { objectId: "DAT-HW-01" },
        ["HW-F001"],
        [],
      ));
      moduleById(model, "SUB-001").scenarios[0].pageId = "HW-PAGE-01";
    },
    (model) => {
      moduleById(model, "SUB-001").pages.push(validPage(
        "SUB-PAGE-NO-ACTION",
        { objectId: "DAT-SUB-01" },
        ["SUB-F001"],
        [],
      ));
      moduleById(model, "SUB-001").scenarios[0].pageId = "SUB-PAGE-NO-ACTION";
    },
  ];

  for (const mutate of mutations) {
    const model = validFixture();
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_SCENARIO_PAGE");
  }
});

test("rejects malformed or impossible scenario expected states", () => {
  const expectedStates = [
    "SUBMITTED",
    { mode: "STATE" },
    { mode: "STATE", value: "ARCHIVED" },
    { mode: "UNCHANGED", value: "DRAFT" },
    { mode: "SOMETHING_ELSE" },
  ];
  for (const expectedState of expectedStates) {
    const model = validFixture();
    moduleById(model, "SUB-001").scenarios[0].then.expectedState = expectedState;
    assertHasCode(validateRequirementModel(model), "INVALID_SCENARIO_STATE");
  }
});

test("accepts STATE and UNCHANGED scenario state outcomes", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").scenarios[0].then.expectedState = {
    mode: "STATE",
    value: "SUBMITTED",
  };
  moduleById(model, "SUB-001").scenarios[1].then.expectedState = {
    mode: "UNCHANGED",
  };

  assert.deepEqual(validateRequirementModel(model), []);
});

test("rejects write actions whose success scenario claims no state effect", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").scenarios[0].then.expectedState = {
    mode: "UNCHANGED",
  };

  assertHasCode(validateRequirementModel(model), "MISSING_ACTION_STATE_EFFECT");
});

test("rejects success scenario states that contradict the action transition", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").scenarios[0].then.expectedState = {
    mode: "STATE",
    value: "DRAFT",
  };

  assertHasCode(validateRequirementModel(model), "SCENARIO_TRANSITION_MISMATCH");
});

test("accepts a CREATE action with an explicit success state and no transition", () => {
  const model = validFixture();
  const action = moduleById(model, "SUB-001").actions[0];
  action.operationKind = "CREATE";
  action.outputFieldIds.push("SUB-F000");
  delete action.transition;

  assert.deepEqual(validateRequirementModel(model), []);
});

test("rejects empty optional Flow step conditions", () => {
  const model = validFixture();
  model.flows[0].steps[0].condition = "";

  assertHasCode(validateRequirementModel(model), "INVALID_FLOW_CONTRACT");
});

test("rejects invalid Flow data references, ordering, and participant symmetry", () => {
  const mutations = [
    (flow) => { flow.steps[0].order = 2; },
    (flow) => { flow.sourceDataRefs[0].objectId = "DAT-MISSING"; },
    (flow) => { flow.targetDataRefs[0].fieldId = "FIELD-MISSING"; },
    (flow) => { flow.sourceDataRefs[0].version = ""; },
    (flow) => { flow.moduleIds = ["SUB-001", "HW-001"]; },
  ];

  for (const mutate of mutations) {
    const model = validFixture();
    mutate(model.flows[0]);
    const errors = validateRequirementModel(model);
    assert.ok(
      ["INVALID_FLOW_CONTRACT", "MISSING_FLOW_DATA_REFERENCE", "FLOW_PARTICIPANT_MISMATCH"]
        .some((code) => errorCodes(errors).includes(code)),
      errors.join("\n"),
    );
  }
});

test("rejects invalid Flow versions outputs retries and idempotency parts", () => {
  const mutations = [
    ["missing version field", "INVALID_FLOW_VERSION_REFERENCE", (model) => {
      model.flows[0].sourceDataRefs[0].version = "SUB-F999";
    }],
    ["cross-object version field", "INVALID_FLOW_VERSION_REFERENCE", (model) => {
      model.flows[0].sourceDataRefs[0].version = "HW-F001";
    }],
    ["target not produced", "INVALID_FLOW_TARGET_OUTPUT", (model) => {
      moduleById(model, "SUB-001").actions[0].outputFieldIds = ["SUB-F002"];
    }],
    ["unknown retry result", "INVALID_FLOW_RETRY_RESULT", (model) => {
      model.flows[0].retryPolicy.retryableFailureResults.push("TRANSIENT_FAILURE");
    }],
    ["identity is not a source field", "INVALID_FLOW_IDEMPOTENCY", (model) => {
      model.flows[0].idempotencyKeyParts.identityFieldIds = ["SUB-F002"];
    }],
    ["version coverage is weak", "INVALID_FLOW_IDEMPOTENCY", (model) => {
      model.flows[0].idempotencyKeyParts.versionFieldIds.push("SUB-F001");
    }],
    ["fanout is not a source field", "INVALID_FLOW_IDEMPOTENCY", (model) => {
      model.flows[0].idempotencyKeyParts.fanoutFieldId = "SUB-F002";
    }],
    ["unknown idempotency part", "INVALID_FLOW_CONTRACT", (model) => {
      model.flows[0].idempotencyKeyParts.requestFieldId = "SUB-F001";
    }],
    ["legacy free-text key", "INVALID_FLOW_CONTRACT", (model) => {
      model.flows[0].idempotencyKey = "weak-free-text-key";
    }],
  ];

  const missedMutations = [];
  for (const [name, errorCode, mutate] of mutations) {
    const model = validFixture();
    mutate(model);
    const errors = validateRequirementModel(model);
    if (!errors.some((error) => error.startsWith(errorCode))) {
      missedMutations.push(name);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("requires stable business-key roles for Flow identity and fanout fields", () => {
  const stableModel = validFixture();
  const stableField = moduleById(stableModel, "SUB-001").objects[0].fields
    .find(({ id }) => id === "SUB-F000");
  assert.deepEqual(validateRequirementModel(stableModel), []);

  const mutations = [
    ["missing role", (field) => { delete field.idempotencyRole; }],
    ["prompt value", (field) => {
      field.dataType = "TEXT";
      field.idempotencyRole = "OBJECT_ID";
    }],
    ["due time", (field) => {
      field.dataType = "DATETIME";
      field.idempotencyRole = "OBJECT_ID";
    }],
    ["score value", (field) => {
      field.dataType = "DECIMAL";
      field.idempotencyRole = "OBJECT_ID";
    }],
    ["status value", (field) => {
      field.valueSource = { kind: "OPTION_SET", optionSetId: "OPT-BOOL" };
      field.idempotencyRole = "OBJECT_ID";
    }],
    ["mutable object ID", (field) => { field.mutability = "EDITABLE"; }],
    ["fanout-only identity", (field) => { field.idempotencyRole = "FANOUT_SET"; }],
    ["object reference without a target", (field) => {
      field.idempotencyRole = "OBJECT_REF";
      field.valueSource = { kind: "SYSTEM" };
    }],
  ];

  const missedMutations = [];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(stableModel);
    const field = moduleById(model, "SUB-001").objects[0].fields
      .find(({ id }) => id === "SUB-F000");
    mutate(field);
    if (!errorCodes(validateRequirementModel(model)).includes("INVALID_FLOW_IDEMPOTENCY")) {
      missedMutations.push(name);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("uses stable object identities and fanout sets in every executable Flow key", () => {
  const fieldById = new Map(modules.flatMap((module) => (
    module.objects.flatMap((object) => object.fields.map((field) => [field.id, field]))
  )));
  const unstableKeys = [];

  for (const flow of flows) {
    for (const fieldId of flow.idempotencyKeyParts.identityFieldIds) {
      const fieldRole = fieldById.get(fieldId)?.idempotencyRole;
      if (!["OBJECT_ID", "OBJECT_REF"].includes(fieldRole)) {
        unstableKeys.push(`${flow.id}:identity:${fieldId}`);
      }
    }
    const fanoutFieldId = flow.idempotencyKeyParts.fanoutFieldId;
    const fanoutRole = fieldById.get(fanoutFieldId)?.idempotencyRole;
    if (!["OBJECT_ID", "OBJECT_REF", "FANOUT_SET"].includes(fanoutRole)) {
      unstableKeys.push(`${flow.id}:fanout:${fanoutFieldId}`);
    }
  }

  assert.deepEqual(unstableKeys, []);
});

test("rejects a Flow whose data-reference modules differ from declared participants", () => {
  const model = validFixture();
  model.flows[0].sourceDataRefs = [{
    objectId: "DAT-HW-01",
    fieldId: "HW-F001",
    version: "CURRENT",
  }];

  assertHasCode(validateRequirementModel(model), "FLOW_DATA_PARTICIPANT_MISMATCH");
});

test("rejects a Flow phase that differs from its participant modules", () => {
  const model = validFixture();
  model.flows[0].phase = PHASE.SECOND;

  assertHasCode(validateRequirementModel(model), "FLOW_PHASE_MISMATCH");
});

test("rejects null and non-object requirement models", () => {
  for (const model of [null, 42, "requirement model"]) {
    assert.deepEqual(validateRequirementModel(model), [
      "INVALID_MODEL requirement model must be an object",
    ]);
  }
});

test("rejects missing required top-level collections", () => {
  assert.deepEqual(
    validateRequirementModel({}),
    REQUIRED_COLLECTION_NAMES
      .map((name) => `MISSING_MODEL_COLLECTION ${name} must be an array`)
      .sort(),
  );
});

test("publishes one frozen manifest for required top-level collections", () => {
  const expected = [
    { key: "baselineDecisions", label: "baseline decision" },
    { key: "roles", label: "role" },
    { key: "duties", label: "duty" },
    { key: "lifecyclePolicies", label: "lifecycle policy" },
    { key: "sensitivities", label: "sensitivity" },
    { key: "optionSets", label: "Option Set" },
    { key: "events", label: "event" },
    { key: "metrics", label: "metric" },
    { key: "nfrs", label: "NFR" },
    { key: "modules", label: "module" },
    { key: "flows", label: "Flow" },
    { key: "aiTasks", label: "AI task" },
    { key: "extensions", label: "extension" },
  ];

  assert.deepEqual(requirementModelExports.MODEL_COLLECTIONS, expected);
  assertDeepFrozen(requirementModelExports.MODEL_COLLECTIONS);
  assert.deepEqual(
    Object.keys(requirementModel),
    expected.map(({ key }) => key),
  );
});

test("accepts explicitly present empty top-level collections", () => {
  assert.deepEqual(validateRequirementModel({
    baselineDecisions: [],
    roles: [],
    duties: [],
    lifecyclePolicies: [],
    sensitivities: [],
    optionSets: [],
    events: [],
    metrics: [],
    nfrs: [],
    modules: [],
    flows: [],
    aiTasks: [],
    extensions: [],
  }), []);
});

test("assembles the shared facts into the phase-one executable model", () => {
  assert.deepEqual(requirementModel, {
    baselineDecisions,
    roles,
    duties,
    lifecyclePolicies,
    sensitivities,
    optionSets,
    events,
    metrics,
    nfrs,
    modules,
    flows,
    aiTasks: [],
    extensions,
  });
  assert.deepEqual(validateRequirementModel(requirementModel), []);
});

test("declares the direct read mode for every phase-one object", () => {
  const phaseOneObjects = modules
    .filter(({ phase }) => phase === PHASE.FIRST)
    .flatMap(({ objects }) => objects);
  const readModeCounts = Object.groupBy(phaseOneObjects, ({ readMode }) => readMode);
  assert.deepEqual(
    Object.fromEntries(Object.entries(readModeCounts).map(([mode, objects]) => (
      [mode, objects.length]
    ))),
    {
      AUTHORIZED: 15,
      NO_DIRECT_READ: 30,
      STUDENT_TIMED_RELEASE: 1,
    },
  );
  assert.equal(
    phaseOneObjects.find(({ id }) => id === "PUB-OBJ-RESULT")?.readMode,
    "STUDENT_TIMED_RELEASE",
  );

  for (const object of phaseOneObjects) {
    const model = structuredClone(requirementModel);
    const mutableObject = model.modules.flatMap(({ objects }) => objects)
      .find(({ id }) => id === object.id);
    delete mutableObject.readMode;
    assertHasCode(validateRequirementModel(model), "INVALID_OBJECT_CONTRACT");
  }
});

test("declares one standard system identity for all 46 phase-one objects", () => {
  const phaseOneObjects = modules
    .filter(({ phase }) => phase === PHASE.FIRST)
    .flatMap(({ objects }) => objects);
  assert.equal(phaseOneObjects.length, 46);

  const violations = phaseOneObjects.flatMap((object) => {
    const identities = object.fields
      .filter(({ idempotencyRole }) => idempotencyRole === "OBJECT_ID");
    if (identities.length !== 1) return [`${object.id}:identity-count=${identities.length}`];
    const [identity] = identities;
    const standard = identity.dataType === "ID"
      && identity.valueSource?.kind === "SYSTEM"
      && identity.mutability === "IMMUTABLE"
      && identity.visibility === "AUTHORIZED_SCOPE";
    return standard ? [] : [`${object.id}:${identity.id}:non-standard`];
  });
  assert.deepEqual(violations, []);
});

test("defines the seven foundation modules plus the four teaching-loop modules and nine Flows", () => {
  assert.deepEqual(
    modules.map(({ id }) => id),
    [
      "ACC-001",
      "ORG-001",
      "IAM-001",
      "DGV-001",
      "AUD-001",
      "CURR-001",
      "TEA-001",
      "HW-001",
      "SUB-001",
      "GRD-001",
      "PUB-001",
    ],
  );
  assert.deepEqual(
    flows.map(({ id }) => id),
    ["DF-001", "DF-002", "DF-003", "DF-004", "DF-005", "DF-006", "DF-007", "DF-008", "DF-009"],
  );
  assert.equal(modules.every(({ phase, priority }) => phase === 1 && priority === "P0"), true);
});

test("models assignment fields and task-specific lifecycle actions", () => {
  const assignment = moduleById(requirementModel, "HW-001");
  const fieldIds = new Set(assignment.objects.flatMap((object) => (
    object.fields.map(({ id }) => id)
  )));
  const requiredFieldIds = [
    "HW-ASSIGNMENT-F-TITLE",
    "HW-ASSIGNMENT-F-INSTRUCTIONS",
    "HW-ASSIGNMENT-F-SUBJECT-ID",
    "HW-ASSIGNMENT-F-COURSE-ID",
    "HW-ASSIGNMENT-F-CLASS-SCOPE-IDS",
    "HW-ASSIGNMENT-F-OPEN-AT",
    "HW-ASSIGNMENT-F-DUE-AT",
    "HW-ASSIGNMENT-F-LATE-POLICY",
    "HW-ASSIGNMENT-F-RESUBMISSION-POLICY",
    "HW-ASSIGNMENT-F-ASSIGNMENT-TYPE",
    "HW-ASSIGNMENT-F-QUESTION-ORDER",
    "HW-ITEM-F-PROMPT",
    "HW-ITEM-F-ANSWER-KEY",
    "HW-ITEM-F-POINTS",
    "HW-ITEM-F-RUBRIC-VERSION",
    "HW-ITEM-F-KNOWLEDGE-POINT-IDS",
    "HW-ASSIGNMENT-F-FEEDBACK-POLICY",
    "HW-ASSIGNMENT-F-NOTIFICATION-POLICY",
    "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
    "HW-ASSIGNMENT-F-REVISION-REASON",
  ];
  assert.equal(requiredFieldIds.every((fieldId) => fieldIds.has(fieldId)), true);
  assert.deepEqual(assignment.actions.map(({ id }) => id), [
    "HW-ACT-CREATE-DRAFT",
    "HW-ACT-CREATE-ITEM",
    "HW-ACT-EDIT-ITEM",
    "HW-ACT-VALIDATE-ITEM",
    "HW-ACT-VALIDATE",
    "HW-ACT-REVALIDATE-ITEM",
    "HW-ACT-REVALIDATE-REVISION",
    "HW-ACT-PREVIEW",
    "HW-ACT-PUBLISH-ITEM",
    "HW-ACT-PUBLISH-NOW",
    "HW-ACT-SCHEDULE-PUBLISH",
    "HW-ACT-PUBLISH-SCHEDULED",
    "HW-ACT-CLOSE",
    "HW-ACT-REVISE",
    "HW-ACT-REVISE-ITEM",
    "HW-ACT-OPEN-PUBLISHED",
    "HW-ACT-RESOLVE-GRADING-SNAPSHOT",
  ]);
  assert.ok(assignment.relationships.some(({ fromObjectId, toObjectId, type }) => (
    fromObjectId === "HW-OBJ-ASSIGNMENT"
    && toObjectId === "HW-OBJ-ITEM"
    && type === "CONTAINS"
  )));
  const authoringPage = assignment.pages.find(({ id }) => id === "HW-PAGE-AUTHORING");
  const studentPage = assignment.pages.find(({ id }) => id === "HW-PAGE-STUDENT");
  assert.equal(authoringPage.actionIds.includes("HW-ACT-OPEN-PUBLISHED"), false);
  assert.deepEqual(studentPage.actionIds, ["HW-ACT-OPEN-PUBLISHED"]);
});

test("closes assignment and item publication states through revision and scheduled release", () => {
  const homework = moduleById(requirementModel, "HW-001");
  const objectById = new Map(homework.objects.map((object) => [object.id, object]));
  const actionById = new Map(homework.actions.map((action) => [action.id, action]));

  for (const objectId of ["HW-OBJ-ASSIGNMENT", "HW-OBJ-ITEM"]) {
    assert.deepEqual(
      reachableObjectStates(homework, objectId),
      new Set(objectById.get(objectId).states),
      objectId,
    );
  }
  assert.deepEqual(actionById.get("HW-ACT-REVALIDATE-REVISION").transition, {
    from: "REVISION_DRAFT",
    to: "VALIDATED",
  });
  assert.deepEqual(actionById.get("HW-ACT-REVALIDATE-ITEM").transition, {
    from: "REVISION_DRAFT",
    to: "VALIDATED",
  });
  assert.deepEqual(actionById.get("HW-ACT-PUBLISH-SCHEDULED").transition, {
    from: "SCHEDULED",
    to: "PUBLISHED",
  });
  assert.equal(actionById.get("HW-ACT-PUBLISH-SCHEDULED").executionMode, "SYSTEM_EVENT");
  assert.deepEqual(actionById.get("HW-ACT-PUBLISH-SCHEDULED").trigger, {
    kind: "EVENT",
    eventId: "EVT-HW-SCHEDULED-PUBLISH-DUE",
  });
  assert.deepEqual(
    events.find(({ id }) => id === "EVT-HW-SCHEDULED-PUBLISH-DUE").triggeredActionIds,
    ["HW-ACT-PUBLISH-SCHEDULED"],
  );

  const publication = flows.find(({ id }) => id === "DF-004");
  assert.deepEqual(publication.steps.map(({ actionId }) => actionId), [
    "HW-ACT-VALIDATE-ITEM",
    "HW-ACT-REVALIDATE-ITEM",
    "HW-ACT-VALIDATE",
    "HW-ACT-REVALIDATE-REVISION",
    "HW-ACT-PREVIEW",
    "HW-ACT-PUBLISH-ITEM",
    "HW-ACT-PUBLISH-NOW",
    "HW-ACT-SCHEDULE-PUBLISH",
  ]);
});

test("models submission payloads uploads receipts and App-first weak-network semantics", () => {
  const submission = moduleById(requirementModel, "SUB-001");
  const fields = submission.objects.flatMap((object) => object.fields);
  const fieldIds = new Set(fields.map(({ id }) => id));
  assert.equal([
    "SUB-DRAFT-F-ANSWER-PAYLOAD",
    "SUB-DRAFT-F-MEDIA-METADATA",
    "SUB-DRAFT-F-PAGE-ITEM-MAPPING",
    "SUB-DRAFT-F-IMAGE-QUALITY",
    "SUB-DRAFT-F-UPLOAD-SESSION-ID",
    "SUB-DRAFT-F-SUCCESSFUL-CHUNKS",
    "SUB-DRAFT-F-DRAFT-VERSION",
    "SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT",
    "SUB-ATTEMPT-F-SUBMISSION-VERSION",
    "SUB-ATTEMPT-F-LATE-FLAG",
    "SUB-ATTEMPT-F-RESUBMISSION-OF",
    "SUB-ATTEMPT-F-RECEIPT-ID",
    "SUB-ATTEMPT-F-RECEIPT-ISSUED-AT",
  ].every((fieldId) => fieldIds.has(fieldId)), true);
  assert.deepEqual(submission.actions.map(({ id }) => id), [
    "SUB-ACT-SAVE-DRAFT",
    "SUB-ACT-UPLOAD-CHUNK",
    "SUB-ACT-RETRY-UPLOAD",
    "SUB-ACT-SUBMIT",
    "SUB-ACT-RESUBMIT",
    "SUB-ACT-VIEW-RECEIPT",
    "SUB-ACT-HANDOFF-ACCEPTED",
  ]);
  assert.equal(submission.clientStrategy.primaryClient, CLIENT.APP);
  assert.equal(submission.clientStrategy.webParityRequired, false);
  const uploadActions = submission.actions.filter(({ id }) => (
    id === "SUB-ACT-UPLOAD-CHUNK" || id === "SUB-ACT-RETRY-UPLOAD"
  ));
  assert.equal(uploadActions.every(({ clients }) => (
    clients.length === 1 && clients[0] === CLIENT.APP
  )), true);
  const submitAction = submission.actions.find(({ id }) => id === "SUB-ACT-SUBMIT");
  assert.ok(submitAction.failureResults.includes("OFFLINE_FINAL_SUBMISSION_BLOCKED"));
  const offlineScenario = submission.scenarios.find(({ actionId, resultCode }) => (
    actionId === submitAction.id && resultCode === "OFFLINE_FINAL_SUBMISSION_BLOCKED"
  ));
  assert.match(offlineScenario.then.expectedData, /draft.*successful chunks.*server receipt/i);
  assert.deepEqual(offlineScenario.then.expectedState, { mode: "UNCHANGED" });
  assert.match(
    submission.scenarios.find(({ actionId, kind }) => (
      actionId === submitAction.id && kind === "SUCCESS"
    )).then.expectedData,
    /server receipt/i,
  );
});

test("publishes an authoritative all-subject grading capability matrix", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  const matrixObject = grading.objects.find(({ id }) => id === "GRD-OBJ-CAPABILITY-RULE");
  assert.ok(matrixObject);
  assert.ok(Array.isArray(grading.capabilityMatrix));
  assert.ok(grading.capabilityMatrix.length > 0);

  const optionCodes = new Map(optionSets.map((optionSet) => [
    optionSet.id,
    new Set(optionSet.values.map(({ code }) => code)),
  ]));
  const matrixFieldById = new Map(matrixObject.fields.map((field) => [field.id, field]));
  const bindings = {
    subjectFamily: "GRD-CAP-F-SUBJECT-FAMILY",
    questionType: "GRD-CAP-F-QUESTION-TYPE",
    submissionMethod: "GRD-CAP-F-SUBMISSION-METHOD",
    recognitionLevel: "GRD-CAP-F-RECOGNITION-LEVEL",
    scoringLevel: "GRD-CAP-F-SCORING-LEVEL",
    requiredEvidence: "GRD-CAP-F-REQUIRED-EVIDENCE",
    teacherReviewRequired: "GRD-CAP-F-TEACHER-REVIEW",
    batchConfirmEligibility: "GRD-CAP-F-BATCH-CONFIRM",
    unavailableFallback: "GRD-CAP-F-UNAVAILABLE-FALLBACK",
  };
  for (const [property, fieldId] of Object.entries(bindings)) {
    const field = matrixFieldById.get(fieldId);
    assert.equal(field.valueSource.kind, "OPTION_SET", fieldId);
    const allowedCodes = optionCodes.get(field.valueSource.optionSetId);
    assert.ok(allowedCodes, fieldId);
    for (const row of grading.capabilityMatrix) {
      const values = Array.isArray(row[property]) ? row[property] : [row[property]];
      assert.equal(values.every((value) => allowedCodes.has(value)), true, `${row.id}:${property}`);
    }
  }
  assert.deepEqual(
    [...new Set(grading.capabilityMatrix.map(({ subjectFamily }) => subjectFamily))].toSorted(),
    [
      "ARTS",
      "BIOLOGY",
      "CHEMISTRY",
      "CHINESE",
      "ENGLISH",
      "GEOGRAPHY",
      "HISTORY",
      "INFORMATION-TECHNOLOGY",
      "MATHEMATICS",
      "MORALITY-AND-LAW",
      "PHYSICAL-EDUCATION",
      "PHYSICS",
    ],
  );
  const subjectiveQuestionTypes = new Set(
    optionSets.find(({ key }) => key === "questionType").values
      .filter(({ isSubjective }) => isSubjective)
      .map(({ code }) => code),
  );
  const subjectiveRows = grading.capabilityMatrix.filter(({ questionType }) => (
    subjectiveQuestionTypes.has(questionType)
  ));
  assert.ok(subjectiveRows.length > 0);
  assert.equal(subjectiveRows.every((row) => (
    row.teacherReviewRequired === "YES"
    && row.batchConfirmEligibility === "INELIGIBLE"
    && row.scoringLevel !== "AUTO-SCORE"
  )), true);
  assert.equal(grading.capabilityMatrix.every(({ unavailableFallback }) => (
    unavailableFallback === "MANUAL-GRADING"
    || unavailableFallback === "MANUAL-TRANSCRIPTION-THEN-GRADING"
  )), true);
});

test("covers every declared grading combination with exactly one explicit decision", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  const applicability = grading.capabilityApplicability;
  assert.ok(applicability, "GRD-001 must declare the complete capability applicability space");
  const exactRules = grading.capabilityMatrix;
  const unsupportedRule = applicability.unsupportedRule;
  const combinationId = (subjectFamily, questionType, submissionMethod) => (
    `${subjectFamily}|${questionType}|${submissionMethod}`
  );
  const supportedIds = exactRules.map((rule) => combinationId(
    rule.subjectFamily,
    rule.questionType,
    rule.submissionMethod,
  ));

  assert.equal(new Set(supportedIds).size, supportedIds.length);
  assert.equal(applicability.capabilityObjectId, "GRD-OBJ-CAPABILITY-RULE");
  assert.deepEqual(applicability.fieldBindings, {
    subjectFamily: { fieldId: "GRD-CAP-F-SUBJECT-FAMILY", optionSetId: "OPT-TL-003" },
    questionType: { fieldId: "GRD-CAP-F-QUESTION-TYPE", optionSetId: "OPT-ENUM-003" },
    submissionMethod: { fieldId: "GRD-CAP-F-SUBMISSION-METHOD", optionSetId: "OPT-ENUM-031" },
    recognitionLevel: { fieldId: "GRD-CAP-F-RECOGNITION-LEVEL", optionSetId: "OPT-TL-004" },
    scoringLevel: { fieldId: "GRD-CAP-F-SCORING-LEVEL", optionSetId: "OPT-TL-005" },
    requiredEvidence: { fieldId: "GRD-CAP-F-REQUIRED-EVIDENCE", optionSetId: "OPT-TL-006" },
    teacherReviewRequired: { fieldId: "GRD-CAP-F-TEACHER-REVIEW", optionSetId: "OPT-ENUM-001" },
    batchConfirmEligibility: { fieldId: "GRD-CAP-F-BATCH-CONFIRM", optionSetId: "OPT-TL-007" },
    unavailableFallback: { fieldId: "GRD-CAP-F-UNAVAILABLE-FALLBACK", optionSetId: "OPT-TL-008" },
  });
  const capabilityObject = grading.objects.find(({ id }) => (
    id === applicability.capabilityObjectId
  ));
  for (const { fieldId, optionSetId } of Object.values(applicability.fieldBindings)) {
    const field = capabilityObject.fields.find(({ id }) => id === fieldId);
    assert.deepEqual(field.valueSource, { kind: "OPTION_SET", optionSetId });
  }
  assert.equal(unsupportedRule.priority < applicability.exactRulePriority, true);
  assert.deepEqual(unsupportedRule.exceptCombinationIds.toSorted(), supportedIds.toSorted());
  assert.deepEqual(unsupportedRule.decision, {
    recognitionLevel: "NONE",
    scoringLevel: "MANUAL-ONLY",
    requiredEvidence: ["TEACHER-JUDGMENT"],
    teacherReviewRequired: "YES",
    batchConfirmEligibility: "INELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
  });

  const dimensions = applicability.dimensions;
  const subjectiveQuestionTypes = new Set(
    optionSets.find(({ key }) => key === "questionType").values
      .filter(({ isSubjective }) => isSubjective)
      .map(({ code }) => code),
  );
  let coveredCombinationCount = 0;
  for (const subjectFamily of dimensions.subjectFamilies) {
    for (const questionType of dimensions.questionTypes) {
      for (const submissionMethod of dimensions.submissionMethods) {
        const id = combinationId(subjectFamily, questionType, submissionMethod);
        const exactMatches = exactRules.filter((rule) => combinationId(
          rule.subjectFamily,
          rule.questionType,
          rule.submissionMethod,
        ) === id);
        const fallbackMatches = unsupportedRule.exceptCombinationIds.includes(id)
          ? []
          : [unsupportedRule.decision];
        const decisions = [...exactMatches, ...fallbackMatches];
        assert.equal(decisions.length, 1, id);
        if (subjectiveQuestionTypes.has(questionType)) {
          assert.equal(decisions[0].teacherReviewRequired, "YES", id);
        }
        coveredCombinationCount += 1;
      }
    }
  }
  assert.equal(coveredCombinationCount, 12 * 9 * 5);
});

test("derives grading dimensions and subjectivity only from central Option Sets", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  const applicability = grading.capabilityApplicability;
  const questionTypes = optionSets.find(({ key }) => key === "questionType");
  assert.deepEqual(
    Object.fromEntries(questionTypes.values.map(({ code, isSubjective }) => [code, isSubjective])),
    {
      "SINGLE-CHOICE": false,
      "MULTIPLE-CHOICE": false,
      "TRUE-FALSE": false,
      "FILL-BLANK": false,
      CALCULATION: true,
      "SHORT-ANSWER": true,
      ESSAY: true,
      "ATTACHMENT-ANSWER": true,
      "LEARNING-TASK": true,
    },
  );
  assert.equal(Object.hasOwn(applicability, "subjectiveQuestionTypes"), false);
  assert.equal(grading.capabilityMatrix.every((rule) => (
    !Object.hasOwn(rule, "isSubjective")
  )), true);
  assert.ok(applicability.fieldBindings, "grading dimensions must bind through capability fields");

  for (const [dimension, property] of [
    ["subjectFamilies", "subjectFamily"],
    ["questionTypes", "questionType"],
    ["submissionMethods", "submissionMethod"],
  ]) {
    const optionSet = optionSets.find(({ id }) => (
      id === applicability.fieldBindings[property].optionSetId
    ));
    assert.deepEqual(
      new Set(applicability.dimensions[dimension]),
      new Set(optionSet.values.map(({ code }) => code)),
      dimension,
    );
  }
});

test("rejects grading capability overlap, gaps, implicit fallback, and review bypass", () => {
  const mutations = [
    ["duplicate combination", (grading) => {
      grading.capabilityMatrix.push(structuredClone(grading.capabilityMatrix[0]));
    }],
    ["missing fallback exclusion", (grading) => {
      grading.capabilityApplicability.unsupportedRule.exceptCombinationIds.pop();
    }],
    ["extra fallback exclusion", (grading) => {
      grading.capabilityApplicability.unsupportedRule.exceptCombinationIds.push(
        "CHINESE|TRUE-FALSE|TEXT",
      );
    }],
    ["missing fallback decision", (grading) => {
      delete grading.capabilityApplicability.unsupportedRule.decision.unavailableFallback;
    }],
    ["subjective review bypass", (grading) => {
      grading.capabilityMatrix.find(({ questionType }) => questionType === "ESSAY")
        .teacherReviewRequired = "NO";
    }],
    ["subjective batch bypass", (grading) => {
      grading.capabilityMatrix.find(({ questionType }) => questionType === "ESSAY")
        .batchConfirmEligibility = "ELIGIBLE";
    }],
    ["unknown option code", (grading) => {
      grading.capabilityMatrix[0].recognitionLevel = "UNKNOWN-LEVEL";
    }],
    ["dimension gap", (grading) => {
      grading.capabilityApplicability.dimensions.subjectFamilies = grading
        .capabilityApplicability.dimensions.subjectFamilies
        .filter((code) => code !== "ARTS");
    }],
    ["missing exact rule", (grading) => {
      grading.capabilityMatrix.pop();
    }],
    ["authored objective subjectivity", (grading) => {
      grading.capabilityMatrix.find(({ questionType }) => questionType === "SINGLE-CHOICE")
        .isSubjective = true;
    }],
    ["authored subjective override", (grading) => {
      grading.capabilityMatrix.find(({ questionType }) => questionType === "ESSAY")
        .isSubjective = false;
    }],
    ["fallback batch bypass", (grading) => {
      grading.capabilityApplicability.unsupportedRule.decision.batchConfirmEligibility = "ELIGIBLE";
    }],
    ["unknown applicability key", (grading) => {
      grading.capabilityApplicability.implicitDefault = true;
    }],
    ["unknown dimension key", (grading) => {
      grading.capabilityApplicability.dimensions.mediaTypes = [];
    }],
    ["unknown binding key", (grading) => {
      grading.capabilityApplicability.fieldBindings.subjectivity = structuredClone(
        grading.capabilityApplicability.fieldBindings.questionType,
      );
    }],
    ["unknown rule key", (grading) => {
      grading.capabilityMatrix[0].implicitFallback = true;
    }],
    ["duplicate rule id", (grading) => {
      grading.capabilityMatrix[1].id = grading.capabilityMatrix[0].id;
    }],
    ["duplicate required evidence", (grading) => {
      grading.capabilityMatrix[0].requiredEvidence.push(
        grading.capabilityMatrix[0].requiredEvidence[0],
      );
    }],
    ["subjective auto score", (grading) => {
      grading.capabilityMatrix.find(({ questionType }) => questionType === "ESSAY")
        .scoringLevel = "AUTO-SCORE";
    }],
    ["binding field drift", (grading) => {
      grading.capabilityApplicability.fieldBindings.questionType.fieldId =
        "GRD-CAP-F-SUBJECT-FAMILY";
    }],
    ["bound field value source drift", (grading) => {
      grading.objects.find(({ id }) => id === "GRD-OBJ-CAPABILITY-RULE")
        .fields.find(({ id }) => id === "GRD-CAP-F-QUESTION-TYPE")
        .valueSource.optionSetId = "OPT-TL-003";
    }],
  ];

  const missedMutations = [];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(moduleById(model, "GRD-001"));
    const errors = validateRequirementModel(model);
    if (!errors.some((error) => error.startsWith("INVALID_GRADING_CAPABILITY_MATRIX"))) {
      missedMutations.push(name);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("rejects question type Option Sets without boolean subjectivity metadata", () => {
  for (const mutate of [
    (value) => { delete value.isSubjective; },
    (value) => { value.isSubjective = "sometimes"; },
  ]) {
    const model = structuredClone(requirementModel);
    const questionType = model.optionSets.find(({ key }) => key === "questionType");
    mutate(questionType.values[0]);
    assertHasCode(validateRequirementModel(model), "INVALID_ENTITY_SHAPE");
  }
});

test("returns stable validation errors for malformed grading Option Set values", () => {
  const mutations = [
    (values) => { values[0] = null; },
    (values) => { values[0] = 7; },
    (values) => { delete values[0]; },
  ];

  for (const mutate of mutations) {
    const model = structuredClone(requirementModel);
    const questionType = model.optionSets.find(({ key }) => key === "questionType");
    mutate(questionType.values);
    let errors;
    assert.doesNotThrow(() => {
      errors = validateRequirementModel(model);
    });
    assert.equal(errors.length > 0, true);
    assert.equal(errors.some((error) => (
      error.startsWith("INVALID_ENTITY_SHAPE")
      || error.startsWith("MALFORMED_MODEL")
    )), true, errors.join("\n"));
  }
});

test("keeps formal grading under corresponding subject-teacher confirmation", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  assert.deepEqual(grading.actions.map(({ id }) => id), [
    "GRD-ACT-ENQUEUE",
    "GRD-ACT-PROCESS",
    "GRD-ACT-ROUTE",
    "GRD-ACT-ROUTE-UNSUPPORTED",
    "GRD-ACT-ROUTE-AI-UNAVAILABLE",
    "GRD-ACT-CORRECT-RECOGNITION",
    "GRD-ACT-ACCEPT-SUGGESTION",
    "GRD-ACT-OVERRIDE-SCORE",
    "GRD-ACT-MANUAL-GRADE",
    "GRD-ACT-BATCH-CONFIRM",
    "GRD-ACT-OPEN-CONFIRMED-REVISION",
    "GRD-ACT-CONFIRM-REVISION",
    "GRD-ACT-RESOLVE-VERSION-CONFLICT",
  ]);
  const decisionFieldIds = new Set(
    grading.objects.find(({ id }) => id === "GRD-OBJ-DECISION")
      .fields.map(({ id }) => id),
  );
  assert.equal([
    "GRD-DECISION-F-RECOGNIZED-ANSWER",
    "GRD-DECISION-F-RECOGNIZED-REGION",
    "GRD-DECISION-F-SUBMISSION-VERSION",
    "GRD-DECISION-F-ITEM-VERSION",
    "GRD-DECISION-F-RUBRIC-VERSION",
    "GRD-DECISION-F-SUGGESTED-SCORE",
    "GRD-DECISION-F-SCORING-RATIONALE",
    "GRD-DECISION-F-CONFIDENCE",
    "GRD-DECISION-F-LIMITATION",
    "GRD-DECISION-F-OFFICIAL-SCORE",
    "GRD-DECISION-F-TEACHER-FEEDBACK",
    "GRD-DECISION-F-CORRECTION-REASON",
    "GRD-DECISION-F-DECISION-VERSION",
  ].every((fieldId) => decisionFieldIds.has(fieldId)), true);
  const formalActionIds = new Set([
    "GRD-ACT-ACCEPT-SUGGESTION",
    "GRD-ACT-OVERRIDE-SCORE",
    "GRD-ACT-MANUAL-GRADE",
    "GRD-ACT-BATCH-CONFIRM",
    "GRD-ACT-OPEN-CONFIRMED-REVISION",
    "GRD-ACT-CONFIRM-REVISION",
    "GRD-ACT-RESOLVE-VERSION-CONFLICT",
  ]);
  for (const action of grading.actions.filter(({ id }) => formalActionIds.has(id))) {
    assert.ok(action.permissions.some(({ effect, dutyRef, condition }) => (
      effect === "ALLOW"
      && dutyRef === "DUTY-SUBJECT-TEACHER"
      && /corresponding|对应/.test(condition)
    )), action.id);
    assert.ok(action.permissions.some(({ effect, condition }) => (
      effect === "DENY" && /other subject|其他学科|unconfirmed subjective/i.test(condition)
    )), action.id);
  }
});

test("makes supported, unsupported, and AI-unavailable grading routes state-reachable", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  const actionById = new Map(grading.actions.map((action) => [action.id, action]));
  const successState = (actionId) => grading.scenarios.find(({ actionId: id, kind }) => (
    id === actionId && kind === "SUCCESS"
  )).then.expectedState.value;
  const successData = (actionId) => grading.scenarios.find(({ actionId: id, kind }) => (
    id === actionId && kind === "SUCCESS"
  )).then.expectedData;
  const routeOptionSet = optionSets.find(({ key }) => key === "gradingRoute");
  assert.ok(routeOptionSet, "gradingRoute Option Set must exist independently of fallback choices");
  assert.deepEqual(routeOptionSet.values.map(({ code }) => code), [
    "AI-SUGGESTION-REVIEW",
    "AUTO-SCORE-CONFIRMATION",
    "MANUAL-GRADING",
    "MANUAL-TRANSCRIPTION-THEN-GRADING",
  ]);

  assert.equal(successState("GRD-ACT-ENQUEUE"), "QUEUED");
  assert.deepEqual(actionById.get("GRD-ACT-PROCESS").transition, {
    from: "QUEUED",
    to: "PROCESSING",
  });
  assert.deepEqual(actionById.get("GRD-ACT-ROUTE").transition, {
    from: "PROCESSING",
    to: "ROUTED_REVIEW",
  });
  assert.deepEqual(actionById.get("GRD-ACT-ROUTE-UNSUPPORTED").transition, {
    from: "QUEUED",
    to: "ROUTED_MANUAL",
  });
  assert.deepEqual(actionById.get("GRD-ACT-ROUTE-AI-UNAVAILABLE").transition, {
    from: "PROCESSING",
    to: "ROUTED_MANUAL",
  });
  assert.match(successData("GRD-ACT-ROUTE"), /AI-SUGGESTION-REVIEW.*AUTO-SCORE-CONFIRMATION/i);
  assert.match(successData("GRD-ACT-ROUTE-UNSUPPORTED"), /MANUAL-GRADING.*MANUAL-TRANSCRIPTION/i);
  assert.match(successData("GRD-ACT-ROUTE-AI-UNAVAILABLE"), /MANUAL.*fallback/i);
  assert.equal(actionById.get("GRD-ACT-MANUAL-GRADE").transition.from, "ROUTED_MANUAL");
  assert.equal(actionById.get("GRD-ACT-ACCEPT-SUGGESTION").transition.from, "ROUTED_REVIEW");
  assert.equal(actionById.get("GRD-ACT-BATCH-CONFIRM").transition.from, "ROUTED_REVIEW");

  const routing = flows.find(({ id }) => id === "DF-006");
  assert.deepEqual(routing.steps.map(({ actionId }) => actionId), [
    "SUB-ACT-HANDOFF-ACCEPTED",
    "HW-ACT-RESOLVE-GRADING-SNAPSHOT",
    "GRD-ACT-ENQUEUE",
    "GRD-ACT-ROUTE-UNSUPPORTED",
    "GRD-ACT-PROCESS",
    "GRD-ACT-ROUTE",
    "GRD-ACT-ROUTE-AI-UNAVAILABLE",
  ]);
});

test("writes grading lineage through system outputs and recovers conflicts through requeue", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  const actionById = new Map(grading.actions.map((action) => [action.id, action]));
  const decision = grading.objects.find(({ id }) => id === "GRD-OBJ-DECISION");
  assert.deepEqual(decision.lineageBindings, [
    {
      refFieldId: "GRD-DECISION-F-SUBMISSION-REF",
      versionFieldId: "GRD-DECISION-F-SUBMISSION-VERSION",
      targetObjectId: "SUB-OBJ-ATTEMPT",
      targetVersionFieldId: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
    },
    {
      refFieldId: "GRD-DECISION-F-ITEM-REF",
      versionFieldId: "GRD-DECISION-F-ITEM-VERSION",
      targetObjectId: "HW-OBJ-ITEM",
      targetVersionFieldId: "HW-ITEM-F-ITEM-VERSION",
    },
    {
      refFieldId: "GRD-DECISION-F-RUBRIC-REF",
      versionFieldId: "GRD-DECISION-F-RUBRIC-VERSION",
      targetObjectId: "HW-OBJ-RUBRIC",
      targetVersionFieldId: "HW-RUBRIC-F-RUBRIC-VERSION",
    },
    {
      refFieldId: "GRD-DECISION-F-CAPABILITY-RULE-REF",
      versionFieldId: "GRD-DECISION-F-CAPABILITY-RULE-VERSION",
      targetObjectId: "GRD-OBJ-CAPABILITY-RULE",
      targetVersionFieldId: "GRD-CAP-F-RULE-VERSION",
    },
  ]);
  const lineageFieldIds = [
    "GRD-DECISION-F-SUBMISSION-REF",
    "GRD-DECISION-F-SUBMISSION-VERSION",
    "GRD-DECISION-F-ITEM-REF",
    "GRD-DECISION-F-ITEM-VERSION",
    "GRD-DECISION-F-RUBRIC-REF",
    "GRD-DECISION-F-RUBRIC-VERSION",
    "GRD-DECISION-F-CAPABILITY-RULE-REF",
    "GRD-DECISION-F-CAPABILITY-RULE-VERSION",
  ];
  const enqueue = actionById.get("GRD-ACT-ENQUEUE");
  assert.equal(lineageFieldIds.every((fieldId) => enqueue.outputFieldIds.includes(fieldId)), true);
  assert.equal(enqueue.inputFieldIds.some((fieldId) => lineageFieldIds.includes(fieldId)), false);

  for (const action of grading.actions.filter(({ failureResults }) => (
    failureResults.includes("VERSION_CONFLICT")
  ))) {
    const conflictScenario = grading.scenarios.find(({ actionId, resultCode }) => (
      actionId === action.id && resultCode === "VERSION_CONFLICT"
    ));
    assert.deepEqual(conflictScenario.then.expectedState, {
      mode: "STATE",
      value: "CONFLICT",
    }, action.id);
  }

  const resolve = actionById.get("GRD-ACT-RESOLVE-VERSION-CONFLICT");
  assert.deepEqual(resolve.transition, { from: "CONFLICT", to: "QUEUED" });
  assert.equal(lineageFieldIds.every((fieldId) => resolve.outputFieldIds.includes(fieldId)), true);
  assert.equal(resolve.inputFieldIds.some((fieldId) => lineageFieldIds.includes(fieldId)), false);

  const userActions = grading.actions.filter(({ executionMode }) => executionMode === "USER_TASK");
  assert.equal(userActions.every(({ inputFieldIds }) => (
    inputFieldIds.every((fieldId) => !lineageFieldIds.includes(fieldId))
  )), true);

  const routing = flows.find(({ id }) => id === "DF-006");
  assert.deepEqual(new Set(routing.moduleIds), new Set(["HW-001", "SUB-001", "GRD-001"]));
  assert.equal(routing.sourceDataRefs.some(({ objectId, fieldId, version }) => (
    objectId === "SUB-OBJ-ATTEMPT"
    && fieldId === "SUB-ATTEMPT-F-SUBMISSION-VERSION"
    && version === "SUB-ATTEMPT-F-SUBMISSION-VERSION"
  )), true);
  assert.equal(routing.sourceDataRefs.some(({ objectId, fieldId, version }) => (
    objectId === "HW-OBJ-ITEM"
    && fieldId === "HW-ITEM-F-ITEM-VERSION"
    && version === "HW-ITEM-F-ITEM-VERSION"
  )), true);
  assert.equal(routing.sourceDataRefs.some(({ objectId, fieldId, version }) => (
    objectId === "HW-OBJ-RUBRIC"
    && fieldId === "HW-RUBRIC-F-RUBRIC-VERSION"
    && version === "HW-RUBRIC-F-RUBRIC-VERSION"
  )), true);
  assert.equal(routing.sourceDataRefs.some(({ objectId, fieldId, version }) => (
    objectId === "GRD-OBJ-CAPABILITY-RULE"
    && fieldId === "GRD-CAP-F-RULE-ID"
    && version === "GRD-CAP-F-RULE-VERSION"
  )), true);
  const flowActionOutputIds = new Set(routing.steps.flatMap(({ actionId }) => (
    actionById.get(actionId)?.outputFieldIds ?? []
  )));
  for (const { objectId, fieldId } of routing.targetDataRefs.filter(({ objectId }) => (
    objectId === "GRD-OBJ-DECISION"
  ))) {
    assert.equal(flowActionOutputIds.has(fieldId), true, `${objectId}.${fieldId}`);
  }
});

test("models publication eligibility visibility correction and invalidation", () => {
  const publication = moduleById(requirementModel, "PUB-001");
  const fieldIds = new Set(publication.objects.flatMap((object) => (
    object.fields.map(({ id }) => id)
  )));
  assert.equal([
    "PUB-RESULT-F-ELIGIBILITY",
    "PUB-RESULT-F-BLOCKING-CODES",
    "PUB-RESULT-F-ANSWER-VISIBLE-AT",
    "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
    "PUB-RESULT-F-RESULT-VERSION",
    "PUB-RESULT-F-CORRECTION-VERSION",
    "PUB-RESULT-F-PUBLIC-CORRECTION-NOTE",
    "PUB-RESULT-F-NOTIFICATION-STATUS",
    "PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS",
  ].every((fieldId) => fieldIds.has(fieldId)), true);
  assert.deepEqual(publication.actions.map(({ id }) => id), [
    "PUB-ACT-PREVIEW",
    "PUB-ACT-PREPARE-BATCH",
    "PUB-ACT-PUBLISH-SELECTED",
    "PUB-ACT-MATERIALIZE-RESULT",
    "PUB-ACT-PUBLISH-RESULT",
    "PUB-ACT-FINALIZE-BATCH",
    "PUB-ACT-RETRY-FAILED",
    "PUB-ACT-RECONCILE-BATCH",
    "PUB-ACT-VIEW-RESULT",
    "PUB-ACT-CORRECT-RESULT",
    "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
  ]);
  const publish = publication.actions.find(({ id }) => id === "PUB-ACT-PUBLISH-SELECTED");
  assert.ok(publish.failureResults.includes("UNCONFIRMED_SUBJECTIVE_SCORE"));
  assert.ok(publish.failureResults.includes("VISIBILITY_POLICY_BLOCKED"));
  assert.equal(Object.hasOwn(publication, "permissions"), false);
});

test("records result decision lineage and enforces structured student visibility", () => {
  const publication = moduleById(requirementModel, "PUB-001");
  const result = publication.objects.find(({ id }) => id === "PUB-OBJ-RESULT");
  assert.deepEqual(result.lineageBindings, [
    {
      refFieldId: "PUB-RESULT-F-SOURCE-DECISION-REF",
      versionFieldId: "PUB-RESULT-F-DECISION-VERSION",
      targetObjectId: "GRD-OBJ-DECISION",
      targetVersionFieldId: "GRD-DECISION-F-DECISION-VERSION",
    },
    {
      refFieldId: "PUB-RESULT-F-CORRECTION-DECISION-REF",
      versionFieldId: "PUB-RESULT-F-NEW-DECISION-VERSION",
      targetObjectId: "GRD-OBJ-DECISION",
      targetVersionFieldId: "GRD-DECISION-F-DECISION-VERSION",
    },
  ]);
  assert.deepEqual(result.readPolicies, [{
    id: "PUB-RP-STUDENT-RESULT",
    actionId: "PUB-ACT-VIEW-RESULT",
    subject: { roleRef: "ROLE-STUDENT" },
    scope: { kind: "OWN_RECORD", subjectFieldId: "PUB-RESULT-F-STUDENT-REF" },
    requiredState: "PUBLISHED",
    safeMetadataFieldIds: ["PUB-RESULT-F-RESULT-VERSION"],
    timeGates: [
      {
        visibleAtFieldId: "PUB-RESULT-F-ANSWER-VISIBLE-AT",
        protectedFieldIds: ["PUB-RESULT-F-ANSWER"],
      },
      {
        visibleAtFieldId: "PUB-RESULT-F-SCORE-VISIBLE-AT",
        protectedFieldIds: ["PUB-RESULT-F-SCORE"],
      },
      {
        visibleAtFieldId: "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
        protectedFieldIds: ["PUB-RESULT-F-FEEDBACK"],
      },
    ],
  }]);

  const viewResult = publication.actions.find(({ id }) => id === "PUB-ACT-VIEW-RESULT");
  assert.ok(viewResult);
  assert.equal(viewResult.operationKind, "READ");
  assert.deepEqual(viewResult.inputFieldIds, ["PUB-RESULT-F-STUDENT-REF"]);
  assert.deepEqual(viewResult.outputFieldIds, [
    "PUB-RESULT-F-STUDENT-REF",
    "PUB-RESULT-F-ANSWER",
    "PUB-RESULT-F-SCORE",
    "PUB-RESULT-F-FEEDBACK",
    "PUB-RESULT-F-ANSWER-VISIBLE-AT",
    "PUB-RESULT-F-SCORE-VISIBLE-AT",
    "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
    "PUB-RESULT-F-RESULT-VERSION",
  ]);
  assert.deepEqual(viewResult.failureResults, [
    "PERMISSION_DENIED",
    "NOT_FOUND",
    "RESULT_NOT_PUBLISHED",
    "ANSWER_NOT_VISIBLE",
    "SCORE_NOT_VISIBLE",
    "FEEDBACK_NOT_VISIBLE",
  ]);
  assert.ok(viewResult.permissions.some(({ effect, roleRef }) => (
    effect === "ALLOW" && roleRef === "ROLE-STUDENT"
  )));
  for (const resultCode of [
    "RESULT_NOT_PUBLISHED",
    "ANSWER_NOT_VISIBLE",
    "SCORE_NOT_VISIBLE",
    "FEEDBACK_NOT_VISIBLE",
  ]) {
    const scenario = publication.scenarios.find(({ actionId, resultCode: code }) => (
      actionId === viewResult.id && code === resultCode
    ));
    assert.deepEqual(scenario.then.expectedState, { mode: "UNCHANGED" }, resultCode);
  }
  const studentPage = publication.pages.find(({ id }) => id === "PUB-PAGE-STUDENT-RESULT");
  assert.deepEqual(studentPage.fieldIds, [
    "PUB-RESULT-F-STUDENT-REF",
    "PUB-RESULT-F-ANSWER",
    "PUB-RESULT-F-SCORE",
    "PUB-RESULT-F-FEEDBACK",
    "PUB-RESULT-F-ANSWER-VISIBLE-AT",
    "PUB-RESULT-F-SCORE-VISIBLE-AT",
    "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
    "PUB-RESULT-F-RESULT-VERSION",
  ]);
});

test("drives student answer score and feedback release from protected field contracts", () => {
  const publication = moduleById(requirementModel, "PUB-001");
  const result = publication.objects.find(({ id }) => id === "PUB-OBJ-RESULT");
  const fieldById = new Map(result.fields.map((field) => [field.id, field]));
  const expectedRelease = new Map([
    ["PUB-RESULT-F-ANSWER", "PUB-RESULT-F-ANSWER-VISIBLE-AT"],
    ["PUB-RESULT-F-SCORE", "PUB-RESULT-F-SCORE-VISIBLE-AT"],
    ["PUB-RESULT-F-FEEDBACK", "PUB-RESULT-F-FEEDBACK-VISIBLE-AT"],
  ]);

  for (const [fieldId, visibleAtFieldId] of expectedRelease) {
    assert.deepEqual(fieldById.get(fieldId).releaseRequirement, {
      readPolicyId: "PUB-RP-STUDENT-RESULT",
      requiredState: "PUBLISHED",
      visibleAtFieldId,
    });
    assert.equal(fieldById.get(visibleAtFieldId)?.dataType, "DATETIME", visibleAtFieldId);
  }

  const policy = result.readPolicies.find(({ id }) => id === "PUB-RP-STUDENT-RESULT");
  const protectedFieldIds = policy.timeGates
    .flatMap(({ protectedFieldIds: fieldIds }) => fieldIds)
    .toSorted();
  assert.deepEqual(protectedFieldIds, [...expectedRelease.keys()].toSorted());
});

test("rejects fail-open student result release policy mutations", () => {
  const mutations = [
    (result) => { delete result.readMode; },
    (result) => { result.readMode = "AUTHORIZED"; },
    (result) => {
      for (const field of result.fields) delete field.releaseRequirement;
      delete result.readPolicies;
    },
    (result) => { delete result.readPolicies; },
    (result) => { result.readPolicies[0].requiredState = "READY"; },
    (result) => {
      result.readPolicies[0].timeGates[0].visibleAtFieldId = "PUB-RESULT-F-RESULT-VERSION";
    },
    (result) => {
      result.readPolicies[0].timeGates[0].protectedFieldIds = ["PUB-RESULT-F-FEEDBACK"];
    },
    (result) => { result.readPolicies[0].timeGates.splice(1, 1); },
    (result) => {
      result.readPolicies[0].timeGates.push(structuredClone(result.readPolicies[0].timeGates[0]));
    },
    (result) => {
      result.fields.find(({ id }) => id === "PUB-RESULT-F-ANSWER")
        .releaseRequirement.visibleAtFieldId = "PUB-RESULT-F-FEEDBACK-VISIBLE-AT";
    },
    (_result, publication) => {
      const page = publication.pages.find(({ id }) => id === "PUB-PAGE-STUDENT-RESULT");
      page.fieldIds = page.fieldIds.filter((fieldId) => fieldId !== "PUB-RESULT-F-SCORE");
    },
    (_result, publication) => {
      publication.pages.find(({ id }) => id === "PUB-PAGE-STUDENT-RESULT")
        .fieldIds.push("PUB-RESULT-F-PUBLIC-CORRECTION-NOTE");
    },
    (_result, publication) => {
      publication.actions.find(({ id }) => id === "PUB-ACT-VIEW-RESULT")
        .outputFieldIds.pop();
    },
    (_result, publication) => {
      publication.actions.find(({ id }) => id === "PUB-ACT-VIEW-RESULT")
        .outputFieldIds.push("PUB-RESULT-F-CORRECTION-VERSION");
    },
    (_result, publication) => {
      publication.actions = publication.actions
        .filter(({ id }) => id !== "PUB-ACT-VIEW-RESULT");
    },
    (_result, publication) => {
      publication.pages = publication.pages
        .filter(({ id }) => id !== "PUB-PAGE-STUDENT-RESULT");
    },
    (_result, publication) => {
      publication.actions.find(({ id }) => id === "PUB-ACT-VIEW-RESULT")
        .permissions.push({
          effect: "ALLOW",
          dutyRef: "DUTY-SUBJECT-TEACHER",
          condition: "the teacher reads through the student result action",
        });
    },
    (_result, publication) => {
      publication.actions.find(({ id }) => id === "PUB-ACT-VIEW-RESULT")
        .permissions.push({
          effect: "ALLOW",
          roleRef: "ROLE-PLATFORM-OPS",
          condition: "platform operations reads through the student result action",
        });
    },
    (_result, publication) => {
      publication.actions.find(({ id }) => id === "PUB-ACT-VIEW-RESULT")
        .permissions.push({
          effect: "ALLOW",
          actorRef: "SYSTEM",
          condition: "the system reads through the student result action",
        });
    },
    (_result, publication) => {
      publication.actions.find(({ id }) => id === "PUB-ACT-VIEW-RESULT")
        .permissions.push({
          effect: "DENY",
          roleRef: "ROLE-STUDENT",
          condition: "the student is denied by a conflicting rule",
        });
    },
  ];

  for (const mutate of mutations) {
    const model = structuredClone(requirementModel);
    const publication = moduleById(model, "PUB-001");
    const result = publication.objects.find(({ id }) => id === "PUB-OBJ-RESULT");
    mutate(result, publication);
    assertHasCode(validateRequirementModel(model), "INVALID_READ_POLICY");
  }
});

test("makes publication batch and student-result state chains reachable", () => {
  const publication = moduleById(requirementModel, "PUB-001");
  const actionById = new Map(publication.actions.map((action) => [action.id, action]));
  const result = publication.objects.find(({ id }) => id === "PUB-OBJ-RESULT");
  assert.equal(result.states.includes("PENDING"), false);
  assert.deepEqual(actionById.get("PUB-ACT-PREPARE-BATCH").transition, {
    from: "DRAFT",
    to: "READY",
  });
  assert.deepEqual(actionById.get("PUB-ACT-PUBLISH-SELECTED").transition, {
    from: "READY",
    to: "PUBLISHING",
  });
  const materialize = actionById.get("PUB-ACT-MATERIALIZE-RESULT");
  assert.equal(Object.hasOwn(materialize, "transition"), false);
  assert.deepEqual(publication.scenarios.find(({ actionId, kind }) => (
    actionId === materialize.id && kind === "SUCCESS"
  )).then.expectedState, {
    mode: "STATE",
    value: "READY",
  });
  assert.equal([
    "PUB-RESULT-F-STUDENT-REF",
    "PUB-RESULT-F-DECISION-VERSION",
    "PUB-RESULT-F-ELIGIBILITY",
    "PUB-RESULT-F-BLOCKING-CODES",
    "PUB-RESULT-F-ANSWER-VISIBLE-AT",
    "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
    "PUB-RESULT-F-NOTIFICATION-STATUS",
    "PUB-RESULT-F-RESULT-VERSION",
  ].every((fieldId) => materialize.outputFieldIds.includes(fieldId)), true);
  assert.deepEqual(actionById.get("PUB-ACT-PUBLISH-RESULT").transition, {
    from: "READY",
    to: "PUBLISHED",
  });
  assert.deepEqual(actionById.get("PUB-ACT-FINALIZE-BATCH").transition, {
    from: "PUBLISHING",
    to: "PUBLISHED",
  });
  assert.deepEqual(actionById.get("PUB-ACT-RETRY-FAILED").transition, {
    from: "PUBLISH_FAILED",
    to: "PUBLISHED",
  });
  const reconcile = actionById.get("PUB-ACT-RECONCILE-BATCH");
  assert.ok(reconcile);
  assert.deepEqual(reconcile.transition, {
    from: "PARTIAL_FAILED",
    to: "PUBLISHED",
  });
  const reconcileFailure = publication.scenarios.find(({ actionId, resultCode }) => (
    actionId === "PUB-ACT-RECONCILE-BATCH" && resultCode === "OBJECT_PUBLICATION_FAILED"
  ));
  assert.deepEqual(reconcileFailure.then.expectedState, {
    mode: "STATE",
    value: "PARTIAL_FAILED",
  });
  assert.deepEqual(actionById.get("PUB-ACT-CORRECT-RESULT").transition, {
    from: "PUBLISHED",
    to: "INVALIDATED",
  });
  assert.deepEqual(actionById.get("PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION").transition, {
    from: "INVALIDATED",
    to: "PUBLISHED",
  });
  assert.deepEqual(
    reachableObjectStates(publication, "PUB-OBJ-BATCH", ["DRAFT"]),
    new Set(publication.objects.find(({ id }) => id === "PUB-OBJ-BATCH").states),
  );
  assert.deepEqual(
    reachableObjectStates(publication, "PUB-OBJ-RESULT"),
    new Set(publication.objects.find(({ id }) => id === "PUB-OBJ-RESULT").states),
  );
  const publishFailure = publication.scenarios.find(({ actionId, resultCode }) => (
    actionId === "PUB-ACT-PUBLISH-RESULT" && resultCode === "OBJECT_PUBLICATION_FAILED"
  ));
  assert.deepEqual(publishFailure.then.expectedState, {
    mode: "STATE",
    value: "PUBLISH_FAILED",
  });

  const release = flows.find(({ id }) => id === "DF-008");
  assert.deepEqual(release.steps.map(({ actionId }) => actionId), [
    "GRD-ACT-ACCEPT-SUGGESTION",
    "GRD-ACT-OVERRIDE-SCORE",
    "GRD-ACT-MANUAL-GRADE",
    "PUB-ACT-PREVIEW",
    "PUB-ACT-PREPARE-BATCH",
    "PUB-ACT-PUBLISH-SELECTED",
    "PUB-ACT-MATERIALIZE-RESULT",
    "PUB-ACT-PUBLISH-RESULT",
    "PUB-ACT-FINALIZE-BATCH",
    "PUB-ACT-RETRY-FAILED",
    "PUB-ACT-RECONCILE-BATCH",
  ]);
  assert.equal(release.targetDataRefs.some(({ objectId, fieldId }) => (
    objectId === "PUB-OBJ-RESULT" && fieldId === "PUB-RESULT-F-RESULT-VERSION"
  )), true);
  assert.equal(release.targetDataRefs.some(({ objectId, fieldId }) => (
    objectId === "PUB-OBJ-RESULT" && fieldId === "PUB-RESULT-F-STUDENT-REF"
  )), true);
});

test("models publication preview from authoritative visibility and notification configuration", () => {
  const publication = moduleById(requirementModel, "PUB-001");
  const objectById = new Map(publication.objects.map((object) => [object.id, object]));
  const actionById = new Map(publication.actions.map((action) => [action.id, action]));
  const batch = objectById.get("PUB-OBJ-BATCH");
  const preview = objectById.get("PUB-OBJ-PREVIEW");
  const result = objectById.get("PUB-OBJ-RESULT");
  assert.ok(preview, "publication previews must be explicit transient objects");
  assert.equal(preview.lifecyclePolicyId, "LIFE-005");

  const fieldById = (object) => new Map(object.fields.map((field) => [field.id, field]));
  const batchFieldById = fieldById(batch);
  const previewFieldById = fieldById(preview);
  const resultFieldById = fieldById(result);
  const batchConfigurationFieldIds = [
    "PUB-BATCH-F-VISIBILITY-POLICY",
    "PUB-BATCH-F-ANSWER-VISIBLE-AT",
    "PUB-BATCH-F-FEEDBACK-VISIBLE-AT",
    "PUB-BATCH-F-NOTIFICATION-POLICY",
  ];
  assert.equal(batchConfigurationFieldIds.every((fieldId) => batchFieldById.has(fieldId)), true);
  const notificationPolicyOptionSet = optionSets.find(({ id }) => (
    id === batchFieldById.get("PUB-BATCH-F-NOTIFICATION-POLICY").valueSource.optionSetId
  ));
  assert.equal(notificationPolicyOptionSet.key, "publicationNotificationPolicy");
  assert.deepEqual(notificationPolicyOptionSet.values.map(({ code }) => code), [
    "NONE",
    "ON-PUBLISH",
  ]);

  assert.deepEqual(previewFieldById.get("PUB-PREVIEW-F-BATCH-REF").valueSource, {
    kind: "OBJECT_REF",
    targetObjectId: "PUB-OBJ-BATCH",
  });
  const studentRef = previewFieldById.get("PUB-PREVIEW-F-STUDENT-REF");
  assert.ok(studentRef, "publication preview must identify one selected student");
  assert.deepEqual(studentRef.valueSource, {
    kind: "OBJECT_REF",
    targetObjectId: "ORG-OBJ-STUDENT",
  });
  assert.deepEqual(previewFieldById.get("PUB-PREVIEW-F-DECISION-REF").valueSource, {
    kind: "OBJECT_REF",
    targetObjectId: "GRD-OBJ-DECISION",
  });
  const previewOutputFieldIds = [
    "PUB-PREVIEW-F-ID",
    "PUB-PREVIEW-F-ELIGIBILITY",
    "PUB-PREVIEW-F-BLOCKING-CODES",
    "PUB-PREVIEW-F-ANSWER-VISIBLE-AT",
    "PUB-PREVIEW-F-FEEDBACK-VISIBLE-AT",
    "PUB-PREVIEW-F-NOTIFICATION-PREVIEW",
  ];
  assert.equal(previewOutputFieldIds.every((fieldId) => previewFieldById.has(fieldId)), true);
  const resultStudentRef = resultFieldById.get("PUB-RESULT-F-STUDENT-REF");
  assert.ok(resultStudentRef, "materialized results must retain the selected student reference");
  assert.deepEqual(resultStudentRef.valueSource, {
    kind: "OBJECT_REF",
    targetObjectId: "ORG-OBJ-STUDENT",
  });

  const previewAction = actionById.get("PUB-ACT-PREVIEW");
  assert.equal(previewAction.targetObjectId, preview.id);
  assert.deepEqual(previewAction.inputFieldIds, [
    "PUB-PREVIEW-F-BATCH-REF",
    "PUB-PREVIEW-F-STUDENT-REF",
    "PUB-PREVIEW-F-DECISION-REF",
  ]);
  assert.deepEqual(previewAction.outputFieldIds, previewOutputFieldIds);
  assert.ok(previewAction.failureResults.includes("NOT_FOUND"));
  assert.ok(previewAction.failureResults.includes("VISIBILITY_POLICY_BLOCKED"));
  const blockedScenario = publication.scenarios.find(({ actionId, resultCode }) => (
    actionId === previewAction.id && resultCode === "VISIBILITY_POLICY_BLOCKED"
  ));
  assert.equal(blockedScenario.kind, "BOUNDARY");
  assert.match(blockedScenario.then.expectedData, /visibility.*block/i);

  const releasePage = publication.pages.find(({ id }) => id === "PUB-PAGE-RELEASE");
  assert.ok(releasePage.objectIds.includes(preview.id));
  assert.equal(preview.fields.every(({ id }) => releasePage.fieldIds.includes(id)), true);
  assert.ok(publication.relationships.some(({ fromObjectId, toObjectId, type }) => (
    fromObjectId === preview.id
    && toObjectId === batch.id
    && type === "DERIVED_FROM"
  )));

  for (const fieldId of [
    "PUB-RESULT-F-ANSWER-VISIBLE-AT",
    "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
  ]) {
    assert.equal(resultFieldById.get(fieldId).valueSource.kind, "SYSTEM", fieldId);
    assert.equal(resultFieldById.get(fieldId).mutability, "SYSTEM_MANAGED", fieldId);
    assert.ok(actionById.get("PUB-ACT-MATERIALIZE-RESULT").outputFieldIds.includes(fieldId));
  }
  assert.deepEqual(resultFieldById.get("PUB-RESULT-F-NOTIFICATION-STATUS").valueSource, {
    kind: "OPTION_SET",
    optionSetId: "OPT-TL-010",
  });
  assert.equal(
    resultFieldById.get("PUB-RESULT-F-NOTIFICATION-STATUS").mutability,
    "SYSTEM_MANAGED",
  );
  assert.ok(actionById.get("PUB-ACT-MATERIALIZE-RESULT").outputFieldIds.includes(
    "PUB-RESULT-F-NOTIFICATION-STATUS",
  ));

  const release = flows.find(({ id }) => id === "DF-008");
  for (const fieldId of batchConfigurationFieldIds) {
    assert.ok(release.sourceDataRefs.some(({ objectId, fieldId: sourceFieldId }) => (
      objectId === batch.id && sourceFieldId === fieldId
    )), fieldId);
  }
  for (const fieldId of [
    "PUB-RESULT-F-ANSWER-VISIBLE-AT",
    "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
    "PUB-RESULT-F-NOTIFICATION-STATUS",
  ]) {
    assert.ok(release.targetDataRefs.some(({ objectId, fieldId: targetFieldId }) => (
      objectId === result.id && targetFieldId === fieldId
    )), fieldId);
  }
});

test("revises confirmed decisions before correcting immutable published results", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  const publication = moduleById(requirementModel, "PUB-001");
  const gradingActionById = new Map(grading.actions.map((action) => [action.id, action]));
  const publicationActionById = new Map(publication.actions.map((action) => [action.id, action]));
  const openRevision = gradingActionById.get("GRD-ACT-OPEN-CONFIRMED-REVISION");
  const confirmRevision = gradingActionById.get("GRD-ACT-CONFIRM-REVISION");
  assert.ok(openRevision, "confirmed decision revision must be opened explicitly");
  assert.ok(confirmRevision, "a revision must be confirmed into a new decision version");
  assert.deepEqual(openRevision.transition, {
    from: "TEACHER_CONFIRMED",
    to: "REVISION_PENDING",
  });
  assert.ok(openRevision.inputFieldIds.includes("GRD-DECISION-F-CORRECTION-REASON"));
  assert.ok(openRevision.outputFieldIds.includes("GRD-DECISION-F-PRIOR-DECISION-VERSION"));
  assert.deepEqual(confirmRevision.transition, {
    from: "REVISION_PENDING",
    to: "TEACHER_CONFIRMED",
  });
  assert.ok(confirmRevision.outputFieldIds.includes("GRD-DECISION-F-DECISION-VERSION"));
  assert.match(
    grading.scenarios.find(({ actionId, kind }) => (
      actionId === confirmRevision.id && kind === "SUCCESS"
    )).then.expectedData,
    /new decision version.*retain.*prior/i,
  );

  const correct = publicationActionById.get("PUB-ACT-CORRECT-RESULT");
  assert.ok(correct.inputFieldIds.includes("PUB-RESULT-F-NEW-DECISION-VERSION"));
  assert.equal(correct.outputFieldIds.includes("PUB-RESULT-F-DECISION-VERSION"), false);
  assert.equal([
    "PUB-RESULT-F-RESULT-VERSION",
    "PUB-RESULT-F-CORRECTION-VERSION",
    "PUB-RESULT-F-INVALIDATION-VERSION",
    "PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS",
  ].every((fieldId) => correct.outputFieldIds.includes(fieldId)), true);

  const correction = flows.find(({ id }) => id === "DF-009");
  assert.deepEqual(correction.steps.map(({ actionId }) => actionId), [
    "GRD-ACT-OPEN-CONFIRMED-REVISION",
    "GRD-ACT-CONFIRM-REVISION",
    "PUB-ACT-CORRECT-RESULT",
    "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
  ]);
  assert.equal(correction.steps.some(({ actionId }) => actionId === "GRD-ACT-OVERRIDE-SCORE"), false);
  assert.equal(correction.sourceDataRefs.some(({ objectId, fieldId }) => (
    objectId === "GRD-OBJ-DECISION" && fieldId === "GRD-DECISION-F-DECISION-VERSION"
  )), true);
  assert.equal(correction.targetDataRefs.some(({ objectId, fieldId }) => (
    objectId === "PUB-OBJ-RESULT" && fieldId === "PUB-RESULT-F-INVALIDATION-VERSION"
  )), true);
});

test("defines DF-004 through DF-009 as a versioned retryable teaching loop with manual fallback", () => {
  const teachingFlows = flows.filter(({ id }) => /^DF-00[4-9]$/.test(id));
  assert.deepEqual(teachingFlows.map(({ id }) => id), [
    "DF-004",
    "DF-005",
    "DF-006",
    "DF-007",
    "DF-008",
    "DF-009",
  ]);
  const moduleByActionId = new Map(modules.flatMap((module) => (
    module.actions.map(({ id }) => [id, module.id])
  )));
  const fieldIds = new Set(modules.flatMap((module) => (
    module.objects.flatMap((object) => object.fields.map(({ id }) => id))
  )));
  for (const flow of teachingFlows) {
    assert.deepEqual(
      new Set(flow.moduleIds),
      new Set(flow.steps.map(({ actionId }) => moduleByActionId.get(actionId))),
      flow.id,
    );
    for (const ref of [...flow.sourceDataRefs, ...flow.targetDataRefs]) {
      assert.equal(fieldIds.has(ref.version), true, `${flow.id}:${ref.version}`);
    }
    const sourceFieldIds = new Set(flow.sourceDataRefs.map(({ fieldId }) => fieldId));
    const sourceVersionFieldIds = new Set(flow.sourceDataRefs.map(({ version }) => version));
    assert.ok(flow.idempotencyKeyParts, flow.id);
    assert.deepEqual(
      Object.keys(flow.idempotencyKeyParts).sort(),
      ["fanoutFieldId", "identityFieldIds", "versionFieldIds"],
      flow.id,
    );
    assert.equal(
      flow.idempotencyKeyParts.identityFieldIds.every((fieldId) => sourceFieldIds.has(fieldId)),
      true,
      flow.id,
    );
    assert.deepEqual(
      new Set(flow.idempotencyKeyParts.versionFieldIds),
      sourceVersionFieldIds,
      flow.id,
    );
    assert.equal(sourceFieldIds.has(flow.idempotencyKeyParts.fanoutFieldId), true, flow.id);
    assert.match(flow.failureGranularity, /OBJECT/, flow.id);
    assert.ok(flow.retryPolicy.maxAttempts >= 2, flow.id);
    assert.ok(flow.retryPolicy.retryableFailureResults.length > 0, flow.id);
    assert.ok(flow.downstreamInvalidation.targets.length > 0, flow.id);
  }
  const routing = teachingFlows.find(({ id }) => id === "DF-006");
  assert.match(JSON.stringify(routing.steps), /AI.*unavailable.*manual/i);
  const confirmation = teachingFlows.find(({ id }) => id === "DF-007");
  assert.ok(confirmation.steps.some(({ actionId }) => actionId === "GRD-ACT-MANUAL-GRADE"));
  const release = teachingFlows.find(({ id }) => id === "DF-008");
  assert.ok(release.steps.some(({ actionId }) => actionId === "PUB-ACT-PUBLISH-SELECTED"));
  const correction = teachingFlows.find(({ id }) => id === "DF-009");
  assert.ok(correction.steps.some(({ actionId }) => actionId === "PUB-ACT-CORRECT-RESULT"));
});

test("publishes task-specific actions, pages, and complete scenario coverage", () => {
  const genericActionLabels = new Set([
    "对象查询与范围筛选",
    "详情查看与版本追踪",
    "创建/修改/确认主动作",
    "AI 对话与草稿/执行",
    "审计、通知与下游失效",
  ]);
  const genericPageLabels = new Set(["列表/工作台", "详情/处理页", "预览/确认页", "历史/审计页"]);

  assert.equal(modules.length, 11);
  for (const module of modules) {
    assert.equal(module.actions.length > 0, true, module.id);
    assert.equal(module.pages.length > 0, true, module.id);
    assert.equal(module.actions.every(({ label }) => !genericActionLabels.has(label)), true);
    assert.equal(module.pages.every(({ label }) => !genericPageLabels.has(label)), true);
    for (const action of module.actions) {
      const scenarios = module.scenarios.filter(({ actionId }) => actionId === action.id);
      assert.deepEqual(new Set(action.scenarioIds), new Set(scenarios.map(({ id }) => id)));
      assert.equal(scenarios.some(({ kind }) => kind === "SUCCESS"), true, action.id);
      assert.equal(
        scenarios.some(({ kind }) => kind === "FAILURE" || kind === "BOUNDARY"),
        true,
        action.id,
      );
    }
  }
});

test("publishes one distinct negative scenario per declared failure result", () => {
  for (const module of modules) {
    for (const action of module.actions) {
      const resultCodes = module.scenarios
        .filter(({ actionId, kind }) => actionId === action.id && kind !== "SUCCESS")
        .map(({ resultCode }) => resultCode);

      assert.deepEqual(
        resultCodes.toSorted(),
        action.failureResults.toSorted(),
        action.id,
      );
      assert.equal(new Set(resultCodes).size, resultCodes.length, action.id);
    }
  }
});

test("separates system and Flow actions from user pages and terminates audit recursion", () => {
  const expectedModes = new Map([
    ["ACC-ACT-EXPIRE-CONTEXT", "SYSTEM_EVENT"],
    ["ORG-ACT-FINALIZE-AUDITED-IMPORT", "FLOW_INTERNAL"],
    ["ORG-ACT-FINALIZE-AUDITED-PARTIAL-IMPORT", "FLOW_INTERNAL"],
    ["IAM-ACT-EXPIRE-GRANT", "SYSTEM_EVENT"],
    ["IAM-ACT-EVALUATE-PERMISSION", "FLOW_INTERNAL"],
    ["IAM-ACT-RECALCULATE-PERMISSIONS", "FLOW_INTERNAL"],
    ["DGV-ACT-GENERATE-EXPORT", "SYSTEM_EVENT"],
    ["DGV-ACT-EXPIRE-EXPORT", "SYSTEM_EVENT"],
    ["AUD-ACT-APPEND-EVENT", "SYSTEM_EVENT"],
    ["AUD-ACT-OPEN-SESSION", "SYSTEM_EVENT"],
    ["AUD-ACT-EXPIRE-SESSION", "SYSTEM_EVENT"],
    ["HW-ACT-PUBLISH-SCHEDULED", "SYSTEM_EVENT"],
    ["HW-ACT-RESOLVE-GRADING-SNAPSHOT", "FLOW_INTERNAL"],
    ["SUB-ACT-HANDOFF-ACCEPTED", "FLOW_INTERNAL"],
    ["GRD-ACT-ENQUEUE", "FLOW_INTERNAL"],
    ["GRD-ACT-PROCESS", "FLOW_INTERNAL"],
    ["GRD-ACT-ROUTE", "FLOW_INTERNAL"],
    ["GRD-ACT-ROUTE-UNSUPPORTED", "FLOW_INTERNAL"],
    ["GRD-ACT-ROUTE-AI-UNAVAILABLE", "FLOW_INTERNAL"],
    ["PUB-ACT-MATERIALIZE-RESULT", "FLOW_INTERNAL"],
    ["PUB-ACT-PUBLISH-RESULT", "FLOW_INTERNAL"],
    ["PUB-ACT-FINALIZE-BATCH", "FLOW_INTERNAL"],
    ["PUB-ACT-RECONCILE-BATCH", "FLOW_INTERNAL"],
  ]);
  const actions = modules.flatMap((module) => module.actions);
  const pages = modules.flatMap((module) => module.pages);
  const scenarios = modules.flatMap((module) => module.scenarios);

  assert.equal(expectedModes.size, 23);
  for (const action of actions) {
    const expectedMode = expectedModes.get(action.id) ?? "USER_TASK";
    assert.equal(action.executionMode, expectedMode, action.id);
    if (expectedMode === "USER_TASK") {
      assert.ok(action.clients.length > 0, action.id);
      assert.ok(pages.some(({ actionIds }) => actionIds.includes(action.id)), action.id);
      assert.ok(
        scenarios.filter(({ actionId }) => actionId === action.id)
          .every(({ pageId, trigger }) => pageId && trigger === undefined),
        action.id,
      );
    } else {
      assert.equal(Object.hasOwn(action, "clients"), false, action.id);
      assert.equal(pages.some(({ actionIds }) => actionIds.includes(action.id)), false, action.id);
      assert.ok(
        scenarios.filter(({ actionId }) => actionId === action.id)
          .every(({ pageId, trigger }) => pageId === undefined && trigger !== undefined),
        action.id,
      );
    }
  }

  const auditModule = moduleById(requirementModel, "AUD-001");
  const auditSink = auditModule.objects.find(({ id }) => id === "AUD-OBJ-EVENT");
  const appendAudit = auditModule.actions.find(({ id }) => id === "AUD-ACT-APPEND-EVENT");
  assert.equal(auditSink.semanticType, "AUDIT_EVENT_SINK");
  assert.equal(appendAudit.auditMode, "ATOMIC_SELF_RECORD");
  assert.equal(Object.hasOwn(appendAudit, "auditRequired"), false);
  assert.equal(appendAudit.failureResults.includes("AUDIT_FAILED"), false);
  assert.equal(
    actions
      .filter(({ risk, id }) => risk === RISK.HIGH && id !== appendAudit.id)
      .every(({ auditMode, failureResults }) => (
        auditMode === "REQUIRED" && failureResults.includes("AUDIT_FAILED")
      )),
    true,
  );
});

test("represents platform-ops, homeroom, and subject-lead authorization boundaries", () => {
  const actions = modules.flatMap((module) => module.actions);
  const permissionText = (permission) => JSON.stringify(permission);

  assert.equal(actions.some(({ permissions }) => permissions.some((permission) => (
    permission.effect === "DENY"
    && permission.roleRef === "ROLE-PLATFORM-OPS"
    && /student|学生|学校授权/.test(permissionText(permission))
  ))), true);
  assert.equal(actions.some(({ permissions }) => permissions.some((permission) => (
    permission.dutyRef === "DUTY-HOMEROOM"
    && /全学科|other subject|其他学科/.test(permissionText(permission))
  ))), true);
  assert.equal(actions.some(({ permissions }) => permissions.some((permission) => (
    permission.dutyRef === "DUTY-SUBJECT-LEAD"
    && /学科|subject/.test(permissionText(permission))
  ))), true);
});

test("publishes exactly one correctly namespaced subject per permission", () => {
  const systemActors = new Set(["SYSTEM", "AI", "CURRENT_ACTOR"]);
  for (const action of modules.flatMap((module) => module.actions)) {
    for (const permission of action.permissions) {
      const selectors = ["actorRef", "roleRef", "dutyRef"]
        .filter((property) => Object.hasOwn(permission, property));
      assert.equal(selectors.length, 1, `${action.id} ${permission.effect}`);
      if (selectors[0] === "actorRef") {
        assert.equal(systemActors.has(permission.actorRef), true, action.id);
      } else if (selectors[0] === "roleRef") {
        assert.equal(permission.roleRef.startsWith("ROLE-"), true, action.id);
      } else {
        assert.equal(permission.dutyRef.startsWith("DUTY-"), true, action.id);
      }
    }
  }
});

test("models object-level organization import results and partial success", () => {
  const organization = moduleById(requirementModel, "ORG-001");
  const importResult = organization.objects.find(({ label }) => label === "Import Row Result");
  assert.ok(importResult);
  const resultType = importResult.fields.find(({ label }) => label === "Object Result Type");
  assert.ok(resultType);
  assert.match(resultType.validation, /CREATE.*UPDATE.*NO_CHANGE.*REJECT.*DEACTIVATE/);

  const confirmImport = organization.actions.find(({ label }) => label === "Confirm Object-level Import");
  assert.ok(confirmImport);
  assert.ok(confirmImport.failureResults.includes("PARTIAL_SUCCESS"));
  assert.ok(organization.scenarios.some(({ actionId, kind, then: outcome }) => (
    actionId === confirmImport.id
    && kind === "BOUNDARY"
    && outcome.expectedState.mode === "STATE"
    && outcome.expectedState.value === "PENDING_PARTIAL_OUTCOME_AUDIT"
    && outcome.expectedPermission === "ALLOW"
    && /successful rows|成功行/.test(outcome.expectedData)
  )));
  const finalizePartial = organization.actions.find(
    ({ id }) => id === "ORG-ACT-FINALIZE-AUDITED-PARTIAL-IMPORT",
  );
  assert.deepEqual(finalizePartial.transition, {
    from: "PENDING_PARTIAL_OUTCOME_AUDIT",
    to: "PARTIAL_SUCCESS",
  });
});

test("exposes separate grade creation and update tasks in the organization workspace", () => {
  const organization = moduleById(requirementModel, "ORG-001");
  const actionById = new Map(organization.actions.map((action) => [action.id, action]));
  const createGrade = actionById.get("ORG-ACT-CREATE-GRADE");
  const updateGrade = actionById.get("ORG-ACT-UPDATE-GRADE");
  assert.deepEqual(createGrade.inputFieldIds, ["ORG-GRADE-F-NAME", "ORG-GRADE-F-TERM-ID"]);
  assert.deepEqual(createGrade.outputFieldIds, ["ORG-GRADE-F-ID", "ORG-GRADE-F-STATUS"]);
  assert.deepEqual(updateGrade.inputFieldIds, [
    "ORG-GRADE-F-ID",
    "ORG-GRADE-F-NAME",
    "ORG-GRADE-F-TERM-ID",
  ]);
  assert.deepEqual(updateGrade.transition, { from: "ACTIVE", to: "ACTIVE" });
  for (const gradeAction of [createGrade, updateGrade]) {
    assert.ok(organization.pages.some(({ actionIds }) => actionIds.includes(gradeAction.id)));
    const scenarios = organization.scenarios.filter(({ actionId }) => actionId === gradeAction.id);
    assert.equal(scenarios.length, 1 + gradeAction.failureResults.length);
    assert.deepEqual(
      scenarios.find(({ kind }) => kind === "SUCCESS").then.expectedState,
      { mode: "STATE", value: "ACTIVE" },
    );
  }
});

test("declares complete grant authority inputs for every IAM grant action", () => {
  const identity = moduleById(requirementModel, "IAM-001");
  const expectedInputs = {
    "IAM-ACT-GRANT-DUTY": [
      "IAM-DUTY-F-GRANTOR-AUTHORITY",
      "IAM-DUTY-F-SUBJECT",
      "IAM-DUTY-F-DUTY",
      "IAM-DUTY-F-SCOPE",
      "IAM-DUTY-F-ACTIONS",
      "IAM-DUTY-F-EFFECTIVE",
      "IAM-DUTY-F-EXPIRY",
      "IAM-DUTY-F-REASON",
    ],
    "IAM-ACT-GRANT-SCOPE": [
      "IAM-SCOPE-F-GRANTOR-AUTHORITY",
      "IAM-SCOPE-F-SUBJECT",
      "IAM-SCOPE-F-DUTY",
      "IAM-SCOPE-F-SCOPE",
      "IAM-SCOPE-F-ACTIONS",
      "IAM-SCOPE-F-EFFECTIVE",
      "IAM-SCOPE-F-EXPIRY",
      "IAM-SCOPE-F-REASON",
    ],
    "IAM-ACT-CREATE-TEMP-GRANT": [
      "IAM-TEMP-F-GRANTOR-AUTHORITY",
      "IAM-TEMP-F-SUBJECT",
      "IAM-TEMP-F-DUTY",
      "IAM-TEMP-F-SCOPE",
      "IAM-TEMP-F-ACTIONS",
      "IAM-TEMP-F-EFFECTIVE",
      "IAM-TEMP-F-EXPIRY",
      "IAM-TEMP-F-REASON",
    ],
  };
  for (const [actionId, inputFieldIds] of Object.entries(expectedInputs)) {
    const action = identity.actions.find(({ id }) => id === actionId);
    assert.ok(action, actionId);
    assert.deepEqual(action.inputFieldIds, inputFieldIds);
    const statusFieldId = action.outputFieldIds.find((fieldId) => /-STATUS$/.test(fieldId));
    assert.ok(statusFieldId, actionId);
    assert.equal(action.inputFieldIds.includes(statusFieldId), false, actionId);
    const exposingPages = identity.pages.filter(({ actionIds }) => actionIds.includes(actionId));
    assert.ok(exposingPages.length > 0, actionId);
    assert.equal(inputFieldIds.every((fieldId) => (
      exposingPages.some(({ fieldIds }) => fieldIds.includes(fieldId))
    )), true, actionId);
  }
});

test("binds IAM action sets to the global authorizable action registry", () => {
  const identity = moduleById(requirementModel, "IAM-001");
  const actionSetFieldIds = [
    "IAM-ROLE-F-ACTIONS",
    "IAM-DUTY-F-ACTIONS",
    "IAM-SCOPE-F-ACTIONS",
    "IAM-TEMP-F-ACTIONS",
  ];
  const fields = identity.objects.flatMap((object) => object.fields);
  for (const fieldId of actionSetFieldIds) {
    assert.deepEqual(
      fields.find(({ id }) => id === fieldId).valueSource,
      { kind: "OPTION_SET", optionSetId: "OPT-COM-016" },
      fieldId,
    );
  }
  const authorizableActions = optionSets.find(({ id }) => id === "OPT-COM-016");
  assert.equal(authorizableActions.mode, "RUNTIME_QUERY");
  assert.deepEqual(authorizableActions.values, []);
  assert.deepEqual(authorizableActions.source, {
    queryId: "QUERY-AUTHORIZABLE-ACTIONS",
    idKind: "ACTION_ID",
    valueField: "actionId",
    labelField: "displayName",
    labelSnapshot: true,
    filterContext: [
      "schoolId",
      "termId",
      "grantorRoleId",
      "grantorDutyIds",
      "targetDutyId",
      "scopeObjectIds",
    ],
  });
});

test("rejects IAM action sets that bypass the global action registry", () => {
  const mutations = [
    (model) => {
      moduleById(model, "IAM-001").objects
        .flatMap((object) => object.fields)
        .find(({ id }) => id === "IAM-DUTY-F-ACTIONS")
        .valueSource = { kind: "USER_INPUT" };
    },
    (model) => {
      model.optionSets.find(({ id }) => id === "OPT-COM-016").source.queryId = "QUERY-FREE-TEXT";
    },
    (model) => {
      model.optionSets.find(({ id }) => id === "OPT-COM-016").source.valueField = "objectId";
    },
    (model) => {
      model.optionSets.find(({ id }) => id === "OPT-COM-016").values = [{
        code: "ARBITRARY-ACTION",
        label: "Arbitrary action",
      }];
    },
    (model) => {
      model.optionSets.find(({ id }) => id === "OPT-COM-016").source.filterContext = [
        "schoolId",
      ];
    },
  ];

  for (const mutate of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_AUTHORIZABLE_ACTION_SOURCE");
  }
});

test("validates any explicitly authorizable field without relying on its Field ID", () => {
  const model = structuredClone(requirementModel);
  const identity = moduleById(model, "IAM-001");
  const rolePolicy = identity.objects.find(({ id }) => id === "IAM-OBJ-ROLE-POLICY");
  const field = structuredClone(
    rolePolicy.fields.find(({ id }) => id === "IAM-ROLE-F-ACTIONS"),
  );
  field.id = "IAM-NEW-F-AUTHORIZABLE-ACTIONS";
  field.referenceType = "AUTHORIZABLE_ACTION";
  field.valueSource = { kind: "OPTION_SET", optionSetId: "OPT-COM-002" };
  rolePolicy.fields.push(field);

  assertHasCode(
    validateRequirementModel(model),
    "INVALID_AUTHORIZABLE_ACTION_SOURCE",
  );
});

test("traces every scenario to an exposing page and a valid target state", () => {
  for (const module of modules) {
    const objectById = new Map(module.objects.map((object) => [object.id, object]));
    const actionById = new Map(module.actions.map((action) => [action.id, action]));
    const pageById = new Map(module.pages.map((page) => [page.id, page]));
    for (const scenario of module.scenarios) {
      const action = actionById.get(scenario.actionId);
      assert.ok(action, scenario.id);
      if (action.executionMode === "USER_TASK") {
        const page = pageById.get(scenario.pageId);
        assert.ok(page?.actionIds.includes(action.id), scenario.id);
        assert.equal(scenario.trigger, undefined, scenario.id);
      } else {
        assert.equal(scenario.pageId, undefined, scenario.id);
        assert.deepEqual(scenario.trigger, action.trigger, scenario.id);
      }
      const expectedState = scenario.then.expectedState;
      assert.ok(["STATE", "UNCHANGED"].includes(expectedState.mode));
      if (expectedState.mode === "STATE") {
        assert.ok(objectById.get(action.targetObjectId).states.includes(expectedState.value));
      }
    }
  }
});

test("assigns explicit object responsibility subjects and accountable actors", () => {
  const expectations = {
    "Active Work Context": ["CURRENT_ACTOR_WORK_CONTEXT", "SCHOOL", "CURRENT_ACTOR", "CURRENT_ACTOR", "SYSTEM", "SYSTEM"],
    "Teacher Profile": ["TEACHER", "SCHOOL", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"],
    "Student Profile": ["STUDENT", "SCHOOL", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"],
    "Import Batch": ["ORGANIZATION_IMPORT", "SCHOOL", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR"],
    "Import Row Result": ["ORGANIZATION_IMPORT_OBJECT", "SCHOOL", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR"],
    "Export Request": ["EXPORT_REQUESTER_AND_SCOPED_DATA", "SCHOOL", "CURRENT_ACTOR", "CURRENT_ACTOR", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"],
    "Sensitive Access Request": ["ACCESS_REQUESTER_AND_SCOPED_DATA", "SCHOOL", "CURRENT_ACTOR", "CURRENT_ACTOR", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"],
    "Curriculum Version": ["SUBJECT_CURRICULUM", "SCHOOL", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"],
    "Textbook Version": ["SUBJECT_CURRICULUM", "SCHOOL", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD"],
    "Knowledge Point": ["SUBJECT_CURRICULUM", "SCHOOL", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD"],
    "Knowledge Mapping": ["SUBJECT_CURRICULUM", "SCHOOL", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD"],
    "Teacher Todo View Definition": ["CURRENT_TEACHER_WORK_VIEW", "SCHOOL", "SYSTEM", "SYSTEM", "SYSTEM", "SYSTEM"],
    "Teacher Work Preference": ["CURRENT_TEACHER_PREFERENCE", "SCHOOL", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR"],
  };
  const objects = modules.flatMap((module) => module.objects);
  for (const [label, expected] of Object.entries(expectations)) {
    const object = objects.find((candidate) => candidate.label === label);
    assert.ok(object, label);
    assert.deepEqual([
      object.dataSubject,
      object.controlSubject,
      object.producerRef,
      object.ownerRef,
      object.confirmerRef,
      object.stewardRef,
    ], expected);
  }
  assert.equal(objects.every(({ dataSubject, controlSubject }) => (
    dataSubject.length > 0 && controlSubject === "SCHOOL"
  )), true);
});

test("declares a closed ownership scope on every relationship", () => {
  const scopes = new Set([
    "SAME_SCHOOL",
    "SAME_TERM",
    "SAME_CONTEXT",
    "SAME_SUBJECT",
    "SAME_STUDENT",
    "CROSS_MODULE_REFERENCE",
  ]);
  assert.equal(modules.every((module) => module.relationships.every(({ ownershipScope }) => (
    scopes.has(ownershipScope)
  ))), true);
});

test("binds foundation business choices to centralized Option Sets", () => {
  const expectedOptionSetIds = {
    "ACC-SCHOOL-F-REGION": "OPT-COM-001",
    "ACC-MEMBER-F-ACCOUNT-ID-TYPE": "OPT-ENUM-025",
    "ACC-MEMBER-F-ACTIVATION": "OPT-ENUM-026",
    "ACC-IDENTITY-F-ROLE": "OPT-COM-003",
    "ACC-IDENTITY-F-DUTIES": "OPT-ENUM-042",
    "ACC-CONTEXT-F-SCHOOL-ID": "OPT-COM-002",
    "ACC-CONTEXT-F-TERM-ID": "OPT-COM-004",
    "ORG-GRADE-F-TERM-ID": "OPT-COM-004",
    "ORG-CLASS-F-GRADE-ID": "OPT-COM-005",
    "ORG-STUDENT-F-CLASS-ID": "OPT-COM-006",
    "ORG-COURSE-F-SUBJECT-ID": "OPT-COM-007",
    "ORG-TEACHING-F-COURSE-ID": "OPT-COM-008",
    "ORG-TEACHING-F-TEACHER-ID": "OPT-COM-009",
    "ORG-TEACHING-F-CLASS-ID": "OPT-COM-006",
    "ORG-IMPORT-F-OBJECT-TYPE": "OPT-ENUM-020",
    "ORG-IMPORT-ROW-F-RESULT-TYPE": "OPT-ENUM-021",
    "ORG-IMPORT-ROW-F-VALIDATION-RESULT": "OPT-ENUM-022",
    "IAM-ROLE-F-ROLE": "OPT-COM-003",
    "DGV-RETENTION-F-CATEGORY": "OPT-ENUM-044",
    "DGV-AI-F-MODEL-USE": "OPT-ENUM-045",
    "CURR-CURRICULUM-F-SUBJECT": "OPT-COM-007",
    "CURR-MAPPING-F-KP-ID": "OPT-COM-011",
    "CURR-MAPPING-F-RELATION": "OPT-ENUM-043",
    "TEA-PREF-F-DEFAULT-VIEW": "OPT-ENUM-046",
  };
  const fields = modules.flatMap((module) => module.objects.flatMap((object) => object.fields));
  for (const [fieldId, optionSetId] of Object.entries(expectedOptionSetIds)) {
    const field = fields.find(({ id }) => id === fieldId);
    assert.ok(field, fieldId);
    assert.deepEqual(field.valueSource, { kind: "OPTION_SET", optionSetId });
  }
  const accountIdentifier = fields.find(({ id }) => id === "ACC-MEMBER-F-ACCOUNT-ID");
  assert.deepEqual(accountIdentifier.valueSource, { kind: "USER_INPUT" });
});

test("orders DF-001 through explicit school, login, activation, identity, term, and permission steps", () => {
  const flow = flows.find(({ id }) => id === "DF-001");
  assert.deepEqual(flow.steps, [
    { order: 1, actionId: "ACC-ACT-SEARCH-SCHOOL" },
    { order: 2, actionId: "ACC-ACT-SELECT-SCHOOL" },
    { order: 3, actionId: "ACC-ACT-FIRST-ACTIVATION", condition: "membership state is INVITED" },
    { order: 4, actionId: "ACC-ACT-LOGIN", condition: "membership state is ACTIVE after optional activation" },
    { order: 5, actionId: "ACC-ACT-SELECT-IDENTITY" },
    { order: 6, actionId: "ACC-ACT-SELECT-TERM" },
    { order: 7, actionId: "ORG-ACT-RESOLVE-CONTEXT-SCOPE" },
    { order: 8, actionId: "IAM-ACT-EVALUATE-PERMISSION" },
    { order: 9, actionId: "ACC-ACT-SWITCH-CONTEXT" },
  ]);
});

test("reaches active and read-only context states through term selection and switching", () => {
  const account = moduleById(requirementModel, "ACC-001");
  for (const actionId of ["ACC-ACT-SELECT-TERM", "ACC-ACT-SWITCH-CONTEXT"]) {
    const states = account.scenarios
      .filter((scenario) => scenario.actionId === actionId)
      .map((scenario) => scenario.then.expectedState)
      .filter(({ mode }) => mode === "STATE")
      .map(({ value }) => value);
    assert.deepEqual(new Set(states), new Set(["ACTIVE", "READ_ONLY"]), actionId);
  }
});

test("gates DF-002 writes on permission and audit before partial import acceptance", () => {
  const flow = flows.find(({ id }) => id === "DF-002");
  assert.deepEqual(flow.steps.map(({ actionId }) => actionId), [
    "ORG-ACT-UPLOAD-IMPORT",
    "ORG-ACT-MAP-IMPORT-FIELDS",
    "ORG-ACT-VALIDATE-IMPORT",
    "IAM-ACT-EVALUATE-PERMISSION",
    "AUD-ACT-APPEND-EVENT",
    "ORG-ACT-CONFIRM-IMPORT",
    "AUD-ACT-APPEND-EVENT",
    "ORG-ACT-FINALIZE-AUDITED-IMPORT",
    "ORG-ACT-FINALIZE-AUDITED-PARTIAL-IMPORT",
    "IAM-ACT-RECALCULATE-PERMISSIONS",
  ]);
  assert.match(flow.steps[4].condition, /audit gate/i);
  assert.match(flow.steps[5].condition, /provisional.*outcome audit/i);
  assert.match(flow.steps[6].condition, /outcome audit/i);
  assert.match(flow.steps[7].condition, /outcome audit.*succeeded/i);
  assert.match(flow.steps[8].condition, /partial.*outcome audit.*succeeded/i);
  assert.match(flow.steps[9].condition, /audited import.*finalized/i);
  assert.ok(flow.retryPolicy.retryableFailureResults.includes("AUDIT_FAILED"));
  assert.match(JSON.stringify(flow.compensation), /rollback.*provisional.*outcome audit/i);
  const organization = moduleById(requirementModel, "ORG-001");
  const confirm = organization.actions.find(({ id }) => id === "ORG-ACT-CONFIRM-IMPORT");
  const finalize = organization.actions.find(({ id }) => id === "ORG-ACT-FINALIZE-AUDITED-IMPORT");
  const finalizePartial = organization.actions.find(
    ({ id }) => id === "ORG-ACT-FINALIZE-AUDITED-PARTIAL-IMPORT",
  );
  assert.deepEqual(
    organization.scenarios.find(({ actionId, kind }) => (
      actionId === confirm.id && kind === "SUCCESS"
    )).then.expectedState,
    { mode: "STATE", value: "PENDING_OUTCOME_AUDIT" },
  );
  assert.deepEqual(finalize.transition, {
    from: "PENDING_OUTCOME_AUDIT",
    to: "COMPLETED",
  });
  assert.deepEqual(finalizePartial.transition, {
    from: "PENDING_PARTIAL_OUTCOME_AUDIT",
    to: "PARTIAL_SUCCESS",
  });
  const highRiskActions = modules.flatMap((module) => module.actions)
    .filter(({ risk }) => risk === RISK.HIGH);
  assert.equal(highRiskActions.every(({ auditMode, failureResults }) => (
    auditMode === "ATOMIC_SELF_RECORD"
      ? !failureResults.includes("AUDIT_FAILED")
      : auditMode === "REQUIRED" && failureResults.includes("AUDIT_FAILED")
  )), true);
});

test("declares concrete success states for every foundation write action", () => {
  for (const module of modules) {
    const successScenarioByActionId = new Map(
      module.scenarios
        .filter(({ kind }) => kind === "SUCCESS")
        .map((scenario) => [scenario.actionId, scenario]),
    );
    for (const action of module.actions.filter(({ writes }) => writes)) {
      assert.equal(
        successScenarioByActionId.get(action.id)?.then.expectedState.mode,
        "STATE",
        action.id,
      );
    }
  }
});

test("provides App-native ORG scope, import notification, and anomaly confirmation tasks", () => {
  const organization = moduleById(requirementModel, "ORG-001");
  const expectedActionIds = [
    "ORG-ACT-VIEW-MY-TEACHING-SCOPE",
    "ORG-ACT-VIEW-IMPORT-NOTIFICATION",
    "ORG-ACT-CONFIRM-IMPORT-ANOMALY",
  ];
  for (const actionId of expectedActionIds) {
    const action = organization.actions.find(({ id }) => id === actionId);
    assert.ok(action, actionId);
    assert.deepEqual(action.clients, [CLIENT.APP], actionId);
    assert.ok(organization.pages.some(({ clients, actionIds }) => (
      clients.includes(CLIENT.APP) && actionIds.includes(actionId)
    )), actionId);
  }
  assert.deepEqual(
    organization.actions.find(({ id }) => id === "ORG-ACT-CONFIRM-IMPORT").clients,
    [CLIENT.WEB],
  );
});

test("classifies export requests as S4 sensitive export data", () => {
  const governance = moduleById(requirementModel, "DGV-001");
  assert.equal(
    governance.objects.find(({ id }) => id === "DGV-OBJ-EXPORT").sensitivityId,
    "S4",
  );
});

test("publishes the usable knowledge mapping before the curriculum version", () => {
  const curriculum = moduleById(requirementModel, "CURR-001");
  const mappingValidate = curriculum.actions.find(({ id }) => id === "CURR-ACT-VALIDATE-MAPPING");
  const mappingPublish = curriculum.actions.find(({ id }) => id === "CURR-ACT-PUBLISH-MAPPING");
  const curriculumValidate = curriculum.actions.find(({ id }) => id === "CURR-ACT-VALIDATE-VERSION");
  assert.ok(mappingValidate);
  assert.deepEqual(mappingValidate.transition, { from: "DRAFT", to: "VALIDATED" });
  assert.ok(mappingPublish);
  assert.deepEqual(mappingPublish.transition, { from: "VALIDATED", to: "PUBLISHED" });
  assert.deepEqual(curriculumValidate.transition, { from: "DRAFT", to: "VALIDATED" });
  const flow = flows.find(({ id }) => id === "DF-003");
  assert.deepEqual(flow.steps.map(({ actionId }) => actionId), [
    "CURR-ACT-VALIDATE-MAPPING",
    "CURR-ACT-VALIDATE-VERSION",
    "CURR-ACT-PUBLISH-MAPPING",
    "CURR-ACT-PUBLISH-VERSION",
  ]);
  assert.ok(flow.targetDataRefs.some(({ objectId, fieldId }) => (
    objectId === "CURR-OBJ-MAPPING" && fieldId === "CURR-MAPPING-F-STATUS"
  )));
  assert.match(JSON.stringify(flow.downstreamInvalidation), /historical.*never rewritten/i);
});

test("splits export and sensitive-access approval outcomes with reasons", () => {
  const governance = moduleById(requirementModel, "DGV-001");
  assert.deepEqual(
    governance.actions.filter(({ id }) => /EXPORT$/.test(id)).map(({ id }) => id),
    ["DGV-ACT-REQUEST-EXPORT", "DGV-ACT-APPROVE-EXPORT", "DGV-ACT-DENY-EXPORT", "DGV-ACT-GENERATE-EXPORT", "DGV-ACT-EXPIRE-EXPORT"],
  );
  for (const actionId of ["DGV-ACT-APPROVE-EXPORT", "DGV-ACT-DENY-EXPORT"]) {
    assert.ok(governance.actions.find(({ id }) => id === actionId).inputFieldIds.includes("DGV-EXPORT-F-DECISION-REASON"));
  }

  const audit = moduleById(requirementModel, "AUD-001");
  for (const actionId of ["AUD-ACT-APPROVE-SENSITIVE", "AUD-ACT-DENY-SENSITIVE"]) {
    assert.ok(audit.actions.find(({ id }) => id === actionId).inputFieldIds.includes("AUD-REQUEST-F-DECISION-REASON"));
  }
  const approve = audit.actions.find(({ id }) => id === "AUD-ACT-APPROVE-SENSITIVE");
  assert.ok(approve.inputFieldIds.includes("AUD-REQUEST-F-SCOPE"));
  assert.ok(approve.inputFieldIds.includes("AUD-REQUEST-F-EXPIRY"));
});

test("declares representative Web-only and Web/App client asymmetry", () => {
  const byActionId = new Map(modules.flatMap((module) => module.actions.map((action) => [action.id, action])));
  const byPageId = new Map(modules.flatMap((module) => module.pages.map((page) => [page.id, page])));
  for (const actionId of ["ACC-ACT-LOGIN", "ACC-ACT-SWITCH-CONTEXT", "TEA-ACT-QUERY-HOMEROOM-SUMMARY"]) {
    assert.deepEqual(byActionId.get(actionId).clients, [CLIENT.WEB, CLIENT.APP]);
  }
  for (const actionId of [
    "ORG-ACT-CONFIRM-IMPORT",
    "IAM-ACT-GRANT-SCOPE",
    "DGV-ACT-APPROVE-EXPORT",
    "AUD-ACT-QUERY-AUDIT",
    "CURR-ACT-PUBLISH-VERSION",
  ]) {
    assert.deepEqual(byActionId.get(actionId).clients, [CLIENT.WEB]);
  }
  assert.deepEqual(byPageId.get("ORG-PAGE-IMPORT-MAPPING").clients, [CLIENT.WEB]);
  assert.deepEqual(byPageId.get("CURR-PAGE-PATH").clients, [CLIENT.WEB, CLIENT.APP]);
});

test("models school-first entry and read-only historical terms", () => {
  const account = moduleById(requirementModel, "ACC-001");
  const narratives = account.scenarios.map((scenario) => JSON.stringify(scenario)).join("\n");
  assert.match(narratives, /school first|先选择学校/);
  assert.match(narratives, /no auto|不得自动|不自动进入/);
  assert.match(narratives, /historical term|历史学期/);
  assert.match(narratives, /read-only|只读/);
});

test("preserves published curriculum history and keeps TEA view-only ownership", () => {
  const curriculum = moduleById(requirementModel, "CURR-001");
  const publicationFacts = curriculum.scenarios
    .filter(({ actionId }) => /PUBLISH/.test(actionId))
    .map((scenario) => JSON.stringify(scenario))
    .join("\n");
  assert.match(publicationFacts, /historical|历史/);
  assert.match(publicationFacts, /never rewrite|不改写|immutable|不可变/);

  const workbench = moduleById(requirementModel, "TEA-001");
  const ownedLabels = workbench.objects.map(({ label }) => label.toLowerCase());
  assert.equal(ownedLabels.some((label) => /score|evidence|plan|成绩|证据|计划/.test(label)), false);
});

test("keeps every Flow action participant and data reference valid and symmetric", () => {
  const moduleByActionId = new Map(modules.flatMap((module) => (
    module.actions.map(({ id }) => [id, module.id])
  )));
  const objectById = new Map(modules.flatMap((module) => (
    module.objects.map((object) => [object.id, { moduleId: module.id, object }])
  )));

  assert.equal(flows.length, 9);
  for (const flow of flows) {
    const actionModuleIds = new Set(flow.steps.map(({ actionId }) => moduleByActionId.get(actionId)));
    assert.deepEqual(new Set(flow.moduleIds), actionModuleIds, flow.id);
    for (const dataRef of [...flow.sourceDataRefs, ...flow.targetDataRefs]) {
      const owner = objectById.get(dataRef.objectId);
      assert.ok(owner, `${flow.id}:${dataRef.objectId}`);
      assert.ok(owner.object.fields.some(({ id }) => id === dataRef.fieldId));
      assert.ok(flow.moduleIds.includes(owner.moduleId));
      assert.equal(typeof dataRef.version, "string");
      assert.notEqual(dataRef.version, "");
    }
  }
});

test("the validation CLI reports eleven modules and nine Flows", () => {
  const output = execFileSync(
    process.execPath,
    ["tools/validate_v2_requirements.mjs"],
    { cwd: new URL("../..", import.meta.url), encoding: "utf8" },
  );
  assert.equal(output, "validated modules=11 flows=9\n");
});

test("defines the immutable baseline decisions and teacher duty model", () => {
  assert.deepEqual(
    baselineDecisions.map(({ id }) => id),
    [
      "BASE-001",
      "BASE-002",
      "BASE-003",
      "BASE-004",
      "BASE-005",
      "BASE-006",
      "BASE-007",
      "BASE-008",
      "BASE-009",
      "BASE-010",
    ],
  );
  assert.equal(
    baselineDecisions.every(({ statement, rationale, immutable }) => (
      typeof statement === "string"
      && statement.length > 0
      && typeof rationale === "string"
      && rationale.length > 0
      && immutable === true
    )),
    true,
  );
  assert.deepEqual(roles, [
    { id: "ROLE-STUDENT", label: "学生" },
    { id: "ROLE-TEACHER", label: "教师" },
    { id: "ROLE-ACADEMIC", label: "教务" },
    { id: "ROLE-SCHOOL-ADMIN", label: "学校管理员" },
    { id: "ROLE-PLATFORM-OPS", label: "平台运营" },
  ]);
  assert.deepEqual(duties, [
    { id: "DUTY-SUBJECT-TEACHER", roleId: "ROLE-TEACHER", label: "任课教师" },
    { id: "DUTY-HOMEROOM", roleId: "ROLE-TEACHER", label: "班主任" },
    { id: "DUTY-SUBJECT-LEAD", roleId: "ROLE-TEACHER", label: "学科负责人" },
  ]);
});

test("defines distinct lifecycle and sensitivity policies", () => {
  assert.deepEqual(
    lifecyclePolicies.map(({ id, scope }) => ({ id, scope })),
    [
      { id: "LIFE-001", scope: "TENANT_CONFIGURATION" },
      { id: "LIFE-002", scope: "SCHOOL_YEAR_ORGANIZATION" },
      { id: "LIFE-003", scope: "VERSIONED_TEACHING_FACTS" },
      { id: "LIFE-004", scope: "IMMUTABLE_AUDIT_EVENTS" },
      { id: "LIFE-005", scope: "TEMPORARY_AI_PREVIEWS" },
      { id: "LIFE-006", scope: "REPORT_SUBSCRIPTIONS_RUNS_SNAPSHOTS" },
      { id: "LIFE-007", scope: "CROSS_TERM_LEARNING_PATHS" },
      { id: "LIFE-008", scope: "EXPIRING_EXPORTS" },
    ],
  );
  assert.equal(new Set(lifecyclePolicies.map(({ writeRule }) => writeRule)).size > 1, true);
  assert.equal(lifecyclePolicies.every((policy) => (
    [
      "id",
      "scope",
      "writeRule",
      "historyRule",
      "retentionOwner",
      "expiryOrArchival",
    ].every((property) => (
      typeof policy[property] === "string" && policy[property].length > 0
    ))
  )), true);

  assert.deepEqual(sensitivities.map(({ id }) => id), ["S1", "S2", "S3", "S4"]);
  assert.equal(sensitivities.every(({ label, handlingRule }) => (
    typeof label === "string"
    && label.length > 0
    && typeof handlingRule === "string"
    && handlingRule.length > 0
  )), true);
});

test("defines measurable metric event contracts and all approved NFRs", () => {
  assert.deepEqual(
    metrics.map(({ id, ownerRef, aggregation, target, statistic = null }) => ({
      id,
      ownerRef,
      aggregation,
      target,
      statistic,
    })),
    [
      {
        id: "MET-001",
        ownerRef: "ROLE-ACADEMIC",
        aggregation: "duration",
        target: "相对试点基线降低>=30%",
        statistic: "median",
      },
      {
        id: "MET-002",
        ownerRef: "ROLE-TEACHER",
        aggregation: "conversion",
        target: ">=60%",
        statistic: null,
      },
      {
        id: "MET-003",
        ownerRef: "ROLE-ACADEMIC",
        aggregation: "count",
        target: "0",
        statistic: null,
      },
      {
        id: "MET-004",
        ownerRef: "ROLE-SCHOOL-ADMIN",
        aggregation: "count",
        target: "0",
        statistic: null,
      },
      {
        id: "MET-005",
        ownerRef: "ROLE-PLATFORM-OPS",
        aggregation: "conversion",
        target: "100%",
        statistic: null,
      },
    ],
  );
  assert.equal(metrics.every((metric) => (
    metric.eventIds.length > 0
    && metric.eventIds.every((eventId) => events.some(({ id }) => id === eventId))
    && ["ownerRef", "scope", "aggregation", "target", "exclusions", "window"]
      .every((property) => (
        typeof metric[property] === "string" && metric[property].length > 0
      ))
  )), true);
  const teacherDuration = metrics.find(({ id }) => id === "MET-001");
  assert.deepEqual({
    scope: teacherDuration.scope,
    aggregation: teacherDuration.aggregation,
    statistic: teacherDuration.statistic,
    target: teacherDuration.target,
    exclusions: teacherDuration.exclusions,
    window: teacherDuration.window,
  }, {
    scope: "试点学校一次作业反馈闭环的教师有效操作时长",
    aggregation: "duration",
    statistic: "median",
    target: "相对试点基线降低>=30%",
    exclusions: "排除媒体传输、用户主动离开页面和外部网络中断等待",
    window: "以一次作业反馈闭环为统计单元，比较试点基线期与试点运行期的周中位数",
  });
  assert.equal(metrics.find(({ id }) => id === "MET-002").aggregation, "conversion");
  assert.equal(metrics.find(({ id }) => id === "MET-003").aggregation, "count");
  assert.equal(metrics.find(({ id }) => id === "MET-004").aggregation, "count");
  const manualFallback = metrics.find(({ id }) => id === "MET-005");
  assert.equal(manualFallback.aggregation, "conversion");
  assert.equal(
    manualFallback.scope,
    "AI不可用时提交、评分和发布三类人工路径的完成率",
  );
  assert.equal(manualFallback.target, "100%");
  assert.deepEqual(manualFallback.eventIds, [
    "EVT-AI-UNAVAILABLE-SUBMISSION-MANUAL-STARTED",
    "EVT-AI-UNAVAILABLE-SUBMISSION-MANUAL-COMPLETED",
    "EVT-AI-UNAVAILABLE-GRADING-MANUAL-STARTED",
    "EVT-AI-UNAVAILABLE-GRADING-MANUAL-COMPLETED",
    "EVT-AI-UNAVAILABLE-PUBLICATION-MANUAL-STARTED",
    "EVT-AI-UNAVAILABLE-PUBLICATION-MANUAL-COMPLETED",
  ]);
  assert.deepEqual(manualFallback.series, [
    {
      id: "submission",
      startEventId: "EVT-AI-UNAVAILABLE-SUBMISSION-MANUAL-STARTED",
      successEventId: "EVT-AI-UNAVAILABLE-SUBMISSION-MANUAL-COMPLETED",
      correlationKey: "submissionAttemptId",
      target: "100%",
    },
    {
      id: "grading",
      startEventId: "EVT-AI-UNAVAILABLE-GRADING-MANUAL-STARTED",
      successEventId: "EVT-AI-UNAVAILABLE-GRADING-MANUAL-COMPLETED",
      correlationKey: "gradingTaskId",
      target: "100%",
    },
    {
      id: "publication",
      startEventId: "EVT-AI-UNAVAILABLE-PUBLICATION-MANUAL-STARTED",
      successEventId: "EVT-AI-UNAVAILABLE-PUBLICATION-MANUAL-COMPLETED",
      correlationKey: "publicationBatchId",
      target: "100%",
    },
  ]);

  assert.deepEqual(
    nfrs.map(({ id, ownerRef = null, statement }) => ({
      id,
      ownerRef,
      statement,
    })),
    [
      {
        id: "NFR-001",
        ownerRef: null,
        statement: "支持200名活跃试点学生；每班60个并发提交时不得丢失已被服务器接受的答案。",
      },
      {
        id: "NFR-002",
        ownerRef: null,
        statement: "在试点负载下，非 AI 列表和详情读取响应时间 p95 不超过2秒。",
      },
      {
        id: "NFR-003",
        ownerRef: null,
        statement: "不含媒体传输的草稿保存确认响应时间 p95 不超过1秒。",
      },
      {
        id: "NFR-004",
        ownerRef: null,
        statement: "每次提交最多支持12张图片、每张10MB，格式为 JPEG、PNG 或 HEIC；失败可断点重试且保留已成功部分。",
      },
      {
        id: "NFR-005",
        ownerRef: null,
        statement: "App 在临时断网后保留文本草稿和媒体上传草稿；最终提交成功必须以服务器回执为准。",
      },
      {
        id: "NFR-006",
        ownerRef: null,
        statement: "AI 任务采用异步状态并提供排队中、处理中和人工兜底；AI 不得阻断人工评分或发布。",
      },
      {
        id: "NFR-007",
        ownerRef: null,
        statement: "Web 支持当前及上一个主要版本的 Chrome 和 Edge；App 产品支持 iOS 16+ 与 Android 10+。",
      },
      {
        id: "NFR-008",
        ownerRef: null,
        statement: "授权拒绝、版本冲突、审计失败和部分成功必须具有彼此不同且可观测的结果。",
      },
      {
        id: "NFR-009",
        ownerRef: "ROLE-SCHOOL-ADMIN",
        statement: "精确保留期限是学校激活时由学校管理员负责的必填配置；未设置时阻断敏感导出和 AI 使用。",
      },
    ],
  );
  assert.equal(nfrs.every(({ statement, verification }) => (
    typeof statement === "string"
    && statement.length > 0
    && typeof verification === "string"
    && verification.length > 0
  )), true);
  const retentionConfiguration = nfrs.find(({ id }) => id === "NFR-009");
  assert.equal(retentionConfiguration.ownerRef, "ROLE-SCHOOL-ADMIN");
  assert.equal(
    retentionConfiguration.statement,
    "精确保留期限是学校激活时由学校管理员负责的必填配置；未设置时阻断敏感导出和 AI 使用。",
  );
});

test("registers every required Option Set concept with stable code-label values", () => {
  const requiredConcepts = [
    "region",
    "school",
    "loginRole",
    "workDuty",
    "dataRetentionCategory",
    "term",
    "grade",
    "class",
    "subject",
    "course",
    "teacher",
    "student",
    "knowledgePoint",
    "assignment",
    "exam",
    "timeRange",
    "scopeObject",
    "authorizableAction",
    "yesNo",
    "assignmentType",
    "assignmentNotificationPolicy",
    "submissionMethod",
    "questionType",
    "questionOrder",
    "latePolicy",
    "resubmissionPolicy",
    "feedbackPolicy",
    "aiConfidence",
    "gradingCorrectionReason",
    "subjectFamily",
    "recognitionLevel",
    "scoringLevel",
    "gradingEvidenceRequirement",
    "batchConfirmEligibility",
    "gradingRoute",
    "gradingUnavailableFallback",
    "scoreState",
    "evidenceStage",
    "answerResult",
    "errorType",
    "masteryState",
    "improvementPriority",
    "improvementTaskType",
    "completionEvidenceType",
    "reportCadence",
    "reportScheduleTimezone",
    "reportScheduleTime",
    "reportRecipientScope",
    "reportMetric",
    "aiCapability",
    "aiCapabilityDecision",
    "aiRisk",
    "aiTaskStatus",
    "notificationType",
    "notificationReadState",
    "publicationEligibility",
    "publicationNotificationPolicy",
    "publicationNotificationStatus",
    "importObject",
    "importAction",
    "importResult",
    "auditAction",
    "auditResult",
    "accountIdentifier",
    "activationMethod",
    "imageQuality",
    "correctionDecision",
    "schedulingConstraint",
    "schedulingView",
    "scoreRounding",
    "visibilityPolicy",
    "knowledgeMappingRelation",
    "modelTrainingUse",
    "teacherWorkspaceView",
  ];
  const runtimeSources = {
    school: {
      queryId: "QUERY-AUTHORIZED-SCHOOLS",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: ["actorId", "regionId"],
    },
    term: {
      queryId: "QUERY-SCHOOL-TERMS",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: ["schoolId", "actorId"],
    },
    grade: {
      queryId: "QUERY-SCHOOL-GRADES",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: ["schoolId", "termId", "actorId"],
    },
    class: {
      queryId: "QUERY-AUTHORIZED-CLASSES",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: ["schoolId", "termId", "gradeId", "roleId", "dutyIds"],
    },
    subject: {
      queryId: "QUERY-AUTHORIZED-SUBJECTS",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: ["schoolId", "termId", "roleId", "dutyIds"],
    },
    course: {
      queryId: "QUERY-AUTHORIZED-COURSES",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: ["schoolId", "termId", "gradeId", "subjectId", "roleId", "dutyIds"],
    },
    teacher: {
      queryId: "QUERY-SCHOOL-TEACHERS",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: ["schoolId", "termId", "actorId"],
    },
    student: {
      queryId: "QUERY-AUTHORIZED-STUDENTS",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: ["schoolId", "termId", "classIds", "roleId", "dutyIds"],
    },
    knowledgePoint: {
      queryId: "QUERY-KNOWLEDGE-POINTS",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: [
        "schoolId",
        "termId",
        "courseId",
        "subjectId",
        "curriculumVersionId",
      ],
    },
    assignment: {
      queryId: "QUERY-AUTHORIZED-ASSIGNMENTS",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: ["schoolId", "termId", "classIds", "subjectIds", "actorId"],
    },
    exam: {
      queryId: "QUERY-AUTHORIZED-EXAMS",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: ["schoolId", "termId", "classIds", "subjectIds", "actorId"],
    },
    scopeObject: {
      queryId: "QUERY-AUTHORIZABLE-SCOPE-OBJECTS",
      valueField: "objectId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: ["schoolId", "termId", "roleId", "dutyIds", "actionId"],
    },
    authorizableAction: {
      queryId: "QUERY-AUTHORIZABLE-ACTIONS",
      valueField: "actionId",
      labelField: "displayName",
      labelSnapshot: true,
      filterContext: [
        "schoolId",
        "termId",
        "grantorRoleId",
        "grantorDutyIds",
        "targetDutyId",
        "scopeObjectIds",
      ],
    },
  };
  const staticCodes = {
    region: ["CN-HEBEI", "CN-HEBEI-SHIJIAZHUANG"],
    loginRole: [
      "ROLE-STUDENT",
      "ROLE-TEACHER",
      "ROLE-ACADEMIC",
      "ROLE-SCHOOL-ADMIN",
      "ROLE-PLATFORM-OPS",
    ],
    workDuty: ["DUTY-SUBJECT-TEACHER", "DUTY-HOMEROOM", "DUTY-SUBJECT-LEAD"],
    dataRetentionCategory: ["ACCOUNT_IDENTITY", "ORGANIZATION", "TEACHING_CONTENT", "STUDENT_WORK", "SCORE_FEEDBACK", "AUDIT_EXPORT"],
    timeRange: ["TODAY", "LAST-7-DAYS", "THIS-WEEK", "THIS-MONTH", "THIS-TERM", "CUSTOM"],
    yesNo: ["YES", "NO"],
    assignmentType: ["ONLINE", "PHOTO", "MIXED", "LEARNING_TASK"],
    assignmentNotificationPolicy: ["NONE", "IN-APP-IMMEDIATE", "IN-APP-SCHEDULED"],
    submissionMethod: ["ONLINE-FORM", "TEXT", "IMAGE-UPLOAD", "FILE-UPLOAD", "MIXED-MEDIA"],
    questionType: [
      "SINGLE-CHOICE",
      "MULTIPLE-CHOICE",
      "TRUE-FALSE",
      "FILL-BLANK",
      "CALCULATION",
      "SHORT-ANSWER",
      "ESSAY",
      "ATTACHMENT-ANSWER",
      "LEARNING-TASK",
    ],
    questionOrder: ["FIXED", "SHUFFLED"],
    latePolicy: ["NOT-ALLOWED", "ALLOW-WITH-MARK", "ALLOW-UNTIL-DATE"],
    resubmissionPolicy: ["NOT-ALLOWED", "BEFORE-DEADLINE", "AFTER-FEEDBACK", "TEACHER-APPROVAL"],
    feedbackPolicy: ["WITH-SCORE-PUBLISH", "SCHEDULED", "AFTER-CORRECTION", "CLOSED"],
    aiConfidence: ["HIGH", "MEDIUM", "LOW", "UNAVAILABLE"],
    gradingCorrectionReason: [
      "RECOGNITION-ERROR",
      "RUBRIC-NOT-APPLICABLE",
      "CALCULATION-ERROR",
      "EVIDENCE-OMITTED",
      "TEACHER-JUDGMENT",
      "OTHER",
    ],
    subjectFamily: [
      "CHINESE",
      "MATHEMATICS",
      "ENGLISH",
      "MORALITY-AND-LAW",
      "HISTORY",
      "GEOGRAPHY",
      "BIOLOGY",
      "PHYSICS",
      "CHEMISTRY",
      "PHYSICAL-EDUCATION",
      "ARTS",
      "INFORMATION-TECHNOLOGY",
    ],
    recognitionLevel: ["NONE", "METADATA", "CONTENT", "STRUCTURED"],
    scoringLevel: ["AUTO-SCORE", "RULE-SUGGESTION", "AI-SUGGESTION", "MANUAL-ONLY"],
    gradingEvidenceRequirement: [
      "ANSWER-PAYLOAD",
      "MEDIA",
      "REGION-MAP",
      "IMAGE-QUALITY",
      "ITEM-VERSION",
      "RUBRIC-VERSION",
      "TEACHER-JUDGMENT",
    ],
    batchConfirmEligibility: ["ELIGIBLE", "INELIGIBLE"],
    gradingRoute: [
      "AI-SUGGESTION-REVIEW",
      "AUTO-SCORE-CONFIRMATION",
      "MANUAL-GRADING",
      "MANUAL-TRANSCRIPTION-THEN-GRADING",
    ],
    gradingUnavailableFallback: ["MANUAL-GRADING", "MANUAL-TRANSCRIPTION-THEN-GRADING"],
    scoreState: ["UNPUBLISHED", "PUBLISHED", "MISSING", "EXEMPT", "INVALID", "CORRECTED"],
    evidenceStage: ["FIRST-ANSWER", "CORRECTION", "RETEST", "FORMATIVE"],
    answerResult: ["CORRECT", "PARTIAL", "INCORRECT", "UNDETERMINED"],
    errorType: ["CONCEPT", "COMPREHENSION", "CALCULATION", "STEP", "EXPRESSION", "OVERSIGHT", "NO-ANSWER", "OTHER"],
    masteryState: ["INSUFFICIENT-DATA", "INITIAL", "BASIC", "PROFICIENT", "NEEDS-CONSOLIDATION", "WEAK"],
    improvementPriority: ["HIGH", "MEDIUM", "LOW"],
    improvementTaskType: ["PRACTICE", "REVIEW", "CORRECTION", "READING-RECITATION", "INQUIRY", "TEACHER-CONFERENCE", "OTHER"],
    completionEvidenceType: ["SYSTEM-RESULT", "STUDENT-SUBMISSION", "TEACHER-CONFIRMATION", "SCORE-IMPROVEMENT", "STUDENT-REFLECTION"],
    reportCadence: ["AD-HOC", "DAILY", "WEEKLY", "MONTHLY", "CUSTOM"],
    reportScheduleTimezone: ["ASIA-SHANGHAI"],
    reportScheduleTime: ["08:00", "17:00", "CUSTOM-LOCAL-TIME"],
    reportRecipientScope: ["SELF", "SUBJECT-TEACHERS", "CLASS-HOMEROOM", "CLASS-TEACHERS", "AUTHORIZED-ACADEMIC"],
    reportMetric: ["SUBMISSION-RATE", "SCORE-DISTRIBUTION", "MASTERY", "IMPROVEMENT-COMPLETION", "RISK-STUDENT"],
    aiCapability: ["QUERY", "ANALYSIS", "AD-HOC-REPORT", "DRAFT", "CONTROLLED-EXECUTION", "SCHEDULED-TASK"],
    aiCapabilityDecision: ["AUTO_SUPPORTED", "SUGGESTION_ONLY", "MANDATORY_REVIEW", "MANUAL_ONLY", "UNAVAILABLE"],
    aiRisk: ["READ-ONLY", "DRAFT", "CONTROLLED-WRITE", "HIGH-IMPACT"],
    aiTaskStatus: [
      "UNDERSTANDING",
      "NEEDS-CLARIFICATION",
      "QUERY-COMPLETED",
      "DRAFT-GENERATED",
      "AWAITING-CONFIRMATION",
      "QUEUED",
      "PROCESSING",
      "MANUAL-FALLBACK",
      "SUCCEEDED",
      "PARTIALLY-SUCCEEDED",
      "FAILED",
      "CONTEXT-EXPIRED",
    ],
    notificationType: ["ASSIGNMENT", "SUBMISSION", "GRADING", "PUBLISH", "CORRECTION", "IMPROVEMENT", "REPORT", "PERMISSION", "SYSTEM"],
    notificationReadState: ["UNREAD", "READ", "HANDLED", "ARCHIVED"],
    publicationEligibility: ["ELIGIBLE", "BLOCKED"],
    publicationNotificationPolicy: ["NONE", "ON-PUBLISH"],
    publicationNotificationStatus: ["PENDING", "SENT", "FAILED", "NOT-REQUIRED"],
    importObject: ["TERM", "CLASS", "TEACHER", "STUDENT", "TEACHING-ASSIGNMENT", "HOMEROOM-ASSIGNMENT", "COURSE", "KNOWLEDGE-POINT"],
    importAction: ["CREATE", "UPDATE", "UNCHANGED", "REJECT", "DEACTIVATE"],
    importResult: ["PASSED", "WARNING", "ERROR", "DUPLICATE", "CONFLICT"],
    auditAction: ["QUERY", "CREATE", "UPDATE", "PUBLISH", "EXPORT", "GRANT", "REVOKE", "LOGIN", "AI-EXECUTE"],
    auditResult: ["SUCCEEDED", "PARTIALLY-SUCCEEDED", "FAILED", "DENIED"],
    accountIdentifier: ["MOBILE", "EMPLOYEE-NUMBER", "STUDENT-NUMBER"],
    activationMethod: ["INITIAL-PASSWORD", "ONE-TIME-CODE", "ADMIN-CONFIRMATION"],
    imageQuality: ["USABLE", "BLURRY", "INCOMPLETE", "GLARE", "ORIENTATION-ERROR", "UPLOAD-FAILED"],
    correctionDecision: ["PASSED", "NOT-PASSED", "NEEDS-MORE", "CLOSED"],
    schedulingConstraint: ["HARD", "SOFT"],
    schedulingView: ["TEACHER", "CLASS", "CLASSROOM"],
    scoreRounding: ["NONE", "HALF-UP-INTEGER", "HALF-UP-ONE-DECIMAL", "FLOOR-INTEGER"],
    visibilityPolicy: ["PRIVATE", "SUBJECT-TEACHERS", "HOMEROOM-READ", "SCHOOL-AUTHORIZED", "STUDENT-VISIBLE"],
    knowledgeMappingRelation: ["PRIMARY", "SUPPORTING", "PREREQUISITE", "EXTENSION"],
    modelTrainingUse: ["DENIED", "SEPARATELY_APPROVED"],
    teacherWorkspaceView: ["TODAY", "GRADING_QUEUE", "HOMEROOM_OVERVIEW", "REPORTS"],
  };
  for (const source of Object.values(runtimeSources)) {
    source.idKind = source.valueField === "actionId" ? "ACTION_ID" : "OBJECT_ID";
  }
  assert.deepEqual(optionSets.map(({ key }) => key).sort(), requiredConcepts.sort());
  assert.deepEqual(
    Object.fromEntries(
      optionSets
        .filter(({ mode }) => mode === "RUNTIME_QUERY")
        .map(({ key, values, source }) => {
          assert.deepEqual(values, []);
          return [key, source];
        }),
    ),
    runtimeSources,
  );
  assert.deepEqual(
    Object.fromEntries(
      optionSets
        .filter(({ mode }) => mode === "STATIC")
        .map(({ key, values }) => [key, values.map(({ code }) => code)]),
    ),
    staticCodes,
  );
  assert.notEqual(
    optionSets.find(({ key }) => key === "assignmentType").id,
    optionSets.find(({ key }) => key === "submissionMethod").id,
  );
  assert.deepEqual(
    optionSets.find(({ key }) => key === "assignmentType").values
      .map(({ code }) => code),
    ["ONLINE", "PHOTO", "MIXED", "LEARNING_TASK"],
  );
  assert.deepEqual(
    optionSets.find(({ key }) => key === "aiCapabilityDecision").values
      .map(({ code }) => code),
    [
      "AUTO_SUPPORTED",
      "SUGGESTION_ONLY",
      "MANDATORY_REVIEW",
      "MANUAL_ONLY",
      "UNAVAILABLE",
    ],
  );
});

test("publishes explicit runtime-query ID and authorizable-field semantics", () => {
  for (const optionSet of optionSets.filter(({ mode }) => mode === "RUNTIME_QUERY")) {
    const expectedIdKind = optionSet.id === "OPT-COM-016" ? "ACTION_ID" : "OBJECT_ID";
    const expectedValueField = expectedIdKind === "ACTION_ID" ? "actionId" : "objectId";
    assert.equal(optionSet.source.idKind, expectedIdKind, optionSet.id);
    assert.equal(optionSet.source.valueField, expectedValueField, optionSet.id);
  }

  const authorizableFields = moduleById(requirementModel, "IAM-001").objects
    .flatMap(({ fields }) => fields)
    .filter(({ referenceType }) => referenceType === "AUTHORIZABLE_ACTION");
  assert.deepEqual(
    authorizableFields.map(({ id }) => id).toSorted(),
    [
      "IAM-DUTY-F-ACTIONS",
      "IAM-ROLE-F-ACTIONS",
      "IAM-SCOPE-F-ACTIONS",
      "IAM-TEMP-F-ACTIONS",
    ],
  );
});

test("rejects Option Sets missing key, label, or mode", () => {
  for (const property of ["key", "label", "mode"]) {
    const model = validFixture();
    const optionSet = validStaticOptionSet();
    delete optionSet[property];
    model.optionSets = [optionSet];

    assertHasCode(validateRequirementModel(model), "INVALID_ENTITY_SHAPE");
  }
});

test("rejects duplicate Option Set keys and runtime query IDs", () => {
  const duplicateKeyModel = validFixture();
  duplicateKeyModel.optionSets = [
    validStaticOptionSet({ id: "OPT-ONE", key: "duplicateKey" }),
    validStaticOptionSet({ id: "OPT-TWO", key: "duplicateKey" }),
  ];
  assertHasCode(
    validateRequirementModel(duplicateKeyModel),
    "DUPLICATE_OPTION_SET_KEY",
  );

  const duplicateQueryModel = validFixture();
  duplicateQueryModel.optionSets = [
    validRuntimeOptionSet({ id: "OPT-RUNTIME-ONE", key: "runtimeOne" }),
    validRuntimeOptionSet({ id: "OPT-RUNTIME-TWO", key: "runtimeTwo" }),
  ];
  assertHasCode(
    validateRequirementModel(duplicateQueryModel),
    "DUPLICATE_RUNTIME_QUERY",
  );
});

test("rejects duplicate codes and labels in STATIC Option Sets", () => {
  for (const values of [
    [{ code: "ONE", label: "one" }, { code: "ONE", label: "two" }],
    [{ code: "ONE", label: "same" }, { code: "TWO", label: "same" }],
  ]) {
    const model = validFixture();
    model.optionSets = [validStaticOptionSet({ values })];

    assertHasCode(validateRequirementModel(model), "DUPLICATE_OPTION_SET_VALUE");
  }
});

test("accepts supported RUNTIME_QUERY Option Set value fields", () => {
  const contracts = [
    {
      queryId: "QUERY-AUTHORIZED-SCHOOLS",
      idKind: "OBJECT_ID",
      valueField: "objectId",
    },
    {
      queryId: "QUERY-AUTHORIZABLE-ACTIONS",
      idKind: "ACTION_ID",
      valueField: "actionId",
    },
  ];
  for (const contract of contracts) {
    const model = validFixture();
    const optionSet = validRuntimeOptionSet();
    Object.assign(optionSet.source, contract);
    model.optionSets.push(optionSet);

    assert.deepEqual(validateRequirementModel(model), []);
  }
});

test("rejects runtime-query ID semantics that contradict the registered query", () => {
  const mutations = [
    (model) => {
      const source = model.optionSets.find(({ id }) => id === "OPT-COM-002").source;
      source.idKind = "ACTION_ID";
      source.valueField = "actionId";
    },
    (model) => {
      const source = model.optionSets.find(({ id }) => id === "OPT-COM-016").source;
      source.idKind = "OBJECT_ID";
      source.valueField = "objectId";
    },
    (model) => {
      const source = model.optionSets.find(({ id }) => id === "OPT-COM-002").source;
      source.idKind = "OBJECT_ID";
      source.valueField = "objectId";
      source.queryId = "QUERY-AUTHORIZABLE-ACTIONS";
    },
  ];

  for (const mutate of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_RUNTIME_QUERY_SOURCE");
  }
});

test("rejects malformed RUNTIME_QUERY Option Set sources", () => {
  const sourceMutations = [
    (optionSet) => { delete optionSet.source; },
    (optionSet) => { optionSet.source.queryId = ""; },
    (optionSet) => { optionSet.source.valueField = "id"; },
    (optionSet) => { optionSet.source.labelField = "name"; },
    (optionSet) => { optionSet.source.labelSnapshot = false; },
    (optionSet) => { optionSet.source.filterContext = []; },
    (optionSet) => { optionSet.source.filterContext = ["schoolId", "schoolId"]; },
  ];

  for (const mutate of sourceMutations) {
    const model = validFixture();
    const optionSet = validRuntimeOptionSet();
    mutate(optionSet);
    model.optionSets = [optionSet];

    assertHasCode(validateRequirementModel(model), "INVALID_ENTITY_SHAPE");
  }
});

test("rejects persisted placeholder values in RUNTIME_QUERY Option Sets", () => {
  const model = validFixture();
  model.optionSets = [validRuntimeOptionSet({
    values: [{ code: "CURRENT_AUTHORIZED", label: "current authorized" }],
  })];

  assertHasCode(validateRequirementModel(model), "INVALID_ENTITY_SHAPE");
});

test("registers phase-two extensions without executable surface", () => {
  const allowedKeys = [
    "dependencies",
    "entryCriteria",
    "excludedFirstStageBehavior",
    "id",
    "label",
    "phase",
    "status",
  ];
  assert.equal(extensions.length, 3);
  for (const extension of extensions) {
    assert.deepEqual(Object.keys(extension).sort(), allowedKeys);
    assert.equal(
      extension.phase === 2
      && extension.status === "REGISTERED_ONLY"
      && extension.dependencies.length > 0
      && extension.entryCriteria.length > 0
      && extension.excludedFirstStageBehavior.length > 0
      && ["pageIds", "actionIds", "pages", "actions"]
        .every((property) => !Object.hasOwn(extension, property)),
      true,
    );
  }
});

test("rejects missing required scalar fields in shared catalog facts", () => {
  const cases = [
    ["baselineDecisions", {
      id: "BASE-X",
      statement: "statement",
      rationale: "rationale",
      immutable: true,
    }, "statement"],
    ["lifecyclePolicies", {
      id: "LIFE-X",
      scope: "scope",
      writeRule: "write",
      historyRule: "history",
      retentionOwner: "owner",
      expiryOrArchival: "archive",
    }, "writeRule"],
    ["sensitivities", {
      id: "S-X",
      label: "label",
      handlingRule: "handling",
    }, "handlingRule"],
    ["events", {
      id: "EVT-X",
      label: "label",
      definition: "definition",
    }, "definition"],
    ["nfrs", {
      id: "NFR-X",
      statement: "statement",
      verification: "verification",
    }, "verification"],
    ["metrics", {
      id: "MET-X",
      ownerRef: "ROLE-STUDENT",
      eventIds: ["EVT-TEST-START", "EVT-TEST-END"],
      scope: "scope",
      aggregation: "duration",
      target: "target",
      exclusions: "none",
      window: "window",
    }, "window"],
  ];

  for (const [collection, entity, missingProperty] of cases) {
    const model = validFixture();
    delete entity[missingProperty];
    model[collection] = [entity];

    assertHasCode(validateRequirementModel(model), "INVALID_ENTITY_SHAPE");
  }
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
  ["baseline decisions", "MISSING_MODEL_COLLECTION", (model) => {
    model.baselineDecisions = {};
  }],
  ["roles", "MISSING_MODEL_COLLECTION", (model) => { model.roles = {}; }],
  ["duties", "MISSING_MODEL_COLLECTION", (model) => { model.duties = {}; }],
  ["lifecycle policies", "MISSING_MODEL_COLLECTION", (model) => {
    model.lifecyclePolicies = {};
  }],
  ["sensitivities", "MISSING_MODEL_COLLECTION", (model) => {
    model.sensitivities = {};
  }],
  ["Option Set values", "INVALID_ENTITY_SHAPE", (model) => {
    model.optionSets[0].values = {};
  }],
  ["metric event IDs", "INVALID_ENTITY_SHAPE", (model) => {
    model.metrics[0].eventIds = {};
  }],
  ["events", "MISSING_MODEL_COLLECTION", (model) => { model.events = {}; }],
  ["NFRs", "MISSING_MODEL_COLLECTION", (model) => { model.nfrs = {}; }],
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
  ["extension page IDs", "PHASE_BOUNDARY_EXECUTABLE_PAGE", (model) => {
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
  assertDeepFrozen(module);
  assert.equal(Object.isFrozen(source), false);
  assert.throws(() => module.objects.push({ id: "DAT-NEW" }), TypeError);
  source.objects.push({ id: "DAT-SOURCE" });
  assert.deepEqual(module.objects, []);
});

test("defineRequirementModel returns an independent clone without defaults", () => {
  const source = { roles: [], modules: [] };
  const model = defineRequirementModel(source);

  assert.deepEqual(model, source);
  assert.notEqual(model, source);
  assert.notEqual(model.roles, source.roles);
  assert.notEqual(model.modules, source.modules);
  assert.deepEqual(Object.keys(model), ["roles", "modules"]);
  assertDeepFrozen(model);
  assert.equal(Object.isFrozen(source), false);
  assert.throws(() => model.roles.push({ id: "ROLE-NEW" }), TypeError);
  source.roles.push({ id: "ROLE-SOURCE" });
  assert.deepEqual(model.roles, []);
});

test("exports one deeply frozen shared catalog and requirement model graph", () => {
  for (const collection of [
    baselineDecisions,
    roles,
    duties,
    lifecyclePolicies,
    sensitivities,
    optionSets,
    events,
    metrics,
    nfrs,
    modules,
    flows,
    aiTasks,
    extensions,
  ]) {
    assertDeepFrozen(collection);
  }
  assertDeepFrozen(requirementModel);
  assert.throws(() => { roles[0].label = "mutated"; }, TypeError);
  assert.throws(() => { requirementModel.metrics[0].target = "mutated"; }, TypeError);
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

test("rejects duplicate IDs from shared catalog collections", () => {
  const model = validFixture();
  model.baselineDecisions = [{
    id: "EVT-TEST-START",
    statement: "duplicate",
    rationale: "duplicate",
    immutable: true,
  }];

  assertHasCode(validateRequirementModel(model), "DUPLICATE_ID");
});

test("includes every required top-level collection in duplicate ID validation", () => {
  for (const collectionName of REQUIRED_COLLECTION_NAMES) {
    const model = validFixture();
    model[collectionName].push({ id: "ROLE-STUDENT" });

    assertHasCode(validateRequirementModel(model), "DUPLICATE_ID");
  }
});

test("rejects metric references to unregistered events", () => {
  const model = validFixture();
  model.metrics[0].eventIds[0] = "EVT-UNKNOWN";

  assertHasCode(validateRequirementModel(model), "MISSING_METRIC_EVENT_REFERENCE");
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
    const field = moduleById(model, "SUB-001").objects[0].fields
      .find(({ id }) => id === "SUB-F001");
    field.valueSource = valueSource;
    if (valueSource.kind === "OBJECT_REF") {
      field.referenceIntegrity = "IDENTITY_ONLY";
    }

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
  moduleById(model, "SUB-001").objects[0].fields[0].referenceIntegrity = "IDENTITY_ONLY";

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
  submissionModule.objects.push(validObject(
    "DAT-SUB-02",
    "ROLE-STUDENT",
    validField("SUB-F003"),
    {
      fields: [
        validField("SUB-F004", {
          dataType: "ID",
          valueSource: { kind: "SYSTEM" },
          mutability: "IMMUTABLE",
          idempotencyRole: "OBJECT_ID",
        }),
        validField("SUB-F003"),
      ],
      states: ["DRAFT"],
    },
  ));
  submissionModule.pages.push(validPage(
    "SUB-W01",
    { objectId: "DAT-SUB-01" },
    ["SUB-F003"],
    [],
  ));

  const errors = validateRequirementModel(model);

  assertHasCode(errors, "INVALID_OBJECT_OWNERSHIP");
});

test("accepts page fields owned by one of its declared objects", () => {
  const model = validFixture();
  const submissionModule = moduleById(model, "SUB-001");
  submissionModule.objects.push(validObject(
    "DAT-SUB-02",
    "ROLE-STUDENT",
    validField("SUB-F003"),
    {
      fields: [
        validField("SUB-F004", {
          dataType: "ID",
          valueSource: { kind: "SYSTEM" },
          mutability: "IMMUTABLE",
          idempotencyRole: "OBJECT_ID",
        }),
        validField("SUB-F003"),
      ],
      states: ["DRAFT"],
    },
  ));
  submissionModule.pages.push(validPage(
    "SUB-W01",
    { objectIds: ["DAT-SUB-01", "DAT-SUB-02"] },
    ["SUB-F003"],
    [],
  ));

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

test("rejects pages that mix objectId and objectIds declarations", () => {
  const model = validFixture();
  moduleById(model, "SUB-001").pages.push(validPage(
    "SUB-W01",
    { objectId: "DAT-SUB-01", objectIds: ["DAT-HW-01"] },
    ["SUB-F001"],
    ["SUB-ACT-01"],
  ));

  assertHasCode(validateRequirementModel(model), "INVALID_PAGE_CONTRACT");
});

test("rejects page and action client exposure mismatches", () => {
  const mutations = [
    (action, page) => { page.clients = [CLIENT.WEB]; },
    (action) => { action.clients = [CLIENT.WEB]; },
  ];

  for (const mutate of mutations) {
    const model = validFixture();
    const module = moduleById(model, "SUB-001");
    mutate(module.actions[0], module.pages[0]);

    assertHasCode(validateRequirementModel(model), "INVALID_CLIENT_EXPOSURE");
  }
});

test("rejects exposing pages that omit non-system action inputs", () => {
  const model = validFixture();
  const module = moduleById(model, "SUB-001");
  module.pages[0].fieldIds = [];
  module.pages.push(validPage(
    "SUB-PAGE-02",
    { objectId: "DAT-SUB-01" },
    ["SUB-F001"],
    ["SUB-ACT-01"],
  ));

  assertHasCode(validateRequirementModel(model), "MISSING_PAGE_ACTION_INPUT");
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
  submissionModule.actions[0].permissions[0] = {
    effect: "ALLOW",
    actorRef: "CURRENT_ACTOR",
    condition: "the current actor owns the target object",
  };
  model.metrics[0].ownerRef = "SYSTEM";

  const errors = validateRequirementModel(model);

  assert.equal(errorCodes(errors).includes("MISSING_ACTOR_REFERENCE"), false);
  assert.equal(errorCodes(errors).includes("ORPHAN_OWNER_ROLE"), false);
});

test("rejects permission subjects that combine or cross actor namespaces", () => {
  const mutations = [
    (permission) => { permission.dutyRef = "DUTY-FIXTURE"; },
    (permission) => {
      delete permission.roleRef;
      permission.roleRef = "CURRENT_ACTOR";
    },
    (permission) => {
      delete permission.roleRef;
      permission.actorRef = "ROLE-STUDENT";
    },
    (permission) => { permission.roleRef = "DUTY-FIXTURE"; },
    (permission) => {
      delete permission.roleRef;
      permission.dutyRef = "ROLE-STUDENT";
    },
    (permission) => { permission.roleRef = 42; },
  ];

  for (const mutate of mutations) {
    const model = validFixture();
    model.duties.push({
      id: "DUTY-FIXTURE",
      roleId: "ROLE-TEACHER",
      label: "fixture duty",
    });
    mutate(moduleById(model, "SUB-001").actions[0].permissions[0]);

    assertHasCode(validateRequirementModel(model), "INVALID_PERMISSION_SUBJECT");
  }
});

test("rejects every permission key outside the closed permission shape", () => {
  const invalidProperties = [
    ["actorRefs", ["CURRENT_ACTOR"]],
    ["roleRefs", ["ROLE-STUDENT"]],
    ["dutyRefs", ["DUTY-FIXTURE"]],
    ["ownerRef", "ROLE-STUDENT"],
    ["producerRef", "ROLE-STUDENT"],
    ["confirmerRef", "ROLE-TEACHER"],
    ["stewardRef", "ROLE-TEACHER"],
    ["unknownKey", "unexpected"],
  ];

  for (const [property, value] of invalidProperties) {
    const model = validFixture();
    model.duties.push({
      id: "DUTY-FIXTURE",
      roleId: "ROLE-TEACHER",
      label: "fixture duty",
    });
    moduleById(model, "SUB-001").actions[0].permissions[0][property] = value;

    assertHasCode(validateRequirementModel(model), "INVALID_PERMISSION_SUBJECT");
  }
});

test("rejects role and duty references from the wrong actor namespace", () => {
  const model = validFixture();
  model.duties.push({
    id: "DUTY-FIXTURE",
    roleId: "ROLE-TEACHER",
    label: "fixture duty",
  });
  moduleById(model, "SUB-001").actions[0].permissions = [
    { effect: "ALLOW", roleRef: "DUTY-FIXTURE", condition: "wrong namespace" },
    { effect: "DENY", dutyRef: "ROLE-TEACHER", condition: "wrong namespace" },
  ];

  assert.equal(
    errorCodes(validateRequirementModel(model))
      .filter((code) => code === "MISSING_ACTOR_REFERENCE").length,
    2,
  );
});

test("rejects unknown lifecycle retention and NFR owner references", () => {
  const model = validFixture();
  model.lifecyclePolicies = [{
    id: "LIFE-TEST",
    scope: "fixture",
    writeRule: "fixture",
    historyRule: "fixture",
    retentionOwner: "ROLE-RETENTION-MISSING",
    expiryOrArchival: "fixture",
  }];
  model.nfrs = [{
    id: "NFR-TEST",
    ownerRef: "ROLE-NFR-MISSING",
    statement: "fixture",
    verification: "fixture",
  }];

  const errors = validateRequirementModel(model);

  assert.equal(
    errorCodes(errors).filter((code) => code === "MISSING_ACTOR_REFERENCE").length,
    2,
  );
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
  model.extensions.push(validExtension());

  assert.deepEqual(validateRequirementModel(model), []);
});

for (const [property, value] of [
  ["pageIds", ["EXT-W01"]],
  ["actionIds", ["EXT-ACT-01"]],
  ["pages", [{ id: "EXT-W01" }]],
  ["actions", [{ id: "EXT-ACT-01" }]],
  ["flows", ["DF-EXT"]],
  ["moduleIds", ["EXT-MODULE"]],
  ["aiTasks", ["AI-EXT"]],
  ["routes", ["/extension"]],
  ["commands", ["run-extension"]],
  ["page", { id: "EXT-W01" }],
  ["action", { id: "EXT-ACT-01" }],
  ["pageId", "EXT-W01"],
  ["actionId", "EXT-ACT-01"],
]) {
  test(`rejects executable extension ${property}`, () => {
    const model = validFixture();
    model.extensions.push(validExtension({ [property]: value }));

    const errors = validateRequirementModel(model);

    assertHasCode(errors, "PHASE_BOUNDARY_EXECUTABLE_PAGE");
  });
}

test("rejects unknown extension metadata keys", () => {
  const model = validFixture();
  model.extensions.push(validExtension({ metadata: { owner: "future" } }));

  assertHasCode(validateRequirementModel(model), "INVALID_EXTENSION_SCHEMA");
});

test("rejects invalid extension phase, status, and metadata arrays", () => {
  const mutations = [
    (extension) => { extension.phase = 1; },
    (extension) => { extension.status = "ACTIVE"; },
    (extension) => { extension.label = ""; },
    (extension) => { extension.dependencies = []; },
    (extension) => { extension.entryCriteria = ["same", "same"]; },
    (extension) => { extension.excludedFirstStageBehavior = [42]; },
  ];

  for (const mutate of mutations) {
    const model = validFixture();
    const extension = validExtension();
    mutate(extension);
    model.extensions.push(extension);

    assertHasCode(validateRequirementModel(model), "INVALID_EXTENSION_SCHEMA");
  }
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

for (const previewFieldId of ["SUB-F003", "HW-F001"]) {
  test(`rejects unrelated AI write preview field ${previewFieldId}`, () => {
    const model = validFixture();
    model.duties.push({
      id: "DUTY-SUBJECT-TEACHER",
      roleId: "ROLE-TEACHER",
    });
    moduleById(model, "SUB-001").objects[0].fields.push(validField("SUB-F003"));
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
  submissionModule.actions[0].outputFieldIds = ["SUB-F001", "SUB-F002"];
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

test("rejects a conversion series missing a start/success pair", () => {
  const model = validMultiSeriesConversionModel();
  const metric = model.metrics[0];
  delete metric.series[0].successEventId;

  assertHasCode(validateRequirementModel(model), "INVALID_METRIC_SERIES");
});

test("rejects a conversion series that reuses an event", () => {
  const model = validMultiSeriesConversionModel();
  const metric = model.metrics[0];
  metric.series[1].startEventId = metric.series[0].startEventId;

  assertHasCode(validateRequirementModel(model), "INVALID_METRIC_SERIES");
});

test("rejects a conversion series without a correlation key", () => {
  const model = validMultiSeriesConversionModel();
  const metric = model.metrics[0];
  delete metric.series[1].correlationKey;

  assertHasCode(validateRequirementModel(model), "INVALID_METRIC_SERIES");
});

test("rejects a conversion series that omits one metric path", () => {
  const model = validMultiSeriesConversionModel();
  const metric = model.metrics[0];
  metric.series.pop();

  assertHasCode(validateRequirementModel(model), "INVALID_METRIC_SERIES");
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
    model.events = eventIds.map((id) => ({
      id,
      label: id,
      definition: `${aggregation} fixture event`,
    }));

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
    "INVALID_PERMISSION_SUBJECT SUB-ACT-01 requires user ALLOW for USER_TASK execution",
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
