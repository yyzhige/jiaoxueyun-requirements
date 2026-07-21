import {
  PHASE,
  RELEASE_STATUS,
  deepFreeze,
} from "../model.mjs";
import {
  teachingLoopFlows,
  teachingLoopModules,
} from "./teaching-loop.mjs";
import {
  aiReportingFlows,
  aiReportingModules,
} from "./ai-reporting.mjs";
import { withProfessionalWriteAuthorization } from "./professional-write-authorization.mjs";

export const PHASE_TWO_ASSESSMENT_MODULE_IDS = deepFreeze([
  "GRD-001",
  "PUB-001",
  "CORR-001",
  "AIX-001",
]);

export const PHASE_TWO_ASSESSMENT_FLOW_IDS = deepFreeze([
  "DF-006",
  "DF-007",
  "DF-008",
  "DF-009",
  "DF-010",
]);

const RESULT_STATUS_AXES = [
  {
    axis: "PROCESSING_STATUS",
    objectId: "GRD-OBJ-DECISION",
    fieldId: "GRD-DECISION-F-PROCESSING-STATUS",
    optionSetId: "OPT-AI2-001",
  },
  {
    axis: "PUBLICATION_STATUS",
    objectId: "PUB-OBJ-RESULT",
    fieldId: "PUB-RESULT-F-PUBLICATION-STATUS",
    optionSetId: "OPT-AI2-002",
  },
  {
    axis: "DISPUTE_CORRECTION_STATUS",
    objectId: "PUB-OBJ-RESULT",
    fieldId: "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS",
    optionSetId: "OPT-AI2-003",
  },
  {
    axis: "VALIDITY_STATUS",
    objectId: "PUB-OBJ-RESULT",
    fieldId: "PUB-RESULT-F-VALIDITY-STATUS",
    optionSetId: "OPT-AI2-004",
  },
];

const NEXT_STEPS = [
  "COMPLETED",
  "CORRECTION_REQUIRED",
  "MORE_INPUT_REQUIRED",
  "UNABLE_TO_DETERMINE",
  "EXCEPTION_REVIEW_REQUIRED",
];

const ROUTINE_NEXT_STEPS = [...NEXT_STEPS];
const SUPPLEMENT_NEXT_STEPS = ["MORE_INPUT_REQUIRED", "UNABLE_TO_DETERMINE"];
const AI_UNAVAILABLE_NEXT_STEPS = ["UNABLE_TO_DETERMINE", "EXCEPTION_REVIEW_REQUIRED"];
const PROFESSIONAL_RESOLUTION_NEXT_STEPS = [
  "COMPLETED",
  "CORRECTION_REQUIRED",
  "MORE_INPUT_REQUIRED",
  "UNABLE_TO_DETERMINE",
];
const NEXT_STEP_WRITER_MATRIX = {
  "GRD-ACT-ROUTE": ROUTINE_NEXT_STEPS,
  "GRD-ACT-ROUTE-UNSUPPORTED": SUPPLEMENT_NEXT_STEPS,
  "GRD-ACT-ROUTE-AI-UNAVAILABLE": AI_UNAVAILABLE_NEXT_STEPS,
  "GRD-ACT-ACCEPT-SUGGESTION": PROFESSIONAL_RESOLUTION_NEXT_STEPS,
  "GRD-ACT-OVERRIDE-SCORE": PROFESSIONAL_RESOLUTION_NEXT_STEPS,
  "GRD-ACT-MANUAL-GRADE": PROFESSIONAL_RESOLUTION_NEXT_STEPS,
  "GRD-ACT-BATCH-CONFIRM": PROFESSIONAL_RESOLUTION_NEXT_STEPS,
  "GRD-ACT-CONFIRM-REVISION": PROFESSIONAL_RESOLUTION_NEXT_STEPS,
};
const INITIAL_ATTEMPT_NEXT_STEP_MATRIX = {
  SUBSTANTIVE_RESPONSE: ROUTINE_NEXT_STEPS,
  EXPLICIT_DONT_KNOW: [
    "CORRECTION_REQUIRED",
    "MORE_INPUT_REQUIRED",
    "UNABLE_TO_DETERMINE",
    "EXCEPTION_REVIEW_REQUIRED",
  ],
  BLANK: SUPPLEMENT_NEXT_STEPS,
  UNRELATED: SUPPLEMENT_NEXT_STEPS,
  PLACEHOLDER: SUPPLEMENT_NEXT_STEPS,
};

const FEEDBACK_LAYERS = [
  "RESULT_AND_ERROR_LOCATION",
  "NON_ANSWER_SCAFFOLD",
  "TARGETED_TEACHING",
  "COMPLETE_ANSWER_AND_SOLUTION",
];

const ANSWER_SURFACES = [
  "PAGE",
  "SEARCH",
  "EXPORT",
  "NOTIFICATION",
  "AI_CONVERSATION",
  "VIDEO",
  "CACHE",
  "DIRECT_LINK",
];

const ASSESSMENT_STANDARD_EVENT_ID = "EVT-HW-PUBLICATION-COMMITTED";
const ASSESSMENT_NOTIFICATION_EVENT_ID = "EVT-AI-ASSESSMENT-CORRECTION-NOTIFICATION-REQUESTED";
const CHALLENGE_OPENED_EVENT_ID = "EVT-AI-ASSESSMENT-CHALLENGE-OPENED";
const PROFESSIONAL_EVIDENCE_EVENT_ID = "EVT-AI-ASSESSMENT-PROFESSIONAL-EVIDENCE-SUBMITTED";
const CHALLENGE_RESOLVED_EVENT_ID = "EVT-AI-ASSESSMENT-CHALLENGE-RESOLVED";
const ASSESSMENT_STANDARD_OBJECT_ID = "GRD-OBJ-ASSESSMENT-STANDARD-VERSION";
const ASSESSMENT_STANDARD_ID_FIELD = "GRD-STANDARD-F-ID";
const ASSESSMENT_STANDARD_VERSION_FIELD = "GRD-STANDARD-F-VERSION";
const ASSESSMENT_READINESS_ACTION_ID = "GRD-ACT-CHECK-PHASE-TWO-ASSESSMENT-READINESS";
const ANSWER_OPEN_POLICY_FIELD_IDS = [
  "PUB-RESULT-F-ANSWER-OPEN-POLICY-ID",
  "PUB-RESULT-F-ANSWER-OPEN-POLICY-VERSION",
];
const ANSWER_OPEN_TIME_FIELD_IDS = [
  "PUB-RESULT-F-ANSWER-OPEN-AT",
  "PUB-RESULT-F-SOLUTION-OPEN-AT",
  "PUB-RESULT-F-RUBRIC-OPEN-AT",
];
const FEEDBACK_LAYER_FIELD_IDS = [
  "PUB-RESULT-F-FEEDBACK-LAYER-1",
  "PUB-RESULT-F-FEEDBACK-LAYER-2",
  "PUB-RESULT-F-FEEDBACK-LAYER-3",
  "PUB-RESULT-F-FEEDBACK-LAYER-4",
];
const ASSESSMENT_STANDARD_CONTENT_FIELD_ID = "PUB-RESULT-F-ASSESSMENT-STANDARD-CONTENT";
const PUBLICATION_SNAPSHOT_INTERFACE = {
  objectId: "HW-OBJ-PUBLICATION-SNAPSHOT",
  identityFieldId: "HW-SNAPSHOT-F-ID",
  versionFieldId: "HW-SNAPSHOT-F-VERSION",
  producerActionId: "HW-ACT-CREATE-PUBLICATION-SNAPSHOT",
  producerEventId: "EVT-HW-PUBLICATION-COMMITTED",
  requiredState: "SEALED",
  resolutionRequiredBeforeExecution: true,
};
const CLOSED_PROVIDER_RESPONSE_BOUNDARY = {
  persisted: false,
  fullUpstreamRequestPersisted: false,
  vendorDebugFieldsPersisted: false,
  hiddenChainOfThoughtPersisted: false,
  unknownKeysBeforePersistence: "REJECT",
};
const EXTERNAL_AI_PROVIDER_ACTION_IDS = [
  "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT",
  "GRD-ACT-PROCESS",
  "CORR-ACT-NORMALIZE-SUBMISSION",
];
const EXTERNAL_AI_PROVIDER_EXCLUSIVE_OUTPUT_FIELD_IDS = [
  "GRD-ATTEMPT-CLASS-F-CLASSIFICATION",
  "GRD-ATTEMPT-CLASS-F-EVIDENCE",
  "GRD-ATTEMPT-CLASS-F-VALIDITY-STATUS",
  "GRD-ATTEMPT-CLASS-F-DISPUTE-CORRECTION-STATUS",
  "GRD-DECISION-F-RECOGNIZED-ANSWER",
  "GRD-DECISION-F-RECOGNIZED-REGION",
  "GRD-DECISION-F-SUGGESTED-SCORE",
  "GRD-DECISION-F-SCORING-RATIONALE",
  "GRD-DECISION-F-CONFIDENCE",
  "GRD-DECISION-F-LIMITATION",
  "GRD-DECISION-F-INPUT-QUALITY",
  "GRD-DECISION-F-EVIDENCE-REFS",
  "GRD-DECISION-F-CONCLUSION",
  "GRD-DECISION-F-FEEDBACK-REF",
  "GRD-TRACE-F-EXTERNAL-REFERENCE",
  "GRD-TRACE-F-MODEL-VERSION",
  "GRD-TRACE-F-CAPABILITY-VERSION",
  "GRD-TRACE-F-RULE-VERSION",
  "GRD-TRACE-F-SAFETY-VERSION",
  "GRD-TRACE-F-EVIDENCE-REFERENCES",
  "GRD-TRACE-F-RESULT-REFERENCE",
  "GRD-TRACE-F-GATE-OUTCOMES",
  "CORR-ASSESSMENT-F-VALID-ATTEMPT",
  "CORR-ASSESSMENT-F-NEXT-STEP",
  "CORR-ASSESSMENT-F-ANSWER-EXPOSURE",
  "CORR-ASSESSMENT-F-EVIDENCE-KIND",
  "CORR-ASSESSMENT-F-VALIDITY-STATUS",
  "CORR-ASSESSMENT-F-DISPUTE-CORRECTION-STATUS",
];
const RESTRICTED_RESULT_CONTENT_FIELDS = [
  {
    fieldId: "PUB-RESULT-F-ANSWER",
    category: "ANSWER",
    visibleAtFieldId: "PUB-RESULT-F-ANSWER-OPEN-AT",
  },
  {
    fieldId: "PUB-RESULT-F-SCORE",
    category: "SCORE",
    visibleAtFieldId: "PUB-RESULT-F-SCORE-VISIBLE-AT",
  },
  {
    fieldId: "PUB-RESULT-F-FEEDBACK",
    category: "FEEDBACK",
    visibleAtFieldId: "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
  },
  ...FEEDBACK_LAYER_FIELD_IDS.slice(0, 3).map((fieldId) => ({
    fieldId,
    category: "FEEDBACK",
    visibleAtFieldId: "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
  })),
  {
    fieldId: "PUB-RESULT-F-FEEDBACK-LAYER-4",
    category: "COMPLETE_ANSWER_AND_SOLUTION",
    visibleAtFieldId: "PUB-RESULT-F-SOLUTION-OPEN-AT",
  },
  {
    fieldId: ASSESSMENT_STANDARD_CONTENT_FIELD_ID,
    category: "ASSESSMENT_STANDARD",
    visibleAtFieldId: "PUB-RESULT-F-RUBRIC-OPEN-AT",
  },
];

const ANSWER_OPEN_ENFORCEMENT_POINTS = [
  ["PAGE", "ACTION", ["PUB-ACT-VIEW-RESULT"]],
  ["SEARCH", "ACTION", ["PUB-ACT-VIEW-RESULT"]],
  ["EXPORT", "ACTION", ["PUB-ACT-VIEW-RESULT"]],
  ["NOTIFICATION", "ACTION", [
    "PUB-ACT-PUBLISH-RESULT",
    "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
  ]],
  ["AI_CONVERSATION", "ACTION", [
    "AIX-ACT-PREPARE-TASK-PREVIEW",
    "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW",
    "AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW",
  ]],
  ["VIDEO", "ACTION", ["PUB-ACT-VIEW-RESULT"]],
  ["CACHE", "ACTION", ["PUB-ACT-VIEW-RESULT"]],
  ["DIRECT_LINK", "ACTION", ["PUB-ACT-VIEW-RESULT"]],
].map(([surface, enforcementKind, reference]) => ({
  surface,
  enforcementKind,
  ...(enforcementKind === "ACTION"
    ? { actionIds: reference }
    : { policyPointId: reference }),
  policyId: "ANSWER-OPEN-POLICY-V2",
  policyFieldIds: [...ANSWER_OPEN_POLICY_FIELD_IDS],
  openTimeFieldIds: [...ANSWER_OPEN_TIME_FIELD_IDS],
  reauthorizeAtAccess: true,
  beforeOpenBehavior: "WITHHOLD_RESTRICTED_CONTENT",
}));

function optionSet(id, key, label, entries) {
  return {
    id,
    key,
    label,
    mode: "STATIC",
    values: entries.map(([code, valueLabel]) => ({ code, label: valueLabel })),
  };
}

function systemField(id, label, overrides = {}) {
  return {
    id,
    label,
    dataType: "STRING",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    visibility: "AUTHORIZED_SCOPE",
    validation: "must match the declared AI assessment contract and authorized object scope",
    historyPolicy: "retain every accepted value with source and result version metadata",
    ...overrides,
  };
}

function optionField(id, label, optionSetId) {
  return systemField(id, label, {
    valueSource: { kind: "OPTION_SET", optionSetId },
  });
}

function userField(id, label, overrides = {}) {
  return {
    id,
    label,
    dataType: "STRING",
    required: true,
    valueSource: { kind: "USER_INPUT" },
    mutability: "EDITABLE",
    visibility: "AUTHORIZED_SCOPE",
    validation: "must match the declared assessment dispute contract and authorized object scope",
    historyPolicy: "retain every accepted value with actor, source, and version metadata",
    ...overrides,
  };
}

function versionPinnedRefField(id, label, targetObjectId, versionFieldId, targetVersionFieldId, actionId) {
  return userField(id, label, {
    dataType: "ID",
    mutability: "IMMUTABLE",
    valueSource: { kind: "OBJECT_REF", targetObjectId },
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: [actionId] },
    versionBinding: { versionFieldId, targetVersionFieldId },
  });
}

function addActionWithScenarios(module, action, {
  successState,
  successData,
  pageId,
}) {
  const failureResults = action.failureResults ?? ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT", "AUDIT_FAILED"];
  const scenarioIds = [
    `${action.id}-SCN-SUCCESS`,
    ...failureResults.map((resultCode) => `${action.id}-SCN-${resultCode}`),
  ];
  module.actions.push(withProfessionalWriteAuthorization({
    writes: action.operationKind !== "READ",
    risk: action.operationKind === "READ" ? "READ" : "HIGH",
    auditMode: action.operationKind === "READ" ? "NOT_REQUIRED" : "REQUIRED",
    ...(action.operationKind === "READ" ? {} : {
      idempotencyKey: `${action.id}:school:object:source-version:request-id`,
    }),
    ...action,
    failureResults,
    scenarioIds,
  }));
  const scenarioBase = {
    actionId: action.id,
    ...(action.executionMode === "USER_TASK" ? { pageId } : { trigger: structuredClone(action.trigger) }),
  };
  module.scenarios.push({
    id: scenarioIds[0],
    kind: "SUCCESS",
    ...scenarioBase,
    given: `the declared source versions and authorization permit ${action.label}`,
    when: `the actor requests ${action.label}`,
    then: {
      expectedData: successData,
      expectedState: { mode: "STATE", value: successState },
      expectedPermission: "ALLOW",
      expectedVisibility: "authorized object scope only",
    },
  });
  for (const resultCode of failureResults) {
    module.scenarios.push({
      id: `${action.id}-SCN-${resultCode}`,
      kind: "FAILURE",
      resultCode,
      ...scenarioBase,
      given: `${resultCode} blocks ${action.label}`,
      when: `the actor requests ${action.label}`,
      then: {
        expectedData: `${resultCode} returns without changing the source fact or prior result version`,
        expectedState: { mode: "UNCHANGED" },
        expectedPermission: resultCode === "PERMISSION_DENIED" ? "DENY" : "ALLOW",
        expectedVisibility: "no data outside the authorized scope",
      },
    });
  }
}

function attachAnswerOpenEnforcement(action, surfaces) {
  action.answerOpenEnforcement = {
    policyId: "ANSWER-OPEN-POLICY-V2",
    policyFieldIds: [...ANSWER_OPEN_POLICY_FIELD_IDS],
    openTimeFieldIds: [...ANSWER_OPEN_TIME_FIELD_IDS],
    surfaces: [...surfaces],
    reauthorizeAtAccess: true,
    beforeOpenBehavior: "WITHHOLD_RESTRICTED_CONTENT",
  };
}

function appendObjectFields(module, objectId, fields, { includeInPages = true } = {}) {
  const object = module.objects.find(({ id }) => id === objectId);
  if (!object) throw new Error(`${module.id} missing ${objectId}`);
  const existing = new Set(object.fields.map(({ id }) => id));
  object.fields.push(...fields.filter(({ id }) => !existing.has(id)));
  if (!includeInPages) return;
  for (const page of module.pages.filter(({ objectIds }) => objectIds.includes(objectId))) {
    const pageFields = new Set(page.fieldIds);
    page.fieldIds.push(...fields.map(({ id }) => id).filter((id) => !pageFields.has(id)));
  }
}

function relabelField(module, objectId, fieldId, label) {
  const object = module.objects.find(({ id }) => id === objectId);
  const field = object?.fields.find(({ id }) => id === fieldId);
  if (!field) throw new Error(`${module.id} missing ${fieldId}`);
  field.label = label;
}

function appendActionOutputs(module, actionId, fieldIds) {
  const action = module.actions.find(({ id }) => id === actionId);
  if (!action) throw new Error(`${module.id} missing ${actionId}`);
  const outputs = new Set(action.outputFieldIds);
  action.outputFieldIds.push(...fieldIds.filter((fieldId) => !outputs.has(fieldId)));
}

function appendActionInputs(module, actionId, fieldIds) {
  const action = module.actions.find(({ id }) => id === actionId);
  if (!action) throw new Error(`${module.id} missing ${actionId}`);
  const inputs = new Set(action.inputFieldIds);
  action.inputFieldIds.push(...fieldIds.filter((fieldId) => !inputs.has(fieldId)));
}

function appendFailureResult(module, actionId, resultCode, expectedData) {
  const action = module.actions.find(({ id }) => id === actionId);
  if (!action) throw new Error(`${module.id} missing ${actionId}`);
  if (!action.failureResults.includes(resultCode)) action.failureResults.push(resultCode);
  const scenarioId = `${actionId}-SCN-${resultCode}`;
  if (module.scenarios.some(({ id }) => id === scenarioId)) return;
  action.scenarioIds.push(scenarioId);
  const pageId = module.scenarios.find((scenario) => (
    scenario?.actionId === actionId && scenario?.pageId
  ))?.pageId;
  module.scenarios.push({
    id: scenarioId,
    kind: "BOUNDARY",
    resultCode,
    actionId,
    ...(action.executionMode === "USER_TASK"
      ? { pageId }
      : { trigger: structuredClone(action.trigger) }),
    given: `${resultCode} blocks AI result publication`,
    when: `the system evaluates ${action.label}`,
    then: {
      expectedData,
      expectedState: { mode: "UNCHANGED" },
      expectedPermission: resultCode === "PERMISSION_GATE_FAILED" ? "DENY" : "ALLOW",
      expectedVisibility: "the unpublished result remains unavailable on every delivery surface",
    },
  });
}

function markProfessionalExceptionAction(module, actionId, label) {
  const action = module.actions.find(({ id }) => id === actionId);
  if (!action) throw new Error(`${module.id} missing ${actionId}`);
  action.label = label;
  action.assessmentRole = "PROFESSIONAL_EXCEPTION_ONLY";
  action.routineAssessmentAllowed = false;
  action.permissions = action.permissions.map((permission) => {
    if (permission.effect === "ALLOW" && permission.dutyRef === "DUTY-SUBJECT-TEACHER") {
      return {
        ...permission,
        condition: "an authorized subject specialist resolves a concrete, evidence-backed exception inside assigned subject scope; this permission is unavailable for routine AI assessment",
      };
    }
    if (permission.effect === "DENY" && permission.dutyRef === "DUTY-HOMEROOM") {
      return {
        ...permission,
        condition: "homeroom coordination cannot resolve another subject's professional assessment exception",
      };
    }
    if (permission.effect === "DENY" && permission.roleRef === "ROLE-PLATFORM-OPS") {
      return {
        ...permission,
        condition: "platform operations cannot create or replace a professional assessment exception result",
      };
    }
    return permission;
  });
  for (const scenario of module.scenarios.filter(({ actionId: id }) => id === actionId)) {
    scenario.given = `an authorized professional exception exists for ${label}`;
    scenario.when = `the subject specialist resolves ${label}`;
    scenario.then.expectedData = `${label} creates a versioned exception resolution while preserving the original fact and superseded AI result`;
  }
}

function markPlanned(module) {
  module.phase = PHASE.SECOND;
  module.releaseStatus = RELEASE_STATUS.PLANNED;
  module.pages = module.pages.map((page) => ({
    ...page,
    availability: RELEASE_STATUS.PLANNED,
  }));
  return module;
}

function replaceLegacyAssessmentStates(module) {
  const replacements = new Map([
    ["ROUTED_REVIEW", "AI_DETERMINED"],
    ["ROUTED_MANUAL", "EXCEPTION_REVIEW_REQUIRED"],
    ["TEACHER_CONFIRMED", "EXCEPTION_RESOLVED"],
    ["REVISION_PENDING", "CORRECTION_PENDING"],
  ]);
  const visit = (value) => {
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child)]));
    }
    if (typeof value !== "string") return value;
    let result = value;
    for (const [legacy, current] of replacements) {
      result = result.replaceAll(legacy, current);
    }
    return result;
  };
  return visit(module);
}

function replaceLegacyAssessmentLanguage(module) {
  const replacements = new Map([
    ["Sync a Versioned Grading Capability Rule Snapshot", "Sync a Versioned AI Assessment Capability Rule Snapshot"],
    ["Enqueue Submission for Grading", "Enqueue Submission for AI Assessment"],
    ["automated grading processing", "AI assessment processing"],
    ["the grading decision", "the AI assessment result"],
    ["versioned grading step", "versioned AI assessment step"],
    ["internal grading step", "internal AI assessment step"],
    ["grading-capability", "AI-assessment-capability"],
    ["Rubric source versions", "frozen assessment-standard source versions"],
    ["blocks confirmation until the decision is requeued", "keeps the result unresolved until source versions are refreshed and the assessment is requeued"],
  ]);
  const visit = (value) => {
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child)]));
    }
    if (typeof value !== "string") return value;
    let result = value;
    for (const [legacy, current] of replacements) result = result.replaceAll(legacy, current);
    return result;
  };
  return visit(module);
}

function reframeActionScenarios(module, actionId, description) {
  for (const scenario of module.scenarios.filter(({ actionId: id }) => id === actionId)) {
    scenario.given = description;
    scenario.when = `the system executes ${module.actions.find(({ id }) => id === actionId)?.label}`;
    scenario.then.expectedData = `${description}; original inputs and earlier result versions remain unchanged`;
  }
}

function reframeProfessionalSourceAction(module, actionId, label, description) {
  const action = module.actions.find(({ id }) => id === actionId);
  if (!action) throw new Error(`${module.id} missing ${actionId}`);
  action.label = label;
  action.assessmentRole = "SOURCE_FACT_CORRECTION_OR_RECOVERY";
  action.routineAssessmentAllowed = false;
  action.permissions = action.permissions.map((permission) => {
    if (permission.effect === "ALLOW" && permission.dutyRef === "DUTY-SUBJECT-TEACHER") {
      return { ...permission, condition: description };
    }
    if (permission.effect === "DENY" && permission.dutyRef === "DUTY-HOMEROOM") {
      return { ...permission, condition: "homeroom coordination cannot alter another subject's source correction or version recovery" };
    }
    if (permission.effect === "DENY" && permission.roleRef === "ROLE-PLATFORM-OPS") {
      return { ...permission, condition: "platform operations cannot alter a student's learning fact or derived assessment version" };
    }
    return permission;
  });
  reframeActionScenarios(module, actionId, description);
}

function assessmentStandardObject() {
  const fields = [
    systemField(ASSESSMENT_STANDARD_ID_FIELD, "Assessment Standard Version ID", {
      dataType: "ID",
      required: true,
      mutability: "IMMUTABLE",
      idempotencyRole: "OBJECT_ID",
    }),
    systemField(ASSESSMENT_STANDARD_VERSION_FIELD, "Assessment Standard Version", {
      dataType: "INTEGER",
      required: true,
      mutability: "IMMUTABLE",
      idempotencyRole: "OBJECT_VERSION",
    }),
    systemField("GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF", "Published Activity Snapshot Reference", {
      dataType: "ID",
      required: true,
      mutability: "IMMUTABLE",
      valueSource: { kind: "OBJECT_REF", targetObjectId: "HW-OBJ-PUBLICATION-SNAPSHOT" },
      referenceIntegrity: "VERSION_PINNED",
      stateGuardPolicy: "ALWAYS_REQUIRED",
      actionApplicability: {
        requiredActionIds: [
          "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD",
          "GRD-ACT-CHECK-PHASE-TWO-ASSESSMENT-READINESS",
        ],
      },
      versionBinding: {
        versionFieldId: "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION",
        targetVersionFieldId: "HW-SNAPSHOT-F-VERSION",
      },
    }),
    systemField("GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION", "Published Activity Snapshot Version", {
      dataType: "INTEGER",
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("GRD-STANDARD-F-ANSWER-OR-DIMENSIONS", "Standard Answer or Evaluation Dimensions", {
      dataType: "JSON",
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("GRD-STANDARD-F-KEY-POINTS", "Key Scoring or Evaluation Points", {
      dataType: "JSON",
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("GRD-STANDARD-F-ACCEPTABLE-ANSWERS", "Acceptable Answers and Variants", {
      dataType: "JSON",
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("GRD-STANDARD-F-COMMON-ERRORS", "Common Error Patterns", {
      dataType: "JSON",
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("GRD-STANDARD-F-SCORE-OR-LEVEL-RULE", "Optional Score, Level, or Feedback-only Rule", {
      dataType: "JSON",
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("GRD-STANDARD-F-COMPLETION-THRESHOLD", "Completion Threshold", {
      dataType: "JSON",
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("GRD-STANDARD-F-HELP-BOUNDARY", "Permitted Help Boundary", {
      dataType: "JSON",
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("GRD-STANDARD-F-FROZEN-AT", "Assessment Standard Frozen At", {
      dataType: "DATETIME",
      required: true,
      mutability: "IMMUTABLE",
    }),
  ];
  return {
    id: ASSESSMENT_STANDARD_OBJECT_ID,
    label: "Frozen Pre-answer Assessment Standard Version",
    dataSubject: "ASSESSMENT_STANDARD",
    controlSubject: "SCHOOL",
    producerRef: "SYSTEM",
    ownerRef: "DUTY-SUBJECT-TEACHER",
    confirmerRef: "SYSTEM",
    stewardRef: "DUTY-SUBJECT-LEAD",
    lifecyclePolicyId: "LIFE-003",
    sensitivityId: "S2",
    stateReachability: { mode: "ACTION_GRAPH", initialStateIds: [] },
    states: ["FROZEN"],
    fields,
    lineageBindings: [{
      refFieldId: "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF",
      versionFieldId: "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION",
      targetObjectId: "HW-OBJ-PUBLICATION-SNAPSHOT",
      targetVersionFieldId: "HW-SNAPSHOT-F-VERSION",
    }],
    studentDataClassification: {
      kind: "NONE",
      privilegedReadPolicy: "NOT_APPLICABLE",
    },
    readMode: "NO_DIRECT_READ",
    immutabilityPolicy: "CREATE_NEW_VERSION_ONLY",
  };
}

function assessmentStandardActions() {
  const generatedFieldIds = assessmentStandardObject().fields.map(({ id }) => id);
  const generateAction = {
    id: "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD",
    label: "Generate and Freeze the Pre-answer Assessment Standard",
    targetObjectId: ASSESSMENT_STANDARD_OBJECT_ID,
    inputFieldIds: [
      "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF",
      "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION",
    ],
    outputFieldIds: generatedFieldIds,
    operationKind: "CREATE",
    writes: true,
    risk: "HIGH",
    executionMode: "SYSTEM_EVENT",
    trigger: { kind: "EVENT", eventId: ASSESSMENT_STANDARD_EVENT_ID },
    relatedStateGuards: [{
      refFieldId: "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF",
      versionFieldId: "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION",
      targetObjectId: "HW-OBJ-PUBLICATION-SNAPSHOT",
      requiredState: "SEALED",
    }],
    permissions: [
      { effect: "ALLOW", actorRef: "SYSTEM", condition: "a published activity snapshot requires its immutable pre-answer assessment standard" },
      { effect: "DENY", actorRef: "CURRENT_ACTOR", condition: "a user cannot create or replace a frozen assessment standard outside activity publication" },
    ],
    scenarioIds: [
      "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD-SCN-SUCCESS",
      "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD-SCN-PERMISSION_DENIED",
      "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD-SCN-VALIDATION_FAILED",
      "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD-SCN-VERSION_CONFLICT",
      "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD-SCN-AUDIT_FAILED",
      "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD-SCN-PUBLICATION_SNAPSHOT_UNAVAILABLE",
    ],
    idempotencyKey: "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD:activity-snapshot-id:activity-snapshot-version",
    auditMode: "REQUIRED",
    failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT", "AUDIT_FAILED", "PUBLICATION_SNAPSHOT_UNAVAILABLE"],
    publicationSnapshotGuard: {
      ...PUBLICATION_SNAPSHOT_INTERFACE,
      failClosed: true,
      executionAllowedWithoutResolvedSource: false,
      unavailableResult: "PUBLICATION_SNAPSHOT_UNAVAILABLE",
    },
  };
  const readAction = {
    id: ASSESSMENT_READINESS_ACTION_ID,
    label: "Check Phase-two Assessment Readiness against the Frozen Standard",
    targetObjectId: ASSESSMENT_STANDARD_OBJECT_ID,
    inputFieldIds: [
      "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF",
      "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION",
    ],
    outputFieldIds: [
      ASSESSMENT_STANDARD_ID_FIELD,
      ASSESSMENT_STANDARD_VERSION_FIELD,
      "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF",
      "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION",
      "GRD-STANDARD-F-FROZEN-AT",
    ],
    operationKind: "READ",
    writes: false,
    risk: "READ",
    executionMode: "FLOW_INTERNAL",
    trigger: { kind: "FLOW", flowIds: ["DF-006"] },
    relatedStateGuards: [{
      refFieldId: "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF",
      versionFieldId: "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION",
      targetObjectId: "HW-OBJ-PUBLICATION-SNAPSHOT",
      requiredState: "SEALED",
    }],
    permissions: [
      { effect: "ALLOW", actorRef: "SYSTEM", condition: "DF-006 resolves only the frozen standard bound to the accepted submission activity snapshot" },
      { effect: "DENY", actorRef: "CURRENT_ACTOR", condition: "a user cannot invoke the internal assessment-standard resolver" },
    ],
    scenarioIds: [
      `${ASSESSMENT_READINESS_ACTION_ID}-SCN-SUCCESS`,
      `${ASSESSMENT_READINESS_ACTION_ID}-SCN-PERMISSION_DENIED`,
      `${ASSESSMENT_READINESS_ACTION_ID}-SCN-NOT_FOUND`,
      `${ASSESSMENT_READINESS_ACTION_ID}-SCN-SNAPSHOT_MISMATCH`,
      `${ASSESSMENT_READINESS_ACTION_ID}-SCN-PUBLICATION_SNAPSHOT_UNAVAILABLE`,
    ],
    auditMode: "REQUIRED",
    failureResults: ["PERMISSION_DENIED", "NOT_FOUND", "SNAPSHOT_MISMATCH", "PUBLICATION_SNAPSHOT_UNAVAILABLE"],
    snapshotMatch: "EXACT_ACTIVITY_SNAPSHOT_ID_AND_VERSION",
    phaseTwoReadinessGate: {
      requiredState: "FROZEN",
      sourceSnapshotMatch: "EXACT_ACTIVITY_SNAPSHOT_ID_AND_VERSION",
      standardFrozenBeforeFirstAnswerRequired: true,
      successResult: "PHASE_TWO_ASSESSMENT_READY",
      failureBehavior: "KEEP_PHASE_TWO_ASSESSMENT_UNAVAILABLE",
      phaseOneSubmissionBlocked: false,
    },
    publicationSnapshotGuard: {
      ...PUBLICATION_SNAPSHOT_INTERFACE,
      failClosed: true,
      executionAllowedWithoutResolvedSource: false,
      unavailableResult: "PUBLICATION_SNAPSHOT_UNAVAILABLE",
    },
  };
  const scenario = (id, action, kind, resultCode, expectedState, expectedPermission, expectedData) => ({
    id,
    kind,
    ...(resultCode ? { resultCode } : {}),
    actionId: action.id,
    trigger: structuredClone(action.trigger),
    given: "the activity publication and submission lineage are version pinned",
    when: `the system executes ${action.label}`,
    then: {
      expectedData,
      expectedState,
      expectedPermission,
      expectedVisibility: "the frozen standard remains restricted to authorized assessment processing and scheduled answer-open access",
    },
  });
  return {
    actions: [generateAction, readAction],
    scenarios: [
      scenario(generateAction.scenarioIds[0], generateAction, "SUCCESS", undefined, { mode: "STATE", value: "FROZEN" }, "ALLOW", "creates one immutable standard version before the first answer for phase-two eligibility while phase-one submission remains independent"),
      ...generateAction.failureResults.map((code, index) => scenario(
        generateAction.scenarioIds[index + 1],
        generateAction,
        code === "PERMISSION_DENIED" ? "FAILURE" : "BOUNDARY",
        code,
        { mode: "UNCHANGED" },
        code === "PERMISSION_DENIED" ? "DENY" : "ALLOW",
        `${code} keeps only phase-two assessment unavailable and never blocks phase-one answer or submission acceptance`,
      )),
      scenario(readAction.scenarioIds[0], readAction, "SUCCESS", undefined, { mode: "UNCHANGED" }, "ALLOW", "opens phase-two assessment only when the exact frozen standard and publication snapshot versions match and the standard predates the first answer"),
      ...readAction.failureResults.map((code, index) => scenario(
        readAction.scenarioIds[index + 1],
        readAction,
        code === "PERMISSION_DENIED" ? "FAILURE" : "BOUNDARY",
        code,
        { mode: "UNCHANGED" },
        code === "PERMISSION_DENIED" ? "DENY" : "ALLOW",
        `${code} keeps the AI assessment undecided and unpublished`,
      )),
    ],
  };
}

function initialAttemptClassificationObject() {
  const fields = [
    systemField("GRD-ATTEMPT-CLASS-F-ID", "Initial Attempt Classification ID", {
      dataType: "ID",
      required: true,
      mutability: "IMMUTABLE",
      idempotencyRole: "OBJECT_ID",
    }),
    {
      ...systemField("GRD-ATTEMPT-CLASS-F-SUBMISSION-REF", "Source Submission Reference", {
        dataType: "ID",
        required: true,
        mutability: "IMMUTABLE",
      }),
      valueSource: { kind: "OBJECT_REF", targetObjectId: "SUB-OBJ-ATTEMPT" },
      referenceIntegrity: "VERSION_PINNED",
      stateGuardPolicy: "NONE",
      actionApplicability: { requiredActionIds: [] },
      versionBinding: {
        versionFieldId: "GRD-ATTEMPT-CLASS-F-SUBMISSION-VERSION",
        targetVersionFieldId: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      },
    },
    systemField("GRD-ATTEMPT-CLASS-F-SUBMISSION-VERSION", "Source Submission Version", {
      dataType: "INTEGER",
      required: true,
      mutability: "IMMUTABLE",
    }),
    optionField("GRD-ATTEMPT-CLASS-F-CLASSIFICATION", "Initial Attempt Classification", "OPT-AI2-008"),
    systemField("GRD-ATTEMPT-CLASS-F-EVIDENCE", "Classification Evidence", {
      dataType: "STRING_ARRAY",
      required: true,
      mutability: "IMMUTABLE",
    }),
    optionField("GRD-ATTEMPT-CLASS-F-VALIDITY-STATUS", "Classification Validity Status", "OPT-AI2-004"),
    optionField("GRD-ATTEMPT-CLASS-F-DISPUTE-CORRECTION-STATUS", "Classification Dispute and Correction Status", "OPT-AI2-003"),
    {
      ...systemField("GRD-ATTEMPT-CLASS-F-PRIOR-CLASSIFICATION-REF", "Prior Classification Reference", {
        dataType: "ID",
        mutability: "IMMUTABLE",
      }),
      valueSource: {
        kind: "OBJECT_REF",
        targetObjectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
      },
      referenceIntegrity: "VERSION_PINNED",
      stateGuardPolicy: "NONE",
      actionApplicability: { requiredActionIds: [] },
      versionBinding: {
        versionFieldId: "GRD-ATTEMPT-CLASS-F-PRIOR-CLASSIFICATION-VERSION",
        targetVersionFieldId: "GRD-ATTEMPT-CLASS-F-VERSION",
      },
    },
    systemField("GRD-ATTEMPT-CLASS-F-PRIOR-CLASSIFICATION-VERSION", "Prior Classification Version", {
      dataType: "INTEGER",
      mutability: "IMMUTABLE",
    }),
    systemField("GRD-ATTEMPT-CLASS-F-SUPERSESSION-REASON", "Classification Supersession Reason", {
      dataType: "TEXT",
      mutability: "IMMUTABLE",
    }),
    systemField("GRD-ATTEMPT-CLASS-F-VERSION", "Initial Attempt Classification Version", {
      dataType: "INTEGER",
      required: true,
      idempotencyRole: "OBJECT_VERSION",
    }),
  ];
  fields.find(({ id }) => id === "GRD-ATTEMPT-CLASS-F-CLASSIFICATION").required = true;
  fields.find(({ id }) => id === "GRD-ATTEMPT-CLASS-F-VALIDITY-STATUS").required = true;
  fields.find(({ id }) => id === "GRD-ATTEMPT-CLASS-F-DISPUTE-CORRECTION-STATUS").required = true;
  return {
    id: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
    label: "Initial Submission Valid-attempt Classification",
    dataSubject: "INITIAL_SUBMISSION_ATTEMPT_CLASSIFICATION",
    controlSubject: "SCHOOL",
    producerRef: "AI",
    ownerRef: "DUTY-SUBJECT-TEACHER",
    confirmerRef: "SYSTEM",
    stewardRef: "ROLE-ACADEMIC",
    lifecyclePolicyId: "LIFE-003",
    sensitivityId: "S3",
    stateReachability: { mode: "ACTION_GRAPH", initialStateIds: [] },
    states: ["CLASSIFIED"],
    fields,
    lineageBindings: [
      {
        refFieldId: "GRD-ATTEMPT-CLASS-F-SUBMISSION-REF",
        versionFieldId: "GRD-ATTEMPT-CLASS-F-SUBMISSION-VERSION",
        targetObjectId: "SUB-OBJ-ATTEMPT",
        targetVersionFieldId: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      },
      {
        refFieldId: "GRD-ATTEMPT-CLASS-F-PRIOR-CLASSIFICATION-REF",
        versionFieldId: "GRD-ATTEMPT-CLASS-F-PRIOR-CLASSIFICATION-VERSION",
        targetObjectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
        targetVersionFieldId: "GRD-ATTEMPT-CLASS-F-VERSION",
      },
    ],
    dataNature: "AI_DERIVED_JUDGMENT",
    originalFactOverwritePolicy: "FORBIDDEN",
    derivedJudgmentContract: {
      sourceRefFieldId: "GRD-ATTEMPT-CLASS-F-SUBMISSION-REF",
      sourceVersionFieldId: "GRD-ATTEMPT-CLASS-F-SUBMISSION-VERSION",
      validityFieldId: "GRD-ATTEMPT-CLASS-F-VALIDITY-STATUS",
      disputeFieldId: "GRD-ATTEMPT-CLASS-F-DISPUTE-CORRECTION-STATUS",
      priorRefFieldId: "GRD-ATTEMPT-CLASS-F-PRIOR-CLASSIFICATION-REF",
      priorVersionFieldId: "GRD-ATTEMPT-CLASS-F-PRIOR-CLASSIFICATION-VERSION",
      supersessionReasonFieldId: "GRD-ATTEMPT-CLASS-F-SUPERSESSION-REASON",
      versionFieldId: "GRD-ATTEMPT-CLASS-F-VERSION",
      sourceOverwriteAllowed: false,
      recomputationCreatesNewVersion: true,
      priorVersionRequiredWhenRecomputed: true,
      initialization: {
        actionId: "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT",
        validityCode: "VALID",
        disputeCode: "UNCHALLENGED",
      },
      recomputation: {
        actionIds: ["GRD-ACT-CLASSIFY-INITIAL-ATTEMPT"],
        requiredOutputFieldIds: [
          "GRD-ATTEMPT-CLASS-F-PRIOR-CLASSIFICATION-REF",
          "GRD-ATTEMPT-CLASS-F-PRIOR-CLASSIFICATION-VERSION",
          "GRD-ATTEMPT-CLASS-F-SUPERSESSION-REASON",
          "GRD-ATTEMPT-CLASS-F-VERSION",
          "GRD-ATTEMPT-CLASS-F-VALIDITY-STATUS",
          "GRD-ATTEMPT-CLASS-F-DISPUTE-CORRECTION-STATUS",
        ],
        statusWritesByActionId: {
          "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT": {
            validityCode: "VALID",
            disputeCode: "UNCHALLENGED",
          },
        },
      },
    },
    studentDataClassification: {
      kind: "DETAIL",
      privilegedReadPolicy: "DEFAULT_DENY",
    },
    readMode: "NO_DIRECT_READ",
  };
}

function addInitialAttemptClassificationAction(module) {
  const object = module.objects.find(({ id }) => id === "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION");
  addActionWithScenarios(module, {
    id: "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT",
    label: "Classify an Initial Submission Attempt without Inferring Completion",
    targetObjectId: object.id,
    inputFieldIds: [
      "GRD-ATTEMPT-CLASS-F-SUBMISSION-REF",
      "GRD-ATTEMPT-CLASS-F-SUBMISSION-VERSION",
    ],
    outputFieldIds: object.fields.map(({ id }) => id),
    operationKind: "CREATE",
    executionMode: "FLOW_INTERNAL",
    trigger: { kind: "FLOW", flowIds: ["DF-006"] },
    permissions: [
      { effect: "ALLOW", actorRef: "SYSTEM", condition: "DF-006 classifies only a version-pinned accepted submission and does not change the submission fact" },
      { effect: "DENY", actorRef: "CURRENT_ACTOR", condition: "a user cannot assign or override the derived valid-attempt classification" },
    ],
    classificationContract: {
      optionSetId: "OPT-AI2-008",
      explicitDontKnowMeansCompleted: false,
      explicitDontKnowCreatesMasteryEvidence: false,
      nextStepWriteAllowed: false,
      validityWrite: "VALID",
      disputeWrite: "UNCHALLENGED",
      recomputationMode: "CREATE_NEW_VERSION_WITH_PRIOR_REFERENCE",
    },
    statusWrites: [
      { fieldId: "GRD-ATTEMPT-CLASS-F-VALIDITY-STATUS", codes: ["VALID"] },
      { fieldId: "GRD-ATTEMPT-CLASS-F-DISPUTE-CORRECTION-STATUS", codes: ["UNCHALLENGED"] },
    ],
  }, {
    successState: "CLASSIFIED",
    successData: "creates a version-pinned attempt classification without writing completion, mastery, or the assessment next step",
  });
  module.actions.find(({ id }) => id === "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT")
    .derivedJudgmentWriteContract = structuredClone(object.derivedJudgmentContract);
  module.actions.find(({ id }) => id === "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT")
    .derivedJudgmentRecomputationContract = structuredClone(
      object.derivedJudgmentContract.recomputation,
    );
  const classify = module.actions.find(({ id }) => id === "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT");
  classify.externalAiProcessingGuard = {
    contractId: "EXTERNAL-AI-STUDENT-DATA-V2",
    failureResult: "EXTERNAL_AI_CONTRACT_INCOMPLETE",
    failClosed: true,
  };
  classify.providerResultContract = {
    resultSchema: {
      type: "object",
      required: [
        "classification",
        "evidenceReferences",
        "validityStatus",
        "disputeStatus",
      ],
      properties: {
        classification: {
          type: "string",
          enum: [
            "SUBSTANTIVE_RESPONSE",
            "EXPLICIT_DONT_KNOW",
            "BLANK",
            "UNRELATED",
            "PLACEHOLDER",
          ],
        },
        evidenceReferences: { type: "array", items: { type: "string" } },
        validityStatus: { type: "string", enum: ["VALID"] },
        disputeStatus: { type: "string", enum: ["UNCHALLENGED"] },
      },
      additionalProperties: false,
    },
    resultPersistenceMapping: {
      classification: "GRD-ATTEMPT-CLASS-F-CLASSIFICATION",
      evidenceReferences: "GRD-ATTEMPT-CLASS-F-EVIDENCE",
      validityStatus: "GRD-ATTEMPT-CLASS-F-VALIDITY-STATUS",
      disputeStatus: "GRD-ATTEMPT-CLASS-F-DISPUTE-CORRECTION-STATUS",
    },
    verifiableTeachingEvidenceOnly: true,
  };
  classify.providerResponseBoundary = structuredClone(CLOSED_PROVIDER_RESPONSE_BOUNDARY);
  classify.persistenceContract = {
    allowedOutputFieldIds: [...classify.outputFieldIds],
    unknownPersistedFields: "REJECT",
    arbitraryJsonPayloadAllowed: false,
  };
  appendFailureResult(
    module,
    classify.id,
    "EXTERNAL_AI_CONTRACT_INCOMPLETE",
    "the submission remains an unchanged original fact and no derived classification is created",
  );
}

function gradingModule() {
  const module = replaceLegacyAssessmentStates(markPlanned(structuredClone(
    teachingLoopModules.find(({ id }) => id === "GRD-001"),
  )));
  module.title = "AI Assessment and Completion Determination";
  module.objective = "Return a source-pinned, challengeable AI assessment and explicit next step without inserting a human actor into routine determination";
  module.entryConditions = [
    "an immutable submission version, activity publication snapshot, help environment, item, and assessment-standard version are available",
  ];
  module.exitConditions = [
    "every accepted submission has one explicit next step or remains unpublished and undecided in the professional exception queue",
  ];
  module.productDecisionIds = ["D007", "D058", "D059", "D060", "D062", "D063", "D064", "D065", "D066", "D070", "D071", "D072", "D073", "D074"];

  const decision = module.objects.find(({ id }) => id === "GRD-OBJ-DECISION");
  const capabilityRule = module.objects.find(({ id }) => id === "GRD-OBJ-CAPABILITY-RULE");
  const standard = assessmentStandardObject();
  const initialAttemptClassification = initialAttemptClassificationObject();
  const standardActions = assessmentStandardActions();
  module.objects.push(standard, initialAttemptClassification);
  module.actions.push(...standardActions.actions);
  module.scenarios.push(...standardActions.scenarios);
  addInitialAttemptClassificationAction(module);
  module.relationships.push({
    id: "GRD-REL-DECISION-ASSESSMENT-STANDARD",
    fromObjectId: "GRD-OBJ-DECISION",
    toObjectId: ASSESSMENT_STANDARD_OBJECT_ID,
    type: "REFERENCES",
    cardinality: "MANY_TO_ONE",
    ownershipScope: "SAME_CONTEXT",
    onSourceInvalidation: "retain the exact frozen standard used by every decision and create a new standard version only for a replacement activity",
  });
  decision.label = "AI Assessment Result Version";
  capabilityRule.label = "AI Assessment Capability Rule";
  decision.producerRef = "AI";
  decision.confirmerRef = "SYSTEM";
  decision.dataNature = "AI_DERIVED_JUDGMENT";
  decision.originalFactOverwritePolicy = "FORBIDDEN";
  relabelField(module, "GRD-OBJ-DECISION", "GRD-DECISION-F-OFFICIAL-SCORE", "Effective Activity Score or Level (optional)");
  relabelField(module, "GRD-OBJ-DECISION", "GRD-DECISION-F-TEACHER-FEEDBACK", "Professional Exception Feedback (exception only)");
  relabelField(module, "GRD-OBJ-DECISION", "GRD-DECISION-F-CORRECTION-REASON", "Evidence-backed Correction or Exception Reason");
  relabelField(module, "GRD-OBJ-DECISION", "GRD-DECISION-F-RUBRIC-REF", "Frozen Assessment Standard Reference");
  relabelField(module, "GRD-OBJ-DECISION", "GRD-DECISION-F-RUBRIC-VERSION", "Frozen Assessment Standard Version");
  relabelField(module, "GRD-OBJ-DECISION", "GRD-DECISION-F-ID", "AI Assessment Result ID");
  relabelField(module, "GRD-OBJ-DECISION", "GRD-DECISION-F-PRIOR-DECISION-VERSION", "Prior Effective Assessment Result Version");
  relabelField(module, "GRD-OBJ-DECISION", "GRD-DECISION-F-ROUTE", "AI Assessment Route");
  relabelField(module, "GRD-OBJ-CAPABILITY-RULE", "GRD-CAP-F-TEACHER-REVIEW", "Professional Exception Review Requirement");
  relabelField(module, "GRD-OBJ-CAPABILITY-RULE", "GRD-CAP-F-BATCH-CONFIRM", "Automated Batch Determination Eligibility");
  relabelField(module, "GRD-OBJ-CAPABILITY-RULE", "GRD-CAP-F-UNAVAILABLE-FALLBACK", "Unable-to-determine Recovery Route");
  decision.fields.find(({ id }) => id === "GRD-DECISION-F-RECOGNIZED-ANSWER").dataType = "TEXT";
  decision.fields.find(({ id }) => id === "GRD-DECISION-F-RECOGNIZED-REGION").dataType = "TEXT";

  const classificationBoundActionIds = [
    "GRD-ACT-ENQUEUE",
    "GRD-ACT-PROCESS",
    "GRD-ACT-ROUTE",
    "GRD-ACT-ROUTE-UNSUPPORTED",
    "GRD-ACT-ROUTE-AI-UNAVAILABLE",
    "GRD-ACT-ACCEPT-SUGGESTION",
    "GRD-ACT-OVERRIDE-SCORE",
    "GRD-ACT-MANUAL-GRADE",
    "GRD-ACT-BATCH-CONFIRM",
    "GRD-ACT-CONFIRM-REVISION",
  ];

  const standardRef = decision.fields.find(({ id }) => id === "GRD-DECISION-F-RUBRIC-REF");
  const standardVersion = decision.fields.find(({ id }) => id === "GRD-DECISION-F-RUBRIC-VERSION");
  standardRef.valueSource.targetObjectId = ASSESSMENT_STANDARD_OBJECT_ID;
  standardRef.versionBinding.targetVersionFieldId = ASSESSMENT_STANDARD_VERSION_FIELD;
  standardVersion.dataType = "INTEGER";
  const standardLineage = decision.lineageBindings.find(({ refFieldId }) => (
    refFieldId === "GRD-DECISION-F-RUBRIC-REF"
  ));
  standardLineage.targetObjectId = ASSESSMENT_STANDARD_OBJECT_ID;
  standardLineage.targetVersionFieldId = ASSESSMENT_STANDARD_VERSION_FIELD;

  module.capabilityMatrix = module.capabilityMatrix.map((rule) => ({
    ...rule,
    scoringLevel: rule.scoringLevel === "MANUAL-ONLY" ? "EXCEPTION-ONLY" : rule.scoringLevel,
    requiredEvidence: rule.requiredEvidence.map((value) => (
      value === "TEACHER-JUDGMENT" ? "PROFESSIONAL-EXCEPTION-EVIDENCE" : value
    )),
    teacherReviewRequired: "NO",
    unavailableFallback: rule.unavailableFallback === "MANUAL-GRADING"
      ? "PROFESSIONAL-EXCEPTION-REVIEW"
      : rule.unavailableFallback === "MANUAL-TRANSCRIPTION-THEN-GRADING"
        ? "CONCRETE-SUPPLEMENT-THEN-ALTERNATE-REVIEW"
        : rule.unavailableFallback,
  }));
  const unsupportedDecision = module.capabilityApplicability.unsupportedRule.decision;
  unsupportedDecision.scoringLevel = unsupportedDecision.scoringLevel === "MANUAL-ONLY"
    ? "EXCEPTION-ONLY"
    : unsupportedDecision.scoringLevel;
  unsupportedDecision.requiredEvidence = unsupportedDecision.requiredEvidence.map((value) => (
    value === "TEACHER-JUDGMENT" ? "PROFESSIONAL-EXCEPTION-EVIDENCE" : value
  ));
  unsupportedDecision.unavailableFallback = "PROFESSIONAL-EXCEPTION-REVIEW";

  const fields = [
    optionField("GRD-DECISION-F-PROCESSING-STATUS", "AI Assessment Processing Status", "OPT-AI2-001"),
    optionField("GRD-DECISION-F-NEXT-STEP", "Explicit Completion-determination Next Step", "OPT-AI2-005"),
    {
      ...systemField("GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF", "Initial Attempt Classification Reference", {
        dataType: "ID",
        required: true,
        mutability: "IMMUTABLE",
      }),
      valueSource: {
        kind: "OBJECT_REF",
        targetObjectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
      },
      referenceIntegrity: "VERSION_PINNED",
      stateGuardPolicy: "ALWAYS_REQUIRED",
      actionApplicability: { requiredActionIds: [...classificationBoundActionIds] },
      versionBinding: {
        versionFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
        targetVersionFieldId: "GRD-ATTEMPT-CLASS-F-VERSION",
      },
    },
    systemField("GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION", "Initial Attempt Classification Version", {
      dataType: "INTEGER",
      required: true,
      mutability: "IMMUTABLE",
    }),
    optionField("GRD-DECISION-F-DERIVATION-VALIDITY-STATUS", "Assessment Derivation Validity", "OPT-AI2-004"),
    optionField("GRD-DECISION-F-DERIVATION-DISPUTE-STATUS", "Assessment Derivation Dispute Status", "OPT-AI2-003"),
    {
      ...systemField("GRD-DECISION-F-PRIOR-DECISION-REF", "Prior Assessment Decision Reference", {
        dataType: "ID",
        mutability: "IMMUTABLE",
      }),
      valueSource: { kind: "OBJECT_REF", targetObjectId: "GRD-OBJ-DECISION" },
      referenceIntegrity: "VERSION_PINNED",
      stateGuardPolicy: "NONE",
      actionApplicability: { requiredActionIds: [] },
      versionBinding: {
        versionFieldId: "GRD-DECISION-F-PRIOR-DECISION-VERSION",
        targetVersionFieldId: "GRD-DECISION-F-DECISION-VERSION",
      },
    },
    systemField("GRD-DECISION-F-ACTIVITY-SNAPSHOT-REF", "Published Activity Snapshot Reference", { dataType: "ID", mutability: "IMMUTABLE" }),
    systemField("GRD-DECISION-F-ACTIVITY-SNAPSHOT-VERSION", "Published Activity Snapshot Version", { dataType: "INTEGER", mutability: "IMMUTABLE" }),
    systemField("GRD-DECISION-F-HELP-ENVIRONMENT", "Actual Help Environment", { dataType: "JSON", mutability: "IMMUTABLE" }),
    systemField("GRD-DECISION-F-INPUT-QUALITY", "Input and Recognition Quality", { dataType: "STRING_ARRAY", mutability: "IMMUTABLE" }),
    systemField("GRD-DECISION-F-EVIDENCE-REFS", "Verifiable Evidence References", { dataType: "STRING_ARRAY", mutability: "IMMUTABLE" }),
    systemField("GRD-DECISION-F-CONCLUSION", "AI Assessment Conclusion", { dataType: "TEXT" }),
    systemField("GRD-DECISION-F-FEEDBACK-REF", "Versioned Feedback Reference", { dataType: "ID" }),
    systemField("GRD-DECISION-F-NEXT-ACTION", "Concrete Next Action", { dataType: "TEXT" }),
    systemField("GRD-TRACE-F-BUSINESS-TASK-ID", "AI Business Task ID", { dataType: "ID", mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-EXTERNAL-REFERENCE", "External Processing Reference", { dataType: "ID", mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-MODEL-VERSION", "Model Version", { mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-CAPABILITY-VERSION", "AI Capability Version", { mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-RULE-VERSION", "Assessment Rule Version", { mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-SAFETY-VERSION", "Safety Policy Version", { mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-EVIDENCE-REFERENCES", "Trace Evidence References", { dataType: "STRING_ARRAY", mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-RESULT-REFERENCE", "Trace Result Reference", { dataType: "ID", mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-GATE-OUTCOMES", "Trace Gate Outcomes", { dataType: "STRING_ARRAY", mutability: "IMMUTABLE" }),
  ];
  const processingStatusField = fields.find(({ id }) => id === "GRD-DECISION-F-PROCESSING-STATUS");
  const nextStepField = fields.find(({ id }) => id === "GRD-DECISION-F-NEXT-STEP");
  processingStatusField.required = true;
  fields.find(({ id }) => id === "GRD-DECISION-F-DERIVATION-VALIDITY-STATUS").required = true;
  fields.find(({ id }) => id === "GRD-DECISION-F-DERIVATION-DISPUTE-STATUS").required = true;
  const priorDecisionRef = fields.find(({ id }) => id === "GRD-DECISION-F-PRIOR-DECISION-REF");
  priorDecisionRef.required = structuredClone(
    decision.fields.find(({ id }) => id === "GRD-DECISION-F-PRIOR-DECISION-VERSION").required,
  );
  const nextStepWriterActionIds = [
    "GRD-ACT-ROUTE",
    "GRD-ACT-ROUTE-UNSUPPORTED",
    "GRD-ACT-ROUTE-AI-UNAVAILABLE",
    "GRD-ACT-ACCEPT-SUGGESTION",
    "GRD-ACT-OVERRIDE-SCORE",
    "GRD-ACT-MANUAL-GRADE",
    "GRD-ACT-BATCH-CONFIRM",
    "GRD-ACT-CONFIRM-REVISION",
  ];
  nextStepField.required = {
    description: "required for every determined, unable-to-determine, or professionally resolved assessment result",
    whenStates: ["AI_DETERMINED", "EXCEPTION_REVIEW_REQUIRED", "EXCEPTION_RESOLVED"],
    whenActionIds: nextStepWriterActionIds,
  };
  appendObjectFields(module, "GRD-OBJ-DECISION", fields);
  decision.lineageBindings.push(
    {
      refFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
      versionFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
      targetObjectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
      targetVersionFieldId: "GRD-ATTEMPT-CLASS-F-VERSION",
    },
    {
      refFieldId: "GRD-DECISION-F-PRIOR-DECISION-REF",
      versionFieldId: "GRD-DECISION-F-PRIOR-DECISION-VERSION",
      targetObjectId: "GRD-OBJ-DECISION",
      targetVersionFieldId: "GRD-DECISION-F-DECISION-VERSION",
    },
  );
  decision.derivedJudgmentContract = {
    sourceRefFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
    sourceVersionFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
    validityFieldId: "GRD-DECISION-F-DERIVATION-VALIDITY-STATUS",
    disputeFieldId: "GRD-DECISION-F-DERIVATION-DISPUTE-STATUS",
    priorRefFieldId: "GRD-DECISION-F-PRIOR-DECISION-REF",
    priorVersionFieldId: "GRD-DECISION-F-PRIOR-DECISION-VERSION",
    supersessionReasonFieldId: "GRD-DECISION-F-CORRECTION-REASON",
    versionFieldId: "GRD-DECISION-F-DECISION-VERSION",
    sourceOverwriteAllowed: false,
    recomputationCreatesNewVersion: true,
    priorVersionRequiredWhenRecomputed: true,
    initialization: {
      actionId: "GRD-ACT-ENQUEUE",
      validityCode: "PENDING_VALIDATION",
      disputeCode: "UNCHALLENGED",
    },
    recomputation: {
      actionIds: ["GRD-ACT-OPEN-CONFIRMED-REVISION"],
      requiredOutputFieldIds: [
        "GRD-DECISION-F-PRIOR-DECISION-REF",
        "GRD-DECISION-F-PRIOR-DECISION-VERSION",
        "GRD-DECISION-F-CORRECTION-REASON",
        "GRD-DECISION-F-DECISION-VERSION",
        "GRD-DECISION-F-DERIVATION-VALIDITY-STATUS",
        "GRD-DECISION-F-DERIVATION-DISPUTE-STATUS",
      ],
      statusWritesByActionId: {
        "GRD-ACT-OPEN-CONFIRMED-REVISION": {
          validityCode: "PENDING_VALIDATION",
          disputeCode: "CORRECTION_PENDING",
        },
      },
    },
  };
  for (const actionId of classificationBoundActionIds) {
    appendActionInputs(module, actionId, [
      "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
      "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
    ]);
    const action = module.actions.find(({ id }) => id === actionId);
    action.relatedStateGuards = [
      ...(action.relatedStateGuards ?? []),
      {
        refFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
        versionFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
        targetObjectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
        requiredState: "CLASSIFIED",
      },
    ];
    action.initialAttemptClassificationBinding = {
      refFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
      versionFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
      targetObjectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
      targetVersionFieldId: "GRD-ATTEMPT-CLASS-F-VERSION",
      requiredState: "CLASSIFIED",
      exactVersionRequired: true,
    };
  }
  appendActionOutputs(module, "GRD-ACT-ENQUEUE", [
    "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
    "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
    "GRD-DECISION-F-DERIVATION-VALIDITY-STATUS",
    "GRD-DECISION-F-DERIVATION-DISPUTE-STATUS",
  ]);
  appendActionOutputs(module, "GRD-ACT-OPEN-CONFIRMED-REVISION", [
    "GRD-DECISION-F-PRIOR-DECISION-REF",
  ]);
  appendActionOutputs(module, "GRD-ACT-PROCESS", fields.map(({ id }) => id));
  const processOutputs = module.actions.find(({ id }) => id === "GRD-ACT-PROCESS").outputFieldIds;
  const processExcludedFieldIds = new Set([
    "GRD-DECISION-F-NEXT-STEP",
    "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
    "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
    "GRD-DECISION-F-DERIVATION-VALIDITY-STATUS",
    "GRD-DECISION-F-DERIVATION-DISPUTE-STATUS",
    "GRD-DECISION-F-PRIOR-DECISION-REF",
  ]);
  module.actions.find(({ id }) => id === "GRD-ACT-PROCESS").outputFieldIds = processOutputs
    .filter((fieldId) => !processExcludedFieldIds.has(fieldId));
  appendActionOutputs(module, "GRD-ACT-ENQUEUE", ["GRD-DECISION-F-PROCESSING-STATUS"]);
  appendActionOutputs(module, "GRD-ACT-ROUTE", [
    "GRD-DECISION-F-PROCESSING-STATUS",
    "GRD-DECISION-F-NEXT-STEP",
    "GRD-DECISION-F-NEXT-ACTION",
    "GRD-DECISION-F-DECISION-VERSION",
  ]);
  for (const actionId of ["GRD-ACT-ROUTE-UNSUPPORTED", "GRD-ACT-ROUTE-AI-UNAVAILABLE"]) {
    appendActionOutputs(module, actionId, [
      "GRD-DECISION-F-PROCESSING-STATUS",
      "GRD-DECISION-F-NEXT-STEP",
      "GRD-DECISION-F-NEXT-ACTION",
    ]);
  }
  for (const actionId of nextStepWriterActionIds.filter((id) => ![
    "GRD-ACT-ROUTE",
    "GRD-ACT-ROUTE-UNSUPPORTED",
    "GRD-ACT-ROUTE-AI-UNAVAILABLE",
  ].includes(id))) {
    appendActionOutputs(module, actionId, [
      "GRD-DECISION-F-PROCESSING-STATUS",
      "GRD-DECISION-F-NEXT-STEP",
      "GRD-DECISION-F-NEXT-ACTION",
    ]);
  }

  const process = module.actions.find(({ id }) => id === "GRD-ACT-PROCESS");
  process.label = "Produce AI Assessment and Completion Determination";
  process.assessmentRole = "ROUTINE_AI_ASSESSMENT";
  process.assessmentStandardBinding = {
    refFieldId: "GRD-DECISION-F-RUBRIC-REF",
    versionFieldId: "GRD-DECISION-F-RUBRIC-VERSION",
    requiredState: "FROZEN",
    matchMode: "EXACT_SUBMISSION_BOUND_VERSION",
  };
  process.externalAiProcessingGuard = {
    contractId: "EXTERNAL-AI-STUDENT-DATA-V2",
    failureResult: "EXTERNAL_AI_CONTRACT_INCOMPLETE",
    failClosed: true,
  };
  process.providerResultContract = {
    resultSchema: {
      type: "object",
      required: [
        "recognizedAnswer",
        "recognizedRegion",
        "scoringRationale",
        "confidence",
        "limitation",
        "inputQualityCodes",
        "evidenceReferences",
        "traceEvidenceReferences",
        "conclusion",
        "nextAction",
        "externalReference",
        "modelVersion",
        "capabilityVersion",
        "ruleVersion",
        "safetyVersion",
        "resultReference",
        "gateOutcomes",
      ],
      properties: {
        recognizedAnswer: { type: "string" },
        recognizedRegion: { type: "string" },
        suggestedScore: { type: "number" },
        scoringRationale: { type: "string" },
        confidence: { type: "string" },
        limitation: { type: "string" },
        inputQualityCodes: { type: "array", items: { type: "string" } },
        evidenceReferences: { type: "array", items: { type: "string" } },
        traceEvidenceReferences: { type: "array", items: { type: "string" } },
        conclusion: { type: "string" },
        feedbackReference: { type: "string" },
        nextAction: { type: "string" },
        externalReference: { type: "string" },
        modelVersion: { type: "string" },
        capabilityVersion: { type: "string" },
        ruleVersion: { type: "string" },
        safetyVersion: { type: "string" },
        resultReference: { type: "string" },
        gateOutcomes: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
    resultPersistenceMapping: {
      recognizedAnswer: "GRD-DECISION-F-RECOGNIZED-ANSWER",
      recognizedRegion: "GRD-DECISION-F-RECOGNIZED-REGION",
      suggestedScore: "GRD-DECISION-F-SUGGESTED-SCORE",
      scoringRationale: "GRD-DECISION-F-SCORING-RATIONALE",
      confidence: "GRD-DECISION-F-CONFIDENCE",
      limitation: "GRD-DECISION-F-LIMITATION",
      inputQualityCodes: "GRD-DECISION-F-INPUT-QUALITY",
      evidenceReferences: "GRD-DECISION-F-EVIDENCE-REFS",
      traceEvidenceReferences: "GRD-TRACE-F-EVIDENCE-REFERENCES",
      conclusion: "GRD-DECISION-F-CONCLUSION",
      feedbackReference: "GRD-DECISION-F-FEEDBACK-REF",
      nextAction: "GRD-DECISION-F-NEXT-ACTION",
      externalReference: "GRD-TRACE-F-EXTERNAL-REFERENCE",
      modelVersion: "GRD-TRACE-F-MODEL-VERSION",
      capabilityVersion: "GRD-TRACE-F-CAPABILITY-VERSION",
      ruleVersion: "GRD-TRACE-F-RULE-VERSION",
      safetyVersion: "GRD-TRACE-F-SAFETY-VERSION",
      resultReference: "GRD-TRACE-F-RESULT-REFERENCE",
      gateOutcomes: "GRD-TRACE-F-GATE-OUTCOMES",
    },
    verifiableTeachingEvidenceOnly: true,
    scoringRationaleContract: {
      fieldId: "GRD-DECISION-F-SCORING-RATIONALE",
      evidenceReferenceFieldId: "GRD-DECISION-F-EVIDENCE-REFS",
      hiddenReasoningAllowed: false,
    },
  };
  process.providerResponseBoundary = structuredClone(CLOSED_PROVIDER_RESPONSE_BOUNDARY);
  process.persistenceContract = {
    allowedOutputFieldIds: [...process.outputFieldIds],
    unknownPersistedFields: "REJECT",
    arbitraryJsonPayloadAllowed: false,
  };
  appendFailureResult(
    module,
    "GRD-ACT-PROCESS",
    "EXTERNAL_AI_CONTRACT_INCOMPLETE",
    "real student data remains inside the product boundary until every external AI processing precondition is fixed and verifiable",
  );
  const route = module.actions.find(({ id }) => id === "GRD-ACT-ROUTE");
  route.label = "Record Explicit Assessment Status and Next Step";
  route.assessmentRole = "ROUTINE_AI_ASSESSMENT";
  const supplement = module.actions.find(({ id }) => id === "GRD-ACT-ROUTE-UNSUPPORTED");
  supplement.label = "Request Concrete Source or Input Supplementation";
  supplement.assessmentRole = "UNABLE_TO_DETERMINE_RECOVERY";
  const alternate = module.actions.find(({ id }) => id === "GRD-ACT-ROUTE-AI-UNAVAILABLE");
  alternate.label = "Route to a Permitted Alternate Review";
  alternate.assessmentRole = "UNABLE_TO_DETERMINE_RECOVERY";
  module.actions.find(({ id }) => id === "GRD-ACT-SYNC-CAPABILITY-RULE").label = "Sync a Versioned AI Assessment Capability Rule Snapshot";
  module.actions.find(({ id }) => id === "GRD-ACT-ENQUEUE").label = "Enqueue Submission for AI Assessment";
  const processingStatusWrites = new Map([
    ["GRD-ACT-ENQUEUE", ["QUEUED"]],
    ["GRD-ACT-PROCESS", ["PROCESSING"]],
    ["GRD-ACT-ROUTE", ["SUCCEEDED"]],
    ["GRD-ACT-ROUTE-UNSUPPORTED", ["SUCCEEDED"]],
    ["GRD-ACT-ROUTE-AI-UNAVAILABLE", ["FAILED"]],
    ["GRD-ACT-ACCEPT-SUGGESTION", ["SUCCEEDED"]],
    ["GRD-ACT-OVERRIDE-SCORE", ["SUCCEEDED"]],
    ["GRD-ACT-MANUAL-GRADE", ["SUCCEEDED"]],
    ["GRD-ACT-BATCH-CONFIRM", ["SUCCEEDED"]],
    ["GRD-ACT-CONFIRM-REVISION", ["SUCCEEDED"]],
  ]);
  for (const [actionId, codes] of processingStatusWrites) {
    const action = module.actions.find(({ id }) => id === actionId);
    action.statusWrites = [
      ...(action.statusWrites ?? []),
      { fieldId: "GRD-DECISION-F-PROCESSING-STATUS", codes },
    ];
  }
  const enqueue = module.actions.find(({ id }) => id === "GRD-ACT-ENQUEUE");
  enqueue.derivedJudgmentWriteContract = structuredClone(decision.derivedJudgmentContract);
  enqueue.statusWrites.push(
    { fieldId: "GRD-DECISION-F-DERIVATION-VALIDITY-STATUS", codes: ["PENDING_VALIDATION"] },
    { fieldId: "GRD-DECISION-F-DERIVATION-DISPUTE-STATUS", codes: ["UNCHALLENGED"] },
  );
  const openConfirmedRevision = module.actions.find(({ id }) => (
    id === "GRD-ACT-OPEN-CONFIRMED-REVISION"
  ));
  appendActionOutputs(module, openConfirmedRevision.id, [
    "GRD-DECISION-F-DERIVATION-VALIDITY-STATUS",
    "GRD-DECISION-F-DERIVATION-DISPUTE-STATUS",
  ]);
  openConfirmedRevision.statusWrites = [
    ...(openConfirmedRevision.statusWrites ?? []),
    { fieldId: "GRD-DECISION-F-DERIVATION-VALIDITY-STATUS", codes: ["PENDING_VALIDATION"] },
    { fieldId: "GRD-DECISION-F-DERIVATION-DISPUTE-STATUS", codes: ["CORRECTION_PENDING"] },
  ];
  openConfirmedRevision.derivedJudgmentRecomputationContract = structuredClone(
    decision.derivedJudgmentContract.recomputation,
  );
  for (const actionId of [
    "GRD-ACT-ROUTE",
    "GRD-ACT-ROUTE-UNSUPPORTED",
    "GRD-ACT-ROUTE-AI-UNAVAILABLE",
  ]) {
    const action = module.actions.find(({ id }) => id === actionId);
    appendActionOutputs(module, actionId, ["GRD-DECISION-F-DERIVATION-VALIDITY-STATUS"]);
    action.statusWrites.push({
      fieldId: "GRD-DECISION-F-DERIVATION-VALIDITY-STATUS",
      codes: ["VALID"],
    });
  }
  for (const actionId of nextStepWriterActionIds) {
    const action = module.actions.find(({ id }) => id === actionId);
    const allowedCodes = NEXT_STEP_WRITER_MATRIX[actionId];
    action.statusWrites = [
      ...(action.statusWrites ?? []),
      { fieldId: "GRD-DECISION-F-NEXT-STEP", codes: [...allowedCodes] },
    ];
    action.nextStepOutcomeContract = {
      fieldId: "GRD-DECISION-F-NEXT-STEP",
      allowedCodes: [...allowedCodes],
      sourceClassificationFieldId: "GRD-ATTEMPT-CLASS-F-CLASSIFICATION",
      sourceClassificationRefFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
      sourceClassificationVersionFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
      sourceClassificationTargetVersionFieldId: "GRD-ATTEMPT-CLASS-F-VERSION",
      exactClassificationVersionRequired: true,
      allowedByInitialAttemptClassification: structuredClone(INITIAL_ATTEMPT_NEXT_STEP_MATRIX),
      unknownClassificationBehavior: "KEEP_UNPUBLISHED_AND_REQUEST_REVIEWABLE_INPUT",
      explicitDontKnowMayWriteCompleted: false,
      completionCreatesMasteryEvidence: false,
    };
  }
  reframeActionScenarios(module, "GRD-ACT-PROCESS", "source-pinned AI assessment produces a verifiable result and explicit next step");
  reframeActionScenarios(module, "GRD-ACT-ROUTE", "the routine AI assessment selects one of the five closed next steps without inserting a professional exception step");
  reframeActionScenarios(module, "GRD-ACT-ROUTE-UNSUPPORTED", "concrete missing source or input evidence is requested before any conclusion");
  reframeActionScenarios(module, "GRD-ACT-ROUTE-AI-UNAVAILABLE", "a permitted alternate review is attempted before professional exception escalation");
  reframeProfessionalSourceAction(
    module,
    "GRD-ACT-CORRECT-RECOGNITION",
    "Correct a Derived Recognition Version",
    "the assigned subject teacher corrects derived recognition against cited original evidence without changing the original submission",
  );
  reframeProfessionalSourceAction(
    module,
    "GRD-ACT-RESOLVE-VERSION-CONFLICT",
    "Resolve an Assessment Source-version Conflict",
    "the assigned subject teacher selects the authorized current source version without deciding the routine AI assessment result",
  );

  markProfessionalExceptionAction(module, "GRD-ACT-ACCEPT-SUGGESTION", "Resolve an Authorized Exception Using the Existing AI Result");
  markProfessionalExceptionAction(module, "GRD-ACT-OVERRIDE-SCORE", "Create an Evidence-backed Professional Exception Correction");
  markProfessionalExceptionAction(module, "GRD-ACT-MANUAL-GRADE", "Resolve an Authorized Professional Assessment Exception");
  markProfessionalExceptionAction(module, "GRD-ACT-BATCH-CONFIRM", "Resolve a Bounded Batch Professional Exception Scope");
  markProfessionalExceptionAction(module, "GRD-ACT-OPEN-CONFIRMED-REVISION", "Open an Evidence-backed Result Correction Version");
  markProfessionalExceptionAction(module, "GRD-ACT-CONFIRM-REVISION", "Publish a Professional Exception Correction Version");

  module.aiAssessmentContract = {
    productTerm: "AI 评定与完成判定",
    routineTeacherAssessment: false,
    statusAxes: structuredClone(RESULT_STATUS_AXES),
    statusAxisWriters: [{
      axis: "PROCESSING_STATUS",
      fieldId: "GRD-DECISION-F-PROCESSING-STATUS",
      writerActionIds: [...processingStatusWrites.keys()],
    }],
    nextStep: {
      fieldId: "GRD-DECISION-F-NEXT-STEP",
      optionSetId: "OPT-AI2-005",
      values: [...NEXT_STEPS],
      requiredForEverySubmission: true,
      requiredForEveryDeterminedResult: true,
      allowedNoValueStates: ["QUEUED", "PROCESSING"],
      writerActionIds: [...nextStepWriterActionIds],
      writerOutcomeMatrix: structuredClone(NEXT_STEP_WRITER_MATRIX),
      initialAttemptOutcomeMatrix: structuredClone(INITIAL_ATTEMPT_NEXT_STEP_MATRIX),
      explicitDontKnowMayWriteCompleted: false,
    },
    structuredResult: {
      requiredComponents: [
        "ACTIVITY_PUBLICATION_RULE",
        "ACTUAL_HELP_ENVIRONMENT",
        "ORIGINAL_SUBMISSION",
        "RECOGNITION_VERSION",
        "INPUT_QUALITY",
        "ASSESSMENT_STANDARD_VERSION",
        "EVIDENCE_REFERENCES",
        "CONCLUSION",
        "FEEDBACK",
        "NEXT_STEP",
      ],
      sourceVersionPinned: true,
    },
    unableToDetermine: {
      stages: [
        "SOURCE_QUALITY_CHECK",
        "CONCRETE_SUPPLEMENT_REQUEST",
        "PERMITTED_ALTERNATE_REVIEW",
        "PROFESSIONAL_EXCEPTION_QUEUE",
      ],
      routineTeacherAssessment: false,
      unresolvedState: "UNPUBLISHED_UNDECIDED",
    },
  };
  module.initialValidAttemptContract = {
    sourceObjectId: "SUB-OBJ-ATTEMPT",
    classificationObjectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
    classificationFieldId: "GRD-ATTEMPT-CLASS-F-CLASSIFICATION",
    classifyActionId: "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT",
    optionSetId: "OPT-AI2-008",
    valid: ["SUBSTANTIVE_RESPONSE", "EXPLICIT_DONT_KNOW"],
    invalid: ["BLANK", "UNRELATED", "PLACEHOLDER"],
    explicitDontKnowMeansCompleted: false,
    explicitDontKnowCreatesMasteryEvidence: false,
    nextStepDeterminedBy: "EVIDENCE_AND_FROZEN_ASSESSMENT_STANDARD",
    originalSubmissionWritePolicy: "FORBIDDEN",
    decisionBinding: {
      decisionObjectId: "GRD-OBJ-DECISION",
      refFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
      versionFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
      targetVersionFieldId: "GRD-ATTEMPT-CLASS-F-VERSION",
      boundBeforeActionIds: [...classificationBoundActionIds],
      exactVersionRequired: true,
    },
  };
  module.assessmentStandardContract = {
    objectId: ASSESSMENT_STANDARD_OBJECT_ID,
    generationEventId: ASSESSMENT_STANDARD_EVENT_ID,
    generateActionId: "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD",
    resolveActionId: ASSESSMENT_READINESS_ACTION_ID,
    identityFieldId: ASSESSMENT_STANDARD_ID_FIELD,
    versionFieldId: ASSESSMENT_STANDARD_VERSION_FIELD,
    activitySnapshotFieldIds: [
      "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF",
      "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION",
    ],
    requiredContentFieldIds: [
      "GRD-STANDARD-F-ANSWER-OR-DIMENSIONS",
      "GRD-STANDARD-F-KEY-POINTS",
      "GRD-STANDARD-F-ACCEPTABLE-ANSWERS",
      "GRD-STANDARD-F-COMMON-ERRORS",
      "GRD-STANDARD-F-SCORE-OR-LEVEL-RULE",
      "GRD-STANDARD-F-COMPLETION-THRESHOLD",
      "GRD-STANDARD-F-HELP-BOUNDARY",
    ],
    generatedBeforeStudentAnswer: true,
    phaseTwoActivationGate: {
      enforcementBoundary: "PHASE_TWO_ACTIVITY_ACTIVATION",
      actionId: ASSESSMENT_READINESS_ACTION_ID,
      flowIds: ["DF-006"],
      sourceSnapshotRequired: true,
      frozenStandardRequired: true,
      requiredStandardState: "FROZEN",
      sourceSnapshotMatch: "EXACT_ACTIVITY_SNAPSHOT_ID_AND_VERSION",
      standardFrozenBeforeFirstAnswerRequired: true,
      successResult: "PHASE_TWO_ASSESSMENT_READY",
      failureBehavior: "KEEP_PHASE_TWO_ASSESSMENT_UNAVAILABLE",
      phaseOneSubmissionActionIds: [],
      phaseOneSubmissionBlocked: false,
      failClosedForPhaseTwoActivation: true,
    },
    immutableAfterGeneration: true,
    replacementPolicy: "NEW_ACTIVITY_OR_STANDARD_VERSION_ONLY",
    aiUseMode: "EXACT_SUBMISSION_BOUND_VERSION_ONLY",
    scoreOrLevelOptional: true,
    feedbackOnlyAllowed: true,
    defaultIdentifiedCompositeRankingAllowed: false,
    permanentStudentLabelAllowed: false,
    phaseOneSubmissionDependency: "NONE",
    sourceSnapshotInterface: structuredClone(PUBLICATION_SNAPSHOT_INTERFACE),
  };
  module.highImpactUseContract = {
    routineAssessmentSoleBasisForbiddenFor: [
      "DISCIPLINE",
      "PUBLIC_RANKING",
      "ADMISSION_OR_ADVANCEMENT",
      "IDENTITY_OR_BENEFIT_ELIGIBILITY",
      "OTHER_HIGH_IMPACT_DECISION",
    ],
    allowedTeachingUses: [
      "CORRECTION_ROUTING",
      "TEACHING_RECOMMENDATION",
      "VERSIONED_LEARNING_EVIDENCE",
    ],
    independentAuthorizedEvidenceRequired: true,
    defaultIdentifiedCompositeRankingAllowed: false,
    publicWeaknessRankingAllowed: false,
  };
  module.externalAiProcessingContract = {
    id: "EXTERNAL-AI-STUDENT-DATA-V2",
    providerActionIds: [...EXTERNAL_AI_PROVIDER_ACTION_IDS],
    providerExclusiveOutputFieldIds: [
      ...EXTERNAL_AI_PROVIDER_EXCLUSIVE_OUTPUT_FIELD_IDS,
    ],
    defaultStudentDataUses: {
      trainingAllowed: false,
      unrelatedReuseAllowed: false,
      unauthorizedTransferAllowed: false,
    },
    activationPreconditions: [
      "PROCESSING_CHAIN_AND_SUBPROCESSORS",
      "PROCESSING_REGION",
      "RETENTION_PERIOD",
      "DELETION_COMMITMENT_OR_EVIDENCE",
      "SECURITY_INCIDENT_RESPONSIBILITY",
      "EXIT_AND_TERMINATION_METHOD",
      "TASK_MINIMUM_NECESSARY_SCOPE",
    ],
    realStudentDataBlockedUntilComplete: true,
    taskMinimumNecessaryDataOnly: true,
    exceptionAuthorization: {
      separateFromGeneralServiceConsent: true,
      explicit: true,
      applicableToDeclaredPurpose: true,
      revocableWhenLegallyPermitted: true,
      legalValidityRequired: true,
      defaultAllowed: false,
    },
  };
  module.dataSeparationContract = {
    originalFactObjectIds: ["SUB-OBJ-ATTEMPT", "CORR-OBJ-ATTEMPT"],
    derivedJudgmentObjectIds: [
      "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
      "GRD-OBJ-DECISION",
      "PUB-OBJ-RESULT",
      "CORR-OBJ-ATTEMPT-ASSESSMENT",
    ],
    overwriteOriginalFactAllowed: false,
    sourceIdentityAndVersionRequired: true,
    derivedValidityDisputeAndSupersessionRequired: true,
  };
  module.aiTraceContract = {
    persistedFields: [
      "BUSINESS_TASK_ID",
      "EXTERNAL_REFERENCE",
      "MODEL_VERSION",
      "CAPABILITY_VERSION",
      "RULE_VERSION",
      "SAFETY_VERSION",
      "EVIDENCE_REFERENCES",
      "RESULT_REFERENCE",
      "GATE_OUTCOMES",
    ],
    fieldBindings: {
      BUSINESS_TASK_ID: "GRD-TRACE-F-BUSINESS-TASK-ID",
      EXTERNAL_REFERENCE: "GRD-TRACE-F-EXTERNAL-REFERENCE",
      MODEL_VERSION: "GRD-TRACE-F-MODEL-VERSION",
      CAPABILITY_VERSION: "GRD-TRACE-F-CAPABILITY-VERSION",
      RULE_VERSION: "GRD-TRACE-F-RULE-VERSION",
      SAFETY_VERSION: "GRD-TRACE-F-SAFETY-VERSION",
      EVIDENCE_REFERENCES: "GRD-TRACE-F-EVIDENCE-REFERENCES",
      RESULT_REFERENCE: "GRD-TRACE-F-RESULT-REFERENCE",
      GATE_OUTCOMES: "GRD-TRACE-F-GATE-OUTCOMES",
    },
    prohibitedPersistence: [
      "HIDDEN_CHAIN_OF_THOUGHT",
      "VENDOR_DEBUG_FIELDS",
      "FULL_UPSTREAM_REQUEST_BODY",
    ],
    duplicateStudentContentInTrace: false,
  };
  module.pages.find(({ id }) => id === "GRD-PAGE-DECISION").label = "AI Assessment Exception and Source Correction Workspace";
  return replaceLegacyAssessmentLanguage(module);
}

function resultChallengeObject() {
  const openActionId = "PUB-ACT-OPEN-RESULT-CHALLENGE";
  const fields = [
    systemField("PUB-CHALLENGE-F-ID", "Assessment Challenge ID", {
      dataType: "ID",
      required: true,
      mutability: "IMMUTABLE",
      idempotencyRole: "OBJECT_ID",
    }),
    versionPinnedRefField(
      "PUB-CHALLENGE-F-RESULT-REF",
      "Challenged Result Reference",
      "PUB-OBJ-RESULT",
      "PUB-CHALLENGE-F-RESULT-VERSION",
      "PUB-RESULT-F-RESULT-VERSION",
      openActionId,
    ),
    systemField("PUB-CHALLENGE-F-RESULT-VERSION", "Challenged Result Version", {
      dataType: "INTEGER",
      required: true,
      mutability: "IMMUTABLE",
    }),
    userField("PUB-CHALLENGE-F-STUDENT-REASON", "Student Challenge Reason", { dataType: "TEXT" }),
    userField("PUB-CHALLENGE-F-STUDENT-EVIDENCE-REFS", "Student Challenge Evidence References", {
      dataType: "STRING_ARRAY",
      required: false,
      mutability: "IMMUTABLE",
    }),
    userField("PUB-CHALLENGE-F-PROFESSIONAL-EVIDENCE-REFS", "Professional Resolution Evidence References", {
      dataType: "STRING_ARRAY",
      required: false,
    }),
    optionField("PUB-CHALLENGE-F-RESOLUTION", "Assessment Challenge Resolution", "OPT-AI2-010"),
    systemField("PUB-CHALLENGE-F-STATUS", "Assessment Challenge Status", { required: true }),
    systemField("PUB-CHALLENGE-F-VERSION", "Assessment Challenge Version", {
      dataType: "INTEGER",
      required: true,
      idempotencyRole: "OBJECT_VERSION",
    }),
  ];
  fields.find(({ id }) => id === "PUB-CHALLENGE-F-RESOLUTION").required = {
    description: "required when a challenge reaches RESOLVED",
    whenStates: ["RESOLVED"],
    whenActionIds: ["PUB-ACT-CLOSE-RESULT-CHALLENGE"],
  };
  return {
    id: "PUB-OBJ-RESULT-CHALLENGE",
    label: "Student Assessment Challenge and Professional Evidence",
    dataSubject: "STUDENT_ASSESSMENT_CHALLENGE",
    controlSubject: "SCHOOL",
    producerRef: "ROLE-STUDENT",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "DUTY-SUBJECT-TEACHER",
    stewardRef: "ROLE-ACADEMIC",
    lifecyclePolicyId: "LIFE-003",
    sensitivityId: "S3",
    stateReachability: { mode: "ACTION_GRAPH", initialStateIds: [] },
    states: ["OPEN", "EVIDENCE_SUBMITTED", "RESOLVED"],
    fields,
    lineageBindings: [{
      refFieldId: "PUB-CHALLENGE-F-RESULT-REF",
      versionFieldId: "PUB-CHALLENGE-F-RESULT-VERSION",
      targetObjectId: "PUB-OBJ-RESULT",
      targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
    }],
    studentDataClassification: {
      kind: "DETAIL",
      privilegedReadPolicy: "DEFAULT_DENY",
    },
    readMode: "NO_DIRECT_READ",
    professionalWritePolicy: {
      requiredAuthorizationBoundaryKind: "SUBJECT_COURSE_PROFESSIONAL_WRITE",
    },
  };
}

function addChallengeLifecycleActions(module) {
  const studentPermissions = [
    { effect: "ALLOW", roleRef: "ROLE-STUDENT", condition: "the student challenges only the student's own published result version" },
    { effect: "DENY", roleRef: "ROLE-TEACHER", condition: "a teacher cannot create a student challenge on the student's behalf" },
    { effect: "DENY", roleRef: "ROLE-SCHOOL-ADMIN", condition: "school administration has no default access to assessment challenge detail" },
    { effect: "DENY", roleRef: "ROLE-PLATFORM-OPS", condition: "platform operations has no default access to assessment challenge detail" },
  ];
  const professionalPermissions = [
    {
      effect: "ALLOW",
      dutyRef: "DUTY-SUBJECT-TEACHER",
      condition: "the assigned subject teacher submits verifiable professional evidence for the challenged result inside assigned subject and course scope",
      scope: { kind: "ASSIGNED_SUBJECT_COURSE", subjectMatch: "REQUIRED", courseMatch: "REQUIRED" },
    },
    { effect: "DENY", dutyRef: "DUTY-HOMEROOM", condition: "homeroom coordination cannot decide another subject's assessment challenge" },
    { effect: "DENY", roleRef: "ROLE-PLATFORM-OPS", condition: "platform operations cannot decide or rewrite a student assessment result" },
  ];
  addActionWithScenarios(module, {
    id: "PUB-ACT-OPEN-RESULT-CHALLENGE",
    label: "Open a Challenge against My Published Assessment Result",
    targetObjectId: "PUB-OBJ-RESULT-CHALLENGE",
    inputFieldIds: [
      "PUB-CHALLENGE-F-RESULT-REF",
      "PUB-CHALLENGE-F-RESULT-VERSION",
      "PUB-CHALLENGE-F-STUDENT-REASON",
      "PUB-CHALLENGE-F-STUDENT-EVIDENCE-REFS",
    ],
    outputFieldIds: ["PUB-CHALLENGE-F-ID", "PUB-CHALLENGE-F-STATUS", "PUB-CHALLENGE-F-VERSION"],
    operationKind: "CREATE",
    executionMode: "USER_TASK",
    clients: ["WEB", "APP"],
    permissions: studentPermissions,
    producedEventIds: [CHALLENGE_OPENED_EVENT_ID],
    relatedStateGuards: [{
      refFieldId: "PUB-CHALLENGE-F-RESULT-REF",
      versionFieldId: "PUB-CHALLENGE-F-RESULT-VERSION",
      targetObjectId: "PUB-OBJ-RESULT",
      requiredState: "PUBLISHED",
    }],
  }, {
    successState: "OPEN",
    successData: "creates a version-pinned challenge without changing the original submission or challenged result version",
    pageId: "PUB-PAGE-RESULT-CHALLENGE",
  });
  addActionWithScenarios(module, {
    id: "PUB-ACT-SUBMIT-PROFESSIONAL-EVIDENCE",
    label: "Submit Professional Evidence for an Assessment Challenge",
    targetObjectId: "PUB-OBJ-RESULT-CHALLENGE",
    inputFieldIds: [
      "PUB-CHALLENGE-F-ID",
      "PUB-CHALLENGE-F-VERSION",
      "PUB-CHALLENGE-F-PROFESSIONAL-EVIDENCE-REFS",
    ],
    outputFieldIds: [
      "PUB-CHALLENGE-F-PROFESSIONAL-EVIDENCE-REFS",
      "PUB-CHALLENGE-F-STATUS",
      "PUB-CHALLENGE-F-VERSION",
    ],
    operationKind: "UPDATE",
    transition: { from: "OPEN", to: "EVIDENCE_SUBMITTED" },
    executionMode: "USER_TASK",
    clients: ["WEB", "APP"],
    permissions: professionalPermissions,
    producedEventIds: [PROFESSIONAL_EVIDENCE_EVENT_ID],
    authorizationBoundary: { kind: "SUBJECT_COURSE_PROFESSIONAL_WRITE" },
  }, {
    successState: "EVIDENCE_SUBMITTED",
    successData: "adds a versioned professional evidence set while preserving the student's challenge and challenged result",
    pageId: "PUB-PAGE-CORRECTION",
  });

  const systemResultPermissions = [
    { effect: "ALLOW", actorRef: "SYSTEM", condition: "a versioned challenge event updates only the dispute axis of its exact result version" },
    { effect: "DENY", actorRef: "CURRENT_ACTOR", condition: "a user cannot invoke an internal result-axis synchronization action" },
  ];
  for (const [id, label, eventId, disputeCode] of [
    ["PUB-ACT-MARK-RESULT-CHALLENGED", "Mark a Result Version as Challenged", CHALLENGE_OPENED_EVENT_ID, "CHALLENGED"],
    ["PUB-ACT-MARK-RESULT-CORRECTION-PENDING", "Mark a Result Version as Pending Professional Resolution", PROFESSIONAL_EVIDENCE_EVENT_ID, "CORRECTION_PENDING"],
  ]) {
    addActionWithScenarios(module, {
      id,
      label,
      targetObjectId: "PUB-OBJ-RESULT",
      inputFieldIds: [
        "PUB-RESULT-F-CHALLENGE-REF",
        "PUB-RESULT-F-CHALLENGE-VERSION",
      ],
      outputFieldIds: [
        "PUB-RESULT-F-CHALLENGE-REF",
        "PUB-RESULT-F-CHALLENGE-VERSION",
        "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS",
        "PUB-RESULT-F-RESULT-VERSION",
      ],
      operationKind: "UPDATE",
      transition: { from: "PUBLISHED", to: "PUBLISHED" },
      executionMode: "SYSTEM_EVENT",
      trigger: { kind: "EVENT", eventId },
      permissions: systemResultPermissions,
      statusWrites: [{
        fieldId: "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS",
        codes: [disputeCode],
      }],
    }, {
      successState: "PUBLISHED",
      successData: "updates only the dispute-correction axis and retains the published result content and prior versions",
    });
  }

  addActionWithScenarios(module, {
    id: "PUB-ACT-CLOSE-RESULT-CHALLENGE",
    label: "Close a Resolved Assessment Challenge",
    targetObjectId: "PUB-OBJ-RESULT-CHALLENGE",
    inputFieldIds: ["PUB-CHALLENGE-F-ID", "PUB-CHALLENGE-F-VERSION", "PUB-CHALLENGE-F-RESOLUTION"],
    outputFieldIds: ["PUB-CHALLENGE-F-RESOLUTION", "PUB-CHALLENGE-F-STATUS", "PUB-CHALLENGE-F-VERSION"],
    operationKind: "UPDATE",
    transition: { from: ["OPEN", "EVIDENCE_SUBMITTED"], to: "RESOLVED" },
    executionMode: "SYSTEM_EVENT",
    trigger: { kind: "EVENT", eventId: CHALLENGE_RESOLVED_EVENT_ID },
    permissions: [
      { effect: "ALLOW", actorRef: "SYSTEM", condition: "an audited result resolution closes only the linked challenge version" },
      { effect: "DENY", actorRef: "CURRENT_ACTOR", condition: "a user cannot close a challenge without one recorded resolution action" },
    ],
  }, {
    successState: "RESOLVED",
    successData: "records the exact correction, replacement, invalidation, or upheld resolution and retains all prior versions",
  });
  return { professionalPermissions };
}

function publicationModule() {
  const module = markPlanned(structuredClone(
    teachingLoopModules.find(({ id }) => id === "PUB-001"),
  ));
  module.title = "AI Assessment Publication, Feedback, and Result Correction";
  module.objective = "Publish only gate-passed AI results, expose the permitted feedback layer, and correct impacted derived versions without overwriting history";
  module.entryConditions = [
    "the AI assessment references fixed source versions and has one explicit next step",
  ];
  module.exitConditions = [
    "the result remains unpublished or is published under one shared answer-open policy with every superseded version retained",
  ];
  module.productDecisionIds = ["D062", "D063", "D071", "D074", "D075", "D076", "D077", "D078"];

  const result = module.objects.find(({ id }) => id === "PUB-OBJ-RESULT");
  const challenge = resultChallengeObject();
  module.objects.push(challenge);
  module.relationships.push({
    id: "PUB-REL-CHALLENGE-RESULT-VERSION",
    fromObjectId: challenge.id,
    toObjectId: result.id,
    type: "REFERENCES",
    cardinality: "MANY_TO_ONE",
    ownershipScope: "SAME_STUDENT",
    onSourceInvalidation: "retain the challenge and challenged result version, then mark unresolved derived use stale without rewriting either history",
  });
  result.producerRef = "SYSTEM";
  result.confirmerRef = "SYSTEM";
  result.dataNature = "AI_DERIVED_JUDGMENT";
  result.originalFactOverwritePolicy = "FORBIDDEN";
  for (const [fieldId, whenStates, whenActionIds] of [
    ["PUB-RESULT-F-CORRECTION-DECISION-REF", ["INVALIDATED"], ["PUB-ACT-CORRECT-RESULT"]],
    ["PUB-RESULT-F-NEW-DECISION-VERSION", ["INVALIDATED"], ["PUB-ACT-CORRECT-RESULT"]],
    ["PUB-RESULT-F-CORRECTION-VERSION", ["INVALIDATED"], ["PUB-ACT-CORRECT-RESULT"]],
    [
      "PUB-RESULT-F-INVALIDATION-VERSION",
      ["INVALIDATED", "PUBLISHED"],
      ["PUB-ACT-CORRECT-RESULT", "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION"],
    ],
    [
      "PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS",
      ["INVALIDATED", "PUBLISHED"],
      ["PUB-ACT-CORRECT-RESULT", "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION"],
    ],
  ]) {
    result.fields.find(({ id }) => id === fieldId).required = {
      description: "required only for the declared version-preserving batch correction writer",
      whenStates,
      whenActionIds,
    };
  }

  const fields = [
    optionField("PUB-RESULT-F-PUBLICATION-STATUS", "AI Result Publication Status", "OPT-AI2-002"),
    optionField("PUB-RESULT-F-DISPUTE-CORRECTION-STATUS", "AI Result Dispute and Correction Status", "OPT-AI2-003"),
    optionField("PUB-RESULT-F-VALIDITY-STATUS", "AI Result Validity Status", "OPT-AI2-004"),
    optionField("PUB-RESULT-F-PERMISSION-GATE", "Permission and Input-isolation Gate", "OPT-AI2-006"),
    optionField("PUB-RESULT-F-SAFETY-GATE", "Safety Gate", "OPT-AI2-006"),
    optionField("PUB-RESULT-F-TEACHING-CORRECTNESS-GATE", "Teaching Correctness Gate", "OPT-AI2-006"),
    systemField("PUB-RESULT-F-FEEDBACK-LAYER-1", "Feedback Layer 1: Result and Error Location", { dataType: "JSON" }),
    systemField("PUB-RESULT-F-FEEDBACK-LAYER-2", "Feedback Layer 2: Non-answer Scaffold", { dataType: "JSON" }),
    systemField("PUB-RESULT-F-FEEDBACK-LAYER-3", "Feedback Layer 3: Targeted Teaching", { dataType: "JSON" }),
    systemField("PUB-RESULT-F-FEEDBACK-LAYER-4", "Feedback Layer 4: Complete Answer and Solution", { dataType: "JSON" }),
    systemField(ASSESSMENT_STANDARD_CONTENT_FIELD_ID, "Opened Assessment Standard Content", { dataType: "JSON" }),
    systemField("PUB-RESULT-F-ANSWER-OPEN-AT", "Complete Answer Open Time", { dataType: "DATETIME", mutability: "IMMUTABLE" }),
    systemField("PUB-RESULT-F-SOLUTION-OPEN-AT", "Complete Solution Open Time", { dataType: "DATETIME", mutability: "IMMUTABLE" }),
    systemField("PUB-RESULT-F-RUBRIC-OPEN-AT", "Assessment Standard Open Time", { dataType: "DATETIME", mutability: "IMMUTABLE" }),
    systemField("PUB-RESULT-F-ANSWER-OPEN-POLICY-ID", "Answer-open Policy ID", { dataType: "ID", mutability: "IMMUTABLE" }),
    systemField("PUB-RESULT-F-ANSWER-OPEN-POLICY-VERSION", "Answer-open Policy Version", { dataType: "INTEGER", mutability: "IMMUTABLE" }),
    {
      ...systemField("PUB-RESULT-F-PRIOR-RESULT-REF", "Prior Result Reference", {
        dataType: "ID",
        mutability: "IMMUTABLE",
      }),
      valueSource: { kind: "OBJECT_REF", targetObjectId: "PUB-OBJ-RESULT" },
      referenceIntegrity: "VERSION_PINNED",
      stateGuardPolicy: "NONE",
      actionApplicability: { requiredActionIds: [] },
      versionBinding: {
        versionFieldId: "PUB-RESULT-F-PRIOR-RESULT-VERSION",
        targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
      },
    },
    systemField("PUB-RESULT-F-PRIOR-RESULT-VERSION", "Prior Result Version", { dataType: "INTEGER", mutability: "IMMUTABLE" }),
    {
      ...systemField("PUB-RESULT-F-CHALLENGE-REF", "Assessment Challenge Reference", {
        dataType: "ID",
        mutability: "IMMUTABLE",
      }),
      valueSource: { kind: "OBJECT_REF", targetObjectId: "PUB-OBJ-RESULT-CHALLENGE" },
      referenceIntegrity: "VERSION_PINNED",
      stateGuardPolicy: "NONE",
      actionApplicability: { requiredActionIds: [] },
      versionBinding: {
        versionFieldId: "PUB-RESULT-F-CHALLENGE-VERSION",
        targetVersionFieldId: "PUB-CHALLENGE-F-VERSION",
      },
    },
    systemField("PUB-RESULT-F-CHALLENGE-VERSION", "Assessment Challenge Version", { dataType: "INTEGER", mutability: "IMMUTABLE" }),
    optionField("PUB-RESULT-F-RESOLUTION-KIND", "Assessment Challenge Resolution Kind", "OPT-AI2-010"),
    systemField("PUB-RESULT-F-RESOLUTION-EVIDENCE-REFS", "Resolution Evidence References", { dataType: "STRING_ARRAY", mutability: "IMMUTABLE" }),
  ];
  for (const fieldId of [
    "PUB-RESULT-F-PUBLICATION-STATUS",
    "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS",
    "PUB-RESULT-F-VALIDITY-STATUS",
    ...FEEDBACK_LAYER_FIELD_IDS,
    ASSESSMENT_STANDARD_CONTENT_FIELD_ID,
    ...ANSWER_OPEN_TIME_FIELD_IDS,
    ...ANSWER_OPEN_POLICY_FIELD_IDS,
  ]) fields.find(({ id }) => id === fieldId).required = true;
  appendObjectFields(module, "PUB-OBJ-RESULT", fields, { includeInPages: false });
  for (const { fieldId, category, visibleAtFieldId } of RESTRICTED_RESULT_CONTENT_FIELDS) {
    const field = result.fields.find(({ id }) => id === fieldId);
    field.restrictedContent = {
      category,
      policyId: "ANSWER-OPEN-POLICY-V2",
      visibleAtFieldId,
      requiredOnEveryDeliverySurface: true,
    };
    field.releaseRequirement = {
      readPolicyId: "PUB-RP-STUDENT-RESULT",
      requiredState: "PUBLISHED",
      visibleAtFieldId,
    };
  }
  result.lineageBindings = [
    ...(result.lineageBindings ?? []),
    {
      refFieldId: "PUB-RESULT-F-PRIOR-RESULT-REF",
      versionFieldId: "PUB-RESULT-F-PRIOR-RESULT-VERSION",
      targetObjectId: "PUB-OBJ-RESULT",
      targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
    },
    {
      refFieldId: "PUB-RESULT-F-CHALLENGE-REF",
      versionFieldId: "PUB-RESULT-F-CHALLENGE-VERSION",
      targetObjectId: "PUB-OBJ-RESULT-CHALLENGE",
      targetVersionFieldId: "PUB-CHALLENGE-F-VERSION",
    },
  ];
  result.derivedJudgmentContract = {
    sourceRefFieldId: "PUB-RESULT-F-SOURCE-DECISION-REF",
    sourceVersionFieldId: "PUB-RESULT-F-DECISION-VERSION",
    validityFieldId: "PUB-RESULT-F-VALIDITY-STATUS",
    disputeFieldId: "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS",
    priorRefFieldId: "PUB-RESULT-F-PRIOR-RESULT-REF",
    priorVersionFieldId: "PUB-RESULT-F-PRIOR-RESULT-VERSION",
    supersessionReasonFieldId: "PUB-RESULT-F-PUBLIC-CORRECTION-NOTE",
    versionFieldId: "PUB-RESULT-F-RESULT-VERSION",
    sourceOverwriteAllowed: false,
    recomputationCreatesNewVersion: true,
    priorVersionRequiredWhenRecomputed: true,
    initialization: {
      actionId: "PUB-ACT-MATERIALIZE-RESULT",
      validityCode: "PENDING_VALIDATION",
      disputeCode: "UNCHALLENGED",
    },
    recomputation: {
      actionIds: [
        "PUB-ACT-CORRECT-RESULT",
        "PUB-ACT-CORRECT-CHALLENGED-RESULT",
        "PUB-ACT-REPLACE-RESULT",
        "PUB-ACT-INVALIDATE-RESULT",
        "PUB-ACT-UPHOLD-RESULT",
      ],
      requiredOutputFieldIds: [
        "PUB-RESULT-F-PRIOR-RESULT-REF",
        "PUB-RESULT-F-PRIOR-RESULT-VERSION",
        "PUB-RESULT-F-PUBLIC-CORRECTION-NOTE",
        "PUB-RESULT-F-RESULT-VERSION",
        "PUB-RESULT-F-VALIDITY-STATUS",
        "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS",
      ],
      statusWritesByActionId: {
        "PUB-ACT-CORRECT-RESULT": {
          validityCode: "INVALIDATED",
          disputeCode: "CORRECTION_PENDING",
        },
        "PUB-ACT-CORRECT-CHALLENGED-RESULT": {
          validityCode: "VALID",
          disputeCode: "RESOLVED",
        },
        "PUB-ACT-REPLACE-RESULT": {
          validityCode: "VALID",
          disputeCode: "RESOLVED",
        },
        "PUB-ACT-INVALIDATE-RESULT": {
          validityCode: "INVALIDATED",
          disputeCode: "RESOLVED",
        },
        "PUB-ACT-UPHOLD-RESULT": {
          validityCode: "VALID",
          disputeCode: "RESOLVED",
        },
      },
    },
  };
  appendActionOutputs(module, "PUB-ACT-MATERIALIZE-RESULT", [
    "PUB-RESULT-F-PUBLICATION-STATUS",
    "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS",
    "PUB-RESULT-F-VALIDITY-STATUS",
    ...FEEDBACK_LAYER_FIELD_IDS,
    ASSESSMENT_STANDARD_CONTENT_FIELD_ID,
    ...ANSWER_OPEN_TIME_FIELD_IDS,
    ...ANSWER_OPEN_POLICY_FIELD_IDS,
  ]);
  const materializeResult = module.actions.find(({ id }) => id === "PUB-ACT-MATERIALIZE-RESULT");
  materializeResult.statusWrites = [
    { fieldId: "PUB-RESULT-F-PUBLICATION-STATUS", codes: ["UNPUBLISHED"] },
    { fieldId: "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS", codes: ["UNCHALLENGED"] },
    { fieldId: "PUB-RESULT-F-VALIDITY-STATUS", codes: ["PENDING_VALIDATION"] },
  ];
  materializeResult.derivedJudgmentWriteContract = structuredClone(result.derivedJudgmentContract);
  appendActionOutputs(module, "PUB-ACT-PUBLISH-RESULT", [
    "PUB-RESULT-F-PUBLICATION-STATUS",
    "PUB-RESULT-F-VALIDITY-STATUS",
    "PUB-RESULT-F-PERMISSION-GATE",
    "PUB-RESULT-F-SAFETY-GATE",
    "PUB-RESULT-F-TEACHING-CORRECTNESS-GATE",
    "PUB-RESULT-F-RESULT-VERSION",
  ]);
  module.actions.find(({ id }) => id === "PUB-ACT-PUBLISH-RESULT").statusWrites = [
    { fieldId: "PUB-RESULT-F-PUBLICATION-STATUS", codes: ["PUBLISHED", "WITHHELD"] },
    { fieldId: "PUB-RESULT-F-VALIDITY-STATUS", codes: ["VALID"] },
  ];
  const { professionalPermissions } = addChallengeLifecycleActions(module);
  const resultAxisOutputFieldIds = [
    "PUB-RESULT-F-PUBLICATION-STATUS",
    "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS",
    "PUB-RESULT-F-VALIDITY-STATUS",
    "PUB-RESULT-F-RESULT-VERSION",
  ];
  const resultHistoryOutputFieldIds = [
    "PUB-RESULT-F-PRIOR-RESULT-REF",
    "PUB-RESULT-F-PRIOR-RESULT-VERSION",
  ];
  const challengeResolutionOutputFieldIds = [
    ...resultHistoryOutputFieldIds,
    "PUB-RESULT-F-PUBLIC-CORRECTION-NOTE",
    "PUB-RESULT-F-CHALLENGE-REF",
    "PUB-RESULT-F-CHALLENGE-VERSION",
    "PUB-RESULT-F-RESOLUTION-KIND",
    "PUB-RESULT-F-RESOLUTION-EVIDENCE-REFS",
    ...resultAxisOutputFieldIds,
  ];
  const correctResult = module.actions.find(({ id }) => id === "PUB-ACT-CORRECT-RESULT");
  correctResult.label = "Correct Affected Result Versions from a Confirmed Source Revision";
  correctResult.transition = { from: "PUBLISHED", to: "INVALIDATED" };
  correctResult.outputFieldIds = [...new Set([
    ...correctResult.outputFieldIds,
    ...resultHistoryOutputFieldIds,
    "PUB-RESULT-F-PUBLIC-CORRECTION-NOTE",
    ...resultAxisOutputFieldIds,
  ])];
  correctResult.statusWrites = [
    { fieldId: "PUB-RESULT-F-PUBLICATION-STATUS", codes: ["WITHHELD"] },
    { fieldId: "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS", codes: ["CORRECTION_PENDING"] },
    { fieldId: "PUB-RESULT-F-VALIDITY-STATUS", codes: ["INVALIDATED"] },
  ];
  for (const scenario of module.scenarios.filter(({ actionId }) => actionId === correctResult.id)) {
    if (scenario.kind === "SUCCESS") scenario.then.expectedState = { mode: "STATE", value: "INVALIDATED" };
    scenario.then.expectedData = "creates a corrected result version from the confirmed source revision, links the prior result version, and withholds derived use until reconfirmation";
  }

  const reconfirmResult = module.actions.find(({ id }) => (
    id === "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION"
  ));
  reconfirmResult.outputFieldIds = [...new Set([
    ...reconfirmResult.outputFieldIds,
    ...resultAxisOutputFieldIds,
  ])];
  reconfirmResult.statusWrites = [
    { fieldId: "PUB-RESULT-F-PUBLICATION-STATUS", codes: ["PUBLISHED"] },
    { fieldId: "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS", codes: ["RESOLVED"] },
    { fieldId: "PUB-RESULT-F-VALIDITY-STATUS", codes: ["VALID"] },
  ];

  for (const [id, label, resolutionCode, publicationCode, validityCode, successState] of [
    ["PUB-ACT-CORRECT-CHALLENGED-RESULT", "Correct a Challenged Result as a New Version", "CORRECTED", "PUBLISHED", "VALID", "PUBLISHED"],
    ["PUB-ACT-REPLACE-RESULT", "Replace a Challenged Result with a New Version", "REPLACED", "PUBLISHED", "VALID", "PUBLISHED"],
    ["PUB-ACT-INVALIDATE-RESULT", "Invalidate a Challenged Result without Replacement", "INVALIDATED", "WITHHELD", "INVALIDATED", "INVALIDATED"],
    ["PUB-ACT-UPHOLD-RESULT", "Uphold a Challenged Result with Evidence", "UPHELD", "PUBLISHED", "VALID", "PUBLISHED"],
  ]) {
    addActionWithScenarios(module, {
      id,
      label,
      targetObjectId: "PUB-OBJ-RESULT",
      inputFieldIds: [
        "PUB-RESULT-F-CHALLENGE-REF",
        "PUB-RESULT-F-CHALLENGE-VERSION",
        "PUB-RESULT-F-PUBLIC-CORRECTION-NOTE",
      ],
      outputFieldIds: [...challengeResolutionOutputFieldIds],
      operationKind: "UPDATE",
      transition: { from: "PUBLISHED", to: successState },
      executionMode: "USER_TASK",
      clients: ["WEB", "APP"],
      permissions: structuredClone(professionalPermissions),
      producedEventIds: [CHALLENGE_RESOLVED_EVENT_ID],
      authorizationBoundary: { kind: "SUBJECT_COURSE_PROFESSIONAL_WRITE" },
      statusWrites: [
        { fieldId: "PUB-RESULT-F-PUBLICATION-STATUS", codes: [publicationCode] },
        { fieldId: "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS", codes: ["RESOLVED"] },
        { fieldId: "PUB-RESULT-F-VALIDITY-STATUS", codes: [validityCode] },
        { fieldId: "PUB-RESULT-F-RESOLUTION-KIND", codes: [resolutionCode] },
      ],
    }, {
      successState,
      successData: `${label} creates an auditable result version that retains the challenge, evidence, and prior result version`,
      pageId: "PUB-PAGE-CORRECTION",
    });
  }
  for (const actionId of result.derivedJudgmentContract.recomputation.actionIds) {
    module.actions.find(({ id }) => id === actionId).derivedJudgmentRecomputationContract = (
      structuredClone(result.derivedJudgmentContract.recomputation)
    );
  }

  module.pages.push({
    id: "PUB-PAGE-RESULT-CHALLENGE",
    label: "Open a Challenge against My Published Assessment Result",
    clients: ["WEB", "APP"],
    objectId: challenge.id,
    fieldIds: challenge.fields.map(({ id }) => id),
    actionIds: ["PUB-ACT-OPEN-RESULT-CHALLENGE"],
    regions: ["CONTEXT_HEADER", "TASK_WORK_AREA", "RESULT_AND_FAILURE_STATUS"],
    viewStates: ["LOADING", "READY", "ERROR", "FORBIDDEN", "STALE_VERSION"],
    availability: RELEASE_STATUS.PLANNED,
  });
  const correctionPage = module.pages.find(({ id }) => id === "PUB-PAGE-CORRECTION");
  correctionPage.objectIds = [...new Set([...(correctionPage.objectIds ?? [correctionPage.objectId]), challenge.id])];
  delete correctionPage.objectId;
  correctionPage.fieldIds.push(...[
    ...challenge.fields.map(({ id }) => id),
    "PUB-RESULT-F-CHALLENGE-REF",
    "PUB-RESULT-F-CHALLENGE-VERSION",
  ].filter((id) => !correctionPage.fieldIds.includes(id)));
  correctionPage.actionIds.push(
    "PUB-ACT-SUBMIT-PROFESSIONAL-EVIDENCE",
    "PUB-ACT-CORRECT-CHALLENGED-RESULT",
    "PUB-ACT-REPLACE-RESULT",
    "PUB-ACT-INVALIDATE-RESULT",
    "PUB-ACT-UPHOLD-RESULT",
  );

  const publicationGateFieldIds = [
    "PUB-RESULT-F-PERMISSION-GATE",
    "PUB-RESULT-F-SAFETY-GATE",
    "PUB-RESULT-F-TEACHING-CORRECTNESS-GATE",
  ];
  const publicationWriterActionIds = [
    "PUB-ACT-PUBLISH-RESULT",
    "PUB-ACT-RETRY-FAILED",
    "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
    "PUB-ACT-CORRECT-CHALLENGED-RESULT",
    "PUB-ACT-REPLACE-RESULT",
    "PUB-ACT-UPHOLD-RESULT",
  ];
  const publishedVersionReplacementWriterActionIds = [
    "PUB-ACT-CORRECT-CHALLENGED-RESULT",
    "PUB-ACT-REPLACE-RESULT",
    "PUB-ACT-UPHOLD-RESULT",
  ];
  for (const actionId of publicationWriterActionIds) {
    const action = module.actions.find(({ id }) => id === actionId);
    appendActionOutputs(module, actionId, publicationGateFieldIds);
    action.gateEvaluation = {
      gateFieldIds: [...publicationGateFieldIds],
      requiredPassCode: "PASS",
      anyOtherOutcome: "KEEP_UNPUBLISHED",
      evaluatedAtomicallyWithPublication: true,
    };
  }
  const publishResult = module.actions.find(({ id }) => id === "PUB-ACT-PUBLISH-RESULT");
  const retryFailed = module.actions.find(({ id }) => id === "PUB-ACT-RETRY-FAILED");
  appendActionOutputs(module, retryFailed.id, [
    "PUB-RESULT-F-PUBLICATION-STATUS",
    "PUB-RESULT-F-VALIDITY-STATUS",
  ]);
  retryFailed.statusWrites = [
    ...(retryFailed.statusWrites ?? []),
    { fieldId: "PUB-RESULT-F-PUBLICATION-STATUS", codes: ["PUBLISHED"] },
    { fieldId: "PUB-RESULT-F-VALIDITY-STATUS", codes: ["VALID"] },
  ];

  const viewResult = module.actions.find(({ id }) => id === "PUB-ACT-VIEW-RESULT");
  attachAnswerOpenEnforcement(viewResult, ["PAGE", "SEARCH", "EXPORT", "VIDEO", "CACHE", "DIRECT_LINK"]);
  const studentResultProtectedFieldIds = [
    "PUB-RESULT-F-ANSWER",
    "PUB-RESULT-F-SCORE",
    "PUB-RESULT-F-FEEDBACK",
    ...FEEDBACK_LAYER_FIELD_IDS,
    ASSESSMENT_STANDARD_CONTENT_FIELD_ID,
  ];
  const studentResultSafeMetadataFieldIds = [
    "PUB-RESULT-F-RESULT-VERSION",
    ...ANSWER_OPEN_POLICY_FIELD_IDS,
  ];
  const studentResultTimeFieldIds = [
    ...ANSWER_OPEN_TIME_FIELD_IDS,
    "PUB-RESULT-F-SCORE-VISIBLE-AT",
    "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
  ];
  viewResult.outputFieldIds = [
    "PUB-RESULT-F-STUDENT-REF",
    ...studentResultProtectedFieldIds,
    ...studentResultSafeMetadataFieldIds,
    ...studentResultTimeFieldIds,
  ];
  result.readPolicies = [{
    id: "PUB-RP-STUDENT-RESULT",
    actionId: viewResult.id,
    subject: { roleRef: "ROLE-STUDENT" },
    scope: { kind: "OWN_RECORD", subjectFieldId: "PUB-RESULT-F-STUDENT-REF" },
    requiredState: "PUBLISHED",
    safeMetadataFieldIds: studentResultSafeMetadataFieldIds,
    timeGates: [
      {
        visibleAtFieldId: "PUB-RESULT-F-ANSWER-OPEN-AT",
        protectedFieldIds: ["PUB-RESULT-F-ANSWER"],
      },
      {
        visibleAtFieldId: "PUB-RESULT-F-SCORE-VISIBLE-AT",
        protectedFieldIds: ["PUB-RESULT-F-SCORE"],
      },
      {
        visibleAtFieldId: "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
        protectedFieldIds: [
          "PUB-RESULT-F-FEEDBACK",
          "PUB-RESULT-F-FEEDBACK-LAYER-1",
          "PUB-RESULT-F-FEEDBACK-LAYER-2",
          "PUB-RESULT-F-FEEDBACK-LAYER-3",
        ],
      },
      {
        visibleAtFieldId: "PUB-RESULT-F-SOLUTION-OPEN-AT",
        protectedFieldIds: ["PUB-RESULT-F-FEEDBACK-LAYER-4"],
      },
      {
        visibleAtFieldId: "PUB-RESULT-F-RUBRIC-OPEN-AT",
        protectedFieldIds: [ASSESSMENT_STANDARD_CONTENT_FIELD_ID],
      },
    ],
  }];
  const studentResultPage = module.pages.find(({ id }) => id === "PUB-PAGE-STUDENT-RESULT");
  studentResultPage.fieldIds = [...viewResult.outputFieldIds];
  studentResultPage.actionIds = [viewResult.id];
  attachAnswerOpenEnforcement(publishResult, ["NOTIFICATION"]);

  const correctionNotificationProducer = module.actions.find(({ id }) => (
    id === "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION"
  ));
  correctionNotificationProducer.inputFieldIds.push("PUB-RESULT-F-ID");
  correctionNotificationProducer.producedEventIds = [ASSESSMENT_NOTIFICATION_EVENT_ID];
  attachAnswerOpenEnforcement(correctionNotificationProducer, ["NOTIFICATION"]);

  for (const actionId of publicationWriterActionIds) {
    for (const [code, message] of [
      ["PERMISSION_GATE_FAILED", "permission or input isolation failed; the result stays unpublished"],
      ["SAFETY_GATE_FAILED", "the safety gate failed; the result stays unpublished"],
      ["TEACHING_CORRECTNESS_GATE_FAILED", "teaching correctness failed; the result stays unpublished"],
      ["GATE_UNAVAILABLE", "a required gate timed out or was unavailable; the result stays unpublished without downgrade"],
    ]) appendFailureResult(module, actionId, code, message);
  }

  module.aiPublicationContract = {
    requiredGates: ["PERMISSION", "SAFETY", "TEACHING_CORRECTNESS"],
    gateFieldIds: [...publicationGateFieldIds],
    publishActionId: "PUB-ACT-PUBLISH-RESULT",
    publicationWriterActionIds: [...publicationWriterActionIds],
    publishedVersionReplacement: {
      writerActionIds: [...publishedVersionReplacementWriterActionIds],
      requiredOutputFieldIds: [
        "PUB-RESULT-F-PRIOR-RESULT-REF",
        "PUB-RESULT-F-PRIOR-RESULT-VERSION",
        "PUB-RESULT-F-PUBLIC-CORRECTION-NOTE",
        "PUB-RESULT-F-RESULT-VERSION",
      ],
      requiredTransition: { from: "PUBLISHED", to: "PUBLISHED" },
      recomputationContractRequired: true,
      publicationGateRequired: true,
    },
    failureBehavior: "KEEP_UNPUBLISHED",
    bypassAllowed: false,
    originalFactAcceptanceIndependent: true,
  };
  module.batchCorrectionContract = {
    steps: [
      "LOCATE_AFFECTED_RESULTS",
      "FREEZE_CURRENT_DERIVED_USE",
      "REVIEW_CAUSE_AND_SCOPE",
      "RECALCULATE_DERIVED_RESULTS",
      "NOTIFY_AFFECTED_USERS",
    ],
    actionIds: [
      "PUB-ACT-RESOLVE-DEPENDENCY-SNAPSHOT",
      "GRD-ACT-PROCESS",
      "PUB-ACT-CORRECT-RESULT",
      "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
    ],
    notificationEventId: ASSESSMENT_NOTIFICATION_EVENT_ID,
    preserveOriginalFacts: true,
    preserveSupersededResultVersions: true,
    impactCauses: ["QUESTION", "ANSWER", "ASSESSMENT_STANDARD", "MODEL", "RULE"],
  };
  module.feedbackContract = {
    layers: [...FEEDBACK_LAYERS],
    completeAnswerRequiresOpenPolicy: true,
    layerSelectionInputs: ["ACTIVITY_PURPOSE", "VALID_ATTEMPT", "ANSWER_OPEN_POLICY"],
    materializeActionId: "PUB-ACT-MATERIALIZE-RESULT",
    layerFieldBindings: Object.fromEntries(FEEDBACK_LAYERS.map((layer, index) => (
      [layer, FEEDBACK_LAYER_FIELD_IDS[index]]
    ))),
    validAttemptFieldIds: [
      "GRD-ATTEMPT-CLASS-F-CLASSIFICATION",
      "CORR-ASSESSMENT-F-VALID-ATTEMPT",
    ],
  };
  module.answerOpenContract = {
    policyId: "ANSWER-OPEN-POLICY-V2",
    independentTimes: ["ANSWER_OPEN_AT", "SOLUTION_OPEN_AT", "RUBRIC_OPEN_AT"],
    fieldBindings: {
      ANSWER_OPEN_AT: "PUB-RESULT-F-ANSWER-OPEN-AT",
      SOLUTION_OPEN_AT: "PUB-RESULT-F-SOLUTION-OPEN-AT",
      RUBRIC_OPEN_AT: "PUB-RESULT-F-RUBRIC-OPEN-AT",
    },
    policyFieldIds: [...ANSWER_OPEN_POLICY_FIELD_IDS],
    surfaces: [...ANSWER_SURFACES],
    enforcementBindings: structuredClone(ANSWER_OPEN_ENFORCEMENT_POINTS),
    restrictedContentFieldIds: RESTRICTED_RESULT_CONTENT_FIELDS.map(({ fieldId }) => fieldId),
    resultReadActionIds: ["PUB-ACT-VIEW-RESULT"],
    unclassifiedResultReadFieldBehavior: "REJECT",
    sharedPolicy: true,
    reauthorizeEveryAccess: true,
    cachePolicy: "PURGE_OR_WITHHOLD_UNTIL_AUTHORIZED_OPEN_TIME",
  };
  module.resultAxisWriterContract = [
    {
      axis: "PUBLICATION_STATUS",
      fieldId: "PUB-RESULT-F-PUBLICATION-STATUS",
      writerActionIds: [
        "PUB-ACT-MATERIALIZE-RESULT",
        "PUB-ACT-PUBLISH-RESULT",
        "PUB-ACT-RETRY-FAILED",
        "PUB-ACT-CORRECT-RESULT",
        "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
        "PUB-ACT-CORRECT-CHALLENGED-RESULT",
        "PUB-ACT-REPLACE-RESULT",
        "PUB-ACT-INVALIDATE-RESULT",
        "PUB-ACT-UPHOLD-RESULT",
      ],
    },
    {
      axis: "DISPUTE_CORRECTION_STATUS",
      fieldId: "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS",
      writerActionIds: [
        "PUB-ACT-MATERIALIZE-RESULT",
        "PUB-ACT-MARK-RESULT-CHALLENGED",
        "PUB-ACT-MARK-RESULT-CORRECTION-PENDING",
        "PUB-ACT-CORRECT-RESULT",
        "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
        "PUB-ACT-CORRECT-CHALLENGED-RESULT",
        "PUB-ACT-REPLACE-RESULT",
        "PUB-ACT-INVALIDATE-RESULT",
        "PUB-ACT-UPHOLD-RESULT",
      ],
    },
    {
      axis: "VALIDITY_STATUS",
      fieldId: "PUB-RESULT-F-VALIDITY-STATUS",
      writerActionIds: [
        "PUB-ACT-MATERIALIZE-RESULT",
        "PUB-ACT-PUBLISH-RESULT",
        "PUB-ACT-RETRY-FAILED",
        "PUB-ACT-CORRECT-RESULT",
        "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
        "PUB-ACT-CORRECT-CHALLENGED-RESULT",
        "PUB-ACT-REPLACE-RESULT",
        "PUB-ACT-INVALIDATE-RESULT",
        "PUB-ACT-UPHOLD-RESULT",
      ],
    },
  ];
  module.challengeCorrectionContract = {
    challengeObjectId: challenge.id,
    openActionId: "PUB-ACT-OPEN-RESULT-CHALLENGE",
    professionalEvidenceActionId: "PUB-ACT-SUBMIT-PROFESSIONAL-EVIDENCE",
    resolutionActionIds: [
      "PUB-ACT-CORRECT-CHALLENGED-RESULT",
      "PUB-ACT-REPLACE-RESULT",
      "PUB-ACT-INVALIDATE-RESULT",
      "PUB-ACT-UPHOLD-RESULT",
    ],
    closeActionId: "PUB-ACT-CLOSE-RESULT-CHALLENGE",
    preservePriorResultVersions: true,
    originalFactOverwriteAllowed: false,
    historyFieldIds: [
      "PUB-RESULT-F-PRIOR-RESULT-REF",
      "PUB-RESULT-F-PRIOR-RESULT-VERSION",
      "PUB-RESULT-F-CHALLENGE-REF",
      "PUB-RESULT-F-CHALLENGE-VERSION",
      "PUB-RESULT-F-RESOLUTION-EVIDENCE-REFS",
    ],
  };
  return module;
}

function correctionAttemptAssessmentObject() {
  const sourceRef = {
    ...systemField("CORR-ASSESSMENT-F-SOURCE-ATTEMPT-REF", "Source Correction Attempt Reference", {
      dataType: "ID",
      required: true,
      mutability: "IMMUTABLE",
    }),
    valueSource: { kind: "OBJECT_REF", targetObjectId: "CORR-OBJ-ATTEMPT" },
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["CORR-ACT-NORMALIZE-SUBMISSION"] },
    versionBinding: {
      versionFieldId: "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION",
      targetVersionFieldId: "CORR-ATTEMPT-F-CORRECTION-VERSION",
    },
  };
  const priorRef = {
    ...systemField("CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-REF", "Prior Correction Assessment Reference", {
      dataType: "ID",
      mutability: "IMMUTABLE",
    }),
    valueSource: { kind: "OBJECT_REF", targetObjectId: "CORR-OBJ-ATTEMPT-ASSESSMENT" },
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-VERSION",
      targetVersionFieldId: "CORR-ASSESSMENT-F-VERSION",
    },
  };
  const fields = [
    systemField("CORR-ASSESSMENT-F-ID", "Correction Attempt Assessment ID", {
      dataType: "ID",
      required: true,
      mutability: "IMMUTABLE",
      idempotencyRole: "OBJECT_ID",
    }),
    sourceRef,
    systemField("CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION", "Source Correction Attempt Version", {
      dataType: "INTEGER",
      required: true,
      mutability: "IMMUTABLE",
    }),
    optionField("CORR-ASSESSMENT-F-VALID-ATTEMPT", "Correction Attempt Classification", "OPT-AI2-008"),
    optionField("CORR-ASSESSMENT-F-NEXT-STEP", "Correction AI Assessment Next Step", "OPT-AI2-005"),
    optionField("CORR-ASSESSMENT-F-ANSWER-EXPOSURE", "Answer Exposure Condition", "OPT-AI2-009"),
    systemField("CORR-ASSESSMENT-F-EVIDENCE-KIND", "Correction Evidence Kind", {
      mutability: "IMMUTABLE",
    }),
    optionField("CORR-ASSESSMENT-F-VALIDITY-STATUS", "Correction Assessment Validity Status", "OPT-AI2-004"),
    optionField("CORR-ASSESSMENT-F-DISPUTE-CORRECTION-STATUS", "Correction Assessment Dispute and Correction Status", "OPT-AI2-003"),
    priorRef,
    systemField("CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-VERSION", "Prior Correction Assessment Version", {
      dataType: "INTEGER",
      mutability: "IMMUTABLE",
    }),
    systemField("CORR-ASSESSMENT-F-SUPERSESSION-REASON", "Correction Assessment Supersession Reason", {
      dataType: "TEXT",
      mutability: "IMMUTABLE",
    }),
    systemField("CORR-ASSESSMENT-F-VERSION", "Correction Attempt Assessment Version", {
      dataType: "INTEGER",
      required: true,
      idempotencyRole: "OBJECT_VERSION",
    }),
  ];
  for (const id of [
    "CORR-ASSESSMENT-F-VALID-ATTEMPT",
    "CORR-ASSESSMENT-F-NEXT-STEP",
    "CORR-ASSESSMENT-F-ANSWER-EXPOSURE",
    "CORR-ASSESSMENT-F-EVIDENCE-KIND",
    "CORR-ASSESSMENT-F-VALIDITY-STATUS",
    "CORR-ASSESSMENT-F-DISPUTE-CORRECTION-STATUS",
  ]) {
    fields.find((field) => field.id === id).required = true;
  }
  return {
    id: "CORR-OBJ-ATTEMPT-ASSESSMENT",
    label: "AI-derived Correction Attempt Assessment Version",
    dataSubject: "CORRECTION_ATTEMPT_CLASSIFICATION",
    controlSubject: "SCHOOL",
    producerRef: "AI",
    ownerRef: "DUTY-SUBJECT-TEACHER",
    confirmerRef: "SYSTEM",
    stewardRef: "ROLE-ACADEMIC",
    lifecyclePolicyId: "LIFE-003",
    sensitivityId: "S3",
    stateReachability: { mode: "ACTION_GRAPH", initialStateIds: [] },
    states: ["ASSESSED"],
    fields,
    lineageBindings: [
      {
        refFieldId: "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-REF",
        versionFieldId: "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION",
        targetObjectId: "CORR-OBJ-ATTEMPT",
        targetVersionFieldId: "CORR-ATTEMPT-F-CORRECTION-VERSION",
      },
      {
        refFieldId: "CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-REF",
        versionFieldId: "CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-VERSION",
        targetObjectId: "CORR-OBJ-ATTEMPT-ASSESSMENT",
        targetVersionFieldId: "CORR-ASSESSMENT-F-VERSION",
      },
    ],
    dataNature: "AI_DERIVED_JUDGMENT",
    originalFactOverwritePolicy: "FORBIDDEN",
    derivedJudgmentContract: {
      sourceRefFieldId: "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-REF",
      sourceVersionFieldId: "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION",
      validityFieldId: "CORR-ASSESSMENT-F-VALIDITY-STATUS",
      disputeFieldId: "CORR-ASSESSMENT-F-DISPUTE-CORRECTION-STATUS",
      priorRefFieldId: "CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-REF",
      priorVersionFieldId: "CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-VERSION",
      supersessionReasonFieldId: "CORR-ASSESSMENT-F-SUPERSESSION-REASON",
      versionFieldId: "CORR-ASSESSMENT-F-VERSION",
      sourceOverwriteAllowed: false,
      recomputationCreatesNewVersion: true,
      priorVersionRequiredWhenRecomputed: true,
      initialization: {
        actionId: "CORR-ACT-NORMALIZE-SUBMISSION",
        validityCode: "VALID",
        disputeCode: "UNCHALLENGED",
      },
      recomputation: {
        actionIds: ["CORR-ACT-NORMALIZE-SUBMISSION"],
        requiredOutputFieldIds: [
          "CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-REF",
          "CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-VERSION",
          "CORR-ASSESSMENT-F-SUPERSESSION-REASON",
          "CORR-ASSESSMENT-F-VERSION",
          "CORR-ASSESSMENT-F-VALIDITY-STATUS",
          "CORR-ASSESSMENT-F-DISPUTE-CORRECTION-STATUS",
        ],
        statusWritesByActionId: {
          "CORR-ACT-NORMALIZE-SUBMISSION": {
            validityCode: "VALID",
            disputeCode: "UNCHALLENGED",
          },
        },
      },
    },
    studentDataClassification: {
      kind: "DETAIL",
      privilegedReadPolicy: "DEFAULT_DENY",
    },
    readMode: "NO_DIRECT_READ",
  };
}

function correctionModule() {
  const module = markPlanned(structuredClone(
    teachingLoopModules.find(({ id }) => id === "CORR-001"),
  ));
  module.title = "AI-driven Correction and Reassessment";
  module.objective = "Collect versioned correction attempts, re-enter AI assessment, and use professional review only for the bounded exception queue";
  module.entryConditions = [
    "a published result returns CORRECTION_REQUIRED, MORE_INPUT_REQUIRED, UNABLE_TO_DETERMINE, or EXCEPTION_REVIEW_REQUIRED",
  ];
  module.exitConditions = [
    "the attempt receives a new explicit AI next step or remains unresolved in the professional exception queue",
  ];
  module.productDecisionIds = ["D072", "D073", "D075", "D076", "D078"];

  module.objects.find(({ id }) => id === "CORR-OBJ-TASK").label = "Correction Task";

  relabelField(module, "CORR-OBJ-ATTEMPT", "CORR-ATTEMPT-F-TEACHER-JUDGMENT", "Professional Exception Resolution (exception only)");
  relabelField(module, "CORR-OBJ-ATTEMPT", "CORR-ATTEMPT-F-TEACHER-CONFIRMER-REF", "Authorized Professional Exception Resolver");
  const rawAttempt = module.objects.find(({ id }) => id === "CORR-OBJ-ATTEMPT");
  rawAttempt.dataNature = "ORIGINAL_LEARNING_FACT";
  rawAttempt.originalFactOverwritePolicy = "FORBIDDEN";
  rawAttempt.factVersionPolicy = "APPEND_NEW_ATTEMPT_VERSION_ONLY";
  rawAttempt.fields.find(({ id }) => id === "CORR-ATTEMPT-F-CORRECTION-ANSWER").mutability = "IMMUTABLE";
  const assessmentObject = correctionAttemptAssessmentObject();
  module.objects.push(assessmentObject);
  module.relationships.push({
    id: "CORR-REL-ASSESSMENT-SOURCE-ATTEMPT",
    fromObjectId: assessmentObject.id,
    toObjectId: rawAttempt.id,
    type: "DERIVED_FROM",
    cardinality: "MANY_TO_ONE",
    ownershipScope: "SAME_CONTEXT",
    onSourceInvalidation: "mark the assessment stale and create a new assessment version without modifying the correction answer",
  });
  const normalize = module.actions.find(({ id }) => id === "CORR-ACT-NORMALIZE-SUBMISSION");
  normalize.label = "Create a Version-pinned AI Correction Attempt Assessment";
  normalize.targetObjectId = assessmentObject.id;
  normalize.inputFieldIds = [
    "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-REF",
    "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION",
  ];
  normalize.outputFieldIds = assessmentObject.fields.map(({ id }) => id);
  normalize.operationKind = "CREATE";
  delete normalize.transition;
  normalize.relatedStateGuards = [{
    refFieldId: "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-REF",
    versionFieldId: "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION",
    targetObjectId: rawAttempt.id,
    requiredState: "SUBMITTED",
  }];
  normalize.statusWrites = [
    { fieldId: "CORR-ASSESSMENT-F-VALIDITY-STATUS", codes: ["VALID"] },
    { fieldId: "CORR-ASSESSMENT-F-DISPUTE-CORRECTION-STATUS", codes: ["UNCHALLENGED"] },
    { fieldId: "CORR-ASSESSMENT-F-NEXT-STEP", codes: [...NEXT_STEPS] },
  ];
  normalize.derivedJudgmentWriteContract = structuredClone(assessmentObject.derivedJudgmentContract);
  normalize.derivedJudgmentRecomputationContract = structuredClone(
    assessmentObject.derivedJudgmentContract.recomputation,
  );
  normalize.initialAttemptOutcomeMatrix = structuredClone(INITIAL_ATTEMPT_NEXT_STEP_MATRIX);
  normalize.explicitDontKnowMayWriteCompleted = false;
  normalize.externalAiProcessingGuard = {
    contractId: "EXTERNAL-AI-STUDENT-DATA-V2",
    failureResult: "EXTERNAL_AI_CONTRACT_INCOMPLETE",
    failClosed: true,
  };
  normalize.providerResultContract = {
    resultSchema: {
      type: "object",
      required: [
        "classification",
        "nextStep",
        "answerExposure",
        "evidenceKind",
        "validityStatus",
        "disputeStatus",
      ],
      properties: {
        classification: {
          type: "string",
          enum: [
            "SUBSTANTIVE_RESPONSE",
            "EXPLICIT_DONT_KNOW",
            "BLANK",
            "UNRELATED",
            "PLACEHOLDER",
          ],
        },
        nextStep: { type: "string", enum: [...NEXT_STEPS] },
        answerExposure: {
          type: "string",
          enum: ["NOT_EXPOSED", "ANSWER_EXPOSED", "UNKNOWN"],
        },
        evidenceKind: { type: "string" },
        validityStatus: { type: "string", enum: ["VALID"] },
        disputeStatus: { type: "string", enum: ["UNCHALLENGED"] },
      },
      additionalProperties: false,
    },
    resultPersistenceMapping: {
      classification: "CORR-ASSESSMENT-F-VALID-ATTEMPT",
      nextStep: "CORR-ASSESSMENT-F-NEXT-STEP",
      answerExposure: "CORR-ASSESSMENT-F-ANSWER-EXPOSURE",
      evidenceKind: "CORR-ASSESSMENT-F-EVIDENCE-KIND",
      validityStatus: "CORR-ASSESSMENT-F-VALIDITY-STATUS",
      disputeStatus: "CORR-ASSESSMENT-F-DISPUTE-CORRECTION-STATUS",
    },
    verifiableTeachingEvidenceOnly: true,
  };
  normalize.providerResponseBoundary = structuredClone(CLOSED_PROVIDER_RESPONSE_BOUNDARY);
  normalize.persistenceContract = {
    allowedOutputFieldIds: [...normalize.outputFieldIds],
    unknownPersistedFields: "REJECT",
    arbitraryJsonPayloadAllowed: false,
  };
  appendFailureResult(
    module,
    normalize.id,
    "EXTERNAL_AI_CONTRACT_INCOMPLETE",
    "the correction answer remains an unchanged original fact and no derived assessment is created",
  );
  for (const scenario of module.scenarios.filter(({ actionId }) => actionId === normalize.id)) {
    if (scenario.kind === "SUCCESS") {
      scenario.then.expectedState = { mode: "STATE", value: "ASSESSED" };
      scenario.then.expectedData = "creates a source-pinned derived assessment version without changing the correction answer";
    }
  }
  const attemptPage = module.pages.find(({ id }) => id === "CORR-PAGE-ATTEMPT");
  attemptPage.objectIds.push(assessmentObject.id);
  attemptPage.fieldIds.push(...assessmentObject.fields.map(({ id }) => id));
  markProfessionalExceptionAction(module, "CORR-ACT-CONFIRM-JUDGMENT", "Resolve a Completed Professional Correction Exception");
  markProfessionalExceptionAction(module, "CORR-ACT-REQUEST-RETRY", "Resolve a Retry Professional Correction Exception");

  module.correctionReassessmentContract = {
    routinePath: "AI_REASSESSMENT",
    reassessmentFlowId: "DF-006",
    returnsExplicitNextStep: true,
    professionalExceptionOnlyWhen: "NEXT_STEP_EQUALS_EXCEPTION_REVIEW_REQUIRED",
    routineTeacherAssessment: false,
  };
  module.validAttemptContract = {
    sourceObjectId: "CORR-OBJ-ATTEMPT",
    assessmentObjectId: "CORR-OBJ-ATTEMPT-ASSESSMENT",
    fieldId: "CORR-ASSESSMENT-F-VALID-ATTEMPT",
    optionSetId: "OPT-AI2-008",
    valid: ["SUBSTANTIVE_RESPONSE", "EXPLICIT_DONT_KNOW"],
    invalid: ["BLANK", "UNRELATED", "PLACEHOLDER"],
    explicitDontKnowMeansCompleted: false,
    explicitDontKnowUnlocksCompleteAnswer: false,
  };
  module.answerExposedEvidenceContract = {
    fieldId: "CORR-ASSESSMENT-F-ANSWER-EXPOSURE",
    evidenceKindFieldId: "CORR-ASSESSMENT-F-EVIDENCE-KIND",
    independentEvidence: false,
    evidenceKind: "REMEDIAL_AFTER_ANSWER_EXPOSURE",
    independentEvidenceRequiresNewActivity: true,
  };
  module.pages.find(({ id }) => id === "CORR-PAGE-ATTEMPT").label = "Student Correction and Bounded Professional Exception Workspace";
  return module;
}

function aixModule() {
  const module = markPlanned(structuredClone(
    aiReportingModules.find(({ id }) => id === "AIX-001"),
  ));
  module.title = "Permission-bound AI Conversation and Confirmed Product Actions";
  module.objective = "Use AI conversation on Web and App without bypassing current permissions, answer-open rules, or target action confirmation";
  module.entryConditions = [
    "the current actor, active school context, task permission, and answer-open policy are reauthorized",
  ];
  module.exitConditions = [
    "the conversation returns an authorized preview or invokes one separately confirmed product action without exposing restricted answers",
  ];
  module.productDecisionIds = ["D038", "D054", "D059", "D061", "D062", "D077"];

  const preview = module.objects.find(({ id }) => id === "AIX-OBJ-TASK-PREVIEW");
  const resultBoundActionIds = [
    "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW",
    "AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW",
  ];
  const resultSourceFieldIds = [
    "AIX-PREVIEW-F-SOURCE-RESULT-REF",
    "AIX-PREVIEW-F-SOURCE-RESULT-VERSION",
  ];
  const removedGenericFieldIds = new Set([
    "AIX-PREVIEW-F-PARAMETERS",
    "AIX-PREVIEW-F-SOURCE-VERSIONS",
    "AIX-PREVIEW-F-PAYLOAD",
  ]);
  preview.fields = preview.fields.filter(({ id }) => !removedGenericFieldIds.has(id));
  for (const page of module.pages.filter(({ objectIds }) => objectIds.includes(preview.id))) {
    page.fieldIds = page.fieldIds.filter((fieldId) => !removedGenericFieldIds.has(fieldId));
  }
  const fields = [
    userField("AIX-PREVIEW-F-USER-REQUEST", "User-visible AI Request", {
      dataType: "TEXT",
      mutability: "IMMUTABLE",
    }),
    systemField("AIX-PREVIEW-F-SOURCE-VERSION-REFS", "Version-pinned Source References", {
      dataType: "STRING_ARRAY",
      required: true,
      mutability: "IMMUTABLE",
    }),
    {
      ...systemField("AIX-PREVIEW-F-SOURCE-RESULT-REF", "Published Result Source Reference", {
        dataType: "ID",
        required: {
          description: "required when an AI preview may use a published assessment result",
          whenStates: ["PREVIEW_READY"],
          whenActionIds: [...resultBoundActionIds],
        },
        mutability: "IMMUTABLE",
      }),
      valueSource: { kind: "OBJECT_REF", targetObjectId: "PUB-OBJ-RESULT" },
      referenceIntegrity: "VERSION_PINNED",
      stateGuardPolicy: "ALWAYS_REQUIRED",
      actionApplicability: { requiredActionIds: [...resultBoundActionIds] },
      versionBinding: {
        versionFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-VERSION",
        targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
      },
    },
    systemField("AIX-PREVIEW-F-SOURCE-RESULT-VERSION", "Published Result Source Version", {
      dataType: "INTEGER",
      required: {
        description: "required with the exact published assessment result source",
        whenStates: ["PREVIEW_READY"],
        whenActionIds: [...resultBoundActionIds],
      },
      mutability: "IMMUTABLE",
    }),
    systemField("AIX-PREVIEW-F-USER-VISIBLE-CONTENT", "User-visible Preview Content", {
      dataType: "TEXT",
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("AIX-PREVIEW-F-EVIDENCE-REFERENCES", "Verifiable Evidence References", {
      dataType: "STRING_ARRAY",
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("AIX-PREVIEW-F-RESULT-REFERENCE", "Result Reference", {
      dataType: "ID",
      mutability: "IMMUTABLE",
    }),
    systemField("AIX-PREVIEW-F-MODEL-VERSION", "Model Version", {
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("AIX-PREVIEW-F-CAPABILITY-VERSION", "Capability Version", {
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("AIX-PREVIEW-F-RULE-VERSION", "Rule Version", {
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("AIX-PREVIEW-F-SAFETY-VERSION", "Safety Policy Version", {
      required: true,
      mutability: "IMMUTABLE",
    }),
    optionField("AIX-PREVIEW-F-PERMISSION-GATE", "Permission Gate Outcome", "OPT-AI2-006"),
    optionField("AIX-PREVIEW-F-SAFETY-GATE", "Safety Gate Outcome", "OPT-AI2-006"),
    optionField("AIX-PREVIEW-F-TEACHING-CORRECTNESS-GATE", "Teaching-correctness Gate Outcome", "OPT-AI2-006"),
    optionField("AIX-PREVIEW-F-ANSWER-OPEN-GATE", "Answer-open Gate Outcome", "OPT-AI2-006"),
    systemField("AIX-PREVIEW-F-ANSWER-OPEN-POLICY-ID", "Answer-open Policy ID", {
      dataType: "ID",
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("AIX-PREVIEW-F-ANSWER-OPEN-POLICY-VERSION", "Answer-open Policy Version", {
      dataType: "INTEGER",
      required: true,
      mutability: "IMMUTABLE",
    }),
    systemField("AIX-PREVIEW-F-AUTHORIZATION-CHECKED-AT", "Access-time Authorization Check", {
      dataType: "DATETIME",
      required: true,
    }),
    systemField("AIX-PREVIEW-F-RESTRICTED-CONTENT-CATEGORIES", "Withheld Answer, Solution, and Rubric Categories", {
      dataType: "STRING_ARRAY",
      required: true,
    }),
  ];
  for (const fieldId of [
    "AIX-PREVIEW-F-PERMISSION-GATE",
    "AIX-PREVIEW-F-SAFETY-GATE",
    "AIX-PREVIEW-F-TEACHING-CORRECTNESS-GATE",
    "AIX-PREVIEW-F-ANSWER-OPEN-GATE",
  ]) {
    fields.find(({ id }) => id === fieldId).required = true;
  }
  appendObjectFields(module, preview.id, fields);
  preview.lineageBindings = [
    ...(preview.lineageBindings ?? []),
    {
      refFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-REF",
      versionFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-VERSION",
      targetObjectId: "PUB-OBJ-RESULT",
      targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
    },
  ];
  const generatedFieldIds = fields
    .filter(({ id }) => (
      id !== "AIX-PREVIEW-F-USER-REQUEST" && !resultSourceFieldIds.includes(id)
    ))
    .map(({ id }) => id);
  const persistedFieldIds = preview.fields.map(({ id }) => id);
  const previewGateFieldIds = [
    "AIX-PREVIEW-F-PERMISSION-GATE",
    "AIX-PREVIEW-F-SAFETY-GATE",
    "AIX-PREVIEW-F-TEACHING-CORRECTNESS-GATE",
    "AIX-PREVIEW-F-ANSWER-OPEN-GATE",
  ];
  preview.persistenceContract = {
    allowedFieldIds: [...persistedFieldIds],
    unknownPersistedFields: "REJECT",
    unknownNestedKeys: "REJECT",
    arbitraryJsonPayloadAllowed: false,
    prohibitedPersistence: [
      "HIDDEN_CHAIN_OF_THOUGHT",
      "VENDOR_DEBUG_FIELDS",
      "FULL_UPSTREAM_REQUEST_BODY",
      "UNKNOWN_PERSISTED_KEYS",
    ],
  };
  for (const action of module.actions) {
    action.inputFieldIds = action.inputFieldIds.map((fieldId) => (
      fieldId === "AIX-PREVIEW-F-PARAMETERS" ? "AIX-PREVIEW-F-USER-REQUEST" : fieldId
    ));
    action.outputFieldIds = action.outputFieldIds
      .filter((fieldId) => !removedGenericFieldIds.has(fieldId));
    appendActionOutputs(module, action.id, generatedFieldIds);
    if (resultBoundActionIds.includes(action.id)) {
      appendActionInputs(module, action.id, resultSourceFieldIds);
      appendActionOutputs(module, action.id, resultSourceFieldIds);
      action.relatedStateGuards = [
        ...(action.relatedStateGuards ?? []),
        {
          refFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-REF",
          versionFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-VERSION",
          targetObjectId: "PUB-OBJ-RESULT",
          requiredState: "PUBLISHED",
        },
      ];
      action.answerOpenSourceBinding = {
        sourceObjectId: "PUB-OBJ-RESULT",
        refFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-REF",
        versionFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-VERSION",
        targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
        requiredState: "PUBLISHED",
        policyFieldMappings: [
          {
            sourceFieldId: "PUB-RESULT-F-ANSWER-OPEN-POLICY-ID",
            localFieldId: "AIX-PREVIEW-F-ANSWER-OPEN-POLICY-ID",
          },
          {
            sourceFieldId: "PUB-RESULT-F-ANSWER-OPEN-POLICY-VERSION",
            localFieldId: "AIX-PREVIEW-F-ANSWER-OPEN-POLICY-VERSION",
          },
        ],
        sourceOpenTimeFieldIds: [...ANSWER_OPEN_TIME_FIELD_IDS],
        localGateFieldId: "AIX-PREVIEW-F-ANSWER-OPEN-GATE",
        staleMissingOrMismatchBehavior: "KEEP_PREVIEW_UNAVAILABLE",
        permissionReauthorizedAtAccess: true,
        currentTimeReevaluatedAtAccess: true,
      };
    } else {
      action.nonResultAnswerOpenContract = {
        allowedTaskIds: ["AI-TASK-ASSIGNMENT-DRAFT"],
        resultSourceAllowed: false,
        restrictedResultContentAllowed: false,
        answerOpenPassCondition: "NO_RESTRICTED_RESULT_CONTENT_REQUESTED_OR_USED",
      };
    }
    action.answerOpenPolicyRequired = true;
    action.reauthorizeOnEveryAccess = true;
    attachAnswerOpenEnforcement(action, ["AI_CONVERSATION"]);
    action.answerOpenEnforcement.localPolicyFieldIds = [
      "AIX-PREVIEW-F-ANSWER-OPEN-POLICY-ID",
      "AIX-PREVIEW-F-ANSWER-OPEN-POLICY-VERSION",
    ];
    action.externalAiProcessingGuard = {
      contractId: "EXTERNAL-AI-STUDENT-DATA-V2",
      failureResult: "EXTERNAL_AI_CONTRACT_INCOMPLETE",
      failClosed: true,
    };
    action.persistenceContract = {
      allowedInputFieldIds: [...action.inputFieldIds],
      allowedOutputFieldIds: [...action.outputFieldIds],
      unknownPersistedFields: "REJECT",
      arbitraryJsonPayloadAllowed: false,
    };
    action.gateEvaluation = {
      gateFieldIds: [...previewGateFieldIds],
      requiredPassCode: "PASS",
      anyOtherOutcome: "KEEP_PREVIEW_UNAVAILABLE",
      evaluatedAtomicallyWithPreviewCreation: true,
      visibleContentFieldId: "AIX-PREVIEW-F-USER-VISIBLE-CONTENT",
    };
    action.statusWrites = [
      ...(action.statusWrites ?? []),
      ...previewGateFieldIds.map((fieldId) => ({ fieldId, codes: ["PASS"] })),
    ];
    appendFailureResult(
      module,
      action.id,
      "EXTERNAL_AI_CONTRACT_INCOMPLETE",
      "no AI preview is created and no real student data leaves the product boundary",
    );
    for (const [resultCode, expectedData] of [
      ["PERMISSION_GATE_FAILED", "the preview remains unavailable because permission or input isolation failed"],
      ["SAFETY_GATE_FAILED", "the preview remains unavailable because the safety gate failed"],
      ["TEACHING_CORRECTNESS_GATE_FAILED", "the preview remains unavailable because teaching correctness failed"],
      ["ANSWER_OPEN_GATE_FAILED", "the preview remains unavailable because restricted content is not open"],
      ["GATE_UNAVAILABLE", "the preview remains unavailable because a required gate timed out or is unavailable"],
    ]) {
      appendFailureResult(module, action.id, resultCode, expectedData);
    }
  }
  module.externalAiProcessingContractRef = {
    contractId: "EXTERNAL-AI-STUDENT-DATA-V2",
    realStudentDataBlockedUntilComplete: true,
    taskMinimumNecessaryDataOnly: true,
  };
  module.aiPersistenceContract = {
    objectId: preview.id,
    persistedFieldIds: [...persistedFieldIds],
    arbitraryJsonPayloadAllowed: false,
    unknownPersistedFields: "REJECT",
    prohibitedPersistence: [...preview.persistenceContract.prohibitedPersistence],
    externalAiGuardedActionIds: module.actions.map(({ id }) => id),
  };
  module.previewGateContract = {
    gateFieldIds: [...previewGateFieldIds],
    requiredPassCode: "PASS",
    failureBehavior: "KEEP_PREVIEW_UNAVAILABLE",
    bypassAllowed: false,
    gateFailureResults: [
      "PERMISSION_GATE_FAILED",
      "SAFETY_GATE_FAILED",
      "TEACHING_CORRECTNESS_GATE_FAILED",
      "ANSWER_OPEN_GATE_FAILED",
      "GATE_UNAVAILABLE",
    ],
  };
  module.answerOpenEnforcement = {
    policyId: "ANSWER-OPEN-POLICY-V2",
    surface: "AI_CONVERSATION",
    policyFieldIds: [
      "AIX-PREVIEW-F-ANSWER-OPEN-POLICY-ID",
      "AIX-PREVIEW-F-ANSWER-OPEN-POLICY-VERSION",
    ],
    sourcePolicyFieldIds: [...ANSWER_OPEN_POLICY_FIELD_IDS],
    sourceOpenTimeFieldIds: [...ANSWER_OPEN_TIME_FIELD_IDS],
    enforcementActionIds: module.actions.map(({ id }) => id),
    reauthorizeEveryAccess: true,
    restrictedContentBehavior: "WITHHOLD_AND_CONTINUE_WITH_ALLOWED_SCAFFOLD",
    resultSourceBinding: {
      resultBoundActionIds: [...resultBoundActionIds],
      nonResultActionIds: ["AIX-ACT-PREPARE-TASK-PREVIEW"],
      refFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-REF",
      versionFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-VERSION",
      targetObjectId: "PUB-OBJ-RESULT",
      targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
      requiredState: "PUBLISHED",
      staleMissingOrMismatchBehavior: "KEEP_PREVIEW_UNAVAILABLE",
    },
  };
  module.sourceVersionContract = {
    genericSourceVersionFieldId: "AIX-PREVIEW-F-SOURCE-VERSION-REFS",
    genericReferenceFormat: "REGISTERED_OBJECT_IDENTITY_AND_VERSION_TUPLES",
    unknownSourceKinds: "REJECT",
    publishedResultUsesTypedVersionPinnedBinding: true,
    resultRefFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-REF",
    resultVersionFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-VERSION",
  };
  return module;
}

function plannedFlow(flow) {
  return {
    ...structuredClone(flow),
    phase: PHASE.SECOND,
  };
}

function pruneFlowToModules(flow, allowedModuleIds, fanoutFieldId) {
  const allowed = new Set(allowedModuleIds);
  const sourceModules = [
    ...teachingLoopModules,
    ...aiReportingModules,
  ];
  const actionModuleById = new Map(sourceModules.flatMap((module) => (
    module.actions.map((action) => [action.id, module.id])
  )));
  const objectModuleById = new Map(sourceModules.flatMap((module) => (
    module.objects.map((object) => [object.id, module.id])
  )));
  const fieldModuleById = new Map(sourceModules.flatMap((module) => (
    module.objects.flatMap((object) => object.fields.map((field) => [field.id, module.id]))
  )));
  const retainedSteps = flow.steps.filter(({ actionId }) => (
    allowed.has(actionModuleById.get(actionId))
  ));
  const orderMap = new Map(retainedSteps.map(({ order }, index) => [order, index + 1]));
  flow.steps = retainedSteps.map((step, index) => ({ ...step, order: index + 1 }));
  flow.moduleIds = flow.moduleIds.filter((moduleId) => allowed.has(moduleId));
  if (Array.isArray(flow.sourceOnlyModuleIds)) {
    flow.sourceOnlyModuleIds = flow.sourceOnlyModuleIds.filter((moduleId) => allowed.has(moduleId));
  }
  if (Array.isArray(flow.participantRoles)) {
    flow.participantRoles = flow.participantRoles.filter(({ moduleId }) => allowed.has(moduleId));
  }
  for (const property of ["sourceDataRefs", "targetDataRefs"]) {
    flow[property] = flow[property].filter(({ objectId }) => allowed.has(objectModuleById.get(objectId)));
  }
  if (Array.isArray(flow.executionPaths)) {
    flow.executionPaths = flow.executionPaths.map((path) => ({
      ...path,
      stepOrders: path.stepOrders.filter((order) => orderMap.has(order)).map((order) => orderMap.get(order)),
      providedInputs: path.providedInputs
        .filter(({ stepOrder }) => orderMap.has(stepOrder))
        .map((input) => ({ ...input, stepOrder: orderMap.get(input.stepOrder) })),
      route: {
        ...path.route,
        consumerStepOrder: orderMap.get(path.route.consumerStepOrder),
      },
      ...(Array.isArray(path.sourceBindings) ? {
        sourceBindings: path.sourceBindings
          .filter(({ sourceObjectId }) => allowed.has(objectModuleById.get(sourceObjectId)))
          .map((binding) => ({
            ...binding,
            consumerStepOrder: orderMap.get(binding.consumerStepOrder),
          })),
      } : {}),
    }));
  }
  if (flow.idempotencyKeyParts) {
    flow.idempotencyKeyParts.identityFieldIds = flow.idempotencyKeyParts.identityFieldIds
      .filter((fieldId) => allowed.has(fieldModuleById.get(fieldId)) && fieldId !== fanoutFieldId);
    flow.idempotencyKeyParts.versionFieldIds = flow.idempotencyKeyParts.versionFieldIds
      .filter((fieldId) => allowed.has(fieldModuleById.get(fieldId)));
    flow.idempotencyKeyParts.fanoutFieldId = fanoutFieldId;
  }
  return flow;
}

function buildPhaseTwoAssessmentFlows() {
  const base = [
    ...teachingLoopFlows,
    ...aiReportingFlows,
  ];
  return PHASE_TWO_ASSESSMENT_FLOW_IDS.map((id) => plannedFlow(
    base.find((flow) => flow.id === id),
  )).map((flow) => {
    if (flow.id === "DF-006") {
      flow.label = "Submission to AI Assessment and Completion Determination";
      flow.steps = flow.steps.map((step) => ({
        ...step,
        order: step.order === 2
          ? 3
          : step.order > 2
            ? step.order + 2
            : step.order,
      }));
      flow.steps.splice(1, 0, {
        order: 2,
        actionId: "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT",
        condition: "classify the initial submission as substantive, explicit don't-know, blank, unrelated, or placeholder without inferring completion or mastery",
        providedInputs: [
          {
            fieldId: "GRD-ATTEMPT-CLASS-F-SUBMISSION-REF",
            provider: { actorRef: "SYSTEM" },
          },
          {
            fieldId: "GRD-ATTEMPT-CLASS-F-SUBMISSION-VERSION",
            provider: { actorRef: "SYSTEM" },
          },
        ],
        sourceBindings: [
          {
            sourceObjectId: "SUB-OBJ-ATTEMPT",
            sourceFieldId: "SUB-ATTEMPT-F-ID",
            targetFieldId: "GRD-ATTEMPT-CLASS-F-SUBMISSION-REF",
          },
          {
            sourceObjectId: "SUB-OBJ-ATTEMPT",
            sourceFieldId: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
            targetFieldId: "GRD-ATTEMPT-CLASS-F-SUBMISSION-VERSION",
          },
        ],
      });
      flow.steps.splice(3, 0, {
        order: 4,
        actionId: ASSESSMENT_READINESS_ACTION_ID,
        condition: "resolve the exact frozen assessment-standard version bound to the accepted submission activity snapshot",
      });
      flow.sourceDataRefs.push(
        {
          objectId: ASSESSMENT_STANDARD_OBJECT_ID,
          fieldId: "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF",
          version: ASSESSMENT_STANDARD_VERSION_FIELD,
          cardinality: "ONE",
        },
        {
          objectId: ASSESSMENT_STANDARD_OBJECT_ID,
          fieldId: "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION",
          version: ASSESSMENT_STANDARD_VERSION_FIELD,
          cardinality: "ONE",
        },
        {
          objectId: ASSESSMENT_STANDARD_OBJECT_ID,
          fieldId: ASSESSMENT_STANDARD_ID_FIELD,
          version: ASSESSMENT_STANDARD_VERSION_FIELD,
          cardinality: "ONE",
        },
        {
          objectId: ASSESSMENT_STANDARD_OBJECT_ID,
          fieldId: ASSESSMENT_STANDARD_VERSION_FIELD,
          version: ASSESSMENT_STANDARD_VERSION_FIELD,
          cardinality: "ONE",
        },
      );
      flow.targetDataRefs.push(
        {
          objectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
          fieldId: "GRD-ATTEMPT-CLASS-F-ID",
          version: "GRD-ATTEMPT-CLASS-F-VERSION",
        },
        {
          objectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
          fieldId: "GRD-ATTEMPT-CLASS-F-CLASSIFICATION",
          version: "GRD-ATTEMPT-CLASS-F-VERSION",
        },
        {
          objectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
          fieldId: "GRD-ATTEMPT-CLASS-F-VERSION",
          version: "GRD-ATTEMPT-CLASS-F-VERSION",
        },
        {
          objectId: "GRD-OBJ-DECISION",
          fieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
          version: "GRD-DECISION-F-DECISION-VERSION",
        },
        {
          objectId: "GRD-OBJ-DECISION",
          fieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
          version: "GRD-DECISION-F-DECISION-VERSION",
        },
      );
      const enqueueStep = flow.steps.find(({ actionId }) => actionId === "GRD-ACT-ENQUEUE");
      enqueueStep.providedInputs = [
        {
          fieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
          provider: { actorRef: "SYSTEM" },
        },
        {
          fieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
          provider: { actorRef: "SYSTEM" },
        },
      ];
      enqueueStep.sourceBindings = [
        {
          sourceObjectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
          sourceFieldId: "GRD-ATTEMPT-CLASS-F-ID",
          targetFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
        },
        {
          sourceObjectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
          sourceFieldId: "GRD-ATTEMPT-CLASS-F-VERSION",
          targetFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
        },
      ];
      flow.idempotencyKeyParts.identityFieldIds.push(ASSESSMENT_STANDARD_ID_FIELD);
      flow.idempotencyKeyParts.versionFieldIds.push(ASSESSMENT_STANDARD_VERSION_FIELD);
      flow.failureGranularity = "SUBMISSION_ITEM_AI_ASSESSMENT_RESULT_VERSION";
      flow.retryPolicy = {
        strategy: "RETRY_FAILED_AI_ASSESSMENT_WITHOUT_CHANGING_SUBMISSION_FACTS",
        maxAttempts: 3,
        retryableFailureResults: ["AI_UNAVAILABLE", "VERSION_CONFLICT"],
      };
      flow.compensation = {
        strategy: "KEEP_UNPUBLISHED_AND_RETURN_AN_EXPLICIT_RECOVERY_NEXT_STEP",
        description: "an AI failure preserves the accepted submission and frozen standard, then requests concrete supplementation, permitted alternate review, or bounded professional exception review",
      };
      flow.downstreamInvalidation = {
        strategy: "INVALIDATE_STALE_AI_ASSESSMENT_DERIVED_VIEWS",
        targets: ["AI assessment result", "exception queue", "publication eligibility"],
      };
      flow.aiAssessmentContract = {
        nextSteps: [...NEXT_STEPS],
        routineTeacherAssessment: false,
        originalFactWritePolicy: "READ_ONLY_SOURCE_REFERENCE",
        assessmentStandardObjectId: ASSESSMENT_STANDARD_OBJECT_ID,
        assessmentStandardUse: "EXACT_SUBMISSION_BOUND_FROZEN_VERSION_ONLY",
        initialValidAttemptClassificationObjectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
        explicitDontKnowMeansCompleted: false,
        explicitDontKnowCreatesMasteryEvidence: false,
        decisionClassificationRefFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
        decisionClassificationVersionFieldId: "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
        exactClassificationVersionRequired: true,
      };
      flow.steps = flow.steps.map((step) => {
        const condition = ({
          "GRD-ACT-ROUTE-UNSUPPORTED": "source or input quality requires a concrete supplementation request",
          "GRD-ACT-PROCESS": "the source versions, frozen assessment standard, external-processing contract, and input quality permit AI assessment",
          "GRD-ACT-ROUTE": "AI assessment returns one explicit next step without routine human intervention",
          "GRD-ACT-ROUTE-AI-UNAVAILABLE": "a permitted alternate review is attempted before the professional exception queue",
        })[step.actionId];
        return condition ? { ...step, condition } : step;
      });
    }
    if (flow.id === "DF-007") {
      flow.label = "Bounded Professional AI Assessment Exception Resolution";
      flow.routineTeacherAssessment = false;
      flow.entryNextStep = "EXCEPTION_REVIEW_REQUIRED";
      const pathIds = {
        ACCEPT_SUGGESTION: "USE_EXISTING_AI_RESULT",
        CORRECT_RECOGNITION_AND_ACCEPT: "CORRECT_RECOGNITION_AND_USE_AI_RESULT",
        OVERRIDE_SCORE: "EVIDENCE_BACKED_EXCEPTION_CORRECTION",
        CORRECT_RECOGNITION_AND_OVERRIDE: "CORRECT_RECOGNITION_AND_EXCEPTION_CORRECTION",
        MANUAL_GRADE: "PROFESSIONAL_EXCEPTION_RESOLUTION",
        BATCH_CONFIRM: "BOUNDED_BATCH_EXCEPTION_RESOLUTION",
      };
      const stepConditions = {
        "GRD-ACT-CORRECT-RECOGNITION": "an authorized specialist corrects recognition evidence without changing the original submission",
        "GRD-ACT-ACCEPT-SUGGESTION": "an authorized professional exception uses the existing AI result with evidence-backed feedback",
        "GRD-ACT-OVERRIDE-SCORE": "an authorized professional exception records an evidence-backed score, level, or feedback correction",
        "GRD-ACT-MANUAL-GRADE": "the explicit next step requires a bounded professional exception resolution",
        "GRD-ACT-BATCH-CONFIRM": "each selected result independently qualifies for the same bounded professional exception resolution",
        "GRD-ACT-RESOLVE-VERSION-CONFLICT": "an authorized specialist resolves only the stale source-version conflict",
      };
      flow.steps = flow.steps.map((step) => ({
        ...step,
        condition: `${stepConditions[step.actionId]}; this path is unavailable for routine assessment`,
      }));
      flow.executionPaths = flow.executionPaths.map((path) => ({
        ...path,
        id: pathIds[path.id] ?? path.id,
      }));
      flow.failureGranularity = "PROFESSIONAL_EXCEPTION_RESULT_VERSION";
      flow.retryPolicy = {
        strategy: "REFRESH_SOURCE_VERSIONS_THEN_RETRY_PROFESSIONAL_EXCEPTION",
        maxAttempts: 3,
        retryableFailureResults: ["STALE_INPUT_VERSION", "SOURCE_VERSION_STILL_STALE", "VERSION_CONFLICT"],
      };
      flow.compensation = {
        strategy: "KEEP_PRIOR_EFFECTIVE_ASSESSMENT_RESULT",
        description: "a failed exception resolution never replaces the prior effective result and never publishes an unresolved exception",
      };
      flow.downstreamInvalidation = {
        strategy: "INVALIDATE_PUBLICATION_ELIGIBILITY_AND_DERIVED_EXPLANATIONS",
        targets: ["result publication eligibility", "assessment explanation", "knowledge evidence projection"],
      };
    }
    if (flow.id === "DF-008") {
      flow.label = "AI Assessment Gate Evaluation and Publication";
      flow.requiredGates = ["PERMISSION", "SAFETY", "TEACHING_CORRECTNESS"];
      flow.gateFailureBehavior = "KEEP_UNPUBLISHED";
      flow.routineTeacherAssessment = false;
      flow.steps = flow.steps.map((step) => {
        const condition = ({
          "GRD-ACT-ACCEPT-SUGGESTION": "an authorized professional exception uses the existing AI result; routine determined results skip this optional step",
          "GRD-ACT-OVERRIDE-SCORE": "an authorized evidence-backed professional exception correction exists; routine determined results skip this optional step",
          "GRD-ACT-MANUAL-GRADE": "the explicit next step is EXCEPTION_REVIEW_REQUIRED and an authorized specialist resolves it",
          "PUB-ACT-PUBLISH-SELECTED": "every selected result has one explicit next step and all required gates are ready for object-level evaluation",
          "PUB-ACT-PUBLISH-RESULT": "permission, safety, and teaching correctness gates all pass; any failure keeps the result unpublished",
        })[step.actionId];
        return condition ? { ...step, condition } : step;
      });
    }
    if (flow.id === "DF-009") {
      flow = pruneFlowToModules(flow, ["GRD-001", "PUB-001", "CORR-001"], "PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET");
      flow.label = "Batch AI Assessment Impact Location, Correction, Notification, and Recalculation";
      flow.preserveOriginalFacts = true;
      flow.preserveSupersededResultVersions = true;
      flow.steps = flow.steps.map((step) => ({
        ...step,
        condition: ({
          "PUB-ACT-RESOLVE-DEPENDENCY-SNAPSHOT": "locate every result version affected by the reported question, answer, standard, model, or rule version",
          "GRD-ACT-OPEN-CONFIRMED-REVISION": "open a versioned recalculation scope without modifying the original submission or superseded result",
          "GRD-ACT-CONFIRM-REVISION": "produce the corrected assessment result version under the same source and gate rules",
          "PUB-ACT-CORRECT-RESULT": "replace current derived use while retaining the prior published result version",
          "CORR-ACT-RECORD-INVALIDATION": "record downstream invalidation targets for later phase-owned recalculation consumers",
          "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION": "publish the corrected explanation only after all gates pass and queue affected-user notification",
        })[step.actionId] ?? step.condition,
      }));
      flow.failureGranularity = "AFFECTED_ASSESSMENT_RESULT_VERSION";
      flow.retryPolicy = {
        strategy: "RETRY_ONLY_FAILED_AFFECTED_RESULT_VERSIONS",
        maxAttempts: 3,
        retryableFailureResults: ["SOURCE_VERSION_STALE", "VERSION_CONFLICT", "AUDIT_FAILED"],
      };
      flow.compensation = {
        strategy: "KEEP_ORIGINAL_FACTS_AND_PRIOR_RESULT_VERSIONS",
        description: "failed recalculation never overwrites a submission or removes the last auditable result version",
      };
      flow.downstreamInvalidation = {
        strategy: "PUBLISH_VERSIONED_DERIVED_INVALIDATION_FOR_PHASE_OWNERS",
        targets: ["CURRENT_RESULT", "FUTURE_COGNITION", "FUTURE_PLAN", "FUTURE_REPORT", "FUTURE_LEARNING_PATH"],
      };
      flow.notificationBoundary = {
        eventId: ASSESSMENT_NOTIFICATION_EVENT_ID,
        producerActionId: "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
        payloadFieldIds: [
          "PUB-RESULT-F-ID",
          "PUB-RESULT-F-RESULT-VERSION",
          "PUB-RESULT-F-NOTIFICATION-STATUS",
        ],
        downstreamModuleId: "NOTI-001",
        answerOpenPolicyPointId: "ANSWER-OPEN-NOTIFICATION-PAYLOAD",
        sourceResultVersionRequired: true,
      };
    }
    if (flow.id === "DF-010") {
      flow = pruneFlowToModules(flow, ["PUB-001", "CORR-001"], "CORR-ATTEMPT-F-ID");
      flow.label = "Professional Exception Correction and Versioned Downstream Recalculation";
      flow.routineTeacherAssessment = false;
      flow.normalCorrectionReassessmentFlowId = "DF-006";
      const normalizationStep = flow.steps.find(({ actionId }) => (
        actionId === "CORR-ACT-NORMALIZE-SUBMISSION"
      ));
      normalizationStep.providedInputs = [
        {
          fieldId: "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-REF",
          provider: { actorRef: "SYSTEM" },
        },
        {
          fieldId: "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION",
          provider: { actorRef: "SYSTEM" },
        },
      ];
      normalizationStep.sourceBindings = [
        {
          sourceObjectId: "CORR-OBJ-ATTEMPT",
          sourceFieldId: "CORR-ATTEMPT-F-ID",
          targetFieldId: "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-REF",
        },
        {
          sourceObjectId: "CORR-OBJ-ATTEMPT",
          sourceFieldId: "CORR-ATTEMPT-F-CORRECTION-VERSION",
          targetFieldId: "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION",
        },
      ];
      for (const fieldId of [
        "CORR-ASSESSMENT-F-ID",
        "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-REF",
        "CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION",
        "CORR-ASSESSMENT-F-VALID-ATTEMPT",
        "CORR-ASSESSMENT-F-NEXT-STEP",
        "CORR-ASSESSMENT-F-VALIDITY-STATUS",
        "CORR-ASSESSMENT-F-DISPUTE-CORRECTION-STATUS",
        "CORR-ASSESSMENT-F-VERSION",
      ]) {
        flow.targetDataRefs.push({
          objectId: "CORR-OBJ-ATTEMPT-ASSESSMENT",
          fieldId,
          version: "CORR-ASSESSMENT-F-VERSION",
        });
      }
      flow.steps = flow.steps.map((step) => ({
        ...step,
        condition: ({
          "CORR-ACT-CONFIRM-JUDGMENT": "the explicit next step is EXCEPTION_REVIEW_REQUIRED and an authorized specialist records a completed exception resolution",
          "CORR-ACT-REQUEST-RETRY": "the explicit next step is EXCEPTION_REVIEW_REQUIRED and an authorized specialist records the precise missing evidence or retry condition",
          "CORR-ACT-RECORD-INVALIDATION": "the exception resolution emits versioned invalidation targets without directly executing phase-three cognition or plan actions",
        })[step.actionId] ?? step.condition,
      }));
      flow.failureGranularity = "CORRECTION_ATTEMPT_AND_RESULT_INVALIDATION_VERSION";
      flow.retryPolicy = {
        strategy: "RETRY_ONLY_FAILED_CORRECTION_OR_INVALIDATION_OBJECTS",
        maxAttempts: 3,
        retryableFailureResults: ["VERSION_CONFLICT", "AUDIT_FAILED"],
      };
      flow.compensation = {
        strategy: "KEEP_PRIOR_RESULT_AND_CORRECTION_HISTORY",
        description: "failed exception handling preserves the last visible result and every student correction attempt",
      };
      flow.downstreamInvalidation = {
        strategy: "PUBLISH_VERSIONED_DERIVED_INVALIDATION_FOR_PHASE_OWNERS",
        targets: ["CURRENT_RESULT", "FUTURE_COGNITION", "FUTURE_PLAN"],
      };
    }
    if (["DF-007", "DF-008", "DF-009"].includes(flow.id)) {
      for (const fieldId of [
        "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF",
        "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION",
      ]) {
        if (!flow.sourceDataRefs.some((reference) => reference.fieldId === fieldId)) {
          flow.sourceDataRefs.push({
            cardinality: "ONE",
            objectId: "GRD-OBJ-DECISION",
            fieldId,
            version: "GRD-DECISION-F-DECISION-VERSION",
          });
        }
      }
    }
    return flow;
  });
}

export const phaseTwoAssessmentOptionSets = deepFreeze([
  optionSet("OPT-AI2-001", "aiAssessmentProcessingStatus", "AI 评定处理状态", [
    ["QUEUED", "待处理"],
    ["PROCESSING", "处理中"],
    ["SUCCEEDED", "处理完成"],
    ["FAILED", "处理失败"],
  ]),
  optionSet("OPT-AI2-002", "aiResultPublicationStatus", "AI 结果发布状态", [
    ["UNPUBLISHED", "未发布"],
    ["PENDING_GATES", "待闸门检查"],
    ["PUBLISHED", "已发布"],
    ["WITHHELD", "保持未发布"],
    ["SUPERSEDED", "已被新版本替代"],
  ]),
  optionSet("OPT-AI2-003", "aiResultDisputeCorrectionStatus", "AI 结果质疑与纠正状态", [
    ["UNCHALLENGED", "未质疑"],
    ["CHALLENGED", "已质疑"],
    ["EVIDENCE_SUBMITTED", "已提交专业证据"],
    ["CORRECTION_PENDING", "纠正处理中"],
    ["RESOLVED", "质疑已解决"],
  ]),
  optionSet("OPT-AI2-004", "aiResultValidityStatus", "AI 结果有效性", [
    ["PENDING_VALIDATION", "待验证"],
    ["VALID", "当前有效"],
    ["STALE", "来源已陈旧"],
    ["INVALIDATED", "已失效"],
    ["SUPERSEDED", "已被新版本替代"],
  ]),
  optionSet("OPT-AI2-005", "aiAssessmentNextStep", "AI 评定明确下一步", [
    ["COMPLETED", "完成"],
    ["CORRECTION_REQUIRED", "退回订正"],
    ["MORE_INPUT_REQUIRED", "需要补充"],
    ["UNABLE_TO_DETERMINE", "无法判断"],
    ["EXCEPTION_REVIEW_REQUIRED", "待例外复核"],
  ]),
  optionSet("OPT-AI2-006", "aiPublicationGateOutcome", "AI 发布闸门结果", [
    ["PASS", "通过"],
    ["FAIL", "失败"],
    ["TIMEOUT", "超时"],
    ["UNAVAILABLE", "不可用"],
  ]),
  optionSet("OPT-AI2-007", "feedbackLayer", "学生反馈层级", FEEDBACK_LAYERS.map((code) => [code, code])),
  optionSet("OPT-AI2-008", "validAttemptClassification", "有效尝试分类", [
    ["SUBSTANTIVE_RESPONSE", "有实质内容的作答"],
    ["EXPLICIT_DONT_KNOW", "明确表示不会"],
    ["BLANK", "空白"],
    ["UNRELATED", "无关内容"],
    ["PLACEHOLDER", "占位提交"],
  ]),
  optionSet("OPT-AI2-009", "answerExposureCondition", "作答时答案暴露条件", [
    ["NOT_EXPOSED", "答案未开放"],
    ["ANSWER_EXPOSED", "答案或解法已开放"],
    ["UNKNOWN", "暴露条件未知"],
  ]),
  optionSet("OPT-AI2-010", "assessmentChallengeResolution", "评定质疑处理结果", [
    ["CORRECTED", "已纠正结果版本"],
    ["REPLACED", "已创建替代结果版本"],
    ["INVALIDATED", "已使结果失效"],
    ["UPHELD", "保留原结果版本"],
  ]),
]);

export const phaseTwoAssessmentEvents = deepFreeze([
  {
    id: ASSESSMENT_NOTIFICATION_EVENT_ID,
    label: "AI 评定批量纠正通知请求已形成",
    definition: "受影响结果完成版本化纠正并重新通过发布闸门后，产生包含结果身份和版本的通知请求边界，供通知域按答案开放策略创建和投递。",
    producerActionIds: ["PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION"],
  },
  {
    id: CHALLENGE_OPENED_EVENT_ID,
    label: "学生已对固定 AI 评定结果版本发起质疑",
    definition: "学生质疑只引用本人可见的结果身份与版本，不改写原始提交或被质疑结果。",
    producerActionIds: ["PUB-ACT-OPEN-RESULT-CHALLENGE"],
    triggeredActionIds: ["PUB-ACT-MARK-RESULT-CHALLENGED"],
  },
  {
    id: PROFESSIONAL_EVIDENCE_EVENT_ID,
    label: "学科专业证据已提交",
    definition: "对应学科教师提交版本化专业证据后，仅将固定结果的质疑纠正轴推进到待处理。",
    producerActionIds: ["PUB-ACT-SUBMIT-PROFESSIONAL-EVIDENCE"],
    triggeredActionIds: ["PUB-ACT-MARK-RESULT-CORRECTION-PENDING"],
  },
  {
    id: CHALLENGE_RESOLVED_EVENT_ID,
    label: "AI 评定质疑已形成版本化处理结果",
    definition: "纠正、替代、失效或维持原结果后，关闭对应质疑版本并保留全部结果历史。",
    producerActionIds: [
      "PUB-ACT-CORRECT-CHALLENGED-RESULT",
      "PUB-ACT-REPLACE-RESULT",
      "PUB-ACT-INVALIDATE-RESULT",
      "PUB-ACT-UPHOLD-RESULT",
    ],
    triggeredActionIds: ["PUB-ACT-CLOSE-RESULT-CHALLENGE"],
  },
]);

export function replacePhaseTwoAssessmentEvents(events) {
  const transformed = events.map((event) => {
    if (event.id !== ASSESSMENT_STANDARD_EVENT_ID) return event;
    const replacement = structuredClone(event);
    replacement.triggeredActionIds = [...new Set([
      ...replacement.triggeredActionIds,
      "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD",
    ])];
    replacement.assessmentStandardConsumerBinding = {
      ...structuredClone(PUBLICATION_SNAPSHOT_INTERFACE),
      producerOutputBindings: [
        {
          producerFieldId: "HW-ASSIGNMENT-F-PUBLICATION-SNAPSHOT-REF",
          consumerFieldId: "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF",
          targetIdentityFieldId: "HW-SNAPSHOT-F-ID",
        },
        {
          producerFieldId: "HW-ASSIGNMENT-F-PUBLICATION-SNAPSHOT-VERSION",
          consumerFieldId: "GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION",
          targetVersionFieldId: "HW-SNAPSHOT-F-VERSION",
        },
      ],
      failClosed: true,
    };
    return replacement;
  });
  return [...transformed, ...phaseTwoAssessmentEvents];
}

export function replacePhaseTwoAssessmentAiTasks(aiTasks) {
  const affectedTaskIds = new Set([
    "AI-TASK-ASSIGNMENT-DRAFT",
    "AI-TASK-FEEDBACK-DRAFT",
    "AI-TASK-IMPROVEMENT-PLAN-DRAFT",
  ]);
  const commonRequired = [
    "userVisibleContent",
    "sourceVersionRefs",
    "evidenceReferences",
    "modelVersion",
    "capabilityVersion",
    "ruleVersion",
    "safetyVersion",
    "permissionGate",
    "safetyGate",
    "teachingCorrectnessGate",
    "answerOpenGate",
  ];
  const commonProperties = {
    userVisibleContent: { type: "string" },
    sourceVersionRefs: { type: "array", items: { type: "string" } },
    evidenceReferences: { type: "array", items: { type: "string" } },
    resultReference: { type: "string" },
    modelVersion: { type: "string" },
    capabilityVersion: { type: "string" },
    ruleVersion: { type: "string" },
    safetyVersion: { type: "string" },
    permissionGate: { type: "string", enum: ["PASS"] },
    safetyGate: { type: "string", enum: ["PASS"] },
    teachingCorrectnessGate: { type: "string", enum: ["PASS"] },
    answerOpenGate: { type: "string", enum: ["PASS"] },
  };
  const commonPersistenceMapping = {
    userVisibleContent: "AIX-PREVIEW-F-USER-VISIBLE-CONTENT",
    sourceVersionRefs: "AIX-PREVIEW-F-SOURCE-VERSION-REFS",
    evidenceReferences: "AIX-PREVIEW-F-EVIDENCE-REFERENCES",
    resultReference: "AIX-PREVIEW-F-RESULT-REFERENCE",
    modelVersion: "AIX-PREVIEW-F-MODEL-VERSION",
    capabilityVersion: "AIX-PREVIEW-F-CAPABILITY-VERSION",
    ruleVersion: "AIX-PREVIEW-F-RULE-VERSION",
    safetyVersion: "AIX-PREVIEW-F-SAFETY-VERSION",
    permissionGate: "AIX-PREVIEW-F-PERMISSION-GATE",
    safetyGate: "AIX-PREVIEW-F-SAFETY-GATE",
    teachingCorrectnessGate: "AIX-PREVIEW-F-TEACHING-CORRECTNESS-GATE",
    answerOpenGate: "AIX-PREVIEW-F-ANSWER-OPEN-GATE",
  };
  const assignmentInputMapping = {
    title: "HW-ASSIGNMENT-F-TITLE",
    instructions: "HW-ASSIGNMENT-F-INSTRUCTIONS",
    subjectId: "HW-ASSIGNMENT-F-SUBJECT-ID",
    courseId: "HW-ASSIGNMENT-F-COURSE-ID",
    classScopeIds: "HW-ASSIGNMENT-F-CLASS-SCOPE-IDS",
    openAt: "HW-ASSIGNMENT-F-OPEN-AT",
    dueAt: "HW-ASSIGNMENT-F-DUE-AT",
    latePolicy: "HW-ASSIGNMENT-F-LATE-POLICY",
    resubmissionPolicy: "HW-ASSIGNMENT-F-RESUBMISSION-POLICY",
    assignmentType: "HW-ASSIGNMENT-F-ASSIGNMENT-TYPE",
    purpose: "HW-ASSIGNMENT-F-PURPOSE",
    helpRuleRef: "HW-ASSIGNMENT-F-HELP-RULE-REF",
    answerOpenPolicy: "HW-ASSIGNMENT-F-ANSWER-OPEN-POLICY",
    diagnosticUse: "HW-ASSIGNMENT-F-DIAGNOSTIC-USE",
    lateEnrolleeWindowPolicy: "HW-ASSIGNMENT-F-LATE-ENROLLEE-WINDOW-POLICY",
    questionOrder: "HW-ASSIGNMENT-F-QUESTION-ORDER",
    rubricVersion: "HW-ASSIGNMENT-F-RUBRIC-VERSION",
    knowledgePointIds: "HW-ASSIGNMENT-F-KNOWLEDGE-POINT-IDS",
    feedbackPolicy: "HW-ASSIGNMENT-F-FEEDBACK-POLICY",
    notificationPolicy: "HW-ASSIGNMENT-F-NOTIFICATION-POLICY",
    helpRuleVersion: "HW-ASSIGNMENT-F-HELP-RULE-VERSION",
    schoolTimePolicyRef: "HW-ASSIGNMENT-F-SCHOOL-TIME-POLICY-REF",
    schoolTimePolicyVersion: "HW-ASSIGNMENT-F-SCHOOL-TIME-POLICY-VERSION",
  };
  const assignmentProperties = Object.fromEntries(
    Object.keys(assignmentInputMapping).map((property) => [property, (
      ["classScopeIds", "knowledgePointIds"].includes(property)
        ? { type: "array", items: { type: "string" } }
        : ["helpRuleVersion", "schoolTimePolicyVersion"].includes(property)
          ? { type: "integer" }
          : { type: "string" }
    )]),
  );
  return aiTasks.map((task) => {
    if (!affectedTaskIds.has(task.id)) return task;
    const replacement = structuredClone(task);
    replacement.previewFieldIds = replacement.previewFieldIds.map((fieldId) => (
      fieldId === "AIX-PREVIEW-F-PARAMETERS" ? "AIX-PREVIEW-F-USER-REQUEST" : fieldId
    ));
    if (task.id !== "AI-TASK-ASSIGNMENT-DRAFT") {
      replacement.previewFieldIds = [...new Set([
        ...replacement.previewFieldIds,
        "AIX-PREVIEW-F-SOURCE-RESULT-REF",
        "AIX-PREVIEW-F-SOURCE-RESULT-VERSION",
      ])];
    }
    replacement.resultSchema = {
      type: "object",
      required: task.id === "AI-TASK-ASSIGNMENT-DRAFT"
        ? [...commonRequired, "resultReference", ...Object.keys(assignmentInputMapping)]
        : [...commonRequired],
      properties: {
        ...structuredClone(commonProperties),
        ...(task.id === "AI-TASK-ASSIGNMENT-DRAFT"
          ? structuredClone(assignmentProperties)
          : {}),
      },
      additionalProperties: false,
    };
    replacement.resultPersistenceMapping = structuredClone(commonPersistenceMapping);
    replacement.providerResponseBoundary = structuredClone(CLOSED_PROVIDER_RESPONSE_BOUNDARY);
    if (task.id === "AI-TASK-ASSIGNMENT-DRAFT") {
      replacement.confirmationInputMapping = structuredClone(assignmentInputMapping);
      replacement.transientConfirmationContract = {
        previewActionId: "AIX-ACT-PREPARE-TASK-PREVIEW",
        previewRequestFieldId: "AIX-PREVIEW-F-USER-REQUEST",
        resultReferenceFieldId: "AIX-PREVIEW-F-RESULT-REFERENCE",
        targetActionId: "HW-ACT-CREATE-DRAFT",
        targetInputFieldIds: Object.values(assignmentInputMapping),
        providerFieldsPersistedBeforeConfirmation: false,
        confirmationRequired: true,
        discardOnExpiryOrCancellation: true,
      };
    }
    return deepFreeze(replacement);
  });
}

export const phaseTwoAssessmentModules = deepFreeze([
  gradingModule(),
  publicationModule(),
  correctionModule(),
  aixModule(),
]);

export const phaseTwoAssessmentFlows = deepFreeze(buildPhaseTwoAssessmentFlows());

export function replacePhaseTwoAssessmentOptionSets(optionSets) {
  return optionSets.map((optionSetValue) => {
    if (optionSetValue.id === "OPT-TL-005") {
      return deepFreeze({
        ...structuredClone(optionSetValue),
        label: "AI 评定能力级别",
        values: optionSetValue.values.map((value) => value.code === "MANUAL-ONLY"
          ? { code: "EXCEPTION-ONLY", label: "仅限专业例外复核" }
          : value),
      });
    }
    if (optionSetValue.id === "OPT-TL-006") {
      return deepFreeze({
        ...structuredClone(optionSetValue),
        label: "AI 评定证据要求",
        values: optionSetValue.values.map((value) => value.code === "TEACHER-JUDGMENT"
          ? { code: "PROFESSIONAL-EXCEPTION-EVIDENCE", label: "专业例外证据" }
          : value),
      });
    }
    if (optionSetValue.id === "OPT-TL-007") {
      return deepFreeze({
        ...structuredClone(optionSetValue),
        key: "automatedBatchDeterminationEligibility",
        label: "自动批量判定资格",
        values: optionSetValue.values.map((value) => ({
          ...value,
          label: value.code === "ELIGIBLE" ? "可自动批量判定" : "不可自动批量判定",
        })),
      });
    }
    if (optionSetValue.id === "OPT-TL-008") {
      return deepFreeze({
        ...structuredClone(optionSetValue),
        key: "unableToDetermineRecovery",
        label: "无法判断恢复路径",
        values: optionSetValue.values.map((value) => value.code === "MANUAL-GRADING"
          ? { code: "PROFESSIONAL-EXCEPTION-REVIEW", label: "专业例外复核" }
          : { code: "CONCRETE-SUPPLEMENT-THEN-ALTERNATE-REVIEW", label: "具体补证后替代复核" }),
      });
    }
    if (optionSetValue.id === "OPT-TL-011") {
      return deepFreeze({
        ...structuredClone(optionSetValue),
        key: "aiAssessmentRoute",
        label: "AI 评定与完成判定路线",
        values: [
          { code: "AI-DETERMINATION", label: "AI 形成明确下一步" },
          { code: "CONCRETE-SUPPLEMENT", label: "请求具体补证" },
          { code: "PERMITTED-ALTERNATE-REVIEW", label: "采用允许的替代复核" },
          { code: "PROFESSIONAL-EXCEPTION-REVIEW", label: "进入专业例外复核" },
        ],
      });
    }
    return optionSetValue;
  });
}

export function replacePhaseTwoAssessmentModules(modules) {
  const replacementById = new Map(
    phaseTwoAssessmentModules.map((module) => [module.id, module]),
  );
  return modules.map((module) => {
    const phaseTwoReplacement = replacementById.get(module.id);
    if (phaseTwoReplacement) return phaseTwoReplacement;
    if (module.id === "HW-001") {
      const replacement = structuredClone(module);
      for (const actionId of [
        "HW-ACT-PUBLISH-NOW",
        "HW-ACT-PUBLISH-SCHEDULED",
        "HW-ACT-PUBLISH-REPLACEMENT",
      ]) {
        const action = replacement.actions.find(({ id }) => id === actionId);
        action.producedEventIds = [...new Set([
          ...(action.producedEventIds ?? []),
          ASSESSMENT_STANDARD_EVENT_ID,
        ])];
      }
      return deepFreeze(replacement);
    }
    return module;
  });
}

export function deferPhaseThreeFlowActions(modules) {
  const deferredActionIds = new Set([
    "LPATH-ACT-APPEND-CORRECTION-TIMELINE",
    "LPATH-ACT-APPEND-EVIDENCE-TIMELINE",
    "LPATH-ACT-APPEND-PLAN-EXECUTION-TIMELINE",
    "LPATH-ACT-APPEND-PUBLISHED-RESULT-TIMELINE",
    "LPATH-ACT-APPEND-TEACHER-CONFIRMATION-TIMELINE",
    "LPATH-ACT-CREATE-INTERPRETATION-CANDIDATE",
  ]);
  return modules.map((module) => {
    if (!module.actions.some(({ id }) => deferredActionIds.has(id))) return module;
    const replacement = structuredClone(module);
    for (const action of replacement.actions.filter(({ id }) => deferredActionIds.has(id))) {
      action.trigger = { kind: "FLOW", flowIds: ["DF-011"] };
      action.deferredFlowRegistration = {
        flowId: "DF-011",
        targetPhase: PHASE.THIRD,
        releaseStatus: RELEASE_STATUS.PLANNED,
        executionAllowedBeforeRegistration: false,
      };
    }
    for (const scenario of replacement.scenarios.filter(({ actionId }) => (
      deferredActionIds.has(actionId)
    ))) {
      scenario.trigger = { kind: "FLOW", flowIds: ["DF-011"] };
    }
    return deepFreeze(replacement);
  });
}

export function replacePhaseTwoAssessmentFlows(flows) {
  const replacementById = new Map(
    phaseTwoAssessmentFlows.map((flow) => [flow.id, flow]),
  );
  return flows
    .filter(({ id }) => id !== "DF-011")
    .map((flow) => replacementById.get(flow.id) ?? flow);
}
