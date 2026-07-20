import {
  CLIENT,
  PHASE,
  RELEASE_STATUS,
  RISK,
  deepFreeze,
  defineModule,
} from "../model.mjs";
import {
  withProfessionalWriteAuthorization,
  withProfessionalWritePolicy,
} from "./professional-write-authorization.mjs";
import {
  STUDENT_DATA_KIND,
  withStudentDataClassification,
} from "./student-data-classification.mjs";
import { STUDENT_DETAIL_ACCESS_EXCEPTION_KIND } from "./student-detail-access-exceptions.mjs";

const WEB_APP = [CLIENT.WEB, CLIENT.APP];

function optionSet(id, key, label, values) {
  return {
    id,
    key,
    label,
    mode: "STATIC",
    values: values.map(([code, valueLabel]) => ({ code, label: valueLabel })),
  };
}

export const extensionOptionSets = deepFreeze([
  optionSet("OPT-EXT-001", "lessonPlanStatus", "教案状态", [
    ["DRAFT", "草稿"],
    ["CONFIRMED", "已确认"],
  ]),
  optionSet("OPT-EXT-002", "materialLicenseStatus", "素材许可状态", [
    ["PENDING", "待核验"],
    ["VERIFIED", "已核验"],
  ]),
  optionSet("OPT-EXT-003", "contentAvailability", "内容可用状态", [
    ["DRAFT", "草稿"],
    ["PUBLISHED", "已发布"],
  ]),
  optionSet("OPT-EXT-004", "examEventStatus", "考试事件状态", [
    ["DRAFT", "草稿"],
    ["PUBLISHED", "已发布"],
    ["CORRECTION_OPEN", "订正开放"],
  ]),
  optionSet("OPT-EXT-005", "scoreImportValidation", "成绩导入校验", [
    ["PENDING", "待校验"],
    ["PASSED", "已通过"],
    ["REJECTED", "已拒绝"],
  ]),
  optionSet("OPT-EXT-006", "scheduleConstraintHardness", "排课约束强度", [
    ["HARD", "硬约束"],
    ["SOFT", "软约束"],
  ]),
  optionSet("OPT-EXT-007", "scheduleHardConstraintCheck", "硬约束校验结果", [
    ["PASS", "通过"],
    ["FAIL", "不通过"],
  ]),
  optionSet("OPT-EXT-008", "serviceState", "服务状态", [
    ["DRAFT", "草稿"],
    ["CONFIRMED", "学校已确认"],
    ["ACTIVE", "服务中"],
  ]),
  optionSet("OPT-EXT-009", "supportCaseStatus", "支持工单状态", [
    ["OPEN", "处理中"],
    ["CLOSED", "已关闭"],
  ]),
  optionSet("OPT-EXT-010", "contentPermissionScope", "内容权限范围", [
    ["SCHOOL", "全校"],
    ["SUBJECT", "学科"],
    ["COURSE", "课程"],
  ]),
  optionSet("OPT-EXT-011", "contentLicenseStatus", "内容版权状态", [
    ["DRAFT", "待确认"],
    ["ACTIVE", "有效"],
  ]),
  optionSet("OPT-EXT-012", "activityStatus", "课堂活动状态", [
    ["PLANNED", "已计划"],
    ["RECORDED", "已记录"],
  ]),
  optionSet("OPT-EXT-013", "assignmentDraftStatus", "作业草稿状态", [
    ["DRAFT", "待任课教师确认"],
    ["READY_FOR_HANDOFF", "已确认可转正式作业草稿"],
  ]),
  optionSet("OPT-EXT-014", "scheduleCandidateStatus", "排课候选状态", [
    ["GENERATED", "已生成"],
    ["REVIEWED", "已复核"],
    ["CONFIRMED", "已确认"],
    ["PUBLISHED", "已发布"],
    ["STALE", "已失效"],
  ]),
  optionSet("OPT-EXT-015", "platformCaseStatus", "入驻服务状态", [
    ["OPEN", "处理中"],
    ["SCHOOL_CONFIRMED", "学校已确认"],
  ]),
  optionSet("OPT-EXT-016", "policyTemplateStatus", "策略模板状态", [
    ["DRAFT", "草稿"],
    ["CONFIRMED", "学校已确认"],
    ["ACTIVE", "已生效"],
  ]),
  optionSet("OPT-EXT-017", "scheduleConstraintKind", "排课约束类型", [
    ["TEACHER_AVAILABILITY", "教师可用时间"],
    ["CLASS_PERIOD", "班级时段"],
    ["COURSE_LOAD", "课程课时"],
    ["ROOM_CAPACITY", "教室容量"],
  ]),
  optionSet("OPT-EXT-018", "scoreConfirmationDecision", "学科成绩确认决定", [
    ["CONFIRM", "确认"],
    ["REJECT", "驳回"],
  ]),
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
    validation: "must match the declared task-specific data type and authorized school scope",
    historyPolicy: "retain the accepted value with actor, time, and version provenance",
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

function conditionalRequired(description, whenStates, whenActionIds) {
  return { description, whenStates, whenActionIds };
}

function actorReference(actorRef) {
  if (actorRef.startsWith("DUTY-")) return { dutyRef: actorRef };
  if (actorRef.startsWith("ROLE-")) return { roleRef: actorRef };
  return { actorRef };
}

function permissions(allowRef, denyRefs, allowCondition, allowScope) {
  return [
    {
      effect: "ALLOW",
      ...actorReference(allowRef),
      condition: allowCondition,
      ...(allowScope ? { scope: allowScope } : {}),
    },
    ...denyRefs.map((denyRef) => ({
      effect: "DENY",
      ...actorReference(denyRef),
      condition: `${denyRef} is outside the task-specific owner and authorized object scope`,
    })),
  ];
}

function domainObject({
  id,
  label,
  identityFieldId,
  responsibility,
  states,
  fields,
  sensitivityId = "S2",
  lifecyclePolicyId = "LIFE-003",
  overrides = {},
}) {
  const { studentDataKind, ...objectOverrides } = overrides;
  return withProfessionalWritePolicy(withStudentDataClassification({
    id,
    label,
    ...responsibility,
    lifecyclePolicyId,
    sensitivityId,
    readMode: "AUTHORIZED",
    stateReachability: { mode: "ACTION_GRAPH", initialStateIds: [] },
    states,
    fields: [identityField(identityFieldId, `${label} ID`), ...fields],
    ...objectOverrides,
  }, studentDataKind));
}

function failureSemantic(resultCode, predicate, given, when, expectedData) {
  return { resultCode, predicate, given, when, expectedData };
}

const task8FailureSemantics = new Map([
  ["CONTENT-ACT-PUBLISH-QUESTION-VERSION", [
    failureSemantic(
      "LICENSE_INACTIVE",
      "license.state !== ACTIVE || license.version !== pinnedLicenseVersion",
      "the question draft pins a license that is not ACTIVE or no longer matches the pinned license version",
      "the subject lead requests publication of the question version",
      "LICENSE_INACTIVE identifies the blocked license reference and preserves the question version in DRAFT",
    ),
    failureSemantic(
      "CONTENT_PERMISSION_INACTIVE",
      "contentPermission.state !== ACTIVE || currentTime >= contentPermission.expiresAt || !contentPermission.covers(questionContext, currentActor)",
      "the pinned content permission is inactive, expired, assigned to another grantee, or does not cover the question school, subject, and course context",
      "the subject lead requests publication of the question version",
      "CONTENT_PERMISSION_INACTIVE identifies the uncovered permission context and preserves the question version in DRAFT",
    ),
  ]],
  ["EXM-ACT-VALIDATE-SCORE-IMPORT", [
    failureSemantic(
      "IMPORT_REJECTED",
      "blockingImportValidationErrors.length > 0",
      "the imported score rows contain at least one blocking schema, identity, subject, or score-range error",
      "academic affairs validates the pending subject-score import",
      "IMPORT_REJECTED returns row-level blocking evidence and preserves the import in PENDING",
    ),
  ]],
  ["EXM-ACT-ACCEPT-SCORE-IMPORT", [
    failureSemantic(
      "IMPORT_REJECTED",
      "scoreImport.state !== PASSED || blockingImportValidationErrors.length > 0",
      "the score import has not reached PASSED or still contains blocking validation evidence",
      "academic affairs accepts the validated subject-score import",
      "IMPORT_REJECTED returns the unresolved validation evidence and does not create an ACCEPTED import version",
    ),
  ]],
  ["EXM-ACT-CREATE-SUBJECT-SCORE", [
    failureSemantic(
      "IMPORT_REJECTED",
      "scoreImport.state !== ACCEPTED",
      "the pinned source import is not in the ACCEPTED state",
      "academic affairs creates an imported subject-score version from the pinned import",
      "IMPORT_REJECTED identifies the ineligible import and creates no subject-score version",
    ),
  ]],
  ["EXM-ACT-CONFIRM-SUBJECT-SCORE", [
    failureSemantic(
      "SCORE_REJECTED",
      "confirmationDecision !== CONFIRM || subjectScore.state === REJECTED",
      "the decision is not CONFIRM or the subject-score version has already been rejected",
      "the assigned subject teacher confirms the imported subject-score version",
      "SCORE_REJECTED preserves the score outside TEACHER_CONFIRMED and returns the rejection evidence",
    ),
  ]],
  ["EXM-ACT-PUBLISH-SUBJECT-SCORE", [
    failureSemantic(
      "SCORE_REJECTED",
      "subjectScore.state === REJECTED",
      "the subject-score version is in REJECTED",
      "academic affairs publishes the subject-score version",
      "SCORE_REJECTED preserves the rejected score and exposes no student-visible result",
    ),
    failureSemantic(
      "TEACHER_CONFIRMATION_REQUIRED",
      "subjectScore.state !== TEACHER_CONFIRMED || teacherConfirmedAt == null",
      "the subject-score version lacks the assigned subject teacher's confirmation state or confirmation timestamp",
      "academic affairs publishes the subject-score version",
      "TEACHER_CONFIRMATION_REQUIRED preserves the score as unpublished and exposes no student-visible result",
    ),
  ]],
  ["EXM-ACT-VIEW-PUBLISHED-SCORE", [
    failureSemantic(
      "RESULT_NOT_PUBLISHED",
      "subjectScore.state !== PUBLISHED",
      "the student's own subject-score version has not reached PUBLISHED",
      "the student requests the subject-score result",
      "RESULT_NOT_PUBLISHED returns no protected score, evidence, or visibility timestamp",
    ),
    failureSemantic(
      "RESULT_NOT_VISIBLE",
      "subjectScore.state === PUBLISHED && currentTime < visibleAt",
      "the student's own subject-score version is PUBLISHED but its visibility time has not opened",
      "the student requests the subject-score result",
      "RESULT_NOT_VISIBLE returns only the denial result and no protected score or evidence",
    ),
  ]],
  ["SCH-ACT-GENERATE-CANDIDATE", [
    failureSemantic(
      "SOURCE_VERSION_STALE",
      "calendar.state !== PUBLISHED || constraintSnapshot.state !== ACTIVE || sourceVersionChangedDuringGeneration === true",
      "the selected calendar is not PUBLISHED, the constraint snapshot is not ACTIVE, or either source version changes while generation is running",
      "academic affairs generates a schedule candidate",
      "SOURCE_VERSION_STALE creates no candidate and returns the current calendar and constraint-snapshot versions",
    ),
  ]],
  ["SCH-ACT-CONFIRM-CANDIDATE", [
    failureSemantic(
      "HARD_CONSTRAINT_FAILED",
      "candidate.hardConstraintCheck !== PASS",
      "the reviewed schedule candidate does not have a PASS hard-constraint result",
      "academic affairs confirms the reviewed schedule candidate",
      "HARD_CONSTRAINT_FAILED preserves the candidate in REVIEWED and returns the blocking conflicts",
    ),
    failureSemantic(
      "SOURCE_VERSION_STALE",
      "candidate.calendarVersion !== calendar.version || candidate.constraintSnapshotVersion !== constraintSnapshot.version || calendar.state !== PUBLISHED || constraintSnapshot.state !== ACTIVE",
      "the candidate's pinned calendar or constraint-snapshot version no longer matches an eligible source",
      "academic affairs confirms the reviewed schedule candidate",
      "SOURCE_VERSION_STALE preserves the candidate outside CONFIRMED and returns both current source versions",
    ),
  ]],
  ["SCH-ACT-PUBLISH-CANDIDATE", [
    failureSemantic(
      "SOURCE_VERSION_STALE",
      "candidate.calendarVersion !== calendar.version || candidate.constraintSnapshotVersion !== constraintSnapshot.version || calendar.state !== PUBLISHED || constraintSnapshot.state !== ACTIVE",
      "the confirmed candidate's pinned calendar or constraint-snapshot version no longer matches an eligible source",
      "academic affairs publishes the confirmed schedule candidate",
      "SOURCE_VERSION_STALE preserves the candidate outside PUBLISHED and returns both current source versions",
    ),
  ]],
  ["PREP-ACT-GENERATE-ASSIGNMENT-DRAFT", [
    failureSemantic(
      "LESSON_STALE",
      "lessonPlan.state !== CONFIRMED || sourceLessonVersionCapture !== lessonPlan.version",
      "the selected lesson plan is not CONFIRMED or changes while its source version is being pinned",
      "the subject teacher generates an assignment handoff draft",
      "LESSON_STALE creates no assignment handoff draft and returns the current lesson-plan version",
    ),
  ]],
  ["PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF", [
    failureSemantic(
      "LESSON_STALE",
      "draft.sourceLessonVersion !== lessonPlan.version || lessonPlan.state !== CONFIRMED",
      "the draft's pinned lesson version no longer matches a CONFIRMED lesson plan",
      "the subject teacher confirms the completed assignment handoff",
      "LESSON_STALE preserves the handoff in DRAFT and returns the current lesson-plan version",
    ),
    failureSemantic(
      "HANDOFF_INCOMPLETE",
      "completedBindingCount !== 15 || missingTeacherRequiredPayloadPaths.length > 0 || unknownPayloadPaths.length > 0",
      "one or more formal HW inputs lack a binding, a teacher-required payload value is missing, or the payload contains an undeclared field",
      "the subject teacher confirms the completed assignment handoff",
      "HANDOFF_INCOMPLETE returns the missing or unknown payload paths and preserves the handoff in DRAFT",
    ),
  ]],
  ["PLAT-ACT-CREATE-SUPPORT-CASE", [
    failureSemantic(
      "ACCESS_INACTIVE",
      "auditSession.state !== ACTIVE",
      "the pinned AUD session is pending, revoked, expired, or otherwise not ACTIVE",
      "the platform operator creates a support case under the pinned AUD session",
      "ACCESS_INACTIVE creates no support case and returns no student-detail data",
    ),
    failureSemantic(
      "ACCESS_EXPIRED",
      "currentTime >= auditSession.expiresAt",
      "the current time is at or after the pinned AUD session expiry",
      "the platform operator creates a support case under the pinned AUD session",
      "ACCESS_EXPIRED creates no support case and returns the session expiry boundary",
    ),
    failureSemantic(
      "ACCESS_OTHER_RECORD",
      "currentActor.id !== auditSession.authorizedOperatorId",
      "the current platform operator is not the operator authorized by the pinned AUD session",
      "the platform operator creates a support case under the pinned AUD session",
      "ACCESS_OTHER_RECORD creates no support case and discloses no other operator's authorized data",
    ),
    failureSemantic(
      "ACCESS_SCOPE_DENIED",
      "!auditSession.scope.contains(requestedScope)",
      "the requested support scope is outside the scope approved on the pinned AUD session",
      "the platform operator creates a support case under the pinned AUD session",
      "ACCESS_SCOPE_DENIED creates no support case and returns only the rejected requested scope",
    ),
  ]],
  ["PLAT-ACT-USE-SUPPORT-ACCESS", [
    failureSemantic(
      "ACCESS_INACTIVE",
      "auditSession.state !== ACTIVE",
      "the support case's pinned AUD session is pending, revoked, expired, or otherwise not ACTIVE",
      "the authorized platform operator uses the support case access",
      "ACCESS_INACTIVE returns no support data and records no successful access",
    ),
    failureSemantic(
      "ACCESS_EXPIRED",
      "currentTime >= auditSession.expiresAt",
      "the current time is at or after the support case's pinned AUD session expiry",
      "the authorized platform operator uses the support case access",
      "ACCESS_EXPIRED returns no support data and exposes only the expiry boundary",
    ),
    failureSemantic(
      "ACCESS_OTHER_RECORD",
      "currentActor.id !== auditSession.authorizedOperatorId",
      "the current platform operator is not the operator authorized by the support case's pinned AUD session",
      "the platform operator uses the support case access",
      "ACCESS_OTHER_RECORD returns no support data from another operator's case",
    ),
    failureSemantic(
      "ACCESS_SCOPE_DENIED",
      "!auditSession.scope.contains(requestedScope)",
      "the requested support scope is outside the support case's active AUD session scope",
      "the authorized platform operator uses the support case access",
      "ACCESS_SCOPE_DENIED returns no support data outside the approved scope",
    ),
    failureSemantic(
      "AUDIT_FAILED",
      "appendAuditEventBeforeDataReturn !== SUCCESS",
      "the immutable AUD event cannot be appended before protected support data would be returned",
      "the authorized platform operator uses the support case access",
      "AUDIT_FAILED returns no protected support data and preserves the business objects unchanged",
    ),
  ]],
]);

function action({
  id,
  label,
  targetObjectId,
  operationKind,
  inputFieldIds = [],
  outputFieldIds = [],
  permissions: actionPermissions,
  clients = WEB_APP,
  successState,
  transition,
  risk,
  failureResults,
  extras = {},
}) {
  const writes = operationKind !== "READ";
  const executionMode = extras.executionMode ?? "USER_TASK";
  const effectiveRisk = risk ?? (writes ? RISK.LOW : RISK.READ);
  const baseFailures = failureResults ?? (writes
    ? ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT"]
    : ["PERMISSION_DENIED", "NOT_FOUND"]);
  const effectiveFailures = effectiveRisk === RISK.HIGH
    ? [...new Set([...baseFailures, "AUDIT_FAILED"])]
    : baseFailures;
  const authoredFailureSemantics = task8FailureSemantics.get(id) ?? [];
  const failureSemanticByCode = new Map(
    authoredFailureSemantics.map((semantic) => [semantic.resultCode, semantic]),
  );
  const successScenario = {
    id: `${id}-SCN-SUCCESS`,
    kind: "SUCCESS",
    actionId: id,
    given: `the authorized actor satisfies the task-specific entry conditions for ${label}`,
    when: `the actor requests ${label}`,
    then: {
      expectedData: `${label} returns the accepted versioned task result without widening scope`,
      expectedState: writes
        ? { mode: "STATE", value: successState ?? transition.to }
        : { mode: "UNCHANGED" },
      expectedPermission: "ALLOW",
      expectedVisibility: "authorized school and object scope only",
    },
  };
  const failureScenarios = effectiveFailures.map((resultCode) => {
    const semantic = failureSemanticByCode.get(resultCode);
    return {
      id: `${id}-SCN-${resultCode}`,
      kind: "FAILURE",
      resultCode,
      actionId: id,
      ...(semantic ? { failurePredicate: semantic.predicate } : {}),
      given: semantic?.given ?? `${resultCode} blocks ${label}`,
      when: semantic?.when ?? `the actor requests ${label}`,
      then: {
        expectedData: semantic?.expectedData
          ?? `${label} returns ${resultCode} and performs no hidden write`,
        expectedState: { mode: "UNCHANGED" },
        expectedPermission: "DENY",
        expectedVisibility: "no data outside the authorized scope",
      },
    };
  });
  return {
    value: withProfessionalWriteAuthorization({
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
      ...(executionMode === "USER_TASK" ? { clients } : {}),
      permissions: structuredClone(actionPermissions),
      scenarioIds: [successScenario.id, ...failureScenarios.map(({ id: scenarioId }) => scenarioId)],
      ...(writes ? { idempotencyKey: `${id}:school:object-version:request-id` } : {}),
      auditMode: writes ? "REQUIRED" : "NOT_REQUIRED",
      failureResults: effectiveFailures,
      ...(authoredFailureSemantics.length > 0
        ? { failureSemantics: structuredClone(authoredFailureSemantics) }
        : {}),
      ...extras,
    }),
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

function moduleFact({ actionFacts, pages, ...module }) {
  const pageByActionId = new Map();
  for (const pageValue of pages) {
    for (const actionId of pageValue.actionIds) pageByActionId.set(actionId, pageValue.id);
  }
  return defineModule({
    ...module,
    actions: actionFacts.map(({ value }) => value),
    pages,
    scenarios: actionFacts.flatMap(({ value, scenarios }) => scenarios.map((scenario) => {
      const pageId = pageByActionId.get(value.id);
      return {
        ...scenario,
        ...(pageId ? { pageId } : { trigger: structuredClone(value.trigger) }),
      };
    })),
  });
}

const subjectTeacher = {
  dataSubject: "SUBJECT_TEACHING_PREPARATION",
  controlSubject: "SCHOOL",
  producerRef: "DUTY-SUBJECT-TEACHER",
  ownerRef: "DUTY-SUBJECT-TEACHER",
  confirmerRef: "DUTY-SUBJECT-TEACHER",
  stewardRef: "ROLE-ACADEMIC",
};
const subjectLead = {
  dataSubject: "VERSIONED_TEACHING_CONTENT",
  controlSubject: "SCHOOL",
  producerRef: "DUTY-SUBJECT-LEAD",
  ownerRef: "DUTY-SUBJECT-LEAD",
  confirmerRef: "DUTY-SUBJECT-LEAD",
  stewardRef: "ROLE-ACADEMIC",
};
const academic = {
  dataSubject: "ACADEMIC_OPERATION",
  controlSubject: "SCHOOL",
  producerRef: "ROLE-ACADEMIC",
  ownerRef: "ROLE-ACADEMIC",
  confirmerRef: "ROLE-ACADEMIC",
  stewardRef: "ROLE-SCHOOL-ADMIN",
};
const platformOperations = {
  dataSubject: "SCHOOL_SERVICE_CONFIGURATION",
  controlSubject: "SCHOOL",
  producerRef: "ROLE-PLATFORM-OPS",
  ownerRef: "ROLE-SCHOOL-ADMIN",
  confirmerRef: "ROLE-SCHOOL-ADMIN",
  stewardRef: "ROLE-SCHOOL-ADMIN",
};
const schoolSupportAccess = {
  dataSubject: "AUDIT_PINNED_SUPPORT_CASE",
  controlSubject: "SCHOOL",
  producerRef: "ROLE-PLATFORM-OPS",
  ownerRef: "ROLE-SCHOOL-ADMIN",
  confirmerRef: "ROLE-SCHOOL-ADMIN",
  stewardRef: "ROLE-SCHOOL-ADMIN",
};

const teacherPermissions = permissions(
  "DUTY-SUBJECT-TEACHER",
  ["ROLE-STUDENT", "DUTY-HOMEROOM", "ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS"],
  "the corresponding subject teacher acts inside assigned course and class scope",
  {
    kind: "ASSIGNED_SUBJECT_COURSE",
    subjectMatch: "REQUIRED",
    courseMatch: "REQUIRED",
  },
);
const leadPermissions = permissions(
  "DUTY-SUBJECT-LEAD",
  ["ROLE-STUDENT", "ROLE-PLATFORM-OPS"],
  "the subject lead acts inside the assigned subject content-governance scope",
);
const academicPermissions = permissions(
  "ROLE-ACADEMIC",
  ["ROLE-STUDENT", "ROLE-PLATFORM-OPS"],
  "academic administration acts inside the authorized school and term scope",
);
const platformPermissions = permissions(
  "ROLE-PLATFORM-OPS",
  ["ROLE-STUDENT", "ROLE-TEACHER"],
  "platform operations manages service metadata without opening student-level learning detail",
);
const schoolAdminPermissions = permissions(
  "ROLE-SCHOOL-ADMIN",
  ["ROLE-STUDENT", "ROLE-PLATFORM-OPS"],
  "the school administrator controls the school's explicit time-bound support access",
);

const lessonPlanFields = [
  optionField("PREP-LESSON-F-SUBJECT", "Subject", "OPT-COM-007", { dataType: "ID" }),
  optionField("PREP-LESSON-F-COURSE", "Course", "OPT-COM-008", { dataType: "ID" }),
  field("PREP-LESSON-F-TITLE", "Lesson Plan Title"),
  field("PREP-LESSON-F-RUBRIC-VERSION", "Lesson Rubric Version", {
    dataType: "ID",
  }),
  optionField(
    "PREP-LESSON-F-KNOWLEDGE-POINT-IDS",
    "Lesson Knowledge Points",
    "OPT-COM-011",
    { dataType: "STRING_ARRAY" },
  ),
  systemField("PREP-LESSON-F-VERSION", "Lesson Plan Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
  optionField("PREP-LESSON-F-STATUS", "Lesson Plan Status", "OPT-EXT-001", {
    mutability: "SYSTEM_MANAGED",
  }),
];
const materialFields = [
  field("PREP-MATERIAL-F-REFERENCE", "Teaching Material Reference", {
    dataType: "FILE_REFERENCE",
  }),
  field("PREP-MATERIAL-F-USAGE-PURPOSE", "Material Usage Purpose", { dataType: "TEXT" }),
  optionField("PREP-MATERIAL-F-LICENSE-STATUS", "Material License Status", "OPT-EXT-002", {
    mutability: "SYSTEM_MANAGED",
  }),
];
const activityFields = [
  field("PREP-ACTIVITY-F-INSTRUCTIONS", "Classroom Activity Instructions", { dataType: "TEXT" }),
  field("PREP-ACTIVITY-F-EVIDENCE", "Classroom Activity Evidence", {
    dataType: "JSON",
    required: conditionalRequired(
      "required only when classroom activity completion is recorded",
      ["RECORDED"],
      ["PREP-ACT-RECORD-CLASSROOM-ACTIVITY"],
    ),
  }),
  optionField("PREP-ACTIVITY-F-STATUS", "Classroom Activity Status", "OPT-EXT-012", {
    mutability: "SYSTEM_MANAGED",
  }),
];
const assignmentDraftFields = [
  field("PREP-DRAFT-F-CONTENT", "Generated and Teacher-completed Assignment Draft Content", {
    dataType: "JSON",
    handoffPayloadSchema: {
      schemaVersion: "PREP_HW_DRAFT_V1",
      additionalProperties: false,
      properties: {
        instructions: { dataType: "TEXT", required: true },
        assignmentType: { dataType: "STRING", required: true },
        questionOrder: { dataType: "STRING", required: true },
        classScopeIds: { dataType: "STRING_ARRAY", required: true },
        openAt: { dataType: "DATETIME", required: true },
        dueAt: { dataType: "DATETIME", required: true },
        latePolicy: { dataType: "STRING", required: true },
        resubmissionPolicy: { dataType: "STRING", required: true },
      },
    },
  }),
  field("PREP-DRAFT-F-SOURCE-LESSON-REF", "Pinned Confirmed Lesson Plan", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PREP-OBJ-LESSON-PLAN" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "ALWAYS_REQUIRED",
    actionApplicability: {
      requiredActionIds: [
        "PREP-ACT-GENERATE-ASSIGNMENT-DRAFT",
        "PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF",
      ],
    },
    versionBinding: {
      versionFieldId: "PREP-DRAFT-F-SOURCE-LESSON-VERSION",
      targetVersionFieldId: "PREP-LESSON-F-VERSION",
    },
  }),
  systemField("PREP-DRAFT-F-SOURCE-LESSON-VERSION", "Source Lesson Plan Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  optionField("PREP-DRAFT-F-STATUS", "Assignment Draft Status", "OPT-EXT-013", {
    mutability: "SYSTEM_MANAGED",
  }),
];

const preparationObjects = [
  domainObject({
    id: "PREP-OBJ-LESSON-PLAN",
    label: "Lesson Plan Version",
    identityFieldId: "PREP-LESSON-F-ID",
    responsibility: subjectTeacher,
    states: ["DRAFT", "CONFIRMED"],
    fields: lessonPlanFields,
  }),
  domainObject({
    id: "PREP-OBJ-MATERIAL-REF",
    label: "Teaching Material Reference",
    identityFieldId: "PREP-MATERIAL-F-ID",
    responsibility: subjectTeacher,
    states: ["PENDING", "VERIFIED"],
    fields: materialFields,
  }),
  domainObject({
    id: "PREP-OBJ-CLASSROOM-ACTIVITY",
    label: "Classroom Activity Record",
    identityFieldId: "PREP-ACTIVITY-F-ID",
    responsibility: subjectTeacher,
    states: ["PLANNED", "RECORDED"],
    fields: activityFields,
  }),
  domainObject({
    id: "PREP-OBJ-ASSIGNMENT-DRAFT",
    label: "Generated Assignment Draft",
    identityFieldId: "PREP-DRAFT-F-ID",
    responsibility: subjectTeacher,
    states: ["DRAFT", "READY_FOR_HANDOFF"],
    fields: assignmentDraftFields,
    lifecyclePolicyId: "LIFE-005",
    overrides: {
      lineageBindings: [{
        refFieldId: "PREP-DRAFT-F-SOURCE-LESSON-REF",
        versionFieldId: "PREP-DRAFT-F-SOURCE-LESSON-VERSION",
        targetObjectId: "PREP-OBJ-LESSON-PLAN",
        targetVersionFieldId: "PREP-LESSON-F-VERSION",
      }],
    },
  }),
];

const preparationActions = [
  action({
    id: "PREP-ACT-CREATE-LESSON-PLAN",
    label: "Create Lesson Plan Version",
    targetObjectId: "PREP-OBJ-LESSON-PLAN",
    operationKind: "CREATE",
    inputFieldIds: [
      "PREP-LESSON-F-SUBJECT",
      "PREP-LESSON-F-COURSE",
      "PREP-LESSON-F-TITLE",
      "PREP-LESSON-F-RUBRIC-VERSION",
      "PREP-LESSON-F-KNOWLEDGE-POINT-IDS",
    ],
    outputFieldIds: ["PREP-LESSON-F-ID", "PREP-LESSON-F-VERSION", "PREP-LESSON-F-STATUS"],
    permissions: teacherPermissions,
    successState: "DRAFT",
  }),
  action({
    id: "PREP-ACT-CONFIRM-LESSON-PLAN",
    label: "Confirm Lesson Plan Version",
    targetObjectId: "PREP-OBJ-LESSON-PLAN",
    operationKind: "UPDATE",
    outputFieldIds: ["PREP-LESSON-F-VERSION", "PREP-LESSON-F-STATUS"],
    permissions: teacherPermissions,
    transition: { from: "DRAFT", to: "CONFIRMED" },
  }),
  action({
    id: "PREP-ACT-REFERENCE-MATERIAL",
    label: "Reference Teaching Material",
    targetObjectId: "PREP-OBJ-MATERIAL-REF",
    operationKind: "CREATE",
    inputFieldIds: ["PREP-MATERIAL-F-REFERENCE", "PREP-MATERIAL-F-USAGE-PURPOSE"],
    outputFieldIds: ["PREP-MATERIAL-F-ID", "PREP-MATERIAL-F-LICENSE-STATUS"],
    permissions: teacherPermissions,
    successState: "PENDING",
  }),
  action({
    id: "PREP-ACT-VERIFY-MATERIAL-LICENSE",
    label: "Verify Teaching Material License",
    targetObjectId: "PREP-OBJ-MATERIAL-REF",
    operationKind: "UPDATE",
    outputFieldIds: ["PREP-MATERIAL-F-LICENSE-STATUS"],
    permissions: teacherPermissions,
    transition: { from: "PENDING", to: "VERIFIED" },
  }),
  action({
    id: "PREP-ACT-PLAN-CLASSROOM-ACTIVITY",
    label: "Plan Classroom Activity",
    targetObjectId: "PREP-OBJ-CLASSROOM-ACTIVITY",
    operationKind: "CREATE",
    inputFieldIds: ["PREP-ACTIVITY-F-INSTRUCTIONS"],
    outputFieldIds: ["PREP-ACTIVITY-F-ID", "PREP-ACTIVITY-F-STATUS"],
    permissions: teacherPermissions,
    successState: "PLANNED",
  }),
  action({
    id: "PREP-ACT-RECORD-CLASSROOM-ACTIVITY",
    label: "Record Classroom Activity Completion",
    targetObjectId: "PREP-OBJ-CLASSROOM-ACTIVITY",
    operationKind: "UPDATE",
    inputFieldIds: ["PREP-ACTIVITY-F-EVIDENCE"],
    outputFieldIds: ["PREP-ACTIVITY-F-EVIDENCE", "PREP-ACTIVITY-F-STATUS"],
    permissions: teacherPermissions,
    clients: [CLIENT.APP],
    transition: { from: "PLANNED", to: "RECORDED" },
  }),
  action({
    id: "PREP-ACT-GENERATE-ASSIGNMENT-DRAFT",
    label: "Generate Assignment Draft for Teacher Confirmation",
    targetObjectId: "PREP-OBJ-ASSIGNMENT-DRAFT",
    operationKind: "CREATE",
    inputFieldIds: ["PREP-DRAFT-F-SOURCE-LESSON-REF"],
    outputFieldIds: [
      "PREP-DRAFT-F-ID",
      "PREP-DRAFT-F-CONTENT",
      "PREP-DRAFT-F-SOURCE-LESSON-VERSION",
      "PREP-DRAFT-F-STATUS",
    ],
    permissions: teacherPermissions,
    successState: "DRAFT",
    failureResults: [
      "PERMISSION_DENIED",
      "LESSON_STALE",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [{
        refFieldId: "PREP-DRAFT-F-SOURCE-LESSON-REF",
        versionFieldId: "PREP-DRAFT-F-SOURCE-LESSON-VERSION",
        targetObjectId: "PREP-OBJ-LESSON-PLAN",
        requiredState: "CONFIRMED",
      }],
    },
  }),
  action({
    id: "PREP-ACT-COMPLETE-ASSIGNMENT-DRAFT",
    label: "Complete Teacher-required Assignment Draft Fields",
    targetObjectId: "PREP-OBJ-ASSIGNMENT-DRAFT",
    operationKind: "UPDATE",
    inputFieldIds: ["PREP-DRAFT-F-CONTENT"],
    outputFieldIds: ["PREP-DRAFT-F-CONTENT", "PREP-DRAFT-F-STATUS"],
    permissions: teacherPermissions,
    transition: { from: "DRAFT", to: "DRAFT" },
  }),
  action({
    id: "PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF",
    label: "Confirm Complete Draft for Formal HW Creation",
    targetObjectId: "PREP-OBJ-ASSIGNMENT-DRAFT",
    operationKind: "UPDATE",
    inputFieldIds: [
      "PREP-DRAFT-F-SOURCE-LESSON-REF",
      "PREP-DRAFT-F-SOURCE-LESSON-VERSION",
    ],
    outputFieldIds: ["PREP-DRAFT-F-STATUS"],
    permissions: teacherPermissions,
    transition: { from: "DRAFT", to: "READY_FOR_HANDOFF" },
    failureResults: [
      "PERMISSION_DENIED",
      "LESSON_STALE",
      "HANDOFF_INCOMPLETE",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [{
        refFieldId: "PREP-DRAFT-F-SOURCE-LESSON-REF",
        versionFieldId: "PREP-DRAFT-F-SOURCE-LESSON-VERSION",
        targetObjectId: "PREP-OBJ-LESSON-PLAN",
        requiredState: "CONFIRMED",
      }],
      handoffContract: {
        formalActionId: "HW-ACT-CREATE-DRAFT",
        payloadFieldId: "PREP-DRAFT-F-CONTENT",
        formalInputFieldIds: [
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
        fieldBindings: [
          { targetFieldId: "HW-ASSIGNMENT-F-TITLE", sourceKind: "LESSON_FIELD", sourceFieldId: "PREP-LESSON-F-TITLE", sourceVersionFieldId: "PREP-LESSON-F-VERSION" },
          { targetFieldId: "HW-ASSIGNMENT-F-INSTRUCTIONS", sourceKind: "GENERATED_PAYLOAD", payloadPath: "instructions" },
          { targetFieldId: "HW-ASSIGNMENT-F-SUBJECT-ID", sourceKind: "LESSON_FIELD", sourceFieldId: "PREP-LESSON-F-SUBJECT", sourceVersionFieldId: "PREP-LESSON-F-VERSION" },
          { targetFieldId: "HW-ASSIGNMENT-F-COURSE-ID", sourceKind: "LESSON_FIELD", sourceFieldId: "PREP-LESSON-F-COURSE", sourceVersionFieldId: "PREP-LESSON-F-VERSION" },
          { targetFieldId: "HW-ASSIGNMENT-F-CLASS-SCOPE-IDS", sourceKind: "TEACHER_REQUIRED", payloadPath: "classScopeIds" },
          { targetFieldId: "HW-ASSIGNMENT-F-OPEN-AT", sourceKind: "TEACHER_REQUIRED", payloadPath: "openAt" },
          { targetFieldId: "HW-ASSIGNMENT-F-DUE-AT", sourceKind: "TEACHER_REQUIRED", payloadPath: "dueAt" },
          { targetFieldId: "HW-ASSIGNMENT-F-LATE-POLICY", sourceKind: "TEACHER_REQUIRED", payloadPath: "latePolicy" },
          { targetFieldId: "HW-ASSIGNMENT-F-RESUBMISSION-POLICY", sourceKind: "TEACHER_REQUIRED", payloadPath: "resubmissionPolicy" },
          { targetFieldId: "HW-ASSIGNMENT-F-ASSIGNMENT-TYPE", sourceKind: "GENERATED_PAYLOAD", payloadPath: "assignmentType" },
          { targetFieldId: "HW-ASSIGNMENT-F-QUESTION-ORDER", sourceKind: "GENERATED_PAYLOAD", payloadPath: "questionOrder" },
          { targetFieldId: "HW-ASSIGNMENT-F-RUBRIC-VERSION", sourceKind: "LESSON_FIELD", sourceFieldId: "PREP-LESSON-F-RUBRIC-VERSION", sourceVersionFieldId: "PREP-LESSON-F-VERSION" },
          { targetFieldId: "HW-ASSIGNMENT-F-KNOWLEDGE-POINT-IDS", sourceKind: "LESSON_FIELD", sourceFieldId: "PREP-LESSON-F-KNOWLEDGE-POINT-IDS", sourceVersionFieldId: "PREP-LESSON-F-VERSION" },
          { targetFieldId: "HW-ASSIGNMENT-F-FEEDBACK-POLICY", sourceKind: "POLICY_DEFAULT", policyKey: "assignment.feedbackPolicy" },
          { targetFieldId: "HW-ASSIGNMENT-F-NOTIFICATION-POLICY", sourceKind: "POLICY_DEFAULT", policyKey: "assignment.notificationPolicy" },
        ],
        completionRule: {
          failureResult: "HANDOFF_INCOMPLETE",
          requiredBindingCount: 15,
          requireAllTeacherInputs: true,
          rejectUnknownPayloadFields: true,
        },
        requiredConfirmationDutyRef: "DUTY-SUBJECT-TEACHER",
        effectBoundary: "DRAFT_ONLY_UNTIL_FORMAL_HW_ACTION",
      },
    },
  }),
];

const preparationModule = moduleFact({
  id: "PREP-001",
  phase: PHASE.FIRST,
  releaseStatus: RELEASE_STATUS.BUILD_READY,
  priority: "P0",
  title: "Lesson Preparation and Classroom Activity",
  objective: "Version lesson preparation facts and generate only a teacher-confirmed handoff draft for formal assignment creation",
  entryConditions: ["the subject teacher has an active authorized course and class context"],
  exitConditions: ["lesson preparation versions and draft-only assignment handoff evidence are retained"],
  baselineDecisionIds: ["BASE-003", "BASE-007", "BASE-010"],
  nfrIds: ["NFR-003", "NFR-006", "NFR-008"],
  objects: preparationObjects,
  relationships: [{
    id: "PREP-REL-DRAFT-LESSON",
    fromObjectId: "PREP-OBJ-ASSIGNMENT-DRAFT",
    toObjectId: "PREP-OBJ-LESSON-PLAN",
    type: "DERIVED_FROM",
    cardinality: "MANY_TO_ONE",
    ownershipScope: "SAME_SUBJECT",
    onSourceInvalidation: "invalidate the generated draft and require a new confirmed lesson version",
  }],
  actionFacts: preparationActions,
  pages: [
    page(
      "PREP-PAGE-LESSON-WORKSPACE",
      "Web Lesson Preparation Workspace",
      preparationObjects.map(({ id }) => id),
      preparationObjects.flatMap(({ fields }) => fields.map(({ id }) => id)),
      preparationActions
        .map(({ value }) => value.id)
        .filter((id) => id !== "PREP-ACT-RECORD-CLASSROOM-ACTIVITY"),
      [CLIENT.WEB],
    ),
    page(
      "PREP-PAGE-MOBILE-CLASSROOM",
      "Mobile Classroom Activity Workspace",
      preparationObjects.map(({ id }) => id),
      preparationObjects.flatMap(({ fields }) => fields.map(({ id }) => id)),
      preparationActions.map(({ value }) => value.id),
      [CLIENT.APP],
    ),
  ],
});

const questionFields = [
  optionField("CONTENT-QUESTION-F-SCHOOL-ID", "Content School", "OPT-COM-002", { dataType: "ID" }),
  optionField("CONTENT-QUESTION-F-SUBJECT-ID", "Content Subject", "OPT-COM-007", { dataType: "ID" }),
  optionField("CONTENT-QUESTION-F-COURSE-ID", "Content Course", "OPT-COM-008", { dataType: "ID" }),
  field("CONTENT-QUESTION-F-STEM", "Question Stem", { dataType: "TEXT" }),
  field("CONTENT-QUESTION-F-ANSWER", "Question Answer", { dataType: "JSON" }),
  field("CONTENT-QUESTION-F-ANALYSIS", "Question Analysis", { dataType: "TEXT" }),
  field("CONTENT-QUESTION-F-KNOWLEDGE-MAPPINGS", "Knowledge Point Mappings", { dataType: "JSON" }),
  systemField("CONTENT-QUESTION-F-VERSION", "Question Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
  optionField("CONTENT-QUESTION-F-AVAILABILITY", "Question Availability", "OPT-EXT-003", {
    mutability: "SYSTEM_MANAGED",
  }),
  field("CONTENT-QUESTION-F-LICENSE-REF", "Pinned Content License", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "CONTENT-OBJ-LICENSE" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "UPDATE_REQUIRED",
    actionApplicability: {
      requiredActionIds: ["CONTENT-ACT-PUBLISH-QUESTION-VERSION"],
    },
    versionBinding: {
      versionFieldId: "CONTENT-QUESTION-F-LICENSE-VERSION",
      targetVersionFieldId: "CONTENT-LICENSE-F-VERSION",
    },
  }),
  systemField("CONTENT-QUESTION-F-LICENSE-VERSION", "Pinned Content License Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  field("CONTENT-QUESTION-F-PERMISSION-REF", "Pinned Content Permission", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "CONTENT-OBJ-PERMISSION" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "UPDATE_REQUIRED",
    actionApplicability: {
      requiredActionIds: ["CONTENT-ACT-PUBLISH-QUESTION-VERSION"],
    },
    versionBinding: {
      versionFieldId: "CONTENT-QUESTION-F-PERMISSION-VERSION",
      targetVersionFieldId: "CONTENT-PERMISSION-F-VERSION",
    },
  }),
  systemField("CONTENT-QUESTION-F-PERMISSION-VERSION", "Pinned Content Permission Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
];
const licenseFields = [
  field("CONTENT-LICENSE-F-RIGHTSHOLDER", "Content Rightsholder"),
  field("CONTENT-LICENSE-F-TERMS", "Content License Terms", { dataType: "TEXT" }),
  optionField("CONTENT-LICENSE-F-STATUS", "Content License Status", "OPT-EXT-011", {
    mutability: "SYSTEM_MANAGED",
  }),
  systemField("CONTENT-LICENSE-F-VERSION", "Content License Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
];
const contentPermissionFields = [
  optionField("CONTENT-PERMISSION-F-SCOPE", "Content Permission Scope", "OPT-EXT-010"),
  optionField("CONTENT-PERMISSION-F-SCHOOL-ID", "Authorized School", "OPT-COM-002", {
    dataType: "ID",
    required: false,
  }),
  optionField("CONTENT-PERMISSION-F-SUBJECT-ID", "Authorized Subject", "OPT-COM-007", {
    dataType: "ID",
    required: false,
  }),
  optionField("CONTENT-PERMISSION-F-COURSE-ID", "Authorized Course", "OPT-COM-008", {
    dataType: "ID",
    required: false,
  }),
  field("CONTENT-PERMISSION-F-GRANTEE-ID", "Permission Grantee", { dataType: "ID" }),
  field("CONTENT-PERMISSION-F-EFFECTIVE-AT", "Permission Effective Time", {
    dataType: "DATETIME",
  }),
  field("CONTENT-PERMISSION-F-EXPIRES-AT", "Permission Expiry Time", {
    dataType: "DATETIME",
  }),
  systemField("CONTENT-PERMISSION-F-VERSION", "Content Permission Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
];
const contentObjects = [
  domainObject({
    id: "CONTENT-OBJ-QUESTION-VERSION",
    label: "Question Version",
    identityFieldId: "CONTENT-QUESTION-F-ID",
    responsibility: subjectLead,
    states: ["DRAFT", "PUBLISHED"],
    fields: questionFields,
    overrides: {
      lineageBindings: [
        {
          refFieldId: "CONTENT-QUESTION-F-LICENSE-REF",
          versionFieldId: "CONTENT-QUESTION-F-LICENSE-VERSION",
          targetObjectId: "CONTENT-OBJ-LICENSE",
          targetVersionFieldId: "CONTENT-LICENSE-F-VERSION",
        },
        {
          refFieldId: "CONTENT-QUESTION-F-PERMISSION-REF",
          versionFieldId: "CONTENT-QUESTION-F-PERMISSION-VERSION",
          targetObjectId: "CONTENT-OBJ-PERMISSION",
          targetVersionFieldId: "CONTENT-PERMISSION-F-VERSION",
        },
      ],
    },
  }),
  domainObject({
    id: "CONTENT-OBJ-LICENSE",
    label: "Content License Record",
    identityFieldId: "CONTENT-LICENSE-F-ID",
    responsibility: subjectLead,
    states: ["DRAFT", "ACTIVE"],
    fields: licenseFields,
  }),
  domainObject({
    id: "CONTENT-OBJ-PERMISSION",
    label: "Content Permission Grant",
    identityFieldId: "CONTENT-PERMISSION-F-ID",
    responsibility: subjectLead,
    states: ["DRAFT", "ACTIVE"],
    fields: contentPermissionFields,
    sensitivityId: "S3",
    overrides: {
      exclusiveSourceGroups: [
        { id: "SCHOOL", fieldIds: ["CONTENT-PERMISSION-F-SCHOOL-ID"] },
        { id: "SUBJECT", fieldIds: ["CONTENT-PERMISSION-F-SUBJECT-ID"] },
        { id: "COURSE", fieldIds: ["CONTENT-PERMISSION-F-COURSE-ID"] },
      ],
    },
  }),
];
const permissionGrantActionFacts = [
  [
    "CONTENT-ACT-CREATE-SCHOOL-PERMISSION",
    "Create School Content Permission Grant",
    "CONTENT-PERMISSION-F-SCHOOL-ID",
    "SCHOOL",
  ],
  [
    "CONTENT-ACT-CREATE-SUBJECT-PERMISSION",
    "Create Subject Content Permission Grant",
    "CONTENT-PERMISSION-F-SUBJECT-ID",
    "SUBJECT",
  ],
  [
    "CONTENT-ACT-CREATE-COURSE-PERMISSION",
    "Create Course Content Permission Grant",
    "CONTENT-PERMISSION-F-COURSE-ID",
    "COURSE",
  ],
].map(([id, label, payloadFieldId, scopeCode]) => action({
  id,
  label,
  targetObjectId: "CONTENT-OBJ-PERMISSION",
  operationKind: "CREATE",
  inputFieldIds: [
    "CONTENT-PERMISSION-F-SCOPE",
    payloadFieldId,
    "CONTENT-PERMISSION-F-GRANTEE-ID",
    "CONTENT-PERMISSION-F-EFFECTIVE-AT",
    "CONTENT-PERMISSION-F-EXPIRES-AT",
  ],
  outputFieldIds: ["CONTENT-PERMISSION-F-ID", "CONTENT-PERMISSION-F-VERSION"],
  permissions: leadPermissions,
  successState: "DRAFT",
  extras: {
    acceptedInputValues: [{
      fieldId: "CONTENT-PERMISSION-F-SCOPE",
      optionSetId: "OPT-EXT-010",
      partitionId: "CONTENT-PERMISSION-SCOPE",
      codes: [scopeCode],
    }],
  },
}));
const contentActions = [
  action({
    id: "CONTENT-ACT-CREATE-QUESTION-VERSION",
    label: "Create Question Version",
    targetObjectId: "CONTENT-OBJ-QUESTION-VERSION",
    operationKind: "CREATE",
    inputFieldIds: [
      "CONTENT-QUESTION-F-SCHOOL-ID",
      "CONTENT-QUESTION-F-SUBJECT-ID",
      "CONTENT-QUESTION-F-COURSE-ID",
      "CONTENT-QUESTION-F-STEM",
      "CONTENT-QUESTION-F-ANSWER",
      "CONTENT-QUESTION-F-ANALYSIS",
      "CONTENT-QUESTION-F-KNOWLEDGE-MAPPINGS",
      "CONTENT-QUESTION-F-LICENSE-REF",
      "CONTENT-QUESTION-F-PERMISSION-REF",
    ],
    outputFieldIds: [
      "CONTENT-QUESTION-F-ID",
      "CONTENT-QUESTION-F-VERSION",
      "CONTENT-QUESTION-F-AVAILABILITY",
      "CONTENT-QUESTION-F-LICENSE-VERSION",
      "CONTENT-QUESTION-F-PERMISSION-VERSION",
    ],
    permissions: leadPermissions,
    successState: "DRAFT",
  }),
  action({
    id: "CONTENT-ACT-PUBLISH-QUESTION-VERSION",
    label: "Publish Question Version",
    targetObjectId: "CONTENT-OBJ-QUESTION-VERSION",
    operationKind: "UPDATE",
    inputFieldIds: [
      "CONTENT-QUESTION-F-LICENSE-REF",
      "CONTENT-QUESTION-F-LICENSE-VERSION",
      "CONTENT-QUESTION-F-PERMISSION-REF",
      "CONTENT-QUESTION-F-PERMISSION-VERSION",
    ],
    outputFieldIds: ["CONTENT-QUESTION-F-VERSION", "CONTENT-QUESTION-F-AVAILABILITY"],
    permissions: leadPermissions,
    transition: { from: "DRAFT", to: "PUBLISHED" },
    failureResults: [
      "PERMISSION_DENIED",
      "LICENSE_INACTIVE",
      "CONTENT_PERMISSION_INACTIVE",
      "SOURCE_VERSION_STALE",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [
        {
          refFieldId: "CONTENT-QUESTION-F-LICENSE-REF",
          versionFieldId: "CONTENT-QUESTION-F-LICENSE-VERSION",
          targetObjectId: "CONTENT-OBJ-LICENSE",
          requiredState: "ACTIVE",
        },
        {
          refFieldId: "CONTENT-QUESTION-F-PERMISSION-REF",
          versionFieldId: "CONTENT-QUESTION-F-PERMISSION-VERSION",
          targetObjectId: "CONTENT-OBJ-PERMISSION",
          requiredState: "ACTIVE",
        },
      ],
      permissionCoverage: {
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
      },
    },
  }),
  action({
    id: "CONTENT-ACT-CREATE-LICENSE",
    label: "Create Content License Record",
    targetObjectId: "CONTENT-OBJ-LICENSE",
    operationKind: "CREATE",
    inputFieldIds: ["CONTENT-LICENSE-F-RIGHTSHOLDER", "CONTENT-LICENSE-F-TERMS"],
    outputFieldIds: [
      "CONTENT-LICENSE-F-ID",
      "CONTENT-LICENSE-F-STATUS",
      "CONTENT-LICENSE-F-VERSION",
    ],
    permissions: leadPermissions,
    successState: "DRAFT",
  }),
  action({
    id: "CONTENT-ACT-ACTIVATE-LICENSE",
    label: "Activate Content License",
    targetObjectId: "CONTENT-OBJ-LICENSE",
    operationKind: "UPDATE",
    outputFieldIds: ["CONTENT-LICENSE-F-STATUS", "CONTENT-LICENSE-F-VERSION"],
    permissions: leadPermissions,
    transition: { from: "DRAFT", to: "ACTIVE" },
  }),
  ...permissionGrantActionFacts,
  action({
    id: "CONTENT-ACT-ACTIVATE-PERMISSION",
    label: "Activate Content Permission Grant",
    targetObjectId: "CONTENT-OBJ-PERMISSION",
    operationKind: "UPDATE",
    outputFieldIds: ["CONTENT-PERMISSION-F-VERSION"],
    permissions: leadPermissions,
    transition: { from: "DRAFT", to: "ACTIVE" },
  }),
];
const contentModule = moduleFact({
  id: "CONTENT-001",
  phase: PHASE.FIRST,
  releaseStatus: RELEASE_STATUS.BUILD_READY,
  priority: "P0",
  title: "Versioned Question and Content Governance",
  objective: "Keep question answers analyses knowledge mappings licensing permissions and availability version-complete",
  entryConditions: ["the subject lead has an authorized subject content-governance context"],
  exitConditions: ["published content is traceable to active licensing and permission facts"],
  baselineDecisionIds: ["BASE-003", "BASE-007"],
  nfrIds: ["NFR-006", "NFR-008"],
  objects: contentObjects,
  relationships: [
    {
      id: "CONTENT-REL-QUESTION-LICENSE",
      fromObjectId: "CONTENT-OBJ-QUESTION-VERSION",
      toObjectId: "CONTENT-OBJ-LICENSE",
      type: "REQUIRES",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SUBJECT",
      onSourceInvalidation: "block publication and require a new pinned active license version",
    },
    {
      id: "CONTENT-REL-QUESTION-PERMISSION",
      fromObjectId: "CONTENT-OBJ-QUESTION-VERSION",
      toObjectId: "CONTENT-OBJ-PERMISSION",
      type: "AUTHORIZED_BY",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SUBJECT",
      onSourceInvalidation: "block publication and require a new pinned active permission version",
    },
  ],
  actionFacts: contentActions,
  pages: [page(
    "CONTENT-PAGE-GOVERNANCE",
    "Question and Content Governance Workspace",
    contentObjects.map(({ id }) => id),
    contentObjects.flatMap(({ fields }) => fields.map(({ id }) => id)),
    contentActions.map(({ value }) => value.id),
  )],
});

const examEventFields = [
  field("EXM-EVENT-F-NAME", "Exam Event Name"),
  optionField("EXM-EVENT-F-TERM", "Exam Term", "OPT-COM-004"),
  optionField("EXM-EVENT-F-STATUS", "Exam Event Status", "OPT-EXT-004", {
    mutability: "SYSTEM_MANAGED",
  }),
  systemField("EXM-EVENT-F-PUBLICATION-AT", "Exam Publication Time", "DATETIME", {
    required: conditionalRequired(
      "required only when the exam event is published",
      ["PUBLISHED"],
      ["EXM-ACT-PUBLISH-EVENT"],
    ),
  }),
];
const scoreImportFields = [
  field("EXM-IMPORT-F-FILE", "Subject Score Import File", { dataType: "FILE_REFERENCE" }),
  optionField("EXM-IMPORT-F-SUBJECT", "Imported Subject", "OPT-COM-007"),
  optionField("EXM-IMPORT-F-VALIDATION", "Import Validation Result", "OPT-EXT-005", {
    mutability: "SYSTEM_MANAGED",
  }),
  systemField("EXM-IMPORT-F-EVIDENCE", "Import Validation Evidence", "JSON"),
  systemField("EXM-IMPORT-F-VERSION", "Score Import Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
  field("EXM-IMPORT-F-REJECTION-REASON", "Score Import Rejection Reason", {
    dataType: "TEXT",
    required: conditionalRequired(
      "required when score import validation is REJECTED",
      ["REJECTED"],
      ["EXM-ACT-REJECT-SCORE-IMPORT"],
    ),
  }),
];
const aggregateRuleFields = [
  field("EXM-RULE-F-DEFINITION", "Aggregate Score Rule Definition", { dataType: "JSON" }),
  systemField("EXM-RULE-F-VERSION", "Aggregate Score Rule Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
];
const subjectScoreFields = [
  optionField("EXM-SCORE-F-STUDENT-ID", "Student", "OPT-COM-010", { dataType: "ID" }),
  optionField("EXM-SCORE-F-SUBJECT", "Subject", "OPT-COM-007", { dataType: "ID" }),
  field("EXM-SCORE-F-SCORE", "Published Subject Score", {
    dataType: "DECIMAL",
    releaseRequirement: {
      readPolicyId: "EXM-RP-STUDENT-SCORE",
      requiredState: "PUBLISHED",
      visibleAtFieldId: "EXM-SCORE-F-VISIBLE-AT",
    },
  }),
  systemField("EXM-SCORE-F-EVIDENCE", "Subject Score Evidence", "JSON", {
    releaseRequirement: {
      readPolicyId: "EXM-RP-STUDENT-SCORE",
      requiredState: "PUBLISHED",
      visibleAtFieldId: "EXM-SCORE-F-VISIBLE-AT",
    },
  }),
  field("EXM-SCORE-F-IMPORT-REF", "Pinned Passed Score Import", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "EXM-OBJ-SCORE-IMPORT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["EXM-ACT-CREATE-SUBJECT-SCORE"] },
    versionBinding: {
      versionFieldId: "EXM-SCORE-F-IMPORT-VERSION",
      targetVersionFieldId: "EXM-IMPORT-F-VERSION",
    },
  }),
  systemField("EXM-SCORE-F-IMPORT-VERSION", "Pinned Score Import Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  systemField("EXM-SCORE-F-TEACHER-CONFIRMED-AT", "Subject Teacher Confirmation Time", "DATETIME", {
    required: conditionalRequired(
      "required only after subject-teacher confirmation",
      ["TEACHER_CONFIRMED"],
      ["EXM-ACT-CONFIRM-SUBJECT-SCORE"],
    ),
  }),
  systemField("EXM-SCORE-F-VISIBLE-AT", "Student Score Visible Time", "DATETIME", {
    required: conditionalRequired(
      "required when the subject score is first published",
      ["PUBLISHED"],
      ["EXM-ACT-PUBLISH-SUBJECT-SCORE"],
    ),
  }),
  optionField("EXM-SCORE-F-CONFIRMATION-DECISION", "Subject Score Confirmation Decision", "OPT-EXT-018", {
    required: conditionalRequired(
      "required for subject-teacher confirmation or rejection",
      ["TEACHER_CONFIRMED", "REJECTED"],
      ["EXM-ACT-CONFIRM-SUBJECT-SCORE", "EXM-ACT-REJECT-SUBJECT-SCORE"],
    ),
  }),
  field("EXM-SCORE-F-CONFIRMATION-REASON", "Subject Score Confirmation Reason", {
    dataType: "TEXT",
    required: conditionalRequired(
      "required for subject-teacher confirmation or rejection",
      ["TEACHER_CONFIRMED", "REJECTED"],
      ["EXM-ACT-CONFIRM-SUBJECT-SCORE", "EXM-ACT-REJECT-SUBJECT-SCORE"],
    ),
  }),
  systemField("EXM-SCORE-F-VERSION", "Subject Score Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
];
const examObjects = [
  domainObject({
    id: "EXM-OBJ-EXAM-EVENT",
    label: "Exam Event",
    identityFieldId: "EXM-EVENT-F-ID",
    responsibility: academic,
    states: ["DRAFT", "PUBLISHED", "CORRECTION_OPEN"],
    fields: examEventFields,
    overrides: { studentDataKind: STUDENT_DATA_KIND.NONE },
  }),
  domainObject({
    id: "EXM-OBJ-SCORE-IMPORT",
    label: "Subject Score Import Batch",
    identityFieldId: "EXM-IMPORT-F-ID",
    responsibility: academic,
    states: ["PENDING", "PASSED", "REJECTED", "ACCEPTED"],
    fields: scoreImportFields,
    sensitivityId: "S3",
    overrides: { studentDataKind: STUDENT_DATA_KIND.DETAIL },
  }),
  domainObject({
    id: "EXM-OBJ-AGGREGATE-RULE",
    label: "Aggregate Score Rule Version",
    identityFieldId: "EXM-RULE-F-ID",
    responsibility: academic,
    states: ["DRAFT", "ACTIVE"],
    fields: aggregateRuleFields,
    overrides: { studentDataKind: STUDENT_DATA_KIND.NONE },
  }),
  domainObject({
    id: "EXM-OBJ-SUBJECT-SCORE",
    label: "Published Subject Score Version",
    identityFieldId: "EXM-SCORE-F-ID",
    responsibility: {
      ...academic,
      dataSubject: "STUDENT_SUBJECT_SCORE",
      confirmerRef: "DUTY-SUBJECT-TEACHER",
    },
    states: ["IMPORTED", "REJECTED", "TEACHER_CONFIRMED", "PUBLISHED", "CORRECTED"],
    fields: subjectScoreFields,
    sensitivityId: "S3",
    overrides: {
      readMode: "STUDENT_TIMED_RELEASE",
      readPolicies: [{
        id: "EXM-RP-STUDENT-SCORE",
        actionId: "EXM-ACT-VIEW-PUBLISHED-SCORE",
        subject: { roleRef: "ROLE-STUDENT" },
        scope: { kind: "OWN_RECORD", subjectFieldId: "EXM-SCORE-F-STUDENT-ID" },
        requiredState: "PUBLISHED",
        safeMetadataFieldIds: ["EXM-SCORE-F-VERSION"],
        timeGates: [{
          visibleAtFieldId: "EXM-SCORE-F-VISIBLE-AT",
          protectedFieldIds: ["EXM-SCORE-F-SCORE", "EXM-SCORE-F-EVIDENCE"],
        }],
      }],
      lineageBindings: [{
        refFieldId: "EXM-SCORE-F-IMPORT-REF",
        versionFieldId: "EXM-SCORE-F-IMPORT-VERSION",
        targetObjectId: "EXM-OBJ-SCORE-IMPORT",
        targetVersionFieldId: "EXM-IMPORT-F-VERSION",
      }],
    },
  }),
];
const examActions = [
  action({
    id: "EXM-ACT-CREATE-EVENT",
    label: "Create Exam Event",
    targetObjectId: "EXM-OBJ-EXAM-EVENT",
    operationKind: "CREATE",
    inputFieldIds: ["EXM-EVENT-F-NAME", "EXM-EVENT-F-TERM"],
    outputFieldIds: ["EXM-EVENT-F-ID", "EXM-EVENT-F-STATUS"],
    permissions: academicPermissions,
    successState: "DRAFT",
  }),
  action({
    id: "EXM-ACT-PUBLISH-EVENT",
    label: "Publish Exam Event",
    targetObjectId: "EXM-OBJ-EXAM-EVENT",
    operationKind: "UPDATE",
    outputFieldIds: ["EXM-EVENT-F-STATUS", "EXM-EVENT-F-PUBLICATION-AT"],
    permissions: academicPermissions,
    transition: { from: "DRAFT", to: "PUBLISHED" },
  }),
  action({
    id: "EXM-ACT-OPEN-CORRECTION",
    label: "Open Exam Correction Window",
    targetObjectId: "EXM-OBJ-EXAM-EVENT",
    operationKind: "UPDATE",
    outputFieldIds: ["EXM-EVENT-F-STATUS"],
    permissions: academicPermissions,
    transition: { from: "PUBLISHED", to: "CORRECTION_OPEN" },
  }),
  action({
    id: "EXM-ACT-IMPORT-SCORES",
    label: "Import Subject Scores",
    targetObjectId: "EXM-OBJ-SCORE-IMPORT",
    operationKind: "CREATE",
    inputFieldIds: ["EXM-IMPORT-F-FILE", "EXM-IMPORT-F-SUBJECT"],
    outputFieldIds: [
      "EXM-IMPORT-F-ID",
      "EXM-IMPORT-F-VALIDATION",
      "EXM-IMPORT-F-EVIDENCE",
      "EXM-IMPORT-F-VERSION",
    ],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    successState: "PENDING",
  }),
  action({
    id: "EXM-ACT-VALIDATE-SCORE-IMPORT",
    label: "Validate Subject Score Import",
    targetObjectId: "EXM-OBJ-SCORE-IMPORT",
    operationKind: "UPDATE",
    outputFieldIds: [
      "EXM-IMPORT-F-VALIDATION",
      "EXM-IMPORT-F-EVIDENCE",
      "EXM-IMPORT-F-VERSION",
    ],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "PENDING", to: "PASSED" },
    failureResults: [
      "PERMISSION_DENIED",
      "IMPORT_REJECTED",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
  }),
  action({
    id: "EXM-ACT-REJECT-SCORE-IMPORT",
    label: "Reject Invalid Subject Score Import",
    targetObjectId: "EXM-OBJ-SCORE-IMPORT",
    operationKind: "UPDATE",
    inputFieldIds: ["EXM-IMPORT-F-REJECTION-REASON"],
    outputFieldIds: [
      "EXM-IMPORT-F-VALIDATION",
      "EXM-IMPORT-F-EVIDENCE",
      "EXM-IMPORT-F-VERSION",
      "EXM-IMPORT-F-REJECTION-REASON",
    ],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "PENDING", to: "REJECTED" },
  }),
  action({
    id: "EXM-ACT-REVISE-REJECTED-IMPORT",
    label: "Revise Rejected Subject Score Import",
    targetObjectId: "EXM-OBJ-SCORE-IMPORT",
    operationKind: "UPDATE",
    inputFieldIds: ["EXM-IMPORT-F-FILE"],
    outputFieldIds: [
      "EXM-IMPORT-F-VALIDATION",
      "EXM-IMPORT-F-EVIDENCE",
      "EXM-IMPORT-F-VERSION",
    ],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "REJECTED", to: "PENDING" },
  }),
  action({
    id: "EXM-ACT-ACCEPT-SCORE-IMPORT",
    label: "Accept Validated Subject Score Import",
    targetObjectId: "EXM-OBJ-SCORE-IMPORT",
    operationKind: "UPDATE",
    outputFieldIds: [
      "EXM-IMPORT-F-VALIDATION",
      "EXM-IMPORT-F-EVIDENCE",
      "EXM-IMPORT-F-VERSION",
    ],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "PASSED", to: "ACCEPTED" },
    failureResults: [
      "PERMISSION_DENIED",
      "IMPORT_REJECTED",
      "SOURCE_VERSION_STALE",
      "VERSION_CONFLICT",
    ],
  }),
  action({
    id: "EXM-ACT-CREATE-AGGREGATE-RULE",
    label: "Create Aggregate Score Rule Version",
    targetObjectId: "EXM-OBJ-AGGREGATE-RULE",
    operationKind: "CREATE",
    inputFieldIds: ["EXM-RULE-F-DEFINITION"],
    outputFieldIds: ["EXM-RULE-F-ID", "EXM-RULE-F-VERSION"],
    permissions: academicPermissions,
    successState: "DRAFT",
  }),
  action({
    id: "EXM-ACT-ACTIVATE-AGGREGATE-RULE",
    label: "Activate Aggregate Score Rule Version",
    targetObjectId: "EXM-OBJ-AGGREGATE-RULE",
    operationKind: "UPDATE",
    outputFieldIds: ["EXM-RULE-F-VERSION"],
    permissions: academicPermissions,
    transition: { from: "DRAFT", to: "ACTIVE" },
  }),
  action({
    id: "EXM-ACT-CREATE-SUBJECT-SCORE",
    label: "Create Imported Subject Score Version",
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    operationKind: "CREATE",
    inputFieldIds: [
      "EXM-SCORE-F-STUDENT-ID",
      "EXM-SCORE-F-SUBJECT",
      "EXM-SCORE-F-SCORE",
      "EXM-SCORE-F-IMPORT-REF",
      "EXM-SCORE-F-IMPORT-VERSION",
    ],
    outputFieldIds: [
      "EXM-SCORE-F-ID",
      "EXM-SCORE-F-EVIDENCE",
      "EXM-SCORE-F-VERSION",
    ],
    permissions: academicPermissions,
    successState: "IMPORTED",
    failureResults: [
      "PERMISSION_DENIED",
      "IMPORT_REJECTED",
      "SOURCE_VERSION_STALE",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [{
        refFieldId: "EXM-SCORE-F-IMPORT-REF",
        versionFieldId: "EXM-SCORE-F-IMPORT-VERSION",
        targetObjectId: "EXM-OBJ-SCORE-IMPORT",
        requiredState: "ACCEPTED",
      }],
    },
  }),
  action({
    id: "EXM-ACT-CONFIRM-SUBJECT-SCORE",
    label: "Confirm Subject Score Professionally",
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    operationKind: "UPDATE",
    inputFieldIds: [
      "EXM-SCORE-F-CONFIRMATION-DECISION",
      "EXM-SCORE-F-CONFIRMATION-REASON",
    ],
    outputFieldIds: [
      "EXM-SCORE-F-EVIDENCE",
      "EXM-SCORE-F-TEACHER-CONFIRMED-AT",
      "EXM-SCORE-F-VERSION",
      "EXM-SCORE-F-CONFIRMATION-DECISION",
      "EXM-SCORE-F-CONFIRMATION-REASON",
    ],
    permissions: teacherPermissions,
    transition: { from: "IMPORTED", to: "TEACHER_CONFIRMED" },
    failureResults: [
      "PERMISSION_DENIED",
      "SCORE_REJECTED",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      acceptedInputValues: [{
        fieldId: "EXM-SCORE-F-CONFIRMATION-DECISION",
        optionSetId: "OPT-EXT-018",
        partitionId: "EXM-SCORE-CONFIRMATION",
        codes: ["CONFIRM"],
      }],
    },
  }),
  action({
    id: "EXM-ACT-REJECT-SUBJECT-SCORE",
    label: "Reject Imported Subject Score for Revision",
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    operationKind: "UPDATE",
    inputFieldIds: [
      "EXM-SCORE-F-CONFIRMATION-DECISION",
      "EXM-SCORE-F-CONFIRMATION-REASON",
    ],
    outputFieldIds: [
      "EXM-SCORE-F-EVIDENCE",
      "EXM-SCORE-F-VERSION",
      "EXM-SCORE-F-CONFIRMATION-DECISION",
      "EXM-SCORE-F-CONFIRMATION-REASON",
    ],
    permissions: teacherPermissions,
    transition: { from: "IMPORTED", to: "REJECTED" },
    extras: {
      acceptedInputValues: [{
        fieldId: "EXM-SCORE-F-CONFIRMATION-DECISION",
        optionSetId: "OPT-EXT-018",
        partitionId: "EXM-SCORE-CONFIRMATION",
        codes: ["REJECT"],
      }],
    },
  }),
  action({
    id: "EXM-ACT-REVISE-REJECTED-SUBJECT-SCORE",
    label: "Revise Rejected Subject Score",
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    operationKind: "UPDATE",
    inputFieldIds: ["EXM-SCORE-F-SCORE"],
    outputFieldIds: ["EXM-SCORE-F-SCORE", "EXM-SCORE-F-EVIDENCE", "EXM-SCORE-F-VERSION"],
    permissions: teacherPermissions,
    transition: { from: "REJECTED", to: "IMPORTED" },
  }),
  action({
    id: "EXM-ACT-PUBLISH-SUBJECT-SCORE",
    label: "Publish Teacher Confirmed Subject Score",
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    operationKind: "UPDATE",
    outputFieldIds: ["EXM-SCORE-F-VISIBLE-AT", "EXM-SCORE-F-VERSION"],
    permissions: academicPermissions,
    transition: { from: "TEACHER_CONFIRMED", to: "PUBLISHED" },
    failureResults: [
      "PERMISSION_DENIED",
      "SCORE_REJECTED",
      "TEACHER_CONFIRMATION_REQUIRED",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
  }),
  action({
    id: "EXM-ACT-CORRECT-SUBJECT-SCORE",
    label: "Correct Published Subject Score",
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    operationKind: "UPDATE",
    inputFieldIds: ["EXM-SCORE-F-SCORE"],
    outputFieldIds: ["EXM-SCORE-F-EVIDENCE", "EXM-SCORE-F-VERSION"],
    permissions: teacherPermissions,
    transition: { from: "PUBLISHED", to: "CORRECTED" },
  }),
  action({
    id: "EXM-ACT-REPUBLISH-CORRECTED-SCORE",
    label: "Republish Corrected Subject Score",
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    operationKind: "UPDATE",
    outputFieldIds: ["EXM-SCORE-F-VERSION"],
    permissions: academicPermissions,
    transition: { from: "CORRECTED", to: "PUBLISHED" },
  }),
  action({
    id: "EXM-ACT-VIEW-PUBLISHED-SCORE",
    label: "View My Published Subject Score",
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    operationKind: "READ",
    inputFieldIds: ["EXM-SCORE-F-STUDENT-ID"],
    outputFieldIds: [
      "EXM-SCORE-F-STUDENT-ID",
      "EXM-SCORE-F-SCORE",
      "EXM-SCORE-F-EVIDENCE",
      "EXM-SCORE-F-VERSION",
      "EXM-SCORE-F-VISIBLE-AT",
    ],
    permissions: permissions(
      "ROLE-STUDENT",
      ["ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS"],
      "the student reads only the student's own score after the score reaches PUBLISHED and visibleAt opens",
    ),
    clients: WEB_APP,
    failureResults: [
      "PERMISSION_DENIED",
      "NOT_FOUND",
      "RESULT_NOT_PUBLISHED",
      "RESULT_NOT_VISIBLE",
    ],
  }),
];
const examAdminActionIds = examActions
  .map(({ value }) => value.id)
  .filter((id) => id !== "EXM-ACT-VIEW-PUBLISHED-SCORE");
const examModule = moduleFact({
  id: "EXM-001",
  phase: PHASE.FIRST,
  releaseStatus: RELEASE_STATUS.BUILD_READY,
  priority: "P0",
  title: "Exam Event Score Import and Publication",
  objective: "Govern exam events validation aggregate rules subject confirmation publication correction and evidence",
  entryConditions: ["academic administration has an authorized school term and exam context"],
  exitConditions: ["students can read only published scores backed by import and teacher-confirmation evidence"],
  baselineDecisionIds: ["BASE-003", "BASE-007", "BASE-010"],
  nfrIds: ["NFR-003", "NFR-006", "NFR-008"],
  objects: examObjects,
  relationships: [{
    id: "EXM-REL-SCORE-IMPORT",
    fromObjectId: "EXM-OBJ-SUBJECT-SCORE",
    toObjectId: "EXM-OBJ-SCORE-IMPORT",
    type: "DERIVED_FROM",
    cardinality: "MANY_TO_ONE",
    ownershipScope: "SAME_SCHOOL",
    onSourceInvalidation: "block score creation and mark unconfirmed derived score versions stale",
  }],
  actionFacts: examActions,
  pages: [
    page(
      "EXM-PAGE-ACADEMIC-OPERATIONS",
      "Exam Academic Operations Workspace",
      examObjects.map(({ id }) => id),
      examObjects.flatMap(({ fields }) => fields.map(({ id }) => id)),
      examAdminActionIds,
      [CLIENT.WEB],
    ),
    page(
      "EXM-PAGE-MOBILE-ACADEMIC-REVIEW",
      "Mobile Exam Academic Review",
      examObjects.map(({ id }) => id),
      examObjects.flatMap(({ fields }) => fields.map(({ id }) => id)),
      examActions
        .map(({ value }) => value)
        .filter(({ id, clients }) => (
          id !== "EXM-ACT-VIEW-PUBLISHED-SCORE" && clients.includes(CLIENT.APP)
        ))
        .map(({ id }) => id),
      [CLIENT.APP],
    ),
    page(
      "EXM-PAGE-STUDENT-PUBLISHED-SCORE",
      "Student Published Subject Score",
      ["EXM-OBJ-SUBJECT-SCORE"],
      [
        "EXM-SCORE-F-STUDENT-ID",
        "EXM-SCORE-F-SCORE",
        "EXM-SCORE-F-EVIDENCE",
        "EXM-SCORE-F-VERSION",
        "EXM-SCORE-F-VISIBLE-AT",
      ],
      ["EXM-ACT-VIEW-PUBLISHED-SCORE"],
      WEB_APP,
    ),
  ],
});

const calendarFields = [
  optionField("SCH-CALENDAR-F-TERM", "School Term", "OPT-COM-004"),
  field("SCH-CALENDAR-F-WORKING-DAYS", "Working Days and Periods", { dataType: "JSON" }),
  systemField("SCH-CALENDAR-F-VERSION", "Calendar Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
];
const constraintFields = [
  optionField("SCH-CONSTRAINT-F-KIND", "Constraint Kind", "OPT-EXT-017"),
  optionField("SCH-CONSTRAINT-F-HARDNESS", "Constraint Hardness", "OPT-EXT-006"),
  field("SCH-CONSTRAINT-F-TEACHER-AVAILABILITY-WINDOWS", "Teacher Availability Windows", {
    dataType: "JSON",
    required: false,
    payloadContract: {
      kindCode: "TEACHER_AVAILABILITY",
      requiredKeys: ["teacherId", "availablePeriods"],
    },
  }),
  field("SCH-CONSTRAINT-F-CLASS-COURSE-PERIOD-RULES", "Class Course Period Rules", {
    dataType: "JSON",
    required: false,
    payloadContract: {
      kindCode: "CLASS_PERIOD",
      requiredKeys: ["classId", "courseId", "allowedPeriods"],
    },
  }),
  field("SCH-CONSTRAINT-F-TEACHER-LOAD-LIMITS", "Teacher Course Load Limits", {
    dataType: "JSON",
    required: false,
    payloadContract: {
      kindCode: "COURSE_LOAD",
      requiredKeys: ["teacherId", "courseId", "maxPeriodsPerWeek"],
    },
  }),
  field("SCH-CONSTRAINT-F-ROOM-CAPACITY-RULES", "Room Capacity Rules", {
    dataType: "JSON",
    required: false,
    payloadContract: {
      kindCode: "ROOM_CAPACITY",
      requiredKeys: ["roomId", "minimumCapacity"],
    },
  }),
  systemField("SCH-CONSTRAINT-F-VERSION", "Constraint Snapshot Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
];
const constraintSnapshotFields = [
  field("SCH-CONSTRAINT-SNAPSHOT-F-ITEMS", "Constraint Snapshot Items", {
    dataType: "JSON",
    mutability: "IMMUTABLE",
    snapshotItemContract: {
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
    },
  }),
  systemField(
    "SCH-CONSTRAINT-SNAPSHOT-F-CONSTRAINT-IDS",
    "Constraint Snapshot Stable IDs",
    "STRING_ARRAY",
    { mutability: "IMMUTABLE", idempotencyRole: "FANOUT_SET" },
  ),
  systemField("SCH-CONSTRAINT-SNAPSHOT-F-HASH", "Constraint Snapshot Hash", "STRING", {
    mutability: "IMMUTABLE",
  }),
  systemField("SCH-CONSTRAINT-SNAPSHOT-F-STATUS", "Constraint Snapshot Status", "STRING"),
  systemField("SCH-CONSTRAINT-SNAPSHOT-F-VERSION", "Constraint Snapshot Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
];
const candidateFields = [
  field("SCH-CANDIDATE-F-ASSIGNMENTS", "Candidate Teacher Class Course Room Assignments", { dataType: "JSON" }),
  optionField("SCH-CANDIDATE-F-HARD-CHECK", "Hard Constraint Check", "OPT-EXT-007", {
    mutability: "SYSTEM_MANAGED",
  }),
  systemField("SCH-CANDIDATE-F-CONFLICTS", "Conflict Review Findings", "JSON"),
  field(
    "SCH-CANDIDATE-F-SOFT-CONSTRAINT-ACKNOWLEDGED",
    "Soft Constraint Acknowledgement",
    {
      dataType: "BOOLEAN",
      required: conditionalRequired(
        "required when the schedule candidate is confirmed",
        ["CONFIRMED"],
        ["SCH-ACT-CONFIRM-CANDIDATE"],
      ),
    },
  ),
  optionField("SCH-CANDIDATE-F-STATUS", "Schedule Candidate Status", "OPT-EXT-014", {
    mutability: "SYSTEM_MANAGED",
  }),
  field("SCH-CANDIDATE-F-CALENDAR-REF", "Pinned Calendar Version", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "SCH-OBJ-CALENDAR" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "ALWAYS_REQUIRED",
    actionApplicability: {
      requiredActionIds: [
        "SCH-ACT-GENERATE-CANDIDATE",
        "SCH-ACT-CONFIRM-CANDIDATE",
        "SCH-ACT-PUBLISH-CANDIDATE",
      ],
    },
    versionBinding: {
      versionFieldId: "SCH-CANDIDATE-F-CALENDAR-VERSION",
      targetVersionFieldId: "SCH-CALENDAR-F-VERSION",
    },
  }),
  systemField("SCH-CANDIDATE-F-CALENDAR-VERSION", "Pinned Calendar Version Number", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  field("SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF", "Pinned Constraint Snapshot", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "SCH-OBJ-CONSTRAINT-SNAPSHOT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "ALWAYS_REQUIRED",
    actionApplicability: {
      requiredActionIds: [
        "SCH-ACT-GENERATE-CANDIDATE",
        "SCH-ACT-CONFIRM-CANDIDATE",
        "SCH-ACT-PUBLISH-CANDIDATE",
      ],
    },
    versionBinding: {
      versionFieldId: "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION",
      targetVersionFieldId: "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
    },
  }),
  systemField(
    "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION",
    "Pinned Constraint Snapshot Version",
    "INTEGER",
    { mutability: "IMMUTABLE" },
  ),
];
const scheduleObjects = [
  domainObject({
    id: "SCH-OBJ-CALENDAR",
    label: "School Calendar Version",
    identityFieldId: "SCH-CALENDAR-F-ID",
    responsibility: academic,
    states: ["DRAFT", "PUBLISHED"],
    fields: calendarFields,
    overrides: { studentDataKind: STUDENT_DATA_KIND.NONE },
  }),
  domainObject({
    id: "SCH-OBJ-CONSTRAINT",
    label: "Schedule Constraint",
    identityFieldId: "SCH-CONSTRAINT-F-ID",
    responsibility: academic,
    states: ["DRAFT", "ACTIVE"],
    fields: constraintFields,
    overrides: {
      studentDataKind: STUDENT_DATA_KIND.NONE,
      exclusiveSourceGroups: [
        {
          id: "TEACHER_AVAILABILITY",
          fieldIds: ["SCH-CONSTRAINT-F-TEACHER-AVAILABILITY-WINDOWS"],
        },
        {
          id: "CLASS_PERIOD",
          fieldIds: ["SCH-CONSTRAINT-F-CLASS-COURSE-PERIOD-RULES"],
        },
        {
          id: "COURSE_LOAD",
          fieldIds: ["SCH-CONSTRAINT-F-TEACHER-LOAD-LIMITS"],
        },
        {
          id: "ROOM_CAPACITY",
          fieldIds: ["SCH-CONSTRAINT-F-ROOM-CAPACITY-RULES"],
        },
      ],
    },
  }),
  domainObject({
    id: "SCH-OBJ-CONSTRAINT-SNAPSHOT",
    label: "Immutable Constraint Snapshot",
    identityFieldId: "SCH-CONSTRAINT-SNAPSHOT-F-ID",
    responsibility: academic,
    states: ["DRAFT", "ACTIVE", "REPLACED"],
    fields: constraintSnapshotFields,
    overrides: { studentDataKind: STUDENT_DATA_KIND.NONE },
  }),
  domainObject({
    id: "SCH-OBJ-CANDIDATE",
    label: "Schedule Candidate Version",
    identityFieldId: "SCH-CANDIDATE-F-ID",
    responsibility: academic,
    states: ["GENERATED", "REVIEWED", "CONFIRMED", "PUBLISHED", "STALE"],
    fields: candidateFields,
    overrides: {
      studentDataKind: STUDENT_DATA_KIND.NONE,
      lineageBindings: [
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
      ],
    },
  }),
];
const constraintCreateActionFacts = [
  [
    "SCH-ACT-CREATE-TEACHER-AVAILABILITY-CONSTRAINT",
    "Create Teacher Availability Constraint Snapshot",
    "SCH-CONSTRAINT-F-TEACHER-AVAILABILITY-WINDOWS",
    "TEACHER_AVAILABILITY",
  ],
  [
    "SCH-ACT-CREATE-CLASS-PERIOD-CONSTRAINT",
    "Create Class Course Period Constraint Snapshot",
    "SCH-CONSTRAINT-F-CLASS-COURSE-PERIOD-RULES",
    "CLASS_PERIOD",
  ],
  [
    "SCH-ACT-CREATE-COURSE-LOAD-CONSTRAINT",
    "Create Teacher Course Load Constraint Snapshot",
    "SCH-CONSTRAINT-F-TEACHER-LOAD-LIMITS",
    "COURSE_LOAD",
  ],
  [
    "SCH-ACT-CREATE-ROOM-CAPACITY-CONSTRAINT",
    "Create Room Capacity Constraint Snapshot",
    "SCH-CONSTRAINT-F-ROOM-CAPACITY-RULES",
    "ROOM_CAPACITY",
  ],
].map(([id, label, payloadFieldId, kindCode]) => action({
  id,
  label,
  targetObjectId: "SCH-OBJ-CONSTRAINT",
  operationKind: "CREATE",
  inputFieldIds: ["SCH-CONSTRAINT-F-KIND", "SCH-CONSTRAINT-F-HARDNESS", payloadFieldId],
  outputFieldIds: ["SCH-CONSTRAINT-F-ID", "SCH-CONSTRAINT-F-VERSION"],
  permissions: academicPermissions,
  clients: [CLIENT.WEB],
  successState: "DRAFT",
  extras: {
    acceptedInputValues: [{
      fieldId: "SCH-CONSTRAINT-F-KIND",
      optionSetId: "OPT-EXT-017",
      partitionId: "SCH-CONSTRAINT-KIND",
      codes: [kindCode],
    }],
  },
}));

const scheduleActions = [
  action({
    id: "SCH-ACT-CREATE-CALENDAR",
    label: "Create School Calendar Version",
    targetObjectId: "SCH-OBJ-CALENDAR",
    operationKind: "CREATE",
    inputFieldIds: ["SCH-CALENDAR-F-TERM", "SCH-CALENDAR-F-WORKING-DAYS"],
    outputFieldIds: ["SCH-CALENDAR-F-ID", "SCH-CALENDAR-F-VERSION"],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    successState: "DRAFT",
  }),
  action({
    id: "SCH-ACT-PUBLISH-CALENDAR",
    label: "Publish School Calendar Version",
    targetObjectId: "SCH-OBJ-CALENDAR",
    operationKind: "UPDATE",
    outputFieldIds: ["SCH-CALENDAR-F-VERSION"],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "DRAFT", to: "PUBLISHED" },
  }),
  ...constraintCreateActionFacts,
  action({
    id: "SCH-ACT-ACTIVATE-CONSTRAINT",
    label: "Activate Schedule Constraint",
    targetObjectId: "SCH-OBJ-CONSTRAINT",
    operationKind: "UPDATE",
    outputFieldIds: ["SCH-CONSTRAINT-F-HARDNESS", "SCH-CONSTRAINT-F-VERSION"],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "DRAFT", to: "ACTIVE" },
  }),
  action({
    id: "SCH-ACT-CREATE-CONSTRAINT-SNAPSHOT",
    label: "Create Complete Constraint Snapshot",
    targetObjectId: "SCH-OBJ-CONSTRAINT-SNAPSHOT",
    operationKind: "CREATE",
    inputFieldIds: ["SCH-CONSTRAINT-SNAPSHOT-F-ITEMS"],
    outputFieldIds: [
      "SCH-CONSTRAINT-SNAPSHOT-F-ID",
      "SCH-CONSTRAINT-SNAPSHOT-F-CONSTRAINT-IDS",
      "SCH-CONSTRAINT-SNAPSHOT-F-HASH",
      "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
      "SCH-CONSTRAINT-SNAPSHOT-F-STATUS",
    ],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    successState: "DRAFT",
  }),
  action({
    id: "SCH-ACT-ACTIVATE-CONSTRAINT-SNAPSHOT",
    label: "Activate Complete Constraint Snapshot",
    targetObjectId: "SCH-OBJ-CONSTRAINT-SNAPSHOT",
    operationKind: "UPDATE",
    outputFieldIds: [
      "SCH-CONSTRAINT-SNAPSHOT-F-STATUS",
      "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
    ],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "DRAFT", to: "ACTIVE" },
  }),
  action({
    id: "SCH-ACT-REPLACE-CONSTRAINT-SNAPSHOT",
    label: "Replace Active Constraint Snapshot",
    targetObjectId: "SCH-OBJ-CONSTRAINT-SNAPSHOT",
    operationKind: "UPDATE",
    outputFieldIds: [
      "SCH-CONSTRAINT-SNAPSHOT-F-STATUS",
      "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
    ],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "ACTIVE", to: "REPLACED" },
  }),
  action({
    id: "SCH-ACT-GENERATE-CANDIDATE",
    label: "Generate Schedule Candidate",
    targetObjectId: "SCH-OBJ-CANDIDATE",
    operationKind: "CREATE",
    inputFieldIds: [
      "SCH-CANDIDATE-F-ASSIGNMENTS",
      "SCH-CANDIDATE-F-CALENDAR-REF",
      "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF",
    ],
    outputFieldIds: [
      "SCH-CANDIDATE-F-ID",
      "SCH-CANDIDATE-F-HARD-CHECK",
      "SCH-CANDIDATE-F-CONFLICTS",
      "SCH-CANDIDATE-F-STATUS",
      "SCH-CANDIDATE-F-CALENDAR-VERSION",
      "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION",
    ],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    successState: "GENERATED",
    failureResults: [
      "PERMISSION_DENIED",
      "SOURCE_VERSION_STALE",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [
        {
          refFieldId: "SCH-CANDIDATE-F-CALENDAR-REF",
          versionFieldId: "SCH-CANDIDATE-F-CALENDAR-VERSION",
          targetObjectId: "SCH-OBJ-CALENDAR",
          requiredState: "PUBLISHED",
        },
        {
          refFieldId: "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF",
          versionFieldId: "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION",
          targetObjectId: "SCH-OBJ-CONSTRAINT-SNAPSHOT",
          requiredState: "ACTIVE",
        },
      ],
    },
  }),
  action({
    id: "SCH-ACT-REVIEW-CONFLICTS",
    label: "Review Schedule Candidate Conflicts",
    targetObjectId: "SCH-OBJ-CANDIDATE",
    operationKind: "UPDATE",
    outputFieldIds: ["SCH-CANDIDATE-F-CONFLICTS", "SCH-CANDIDATE-F-STATUS"],
    permissions: academicPermissions,
    transition: { from: "GENERATED", to: "REVIEWED" },
  }),
  action({
    id: "SCH-ACT-CONFIRM-CANDIDATE",
    label: "Confirm Hard-Constraint-Clean Schedule Candidate",
    targetObjectId: "SCH-OBJ-CANDIDATE",
    operationKind: "UPDATE",
    inputFieldIds: [
      "SCH-CANDIDATE-F-HARD-CHECK",
      "SCH-CANDIDATE-F-CALENDAR-REF",
      "SCH-CANDIDATE-F-CALENDAR-VERSION",
      "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF",
      "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION",
      "SCH-CANDIDATE-F-SOFT-CONSTRAINT-ACKNOWLEDGED",
    ],
    outputFieldIds: [
      "SCH-CANDIDATE-F-STATUS",
      "SCH-CANDIDATE-F-SOFT-CONSTRAINT-ACKNOWLEDGED",
    ],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "REVIEWED", to: "CONFIRMED" },
    failureResults: [
      "PERMISSION_DENIED",
      "HARD_CONSTRAINT_FAILED",
      "SOURCE_VERSION_STALE",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      constraintGate: {
        fieldId: "SCH-CANDIDATE-F-HARD-CHECK",
        requiredCode: "PASS",
        onFailure: "BLOCK_CONFIRMATION",
      },
      sourceRecheck: {
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
      },
      relatedStateGuards: [
        {
          refFieldId: "SCH-CANDIDATE-F-CALENDAR-REF",
          versionFieldId: "SCH-CANDIDATE-F-CALENDAR-VERSION",
          targetObjectId: "SCH-OBJ-CALENDAR",
          requiredState: "PUBLISHED",
        },
        {
          refFieldId: "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF",
          versionFieldId: "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION",
          targetObjectId: "SCH-OBJ-CONSTRAINT-SNAPSHOT",
          requiredState: "ACTIVE",
        },
      ],
    },
  }),
  action({
    id: "SCH-ACT-PUBLISH-CANDIDATE",
    label: "Publish Confirmed Schedule Candidate",
    targetObjectId: "SCH-OBJ-CANDIDATE",
    operationKind: "UPDATE",
    inputFieldIds: [
      "SCH-CANDIDATE-F-CALENDAR-REF",
      "SCH-CANDIDATE-F-CALENDAR-VERSION",
      "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF",
      "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION",
      "SCH-CANDIDATE-F-HARD-CHECK",
      "SCH-CANDIDATE-F-SOFT-CONSTRAINT-ACKNOWLEDGED",
    ],
    outputFieldIds: ["SCH-CANDIDATE-F-STATUS"],
    permissions: academicPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "CONFIRMED", to: "PUBLISHED" },
    failureResults: [
      "PERMISSION_DENIED",
      "SOURCE_VERSION_STALE",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      sourceRecheck: {
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
      },
      relatedStateGuards: [
        {
          refFieldId: "SCH-CANDIDATE-F-CALENDAR-REF",
          versionFieldId: "SCH-CANDIDATE-F-CALENDAR-VERSION",
          targetObjectId: "SCH-OBJ-CALENDAR",
          requiredState: "PUBLISHED",
        },
        {
          refFieldId: "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF",
          versionFieldId: "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION",
          targetObjectId: "SCH-OBJ-CONSTRAINT-SNAPSHOT",
          requiredState: "ACTIVE",
        },
      ],
    },
  }),
  action({
    id: "SCH-ACT-MARK-CANDIDATE-STALE",
    label: "Mark Schedule Candidate Stale After Source Change",
    targetObjectId: "SCH-OBJ-CANDIDATE",
    operationKind: "UPDATE",
    outputFieldIds: ["SCH-CANDIDATE-F-STATUS"],
    permissions: permissions(
      "SYSTEM",
      ["ROLE-ACADEMIC", "ROLE-PLATFORM-OPS"],
      "the registered source-version event marks every affected candidate stale",
    ),
    clients: [],
    transition: { from: ["GENERATED", "REVIEWED", "CONFIRMED", "PUBLISHED"], to: "STALE" },
    extras: {
      executionMode: "SYSTEM_EVENT",
      trigger: { kind: "EVENT", eventId: "EVT-SCH-SOURCE-VERSION-CHANGED" },
    },
  }),
];
const scheduleModule = moduleFact({
  id: "SCH-001",
  phase: PHASE.FIRST,
  releaseStatus: RELEASE_STATUS.BUILD_READY,
  priority: "P0",
  title: "Calendar Constraint and Schedule Publication",
  objective: "Generate review confirm and publish schedules without bypassing hard constraints or stale-source detection",
  entryConditions: ["academic administration has current calendar teacher class course room and constraint facts"],
  exitConditions: ["only hard-constraint-clean confirmed candidates are published and stale candidates remain blocked"],
  baselineDecisionIds: ["BASE-004", "BASE-005", "BASE-007"],
  nfrIds: ["NFR-003", "NFR-006", "NFR-008"],
  objects: scheduleObjects,
  relationships: [
    {
      id: "SCH-REL-CANDIDATE-CALENDAR",
      fromObjectId: "SCH-OBJ-CANDIDATE",
      toObjectId: "SCH-OBJ-CALENDAR",
      type: "DERIVED_FROM",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "mark every candidate pinned to the prior calendar version stale",
    },
    {
      id: "SCH-REL-CANDIDATE-CONSTRAINT-SNAPSHOT",
      fromObjectId: "SCH-OBJ-CANDIDATE",
      toObjectId: "SCH-OBJ-CONSTRAINT-SNAPSHOT",
      type: "DERIVED_FROM",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "mark every candidate pinned to the prior constraint snapshot stale",
    },
  ],
  actionFacts: scheduleActions,
  pages: [
    page(
      "SCH-PAGE-SCHEDULE-OPERATIONS",
      "Web Schedule Generation and Conflict Review Workspace",
      scheduleObjects.map(({ id }) => id),
      scheduleObjects.flatMap(({ fields }) => fields.map(({ id }) => id)),
      scheduleActions
        .map(({ value }) => value.id)
        .filter((id) => id !== "SCH-ACT-MARK-CANDIDATE-STALE"),
      [CLIENT.WEB],
    ),
    page(
      "SCH-PAGE-MOBILE-CONFLICT-REVIEW",
      "Mobile Schedule Conflict Review",
      ["SCH-OBJ-CANDIDATE"],
      candidateFields.map(({ id }) => id),
      scheduleActions
        .map(({ value }) => value)
        .filter(({ clients }) => Array.isArray(clients) && clients.includes(CLIENT.APP))
        .map(({ id }) => id),
      [CLIENT.APP],
    ),
  ],
});

const onboardingCaseFields = [
  optionField("PLAT-CASE-F-SCHOOL", "Onboarding School", "OPT-COM-002", { dataType: "ID" }),
  field("PLAT-CASE-F-IMPLEMENTATION-NOTES", "Onboarding Implementation Notes", { dataType: "TEXT" }),
  optionField("PLAT-CASE-F-STATUS", "Onboarding Case Status", "OPT-EXT-015", {
    mutability: "SYSTEM_MANAGED",
  }),
];
const servicePlanFields = [
  field("PLAT-PLAN-F-SCOPE", "School Service Plan Scope", { dataType: "JSON" }),
  optionField("PLAT-PLAN-F-SERVICE-STATE", "School Service State", "OPT-EXT-008", {
    mutability: "SYSTEM_MANAGED",
  }),
  systemField("PLAT-PLAN-F-SCHOOL-CONFIRMED-AT", "School Confirmation Time", "DATETIME", {
    required: conditionalRequired(
      "required only when the school confirms the service plan",
      ["CONFIRMED"],
      ["PLAT-ACT-CONFIRM-SERVICE-PLAN"],
    ),
  }),
];
const policyTemplateFields = [
  field("PLAT-POLICY-F-CONTENT", "School Policy Template Content", { dataType: "JSON" }),
  systemField("PLAT-POLICY-F-VERSION", "Policy Template Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
  optionField("PLAT-POLICY-F-STATUS", "Policy Template Status", "OPT-EXT-016", {
    mutability: "SYSTEM_MANAGED",
  }),
];
const supportCaseFields = [
  field("PLAT-SUPPORT-CASE-F-PURPOSE", "Support Case Purpose", { dataType: "TEXT" }),
  field("PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE", "Requested Support Scope", {
    dataType: "JSON",
  }),
  field("PLAT-SUPPORT-CASE-F-AUDIT-REASON", "Support Case Audit Reason", {
    dataType: "TEXT",
  }),
  field("PLAT-SUPPORT-CASE-F-AUD-SESSION-REF", "Pinned Audited Access Session", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "AUD-OBJ-ACCESS-SESSION" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "ALWAYS_REQUIRED",
    actionApplicability: {
      requiredActionIds: [
        "PLAT-ACT-CREATE-SUPPORT-CASE",
        "PLAT-ACT-USE-SUPPORT-ACCESS",
      ],
    },
    versionBinding: {
      versionFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
      targetVersionFieldId: "AUD-SESSION-F-VERSION",
    },
  }),
  systemField(
    "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
    "Pinned Audited Session Version",
    "INTEGER",
    { mutability: "IMMUTABLE" },
  ),
  systemField(
    "PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID",
    "Authorized Session Operator Projection",
    "ID",
    {
      mutability: "IMMUTABLE",
      sourceBinding: {
        sourceRefFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
        sourceVersionFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
        sourceFieldId: "AUD-SESSION-F-AUTHORIZED-OPERATOR-ID",
      },
    },
  ),
  optionField("PLAT-SUPPORT-CASE-F-STATUS", "Support Case Status", "OPT-EXT-009", {
    mutability: "SYSTEM_MANAGED",
  }),
];
const supportSessionAccessGuard = {
  exceptionKind: STUDENT_DETAIL_ACCESS_EXCEPTION_KIND,
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
};
const platformObjects = [
  domainObject({
    id: "PLAT-OBJ-ONBOARDING-CASE",
    label: "School Onboarding Case",
    identityFieldId: "PLAT-CASE-F-ID",
    responsibility: platformOperations,
    states: ["OPEN", "SCHOOL_CONFIRMED"],
    fields: onboardingCaseFields,
  }),
  domainObject({
    id: "PLAT-OBJ-SERVICE-PLAN",
    label: "School Service Plan",
    identityFieldId: "PLAT-PLAN-F-ID",
    responsibility: platformOperations,
    states: ["DRAFT", "CONFIRMED", "ACTIVE"],
    fields: servicePlanFields,
  }),
  domainObject({
    id: "PLAT-OBJ-POLICY-TEMPLATE",
    label: "School Policy Template Version",
    identityFieldId: "PLAT-POLICY-F-ID",
    responsibility: platformOperations,
    states: ["DRAFT", "CONFIRMED", "ACTIVE"],
    fields: policyTemplateFields,
  }),
  domainObject({
    id: "PLAT-OBJ-SUPPORT-CASE",
    label: "Audited School Support Case",
    identityFieldId: "PLAT-SUPPORT-CASE-F-ID",
    responsibility: schoolSupportAccess,
    states: ["OPEN", "CLOSED"],
    fields: supportCaseFields,
    sensitivityId: "S4",
    lifecyclePolicyId: "LIFE-001",
    overrides: {
      lineageBindings: [{
        refFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
        versionFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
        targetObjectId: "AUD-OBJ-ACCESS-SESSION",
        targetVersionFieldId: "AUD-SESSION-F-VERSION",
      }],
    },
  }),
];
const platformActions = [
  action({
    id: "PLAT-ACT-CREATE-ONBOARDING-CASE",
    label: "Create School Onboarding Case",
    targetObjectId: "PLAT-OBJ-ONBOARDING-CASE",
    operationKind: "CREATE",
    inputFieldIds: ["PLAT-CASE-F-SCHOOL", "PLAT-CASE-F-IMPLEMENTATION-NOTES"],
    outputFieldIds: ["PLAT-CASE-F-ID", "PLAT-CASE-F-STATUS"],
    permissions: platformPermissions,
    clients: [CLIENT.WEB],
    successState: "OPEN",
  }),
  action({
    id: "PLAT-ACT-CONFIRM-ONBOARDING-CASE",
    label: "Record School Onboarding Confirmation",
    targetObjectId: "PLAT-OBJ-ONBOARDING-CASE",
    operationKind: "UPDATE",
    outputFieldIds: ["PLAT-CASE-F-STATUS"],
    permissions: schoolAdminPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "OPEN", to: "SCHOOL_CONFIRMED" },
  }),
  action({
    id: "PLAT-ACT-CREATE-SERVICE-PLAN",
    label: "Create School Service Plan",
    targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
    operationKind: "CREATE",
    inputFieldIds: ["PLAT-PLAN-F-SCOPE"],
    outputFieldIds: ["PLAT-PLAN-F-ID", "PLAT-PLAN-F-SERVICE-STATE"],
    permissions: platformPermissions,
    clients: [CLIENT.WEB],
    successState: "DRAFT",
  }),
  action({
    id: "PLAT-ACT-CONFIRM-SERVICE-PLAN",
    label: "Confirm School Service Plan",
    targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
    operationKind: "UPDATE",
    outputFieldIds: ["PLAT-PLAN-F-SERVICE-STATE", "PLAT-PLAN-F-SCHOOL-CONFIRMED-AT"],
    permissions: schoolAdminPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "DRAFT", to: "CONFIRMED" },
  }),
  action({
    id: "PLAT-ACT-ACTIVATE-SERVICE-PLAN",
    label: "Activate Confirmed School Service Plan",
    targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
    operationKind: "UPDATE",
    outputFieldIds: ["PLAT-PLAN-F-SERVICE-STATE"],
    permissions: platformPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "CONFIRMED", to: "ACTIVE" },
  }),
  action({
    id: "PLAT-ACT-CREATE-POLICY-TEMPLATE",
    label: "Create School Policy Template Version",
    targetObjectId: "PLAT-OBJ-POLICY-TEMPLATE",
    operationKind: "CREATE",
    inputFieldIds: ["PLAT-POLICY-F-CONTENT"],
    outputFieldIds: ["PLAT-POLICY-F-ID", "PLAT-POLICY-F-VERSION", "PLAT-POLICY-F-STATUS"],
    permissions: platformPermissions,
    clients: [CLIENT.WEB],
    successState: "DRAFT",
  }),
  action({
    id: "PLAT-ACT-CONFIRM-POLICY-TEMPLATE",
    label: "Confirm School Policy Template Version",
    targetObjectId: "PLAT-OBJ-POLICY-TEMPLATE",
    operationKind: "UPDATE",
    outputFieldIds: ["PLAT-POLICY-F-VERSION", "PLAT-POLICY-F-STATUS"],
    permissions: schoolAdminPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "DRAFT", to: "CONFIRMED" },
  }),
  action({
    id: "PLAT-ACT-ACTIVATE-POLICY-TEMPLATE",
    label: "Activate Confirmed School Policy Template",
    targetObjectId: "PLAT-OBJ-POLICY-TEMPLATE",
    operationKind: "UPDATE",
    outputFieldIds: ["PLAT-POLICY-F-VERSION", "PLAT-POLICY-F-STATUS"],
    permissions: platformPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "CONFIRMED", to: "ACTIVE" },
  }),
  action({
    id: "PLAT-ACT-CREATE-SUPPORT-CASE",
    label: "Create an AUD-authorized Support Case",
    targetObjectId: "PLAT-OBJ-SUPPORT-CASE",
    operationKind: "CREATE",
    inputFieldIds: [
      "PLAT-SUPPORT-CASE-F-PURPOSE",
      "PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE",
      "PLAT-SUPPORT-CASE-F-AUDIT-REASON",
      "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
    ],
    outputFieldIds: [
      "PLAT-SUPPORT-CASE-F-ID",
      "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
      "PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID",
      "PLAT-SUPPORT-CASE-F-STATUS",
    ],
    permissions: platformPermissions,
    clients: WEB_APP,
    risk: RISK.HIGH,
    successState: "OPEN",
    failureResults: [
      "PERMISSION_DENIED",
      "ACCESS_INACTIVE",
      "ACCESS_EXPIRED",
      "ACCESS_OTHER_RECORD",
      "ACCESS_SCOPE_DENIED",
      "SOURCE_VERSION_STALE",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
      "AUDIT_FAILED",
    ],
    extras: {
      accessGuard: structuredClone(supportSessionAccessGuard),
      relatedStateGuards: [{
        refFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
        versionFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
        targetObjectId: "AUD-OBJ-ACCESS-SESSION",
        requiredState: "ACTIVE",
      }],
    },
  }),
  action({
    id: "PLAT-ACT-CLOSE-SUPPORT-CASE",
    label: "Close an Audited Support Case",
    targetObjectId: "PLAT-OBJ-SUPPORT-CASE",
    operationKind: "UPDATE",
    outputFieldIds: ["PLAT-SUPPORT-CASE-F-STATUS"],
    permissions: platformPermissions,
    clients: [CLIENT.WEB],
    risk: RISK.HIGH,
    transition: { from: "OPEN", to: "CLOSED" },
  }),
  action({
    id: "PLAT-ACT-USE-SUPPORT-ACCESS",
    label: "Use an Active AUD-authorized Support Session",
    targetObjectId: "PLAT-OBJ-SUPPORT-CASE",
    operationKind: "READ",
    inputFieldIds: ["PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE"],
    outputFieldIds: [
      "PLAT-SUPPORT-CASE-F-PURPOSE",
      "PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE",
      "PLAT-SUPPORT-CASE-F-AUDIT-REASON",
      "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
      "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
      "PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID",
      "PLAT-SUPPORT-CASE-F-STATUS",
    ],
    permissions: [
      {
        effect: "ALLOW",
        roleRef: "ROLE-PLATFORM-OPS",
        condition: "the current platform operator equals the operator on the pinned active AUD session",
        scope: {
          kind: "OWN_RECORD",
          subjectFieldId: "PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID",
        },
      },
      {
        effect: "DENY",
        roleRef: "ROLE-PLATFORM-OPS",
        condition: "the platform operator attempts to use another operator's AUD session",
        scope: {
          kind: "OTHER_RECORD",
          subjectFieldId: "PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID",
        },
      },
      {
        effect: "DENY",
        roleRef: "ROLE-PLATFORM-OPS",
        condition: "the pinned AUD session is expired, revoked, or not ACTIVE",
        scope: {
          kind: "OWN_RECORD",
          subjectFieldId: "PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID",
        },
      },
      {
        effect: "DENY",
        roleRef: "ROLE-STUDENT",
        condition: "students cannot invoke school support access",
      },
    ],
    clients: [CLIENT.WEB],
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "NOT_FOUND",
      "ACCESS_INACTIVE",
      "ACCESS_EXPIRED",
      "ACCESS_OTHER_RECORD",
      "ACCESS_SCOPE_DENIED",
      "SOURCE_VERSION_STALE",
      "AUDIT_FAILED",
    ],
    extras: {
      auditMode: "REQUIRED",
      accessGuard: structuredClone(supportSessionAccessGuard),
      relatedStateGuards: [{
        refFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
        versionFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
        targetObjectId: "AUD-OBJ-ACCESS-SESSION",
        requiredState: "ACTIVE",
      }],
    },
  }),
];
const platformModule = moduleFact({
  id: "PLAT-001",
  phase: PHASE.FIRST,
  releaseStatus: RELEASE_STATUS.BUILD_READY,
  priority: "P0",
  title: "School Onboarding Service and Support Access",
  objective: "Operate school onboarding and service metadata while requiring school confirmation and expiring audited support access",
  entryConditions: ["the school has authorized a service onboarding context"],
  exitConditions: ["service state is school-confirmed and every support access is scoped expiring and auditable"],
  baselineDecisionIds: ["BASE-001", "BASE-007"],
  nfrIds: ["NFR-003", "NFR-006", "NFR-008"],
  objects: platformObjects,
  relationships: [],
  actionFacts: platformActions,
  pages: [
    page(
      "PLAT-PAGE-SCHOOL-SERVICE-OPERATIONS",
      "Web School Service and Support Access Workspace",
      platformObjects.map(({ id }) => id),
      platformObjects.flatMap(({ fields }) => fields.map(({ id }) => id)),
      platformActions.map(({ value }) => value.id),
      [CLIENT.WEB],
    ),
    page(
      "PLAT-PAGE-MOBILE-SUPPORT-CASE",
      "Mobile AUD-authorized Support Case",
      ["PLAT-OBJ-SUPPORT-CASE"],
      supportCaseFields.map(({ id }) => id),
      ["PLAT-ACT-CREATE-SUPPORT-CASE"],
      [CLIENT.APP],
    ),
  ],
});

const reportModule = defineModule({
  id: "REPORT-001",
  phase: PHASE.SECOND,
  releaseStatus: RELEASE_STATUS.PLANNED,
  priority: "P1",
  contractKind: "TASK8_REPORT_FUTURE_METADATA",
  title: "Future Extended Reporting Contract",
  objective: "Register unresolved future reporting dependencies without exposing executable behavior",
  objects: [{
    id: "REPORT-OBJ-FUTURE-CONTRACT",
    label: "Future Reporting Contract Metadata",
    dataSubject: "FUTURE_REPORTING_CONTRACT",
    controlSubject: "SCHOOL",
    producerRef: "ROLE-ACADEMIC",
    ownerRef: "ROLE-SCHOOL-ADMIN",
    confirmerRef: "ROLE-SCHOOL-ADMIN",
    stewardRef: "ROLE-SCHOOL-ADMIN",
    lifecyclePolicyId: "LIFE-006",
    sensitivityId: "S2",
    states: [],
    fields: [],
    futureActors: ["ROLE-ACADEMIC", "ROLE-SCHOOL-ADMIN", "DUTY-SUBJECT-TEACHER"],
    dependencies: ["approved report product scope", "approved retention and delivery policy"],
    requiredPermissions: ["school-controlled report scope", "audited sensitive-data access"],
    reuseModuleIds: ["DGV-001"],
    unresolvedProductDecisions: [
      "whether future reports are snapshots or live views",
      "which delivery destinations schools may approve",
    ],
  }],
  relationships: [],
  actions: [],
  pages: [],
  scenarios: [],
  flows: [],
  aiTasks: [],
  externalLinks: [],
  deliveryBehavior: [],
});

export const extensionModules = deepFreeze([
  preparationModule,
  contentModule,
  examModule,
  scheduleModule,
  platformModule,
  reportModule,
]);

export const extensionEvents = deepFreeze([
  {
    id: "EVT-EXM-SCORE-PUBLISHED",
    label: "Subject score published",
    definition: "A teacher-confirmed subject score version reaches PUBLISHED with its student visibility time.",
    producerActionIds: ["EXM-ACT-PUBLISH-SUBJECT-SCORE"],
  },
  {
    id: "EVT-SCH-SOURCE-VERSION-CHANGED",
    label: "Schedule source version changed",
    definition: "A published calendar or active constraint snapshot receives a newer version.",
    producerActionIds: [
      "SCH-ACT-PUBLISH-CALENDAR",
      "SCH-ACT-ACTIVATE-CONSTRAINT-SNAPSHOT",
      "SCH-ACT-REPLACE-CONSTRAINT-SNAPSHOT",
    ],
    triggeredActionIds: ["SCH-ACT-MARK-CANDIDATE-STALE"],
  },
]);
export const extensionFlows = deepFreeze([]);
export const extensionAiTasks = deepFreeze([]);
