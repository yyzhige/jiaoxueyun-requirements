import { CLIENT, PHASE, RISK, deepFreeze, defineModule } from "../model.mjs";

const WEB_APP = [CLIENT.WEB, CLIENT.APP];
const USER_TASK = "USER_TASK";
const IN_PRODUCT_CHANNEL = "IN_PRODUCT";

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

function object(
  id,
  label,
  responsibility,
  lifecyclePolicyId,
  states,
  fields,
  stateReachability,
  overrides = {},
) {
  return {
    id,
    label,
    ...responsibility,
    lifecyclePolicyId,
    sensitivityId: "S3",
    readMode: "NO_DIRECT_READ",
    stateReachability,
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

function permission(effect, actorRef, condition, scope) {
  return {
    effect,
    ...actorReference(actorRef),
    condition,
    ...(scope ? { scope } : {}),
  };
}

function action({
  id,
  label,
  targetObjectId,
  inputFieldIds = [],
  relatedStateGuards,
  outputFieldIds = [],
  operationKind,
  writes,
  transition,
  successState,
  risk,
  executionMode = USER_TASK,
  trigger,
  permissions,
  failureResults,
  channel,
}) {
  const effectiveOperationKind = operationKind
    ?? (writes === false ? "READ" : transition ? "UPDATE" : "CREATE");
  const effectiveWrites = effectiveOperationKind !== "READ";
  const effectiveRisk = risk ?? (effectiveWrites ? RISK.LOW : RISK.READ);
  const effectiveFailureResults = failureResults
    ?? (effectiveWrites
      ? ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT"]
      : ["PERMISSION_DENIED", "NOT_FOUND"]);
  const closedFailureResults = effectiveRisk === RISK.HIGH
    ? [...new Set([...effectiveFailureResults, "AUDIT_FAILED"])]
    : effectiveFailureResults;
  const successScenario = {
    id: `${id}-SCN-SUCCESS`,
    kind: "SUCCESS",
    actionId: id,
    ...(executionMode === USER_TASK ? {} : { trigger }),
    given: `the actor meets the entry conditions for ${label}`,
    when: `the actor requests ${label}`,
    then: {
      expectedData: `${label} returns the accepted versioned result`,
      expectedState: effectiveWrites
        ? { mode: "STATE", value: successState ?? transition?.to }
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
    ...(executionMode === USER_TASK ? {} : { trigger }),
    given: `${resultCode} applies to ${label}`,
    when: `the actor requests ${label}`,
    then: {
      expectedData: `${label} returns ${resultCode} without hidden writes`,
      expectedState: { mode: "UNCHANGED" },
      expectedPermission: "DENY",
      expectedVisibility: "no data outside the authorized scope",
    },
  }));
  return {
    action: {
      id,
      label,
      targetObjectId,
      inputFieldIds,
      ...(relatedStateGuards ? { relatedStateGuards } : {}),
      outputFieldIds,
      ...(transition ? { transition } : {}),
      operationKind: effectiveOperationKind,
      writes: effectiveWrites,
      risk: effectiveRisk,
      executionMode,
      ...(executionMode === USER_TASK ? { clients: WEB_APP } : { trigger }),
      permissions,
      ...(channel ? { channel } : {}),
      scenarioIds: [successScenario.id, ...failureScenarios.map(({ id: scenarioId }) => scenarioId)],
      ...(effectiveWrites ? {
        idempotencyKey: `${id}:school:object:source-version:request-id`,
      } : {}),
      auditMode: effectiveWrites ? "REQUIRED" : "NOT_REQUIRED",
      failureResults: closedFailureResults,
    },
    scenarios: [successScenario, ...failureScenarios],
  };
}

function page(id, label, objectIds, fieldIds, actionIds) {
  return {
    id,
    label,
    clients: WEB_APP,
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
    for (const actionId of pageValue.actionIds) pageByActionId.set(actionId, pageValue.id);
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
  dataSubject: "SUBJECT_TEACHING_TASK",
  controlSubject: "SCHOOL",
  producerRef: "DUTY-SUBJECT-TEACHER",
  ownerRef: "DUTY-SUBJECT-TEACHER",
  confirmerRef: "DUTY-SUBJECT-TEACHER",
  stewardRef: "DUTY-HOMEROOM",
};

const systemSubjectTeacherResponsibility = {
  ...subjectTeacherResponsibility,
  producerRef: "SYSTEM",
};

const teacherWritePermissions = [
  permission(
    "ALLOW",
    "DUTY-SUBJECT-TEACHER",
    "the corresponding subject teacher acts inside assigned subject, class, and student scope",
  ),
  permission(
    "DENY",
    "ROLE-STUDENT",
    "a student attempts to create or manage a teacher-owned definition or reminder",
  ),
  permission(
    "DENY",
    "ROLE-PLATFORM-OPS",
    "platform operations has no default access to student learning detail",
  ),
];

const aixPreviewFields = [
  identityField("AIX-PREVIEW-F-ID", "AI Task Preview ID"),
  field("AIX-PREVIEW-F-TASK-ID", "Registered AI Task ID"),
  field("AIX-PREVIEW-F-TARGET-ACTION-ID", "Target Action ID", {
    dataType: "ID",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-016" },
  }),
  field("AIX-PREVIEW-F-PARAMETERS", "Resolved Parameters", { dataType: "JSON" }),
  field("AIX-PREVIEW-F-PERMISSION-RESULT", "Permission Result", {
    valueSource: { kind: "SYSTEM" },
    mutability: "READ_ONLY",
  }),
  field("AIX-PREVIEW-F-SOURCE-VERSIONS", "Source Versions", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("AIX-PREVIEW-F-PAYLOAD", "Structured Preview Payload", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "READ_ONLY",
  }),
  field("AIX-PREVIEW-F-EXPIRES-AT", "Preview Expiry Time", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "READ_ONLY",
  }),
  versionField("AIX-PREVIEW-F-VERSION", "AI Task Preview Version"),
];

const prepareAiPreview = action({
  id: "AIX-ACT-PREPARE-TASK-PREVIEW",
  label: "Prepare a Registered AI Task Preview",
  targetObjectId: "AIX-OBJ-TASK-PREVIEW",
  inputFieldIds: [
    "AIX-PREVIEW-F-TASK-ID",
    "AIX-PREVIEW-F-TARGET-ACTION-ID",
    "AIX-PREVIEW-F-PARAMETERS",
  ],
  outputFieldIds: [
    "AIX-PREVIEW-F-ID",
    "AIX-PREVIEW-F-PERMISSION-RESULT",
    "AIX-PREVIEW-F-SOURCE-VERSIONS",
    "AIX-PREVIEW-F-PAYLOAD",
    "AIX-PREVIEW-F-EXPIRES-AT",
    "AIX-PREVIEW-F-VERSION",
  ],
  successState: "PREVIEW_READY",
  permissions: teacherWritePermissions,
});

const aixModule = moduleFact({
  id: "AIX-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "AI Conversation and Controlled Task Preview",
  objective: "Resolve registered Web and App AI tasks into authorized structured previews without creating a second business fact",
  entryConditions: ["the user selects an active school, term, role, and authorized AI task"],
  exitConditions: ["the preview names one target Action and retains permission and source-version results"],
  baselineDecisionIds: ["BASE-003", "BASE-007", "BASE-009"],
  nfrIds: ["NFR-006", "NFR-008"],
  objects: [object(
    "AIX-OBJ-TASK-PREVIEW",
    "Temporary Registered AI Task Preview",
    subjectTeacherResponsibility,
    "LIFE-005",
    ["PREVIEW_READY"],
    aixPreviewFields,
    { mode: "NONE" })],
  relationships: [],
  actions: [prepareAiPreview],
  pages: [page(
    "AIX-PAGE-CONVERSATION",
    "AI Conversation and Structured Confirmation",
    ["AIX-OBJ-TASK-PREVIEW"],
    aixPreviewFields.map(({ id }) => id),
    ["AIX-ACT-PREPARE-TASK-PREVIEW"],
  )],
});

const reportDefinitionFields = [
  identityField("RPT-DEFINITION-F-ID", "Report Definition ID"),
  field("RPT-DEFINITION-F-NAME", "Report Name"),
  field("RPT-DEFINITION-F-METRIC-IDS", "Report Metric IDs", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-037" },
  }),
  field("RPT-DEFINITION-F-DATA-SCOPE", "Authorized Data Scope", { dataType: "JSON" }),
  field("RPT-DEFINITION-F-TIME-RANGE", "Report Time Range", { dataType: "JSON" }),
  versionField("RPT-DEFINITION-F-VERSION", "Report Definition Version"),
];
const reportSubscriptionFields = [
  identityField("RPT-SUBSCRIPTION-F-ID", "Report Subscription ID"),
  {
    ...versionPinnedField(
      "RPT-SUBSCRIPTION-F-DEFINITION-REF",
      "Subscribed Report Definition",
      "RPT-OBJ-DEFINITION",
      "RPT-SUBSCRIPTION-F-DEFINITION-VERSION",
      "RPT-DEFINITION-F-VERSION",
    ),
    required: true,
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["RPT-ACT-CREATE-SUBSCRIPTION"] },
  },
  {
    ...pinnedVersionField(
      "RPT-SUBSCRIPTION-F-DEFINITION-VERSION",
      "Subscribed Report Definition Version",
    ),
    required: true,
  },
  field("RPT-SUBSCRIPTION-F-SCHEDULE-FREQUENCY", "Schedule Frequency", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-014" },
  }),
  field("RPT-SUBSCRIPTION-F-EXECUTION-TIME", "Scheduled Execution Time", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-036" },
  }),
  field("RPT-SUBSCRIPTION-F-TIMEZONE", "Schedule Timezone", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-035" },
  }),
  field("RPT-SUBSCRIPTION-F-RECIPIENTS", "Authorized Report Recipients", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-015" },
  }),
  versionField("RPT-SUBSCRIPTION-F-VERSION", "Report Subscription Version"),
];
const reportRunFields = [
  identityField("RPT-RUN-F-ID", "Report Run ID"),
  {
    ...versionPinnedField(
      "RPT-RUN-F-DEFINITION-REF",
      "Run Report Definition",
      "RPT-OBJ-DEFINITION",
      "RPT-RUN-F-DEFINITION-VERSION",
      "RPT-DEFINITION-F-VERSION",
    ),
    required: true,
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: {
      requiredActionIds: ["RPT-ACT-CREATE-AD-HOC-RUN", "RPT-ACT-CREATE-RUN"],
    },
  },
  {
    ...pinnedVersionField("RPT-RUN-F-DEFINITION-VERSION", "Run Report Definition Version"),
    required: true,
  },
  {
    ...versionPinnedField(
      "RPT-RUN-F-SUBSCRIPTION-REF",
      "Run Report Subscription",
      "RPT-OBJ-SUBSCRIPTION",
      "RPT-RUN-F-SUBSCRIPTION-VERSION",
      "RPT-SUBSCRIPTION-F-VERSION",
    ),
    required: {
      description: "required only for a periodic report run",
      whenStates: ["QUEUED"],
      whenActionIds: ["RPT-ACT-CREATE-RUN"],
    },
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["RPT-ACT-CREATE-RUN"] },
  },
  {
    ...pinnedVersionField("RPT-RUN-F-SUBSCRIPTION-VERSION", "Run Report Subscription Version"),
    required: {
      description: "required only for a periodic report run",
      whenStates: ["QUEUED"],
      whenActionIds: ["RPT-ACT-CREATE-RUN"],
    },
  },
  field("RPT-RUN-F-DATA-CUTOFF", "Run Data Cutoff", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("RPT-RUN-F-PERMISSION-RESULT", "Run Permission Result", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("RPT-RUN-F-SOURCE-VERSIONS", "Pinned Run Source Versions", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("RPT-RUN-F-RESULT", "Report Run Result", {
    dataType: "JSON",
    required: {
      description: "required when a report run succeeds",
      whenStates: ["SUCCEEDED"],
      whenActionIds: ["RPT-ACT-COMPLETE-RUN"],
    },
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  versionField("RPT-RUN-F-VERSION", "Report Run Version"),
];
const reportSnapshotFields = [
  identityField("RPT-SNAPSHOT-F-ID", "Report Snapshot ID"),
  field("RPT-SNAPSHOT-F-RUN-REF", "Source Report Run", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "RPT-OBJ-RUN" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["RPT-ACT-MATERIALIZE-SNAPSHOT"] },
    versionBinding: {
      versionFieldId: "RPT-SNAPSHOT-F-RUN-VERSION",
      targetVersionFieldId: "RPT-RUN-F-VERSION",
    },
  }),
  field("RPT-SNAPSHOT-F-RUN-VERSION", "Source Report Run Version", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("RPT-SNAPSHOT-F-SOURCE-VERSIONS", "Snapshot Source Versions", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("RPT-SNAPSHOT-F-DATA-CUTOFF", "Snapshot Data Cutoff", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("RPT-SNAPSHOT-F-PERMISSION-RESULT", "Snapshot Permission Result", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("RPT-SNAPSHOT-F-RUN-RESULT", "Snapshot Run Result", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  versionField("RPT-SNAPSHOT-F-VERSION", "Report Snapshot Version"),
];
const reportDeliveryFields = [
  identityField("RPT-DELIVERY-F-ID", "Report Delivery ID"),
  {
    ...versionPinnedField(
      "RPT-DELIVERY-F-SNAPSHOT-REF",
      "Delivered Report Snapshot",
      "RPT-OBJ-SNAPSHOT",
      "RPT-DELIVERY-F-SNAPSHOT-VERSION",
      "RPT-SNAPSHOT-F-VERSION",
    ),
    required: true,
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["RPT-ACT-CREATE-DELIVERY"] },
  },
  {
    ...pinnedVersionField("RPT-DELIVERY-F-SNAPSHOT-VERSION", "Delivered Report Snapshot Version"),
    required: true,
  },
  field("RPT-DELIVERY-F-RECIPIENTS", "Delivery Recipients", {
    dataType: "STRING_ARRAY",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("RPT-DELIVERY-F-CHANNEL", "Delivery Channel", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-047" },
    mutability: "IMMUTABLE",
  }),
  field("RPT-DELIVERY-F-STATE", "Report Delivery State", {
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  versionField("RPT-DELIVERY-F-VERSION", "Report Delivery Version"),
];

const reportFlowPermissions = [
  permission("ALLOW", "SYSTEM", "the verified report Flow writes only authorized source-pinned report records"),
  permission("DENY", "CURRENT_ACTOR", "a user cannot invoke an internal report materialization action directly"),
];

const reportEventPermissions = [
  permission("ALLOW", "SYSTEM", "the verified report event updates only the target run or delivery"),
  permission("DENY", "CURRENT_ACTOR", "a user cannot invoke report state events directly"),
];

const reportActions = [
  action({
    id: "RPT-ACT-CREATE-AD-HOC-DEFINITION",
    label: "Create an Ad-hoc Report Definition",
    targetObjectId: "RPT-OBJ-DEFINITION",
    inputFieldIds: [
      "RPT-DEFINITION-F-NAME",
      "RPT-DEFINITION-F-METRIC-IDS",
      "RPT-DEFINITION-F-DATA-SCOPE",
      "RPT-DEFINITION-F-TIME-RANGE",
    ],
    outputFieldIds: ["RPT-DEFINITION-F-ID", "RPT-DEFINITION-F-VERSION"],
    successState: "ACTIVE",
    permissions: teacherWritePermissions,
  }),
  action({
    id: "RPT-ACT-CREATE-SUBSCRIPTION",
    label: "Create a Report Subscription",
    targetObjectId: "RPT-OBJ-SUBSCRIPTION",
    inputFieldIds: [
      "RPT-SUBSCRIPTION-F-DEFINITION-REF",
      "RPT-SUBSCRIPTION-F-DEFINITION-VERSION",
      "RPT-SUBSCRIPTION-F-SCHEDULE-FREQUENCY",
      "RPT-SUBSCRIPTION-F-EXECUTION-TIME",
      "RPT-SUBSCRIPTION-F-TIMEZONE",
      "RPT-SUBSCRIPTION-F-RECIPIENTS",
    ],
    relatedStateGuards: [{
      refFieldId: "RPT-SUBSCRIPTION-F-DEFINITION-REF",
      versionFieldId: "RPT-SUBSCRIPTION-F-DEFINITION-VERSION",
      targetObjectId: "RPT-OBJ-DEFINITION",
      requiredState: "ACTIVE",
    }],
    outputFieldIds: ["RPT-SUBSCRIPTION-F-ID", "RPT-SUBSCRIPTION-F-VERSION"],
    successState: "ACTIVE",
    permissions: teacherWritePermissions,
  }),
  action({
    id: "RPT-ACT-UPDATE-SUBSCRIPTION",
    label: "Update a Report Subscription Schedule",
    targetObjectId: "RPT-OBJ-SUBSCRIPTION",
    inputFieldIds: [
      "RPT-SUBSCRIPTION-F-ID",
      "RPT-SUBSCRIPTION-F-SCHEDULE-FREQUENCY",
      "RPT-SUBSCRIPTION-F-EXECUTION-TIME",
      "RPT-SUBSCRIPTION-F-TIMEZONE",
      "RPT-SUBSCRIPTION-F-RECIPIENTS",
    ],
    outputFieldIds: ["RPT-SUBSCRIPTION-F-VERSION"],
    transition: { from: ["ACTIVE", "PAUSED"], to: "ACTIVE" },
    permissions: teacherWritePermissions,
  }),
  action({
    id: "RPT-ACT-PAUSE-SUBSCRIPTION",
    label: "Pause a Report Subscription",
    targetObjectId: "RPT-OBJ-SUBSCRIPTION",
    inputFieldIds: ["RPT-SUBSCRIPTION-F-ID"],
    outputFieldIds: ["RPT-SUBSCRIPTION-F-VERSION"],
    transition: { from: "ACTIVE", to: "PAUSED" },
    permissions: teacherWritePermissions,
  }),
  action({
    id: "RPT-ACT-CANCEL-SUBSCRIPTION",
    label: "Cancel a Report Subscription",
    targetObjectId: "RPT-OBJ-SUBSCRIPTION",
    inputFieldIds: ["RPT-SUBSCRIPTION-F-ID"],
    outputFieldIds: ["RPT-SUBSCRIPTION-F-VERSION"],
    transition: { from: ["ACTIVE", "PAUSED"], to: "CANCELLED" },
    permissions: teacherWritePermissions,
  }),
  action({
    id: "RPT-ACT-CREATE-AD-HOC-RUN",
    label: "Create an Ad-hoc Permission-rechecked Report Run",
    targetObjectId: "RPT-OBJ-RUN",
    inputFieldIds: [
      "RPT-RUN-F-DEFINITION-REF",
      "RPT-RUN-F-DEFINITION-VERSION",
    ],
    outputFieldIds: [
      "RPT-RUN-F-ID",
      "RPT-RUN-F-DATA-CUTOFF",
      "RPT-RUN-F-PERMISSION-RESULT",
      "RPT-RUN-F-SOURCE-VERSIONS",
      "RPT-RUN-F-VERSION",
    ],
    relatedStateGuards: [{
      refFieldId: "RPT-RUN-F-DEFINITION-REF",
      versionFieldId: "RPT-RUN-F-DEFINITION-VERSION",
      targetObjectId: "RPT-OBJ-DEFINITION",
      requiredState: "ACTIVE",
    }],
    successState: "QUEUED",
    executionMode: "FLOW_INTERNAL",
    trigger: { kind: "FLOW", flowIds: ["DF-013"] },
    permissions: reportFlowPermissions,
    failureResults: ["SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
  }),
  action({
    id: "RPT-ACT-CREATE-RUN",
    label: "Create a Periodic Permission-rechecked Report Run",
    targetObjectId: "RPT-OBJ-RUN",
    inputFieldIds: [
      "RPT-RUN-F-DEFINITION-REF",
      "RPT-RUN-F-DEFINITION-VERSION",
      "RPT-RUN-F-SUBSCRIPTION-REF",
      "RPT-RUN-F-SUBSCRIPTION-VERSION",
    ],
    outputFieldIds: [
      "RPT-RUN-F-ID",
      "RPT-RUN-F-DATA-CUTOFF",
      "RPT-RUN-F-PERMISSION-RESULT",
      "RPT-RUN-F-SOURCE-VERSIONS",
      "RPT-RUN-F-VERSION",
    ],
    relatedStateGuards: [
      {
        refFieldId: "RPT-RUN-F-DEFINITION-REF",
        versionFieldId: "RPT-RUN-F-DEFINITION-VERSION",
        targetObjectId: "RPT-OBJ-DEFINITION",
        requiredState: "ACTIVE",
      },
      {
        refFieldId: "RPT-RUN-F-SUBSCRIPTION-REF",
        versionFieldId: "RPT-RUN-F-SUBSCRIPTION-VERSION",
        targetObjectId: "RPT-OBJ-SUBSCRIPTION",
        requiredState: "ACTIVE",
      },
    ],
    successState: "QUEUED",
    executionMode: "FLOW_INTERNAL",
    trigger: { kind: "FLOW", flowIds: ["DF-013"] },
    permissions: reportFlowPermissions,
    failureResults: ["SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
  }),
  action({
    id: "RPT-ACT-START-RUN",
    label: "Start a Permission-cleared Report Run",
    targetObjectId: "RPT-OBJ-RUN",
    outputFieldIds: ["RPT-RUN-F-VERSION"],
    transition: { from: "QUEUED", to: "RUNNING" },
    executionMode: "FLOW_INTERNAL",
    trigger: { kind: "FLOW", flowIds: ["DF-013"] },
    permissions: reportFlowPermissions,
    failureResults: ["SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
  }),
  action({
    id: "RPT-ACT-COMPLETE-RUN",
    label: "Complete a Report Run",
    targetObjectId: "RPT-OBJ-RUN",
    outputFieldIds: ["RPT-RUN-F-RESULT", "RPT-RUN-F-VERSION"],
    transition: { from: "RUNNING", to: "SUCCEEDED" },
    executionMode: "FLOW_INTERNAL",
    trigger: { kind: "FLOW", flowIds: ["DF-013"] },
    permissions: reportFlowPermissions,
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
  }),
  action({
    id: "RPT-ACT-FAIL-RUN",
    label: "Record a Failed Report Run",
    targetObjectId: "RPT-OBJ-RUN",
    outputFieldIds: ["RPT-RUN-F-VERSION"],
    transition: { from: "RUNNING", to: "FAILED" },
    executionMode: "SYSTEM_EVENT",
    trigger: { kind: "EVENT", eventId: "EVT-REPORT-RUN-FAILED" },
    permissions: reportEventPermissions,
    failureResults: ["PERMISSION_DENIED", "VERSION_CONFLICT"],
  }),
  action({
    id: "RPT-ACT-BLOCK-RUN-PERMISSION",
    label: "Block a Report Run after Permission Recheck Failure",
    targetObjectId: "RPT-OBJ-RUN",
    outputFieldIds: ["RPT-RUN-F-PERMISSION-RESULT", "RPT-RUN-F-VERSION"],
    transition: { from: "QUEUED", to: "BLOCKED_PERMISSION" },
    executionMode: "SYSTEM_EVENT",
    trigger: { kind: "EVENT", eventId: "EVT-REPORT-RUN-PERMISSION-BLOCKED" },
    permissions: reportEventPermissions,
    failureResults: ["VERSION_CONFLICT"],
  }),
  action({
    id: "RPT-ACT-MATERIALIZE-SNAPSHOT",
    label: "Materialize an Immutable Report Snapshot",
    targetObjectId: "RPT-OBJ-SNAPSHOT",
    outputFieldIds: reportSnapshotFields.map(({ id }) => id),
    relatedStateGuards: [{
      refFieldId: "RPT-SNAPSHOT-F-RUN-REF",
      versionFieldId: "RPT-SNAPSHOT-F-RUN-VERSION",
      targetObjectId: "RPT-OBJ-RUN",
      requiredState: "SUCCEEDED",
    }],
    successState: "AVAILABLE",
    executionMode: "FLOW_INTERNAL",
    trigger: { kind: "FLOW", flowIds: ["DF-013"] },
    permissions: reportFlowPermissions,
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
  }),
  action({
    id: "RPT-ACT-CREATE-DELIVERY",
    label: "Create an In-product Report Delivery",
    targetObjectId: "RPT-OBJ-DELIVERY",
    outputFieldIds: reportDeliveryFields.map(({ id }) => id),
    relatedStateGuards: [{
      refFieldId: "RPT-DELIVERY-F-SNAPSHOT-REF",
      versionFieldId: "RPT-DELIVERY-F-SNAPSHOT-VERSION",
      targetObjectId: "RPT-OBJ-SNAPSHOT",
      requiredState: "AVAILABLE",
    }],
    successState: "PENDING",
    executionMode: "FLOW_INTERNAL",
    trigger: { kind: "FLOW", flowIds: ["DF-013"] },
    permissions: reportFlowPermissions,
    failureResults: ["PERMISSION_DENIED", "DELIVERY_FAILED", "VERSION_CONFLICT"],
    channel: IN_PRODUCT_CHANNEL,
  }),
  action({
    id: "RPT-ACT-MARK-DELIVERED",
    label: "Record a Delivered In-product Report",
    targetObjectId: "RPT-OBJ-DELIVERY",
    outputFieldIds: ["RPT-DELIVERY-F-STATE", "RPT-DELIVERY-F-VERSION"],
    transition: { from: "PENDING", to: "DELIVERED" },
    executionMode: "SYSTEM_EVENT",
    trigger: { kind: "EVENT", eventId: "EVT-REPORT-DELIVERY-SUCCEEDED" },
    permissions: reportEventPermissions,
    failureResults: ["PERMISSION_DENIED", "VERSION_CONFLICT"],
    channel: IN_PRODUCT_CHANNEL,
  }),
  action({
    id: "RPT-ACT-FAIL-DELIVERY",
    label: "Record a Failed In-product Report Delivery",
    targetObjectId: "RPT-OBJ-DELIVERY",
    outputFieldIds: ["RPT-DELIVERY-F-STATE", "RPT-DELIVERY-F-VERSION"],
    transition: { from: "PENDING", to: "FAILED" },
    executionMode: "SYSTEM_EVENT",
    trigger: { kind: "EVENT", eventId: "EVT-REPORT-DELIVERY-FAILED" },
    permissions: reportEventPermissions,
    failureResults: ["PERMISSION_DENIED", "VERSION_CONFLICT"],
    channel: IN_PRODUCT_CHANNEL,
  }),
  action({
    id: "RPT-ACT-RETRY-DELIVERY",
    label: "Retry a Failed In-product Report Delivery",
    targetObjectId: "RPT-OBJ-DELIVERY",
    outputFieldIds: ["RPT-DELIVERY-F-STATE", "RPT-DELIVERY-F-VERSION"],
    transition: { from: "FAILED", to: "PENDING" },
    executionMode: "SYSTEM_EVENT",
    trigger: { kind: "EVENT", eventId: "EVT-REPORT-DELIVERY-RETRY-DUE" },
    permissions: reportEventPermissions,
    failureResults: ["PERMISSION_DENIED", "VERSION_CONFLICT"],
    channel: IN_PRODUCT_CHANNEL,
  }),
];

const reportModule = moduleFact({
  id: "RPT-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Ad-hoc Analysis and Scheduled Reports",
  objective: "Keep report definitions, subscriptions, runs, snapshots, and deliveries as separate authoritative objects",
  entryConditions: ["an authorized teacher selects a data scope and product report task"],
  exitConditions: ["the accepted definition or subscription remains independently versioned"],
  timeHorizons: {
    adHoc: "SESSION_ANALYSIS_SAVED_ONLY_ON_CONFIRMATION",
    periodic: "SUBSCRIPTION_WITH_INDEPENDENT_RUN_SNAPSHOT_AND_DELIVERY",
  },
  lifecycleBoundaries: {
    subscriptionObjectId: "RPT-OBJ-SUBSCRIPTION",
    runObjectId: "RPT-OBJ-RUN",
    sharedStateMachine: false,
  },
  baselineDecisionIds: ["BASE-003", "BASE-008", "BASE-010"],
  nfrIds: ["NFR-002", "NFR-008"],
  objects: [
    object("RPT-OBJ-DEFINITION", "Report Definition", subjectTeacherResponsibility, "LIFE-006", ["ACTIVE"], reportDefinitionFields, { mode: "NONE" }),
    object(
      "RPT-OBJ-SUBSCRIPTION",
      "Report Subscription",
      subjectTeacherResponsibility,
      "LIFE-006",
      ["ACTIVE", "PAUSED", "CANCELLED"],
      reportSubscriptionFields,
      { mode: "NONE" },
      {
        lineageBindings: [{
          refFieldId: "RPT-SUBSCRIPTION-F-DEFINITION-REF",
          versionFieldId: "RPT-SUBSCRIPTION-F-DEFINITION-VERSION",
          targetObjectId: "RPT-OBJ-DEFINITION",
          targetVersionFieldId: "RPT-DEFINITION-F-VERSION",
        }],
      }),
    object(
      "RPT-OBJ-RUN",
      "Report Run",
      systemSubjectTeacherResponsibility,
      "LIFE-006",
      ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "BLOCKED_PERMISSION"],
      reportRunFields,
      { mode: "ACTION_GRAPH", initialStateIds: [] },
      {
        executionPolicy: {
          permissionCheck: "RECHECK_EACH_RUN",
          dataCutoff: "RESOLVE_AT_RUN_START",
          permissionFailureState: "BLOCKED_PERMISSION",
          permissionFailureActionId: "RPT-ACT-BLOCK-RUN-PERMISSION",
          sourceVersionCapture: "PIN_BEFORE_QUERY",
        },
        lineageBindings: [
          {
            refFieldId: "RPT-RUN-F-DEFINITION-REF",
            versionFieldId: "RPT-RUN-F-DEFINITION-VERSION",
            targetObjectId: "RPT-OBJ-DEFINITION",
            targetVersionFieldId: "RPT-DEFINITION-F-VERSION",
          },
          {
            refFieldId: "RPT-RUN-F-SUBSCRIPTION-REF",
            versionFieldId: "RPT-RUN-F-SUBSCRIPTION-VERSION",
            targetObjectId: "RPT-OBJ-SUBSCRIPTION",
            targetVersionFieldId: "RPT-SUBSCRIPTION-F-VERSION",
          },
        ],
      }),
    object(
      "RPT-OBJ-SNAPSHOT",
      "Immutable Report Snapshot",
      systemSubjectTeacherResponsibility,
      "LIFE-006",
      ["AVAILABLE"],
      reportSnapshotFields,
      { mode: "NONE" },
      {
        lineageBindings: [{
          refFieldId: "RPT-SNAPSHOT-F-RUN-REF",
          versionFieldId: "RPT-SNAPSHOT-F-RUN-VERSION",
          targetObjectId: "RPT-OBJ-RUN",
          targetVersionFieldId: "RPT-RUN-F-VERSION",
        }],
      }),
    object(
      "RPT-OBJ-DELIVERY",
      "In-product Report Delivery",
      systemSubjectTeacherResponsibility,
      "LIFE-006",
      ["PENDING", "DELIVERED", "FAILED"],
      reportDeliveryFields,
      { mode: "ACTION_GRAPH", initialStateIds: [] },
      {
        channelPolicy: {
          mode: "PHASE_ONE_CLOSED",
          fieldId: "RPT-DELIVERY-F-CHANNEL",
          optionSetId: "OPT-ENUM-047",
          allowedCodes: [IN_PRODUCT_CHANNEL],
        },
        lineageBindings: [{
          refFieldId: "RPT-DELIVERY-F-SNAPSHOT-REF",
          versionFieldId: "RPT-DELIVERY-F-SNAPSHOT-VERSION",
          targetObjectId: "RPT-OBJ-SNAPSHOT",
          targetVersionFieldId: "RPT-SNAPSHOT-F-VERSION",
        }],
      }),
  ],
  relationships: [
    {
      id: "RPT-REL-SUBSCRIPTION-DEFINITION",
      fromObjectId: "RPT-OBJ-SUBSCRIPTION",
      toObjectId: "RPT-OBJ-DEFINITION",
      type: "REFERENCES",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "retain subscription history and require a new definition version before the next run",
    },
    {
      id: "RPT-REL-RUN-SUBSCRIPTION",
      fromObjectId: "RPT-OBJ-RUN",
      toObjectId: "RPT-OBJ-SUBSCRIPTION",
      type: "DERIVED_FROM",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "retain the run and create a new run from the updated subscription version",
    },
    {
      id: "RPT-REL-SNAPSHOT-RUN",
      fromObjectId: "RPT-OBJ-SNAPSHOT",
      toObjectId: "RPT-OBJ-RUN",
      type: "DERIVED_FROM",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "retain the immutable snapshot and mark new runs to use refreshed sources",
    },
    {
      id: "RPT-REL-DELIVERY-SNAPSHOT",
      fromObjectId: "RPT-OBJ-DELIVERY",
      toObjectId: "RPT-OBJ-SNAPSHOT",
      type: "REFERENCES",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "delivery failure never rewrites or deletes the report snapshot",
    },
  ],
  actions: reportActions,
  pages: [page(
    "RPT-PAGE-CENTER",
    "Report Center and Subscription Management",
    ["RPT-OBJ-DEFINITION", "RPT-OBJ-SUBSCRIPTION"],
    [...reportDefinitionFields, ...reportSubscriptionFields].map(({ id }) => id),
    reportActions
      .map(({ action: actionValue }) => actionValue)
      .filter(({ executionMode }) => executionMode === USER_TASK)
      .map(({ id }) => id),
  )],
});

function versionPinnedField(id, label, targetObjectId, versionFieldId, targetVersionFieldId) {
  return field(id, label, {
    dataType: "ID",
    required: false,
    valueSource: { kind: "OBJECT_REF", targetObjectId },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: { versionFieldId, targetVersionFieldId },
  });
}

function pinnedVersionField(id, label) {
  return field(id, label, {
    dataType: "INTEGER",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  });
}

const timelineSourceBindings = [
  ["PUBLISHED-RESULT", "PUB-OBJ-RESULT", "PUB-RESULT-F-RESULT-VERSION"],
  ["EVIDENCE", "INS-OBJ-EVIDENCE", "INS-EVIDENCE-F-EVIDENCE-VERSION"],
  ["CORRECTION", "CORR-OBJ-ATTEMPT", "CORR-ATTEMPT-F-CORRECTION-VERSION"],
  ["PLAN-EXECUTION", "APP-OBJ-TODO", "APP-TODO-F-AGGREGATION-VERSION"],
  ["TEACHER-CONFIRMATION", "GRD-OBJ-DECISION", "GRD-DECISION-F-DECISION-VERSION"],
].map(([kind, targetObjectId, targetVersionFieldId]) => {
  const refFieldId = `LPATH-ENTRY-F-${kind}-REF`;
  const versionFieldId = `LPATH-ENTRY-F-${kind}-VERSION`;
  return {
    kind,
    refFieldId,
    versionFieldId,
    targetObjectId,
    targetVersionFieldId,
  };
});

const timelineFields = [
  identityField("LPATH-ENTRY-F-ID", "Learning Timeline Entry ID"),
  field("LPATH-ENTRY-F-STUDENT-REF", "Learning Path Student", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-STUDENT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
  }),
  field("LPATH-ENTRY-F-TERM-ID", "Timeline Entry Term", {
    dataType: "ID",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-003" },
    mutability: "IMMUTABLE",
  }),
  field("LPATH-ENTRY-F-EVENT-TYPE", "Learning Path Event Type", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-013" },
    mutability: "IMMUTABLE",
  }),
  ...timelineSourceBindings.flatMap((binding) => [
    versionPinnedField(
      binding.refFieldId,
      `${binding.kind} Source Reference`,
      binding.targetObjectId,
      binding.versionFieldId,
      binding.targetVersionFieldId,
    ),
    pinnedVersionField(binding.versionFieldId, `${binding.kind} Source Version`),
  ]),
  field("LPATH-ENTRY-F-RECORDED-AT", "Timeline Entry Recorded At", {
    dataType: "DATETIME",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  versionField("LPATH-ENTRY-F-VERSION", "Learning Timeline Entry Version"),
];

const interpretationFields = [
  identityField("LPATH-INTERPRETATION-F-ID", "Learning Path Interpretation ID"),
  field("LPATH-INTERPRETATION-F-SUBJECT", "Interpretation Subject", {
    dataType: "ID",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-007" },
  }),
  versionPinnedField(
    "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-REF",
    "Interpretation Knowledge Point",
    "CURR-OBJ-KNOWLEDGE-POINT",
    "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-VERSION",
    "CURR-KP-F-ID",
  ),
  field("LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-VERSION", "Interpretation Knowledge Point Version", {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }),
  field("LPATH-INTERPRETATION-F-EVIDENCE-REFS", "Versioned Evidence References", {
    dataType: "JSON",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    validation: "must contain one or more evidence ID and version pairs",
  }),
  field("LPATH-INTERPRETATION-F-EXPLANATION", "Teacher-confirmed Explanation", {
    dataType: "TEXT",
    required: {
      description: "required after corresponding subject-teacher confirmation",
      whenStates: ["TEACHER_CONFIRMED", "STUDENT_VISIBLE"],
      whenActionIds: ["LPATH-ACT-CONFIRM-INTERPRETATION"],
    },
  }),
  field("LPATH-INTERPRETATION-F-CONFIDENCE", "Explanation Confidence", {
    dataType: "DECIMAL",
    required: {
      description: "required after corresponding subject-teacher confirmation",
      whenStates: ["TEACHER_CONFIRMED", "STUDENT_VISIBLE"],
      whenActionIds: ["LPATH-ACT-CONFIRM-INTERPRETATION"],
    },
  }),
  field("LPATH-INTERPRETATION-F-LIMITATIONS", "Explanation Limitations", {
    dataType: "TEXT",
    required: {
      description: "required after corresponding subject-teacher confirmation",
      whenStates: ["TEACHER_CONFIRMED", "STUDENT_VISIBLE"],
      whenActionIds: ["LPATH-ACT-CONFIRM-INTERPRETATION"],
    },
  }),
  field("LPATH-INTERPRETATION-F-TEACHER-CONFIRMER", "Corresponding Subject Teacher Confirmer", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ORG-OBJ-TEACHER" },
    mutability: "SYSTEM_MANAGED",
    required: {
      description: "required after corresponding subject-teacher confirmation",
      whenStates: ["TEACHER_CONFIRMED", "STUDENT_VISIBLE"],
      whenActionIds: ["LPATH-ACT-CONFIRM-INTERPRETATION"],
    },
    referenceIntegrity: "IDENTITY_ONLY",
  }),
  field("LPATH-INTERPRETATION-F-VISIBLE-FROM", "Student Visible From", {
    dataType: "DATETIME",
    required: {
      description: "required when the interpretation becomes student visible",
      whenStates: ["STUDENT_VISIBLE"],
      whenActionIds: ["LPATH-ACT-PUBLISH-INTERPRETATION"],
    },
  }),
  {
    ...versionPinnedField(
      "LPATH-INTERPRETATION-F-SUPERSEDED-BY-REF",
      "Superseding Interpretation Reference",
      "LPATH-OBJ-INTERPRETATION",
      "LPATH-INTERPRETATION-F-SUPERSEDED-BY-VERSION",
      "LPATH-INTERPRETATION-F-VERSION",
    ),
    required: {
      description: "required when a prior interpretation is superseded",
      whenStates: ["SUPERSEDED"],
      whenActionIds: ["LPATH-ACT-SUPERSEDE-INTERPRETATION"],
    },
    stateGuardPolicy: "UPDATE_REQUIRED",
    actionApplicability: {
      requiredActionIds: ["LPATH-ACT-SUPERSEDE-INTERPRETATION"],
    },
  },
  {
    ...pinnedVersionField(
      "LPATH-INTERPRETATION-F-SUPERSEDED-BY-VERSION",
      "Superseding Interpretation Version",
    ),
    required: {
      description: "required when a prior interpretation is superseded",
      whenStates: ["SUPERSEDED"],
      whenActionIds: ["LPATH-ACT-SUPERSEDE-INTERPRETATION"],
    },
  },
  field("LPATH-INTERPRETATION-F-STALE-REASON", "Interpretation Stale Reason", {
    dataType: "TEXT",
    required: {
      description: "required when a source version makes the interpretation stale",
      whenStates: ["STALE"],
      whenActionIds: ["LPATH-ACT-MARK-INTERPRETATION-STALE"],
    },
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  versionField("LPATH-INTERPRETATION-F-VERSION", "Learning Path Interpretation Version"),
];

const pathWritePermissions = [
  permission(
    "ALLOW",
    "DUTY-SUBJECT-TEACHER",
    "the corresponding subject teacher confirms only the assigned subject interpretation",
  ),
  permission(
    "DENY",
    "DUTY-HOMEROOM",
    "a homeroom teacher cannot confirm or replace another subject's professional interpretation",
  ),
  permission(
    "DENY",
    "AI",
    "AI may propose an explanation but cannot confirm or publish it",
  ),
  permission(
    "DENY",
    "ROLE-PLATFORM-OPS",
    "platform operations has no default access to learning path detail",
  ),
];

const pathReadPermissions = [
  permission(
    "ALLOW",
    "DUTY-SUBJECT-TEACHER",
    "the corresponding subject teacher reads assigned subject paths",
  ),
  permission(
    "ALLOW",
    "DUTY-HOMEROOM",
    "the homeroom teacher reads the assigned class across subjects without professional write permission",
  ),
  permission(
    "DENY",
    "ROLE-PLATFORM-OPS",
    "platform operations has no default access to learning path detail",
  ),
];

const flowWritePermissions = [
  permission("ALLOW", "SYSTEM", "the verified Flow writes only version-pinned derived records"),
  permission("DENY", "CURRENT_ACTOR", "a user cannot invoke an internal Flow action directly"),
];

const timelineCommonOutputFieldIds = [
  "LPATH-ENTRY-F-ID",
  "LPATH-ENTRY-F-STUDENT-REF",
  "LPATH-ENTRY-F-TERM-ID",
  "LPATH-ENTRY-F-EVENT-TYPE",
  "LPATH-ENTRY-F-RECORDED-AT",
  "LPATH-ENTRY-F-VERSION",
];

const timelineAppendActions = timelineSourceBindings.map((binding) => action({
  id: `LPATH-ACT-APPEND-${binding.kind}-TIMELINE`,
  label: `Append a ${binding.kind} Learning Timeline Entry`,
  targetObjectId: "LPATH-OBJ-TIMELINE-ENTRY",
  outputFieldIds: [
    ...timelineCommonOutputFieldIds,
    binding.refFieldId,
    binding.versionFieldId,
  ],
  successState: "RECORDED",
  executionMode: "FLOW_INTERNAL",
  trigger: { kind: "FLOW", flowIds: ["DF-011"] },
  permissions: flowWritePermissions,
  failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
}));

const learningPathActions = [
  ...timelineAppendActions,
  action({
    id: "LPATH-ACT-CREATE-INTERPRETATION-CANDIDATE",
    label: "Create a Version-pinned Learning Path Interpretation Candidate",
    targetObjectId: "LPATH-OBJ-INTERPRETATION",
    outputFieldIds: [
      "LPATH-INTERPRETATION-F-ID",
      "LPATH-INTERPRETATION-F-SUBJECT",
      "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-REF",
      "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-VERSION",
      "LPATH-INTERPRETATION-F-EVIDENCE-REFS",
      "LPATH-INTERPRETATION-F-VERSION",
    ],
    successState: "CANDIDATE",
    executionMode: "FLOW_INTERNAL",
    trigger: { kind: "FLOW", flowIds: ["DF-011"] },
    permissions: flowWritePermissions,
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
  }),
  action({
    id: "LPATH-ACT-CONFIRM-INTERPRETATION",
    label: "Confirm a Subject Learning Path Interpretation",
    targetObjectId: "LPATH-OBJ-INTERPRETATION",
    inputFieldIds: [
      "LPATH-INTERPRETATION-F-SUBJECT",
      "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-REF",
      "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-VERSION",
      "LPATH-INTERPRETATION-F-EVIDENCE-REFS",
      "LPATH-INTERPRETATION-F-EXPLANATION",
      "LPATH-INTERPRETATION-F-CONFIDENCE",
      "LPATH-INTERPRETATION-F-LIMITATIONS",
      "LPATH-INTERPRETATION-F-TEACHER-CONFIRMER",
    ],
    outputFieldIds: ["LPATH-INTERPRETATION-F-VERSION"],
    transition: { from: "CANDIDATE", to: "TEACHER_CONFIRMED" },
    risk: RISK.HIGH,
    permissions: pathWritePermissions,
  }),
  action({
    id: "LPATH-ACT-SUPERSEDE-INTERPRETATION",
    label: "Supersede a Learning Path Interpretation Version",
    targetObjectId: "LPATH-OBJ-INTERPRETATION",
    inputFieldIds: [
      "LPATH-INTERPRETATION-F-SUPERSEDED-BY-REF",
      "LPATH-INTERPRETATION-F-SUPERSEDED-BY-VERSION",
    ],
    relatedStateGuards: [{
      refFieldId: "LPATH-INTERPRETATION-F-SUPERSEDED-BY-REF",
      versionFieldId: "LPATH-INTERPRETATION-F-SUPERSEDED-BY-VERSION",
      targetObjectId: "LPATH-OBJ-INTERPRETATION",
      requiredState: "STUDENT_VISIBLE",
    }],
    outputFieldIds: ["LPATH-INTERPRETATION-F-VERSION"],
    transition: {
      from: ["TEACHER_CONFIRMED", "STUDENT_VISIBLE"],
      to: "SUPERSEDED",
    },
    risk: RISK.HIGH,
    permissions: pathWritePermissions,
  }),
  action({
    id: "LPATH-ACT-MARK-INTERPRETATION-STALE",
    label: "Mark a Learning Path Interpretation Stale",
    targetObjectId: "LPATH-OBJ-INTERPRETATION",
    outputFieldIds: [
      "LPATH-INTERPRETATION-F-STALE-REASON",
      "LPATH-INTERPRETATION-F-VERSION",
    ],
    transition: {
      from: ["CANDIDATE", "TEACHER_CONFIRMED", "STUDENT_VISIBLE"],
      to: "STALE",
    },
    executionMode: "SYSTEM_EVENT",
    trigger: {
      kind: "EVENT",
      eventId: "EVT-LEARNING-PATH-INTERPRETATION-STALE",
    },
    permissions: flowWritePermissions,
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
  }),
  action({
    id: "LPATH-ACT-PUBLISH-INTERPRETATION",
    label: "Publish a Teacher-confirmed Learning Path Interpretation",
    targetObjectId: "LPATH-OBJ-INTERPRETATION",
    inputFieldIds: ["LPATH-INTERPRETATION-F-VISIBLE-FROM"],
    outputFieldIds: ["LPATH-INTERPRETATION-F-VERSION"],
    transition: { from: "TEACHER_CONFIRMED", to: "STUDENT_VISIBLE" },
    risk: RISK.HIGH,
    permissions: pathWritePermissions,
  }),
  action({
    id: "LPATH-ACT-VIEW-PATH",
    label: "View the Authorized Cross-term Learning Path",
    targetObjectId: "LPATH-OBJ-TIMELINE-ENTRY",
    inputFieldIds: ["LPATH-ENTRY-F-STUDENT-REF"],
    outputFieldIds: timelineFields.map(({ id }) => id),
    writes: false,
    permissions: pathReadPermissions,
  }),
];

const learningPathModule = moduleFact({
  id: "LPATH-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Cross-term Learning Path",
  objective: "Retain cross-term fact references and teacher-confirmed interpretation versions without rewriting source learning facts",
  entryConditions: ["a published or teacher-confirmed source fact is available with an immutable version"],
  exitConditions: ["the path retains an append-only source reference or interpretation version"],
  timeHorizon: "CROSS_TERM_APPEND_ONLY_LONG_TERM",
  historyPolicy: {
    timeline: "APPEND_ONLY_SOURCE_REFERENCES",
    sourceFacts: "NEVER_COPY_OR_REWRITE",
    interpretationChange: "CREATE_NEW_VERSION",
    priorVersions: "RETAIN_WITH_SUPERSEDED_OR_STALE_REASON",
  },
  baselineDecisionIds: ["BASE-003", "BASE-008", "BASE-010"],
  nfrIds: ["NFR-002", "NFR-008"],
  objects: [
    object(
      "LPATH-OBJ-TIMELINE-ENTRY",
      "Cross-term Learning Timeline Entry",
      systemSubjectTeacherResponsibility,
      "LIFE-007",
      ["RECORDED"],
      timelineFields,
      { mode: "NONE" },
      {
        readMode: "AUTHORIZED",
        crossTerm: true,
        exclusiveSourceGroups: timelineSourceBindings.map((binding) => ({
          id: binding.kind,
          fieldIds: [binding.refFieldId, binding.versionFieldId],
        })),
        lineageBindings: timelineSourceBindings.map((binding) => ({
          refFieldId: binding.refFieldId,
          versionFieldId: binding.versionFieldId,
          targetObjectId: binding.targetObjectId,
          targetVersionFieldId: binding.targetVersionFieldId,
        })),
      }),
    object(
      "LPATH-OBJ-INTERPRETATION",
      "Teacher-confirmed Learning Path Interpretation Version",
      subjectTeacherResponsibility,
      "LIFE-007",
      ["CANDIDATE", "TEACHER_CONFIRMED", "STUDENT_VISIBLE", "SUPERSEDED", "STALE"],
      interpretationFields,
      { mode: "ACTION_GRAPH", initialStateIds: [] },
      {
        lineageBindings: [
          {
            refFieldId: "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-REF",
            versionFieldId: "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-VERSION",
            targetObjectId: "CURR-OBJ-KNOWLEDGE-POINT",
            targetVersionFieldId: "CURR-KP-F-ID",
          },
          {
            refFieldId: "LPATH-INTERPRETATION-F-SUPERSEDED-BY-REF",
            versionFieldId: "LPATH-INTERPRETATION-F-SUPERSEDED-BY-VERSION",
            targetObjectId: "LPATH-OBJ-INTERPRETATION",
            targetVersionFieldId: "LPATH-INTERPRETATION-F-VERSION",
          },
        ],
      }),
  ],
  relationships: [],
  actions: learningPathActions,
  pages: [page(
    "LPATH-PAGE-PATH",
    "Cross-term Learning Path and Interpretation Review",
    ["LPATH-OBJ-TIMELINE-ENTRY", "LPATH-OBJ-INTERPRETATION"],
    [...timelineFields, ...interpretationFields].map(({ id }) => id),
    learningPathActions
      .map(({ action: actionValue }) => actionValue)
      .filter(({ executionMode }) => executionMode === USER_TASK)
      .map(({ id }) => id),
  )],
});

const notificationFields = [
  identityField("NOTI-NOTIFICATION-F-ID", "Notification ID"),
  field("NOTI-NOTIFICATION-F-SOURCE-EVENT", "Notification Source Event"),
  field("NOTI-NOTIFICATION-F-RECIPIENT", "Notification Recipient", {
    dataType: "ID",
  }),
  field("NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE", "Summary Template"),
  field("NOTI-NOTIFICATION-F-DEEP-LINK", "Authorized Product Deep Link"),
  field("NOTI-NOTIFICATION-F-CHANNEL", "Notification Channel", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-047" },
    mutability: "IMMUTABLE",
  }),
  field("NOTI-NOTIFICATION-F-DELIVERED-AT", "Delivered At", {
    dataType: "DATETIME",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("NOTI-NOTIFICATION-F-READ-AT", "Read At", {
    dataType: "DATETIME",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("NOTI-NOTIFICATION-F-HANDLED-AT", "Handled At", {
    dataType: "DATETIME",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("NOTI-NOTIFICATION-F-FAILURE-CODE", "Delivery Failure Code", {
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  field("NOTI-NOTIFICATION-F-RETRY-COUNT", "Delivery Retry Count", {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
  }),
  versionField("NOTI-NOTIFICATION-F-VERSION", "Notification Version"),
];
const createReminder = action({
  id: "NOTI-ACT-CREATE-REMINDER",
  label: "Create an In-product Learning Reminder",
  targetObjectId: "NOTI-OBJ-NOTIFICATION",
  inputFieldIds: [
    "NOTI-NOTIFICATION-F-SOURCE-EVENT",
    "NOTI-NOTIFICATION-F-RECIPIENT",
    "NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE",
    "NOTI-NOTIFICATION-F-DEEP-LINK",
  ],
  outputFieldIds: [
    "NOTI-NOTIFICATION-F-ID",
    "NOTI-NOTIFICATION-F-CHANNEL",
    "NOTI-NOTIFICATION-F-RETRY-COUNT",
    "NOTI-NOTIFICATION-F-VERSION",
  ],
  successState: "QUEUED",
  permissions: teacherWritePermissions,
  channel: IN_PRODUCT_CHANNEL,
});
const createReportNotification = action({
  id: "NOTI-ACT-CREATE-REPORT-NOTIFICATION",
  label: "Create an In-product Report Notification",
  targetObjectId: "NOTI-OBJ-NOTIFICATION",
  outputFieldIds: [
    "NOTI-NOTIFICATION-F-ID",
    "NOTI-NOTIFICATION-F-SOURCE-EVENT",
    "NOTI-NOTIFICATION-F-RECIPIENT",
    "NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE",
    "NOTI-NOTIFICATION-F-DEEP-LINK",
    "NOTI-NOTIFICATION-F-CHANNEL",
    "NOTI-NOTIFICATION-F-RETRY-COUNT",
    "NOTI-NOTIFICATION-F-VERSION",
  ],
  successState: "QUEUED",
  executionMode: "FLOW_INTERNAL",
  trigger: { kind: "FLOW", flowIds: ["DF-013"] },
  permissions: reportFlowPermissions,
  failureResults: ["PERMISSION_DENIED", "DELIVERY_FAILED", "VERSION_CONFLICT"],
  channel: IN_PRODUCT_CHANNEL,
});
const notificationDeliveryPermissions = [
  permission("ALLOW", "SYSTEM", "the verified delivery event updates only the target notification"),
  permission("DENY", "CURRENT_ACTOR", "a user cannot invoke notification delivery state changes directly"),
];
const notificationRecipientPermissions = [
  permission(
    "ALLOW",
    "ROLE-STUDENT",
    "the authenticated student is the notification recipient",
    { kind: "OWN_RECORD", subjectFieldId: "NOTI-NOTIFICATION-F-RECIPIENT" },
  ),
  permission(
    "DENY",
    "ROLE-STUDENT",
    "the authenticated student is not the notification recipient",
    { kind: "OTHER_RECORD", subjectFieldId: "NOTI-NOTIFICATION-F-RECIPIENT" },
  ),
  permission(
    "DENY",
    "ROLE-PLATFORM-OPS",
    "platform operations has no default access to student notifications",
  ),
];
const deliverNotification = action({
  id: "NOTI-ACT-DELIVER",
  label: "Record an In-product Notification Delivery",
  targetObjectId: "NOTI-OBJ-NOTIFICATION",
  outputFieldIds: [
    "NOTI-NOTIFICATION-F-DELIVERED-AT",
    "NOTI-NOTIFICATION-F-VERSION",
  ],
  transition: { from: "QUEUED", to: "DELIVERED" },
  executionMode: "SYSTEM_EVENT",
  trigger: { kind: "EVENT", eventId: "EVT-NOTIFICATION-DELIVERY-SUCCEEDED" },
  permissions: notificationDeliveryPermissions,
  failureResults: ["PERMISSION_DENIED", "VERSION_CONFLICT"],
  channel: IN_PRODUCT_CHANNEL,
});
const failNotificationDelivery = action({
  id: "NOTI-ACT-FAIL-DELIVERY",
  label: "Record an In-product Notification Delivery Failure",
  targetObjectId: "NOTI-OBJ-NOTIFICATION",
  outputFieldIds: [
    "NOTI-NOTIFICATION-F-FAILURE-CODE",
    "NOTI-NOTIFICATION-F-VERSION",
  ],
  transition: { from: "QUEUED", to: "FAILED" },
  executionMode: "SYSTEM_EVENT",
  trigger: { kind: "EVENT", eventId: "EVT-NOTIFICATION-DELIVERY-FAILED" },
  permissions: notificationDeliveryPermissions,
  failureResults: ["PERMISSION_DENIED", "VERSION_CONFLICT"],
  channel: IN_PRODUCT_CHANNEL,
});
const retryNotificationDelivery = action({
  id: "NOTI-ACT-RETRY-DELIVERY",
  label: "Retry an In-product Notification Delivery",
  targetObjectId: "NOTI-OBJ-NOTIFICATION",
  outputFieldIds: [
    "NOTI-NOTIFICATION-F-RETRY-COUNT",
    "NOTI-NOTIFICATION-F-VERSION",
  ],
  transition: { from: "FAILED", to: "QUEUED" },
  executionMode: "SYSTEM_EVENT",
  trigger: { kind: "EVENT", eventId: "EVT-NOTIFICATION-DELIVERY-RETRY-DUE" },
  permissions: notificationDeliveryPermissions,
  failureResults: ["PERMISSION_DENIED", "VERSION_CONFLICT"],
  channel: IN_PRODUCT_CHANNEL,
});
const markNotificationRead = action({
  id: "NOTI-ACT-MARK-READ",
  label: "Mark an In-product Notification Read",
  targetObjectId: "NOTI-OBJ-NOTIFICATION",
  inputFieldIds: ["NOTI-NOTIFICATION-F-ID"],
  outputFieldIds: [
    "NOTI-NOTIFICATION-F-DELIVERED-AT",
    "NOTI-NOTIFICATION-F-READ-AT",
    "NOTI-NOTIFICATION-F-VERSION",
  ],
  transition: { from: "DELIVERED", to: "READ" },
  permissions: notificationRecipientPermissions,
  channel: IN_PRODUCT_CHANNEL,
});
const markNotificationHandled = action({
  id: "NOTI-ACT-MARK-HANDLED",
  label: "Mark an In-product Notification Handled",
  targetObjectId: "NOTI-OBJ-NOTIFICATION",
  inputFieldIds: ["NOTI-NOTIFICATION-F-ID"],
  outputFieldIds: [
    "NOTI-NOTIFICATION-F-HANDLED-AT",
    "NOTI-NOTIFICATION-F-VERSION",
  ],
  transition: { from: "READ", to: "HANDLED" },
  permissions: notificationRecipientPermissions,
  channel: IN_PRODUCT_CHANNEL,
});
const notificationModule = moduleFact({
  id: "NOTI-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "In-product Notification Delivery",
  objective: "Deliver authorized product summaries and deep links without rolling back accepted source business facts",
  entryConditions: ["an authorized source event or reminder request identifies recipients"],
  exitConditions: ["the in-product notification is queued with independent delivery state"],
  baselineDecisionIds: ["BASE-003", "BASE-008", "BASE-010"],
  nfrIds: ["NFR-002", "NFR-008"],
  objects: [object(
    "NOTI-OBJ-NOTIFICATION",
    "In-product Notification",
    { ...subjectTeacherResponsibility, producerRef: "CURRENT_ACTOR" },
    "LIFE-003",
    ["QUEUED", "DELIVERED", "READ", "HANDLED", "FAILED"],
    notificationFields,
    { mode: "ACTION_GRAPH", initialStateIds: [] },
    {
      channelPolicy: {
        mode: "PHASE_ONE_CLOSED",
        fieldId: "NOTI-NOTIFICATION-F-CHANNEL",
        optionSetId: "OPT-ENUM-047",
        allowedCodes: [IN_PRODUCT_CHANNEL],
      },
      deliveryFailurePolicy: {
        sourceBusinessFactRollback: false,
        retryScope: "NOTIFICATION_DELIVERY_ONLY",
        preserveAcceptedSourceVersion: true,
      },
    })],
  relationships: [],
  actions: [
    createReminder,
    createReportNotification,
    deliverNotification,
    failNotificationDelivery,
    retryNotificationDelivery,
    markNotificationRead,
    markNotificationHandled,
  ],
  pages: [page(
    "NOTI-PAGE-INBOX",
    "Notification Inbox and Reminder Creation",
    ["NOTI-OBJ-NOTIFICATION"],
    notificationFields.map(({ id }) => id),
    [
      "NOTI-ACT-CREATE-REMINDER",
      "NOTI-ACT-MARK-READ",
      "NOTI-ACT-MARK-HANDLED",
    ],
  )],
});

function schema(required, properties) {
  return { type: "object", required, properties, additionalProperties: false };
}

function aiTask({
  id,
  taskType,
  roleRefs = [],
  dutyRefs = [],
  examples,
  parameters,
  clarification,
  actionId,
  risk,
  writes,
  previewFieldIds,
  confirmerDutyRef,
  studentAccessPolicy,
  reversal,
}) {
  const parameterNames = Object.keys(parameters);
  return {
    id,
    taskType,
    roleRefs,
    dutyRefs,
    clients: WEB_APP,
    naturalLanguageExamples: examples,
    parameterSchema: schema(parameterNames, parameters),
    clarificationRules: [{
      whenMissing: parameterNames,
      prompt: clarification,
      blocksExecution: true,
    }],
    ...(taskType === "DRAFT" ? {
      draftPolicy: {
        previewActionId: "AIX-ACT-PREPARE-TASK-PREVIEW",
        previewObjectId: "AIX-OBJ-TASK-PREVIEW",
        confirmationRequired: true,
        businessWriteBeforeConfirmation: false,
      },
    } : {}),
    actionId,
    risk,
    writes,
    previewFieldIds,
    ...(writes ? {
      confirmerDutyRef,
      confirmer: { mode: "DUTY", dutyRef: confirmerDutyRef },
    } : {
      confirmer: { mode: "NOT_REQUIRED" },
    }),
    resultSchema: schema(
      ["data", "sourceVersions", "permissionResult"],
      {
        data: { type: "object" },
        sourceVersions: { type: "array", items: { type: "object" } },
        permissionResult: { type: "string" },
      },
    ),
    failureBehavior: {
      mode: "FAIL_CLOSED",
      preservesBusinessFacts: true,
      manualFallback: "continue through the target module's manual Web or App path",
    },
    ...(studentAccessPolicy ? { studentAccessPolicy } : {}),
    reversibility: {
      mode: writes ? "TARGET_ACTION_POLICY" : "NOT_APPLICABLE",
      instructions: reversal,
    },
  };
}

const studentOpenPolicy = {
  answer: "OPEN_CONTENT_ONLY",
  explanation: "OPEN_CONTENT_ONLY",
  score: "OPEN_CONTENT_ONLY",
  feedback: "OPEN_CONTENT_ONLY",
  sourceVersionRequired: true,
};

export const aiReportingAiTasks = deepFreeze([
  aiTask({
    id: "AI-TASK-AUTHORIZED-DATA-QUERY",
    taskType: "QUERY",
    dutyRefs: ["DUTY-SUBJECT-TEACHER", "DUTY-HOMEROOM"],
    examples: ["Show the authorized learning profile for this student"],
    parameters: { studentProfileId: { type: "string" } },
    clarification: "Which authorized student profile should be opened?",
    actionId: "STU-ACT-OPEN-PROFILE",
    risk: RISK.READ,
    writes: false,
    previewFieldIds: ["STU-PROFILE-F-ID", "STU-PROFILE-F-PROFILE-VERSION"],
    reversal: "the query creates no business fact",
  }),
  aiTask({
    id: "AI-TASK-LEARNING-ANALYSIS",
    taskType: "ANALYSIS",
    roleRefs: ["ROLE-STUDENT"],
    examples: ["Explain my teacher-confirmed mastery for this knowledge point"],
    parameters: { studentId: { type: "string" }, knowledgePointId: { type: "string" } },
    clarification: "Which visible knowledge point should be analyzed?",
    actionId: "INS-ACT-VIEW-MASTERY",
    risk: RISK.READ,
    writes: false,
    previewFieldIds: [
      "INS-EVIDENCE-F-RESULT",
      "INS-EVIDENCE-F-MASTERY-INTERPRETATION",
      "INS-EVIDENCE-F-STUDENT-VISIBLE-AT",
    ],
    studentAccessPolicy: studentOpenPolicy,
    reversal: "the analysis creates no business fact and disappears with the session",
  }),
  aiTask({
    id: "AI-TASK-ASSIGNMENT-DRAFT",
    taskType: "DRAFT",
    dutyRefs: ["DUTY-SUBJECT-TEACHER"],
    examples: ["Draft a mathematics assignment for class two due Friday"],
    parameters: { assignmentBrief: { type: "string" } },
    clarification: "Which subject, class scope, content, timing, and publication policies apply?",
    actionId: "HW-ACT-CREATE-DRAFT",
    risk: RISK.LOW,
    writes: true,
    previewFieldIds: [
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
      "HW-ASSIGNMENT-F-RUBRIC-VERSION",
      "HW-ASSIGNMENT-F-KNOWLEDGE-POINT-IDS",
      "HW-ASSIGNMENT-F-FEEDBACK-POLICY",
      "HW-ASSIGNMENT-F-NOTIFICATION-POLICY",
    ],
    confirmerDutyRef: "DUTY-SUBJECT-TEACHER",
    reversal: "the teacher may discard the draft or revise it before publication",
  }),
  aiTask({
    id: "AI-TASK-FEEDBACK-DRAFT",
    taskType: "DRAFT",
    dutyRefs: ["DUTY-SUBJECT-TEACHER"],
    examples: ["Draft feedback for this reviewed submission"],
    parameters: { decisionId: { type: "string" }, feedbackIntent: { type: "string" } },
    clarification: "Which reviewed decision and correction reason should the feedback use?",
    actionId: "GRD-ACT-OVERRIDE-SCORE",
    risk: RISK.HIGH,
    writes: true,
    previewFieldIds: [
      "GRD-DECISION-F-OFFICIAL-SCORE",
      "GRD-DECISION-F-TEACHER-FEEDBACK",
      "GRD-DECISION-F-CORRECTION-REASON",
    ],
    confirmerDutyRef: "DUTY-SUBJECT-TEACHER",
    reversal: "a confirmed decision is corrected only through its versioned revision path",
  }),
  aiTask({
    id: "AI-TASK-IMPROVEMENT-PLAN-DRAFT",
    taskType: "DRAFT",
    dutyRefs: ["DUTY-SUBJECT-TEACHER"],
    examples: ["Draft a two-week improvement plan from the confirmed evidence"],
    parameters: { candidateId: { type: "string" }, planIntent: { type: "string" } },
    clarification: "Which candidate, goal, workload, deadline, evidence, and revalidation method apply?",
    actionId: "PLN-ACT-CONFIRM-PLAN",
    risk: RISK.HIGH,
    writes: true,
    previewFieldIds: [
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
    confirmerDutyRef: "DUTY-SUBJECT-TEACHER",
    reversal: "an active plan changes only through the target plan adjustment or closure Action",
  }),
  aiTask({
    id: "AI-TASK-AD-HOC-REPORT",
    taskType: "AD_HOC_REPORT",
    dutyRefs: ["DUTY-SUBJECT-TEACHER"],
    examples: ["Create a temporary report of this week's submission rate"],
    parameters: {
      reportName: { type: "string" },
      metricIds: { type: "array", items: { type: "string" } },
      dataScope: { type: "object" },
      timeRange: { type: "object" },
    },
    clarification: "What report name and authorized analysis intent should be used?",
    actionId: "RPT-ACT-CREATE-AD-HOC-DEFINITION",
    risk: RISK.LOW,
    writes: true,
    previewFieldIds: [
      "RPT-DEFINITION-F-NAME",
      "RPT-DEFINITION-F-METRIC-IDS",
      "RPT-DEFINITION-F-DATA-SCOPE",
      "RPT-DEFINITION-F-TIME-RANGE",
    ],
    confirmerDutyRef: "DUTY-SUBJECT-TEACHER",
    reversal: "the report definition may be archived without changing any source fact",
  }),
  ...[
    ["CREATE", "Create", "RPT-ACT-CREATE-SUBSCRIPTION", [
      "RPT-SUBSCRIPTION-F-DEFINITION-REF",
      "RPT-SUBSCRIPTION-F-DEFINITION-VERSION",
      "RPT-SUBSCRIPTION-F-SCHEDULE-FREQUENCY",
      "RPT-SUBSCRIPTION-F-EXECUTION-TIME",
      "RPT-SUBSCRIPTION-F-TIMEZONE",
      "RPT-SUBSCRIPTION-F-RECIPIENTS",
    ]],
    ["UPDATE", "Update", "RPT-ACT-UPDATE-SUBSCRIPTION", [
      "RPT-SUBSCRIPTION-F-ID",
      "RPT-SUBSCRIPTION-F-SCHEDULE-FREQUENCY",
      "RPT-SUBSCRIPTION-F-EXECUTION-TIME",
      "RPT-SUBSCRIPTION-F-TIMEZONE",
      "RPT-SUBSCRIPTION-F-RECIPIENTS",
    ]],
    ["PAUSE", "Pause", "RPT-ACT-PAUSE-SUBSCRIPTION", ["RPT-SUBSCRIPTION-F-ID"]],
    ["CANCEL", "Cancel", "RPT-ACT-CANCEL-SUBSCRIPTION", ["RPT-SUBSCRIPTION-F-ID"]],
  ].map(([verb, label, actionId, previewFieldIds]) => aiTask({
    id: `AI-TASK-${verb}-REPORT-SUBSCRIPTION`,
    taskType: "PERIODIC",
    dutyRefs: ["DUTY-SUBJECT-TEACHER"],
    examples: [`${label} my authorized weekly learning report subscription`],
    parameters: { subscriptionRequest: { type: "string" } },
    clarification: "Which authorized report subscription and schedule should be managed?",
    actionId,
    risk: RISK.LOW,
    writes: true,
    previewFieldIds,
    confirmerDutyRef: "DUTY-SUBJECT-TEACHER",
    reversal: "subscription changes retain history and can be superseded by another authorized subscription Action",
  })),
  aiTask({
    id: "AI-TASK-CREATE-REMINDER",
    taskType: "REMINDER",
    dutyRefs: ["DUTY-SUBJECT-TEACHER"],
    examples: ["Remind this student in the App to finish the correction task tomorrow"],
    parameters: {
      sourceEvent: { type: "string" },
      recipientId: { type: "string" },
      reminderSummary: { type: "string" },
      deepLink: { type: "string" },
    },
    clarification: "What authorized summary and product destination should the reminder use?",
    actionId: "NOTI-ACT-CREATE-REMINDER",
    risk: RISK.LOW,
    writes: true,
    previewFieldIds: [
      "NOTI-NOTIFICATION-F-SOURCE-EVENT",
      "NOTI-NOTIFICATION-F-RECIPIENT",
      "NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE",
      "NOTI-NOTIFICATION-F-DEEP-LINK",
    ],
    confirmerDutyRef: "DUTY-SUBJECT-TEACHER",
    reversal: "a queued reminder can be superseded without changing the source business fact",
  }),
  aiTask({
    id: "AI-TASK-PUBLISH-ASSIGNMENT",
    taskType: "CONTROLLED_ACTION",
    dutyRefs: ["DUTY-SUBJECT-TEACHER"],
    examples: ["Publish this validated assignment now"],
    parameters: { assignmentId: { type: "string" } },
    clarification: "Which validated assignment version should be published?",
    actionId: "HW-ACT-PUBLISH-NOW",
    risk: RISK.HIGH,
    writes: true,
    previewFieldIds: [
      "HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS",
      "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
    ],
    confirmerDutyRef: "DUTY-SUBJECT-TEACHER",
    reversal: "published assignments change only through the target module's revision Action",
  }),
]);

export const aiReportingModules = deepFreeze([
  aixModule,
  reportModule,
  learningPathModule,
  notificationModule,
]);

function sourceRefs(values) {
  return values.map(([objectId, fieldId, version, semanticRole]) => ({
    objectId,
    fieldId,
    version,
    cardinality: "ONE",
    semanticRole,
  }));
}

const learningPathFlowSources = [
  {
    pathId: "PUBLISHED_RESULT",
    kind: "PUBLISHED-RESULT",
    moduleId: "PUB-001",
    participantRole: "PUBLISHED_RESULT_SOURCE",
    stepRole: "APPEND_PUBLISHED_RESULT",
    stepOrder: 1,
    sourceObjectId: "PUB-OBJ-RESULT",
    sourceIdentityFieldId: "PUB-RESULT-F-ID",
    sourceVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
    fanoutFieldId: "PUB-RESULT-F-STUDENT-REF",
  },
  {
    pathId: "EVIDENCE",
    kind: "EVIDENCE",
    moduleId: "INS-001",
    participantRole: "EVIDENCE_SOURCE",
    stepRole: "APPEND_EVIDENCE",
    stepOrder: 2,
    sourceObjectId: "INS-OBJ-EVIDENCE",
    sourceIdentityFieldId: "INS-EVIDENCE-F-ID",
    sourceVersionFieldId: "INS-EVIDENCE-F-EVIDENCE-VERSION",
    fanoutFieldId: "INS-EVIDENCE-F-STUDENT-REF",
  },
  {
    pathId: "CORRECTION",
    kind: "CORRECTION",
    moduleId: "CORR-001",
    participantRole: "CORRECTION_SOURCE",
    stepRole: "APPEND_CORRECTION",
    stepOrder: 3,
    sourceObjectId: "CORR-OBJ-ATTEMPT",
    sourceIdentityFieldId: "CORR-ATTEMPT-F-ID",
    sourceVersionFieldId: "CORR-ATTEMPT-F-CORRECTION-VERSION",
    fanoutFieldId: "CORR-ATTEMPT-F-STUDENT-REF",
  },
  {
    pathId: "PLAN_EXECUTION",
    kind: "PLAN-EXECUTION",
    moduleId: "APP-001",
    participantRole: "PLAN_EXECUTION_SOURCE",
    stepRole: "APPEND_PLAN_EXECUTION",
    stepOrder: 4,
    sourceObjectId: "APP-OBJ-TODO",
    sourceIdentityFieldId: "APP-TODO-F-ID",
    sourceVersionFieldId: "APP-TODO-F-AGGREGATION-VERSION",
    fanoutFieldId: "APP-TODO-F-STUDENT-REF",
  },
  {
    pathId: "TEACHER_CONFIRMATION",
    kind: "TEACHER-CONFIRMATION",
    moduleId: "GRD-001",
    participantRole: "TEACHER_CONFIRMATION_SOURCE",
    stepRole: "APPEND_TEACHER_CONFIRMATION",
    stepOrder: 5,
    sourceObjectId: "GRD-OBJ-DECISION",
    sourceIdentityFieldId: "GRD-DECISION-F-ID",
    sourceVersionFieldId: "GRD-DECISION-F-DECISION-VERSION",
    fanoutFieldId: "GRD-DECISION-F-SUBMISSION-REF",
  },
];

export const aiReportingFlows = deepFreeze([
  {
    id: "DF-011",
    label: "Versioned Learning Facts to Cross-term Learning Path",
    phase: PHASE.FIRST,
    contractProfile: "LEARNING_PATH_AGGREGATION",
    routingPolicy: "ACTION_CHOICE_REQUIRED",
    moduleIds: ["PUB-001", "INS-001", "CORR-001", "APP-001", "GRD-001", "LPATH-001"],
    sourceOnlyModuleIds: ["PUB-001", "INS-001", "CORR-001", "APP-001", "GRD-001"],
    participantRoles: [
      ...learningPathFlowSources.map(({ moduleId, participantRole: role }) => ({ moduleId, role })),
      { moduleId: "LPATH-001", role: "LEARNING_PATH_DERIVATION" },
    ],
    steps: [
      ...learningPathFlowSources.map((source) => ({
        order: source.stepOrder,
        actionId: `LPATH-ACT-APPEND-${source.kind}-TIMELINE`,
        semanticRole: source.stepRole,
        condition: `one current ${source.pathId} source version is appended without copying the source fact`,
        providedInputs: [],
      })),
      {
        order: 6,
        actionId: "LPATH-ACT-CREATE-INTERPRETATION-CANDIDATE",
        semanticRole: "CREATE_INTERPRETATION_CANDIDATE",
        condition: "a teacher-confirmed evidence version supports an explainable candidate for subject-teacher review",
        providedInputs: [],
      },
    ],
    executionPaths: learningPathFlowSources.map((source) => ({
      id: source.pathId,
      semanticRole: source.participantRole,
      stepOrders: source.pathId === "EVIDENCE"
        ? [source.stepOrder, 6]
        : [source.stepOrder],
      providedInputs: [],
      route: { kind: "ACTION_CHOICE", consumerStepOrder: source.stepOrder },
      sourceBindings: [{
        sourceObjectId: source.sourceObjectId,
        sourceIdentityFieldId: source.sourceIdentityFieldId,
        sourceVersionFieldId: source.sourceVersionFieldId,
        consumerStepOrder: source.stepOrder,
        targetRefFieldId: `LPATH-ENTRY-F-${source.kind}-REF`,
        targetVersionFieldId: `LPATH-ENTRY-F-${source.kind}-VERSION`,
        cardinality: "ONE",
      }],
      idempotencyKeyParts: {
        identityFieldIds: [source.sourceIdentityFieldId],
        versionFieldIds: [source.sourceVersionFieldId],
        fanoutFieldId: source.fanoutFieldId,
      },
    })),
    sourceDataRefs: learningPathFlowSources.flatMap((source) => (
      [source.sourceIdentityFieldId, source.fanoutFieldId, source.sourceVersionFieldId]
        .map((fieldId, index) => ({
          objectId: source.sourceObjectId,
          fieldId,
          version: source.sourceVersionFieldId,
          cardinality: source.pathId === "EVIDENCE" ? "ONE" : "ZERO_MANY",
          semanticRole: ["SOURCE_IDENTITY", "SOURCE_FANOUT", "SOURCE_VERSION"][index],
        }))
    )),
    targetDataRefs: [
      { objectId: "LPATH-OBJ-TIMELINE-ENTRY", fieldId: "LPATH-ENTRY-F-ID", version: "LPATH-ENTRY-F-VERSION", semanticRole: "TARGET_IDENTITY" },
      ...learningPathFlowSources.flatMap((source) => [
        { objectId: "LPATH-OBJ-TIMELINE-ENTRY", fieldId: `LPATH-ENTRY-F-${source.kind}-REF`, version: "LPATH-ENTRY-F-VERSION", semanticRole: "TARGET_LINEAGE" },
        { objectId: "LPATH-OBJ-TIMELINE-ENTRY", fieldId: `LPATH-ENTRY-F-${source.kind}-VERSION`, version: "LPATH-ENTRY-F-VERSION", semanticRole: "TARGET_LINEAGE" },
      ]),
      { objectId: "LPATH-OBJ-TIMELINE-ENTRY", fieldId: "LPATH-ENTRY-F-VERSION", version: "LPATH-ENTRY-F-VERSION", semanticRole: "TARGET_VERSION" },
      { objectId: "LPATH-OBJ-INTERPRETATION", fieldId: "LPATH-INTERPRETATION-F-ID", version: "LPATH-INTERPRETATION-F-VERSION", semanticRole: "TARGET_IDENTITY" },
      { objectId: "LPATH-OBJ-INTERPRETATION", fieldId: "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-REF", version: "LPATH-INTERPRETATION-F-VERSION", semanticRole: "TARGET_PAYLOAD" },
      { objectId: "LPATH-OBJ-INTERPRETATION", fieldId: "LPATH-INTERPRETATION-F-EVIDENCE-REFS", version: "LPATH-INTERPRETATION-F-VERSION", semanticRole: "TARGET_PAYLOAD" },
      { objectId: "LPATH-OBJ-INTERPRETATION", fieldId: "LPATH-INTERPRETATION-F-VERSION", version: "LPATH-INTERPRETATION-F-VERSION", semanticRole: "TARGET_VERSION" },
    ],
    idempotencyKeyParts: {
      identityFieldIds: ["INS-EVIDENCE-F-ID"],
      versionFieldIds: ["INS-EVIDENCE-F-EVIDENCE-VERSION"],
      fanoutFieldId: "INS-EVIDENCE-F-STUDENT-REF",
    },
    failureGranularity: "STUDENT_SOURCE_FACT_VERSION",
    retryPolicy: {
      strategy: "REFRESH_SELECTED_SOURCE_VERSION_AND_RETRY_FAILED_PATH_OBJECTS",
      maxAttempts: 4,
      retryableFailureResults: ["SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    },
    compensation: {
      strategy: "KEEP_ACCEPTED_SOURCE_FACT_AND_RETRY_ONLY_FAILED_DERIVED_OBJECTS",
      description: "a learning-path failure never rewrites evidence and never removes an accepted timeline entry",
    },
    downstreamInvalidation: {
      strategy: "SUPERSEDE_OR_MARK_STALE_BY_SOURCE_VERSION",
      targets: ["learning path interpretation version", "authorized path read model"],
    },
  },
  {
    id: "DF-013",
    label: "Student Plan Execution to Report Snapshot and In-product Delivery",
    phase: PHASE.FIRST,
    contractProfile: "REPORT_MATERIALIZATION",
    routingPolicy: "ACTION_CHOICE_REQUIRED",
    moduleIds: ["APP-001", "PLN-001", "RPT-001", "NOTI-001"],
    participantRoles: [
      { moduleId: "APP-001", role: "STUDENT_EXECUTION_SOURCE" },
      { moduleId: "PLN-001", role: "PLAN_COORDINATION_SOURCE" },
      { moduleId: "RPT-001", role: "REPORT_PIPELINE" },
      { moduleId: "NOTI-001", role: "NOTIFICATION_SINK" },
    ],
    steps: [
      { order: 1, actionId: "APP-ACT-VIEW-TODOS", semanticRole: "READ_STUDENT_EXECUTION", condition: "the student execution source is read inside the student's authorized scope", providedInputs: [] },
      { order: 2, actionId: "PLN-ACT-VIEW-HOMEROOM-COORDINATION", semanticRole: "READ_PLAN_COORDINATION", condition: "the plan coordination source remains read-only", providedInputs: [] },
      {
        order: 3,
        actionId: "RPT-ACT-CREATE-AD-HOC-RUN",
        semanticRole: "CREATE_AD_HOC_RUN",
        condition: "an authorized ad-hoc definition is pinned without a subscription",
        providedInputs: [
          { fieldId: "RPT-RUN-F-DEFINITION-REF", provider: { actorRef: "SYSTEM" } },
          { fieldId: "RPT-RUN-F-DEFINITION-VERSION", provider: { actorRef: "SYSTEM" } },
        ],
      },
      {
        order: 4,
        actionId: "RPT-ACT-CREATE-RUN",
        semanticRole: "CREATE_PERIODIC_RUN",
        condition: "an active periodic subscription and its definition are pinned",
        providedInputs: [
          { fieldId: "RPT-RUN-F-DEFINITION-REF", provider: { actorRef: "SYSTEM" } },
          { fieldId: "RPT-RUN-F-DEFINITION-VERSION", provider: { actorRef: "SYSTEM" } },
          { fieldId: "RPT-RUN-F-SUBSCRIPTION-REF", provider: { actorRef: "SYSTEM" } },
          { fieldId: "RPT-RUN-F-SUBSCRIPTION-VERSION", provider: { actorRef: "SYSTEM" } },
        ],
      },
      { order: 5, actionId: "RPT-ACT-START-RUN", semanticRole: "START_RUN", condition: "the queued run passes permission and source-version checks", providedInputs: [] },
      { order: 6, actionId: "RPT-ACT-COMPLETE-RUN", semanticRole: "COMPLETE_RUN", condition: "the source-pinned report query completes", providedInputs: [] },
      { order: 7, actionId: "RPT-ACT-MATERIALIZE-SNAPSHOT", semanticRole: "MATERIALIZE_SNAPSHOT", condition: "the successful run becomes an immutable snapshot", providedInputs: [] },
      { order: 8, actionId: "RPT-ACT-CREATE-DELIVERY", semanticRole: "CREATE_DELIVERY", condition: "the snapshot receives a separate in-product delivery record", providedInputs: [] },
      { order: 9, actionId: "NOTI-ACT-CREATE-REPORT-NOTIFICATION", semanticRole: "CREATE_NOTIFICATION", condition: "the product notification contains only an authorized summary and deep link", providedInputs: [] },
    ],
    executionPaths: [
      {
        id: "AD_HOC",
        semanticRole: "AD_HOC_RUN",
        stepOrders: [1, 2, 3, 5, 6, 7, 8, 9],
        providedInputs: [],
        route: { kind: "ACTION_CHOICE", consumerStepOrder: 3 },
        sourceBindings: [{
          sourceObjectId: "RPT-OBJ-DEFINITION",
          sourceIdentityFieldId: "RPT-DEFINITION-F-ID",
          sourceVersionFieldId: "RPT-DEFINITION-F-VERSION",
          consumerStepOrder: 3,
          targetRefFieldId: "RPT-RUN-F-DEFINITION-REF",
          targetVersionFieldId: "RPT-RUN-F-DEFINITION-VERSION",
          cardinality: "ONE",
        }],
        idempotencyKeyParts: {
          identityFieldIds: ["RPT-DEFINITION-F-ID", "APP-TODO-F-ID", "PLN-PLAN-F-ID"],
          versionFieldIds: [
            "RPT-DEFINITION-F-VERSION",
            "APP-TODO-F-AGGREGATION-VERSION",
            "PLN-PLAN-F-PLAN-VERSION",
            "PLN-HOMEROOM-F-OUTPUT-VERSION",
          ],
          fanoutFieldId: "APP-TODO-F-STUDENT-REF",
        },
      },
      {
        id: "PERIODIC",
        semanticRole: "PERIODIC_RUN",
        stepOrders: [1, 2, 4, 5, 6, 7, 8, 9],
        providedInputs: [],
        route: { kind: "ACTION_CHOICE", consumerStepOrder: 4 },
        sourceBindings: [
          {
            sourceObjectId: "RPT-OBJ-DEFINITION",
            sourceIdentityFieldId: "RPT-DEFINITION-F-ID",
            sourceVersionFieldId: "RPT-DEFINITION-F-VERSION",
            consumerStepOrder: 4,
            targetRefFieldId: "RPT-RUN-F-DEFINITION-REF",
            targetVersionFieldId: "RPT-RUN-F-DEFINITION-VERSION",
            cardinality: "ONE",
          },
          {
            sourceObjectId: "RPT-OBJ-SUBSCRIPTION",
            sourceIdentityFieldId: "RPT-SUBSCRIPTION-F-ID",
            sourceVersionFieldId: "RPT-SUBSCRIPTION-F-VERSION",
            consumerStepOrder: 4,
            targetRefFieldId: "RPT-RUN-F-SUBSCRIPTION-REF",
            targetVersionFieldId: "RPT-RUN-F-SUBSCRIPTION-VERSION",
            cardinality: "ONE",
          },
        ],
        idempotencyKeyParts: {
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
        },
      },
    ],
    sourceDataRefs: sourceRefs([
      ["RPT-OBJ-DEFINITION", "RPT-DEFINITION-F-ID", "RPT-DEFINITION-F-VERSION", "SOURCE_IDENTITY"],
      ["RPT-OBJ-DEFINITION", "RPT-DEFINITION-F-VERSION", "RPT-DEFINITION-F-VERSION", "SOURCE_VERSION"],
      ["APP-OBJ-TODO", "APP-TODO-F-ID", "APP-TODO-F-AGGREGATION-VERSION", "SOURCE_IDENTITY"],
      ["APP-OBJ-TODO", "APP-TODO-F-STUDENT-REF", "APP-TODO-F-AGGREGATION-VERSION", "SOURCE_FANOUT"],
      ["APP-OBJ-TODO", "APP-TODO-F-SOURCE-PLAN-REF", "APP-TODO-F-AGGREGATION-VERSION", "SOURCE_PAYLOAD"],
      ["APP-OBJ-TODO", "APP-TODO-F-SOURCE-PLAN-VERSION", "APP-TODO-F-AGGREGATION-VERSION", "SOURCE_PAYLOAD"],
      ["APP-OBJ-TODO", "APP-TODO-F-LOCAL-PROGRESS", "APP-TODO-F-AGGREGATION-VERSION", "SOURCE_PAYLOAD"],
      ["APP-OBJ-TODO", "APP-TODO-F-COMPLETION-EVIDENCE", "APP-TODO-F-AGGREGATION-VERSION", "SOURCE_PAYLOAD"],
      ["APP-OBJ-TODO", "APP-TODO-F-DIFFICULTY-FEEDBACK", "APP-TODO-F-AGGREGATION-VERSION", "SOURCE_PAYLOAD"],
      ["APP-OBJ-TODO", "APP-TODO-F-AGGREGATION-VERSION", "APP-TODO-F-AGGREGATION-VERSION", "SOURCE_VERSION"],
      ["PLN-OBJ-PLAN", "PLN-PLAN-F-ID", "PLN-PLAN-F-PLAN-VERSION", "SOURCE_IDENTITY"],
      ["PLN-OBJ-PLAN", "PLN-PLAN-F-PLAN-VERSION", "PLN-PLAN-F-PLAN-VERSION", "SOURCE_VERSION"],
      ["PLN-OBJ-HOMEROOM-COORDINATION", "PLN-HOMEROOM-F-ID", "PLN-HOMEROOM-F-OUTPUT-VERSION", "SOURCE_IDENTITY"],
      ["PLN-OBJ-HOMEROOM-COORDINATION", "PLN-HOMEROOM-F-OUTPUT-VERSION", "PLN-HOMEROOM-F-OUTPUT-VERSION", "SOURCE_VERSION"],
    ]).concat([
      { objectId: "RPT-OBJ-SUBSCRIPTION", fieldId: "RPT-SUBSCRIPTION-F-ID", version: "RPT-SUBSCRIPTION-F-VERSION", cardinality: "ZERO_MANY", semanticRole: "SOURCE_IDENTITY" },
      { objectId: "RPT-OBJ-SUBSCRIPTION", fieldId: "RPT-SUBSCRIPTION-F-VERSION", version: "RPT-SUBSCRIPTION-F-VERSION", cardinality: "ZERO_MANY", semanticRole: "SOURCE_VERSION" },
    ]),
    targetDataRefs: [
      { objectId: "RPT-OBJ-RUN", fieldId: "RPT-RUN-F-ID", version: "RPT-RUN-F-VERSION", semanticRole: "TARGET_IDENTITY" },
      { objectId: "RPT-OBJ-RUN", fieldId: "RPT-RUN-F-PERMISSION-RESULT", version: "RPT-RUN-F-VERSION", semanticRole: "TARGET_PAYLOAD" },
      { objectId: "RPT-OBJ-RUN", fieldId: "RPT-RUN-F-DATA-CUTOFF", version: "RPT-RUN-F-VERSION", semanticRole: "TARGET_PAYLOAD" },
      { objectId: "RPT-OBJ-RUN", fieldId: "RPT-RUN-F-SOURCE-VERSIONS", version: "RPT-RUN-F-VERSION", semanticRole: "TARGET_PAYLOAD" },
      { objectId: "RPT-OBJ-RUN", fieldId: "RPT-RUN-F-RESULT", version: "RPT-RUN-F-VERSION", semanticRole: "TARGET_PAYLOAD" },
      { objectId: "RPT-OBJ-RUN", fieldId: "RPT-RUN-F-VERSION", version: "RPT-RUN-F-VERSION", semanticRole: "TARGET_VERSION" },
      { objectId: "RPT-OBJ-SNAPSHOT", fieldId: "RPT-SNAPSHOT-F-ID", version: "RPT-SNAPSHOT-F-VERSION", semanticRole: "TARGET_IDENTITY" },
      { objectId: "RPT-OBJ-SNAPSHOT", fieldId: "RPT-SNAPSHOT-F-RUN-REF", version: "RPT-SNAPSHOT-F-VERSION", semanticRole: "TARGET_LINEAGE" },
      { objectId: "RPT-OBJ-SNAPSHOT", fieldId: "RPT-SNAPSHOT-F-RUN-VERSION", version: "RPT-SNAPSHOT-F-VERSION", semanticRole: "TARGET_LINEAGE" },
      { objectId: "RPT-OBJ-SNAPSHOT", fieldId: "RPT-SNAPSHOT-F-SOURCE-VERSIONS", version: "RPT-SNAPSHOT-F-VERSION", semanticRole: "TARGET_PAYLOAD" },
      { objectId: "RPT-OBJ-SNAPSHOT", fieldId: "RPT-SNAPSHOT-F-VERSION", version: "RPT-SNAPSHOT-F-VERSION", semanticRole: "TARGET_VERSION" },
      { objectId: "RPT-OBJ-DELIVERY", fieldId: "RPT-DELIVERY-F-ID", version: "RPT-DELIVERY-F-VERSION", semanticRole: "TARGET_IDENTITY" },
      { objectId: "RPT-OBJ-DELIVERY", fieldId: "RPT-DELIVERY-F-STATE", version: "RPT-DELIVERY-F-VERSION", semanticRole: "TARGET_STATE" },
      { objectId: "RPT-OBJ-DELIVERY", fieldId: "RPT-DELIVERY-F-VERSION", version: "RPT-DELIVERY-F-VERSION", semanticRole: "TARGET_VERSION" },
      { objectId: "NOTI-OBJ-NOTIFICATION", fieldId: "NOTI-NOTIFICATION-F-ID", version: "NOTI-NOTIFICATION-F-VERSION", semanticRole: "TARGET_IDENTITY" },
      { objectId: "NOTI-OBJ-NOTIFICATION", fieldId: "NOTI-NOTIFICATION-F-DEEP-LINK", version: "NOTI-NOTIFICATION-F-VERSION", semanticRole: "TARGET_PAYLOAD" },
      { objectId: "NOTI-OBJ-NOTIFICATION", fieldId: "NOTI-NOTIFICATION-F-VERSION", version: "NOTI-NOTIFICATION-F-VERSION", semanticRole: "TARGET_VERSION" },
    ],
    idempotencyKeyParts: {
      identityFieldIds: ["RPT-DEFINITION-F-ID", "APP-TODO-F-ID", "PLN-PLAN-F-ID"],
      versionFieldIds: [
        "RPT-DEFINITION-F-VERSION",
        "APP-TODO-F-AGGREGATION-VERSION",
        "PLN-PLAN-F-PLAN-VERSION",
        "PLN-HOMEROOM-F-OUTPUT-VERSION",
      ],
      fanoutFieldId: "APP-TODO-F-STUDENT-REF",
    },
    failureGranularity: "REPORT_RUN_SNAPSHOT_DELIVERY_AND_NOTIFICATION_OBJECT",
    retryPolicy: {
      strategy: "RECHECK_PERMISSION_REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_OUTPUTS",
      maxAttempts: 4,
      retryableFailureResults: ["SOURCE_VERSION_STALE", "DELIVERY_FAILED", "VERSION_CONFLICT"],
    },
    compensation: {
      strategy: "KEEP_SOURCE_EXECUTION_RUN_AND_SNAPSHOT_WHILE_RETRYING_DELIVERY_ONLY",
      description: "delivery or notification failure never rolls back student execution, plan, successful run, or immutable snapshot",
    },
    downstreamInvalidation: {
      strategy: "CREATE_A_NEW_RUN_FOR_NEW_SOURCE_VERSIONS",
      targets: ["future report run", "future report snapshot", "in-product delivery retry"],
    },
  },
]);
