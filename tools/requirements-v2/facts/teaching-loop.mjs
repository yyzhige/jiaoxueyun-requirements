import { CLIENT, PHASE, RISK, deepFreeze, defineModule } from "../model.mjs";

const WEB_APP = [CLIENT.WEB, CLIENT.APP];
const USER_TASK = "USER_TASK";
const FLOW_INTERNAL = "FLOW_INTERNAL";
const AUDIT_REQUIRED = "REQUIRED";
const AUDIT_NOT_REQUIRED = "NOT_REQUIRED";

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
    historyPolicy: "retain accepted values with source and version metadata",
    ...overrides,
  };
}

function object(id, label, responsibility, states, fields, overrides = {}) {
  return {
    id,
    label,
    ...responsibility,
    lifecyclePolicyId: "LIFE-003",
    sensitivityId: "S2",
    states,
    fields,
    ...overrides,
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
  writes = true,
  risk = writes ? RISK.LOW : RISK.READ,
  clients = WEB_APP,
  executionMode = USER_TASK,
  trigger,
  permissions,
  transition,
  successState,
  successData,
  failureResults = writes
    ? ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT"]
    : ["PERMISSION_DENIED", "NOT_FOUND"],
  failureOutcomes = {},
  idempotencyKey = `${id}:school:object:source-version:request-id`,
}) {
  const effectiveFailureResults = risk === RISK.HIGH
    ? [...new Set([...failureResults, "AUDIT_FAILED"])]
    : failureResults;
  const stateOutcome = (state) => state
    ? { mode: "STATE", value: state }
    : { mode: "UNCHANGED" };
  const successScenario = {
    id: `${id}-SCN-SUCCESS`,
    kind: "SUCCESS",
    actionId: id,
    ...(executionMode === USER_TASK ? {} : { trigger }),
    given: `the actor meets the entry conditions for ${label}`,
    when: `the actor requests ${label}`,
    then: {
      expectedData: successData ?? `${label} returns the accepted versioned result`,
      expectedState: stateOutcome(successState ?? transition?.to),
      expectedPermission: "ALLOW",
      expectedVisibility: "authorized object scope only",
    },
  };
  const failureScenarios = effectiveFailureResults.map((resultCode) => {
    const outcome = failureOutcomes[resultCode] ?? {};
    return {
      id: `${id}-SCN-${resultCode}`,
      kind: outcome.kind ?? "FAILURE",
      resultCode,
      actionId: id,
      ...(executionMode === USER_TASK ? {} : { trigger }),
      given: `${resultCode} applies to ${label}`,
      when: `the actor requests ${label}`,
      then: {
        expectedData: outcome.expectedData
          ?? `${label} returns ${resultCode} without hidden writes`,
        expectedState: stateOutcome(outcome.expectedState),
        expectedPermission: outcome.expectedPermission ?? "DENY",
        expectedVisibility: outcome.expectedVisibility
          ?? "no data outside the authorized scope",
      },
    };
  });
  return {
    action: {
      id,
      label,
      targetObjectId,
      inputFieldIds,
      outputFieldIds,
      ...(transition ? { transition } : {}),
      writes,
      risk,
      executionMode,
      ...(executionMode === USER_TASK ? { clients } : { trigger }),
      permissions,
      scenarioIds: [successScenario.id, ...failureScenarios.map(({ id: scenarioId }) => scenarioId)],
      ...(writes ? { idempotencyKey } : {}),
      auditMode: writes ? AUDIT_REQUIRED : AUDIT_NOT_REQUIRED,
      failureResults: effectiveFailureResults,
    },
    scenarios: [successScenario, ...failureScenarios],
  };
}

function page(id, label, objectIds, fieldIds, actionIds, clients = WEB_APP) {
  return {
    id,
    label,
    clients,
    objectIds,
    fieldIds,
    actionIds,
    regions: ["CONTEXT_HEADER", "TASK_WORK_AREA", "RESULT_AND_FAILURE_STATUS"],
    viewStates: ["LOADING", "READY", "EMPTY", "ERROR", "FORBIDDEN", "STALE_VERSION"],
  };
}

function moduleFact({ actions: actionFacts, ...module }) {
  const pageByActionId = new Map();
  for (const pageValue of module.pages) {
    for (const actionId of pageValue.actionIds) {
      if (!pageByActionId.has(actionId)) pageByActionId.set(actionId, pageValue.id);
    }
  }
  const actionById = new Map(
    actionFacts.map(({ action: actionValue }) => [actionValue.id, actionValue]),
  );
  return defineModule({
    ...module,
    actions: actionFacts.map(({ action: actionValue }) => actionValue),
    scenarios: actionFacts.flatMap(({ scenarios }) => scenarios.map((scenario) => (
      actionById.get(scenario.actionId)?.executionMode === USER_TASK
        ? { ...scenario, pageId: pageByActionId.get(scenario.actionId) }
        : scenario
    ))),
  });
}

const subjectTeacherResponsibility = {
  dataSubject: "SUBJECT_ASSIGNMENT",
  controlSubject: "SCHOOL",
  producerRef: "DUTY-SUBJECT-TEACHER",
  ownerRef: "DUTY-SUBJECT-TEACHER",
  confirmerRef: "DUTY-SUBJECT-TEACHER",
  stewardRef: "DUTY-SUBJECT-TEACHER",
};

const subjectTeacherPermissions = [
  permission(
    "ALLOW",
    "DUTY-SUBJECT-TEACHER",
    "the corresponding subject teacher acts inside assigned course and class scope",
  ),
  permission(
    "DENY",
    "DUTY-HOMEROOM",
    "a homeroom teacher attempts to change another subject's professional assignment facts",
  ),
  permission(
    "DENY",
    "ROLE-STUDENT",
    "a student attempts to create, revise, publish, or close an assignment",
  ),
];

const hwAssignmentFields = [
  field("HW-ASSIGNMENT-F-TITLE", "Assignment Title"),
  field("HW-ASSIGNMENT-F-INSTRUCTIONS", "Assignment Instructions", { dataType: "TEXT" }),
  field("HW-ASSIGNMENT-F-SUBJECT-ID", "Subject", {
    dataType: "ID",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-007" },
  }),
  field("HW-ASSIGNMENT-F-COURSE-ID", "Course", {
    dataType: "ID",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-008" },
  }),
  field("HW-ASSIGNMENT-F-CLASS-SCOPE-IDS", "Class Scope", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-006" },
  }),
  field("HW-ASSIGNMENT-F-OPEN-AT", "Open Time", { dataType: "DATETIME" }),
  field("HW-ASSIGNMENT-F-DUE-AT", "Due Time", { dataType: "DATETIME" }),
  field("HW-ASSIGNMENT-F-LATE-POLICY", "Late Policy", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-032" },
  }),
  field("HW-ASSIGNMENT-F-RESUBMISSION-POLICY", "Resubmission Policy", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-033" },
  }),
  field("HW-ASSIGNMENT-F-ASSIGNMENT-TYPE", "Assignment Type", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-002" },
  }),
  field("HW-ASSIGNMENT-F-QUESTION-ORDER", "Question Order", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-001" },
  }),
  field("HW-ASSIGNMENT-F-RUBRIC-VERSION", "Assignment Rubric Version", {
    dataType: "ID",
    valueSource: { kind: "RUNTIME_QUERY", queryId: "QUERY-AUTHORIZED-RUBRIC-VERSIONS" },
  }),
  field("HW-ASSIGNMENT-F-KNOWLEDGE-POINT-IDS", "Assignment Knowledge Points", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-011" },
  }),
  field("HW-ASSIGNMENT-F-FEEDBACK-POLICY", "Feedback Policy", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-004" },
  }),
  field("HW-ASSIGNMENT-F-NOTIFICATION-POLICY", "Notification Policy", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-002" },
  }),
  field("HW-ASSIGNMENT-F-PUBLICATION-VERSION", "Publication Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("HW-ASSIGNMENT-F-REVISION-REASON", "Revision Reason", {
    dataType: "TEXT",
    required: "required when revising a published assignment",
  }),
];

const hwItemFields = [
  field("HW-ITEM-F-ITEM-VERSION", "Item Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("HW-ITEM-F-QUESTION-TYPE", "Question Type", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-003" },
  }),
  field("HW-ITEM-F-ORDER", "Item Order", { dataType: "INTEGER" }),
  field("HW-ITEM-F-PROMPT", "Question Prompt", { dataType: "TEXT" }),
  field("HW-ITEM-F-ANSWER-KEY", "Answer Key", { dataType: "JSON" }),
  field("HW-ITEM-F-POINTS", "Item Points", { dataType: "DECIMAL" }),
  field("HW-ITEM-F-RUBRIC-VERSION", "Item Rubric Version", {
    dataType: "ID",
    valueSource: { kind: "RUNTIME_QUERY", queryId: "QUERY-AUTHORIZED-RUBRIC-VERSIONS" },
  }),
  field("HW-ITEM-F-KNOWLEDGE-POINT-IDS", "Item Knowledge Points", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-011" },
  }),
];

const hwAssignmentInputIds = hwAssignmentFields
  .filter(({ mutability }) => mutability === "EDITABLE")
  .map(({ id }) => id);
const hwItemInputIds = hwItemFields
  .filter(({ mutability }) => mutability === "EDITABLE")
  .map(({ id }) => id);

const hwActions = [
  action({
    id: "HW-ACT-CREATE-DRAFT",
    label: "Create Assignment Draft",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    inputFieldIds: hwAssignmentInputIds.filter((id) => id !== "HW-ASSIGNMENT-F-REVISION-REASON"),
    outputFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION"],
    permissions: subjectTeacherPermissions,
    successState: "DRAFT",
  }),
  action({
    id: "HW-ACT-EDIT-ITEM",
    label: "Edit Assignment Item",
    targetObjectId: "HW-OBJ-ITEM",
    inputFieldIds: hwItemInputIds,
    outputFieldIds: ["HW-ITEM-F-ITEM-VERSION"],
    permissions: subjectTeacherPermissions,
    successState: "DRAFT",
  }),
  action({
    id: "HW-ACT-VALIDATE",
    label: "Validate Assignment Version",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    outputFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION"],
    permissions: subjectTeacherPermissions,
    transition: { from: "DRAFT", to: "VALIDATED" },
    failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "INCOMPLETE_ITEM", "VERSION_CONFLICT"],
  }),
  action({
    id: "HW-ACT-PREVIEW",
    label: "Preview Assignment as Student",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    outputFieldIds: hwAssignmentFields.map(({ id }) => id),
    writes: false,
    permissions: subjectTeacherPermissions,
    successData: "returns the exact student-visible assignment preview without publishing",
  }),
  action({
    id: "HW-ACT-PUBLISH-NOW",
    label: "Publish Assignment Immediately",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    outputFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION"],
    risk: RISK.HIGH,
    permissions: subjectTeacherPermissions,
    transition: { from: "VALIDATED", to: "PUBLISHED" },
  }),
  action({
    id: "HW-ACT-SCHEDULE-PUBLISH",
    label: "Schedule Assignment Publication",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    inputFieldIds: ["HW-ASSIGNMENT-F-OPEN-AT"],
    outputFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION"],
    risk: RISK.HIGH,
    permissions: subjectTeacherPermissions,
    transition: { from: "VALIDATED", to: "SCHEDULED" },
  }),
  action({
    id: "HW-ACT-CLOSE",
    label: "Close Assignment",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    outputFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION"],
    risk: RISK.HIGH,
    permissions: subjectTeacherPermissions,
    transition: { from: "PUBLISHED", to: "CLOSED" },
  }),
  action({
    id: "HW-ACT-REVISE",
    label: "Revise Published Assignment",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    inputFieldIds: ["HW-ASSIGNMENT-F-REVISION-REASON"],
    outputFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION"],
    risk: RISK.HIGH,
    permissions: subjectTeacherPermissions,
    transition: { from: "PUBLISHED", to: "REVISION_DRAFT" },
    successData: "creates a new revision draft linked to the immutable published version and reason",
  }),
  action({
    id: "HW-ACT-OPEN-PUBLISHED",
    label: "Open Published Assignment",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    outputFieldIds: [
      "HW-ASSIGNMENT-F-TITLE",
      "HW-ASSIGNMENT-F-INSTRUCTIONS",
      "HW-ASSIGNMENT-F-OPEN-AT",
      "HW-ASSIGNMENT-F-DUE-AT",
      "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
    ],
    writes: false,
    permissions: [
      permission(
        "ALLOW",
        "ROLE-STUDENT",
        "the student belongs to the published assignment class scope after the open time",
      ),
      permission(
        "DENY",
        "ROLE-PLATFORM-OPS",
        "platform operations has no default access to student assignment content",
      ),
    ],
    failureResults: ["PERMISSION_DENIED", "NOT_FOUND", "NOT_OPEN_YET"],
  }),
];

const hwModule = moduleFact({
  id: "HW-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Assignment Authoring and Publication",
  objective: "Create, validate, publish, close, and revise versioned all-subject assignments",
  entryConditions: ["the corresponding subject teacher has an active school, term, course, and class context"],
  exitConditions: ["a validated assignment is published or scheduled with an immutable publication version"],
  baselineDecisionIds: ["BASE-003", "BASE-004", "BASE-005", "BASE-007"],
  nfrIds: ["NFR-002", "NFR-008"],
  objects: [
    object(
      "HW-OBJ-ASSIGNMENT",
      "Assignment Version",
      subjectTeacherResponsibility,
      ["DRAFT", "VALIDATED", "SCHEDULED", "PUBLISHED", "CLOSED", "REVISION_DRAFT"],
      hwAssignmentFields,
    ),
    object(
      "HW-OBJ-ITEM",
      "Assignment Item Version",
      subjectTeacherResponsibility,
      ["DRAFT", "VALIDATED", "PUBLISHED", "REVISION_DRAFT"],
      hwItemFields,
    ),
  ],
  relationships: [{
    id: "HW-REL-ASSIGNMENT-ITEM",
    fromObjectId: "HW-OBJ-ASSIGNMENT",
    toObjectId: "HW-OBJ-ITEM",
    type: "CONTAINS",
    cardinality: "ONE_TO_MANY",
    ownershipScope: "SAME_SUBJECT",
    onSourceInvalidation: "retain immutable published item versions and invalidate only unconfirmed revision drafts",
  }],
  actions: hwActions,
  pages: [
    page(
      "HW-PAGE-AUTHORING",
      "Assignment Authoring Workspace",
      ["HW-OBJ-ASSIGNMENT", "HW-OBJ-ITEM"],
      [...hwAssignmentFields, ...hwItemFields].map(({ id }) => id),
      hwActions.slice(0, 8).map(({ action: actionValue }) => actionValue.id),
    ),
    page(
      "HW-PAGE-STUDENT",
      "Published Assignment Reader",
      ["HW-OBJ-ASSIGNMENT"],
      [
        "HW-ASSIGNMENT-F-TITLE",
        "HW-ASSIGNMENT-F-INSTRUCTIONS",
        "HW-ASSIGNMENT-F-OPEN-AT",
        "HW-ASSIGNMENT-F-DUE-AT",
        "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      ],
      ["HW-ACT-OPEN-PUBLISHED"],
    ),
  ],
});

const studentWorkResponsibility = {
  dataSubject: "STUDENT_WORK",
  controlSubject: "SCHOOL",
  producerRef: "ROLE-STUDENT",
  ownerRef: "ROLE-STUDENT",
  confirmerRef: "SYSTEM",
  stewardRef: "DUTY-SUBJECT-TEACHER",
};

const studentSubmissionPermissions = [
  permission(
    "ALLOW",
    "ROLE-STUDENT",
    "the student owns the draft and belongs to the assignment class scope",
  ),
  permission(
    "DENY",
    "ROLE-TEACHER",
    "a teacher attempts to create or submit student work on the student's behalf",
  ),
  permission(
    "DENY",
    "ROLE-PLATFORM-OPS",
    "platform operations has no default access to student answer content",
  ),
];

const submissionDraftFields = [
  field("SUB-DRAFT-F-ANSWER-PAYLOAD", "Answer Payload by Question Type", {
    dataType: "JSON",
    validation: "must use the payload schema registered for each assignment item question type",
  }),
  field("SUB-DRAFT-F-MEDIA-METADATA", "Media Metadata", { dataType: "JSON" }),
  field("SUB-DRAFT-F-PAGE-ITEM-MAPPING", "Page and Item Mapping", { dataType: "JSON" }),
  field("SUB-DRAFT-F-IMAGE-QUALITY", "Image Quality", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-027" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("SUB-DRAFT-F-UPLOAD-SESSION-ID", "Upload Session", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("SUB-DRAFT-F-PENDING-CHUNK", "Pending Upload Chunk", {
    dataType: "FILE_REFERENCE",
    historyPolicy: "retain only until the chunk is accepted or the upload session expires",
  }),
  field("SUB-DRAFT-F-SUCCESSFUL-CHUNKS", "Successful Upload Chunks", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("SUB-DRAFT-F-DRAFT-VERSION", "Draft Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT", "Weak Network Recovery Checkpoint", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    validation: "may contain only the latest draft and chunks already acknowledged by the server",
  }),
  field("SUB-DRAFT-F-ASSIGNMENT-VERSION", "Assignment Publication Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
];

const submissionAttemptFields = [
  field("SUB-ATTEMPT-F-DRAFT-VERSION", "Submitted Draft Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("SUB-ATTEMPT-F-SUBMISSION-VERSION", "Submission Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("SUB-ATTEMPT-F-LATE-FLAG", "Late Submission Flag", {
    dataType: "BOOLEAN",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("SUB-ATTEMPT-F-RESUBMISSION-OF", "Resubmission Relationship", {
    dataType: "ID",
    required: "required for a resubmission and absent for the first accepted submission",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("SUB-ATTEMPT-F-RECEIPT-ID", "Submission Receipt", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("SUB-ATTEMPT-F-RECEIPT-ISSUED-AT", "Receipt Issued Time", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
];

const submissionActions = [
  action({
    id: "SUB-ACT-SAVE-DRAFT",
    label: "Save Answer Draft",
    targetObjectId: "SUB-OBJ-DRAFT",
    inputFieldIds: [
      "SUB-DRAFT-F-ANSWER-PAYLOAD",
      "SUB-DRAFT-F-MEDIA-METADATA",
      "SUB-DRAFT-F-PAGE-ITEM-MAPPING",
    ],
    outputFieldIds: [
      "SUB-DRAFT-F-DRAFT-VERSION",
      "SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT",
    ],
    permissions: studentSubmissionPermissions,
    successState: "DRAFT",
    successData: "stores the versioned answer draft without claiming final submission",
  }),
  action({
    id: "SUB-ACT-UPLOAD-CHUNK",
    label: "Upload Media Chunk",
    targetObjectId: "SUB-OBJ-DRAFT",
    inputFieldIds: ["SUB-DRAFT-F-PENDING-CHUNK"],
    outputFieldIds: [
      "SUB-DRAFT-F-UPLOAD-SESSION-ID",
      "SUB-DRAFT-F-SUCCESSFUL-CHUNKS",
      "SUB-DRAFT-F-IMAGE-QUALITY",
      "SUB-DRAFT-F-DRAFT-VERSION",
    ],
    clients: [CLIENT.APP],
    permissions: studentSubmissionPermissions,
    transition: { from: "DRAFT", to: "UPLOADING" },
    failureResults: ["PERMISSION_DENIED", "CHUNK_REJECTED", "TRANSIENT_FAILURE", "VERSION_CONFLICT"],
  }),
  action({
    id: "SUB-ACT-RETRY-UPLOAD",
    label: "Retry Failed Media Upload",
    targetObjectId: "SUB-OBJ-DRAFT",
    inputFieldIds: ["SUB-DRAFT-F-PENDING-CHUNK"],
    outputFieldIds: [
      "SUB-DRAFT-F-SUCCESSFUL-CHUNKS",
      "SUB-DRAFT-F-IMAGE-QUALITY",
      "SUB-DRAFT-F-DRAFT-VERSION",
    ],
    clients: [CLIENT.APP],
    permissions: studentSubmissionPermissions,
    transition: { from: "UPLOADING", to: "UPLOADING" },
    failureResults: ["PERMISSION_DENIED", "CHUNK_REJECTED", "TRANSIENT_FAILURE", "VERSION_CONFLICT"],
  }),
  action({
    id: "SUB-ACT-SUBMIT",
    label: "Submit Assignment Answers",
    targetObjectId: "SUB-OBJ-ATTEMPT",
    inputFieldIds: ["SUB-ATTEMPT-F-DRAFT-VERSION"],
    outputFieldIds: [
      "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      "SUB-ATTEMPT-F-LATE-FLAG",
      "SUB-ATTEMPT-F-RECEIPT-ID",
      "SUB-ATTEMPT-F-RECEIPT-ISSUED-AT",
    ],
    risk: RISK.HIGH,
    permissions: studentSubmissionPermissions,
    successState: "SUBMITTED",
    successData: "accepts the immutable submission version only after issuing a server receipt",
    failureResults: [
      "PERMISSION_DENIED",
      "VALIDATION_FAILED",
      "OFFLINE_FINAL_SUBMISSION_BLOCKED",
      "SERVER_RECEIPT_NOT_ISSUED",
      "VERSION_CONFLICT",
    ],
    failureOutcomes: {
      OFFLINE_FINAL_SUBMISSION_BLOCKED: {
        kind: "BOUNDARY",
        expectedData: "retains the latest draft and successful chunks but never claims final submission without a server receipt",
      },
    },
    idempotencyKey: "SUB-ACT-SUBMIT:school:student:assignment-version:draft-version:request-id",
  }),
  action({
    id: "SUB-ACT-RESUBMIT",
    label: "Resubmit Assignment Answers",
    targetObjectId: "SUB-OBJ-ATTEMPT",
    inputFieldIds: [
      "SUB-ATTEMPT-F-DRAFT-VERSION",
      "SUB-ATTEMPT-F-RESUBMISSION-OF",
    ],
    outputFieldIds: [
      "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      "SUB-ATTEMPT-F-RECEIPT-ID",
      "SUB-ATTEMPT-F-RECEIPT-ISSUED-AT",
    ],
    risk: RISK.HIGH,
    permissions: studentSubmissionPermissions,
    transition: { from: "SUBMITTED", to: "RESUBMITTED" },
    successData: "creates a new immutable submission linked to the prior submission and issues a new server receipt",
    failureResults: [
      "PERMISSION_DENIED",
      "RESUBMISSION_POLICY_BLOCKED",
      "OFFLINE_FINAL_SUBMISSION_BLOCKED",
      "SERVER_RECEIPT_NOT_ISSUED",
      "VERSION_CONFLICT",
    ],
    failureOutcomes: {
      OFFLINE_FINAL_SUBMISSION_BLOCKED: {
        kind: "BOUNDARY",
        expectedData: "retains the latest draft and successful chunks but never creates a resubmission without a server receipt",
      },
    },
  }),
  action({
    id: "SUB-ACT-VIEW-RECEIPT",
    label: "View Submission Receipt",
    targetObjectId: "SUB-OBJ-ATTEMPT",
    outputFieldIds: [
      "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      "SUB-ATTEMPT-F-LATE-FLAG",
      "SUB-ATTEMPT-F-RESUBMISSION-OF",
      "SUB-ATTEMPT-F-RECEIPT-ID",
      "SUB-ATTEMPT-F-RECEIPT-ISSUED-AT",
    ],
    writes: false,
    permissions: studentSubmissionPermissions,
    successData: "returns the server-issued receipt for the student's accepted submission version",
  }),
];

const submissionModule = moduleFact({
  id: "SUB-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Student Answering and Submission",
  objective: "Preserve answer drafts and uploaded chunks while requiring a server receipt for final submission",
  entryConditions: ["the student can open a published assignment in the assigned class scope"],
  exitConditions: ["the submitted or resubmitted version has an immutable server receipt"],
  baselineDecisionIds: ["BASE-003", "BASE-004", "BASE-005"],
  nfrIds: ["NFR-001", "NFR-003", "NFR-004", "NFR-005", "NFR-008"],
  clientStrategy: {
    primaryClient: CLIENT.APP,
    webAvailable: true,
    webParityRequired: false,
  },
  objects: [
    object(
      "SUB-OBJ-DRAFT",
      "Student Answer Draft",
      studentWorkResponsibility,
      ["DRAFT", "UPLOADING", "READY_TO_SUBMIT"],
      submissionDraftFields,
      { sensitivityId: "S3" },
    ),
    object(
      "SUB-OBJ-ATTEMPT",
      "Submission Attempt Version",
      studentWorkResponsibility,
      ["DRAFT", "SUBMITTED", "RESUBMITTED"],
      submissionAttemptFields,
      { sensitivityId: "S3" },
    ),
  ],
  relationships: [{
    id: "SUB-REL-ATTEMPT-DRAFT",
    fromObjectId: "SUB-OBJ-ATTEMPT",
    toObjectId: "SUB-OBJ-DRAFT",
    type: "DERIVED_FROM",
    cardinality: "MANY_TO_ONE",
    ownershipScope: "SAME_STUDENT",
    onSourceInvalidation: "retain accepted submission versions and receipts; invalidate only unsubmitted draft derivations",
  }],
  actions: submissionActions,
  pages: [
    page(
      "SUB-PAGE-APP",
      "App Student Submission Workspace",
      ["SUB-OBJ-DRAFT", "SUB-OBJ-ATTEMPT"],
      [...submissionDraftFields, ...submissionAttemptFields].map(({ id }) => id),
      submissionActions.map(({ action: actionValue }) => actionValue.id),
      [CLIENT.APP],
    ),
    page(
      "SUB-PAGE-WEB",
      "Web Student Submission Workspace",
      ["SUB-OBJ-DRAFT", "SUB-OBJ-ATTEMPT"],
      [...submissionDraftFields, ...submissionAttemptFields].map(({ id }) => id),
      [
        "SUB-ACT-SAVE-DRAFT",
        "SUB-ACT-SUBMIT",
        "SUB-ACT-RESUBMIT",
        "SUB-ACT-VIEW-RECEIPT",
      ],
      [CLIENT.WEB],
    ),
  ],
});

const capabilityMatrixFields = [
  field("GRD-CAP-F-SUBJECT-FAMILY", "Subject Family", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-003" },
    mutability: "READ_ONLY",
  }),
  field("GRD-CAP-F-QUESTION-TYPE", "Question Type", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-003" },
    mutability: "READ_ONLY",
  }),
  field("GRD-CAP-F-SUBMISSION-METHOD", "Submission Method", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-031" },
    mutability: "READ_ONLY",
  }),
  field("GRD-CAP-F-RECOGNITION-LEVEL", "Recognition Level", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-004" },
    mutability: "READ_ONLY",
  }),
  field("GRD-CAP-F-SCORING-LEVEL", "Scoring Level", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-005" },
    mutability: "READ_ONLY",
  }),
  field("GRD-CAP-F-REQUIRED-EVIDENCE", "Required Evidence", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-006" },
    mutability: "READ_ONLY",
  }),
  field("GRD-CAP-F-TEACHER-REVIEW", "Teacher Review Required", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-001" },
    mutability: "READ_ONLY",
  }),
  field("GRD-CAP-F-BATCH-CONFIRM", "Batch Confirmation Eligibility", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-007" },
    mutability: "READ_ONLY",
  }),
  field("GRD-CAP-F-UNAVAILABLE-FALLBACK", "Unavailable Fallback", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-008" },
    mutability: "READ_ONLY",
  }),
];

const gradingDecisionFields = [
  field("GRD-DECISION-F-RECOGNIZED-ANSWER", "Recognized Answer", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
  }),
  field("GRD-DECISION-F-RECOGNIZED-REGION", "Recognized Region", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
  }),
  field("GRD-DECISION-F-SUBMISSION-VERSION", "Input Submission Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("GRD-DECISION-F-ITEM-VERSION", "Input Item Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("GRD-DECISION-F-RUBRIC-VERSION", "Input Rubric Version", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("GRD-DECISION-F-SUGGESTED-SCORE", "Suggested Score", {
    dataType: "DECIMAL",
    valueSource: { kind: "SYSTEM" },
  }),
  field("GRD-DECISION-F-SCORING-RATIONALE", "Scoring Rationale", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
  }),
  field("GRD-DECISION-F-CONFIDENCE", "Confidence Status", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-005" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("GRD-DECISION-F-LIMITATION", "Limitation Note", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
  }),
  field("GRD-DECISION-F-OFFICIAL-SCORE", "Teacher Official Score", {
    dataType: "DECIMAL",
  }),
  field("GRD-DECISION-F-TEACHER-FEEDBACK", "Teacher Feedback", {
    dataType: "TEXT",
  }),
  field("GRD-DECISION-F-CORRECTION-REASON", "Correction Reason", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-006" },
  }),
  field("GRD-DECISION-F-DECISION-VERSION", "Decision Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("GRD-DECISION-F-ROUTE", "Grading Route", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-008" },
    mutability: "SYSTEM_MANAGED",
  }),
];

const gradingCapabilityMatrix = [
  {
    id: "GRD-CAP-CHINESE-CHOICE-ONLINE",
    subjectFamily: "CHINESE",
    questionType: "SINGLE-CHOICE",
    submissionMethod: "ONLINE-FORM",
    recognitionLevel: "STRUCTURED",
    scoringLevel: "AUTO-SCORE",
    requiredEvidence: ["ANSWER-PAYLOAD", "ITEM-VERSION"],
    teacherReviewRequired: "NO",
    batchConfirmEligibility: "ELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
    isSubjective: false,
  },
  {
    id: "GRD-CAP-CHINESE-ESSAY-TEXT",
    subjectFamily: "CHINESE",
    questionType: "ESSAY",
    submissionMethod: "TEXT",
    recognitionLevel: "CONTENT",
    scoringLevel: "AI-SUGGESTION",
    requiredEvidence: ["ANSWER-PAYLOAD", "RUBRIC-VERSION", "TEACHER-JUDGMENT"],
    teacherReviewRequired: "YES",
    batchConfirmEligibility: "INELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
    isSubjective: true,
  },
  {
    id: "GRD-CAP-MATH-CHOICE-ONLINE",
    subjectFamily: "MATHEMATICS",
    questionType: "SINGLE-CHOICE",
    submissionMethod: "ONLINE-FORM",
    recognitionLevel: "STRUCTURED",
    scoringLevel: "AUTO-SCORE",
    requiredEvidence: ["ANSWER-PAYLOAD", "ITEM-VERSION"],
    teacherReviewRequired: "NO",
    batchConfirmEligibility: "ELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
    isSubjective: false,
  },
  {
    id: "GRD-CAP-MATH-CALCULATION-IMAGE",
    subjectFamily: "MATHEMATICS",
    questionType: "CALCULATION",
    submissionMethod: "IMAGE-UPLOAD",
    recognitionLevel: "CONTENT",
    scoringLevel: "AI-SUGGESTION",
    requiredEvidence: ["MEDIA", "REGION-MAP", "IMAGE-QUALITY", "RUBRIC-VERSION", "TEACHER-JUDGMENT"],
    teacherReviewRequired: "YES",
    batchConfirmEligibility: "INELIGIBLE",
    unavailableFallback: "MANUAL-TRANSCRIPTION-THEN-GRADING",
    isSubjective: true,
  },
  {
    id: "GRD-CAP-ENGLISH-CHOICE-ONLINE",
    subjectFamily: "ENGLISH",
    questionType: "MULTIPLE-CHOICE",
    submissionMethod: "ONLINE-FORM",
    recognitionLevel: "STRUCTURED",
    scoringLevel: "AUTO-SCORE",
    requiredEvidence: ["ANSWER-PAYLOAD", "ITEM-VERSION"],
    teacherReviewRequired: "NO",
    batchConfirmEligibility: "ELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
    isSubjective: false,
  },
  {
    id: "GRD-CAP-ENGLISH-SHORT-TEXT",
    subjectFamily: "ENGLISH",
    questionType: "SHORT-ANSWER",
    submissionMethod: "TEXT",
    recognitionLevel: "CONTENT",
    scoringLevel: "AI-SUGGESTION",
    requiredEvidence: ["ANSWER-PAYLOAD", "RUBRIC-VERSION", "TEACHER-JUDGMENT"],
    teacherReviewRequired: "YES",
    batchConfirmEligibility: "INELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
    isSubjective: true,
  },
  {
    id: "GRD-CAP-MORALITY-SHORT-TEXT",
    subjectFamily: "MORALITY-AND-LAW",
    questionType: "SHORT-ANSWER",
    submissionMethod: "TEXT",
    recognitionLevel: "CONTENT",
    scoringLevel: "AI-SUGGESTION",
    requiredEvidence: ["ANSWER-PAYLOAD", "RUBRIC-VERSION", "TEACHER-JUDGMENT"],
    teacherReviewRequired: "YES",
    batchConfirmEligibility: "INELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
    isSubjective: true,
  },
  {
    id: "GRD-CAP-HISTORY-SHORT-TEXT",
    subjectFamily: "HISTORY",
    questionType: "SHORT-ANSWER",
    submissionMethod: "TEXT",
    recognitionLevel: "CONTENT",
    scoringLevel: "AI-SUGGESTION",
    requiredEvidence: ["ANSWER-PAYLOAD", "RUBRIC-VERSION", "TEACHER-JUDGMENT"],
    teacherReviewRequired: "YES",
    batchConfirmEligibility: "INELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
    isSubjective: true,
  },
  {
    id: "GRD-CAP-GEOGRAPHY-ATTACHMENT-IMAGE",
    subjectFamily: "GEOGRAPHY",
    questionType: "ATTACHMENT-ANSWER",
    submissionMethod: "IMAGE-UPLOAD",
    recognitionLevel: "METADATA",
    scoringLevel: "MANUAL-ONLY",
    requiredEvidence: ["MEDIA", "REGION-MAP", "IMAGE-QUALITY", "TEACHER-JUDGMENT"],
    teacherReviewRequired: "YES",
    batchConfirmEligibility: "INELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
    isSubjective: true,
  },
  {
    id: "GRD-CAP-BIOLOGY-TRUE-FALSE-ONLINE",
    subjectFamily: "BIOLOGY",
    questionType: "TRUE-FALSE",
    submissionMethod: "ONLINE-FORM",
    recognitionLevel: "STRUCTURED",
    scoringLevel: "AUTO-SCORE",
    requiredEvidence: ["ANSWER-PAYLOAD", "ITEM-VERSION"],
    teacherReviewRequired: "NO",
    batchConfirmEligibility: "ELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
    isSubjective: false,
  },
  {
    id: "GRD-CAP-PHYSICS-CALCULATION-IMAGE",
    subjectFamily: "PHYSICS",
    questionType: "CALCULATION",
    submissionMethod: "IMAGE-UPLOAD",
    recognitionLevel: "CONTENT",
    scoringLevel: "AI-SUGGESTION",
    requiredEvidence: ["MEDIA", "REGION-MAP", "IMAGE-QUALITY", "RUBRIC-VERSION", "TEACHER-JUDGMENT"],
    teacherReviewRequired: "YES",
    batchConfirmEligibility: "INELIGIBLE",
    unavailableFallback: "MANUAL-TRANSCRIPTION-THEN-GRADING",
    isSubjective: true,
  },
  {
    id: "GRD-CAP-CHEMISTRY-CALCULATION-IMAGE",
    subjectFamily: "CHEMISTRY",
    questionType: "CALCULATION",
    submissionMethod: "IMAGE-UPLOAD",
    recognitionLevel: "CONTENT",
    scoringLevel: "AI-SUGGESTION",
    requiredEvidence: ["MEDIA", "REGION-MAP", "IMAGE-QUALITY", "RUBRIC-VERSION", "TEACHER-JUDGMENT"],
    teacherReviewRequired: "YES",
    batchConfirmEligibility: "INELIGIBLE",
    unavailableFallback: "MANUAL-TRANSCRIPTION-THEN-GRADING",
    isSubjective: true,
  },
  {
    id: "GRD-CAP-PE-LEARNING-TASK-MEDIA",
    subjectFamily: "PHYSICAL-EDUCATION",
    questionType: "LEARNING-TASK",
    submissionMethod: "MIXED-MEDIA",
    recognitionLevel: "METADATA",
    scoringLevel: "MANUAL-ONLY",
    requiredEvidence: ["MEDIA", "TEACHER-JUDGMENT"],
    teacherReviewRequired: "YES",
    batchConfirmEligibility: "INELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
    isSubjective: true,
  },
  {
    id: "GRD-CAP-ARTS-ATTACHMENT-FILE",
    subjectFamily: "ARTS",
    questionType: "ATTACHMENT-ANSWER",
    submissionMethod: "FILE-UPLOAD",
    recognitionLevel: "METADATA",
    scoringLevel: "MANUAL-ONLY",
    requiredEvidence: ["MEDIA", "RUBRIC-VERSION", "TEACHER-JUDGMENT"],
    teacherReviewRequired: "YES",
    batchConfirmEligibility: "INELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
    isSubjective: true,
  },
  {
    id: "GRD-CAP-IT-LEARNING-TASK-FILE",
    subjectFamily: "INFORMATION-TECHNOLOGY",
    questionType: "LEARNING-TASK",
    submissionMethod: "FILE-UPLOAD",
    recognitionLevel: "METADATA",
    scoringLevel: "MANUAL-ONLY",
    requiredEvidence: ["MEDIA", "RUBRIC-VERSION", "TEACHER-JUDGMENT"],
    teacherReviewRequired: "YES",
    batchConfirmEligibility: "INELIGIBLE",
    unavailableFallback: "MANUAL-GRADING",
    isSubjective: true,
  },
];

const gradingCapabilityApplicability = {
  exactRulePriority: 100,
  optionSetBindings: {
    subjectFamily: "OPT-TL-003",
    questionType: "OPT-ENUM-003",
    submissionMethod: "OPT-ENUM-031",
    recognitionLevel: "OPT-TL-004",
    scoringLevel: "OPT-TL-005",
    requiredEvidence: "OPT-TL-006",
    teacherReviewRequired: "OPT-ENUM-001",
    batchConfirmEligibility: "OPT-TL-007",
    unavailableFallback: "OPT-TL-008",
  },
  dimensions: {
    subjectFamilies: [
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
    questionTypes: [
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
    submissionMethods: [
      "ONLINE-FORM",
      "TEXT",
      "IMAGE-UPLOAD",
      "FILE-UPLOAD",
      "MIXED-MEDIA",
    ],
  },
  subjectiveQuestionTypes: [
    "CALCULATION",
    "SHORT-ANSWER",
    "ESSAY",
    "ATTACHMENT-ANSWER",
    "LEARNING-TASK",
  ],
  unsupportedRule: {
    id: "GRD-CAP-UNSUPPORTED-COMBINATION",
    priority: 0,
    match: {
      subjectFamily: "*",
      questionType: "*",
      submissionMethod: "*",
    },
    exceptCombinationIds: gradingCapabilityMatrix.map((rule) => (
      `${rule.subjectFamily}|${rule.questionType}|${rule.submissionMethod}`
    )),
    decision: {
      recognitionLevel: "NONE",
      scoringLevel: "MANUAL-ONLY",
      requiredEvidence: ["TEACHER-JUDGMENT"],
      teacherReviewRequired: "YES",
      batchConfirmEligibility: "INELIGIBLE",
      unavailableFallback: "MANUAL-GRADING",
    },
  },
};

const systemFlowPermissions = [
  permission("ALLOW", "SYSTEM", "the verified Flow invokes the versioned grading step"),
  permission("DENY", "CURRENT_ACTOR", "a user attempts to invoke an internal grading step directly"),
];

const gradingTeacherPermissions = [
  permission(
    "ALLOW",
    "DUTY-SUBJECT-TEACHER",
    "the corresponding subject teacher confirms the decision inside assigned course and student scope",
  ),
  permission(
    "DENY",
    "DUTY-HOMEROOM",
    "a homeroom teacher attempts to confirm another subject or an unconfirmed subjective score",
  ),
  permission(
    "DENY",
    "ROLE-PLATFORM-OPS",
    "platform operations attempts to assign an official student score",
  ),
];

const gradingFlowTrigger = { kind: "FLOW", flowIds: ["DF-006"] };
const gradingActions = [
  action({
    id: "GRD-ACT-ENQUEUE",
    label: "Enqueue Submission for Grading",
    targetObjectId: "GRD-OBJ-DECISION",
    outputFieldIds: ["GRD-DECISION-F-DECISION-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: gradingFlowTrigger,
    permissions: systemFlowPermissions,
    successState: "QUEUED",
  }),
  action({
    id: "GRD-ACT-PROCESS",
    label: "Process Grading Evidence",
    targetObjectId: "GRD-OBJ-DECISION",
    outputFieldIds: [
      "GRD-DECISION-F-RECOGNIZED-ANSWER",
      "GRD-DECISION-F-RECOGNIZED-REGION",
      "GRD-DECISION-F-SUGGESTED-SCORE",
      "GRD-DECISION-F-SCORING-RATIONALE",
      "GRD-DECISION-F-CONFIDENCE",
      "GRD-DECISION-F-LIMITATION",
      "GRD-DECISION-F-DECISION-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: gradingFlowTrigger,
    permissions: systemFlowPermissions,
    transition: { from: "QUEUED", to: "PROCESSING" },
    failureResults: ["PERMISSION_DENIED", "AI_UNAVAILABLE", "UNSUPPORTED_COMBINATION", "VERSION_CONFLICT"],
    failureOutcomes: {
      AI_UNAVAILABLE: {
        kind: "BOUNDARY",
        expectedState: "PROCESSING",
        expectedPermission: "ALLOW",
        expectedData: "records AI unavailability and preserves the submission for manual grading",
      },
      UNSUPPORTED_COMBINATION: {
        kind: "BOUNDARY",
        expectedState: "PROCESSING",
        expectedPermission: "ALLOW",
        expectedData: "records the unsupported combination and preserves the submission for manual grading",
      },
    },
  }),
  action({
    id: "GRD-ACT-ROUTE",
    label: "Route Grading Decision",
    targetObjectId: "GRD-OBJ-DECISION",
    outputFieldIds: ["GRD-DECISION-F-ROUTE", "GRD-DECISION-F-DECISION-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: gradingFlowTrigger,
    permissions: systemFlowPermissions,
    transition: { from: "PROCESSING", to: "ROUTED" },
    successData: "routes supported evidence to a suggestion path and every unsupported or unavailable combination to manual grading",
  }),
  action({
    id: "GRD-ACT-CORRECT-RECOGNITION",
    label: "Correct Recognized Answer Region",
    targetObjectId: "GRD-OBJ-DECISION",
    inputFieldIds: [
      "GRD-DECISION-F-RECOGNIZED-ANSWER",
      "GRD-DECISION-F-RECOGNIZED-REGION",
      "GRD-DECISION-F-CORRECTION-REASON",
    ],
    outputFieldIds: ["GRD-DECISION-F-DECISION-VERSION"],
    permissions: gradingTeacherPermissions,
    successState: "ROUTED",
  }),
  action({
    id: "GRD-ACT-ACCEPT-SUGGESTION",
    label: "Accept Suggested Score",
    targetObjectId: "GRD-OBJ-DECISION",
    inputFieldIds: ["GRD-DECISION-F-SUGGESTED-SCORE", "GRD-DECISION-F-TEACHER-FEEDBACK"],
    outputFieldIds: ["GRD-DECISION-F-OFFICIAL-SCORE", "GRD-DECISION-F-DECISION-VERSION"],
    risk: RISK.HIGH,
    permissions: gradingTeacherPermissions,
    transition: { from: "ROUTED", to: "TEACHER_CONFIRMED" },
    failureResults: ["PERMISSION_DENIED", "SUBJECTIVE_REVIEW_REQUIRED", "STALE_INPUT_VERSION", "VERSION_CONFLICT"],
  }),
  action({
    id: "GRD-ACT-OVERRIDE-SCORE",
    label: "Override Suggested Score",
    targetObjectId: "GRD-OBJ-DECISION",
    inputFieldIds: [
      "GRD-DECISION-F-OFFICIAL-SCORE",
      "GRD-DECISION-F-TEACHER-FEEDBACK",
      "GRD-DECISION-F-CORRECTION-REASON",
    ],
    outputFieldIds: ["GRD-DECISION-F-DECISION-VERSION"],
    risk: RISK.HIGH,
    permissions: gradingTeacherPermissions,
    transition: { from: "ROUTED", to: "TEACHER_CONFIRMED" },
    failureResults: ["PERMISSION_DENIED", "CORRECTION_REASON_REQUIRED", "STALE_INPUT_VERSION", "VERSION_CONFLICT"],
  }),
  action({
    id: "GRD-ACT-MANUAL-GRADE",
    label: "Grade Submission Manually",
    targetObjectId: "GRD-OBJ-DECISION",
    inputFieldIds: [
      "GRD-DECISION-F-OFFICIAL-SCORE",
      "GRD-DECISION-F-TEACHER-FEEDBACK",
    ],
    outputFieldIds: ["GRD-DECISION-F-DECISION-VERSION"],
    risk: RISK.HIGH,
    permissions: gradingTeacherPermissions,
    transition: { from: "ROUTED", to: "TEACHER_CONFIRMED" },
    failureResults: ["PERMISSION_DENIED", "MISSING_REQUIRED_EVIDENCE", "STALE_INPUT_VERSION", "VERSION_CONFLICT"],
  }),
  action({
    id: "GRD-ACT-BATCH-CONFIRM",
    label: "Batch Confirm Eligible Scores",
    targetObjectId: "GRD-OBJ-DECISION",
    outputFieldIds: ["GRD-DECISION-F-OFFICIAL-SCORE", "GRD-DECISION-F-DECISION-VERSION"],
    risk: RISK.HIGH,
    permissions: gradingTeacherPermissions,
    transition: { from: "ROUTED", to: "TEACHER_CONFIRMED" },
    failureResults: ["PERMISSION_DENIED", "SUBJECTIVE_ITEMS_INELIGIBLE", "LOW_CONFIDENCE_INELIGIBLE", "VERSION_CONFLICT"],
  }),
  action({
    id: "GRD-ACT-RESOLVE-VERSION-CONFLICT",
    label: "Resolve Grading Version Conflict",
    targetObjectId: "GRD-OBJ-DECISION",
    inputFieldIds: [
      "GRD-DECISION-F-SUBMISSION-VERSION",
      "GRD-DECISION-F-ITEM-VERSION",
      "GRD-DECISION-F-RUBRIC-VERSION",
      "GRD-DECISION-F-CORRECTION-REASON",
    ],
    outputFieldIds: ["GRD-DECISION-F-DECISION-VERSION"],
    risk: RISK.HIGH,
    permissions: gradingTeacherPermissions,
    transition: { from: "CONFLICT", to: "TEACHER_CONFIRMED" },
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STILL_STALE", "UNCONFIRMED_SUBJECTIVE_SCORE", "VERSION_CONFLICT"],
  }),
];

const gradingModule = moduleFact({
  id: "GRD-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Grading Routing and Teacher Decision",
  objective: "Route every supported combination by evidence while keeping official scoring under subject-teacher control",
  entryConditions: ["an immutable submitted version references an assignment item and Rubric version"],
  exitConditions: ["the corresponding subject teacher confirms a versioned official score or the item remains routed for manual grading"],
  baselineDecisionIds: ["BASE-003", "BASE-007", "BASE-008"],
  nfrIds: ["NFR-006", "NFR-008"],
  capabilityMatrix: gradingCapabilityMatrix,
  capabilityApplicability: gradingCapabilityApplicability,
  objects: [
    object(
      "GRD-OBJ-CAPABILITY-RULE",
      "Grading Capability Rule",
      {
        dataSubject: "GRADING_CAPABILITY",
        controlSubject: "SCHOOL",
        producerRef: "SYSTEM",
        ownerRef: "ROLE-ACADEMIC",
        confirmerRef: "ROLE-ACADEMIC",
        stewardRef: "DUTY-SUBJECT-LEAD",
      },
      ["ACTIVE", "RETIRED"],
      capabilityMatrixFields,
    ),
    object(
      "GRD-OBJ-DECISION",
      "Grading Decision Version",
      {
        dataSubject: "STUDENT_SCORE_AND_FEEDBACK",
        controlSubject: "SCHOOL",
        producerRef: "SYSTEM",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "ROLE-ACADEMIC",
      },
      ["QUEUED", "PROCESSING", "ROUTED", "CONFLICT", "TEACHER_CONFIRMED"],
      gradingDecisionFields,
      { sensitivityId: "S3" },
    ),
  ],
  relationships: [{
    id: "GRD-REL-CAPABILITY-DECISION",
    fromObjectId: "GRD-OBJ-CAPABILITY-RULE",
    toObjectId: "GRD-OBJ-DECISION",
    type: "CONFIGURES",
    cardinality: "ONE_TO_MANY",
    ownershipScope: "SAME_SUBJECT",
    onSourceInvalidation: "retain the capability rule version used by every decision and route only new decisions with the replacement rule",
  }],
  actions: gradingActions,
  pages: [
    page(
      "GRD-PAGE-DECISION",
      "Subject Teacher Grading Workspace",
      ["GRD-OBJ-CAPABILITY-RULE", "GRD-OBJ-DECISION"],
      [...capabilityMatrixFields, ...gradingDecisionFields].map(({ id }) => id),
      gradingActions.slice(3).map(({ action: actionValue }) => actionValue.id),
    ),
  ],
});

const publicationBatchFields = [
  field("PUB-BATCH-F-SELECTED-STUDENT-IDS", "Selected Student Scope", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-010" },
  }),
  field("PUB-BATCH-F-BATCH-VERSION", "Publication Batch Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PUB-BATCH-F-OBJECT-RESULTS", "Student-level Publication Results", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    validation: "must record an independent success or failure result for every selected student",
  }),
  field("PUB-BATCH-F-STATUS", "Publication Batch Status", {
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
];

const publishedResultFields = [
  field("PUB-RESULT-F-DECISION-VERSION", "Confirmed Decision Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("PUB-RESULT-F-ELIGIBILITY", "Publication Eligibility", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-009" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PUB-RESULT-F-BLOCKING-CODES", "Publication Blocking Codes", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PUB-RESULT-F-ANSWER-VISIBLE-AT", "Answer Visible Time", { dataType: "DATETIME" }),
  field("PUB-RESULT-F-FEEDBACK-VISIBLE-AT", "Feedback Visible Time", { dataType: "DATETIME" }),
  field("PUB-RESULT-F-RESULT-VERSION", "Result Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PUB-RESULT-F-CORRECTION-VERSION", "Correction Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PUB-RESULT-F-PUBLIC-CORRECTION-NOTE", "Public Correction Note", {
    dataType: "TEXT",
    required: "required when a published result is corrected",
  }),
  field("PUB-RESULT-F-NOTIFICATION-STATUS", "Notification Status", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-010" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS", "Downstream Invalidation Records", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
];

const publicationTeacherPermissions = [
  permission(
    "ALLOW",
    "DUTY-SUBJECT-TEACHER",
    "the corresponding subject teacher publishes confirmed decisions inside assigned student scope",
  ),
  permission(
    "DENY",
    "DUTY-HOMEROOM",
    "a homeroom teacher attempts to publish another subject or any unconfirmed subjective score",
  ),
  permission(
    "DENY",
    "ROLE-PLATFORM-OPS",
    "platform operations attempts to publish or correct student results",
  ),
];

const publicationActions = [
  action({
    id: "PUB-ACT-PREVIEW",
    label: "Preview Result Publication",
    targetObjectId: "PUB-OBJ-BATCH",
    outputFieldIds: publicationBatchFields.map(({ id }) => id),
    writes: false,
    permissions: publicationTeacherPermissions,
    successData: "returns student-level eligibility, blocking codes, visibility times, and notification preview without publication",
  }),
  action({
    id: "PUB-ACT-PUBLISH-SELECTED",
    label: "Publish Results to Selected Students",
    targetObjectId: "PUB-OBJ-BATCH",
    inputFieldIds: ["PUB-BATCH-F-SELECTED-STUDENT-IDS"],
    outputFieldIds: [
      "PUB-BATCH-F-BATCH-VERSION",
      "PUB-BATCH-F-OBJECT-RESULTS",
      "PUB-BATCH-F-STATUS",
    ],
    risk: RISK.HIGH,
    permissions: publicationTeacherPermissions,
    transition: { from: "READY", to: "PUBLISHED" },
    failureResults: [
      "PERMISSION_DENIED",
      "UNCONFIRMED_SUBJECTIVE_SCORE",
      "VISIBILITY_POLICY_BLOCKED",
      "OBJECT_PUBLICATION_FAILED",
      "VERSION_CONFLICT",
    ],
    failureOutcomes: {
      OBJECT_PUBLICATION_FAILED: {
        kind: "BOUNDARY",
        expectedState: "PARTIAL_FAILED",
        expectedPermission: "ALLOW",
        expectedData: "publishes eligible students, records each failed student, and does not retry successful results",
      },
    },
    idempotencyKey: "PUB-ACT-PUBLISH-SELECTED:school:assignment:decision-versions:selected-student-set:request-id",
  }),
  action({
    id: "PUB-ACT-RETRY-FAILED",
    label: "Retry Failed Result Publication",
    targetObjectId: "PUB-OBJ-BATCH",
    outputFieldIds: [
      "PUB-BATCH-F-BATCH-VERSION",
      "PUB-BATCH-F-OBJECT-RESULTS",
      "PUB-BATCH-F-STATUS",
    ],
    risk: RISK.HIGH,
    permissions: publicationTeacherPermissions,
    transition: { from: "PARTIAL_FAILED", to: "PUBLISHED" },
    failureResults: [
      "PERMISSION_DENIED",
      "UNCONFIRMED_SUBJECTIVE_SCORE",
      "VISIBILITY_POLICY_BLOCKED",
      "OBJECT_PUBLICATION_FAILED",
      "VERSION_CONFLICT",
    ],
  }),
  action({
    id: "PUB-ACT-CORRECT-RESULT",
    label: "Correct Published Result",
    targetObjectId: "PUB-OBJ-RESULT",
    inputFieldIds: ["PUB-RESULT-F-PUBLIC-CORRECTION-NOTE"],
    outputFieldIds: [
      "PUB-RESULT-F-RESULT-VERSION",
      "PUB-RESULT-F-CORRECTION-VERSION",
      "PUB-RESULT-F-NOTIFICATION-STATUS",
      "PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS",
    ],
    risk: RISK.HIGH,
    permissions: publicationTeacherPermissions,
    transition: { from: "PUBLISHED", to: "CORRECTED" },
    failureResults: ["PERMISSION_DENIED", "CORRECTION_NOTE_REQUIRED", "STALE_DECISION_VERSION", "VERSION_CONFLICT"],
    successData: "creates a correction version, exposes the public correction note, and records every invalidated downstream explanation",
  }),
  action({
    id: "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
    label: "Reconfirm Invalidated Explanation",
    targetObjectId: "PUB-OBJ-RESULT",
    inputFieldIds: ["PUB-RESULT-F-PUBLIC-CORRECTION-NOTE"],
    outputFieldIds: [
      "PUB-RESULT-F-RESULT-VERSION",
      "PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS",
    ],
    risk: RISK.HIGH,
    permissions: publicationTeacherPermissions,
    transition: { from: "INVALIDATED", to: "READY" },
    failureResults: ["PERMISSION_DENIED", "INVALIDATION_UNRESOLVED", "STALE_DECISION_VERSION", "VERSION_CONFLICT"],
  }),
];

const publicationModule = moduleFact({
  id: "PUB-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Result Publication and Correction",
  objective: "Publish only eligible confirmed results and preserve visible correction and downstream invalidation history",
  entryConditions: ["the result references a corresponding subject-teacher-confirmed grading decision version"],
  exitConditions: ["each selected student has a published result or an object-level failure eligible for retry"],
  baselineDecisionIds: ["BASE-003", "BASE-007", "BASE-008", "BASE-010"],
  nfrIds: ["NFR-006", "NFR-008"],
  permissions: {
    studentRead: "students may read only published answers, scores, and feedback after the configured visible time",
  },
  objects: [
    object(
      "PUB-OBJ-BATCH",
      "Result Publication Batch",
      {
        dataSubject: "SELECTED_STUDENT_RESULTS",
        controlSubject: "SCHOOL",
        producerRef: "DUTY-SUBJECT-TEACHER",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "ROLE-ACADEMIC",
      },
      ["DRAFT", "READY", "PUBLISHING", "PARTIAL_FAILED", "PUBLISHED"],
      publicationBatchFields,
      { sensitivityId: "S3" },
    ),
    object(
      "PUB-OBJ-RESULT",
      "Published Student Result Version",
      {
        dataSubject: "STUDENT_SCORE_AND_FEEDBACK",
        controlSubject: "SCHOOL",
        producerRef: "DUTY-SUBJECT-TEACHER",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "ROLE-ACADEMIC",
      },
      ["READY", "PUBLISHED", "PUBLISH_FAILED", "CORRECTED", "INVALIDATED"],
      publishedResultFields,
      { sensitivityId: "S3" },
    ),
  ],
  relationships: [{
    id: "PUB-REL-BATCH-RESULT",
    fromObjectId: "PUB-OBJ-BATCH",
    toObjectId: "PUB-OBJ-RESULT",
    type: "CONTAINS",
    cardinality: "ONE_TO_MANY",
    ownershipScope: "SAME_SUBJECT",
    onSourceInvalidation: "retain published student results and invalidate only failed or stale unpublished derivations",
  }],
  actions: publicationActions,
  pages: [
    page(
      "PUB-PAGE-RELEASE",
      "Result Release Workspace",
      ["PUB-OBJ-BATCH", "PUB-OBJ-RESULT"],
      [...publicationBatchFields, ...publishedResultFields].map(({ id }) => id),
      publicationActions.slice(0, 3).map(({ action: actionValue }) => actionValue.id),
    ),
    page(
      "PUB-PAGE-CORRECTION",
      "Published Result Correction Workspace",
      ["PUB-OBJ-RESULT"],
      publishedResultFields.map(({ id }) => id),
      publicationActions.slice(3).map(({ action: actionValue }) => actionValue.id),
    ),
  ],
});

export const teachingLoopOptionSets = deepFreeze([
  optionSet("OPT-TL-001", "questionOrder", "题目顺序", [
    ["FIXED", "固定顺序"],
    ["SHUFFLED", "随机顺序"],
  ]),
  optionSet("OPT-TL-002", "assignmentNotificationPolicy", "作业通知策略", [
    ["NONE", "不通知"],
    ["IN-APP-IMMEDIATE", "产品内立即通知"],
    ["IN-APP-SCHEDULED", "产品内定时通知"],
  ]),
  optionSet("OPT-TL-003", "subjectFamily", "学科族", [
    ["CHINESE", "语文"],
    ["MATHEMATICS", "数学"],
    ["ENGLISH", "英语"],
    ["MORALITY-AND-LAW", "道德与法治"],
    ["HISTORY", "历史"],
    ["GEOGRAPHY", "地理"],
    ["BIOLOGY", "生物"],
    ["PHYSICS", "物理"],
    ["CHEMISTRY", "化学"],
    ["PHYSICAL-EDUCATION", "体育"],
    ["ARTS", "艺术"],
    ["INFORMATION-TECHNOLOGY", "信息技术"],
  ]),
  optionSet("OPT-TL-004", "recognitionLevel", "识别级别", [
    ["NONE", "不识别"],
    ["METADATA", "仅媒体和区域元数据"],
    ["CONTENT", "内容识别"],
    ["STRUCTURED", "结构化答案识别"],
  ]),
  optionSet("OPT-TL-005", "scoringLevel", "评分级别", [
    ["AUTO-SCORE", "规则自动建议分"],
    ["RULE-SUGGESTION", "规则评分建议"],
    ["AI-SUGGESTION", "AI评分建议"],
    ["MANUAL-ONLY", "仅人工评分"],
  ]),
  optionSet("OPT-TL-006", "gradingEvidenceRequirement", "批改证据要求", [
    ["ANSWER-PAYLOAD", "结构化答案载荷"],
    ["MEDIA", "媒体原件"],
    ["REGION-MAP", "页题区域映射"],
    ["IMAGE-QUALITY", "图片质量结果"],
    ["ITEM-VERSION", "题目版本"],
    ["RUBRIC-VERSION", "Rubric版本"],
    ["TEACHER-JUDGMENT", "教师专业判断"],
  ]),
  optionSet("OPT-TL-007", "batchConfirmEligibility", "批量确认资格", [
    ["ELIGIBLE", "可批量确认"],
    ["INELIGIBLE", "不可批量确认"],
  ]),
  optionSet("OPT-TL-008", "gradingUnavailableFallback", "不可用兜底", [
    ["MANUAL-GRADING", "人工批改"],
    ["MANUAL-TRANSCRIPTION-THEN-GRADING", "人工录入后批改"],
  ]),
  optionSet("OPT-TL-009", "publicationEligibility", "发布资格", [
    ["ELIGIBLE", "可发布"],
    ["BLOCKED", "阻断发布"],
  ]),
  optionSet("OPT-TL-010", "publicationNotificationStatus", "发布通知状态", [
    ["PENDING", "待发送"],
    ["SENT", "已发送"],
    ["FAILED", "发送失败"],
    ["NOT-REQUIRED", "无需发送"],
  ]),
]);

export const teachingLoopModules = deepFreeze([
  hwModule,
  submissionModule,
  gradingModule,
  publicationModule,
]);
export const teachingLoopFlows = deepFreeze([
  {
    id: "DF-004",
    label: "Assignment Validation and Publication",
    phase: PHASE.FIRST,
    moduleIds: ["HW-001"],
    steps: [
      { order: 1, actionId: "HW-ACT-VALIDATE" },
      { order: 2, actionId: "HW-ACT-PREVIEW" },
      { order: 3, actionId: "HW-ACT-PUBLISH-NOW", condition: "the teacher selects immediate publication" },
      { order: 4, actionId: "HW-ACT-SCHEDULE-PUBLISH", condition: "the teacher selects scheduled publication instead of immediate publication" },
    ],
    sourceDataRefs: [
      {
        objectId: "HW-OBJ-ASSIGNMENT",
        fieldId: "HW-ASSIGNMENT-F-DUE-AT",
        version: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      },
      {
        objectId: "HW-OBJ-ITEM",
        fieldId: "HW-ITEM-F-PROMPT",
        version: "HW-ITEM-F-ITEM-VERSION",
      },
    ],
    targetDataRefs: [{
      objectId: "HW-OBJ-ASSIGNMENT",
      fieldId: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      version: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
    }],
    idempotencyKey: "DF-004:school:term:assignment-version:validation-version:request-id",
    failureGranularity: "ASSIGNMENT_OBJECT_VERSION_WITH_NO_PARTIAL_ITEM_PUBLICATION",
    retryPolicy: {
      strategy: "REVALIDATE_STALE_ASSIGNMENT_THEN_RETRY",
      maxAttempts: 3,
      retryableFailureResults: ["TRANSIENT_FAILURE", "VERSION_CONFLICT", "AUDIT_FAILED"],
    },
    compensation: {
      strategy: "KEEP_PRIOR_PUBLICATION_VERSION",
      description: "a failed immediate or scheduled publication leaves the prior published version active",
    },
    downstreamInvalidation: {
      strategy: "INVALIDATE_NEW_STUDENT_ASSIGNMENT_READS_ONLY",
      targets: ["student assignment list", "submission eligibility cache", "assignment notification preview"],
    },
  },
  {
    id: "DF-005",
    label: "Published Assignment Student Submission",
    phase: PHASE.FIRST,
    moduleIds: ["HW-001", "SUB-001"],
    steps: [
      { order: 1, actionId: "HW-ACT-OPEN-PUBLISHED" },
      { order: 2, actionId: "SUB-ACT-SAVE-DRAFT" },
      { order: 3, actionId: "SUB-ACT-UPLOAD-CHUNK", condition: "the answer contains App media" },
      { order: 4, actionId: "SUB-ACT-RETRY-UPLOAD", condition: "one or more media chunks failed while successful chunks remain accepted" },
      { order: 5, actionId: "SUB-ACT-SUBMIT", condition: "the server can issue a final submission receipt" },
    ],
    sourceDataRefs: [
      {
        objectId: "HW-OBJ-ASSIGNMENT",
        fieldId: "HW-ASSIGNMENT-F-TITLE",
        version: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      },
      {
        objectId: "SUB-OBJ-DRAFT",
        fieldId: "SUB-DRAFT-F-ANSWER-PAYLOAD",
        version: "SUB-DRAFT-F-DRAFT-VERSION",
      },
    ],
    targetDataRefs: [
      {
        objectId: "SUB-OBJ-ATTEMPT",
        fieldId: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
        version: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      },
      {
        objectId: "SUB-OBJ-ATTEMPT",
        fieldId: "SUB-ATTEMPT-F-RECEIPT-ID",
        version: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      },
    ],
    idempotencyKey: "DF-005:school:term:assignment-publication-version:student:draft-version:request-id",
    failureGranularity: "STUDENT_SUBMISSION_OBJECT_AND_MEDIA_CHUNK",
    retryPolicy: {
      strategy: "RETRY_FAILED_CHUNKS_OR_UNRECEIPTED_SUBMISSION",
      maxAttempts: 5,
      retryableFailureResults: ["TRANSIENT_FAILURE", "CHUNK_REJECTED", "SERVER_RECEIPT_NOT_ISSUED"],
    },
    compensation: {
      strategy: "PRESERVE_DRAFT_AND_ACCEPTED_CHUNKS",
      description: "never roll back accepted chunks and never create a final submission without a server receipt",
    },
    downstreamInvalidation: {
      strategy: "INVALIDATE_STALE_SUBMISSION_DERIVATIONS",
      targets: ["submission status", "grading queue eligibility", "late and resubmission projections"],
    },
  },
  {
    id: "DF-006",
    label: "Submission Grading Routing",
    phase: PHASE.FIRST,
    moduleIds: ["SUB-001", "GRD-001"],
    steps: [
      { order: 1, actionId: "SUB-ACT-SUBMIT", condition: "an accepted submission version has a server receipt" },
      { order: 2, actionId: "GRD-ACT-ENQUEUE" },
      { order: 3, actionId: "GRD-ACT-PROCESS", condition: "the capability matrix permits recognition or scoring assistance" },
      { order: 4, actionId: "GRD-ACT-ROUTE", condition: "AI unavailable or an unsupported combination routes to manual grading; otherwise route the suggestion for teacher review" },
    ],
    sourceDataRefs: [
      {
        objectId: "SUB-OBJ-ATTEMPT",
        fieldId: "SUB-ATTEMPT-F-RECEIPT-ID",
        version: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      },
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-SUBMISSION-VERSION",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
    ],
    targetDataRefs: [
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-ROUTE",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-DECISION-VERSION",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
    ],
    idempotencyKey: "DF-006:school:term:submission-version:capability-matrix-version:request-id",
    failureGranularity: "SUBMISSION_ITEM_OBJECT_WITH_INDEPENDENT_MANUAL_ROUTE",
    retryPolicy: {
      strategy: "RETRY_QUEUE_AND_PROCESSING_WITH_MANUAL_CUTOFF",
      maxAttempts: 3,
      retryableFailureResults: ["TRANSIENT_FAILURE", "AI_UNAVAILABLE", "VERSION_CONFLICT"],
    },
    compensation: {
      strategy: "ROUTE_MANUAL_WITHOUT_ROLLING_BACK_SUBMISSION",
      description: "an AI failure preserves the accepted submission and creates or keeps a manual grading route",
    },
    downstreamInvalidation: {
      strategy: "INVALIDATE_STALE_GRADING_QUEUE_VIEWS",
      targets: ["subject teacher grading queue", "AI suggestion preview", "batch confirmation eligibility"],
    },
  },
  {
    id: "DF-007",
    label: "Subject Teacher Grading Confirmation",
    phase: PHASE.FIRST,
    moduleIds: ["GRD-001"],
    steps: [
      { order: 1, actionId: "GRD-ACT-CORRECT-RECOGNITION", condition: "recognized answer or region is incorrect" },
      { order: 2, actionId: "GRD-ACT-ACCEPT-SUGGESTION", condition: "an eligible suggestion is correct after teacher review" },
      { order: 3, actionId: "GRD-ACT-OVERRIDE-SCORE", condition: "the corresponding subject teacher changes the suggestion with a reason" },
      { order: 4, actionId: "GRD-ACT-MANUAL-GRADE", condition: "AI is unavailable, the combination is unsupported, or the item is subjective" },
      { order: 5, actionId: "GRD-ACT-BATCH-CONFIRM", condition: "every selected item is objective, eligible, and teacher-reviewed" },
      { order: 6, actionId: "GRD-ACT-RESOLVE-VERSION-CONFLICT", condition: "submission, item, or Rubric versions changed before confirmation" },
    ],
    sourceDataRefs: [{
      objectId: "GRD-OBJ-DECISION",
      fieldId: "GRD-DECISION-F-SUGGESTED-SCORE",
      version: "GRD-DECISION-F-DECISION-VERSION",
    }],
    targetDataRefs: [
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-OFFICIAL-SCORE",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-TEACHER-FEEDBACK",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
    ],
    idempotencyKey: "DF-007:school:term:grading-decision-version:teacher-confirmation-version:request-id",
    failureGranularity: "STUDENT_ITEM_GRADING_OBJECT",
    retryPolicy: {
      strategy: "REFRESH_SOURCE_VERSIONS_THEN_RECONFIRM",
      maxAttempts: 3,
      retryableFailureResults: ["STALE_INPUT_VERSION", "SOURCE_VERSION_STILL_STALE", "VERSION_CONFLICT"],
    },
    compensation: {
      strategy: "KEEP_PRIOR_CONFIRMED_DECISION",
      description: "a failed confirmation never replaces the prior official decision and never publishes an unconfirmed subjective score",
    },
    downstreamInvalidation: {
      strategy: "INVALIDATE_PUBLICATION_ELIGIBILITY_AND_DERIVED_EXPLANATIONS",
      targets: ["result publication eligibility", "score explanation", "knowledge evidence projection"],
    },
  },
  {
    id: "DF-008",
    label: "Confirmed Result Publication",
    phase: PHASE.FIRST,
    moduleIds: ["GRD-001", "PUB-001"],
    steps: [
      { order: 1, actionId: "GRD-ACT-ACCEPT-SUGGESTION", condition: "the corresponding subject teacher confirms an eligible objective suggestion" },
      { order: 2, actionId: "GRD-ACT-OVERRIDE-SCORE", condition: "the corresponding subject teacher confirms an overridden score" },
      { order: 3, actionId: "GRD-ACT-MANUAL-GRADE", condition: "the corresponding subject teacher confirms a subjective or manual score" },
      { order: 4, actionId: "PUB-ACT-PREVIEW" },
      { order: 5, actionId: "PUB-ACT-PUBLISH-SELECTED", condition: "all selected results are eligible and every subjective score has teacher confirmation" },
      { order: 6, actionId: "PUB-ACT-RETRY-FAILED", condition: "only object-level failed students are retried" },
    ],
    sourceDataRefs: [
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-OFFICIAL-SCORE",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-ELIGIBILITY",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
    ],
    targetDataRefs: [
      {
        objectId: "PUB-OBJ-BATCH",
        fieldId: "PUB-BATCH-F-OBJECT-RESULTS",
        version: "PUB-BATCH-F-BATCH-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-RESULT-VERSION",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
    ],
    idempotencyKey: "DF-008:school:term:decision-version:selected-student-set:result-version:request-id",
    failureGranularity: "SELECTED_STUDENT_RESULT_OBJECT_WITH_PARTIAL_SUCCESS",
    retryPolicy: {
      strategy: "RETRY_FAILED_STUDENT_RESULTS_ONLY",
      maxAttempts: 5,
      retryableFailureResults: ["OBJECT_PUBLICATION_FAILED", "TRANSIENT_FAILURE", "AUDIT_FAILED"],
    },
    compensation: {
      strategy: "DO_NOT_UNPUBLISH_SUCCESSFUL_RESULTS",
      description: "retain successful student results and retry only failed objects after eligibility is rechecked",
    },
    downstreamInvalidation: {
      strategy: "INVALIDATE_STALE_STUDENT_RESULT_READS",
      targets: ["student score view", "student feedback view", "notification delivery state"],
    },
  },
  {
    id: "DF-009",
    label: "Published Result Correction",
    phase: PHASE.FIRST,
    moduleIds: ["GRD-001", "PUB-001"],
    steps: [
      { order: 1, actionId: "GRD-ACT-OVERRIDE-SCORE", condition: "the corresponding subject teacher records the corrected official score and reason" },
      { order: 2, actionId: "GRD-ACT-RESOLVE-VERSION-CONFLICT", condition: "the published result references a stale submission, item, or Rubric version" },
      { order: 3, actionId: "PUB-ACT-CORRECT-RESULT" },
      { order: 4, actionId: "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION", condition: "a derived explanation was invalidated by the correction" },
    ],
    sourceDataRefs: [
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-OFFICIAL-SCORE",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-RESULT-VERSION",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
    ],
    targetDataRefs: [
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-DECISION-VERSION",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-CORRECTION-VERSION",
        version: "PUB-RESULT-F-CORRECTION-VERSION",
      },
    ],
    idempotencyKey: "DF-009:school:term:decision-version:result-version:correction-version:request-id",
    failureGranularity: "PUBLISHED_STUDENT_RESULT_OBJECT",
    retryPolicy: {
      strategy: "REFRESH_DECISION_AND_RESULT_VERSIONS_THEN_RETRY",
      maxAttempts: 3,
      retryableFailureResults: ["STALE_DECISION_VERSION", "VERSION_CONFLICT", "AUDIT_FAILED"],
    },
    compensation: {
      strategy: "KEEP_PRIOR_PUBLIC_RESULT_UNTIL_CORRECTION_COMMITS",
      description: "a failed correction leaves the prior result visible and does not expose a partial correction",
    },
    downstreamInvalidation: {
      strategy: "INVALIDATE_AND_REQUIRE_RECONFIRMATION",
      targets: ["score explanation", "knowledge evidence", "mastery projection", "improvement recommendation"],
    },
  },
]);
