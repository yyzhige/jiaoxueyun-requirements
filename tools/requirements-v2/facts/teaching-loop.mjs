import { CLIENT, PHASE, RISK, deepFreeze, defineModule } from "../model.mjs";

const WEB_APP = [CLIENT.WEB, CLIENT.APP];
const USER_TASK = "USER_TASK";
const SYSTEM_EVENT = "SYSTEM_EVENT";
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
  operationKind,
  writes,
  risk,
  clients = WEB_APP,
  executionMode = USER_TASK,
  trigger,
  permissions,
  transition,
  successState,
  successData,
  failureResults,
  failureOutcomes = {},
  idempotencyKey = `${id}:school:object:source-version:request-id`,
}) {
  const effectiveOperationKind = operationKind
    ?? (writes === false ? "READ" : transition ? "UPDATE" : undefined);
  if (!effectiveOperationKind) {
    throw new Error(`${id} requires explicit operationKind CREATE for a write without transition`);
  }
  const effectiveWrites = effectiveOperationKind !== "READ";
  if (writes !== undefined && writes !== effectiveWrites) {
    throw new Error(`${id} writes conflicts with operationKind ${effectiveOperationKind}`);
  }
  const effectiveRisk = risk ?? (effectiveWrites ? RISK.LOW : RISK.READ);
  const declaredFailureResults = failureResults ?? (effectiveWrites
    ? ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT"]
    : ["PERMISSION_DENIED", "NOT_FOUND"]);
  const effectiveFailureResults = effectiveRisk === RISK.HIGH
    ? [...new Set([...declaredFailureResults, "AUDIT_FAILED"])]
    : declaredFailureResults;
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
      operationKind: effectiveOperationKind,
      writes: effectiveWrites,
      risk: effectiveRisk,
      executionMode,
      ...(executionMode === USER_TASK ? { clients } : { trigger }),
      permissions,
      scenarioIds: [successScenario.id, ...failureScenarios.map(({ id: scenarioId }) => scenarioId)],
      ...(effectiveWrites ? { idempotencyKey } : {}),
      auditMode: effectiveWrites ? AUDIT_REQUIRED : AUDIT_NOT_REQUIRED,
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
  field("HW-ITEM-F-RUBRIC-REF", "Item Rubric Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "HW-OBJ-RUBRIC" },
    mutability: "IMMUTABLE",
  }),
  field("HW-ITEM-F-KNOWLEDGE-POINT-IDS", "Item Knowledge Points", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-011" },
  }),
];

const hwRubricFields = [
  field("HW-RUBRIC-F-ID", "Rubric ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("HW-RUBRIC-F-RUBRIC-VERSION", "Rubric Version", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("HW-RUBRIC-F-CRITERIA", "Rubric Criteria", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
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
    operationKind: "CREATE",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    inputFieldIds: hwAssignmentInputIds.filter((id) => id !== "HW-ASSIGNMENT-F-REVISION-REASON"),
    outputFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION"],
    permissions: subjectTeacherPermissions,
    successState: "DRAFT",
  }),
  action({
    id: "HW-ACT-CREATE-ITEM",
    label: "Create Assignment Item",
    operationKind: "CREATE",
    targetObjectId: "HW-OBJ-ITEM",
    inputFieldIds: hwItemInputIds,
    outputFieldIds: ["HW-ITEM-F-ITEM-VERSION"],
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
    transition: { from: "DRAFT", to: "DRAFT" },
  }),
  action({
    id: "HW-ACT-VALIDATE-ITEM",
    label: "Validate Assignment Item Version",
    targetObjectId: "HW-OBJ-ITEM",
    outputFieldIds: ["HW-ITEM-F-ITEM-VERSION"],
    permissions: subjectTeacherPermissions,
    transition: { from: "DRAFT", to: "VALIDATED" },
    failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "INCOMPLETE_ITEM", "VERSION_CONFLICT"],
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
    id: "HW-ACT-REVALIDATE-ITEM",
    label: "Revalidate Revised Assignment Item",
    targetObjectId: "HW-OBJ-ITEM",
    outputFieldIds: ["HW-ITEM-F-ITEM-VERSION"],
    permissions: subjectTeacherPermissions,
    transition: { from: "REVISION_DRAFT", to: "VALIDATED" },
    failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "INCOMPLETE_ITEM", "VERSION_CONFLICT"],
  }),
  action({
    id: "HW-ACT-REVALIDATE-REVISION",
    label: "Revalidate Assignment Revision",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    outputFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION"],
    permissions: subjectTeacherPermissions,
    transition: { from: "REVISION_DRAFT", to: "VALIDATED" },
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
    id: "HW-ACT-PUBLISH-ITEM",
    label: "Publish Validated Assignment Item",
    targetObjectId: "HW-OBJ-ITEM",
    outputFieldIds: ["HW-ITEM-F-ITEM-VERSION"],
    risk: RISK.HIGH,
    permissions: subjectTeacherPermissions,
    transition: { from: "VALIDATED", to: "PUBLISHED" },
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
    id: "HW-ACT-PUBLISH-SCHEDULED",
    label: "Publish Scheduled Assignment at Open Time",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    inputFieldIds: ["HW-ASSIGNMENT-F-OPEN-AT"],
    outputFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION"],
    risk: RISK.HIGH,
    executionMode: SYSTEM_EVENT,
    trigger: { kind: "EVENT", eventId: "EVT-HW-SCHEDULED-PUBLISH-DUE" },
    permissions: [
      permission("ALLOW", "SYSTEM", "the system publishes only the validated scheduled version at its configured open time"),
      permission("DENY", "CURRENT_ACTOR", "a user cannot bypass the scheduled publication time"),
    ],
    transition: { from: "SCHEDULED", to: "PUBLISHED" },
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
    id: "HW-ACT-REVISE-ITEM",
    label: "Revise Published Assignment Item",
    targetObjectId: "HW-OBJ-ITEM",
    inputFieldIds: hwItemInputIds,
    outputFieldIds: ["HW-ITEM-F-ITEM-VERSION"],
    risk: RISK.HIGH,
    permissions: subjectTeacherPermissions,
    transition: { from: "PUBLISHED", to: "REVISION_DRAFT" },
    successData: "creates a revision draft while retaining the immutable published item version",
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
  action({
    id: "HW-ACT-RESOLVE-GRADING-SNAPSHOT",
    label: "Resolve Published Item Grading Snapshot",
    targetObjectId: "HW-OBJ-ITEM",
    outputFieldIds: [
      "HW-ITEM-F-ITEM-VERSION",
      "HW-ITEM-F-RUBRIC-REF",
      "HW-ITEM-F-RUBRIC-VERSION",
    ],
    writes: false,
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-006"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "DF-006 resolves the immutable published item and Rubric versions"),
      permission("DENY", "CURRENT_ACTOR", "users cannot invoke the internal grading snapshot handoff"),
    ],
    successData: "returns the immutable item and Rubric versions referenced by the submitted assignment",
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
    object(
      "HW-OBJ-RUBRIC",
      "Published Rubric Version",
      subjectTeacherResponsibility,
      ["PUBLISHED", "DEPRECATED"],
      hwRubricFields,
    ),
  ],
  relationships: [
    {
      id: "HW-REL-ASSIGNMENT-ITEM",
      fromObjectId: "HW-OBJ-ASSIGNMENT",
      toObjectId: "HW-OBJ-ITEM",
      type: "CONTAINS",
      cardinality: "ONE_TO_MANY",
      ownershipScope: "SAME_SUBJECT",
      onSourceInvalidation: "retain immutable published item versions and invalidate only unconfirmed revision drafts",
    },
    {
      id: "HW-REL-ITEM-RUBRIC",
      fromObjectId: "HW-OBJ-ITEM",
      toObjectId: "HW-OBJ-RUBRIC",
      type: "REFERENCES",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SUBJECT",
      onSourceInvalidation: "retain the published Rubric version referenced by each immutable item version",
    },
  ],
  actions: hwActions,
  pages: [
    page(
      "HW-PAGE-AUTHORING",
      "Assignment Authoring Workspace",
      ["HW-OBJ-ASSIGNMENT", "HW-OBJ-ITEM"],
      [...hwAssignmentFields, ...hwItemFields].map(({ id }) => id),
      hwActions
        .filter(({ action: actionValue }) => (
          actionValue.executionMode === USER_TASK
          && actionValue.id !== "HW-ACT-OPEN-PUBLISHED"
        ))
        .map(({ action: actionValue }) => actionValue.id),
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
    transition: { from: "DRAFT", to: "DRAFT" },
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
    operationKind: "CREATE",
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
  action({
    id: "SUB-ACT-HANDOFF-ACCEPTED",
    label: "Handoff Accepted Submission Version",
    targetObjectId: "SUB-OBJ-ATTEMPT",
    outputFieldIds: ["SUB-ATTEMPT-F-SUBMISSION-VERSION", "SUB-ATTEMPT-F-RECEIPT-ID"],
    writes: false,
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-006"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "DF-006 reads an accepted submission carrying a server receipt"),
      permission("DENY", "CURRENT_ACTOR", "users cannot invoke the internal accepted-submission handoff"),
    ],
    successData: "returns only the immutable accepted submission version and server receipt",
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
      submissionActions
        .filter(({ action: actionValue }) => actionValue.executionMode === USER_TASK)
        .map(({ action: actionValue }) => actionValue.id),
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
  field("GRD-CAP-F-RULE-ID", "Capability Rule ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("GRD-CAP-F-RULE-VERSION", "Capability Rule Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
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
  field("GRD-DECISION-F-SUBMISSION-REF", "Input Submission Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "SUB-OBJ-ATTEMPT" },
    mutability: "IMMUTABLE",
  }),
  field("GRD-DECISION-F-SUBMISSION-VERSION", "Input Submission Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("GRD-DECISION-F-ITEM-REF", "Input Item Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "HW-OBJ-ITEM" },
    mutability: "IMMUTABLE",
  }),
  field("GRD-DECISION-F-ITEM-VERSION", "Input Item Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("GRD-DECISION-F-RUBRIC-REF", "Input Rubric Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "HW-OBJ-RUBRIC" },
    mutability: "IMMUTABLE",
  }),
  field("GRD-DECISION-F-RUBRIC-VERSION", "Input Rubric Version", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("GRD-DECISION-F-CAPABILITY-RULE-REF", "Capability Rule Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "GRD-OBJ-CAPABILITY-RULE" },
    mutability: "IMMUTABLE",
  }),
  field("GRD-DECISION-F-CAPABILITY-RULE-VERSION", "Capability Rule Version", {
    dataType: "INTEGER",
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
  field("GRD-DECISION-F-PRIOR-DECISION-VERSION", "Prior Confirmed Decision Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    required: "required when revising a confirmed decision",
  }),
  field("GRD-DECISION-F-ROUTE", "Grading Route", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-011" },
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
  },
];

const gradingCapabilityApplicability = {
  exactRulePriority: 100,
  capabilityObjectId: "GRD-OBJ-CAPABILITY-RULE",
  fieldBindings: {
    subjectFamily: { fieldId: "GRD-CAP-F-SUBJECT-FAMILY", optionSetId: "OPT-TL-003" },
    questionType: { fieldId: "GRD-CAP-F-QUESTION-TYPE", optionSetId: "OPT-ENUM-003" },
    submissionMethod: { fieldId: "GRD-CAP-F-SUBMISSION-METHOD", optionSetId: "OPT-ENUM-031" },
    recognitionLevel: { fieldId: "GRD-CAP-F-RECOGNITION-LEVEL", optionSetId: "OPT-TL-004" },
    scoringLevel: { fieldId: "GRD-CAP-F-SCORING-LEVEL", optionSetId: "OPT-TL-005" },
    requiredEvidence: { fieldId: "GRD-CAP-F-REQUIRED-EVIDENCE", optionSetId: "OPT-TL-006" },
    teacherReviewRequired: { fieldId: "GRD-CAP-F-TEACHER-REVIEW", optionSetId: "OPT-ENUM-001" },
    batchConfirmEligibility: { fieldId: "GRD-CAP-F-BATCH-CONFIRM", optionSetId: "OPT-TL-007" },
    unavailableFallback: { fieldId: "GRD-CAP-F-UNAVAILABLE-FALLBACK", optionSetId: "OPT-TL-008" },
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
const gradingVersionConflictOutcome = {
  VERSION_CONFLICT: {
    expectedState: "CONFLICT",
    expectedData: "records the conflicting source versions and blocks confirmation until the decision is requeued",
  },
};
const gradingActions = [
  action({
    id: "GRD-ACT-ENQUEUE",
    label: "Enqueue Submission for Grading",
    operationKind: "CREATE",
    targetObjectId: "GRD-OBJ-DECISION",
    outputFieldIds: [
      "GRD-DECISION-F-SUBMISSION-REF",
      "GRD-DECISION-F-SUBMISSION-VERSION",
      "GRD-DECISION-F-ITEM-REF",
      "GRD-DECISION-F-ITEM-VERSION",
      "GRD-DECISION-F-RUBRIC-REF",
      "GRD-DECISION-F-RUBRIC-VERSION",
      "GRD-DECISION-F-CAPABILITY-RULE-REF",
      "GRD-DECISION-F-CAPABILITY-RULE-VERSION",
      "GRD-DECISION-F-DECISION-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: gradingFlowTrigger,
    permissions: systemFlowPermissions,
    successState: "QUEUED",
    failureOutcomes: gradingVersionConflictOutcome,
    successData: "creates a queued decision with immutable submission, item, and Rubric source versions",
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
    failureResults: ["PERMISSION_DENIED", "AI_UNAVAILABLE", "VERSION_CONFLICT"],
    failureOutcomes: {
      AI_UNAVAILABLE: {
        kind: "BOUNDARY",
        expectedState: "PROCESSING",
        expectedPermission: "ALLOW",
        expectedData: "records AI unavailability and preserves the submission for manual grading",
      },
      ...gradingVersionConflictOutcome,
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
    transition: { from: "PROCESSING", to: "ROUTED_REVIEW" },
    failureOutcomes: gradingVersionConflictOutcome,
    successData: "sets AI-SUGGESTION-REVIEW or AUTO-SCORE-CONFIRMATION from the exact capability decision; both remain teacher-confirmed paths",
  }),
  action({
    id: "GRD-ACT-ROUTE-UNSUPPORTED",
    label: "Route Unsupported Combination to Manual Grading",
    targetObjectId: "GRD-OBJ-DECISION",
    outputFieldIds: ["GRD-DECISION-F-ROUTE", "GRD-DECISION-F-DECISION-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: gradingFlowTrigger,
    permissions: systemFlowPermissions,
    transition: { from: "QUEUED", to: "ROUTED_MANUAL" },
    failureOutcomes: gradingVersionConflictOutcome,
    successData: "sets MANUAL-GRADING or MANUAL-TRANSCRIPTION-THEN-GRADING from the explicit unsupported decision",
  }),
  action({
    id: "GRD-ACT-ROUTE-AI-UNAVAILABLE",
    label: "Route AI-unavailable Decision to Manual Fallback",
    targetObjectId: "GRD-OBJ-DECISION",
    outputFieldIds: ["GRD-DECISION-F-ROUTE", "GRD-DECISION-F-DECISION-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: gradingFlowTrigger,
    permissions: systemFlowPermissions,
    transition: { from: "PROCESSING", to: "ROUTED_MANUAL" },
    failureOutcomes: gradingVersionConflictOutcome,
    successData: "sets the explicit MANUAL fallback route after an AI-unavailable processing outcome",
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
    transition: { from: "ROUTED_REVIEW", to: "ROUTED_REVIEW" },
    failureOutcomes: gradingVersionConflictOutcome,
  }),
  action({
    id: "GRD-ACT-ACCEPT-SUGGESTION",
    label: "Accept Suggested Score",
    targetObjectId: "GRD-OBJ-DECISION",
    inputFieldIds: ["GRD-DECISION-F-SUGGESTED-SCORE", "GRD-DECISION-F-TEACHER-FEEDBACK"],
    outputFieldIds: [
      "GRD-DECISION-F-OFFICIAL-SCORE",
      "GRD-DECISION-F-TEACHER-FEEDBACK",
      "GRD-DECISION-F-DECISION-VERSION",
    ],
    risk: RISK.HIGH,
    permissions: gradingTeacherPermissions,
    transition: { from: "ROUTED_REVIEW", to: "TEACHER_CONFIRMED" },
    failureResults: ["PERMISSION_DENIED", "SUBJECTIVE_REVIEW_REQUIRED", "STALE_INPUT_VERSION", "VERSION_CONFLICT"],
    failureOutcomes: gradingVersionConflictOutcome,
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
    outputFieldIds: [
      "GRD-DECISION-F-OFFICIAL-SCORE",
      "GRD-DECISION-F-TEACHER-FEEDBACK",
      "GRD-DECISION-F-DECISION-VERSION",
    ],
    risk: RISK.HIGH,
    permissions: gradingTeacherPermissions,
    transition: { from: "ROUTED_REVIEW", to: "TEACHER_CONFIRMED" },
    failureResults: ["PERMISSION_DENIED", "CORRECTION_REASON_REQUIRED", "STALE_INPUT_VERSION", "VERSION_CONFLICT"],
    failureOutcomes: gradingVersionConflictOutcome,
  }),
  action({
    id: "GRD-ACT-MANUAL-GRADE",
    label: "Grade Submission Manually",
    targetObjectId: "GRD-OBJ-DECISION",
    inputFieldIds: [
      "GRD-DECISION-F-OFFICIAL-SCORE",
      "GRD-DECISION-F-TEACHER-FEEDBACK",
    ],
    outputFieldIds: [
      "GRD-DECISION-F-OFFICIAL-SCORE",
      "GRD-DECISION-F-TEACHER-FEEDBACK",
      "GRD-DECISION-F-DECISION-VERSION",
    ],
    risk: RISK.HIGH,
    permissions: gradingTeacherPermissions,
    transition: { from: "ROUTED_MANUAL", to: "TEACHER_CONFIRMED" },
    failureResults: ["PERMISSION_DENIED", "MISSING_REQUIRED_EVIDENCE", "STALE_INPUT_VERSION", "VERSION_CONFLICT"],
    failureOutcomes: gradingVersionConflictOutcome,
  }),
  action({
    id: "GRD-ACT-BATCH-CONFIRM",
    label: "Batch Confirm Eligible Scores",
    targetObjectId: "GRD-OBJ-DECISION",
    outputFieldIds: ["GRD-DECISION-F-OFFICIAL-SCORE", "GRD-DECISION-F-DECISION-VERSION"],
    risk: RISK.HIGH,
    permissions: gradingTeacherPermissions,
    transition: { from: "ROUTED_REVIEW", to: "TEACHER_CONFIRMED" },
    failureResults: ["PERMISSION_DENIED", "SUBJECTIVE_ITEMS_INELIGIBLE", "LOW_CONFIDENCE_INELIGIBLE", "VERSION_CONFLICT"],
    failureOutcomes: gradingVersionConflictOutcome,
  }),
  action({
    id: "GRD-ACT-OPEN-CONFIRMED-REVISION",
    label: "Open Confirmed Decision Revision",
    targetObjectId: "GRD-OBJ-DECISION",
    inputFieldIds: ["GRD-DECISION-F-CORRECTION-REASON"],
    outputFieldIds: [
      "GRD-DECISION-F-PRIOR-DECISION-VERSION",
      "GRD-DECISION-F-DECISION-VERSION",
    ],
    risk: RISK.HIGH,
    permissions: gradingTeacherPermissions,
    transition: { from: "TEACHER_CONFIRMED", to: "REVISION_PENDING" },
    failureResults: ["PERMISSION_DENIED", "CORRECTION_REASON_REQUIRED", "VERSION_CONFLICT"],
    failureOutcomes: gradingVersionConflictOutcome,
    successData: "creates a revision-pending decision version that retains the immutable prior confirmed decision version and correction reason",
  }),
  action({
    id: "GRD-ACT-CONFIRM-REVISION",
    label: "Confirm Revised Decision",
    targetObjectId: "GRD-OBJ-DECISION",
    inputFieldIds: [
      "GRD-DECISION-F-OFFICIAL-SCORE",
      "GRD-DECISION-F-TEACHER-FEEDBACK",
      "GRD-DECISION-F-CORRECTION-REASON",
    ],
    outputFieldIds: ["GRD-DECISION-F-DECISION-VERSION"],
    risk: RISK.HIGH,
    permissions: gradingTeacherPermissions,
    transition: { from: "REVISION_PENDING", to: "TEACHER_CONFIRMED" },
    failureResults: ["PERMISSION_DENIED", "CORRECTION_REASON_REQUIRED", "STALE_INPUT_VERSION", "VERSION_CONFLICT"],
    failureOutcomes: gradingVersionConflictOutcome,
    successData: "creates a new decision version after corresponding subject-teacher confirmation and retains the prior confirmed version in history",
  }),
  action({
    id: "GRD-ACT-RESOLVE-VERSION-CONFLICT",
    label: "Resolve Grading Version Conflict",
    targetObjectId: "GRD-OBJ-DECISION",
    inputFieldIds: ["GRD-DECISION-F-CORRECTION-REASON"],
    outputFieldIds: [
      "GRD-DECISION-F-SUBMISSION-REF",
      "GRD-DECISION-F-SUBMISSION-VERSION",
      "GRD-DECISION-F-ITEM-REF",
      "GRD-DECISION-F-ITEM-VERSION",
      "GRD-DECISION-F-RUBRIC-REF",
      "GRD-DECISION-F-RUBRIC-VERSION",
      "GRD-DECISION-F-CAPABILITY-RULE-REF",
      "GRD-DECISION-F-CAPABILITY-RULE-VERSION",
      "GRD-DECISION-F-DECISION-VERSION",
    ],
    risk: RISK.HIGH,
    permissions: gradingTeacherPermissions,
    transition: { from: "CONFLICT", to: "QUEUED" },
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STILL_STALE"],
    successData: "refreshes immutable source lineage into a new queued decision version without confirming a score",
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
      ["QUEUED", "PROCESSING", "ROUTED_REVIEW", "ROUTED_MANUAL", "CONFLICT", "REVISION_PENDING", "TEACHER_CONFIRMED"],
      gradingDecisionFields,
      {
        sensitivityId: "S3",
        lineageBindings: [
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
        ],
      },
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
      gradingActions
        .filter(({ action: actionValue }) => actionValue.executionMode === USER_TASK)
        .map(({ action: actionValue }) => actionValue.id),
    ),
  ],
});

const publicationBatchFields = [
  field("PUB-BATCH-F-SELECTED-STUDENT-IDS", "Selected Student Scope", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-010" },
  }),
  field("PUB-BATCH-F-VISIBILITY-POLICY", "Result Visibility Policy", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-040" },
  }),
  field("PUB-BATCH-F-ANSWER-VISIBLE-AT", "Configured Answer Visible Time", {
    dataType: "DATETIME",
  }),
  field("PUB-BATCH-F-FEEDBACK-VISIBLE-AT", "Configured Feedback Visible Time", {
    dataType: "DATETIME",
  }),
  field("PUB-BATCH-F-NOTIFICATION-POLICY", "Result Notification Policy", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-012" },
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

const publicationPreviewFields = [
  field("PUB-PREVIEW-F-BATCH-REF", "Publication Batch Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PUB-OBJ-BATCH" },
    mutability: "IMMUTABLE",
  }),
  field("PUB-PREVIEW-F-STUDENT-REF", "Selected Student Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-STUDENT" },
    mutability: "IMMUTABLE",
  }),
  field("PUB-PREVIEW-F-DECISION-REF", "Confirmed Decision Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "GRD-OBJ-DECISION" },
    mutability: "IMMUTABLE",
  }),
  field("PUB-PREVIEW-F-ELIGIBILITY", "Preview Publication Eligibility", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-009" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PUB-PREVIEW-F-BLOCKING-CODES", "Preview Publication Blocking Codes", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PUB-PREVIEW-F-ANSWER-VISIBLE-AT", "Resolved Answer Visible Time", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PUB-PREVIEW-F-FEEDBACK-VISIBLE-AT", "Resolved Feedback Visible Time", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PUB-PREVIEW-F-NOTIFICATION-PREVIEW", "Resolved Notification Preview", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
];

const publishedResultFields = [
  field("PUB-RESULT-F-STUDENT-REF", "Selected Student Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-STUDENT" },
    mutability: "IMMUTABLE",
  }),
  field("PUB-RESULT-F-SOURCE-DECISION-REF", "Source Decision Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "GRD-OBJ-DECISION" },
    mutability: "IMMUTABLE",
  }),
  field("PUB-RESULT-F-DECISION-VERSION", "Confirmed Decision Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("PUB-RESULT-F-CORRECTION-DECISION-REF", "Correction Decision Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "GRD-OBJ-DECISION" },
    mutability: "SYSTEM_MANAGED",
    required: "required when correcting a published result",
  }),
  field("PUB-RESULT-F-NEW-DECISION-VERSION", "New Confirmed Decision Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: "required when correcting a published result",
  }),
  field("PUB-RESULT-F-ANSWER", "Published Answer", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("PUB-RESULT-F-SCORE", "Published Score", {
    dataType: "DECIMAL",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("PUB-RESULT-F-FEEDBACK", "Published Feedback", {
    dataType: "TEXT",
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
  field("PUB-RESULT-F-ANSWER-VISIBLE-AT", "Answer Visible Time", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PUB-RESULT-F-FEEDBACK-VISIBLE-AT", "Feedback Visible Time", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
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
  field("PUB-RESULT-F-INVALIDATION-VERSION", "Dependent Invalidation Version", {
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
    operationKind: "CREATE",
    targetObjectId: "PUB-OBJ-PREVIEW",
    inputFieldIds: [
      "PUB-PREVIEW-F-BATCH-REF",
      "PUB-PREVIEW-F-STUDENT-REF",
      "PUB-PREVIEW-F-DECISION-REF",
    ],
    outputFieldIds: [
      "PUB-PREVIEW-F-ELIGIBILITY",
      "PUB-PREVIEW-F-BLOCKING-CODES",
      "PUB-PREVIEW-F-ANSWER-VISIBLE-AT",
      "PUB-PREVIEW-F-FEEDBACK-VISIBLE-AT",
      "PUB-PREVIEW-F-NOTIFICATION-PREVIEW",
    ],
    permissions: publicationTeacherPermissions,
    successState: "GENERATED",
    failureResults: ["PERMISSION_DENIED", "NOT_FOUND", "VISIBILITY_POLICY_BLOCKED"],
    failureOutcomes: {
      VISIBILITY_POLICY_BLOCKED: {
        kind: "BOUNDARY",
        expectedPermission: "ALLOW",
        expectedData: "returns the resolved visibility conflict and blocking codes without creating a publishable result",
      },
    },
    successData: "returns student-level eligibility, blocking codes, visibility times, and notification preview without publication",
  }),
  action({
    id: "PUB-ACT-PREPARE-BATCH",
    label: "Prepare Result Publication Batch",
    targetObjectId: "PUB-OBJ-BATCH",
    inputFieldIds: [
      "PUB-BATCH-F-SELECTED-STUDENT-IDS",
      "PUB-BATCH-F-VISIBILITY-POLICY",
      "PUB-BATCH-F-ANSWER-VISIBLE-AT",
      "PUB-BATCH-F-FEEDBACK-VISIBLE-AT",
      "PUB-BATCH-F-NOTIFICATION-POLICY",
    ],
    outputFieldIds: [
      "PUB-BATCH-F-BATCH-VERSION",
      "PUB-BATCH-F-OBJECT-RESULTS",
      "PUB-BATCH-F-STATUS",
    ],
    risk: RISK.HIGH,
    permissions: publicationTeacherPermissions,
    transition: { from: "DRAFT", to: "READY" },
    failureResults: ["PERMISSION_DENIED", "UNCONFIRMED_SUBJECTIVE_SCORE", "VISIBILITY_POLICY_BLOCKED", "VERSION_CONFLICT"],
    successData: "records object-level eligibility and blocking codes for every selected student before publication starts",
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
    transition: { from: "READY", to: "PUBLISHING" },
    failureResults: [
      "PERMISSION_DENIED",
      "UNCONFIRMED_SUBJECTIVE_SCORE",
      "VISIBILITY_POLICY_BLOCKED",
      "VERSION_CONFLICT",
    ],
    idempotencyKey: "PUB-ACT-PUBLISH-SELECTED:school:assignment:decision-versions:selected-student-set:request-id",
  }),
  action({
    id: "PUB-ACT-MATERIALIZE-RESULT",
    label: "Materialize Student Result Version",
    operationKind: "CREATE",
    targetObjectId: "PUB-OBJ-RESULT",
    outputFieldIds: [
      "PUB-RESULT-F-STUDENT-REF",
      "PUB-RESULT-F-SOURCE-DECISION-REF",
      "PUB-RESULT-F-DECISION-VERSION",
      "PUB-RESULT-F-ANSWER",
      "PUB-RESULT-F-SCORE",
      "PUB-RESULT-F-FEEDBACK",
      "PUB-RESULT-F-ELIGIBILITY",
      "PUB-RESULT-F-BLOCKING-CODES",
      "PUB-RESULT-F-ANSWER-VISIBLE-AT",
      "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
      "PUB-RESULT-F-NOTIFICATION-STATUS",
      "PUB-RESULT-F-RESULT-VERSION",
    ],
    risk: RISK.HIGH,
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-008"] },
    permissions: systemFlowPermissions,
    successState: "READY",
    failureResults: ["PERMISSION_DENIED", "UNCONFIRMED_SUBJECTIVE_SCORE", "VISIBILITY_POLICY_BLOCKED", "VERSION_CONFLICT"],
    successData: "creates the first ready per-student result from the immutable confirmed decision and resolved batch publication configuration",
  }),
  action({
    id: "PUB-ACT-PUBLISH-RESULT",
    label: "Publish Student Result Version",
    targetObjectId: "PUB-OBJ-RESULT",
    inputFieldIds: [
      "PUB-RESULT-F-ELIGIBILITY",
      "PUB-RESULT-F-BLOCKING-CODES",
      "PUB-RESULT-F-ANSWER-VISIBLE-AT",
      "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
      "PUB-RESULT-F-NOTIFICATION-STATUS",
    ],
    outputFieldIds: [
      "PUB-RESULT-F-RESULT-VERSION",
      "PUB-RESULT-F-NOTIFICATION-STATUS",
    ],
    risk: RISK.HIGH,
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-008"] },
    permissions: systemFlowPermissions,
    transition: { from: "READY", to: "PUBLISHED" },
    failureResults: ["PERMISSION_DENIED", "OBJECT_PUBLICATION_FAILED", "VISIBILITY_POLICY_BLOCKED", "VERSION_CONFLICT"],
    failureOutcomes: {
      OBJECT_PUBLICATION_FAILED: {
        kind: "BOUNDARY",
        expectedState: "PUBLISH_FAILED",
        expectedPermission: "ALLOW",
        expectedData: "records the failed student result independently without changing successful student results",
      },
    },
  }),
  action({
    id: "PUB-ACT-FINALIZE-BATCH",
    label: "Finalize Result Publication Batch",
    targetObjectId: "PUB-OBJ-BATCH",
    outputFieldIds: [
      "PUB-BATCH-F-BATCH-VERSION",
      "PUB-BATCH-F-OBJECT-RESULTS",
      "PUB-BATCH-F-STATUS",
    ],
    risk: RISK.HIGH,
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-008"] },
    permissions: systemFlowPermissions,
    transition: { from: "PUBLISHING", to: "PUBLISHED" },
    failureResults: ["PERMISSION_DENIED", "OBJECT_PUBLICATION_FAILED", "VERSION_CONFLICT"],
    failureOutcomes: {
      OBJECT_PUBLICATION_FAILED: {
        kind: "BOUNDARY",
        expectedState: "PARTIAL_FAILED",
        expectedPermission: "ALLOW",
        expectedData: "finalizes successful results while retaining object-level failed results for retry",
      },
    },
  }),
  action({
    id: "PUB-ACT-RETRY-FAILED",
    label: "Retry Failed Result Publication",
    targetObjectId: "PUB-OBJ-RESULT",
    outputFieldIds: [
      "PUB-RESULT-F-RESULT-VERSION",
      "PUB-RESULT-F-NOTIFICATION-STATUS",
    ],
    risk: RISK.HIGH,
    permissions: publicationTeacherPermissions,
    transition: { from: "PUBLISH_FAILED", to: "PUBLISHED" },
    failureResults: [
      "PERMISSION_DENIED",
      "UNCONFIRMED_SUBJECTIVE_SCORE",
      "VISIBILITY_POLICY_BLOCKED",
      "OBJECT_PUBLICATION_FAILED",
      "VERSION_CONFLICT",
    ],
  }),
  action({
    id: "PUB-ACT-RECONCILE-BATCH",
    label: "Reconcile Retried Result Publication Batch",
    targetObjectId: "PUB-OBJ-BATCH",
    outputFieldIds: [
      "PUB-BATCH-F-BATCH-VERSION",
      "PUB-BATCH-F-OBJECT-RESULTS",
      "PUB-BATCH-F-STATUS",
    ],
    risk: RISK.HIGH,
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-008"] },
    permissions: systemFlowPermissions,
    transition: { from: "PARTIAL_FAILED", to: "PUBLISHED" },
    failureResults: ["PERMISSION_DENIED", "OBJECT_PUBLICATION_FAILED", "VERSION_CONFLICT"],
    failureOutcomes: {
      OBJECT_PUBLICATION_FAILED: {
        kind: "BOUNDARY",
        expectedState: "PARTIAL_FAILED",
        expectedPermission: "ALLOW",
        expectedData: "keeps the batch partial while any selected student result still has an object-level publication failure",
      },
    },
  }),
  action({
    id: "PUB-ACT-VIEW-RESULT",
    label: "View My Published Result",
    targetObjectId: "PUB-OBJ-RESULT",
    inputFieldIds: ["PUB-RESULT-F-STUDENT-REF"],
    outputFieldIds: [
      "PUB-RESULT-F-ANSWER",
      "PUB-RESULT-F-SCORE",
      "PUB-RESULT-F-FEEDBACK",
    ],
    writes: false,
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student reads only the student's own published result after each configured visibility time"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default access to a student's answer, score, or feedback"),
    ],
    failureResults: [
      "PERMISSION_DENIED",
      "NOT_FOUND",
      "RESULT_NOT_PUBLISHED",
      "ANSWER_NOT_VISIBLE",
      "FEEDBACK_NOT_VISIBLE",
    ],
    failureOutcomes: {
      RESULT_NOT_PUBLISHED: {
        expectedData: "returns no result until the owned result version reaches PUBLISHED",
      },
      ANSWER_NOT_VISIBLE: {
        kind: "BOUNDARY",
        expectedPermission: "ALLOW",
        expectedData: "returns the visible score fields but withholds the answer until answerVisibleAt",
      },
      FEEDBACK_NOT_VISIBLE: {
        kind: "BOUNDARY",
        expectedPermission: "ALLOW",
        expectedData: "returns the visible score fields but withholds feedback until feedbackVisibleAt",
      },
    },
    successData: "returns only the student's own published answer, score, and feedback fields whose time gates have opened",
  }),
  action({
    id: "PUB-ACT-CORRECT-RESULT",
    label: "Correct Published Result",
    targetObjectId: "PUB-OBJ-RESULT",
    inputFieldIds: [
      "PUB-RESULT-F-CORRECTION-DECISION-REF",
      "PUB-RESULT-F-NEW-DECISION-VERSION",
      "PUB-RESULT-F-PUBLIC-CORRECTION-NOTE",
    ],
    outputFieldIds: [
      "PUB-RESULT-F-CORRECTION-DECISION-REF",
      "PUB-RESULT-F-NEW-DECISION-VERSION",
      "PUB-RESULT-F-RESULT-VERSION",
      "PUB-RESULT-F-CORRECTION-VERSION",
      "PUB-RESULT-F-INVALIDATION-VERSION",
      "PUB-RESULT-F-NOTIFICATION-STATUS",
      "PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS",
    ],
    risk: RISK.HIGH,
    permissions: publicationTeacherPermissions,
    transition: { from: "PUBLISHED", to: "INVALIDATED" },
    failureResults: ["PERMISSION_DENIED", "CORRECTION_NOTE_REQUIRED", "STALE_DECISION_VERSION", "VERSION_CONFLICT"],
    successData: "references the new confirmed decision version, creates new result and correction versions, and records a dependent invalidation version without rewriting the old result",
  }),
  action({
    id: "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
    label: "Reconfirm Invalidated Explanation",
    targetObjectId: "PUB-OBJ-RESULT",
    inputFieldIds: ["PUB-RESULT-F-PUBLIC-CORRECTION-NOTE"],
    outputFieldIds: [
      "PUB-RESULT-F-RESULT-VERSION",
      "PUB-RESULT-F-INVALIDATION-VERSION",
      "PUB-RESULT-F-NOTIFICATION-STATUS",
      "PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS",
    ],
    risk: RISK.HIGH,
    permissions: publicationTeacherPermissions,
    transition: { from: "INVALIDATED", to: "PUBLISHED" },
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
      "PUB-OBJ-PREVIEW",
      "Transient Student Publication Preview",
      {
        dataSubject: "STUDENT_RESULT_PUBLICATION_PREVIEW",
        controlSubject: "SCHOOL",
        producerRef: "SYSTEM",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "ROLE-ACADEMIC",
      },
      ["GENERATED"],
      publicationPreviewFields,
      { lifecyclePolicyId: "LIFE-005", sensitivityId: "S3" },
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
      ["READY", "PUBLISHED", "PUBLISH_FAILED", "INVALIDATED"],
      publishedResultFields,
      {
        sensitivityId: "S3",
        lineageBindings: [
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
        ],
        readPolicies: [{
          actionId: "PUB-ACT-VIEW-RESULT",
          subject: { roleRef: "ROLE-STUDENT" },
          scope: { kind: "OWN_RECORD", subjectFieldId: "PUB-RESULT-F-STUDENT-REF" },
          requiredState: "PUBLISHED",
          timeGates: [
            {
              visibleAtFieldId: "PUB-RESULT-F-ANSWER-VISIBLE-AT",
              protectedFieldIds: ["PUB-RESULT-F-ANSWER"],
            },
            {
              visibleAtFieldId: "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
              protectedFieldIds: ["PUB-RESULT-F-FEEDBACK"],
            },
          ],
        }],
      },
    ),
  ],
  relationships: [
    {
      id: "PUB-REL-BATCH-RESULT",
      fromObjectId: "PUB-OBJ-BATCH",
      toObjectId: "PUB-OBJ-RESULT",
      type: "CONTAINS",
      cardinality: "ONE_TO_MANY",
      ownershipScope: "SAME_SUBJECT",
      onSourceInvalidation: "retain published student results and invalidate only failed or stale unpublished derivations",
    },
    {
      id: "PUB-REL-PREVIEW-BATCH",
      fromObjectId: "PUB-OBJ-PREVIEW",
      toObjectId: "PUB-OBJ-BATCH",
      type: "DERIVED_FROM",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SUBJECT",
      onSourceInvalidation: "expire the transient preview when its referenced batch configuration or selected scope changes",
    },
  ],
  actions: publicationActions,
  pages: [
    page(
      "PUB-PAGE-RELEASE",
      "Result Release Workspace",
      ["PUB-OBJ-BATCH", "PUB-OBJ-PREVIEW", "PUB-OBJ-RESULT"],
      [...publicationBatchFields, ...publicationPreviewFields, ...publishedResultFields]
        .map(({ id }) => id),
      [
        "PUB-ACT-PREVIEW",
        "PUB-ACT-PREPARE-BATCH",
        "PUB-ACT-PUBLISH-SELECTED",
        "PUB-ACT-RETRY-FAILED",
      ],
    ),
    page(
      "PUB-PAGE-CORRECTION",
      "Published Result Correction Workspace",
      ["PUB-OBJ-RESULT"],
      publishedResultFields.map(({ id }) => id),
      ["PUB-ACT-CORRECT-RESULT", "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION"],
    ),
    page(
      "PUB-PAGE-STUDENT-RESULT",
      "Student Published Result",
      ["PUB-OBJ-RESULT"],
      [
        "PUB-RESULT-F-STUDENT-REF",
        "PUB-RESULT-F-ANSWER",
        "PUB-RESULT-F-SCORE",
        "PUB-RESULT-F-FEEDBACK",
        "PUB-RESULT-F-ANSWER-VISIBLE-AT",
        "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
        "PUB-RESULT-F-RESULT-VERSION",
      ],
      ["PUB-ACT-VIEW-RESULT"],
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
  optionSet("OPT-TL-011", "gradingRoute", "批改路由", [
    ["AI-SUGGESTION-REVIEW", "AI建议后教师复核"],
    ["AUTO-SCORE-CONFIRMATION", "自动建议分后教师确认"],
    ["MANUAL-GRADING", "人工批改"],
    ["MANUAL-TRANSCRIPTION-THEN-GRADING", "人工录入后批改"],
  ]),
  optionSet("OPT-TL-012", "publicationNotificationPolicy", "成绩发布通知策略", [
    ["NONE", "不通知"],
    ["ON-PUBLISH", "发布时通知"],
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
      { order: 1, actionId: "HW-ACT-VALIDATE-ITEM", condition: "an item is an initial draft" },
      { order: 2, actionId: "HW-ACT-REVALIDATE-ITEM", condition: "an item is a revision draft" },
      { order: 3, actionId: "HW-ACT-VALIDATE", condition: "the assignment is an initial draft" },
      { order: 4, actionId: "HW-ACT-REVALIDATE-REVISION", condition: "the assignment is a revision draft" },
      { order: 5, actionId: "HW-ACT-PREVIEW" },
      { order: 6, actionId: "HW-ACT-PUBLISH-ITEM", condition: "every included item version is validated" },
      { order: 7, actionId: "HW-ACT-PUBLISH-NOW", condition: "the teacher selects immediate publication" },
      { order: 8, actionId: "HW-ACT-SCHEDULE-PUBLISH", condition: "the teacher selects scheduled publication instead of immediate publication" },
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
    idempotencyKeyParts: {
      identityFieldIds: ["HW-ASSIGNMENT-F-DUE-AT"],
      versionFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION", "HW-ITEM-F-ITEM-VERSION"],
      fanoutFieldId: "HW-ITEM-F-PROMPT",
    },
    failureGranularity: "ASSIGNMENT_OBJECT_VERSION_WITH_NO_PARTIAL_ITEM_PUBLICATION",
    retryPolicy: {
      strategy: "REVALIDATE_STALE_ASSIGNMENT_THEN_RETRY",
      maxAttempts: 3,
      retryableFailureResults: ["VERSION_CONFLICT", "AUDIT_FAILED"],
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
    idempotencyKeyParts: {
      identityFieldIds: ["HW-ASSIGNMENT-F-TITLE"],
      versionFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION", "SUB-DRAFT-F-DRAFT-VERSION"],
      fanoutFieldId: "SUB-DRAFT-F-ANSWER-PAYLOAD",
    },
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
    moduleIds: ["HW-001", "SUB-001", "GRD-001"],
    steps: [
      { order: 1, actionId: "SUB-ACT-HANDOFF-ACCEPTED" },
      { order: 2, actionId: "HW-ACT-RESOLVE-GRADING-SNAPSHOT" },
      { order: 3, actionId: "GRD-ACT-ENQUEUE" },
      { order: 4, actionId: "GRD-ACT-ROUTE-UNSUPPORTED", condition: "the exact combination is excluded from supported capability rules" },
      { order: 5, actionId: "GRD-ACT-PROCESS", condition: "the exact combination has a supported recognition or scoring capability" },
      { order: 6, actionId: "GRD-ACT-ROUTE", condition: "supported processing succeeds and requires teacher review or confirmation" },
      { order: 7, actionId: "GRD-ACT-ROUTE-AI-UNAVAILABLE", condition: "AI processing is unavailable and the decision requires an explicit manual fallback" },
    ],
    sourceDataRefs: [
      {
        objectId: "SUB-OBJ-ATTEMPT",
        fieldId: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
        version: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      },
      {
        objectId: "HW-OBJ-ITEM",
        fieldId: "HW-ITEM-F-ITEM-VERSION",
        version: "HW-ITEM-F-ITEM-VERSION",
      },
      {
        objectId: "HW-OBJ-RUBRIC",
        fieldId: "HW-RUBRIC-F-RUBRIC-VERSION",
        version: "HW-RUBRIC-F-RUBRIC-VERSION",
      },
      {
        objectId: "GRD-OBJ-CAPABILITY-RULE",
        fieldId: "GRD-CAP-F-RULE-ID",
        version: "GRD-CAP-F-RULE-VERSION",
      },
    ],
    targetDataRefs: [
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-SUBMISSION-REF",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-SUBMISSION-VERSION",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-ITEM-REF",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-ITEM-VERSION",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-RUBRIC-REF",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-RUBRIC-VERSION",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-CAPABILITY-RULE-REF",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-CAPABILITY-RULE-VERSION",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
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
    idempotencyKeyParts: {
      identityFieldIds: ["SUB-ATTEMPT-F-SUBMISSION-VERSION"],
      versionFieldIds: [
        "SUB-ATTEMPT-F-SUBMISSION-VERSION",
        "HW-ITEM-F-ITEM-VERSION",
        "HW-RUBRIC-F-RUBRIC-VERSION",
        "GRD-CAP-F-RULE-VERSION",
      ],
      fanoutFieldId: "HW-ITEM-F-ITEM-VERSION",
    },
    failureGranularity: "SUBMISSION_ITEM_OBJECT_WITH_INDEPENDENT_MANUAL_ROUTE",
    retryPolicy: {
      strategy: "RETRY_QUEUE_AND_PROCESSING_WITH_MANUAL_CUTOFF",
      maxAttempts: 3,
      retryableFailureResults: ["AI_UNAVAILABLE", "VERSION_CONFLICT"],
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
    idempotencyKeyParts: {
      identityFieldIds: ["GRD-DECISION-F-SUGGESTED-SCORE"],
      versionFieldIds: ["GRD-DECISION-F-DECISION-VERSION"],
      fanoutFieldId: "GRD-DECISION-F-SUGGESTED-SCORE",
    },
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
      { order: 5, actionId: "PUB-ACT-PREPARE-BATCH", condition: "object-level eligibility and blocking codes are complete" },
      { order: 6, actionId: "PUB-ACT-PUBLISH-SELECTED", condition: "the prepared batch is ready and every subjective score has teacher confirmation" },
      { order: 7, actionId: "PUB-ACT-MATERIALIZE-RESULT", condition: "create one ready result for each eligible selected student" },
      { order: 8, actionId: "PUB-ACT-PUBLISH-RESULT", condition: "the result is ready and its configured visibility policy permits publication" },
      { order: 9, actionId: "PUB-ACT-FINALIZE-BATCH", condition: "all student result attempts have an object-level outcome" },
      { order: 10, actionId: "PUB-ACT-RETRY-FAILED", condition: "only object-level failed student results are retried" },
      { order: 11, actionId: "PUB-ACT-RECONCILE-BATCH", condition: "all retried student results now have a terminal object-level outcome" },
    ],
    sourceDataRefs: [
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-OFFICIAL-SCORE",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "PUB-OBJ-BATCH",
        fieldId: "PUB-BATCH-F-SELECTED-STUDENT-IDS",
        version: "PUB-BATCH-F-BATCH-VERSION",
      },
      {
        objectId: "PUB-OBJ-BATCH",
        fieldId: "PUB-BATCH-F-VISIBILITY-POLICY",
        version: "PUB-BATCH-F-BATCH-VERSION",
      },
      {
        objectId: "PUB-OBJ-BATCH",
        fieldId: "PUB-BATCH-F-ANSWER-VISIBLE-AT",
        version: "PUB-BATCH-F-BATCH-VERSION",
      },
      {
        objectId: "PUB-OBJ-BATCH",
        fieldId: "PUB-BATCH-F-FEEDBACK-VISIBLE-AT",
        version: "PUB-BATCH-F-BATCH-VERSION",
      },
      {
        objectId: "PUB-OBJ-BATCH",
        fieldId: "PUB-BATCH-F-NOTIFICATION-POLICY",
        version: "PUB-BATCH-F-BATCH-VERSION",
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
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-STUDENT-REF",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-SOURCE-DECISION-REF",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-DECISION-VERSION",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-ANSWER",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-SCORE",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-FEEDBACK",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-ANSWER-VISIBLE-AT",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-NOTIFICATION-STATUS",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
    ],
    idempotencyKeyParts: {
      identityFieldIds: ["GRD-DECISION-F-OFFICIAL-SCORE"],
      versionFieldIds: ["GRD-DECISION-F-DECISION-VERSION", "PUB-BATCH-F-BATCH-VERSION"],
      fanoutFieldId: "PUB-BATCH-F-SELECTED-STUDENT-IDS",
    },
    failureGranularity: "SELECTED_STUDENT_RESULT_OBJECT_WITH_PARTIAL_SUCCESS",
    retryPolicy: {
      strategy: "RETRY_FAILED_STUDENT_RESULTS_ONLY",
      maxAttempts: 5,
      retryableFailureResults: ["OBJECT_PUBLICATION_FAILED", "AUDIT_FAILED"],
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
      { order: 1, actionId: "GRD-ACT-OPEN-CONFIRMED-REVISION", condition: "the corresponding subject teacher records the correction reason against the prior confirmed version" },
      { order: 2, actionId: "GRD-ACT-CONFIRM-REVISION", condition: "the corresponding subject teacher confirms the revised score and feedback into a new decision version" },
      { order: 3, actionId: "PUB-ACT-CORRECT-RESULT", condition: "the correction references the new confirmed decision version" },
      { order: 4, actionId: "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION", condition: "dependent explanations are regenerated and teacher-reconfirmed" },
    ],
    sourceDataRefs: [
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-DECISION-VERSION",
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
        fieldId: "PUB-RESULT-F-CORRECTION-DECISION-REF",
        version: "PUB-RESULT-F-CORRECTION-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-NEW-DECISION-VERSION",
        version: "PUB-RESULT-F-CORRECTION-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-CORRECTION-VERSION",
        version: "PUB-RESULT-F-CORRECTION-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-INVALIDATION-VERSION",
        version: "PUB-RESULT-F-INVALIDATION-VERSION",
      },
    ],
    idempotencyKeyParts: {
      identityFieldIds: ["GRD-DECISION-F-DECISION-VERSION"],
      versionFieldIds: ["GRD-DECISION-F-DECISION-VERSION", "PUB-RESULT-F-RESULT-VERSION"],
      fanoutFieldId: "PUB-RESULT-F-RESULT-VERSION",
    },
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
