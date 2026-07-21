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

const ASSESSMENT_STANDARD_EVENT_ID = "EVT-ACTIVITY-ASSESSMENT-STANDARD-REQUIRED";
const ASSESSMENT_NOTIFICATION_EVENT_ID = "EVT-AI-ASSESSMENT-CORRECTION-NOTIFICATION-REQUESTED";
const ASSESSMENT_STANDARD_OBJECT_ID = "GRD-OBJ-ASSESSMENT-STANDARD-VERSION";
const ASSESSMENT_STANDARD_ID_FIELD = "GRD-STANDARD-F-ID";
const ASSESSMENT_STANDARD_VERSION_FIELD = "GRD-STANDARD-F-VERSION";
const STUDENT_ANSWER_ACTION_IDS = [
  "SUB-ACT-SAVE-DRAFT",
  "SUB-ACT-UPLOAD-CHUNK",
  "SUB-ACT-RETRY-UPLOAD",
  "SUB-ACT-SUBMIT",
];
const ANSWER_OPEN_POLICY_FIELD_IDS = [
  "PUB-RESULT-F-ANSWER-OPEN-POLICY-ID",
  "PUB-RESULT-F-ANSWER-OPEN-POLICY-VERSION",
];
const ANSWER_OPEN_TIME_FIELD_IDS = [
  "PUB-RESULT-F-ANSWER-OPEN-AT",
  "PUB-RESULT-F-SOLUTION-OPEN-AT",
  "PUB-RESULT-F-RUBRIC-OPEN-AT",
];

const ANSWER_OPEN_ENFORCEMENT_POINTS = [
  ["PAGE", "ACTION", ["PUB-ACT-VIEW-RESULT"]],
  ["SEARCH", "POLICY_POINT", "ANSWER-OPEN-SEARCH-FILTER"],
  ["EXPORT", "POLICY_POINT", "ANSWER-OPEN-EXPORT-SERIALIZER"],
  ["NOTIFICATION", "POLICY_POINT", "ANSWER-OPEN-NOTIFICATION-PAYLOAD"],
  ["AI_CONVERSATION", "ACTION", [
    "AIX-ACT-PREPARE-TASK-PREVIEW",
    "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW",
    "AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW",
  ]],
  ["VIDEO", "POLICY_POINT", "ANSWER-OPEN-VIDEO-DELIVERY"],
  ["CACHE", "POLICY_POINT", "ANSWER-OPEN-CACHE-GATE"],
  ["DIRECT_LINK", "POLICY_POINT", "ANSWER-OPEN-DIRECT-LINK-RESOLVER"],
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
  module.scenarios.push({
    id: scenarioId,
    kind: "BOUNDARY",
    resultCode,
    actionId,
    ...(action.executionMode === "USER_TASK" ? {} : { trigger: structuredClone(action.trigger) }),
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
    dataSubject: "GRADING_CAPABILITY",
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
    inputFieldIds: [],
    outputFieldIds: generatedFieldIds,
    operationKind: "CREATE",
    writes: true,
    risk: "HIGH",
    executionMode: "SYSTEM_EVENT",
    trigger: { kind: "EVENT", eventId: ASSESSMENT_STANDARD_EVENT_ID },
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
    ],
    idempotencyKey: "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD:activity-snapshot-id:activity-snapshot-version",
    auditMode: "REQUIRED",
    failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT", "AUDIT_FAILED"],
  };
  const readAction = {
    id: "GRD-ACT-READ-FROZEN-ASSESSMENT-STANDARD",
    label: "Resolve the Submission-bound Frozen Assessment Standard",
    targetObjectId: ASSESSMENT_STANDARD_OBJECT_ID,
    inputFieldIds: [],
    outputFieldIds: [ASSESSMENT_STANDARD_ID_FIELD, ASSESSMENT_STANDARD_VERSION_FIELD],
    operationKind: "READ",
    writes: false,
    risk: "READ",
    executionMode: "FLOW_INTERNAL",
    trigger: { kind: "FLOW", flowIds: ["DF-006"] },
    permissions: [
      { effect: "ALLOW", actorRef: "SYSTEM", condition: "DF-006 resolves only the frozen standard bound to the accepted submission activity snapshot" },
      { effect: "DENY", actorRef: "CURRENT_ACTOR", condition: "a user cannot invoke the internal assessment-standard resolver" },
    ],
    scenarioIds: [
      "GRD-ACT-READ-FROZEN-ASSESSMENT-STANDARD-SCN-SUCCESS",
      "GRD-ACT-READ-FROZEN-ASSESSMENT-STANDARD-SCN-PERMISSION_DENIED",
      "GRD-ACT-READ-FROZEN-ASSESSMENT-STANDARD-SCN-NOT_FOUND",
      "GRD-ACT-READ-FROZEN-ASSESSMENT-STANDARD-SCN-SNAPSHOT_MISMATCH",
    ],
    auditMode: "REQUIRED",
    failureResults: ["PERMISSION_DENIED", "NOT_FOUND", "SNAPSHOT_MISMATCH"],
    snapshotMatch: "EXACT_ACTIVITY_SNAPSHOT_ID_AND_VERSION",
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
      scenario(generateAction.scenarioIds[0], generateAction, "SUCCESS", undefined, { mode: "STATE", value: "FROZEN" }, "ALLOW", "creates one immutable standard version before the activity accepts a student answer"),
      ...generateAction.failureResults.map((code, index) => scenario(
        generateAction.scenarioIds[index + 1],
        generateAction,
        code === "PERMISSION_DENIED" ? "FAILURE" : "BOUNDARY",
        code,
        { mode: "UNCHANGED" },
        code === "PERMISSION_DENIED" ? "DENY" : "ALLOW",
        `${code} blocks activity answer acceptance until a frozen standard exists`,
      )),
      scenario(readAction.scenarioIds[0], readAction, "SUCCESS", undefined, { mode: "UNCHANGED" }, "ALLOW", "returns only the exact frozen standard ID and version bound to the submission"),
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
  const standardActions = assessmentStandardActions();
  module.objects.push(standard);
  module.actions.push(...standardActions.actions);
  module.scenarios.push(...standardActions.scenarios);
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
    systemField("GRD-DECISION-F-ACTIVITY-SNAPSHOT-REF", "Published Activity Snapshot Reference", { dataType: "ID", mutability: "IMMUTABLE" }),
    systemField("GRD-DECISION-F-ACTIVITY-SNAPSHOT-VERSION", "Published Activity Snapshot Version", { dataType: "INTEGER", mutability: "IMMUTABLE" }),
    systemField("GRD-DECISION-F-HELP-ENVIRONMENT", "Actual Help Environment", { dataType: "JSON", mutability: "IMMUTABLE" }),
    systemField("GRD-DECISION-F-INPUT-QUALITY", "Input and Recognition Quality", { dataType: "JSON", mutability: "IMMUTABLE" }),
    systemField("GRD-DECISION-F-EVIDENCE-REFS", "Verifiable Evidence References", { dataType: "STRING_ARRAY", mutability: "IMMUTABLE" }),
    systemField("GRD-DECISION-F-CONCLUSION", "AI Assessment Conclusion", { dataType: "JSON" }),
    systemField("GRD-DECISION-F-FEEDBACK-REF", "Versioned Feedback Reference", { dataType: "ID" }),
    systemField("GRD-DECISION-F-NEXT-ACTION", "Concrete Next Action", { dataType: "JSON" }),
    systemField("GRD-TRACE-F-BUSINESS-TASK-ID", "AI Business Task ID", { dataType: "ID", mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-EXTERNAL-REFERENCE", "External Processing Reference", { dataType: "ID", mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-MODEL-VERSION", "Model Version", { mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-CAPABILITY-VERSION", "AI Capability Version", { mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-RULE-VERSION", "Assessment Rule Version", { mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-SAFETY-VERSION", "Safety Policy Version", { mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-EVIDENCE-REFERENCES", "Trace Evidence References", { dataType: "STRING_ARRAY", mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-RESULT-REFERENCE", "Trace Result Reference", { dataType: "ID", mutability: "IMMUTABLE" }),
    systemField("GRD-TRACE-F-GATE-OUTCOMES", "Trace Gate Outcomes", { dataType: "JSON", mutability: "IMMUTABLE" }),
  ];
  appendObjectFields(module, "GRD-OBJ-DECISION", fields);
  appendActionOutputs(module, "GRD-ACT-PROCESS", fields.map(({ id }) => id));
  appendActionOutputs(module, "GRD-ACT-ROUTE", [
    "GRD-DECISION-F-NEXT-STEP",
    "GRD-DECISION-F-NEXT-ACTION",
    "GRD-DECISION-F-DECISION-VERSION",
  ]);

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
    nextStep: {
      fieldId: "GRD-DECISION-F-NEXT-STEP",
      optionSetId: "OPT-AI2-005",
      values: [...NEXT_STEPS],
      requiredForEverySubmission: true,
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
  module.assessmentStandardContract = {
    objectId: ASSESSMENT_STANDARD_OBJECT_ID,
    generationEventId: ASSESSMENT_STANDARD_EVENT_ID,
    generateActionId: "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD",
    resolveActionId: "GRD-ACT-READ-FROZEN-ASSESSMENT-STANDARD",
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
    studentAnswerGateActionIds: [...STUDENT_ANSWER_ACTION_IDS],
    immutableAfterGeneration: true,
    replacementPolicy: "NEW_ACTIVITY_OR_STANDARD_VERSION_ONLY",
    aiUseMode: "EXACT_SUBMISSION_BOUND_VERSION_ONLY",
    scoreOrLevelOptional: true,
    feedbackOnlyAllowed: true,
    defaultIdentifiedCompositeRankingAllowed: false,
    permanentStudentLabelAllowed: false,
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
    originalFactObjectIds: ["SUB-OBJ-ATTEMPT"],
    derivedJudgmentObjectIds: ["GRD-OBJ-DECISION", "PUB-OBJ-RESULT"],
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
  result.producerRef = "SYSTEM";
  result.confirmerRef = "SYSTEM";
  result.dataNature = "AI_DERIVED_JUDGMENT";

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
    systemField("PUB-RESULT-F-ANSWER-OPEN-AT", "Complete Answer Open Time", { dataType: "DATETIME", mutability: "IMMUTABLE" }),
    systemField("PUB-RESULT-F-SOLUTION-OPEN-AT", "Complete Solution Open Time", { dataType: "DATETIME", mutability: "IMMUTABLE" }),
    systemField("PUB-RESULT-F-RUBRIC-OPEN-AT", "Assessment Standard Open Time", { dataType: "DATETIME", mutability: "IMMUTABLE" }),
    systemField("PUB-RESULT-F-ANSWER-OPEN-POLICY-ID", "Answer-open Policy ID", { dataType: "ID", mutability: "IMMUTABLE" }),
    systemField("PUB-RESULT-F-ANSWER-OPEN-POLICY-VERSION", "Answer-open Policy Version", { dataType: "INTEGER", mutability: "IMMUTABLE" }),
    systemField("PUB-RESULT-F-LAST-ACCESS-REAUTHORIZED-AT", "Last Access-time Reauthorization", { dataType: "DATETIME" }),
  ];
  appendObjectFields(module, "PUB-OBJ-RESULT", fields, { includeInPages: false });
  appendActionOutputs(module, "PUB-ACT-PUBLISH-RESULT", [
    "PUB-RESULT-F-PUBLICATION-STATUS",
    "PUB-RESULT-F-VALIDITY-STATUS",
    "PUB-RESULT-F-PERMISSION-GATE",
    "PUB-RESULT-F-SAFETY-GATE",
    "PUB-RESULT-F-TEACHING-CORRECTNESS-GATE",
    "PUB-RESULT-F-RESULT-VERSION",
  ]);

  const publishResult = module.actions.find(({ id }) => id === "PUB-ACT-PUBLISH-RESULT");
  publishResult.gateEvaluation = {
    gateFieldIds: [
      "PUB-RESULT-F-PERMISSION-GATE",
      "PUB-RESULT-F-SAFETY-GATE",
      "PUB-RESULT-F-TEACHING-CORRECTNESS-GATE",
    ],
    requiredPassCode: "PASS",
    anyOtherOutcome: "KEEP_UNPUBLISHED",
    evaluatedAtomicallyWithPublication: true,
  };

  const viewResult = module.actions.find(({ id }) => id === "PUB-ACT-VIEW-RESULT");
  viewResult.answerOpenEnforcement = {
    policyId: "ANSWER-OPEN-POLICY-V2",
    policyFieldIds: [...ANSWER_OPEN_POLICY_FIELD_IDS],
    openTimeFieldIds: [...ANSWER_OPEN_TIME_FIELD_IDS],
    reauthorizeAtAccess: true,
    beforeOpenBehavior: "WITHHOLD_RESTRICTED_CONTENT",
  };

  const correctionNotificationProducer = module.actions.find(({ id }) => (
    id === "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION"
  ));
  correctionNotificationProducer.inputFieldIds.push("PUB-RESULT-F-ID");
  correctionNotificationProducer.producedEventIds = [ASSESSMENT_NOTIFICATION_EVENT_ID];

  for (const [code, message] of [
    ["PERMISSION_GATE_FAILED", "permission or input isolation failed; the result stays unpublished"],
    ["SAFETY_GATE_FAILED", "the safety gate failed; the result stays unpublished"],
    ["TEACHING_CORRECTNESS_GATE_FAILED", "teaching correctness failed; the result stays unpublished"],
    ["GATE_UNAVAILABLE", "a required gate timed out or was unavailable; the result stays unpublished without downgrade"],
  ]) appendFailureResult(module, "PUB-ACT-PUBLISH-RESULT", code, message);

  module.aiPublicationContract = {
    requiredGates: ["PERMISSION", "SAFETY", "TEACHING_CORRECTNESS"],
    gateFieldIds: [
      "PUB-RESULT-F-PERMISSION-GATE",
      "PUB-RESULT-F-SAFETY-GATE",
      "PUB-RESULT-F-TEACHING-CORRECTNESS-GATE",
    ],
    publishActionId: "PUB-ACT-PUBLISH-RESULT",
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
  };
  module.answerOpenContract = {
    policyId: "ANSWER-OPEN-POLICY-V2",
    independentTimes: ["ANSWER_OPEN_AT", "SOLUTION_OPEN_AT", "RUBRIC_OPEN_AT"],
    fieldBindings: {
      ANSWER_OPEN_AT: "PUB-RESULT-F-ANSWER-OPEN-AT",
      SOLUTION_OPEN_AT: "PUB-RESULT-F-SOLUTION-OPEN-AT",
      RUBRIC_OPEN_AT: "PUB-RESULT-F-RUBRIC-OPEN-AT",
    },
    surfaces: [...ANSWER_SURFACES],
    enforcementBindings: structuredClone(ANSWER_OPEN_ENFORCEMENT_POINTS),
    sharedPolicy: true,
    reauthorizeEveryAccess: true,
    cachePolicy: "PURGE_OR_WITHHOLD_UNTIL_AUTHORIZED_OPEN_TIME",
  };
  return module;
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
  const fields = [
    optionField("CORR-ATTEMPT-F-VALID-ATTEMPT", "Correction Attempt Classification", "OPT-AI2-008"),
    optionField("CORR-ATTEMPT-F-NEXT-STEP", "Correction AI Assessment Next Step", "OPT-AI2-005"),
    optionField("CORR-ATTEMPT-F-ANSWER-EXPOSURE", "Answer Exposure Condition", "OPT-AI2-009"),
    systemField("CORR-ATTEMPT-F-EVIDENCE-KIND", "Correction Evidence Kind", { mutability: "IMMUTABLE" }),
  ];
  appendObjectFields(module, "CORR-OBJ-ATTEMPT", fields);
  appendActionOutputs(module, "CORR-ACT-NORMALIZE-SUBMISSION", fields.map(({ id }) => id));
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
    fieldId: "CORR-ATTEMPT-F-VALID-ATTEMPT",
    optionSetId: "OPT-AI2-008",
    valid: ["SUBSTANTIVE_RESPONSE", "EXPLICIT_DONT_KNOW"],
    invalid: ["BLANK", "UNRELATED", "PLACEHOLDER"],
    explicitDontKnowMeansCompleted: false,
    explicitDontKnowUnlocksCompleteAnswer: false,
  };
  module.answerExposedEvidenceContract = {
    fieldId: "CORR-ATTEMPT-F-ANSWER-EXPOSURE",
    evidenceKindFieldId: "CORR-ATTEMPT-F-EVIDENCE-KIND",
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

  const fields = [
    systemField("AIX-PREVIEW-F-ANSWER-OPEN-POLICY-ID", "Answer-open Policy ID", { dataType: "ID", mutability: "IMMUTABLE" }),
    systemField("AIX-PREVIEW-F-ANSWER-OPEN-POLICY-VERSION", "Answer-open Policy Version", { dataType: "INTEGER", mutability: "IMMUTABLE" }),
    systemField("AIX-PREVIEW-F-AUTHORIZATION-CHECKED-AT", "Access-time Authorization Check", { dataType: "DATETIME" }),
    systemField("AIX-PREVIEW-F-RESTRICTED-CONTENT-MASK", "Restricted Answer, Solution, and Rubric Mask", { dataType: "JSON" }),
  ];
  appendObjectFields(module, "AIX-OBJ-TASK-PREVIEW", fields);
  for (const action of module.actions) {
    appendActionOutputs(module, action.id, fields.map(({ id }) => id));
    action.answerOpenPolicyRequired = true;
    action.reauthorizeOnEveryAccess = true;
  }
  module.answerOpenEnforcement = {
    policyId: "ANSWER-OPEN-POLICY-V2",
    surface: "AI_CONVERSATION",
    policyFieldIds: [
      "AIX-PREVIEW-F-ANSWER-OPEN-POLICY-ID",
      "AIX-PREVIEW-F-ANSWER-OPEN-POLICY-VERSION",
    ],
    reauthorizeEveryAccess: true,
    restrictedContentBehavior: "WITHHOLD_AND_CONTINUE_WITH_ALLOWED_SCAFFOLD",
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
        order: step.order > 2 ? step.order + 1 : step.order,
      }));
      flow.steps.splice(2, 0, {
        order: 3,
        actionId: "GRD-ACT-READ-FROZEN-ASSESSMENT-STANDARD",
        condition: "resolve the exact frozen assessment-standard version bound to the accepted submission activity snapshot",
      });
      flow.sourceDataRefs.push(
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
    return flow;
  });
}

export const phaseTwoAssessmentOptionSets = deepFreeze([
  optionSet("OPT-AI2-001", "aiAssessmentProcessingStatus", "AI 评定处理状态", [
    ["QUEUED", "待处理"],
    ["PROCESSING", "处理中"],
    ["DETERMINED", "已形成明确下一步"],
    ["MORE_INPUT_REQUIRED", "需要补充"],
    ["UNABLE_TO_DETERMINE", "无法判断"],
    ["EXCEPTION_PENDING", "待专业例外复核"],
    ["FAILED", "处理失败"],
  ]),
  optionSet("OPT-AI2-002", "aiResultPublicationStatus", "AI 结果发布状态", [
    ["UNPUBLISHED", "未发布"],
    ["PENDING_GATES", "待闸门检查"],
    ["PUBLISHED", "已发布"],
    ["WITHHELD", "保持未发布"],
  ]),
  optionSet("OPT-AI2-003", "aiResultDisputeCorrectionStatus", "AI 结果质疑与纠正状态", [
    ["UNCHALLENGED", "未质疑"],
    ["CHALLENGED", "已质疑"],
    ["UNDER_REVIEW", "复核中"],
    ["CORRECTED", "已纠正"],
    ["REPLACED", "已被替代"],
  ]),
  optionSet("OPT-AI2-004", "aiResultValidityStatus", "AI 结果有效性", [
    ["CURRENT", "当前有效"],
    ["PROVISIONAL", "暂定"],
    ["INVALID", "已失效"],
    ["SUPERSEDED", "已被新版本替代"],
    ["ACCESS_RESTRICTED", "访问受限"],
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
]);

export const phaseTwoAssessmentEvents = deepFreeze([
  {
    id: ASSESSMENT_STANDARD_EVENT_ID,
    label: "活动发布快照需要冻结评定标准",
    definition: "活动即时或定时发布形成固定快照后，在学生产生答案前生成一个不可覆盖的评定标准版本；缺失或失败时阻断学生作答而不伪造标准。",
    producerActionIds: ["HW-ACT-PUBLISH-NOW", "HW-ACT-PUBLISH-SCHEDULED"],
    triggeredActionIds: ["GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD"],
  },
  {
    id: ASSESSMENT_NOTIFICATION_EVENT_ID,
    label: "AI 评定批量纠正通知请求已形成",
    definition: "受影响结果完成版本化纠正并重新通过发布闸门后，产生包含结果身份和版本的通知请求边界，供通知域按答案开放策略创建和投递。",
    producerActionIds: ["PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION"],
  },
]);

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
    if (!["HW-001", "SUB-001"].includes(module.id)) return module;
    const replacement = structuredClone(module);
    if (replacement.id === "HW-001") {
      for (const action of replacement.actions.filter(({ id }) => (
        ["HW-ACT-PUBLISH-NOW", "HW-ACT-PUBLISH-SCHEDULED"].includes(id)
      ))) {
        action.producedEventIds = [
          ...new Set([...(action.producedEventIds ?? []), ASSESSMENT_STANDARD_EVENT_ID]),
        ];
      }
    }
    if (replacement.id === "SUB-001") {
      for (const action of replacement.actions.filter(({ id }) => (
        STUDENT_ANSWER_ACTION_IDS.includes(id)
      ))) {
        action.assessmentStandardGate = {
          standardObjectId: ASSESSMENT_STANDARD_OBJECT_ID,
          requiredState: "FROZEN",
          matchMode: "EXACT_ACTIVITY_SNAPSHOT_ID_AND_VERSION",
          missingBehavior: "BLOCK_STUDENT_ANSWER",
        };
      }
    }
    return deepFreeze(replacement);
  });
}

export function deferPhaseThreeFlowActions(modules) {
  const deferredActionIds = new Set([
    "INS-ACT-CREATE-CANDIDATE",
    "INS-ACT-MARK-STALE",
    "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM",
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
