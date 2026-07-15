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

function requiredWhen(description, whenStates, whenActionIds) {
  return {
    description,
    whenStates,
    ...(whenActionIds ? { whenActionIds } : {}),
  };
}

function object(
  id,
  label,
  responsibility,
  states,
  fields,
  identityFieldId,
  overrides = {},
) {
  const identityFields = fields.filter(({ id: fieldId, idempotencyRole }) => (
    fieldId === identityFieldId || idempotencyRole === "OBJECT_ID"
  ));
  if (
    typeof identityFieldId !== "string"
    || identityFieldId.trim() === ""
    || identityFields.length !== 1
    || identityFields[0].id !== identityFieldId
  ) {
    throw new Error(`${id} requires one explicitly declared identity field`);
  }
  return {
    id,
    label,
    ...responsibility,
    lifecyclePolicyId: "LIFE-003",
    sensitivityId: "S2",
    states,
    fields: fields.map((fieldValue) => fieldValue.id === identityFieldId ? {
      ...fieldValue,
      dataType: "ID",
      valueSource: { kind: "SYSTEM" },
      mutability: "IMMUTABLE",
      visibility: "AUTHORIZED_SCOPE",
      idempotencyRole: "OBJECT_ID",
    } : fieldValue),
    ...overrides,
  };
}

function actorReference(actorRef) {
  if (actorRef.startsWith("DUTY-")) return { dutyRef: actorRef };
  if (actorRef.startsWith("ROLE-")) return { roleRef: actorRef };
  return { actorRef };
}

function provideInputs(actorRef, ...fieldIds) {
  return fieldIds.map((fieldId) => ({ fieldId, provider: actorReference(actorRef) }));
}

function providePathInputs(stepOrder, actorRef, ...fieldIds) {
  return provideInputs(actorRef, ...fieldIds).map((providedInput) => ({
    stepOrder,
    ...providedInput,
  }));
}

function declareSourceCardinalities(flowDefinitions) {
  return flowDefinitions.map((flowDefinition) => ({
    ...flowDefinition,
    sourceDataRefs: flowDefinition.sourceDataRefs.map((sourceDataRef) => ({
      cardinality: "ONE",
      ...sourceDataRef,
    })),
  }));
}

function permission(effect, actorRef, condition) {
  return { effect, ...actorReference(actorRef), condition };
}

function action({
  id,
  label,
  targetObjectId,
  inputFieldIds = [],
  acceptedInputValues,
  relatedStateGuards,
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
      ...(acceptedInputValues ? { acceptedInputValues } : {}),
      ...(relatedStateGuards ? { relatedStateGuards } : {}),
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
  const readTargetObjectIds = new Set(actionFacts
    .map(({ action: actionValue }) => actionValue)
    .filter(({ operationKind }) => operationKind === "READ")
    .map(({ targetObjectId }) => targetObjectId));
  return defineModule({
    ...module,
    objects: module.objects.map((objectValue) => ({
      ...objectValue,
      readMode: objectValue.readMode
        ?? (readTargetObjectIds.has(objectValue.id) ? "AUTHORIZED" : "NO_DIRECT_READ"),
    })),
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
  field("HW-ASSIGNMENT-F-ID", "Assignment ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_ID",
  }),
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
  field("HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS", "Published Student Fanout Set", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    required: requiredWhen("required when the assignment reaches PUBLISHED", ["PUBLISHED"]),
    idempotencyRole: "FANOUT_SET",
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
    idempotencyRole: "OBJECT_VERSION",
  }),
  field("HW-ASSIGNMENT-F-REVISION-REASON", "Revision Reason", {
    dataType: "TEXT",
    required: requiredWhen("required when revising a published assignment", ["REVISION_DRAFT"], ["HW-ACT-REVISE"]),
  }),
];

const hwItemFields = [
  field("HW-ITEM-F-ID", "Assignment Item ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_ID",
  }),
  field("HW-ITEM-F-ITEM-VERSION", "Item Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
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
    referenceIntegrity: "IDENTITY_ONLY",
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
    idempotencyRole: "OBJECT_ID",
  }),
  field("HW-RUBRIC-F-RUBRIC-VERSION", "Rubric Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_VERSION",
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
    outputFieldIds: ["HW-ASSIGNMENT-F-ID", "HW-ASSIGNMENT-F-PUBLICATION-VERSION"],
    permissions: subjectTeacherPermissions,
    successState: "DRAFT",
  }),
  action({
    id: "HW-ACT-CREATE-ITEM",
    label: "Create Assignment Item",
    operationKind: "CREATE",
    targetObjectId: "HW-OBJ-ITEM",
    inputFieldIds: [...hwItemInputIds, "HW-ITEM-F-RUBRIC-REF"],
    outputFieldIds: ["HW-ITEM-F-ID", "HW-ITEM-F-ITEM-VERSION"],
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
    outputFieldIds: [
      "HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS",
      "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
    ],
    risk: RISK.HIGH,
    permissions: subjectTeacherPermissions,
    transition: { from: "VALIDATED", to: "PUBLISHED" },
  }),
  action({
    id: "HW-ACT-SCHEDULE-PUBLISH",
    label: "Schedule Assignment Publication",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    inputFieldIds: ["HW-ASSIGNMENT-F-OPEN-AT"],
    outputFieldIds: [
      "HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS",
      "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
    ],
    risk: RISK.HIGH,
    permissions: subjectTeacherPermissions,
    transition: { from: "VALIDATED", to: "SCHEDULED" },
  }),
  action({
    id: "HW-ACT-PUBLISH-SCHEDULED",
    label: "Publish Scheduled Assignment at Open Time",
    targetObjectId: "HW-OBJ-ASSIGNMENT",
    inputFieldIds: ["HW-ASSIGNMENT-F-OPEN-AT"],
    outputFieldIds: [
      "HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS",
      "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
    ],
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
      "HW-ASSIGNMENT-F-ID",
    ),
    object(
      "HW-OBJ-ITEM",
      "Assignment Item Version",
      subjectTeacherResponsibility,
      ["DRAFT", "VALIDATED", "PUBLISHED", "REVISION_DRAFT"],
      hwItemFields,
      "HW-ITEM-F-ID",
    ),
    object(
      "HW-OBJ-RUBRIC",
      "Published Rubric Version",
      subjectTeacherResponsibility,
      ["PUBLISHED", "DEPRECATED"],
      hwRubricFields,
      "HW-RUBRIC-F-ID",
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
  field("SUB-DRAFT-F-ID", "Submission Draft ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_ID",
  }),
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
    idempotencyRole: "OBJECT_VERSION",
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
  field("SUB-ATTEMPT-F-ID", "Submission Attempt ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_ID",
  }),
  field("SUB-ATTEMPT-F-DRAFT-VERSION", "Submitted Draft Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("SUB-ATTEMPT-F-SUBMISSION-VERSION", "Submission Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
  }),
  field("SUB-ATTEMPT-F-LATE-FLAG", "Late Submission Flag", {
    dataType: "BOOLEAN",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("SUB-ATTEMPT-F-RESUBMISSION-OF", "Resubmission Relationship", {
    dataType: "ID",
    required: requiredWhen(
      "required for a resubmission and absent for the first accepted submission",
      ["RESUBMITTED"],
      ["SUB-ACT-RESUBMIT"],
    ),
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
      "SUB-ATTEMPT-F-ID",
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
      "SUB-DRAFT-F-ID",
      { sensitivityId: "S3" },
    ),
    object(
      "SUB-OBJ-ATTEMPT",
      "Submission Attempt Version",
      studentWorkResponsibility,
      ["DRAFT", "SUBMITTED", "RESUBMITTED"],
      submissionAttemptFields,
      "SUB-ATTEMPT-F-ID",
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
    idempotencyRole: "OBJECT_ID",
  }),
  field("GRD-CAP-F-RULE-VERSION", "Capability Rule Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_VERSION",
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
  field("GRD-DECISION-F-ID", "Grading Decision ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_ID",
  }),
  field("GRD-DECISION-F-RECOGNIZED-ANSWER", "Recognized Answer", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    required: requiredWhen("required when automated grading processing produces recognition evidence", ["PROCESSING"], ["GRD-ACT-PROCESS"]),
  }),
  field("GRD-DECISION-F-RECOGNIZED-REGION", "Recognized Region", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    required: requiredWhen("required when automated grading processing produces recognition evidence", ["PROCESSING"], ["GRD-ACT-PROCESS"]),
  }),
  field("GRD-DECISION-F-SUBMISSION-REF", "Input Submission Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "SUB-OBJ-ATTEMPT" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_REF",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "GRD-DECISION-F-SUBMISSION-VERSION",
      targetVersionFieldId: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
    },
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
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "GRD-DECISION-F-ITEM-VERSION",
      targetVersionFieldId: "HW-ITEM-F-ITEM-VERSION",
    },
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
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "GRD-DECISION-F-RUBRIC-VERSION",
      targetVersionFieldId: "HW-RUBRIC-F-RUBRIC-VERSION",
    },
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
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "GRD-DECISION-F-CAPABILITY-RULE-VERSION",
      targetVersionFieldId: "GRD-CAP-F-RULE-VERSION",
    },
  }),
  field("GRD-DECISION-F-CAPABILITY-RULE-VERSION", "Capability Rule Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("GRD-DECISION-F-SUGGESTED-SCORE", "Suggested Score", {
    dataType: "DECIMAL",
    valueSource: { kind: "SYSTEM" },
    required: requiredWhen("required when automated grading processing produces a scoring suggestion", ["PROCESSING"], ["GRD-ACT-PROCESS"]),
  }),
  field("GRD-DECISION-F-SCORING-RATIONALE", "Scoring Rationale", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
    required: requiredWhen("required when automated grading processing produces a scoring suggestion", ["PROCESSING"], ["GRD-ACT-PROCESS"]),
  }),
  field("GRD-DECISION-F-CONFIDENCE", "Confidence Status", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-005" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when automated grading processing produces a scoring suggestion", ["PROCESSING"], ["GRD-ACT-PROCESS"]),
  }),
  field("GRD-DECISION-F-LIMITATION", "Limitation Note", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
    required: requiredWhen("required when automated grading processing produces a scoring suggestion", ["PROCESSING"], ["GRD-ACT-PROCESS"]),
  }),
  field("GRD-DECISION-F-OFFICIAL-SCORE", "Teacher Official Score", {
    dataType: "DECIMAL",
    required: requiredWhen("required when the grading decision reaches TEACHER_CONFIRMED", ["TEACHER_CONFIRMED"]),
  }),
  field("GRD-DECISION-F-TEACHER-FEEDBACK", "Teacher Feedback", {
    dataType: "TEXT",
    required: requiredWhen("required when the grading decision reaches TEACHER_CONFIRMED", ["TEACHER_CONFIRMED"]),
  }),
  field("GRD-DECISION-F-CORRECTION-REASON", "Correction Reason", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-006" },
    required: requiredWhen("required when correcting recognition, overriding a score, or revising a confirmed decision", ["ROUTED_REVIEW", "TEACHER_CONFIRMED", "REVISION_PENDING", "QUEUED"], ["GRD-ACT-CORRECT-RECOGNITION", "GRD-ACT-OVERRIDE-SCORE", "GRD-ACT-OPEN-CONFIRMED-REVISION", "GRD-ACT-CONFIRM-REVISION", "GRD-ACT-RESOLVE-VERSION-CONFLICT"]),
  }),
  field("GRD-DECISION-F-DECISION-VERSION", "Decision Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
  }),
  field("GRD-DECISION-F-PRIOR-DECISION-VERSION", "Prior Confirmed Decision Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    required: requiredWhen("required when revising a confirmed decision", ["REVISION_PENDING"], ["GRD-ACT-OPEN-CONFIRMED-REVISION"]),
  }),
  field("GRD-DECISION-F-ROUTE", "Grading Route", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-011" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when the grading decision reaches ROUTED_REVIEW or ROUTED_MANUAL", ["ROUTED_REVIEW", "ROUTED_MANUAL"]),
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
      "GRD-DECISION-F-ID",
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
    inputFieldIds: [
      "GRD-DECISION-F-SUGGESTED-SCORE",
      "GRD-DECISION-F-SCORING-RATIONALE",
    ],
    outputFieldIds: [
      "GRD-DECISION-F-OFFICIAL-SCORE",
      "GRD-DECISION-F-TEACHER-FEEDBACK",
      "GRD-DECISION-F-DECISION-VERSION",
    ],
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
      "GRD-CAP-F-RULE-ID",
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
      "GRD-DECISION-F-ID",
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
  field("PUB-BATCH-F-ID", "Publication Batch ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_ID",
  }),
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
    idempotencyRole: "OBJECT_VERSION",
  }),
  field("PUB-BATCH-F-STUDENT-SCOPE-SNAPSHOT", "Immutable Selected Student Scope", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "FANOUT_SET",
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
  field("PUB-PREVIEW-F-ID", "Publication Preview ID"),
  field("PUB-PREVIEW-F-BATCH-REF", "Publication Batch Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PUB-OBJ-BATCH" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
  }),
  field("PUB-PREVIEW-F-STUDENT-REF", "Selected Student Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-STUDENT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
  }),
  field("PUB-PREVIEW-F-DECISION-REF", "Confirmed Decision Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "GRD-OBJ-DECISION" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
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
  field("PUB-RESULT-F-ID", "Published Result ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_ID",
  }),
  field("PUB-RESULT-F-STUDENT-REF", "Selected Student Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-STUDENT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
  }),
  field("PUB-RESULT-F-SOURCE-DECISION-REF", "Source Decision Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "GRD-OBJ-DECISION" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "PUB-RESULT-F-DECISION-VERSION",
      targetVersionFieldId: "GRD-DECISION-F-DECISION-VERSION",
    },
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
    required: requiredWhen("required when correcting a published result", ["INVALIDATED"]),
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "PUB-RESULT-F-NEW-DECISION-VERSION",
      targetVersionFieldId: "GRD-DECISION-F-DECISION-VERSION",
    },
  }),
  field("PUB-RESULT-F-NEW-DECISION-VERSION", "New Confirmed Decision Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when correcting a published result", ["INVALIDATED"]),
  }),
  field("PUB-RESULT-F-ANSWER", "Published Answer", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    releaseRequirement: {
      readPolicyId: "PUB-RP-STUDENT-RESULT",
      requiredState: "PUBLISHED",
      visibleAtFieldId: "PUB-RESULT-F-ANSWER-VISIBLE-AT",
    },
  }),
  field("PUB-RESULT-F-SCORE", "Published Score", {
    dataType: "DECIMAL",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    releaseRequirement: {
      readPolicyId: "PUB-RP-STUDENT-RESULT",
      requiredState: "PUBLISHED",
      visibleAtFieldId: "PUB-RESULT-F-SCORE-VISIBLE-AT",
    },
  }),
  field("PUB-RESULT-F-FEEDBACK", "Published Feedback", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    releaseRequirement: {
      readPolicyId: "PUB-RP-STUDENT-RESULT",
      requiredState: "PUBLISHED",
      visibleAtFieldId: "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
    },
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
  field("PUB-RESULT-F-SCORE-VISIBLE-AT", "Score Visible Time", {
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
    idempotencyRole: "OBJECT_VERSION",
  }),
  field("PUB-RESULT-F-CORRECTION-VERSION", "Correction Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when a published result is corrected", ["INVALIDATED"]),
  }),
  field("PUB-RESULT-F-INVALIDATION-VERSION", "Dependent Invalidation Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when a published result correction invalidates dependent interpretations", ["INVALIDATED"]),
  }),
  field("PUB-RESULT-F-PUBLIC-CORRECTION-NOTE", "Public Correction Note", {
    dataType: "TEXT",
    required: requiredWhen("required when a published result is corrected", ["INVALIDATED"]),
  }),
  field("PUB-RESULT-F-NOTIFICATION-STATUS", "Notification Status", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-TL-010" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS", "Downstream Invalidation Records", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when a published result correction invalidates dependent interpretations", ["INVALIDATED"]),
  }),
];

const dependencySnapshotFields = [
  field("PUB-DEPENDENCY-SNAPSHOT-F-ID", "Dependency Snapshot ID"),
  field("PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-REF", "Dependency Snapshot Source Result", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PUB-OBJ-RESULT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-VERSION",
      targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
    },
  }),
  field("PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-VERSION", "Dependency Snapshot Source Result Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET", "Resolved Dependency Set", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "FANOUT_SET",
    validation: "zero or more structured records with targetKind, targetRef, and targetVersion; targetKind is EVIDENCE, MASTERY_INTERPRETATION, IMPROVEMENT_CANDIDATE, PLAN_EVALUATION, REPORT_INTERPRETATION, or LEARNING_PATH_EXPLANATION",
  }),
  field("PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION", "Dependency Snapshot Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_VERSION",
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
      "PUB-PREVIEW-F-ID",
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
      "PUB-BATCH-F-STUDENT-SCOPE-SNAPSHOT",
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
      "PUB-RESULT-F-ID",
      "PUB-RESULT-F-STUDENT-REF",
      "PUB-RESULT-F-SOURCE-DECISION-REF",
      "PUB-RESULT-F-DECISION-VERSION",
      "PUB-RESULT-F-ANSWER",
      "PUB-RESULT-F-SCORE",
      "PUB-RESULT-F-FEEDBACK",
      "PUB-RESULT-F-ELIGIBILITY",
      "PUB-RESULT-F-BLOCKING-CODES",
      "PUB-RESULT-F-ANSWER-VISIBLE-AT",
      "PUB-RESULT-F-SCORE-VISIBLE-AT",
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
      "PUB-RESULT-F-SCORE-VISIBLE-AT",
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
      "PUB-RESULT-F-STUDENT-REF",
      "PUB-RESULT-F-ANSWER",
      "PUB-RESULT-F-SCORE",
      "PUB-RESULT-F-FEEDBACK",
      "PUB-RESULT-F-ANSWER-VISIBLE-AT",
      "PUB-RESULT-F-SCORE-VISIBLE-AT",
      "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
      "PUB-RESULT-F-RESULT-VERSION",
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
      "SCORE_NOT_VISIBLE",
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
      SCORE_NOT_VISIBLE: {
        kind: "BOUNDARY",
        expectedPermission: "ALLOW",
        expectedData: "withholds the score until scoreVisibleAt while preserving the owned published result",
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
    id: "PUB-ACT-RESOLVE-DEPENDENCY-SNAPSHOT",
    label: "Resolve Current Result Dependencies",
    operationKind: "CREATE",
    targetObjectId: "PUB-OBJ-DEPENDENCY-SNAPSHOT",
    outputFieldIds: dependencySnapshotFields.map(({ id }) => id),
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-009"] },
    permissions: systemFlowPermissions,
    successState: "RESOLVED",
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "resolves zero or more current dependency records against the exact prior published result ID and version into one immutable versioned snapshot",
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
      "PUB-BATCH-F-ID",
      { sensitivityId: "S3" },
    ),
    object(
      "PUB-OBJ-PREVIEW",
      "Transient Student Publication Preview",
      {
        dataSubject: "STUDENT_RESULT_PUBLICATION_PREVIEW",
        controlSubject: "SCHOOL",
        producerRef: "DUTY-SUBJECT-TEACHER",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "ROLE-ACADEMIC",
      },
      ["GENERATED"],
      publicationPreviewFields,
      "PUB-PREVIEW-F-ID",
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
      "PUB-RESULT-F-ID",
      {
        sensitivityId: "S3",
        readMode: "STUDENT_TIMED_RELEASE",
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
        }],
      },
    ),
    object(
      "PUB-OBJ-DEPENDENCY-SNAPSHOT",
      "Published Result Dependency Snapshot",
      {
        dataSubject: "DERIVED_LEARNING_DEPENDENCY_SNAPSHOT",
        controlSubject: "SCHOOL",
        producerRef: "SYSTEM",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "ROLE-ACADEMIC",
      },
      ["RESOLVED"],
      dependencySnapshotFields,
      "PUB-DEPENDENCY-SNAPSHOT-F-ID",
      {
        sensitivityId: "S3",
        lineageBindings: [{
          refFieldId: "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-REF",
          versionFieldId: "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-VERSION",
          targetObjectId: "PUB-OBJ-RESULT",
          targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
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
    {
      id: "PUB-REL-DEPENDENCY-SNAPSHOT-RESULT",
      fromObjectId: "PUB-OBJ-DEPENDENCY-SNAPSHOT",
      toObjectId: "PUB-OBJ-RESULT",
      type: "DERIVED_FROM",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SUBJECT",
      onSourceInvalidation: "retain the immutable snapshot against its exact prior result version and resolve a new snapshot for a later correction",
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
        "PUB-RESULT-F-SCORE-VISIBLE-AT",
        "PUB-RESULT-F-FEEDBACK-VISIBLE-AT",
        "PUB-RESULT-F-RESULT-VERSION",
      ],
      ["PUB-ACT-VIEW-RESULT"],
    ),
  ],
});

const subjectTeacherWritePermissions = [
  permission(
    "ALLOW",
    "DUTY-SUBJECT-TEACHER",
    "the corresponding subject teacher writes only inside the assigned subject, class, and student scope",
  ),
  permission(
    "DENY",
    "DUTY-HOMEROOM",
    "a homeroom teacher attempts to mutate another subject's score, evidence, plan, correction, or follow-up facts",
  ),
  permission(
    "DENY",
    "ROLE-SCHOOL-ADMIN",
    "a school administrator attempts to read or mutate student learning detail without a separately authorized case",
  ),
  permission(
    "DENY",
    "ROLE-PLATFORM-OPS",
    "platform operations has no default access to student learning detail",
  ),
];

const teacherAndHomeroomReadPermissions = [
  permission(
    "ALLOW",
    "DUTY-SUBJECT-TEACHER",
    "the corresponding subject teacher reads only the assigned subject, class, and student scope",
  ),
  permission(
    "ALLOW",
    "DUTY-HOMEROOM",
    "the homeroom teacher reads the assigned class across subjects for read-only coordination",
  ),
  permission(
    "DENY",
    "ROLE-SCHOOL-ADMIN",
    "a school administrator has no default permission to read student learning detail",
  ),
  permission(
    "DENY",
    "ROLE-PLATFORM-OPS",
    "platform operations has no default permission to read student learning detail",
  ),
];

const scoreViewFields = [
  field("SCO-VIEW-F-ID", "Gradebook View ID"),
  field("SCO-VIEW-F-STUDENT-REF", "Student Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-STUDENT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
  }),
  field("SCO-VIEW-F-RESULT-DATA-ID", "Source Result Data ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("SCO-VIEW-F-RESULT-REF", "Source Result Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PUB-OBJ-RESULT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "SCO-VIEW-F-RESULT-VERSION",
      targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
    },
  }),
  field("SCO-VIEW-F-RESULT-VERSION", "Source Result Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("SCO-VIEW-F-EVIDENCE-DATA-ID", "Source Evidence Data ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("SCO-VIEW-F-EVIDENCE-REF", "Source Evidence Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "INS-OBJ-EVIDENCE" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "SCO-VIEW-F-EVIDENCE-VERSION",
      targetVersionFieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
    },
  }),
  field("SCO-VIEW-F-EVIDENCE-VERSION", "Source Evidence Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("SCO-VIEW-F-PLAN-DATA-ID", "Source Plan Data ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("SCO-VIEW-F-PLAN-REF", "Source Plan Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PLN-OBJ-PLAN" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "SCO-VIEW-F-PLAN-VERSION",
      targetVersionFieldId: "PLN-PLAN-F-PLAN-VERSION",
    },
  }),
  field("SCO-VIEW-F-PLAN-VERSION", "Source Plan Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("SCO-VIEW-F-QUERY-DEFINITION", "Gradebook Query Definition", { dataType: "JSON" }),
  field("SCO-VIEW-F-COLUMN-DEFINITION", "Gradebook Column Definition", { dataType: "JSON" }),
  field("SCO-VIEW-F-SAVED-VIEW-DEFINITION", "Saved Gradebook View Definition", { dataType: "JSON" }),
  field("SCO-VIEW-F-VIEW-VERSION", "Gradebook View Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
  }),
];

const scoreFollowUpFields = [
  field("SCO-FOLLOW-UP-F-ID", "Gradebook Follow-up ID"),
  field("SCO-FOLLOW-UP-F-VIEW-REF", "Gradebook View Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "SCO-OBJ-VIEW" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "SCO-FOLLOW-UP-F-VIEW-VERSION",
      targetVersionFieldId: "SCO-VIEW-F-VIEW-VERSION",
    },
  }),
  field("SCO-FOLLOW-UP-F-VIEW-VERSION", "Gradebook View Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("SCO-FOLLOW-UP-F-ATTENTION-KIND", "Attention Event Kind"),
  field("SCO-FOLLOW-UP-F-NOTE", "Follow-up Note", { dataType: "TEXT" }),
  field("SCO-FOLLOW-UP-F-VERSION", "Follow-up Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
];

const scoreActions = [
  action({
    id: "SCO-ACT-CREATE-VIEW",
    label: "Create a Source-pinned Gradebook View",
    operationKind: "CREATE",
    targetObjectId: "SCO-OBJ-VIEW",
    inputFieldIds: [
      "SCO-VIEW-F-STUDENT-REF",
      "SCO-VIEW-F-RESULT-REF",
      "SCO-VIEW-F-RESULT-VERSION",
      "SCO-VIEW-F-EVIDENCE-REF",
      "SCO-VIEW-F-EVIDENCE-VERSION",
      "SCO-VIEW-F-PLAN-REF",
      "SCO-VIEW-F-PLAN-VERSION",
      "SCO-VIEW-F-QUERY-DEFINITION",
      "SCO-VIEW-F-COLUMN-DEFINITION",
      "SCO-VIEW-F-SAVED-VIEW-DEFINITION",
    ],
    outputFieldIds: [
      "SCO-VIEW-F-ID",
      "SCO-VIEW-F-RESULT-DATA-ID",
      "SCO-VIEW-F-EVIDENCE-DATA-ID",
      "SCO-VIEW-F-PLAN-DATA-ID",
      "SCO-VIEW-F-VIEW-VERSION",
    ],
    permissions: subjectTeacherWritePermissions,
    successState: "ACTIVE",
    successData: "creates only a view definition and version-pinned source links without copying score, evidence, or plan content",
  }),
  action({
    id: "SCO-ACT-READ-GRADEBOOK",
    label: "Read the Authorized Gradebook Projection",
    targetObjectId: "SCO-OBJ-VIEW",
    inputFieldIds: ["SCO-VIEW-F-ID"],
    outputFieldIds: scoreViewFields.map(({ id }) => id),
    writes: false,
    permissions: teacherAndHomeroomReadPermissions,
    successData: "resolves current projection columns through the pinned PUB, INS, and PLN source versions",
  }),
  action({
    id: "SCO-ACT-CREATE-FOLLOW-UP",
    label: "Create a Gradebook Follow-up Record",
    operationKind: "CREATE",
    targetObjectId: "SCO-OBJ-FOLLOW-UP",
    inputFieldIds: [
      "SCO-FOLLOW-UP-F-VIEW-REF",
      "SCO-FOLLOW-UP-F-VIEW-VERSION",
      "SCO-FOLLOW-UP-F-ATTENTION-KIND",
      "SCO-FOLLOW-UP-F-NOTE",
    ],
    outputFieldIds: ["SCO-FOLLOW-UP-F-ID", "SCO-FOLLOW-UP-F-VERSION"],
    permissions: subjectTeacherWritePermissions,
    successState: "OPEN",
  }),
  action({
    id: "SCO-ACT-VIEW-FOLLOW-UP",
    label: "View Gradebook Follow-up Records",
    targetObjectId: "SCO-OBJ-FOLLOW-UP",
    inputFieldIds: ["SCO-FOLLOW-UP-F-ID"],
    outputFieldIds: scoreFollowUpFields.map(({ id }) => id),
    writes: false,
    permissions: teacherAndHomeroomReadPermissions,
  }),
];

const scoreModule = moduleFact({
  id: "SCO-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Source-pinned Gradebook Views",
  objective: "Define authorized score views and follow-up records without owning a second official score, evidence, or plan fact",
  entryConditions: ["published result, evidence, and plan versions are available as independently owned sources"],
  exitConditions: ["every displayed value resolves through its source Data ID, object reference, and pinned version"],
  baselineDecisionIds: ["BASE-003", "BASE-008", "BASE-010"],
  nfrIds: ["NFR-008"],
  objects: [
    object(
      "SCO-OBJ-VIEW",
      "Gradebook Query Column and Saved View Definition",
      {
        dataSubject: "GRADEBOOK_VIEW_DEFINITION",
        controlSubject: "SCHOOL",
        producerRef: "DUTY-SUBJECT-TEACHER",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "DUTY-HOMEROOM",
      },
      ["ACTIVE"],
      scoreViewFields,
      "SCO-VIEW-F-ID",
      {
        sensitivityId: "S3",
        lineageBindings: [
          {
            refFieldId: "SCO-VIEW-F-RESULT-REF",
            versionFieldId: "SCO-VIEW-F-RESULT-VERSION",
            targetObjectId: "PUB-OBJ-RESULT",
            targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
          },
          {
            refFieldId: "SCO-VIEW-F-EVIDENCE-REF",
            versionFieldId: "SCO-VIEW-F-EVIDENCE-VERSION",
            targetObjectId: "INS-OBJ-EVIDENCE",
            targetVersionFieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
          },
          {
            refFieldId: "SCO-VIEW-F-PLAN-REF",
            versionFieldId: "SCO-VIEW-F-PLAN-VERSION",
            targetObjectId: "PLN-OBJ-PLAN",
            targetVersionFieldId: "PLN-PLAN-F-PLAN-VERSION",
          },
        ],
      },
    ),
    object(
      "SCO-OBJ-FOLLOW-UP",
      "Gradebook Follow-up and Attention Record",
      {
        dataSubject: "GRADEBOOK_COORDINATION",
        controlSubject: "SCHOOL",
        producerRef: "DUTY-SUBJECT-TEACHER",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "DUTY-HOMEROOM",
      },
      ["OPEN"],
      scoreFollowUpFields,
      "SCO-FOLLOW-UP-F-ID",
      {
        sensitivityId: "S3",
        lineageBindings: [{
          refFieldId: "SCO-FOLLOW-UP-F-VIEW-REF",
          versionFieldId: "SCO-FOLLOW-UP-F-VIEW-VERSION",
          targetObjectId: "SCO-OBJ-VIEW",
          targetVersionFieldId: "SCO-VIEW-F-VIEW-VERSION",
        }],
      },
    ),
  ],
  relationships: [{
    id: "SCO-REL-FOLLOW-UP-VIEW",
    fromObjectId: "SCO-OBJ-FOLLOW-UP",
    toObjectId: "SCO-OBJ-VIEW",
    type: "REFERENCES",
    cardinality: "MANY_TO_ONE",
    ownershipScope: "SAME_STUDENT",
    onSourceInvalidation: "retain follow-up history and mark the referenced view version stale",
  }],
  actions: scoreActions,
  pages: [
    page(
      "SCO-PAGE-GRADEBOOK",
      "Authorized Gradebook Projection",
      ["SCO-OBJ-VIEW"],
      scoreViewFields.map(({ id }) => id),
      ["SCO-ACT-CREATE-VIEW", "SCO-ACT-READ-GRADEBOOK"],
    ),
    page(
      "SCO-PAGE-FOLLOW-UP",
      "Gradebook Follow-up Workspace",
      ["SCO-OBJ-FOLLOW-UP"],
      scoreFollowUpFields.map(({ id }) => id),
      ["SCO-ACT-CREATE-FOLLOW-UP", "SCO-ACT-VIEW-FOLLOW-UP"],
    ),
  ],
});

const evidenceFields = [
  field("INS-EVIDENCE-F-ID", "Evidence Version ID"),
  field("INS-EVIDENCE-F-STUDENT-REF", "Evidence Student Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-STUDENT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
    idempotencyRole: "OBJECT_REF",
  }),
  field("INS-EVIDENCE-F-SOURCE-DATA-ID", "Evidence Source Data ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("INS-EVIDENCE-F-SOURCE-RESULT-REF", "Source Published Result Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PUB-OBJ-RESULT" },
    mutability: "IMMUTABLE",
    required: requiredWhen("required for evidence derived from a published result", ["CANDIDATE"], ["INS-ACT-CREATE-CANDIDATE"]),
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "INS-EVIDENCE-F-SOURCE-RESULT-VERSION",
      targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
    },
  }),
  field("INS-EVIDENCE-F-SOURCE-RESULT-VERSION", "Source Published Result Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    required: requiredWhen("required for evidence derived from a published result", ["CANDIDATE"], ["INS-ACT-CREATE-CANDIDATE"]),
  }),
  field("INS-EVIDENCE-F-SOURCE-CORRECTION-REF", "Source Correction Attempt Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "CORR-OBJ-ATTEMPT" },
    mutability: "IMMUTABLE",
    required: requiredWhen("required for correction-stage evidence", ["CANDIDATE"], ["INS-ACT-CREATE-CANDIDATE"]),
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "INS-EVIDENCE-F-SOURCE-CORRECTION-VERSION",
      targetVersionFieldId: "CORR-ATTEMPT-F-CORRECTION-VERSION",
    },
  }),
  field("INS-EVIDENCE-F-SOURCE-CORRECTION-VERSION", "Source Correction Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    required: requiredWhen("required for correction-stage evidence", ["CANDIDATE"], ["INS-ACT-CREATE-CANDIDATE"]),
  }),
  field("INS-EVIDENCE-F-EVIDENCE-SOURCE", "Evidence Source", {
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("INS-EVIDENCE-F-STAGE", "Evidence Stage", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-008" },
    mutability: "IMMUTABLE",
  }),
  field("INS-EVIDENCE-F-KNOWLEDGE-POINT-REF", "Knowledge Point Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "CURR-OBJ-KNOWLEDGE-POINT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "INS-EVIDENCE-F-KNOWLEDGE-POINT-VERSION",
      targetVersionFieldId: "CURR-KP-F-ID",
    },
  }),
  field("INS-EVIDENCE-F-KNOWLEDGE-POINT-VERSION", "Knowledge Point Version", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("INS-EVIDENCE-F-RESULT", "Answer Result", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-009" },
    mutability: "SYSTEM_MANAGED",
    releaseRequirement: {
      readPolicyId: "INS-RP-STUDENT-MASTERY",
      requiredState: "STUDENT_VISIBLE",
      visibleAtFieldId: "INS-EVIDENCE-F-STUDENT-VISIBLE-AT",
    },
  }),
  field("INS-EVIDENCE-F-ERROR-TYPE", "Error Type", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-010" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("INS-EVIDENCE-F-WEIGHT", "Evidence Weight", {
    dataType: "DECIMAL",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("INS-EVIDENCE-F-VALIDITY", "Evidence Validity", {
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("INS-EVIDENCE-F-MASTERY-CANDIDATE", "Mastery Interpretation Candidate", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("INS-EVIDENCE-F-MASTERY-INTERPRETATION", "Teacher-confirmed Mastery Interpretation", {
    dataType: "TEXT",
    required: requiredWhen("required when evidence reaches TEACHER_CONFIRMED", ["TEACHER_CONFIRMED"]),
    releaseRequirement: {
      readPolicyId: "INS-RP-STUDENT-MASTERY",
      requiredState: "STUDENT_VISIBLE",
      visibleAtFieldId: "INS-EVIDENCE-F-STUDENT-VISIBLE-AT",
    },
  }),
  field("INS-EVIDENCE-F-TEACHER-CONFIRMATION", "Teacher Confirmation", {
    required: requiredWhen("required when evidence reaches TEACHER_CONFIRMED", ["TEACHER_CONFIRMED"]),
  }),
  field("INS-EVIDENCE-F-STUDENT-VISIBLE-AT", "Student Visible At", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when evidence reaches STUDENT_VISIBLE", ["STUDENT_VISIBLE"]),
  }),
  field("INS-EVIDENCE-F-INVALIDATION-REASON", "Evidence Invalidation Reason", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when evidence becomes stale", ["STALE"]),
  }),
  field("INS-EVIDENCE-F-PRIOR-EVIDENCE-REF", "Prior Evidence Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "INS-OBJ-EVIDENCE" },
    mutability: "IMMUTABLE",
    required: requiredWhen("required when a new evidence version supersedes prior evidence", ["CANDIDATE"], ["INS-ACT-CREATE-CANDIDATE"]),
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "INS-EVIDENCE-F-PRIOR-EVIDENCE-VERSION",
      targetVersionFieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
    },
  }),
  field("INS-EVIDENCE-F-PRIOR-EVIDENCE-VERSION", "Prior Evidence Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    required: requiredWhen("required when a new evidence version supersedes prior evidence", ["CANDIDATE"], ["INS-ACT-CREATE-CANDIDATE"]),
  }),
  field("INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION", "Mastery Interpretation Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("INS-EVIDENCE-F-EVIDENCE-VERSION", "Evidence Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
  }),
];

const evidenceTeacherPermissions = [
  ...subjectTeacherWritePermissions,
  permission("DENY", "AI", "AI may create only an attribution or mastery candidate and cannot confirm or publish the student-visible interpretation"),
];

const evidenceFlowPermissions = [
  permission("ALLOW", "SYSTEM", "the verified correction Flow creates or invalidates only versioned evidence candidates"),
  permission("DENY", "AI", "AI cannot directly confirm evidence or publish a student-visible mastery interpretation"),
  permission("DENY", "CURRENT_ACTOR", "a user cannot invoke an internal evidence candidate or invalidation step directly"),
];

const evidenceActions = [
  action({
    id: "INS-ACT-CREATE-CANDIDATE",
    label: "Create a Correction Evidence Candidate",
    operationKind: "CREATE",
    targetObjectId: "INS-OBJ-EVIDENCE",
    outputFieldIds: [
      "INS-EVIDENCE-F-ID",
      "INS-EVIDENCE-F-STUDENT-REF",
      "INS-EVIDENCE-F-SOURCE-DATA-ID",
      "INS-EVIDENCE-F-SOURCE-RESULT-REF",
      "INS-EVIDENCE-F-SOURCE-RESULT-VERSION",
      "INS-EVIDENCE-F-SOURCE-CORRECTION-REF",
      "INS-EVIDENCE-F-SOURCE-CORRECTION-VERSION",
      "INS-EVIDENCE-F-EVIDENCE-SOURCE",
      "INS-EVIDENCE-F-STAGE",
      "INS-EVIDENCE-F-KNOWLEDGE-POINT-REF",
      "INS-EVIDENCE-F-KNOWLEDGE-POINT-VERSION",
      "INS-EVIDENCE-F-RESULT",
      "INS-EVIDENCE-F-ERROR-TYPE",
      "INS-EVIDENCE-F-WEIGHT",
      "INS-EVIDENCE-F-VALIDITY",
      "INS-EVIDENCE-F-MASTERY-CANDIDATE",
      "INS-EVIDENCE-F-PRIOR-EVIDENCE-REF",
      "INS-EVIDENCE-F-PRIOR-EVIDENCE-VERSION",
      "INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION",
      "INS-EVIDENCE-F-EVIDENCE-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-010"] },
    permissions: evidenceFlowPermissions,
    successState: "CANDIDATE",
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "creates only an attribution and mastery candidate from the confirmed correction version while retaining the prior evidence reference",
  }),
  action({
    id: "INS-ACT-MARK-STALE",
    label: "Mark Prior Evidence and Interpretation Stale",
    targetObjectId: "INS-OBJ-EVIDENCE",
    outputFieldIds: [
      "INS-EVIDENCE-F-VALIDITY",
      "INS-EVIDENCE-F-INVALIDATION-REASON",
      "INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION",
      "INS-EVIDENCE-F-EVIDENCE-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-009", "DF-010"] },
    permissions: evidenceFlowPermissions,
    transition: { from: "STUDENT_VISIBLE", to: "STALE" },
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "creates a stale evidence version with a reason while retaining the prior student-visible evidence and interpretation versions",
  }),
  action({
    id: "INS-ACT-CONFIRM-MASTERY",
    label: "Confirm the Evidence and Mastery Interpretation",
    targetObjectId: "INS-OBJ-EVIDENCE",
    inputFieldIds: [
      "INS-EVIDENCE-F-MASTERY-INTERPRETATION",
      "INS-EVIDENCE-F-TEACHER-CONFIRMATION",
    ],
    outputFieldIds: [
      "INS-EVIDENCE-F-MASTERY-INTERPRETATION",
      "INS-EVIDENCE-F-TEACHER-CONFIRMATION",
      "INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION",
      "INS-EVIDENCE-F-EVIDENCE-VERSION",
    ],
    risk: RISK.HIGH,
    permissions: evidenceTeacherPermissions,
    transition: { from: "CANDIDATE", to: "TEACHER_CONFIRMED" },
    failureResults: ["PERMISSION_DENIED", "STALE_INPUT_VERSION", "VERSION_CONFLICT"],
    successData: "the corresponding subject teacher confirms the evidence interpretation into a new immutable version",
  }),
  action({
    id: "INS-ACT-PUBLISH-INTERPRETATION",
    label: "Publish the Teacher-confirmed Mastery Interpretation",
    targetObjectId: "INS-OBJ-EVIDENCE",
    outputFieldIds: [
      "INS-EVIDENCE-F-STUDENT-VISIBLE-AT",
      "INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION",
      "INS-EVIDENCE-F-EVIDENCE-VERSION",
    ],
    risk: RISK.HIGH,
    permissions: evidenceTeacherPermissions,
    transition: { from: "TEACHER_CONFIRMED", to: "STUDENT_VISIBLE" },
    failureResults: ["PERMISSION_DENIED", "TEACHER_CONFIRMATION_REQUIRED", "VERSION_CONFLICT"],
  }),
  action({
    id: "INS-ACT-READ-CONFIRMED-EVIDENCE",
    label: "Read Confirmed Evidence for Authorized Coordination",
    targetObjectId: "INS-OBJ-EVIDENCE",
    inputFieldIds: ["INS-EVIDENCE-F-ID"],
    outputFieldIds: [
      "INS-EVIDENCE-F-ID",
      "INS-EVIDENCE-F-STUDENT-REF",
      "INS-EVIDENCE-F-STAGE",
      "INS-EVIDENCE-F-KNOWLEDGE-POINT-REF",
      "INS-EVIDENCE-F-KNOWLEDGE-POINT-VERSION",
      "INS-EVIDENCE-F-RESULT",
      "INS-EVIDENCE-F-ERROR-TYPE",
      "INS-EVIDENCE-F-WEIGHT",
      "INS-EVIDENCE-F-VALIDITY",
      "INS-EVIDENCE-F-TEACHER-CONFIRMATION",
      "INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION",
      "INS-EVIDENCE-F-EVIDENCE-VERSION",
    ],
    writes: false,
    permissions: teacherAndHomeroomReadPermissions,
  }),
  action({
    id: "INS-ACT-VIEW-MASTERY",
    label: "View My Teacher-confirmed Mastery Interpretation",
    targetObjectId: "INS-OBJ-EVIDENCE",
    inputFieldIds: ["INS-EVIDENCE-F-STUDENT-REF"],
    outputFieldIds: [
      "INS-EVIDENCE-F-STUDENT-REF",
      "INS-EVIDENCE-F-RESULT",
      "INS-EVIDENCE-F-MASTERY-INTERPRETATION",
      "INS-EVIDENCE-F-STUDENT-VISIBLE-AT",
    ],
    writes: false,
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student reads only the student's own teacher-confirmed interpretation after its release time"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default access to student evidence or mastery interpretation"),
    ],
    failureResults: ["PERMISSION_DENIED", "NOT_FOUND", "NOT_TEACHER_CONFIRMED", "NOT_YET_VISIBLE"],
  }),
];

const evidenceModule = moduleFact({
  id: "INS-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Evidence and Mastery Interpretation",
  objective: "Preserve versioned evidence lineage and require subject-teacher confirmation before a mastery interpretation becomes student-visible",
  entryConditions: ["a published result or confirmed correction provides an immutable source version"],
  exitConditions: ["the evidence remains a candidate, becomes teacher-confirmed and student-visible, or is versioned as stale with history preserved"],
  baselineDecisionIds: ["BASE-003", "BASE-007", "BASE-008", "BASE-010"],
  nfrIds: ["NFR-006", "NFR-008"],
  objects: [object(
    "INS-OBJ-EVIDENCE",
    "Evidence and Mastery Interpretation Version",
    {
      dataSubject: "STUDENT_EVIDENCE_AND_MASTERY",
      controlSubject: "SCHOOL",
      producerRef: "SYSTEM",
      ownerRef: "DUTY-SUBJECT-TEACHER",
      confirmerRef: "DUTY-SUBJECT-TEACHER",
      stewardRef: "DUTY-SUBJECT-TEACHER",
    },
    ["CANDIDATE", "TEACHER_CONFIRMED", "STUDENT_VISIBLE", "STALE"],
    evidenceFields,
    "INS-EVIDENCE-F-ID",
    {
      sensitivityId: "S3",
      readMode: "STUDENT_TIMED_RELEASE",
      lineageBindings: [
        {
          refFieldId: "INS-EVIDENCE-F-SOURCE-RESULT-REF",
          versionFieldId: "INS-EVIDENCE-F-SOURCE-RESULT-VERSION",
          targetObjectId: "PUB-OBJ-RESULT",
          targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
        },
        {
          refFieldId: "INS-EVIDENCE-F-SOURCE-CORRECTION-REF",
          versionFieldId: "INS-EVIDENCE-F-SOURCE-CORRECTION-VERSION",
          targetObjectId: "CORR-OBJ-ATTEMPT",
          targetVersionFieldId: "CORR-ATTEMPT-F-CORRECTION-VERSION",
        },
        {
          refFieldId: "INS-EVIDENCE-F-KNOWLEDGE-POINT-REF",
          versionFieldId: "INS-EVIDENCE-F-KNOWLEDGE-POINT-VERSION",
          targetObjectId: "CURR-OBJ-KNOWLEDGE-POINT",
          targetVersionFieldId: "CURR-KP-F-ID",
        },
        {
          refFieldId: "INS-EVIDENCE-F-PRIOR-EVIDENCE-REF",
          versionFieldId: "INS-EVIDENCE-F-PRIOR-EVIDENCE-VERSION",
          targetObjectId: "INS-OBJ-EVIDENCE",
          targetVersionFieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
        },
      ],
      readPolicies: [{
        id: "INS-RP-STUDENT-MASTERY",
        actionId: "INS-ACT-VIEW-MASTERY",
        subject: { roleRef: "ROLE-STUDENT" },
        scope: {
          kind: "OWN_RECORD",
          subjectFieldId: "INS-EVIDENCE-F-STUDENT-REF",
        },
        requiredState: "STUDENT_VISIBLE",
        timeGates: [{
          visibleAtFieldId: "INS-EVIDENCE-F-STUDENT-VISIBLE-AT",
          protectedFieldIds: [
            "INS-EVIDENCE-F-RESULT",
            "INS-EVIDENCE-F-MASTERY-INTERPRETATION",
          ],
        }],
      }],
    },
  )],
  relationships: [],
  actions: evidenceActions,
  pages: [
    page(
      "INS-PAGE-EVIDENCE-REVIEW",
      "Evidence and Mastery Review",
      ["INS-OBJ-EVIDENCE"],
      evidenceFields.map(({ id }) => id),
      [
        "INS-ACT-CONFIRM-MASTERY",
        "INS-ACT-PUBLISH-INTERPRETATION",
        "INS-ACT-READ-CONFIRMED-EVIDENCE",
      ],
    ),
    page(
      "INS-PAGE-STUDENT-MASTERY",
      "Student Mastery Interpretation",
      ["INS-OBJ-EVIDENCE"],
      [
        "INS-EVIDENCE-F-STUDENT-REF",
        "INS-EVIDENCE-F-RESULT",
        "INS-EVIDENCE-F-MASTERY-INTERPRETATION",
        "INS-EVIDENCE-F-STUDENT-VISIBLE-AT",
      ],
      ["INS-ACT-VIEW-MASTERY"],
    ),
  ],
});

const planFields = [
  field("PLN-PLAN-F-ID", "Improvement Plan ID"),
  field("PLN-PLAN-F-STUDENT-REF", "Plan Student Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-STUDENT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
    idempotencyRole: "OBJECT_REF",
  }),
  field("PLN-PLAN-F-SOURCE-DATA-ID", "Source Evidence Data ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("PLN-PLAN-F-SOURCE-EVIDENCE-REF", "Source Evidence Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "INS-OBJ-EVIDENCE" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "PLN-PLAN-F-SOURCE-EVIDENCE-VERSION",
      targetVersionFieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
    },
  }),
  field("PLN-PLAN-F-SOURCE-EVIDENCE-VERSION", "Source Evidence Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("PLN-PLAN-F-GOAL-CANDIDATE", "Improvement Goal Candidate", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PLN-PLAN-F-TASK-CONTENT-CANDIDATE", "Improvement Task Content Candidate", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PLN-PLAN-F-WORKLOAD-CANDIDATE", "Planned Workload Candidate", {
    dataType: "DECIMAL",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PLN-PLAN-F-DUE-AT-CANDIDATE", "Plan Due Time Candidate", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PLN-PLAN-F-SUCCESS-CONDITION-CANDIDATE", "Plan Success Condition Candidate", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PLN-PLAN-F-EVIDENCE-REQUIREMENT-CANDIDATE", "Completion Evidence Requirement Candidate", {
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PLN-PLAN-F-REVALIDATION-METHOD-CANDIDATE", "Plan Revalidation Method Candidate", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PLN-PLAN-F-GOAL", "Improvement Goal", {
    dataType: "TEXT",
    required: requiredWhen("required when a candidate becomes an ACTIVE plan", ["ACTIVE"]),
  }),
  field("PLN-PLAN-F-SUBJECT", "Improvement Subject", {
    dataType: "ID",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-007" },
  }),
  field("PLN-PLAN-F-KNOWLEDGE-POINT-REF", "Plan Knowledge Point Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "CURR-OBJ-KNOWLEDGE-POINT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "PLN-PLAN-F-KNOWLEDGE-POINT-VERSION",
      targetVersionFieldId: "CURR-KP-F-ID",
    },
  }),
  field("PLN-PLAN-F-KNOWLEDGE-POINT-VERSION", "Plan Knowledge Point Version", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("PLN-PLAN-F-PRIORITY", "Improvement Priority", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-012" },
  }),
  field("PLN-PLAN-F-TASK-CONTENT", "Improvement Task Content", {
    dataType: "TEXT",
    required: requiredWhen("required when a candidate becomes an ACTIVE plan", ["ACTIVE"]),
  }),
  field("PLN-PLAN-F-WORKLOAD", "Planned Workload", {
    dataType: "DECIMAL",
    required: requiredWhen("required when a candidate becomes an ACTIVE plan", ["ACTIVE"]),
  }),
  field("PLN-PLAN-F-DUE-AT", "Plan Due Time", {
    dataType: "DATETIME",
    required: requiredWhen("required when a candidate becomes an ACTIVE plan", ["ACTIVE"]),
  }),
  field("PLN-PLAN-F-SUCCESS-CONDITION", "Plan Success Condition", {
    dataType: "TEXT",
    required: requiredWhen("required when a candidate becomes an ACTIVE plan", ["ACTIVE"]),
  }),
  field("PLN-PLAN-F-EVIDENCE-REQUIREMENT", "Completion Evidence Requirement", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-034" },
    required: requiredWhen("required when a candidate becomes an ACTIVE plan", ["ACTIVE"]),
  }),
  field("PLN-PLAN-F-REVALIDATION-METHOD", "Plan Revalidation Method", {
    dataType: "TEXT",
    required: requiredWhen("required when a candidate becomes an ACTIVE plan", ["ACTIVE"]),
  }),
  field("PLN-PLAN-F-TEACHER-CONFIRMER-REF", "Plan Teacher Confirmer Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-TEACHER" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when a candidate becomes an ACTIVE plan", ["ACTIVE"]),
    referenceIntegrity: "IDENTITY_ONLY",
  }),
  field("PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-REF", "Student Difficulty Feedback Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "APP-OBJ-TODO" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when a student difficulty report changes the plan", ["ACTIVE"], ["PLN-ACT-ADJUST-PLAN"]),
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-VERSION",
      targetVersionFieldId: "APP-TODO-F-AGGREGATION-VERSION",
    },
  }),
  field("PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-VERSION", "Student Difficulty Feedback Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when a student difficulty report changes the plan", ["ACTIVE"], ["PLN-ACT-ADJUST-PLAN"]),
  }),
  field("PLN-PLAN-F-ADJUSTMENT-REASON", "Plan Adjustment Reason", {
    dataType: "TEXT",
    required: requiredWhen("required when plan content or workload changes", ["ACTIVE"], ["PLN-ACT-ADJUST-PLAN"]),
  }),
  field("PLN-PLAN-F-CLOSE-REASON", "Plan Close Reason", {
    dataType: "TEXT",
    required: requiredWhen("required when the plan closes", ["CLOSED"], ["PLN-ACT-CLOSE-PLAN"]),
  }),
  field("PLN-PLAN-F-INVALIDATION-REF", "Plan Evaluation Invalidation Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "CORR-OBJ-INVALIDATION" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when the plan evaluation enters pending reconfirmation", ["PENDING_RECONFIRM"]),
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "PLN-PLAN-F-INVALIDATION-VERSION",
      targetVersionFieldId: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
    },
  }),
  field("PLN-PLAN-F-INVALIDATION-VERSION", "Plan Evaluation Invalidation Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when the plan evaluation enters pending reconfirmation", ["PENDING_RECONFIRM"]),
  }),
  field("PLN-PLAN-F-EVALUATION-STATE", "Plan Evaluation State", {
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when an ACTIVE plan enters evaluation", ["PENDING_RECONFIRM"]),
  }),
  field("PLN-PLAN-F-EVALUATION-VERSION", "Plan Evaluation Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when an ACTIVE plan enters evaluation", ["PENDING_RECONFIRM"]),
  }),
  field("PLN-PLAN-F-PLAN-VERSION", "Improvement Plan Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
  }),
];

const subjectSyncFields = [
  field("PLN-SUBJECT-SYNC-F-ID", "Subject Teacher Sync Output ID"),
  field("PLN-SUBJECT-SYNC-F-PLAN-REF", "Synced Plan Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PLN-OBJ-PLAN" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "PLN-SUBJECT-SYNC-F-PLAN-VERSION",
      targetVersionFieldId: "PLN-PLAN-F-PLAN-VERSION",
    },
  }),
  field("PLN-SUBJECT-SYNC-F-PLAN-VERSION", "Synced Plan Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("PLN-SUBJECT-SYNC-F-SUBJECT", "Synced Subject", {
    dataType: "ID",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-007" },
    mutability: "IMMUTABLE",
  }),
  field("PLN-SUBJECT-SYNC-F-TEACHER-CONFIRMER-REF", "Confirmed Subject Teacher Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-TEACHER" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
  }),
  field("PLN-SUBJECT-SYNC-F-STATUS", "Subject Teacher Sync Status", {
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PLN-SUBJECT-SYNC-F-OUTPUT-VERSION", "Subject Teacher Sync Output Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
];

const homeroomCoordinationFields = [
  field("PLN-HOMEROOM-F-ID", "Homeroom Coordination Output ID"),
  field("PLN-HOMEROOM-F-PLAN-REF", "Coordinated Plan Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PLN-OBJ-PLAN" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "PLN-HOMEROOM-F-PLAN-VERSION",
      targetVersionFieldId: "PLN-PLAN-F-PLAN-VERSION",
    },
  }),
  field("PLN-HOMEROOM-F-PLAN-VERSION", "Coordinated Plan Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("PLN-HOMEROOM-F-CLASS-SCOPE", "Homeroom Class Scope", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("PLN-HOMEROOM-F-LOAD-SUMMARY", "Read-only Cross-subject Coordination Load", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PLN-HOMEROOM-F-STATUS", "Homeroom Coordination Status", {
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("PLN-HOMEROOM-F-OUTPUT-VERSION", "Homeroom Coordination Output Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
  }),
];

const planFlowPermissions = [
  permission("ALLOW", "SYSTEM", "the verified improvement Flow creates the candidate and explicit synchronization outputs"),
  permission("DENY", "CURRENT_ACTOR", "a user cannot invoke internal plan materialization or synchronization directly"),
];

const planActions = [
  action({
    id: "PLN-ACT-CREATE-CANDIDATE",
    label: "Create an Improvement Plan Candidate",
    operationKind: "CREATE",
    targetObjectId: "PLN-OBJ-PLAN",
    outputFieldIds: [
      "PLN-PLAN-F-ID",
      "PLN-PLAN-F-STUDENT-REF",
      "PLN-PLAN-F-SOURCE-DATA-ID",
      "PLN-PLAN-F-SOURCE-EVIDENCE-REF",
      "PLN-PLAN-F-SOURCE-EVIDENCE-VERSION",
      "PLN-PLAN-F-GOAL-CANDIDATE",
      "PLN-PLAN-F-TASK-CONTENT-CANDIDATE",
      "PLN-PLAN-F-WORKLOAD-CANDIDATE",
      "PLN-PLAN-F-DUE-AT-CANDIDATE",
      "PLN-PLAN-F-SUCCESS-CONDITION-CANDIDATE",
      "PLN-PLAN-F-EVIDENCE-REQUIREMENT-CANDIDATE",
      "PLN-PLAN-F-REVALIDATION-METHOD-CANDIDATE",
      "PLN-PLAN-F-SUBJECT",
      "PLN-PLAN-F-KNOWLEDGE-POINT-REF",
      "PLN-PLAN-F-KNOWLEDGE-POINT-VERSION",
      "PLN-PLAN-F-PRIORITY",
      "PLN-PLAN-F-PLAN-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-012"] },
    permissions: planFlowPermissions,
    successState: "CANDIDATE",
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "creates a candidate from the teacher-confirmed evidence version without making the generated content official",
  }),
  action({
    id: "PLN-ACT-CONFIRM-PLAN",
    label: "Confirm the Subject Improvement Plan",
    targetObjectId: "PLN-OBJ-PLAN",
    inputFieldIds: [
      "PLN-PLAN-F-GOAL",
      "PLN-PLAN-F-SUBJECT",
      "PLN-PLAN-F-KNOWLEDGE-POINT-REF",
      "PLN-PLAN-F-KNOWLEDGE-POINT-VERSION",
      "PLN-PLAN-F-PRIORITY",
      "PLN-PLAN-F-TASK-CONTENT",
      "PLN-PLAN-F-WORKLOAD",
      "PLN-PLAN-F-DUE-AT",
      "PLN-PLAN-F-SUCCESS-CONDITION",
      "PLN-PLAN-F-EVIDENCE-REQUIREMENT",
      "PLN-PLAN-F-REVALIDATION-METHOD",
      "PLN-PLAN-F-TEACHER-CONFIRMER-REF",
    ],
    outputFieldIds: [
      "PLN-PLAN-F-TEACHER-CONFIRMER-REF",
      "PLN-PLAN-F-PLAN-VERSION",
    ],
    risk: RISK.HIGH,
    permissions: subjectTeacherWritePermissions,
    transition: { from: "CANDIDATE", to: "ACTIVE" },
    failureResults: ["PERMISSION_DENIED", "MISSING_SUCCESS_CONDITION", "STALE_INPUT_VERSION", "VERSION_CONFLICT"],
    successData: "the corresponding subject teacher confirms the goal, task, workload, due time, evidence requirement, and revalidation method",
  }),
  action({
    id: "PLN-ACT-SYNC-SUBJECT-TEACHER",
    label: "Create the Subject Teacher Plan Sync Output",
    operationKind: "CREATE",
    targetObjectId: "PLN-OBJ-SUBJECT-SYNC",
    outputFieldIds: subjectSyncFields.map(({ id }) => id),
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-012"] },
    permissions: planFlowPermissions,
    successState: "DELIVERED",
    failureResults: ["PERMISSION_DENIED", "SYNC_DELIVERY_FAILED", "VERSION_CONFLICT"],
  }),
  action({
    id: "PLN-ACT-SYNC-HOMEROOM-COORDINATION",
    label: "Create the Homeroom Read-only Coordination Output",
    operationKind: "CREATE",
    targetObjectId: "PLN-OBJ-HOMEROOM-COORDINATION",
    outputFieldIds: homeroomCoordinationFields.map(({ id }) => id),
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-012"] },
    permissions: planFlowPermissions,
    successState: "AVAILABLE",
    failureResults: ["PERMISSION_DENIED", "SYNC_DELIVERY_FAILED", "VERSION_CONFLICT"],
    successData: "creates a distinct class-level read-only coordination output without granting plan-content mutation",
  }),
  action({
    id: "PLN-ACT-ADJUST-PLAN",
    label: "Adjust an Active Subject Improvement Plan",
    targetObjectId: "PLN-OBJ-PLAN",
    inputFieldIds: [
      "PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-REF",
      "PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-VERSION",
      "PLN-PLAN-F-TASK-CONTENT",
      "PLN-PLAN-F-WORKLOAD",
      "PLN-PLAN-F-DUE-AT",
      "PLN-PLAN-F-ADJUSTMENT-REASON",
    ],
    outputFieldIds: ["PLN-PLAN-F-PLAN-VERSION"],
    risk: RISK.HIGH,
    permissions: subjectTeacherWritePermissions,
    transition: { from: "ACTIVE", to: "ACTIVE" },
    failureResults: ["PERMISSION_DENIED", "ADJUSTMENT_REASON_REQUIRED", "STALE_INPUT_VERSION", "VERSION_CONFLICT"],
  }),
  action({
    id: "PLN-ACT-CLOSE-PLAN",
    label: "Close an Improvement Plan",
    targetObjectId: "PLN-OBJ-PLAN",
    inputFieldIds: ["PLN-PLAN-F-CLOSE-REASON"],
    outputFieldIds: ["PLN-PLAN-F-PLAN-VERSION"],
    risk: RISK.HIGH,
    permissions: subjectTeacherWritePermissions,
    transition: { from: "ACTIVE", to: "CLOSED" },
    failureResults: ["PERMISSION_DENIED", "CLOSE_REASON_REQUIRED", "VERSION_CONFLICT"],
  }),
  action({
    id: "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM",
    label: "Mark Plan Evaluation Pending Reconfirmation",
    targetObjectId: "PLN-OBJ-PLAN",
    outputFieldIds: [
      "PLN-PLAN-F-INVALIDATION-REF",
      "PLN-PLAN-F-INVALIDATION-VERSION",
      "PLN-PLAN-F-EVALUATION-STATE",
      "PLN-PLAN-F-EVALUATION-VERSION",
      "PLN-PLAN-F-PLAN-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-009", "DF-010"] },
    permissions: planFlowPermissions,
    transition: { from: "ACTIVE", to: "PENDING_RECONFIRM" },
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "records the CORR invalidation version and moves only the dependent plan evaluation to pending reconfirmation while preserving the active plan history",
  }),
  action({
    id: "PLN-ACT-VIEW-HOMEROOM-COORDINATION",
    label: "View the Read-only Homeroom Plan Coordination",
    targetObjectId: "PLN-OBJ-HOMEROOM-COORDINATION",
    inputFieldIds: ["PLN-HOMEROOM-F-ID"],
    outputFieldIds: homeroomCoordinationFields.map(({ id }) => id),
    writes: false,
    permissions: teacherAndHomeroomReadPermissions,
  }),
];

const planModule = moduleFact({
  id: "PLN-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Improvement Plans and Explicit Coordination Outputs",
  objective: "Keep plan content under the corresponding subject teacher while producing explicit subject and homeroom coordination outputs",
  entryConditions: ["a teacher-confirmed evidence version supports an improvement candidate"],
  exitConditions: ["the subject teacher confirms, adjusts, or closes the plan and the Flow records distinct synchronization outputs"],
  baselineDecisionIds: ["BASE-003", "BASE-007", "BASE-008", "BASE-010"],
  nfrIds: ["NFR-006", "NFR-008"],
  objects: [
    object(
      "PLN-OBJ-PLAN",
      "Subject Improvement Plan Version",
      {
        dataSubject: "STUDENT_IMPROVEMENT_PLAN",
        controlSubject: "SCHOOL",
        producerRef: "SYSTEM",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "DUTY-SUBJECT-TEACHER",
      },
      ["CANDIDATE", "ACTIVE", "CLOSED", "PENDING_RECONFIRM"],
      planFields,
      "PLN-PLAN-F-ID",
      {
        sensitivityId: "S3",
        lineageBindings: [
          {
            refFieldId: "PLN-PLAN-F-SOURCE-EVIDENCE-REF",
            versionFieldId: "PLN-PLAN-F-SOURCE-EVIDENCE-VERSION",
            targetObjectId: "INS-OBJ-EVIDENCE",
            targetVersionFieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
          },
          {
            refFieldId: "PLN-PLAN-F-KNOWLEDGE-POINT-REF",
            versionFieldId: "PLN-PLAN-F-KNOWLEDGE-POINT-VERSION",
            targetObjectId: "CURR-OBJ-KNOWLEDGE-POINT",
            targetVersionFieldId: "CURR-KP-F-ID",
          },
          {
            refFieldId: "PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-REF",
            versionFieldId: "PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-VERSION",
            targetObjectId: "APP-OBJ-TODO",
            targetVersionFieldId: "APP-TODO-F-AGGREGATION-VERSION",
          },
          {
            refFieldId: "PLN-PLAN-F-INVALIDATION-REF",
            versionFieldId: "PLN-PLAN-F-INVALIDATION-VERSION",
            targetObjectId: "CORR-OBJ-INVALIDATION",
            targetVersionFieldId: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
          },
        ],
      },
    ),
    object(
      "PLN-OBJ-SUBJECT-SYNC",
      "Subject Teacher Plan Sync Output",
      {
        dataSubject: "SUBJECT_PLAN_SYNC",
        controlSubject: "SCHOOL",
        producerRef: "SYSTEM",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "DUTY-SUBJECT-TEACHER",
      },
      ["DELIVERED"],
      subjectSyncFields,
      "PLN-SUBJECT-SYNC-F-ID",
      {
        sensitivityId: "S3",
        lineageBindings: [{
          refFieldId: "PLN-SUBJECT-SYNC-F-PLAN-REF",
          versionFieldId: "PLN-SUBJECT-SYNC-F-PLAN-VERSION",
          targetObjectId: "PLN-OBJ-PLAN",
          targetVersionFieldId: "PLN-PLAN-F-PLAN-VERSION",
        }],
      },
    ),
    object(
      "PLN-OBJ-HOMEROOM-COORDINATION",
      "Homeroom Cross-subject Coordination Output",
      {
        dataSubject: "HOMEROOM_PLAN_COORDINATION",
        controlSubject: "SCHOOL",
        producerRef: "SYSTEM",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "DUTY-HOMEROOM",
      },
      ["AVAILABLE"],
      homeroomCoordinationFields,
      "PLN-HOMEROOM-F-ID",
      {
        sensitivityId: "S3",
        lineageBindings: [{
          refFieldId: "PLN-HOMEROOM-F-PLAN-REF",
          versionFieldId: "PLN-HOMEROOM-F-PLAN-VERSION",
          targetObjectId: "PLN-OBJ-PLAN",
          targetVersionFieldId: "PLN-PLAN-F-PLAN-VERSION",
        }],
      },
    ),
  ],
  relationships: [
    {
      id: "PLN-REL-SUBJECT-SYNC-PLAN",
      fromObjectId: "PLN-OBJ-SUBJECT-SYNC",
      toObjectId: "PLN-OBJ-PLAN",
      type: "DERIVED_FROM",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SUBJECT",
      onSourceInvalidation: "mark the sync output stale and retain its referenced plan version",
    },
    {
      id: "PLN-REL-HOMEROOM-PLAN",
      fromObjectId: "PLN-OBJ-HOMEROOM-COORDINATION",
      toObjectId: "PLN-OBJ-PLAN",
      type: "APPEARS_IN",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_CONTEXT",
      onSourceInvalidation: "mark only the coordination output stale without granting plan mutation",
    },
  ],
  actions: planActions,
  pages: [
    page(
      "PLN-PAGE-PLAN",
      "Subject Improvement Plan Workspace",
      ["PLN-OBJ-PLAN"],
      planFields.map(({ id }) => id),
      ["PLN-ACT-CONFIRM-PLAN", "PLN-ACT-ADJUST-PLAN", "PLN-ACT-CLOSE-PLAN"],
    ),
    page(
      "PLN-PAGE-HOMEROOM",
      "Read-only Homeroom Plan Coordination",
      ["PLN-OBJ-HOMEROOM-COORDINATION"],
      homeroomCoordinationFields.map(({ id }) => id),
      ["PLN-ACT-VIEW-HOMEROOM-COORDINATION"],
    ),
  ],
});

const studentTodoFields = [
  field("APP-TODO-F-ID", "Student Todo Aggregation ID"),
  field("APP-TODO-F-STUDENT-REF", "Todo Student Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-STUDENT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
    idempotencyRole: "OBJECT_REF",
  }),
  field("APP-TODO-F-SOURCE-PLAN-REF", "Source Improvement Plan Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PLN-OBJ-PLAN" },
    mutability: "IMMUTABLE",
    required: requiredWhen("required when the todo links to an improvement plan", ["READY"], ["APP-ACT-CREATE-PLAN-TODO"]),
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "APP-TODO-F-SOURCE-PLAN-VERSION",
      targetVersionFieldId: "PLN-PLAN-F-PLAN-VERSION",
    },
  }),
  field("APP-TODO-F-SOURCE-PLAN-VERSION", "Source Improvement Plan Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    required: requiredWhen("required when the todo links to an improvement plan", ["READY"], ["APP-ACT-CREATE-PLAN-TODO"]),
  }),
  field("APP-TODO-F-SOURCE-ASSIGNMENT-REF", "Source Assignment Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "HW-OBJ-ASSIGNMENT" },
    mutability: "IMMUTABLE",
    required: requiredWhen("required when the todo links to homework", ["READY"], ["APP-ACT-CREATE-HOMEWORK-TODO"]),
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "APP-TODO-F-SOURCE-ASSIGNMENT-VERSION",
      targetVersionFieldId: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
    },
  }),
  field("APP-TODO-F-SOURCE-ASSIGNMENT-VERSION", "Source Assignment Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    required: requiredWhen("required when the todo links to homework", ["READY"], ["APP-ACT-CREATE-HOMEWORK-TODO"]),
  }),
  field("APP-TODO-F-TASK-DEEP-LINK", "Task Deep Link", {
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    releaseRequirement: {
      readPolicyId: "APP-RP-STUDENT-TODO",
      requiredState: "READY",
      visibleAtFieldId: "APP-TODO-F-STUDENT-VISIBLE-AT",
    },
  }),
  field("APP-TODO-F-LOCAL-PROGRESS", "Student Local Progress", {
    dataType: "JSON",
    required: requiredWhen("required when the student records local todo execution state", ["READY"], ["APP-ACT-UPDATE-LOCAL-PROGRESS"]),
    releaseRequirement: {
      readPolicyId: "APP-RP-STUDENT-TODO",
      requiredState: "READY",
      visibleAtFieldId: "APP-TODO-F-STUDENT-VISIBLE-AT",
    },
  }),
  field("APP-TODO-F-COMPLETION-EVIDENCE", "Student Completion Evidence", {
    dataType: "JSON",
    required: requiredWhen("required when the student records local todo execution state", ["READY"], ["APP-ACT-UPDATE-LOCAL-PROGRESS"]),
    releaseRequirement: {
      readPolicyId: "APP-RP-STUDENT-TODO",
      requiredState: "READY",
      visibleAtFieldId: "APP-TODO-F-STUDENT-VISIBLE-AT",
    },
  }),
  field("APP-TODO-F-DIFFICULTY-FEEDBACK", "Student Difficulty Feedback", {
    dataType: "TEXT",
    required: requiredWhen("required when the student records local todo execution state", ["READY"], ["APP-ACT-UPDATE-LOCAL-PROGRESS"]),
    releaseRequirement: {
      readPolicyId: "APP-RP-STUDENT-TODO",
      requiredState: "READY",
      visibleAtFieldId: "APP-TODO-F-STUDENT-VISIBLE-AT",
    },
  }),
  field("APP-TODO-F-STUDENT-VISIBLE-AT", "Todo Student Visible At", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("APP-TODO-F-AGGREGATION-VERSION", "Todo Aggregation Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
  }),
];

const studentTodoPermissions = [
  permission("ALLOW", "ROLE-STUDENT", "the student reads or updates only local progress, completion evidence, and difficulty feedback on the student's own todo"),
  permission("DENY", "DUTY-SUBJECT-TEACHER", "a teacher cannot submit or rewrite student-local execution state on the student's behalf"),
  permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default access to student todo execution detail"),
];

const todoFlowPermissions = [
  permission("ALLOW", "SYSTEM", "the verified Flow materializes or refreshes only source-pinned todo links"),
  permission("DENY", "CURRENT_ACTOR", "a user cannot invoke internal todo aggregation directly"),
];

const todoCommonOutputFieldIds = [
  "APP-TODO-F-ID",
  "APP-TODO-F-STUDENT-REF",
  "APP-TODO-F-TASK-DEEP-LINK",
  "APP-TODO-F-STUDENT-VISIBLE-AT",
  "APP-TODO-F-AGGREGATION-VERSION",
];

const studentTodoActions = [
  action({
    id: "APP-ACT-CREATE-PLAN-TODO",
    label: "Create a Plan-pinned Student Todo Link",
    operationKind: "CREATE",
    targetObjectId: "APP-OBJ-TODO",
    outputFieldIds: [
      ...todoCommonOutputFieldIds,
      "APP-TODO-F-SOURCE-PLAN-REF",
      "APP-TODO-F-SOURCE-PLAN-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-012"] },
    permissions: todoFlowPermissions,
    successState: "READY",
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "creates only navigation and local execution state while PLN and HW retain task ownership",
  }),
  action({
    id: "APP-ACT-CREATE-HOMEWORK-TODO",
    label: "Create a Homework-pinned Student Todo Link",
    operationKind: "CREATE",
    targetObjectId: "APP-OBJ-TODO",
    outputFieldIds: [
      ...todoCommonOutputFieldIds,
      "APP-TODO-F-SOURCE-ASSIGNMENT-REF",
      "APP-TODO-F-SOURCE-ASSIGNMENT-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-004"] },
    permissions: todoFlowPermissions,
    successState: "READY",
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "creates only a source-pinned homework deep link and student-local execution state",
  }),
  action({
    id: "APP-ACT-REFRESH-TODOS",
    label: "Refresh Student Todo Aggregation",
    targetObjectId: "APP-OBJ-TODO",
    outputFieldIds: [
      "APP-TODO-F-TASK-DEEP-LINK",
      "APP-TODO-F-AGGREGATION-VERSION",
    ],
    risk: RISK.HIGH,
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-014"] },
    permissions: todoFlowPermissions,
    transition: { from: "READY", to: "READY" },
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
  }),
  action({
    id: "APP-ACT-VIEW-TODOS",
    label: "View My Student Todo Aggregation",
    targetObjectId: "APP-OBJ-TODO",
    inputFieldIds: ["APP-TODO-F-STUDENT-REF"],
    outputFieldIds: [
      "APP-TODO-F-STUDENT-REF",
      "APP-TODO-F-TASK-DEEP-LINK",
      "APP-TODO-F-LOCAL-PROGRESS",
      "APP-TODO-F-COMPLETION-EVIDENCE",
      "APP-TODO-F-DIFFICULTY-FEEDBACK",
      "APP-TODO-F-STUDENT-VISIBLE-AT",
    ],
    writes: false,
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student reads only the student's own released todo aggregation"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default access to student todo execution detail"),
    ],
    failureResults: ["PERMISSION_DENIED", "NOT_FOUND", "NOT_YET_VISIBLE"],
  }),
  action({
    id: "APP-ACT-UPDATE-LOCAL-PROGRESS",
    label: "Update My Local Todo Progress and Evidence",
    targetObjectId: "APP-OBJ-TODO",
    inputFieldIds: [
      "APP-TODO-F-LOCAL-PROGRESS",
      "APP-TODO-F-COMPLETION-EVIDENCE",
      "APP-TODO-F-DIFFICULTY-FEEDBACK",
    ],
    outputFieldIds: [
      "APP-TODO-F-LOCAL-PROGRESS",
      "APP-TODO-F-COMPLETION-EVIDENCE",
      "APP-TODO-F-DIFFICULTY-FEEDBACK",
      "APP-TODO-F-AGGREGATION-VERSION",
    ],
    permissions: studentTodoPermissions,
    transition: { from: "READY", to: "READY" },
  }),
];

const studentExecutionModule = moduleFact({
  id: "APP-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Student Todo Aggregation and Local Execution",
  objective: "Aggregate deep links and local execution state without becoming a second homework or improvement-plan owner",
  entryConditions: ["an authorized source assignment or teacher-confirmed plan version can be resolved"],
  exitConditions: ["the student can navigate, record local progress, attach completion evidence, and report difficulty against pinned sources"],
  baselineDecisionIds: ["BASE-003", "BASE-008", "BASE-010"],
  nfrIds: ["NFR-005", "NFR-008"],
  objects: [object(
    "APP-OBJ-TODO",
    "Student Todo Link and Local Execution State",
    {
      dataSubject: "STUDENT_LOCAL_TASK_EXECUTION",
      controlSubject: "SCHOOL",
      producerRef: "SYSTEM",
      ownerRef: "ROLE-STUDENT",
      confirmerRef: "DUTY-SUBJECT-TEACHER",
      stewardRef: "ROLE-STUDENT",
    },
    ["READY"],
    studentTodoFields,
    "APP-TODO-F-ID",
    {
      sensitivityId: "S3",
      readMode: "STUDENT_TIMED_RELEASE",
      exclusiveSourceGroups: [
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
      ],
      lineageBindings: [
        {
          refFieldId: "APP-TODO-F-SOURCE-PLAN-REF",
          versionFieldId: "APP-TODO-F-SOURCE-PLAN-VERSION",
          targetObjectId: "PLN-OBJ-PLAN",
          targetVersionFieldId: "PLN-PLAN-F-PLAN-VERSION",
        },
        {
          refFieldId: "APP-TODO-F-SOURCE-ASSIGNMENT-REF",
          versionFieldId: "APP-TODO-F-SOURCE-ASSIGNMENT-VERSION",
          targetObjectId: "HW-OBJ-ASSIGNMENT",
          targetVersionFieldId: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
        },
      ],
      readPolicies: [{
        id: "APP-RP-STUDENT-TODO",
        actionId: "APP-ACT-VIEW-TODOS",
        subject: { roleRef: "ROLE-STUDENT" },
        scope: {
          kind: "OWN_RECORD",
          subjectFieldId: "APP-TODO-F-STUDENT-REF",
        },
        requiredState: "READY",
        timeGates: [{
          visibleAtFieldId: "APP-TODO-F-STUDENT-VISIBLE-AT",
          protectedFieldIds: [
            "APP-TODO-F-TASK-DEEP-LINK",
            "APP-TODO-F-LOCAL-PROGRESS",
            "APP-TODO-F-COMPLETION-EVIDENCE",
            "APP-TODO-F-DIFFICULTY-FEEDBACK",
          ],
        }],
      }],
    },
  )],
  relationships: [],
  actions: studentTodoActions,
  pages: [page(
    "APP-PAGE-TODOS",
    "Student Todo Execution",
    ["APP-OBJ-TODO"],
    [
      "APP-TODO-F-STUDENT-REF",
      "APP-TODO-F-TASK-DEEP-LINK",
      "APP-TODO-F-LOCAL-PROGRESS",
      "APP-TODO-F-COMPLETION-EVIDENCE",
      "APP-TODO-F-DIFFICULTY-FEEDBACK",
      "APP-TODO-F-STUDENT-VISIBLE-AT",
    ],
    ["APP-ACT-VIEW-TODOS", "APP-ACT-UPDATE-LOCAL-PROGRESS"],
  )],
});

const correctionTaskFields = [
  field("CORR-TASK-F-ID", "Correction Task ID"),
  field("CORR-TASK-F-STUDENT-REF", "Correction Task Student Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-STUDENT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
    idempotencyRole: "OBJECT_REF",
  }),
  field("CORR-TASK-F-SOURCE-DATA-ID", "Correction Task Source Result Data ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("CORR-TASK-F-SOURCE-RESULT-REF", "Correction Task Source Result Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PUB-OBJ-RESULT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "CORR-TASK-F-SOURCE-RESULT-VERSION",
      targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
    },
  }),
  field("CORR-TASK-F-SOURCE-RESULT-VERSION", "Correction Task Source Result Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("CORR-TASK-F-DUE-AT", "Correction Task Due Time", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("CORR-TASK-F-OVERDUE-HANDLING", "Correction Task Overdue Handling", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when the correction task reaches OVERDUE", ["OVERDUE"]),
  }),
  field("CORR-TASK-F-TASK-VERSION", "Correction Task Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
  }),
];

const correctionAttemptFields = [
  field("CORR-ATTEMPT-F-ID", "Correction Attempt ID"),
  field("CORR-ATTEMPT-F-STUDENT-REF", "Correction Attempt Student Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-STUDENT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
    idempotencyRole: "OBJECT_REF",
  }),
  field("CORR-ATTEMPT-F-TASK-REF", "Correction Task Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "CORR-OBJ-TASK" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: {
      requiredActionIds: [
        "CORR-ACT-SUBMIT-INITIAL",
        "CORR-ACT-SUBMIT-LATE",
        "CORR-ACT-RESUBMIT",
      ],
    },
    versionBinding: {
      versionFieldId: "CORR-ATTEMPT-F-TASK-VERSION",
      targetVersionFieldId: "CORR-TASK-F-TASK-VERSION",
    },
    idempotencyRole: "OBJECT_REF",
  }),
  field("CORR-ATTEMPT-F-TASK-VERSION", "Correction Task Version at Submission", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF", "Prior Correction Attempt Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "CORR-OBJ-ATTEMPT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["CORR-ACT-RESUBMIT"] },
    versionBinding: {
      versionFieldId: "CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION",
      targetVersionFieldId: "CORR-ATTEMPT-F-CORRECTION-VERSION",
    },
    idempotencyRole: "OBJECT_REF",
    required: requiredWhen(
      "required for a resubmission and absent for the first accepted submission",
      ["SUBMITTED"],
      ["CORR-ACT-RESUBMIT"],
    ),
  }),
  field("CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION", "Prior Correction Attempt Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    required: requiredWhen(
      "required for a resubmission and absent for the first accepted submission",
      ["SUBMITTED"],
      ["CORR-ACT-RESUBMIT"],
    ),
  }),
  field("CORR-ATTEMPT-F-CORRECTION-ANSWER", "Student Correction Answer", {
    dataType: "JSON",
    required: requiredWhen("required when the correction reaches SUBMITTED", ["SUBMITTED"]),
  }),
  field("CORR-ATTEMPT-F-TEACHER-JUDGMENT", "Teacher Correction Judgment", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-028" },
    required: requiredWhen("required when the correction reaches JUDGED or NEEDS_RETRY", ["JUDGED", "NEEDS_RETRY"]),
  }),
  field("CORR-ATTEMPT-F-TEACHER-CONFIRMER-REF", "Correction Teacher Confirmer Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-TEACHER" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when the correction reaches JUDGED or NEEDS_RETRY", ["JUDGED", "NEEDS_RETRY"]),
    referenceIntegrity: "IDENTITY_ONLY",
  }),
  field("CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT", "Repeated Correction Count", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("CORR-ATTEMPT-F-OVERDUE-HANDLING", "Correction Overdue Handling", {
    dataType: "TEXT",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    required: requiredWhen("required when an overdue correction is submitted", ["SUBMITTED"], ["CORR-ACT-SUBMIT-LATE"]),
  }),
  field("CORR-ATTEMPT-F-CORRECTION-VERSION", "Correction Attempt Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
  }),
];

const invalidationFields = [
  field("CORR-INVALIDATION-F-ID", "Correction Invalidation Record ID"),
  field("CORR-INVALIDATION-F-SOURCE-DATA-ID", "Invalidated Source Data ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("CORR-INVALIDATION-F-SOURCE-RESULT-REF", "Invalidated Source Result Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PUB-OBJ-RESULT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "CORR-INVALIDATION-F-SOURCE-RESULT-VERSION",
      targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
    },
  }),
  field("CORR-INVALIDATION-F-SOURCE-RESULT-VERSION", "Invalidated Source Result Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("CORR-INVALIDATION-F-SOURCE-DECISION-REF", "Invalidated Source Decision Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "GRD-OBJ-DECISION" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "CORR-INVALIDATION-F-SOURCE-DECISION-VERSION",
      targetVersionFieldId: "GRD-DECISION-F-DECISION-VERSION",
    },
  }),
  field("CORR-INVALIDATION-F-SOURCE-DECISION-VERSION", "Invalidated Source Decision Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("CORR-INVALIDATION-F-TARGET-KINDS", "Invalidation Target Kinds", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    validation: "must contain only EVIDENCE, MASTERY_INTERPRETATION, IMPROVEMENT_CANDIDATE, PLAN_EVALUATION, REPORT_INTERPRETATION, and LEARNING_PATH_EXPLANATION",
  }),
  field("CORR-INVALIDATION-F-TARGET-TRANSITIONS", "Per-target Invalidation Transitions", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    validation: "each target kind must enter STALE, INVALIDATED, or PENDING_RECONFIRM independently",
  }),
  field("CORR-INVALIDATION-F-TARGET-VERSIONS", "Invalidation Target Versions", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    validation: "each target records its source version, target version, object-level outcome, and retry provenance",
  }),
  field("CORR-INVALIDATION-F-TARGET-OUTCOMES", "Per-target Invalidation Outcomes", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    validation: "each dependency records its outcome and retry provenance; preserve every successful target outcome and retry only failed targets",
  }),
  field("CORR-INVALIDATION-F-HISTORY-PRESERVATION", "Invalidation History Preservation", {
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    validation: "must be RETAIN_ALL_PRIOR_VERSIONS",
  }),
  field("CORR-INVALIDATION-F-INVALIDATION-VERSION", "Invalidation Record Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
];

const correctionStudentPermissions = [
  permission("ALLOW", "ROLE-STUDENT", "the student submits or resubmits only the student's own correction answer against a visible result version"),
  permission("DENY", "DUTY-SUBJECT-TEACHER", "a teacher cannot submit a correction answer on the student's behalf"),
  permission("DENY", "AI", "AI may suggest a correction but cannot submit it or confirm the formal judgment"),
  permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default access to correction answers"),
];

const correctionTeacherPermissions = [
  ...subjectTeacherWritePermissions,
  permission("DENY", "AI", "AI may suggest a judgment but cannot confirm the formal correction decision"),
];

const correctionTaskTeacherPermissions = [
  permission("ALLOW", "DUTY-SUBJECT-TEACHER", "the corresponding subject teacher creates a correction task for an assigned student's published result"),
  permission("DENY", "ROLE-STUDENT", "a student cannot create or self-assign a correction task"),
  permission("DENY", "DUTY-HOMEROOM", "a homeroom teacher cannot create another subject's correction task"),
  permission("DENY", "AI", "AI cannot create or assign a correction task"),
  permission("DENY", "ROLE-PLATFORM-OPS", "platform operations cannot create correction tasks by default"),
];

const correctionTaskFlowPermissions = [
  permission("ALLOW", "SYSTEM", "the verified result publication Flow creates a correction task only when the published result requires correction"),
  permission("DENY", "CURRENT_ACTOR", "a user cannot invoke automatic correction task creation directly"),
];

const invalidationFlowPermissions = [
  permission("ALLOW", "SYSTEM", "the verified correction Flow records the object-level invalidation chain and retry provenance"),
  permission("DENY", "CURRENT_ACTOR", "a user cannot bypass the correction judgment to create invalidation records directly"),
];

const correctionFlowPermissions = [
  permission("ALLOW", "SYSTEM", "the verified correction Flow normalizes one accepted student submission branch"),
  permission("DENY", "CURRENT_ACTOR", "a user cannot invoke internal correction submission normalization directly"),
];

const correctionTaskJudgmentFlowPermissions = [
  permission("ALLOW", "SYSTEM", "the verified correction judgment Flow updates only the guarded correction Task version"),
  permission("DENY", "CURRENT_ACTOR", "a user cannot bypass the formal judgment to update correction Task state directly"),
];

function correctionTaskStateGuard(requiredState) {
  return {
    refFieldId: "CORR-ATTEMPT-F-TASK-REF",
    versionFieldId: "CORR-ATTEMPT-F-TASK-VERSION",
    targetObjectId: "CORR-OBJ-TASK",
    requiredState,
  };
}

const correctionSubmissionOutputFieldIds = [
  "CORR-ATTEMPT-F-CORRECTION-ANSWER",
  "CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT",
  "CORR-ATTEMPT-F-CORRECTION-VERSION",
];

const correctionAttemptCreateOutputFieldIds = [
  "CORR-ATTEMPT-F-ID",
  "CORR-ATTEMPT-F-STUDENT-REF",
  "CORR-ATTEMPT-F-TASK-REF",
  "CORR-ATTEMPT-F-TASK-VERSION",
  "CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT",
  "CORR-ATTEMPT-F-CORRECTION-VERSION",
];

const correctionActions = [
  action({
    id: "CORR-ACT-CREATE-TASK",
    label: "Create a Correction Task",
    operationKind: "CREATE",
    targetObjectId: "CORR-OBJ-TASK",
    inputFieldIds: [
      "CORR-TASK-F-STUDENT-REF",
      "CORR-TASK-F-SOURCE-RESULT-REF",
      "CORR-TASK-F-SOURCE-RESULT-VERSION",
    ],
    outputFieldIds: [
      "CORR-TASK-F-ID",
      "CORR-TASK-F-SOURCE-DATA-ID",
      "CORR-TASK-F-DUE-AT",
      "CORR-TASK-F-TASK-VERSION",
    ],
    permissions: correctionTaskTeacherPermissions,
    successState: "OPEN",
  }),
  action({
    id: "CORR-ACT-AUTO-CREATE-TASK",
    label: "Automatically Create a Required Correction Task",
    operationKind: "CREATE",
    targetObjectId: "CORR-OBJ-TASK",
    outputFieldIds: [
      "CORR-TASK-F-ID",
      "CORR-TASK-F-STUDENT-REF",
      "CORR-TASK-F-SOURCE-DATA-ID",
      "CORR-TASK-F-SOURCE-RESULT-REF",
      "CORR-TASK-F-SOURCE-RESULT-VERSION",
      "CORR-TASK-F-DUE-AT",
      "CORR-TASK-F-TASK-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-008"] },
    permissions: correctionTaskFlowPermissions,
    successState: "OPEN",
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "creates one OPEN correction task with a due time from the published result and its exact result version when correction is required",
    idempotencyKey: "CORR-ACT-AUTO-CREATE-TASK:school:student:published-result-version",
  }),
  action({
    id: "CORR-ACT-MARK-OVERDUE",
    label: "Mark an Open Correction Task Overdue",
    targetObjectId: "CORR-OBJ-TASK",
    outputFieldIds: [
      "CORR-TASK-F-OVERDUE-HANDLING",
      "CORR-TASK-F-TASK-VERSION",
    ],
    executionMode: SYSTEM_EVENT,
    trigger: { kind: "EVENT", eventId: "EVT-CORRECTION-TASK-DUE" },
    permissions: [
      permission("ALLOW", "SYSTEM", "the system marks only an OPEN correction task overdue at its due time"),
      permission("DENY", "CURRENT_ACTOR", "a user cannot force a correction task into the overdue state"),
    ],
    transition: { from: "OPEN", to: "OVERDUE" },
  }),
  action({
    id: "CORR-ACT-SUBMIT-INITIAL",
    label: "Submit an Open Correction Answer",
    operationKind: "CREATE",
    targetObjectId: "CORR-OBJ-ATTEMPT",
    inputFieldIds: ["CORR-ATTEMPT-F-CORRECTION-ANSWER"],
    relatedStateGuards: [correctionTaskStateGuard("OPEN")],
    outputFieldIds: correctionAttemptCreateOutputFieldIds,
    permissions: correctionStudentPermissions,
    successState: "SUBMITTED",
  }),
  action({
    id: "CORR-ACT-SUBMIT-LATE",
    label: "Submit an Overdue Correction Answer",
    operationKind: "CREATE",
    targetObjectId: "CORR-OBJ-ATTEMPT",
    inputFieldIds: ["CORR-ATTEMPT-F-CORRECTION-ANSWER"],
    relatedStateGuards: [correctionTaskStateGuard("OVERDUE")],
    outputFieldIds: [
      ...correctionAttemptCreateOutputFieldIds,
      "CORR-ATTEMPT-F-OVERDUE-HANDLING",
    ],
    permissions: correctionStudentPermissions,
    successState: "SUBMITTED",
  }),
  action({
    id: "CORR-ACT-CONFIRM-JUDGMENT",
    label: "Confirm the Formal Correction Judgment",
    targetObjectId: "CORR-OBJ-ATTEMPT",
    inputFieldIds: ["CORR-ATTEMPT-F-TEACHER-JUDGMENT"],
    acceptedInputValues: [{
      fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
      optionSetId: "OPT-ENUM-028",
      partitionId: "CORRECTION_JUDGMENT",
      codes: ["PASSED", "CLOSED"],
    }],
    outputFieldIds: [
      "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
      "CORR-ATTEMPT-F-TEACHER-CONFIRMER-REF",
      "CORR-ATTEMPT-F-CORRECTION-VERSION",
    ],
    risk: RISK.HIGH,
    permissions: correctionTeacherPermissions,
    transition: { from: "SUBMITTED", to: "JUDGED" },
    failureResults: ["PERMISSION_DENIED", "STALE_RESULT_VERSION", "VERSION_CONFLICT"],
    successData: "the corresponding subject teacher confirms the official correction judgment; AI suggestions remain non-authoritative",
  }),
  action({
    id: "CORR-ACT-REQUEST-RETRY",
    label: "Request Another Correction Attempt",
    targetObjectId: "CORR-OBJ-ATTEMPT",
    inputFieldIds: ["CORR-ATTEMPT-F-TEACHER-JUDGMENT"],
    acceptedInputValues: [{
      fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
      optionSetId: "OPT-ENUM-028",
      partitionId: "CORRECTION_JUDGMENT",
      codes: ["NOT-PASSED", "NEEDS-MORE"],
    }],
    outputFieldIds: [
      "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
      "CORR-ATTEMPT-F-TEACHER-CONFIRMER-REF",
      "CORR-ATTEMPT-F-CORRECTION-VERSION",
    ],
    risk: RISK.HIGH,
    permissions: correctionTeacherPermissions,
    transition: { from: "SUBMITTED", to: "NEEDS_RETRY" },
    failureResults: ["PERMISSION_DENIED", "STALE_RESULT_VERSION", "VERSION_CONFLICT"],
    successData: "the corresponding subject teacher records the retry judgment without accepting the correction as final",
  }),
  action({
    id: "CORR-ACT-MARK-TASK-AWAITING-RETRY",
    label: "Mark the Correction Task Awaiting Retry",
    targetObjectId: "CORR-OBJ-TASK",
    inputFieldIds: ["CORR-TASK-F-ID", "CORR-TASK-F-TASK-VERSION"],
    outputFieldIds: ["CORR-TASK-F-TASK-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-010"] },
    permissions: correctionTaskJudgmentFlowPermissions,
    transition: {
      from: ["OPEN", "OVERDUE", "AWAITING_RETRY"],
      to: "AWAITING_RETRY",
    },
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "moves the exact guarded correction Task version to AWAITING_RETRY after a retry judgment",
  }),
  action({
    id: "CORR-ACT-COMPLETE-TASK",
    label: "Complete the Correction Task after Final Judgment",
    targetObjectId: "CORR-OBJ-TASK",
    inputFieldIds: ["CORR-TASK-F-ID", "CORR-TASK-F-TASK-VERSION"],
    outputFieldIds: ["CORR-TASK-F-TASK-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-010"] },
    permissions: correctionTaskJudgmentFlowPermissions,
    transition: {
      from: ["OPEN", "OVERDUE", "AWAITING_RETRY"],
      to: "COMPLETED",
    },
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "moves the exact guarded correction Task version to COMPLETED before dependent evidence work",
  }),
  action({
    id: "CORR-ACT-RESUBMIT",
    label: "Resubmit a Repeated Correction",
    operationKind: "CREATE",
    targetObjectId: "CORR-OBJ-ATTEMPT",
    inputFieldIds: ["CORR-ATTEMPT-F-CORRECTION-ANSWER"],
    relatedStateGuards: [
      correctionTaskStateGuard("AWAITING_RETRY"),
      {
        refFieldId: "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF",
        versionFieldId: "CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION",
        targetObjectId: "CORR-OBJ-ATTEMPT",
        requiredState: "NEEDS_RETRY",
      },
    ],
    outputFieldIds: [
      ...correctionAttemptCreateOutputFieldIds,
      "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF",
      "CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION",
    ],
    permissions: correctionStudentPermissions,
    successState: "SUBMITTED",
  }),
  action({
    id: "CORR-ACT-NORMALIZE-SUBMISSION",
    label: "Normalize an Accepted Correction Submission",
    targetObjectId: "CORR-OBJ-ATTEMPT",
    inputFieldIds: correctionSubmissionOutputFieldIds,
    outputFieldIds: ["CORR-ATTEMPT-F-CORRECTION-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-010"] },
    permissions: correctionFlowPermissions,
    transition: { from: "SUBMITTED", to: "SUBMITTED" },
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "normalizes exactly one initial, late, or repeated student submission into the correction Flow contract",
  }),
  action({
    id: "CORR-ACT-RECORD-INVALIDATION",
    label: "Record the Result Correction Invalidation Chain",
    operationKind: "CREATE",
    targetObjectId: "CORR-OBJ-INVALIDATION",
    outputFieldIds: invalidationFields.map(({ id }) => id),
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-009", "DF-010"] },
    permissions: invalidationFlowPermissions,
    successState: "RECORDED",
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "records old result and decision versions, per-target new versions and states, retry provenance, and RETAIN_ALL_PRIOR_VERSIONS",
  }),
];

const correctionModule = moduleFact({
  id: "CORR-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Student Correction and Versioned Invalidation",
  objective: "Keep correction answers student-submitted, judgments teacher-confirmed, and every dependent invalidation versioned with history preserved",
  entryConditions: ["the student can reference a visible published result version"],
  exitConditions: ["the correction has a formal teacher judgment and every dependency has an object-level invalidation outcome"],
  baselineDecisionIds: ["BASE-003", "BASE-007", "BASE-008", "BASE-010"],
  nfrIds: ["NFR-006", "NFR-008"],
  objects: [
    object(
      "CORR-OBJ-TASK",
      "Teacher Correction Task",
      {
        dataSubject: "STUDENT_CORRECTION_TASK",
        controlSubject: "SCHOOL",
        producerRef: "DUTY-SUBJECT-TEACHER",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "DUTY-SUBJECT-TEACHER",
      },
      ["OPEN", "OVERDUE", "AWAITING_RETRY", "COMPLETED"],
      correctionTaskFields,
      "CORR-TASK-F-ID",
      {
        sensitivityId: "S3",
        lineageBindings: [{
          refFieldId: "CORR-TASK-F-SOURCE-RESULT-REF",
          versionFieldId: "CORR-TASK-F-SOURCE-RESULT-VERSION",
          targetObjectId: "PUB-OBJ-RESULT",
          targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
        }],
      },
    ),
    object(
      "CORR-OBJ-ATTEMPT",
      "Student Correction Attempt Version",
      {
        dataSubject: "STUDENT_CORRECTION_ANSWER",
        controlSubject: "SCHOOL",
        producerRef: "ROLE-STUDENT",
        ownerRef: "ROLE-STUDENT",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "DUTY-SUBJECT-TEACHER",
      },
      ["SUBMITTED", "JUDGED", "NEEDS_RETRY"],
      correctionAttemptFields,
      "CORR-ATTEMPT-F-ID",
      {
        sensitivityId: "S3",
        lineageBindings: [
          {
            refFieldId: "CORR-ATTEMPT-F-TASK-REF",
            versionFieldId: "CORR-ATTEMPT-F-TASK-VERSION",
            targetObjectId: "CORR-OBJ-TASK",
            targetVersionFieldId: "CORR-TASK-F-TASK-VERSION",
          },
          {
            refFieldId: "CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF",
            versionFieldId: "CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION",
            targetObjectId: "CORR-OBJ-ATTEMPT",
            targetVersionFieldId: "CORR-ATTEMPT-F-CORRECTION-VERSION",
          },
        ],
      },
    ),
    object(
      "CORR-OBJ-INVALIDATION",
      "Result Correction Invalidation Record",
      {
        dataSubject: "DERIVED_LEARNING_INTERPRETATION_INVALIDATION",
        controlSubject: "SCHOOL",
        producerRef: "SYSTEM",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "ROLE-ACADEMIC",
      },
      ["RECORDED"],
      invalidationFields,
      "CORR-INVALIDATION-F-ID",
      {
        sensitivityId: "S3",
        targetKindContract: [
          "EVIDENCE",
          "MASTERY_INTERPRETATION",
          "IMPROVEMENT_CANDIDATE",
          "PLAN_EVALUATION",
          "REPORT_INTERPRETATION",
          "LEARNING_PATH_EXPLANATION",
        ],
        targetStateContract: ["STALE", "INVALIDATED", "PENDING_RECONFIRM"],
        historyPreservation: "RETAIN_ALL_PRIOR_VERSIONS",
        lineageBindings: [
          {
            refFieldId: "CORR-INVALIDATION-F-SOURCE-RESULT-REF",
            versionFieldId: "CORR-INVALIDATION-F-SOURCE-RESULT-VERSION",
            targetObjectId: "PUB-OBJ-RESULT",
            targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
          },
          {
            refFieldId: "CORR-INVALIDATION-F-SOURCE-DECISION-REF",
            versionFieldId: "CORR-INVALIDATION-F-SOURCE-DECISION-VERSION",
            targetObjectId: "GRD-OBJ-DECISION",
            targetVersionFieldId: "GRD-DECISION-F-DECISION-VERSION",
          },
        ],
      },
    ),
  ],
  relationships: [{
    id: "CORR-REL-TASK-ATTEMPT",
    fromObjectId: "CORR-OBJ-TASK",
    toObjectId: "CORR-OBJ-ATTEMPT",
    type: "CONTAINS",
    cardinality: "ONE_TO_MANY",
    ownershipScope: "SAME_STUDENT",
    onSourceInvalidation: "retain every submitted attempt version when the task or its source result is corrected",
  }],
  actions: correctionActions,
  pages: [page(
    "CORR-PAGE-ATTEMPT",
    "Student Correction and Teacher Judgment",
    ["CORR-OBJ-TASK", "CORR-OBJ-ATTEMPT"],
    [...correctionTaskFields, ...correctionAttemptFields].map(({ id }) => id),
    [
      "CORR-ACT-CREATE-TASK",
      "CORR-ACT-SUBMIT-INITIAL",
      "CORR-ACT-SUBMIT-LATE",
      "CORR-ACT-CONFIRM-JUDGMENT",
      "CORR-ACT-REQUEST-RETRY",
      "CORR-ACT-RESUBMIT",
    ],
  )],
});

const studentProfileViewFields = [
  field("STU-PROFILE-F-ID", "Student Management Profile View ID"),
  field("STU-PROFILE-F-STUDENT-REF", "Managed Student Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-STUDENT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
  }),
  field("STU-PROFILE-F-RESULT-DATA-ID", "Source Result Data ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("STU-PROFILE-F-RESULT-REF", "Source Result Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PUB-OBJ-RESULT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "STU-PROFILE-F-RESULT-VERSION",
      targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
    },
  }),
  field("STU-PROFILE-F-RESULT-VERSION", "Source Result Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("STU-PROFILE-F-EVIDENCE-DATA-ID", "Source Evidence Data ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("STU-PROFILE-F-EVIDENCE-REF", "Source Evidence Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "INS-OBJ-EVIDENCE" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "STU-PROFILE-F-EVIDENCE-VERSION",
      targetVersionFieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
    },
  }),
  field("STU-PROFILE-F-EVIDENCE-VERSION", "Source Evidence Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("STU-PROFILE-F-PLAN-DATA-ID", "Source Plan Data ID", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("STU-PROFILE-F-PLAN-REF", "Source Plan Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PLN-OBJ-PLAN" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "STU-PROFILE-F-PLAN-VERSION",
      targetVersionFieldId: "PLN-PLAN-F-PLAN-VERSION",
    },
  }),
  field("STU-PROFILE-F-PLAN-VERSION", "Source Plan Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("STU-PROFILE-F-QUERY-DEFINITION", "Student Profile Query Definition", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("STU-PROFILE-F-COLUMN-DEFINITION", "Student Profile Column Definition", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("STU-PROFILE-F-SAVED-VIEW-DEFINITION", "Saved Student Profile View Definition", {
    dataType: "JSON",
    required: requiredWhen("required when a teacher saves a custom profile view", ["READY"], ["STU-ACT-SAVE-VIEW"]),
  }),
  field("STU-PROFILE-F-PROFILE-VERSION", "Student Profile View Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
];

const studentAttentionFields = [
  field("STU-ATTENTION-F-ID", "Student Attention Record ID"),
  field("STU-ATTENTION-F-PROFILE-REF", "Student Profile View Reference", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "STU-OBJ-PROFILE" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: {
      versionFieldId: "STU-ATTENTION-F-PROFILE-VERSION",
      targetVersionFieldId: "STU-PROFILE-F-PROFILE-VERSION",
    },
  }),
  field("STU-ATTENTION-F-PROFILE-VERSION", "Student Profile View Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("STU-ATTENTION-F-KIND", "Student Attention Event Kind"),
  field("STU-ATTENTION-F-FOLLOW-UP-NOTE", "Student Attention Follow-up Note", { dataType: "TEXT" }),
  field("STU-ATTENTION-F-VERSION", "Student Attention Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
];

const studentProfileFlowPermissions = [
  permission("ALLOW", "SYSTEM", "the verified aggregation Flow builds only source-pinned profile view definitions"),
  permission("DENY", "CURRENT_ACTOR", "a user cannot invoke internal student profile materialization directly"),
];

const studentProfileActions = [
  action({
    id: "STU-ACT-BUILD-PROFILE",
    label: "Build a Source-pinned Student Management Profile",
    operationKind: "CREATE",
    targetObjectId: "STU-OBJ-PROFILE",
    outputFieldIds: [
      "STU-PROFILE-F-ID",
      "STU-PROFILE-F-STUDENT-REF",
      "STU-PROFILE-F-RESULT-DATA-ID",
      "STU-PROFILE-F-RESULT-REF",
      "STU-PROFILE-F-RESULT-VERSION",
      "STU-PROFILE-F-EVIDENCE-DATA-ID",
      "STU-PROFILE-F-EVIDENCE-REF",
      "STU-PROFILE-F-EVIDENCE-VERSION",
      "STU-PROFILE-F-PLAN-DATA-ID",
      "STU-PROFILE-F-PLAN-REF",
      "STU-PROFILE-F-PLAN-VERSION",
      "STU-PROFILE-F-QUERY-DEFINITION",
      "STU-PROFILE-F-COLUMN-DEFINITION",
      "STU-PROFILE-F-PROFILE-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-014"] },
    permissions: studentProfileFlowPermissions,
    successState: "READY",
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    successData: "builds only query, column, view, and pinned lineage definitions without copying source score, evidence, or plan content",
  }),
  action({
    id: "STU-ACT-OPEN-PROFILE",
    label: "Open the Authorized Student Management Profile",
    targetObjectId: "STU-OBJ-PROFILE",
    inputFieldIds: ["STU-PROFILE-F-ID"],
    outputFieldIds: studentProfileViewFields.map(({ id }) => id),
    writes: false,
    permissions: teacherAndHomeroomReadPermissions,
  }),
  action({
    id: "STU-ACT-SAVE-VIEW",
    label: "Save a Student Profile View Definition",
    targetObjectId: "STU-OBJ-PROFILE",
    inputFieldIds: ["STU-PROFILE-F-SAVED-VIEW-DEFINITION"],
    outputFieldIds: [
      "STU-PROFILE-F-SAVED-VIEW-DEFINITION",
      "STU-PROFILE-F-PROFILE-VERSION",
    ],
    permissions: subjectTeacherWritePermissions,
    transition: { from: "READY", to: "READY" },
  }),
  action({
    id: "STU-ACT-CREATE-ATTENTION",
    label: "Create a Student Attention Record",
    operationKind: "CREATE",
    targetObjectId: "STU-OBJ-ATTENTION",
    inputFieldIds: [
      "STU-ATTENTION-F-PROFILE-REF",
      "STU-ATTENTION-F-PROFILE-VERSION",
      "STU-ATTENTION-F-KIND",
      "STU-ATTENTION-F-FOLLOW-UP-NOTE",
    ],
    outputFieldIds: ["STU-ATTENTION-F-ID", "STU-ATTENTION-F-VERSION"],
    permissions: subjectTeacherWritePermissions,
    successState: "OPEN",
  }),
  action({
    id: "STU-ACT-VIEW-ATTENTION",
    label: "View Student Attention Records",
    targetObjectId: "STU-OBJ-ATTENTION",
    inputFieldIds: ["STU-ATTENTION-F-ID"],
    outputFieldIds: studentAttentionFields.map(({ id }) => id),
    writes: false,
    permissions: teacherAndHomeroomReadPermissions,
  }),
];

const studentProfileModule = moduleFact({
  id: "STU-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Source-pinned Student Management Profile",
  objective: "Aggregate authorized profile view definitions and attention records without owning a second score, evidence, or plan fact",
  entryConditions: ["the authorized teacher scope resolves source result, evidence, plan, and todo versions"],
  exitConditions: ["the profile and attention records retain exact source lineage and read-only homeroom coordination"],
  baselineDecisionIds: ["BASE-003", "BASE-008", "BASE-010"],
  nfrIds: ["NFR-008"],
  objects: [
    object(
      "STU-OBJ-PROFILE",
      "Student Profile Query Column and Saved View Definition",
      {
        dataSubject: "STUDENT_MANAGEMENT_VIEW_DEFINITION",
        controlSubject: "SCHOOL",
        producerRef: "SYSTEM",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "DUTY-HOMEROOM",
      },
      ["READY"],
      studentProfileViewFields,
      "STU-PROFILE-F-ID",
      {
        sensitivityId: "S3",
        lineageBindings: [
          {
            refFieldId: "STU-PROFILE-F-RESULT-REF",
            versionFieldId: "STU-PROFILE-F-RESULT-VERSION",
            targetObjectId: "PUB-OBJ-RESULT",
            targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
          },
          {
            refFieldId: "STU-PROFILE-F-EVIDENCE-REF",
            versionFieldId: "STU-PROFILE-F-EVIDENCE-VERSION",
            targetObjectId: "INS-OBJ-EVIDENCE",
            targetVersionFieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
          },
          {
            refFieldId: "STU-PROFILE-F-PLAN-REF",
            versionFieldId: "STU-PROFILE-F-PLAN-VERSION",
            targetObjectId: "PLN-OBJ-PLAN",
            targetVersionFieldId: "PLN-PLAN-F-PLAN-VERSION",
          },
        ],
      },
    ),
    object(
      "STU-OBJ-ATTENTION",
      "Student Attention and Follow-up Record",
      {
        dataSubject: "STUDENT_ATTENTION_COORDINATION",
        controlSubject: "SCHOOL",
        producerRef: "DUTY-SUBJECT-TEACHER",
        ownerRef: "DUTY-SUBJECT-TEACHER",
        confirmerRef: "DUTY-SUBJECT-TEACHER",
        stewardRef: "DUTY-HOMEROOM",
      },
      ["OPEN"],
      studentAttentionFields,
      "STU-ATTENTION-F-ID",
      {
        sensitivityId: "S3",
        lineageBindings: [{
          refFieldId: "STU-ATTENTION-F-PROFILE-REF",
          versionFieldId: "STU-ATTENTION-F-PROFILE-VERSION",
          targetObjectId: "STU-OBJ-PROFILE",
          targetVersionFieldId: "STU-PROFILE-F-PROFILE-VERSION",
        }],
      },
    ),
  ],
  relationships: [{
    id: "STU-REL-ATTENTION-PROFILE",
    fromObjectId: "STU-OBJ-ATTENTION",
    toObjectId: "STU-OBJ-PROFILE",
    type: "REFERENCES",
    cardinality: "MANY_TO_ONE",
    ownershipScope: "SAME_STUDENT",
    onSourceInvalidation: "retain attention history and mark the source profile view version stale",
  }],
  actions: studentProfileActions,
  pages: [
    page(
      "STU-PAGE-PROFILE",
      "Authorized Student Management Profile",
      ["STU-OBJ-PROFILE"],
      studentProfileViewFields.map(({ id }) => id),
      ["STU-ACT-OPEN-PROFILE", "STU-ACT-SAVE-VIEW"],
    ),
    page(
      "STU-PAGE-ATTENTION",
      "Student Attention Follow-up Workspace",
      ["STU-OBJ-ATTENTION"],
      studentAttentionFields.map(({ id }) => id),
      ["STU-ACT-CREATE-ATTENTION", "STU-ACT-VIEW-ATTENTION"],
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

export const teachingLoopEvents = deepFreeze([{
  id: "EVT-CORRECTION-TASK-DUE",
  label: "Correction Task Due",
  definition: "the open correction task reaches its due time without a submitted answer",
  triggeredActionIds: ["CORR-ACT-MARK-OVERDUE"],
}]);

export const teachingLoopModules = deepFreeze([
  hwModule,
  submissionModule,
  gradingModule,
  publicationModule,
  scoreModule,
  evidenceModule,
  planModule,
  studentExecutionModule,
  correctionModule,
  studentProfileModule,
]);
export const teachingLoopFlows = deepFreeze(declareSourceCardinalities([
  {
    id: "DF-004",
    label: "Assignment Validation and Publication",
    phase: PHASE.FIRST,
    routingPolicy: "NONE",
    moduleIds: ["HW-001", "APP-001"],
    steps: [
      { order: 1, actionId: "HW-ACT-VALIDATE-ITEM", condition: "an item is an initial draft" },
      { order: 2, actionId: "HW-ACT-REVALIDATE-ITEM", condition: "an item is a revision draft" },
      { order: 3, actionId: "HW-ACT-VALIDATE", condition: "the assignment is an initial draft" },
      { order: 4, actionId: "HW-ACT-REVALIDATE-REVISION", condition: "the assignment is a revision draft" },
      { order: 5, actionId: "HW-ACT-PREVIEW" },
      { order: 6, actionId: "HW-ACT-PUBLISH-ITEM", condition: "every included item version is validated" },
      { order: 7, actionId: "HW-ACT-PUBLISH-NOW", condition: "the teacher selects immediate publication" },
      { order: 8, actionId: "HW-ACT-SCHEDULE-PUBLISH", condition: "the teacher selects scheduled publication instead of immediate publication" },
      { order: 9, actionId: "APP-ACT-CREATE-HOMEWORK-TODO", condition: "the published assignment version becomes available to the assigned class scope" },
    ],
    sourceDataRefs: [
      {
        objectId: "HW-OBJ-ASSIGNMENT",
        fieldId: "HW-ASSIGNMENT-F-ID",
        version: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      },
      {
        objectId: "HW-OBJ-ASSIGNMENT",
        fieldId: "HW-ASSIGNMENT-F-DUE-AT",
        version: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      },
      {
        objectId: "HW-OBJ-ASSIGNMENT",
        fieldId: "HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS",
        version: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      },
      {
        objectId: "HW-OBJ-ITEM",
        fieldId: "HW-ITEM-F-ID",
        version: "HW-ITEM-F-ITEM-VERSION",
      },
      {
        objectId: "HW-OBJ-ITEM",
        fieldId: "HW-ITEM-F-PROMPT",
        version: "HW-ITEM-F-ITEM-VERSION",
      },
    ],
    targetDataRefs: [
      {
        objectId: "HW-OBJ-ASSIGNMENT",
        fieldId: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
        version: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      },
      {
        objectId: "HW-OBJ-ASSIGNMENT",
        fieldId: "HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS",
        version: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-ID",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-STUDENT-REF",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-SOURCE-ASSIGNMENT-REF",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-SOURCE-ASSIGNMENT-VERSION",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-TASK-DEEP-LINK",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-STUDENT-VISIBLE-AT",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-AGGREGATION-VERSION",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
    ],
    idempotencyKeyParts: {
      identityFieldIds: ["HW-ASSIGNMENT-F-ID"],
      versionFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION", "HW-ITEM-F-ITEM-VERSION"],
      fanoutFieldId: "HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS",
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
    routingPolicy: "NONE",
    moduleIds: ["HW-001", "SUB-001"],
    steps: [
      { order: 1, actionId: "HW-ACT-OPEN-PUBLISHED" },
      {
        order: 2,
        actionId: "SUB-ACT-SAVE-DRAFT",
        providedInputs: provideInputs(
          "ROLE-STUDENT",
          "SUB-DRAFT-F-MEDIA-METADATA",
          "SUB-DRAFT-F-PAGE-ITEM-MAPPING",
        ),
      },
      {
        order: 3,
        actionId: "SUB-ACT-UPLOAD-CHUNK",
        condition: "the answer contains App media",
        providedInputs: provideInputs("ROLE-STUDENT", "SUB-DRAFT-F-PENDING-CHUNK"),
      },
      {
        order: 4,
        actionId: "SUB-ACT-RETRY-UPLOAD",
        condition: "one or more media chunks failed while successful chunks remain accepted",
        providedInputs: provideInputs("ROLE-STUDENT", "SUB-DRAFT-F-PENDING-CHUNK"),
      },
      {
        order: 5,
        actionId: "SUB-ACT-SUBMIT",
        condition: "the server can issue a final submission receipt",
        providedInputs: provideInputs("ROLE-STUDENT", "SUB-ATTEMPT-F-DRAFT-VERSION"),
      },
    ],
    sourceDataRefs: [
      {
        objectId: "HW-OBJ-ASSIGNMENT",
        fieldId: "HW-ASSIGNMENT-F-ID",
        version: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      },
      {
        objectId: "HW-OBJ-ASSIGNMENT",
        fieldId: "HW-ASSIGNMENT-F-TITLE",
        version: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      },
      {
        objectId: "SUB-OBJ-DRAFT",
        fieldId: "SUB-DRAFT-F-ID",
        version: "SUB-DRAFT-F-DRAFT-VERSION",
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
      identityFieldIds: ["HW-ASSIGNMENT-F-ID"],
      versionFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION", "SUB-DRAFT-F-DRAFT-VERSION"],
      fanoutFieldId: "SUB-DRAFT-F-ID",
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
    routingPolicy: "NONE",
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
        fieldId: "SUB-ATTEMPT-F-ID",
        version: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      },
      {
        objectId: "SUB-OBJ-ATTEMPT",
        fieldId: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
        version: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      },
      {
        objectId: "HW-OBJ-ITEM",
        fieldId: "HW-ITEM-F-ID",
        version: "HW-ITEM-F-ITEM-VERSION",
      },
      {
        objectId: "HW-OBJ-ITEM",
        fieldId: "HW-ITEM-F-ITEM-VERSION",
        version: "HW-ITEM-F-ITEM-VERSION",
      },
      {
        objectId: "HW-OBJ-RUBRIC",
        fieldId: "HW-RUBRIC-F-ID",
        version: "HW-RUBRIC-F-RUBRIC-VERSION",
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
      identityFieldIds: ["SUB-ATTEMPT-F-ID", "HW-RUBRIC-F-ID", "GRD-CAP-F-RULE-ID"],
      versionFieldIds: [
        "SUB-ATTEMPT-F-SUBMISSION-VERSION",
        "HW-ITEM-F-ITEM-VERSION",
        "HW-RUBRIC-F-RUBRIC-VERSION",
        "GRD-CAP-F-RULE-VERSION",
      ],
      fanoutFieldId: "HW-ITEM-F-ID",
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
    routingPolicy: "ACTION_CHOICE_REQUIRED",
    moduleIds: ["GRD-001"],
    steps: [
      {
        order: 1,
        actionId: "GRD-ACT-CORRECT-RECOGNITION",
        condition: "recognized answer or region is incorrect",
        providedInputs: provideInputs(
          "DUTY-SUBJECT-TEACHER",
          "GRD-DECISION-F-RECOGNIZED-ANSWER",
          "GRD-DECISION-F-RECOGNIZED-REGION",
          "GRD-DECISION-F-CORRECTION-REASON",
        ),
      },
      {
        order: 2,
        actionId: "GRD-ACT-ACCEPT-SUGGESTION",
        condition: "an eligible suggestion is correct after teacher review",
        providedInputs: provideInputs(
          "DUTY-SUBJECT-TEACHER",
          "GRD-DECISION-F-TEACHER-FEEDBACK",
        ),
      },
      {
        order: 3,
        actionId: "GRD-ACT-OVERRIDE-SCORE",
        condition: "the corresponding subject teacher changes the suggestion with a reason",
        providedInputs: provideInputs(
          "DUTY-SUBJECT-TEACHER",
          "GRD-DECISION-F-CORRECTION-REASON",
        ),
      },
      { order: 4, actionId: "GRD-ACT-MANUAL-GRADE", condition: "AI is unavailable, the combination is unsupported, or the item is subjective" },
      { order: 5, actionId: "GRD-ACT-BATCH-CONFIRM", condition: "every selected item is objective, eligible, and teacher-reviewed" },
      {
        order: 6,
        actionId: "GRD-ACT-RESOLVE-VERSION-CONFLICT",
        condition: "submission, item, or Rubric versions changed before confirmation",
        providedInputs: provideInputs(
          "DUTY-SUBJECT-TEACHER",
          "GRD-DECISION-F-CORRECTION-REASON",
        ),
      },
    ],
    executionPaths: [
      {
        id: "ACCEPT_SUGGESTION",
        stepOrders: [2],
        providedInputs: [],
        route: { kind: "ACTION_CHOICE", consumerStepOrder: 2 },
      },
      {
        id: "CORRECT_RECOGNITION_AND_ACCEPT",
        stepOrders: [1, 2],
        providedInputs: [],
        route: { kind: "ACTION_CHOICE", consumerStepOrder: 2 },
      },
      {
        id: "OVERRIDE_SCORE",
        stepOrders: [3],
        providedInputs: providePathInputs(
          3,
          "DUTY-SUBJECT-TEACHER",
          "GRD-DECISION-F-OFFICIAL-SCORE",
          "GRD-DECISION-F-TEACHER-FEEDBACK",
        ),
        route: { kind: "ACTION_CHOICE", consumerStepOrder: 3 },
      },
      {
        id: "CORRECT_RECOGNITION_AND_OVERRIDE",
        stepOrders: [1, 3],
        providedInputs: providePathInputs(
          3,
          "DUTY-SUBJECT-TEACHER",
          "GRD-DECISION-F-OFFICIAL-SCORE",
          "GRD-DECISION-F-TEACHER-FEEDBACK",
        ),
        route: { kind: "ACTION_CHOICE", consumerStepOrder: 3 },
      },
      {
        id: "MANUAL_GRADE",
        stepOrders: [4],
        providedInputs: providePathInputs(
          4,
          "DUTY-SUBJECT-TEACHER",
          "GRD-DECISION-F-OFFICIAL-SCORE",
          "GRD-DECISION-F-TEACHER-FEEDBACK",
        ),
        route: { kind: "ACTION_CHOICE", consumerStepOrder: 4 },
      },
      {
        id: "BATCH_CONFIRM",
        stepOrders: [5],
        providedInputs: [],
        route: { kind: "ACTION_CHOICE", consumerStepOrder: 5 },
      },
      {
        id: "RESOLVE_VERSION_CONFLICT",
        stepOrders: [6],
        providedInputs: [],
        route: { kind: "ACTION_CHOICE", consumerStepOrder: 6 },
      },
    ],
    sourceDataRefs: [{
      objectId: "GRD-OBJ-DECISION",
      fieldId: "GRD-DECISION-F-ID",
      version: "GRD-DECISION-F-DECISION-VERSION",
    }, {
      objectId: "GRD-OBJ-DECISION",
      fieldId: "GRD-DECISION-F-SUBMISSION-REF",
      version: "GRD-DECISION-F-DECISION-VERSION",
    }, {
      objectId: "GRD-OBJ-DECISION",
      fieldId: "GRD-DECISION-F-SUGGESTED-SCORE",
      version: "GRD-DECISION-F-DECISION-VERSION",
    }, {
      objectId: "GRD-OBJ-DECISION",
      fieldId: "GRD-DECISION-F-SCORING-RATIONALE",
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
      identityFieldIds: ["GRD-DECISION-F-ID"],
      versionFieldIds: ["GRD-DECISION-F-DECISION-VERSION"],
      fanoutFieldId: "GRD-DECISION-F-SUBMISSION-REF",
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
    routingPolicy: "NONE",
    moduleIds: ["GRD-001", "PUB-001", "CORR-001"],
    steps: [
      {
        order: 1,
        actionId: "GRD-ACT-ACCEPT-SUGGESTION",
        condition: "the corresponding subject teacher confirms an eligible objective suggestion",
        providedInputs: provideInputs(
          "DUTY-SUBJECT-TEACHER",
          "GRD-DECISION-F-SUGGESTED-SCORE",
          "GRD-DECISION-F-TEACHER-FEEDBACK",
        ),
      },
      {
        order: 2,
        actionId: "GRD-ACT-OVERRIDE-SCORE",
        condition: "the corresponding subject teacher confirms an overridden score",
        providedInputs: provideInputs(
          "DUTY-SUBJECT-TEACHER",
          "GRD-DECISION-F-CORRECTION-REASON",
        ),
      },
      { order: 3, actionId: "GRD-ACT-MANUAL-GRADE", condition: "the corresponding subject teacher confirms a subjective or manual score" },
      {
        order: 4,
        actionId: "PUB-ACT-PREVIEW",
        providedInputs: provideInputs(
          "DUTY-SUBJECT-TEACHER",
          "PUB-PREVIEW-F-BATCH-REF",
          "PUB-PREVIEW-F-STUDENT-REF",
          "PUB-PREVIEW-F-DECISION-REF",
        ),
      },
      { order: 5, actionId: "PUB-ACT-PREPARE-BATCH", condition: "object-level eligibility and blocking codes are complete" },
      { order: 6, actionId: "PUB-ACT-PUBLISH-SELECTED", condition: "the prepared batch is ready and every subjective score has teacher confirmation" },
      { order: 7, actionId: "PUB-ACT-MATERIALIZE-RESULT", condition: "create one ready result for each eligible selected student" },
      { order: 8, actionId: "PUB-ACT-PUBLISH-RESULT", condition: "the result is ready and its configured visibility policy permits publication" },
      { order: 9, actionId: "CORR-ACT-AUTO-CREATE-TASK", condition: "the published result requires correction and no correction task exists for its exact result version" },
      { order: 10, actionId: "PUB-ACT-FINALIZE-BATCH", condition: "all student result attempts and required correction task creations have an object-level outcome" },
      { order: 11, actionId: "PUB-ACT-RETRY-FAILED", condition: "only object-level failed student results are retried" },
      { order: 12, actionId: "PUB-ACT-RECONCILE-BATCH", condition: "all retried student results now have a terminal object-level outcome" },
    ],
    sourceDataRefs: [
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-ID",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-OFFICIAL-SCORE",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "PUB-OBJ-BATCH",
        fieldId: "PUB-BATCH-F-ID",
        version: "PUB-BATCH-F-BATCH-VERSION",
      },
      {
        objectId: "PUB-OBJ-BATCH",
        fieldId: "PUB-BATCH-F-SELECTED-STUDENT-IDS",
        version: "PUB-BATCH-F-BATCH-VERSION",
      },
      {
        objectId: "PUB-OBJ-BATCH",
        fieldId: "PUB-BATCH-F-STUDENT-SCOPE-SNAPSHOT",
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
        fieldId: "PUB-RESULT-F-SCORE-VISIBLE-AT",
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
      {
        objectId: "CORR-OBJ-TASK",
        fieldId: "CORR-TASK-F-ID",
        version: "CORR-TASK-F-TASK-VERSION",
      },
      {
        objectId: "CORR-OBJ-TASK",
        fieldId: "CORR-TASK-F-STUDENT-REF",
        version: "CORR-TASK-F-TASK-VERSION",
      },
      {
        objectId: "CORR-OBJ-TASK",
        fieldId: "CORR-TASK-F-SOURCE-DATA-ID",
        version: "CORR-TASK-F-TASK-VERSION",
      },
      {
        objectId: "CORR-OBJ-TASK",
        fieldId: "CORR-TASK-F-SOURCE-RESULT-REF",
        version: "CORR-TASK-F-TASK-VERSION",
      },
      {
        objectId: "CORR-OBJ-TASK",
        fieldId: "CORR-TASK-F-SOURCE-RESULT-VERSION",
        version: "CORR-TASK-F-TASK-VERSION",
      },
      {
        objectId: "CORR-OBJ-TASK",
        fieldId: "CORR-TASK-F-DUE-AT",
        version: "CORR-TASK-F-TASK-VERSION",
      },
      {
        objectId: "CORR-OBJ-TASK",
        fieldId: "CORR-TASK-F-TASK-VERSION",
        version: "CORR-TASK-F-TASK-VERSION",
      },
    ],
    idempotencyKeyParts: {
      identityFieldIds: ["GRD-DECISION-F-ID", "PUB-BATCH-F-ID"],
      versionFieldIds: ["GRD-DECISION-F-DECISION-VERSION", "PUB-BATCH-F-BATCH-VERSION"],
      fanoutFieldId: "PUB-BATCH-F-STUDENT-SCOPE-SNAPSHOT",
    },
    failureGranularity: "SELECTED_STUDENT_RESULT_OR_CORRECTION_TASK_OBJECT_WITH_PARTIAL_SUCCESS",
    retryPolicy: {
      strategy: "RETRY_FAILED_STUDENT_RESULTS_OR_CORRECTION_TASKS_ONLY",
      maxAttempts: 5,
      retryableFailureResults: [
        "OBJECT_PUBLICATION_FAILED",
        "SOURCE_VERSION_STALE",
        "VERSION_CONFLICT",
        "AUDIT_FAILED",
      ],
    },
    compensation: {
      strategy: "DO_NOT_UNPUBLISH_SUCCESSFUL_RESULTS",
      description: "retain successful student results and correction tasks, then retry only failed result or correction task objects after eligibility and source versions are rechecked",
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
    routingPolicy: "NONE",
    moduleIds: ["GRD-001", "PUB-001", "INS-001", "PLN-001", "CORR-001"],
    steps: [
      { order: 1, actionId: "PUB-ACT-RESOLVE-DEPENDENCY-SNAPSHOT", condition: "resolve current dependencies against the exact prior published result ID and version before any correction or invalidation write" },
      { order: 2, actionId: "GRD-ACT-OPEN-CONFIRMED-REVISION", condition: "the corresponding subject teacher records the correction reason against the prior confirmed version" },
      { order: 3, actionId: "GRD-ACT-CONFIRM-REVISION", condition: "the corresponding subject teacher confirms the revised score and feedback into a new decision version" },
      { order: 4, actionId: "PUB-ACT-CORRECT-RESULT", condition: "the correction references the new confirmed decision version" },
      { order: 5, actionId: "CORR-ACT-RECORD-INVALIDATION", condition: "the corrected result records every dependent target kind, source version, target version, and history-preservation outcome" },
      { order: 6, actionId: "INS-ACT-MARK-STALE", condition: "evidence or mastery interpretation depends on the corrected result or decision version" },
      { order: 7, actionId: "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM", condition: "an improvement candidate or plan evaluation depends on the invalidated evidence version" },
      { order: 8, actionId: "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION", condition: "the publication-level explanation is regenerated and teacher-reconfirmed while future report and learning-path consumers remain versioned targets" },
    ],
    sourceDataRefs: [
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-ID",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-DECISION-VERSION",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
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
      {
        objectId: "GRD-OBJ-DECISION",
        fieldId: "GRD-DECISION-F-CORRECTION-REASON",
        version: "GRD-DECISION-F-DECISION-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-ID",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-STUDENT-REF",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-RESULT-VERSION",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-CORRECTION-DECISION-REF",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-NEW-DECISION-VERSION",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-PUBLIC-CORRECTION-NOTE",
        version: "PUB-RESULT-F-RESULT-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-ID",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
        cardinality: "ZERO_MANY",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-SOURCE-RESULT-REF",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
        cardinality: "ZERO_MANY",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-SOURCE-RESULT-VERSION",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
        cardinality: "ZERO_MANY",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
        cardinality: "ZERO_MANY",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-ID",
        version: "PLN-PLAN-F-PLAN-VERSION",
        cardinality: "ZERO_MANY",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-SOURCE-EVIDENCE-REF",
        version: "PLN-PLAN-F-PLAN-VERSION",
        cardinality: "ZERO_MANY",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-SOURCE-EVIDENCE-VERSION",
        version: "PLN-PLAN-F-PLAN-VERSION",
        cardinality: "ZERO_MANY",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-PLAN-VERSION",
        version: "PLN-PLAN-F-PLAN-VERSION",
        cardinality: "ZERO_MANY",
      },
    ],
    targetDataRefs: [
      {
        objectId: "PUB-OBJ-DEPENDENCY-SNAPSHOT",
        fieldId: "PUB-DEPENDENCY-SNAPSHOT-F-ID",
        version: "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION",
      },
      {
        objectId: "PUB-OBJ-DEPENDENCY-SNAPSHOT",
        fieldId: "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-REF",
        version: "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION",
      },
      {
        objectId: "PUB-OBJ-DEPENDENCY-SNAPSHOT",
        fieldId: "PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-VERSION",
        version: "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION",
      },
      {
        objectId: "PUB-OBJ-DEPENDENCY-SNAPSHOT",
        fieldId: "PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET",
        version: "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION",
      },
      {
        objectId: "PUB-OBJ-DEPENDENCY-SNAPSHOT",
        fieldId: "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION",
        version: "PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION",
      },
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
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS",
        version: "PUB-RESULT-F-INVALIDATION-VERSION",
      },
      {
        objectId: "CORR-OBJ-INVALIDATION",
        fieldId: "CORR-INVALIDATION-F-ID",
        version: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
      },
      {
        objectId: "CORR-OBJ-INVALIDATION",
        fieldId: "CORR-INVALIDATION-F-TARGET-KINDS",
        version: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
      },
      {
        objectId: "CORR-OBJ-INVALIDATION",
        fieldId: "CORR-INVALIDATION-F-TARGET-TRANSITIONS",
        version: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
      },
      {
        objectId: "CORR-OBJ-INVALIDATION",
        fieldId: "CORR-INVALIDATION-F-TARGET-VERSIONS",
        version: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
      },
      {
        objectId: "CORR-OBJ-INVALIDATION",
        fieldId: "CORR-INVALIDATION-F-TARGET-OUTCOMES",
        version: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
      },
      {
        objectId: "CORR-OBJ-INVALIDATION",
        fieldId: "CORR-INVALIDATION-F-HISTORY-PRESERVATION",
        version: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
      },
      {
        objectId: "CORR-OBJ-INVALIDATION",
        fieldId: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
        version: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-VALIDITY",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-INVALIDATION-REASON",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-INVALIDATION-REF",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-INVALIDATION-VERSION",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-EVALUATION-STATE",
        version: "PLN-PLAN-F-EVALUATION-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-EVALUATION-VERSION",
        version: "PLN-PLAN-F-EVALUATION-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-PLAN-VERSION",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
    ],
    idempotencyKeyParts: {
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
    },
    failureGranularity: "PUBLISHED_STUDENT_RESULT_AND_DEPENDENT_INTERPRETATION_OBJECT",
    retryPolicy: {
      strategy: "REFRESH_RESULT_DECISION_EVIDENCE_AND_PLAN_VERSIONS_THEN_RETRY_FAILED_OBJECTS",
      maxAttempts: 3,
      retryableFailureResults: [
        "STALE_DECISION_VERSION",
        "SOURCE_VERSION_STALE",
        "VERSION_CONFLICT",
        "AUDIT_FAILED",
      ],
    },
    compensation: {
      strategy: "KEEP_PRIOR_RESULT_AND_DEPENDENT_VERSIONS_UNTIL_OBJECT_OUTCOMES_COMMIT",
      description: "a failed correction leaves prior result, evidence, mastery, plan evaluation, report, and learning-path history intact and retries only failed objects",
    },
    downstreamInvalidation: {
      strategy: "VERSION_AND_REQUIRE_RECONFIRMATION_FOR_EVERY_DEPENDENT_TARGET_KIND",
      targets: [
        "EVIDENCE",
        "MASTERY_INTERPRETATION",
        "IMPROVEMENT_CANDIDATE",
        "PLAN_EVALUATION",
        "REPORT_INTERPRETATION",
        "LEARNING_PATH_EXPLANATION",
      ],
    },
  },
  {
    id: "DF-010",
    label: "Correction Submission Judgment and New Evidence",
    phase: PHASE.FIRST,
    routingPolicy: "OPTION_VALUE_REQUIRED",
    moduleIds: ["PUB-001", "INS-001", "PLN-001", "CORR-001"],
    steps: [
      { order: 1, actionId: "PUB-ACT-VIEW-RESULT", condition: "the student's published result and source decision versions are visible" },
      { order: 2, actionId: "CORR-ACT-NORMALIZE-SUBMISSION", condition: "exactly one initial, late, or repeated student submission has reached SUBMITTED" },
      {
        order: 3,
        actionId: "CORR-ACT-CONFIRM-JUDGMENT",
        condition: "the corresponding subject teacher confirms a PASSED or CLOSED correction judgment",
        providedInputs: provideInputs(
          "DUTY-SUBJECT-TEACHER",
          "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
        ),
      },
      { order: 4, actionId: "CORR-ACT-REQUEST-RETRY", condition: "the corresponding subject teacher records NOT-PASSED or NEEDS-MORE and terminates this judgment path in NEEDS_RETRY" },
      { order: 5, actionId: "CORR-ACT-COMPLETE-TASK", condition: "a PASSED or CLOSED judgment completes the exact guarded correction Task before dependent work" },
      { order: 6, actionId: "CORR-ACT-MARK-TASK-AWAITING-RETRY", condition: "a NOT-PASSED or NEEDS-MORE judgment moves the exact guarded correction Task to AWAITING_RETRY and terminates" },
      { order: 7, actionId: "CORR-ACT-RECORD-INVALIDATION", condition: "a PASSED or CLOSED judgment invalidates dependent versions with history retained" },
      { order: 8, actionId: "INS-ACT-MARK-STALE", condition: "the prior evidence depends on the corrected result or decision version" },
      { order: 9, actionId: "PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM", condition: "a plan evaluation depends on the corrected result, decision, evidence, or mastery version" },
      { order: 10, actionId: "INS-ACT-CREATE-CANDIDATE", condition: "the PASSED or CLOSED correction produces a new evidence and mastery candidate" },
      {
        order: 11,
        actionId: "INS-ACT-CONFIRM-MASTERY",
        condition: "the corresponding subject teacher confirms the candidate interpretation",
        providedInputs: provideInputs(
          "DUTY-SUBJECT-TEACHER",
          "INS-EVIDENCE-F-MASTERY-INTERPRETATION",
          "INS-EVIDENCE-F-TEACHER-CONFIRMATION",
        ),
      },
      { order: 12, actionId: "INS-ACT-PUBLISH-INTERPRETATION", condition: "only the teacher-confirmed interpretation becomes student-visible" },
    ],
    executionPaths: [
      {
        id: "PASSED",
        stepOrders: [1, 2, 3, 5, 7, 8, 9, 10, 11, 12],
        providedInputs: [],
        route: {
          kind: "OPTION_VALUE",
          fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
          values: ["PASSED"],
          consumerStepOrder: 3,
        },
      },
      {
        id: "CLOSED",
        stepOrders: [1, 2, 3, 5, 7, 8, 9, 10, 11, 12],
        providedInputs: [],
        route: {
          kind: "OPTION_VALUE",
          fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
          values: ["CLOSED"],
          consumerStepOrder: 3,
        },
      },
      {
        id: "NOT_PASSED",
        stepOrders: [1, 2, 4, 6],
        providedInputs: providePathInputs(
          4,
          "DUTY-SUBJECT-TEACHER",
          "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
        ),
        route: {
          kind: "OPTION_VALUE",
          fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
          values: ["NOT-PASSED"],
          consumerStepOrder: 4,
        },
      },
      {
        id: "NEEDS_MORE",
        stepOrders: [1, 2, 4, 6],
        providedInputs: providePathInputs(
          4,
          "DUTY-SUBJECT-TEACHER",
          "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
        ),
        route: {
          kind: "OPTION_VALUE",
          fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
          values: ["NEEDS-MORE"],
          consumerStepOrder: 4,
        },
      },
    ],
    sourceDataRefs: [
      {
        objectId: "PUB-OBJ-RESULT",
        fieldId: "PUB-RESULT-F-ID",
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
        objectId: "CORR-OBJ-TASK",
        fieldId: "CORR-TASK-F-ID",
        version: "CORR-TASK-F-TASK-VERSION",
      },
      {
        objectId: "CORR-OBJ-TASK",
        fieldId: "CORR-TASK-F-STUDENT-REF",
        version: "CORR-TASK-F-TASK-VERSION",
      },
      {
        objectId: "CORR-OBJ-TASK",
        fieldId: "CORR-TASK-F-SOURCE-RESULT-REF",
        version: "CORR-TASK-F-TASK-VERSION",
      },
      {
        objectId: "CORR-OBJ-TASK",
        fieldId: "CORR-TASK-F-SOURCE-RESULT-VERSION",
        version: "CORR-TASK-F-TASK-VERSION",
      },
      {
        objectId: "CORR-OBJ-TASK",
        fieldId: "CORR-TASK-F-TASK-VERSION",
        version: "CORR-TASK-F-TASK-VERSION",
      },
      {
        objectId: "CORR-OBJ-ATTEMPT",
        fieldId: "CORR-ATTEMPT-F-ID",
        version: "CORR-ATTEMPT-F-CORRECTION-VERSION",
      },
      {
        objectId: "CORR-OBJ-ATTEMPT",
        fieldId: "CORR-ATTEMPT-F-TASK-REF",
        version: "CORR-ATTEMPT-F-CORRECTION-VERSION",
      },
      {
        objectId: "CORR-OBJ-ATTEMPT",
        fieldId: "CORR-ATTEMPT-F-TASK-VERSION",
        version: "CORR-ATTEMPT-F-CORRECTION-VERSION",
      },
      {
        objectId: "CORR-OBJ-ATTEMPT",
        fieldId: "CORR-ATTEMPT-F-CORRECTION-ANSWER",
        version: "CORR-ATTEMPT-F-CORRECTION-VERSION",
      },
      {
        objectId: "CORR-OBJ-ATTEMPT",
        fieldId: "CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT",
        version: "CORR-ATTEMPT-F-CORRECTION-VERSION",
      },
      {
        objectId: "CORR-OBJ-ATTEMPT",
        fieldId: "CORR-ATTEMPT-F-CORRECTION-VERSION",
        version: "CORR-ATTEMPT-F-CORRECTION-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-ID",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-SOURCE-RESULT-REF",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-SOURCE-RESULT-VERSION",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-ID",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-SOURCE-EVIDENCE-REF",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-SOURCE-EVIDENCE-VERSION",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-PLAN-VERSION",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
    ],
    targetDataRefs: [
      {
        objectId: "CORR-OBJ-ATTEMPT",
        fieldId: "CORR-ATTEMPT-F-TEACHER-JUDGMENT",
        version: "CORR-ATTEMPT-F-CORRECTION-VERSION",
      },
      {
        objectId: "CORR-OBJ-ATTEMPT",
        fieldId: "CORR-ATTEMPT-F-CORRECTION-VERSION",
        version: "CORR-ATTEMPT-F-CORRECTION-VERSION",
      },
      {
        objectId: "CORR-OBJ-INVALIDATION",
        fieldId: "CORR-INVALIDATION-F-ID",
        version: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
      },
      {
        objectId: "CORR-OBJ-INVALIDATION",
        fieldId: "CORR-INVALIDATION-F-TARGET-KINDS",
        version: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
      },
      {
        objectId: "CORR-OBJ-INVALIDATION",
        fieldId: "CORR-INVALIDATION-F-TARGET-TRANSITIONS",
        version: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
      },
      {
        objectId: "CORR-OBJ-INVALIDATION",
        fieldId: "CORR-INVALIDATION-F-TARGET-VERSIONS",
        version: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
      },
      {
        objectId: "CORR-OBJ-INVALIDATION",
        fieldId: "CORR-INVALIDATION-F-HISTORY-PRESERVATION",
        version: "CORR-INVALIDATION-F-INVALIDATION-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-ID",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-VALIDITY",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-RESULT",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-TEACHER-CONFIRMATION",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-STUDENT-VISIBLE-AT",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-INVALIDATION-REF",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-EVALUATION-STATE",
        version: "PLN-PLAN-F-EVALUATION-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-EVALUATION-VERSION",
        version: "PLN-PLAN-F-EVALUATION-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-PLAN-VERSION",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
    ],
    idempotencyKeyParts: {
      identityFieldIds: [
        "PUB-RESULT-F-ID",
        "CORR-TASK-F-ID",
        "CORR-ATTEMPT-F-ID",
        "PLN-PLAN-F-ID",
      ],
      versionFieldIds: [
        "PUB-RESULT-F-RESULT-VERSION",
        "CORR-TASK-F-TASK-VERSION",
        "CORR-ATTEMPT-F-CORRECTION-VERSION",
        "INS-EVIDENCE-F-EVIDENCE-VERSION",
        "PLN-PLAN-F-PLAN-VERSION",
      ],
      fanoutFieldId: "INS-EVIDENCE-F-ID",
    },
    failureGranularity: "CORRECTION_AND_DEPENDENT_EVIDENCE_OBJECT",
    retryPolicy: {
      strategy: "REFRESH_RESULT_EVIDENCE_AND_CORRECTION_VERSIONS_THEN_RETRY_FAILED_OBJECTS",
      maxAttempts: 3,
      retryableFailureResults: ["VERSION_CONFLICT", "AUDIT_FAILED"],
    },
    compensation: {
      strategy: "KEEP_PRIOR_VISIBLE_RESULT_AND_EVIDENCE_HISTORY",
      description: "a failed correction or invalidation leaves prior visible versions intact and retries only failed dependent objects",
    },
    downstreamInvalidation: {
      strategy: "VERSION_AND_RECONFIRM_EVERY_DEPENDENT_INTERPRETATION",
      targets: [
        "EVIDENCE",
        "MASTERY_INTERPRETATION",
        "IMPROVEMENT_CANDIDATE",
        "PLAN_EVALUATION",
        "REPORT_INTERPRETATION",
        "LEARNING_PATH_EXPLANATION",
      ],
    },
  },
  {
    id: "DF-012",
    label: "Improvement Candidate to Subject Plan and Cross-subject Coordination",
    phase: PHASE.FIRST,
    routingPolicy: "NONE",
    moduleIds: ["INS-001", "PLN-001", "APP-001"],
    steps: [
      { order: 1, actionId: "INS-ACT-READ-CONFIRMED-EVIDENCE", condition: "the evidence and mastery interpretation are teacher-confirmed and current" },
      { order: 2, actionId: "PLN-ACT-CREATE-CANDIDATE", condition: "the evidence supports a versioned improvement candidate" },
      {
        order: 3,
        actionId: "PLN-ACT-CONFIRM-PLAN",
        condition: "the corresponding subject teacher confirms the plan content",
        providedInputs: provideInputs(
          "DUTY-SUBJECT-TEACHER",
          "PLN-PLAN-F-GOAL",
          "PLN-PLAN-F-TASK-CONTENT",
          "PLN-PLAN-F-WORKLOAD",
          "PLN-PLAN-F-DUE-AT",
          "PLN-PLAN-F-SUCCESS-CONDITION",
          "PLN-PLAN-F-EVIDENCE-REQUIREMENT",
          "PLN-PLAN-F-REVALIDATION-METHOD",
          "PLN-PLAN-F-TEACHER-CONFIRMER-REF",
        ),
      },
      { order: 4, actionId: "PLN-ACT-SYNC-SUBJECT-TEACHER", condition: "the confirmed plan creates a subject-teacher synchronization output" },
      { order: 5, actionId: "PLN-ACT-SYNC-HOMEROOM-COORDINATION", condition: "the confirmed plan creates a distinct read-only homeroom coordination output" },
      { order: 6, actionId: "APP-ACT-CREATE-PLAN-TODO", condition: "the student todo receives only a source-pinned plan deep link and local execution state" },
    ],
    sourceDataRefs: [
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-ID",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-STUDENT-REF",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-KNOWLEDGE-POINT-REF",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-RESULT",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-TEACHER-CONFIRMATION",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
    ],
    targetDataRefs: [
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-ID",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-SOURCE-EVIDENCE-REF",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-SOURCE-EVIDENCE-VERSION",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-PLAN-VERSION",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
      {
        objectId: "PLN-OBJ-SUBJECT-SYNC",
        fieldId: "PLN-SUBJECT-SYNC-F-OUTPUT-VERSION",
        version: "PLN-SUBJECT-SYNC-F-OUTPUT-VERSION",
      },
      {
        objectId: "PLN-OBJ-HOMEROOM-COORDINATION",
        fieldId: "PLN-HOMEROOM-F-OUTPUT-VERSION",
        version: "PLN-HOMEROOM-F-OUTPUT-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-ID",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-STUDENT-REF",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-SOURCE-PLAN-REF",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-SOURCE-PLAN-VERSION",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-TASK-DEEP-LINK",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-STUDENT-VISIBLE-AT",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-AGGREGATION-VERSION",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
    ],
    idempotencyKeyParts: {
      identityFieldIds: ["INS-EVIDENCE-F-ID"],
      versionFieldIds: ["INS-EVIDENCE-F-EVIDENCE-VERSION"],
      fanoutFieldId: "INS-EVIDENCE-F-STUDENT-REF",
    },
    failureGranularity: "STUDENT_SUBJECT_PLAN_AND_SYNC_OUTPUT_OBJECT",
    retryPolicy: {
      strategy: "RETRY_FAILED_SYNC_OR_TODO_OUTPUT_AFTER_SOURCE_VERSION_REFRESH",
      maxAttempts: 4,
      retryableFailureResults: ["SYNC_DELIVERY_FAILED", "VERSION_CONFLICT", "AUDIT_FAILED"],
    },
    compensation: {
      strategy: "KEEP_CONFIRMED_PLAN_AND_RETRY_ONLY_FAILED_OUTPUTS",
      description: "a sync failure never rolls back the teacher-confirmed plan and never grants homeroom plan-content mutation",
    },
    downstreamInvalidation: {
      strategy: "INVALIDATE_STALE_PLAN_OUTPUTS_BY_OBJECT_VERSION",
      targets: ["subject teacher sync output", "homeroom coordination output", "student todo deep link"],
    },
  },
  {
    id: "DF-014",
    label: "Student Management Profile Aggregation",
    phase: PHASE.FIRST,
    routingPolicy: "NONE",
    moduleIds: ["SCO-001", "INS-001", "PLN-001", "APP-001", "STU-001"],
    steps: [
      { order: 1, actionId: "SCO-ACT-READ-GRADEBOOK", condition: "the score view resolves exact PUB, INS, and PLN source versions" },
      { order: 2, actionId: "INS-ACT-READ-CONFIRMED-EVIDENCE", condition: "the authorized evidence version is current" },
      { order: 3, actionId: "PLN-ACT-VIEW-HOMEROOM-COORDINATION", condition: "the coordination output remains read-only and version-pinned" },
      { order: 4, actionId: "APP-ACT-REFRESH-TODOS", condition: "student todo links refresh without copying source task content" },
      { order: 5, actionId: "STU-ACT-BUILD-PROFILE", condition: "the profile materializes only query, column, saved-view, and source-lineage definitions" },
    ],
    sourceDataRefs: [
      {
        objectId: "SCO-OBJ-VIEW",
        fieldId: "SCO-VIEW-F-ID",
        version: "SCO-VIEW-F-VIEW-VERSION",
      },
      {
        objectId: "SCO-OBJ-VIEW",
        fieldId: "SCO-VIEW-F-RESULT-REF",
        version: "SCO-VIEW-F-VIEW-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-ID",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "INS-OBJ-EVIDENCE",
        fieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
        version: "INS-EVIDENCE-F-EVIDENCE-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-ID",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
      {
        objectId: "PLN-OBJ-PLAN",
        fieldId: "PLN-PLAN-F-PLAN-VERSION",
        version: "PLN-PLAN-F-PLAN-VERSION",
      },
      {
        objectId: "PLN-OBJ-HOMEROOM-COORDINATION",
        fieldId: "PLN-HOMEROOM-F-ID",
        version: "PLN-HOMEROOM-F-OUTPUT-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-ID",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-STUDENT-REF",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
    ],
    targetDataRefs: [
      {
        objectId: "APP-OBJ-TODO",
        fieldId: "APP-TODO-F-AGGREGATION-VERSION",
        version: "APP-TODO-F-AGGREGATION-VERSION",
      },
      {
        objectId: "STU-OBJ-PROFILE",
        fieldId: "STU-PROFILE-F-ID",
        version: "STU-PROFILE-F-PROFILE-VERSION",
      },
      {
        objectId: "STU-OBJ-PROFILE",
        fieldId: "STU-PROFILE-F-RESULT-REF",
        version: "STU-PROFILE-F-PROFILE-VERSION",
      },
      {
        objectId: "STU-OBJ-PROFILE",
        fieldId: "STU-PROFILE-F-RESULT-VERSION",
        version: "STU-PROFILE-F-PROFILE-VERSION",
      },
      {
        objectId: "STU-OBJ-PROFILE",
        fieldId: "STU-PROFILE-F-EVIDENCE-REF",
        version: "STU-PROFILE-F-PROFILE-VERSION",
      },
      {
        objectId: "STU-OBJ-PROFILE",
        fieldId: "STU-PROFILE-F-EVIDENCE-VERSION",
        version: "STU-PROFILE-F-PROFILE-VERSION",
      },
      {
        objectId: "STU-OBJ-PROFILE",
        fieldId: "STU-PROFILE-F-PLAN-REF",
        version: "STU-PROFILE-F-PROFILE-VERSION",
      },
      {
        objectId: "STU-OBJ-PROFILE",
        fieldId: "STU-PROFILE-F-PLAN-VERSION",
        version: "STU-PROFILE-F-PROFILE-VERSION",
      },
      {
        objectId: "STU-OBJ-PROFILE",
        fieldId: "STU-PROFILE-F-QUERY-DEFINITION",
        version: "STU-PROFILE-F-PROFILE-VERSION",
      },
      {
        objectId: "STU-OBJ-PROFILE",
        fieldId: "STU-PROFILE-F-COLUMN-DEFINITION",
        version: "STU-PROFILE-F-PROFILE-VERSION",
      },
      {
        objectId: "STU-OBJ-PROFILE",
        fieldId: "STU-PROFILE-F-PROFILE-VERSION",
        version: "STU-PROFILE-F-PROFILE-VERSION",
      },
    ],
    idempotencyKeyParts: {
      identityFieldIds: [
        "SCO-VIEW-F-ID",
        "INS-EVIDENCE-F-ID",
        "PLN-PLAN-F-ID",
        "PLN-HOMEROOM-F-ID",
        "APP-TODO-F-ID",
      ],
      versionFieldIds: [
        "SCO-VIEW-F-VIEW-VERSION",
        "INS-EVIDENCE-F-EVIDENCE-VERSION",
        "PLN-PLAN-F-PLAN-VERSION",
        "PLN-HOMEROOM-F-OUTPUT-VERSION",
        "APP-TODO-F-AGGREGATION-VERSION",
      ],
      fanoutFieldId: "APP-TODO-F-STUDENT-REF",
    },
    failureGranularity: "STUDENT_PROFILE_SOURCE_AND_PROJECTION_OBJECT",
    retryPolicy: {
      strategy: "REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_PROFILE_OBJECTS",
      maxAttempts: 3,
      retryableFailureResults: ["SOURCE_VERSION_STALE", "VERSION_CONFLICT", "AUDIT_FAILED"],
    },
    compensation: {
      strategy: "KEEP_PRIOR_PROFILE_AND_TODO_VIEW_VERSIONS",
      description: "a failed aggregation preserves the prior view definitions and retries only stale or failed student objects",
    },
    downstreamInvalidation: {
      strategy: "INVALIDATE_ONLY_STALE_PROFILE_AND_TODO_PROJECTIONS",
      targets: ["gradebook view definition", "student profile view definition", "student todo aggregation"],
    },
  },
]));
