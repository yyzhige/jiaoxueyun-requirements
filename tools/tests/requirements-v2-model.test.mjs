import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import {
  assertValidRequirementModel,
  validateRequirementModel,
} from "../requirements-v2/validate/index.mjs";
import * as modelValidatorExports from "../requirements-v2/validate/model-validator.mjs";
import * as requirementModelExports from "../requirements-v2/model.mjs";
import * as aiReportingFactExports from "../requirements-v2/facts/ai-reporting.mjs";
import * as extensionFactExports from "../requirements-v2/facts/extensions.mjs";
import * as foundationFactExports from "../requirements-v2/facts/foundation.mjs";
import * as teachingLoopFactExports from "../requirements-v2/facts/teaching-loop.mjs";
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
  reviewStatus,
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
    studentDataClassification: {
      kind: "NONE",
      privilegedReadPolicy: "NOT_APPLICABLE",
    },
    readMode: "AUTHORIZED",
    stateReachability: { mode: "ACTION_GRAPH", initialStateIds: ["DRAFT"] },
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
    capability: "CONTROLLED",
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

function validAiTask(id, overrides = {}) {
  return {
    id,
    taskType: "CONTROLLED_ACTION",
    capability: "CONTROLLED",
    roleRefs: ["ROLE-STUDENT"],
    dutyRefs: [],
    clients: [CLIENT.WEB, CLIENT.APP],
    naturalLanguageExamples: ["Create a structured draft for my authorized scope"],
    parameterSchema: {
      type: "object",
      required: ["content"],
      properties: {
        content: { type: "string" },
      },
      additionalProperties: false,
    },
    clarificationRules: [{
      whenMissing: ["content"],
      prompt: "Which content should be included?",
      blocksExecution: true,
    }],
    actionId: "SUB-ACT-01",
    risk: RISK.LOW,
    writes: true,
    previewFieldIds: ["SUB-F001"],
    confirmerRef: "DUTY-SUBJECT-TEACHER",
    confirmer: {
      mode: "DUTY",
      dutyRef: "DUTY-SUBJECT-TEACHER",
    },
    resultSchema: {
      type: "object",
      required: ["data", "sourceVersions", "permissionResult"],
      properties: {
        data: { type: "object" },
        sourceVersions: { type: "array", items: { type: "object" } },
        permissionResult: { type: "string" },
      },
      additionalProperties: false,
    },
    failureBehavior: {
      mode: "FAIL_CLOSED",
      preservesBusinessFacts: true,
      manualFallback: "continue through the target module's manual product path",
    },
    studentAccessPolicy: {
      answer: "OPEN_CONTENT_ONLY",
      explanation: "OPEN_CONTENT_ONLY",
      score: "OPEN_CONTENT_ONLY",
      feedback: "OPEN_CONTENT_ONLY",
      sourceVersionRequired: true,
    },
    reversibility: {
      mode: "TARGET_ACTION_POLICY",
      instructions: "follow the target action's versioned correction or cancellation policy",
    },
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
  model.flows[0].steps[0].providedInputs[0].provider = { actorRef: "SYSTEM" };
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
    idempotencyRole: "OBJECT_VERSION",
  });
  const submissionFanoutField = validField("SUB-F090", {
    dataType: "STRING_ARRAY",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "FANOUT_SET",
  });
  const submissionScenarios = [
    validScenario("SUB-SCN-01", "SUB-ACT-01", "SUCCESS"),
    validScenario("SUB-SCN-02", "SUB-ACT-01", "BOUNDARY"),
    validScenario("SUB-SCN-03", "SUB-ACT-01", "FAILURE", {
      resultCode: "VERSION_CONFLICT",
    }),
  ];
  return {
    profile: "GENERIC",
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
        fields: [
          submissionIdentityField,
          submissionField,
          submissionVersionField,
          submissionFanoutField,
        ],
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
        stateReachability: {
          mode: "ACTION_GRAPH",
          initialStateIds: ["DRAFT"],
        },
      })],
      relationships: [],
      actions: [],
      pages: [],
      scenarios: [],
    }, {
      id: "REPORT-TEST",
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
      contractProfile: "GENERIC",
      routingPolicy: "NONE",
      moduleIds: ["SUB-001"],
      steps: [{
        order: 1,
        actionId: "SUB-ACT-01",
        providedInputs: [{
          fieldId: "SUB-F001",
          provider: { roleRef: "ROLE-STUDENT" },
        }],
      }],
      sourceDataRefs: [{
        objectId: "DAT-SUB-01",
        fieldId: "SUB-F000",
        version: "SUB-F002",
        cardinality: "ONE",
      }, {
        objectId: "DAT-SUB-01",
        fieldId: "SUB-F090",
        version: "SUB-F002",
        cardinality: "ONE",
      }],
      targetDataRefs: [{ objectId: "DAT-SUB-01", fieldId: "SUB-F001", version: "SUB-F002" }],
      idempotencyKeyParts: {
        identityFieldIds: ["SUB-F000"],
        versionFieldIds: ["SUB-F002"],
        fanoutFieldId: "SUB-F090",
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
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
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

function guardedLineageFixture(stateGuardPolicy, operationKind) {
  const model = validFixture();
  addLineageBindingFixture(model);
  const action = moduleById(model, "SUB-001").actions[0];
  const refField = model.modules[0].objects[0].fields
    .find(({ id }) => id === "SUB-F003");
  refField.stateGuardPolicy = stateGuardPolicy;
  refField.actionApplicability.requiredActionIds = [action.id];
  action.operationKind = operationKind;
  action.outputFieldIds.push("SUB-F003");
  action.relatedStateGuards = [{
    refFieldId: "SUB-F003",
    versionFieldId: "SUB-F002",
    targetObjectId: "DAT-HW-01",
    requiredState: "DRAFT",
  }];
  if (operationKind === "CREATE") {
    delete action.transition;
    action.successState = "SUBMITTED";
    action.outputFieldIds.push("SUB-F000");
  }
  return model;
}

function addExclusiveSourceGroupsFixture(model) {
  const submission = moduleById(model, "SUB-001");
  const submissionObject = submission.objects[0];
  for (const fieldId of ["SUB-F003", "SUB-F004", "SUB-F005", "SUB-F006"]) {
    submissionObject.fields.push(validField(fieldId, {
      required: {
        description: "required for the selected source alternative",
        whenStates: ["SUBMITTED"],
        whenActionIds: ["SUB-ACT-01"],
      },
    }));
  }
  submissionObject.exclusiveSourceGroups = [
    { id: "PLAN", fieldIds: ["SUB-F003", "SUB-F004"] },
    { id: "ASSIGNMENT", fieldIds: ["SUB-F005", "SUB-F006"] },
  ];
  const action = submission.actions[0];
  action.operationKind = "CREATE";
  delete action.transition;
  action.outputFieldIds = [
    "SUB-F000",
    "SUB-F001",
    "SUB-F002",
    "SUB-F003",
    "SUB-F004",
  ];
}

function addFutureFlowOutputFixture(model) {
  const submission = moduleById(model, "SUB-001");
  submission.objects[0].fields.push(validField("SUB-F003"));
  submission.actions[0].inputFieldIds.push("SUB-F003");
  submission.pages[0].fieldIds.push("SUB-F003");
  const scenarios = [
    validScenario("SUB-FUTURE-SCN-SUCCESS", "SUB-ACT-FUTURE", "SUCCESS"),
    validScenario("SUB-FUTURE-SCN-BOUNDARY", "SUB-ACT-FUTURE", "BOUNDARY"),
    validScenario("SUB-FUTURE-SCN-FAILURE", "SUB-ACT-FUTURE", "FAILURE", {
      resultCode: "VERSION_CONFLICT",
    }),
  ];
  submission.actions.push(validAction(
    "SUB-ACT-FUTURE",
    "DAT-SUB-01",
    [],
    scenarios.map(({ id }) => id),
    { outputFieldIds: ["SUB-F003"] },
  ));
  submission.scenarios.push(...scenarios);
  submission.pages[0].actionIds.push("SUB-ACT-FUTURE");
  model.flows[0].steps.push({ order: 2, actionId: "SUB-ACT-FUTURE" });
}

function actorProvidedInputFixture() {
  return validFixture();
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

test("accepts boolean or structured conditional field required rules", () => {
  for (const required of [
    true,
    false,
    {
      description: "required when the submission reaches SUBMITTED",
      whenStates: ["SUBMITTED"],
    },
  ]) {
    const model = validFixture();
    moduleById(model, "SUB-001").objects[0].fields[1].required = required;

    assert.deepEqual(validateRequirementModel(model), []);
  }
});

test("rejects legacy and malformed conditional field required rules", () => {
  const mutations = [
    ["legacy string", "required when the object reaches SUBMITTED"],
    ["empty states", { description: "conditional", whenStates: [] }],
    ["duplicate states", {
      description: "conditional",
      whenStates: ["SUBMITTED", "SUBMITTED"],
    }],
    ["unknown state", { description: "conditional", whenStates: ["MISSING"] }],
    ["extra key", {
      description: "conditional",
      whenStates: ["SUBMITTED"],
      extra: true,
    }],
  ];
  const missedMutations = [];
  for (const [name, required] of mutations) {
    const model = validFixture();
    moduleById(model, "SUB-001").objects[0].fields[0].required = required;
    if (!errorCodes(validateRequirementModel(model)).includes("INVALID_FIELD_CONTRACT")) {
      missedMutations.push(name);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("validates action-specific required rule bindings", () => {
  const validModel = validFixture();
  moduleById(validModel, "SUB-001").objects[0].fields[1].required = {
    description: "required for the fixture action",
    whenStates: ["SUBMITTED"],
    whenActionIds: ["SUB-ACT-01"],
  };
  assert.deepEqual(validateRequirementModel(validModel), []);

  const mutations = [
    ["unknown action", "SUB-ACT-MISSING"],
    ["cross-module action", "CORR-ACT-RESUBMIT"],
  ];
  const missedMutations = [];
  for (const [name, actionId] of mutations) {
    const model = structuredClone(validModel);
    model.modules[0].objects[0].fields[1].required.whenActionIds = [actionId];
    if (!errorCodes(validateRequirementModel(model)).includes("INVALID_FIELD_CONTRACT")) {
      missedMutations.push(name);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("requires action-level coverage for action-specific required fields", () => {
  const mutations = [
    ["HW-ACT-REVISE", "HW-ASSIGNMENT-F-REVISION-REASON"],
    ["PLN-ACT-CLOSE-PLAN", "PLN-PLAN-F-CLOSE-REASON"],
    ["STU-ACT-SAVE-VIEW", "STU-PROFILE-F-SAVED-VIEW-DEFINITION"],
  ];
  const missedMutations = [];
  for (const [actionId, fieldId] of mutations) {
    const model = structuredClone(requirementModel);
    const action = model.modules.flatMap(({ actions }) => actions)
      .find(({ id }) => id === actionId);
    action.inputFieldIds = action.inputFieldIds.filter((id) => id !== fieldId);
    action.outputFieldIds = action.outputFieldIds.filter((id) => id !== fieldId);
    if (!errorCodes(validateRequirementModel(model)).includes("INVALID_ACTION_REQUIRED_FIELD")) {
      missedMutations.push(actionId);
    }
  }
  assert.deepEqual(missedMutations, []);
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
  const reportField = moduleById(model, "REPORT-TEST").objects[0].fields[0];
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
  assert.equal(objectRefs.length, 69);
  assert.equal(objectRefs.filter(({ field }) => (
    field.referenceIntegrity === "VERSION_PINNED"
  )).length, 52);
  assert.equal(objectRefs.filter(({ field }) => (
    field.referenceIntegrity === "IDENTITY_ONLY"
  )).length, 17);

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

test("requires closed accepted Option Set values on action inputs", () => {
  const validModel = validFixture();
  validModel.modules[0].actions[0].acceptedInputValues = [{
    fieldId: "SUB-F001",
    optionSetId: "OPT-BOOL",
    partitionId: "SUBMISSION_DECISION",
    codes: ["YES"],
  }];
  assertNoCode(validateRequirementModel(validModel), "INVALID_ACTION_CONTRACT");
  assertNoCode(validateRequirementModel(validModel), "INVALID_ACTION_INPUT_VALUES");

  const malformed = structuredClone(validModel);
  malformed.modules[0].actions[0].acceptedInputValues[0].extra = true;
  assertHasCode(validateRequirementModel(malformed), "INVALID_ACTION_CONTRACT");

  const wrongReference = structuredClone(validModel);
  wrongReference.modules[0].actions[0].acceptedInputValues[0].optionSetId = "OPT-MISSING";
  assertHasCode(validateRequirementModel(wrongReference), "INVALID_ACTION_INPUT_VALUES");
});

test("requires closed version-pinned related state guards on actions", () => {
  const validModel = guardedLineageFixture("CREATE_REQUIRED", "CREATE");
  const action = moduleById(validModel, "SUB-001").actions[0];
  assertNoCode(validateRequirementModel(validModel), "INVALID_ACTION_CONTRACT");
  assertNoCode(validateRequirementModel(validModel), "INVALID_ACTION_STATE_GUARD");

  const malformed = structuredClone(validModel);
  malformed.modules[0].actions[0].relatedStateGuards[0].extra = true;
  assertHasCode(validateRequirementModel(malformed), "INVALID_ACTION_CONTRACT");

  const mutations = [
    (model) => {
      model.modules[0].actions[0].relatedStateGuards[0].requiredState = "MISSING";
    },
    (model) => {
      model.modules[0].actions[0].outputFieldIds = model.modules[0].actions[0]
        .outputFieldIds.filter((fieldId) => fieldId !== "SUB-F003");
    },
    (model) => {
      model.modules[0].objects[0].lineageBindings[0].targetVersionFieldId = "HW-F000";
    },
  ];
  for (const mutate of mutations) {
    const model = structuredClone(validModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_ACTION_STATE_GUARD");
  }
});

test("accepts action applicability for every compatible state guard policy operation", () => {
  const rejectedCombinations = [];
  for (const [stateGuardPolicy, operationKind] of [
    ["UPDATE_REQUIRED", "UPDATE"],
    ["ALWAYS_REQUIRED", "CREATE"],
    ["ALWAYS_REQUIRED", "UPDATE"],
  ]) {
    const model = guardedLineageFixture(stateGuardPolicy, operationKind);
    if (errorCodes(validateRequirementModel(model)).includes("INVALID_ACTION_STATE_GUARD")) {
      rejectedCombinations.push(`${stateGuardPolicy}/${operationKind}`);
    }
  }
  assert.deepEqual(rejectedCombinations, []);
});

test("rejects action applicability when operation does not match guard policy", () => {
  for (const [stateGuardPolicy, operationKind] of [
    ["UPDATE_REQUIRED", "CREATE"],
    ["CREATE_REQUIRED", "UPDATE"],
  ]) {
    const model = guardedLineageFixture(stateGuardPolicy, operationKind);
    assertHasCode(validateRequirementModel(model), "INVALID_ACTION_STATE_GUARD");
  }
});

test("requires an explicit closed state guard policy on every version-pinned reference", () => {
  const validModel = validFixture();
  addLineageBindingFixture(validModel);
  assertNoCode(validateRequirementModel(validModel), "INVALID_FIELD_CONTRACT");

  const missingPolicy = structuredClone(validModel);
  delete missingPolicy.modules[0].objects[0].fields
    .find(({ id }) => id === "SUB-F003").stateGuardPolicy;
  assertHasCode(validateRequirementModel(missingPolicy), "INVALID_FIELD_CONTRACT");

  const invalidPolicy = structuredClone(validModel);
  invalidPolicy.modules[0].objects[0].fields
    .find(({ id }) => id === "SUB-F003").stateGuardPolicy = "OPTIONAL";
  assertHasCode(validateRequirementModel(invalidPolicy), "INVALID_FIELD_CONTRACT");

  const identityOnlyPolicy = validFixture();
  const identityOnlyRef = validField("SUB-F003", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "DAT-HW-01" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
    stateGuardPolicy: "NONE",
  });
  identityOnlyPolicy.modules[0].objects[0].fields.push(identityOnlyRef);
  assertHasCode(validateRequirementModel(identityOnlyPolicy), "INVALID_FIELD_CONTRACT");
});

test("matches user CREATE subjects to object producers while allowing system Flow creation", () => {
  const makeCreate = (model) => {
    const action = moduleById(model, "SUB-001").actions[0];
    action.operationKind = "CREATE";
    delete action.transition;
    action.outputFieldIds = ["SUB-F000", "SUB-F001", "SUB-F002"];
    return action;
  };

  const matchingProducer = validFixture();
  makeCreate(matchingProducer);
  assertNoCode(validateRequirementModel(matchingProducer), "INVALID_CREATE_PRODUCER");

  const mismatchedProducer = structuredClone(matchingProducer);
  moduleById(mismatchedProducer, "SUB-001").objects[0].producerRef = "ROLE-TEACHER";
  assertHasCode(validateRequirementModel(mismatchedProducer), "INVALID_CREATE_PRODUCER");

  const systemFlowProducer = validFixture();
  const systemAction = makeCreate(systemFlowProducer);
  systemAction.executionMode = "FLOW_INTERNAL";
  systemAction.trigger = { kind: "FLOW", flowIds: ["DF-TEST"] };
  delete systemAction.clients;
  systemAction.permissions = [
    { effect: "ALLOW", actorRef: "SYSTEM", condition: "the verified Flow invokes it" },
    { effect: "DENY", actorRef: "CURRENT_ACTOR", condition: "users cannot invoke it" },
  ];
  systemFlowProducer.flows[0].steps[0].providedInputs[0].provider = {
    actorRef: "SYSTEM",
  };
  moduleById(systemFlowProducer, "SUB-001").pages[0].actionIds = [];
  for (const scenario of moduleById(systemFlowProducer, "SUB-001").scenarios) {
    delete scenario.pageId;
    scenario.trigger = { kind: "FLOW", flowIds: ["DF-TEST"] };
  }
  assertNoCode(validateRequirementModel(systemFlowProducer), "INVALID_CREATE_PRODUCER");
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
    .filter(({ operationKind }) => operationKind === "CREATE").length, 103);
  assert.deepEqual(
    moduleById(requirementModel, "CONTENT-001").actions
      .filter(({ targetObjectId, operationKind }) => (
        targetObjectId === "CONTENT-OBJ-PERMISSION" && operationKind === "CREATE"
      ))
      .map(({ id }) => id),
    [
      "CONTENT-ACT-CREATE-SCHOOL-PERMISSION",
      "CONTENT-ACT-CREATE-SUBJECT-PERMISSION",
      "CONTENT-ACT-CREATE-COURSE-PERMISSION",
    ],
  );

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

test("requires every CREATE action to cover unconditional target fields without ID allowlists", () => {
  const objectById = new Map(modules.flatMap((module) => (
    module.objects.map((object) => [object.id, object])
  )));
  const violations = modules.flatMap((module) => module.actions
    .filter(({ operationKind }) => operationKind === "CREATE")
    .flatMap((action) => {
      const covered = new Set([...action.inputFieldIds, ...action.outputFieldIds]);
      return objectById.get(action.targetObjectId).fields
        .filter(({ required }) => required === true)
        .filter(({ id }) => !covered.has(id))
        .map(({ id }) => `${action.id}:${id}`);
    }));
  assert.deepEqual(violations, []);
});

test("requires exclusive source groups to use a closed unique non-empty object shape", () => {
  const validModel = validFixture();
  addExclusiveSourceGroupsFixture(validModel);
  assertNoCode(validateRequirementModel(validModel), "INVALID_OBJECT_CONTRACT");

  const mutations = [
    (object) => { object.exclusiveSourceGroups = {}; },
    (object) => { object.exclusiveSourceGroups = [object.exclusiveSourceGroups[0]]; },
    (object) => { object.exclusiveSourceGroups[0].legacy = true; },
    (object) => { delete object.exclusiveSourceGroups[0].id; },
    (object) => { object.exclusiveSourceGroups[0].fieldIds = []; },
    (object) => { object.exclusiveSourceGroups[1].id = "PLAN"; },
    (object) => { object.exclusiveSourceGroups[0].fieldIds = ["SUB-F003", "SUB-F003"]; },
  ];
  for (const mutate of mutations) {
    const model = structuredClone(validModel);
    mutate(moduleById(model, "SUB-001").objects[0]);
    assertHasCode(validateRequirementModel(model), "INVALID_OBJECT_CONTRACT");
  }
});

test("requires CREATE actions to cover exactly one complete exclusive source group", () => {
  const validModel = validFixture();
  addExclusiveSourceGroupsFixture(validModel);
  assertNoCode(validateRequirementModel(validModel), "INVALID_ACTION_CONTRACT");

  const mutations = [
    (action) => {
      action.outputFieldIds = action.outputFieldIds
        .filter((fieldId) => !["SUB-F003", "SUB-F004"].includes(fieldId));
    },
    (action) => { action.outputFieldIds.push("SUB-F005", "SUB-F006"); },
    (action) => {
      action.outputFieldIds = action.outputFieldIds
        .filter((fieldId) => fieldId !== "SUB-F004");
    },
  ];
  for (const mutate of mutations) {
    const model = structuredClone(validModel);
    mutate(moduleById(model, "SUB-001").actions[0]);
    assertHasCode(validateRequirementModel(model), "INVALID_ACTION_CONTRACT");
  }

  const foreignFieldModel = structuredClone(validModel);
  moduleById(foreignFieldModel, "SUB-001").objects[0]
    .exclusiveSourceGroups[0].fieldIds[0] = "HW-F001";
  assertHasCode(validateRequirementModel(foreignFieldModel), "INVALID_OBJECT_CONTRACT");
});

test("rejects a CREATE action that omits an unconditional target field", () => {
  const model = validFixture();
  const createAction = moduleById(model, "SUB-001").actions[0];
  createAction.operationKind = "CREATE";
  delete createAction.transition;
  createAction.inputFieldIds = [];
  createAction.outputFieldIds = ["SUB-F000", "SUB-F002"];

  assertHasCode(validateRequirementModel(model), "INVALID_ACTION_CONTRACT");
});

test("does not treat state-conditional required fields as unconditional CREATE inputs", () => {
  const model = validFixture();
  const submission = moduleById(model, "SUB-001");
  const conditionalField = submission.objects[0].fields
    .find(({ id }) => id === "SUB-F001");
  const createAction = submission.actions[0];
  conditionalField.required = {
    description: "required when the object reaches SUBMITTED",
    whenStates: ["SUBMITTED"],
  };
  createAction.operationKind = "CREATE";
  delete createAction.transition;
  createAction.inputFieldIds = [];
  createAction.outputFieldIds = ["SUB-F000", "SUB-F002"];

  assertNoCode(validateRequirementModel(model), "INVALID_ACTION_CONTRACT");
});

test("aggregates malformed CREATE target fields without throwing", () => {
  const mutations = [
    [null, "INVALID_ENTITY_SHAPE"],
    [undefined, "MALFORMED_MODEL"],
  ];
  for (const [invalidField, structureCode] of mutations) {
    const model = structuredClone(requirementModel);
    const grade = moduleById(model, "ORG-001").objects
      .find(({ id }) => id === "ORG-OBJ-GRADE");
    grade.fields[0] = invalidField;

    let errors;
    assert.doesNotThrow(() => {
      errors = validateRequirementModel(model);
    });
    assertHasCode(errors, structureCode);
    assertHasCode(errors, "INVALID_ACTION_OPERATION");
  }
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

test("rejects one event routing overlapping transitions to mutually exclusive states", () => {
  const model = structuredClone(requirementModel);
  const identity = moduleById(model, "IAM-001");
  const expiry = identity.actions.find(({ id }) => id === "IAM-ACT-EXPIRE-GRANT");
  const revoke = identity.actions.find(({ id }) => id === "IAM-ACT-REVOKE-GRANT");
  const expiryEvent = model.events.find(({ id }) => id === "EVT-TEMP-GRANT-EXPIRY-REACHED");

  revoke.targetObjectId = expiry.targetObjectId;
  revoke.executionMode = "SYSTEM_EVENT";
  delete revoke.clients;
  revoke.permissions = structuredClone(expiry.permissions);
  revoke.trigger = structuredClone(expiry.trigger);
  identity.pages.forEach((page) => {
    page.actionIds = page.actionIds.filter((actionId) => actionId !== revoke.id);
  });
  identity.scenarios
    .filter(({ actionId }) => actionId === revoke.id)
    .forEach((scenario) => {
      delete scenario.pageId;
      scenario.trigger = structuredClone(expiry.trigger);
    });
  expiryEvent.triggeredActionIds.push(revoke.id);

  assertHasCode(validateRequirementModel(model), "INVALID_EVENT_ACTION_ROUTING");
});

test("rejects an implicit same-event CREATE then UPDATE chain", () => {
  const model = structuredClone(requirementModel);
  const audit = moduleById(model, "AUD-001");
  const append = audit.actions.find(({ id }) => id === "AUD-ACT-APPEND-EVENT");
  const archive = audit.actions.find(({ id }) => id === "AUD-ACT-ARCHIVE-EVENT");
  const appendEvent = model.events.find(({ id }) => id === "EVT-AUDIT-APPEND-REQUESTED");
  const archiveEvent = model.events.find(({ id }) => id === "EVT-AUDIT-RETENTION-REACHED");

  archive.trigger = structuredClone(append.trigger);
  audit.scenarios
    .filter(({ actionId }) => actionId === archive.id)
    .forEach((scenario) => {
      scenario.trigger = structuredClone(append.trigger);
    });
  appendEvent.triggeredActionIds.push(archive.id);
  archiveEvent.triggeredActionIds = archiveEvent.triggeredActionIds
    .filter((actionId) => actionId !== archive.id);

  assertHasCode(validateRequirementModel(model), "INVALID_EVENT_ACTION_ROUTING");
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
  models[1].flows[0].steps[0].providedInputs[0].provider = {
    actorRef: "CURRENT_ACTOR",
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
  models[2].flows[0].steps[0].providedInputs[0].provider = {
    dutyRef: "DUTY-FIXTURE",
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
  const targetObject = moduleById(model, "SUB-001").objects[0];
  targetObject.states = ["SUBMITTED"];
  targetObject.stateReachability.initialStateIds = [];
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

test("requires closed structured Flow execution paths", () => {
  const validModel = validFixture();
  validModel.flows[0].routingPolicy = "ACTION_CHOICE_REQUIRED";
  validModel.flows[0].executionPaths = [{
    id: "PRIMARY",
    stepOrders: [1],
    providedInputs: [{
      stepOrder: 1,
      fieldId: "SUB-F001",
      provider: { roleRef: "ROLE-STUDENT" },
    }],
    route: { kind: "ACTION_CHOICE", consumerStepOrder: 1 },
  }];
  assertNoCode(validateRequirementModel(validModel), "INVALID_FLOW_CONTRACT");

  const mutations = [
    (path) => { path.extra = true; },
    (path) => { path.stepOrders = [1, 1]; },
    (path) => { path.stepOrders = [2]; },
    (path) => { path.providedInputs[0].extra = true; },
    (path) => { path.providedInputs[0].stepOrder = 2; },
  ];
  for (const mutate of mutations) {
    const model = structuredClone(validModel);
    mutate(model.flows[0].executionPaths[0]);
    assertHasCode(validateRequirementModel(model), "INVALID_FLOW_CONTRACT");
  }

  const malformedStep = structuredClone(validModel);
  malformedStep.flows[0].steps[0] = null;
  assert.doesNotThrow(() => validateRequirementModel(malformedStep));
  assertHasCode(validateRequirementModel(malformedStep), "INVALID_FLOW_CONTRACT");
});

test("requires a mandatory closed route on every execution path", () => {
  const validModel = validFixture();
  validModel.flows[0].routingPolicy = "OPTION_VALUE_REQUIRED";
  validModel.modules[0].actions[0].acceptedInputValues = [{
    fieldId: "SUB-F001",
    optionSetId: "OPT-BOOL",
    partitionId: "SUBMISSION_DECISION",
    codes: ["YES"],
  }];
  validModel.flows[0].executionPaths = [{
    id: "YES_PATH",
    stepOrders: [1],
    providedInputs: [],
    route: {
      kind: "OPTION_VALUE",
      fieldId: "SUB-F001",
      values: ["YES"],
      consumerStepOrder: 1,
    },
  }];
  assertNoCode(validateRequirementModel(validModel), "INVALID_FLOW_CONTRACT");
  assertNoCode(validateRequirementModel(validModel), "INVALID_FLOW_BRANCH");

  const malformed = structuredClone(validModel);
  malformed.flows[0].executionPaths[0].route.extra = true;
  assertHasCode(validateRequirementModel(malformed), "INVALID_FLOW_CONTRACT");

  const missingRoute = structuredClone(validModel);
  delete missingRoute.flows[0].executionPaths[0].route;
  assertHasCode(validateRequirementModel(missingRoute), "INVALID_FLOW_CONTRACT");

  const unknownValue = structuredClone(validModel);
  unknownValue.flows[0].executionPaths[0].route.values = ["UNKNOWN"];
  assertHasCode(validateRequirementModel(unknownValue), "INVALID_FLOW_BRANCH");

  const overlapping = structuredClone(validModel);
  overlapping.flows[0].executionPaths.push({
    id: "ALSO_YES",
    stepOrders: [1],
    providedInputs: [],
    route: {
      kind: "OPTION_VALUE",
      fieldId: "SUB-F001",
      values: ["YES"],
      consumerStepOrder: 1,
    },
  });
  assertHasCode(validateRequirementModel(overlapping), "INVALID_FLOW_BRANCH");
});

test("binds every DF-007 path to one explicit action choice", () => {
  const flow = flows.find(({ id }) => id === "DF-007");
  assert.deepEqual(flow.executionPaths.map(({ id, route }) => ({ id, route })), [
    { id: "ACCEPT_SUGGESTION", route: { kind: "ACTION_CHOICE", consumerStepOrder: 2 } },
    {
      id: "CORRECT_RECOGNITION_AND_ACCEPT",
      route: { kind: "ACTION_CHOICE", consumerStepOrder: 2 },
    },
    { id: "OVERRIDE_SCORE", route: { kind: "ACTION_CHOICE", consumerStepOrder: 3 } },
    {
      id: "CORRECT_RECOGNITION_AND_OVERRIDE",
      route: { kind: "ACTION_CHOICE", consumerStepOrder: 3 },
    },
    { id: "MANUAL_GRADE", route: { kind: "ACTION_CHOICE", consumerStepOrder: 4 } },
    { id: "BATCH_CONFIRM", route: { kind: "ACTION_CHOICE", consumerStepOrder: 5 } },
    {
      id: "RESOLVE_VERSION_CONFLICT",
      route: { kind: "ACTION_CHOICE", consumerStepOrder: 6 },
    },
  ]);
});

test("partitions the complete DF-010 judgment domain across actions and paths", () => {
  const correction = moduleById(requirementModel, "CORR-001");
  const actionById = new Map(correction.actions.map((action) => [action.id, action]));
  const acceptedCodes = (actionId) => actionById.get(actionId)
    ?.acceptedInputValues?.find(({ fieldId }) => (
      fieldId === "CORR-ATTEMPT-F-TEACHER-JUDGMENT"
    ))?.codes;
  assert.deepEqual(acceptedCodes("CORR-ACT-CONFIRM-JUDGMENT"), ["PASSED", "CLOSED"]);
  assert.deepEqual(acceptedCodes("CORR-ACT-REQUEST-RETRY"), [
    "NOT-PASSED",
    "NEEDS-MORE",
  ]);

  const flow = flows.find(({ id }) => id === "DF-010");
  assert.deepEqual(flow.executionPaths.map(({ id, route }) => ({ id, route })), [
    {
      id: "PASSED",
      route: {
        kind: "OPTION_VALUE",
        fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
        values: ["PASSED"],
        consumerStepOrder: 3,
      },
    },
    {
      id: "CLOSED",
      route: {
        kind: "OPTION_VALUE",
        fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
        values: ["CLOSED"],
        consumerStepOrder: 3,
      },
    },
    {
      id: "NOT_PASSED",
      route: {
        kind: "OPTION_VALUE",
        fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
        values: ["NOT-PASSED"],
        consumerStepOrder: 4,
      },
    },
    {
      id: "NEEDS_MORE",
      route: {
        kind: "OPTION_VALUE",
        fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
        values: ["NEEDS-MORE"],
        consumerStepOrder: 4,
      },
    },
  ]);
});

test("fails closed when DF-010 judgment action or branch domains are mutated", () => {
  const closedModel = structuredClone(requirementModel);
  const correction = moduleById(closedModel, "CORR-001");
  const confirm = correction.actions.find(({ id }) => id === "CORR-ACT-CONFIRM-JUDGMENT");
  const retry = correction.actions.find(({ id }) => id === "CORR-ACT-REQUEST-RETRY");
  confirm.acceptedInputValues = [{
    fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
    optionSetId: "OPT-ENUM-028",
    partitionId: "CORRECTION_JUDGMENT",
    codes: ["PASSED", "CLOSED"],
  }];
  retry.acceptedInputValues = [{
    fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
    optionSetId: "OPT-ENUM-028",
    partitionId: "CORRECTION_JUDGMENT",
    codes: ["NOT-PASSED", "NEEDS-MORE"],
  }];
  const flow = closedModel.flows.find(({ id }) => id === "DF-010");
  for (const path of flow.executionPaths) {
    if (path.when) {
      const consumerStepOrder = ["PASSED", "CLOSED"].includes(path.id) ? 3 : 4;
      path.route = {
        kind: "OPTION_VALUE",
        fieldId: path.when.fieldId,
        values: path.when.values,
        consumerStepOrder,
      };
      delete path.when;
    }
  }

  const mutations = [
    ["deleted every route", "INVALID_FLOW_CONTRACT", (model) => {
      for (const path of model.flows.find(({ id }) => id === "DF-010").executionPaths) {
        delete path.route;
      }
    }],
    ["deleted every accepted input partition", "INVALID_FLOW_BRANCH", (model) => {
      for (const action of moduleById(model, "CORR-001").actions) {
        delete action.acceptedInputValues;
      }
    }],
    ["passed path routed to retry action", "INVALID_FLOW_BRANCH", (model) => {
      const passedPath = model.flows.find(({ id }) => id === "DF-010").executionPaths
        .find(({ id }) => id === "PASSED");
      passedPath.stepOrders = passedPath.stepOrders
        .map((stepOrder) => stepOrder === 3 ? 4 : stepOrder)
        .toSorted((left, right) => left - right);
      passedPath.route.consumerStepOrder = 4;
    }],
    ["consumer step outside path", "INVALID_FLOW_BRANCH", (model) => {
      model.flows.find(({ id }) => id === "DF-010").executionPaths
        .find(({ id }) => id === "PASSED").route.consumerStepOrder = 4;
    }],
    ["multiple route consumers", "INVALID_FLOW_BRANCH", (model) => {
      const passedPath = model.flows.find(({ id }) => id === "DF-010").executionPaths
        .find(({ id }) => id === "PASSED");
      passedPath.stepOrders = [...passedPath.stepOrders, 4]
        .toSorted((left, right) => left - right);
    }],
    ["deleted NEEDS_MORE path", "INVALID_FLOW_BRANCH", (model) => {
      model.flows.find(({ id }) => id === "DF-010").executionPaths = model.flows
        .find(({ id }) => id === "DF-010").executionPaths
        .filter(({ id }) => id !== "NEEDS_MORE");
    }],
    ["deleted CLOSED path", "INVALID_FLOW_BRANCH", (model) => {
      model.flows.find(({ id }) => id === "DF-010").executionPaths = model.flows
        .find(({ id }) => id === "DF-010").executionPaths
        .filter(({ id }) => id !== "CLOSED");
    }],
    ["overlapping route value", "INVALID_FLOW_BRANCH", (model) => {
      model.flows.find(({ id }) => id === "DF-010").executionPaths
        .find(({ id }) => id === "CLOSED").route.values = ["PASSED"];
    }],
    ["wrong confirm action code", "INVALID_ACTION_INPUT_VALUES", (model) => {
      moduleById(model, "CORR-001").actions.find(({ id }) => (
        id === "CORR-ACT-CONFIRM-JUDGMENT"
      )).acceptedInputValues[0].codes = ["PASSED", "NOT-PASSED"];
    }],
    ["overlapping accepted values", "INVALID_ACTION_INPUT_VALUES", (model) => {
      moduleById(model, "CORR-001").actions.find(({ id }) => (
        id === "CORR-ACT-REQUEST-RETRY"
      )).acceptedInputValues[0].codes.push("PASSED");
    }],
    ["omitted accepted value", "INVALID_ACTION_INPUT_VALUES", (model) => {
      moduleById(model, "CORR-001").actions.find(({ id }) => (
        id === "CORR-ACT-CONFIRM-JUDGMENT"
      )).acceptedInputValues[0].codes = ["PASSED"];
    }],
  ];

  const missedMutations = [];
  for (const [name, errorCode, mutate] of mutations) {
    const model = structuredClone(closedModel);
    mutate(model);
    if (!errorCodes(validateRequirementModel(model)).includes(errorCode)) {
      missedMutations.push(name);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("declares one closed routing policy for every Flow", () => {
  const routingPolicyByFlowId = new Map(flows.map(({ id, routingPolicy }) => (
    [id, routingPolicy]
  )));
  assert.deepEqual(routingPolicyByFlowId, new Map([
    ["DF-001", "NONE"],
    ["DF-002", "NONE"],
    ["DF-003", "NONE"],
    ["DF-004", "NONE"],
    ["DF-005", "NONE"],
    ["DF-006", "NONE"],
    ["DF-007", "ACTION_CHOICE_REQUIRED"],
    ["DF-008", "NONE"],
    ["DF-009", "NONE"],
    ["DF-010", "OPTION_VALUE_REQUIRED"],
    ["DF-012", "NONE"],
    ["DF-014", "NONE"],
    ["DF-011", "ACTION_CHOICE_REQUIRED"],
    ["DF-013", "ACTION_CHOICE_REQUIRED"],
  ]));
});

test("fails closed when a Flow routing policy and its execution paths disagree", () => {
  const mutations = [
    ["deleted routing policy", "INVALID_FLOW_CONTRACT", (model) => {
      delete model.flows.find(({ id }) => id === "DF-010").routingPolicy;
    }],
    ["deleted required execution paths", "INVALID_FLOW_BRANCH", (model) => {
      delete model.flows.find(({ id }) => id === "DF-010").executionPaths;
    }],
    ["retained paths for NONE policy", "INVALID_FLOW_BRANCH", (model) => {
      model.flows.find(({ id }) => id === "DF-010").routingPolicy = "NONE";
    }],
    ["mismatched route kind", "INVALID_FLOW_BRANCH", (model) => {
      model.flows.find(({ id }) => id === "DF-010").routingPolicy = (
        "ACTION_CHOICE_REQUIRED"
      );
    }],
    ["malformed required path", "INVALID_FLOW_CONTRACT", (model) => {
      model.flows.find(({ id }) => id === "DF-010").executionPaths[0] = null;
    }],
  ];

  const missedMutations = [];
  for (const [name, errorCode, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    if (!errorCodes(validateRequirementModel(model)).includes(errorCode)) {
      missedMutations.push(name);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("resolves Flow inputs independently on every reachable execution path", () => {
  const mutations = [
    ["override", 3],
    ["manual", 4],
  ];
  for (const [pathId, stepOrder] of mutations) {
    const model = structuredClone(requirementModel);
    model.flows.find(({ id }) => id === "DF-007").executionPaths = [{
      id: pathId,
      stepOrders: [stepOrder],
      providedInputs: [],
    }];
    assertHasCode(
      validateRequirementModel(model),
      "INVALID_FLOW_INPUT_RESOLUTION",
    );
  }
});

test("requires each Flow path terminal state to satisfy its conditional fields", () => {
  const validModel = validFixture();
  const submission = moduleById(validModel, "SUB-001");
  submission.objects[0].fields.push(validField("SUB-F003", {
    required: {
      description: "required when the object reaches SUBMITTED",
      whenStates: ["SUBMITTED"],
    },
  }));
  submission.actions[0].outputFieldIds.push("SUB-F003");
  assertNoCode(validateRequirementModel(validModel), "INVALID_FLOW_TERMINAL_STATE");

  const missingTerminalField = structuredClone(validModel);
  moduleById(missingTerminalField, "SUB-001").actions[0].outputFieldIds = moduleById(
    missingTerminalField,
    "SUB-001",
  ).actions[0].outputFieldIds.filter((fieldId) => fieldId !== "SUB-F003");
  assertHasCode(
    validateRequirementModel(missingTerminalField),
    "INVALID_FLOW_TERMINAL_STATE",
  );

  const providerCompletesState = validFixture();
  const providedSubmission = moduleById(providerCompletesState, "SUB-001");
  providedSubmission.objects[0].fields.find(({ id }) => id === "SUB-F001").required = {
    description: "required when the object reaches SUBMITTED",
    whenStates: ["SUBMITTED"],
  };
  providedSubmission.actions[0].outputFieldIds = providedSubmission.actions[0]
    .outputFieldIds.filter((fieldId) => fieldId !== "SUB-F001");
  assertNoCode(
    validateRequirementModel(providerCompletesState),
    "INVALID_FLOW_TERMINAL_STATE",
  );
});

test("requires every Flow step concrete state to satisfy its required fields", () => {
  const mutations = [
    ["intermediate UPDATE", (model) => {
      const action = moduleById(model, "CORR-001").actions
        .find(({ id }) => id === "CORR-ACT-CONFIRM-JUDGMENT");
      action.outputFieldIds = action.outputFieldIds.filter((fieldId) => (
        fieldId !== "CORR-ATTEMPT-F-TEACHER-CONFIRMER-REF"
      ));
    }],
    ["intermediate CREATE", (model) => {
      const evidence = moduleById(model, "INS-001");
      evidence.objects.find(({ id }) => id === "INS-OBJ-EVIDENCE").fields
        .find(({ id }) => id === "INS-EVIDENCE-F-SOURCE-CORRECTION-REF").required = {
          description: "required when evidence reaches CANDIDATE",
          whenStates: ["CANDIDATE"],
        };
      const action = evidence.actions.find(({ id }) => id === "INS-ACT-CREATE-CANDIDATE");
      action.outputFieldIds = action.outputFieldIds.filter((fieldId) => (
        fieldId !== "INS-EVIDENCE-F-SOURCE-CORRECTION-REF"
      ));
    }],
  ];

  const missedMutations = [];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    if (!errorCodes(validateRequirementModel(model)).includes("INVALID_FLOW_TERMINAL_STATE")) {
      missedMutations.push(name);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("does not let CREATE borrow target required fields from Flow sources", () => {
  const model = structuredClone(requirementModel);
  const evidence = moduleById(model, "INS-001");
  evidence.objects.find(({ id }) => id === "INS-OBJ-EVIDENCE").fields
    .find(({ id }) => id === "INS-EVIDENCE-F-SOURCE-CORRECTION-REF").required = {
      description: "required for a correction evidence candidate",
      whenStates: ["CANDIDATE"],
    };
  const createCandidate = evidence.actions
    .find(({ id }) => id === "INS-ACT-CREATE-CANDIDATE");
  createCandidate.outputFieldIds = createCandidate.outputFieldIds.filter((fieldId) => (
    fieldId !== "INS-EVIDENCE-F-SOURCE-CORRECTION-REF"
  ));
  model.flows.find(({ id }) => id === "DF-010").sourceDataRefs.push({
    objectId: "INS-OBJ-EVIDENCE",
    fieldId: "INS-EVIDENCE-F-SOURCE-CORRECTION-REF",
    version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
    cardinality: "ONE",
  });
  assertHasCode(validateRequirementModel(model), "INVALID_FLOW_TERMINAL_STATE");
});

test("allows CREATE to populate a target required field from its explicit input", () => {
  const model = validFixture();
  const submission = moduleById(model, "SUB-001");
  submission.objects[0].states = ["SUBMITTED"];
  submission.objects[0].stateReachability.initialStateIds = [];
  submission.objects[0].fields.find(({ id }) => id === "SUB-F001").required = {
    description: "required when the submission reaches SUBMITTED",
    whenStates: ["SUBMITTED"],
  };
  const action = submission.actions[0];
  action.operationKind = "CREATE";
  delete action.transition;
  action.successState = "SUBMITTED";
  action.outputFieldIds.push("SUB-F000");
  assert.deepEqual(validateRequirementModel(model), []);
});

test("requires plan evaluation fields when entering PENDING_RECONFIRM", () => {
  const model = structuredClone(requirementModel);
  const plan = moduleById(model, "PLN-001");
  const planObject = plan.objects.find(({ id }) => id === "PLN-OBJ-PLAN");
  for (const fieldId of [
    "PLN-PLAN-F-EVALUATION-STATE",
    "PLN-PLAN-F-EVALUATION-VERSION",
  ]) {
    planObject.fields.find(({ id }) => id === fieldId).required = {
      description: "required when plan evaluation enters pending reconfirmation",
      whenStates: ["PENDING_RECONFIRM"],
    };
  }
  plan.actions.find(({ id }) => (
    id === "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM"
  )).outputFieldIds = [
    "PLN-PLAN-F-INVALIDATION-REF",
    "PLN-PLAN-F-INVALIDATION-VERSION",
    "PLN-PLAN-F-PLAN-VERSION",
  ];
  assertHasCode(validateRequirementModel(model), "INVALID_FLOW_TERMINAL_STATE");
});

test("inherits required fields only when every UPDATE from state requires them", () => {
  const inheritedModel = validFixture();
  const submission = moduleById(inheritedModel, "SUB-001");
  submission.objects[0].fields.push(validField("SUB-F003", {
    required: {
      description: "required when the object reaches DRAFT or SUBMITTED",
      whenStates: ["DRAFT", "SUBMITTED"],
    },
  }));
  submission.actions[0].transition.from = ["DRAFT", "SUBMITTED"];
  assertNoCode(validateRequirementModel(inheritedModel), "INVALID_FLOW_TERMINAL_STATE");
  assertNoCode(validateRequirementModel(inheritedModel), "INVALID_ACTION_REQUIRED_FIELD");

  const partialInheritance = structuredClone(inheritedModel);
  moduleById(partialInheritance, "SUB-001").objects[0].fields
    .find(({ id }) => id === "SUB-F003").required = {
      description: "required when the object reaches SUBMITTED",
      whenStates: ["SUBMITTED"],
    };
  assertHasCode(
    validateRequirementModel(partialInheritance),
    "INVALID_FLOW_TERMINAL_STATE",
  );
  assertHasCode(
    validateRequirementModel(partialInheritance),
    "INVALID_ACTION_REQUIRED_FIELD",
  );
});

test("keeps terminal completeness path-local and closes DF-007 batch confirmation", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  const batchConfirm = grading.actions.find(({ id }) => id === "GRD-ACT-BATCH-CONFIRM");
  assert.deepEqual(batchConfirm.inputFieldIds, [
    "GRD-DECISION-F-SUGGESTED-SCORE",
    "GRD-DECISION-F-SCORING-RATIONALE",
  ]);
  assert.deepEqual(batchConfirm.outputFieldIds, [
    "GRD-DECISION-F-OFFICIAL-SCORE",
    "GRD-DECISION-F-TEACHER-FEEDBACK",
    "GRD-DECISION-F-DECISION-VERSION",
  ]);

  const closedModel = structuredClone(requirementModel);
  const closedBatch = moduleById(closedModel, "GRD-001").actions
    .find(({ id }) => id === "GRD-ACT-BATCH-CONFIRM");
  closedBatch.inputFieldIds = [
    "GRD-DECISION-F-SUGGESTED-SCORE",
    "GRD-DECISION-F-SCORING-RATIONALE",
  ];
  closedBatch.outputFieldIds = [
    "GRD-DECISION-F-OFFICIAL-SCORE",
    "GRD-DECISION-F-TEACHER-FEEDBACK",
    "GRD-DECISION-F-DECISION-VERSION",
  ];
  const closedFlow = closedModel.flows.find(({ id }) => id === "DF-007");
  closedFlow.sourceDataRefs.push({
    objectId: "GRD-OBJ-DECISION",
    fieldId: "GRD-DECISION-F-SCORING-RATIONALE",
    version: "GRD-DECISION-F-DECISION-VERSION",
    cardinality: "ONE",
  });
  assertNoCode(validateRequirementModel(closedModel), "INVALID_FLOW_TERMINAL_STATE");

  for (const missingFieldId of [
    "GRD-DECISION-F-OFFICIAL-SCORE",
    "GRD-DECISION-F-TEACHER-FEEDBACK",
  ]) {
    const mutated = structuredClone(closedModel);
    const mutatedBatch = moduleById(mutated, "GRD-001").actions
      .find(({ id }) => id === "GRD-ACT-BATCH-CONFIRM");
    mutatedBatch.outputFieldIds = mutatedBatch.outputFieldIds
      .filter((fieldId) => fieldId !== missingFieldId);
    assertHasCode(
      validateRequirementModel(mutated),
      "INVALID_FLOW_TERMINAL_STATE",
    );
  }
});

test("declares path-specific teacher inputs for every DF-007 grading branch", () => {
  const confirmation = flows.find(({ id }) => id === "DF-007");
  assert.ok(Array.isArray(confirmation.executionPaths));
  assert.deepEqual(
    confirmation.executionPaths.map(({ id, stepOrders }) => ({ id, stepOrders })),
    [
      { id: "ACCEPT_SUGGESTION", stepOrders: [2] },
      { id: "CORRECT_RECOGNITION_AND_ACCEPT", stepOrders: [1, 2] },
      { id: "OVERRIDE_SCORE", stepOrders: [3] },
      { id: "CORRECT_RECOGNITION_AND_OVERRIDE", stepOrders: [1, 3] },
      { id: "MANUAL_GRADE", stepOrders: [4] },
      { id: "BATCH_CONFIRM", stepOrders: [5] },
      { id: "RESOLVE_VERSION_CONFLICT", stepOrders: [6] },
    ],
  );

  const expectedFinalFields = new Set([
    "GRD-DECISION-F-OFFICIAL-SCORE",
    "GRD-DECISION-F-TEACHER-FEEDBACK",
  ]);
  for (const pathId of [
    "OVERRIDE_SCORE",
    "CORRECT_RECOGNITION_AND_OVERRIDE",
    "MANUAL_GRADE",
  ]) {
    const path = confirmation.executionPaths.find(({ id }) => id === pathId);
    assert.deepEqual(
      new Set(path.providedInputs.map(({ fieldId }) => fieldId)),
      expectedFinalFields,
      pathId,
    );
    assert.equal(path.providedInputs.every(({ provider }) => (
      provider.dutyRef === "DUTY-SUBJECT-TEACHER"
    )), true, pathId);
  }

  const missingFinalInput = structuredClone(requirementModel);
  missingFinalInput.flows.find(({ id }) => id === "DF-007").executionPaths
    .find(({ id }) => id === "MANUAL_GRADE").providedInputs.pop();
  assertHasCode(
    validateRequirementModel(missingFinalInput),
    "INVALID_FLOW_INPUT_RESOLUTION",
  );
});

test("routes DF-010 final judgments to evidence and retry judgments to termination", () => {
  const flow = flows.find(({ id }) => id === "DF-010");
  assert.ok(Array.isArray(flow.executionPaths));
  const actionByOrder = new Map(flow.steps.map(({ order, actionId }) => [order, actionId]));
  const passedPath = flow.executionPaths.find(({ id }) => id === "PASSED");
  const closedPath = flow.executionPaths.find(({ id }) => id === "CLOSED");
  const notPassedPath = flow.executionPaths.find(({ id }) => id === "NOT_PASSED");
  const needsMorePath = flow.executionPaths.find(({ id }) => id === "NEEDS_MORE");
  assert.deepEqual(passedPath.route, {
    kind: "OPTION_VALUE",
    fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
    values: ["PASSED"],
    consumerStepOrder: 3,
  });
  assert.deepEqual(closedPath.route, {
    kind: "OPTION_VALUE",
    fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
    values: ["CLOSED"],
    consumerStepOrder: 3,
  });
  assert.deepEqual(notPassedPath.route, {
    kind: "OPTION_VALUE",
    fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
    values: ["NOT-PASSED"],
    consumerStepOrder: 4,
  });
  assert.deepEqual(needsMorePath.route, {
    kind: "OPTION_VALUE",
    fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
    values: ["NEEDS-MORE"],
    consumerStepOrder: 4,
  });
  const finalActionIds = [
    "PUB-ACT-VIEW-RESULT",
    "CORR-ACT-NORMALIZE-SUBMISSION",
    "CORR-ACT-CONFIRM-JUDGMENT",
    "CORR-ACT-COMPLETE-TASK",
    "CORR-ACT-RECORD-INVALIDATION",
    "INS-ACT-MARK-STALE",
    "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM",
    "INS-ACT-CREATE-CANDIDATE",
    "INS-ACT-CONFIRM-MASTERY",
    "INS-ACT-PUBLISH-INTERPRETATION",
  ];
  assert.deepEqual(
    passedPath.stepOrders.map((order) => actionByOrder.get(order)),
    finalActionIds,
  );
  assert.deepEqual(
    closedPath.stepOrders.map((order) => actionByOrder.get(order)),
    finalActionIds,
  );
  const retryActionIds = [
    "PUB-ACT-VIEW-RESULT",
    "CORR-ACT-NORMALIZE-SUBMISSION",
    "CORR-ACT-REQUEST-RETRY",
    "CORR-ACT-MARK-TASK-AWAITING-RETRY",
  ];
  for (const retryPath of [notPassedPath, needsMorePath]) {
    assert.deepEqual(
      retryPath.stepOrders.map((order) => actionByOrder.get(order)),
      retryActionIds,
    );
    assert.equal(retryPath.stepOrders.some((order) => finalActionIds.slice(3)
      .includes(actionByOrder.get(order))), false);
  }

  const requestRetry = modules.flatMap((module) => module.actions)
    .find(({ id }) => id === "CORR-ACT-REQUEST-RETRY");
  assert.deepEqual(requestRetry.transition, { from: "SUBMITTED", to: "NEEDS_RETRY" });
  const retryOrder = flow.steps.find(({ actionId }) => actionId === requestRetry.id).order;
  const awaitingRetryOrder = flow.steps.find(({ actionId }) => (
    actionId === "CORR-ACT-MARK-TASK-AWAITING-RETRY"
  )).order;
  assert.equal(notPassedPath.stepOrders.at(-2), retryOrder);
  assert.equal(needsMorePath.stepOrders.at(-2), retryOrder);
  assert.equal(notPassedPath.stepOrders.at(-1), awaitingRetryOrder);
  assert.equal(needsMorePath.stepOrders.at(-1), awaitingRetryOrder);
});

test("requires closed actor-aware step input providers and rejects legacy bindings", () => {
  const validModel = actorProvidedInputFixture();
  assertNoCode(validateRequirementModel(validModel), "INVALID_FLOW_CONTRACT");

  const mutations = [
    (flow) => { flow.systemProvidedInputs = []; },
    (flow) => { flow.steps[0].providedInputs = {}; },
    (flow) => { flow.steps[0].providedInputs[0].legacy = true; },
    (flow) => { flow.steps[0].providedInputs[0].fieldId = ""; },
    (flow) => { flow.steps[0].providedInputs[0].provider = "SYSTEM"; },
    (flow) => { flow.steps[0].providedInputs[0].provider = { userRef: "ROLE-STUDENT" }; },
    (flow) => {
      flow.steps[0].providedInputs[0].provider = {
        roleRef: "ROLE-STUDENT",
        actorRef: "CURRENT_ACTOR",
      };
    },
  ];
  for (const mutate of mutations) {
    const model = structuredClone(validModel);
    mutate(model.flows[0]);
    assertHasCode(validateRequirementModel(model), "INVALID_FLOW_CONTRACT");
  }
});

test("matches every provided Flow input to the step action ALLOW subject", () => {
  const validModel = actorProvidedInputFixture();
  assertNoCode(validateRequirementModel(validModel), "INVALID_FLOW_INPUT_PROVIDER");
  assertNoCode(validateRequirementModel(validModel), "INVALID_FLOW_INPUT_RESOLUTION");

  const permissionMismatch = structuredClone(validModel);
  permissionMismatch.flows[0].steps[0].providedInputs[0].provider = {
    roleRef: "ROLE-TEACHER",
  };
  assertHasCode(validateRequirementModel(permissionMismatch), "INVALID_FLOW_INPUT_PROVIDER");

  const systemProvidesUserField = structuredClone(validModel);
  systemProvidesUserField.flows[0].steps[0].providedInputs[0].provider = {
    actorRef: "SYSTEM",
  };
  assertHasCode(validateRequirementModel(systemProvidesUserField), "INVALID_FLOW_INPUT_PROVIDER");

  const missingProvider = structuredClone(validModel);
  delete missingProvider.flows[0].steps[0].providedInputs;
  assertHasCode(validateRequirementModel(missingProvider), "INVALID_FLOW_INPUT_RESOLUTION");

  const crossObjectProvider = structuredClone(validModel);
  crossObjectProvider.flows[0].steps[0].providedInputs[0].fieldId = "HW-F001";
  assertHasCode(validateRequirementModel(crossObjectProvider), "INVALID_FLOW_INPUT_RESOLUTION");
});

test("keeps candidate generation separate from teacher-provided final learning fields", () => {
  for (const flow of flows) {
    assert.equal(Object.hasOwn(flow, "systemProvidedInputs"), false, flow.id);
  }

  const flowById = new Map(flows.map((flow) => [flow.id, flow]));
  const moduleActions = new Map(modules.flatMap((module) => (
    module.actions.map((action) => [action.id, action])
  )));
  const providerFields = (flowId, stepOrder) => new Map(
    flowById.get(flowId).steps.find(({ order }) => order === stepOrder)
      .providedInputs.map(({ fieldId, provider }) => [fieldId, provider]),
  );

  const evidenceProviders = providerFields("DF-010", 11);
  assert.deepEqual(evidenceProviders, new Map([
    ["INS-EVIDENCE-F-MASTERY-INTERPRETATION", { dutyRef: "DUTY-SUBJECT-TEACHER" }],
    ["INS-EVIDENCE-F-TEACHER-CONFIRMATION", { dutyRef: "DUTY-SUBJECT-TEACHER" }],
  ]));
  const evidenceCandidate = moduleActions.get("INS-ACT-CREATE-CANDIDATE");
  assert.ok(evidenceCandidate.outputFieldIds.includes("INS-EVIDENCE-F-MASTERY-CANDIDATE"));
  assert.equal(
    evidenceCandidate.outputFieldIds.includes("INS-EVIDENCE-F-MASTERY-INTERPRETATION"),
    false,
  );

  const planCandidateFieldIds = [
    "PLN-PLAN-F-GOAL-CANDIDATE",
    "PLN-PLAN-F-TASK-CONTENT-CANDIDATE",
    "PLN-PLAN-F-WORKLOAD-CANDIDATE",
    "PLN-PLAN-F-DUE-AT-CANDIDATE",
    "PLN-PLAN-F-SUCCESS-CONDITION-CANDIDATE",
    "PLN-PLAN-F-EVIDENCE-REQUIREMENT-CANDIDATE",
    "PLN-PLAN-F-REVALIDATION-METHOD-CANDIDATE",
  ];
  const planCandidate = moduleActions.get("PLN-ACT-CREATE-CANDIDATE");
  assert.equal(
    planCandidateFieldIds.every((fieldId) => planCandidate.outputFieldIds.includes(fieldId)),
    true,
  );
  const finalPlanFieldIds = [
    "PLN-PLAN-F-GOAL",
    "PLN-PLAN-F-TASK-CONTENT",
    "PLN-PLAN-F-WORKLOAD",
    "PLN-PLAN-F-DUE-AT",
    "PLN-PLAN-F-SUCCESS-CONDITION",
    "PLN-PLAN-F-EVIDENCE-REQUIREMENT",
    "PLN-PLAN-F-REVALIDATION-METHOD",
    "PLN-PLAN-F-TEACHER-CONFIRMER-REF",
  ];
  const planProviders = providerFields("DF-012", 3);
  assert.deepEqual(
    [...planProviders.keys()],
    finalPlanFieldIds,
  );
  assert.equal(
    finalPlanFieldIds.every((fieldId) => (
      planProviders.get(fieldId)?.dutyRef === "DUTY-SUBJECT-TEACHER"
    )),
    true,
  );

  const correctionFlow = flowById.get("DF-010");
  assert.equal(correctionFlow.sourceDataRefs.some(({ fieldId }) => (
    fieldId === "CORR-ATTEMPT-F-TEACHER-JUDGMENT"
  )), false);
  assert.deepEqual(providerFields("DF-010", 3), new Map([[
    "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
    { dutyRef: "DUTY-SUBJECT-TEACHER" },
  ]]));
});

test("resolves Flow inputs only from sources prior outputs or the current system provider", () => {
  const validModel = validFixture();
  assertNoCode(validateRequirementModel(validModel), "INVALID_FLOW_INPUT_RESOLUTION");

  const missingSource = structuredClone(validModel);
  moduleById(missingSource, "SUB-001").actions[0].inputFieldIds.push("SUB-F000");
  missingSource.flows[0].sourceDataRefs = [];
  assertHasCode(validateRequirementModel(missingSource), "INVALID_FLOW_INPUT_RESOLUTION");

  const missingProvider = structuredClone(validModel);
  delete missingProvider.flows[0].steps[0].providedInputs;
  assertHasCode(validateRequirementModel(missingProvider), "INVALID_FLOW_INPUT_RESOLUTION");

  const futureOutput = structuredClone(validModel);
  addFutureFlowOutputFixture(futureOutput);
  assertHasCode(validateRequirementModel(futureOutput), "INVALID_FLOW_INPUT_RESOLUTION");

  const crossObjectProvider = structuredClone(validModel);
  crossObjectProvider.flows[0].steps[0].providedInputs[0].fieldId = "HW-F001";
  assertHasCode(validateRequirementModel(crossObjectProvider), "INVALID_FLOW_INPUT_RESOLUTION");
});

test("resolves every executable Flow input in step order", () => {
  const actionById = new Map(modules.flatMap((module) => (
    module.actions.map((action) => [action.id, action])
  )));
  const violations = [];
  for (const flow of flows) {
    const available = new Set(flow.sourceDataRefs.flatMap(({ fieldId, version }) => (
      [fieldId, version]
    )));
    for (const step of flow.steps) {
      const action = actionById.get(step.actionId);
      const provided = new Set((step.providedInputs ?? []).map(({ fieldId }) => fieldId));
      for (const fieldId of action.inputFieldIds) {
        if (!available.has(fieldId) && !provided.has(fieldId)) {
          violations.push(`${flow.id}:${step.order}:${action.id}:${fieldId}`);
        }
      }
      for (const fieldId of action.outputFieldIds) available.add(fieldId);
    }
  }
  assert.deepEqual(violations, []);
});

test("rejects invalid Flow data references, ordering, and participant symmetry", () => {
  const mutations = [
    (flow) => { flow.steps[0].order = 2; },
    (flow) => { flow.steps[0] = null; },
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

test("requires every Flow source reference to declare ONE or ZERO_MANY cardinality", () => {
  const validModel = validFixture();
  assertNoCode(validateRequirementModel(validModel), "INVALID_FLOW_CONTRACT");

  const missingCardinality = structuredClone(validModel);
  delete missingCardinality.flows[0].sourceDataRefs[0].cardinality;
  assertHasCode(validateRequirementModel(missingCardinality), "INVALID_FLOW_CONTRACT");

  const invalidCardinality = structuredClone(validModel);
  invalidCardinality.flows[0].sourceDataRefs[0].cardinality = "ONE_MANY";
  assertHasCode(validateRequirementModel(invalidCardinality), "INVALID_FLOW_CONTRACT");

  const zeroManyContract = structuredClone(validModel);
  zeroManyContract.flows[0].sourceDataRefs[0].cardinality = "ZERO_MANY";
  assertNoCode(validateRequirementModel(zeroManyContract), "INVALID_FLOW_CONTRACT");
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

test("reserves source-only Flow participants for learning-path aggregation", () => {
  const validModel = validFixture();
  const flow = validModel.flows[0];
  flow.moduleIds = ["SUB-001", "HW-001"];
  flow.sourceOnlyModuleIds = ["HW-001"];
  flow.sourceDataRefs.push({
    objectId: "DAT-HW-01",
    fieldId: "HW-F001",
    version: "HW-F001",
    cardinality: "ZERO_MANY",
  });
  assertHasCode(validateRequirementModel(validModel), "INVALID_FLOW_PROFILE");

  for (const [flowId, sourceOnlyModuleId] of [
    ["DF-001", "ACC-001"],
    ["DF-005", "HW-001"],
    ["DF-008", "GRD-001"],
    ["DF-012", "INS-001"],
    ["DF-014", "SCO-001"],
  ]) {
    const model = structuredClone(requirementModel);
    const actionModuleById = new Map(model.modules.flatMap((module) => (
      module.actions.map(({ id }) => [id, module.id])
    )));
    const candidate = model.flows.find(({ id }) => id === flowId);
    candidate.steps = candidate.steps.filter(({ actionId }) => (
      actionModuleById.get(actionId) !== sourceOnlyModuleId
    ));
    candidate.sourceOnlyModuleIds = [sourceOnlyModuleId];
    assertHasCode(validateRequirementModel(model), "INVALID_FLOW_PROFILE");
  }

  const reportModel = structuredClone(requirementModel);
  reportModel.flows.find(({ id }) => id === "DF-013").sourceOnlyModuleIds = ["APP-001"];
  assertHasCode(validateRequirementModel(reportModel), "INVALID_FLOW_PROFILE");
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
    [
      "INVALID_MODEL_PROFILE model.profile must be GENERIC or ZHIXU_V2",
      ...REQUIRED_COLLECTION_NAMES
        .map((name) => `MISSING_MODEL_COLLECTION ${name} must be an array`),
    ].sort(),
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
    ["profile", "reviewStatus", ...expected.map(({ key }) => key)],
  );
});

test("accepts explicitly present empty top-level collections", () => {
  assert.deepEqual(validateRequirementModel({
    profile: "GENERIC",
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
    profile: "ZHIXU_V2",
    reviewStatus,
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
  });
  assert.deepEqual(validateRequirementModel(requirementModel), []);
});

test("authors reachability and Flow profiles in source facts without assembly defaults", () => {
  const factGroups = [
    {
      modules: foundationFactExports.foundationModules,
      flows: foundationFactExports.foundationFlows,
      objectCount: 36,
      flowCount: 3,
    },
    {
      modules: teachingLoopFactExports.teachingLoopModules,
      flows: teachingLoopFactExports.teachingLoopFlows,
      objectCount: 23,
      flowCount: 9,
    },
    {
      modules: aiReportingFactExports.aiReportingModules,
      flows: aiReportingFactExports.aiReportingFlows,
      objectCount: 9,
      flowCount: 2,
    },
    {
      modules: extensionFactExports.extensionModules,
      flows: extensionFactExports.extensionFlows,
      objectCount: 20,
      flowCount: 0,
    },
  ];
  for (const group of factGroups) {
    const objects = group.modules.flatMap((module) => module.objects);
    const phaseOneObjects = group.modules
      .filter(({ phase }) => phase === PHASE.FIRST)
      .flatMap((module) => module.objects);
    assert.equal(objects.length, group.objectCount);
    assert.equal(group.flows.length, group.flowCount);
    assert.ok(phaseOneObjects.every((object) => Object.hasOwn(object, "stateReachability")));
    assert.ok(group.flows.every((flow) => Object.hasOwn(flow, "contractProfile")));
  }
  assert.equal(modules[0], foundationFactExports.foundationModules[0]);
  assert.equal(flows[0], foundationFactExports.foundationFlows[0]);
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
      AUTHORIZED: 39,
      NO_DIRECT_READ: 44,
      STUDENT_TIMED_RELEASE: 4,
    },
  );
  assert.equal(
    phaseOneObjects.find(({ id }) => id === "PUB-OBJ-RESULT")?.readMode,
    "STUDENT_TIMED_RELEASE",
  );
  assert.equal(
    phaseOneObjects.find(({ id }) => id === "INS-OBJ-EVIDENCE")?.readMode,
    "STUDENT_TIMED_RELEASE",
  );
  assert.equal(
    phaseOneObjects.find(({ id }) => id === "APP-OBJ-TODO")?.readMode,
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

test("declares one standard system identity for all 87 phase-one objects", () => {
  const phaseOneObjects = modules
    .filter(({ phase }) => phase === PHASE.FIRST)
    .flatMap(({ objects }) => objects);
  assert.equal(phaseOneObjects.length, 87);

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

test("defines all phase-one modules the REPORT metadata module and phase-one Flows", () => {
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
      "SCO-001",
      "INS-001",
      "PLN-001",
      "APP-001",
      "CORR-001",
      "STU-001",
      "AIX-001",
      "RPT-001",
      "LPATH-001",
      "NOTI-001",
      "PREP-001",
      "CONTENT-001",
      "EXM-001",
      "SCH-001",
      "PLAT-001",
      "REPORT-001",
    ],
  );
  assert.deepEqual(
    flows.map(({ id }) => id),
    [
      "DF-001",
      "DF-002",
      "DF-003",
      "DF-004",
      "DF-005",
      "DF-006",
      "DF-007",
      "DF-008",
      "DF-009",
      "DF-010",
      "DF-012",
      "DF-014",
      "DF-011",
      "DF-013",
    ],
  );
  assert.equal(
    modules.filter(({ phase }) => phase === PHASE.FIRST)
      .every(({ priority }) => priority === "P0"),
    true,
  );
  assert.deepEqual(
    modules.filter(({ phase }) => phase === PHASE.SECOND)
      .map(({ id, priority }) => ({ id, priority })),
    [{ id: "REPORT-001", priority: "P1" }],
  );
});

test("publishes the complete AI task registry", () => {
  assert.deepEqual(
    aiTasks.map(({ id }) => id),
    [
      "AI-TASK-AUTHORIZED-DATA-QUERY",
      "AI-TASK-LEARNING-ANALYSIS",
      "AI-TASK-ASSIGNMENT-DRAFT",
      "AI-TASK-FEEDBACK-DRAFT",
      "AI-TASK-IMPROVEMENT-PLAN-DRAFT",
      "AI-TASK-AD-HOC-REPORT",
      "AI-TASK-HOMEROOM-AD-HOC-REPORT",
      "AI-TASK-ACADEMIC-AD-HOC-REPORT",
      "AI-TASK-CREATE-REPORT-SUBSCRIPTION",
      "AI-TASK-UPDATE-REPORT-SUBSCRIPTION",
      "AI-TASK-PAUSE-REPORT-SUBSCRIPTION",
      "AI-TASK-CANCEL-REPORT-SUBSCRIPTION",
      "AI-TASK-CREATE-HOMEROOM-REPORT-SUBSCRIPTION",
      "AI-TASK-UPDATE-HOMEROOM-REPORT-SUBSCRIPTION",
      "AI-TASK-PAUSE-HOMEROOM-REPORT-SUBSCRIPTION",
      "AI-TASK-CANCEL-HOMEROOM-REPORT-SUBSCRIPTION",
      "AI-TASK-CREATE-ACADEMIC-REPORT-SUBSCRIPTION",
      "AI-TASK-UPDATE-ACADEMIC-REPORT-SUBSCRIPTION",
      "AI-TASK-PAUSE-ACADEMIC-REPORT-SUBSCRIPTION",
      "AI-TASK-CANCEL-ACADEMIC-REPORT-SUBSCRIPTION",
      "AI-TASK-CREATE-REMINDER",
      "AI-TASK-PUBLISH-ASSIGNMENT",
    ],
  );
  const actionById = new Map(modules.flatMap(({ actions }) => actions)
    .map((action) => [action.id, action]));
  for (const task of aiTasks) {
    assert.equal(typeof task.id, "string");
    assert.equal(task.roleRefs.length + task.dutyRefs.length > 0, true);
    assert.equal(task.clients.length > 0, true);
    assert.equal(task.naturalLanguageExamples.length > 0, true);
    assert.equal(task.parameterSchema.type, "object");
    assert.equal(task.clarificationRules.length > 0, true);
    assert.ok(actionById.has(task.actionId), `${task.id} target action must exist`);
    assert.equal(typeof task.risk, "string");
    assert.equal(typeof task.capability, "string");
    assert.equal(typeof task.writes, "boolean");
    assert.equal(Array.isArray(task.previewFieldIds), true);
    assert.equal(task.resultSchema.type, "object");
    assert.equal(task.failureBehavior.mode, "FAIL_CLOSED");
    assert.equal(typeof task.reversibility.mode, "string");
    const targetAction = actionById.get(task.actionId);
    assert.equal(task.writes, targetAction.writes);
    assert.equal(task.risk, targetAction.risk);
    if (task.writes) {
      assert.ok(["DUTY", "ROLE"].includes(task.confirmer.mode));
      assert.equal(
        task.confirmer.mode === "DUTY"
          ? task.confirmer.dutyRef
          : task.confirmer.roleRef,
        task.confirmerRef,
      );
      assert.deepEqual(
        targetAction.inputFieldIds.filter((fieldId) => !task.previewFieldIds.includes(fieldId)),
        [],
        `${task.id} preview must cover every target Action input`,
      );
      assert.equal(task.previewFieldIds.length > 0, true);
    } else {
      assert.equal(task.confirmer.mode, "NOT_REQUIRED");
      assert.equal(targetAction.writes, false);
    }
  }
});

test("requires complete fail-closed AI task contracts", () => {
  const requiredProperties = [
    "taskType",
    "capability",
    "clients",
    "naturalLanguageExamples",
    "parameterSchema",
    "clarificationRules",
    "resultSchema",
    "failureBehavior",
    "reversibility",
  ];
  for (const property of requiredProperties) {
    const model = validFixture();
    model.duties.push({
      id: "DUTY-SUBJECT-TEACHER",
      roleId: "ROLE-TEACHER",
      label: "subject teacher",
    });
    const task = validAiTask("AI-TASK-COMPLETE");
    delete task[property];
    model.aiTasks.push(task);

    assertHasCode(validateRequirementModel(model), "INVALID_AI_TASK_CONTRACT");
  }
});

test("rejects a read-only AI task that targets a write Action", () => {
  const model = validFixture();
  const task = validAiTask("AI-TASK-READ-WRITE-MISMATCH", {
    taskType: "QUERY",
    risk: RISK.READ,
    writes: false,
    confirmer: { mode: "NOT_REQUIRED" },
  });
  delete task.confirmerRef;
  model.aiTasks.push(task);

  assertHasCode(validateRequirementModel(model), "INVALID_AI_TARGET_ACTION");
});

test("restricts periodic AI tasks to report subscription Actions", () => {
  const model = validFixture();
  model.duties.push({
    id: "DUTY-SUBJECT-TEACHER",
    roleId: "ROLE-TEACHER",
    label: "subject teacher",
  });
  model.aiTasks.push(validAiTask("AI-TASK-INVALID-PERIODIC", {
    taskType: "PERIODIC",
  }));

  assertHasCode(validateRequirementModel(model), "INVALID_AI_PERIODIC_TARGET");
});

test("requires student AI tasks to preserve every content-open policy gate", () => {
  const model = validFixture();
  const action = moduleById(model, "SUB-001").actions[0];
  action.operationKind = "READ";
  action.writes = false;
  action.risk = RISK.READ;
  action.auditMode = "NOT_REQUIRED";
  delete action.transition;
  delete action.idempotencyKey;
  const successScenario = moduleById(model, "SUB-001").scenarios
    .find(({ kind }) => kind === "SUCCESS");
  successScenario.then.expectedState = { mode: "UNCHANGED" };
  const task = validAiTask("AI-TASK-STUDENT-POLICY", {
    taskType: "QUERY",
    risk: RISK.READ,
    writes: false,
    confirmer: { mode: "NOT_REQUIRED" },
  });
  delete task.confirmerRef;
  delete task.studentAccessPolicy;
  model.aiTasks.push(task);

  assertHasCode(validateRequirementModel(model), "MISSING_AI_STUDENT_POLICY");
});

test("binds AI task audiences and confirmers to target Action ALLOW subjects", () => {
  const roleAttachedDuty = structuredClone(requirementModel);
  const assignmentTask = roleAttachedDuty.aiTasks.find(({ id }) => (
    id === "AI-TASK-ASSIGNMENT-DRAFT"
  ));
  assignmentTask.roleRefs = ["ROLE-TEACHER"];
  assignmentTask.dutyRefs = [];
  assertHasCode(
    validateRequirementModel(roleAttachedDuty),
    "INVALID_AI_ACTOR_AUTHORIZATION",
  );
  assertNoCode(
    validateRequirementModel(roleAttachedDuty),
    "INVALID_AI_CONFIRMER_AUTHORIZATION",
  );

  const wrongAudience = structuredClone(requirementModel);
  const wrongAudienceTask = wrongAudience.aiTasks.find(({ id }) => (
    id === "AI-TASK-ASSIGNMENT-DRAFT"
  ));
  wrongAudienceTask.roleRefs = [];
  wrongAudienceTask.dutyRefs = ["DUTY-HOMEROOM"];
  assertHasCode(
    validateRequirementModel(wrongAudience),
    "INVALID_AI_ACTOR_AUTHORIZATION",
  );

  const wrongConfirmer = structuredClone(requirementModel);
  const wrongConfirmerTask = wrongConfirmer.aiTasks.find(({ id }) => (
    id === "AI-TASK-ASSIGNMENT-DRAFT"
  ));
  wrongConfirmerTask.confirmerRef = "DUTY-HOMEROOM";
  wrongConfirmerTask.confirmer.dutyRef = "DUTY-HOMEROOM";
  assertHasCode(
    validateRequirementModel(wrongConfirmer),
    "INVALID_AI_CONFIRMER_AUTHORIZATION",
  );
});

test("rejects duty-scoped AI audience widening to the parent role", () => {
  const missedTaskIds = [];
  for (const taskId of [
    "AI-TASK-FEEDBACK-DRAFT",
    "AI-TASK-IMPROVEMENT-PLAN-DRAFT",
    "AI-TASK-CREATE-REMINDER",
  ]) {
    const model = structuredClone(requirementModel);
    const task = model.aiTasks.find(({ id }) => id === taskId);
    task.roleRefs = ["ROLE-TEACHER"];
    task.dutyRefs = [];

    if (!errorCodes(validateRequirementModel(model)).includes(
      "INVALID_AI_ACTOR_AUTHORIZATION",
    )) {
      missedTaskIds.push(taskId);
    }
  }
  assert.deepEqual(missedTaskIds, []);
});

test("rejects duty-scoped AI confirmer widening to the parent role", () => {
  const missedTaskIds = [];
  for (const taskId of [
    "AI-TASK-FEEDBACK-DRAFT",
    "AI-TASK-IMPROVEMENT-PLAN-DRAFT",
    "AI-TASK-CREATE-REMINDER",
  ]) {
    const model = structuredClone(requirementModel);
    const task = model.aiTasks.find(({ id }) => id === taskId);
    task.confirmerRef = "ROLE-TEACHER";
    task.confirmer = { mode: "ROLE", roleRef: "ROLE-TEACHER" };

    if (!errorCodes(validateRequirementModel(model)).includes(
      "INVALID_AI_CONFIRMER_AUTHORIZATION",
    )) {
      missedTaskIds.push(taskId);
    }
  }
  assert.deepEqual(missedTaskIds, []);
});

test("keeps AI permission containment directional for ALLOW and DENY", () => {
  const roleAllowsDuty = structuredClone(requirementModel);
  const task = roleAllowsDuty.aiTasks
    .find(({ id }) => id === "AI-TASK-FEEDBACK-DRAFT");
  const action = roleAllowsDuty.modules.flatMap(({ actions }) => actions)
    .find(({ id }) => id === task.actionId);
  action.permissions = structuredClone(action.permissions);
  const allow = action.permissions.find(({ effect }) => effect === "ALLOW");
  delete allow.dutyRef;
  allow.roleRef = "ROLE-TEACHER";
  assertNoCode(validateRequirementModel(roleAllowsDuty), "INVALID_AI_ACTOR_AUTHORIZATION");
  assertNoCode(validateRequirementModel(roleAllowsDuty), "INVALID_AI_CONFIRMER_AUTHORIZATION");

  const dutyDeny = {
    effect: "DENY",
    dutyRef: "DUTY-SUBJECT-TEACHER",
    condition: "the assigned subject-teacher duty is excluded from this operation",
  };
  const dutyDenyDoesNotCoverRole = structuredClone(roleAllowsDuty);
  const widenedTask = dutyDenyDoesNotCoverRole.aiTasks
    .find(({ id }) => id === task.id);
  widenedTask.roleRefs = ["ROLE-TEACHER"];
  widenedTask.dutyRefs = [];
  widenedTask.confirmerRef = "ROLE-TEACHER";
  widenedTask.confirmer = { mode: "ROLE", roleRef: "ROLE-TEACHER" };
  dutyDenyDoesNotCoverRole.modules.flatMap(({ actions }) => actions)
    .find(({ id }) => id === task.actionId).permissions.push(dutyDeny);
  assertNoCode(
    validateRequirementModel(dutyDenyDoesNotCoverRole),
    "INVALID_AI_ACTOR_AUTHORIZATION",
  );
  assertNoCode(
    validateRequirementModel(dutyDenyDoesNotCoverRole),
    "INVALID_AI_CONFIRMER_AUTHORIZATION",
  );

  const dutyDenyBlocksSameDuty = structuredClone(roleAllowsDuty);
  dutyDenyBlocksSameDuty.modules.flatMap(({ actions }) => actions)
    .find(({ id }) => id === task.actionId).permissions.push(dutyDeny);
  const blockedErrors = validateRequirementModel(dutyDenyBlocksSameDuty);
  assertHasCode(blockedErrors, "INVALID_AI_ACTOR_AUTHORIZATION");
  assertHasCode(blockedErrors, "INVALID_AI_CONFIRMER_AUTHORIZATION");
});

test("applies explicit DENY precedence to AI audiences and confirmers", () => {
  const model = structuredClone(requirementModel);
  const task = model.aiTasks.find(({ id }) => (
    id === "AI-TASK-UPDATE-ACADEMIC-REPORT-SUBSCRIPTION"
  ));
  task.roleRefs = ["ROLE-PLATFORM-OPS"];
  task.dutyRefs = [];
  task.confirmerRef = "ROLE-PLATFORM-OPS";
  task.confirmer = { mode: "ROLE", roleRef: "ROLE-PLATFORM-OPS" };

  const errors = validateRequirementModel(model);
  assertHasCode(errors, "INVALID_AI_ACTOR_AUTHORIZATION");
  assertHasCode(errors, "INVALID_AI_CONFIRMER_AUTHORIZATION");
});

test("applies DENY CURRENT_ACTOR precedence to AI audiences and confirmers", () => {
  const model = structuredClone(requirementModel);
  const task = model.aiTasks.find(({ id }) => id === "AI-TASK-AD-HOC-REPORT");
  const targetAction = model.modules.flatMap(({ actions }) => actions)
    .find(({ id }) => id === task.actionId);
  targetAction.permissions.push({
    effect: "DENY",
    actorRef: "CURRENT_ACTOR",
    condition: "the current actor is explicitly excluded from this operation",
  });

  const errors = validateRequirementModel(model);
  assertHasCode(errors, "INVALID_AI_ACTOR_AUTHORIZATION");
  assertHasCode(errors, "INVALID_AI_CONFIRMER_AUTHORIZATION");
});

test("validates AI JSON schema property bodies and clarification parameters", () => {
  const mutations = [
    (model) => {
      model.aiTasks.find(({ id }) => id === "AI-TASK-ASSIGNMENT-DRAFT")
        .parameterSchema.properties.assignmentBrief = {};
    },
    (model) => {
      delete model.aiTasks.find(({ id }) => id === "AI-TASK-AD-HOC-REPORT")
        .parameterSchema.properties.metricIds.items;
    },
    (model) => {
      model.aiTasks.find(({ id }) => id === "AI-TASK-ASSIGNMENT-DRAFT")
        .clarificationRules[0].whenMissing.push("unknownParameter");
    },
    (model) => {
      const rule = model.aiTasks.find(({ id }) => id === "AI-TASK-ASSIGNMENT-DRAFT")
        .clarificationRules[0];
      rule.whenMissing.push(rule.whenMissing[0]);
    },
    (model) => {
      model.aiTasks.find(({ id }) => id === "AI-TASK-ASSIGNMENT-DRAFT")
        .resultSchema.properties.permissionResult = {};
    },
  ];
  for (const mutate of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_AI_TASK_CONTRACT");
  }
});

test("covers every required AI parameter with blocking clarification", () => {
  for (const task of aiTasks) {
    const required = new Set(task.parameterSchema.required);
    const blockingMissing = task.clarificationRules
      .filter(({ blocksExecution }) => blocksExecution === true)
      .flatMap(({ whenMissing }) => whenMissing);
    assert.deepEqual(new Set(blockingMissing), required, task.id);
    assert.equal(blockingMissing.length, required.size, task.id);
  }

  const missingParameters = ["metricIds", "dataScope", "timeRange"];
  const missedMutations = [];
  for (const parameter of missingParameters) {
    const model = structuredClone(requirementModel);
    const task = model.aiTasks.find(({ id }) => id === "AI-TASK-AD-HOC-REPORT");
    task.clarificationRules[0].whenMissing = task.clarificationRules[0].whenMissing
      .filter((candidate) => candidate !== parameter);
    if (!errorCodes(validateRequirementModel(model)).includes("INVALID_AI_TASK_CONTRACT")) {
      missedMutations.push(parameter);
    }
  }
  assert.deepEqual(missedMutations, []);

  const duplicateAcrossRules = structuredClone(requirementModel);
  const task = duplicateAcrossRules.aiTasks.find(({ id }) => id === "AI-TASK-AD-HOC-REPORT");
  task.clarificationRules = [
    {
      whenMissing: ["reportName", "metricIds", "dataScope"],
      prompt: "Provide the report identity and authorized scope.",
      blocksExecution: true,
    },
    {
      whenMissing: ["metricIds", "timeRange"],
      prompt: "Provide the report metrics and time range.",
      blocksExecution: true,
    },
  ];
  assertHasCode(
    validateRequirementModel(duplicateAcrossRules),
    "INVALID_AI_TASK_CONTRACT",
  );
});

test("keeps AI task drafts temporary until authorized target Action confirmation", () => {
  const draftTasks = aiTasks.filter(({ taskType }) => taskType === "DRAFT");
  assert.equal(draftTasks.length, 3);
  for (const task of draftTasks) {
    assert.deepEqual(task.draftPolicy, {
      previewActionId: task.actionId.startsWith("AIX-")
        ? task.actionId
        : "AIX-ACT-PREPARE-TASK-PREVIEW",
      previewObjectId: "AIX-OBJ-TASK-PREVIEW",
      confirmationRequired: true,
      businessWriteBeforeConfirmation: false,
    });
  }

  const model = structuredClone(requirementModel);
  delete model.aiTasks.find(({ taskType }) => taskType === "DRAFT").draftPolicy;
  assertHasCode(validateRequirementModel(model), "INVALID_AI_DRAFT_POLICY");
});

test("fails closed when an AI task write preview omits a target Action input", () => {
  const model = structuredClone(requirementModel);
  const task = model.aiTasks.find(({ id }) => id === "AI-TASK-ASSIGNMENT-DRAFT");
  task.previewFieldIds = task.previewFieldIds.slice(1);

  assertHasCode(validateRequirementModel(model), "AI_WRITE_WITHOUT_CONFIRMATION");
});

test("executes report authorization through closed audience scopes", () => {
  const reportModule = moduleById(requirementModel, "RPT-001");
  const definition = reportModule.objects.find(({ id }) => id === "RPT-OBJ-DEFINITION");
  const scopeField = definition.fields.find(({ id }) => (
    id === "RPT-DEFINITION-F-DATA-SCOPE"
  ));
  assert.deepEqual(scopeField.valueSource, {
    kind: "OPTION_SET",
    optionSetId: "OPT-ENUM-048",
  });
  assert.deepEqual(reportModule.dataScopeProfiles, [
    {
      code: "SUBJECT_ASSIGNED",
      subjectScope: "ASSIGNED_SUBJECT",
      classScope: "ASSIGNED_CLASSES",
      aggregateOnly: false,
      noStudentDetail: false,
      requiresAuthorizedGrant: false,
    },
    {
      code: "HOMEROOM_ASSIGNED_CLASS_AGGREGATE",
      subjectScope: "ALL_SUBJECTS",
      classScope: "ASSIGNED_HOMEROOM_CLASS",
      aggregateOnly: true,
      noStudentDetail: true,
      requiresAuthorizedGrant: false,
    },
    {
      code: "ACADEMIC_AUTHORIZED_AGGREGATE",
      subjectScope: "AUTHORIZED_SUBJECTS",
      classScope: "AUTHORIZED_CLASSES",
      aggregateOnly: true,
      noStudentDetail: true,
      requiresAuthorizedGrant: true,
    },
  ]);

  const expectedActions = [
    ["RPT-ACT-CREATE-AD-HOC-DEFINITION", "SUBJECT_ASSIGNED", "dutyRef", "DUTY-SUBJECT-TEACHER"],
    ["RPT-ACT-CREATE-HOMEROOM-DEFINITION", "HOMEROOM_ASSIGNED_CLASS_AGGREGATE", "dutyRef", "DUTY-HOMEROOM"],
    ["RPT-ACT-CREATE-ACADEMIC-DEFINITION", "ACADEMIC_AUTHORIZED_AGGREGATE", "roleRef", "ROLE-ACADEMIC"],
  ];
  for (const [actionId, code, subjectKey, subjectRef] of expectedActions) {
    const targetAction = reportModule.actions.find(({ id }) => id === actionId);
    assert.deepEqual(targetAction.acceptedInputValues, [{
      fieldId: "RPT-DEFINITION-F-DATA-SCOPE",
      optionSetId: "OPT-ENUM-048",
      partitionId: "RPT-DEFINITION-DATA-SCOPE",
      codes: [code],
    }]);
    assert.ok(targetAction.permissions.some((permission) => (
      permission.effect === "ALLOW" && permission[subjectKey] === subjectRef
    )), `${actionId} must allow only its scoped report author`);
    assert.ok(targetAction.permissions.some((permission) => (
      permission.effect === "DENY" && permission.roleRef === "ROLE-PLATFORM-OPS"
    )), `${actionId} must deny platform operations`);
  }
  const mutations = [
    (model) => {
      moduleById(model, "RPT-001").dataScopeProfiles[1].noStudentDetail = false;
    },
    (model) => {
      moduleById(model, "RPT-001").actions
        .find(({ id }) => id === "RPT-ACT-CREATE-AD-HOC-DEFINITION")
        .acceptedInputValues[0].codes.push("HOMEROOM_ASSIGNED_CLASS_AGGREGATE");
    },
    (model) => {
      const permissions = moduleById(model, "RPT-001").actions
        .find(({ id }) => id === "RPT-ACT-CREATE-HOMEROOM-DEFINITION").permissions;
      permissions.find(({ effect }) => effect === "ALLOW").dutyRef = "DUTY-SUBJECT-TEACHER";
    },
    (model) => {
      const targetAction = moduleById(model, "RPT-001").actions
        .find(({ id }) => id === "RPT-ACT-CREATE-ACADEMIC-DEFINITION");
      targetAction.permissions = targetAction.permissions.filter(({ roleRef }) => (
        roleRef !== "ROLE-PLATFORM-OPS"
      ));
    },
  ];
  for (const mutate of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_REPORT_SCOPE_CONTRACT");
  }
});

test("keeps report subscription management with the creating actor", () => {
  const reportModule = moduleById(requirementModel, "RPT-001");
  const subscription = reportModule.objects.find(({ id }) => (
    id === "RPT-OBJ-SUBSCRIPTION"
  ));
  assert.equal(subscription.producerRef, "CURRENT_ACTOR");
  assert.ok(subscription.fields.some(({ id }) => (
    id === "RPT-SUBSCRIPTION-F-CREATOR-REF"
  )));

  for (const actionId of [
    "RPT-ACT-CREATE-SUBSCRIPTION",
    "RPT-ACT-CREATE-HOMEROOM-SUBSCRIPTION",
    "RPT-ACT-CREATE-ACADEMIC-SUBSCRIPTION",
  ]) {
    const targetAction = reportModule.actions.find(({ id }) => id === actionId);
    assert.ok(targetAction.outputFieldIds.includes("RPT-SUBSCRIPTION-F-CREATOR-REF"));
  }
  for (const actionId of [
    "RPT-ACT-UPDATE-SUBSCRIPTION",
    "RPT-ACT-PAUSE-SUBSCRIPTION",
    "RPT-ACT-CANCEL-SUBSCRIPTION",
  ]) {
    const targetAction = reportModule.actions.find(({ id }) => id === actionId);
    assert.ok(targetAction.permissions.some((permission) => (
      permission.effect === "ALLOW"
      && permission.actorRef === "CURRENT_ACTOR"
      && permission.scope?.kind === "OWN_RECORD"
      && permission.scope.subjectFieldId === "RPT-SUBSCRIPTION-F-CREATOR-REF"
    )), `${actionId} must allow the creator's own subscription`);
    assert.ok(targetAction.permissions.some((permission) => (
      permission.effect === "DENY"
      && permission.actorRef === "CURRENT_ACTOR"
      && permission.scope?.kind === "OTHER_RECORD"
      && permission.scope.subjectFieldId === "RPT-SUBSCRIPTION-F-CREATOR-REF"
    )), `${actionId} must deny another actor's subscription`);
    assert.ok(targetAction.permissions.some((permission) => (
      permission.effect === "DENY" && permission.roleRef === "ROLE-PLATFORM-OPS"
    )), `${actionId} must deny platform operations`);
  }

  const wrongProducer = structuredClone(requirementModel);
  moduleById(wrongProducer, "RPT-001").objects
    .find(({ id }) => id === "RPT-OBJ-SUBSCRIPTION").producerRef = "DUTY-SUBJECT-TEACHER";
  assertHasCode(
    validateRequirementModel(wrongProducer),
    "INVALID_REPORT_SUBSCRIPTION_OWNERSHIP",
  );

  const crossActorUpdate = structuredClone(requirementModel);
  const update = moduleById(crossActorUpdate, "RPT-001").actions
    .find(({ id }) => id === "RPT-ACT-UPDATE-SUBSCRIPTION");
  update.permissions = update.permissions.filter(({ scope }) => scope?.kind !== "OTHER_RECORD");
  assertHasCode(
    validateRequirementModel(crossActorUpdate),
    "INVALID_REPORT_SUBSCRIPTION_OWNERSHIP",
  );
});

test("binds AI report audiences and confirmers to scoped Actions", () => {
  const actionById = new Map(modules.flatMap(({ actions }) => actions)
    .map((targetAction) => [targetAction.id, targetAction]));
  const audienceProfiles = [
    [{ dutyRef: "DUTY-SUBJECT-TEACHER" }, "RPT-ACT-CREATE-AD-HOC-DEFINITION"],
    [{ dutyRef: "DUTY-HOMEROOM" }, "RPT-ACT-CREATE-HOMEROOM-DEFINITION"],
    [{ roleRef: "ROLE-ACADEMIC" }, "RPT-ACT-CREATE-ACADEMIC-DEFINITION"],
  ];
  const periodicActionIds = [
    "RPT-ACT-CREATE-SUBSCRIPTION",
    "RPT-ACT-CREATE-HOMEROOM-SUBSCRIPTION",
    "RPT-ACT-CREATE-ACADEMIC-SUBSCRIPTION",
    "RPT-ACT-UPDATE-SUBSCRIPTION",
    "RPT-ACT-PAUSE-SUBSCRIPTION",
    "RPT-ACT-CANCEL-SUBSCRIPTION",
  ];
  for (const [subject, actionId] of audienceProfiles) {
    const task = aiTasks.find((candidate) => (
      candidate.actionId === actionId
      && candidate.capability === "REPORT"
      && (subject.dutyRef
        ? candidate.dutyRefs.includes(subject.dutyRef)
        : candidate.roleRefs.includes(subject.roleRef))
    ));
    assert.ok(task, `missing scoped ad-hoc report task for ${actionId}`);
  }
  for (const actionId of periodicActionIds) {
    const targetAction = actionById.get(actionId);
    const allowSubjects = targetAction.permissions
      .filter(({ effect }) => effect === "ALLOW")
      .map(({ dutyRef, roleRef, actorRef }) => ({ dutyRef, roleRef, actorRef }));
    const tasks = aiTasks.filter((task) => (
      task.actionId === actionId && task.capability === "PERIODIC"
    ));
    assert.equal(tasks.length > 0, true, actionId);
    for (const task of tasks) {
      const confirmerSubject = task.confirmer.mode === "DUTY"
        ? { dutyRef: task.confirmer.dutyRef }
        : task.confirmer.mode === "ROLE"
          ? { roleRef: task.confirmer.roleRef }
          : { actorRef: task.confirmer.actorRef };
      assert.ok(allowSubjects.some((subject) => (
        Object.entries(confirmerSubject).every(([key, value]) => subject[key] === value)
        || subject.actorRef === "CURRENT_ACTOR"
      )), `${task.id} confirmer must match an Action ALLOW subject`);
    }
  }

  const wrongAudience = structuredClone(requirementModel);
  const reportTask = wrongAudience.aiTasks.find(({ capability }) => capability === "REPORT");
  reportTask.roleRefs = ["ROLE-PLATFORM-OPS"];
  reportTask.dutyRefs = [];
  assertHasCode(validateRequirementModel(wrongAudience), "INVALID_AI_ACTOR_AUTHORIZATION");

  const wrongConfirmer = structuredClone(requirementModel);
  const academicTask = wrongConfirmer.aiTasks.find((task) => (
    task.capability === "REPORT" && task.roleRefs.includes("ROLE-ACADEMIC")
  ));
  academicTask.confirmer = { mode: "DUTY", dutyRef: "DUTY-HOMEROOM" };
  assertHasCode(validateRequirementModel(wrongConfirmer), "INVALID_AI_CONFIRMER_AUTHORIZATION");
});

test("binds AI drafts to capability-matched temporary preview Actions", () => {
  const actionById = new Map(modules.flatMap(({ actions }) => actions)
    .map((targetAction) => [targetAction.id, targetAction]));
  const objectById = new Map(modules.flatMap(({ objects }) => objects)
    .map((targetObject) => [targetObject.id, targetObject]));
  const expectedTargets = new Map([
    ["AI-TASK-ASSIGNMENT-DRAFT", "HW-ACT-CREATE-DRAFT"],
    ["AI-TASK-FEEDBACK-DRAFT", "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW"],
    ["AI-TASK-IMPROVEMENT-PLAN-DRAFT", "AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW"],
  ]);
  for (const [taskId, actionId] of expectedTargets) {
    const task = aiTasks.find(({ id }) => id === taskId);
    const targetAction = actionById.get(actionId);
    assert.equal(task.capability, "DRAFT");
    assert.equal(task.actionId, actionId);
    assert.equal(targetAction.capability, "DRAFT");
    if (targetAction.targetObjectId === "AIX-OBJ-TASK-PREVIEW") {
      assert.equal(targetAction.operationKind, "CREATE");
      assert.equal(
        objectById.get(targetAction.targetObjectId).lifecyclePolicyId,
        "LIFE-005",
      );
      assert.equal(task.draftPolicy.previewActionId, actionId);
    }
  }

  for (const [taskId, actionId] of [
    ["AI-TASK-FEEDBACK-DRAFT", "GRD-ACT-OVERRIDE-SCORE"],
    ["AI-TASK-IMPROVEMENT-PLAN-DRAFT", "PLN-ACT-CONFIRM-PLAN"],
    ["AI-TASK-ASSIGNMENT-DRAFT", "HW-ACT-PUBLISH-NOW"],
  ]) {
    const model = structuredClone(requirementModel);
    model.aiTasks.find(({ id }) => id === taskId).actionId = actionId;
    assertHasCode(validateRequirementModel(model), "INVALID_AI_TASK_CAPABILITY");
  }
});

test("binds every AI draft to a purpose-scoped target", () => {
  const mutations = [
    ["AI-TASK-FEEDBACK-DRAFT", "GRD-ACT-OVERRIDE-SCORE"],
    ["AI-TASK-IMPROVEMENT-PLAN-DRAFT", "PLN-ACT-CONFIRM-PLAN"],
    ["AI-TASK-ASSIGNMENT-DRAFT", "HW-ACT-PUBLISH-NOW"],
  ];
  const missedMutations = [];
  for (const [taskId, actionId] of mutations) {
    const model = structuredClone(requirementModel);
    const task = model.aiTasks.find(({ id }) => id === taskId);
    const targetAction = model.modules.flatMap(({ actions }) => actions)
      .find(({ id }) => id === actionId);
    task.actionId = actionId;
    task.risk = targetAction.risk;
    task.previewFieldIds = [
      ...targetAction.inputFieldIds,
      ...targetAction.outputFieldIds,
    ];
    task.draftPolicy.previewActionId = "AIX-ACT-PREPARE-TASK-PREVIEW";
    targetAction.capability = "DRAFT";
    if (!errorCodes(validateRequirementModel(model)).includes("INVALID_AI_DRAFT_PURPOSE")) {
      missedMutations.push(taskId);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("anchors AI draft content purpose independently from Task and Action metadata", () => {
  const changedPurpose = structuredClone(requirementModel);
  const task = changedPurpose.aiTasks
    .find(({ id }) => id === "AI-TASK-ASSIGNMENT-DRAFT");
  const targetAction = changedPurpose.modules.flatMap(({ actions }) => actions)
    .find(({ id }) => id === task.actionId);
  task.draftPurpose.contentKind = "FEEDBACK";
  targetAction.draftPurpose.contentKind = "FEEDBACK";
  assertHasCode(validateRequirementModel(changedPurpose), "INVALID_AI_DRAFT_PURPOSE");

  const missingRegistry = structuredClone(requirementModel);
  moduleById(missingRegistry, "AIX-001").draftPurposeProfiles = [];
  assertHasCode(validateRequirementModel(missingRegistry), "INVALID_AI_DRAFT_PURPOSE");
});

test("models report definition subscription run snapshot and delivery as five objects", () => {
  const reportModule = moduleById(requirementModel, "RPT-001");
  assert.deepEqual(reportModule.objects.map(({ id }) => id), [
    "RPT-OBJ-DEFINITION",
    "RPT-OBJ-SUBSCRIPTION",
    "RPT-OBJ-RUN",
    "RPT-OBJ-SNAPSHOT",
    "RPT-OBJ-DELIVERY",
  ]);
  const fieldIds = new Set(reportModule.objects.flatMap(({ fields }) => (
    fields.map(({ id }) => id)
  )));
  for (const fieldId of [
    "RPT-DEFINITION-F-NAME",
    "RPT-DEFINITION-F-METRIC-IDS",
    "RPT-DEFINITION-F-DATA-SCOPE",
    "RPT-DEFINITION-F-TIME-RANGE",
    "RPT-SUBSCRIPTION-F-SCHEDULE-FREQUENCY",
    "RPT-SUBSCRIPTION-F-EXECUTION-TIME",
    "RPT-SUBSCRIPTION-F-TIMEZONE",
    "RPT-SUBSCRIPTION-F-RECIPIENTS",
    "RPT-RUN-F-DATA-CUTOFF",
    "RPT-RUN-F-PERMISSION-RESULT",
    "RPT-RUN-F-SOURCE-VERSIONS",
    "RPT-RUN-F-RESULT",
    "RPT-DELIVERY-F-STATE",
  ]) {
    assert.ok(fieldIds.has(fieldId), `missing report field ${fieldId}`);
  }
});

test("keeps report subscription and run on independent lifecycles", () => {
  const reportModule = moduleById(requirementModel, "RPT-001");
  const subscription = reportModule.objects.find(({ id }) => (
    id === "RPT-OBJ-SUBSCRIPTION"
  ));
  const run = reportModule.objects.find(({ id }) => id === "RPT-OBJ-RUN");
  assert.deepEqual(subscription.states, ["ACTIVE", "PAUSED", "CANCELLED"]);
  assert.deepEqual(run.states, [
    "QUEUED",
    "RUNNING",
    "SUCCEEDED",
    "FAILED",
    "BLOCKED_PERMISSION",
  ]);
  assert.deepEqual(reportModule.lifecycleBoundaries, {
    subscriptionObjectId: "RPT-OBJ-SUBSCRIPTION",
    runObjectId: "RPT-OBJ-RUN",
    sharedStateMachine: false,
  });
});

test("rechecks permission and data cutoff for every report run", () => {
  const reportModule = moduleById(requirementModel, "RPT-001");
  const run = reportModule.objects.find(({ id }) => id === "RPT-OBJ-RUN");
  assert.deepEqual(run.executionPolicy, {
    permissionCheck: "RECHECK_EACH_RUN",
    dataCutoff: "RESOLVE_AT_RUN_START",
    permissionFailureState: "BLOCKED_PERMISSION",
    permissionFailureActionId: "RPT-ACT-BLOCK-RUN-PERMISSION",
    sourceVersionCapture: "PIN_BEFORE_QUERY",
  });

  const model = structuredClone(requirementModel);
  delete moduleById(model, "RPT-001").objects
    .find(({ id }) => id === "RPT-OBJ-RUN").executionPolicy.permissionCheck;
  assertHasCode(validateRequirementModel(model), "INVALID_REPORT_CONTRACT");
});

test("pins every report snapshot to one run and its source versions", () => {
  const reportModule = moduleById(requirementModel, "RPT-001");
  const snapshot = reportModule.objects.find(({ id }) => id === "RPT-OBJ-SNAPSHOT");
  const runRef = snapshot.fields.find(({ id }) => id === "RPT-SNAPSHOT-F-RUN-REF");
  assert.ok(runRef, "report snapshot must reference one run");
  assert.equal(runRef.referenceIntegrity, "VERSION_PINNED");
  assert.deepEqual(runRef.versionBinding, {
    versionFieldId: "RPT-SNAPSHOT-F-RUN-VERSION",
    targetVersionFieldId: "RPT-RUN-F-VERSION",
  });
  assert.ok(snapshot.fields.some(({ id }) => id === "RPT-SNAPSHOT-F-SOURCE-VERSIONS"));
  assert.deepEqual(snapshot.lineageBindings, [{
    refFieldId: "RPT-SNAPSHOT-F-RUN-REF",
    versionFieldId: "RPT-SNAPSHOT-F-RUN-VERSION",
    targetObjectId: "RPT-OBJ-RUN",
    targetVersionFieldId: "RPT-RUN-F-VERSION",
  }]);
});

test("links the separated report objects through version-pinned lineage", () => {
  const reportModule = moduleById(requirementModel, "RPT-001");
  const objectById = new Map(reportModule.objects.map((object) => [object.id, object]));
  for (const [objectId, refFieldId, versionFieldId, targetObjectId, targetVersionFieldId] of [
    ["RPT-OBJ-SUBSCRIPTION", "RPT-SUBSCRIPTION-F-DEFINITION-REF", "RPT-SUBSCRIPTION-F-DEFINITION-VERSION", "RPT-OBJ-DEFINITION", "RPT-DEFINITION-F-VERSION"],
    ["RPT-OBJ-RUN", "RPT-RUN-F-DEFINITION-REF", "RPT-RUN-F-DEFINITION-VERSION", "RPT-OBJ-DEFINITION", "RPT-DEFINITION-F-VERSION"],
    ["RPT-OBJ-RUN", "RPT-RUN-F-SUBSCRIPTION-REF", "RPT-RUN-F-SUBSCRIPTION-VERSION", "RPT-OBJ-SUBSCRIPTION", "RPT-SUBSCRIPTION-F-VERSION"],
    ["RPT-OBJ-DELIVERY", "RPT-DELIVERY-F-SNAPSHOT-REF", "RPT-DELIVERY-F-SNAPSHOT-VERSION", "RPT-OBJ-SNAPSHOT", "RPT-SNAPSHOT-F-VERSION"],
  ]) {
    const object = objectById.get(objectId);
    const refField = object.fields.find(({ id }) => id === refFieldId);
    assert.ok(refField, `${objectId} missing ${refFieldId}`);
    assert.equal(refField.referenceIntegrity, "VERSION_PINNED");
    assert.deepEqual(refField.versionBinding, {
      versionFieldId,
      targetVersionFieldId,
    });
    assert.ok(object.lineageBindings.some((binding) => (
      binding.refFieldId === refFieldId
      && binding.versionFieldId === versionFieldId
      && binding.targetObjectId === targetObjectId
      && binding.targetVersionFieldId === targetVersionFieldId
    )));
  }
});

test("guards report lineage with source-state-specific action applicability", () => {
  const reportModule = moduleById(requirementModel, "RPT-001");
  const objectById = new Map(reportModule.objects.map((object) => [object.id, object]));
  const actionById = new Map(reportModule.actions.map((action) => [action.id, action]));
  for (const [objectId, refFieldId, actionIds, requiredState] of [
    ["RPT-OBJ-SUBSCRIPTION", "RPT-SUBSCRIPTION-F-DEFINITION-REF", [
      "RPT-ACT-CREATE-SUBSCRIPTION",
      "RPT-ACT-CREATE-HOMEROOM-SUBSCRIPTION",
      "RPT-ACT-CREATE-ACADEMIC-SUBSCRIPTION",
    ], "ACTIVE"],
    ["RPT-OBJ-RUN", "RPT-RUN-F-DEFINITION-REF", ["RPT-ACT-CREATE-AD-HOC-RUN", "RPT-ACT-CREATE-RUN"], "ACTIVE"],
    ["RPT-OBJ-RUN", "RPT-RUN-F-SUBSCRIPTION-REF", ["RPT-ACT-CREATE-RUN"], "ACTIVE"],
    ["RPT-OBJ-SNAPSHOT", "RPT-SNAPSHOT-F-RUN-REF", ["RPT-ACT-MATERIALIZE-SNAPSHOT"], "SUCCEEDED"],
    ["RPT-OBJ-DELIVERY", "RPT-DELIVERY-F-SNAPSHOT-REF", ["RPT-ACT-CREATE-DELIVERY"], "AVAILABLE"],
  ]) {
    const field = objectById.get(objectId).fields.find(({ id }) => id === refFieldId);
    assert.equal(field.stateGuardPolicy, "CREATE_REQUIRED", refFieldId);
    assert.deepEqual(field.actionApplicability, { requiredActionIds: actionIds });
    for (const actionId of actionIds) {
      assert.ok(actionById.get(actionId).relatedStateGuards.some((guard) => (
        guard.refFieldId === refFieldId && guard.requiredState === requiredState
      )));
    }
  }
});

test("executes an ad-hoc report definition without a subscription", () => {
  const flow = flows.find(({ id }) => id === "DF-013");
  assert.equal(flow.routingPolicy, "ACTION_CHOICE_REQUIRED");
  const adHocPath = flow.executionPaths.find(({ id }) => id === "AD_HOC");
  assert.deepEqual(adHocPath.stepOrders, [1, 2, 3, 5, 6, 7, 8, 9]);
  assert.deepEqual(adHocPath.route, {
    kind: "ACTION_CHOICE",
    consumerStepOrder: 3,
  });
  assert.deepEqual(adHocPath.sourceBindings, [{
    sourceObjectId: "RPT-OBJ-DEFINITION",
    sourceIdentityFieldId: "RPT-DEFINITION-F-ID",
    sourceVersionFieldId: "RPT-DEFINITION-F-VERSION",
    consumerStepOrder: 3,
    targetRefFieldId: "RPT-RUN-F-DEFINITION-REF",
    targetVersionFieldId: "RPT-RUN-F-DEFINITION-VERSION",
    cardinality: "ONE",
  }]);

  const model = structuredClone(requirementModel);
  model.flows.find(({ id }) => id === "DF-013").executionPaths
    .find(({ id }) => id === "AD_HOC").sourceBindings.push({
      sourceObjectId: "RPT-OBJ-SUBSCRIPTION",
      sourceIdentityFieldId: "RPT-SUBSCRIPTION-F-ID",
      sourceVersionFieldId: "RPT-SUBSCRIPTION-F-VERSION",
      consumerStepOrder: 3,
      targetRefFieldId: "RPT-RUN-F-SUBSCRIPTION-REF",
      targetVersionFieldId: "RPT-RUN-F-SUBSCRIPTION-VERSION",
      cardinality: "ONE",
    });
  assertHasCode(validateRequirementModel(model), "INVALID_REPORT_EXECUTION_PATH");
});

test("requires periodic report runs to pin definition and subscription action inputs", () => {
  const reportModule = moduleById(requirementModel, "RPT-001");
  const adHocRun = reportModule.actions
    .find(({ id }) => id === "RPT-ACT-CREATE-AD-HOC-RUN");
  const periodicRun = reportModule.actions.find(({ id }) => id === "RPT-ACT-CREATE-RUN");
  assert.ok(adHocRun, "ad-hoc report run action must exist");
  assert.ok(periodicRun, "periodic report run action must exist");
  assert.deepEqual(adHocRun.inputFieldIds, [
    "RPT-RUN-F-DEFINITION-REF",
    "RPT-RUN-F-DEFINITION-VERSION",
  ]);
  assert.deepEqual(periodicRun.inputFieldIds, [
    "RPT-RUN-F-DEFINITION-REF",
    "RPT-RUN-F-DEFINITION-VERSION",
    "RPT-RUN-F-SUBSCRIPTION-REF",
    "RPT-RUN-F-SUBSCRIPTION-VERSION",
  ]);
  for (const action of [adHocRun, periodicRun]) {
    assert.equal(action.outputFieldIds.includes("RPT-RUN-F-DEFINITION-REF"), false);
    assert.equal(action.outputFieldIds.includes("RPT-RUN-F-DEFINITION-VERSION"), false);
  }
  assert.equal(periodicRun.outputFieldIds.includes("RPT-RUN-F-SUBSCRIPTION-REF"), true);
  assert.equal(periodicRun.outputFieldIds.includes("RPT-RUN-F-SUBSCRIPTION-VERSION"), true);

  const periodicPath = flows.find(({ id }) => id === "DF-013").executionPaths
    .find(({ id }) => id === "PERIODIC");
  assert.deepEqual(
    periodicPath.sourceBindings.map(({ sourceObjectId }) => sourceObjectId),
    ["RPT-OBJ-DEFINITION", "RPT-OBJ-SUBSCRIPTION"],
  );

  const model = structuredClone(requirementModel);
  moduleById(model, "RPT-001").actions.find(({ id }) => id === "RPT-ACT-CREATE-RUN")
    .inputFieldIds = ["RPT-RUN-F-DEFINITION-REF", "RPT-RUN-F-DEFINITION-VERSION"];
  assertHasCode(validateRequirementModel(model), "INVALID_REPORT_EXECUTION_PATH");
});

test("keys DF-013 runs by definition and periodic subscription source versions", () => {
  const flow = flows.find(({ id }) => id === "DF-013");
  assert.ok(flow.executionPaths, "DF-013 execution paths must exist");
  const pathById = new Map(flow.executionPaths.map((path) => [path.id, path]));
  assert.deepEqual(pathById.get("AD_HOC").idempotencyKeyParts, {
    identityFieldIds: [
      "RPT-DEFINITION-F-ID",
      "APP-TODO-F-ID",
      "PLN-PLAN-F-ID",
    ],
    versionFieldIds: [
      "RPT-DEFINITION-F-VERSION",
      "APP-TODO-F-AGGREGATION-VERSION",
      "PLN-PLAN-F-PLAN-VERSION",
      "PLN-HOMEROOM-F-OUTPUT-VERSION",
    ],
    fanoutFieldId: "APP-TODO-F-STUDENT-REF",
  });
  assert.deepEqual(pathById.get("PERIODIC").idempotencyKeyParts, {
    identityFieldIds: [
      "RPT-DEFINITION-F-ID",
      "RPT-SUBSCRIPTION-F-ID",
      "APP-TODO-F-ID",
      "PLN-PLAN-F-ID",
    ],
    versionFieldIds: [
      "RPT-DEFINITION-F-VERSION",
      "RPT-SUBSCRIPTION-F-VERSION",
      "APP-TODO-F-AGGREGATION-VERSION",
      "PLN-PLAN-F-PLAN-VERSION",
      "PLN-HOMEROOM-F-OUTPUT-VERSION",
    ],
    fanoutFieldId: "APP-TODO-F-STUDENT-REF",
  });

  const model = structuredClone(requirementModel);
  model.flows.find(({ id }) => id === "DF-013").executionPaths
    .find(({ id }) => id === "PERIODIC").idempotencyKeyParts.versionFieldIds
    .splice(1, 1);
  assertHasCode(validateRequirementModel(model), "INVALID_REPORT_EXECUTION_PATH");
});

test("makes every report run and delivery state explicitly reachable", () => {
  const reportModule = moduleById(requirementModel, "RPT-001");
  const actionById = new Map(reportModule.actions.map((action) => [action.id, action]));
  for (const [actionId, transition] of [
    ["RPT-ACT-START-RUN", { from: "QUEUED", to: "RUNNING" }],
    ["RPT-ACT-COMPLETE-RUN", { from: "RUNNING", to: "SUCCEEDED" }],
    ["RPT-ACT-FAIL-RUN", { from: "RUNNING", to: "FAILED" }],
    ["RPT-ACT-BLOCK-RUN-PERMISSION", { from: "QUEUED", to: "BLOCKED_PERMISSION" }],
    ["RPT-ACT-MARK-DELIVERED", { from: "PENDING", to: "DELIVERED" }],
    ["RPT-ACT-FAIL-DELIVERY", { from: "PENDING", to: "FAILED" }],
    ["RPT-ACT-RETRY-DELIVERY", { from: "FAILED", to: "PENDING" }],
  ]) {
    assert.deepEqual(actionById.get(actionId)?.transition, transition, actionId);
  }
  const permissionFailureScenario = reportModule.scenarios.find(({ actionId, kind }) => (
    actionId === "RPT-ACT-BLOCK-RUN-PERMISSION" && kind === "SUCCESS"
  ));
  assert.deepEqual(permissionFailureScenario.then.expectedState, {
    mode: "STATE",
    value: "BLOCKED_PERMISSION",
  });

  const model = structuredClone(requirementModel);
  const blockedScenario = moduleById(model, "RPT-001").scenarios.find(({ actionId, kind }) => (
    actionId === "RPT-ACT-BLOCK-RUN-PERMISSION" && kind === "SUCCESS"
  ));
  blockedScenario.then.expectedState = { mode: "UNCHANGED" };
  assertHasCode(validateRequirementModel(model), "MISSING_ACTION_STATE_EFFECT");
});

test("separates ad-hoc periodic reports from long-term learning paths", () => {
  assert.deepEqual(moduleById(requirementModel, "RPT-001").timeHorizons, {
    adHoc: "SESSION_ANALYSIS_SAVED_ONLY_ON_CONFIRMATION",
    periodic: "SUBSCRIPTION_WITH_INDEPENDENT_RUN_SNAPSHOT_AND_DELIVERY",
  });
  assert.equal(
    moduleById(requirementModel, "LPATH-001").timeHorizon,
    "CROSS_TERM_APPEND_ONLY_LONG_TERM",
  );
});

test("models learning path timeline entries as cross-term version-pinned fact references", () => {
  const pathModule = moduleById(requirementModel, "LPATH-001");
  const timeline = pathModule.objects.find(({ id }) => id === "LPATH-OBJ-TIMELINE-ENTRY");
  assert.equal(timeline.crossTerm, true);
  const fieldById = new Map(timeline.fields.map((field) => [field.id, field]));
  for (const [refId, versionId, objectId, targetVersionFieldId] of [
    ["LPATH-ENTRY-F-PUBLISHED-RESULT-REF", "LPATH-ENTRY-F-PUBLISHED-RESULT-VERSION", "PUB-OBJ-RESULT", "PUB-RESULT-F-RESULT-VERSION"],
    ["LPATH-ENTRY-F-EVIDENCE-REF", "LPATH-ENTRY-F-EVIDENCE-VERSION", "INS-OBJ-EVIDENCE", "INS-EVIDENCE-F-EVIDENCE-VERSION"],
    ["LPATH-ENTRY-F-CORRECTION-REF", "LPATH-ENTRY-F-CORRECTION-VERSION", "CORR-OBJ-ATTEMPT", "CORR-ATTEMPT-F-CORRECTION-VERSION"],
    ["LPATH-ENTRY-F-PLAN-EXECUTION-REF", "LPATH-ENTRY-F-PLAN-EXECUTION-VERSION", "APP-OBJ-TODO", "APP-TODO-F-AGGREGATION-VERSION"],
    ["LPATH-ENTRY-F-TEACHER-CONFIRMATION-REF", "LPATH-ENTRY-F-TEACHER-CONFIRMATION-VERSION", "GRD-OBJ-DECISION", "GRD-DECISION-F-DECISION-VERSION"],
  ]) {
    const refField = fieldById.get(refId);
    assert.ok(refField, `missing learning path source reference ${refId}`);
    assert.ok(fieldById.has(versionId), `missing learning path source version ${versionId}`);
    assert.equal(refField.valueSource.targetObjectId, objectId);
    assert.equal(refField.referenceIntegrity, "VERSION_PINNED");
    assert.deepEqual(refField.versionBinding, {
      versionFieldId: versionId,
      targetVersionFieldId,
    });
  }
});

test("appends each learning-path timeline entry from exactly one of five source groups", () => {
  const pathModule = moduleById(requirementModel, "LPATH-001");
  const timeline = pathModule.objects.find(({ id }) => id === "LPATH-OBJ-TIMELINE-ENTRY");
  const expectedGroups = [
    ["PUBLISHED-RESULT", "LPATH-ACT-APPEND-PUBLISHED-RESULT-TIMELINE"],
    ["EVIDENCE", "LPATH-ACT-APPEND-EVIDENCE-TIMELINE"],
    ["CORRECTION", "LPATH-ACT-APPEND-CORRECTION-TIMELINE"],
    ["PLAN-EXECUTION", "LPATH-ACT-APPEND-PLAN-EXECUTION-TIMELINE"],
    ["TEACHER-CONFIRMATION", "LPATH-ACT-APPEND-TEACHER-CONFIRMATION-TIMELINE"],
  ];
  assert.deepEqual(timeline.exclusiveSourceGroups, expectedGroups.map(([kind]) => ({
    id: kind,
    fieldIds: [
      `LPATH-ENTRY-F-${kind}-REF`,
      `LPATH-ENTRY-F-${kind}-VERSION`,
    ],
  })));
  for (const [kind, actionId] of expectedGroups) {
    const appendAction = pathModule.actions.find(({ id }) => id === actionId);
    assert.ok(appendAction, `${actionId} must exist`);
    const coveredGroups = timeline.exclusiveSourceGroups.filter(({ fieldIds }) => (
      fieldIds.every((fieldId) => appendAction.outputFieldIds.includes(fieldId))
    ));
    assert.deepEqual(coveredGroups.map(({ id }) => id), [kind]);
  }

  for (const mutate of [
    (action) => {
      action.outputFieldIds = action.outputFieldIds.filter((fieldId) => (
        fieldId !== "LPATH-ENTRY-F-EVIDENCE-VERSION"
      ));
    },
    (action) => {
      action.outputFieldIds.push(
        "LPATH-ENTRY-F-CORRECTION-REF",
        "LPATH-ENTRY-F-CORRECTION-VERSION",
      );
    },
  ]) {
    const model = structuredClone(requirementModel);
    const appendEvidence = moduleById(model, "LPATH-001").actions
      .find(({ id }) => id === "LPATH-ACT-APPEND-EVIDENCE-TIMELINE");
    mutate(appendEvidence);
    assertHasCode(validateRequirementModel(model), "INVALID_ACTION_CONTRACT");
  }
});

test("routes DF-011 through five closed exactly-one source-binding paths", () => {
  const flow = flows.find(({ id }) => id === "DF-011");
  assert.equal(flow.routingPolicy, "ACTION_CHOICE_REQUIRED");
  assert.deepEqual(flow.executionPaths.map(({ id, sourceBindings }) => ({
    id,
    sourceObjectIds: sourceBindings.map(({ sourceObjectId }) => sourceObjectId),
  })), [
    { id: "PUBLISHED_RESULT", sourceObjectIds: ["PUB-OBJ-RESULT"] },
    { id: "EVIDENCE", sourceObjectIds: ["INS-OBJ-EVIDENCE"] },
    { id: "CORRECTION", sourceObjectIds: ["CORR-OBJ-ATTEMPT"] },
    { id: "PLAN_EXECUTION", sourceObjectIds: ["APP-OBJ-TODO"] },
    { id: "TEACHER_CONFIRMATION", sourceObjectIds: ["GRD-OBJ-DECISION"] },
  ]);
  assert.ok(flow.executionPaths.every(({ sourceBindings }) => sourceBindings.length === 1));

  const model = structuredClone(requirementModel);
  model.flows.find(({ id }) => id === "DF-011").executionPaths
    .find(({ id }) => id === "EVIDENCE").sourceBindings.push({
      sourceObjectId: "PUB-OBJ-RESULT",
      sourceIdentityFieldId: "PUB-RESULT-F-ID",
      sourceVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
      consumerStepOrder: 2,
      targetRefFieldId: "LPATH-ENTRY-F-PUBLISHED-RESULT-REF",
      targetVersionFieldId: "LPATH-ENTRY-F-PUBLISHED-RESULT-VERSION",
      cardinality: "ONE",
    });
  assertHasCode(validateRequirementModel(model), "INVALID_LEARNING_PATH_SOURCE_PATH");
});

test("versions every teacher-confirmed learning path interpretation", () => {
  const pathModule = moduleById(requirementModel, "LPATH-001");
  const interpretation = pathModule.objects.find(({ id }) => (
    id === "LPATH-OBJ-INTERPRETATION"
  ));
  const fieldIds = new Set(interpretation.fields.map(({ id }) => id));
  for (const fieldId of [
    "LPATH-INTERPRETATION-F-SUBJECT",
    "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-REF",
    "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-VERSION",
    "LPATH-INTERPRETATION-F-EVIDENCE-REFS",
    "LPATH-INTERPRETATION-F-EXPLANATION",
    "LPATH-INTERPRETATION-F-CONFIDENCE",
    "LPATH-INTERPRETATION-F-LIMITATIONS",
    "LPATH-INTERPRETATION-F-TEACHER-CONFIRMER",
    "LPATH-INTERPRETATION-F-VISIBLE-FROM",
    "LPATH-INTERPRETATION-F-SUPERSEDED-BY-REF",
    "LPATH-INTERPRETATION-F-SUPERSEDED-BY-VERSION",
    "LPATH-INTERPRETATION-F-STALE-REASON",
    "LPATH-INTERPRETATION-F-VERSION",
  ]) {
    assert.ok(fieldIds.has(fieldId), `missing interpretation field ${fieldId}`);
  }
  assert.deepEqual(interpretation.states, [
    "CANDIDATE",
    "TEACHER_CONFIRMED",
    "STUDENT_VISIBLE",
    "SUPERSEDED",
    "STALE",
  ]);
});

test("makes learning-path superseded and stale states explicitly reachable", () => {
  const pathModule = moduleById(requirementModel, "LPATH-001");
  const interpretation = pathModule.objects.find(({ id }) => (
    id === "LPATH-OBJ-INTERPRETATION"
  ));
  assert.equal(interpretation.stateReachability.mode, "ACTION_GRAPH");
  const actionById = new Map(pathModule.actions.map((action) => [action.id, action]));
  assert.deepEqual(actionById.get("LPATH-ACT-SUPERSEDE-INTERPRETATION")?.transition, {
    from: ["TEACHER_CONFIRMED", "STUDENT_VISIBLE"],
    to: "SUPERSEDED",
  });
  assert.deepEqual(actionById.get("LPATH-ACT-MARK-INTERPRETATION-STALE")?.transition, {
    from: ["CANDIDATE", "TEACHER_CONFIRMED", "STUDENT_VISIBLE"],
    to: "STALE",
  });

  const model = structuredClone(requirementModel);
  const mutatedPath = moduleById(model, "LPATH-001");
  mutatedPath.actions = mutatedPath.actions.filter(({ id }) => (
    id !== "LPATH-ACT-SUPERSEDE-INTERPRETATION"
  ));
  mutatedPath.scenarios = mutatedPath.scenarios.filter(({ actionId }) => (
    actionId !== "LPATH-ACT-SUPERSEDE-INTERPRETATION"
  ));
  assertHasCode(validateRequirementModel(model), "UNREACHABLE_OBJECT_STATE");
});

test("keeps learning path history immutable and creates a new explanation version", () => {
  const pathModule = moduleById(requirementModel, "LPATH-001");
  assert.deepEqual(pathModule.historyPolicy, {
    timeline: "APPEND_ONLY_SOURCE_REFERENCES",
    sourceFacts: "NEVER_COPY_OR_REWRITE",
    interpretationChange: "CREATE_NEW_VERSION",
    priorVersions: "RETAIN_WITH_SUPERSEDED_OR_STALE_REASON",
  });

  const model = structuredClone(requirementModel);
  delete moduleById(model, "LPATH-001").historyPolicy.interpretationChange;
  assertHasCode(validateRequirementModel(model), "INVALID_LEARNING_PATH_CONTRACT");
});

test("keeps learning path writes with subject teachers and homeroom access read-only", () => {
  const pathModule = moduleById(requirementModel, "LPATH-001");
  const userWrites = pathModule.actions.filter(({ executionMode, writes }) => (
    executionMode === "USER_TASK" && writes
  ));
  assert.equal(userWrites.length > 0, true);
  for (const action of userWrites) {
    const allowSubjects = action.permissions
      .filter(({ effect }) => effect === "ALLOW")
      .map(({ dutyRef, roleRef, actorRef }) => dutyRef ?? roleRef ?? actorRef);
    assert.deepEqual(allowSubjects, ["DUTY-SUBJECT-TEACHER"]);
    assert.ok(action.permissions.some(({ effect, dutyRef }) => (
      effect === "DENY" && dutyRef === "DUTY-HOMEROOM"
    )));
  }
  const readAction = pathModule.actions.find(({ id }) => id === "LPATH-ACT-VIEW-PATH");
  assert.equal(readAction.writes, false);
  assert.deepEqual(
    readAction.permissions.filter(({ effect }) => effect === "ALLOW")
      .map(({ dutyRef }) => dutyRef),
    ["DUTY-SUBJECT-TEACHER", "DUTY-HOMEROOM"],
  );
});

test("models notification delivery retry without rolling back source business facts", () => {
  const notification = moduleById(requirementModel, "NOTI-001").objects
    .find(({ id }) => id === "NOTI-OBJ-NOTIFICATION");
  const fieldIds = new Set(notification.fields.map(({ id }) => id));
  for (const fieldId of [
    "NOTI-NOTIFICATION-F-SOURCE-EVENT",
    "NOTI-NOTIFICATION-F-RECIPIENT",
    "NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE",
    "NOTI-NOTIFICATION-F-DEEP-LINK",
    "NOTI-NOTIFICATION-F-DELIVERED-AT",
    "NOTI-NOTIFICATION-F-READ-AT",
    "NOTI-NOTIFICATION-F-HANDLED-AT",
    "NOTI-NOTIFICATION-F-FAILURE-CODE",
    "NOTI-NOTIFICATION-F-RETRY-COUNT",
  ]) {
    assert.ok(fieldIds.has(fieldId), `missing notification field ${fieldId}`);
  }
  assert.deepEqual(notification.deliveryFailurePolicy, {
    sourceBusinessFactRollback: false,
    retryScope: "NOTIFICATION_DELIVERY_ONLY",
    preserveAcceptedSourceVersion: true,
  });

  const model = structuredClone(requirementModel);
  moduleById(model, "NOTI-001").objects[0]
    .deliveryFailurePolicy.sourceBusinessFactRollback = true;
  assertHasCode(validateRequirementModel(model), "INVALID_NOTIFICATION_CONTRACT");
});

test("validates declared-state reachability through a generic action graph", () => {
  const validModel = validFixture();
  moduleById(validModel, "SUB-001").objects[0].stateReachability = {
    mode: "ACTION_GRAPH",
    initialStateIds: ["DRAFT"],
  };
  assert.deepEqual(validateRequirementModel(validModel), []);

  const unreachableModel = structuredClone(validModel);
  delete moduleById(unreachableModel, "SUB-001").actions[0].transition;
  assertHasCode(validateRequirementModel(unreachableModel), "UNREACHABLE_OBJECT_STATE");
});

test("rejects NONE for polymorphic or state-changing objects", () => {
  const polymorphicModel = validFixture();
  moduleById(polymorphicModel, "SUB-001").objects[0].stateReachability = {
    mode: "ACTION_GRAPH",
    initialStateIds: ["DRAFT"],
  };
  assert.deepEqual(validateRequirementModel(polymorphicModel), []);
  moduleById(polymorphicModel, "SUB-001").objects[0].stateReachability = { mode: "NONE" };

  const oneStateWriteModel = structuredClone(requirementModel);
  const aixPreview = moduleById(oneStateWriteModel, "AIX-001").objects
    .find(({ id }) => id === "AIX-OBJ-TASK-PREVIEW");
  assert.deepEqual(aixPreview.states, ["PREVIEW_READY"]);
  assert.equal(aixPreview.stateReachability.mode, "ACTION_GRAPH");
  aixPreview.stateReachability = { mode: "NONE" };

  const missedMutations = [];
  for (const [name, model] of [
    ["polymorphic update object", polymorphicModel],
    ["one-state CREATE object", oneStateWriteModel],
  ]) {
    if (!errorCodes(validateRequirementModel(model)).includes(
      "INVALID_STATE_REACHABILITY_POLICY",
    )) {
      missedMutations.push(name);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("reaches alternate Action scenario states in the generic graph", () => {
  const model = validFixture();
  const module = moduleById(model, "SUB-001");
  module.objects[0].states.push("CONFLICT");
  module.objects[0].stateReachability = {
    mode: "ACTION_GRAPH",
    initialStateIds: ["DRAFT"],
  };
  module.scenarios.find(({ kind }) => kind === "FAILURE").then.expectedState = {
    mode: "STATE",
    value: "CONFLICT",
  };

  assertNoCode(validateRequirementModel(model), "UNREACHABLE_OBJECT_STATE");
});

test("rejects terminal states as unauthored initial entries", () => {
  const terminalInitial = structuredClone(requirementModel);
  const assignment = moduleById(terminalInitial, "HW-001").objects
    .find(({ id }) => id === "HW-OBJ-ASSIGNMENT");
  assignment.stateReachability.initialStateIds = ["CLOSED"];

  assertHasCode(validateRequirementModel(terminalInitial), "INVALID_STATE_ENTRY_SOURCE");
});

test("rejects multiple naked initial states on write objects without CREATE", () => {
  const model = validFixture();
  assertNoCode(validateRequirementModel(model), "INVALID_STATE_ENTRY_SOURCE");
  moduleById(model, "SUB-001").objects[0].stateReachability.initialStateIds = [
    "DRAFT",
    "SUBMITTED",
  ];

  assertHasCode(validateRequirementModel(model), "INVALID_STATE_ENTRY_SOURCE");
});

test("rejects metadata-only external state entry sources", () => {
  const model = structuredClone(requirementModel);
  const school = moduleById(model, "ACC-001").objects
    .find(({ id }) => id === "ACC-OBJ-SCHOOL");
  school.stateReachability = {
    mode: "ACTION_GRAPH",
    initialStateIds: [],
    entrySources: school.states.map((stateId) => ({
      kind: "EXTERNAL_SOURCE",
      stateId,
      producerRef: school.producerRef,
    })),
  };

  assertHasCode(validateRequirementModel(model), "INVALID_EXTERNAL_SOURCE_PROVENANCE");
});

test("models external projections as event-driven source-version sync", () => {
  const contracts = [
    ["ACC-001", "ACC-OBJ-SCHOOL", "ACC-ACT-SYNC-SCHOOL", "EVT-SCHOOL-DIRECTORY-SNAPSHOT-AVAILABLE", "ACC-SCHOOL-F-SOURCE-REF", "ACC-SCHOOL-F-SOURCE-VERSION"],
    ["ACC-001", "ACC-OBJ-IDENTITY", "ACC-ACT-SYNC-IDENTITY", "EVT-IDENTITY-DIRECTORY-SNAPSHOT-AVAILABLE", "ACC-IDENTITY-F-SOURCE-REF", "ACC-IDENTITY-F-SOURCE-VERSION"],
    ["IAM-001", "IAM-OBJ-ROLE-POLICY", "IAM-ACT-SYNC-ROLE-POLICY", "EVT-ROLE-POLICY-SNAPSHOT-AVAILABLE", "IAM-ROLE-F-SOURCE-REF", "IAM-ROLE-F-SOURCE-VERSION"],
    ["DGV-001", "DGV-OBJ-POLICY", "DGV-ACT-SYNC-POLICY", "EVT-DATA-GOVERNANCE-POLICY-SNAPSHOT-AVAILABLE", "DGV-POLICY-F-SOURCE-REF", "DGV-POLICY-F-SOURCE-VERSION"],
    ["TEA-001", "TEA-OBJ-TODO-VIEW", "TEA-ACT-SYNC-TODO-VIEW", "EVT-TEACHER-TODO-PROJECTION-AVAILABLE", "TEA-TODO-F-PROJECTION-SOURCE-REF", "TEA-TODO-F-PROJECTION-SOURCE-VERSION"],
    ["HW-001", "HW-OBJ-RUBRIC", "HW-ACT-SYNC-RUBRIC", "EVT-RUBRIC-SNAPSHOT-AVAILABLE", "HW-RUBRIC-F-SOURCE-REF", "HW-RUBRIC-F-SOURCE-VERSION"],
    ["GRD-001", "GRD-OBJ-CAPABILITY-RULE", "GRD-ACT-SYNC-CAPABILITY-RULE", "EVT-GRADING-CAPABILITY-SNAPSHOT-AVAILABLE", "GRD-CAP-F-SOURCE-REF", "GRD-CAP-F-SOURCE-VERSION"],
  ];
  for (const [
    moduleId,
    objectId,
    actionId,
    eventId,
    sourceRefFieldId,
    sourceVersionFieldId,
  ] of contracts) {
    const targetModule = moduleById(requirementModel, moduleId);
    const targetObject = targetModule.objects.find(({ id }) => id === objectId);
    const sourceAction = targetModule.actions.find(({ id }) => id === actionId);
    const sourceEvent = events.find(({ id }) => id === eventId);
    assert.ok(sourceAction, actionId);
    assert.equal(Object.hasOwn(targetObject.stateReachability, "entrySources"), false);
    assert.equal(sourceAction.operationKind, "CREATE");
    assert.equal(sourceAction.executionMode, "SYSTEM_EVENT");
    assert.equal(sourceAction.trigger.eventId, eventId);
    for (const fieldId of [sourceRefFieldId, sourceVersionFieldId]) {
      const sourceField = targetObject.fields.find(({ id }) => id === fieldId);
      assert.ok(sourceField, fieldId);
      assert.equal(sourceField.mutability, "IMMUTABLE", fieldId);
      assert.ok(sourceAction.inputFieldIds.includes(fieldId), actionId);
      assert.ok(sourceAction.outputFieldIds.includes(fieldId), actionId);
    }
    assert.ok(sourceEvent.triggeredActionIds.includes(actionId), eventId);
    const successStates = new Set(targetModule.scenarios
      .filter(({ actionId: scenarioActionId, kind }) => (
        scenarioActionId === actionId && kind === "SUCCESS"
      ))
      .map(({ then }) => then.expectedState.value));
    assert.deepEqual(successStates, new Set(targetObject.states), objectId);
  }
});

test("rejects wrong or incomplete external projection provenance bindings", () => {
  const contracts = [
    ["ACC-ACT-SYNC-SCHOOL", "ACC-SCHOOL-F-SOURCE-REF", "ACC-SCHOOL-F-SOURCE-VERSION"],
    ["ACC-ACT-SYNC-IDENTITY", "ACC-IDENTITY-F-SOURCE-REF", "ACC-IDENTITY-F-SOURCE-VERSION"],
    ["IAM-ACT-SYNC-ROLE-POLICY", "IAM-ROLE-F-SOURCE-REF", "IAM-ROLE-F-SOURCE-VERSION"],
    ["DGV-ACT-SYNC-POLICY", "DGV-POLICY-F-SOURCE-REF", "DGV-POLICY-F-SOURCE-VERSION"],
    ["TEA-ACT-SYNC-TODO-VIEW", "TEA-TODO-F-PROJECTION-SOURCE-REF", "TEA-TODO-F-PROJECTION-SOURCE-VERSION"],
    ["HW-ACT-SYNC-RUBRIC", "HW-RUBRIC-F-SOURCE-REF", "HW-RUBRIC-F-SOURCE-VERSION"],
    ["GRD-ACT-SYNC-CAPABILITY-RULE", "GRD-CAP-F-SOURCE-REF", "GRD-CAP-F-SOURCE-VERSION"],
  ];
  const mutations = [
    (action) => {
      action.trigger.eventId = "EVT-AUDIT-APPEND-REQUESTED";
    },
    (action, sourceRefFieldId) => {
      action.inputFieldIds = action.inputFieldIds
        .filter((fieldId) => fieldId !== sourceRefFieldId);
    },
    (action, sourceRefFieldId, sourceVersionFieldId) => {
      action.outputFieldIds = action.outputFieldIds
        .filter((fieldId) => fieldId !== sourceVersionFieldId);
    },
  ];
  const missedMutations = [];
  for (const [actionId, sourceRefFieldId, sourceVersionFieldId] of contracts) {
    for (const mutate of mutations) {
      const model = structuredClone(requirementModel);
      const sourceAction = model.modules.flatMap(({ actions }) => actions)
        .find(({ id }) => id === actionId);
      mutate(sourceAction, sourceRefFieldId, sourceVersionFieldId);
      if (!errorCodes(validateRequirementModel(model)).includes(
        "INVALID_EXTERNAL_SOURCE_PROVENANCE",
      )) {
        missedMutations.push(`${actionId}:${mutate.name || "mutation"}`);
      }
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("uses only successful CREATE outcomes as state graph entries", () => {
  const model = structuredClone(requirementModel);
  const aixModule = moduleById(model, "AIX-001");
  const preview = aixModule.objects.find(({ id }) => id === "AIX-OBJ-TASK-PREVIEW");
  preview.states.push("FAILED");
  const createAction = aixModule.actions.find(({ id }) => (
    id === "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW"
  ));
  const failureScenario = aixModule.scenarios.find(({ actionId, kind }) => (
    actionId === createAction.id && kind === "FAILURE"
  ));
  failureScenario.then.expectedState = { mode: "STATE", value: "FAILED" };

  assertHasCode(validateRequirementModel(model), "UNREACHABLE_OBJECT_STATE");
});

test("lets a recipient update only their own delivered notification", () => {
  const notificationModule = moduleById(requirementModel, "NOTI-001");
  for (const actionId of ["NOTI-ACT-MARK-READ", "NOTI-ACT-MARK-HANDLED"]) {
    const targetAction = notificationModule.actions.find(({ id }) => id === actionId);
    assert.ok(targetAction.permissions.some((permission) => (
      permission.effect === "ALLOW"
      && permission.actorRef === "CURRENT_ACTOR"
      && permission.scope?.kind === "OWN_RECORD"
      && permission.scope.subjectFieldId === "NOTI-NOTIFICATION-F-RECIPIENT"
    )), `${actionId} must allow the current recipient`);
    assert.ok(targetAction.permissions.some((permission) => (
      permission.effect === "DENY"
      && permission.actorRef === "CURRENT_ACTOR"
      && permission.scope?.kind === "OTHER_RECORD"
      && permission.scope.subjectFieldId === "NOTI-NOTIFICATION-F-RECIPIENT"
    )), `${actionId} must deny another recipient's notification`);
    assert.ok(targetAction.permissions.some((permission) => (
      permission.effect === "DENY" && permission.roleRef === "ROLE-PLATFORM-OPS"
    )), `${actionId} must deny platform operations by default`);
  }

  const markRead = notificationModule.actions.find(({ id }) => id === "NOTI-ACT-MARK-READ");
  assert.deepEqual(markRead.transition, { from: "DELIVERED", to: "READ" });
  const markHandled = notificationModule.actions
    .find(({ id }) => id === "NOTI-ACT-MARK-HANDLED");
  assert.deepEqual(markHandled.transition, { from: "READ", to: "HANDLED" });
});

test("lets every supported recipient mutate only their own notification", () => {
  const notificationModule = moduleById(requirementModel, "NOTI-001");
  const notification = notificationModule.objects.find(({ id }) => (
    id === "NOTI-OBJ-NOTIFICATION"
  ));
  assert.deepEqual(notification.recipientPolicy, {
    subjectFieldId: "NOTI-NOTIFICATION-F-RECIPIENT",
    allowedRecipientSubjects: [
      "ROLE-STUDENT",
      "DUTY-SUBJECT-TEACHER",
      "DUTY-HOMEROOM",
      "ROLE-ACADEMIC",
    ],
    mutationSubject: "CURRENT_ACTOR",
    ownershipMode: "OWN_RECORD_ONLY",
  });
  for (const actionId of ["NOTI-ACT-MARK-READ", "NOTI-ACT-MARK-HANDLED"]) {
    const targetAction = notificationModule.actions.find(({ id }) => id === actionId);
    assert.ok(targetAction.permissions.some((permission) => (
      permission.effect === "ALLOW"
      && permission.actorRef === "CURRENT_ACTOR"
      && permission.scope?.kind === "OWN_RECORD"
      && permission.scope.subjectFieldId === "NOTI-NOTIFICATION-F-RECIPIENT"
    )), `${actionId} must allow every supported current recipient on the actor's own record`);
    assert.ok(targetAction.permissions.some((permission) => (
      permission.effect === "DENY"
      && permission.actorRef === "CURRENT_ACTOR"
      && permission.scope?.kind === "OTHER_RECORD"
      && permission.scope.subjectFieldId === "NOTI-NOTIFICATION-F-RECIPIENT"
    )), `${actionId} must deny every supported current recipient on another record`);
    assert.ok(targetAction.permissions.some(({ effect, roleRef }) => (
      effect === "DENY" && roleRef === "ROLE-PLATFORM-OPS"
    )));
  }

  for (const mutate of [
    (model) => {
      moduleById(model, "NOTI-001").objects[0]
        .recipientPolicy.allowedRecipientSubjects.pop();
    },
    (model) => {
      const markRead = moduleById(model, "NOTI-001").actions
        .find(({ id }) => id === "NOTI-ACT-MARK-READ");
      const allow = markRead.permissions.find(({ effect }) => effect === "ALLOW");
      delete allow.actorRef;
      allow.roleRef = "ROLE-STUDENT";
    },
    (model) => {
      const markHandled = moduleById(model, "NOTI-001").actions
        .find(({ id }) => id === "NOTI-ACT-MARK-HANDLED");
      markHandled.permissions = markHandled.permissions
        .filter(({ scope }) => scope?.kind !== "OTHER_RECORD");
    },
  ]) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_NOTIFICATION_CONTRACT");
  }
});

test("binds notification mutation fields to their exact declared writer Actions", () => {
  const notificationModule = moduleById(requirementModel, "NOTI-001");
  const notification = notificationModule.objects.find(({ id }) => (
    id === "NOTI-OBJ-NOTIFICATION"
  ));
  const expectedBindings = [
    ["NOTI-NOTIFICATION-F-DELIVERED-AT", "DELIVERED", ["NOTI-ACT-DELIVER"]],
    ["NOTI-NOTIFICATION-F-FAILURE-CODE", "FAILED", ["NOTI-ACT-FAIL-DELIVERY"]],
    ["NOTI-NOTIFICATION-F-RETRY-COUNT", "QUEUED", [
      "NOTI-ACT-CREATE-REMINDER",
      "NOTI-ACT-CREATE-REPORT-NOTIFICATION",
      "NOTI-ACT-RETRY-DELIVERY",
    ]],
    ["NOTI-NOTIFICATION-F-READ-AT", "READ", ["NOTI-ACT-MARK-READ"]],
    ["NOTI-NOTIFICATION-F-HANDLED-AT", "HANDLED", ["NOTI-ACT-MARK-HANDLED"]],
  ];
  for (const [fieldId, state, actionIds] of expectedBindings) {
    const targetField = notification.fields.find(({ id }) => id === fieldId);
    assert.equal(typeof targetField.required.description, "string");
    assert.deepEqual(targetField.required.whenStates, [state]);
    assert.deepEqual(new Set(targetField.required.whenActionIds), new Set(actionIds));
    const writers = notificationModule.actions
      .filter(({ outputFieldIds }) => outputFieldIds.includes(fieldId))
      .map(({ id }) => id);
    assert.deepEqual(new Set(writers), new Set(actionIds), fieldId);

    for (const actionId of actionIds) {
      const model = structuredClone(requirementModel);
      const targetAction = moduleById(model, "NOTI-001").actions
        .find(({ id }) => id === actionId);
      targetAction.outputFieldIds = targetAction.outputFieldIds
        .filter((candidate) => candidate !== fieldId);
      assertHasCode(validateRequirementModel(model), "INVALID_ACTION_REQUIRED_FIELD");
    }
  }
  assert.deepEqual(notification.deliveryFailurePolicy, {
    sourceBusinessFactRollback: false,
    retryScope: "NOTIFICATION_DELIVERY_ONLY",
    preserveAcceptedSourceVersion: true,
  });
});

test("requires conditional field writers to exactly match whenActionIds", () => {
  const model = structuredClone(requirementModel);
  const markRead = moduleById(model, "NOTI-001").actions
    .find(({ id }) => id === "NOTI-ACT-MARK-READ");
  markRead.outputFieldIds.push("NOTI-NOTIFICATION-F-DELIVERED-AT");

  assertHasCode(validateRequirementModel(model), "INVALID_FIELD_ACTION_BINDING");
});

test("initializes notification retry count at zero and increments only on retry", () => {
  const notificationModule = moduleById(requirementModel, "NOTI-001");
  const retryCount = notificationModule.objects[0].fields
    .find(({ id }) => id === "NOTI-NOTIFICATION-F-RETRY-COUNT");
  const initializerActionIds = [
    "NOTI-ACT-CREATE-REMINDER",
    "NOTI-ACT-CREATE-REPORT-NOTIFICATION",
  ];
  const mutatorActionIds = ["NOTI-ACT-RETRY-DELIVERY"];
  assert.deepEqual(retryCount.writeContract, {
    initializers: { actionIds: initializerActionIds, value: 0 },
    mutators: { actionIds: mutatorActionIds, operation: "INCREMENT", amount: 1 },
  });
  assert.deepEqual(
    new Set(retryCount.required.whenActionIds),
    new Set([...initializerActionIds, ...mutatorActionIds]),
  );
  for (const actionId of initializerActionIds) {
    const targetAction = notificationModule.actions.find(({ id }) => id === actionId);
    assert.ok(targetAction.outputFieldIds.includes(retryCount.id), actionId);
    assert.deepEqual(targetAction.fieldWrites, [{
      fieldId: retryCount.id,
      mode: "INITIALIZE",
      value: 0,
    }]);
  }
  const retryAction = notificationModule.actions
    .find(({ id }) => id === "NOTI-ACT-RETRY-DELIVERY");
  assert.ok(retryAction.outputFieldIds.includes(retryCount.id));
  assert.deepEqual(retryAction.fieldWrites, [{
    fieldId: retryCount.id,
    mode: "INCREMENT",
    amount: 1,
  }]);
});

test("rejects incomplete or incorrect initializer and mutator write contracts", () => {
  const fieldId = "NOTI-NOTIFICATION-F-RETRY-COUNT";
  const mutations = [
    (module) => {
      module.actions.find(({ id }) => id === "NOTI-ACT-CREATE-REMINDER")
        .fieldWrites[0].value = 1;
    },
    (module) => {
      const createReport = module.actions
        .find(({ id }) => id === "NOTI-ACT-CREATE-REPORT-NOTIFICATION");
      createReport.outputFieldIds = createReport.outputFieldIds
        .filter((candidate) => candidate !== fieldId);
    },
    (module) => {
      module.objects[0].fields.find(({ id }) => id === fieldId)
        .writeContract.initializers.actionIds.pop();
    },
    (module) => {
      module.actions.find(({ id }) => id === "NOTI-ACT-DELIVER")
        .outputFieldIds.push(fieldId);
    },
    (module) => {
      module.actions.find(({ id }) => id === "NOTI-ACT-RETRY-DELIVERY")
        .fieldWrites[0].amount = 2;
    },
  ];
  const missedMutations = [];
  for (const [index, mutate] of mutations.entries()) {
    const model = structuredClone(requirementModel);
    mutate(moduleById(model, "NOTI-001"));
    if (!errorCodes(validateRequirementModel(model)).includes("INVALID_FIELD_WRITE_CONTRACT")) {
      missedMutations.push(index);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("makes notification delivery failure and retry states explicitly reachable", () => {
  const notificationModule = moduleById(requirementModel, "NOTI-001");
  const actionById = new Map(notificationModule.actions.map((action) => [action.id, action]));
  assert.deepEqual(actionById.get("NOTI-ACT-DELIVER")?.transition, {
    from: "QUEUED",
    to: "DELIVERED",
  });
  assert.deepEqual(actionById.get("NOTI-ACT-FAIL-DELIVERY")?.transition, {
    from: "QUEUED",
    to: "FAILED",
  });
  assert.deepEqual(actionById.get("NOTI-ACT-RETRY-DELIVERY")?.transition, {
    from: "FAILED",
    to: "QUEUED",
  });

  const model = structuredClone(requirementModel);
  const mutatedNotification = moduleById(model, "NOTI-001");
  mutatedNotification.actions = mutatedNotification.actions.filter(({ id }) => (
    id !== "NOTI-ACT-DELIVER"
  ));
  mutatedNotification.scenarios = mutatedNotification.scenarios.filter(({ actionId }) => (
    actionId !== "NOTI-ACT-DELIVER"
  ));
  assertHasCode(validateRequirementModel(model), "UNREACHABLE_OBJECT_STATE");
});

test("keeps third-party notification channels as phase-two metadata only", () => {
  const extension = extensions.find(({ id }) => id === "EXT-THIRD-PARTY-NOTIFICATIONS");
  assert.deepEqual(Object.keys(extension).sort(), [
    "dependencies",
    "entryCriteria",
    "excludedFirstStageBehavior",
    "id",
    "label",
    "phase",
    "status",
  ]);
  assert.equal(extension.phase, PHASE.SECOND);
  assert.equal(extension.status, "REGISTERED_ONLY");
  assert.equal(
    flows.some(({ steps }) => steps.some(({ actionId }) => (
      actionId.includes("THIRD-PARTY") || actionId.includes("WECHAT")
    ))),
    false,
  );
});

test("closes phase-one notification channels to explicit in-product delivery", () => {
  const channelOptionSet = optionSets.find(({ id }) => id === "OPT-ENUM-047");
  assert.ok(channelOptionSet, "phase-one notification channel Option Set must exist");
  assert.deepEqual(channelOptionSet.values, [{ code: "IN_PRODUCT", label: "站内" }]);
  const channelObjects = modules.flatMap((module) => module.objects)
    .filter(({ channelPolicy }) => channelPolicy?.mode === "PHASE_ONE_CLOSED");
  assert.deepEqual(channelObjects.map(({ id }) => id), [
    "RPT-OBJ-DELIVERY",
    "NOTI-OBJ-NOTIFICATION",
  ]);
  const actionById = new Map(modules.flatMap((module) => (
    module.actions.map((action) => [action.id, action])
  )));
  for (const object of channelObjects) {
    const channelField = object.fields.find(({ id }) => id === object.channelPolicy.fieldId);
    assert.equal(channelField.valueSource.optionSetId, "OPT-ENUM-047");
    const targetActions = [...actionById.values()].filter(({ targetObjectId }) => (
      targetObjectId === object.id
    ));
    assert.ok(targetActions.length > 0);
    assert.ok(targetActions.every(({ channel }) => channel === "IN_PRODUCT"));
  }

  const wrongActionChannel = structuredClone(requirementModel);
  moduleById(wrongActionChannel, "NOTI-001").actions
    .find(({ id }) => id === "NOTI-ACT-CREATE-REMINDER").channel = "WECHAT";
  assertHasCode(validateRequirementModel(wrongActionChannel), "INVALID_NOTIFICATION_CHANNEL");

  const expandedOptionSet = structuredClone(requirementModel);
  expandedOptionSet.optionSets.find(({ id }) => id === "OPT-ENUM-047")
    .values.push({ code: "WECHAT", label: "微信" });
  assertHasCode(validateRequirementModel(expandedOptionSet), "INVALID_NOTIFICATION_CHANNEL");
});

test("requires the exact unique in-product notification channel tuple", () => {
  const mutations = [
    (model) => {
      model.optionSets.find(({ id }) => id === "OPT-ENUM-047").values[0].label = "微信";
    },
    (model) => {
      model.optionSets.find(({ id }) => id === "OPT-ENUM-047")
        .values.push({ code: "WECHAT", label: "微信" });
    },
    (model) => {
      model.optionSets.find(({ id }) => id === "OPT-ENUM-047")
        .values.push({ code: "IN_PRODUCT", label: "站内" });
    },
  ];
  for (const mutate of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_NOTIFICATION_CHANNEL");
  }
});

test("adds only DF-011 and DF-013 while preserving the Task 6 Flow boundary", () => {
  assert.deepEqual(
    teachingLoopFactExports.teachingLoopFlows.map(({ id }) => id),
    [
      "DF-004",
      "DF-005",
      "DF-006",
      "DF-007",
      "DF-008",
      "DF-009",
      "DF-010",
      "DF-012",
      "DF-014",
    ],
  );
  assert.deepEqual(
    aiReportingFactExports.aiReportingFlows.map(({ id }) => id),
    ["DF-011", "DF-013"],
  );
  assert.deepEqual(
    flows.map(({ id }) => id),
    [
      "DF-001",
      "DF-002",
      "DF-003",
      "DF-004",
      "DF-005",
      "DF-006",
      "DF-007",
      "DF-008",
      "DF-009",
      "DF-010",
      "DF-012",
      "DF-014",
      "DF-011",
      "DF-013",
    ],
  );
});

test("requires one closed contract profile for every Flow", () => {
  assert.deepEqual(
    flows.map(({ id, contractProfile }) => [id, contractProfile]),
    [
      ["DF-001", "GENERIC"],
      ["DF-002", "GENERIC"],
      ["DF-003", "GENERIC"],
      ["DF-004", "GENERIC"],
      ["DF-005", "GENERIC"],
      ["DF-006", "GENERIC"],
      ["DF-007", "GENERIC"],
      ["DF-008", "GENERIC"],
      ["DF-009", "GENERIC"],
      ["DF-010", "GENERIC"],
      ["DF-012", "GENERIC"],
      ["DF-014", "GENERIC"],
      ["DF-011", "LEARNING_PATH_AGGREGATION"],
      ["DF-013", "REPORT_MATERIALIZATION"],
    ],
  );

  for (const mutate of [
    (model) => { delete model.flows.find(({ id }) => id === "DF-011").contractProfile; },
    (model) => {
      model.flows.find(({ id }) => id === "DF-013").contractProfile = "GENERIC";
    },
    (model) => { model.flows[0].contractProfile = "UNREGISTERED"; },
  ]) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_FLOW_PROFILE");
  }
});

test("validates specialized Flow profiles from closed semantic roles", () => {
  const learningPathFlow = flows.find(({ id }) => id === "DF-011");
  const reportFlow = flows.find(({ id }) => id === "DF-013");
  assert.deepEqual(learningPathFlow.participantRoles?.map(({ role }) => role), [
    "PUBLISHED_RESULT_SOURCE",
    "EVIDENCE_SOURCE",
    "CORRECTION_SOURCE",
    "PLAN_EXECUTION_SOURCE",
    "TEACHER_CONFIRMATION_SOURCE",
    "LEARNING_PATH_DERIVATION",
  ]);
  assert.deepEqual(learningPathFlow.steps.map(({ semanticRole }) => semanticRole), [
    "APPEND_PUBLISHED_RESULT",
    "APPEND_EVIDENCE",
    "APPEND_CORRECTION",
    "APPEND_PLAN_EXECUTION",
    "APPEND_TEACHER_CONFIRMATION",
    "CREATE_INTERPRETATION_CANDIDATE",
  ]);
  assert.deepEqual(reportFlow.participantRoles?.map(({ role }) => role), [
    "STUDENT_EXECUTION_SOURCE",
    "PLAN_COORDINATION_SOURCE",
    "REPORT_PIPELINE",
    "NOTIFICATION_SINK",
  ]);
  assert.deepEqual(reportFlow.steps.map(({ semanticRole }) => semanticRole), [
    "READ_STUDENT_EXECUTION",
    "READ_PLAN_COORDINATION",
    "CREATE_AD_HOC_RUN",
    "CREATE_PERIODIC_RUN",
    "START_RUN",
    "COMPLETE_RUN",
    "MATERIALIZE_SNAPSHOT",
    "CREATE_DELIVERY",
    "CREATE_NOTIFICATION",
  ]);

  const mutations = [
    (model) => {
      const steps = model.flows.find(({ id }) => id === "DF-011").steps;
      [steps[0].actionId, steps[1].actionId] = [steps[1].actionId, steps[0].actionId];
    },
    (model) => {
      const retryable = model.flows.find(({ id }) => id === "DF-013")
        .retryPolicy.retryableFailureResults;
      retryable.splice(retryable.indexOf("DELIVERY_FAILED"), 1);
    },
    (model) => {
      const flow = model.flows.find(({ id }) => id === "DF-013");
      flow.sourceDataRefs = flow.sourceDataRefs.filter(({ fieldId }) => (
        fieldId !== "RPT-DEFINITION-F-VERSION"
      ));
    },
    (model) => {
      model.flows.find(({ id }) => id === "DF-013")
        .idempotencyKeyParts.fanoutFieldId = "PLN-PLAN-F-ID";
    },
    (model) => {
      model.flows.find(({ id }) => id === "DF-013").moduleIds[0] = "STU-001";
    },
    (model) => {
      const steps = model.flows.find(({ id }) => id === "DF-013").steps;
      [steps[0].semanticRole, steps[1].semanticRole] = [
        steps[1].semanticRole,
        steps[0].semanticRole,
      ];
    },
    (model) => {
      model.flows.find(({ id }) => id === "DF-011").executionPaths[0]
        .sourceBindings[0].targetRefFieldId = "LPATH-ENTRY-F-EVIDENCE-REF";
    },
    (model) => {
      model.flows.find(({ id }) => id === "DF-013").executionPaths[0]
        .idempotencyKeyParts.versionFieldIds.pop();
    },
    (model) => {
      model.flows.find(({ id }) => id === "DF-013").compensation.strategy = "ROLLBACK_SOURCE";
    },
    (model) => {
      model.flows.find(({ id }) => id === "DF-011").failureGranularity = "FLOW";
    },
    (model) => {
      model.flows.find(({ id }) => id === "DF-011").sourceDataRefs[0].semanticRole
        = "SOURCE_PAYLOAD";
    },
    (model) => {
      model.flows.find(({ id }) => id === "DF-013").targetDataRefs[0].semanticRole
        = "TARGET_PAYLOAD";
    },
    (model) => {
      model.flows.find(({ id }) => id === "DF-011").participantRoles[0].role
        = "EVIDENCE_SOURCE";
    },
  ];
  for (const mutate of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_FLOW_PROFILE");
  }
});

test("defines DF-011 as five-source learning-path versioned aggregation", () => {
  const flow = flows.find(({ id }) => id === "DF-011");
  assert.ok(flow, "DF-011 must exist");
  assert.equal(flow.routingPolicy, "ACTION_CHOICE_REQUIRED");
  assert.deepEqual(flow.moduleIds, [
    "PUB-001",
    "INS-001",
    "CORR-001",
    "APP-001",
    "GRD-001",
    "LPATH-001",
  ]);
  assert.deepEqual(flow.sourceOnlyModuleIds, [
    "PUB-001",
    "INS-001",
    "CORR-001",
    "APP-001",
    "GRD-001",
  ]);
  assert.deepEqual(flow.steps.map(({ actionId, providedInputs }) => ({
    actionId,
    providedInputs,
  })), [
    { actionId: "LPATH-ACT-APPEND-PUBLISHED-RESULT-TIMELINE", providedInputs: [] },
    { actionId: "LPATH-ACT-APPEND-EVIDENCE-TIMELINE", providedInputs: [] },
    { actionId: "LPATH-ACT-APPEND-CORRECTION-TIMELINE", providedInputs: [] },
    { actionId: "LPATH-ACT-APPEND-PLAN-EXECUTION-TIMELINE", providedInputs: [] },
    { actionId: "LPATH-ACT-APPEND-TEACHER-CONFIRMATION-TIMELINE", providedInputs: [] },
    { actionId: "LPATH-ACT-CREATE-INTERPRETATION-CANDIDATE", providedInputs: [] },
  ]);
  assert.deepEqual(
    [...new Set(flow.sourceDataRefs.map(({ objectId }) => objectId))],
    [
      "PUB-OBJ-RESULT",
      "INS-OBJ-EVIDENCE",
      "CORR-OBJ-ATTEMPT",
      "APP-OBJ-TODO",
      "GRD-OBJ-DECISION",
    ],
  );
  assert.deepEqual(
    [...new Set(flow.targetDataRefs.map(({ objectId }) => objectId))],
    ["LPATH-OBJ-TIMELINE-ENTRY", "LPATH-OBJ-INTERPRETATION"],
  );
});

test("defines DF-013 as student execution report materialization with in-product delivery", () => {
  const flow = flows.find(({ id }) => id === "DF-013");
  assert.ok(flow, "DF-013 must exist");
  assert.equal(flow.routingPolicy, "ACTION_CHOICE_REQUIRED");
  assert.deepEqual(flow.moduleIds, ["APP-001", "PLN-001", "RPT-001", "NOTI-001"]);
  assert.deepEqual(flow.steps.map(({ actionId, providedInputs }) => ({
    actionId,
    providedInputs,
  })), [
    { actionId: "APP-ACT-VIEW-TODOS", providedInputs: [] },
    { actionId: "PLN-ACT-VIEW-HOMEROOM-COORDINATION", providedInputs: [] },
    {
      actionId: "RPT-ACT-CREATE-AD-HOC-RUN",
      providedInputs: [
        { fieldId: "RPT-RUN-F-DEFINITION-REF", provider: { actorRef: "SYSTEM" } },
        { fieldId: "RPT-RUN-F-DEFINITION-VERSION", provider: { actorRef: "SYSTEM" } },
      ],
    },
    {
      actionId: "RPT-ACT-CREATE-RUN",
      providedInputs: [
        { fieldId: "RPT-RUN-F-DEFINITION-REF", provider: { actorRef: "SYSTEM" } },
        { fieldId: "RPT-RUN-F-DEFINITION-VERSION", provider: { actorRef: "SYSTEM" } },
        { fieldId: "RPT-RUN-F-SUBSCRIPTION-REF", provider: { actorRef: "SYSTEM" } },
        { fieldId: "RPT-RUN-F-SUBSCRIPTION-VERSION", provider: { actorRef: "SYSTEM" } },
      ],
    },
    { actionId: "RPT-ACT-START-RUN", providedInputs: [] },
    { actionId: "RPT-ACT-COMPLETE-RUN", providedInputs: [] },
    { actionId: "RPT-ACT-MATERIALIZE-SNAPSHOT", providedInputs: [] },
    { actionId: "RPT-ACT-CREATE-DELIVERY", providedInputs: [] },
    { actionId: "NOTI-ACT-CREATE-REPORT-NOTIFICATION", providedInputs: [] },
  ]);
  const model = structuredClone(requirementModel);
  model.flows.find(({ id }) => id === "DF-013").steps[8].actionId = "THIRD-PARTY-NOTIFICATION";
  assertHasCode(validateRequirementModel(model), "MISSING_FLOW_ACTION");
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
    "HW-ACT-SYNC-RUBRIC",
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
    "APP-ACT-CREATE-HOMEWORK-TODO",
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
      "SUB-ACT-MARK-DRAFT-READY",
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
    "GRD-ACT-SYNC-CAPABILITY-RULE",
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

  for (const action of grading.actions.filter(({ targetObjectId, failureResults }) => (
    targetObjectId === decision.id && failureResults.includes("VERSION_CONFLICT")
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
    "PUB-ACT-RESOLVE-DEPENDENCY-SNAPSHOT",
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
    "CORR-ACT-AUTO-CREATE-TASK",
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
    "PUB-ACT-RESOLVE-DEPENDENCY-SNAPSHOT",
    "GRD-ACT-OPEN-CONFIRMED-REVISION",
    "GRD-ACT-CONFIRM-REVISION",
    "PUB-ACT-CORRECT-RESULT",
    "CORR-ACT-RECORD-INVALIDATION",
    "INS-ACT-MARK-STALE",
    "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM",
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

test("routes published score correction through structured evidence plan and future interpretation invalidation", () => {
  const correction = flows.find(({ id }) => id === "DF-009");
  assert.deepEqual(correction.moduleIds, [
    "GRD-001",
    "PUB-001",
    "INS-001",
    "PLN-001",
    "CORR-001",
  ]);
  assert.deepEqual(correction.steps.map(({ actionId }) => actionId), [
    "PUB-ACT-RESOLVE-DEPENDENCY-SNAPSHOT",
    "GRD-ACT-OPEN-CONFIRMED-REVISION",
    "GRD-ACT-CONFIRM-REVISION",
    "PUB-ACT-CORRECT-RESULT",
    "CORR-ACT-RECORD-INVALIDATION",
    "INS-ACT-MARK-STALE",
    "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM",
    "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
  ]);

  const sourceFieldIds = new Set(correction.sourceDataRefs.map(({ fieldId }) => fieldId));
  assert.equal([
    "INS-EVIDENCE-F-ID",
    "INS-EVIDENCE-F-SOURCE-RESULT-REF",
    "INS-EVIDENCE-F-SOURCE-RESULT-VERSION",
    "INS-EVIDENCE-F-EVIDENCE-VERSION",
    "PLN-PLAN-F-ID",
    "PLN-PLAN-F-SOURCE-EVIDENCE-REF",
    "PLN-PLAN-F-SOURCE-EVIDENCE-VERSION",
    "PLN-PLAN-F-PLAN-VERSION",
  ].every((fieldId) => sourceFieldIds.has(fieldId)), true);

  const targetFieldIds = new Set(correction.targetDataRefs.map(({ fieldId }) => fieldId));
  assert.equal([
    "CORR-INVALIDATION-F-TARGET-KINDS",
    "CORR-INVALIDATION-F-TARGET-TRANSITIONS",
    "CORR-INVALIDATION-F-TARGET-VERSIONS",
    "CORR-INVALIDATION-F-HISTORY-PRESERVATION",
    "INS-EVIDENCE-F-VALIDITY",
    "INS-EVIDENCE-F-EVIDENCE-VERSION",
    "PLN-PLAN-F-INVALIDATION-REF",
    "PLN-PLAN-F-EVALUATION-STATE",
    "PLN-PLAN-F-EVALUATION-VERSION",
  ].every((fieldId) => targetFieldIds.has(fieldId)), true);
  assert.deepEqual(correction.idempotencyKeyParts, {
    identityFieldIds: [
      "GRD-DECISION-F-ID",
      "PUB-RESULT-F-ID",
      "PUB-DEPENDENCY-SNAPSHOT-F-ID",
    ],
    versionFieldIds: [
      "GRD-DECISION-F-DECISION-VERSION",
      "PUB-RESULT-F-RESULT-VERSION",
      "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION",
    ],
    fanoutFieldId: "PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET",
  });
  assert.deepEqual(correction.retryPolicy.retryableFailureResults, [
    "STALE_DECISION_VERSION",
    "SOURCE_VERSION_STALE",
    "VERSION_CONFLICT",
    "AUDIT_FAILED",
  ]);

  const actionById = new Map(modules.flatMap((module) => (
    module.actions.map((action) => [action.id, action])
  )));
  for (const actionId of [
    "CORR-ACT-RECORD-INVALIDATION",
    "INS-ACT-MARK-STALE",
    "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM",
  ]) {
    assert.deepEqual(actionById.get(actionId).trigger, {
      kind: "FLOW",
      flowIds: ["DF-009", "DF-010"],
    }, actionId);
  }

  const invalidation = moduleById(requirementModel, "CORR-001").objects
    .find(({ id }) => id === "CORR-OBJ-INVALIDATION");
  assert.equal(invalidation.historyPreservation, "RETAIN_ALL_PRIOR_VERSIONS");
  assert.deepEqual(invalidation.targetKindContract.slice(-2), [
    "REPORT_INTERPRETATION",
    "LEARNING_PATH_EXPLANATION",
  ]);
});

test("resolves a fresh version-pinned dependency snapshot before DF-009 invalidation", () => {
  const publication = moduleById(requirementModel, "PUB-001");
  const publishedResult = publication.objects.find(({ id }) => id === "PUB-OBJ-RESULT");
  assert.equal(publishedResult.fields.some(({ id }) => (
    id === "PUB-RESULT-F-DEPENDENCY-SET"
  )), false);

  const snapshot = publication.objects.find(({ id }) => (
    id === "PUB-OBJ-DEPENDENCY-SNAPSHOT"
  ));
  assert.ok(snapshot);
  const snapshotFieldById = new Map(snapshot.fields.map((field) => [field.id, field]));
  assert.deepEqual(snapshot.states, ["RESOLVED"]);
  assert.deepEqual({
    idRole: snapshotFieldById.get("PUB-DEPENDENCY-SNAPSHOT-F-ID")?.idempotencyRole,
    setRole: snapshotFieldById.get("PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET")
      ?.idempotencyRole,
    setType: snapshotFieldById.get("PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET")?.dataType,
    setMutability: snapshotFieldById.get("PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET")
      ?.mutability,
    versionType: snapshotFieldById.get("PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION")
      ?.dataType,
  }, {
    idRole: "OBJECT_ID",
    setRole: "FANOUT_SET",
    setType: "JSON",
    setMutability: "IMMUTABLE",
    versionType: "INTEGER",
  });
  assert.match(
    snapshotFieldById.get("PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET").validation,
    /zero or more.*targetKind.*targetRef.*targetVersion/i,
  );
  assert.deepEqual(snapshot.lineageBindings, [{
    refFieldId: "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-REF",
    versionFieldId: "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-VERSION",
    targetObjectId: "PUB-OBJ-RESULT",
    targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
  }]);

  const snapshotAction = publication.actions.find(({ id }) => (
    id === "PUB-ACT-RESOLVE-DEPENDENCY-SNAPSHOT"
  ));
  assert.equal(snapshotAction.operationKind, "CREATE");
  assert.equal(snapshotAction.targetObjectId, snapshot.id);
  assert.equal(snapshotAction.executionMode, "FLOW_INTERNAL");
  assert.deepEqual(snapshotAction.trigger, { kind: "FLOW", flowIds: ["DF-009"] });
  assert.equal([
    "PUB-DEPENDENCY-SNAPSHOT-F-ID",
    "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-REF",
    "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-VERSION",
    "PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET",
    "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION",
  ].every((fieldId) => snapshotAction.outputFieldIds.includes(fieldId)), true);

  const correction = flows.find(({ id }) => id === "DF-009");
  assert.equal(correction.steps[0].actionId, snapshotAction.id);
  const invalidationStepOrders = correction.steps.filter(({ actionId }) => [
    "CORR-ACT-RECORD-INVALIDATION",
    "INS-ACT-MARK-STALE",
    "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM",
  ].includes(actionId)).map(({ order }) => order);
  assert.equal(invalidationStepOrders.every((order) => order > correction.steps[0].order), true);
  assert.equal(correction.sourceDataRefs.some(({ objectId }) => objectId === snapshot.id), false);
  assert.equal([
    "PUB-DEPENDENCY-SNAPSHOT-F-ID",
    "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-REF",
    "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-VERSION",
    "PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET",
    "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION",
  ].every((fieldId) => correction.targetDataRefs.some(({ objectId, fieldId: targetFieldId }) => (
    objectId === snapshot.id && targetFieldId === fieldId
  ))), true);
  assert.deepEqual(correction.idempotencyKeyParts, {
    identityFieldIds: [
      "GRD-DECISION-F-ID",
      "PUB-RESULT-F-ID",
      "PUB-DEPENDENCY-SNAPSHOT-F-ID",
    ],
    versionFieldIds: [
      "GRD-DECISION-F-DECISION-VERSION",
      "PUB-RESULT-F-RESULT-VERSION",
      "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION",
    ],
    fanoutFieldId: "PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET",
  });
});

test("keeps the resolved dependency snapshot version immutable", () => {
  const snapshot = moduleById(requirementModel, "PUB-001").objects.find(({ id }) => (
    id === "PUB-OBJ-DEPENDENCY-SNAPSHOT"
  ));
  const version = snapshot.fields.find(({ id }) => (
    id === "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION"
  ));
  assert.deepEqual({
    dataType: version.dataType,
    valueSource: version.valueSource,
    mutability: version.mutability,
    idempotencyRole: version.idempotencyRole,
  }, {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_VERSION",
  });
});

test("fails closed when the DF-009 idempotency snapshot producer is corrupted", () => {
  const mutations = [
    ["deleted producer", (model) => {
      const flow = model.flows.find(({ id }) => id === "DF-009");
      flow.steps.shift();
      flow.steps.forEach((step, index) => { step.order = index + 1; });
    }],
    ["late producer", (model) => {
      const flow = model.flows.find(({ id }) => id === "DF-009");
      const [producer] = flow.steps.splice(0, 1);
      flow.steps.splice(5, 0, producer);
      flow.steps.forEach((step, index) => { step.order = index + 1; });
    }],
    ["wrong source version", (model) => {
      const snapshot = moduleById(model, "PUB-001").objects.find(({ id }) => (
        id === "PUB-OBJ-DEPENDENCY-SNAPSHOT"
      ));
      snapshot.fields.find(({ id }) => (
        id === "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-REF"
      )).versionBinding.targetVersionFieldId = "PUB-RESULT-F-CORRECTION-VERSION";
      snapshot.lineageBindings[0].targetVersionFieldId = "PUB-RESULT-F-CORRECTION-VERSION";
    }],
    ["wrong fanout", (model) => {
      model.flows.find(({ id }) => id === "DF-009")
        .idempotencyKeyParts.fanoutFieldId = "PUB-RESULT-F-ID";
    }],
    ["wrong producer", (model) => {
      model.flows.find(({ id }) => id === "DF-009").steps[0].actionId = (
        "PUB-ACT-CORRECT-RESULT"
      );
    }],
  ];

  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    const errors = validateRequirementModel(model);
    assertHasCode(errors, "INVALID_FLOW_IDEMPOTENCY_PRODUCER");
    assert.ok(errors.length > 0, name);
  }
});

test("rejects non-version fields in DF-009 version key parts", () => {
  const mutations = [
    [
      "fanout field",
      "PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET",
    ],
    [
      "identity field",
      "PUB-DEPENDENCY-SNAPSHOT-F-ID",
    ],
    [
      "ordinary non-version field",
      "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-VERSION",
    ],
  ];

  const missedMutations = [];
  for (const [name, fieldId] of mutations) {
    const model = structuredClone(requirementModel);
    const correction = model.flows.find(({ id }) => id === "DF-009");
    correction.idempotencyKeyParts.versionFieldIds = correction.idempotencyKeyParts
      .versionFieldIds.map((currentFieldId) => (
        currentFieldId === "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION"
          ? fieldId
          : currentFieldId
      ));
    if (!errorCodes(validateRequirementModel(model)).includes("INVALID_FLOW_IDEMPOTENCY")) {
      missedMutations.push(name);
    }
  }

  assert.deepEqual(missedMutations, []);
});

test("uses declared version roles and disjoint key parts in every executable Flow", () => {
  const fieldById = new Map(modules.flatMap((module) => (
    module.objects.flatMap((object) => object.fields.map((field) => [field.id, field]))
  )));
  const invalidKeys = [];

  for (const flow of flows) {
    const identityFieldIds = new Set(flow.idempotencyKeyParts.identityFieldIds);
    const versionFieldIds = new Set(flow.idempotencyKeyParts.versionFieldIds);
    const { fanoutFieldId } = flow.idempotencyKeyParts;
    for (const fieldId of versionFieldIds) {
      if (fieldById.get(fieldId)?.idempotencyRole !== "OBJECT_VERSION") {
        invalidKeys.push(`${flow.id}:version-role:${fieldId}`);
      }
      if (identityFieldIds.has(fieldId)) {
        invalidKeys.push(`${flow.id}:identity-version-overlap:${fieldId}`);
      }
    }
    if (identityFieldIds.has(fanoutFieldId)) {
      invalidKeys.push(`${flow.id}:identity-fanout-overlap:${fanoutFieldId}`);
    }
    if (versionFieldIds.has(fanoutFieldId)) {
      invalidKeys.push(`${flow.id}:version-fanout-overlap:${fanoutFieldId}`);
    }
  }

  assert.deepEqual(invalidKeys, []);
});

test("fans DF-009 out over zero or many structured dependency snapshots", () => {
  const correction = flows.find(({ id }) => id === "DF-009");
  const publication = moduleById(requirementModel, "PUB-001");
  const correctionModule = moduleById(requirementModel, "CORR-001");
  const dependencySet = publication.objects
    .find(({ id }) => id === "PUB-OBJ-DEPENDENCY-SNAPSHOT").fields
    .find(({ id }) => id === "PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET");
  assert.deepEqual({
    dataType: dependencySet.dataType,
    valueSource: dependencySet.valueSource,
    mutability: dependencySet.mutability,
    idempotencyRole: dependencySet.idempotencyRole,
  }, {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "FANOUT_SET",
  });
  assert.match(dependencySet.validation, /zero or more.*targetKind.*targetRef.*targetVersion/i);

  const dependencyRefs = correction.sourceDataRefs.filter(({ objectId }) => (
    objectId === "INS-OBJ-EVIDENCE" || objectId === "PLN-OBJ-PLAN"
  ));
  assert.ok(dependencyRefs.length > 0);
  assert.equal(dependencyRefs.every(({ cardinality }) => cardinality === "ZERO_MANY"), true);
  assert.equal(correction.sourceDataRefs.filter(({ objectId }) => (
    objectId !== "INS-OBJ-EVIDENCE" && objectId !== "PLN-OBJ-PLAN"
  )).every(({ cardinality }) => cardinality === "ONE"), true);
  assert.deepEqual(correction.idempotencyKeyParts, {
    identityFieldIds: [
      "GRD-DECISION-F-ID",
      "PUB-RESULT-F-ID",
      "PUB-DEPENDENCY-SNAPSHOT-F-ID",
    ],
    versionFieldIds: [
      "GRD-DECISION-F-DECISION-VERSION",
      "PUB-RESULT-F-RESULT-VERSION",
      "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION",
    ],
    fanoutFieldId: "PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET",
  });

  const targetOutcomes = correctionModule.objects
    .find(({ id }) => id === "CORR-OBJ-INVALIDATION").fields
    .find(({ id }) => id === "CORR-INVALIDATION-F-TARGET-OUTCOMES");
  assert.equal(targetOutcomes.dataType, "JSON");
  assert.equal(targetOutcomes.mutability, "IMMUTABLE");
  assert.match(
    targetOutcomes.validation,
    /each dependency.*outcome.*retry provenance.*preserve.*successful.*retry.*failed/i,
  );
  assert.match(dependencySet.validation, /REPORT_INTERPRETATION.*LEARNING_PATH_EXPLANATION/i);

  const fixedDependency = structuredClone(requirementModel);
  fixedDependency.flows.find(({ id }) => id === "DF-009").sourceDataRefs
    .find(({ cardinality }) => cardinality === "ZERO_MANY").cardinality = "ONE";
  assertHasCode(validateRequirementModel(fixedDependency), "INVALID_FLOW_IDEMPOTENCY");
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
    const sourceVersionFieldIds = new Set(flow.sourceDataRefs
      .filter(({ cardinality }) => cardinality === "ONE")
      .map(({ version }) => version));
    const firstStepAction = modules.flatMap((module) => module.actions)
      .find(({ id }) => id === flow.steps[0].actionId);
    const firstStepOutputFieldIds = new Set(firstStepAction?.outputFieldIds ?? []);
    const availableKeyFieldIds = new Set([...sourceFieldIds, ...firstStepOutputFieldIds]);
    assert.ok(flow.idempotencyKeyParts, flow.id);
    assert.deepEqual(
      Object.keys(flow.idempotencyKeyParts).sort(),
      ["fanoutFieldId", "identityFieldIds", "versionFieldIds"],
      flow.id,
    );
    assert.equal(
      flow.idempotencyKeyParts.identityFieldIds.every((fieldId) => (
        availableKeyFieldIds.has(fieldId)
      )),
      true,
      flow.id,
    );
    assert.equal(
      [...sourceVersionFieldIds].every((fieldId) => (
        flow.idempotencyKeyParts.versionFieldIds.includes(fieldId)
      )) && flow.idempotencyKeyParts.versionFieldIds.every((fieldId) => (
        sourceVersionFieldIds.has(fieldId) || firstStepOutputFieldIds.has(fieldId)
      )),
      true,
      flow.id,
    );
    assert.equal(
      availableKeyFieldIds.has(flow.idempotencyKeyParts.fanoutFieldId),
      true,
      flow.id,
    );
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

test("defines score evidence plan student execution and correction modules with the three phase-one Flows", () => {
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
      "SCO-001",
      "INS-001",
      "PLN-001",
      "APP-001",
      "CORR-001",
      "STU-001",
      "AIX-001",
      "RPT-001",
      "LPATH-001",
      "NOTI-001",
      "PREP-001",
      "CONTENT-001",
      "EXM-001",
      "SCH-001",
      "PLAT-001",
      "REPORT-001",
    ],
  );
  assert.deepEqual(
    flows.map(({ id }) => id),
    [
      "DF-001",
      "DF-002",
      "DF-003",
      "DF-004",
      "DF-005",
      "DF-006",
      "DF-007",
      "DF-008",
      "DF-009",
      "DF-010",
      "DF-012",
      "DF-014",
      "DF-011",
      "DF-013",
    ],
  );
});

test("keeps score and student profile views source-pinned without copying official facts", () => {
  const projectionModules = [
    moduleById(requirementModel, "SCO-001"),
    moduleById(requirementModel, "STU-001"),
  ];
  const requiredTargets = new Set([
    "PUB-OBJ-RESULT",
    "INS-OBJ-EVIDENCE",
    "PLN-OBJ-PLAN",
  ]);

  for (const module of projectionModules) {
    const projectionObject = module.objects.find(({ id }) => (
      id === "SCO-OBJ-VIEW" || id === "STU-OBJ-PROFILE"
    ));
    const fields = projectionObject.fields;
    const copiedFacts = fields.filter(({ label }) => (
      /official score|published score|evidence result|mastery interpretation|plan content|task content|improvement goal/i
        .test(label)
    ));
    assert.deepEqual(copiedFacts, [], module.id);

    const sourceDataIds = fields.filter(({ id }) => id.endsWith("-DATA-ID"));
    assert.equal(sourceDataIds.length, 3, module.id);
    assert.equal(sourceDataIds.every((field) => (
      field.dataType === "ID"
      && field.valueSource.kind === "SYSTEM"
      && field.mutability === "IMMUTABLE"
    )), true, module.id);

    const pinnedRefs = fields.filter(({ referenceIntegrity }) => (
      referenceIntegrity === "VERSION_PINNED"
    ));
    assert.deepEqual(
      new Set(pinnedRefs.map(({ valueSource }) => valueSource.targetObjectId)),
      requiredTargets,
      module.id,
    );
    assert.equal(projectionObject.lineageBindings.length, pinnedRefs.length, projectionObject.id);
  }
});

test("enforces subject-teacher mutation and homeroom read-only coordination boundaries", () => {
  const readActionIds = [
    "SCO-ACT-READ-GRADEBOOK",
    "SCO-ACT-VIEW-FOLLOW-UP",
    "PLN-ACT-VIEW-HOMEROOM-COORDINATION",
    "STU-ACT-OPEN-PROFILE",
    "STU-ACT-VIEW-ATTENTION",
  ];
  const mutationActionIds = [
    "SCO-ACT-CREATE-VIEW",
    "SCO-ACT-CREATE-FOLLOW-UP",
    "INS-ACT-CONFIRM-MASTERY",
    "INS-ACT-PUBLISH-INTERPRETATION",
    "PLN-ACT-CONFIRM-PLAN",
    "PLN-ACT-ADJUST-PLAN",
    "PLN-ACT-CLOSE-PLAN",
    "CORR-ACT-CONFIRM-JUDGMENT",
    "CORR-ACT-REQUEST-RETRY",
    "STU-ACT-SAVE-VIEW",
    "STU-ACT-CREATE-ATTENTION",
  ];
  const actionById = new Map(modules.flatMap((module) => (
    module.actions.map((action) => [action.id, action])
  )));

  for (const actionId of readActionIds) {
    const action = actionById.get(actionId);
    assert.equal(action.operationKind, "READ", actionId);
    assert.ok(action.permissions.some(({ effect, dutyRef }) => (
      effect === "ALLOW" && dutyRef === "DUTY-HOMEROOM"
    )), actionId);
    assert.ok(action.permissions.some(({ effect, roleRef }) => (
      effect === "DENY" && roleRef === "ROLE-SCHOOL-ADMIN"
    )), actionId);
    assert.ok(action.permissions.some(({ effect, roleRef }) => (
      effect === "DENY" && roleRef === "ROLE-PLATFORM-OPS"
    )), actionId);
  }

  for (const actionId of mutationActionIds) {
    const action = actionById.get(actionId);
    assert.notEqual(action.operationKind, "READ", actionId);
    assert.ok(action.permissions.some(({ effect, dutyRef }) => (
      effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
    )), actionId);
    assert.ok(action.permissions.some(({ effect, dutyRef }) => (
      effect === "DENY" && dutyRef === "DUTY-HOMEROOM"
    )), actionId);
  }

  const professionalActions = ["SCO-001", "INS-001", "PLN-001", "CORR-001", "STU-001"]
    .flatMap((moduleId) => moduleById(requirementModel, moduleId).actions);
  assert.equal(professionalActions.some((action) => (
    action.operationKind !== "READ"
    && action.permissions.some(({ effect, dutyRef }) => (
      effect === "ALLOW" && dutyRef === "DUTY-HOMEROOM"
    ))
  )), false);
});

test("binds score mastery and improvement-plan writes to assigned subject-course scope", () => {
  const professionalMutationActionIds = [
    "GRD-ACT-CORRECT-RECOGNITION",
    "GRD-ACT-ACCEPT-SUGGESTION",
    "GRD-ACT-OVERRIDE-SCORE",
    "GRD-ACT-MANUAL-GRADE",
    "GRD-ACT-BATCH-CONFIRM",
    "GRD-ACT-OPEN-CONFIRMED-REVISION",
    "GRD-ACT-CONFIRM-REVISION",
    "GRD-ACT-RESOLVE-VERSION-CONFLICT",
    "PUB-ACT-PREVIEW",
    "PUB-ACT-PREPARE-BATCH",
    "PUB-ACT-PUBLISH-SELECTED",
    "PUB-ACT-RETRY-FAILED",
    "PUB-ACT-CORRECT-RESULT",
    "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
    "INS-ACT-CONFIRM-MASTERY",
    "INS-ACT-PUBLISH-INTERPRETATION",
    "PLN-ACT-CONFIRM-PLAN",
    "PLN-ACT-ADJUST-PLAN",
    "PLN-ACT-CLOSE-PLAN",
    "EXM-ACT-CONFIRM-SUBJECT-SCORE",
    "EXM-ACT-REJECT-SUBJECT-SCORE",
    "EXM-ACT-REVISE-REJECTED-SUBJECT-SCORE",
    "EXM-ACT-CORRECT-SUBJECT-SCORE",
  ];
  const actionById = new Map(modules.flatMap((module) => (
    module.actions.map((action) => [action.id, action])
  )));

  for (const actionId of professionalMutationActionIds) {
    const action = actionById.get(actionId);
    assert.ok(action, actionId);
    assert.notEqual(action.operationKind, "READ", actionId);
    assert.deepEqual(
      action.permissions.find(({ effect, dutyRef }) => (
        effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
      ))?.scope,
      {
        kind: "ASSIGNED_SUBJECT_COURSE",
        subjectMatch: "REQUIRED",
        courseMatch: "REQUIRED",
      },
      actionId,
    );
    assert.ok(action.permissions.some(({ effect, dutyRef }) => (
      effect === "DENY" && dutyRef === "DUTY-HOMEROOM"
    )), actionId);
    const deniedScenario = modules
      .flatMap((module) => module.scenarios)
      .find(({ actionId: scenarioActionId, resultCode }) => (
        scenarioActionId === actionId && resultCode === "PERMISSION_DENIED"
      ));
    assert.deepEqual(deniedScenario?.then.expectedPermission, "DENY", actionId);
    assert.deepEqual(deniedScenario?.then.expectedState, { mode: "UNCHANGED" }, actionId);
  }
});

test("explicitly denies school-admin and platform-ops default student-detail reads", () => {
  const studentDetailReadActionIds = [
    "TEA-ACT-QUERY-SUBJECT-TODOS",
    "TEA-ACT-QUERY-HOMEROOM-SUMMARY",
    "SUB-ACT-VIEW-RECEIPT",
    "PUB-ACT-VIEW-RESULT",
    "SCO-ACT-READ-GRADEBOOK",
    "SCO-ACT-VIEW-FOLLOW-UP",
    "INS-ACT-READ-CONFIRMED-EVIDENCE",
    "INS-ACT-VIEW-MASTERY",
    "PLN-ACT-VIEW-HOMEROOM-COORDINATION",
    "APP-ACT-VIEW-TODOS",
    "STU-ACT-OPEN-PROFILE",
    "STU-ACT-VIEW-ATTENTION",
    "LPATH-ACT-VIEW-PATH",
    "EXM-ACT-VIEW-PUBLISHED-SCORE",
  ];
  const actionById = new Map(modules.flatMap((module) => (
    module.actions.map((action) => [action.id, action])
  )));
  const objectById = new Map(modules.flatMap((module) => (
    module.objects.map((object) => [object.id, object])
  )));
  const protectedReadActionIds = modules.flatMap((module) => module.actions)
    .filter((action) => (
      action.executionMode === "USER_TASK"
      && action.operationKind === "READ"
      && objectById.get(action.targetObjectId)?.studentDataClassification
        ?.privilegedReadPolicy === "DEFAULT_DENY"
    ))
    .map(({ id }) => id);
  assert.equal(protectedReadActionIds.length, 14);
  assert.deepEqual(
    new Set(protectedReadActionIds),
    new Set(studentDetailReadActionIds),
  );

  for (const actionId of studentDetailReadActionIds) {
    const action = actionById.get(actionId);
    assert.equal(action?.operationKind, "READ", actionId);
    for (const roleRef of ["ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS"]) {
      assert.ok(action.permissions.some(({ effect, roleRef: permissionRoleRef }) => (
        effect === "DENY" && permissionRoleRef === roleRef
      )), `${actionId}:${roleRef}`);
      assert.equal(action.permissions.some(({ effect, roleRef: permissionRoleRef }) => (
        effect === "ALLOW" && permissionRoleRef === roleRef
      )), false, `${actionId}:${roleRef}`);
    }
    assert.ok(modules.flatMap((module) => module.scenarios).some((scenario) => (
      scenario.actionId === actionId
      && scenario.resultCode === "PERMISSION_DENIED"
      && scenario.then?.expectedPermission === "DENY"
      && scenario.then?.expectedState?.mode === "UNCHANGED"
    )), `${actionId}:PERMISSION_DENIED`);
  }
});

test("rejects fail-open professional subject-course mutation boundaries", () => {
  const mutations = [
    ["missing assigned scope", (model) => {
      const action = moduleById(model, "GRD-001").actions
        .find(({ id }) => id === "GRD-ACT-OVERRIDE-SCORE");
      const allow = action.permissions.find(({ effect, dutyRef }) => (
        effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
      ));
      delete allow.scope;
    }],
    ["missing homeroom deny", (model) => {
      const action = moduleById(model, "INS-001").actions
        .find(({ id }) => id === "INS-ACT-CONFIRM-MASTERY");
      action.permissions = action.permissions.filter(({ effect, dutyRef }) => (
        effect !== "DENY" || dutyRef !== "DUTY-HOMEROOM"
      ));
    }],
    ["missing publication subject-course scope", (model) => {
      const action = moduleById(model, "PUB-001").actions
        .find(({ id }) => id === "PUB-ACT-CORRECT-RESULT");
      const allow = action.permissions.find(({ effect, dutyRef }) => (
        effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
      ));
      delete allow.scope;
    }],
    ["homeroom write allow", (model) => {
      const action = moduleById(model, "PLN-001").actions
        .find(({ id }) => id === "PLN-ACT-ADJUST-PLAN");
      action.permissions.push({
        effect: "ALLOW",
        dutyRef: "DUTY-HOMEROOM",
        condition: "homeroom duty writes a subject plan",
      });
    }],
  ];

  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(
      validateRequirementModel(model),
      "INVALID_ACADEMIC_ACCESS_BOUNDARY",
      name,
    );
  }
});

test("rejects fail-open school-admin and platform-ops student-detail reads", () => {
  const mutations = [
    ["missing school-admin deny", (model) => {
      const action = moduleById(model, "SUB-001").actions
        .find(({ id }) => id === "SUB-ACT-VIEW-RECEIPT");
      action.permissions = action.permissions.filter(({ effect, roleRef }) => (
        effect !== "DENY" || roleRef !== "ROLE-SCHOOL-ADMIN"
      ));
    }],
    ["school-admin default allow", (model) => {
      moduleById(model, "PUB-001").actions
        .find(({ id }) => id === "PUB-ACT-VIEW-RESULT")
        .permissions.push({
          effect: "ALLOW",
          roleRef: "ROLE-SCHOOL-ADMIN",
          condition: "school administration browses student result detail by default",
        });
    }],
    ["missing platform-ops deny", (model) => {
      const action = moduleById(model, "LPATH-001").actions
        .find(({ id }) => id === "LPATH-ACT-VIEW-PATH");
      action.permissions = action.permissions.filter(({ effect, roleRef }) => (
        effect !== "DENY" || roleRef !== "ROLE-PLATFORM-OPS"
      ));
    }],
    ["platform-ops default allow", (model) => {
      moduleById(model, "SCO-001").actions
        .find(({ id }) => id === "SCO-ACT-READ-GRADEBOOK")
        .permissions.push({
          effect: "ALLOW",
          roleRef: "ROLE-PLATFORM-OPS",
          condition: "platform operations browses student grade detail by default",
        });
    }],
  ];

  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(
      validateRequirementModel(model),
      "INVALID_STUDENT_DETAIL_ACCESS_BOUNDARY",
      name,
    );
  }
});

test("rejects structurally complete privileged reads across every student-detail family", () => {
  const cases = [
    ["submission", "SUB-001", "SUB-OBJ-DRAFT", "ROLE-SCHOOL-ADMIN"],
    ["grading", "GRD-001", "GRD-OBJ-DECISION", "ROLE-PLATFORM-OPS"],
    ["publication", "PUB-001", "PUB-OBJ-DEPENDENCY-SNAPSHOT", "ROLE-SCHOOL-ADMIN"],
    ["plan", "PLN-001", "PLN-OBJ-PLAN", "ROLE-PLATFORM-OPS"],
    ["correction", "CORR-001", "CORR-OBJ-ATTEMPT", "ROLE-SCHOOL-ADMIN"],
    ["AI preview", "AIX-001", "AIX-OBJ-TASK-PREVIEW", "ROLE-PLATFORM-OPS"],
    ["report", "RPT-001", "RPT-OBJ-SNAPSHOT", "ROLE-SCHOOL-ADMIN"],
    ["path", "LPATH-001", "LPATH-OBJ-INTERPRETATION", "ROLE-PLATFORM-OPS"],
    ["notification", "NOTI-001", "NOTI-OBJ-NOTIFICATION", "ROLE-SCHOOL-ADMIN"],
  ];

  for (const [family, moduleId, objectId, allowRoleRef] of cases) {
    const model = structuredClone(requirementModel);
    const module = moduleById(model, moduleId);
    const object = module.objects.find(({ id }) => id === objectId);
    const identityFieldId = object.fields
      .find(({ idempotencyRole }) => idempotencyRole === "OBJECT_ID")?.id;
    assert.ok(identityFieldId, `${family}:${objectId}`);
    const suffix = family.replace(/[^A-Za-z]+/g, "-").toUpperCase();
    const actionId = `TEST-ACT-${suffix}-PRIVILEGED-READ`;
    const pageId = `TEST-PAGE-${suffix}-PRIVILEGED-READ`;
    const successScenarioId = `${actionId}-SCN-SUCCESS`;
    const permissionScenarioId = `${actionId}-SCN-PERMISSION-DENIED`;
    const notFoundScenarioId = `${actionId}-SCN-NOT-FOUND`;
    const deniedRoleRef = allowRoleRef === "ROLE-SCHOOL-ADMIN"
      ? "ROLE-PLATFORM-OPS"
      : "ROLE-SCHOOL-ADMIN";

    module.actions.push({
      id: actionId,
      label: `Read protected ${family} detail directly`,
      targetObjectId: objectId,
      inputFieldIds: [identityFieldId],
      outputFieldIds: [identityFieldId],
      operationKind: "READ",
      writes: false,
      risk: RISK.READ,
      executionMode: "USER_TASK",
      clients: [CLIENT.WEB],
      permissions: [
        {
          effect: "ALLOW",
          roleRef: allowRoleRef,
          condition: `the privileged role reads ${family} detail by default`,
        },
        {
          effect: "DENY",
          roleRef: deniedRoleRef,
          condition: `the other privileged role cannot read ${family} detail`,
        },
      ],
      scenarioIds: [successScenarioId, permissionScenarioId, notFoundScenarioId],
      auditMode: "NOT_REQUIRED",
      failureResults: ["PERMISSION_DENIED", "NOT_FOUND"],
      ...(moduleId === "NOTI-001" ? { channel: "IN_PRODUCT" } : {}),
    });
    module.pages.push({
      id: pageId,
      label: `Protected ${family} detail reader`,
      clients: [CLIENT.WEB],
      objectIds: [objectId],
      fieldIds: [identityFieldId],
      actionIds: [actionId],
      regions: ["CONTEXT_HEADER", "TASK_WORK_AREA", "RESULT_AND_FAILURE_STATUS"],
      viewStates: ["LOADING", "READY", "EMPTY", "ERROR", "FORBIDDEN"],
    });
    module.scenarios.push(
      {
        id: successScenarioId,
        kind: "SUCCESS",
        actionId,
        pageId,
        given: `the privileged role has a default ${family} context`,
        when: `the privileged role reads ${family} detail`,
        then: {
          expectedData: `the ${family} detail is returned`,
          expectedState: { mode: "UNCHANGED" },
          expectedPermission: "ALLOW",
          expectedVisibility: "privileged default scope",
        },
      },
      ...[
        [permissionScenarioId, "PERMISSION_DENIED"],
        [notFoundScenarioId, "NOT_FOUND"],
      ].map(([id, resultCode]) => ({
        id,
        kind: "FAILURE",
        resultCode,
        actionId,
        pageId,
        given: `${resultCode} applies to the protected ${family} read`,
        when: `the privileged role reads ${family} detail`,
        then: {
          expectedData: `${resultCode} returns no ${family} detail`,
          expectedState: { mode: "UNCHANGED" },
          expectedPermission: "DENY",
          expectedVisibility: `no ${family} detail is visible`,
        },
      })),
    );

    const errors = validateRequirementModel(model);
    assert.deepEqual(
      errors.filter((error) => !error.startsWith("INVALID_STUDENT_DETAIL_ACCESS_BOUNDARY")),
      [],
      family,
    );
    assertHasCode(errors, "INVALID_STUDENT_DETAIL_ACCESS_BOUNDARY", family);
  }
});

test("classifies every phase-one object with a closed student-data access fact", () => {
  const phaseOneObjects = modules
    .filter(({ phase }) => phase === PHASE.FIRST)
    .flatMap((module) => module.objects);
  assert.equal(phaseOneObjects.length, 87);
  assert.deepEqual(
    phaseOneObjects.reduce((counts, object) => ({
      ...counts,
      [object.studentDataClassification.kind]: counts[object.studentDataClassification.kind] + 1,
    }), { NONE: 0, DETAIL: 0, AGGREGATE: 0 }),
    { NONE: 58, DETAIL: 24, AGGREGATE: 5 },
  );
  assert.equal(phaseOneObjects.every((object) => {
    const classification = object.studentDataClassification;
    return classification
      && Object.keys(classification).toSorted().join(",") === "kind,privilegedReadPolicy"
      && ["NONE", "DETAIL", "AGGREGATE"].includes(classification.kind)
      && (
        (classification.kind === "NONE"
          && classification.privilegedReadPolicy === "NOT_APPLICABLE")
        || (["DETAIL", "AGGREGATE"].includes(classification.kind)
          && classification.privilegedReadPolicy === "DEFAULT_DENY")
      );
  }), true);

  const objectById = new Map(phaseOneObjects.map((object) => [object.id, object]));
  assert.deepEqual(objectById.get("ORG-OBJ-STUDENT").studentDataClassification, {
    kind: "NONE",
    privilegedReadPolicy: "NOT_APPLICABLE",
  });
  assert.deepEqual(objectById.get("PLN-OBJ-PLAN").studentDataClassification, {
    kind: "DETAIL",
    privilegedReadPolicy: "DEFAULT_DENY",
  });
  assert.deepEqual(objectById.get("RPT-OBJ-SNAPSHOT").studentDataClassification, {
    kind: "AGGREGATE",
    privilegedReadPolicy: "DEFAULT_DENY",
  });
});

test("rejects missing or contradictory phase-one student-data classifications", () => {
  const mutations = [
    ["missing", (object) => { delete object.studentDataClassification; }],
    ["detail fail-open", (object) => {
      object.studentDataClassification = {
        kind: "DETAIL",
        privilegedReadPolicy: "NOT_APPLICABLE",
      };
    }],
    ["none default-deny", (object) => {
      object.studentDataClassification = {
        kind: "NONE",
        privilegedReadPolicy: "DEFAULT_DENY",
      };
    }],
  ];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    const plan = moduleById(model, "PLN-001").objects
      .find(({ id }) => id === "PLN-OBJ-PLAN");
    mutate(plan);
    assertHasCode(
      validateRequirementModel(model),
      "INVALID_STUDENT_DATA_CLASSIFICATION",
      name,
    );
  }
});

test("models evidence candidates teacher confirmation student visibility and immutable invalidation history", () => {
  const insight = moduleById(requirementModel, "INS-001");
  const evidence = insight.objects.find(({ id }) => id === "INS-OBJ-EVIDENCE");
  const fieldById = new Map(evidence.fields.map((field) => [field.id, field]));
  const requiredFieldIds = [
    "INS-EVIDENCE-F-SOURCE-DATA-ID",
    "INS-EVIDENCE-F-EVIDENCE-SOURCE",
    "INS-EVIDENCE-F-STAGE",
    "INS-EVIDENCE-F-KNOWLEDGE-POINT-REF",
    "INS-EVIDENCE-F-KNOWLEDGE-POINT-VERSION",
    "INS-EVIDENCE-F-RESULT",
    "INS-EVIDENCE-F-ERROR-TYPE",
    "INS-EVIDENCE-F-WEIGHT",
    "INS-EVIDENCE-F-VALIDITY",
    "INS-EVIDENCE-F-TEACHER-CONFIRMATION",
    "INS-EVIDENCE-F-INVALIDATION-REASON",
    "INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION",
    "INS-EVIDENCE-F-EVIDENCE-VERSION",
  ];
  assert.equal(requiredFieldIds.every((fieldId) => fieldById.has(fieldId)), true);
  assert.deepEqual(
    evidence.states,
    ["CANDIDATE", "TEACHER_CONFIRMED", "STUDENT_VISIBLE", "STALE"],
  );

  const actionById = new Map(insight.actions.map((action) => [action.id, action]));
  const createCandidate = actionById.get("INS-ACT-CREATE-CANDIDATE");
  const confirm = actionById.get("INS-ACT-CONFIRM-MASTERY");
  const publish = actionById.get("INS-ACT-PUBLISH-INTERPRETATION");
  const invalidate = actionById.get("INS-ACT-MARK-STALE");
  const studentRead = actionById.get("INS-ACT-VIEW-MASTERY");
  assert.equal(createCandidate.operationKind, "CREATE");
  assert.deepEqual(createCandidate.trigger, { kind: "FLOW", flowIds: ["DF-010"] });
  assert.deepEqual(confirm.transition, { from: "CANDIDATE", to: "TEACHER_CONFIRMED" });
  assert.deepEqual(publish.transition, { from: "TEACHER_CONFIRMED", to: "STUDENT_VISIBLE" });
  assert.deepEqual(invalidate.transition, { from: "STUDENT_VISIBLE", to: "STALE" });
  assert.equal(studentRead.operationKind, "READ");
  assert.equal(evidence.readMode, "STUDENT_TIMED_RELEASE");
  assert.equal(evidence.readPolicies.length, 1);
  assert.equal(fieldById.get("INS-EVIDENCE-F-MASTERY-INTERPRETATION").releaseRequirement.readPolicyId, "INS-RP-STUDENT-MASTERY");
  assert.ok(fieldById.get("INS-EVIDENCE-F-PRIOR-EVIDENCE-REF"));
  assert.equal(fieldById.get("INS-EVIDENCE-F-PRIOR-EVIDENCE-REF").referenceIntegrity, "VERSION_PINNED");

  for (const action of [confirm, publish]) {
    assert.ok(action.permissions.some(({ effect, actorRef }) => (
      effect === "DENY" && actorRef === "AI"
    )), action.id);
    assert.equal(action.permissions.some(({ effect, actorRef }) => (
      effect === "ALLOW" && actorRef === "AI"
    )), false, action.id);
  }
});

test("models subject-owned improvement plans and explicit teacher and homeroom Flow outputs", () => {
  const planModule = moduleById(requirementModel, "PLN-001");
  const plan = planModule.objects.find(({ id }) => id === "PLN-OBJ-PLAN");
  const fieldIds = new Set(plan.fields.map(({ id }) => id));
  const requiredFieldIds = [
    "PLN-PLAN-F-GOAL",
    "PLN-PLAN-F-SUBJECT",
    "PLN-PLAN-F-KNOWLEDGE-POINT-REF",
    "PLN-PLAN-F-PRIORITY",
    "PLN-PLAN-F-TASK-CONTENT",
    "PLN-PLAN-F-WORKLOAD",
    "PLN-PLAN-F-DUE-AT",
    "PLN-PLAN-F-SUCCESS-CONDITION",
    "PLN-PLAN-F-EVIDENCE-REQUIREMENT",
    "PLN-PLAN-F-REVALIDATION-METHOD",
    "PLN-PLAN-F-TEACHER-CONFIRMER-REF",
    "PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-REF",
    "PLN-PLAN-F-ADJUSTMENT-REASON",
    "PLN-PLAN-F-CLOSE-REASON",
    "PLN-PLAN-F-INVALIDATION-REF",
    "PLN-PLAN-F-INVALIDATION-VERSION",
    "PLN-PLAN-F-EVALUATION-STATE",
    "PLN-PLAN-F-EVALUATION-VERSION",
    "PLN-PLAN-F-PLAN-VERSION",
  ];
  assert.equal(requiredFieldIds.every((fieldId) => fieldIds.has(fieldId)), true);

  const confirm = planModule.actions.find(({ id }) => id === "PLN-ACT-CONFIRM-PLAN");
  assert.deepEqual(confirm.transition, { from: "CANDIDATE", to: "ACTIVE" });
  assert.ok(confirm.permissions.some(({ effect, dutyRef }) => (
    effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
  )));

  const flow = flows.find(({ id }) => id === "DF-012");
  assert.deepEqual(flow.steps.map(({ actionId }) => actionId), [
    "INS-ACT-READ-CONFIRMED-EVIDENCE",
    "PLN-ACT-CREATE-CANDIDATE",
    "PLN-ACT-CONFIRM-PLAN",
    "PLN-ACT-SYNC-SUBJECT-TEACHER",
    "PLN-ACT-SYNC-HOMEROOM-COORDINATION",
    "APP-ACT-CREATE-PLAN-TODO",
  ]);
  assert.ok(flow.targetDataRefs.some(({ objectId, fieldId }) => (
    objectId === "PLN-OBJ-SUBJECT-SYNC"
    && fieldId === "PLN-SUBJECT-SYNC-F-OUTPUT-VERSION"
  )));
  assert.ok(flow.targetDataRefs.some(({ objectId, fieldId }) => (
    objectId === "PLN-OBJ-HOMEROOM-COORDINATION"
    && fieldId === "PLN-HOMEROOM-F-OUTPUT-VERSION"
  )));
  assert.equal(JSON.stringify(flow.targetDataRefs).includes("recipient"), false);
});

test("models student todo navigation and correction judgment without creating second task owners", () => {
  const app = moduleById(requirementModel, "APP-001");
  const todo = app.objects.find(({ id }) => id === "APP-OBJ-TODO");
  const todoFields = new Set(todo.fields.map(({ id }) => id));
  assert.equal([
    "APP-TODO-F-SOURCE-PLAN-REF",
    "APP-TODO-F-SOURCE-PLAN-VERSION",
    "APP-TODO-F-SOURCE-ASSIGNMENT-REF",
    "APP-TODO-F-SOURCE-ASSIGNMENT-VERSION",
    "APP-TODO-F-TASK-DEEP-LINK",
    "APP-TODO-F-LOCAL-PROGRESS",
    "APP-TODO-F-COMPLETION-EVIDENCE",
    "APP-TODO-F-DIFFICULTY-FEEDBACK",
  ].every((fieldId) => todoFields.has(fieldId)), true);
  assert.equal(todo.fields.some(({ label }) => /task content|plan content/i.test(label)), false);
  assert.deepEqual(
    new Set(todo.lineageBindings.map(({ targetObjectId }) => targetObjectId)),
    new Set(["PLN-OBJ-PLAN", "HW-OBJ-ASSIGNMENT"]),
  );

  assert.deepEqual(todo.exclusiveSourceGroups, [
    {
      id: "PLAN",
      fieldIds: [
        "APP-TODO-F-SOURCE-PLAN-REF",
        "APP-TODO-F-SOURCE-PLAN-VERSION",
      ],
    },
    {
      id: "HOMEWORK",
      fieldIds: [
        "APP-TODO-F-SOURCE-ASSIGNMENT-REF",
        "APP-TODO-F-SOURCE-ASSIGNMENT-VERSION",
      ],
    },
  ]);
  const createTodoActions = app.actions.filter(({ operationKind }) => operationKind === "CREATE");
  assert.deepEqual(createTodoActions.map(({ id }) => id), [
    "APP-ACT-CREATE-PLAN-TODO",
    "APP-ACT-CREATE-HOMEWORK-TODO",
  ]);
  assert.deepEqual(createTodoActions.map(({ trigger }) => trigger), [
    { kind: "FLOW", flowIds: ["DF-012"] },
    { kind: "FLOW", flowIds: ["DF-004"] },
  ]);
  for (const [actionId, expectedGroupId] of [
    ["APP-ACT-CREATE-PLAN-TODO", "PLAN"],
    ["APP-ACT-CREATE-HOMEWORK-TODO", "HOMEWORK"],
  ]) {
    const action = createTodoActions.find(({ id }) => id === actionId);
    const covered = new Set([...action.inputFieldIds, ...action.outputFieldIds]);
    const coveredGroups = todo.exclusiveSourceGroups.filter(({ fieldIds: groupFieldIds }) => (
      groupFieldIds.every((fieldId) => covered.has(fieldId))
    ));
    assert.deepEqual(coveredGroups.map(({ id }) => id), [expectedGroupId], actionId);
  }

  const assignmentFlow = flows.find(({ id }) => id === "DF-004");
  assert.deepEqual(assignmentFlow.moduleIds, ["HW-001", "APP-001"]);
  assert.equal(
    assignmentFlow.steps.at(-1).actionId,
    "APP-ACT-CREATE-HOMEWORK-TODO",
  );
  const assignmentTargetFields = new Set(assignmentFlow.targetDataRefs
    .filter(({ objectId }) => objectId === "APP-OBJ-TODO")
    .map(({ fieldId }) => fieldId));
  assert.equal([
    "APP-TODO-F-ID",
    "APP-TODO-F-SOURCE-ASSIGNMENT-REF",
    "APP-TODO-F-SOURCE-ASSIGNMENT-VERSION",
    "APP-TODO-F-TASK-DEEP-LINK",
    "APP-TODO-F-AGGREGATION-VERSION",
  ].every((fieldId) => assignmentTargetFields.has(fieldId)), true);
  assert.deepEqual(assignmentFlow.idempotencyKeyParts, {
    identityFieldIds: ["HW-ASSIGNMENT-F-ID"],
    versionFieldIds: [
      "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      "HW-ITEM-F-ITEM-VERSION",
    ],
    fanoutFieldId: "HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS",
  });

  const planFlow = flows.find(({ id }) => id === "DF-012");
  assert.equal(planFlow.steps.at(-1).actionId, "APP-ACT-CREATE-PLAN-TODO");

  const correction = moduleById(requirementModel, "CORR-001");
  const attempt = correction.objects.find(({ id }) => id === "CORR-OBJ-ATTEMPT");
  const attemptFieldIds = new Set(attempt.fields.map(({ id }) => id));
  assert.equal([
    "CORR-ATTEMPT-F-CORRECTION-ANSWER",
    "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
    "CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT",
    "CORR-ATTEMPT-F-OVERDUE-HANDLING",
  ].every((fieldId) => attemptFieldIds.has(fieldId)), true);
  const create = correction.actions.find(({ id }) => id === "CORR-ACT-CREATE-TASK");
  const judge = correction.actions.find(({ id }) => id === "CORR-ACT-CONFIRM-JUDGMENT");
  assert.equal(create.operationKind, "CREATE");
  assert.ok(create.permissions.some(({ effect, dutyRef }) => (
    effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
  )));
  assert.equal(correction.actions.some(({ targetObjectId, operationKind, permissions }) => (
    targetObjectId === "CORR-OBJ-TASK"
    && operationKind === "CREATE" && permissions.some(({ effect, roleRef }) => (
      effect === "ALLOW" && roleRef === "ROLE-STUDENT"
    ))
  )), false);
  assert.ok(judge.permissions.some(({ effect, dutyRef }) => (
    effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
  )));
  assert.ok(judge.permissions.some(({ effect, actorRef }) => (
    effect === "DENY" && actorRef === "AI"
  )));
});

test("separates teacher-owned correction tasks from student-produced attempts", () => {
  const correction = moduleById(requirementModel, "CORR-001");
  const task = correction.objects.find(({ id }) => id === "CORR-OBJ-TASK");
  const attempt = correction.objects.find(({ id }) => id === "CORR-OBJ-ATTEMPT");
  assert.ok(task);
  assert.ok(attempt);
  assert.deepEqual({
    producerRef: task.producerRef,
    ownerRef: task.ownerRef,
    states: task.states,
  }, {
    producerRef: "DUTY-SUBJECT-TEACHER",
    ownerRef: "DUTY-SUBJECT-TEACHER",
    states: ["OPEN", "OVERDUE", "AWAITING_RETRY", "COMPLETED"],
  });
  assert.deepEqual({
    producerRef: attempt.producerRef,
    ownerRef: attempt.ownerRef,
    states: attempt.states,
  }, {
    producerRef: "ROLE-STUDENT",
    ownerRef: "ROLE-STUDENT",
    states: ["SUBMITTED", "JUDGED", "NEEDS_RETRY"],
  });

  const taskFieldIds = new Set(task.fields.map(({ id }) => id));
  assert.equal([
    "CORR-TASK-F-ID",
    "CORR-TASK-F-STUDENT-REF",
    "CORR-TASK-F-SOURCE-RESULT-REF",
    "CORR-TASK-F-SOURCE-RESULT-VERSION",
    "CORR-TASK-F-DUE-AT",
    "CORR-TASK-F-TASK-VERSION",
  ].every((fieldId) => taskFieldIds.has(fieldId)), true);
  assert.ok(task.lineageBindings.some(({ refFieldId, targetObjectId }) => (
    refFieldId === "CORR-TASK-F-SOURCE-RESULT-REF"
    && targetObjectId === "PUB-OBJ-RESULT"
  )));

  const attemptFieldIds = new Set(attempt.fields.map(({ id }) => id));
  assert.equal([
    "CORR-ATTEMPT-F-ID",
    "CORR-ATTEMPT-F-TASK-REF",
    "CORR-ATTEMPT-F-TASK-VERSION",
    "CORR-ATTEMPT-F-CORRECTION-ANSWER",
    "CORR-ATTEMPT-F-CORRECTION-VERSION",
  ].every((fieldId) => attemptFieldIds.has(fieldId)), true);
  assert.equal(attemptFieldIds.has("CORR-ATTEMPT-F-DUE-AT"), false);
  assert.equal(attemptFieldIds.has("CORR-ATTEMPT-F-SOURCE-RESULT-REF"), false);
  assert.ok(attempt.lineageBindings.some(({ refFieldId, targetObjectId }) => (
    refFieldId === "CORR-ATTEMPT-F-TASK-REF"
    && targetObjectId === task.id
  )));

  const actionById = new Map(correction.actions.map((action) => [action.id, action]));
  for (const actionId of ["CORR-ACT-CREATE-TASK", "CORR-ACT-AUTO-CREATE-TASK"]) {
    const action = actionById.get(actionId);
    assert.equal(action.targetObjectId, task.id, actionId);
    assert.equal(action.operationKind, "CREATE", actionId);
  }
  assert.equal(actionById.get("CORR-ACT-MARK-OVERDUE").targetObjectId, task.id);
  for (const actionId of [
    "CORR-ACT-SUBMIT-INITIAL",
    "CORR-ACT-SUBMIT-LATE",
    "CORR-ACT-RESUBMIT",
  ]) {
    const action = actionById.get(actionId);
    assert.equal(action.targetObjectId, attempt.id, actionId);
    assert.equal(action.operationKind, "CREATE", actionId);
    assert.ok(action.permissions.some(({ effect, roleRef }) => (
      effect === "ALLOW" && roleRef === "ROLE-STUDENT"
    )), actionId);
  }

  const release = flows.find(({ id }) => id === "DF-008");
  assert.ok(release.targetDataRefs.some(({ objectId }) => objectId === task.id));
  assert.equal(release.targetDataRefs.some(({ objectId }) => objectId === attempt.id), false);
  const judgment = flows.find(({ id }) => id === "DF-010");
  assert.ok(judgment.sourceDataRefs.some(({ objectId }) => objectId === task.id));
  assert.ok(judgment.sourceDataRefs.some(({ objectId }) => objectId === attempt.id));
});

test("models one correction task lifecycle and normalizes mutually exclusive submissions for DF-010", () => {
  const correction = moduleById(requirementModel, "CORR-001");
  const task = correction.objects.find(({ id }) => id === "CORR-OBJ-TASK");
  const attempt = correction.objects.find(({ id }) => id === "CORR-OBJ-ATTEMPT");
  assert.deepEqual(task.states, ["OPEN", "OVERDUE", "AWAITING_RETRY", "COMPLETED"]);
  assert.deepEqual(attempt.states, ["SUBMITTED", "JUDGED", "NEEDS_RETRY"]);
  const dueAt = task.fields.find(({ id }) => id === "CORR-TASK-F-DUE-AT");
  assert.deepEqual({
    dataType: dueAt?.dataType,
    valueSource: dueAt?.valueSource,
    mutability: dueAt?.mutability,
  }, {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  });

  const actionById = new Map(correction.actions.map((action) => [action.id, action]));
  for (const actionId of ["CORR-ACT-CREATE-TASK", "CORR-ACT-AUTO-CREATE-TASK"]) {
    const open = actionById.get(actionId);
    assert.equal(open.operationKind, "CREATE");
    assert.equal(open.targetObjectId, task.id);
    assert.ok(open.outputFieldIds.includes("CORR-TASK-F-DUE-AT"));
    assert.deepEqual(
      correction.scenarios.find(({ actionId: scenarioActionId, kind }) => (
        scenarioActionId === open.id && kind === "SUCCESS"
      )).then.expectedState,
      { mode: "STATE", value: "OPEN" },
    );
  }

  const expectedTransitions = new Map([
    ["CORR-ACT-MARK-OVERDUE", { from: "OPEN", to: "OVERDUE" }],
    ["CORR-ACT-CONFIRM-JUDGMENT", { from: "SUBMITTED", to: "JUDGED" }],
    ["CORR-ACT-REQUEST-RETRY", { from: "SUBMITTED", to: "NEEDS_RETRY" }],
    ["CORR-ACT-MARK-TASK-AWAITING-RETRY", {
      from: ["OPEN", "OVERDUE", "AWAITING_RETRY"],
      to: "AWAITING_RETRY",
    }],
    ["CORR-ACT-COMPLETE-TASK", {
      from: ["OPEN", "OVERDUE", "AWAITING_RETRY"],
      to: "COMPLETED",
    }],
  ]);
  for (const [actionId, transition] of expectedTransitions) {
    assert.deepEqual(actionById.get(actionId)?.transition, transition, actionId);
  }

  const overdue = actionById.get("CORR-ACT-MARK-OVERDUE");
  assert.equal(overdue.executionMode, "SYSTEM_EVENT");
  assert.deepEqual(overdue.trigger, {
    kind: "EVENT",
    eventId: "EVT-CORRECTION-TASK-DUE",
  });
  assert.deepEqual(teachingLoopFactExports.teachingLoopEvents, [{
    id: "EVT-CORRECTION-TASK-DUE",
    label: "Correction Task Due",
    definition: "the open correction task reaches its due time without a submitted answer",
    triggeredActionIds: ["CORR-ACT-MARK-OVERDUE"],
  }]);
  assert.deepEqual(
    events.find(({ id }) => id === "EVT-CORRECTION-TASK-DUE"),
    teachingLoopFactExports.teachingLoopEvents[0],
  );

  const normalizedSubmissionFields = [
    "CORR-ATTEMPT-F-CORRECTION-ANSWER",
    "CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT",
    "CORR-ATTEMPT-F-CORRECTION-VERSION",
  ];
  const createAttemptOutputs = [
    "CORR-ATTEMPT-F-ID",
    "CORR-ATTEMPT-F-STUDENT-REF",
    "CORR-ATTEMPT-F-TASK-REF",
    "CORR-ATTEMPT-F-TASK-VERSION",
    "CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT",
    "CORR-ATTEMPT-F-CORRECTION-VERSION",
  ];
  for (const actionId of [
    "CORR-ACT-SUBMIT-INITIAL",
    "CORR-ACT-SUBMIT-LATE",
    "CORR-ACT-RESUBMIT",
  ]) {
    const action = actionById.get(actionId);
    assert.equal(action.operationKind, "CREATE", actionId);
    assert.ok(action.inputFieldIds.includes("CORR-ATTEMPT-F-CORRECTION-ANSWER"));
    assert.equal(
      createAttemptOutputs.every((fieldId) => action.outputFieldIds.includes(fieldId)),
      true,
      actionId,
    );
  }

  const normalize = actionById.get("CORR-ACT-NORMALIZE-SUBMISSION");
  assert.equal(normalize.executionMode, "FLOW_INTERNAL");
  assert.deepEqual(normalize.trigger, { kind: "FLOW", flowIds: ["DF-010"] });
  assert.deepEqual(normalize.inputFieldIds, normalizedSubmissionFields);
  assert.deepEqual(normalize.transition, { from: "SUBMITTED", to: "SUBMITTED" });

  const correctionFlow = flows.find(({ id }) => id === "DF-010");
  assert.deepEqual(
    correctionFlow.steps
      .map(({ actionId }) => actionId)
      .filter((actionId) => actionId.startsWith("CORR-ACT-")),
    [
      "CORR-ACT-NORMALIZE-SUBMISSION",
      "CORR-ACT-CONFIRM-JUDGMENT",
      "CORR-ACT-REQUEST-RETRY",
      "CORR-ACT-COMPLETE-TASK",
      "CORR-ACT-MARK-TASK-AWAITING-RETRY",
      "CORR-ACT-RECORD-INVALIDATION",
    ],
  );
  assert.equal(correctionFlow.steps.some(({ actionId }) => [
    "CORR-ACT-SUBMIT-INITIAL",
    "CORR-ACT-SUBMIT-LATE",
    "CORR-ACT-RESUBMIT",
  ].includes(actionId)), false);
});

test("closes correction Task states and version-pinned Attempt lineage", () => {
  const correction = moduleById(requirementModel, "CORR-001");
  const task = correction.objects.find(({ id }) => id === "CORR-OBJ-TASK");
  const attempt = correction.objects.find(({ id }) => id === "CORR-OBJ-ATTEMPT");
  const actionById = new Map(correction.actions.map((action) => [action.id, action]));
  assert.deepEqual(task.states, ["OPEN", "OVERDUE", "AWAITING_RETRY", "COMPLETED"]);

  const priorAttemptRef = attempt.fields.find(({ id }) => (
    id === "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF"
  ));
  const priorAttemptVersion = attempt.fields.find(({ id }) => (
    id === "CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION"
  ));
  assert.deepEqual(priorAttemptRef?.valueSource, {
    kind: "OBJECT_REF",
    targetObjectId: "CORR-OBJ-ATTEMPT",
  });
  assert.equal(priorAttemptRef?.referenceIntegrity, "VERSION_PINNED");
  assert.deepEqual(priorAttemptRef?.versionBinding, {
    versionFieldId: "CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION",
    targetVersionFieldId: "CORR-ATTEMPT-F-CORRECTION-VERSION",
  });
  assert.equal(priorAttemptVersion?.dataType, "INTEGER");
  assert.ok(attempt.lineageBindings.some((binding) => (
    binding.refFieldId === "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF"
    && binding.versionFieldId === "CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION"
    && binding.targetObjectId === attempt.id
    && binding.targetVersionFieldId === "CORR-ATTEMPT-F-CORRECTION-VERSION"
  )));

  const taskGuardState = (actionId) => actionById.get(actionId).relatedStateGuards
    .find(({ targetObjectId }) => targetObjectId === task.id).requiredState;
  assert.equal(taskGuardState("CORR-ACT-SUBMIT-INITIAL"), "OPEN");
  assert.equal(taskGuardState("CORR-ACT-SUBMIT-LATE"), "OVERDUE");
  assert.equal(taskGuardState("CORR-ACT-RESUBMIT"), "AWAITING_RETRY");

  const priorGuard = actionById.get("CORR-ACT-RESUBMIT").relatedStateGuards
    .find(({ refFieldId }) => refFieldId === "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF");
  assert.deepEqual(priorGuard, {
    refFieldId: "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF",
    versionFieldId: "CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION",
    targetObjectId: "CORR-OBJ-ATTEMPT",
    requiredState: "NEEDS_RETRY",
  });
  for (const fieldId of [
    "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF",
    "CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION",
  ]) {
    assert.equal(actionById.get("CORR-ACT-SUBMIT-INITIAL").outputFieldIds.includes(fieldId), false);
    assert.equal(actionById.get("CORR-ACT-SUBMIT-LATE").outputFieldIds.includes(fieldId), false);
    assert.equal(actionById.get("CORR-ACT-RESUBMIT").outputFieldIds.includes(fieldId), true);
  }

  assert.deepEqual(actionById.get("CORR-ACT-MARK-TASK-AWAITING-RETRY").transition, {
    from: ["OPEN", "OVERDUE", "AWAITING_RETRY"],
    to: "AWAITING_RETRY",
  });
  assert.deepEqual(actionById.get("CORR-ACT-COMPLETE-TASK").transition, {
    from: ["OPEN", "OVERDUE", "AWAITING_RETRY"],
    to: "COMPLETED",
  });
  assert.equal(
    actionById.get("CORR-ACT-MARK-TASK-AWAITING-RETRY").targetObjectId,
    task.id,
  );
  assert.equal(actionById.get("CORR-ACT-COMPLETE-TASK").targetObjectId, task.id);

  const flow = flows.find(({ id }) => id === "DF-010");
  const actionIdByOrder = new Map(flow.steps.map(({ order, actionId }) => [order, actionId]));
  for (const pathId of ["PASSED", "CLOSED"]) {
    const actionIds = flow.executionPaths.find(({ id }) => id === pathId).stepOrders
      .map((order) => actionIdByOrder.get(order));
    assert.ok(actionIds.indexOf("CORR-ACT-COMPLETE-TASK")
      < actionIds.indexOf("CORR-ACT-RECORD-INVALIDATION"), pathId);
  }
  for (const pathId of ["NOT_PASSED", "NEEDS_MORE"]) {
    const actionIds = flow.executionPaths.find(({ id }) => id === pathId).stepOrders
      .map((order) => actionIdByOrder.get(order));
    assert.deepEqual(actionIds.slice(-2), [
      "CORR-ACT-REQUEST-RETRY",
      "CORR-ACT-MARK-TASK-AWAITING-RETRY",
    ], pathId);
  }
});

test("declares field-derived guard policies for every version-pinned reference", () => {
  const pinnedRefs = modules.flatMap((module) => module.objects.flatMap((object) => (
    object.fields.filter(({ referenceIntegrity }) => referenceIntegrity === "VERSION_PINNED")
      .map((field) => ({ module, object, field }))
  )));
  const allowedPolicies = new Set([
    "NONE",
    "CREATE_REQUIRED",
    "UPDATE_REQUIRED",
    "ALWAYS_REQUIRED",
  ]);
  assert.equal(pinnedRefs.length, 52);
  assert.equal(pinnedRefs.every(({ field }) => allowedPolicies.has(field.stateGuardPolicy)), true);

  const correction = moduleById(requirementModel, "CORR-001");
  const attempt = correction.objects.find(({ id }) => id === "CORR-OBJ-ATTEMPT");
  assert.equal(attempt.fields.find(({ id }) => (
    id === "CORR-ATTEMPT-F-TASK-REF"
  )).stateGuardPolicy, "CREATE_REQUIRED");
  assert.equal(attempt.fields.find(({ id }) => (
    id === "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF"
  )).stateGuardPolicy, "CREATE_REQUIRED");
  assert.equal(pinnedRefs.filter(({ field }) => field.stateGuardPolicy === "NONE").length, 36);
});

test("declares exact action applicability for every version-pinned reference", () => {
  const pinnedRefs = modules.flatMap((module) => module.objects.flatMap((object) => (
    object.fields.filter(({ referenceIntegrity }) => referenceIntegrity === "VERSION_PINNED")
      .map((field) => ({ module, object, field }))
  )));
  assert.equal(pinnedRefs.length, 52);
  assert.equal(pinnedRefs.every(({ field }) => (
    field.actionApplicability
    && Object.keys(field.actionApplicability).length === 1
    && Array.isArray(field.actionApplicability.requiredActionIds)
  )), true);

  const correction = moduleById(requirementModel, "CORR-001");
  const attempt = correction.objects.find(({ id }) => id === "CORR-OBJ-ATTEMPT");
  assert.deepEqual(attempt.fields.find(({ id }) => (
    id === "CORR-ATTEMPT-F-TASK-REF"
  )).actionApplicability.requiredActionIds, [
    "CORR-ACT-SUBMIT-INITIAL",
    "CORR-ACT-SUBMIT-LATE",
    "CORR-ACT-RESUBMIT",
  ]);
  assert.deepEqual(attempt.fields.find(({ id }) => (
    id === "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF"
  )).actionApplicability.requiredActionIds, ["CORR-ACT-RESUBMIT"]);
  assert.equal(pinnedRefs.filter(({ field }) => (
    field.actionApplicability.requiredActionIds.length === 0
  )).length, 36);
});

test("fails closed when version-pinned action applicability is malformed", () => {
  const mutations = [
    ["missing applicability declaration", (model) => {
      delete moduleById(model, "CORR-001").objects
        .find(({ id }) => id === "CORR-OBJ-ATTEMPT").fields
        .find(({ id }) => id === "CORR-ATTEMPT-F-TASK-REF").actionApplicability;
    }],
    ["extra applicability key", (model) => {
      moduleById(model, "CORR-001").objects
        .find(({ id }) => id === "CORR-OBJ-ATTEMPT").fields
        .find(({ id }) => id === "CORR-ATTEMPT-F-TASK-REF")
        .actionApplicability.extra = true;
    }],
    ["duplicate required action", (model) => {
      moduleById(model, "CORR-001").objects
        .find(({ id }) => id === "CORR-OBJ-ATTEMPT").fields
        .find(({ id }) => id === "CORR-ATTEMPT-F-TASK-REF")
        .actionApplicability.requiredActionIds.push("CORR-ACT-SUBMIT-INITIAL");
    }],
    ["applicability on identity-only reference", (model) => {
      moduleById(model, "CORR-001").objects
        .find(({ id }) => id === "CORR-OBJ-ATTEMPT").fields
        .find(({ id }) => id === "CORR-ATTEMPT-F-STUDENT-REF")
        .actionApplicability = { requiredActionIds: [] };
    }],
  ];

  const missedMutations = [];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    if (!errorCodes(validateRequirementModel(model)).includes("INVALID_FIELD_CONTRACT")) {
      missedMutations.push(name);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("fails closed when version-pinned action applicability disagrees with actions", () => {
  const taskRef = (model) => moduleById(model, "CORR-001").objects
    .find(({ id }) => id === "CORR-OBJ-ATTEMPT").fields
    .find(({ id }) => id === "CORR-ATTEMPT-F-TASK-REF");
  const priorAttemptRef = (model) => moduleById(model, "CORR-001").objects
    .find(({ id }) => id === "CORR-OBJ-ATTEMPT").fields
    .find(({ id }) => id === "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF");
  const mutations = [
    ["downgraded policy and deleted guards", (model) => {
      taskRef(model).stateGuardPolicy = "NONE";
      for (const actionId of taskRef(model).actionApplicability.requiredActionIds) {
        const action = moduleById(model, "CORR-001").actions
          .find(({ id }) => id === actionId);
        action.relatedStateGuards = action.relatedStateGuards.filter(({ refFieldId }) => (
          refFieldId !== "CORR-ATTEMPT-F-TASK-REF"
        ));
        if (action.relatedStateGuards.length === 0) delete action.relatedStateGuards;
      }
    }],
    ["deleted prior lineage coverage and guard", (model) => {
      const action = moduleById(model, "CORR-001").actions
        .find(({ id }) => id === "CORR-ACT-RESUBMIT");
      action.outputFieldIds = action.outputFieldIds.filter((fieldId) => ![
        "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF",
        "CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION",
      ].includes(fieldId));
      action.relatedStateGuards = action.relatedStateGuards.filter(({ refFieldId }) => (
        refFieldId !== "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF"
      ));
    }],
    ["unknown action", (model) => {
      taskRef(model).actionApplicability.requiredActionIds[0] = "CORR-ACT-MISSING";
    }],
    ["cross-object action", (model) => {
      taskRef(model).actionApplicability.requiredActionIds[0] = "CORR-ACT-COMPLETE-TASK";
    }],
    ["operation mismatch", (model) => {
      taskRef(model).actionApplicability.requiredActionIds[0] = (
        "CORR-ACT-CONFIRM-JUDGMENT"
      );
    }],
    ["missing required action", (model) => {
      taskRef(model).actionApplicability.requiredActionIds = taskRef(model)
        .actionApplicability.requiredActionIds
        .filter((actionId) => actionId !== "CORR-ACT-SUBMIT-LATE");
    }],
    ["empty applicability with required policy", (model) => {
      priorAttemptRef(model).actionApplicability.requiredActionIds = [];
    }],
  ];

  const missedMutations = [];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    if (!errorCodes(validateRequirementModel(model)).includes("INVALID_ACTION_STATE_GUARD")) {
      missedMutations.push(name);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("fails closed when derived correction guards are removed or downgraded", () => {
  const closedModel = structuredClone(requirementModel);
  for (const module of closedModel.modules) {
    for (const object of module.objects) {
      for (const field of object.fields) {
        if (field.referenceIntegrity === "VERSION_PINNED") field.stateGuardPolicy = "NONE";
      }
    }
  }
  const closedAttempt = moduleById(closedModel, "CORR-001").objects
    .find(({ id }) => id === "CORR-OBJ-ATTEMPT");
  for (const fieldId of [
    "CORR-ATTEMPT-F-TASK-REF",
    "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF",
  ]) {
    closedAttempt.fields.find(({ id }) => id === fieldId).stateGuardPolicy = "CREATE_REQUIRED";
  }

  const mutations = [
    ["deleted all submission guards", "INVALID_ACTION_STATE_GUARD", (model) => {
      const correction = moduleById(model, "CORR-001");
      for (const actionId of [
        "CORR-ACT-SUBMIT-INITIAL",
        "CORR-ACT-SUBMIT-LATE",
        "CORR-ACT-RESUBMIT",
      ]) {
        delete correction.actions.find(({ id }) => id === actionId).relatedStateGuards;
      }
    }],
    ["deleted task guard policy", "INVALID_FIELD_CONTRACT", (model) => {
      delete moduleById(model, "CORR-001").objects
        .find(({ id }) => id === "CORR-OBJ-ATTEMPT").fields
        .find(({ id }) => id === "CORR-ATTEMPT-F-TASK-REF").stateGuardPolicy;
    }],
    ["downgraded task guard policy", "INVALID_ACTION_STATE_GUARD", (model) => {
      moduleById(model, "CORR-001").objects
        .find(({ id }) => id === "CORR-OBJ-ATTEMPT").fields
        .find(({ id }) => id === "CORR-ATTEMPT-F-TASK-REF").stateGuardPolicy = "NONE";
    }],
    ["omitted prior attempt ref", "INVALID_ACTION_STATE_GUARD", (model) => {
      const resubmit = moduleById(model, "CORR-001").actions
        .find(({ id }) => id === "CORR-ACT-RESUBMIT");
      resubmit.outputFieldIds = resubmit.outputFieldIds
        .filter((fieldId) => fieldId !== "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF");
    }],
    ["omitted prior attempt version", "INVALID_ACTION_STATE_GUARD", (model) => {
      const resubmit = moduleById(model, "CORR-001").actions
        .find(({ id }) => id === "CORR-ACT-RESUBMIT");
      resubmit.outputFieldIds = resubmit.outputFieldIds
        .filter((fieldId) => fieldId !== "CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION");
    }],
    ["invalid guarded target state", "INVALID_ACTION_STATE_GUARD", (model) => {
      moduleById(model, "CORR-001").actions
        .find(({ id }) => id === "CORR-ACT-SUBMIT-INITIAL")
        .relatedStateGuards[0].requiredState = "MISSING";
    }],
  ];

  const missedMutations = [];
  for (const [name, errorCode, mutate] of mutations) {
    const model = structuredClone(closedModel);
    mutate(model);
    if (!errorCodes(validateRequirementModel(model)).includes(errorCode)) {
      missedMutations.push(name);
    }
  }
  assert.deepEqual(missedMutations, []);
});

test("keeps correction task creation teacher or system owned and reachable from DF-008", () => {
  const correction = moduleById(requirementModel, "CORR-001");
  const actionById = new Map(correction.actions.map((action) => [action.id, action]));
  const createActions = correction.actions.filter(({ targetObjectId, operationKind }) => (
    targetObjectId === "CORR-OBJ-TASK" && operationKind === "CREATE"
  ));
  assert.deepEqual(createActions.map(({ id }) => id), [
    "CORR-ACT-CREATE-TASK",
    "CORR-ACT-AUTO-CREATE-TASK",
  ]);
  assert.equal(createActions.some(({ permissions }) => permissions.some((permission) => (
    permission.effect === "ALLOW" && permission.roleRef === "ROLE-STUDENT"
  ))), false);

  const teacherCreate = actionById.get("CORR-ACT-CREATE-TASK");
  assert.equal(teacherCreate.executionMode, "USER_TASK");
  assert.ok(teacherCreate.permissions.some(({ effect, dutyRef }) => (
    effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
  )));
  const autoCreate = actionById.get("CORR-ACT-AUTO-CREATE-TASK");
  assert.equal(autoCreate.executionMode, "FLOW_INTERNAL");
  assert.deepEqual(autoCreate.trigger, { kind: "FLOW", flowIds: ["DF-008"] });
  assert.ok(autoCreate.permissions.some(({ effect, actorRef }) => (
    effect === "ALLOW" && actorRef === "SYSTEM"
  )));
  assert.match(autoCreate.idempotencyKey, /published-result-version/i);
  for (const createAction of createActions) {
    assert.ok(createAction.outputFieldIds.includes("CORR-TASK-F-DUE-AT"));
    assert.deepEqual(
      correction.scenarios.find(({ actionId, kind }) => (
        actionId === createAction.id && kind === "SUCCESS"
      )).then.expectedState,
      { mode: "STATE", value: "OPEN" },
    );
  }

  const release = flows.find(({ id }) => id === "DF-008");
  assert.deepEqual(new Set(release.moduleIds), new Set(["GRD-001", "PUB-001", "CORR-001"]));
  const publishOrder = release.steps.find(({ actionId }) => (
    actionId === "PUB-ACT-PUBLISH-RESULT"
  )).order;
  const autoCreateStep = release.steps.find(({ actionId }) => (
    actionId === "CORR-ACT-AUTO-CREATE-TASK"
  ));
  assert.ok(autoCreateStep.order > publishOrder);
  assert.match(autoCreateStep.condition, /published result.*requires correction/i);
  assert.equal([
    "CORR-TASK-F-ID",
    "CORR-TASK-F-SOURCE-RESULT-REF",
    "CORR-TASK-F-SOURCE-RESULT-VERSION",
    "CORR-TASK-F-DUE-AT",
    "CORR-TASK-F-TASK-VERSION",
  ].every((fieldId) => release.targetDataRefs.some(({ objectId, fieldId: targetFieldId }) => (
    objectId === "CORR-OBJ-TASK" && targetFieldId === fieldId
  ))), true);
  assert.equal([
    "SOURCE_VERSION_STALE",
    "VERSION_CONFLICT",
  ].every((resultCode) => (
    release.retryPolicy.retryableFailureResults.includes(resultCode)
  )), true);
  assert.match(release.retryPolicy.strategy, /CORRECTION_TASK/i);
  assert.match(release.compensation.description, /retain successful.*correction task/i);

  assert.deepEqual(actionById.get("CORR-ACT-MARK-OVERDUE").transition, {
    from: "OPEN",
    to: "OVERDUE",
  });
  assert.equal(actionById.get("CORR-ACT-SUBMIT-LATE").operationKind, "CREATE");
  assert.equal(actionById.get("CORR-ACT-RESUBMIT").operationKind, "CREATE");
});

test("records the closed result-correction invalidation chain with source and target history", () => {
  const correction = moduleById(requirementModel, "CORR-001");
  const invalidation = correction.objects.find(({ id }) => id === "CORR-OBJ-INVALIDATION");
  assert.deepEqual(invalidation.targetKindContract, [
    "EVIDENCE",
    "MASTERY_INTERPRETATION",
    "IMPROVEMENT_CANDIDATE",
    "PLAN_EVALUATION",
    "REPORT_INTERPRETATION",
    "LEARNING_PATH_EXPLANATION",
  ]);
  assert.deepEqual(invalidation.targetStateContract, [
    "STALE",
    "INVALIDATED",
    "PENDING_RECONFIRM",
  ]);
  assert.equal(invalidation.historyPreservation, "RETAIN_ALL_PRIOR_VERSIONS");
  const fieldIds = new Set(invalidation.fields.map(({ id }) => id));
  assert.equal([
    "CORR-INVALIDATION-F-SOURCE-RESULT-REF",
    "CORR-INVALIDATION-F-SOURCE-RESULT-VERSION",
    "CORR-INVALIDATION-F-SOURCE-DECISION-REF",
    "CORR-INVALIDATION-F-SOURCE-DECISION-VERSION",
    "CORR-INVALIDATION-F-TARGET-KINDS",
    "CORR-INVALIDATION-F-TARGET-TRANSITIONS",
    "CORR-INVALIDATION-F-TARGET-VERSIONS",
    "CORR-INVALIDATION-F-HISTORY-PRESERVATION",
    "CORR-INVALIDATION-F-INVALIDATION-VERSION",
  ].every((fieldId) => fieldIds.has(fieldId)), true);
  assert.equal(invalidation.lineageBindings.length, 2);

  const planModule = moduleById(requirementModel, "PLN-001");
  const plan = planModule.objects.find(({ id }) => id === "PLN-OBJ-PLAN");
  const markPending = planModule.actions.find(({ id }) => (
    id === "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM"
  ));
  assert.ok(plan.states.includes("PENDING_RECONFIRM"));
  assert.deepEqual(markPending.transition, { from: "ACTIVE", to: "PENDING_RECONFIRM" });
  assert.deepEqual(markPending.trigger, {
    kind: "FLOW",
    flowIds: ["DF-009", "DF-010"],
  });
  assert.ok(markPending.outputFieldIds.includes("PLN-PLAN-F-INVALIDATION-REF"));
  assert.ok(markPending.outputFieldIds.includes("PLN-PLAN-F-EVALUATION-STATE"));
  assert.ok(plan.lineageBindings.some(({ refFieldId, targetObjectId }) => (
    refFieldId === "PLN-PLAN-F-INVALIDATION-REF"
    && targetObjectId === "CORR-OBJ-INVALIDATION"
  )));
});

test("defines exact DF-010 DF-012 and DF-014 action version retry and invalidation contracts", () => {
  const expected = {
    "DF-010": {
      modules: ["PUB-001", "INS-001", "PLN-001", "CORR-001"],
      actions: [
        "PUB-ACT-VIEW-RESULT",
        "CORR-ACT-NORMALIZE-SUBMISSION",
        "CORR-ACT-CONFIRM-JUDGMENT",
        "CORR-ACT-REQUEST-RETRY",
        "CORR-ACT-COMPLETE-TASK",
        "CORR-ACT-MARK-TASK-AWAITING-RETRY",
        "CORR-ACT-RECORD-INVALIDATION",
        "INS-ACT-MARK-STALE",
        "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM",
        "INS-ACT-CREATE-CANDIDATE",
        "INS-ACT-CONFIRM-MASTERY",
        "INS-ACT-PUBLISH-INTERPRETATION",
      ],
      identities: [
        "PUB-RESULT-F-ID",
        "CORR-TASK-F-ID",
        "CORR-ATTEMPT-F-ID",
        "PLN-PLAN-F-ID",
      ],
      versions: [
        "PUB-RESULT-F-RESULT-VERSION",
        "CORR-TASK-F-TASK-VERSION",
        "CORR-ATTEMPT-F-CORRECTION-VERSION",
        "INS-EVIDENCE-F-EVIDENCE-VERSION",
        "PLN-PLAN-F-PLAN-VERSION",
      ],
      fanout: "INS-EVIDENCE-F-ID",
      retry: ["VERSION_CONFLICT", "AUDIT_FAILED"],
    },
    "DF-012": {
      modules: ["INS-001", "PLN-001", "APP-001"],
      actions: [
        "INS-ACT-READ-CONFIRMED-EVIDENCE",
        "PLN-ACT-CREATE-CANDIDATE",
        "PLN-ACT-CONFIRM-PLAN",
        "PLN-ACT-SYNC-SUBJECT-TEACHER",
        "PLN-ACT-SYNC-HOMEROOM-COORDINATION",
        "APP-ACT-CREATE-PLAN-TODO",
      ],
      identities: ["INS-EVIDENCE-F-ID"],
      versions: ["INS-EVIDENCE-F-EVIDENCE-VERSION"],
      fanout: "INS-EVIDENCE-F-STUDENT-REF",
      retry: ["SYNC_DELIVERY_FAILED", "VERSION_CONFLICT", "AUDIT_FAILED"],
    },
    "DF-014": {
      modules: ["SCO-001", "INS-001", "PLN-001", "APP-001", "STU-001"],
      actions: [
        "SCO-ACT-READ-GRADEBOOK",
        "INS-ACT-READ-CONFIRMED-EVIDENCE",
        "PLN-ACT-VIEW-HOMEROOM-COORDINATION",
        "APP-ACT-REFRESH-TODOS",
        "STU-ACT-BUILD-PROFILE",
      ],
      identities: [
        "SCO-VIEW-F-ID",
        "INS-EVIDENCE-F-ID",
        "PLN-PLAN-F-ID",
        "PLN-HOMEROOM-F-ID",
        "APP-TODO-F-ID",
      ],
      versions: [
        "SCO-VIEW-F-VIEW-VERSION",
        "INS-EVIDENCE-F-EVIDENCE-VERSION",
        "PLN-PLAN-F-PLAN-VERSION",
        "PLN-HOMEROOM-F-OUTPUT-VERSION",
        "APP-TODO-F-AGGREGATION-VERSION",
      ],
      fanout: "APP-TODO-F-STUDENT-REF",
      retry: ["SOURCE_VERSION_STALE", "VERSION_CONFLICT", "AUDIT_FAILED"],
    },
  };
  const actionById = new Map(modules.flatMap((module) => (
    module.actions.map((action) => [action.id, action])
  )));

  for (const [flowId, contract] of Object.entries(expected)) {
    const flow = flows.find(({ id }) => id === flowId);
    assert.deepEqual(flow.moduleIds, contract.modules, flowId);
    assert.deepEqual(flow.steps.map(({ actionId }) => actionId), contract.actions, flowId);
    assert.deepEqual(flow.idempotencyKeyParts, {
      identityFieldIds: contract.identities,
      versionFieldIds: contract.versions,
      fanoutFieldId: contract.fanout,
    });
    assert.deepEqual(flow.retryPolicy.retryableFailureResults, contract.retry);
    assert.match(flow.failureGranularity, /OBJECT/, flowId);
    assert.ok(flow.downstreamInvalidation.targets.length > 0, flowId);

    const stepActions = flow.steps.map(({ actionId }) => actionById.get(actionId));
    for (const target of flow.targetDataRefs) {
      assert.ok(stepActions.some((action) => (
        action.targetObjectId === target.objectId
        && action.outputFieldIds.includes(target.fieldId)
      )), `${flowId}:${target.objectId}.${target.fieldId}`);
    }
  }

  assert.deepEqual(
    reachableObjectStates(moduleById(requirementModel, "INS-001"), "INS-OBJ-EVIDENCE"),
    new Set(["CANDIDATE", "TEACHER_CONFIRMED", "STUDENT_VISIBLE", "STALE"]),
  );
  assert.deepEqual(
    reachableObjectStates(moduleById(requirementModel, "PLN-001"), "PLN-OBJ-PLAN"),
    new Set(["CANDIDATE", "ACTIVE", "CLOSED", "PENDING_RECONFIRM"]),
  );
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

  assert.equal(modules.length, 27);
  for (const module of modules) {
    if (module.phase === PHASE.SECOND) {
      assert.deepEqual(module.actions, [], module.id);
      assert.deepEqual(module.pages, [], module.id);
      assert.deepEqual(module.scenarios, [], module.id);
      continue;
    }
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
    ["ACC-ACT-SYNC-SCHOOL", "SYSTEM_EVENT"],
    ["ACC-ACT-SYNC-IDENTITY", "SYSTEM_EVENT"],
    ["ACC-ACT-EXPIRE-CONTEXT", "SYSTEM_EVENT"],
    ["ACC-ACT-INVALIDATE-CONTEXT", "SYSTEM_EVENT"],
    ["ORG-ACT-FINALIZE-AUDITED-IMPORT", "FLOW_INTERNAL"],
    ["ORG-ACT-FINALIZE-AUDITED-PARTIAL-IMPORT", "FLOW_INTERNAL"],
    ["IAM-ACT-SYNC-ROLE-POLICY", "SYSTEM_EVENT"],
    ["IAM-ACT-EXPIRE-GRANT", "SYSTEM_EVENT"],
    ["IAM-ACT-MARK-PERMISSION-STALE", "SYSTEM_EVENT"],
    ["IAM-ACT-EVALUATE-PERMISSION", "FLOW_INTERNAL"],
    ["IAM-ACT-RECALCULATE-PERMISSIONS", "FLOW_INTERNAL"],
    ["DGV-ACT-SYNC-POLICY", "SYSTEM_EVENT"],
    ["DGV-ACT-GENERATE-EXPORT", "SYSTEM_EVENT"],
    ["DGV-ACT-COMPLETE-EXPORT", "SYSTEM_EVENT"],
    ["DGV-ACT-FAIL-EXPORT", "SYSTEM_EVENT"],
    ["DGV-ACT-EXPIRE-EXPORT", "SYSTEM_EVENT"],
    ["AUD-ACT-APPEND-EVENT", "SYSTEM_EVENT"],
    ["AUD-ACT-ARCHIVE-EVENT", "SYSTEM_EVENT"],
    ["AUD-ACT-EXPIRE-ACCESS-REQUEST", "SYSTEM_EVENT"],
    ["AUD-ACT-OPEN-SESSION", "SYSTEM_EVENT"],
    ["AUD-ACT-ACTIVATE-SESSION", "SYSTEM_EVENT"],
    ["AUD-ACT-EXPIRE-SESSION", "SYSTEM_EVENT"],
    ["TEA-ACT-SYNC-TODO-VIEW", "SYSTEM_EVENT"],
    ["HW-ACT-SYNC-RUBRIC", "SYSTEM_EVENT"],
    ["HW-ACT-PUBLISH-SCHEDULED", "SYSTEM_EVENT"],
    ["HW-ACT-RESOLVE-GRADING-SNAPSHOT", "FLOW_INTERNAL"],
    ["SUB-ACT-HANDOFF-ACCEPTED", "FLOW_INTERNAL"],
    ["GRD-ACT-SYNC-CAPABILITY-RULE", "SYSTEM_EVENT"],
    ["GRD-ACT-ENQUEUE", "FLOW_INTERNAL"],
    ["GRD-ACT-PROCESS", "FLOW_INTERNAL"],
    ["GRD-ACT-ROUTE", "FLOW_INTERNAL"],
    ["GRD-ACT-ROUTE-UNSUPPORTED", "FLOW_INTERNAL"],
    ["GRD-ACT-ROUTE-AI-UNAVAILABLE", "FLOW_INTERNAL"],
    ["PUB-ACT-MATERIALIZE-RESULT", "FLOW_INTERNAL"],
    ["PUB-ACT-PUBLISH-RESULT", "FLOW_INTERNAL"],
    ["PUB-ACT-FINALIZE-BATCH", "FLOW_INTERNAL"],
    ["PUB-ACT-RECONCILE-BATCH", "FLOW_INTERNAL"],
    ["PUB-ACT-RESOLVE-DEPENDENCY-SNAPSHOT", "FLOW_INTERNAL"],
    ["INS-ACT-CREATE-CANDIDATE", "FLOW_INTERNAL"],
    ["INS-ACT-MARK-STALE", "FLOW_INTERNAL"],
    ["PLN-ACT-CREATE-CANDIDATE", "FLOW_INTERNAL"],
    ["PLN-ACT-SYNC-SUBJECT-TEACHER", "FLOW_INTERNAL"],
    ["PLN-ACT-SYNC-HOMEROOM-COORDINATION", "FLOW_INTERNAL"],
    ["PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM", "FLOW_INTERNAL"],
    ["APP-ACT-CREATE-PLAN-TODO", "FLOW_INTERNAL"],
    ["APP-ACT-CREATE-HOMEWORK-TODO", "FLOW_INTERNAL"],
    ["APP-ACT-REFRESH-TODOS", "FLOW_INTERNAL"],
    ["CORR-ACT-MARK-OVERDUE", "SYSTEM_EVENT"],
    ["CORR-ACT-AUTO-CREATE-TASK", "FLOW_INTERNAL"],
    ["CORR-ACT-NORMALIZE-SUBMISSION", "FLOW_INTERNAL"],
    ["CORR-ACT-COMPLETE-TASK", "FLOW_INTERNAL"],
    ["CORR-ACT-MARK-TASK-AWAITING-RETRY", "FLOW_INTERNAL"],
    ["CORR-ACT-RECORD-INVALIDATION", "FLOW_INTERNAL"],
    ["STU-ACT-BUILD-PROFILE", "FLOW_INTERNAL"],
    ["RPT-ACT-CREATE-AD-HOC-RUN", "FLOW_INTERNAL"],
    ["RPT-ACT-CREATE-RUN", "FLOW_INTERNAL"],
    ["RPT-ACT-START-RUN", "FLOW_INTERNAL"],
    ["RPT-ACT-COMPLETE-RUN", "FLOW_INTERNAL"],
    ["RPT-ACT-FAIL-RUN", "SYSTEM_EVENT"],
    ["RPT-ACT-BLOCK-RUN-PERMISSION", "SYSTEM_EVENT"],
    ["RPT-ACT-MATERIALIZE-SNAPSHOT", "FLOW_INTERNAL"],
    ["RPT-ACT-CREATE-DELIVERY", "FLOW_INTERNAL"],
    ["RPT-ACT-MARK-DELIVERED", "SYSTEM_EVENT"],
    ["RPT-ACT-FAIL-DELIVERY", "SYSTEM_EVENT"],
    ["RPT-ACT-RETRY-DELIVERY", "SYSTEM_EVENT"],
    ["LPATH-ACT-APPEND-PUBLISHED-RESULT-TIMELINE", "FLOW_INTERNAL"],
    ["LPATH-ACT-APPEND-EVIDENCE-TIMELINE", "FLOW_INTERNAL"],
    ["LPATH-ACT-APPEND-CORRECTION-TIMELINE", "FLOW_INTERNAL"],
    ["LPATH-ACT-APPEND-PLAN-EXECUTION-TIMELINE", "FLOW_INTERNAL"],
    ["LPATH-ACT-APPEND-TEACHER-CONFIRMATION-TIMELINE", "FLOW_INTERNAL"],
    ["LPATH-ACT-CREATE-INTERPRETATION-CANDIDATE", "FLOW_INTERNAL"],
    ["LPATH-ACT-MARK-INTERPRETATION-STALE", "SYSTEM_EVENT"],
    ["NOTI-ACT-CREATE-REPORT-NOTIFICATION", "FLOW_INTERNAL"],
    ["NOTI-ACT-DELIVER", "SYSTEM_EVENT"],
    ["NOTI-ACT-FAIL-DELIVERY", "SYSTEM_EVENT"],
    ["NOTI-ACT-RETRY-DELIVERY", "SYSTEM_EVENT"],
    ["SCH-ACT-MARK-CANDIDATE-STALE", "SYSTEM_EVENT"],
  ]);
  const actions = modules.flatMap((module) => module.actions);
  const pages = modules.flatMap((module) => module.pages);
  const scenarios = modules.flatMap((module) => module.scenarios);

  assert.equal(expectedModes.size, 77);
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
      .filter(({ risk, auditMode }) => (
        risk === RISK.HIGH && auditMode !== "ATOMIC_SELF_RECORD"
      ))
      .every(({ auditMode, failureResults }) => (
        auditMode === "REQUIRED" && failureResults.includes("AUDIT_FAILED")
      )),
    true,
  );
  assert.ok(actions
    .filter(({ auditMode }) => auditMode === "ATOMIC_SELF_RECORD")
    .every(({ targetObjectId, failureResults }) => (
      targetObjectId === "AUD-OBJ-EVENT" && !failureResults.includes("AUDIT_FAILED")
    )));
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
    "Teacher Profile": ["TEACHER", "SCHOOL", "ROLE-ACADEMIC", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"],
    "Student Profile": ["STUDENT", "SCHOOL", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"],
    "Import Batch": ["ORGANIZATION_IMPORT", "SCHOOL", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR"],
    "Import Row Result": ["ORGANIZATION_IMPORT_OBJECT", "SCHOOL", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR"],
    "Export Request": ["EXPORT_REQUESTER_AND_SCOPED_DATA", "SCHOOL", "CURRENT_ACTOR", "CURRENT_ACTOR", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"],
    "Sensitive Access Request": ["ACCESS_REQUESTER_AND_SCOPED_DATA", "SCHOOL", "CURRENT_ACTOR", "CURRENT_ACTOR", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"],
    "Curriculum Version": ["SUBJECT_CURRICULUM", "SCHOOL", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"],
    "Textbook Version": ["SUBJECT_CURRICULUM", "SCHOOL", "ROLE-ACADEMIC", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD"],
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
  assert.deepEqual(flow.steps.map(({ order, actionId, condition }) => ({
    order,
    actionId,
    ...(condition ? { condition } : {}),
  })), [
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

test("rejects low-risk or audit-open sensitive lifecycle transitions", () => {
  const model = structuredClone(requirementModel);
  const revoke = moduleById(model, "IAM-001").actions
    .find(({ id }) => id === "IAM-ACT-REVOKE-DUTY-GRANT");
  revoke.risk = RISK.LOW;
  revoke.failureResults = revoke.failureResults
    .filter((resultCode) => resultCode !== "AUDIT_FAILED");

  assertHasCode(validateRequirementModel(model), "INVALID_LIFECYCLE_RISK");
});

test("keeps destructive S3 and S4 lifecycle transitions high-risk and audit fail-closed", () => {
  const destructiveStates = new Set([
    "SUSPENDED",
    "DEACTIVATED",
    "REVOKED",
    "ARCHIVED",
    "TRANSFERRED",
    "EXPIRED",
    "CANCELLED",
    "SUPERSEDED",
    "DEPRECATED",
    "RETIRED",
    "CLOSED",
    "INVALIDATED",
    "DISABLED",
    "STALE",
  ]);
  const violations = [];
  for (const module of modules) {
    const objectById = new Map(module.objects.map((object) => [object.id, object]));
    for (const action of module.actions) {
      const targetObject = objectById.get(action.targetObjectId);
      if (
        !["S3", "S4"].includes(targetObject?.sensitivityId)
        || !destructiveStates.has(action.transition?.to)
      ) continue;
      const auditClosed = action.auditMode === "ATOMIC_SELF_RECORD"
        || (
          action.auditMode === "REQUIRED"
          && action.failureResults.includes("AUDIT_FAILED")
        );
      if (action.risk !== RISK.HIGH || !auditClosed) violations.push(action.id);
    }
  }
  assert.deepEqual(violations, []);
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
  assert.deepEqual(curriculumValidate.transition, {
    from: ["DRAFT", "VALIDATING"],
    to: "VALIDATED",
  });
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
    [
      "DGV-ACT-REQUEST-EXPORT",
      "DGV-ACT-APPROVE-EXPORT",
      "DGV-ACT-DENY-EXPORT",
      "DGV-ACT-GENERATE-EXPORT",
      "DGV-ACT-COMPLETE-EXPORT",
      "DGV-ACT-FAIL-EXPORT",
      "DGV-ACT-EXPIRE-EXPORT",
    ],
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

  assert.equal(flows.length, 14);
  for (const flow of flows) {
    const actionModuleIds = new Set(flow.steps.map(({ actionId }) => moduleByActionId.get(actionId)));
    const sourceOnlyModuleIds = new Set(flow.sourceOnlyModuleIds ?? []);
    const expectedActionModuleIds = new Set(
      flow.moduleIds.filter((moduleId) => !sourceOnlyModuleIds.has(moduleId)),
    );
    assert.deepEqual(expectedActionModuleIds, actionModuleIds, flow.id);
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

test("the validation CLI reports twenty-seven modules and fourteen Flows", () => {
  const output = execFileSync(
    process.execPath,
    ["tools/validate_v2_requirements.mjs"],
    { cwd: new URL("../..", import.meta.url), encoding: "utf8" },
  );
  assert.equal(output, "validated modules=27 flows=14\n");
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
  assert.equal(
    metrics.find(({ id }) => id === "MET-002").correlationKey,
    "studentFeedbackViewId",
  );
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
    "reportDataScope",
    "reportMetric",
    "aiCapability",
    "aiCapabilityDecision",
    "aiRisk",
    "aiTaskStatus",
    "notificationType",
    "notificationReadState",
    "notificationChannel",
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
    "lessonPlanStatus",
    "materialLicenseStatus",
    "contentAvailability",
    "examEventStatus",
    "scoreImportValidation",
    "scoreConfirmationDecision",
    "scheduleConstraintHardness",
    "scheduleHardConstraintCheck",
    "scheduleConstraintKind",
    "serviceState",
    "supportCaseStatus",
    "contentPermissionScope",
    "contentLicenseStatus",
    "activityStatus",
    "assignmentDraftStatus",
    "scheduleCandidateStatus",
    "platformCaseStatus",
    "policyTemplateStatus",
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
    notificationChannel: ["IN_PRODUCT"],
    reportDataScope: [
      "SUBJECT_ASSIGNED",
      "HOMEROOM_ASSIGNED_CLASS_AGGREGATE",
      "ACADEMIC_AUTHORIZED_AGGREGATE",
    ],
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
    lessonPlanStatus: ["DRAFT", "CONFIRMED"],
    materialLicenseStatus: ["PENDING", "VERIFIED"],
    contentAvailability: ["DRAFT", "PUBLISHED"],
    examEventStatus: ["DRAFT", "PUBLISHED", "CORRECTION_OPEN"],
    scoreImportValidation: ["PENDING", "PASSED", "REJECTED"],
    scoreConfirmationDecision: ["CONFIRM", "REJECT"],
    scheduleConstraintHardness: ["HARD", "SOFT"],
    scheduleHardConstraintCheck: ["PASS", "FAIL"],
    scheduleConstraintKind: [
      "TEACHER_AVAILABILITY",
      "CLASS_PERIOD",
      "COURSE_LOAD",
      "ROOM_CAPACITY",
    ],
    serviceState: ["DRAFT", "CONFIRMED", "ACTIVE"],
    supportCaseStatus: ["OPEN", "CLOSED"],
    contentPermissionScope: ["SCHOOL", "SUBJECT", "COURSE"],
    contentLicenseStatus: ["DRAFT", "ACTIVE"],
    activityStatus: ["PLANNED", "RECORDED"],
    assignmentDraftStatus: ["DRAFT", "READY_FOR_HANDOFF"],
    scheduleCandidateStatus: ["GENERATED", "REVIEWED", "CONFIRMED", "PUBLISHED", "STALE"],
    platformCaseStatus: ["OPEN", "SCHOOL_CONFIRMED"],
    policyTemplateStatus: ["DRAFT", "CONFIRMED", "ACTIVE"],
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
      stateReachability: {
        mode: "ACTION_GRAPH",
        initialStateIds: ["DRAFT"],
      },
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
      stateReachability: {
        mode: "ACTION_GRAPH",
        initialStateIds: ["DRAFT"],
      },
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

const TASK8_MODULE_CONTRACTS = [
  ["PREP-001", PHASE.FIRST, "P0"],
  ["CONTENT-001", PHASE.FIRST, "P0"],
  ["EXM-001", PHASE.FIRST, "P0"],
  ["SCH-001", PHASE.FIRST, "P0"],
  ["PLAT-001", PHASE.FIRST, "P0"],
  ["REPORT-001", PHASE.SECOND, "P1"],
];

const TASK8_OBJECT_FIELDS = new Map([
  ["PREP-OBJ-LESSON-PLAN", [
    "PREP-LESSON-F-SUBJECT",
    "PREP-LESSON-F-RUBRIC-VERSION",
    "PREP-LESSON-F-KNOWLEDGE-POINT-IDS",
    "PREP-LESSON-F-VERSION",
    "PREP-LESSON-F-STATUS",
  ]],
  ["PREP-OBJ-MATERIAL-REF", ["PREP-MATERIAL-F-REFERENCE", "PREP-MATERIAL-F-LICENSE-STATUS"]],
  ["PREP-OBJ-CLASSROOM-ACTIVITY", ["PREP-ACTIVITY-F-INSTRUCTIONS", "PREP-ACTIVITY-F-STATUS"]],
  ["PREP-OBJ-ASSIGNMENT-DRAFT", ["PREP-DRAFT-F-CONTENT", "PREP-DRAFT-F-STATUS"]],
  ["CONTENT-OBJ-QUESTION-VERSION", [
    "CONTENT-QUESTION-F-VERSION",
    "CONTENT-QUESTION-F-ANSWER",
    "CONTENT-QUESTION-F-ANALYSIS",
    "CONTENT-QUESTION-F-KNOWLEDGE-MAPPINGS",
    "CONTENT-QUESTION-F-AVAILABILITY",
  ]],
  ["CONTENT-OBJ-LICENSE", ["CONTENT-LICENSE-F-STATUS"]],
  ["CONTENT-OBJ-PERMISSION", ["CONTENT-PERMISSION-F-SCOPE"]],
  ["EXM-OBJ-EXAM-EVENT", ["EXM-EVENT-F-STATUS", "EXM-EVENT-F-PUBLICATION-AT"]],
  ["EXM-OBJ-SCORE-IMPORT", ["EXM-IMPORT-F-VALIDATION", "EXM-IMPORT-F-EVIDENCE"]],
  ["EXM-OBJ-AGGREGATE-RULE", ["EXM-RULE-F-DEFINITION", "EXM-RULE-F-VERSION"]],
  ["EXM-OBJ-SUBJECT-SCORE", ["EXM-SCORE-F-SCORE", "EXM-SCORE-F-EVIDENCE", "EXM-SCORE-F-VISIBLE-AT"]],
  ["SCH-OBJ-CALENDAR", ["SCH-CALENDAR-F-TERM", "SCH-CALENDAR-F-VERSION"]],
  ["SCH-OBJ-CONSTRAINT", ["SCH-CONSTRAINT-F-KIND", "SCH-CONSTRAINT-F-HARDNESS"]],
  ["SCH-OBJ-CONSTRAINT-SNAPSHOT", [
    "SCH-CONSTRAINT-SNAPSHOT-F-ITEMS",
    "SCH-CONSTRAINT-SNAPSHOT-F-CONSTRAINT-IDS",
    "SCH-CONSTRAINT-SNAPSHOT-F-HASH",
    "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
  ]],
  ["SCH-OBJ-CANDIDATE", ["SCH-CANDIDATE-F-HARD-CHECK", "SCH-CANDIDATE-F-STATUS"]],
  ["PLAT-OBJ-ONBOARDING-CASE", ["PLAT-CASE-F-SCHOOL", "PLAT-CASE-F-STATUS"]],
  ["PLAT-OBJ-SERVICE-PLAN", ["PLAT-PLAN-F-SERVICE-STATE", "PLAT-PLAN-F-SCHOOL-CONFIRMED-AT"]],
  ["PLAT-OBJ-POLICY-TEMPLATE", ["PLAT-POLICY-F-VERSION", "PLAT-POLICY-F-STATUS"]],
  ["PLAT-OBJ-SUPPORT-CASE", [
    "PLAT-SUPPORT-CASE-F-PURPOSE",
    "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
  ]],
]);

test("registers the six Task 8 modules with closed phase and priority", () => {
  assert.equal(modules.length, 27);
  for (const [moduleId, phase, priority] of TASK8_MODULE_CONTRACTS) {
    const module = moduleById(requirementModel, moduleId);
    assert.ok(module, moduleId);
    assert.equal(module.phase, phase, moduleId);
    assert.equal(module.priority, priority, moduleId);
  }
});

test("models the Task 8 domain objects and task-specific key fields", () => {
  const objectById = new Map(modules.flatMap((module) => (
    module.objects.map((object) => [object.id, object])
  )));
  for (const [objectId, requiredFieldIds] of TASK8_OBJECT_FIELDS) {
    const object = objectById.get(objectId);
    assert.ok(object, objectId);
    const fieldIds = new Set(object.fields.map(({ id }) => id));
    for (const fieldId of requiredFieldIds) assert.ok(fieldIds.has(fieldId), fieldId);
  }

  const assignmentDraft = moduleById(requirementModel, "PREP-001")?.actions
    .find(({ id }) => id === "PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF");
  const handoff = assignmentDraft?.handoffContract;
  const formalAction = moduleById(requirementModel, "HW-001")?.actions
    .find(({ id }) => id === handoff?.formalActionId);
  assert.equal(handoff?.formalActionId, "HW-ACT-CREATE-DRAFT");
  assert.equal(handoff?.payloadFieldId, "PREP-DRAFT-F-CONTENT");
  assert.deepEqual(handoff?.formalInputFieldIds, formalAction?.inputFieldIds);
  assert.equal(handoff?.requiredConfirmationDutyRef, "DUTY-SUBJECT-TEACHER");
  assert.equal(handoff?.effectBoundary, "DRAFT_ONLY_UNTIL_FORMAL_HW_ACTION");
});

test("closes Task 8 ownership permissions and state reachability", () => {
  const task8Modules = TASK8_MODULE_CONTRACTS
    .filter(([, phase]) => phase === PHASE.FIRST)
    .map(([moduleId]) => moduleById(requirementModel, moduleId));
  assert.equal(task8Modules.every(Boolean), true);
  for (const module of task8Modules) {
    for (const object of module.objects) {
      assert.equal(object.controlSubject, "SCHOOL", object.id);
      assert.equal(object.stateReachability.mode, "ACTION_GRAPH", object.id);
      assert.deepEqual(object.stateReachability.initialStateIds, [], object.id);
    }
    for (const action of module.actions) {
      const effects = new Set(action.permissions.map(({ effect }) => effect));
      assert.deepEqual(effects, new Set(["ALLOW", "DENY"]), action.id);
    }
  }
  assert.deepEqual(validateRequirementModel(requirementModel), []);
});

test("centralizes Task 8 selection fields and preserves Web App asymmetry", () => {
  const expectedOptionSets = new Map([
    ["PREP-LESSON-F-STATUS", "OPT-EXT-001"],
    ["PREP-MATERIAL-F-LICENSE-STATUS", "OPT-EXT-002"],
    ["CONTENT-QUESTION-F-AVAILABILITY", "OPT-EXT-003"],
    ["EXM-EVENT-F-STATUS", "OPT-EXT-004"],
    ["EXM-IMPORT-F-VALIDATION", "OPT-EXT-005"],
    ["SCH-CONSTRAINT-F-HARDNESS", "OPT-EXT-006"],
    ["SCH-CONSTRAINT-F-KIND", "OPT-EXT-017"],
    ["SCH-CANDIDATE-F-HARD-CHECK", "OPT-EXT-007"],
    ["PLAT-PLAN-F-SERVICE-STATE", "OPT-EXT-008"],
    ["PLAT-SUPPORT-CASE-F-STATUS", "OPT-EXT-009"],
  ]);
  const fieldById = new Map(modules.flatMap((module) => module.objects.flatMap((object) => (
    object.fields.map((field) => [field.id, field])
  ))));
  for (const [fieldId, optionSetId] of expectedOptionSets) {
    assert.deepEqual(fieldById.get(fieldId)?.valueSource, { kind: "OPTION_SET", optionSetId });
    assert.ok(optionSets.some(({ id }) => id === optionSetId), optionSetId);
  }

  const actionById = new Map(modules.flatMap((module) => (
    module.actions.map((action) => [action.id, action])
  )));
  assert.deepEqual(actionById.get("PREP-ACT-RECORD-CLASSROOM-ACTIVITY")?.clients, [CLIENT.APP]);
  assert.deepEqual(actionById.get("EXM-ACT-IMPORT-SCORES")?.clients, [CLIENT.WEB]);
  assert.deepEqual(actionById.get("EXM-ACT-VIEW-PUBLISHED-SCORE")?.clients, [CLIENT.WEB, CLIENT.APP]);
  assert.deepEqual(actionById.get("SCH-ACT-GENERATE-CANDIDATE")?.clients, [CLIENT.WEB]);
  assert.deepEqual(actionById.get("PLAT-ACT-CREATE-SUPPORT-CASE")?.clients, [CLIENT.WEB, CLIENT.APP]);
});

test("keeps REPORT and the three registered extensions metadata only", () => {
  const report = moduleById(requirementModel, "REPORT-001");
  assert.ok(report);
  for (const key of [
    "actions",
    "pages",
    "scenarios",
    "flows",
    "aiTasks",
    "externalLinks",
    "deliveryBehavior",
  ]) assert.deepEqual(report[key], [], `REPORT-001.${key}`);
  assert.deepEqual(report.objects[0].reuseModuleIds, ["DGV-001"]);
  assert.ok(report.objects[0].futureActors.length > 0);
  assert.ok(report.objects[0].dependencies.length > 0);
  assert.ok(report.objects[0].requiredPermissions.length > 0);
  assert.ok(report.objects[0].unresolvedProductDecisions.length > 0);

  for (const extensionId of [
    "EXT-THIRD-PARTY-NOTIFICATIONS",
    "EXT-AI-EXPLANATION-VIDEO",
    "EXT-AI-TEACHING-VIDEO",
  ]) {
    const extension = extensions.find(({ id }) => id === extensionId);
    assert.ok(extension, extensionId);
    assert.equal(extension.status, "REGISTERED_ONLY", extensionId);
    assert.equal(
      ["actions", "pages", "flows", "aiTasks", "routes", "commands"]
        .some((key) => Object.hasOwn(extension, key)),
      false,
      extensionId,
    );
  }
});

test("fails closed for Task 8 semantic boundary mutations", () => {
  const mutations = [
    ["missing Option Set", "MISSING_OPTION_SET", (model) => {
      model.optionSets = model.optionSets.filter(({ id }) => id !== "OPT-EXT-007");
    }],
    ["platform operations student detail", "INVALID_EXTENSION_PERMISSION", (model) => {
      moduleById(model, "EXM-001").actions
        .find(({ id }) => id === "EXM-ACT-VIEW-PUBLISHED-SCORE")
        .permissions.push({
          effect: "ALLOW",
          roleRef: "ROLE-PLATFORM-OPS",
          condition: "platform operations requests student score detail",
        });
    }],
    ["REPORT action", "PHASE_BOUNDARY_EXECUTABLE_PAGE", (model) => {
      moduleById(model, "REPORT-001").actions.push({ id: "REPORT-ACT-EXECUTE" });
    }],
    ["REPORT page", "PHASE_BOUNDARY_EXECUTABLE_PAGE", (model) => {
      moduleById(model, "REPORT-001").pages.push({ id: "REPORT-PAGE-DELIVERY" });
    }],
    ["REPORT flow", "PHASE_BOUNDARY_EXECUTABLE_PAGE", (model) => {
      moduleById(model, "REPORT-001").flows.push({ id: "REPORT-FLOW-DELIVER" });
    }],
    ["AI video extension action", "PHASE_BOUNDARY_EXECUTABLE_PAGE", (model) => {
      model.extensions.find(({ id }) => id === "EXT-AI-EXPLANATION-VIDEO")
        .actions = [{ id: "EXT-AI-VIDEO-ACT-GENERATE" }];
    }],
    ["unpublished student score", "INVALID_READ_POLICY", (model) => {
      moduleById(model, "EXM-001").objects
        .find(({ id }) => id === "EXM-OBJ-SUBJECT-SCORE")
        .readPolicies[0].requiredState = "IMPORTED";
    }],
    ["hard constraint bypass", "INVALID_SCHEDULE_CONSTRAINT_GATE", (model) => {
      delete moduleById(model, "SCH-001").actions
        .find(({ id }) => id === "SCH-ACT-CONFIRM-CANDIDATE").constraintGate;
    }],
    ["support access without expiry", "INVALID_PLATFORM_AUD_CONTRACT", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      delete use.accessGuard.expiresAtFieldId;
    }],
    ["support access without audit", "INVALID_PLATFORM_AUD_CONTRACT", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      use.auditMode = "NOT_REQUIRED";
      use.failureResults = use.failureResults
        .filter((resultCode) => resultCode !== "AUDIT_FAILED");
    }],
  ];

  for (const [name, errorCode, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), errorCode, name);
  }
});

test("keeps support authorization fields and use guards authoritative in AUD", () => {
  const audit = moduleById(requirementModel, "AUD-001");
  const session = audit.objects.find(({ id }) => id === "AUD-OBJ-ACCESS-SESSION");
  const authorizedOperator = session.fields
    .find(({ id }) => id === "AUD-SESSION-F-AUTHORIZED-OPERATOR-ID");
  assert.deepEqual(authorizedOperator?.sourceBinding, {
    sourceRefFieldId: "AUD-SESSION-F-REQUEST-ID",
    sourceVersionFieldId: "AUD-SESSION-F-REQUEST-VERSION",
    sourceFieldId: "AUD-REQUEST-F-REQUESTER",
  });

  const platform = moduleById(requirementModel, "PLAT-001");
  const supportCase = platform.objects
    .find(({ id }) => id === "PLAT-OBJ-SUPPORT-CASE");
  const use = platform.actions
    .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
  assert.deepEqual(supportCase?.states, ["OPEN", "CLOSED"]);
  assert.equal(platform.actions.some(({ id }) => [
    "PLAT-ACT-REQUEST-SUPPORT-ACCESS",
    "PLAT-ACT-APPROVE-SUPPORT-ACCESS",
    "PLAT-ACT-EXPIRE-SUPPORT-ACCESS",
  ].includes(id)), false);
  assert.deepEqual(use.accessGuard, {
    exceptionKind: "AUD_SESSION_STUDENT_DETAIL",
    sessionRefFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
    pinnedSessionVersionFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
    authorizedActorFieldId: "AUD-SESSION-F-AUTHORIZED-OPERATOR-ID",
    requestedScopeFieldId: "PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE",
    scopeFieldId: "AUD-SESSION-F-SCOPE",
    expiresAtFieldId: "AUD-SESSION-F-EXPIRY",
    stateFieldId: "AUD-SESSION-F-STATUS",
    requiredState: "ACTIVE",
    sourceVersionFieldId: "AUD-SESSION-F-VERSION",
    timeComparison: "CURRENT_TIME_BEFORE_EXPIRY",
    actorBinding: "CURRENT_ACTOR_EQUALS_AUTHORIZED_OPERATOR",
    scopeBinding: "REQUESTED_SCOPE_WITHIN_AUTHORIZED_SESSION_SCOPE",
    auditActionId: "AUD-ACT-APPEND-EVENT",
    auditOrdering: "BEFORE_DATA_RETURN",
  });
  assert.equal(use.risk, RISK.HIGH);
  assert.equal(use.auditMode, "REQUIRED");
  assert.deepEqual(use.failureResults, [
    "PERMISSION_DENIED",
    "NOT_FOUND",
    "ACCESS_INACTIVE",
    "ACCESS_EXPIRED",
    "ACCESS_OTHER_RECORD",
    "ACCESS_SCOPE_DENIED",
    "SOURCE_VERSION_STALE",
    "AUDIT_FAILED",
  ]);
});

test("requires a closed AUD student-detail exception guard shape", () => {
  const mutations = [
    ["unsupported exception", (guard) => {
      guard.exceptionKind = "UNSCOPED_STUDENT_DETAIL";
    }],
    ["extra guard key", (guard) => {
      guard.unboundedAccess = true;
    }],
  ];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    const use = moduleById(model, "PLAT-001").actions
      .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
    mutate(use.accessGuard);
    assertHasCode(validateRequirementModel(model), "INVALID_ACTION_CONTRACT", name);
  }
});

test("rejects support access self-approval scope expiry and audit bypass mutations", () => {
  const mutations = [
    ["restore platform self approval", (model) => {
      const platform = moduleById(model, "PLAT-001");
      const create = platform.actions
        .find(({ id }) => id === "PLAT-ACT-CREATE-SUPPORT-CASE");
      platform.actions.push({
        ...structuredClone(create),
        id: "PLAT-ACT-APPROVE-SUPPORT-ACCESS",
      });
    }],
    ["use requested access", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      use.accessGuard = { ...use.accessGuard, requiredState: "REQUESTED" };
    }],
    ["remove expiry comparison", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      use.accessGuard = { ...use.accessGuard };
      delete use.accessGuard.timeComparison;
    }],
    ["remove expiry field guard", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      use.accessGuard = { ...use.accessGuard };
      delete use.accessGuard.expiresAtFieldId;
    }],
    ["remove requested scope output", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      use.outputFieldIds = use.outputFieldIds
        .filter((fieldId) => fieldId !== "PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE");
    }],
    ["downgrade use audit", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      use.risk = RISK.READ;
      use.auditMode = "NOT_REQUIRED";
      use.failureResults = use.failureResults
        .filter((resultCode) => resultCode !== "AUDIT_FAILED");
    }],
    ["allow other support record", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      const allow = use.permissions.find(({ effect, roleRef }) => (
        effect === "ALLOW" && roleRef === "ROLE-PLATFORM-OPS"
      ));
      allow.scope = {
        kind: "OTHER_RECORD",
        subjectFieldId: "PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID",
      };
    }],
    ["malformed use input array", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      use.inputFieldIds = {};
    }],
  ];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_PLATFORM_AUD_CONTRACT", name);
  }
});

test("rejects incomplete expanded or duplicate support access failure taxonomies", () => {
  const requiredFailureResults = [
    "PERMISSION_DENIED",
    "NOT_FOUND",
    "ACCESS_INACTIVE",
    "ACCESS_EXPIRED",
    "ACCESS_OTHER_RECORD",
    "ACCESS_SCOPE_DENIED",
    "SOURCE_VERSION_STALE",
    "AUDIT_FAILED",
  ];
  for (const removedResult of requiredFailureResults) {
    const model = structuredClone(requirementModel);
    const platform = moduleById(model, "PLAT-001");
    const use = platform.actions
      .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
    use.failureResults = use.failureResults
      .filter((resultCode) => resultCode !== removedResult);
    const removedScenarioIds = new Set(platform.scenarios
      .filter(({ actionId, resultCode }) => (
        actionId === use.id && resultCode === removedResult
      ))
      .map(({ id }) => id));
    platform.scenarios = platform.scenarios.filter(({ id }) => !removedScenarioIds.has(id));
    use.scenarioIds = use.scenarioIds
      .filter((scenarioId) => !removedScenarioIds.has(scenarioId));
    assertNoCode(validateRequirementModel(model), "MISSING_ACTION_SCENARIO");
    assertHasCode(
      validateRequirementModel(model),
      "INVALID_PLATFORM_AUD_CONTRACT",
      removedResult,
    );
  }

  const expanded = structuredClone(requirementModel);
  const expandedPlatform = moduleById(expanded, "PLAT-001");
  const expandedUse = expandedPlatform.actions
    .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
  expandedUse.failureResults.push("UNDECLARED_SUPPORT_FAILURE");
  const extraScenario = {
    ...expandedPlatform.scenarios.find(({ actionId, resultCode }) => (
      actionId === expandedUse.id && resultCode === "NOT_FOUND"
    )),
    id: `${expandedUse.id}-SCN-UNDECLARED_SUPPORT_FAILURE`,
    resultCode: "UNDECLARED_SUPPORT_FAILURE",
  };
  expandedPlatform.scenarios.push(extraScenario);
  expandedUse.scenarioIds.push(extraScenario.id);
  assertNoCode(validateRequirementModel(expanded), "MISSING_ACTION_SCENARIO");
  assertHasCode(validateRequirementModel(expanded), "INVALID_PLATFORM_AUD_CONTRACT");

  const duplicated = structuredClone(requirementModel);
  const duplicatedUse = moduleById(duplicated, "PLAT-001").actions
    .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
  duplicatedUse.failureResults.push("ACCESS_EXPIRED");
  assertHasCode(validateRequirementModel(duplicated), "INVALID_PLATFORM_AUD_CONTRACT");
});

test("rejects incomplete or malformed REPORT future metadata contracts", () => {
  const requiredMetadata = [
    "futureActors",
    "dependencies",
    "requiredPermissions",
    "reuseModuleIds",
    "unresolvedProductDecisions",
  ];
  const mutations = requiredMetadata.flatMap((property) => [
    [`delete ${property}`, (model) => {
      delete moduleById(model, "REPORT-001").objects[0][property];
    }],
    [`empty ${property}`, (model) => {
      moduleById(model, "REPORT-001").objects[0][property] = [];
    }],
  ]);
  mutations.push(
    ["rename REPORT title", (model) => {
      moduleById(model, "REPORT-001").title = "Renamed Future Report";
    }],
    ["delete future contract object", (model) => {
      moduleById(model, "REPORT-001").objects = [];
    }],
    ["unknown future actor", (model) => {
      moduleById(model, "REPORT-001").objects[0].futureActors.push("ROLE-UNKNOWN");
    }],
    ["malformed future actor", (model) => {
      moduleById(model, "REPORT-001").objects[0].futureActors.push(" ");
    }],
    ["reuse without governance", (model) => {
      moduleById(model, "REPORT-001").objects[0].reuseModuleIds = ["AUD-001"];
    }],
    ["reuse unknown module", (model) => {
      moduleById(model, "REPORT-001").objects[0].reuseModuleIds = ["DGV-UNKNOWN"];
    }],
    ["duplicate dependency", (model) => {
      const object = moduleById(model, "REPORT-001").objects[0];
      object.dependencies.push(object.dependencies[0]);
    }],
    ["malformed permission", (model) => {
      moduleById(model, "REPORT-001").objects[0].requiredPermissions.push(" ");
    }],
    ["malformed dependency array", (model) => {
      moduleById(model, "REPORT-001").objects[0].dependencies = {};
    }],
    ["unexpected report metadata", (model) => {
      moduleById(model, "REPORT-001").objects[0].deliveryTarget = "external";
    }],
  );
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_REPORT_METADATA_CONTRACT", name);
  }
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

test("aggregates malformed Flow child entries without throwing", () => {
  const cases = [
    ["step provided input", "INVALID_FLOW_CONTRACT", () => {
      const model = validFixture();
      model.flows[0].steps[0].providedInputs[0] = null;
      return model;
    }],
    ["source data reference", "INVALID_FLOW_CONTRACT", () => {
      const model = validFixture();
      model.flows[0].sourceDataRefs[0] = null;
      return model;
    }],
    ["producer object field", "INVALID_ENTITY_SHAPE", () => {
      const model = structuredClone(requirementModel);
      const producerObject = moduleById(model, "PUB-001").objects
        .find(({ id }) => id === "PUB-OBJ-DEPENDENCY-SNAPSHOT");
      producerObject.fields[0] = null;
      return model;
    }],
  ];

  const failures = [];
  for (const [name, shapeCode, makeModel] of cases) {
    const model = makeModel();
    model.metrics[0].ownerRef = "ROLE-MISSING";
    let errors = [];
    try {
      errors = validateRequirementModel(model);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
      continue;
    }
    const codes = errorCodes(errors);
    if (!codes.includes(shapeCode)) failures.push(`${name}: missing ${shapeCode}`);
    if (!codes.includes("ORPHAN_OWNER_ROLE")) {
      failures.push(`${name}: validation did not continue`);
    }
  }
  assert.deepEqual(failures, []);
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
  const reportModule = moduleById(model, "REPORT-TEST");
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
  const reportModule = moduleById(model, "REPORT-TEST");
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

test("accepts authorized role confirmation for an AI write task", () => {
  const model = validFixture();
  const action = moduleById(model, "SUB-001").actions[0];
  action.permissions = action.permissions.filter(({ effect, roleRef }) => (
    effect !== "DENY" || roleRef !== "ROLE-TEACHER"
  ));
  action.permissions.push({
    effect: "DENY",
    roleRef: "ROLE-PLATFORM-OPS",
    condition: "platform operations cannot confirm the scoped AI-assisted write",
  });
  action.permissions.push({
    effect: "ALLOW",
    roleRef: "ROLE-TEACHER",
    condition: "an authorized academic or teacher role confirms the scoped AI-assisted write",
  });
  model.aiTasks.push(validAiTask("AI-TASK-01", {
    confirmerRef: "ROLE-TEACHER",
    confirmer: { mode: "ROLE", roleRef: "ROLE-TEACHER" },
  }));

  assert.deepEqual(validateRequirementModel(model), []);
});

test("accepts authorized duty confirmation for an AI write task", () => {
  const model = validFixture();
  model.duties.push({
    id: "DUTY-SUBJECT-TEACHER",
    roleId: "ROLE-TEACHER",
    label: "subject teacher",
  });
  const action = moduleById(model, "SUB-001").actions[0];
  action.permissions = action.permissions.filter(({ effect, roleRef }) => (
    effect !== "DENY" || roleRef !== "ROLE-TEACHER"
  ));
  action.permissions.push({
    effect: "DENY",
    roleRef: "ROLE-PLATFORM-OPS",
    condition: "platform operations cannot confirm the scoped AI-assisted write",
  });
  action.permissions.push({
    effect: "ALLOW",
    dutyRef: "DUTY-SUBJECT-TEACHER",
    condition: "the assigned subject teacher confirms the AI-assisted write",
  });
  model.aiTasks.push(validAiTask("AI-TASK-01"));

  assert.deepEqual(validateRequirementModel(model), []);
});

test("rejects AI confirmation by a duty not attached to a login role", () => {
  const model = validFixture();
  model.duties.push({
    id: "DUTY-ORPHAN",
    roleId: "ROLE-MISSING",
  });
  model.aiTasks.push(validAiTask("AI-TASK-01", {
    confirmerRef: "DUTY-ORPHAN",
    confirmer: { mode: "DUTY", dutyRef: "DUTY-ORPHAN" },
  }));

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
  submissionModule.actions[0].permissions = submissionModule.actions[0].permissions
    .filter(({ effect, roleRef }) => effect !== "DENY" || roleRef !== "ROLE-TEACHER");
  submissionModule.actions[0].permissions.push({
    effect: "DENY",
    roleRef: "ROLE-PLATFORM-OPS",
    condition: "platform operations cannot confirm the scoped AI-assisted write",
  });
  submissionModule.actions[0].permissions.push({
    effect: "ALLOW",
    dutyRef: "DUTY-SUBJECT-TEACHER",
    condition: "the assigned subject teacher confirms the AI-assisted write",
  });
  model.aiTasks.push(validAiTask("AI-TASK-01", {
    previewFieldIds: ["SUB-F001", "SUB-F002"],
  }));

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

test("rejects a single conversion pair without a correlation key", () => {
  const model = validFixture();
  model.metrics[0].aggregation = "conversion";

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
    if (aggregation === "conversion") {
      model.metrics[0].correlationKey = "fixtureConversionId";
    }
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
    "INVALID_FLOW_INPUT_PROVIDER DF-TEST step=1 field=SUB-F001 provider must match an ALLOW subject for the step action",
    "INVALID_FLOW_INPUT_RESOLUTION DF-TEST path=DEFAULT step=1 action=SUB-ACT-01 missing SUB-F999",
    "INVALID_FLOW_INPUT_RESOLUTION DF-TEST step=1 provided field SUB-F001 must be an input owned by the step target",
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

test("enforces the closed Task 8 required entity and capability manifest", () => {
  assertNoCode(validateRequirementModel(requirementModel), "MISSING_TASK8_CONTRACT");
  const mutations = [
    ["coordinated Task 8 deletion", (model) => {
      const task8ModuleIds = new Set([
        "PREP-001",
        "CONTENT-001",
        "EXM-001",
        "SCH-001",
        "PLAT-001",
        "REPORT-001",
      ]);
      model.modules = model.modules.filter(({ id }) => !task8ModuleIds.has(id));
      model.optionSets = model.optionSets.filter(({ id }) => !id.startsWith("OPT-EXT-"));
      model.events = model.events.filter(({ id }) => id !== "EVT-EXM-SCORE-PUBLISHED");
    }],
    ["module", (model) => {
      model.modules = model.modules.filter(({ id }) => id !== "PREP-001");
    }],
    ["object rename", (model) => {
      moduleById(model, "CONTENT-001").objects
        .find(({ id }) => id === "CONTENT-OBJ-LICENSE").id = "CONTENT-OBJ-LICENSE-RENAMED";
    }],
    ["action retarget", (model) => {
      moduleById(model, "EXM-001").actions
        .find(({ id }) => id === "EXM-ACT-IMPORT-SCORES")
        .targetObjectId = "EXM-OBJ-EXAM-EVENT";
    }],
    ["page", (model) => {
      const schedule = moduleById(model, "SCH-001");
      schedule.pages = schedule.pages.filter(({ id }) => (
        id !== "SCH-PAGE-SCHEDULE-OPERATIONS"
      ));
    }],
    ["Option Set", (model) => {
      model.optionSets = model.optionSets.filter(({ id }) => id !== "OPT-EXT-003");
    }],
    ["event", (model) => {
      model.events = model.events.filter(({ id }) => id !== "EVT-EXM-SCORE-PUBLISHED");
    }],
    ["REPORT contract kind", (model) => {
      moduleById(model, "REPORT-001").contractKind = "RENAMED_REPORT_CONTRACT";
    }],
  ];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "MISSING_TASK8_CONTRACT", name);
  }
});

test("pins question publication to active license and permission versions", () => {
  const content = moduleById(requirementModel, "CONTENT-001");
  const question = content.objects.find(({ id }) => id === "CONTENT-OBJ-QUESTION-VERSION");
  const publish = content.actions
    .find(({ id }) => id === "CONTENT-ACT-PUBLISH-QUESTION-VERSION");
  const fieldById = new Map(question.fields.map((field) => [field.id, field]));
  assert.deepEqual(fieldById.get("CONTENT-QUESTION-F-LICENSE-REF")?.valueSource, {
    kind: "OBJECT_REF",
    targetObjectId: "CONTENT-OBJ-LICENSE",
  });
  assert.deepEqual(fieldById.get("CONTENT-QUESTION-F-PERMISSION-REF")?.valueSource, {
    kind: "OBJECT_REF",
    targetObjectId: "CONTENT-OBJ-PERMISSION",
  });
  assert.deepEqual(new Set(publish.inputFieldIds), new Set([
    "CONTENT-QUESTION-F-LICENSE-REF",
    "CONTENT-QUESTION-F-LICENSE-VERSION",
    "CONTENT-QUESTION-F-PERMISSION-REF",
    "CONTENT-QUESTION-F-PERMISSION-VERSION",
  ]));
  assert.deepEqual(
    new Set(publish.relatedStateGuards.map(({ targetObjectId, requiredState }) => (
      `${targetObjectId}:${requiredState}`
    ))),
    new Set([
      "CONTENT-OBJ-LICENSE:ACTIVE",
      "CONTENT-OBJ-PERMISSION:ACTIVE",
    ]),
  );
  assert.ok(publish.failureResults.includes("LICENSE_INACTIVE"));
  assert.ok(publish.failureResults.includes("CONTENT_PERMISSION_INACTIVE"));
  assert.ok(publish.failureResults.includes("SOURCE_VERSION_STALE"));
  assert.deepEqual(
    new Set(content.relationships.map(({ fromObjectId, toObjectId }) => (
      `${fromObjectId}->${toObjectId}`
    ))),
    new Set([
      "CONTENT-OBJ-QUESTION-VERSION->CONTENT-OBJ-LICENSE",
      "CONTENT-OBJ-QUESTION-VERSION->CONTENT-OBJ-PERMISSION",
    ]),
  );
});

test("rejects fail-open content governance publication mutations", () => {
  const mutations = [
    ["delete license object", "MISSING_TASK8_CONTRACT", (model) => {
      const content = moduleById(model, "CONTENT-001");
      content.objects = content.objects.filter(({ id }) => id !== "CONTENT-OBJ-LICENSE");
    }],
    ["retarget publish", "MISSING_TASK8_CONTRACT", (model) => {
      moduleById(model, "CONTENT-001").actions
        .find(({ id }) => id === "CONTENT-ACT-PUBLISH-QUESTION-VERSION")
        .targetObjectId = "CONTENT-OBJ-LICENSE";
    }],
    ["remove license relationship", "INVALID_CONTENT_GOVERNANCE_CONTRACT", (model) => {
      const content = moduleById(model, "CONTENT-001");
      content.relationships = content.relationships.filter(({ toObjectId }) => (
        toObjectId !== "CONTENT-OBJ-LICENSE"
      ));
    }],
    ["remove permission guard", "INVALID_CONTENT_GOVERNANCE_CONTRACT", (model) => {
      const publish = moduleById(model, "CONTENT-001").actions
        .find(({ id }) => id === "CONTENT-ACT-PUBLISH-QUESTION-VERSION");
      publish.relatedStateGuards = publish.relatedStateGuards.filter(({ targetObjectId }) => (
        targetObjectId !== "CONTENT-OBJ-PERMISSION"
      ));
    }],
    ["widen publisher actor", "INVALID_CONTENT_GOVERNANCE_CONTRACT", (model) => {
      const publish = moduleById(model, "CONTENT-001").actions
        .find(({ id }) => id === "CONTENT-ACT-PUBLISH-QUESTION-VERSION");
      const allow = publish.permissions.find(({ effect }) => effect === "ALLOW");
      delete allow.dutyRef;
      allow.roleRef = "ROLE-ACADEMIC";
    }],
    ["remove inactive failure", "INVALID_CONTENT_GOVERNANCE_CONTRACT", (model) => {
      const content = moduleById(model, "CONTENT-001");
      const publish = content.actions
        .find(({ id }) => id === "CONTENT-ACT-PUBLISH-QUESTION-VERSION");
      publish.failureResults = publish.failureResults
        .filter((code) => code !== "LICENSE_INACTIVE");
      const removed = new Set(content.scenarios
        .filter(({ actionId, resultCode }) => (
          actionId === publish.id && resultCode === "LICENSE_INACTIVE"
        ))
        .map(({ id }) => id));
      content.scenarios = content.scenarios.filter(({ id }) => !removed.has(id));
      publish.scenarioIds = publish.scenarioIds.filter((id) => !removed.has(id));
    }],
  ];
  for (const [name, code, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), code, name);
  }
});

test("aligns exam import decisions and score lineage with teacher confirmation", () => {
  const exam = moduleById(requirementModel, "EXM-001");
  const score = exam.objects.find(({ id }) => id === "EXM-OBJ-SUBJECT-SCORE");
  const scoreFieldById = new Map(score.fields.map((field) => [field.id, field]));
  assert.deepEqual(
    exam.objects.find(({ id }) => id === "EXM-OBJ-SCORE-IMPORT").states,
    ["PENDING", "PASSED", "REJECTED", "ACCEPTED"],
  );
  assert.deepEqual(
    exam.actions.find(({ id }) => id === "EXM-ACT-ACCEPT-SCORE-IMPORT").transition,
    { from: "PASSED", to: "ACCEPTED" },
  );
  assert.deepEqual(scoreFieldById.get("EXM-SCORE-F-IMPORT-REF")?.valueSource, {
    kind: "OBJECT_REF",
    targetObjectId: "EXM-OBJ-SCORE-IMPORT",
  });
  const createScore = exam.actions.find(({ id }) => id === "EXM-ACT-CREATE-SUBJECT-SCORE");
  assert.ok(createScore.relatedStateGuards.some(({ targetObjectId, requiredState }) => (
    targetObjectId === "EXM-OBJ-SCORE-IMPORT" && requiredState === "ACCEPTED"
  )));
  const teacherConfirmationWriters = exam.actions.filter(({ writes, outputFieldIds }) => (
    writes === true && outputFieldIds.includes("EXM-SCORE-F-TEACHER-CONFIRMED-AT")
  ));
  assert.deepEqual(
    teacherConfirmationWriters.map(({ id }) => id),
    ["EXM-ACT-CONFIRM-SUBJECT-SCORE"],
  );
  const visibleAtWriters = exam.actions.filter(({ writes, outputFieldIds }) => (
    writes === true && outputFieldIds.includes("EXM-SCORE-F-VISIBLE-AT")
  ));
  assert.deepEqual(visibleAtWriters.map(({ id }) => id), ["EXM-ACT-PUBLISH-SUBJECT-SCORE"]);
  for (const actionId of [
    "EXM-ACT-CONFIRM-SUBJECT-SCORE",
    "EXM-ACT-REJECT-SUBJECT-SCORE",
    "EXM-ACT-REVISE-REJECTED-SUBJECT-SCORE",
  ]) assert.ok(exam.actions.some(({ id }) => id === actionId), actionId);
  const confirm = exam.actions.find(({ id }) => id === "EXM-ACT-CONFIRM-SUBJECT-SCORE");
  assert.ok(confirm.permissions.some(({ effect, dutyRef }) => (
    effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
  )));
});

test("rejects fail-open exam import lineage and teacher decision mutations", () => {
  const mutations = [
    ["accept unpassed import", "INVALID_EXAM_GOVERNANCE_CONTRACT", (model) => {
      moduleById(model, "EXM-001").actions
        .find(({ id }) => id === "EXM-ACT-ACCEPT-SCORE-IMPORT")
        .transition.from = "PENDING";
    }],
    ["retarget score creation", "MISSING_TASK8_CONTRACT", (model) => {
      moduleById(model, "EXM-001").actions
        .find(({ id }) => id === "EXM-ACT-CREATE-SUBJECT-SCORE")
        .targetObjectId = "EXM-OBJ-SCORE-IMPORT";
    }],
    ["remove score import relationship", "INVALID_EXAM_GOVERNANCE_CONTRACT", (model) => {
      const exam = moduleById(model, "EXM-001");
      exam.relationships = exam.relationships.filter(({ toObjectId }) => (
        toObjectId !== "EXM-OBJ-SCORE-IMPORT"
      ));
    }],
    ["remove passed import guard", "INVALID_EXAM_GOVERNANCE_CONTRACT", (model) => {
      delete moduleById(model, "EXM-001").actions
        .find(({ id }) => id === "EXM-ACT-CREATE-SUBJECT-SCORE").relatedStateGuards;
    }],
    ["create teacher confirmation time", "INVALID_EXAM_GOVERNANCE_CONTRACT", (model) => {
      moduleById(model, "EXM-001").actions
        .find(({ id }) => id === "EXM-ACT-CREATE-SUBJECT-SCORE")
        .outputFieldIds.push("EXM-SCORE-F-TEACHER-CONFIRMED-AT");
    }],
    ["create student visibility time", "INVALID_EXAM_GOVERNANCE_CONTRACT", (model) => {
      moduleById(model, "EXM-001").actions
        .find(({ id }) => id === "EXM-ACT-CREATE-SUBJECT-SCORE")
        .outputFieldIds.push("EXM-SCORE-F-VISIBLE-AT");
    }],
    ["widen teacher confirmation", "INVALID_EXAM_GOVERNANCE_CONTRACT", (model) => {
      const confirm = moduleById(model, "EXM-001").actions
        .find(({ id }) => id === "EXM-ACT-CONFIRM-SUBJECT-SCORE");
      const allow = confirm.permissions.find(({ effect }) => effect === "ALLOW");
      delete allow.dutyRef;
      allow.roleRef = "ROLE-ACADEMIC";
    }],
    ["delete reject path", "MISSING_TASK8_CONTRACT", (model) => {
      const exam = moduleById(model, "EXM-001");
      exam.actions = exam.actions.filter(({ id }) => id !== "EXM-ACT-REJECT-SUBJECT-SCORE");
    }],
  ];
  for (const [name, code, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), code, name);
  }
});

test("pins schedule candidates to immutable complete constraint snapshots", () => {
  const schedule = moduleById(requirementModel, "SCH-001");
  const snapshot = schedule.objects.find(({ id }) => id === "SCH-OBJ-CONSTRAINT-SNAPSHOT");
  assert.ok(snapshot);
  assert.deepEqual(snapshot.states, ["DRAFT", "ACTIVE", "REPLACED"]);
  const items = snapshot.fields
    .find(({ id }) => id === "SCH-CONSTRAINT-SNAPSHOT-F-ITEMS");
  assert.equal(items?.dataType, "JSON");
  assert.equal(items?.mutability, "IMMUTABLE");
  assert.deepEqual(items?.snapshotItemContract, {
    sourceObjectId: "SCH-OBJ-CONSTRAINT",
    sourceVersionFieldId: "SCH-CONSTRAINT-F-VERSION",
    requiredKeys: ["constraintId", "constraintVersion", "kind", "hardness"],
    groupBy: "kind",
    requiredKindCodes: [
      "TEACHER_AVAILABILITY",
      "CLASS_PERIOD",
      "COURSE_LOAD",
      "ROOM_CAPACITY",
    ],
    perKindCardinality: "EXACTLY_ONE",
  });
  const constraintIds = snapshot.fields
    .find(({ id }) => id === "SCH-CONSTRAINT-SNAPSHOT-F-CONSTRAINT-IDS");
  assert.equal(constraintIds?.dataType, "STRING_ARRAY");
  assert.equal(constraintIds?.mutability, "IMMUTABLE");
  assert.equal(constraintIds?.idempotencyRole, "FANOUT_SET");
  assert.equal(
    snapshot.fields.find(({ id }) => id === "SCH-CONSTRAINT-SNAPSHOT-F-HASH")?.mutability,
    "IMMUTABLE",
  );
  assert.equal(
    snapshot.fields.find(({ id }) => id === "SCH-CONSTRAINT-SNAPSHOT-F-VERSION")
      ?.idempotencyRole,
    "OBJECT_VERSION",
  );
  const createSnapshot = schedule.actions
    .find(({ id }) => id === "SCH-ACT-CREATE-CONSTRAINT-SNAPSHOT");
  assert.deepEqual(createSnapshot?.inputFieldIds, ["SCH-CONSTRAINT-SNAPSHOT-F-ITEMS"]);
  assert.deepEqual(createSnapshot?.outputFieldIds, [
    "SCH-CONSTRAINT-SNAPSHOT-F-ID",
    "SCH-CONSTRAINT-SNAPSHOT-F-CONSTRAINT-IDS",
    "SCH-CONSTRAINT-SNAPSHOT-F-HASH",
    "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
    "SCH-CONSTRAINT-SNAPSHOT-F-STATUS",
  ]);
  const activateSnapshot = schedule.actions
    .find(({ id }) => id === "SCH-ACT-ACTIVATE-CONSTRAINT-SNAPSHOT");
  assert.deepEqual(activateSnapshot?.transition, { from: "DRAFT", to: "ACTIVE" });
  assert.deepEqual(activateSnapshot?.outputFieldIds, [
    "SCH-CONSTRAINT-SNAPSHOT-F-STATUS",
    "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
  ]);
  const replaceSnapshot = schedule.actions
    .find(({ id }) => id === "SCH-ACT-REPLACE-CONSTRAINT-SNAPSHOT");
  assert.deepEqual(replaceSnapshot?.transition, { from: "ACTIVE", to: "REPLACED" });
  assert.deepEqual(replaceSnapshot?.outputFieldIds, [
    "SCH-CONSTRAINT-SNAPSHOT-F-STATUS",
    "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
  ]);

  const candidate = schedule.objects.find(({ id }) => id === "SCH-OBJ-CANDIDATE");
  const fieldById = new Map(candidate.fields.map((field) => [field.id, field]));
  const expectedBindings = [
    {
      refFieldId: "SCH-CANDIDATE-F-CALENDAR-REF",
      versionFieldId: "SCH-CANDIDATE-F-CALENDAR-VERSION",
      targetObjectId: "SCH-OBJ-CALENDAR",
      targetVersionFieldId: "SCH-CALENDAR-F-VERSION",
    },
    {
      refFieldId: "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF",
      versionFieldId: "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION",
      targetObjectId: "SCH-OBJ-CONSTRAINT-SNAPSHOT",
      targetVersionFieldId: "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
    },
  ];
  for (const binding of expectedBindings) {
    assert.deepEqual(fieldById.get(binding.refFieldId)?.valueSource, {
      kind: "OBJECT_REF",
      targetObjectId: binding.targetObjectId,
    });
    assert.deepEqual(fieldById.get(binding.refFieldId)?.versionBinding, {
      versionFieldId: binding.versionFieldId,
      targetVersionFieldId: binding.targetVersionFieldId,
    });
    assert.ok(candidate.lineageBindings.some((candidateBinding) => (
      JSON.stringify(candidateBinding) === JSON.stringify(binding)
    )), binding.refFieldId);
  }
  assert.deepEqual(candidate.lineageBindings, expectedBindings);
  assert.ok(schedule.actions.find(({ id }) => id === "SCH-ACT-GENERATE-CANDIDATE")
    ?.outputFieldIds.includes("SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION"));
});

test("binds schedule source producers and candidate rechecks to stale prior candidates", () => {
  const schedule = moduleById(requirementModel, "SCH-001");
  const stale = schedule.actions.find(({ id }) => id === "SCH-ACT-MARK-CANDIDATE-STALE");
  assert.equal(stale.executionMode, "SYSTEM_EVENT");
  assert.deepEqual(stale.trigger, {
    kind: "EVENT",
    eventId: "EVT-SCH-SOURCE-VERSION-CHANGED",
  });
  assert.equal(Object.hasOwn(stale, "clients"), false);
  assert.ok(stale.permissions.some(({ effect, actorRef }) => (
    effect === "ALLOW" && actorRef === "SYSTEM"
  )));
  const sourceEvent = events.find(({ id }) => id === "EVT-SCH-SOURCE-VERSION-CHANGED");
  assert.deepEqual(sourceEvent?.triggeredActionIds, ["SCH-ACT-MARK-CANDIDATE-STALE"]);
  assert.deepEqual(sourceEvent?.producerActionIds, [
    "SCH-ACT-PUBLISH-CALENDAR",
    "SCH-ACT-ACTIVATE-CONSTRAINT-SNAPSHOT",
    "SCH-ACT-REPLACE-CONSTRAINT-SNAPSHOT",
  ]);
  const expectedRecheck = {
    versionFieldIds: [
      "SCH-CANDIDATE-F-CALENDAR-VERSION",
      "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION",
    ],
    hardGate: {
      fieldId: "SCH-CANDIDATE-F-HARD-CHECK",
      requiredCode: "PASS",
    },
    softGate: {
      fieldId: "SCH-CANDIDATE-F-SOFT-CONSTRAINT-ACKNOWLEDGED",
      requiredValue: true,
    },
  };
  for (const actionId of ["SCH-ACT-CONFIRM-CANDIDATE", "SCH-ACT-PUBLISH-CANDIDATE"]) {
    const action = schedule.actions.find(({ id }) => id === actionId);
    assert.ok(action.failureResults.includes("SOURCE_VERSION_STALE"), actionId);
    assert.equal(action.relatedStateGuards.length, 2, actionId);
    assert.deepEqual(action.sourceRecheck, expectedRecheck, actionId);
  }
});

test("rejects incomplete direct or unbound schedule snapshot contracts", () => {
  const mutations = [
    ["missing snapshot kind", (model) => {
      const snapshot = moduleById(model, "SCH-001").objects
        .find(({ id }) => id === "SCH-OBJ-CONSTRAINT-SNAPSHOT");
      snapshot?.fields.find(({ id }) => id === "SCH-CONSTRAINT-SNAPSHOT-F-ITEMS")
        ?.snapshotItemContract?.requiredKindCodes.pop();
    }],
    ["duplicate snapshot kind", (model) => {
      const snapshot = moduleById(model, "SCH-001").objects
        .find(({ id }) => id === "SCH-OBJ-CONSTRAINT-SNAPSHOT");
      const kinds = snapshot?.fields
        .find(({ id }) => id === "SCH-CONSTRAINT-SNAPSHOT-F-ITEMS")
        ?.snapshotItemContract?.requiredKindCodes;
      if (kinds?.length) kinds.push(kinds[0]);
    }],
    ["missing snapshot version", (model) => {
      const snapshot = moduleById(model, "SCH-001").objects
        .find(({ id }) => id === "SCH-OBJ-CONSTRAINT-SNAPSHOT");
      if (snapshot) snapshot.fields = snapshot.fields.filter(({ id }) => (
        id !== "SCH-CONSTRAINT-SNAPSHOT-F-VERSION"
      ));
    }],
    ["missing snapshot hash", (model) => {
      const snapshot = moduleById(model, "SCH-001").objects
        .find(({ id }) => id === "SCH-OBJ-CONSTRAINT-SNAPSHOT");
      if (snapshot) snapshot.fields = snapshot.fields.filter(({ id }) => (
        id !== "SCH-CONSTRAINT-SNAPSHOT-F-HASH"
      ));
    }],
    ["candidate pins a direct constraint", (model) => {
      const ref = moduleById(model, "SCH-001").objects
        .find(({ id }) => id === "SCH-OBJ-CANDIDATE")?.fields
        .find(({ id }) => id === "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF");
      if (ref) {
        ref.valueSource.targetObjectId = "SCH-OBJ-CONSTRAINT";
        ref.versionBinding.targetVersionFieldId = "SCH-CONSTRAINT-F-VERSION";
      }
    }],
    ["missing source producer", (model) => {
      const event = model.events.find(({ id }) => id === "EVT-SCH-SOURCE-VERSION-CHANGED");
      if (event?.producerActionIds) event.producerActionIds = event.producerActionIds.slice(1);
    }],
    ["wrong source producer", (model) => {
      const event = model.events.find(({ id }) => id === "EVT-SCH-SOURCE-VERSION-CHANGED");
      if (event) event.producerActionIds = ["SCH-ACT-CREATE-CALENDAR"];
    }],
    ["confirm omits snapshot guard", (model) => {
      const confirm = moduleById(model, "SCH-001").actions
        .find(({ id }) => id === "SCH-ACT-CONFIRM-CANDIDATE");
      confirm.relatedStateGuards = confirm.relatedStateGuards.filter(({ targetObjectId }) => (
        targetObjectId !== "SCH-OBJ-CONSTRAINT-SNAPSHOT"
      ));
    }],
    ["publish omits snapshot guard", (model) => {
      const publish = moduleById(model, "SCH-001").actions
        .find(({ id }) => id === "SCH-ACT-PUBLISH-CANDIDATE");
      publish.relatedStateGuards = publish.relatedStateGuards.filter(({ targetObjectId }) => (
        targetObjectId !== "SCH-OBJ-CONSTRAINT-SNAPSHOT"
      ));
    }],
  ];
  const undetected = [];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    const errors = validateRequirementModel(model);
    if (!errors.some((error) => error.startsWith("INVALID_SCHEDULE_SOURCE_CONTRACT"))) {
      undetected.push(name);
    }
  }
  assert.deepEqual(undetected, []);
});

test("pins generated assignment drafts to confirmed lesson versions and exact HW inputs", () => {
  const preparation = moduleById(requirementModel, "PREP-001");
  const draft = preparation.objects.find(({ id }) => id === "PREP-OBJ-ASSIGNMENT-DRAFT");
  const lessonRef = draft.fields.find(({ id }) => id === "PREP-DRAFT-F-SOURCE-LESSON-REF");
  assert.deepEqual(lessonRef?.valueSource, {
    kind: "OBJECT_REF",
    targetObjectId: "PREP-OBJ-LESSON-PLAN",
  });
  assert.deepEqual(lessonRef?.versionBinding, {
    versionFieldId: "PREP-DRAFT-F-SOURCE-LESSON-VERSION",
    targetVersionFieldId: "PREP-LESSON-F-VERSION",
  });
  const generate = preparation.actions
    .find(({ id }) => id === "PREP-ACT-GENERATE-ASSIGNMENT-DRAFT");
  assert.ok(generate.relatedStateGuards.some(({ targetObjectId, requiredState }) => (
    targetObjectId === "PREP-OBJ-LESSON-PLAN" && requiredState === "CONFIRMED"
  )));
  const confirm = preparation.actions
    .find(({ id }) => id === "PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF");
  const formalAction = moduleById(requirementModel, "HW-001").actions
    .find(({ id }) => id === confirm.handoffContract.formalActionId);
  assert.deepEqual(
    confirm.handoffContract.formalInputFieldIds,
    formalAction.inputFieldIds,
  );
  assert.equal(confirm.handoffContract.payloadFieldId, "PREP-DRAFT-F-CONTENT");
});

test("rejects fail-open schedule and preparation lineage mutations", () => {
  const mutations = [
    ["remove schedule lineage", "INVALID_SCHEDULE_SOURCE_CONTRACT", (model) => {
      moduleById(model, "SCH-001").objects
        .find(({ id }) => id === "SCH-OBJ-CANDIDATE").lineageBindings = [];
    }],
    ["make stale user driven", "INVALID_SCHEDULE_SOURCE_CONTRACT", (model) => {
      const stale = moduleById(model, "SCH-001").actions
        .find(({ id }) => id === "SCH-ACT-MARK-CANDIDATE-STALE");
      stale.executionMode = "USER_TASK";
    }],
    ["remove publish stale failure", "INVALID_SCHEDULE_SOURCE_CONTRACT", (model) => {
      const publish = moduleById(model, "SCH-001").actions
        .find(({ id }) => id === "SCH-ACT-PUBLISH-CANDIDATE");
      publish.failureResults = publish.failureResults
        .filter((code) => code !== "SOURCE_VERSION_STALE");
    }],
    ["remove kind-specific payload", "INVALID_SCHEDULE_SOURCE_CONTRACT", (model) => {
      const constraint = moduleById(model, "SCH-001").objects
        .find(({ id }) => id === "SCH-OBJ-CONSTRAINT");
      constraint.fields = constraint.fields.filter(({ id }) => (
        id !== "SCH-CONSTRAINT-F-ROOM-CAPACITY-RULES"
      ));
    }],
    ["misbind constraint kind", "INVALID_SCHEDULE_SOURCE_CONTRACT", (model) => {
      moduleById(model, "SCH-001").actions
        .find(({ id }) => id === "SCH-ACT-CREATE-ROOM-CAPACITY-CONSTRAINT")
        .acceptedInputValues[0].codes = ["COURSE_LOAD"];
    }],
    ["remove confirmed lesson guard", "INVALID_PREPARATION_HANDOFF_CONTRACT", (model) => {
      delete moduleById(model, "PREP-001").actions
        .find(({ id }) => id === "PREP-ACT-GENERATE-ASSIGNMENT-DRAFT")
        .relatedStateGuards;
    }],
    ["drop formal HW input", "INVALID_PREPARATION_HANDOFF_CONTRACT", (model) => {
      moduleById(model, "PREP-001").actions
        .find(({ id }) => id === "PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF")
        .handoffContract.formalInputFieldIds = [];
    }],
  ];
  for (const [name, code, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), code, name);
  }
});

test("pins PLAT support cases and use to active versioned AUD sessions", () => {
  const audit = moduleById(requirementModel, "AUD-001");
  const request = audit.objects.find(({ id }) => id === "AUD-OBJ-ACCESS-REQUEST");
  const session = audit.objects.find(({ id }) => id === "AUD-OBJ-ACCESS-SESSION");
  assert.equal(
    request.fields.find(({ id }) => id === "AUD-REQUEST-F-VERSION")?.idempotencyRole,
    "OBJECT_VERSION",
  );
  assert.equal(
    session.fields.find(({ id }) => id === "AUD-SESSION-F-VERSION")?.idempotencyRole,
    "OBJECT_VERSION",
  );
  assert.deepEqual(
    session.fields.find(({ id }) => id === "AUD-SESSION-F-REQUEST-ID")?.versionBinding,
    {
      versionFieldId: "AUD-SESSION-F-REQUEST-VERSION",
      targetVersionFieldId: "AUD-REQUEST-F-VERSION",
    },
  );
  const openSession = audit.actions.find(({ id }) => id === "AUD-ACT-OPEN-SESSION");
  assert.ok(openSession.inputFieldIds.includes("AUD-SESSION-F-REQUEST-VERSION"));
  assert.ok(openSession.outputFieldIds.includes("AUD-SESSION-F-VERSION"));
  assert.ok(openSession.outputFieldIds.includes("AUD-SESSION-F-AUTHORIZED-OPERATOR-ID"));
  assert.ok(openSession.relatedStateGuards.some(({ targetObjectId, requiredState }) => (
    targetObjectId === "AUD-OBJ-ACCESS-REQUEST" && requiredState === "APPROVED"
  )));

  const platform = moduleById(requirementModel, "PLAT-001");
  const support = platform.objects.find(({ id }) => id === "PLAT-OBJ-SUPPORT-CASE");
  const sessionRef = support.fields
    .find(({ id }) => id === "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF");
  assert.deepEqual(sessionRef?.valueSource, {
    kind: "OBJECT_REF",
    targetObjectId: "AUD-OBJ-ACCESS-SESSION",
  });
  assert.deepEqual(sessionRef?.versionBinding, {
    versionFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
    targetVersionFieldId: "AUD-SESSION-F-VERSION",
  });
  assert.deepEqual(support.lineageBindings, [{
    refFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
    versionFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
    targetObjectId: "AUD-OBJ-ACCESS-SESSION",
    targetVersionFieldId: "AUD-SESSION-F-VERSION",
  }]);
  const caseActionIds = platform.actions
    .filter(({ targetObjectId }) => targetObjectId === "PLAT-OBJ-SUPPORT-CASE")
    .map(({ id }) => id);
  assert.deepEqual(caseActionIds, [
    "PLAT-ACT-CREATE-SUPPORT-CASE",
    "PLAT-ACT-CLOSE-SUPPORT-CASE",
    "PLAT-ACT-USE-SUPPORT-ACCESS",
  ]);
  for (const actionId of ["PLAT-ACT-CREATE-SUPPORT-CASE", "PLAT-ACT-USE-SUPPORT-ACCESS"]) {
    const action = platform.actions.find(({ id }) => id === actionId);
    assert.ok(action.relatedStateGuards.some(({ targetObjectId, requiredState }) => (
      targetObjectId === "AUD-OBJ-ACCESS-SESSION" && requiredState === "ACTIVE"
    )), actionId);
  }
});

test("rejects duplicated PLAT authorization and fail-open AUD session use", () => {
  const accessGuardKeys = [
    "exceptionKind",
    "sessionRefFieldId",
    "pinnedSessionVersionFieldId",
    "authorizedActorFieldId",
    "requestedScopeFieldId",
    "scopeFieldId",
    "expiresAtFieldId",
    "stateFieldId",
    "requiredState",
    "sourceVersionFieldId",
    "timeComparison",
    "actorBinding",
    "scopeBinding",
    "auditActionId",
    "auditOrdering",
  ];
  const mutations = [
    ...[
      "PLAT-ACT-REQUEST-SUPPORT-ACCESS",
      "PLAT-ACT-APPROVE-SUPPORT-ACCESS",
    ].map((legacyActionId) => [`restore ${legacyActionId}`, (model) => {
      const platform = moduleById(model, "PLAT-001");
      if (!platform.actions.some(({ id }) => id === legacyActionId)) {
        const template = platform.actions
          .find(({ id }) => id === "PLAT-ACT-CREATE-SUPPORT-CASE");
        platform.actions.push({ ...structuredClone(template), id: legacyActionId });
      }
    }]),
    ["remove AUD authorized operator", (model) => {
      const session = moduleById(model, "AUD-001").objects
        .find(({ id }) => id === "AUD-OBJ-ACCESS-SESSION");
      session.fields = session.fields.filter(({ id }) => (
        id !== "AUD-SESSION-F-AUTHORIZED-OPERATOR-ID"
      ));
    }],
    ["derive AUD operator from non-requester", (model) => {
      const operator = moduleById(model, "AUD-001").objects
        .find(({ id }) => id === "AUD-OBJ-ACCESS-SESSION")?.fields
        .find(({ id }) => id === "AUD-SESSION-F-AUTHORIZED-OPERATOR-ID");
      if (operator?.sourceBinding) operator.sourceBinding.sourceFieldId = "AUD-REQUEST-F-SCOPE";
    }],
    ...accessGuardKeys.map((key) => [`remove use guard ${key}`, (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      delete use.accessGuard?.[key];
    }]),
    ["audit after data return", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      if (use.accessGuard) use.accessGuard.auditOrdering = "AFTER_DATA_RETURN";
    }],
    ["missing canonical failure", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      use.failureResults = use.failureResults.filter((code) => code !== "ACCESS_EXPIRED");
    }],
    ["extra synonymous failure", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      use.failureResults.push("ACCESS_NOT_ACTIVE");
    }],
    ["duplicate canonical failure", (model) => {
      const use = moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS");
      use.failureResults.push("ACCESS_EXPIRED");
    }],
  ];
  const undetected = [];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    const errors = validateRequirementModel(model);
    if (!errors.some((error) => error.startsWith("INVALID_PLATFORM_AUD_CONTRACT"))) {
      undetected.push(name);
    }
  }
  assert.deepEqual(undetected, []);
});

test("rejects fail-open PLAT AUD lineage and lifecycle mutations", () => {
  const mutations = [
    ["remove AUD request version", (model) => {
      const request = moduleById(model, "AUD-001").objects
        .find(({ id }) => id === "AUD-OBJ-ACCESS-REQUEST");
      request.fields = request.fields.filter(({ id }) => id !== "AUD-REQUEST-F-VERSION");
    }],
    ["retarget PLAT session", (model) => {
      const ref = moduleById(model, "PLAT-001").objects
        .find(({ id }) => id === "PLAT-OBJ-SUPPORT-CASE").fields
        .find(({ id }) => id === "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF");
      if (ref) ref.valueSource.targetObjectId = "AUD-OBJ-ACCESS-REQUEST";
    }],
    ["remove use session guard", (model) => {
      delete moduleById(model, "PLAT-001").actions
        .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS")
        .relatedStateGuards;
    }],
    ["misderive projected operator", (model) => {
      const operator = moduleById(model, "PLAT-001").objects
        .find(({ id }) => id === "PLAT-OBJ-SUPPORT-CASE").fields
        .find(({ id }) => id === "PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID");
      if (operator?.sourceBinding) {
        operator.sourceBinding.sourceFieldId = "AUD-SESSION-F-SCOPE";
      }
    }],
  ];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_PLATFORM_AUD_CONTRACT", name);
  }
});

const TASK8_BUSINESS_FAILURES = new Map([
  ["CONTENT-ACT-PUBLISH-QUESTION-VERSION", [
    "LICENSE_INACTIVE",
    "CONTENT_PERMISSION_INACTIVE",
  ]],
  ["EXM-ACT-VALIDATE-SCORE-IMPORT", ["IMPORT_REJECTED"]],
  ["EXM-ACT-ACCEPT-SCORE-IMPORT", ["IMPORT_REJECTED"]],
  ["EXM-ACT-CREATE-SUBJECT-SCORE", ["IMPORT_REJECTED"]],
  ["EXM-ACT-CONFIRM-SUBJECT-SCORE", ["SCORE_REJECTED"]],
  ["EXM-ACT-PUBLISH-SUBJECT-SCORE", [
    "SCORE_REJECTED",
    "TEACHER_CONFIRMATION_REQUIRED",
  ]],
  ["EXM-ACT-VIEW-PUBLISHED-SCORE", [
    "RESULT_NOT_PUBLISHED",
    "RESULT_NOT_VISIBLE",
  ]],
  ["SCH-ACT-GENERATE-CANDIDATE", ["SOURCE_VERSION_STALE"]],
  ["SCH-ACT-CONFIRM-CANDIDATE", [
    "HARD_CONSTRAINT_FAILED",
    "SOURCE_VERSION_STALE",
  ]],
  ["SCH-ACT-PUBLISH-CANDIDATE", ["SOURCE_VERSION_STALE"]],
  ["PREP-ACT-GENERATE-ASSIGNMENT-DRAFT", ["LESSON_STALE"]],
  ["PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF", [
    "LESSON_STALE",
    "HANDOFF_INCOMPLETE",
  ]],
  ["PLAT-ACT-CREATE-SUPPORT-CASE", [
    "ACCESS_INACTIVE",
    "ACCESS_EXPIRED",
    "ACCESS_OTHER_RECORD",
    "ACCESS_SCOPE_DENIED",
  ]],
  ["PLAT-ACT-USE-SUPPORT-ACCESS", [
    "ACCESS_INACTIVE",
    "ACCESS_EXPIRED",
    "ACCESS_OTHER_RECORD",
    "ACCESS_SCOPE_DENIED",
    "AUDIT_FAILED",
  ]],
]);

test("declares action-specific Task 8 business failure taxonomies", () => {
  const actionById = new Map(modules.flatMap((module) => (
    module.actions.map((action) => [action.id, action])
  )));
  for (const [actionId, requiredCodes] of TASK8_BUSINESS_FAILURES) {
    const action = actionById.get(actionId);
    assert.ok(action, actionId);
    for (const code of requiredCodes) {
      assert.ok(action.failureResults.includes(code), `${actionId}:${code}`);
    }
  }
});

test("rejects generic substitution for Task 8 business failures", () => {
  for (const [actionId, requiredCodes] of TASK8_BUSINESS_FAILURES) {
    for (const code of requiredCodes) {
      const model = structuredClone(requirementModel);
      const module = model.modules.find(({ actions }) => (
        actions.some(({ id }) => id === actionId)
      ));
      const action = module.actions.find(({ id }) => id === actionId);
      action.failureResults = action.failureResults.filter((value) => value !== code);
      const removedScenarioIds = new Set(module.scenarios
        .filter(({ actionId: scenarioActionId, resultCode }) => (
          scenarioActionId === actionId && resultCode === code
        ))
        .map(({ id }) => id));
      module.scenarios = module.scenarios.filter(({ id }) => !removedScenarioIds.has(id));
      action.scenarioIds = action.scenarioIds.filter((id) => !removedScenarioIds.has(id));
      if (!action.failureResults.includes("VALIDATION_FAILED")) {
        action.failureResults.push("VALIDATION_FAILED");
        const scenarioId = `${actionId}-SCN-VALIDATION_FAILED`;
        action.scenarioIds.push(scenarioId);
        module.scenarios.push({
          id: scenarioId,
          kind: "FAILURE",
          resultCode: "VALIDATION_FAILED",
          actionId,
          given: "generic validation fails",
          when: "the actor invokes the action",
          then: {
            expectedData: "generic validation failure",
            expectedState: { mode: "UNCHANGED" },
            expectedPermission: "DENY",
            expectedVisibility: "no data outside the authorized scope",
          },
          ...(action.executionMode === "USER_TASK"
            ? { pageId: module.pages.find(({ actionIds }) => actionIds.includes(actionId))?.id }
            : { trigger: structuredClone(action.trigger) }),
        });
      }
      assertHasCode(
        validateRequirementModel(model),
        "INVALID_TASK8_BUSINESS_FAILURE_CONTRACT",
        `${actionId}:${code}`,
      );
    }
  }
});

test("returns stable business errors for malformed failure result collections", () => {
  const malformedValues = [null, 42, "ACCESS_INACTIVE", { code: "ACCESS_INACTIVE" }];
  for (const malformed of malformedValues) {
    const model = structuredClone(requirementModel);
    moduleById(model, "PLAT-001").actions
      .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS")
      .failureResults = malformed;
    let errors;
    assert.doesNotThrow(() => { errors = validateRequirementModel(model); });
    assertHasCode(errors, "INVALID_TASK8_BUSINESS_FAILURE_CONTRACT");
    assert.deepEqual(errors, validateRequirementModel(model));
  }
  for (const malformed of malformedValues) {
    const model = structuredClone(requirementModel);
    moduleById(model, "PLAT-001").actions
      .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS")
      .failureSemantics = malformed;
    let errors;
    assert.doesNotThrow(() => { errors = validateRequirementModel(model); });
    assertHasCode(errors, "INVALID_TASK8_BUSINESS_FAILURE_CONTRACT");
    assert.deepEqual(errors, validateRequirementModel(model));
  }
});

test("does not throw on malformed nested Task 8 governance contracts", () => {
  const mutations = [
    ["INVALID_CONTENT_GOVERNANCE_CONTRACT", (model) => {
      moduleById(model, "CONTENT-001").objects
        .find(({ id }) => id === "CONTENT-OBJ-QUESTION-VERSION")
        .lineageBindings = { invalid: true };
    }],
    ["INVALID_EXAM_GOVERNANCE_CONTRACT", (model) => {
      moduleById(model, "EXM-001").objects
        .find(({ id }) => id === "EXM-OBJ-SCORE-IMPORT").states = null;
    }],
    ["INVALID_SCHEDULE_SOURCE_CONTRACT", (model) => {
      moduleById(model, "SCH-001").objects
        .find(({ id }) => id === "SCH-OBJ-CONSTRAINT").exclusiveSourceGroups = [null, 7];
    }],
    ["INVALID_PREPARATION_HANDOFF_CONTRACT", (model) => {
      moduleById(model, "PREP-001").actions
        .find(({ id }) => id === "PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF")
        .handoffContract = "invalid";
    }],
    ["INVALID_PLATFORM_AUD_CONTRACT", (model) => {
      moduleById(model, "PLAT-001").objects
        .find(({ id }) => id === "PLAT-OBJ-SUPPORT-CASE")
        .states = { invalid: true };
    }],
  ];
  for (const [code, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    let errors;
    assert.doesNotThrow(() => { errors = validateRequirementModel(model); }, code);
    assertHasCode(errors, code);
  }
});

test("keeps the Zhixu Task 8 profile mandatory after coordinated contract deletion", () => {
  const model = structuredClone(requirementModel);
  const task8ModuleIds = new Set([
    "PREP-001",
    "CONTENT-001",
    "EXM-001",
    "SCH-001",
    "PLAT-001",
    "REPORT-001",
  ]);
  model.modules = model.modules.filter(({ id }) => !task8ModuleIds.has(id));
  model.optionSets = model.optionSets.filter(({ id }) => !id.startsWith("OPT-EXT-"));
  model.events = model.events.filter(({ id }) => ![
    "EVT-EXM-SCORE-PUBLISHED",
    "EVT-SCH-SOURCE-VERSION-CHANGED",
  ].includes(id));
  model.baselineDecisions = model.baselineDecisions.filter(({ id }) => ![
    "BASE-001",
    "BASE-010",
  ].includes(id));
  for (const module of model.modules) {
    module.baselineDecisionIds = module.baselineDecisionIds.filter((id) => ![
      "BASE-001",
      "BASE-010",
    ].includes(id));
  }
  assertHasCode(validateRequirementModel(model), "MISSING_TASK8_CONTRACT");

  model.profile = "GENERIC";
  assertHasCode(validateRequirementModel(model), "INVALID_MODEL_PROFILE");
  assertHasCode(validateRequirementModel(model), "MISSING_TASK8_CONTRACT");
});

test("returns a stable model profile error for malformed profile values", () => {
  const model = structuredClone(requirementModel);
  model.profile = { value: "ZHIXU_V2" };
  let errors;
  assert.doesNotThrow(() => { errors = validateRequirementModel(model); });
  assertHasCode(errors, "INVALID_MODEL_PROFILE");
});

test("returns explicit specialized errors when Task 8 prerequisites are missing", () => {
  const expectations = [
    ["CONTENT-001", "INVALID_CONTENT_GOVERNANCE_CONTRACT"],
    ["EXM-001", "INVALID_EXAM_GOVERNANCE_CONTRACT"],
    ["SCH-001", "INVALID_SCHEDULE_SOURCE_CONTRACT"],
    ["PREP-001", "INVALID_PREPARATION_HANDOFF_CONTRACT"],
    ["PLAT-001", "INVALID_PLATFORM_AUD_CONTRACT"],
  ];
  for (const [moduleId, code] of expectations) {
    const model = structuredClone(requirementModel);
    model.modules = model.modules.filter(({ id }) => id !== moduleId);
    assertHasCode(validateRequirementModel(model), code, moduleId);
  }
});

test("requires ACCEPTED score imports before subject score creation", () => {
  const exam = moduleById(requirementModel, "EXM-001");
  const accept = exam.actions.find(({ id }) => id === "EXM-ACT-ACCEPT-SCORE-IMPORT");
  const createScore = exam.actions.find(({ id }) => id === "EXM-ACT-CREATE-SUBJECT-SCORE");
  assert.deepEqual(accept.transition, { from: "PASSED", to: "ACCEPTED" });
  assert.ok(createScore.relatedStateGuards.some(({ targetObjectId, requiredState }) => (
    targetObjectId === "EXM-OBJ-SCORE-IMPORT" && requiredState === "ACCEPTED"
  )));

  const model = structuredClone(requirementModel);
  moduleById(model, "EXM-001").actions
    .find(({ id }) => id === "EXM-ACT-CREATE-SUBJECT-SCORE")
    .relatedStateGuards[0].requiredState = "PASSED";
  assertHasCode(validateRequirementModel(model), "INVALID_EXAM_GOVERNANCE_CONTRACT");
});

test("models closed school subject and course content grants with context coverage", () => {
  const content = moduleById(requirementModel, "CONTENT-001");
  const grant = content.objects.find(({ id }) => id === "CONTENT-OBJ-PERMISSION");
  const payloads = new Map([
    ["SCHOOL", "CONTENT-PERMISSION-F-SCHOOL-ID"],
    ["SUBJECT", "CONTENT-PERMISSION-F-SUBJECT-ID"],
    ["COURSE", "CONTENT-PERMISSION-F-COURSE-ID"],
  ]);
  assert.deepEqual(
    new Set((grant.exclusiveSourceGroups ?? []).map(({ id }) => id)),
    new Set(payloads.keys()),
  );
  for (const [scopeCode, payloadFieldId] of payloads) {
    const action = content.actions.find(({ acceptedInputValues }) => (
      acceptedInputValues?.[0]?.codes?.[0] === scopeCode
    ));
    assert.ok(action, scopeCode);
    assert.deepEqual(action.inputFieldIds, [
      "CONTENT-PERMISSION-F-SCOPE",
      payloadFieldId,
      "CONTENT-PERMISSION-F-GRANTEE-ID",
      "CONTENT-PERMISSION-F-EFFECTIVE-AT",
      "CONTENT-PERMISSION-F-EXPIRES-AT",
    ]);
  }
  for (const fieldId of [
    "CONTENT-PERMISSION-F-GRANTEE-ID",
    "CONTENT-PERMISSION-F-EFFECTIVE-AT",
    "CONTENT-PERMISSION-F-EXPIRES-AT",
  ]) assert.ok(grant.fields.some(({ id }) => id === fieldId), fieldId);

  const publish = content.actions
    .find(({ id }) => id === "CONTENT-ACT-PUBLISH-QUESTION-VERSION");
  assert.deepEqual(publish.permissionCoverage, {
    grantRefFieldId: "CONTENT-QUESTION-F-PERMISSION-REF",
    grantScopeFieldId: "CONTENT-PERMISSION-F-SCOPE",
    contentContextFieldIds: {
      schoolId: "CONTENT-QUESTION-F-SCHOOL-ID",
      subjectId: "CONTENT-QUESTION-F-SUBJECT-ID",
      courseId: "CONTENT-QUESTION-F-COURSE-ID",
    },
    grantContextFieldIds: {
      schoolId: "CONTENT-PERMISSION-F-SCHOOL-ID",
      subjectId: "CONTENT-PERMISSION-F-SUBJECT-ID",
      courseId: "CONTENT-PERMISSION-F-COURSE-ID",
    },
    granteeFieldId: "CONTENT-PERMISSION-F-GRANTEE-ID",
    effectiveAtFieldId: "CONTENT-PERMISSION-F-EFFECTIVE-AT",
    expiresAtFieldId: "CONTENT-PERMISSION-F-EXPIRES-AT",
    predicate: "ACTIVE_GRANT_COVERS_CONTENT_CONTEXT_AND_CURRENT_TIME",
  });
});

test("rejects fail-open content grant payload and coverage mutations", () => {
  const mutations = [
    ["remove course payload", (model) => {
      const grant = moduleById(model, "CONTENT-001").objects
        .find(({ id }) => id === "CONTENT-OBJ-PERMISSION");
      grant.fields = grant.fields.filter(({ id }) => id !== "CONTENT-PERMISSION-F-COURSE-ID");
    }],
    ["mispartition subject grant", (model) => {
      const action = moduleById(model, "CONTENT-001").actions
        .find(({ id }) => id === "CONTENT-ACT-CREATE-SUBJECT-PERMISSION");
      if (action) action.acceptedInputValues[0].codes = ["SCHOOL"];
    }],
    ["remove publication coverage", (model) => {
      delete moduleById(model, "CONTENT-001").actions
        .find(({ id }) => id === "CONTENT-ACT-PUBLISH-QUESTION-VERSION")
        .permissionCoverage;
    }],
  ];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(validateRequirementModel(model), "INVALID_CONTENT_GOVERNANCE_CONTRACT", name);
  }
});

test("writes Task 8 phase fields only at their semantic stages", () => {
  const expectedWriters = new Map([
    ["PREP-ACTIVITY-F-EVIDENCE", ["PREP-ACT-RECORD-CLASSROOM-ACTIVITY"]],
    ["EXM-EVENT-F-PUBLICATION-AT", ["EXM-ACT-PUBLISH-EVENT"]],
    ["PLAT-PLAN-F-SCHOOL-CONFIRMED-AT", ["PLAT-ACT-CONFIRM-SERVICE-PLAN"]],
  ]);
  const actions = modules.flatMap((module) => module.actions);
  for (const [fieldId, expectedActionIds] of expectedWriters) {
    const writers = actions.filter(({ writes, outputFieldIds }) => (
      writes === true && outputFieldIds.includes(fieldId)
    ));
    assert.deepEqual(writers.map(({ id }) => id), expectedActionIds, fieldId);
  }
});

test("rejects early Task 8 phase-field writers", () => {
  const mutations = [
    ["PREP-ACT-PLAN-CLASSROOM-ACTIVITY", "PREP-ACTIVITY-F-EVIDENCE"],
    ["EXM-ACT-CREATE-EVENT", "EXM-EVENT-F-PUBLICATION-AT"],
    ["PLAT-ACT-CREATE-SERVICE-PLAN", "PLAT-PLAN-F-SCHOOL-CONFIRMED-AT"],
  ];
  for (const [actionId, fieldId] of mutations) {
    const model = structuredClone(requirementModel);
    const action = model.modules.flatMap((module) => module.actions)
      .find(({ id }) => id === actionId);
    if (!action.outputFieldIds.includes(fieldId)) action.outputFieldIds.push(fieldId);
    assertHasCode(
      validateRequirementModel(model),
      "INVALID_TASK8_PHASE_FIELD_CONTRACT",
      actionId,
    );
  }
});

test("maps every formal HW draft input exactly once through a closed PREP handoff", () => {
  const prep = moduleById(requirementModel, "PREP-001");
  const formal = moduleById(requirementModel, "HW-001").actions
    .find(({ id }) => id === "HW-ACT-CREATE-DRAFT");
  const confirm = prep.actions
    .find(({ id }) => id === "PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF");
  assert.ok(confirm);
  const contract = confirm.handoffContract;
  assert.equal(contract.formalActionId, formal.id);
  assert.equal(contract.payloadFieldId, "PREP-DRAFT-F-CONTENT");
  assert.deepEqual(contract.formalInputFieldIds, formal.inputFieldIds);
  assert.equal(new Set(contract.formalInputFieldIds).size, formal.inputFieldIds.length);
  assert.equal(contract.fieldBindings.length, formal.inputFieldIds.length);
  assert.deepEqual(
    contract.fieldBindings.map(({ targetFieldId }) => targetFieldId),
    formal.inputFieldIds,
  );
  assert.equal(new Set(contract.fieldBindings.map(({ targetFieldId }) => targetFieldId)).size, 15);
  assert.deepEqual(new Set(contract.fieldBindings.map(({ sourceKind }) => sourceKind)), new Set([
    "LESSON_FIELD",
    "GENERATED_PAYLOAD",
    "POLICY_DEFAULT",
    "TEACHER_REQUIRED",
  ]));
  const lessonSources = new Set(contract.fieldBindings
    .filter(({ sourceKind }) => sourceKind === "LESSON_FIELD")
    .map(({ sourceFieldId }) => sourceFieldId));
  assert.deepEqual(lessonSources, new Set([
    "PREP-LESSON-F-TITLE",
    "PREP-LESSON-F-SUBJECT",
    "PREP-LESSON-F-COURSE",
    "PREP-LESSON-F-RUBRIC-VERSION",
    "PREP-LESSON-F-KNOWLEDGE-POINT-IDS",
  ]));
  const payload = prep.objects.find(({ id }) => id === "PREP-OBJ-ASSIGNMENT-DRAFT")
    .fields.find(({ id }) => id === "PREP-DRAFT-F-CONTENT");
  assert.equal(payload.handoffPayloadSchema.additionalProperties, false);
  const payloadPaths = new Set(Object.keys(payload.handoffPayloadSchema.properties));
  const boundPayloadPaths = new Set(contract.fieldBindings
    .filter(({ sourceKind }) => ["GENERATED_PAYLOAD", "TEACHER_REQUIRED"].includes(sourceKind))
    .map(({ payloadPath }) => payloadPath));
  assert.deepEqual(payloadPaths, boundPayloadPaths);
  assert.deepEqual(contract.completionRule, {
    failureResult: "HANDOFF_INCOMPLETE",
    requiredBindingCount: 15,
    requireAllTeacherInputs: true,
    rejectUnknownPayloadFields: true,
  });
  assert.equal(contract.requiredConfirmationDutyRef, "DUTY-SUBJECT-TEACHER");
  assert.equal(contract.effectBoundary, "DRAFT_ONLY_UNTIL_FORMAL_HW_ACTION");
});

test("rejects incomplete duplicate or source-free PREP handoff mappings", () => {
  const mutations = [
    ["duplicate formal input", (contract) => {
      contract.formalInputFieldIds.push(contract.formalInputFieldIds[0]);
    }],
    ["duplicate target binding", (contract) => {
      contract.fieldBindings.push(structuredClone(contract.fieldBindings[0]));
    }],
    ["drop target binding", (contract) => {
      contract.fieldBindings.pop();
    }],
    ["wrong lesson source", (contract) => {
      const binding = contract.fieldBindings
        .find(({ targetFieldId }) => targetFieldId === "HW-ASSIGNMENT-F-SUBJECT-ID");
      binding.sourceFieldId = "PREP-LESSON-F-TITLE";
    }],
    ["downgrade teacher required", (contract) => {
      const binding = contract.fieldBindings
        .find(({ sourceKind }) => sourceKind === "TEACHER_REQUIRED");
      binding.sourceKind = "GENERATED_PAYLOAD";
    }],
    ["drop payload schema property", (contract, model) => {
      const payload = moduleById(model, "PREP-001").objects
        .find(({ id }) => id === "PREP-OBJ-ASSIGNMENT-DRAFT").fields
        .find(({ id }) => id === "PREP-DRAFT-F-CONTENT");
      delete payload.handoffPayloadSchema.properties[contract.fieldBindings
        .find(({ sourceKind }) => sourceKind === "TEACHER_REQUIRED").payloadPath];
    }],
    ["bypass teacher confirmation", (contract) => {
      contract.requiredConfirmationDutyRef = "ROLE-TEACHER";
    }],
  ];
  for (const [name, mutate] of mutations) {
    const model = structuredClone(requirementModel);
    const confirm = moduleById(model, "PREP-001").actions
      .find(({ id }) => id === "PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF");
    assert.ok(confirm, name);
    const contract = confirm.handoffContract;
    mutate(contract, model);
    assertHasCode(
      validateRequirementModel(model),
      "INVALID_PREPARATION_HANDOFF_CONTRACT",
      name,
    );
  }
});

test("binds every Task 8 business failure to one authored causal predicate", () => {
  const actionById = new Map(modules.flatMap((module) => (
    module.actions.map((action) => [action.id, action])
  )));
  const scenarioById = new Map(modules.flatMap((module) => (
    module.scenarios.map((scenario) => [scenario.id, scenario])
  )));
  for (const [actionId, codes] of TASK8_BUSINESS_FAILURES) {
    const action = actionById.get(actionId);
    assert.ok(Array.isArray(action.failureSemantics), actionId);
    assert.equal(action.failureSemantics.length, codes.length, actionId);
    for (const code of codes) {
      const semantic = action.failureSemantics
        .find(({ resultCode }) => resultCode === code);
      assert.ok(semantic?.predicate, `${actionId}:${code}`);
      const scenario = scenarioById.get(`${actionId}-SCN-${code}`);
      assert.equal(scenario.failurePredicate, semantic.predicate, `${actionId}:${code}`);
      assert.equal(scenario.given, semantic.given, `${actionId}:${code}`);
      assert.equal(scenario.when, semantic.when, `${actionId}:${code}`);
      assert.equal(scenario.then.expectedData, semantic.expectedData, `${actionId}:${code}`);
    }
  }
});

test("rejects unrelated prose predicates and undeclared Task 8 failures", () => {
  const model = structuredClone(requirementModel);
  for (const [actionId, codes] of TASK8_BUSINESS_FAILURES) {
    const module = model.modules.find(({ actions }) => actions.some(({ id }) => id === actionId));
    for (const code of codes) {
      const scenario = module.scenarios.find(({ actionId: id, resultCode }) => (
        id === actionId && resultCode === code
      ));
      scenario.failurePredicate = "UNRELATED_PREDICATE";
      scenario.given = "unrelated given";
      scenario.when = "unrelated when";
      scenario.then.expectedData = "unrelated expected data";
    }
  }
  assertHasCode(
    validateRequirementModel(model),
    "INVALID_TASK8_BUSINESS_FAILURE_CONTRACT",
  );

  const expanded = structuredClone(requirementModel);
  const [actionId] = TASK8_BUSINESS_FAILURES.keys();
  const module = expanded.modules.find(({ actions }) => actions.some(({ id }) => id === actionId));
  const action = module.actions.find(({ id }) => id === actionId);
  action.failureResults.push("UNDECLARED_TASK8_FAILURE");
  action.failureSemantics.push({
    resultCode: "UNDECLARED_TASK8_FAILURE",
    predicate: "UNDECLARED_PREDICATE",
    given: "undeclared given",
    when: "undeclared when",
    expectedData: "undeclared expected data",
  });
  const scenario = structuredClone(module.scenarios.find(({ actionId: id, kind }) => (
    id === actionId && kind !== "SUCCESS"
  )));
  scenario.id = `${actionId}-SCN-UNDECLARED_TASK8_FAILURE`;
  scenario.resultCode = "UNDECLARED_TASK8_FAILURE";
  scenario.failurePredicate = "UNDECLARED_PREDICATE";
  scenario.given = "undeclared given";
  scenario.when = "undeclared when";
  scenario.then.expectedData = "undeclared expected data";
  module.scenarios.push(scenario);
  action.scenarioIds.push(scenario.id);
  assertHasCode(
    validateRequirementModel(expanded),
    "INVALID_TASK8_BUSINESS_FAILURE_CONTRACT",
  );
});

test("binds the EXM publication event to the actual score publication action", () => {
  const published = events.find(({ id }) => id === "EVT-EXM-SCORE-PUBLISHED");
  assert.deepEqual(published.producerActionIds, ["EXM-ACT-PUBLISH-SUBJECT-SCORE"]);
  for (const producerActionIds of [
    [],
    ["EXM-ACT-CREATE-EVENT"],
    ["EXM-ACT-PUBLISH-SUBJECT-SCORE", "EXM-ACT-PUBLISH-SUBJECT-SCORE"],
    null,
    "EXM-ACT-PUBLISH-SUBJECT-SCORE",
  ]) {
    const model = structuredClone(requirementModel);
    model.events.find(({ id }) => id === "EVT-EXM-SCORE-PUBLISHED").producerActionIds
      = producerActionIds;
    assertHasCode(validateRequirementModel(model), "INVALID_EXAM_GOVERNANCE_CONTRACT");
  }
  const missing = structuredClone(requirementModel);
  missing.events.find(({ id }) => id === "EVT-EXM-SCORE-PUBLISHED").producerActionIds
    = ["EXM-ACT-MISSING-PUBLISHER"];
  const errors = validateRequirementModel(missing);
  assertHasCode(errors, "MISSING_EVENT_PRODUCER_ACTION");
  assertHasCode(errors, "INVALID_EXAM_GOVERNANCE_CONTRACT");
});
