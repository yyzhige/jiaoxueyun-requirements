import {
  CLIENT,
  PHASE,
  RELEASE_STATUS,
  RISK,
  deepFreeze,
  defineModule,
} from "../model.mjs";
import {
  longTermEvidenceModule,
  longTermPlanModule,
} from "./teaching-loop.mjs";
import { longTermLearningPathModule } from "./ai-reporting.mjs";

const WEB_APP = [CLIENT.WEB, CLIENT.APP];
const USER_TASK = "USER_TASK";
const SYSTEM_EVENT = "SYSTEM_EVENT";

function optionSet(id, key, label, entries) {
  return {
    id,
    key,
    label,
    mode: "STATIC",
    values: entries.map(([code, valueLabel]) => ({ code, label: valueLabel })),
  };
}

function field(id, label, overrides = {}) {
  return {
    id,
    label,
    dataType: "STRING",
    required: true,
    valueSource: { kind: "USER_INPUT" },
    mutability: "EDITABLE",
    visibility: "AUTHORIZED_SCOPE",
    validation: "must match the declared data type and authorized object scope",
    historyPolicy: "retain every accepted value with its source, reason, effective time, and version",
    ...overrides,
  };
}

function identityField(id, label) {
  return field(id, label, {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_ID",
  });
}

function versionField(id, label) {
  return field(id, label, {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
  });
}

function identityReferenceField(id, label, targetObjectId, overrides = {}) {
  return field(id, label, {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
    ...overrides,
  });
}

function versionedReferenceField(
  id,
  label,
  targetObjectId,
  versionFieldId,
  targetVersionFieldId,
  overrides = {},
) {
  return field(id, label, {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: { versionFieldId, targetVersionFieldId },
    ...overrides,
  });
}

function object({
  id,
  label,
  dataSubject,
  responsibility,
  states,
  fields,
  lifecyclePolicyId = "LIFE-007",
  sensitivityId = "S3",
  studentDataKind = "DETAIL",
  lineageBindings = [],
}) {
  return {
    id,
    label,
    dataSubject,
    ...responsibility,
    lifecyclePolicyId,
    sensitivityId,
    readMode: "AUTHORIZED",
    stateReachability: { mode: "ACTION_GRAPH", initialStateIds: [] },
    states,
    fields,
    studentDataClassification: {
      kind: studentDataKind,
      privilegedReadPolicy: studentDataKind === "NONE" ? "NOT_APPLICABLE" : "DEFAULT_DENY",
    },
    ...(lineageBindings.length > 0 ? { lineageBindings } : {}),
  };
}

function actorReference(actorRef) {
  if (actorRef.startsWith("DUTY-")) return { dutyRef: actorRef };
  if (actorRef.startsWith("ROLE-")) return { roleRef: actorRef };
  return { actorRef };
}

function permission(effect, actorRef, condition) {
  return { effect, ...actorReference(actorRef), condition };
}

function action({
  id,
  label,
  targetObjectId,
  inputFieldIds = [],
  outputFieldIds = [],
  operationKind,
  transition,
  successState,
  permissions,
  failureResults,
  risk,
  executionMode = USER_TASK,
  trigger,
  pageId,
  acceptedInputValues,
}) {
  const writes = operationKind !== "READ";
  const effectiveRisk = risk ?? (writes ? RISK.LOW : RISK.READ);
  const closedFailureResults = effectiveRisk === RISK.HIGH
    ? [...new Set([...(failureResults ?? []), "AUDIT_FAILED"])]
    : (failureResults ?? (writes
      ? ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT"]
      : ["PERMISSION_DENIED", "NOT_FOUND"]));
  const expectedState = transition?.to ?? successState;
  const actionValue = {
    id,
    label,
    targetObjectId,
    inputFieldIds,
    outputFieldIds,
    operationKind,
    writes,
    risk: effectiveRisk,
    executionMode,
    ...(executionMode === USER_TASK ? { clients: WEB_APP } : { trigger }),
    permissions,
    ...(transition ? { transition } : {}),
    ...(acceptedInputValues ? { acceptedInputValues } : {}),
    scenarioIds: [
      `${id}-SCN-SUCCESS`,
      ...closedFailureResults.map((code) => `${id}-SCN-${code}`),
    ],
    ...(writes ? { idempotencyKey: `${id}:school:student:node:source-version:request-id` } : {}),
    auditMode: writes ? "REQUIRED" : "NOT_REQUIRED",
    failureResults: closedFailureResults,
  };
  const successScenario = {
    id: `${id}-SCN-SUCCESS`,
    kind: "SUCCESS",
    actionId: id,
    ...(executionMode === USER_TASK ? { pageId } : { trigger }),
    given: `the actor meets the entry conditions for ${label}`,
    when: `the actor requests ${label}`,
    then: {
      expectedData: `${label} records the accepted source, reason, effective time, and version without rewriting prior history`,
      expectedState: expectedState
        ? { mode: "STATE", value: expectedState }
        : { mode: "UNCHANGED" },
      expectedPermission: "ALLOW",
      expectedVisibility: "authorized object scope only",
    },
  };
  const failureScenarios = closedFailureResults.map((resultCode) => ({
    id: `${id}-SCN-${resultCode}`,
    kind: "FAILURE",
    resultCode,
    actionId: id,
    ...(executionMode === USER_TASK ? { pageId } : { trigger }),
    given: `${resultCode} applies to ${label}`,
    when: `the actor requests ${label}`,
    then: {
      expectedData: `${label} returns ${resultCode} without changing cognition, progress, or source facts`,
      expectedState: { mode: "UNCHANGED" },
      expectedPermission: "DENY",
      expectedVisibility: "no data outside the authorized scope",
    },
  }));
  return { action: actionValue, scenarios: [successScenario, ...failureScenarios] };
}

function page(id, label, objectIds, fieldIds, actionIds) {
  return {
    id,
    label,
    clients: WEB_APP,
    availability: RELEASE_STATUS.PLANNED,
    objectIds,
    fieldIds,
    actionIds,
    regions: ["CONTEXT_HEADER", "TASK_WORK_AREA", "RESULT_AND_FAILURE_STATUS"],
    viewStates: ["LOADING", "READY", "EMPTY", "ERROR", "FORBIDDEN", "STALE_VERSION"],
  };
}

const masteryNodeFields = [
  identityField("INS-MASTERY-F-ID", "Mastery Node State ID"),
  identityReferenceField("INS-MASTERY-F-STUDENT-REF", "Student Reference", "ORG-OBJ-STUDENT"),
  field("INS-MASTERY-F-SUBJECT", "Subject", {
    dataType: "ID",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-007" },
    mutability: "IMMUTABLE",
  }),
  versionedReferenceField(
    "INS-MASTERY-F-CAPABILITY-NODE-REF",
    "Stable Capability Node Reference",
    "CURR-OBJ-KNOWLEDGE-POINT",
    "INS-MASTERY-F-CAPABILITY-NODE-VERSION",
    "CURR-KP-F-ID",
  ),
  field("INS-MASTERY-F-CAPABILITY-NODE-VERSION", "Stable Capability Node Version", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("INS-MASTERY-F-STATUS", "Node-level Mastery Status", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-PH3-001" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("INS-MASTERY-F-LEARNING-PACE", "Student-controlled Learning Pace", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-PH3-002" },
  }),
  field("INS-MASTERY-F-EVIDENCE-REFS", "Current Evidence References", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("INS-MASTERY-F-SOURCE-REASON", "Status Change Source and Reason", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("INS-MASTERY-F-EFFECTIVE-AT", "Status Effective Time", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  versionField("INS-MASTERY-F-VERSION", "Mastery Node State Version"),
];

const masteryChallengeFields = [
  identityField("INS-CHALLENGE-F-ID", "Mastery Challenge ID"),
  versionedReferenceField(
    "INS-CHALLENGE-F-MASTERY-REF",
    "Challenged Mastery Node Reference",
    "INS-OBJ-MASTERY-NODE",
    "INS-CHALLENGE-F-MASTERY-VERSION",
    "INS-MASTERY-F-VERSION",
  ),
  field("INS-CHALLENGE-F-MASTERY-VERSION", "Challenged Mastery Node Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  identityReferenceField("INS-CHALLENGE-F-STUDENT-REF", "Challenging Student Reference", "ORG-OBJ-STUDENT"),
  field("INS-CHALLENGE-F-REASON", "Challenge Reason", { dataType: "TEXT" }),
  field("INS-CHALLENGE-F-RESPONSE", "Subject Teacher Response", {
    dataType: "TEXT",
    required: false,
  }),
  field("INS-CHALLENGE-F-CREATED-AT", "Challenge Created At", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("INS-CHALLENGE-F-RESOLVED-AT", "Challenge Resolved At", {
    dataType: "DATETIME",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  versionField("INS-CHALLENGE-F-VERSION", "Mastery Challenge Version"),
];

const classProgressFields = [
  identityField("PLN-CLASS-PROGRESS-F-ID", "Class Progress ID"),
  identityReferenceField("PLN-CLASS-PROGRESS-F-CLASS-REF", "Class Reference", "ORG-OBJ-CLASS"),
  field("PLN-CLASS-PROGRESS-F-SUBJECT", "Subject", {
    dataType: "ID",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-007" },
    mutability: "IMMUTABLE",
  }),
  versionedReferenceField(
    "PLN-CLASS-PROGRESS-F-CURRICULUM-REF",
    "Curriculum Reference",
    "CURR-OBJ-CURRICULUM",
    "PLN-CLASS-PROGRESS-F-CURRICULUM-VERSION",
    "CURR-CURRICULUM-F-VERSION",
  ),
  field("PLN-CLASS-PROGRESS-F-CURRICULUM-VERSION", "Curriculum Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("PLN-CLASS-PROGRESS-F-UNIT", "Current Unit", { dataType: "ID" }),
  versionedReferenceField(
    "PLN-CLASS-PROGRESS-F-TARGET-REF",
    "Current Curriculum Target Reference",
    "CURR-OBJ-KNOWLEDGE-POINT",
    "PLN-CLASS-PROGRESS-F-TARGET-VERSION",
    "CURR-KP-F-ID",
    { mutability: "EDITABLE" },
  ),
  field("PLN-CLASS-PROGRESS-F-TARGET-VERSION", "Current Curriculum Target Version", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  identityReferenceField("PLN-CLASS-PROGRESS-F-TEACHER-REF", "Responsible Subject Teacher", "ORG-OBJ-TEACHER"),
  field("PLN-CLASS-PROGRESS-F-STATUS", "Class Progress Status", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-PH3-003" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PLN-CLASS-PROGRESS-F-CHANGE-REASON", "Progress Change Reason", { dataType: "TEXT" }),
  field("PLN-CLASS-PROGRESS-F-EFFECTIVE-AT", "Progress Effective Time", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  versionField("PLN-CLASS-PROGRESS-F-VERSION", "Class Progress Version"),
];

const masteryResponsibility = {
  controlSubject: "SCHOOL",
  producerRef: "ROLE-STUDENT",
  ownerRef: "DUTY-SUBJECT-TEACHER",
  confirmerRef: "SYSTEM",
  stewardRef: "DUTY-SUBJECT-TEACHER",
};
const classProgressResponsibility = {
  controlSubject: "SCHOOL",
  producerRef: "DUTY-SUBJECT-TEACHER",
  ownerRef: "DUTY-SUBJECT-TEACHER",
  confirmerRef: "DUTY-SUBJECT-TEACHER",
  stewardRef: "DUTY-HOMEROOM",
};

const masteryObjects = [
  object({
    id: "INS-OBJ-MASTERY-NODE",
    label: "Reversible Evidence-based Mastery Node State",
    dataSubject: "STUDENT_EVIDENCE_AND_MASTERY",
    responsibility: masteryResponsibility,
    states: ["NOT_STARTED", "LEARNING", "PENDING_VALIDATION", "MASTERED", "REVIEW_REQUIRED"],
    fields: masteryNodeFields,
    lineageBindings: [{
      refFieldId: "INS-MASTERY-F-CAPABILITY-NODE-REF",
      versionFieldId: "INS-MASTERY-F-CAPABILITY-NODE-VERSION",
      targetObjectId: "CURR-OBJ-KNOWLEDGE-POINT",
      targetVersionFieldId: "CURR-KP-F-ID",
    }],
  }),
  object({
    id: "INS-OBJ-MASTERY-CHALLENGE",
    label: "Student Mastery Judgment Challenge",
    dataSubject: "STUDENT_EVIDENCE_AND_MASTERY",
    responsibility: { ...masteryResponsibility, producerRef: "ROLE-STUDENT", confirmerRef: "DUTY-SUBJECT-TEACHER" },
    states: ["OPEN", "RESOLVED"],
    fields: masteryChallengeFields,
    lineageBindings: [{
      refFieldId: "INS-CHALLENGE-F-MASTERY-REF",
      versionFieldId: "INS-CHALLENGE-F-MASTERY-VERSION",
      targetObjectId: "INS-OBJ-MASTERY-NODE",
      targetVersionFieldId: "INS-MASTERY-F-VERSION",
    }],
  }),
];

const classProgressObject = object({
  id: "PLN-OBJ-CLASS-PROGRESS",
  label: "Subject Teacher-owned Class Curriculum Progress",
  dataSubject: "SUBJECT_CURRICULUM",
  responsibility: classProgressResponsibility,
  states: ["DRAFT", "ACTIVE", "COMPLETED"],
  fields: classProgressFields,
  lifecyclePolicyId: "LIFE-003",
  sensitivityId: "S2",
  studentDataKind: "NONE",
  lineageBindings: [
    {
      refFieldId: "PLN-CLASS-PROGRESS-F-CURRICULUM-REF",
      versionFieldId: "PLN-CLASS-PROGRESS-F-CURRICULUM-VERSION",
      targetObjectId: "CURR-OBJ-CURRICULUM",
      targetVersionFieldId: "CURR-CURRICULUM-F-VERSION",
    },
    {
      refFieldId: "PLN-CLASS-PROGRESS-F-TARGET-REF",
      versionFieldId: "PLN-CLASS-PROGRESS-F-TARGET-VERSION",
      targetObjectId: "CURR-OBJ-KNOWLEDGE-POINT",
      targetVersionFieldId: "CURR-KP-F-ID",
    },
  ],
});

const studentDetailReadDenials = [
  permission("DENY", "DUTY-HOMEROOM", "homeroom coordination receives only cross-subject summaries and never subject-detail mastery evidence"),
  permission("DENY", "ROLE-SCHOOL-ADMIN", "school administration has no default access to individual mastery detail"),
  permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default access to individual mastery detail"),
];
const masteryActionFacts = [
  action({
    id: "INS-ACT-INITIALIZE-PERSONAL-NODE",
    label: "Initialize My Personal Capability Node",
    targetObjectId: "INS-OBJ-MASTERY-NODE",
    inputFieldIds: ["INS-MASTERY-F-SUBJECT", "INS-MASTERY-F-CAPABILITY-NODE-REF", "INS-MASTERY-F-CAPABILITY-NODE-VERSION"],
    outputFieldIds: ["INS-MASTERY-F-ID", "INS-MASTERY-F-STUDENT-REF", "INS-MASTERY-F-STATUS", "INS-MASTERY-F-LEARNING-PACE", "INS-MASTERY-F-EVIDENCE-REFS", "INS-MASTERY-F-SOURCE-REASON", "INS-MASTERY-F-EFFECTIVE-AT", "INS-MASTERY-F-VERSION"],
    operationKind: "CREATE",
    successState: "NOT_STARTED",
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student initializes only the student's own authorized capability node without choosing a mastery state"),
      permission("DENY", "AI", "AI cannot create an invented student learning path without a student or school learning context"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no student-learning write authority"),
    ],
    pageId: "INS-PAGE-PERSONAL-PROGRESS",
  }),
  action({
    id: "INS-ACT-START-PERSONAL-NODE",
    label: "Start or Continue My Personal Capability Node",
    targetObjectId: "INS-OBJ-MASTERY-NODE",
    outputFieldIds: ["INS-MASTERY-F-STATUS", "INS-MASTERY-F-SOURCE-REASON", "INS-MASTERY-F-EFFECTIVE-AT", "INS-MASTERY-F-VERSION"],
    operationKind: "UPDATE",
    transition: { from: ["NOT_STARTED", "REVIEW_REQUIRED"], to: "LEARNING" },
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student controls the pace of only the student's own node but cannot mark it mastered"),
      permission("DENY", "AI", "AI cannot force a student to start or continue a personal target"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no student-learning write authority"),
    ],
    pageId: "INS-PAGE-PERSONAL-PROGRESS",
  }),
  action({
    id: "INS-ACT-CONTROL-PERSONAL-PACE",
    label: "Pause Review or Resume My Personal Learning",
    targetObjectId: "INS-OBJ-MASTERY-NODE",
    inputFieldIds: ["INS-MASTERY-F-LEARNING-PACE"],
    outputFieldIds: ["INS-MASTERY-F-LEARNING-PACE", "INS-MASTERY-F-SOURCE-REASON", "INS-MASTERY-F-EFFECTIVE-AT", "INS-MASTERY-F-VERSION"],
    operationKind: "UPDATE",
    transition: { from: "LEARNING", to: "LEARNING" },
    acceptedInputValues: [{
      fieldId: "INS-MASTERY-F-LEARNING-PACE",
      optionSetId: "OPT-PH3-002",
      partitionId: "INS-PERSONAL-LEARNING-PACE",
      codes: ["ACTIVE", "PAUSED", "REVIEWING"],
    }],
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student pauses, reviews, or resumes only the student's own learning pace without editing mastery"),
      permission("DENY", "AI", "AI may recommend but cannot take over the student's personal pace control"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no student-learning write authority"),
    ],
    pageId: "INS-PAGE-PERSONAL-PROGRESS",
  }),
  action({
    id: "INS-ACT-REQUEST-MASTERY-VALIDATION",
    label: "Request Independent Validation for My Capability Node",
    targetObjectId: "INS-OBJ-MASTERY-NODE",
    outputFieldIds: ["INS-MASTERY-F-STATUS", "INS-MASTERY-F-SOURCE-REASON", "INS-MASTERY-F-EFFECTIVE-AT", "INS-MASTERY-F-VERSION"],
    operationKind: "UPDATE",
    transition: { from: "LEARNING", to: "PENDING_VALIDATION" },
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student requests validation for only the student's own node but cannot choose the result"),
      permission("DENY", "AI", "AI cannot fabricate a student validation request"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no student-learning write authority"),
    ],
    pageId: "INS-PAGE-PERSONAL-PROGRESS",
  }),
  action({
    id: "INS-ACT-CONFIRM-MASTERY-NODE",
    label: "Confirm Mastery from Sufficient Node-specific Evidence",
    targetObjectId: "INS-OBJ-MASTERY-NODE",
    outputFieldIds: ["INS-MASTERY-F-STATUS", "INS-MASTERY-F-EVIDENCE-REFS", "INS-MASTERY-F-SOURCE-REASON", "INS-MASTERY-F-EFFECTIVE-AT", "INS-MASTERY-F-VERSION"],
    operationKind: "UPDATE",
    transition: { from: "PENDING_VALIDATION", to: "MASTERED" },
    executionMode: SYSTEM_EVENT,
    trigger: { kind: "EVENT", eventId: "EVT-PH3-MASTERY-EVIDENCE-SUFFICIENT" },
    risk: RISK.HIGH,
    failureResults: ["PERMISSION_DENIED", "INSUFFICIENT_INDEPENDENT_EVIDENCE", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    permissions: [
      permission("ALLOW", "SYSTEM", "the versioned node rule has sufficient independent, variation, process, stability, and retention evidence"),
      permission("DENY", "AI", "a model suggestion alone cannot write MASTERED without the governed evidence rule"),
      permission("DENY", "CURRENT_ACTOR", "no user can invoke the mastery writer directly"),
    ],
  }),
  action({
    id: "INS-ACT-MARK-MASTERY-REVIEW-REQUIRED",
    label: "Return a Mastered Node to Review Required",
    targetObjectId: "INS-OBJ-MASTERY-NODE",
    outputFieldIds: ["INS-MASTERY-F-STATUS", "INS-MASTERY-F-EVIDENCE-REFS", "INS-MASTERY-F-SOURCE-REASON", "INS-MASTERY-F-EFFECTIVE-AT", "INS-MASTERY-F-VERSION"],
    operationKind: "UPDATE",
    transition: { from: "MASTERED", to: "REVIEW_REQUIRED" },
    executionMode: SYSTEM_EVENT,
    trigger: { kind: "EVENT", eventId: "EVT-PH3-LATER-EVIDENCE-REQUIRES-REVIEW" },
    risk: RISK.HIGH,
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    permissions: [
      permission("ALLOW", "SYSTEM", "later versioned evidence contradicts or weakens the prior mastery interpretation"),
      permission("DENY", "AI", "a model label cannot erase or silently rewrite the prior mastered version"),
      permission("DENY", "CURRENT_ACTOR", "no user can invoke the review-required writer directly"),
    ],
  }),
  action({
    id: "INS-ACT-VIEW-PERSONAL-PROGRESS",
    label: "View Authorized Node-level Personal Progress",
    targetObjectId: "INS-OBJ-MASTERY-NODE",
    inputFieldIds: ["INS-MASTERY-F-STUDENT-REF"],
    outputFieldIds: masteryNodeFields.map(({ id }) => id),
    operationKind: "READ",
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student reads only the student's own node states, evidence reasons, history, and next step"),
      permission("ALLOW", "DUTY-SUBJECT-TEACHER", "the corresponding subject teacher reads detailed nodes only for assigned students and subject"),
      ...studentDetailReadDenials,
    ],
    pageId: "INS-PAGE-PERSONAL-PROGRESS",
  }),
  action({
    id: "INS-ACT-OPEN-MASTERY-CHALLENGE",
    label: "Challenge a Mastery Judgment without Rewriting It",
    targetObjectId: "INS-OBJ-MASTERY-CHALLENGE",
    inputFieldIds: ["INS-CHALLENGE-F-MASTERY-REF", "INS-CHALLENGE-F-MASTERY-VERSION", "INS-CHALLENGE-F-REASON"],
    outputFieldIds: ["INS-CHALLENGE-F-ID", "INS-CHALLENGE-F-STUDENT-REF", "INS-CHALLENGE-F-CREATED-AT", "INS-CHALLENGE-F-VERSION"],
    operationKind: "CREATE",
    successState: "OPEN",
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student challenges only the student's own visible mastery version and cannot edit that version"),
      permission("DENY", "AI", "AI cannot file a challenge while impersonating the student"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no student-learning write authority"),
    ],
    pageId: "INS-PAGE-MASTERY-CHALLENGES",
  }),
  action({
    id: "INS-ACT-RESOLVE-MASTERY-CHALLENGE",
    label: "Resolve a Mastery Challenge with Professional Evidence",
    targetObjectId: "INS-OBJ-MASTERY-CHALLENGE",
    inputFieldIds: ["INS-CHALLENGE-F-RESPONSE"],
    outputFieldIds: ["INS-CHALLENGE-F-RESPONSE", "INS-CHALLENGE-F-RESOLVED-AT", "INS-CHALLENGE-F-VERSION"],
    operationKind: "UPDATE",
    transition: { from: "OPEN", to: "RESOLVED" },
    risk: RISK.HIGH,
    permissions: [
      permission("ALLOW", "DUTY-SUBJECT-TEACHER", "the corresponding subject teacher resolves within assigned student and subject scope using versioned evidence"),
      permission("DENY", "DUTY-HOMEROOM", "homeroom coordination cannot make another subject's mastery judgment"),
      permission("DENY", "ROLE-SCHOOL-ADMIN", "school administration cannot modify a student's mastery judgment"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations cannot modify a student's mastery judgment"),
    ],
    pageId: "INS-PAGE-MASTERY-CHALLENGES",
  }),
];

const classProgressPermissions = [
  permission("ALLOW", "DUTY-SUBJECT-TEACHER", "the corresponding subject teacher acts only inside the assigned subject, course, and class scope"),
  permission("DENY", "DUTY-HOMEROOM", "the homeroom teacher coordinates across subjects but cannot overwrite a subject teacher's class progress"),
  permission("DENY", "ROLE-STUDENT", "a student cannot alter formal class curriculum progress"),
  permission("DENY", "ROLE-SCHOOL-ADMIN", "school administration cannot replace the subject teacher's professional progress judgment"),
  permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no teaching-progress write authority"),
];
const classProgressActionFacts = [
  action({
    id: "PLN-ACT-CREATE-CLASS-PROGRESS",
    label: "Create Subject Class Progress",
    targetObjectId: "PLN-OBJ-CLASS-PROGRESS",
    inputFieldIds: ["PLN-CLASS-PROGRESS-F-CLASS-REF", "PLN-CLASS-PROGRESS-F-SUBJECT", "PLN-CLASS-PROGRESS-F-CURRICULUM-REF", "PLN-CLASS-PROGRESS-F-CURRICULUM-VERSION", "PLN-CLASS-PROGRESS-F-UNIT", "PLN-CLASS-PROGRESS-F-TARGET-REF", "PLN-CLASS-PROGRESS-F-TARGET-VERSION", "PLN-CLASS-PROGRESS-F-CHANGE-REASON"],
    outputFieldIds: ["PLN-CLASS-PROGRESS-F-ID", "PLN-CLASS-PROGRESS-F-TEACHER-REF", "PLN-CLASS-PROGRESS-F-STATUS", "PLN-CLASS-PROGRESS-F-EFFECTIVE-AT", "PLN-CLASS-PROGRESS-F-VERSION"],
    operationKind: "CREATE",
    successState: "DRAFT",
    permissions: classProgressPermissions,
    pageId: "PLN-PAGE-CLASS-PROGRESS",
  }),
  action({
    id: "PLN-ACT-ACTIVATE-CLASS-PROGRESS",
    label: "Activate Subject Class Progress",
    targetObjectId: "PLN-OBJ-CLASS-PROGRESS",
    outputFieldIds: ["PLN-CLASS-PROGRESS-F-STATUS", "PLN-CLASS-PROGRESS-F-EFFECTIVE-AT", "PLN-CLASS-PROGRESS-F-VERSION"],
    operationKind: "UPDATE",
    transition: { from: "DRAFT", to: "ACTIVE" },
    permissions: classProgressPermissions,
    pageId: "PLN-PAGE-CLASS-PROGRESS",
  }),
  action({
    id: "PLN-ACT-ADVANCE-CLASS-PROGRESS",
    label: "Advance Subject Class Curriculum Target",
    targetObjectId: "PLN-OBJ-CLASS-PROGRESS",
    inputFieldIds: ["PLN-CLASS-PROGRESS-F-UNIT", "PLN-CLASS-PROGRESS-F-TARGET-REF", "PLN-CLASS-PROGRESS-F-TARGET-VERSION", "PLN-CLASS-PROGRESS-F-CHANGE-REASON"],
    outputFieldIds: ["PLN-CLASS-PROGRESS-F-UNIT", "PLN-CLASS-PROGRESS-F-TARGET-REF", "PLN-CLASS-PROGRESS-F-TARGET-VERSION", "PLN-CLASS-PROGRESS-F-CHANGE-REASON", "PLN-CLASS-PROGRESS-F-EFFECTIVE-AT", "PLN-CLASS-PROGRESS-F-VERSION"],
    operationKind: "UPDATE",
    transition: { from: "ACTIVE", to: "ACTIVE" },
    risk: RISK.HIGH,
    permissions: classProgressPermissions,
    pageId: "PLN-PAGE-CLASS-PROGRESS",
  }),
  action({
    id: "PLN-ACT-COMPLETE-CLASS-PROGRESS",
    label: "Complete Subject Class Progress",
    targetObjectId: "PLN-OBJ-CLASS-PROGRESS",
    inputFieldIds: ["PLN-CLASS-PROGRESS-F-CHANGE-REASON"],
    outputFieldIds: ["PLN-CLASS-PROGRESS-F-STATUS", "PLN-CLASS-PROGRESS-F-CHANGE-REASON", "PLN-CLASS-PROGRESS-F-EFFECTIVE-AT", "PLN-CLASS-PROGRESS-F-VERSION"],
    operationKind: "UPDATE",
    transition: { from: "ACTIVE", to: "COMPLETED" },
    permissions: classProgressPermissions,
    pageId: "PLN-PAGE-CLASS-PROGRESS",
  }),
  action({
    id: "PLN-ACT-REOPEN-CLASS-PROGRESS",
    label: "Reopen Subject Class Progress",
    targetObjectId: "PLN-OBJ-CLASS-PROGRESS",
    inputFieldIds: ["PLN-CLASS-PROGRESS-F-CHANGE-REASON"],
    outputFieldIds: ["PLN-CLASS-PROGRESS-F-STATUS", "PLN-CLASS-PROGRESS-F-CHANGE-REASON", "PLN-CLASS-PROGRESS-F-EFFECTIVE-AT", "PLN-CLASS-PROGRESS-F-VERSION"],
    operationKind: "UPDATE",
    transition: { from: "COMPLETED", to: "ACTIVE" },
    permissions: classProgressPermissions,
    pageId: "PLN-PAGE-CLASS-PROGRESS",
  }),
  action({
    id: "PLN-ACT-VIEW-CLASS-PROGRESS",
    label: "View Class Progress without Personal Mastery Detail",
    targetObjectId: "PLN-OBJ-CLASS-PROGRESS",
    inputFieldIds: ["PLN-CLASS-PROGRESS-F-CLASS-REF"],
    outputFieldIds: classProgressFields.map(({ id }) => id),
    operationKind: "READ",
    permissions: [
      permission("ALLOW", "DUTY-SUBJECT-TEACHER", "the corresponding subject teacher reads assigned class and subject progress"),
      permission("ALLOW", "DUTY-HOMEROOM", "the homeroom teacher reads the cross-subject coordination view without personal mastery detail"),
      permission("ALLOW", "ROLE-STUDENT", "the student reads the student's current class target without other students' data"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default teaching-progress read authority"),
    ],
    pageId: "PLN-PAGE-CLASS-PROGRESS",
  }),
];

function extendModule(module, {
  objects = [],
  relationships = [],
  actionFacts = [],
  pages = [],
  metadata = {},
}) {
  return plannedPhaseThreeModule(module, {
    objects: [...module.objects.map((value) => structuredClone(value)), ...objects],
    relationships: [...module.relationships.map((value) => structuredClone(value)), ...relationships],
    actions: [...module.actions.map((value) => structuredClone(value)), ...actionFacts.map(({ action: value }) => value)],
    scenarios: [...module.scenarios.map((value) => structuredClone(value)), ...actionFacts.flatMap(({ scenarios }) => scenarios)],
    pages: [
      ...module.pages.map((value) => ({ ...structuredClone(value), availability: RELEASE_STATUS.PLANNED })),
      ...pages,
    ],
    ...metadata,
  });
}

function plannedPhaseThreeModule(module, overrides = {}) {
  return defineModule({
    ...structuredClone(module),
    phase: PHASE.THIRD,
    releaseStatus: RELEASE_STATUS.PLANNED,
    pages: module.pages.map((page) => ({
      ...structuredClone(page),
      availability: RELEASE_STATUS.PLANNED,
    })),
    ...overrides,
  });
}

const phaseThreeModuleFacts = [
  extendModule(longTermEvidenceModule, {
    objects: masteryObjects,
    relationships: [{
      id: "INS-REL-CHALLENGE-MASTERY-NODE",
      fromObjectId: "INS-OBJ-MASTERY-CHALLENGE",
      toObjectId: "INS-OBJ-MASTERY-NODE",
      type: "REVIEWS",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_STUDENT",
      onSourceInvalidation: "retain the challenge against the exact version and route the new version through independent review",
    }],
    actionFacts: masteryActionFacts,
    pages: [
      page(
        "INS-PAGE-PERSONAL-PROGRESS",
        "Node-level Personal Progress",
        ["INS-OBJ-MASTERY-NODE"],
        masteryNodeFields.map(({ id }) => id),
        masteryActionFacts.map(({ action: value }) => value)
          .filter(({ executionMode, targetObjectId }) => executionMode === USER_TASK && targetObjectId === "INS-OBJ-MASTERY-NODE")
          .map(({ id }) => id),
      ),
      page(
        "INS-PAGE-MASTERY-CHALLENGES",
        "Mastery Judgment Challenges",
        ["INS-OBJ-MASTERY-CHALLENGE"],
        masteryChallengeFields.map(({ id }) => id),
        ["INS-ACT-OPEN-MASTERY-CHALLENGE", "INS-ACT-RESOLVE-MASTERY-CHALLENGE"],
      ),
    ],
    metadata: {
      masteryEvidencePolicy: {
        evidenceOnlySources: ["ASSIGNMENT_COMPLETION", "CORRECTION_COMPLETION", "VIDEO_WATCHING"],
        sufficientEvidenceDimensions: ["INDEPENDENT_COMPLETION", "VARIATION", "KEY_PROCESS_EXPLANATION", "CROSS_TASK_STABILITY", "DELAYED_RETENTION"],
        directMasteryWriters: ["INS-ACT-CONFIRM-MASTERY-NODE"],
        reversalActionId: "INS-ACT-MARK-MASTERY-REVIEW-REQUIRED",
        rule: "completion, correction, and video watching create evidence only and never directly write MASTERED",
      },
    },
  }),
  extendModule(longTermPlanModule, {
    objects: [classProgressObject],
    actionFacts: classProgressActionFacts,
    pages: [page(
      "PLN-PAGE-CLASS-PROGRESS",
      "Subject Class Progress and Homeroom Coordination",
      ["PLN-OBJ-CLASS-PROGRESS"],
      classProgressFields.map(({ id }) => id),
      classProgressActionFacts.map(({ action: value }) => value.id),
    )],
    metadata: {
      dualProgressContract: {
        classProgressObjectId: "PLN-OBJ-CLASS-PROGRESS",
        personalProgressObjectId: "INS-OBJ-MASTERY-NODE",
        classProgressOwnerRef: "DUTY-SUBJECT-TEACHER",
        personalPaceOwnerRef: "ROLE-STUDENT",
        masteryJudgeRef: "GOVERNED_AI_EVIDENCE_RULE",
        homeroomScope: "CROSS_SUBJECT_COORDINATION_ONLY",
        aggregationRule: "node states remain separate and must never collapse into one overall percentage",
      },
    },
  }),
  plannedPhaseThreeModule(longTermLearningPathModule, {
    pages: longTermLearningPathModule.pages.map((value) => ({
      ...structuredClone(value),
      availability: RELEASE_STATUS.PLANNED,
    })),
    longTermVideoComposition: {
      phase: PHASE.THIRD,
      sourceModuleId: "VIDEO-001",
      reusableFragmentRule: "only reviewed concept or method fragments may be reused",
      individualizedComposition: ["LINKING", "EXAMPLE", "PACING", "VERIFICATION"],
      sourceVersionRule: "every fragment and individualized composition input remains version-pinned",
      phaseTwoDependencyRule: "the phase-two minimum video Flow never depends on this composition contract",
    },
  }),
];

const phaseThreeEventActionBindings = new Map([
  ["INS-ACT-CREATE-CANDIDATE", "EVT-PH3-UPSTREAM-CORRECTION-READY"],
  ["INS-ACT-MARK-STALE", "EVT-PH3-UPSTREAM-DERIVED-EVIDENCE-INVALIDATED"],
  ["PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM", "EVT-PH3-UPSTREAM-DERIVED-EVIDENCE-INVALIDATED"],
]);

export const phaseThreeModules = deepFreeze(phaseThreeModuleFacts.map((module) => {
  const replacement = structuredClone(module);
  for (const actionValue of replacement.actions) {
    const eventId = phaseThreeEventActionBindings.get(actionValue.id);
    if (!eventId) continue;
    actionValue.executionMode = SYSTEM_EVENT;
    delete actionValue.clients;
    delete actionValue.deferredFlowRegistration;
    actionValue.trigger = { kind: "EVENT", eventId };
  }
  for (const scenario of replacement.scenarios) {
    const eventId = phaseThreeEventActionBindings.get(scenario.actionId);
    if (!eventId) continue;
    scenario.trigger = { kind: "EVENT", eventId };
  }
  return replacement;
}));

export const phaseThreeOptionSets = deepFreeze([
  optionSet("OPT-PH3-001", "masteryNodeStatus", "能力节点状态", [
    ["NOT_STARTED", "未开始"],
    ["LEARNING", "学习中"],
    ["PENDING_VALIDATION", "待验证"],
    ["MASTERED", "已掌握"],
    ["REVIEW_REQUIRED", "需要复习"],
  ]),
  optionSet("OPT-PH3-002", "personalLearningPace", "个人学习节奏", [
    ["ACTIVE", "继续学习"],
    ["PAUSED", "暂停"],
    ["REVIEWING", "回顾"],
  ]),
  optionSet("OPT-PH3-003", "classProgressStatus", "班级教学进度状态", [
    ["DRAFT", "草稿"],
    ["ACTIVE", "推进中"],
    ["COMPLETED", "已完成"],
  ]),
]);
export const phaseThreeEvents = deepFreeze([
  {
    id: "EVT-PH3-UPSTREAM-CORRECTION-READY",
    label: "上游纠正事实可供长期认知使用",
    definition: "第二阶段纠正形成可追溯事实后，第三阶段创建新的证据候选，不覆盖原结果。",
    triggeredActionIds: ["INS-ACT-CREATE-CANDIDATE"],
  },
  {
    id: "EVT-PH3-UPSTREAM-DERIVED-EVIDENCE-INVALIDATED",
    label: "上游派生证据已失效",
    definition: "上游结果被纠正或失效时，第三阶段将关联证据标为陈旧并使计划进入待重新确认。",
    triggeredActionIds: [
      "INS-ACT-MARK-STALE",
      "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM",
    ],
  },
  {
    id: "EVT-PH3-MASTERY-EVIDENCE-SUFFICIENT",
    label: "能力节点独立证据达到规则",
    definition: "节点级版本化规则确认独立完成、变式、关键过程、跨任务稳定性和间隔保持证据已满足该学科节点要求。",
    triggeredActionIds: ["INS-ACT-CONFIRM-MASTERY-NODE"],
  },
  {
    id: "EVT-PH3-LATER-EVIDENCE-REQUIRES-REVIEW",
    label: "后续证据要求重新复习",
    definition: "新的版本化学习证据表明先前已掌握节点需要重新复习，同时保留原状态、依据和时间。",
    triggeredActionIds: ["INS-ACT-MARK-MASTERY-REVIEW-REQUIRED"],
  },
]);
export const phaseThreeFlows = deepFreeze([]);
