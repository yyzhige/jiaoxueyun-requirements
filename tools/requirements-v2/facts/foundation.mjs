import { CLIENT, PHASE, RISK, deepFreeze, defineModule } from "../model.mjs";

const WEB_APP = [CLIENT.WEB, CLIENT.APP];
const WEB_ONLY = [CLIENT.WEB];
const APP_ONLY = [CLIENT.APP];

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

function responsibility(
  dataSubject,
  producerRef,
  ownerRef,
  confirmerRef,
  stewardRef,
  controlSubject = "SCHOOL",
) {
  return {
    dataSubject,
    controlSubject,
    producerRef,
    ownerRef,
    confirmerRef,
    stewardRef,
  };
}

function object(
  id,
  label,
  {
    dataSubject,
    controlSubject,
    producerRef,
    ownerRef,
    confirmerRef,
    stewardRef,
  },
  lifecyclePolicyId,
  sensitivityId,
  states,
  fields,
) {
  return {
    id,
    label,
    dataSubject,
    controlSubject,
    producerRef,
    ownerRef,
    confirmerRef,
    stewardRef,
    lifecyclePolicyId,
    sensitivityId,
    states,
    fields,
  };
}

function actorReference(actorRef) {
  return actorRef.startsWith("DUTY-")
    ? { dutyRef: actorRef }
    : { roleRef: actorRef };
}

function permissions(allowRef, denyRef, allowCondition, denyCondition) {
  return [
    { effect: "ALLOW", ...actorReference(allowRef), condition: allowCondition },
    { effect: "DENY", ...actorReference(denyRef), condition: denyCondition },
  ];
}

function action({
  id,
  label,
  targetObjectId,
  inputFieldIds = [],
  outputFieldIds = [],
  writes = true,
  risk = writes ? RISK.LOW : RISK.READ,
  clients,
  permissions: actionPermissions,
  transition,
  auditRequired = writes,
  failureResults = ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT"],
  successData,
  successState,
  successPermission = "ALLOW",
  successVisibility = "authorized object scope only",
  failureData,
  failureState,
  failurePermission = "DENY",
  failureVisibility = "no data outside the authorized scope",
  failureKind = "FAILURE",
}) {
  const successScenarioId = `${id}-SCN-SUCCESS`;
  const failureScenarioId = `${id}-SCN-${failureKind}`;
  const stateOutcome = (state) => state
    ? { mode: "STATE", value: state }
    : { mode: "UNCHANGED" };
  const effectiveFailureResults = risk === RISK.HIGH
    ? [...new Set([...failureResults, "AUDIT_FAILED"])]
    : failureResults;
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
      ...(clients ? { clients } : {}),
      permissions: actionPermissions,
      scenarioIds: [successScenarioId, failureScenarioId],
      ...(writes ? { idempotencyKey: `${id}:school:object:source-version:request-id` } : {}),
      auditRequired,
      failureResults: effectiveFailureResults,
    },
    scenarios: [{
      id: successScenarioId,
      kind: "SUCCESS",
      actionId: id,
      given: `the actor meets the entry conditions for ${label}`,
      when: `the actor requests ${label}`,
      then: {
        expectedData: successData ?? `${label} returns the accepted task-specific result`,
        expectedState: stateOutcome(successState ?? transition?.to),
        expectedPermission: successPermission,
        expectedVisibility: successVisibility,
      },
    }, {
      id: failureScenarioId,
      kind: failureKind,
      actionId: id,
      given: `a boundary or failure condition applies to ${label}`,
      when: `the actor requests ${label}`,
      then: {
        expectedData: failureData ?? `${label} returns an explicit failure without hidden writes`,
        expectedState: stateOutcome(failureState),
        expectedPermission: failurePermission,
        expectedVisibility: failureVisibility,
      },
    }],
  };
}

function page(id, label, objectIds, fieldIds, actionIds, clients) {
  return {
    id,
    label,
    ...(clients ? { clients } : {}),
    objectIds,
    fieldIds,
    actionIds,
    regions: ["CONTEXT_HEADER", "TASK_WORK_AREA", "RESULT_AND_FAILURE_STATUS"],
    viewStates: ["LOADING", "READY", "EMPTY", "ERROR", "FORBIDDEN", "STALE_VERSION"],
  };
}

function moduleFact({
  actions: actionFacts,
  defaultClients = WEB_APP,
  defaultPageClients = defaultClients,
  ...module
}) {
  const pages = module.pages.map((pageValue) => ({
    ...pageValue,
    clients: pageValue.clients ?? defaultPageClients,
  }));
  const pageByActionId = new Map();
  for (const pageValue of pages) {
    for (const actionId of pageValue.actionIds) {
      if (!pageByActionId.has(actionId)) pageByActionId.set(actionId, pageValue.id);
    }
  }
  return defineModule({
    ...module,
    pages,
    actions: actionFacts.map(({ action: actionValue }) => ({
      ...actionValue,
      clients: actionValue.clients ?? defaultClients,
    })),
    scenarios: actionFacts.flatMap(({ scenarios }) => scenarios.map((scenario) => ({
      ...scenario,
      pageId: pageByActionId.get(scenario.actionId),
    }))),
  });
}

const accActions = [
  action({
    id: "ACC-ACT-SEARCH-SCHOOL",
    label: "Search Authorized School Before Entry",
    targetObjectId: "ACC-OBJ-SCHOOL",
    inputFieldIds: ["ACC-SCHOOL-F-REGION", "ACC-SCHOOL-F-NAME"],
    outputFieldIds: ["ACC-SCHOOL-F-ID", "ACC-SCHOOL-F-SERVICE-STATE"],
    writes: false,
    permissions: permissions(
      "CURRENT_ACTOR",
      "ROLE-PLATFORM-OPS",
      "school first search is limited to schools visible to the actor",
      "platform operations has no school member entry without school authorization",
    ),
    auditRequired: false,
    successData: "school first search returns authorized schools and never auto-enters a recent school",
    failureData: "no auto entry occurs when no authorized school matches",
    failureKind: "BOUNDARY",
  }),
  action({
    id: "ACC-ACT-SELECT-SCHOOL",
    label: "Select School for Account Entry",
    targetObjectId: "ACC-OBJ-SCHOOL",
    inputFieldIds: ["ACC-SCHOOL-F-ID"],
    outputFieldIds: ["ACC-SCHOOL-F-SERVICE-STATE"],
    writes: false,
    permissions: permissions(
      "CURRENT_ACTOR",
      "ROLE-PLATFORM-OPS",
      "the actor explicitly selects one authorized active school",
      "platform operations cannot select a school member context without authorization",
    ),
    auditRequired: true,
    successData: "the selected school becomes the explicit login boundary without auto-entering it",
  }),
  action({
    id: "ACC-ACT-LOGIN",
    label: "Authenticate Account in Selected School",
    targetObjectId: "ACC-OBJ-MEMBERSHIP",
    inputFieldIds: ["ACC-MEMBER-F-ACCOUNT-ID-TYPE", "ACC-MEMBER-F-ACCOUNT-ID", "ACC-MEMBER-F-SCHOOL-ID"],
    outputFieldIds: ["ACC-MEMBER-F-STATE"],
    writes: false,
    permissions: permissions(
      "CURRENT_ACTOR",
      "ROLE-PLATFORM-OPS",
      "all approved login roles may authenticate on Web and App after selecting a school",
      "platform operations cannot assume a school member identity",
    ),
    auditRequired: true,
    successData: "the selected school and account membership are authenticated on Web or App",
    failureData: "login is denied without an explicitly selected school or active membership",
  }),
  action({
    id: "ACC-ACT-FIRST-ACTIVATION",
    label: "Complete First Account Activation",
    targetObjectId: "ACC-OBJ-MEMBERSHIP",
    inputFieldIds: ["ACC-MEMBER-F-ACTIVATION", "ACC-MEMBER-F-ACCOUNT-ID-TYPE", "ACC-MEMBER-F-ACCOUNT-ID"],
    outputFieldIds: ["ACC-MEMBER-F-STATE"],
    permissions: permissions(
      "CURRENT_ACTOR",
      "ROLE-PLATFORM-OPS",
      "the invited member may activate only the selected school membership",
      "platform operations cannot activate a member account by default",
    ),
    transition: { from: "INVITED", to: "ACTIVE" },
  }),
  action({
    id: "ACC-ACT-SELECT-IDENTITY",
    label: "Select Effective Work Identity",
    targetObjectId: "ACC-OBJ-IDENTITY",
    inputFieldIds: ["ACC-IDENTITY-F-ROLE", "ACC-IDENTITY-F-DUTIES"],
    outputFieldIds: ["ACC-IDENTITY-F-SCOPES"],
    writes: false,
    permissions: permissions(
      "CURRENT_ACTOR",
      "ROLE-PLATFORM-OPS",
      "the actor may select only an effective assigned role and duty set",
      "platform operations cannot select an ungranted school identity",
    ),
    auditRequired: true,
  }),
  action({
    id: "ACC-ACT-SELECT-TERM",
    label: "Select Current or Historical Term",
    targetObjectId: "ACC-OBJ-CONTEXT",
    inputFieldIds: ["ACC-CONTEXT-F-TERM-ID"],
    outputFieldIds: ["ACC-CONTEXT-F-STATUS"],
    permissions: permissions(
      "CURRENT_ACTOR",
      "ROLE-PLATFORM-OPS",
      "the term is inside the selected school and identity scope",
      "platform operations cannot open a school term without authorization",
    ),
    successData: "current term creates a writable context; historical term creates a read-only context",
    failureData: "historical term write attempts are denied and remain read-only",
    successState: "ACTIVE",
    failureState: "READ_ONLY",
    failurePermission: "ALLOW",
    failureKind: "BOUNDARY",
  }),
  action({
    id: "ACC-ACT-SWITCH-CONTEXT",
    label: "Switch Active School Identity and Term Context",
    targetObjectId: "ACC-OBJ-CONTEXT",
    inputFieldIds: [
      "ACC-CONTEXT-F-SCHOOL-ID",
      "ACC-CONTEXT-F-IDENTITY-ID",
      "ACC-CONTEXT-F-TERM-ID",
    ],
    outputFieldIds: ["ACC-CONTEXT-F-STATUS"],
    permissions: permissions(
      "CURRENT_ACTOR",
      "ROLE-PLATFORM-OPS",
      "every destination component is re-authorized before context switch",
      "platform operations cannot switch into student detail or school identity by default",
    ),
    successState: "ACTIVE",
    successData: "the new context becomes active only after school, identity, term, and scope checks",
    failureData: "a historical-term destination becomes an explicitly read-only context",
    failureState: "READ_ONLY",
    failurePermission: "ALLOW",
    failureKind: "BOUNDARY",
  }),
  action({
    id: "ACC-ACT-EXPIRE-CONTEXT",
    label: "Expire Stale Active Work Context",
    targetObjectId: "ACC-OBJ-CONTEXT",
    inputFieldIds: ["ACC-CONTEXT-F-EXPIRY"],
    outputFieldIds: ["ACC-CONTEXT-F-STATUS"],
    permissions: permissions(
      "SYSTEM",
      "CURRENT_ACTOR",
      "the system expires a context at its expiry or invalidated source version",
      "a user cannot extend an expired context without re-establishment",
    ),
    transition: { from: "ACTIVE", to: "EXPIRED" },
    successData: "the stale context is expired and all writes require context recovery",
  }),
];

const accModule = moduleFact({
  id: "ACC-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "School entry, login, and active context",
  objective: "Establish an explicit school, identity, and term context before any protected work.",
  entryConditions: [
    "the user starts without an implicit recent-school selection",
    "the school directory and account membership source are available",
  ],
  exitConditions: [
    "an authorized active context has explicit school, identity, term, and expiry",
    "historical terms are marked read-only",
  ],
  baselineDecisionIds: ["BASE-001", "BASE-004", "BASE-005", "BASE-007"],
  nfrIds: ["NFR-002", "NFR-007", "NFR-008"],
  objects: [
    object(
      "ACC-OBJ-SCHOOL",
      "School Space",
      responsibility(
        "SCHOOL_CONFIGURATION",
        "ROLE-SCHOOL-ADMIN",
        "ROLE-SCHOOL-ADMIN",
        "ROLE-SCHOOL-ADMIN",
        "ROLE-SCHOOL-ADMIN",
      ),
      "LIFE-001",
      "S2",
      ["ACTIVE", "SUSPENDED", "CLOSED"],
      [
        field("ACC-SCHOOL-F-ID", "School ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
        field("ACC-SCHOOL-F-NAME", "School Name"),
        field("ACC-SCHOOL-F-REGION", "School Region", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-001" } }),
        field("ACC-SCHOOL-F-TYPE", "School Type"),
        field("ACC-SCHOOL-F-SERVICE-STATE", "Service State", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
      ],
    ),
    object(
      "ACC-OBJ-MEMBERSHIP",
      "Account Membership",
      responsibility(
        "SCHOOL_MEMBER_ACCOUNT",
        "ROLE-SCHOOL-ADMIN",
        "ROLE-SCHOOL-ADMIN",
        "ROLE-SCHOOL-ADMIN",
        "ROLE-SCHOOL-ADMIN",
      ),
      "LIFE-001",
      "S4",
      ["INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"],
      [
        field("ACC-MEMBER-F-ACCOUNT-ID-TYPE", "Account Identifier Type", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-025" } }),
        field("ACC-MEMBER-F-ACCOUNT-ID", "Account Identifier Value"),
        field("ACC-MEMBER-F-SCHOOL-ID", "Membership School ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-002" }, mutability: "IMMUTABLE" }),
        field("ACC-MEMBER-F-ACTIVATION", "Activation Method", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-026" } }),
        field("ACC-MEMBER-F-STATE", "Membership State", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
      ],
    ),
    object(
      "ACC-OBJ-IDENTITY",
      "Work Identity Assignment",
      responsibility(
        "SCHOOL_MEMBER_WORK_IDENTITY",
        "ROLE-SCHOOL-ADMIN",
        "ROLE-SCHOOL-ADMIN",
        "ROLE-SCHOOL-ADMIN",
        "ROLE-SCHOOL-ADMIN",
      ),
      "LIFE-002",
      "S4",
      ["PENDING", "EFFECTIVE", "EXPIRED", "REVOKED"],
      [
        field("ACC-IDENTITY-F-ID", "Identity Assignment ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
        field("ACC-IDENTITY-F-ROLE", "Login Role", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-003" } }),
        field("ACC-IDENTITY-F-DUTIES", "Assigned Duties", { dataType: "STRING_ARRAY", required: false, valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-042" } }),
        field("ACC-IDENTITY-F-SCOPES", "Effective Data Scopes", { dataType: "STRING_ARRAY", valueSource: { kind: "SYSTEM" }, mutability: "READ_ONLY" }),
        field("ACC-IDENTITY-F-EFFECTIVE", "Effective At", { dataType: "DATETIME" }),
        field("ACC-IDENTITY-F-EXPIRY", "Expires At", { dataType: "DATETIME", required: false }),
      ],
    ),
    object(
      "ACC-OBJ-CONTEXT",
      "Active Work Context",
      responsibility(
        "CURRENT_ACTOR_WORK_CONTEXT",
        "CURRENT_ACTOR",
        "CURRENT_ACTOR",
        "SYSTEM",
        "SYSTEM",
      ),
      "LIFE-001",
      "S4",
      ["PENDING", "ACTIVE", "READ_ONLY", "EXPIRED", "INVALIDATED"],
      [
        field("ACC-CONTEXT-F-SCHOOL-ID", "Context School ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-002" }, mutability: "IMMUTABLE" }),
        field("ACC-CONTEXT-F-IDENTITY-ID", "Context Identity ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
        field("ACC-CONTEXT-F-TERM-ID", "Context Term ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-004" } }),
        field("ACC-CONTEXT-F-CREATED", "Created At", { dataType: "DATETIME", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
        field("ACC-CONTEXT-F-EXPIRY", "Expires At", { dataType: "DATETIME", valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
        field("ACC-CONTEXT-F-STATUS", "Context Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
      ],
    ),
  ],
  relationships: [
    {
      id: "ACC-REL-MEMBERSHIP-SCHOOL",
      fromObjectId: "ACC-OBJ-MEMBERSHIP",
      toObjectId: "ACC-OBJ-SCHOOL",
      type: "BELONGS_TO",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "invalidate identities and active contexts for the membership",
    },
    {
      id: "ACC-REL-CONTEXT-IDENTITY",
      fromObjectId: "ACC-OBJ-CONTEXT",
      toObjectId: "ACC-OBJ-IDENTITY",
      type: "ACTIVATES",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_CONTEXT",
      onSourceInvalidation: "expire the active context immediately",
    },
  ],
  actions: accActions,
  pages: [
    page("ACC-PAGE-SCHOOL-ENTRY", "Authorized School Selection", ["ACC-OBJ-SCHOOL"], ["ACC-SCHOOL-F-ID", "ACC-SCHOOL-F-NAME", "ACC-SCHOOL-F-REGION", "ACC-SCHOOL-F-SERVICE-STATE"], ["ACC-ACT-SEARCH-SCHOOL", "ACC-ACT-SELECT-SCHOOL"]),
    page("ACC-PAGE-LOGIN-ACTIVATION", "Selected School Login and First Activation", ["ACC-OBJ-MEMBERSHIP"], ["ACC-MEMBER-F-ACCOUNT-ID-TYPE", "ACC-MEMBER-F-ACCOUNT-ID", "ACC-MEMBER-F-SCHOOL-ID", "ACC-MEMBER-F-ACTIVATION", "ACC-MEMBER-F-STATE"], ["ACC-ACT-LOGIN", "ACC-ACT-FIRST-ACTIVATION"]),
    page("ACC-PAGE-IDENTITY-TERM", "Effective Identity and Term Selection", ["ACC-OBJ-IDENTITY", "ACC-OBJ-CONTEXT"], ["ACC-IDENTITY-F-ROLE", "ACC-IDENTITY-F-DUTIES", "ACC-CONTEXT-F-TERM-ID", "ACC-CONTEXT-F-STATUS"], ["ACC-ACT-SELECT-IDENTITY", "ACC-ACT-SELECT-TERM"]),
    page("ACC-PAGE-CONTEXT-SWITCH", "Active Context Switcher", ["ACC-OBJ-CONTEXT"], ["ACC-CONTEXT-F-SCHOOL-ID", "ACC-CONTEXT-F-IDENTITY-ID", "ACC-CONTEXT-F-TERM-ID", "ACC-CONTEXT-F-STATUS"], ["ACC-ACT-SWITCH-CONTEXT"]),
    page("ACC-PAGE-CONTEXT-RECOVERY", "Expired Context Recovery", ["ACC-OBJ-CONTEXT"], ["ACC-CONTEXT-F-SCHOOL-ID", "ACC-CONTEXT-F-IDENTITY-ID", "ACC-CONTEXT-F-TERM-ID", "ACC-CONTEXT-F-EXPIRY", "ACC-CONTEXT-F-STATUS"], ["ACC-ACT-EXPIRE-CONTEXT", "ACC-ACT-SWITCH-CONTEXT"]),
  ],
});

const orgObjects = [
  object("ORG-OBJ-TERM", "Term", responsibility("SCHOOL_TERM", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"), "LIFE-002", "S2", ["DRAFT", "CURRENT", "HISTORICAL", "ARCHIVED"], [
    field("ORG-TERM-F-ID", "Term ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("ORG-TERM-F-NAME", "Term Name"),
    field("ORG-TERM-F-START", "Start Date", { dataType: "DATE" }),
    field("ORG-TERM-F-END", "End Date", { dataType: "DATE" }),
    field("ORG-TERM-F-STATUS", "Term Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("ORG-OBJ-GRADE", "Grade", responsibility("SCHOOL_GRADE", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"), "LIFE-002", "S2", ["ACTIVE", "HISTORICAL"], [
    field("ORG-GRADE-F-ID", "Grade ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("ORG-GRADE-F-NAME", "Grade Name"),
    field("ORG-GRADE-F-TERM-ID", "Term ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-004" } }),
    field("ORG-GRADE-F-STATUS", "Grade Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("ORG-OBJ-CLASS", "Class", responsibility("SCHOOL_CLASS", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"), "LIFE-002", "S2", ["ACTIVE", "HISTORICAL", "DEACTIVATED"], [
    field("ORG-CLASS-F-ID", "Class ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("ORG-CLASS-F-NAME", "Class Name"),
    field("ORG-CLASS-F-GRADE-ID", "Grade ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-005" } }),
    field("ORG-CLASS-F-STATUS", "Class Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("ORG-OBJ-SUBJECT", "Subject Catalog", responsibility("SCHOOL_SUBJECT_CATALOG", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"), "LIFE-002", "S2", ["ACTIVE", "DEPRECATED"], [
    field("ORG-SUBJECT-F-ID", "Subject ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("ORG-SUBJECT-F-NAME", "Subject Name"),
    field("ORG-SUBJECT-F-STATUS", "Subject Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("ORG-OBJ-COURSE", "Course", responsibility("SCHOOL_COURSE", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"), "LIFE-002", "S2", ["DRAFT", "ACTIVE", "ENDED"], [
    field("ORG-COURSE-F-ID", "Course ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("ORG-COURSE-F-NAME", "Course Name"),
    field("ORG-COURSE-F-SUBJECT-ID", "Subject ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-007" } }),
    field("ORG-COURSE-F-TERM-ID", "Term ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-004" } }),
  ]),
  object("ORG-OBJ-TEACHER", "Teacher Profile", responsibility("TEACHER", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"), "LIFE-002", "S3", ["ACTIVE", "SUSPENDED", "DEACTIVATED"], [
    field("ORG-TEACHER-F-ID", "Teacher ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("ORG-TEACHER-F-NAME", "Teacher Name"),
    field("ORG-TEACHER-F-MEMBER-STATE", "Member State", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("ORG-OBJ-STUDENT", "Student Profile", responsibility("STUDENT", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"), "LIFE-002", "S3", ["ACTIVE", "TRANSFERRED", "DEACTIVATED"], [
    field("ORG-STUDENT-F-ID", "Student ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("ORG-STUDENT-F-NAME", "Student Name"),
    field("ORG-STUDENT-F-CLASS-ID", "Class ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-006" } }),
    field("ORG-STUDENT-F-MEMBER-STATE", "Member State", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("ORG-OBJ-TEACHING-ASSIGNMENT", "Teaching Assignment", responsibility("TEACHER_COURSE_ASSIGNMENT", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"), "LIFE-002", "S2", ["PLANNED", "EFFECTIVE", "EXPIRED", "REVOKED"], [
    field("ORG-TEACHING-F-ID", "Teaching Assignment ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("ORG-TEACHING-F-TEACHER-ID", "Teacher ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-009" } }),
    field("ORG-TEACHING-F-COURSE-ID", "Course ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-008" } }),
    field("ORG-TEACHING-F-CLASS-ID", "Class ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-006" } }),
    field("ORG-TEACHING-F-EFFECTIVE", "Effective Range"),
  ]),
  object("ORG-OBJ-HOMEROOM-ASSIGNMENT", "Homeroom Assignment", responsibility("HOMEROOM_TEACHER_ASSIGNMENT", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"), "LIFE-002", "S2", ["PLANNED", "EFFECTIVE", "EXPIRED", "REVOKED"], [
    field("ORG-HOMEROOM-F-ID", "Homeroom Assignment ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("ORG-HOMEROOM-F-TEACHER-ID", "Homeroom Teacher ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-009" } }),
    field("ORG-HOMEROOM-F-CLASS-ID", "Homeroom Class ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-006" } }),
    field("ORG-HOMEROOM-F-EFFECTIVE", "Effective Range"),
  ]),
  object("ORG-OBJ-IMPORT-BATCH", "Import Batch", responsibility("ORGANIZATION_IMPORT", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR"), "LIFE-002", "S3", ["UPLOADED", "MAPPED", "VALIDATED", "PENDING_OUTCOME_AUDIT", "PENDING_PARTIAL_OUTCOME_AUDIT", "PARTIAL_SUCCESS", "COMPLETED", "REJECTED"], [
    field("ORG-IMPORT-F-ID", "Import Batch ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("ORG-IMPORT-F-OBJECT-TYPE", "Import Object Type", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-020" } }),
    field("ORG-IMPORT-F-TEMPLATE-VERSION", "Template Version"),
    field("ORG-IMPORT-F-MAPPING", "Field Mapping", { dataType: "JSON", required: false }),
    field("ORG-IMPORT-F-STATUS", "Import Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("ORG-OBJ-IMPORT-ROW", "Import Row Result", responsibility("ORGANIZATION_IMPORT_OBJECT", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR"), "LIFE-002", "S3", ["PENDING", "VALIDATED", "CREATE", "UPDATE", "NO_CHANGE", "REJECT", "DEACTIVATE", "RETRYABLE"], [
    field("ORG-IMPORT-ROW-F-ID", "Import Row ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("ORG-IMPORT-ROW-F-BATCH-ID", "Import Batch ID", { valueSource: { kind: "SYSTEM" } }),
    field("ORG-IMPORT-ROW-F-RESULT-TYPE", "Object Result Type", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-021" }, mutability: "READ_ONLY", validation: "must be CREATE, UPDATE, NO_CHANGE, REJECT, or DEACTIVATE" }),
    field("ORG-IMPORT-ROW-F-VALIDATION-RESULT", "Row Validation Result", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-022" }, mutability: "READ_ONLY" }),
    field("ORG-IMPORT-ROW-F-ERRORS", "Row Errors", { dataType: "STRING_ARRAY", required: false, valueSource: { kind: "SYSTEM" }, mutability: "READ_ONLY" }),
    field("ORG-IMPORT-ROW-F-CONFLICTS", "Row Conflicts", { dataType: "STRING_ARRAY", required: false, valueSource: { kind: "SYSTEM" }, mutability: "READ_ONLY" }),
    field("ORG-IMPORT-ROW-F-OBJECT-ID", "Affected Object ID", { required: false, valueSource: { kind: "SYSTEM" }, mutability: "READ_ONLY" }),
    field("ORG-IMPORT-ROW-F-ANOMALY-CONFIRMATION", "Anomaly Confirmation", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-001" } }),
    field("ORG-IMPORT-ROW-F-CONFIRMATION-NOTE", "Anomaly Confirmation Note", { dataType: "TEXT", required: false }),
  ]),
];

const orgAdminPermissions = permissions(
  "ROLE-ACADEMIC",
  "ROLE-PLATFORM-OPS",
  "academic staff acts inside the active school and term scope",
  "platform operations cannot change school organization without school authorization",
);

const orgActions = [
  action({ id: "ORG-ACT-MANAGE-TERM", label: "Create or Version a School Term", targetObjectId: "ORG-OBJ-TERM", inputFieldIds: ["ORG-TERM-F-NAME", "ORG-TERM-F-START", "ORG-TERM-F-END"], outputFieldIds: ["ORG-TERM-F-STATUS"], permissions: orgAdminPermissions, successState: "DRAFT" }),
  action({ id: "ORG-ACT-MANAGE-GRADE", label: "Create or Update a Term Grade", targetObjectId: "ORG-OBJ-GRADE", inputFieldIds: ["ORG-GRADE-F-NAME", "ORG-GRADE-F-TERM-ID"], outputFieldIds: ["ORG-GRADE-F-STATUS"], permissions: orgAdminPermissions, successState: "ACTIVE" }),
  action({ id: "ORG-ACT-MANAGE-CLASS", label: "Create or Update a Term Class", targetObjectId: "ORG-OBJ-CLASS", inputFieldIds: ["ORG-CLASS-F-NAME", "ORG-CLASS-F-GRADE-ID"], outputFieldIds: ["ORG-CLASS-F-STATUS"], permissions: orgAdminPermissions, successState: "ACTIVE" }),
  action({ id: "ORG-ACT-MANAGE-SUBJECT", label: "Maintain the School Subject Catalog", targetObjectId: "ORG-OBJ-SUBJECT", inputFieldIds: ["ORG-SUBJECT-F-NAME"], outputFieldIds: ["ORG-SUBJECT-F-STATUS"], permissions: orgAdminPermissions, successState: "ACTIVE" }),
  action({ id: "ORG-ACT-MANAGE-COURSE", label: "Create or Update a Term Course", targetObjectId: "ORG-OBJ-COURSE", inputFieldIds: ["ORG-COURSE-F-NAME", "ORG-COURSE-F-SUBJECT-ID", "ORG-COURSE-F-TERM-ID"], permissions: orgAdminPermissions, successState: "DRAFT" }),
  action({ id: "ORG-ACT-MANAGE-TEACHER", label: "Create or Update a Teacher Profile", targetObjectId: "ORG-OBJ-TEACHER", inputFieldIds: ["ORG-TEACHER-F-NAME"], outputFieldIds: ["ORG-TEACHER-F-MEMBER-STATE"], permissions: orgAdminPermissions, successState: "ACTIVE" }),
  action({ id: "ORG-ACT-MANAGE-STUDENT", label: "Create or Update a Student Profile", targetObjectId: "ORG-OBJ-STUDENT", inputFieldIds: ["ORG-STUDENT-F-NAME", "ORG-STUDENT-F-CLASS-ID"], outputFieldIds: ["ORG-STUDENT-F-MEMBER-STATE"], permissions: orgAdminPermissions, successState: "ACTIVE" }),
  action({ id: "ORG-ACT-ASSIGN-SUBJECT-TEACHER", label: "Assign a Subject Teacher to Course and Class", targetObjectId: "ORG-OBJ-TEACHING-ASSIGNMENT", inputFieldIds: ["ORG-TEACHING-F-TEACHER-ID", "ORG-TEACHING-F-COURSE-ID", "ORG-TEACHING-F-CLASS-ID", "ORG-TEACHING-F-EFFECTIVE"], permissions: permissions("ROLE-ACADEMIC", "DUTY-SUBJECT-LEAD", "academic staff owns assignment changes", "subject lead may review subject scope but cannot grant organization duties"), successState: "PLANNED" }),
  action({ id: "ORG-ACT-ASSIGN-HOMEROOM", label: "Assign a Homeroom Teacher to a Class", targetObjectId: "ORG-OBJ-HOMEROOM-ASSIGNMENT", inputFieldIds: ["ORG-HOMEROOM-F-TEACHER-ID", "ORG-HOMEROOM-F-CLASS-ID", "ORG-HOMEROOM-F-EFFECTIVE"], permissions: orgAdminPermissions, successState: "PLANNED" }),
  action({ id: "ORG-ACT-DOWNLOAD-IMPORT-TEMPLATE", label: "Download Object-specific Import Template", targetObjectId: "ORG-OBJ-IMPORT-BATCH", inputFieldIds: ["ORG-IMPORT-F-OBJECT-TYPE"], outputFieldIds: ["ORG-IMPORT-F-TEMPLATE-VERSION"], writes: false, permissions: orgAdminPermissions, auditRequired: false }),
  action({ id: "ORG-ACT-UPLOAD-IMPORT", label: "Upload Organization Import Workbook", targetObjectId: "ORG-OBJ-IMPORT-BATCH", inputFieldIds: ["ORG-IMPORT-F-OBJECT-TYPE", "ORG-IMPORT-F-TEMPLATE-VERSION"], outputFieldIds: ["ORG-IMPORT-F-STATUS"], permissions: orgAdminPermissions, successState: "UPLOADED" }),
  action({ id: "ORG-ACT-MAP-IMPORT-FIELDS", label: "Map Workbook Columns to Organization Fields", targetObjectId: "ORG-OBJ-IMPORT-BATCH", inputFieldIds: ["ORG-IMPORT-F-MAPPING"], outputFieldIds: ["ORG-IMPORT-F-STATUS"], permissions: orgAdminPermissions, successState: "MAPPED" }),
  action({ id: "ORG-ACT-VALIDATE-IMPORT", label: "Validate Object-level Import Rows", targetObjectId: "ORG-OBJ-IMPORT-ROW", inputFieldIds: ["ORG-IMPORT-ROW-F-BATCH-ID"], outputFieldIds: ["ORG-IMPORT-ROW-F-RESULT-TYPE", "ORG-IMPORT-ROW-F-VALIDATION-RESULT", "ORG-IMPORT-ROW-F-ERRORS", "ORG-IMPORT-ROW-F-CONFLICTS"], permissions: orgAdminPermissions, successState: "VALIDATED", successData: "each row receives CREATE, UPDATE, NO_CHANGE, REJECT, or DEACTIVATE before confirmation", failureData: "errors and conflicts block only affected rows and remain visible" }),
  action({ id: "ORG-ACT-CONFIRM-IMPORT", label: "Confirm Object-level Import", targetObjectId: "ORG-OBJ-IMPORT-BATCH", inputFieldIds: ["ORG-IMPORT-F-ID"], outputFieldIds: ["ORG-IMPORT-F-STATUS"], permissions: orgAdminPermissions, risk: RISK.HIGH, failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT", "PARTIAL_SUCCESS"], successState: "PENDING_OUTCOME_AUDIT", successData: "accepted rows remain provisional until the outcome audit succeeds; rejected rows remain object-level results for correction", failureData: "successful rows in a partial result remain provisional until outcome audit and every failed object row is reported", failureKind: "BOUNDARY", failureState: "PENDING_PARTIAL_OUTCOME_AUDIT", failurePermission: "ALLOW", failureVisibility: "successful and failed object-level row results remain visible inside the authorized import scope" }),
  action({ id: "ORG-ACT-FINALIZE-AUDITED-IMPORT", label: "Finalize an Audited Organization Import", targetObjectId: "ORG-OBJ-IMPORT-BATCH", inputFieldIds: ["ORG-IMPORT-F-ID"], outputFieldIds: ["ORG-IMPORT-F-STATUS"], permissions: permissions("SYSTEM", "CURRENT_ACTOR", "the system finalizes only rows covered by the successful outcome audit", "a user cannot finalize provisional rows without the outcome audit"), risk: RISK.HIGH, transition: { from: "PENDING_OUTCOME_AUDIT", to: "COMPLETED" }, successData: "the audited provisional rows become the final accepted organization version" }),
  action({ id: "ORG-ACT-FINALIZE-AUDITED-PARTIAL-IMPORT", label: "Finalize an Audited Partial Organization Import", targetObjectId: "ORG-OBJ-IMPORT-BATCH", inputFieldIds: ["ORG-IMPORT-F-ID"], outputFieldIds: ["ORG-IMPORT-F-STATUS"], permissions: permissions("SYSTEM", "CURRENT_ACTOR", "the system finalizes only partial-success rows covered by the successful outcome audit", "a user cannot finalize provisional partial rows without the outcome audit"), risk: RISK.HIGH, transition: { from: "PENDING_PARTIAL_OUTCOME_AUDIT", to: "PARTIAL_SUCCESS" }, successData: "audited successful rows become final while rejected rows remain visible for correction" }),
  action({ id: "ORG-ACT-RETRY-FAILED-ROWS", label: "Retry Corrected Failed Import Rows", targetObjectId: "ORG-OBJ-IMPORT-ROW", inputFieldIds: ["ORG-IMPORT-ROW-F-ID"], outputFieldIds: ["ORG-IMPORT-ROW-F-RESULT-TYPE", "ORG-IMPORT-ROW-F-ERRORS", "ORG-IMPORT-ROW-F-CONFLICTS"], permissions: orgAdminPermissions, successState: "VALIDATED", successData: "only corrected failed rows are retried; prior successful rows remain accepted" }),
  action({ id: "ORG-ACT-DEACTIVATE-MEMBER", label: "Deactivate a School Member Profile", targetObjectId: "ORG-OBJ-STUDENT", inputFieldIds: ["ORG-STUDENT-F-ID"], outputFieldIds: ["ORG-STUDENT-F-MEMBER-STATE"], permissions: orgAdminPermissions, risk: RISK.HIGH, successState: "DEACTIVATED" }),
  action({ id: "ORG-ACT-RESOLVE-CONTEXT-SCOPE", label: "Resolve Current Term and Organization Scope", targetObjectId: "ORG-OBJ-TERM", inputFieldIds: ["ORG-TERM-F-ID"], outputFieldIds: ["ORG-TERM-F-STATUS"], writes: false, permissions: permissions("CURRENT_ACTOR", "ROLE-PLATFORM-OPS", "resolve only organization facts inside the active school identity", "platform operations cannot resolve school scope without authorization"), auditRequired: false, successData: "current term and organization versions are returned for permission evaluation" }),
  action({ id: "ORG-ACT-VIEW-MY-TEACHING-SCOPE", label: "View My Class and Teaching Scope on App", targetObjectId: "ORG-OBJ-TEACHING-ASSIGNMENT", inputFieldIds: ["ORG-TEACHING-F-TEACHER-ID"], outputFieldIds: ["ORG-TEACHING-F-COURSE-ID", "ORG-TEACHING-F-CLASS-ID", "ORG-TEACHING-F-EFFECTIVE"], writes: false, clients: APP_ONLY, permissions: permissions("CURRENT_ACTOR", "ROLE-PLATFORM-OPS", "the current teacher may view only effective class and teaching relationships", "platform operations cannot view teacher scope without school authorization"), auditRequired: false, successData: "App returns the current teacher's effective classes and teaching relationships" }),
  action({ id: "ORG-ACT-VIEW-IMPORT-NOTIFICATION", label: "View Import Result Notification on App", targetObjectId: "ORG-OBJ-IMPORT-BATCH", inputFieldIds: ["ORG-IMPORT-F-ID"], outputFieldIds: ["ORG-IMPORT-F-STATUS"], writes: false, clients: APP_ONLY, permissions: permissions("CURRENT_ACTOR", "ROLE-PLATFORM-OPS", "the import operator may view the operator's own batch outcome notification", "platform operations cannot view school import results without authorization"), auditRequired: false, successData: "App shows batch status and object-level exceptions without exposing bulk editing" }),
  action({ id: "ORG-ACT-CONFIRM-IMPORT-ANOMALY", label: "Confirm an Import Anomaly on App", targetObjectId: "ORG-OBJ-IMPORT-ROW", inputFieldIds: ["ORG-IMPORT-ROW-F-ID", "ORG-IMPORT-ROW-F-ANOMALY-CONFIRMATION", "ORG-IMPORT-ROW-F-CONFIRMATION-NOTE"], outputFieldIds: ["ORG-IMPORT-ROW-F-VALIDATION-RESULT", "ORG-IMPORT-ROW-F-ERRORS", "ORG-IMPORT-ROW-F-CONFLICTS"], clients: APP_ONLY, permissions: orgAdminPermissions, risk: RISK.HIGH, successState: "VALIDATED", successData: "App records an explicit anomaly confirmation without executing or reproducing the bulk import workflow" }),
];

const orgModule = moduleFact({
  id: "ORG-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Organization, members, and import",
  objective: "Maintain versioned school organization and execute observable object-level imports.",
  entryConditions: ["an academic user has an active school and term context", "organization templates have explicit versions"],
  exitConditions: ["organization facts have effective versions", "every imported object has a create, update, no-change, reject, or deactivate result"],
  baselineDecisionIds: ["BASE-001", "BASE-002", "BASE-007"],
  nfrIds: ["NFR-002", "NFR-008"],
  defaultClients: WEB_ONLY,
  objects: orgObjects,
  relationships: [
    { id: "ORG-REL-CLASS-GRADE", fromObjectId: "ORG-OBJ-CLASS", toObjectId: "ORG-OBJ-GRADE", type: "BELONGS_TO", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_TERM", onSourceInvalidation: "invalidate class scope after the effective grade version changes" },
    { id: "ORG-REL-COURSE-SUBJECT", fromObjectId: "ORG-OBJ-COURSE", toObjectId: "ORG-OBJ-SUBJECT", type: "USES_SUBJECT", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_TERM", onSourceInvalidation: "prevent new assignments while preserving historical course references" },
    { id: "ORG-REL-IMPORT-ROW-BATCH", fromObjectId: "ORG-OBJ-IMPORT-ROW", toObjectId: "ORG-OBJ-IMPORT-BATCH", type: "RESULT_OF", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_CONTEXT", onSourceInvalidation: "retain accepted row results and mark pending rows not executable" },
  ],
  actions: orgActions,
  pages: [
    page("ORG-PAGE-TREE", "Term Grade Class Subject and Course Organization Tree", ["ORG-OBJ-TERM", "ORG-OBJ-GRADE", "ORG-OBJ-CLASS", "ORG-OBJ-SUBJECT", "ORG-OBJ-COURSE"], ["ORG-TERM-F-NAME", "ORG-TERM-F-START", "ORG-TERM-F-END", "ORG-GRADE-F-NAME", "ORG-GRADE-F-TERM-ID", "ORG-GRADE-F-STATUS", "ORG-CLASS-F-NAME", "ORG-CLASS-F-GRADE-ID", "ORG-SUBJECT-F-NAME", "ORG-COURSE-F-NAME", "ORG-COURSE-F-SUBJECT-ID", "ORG-COURSE-F-TERM-ID"], ["ORG-ACT-MANAGE-TERM", "ORG-ACT-MANAGE-GRADE", "ORG-ACT-MANAGE-CLASS", "ORG-ACT-MANAGE-SUBJECT", "ORG-ACT-MANAGE-COURSE", "ORG-ACT-RESOLVE-CONTEXT-SCOPE"]),
    page("ORG-PAGE-MEMBERS", "Teacher and Student Member Management", ["ORG-OBJ-TEACHER", "ORG-OBJ-STUDENT"], ["ORG-TEACHER-F-NAME", "ORG-TEACHER-F-MEMBER-STATE", "ORG-STUDENT-F-NAME", "ORG-STUDENT-F-CLASS-ID", "ORG-STUDENT-F-MEMBER-STATE"], ["ORG-ACT-MANAGE-TEACHER", "ORG-ACT-MANAGE-STUDENT", "ORG-ACT-DEACTIVATE-MEMBER"]),
    page("ORG-PAGE-IMPORT-TEMPLATE", "Import Object and Template Selection", ["ORG-OBJ-IMPORT-BATCH"], ["ORG-IMPORT-F-OBJECT-TYPE", "ORG-IMPORT-F-TEMPLATE-VERSION"], ["ORG-ACT-DOWNLOAD-IMPORT-TEMPLATE", "ORG-ACT-UPLOAD-IMPORT"]),
    page("ORG-PAGE-IMPORT-MAPPING", "Import Mapping and Row Validation", ["ORG-OBJ-IMPORT-BATCH", "ORG-OBJ-IMPORT-ROW"], ["ORG-IMPORT-F-MAPPING", "ORG-IMPORT-F-STATUS", "ORG-IMPORT-ROW-F-RESULT-TYPE", "ORG-IMPORT-ROW-F-VALIDATION-RESULT", "ORG-IMPORT-ROW-F-ERRORS", "ORG-IMPORT-ROW-F-CONFLICTS"], ["ORG-ACT-MAP-IMPORT-FIELDS", "ORG-ACT-VALIDATE-IMPORT", "ORG-ACT-CONFIRM-IMPORT"]),
    page("ORG-PAGE-IMPORT-RESULT", "Object-level Import Result and Retry", ["ORG-OBJ-IMPORT-BATCH", "ORG-OBJ-IMPORT-ROW"], ["ORG-IMPORT-F-STATUS", "ORG-IMPORT-ROW-F-RESULT-TYPE", "ORG-IMPORT-ROW-F-ERRORS", "ORG-IMPORT-ROW-F-CONFLICTS", "ORG-IMPORT-ROW-F-OBJECT-ID"], ["ORG-ACT-FINALIZE-AUDITED-IMPORT", "ORG-ACT-FINALIZE-AUDITED-PARTIAL-IMPORT", "ORG-ACT-RETRY-FAILED-ROWS"]),
    page("ORG-PAGE-TEACHING-ASSIGNMENT", "Subject and Homeroom Teaching Assignment", ["ORG-OBJ-TEACHING-ASSIGNMENT", "ORG-OBJ-HOMEROOM-ASSIGNMENT"], ["ORG-TEACHING-F-TEACHER-ID", "ORG-TEACHING-F-COURSE-ID", "ORG-TEACHING-F-CLASS-ID", "ORG-TEACHING-F-EFFECTIVE", "ORG-HOMEROOM-F-TEACHER-ID", "ORG-HOMEROOM-F-CLASS-ID", "ORG-HOMEROOM-F-EFFECTIVE"], ["ORG-ACT-ASSIGN-SUBJECT-TEACHER", "ORG-ACT-ASSIGN-HOMEROOM"]),
    page("ORG-PAGE-APP-MY-TEACHING-SCOPE", "My Class and Teaching Scope", ["ORG-OBJ-TEACHING-ASSIGNMENT", "ORG-OBJ-HOMEROOM-ASSIGNMENT"], ["ORG-TEACHING-F-TEACHER-ID", "ORG-TEACHING-F-COURSE-ID", "ORG-TEACHING-F-CLASS-ID", "ORG-TEACHING-F-EFFECTIVE", "ORG-HOMEROOM-F-CLASS-ID", "ORG-HOMEROOM-F-EFFECTIVE"], ["ORG-ACT-VIEW-MY-TEACHING-SCOPE"], APP_ONLY),
    page("ORG-PAGE-APP-IMPORT-RESULT", "Import Result Notification and Anomaly Confirmation", ["ORG-OBJ-IMPORT-BATCH", "ORG-OBJ-IMPORT-ROW"], ["ORG-IMPORT-F-STATUS", "ORG-IMPORT-ROW-F-RESULT-TYPE", "ORG-IMPORT-ROW-F-VALIDATION-RESULT", "ORG-IMPORT-ROW-F-ERRORS", "ORG-IMPORT-ROW-F-CONFLICTS", "ORG-IMPORT-ROW-F-ANOMALY-CONFIRMATION", "ORG-IMPORT-ROW-F-CONFIRMATION-NOTE"], ["ORG-ACT-VIEW-IMPORT-NOTIFICATION", "ORG-ACT-CONFIRM-IMPORT-ANOMALY"], APP_ONLY),
  ],
});

const iamObjects = [
  object("IAM-OBJ-ROLE-POLICY", "Role Policy", responsibility("SCHOOL_ROLE_POLICY", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"), "LIFE-001", "S4", ["DRAFT", "ACTIVE", "SUPERSEDED"], [
    field("IAM-ROLE-F-ID", "Role Policy ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-ROLE-F-ROLE", "Login Role", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-003" } }),
    field("IAM-ROLE-F-ACTIONS", "Allowed Action Set", { dataType: "STRING_ARRAY" }),
    field("IAM-ROLE-F-VERSION", "Policy Version", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
  ]),
  object("IAM-OBJ-DUTY-GRANT", "Duty Grant", responsibility("SCHOOL_DUTY_GRANT", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"), "LIFE-002", "S4", ["PLANNED", "EFFECTIVE", "EXPIRED", "REVOKED"], [
    field("IAM-DUTY-F-ID", "Duty Grant ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-DUTY-F-GRANTOR-AUTHORITY", "Grantor Authority", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-DUTY-F-SUBJECT", "Subject Account ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-009" } }),
    field("IAM-DUTY-F-DUTY", "Duty ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-042" } }),
    field("IAM-DUTY-F-SCOPE", "Duty Object Scope", { dataType: "JSON", valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-015" } }),
    field("IAM-DUTY-F-ACTIONS", "Duty Granted Actions", { dataType: "STRING_ARRAY" }),
    field("IAM-DUTY-F-EFFECTIVE", "Effective At", { dataType: "DATETIME" }),
    field("IAM-DUTY-F-EXPIRY", "Expires At", { dataType: "DATETIME", required: false }),
    field("IAM-DUTY-F-REASON", "Grant Reason"),
    field("IAM-DUTY-F-STATUS", "Duty Grant Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("IAM-OBJ-SCOPE-GRANT", "Data Scope Grant", responsibility("SCHOOL_SCOPE_GRANT", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"), "LIFE-002", "S4", ["PLANNED", "EFFECTIVE", "EXPIRED", "REVOKED"], [
    field("IAM-SCOPE-F-ID", "Data Scope Grant ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-SCOPE-F-GRANTOR-AUTHORITY", "Scope Grantor Authority", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-SCOPE-F-SUBJECT", "Scope Subject ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-009" } }),
    field("IAM-SCOPE-F-DUTY", "Target Duty ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-042" } }),
    field("IAM-SCOPE-F-SCOPE", "Granted Object Scope", { dataType: "JSON", valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-015" } }),
    field("IAM-SCOPE-F-ACTIONS", "Granted Actions", { dataType: "STRING_ARRAY" }),
    field("IAM-SCOPE-F-EFFECTIVE", "Scope Effective At", { dataType: "DATETIME" }),
    field("IAM-SCOPE-F-EXPIRY", "Scope Expires At", { dataType: "DATETIME", required: false }),
    field("IAM-SCOPE-F-REASON", "Scope Grant Reason"),
    field("IAM-SCOPE-F-STATUS", "Scope Grant Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("IAM-OBJ-PERMISSION-DECISION", "Permission Decision", responsibility("PERMISSION_EVALUATION", "SYSTEM", "SYSTEM", "SYSTEM", "ROLE-SCHOOL-ADMIN"), "LIFE-004", "S4", ["ALLOW", "DENY", "STALE"], [
    field("IAM-DECISION-F-ID", "Permission Decision ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-DECISION-F-SUBJECT", "Decision Subject ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-DECISION-F-ACTION", "Evaluated Action", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-DECISION-F-SCOPE", "Evaluated Object Scope", { dataType: "JSON", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-DECISION-F-RESULT", "Permission Result", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-DECISION-F-REASON", "Permission Reason", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-DECISION-F-SOURCE-VERSIONS", "Permission Source Versions", { dataType: "JSON", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
  ]),
  object("IAM-OBJ-TEMP-GRANT", "Temporary Grant", responsibility("TEMPORARY_SCHOOL_GRANT", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"), "LIFE-001", "S4", ["PLANNED", "EFFECTIVE", "EXPIRED", "REVOKED"], [
    field("IAM-TEMP-F-ID", "Temporary Grant ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-TEMP-F-GRANTOR-AUTHORITY", "Temporary Grantor Authority", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("IAM-TEMP-F-SUBJECT", "Temporary Subject ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-009" } }),
    field("IAM-TEMP-F-DUTY", "Temporary Duty ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-042" } }),
    field("IAM-TEMP-F-SCOPE", "Temporary Scope", { dataType: "JSON", valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-015" } }),
    field("IAM-TEMP-F-ACTIONS", "Temporary Actions", { dataType: "STRING_ARRAY" }),
    field("IAM-TEMP-F-EFFECTIVE", "Temporary Effective At", { dataType: "DATETIME" }),
    field("IAM-TEMP-F-EXPIRY", "Mandatory Expiry", { dataType: "DATETIME" }),
    field("IAM-TEMP-F-REASON", "Temporary Grant Reason"),
    field("IAM-TEMP-F-STATUS", "Temporary Grant Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
];

const iamAdminPermissions = permissions(
  "ROLE-SCHOOL-ADMIN",
  "ROLE-PLATFORM-OPS",
  "school administrator grants only duties and data scopes owned by the school",
  "platform operations has no default right to grant school or student-detail permissions",
);

const iamActions = [
  action({ id: "IAM-ACT-PREVIEW-SCOPE", label: "Preview Effective Current Data Scope", targetObjectId: "IAM-OBJ-PERMISSION-DECISION", inputFieldIds: ["IAM-DECISION-F-SUBJECT", "IAM-DECISION-F-ACTION"], outputFieldIds: ["IAM-DECISION-F-SCOPE", "IAM-DECISION-F-SOURCE-VERSIONS"], writes: false, clients: WEB_APP, permissions: permissions("CURRENT_ACTOR", "ROLE-PLATFORM-OPS", "the actor may preview only the actor's effective school scope", "platform operations cannot preview student detail without school authorization"), auditRequired: true }),
  action({ id: "IAM-ACT-GRANT-DUTY", label: "Grant an Effective Teacher Duty", targetObjectId: "IAM-OBJ-DUTY-GRANT", inputFieldIds: ["IAM-DUTY-F-GRANTOR-AUTHORITY", "IAM-DUTY-F-SUBJECT", "IAM-DUTY-F-DUTY", "IAM-DUTY-F-SCOPE", "IAM-DUTY-F-ACTIONS", "IAM-DUTY-F-EFFECTIVE", "IAM-DUTY-F-EXPIRY", "IAM-DUTY-F-REASON"], outputFieldIds: ["IAM-DUTY-F-STATUS"], permissions: iamAdminPermissions, risk: RISK.HIGH, successState: "EFFECTIVE" }),
  action({ id: "IAM-ACT-GRANT-SCOPE", label: "Grant an Object-level Data Scope", targetObjectId: "IAM-OBJ-SCOPE-GRANT", inputFieldIds: ["IAM-SCOPE-F-GRANTOR-AUTHORITY", "IAM-SCOPE-F-SUBJECT", "IAM-SCOPE-F-DUTY", "IAM-SCOPE-F-SCOPE", "IAM-SCOPE-F-ACTIONS", "IAM-SCOPE-F-EFFECTIVE", "IAM-SCOPE-F-EXPIRY", "IAM-SCOPE-F-REASON"], outputFieldIds: ["IAM-SCOPE-F-STATUS"], permissions: iamAdminPermissions, risk: RISK.HIGH, successState: "EFFECTIVE" }),
  action({ id: "IAM-ACT-CREATE-TEMP-GRANT", label: "Create a Time-bounded Temporary Grant", targetObjectId: "IAM-OBJ-TEMP-GRANT", inputFieldIds: ["IAM-TEMP-F-GRANTOR-AUTHORITY", "IAM-TEMP-F-SUBJECT", "IAM-TEMP-F-DUTY", "IAM-TEMP-F-SCOPE", "IAM-TEMP-F-ACTIONS", "IAM-TEMP-F-EFFECTIVE", "IAM-TEMP-F-EXPIRY", "IAM-TEMP-F-REASON"], outputFieldIds: ["IAM-TEMP-F-STATUS"], permissions: iamAdminPermissions, risk: RISK.HIGH, successState: "EFFECTIVE", successData: "temporary grant has explicit school owner, scope, actions, reason, and mandatory expiry" }),
  action({ id: "IAM-ACT-REVOKE-GRANT", label: "Revoke an Effective Data Scope Grant", targetObjectId: "IAM-OBJ-SCOPE-GRANT", inputFieldIds: ["IAM-SCOPE-F-ID", "IAM-SCOPE-F-REASON"], outputFieldIds: ["IAM-SCOPE-F-STATUS"], permissions: iamAdminPermissions, risk: RISK.HIGH, transition: { from: "EFFECTIVE", to: "REVOKED" } }),
  action({ id: "IAM-ACT-EXPIRE-GRANT", label: "Expire a Temporary Grant at Deadline", targetObjectId: "IAM-OBJ-TEMP-GRANT", inputFieldIds: ["IAM-TEMP-F-EXPIRY"], outputFieldIds: ["IAM-TEMP-F-STATUS"], permissions: permissions("SYSTEM", "CURRENT_ACTOR", "the system expires grants at the mandatory deadline", "a user cannot bypass or extend expiry without a new grant"), transition: { from: "EFFECTIVE", to: "EXPIRED" } }),
  action({ id: "IAM-ACT-EVALUATE-PERMISSION", label: "Evaluate Context Action Permission", targetObjectId: "IAM-OBJ-PERMISSION-DECISION", inputFieldIds: ["IAM-DECISION-F-SUBJECT", "IAM-DECISION-F-ACTION", "IAM-DECISION-F-SCOPE", "IAM-DECISION-F-SOURCE-VERSIONS"], outputFieldIds: ["IAM-DECISION-F-RESULT", "IAM-DECISION-F-REASON"], permissions: permissions("SYSTEM", "ROLE-PLATFORM-OPS", "the system evaluates role, duty, object scope, action, time, and source versions", "platform operations receives DENY for student detail without school authorization"), risk: RISK.HIGH, successState: "ALLOW", failureState: "DENY", successData: "permission decision records result, reason, and every source version used" }),
  action({ id: "IAM-ACT-REPLAY-DECISION", label: "Replay a Permission Decision from Source Versions", targetObjectId: "IAM-OBJ-PERMISSION-DECISION", inputFieldIds: ["IAM-DECISION-F-ID", "IAM-DECISION-F-SOURCE-VERSIONS"], outputFieldIds: ["IAM-DECISION-F-RESULT", "IAM-DECISION-F-REASON"], writes: false, permissions: permissions("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "school administrator may replay decisions inside school audit scope", "platform operations needs explicit school authorization to replay student-detail decisions"), auditRequired: true }),
  action({ id: "IAM-ACT-RECALCULATE-PERMISSIONS", label: "Recalculate Permissions after Organization Change", targetObjectId: "IAM-OBJ-PERMISSION-DECISION", inputFieldIds: ["IAM-DECISION-F-SOURCE-VERSIONS"], outputFieldIds: ["IAM-DECISION-F-RESULT", "IAM-DECISION-F-REASON", "IAM-DECISION-F-SOURCE-VERSIONS"], permissions: permissions("SYSTEM", "ROLE-PLATFORM-OPS", "organization source version change invalidates and recalculates affected decisions", "platform operations cannot override the recalculated school scope"), successState: "ALLOW", failureState: "DENY", successData: "affected permission decisions use the new organization versions and stale decisions are invalidated" }),
];

const iamModule = moduleFact({
  id: "IAM-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Identity, duty, and data scope",
  objective: "Evaluate every protected action from current roles, duties, object scopes, time limits, and source versions.",
  entryConditions: ["an active work context identifies school, identity, and term", "organization versions are resolvable"],
  exitConditions: ["permission decisions contain result, reason, and source versions", "temporary grants cannot outlive explicit expiry"],
  baselineDecisionIds: ["BASE-001", "BASE-007", "BASE-008"],
  nfrIds: ["NFR-008", "NFR-009"],
  defaultClients: WEB_ONLY,
  objects: iamObjects,
  relationships: [
    { id: "IAM-REL-DUTY-ROLE", fromObjectId: "IAM-OBJ-DUTY-GRANT", toObjectId: "IAM-OBJ-ROLE-POLICY", type: "EXTENDS_ROLE", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SCHOOL", onSourceInvalidation: "invalidate permission decisions based on the superseded role policy" },
    { id: "IAM-REL-TEMP-SCOPE", fromObjectId: "IAM-OBJ-TEMP-GRANT", toObjectId: "IAM-OBJ-SCOPE-GRANT", type: "TEMPORARILY_EXTENDS", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SCHOOL", onSourceInvalidation: "revoke the temporary grant when its base scope is invalidated" },
  ],
  actions: iamActions,
  pages: [
    page("IAM-PAGE-POLICY", "Login Role Policy and Effective Scope", ["IAM-OBJ-ROLE-POLICY", "IAM-OBJ-PERMISSION-DECISION"], ["IAM-ROLE-F-ROLE", "IAM-ROLE-F-ACTIONS", "IAM-ROLE-F-VERSION", "IAM-DECISION-F-SCOPE", "IAM-DECISION-F-SOURCE-VERSIONS"], ["IAM-ACT-PREVIEW-SCOPE"], WEB_APP),
    page("IAM-PAGE-DUTY-GRANT", "Teacher Duty Grant Administration", ["IAM-OBJ-DUTY-GRANT"], ["IAM-DUTY-F-GRANTOR-AUTHORITY", "IAM-DUTY-F-SUBJECT", "IAM-DUTY-F-DUTY", "IAM-DUTY-F-SCOPE", "IAM-DUTY-F-ACTIONS", "IAM-DUTY-F-EFFECTIVE", "IAM-DUTY-F-EXPIRY", "IAM-DUTY-F-REASON", "IAM-DUTY-F-STATUS"], ["IAM-ACT-GRANT-DUTY"]),
    page("IAM-PAGE-SCOPE-GRANT", "Object-level Data Scope Grant Administration", ["IAM-OBJ-SCOPE-GRANT"], ["IAM-SCOPE-F-ID", "IAM-SCOPE-F-GRANTOR-AUTHORITY", "IAM-SCOPE-F-SUBJECT", "IAM-SCOPE-F-DUTY", "IAM-SCOPE-F-SCOPE", "IAM-SCOPE-F-ACTIONS", "IAM-SCOPE-F-EFFECTIVE", "IAM-SCOPE-F-EXPIRY", "IAM-SCOPE-F-REASON", "IAM-SCOPE-F-STATUS"], ["IAM-ACT-GRANT-SCOPE", "IAM-ACT-REVOKE-GRANT"]),
    page("IAM-PAGE-TEMP-GRANT", "Time-bounded Temporary Grant Administration", ["IAM-OBJ-TEMP-GRANT"], ["IAM-TEMP-F-GRANTOR-AUTHORITY", "IAM-TEMP-F-SUBJECT", "IAM-TEMP-F-DUTY", "IAM-TEMP-F-SCOPE", "IAM-TEMP-F-ACTIONS", "IAM-TEMP-F-EFFECTIVE", "IAM-TEMP-F-EXPIRY", "IAM-TEMP-F-REASON", "IAM-TEMP-F-STATUS"], ["IAM-ACT-CREATE-TEMP-GRANT", "IAM-ACT-EXPIRE-GRANT"]),
    page("IAM-PAGE-REPLAY", "Permission Decision Replay", ["IAM-OBJ-PERMISSION-DECISION"], ["IAM-DECISION-F-SUBJECT", "IAM-DECISION-F-ACTION", "IAM-DECISION-F-RESULT", "IAM-DECISION-F-REASON", "IAM-DECISION-F-SOURCE-VERSIONS"], ["IAM-ACT-EVALUATE-PERMISSION", "IAM-ACT-REPLAY-DECISION", "IAM-ACT-RECALCULATE-PERMISSIONS"]),
  ],
});

const dgvObjects = [
  object("DGV-OBJ-POLICY", "Data Governance Policy", responsibility("SCHOOL_DATA_GOVERNANCE", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"), "LIFE-001", "S4", ["DRAFT", "ACTIVE", "SUPERSEDED"], [
    field("DGV-POLICY-F-ID", "Governance Policy ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("DGV-POLICY-F-SCHOOL-ID", "Governed School ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("DGV-POLICY-F-VERSION", "Governance Policy Version", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("DGV-POLICY-F-EXPLANATION", "Data Use Explanation", { dataType: "TEXT" }),
  ]),
  object("DGV-OBJ-RETENTION", "Data Retention Rule", responsibility("SCHOOL_RETENTION_CONFIGURATION", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"), "LIFE-001", "S4", ["UNSET", "ACTIVE", "SUPERSEDED"], [
    field("DGV-RETENTION-F-ID", "Retention Rule ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("DGV-RETENTION-F-CATEGORY", "Data Category", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-044" } }),
    field("DGV-RETENTION-F-PERIOD", "School-owned Retention Period", { dataType: "DURATION" }),
    field("DGV-RETENTION-F-ACTIVATED-BY", "Activated By School Administrator", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("DGV-RETENTION-F-STATUS", "Retention Configuration Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("DGV-OBJ-AI-RULE", "AI Data Use Rule", responsibility("SCHOOL_AI_DATA_USE", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"), "LIFE-001", "S4", ["BLOCKED_UNSET_RETENTION", "ACTIVE", "DISABLED", "SUPERSEDED"], [
    field("DGV-AI-F-ID", "AI Data Use Rule ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("DGV-AI-F-DATA-SCOPE", "Allowed AI Data Scope", { dataType: "JSON" }),
    field("DGV-AI-F-PURPOSE", "Allowed AI Purpose"),
    field("DGV-AI-F-MODEL-USE", "Model Training Use", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-045" }, validation: "must explicitly deny model training unless separately approved" }),
    field("DGV-AI-F-STATUS", "AI Data Use Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("DGV-OBJ-EXPORT", "Export Request", responsibility("EXPORT_REQUESTER_AND_SCOPED_DATA", "CURRENT_ACTOR", "CURRENT_ACTOR", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"), "LIFE-008", "S4", ["REQUESTED", "APPROVED", "DENIED", "GENERATING", "AVAILABLE", "EXPIRED", "FAILED"], [
    field("DGV-EXPORT-F-ID", "Export Request ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("DGV-EXPORT-F-SCOPE", "Export Object Scope", { dataType: "JSON" }),
    field("DGV-EXPORT-F-PURPOSE", "Export Purpose"),
    field("DGV-EXPORT-F-APPROVER", "Export Approver ID", { required: "required before APPROVED", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("DGV-EXPORT-F-DECISION-REASON", "Export Decision Reason", { dataType: "TEXT", required: "required for APPROVED or DENIED" }),
    field("DGV-EXPORT-F-EXPIRY", "Export File Expiry", { dataType: "DATETIME" }),
    field("DGV-EXPORT-F-RESULT", "Export Result", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
    field("DGV-EXPORT-F-AUDIT-REF", "Export Audit Reference", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
  ]),
];

const dgvAdminPermissions = permissions("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "school administrator owns activation governance and explicit export authorization", "platform operations has no default student-detail export or AI use access without school authorization");
const dgvActions = [
  action({ id: "DGV-ACT-VIEW-EXPLANATION", label: "View School Data Use Explanation", targetObjectId: "DGV-OBJ-POLICY", inputFieldIds: ["DGV-POLICY-F-SCHOOL-ID"], outputFieldIds: ["DGV-POLICY-F-EXPLANATION", "DGV-POLICY-F-VERSION"], writes: false, clients: WEB_APP, permissions: permissions("CURRENT_ACTOR", "ROLE-PLATFORM-OPS", "school members may view the active school explanation", "platform operations cannot view student-detail governance data without school authorization"), auditRequired: false }),
  action({ id: "DGV-ACT-CONFIGURE-RETENTION", label: "Configure School Activation Retention Periods", targetObjectId: "DGV-OBJ-RETENTION", inputFieldIds: ["DGV-RETENTION-F-CATEGORY", "DGV-RETENTION-F-PERIOD"], outputFieldIds: ["DGV-RETENTION-F-ACTIVATED-BY", "DGV-RETENTION-F-STATUS"], permissions: dgvAdminPermissions, risk: RISK.HIGH, successState: "ACTIVE", successData: "school-owned retention periods become an explicit activation configuration with no implicit defaults" }),
  action({ id: "DGV-ACT-CONFIGURE-AI-USE", label: "Configure AI Data Use Boundary", targetObjectId: "DGV-OBJ-AI-RULE", inputFieldIds: ["DGV-AI-F-DATA-SCOPE", "DGV-AI-F-PURPOSE", "DGV-AI-F-MODEL-USE"], outputFieldIds: ["DGV-AI-F-STATUS"], permissions: dgvAdminPermissions, risk: RISK.HIGH, successState: "ACTIVE", failureState: "BLOCKED_UNSET_RETENTION", successData: "AI use is enabled only for the declared scope and purpose after retention is configured", failureData: "unset retention blocks sensitive AI use and returns BLOCKED_UNSET_RETENTION" }),
  action({ id: "DGV-ACT-REQUEST-EXPORT", label: "Request a Purpose-bound Data Export", targetObjectId: "DGV-OBJ-EXPORT", inputFieldIds: ["DGV-EXPORT-F-SCOPE", "DGV-EXPORT-F-PURPOSE", "DGV-EXPORT-F-EXPIRY"], outputFieldIds: ["DGV-EXPORT-F-RESULT", "DGV-EXPORT-F-AUDIT-REF"], permissions: permissions("CURRENT_ACTOR", "ROLE-PLATFORM-OPS", "requester may request only an authorized school object scope and purpose", "platform operations cannot request student-detail export by default"), risk: RISK.HIGH, successState: "REQUESTED", failureData: "unset retention or unauthorized sensitive scope blocks the export request" }),
  action({ id: "DGV-ACT-APPROVE-EXPORT", label: "Approve a Sensitive Export Request", targetObjectId: "DGV-OBJ-EXPORT", inputFieldIds: ["DGV-EXPORT-F-ID", "DGV-EXPORT-F-APPROVER", "DGV-EXPORT-F-DECISION-REASON"], outputFieldIds: ["DGV-EXPORT-F-RESULT", "DGV-EXPORT-F-AUDIT-REF"], permissions: dgvAdminPermissions, risk: RISK.HIGH, transition: { from: "REQUESTED", to: "APPROVED" } }),
  action({ id: "DGV-ACT-DENY-EXPORT", label: "Deny a Sensitive Export Request", targetObjectId: "DGV-OBJ-EXPORT", inputFieldIds: ["DGV-EXPORT-F-ID", "DGV-EXPORT-F-APPROVER", "DGV-EXPORT-F-DECISION-REASON"], outputFieldIds: ["DGV-EXPORT-F-RESULT", "DGV-EXPORT-F-AUDIT-REF"], permissions: dgvAdminPermissions, risk: RISK.HIGH, transition: { from: "REQUESTED", to: "DENIED" } }),
  action({ id: "DGV-ACT-GENERATE-EXPORT", label: "Generate an Approved Expiring Export", targetObjectId: "DGV-OBJ-EXPORT", inputFieldIds: ["DGV-EXPORT-F-ID", "DGV-EXPORT-F-SCOPE", "DGV-EXPORT-F-EXPIRY"], outputFieldIds: ["DGV-EXPORT-F-RESULT", "DGV-EXPORT-F-AUDIT-REF"], permissions: permissions("SYSTEM", "ROLE-PLATFORM-OPS", "system generates only the approved immutable scope and expiry", "platform operations cannot expand or regenerate student detail outside approval"), risk: RISK.HIGH, successState: "AVAILABLE" }),
  action({ id: "DGV-ACT-EXPIRE-EXPORT", label: "Expire and Remove an Export File", targetObjectId: "DGV-OBJ-EXPORT", inputFieldIds: ["DGV-EXPORT-F-EXPIRY"], outputFieldIds: ["DGV-EXPORT-F-RESULT"], permissions: permissions("SYSTEM", "CURRENT_ACTOR", "system expires the file at its explicit deadline", "a user cannot extend an export file without a new request"), transition: { from: "AVAILABLE", to: "EXPIRED" } }),
];

const dgvModule = moduleFact({
  id: "DGV-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Governance, lifecycle, and AI data use",
  objective: "Make school-owned retention, sensitive export, and AI data-use decisions explicit and auditable.",
  entryConditions: ["the school administrator controls activation governance", "data categories and sensitivities are registered"],
  exitConditions: ["retention periods have explicit school-owned values", "sensitive export and AI use remain blocked while retention is unset"],
  baselineDecisionIds: ["BASE-001", "BASE-006"],
  nfrIds: ["NFR-008", "NFR-009"],
  defaultClients: WEB_ONLY,
  objects: dgvObjects,
  relationships: [
    { id: "DGV-REL-RETENTION-POLICY", fromObjectId: "DGV-OBJ-RETENTION", toObjectId: "DGV-OBJ-POLICY", type: "IMPLEMENTS", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SCHOOL", onSourceInvalidation: "block sensitive use until the new governance version is activated" },
    { id: "DGV-REL-AI-RETENTION", fromObjectId: "DGV-OBJ-AI-RULE", toObjectId: "DGV-OBJ-RETENTION", type: "REQUIRES", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SCHOOL", onSourceInvalidation: "disable AI data use immediately" },
    { id: "DGV-REL-EXPORT-POLICY", fromObjectId: "DGV-OBJ-EXPORT", toObjectId: "DGV-OBJ-POLICY", type: "AUTHORIZED_BY", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SCHOOL", onSourceInvalidation: "deny ungenerated requests and preserve completed request audit facts" },
  ],
  actions: dgvActions,
  pages: [
    page("DGV-PAGE-POLICY", "School Data Governance Policy", ["DGV-OBJ-POLICY"], ["DGV-POLICY-F-VERSION", "DGV-POLICY-F-EXPLANATION"], ["DGV-ACT-VIEW-EXPLANATION"], WEB_APP),
    page("DGV-PAGE-RETENTION", "School Activation Retention Configuration", ["DGV-OBJ-RETENTION"], ["DGV-RETENTION-F-CATEGORY", "DGV-RETENTION-F-PERIOD", "DGV-RETENTION-F-ACTIVATED-BY", "DGV-RETENTION-F-STATUS"], ["DGV-ACT-CONFIGURE-RETENTION"]),
    page("DGV-PAGE-AI-BOUNDARY", "AI Data Scope and Purpose Boundary", ["DGV-OBJ-AI-RULE"], ["DGV-AI-F-DATA-SCOPE", "DGV-AI-F-PURPOSE", "DGV-AI-F-MODEL-USE", "DGV-AI-F-STATUS"], ["DGV-ACT-CONFIGURE-AI-USE"]),
    page("DGV-PAGE-EXPORT-REQUEST", "Purpose-bound Export Request", ["DGV-OBJ-EXPORT"], ["DGV-EXPORT-F-SCOPE", "DGV-EXPORT-F-PURPOSE", "DGV-EXPORT-F-EXPIRY", "DGV-EXPORT-F-RESULT"], ["DGV-ACT-REQUEST-EXPORT"]),
    page("DGV-PAGE-EXPORT-DECISION", "Sensitive Export Approval", ["DGV-OBJ-EXPORT"], ["DGV-EXPORT-F-SCOPE", "DGV-EXPORT-F-PURPOSE", "DGV-EXPORT-F-APPROVER", "DGV-EXPORT-F-DECISION-REASON", "DGV-EXPORT-F-AUDIT-REF"], ["DGV-ACT-APPROVE-EXPORT", "DGV-ACT-DENY-EXPORT"]),
    page("DGV-PAGE-EXPORT-RESULT", "Expiring Export Result", ["DGV-OBJ-EXPORT"], ["DGV-EXPORT-F-SCOPE", "DGV-EXPORT-F-EXPIRY", "DGV-EXPORT-F-RESULT", "DGV-EXPORT-F-AUDIT-REF"], ["DGV-ACT-GENERATE-EXPORT", "DGV-ACT-EXPIRE-EXPORT"]),
    page("DGV-PAGE-EXPORT-NOTIFICATION", "Export Result Notification", ["DGV-OBJ-EXPORT"], ["DGV-EXPORT-F-EXPIRY", "DGV-EXPORT-F-RESULT"], [], WEB_APP),
  ],
});

const audObjects = [
  object("AUD-OBJ-EVENT", "Audit Event", responsibility("AUDITED_SCHOOL_ACTIVITY", "SYSTEM", "SYSTEM", "SYSTEM", "ROLE-SCHOOL-ADMIN"), "LIFE-004", "S4", ["ACCEPTED", "ARCHIVED"], [
    field("AUD-EVENT-F-ID", "Audit Event ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-EVENT-F-TIME", "Event Time", { dataType: "DATETIME", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-EVENT-F-ACTOR", "Actor ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-EVENT-F-ACTION", "Audited Action", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-EVENT-F-SCOPE", "Audited Object Scope", { dataType: "JSON", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-EVENT-F-RESULT", "Audited Result", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
  ]),
  object("AUD-OBJ-ACCESS-REQUEST", "Sensitive Access Request", responsibility("ACCESS_REQUESTER_AND_SCOPED_DATA", "CURRENT_ACTOR", "CURRENT_ACTOR", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"), "LIFE-004", "S4", ["REQUESTED", "APPROVED", "DENIED", "EXPIRED"], [
    field("AUD-REQUEST-F-ID", "Sensitive Access Request ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-REQUEST-F-REQUESTER", "Access Requester ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-REQUEST-F-SCOPE", "Requested Sensitive Scope", { dataType: "JSON" }),
    field("AUD-REQUEST-F-PURPOSE", "Sensitive Access Purpose"),
    field("AUD-REQUEST-F-EXPIRY", "Requested Access Expiry", { dataType: "DATETIME" }),
    field("AUD-REQUEST-F-APPROVER", "School Approver ID", { required: "required before APPROVED", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-REQUEST-F-DECISION-REASON", "Sensitive Access Decision Reason", { dataType: "TEXT", required: "required for APPROVED or DENIED" }),
    field("AUD-REQUEST-F-RESULT", "Access Decision Result", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("AUD-OBJ-ACCESS-SESSION", "Sensitive Access Session", responsibility("APPROVED_SENSITIVE_ACCESS", "SYSTEM", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"), "LIFE-004", "S4", ["PENDING", "ACTIVE", "EXPIRED", "REVOKED"], [
    field("AUD-SESSION-F-ID", "Sensitive Session ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-SESSION-F-REQUEST-ID", "Approved Request ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-SESSION-F-SCOPE", "Session Object Scope", { dataType: "JSON", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-SESSION-F-START", "Session Start", { dataType: "DATETIME", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-SESSION-F-EXPIRY", "Session Expiry", { dataType: "DATETIME", valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-SESSION-F-STATUS", "Session Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("AUD-OBJ-REVIEW", "Audit Review Case", responsibility("AUDIT_REVIEW_CASE", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN", "ROLE-SCHOOL-ADMIN"), "LIFE-004", "S4", ["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"], [
    field("AUD-REVIEW-F-ID", "Review Case ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("AUD-REVIEW-F-EVENT-IDS", "Related Audit Event IDs", { dataType: "STRING_ARRAY" }),
    field("AUD-REVIEW-F-REASON", "Review Reason"),
    field("AUD-REVIEW-F-RESOLUTION", "Review Resolution", { required: "required before RESOLVED" }),
    field("AUD-REVIEW-F-STATUS", "Review Case Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
];

const audSchoolPermissions = permissions("ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS", "school administrator acts inside school audit scope", "platform operations has no default student-detail access and requires school authorization, limited scope and time");
const audActions = [
  action({ id: "AUD-ACT-APPEND-EVENT", label: "Append an Immutable Audit Event", targetObjectId: "AUD-OBJ-EVENT", inputFieldIds: ["AUD-EVENT-F-ACTOR", "AUD-EVENT-F-ACTION", "AUD-EVENT-F-SCOPE", "AUD-EVENT-F-RESULT"], outputFieldIds: ["AUD-EVENT-F-ID", "AUD-EVENT-F-TIME"], permissions: permissions("SYSTEM", "CURRENT_ACTOR", "system append is mandatory for audited actions", "no user may update or delete an accepted immutable audit event"), risk: RISK.HIGH, successState: "ACCEPTED", successData: "immutable audit event is appended before the audited result is final" }),
  action({ id: "AUD-ACT-QUERY-AUDIT", label: "Query Authorized Audit Events", targetObjectId: "AUD-OBJ-EVENT", inputFieldIds: ["AUD-EVENT-F-SCOPE", "AUD-EVENT-F-ACTOR", "AUD-EVENT-F-ACTION"], outputFieldIds: ["AUD-EVENT-F-ID", "AUD-EVENT-F-TIME", "AUD-EVENT-F-RESULT"], writes: false, permissions: audSchoolPermissions, auditRequired: true }),
  action({ id: "AUD-ACT-REQUEST-SENSITIVE", label: "Request Time-limited Sensitive Access", targetObjectId: "AUD-OBJ-ACCESS-REQUEST", inputFieldIds: ["AUD-REQUEST-F-SCOPE", "AUD-REQUEST-F-PURPOSE", "AUD-REQUEST-F-EXPIRY"], outputFieldIds: ["AUD-REQUEST-F-RESULT"], clients: WEB_APP, permissions: permissions("ROLE-PLATFORM-OPS", "ROLE-PLATFORM-OPS", "platform operations may request but not self-approve explicitly limited school scope and time", "platform operations has no default student-detail access without a school-approved request"), risk: RISK.HIGH, successState: "REQUESTED", successData: "request remains non-executable until school authorization" }),
  action({ id: "AUD-ACT-APPROVE-SENSITIVE", label: "Approve Limited Sensitive Access", targetObjectId: "AUD-OBJ-ACCESS-REQUEST", inputFieldIds: ["AUD-REQUEST-F-ID", "AUD-REQUEST-F-APPROVER", "AUD-REQUEST-F-SCOPE", "AUD-REQUEST-F-EXPIRY", "AUD-REQUEST-F-DECISION-REASON"], outputFieldIds: ["AUD-REQUEST-F-RESULT"], permissions: audSchoolPermissions, risk: RISK.HIGH, transition: { from: "REQUESTED", to: "APPROVED" } }),
  action({ id: "AUD-ACT-DENY-SENSITIVE", label: "Deny Sensitive Access", targetObjectId: "AUD-OBJ-ACCESS-REQUEST", inputFieldIds: ["AUD-REQUEST-F-ID", "AUD-REQUEST-F-APPROVER", "AUD-REQUEST-F-DECISION-REASON"], outputFieldIds: ["AUD-REQUEST-F-RESULT"], permissions: audSchoolPermissions, risk: RISK.HIGH, transition: { from: "REQUESTED", to: "DENIED" } }),
  action({ id: "AUD-ACT-OPEN-SESSION", label: "Open an Approved Sensitive Access Session", targetObjectId: "AUD-OBJ-ACCESS-SESSION", inputFieldIds: ["AUD-SESSION-F-REQUEST-ID", "AUD-SESSION-F-SCOPE", "AUD-SESSION-F-EXPIRY"], outputFieldIds: ["AUD-SESSION-F-ID", "AUD-SESSION-F-START", "AUD-SESSION-F-STATUS"], permissions: permissions("SYSTEM", "ROLE-PLATFORM-OPS", "system opens only the school-approved scope and time and requires immutable audit", "platform operations cannot widen the approved student-detail scope"), risk: RISK.HIGH, successState: "ACTIVE" }),
  action({ id: "AUD-ACT-EXPIRE-SESSION", label: "Expire a Sensitive Access Session", targetObjectId: "AUD-OBJ-ACCESS-SESSION", inputFieldIds: ["AUD-SESSION-F-EXPIRY"], outputFieldIds: ["AUD-SESSION-F-STATUS"], permissions: permissions("SYSTEM", "ROLE-PLATFORM-OPS", "system expires the session at the approved deadline", "platform operations cannot extend a sensitive session directly"), transition: { from: "ACTIVE", to: "EXPIRED" }, risk: RISK.HIGH }),
  action({ id: "AUD-ACT-CREATE-REVIEW", label: "Create an Audit Review Case", targetObjectId: "AUD-OBJ-REVIEW", inputFieldIds: ["AUD-REVIEW-F-EVENT-IDS", "AUD-REVIEW-F-REASON"], outputFieldIds: ["AUD-REVIEW-F-STATUS"], permissions: audSchoolPermissions, risk: RISK.HIGH, successState: "OPEN" }),
  action({ id: "AUD-ACT-RESOLVE-REVIEW", label: "Resolve an Audit Review Case", targetObjectId: "AUD-OBJ-REVIEW", inputFieldIds: ["AUD-REVIEW-F-ID", "AUD-REVIEW-F-RESOLUTION"], outputFieldIds: ["AUD-REVIEW-F-STATUS"], permissions: audSchoolPermissions, risk: RISK.HIGH, transition: { from: "INVESTIGATING", to: "RESOLVED" } }),
  action({ id: "AUD-ACT-EXPORT-SUMMARY", label: "Export an Authorized Audit Summary", targetObjectId: "AUD-OBJ-REVIEW", inputFieldIds: ["AUD-REVIEW-F-ID", "AUD-REVIEW-F-EVENT-IDS"], outputFieldIds: ["AUD-REVIEW-F-RESOLUTION"], permissions: audSchoolPermissions, risk: RISK.HIGH, successState: "RESOLVED", successData: "summary excludes unauthorized student detail and retains immutable source event references" }),
];

const audModule = moduleFact({
  id: "AUD-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Audit and sensitive access",
  objective: "Append immutable audit facts and gate sensitive access by school authorization, scope, and time.",
  entryConditions: ["audit storage accepts append-only events", "sensitive access starts with no default platform-operations student detail"],
  exitConditions: ["all sensitive sessions are bounded by approved scope and expiry", "review outcomes retain immutable source event references"],
  baselineDecisionIds: ["BASE-001", "BASE-007", "BASE-008"],
  nfrIds: ["NFR-008", "NFR-009"],
  defaultClients: WEB_ONLY,
  objects: audObjects,
  relationships: [
    { id: "AUD-REL-SESSION-REQUEST", fromObjectId: "AUD-OBJ-ACCESS-SESSION", toObjectId: "AUD-OBJ-ACCESS-REQUEST", type: "AUTHORIZED_BY", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SCHOOL", onSourceInvalidation: "expire the active session immediately" },
    { id: "AUD-REL-REVIEW-EVENT", fromObjectId: "AUD-OBJ-REVIEW", toObjectId: "AUD-OBJ-EVENT", type: "REVIEWS", cardinality: "MANY_TO_MANY", ownershipScope: "SAME_SCHOOL", onSourceInvalidation: "immutable accepted events cannot be invalidated; archive preserves references" },
  ],
  actions: audActions,
  pages: [
    page("AUD-PAGE-SEARCH", "Authorized Audit Event Search", ["AUD-OBJ-EVENT"], ["AUD-EVENT-F-TIME", "AUD-EVENT-F-ACTOR", "AUD-EVENT-F-ACTION", "AUD-EVENT-F-SCOPE", "AUD-EVENT-F-RESULT"], ["AUD-ACT-QUERY-AUDIT", "AUD-ACT-APPEND-EVENT"]),
    page("AUD-PAGE-ACCESS-REQUEST", "Time-limited Sensitive Access Request", ["AUD-OBJ-ACCESS-REQUEST"], ["AUD-REQUEST-F-REQUESTER", "AUD-REQUEST-F-SCOPE", "AUD-REQUEST-F-PURPOSE", "AUD-REQUEST-F-EXPIRY", "AUD-REQUEST-F-RESULT"], ["AUD-ACT-REQUEST-SENSITIVE"], WEB_APP),
    page("AUD-PAGE-ACCESS-APPROVAL", "School Sensitive Access Approval", ["AUD-OBJ-ACCESS-REQUEST"], ["AUD-REQUEST-F-SCOPE", "AUD-REQUEST-F-PURPOSE", "AUD-REQUEST-F-EXPIRY", "AUD-REQUEST-F-APPROVER", "AUD-REQUEST-F-DECISION-REASON", "AUD-REQUEST-F-RESULT"], ["AUD-ACT-APPROVE-SENSITIVE", "AUD-ACT-DENY-SENSITIVE"]),
    page("AUD-PAGE-ACTIVE-SESSION", "Active Sensitive Access Session", ["AUD-OBJ-ACCESS-SESSION"], ["AUD-SESSION-F-SCOPE", "AUD-SESSION-F-START", "AUD-SESSION-F-EXPIRY", "AUD-SESSION-F-STATUS"], ["AUD-ACT-OPEN-SESSION", "AUD-ACT-EXPIRE-SESSION"]),
    page("AUD-PAGE-REVIEW", "Audit Review Case Investigation", ["AUD-OBJ-REVIEW"], ["AUD-REVIEW-F-EVENT-IDS", "AUD-REVIEW-F-REASON", "AUD-REVIEW-F-RESOLUTION", "AUD-REVIEW-F-STATUS"], ["AUD-ACT-CREATE-REVIEW", "AUD-ACT-RESOLVE-REVIEW", "AUD-ACT-EXPORT-SUMMARY"]),
  ],
});

const currObjects = [
  object("CURR-OBJ-CURRICULUM", "Curriculum Version", responsibility("SUBJECT_CURRICULUM", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC", "ROLE-ACADEMIC"), "LIFE-003", "S2", ["DRAFT", "VALIDATING", "VALIDATED", "PUBLISHED", "DEPRECATED"], [
    field("CURR-CURRICULUM-F-ID", "Curriculum Version ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("CURR-CURRICULUM-F-NAME", "Curriculum Version Name"),
    field("CURR-CURRICULUM-F-SUBJECT", "Curriculum Subject", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-007" } }),
    field("CURR-CURRICULUM-F-STATUS", "Curriculum Version Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
    field("CURR-CURRICULUM-F-VALIDATION", "Version Validation Result", { dataType: "JSON", valueSource: { kind: "SYSTEM" }, mutability: "READ_ONLY" }),
    field("CURR-CURRICULUM-F-PUBLISHED-AT", "Published At", { dataType: "DATETIME", required: false, valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
  ]),
  object("CURR-OBJ-TEXTBOOK", "Textbook Version", responsibility("SUBJECT_CURRICULUM", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD"), "LIFE-003", "S2", ["DRAFT", "ACTIVE", "DEPRECATED"], [
    field("CURR-TEXTBOOK-F-ID", "Textbook Version ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("CURR-TEXTBOOK-F-CURRICULUM-ID", "Curriculum Version ID", { valueSource: { kind: "SYSTEM" } }),
    field("CURR-TEXTBOOK-F-NAME", "Textbook Name"),
    field("CURR-TEXTBOOK-F-EDITION", "Textbook Edition"),
    field("CURR-TEXTBOOK-F-STATUS", "Textbook Version Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("CURR-OBJ-CHAPTER", "Chapter", responsibility("SUBJECT_CURRICULUM", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD"), "LIFE-003", "S2", ["DRAFT", "ACTIVE", "DEPRECATED"], [
    field("CURR-CHAPTER-F-ID", "Chapter ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("CURR-CHAPTER-F-TEXTBOOK-ID", "Textbook Version ID", { valueSource: { kind: "SYSTEM" } }),
    field("CURR-CHAPTER-F-TITLE", "Chapter Title"),
    field("CURR-CHAPTER-F-ORDER", "Chapter Order", { dataType: "INTEGER" }),
    field("CURR-CHAPTER-F-STATUS", "Chapter Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("CURR-OBJ-KNOWLEDGE-POINT", "Knowledge Point", responsibility("SUBJECT_CURRICULUM", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD"), "LIFE-003", "S2", ["DRAFT", "ACTIVE", "DEPRECATED"], [
    field("CURR-KP-F-ID", "Knowledge Point ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("CURR-KP-F-NAME", "Knowledge Point Name"),
    field("CURR-KP-F-DEFINITION", "Knowledge Point Definition", { dataType: "TEXT" }),
    field("CURR-KP-F-PARENT-ID", "Parent Knowledge Point ID", { required: false }),
    field("CURR-KP-F-STATUS", "Knowledge Point Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("CURR-OBJ-MAPPING", "Knowledge Mapping", responsibility("SUBJECT_CURRICULUM", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD", "DUTY-SUBJECT-LEAD"), "LIFE-003", "S2", ["DRAFT", "VALIDATED", "PUBLISHED", "DEPRECATED"], [
    field("CURR-MAPPING-F-ID", "Knowledge Mapping ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("CURR-MAPPING-F-CHAPTER-ID", "Mapped Chapter ID"),
    field("CURR-MAPPING-F-KP-ID", "Mapped Knowledge Point ID", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-011" } }),
    field("CURR-MAPPING-F-RELATION", "Mapping Relation", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-043" } }),
    field("CURR-MAPPING-F-VERSION", "Mapping Source Version", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("CURR-MAPPING-F-STATUS", "Mapping Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
];

const currAdminPermissions = permissions("ROLE-ACADEMIC", "ROLE-PLATFORM-OPS", "academic staff maintains curriculum facts inside school and subject scope", "platform operations cannot change school curriculum facts by default");
const currSubjectPermissions = [
  { effect: "ALLOW", dutyRef: "DUTY-SUBJECT-LEAD", condition: "subject lead may validate and review only the assigned subject curriculum version" },
  { effect: "ALLOW", roleRef: "ROLE-ACADEMIC", condition: "academic staff may publish an approved school curriculum version" },
  { effect: "DENY", roleRef: "ROLE-PLATFORM-OPS", condition: "platform operations cannot publish a school subject version without school authorization" },
];
const currActions = [
  action({ id: "CURR-ACT-CREATE-DRAFT", label: "Create a Curriculum Version Draft", targetObjectId: "CURR-OBJ-CURRICULUM", inputFieldIds: ["CURR-CURRICULUM-F-NAME", "CURR-CURRICULUM-F-SUBJECT"], outputFieldIds: ["CURR-CURRICULUM-F-STATUS"], permissions: currAdminPermissions, successState: "DRAFT" }),
  action({ id: "CURR-ACT-ADD-TEXTBOOK", label: "Add a Textbook Version to Curriculum", targetObjectId: "CURR-OBJ-TEXTBOOK", inputFieldIds: ["CURR-TEXTBOOK-F-CURRICULUM-ID", "CURR-TEXTBOOK-F-NAME", "CURR-TEXTBOOK-F-EDITION"], outputFieldIds: ["CURR-TEXTBOOK-F-STATUS"], permissions: currAdminPermissions, successState: "DRAFT" }),
  action({ id: "CURR-ACT-MANAGE-CHAPTERS", label: "Create or Reorder Textbook Chapters", targetObjectId: "CURR-OBJ-CHAPTER", inputFieldIds: ["CURR-CHAPTER-F-TEXTBOOK-ID", "CURR-CHAPTER-F-TITLE", "CURR-CHAPTER-F-ORDER"], outputFieldIds: ["CURR-CHAPTER-F-STATUS"], permissions: currAdminPermissions, successState: "DRAFT" }),
  action({ id: "CURR-ACT-MANAGE-KNOWLEDGE", label: "Create or Version Knowledge Points", targetObjectId: "CURR-OBJ-KNOWLEDGE-POINT", inputFieldIds: ["CURR-KP-F-NAME", "CURR-KP-F-DEFINITION", "CURR-KP-F-PARENT-ID"], outputFieldIds: ["CURR-KP-F-STATUS"], permissions: currSubjectPermissions, successState: "DRAFT" }),
  action({ id: "CURR-ACT-CREATE-MAPPING", label: "Map a Chapter to a Knowledge Point", targetObjectId: "CURR-OBJ-MAPPING", inputFieldIds: ["CURR-MAPPING-F-CHAPTER-ID", "CURR-MAPPING-F-KP-ID", "CURR-MAPPING-F-RELATION"], outputFieldIds: ["CURR-MAPPING-F-VERSION", "CURR-MAPPING-F-STATUS"], permissions: currSubjectPermissions, successState: "DRAFT" }),
  action({ id: "CURR-ACT-VALIDATE-MAPPING", label: "Validate Knowledge Mapping Publication Readiness", targetObjectId: "CURR-OBJ-MAPPING", inputFieldIds: ["CURR-MAPPING-F-ID", "CURR-MAPPING-F-VERSION"], outputFieldIds: ["CURR-MAPPING-F-STATUS"], permissions: currSubjectPermissions, risk: RISK.HIGH, transition: { from: "DRAFT", to: "VALIDATED" }, successData: "mapping validation confirms chapter, knowledge point, relation, and source version resolve before publication" }),
  action({ id: "CURR-ACT-VALIDATE-VERSION", label: "Validate Curriculum Publication Readiness", targetObjectId: "CURR-OBJ-CURRICULUM", inputFieldIds: ["CURR-CURRICULUM-F-ID"], outputFieldIds: ["CURR-CURRICULUM-F-VALIDATION", "CURR-CURRICULUM-F-STATUS"], permissions: currSubjectPermissions, risk: RISK.HIGH, transition: { from: "DRAFT", to: "VALIDATED" }, successData: "validation confirms textbook, chapter, knowledge point, and mapping references resolve in one version" }),
  action({ id: "CURR-ACT-PUBLISH-MAPPING", label: "Publish a Validated Knowledge Mapping", targetObjectId: "CURR-OBJ-MAPPING", inputFieldIds: ["CURR-MAPPING-F-ID", "CURR-MAPPING-F-VERSION"], outputFieldIds: ["CURR-MAPPING-F-STATUS"], permissions: currSubjectPermissions, risk: RISK.HIGH, transition: { from: "VALIDATED", to: "PUBLISHED" }, successData: "the usable mapping version is published before curriculum activation and historical references remain immutable" }),
  action({ id: "CURR-ACT-PUBLISH-VERSION", label: "Publish a Validated Curriculum Version", targetObjectId: "CURR-OBJ-CURRICULUM", inputFieldIds: ["CURR-CURRICULUM-F-ID", "CURR-CURRICULUM-F-VALIDATION"], outputFieldIds: ["CURR-CURRICULUM-F-STATUS", "CURR-CURRICULUM-F-PUBLISHED-AT"], permissions: currSubjectPermissions, risk: RISK.HIGH, transition: { from: "VALIDATED", to: "PUBLISHED" }, successData: "published version becomes selectable; historical assignment and evidence references are immutable and never rewrite to the new version", failureData: "publication failure leaves historical references unchanged and the prior published version active" }),
  action({ id: "CURR-ACT-DEPRECATE-VERSION", label: "Deprecate a Published Curriculum Version", targetObjectId: "CURR-OBJ-CURRICULUM", inputFieldIds: ["CURR-CURRICULUM-F-ID"], outputFieldIds: ["CURR-CURRICULUM-F-STATUS"], permissions: currSubjectPermissions, risk: RISK.HIGH, transition: { from: "PUBLISHED", to: "DEPRECATED" }, successData: "deprecated version is blocked for new work while historical assignment and evidence references remain immutable" }),
  action({ id: "CURR-ACT-VIEW-KNOWLEDGE-PATH", label: "View Student or Teacher Knowledge Path", targetObjectId: "CURR-OBJ-MAPPING", inputFieldIds: ["CURR-MAPPING-F-VERSION"], outputFieldIds: ["CURR-MAPPING-F-CHAPTER-ID", "CURR-MAPPING-F-KP-ID", "CURR-MAPPING-F-RELATION"], writes: false, clients: WEB_APP, permissions: permissions("CURRENT_ACTOR", "ROLE-PLATFORM-OPS", "student and teacher views resolve the historically referenced published mapping version", "platform operations cannot view student learning path detail without school authorization"), auditRequired: true }),
];

const currModule = moduleFact({
  id: "CURR-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Curriculum, textbook, and knowledge map",
  objective: "Publish versioned curriculum maps without rewriting historical teaching or evidence references.",
  entryConditions: ["academic staff has an active subject scope", "textbook and knowledge point source versions are explicit"],
  exitConditions: ["a published curriculum version is immutable", "historical assignment and evidence references continue to resolve their original version"],
  baselineDecisionIds: ["BASE-003", "BASE-007", "BASE-009"],
  nfrIds: ["NFR-002", "NFR-008"],
  defaultClients: WEB_ONLY,
  objects: currObjects,
  relationships: [
    { id: "CURR-REL-TEXTBOOK-CURRICULUM", fromObjectId: "CURR-OBJ-TEXTBOOK", toObjectId: "CURR-OBJ-CURRICULUM", type: "VERSION_MEMBER", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SUBJECT", onSourceInvalidation: "block publication while preserving previously published historical references" },
    { id: "CURR-REL-CHAPTER-TEXTBOOK", fromObjectId: "CURR-OBJ-CHAPTER", toObjectId: "CURR-OBJ-TEXTBOOK", type: "PART_OF", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SUBJECT", onSourceInvalidation: "mark draft mappings stale without rewriting published mappings" },
    { id: "CURR-REL-MAPPING-KP", fromObjectId: "CURR-OBJ-MAPPING", toObjectId: "CURR-OBJ-KNOWLEDGE-POINT", type: "MAPS_TO", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_SUBJECT", onSourceInvalidation: "create a new mapping version and retain historical references" },
  ],
  actions: currActions,
  pages: [
    page("CURR-PAGE-VERSIONS", "Curriculum Version Management", ["CURR-OBJ-CURRICULUM"], ["CURR-CURRICULUM-F-NAME", "CURR-CURRICULUM-F-SUBJECT", "CURR-CURRICULUM-F-STATUS", "CURR-CURRICULUM-F-PUBLISHED-AT"], ["CURR-ACT-CREATE-DRAFT", "CURR-ACT-DEPRECATE-VERSION"]),
    page("CURR-PAGE-TEXTBOOK-TREE", "Textbook and Chapter Version Tree", ["CURR-OBJ-TEXTBOOK", "CURR-OBJ-CHAPTER"], ["CURR-TEXTBOOK-F-NAME", "CURR-TEXTBOOK-F-EDITION", "CURR-CHAPTER-F-TITLE", "CURR-CHAPTER-F-ORDER"], ["CURR-ACT-ADD-TEXTBOOK", "CURR-ACT-MANAGE-CHAPTERS"]),
    page("CURR-PAGE-KP-EDITOR", "Knowledge Point Version Editor", ["CURR-OBJ-KNOWLEDGE-POINT"], ["CURR-KP-F-NAME", "CURR-KP-F-DEFINITION", "CURR-KP-F-PARENT-ID", "CURR-KP-F-STATUS"], ["CURR-ACT-MANAGE-KNOWLEDGE"]),
    page("CURR-PAGE-MAPPING", "Chapter Knowledge Mapping Review", ["CURR-OBJ-MAPPING"], ["CURR-MAPPING-F-CHAPTER-ID", "CURR-MAPPING-F-KP-ID", "CURR-MAPPING-F-RELATION", "CURR-MAPPING-F-STATUS"], ["CURR-ACT-CREATE-MAPPING"]),
    page("CURR-PAGE-PUBLISH", "Curriculum and Mapping Publication Preview", ["CURR-OBJ-CURRICULUM", "CURR-OBJ-MAPPING"], ["CURR-CURRICULUM-F-VALIDATION", "CURR-CURRICULUM-F-STATUS", "CURR-CURRICULUM-F-PUBLISHED-AT", "CURR-MAPPING-F-VERSION", "CURR-MAPPING-F-STATUS"], ["CURR-ACT-VALIDATE-MAPPING", "CURR-ACT-VALIDATE-VERSION", "CURR-ACT-PUBLISH-MAPPING", "CURR-ACT-PUBLISH-VERSION"]),
    page("CURR-PAGE-PATH", "Published Knowledge Path Viewer", ["CURR-OBJ-MAPPING"], ["CURR-MAPPING-F-CHAPTER-ID", "CURR-MAPPING-F-KP-ID", "CURR-MAPPING-F-RELATION", "CURR-MAPPING-F-VERSION"], ["CURR-ACT-VIEW-KNOWLEDGE-PATH"], WEB_APP),
  ],
});

const teaObjects = [
  object("TEA-OBJ-TODO-VIEW", "Teacher Todo View Definition", responsibility("CURRENT_TEACHER_WORK_VIEW", "SYSTEM", "SYSTEM", "SYSTEM", "SYSTEM"), "LIFE-001", "S2", ["ACTIVE", "SUPERSEDED"], [
    field("TEA-TODO-F-ID", "Todo View Definition ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("TEA-TODO-F-TEACHER-ID", "Teacher ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("TEA-TODO-F-SUBJECT-SCOPE", "Subject Assignment Scope", { dataType: "JSON", valueSource: { kind: "SYSTEM" }, mutability: "READ_ONLY" }),
    field("TEA-TODO-F-SOURCE-REFS", "External Todo Source References", { dataType: "JSON", valueSource: { kind: "SYSTEM" }, mutability: "READ_ONLY", historyPolicy: "retain source identifiers only and never copy professional facts" }),
    field("TEA-TODO-F-FILTER", "Todo View Filter", { dataType: "JSON", required: false }),
  ]),
  object("TEA-OBJ-COORDINATION", "Homeroom Coordination Item", responsibility("HOMEROOM_CLASS_COORDINATION", "CURRENT_ACTOR", "DUTY-HOMEROOM", "DUTY-HOMEROOM", "ROLE-SCHOOL-ADMIN"), "LIFE-003", "S3", ["OPEN", "IN_PROGRESS", "CLOSED", "CANCELLED"], [
    field("TEA-COORD-F-ID", "Coordination Item ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("TEA-COORD-F-CLASS-ID", "Coordinated Class ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("TEA-COORD-F-SUBJECT-REFS", "Referenced Subject Facts", { dataType: "JSON", valueSource: { kind: "SYSTEM" }, mutability: "READ_ONLY", historyPolicy: "retain references and never copy subject professional facts" }),
    field("TEA-COORD-F-TITLE", "Coordination Title"),
    field("TEA-COORD-F-NOTE", "Coordination Note", { dataType: "TEXT" }),
    field("TEA-COORD-F-STATUS", "Coordination Status", { valueSource: { kind: "SYSTEM" }, mutability: "SYSTEM_MANAGED" }),
  ]),
  object("TEA-OBJ-PREFERENCE", "Teacher Work Preference", responsibility("CURRENT_TEACHER_PREFERENCE", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR", "CURRENT_ACTOR"), "LIFE-001", "S2", ["ACTIVE", "SUPERSEDED"], [
    field("TEA-PREF-F-ID", "Work Preference ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("TEA-PREF-F-TEACHER-ID", "Preference Teacher ID", { valueSource: { kind: "SYSTEM" }, mutability: "IMMUTABLE" }),
    field("TEA-PREF-F-DEFAULT-VIEW", "Default Workspace View", { valueSource: { kind: "OPTION_SET", optionSetId: "OPT-ENUM-046" } }),
    field("TEA-PREF-F-FILTERS", "Saved Workspace Filters", { dataType: "JSON", required: false }),
  ]),
];

const teaActions = [
  action({ id: "TEA-ACT-QUERY-SUBJECT-TODOS", label: "Query Assigned Subject Teacher Todos", targetObjectId: "TEA-OBJ-TODO-VIEW", inputFieldIds: ["TEA-TODO-F-TEACHER-ID", "TEA-TODO-F-SUBJECT-SCOPE", "TEA-TODO-F-FILTER"], outputFieldIds: ["TEA-TODO-F-SOURCE-REFS"], writes: false, clients: WEB_APP, permissions: [
    { effect: "ALLOW", dutyRef: "DUTY-SUBJECT-TEACHER", condition: "subject teacher reads referenced tasks only in assigned subject and class scope" },
    { effect: "ALLOW", dutyRef: "DUTY-SUBJECT-LEAD", condition: "subject lead reads referenced subject-wide queue facts without changing teacher-owned facts" },
    { effect: "DENY", roleRef: "ROLE-PLATFORM-OPS", condition: "platform operations cannot read teacher or student work detail without school authorization" },
  ], auditRequired: false, successData: "todo view returns references to source tasks and never copies score, evidence, or plan facts" }),
  action({ id: "TEA-ACT-QUERY-HOMEROOM-SUMMARY", label: "Query Homeroom Whole-subject Summary", targetObjectId: "TEA-OBJ-COORDINATION", inputFieldIds: ["TEA-COORD-F-CLASS-ID"], outputFieldIds: ["TEA-COORD-F-SUBJECT-REFS"], writes: false, clients: WEB_APP, permissions: permissions("DUTY-HOMEROOM", "ROLE-PLATFORM-OPS", "homeroom duty may read all-subject references for the assigned class", "platform operations has no default student-detail or all-subject class access"), auditRequired: true, successData: "homeroom view resolves all-subject references without copying professional facts" }),
  action({ id: "TEA-ACT-CREATE-COORDINATION", label: "Create a Homeroom Coordination Item", targetObjectId: "TEA-OBJ-COORDINATION", inputFieldIds: ["TEA-COORD-F-CLASS-ID", "TEA-COORD-F-SUBJECT-REFS", "TEA-COORD-F-TITLE", "TEA-COORD-F-NOTE"], outputFieldIds: ["TEA-COORD-F-STATUS"], clients: WEB_APP, permissions: permissions("DUTY-HOMEROOM", "DUTY-HOMEROOM", "homeroom duty may create coordination notes for the assigned class", "homeroom duty cannot write another subject's professional facts, scores, evidence, or plans"), successState: "OPEN", successData: "coordination item stores references and coordination notes only" }),
  action({ id: "TEA-ACT-UPDATE-COORDINATION", label: "Update a Homeroom Coordination Note", targetObjectId: "TEA-OBJ-COORDINATION", inputFieldIds: ["TEA-COORD-F-ID", "TEA-COORD-F-TITLE", "TEA-COORD-F-NOTE"], outputFieldIds: ["TEA-COORD-F-STATUS"], clients: WEB_APP, permissions: permissions("DUTY-HOMEROOM", "DUTY-HOMEROOM", "homeroom duty may update coordination-owned notes for the assigned class", "homeroom duty cannot write or overwrite other subject professional facts" ), successState: "IN_PROGRESS" }),
  action({ id: "TEA-ACT-CLOSE-COORDINATION", label: "Close a Resolved Homeroom Coordination Item", targetObjectId: "TEA-OBJ-COORDINATION", inputFieldIds: ["TEA-COORD-F-ID", "TEA-COORD-F-NOTE"], outputFieldIds: ["TEA-COORD-F-STATUS"], clients: WEB_APP, permissions: permissions("DUTY-HOMEROOM", "DUTY-SUBJECT-TEACHER", "homeroom duty closes only coordination-owned items for the assigned class", "subject teacher cannot close a homeroom coordination item but retains ownership of subject facts"), transition: { from: "IN_PROGRESS", to: "CLOSED" } }),
  action({ id: "TEA-ACT-SAVE-PREFERENCE", label: "Save Teacher Workspace Preference", targetObjectId: "TEA-OBJ-PREFERENCE", inputFieldIds: ["TEA-PREF-F-DEFAULT-VIEW", "TEA-PREF-F-FILTERS"], permissions: permissions("ROLE-TEACHER", "ROLE-PLATFORM-OPS", "teacher changes only the teacher's own workspace preference", "platform operations cannot change a teacher's personal work preference"), successState: "ACTIVE" }),
];

const teaModule = moduleFact({
  id: "TEA-001",
  phase: PHASE.FIRST,
  priority: "P0",
  title: "Teacher and homeroom workbench",
  objective: "Own teacher view definitions, preferences, and coordination items while referencing professional facts at source.",
  entryConditions: ["teacher duties and organization scope are effective", "source modules expose authorized references without copying facts"],
  exitConditions: ["teacher work views retain source references only", "homeroom coordination never writes another subject's professional facts"],
  baselineDecisionIds: ["BASE-007", "BASE-008", "BASE-009"],
  nfrIds: ["NFR-002", "NFR-008"],
  defaultClients: WEB_ONLY,
  objects: teaObjects,
  relationships: [
    { id: "TEA-REL-COORDINATION-VIEW", fromObjectId: "TEA-OBJ-COORDINATION", toObjectId: "TEA-OBJ-TODO-VIEW", type: "APPEARS_IN", cardinality: "MANY_TO_MANY", ownershipScope: "SAME_CONTEXT", onSourceInvalidation: "refresh source references without copying or rewriting source facts" },
    { id: "TEA-REL-PREFERENCE-VIEW", fromObjectId: "TEA-OBJ-PREFERENCE", toObjectId: "TEA-OBJ-TODO-VIEW", type: "CONFIGURES", cardinality: "MANY_TO_ONE", ownershipScope: "SAME_CONTEXT", onSourceInvalidation: "fall back to the default view while preserving the preference version" },
  ],
  actions: teaActions,
  pages: [
    page("TEA-PAGE-TODAY", "Teacher Today Workspace", ["TEA-OBJ-TODO-VIEW", "TEA-OBJ-PREFERENCE"], ["TEA-TODO-F-SUBJECT-SCOPE", "TEA-TODO-F-SOURCE-REFS", "TEA-TODO-F-FILTER", "TEA-PREF-F-DEFAULT-VIEW"], ["TEA-ACT-QUERY-SUBJECT-TODOS"], WEB_APP),
    page("TEA-PAGE-QUEUE", "Grading and Review Queue Summary", ["TEA-OBJ-TODO-VIEW"], ["TEA-TODO-F-SUBJECT-SCOPE", "TEA-TODO-F-SOURCE-REFS", "TEA-TODO-F-FILTER"], ["TEA-ACT-QUERY-SUBJECT-TODOS"], WEB_APP),
    page("TEA-PAGE-HOMEROOM", "Homeroom Whole-subject Overview", ["TEA-OBJ-COORDINATION"], ["TEA-COORD-F-CLASS-ID", "TEA-COORD-F-SUBJECT-REFS", "TEA-COORD-F-TITLE", "TEA-COORD-F-NOTE", "TEA-COORD-F-STATUS"], ["TEA-ACT-QUERY-HOMEROOM-SUMMARY", "TEA-ACT-CREATE-COORDINATION"], WEB_APP),
    page("TEA-PAGE-COORDINATION", "Homeroom Coordination Detail", ["TEA-OBJ-COORDINATION"], ["TEA-COORD-F-SUBJECT-REFS", "TEA-COORD-F-TITLE", "TEA-COORD-F-NOTE", "TEA-COORD-F-STATUS"], ["TEA-ACT-UPDATE-COORDINATION", "TEA-ACT-CLOSE-COORDINATION"], WEB_APP),
    page("TEA-PAGE-PREFERENCE", "Teacher Work Preference", ["TEA-OBJ-PREFERENCE"], ["TEA-PREF-F-DEFAULT-VIEW", "TEA-PREF-F-FILTERS"], ["TEA-ACT-SAVE-PREFERENCE"]),
  ],
});

export const foundationModules = deepFreeze([
  accModule,
  orgModule,
  iamModule,
  dgvModule,
  audModule,
  currModule,
  teaModule,
]);

export const foundationFlows = deepFreeze([
  {
    id: "DF-001",
    label: "School Context Establishment",
    phase: PHASE.FIRST,
    moduleIds: ["ACC-001", "ORG-001", "IAM-001"],
    steps: [
      { order: 1, actionId: "ACC-ACT-SEARCH-SCHOOL" },
      { order: 2, actionId: "ACC-ACT-SELECT-SCHOOL" },
      { order: 3, actionId: "ACC-ACT-FIRST-ACTIVATION", condition: "membership state is INVITED" },
      { order: 4, actionId: "ACC-ACT-LOGIN", condition: "membership state is ACTIVE after optional activation" },
      { order: 5, actionId: "ACC-ACT-SELECT-IDENTITY" },
      { order: 6, actionId: "ACC-ACT-SELECT-TERM" },
      { order: 7, actionId: "ORG-ACT-RESOLVE-CONTEXT-SCOPE" },
      { order: 8, actionId: "IAM-ACT-EVALUATE-PERMISSION" },
      { order: 9, actionId: "ACC-ACT-SWITCH-CONTEXT" },
    ],
    sourceDataRefs: [
      { objectId: "ACC-OBJ-SCHOOL", fieldId: "ACC-SCHOOL-F-ID", version: "SELECTED_SCHOOL_VERSION" },
      { objectId: "ACC-OBJ-IDENTITY", fieldId: "ACC-IDENTITY-F-SCOPES", version: "EFFECTIVE_IDENTITY_VERSION" },
      { objectId: "ORG-OBJ-TERM", fieldId: "ORG-TERM-F-STATUS", version: "CURRENT_OR_HISTORICAL_TERM_VERSION" },
      { objectId: "IAM-OBJ-PERMISSION-DECISION", fieldId: "IAM-DECISION-F-SOURCE-VERSIONS", version: "EVALUATED_PERMISSION_INPUT_VERSIONS" },
    ],
    targetDataRefs: [
      { objectId: "ACC-OBJ-CONTEXT", fieldId: "ACC-CONTEXT-F-STATUS", version: "NEW_ACTIVE_CONTEXT_VERSION" },
      { objectId: "IAM-OBJ-PERMISSION-DECISION", fieldId: "IAM-DECISION-F-RESULT", version: "APPENDED_PERMISSION_DECISION" },
    ],
    idempotencyKey: "DF-001:actor:selected-school:identity:term:source-versions:request-id",
    failureGranularity: "STEP_WITH_NO_CONTEXT_ACTIVATION_BEFORE_ALL_CHECKS_PASS",
    retryPolicy: { strategy: "RETRY_READS_AND_IDEMPOTENT_CONTEXT_WRITE", maxAttempts: 3, retryableFailureResults: ["TRANSIENT_FAILURE", "STALE_SOURCE_VERSION"] },
    compensation: { strategy: "EXPIRE_PARTIAL_CONTEXT", description: "if a context write exists before final acceptance, expire it and require full re-establishment" },
    downstreamInvalidation: { strategy: "INVALIDATE_PREVIOUS_CONTEXT_DERIVATIONS", targets: ["permission cache", "term-scoped navigation", "write authorization tokens"] },
  },
  {
    id: "DF-002",
    label: "Organization Import and Permission Refresh",
    phase: PHASE.FIRST,
    moduleIds: ["ORG-001", "IAM-001", "AUD-001"],
    steps: [
      { order: 1, actionId: "ORG-ACT-UPLOAD-IMPORT" },
      { order: 2, actionId: "ORG-ACT-MAP-IMPORT-FIELDS" },
      { order: 3, actionId: "ORG-ACT-VALIDATE-IMPORT" },
      { order: 4, actionId: "IAM-ACT-EVALUATE-PERMISSION", condition: "import validation passed for the affected object rows" },
      { order: 5, actionId: "AUD-ACT-APPEND-EVENT", condition: "audit gate records intended object-level writes before acceptance" },
      { order: 6, actionId: "ORG-ACT-CONFIRM-IMPORT", condition: "permission and audit gate succeeded; accepted rows remain provisional until outcome audit" },
      { order: 7, actionId: "AUD-ACT-APPEND-EVENT", condition: "outcome audit records accepted, rejected, and partial-success rows before final acceptance" },
      { order: 8, actionId: "ORG-ACT-FINALIZE-AUDITED-IMPORT", condition: "outcome audit succeeded and the batch has no rejected rows" },
      { order: 9, actionId: "ORG-ACT-FINALIZE-AUDITED-PARTIAL-IMPORT", condition: "partial result outcome audit succeeded and rejected rows remain for correction" },
      { order: 10, actionId: "IAM-ACT-RECALCULATE-PERMISSIONS", condition: "audited import was finalized and accepted organization rows changed permission sources" },
    ],
    sourceDataRefs: [
      { objectId: "ORG-OBJ-IMPORT-BATCH", fieldId: "ORG-IMPORT-F-TEMPLATE-VERSION", version: "UPLOADED_TEMPLATE_VERSION" },
      { objectId: "ORG-OBJ-IMPORT-ROW", fieldId: "ORG-IMPORT-ROW-F-RESULT-TYPE", version: "VALIDATED_OBJECT_RESULT_VERSION" },
      { objectId: "IAM-OBJ-PERMISSION-DECISION", fieldId: "IAM-DECISION-F-SOURCE-VERSIONS", version: "PRE_IMPORT_ORGANIZATION_VERSION" },
    ],
    targetDataRefs: [
      { objectId: "ORG-OBJ-IMPORT-BATCH", fieldId: "ORG-IMPORT-F-STATUS", version: "OBJECT_LEVEL_IMPORT_RESULT_VERSION" },
      { objectId: "IAM-OBJ-PERMISSION-DECISION", fieldId: "IAM-DECISION-F-SOURCE-VERSIONS", version: "POST_IMPORT_PERMISSION_VERSION" },
      { objectId: "AUD-OBJ-EVENT", fieldId: "AUD-EVENT-F-ID", version: "IMMUTABLE_IMPORT_AUDIT_EVENT" },
    ],
    idempotencyKey: "DF-002:school:import-batch:template-version:mapping-version:request-id",
    failureGranularity: "OBJECT_ROW_WITH_PARTIAL_SUCCESS_AND_FAILED_ROW_RETRY",
    retryPolicy: { strategy: "RETRY_FAILED_ROWS_OR_AUDIT_APPEND", maxAttempts: 5, retryableFailureResults: ["TRANSIENT_FAILURE", "CORRECTED_ROW", "STALE_PERMISSION_REFRESH", "AUDIT_FAILED"] },
    compensation: { strategy: "ROLLBACK_UNAUDITED_PROVISIONAL_ROWS", description: "rollback provisional accepted rows to the pre-import version when outcome audit fails; do not recalculate permissions until the outcome audit succeeds" },
    downstreamInvalidation: { strategy: "INVALIDATE_AFFECTED_ORGANIZATION_SCOPES", targets: ["permission decisions", "active contexts", "teacher work views"] },
  },
  {
    id: "DF-003",
    label: "Curriculum Version Publication",
    phase: PHASE.FIRST,
    moduleIds: ["CURR-001"],
    steps: [
      { order: 1, actionId: "CURR-ACT-VALIDATE-MAPPING" },
      { order: 2, actionId: "CURR-ACT-VALIDATE-VERSION" },
      { order: 3, actionId: "CURR-ACT-PUBLISH-MAPPING" },
      { order: 4, actionId: "CURR-ACT-PUBLISH-VERSION" },
    ],
    sourceDataRefs: [
      { objectId: "CURR-OBJ-CURRICULUM", fieldId: "CURR-CURRICULUM-F-VALIDATION", version: "VALIDATED_DRAFT_VERSION" },
      { objectId: "CURR-OBJ-MAPPING", fieldId: "CURR-MAPPING-F-VERSION", version: "RESOLVED_MAPPING_SOURCE_VERSION" },
    ],
    targetDataRefs: [
      { objectId: "CURR-OBJ-MAPPING", fieldId: "CURR-MAPPING-F-STATUS", version: "NEW_USABLE_MAPPING_VERSION" },
      { objectId: "CURR-OBJ-CURRICULUM", fieldId: "CURR-CURRICULUM-F-STATUS", version: "NEW_PUBLISHED_VERSION" },
      { objectId: "CURR-OBJ-CURRICULUM", fieldId: "CURR-CURRICULUM-F-PUBLISHED-AT", version: "IMMUTABLE_PUBLICATION_EVENT_VERSION" },
    ],
    idempotencyKey: "DF-003:school:curriculum-version:validation-version:request-id",
    failureGranularity: "VERSION_PUBLICATION_WITH_NO_PARTIAL_PUBLISH",
    retryPolicy: { strategy: "REVALIDATE_STALE_DRAFT_THEN_RETRY", maxAttempts: 3, retryableFailureResults: ["TRANSIENT_FAILURE", "STALE_DRAFT_VERSION"] },
    compensation: { strategy: "KEEP_PRIOR_PUBLISHED_VERSION", description: "failed publication leaves the prior published version active and the draft unreferenced by new work" },
    downstreamInvalidation: { strategy: "NEW_WORK_ONLY", targets: ["new assignment curriculum selectors", "new knowledge-path selectors", "historical assignment and evidence references are immutable and never rewritten"] },
  },
]);
