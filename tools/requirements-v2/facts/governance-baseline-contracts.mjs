import {
  CLIENT,
  RISK,
  deepFreeze,
} from "../model.mjs";
import { withStudentDataClassification } from "./student-data-classification.mjs";

const WEB_APP = [CLIENT.WEB, CLIENT.APP];
const GOVERNANCE_DECISION_OWNER = new Map([
  ["D019", "ACC-001"],
  ["D020", "ACC-001"],
  ["D027", "TEA-001"],
  ["D028", "TEA-001"],
  ["D039", "NOTI-001"],
  ["D041", "TEA-001"],
  ["D047", "DGV-001"],
  ["D048", "DGV-001"],
  ["D049", "DGV-001"],
  ["D067", "CONTENT-001"],
  ["D068", "CONTENT-001"],
  ["D069", "CONTENT-001"],
]);
const OWNER_MODULE_IDS = [...new Set(GOVERNANCE_DECISION_OWNER.values())];

const TEACHER_DOMAINS = [
  "WORKBENCH",
  "TEACHING_SPACE",
  "LEARNING_ACTIVITIES",
  "MATERIALS_ASSETS",
  "NOTIFICATION_COLLABORATION",
  "ACCOUNT_HANDOVER",
];

const SCHOOL_ADMIN_DOMAINS = [
  "OVERVIEW_READINESS",
  "TEACHING_ORGANIZATION",
  "PEOPLE_RELATIONSHIPS",
  "PERMISSIONS_ACCOUNT_SECURITY",
  "ASSETS_HANDOVER",
  "AUDIT_DATA_SERVICES",
];

const DATA_CATALOG_AXIS_FIELD_IDS = [
  "DGV-CATALOG-F-NATURE",
  "DGV-CATALOG-F-DATA-SUBJECT",
  "DGV-CATALOG-F-MANAGEMENT-SCOPE",
  "DGV-CATALOG-F-SOURCE-RIGHTS",
  "DGV-CATALOG-F-PURPOSE",
  "DGV-CATALOG-F-SENSITIVITY",
  "DGV-CATALOG-F-PORTABILITY",
  "DGV-CATALOG-F-LIFECYCLE",
];

const DELETION_OBJECT_CATEGORIES = [
  "RAW_TEXT",
  "IMAGE",
  "AUDIO",
  "AI_RESULT",
  "LEARNING_PROFILE",
  "VIDEO",
  "SCHOOL_FACT",
  "SHARED_ASSOCIATION",
  "LEGAL_HOLD_RECORD",
];

function optionSet(id, key, label, values) {
  return {
    id,
    key,
    label,
    mode: "STATIC",
    values: values.map(([code, valueLabel]) => ({ code, label: valueLabel })),
  };
}

export const governanceBaselineOptionSets = deepFreeze([
  optionSet("OPT-BL2-001", "roleExperienceKind", "Role experience kind", [
    ["TEACHER", "Teacher"],
    ["SCHOOL_ADMIN", "School administrator"],
  ]),
  optionSet("OPT-BL2-002", "ageStage", "Age stage", [
    ["PRIMARY", "Primary school"],
    ["MIDDLE", "Middle school"],
  ]),
  optionSet("OPT-BL2-003", "dataNature", "Data nature", [
    ["RAW_FACT", "Raw fact"],
    ["TEACHING_BASELINE", "Teaching baseline"],
    ["AI_DERIVED", "AI-derived interpretation"],
    ["SYSTEM_GOVERNANCE", "System governance"],
  ]),
  optionSet("OPT-BL2-004", "dataSubjectKind", "Data subject kind", [
    ["STUDENT", "Student"],
    ["GUARDIAN", "Guardian"],
    ["TEACHER", "Teacher"],
    ["SCHOOL", "School"],
    ["PLATFORM", "Platform"],
    ["MIXED", "Multiple subjects"],
  ]),
  optionSet("OPT-BL2-005", "productManagementScope", "Product management scope", [
    ["STUDENT_MEMORY", "Student learning memory"],
    ["SCHOOL_PRIVATE", "School private layer"],
    ["PLATFORM_PUBLIC", "Platform public layer"],
    ["PLATFORM_GOVERNANCE", "Platform governance layer"],
  ]),
  optionSet("OPT-BL2-006", "sourceRightsBasis", "Source rights basis", [
    ["ORIGINAL_AUTHOR", "Original author right"],
    ["LICENSE", "License"],
    ["CONSENT", "Verified consent"],
    ["STATUTORY", "Statutory basis"],
    ["CONTRACTUAL", "Contractual basis"],
    ["UNKNOWN", "Unknown and blocked"],
  ]),
  optionSet("OPT-BL2-007", "dataUsePurpose", "Data use purpose", [
    ["TEACHING", "Teaching"],
    ["ASSESSMENT", "Assessment"],
    ["PERSONALIZATION", "Personalization"],
    ["GOVERNANCE", "Governance"],
    ["SAFETY", "Safety"],
    ["LEGAL_HOLD", "Legal or dispute hold"],
  ]),
  optionSet("OPT-BL2-008", "dataSensitivityAxis", "Data sensitivity axis", [
    ["PUBLIC", "Public"],
    ["SCHOOL_INTERNAL", "School internal"],
    ["MINOR_PERSONAL", "Minor personal data"],
    ["HIGH_SECURITY", "High-security identity or audit data"],
  ]),
  optionSet("OPT-BL2-009", "dataPortability", "Data portability", [
    ["NON_PORTABLE", "Non-portable"],
    ["AUTHORIZED_SUBSET", "Authorized subset"],
    ["DEIDENTIFIED_ONLY", "Deidentified only"],
    ["PORTABLE", "Portable"],
  ]),
  optionSet("OPT-BL2-010", "dataLifecycleAxis", "Data lifecycle axis", [
    ["TEMPORARY", "Temporary"],
    ["TERM_BOUND", "Term-bound"],
    ["RELATION_BOUND", "Relationship-bound"],
    ["LEGAL_RETENTION", "Legal retention"],
    ["PERMANENT_DEIDENTIFIED", "Permanently deidentified"],
  ]),
  optionSet("OPT-BL2-011", "governanceActionKind", "Governance action kind", [
    ["CORRECT", "Correct"],
    ["RESTRICT_ACCESS", "Restrict access"],
    ["PHYSICAL_DELETE", "Physical delete"],
    ["IRREVERSIBLE_DEIDENTIFY", "Irreversibly deidentify"],
  ]),
  optionSet("OPT-BL2-012", "studentDeletionObjectCategory", "Student deletion object category", [
    ["RAW_TEXT", "Raw text"],
    ["IMAGE", "Image"],
    ["AUDIO", "Audio"],
    ["AI_RESULT", "AI result"],
    ["LEARNING_PROFILE", "Learning profile"],
    ["VIDEO", "Video"],
    ["SCHOOL_FACT", "School fact"],
    ["SHARED_ASSOCIATION", "Shared association"],
    ["LEGAL_HOLD_RECORD", "Legal hold record"],
  ]),
  optionSet("OPT-BL2-013", "studentDeletionOutcome", "Student deletion outcome", [
    ["CORRECT", "Correct"],
    ["RESTRICT_ACCESS", "Restrict access"],
    ["PHYSICAL_DELETE", "Physical delete"],
    ["IRREVERSIBLE_DEIDENTIFY", "Irreversibly deidentify"],
    ["RETAIN_LEGAL_HOLD", "Retain under legal or dispute hold"],
  ]),
  optionSet("OPT-BL2-014", "deletionExecutionStatus", "Deletion execution status", [
    ["PENDING", "Pending"],
    ["FROZEN", "Frozen by dispute"],
    ["AUTHORIZED", "Authorized"],
    ["EXECUTING", "Executing"],
    ["COMPLETED", "Completed"],
    ["FAILED", "Failed"],
  ]),
  optionSet("OPT-BL2-015", "materialSourceKind", "Material source kind", [
    ["PLATFORM_BASELINE", "Platform baseline"],
    ["SCHOOL_PRIVATE", "School-private material"],
    ["TEACHER_AUTHORED", "Teacher-authored material"],
    ["LICENSED_THIRD_PARTY", "Licensed third-party material"],
    ["AI_GENERATED", "AI-generated material"],
    ["STUDENT_WORK", "Student work"],
  ]),
  optionSet("OPT-BL2-016", "schoolReorganizationKind", "School reorganization kind", [
    ["MERGE", "Merge"],
    ["SEPARATE", "Separate"],
  ]),
]);

export const governanceBaselineEvents = deepFreeze([
  {
    id: "EVT-NOTIFICATION-BUSINESS-FACT-ACCEPTED",
    label: "Business fact accepted for notification coordination",
    definition: "A versioned business fact is accepted and may independently produce a todo or message.",
    triggeredActionIds: ["NOTI-ACT-RECORD-BUSINESS-EVENT"],
  },
  {
    id: "EVT-NOTIFICATION-MESSAGE-AVAILABLE",
    label: "Notification message available for delivery",
    definition: "An authorized in-product message is available and may create an independent channel-delivery attempt.",
    triggeredActionIds: ["NOTI-ACT-QUEUE-DELIVERY"],
  },
]);

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
    historyPolicy: "retain accepted values with actor, source, time, and version provenance",
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

function versionField(id, label, overrides = {}) {
  return field(id, label, {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
    ...overrides,
  });
}

function systemField(id, label, dataType = "STRING", overrides = {}) {
  return field(id, label, {
    dataType,
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    ...overrides,
  });
}

function optionField(id, label, optionSetId, overrides = {}) {
  return field(id, label, {
    valueSource: { kind: "OPTION_SET", optionSetId },
    ...overrides,
  });
}

function versionPinnedReference({
  id,
  label,
  targetObjectId,
  versionFieldId,
  targetVersionFieldId,
  requiredActionIds = [],
  stateGuardPolicy = requiredActionIds.length > 0 ? "ALWAYS_REQUIRED" : "NONE",
  overrides = {},
}) {
  return field(id, label, {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy,
    actionApplicability: { requiredActionIds },
    versionBinding: { versionFieldId, targetVersionFieldId },
    ...overrides,
  });
}

function responsibility(dataSubject, producerRef, ownerRef, confirmerRef, stewardRef) {
  return {
    dataSubject,
    controlSubject: "SCHOOL",
    producerRef,
    ownerRef,
    confirmerRef,
    stewardRef,
  };
}

function domainObject({
  id,
  label,
  dataSubject,
  producerRef,
  ownerRef,
  confirmerRef = ownerRef,
  stewardRef = ownerRef,
  lifecyclePolicyId = "LIFE-001",
  sensitivityId = "S2",
  states,
  fields,
  lineageBindings,
  overrides = {},
}) {
  return withStudentDataClassification({
    id,
    label,
    ...responsibility(dataSubject, producerRef, ownerRef, confirmerRef, stewardRef),
    lifecyclePolicyId,
    sensitivityId,
    readMode: "NO_DIRECT_READ",
    stateReachability: { mode: "ACTION_GRAPH", initialStateIds: [] },
    states,
    fields,
    ...(lineageBindings ? { lineageBindings } : {}),
    ...overrides,
  });
}

function actorReference(ref) {
  if (ref.startsWith("ROLE-")) return { roleRef: ref };
  if (ref.startsWith("DUTY-")) return { dutyRef: ref };
  return { actorRef: ref };
}

function allowDeny(allowRef, denyRef, allowCondition, denyCondition) {
  return [
    { effect: "ALLOW", ...actorReference(allowRef), condition: allowCondition },
    { effect: "DENY", ...actorReference(denyRef), condition: denyCondition },
  ];
}

function actionFact({
  id,
  label,
  targetObjectId,
  inputFieldIds = [],
  outputFieldIds = [],
  operationKind,
  transition,
  successState,
  permissions,
  pageId,
  executionMode = "USER_TASK",
  trigger,
  risk,
  failureResults = ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT"],
  boundaryResultCodes = [],
  failurePredicates = {},
  relatedStateGuards,
  extras = {},
}) {
  const writes = operationKind !== "READ";
  const effectiveRisk = risk ?? (writes ? RISK.LOW : RISK.READ);
  const closedFailures = effectiveRisk === RISK.HIGH
    ? [...new Set([...failureResults, "AUDIT_FAILED"])]
    : failureResults;
  const successScenario = {
    id: `${id}-SCN-SUCCESS`,
    kind: "SUCCESS",
    actionId: id,
    ...(executionMode === "USER_TASK" ? { pageId } : { trigger }),
    given: `the actor meets the entry conditions for ${label}`,
    when: `the actor requests ${label}`,
    then: {
      expectedData: `${label} returns the authorized versioned result`,
      expectedState: operationKind === "READ"
        ? { mode: "UNCHANGED" }
        : { mode: "STATE", value: successState ?? transition?.to },
      expectedPermission: "ALLOW",
      expectedVisibility: "authorized object scope only",
    },
  };
  const failureScenarios = closedFailures.map((resultCode) => ({
    id: `${id}-SCN-${resultCode}`,
    kind: boundaryResultCodes.includes(resultCode) ? "BOUNDARY" : "FAILURE",
    resultCode,
    actionId: id,
    ...(executionMode === "USER_TASK" ? { pageId } : { trigger }),
    given: `${resultCode} applies to ${label}`,
    when: `the actor requests ${label}`,
    ...(failurePredicates[resultCode]
      ? { failurePredicate: failurePredicates[resultCode] }
      : {}),
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
      outputFieldIds,
      ...(transition ? { transition } : {}),
      operationKind,
      writes,
      risk: effectiveRisk,
      executionMode,
      ...(executionMode === "USER_TASK" ? { clients: WEB_APP } : { trigger }),
      permissions,
      scenarioIds: [successScenario.id, ...failureScenarios.map(({ id: scenarioId }) => scenarioId)],
      ...(writes ? { idempotencyKey: `${id}:school:object:source-version:request-id` } : {}),
      auditMode: writes ? "REQUIRED" : "NOT_REQUIRED",
      failureResults: closedFailures,
      ...(relatedStateGuards ? { relatedStateGuards } : {}),
      ...extras,
    },
    scenarios: [successScenario, ...failureScenarios],
  };
}

function page(id, label, objectIds, actionIds, fieldIds) {
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

function appendActionFacts(module, actionFacts) {
  module.actions.push(...actionFacts.map(({ action }) => action));
  module.scenarios.push(...actionFacts.flatMap(({ scenarios }) => scenarios));
}

function appendBoundaryScenario(
  module,
  action,
  resultCode,
  failurePredicate,
  expectedData,
  kind = "BOUNDARY",
) {
  if (!action.failureResults.includes(resultCode)) action.failureResults.push(resultCode);
  const scenarioId = `${action.id}-SCN-${resultCode}`;
  if (!action.scenarioIds.includes(scenarioId)) action.scenarioIds.push(scenarioId);
  if (module.scenarios.some(({ id }) => id === scenarioId)) return;
  const pageId = module.pages.find(({ actionIds }) => actionIds.includes(action.id))?.id;
  module.scenarios.push({
    id: scenarioId,
    kind,
    resultCode,
    actionId: action.id,
    ...(action.executionMode === "USER_TASK" ? { pageId } : { trigger: structuredClone(action.trigger) }),
    given: `${resultCode} blocks ${action.label}`,
    when: `the actor requests ${action.label}`,
    failurePredicate,
    then: {
      expectedData,
      expectedState: { mode: "UNCHANGED" },
      expectedPermission: "DENY",
      expectedVisibility: "no material content outside the authorized source rights and management chain",
    },
  });
}

function requireExactlyOne(values, id, kind) {
  const matches = values.filter((value) => value?.id === id);
  if (matches.length !== 1) {
    throw new Error(`${kind} ${id} must exist exactly once before governance baseline transformation`);
  }
  return matches[0];
}

function addFields(object, fields) {
  const existing = new Set(object.fields.map(({ id }) => id));
  for (const value of fields) {
    if (existing.has(value.id)) throw new Error(`field ${value.id} already exists`);
    object.fields.push(value);
    existing.add(value.id);
  }
}

function lineage(refFieldId, versionFieldId, targetObjectId, targetVersionFieldId) {
  return { refFieldId, versionFieldId, targetObjectId, targetVersionFieldId };
}

function ownerContract(moduleId, decisionIds) {
  return { moduleId, decisionIds };
}

function enhanceAccountModule(module) {
  const school = requireExactlyOne(module.objects, "ACC-OBJ-SCHOOL", "object");
  addFields(school, [
    field("ACC-SCHOOL-F-GOVERNANCE-BOUNDARY-ID", "Independent School Governance Boundary ID", {
      dataType: "ID",
      valueSource: { kind: "SYSTEM" },
      mutability: "IMMUTABLE",
    }),
    field("ACC-SCHOOL-F-LEGAL-SUBJECT-REF", "Verified School Legal Subject Reference", {
      dataType: "ID",
      valueSource: { kind: "SYSTEM" },
      mutability: "IMMUTABLE",
    }),
  ]);
  const syncSchool = requireExactlyOne(module.actions, "ACC-ACT-SYNC-SCHOOL", "action");
  syncSchool.inputFieldIds.push(
    "ACC-SCHOOL-F-GOVERNANCE-BOUNDARY-ID",
    "ACC-SCHOOL-F-LEGAL-SUBJECT-REF",
  );
  syncSchool.outputFieldIds.push(
    "ACC-SCHOOL-F-GOVERNANCE-BOUNDARY-ID",
    "ACC-SCHOOL-F-LEGAL-SUBJECT-REF",
  );

  const structuralObjects = [
    domainObject({
      id: "ACC-OBJ-CAMPUS",
      label: "School Campus",
      dataSubject: "SCHOOL_ENTITY_STRUCTURE",
      producerRef: "ROLE-SCHOOL-ADMIN",
      ownerRef: "ROLE-SCHOOL-ADMIN",
      states: ["ACTIVE", "ENDED"],
      fields: [
        identityField("ACC-CAMPUS-F-ID", "Campus ID"),
        field("ACC-CAMPUS-F-SCHOOL-ID", "Independent School Entity ID", { dataType: "ID", mutability: "IMMUTABLE" }),
        field("ACC-CAMPUS-F-NAME", "Campus Name"),
        systemField("ACC-CAMPUS-F-VERSION", "Campus Version", "INTEGER", { idempotencyRole: "OBJECT_VERSION" }),
      ],
    }),
    domainObject({
      id: "ACC-OBJ-EDUCATION-GROUP",
      label: "Education Group",
      dataSubject: "SCHOOL_ENTITY_STRUCTURE",
      producerRef: "ROLE-SCHOOL-ADMIN",
      ownerRef: "ROLE-SCHOOL-ADMIN",
      states: ["ACTIVE", "ENDED"],
      fields: [
        identityField("ACC-GROUP-F-ID", "Education Group ID"),
        field("ACC-GROUP-F-NAME", "Education Group Name"),
        field("ACC-GROUP-F-MEMBER-SCHOOL-IDS", "Explicit Member School IDs", { dataType: "STRING_ARRAY" }),
        systemField("ACC-GROUP-F-DATA-SHARING-AUTHORIZATION-REFS", "Explicit Data-sharing Authorization References", "JSON", { required: false }),
        systemField("ACC-GROUP-F-VERSION", "Education Group Version", "INTEGER", { idempotencyRole: "OBJECT_VERSION" }),
      ],
      overrides: {
        dataBoundaryPolicy: "group membership never implies cross-school data access",
      },
    }),
    domainObject({
      id: "ACC-OBJ-SCHOOL-NAME-VERSION",
      label: "School Name Version",
      dataSubject: "SCHOOL_ENTITY_STRUCTURE",
      producerRef: "ROLE-SCHOOL-ADMIN",
      ownerRef: "ROLE-SCHOOL-ADMIN",
      states: ["ACTIVE", "SUPERSEDED"],
      fields: [
        identityField("ACC-NAME-F-ID", "School Name Version ID"),
        field("ACC-NAME-F-SCHOOL-ID", "School Entity ID", { dataType: "ID", mutability: "IMMUTABLE" }),
        field("ACC-NAME-F-DISPLAY-NAME", "School Display Name"),
        field("ACC-NAME-F-EFFECTIVE-AT", "Name Effective Time", { dataType: "DATETIME" }),
        systemField("ACC-NAME-F-VERSION", "School Name Version", "INTEGER", { idempotencyRole: "OBJECT_VERSION" }),
      ],
      overrides: {
        identityEffect: "a name version never creates, merges, or shares a school governance boundary",
      },
    }),
    domainObject({
      id: "ACC-OBJ-SCHOOL-REORGANIZATION",
      label: "School Merge or Separation Case",
      dataSubject: "SCHOOL_ENTITY_STRUCTURE",
      producerRef: "ROLE-PLATFORM-GOVERNANCE",
      ownerRef: "ROLE-PLATFORM-GOVERNANCE",
      states: ["REQUESTED", "AUTHORIZED", "EXECUTED", "DENIED"],
      fields: [
        identityField("ACC-REORG-F-ID", "School Reorganization Case ID"),
        optionField("ACC-REORG-F-KIND", "Reorganization Kind", "OPT-BL2-016", { mutability: "IMMUTABLE" }),
        field("ACC-REORG-F-SOURCE-SCHOOL-IDS", "Source School Entity IDs", { dataType: "STRING_ARRAY", mutability: "IMMUTABLE" }),
        field("ACC-REORG-F-TARGET-SCHOOL-IDS", "Target School Entity IDs", { dataType: "STRING_ARRAY", mutability: "IMMUTABLE" }),
        field("ACC-REORG-F-DATA-MIGRATION-AUTHORIZATION", "Object-level Data Migration Authorization", { dataType: "JSON", mutability: "IMMUTABLE" }),
        systemField("ACC-REORG-F-STATUS", "Reorganization Status"),
        systemField("ACC-REORG-F-VERSION", "Reorganization Version", "INTEGER", { idempotencyRole: "OBJECT_VERSION" }),
      ],
    }),
  ];

  const readinessObjects = [
    domainObject({
      id: "ACC-OBJ-SCHOOL-APPLICATION-REVIEW",
      label: "School Application Review",
      dataSubject: "SCHOOL_READINESS_AXIS",
      producerRef: "CURRENT_ACTOR",
      ownerRef: "ROLE-PLATFORM-GOVERNANCE",
      confirmerRef: "ROLE-PLATFORM-GOVERNANCE",
      states: ["SUBMITTED", "APPROVED", "REJECTED"],
      fields: [
        identityField("ACC-APPREVIEW-F-ID", "School Application Review ID"),
        field("ACC-APPREVIEW-F-APPLICANT-REF", "Applicant Reference", { dataType: "ID", mutability: "IMMUTABLE" }),
        field("ACC-APPREVIEW-F-LEGAL-SUBJECT-EVIDENCE", "Legal Subject Evidence", { dataType: "JSON", mutability: "IMMUTABLE" }),
        systemField("ACC-APPREVIEW-F-DECISION", "Application Review Decision"),
        systemField("ACC-APPREVIEW-F-VERSION", "Application Review Version", "INTEGER", { idempotencyRole: "OBJECT_VERSION" }),
      ],
      sensitivityId: "S4",
    }),
    domainObject({
      id: "ACC-OBJ-SCHOOL-INITIALIZATION",
      label: "School Initialization Readiness",
      dataSubject: "SCHOOL_READINESS_AXIS",
      producerRef: "ROLE-SCHOOL-ADMIN",
      ownerRef: "ROLE-SCHOOL-ADMIN",
      states: ["NOT_STARTED", "VALIDATING", "READY", "BLOCKED"],
      fields: [
        identityField("ACC-INIT-F-ID", "School Initialization ID"),
        field("ACC-INIT-F-SCHOOL-ID", "School Entity ID", { dataType: "ID", mutability: "IMMUTABLE" }),
        field("ACC-INIT-F-CHECKLIST-EVIDENCE", "Atomic Initialization Checklist Evidence", { dataType: "JSON" }),
        systemField("ACC-INIT-F-STATUS", "Initialization Status"),
        systemField("ACC-INIT-F-VERSION", "Initialization Version", "INTEGER", { idempotencyRole: "OBJECT_VERSION" }),
      ],
      sensitivityId: "S4",
    }),
    domainObject({
      id: "ACC-OBJ-SCHOOL-SUBSCRIPTION",
      label: "School Subscription Readiness",
      dataSubject: "SCHOOL_READINESS_AXIS",
      producerRef: "ROLE-PLATFORM-GOVERNANCE",
      ownerRef: "ROLE-SCHOOL-ADMIN",
      confirmerRef: "ROLE-PLATFORM-GOVERNANCE",
      states: ["PENDING", "ACTIVE", "RESTRICTED", "ENDED"],
      fields: [
        identityField("ACC-SUBSCRIPTION-F-ID", "School Subscription ID"),
        field("ACC-SUBSCRIPTION-F-SCHOOL-ID", "School Entity ID", { dataType: "ID", mutability: "IMMUTABLE" }),
        field("ACC-SUBSCRIPTION-F-CONTRACT-REF", "School Contract Reference", { dataType: "ID", mutability: "IMMUTABLE" }),
        systemField("ACC-SUBSCRIPTION-F-STATUS", "Subscription Status"),
        systemField("ACC-SUBSCRIPTION-F-VERSION", "Subscription Version", "INTEGER", { idempotencyRole: "OBJECT_VERSION" }),
      ],
      sensitivityId: "S4",
    }),
    domainObject({
      id: "ACC-OBJ-CLASS-COURSE-READINESS",
      label: "Class and Course Readiness",
      dataSubject: "SCHOOL_READINESS_AXIS",
      producerRef: "ROLE-ACADEMIC",
      ownerRef: "ROLE-ACADEMIC",
      states: ["NOT_READY", "READY", "BLOCKED"],
      fields: [
        identityField("ACC-READINESS-F-ID", "Class and Course Readiness ID"),
        field("ACC-READINESS-F-SCHOOL-ID", "School Entity ID", { dataType: "ID", mutability: "IMMUTABLE" }),
        field("ACC-READINESS-F-TERM-ID", "Current Term ID", { dataType: "ID", mutability: "IMMUTABLE" }),
        field("ACC-READINESS-F-CLASS-COURSE-EVIDENCE", "Class and Course Validation Evidence", { dataType: "JSON" }),
        systemField("ACC-READINESS-F-STATUS", "Class and Course Readiness Status"),
        systemField("ACC-READINESS-F-VERSION", "Class and Course Readiness Version", "INTEGER", { idempotencyRole: "OBJECT_VERSION" }),
      ],
    }),
  ];
  module.objects.push(...structuralObjects, ...readinessObjects);

  const entityPageId = "ACC-PAGE-SCHOOL-GOVERNANCE-ENTITY";
  const readinessPageId = "ACC-PAGE-SCHOOL-READINESS-AXES";
  const entityActions = [
    actionFact({
      id: "ACC-ACT-REGISTER-CAMPUS",
      label: "Register a Campus without Merging School Data Boundaries",
      targetObjectId: "ACC-OBJ-CAMPUS",
      inputFieldIds: ["ACC-CAMPUS-F-SCHOOL-ID", "ACC-CAMPUS-F-NAME"],
      outputFieldIds: ["ACC-CAMPUS-F-ID", "ACC-CAMPUS-F-VERSION"],
      operationKind: "CREATE",
      successState: "ACTIVE",
      permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "the school registers a campus inside its own governance boundary", "platform operations cannot create school structure without authorization"),
      pageId: entityPageId,
      risk: RISK.HIGH,
    }),
    actionFact({
      id: "ACC-ACT-REGISTER-EDUCATION-GROUP",
      label: "Register an Education Group with Explicit Member Schools",
      targetObjectId: "ACC-OBJ-EDUCATION-GROUP",
      inputFieldIds: ["ACC-GROUP-F-NAME", "ACC-GROUP-F-MEMBER-SCHOOL-IDS"],
      outputFieldIds: ["ACC-GROUP-F-ID", "ACC-GROUP-F-DATA-SHARING-AUTHORIZATION-REFS", "ACC-GROUP-F-VERSION"],
      operationKind: "CREATE",
      successState: "ACTIVE",
      permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "the authorized school administrator records group membership without implicit data access", "platform operations cannot infer or create group data sharing"),
      pageId: entityPageId,
      risk: RISK.HIGH,
    }),
    actionFact({
      id: "ACC-ACT-RECORD-SCHOOL-NAME-VERSION",
      label: "Record a School Name Version without Changing Identity",
      targetObjectId: "ACC-OBJ-SCHOOL-NAME-VERSION",
      inputFieldIds: ["ACC-NAME-F-SCHOOL-ID", "ACC-NAME-F-DISPLAY-NAME", "ACC-NAME-F-EFFECTIVE-AT"],
      outputFieldIds: ["ACC-NAME-F-ID", "ACC-NAME-F-VERSION"],
      operationKind: "CREATE",
      successState: "ACTIVE",
      permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "the school records a verified name change for the same entity", "platform operations cannot merge identities from a name similarity"),
      pageId: entityPageId,
      risk: RISK.HIGH,
    }),
    actionFact({
      id: "ACC-ACT-REQUEST-SCHOOL-REORGANIZATION",
      label: "Record a Governed School Reorganization Case",
      targetObjectId: "ACC-OBJ-SCHOOL-REORGANIZATION",
      inputFieldIds: ["ACC-REORG-F-KIND", "ACC-REORG-F-SOURCE-SCHOOL-IDS", "ACC-REORG-F-TARGET-SCHOOL-IDS", "ACC-REORG-F-DATA-MIGRATION-AUTHORIZATION"],
      outputFieldIds: ["ACC-REORG-F-ID", "ACC-REORG-F-STATUS", "ACC-REORG-F-VERSION"],
      operationKind: "CREATE",
      successState: "REQUESTED",
      permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "platform governance records a legally supported reorganization case", "one school cannot unilaterally merge or separate governance boundaries"),
      pageId: entityPageId,
      risk: RISK.HIGH,
    }),
    actionFact({
      id: "ACC-ACT-AUTHORIZE-SCHOOL-REORGANIZATION",
      label: "Authorize Object-level School Reorganization Effects",
      targetObjectId: "ACC-OBJ-SCHOOL-REORGANIZATION",
      inputFieldIds: ["ACC-REORG-F-ID", "ACC-REORG-F-DATA-MIGRATION-AUTHORIZATION"],
      outputFieldIds: ["ACC-REORG-F-STATUS", "ACC-REORG-F-VERSION"],
      operationKind: "UPDATE",
      transition: { from: "REQUESTED", to: "AUTHORIZED" },
      permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "independent governance verifies every entity and data effect", "a school administrator cannot self-authorize a cross-entity reorganization"),
      pageId: entityPageId,
      risk: RISK.HIGH,
    }),
    actionFact({
      id: "ACC-ACT-EXECUTE-SCHOOL-REORGANIZATION",
      label: "Execute an Authorized School Reorganization",
      targetObjectId: "ACC-OBJ-SCHOOL-REORGANIZATION",
      inputFieldIds: ["ACC-REORG-F-ID", "ACC-REORG-F-DATA-MIGRATION-AUTHORIZATION"],
      outputFieldIds: ["ACC-REORG-F-STATUS", "ACC-REORG-F-VERSION"],
      operationKind: "UPDATE",
      transition: { from: "AUTHORIZED", to: "EXECUTED" },
      permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "the current authorization covers every entity and object-level data effect", "a school cannot execute an unapproved reorganization"),
      pageId: entityPageId,
      risk: RISK.HIGH,
    }),
    actionFact({ id: "ACC-ACT-END-CAMPUS", label: "End a Campus Relation without Ending the School", targetObjectId: "ACC-OBJ-CAMPUS", inputFieldIds: ["ACC-CAMPUS-F-ID"], outputFieldIds: ["ACC-CAMPUS-F-VERSION"], operationKind: "UPDATE", transition: { from: "ACTIVE", to: "ENDED" }, permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "the school ends only the campus relation", "platform operations cannot end a school structure relation by default"), pageId: entityPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-END-EDUCATION-GROUP", label: "End an Education Group Relation without Ending Member Schools", targetObjectId: "ACC-OBJ-EDUCATION-GROUP", inputFieldIds: ["ACC-GROUP-F-ID"], outputFieldIds: ["ACC-GROUP-F-VERSION"], operationKind: "UPDATE", transition: { from: "ACTIVE", to: "ENDED" }, permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "authorized member governance ends only the group relation", "platform operations cannot end or merge school entities"), pageId: entityPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-SUPERSEDE-SCHOOL-NAME", label: "Supersede a School Name Version", targetObjectId: "ACC-OBJ-SCHOOL-NAME-VERSION", inputFieldIds: ["ACC-NAME-F-ID"], outputFieldIds: ["ACC-NAME-F-VERSION"], operationKind: "UPDATE", transition: { from: "ACTIVE", to: "SUPERSEDED" }, permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "a new verified name version is active", "platform operations cannot change school identity through a name update"), pageId: entityPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-DENY-SCHOOL-REORGANIZATION", label: "Deny an Unsupported School Reorganization", targetObjectId: "ACC-OBJ-SCHOOL-REORGANIZATION", inputFieldIds: ["ACC-REORG-F-ID", "ACC-REORG-F-DATA-MIGRATION-AUTHORIZATION"], outputFieldIds: ["ACC-REORG-F-STATUS", "ACC-REORG-F-VERSION"], operationKind: "UPDATE", transition: { from: "REQUESTED", to: "DENIED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "the entity or object-level authorization evidence is insufficient", "a school cannot decide a cross-entity reorganization"), pageId: entityPageId, risk: RISK.HIGH }),
    actionFact({
      id: "ACC-ACT-RESOLVE-SCHOOL-DATA-BOUNDARY",
      label: "Resolve the Independent School Data Boundary",
      targetObjectId: "ACC-OBJ-SCHOOL",
      inputFieldIds: ["ACC-SCHOOL-F-ID", "ACC-SCHOOL-F-SCHOOL-VERSION"],
      outputFieldIds: ["ACC-SCHOOL-F-GOVERNANCE-BOUNDARY-ID", "ACC-SCHOOL-F-LEGAL-SUBJECT-REF", "ACC-SCHOOL-F-SCHOOL-VERSION"],
      operationKind: "READ",
      permissions: allowDeny("CURRENT_ACTOR", "CURRENT_ACTOR", "the actor has current object and purpose authorization for this school boundary", "name similarity, campus relation, or group membership is the only asserted access basis"),
      pageId: entityPageId,
      failureResults: ["PERMISSION_DENIED", "NOT_FOUND", "IMPLICIT_DATA_SHARING_DENIED"],
      boundaryResultCodes: ["IMPLICIT_DATA_SHARING_DENIED"],
      extras: { implicitSharingSourcesDenied: ["NAME_SIMILARITY", "CAMPUS_RELATION", "GROUP_MEMBERSHIP"] },
    }),
  ];

  const readinessActions = [
    actionFact({ id: "ACC-ACT-CREATE-SCHOOL-APPLICATION-REVIEW", label: "Submit an Independent School Application Review", targetObjectId: "ACC-OBJ-SCHOOL-APPLICATION-REVIEW", inputFieldIds: ["ACC-APPREVIEW-F-APPLICANT-REF", "ACC-APPREVIEW-F-LEGAL-SUBJECT-EVIDENCE"], outputFieldIds: ["ACC-APPREVIEW-F-ID", "ACC-APPREVIEW-F-DECISION", "ACC-APPREVIEW-F-VERSION"], operationKind: "CREATE", successState: "SUBMITTED", permissions: allowDeny("CURRENT_ACTOR", "ROLE-PLATFORM-OPS", "the applicant submits verifiable school subject evidence", "platform operations cannot synthesize an application"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-APPROVE-SCHOOL-APPLICATION-REVIEW", label: "Approve a Verified School Application", targetObjectId: "ACC-OBJ-SCHOOL-APPLICATION-REVIEW", inputFieldIds: ["ACC-APPREVIEW-F-ID", "ACC-APPREVIEW-F-LEGAL-SUBJECT-EVIDENCE"], outputFieldIds: ["ACC-APPREVIEW-F-DECISION", "ACC-APPREVIEW-F-VERSION"], operationKind: "UPDATE", transition: { from: "SUBMITTED", to: "APPROVED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "independent platform governance verifies the legal school subject", "the applicant school cannot self-approve"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-REJECT-SCHOOL-APPLICATION-REVIEW", label: "Reject an Unverified School Application", targetObjectId: "ACC-OBJ-SCHOOL-APPLICATION-REVIEW", inputFieldIds: ["ACC-APPREVIEW-F-ID", "ACC-APPREVIEW-F-LEGAL-SUBJECT-EVIDENCE"], outputFieldIds: ["ACC-APPREVIEW-F-DECISION", "ACC-APPREVIEW-F-VERSION"], operationKind: "UPDATE", transition: { from: "SUBMITTED", to: "REJECTED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "independent platform governance records failed subject verification", "the applicant school cannot decide its own review"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-CREATE-SCHOOL-INITIALIZATION", label: "Create School Initialization Readiness", targetObjectId: "ACC-OBJ-SCHOOL-INITIALIZATION", inputFieldIds: ["ACC-INIT-F-SCHOOL-ID", "ACC-INIT-F-CHECKLIST-EVIDENCE"], outputFieldIds: ["ACC-INIT-F-ID", "ACC-INIT-F-STATUS", "ACC-INIT-F-VERSION"], operationKind: "CREATE", successState: "NOT_STARTED", permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "the first authorized school administrator starts initialization", "platform operations cannot complete school initialization"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-VALIDATE-INDEPENDENT-INITIALIZATION", label: "Validate the Atomic School Initialization Checklist", targetObjectId: "ACC-OBJ-SCHOOL-INITIALIZATION", inputFieldIds: ["ACC-INIT-F-ID", "ACC-INIT-F-CHECKLIST-EVIDENCE"], outputFieldIds: ["ACC-INIT-F-STATUS", "ACC-INIT-F-VERSION"], operationKind: "UPDATE", transition: { from: "NOT_STARTED", to: "VALIDATING" }, permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "the school supplies a complete versioned checklist", "platform operations cannot bypass missing school configuration"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-MARK-INDEPENDENT-INITIALIZATION-READY", label: "Mark Independent Initialization Ready", targetObjectId: "ACC-OBJ-SCHOOL-INITIALIZATION", inputFieldIds: ["ACC-INIT-F-ID", "ACC-INIT-F-CHECKLIST-EVIDENCE"], outputFieldIds: ["ACC-INIT-F-STATUS", "ACC-INIT-F-VERSION"], operationKind: "UPDATE", transition: { from: "VALIDATING", to: "READY" }, permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "every initialization check passed atomically", "platform operations cannot mark incomplete school setup ready"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-CREATE-SCHOOL-SUBSCRIPTION", label: "Create Independent School Subscription Readiness", targetObjectId: "ACC-OBJ-SCHOOL-SUBSCRIPTION", inputFieldIds: ["ACC-SUBSCRIPTION-F-SCHOOL-ID", "ACC-SUBSCRIPTION-F-CONTRACT-REF"], outputFieldIds: ["ACC-SUBSCRIPTION-F-ID", "ACC-SUBSCRIPTION-F-STATUS", "ACC-SUBSCRIPTION-F-VERSION"], operationKind: "CREATE", successState: "PENDING", permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "a verified school contract creates a separate subscription fact", "a school administrator cannot self-activate service entitlement"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-ACTIVATE-SCHOOL-SUBSCRIPTION", label: "Activate Independent School Subscription", targetObjectId: "ACC-OBJ-SCHOOL-SUBSCRIPTION", inputFieldIds: ["ACC-SUBSCRIPTION-F-ID", "ACC-SUBSCRIPTION-F-CONTRACT-REF"], outputFieldIds: ["ACC-SUBSCRIPTION-F-STATUS", "ACC-SUBSCRIPTION-F-VERSION"], operationKind: "UPDATE", transition: { from: "PENDING", to: "ACTIVE" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "the current school contract authorizes service activation", "a school cannot self-activate an unverified subscription"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-CREATE-CLASS-COURSE-READINESS", label: "Create Class and Course Readiness", targetObjectId: "ACC-OBJ-CLASS-COURSE-READINESS", inputFieldIds: ["ACC-READINESS-F-SCHOOL-ID", "ACC-READINESS-F-TERM-ID", "ACC-READINESS-F-CLASS-COURSE-EVIDENCE"], outputFieldIds: ["ACC-READINESS-F-ID", "ACC-READINESS-F-STATUS", "ACC-READINESS-F-VERSION"], operationKind: "CREATE", successState: "NOT_READY", permissions: allowDeny("ROLE-ACADEMIC", "ROLE-PLATFORM-OPS", "academic administration starts a term-specific class-course validation", "platform operations cannot synthesize school class-course readiness"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-MARK-CLASS-COURSE-READY", label: "Mark Class and Course Axis Ready", targetObjectId: "ACC-OBJ-CLASS-COURSE-READINESS", inputFieldIds: ["ACC-READINESS-F-ID", "ACC-READINESS-F-CLASS-COURSE-EVIDENCE"], outputFieldIds: ["ACC-READINESS-F-STATUS", "ACC-READINESS-F-VERSION"], operationKind: "UPDATE", transition: { from: "NOT_READY", to: "READY" }, permissions: allowDeny("ROLE-ACADEMIC", "ROLE-PLATFORM-OPS", "all required classes, courses, teachers, and term relations validate", "platform operations cannot mark school teaching organization ready"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-BLOCK-SCHOOL-INITIALIZATION", label: "Block Incomplete School Initialization", targetObjectId: "ACC-OBJ-SCHOOL-INITIALIZATION", inputFieldIds: ["ACC-INIT-F-ID", "ACC-INIT-F-CHECKLIST-EVIDENCE"], outputFieldIds: ["ACC-INIT-F-STATUS", "ACC-INIT-F-VERSION"], operationKind: "UPDATE", transition: { from: ["NOT_STARTED", "VALIDATING"], to: "BLOCKED" }, permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "the atomic checklist contains a blocking failure", "platform operations cannot hide or bypass an initialization failure"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-RESTRICT-SCHOOL-SUBSCRIPTION", label: "Restrict a School Subscription", targetObjectId: "ACC-OBJ-SCHOOL-SUBSCRIPTION", inputFieldIds: ["ACC-SUBSCRIPTION-F-ID", "ACC-SUBSCRIPTION-F-CONTRACT-REF"], outputFieldIds: ["ACC-SUBSCRIPTION-F-STATUS", "ACC-SUBSCRIPTION-F-VERSION"], operationKind: "UPDATE", transition: { from: "ACTIVE", to: "RESTRICTED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "contractual service restrictions apply with protected activity windows", "a school cannot synthesize subscription entitlement"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-END-SCHOOL-SUBSCRIPTION", label: "End a School Subscription after the Protected Exit Window", targetObjectId: "ACC-OBJ-SCHOOL-SUBSCRIPTION", inputFieldIds: ["ACC-SUBSCRIPTION-F-ID", "ACC-SUBSCRIPTION-F-CONTRACT-REF"], outputFieldIds: ["ACC-SUBSCRIPTION-F-STATUS", "ACC-SUBSCRIPTION-F-VERSION"], operationKind: "UPDATE", transition: { from: ["ACTIVE", "RESTRICTED"], to: "ENDED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "the protected activity and exit windows have completed", "a school cannot rewrite subscription history"), pageId: readinessPageId, risk: RISK.HIGH }),
    actionFact({ id: "ACC-ACT-BLOCK-CLASS-COURSE-READINESS", label: "Block Invalid Class and Course Readiness", targetObjectId: "ACC-OBJ-CLASS-COURSE-READINESS", inputFieldIds: ["ACC-READINESS-F-ID", "ACC-READINESS-F-CLASS-COURSE-EVIDENCE"], outputFieldIds: ["ACC-READINESS-F-STATUS", "ACC-READINESS-F-VERSION"], operationKind: "UPDATE", transition: { from: "NOT_READY", to: "BLOCKED" }, permissions: allowDeny("ROLE-ACADEMIC", "ROLE-PLATFORM-OPS", "class course or teaching relations fail validation", "platform operations cannot bypass school organization failures"), pageId: readinessPageId, risk: RISK.HIGH }),
  ];
  appendActionFacts(module, [...entityActions, ...readinessActions]);

  module.relationships.push(
    { id: "ACC-REL-CAMPUS-SCHOOL", fromObjectId: "ACC-OBJ-CAMPUS", toObjectId: "ACC-OBJ-SCHOOL", type: "BELONGS_TO", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SCHOOL", onSourceInvalidation: "end the campus relation without merging or deleting the school entity" },
    { id: "ACC-REL-NAME-SCHOOL", fromObjectId: "ACC-OBJ-SCHOOL-NAME-VERSION", toObjectId: "ACC-OBJ-SCHOOL", type: "VERSION_MEMBER", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SCHOOL", onSourceInvalidation: "supersede only the name version and retain the same school identity" },
    { id: "ACC-REL-REORGANIZATION-SCHOOL", fromObjectId: "ACC-OBJ-SCHOOL-REORGANIZATION", toObjectId: "ACC-OBJ-SCHOOL", type: "REFERENCES", cardinality: "MANY_TO_MANY", ownershipScope: "CROSS_MODULE_REFERENCE", onSourceInvalidation: "freeze execution and require renewed entity and object-level authorization" },
  );

  module.pages.push(
    page(entityPageId, "School Entity and Governance Boundary", ["ACC-OBJ-SCHOOL", ...structuralObjects.map(({ id }) => id)], entityActions.filter(({ action }) => action.executionMode === "USER_TASK").map(({ action }) => action.id), ["ACC-SCHOOL-F-GOVERNANCE-BOUNDARY-ID", "ACC-SCHOOL-F-LEGAL-SUBJECT-REF", ...structuralObjects.flatMap(({ fields }) => fields.map(({ id }) => id))]),
    page(readinessPageId, "Independent School Readiness Axes", readinessObjects.map(({ id }) => id), readinessActions.map(({ action }) => action.id), readinessObjects.flatMap(({ fields }) => fields.map(({ id }) => id))),
  );

  const activateActionId = "ACC-ACT-ACTIVATE-SCHOOL-TEACHING";
  const activation = requireExactlyOne(module.objects, "ACC-OBJ-SCHOOL-ACTIVATION", "object");
  const activationBindings = [
    ["ACC-ACTIVATION-F-APPLICATION-REF", "ACC-ACTIVATION-F-APPLICATION-VERSION", "ACC-OBJ-SCHOOL-APPLICATION-REVIEW", "ACC-APPREVIEW-F-VERSION", "APPROVED"],
    ["ACC-ACTIVATION-F-SCHOOL-REF", "ACC-ACTIVATION-F-SCHOOL-VERSION", "ACC-OBJ-SCHOOL", "ACC-SCHOOL-F-SCHOOL-VERSION", "ACTIVE"],
    ["ACC-ACTIVATION-F-INITIALIZATION-REF", "ACC-ACTIVATION-F-INITIALIZATION-VERSION", "ACC-OBJ-SCHOOL-INITIALIZATION", "ACC-INIT-F-VERSION", "READY"],
    ["ACC-ACTIVATION-F-SUBSCRIPTION-REF", "ACC-ACTIVATION-F-SUBSCRIPTION-VERSION", "ACC-OBJ-SCHOOL-SUBSCRIPTION", "ACC-SUBSCRIPTION-F-VERSION", "ACTIVE"],
    ["ACC-ACTIVATION-F-CLASS-COURSE-REF", "ACC-ACTIVATION-F-CLASS-COURSE-VERSION", "ACC-OBJ-CLASS-COURSE-READINESS", "ACC-READINESS-F-VERSION", "READY"],
  ];
  const activationFields = [];
  for (const [refId, versionId, targetObjectId, targetVersionFieldId] of activationBindings) {
    activationFields.push(
      versionPinnedReference({
        id: refId,
        label: `${targetObjectId} Readiness Reference`,
        targetObjectId,
        versionFieldId: versionId,
        targetVersionFieldId,
        requiredActionIds: [activateActionId],
        stateGuardPolicy: "UPDATE_REQUIRED",
        overrides: {
          required: { description: "required only for final teaching activation", whenStates: ["TEACHING_ACTIVE"], whenActionIds: [activateActionId] },
        },
      }),
      systemField(versionId, `${targetObjectId} Pinned Version`, "INTEGER", {
        mutability: "IMMUTABLE",
        required: { description: "required only for final teaching activation", whenStates: ["TEACHING_ACTIVE"], whenActionIds: [activateActionId] },
      }),
    );
  }
  addFields(activation, activationFields);
  activation.lineageBindings = [
    ...(activation.lineageBindings ?? []),
    ...activationBindings.map(([refId, versionId, targetObjectId, targetVersionFieldId]) => (
      lineage(refId, versionId, targetObjectId, targetVersionFieldId)
    )),
  ];
  const activate = requireExactlyOne(module.actions, activateActionId, "action");
  activate.inputFieldIds.push(...activationBindings.flatMap(([refId, versionId]) => [refId, versionId]));
  activate.outputFieldIds.push(...activationBindings.flatMap(([refId, versionId]) => [refId, versionId]));
  activate.relatedStateGuards = activationBindings.map(([
    refFieldId,
    versionFieldId,
    targetObjectId,
    ,
    requiredState,
  ]) => ({ refFieldId, versionFieldId, targetObjectId, requiredState }));

  const activationPage = requireExactlyOne(module.pages, "ACC-PAGE-SCHOOL-ACTIVATION", "page");
  activationPage.fieldIds.push(...activationFields.map(({ id }) => id));
  activationPage.objectIds.push(...readinessObjects.map(({ id }) => id), "ACC-OBJ-SCHOOL");

  const identityDeleteActionId = "ACC-ACT-COMPLETE-IDENTITY-DELETION";
  const platformIdentity = requireExactlyOne(module.objects, "ACC-OBJ-PLATFORM-IDENTITY", "object");
  const deletionCaseRef = versionPinnedReference({
    id: "ACC-PIDENT-F-DELETION-CASE-REF",
    label: "Completed Student Deletion Matrix Reference",
    targetObjectId: "DGV-OBJ-STUDENT-DELETION-CASE",
    versionFieldId: "ACC-PIDENT-F-DELETION-CASE-VERSION",
    targetVersionFieldId: "DGV-DELCASE-F-VERSION",
    requiredActionIds: [identityDeleteActionId],
    stateGuardPolicy: "UPDATE_REQUIRED",
    overrides: {
      required: { description: "required before final platform identity deletion", whenStates: ["DELETED"], whenActionIds: [identityDeleteActionId] },
    },
  });
  const deletionCaseVersion = systemField(
    "ACC-PIDENT-F-DELETION-CASE-VERSION",
    "Pinned Student Deletion Matrix Version",
    "INTEGER",
    {
      mutability: "IMMUTABLE",
      required: { description: "required before final platform identity deletion", whenStates: ["DELETED"], whenActionIds: [identityDeleteActionId] },
    },
  );
  addFields(platformIdentity, [deletionCaseRef, deletionCaseVersion]);
  platformIdentity.lineageBindings = [
    ...(platformIdentity.lineageBindings ?? []),
    lineage(
      deletionCaseRef.id,
      deletionCaseVersion.id,
      "DGV-OBJ-STUDENT-DELETION-CASE",
      "DGV-DELCASE-F-VERSION",
    ),
  ];
  const completeIdentityDeletion = requireExactlyOne(module.actions, identityDeleteActionId, "action");
  completeIdentityDeletion.inputFieldIds.push(deletionCaseRef.id, deletionCaseVersion.id);
  completeIdentityDeletion.outputFieldIds.push(deletionCaseRef.id, deletionCaseVersion.id);
  completeIdentityDeletion.relatedStateGuards = [{
    refFieldId: deletionCaseRef.id,
    versionFieldId: deletionCaseVersion.id,
    targetObjectId: "DGV-OBJ-STUDENT-DELETION-CASE",
    requiredState: "COMPLETED",
  }];
  const identityPage = requireExactlyOne(module.pages, "ACC-PAGE-PLATFORM-IDENTITY", "page");
  identityPage.fieldIds.push(deletionCaseRef.id, deletionCaseVersion.id);

  module.schoolReadinessContract = {
    axisObjectIds: [
      "ACC-OBJ-SCHOOL-APPLICATION-REVIEW",
      "ACC-OBJ-SCHOOL",
      "ACC-OBJ-SCHOOL-INITIALIZATION",
      "ACC-OBJ-SCHOOL-SUBSCRIPTION",
      "ACC-OBJ-CLASS-COURSE-READINESS",
    ],
    teachingActivationActionId: activateActionId,
    activationProjectionObjectId: "ACC-OBJ-SCHOOL-ACTIVATION",
    singleStatusAuthoritative: false,
  };
  module.governanceBaselineOwner = ownerContract("ACC-001", ["D019", "D020"]);
  return module;
}

function enhanceTeacherExperienceModule(module) {
  const experience = domainObject({
    id: "TEA-OBJ-EXPERIENCE-RESOLUTION",
    label: "Role Responsibility and Accessible Presentation Resolution",
    dataSubject: "ROLE_EXPERIENCE_RESOLUTION",
    producerRef: "CURRENT_ACTOR",
    ownerRef: "CURRENT_ACTOR",
    states: ["RESOLVED", "STALE"],
    fields: [
      identityField("TEA-EXPERIENCE-F-ID", "Experience Resolution ID"),
      field("TEA-EXPERIENCE-F-ACTOR-ID", "Current Actor ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      optionField("TEA-EXPERIENCE-F-KIND", "Experience Kind", "OPT-BL2-001", { mutability: "IMMUTABLE" }),
      field("TEA-EXPERIENCE-F-DUTY-CONTEXT", "Current Duty and Object Context", { dataType: "JSON", mutability: "IMMUTABLE" }),
      systemField("TEA-EXPERIENCE-F-RESPONSIBILITY-DOMAINS", "Resolved Responsibility Domains", "STRING_ARRAY", { mutability: "IMMUTABLE" }),
      systemField("TEA-EXPERIENCE-F-RESOLVED-SURFACES", "Resolved Cross-page Surfaces", "JSON"),
      systemField("TEA-EXPERIENCE-F-FIXED-NAVIGATION-REQUIRED", "Fixed Navigation Required", "BOOLEAN", {
        validation: "must always be false; responsibility domains may compose across pages",
      }),
      optionField("TEA-EXPERIENCE-F-AGE-STAGE", "Age Stage", "OPT-BL2-002", { mutability: "IMMUTABLE" }),
      systemField("TEA-EXPERIENCE-F-SEMANTIC-IA-VERSION", "Shared Semantic Information Architecture Version", "INTEGER"),
      systemField("TEA-EXPERIENCE-F-AGE-ADAPTATION", "Age-adapted Language Density and Interaction", "JSON"),
      systemField("TEA-EXPERIENCE-F-KEYBOARD-OPERATION", "Keyboard Operation Available", "BOOLEAN"),
      systemField("TEA-EXPERIENCE-F-NON-VOICE-ALTERNATIVE", "Non-voice Alternative Available", "BOOLEAN"),
      systemField("TEA-EXPERIENCE-F-TEXT-SCALING", "Text Scaling Available", "BOOLEAN"),
      systemField("TEA-EXPERIENCE-F-VISIBLE-FOCUS", "Visible Focus Available", "BOOLEAN"),
      versionField("TEA-EXPERIENCE-F-VERSION", "Experience Resolution Version"),
    ],
    overrides: {
      readMode: "AUTHORIZED",
      fixedNavigationRequired: false,
    },
  });
  module.objects.push(experience);

  const pageId = "TEA-PAGE-ROLE-EXPERIENCE";
  const commonInputs = [
    "TEA-EXPERIENCE-F-ACTOR-ID",
    "TEA-EXPERIENCE-F-KIND",
    "TEA-EXPERIENCE-F-DUTY-CONTEXT",
    "TEA-EXPERIENCE-F-AGE-STAGE",
  ];
  const commonOutputs = [
    "TEA-EXPERIENCE-F-ID",
    "TEA-EXPERIENCE-F-RESPONSIBILITY-DOMAINS",
    "TEA-EXPERIENCE-F-RESOLVED-SURFACES",
    "TEA-EXPERIENCE-F-FIXED-NAVIGATION-REQUIRED",
    "TEA-EXPERIENCE-F-SEMANTIC-IA-VERSION",
    "TEA-EXPERIENCE-F-AGE-ADAPTATION",
    "TEA-EXPERIENCE-F-KEYBOARD-OPERATION",
    "TEA-EXPERIENCE-F-NON-VOICE-ALTERNATIVE",
    "TEA-EXPERIENCE-F-TEXT-SCALING",
    "TEA-EXPERIENCE-F-VISIBLE-FOCUS",
    "TEA-EXPERIENCE-F-VERSION",
  ];
  const teacherPermissions = [
    { effect: "ALLOW", roleRef: "ROLE-TEACHER", condition: "the teacher resolves only current duties and authorized school objects" },
    { effect: "DENY", roleRef: "ROLE-SCHOOL-ADMIN", condition: "school administration cannot assume a teacher duty experience" },
    { effect: "DENY", roleRef: "ROLE-PLATFORM-OPS", condition: "platform operations cannot assume a school member experience" },
  ];
  const adminPermissions = [
    { effect: "ALLOW", roleRef: "ROLE-SCHOOL-ADMIN", condition: "the administrator resolves only current school governance duties" },
    { effect: "DENY", roleRef: "ROLE-TEACHER", condition: "a teacher cannot assume school governance administration" },
    { effect: "DENY", roleRef: "ROLE-PLATFORM-OPS", condition: "platform operations cannot assume a school administrator experience" },
  ];
  const actions = [
    actionFact({
      id: "TEA-ACT-RESOLVE-TEACHER-EXPERIENCE",
      label: "Resolve Teacher Responsibility Domains and Surfaces",
      targetObjectId: experience.id,
      inputFieldIds: commonInputs,
      outputFieldIds: commonOutputs,
      operationKind: "CREATE",
      successState: "RESOLVED",
      permissions: teacherPermissions,
      pageId,
      extras: {
        responsibilityResolution: {
          experienceKind: "TEACHER",
          domainIds: TEACHER_DOMAINS,
          fixedNavigationRequired: false,
        },
      },
    }),
    actionFact({
      id: "TEA-ACT-RESOLVE-SCHOOL-ADMIN-EXPERIENCE",
      label: "Resolve School Administrator Responsibility Domains and Surfaces",
      targetObjectId: experience.id,
      inputFieldIds: commonInputs,
      outputFieldIds: commonOutputs,
      operationKind: "CREATE",
      successState: "RESOLVED",
      permissions: adminPermissions,
      pageId,
      extras: {
        responsibilityResolution: {
          experienceKind: "SCHOOL_ADMIN",
          domainIds: SCHOOL_ADMIN_DOMAINS,
          fixedNavigationRequired: false,
        },
      },
    }),
    actionFact({
      id: "TEA-ACT-RESOLVE-ACCESSIBLE-PRESENTATION",
      label: "Resolve Age-adapted Accessible Presentation",
      targetObjectId: experience.id,
      inputFieldIds: ["TEA-EXPERIENCE-F-ID", "TEA-EXPERIENCE-F-AGE-STAGE"],
      outputFieldIds: [
        "TEA-EXPERIENCE-F-SEMANTIC-IA-VERSION",
        "TEA-EXPERIENCE-F-AGE-ADAPTATION",
        "TEA-EXPERIENCE-F-KEYBOARD-OPERATION",
        "TEA-EXPERIENCE-F-NON-VOICE-ALTERNATIVE",
        "TEA-EXPERIENCE-F-TEXT-SCALING",
        "TEA-EXPERIENCE-F-VISIBLE-FOCUS",
        "TEA-EXPERIENCE-F-VERSION",
      ],
      operationKind: "READ",
      permissions: allowDeny("CURRENT_ACTOR", "ROLE-PLATFORM-OPS", "the actor resolves the same product semantics with age-adapted presentation", "platform operations cannot read a school member experience by default"),
      pageId,
      failureResults: ["PERMISSION_DENIED", "NOT_FOUND", "ACCESSIBILITY_PROFILE_INCOMPLETE"],
      boundaryResultCodes: ["ACCESSIBILITY_PROFILE_INCOMPLETE"],
      extras: {
        accessibilityResolution: {
          sharedSemanticInformationArchitecture: true,
          requiredCapabilities: ["KEYBOARD_OPERATION", "NON_VOICE_ALTERNATIVE", "TEXT_SCALING", "VISIBLE_FOCUS"],
          failureMode: "FAIL_CLOSED",
        },
      },
    }),
    actionFact({
      id: "TEA-ACT-INVALIDATE-EXPERIENCE-RESOLUTION",
      label: "Invalidate a Stale Role Experience Resolution",
      targetObjectId: experience.id,
      inputFieldIds: ["TEA-EXPERIENCE-F-ID", "TEA-EXPERIENCE-F-VERSION"],
      outputFieldIds: ["TEA-EXPERIENCE-F-VERSION"],
      operationKind: "UPDATE",
      transition: { from: "RESOLVED", to: "STALE" },
      permissions: allowDeny("CURRENT_ACTOR", "ROLE-PLATFORM-OPS", "the actor invalidates a resolution after duties, school context, or accessibility rules change", "platform operations cannot mutate a school member experience by default"),
      pageId,
    }),
  ];
  appendActionFacts(module, actions);
  module.pages.push(page(
    pageId,
    "Role Responsibility and Accessible Experience",
    [experience.id],
    actions.map(({ action }) => action.id),
    experience.fields.map(({ id }) => id),
  ));
  module.responsibilityDomainContracts = [
    { experienceKind: "TEACHER", domainIds: TEACHER_DOMAINS, fixedNavigationRequired: false, resolveActionId: "TEA-ACT-RESOLVE-TEACHER-EXPERIENCE" },
    { experienceKind: "SCHOOL_ADMIN", domainIds: SCHOOL_ADMIN_DOMAINS, fixedNavigationRequired: false, resolveActionId: "TEA-ACT-RESOLVE-SCHOOL-ADMIN-EXPERIENCE" },
  ];
  module.accessibilityContract = {
    sharedSemanticInformationArchitecture: true,
    ageStages: ["PRIMARY", "MIDDLE"],
    ageAdaptationDimensions: ["LANGUAGE", "INFORMATION_DENSITY", "INTERACTION"],
    requiredCapabilities: ["KEYBOARD_OPERATION", "NON_VOICE_ALTERNATIVE", "TEXT_SCALING", "VISIBLE_FOCUS"],
    resolveActionId: "TEA-ACT-RESOLVE-ACCESSIBLE-PRESENTATION",
  };
  module.governanceBaselineOwner = ownerContract("TEA-001", ["D027", "D028", "D041"]);
  return module;
}

function enhanceNotificationModule(module) {
  const businessEvent = domainObject({
    id: "NOTI-OBJ-BUSINESS-EVENT",
    label: "Versioned Business Event",
    dataSubject: "TEACHING_BUSINESS_EVENT",
    producerRef: "SYSTEM",
    ownerRef: "ROLE-SCHOOL-ADMIN",
    confirmerRef: "SYSTEM",
    stewardRef: "ROLE-SCHOOL-ADMIN",
    lifecyclePolicyId: "LIFE-004",
    sensitivityId: "S3",
    states: ["ACCEPTED"],
    fields: [
      identityField("NOTI-EVENT-F-ID", "Business Event ID"),
      field("NOTI-EVENT-F-SOURCE-OBJECT-ID", "Source Business Object ID", { dataType: "ID", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
      field("NOTI-EVENT-F-SOURCE-VERSION", "Source Business Object Version", { dataType: "INTEGER", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
      field("NOTI-EVENT-F-EVENT-KIND", "Business Event Kind", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
      field("NOTI-EVENT-F-OCCURRED-AT", "Business Event Time", { dataType: "DATETIME", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
      versionField("NOTI-EVENT-F-VERSION", "Business Event Version", { mutability: "IMMUTABLE" }),
    ],
  });
  const todo = domainObject({
    id: "NOTI-OBJ-ACTION-TODO",
    label: "Teaching Action Todo",
    dataSubject: "TEACHING_ACTION_TODO",
    producerRef: "DUTY-SUBJECT-TEACHER",
    ownerRef: "DUTY-SUBJECT-TEACHER",
    confirmerRef: "DUTY-SUBJECT-TEACHER",
    stewardRef: "DUTY-HOMEROOM",
    lifecyclePolicyId: "LIFE-003",
    sensitivityId: "S3",
    states: ["OPEN", "IN_PROGRESS", "OBSERVING", "RESOLVED", "CANCELLED"],
    fields: [
      identityField("NOTI-TODO-F-ID", "Action Todo ID"),
      field("NOTI-TODO-F-SOURCE-EVENT-ID", "Source Business Event ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("NOTI-TODO-F-ASSIGNEE-ID", "Assigned Teacher ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("NOTI-TODO-F-TEACHING-ISSUE", "Teaching Issue", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("NOTI-TODO-F-TEACHER-JUDGMENT", "Teacher Judgment", { dataType: "JSON", required: false }),
      field("NOTI-TODO-F-LINKED-ACTIONS", "Linked Teaching Actions", { dataType: "JSON", required: false }),
      field("NOTI-TODO-F-RESOLUTION-EVIDENCE", "New Evidence Supporting Resolution", {
        dataType: "JSON",
        required: {
          description: "required only when observation supports resolution",
          whenStates: ["RESOLVED"],
          whenActionIds: ["NOTI-ACT-RESOLVE-ACTION-TODO"],
        },
      }),
      systemField("NOTI-TODO-F-STATUS", "Action Todo Status"),
      versionField("NOTI-TODO-F-VERSION", "Action Todo Version"),
    ],
    overrides: {
      issueResolutionPolicy: {
        rejectSuggestionClosesIssue: false,
        actionCompletionClosesIssue: false,
        resolutionRequiresNewEvidence: true,
        resolutionEqualsMastery: false,
      },
    },
  });
  const message = domainObject({
    id: "NOTI-OBJ-NOTIFICATION",
    label: "In-product Notification Message",
    dataSubject: "NOTIFICATION_MESSAGE",
    producerRef: "CURRENT_ACTOR",
    ownerRef: "DUTY-SUBJECT-TEACHER",
    confirmerRef: "DUTY-SUBJECT-TEACHER",
    stewardRef: "DUTY-HOMEROOM",
    lifecyclePolicyId: "LIFE-003",
    sensitivityId: "S3",
    states: ["AVAILABLE", "READ", "ARCHIVED"],
    fields: [
      identityField("NOTI-NOTIFICATION-F-ID", "Notification Message ID"),
      field("NOTI-NOTIFICATION-F-SOURCE-EVENT", "Source Business Event ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("NOTI-NOTIFICATION-F-RECIPIENT", "Notification Recipient", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE", "Authorized Minimal Summary Template", { mutability: "IMMUTABLE" }),
      field("NOTI-NOTIFICATION-F-DEEP-LINK", "Reauthorized Product Deep Link", { mutability: "IMMUTABLE" }),
      systemField("NOTI-NOTIFICATION-F-READ-AT", "Read At", "DATETIME", {
        required: { description: "required only after the recipient reads the message", whenStates: ["READ"], whenActionIds: ["NOTI-ACT-MARK-READ"] },
      }),
      systemField("NOTI-NOTIFICATION-F-ARCHIVED-AT", "Archived At", "DATETIME", {
        required: { description: "required only when the recipient archives the message", whenStates: ["ARCHIVED"], whenActionIds: ["NOTI-ACT-MARK-HANDLED"] },
      }),
      versionField("NOTI-NOTIFICATION-F-VERSION", "Notification Message Version"),
    ],
    overrides: {
      readMode: "AUTHORIZED",
      recipientPolicy: {
        subjectFieldId: "NOTI-NOTIFICATION-F-RECIPIENT",
        allowedRecipientSubjects: ["ROLE-STUDENT", "DUTY-SUBJECT-TEACHER", "DUTY-HOMEROOM", "ROLE-ACADEMIC"],
        mutationSubject: "CURRENT_ACTOR",
        ownershipMode: "OWN_RECORD_ONLY",
      },
      messageEffectPolicy: {
        readChangesBusinessTodo: false,
        archiveChangesBusinessTodo: false,
      },
    },
  });
  const deliveryRef = versionPinnedReference({
    id: "NOTI-DELIVERY-F-MESSAGE-REF",
    label: "Pinned Notification Message Reference",
    targetObjectId: message.id,
    versionFieldId: "NOTI-DELIVERY-F-MESSAGE-VERSION",
    targetVersionFieldId: "NOTI-NOTIFICATION-F-VERSION",
    requiredActionIds: ["NOTI-ACT-QUEUE-DELIVERY"],
    stateGuardPolicy: "CREATE_REQUIRED",
  });
  const delivery = domainObject({
    id: "NOTI-OBJ-CHANNEL-DELIVERY",
    label: "Notification Channel Delivery Attempt",
    dataSubject: "NOTIFICATION_CHANNEL_DELIVERY",
    producerRef: "SYSTEM",
    ownerRef: "ROLE-SCHOOL-ADMIN",
    confirmerRef: "SYSTEM",
    stewardRef: "ROLE-SCHOOL-ADMIN",
    lifecyclePolicyId: "LIFE-003",
    sensitivityId: "S3",
    states: ["QUEUED", "DELIVERED", "FAILED"],
    fields: [
      identityField("NOTI-DELIVERY-F-ID", "Channel Delivery Attempt ID"),
      deliveryRef,
      systemField("NOTI-DELIVERY-F-MESSAGE-VERSION", "Pinned Notification Message Version", "INTEGER", { mutability: "IMMUTABLE" }),
      optionField("NOTI-DELIVERY-F-CHANNEL", "Delivery Channel", "OPT-ENUM-047", { mutability: "IMMUTABLE" }),
      systemField("NOTI-DELIVERY-F-DELIVERED-AT", "Delivered At", "DATETIME", {
        required: { description: "required only after a delivery receipt succeeds", whenStates: ["DELIVERED"], whenActionIds: ["NOTI-ACT-DELIVER"] },
      }),
      systemField("NOTI-DELIVERY-F-FAILURE-CODE", "Delivery Failure Code", "STRING", {
        required: { description: "required only after a delivery attempt fails", whenStates: ["FAILED"], whenActionIds: ["NOTI-ACT-FAIL-DELIVERY"] },
      }),
      systemField("NOTI-DELIVERY-F-RETRY-COUNT", "Delivery Retry Count", "INTEGER", {
        required: { description: "required when queueing or retrying an independent delivery", whenStates: ["QUEUED"], whenActionIds: ["NOTI-ACT-QUEUE-DELIVERY", "NOTI-ACT-RETRY-DELIVERY"] },
        writeContract: {
          initializers: { actionIds: ["NOTI-ACT-QUEUE-DELIVERY"], value: 0 },
          mutators: { actionIds: ["NOTI-ACT-RETRY-DELIVERY"], operation: "INCREMENT", amount: 1 },
        },
      }),
      versionField("NOTI-DELIVERY-F-VERSION", "Channel Delivery Version"),
    ],
    lineageBindings: [lineage(
      "NOTI-DELIVERY-F-MESSAGE-REF",
      "NOTI-DELIVERY-F-MESSAGE-VERSION",
      message.id,
      "NOTI-NOTIFICATION-F-VERSION",
    )],
    overrides: {
      channelPolicy: {
        mode: "PHASE_ONE_CLOSED",
        fieldId: "NOTI-DELIVERY-F-CHANNEL",
        optionSetId: "OPT-ENUM-047",
        allowedCodes: ["IN_PRODUCT"],
      },
      deliveryFailurePolicy: {
        sourceBusinessFactRollback: false,
        messageStateRollback: false,
        retryScope: "CHANNEL_DELIVERY_ONLY",
      },
    },
  });
  module.objects = [businessEvent, todo, message, delivery];

  const inboxPageId = "NOTI-PAGE-INBOX";
  const todoPageId = "NOTI-PAGE-ACTION-TODO";
  const deliveryPageId = "NOTI-PAGE-DELIVERY-MONITOR";
  const messageCreateInputs = [
    "NOTI-NOTIFICATION-F-SOURCE-EVENT",
    "NOTI-NOTIFICATION-F-RECIPIENT",
    "NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE",
    "NOTI-NOTIFICATION-F-DEEP-LINK",
  ];
  const messageCreateOutputs = ["NOTI-NOTIFICATION-F-ID", "NOTI-NOTIFICATION-F-VERSION"];
  const reportMessageOutputs = [
    "NOTI-NOTIFICATION-F-ID",
    ...messageCreateInputs,
    "NOTI-NOTIFICATION-F-VERSION",
  ];
  const teacherMessagePermissions = [
    { effect: "ALLOW", dutyRef: "DUTY-SUBJECT-TEACHER", condition: "the subject teacher creates only an authorized minimal message for assigned students" },
    { effect: "DENY", roleRef: "ROLE-STUDENT", condition: "a student cannot create a teacher-owned notification" },
    { effect: "DENY", roleRef: "ROLE-PLATFORM-OPS", condition: "platform operations has no default student notification access" },
  ];
  const recipientPermissions = [
    { effect: "ALLOW", actorRef: "CURRENT_ACTOR", condition: "the current actor is the notification recipient", scope: { kind: "OWN_RECORD", subjectFieldId: "NOTI-NOTIFICATION-F-RECIPIENT" } },
    { effect: "DENY", actorRef: "CURRENT_ACTOR", condition: "the current actor is not the notification recipient", scope: { kind: "OTHER_RECORD", subjectFieldId: "NOTI-NOTIFICATION-F-RECIPIENT" } },
    { effect: "DENY", roleRef: "ROLE-PLATFORM-OPS", condition: "platform operations has no default student notification access" },
  ];
  const recordEvent = actionFact({
    id: "NOTI-ACT-RECORD-BUSINESS-EVENT",
    label: "Record an Accepted Versioned Business Event",
    targetObjectId: businessEvent.id,
    inputFieldIds: ["NOTI-EVENT-F-SOURCE-OBJECT-ID", "NOTI-EVENT-F-SOURCE-VERSION", "NOTI-EVENT-F-EVENT-KIND", "NOTI-EVENT-F-OCCURRED-AT"],
    outputFieldIds: ["NOTI-EVENT-F-ID", "NOTI-EVENT-F-VERSION"],
    operationKind: "CREATE",
    successState: "ACCEPTED",
    permissions: allowDeny("SYSTEM", "ROLE-PLATFORM-OPS", "the system appends a registered source fact and version", "platform operations cannot synthesize a business event"),
    executionMode: "SYSTEM_EVENT",
    trigger: { kind: "EVENT", eventId: "EVT-NOTIFICATION-BUSINESS-FACT-ACCEPTED" },
    risk: RISK.HIGH,
  });
  const todoActions = [
    actionFact({ id: "NOTI-ACT-CREATE-ACTION-TODO", label: "Create a Teaching Action Todo from a Business Event", targetObjectId: todo.id, inputFieldIds: ["NOTI-TODO-F-SOURCE-EVENT-ID", "NOTI-TODO-F-ASSIGNEE-ID", "NOTI-TODO-F-TEACHING-ISSUE"], outputFieldIds: ["NOTI-TODO-F-ID", "NOTI-TODO-F-STATUS", "NOTI-TODO-F-VERSION"], operationKind: "CREATE", successState: "OPEN", permissions: teacherMessagePermissions, pageId: todoPageId }),
    actionFact({ id: "NOTI-ACT-START-ACTION-TODO", label: "Start a Teaching Action Todo", targetObjectId: todo.id, inputFieldIds: ["NOTI-TODO-F-ID", "NOTI-TODO-F-TEACHER-JUDGMENT", "NOTI-TODO-F-LINKED-ACTIONS"], outputFieldIds: ["NOTI-TODO-F-STATUS", "NOTI-TODO-F-VERSION"], operationKind: "UPDATE", transition: { from: "OPEN", to: "IN_PROGRESS" }, permissions: teacherMessagePermissions, pageId: todoPageId }),
    actionFact({ id: "NOTI-ACT-OBSERVE-ACTION-TODO", label: "Move a Completed Teaching Action into Result Observation", targetObjectId: todo.id, inputFieldIds: ["NOTI-TODO-F-ID", "NOTI-TODO-F-LINKED-ACTIONS"], outputFieldIds: ["NOTI-TODO-F-STATUS", "NOTI-TODO-F-VERSION"], operationKind: "UPDATE", transition: { from: "IN_PROGRESS", to: "OBSERVING" }, permissions: teacherMessagePermissions, pageId: todoPageId }),
    actionFact({ id: "NOTI-ACT-RESOLVE-ACTION-TODO", label: "Resolve a Teaching Issue from New Evidence", targetObjectId: todo.id, inputFieldIds: ["NOTI-TODO-F-ID", "NOTI-TODO-F-RESOLUTION-EVIDENCE"], outputFieldIds: ["NOTI-TODO-F-RESOLUTION-EVIDENCE", "NOTI-TODO-F-STATUS", "NOTI-TODO-F-VERSION"], operationKind: "UPDATE", transition: { from: "OBSERVING", to: "RESOLVED" }, permissions: teacherMessagePermissions, pageId: todoPageId, extras: { resolutionEffect: { marksMastery: false, requiresNewEvidence: true } } }),
    actionFact({ id: "NOTI-ACT-REOPEN-ACTION-TODO", label: "Reopen a Teaching Issue after New Contrary Evidence", targetObjectId: todo.id, inputFieldIds: ["NOTI-TODO-F-ID", "NOTI-TODO-F-TEACHING-ISSUE"], outputFieldIds: ["NOTI-TODO-F-STATUS", "NOTI-TODO-F-VERSION"], operationKind: "UPDATE", transition: { from: "RESOLVED", to: "OPEN" }, permissions: teacherMessagePermissions, pageId: todoPageId }),
    actionFact({ id: "NOTI-ACT-CANCEL-ACTION-TODO", label: "Cancel an Invalid Teaching Action Todo", targetObjectId: todo.id, inputFieldIds: ["NOTI-TODO-F-ID", "NOTI-TODO-F-TEACHER-JUDGMENT"], outputFieldIds: ["NOTI-TODO-F-STATUS", "NOTI-TODO-F-VERSION"], operationKind: "UPDATE", transition: { from: ["OPEN", "IN_PROGRESS", "OBSERVING"], to: "CANCELLED" }, permissions: teacherMessagePermissions, pageId: todoPageId, risk: RISK.HIGH }),
  ];
  const messageActions = [
    actionFact({ id: "NOTI-ACT-CREATE-REMINDER", label: "Create an Authorized In-product Reminder Message", targetObjectId: message.id, inputFieldIds: messageCreateInputs, outputFieldIds: messageCreateOutputs, operationKind: "CREATE", successState: "AVAILABLE", permissions: teacherMessagePermissions, pageId: inboxPageId, extras: { capability: "REMINDER" } }),
    actionFact({ id: "NOTI-ACT-CREATE-REPORT-NOTIFICATION", label: "Create an Authorized In-product Report Message", targetObjectId: message.id, outputFieldIds: reportMessageOutputs, operationKind: "CREATE", successState: "AVAILABLE", permissions: allowDeny("SYSTEM", "CURRENT_ACTOR", "the report materialization Flow creates only its authorized minimal message", "a user cannot invoke the internal report notification sink directly"), executionMode: "FLOW_INTERNAL", trigger: { kind: "FLOW", flowIds: ["DF-013"] }, failureResults: ["PERMISSION_DENIED", "DELIVERY_FAILED", "VERSION_CONFLICT"] }),
    actionFact({ id: "NOTI-ACT-MARK-READ", label: "Mark an In-product Message Read", targetObjectId: message.id, inputFieldIds: ["NOTI-NOTIFICATION-F-ID"], outputFieldIds: ["NOTI-NOTIFICATION-F-READ-AT", "NOTI-NOTIFICATION-F-VERSION"], operationKind: "UPDATE", transition: { from: "AVAILABLE", to: "READ" }, permissions: recipientPermissions, pageId: inboxPageId, extras: { businessTodoEffect: "NONE" } }),
    actionFact({ id: "NOTI-ACT-MARK-HANDLED", label: "Archive an In-product Message without Resolving its Todo", targetObjectId: message.id, inputFieldIds: ["NOTI-NOTIFICATION-F-ID"], outputFieldIds: ["NOTI-NOTIFICATION-F-ARCHIVED-AT", "NOTI-NOTIFICATION-F-VERSION"], operationKind: "UPDATE", transition: { from: "READ", to: "ARCHIVED" }, permissions: recipientPermissions, pageId: inboxPageId, risk: RISK.HIGH, extras: { businessTodoEffect: "NONE" } }),
  ];
  const deliveryPermissions = allowDeny("SYSTEM", "ROLE-PLATFORM-OPS", "the system updates only the independent delivery attempt from a registered receipt", "platform operations cannot fabricate a delivery receipt");
  const queueDelivery = actionFact({
    id: "NOTI-ACT-QUEUE-DELIVERY",
    label: "Queue an Independent Notification Delivery Attempt",
    targetObjectId: delivery.id,
    inputFieldIds: ["NOTI-DELIVERY-F-MESSAGE-REF", "NOTI-DELIVERY-F-MESSAGE-VERSION", "NOTI-DELIVERY-F-CHANNEL"],
    outputFieldIds: ["NOTI-DELIVERY-F-ID", "NOTI-DELIVERY-F-RETRY-COUNT", "NOTI-DELIVERY-F-VERSION"],
    operationKind: "CREATE",
    successState: "QUEUED",
    permissions: deliveryPermissions,
    executionMode: "SYSTEM_EVENT",
    trigger: { kind: "EVENT", eventId: "EVT-NOTIFICATION-MESSAGE-AVAILABLE" },
    relatedStateGuards: [{ refFieldId: "NOTI-DELIVERY-F-MESSAGE-REF", versionFieldId: "NOTI-DELIVERY-F-MESSAGE-VERSION", targetObjectId: message.id, requiredState: "AVAILABLE" }],
    extras: {
      channel: "IN_PRODUCT",
      fieldWrites: [{ fieldId: "NOTI-DELIVERY-F-RETRY-COUNT", mode: "INITIALIZE", value: 0 }],
    },
  });
  const deliveryActions = [
    queueDelivery,
    actionFact({ id: "NOTI-ACT-DELIVER", label: "Record an Independent In-product Delivery Success", targetObjectId: delivery.id, inputFieldIds: ["NOTI-DELIVERY-F-ID"], outputFieldIds: ["NOTI-DELIVERY-F-DELIVERED-AT", "NOTI-DELIVERY-F-VERSION"], operationKind: "UPDATE", transition: { from: "QUEUED", to: "DELIVERED" }, permissions: deliveryPermissions, executionMode: "SYSTEM_EVENT", trigger: { kind: "EVENT", eventId: "EVT-NOTIFICATION-DELIVERY-SUCCEEDED" }, extras: { channel: "IN_PRODUCT" } }),
    actionFact({ id: "NOTI-ACT-FAIL-DELIVERY", label: "Record an Independent In-product Delivery Failure", targetObjectId: delivery.id, inputFieldIds: ["NOTI-DELIVERY-F-ID"], outputFieldIds: ["NOTI-DELIVERY-F-FAILURE-CODE", "NOTI-DELIVERY-F-VERSION"], operationKind: "UPDATE", transition: { from: "QUEUED", to: "FAILED" }, permissions: deliveryPermissions, executionMode: "SYSTEM_EVENT", trigger: { kind: "EVENT", eventId: "EVT-NOTIFICATION-DELIVERY-FAILED" }, extras: { channel: "IN_PRODUCT" } }),
    actionFact({ id: "NOTI-ACT-RETRY-DELIVERY", label: "Retry Only the Independent Delivery Attempt", targetObjectId: delivery.id, inputFieldIds: ["NOTI-DELIVERY-F-ID"], outputFieldIds: ["NOTI-DELIVERY-F-RETRY-COUNT", "NOTI-DELIVERY-F-VERSION"], operationKind: "UPDATE", transition: { from: "FAILED", to: "QUEUED" }, permissions: deliveryPermissions, executionMode: "SYSTEM_EVENT", trigger: { kind: "EVENT", eventId: "EVT-NOTIFICATION-DELIVERY-RETRY-DUE" }, extras: { channel: "IN_PRODUCT", fieldWrites: [{ fieldId: "NOTI-DELIVERY-F-RETRY-COUNT", mode: "INCREMENT", amount: 1 }] } }),
  ];
  const allActions = [recordEvent, ...todoActions, ...messageActions, ...deliveryActions];
  module.actions = allActions.map(({ action }) => action);
  module.scenarios = allActions.flatMap(({ scenarios }) => scenarios);
  module.relationships = [
    { id: "NOTI-REL-EVENT-TODO", fromObjectId: todo.id, toObjectId: businessEvent.id, type: "DERIVED_FROM", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SCHOOL", onSourceInvalidation: "retain the todo history, mark the source stale, and require re-evaluation without changing message read state" },
    { id: "NOTI-REL-EVENT-MESSAGE", fromObjectId: message.id, toObjectId: businessEvent.id, type: "DERIVED_FROM", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SCHOOL", onSourceInvalidation: "withdraw the deep link if authorization fails without resolving any todo" },
    { id: "NOTI-REL-MESSAGE-DELIVERY", fromObjectId: delivery.id, toObjectId: message.id, type: "DERIVED_FROM", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SCHOOL", onSourceInvalidation: "stop or fail only the delivery attempt without rolling back the business event or todo" },
  ];
  module.pages = [
    page(inboxPageId, "Notification Message Inbox", [message.id], messageActions.filter(({ action }) => action.executionMode === "USER_TASK").map(({ action }) => action.id), message.fields.map(({ id }) => id)),
    page(todoPageId, "Teaching Action Todo Queue", [todo.id, businessEvent.id], todoActions.map(({ action }) => action.id), [...todo.fields, ...businessEvent.fields].map(({ id }) => id)),
    page(deliveryPageId, "Notification Delivery Monitor", [delivery.id], [], delivery.fields.map(({ id }) => id)),
  ];
  module.operationalSeparationContract = {
    businessEventObjectId: businessEvent.id,
    actionTodoObjectId: todo.id,
    messageObjectId: message.id,
    deliveryObjectId: delivery.id,
    messageReadChangesTodo: false,
  };
  module.governanceBaselineOwner = ownerContract("NOTI-001", ["D039"]);
  return module;
}

function enhanceDataGovernanceModule(module) {
  const catalog = domainObject({
    id: "DGV-OBJ-DATA-CATALOG-ENTRY",
    label: "Eight-axis Data Catalog Entry",
    dataSubject: "DATA_CATALOG_ENTRY",
    producerRef: "ROLE-SCHOOL-ADMIN",
    ownerRef: "ROLE-SCHOOL-ADMIN",
    states: ["DRAFT", "ACTIVE", "SUPERSEDED"],
    fields: [
      identityField("DGV-CATALOG-F-ID", "Data Catalog Entry ID"),
      field("DGV-CATALOG-F-SOURCE-OBJECT-KIND", "Source Object Kind", { mutability: "IMMUTABLE" }),
      optionField("DGV-CATALOG-F-NATURE", "Data Nature", "OPT-BL2-003", { mutability: "IMMUTABLE" }),
      optionField("DGV-CATALOG-F-DATA-SUBJECT", "Data Subject", "OPT-BL2-004", { mutability: "IMMUTABLE" }),
      optionField("DGV-CATALOG-F-MANAGEMENT-SCOPE", "Management Scope", "OPT-BL2-005", { mutability: "IMMUTABLE" }),
      optionField("DGV-CATALOG-F-SOURCE-RIGHTS", "Source Rights Basis", "OPT-BL2-006", { mutability: "IMMUTABLE" }),
      optionField("DGV-CATALOG-F-PURPOSE", "Authorized Purpose", "OPT-BL2-007", { mutability: "IMMUTABLE" }),
      optionField("DGV-CATALOG-F-SENSITIVITY", "Sensitivity", "OPT-BL2-008", { mutability: "IMMUTABLE" }),
      optionField("DGV-CATALOG-F-PORTABILITY", "Portability", "OPT-BL2-009", { mutability: "IMMUTABLE" }),
      optionField("DGV-CATALOG-F-LIFECYCLE", "Lifecycle", "OPT-BL2-010", { mutability: "IMMUTABLE" }),
      systemField("DGV-CATALOG-F-STATUS", "Catalog Entry Status"),
      versionField("DGV-CATALOG-F-VERSION", "Catalog Entry Version"),
    ],
    overrides: {
      readMode: "AUTHORIZED",
      dataCatalogContract: { axisFieldIds: DATA_CATALOG_AXIS_FIELD_IDS },
    },
  });
  const governanceCase = domainObject({
    id: "DGV-OBJ-DATA-GOVERNANCE-CASE",
    label: "Executed Data Governance Action",
    dataSubject: "DATA_GOVERNANCE_CASE",
    producerRef: "ROLE-PLATFORM-GOVERNANCE",
    ownerRef: "ROLE-PLATFORM-GOVERNANCE",
    confirmerRef: "ROLE-PLATFORM-GOVERNANCE",
    stewardRef: "ROLE-SCHOOL-ADMIN",
    lifecyclePolicyId: "LIFE-009",
    sensitivityId: "S3",
    states: ["CORRECTED", "ACCESS_RESTRICTED", "PHYSICALLY_DELETED", "IRREVERSIBLY_DEIDENTIFIED"],
    fields: [
      identityField("DGV-GOVCASE-F-ID", "Data Governance Case ID"),
      field("DGV-GOVCASE-F-TARGET-OBJECT-ID", "Target Object ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("DGV-GOVCASE-F-CATALOG-ENTRY-ID", "Eight-axis Catalog Entry ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      optionField("DGV-GOVCASE-F-ACTION-KIND", "Governance Action Kind", "OPT-BL2-011", { mutability: "IMMUTABLE" }),
      field("DGV-GOVCASE-F-LEGAL-BASIS", "Verified Legal or Contractual Basis", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("DGV-GOVCASE-F-DISPUTE-BASIS", "Dispute or Hold Basis", { dataType: "JSON", mutability: "IMMUTABLE" }),
      systemField("DGV-GOVCASE-F-EXECUTION-EVIDENCE", "Governance Execution Evidence", "JSON", { mutability: "IMMUTABLE" }),
      systemField("DGV-GOVCASE-F-STATUS", "Governance Case Status"),
      versionField("DGV-GOVCASE-F-VERSION", "Governance Case Version"),
    ],
    overrides: {
      fourActionPolicy: {
        actionKinds: ["CORRECT", "RESTRICT_ACCESS", "PHYSICAL_DELETE", "IRREVERSIBLE_DEIDENTIFY"],
        singleDeleteStatusAllowed: false,
      },
    },
  });
  const deletionCase = domainObject({
    id: "DGV-OBJ-STUDENT-DELETION-CASE",
    label: "Student Identity Deletion Case",
    dataSubject: "STUDENT_DELETION_CASE",
    producerRef: "CURRENT_ACTOR",
    ownerRef: "ROLE-PLATFORM-GOVERNANCE",
    confirmerRef: "ROLE-PLATFORM-GOVERNANCE",
    stewardRef: "ROLE-PLATFORM-GOVERNANCE",
    lifecyclePolicyId: "LIFE-009",
    sensitivityId: "S4",
    states: ["REQUESTED", "FROZEN", "MATRIX_COMPLETE", "EXECUTING", "COMPLETED", "FAILED"],
    fields: [
      identityField("DGV-DELCASE-F-ID", "Student Deletion Case ID"),
      field("DGV-DELCASE-F-PLATFORM-IDENTITY-ID", "Platform Identity ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("DGV-DELCASE-F-STUDENT-PROFILE-ID", "Student Profile ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("DGV-DELCASE-F-HIGH-IMPACT-AUTHORIZATION-ID", "High-impact Authorization ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("DGV-DELCASE-F-LEGAL-BASIS", "Case Legal Basis", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("DGV-DELCASE-F-DISPUTE-BASIS", "Case Dispute or Hold Basis", { dataType: "JSON", mutability: "IMMUTABLE" }),
      systemField("DGV-DELCASE-F-CATEGORY-COVERAGE", "Nine-category Decision Coverage", "JSON"),
      systemField("DGV-DELCASE-F-STATUS", "Student Deletion Case Status"),
      versionField("DGV-DELCASE-F-VERSION", "Student Deletion Case Version"),
    ],
    overrides: {
      identityDeletionGate: {
        requiredObjectCategories: DELETION_OBJECT_CATEGORIES,
        terminalDecisionStates: ["COMPLETED"],
        nonReleasableDecisionStates: ["FAILED", "FROZEN", "PENDING", "AUTHORIZED", "EXECUTING"],
        releaseState: "COMPLETED",
      },
    },
  });
  const inventoryCaseRef = versionPinnedReference({
    id: "DGV-INVENTORY-F-DELETION-CASE-REF",
    label: "Pinned Student Deletion Case for Inventory",
    targetObjectId: deletionCase.id,
    versionFieldId: "DGV-INVENTORY-F-DELETION-CASE-VERSION",
    targetVersionFieldId: "DGV-DELCASE-F-VERSION",
    requiredActionIds: ["DGV-ACT-CAPTURE-STUDENT-DELETION-INVENTORY"],
    stateGuardPolicy: "CREATE_REQUIRED",
  });
  const deletionInventory = domainObject({
    id: "DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT",
    label: "Frozen Student Deletion Source-object Inventory Snapshot",
    dataSubject: "STUDENT_DELETION_INVENTORY_SNAPSHOT",
    producerRef: "ROLE-PLATFORM-GOVERNANCE",
    ownerRef: "ROLE-PLATFORM-GOVERNANCE",
    confirmerRef: "ROLE-PLATFORM-GOVERNANCE",
    stewardRef: "ROLE-PLATFORM-GOVERNANCE",
    lifecyclePolicyId: "LIFE-009",
    sensitivityId: "S4",
    states: ["FROZEN"],
    fields: [
      identityField("DGV-INVENTORY-F-ID", "Student Deletion Inventory Snapshot ID"),
      inventoryCaseRef,
      systemField("DGV-INVENTORY-F-DELETION-CASE-VERSION", "Pinned Student Deletion Case Version", "INTEGER", { mutability: "IMMUTABLE" }),
      systemField("DGV-INVENTORY-F-SOURCE-OBJECT-SET", "Exact Source-object ID Category and Version Set", "JSON", { mutability: "IMMUTABLE" }),
      systemField("DGV-INVENTORY-F-SOURCE-OBJECT-COUNT", "Source-object Count", "INTEGER", { mutability: "IMMUTABLE" }),
      systemField("DGV-INVENTORY-F-SOURCE-OBJECT-DIGEST", "Source-object Inventory Digest", "STRING", { mutability: "IMMUTABLE" }),
      systemField("DGV-INVENTORY-F-CAPTURED-AT", "Inventory Captured At", "DATETIME", { mutability: "IMMUTABLE" }),
      systemField("DGV-INVENTORY-F-STATUS", "Inventory Snapshot Status"),
      versionField("DGV-INVENTORY-F-VERSION", "Inventory Snapshot Version"),
    ],
    lineageBindings: [lineage(
      "DGV-INVENTORY-F-DELETION-CASE-REF",
      "DGV-INVENTORY-F-DELETION-CASE-VERSION",
      deletionCase.id,
      "DGV-DELCASE-F-VERSION",
    )],
    overrides: {
      inventorySnapshotContract: {
        sourceObjectSetFieldId: "DGV-INVENTORY-F-SOURCE-OBJECT-SET",
        sourceObjectCountFieldId: "DGV-INVENTORY-F-SOURCE-OBJECT-COUNT",
        sourceObjectDigestFieldId: "DGV-INVENTORY-F-SOURCE-OBJECT-DIGEST",
        itemIdentityParts: ["SOURCE_OBJECT_ID", "SOURCE_OBJECT_CATEGORY", "SOURCE_OBJECT_VERSION"],
        hiddenObjectAllowed: false,
        mutableAfterCapture: false,
      },
    },
  });
  const deletionCaseRef = versionPinnedReference({
    id: "DGV-DELROW-F-DELETION-CASE-REF",
    label: "Pinned Student Deletion Case Reference",
    targetObjectId: deletionCase.id,
    versionFieldId: "DGV-DELROW-F-DELETION-CASE-VERSION",
    targetVersionFieldId: "DGV-DELCASE-F-VERSION",
    requiredActionIds: ["DGV-ACT-REGISTER-STUDENT-DELETION-DECISION"],
    stateGuardPolicy: "CREATE_REQUIRED",
  });
  const deletionInventoryRef = versionPinnedReference({
    id: "DGV-DELROW-F-INVENTORY-REF",
    label: "Pinned Student Deletion Inventory Snapshot",
    targetObjectId: deletionInventory.id,
    versionFieldId: "DGV-DELROW-F-INVENTORY-VERSION",
    targetVersionFieldId: "DGV-INVENTORY-F-VERSION",
    requiredActionIds: ["DGV-ACT-REGISTER-STUDENT-DELETION-DECISION"],
    stateGuardPolicy: "CREATE_REQUIRED",
  });
  const deletionDecision = domainObject({
    id: "DGV-OBJ-STUDENT-DELETION-DECISION",
    label: "Student Deletion Object-level Decision",
    dataSubject: "STUDENT_DELETION_OBJECT_DECISION",
    producerRef: "ROLE-PLATFORM-GOVERNANCE",
    ownerRef: "ROLE-PLATFORM-GOVERNANCE",
    confirmerRef: "ROLE-PLATFORM-GOVERNANCE",
    stewardRef: "ROLE-PLATFORM-GOVERNANCE",
    lifecyclePolicyId: "LIFE-009",
    sensitivityId: "S4",
    states: ["PENDING", "FROZEN", "AUTHORIZED", "EXECUTING", "COMPLETED", "FAILED"],
    fields: [
      identityField("DGV-DELROW-F-ID", "Student Deletion Decision ID"),
      deletionCaseRef,
      systemField("DGV-DELROW-F-DELETION-CASE-VERSION", "Pinned Student Deletion Case Version", "INTEGER", { mutability: "IMMUTABLE" }),
      deletionInventoryRef,
      systemField("DGV-DELROW-F-INVENTORY-VERSION", "Pinned Student Deletion Inventory Version", "INTEGER", { mutability: "IMMUTABLE" }),
      field("DGV-DELROW-F-INVENTORY-ITEM-ID", "Frozen Inventory Item ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("DGV-DELROW-F-INVENTORY-ITEM-DIGEST", "Frozen Inventory Item Digest", { mutability: "IMMUTABLE" }),
      field("DGV-DELROW-F-SOURCE-OBJECT-ID", "Source Object ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("DGV-DELROW-F-SOURCE-OBJECT-VERSION", "Source Object Version", { dataType: "INTEGER", mutability: "IMMUTABLE" }),
      optionField("DGV-DELROW-F-SOURCE-OBJECT-CATEGORY", "Source Object Category", "OPT-BL2-012", { mutability: "IMMUTABLE" }),
      field("DGV-DELROW-F-LEGAL-BASIS", "Object-specific Legal Basis", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("DGV-DELROW-F-DISPUTE-BASIS", "Object-specific Dispute or Hold Basis", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("DGV-DELROW-F-HIGH-IMPACT-AUTHORIZATION-ID", "Object Decision Authorization ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      optionField("DGV-DELROW-F-GOVERNANCE-ACTION", "Object-specific Governance Outcome", "OPT-BL2-013", { mutability: "IMMUTABLE" }),
      optionField("DGV-DELROW-F-EXECUTION-STATUS", "Object Decision Execution Status", "OPT-BL2-014", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-BL2-014" }, mutability: "SYSTEM_MANAGED" }),
      systemField("DGV-DELROW-F-EXECUTION-EVIDENCE", "Object Decision Execution Evidence", "JSON", { required: false }),
      versionField("DGV-DELROW-F-VERSION", "Student Deletion Decision Version"),
    ],
    lineageBindings: [
      lineage(
        "DGV-DELROW-F-DELETION-CASE-REF",
        "DGV-DELROW-F-DELETION-CASE-VERSION",
        deletionCase.id,
        "DGV-DELCASE-F-VERSION",
      ),
      lineage(
        "DGV-DELROW-F-INVENTORY-REF",
        "DGV-DELROW-F-INVENTORY-VERSION",
        deletionInventory.id,
        "DGV-INVENTORY-F-VERSION",
      ),
    ],
    overrides: {
      studentDeletionDecisionContract: {
        objectCategories: DELETION_OBJECT_CATEGORIES,
        requiredBindingFieldIds: [
          "DGV-DELROW-F-DELETION-CASE-REF",
          "DGV-DELROW-F-DELETION-CASE-VERSION",
          "DGV-DELROW-F-INVENTORY-REF",
          "DGV-DELROW-F-INVENTORY-VERSION",
          "DGV-DELROW-F-INVENTORY-ITEM-ID",
          "DGV-DELROW-F-INVENTORY-ITEM-DIGEST",
          "DGV-DELROW-F-SOURCE-OBJECT-ID",
          "DGV-DELROW-F-SOURCE-OBJECT-VERSION",
          "DGV-DELROW-F-SOURCE-OBJECT-CATEGORY",
          "DGV-DELROW-F-LEGAL-BASIS",
          "DGV-DELROW-F-DISPUTE-BASIS",
          "DGV-DELROW-F-HIGH-IMPACT-AUTHORIZATION-ID",
          "DGV-DELROW-F-GOVERNANCE-ACTION",
          "DGV-DELROW-F-EXECUTION-STATUS",
        ],
      },
    },
  });
  const matrixCaseRef = versionPinnedReference({
    id: "DGV-MATRIX-F-DELETION-CASE-REF",
    label: "Pinned Student Deletion Case for Matrix Evaluation",
    targetObjectId: deletionCase.id,
    versionFieldId: "DGV-MATRIX-F-DELETION-CASE-VERSION",
    targetVersionFieldId: "DGV-DELCASE-F-VERSION",
    requiredActionIds: ["DGV-ACT-EVALUATE-STUDENT-DELETION-MATRIX"],
    stateGuardPolicy: "CREATE_REQUIRED",
  });
  const matrixInventoryRef = versionPinnedReference({
    id: "DGV-MATRIX-F-INVENTORY-REF",
    label: "Pinned Student Deletion Inventory for Matrix Evaluation",
    targetObjectId: deletionInventory.id,
    versionFieldId: "DGV-MATRIX-F-INVENTORY-VERSION",
    targetVersionFieldId: "DGV-INVENTORY-F-VERSION",
    requiredActionIds: ["DGV-ACT-EVALUATE-STUDENT-DELETION-MATRIX"],
    stateGuardPolicy: "CREATE_REQUIRED",
  });
  const deletionMatrix = domainObject({
    id: "DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT",
    label: "Evaluated Student Deletion Matrix Snapshot",
    dataSubject: "STUDENT_DELETION_MATRIX_SNAPSHOT",
    producerRef: "ROLE-PLATFORM-GOVERNANCE",
    ownerRef: "ROLE-PLATFORM-GOVERNANCE",
    confirmerRef: "ROLE-PLATFORM-GOVERNANCE",
    stewardRef: "ROLE-PLATFORM-GOVERNANCE",
    lifecyclePolicyId: "LIFE-009",
    sensitivityId: "S4",
    states: ["READY", "EXECUTING", "COMPLETED", "BLOCKED"],
    fields: [
      identityField("DGV-MATRIX-F-ID", "Student Deletion Matrix Snapshot ID"),
      matrixCaseRef,
      systemField("DGV-MATRIX-F-DELETION-CASE-VERSION", "Pinned Student Deletion Case Version", "INTEGER", { mutability: "IMMUTABLE" }),
      matrixInventoryRef,
      systemField("DGV-MATRIX-F-INVENTORY-VERSION", "Pinned Student Deletion Inventory Version", "INTEGER", { mutability: "IMMUTABLE" }),
      systemField("DGV-MATRIX-F-INVENTORY-DIGEST", "Pinned Inventory Digest", "STRING", { mutability: "IMMUTABLE" }),
      systemField("DGV-MATRIX-F-INVENTORY-ITEM-COUNT", "Inventory Item Count", "INTEGER", { mutability: "IMMUTABLE" }),
      systemField("DGV-MATRIX-F-DECISION-VERSION-SET", "Exact Decision ID and Version Set", "JSON", { mutability: "IMMUTABLE" }),
      systemField("DGV-MATRIX-F-DECISION-SET-DIGEST", "Decision Version Set Digest", "STRING", { mutability: "IMMUTABLE" }),
      systemField("DGV-MATRIX-F-DECISION-COUNT", "Decision Count", "INTEGER", { mutability: "IMMUTABLE" }),
      systemField("DGV-MATRIX-F-MISSING-DECISION-COUNT", "Missing Decision Count", "INTEGER", { mutability: "IMMUTABLE" }),
      systemField("DGV-MATRIX-F-DUPLICATE-DECISION-COUNT", "Duplicate Decision Count", "INTEGER", { mutability: "IMMUTABLE" }),
      systemField("DGV-MATRIX-F-UNAUTHORIZED-DECISION-COUNT", "Unauthorized Decision Count", "INTEGER", { mutability: "IMMUTABLE" }),
      systemField("DGV-MATRIX-F-UNRESOLVED-EXECUTION-COUNT", "Unresolved Execution Count", "INTEGER", {
        required: { description: "required when completing or blocking matrix execution", whenStates: ["COMPLETED", "BLOCKED"], whenActionIds: ["DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT", "DGV-ACT-BLOCK-STUDENT-DELETION-MATRIX-SNAPSHOT"] },
      }),
      systemField("DGV-MATRIX-F-FAILED-EXECUTION-COUNT", "Failed Execution Count", "INTEGER", {
        required: { description: "required when completing or blocking matrix execution", whenStates: ["COMPLETED", "BLOCKED"], whenActionIds: ["DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT", "DGV-ACT-BLOCK-STUDENT-DELETION-MATRIX-SNAPSHOT"] },
      }),
      systemField("DGV-MATRIX-F-FROZEN-EXECUTION-COUNT", "Frozen Execution Count", "INTEGER", {
        required: { description: "required when completing or blocking matrix execution", whenStates: ["COMPLETED", "BLOCKED"], whenActionIds: ["DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT", "DGV-ACT-BLOCK-STUDENT-DELETION-MATRIX-SNAPSHOT"] },
      }),
      systemField("DGV-MATRIX-F-LAWFUL-RETENTION-COUNT", "Lawful Retention Decision Count", "INTEGER", {
        required: { description: "required when completing matrix execution", whenStates: ["COMPLETED"], whenActionIds: ["DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT"] },
      }),
      systemField("DGV-MATRIX-F-EXECUTION-DIGEST", "Terminal Decision Execution Digest", "STRING", {
        required: { description: "required when completing matrix execution", whenStates: ["COMPLETED"], whenActionIds: ["DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT"] },
      }),
      systemField("DGV-MATRIX-F-STATUS", "Deletion Matrix Snapshot Status"),
      versionField("DGV-MATRIX-F-VERSION", "Deletion Matrix Snapshot Version"),
    ],
    lineageBindings: [
      lineage(
        "DGV-MATRIX-F-DELETION-CASE-REF",
        "DGV-MATRIX-F-DELETION-CASE-VERSION",
        deletionCase.id,
        "DGV-DELCASE-F-VERSION",
      ),
      lineage(
        "DGV-MATRIX-F-INVENTORY-REF",
        "DGV-MATRIX-F-INVENTORY-VERSION",
        deletionInventory.id,
        "DGV-INVENTORY-F-VERSION",
      ),
    ],
    overrides: {
      matrixAggregationContract: {
        inventoryObjectId: deletionInventory.id,
        decisionObjectId: deletionDecision.id,
        exactOneDecisionPerInventoryItem: true,
        decisionIdentityParts: ["DGV-DELROW-F-INVENTORY-ITEM-ID", "DGV-DELROW-F-SOURCE-OBJECT-ID", "DGV-DELROW-F-SOURCE-OBJECT-VERSION"],
        decisionVersionSetFieldId: "DGV-MATRIX-F-DECISION-VERSION-SET",
        readyRequiresZeroFields: [
          "DGV-MATRIX-F-MISSING-DECISION-COUNT",
          "DGV-MATRIX-F-DUPLICATE-DECISION-COUNT",
          "DGV-MATRIX-F-UNAUTHORIZED-DECISION-COUNT",
        ],
        completeRequiresZeroFields: [
          "DGV-MATRIX-F-UNRESOLVED-EXECUTION-COUNT",
          "DGV-MATRIX-F-FAILED-EXECUTION-COUNT",
          "DGV-MATRIX-F-FROZEN-EXECUTION-COUNT",
        ],
        releasableDecisionStates: ["COMPLETED"],
        lawfulRetentionOutcome: "RETAIN_LEGAL_HOLD",
      },
    },
  });
  const caseMatrixRef = versionPinnedReference({
    id: "DGV-DELCASE-F-MATRIX-SNAPSHOT-REF",
    label: "Pinned Evaluated Student Deletion Matrix Snapshot",
    targetObjectId: deletionMatrix.id,
    versionFieldId: "DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION",
    targetVersionFieldId: "DGV-MATRIX-F-VERSION",
    requiredActionIds: [
      "DGV-ACT-FINALIZE-STUDENT-DELETION-MATRIX",
      "DGV-ACT-EXECUTE-STUDENT-DELETION-MATRIX",
      "DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX",
      "DGV-ACT-FAIL-STUDENT-DELETION-MATRIX",
    ],
    stateGuardPolicy: "ALWAYS_REQUIRED",
    overrides: {
      required: {
        description: "written when the evaluated matrix is finalized and retained through identity deletion release",
        whenStates: ["MATRIX_COMPLETE", "EXECUTING", "COMPLETED", "FAILED"],
        whenActionIds: ["DGV-ACT-FINALIZE-STUDENT-DELETION-MATRIX"],
      },
    },
  });
  addFields(deletionCase, [
    caseMatrixRef,
    systemField("DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION", "Pinned Evaluated Matrix Snapshot Version", "INTEGER", {
      required: {
        description: "required from matrix finalization through identity deletion release",
        whenStates: ["MATRIX_COMPLETE", "EXECUTING", "COMPLETED", "FAILED"],
        whenActionIds: ["DGV-ACT-FINALIZE-STUDENT-DELETION-MATRIX"],
      },
    }),
  ]);
  deletionCase.lineageBindings = [
    ...(deletionCase.lineageBindings ?? []),
    lineage(
      "DGV-DELCASE-F-MATRIX-SNAPSHOT-REF",
      "DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION",
      deletionMatrix.id,
      "DGV-MATRIX-F-VERSION",
    ),
  ];
  deletionCase.identityDeletionGate.matrixSnapshotObjectId = deletionMatrix.id;
  deletionCase.identityDeletionGate.matrixSnapshotRefFieldId = "DGV-DELCASE-F-MATRIX-SNAPSHOT-REF";
  deletionCase.identityDeletionGate.matrixSnapshotVersionFieldId = "DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION";
  deletionCase.identityDeletionGate.requiredMatrixState = "COMPLETED";
  module.objects.push(
    catalog,
    governanceCase,
    deletionCase,
    deletionInventory,
    deletionDecision,
    deletionMatrix,
  );

  const catalogPageId = "DGV-PAGE-DATA-CATALOG";
  const governancePageId = "DGV-PAGE-GOVERNANCE-ACTIONS";
  const deletionPageId = "DGV-PAGE-STUDENT-DELETION-MATRIX";
  const catalogActions = [
    actionFact({ id: "DGV-ACT-REGISTER-DATA-CATALOG", label: "Register an Eight-axis Data Catalog Entry", targetObjectId: catalog.id, inputFieldIds: ["DGV-CATALOG-F-SOURCE-OBJECT-KIND", ...DATA_CATALOG_AXIS_FIELD_IDS], outputFieldIds: ["DGV-CATALOG-F-ID", "DGV-CATALOG-F-STATUS", "DGV-CATALOG-F-VERSION"], operationKind: "CREATE", successState: "DRAFT", permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "the school registers all eight governance axes for an owned object kind", "platform operations cannot synthesize school data classification"), pageId: catalogPageId, risk: RISK.HIGH }),
    actionFact({ id: "DGV-ACT-ACTIVATE-DATA-CATALOG", label: "Activate a Complete Eight-axis Data Catalog Entry", targetObjectId: catalog.id, inputFieldIds: ["DGV-CATALOG-F-ID", ...DATA_CATALOG_AXIS_FIELD_IDS], outputFieldIds: ["DGV-CATALOG-F-STATUS", "DGV-CATALOG-F-VERSION"], operationKind: "UPDATE", transition: { from: "DRAFT", to: "ACTIVE" }, permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "all eight axes are explicit and internally consistent", "platform operations cannot activate an incomplete school catalog"), pageId: catalogPageId, risk: RISK.HIGH }),
    actionFact({ id: "DGV-ACT-SUPERSEDE-DATA-CATALOG", label: "Supersede a Data Catalog Entry with a New Version", targetObjectId: catalog.id, inputFieldIds: ["DGV-CATALOG-F-ID"], outputFieldIds: ["DGV-CATALOG-F-STATUS", "DGV-CATALOG-F-VERSION"], operationKind: "UPDATE", transition: { from: "ACTIVE", to: "SUPERSEDED" }, permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "a replacement eight-axis entry has been activated", "platform operations cannot silently change school catalog governance"), pageId: catalogPageId, risk: RISK.HIGH }),
    actionFact({ id: "DGV-ACT-RESOLVE-DATA-CATALOG", label: "Resolve All Eight Data Governance Axes", targetObjectId: catalog.id, inputFieldIds: ["DGV-CATALOG-F-ID"], outputFieldIds: DATA_CATALOG_AXIS_FIELD_IDS, operationKind: "READ", permissions: allowDeny("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "the school resolves the active complete catalog entry", "platform operations cannot read school governance data by default"), pageId: catalogPageId, failureResults: ["PERMISSION_DENIED", "NOT_FOUND", "CATALOG_AXIS_INCOMPLETE"], boundaryResultCodes: ["CATALOG_AXIS_INCOMPLETE"], extras: { requiredAxisFieldIds: DATA_CATALOG_AXIS_FIELD_IDS } }),
  ];
  const governanceActionDefinitions = [
    ["DGV-ACT-CORRECT-DATA", "Correct a Data Fact without Replacing History", "CORRECT", "CORRECTED"],
    ["DGV-ACT-RESTRICT-DATA-ACCESS", "Restrict Access without Claiming Deletion", "RESTRICT_ACCESS", "ACCESS_RESTRICTED"],
    ["DGV-ACT-PHYSICALLY-DELETE-DATA", "Physically Delete Product-controlled Data", "PHYSICAL_DELETE", "PHYSICALLY_DELETED"],
    ["DGV-ACT-IRREVERSIBLY-DEIDENTIFY-DATA", "Irreversibly Deidentify Data", "IRREVERSIBLE_DEIDENTIFY", "IRREVERSIBLY_DEIDENTIFIED"],
  ];
  const governanceActions = governanceActionDefinitions.map(([id, label, actionKind, successState]) => actionFact({
    id,
    label,
    targetObjectId: governanceCase.id,
    inputFieldIds: ["DGV-GOVCASE-F-TARGET-OBJECT-ID", "DGV-GOVCASE-F-CATALOG-ENTRY-ID", "DGV-GOVCASE-F-ACTION-KIND", "DGV-GOVCASE-F-LEGAL-BASIS", "DGV-GOVCASE-F-DISPUTE-BASIS"],
    outputFieldIds: ["DGV-GOVCASE-F-ID", "DGV-GOVCASE-F-EXECUTION-EVIDENCE", "DGV-GOVCASE-F-STATUS", "DGV-GOVCASE-F-VERSION"],
    operationKind: "CREATE",
    successState,
    permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "platform governance executes exactly the authorized object-specific action", "a school administrator cannot collapse or self-execute a high-impact data action"),
    pageId: governancePageId,
    risk: RISK.HIGH,
    extras: {
      governanceActionKind: actionKind,
      acceptedInputValues: [{ fieldId: "DGV-GOVCASE-F-ACTION-KIND", optionSetId: "OPT-BL2-011", partitionId: "DGV-GOVERNANCE-ACTION-KIND", codes: [actionKind] }],
    },
  }));
  const matrixPermissions = allowDeny(
    "ROLE-PLATFORM-GOVERNANCE",
    "ROLE-SCHOOL-ADMIN",
    "platform governance evaluates the exact frozen inventory and versioned decision set for one student deletion case",
    "a school cannot synthesize or complete the platform identity deletion matrix",
  );
  const deletionMatrixActions = [
    actionFact({
      id: "DGV-ACT-CAPTURE-STUDENT-DELETION-INVENTORY",
      label: "Capture the Exact Student Source-object Inventory",
      targetObjectId: deletionInventory.id,
      inputFieldIds: [
        "DGV-INVENTORY-F-DELETION-CASE-REF",
        "DGV-INVENTORY-F-DELETION-CASE-VERSION",
      ],
      outputFieldIds: [
        "DGV-INVENTORY-F-ID",
        "DGV-INVENTORY-F-SOURCE-OBJECT-SET",
        "DGV-INVENTORY-F-SOURCE-OBJECT-COUNT",
        "DGV-INVENTORY-F-SOURCE-OBJECT-DIGEST",
        "DGV-INVENTORY-F-CAPTURED-AT",
        "DGV-INVENTORY-F-STATUS",
        "DGV-INVENTORY-F-VERSION",
      ],
      operationKind: "CREATE",
      successState: "FROZEN",
      permissions: matrixPermissions,
      pageId: deletionPageId,
      risk: RISK.HIGH,
      failureResults: [
        "PERMISSION_DENIED",
        "VALIDATION_FAILED",
        "VERSION_CONFLICT",
        "SOURCE_INVENTORY_INCOMPLETE",
      ],
      boundaryResultCodes: ["SOURCE_INVENTORY_INCOMPLETE"],
      failurePredicates: {
        SOURCE_INVENTORY_INCOMPLETE: "the authorized source-object resolver cannot enumerate every current student-linked object ID category and version",
      },
      relatedStateGuards: [{
        refFieldId: "DGV-INVENTORY-F-DELETION-CASE-REF",
        versionFieldId: "DGV-INVENTORY-F-DELETION-CASE-VERSION",
        targetObjectId: deletionCase.id,
        requiredState: "REQUESTED",
      }],
      extras: {
        inventoryResolution: {
          outputSetFieldId: "DGV-INVENTORY-F-SOURCE-OBJECT-SET",
          outputCountFieldId: "DGV-INVENTORY-F-SOURCE-OBJECT-COUNT",
          outputDigestFieldId: "DGV-INVENTORY-F-SOURCE-OBJECT-DIGEST",
          itemIdentityParts: ["SOURCE_OBJECT_ID", "SOURCE_OBJECT_CATEGORY", "SOURCE_OBJECT_VERSION"],
          completenessRequired: true,
        },
      },
    }),
    actionFact({
      id: "DGV-ACT-EVALUATE-STUDENT-DELETION-MATRIX",
      label: "Evaluate Exact-one Decision Coverage for the Frozen Inventory",
      targetObjectId: deletionMatrix.id,
      inputFieldIds: [
        "DGV-MATRIX-F-DELETION-CASE-REF",
        "DGV-MATRIX-F-DELETION-CASE-VERSION",
        "DGV-MATRIX-F-INVENTORY-REF",
        "DGV-MATRIX-F-INVENTORY-VERSION",
      ],
      outputFieldIds: [
        "DGV-MATRIX-F-ID",
        "DGV-MATRIX-F-INVENTORY-DIGEST",
        "DGV-MATRIX-F-INVENTORY-ITEM-COUNT",
        "DGV-MATRIX-F-DECISION-VERSION-SET",
        "DGV-MATRIX-F-DECISION-SET-DIGEST",
        "DGV-MATRIX-F-DECISION-COUNT",
        "DGV-MATRIX-F-MISSING-DECISION-COUNT",
        "DGV-MATRIX-F-DUPLICATE-DECISION-COUNT",
        "DGV-MATRIX-F-UNAUTHORIZED-DECISION-COUNT",
        "DGV-MATRIX-F-STATUS",
        "DGV-MATRIX-F-VERSION",
      ],
      operationKind: "CREATE",
      successState: "READY",
      permissions: matrixPermissions,
      pageId: deletionPageId,
      risk: RISK.HIGH,
      failureResults: [
        "PERMISSION_DENIED",
        "VALIDATION_FAILED",
        "VERSION_CONFLICT",
        "INVENTORY_MISMATCH",
        "MISSING_DECISION",
        "DUPLICATE_DECISION",
        "UNAUTHORIZED_DECISION",
      ],
      boundaryResultCodes: [
        "INVENTORY_MISMATCH",
        "MISSING_DECISION",
        "DUPLICATE_DECISION",
        "UNAUTHORIZED_DECISION",
      ],
      failurePredicates: {
        INVENTORY_MISMATCH: "a decision row inventory reference version item digest source object ID category or source version differs from the frozen inventory",
        MISSING_DECISION: "at least one frozen inventory item has no decision row",
        DUPLICATE_DECISION: "at least one frozen inventory item has more than one decision row",
        UNAUTHORIZED_DECISION: "at least one decision row is not AUTHORIZED with object-specific legal dispute and high-impact authorization evidence",
      },
      relatedStateGuards: [
        {
          refFieldId: "DGV-MATRIX-F-DELETION-CASE-REF",
          versionFieldId: "DGV-MATRIX-F-DELETION-CASE-VERSION",
          targetObjectId: deletionCase.id,
          requiredState: "REQUESTED",
        },
        {
          refFieldId: "DGV-MATRIX-F-INVENTORY-REF",
          versionFieldId: "DGV-MATRIX-F-INVENTORY-VERSION",
          targetObjectId: deletionInventory.id,
          requiredState: "FROZEN",
        },
      ],
      extras: {
        decisionAggregation: {
          inventoryObjectId: deletionInventory.id,
          decisionObjectId: deletionDecision.id,
          exactOneDecisionPerInventoryItem: true,
          requiredDecisionState: "AUTHORIZED",
          decisionVersionSetOutputFieldId: "DGV-MATRIX-F-DECISION-VERSION-SET",
          zeroCountFieldIds: [
            "DGV-MATRIX-F-MISSING-DECISION-COUNT",
            "DGV-MATRIX-F-DUPLICATE-DECISION-COUNT",
            "DGV-MATRIX-F-UNAUTHORIZED-DECISION-COUNT",
          ],
        },
      },
    }),
    actionFact({
      id: "DGV-ACT-START-STUDENT-DELETION-MATRIX-SNAPSHOT",
      label: "Start the Evaluated Student Deletion Matrix Execution",
      targetObjectId: deletionMatrix.id,
      inputFieldIds: ["DGV-MATRIX-F-ID", "DGV-MATRIX-F-DECISION-SET-DIGEST"],
      outputFieldIds: ["DGV-MATRIX-F-STATUS", "DGV-MATRIX-F-VERSION"],
      operationKind: "UPDATE",
      transition: { from: "READY", to: "EXECUTING" },
      permissions: matrixPermissions,
      pageId: deletionPageId,
      risk: RISK.HIGH,
    }),
    actionFact({
      id: "DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT",
      label: "Complete the Exact Decision Execution Set",
      targetObjectId: deletionMatrix.id,
      inputFieldIds: ["DGV-MATRIX-F-ID", "DGV-MATRIX-F-DECISION-SET-DIGEST"],
      outputFieldIds: [
        "DGV-MATRIX-F-UNRESOLVED-EXECUTION-COUNT",
        "DGV-MATRIX-F-FAILED-EXECUTION-COUNT",
        "DGV-MATRIX-F-FROZEN-EXECUTION-COUNT",
        "DGV-MATRIX-F-LAWFUL-RETENTION-COUNT",
        "DGV-MATRIX-F-EXECUTION-DIGEST",
        "DGV-MATRIX-F-STATUS",
        "DGV-MATRIX-F-VERSION",
      ],
      operationKind: "UPDATE",
      transition: { from: "EXECUTING", to: "COMPLETED" },
      permissions: matrixPermissions,
      pageId: deletionPageId,
      risk: RISK.HIGH,
      failureResults: [
        "PERMISSION_DENIED",
        "VALIDATION_FAILED",
        "VERSION_CONFLICT",
        "DECISION_SET_CHANGED",
        "UNRESOLVED_DECISION",
        "FAILED_DECISION",
        "FROZEN_DECISION",
      ],
      boundaryResultCodes: [
        "DECISION_SET_CHANGED",
        "UNRESOLVED_DECISION",
        "FAILED_DECISION",
        "FROZEN_DECISION",
      ],
      failurePredicates: {
        DECISION_SET_CHANGED: "the current decision ID and version set differs from the evaluated immutable set",
        UNRESOLVED_DECISION: "at least one evaluated decision is not COMPLETED",
        FAILED_DECISION: "at least one evaluated decision is FAILED",
        FROZEN_DECISION: "at least one evaluated decision is FROZEN by dispute or hold",
      },
      extras: {
        executionAggregation: {
          decisionVersionSetFieldId: "DGV-MATRIX-F-DECISION-VERSION-SET",
          requiredDecisionState: "COMPLETED",
          allowedLawfulRetentionOutcome: "RETAIN_LEGAL_HOLD",
          zeroCountFieldIds: [
            "DGV-MATRIX-F-UNRESOLVED-EXECUTION-COUNT",
            "DGV-MATRIX-F-FAILED-EXECUTION-COUNT",
            "DGV-MATRIX-F-FROZEN-EXECUTION-COUNT",
          ],
        },
      },
    }),
    actionFact({
      id: "DGV-ACT-BLOCK-STUDENT-DELETION-MATRIX-SNAPSHOT",
      label: "Block an Incomplete Failed or Frozen Matrix Execution",
      targetObjectId: deletionMatrix.id,
      inputFieldIds: ["DGV-MATRIX-F-ID", "DGV-MATRIX-F-DECISION-SET-DIGEST"],
      outputFieldIds: [
        "DGV-MATRIX-F-UNRESOLVED-EXECUTION-COUNT",
        "DGV-MATRIX-F-FAILED-EXECUTION-COUNT",
        "DGV-MATRIX-F-FROZEN-EXECUTION-COUNT",
        "DGV-MATRIX-F-STATUS",
        "DGV-MATRIX-F-VERSION",
      ],
      operationKind: "UPDATE",
      transition: { from: ["READY", "EXECUTING"], to: "BLOCKED" },
      permissions: matrixPermissions,
      pageId: deletionPageId,
      risk: RISK.HIGH,
    }),
  ];
  const deletionCaseActions = [
    actionFact({ id: "DGV-ACT-REQUEST-STUDENT-DELETION", label: "Request a High-impact Student Deletion Case", targetObjectId: deletionCase.id, inputFieldIds: ["DGV-DELCASE-F-PLATFORM-IDENTITY-ID", "DGV-DELCASE-F-STUDENT-PROFILE-ID", "DGV-DELCASE-F-HIGH-IMPACT-AUTHORIZATION-ID", "DGV-DELCASE-F-LEGAL-BASIS", "DGV-DELCASE-F-DISPUTE-BASIS"], outputFieldIds: ["DGV-DELCASE-F-ID", "DGV-DELCASE-F-CATEGORY-COVERAGE", "DGV-DELCASE-F-STATUS", "DGV-DELCASE-F-VERSION"], operationKind: "CREATE", successState: "REQUESTED", permissions: allowDeny("CURRENT_ACTOR", "ROLE-SCHOOL-ADMIN", "the authorized data subject or verified representative requests deletion", "a school cannot delete a student's platform identity"), pageId: deletionPageId, risk: RISK.HIGH }),
    actionFact({ id: "DGV-ACT-FREEZE-STUDENT-DELETION", label: "Freeze an Unexecuted Student Deletion during Dispute", targetObjectId: deletionCase.id, inputFieldIds: ["DGV-DELCASE-F-ID", "DGV-DELCASE-F-DISPUTE-BASIS"], outputFieldIds: ["DGV-DELCASE-F-STATUS", "DGV-DELCASE-F-VERSION"], operationKind: "UPDATE", transition: { from: "REQUESTED", to: "FROZEN" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "a verified guardian or legal dispute requires freezing unexecuted actions", "a school cannot bypass a high-impact dispute"), pageId: deletionPageId, risk: RISK.HIGH }),
    actionFact({ id: "DGV-ACT-RESUME-STUDENT-DELETION", label: "Resume a Resolved Student Deletion Dispute", targetObjectId: deletionCase.id, inputFieldIds: ["DGV-DELCASE-F-ID", "DGV-DELCASE-F-DISPUTE-BASIS"], outputFieldIds: ["DGV-DELCASE-F-STATUS", "DGV-DELCASE-F-VERSION"], operationKind: "UPDATE", transition: { from: "FROZEN", to: "REQUESTED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "the dispute has a verified final resolution", "a school cannot unfreeze a high-impact dispute"), pageId: deletionPageId, risk: RISK.HIGH }),
    actionFact({ id: "DGV-ACT-FINALIZE-STUDENT-DELETION-MATRIX", label: "Finalize an Evaluated Exact Object-level Student Deletion Matrix", targetObjectId: deletionCase.id, inputFieldIds: ["DGV-DELCASE-F-ID", "DGV-DELCASE-F-MATRIX-SNAPSHOT-REF", "DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION", "DGV-DELCASE-F-HIGH-IMPACT-AUTHORIZATION-ID", "DGV-DELCASE-F-LEGAL-BASIS", "DGV-DELCASE-F-DISPUTE-BASIS"], outputFieldIds: ["DGV-DELCASE-F-MATRIX-SNAPSHOT-REF", "DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION", "DGV-DELCASE-F-CATEGORY-COVERAGE", "DGV-DELCASE-F-STATUS", "DGV-DELCASE-F-VERSION"], operationKind: "UPDATE", transition: { from: "REQUESTED", to: "MATRIX_COMPLETE" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "the pinned matrix proves exact-one authorized decision coverage for every frozen inventory object", "a school cannot finalize a partial disputed or fabricated deletion matrix"), pageId: deletionPageId, risk: RISK.HIGH, failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT", "MATRIX_NOT_READY"], boundaryResultCodes: ["MATRIX_NOT_READY"], failurePredicates: { MATRIX_NOT_READY: "the pinned matrix snapshot is absent stale blocked or has any missing duplicate unauthorized decision" }, relatedStateGuards: [{ refFieldId: "DGV-DELCASE-F-MATRIX-SNAPSHOT-REF", versionFieldId: "DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION", targetObjectId: deletionMatrix.id, requiredState: "READY" }], extras: { requiredObjectCategories: DELETION_OBJECT_CATEGORIES, requiredMatrixSnapshotObjectId: deletionMatrix.id, categoryCoverageIsAuthoritative: false } }),
    actionFact({ id: "DGV-ACT-EXECUTE-STUDENT-DELETION-MATRIX", label: "Execute the Pinned Evaluated Student Deletion Matrix", targetObjectId: deletionCase.id, inputFieldIds: ["DGV-DELCASE-F-ID", "DGV-DELCASE-F-MATRIX-SNAPSHOT-REF", "DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION"], outputFieldIds: ["DGV-DELCASE-F-STATUS", "DGV-DELCASE-F-VERSION"], operationKind: "UPDATE", transition: { from: "MATRIX_COMPLETE", to: "EXECUTING" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "the exact evaluated decision set has entered execution and remains version pinned", "a school cannot execute platform identity deletion"), pageId: deletionPageId, risk: RISK.HIGH, relatedStateGuards: [{ refFieldId: "DGV-DELCASE-F-MATRIX-SNAPSHOT-REF", versionFieldId: "DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION", targetObjectId: deletionMatrix.id, requiredState: "EXECUTING" }] }),
    actionFact({ id: "DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX", label: "Complete Student Deletion after Every Pinned Object Decision Succeeds or Is Lawfully Retained", targetObjectId: deletionCase.id, inputFieldIds: ["DGV-DELCASE-F-ID", "DGV-DELCASE-F-MATRIX-SNAPSHOT-REF", "DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION"], outputFieldIds: ["DGV-DELCASE-F-STATUS", "DGV-DELCASE-F-VERSION"], operationKind: "UPDATE", transition: { from: "EXECUTING", to: "COMPLETED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "the pinned matrix snapshot proves every exact decision completed with evidence including explicit lawful retention where required", "a school cannot mark a partial failed frozen or unresolved matrix complete"), pageId: deletionPageId, risk: RISK.HIGH, failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT", "MATRIX_EXECUTION_INCOMPLETE"], boundaryResultCodes: ["MATRIX_EXECUTION_INCOMPLETE"], failurePredicates: { MATRIX_EXECUTION_INCOMPLETE: "the pinned matrix snapshot is not COMPLETED or any evaluated decision is unresolved failed frozen or changed" }, relatedStateGuards: [{ refFieldId: "DGV-DELCASE-F-MATRIX-SNAPSHOT-REF", versionFieldId: "DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION", targetObjectId: deletionMatrix.id, requiredState: "COMPLETED" }] }),
    actionFact({ id: "DGV-ACT-FAIL-STUDENT-DELETION-MATRIX", label: "Record a Blocked Student Deletion Matrix Execution", targetObjectId: deletionCase.id, inputFieldIds: ["DGV-DELCASE-F-ID", "DGV-DELCASE-F-MATRIX-SNAPSHOT-REF", "DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION"], outputFieldIds: ["DGV-DELCASE-F-STATUS", "DGV-DELCASE-F-VERSION"], operationKind: "UPDATE", transition: { from: "EXECUTING", to: "FAILED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "the pinned matrix snapshot records unresolved failed or frozen object decisions", "a school cannot hide or overwrite a deletion failure"), pageId: deletionPageId, risk: RISK.HIGH, relatedStateGuards: [{ refFieldId: "DGV-DELCASE-F-MATRIX-SNAPSHOT-REF", versionFieldId: "DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION", targetObjectId: deletionMatrix.id, requiredState: "BLOCKED" }] }),
  ];
  const decisionPermissions = allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "platform governance acts on one authorized object decision inside the deletion case", "a school cannot unilaterally decide platform identity deletion effects");
  const deletionDecisionActions = [
    actionFact({ id: "DGV-ACT-REGISTER-STUDENT-DELETION-DECISION", label: "Register One Inventory-bound Object-level Student Deletion Decision", targetObjectId: deletionDecision.id, inputFieldIds: ["DGV-DELROW-F-DELETION-CASE-REF", "DGV-DELROW-F-DELETION-CASE-VERSION", "DGV-DELROW-F-INVENTORY-REF", "DGV-DELROW-F-INVENTORY-VERSION", "DGV-DELROW-F-INVENTORY-ITEM-ID", "DGV-DELROW-F-INVENTORY-ITEM-DIGEST", "DGV-DELROW-F-SOURCE-OBJECT-ID", "DGV-DELROW-F-SOURCE-OBJECT-VERSION", "DGV-DELROW-F-SOURCE-OBJECT-CATEGORY", "DGV-DELROW-F-LEGAL-BASIS", "DGV-DELROW-F-DISPUTE-BASIS", "DGV-DELROW-F-HIGH-IMPACT-AUTHORIZATION-ID", "DGV-DELROW-F-GOVERNANCE-ACTION"], outputFieldIds: ["DGV-DELROW-F-ID", "DGV-DELROW-F-EXECUTION-STATUS", "DGV-DELROW-F-VERSION"], operationKind: "CREATE", successState: "PENDING", permissions: decisionPermissions, pageId: deletionPageId, risk: RISK.HIGH, failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT", "INVENTORY_ITEM_MISMATCH"], boundaryResultCodes: ["INVENTORY_ITEM_MISMATCH"], failurePredicates: { INVENTORY_ITEM_MISMATCH: "the source object ID category version or item digest does not exactly match one item in the pinned inventory snapshot" }, relatedStateGuards: [{ refFieldId: "DGV-DELROW-F-DELETION-CASE-REF", versionFieldId: "DGV-DELROW-F-DELETION-CASE-VERSION", targetObjectId: deletionCase.id, requiredState: "REQUESTED" }, { refFieldId: "DGV-DELROW-F-INVENTORY-REF", versionFieldId: "DGV-DELROW-F-INVENTORY-VERSION", targetObjectId: deletionInventory.id, requiredState: "FROZEN" }] }),
    actionFact({ id: "DGV-ACT-AUTHORIZE-STUDENT-DELETION-DECISION", label: "Authorize One Object-level Student Deletion Decision", targetObjectId: deletionDecision.id, inputFieldIds: ["DGV-DELROW-F-ID", "DGV-DELROW-F-LEGAL-BASIS", "DGV-DELROW-F-DISPUTE-BASIS", "DGV-DELROW-F-HIGH-IMPACT-AUTHORIZATION-ID"], outputFieldIds: ["DGV-DELROW-F-EXECUTION-STATUS", "DGV-DELROW-F-VERSION"], operationKind: "UPDATE", transition: { from: "PENDING", to: "AUTHORIZED" }, permissions: decisionPermissions, pageId: deletionPageId, risk: RISK.HIGH }),
    actionFact({ id: "DGV-ACT-FREEZE-STUDENT-DELETION-DECISION", label: "Freeze One Object Decision during Dispute", targetObjectId: deletionDecision.id, inputFieldIds: ["DGV-DELROW-F-ID", "DGV-DELROW-F-DISPUTE-BASIS"], outputFieldIds: ["DGV-DELROW-F-EXECUTION-STATUS", "DGV-DELROW-F-VERSION"], operationKind: "UPDATE", transition: { from: ["PENDING", "AUTHORIZED"], to: "FROZEN" }, permissions: decisionPermissions, pageId: deletionPageId, risk: RISK.HIGH }),
    actionFact({ id: "DGV-ACT-EXECUTE-STUDENT-DELETION-DECISION", label: "Execute One Authorized Object Decision", targetObjectId: deletionDecision.id, inputFieldIds: ["DGV-DELROW-F-ID", "DGV-DELROW-F-GOVERNANCE-ACTION"], outputFieldIds: ["DGV-DELROW-F-EXECUTION-STATUS", "DGV-DELROW-F-EXECUTION-EVIDENCE", "DGV-DELROW-F-VERSION"], operationKind: "UPDATE", transition: { from: "AUTHORIZED", to: "EXECUTING" }, permissions: decisionPermissions, pageId: deletionPageId, risk: RISK.HIGH }),
    actionFact({ id: "DGV-ACT-COMPLETE-STUDENT-DELETION-DECISION", label: "Complete One Object Decision with Evidence", targetObjectId: deletionDecision.id, inputFieldIds: ["DGV-DELROW-F-ID", "DGV-DELROW-F-EXECUTION-EVIDENCE"], outputFieldIds: ["DGV-DELROW-F-EXECUTION-STATUS", "DGV-DELROW-F-EXECUTION-EVIDENCE", "DGV-DELROW-F-VERSION"], operationKind: "UPDATE", transition: { from: "EXECUTING", to: "COMPLETED" }, permissions: decisionPermissions, pageId: deletionPageId, risk: RISK.HIGH }),
    actionFact({ id: "DGV-ACT-FAIL-STUDENT-DELETION-DECISION", label: "Record One Failed Object Decision", targetObjectId: deletionDecision.id, inputFieldIds: ["DGV-DELROW-F-ID", "DGV-DELROW-F-EXECUTION-EVIDENCE"], outputFieldIds: ["DGV-DELROW-F-EXECUTION-STATUS", "DGV-DELROW-F-EXECUTION-EVIDENCE", "DGV-DELROW-F-VERSION"], operationKind: "UPDATE", transition: { from: "EXECUTING", to: "FAILED" }, permissions: decisionPermissions, pageId: deletionPageId, risk: RISK.HIGH }),
  ];
  const allActions = [
    ...catalogActions,
    ...governanceActions,
    ...deletionMatrixActions,
    ...deletionCaseActions,
    ...deletionDecisionActions,
  ];
  appendActionFacts(module, allActions);
  module.relationships.push(
    { id: "DGV-REL-GOVERNANCE-CASE-CATALOG", fromObjectId: governanceCase.id, toObjectId: catalog.id, type: "REFERENCES", cardinality: "MANY_TO_ONE", ownershipScope: "CROSS_MODULE_REFERENCE", onSourceInvalidation: "retain execution history and block any new action until a replacement catalog entry is active" },
    { id: "DGV-REL-DELETION-CASE-DECISION", fromObjectId: deletionDecision.id, toObjectId: deletionCase.id, type: "PART_OF", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_STUDENT", onSourceInvalidation: "freeze the object decision and prevent identity deletion release" },
    { id: "DGV-REL-DELETION-INVENTORY-CASE", fromObjectId: deletionInventory.id, toObjectId: deletionCase.id, type: "DERIVED_FROM", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_STUDENT", onSourceInvalidation: "retain the immutable inventory and block matrix release" },
    { id: "DGV-REL-DELETION-DECISION-INVENTORY", fromObjectId: deletionDecision.id, toObjectId: deletionInventory.id, type: "REFERENCES", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_STUDENT", onSourceInvalidation: "freeze the decision and require a replacement inventory-bound decision" },
    { id: "DGV-REL-DELETION-MATRIX-CASE", fromObjectId: deletionMatrix.id, toObjectId: deletionCase.id, type: "PART_OF", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_STUDENT", onSourceInvalidation: "block matrix execution and identity deletion release" },
    { id: "DGV-REL-DELETION-MATRIX-INVENTORY", fromObjectId: deletionMatrix.id, toObjectId: deletionInventory.id, type: "DERIVED_FROM", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_STUDENT", onSourceInvalidation: "block matrix execution when the pinned inventory cannot be verified" },
  );
  module.pages.push(
    page(catalogPageId, "Eight-axis Data Catalog", [catalog.id], catalogActions.map(({ action }) => action.id), catalog.fields.map(({ id }) => id)),
    page(governancePageId, "Distinct Data Governance Actions", [governanceCase.id, catalog.id], governanceActions.map(({ action }) => action.id), governanceCase.fields.map(({ id }) => id)),
    page(deletionPageId, "Student Object-level Deletion Matrix", [deletionCase.id, deletionInventory.id, deletionDecision.id, deletionMatrix.id], [...deletionMatrixActions, ...deletionCaseActions, ...deletionDecisionActions].map(({ action }) => action.id), [...deletionCase.fields, ...deletionInventory.fields, ...deletionDecision.fields, ...deletionMatrix.fields].map(({ id }) => id)),
  );
  module.governanceBaselineOwner = ownerContract("DGV-001", ["D047", "D048", "D049"]);
  return module;
}

function enhanceContentRightsModule(module) {
  const sourceGraph = domainObject({
    id: "CONTENT-OBJ-MATERIAL-SOURCE-GRAPH",
    label: "Material Source Dependency Graph",
    dataSubject: "MATERIAL_PROVENANCE",
    producerRef: "DUTY-SUBJECT-LEAD",
    ownerRef: "DUTY-SUBJECT-LEAD",
    states: ["ACTIVE", "INVALIDATED"],
    fields: [
      identityField("CONTENT-SOURCE-F-ID", "Material Source Graph ID"),
      field("CONTENT-SOURCE-F-ROOT-MATERIAL-ID", "Root Material ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      optionField("CONTENT-SOURCE-F-SOURCE-KIND", "Root Material Source Kind", "OPT-BL2-015", { mutability: "IMMUTABLE" }),
      field("CONTENT-SOURCE-F-DEPENDENCY-GRAPH", "Source Dependency Graph", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("CONTENT-SOURCE-F-DEPENDENCY-VERSIONS", "Pinned Dependency Versions", { dataType: "JSON", mutability: "IMMUTABLE" }),
      systemField("CONTENT-SOURCE-F-STATUS", "Source Graph Status"),
      versionField("CONTENT-SOURCE-F-VERSION", "Source Graph Version"),
    ],
  });
  const rightsSourceGraphRef = versionPinnedReference({
    id: "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF",
    label: "Pinned Material Source Graph",
    targetObjectId: sourceGraph.id,
    versionFieldId: "CONTENT-RIGHTS-F-SOURCE-GRAPH-VERSION",
    targetVersionFieldId: "CONTENT-SOURCE-F-VERSION",
    requiredActionIds: [
      "CONTENT-ACT-CREATE-MATERIAL-RIGHTS-BUNDLE",
      "CONTENT-ACT-ACTIVATE-MATERIAL-RIGHTS-BUNDLE",
    ],
    stateGuardPolicy: "ALWAYS_REQUIRED",
  });
  const rightsBundle = domainObject({
    id: "CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE",
    label: "Material Rights Bundle",
    dataSubject: "MATERIAL_RIGHTS_BUNDLE",
    producerRef: "DUTY-SUBJECT-LEAD",
    ownerRef: "DUTY-SUBJECT-LEAD",
    states: ["DRAFT", "ACTIVE", "REVOKED"],
    fields: [
      identityField("CONTENT-RIGHTS-F-ID", "Material Rights Bundle ID"),
      field("CONTENT-RIGHTS-F-MATERIAL-ID", "Material ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      rightsSourceGraphRef,
      systemField("CONTENT-RIGHTS-F-SOURCE-GRAPH-VERSION", "Pinned Material Source Graph Version", "INTEGER", { mutability: "IMMUTABLE" }),
      optionField("CONTENT-RIGHTS-F-RIGHTS-BASIS", "Rights Basis", "OPT-BL2-006", { mutability: "IMMUTABLE" }),
      field("CONTENT-RIGHTS-F-USE-SCOPE", "Permitted Use Scope", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("CONTENT-RIGHTS-F-ADAPTATION-SCOPE", "Permitted Adaptation Scope", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("CONTENT-RIGHTS-F-SHARING-SCOPE", "Permitted Sharing Scope", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("CONTENT-RIGHTS-F-STUDENT-PRIVACY", "Student Privacy Conditions", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("CONTENT-RIGHTS-F-EFFECTIVE-AT", "Rights Effective Time", { dataType: "DATETIME", mutability: "IMMUTABLE" }),
      field("CONTENT-RIGHTS-F-EXPIRES-AT", "Rights Expiry Time", { dataType: "DATETIME", required: false, mutability: "IMMUTABLE" }),
      systemField("CONTENT-RIGHTS-F-STATUS", "Rights Bundle Status"),
      versionField("CONTENT-RIGHTS-F-VERSION", "Rights Bundle Version"),
    ],
    lineageBindings: [lineage(
      "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF",
      "CONTENT-RIGHTS-F-SOURCE-GRAPH-VERSION",
      sourceGraph.id,
      "CONTENT-SOURCE-F-VERSION",
    )],
    overrides: { readMode: "AUTHORIZED" },
  });
  const scopeSourceGraphRef = versionPinnedReference({
    id: "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
    label: "Pinned Source Graph for Product Management Scope",
    targetObjectId: sourceGraph.id,
    versionFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION",
    targetVersionFieldId: "CONTENT-SOURCE-F-VERSION",
    requiredActionIds: [
      "CONTENT-ACT-CREATE-MATERIAL-MANAGEMENT-SCOPE",
      "CONTENT-ACT-ACTIVATE-SCHOOL-PRIVATE-MATERIAL",
      "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC",
      "CONTENT-ACT-RESOLVE-MATERIAL-RIGHTS",
    ],
    stateGuardPolicy: "ALWAYS_REQUIRED",
  });
  const scopeRightsBundleRef = versionPinnedReference({
    id: "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF",
    label: "Pinned Rights Bundle for Product Management Scope",
    targetObjectId: rightsBundle.id,
    versionFieldId: "CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION",
    targetVersionFieldId: "CONTENT-RIGHTS-F-VERSION",
    requiredActionIds: [
      "CONTENT-ACT-CREATE-MATERIAL-MANAGEMENT-SCOPE",
      "CONTENT-ACT-ACTIVATE-SCHOOL-PRIVATE-MATERIAL",
      "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC",
      "CONTENT-ACT-RESOLVE-MATERIAL-RIGHTS",
    ],
    stateGuardPolicy: "ALWAYS_REQUIRED",
  });
  const managementScope = domainObject({
    id: "CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE",
    label: "Material Product Management Scope",
    dataSubject: "MATERIAL_MANAGEMENT_SCOPE",
    producerRef: "DUTY-SUBJECT-LEAD",
    ownerRef: "DUTY-SUBJECT-LEAD",
    states: ["DRAFT", "ACTIVE", "REVOKED"],
    fields: [
      identityField("CONTENT-SCOPE-F-ID", "Material Management Scope ID"),
      field("CONTENT-SCOPE-F-MATERIAL-ID", "Material ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      scopeSourceGraphRef,
      systemField("CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION", "Pinned Source Graph Version", "INTEGER", { mutability: "IMMUTABLE" }),
      scopeRightsBundleRef,
      systemField("CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION", "Pinned Rights Bundle Version", "INTEGER", { mutability: "IMMUTABLE" }),
      optionField("CONTENT-SCOPE-F-SOURCE-KIND", "Material Source Kind", "OPT-BL2-015", { mutability: "IMMUTABLE" }),
      optionField("CONTENT-SCOPE-F-MANAGEMENT-SCOPE", "Product Management Scope", "OPT-BL2-005", { mutability: "IMMUTABLE" }),
      field("CONTENT-SCOPE-F-MANAGER-REF", "Product Manager Reference", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("CONTENT-SCOPE-F-SCHOOL-AUTHORIZATION", "School Authorization Evidence", { dataType: "JSON", required: false, mutability: "IMMUTABLE" }),
      field("CONTENT-SCOPE-F-PLATFORM-REVIEW", "Independent Platform Review Evidence", { dataType: "JSON", required: false, mutability: "IMMUTABLE" }),
      systemField("CONTENT-SCOPE-F-STATUS", "Management Scope Status"),
      versionField("CONTENT-SCOPE-F-VERSION", "Management Scope Version"),
    ],
    lineageBindings: [
      lineage(
        "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
        "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION",
        sourceGraph.id,
        "CONTENT-SOURCE-F-VERSION",
      ),
      lineage(
        "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF",
        "CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION",
        rightsBundle.id,
        "CONTENT-RIGHTS-F-VERSION",
      ),
    ],
    overrides: {
      ownershipInterpretation: "ownerRef identifies product stewardship only and never derives legal rights",
    },
  });
  const publicReviewSourceGraphRef = versionPinnedReference({
    id: "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-REF",
    label: "Pinned Source Graph for Platform-public Review",
    targetObjectId: sourceGraph.id,
    versionFieldId: "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-VERSION",
    targetVersionFieldId: "CONTENT-SOURCE-F-VERSION",
    requiredActionIds: [
      "CONTENT-ACT-REQUEST-PLATFORM-PUBLIC-REVIEW",
      "CONTENT-ACT-APPROVE-PLATFORM-PUBLIC-REVIEW",
    ],
    stateGuardPolicy: "ALWAYS_REQUIRED",
  });
  const publicReviewRightsRef = versionPinnedReference({
    id: "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-REF",
    label: "Pinned Rights Bundle for Platform-public Review",
    targetObjectId: rightsBundle.id,
    versionFieldId: "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-VERSION",
    targetVersionFieldId: "CONTENT-RIGHTS-F-VERSION",
    requiredActionIds: [
      "CONTENT-ACT-REQUEST-PLATFORM-PUBLIC-REVIEW",
      "CONTENT-ACT-APPROVE-PLATFORM-PUBLIC-REVIEW",
    ],
    stateGuardPolicy: "ALWAYS_REQUIRED",
  });
  const publicReview = domainObject({
    id: "CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW",
    label: "Independent Platform-public Material Review",
    dataSubject: "MATERIAL_PLATFORM_PUBLIC_REVIEW",
    producerRef: "DUTY-SUBJECT-LEAD",
    ownerRef: "ROLE-PLATFORM-GOVERNANCE",
    confirmerRef: "ROLE-PLATFORM-GOVERNANCE",
    stewardRef: "ROLE-PLATFORM-GOVERNANCE",
    lifecyclePolicyId: "LIFE-009",
    sensitivityId: "S3",
    states: ["REQUESTED", "APPROVED", "REJECTED", "EXPIRED"],
    fields: [
      identityField("CONTENT-PUBLICREVIEW-F-ID", "Platform-public Review ID"),
      field("CONTENT-PUBLICREVIEW-F-MATERIAL-ID", "Reviewed Material ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      publicReviewSourceGraphRef,
      systemField("CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-VERSION", "Pinned Reviewed Source Graph Version", "INTEGER", { mutability: "IMMUTABLE" }),
      publicReviewRightsRef,
      systemField("CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-VERSION", "Pinned Reviewed Rights Bundle Version", "INTEGER", { mutability: "IMMUTABLE" }),
      field("CONTENT-PUBLICREVIEW-F-SOURCE-RIGHTS-EVIDENCE", "Source-rights Review Evidence", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("CONTENT-PUBLICREVIEW-F-PRIVACY-EVIDENCE", "Privacy Review Evidence", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("CONTENT-PUBLICREVIEW-F-CONTENT-QUALITY-EVIDENCE", "Content-quality Review Evidence", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("CONTENT-PUBLICREVIEW-F-PLATFORM-AUTHORIZATION-EVIDENCE", "Platform Authorization Evidence", { dataType: "JSON", mutability: "IMMUTABLE" }),
      systemField("CONTENT-PUBLICREVIEW-F-STATUS", "Platform-public Review Status"),
      versionField("CONTENT-PUBLICREVIEW-F-VERSION", "Platform-public Review Version"),
    ],
    lineageBindings: [
      lineage(
        "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-REF",
        "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-VERSION",
        sourceGraph.id,
        "CONTENT-SOURCE-F-VERSION",
      ),
      lineage(
        "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-REF",
        "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-VERSION",
        rightsBundle.id,
        "CONTENT-RIGHTS-F-VERSION",
      ),
    ],
    overrides: {
      requiredReviewEvidenceFieldIds: [
        "CONTENT-PUBLICREVIEW-F-SOURCE-RIGHTS-EVIDENCE",
        "CONTENT-PUBLICREVIEW-F-PRIVACY-EVIDENCE",
        "CONTENT-PUBLICREVIEW-F-CONTENT-QUALITY-EVIDENCE",
        "CONTENT-PUBLICREVIEW-F-PLATFORM-AUTHORIZATION-EVIDENCE",
      ],
    },
  });
  const scopePublicReviewRef = versionPinnedReference({
    id: "CONTENT-SCOPE-F-PLATFORM-REVIEW-REF",
    label: "Pinned Approved Platform-public Review",
    targetObjectId: publicReview.id,
    versionFieldId: "CONTENT-SCOPE-F-PLATFORM-REVIEW-VERSION",
    targetVersionFieldId: "CONTENT-PUBLICREVIEW-F-VERSION",
    requiredActionIds: ["CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC"],
    stateGuardPolicy: "ALWAYS_REQUIRED",
    overrides: {
      required: {
        description: "required only for platform-public promotion",
        whenStates: ["ACTIVE"],
        whenActionIds: ["CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC"],
      },
    },
  });
  addFields(managementScope, [
    scopePublicReviewRef,
    systemField("CONTENT-SCOPE-F-PLATFORM-REVIEW-VERSION", "Pinned Approved Platform-public Review Version", "INTEGER", {
      required: {
        description: "required only for platform-public promotion",
        whenStates: ["ACTIVE"],
        whenActionIds: ["CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC"],
      },
    }),
  ]);
  managementScope.lineageBindings.push(lineage(
    "CONTENT-SCOPE-F-PLATFORM-REVIEW-REF",
    "CONTENT-SCOPE-F-PLATFORM-REVIEW-VERSION",
    publicReview.id,
    "CONTENT-PUBLICREVIEW-F-VERSION",
  ));
  const sampleAuthorization = domainObject({
    id: "CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION",
    label: "Student Work Sample Authorization",
    dataSubject: "STUDENT_WORK_SAMPLE_AUTHORIZATION",
    producerRef: "DUTY-SUBJECT-TEACHER",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "ROLE-PLATFORM-GOVERNANCE",
    stewardRef: "ROLE-SCHOOL-ADMIN",
    lifecyclePolicyId: "LIFE-009",
    sensitivityId: "S4",
    states: ["REQUESTED", "AUTHORIZED", "WITHDRAWN", "DENIED", "EXPIRED"],
    fields: [
      identityField("CONTENT-SAMPLEAUTH-F-ID", "Student Sample Authorization ID"),
      field("CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-ID", "Original Student Work ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-VERSION", "Original Student Work Version", { dataType: "INTEGER", mutability: "IMMUTABLE" }),
      field("CONTENT-SAMPLEAUTH-F-STUDENT-AUTHORIZATION", "Student Authorization Evidence", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("CONTENT-SAMPLEAUTH-F-GUARDIAN-AUTHORIZATION", "Verified Guardian Authorization Evidence", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("CONTENT-SAMPLEAUTH-F-LIMITED-PURPOSE", "Authorized Teaching Sample Purpose", { dataType: "JSON", mutability: "IMMUTABLE" }),
      field("CONTENT-SAMPLEAUTH-F-EXPIRES-AT", "Authorization Expiry Time", { dataType: "DATETIME", mutability: "IMMUTABLE" }),
      systemField("CONTENT-SAMPLEAUTH-F-STATUS", "Student Sample Authorization Status"),
      versionField("CONTENT-SAMPLEAUTH-F-VERSION", "Student Sample Authorization Version"),
    ],
  });
  const sampleAuthorizationRef = versionPinnedReference({
    id: "CONTENT-SAMPLE-F-AUTHORIZATION-REF",
    label: "Pinned Student Sample Authorization",
    targetObjectId: sampleAuthorization.id,
    versionFieldId: "CONTENT-SAMPLE-F-AUTHORIZATION-VERSION",
    targetVersionFieldId: "CONTENT-SAMPLEAUTH-F-VERSION",
    requiredActionIds: [
      "CONTENT-ACT-CREATE-STUDENT-SAMPLE-COPY",
      "CONTENT-ACT-ACTIVATE-STUDENT-SAMPLE-COPY",
      "CONTENT-ACT-REMOVE-STUDENT-SAMPLE-COPY",
    ],
    stateGuardPolicy: "ALWAYS_REQUIRED",
  });
  const sampleCopy = domainObject({
    id: "CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY",
    label: "Deidentified Student Work Sample Copy",
    dataSubject: "STUDENT_WORK_SAMPLE_COPY",
    producerRef: "DUTY-SUBJECT-TEACHER",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "DUTY-SUBJECT-LEAD",
    stewardRef: "ROLE-SCHOOL-ADMIN",
    lifecyclePolicyId: "LIFE-009",
    sensitivityId: "S3",
    states: ["DRAFT", "ACTIVE", "REMOVED"],
    fields: [
      identityField("CONTENT-SAMPLE-F-ID", "Student Work Sample Copy ID"),
      sampleAuthorizationRef,
      systemField("CONTENT-SAMPLE-F-AUTHORIZATION-VERSION", "Pinned Sample Authorization Version", "INTEGER", { mutability: "IMMUTABLE" }),
      field("CONTENT-SAMPLE-F-ORIGINAL-WORK-ID", "Original Student Work ID", { dataType: "ID", mutability: "IMMUTABLE" }),
      field("CONTENT-SAMPLE-F-ORIGINAL-WORK-VERSION", "Original Student Work Version", { dataType: "INTEGER", mutability: "IMMUTABLE" }),
      field("CONTENT-SAMPLE-F-DEIDENTIFIED-COPY-REF", "Independent Deidentified Copy Reference", { dataType: "ID", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
      field("CONTENT-SAMPLE-F-LIMITED-PURPOSE", "Copy-specific Limited Purpose", { dataType: "JSON", mutability: "IMMUTABLE" }),
      optionField("CONTENT-SAMPLE-F-MANAGEMENT-SCOPE", "Sample Copy Management Scope", "OPT-BL2-005", { mutability: "IMMUTABLE", validation: "must be SCHOOL_PRIVATE for phases one and two" }),
      systemField("CONTENT-SAMPLE-F-REMOVAL-EVIDENCE", "Product-controlled Copy Removal Evidence", "JSON", { required: false }),
      systemField("CONTENT-SAMPLE-F-STATUS", "Student Sample Copy Status"),
      versionField("CONTENT-SAMPLE-F-VERSION", "Student Sample Copy Version"),
    ],
    lineageBindings: [lineage(
      "CONTENT-SAMPLE-F-AUTHORIZATION-REF",
      "CONTENT-SAMPLE-F-AUTHORIZATION-VERSION",
      sampleAuthorization.id,
      "CONTENT-SAMPLEAUTH-F-VERSION",
    )],
    overrides: {
      sampleCopyContract: {
        authorizationObjectId: sampleAuthorization.id,
        independentCopyRequired: true,
        deidentificationRequired: true,
        purposeLimitRequired: true,
        withdrawalActionId: "CONTENT-ACT-WITHDRAW-STUDENT-SAMPLE-AUTHORIZATION",
        removalActionId: "CONTENT-ACT-REMOVE-STUDENT-SAMPLE-COPY",
      },
    },
  });
  module.objects.push(
    sourceGraph,
    rightsBundle,
    managementScope,
    publicReview,
    sampleAuthorization,
    sampleCopy,
  );

  const rightsPageId = "CONTENT-PAGE-MATERIAL-RIGHTS";
  const samplePageId = "CONTENT-PAGE-STUDENT-SAMPLE";
  const leadPermissions = [
    { effect: "ALLOW", dutyRef: "DUTY-SUBJECT-LEAD", condition: "the subject lead acts inside the assigned subject and school material scope" },
    { effect: "DENY", roleRef: "ROLE-STUDENT", condition: "a student cannot manage teaching material rights" },
    { effect: "DENY", roleRef: "ROLE-PLATFORM-OPS", condition: "platform operations has no default school material access" },
  ];
  const rightsActions = [
    actionFact({ id: "CONTENT-ACT-REGISTER-MATERIAL-SOURCE-GRAPH", label: "Register a Version-pinned Material Source Dependency Graph", targetObjectId: sourceGraph.id, inputFieldIds: ["CONTENT-SOURCE-F-ROOT-MATERIAL-ID", "CONTENT-SOURCE-F-SOURCE-KIND", "CONTENT-SOURCE-F-DEPENDENCY-GRAPH", "CONTENT-SOURCE-F-DEPENDENCY-VERSIONS"], outputFieldIds: ["CONTENT-SOURCE-F-ID", "CONTENT-SOURCE-F-STATUS", "CONTENT-SOURCE-F-VERSION"], operationKind: "CREATE", successState: "ACTIVE", permissions: leadPermissions, pageId: rightsPageId, risk: RISK.HIGH }),
    actionFact({ id: "CONTENT-ACT-INVALIDATE-MATERIAL-SOURCE-GRAPH", label: "Invalidate a Material Source Graph after Source Withdrawal", targetObjectId: sourceGraph.id, inputFieldIds: ["CONTENT-SOURCE-F-ID", "CONTENT-SOURCE-F-DEPENDENCY-VERSIONS"], outputFieldIds: ["CONTENT-SOURCE-F-STATUS", "CONTENT-SOURCE-F-VERSION"], operationKind: "UPDATE", transition: { from: "ACTIVE", to: "INVALIDATED" }, permissions: leadPermissions, pageId: rightsPageId, risk: RISK.HIGH }),
    actionFact({ id: "CONTENT-ACT-CREATE-MATERIAL-RIGHTS-BUNDLE", label: "Create a Source-bound Material Rights Bundle", targetObjectId: rightsBundle.id, inputFieldIds: ["CONTENT-RIGHTS-F-MATERIAL-ID", "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF", "CONTENT-RIGHTS-F-SOURCE-GRAPH-VERSION", "CONTENT-RIGHTS-F-RIGHTS-BASIS", "CONTENT-RIGHTS-F-USE-SCOPE", "CONTENT-RIGHTS-F-ADAPTATION-SCOPE", "CONTENT-RIGHTS-F-SHARING-SCOPE", "CONTENT-RIGHTS-F-STUDENT-PRIVACY", "CONTENT-RIGHTS-F-EFFECTIVE-AT", "CONTENT-RIGHTS-F-EXPIRES-AT"], outputFieldIds: ["CONTENT-RIGHTS-F-ID", "CONTENT-RIGHTS-F-STATUS", "CONTENT-RIGHTS-F-VERSION"], operationKind: "CREATE", successState: "DRAFT", permissions: leadPermissions, pageId: rightsPageId, risk: RISK.HIGH, failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT", "SOURCE_GRAPH_INACTIVE", "MATERIAL_ID_MISMATCH"], boundaryResultCodes: ["SOURCE_GRAPH_INACTIVE", "MATERIAL_ID_MISMATCH"], failurePredicates: { SOURCE_GRAPH_INACTIVE: "the pinned source graph is not ACTIVE", MATERIAL_ID_MISMATCH: "CONTENT-RIGHTS-F-MATERIAL-ID differs from the pinned source graph root material ID" }, relatedStateGuards: [{ refFieldId: "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF", versionFieldId: "CONTENT-RIGHTS-F-SOURCE-GRAPH-VERSION", targetObjectId: sourceGraph.id, requiredState: "ACTIVE" }], extras: { materialIdentityBindings: [["CONTENT-RIGHTS-F-MATERIAL-ID", "CONTENT-SOURCE-F-ROOT-MATERIAL-ID"]] } }),
    actionFact({ id: "CONTENT-ACT-ACTIVATE-MATERIAL-RIGHTS-BUNDLE", label: "Activate a Complete Source-bound Material Rights Bundle", targetObjectId: rightsBundle.id, inputFieldIds: ["CONTENT-RIGHTS-F-ID", "CONTENT-RIGHTS-F-MATERIAL-ID", "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF", "CONTENT-RIGHTS-F-SOURCE-GRAPH-VERSION", "CONTENT-RIGHTS-F-RIGHTS-BASIS", "CONTENT-RIGHTS-F-USE-SCOPE", "CONTENT-RIGHTS-F-ADAPTATION-SCOPE", "CONTENT-RIGHTS-F-SHARING-SCOPE", "CONTENT-RIGHTS-F-STUDENT-PRIVACY"], outputFieldIds: ["CONTENT-RIGHTS-F-STATUS", "CONTENT-RIGHTS-F-VERSION"], operationKind: "UPDATE", transition: { from: "DRAFT", to: "ACTIVE" }, permissions: leadPermissions, pageId: rightsPageId, risk: RISK.HIGH, failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT", "SOURCE_GRAPH_INACTIVE", "MATERIAL_ID_MISMATCH"], boundaryResultCodes: ["SOURCE_GRAPH_INACTIVE", "MATERIAL_ID_MISMATCH"], failurePredicates: { SOURCE_GRAPH_INACTIVE: "the pinned source graph is not ACTIVE", MATERIAL_ID_MISMATCH: "CONTENT-RIGHTS-F-MATERIAL-ID differs from the pinned source graph root material ID" }, relatedStateGuards: [{ refFieldId: "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF", versionFieldId: "CONTENT-RIGHTS-F-SOURCE-GRAPH-VERSION", targetObjectId: sourceGraph.id, requiredState: "ACTIVE" }], extras: { materialIdentityBindings: [["CONTENT-RIGHTS-F-MATERIAL-ID", "CONTENT-SOURCE-F-ROOT-MATERIAL-ID"]] } }),
    actionFact({ id: "CONTENT-ACT-REVOKE-MATERIAL-RIGHTS-BUNDLE", label: "Revoke a Material Rights Bundle", targetObjectId: rightsBundle.id, inputFieldIds: ["CONTENT-RIGHTS-F-ID", "CONTENT-RIGHTS-F-RIGHTS-BASIS"], outputFieldIds: ["CONTENT-RIGHTS-F-STATUS", "CONTENT-RIGHTS-F-VERSION"], operationKind: "UPDATE", transition: { from: "ACTIVE", to: "REVOKED" }, permissions: leadPermissions, pageId: rightsPageId, risk: RISK.HIGH }),
    actionFact({ id: "CONTENT-ACT-CREATE-MATERIAL-MANAGEMENT-SCOPE", label: "Create a Source-and-rights-bound Product Management Scope", targetObjectId: managementScope.id, inputFieldIds: ["CONTENT-SCOPE-F-MATERIAL-ID", "CONTENT-SCOPE-F-SOURCE-GRAPH-REF", "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION", "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF", "CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION", "CONTENT-SCOPE-F-SOURCE-KIND", "CONTENT-SCOPE-F-MANAGEMENT-SCOPE", "CONTENT-SCOPE-F-MANAGER-REF", "CONTENT-SCOPE-F-SCHOOL-AUTHORIZATION", "CONTENT-SCOPE-F-PLATFORM-REVIEW"], outputFieldIds: ["CONTENT-SCOPE-F-ID", "CONTENT-SCOPE-F-STATUS", "CONTENT-SCOPE-F-VERSION"], operationKind: "CREATE", successState: "DRAFT", permissions: leadPermissions, pageId: rightsPageId, risk: RISK.HIGH, failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT", "SOURCE_RIGHTS_INACTIVE", "MATERIAL_CHAIN_MISMATCH"], boundaryResultCodes: ["SOURCE_RIGHTS_INACTIVE", "MATERIAL_CHAIN_MISMATCH"], failurePredicates: { SOURCE_RIGHTS_INACTIVE: "the pinned source graph or rights bundle is not ACTIVE", MATERIAL_CHAIN_MISMATCH: "the scope material source graph rights bundle material IDs or source kind are not one exact chain" }, relatedStateGuards: [{ refFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-REF", versionFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION", targetObjectId: sourceGraph.id, requiredState: "ACTIVE" }, { refFieldId: "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF", versionFieldId: "CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION", targetObjectId: rightsBundle.id, requiredState: "ACTIVE" }], extras: { materialIdentityBindings: [["CONTENT-SCOPE-F-MATERIAL-ID", "CONTENT-SOURCE-F-ROOT-MATERIAL-ID"], ["CONTENT-SCOPE-F-MATERIAL-ID", "CONTENT-RIGHTS-F-MATERIAL-ID"]], sourceGraphBinding: ["CONTENT-SCOPE-F-SOURCE-GRAPH-REF", "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF"] } }),
    actionFact({ id: "CONTENT-ACT-ACTIVATE-SCHOOL-PRIVATE-MATERIAL", label: "Activate a Source-and-rights-bound School-private Material Scope", targetObjectId: managementScope.id, inputFieldIds: ["CONTENT-SCOPE-F-ID", "CONTENT-SCOPE-F-MATERIAL-ID", "CONTENT-SCOPE-F-SOURCE-GRAPH-REF", "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION", "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF", "CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION", "CONTENT-SCOPE-F-SOURCE-KIND", "CONTENT-SCOPE-F-MANAGEMENT-SCOPE", "CONTENT-SCOPE-F-SCHOOL-AUTHORIZATION"], outputFieldIds: ["CONTENT-SCOPE-F-STATUS", "CONTENT-SCOPE-F-VERSION"], operationKind: "UPDATE", transition: { from: "DRAFT", to: "ACTIVE" }, permissions: leadPermissions, pageId: rightsPageId, risk: RISK.HIGH, failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT", "SOURCE_RIGHTS_INACTIVE", "MATERIAL_CHAIN_MISMATCH", "PRIVACY_REVIEW_FAILED", "QUALITY_REVIEW_FAILED"], boundaryResultCodes: ["SOURCE_RIGHTS_INACTIVE", "MATERIAL_CHAIN_MISMATCH", "PRIVACY_REVIEW_FAILED", "QUALITY_REVIEW_FAILED"], failurePredicates: { SOURCE_RIGHTS_INACTIVE: "the pinned source graph or rights bundle is not ACTIVE", MATERIAL_CHAIN_MISMATCH: "the scope material source graph rights bundle material IDs or source kind are not one exact chain" }, relatedStateGuards: [{ refFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-REF", versionFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION", targetObjectId: sourceGraph.id, requiredState: "ACTIVE" }, { refFieldId: "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF", versionFieldId: "CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION", targetObjectId: rightsBundle.id, requiredState: "ACTIVE" }], extras: { schoolPrivateActivationGuard: { requiredReviews: ["SOURCE_RIGHTS", "PRIVACY", "CONTENT_QUALITY", "SCHOOL_AUTHORIZATION"] }, materialIdentityBindings: [["CONTENT-SCOPE-F-MATERIAL-ID", "CONTENT-SOURCE-F-ROOT-MATERIAL-ID"], ["CONTENT-SCOPE-F-MATERIAL-ID", "CONTENT-RIGHTS-F-MATERIAL-ID"]], sourceGraphBinding: ["CONTENT-SCOPE-F-SOURCE-GRAPH-REF", "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF"] } }),
    actionFact({
      id: "CONTENT-ACT-REQUEST-PLATFORM-PUBLIC-REVIEW",
      label: "Request an Independent Platform-public Material Review",
      targetObjectId: publicReview.id,
      inputFieldIds: [
        "CONTENT-PUBLICREVIEW-F-MATERIAL-ID",
        "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-REF",
        "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-VERSION",
        "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-REF",
        "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-VERSION",
        ...publicReview.requiredReviewEvidenceFieldIds,
      ],
      outputFieldIds: [
        "CONTENT-PUBLICREVIEW-F-ID",
        "CONTENT-PUBLICREVIEW-F-STATUS",
        "CONTENT-PUBLICREVIEW-F-VERSION",
      ],
      operationKind: "CREATE",
      successState: "REQUESTED",
      permissions: leadPermissions,
      pageId: rightsPageId,
      risk: RISK.HIGH,
      failureResults: [
        "PERMISSION_DENIED",
        "VALIDATION_FAILED",
        "VERSION_CONFLICT",
        "SOURCE_RIGHTS_INACTIVE",
        "MATERIAL_CHAIN_MISMATCH",
      ],
      boundaryResultCodes: ["SOURCE_RIGHTS_INACTIVE", "MATERIAL_CHAIN_MISMATCH"],
      failurePredicates: {
        SOURCE_RIGHTS_INACTIVE: "the pinned source graph or rights bundle is not ACTIVE",
        MATERIAL_CHAIN_MISMATCH: "the review material source graph and rights bundle do not describe one exact material chain",
      },
      relatedStateGuards: [
        { refFieldId: "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-REF", versionFieldId: "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-VERSION", targetObjectId: sourceGraph.id, requiredState: "ACTIVE" },
        { refFieldId: "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-REF", versionFieldId: "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-VERSION", targetObjectId: rightsBundle.id, requiredState: "ACTIVE" },
      ],
      extras: {
        materialIdentityBindings: [
          ["CONTENT-PUBLICREVIEW-F-MATERIAL-ID", "CONTENT-SOURCE-F-ROOT-MATERIAL-ID"],
          ["CONTENT-PUBLICREVIEW-F-MATERIAL-ID", "CONTENT-RIGHTS-F-MATERIAL-ID"],
        ],
        sourceGraphBinding: [
          "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-REF",
          "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF",
        ],
      },
    }),
    actionFact({
      id: "CONTENT-ACT-APPROVE-PLATFORM-PUBLIC-REVIEW",
      label: "Approve a Complete Independent Platform-public Review",
      targetObjectId: publicReview.id,
      inputFieldIds: [
        "CONTENT-PUBLICREVIEW-F-ID",
        "CONTENT-PUBLICREVIEW-F-MATERIAL-ID",
        "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-REF",
        "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-VERSION",
        "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-REF",
        "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-VERSION",
        ...publicReview.requiredReviewEvidenceFieldIds,
      ],
      outputFieldIds: ["CONTENT-PUBLICREVIEW-F-STATUS", "CONTENT-PUBLICREVIEW-F-VERSION"],
      operationKind: "UPDATE",
      transition: { from: "REQUESTED", to: "APPROVED" },
      permissions: allowDeny(
        "ROLE-PLATFORM-GOVERNANCE",
        "ROLE-SCHOOL-ADMIN",
        "all four review evidence domains pass for the exact pinned material chain",
        "a school cannot self-approve platform-public promotion",
      ),
      pageId: rightsPageId,
      risk: RISK.HIGH,
      failureResults: [
        "PERMISSION_DENIED",
        "VALIDATION_FAILED",
        "VERSION_CONFLICT",
        "SOURCE_RIGHTS_INACTIVE",
        "MATERIAL_CHAIN_MISMATCH",
        "PRIVACY_REVIEW_FAILED",
        "QUALITY_REVIEW_FAILED",
      ],
      boundaryResultCodes: [
        "SOURCE_RIGHTS_INACTIVE",
        "MATERIAL_CHAIN_MISMATCH",
        "PRIVACY_REVIEW_FAILED",
        "QUALITY_REVIEW_FAILED",
      ],
      failurePredicates: {
        SOURCE_RIGHTS_INACTIVE: "the pinned source graph or rights bundle is not ACTIVE",
        MATERIAL_CHAIN_MISMATCH: "the review material source graph and rights bundle do not describe one exact material chain",
        PRIVACY_REVIEW_FAILED: "the privacy evidence does not pass",
        QUALITY_REVIEW_FAILED: "the content-quality evidence does not pass",
      },
      relatedStateGuards: [
        { refFieldId: "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-REF", versionFieldId: "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-VERSION", targetObjectId: sourceGraph.id, requiredState: "ACTIVE" },
        { refFieldId: "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-REF", versionFieldId: "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-VERSION", targetObjectId: rightsBundle.id, requiredState: "ACTIVE" },
      ],
      extras: {
        requiredReviewEvidenceFieldIds: publicReview.requiredReviewEvidenceFieldIds,
        materialIdentityBindings: [
          ["CONTENT-PUBLICREVIEW-F-MATERIAL-ID", "CONTENT-SOURCE-F-ROOT-MATERIAL-ID"],
          ["CONTENT-PUBLICREVIEW-F-MATERIAL-ID", "CONTENT-RIGHTS-F-MATERIAL-ID"],
        ],
        sourceGraphBinding: [
          "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-REF",
          "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF",
        ],
      },
    }),
    actionFact({ id: "CONTENT-ACT-REJECT-PLATFORM-PUBLIC-REVIEW", label: "Reject an Incomplete Platform-public Review", targetObjectId: publicReview.id, inputFieldIds: ["CONTENT-PUBLICREVIEW-F-ID", "CONTENT-PUBLICREVIEW-F-PLATFORM-AUTHORIZATION-EVIDENCE"], outputFieldIds: ["CONTENT-PUBLICREVIEW-F-STATUS", "CONTENT-PUBLICREVIEW-F-VERSION"], operationKind: "UPDATE", transition: { from: "REQUESTED", to: "REJECTED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "one or more independent review domains failed", "a school cannot determine platform-public review"), pageId: rightsPageId, risk: RISK.HIGH }),
    actionFact({ id: "CONTENT-ACT-EXPIRE-PLATFORM-PUBLIC-REVIEW", label: "Expire a Stale Platform-public Review", targetObjectId: publicReview.id, inputFieldIds: ["CONTENT-PUBLICREVIEW-F-ID"], outputFieldIds: ["CONTENT-PUBLICREVIEW-F-STATUS", "CONTENT-PUBLICREVIEW-F-VERSION"], operationKind: "UPDATE", transition: { from: "APPROVED", to: "EXPIRED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "a source rights privacy or content version changed after approval", "a school cannot extend a stale platform-public review"), pageId: rightsPageId, risk: RISK.HIGH }),
    actionFact({
      id: "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC",
      label: "Promote a Fully Bound Non-student Material to the Platform Public Layer",
      targetObjectId: managementScope.id,
      inputFieldIds: [
        "CONTENT-SCOPE-F-ID",
        "CONTENT-SCOPE-F-MATERIAL-ID",
        "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
        "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION",
        "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF",
        "CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION",
        "CONTENT-SCOPE-F-SOURCE-KIND",
        "CONTENT-SCOPE-F-MANAGEMENT-SCOPE",
        "CONTENT-SCOPE-F-PLATFORM-REVIEW-REF",
        "CONTENT-SCOPE-F-PLATFORM-REVIEW-VERSION",
      ],
      outputFieldIds: [
        "CONTENT-SCOPE-F-PLATFORM-REVIEW-REF",
        "CONTENT-SCOPE-F-PLATFORM-REVIEW-VERSION",
        "CONTENT-SCOPE-F-STATUS",
        "CONTENT-SCOPE-F-VERSION",
      ],
      operationKind: "UPDATE",
      transition: { from: "DRAFT", to: "ACTIVE" },
      permissions: allowDeny(
        "ROLE-PLATFORM-GOVERNANCE",
        "ROLE-SCHOOL-ADMIN",
        "independent platform governance verifies the exact source rights scope and approved review chain",
        "a school cannot unilaterally promote material to the platform public layer",
      ),
      pageId: rightsPageId,
      risk: RISK.HIGH,
      failureResults: [
        "PERMISSION_DENIED",
        "VALIDATION_FAILED",
        "VERSION_CONFLICT",
        "STUDENT_WORK_PUBLIC_PROHIBITED",
        "SOURCE_RIGHTS_INACTIVE",
        "PLATFORM_REVIEW_NOT_APPROVED",
        "MATERIAL_CHAIN_MISMATCH",
      ],
      boundaryResultCodes: [
        "STUDENT_WORK_PUBLIC_PROHIBITED",
        "SOURCE_RIGHTS_INACTIVE",
        "PLATFORM_REVIEW_NOT_APPROVED",
        "MATERIAL_CHAIN_MISMATCH",
      ],
      failurePredicates: {
        STUDENT_WORK_PUBLIC_PROHIBITED: "the pinned source graph source kind is STUDENT_WORK and the current product phase is PHASE-1 or PHASE-2",
        SOURCE_RIGHTS_INACTIVE: "the pinned source graph or rights bundle is not ACTIVE",
        PLATFORM_REVIEW_NOT_APPROVED: "the pinned platform-public review is absent stale or not APPROVED",
        MATERIAL_CHAIN_MISMATCH: "the scope review rights bundle source graph material IDs source graph refs or versions do not form one exact chain",
      },
      relatedStateGuards: [
        { refFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-REF", versionFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION", targetObjectId: sourceGraph.id, requiredState: "ACTIVE" },
        { refFieldId: "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF", versionFieldId: "CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION", targetObjectId: rightsBundle.id, requiredState: "ACTIVE" },
        { refFieldId: "CONTENT-SCOPE-F-PLATFORM-REVIEW-REF", versionFieldId: "CONTENT-SCOPE-F-PLATFORM-REVIEW-VERSION", targetObjectId: publicReview.id, requiredState: "APPROVED" },
      ],
      extras: {
        requiredManagementScopeCode: "PLATFORM_PUBLIC",
        publicPromotionGuard: {
          sourceKindFieldId: "CONTENT-SOURCE-F-SOURCE-KIND",
          sourceGraphRefFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
          rightsBundleRefFieldId: "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF",
          reviewRefFieldId: "CONTENT-SCOPE-F-PLATFORM-REVIEW-REF",
          prohibitedSourceKinds: ["STUDENT_WORK"],
          prohibitedPhaseIds: ["PHASE-1", "PHASE-2"],
          requiredReviewKinds: ["SOURCE_RIGHTS", "PRIVACY", "CONTENT_QUALITY", "PLATFORM_AUTHORIZATION"],
        },
        materialIdentityBindings: [
          ["CONTENT-SCOPE-F-MATERIAL-ID", "CONTENT-SOURCE-F-ROOT-MATERIAL-ID"],
          ["CONTENT-SCOPE-F-MATERIAL-ID", "CONTENT-RIGHTS-F-MATERIAL-ID"],
          ["CONTENT-SCOPE-F-MATERIAL-ID", "CONTENT-PUBLICREVIEW-F-MATERIAL-ID"],
        ],
        sourceGraphBindings: [
          ["CONTENT-SCOPE-F-SOURCE-GRAPH-REF", "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF"],
          ["CONTENT-SCOPE-F-SOURCE-GRAPH-REF", "CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-REF"],
        ],
        rightsBundleBinding: [
          "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF",
          "CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-REF",
        ],
      },
    }),
    actionFact({ id: "CONTENT-ACT-REVOKE-MATERIAL-MANAGEMENT-SCOPE", label: "Revoke a Material Product Management Scope", targetObjectId: managementScope.id, inputFieldIds: ["CONTENT-SCOPE-F-ID"], outputFieldIds: ["CONTENT-SCOPE-F-STATUS", "CONTENT-SCOPE-F-VERSION"], operationKind: "UPDATE", transition: { from: "ACTIVE", to: "REVOKED" }, permissions: leadPermissions, pageId: rightsPageId, risk: RISK.HIGH }),
    actionFact({
      id: "CONTENT-ACT-RESOLVE-MATERIAL-RIGHTS",
      label: "Resolve One Version-pinned Provenance Rights and Management Chain without Owner Inference",
      targetObjectId: managementScope.id,
      inputFieldIds: [
        "CONTENT-SCOPE-F-ID",
        "CONTENT-SCOPE-F-MATERIAL-ID",
        "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
        "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION",
        "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF",
        "CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION",
      ],
      outputFieldIds: [
        "CONTENT-SCOPE-F-ID",
        "CONTENT-SCOPE-F-MATERIAL-ID",
        "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
        "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION",
        "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF",
        "CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION",
        "CONTENT-SCOPE-F-SOURCE-KIND",
        "CONTENT-SCOPE-F-MANAGEMENT-SCOPE",
        "CONTENT-SCOPE-F-STATUS",
        "CONTENT-SCOPE-F-VERSION",
      ],
      operationKind: "READ",
      permissions: leadPermissions,
      pageId: rightsPageId,
      failureResults: [
        "PERMISSION_DENIED",
        "NOT_FOUND",
        "RIGHTS_BUNDLE_INCOMPLETE",
        "MATERIAL_CHAIN_MISMATCH",
      ],
      boundaryResultCodes: ["RIGHTS_BUNDLE_INCOMPLETE", "MATERIAL_CHAIN_MISMATCH"],
      failurePredicates: {
        RIGHTS_BUNDLE_INCOMPLETE: "the explicit source rights use adaptation sharing or student-privacy fields are incomplete",
        MATERIAL_CHAIN_MISMATCH: "the supplied material source graph rights bundle and management scope refs IDs or versions do not form one exact chain",
      },
      relatedStateGuards: [
        { refFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-REF", versionFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION", targetObjectId: sourceGraph.id, requiredState: "ACTIVE" },
        { refFieldId: "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF", versionFieldId: "CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION", targetObjectId: rightsBundle.id, requiredState: "ACTIVE" },
      ],
      extras: {
        rightsResolution: {
          sourceObjectIds: [sourceGraph.id, rightsBundle.id, managementScope.id],
          targetObjectId: managementScope.id,
          bindingFieldIds: [
            "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
            "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION",
            "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF",
            "CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION",
          ],
          resolvedMaterialIdentityFieldIds: [
            "CONTENT-SOURCE-F-ROOT-MATERIAL-ID",
            "CONTENT-RIGHTS-F-MATERIAL-ID",
            "CONTENT-SCOPE-F-MATERIAL-ID",
          ],
          sourceGraphConsistencyFieldIds: [
            "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF",
            "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
          ],
          exactVersionMatchRequired: true,
          ownerRefUsage: "PROHIBITED",
        },
      },
    }),
  ];
  const samplePermissions = [
    { effect: "ALLOW", dutyRef: "DUTY-SUBJECT-TEACHER", condition: "the subject teacher requests only a purpose-limited sample inside assigned teaching scope" },
    { effect: "DENY", roleRef: "ROLE-SCHOOL-ADMIN", condition: "school administration cannot synthesize student or guardian authorization" },
    { effect: "DENY", roleRef: "ROLE-PLATFORM-OPS", condition: "platform operations has no default student work access" },
  ];
  const sampleActions = [
    actionFact({ id: "CONTENT-ACT-REQUEST-STUDENT-SAMPLE-AUTHORIZATION", label: "Request Student and Guardian Authorization for a Sample Copy", targetObjectId: sampleAuthorization.id, inputFieldIds: ["CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-ID", "CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-VERSION", "CONTENT-SAMPLEAUTH-F-STUDENT-AUTHORIZATION", "CONTENT-SAMPLEAUTH-F-GUARDIAN-AUTHORIZATION", "CONTENT-SAMPLEAUTH-F-LIMITED-PURPOSE", "CONTENT-SAMPLEAUTH-F-EXPIRES-AT"], outputFieldIds: ["CONTENT-SAMPLEAUTH-F-ID", "CONTENT-SAMPLEAUTH-F-STATUS", "CONTENT-SAMPLEAUTH-F-VERSION"], operationKind: "CREATE", successState: "REQUESTED", permissions: samplePermissions, pageId: samplePageId, risk: RISK.HIGH }),
    actionFact({ id: "CONTENT-ACT-AUTHORIZE-STUDENT-SAMPLE", label: "Authorize a Student Work Sample Copy", targetObjectId: sampleAuthorization.id, inputFieldIds: ["CONTENT-SAMPLEAUTH-F-ID", "CONTENT-SAMPLEAUTH-F-STUDENT-AUTHORIZATION", "CONTENT-SAMPLEAUTH-F-GUARDIAN-AUTHORIZATION", "CONTENT-SAMPLEAUTH-F-LIMITED-PURPOSE"], outputFieldIds: ["CONTENT-SAMPLEAUTH-F-STATUS", "CONTENT-SAMPLEAUTH-F-VERSION"], operationKind: "UPDATE", transition: { from: "REQUESTED", to: "AUTHORIZED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "verified student and applicable guardian authorization covers the stated purpose", "a school cannot self-authorize reuse of student work"), pageId: samplePageId, risk: RISK.HIGH }),
    actionFact({ id: "CONTENT-ACT-DENY-STUDENT-SAMPLE-AUTHORIZATION", label: "Deny an Invalid Student Sample Authorization", targetObjectId: sampleAuthorization.id, inputFieldIds: ["CONTENT-SAMPLEAUTH-F-ID", "CONTENT-SAMPLEAUTH-F-STUDENT-AUTHORIZATION", "CONTENT-SAMPLEAUTH-F-GUARDIAN-AUTHORIZATION"], outputFieldIds: ["CONTENT-SAMPLEAUTH-F-STATUS", "CONTENT-SAMPLEAUTH-F-VERSION"], operationKind: "UPDATE", transition: { from: "REQUESTED", to: "DENIED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "authorization evidence is absent invalid or disputed", "a school cannot decide a high-impact student authorization"), pageId: samplePageId, risk: RISK.HIGH }),
    actionFact({ id: "CONTENT-ACT-WITHDRAW-STUDENT-SAMPLE-AUTHORIZATION", label: "Withdraw Future Student Sample Display and Reuse", targetObjectId: sampleAuthorization.id, inputFieldIds: ["CONTENT-SAMPLEAUTH-F-ID", "CONTENT-SAMPLEAUTH-F-STUDENT-AUTHORIZATION", "CONTENT-SAMPLEAUTH-F-GUARDIAN-AUTHORIZATION"], outputFieldIds: ["CONTENT-SAMPLEAUTH-F-STATUS", "CONTENT-SAMPLEAUTH-F-VERSION"], operationKind: "UPDATE", transition: { from: "AUTHORIZED", to: "WITHDRAWN" }, permissions: allowDeny("ROLE-STUDENT", "ROLE-SCHOOL-ADMIN", "the student or verified representative withdraws future use", "a school cannot prevent or synthesize withdrawal"), pageId: samplePageId, risk: RISK.HIGH }),
    actionFact({ id: "CONTENT-ACT-EXPIRE-STUDENT-SAMPLE-AUTHORIZATION", label: "Expire a Student Sample Authorization", targetObjectId: sampleAuthorization.id, inputFieldIds: ["CONTENT-SAMPLEAUTH-F-ID", "CONTENT-SAMPLEAUTH-F-EXPIRES-AT"], outputFieldIds: ["CONTENT-SAMPLEAUTH-F-STATUS", "CONTENT-SAMPLEAUTH-F-VERSION"], operationKind: "UPDATE", transition: { from: "AUTHORIZED", to: "EXPIRED" }, permissions: allowDeny("ROLE-PLATFORM-GOVERNANCE", "ROLE-SCHOOL-ADMIN", "the explicit authorization expiry has been reached", "a school cannot extend an expired authorization"), pageId: samplePageId, risk: RISK.HIGH }),
    actionFact({ id: "CONTENT-ACT-CREATE-STUDENT-SAMPLE-COPY", label: "Create an Independent Deidentified Student Sample Copy", targetObjectId: sampleCopy.id, inputFieldIds: ["CONTENT-SAMPLE-F-AUTHORIZATION-REF", "CONTENT-SAMPLE-F-AUTHORIZATION-VERSION", "CONTENT-SAMPLE-F-ORIGINAL-WORK-ID", "CONTENT-SAMPLE-F-ORIGINAL-WORK-VERSION", "CONTENT-SAMPLE-F-LIMITED-PURPOSE", "CONTENT-SAMPLE-F-MANAGEMENT-SCOPE"], outputFieldIds: ["CONTENT-SAMPLE-F-ID", "CONTENT-SAMPLE-F-DEIDENTIFIED-COPY-REF", "CONTENT-SAMPLE-F-STATUS", "CONTENT-SAMPLE-F-VERSION"], operationKind: "CREATE", successState: "DRAFT", permissions: samplePermissions, pageId: samplePageId, risk: RISK.HIGH, relatedStateGuards: [{ refFieldId: "CONTENT-SAMPLE-F-AUTHORIZATION-REF", versionFieldId: "CONTENT-SAMPLE-F-AUTHORIZATION-VERSION", targetObjectId: sampleAuthorization.id, requiredState: "AUTHORIZED" }], extras: { sampleCreationGuard: { independentCopy: true, deidentified: true, allowedManagementScopes: ["SCHOOL_PRIVATE"] } } }),
    actionFact({ id: "CONTENT-ACT-ACTIVATE-STUDENT-SAMPLE-COPY", label: "Activate a Purpose-limited Student Sample Copy", targetObjectId: sampleCopy.id, inputFieldIds: ["CONTENT-SAMPLE-F-ID", "CONTENT-SAMPLE-F-AUTHORIZATION-REF", "CONTENT-SAMPLE-F-AUTHORIZATION-VERSION", "CONTENT-SAMPLE-F-DEIDENTIFIED-COPY-REF", "CONTENT-SAMPLE-F-LIMITED-PURPOSE", "CONTENT-SAMPLE-F-MANAGEMENT-SCOPE"], outputFieldIds: ["CONTENT-SAMPLE-F-STATUS", "CONTENT-SAMPLE-F-VERSION"], operationKind: "UPDATE", transition: { from: "DRAFT", to: "ACTIVE" }, permissions: leadPermissions, pageId: samplePageId, risk: RISK.HIGH, relatedStateGuards: [{ refFieldId: "CONTENT-SAMPLE-F-AUTHORIZATION-REF", versionFieldId: "CONTENT-SAMPLE-F-AUTHORIZATION-VERSION", targetObjectId: sampleAuthorization.id, requiredState: "AUTHORIZED" }] }),
    actionFact({ id: "CONTENT-ACT-REMOVE-STUDENT-SAMPLE-COPY", label: "Remove a Product-controlled Student Sample Copy after Withdrawal", targetObjectId: sampleCopy.id, inputFieldIds: ["CONTENT-SAMPLE-F-ID", "CONTENT-SAMPLE-F-AUTHORIZATION-REF", "CONTENT-SAMPLE-F-AUTHORIZATION-VERSION"], outputFieldIds: ["CONTENT-SAMPLE-F-REMOVAL-EVIDENCE", "CONTENT-SAMPLE-F-STATUS", "CONTENT-SAMPLE-F-VERSION"], operationKind: "UPDATE", transition: { from: "ACTIVE", to: "REMOVED" }, permissions: leadPermissions, pageId: samplePageId, risk: RISK.HIGH, relatedStateGuards: [{ refFieldId: "CONTENT-SAMPLE-F-AUTHORIZATION-REF", versionFieldId: "CONTENT-SAMPLE-F-AUTHORIZATION-VERSION", targetObjectId: sampleAuthorization.id, requiredState: "WITHDRAWN" }], extras: { removalBoundary: { productControlledCopiesOnly: true, externalRecallGuaranteed: false } } }),
  ];
  appendActionFacts(module, [...rightsActions, ...sampleActions]);

  const question = requireExactlyOne(module.objects, "CONTENT-OBJ-QUESTION-VERSION", "object");
  const createQuestionActionId = "CONTENT-ACT-CREATE-QUESTION-VERSION";
  const publishQuestionActionId = "CONTENT-ACT-PUBLISH-QUESTION-VERSION";
  const questionBindings = [
    ["CONTENT-QUESTION-F-SOURCE-GRAPH-REF", "CONTENT-QUESTION-F-SOURCE-GRAPH-VERSION", sourceGraph.id, "CONTENT-SOURCE-F-VERSION", "ACTIVE"],
    ["CONTENT-QUESTION-F-RIGHTS-BUNDLE-REF", "CONTENT-QUESTION-F-RIGHTS-BUNDLE-VERSION", rightsBundle.id, "CONTENT-RIGHTS-F-VERSION", "ACTIVE"],
    ["CONTENT-QUESTION-F-MANAGEMENT-SCOPE-REF", "CONTENT-QUESTION-F-MANAGEMENT-SCOPE-VERSION", managementScope.id, "CONTENT-SCOPE-F-VERSION", "ACTIVE"],
  ];
  const questionFields = [];
  for (const [refId, versionId, targetObjectId, targetVersionFieldId] of questionBindings) {
    questionFields.push(
      versionPinnedReference({ id: refId, label: `${targetObjectId} Reference`, targetObjectId, versionFieldId: versionId, targetVersionFieldId, requiredActionIds: [createQuestionActionId, publishQuestionActionId], stateGuardPolicy: "ALWAYS_REQUIRED" }),
      systemField(versionId, `${targetObjectId} Pinned Version`, "INTEGER", { mutability: "IMMUTABLE" }),
    );
  }
  addFields(question, questionFields);
  question.lineageBindings = [
    ...(question.lineageBindings ?? []),
    ...questionBindings.map(([refId, versionId, targetObjectId, targetVersionFieldId]) => lineage(refId, versionId, targetObjectId, targetVersionFieldId)),
  ];
  for (const actionId of [createQuestionActionId, publishQuestionActionId]) {
    const action = requireExactlyOne(module.actions, actionId, "action");
    action.inputFieldIds.push(...questionBindings.flatMap(([refId, versionId]) => [refId, versionId]));
    action.relatedStateGuards = [
      ...(action.relatedStateGuards ?? []),
      ...questionBindings.map(([refFieldId, versionFieldId, targetObjectId, , requiredState]) => ({ refFieldId, versionFieldId, targetObjectId, requiredState })),
    ];
    action.materialChainBinding = {
      materialIdentityFieldIds: [
        "CONTENT-SOURCE-F-ROOT-MATERIAL-ID",
        "CONTENT-RIGHTS-F-MATERIAL-ID",
        "CONTENT-SCOPE-F-MATERIAL-ID",
      ],
      sourceGraphRefFieldIds: [
        "CONTENT-QUESTION-F-SOURCE-GRAPH-REF",
        "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF",
        "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
      ],
      rightsBundleRefFieldIds: [
        "CONTENT-QUESTION-F-RIGHTS-BUNDLE-REF",
        "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF",
      ],
      managementScopeRefFieldId: "CONTENT-QUESTION-F-MANAGEMENT-SCOPE-REF",
      exactVersionMatchRequired: true,
      ownerRefMayDeriveRights: false,
    };
    const materialChainFailurePredicate = "the question source graph rights bundle and management scope refs material IDs or pinned versions do not form one exact chain";
    appendBoundaryScenario(
      module,
      action,
      "MATERIAL_GOVERNANCE_CHAIN_MISMATCH",
      materialChainFailurePredicate,
      "the question remains unpublished and no material is exposed",
      actionId === publishQuestionActionId ? "FAILURE" : "BOUNDARY",
    );
    if (actionId === publishQuestionActionId) {
      action.failureSemantics.push({
        resultCode: "MATERIAL_GOVERNANCE_CHAIN_MISMATCH",
        predicate: materialChainFailurePredicate,
        given: "MATERIAL_GOVERNANCE_CHAIN_MISMATCH blocks Publish Question Version",
        when: "the actor requests Publish Question Version",
        expectedData: "the question remains unpublished and no material is exposed",
      });
    }
  }

  module.relationships.push(
    { id: "CONTENT-REL-RIGHTS-SOURCE-GRAPH", fromObjectId: rightsBundle.id, toObjectId: sourceGraph.id, type: "REQUIRES", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SUBJECT", onSourceInvalidation: "revoke future use and preserve the historical rights decision" },
    { id: "CONTENT-REL-SCOPE-SOURCE-GRAPH", fromObjectId: managementScope.id, toObjectId: sourceGraph.id, type: "REQUIRES", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SUBJECT", onSourceInvalidation: "revoke the management scope and block publication or promotion" },
    { id: "CONTENT-REL-SCOPE-RIGHTS", fromObjectId: managementScope.id, toObjectId: rightsBundle.id, type: "AUTHORIZED_BY", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SUBJECT", onSourceInvalidation: "revoke product availability and prevent promotion or publication" },
    { id: "CONTENT-REL-PUBLIC-REVIEW-SOURCE-GRAPH", fromObjectId: publicReview.id, toObjectId: sourceGraph.id, type: "REVIEWS", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SUBJECT", onSourceInvalidation: "expire the review and block platform-public promotion" },
    { id: "CONTENT-REL-PUBLIC-REVIEW-RIGHTS", fromObjectId: publicReview.id, toObjectId: rightsBundle.id, type: "REVIEWS", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SUBJECT", onSourceInvalidation: "expire the review and block platform-public promotion" },
    { id: "CONTENT-REL-SCOPE-PUBLIC-REVIEW", fromObjectId: managementScope.id, toObjectId: publicReview.id, type: "AUTHORIZED_BY", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SUBJECT", onSourceInvalidation: "revoke platform-public availability while preserving the historical review" },
    { id: "CONTENT-REL-QUESTION-SOURCE-GRAPH", fromObjectId: question.id, toObjectId: sourceGraph.id, type: "REQUIRES", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SUBJECT", onSourceInvalidation: "block new publication and preserve the historical question version" },
    { id: "CONTENT-REL-QUESTION-RIGHTS", fromObjectId: question.id, toObjectId: rightsBundle.id, type: "AUTHORIZED_BY", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SUBJECT", onSourceInvalidation: "block new publication and preserve the historical question version" },
    { id: "CONTENT-REL-QUESTION-SCOPE", fromObjectId: question.id, toObjectId: managementScope.id, type: "REQUIRES", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SUBJECT", onSourceInvalidation: "block new publication and preserve the historical question version" },
    { id: "CONTENT-REL-SAMPLE-AUTHORIZATION", fromObjectId: sampleCopy.id, toObjectId: sampleAuthorization.id, type: "AUTHORIZED_BY", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_STUDENT", onSourceInvalidation: "stop future display and remove product-controlled sample copies" },
  );
  module.pages.push(
    page(rightsPageId, "Material Provenance Rights Review and Management Scope", [sourceGraph.id, rightsBundle.id, managementScope.id, publicReview.id], rightsActions.map(({ action }) => action.id), [...sourceGraph.fields, ...rightsBundle.fields, ...managementScope.fields, ...publicReview.fields].map(({ id }) => id)),
    page(samplePageId, "Authorized Student Work Sample Copies", [sampleAuthorization.id, sampleCopy.id], sampleActions.map(({ action }) => action.id), [...sampleAuthorization.fields, ...sampleCopy.fields].map(({ id }) => id)),
  );
  const governancePage = requireExactlyOne(module.pages, "CONTENT-PAGE-GOVERNANCE", "page");
  governancePage.objectIds.push(sourceGraph.id, rightsBundle.id, managementScope.id, publicReview.id);
  governancePage.fieldIds.push(...questionFields.map(({ id }) => id));
  module.materialRightsContract = {
    sourceGraphObjectId: sourceGraph.id,
    rightsBundleObjectId: rightsBundle.id,
    managementScopeObjectId: managementScope.id,
    publicReviewObjectId: publicReview.id,
    rightsResolveActionId: "CONTENT-ACT-RESOLVE-MATERIAL-RIGHTS",
    requiredRelationshipIds: [
      "CONTENT-REL-RIGHTS-SOURCE-GRAPH",
      "CONTENT-REL-SCOPE-SOURCE-GRAPH",
      "CONTENT-REL-SCOPE-RIGHTS",
    ],
    ownerRefDerivesRights: false,
  };
  module.governanceBaselineOwner = ownerContract("CONTENT-001", ["D067", "D068", "D069"]);
  return module;
}

const enhancerByModuleId = new Map([
  ["ACC-001", enhanceAccountModule],
  ["TEA-001", enhanceTeacherExperienceModule],
  ["NOTI-001", enhanceNotificationModule],
  ["DGV-001", enhanceDataGovernanceModule],
  ["CONTENT-001", enhanceContentRightsModule],
]);

export function applyGovernanceBaselineContracts(sourceModules) {
  if (!Array.isArray(sourceModules)) {
    throw new Error("governance baseline transformation requires a module array");
  }
  for (const moduleId of OWNER_MODULE_IDS) {
    requireExactlyOne(sourceModules, moduleId, "owner module");
  }

  const transformed = sourceModules.map((sourceModule) => {
    const enhancer = enhancerByModuleId.get(sourceModule?.id);
    if (!enhancer) return structuredClone(sourceModule);
    return enhancer(structuredClone(sourceModule));
  });

  for (const moduleId of OWNER_MODULE_IDS) {
    const owner = requireExactlyOne(transformed, moduleId, "transformed owner module");
    if (
      owner.governanceBaselineOwner?.moduleId !== moduleId
      || !Array.isArray(owner.governanceBaselineOwner?.decisionIds)
      || owner.governanceBaselineOwner.decisionIds.length === 0
    ) {
      throw new Error(`owner module ${moduleId} did not declare its governance baseline decisions`);
    }
  }
  const actualOwnerByDecision = new Map();
  for (const module of transformed) {
    const owner = module?.governanceBaselineOwner;
    if (!owner) continue;
    if (owner.moduleId !== module.id || !Array.isArray(owner.decisionIds)) {
      throw new Error(`module ${module?.id} has an invalid governance baseline owner contract`);
    }
    for (const decisionId of owner.decisionIds) {
      const expectedModuleId = GOVERNANCE_DECISION_OWNER.get(decisionId);
      if (expectedModuleId !== module.id) {
        throw new Error(`governance decision ${decisionId} must be owned only by ${expectedModuleId ?? "no module"}`);
      }
      if (actualOwnerByDecision.has(decisionId)) {
        throw new Error(`governance decision ${decisionId} has multiple owner modules`);
      }
      actualOwnerByDecision.set(decisionId, module.id);
    }
  }
  for (const [decisionId, moduleId] of GOVERNANCE_DECISION_OWNER) {
    if (actualOwnerByDecision.get(decisionId) !== moduleId) {
      throw new Error(`governance decision ${decisionId} is missing owner module ${moduleId}`);
    }
  }
  return transformed;
}
