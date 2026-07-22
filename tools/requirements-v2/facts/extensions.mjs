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
const PHASE_TWO_SERVICE_PLAN_RESTRICTED_EVENT_ID = "EVT-PLAT-SERVICE-PLAN-RESTRICTED";
const PHASE_TWO_ENTITLEMENT_RESTRICTION_ACTION_ID =
  "PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT";
const PHASE_TWO_ENTITLEMENT_RESTRICTION_FLOW_ID = "DF-018";

function phaseTwoServicePlanRevalidation({ allowProtectedPublishedActivity = false } = {}) {
  const guard = {
    resolverActionId: "PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT",
    servicePlanObjectId: "PLAT-OBJ-SERVICE-PLAN",
    entitlementServicePlanRefFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-REF",
    entitlementServicePlanVersionFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
    servicePlanStateFieldId: "PLAT-PLAN-F-SERVICE-STATE",
    servicePlanVersionFieldId: "PLAT-PLAN-F-VERSION",
    requiredCurrentState: "ACTIVE",
    currentVersionMustEqualPinnedVersion: true,
    checkedAtExecution: true,
    staleMissingOrAmbiguousBehavior: "FAIL_CLOSED",
    failureResult: "PHASE_TWO_SERVICE_PLAN_NOT_ACTIVE",
  };
  if (!allowProtectedPublishedActivity) {
    return {
      ...guard,
      allowedAuthorizationBranches: ["CURRENT_ACTIVE_SERVICE_PLAN"],
      continuityFallback: { mode: "NONE" },
    };
  }
  return {
    ...guard,
    allowedAuthorizationBranches: [
      "CURRENT_ACTIVE_SERVICE_PLAN",
      "EXACT_FINITE_D091_PROTECTED_ACTIVITY",
    ],
    continuityFallback: {
      mode: "EXACT_FINITE_D091_PROTECTED_ACTIVITY",
      protectedEntryObjectId: "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY",
      protectedEntryActivityRefFieldId: "PLAT-PROTECT-F-ACTIVITY-REF",
      protectedEntryActivityVersionFieldId: "PLAT-PROTECT-F-ACTIVITY-VERSION",
      protectedEntryPublicationSnapshotRefFieldId: "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-REF",
      protectedEntryPublicationSnapshotVersionFieldId:
        "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-VERSION",
      protectedUntilFieldId: "PLAT-PROTECT-F-PROTECTED-UNTIL",
      serviceObjectResolution: "PINNED_SUBMISSION_ACTIVITY_AND_PUBLICATION_SNAPSHOT",
      requiredProtectedOperation: "COMPLETE_PUBLISHED_ACTIVITY",
      timeRule: "CURRENT_TIME_LE_PROTECTED_UNTIL",
      exactVersionMatchRequired: true,
      finiteWindowRequired: true,
      failureResult: "SERVICE_CONTINUITY_NOT_PROTECTED",
    },
  };
}

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
  optionSet("OPT-EXT-026", "servicePlanLifecycleState", "服务计划生命周期状态", [
    ["DRAFT", "草稿"],
    ["CONFIRMED", "学校已确认"],
    ["ACTIVE", "服务中"],
    ["RESTRICTED", "服务受限"],
    ["TERMINATED", "合同终止"],
    ["EXPIRED", "服务失效"],
    ["SUPERSEDED", "已由新版本替代"],
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
  optionSet("OPT-EXT-019", "schoolCommercialPayerKind", "学校商业付费主体", [
    ["SCHOOL", "学校"],
  ]),
  optionSet("OPT-EXT-020", "schoolPackageExpansionScope", "学校套餐可扩展范围", [
    ["CAPACITY", "容量"],
    ["CONCURRENCY", "并发"],
    ["ANALYTICS", "分析"],
    ["GENERAL_SUPPORT", "一般支持"],
  ]),
  optionSet("OPT-EXT-021", "schoolCoreAiEntitlement", "学校核心 AI 基础权益", [
    ["CORE_AI_ASSESSMENT", "核心 AI 评定与完成判定"],
    ["MINIMUM_VIDEO_HELP", "最低教学视频帮助"],
  ]),
  optionSet("OPT-EXT-022", "serviceRestrictionReason", "服务受限原因", [
    ["ENTITLEMENT_REDUCED", "权益范围缩减"],
    ["CONTRACT_RESTRICTED", "合同约定受限"],
    ["CONTRACT_TERMINATED", "合同终止"],
    ["CONTRACT_EXPIRED", "服务失效"],
  ]),
  optionSet("OPT-EXT-023", "serviceContinuityOperation", "服务连续性保留操作", [
    ["COMPLETE_PUBLISHED_ACTIVITY", "完成已发布活动"],
    ["HISTORICAL_READ", "依法依合同读取历史"],
    ["LEGAL_EXPORT", "法定或合同导出"],
    ["TRANSFER", "授权迁移"],
    ["DELETION", "注销与删除"],
    ["SECURITY_SUPPORT", "安全支持"],
  ]),
  optionSet("OPT-EXT-024", "serviceContinuityStatus", "服务连续性窗口状态", [
    ["CAPTURING_PROTECTED_ACTIVITIES", "正在捕获已发布活动保护清单"],
    ["ACTIVITY_PROTECTION_OPEN", "已发布活动保护窗口开放"],
    ["CAPTURE_FAILED", "保护清单捕获失败"],
    ["EXIT_WINDOW_OPEN", "退出窗口开放"],
    ["CLOSED", "连续性窗口关闭"],
  ]),
  optionSet("OPT-EXT-025", "protectedActivityManifestStatus", "保护活动清单状态", [
    ["CAPTURING", "捕获中"],
    ["SEALED", "已封存"],
    ["CAPTURE_FAILED", "捕获失败"],
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
const platformCommercialGovernance = {
  dataSubject: "SCHOOL_SERVICE_CONFIGURATION",
  controlSubject: "SCHOOL",
  producerRef: "ROLE-PLATFORM-GOVERNANCE",
  ownerRef: "ROLE-SCHOOL-ADMIN",
  confirmerRef: "ROLE-SCHOOL-ADMIN",
  stewardRef: "ROLE-PLATFORM-GOVERNANCE",
};
const protectedActivityContinuityResponsibility = {
  dataSubject: "PROTECTED_STUDENT_ACTIVITY_CONTINUITY",
  controlSubject: "STUDENT",
  producerRef: "SYSTEM",
  ownerRef: "ROLE-STUDENT",
  confirmerRef: "SYSTEM",
  stewardRef: "ROLE-PLATFORM-GOVERNANCE",
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
const platformCommercialPermissions = permissions(
  "ROLE-PLATFORM-GOVERNANCE",
  ["ROLE-STUDENT", "ROLE-GUARDIAN", "ROLE-TEACHER", "ROLE-PLATFORM-OPS"],
  "platform governance may change only the school's versioned commercial or continuity boundary without opening student learning detail",
);
const schoolCommercialConfirmationPermissions = [
  {
    effect: "ALLOW",
    roleRef: "ROLE-SCHOOL-ADMIN",
    condition: "the current actor matches the active governance administrator profile pinned on the commercial boundary and is distinct from its financial contact profile",
  },
  {
    effect: "DENY",
    roleRef: "ROLE-PLATFORM-OPS",
    condition: "platform operations cannot confirm a school's payer, entitlement, or governance separation",
  },
  {
    effect: "DENY",
    actorRef: "CURRENT_ACTOR",
    condition: "the current actor is only the financial contact or does not match the pinned governance administrator profile",
  },
];

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
          "HW-ASSIGNMENT-F-PURPOSE",
          "HW-ASSIGNMENT-F-HELP-RULE-REF",
          "HW-ASSIGNMENT-F-ANSWER-OPEN-POLICY",
          "HW-ASSIGNMENT-F-DIAGNOSTIC-USE",
          "HW-ASSIGNMENT-F-LATE-ENROLLEE-WINDOW-POLICY",
          "HW-ASSIGNMENT-F-QUESTION-ORDER",
          "HW-ASSIGNMENT-F-RUBRIC-VERSION",
          "HW-ASSIGNMENT-F-KNOWLEDGE-POINT-IDS",
          "HW-ASSIGNMENT-F-FEEDBACK-POLICY",
          "HW-ASSIGNMENT-F-NOTIFICATION-POLICY",
          "HW-ASSIGNMENT-F-HELP-RULE-VERSION",
          "HW-ASSIGNMENT-F-SCHOOL-TIME-POLICY-REF",
          "HW-ASSIGNMENT-F-SCHOOL-TIME-POLICY-VERSION",
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
          { targetFieldId: "HW-ASSIGNMENT-F-PURPOSE", sourceKind: "POLICY_DEFAULT", policyKey: "activity.primaryPurpose.formalAssignment" },
          { targetFieldId: "HW-ASSIGNMENT-F-HELP-RULE-REF", sourceKind: "PUBLISHED_HELP_RULE_FIELD", sourceObjectId: "HW-OBJ-HELP-RULE", sourceFieldId: "HW-HELP-RULE-F-ID", sourceVersionFieldId: "HW-HELP-RULE-F-VERSION", requiredState: "PUBLISHED" },
          { targetFieldId: "HW-ASSIGNMENT-F-ANSWER-OPEN-POLICY", sourceKind: "POLICY_DEFAULT", policyKey: "activity.answerOpenPolicy.formalAssignment" },
          { targetFieldId: "HW-ASSIGNMENT-F-DIAGNOSTIC-USE", sourceKind: "POLICY_DEFAULT", policyKey: "activity.diagnosticUse.notApplicable", fixedCode: "NOT_APPLICABLE" },
          { targetFieldId: "HW-ASSIGNMENT-F-LATE-ENROLLEE-WINDOW-POLICY", sourceKind: "POLICY_DEFAULT", policyKey: "activity.lateEnrolleeWindow.formalAssignment", fixedCode: "FORMAL_SCHOOL_FULL_DURATION" },
          { targetFieldId: "HW-ASSIGNMENT-F-QUESTION-ORDER", sourceKind: "GENERATED_PAYLOAD", payloadPath: "questionOrder" },
          { targetFieldId: "HW-ASSIGNMENT-F-RUBRIC-VERSION", sourceKind: "LESSON_FIELD", sourceFieldId: "PREP-LESSON-F-RUBRIC-VERSION", sourceVersionFieldId: "PREP-LESSON-F-VERSION" },
          { targetFieldId: "HW-ASSIGNMENT-F-KNOWLEDGE-POINT-IDS", sourceKind: "LESSON_FIELD", sourceFieldId: "PREP-LESSON-F-KNOWLEDGE-POINT-IDS", sourceVersionFieldId: "PREP-LESSON-F-VERSION" },
          { targetFieldId: "HW-ASSIGNMENT-F-FEEDBACK-POLICY", sourceKind: "POLICY_DEFAULT", policyKey: "assignment.feedbackPolicy" },
          { targetFieldId: "HW-ASSIGNMENT-F-NOTIFICATION-POLICY", sourceKind: "POLICY_DEFAULT", policyKey: "assignment.notificationPolicy" },
          { targetFieldId: "HW-ASSIGNMENT-F-HELP-RULE-VERSION", sourceKind: "PUBLISHED_HELP_RULE_FIELD", sourceObjectId: "HW-OBJ-HELP-RULE", sourceFieldId: "HW-HELP-RULE-F-VERSION", sourceVersionFieldId: "HW-HELP-RULE-F-VERSION", requiredState: "PUBLISHED" },
          { targetFieldId: "HW-ASSIGNMENT-F-SCHOOL-TIME-POLICY-REF", sourceKind: "ACTIVE_POLICY_FIELD", sourceObjectId: "HW-OBJ-SCHOOL-TIME-POLICY", sourceFieldId: "HW-TIME-POLICY-F-ID", sourceVersionFieldId: "HW-TIME-POLICY-F-VERSION", requiredState: "ACTIVE" },
          { targetFieldId: "HW-ASSIGNMENT-F-SCHOOL-TIME-POLICY-VERSION", sourceKind: "ACTIVE_POLICY_FIELD", sourceObjectId: "HW-OBJ-SCHOOL-TIME-POLICY", sourceFieldId: "HW-TIME-POLICY-F-VERSION", sourceVersionFieldId: "HW-TIME-POLICY-F-VERSION", requiredState: "ACTIVE" },
        ],
        completionRule: {
          failureResult: "HANDOFF_INCOMPLETE",
          requiredBindingCount: 23,
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
  field("PLAT-PLAN-F-SCHOOL-REF", "Service Plan School", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ACC-OBJ-SCHOOL" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_REF",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-CREATE-SERVICE-PLAN"] },
    versionBinding: {
      versionFieldId: "PLAT-PLAN-F-SCHOOL-VERSION",
      targetVersionFieldId: "ACC-SCHOOL-F-SCHOOL-VERSION",
    },
  }),
  systemField("PLAT-PLAN-F-SCHOOL-VERSION", "Service Plan School Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  field("PLAT-PLAN-F-SCOPE", "School Service Plan Scope", { dataType: "JSON" }),
  optionField("PLAT-PLAN-F-SERVICE-STATE", "School Service State", "OPT-EXT-026", {
    mutability: "SYSTEM_MANAGED",
  }),
  field("PLAT-PLAN-F-CONTINUITY-REF", "Service Restriction Continuity Window", {
    dataType: "ID",
    required: false,
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "UPDATE_REQUIRED",
    actionApplicability: {
      requiredActionIds: [
        "PLAT-ACT-RESTRICT-SERVICE-PLAN",
        "PLAT-ACT-TERMINATE-SERVICE-PLAN",
        "PLAT-ACT-EXPIRE-SERVICE-PLAN",
      ],
    },
    versionBinding: {
      versionFieldId: "PLAT-PLAN-F-CONTINUITY-VERSION",
      targetVersionFieldId: "PLAT-CONT-F-VERSION",
    },
  }),
  systemField("PLAT-PLAN-F-CONTINUITY-VERSION", "Service Restriction Continuity Window Version", "INTEGER", {
    required: false,
    mutability: "IMMUTABLE",
  }),
  optionField("PLAT-PLAN-F-RESTRICTION-REASON", "Service Plan Restriction Reason", "OPT-EXT-022", {
    required: conditionalRequired(
      "required when a service plan becomes restricted, terminated, or expired",
      ["RESTRICTED", "TERMINATED", "EXPIRED"],
      [
        "PLAT-ACT-RESTRICT-SERVICE-PLAN",
        "PLAT-ACT-TERMINATE-SERVICE-PLAN",
        "PLAT-ACT-EXPIRE-SERVICE-PLAN",
      ],
    ),
    mutability: "SYSTEM_MANAGED",
  }),
  systemField("PLAT-PLAN-F-RESTRICTION-EFFECTIVE-AT", "Service Plan Restriction Effective At", "DATETIME", {
    required: conditionalRequired(
      "required when a service plan becomes restricted, terminated, or expired",
      ["RESTRICTED", "TERMINATED", "EXPIRED"],
      ["PLAT-ACT-RESTRICT-SERVICE-PLAN"],
    ),
    mutability: "IMMUTABLE",
  }),
  field("PLAT-PLAN-F-RECOVERY-PLAN-REF", "Replacement Service Plan Version", {
    dataType: "ID",
    required: conditionalRequired(
      "required when a restricted, terminated, or expired plan is superseded by a recovered version",
      ["SUPERSEDED"],
      ["PLAT-ACT-SUPERSEDE-SERVICE-PLAN"],
    ),
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PLAT-OBJ-SERVICE-PLAN" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "UPDATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-SUPERSEDE-SERVICE-PLAN"] },
    versionBinding: {
      versionFieldId: "PLAT-PLAN-F-RECOVERY-PLAN-VERSION",
      targetVersionFieldId: "PLAT-PLAN-F-VERSION",
    },
  }),
  systemField("PLAT-PLAN-F-RECOVERY-PLAN-VERSION", "Replacement Service Plan Version", "INTEGER", {
    required: false,
    mutability: "IMMUTABLE",
  }),
  systemField("PLAT-PLAN-F-SCHOOL-CONFIRMED-AT", "School Confirmation Time", "DATETIME", {
    required: conditionalRequired(
      "required only when the school confirms the service plan",
      ["CONFIRMED"],
      ["PLAT-ACT-CONFIRM-SERVICE-PLAN"],
    ),
  }),
  systemField("PLAT-PLAN-F-VERSION", "School Service Plan Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
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
const schoolCommercialBoundaryFields = [
  field("PLAT-COMM-F-SCHOOL-REF", "Commercial School", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ACC-OBJ-SCHOOL" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-CREATE-COMMERCIAL-BOUNDARY"] },
    versionBinding: {
      versionFieldId: "PLAT-COMM-F-SCHOOL-VERSION",
      targetVersionFieldId: "ACC-SCHOOL-F-SCHOOL-VERSION",
    },
  }),
  systemField("PLAT-COMM-F-SCHOOL-VERSION", "Commercial School Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  optionField("PLAT-COMM-F-PAYER-KIND", "Commercial Payer Kind", "OPT-EXT-019", {
    mutability: "IMMUTABLE",
  }),
  field("PLAT-COMM-F-FINANCIAL-CONTACT-REF", "School Financial Contact Profile", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ACC-OBJ-SCHOOL-PROFILE" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-CREATE-COMMERCIAL-BOUNDARY"] },
    versionBinding: {
      versionFieldId: "PLAT-COMM-F-FINANCIAL-CONTACT-VERSION",
      targetVersionFieldId: "ACC-PROFILE-F-VERSION",
    },
    validation: "must identify an active profile in the bound school",
  }),
  systemField("PLAT-COMM-F-FINANCIAL-CONTACT-VERSION", "Financial Contact Profile Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  field("PLAT-COMM-F-GOVERNANCE-ADMIN-REF", "School Governance Administrator Profile", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ACC-OBJ-SCHOOL-PROFILE" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-CREATE-COMMERCIAL-BOUNDARY"] },
    versionBinding: {
      versionFieldId: "PLAT-COMM-F-GOVERNANCE-ADMIN-VERSION",
      targetVersionFieldId: "ACC-PROFILE-F-VERSION",
    },
    validation: "must identify a different active profile in the bound school whose profile type is ROLE-SCHOOL-ADMIN",
  }),
  systemField("PLAT-COMM-F-GOVERNANCE-ADMIN-VERSION", "Governance Administrator Profile Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  systemField("PLAT-COMM-F-PROHIBITED-CONSUMER-MODELS", "Prohibited Consumer Monetization Models", "STRING_ARRAY", {
    mutability: "IMMUTABLE",
    validation: "must prohibit STUDENT_PAYMENT, GUARDIAN_PAYMENT, ADVERTISING, WEAKNESS_BASED_COMMERCE, CONTENT_MARKETPLACE, and TEACHER_REVENUE_SHARE",
  }),
  systemField("PLAT-COMM-F-SCHOOL-CONFIRMED-AT", "School Commercial Boundary Confirmation Time", "DATETIME", {
    required: false,
  }),
  optionField("PLAT-COMM-F-STATUS", "School Commercial Boundary Status", "OPT-EXT-008", {
    mutability: "SYSTEM_MANAGED",
  }),
  systemField("PLAT-COMM-F-VERSION", "School Commercial Boundary Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
];

const serviceContinuityFields = [
  field("PLAT-CONT-F-SCHOOL-REF", "Restricted Service School", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ACC-OBJ-SCHOOL" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-OPEN-SERVICE-CONTINUITY"] },
    versionBinding: {
      versionFieldId: "PLAT-CONT-F-SCHOOL-VERSION",
      targetVersionFieldId: "ACC-SCHOOL-F-SCHOOL-VERSION",
    },
  }),
  systemField("PLAT-CONT-F-SCHOOL-VERSION", "Restricted Service School Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  field("PLAT-CONT-F-SERVICE-PLAN-REF", "Pinned Current School Service Plan", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PLAT-OBJ-SERVICE-PLAN" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "ALWAYS_REQUIRED",
    actionApplicability: {
      requiredActionIds: [
        "PLAT-ACT-OPEN-SERVICE-CONTINUITY",
        "PLAT-ACT-RETRY-PROTECTED-ACTIVITY-CAPTURE",
        "PLAT-ACT-ENTER-EXIT-WINDOW",
        "PLAT-ACT-CLOSE-SERVICE-CONTINUITY",
      ],
    },
    versionBinding: {
      versionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
      targetVersionFieldId: "PLAT-PLAN-F-VERSION",
    },
  }),
  systemField("PLAT-CONT-F-SERVICE-PLAN-VERSION", "Pinned Current Service Plan Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  field("PLAT-CONT-F-COMMERCIAL-BOUNDARY-REF", "Pinned School Commercial Boundary", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-OPEN-SERVICE-CONTINUITY"] },
    versionBinding: {
      versionFieldId: "PLAT-CONT-F-COMMERCIAL-BOUNDARY-VERSION",
      targetVersionFieldId: "PLAT-COMM-F-VERSION",
    },
  }),
  systemField("PLAT-CONT-F-COMMERCIAL-BOUNDARY-VERSION", "Pinned School Commercial Boundary Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  optionField("PLAT-CONT-F-RESTRICTION-REASON", "Service Restriction Reason", "OPT-EXT-022", {
    mutability: "IMMUTABLE",
  }),
  systemField("PLAT-CONT-F-RESTRICTED-AT", "Service Restriction Eligibility Cutoff", "DATETIME", {
    mutability: "IMMUTABLE",
    validation: "captures the atomic eligibility cutoff; no service restriction becomes effective until the protected-activity manifest is SEALED",
  }),
  field("PLAT-CONT-F-ACTIVITY-PROTECTION-UNTIL", "Published Activity Protection Window End", {
    dataType: "DATETIME",
    mutability: "IMMUTABLE",
    validation: "must be finite and greater than or equal to the maximum original due time among all eligible student activity windows",
  }),
  field("PLAT-CONT-F-EXIT-WINDOW-UNTIL", "Explicit Exit Window End", {
    dataType: "DATETIME",
    mutability: "IMMUTABLE",
    validation: "must be a finite documented exit deadline at or after the protected activity window end",
  }),
  optionField("PLAT-CONT-F-PROTECTED-OPERATIONS", "Operations Retained during Restricted Service", "OPT-EXT-023", {
    dataType: "STRING_ARRAY",
    mutability: "SYSTEM_MANAGED",
    validation: "must retain published-activity completion plus historical read, legal export, transfer, deletion, and security support only as required by contract and applicable law",
  }),
  systemField("PLAT-CONT-F-NEW-ACTIVITY-POLICY", "New Activity Creation under Restricted Service", "STRING", {
    mutability: "IMMUTABLE",
    validation: "must equal BLOCK_NEW_ACTIVITY_OUTSIDE_CURRENT_ENTITLEMENT",
  }),
  field("PLAT-CONT-F-CONTINUING-DATA-RIGHTS-BASIS", "Continuing Data Rights Basis", {
    dataType: "TEXT",
    mutability: "IMMUTABLE",
    validation: "must cite applicable law and contract; cannot promise indefinite free operation of the full service",
  }),
  systemField("PLAT-CONT-F-ELIGIBLE-ENTRY-COUNT", "Expected Eligible Activity Entry Count", "INTEGER", {
    mutability: "IMMUTABLE",
    validation: "must equal the cardinality of the immutable eligible set selected at the restriction eligibility cutoff",
  }),
  systemField("PLAT-CONT-F-ELIGIBLE-SET-DIGEST", "Expected Eligible Activity Set Digest", "STRING", {
    mutability: "IMMUTABLE",
    validation: "must be a canonical digest over the ordered eligible student-window, activity-version, and publication-snapshot-version identities",
  }),
  systemField("PLAT-CONT-F-ELIGIBLE-MAX-DUE-AT", "Maximum Eligible Student Window Due Time", "DATETIME", {
    required: false,
    mutability: "IMMUTABLE",
    validation: "equals the maximum original due time of the eligible set and is absent only when the eligible count is zero",
  }),
  systemField("PLAT-CONT-F-CAPTURED-ENTRY-COUNT", "Reconciled Captured Activity Entry Count", "INTEGER", {
    validation: "must be derived from distinct immutable protected-entry identities, never from attempted capture messages",
  }),
  systemField("PLAT-CONT-F-CAPTURED-SET-DIGEST", "Reconciled Captured Activity Set Digest", "STRING", {
    validation: "must use the same canonical identity tuple and ordering as the eligible-set digest",
  }),
  optionField("PLAT-CONT-F-MANIFEST-STATUS", "Protected Activity Manifest Status", "OPT-EXT-025", {
    mutability: "SYSTEM_MANAGED",
  }),
  systemField("PLAT-CONT-F-MANIFEST-SEALED-AT", "Protected Activity Manifest Sealed At", "DATETIME", {
    required: false,
    validation: "is written atomically only when eligible and captured count plus digest are exactly equal",
  }),
  systemField("PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT", "Service Restriction Effective At", "DATETIME", {
    required: false,
    validation: "is written atomically with manifest sealing and never while the manifest is CAPTURING or CAPTURE_FAILED",
  }),
  systemField("PLAT-CONT-F-CAPTURE-FAILURE-REASON", "Protected Activity Capture Failure Reason", "TEXT", {
    required: false,
  }),
  systemField("PLAT-CONT-F-CAPTURE-RETRY-COUNT", "Protected Activity Capture Retry Count", "INTEGER", {
    validation: "starts at zero and increments once for each accepted retry without replacing the eligible-set snapshot",
  }),
  systemField("PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH", "Protected Activity Capture Attempt Epoch", "INTEGER", {
    validation: "starts at one and advances atomically by exactly one only when a failed capture attempt is retried",
  }),
  systemField("PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION", "Capture Attempt Expected Continuity Version", "INTEGER", {
    validation: "pins the service-continuity object version that every event in the current capture attempt must compare-and-swap against",
  }),
  optionField("PLAT-CONT-F-STATUS", "Service Continuity Status", "OPT-EXT-024", {
    mutability: "SYSTEM_MANAGED",
  }),
  systemField("PLAT-CONT-F-VERSION", "Service Continuity Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
];

const protectedActivityEntryFields = [
  field("PLAT-PROTECT-F-CONTINUITY-REF", "Service Continuity Window", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY"] },
    versionBinding: {
      versionFieldId: "PLAT-PROTECT-F-CONTINUITY-VERSION",
      targetVersionFieldId: "PLAT-CONT-F-VERSION",
    },
  }),
  systemField("PLAT-PROTECT-F-CONTINUITY-VERSION", "Service Continuity Window Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  systemField("PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH", "Capture Attempt Epoch", "INTEGER", {
    mutability: "IMMUTABLE",
    validation: "must equal the event attempt epoch accepted by the current continuity-window compare-and-swap guard",
  }),
  systemField("PLAT-PROTECT-F-EXPECTED-CONTINUITY-VERSION", "Expected Continuity Version for Capture", "INTEGER", {
    mutability: "IMMUTABLE",
    validation: "must equal the event expected continuity version accepted by the current attempt compare-and-swap guard",
  }),
  field("PLAT-PROTECT-F-STUDENT-WINDOW-REF", "Protected Student Activity Window", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "HW-OBJ-STUDENT-ACTIVITY-WINDOW" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY"] },
    versionBinding: {
      versionFieldId: "PLAT-PROTECT-F-STUDENT-WINDOW-VERSION",
      targetVersionFieldId: "HW-STUDENT-WINDOW-F-VERSION",
    },
  }),
  systemField("PLAT-PROTECT-F-STUDENT-WINDOW-VERSION", "Protected Student Activity Window Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  field("PLAT-PROTECT-F-ACTIVITY-REF", "Protected Published Activity", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "HW-OBJ-ASSIGNMENT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY"] },
    versionBinding: {
      versionFieldId: "PLAT-PROTECT-F-ACTIVITY-VERSION",
      targetVersionFieldId: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
    },
  }),
  systemField("PLAT-PROTECT-F-ACTIVITY-VERSION", "Protected Activity Publication Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  field("PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-REF", "Protected Sealed Publication Snapshot", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "HW-OBJ-PUBLICATION-SNAPSHOT" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY"] },
    versionBinding: {
      versionFieldId: "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-VERSION",
      targetVersionFieldId: "HW-SNAPSHOT-F-VERSION",
    },
  }),
  systemField("PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-VERSION", "Protected Publication Snapshot Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  systemField("PLAT-PROTECT-F-CAPTURED-AT", "Protection Entry Captured At", "DATETIME", {
    mutability: "IMMUTABLE",
  }),
  systemField("PLAT-PROTECT-F-PROTECTED-UNTIL", "Exact Student Activity Protection End", "DATETIME", {
    mutability: "IMMUTABLE",
    validation: "must equal the original student activity-window due time; the school protection end must already cover this time",
  }),
  systemField("PLAT-PROTECT-F-STATUS", "Protected Activity Entry Status", "STRING", {
    mutability: "IMMUTABLE",
  }),
  systemField("PLAT-PROTECT-F-VERSION", "Protected Activity Entry Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
];

const phaseTwoEntitlementFields = [
  field("PLAT-P2ENT-F-SCHOOL-REF", "Phase-two Entitled School", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "ACC-OBJ-SCHOOL" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT"] },
    versionBinding: {
      versionFieldId: "PLAT-P2ENT-F-SCHOOL-VERSION",
      targetVersionFieldId: "ACC-SCHOOL-F-SCHOOL-VERSION",
    },
  }),
  systemField("PLAT-P2ENT-F-SCHOOL-VERSION", "Phase-two Entitled School Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  field("PLAT-P2ENT-F-SERVICE-PLAN-REF", "Pinned Active School Service Plan", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PLAT-OBJ-SERVICE-PLAN" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "ALWAYS_REQUIRED",
    actionApplicability: {
      requiredActionIds: [
        "PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT",
        "PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT",
        "PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT",
        PHASE_TWO_ENTITLEMENT_RESTRICTION_ACTION_ID,
      ],
    },
    versionBinding: {
      versionFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
      targetVersionFieldId: "PLAT-PLAN-F-VERSION",
    },
  }),
  systemField("PLAT-P2ENT-F-SERVICE-PLAN-VERSION", "Pinned Active Service Plan Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  field("PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-REF", "Pinned School Commercial Boundary", {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY" },
    mutability: "IMMUTABLE",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "CREATE_REQUIRED",
    actionApplicability: { requiredActionIds: ["PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT"] },
    versionBinding: {
      versionFieldId: "PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-VERSION",
      targetVersionFieldId: "PLAT-COMM-F-VERSION",
    },
  }),
  systemField("PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-VERSION", "Pinned Commercial Boundary Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  optionField("PLAT-P2ENT-F-CORE-AI-ENTITLEMENTS", "School-wide Core AI Entitlements", "OPT-EXT-021", {
    dataType: "STRING_ARRAY",
    mutability: "SYSTEM_MANAGED",
    validation: "must include CORE_AI_ASSESSMENT and MINIMUM_VIDEO_HELP for every school entering phase-two service and cannot be split into student or guardian payment",
  }),
  optionField("PLAT-P2ENT-F-PACKAGE-EXPANSION-SCOPE", "Permitted Package Expansion Scope", "OPT-EXT-020", {
    dataType: "STRING_ARRAY",
    mutability: "SYSTEM_MANAGED",
    validation: "may expand only capacity, concurrency, analytics, and general support; safety, appeal, data rights, and the core learning loop are never paid add-ons",
  }),
  optionField("PLAT-P2ENT-F-STATUS", "Phase-two Entitlement Status", "OPT-EXT-026", {
    mutability: "SYSTEM_MANAGED",
  }),
  systemField("PLAT-P2ENT-F-VERSION", "Phase-two Entitlement Version", "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  }),
];
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
    states: ["DRAFT", "CONFIRMED", "ACTIVE", "RESTRICTED", "TERMINATED", "EXPIRED", "SUPERSEDED"],
    fields: servicePlanFields,
    overrides: {
      lineageBindings: [{
        refFieldId: "PLAT-PLAN-F-SCHOOL-REF",
        versionFieldId: "PLAT-PLAN-F-SCHOOL-VERSION",
        targetObjectId: "ACC-OBJ-SCHOOL",
        targetVersionFieldId: "ACC-SCHOOL-F-SCHOOL-VERSION",
      }, {
        refFieldId: "PLAT-PLAN-F-CONTINUITY-REF",
        versionFieldId: "PLAT-PLAN-F-CONTINUITY-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
        targetVersionFieldId: "PLAT-CONT-F-VERSION",
      }, {
        refFieldId: "PLAT-PLAN-F-RECOVERY-PLAN-REF",
        versionFieldId: "PLAT-PLAN-F-RECOVERY-PLAN-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
        targetVersionFieldId: "PLAT-PLAN-F-VERSION",
      }],
      currentEntitlementConstraint: {
        schoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
        stateFieldId: "PLAT-PLAN-F-SERVICE-STATE",
        versionFieldId: "PLAT-PLAN-F-VERSION",
        currentState: "ACTIVE",
        maximumCurrentVersionsPerSchool: 1,
        selectionRule: "EXACT_PINNED_ACTIVE_VERSION",
        restrictedStates: ["RESTRICTED", "TERMINATED", "EXPIRED", "SUPERSEDED"],
        recoveryRule: "A_RESTRICTED_TERMINATED_OR_EXPIRED_PLAN_REQUIRES_A_NEW_ACTIVE_VERSION_AND_MAY_NOT_RETURN_TO_ACTIVE",
      },
    },
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
  domainObject({
    id: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY",
    label: "School-only Payer and Governance Boundary",
    identityFieldId: "PLAT-COMM-F-ID",
    responsibility: platformCommercialGovernance,
    states: ["DRAFT", "CONFIRMED", "ACTIVE"],
    fields: schoolCommercialBoundaryFields,
    sensitivityId: "S3",
    lifecyclePolicyId: "LIFE-001",
    overrides: {
      lineageBindings: [
        {
          refFieldId: "PLAT-COMM-F-SCHOOL-REF",
          versionFieldId: "PLAT-COMM-F-SCHOOL-VERSION",
          targetObjectId: "ACC-OBJ-SCHOOL",
          targetVersionFieldId: "ACC-SCHOOL-F-SCHOOL-VERSION",
        },
        {
          refFieldId: "PLAT-COMM-F-FINANCIAL-CONTACT-REF",
          versionFieldId: "PLAT-COMM-F-FINANCIAL-CONTACT-VERSION",
          targetObjectId: "ACC-OBJ-SCHOOL-PROFILE",
          targetVersionFieldId: "ACC-PROFILE-F-VERSION",
        },
        {
          refFieldId: "PLAT-COMM-F-GOVERNANCE-ADMIN-REF",
          versionFieldId: "PLAT-COMM-F-GOVERNANCE-ADMIN-VERSION",
          targetObjectId: "ACC-OBJ-SCHOOL-PROFILE",
          targetVersionFieldId: "ACC-PROFILE-F-VERSION",
        },
      ],
      referenceSeparationConstraints: [{
        leftRefFieldId: "PLAT-COMM-F-FINANCIAL-CONTACT-REF",
        rightRefFieldId: "PLAT-COMM-F-GOVERNANCE-ADMIN-REF",
        comparison: "MUST_DIFFER",
        scope: "SAME_SCHOOL",
        schoolRefFieldId: "PLAT-COMM-F-SCHOOL-REF",
        sourceSchoolFieldId: "ACC-PROFILE-F-SCHOOL-ID",
      }],
    },
  }),
  domainObject({
    id: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
    label: "Protected Activity and Exit Window",
    identityFieldId: "PLAT-CONT-F-ID",
    responsibility: platformCommercialGovernance,
    states: [
      "CAPTURING_PROTECTED_ACTIVITIES",
      "ACTIVITY_PROTECTION_OPEN",
      "CAPTURE_FAILED",
      "EXIT_WINDOW_OPEN",
      "CLOSED",
    ],
    fields: serviceContinuityFields,
    sensitivityId: "S3",
    lifecyclePolicyId: "LIFE-001",
    overrides: {
      lineageBindings: [
        {
          refFieldId: "PLAT-CONT-F-SCHOOL-REF",
          versionFieldId: "PLAT-CONT-F-SCHOOL-VERSION",
          targetObjectId: "ACC-OBJ-SCHOOL",
          targetVersionFieldId: "ACC-SCHOOL-F-SCHOOL-VERSION",
        },
        {
          refFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
          versionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
          targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
          targetVersionFieldId: "PLAT-PLAN-F-VERSION",
        },
        {
          refFieldId: "PLAT-CONT-F-COMMERCIAL-BOUNDARY-REF",
          versionFieldId: "PLAT-CONT-F-COMMERCIAL-BOUNDARY-VERSION",
          targetObjectId: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY",
          targetVersionFieldId: "PLAT-COMM-F-VERSION",
        },
      ],
      schoolScopeConsistencyConstraints: [{
        schoolRefFieldId: "PLAT-CONT-F-SCHOOL-REF",
        relatedRefFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
        relatedObjectId: "PLAT-OBJ-SERVICE-PLAN",
        relatedSchoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
        comparison: "MUST_MATCH_PINNED_SCHOOL_ID",
      }, {
        schoolRefFieldId: "PLAT-CONT-F-SCHOOL-REF",
        relatedRefFieldId: "PLAT-CONT-F-COMMERCIAL-BOUNDARY-REF",
        relatedObjectId: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY",
        relatedSchoolRefFieldId: "PLAT-COMM-F-SCHOOL-REF",
        comparison: "MUST_MATCH_PINNED_SCHOOL_ID",
      }],
      currentWindowUniquenessConstraint: {
        schoolRefFieldId: "PLAT-CONT-F-SCHOOL-REF",
        servicePlanRefFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
        servicePlanVersionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
        statusFieldId: "PLAT-CONT-F-STATUS",
        excludedState: "CLOSED",
        maximumCurrentWindowsPerSchoolAndServicePlanVersion: 1,
        selectionRule: "EXACT_SCHOOL_AND_SERVICE_PLAN_VERSION_WITH_STATUS_NOT_CLOSED",
        ambiguityEffect: "FAIL_CLOSED",
      },
    },
  }),
  domainObject({
    id: "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY",
    label: "Version-pinned Protected Student Activity Entry",
    identityFieldId: "PLAT-PROTECT-F-ID",
    responsibility: protectedActivityContinuityResponsibility,
    states: ["PROTECTED"],
    fields: protectedActivityEntryFields,
    sensitivityId: "S3",
    lifecyclePolicyId: "LIFE-001",
    overrides: {
      studentDataKind: STUDENT_DATA_KIND.DETAIL,
      lineageBindings: [{
        refFieldId: "PLAT-PROTECT-F-CONTINUITY-REF",
        versionFieldId: "PLAT-PROTECT-F-CONTINUITY-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
        targetVersionFieldId: "PLAT-CONT-F-VERSION",
      }, {
        refFieldId: "PLAT-PROTECT-F-STUDENT-WINDOW-REF",
        versionFieldId: "PLAT-PROTECT-F-STUDENT-WINDOW-VERSION",
        targetObjectId: "HW-OBJ-STUDENT-ACTIVITY-WINDOW",
        targetVersionFieldId: "HW-STUDENT-WINDOW-F-VERSION",
      }, {
        refFieldId: "PLAT-PROTECT-F-ACTIVITY-REF",
        versionFieldId: "PLAT-PROTECT-F-ACTIVITY-VERSION",
        targetObjectId: "HW-OBJ-ASSIGNMENT",
        targetVersionFieldId: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
      }, {
        refFieldId: "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-REF",
        versionFieldId: "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-VERSION",
        targetObjectId: "HW-OBJ-PUBLICATION-SNAPSHOT",
        targetVersionFieldId: "HW-SNAPSHOT-F-VERSION",
      }],
      immutableAfterCreate: true,
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
    inputFieldIds: [
      "PLAT-PLAN-F-SCHOOL-REF",
      "PLAT-PLAN-F-SCHOOL-VERSION",
      "PLAT-PLAN-F-SCOPE",
    ],
    outputFieldIds: [
      "PLAT-PLAN-F-ID",
      "PLAT-PLAN-F-SCHOOL-REF",
      "PLAT-PLAN-F-SCHOOL-VERSION",
      "PLAT-PLAN-F-SERVICE-STATE",
      "PLAT-PLAN-F-VERSION",
    ],
    permissions: platformPermissions,
    clients: [CLIENT.WEB],
    successState: "DRAFT",
    extras: {
      relatedStateGuards: [{
        refFieldId: "PLAT-PLAN-F-SCHOOL-REF",
        versionFieldId: "PLAT-PLAN-F-SCHOOL-VERSION",
        targetObjectId: "ACC-OBJ-SCHOOL",
        requiredState: "ACTIVE",
      }],
    },
  }),
  action({
    id: "PLAT-ACT-CONFIRM-SERVICE-PLAN",
    label: "Confirm School Service Plan",
    targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
    operationKind: "UPDATE",
    outputFieldIds: [
      "PLAT-PLAN-F-SERVICE-STATE",
      "PLAT-PLAN-F-SCHOOL-CONFIRMED-AT",
      "PLAT-PLAN-F-VERSION",
    ],
    permissions: schoolAdminPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "DRAFT", to: "CONFIRMED" },
  }),
  action({
    id: "PLAT-ACT-ACTIVATE-SERVICE-PLAN",
    label: "Activate Confirmed School Service Plan",
    targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
    operationKind: "UPDATE",
    outputFieldIds: ["PLAT-PLAN-F-SERVICE-STATE", "PLAT-PLAN-F-VERSION"],
    permissions: platformPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "CONFIRMED", to: "ACTIVE" },
    failureResults: [
      "PERMISSION_DENIED",
      "ACTIVE_SERVICE_PLAN_ALREADY_EXISTS",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      currentEntitlementActivationGuard: {
        schoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
        stateFieldId: "PLAT-PLAN-F-SERVICE-STATE",
        requiredPriorState: "CONFIRMED",
        targetState: "ACTIVE",
        maximumCurrentVersionsPerSchool: 1,
        failureResult: "ACTIVE_SERVICE_PLAN_ALREADY_EXISTS",
      },
    },
  }),
  action({
    id: "PLAT-ACT-RESTRICT-SERVICE-PLAN",
    label: "Restrict the Exact Active Service Plan after the Exit Window Opens",
    targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
    operationKind: "UPDATE",
    inputFieldIds: [
      "PLAT-PLAN-F-CONTINUITY-REF",
      "PLAT-PLAN-F-CONTINUITY-VERSION",
      "PLAT-PLAN-F-RESTRICTION-REASON",
    ],
    outputFieldIds: [
      "PLAT-PLAN-F-CONTINUITY-REF",
      "PLAT-PLAN-F-CONTINUITY-VERSION",
      "PLAT-PLAN-F-RESTRICTION-REASON",
      "PLAT-PLAN-F-RESTRICTION-EFFECTIVE-AT",
      "PLAT-PLAN-F-SERVICE-STATE",
      "PLAT-PLAN-F-VERSION",
    ],
    permissions: permissions(
      "SYSTEM",
      ["CURRENT_ACTOR", "ROLE-PLATFORM-OPS"],
      "the system restricts only the exact ACTIVE service-plan version pinned by a continuity window that has entered EXIT_WINDOW_OPEN",
    ),
    transition: { from: "ACTIVE", to: "RESTRICTED" },
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "CONTINUITY_EXIT_WINDOW_NOT_OPEN",
      "SERVICE_PLAN_VERSION_MISMATCH",
      "ENTITLEMENT_RESTRICTION_EVENT_OUTBOX_FAILED",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      executionMode: "SYSTEM_EVENT",
      trigger: { kind: "EVENT", eventId: "EVT-PLAT-SERVICE-EXIT-WINDOW-OPENED" },
      relatedStateGuards: [{
        refFieldId: "PLAT-PLAN-F-CONTINUITY-REF",
        versionFieldId: "PLAT-PLAN-F-CONTINUITY-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
        requiredState: "EXIT_WINDOW_OPEN",
      }],
      acceptedInputValues: [{
        fieldId: "PLAT-PLAN-F-RESTRICTION-REASON",
        optionSetId: "OPT-EXT-022",
        partitionId: "PLAT-SERVICE-RESTRICTION-REASON",
        codes: [
          "ENTITLEMENT_REDUCED",
          "CONTRACT_RESTRICTED",
          "CONTRACT_TERMINATED",
          "CONTRACT_EXPIRED",
        ],
      }],
      servicePlanRestrictionGuard: {
        continuityServicePlanRefFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
        continuityServicePlanVersionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
        targetPlanIdentityFieldId: "PLAT-PLAN-F-ID",
        targetPlanVersionFieldId: "PLAT-PLAN-F-VERSION",
        continuityRestrictionReasonFieldId: "PLAT-CONT-F-RESTRICTION-REASON",
        targetRestrictionReasonFieldId: "PLAT-PLAN-F-RESTRICTION-REASON",
        continuityRestrictionEffectiveAtFieldId: "PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT",
        targetRestrictionEffectiveAtFieldId: "PLAT-PLAN-F-RESTRICTION-EFFECTIVE-AT",
        exactPinnedPlanVersionRequired: true,
        exactReasonRequired: true,
        exactEffectiveTimeRequired: true,
        failureResult: "SERVICE_PLAN_VERSION_MISMATCH",
      },
      producedEventIds: [PHASE_TWO_SERVICE_PLAN_RESTRICTED_EVENT_ID],
      producedEventContextBindings: [{
        eventId: PHASE_TWO_SERVICE_PLAN_RESTRICTED_EVENT_ID,
        servicePlanIdentityFieldId: "PLAT-PLAN-F-ID",
        priorServicePlanVersionSource: "TRANSITION_EXPECTED_VERSION",
        resultingServicePlanVersionFieldId: "PLAT-PLAN-F-VERSION",
        schoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
        resultingStateFieldId: "PLAT-PLAN-F-SERVICE-STATE",
      }],
      entitlementRestrictionOutboxContract: {
        eventId: PHASE_TWO_SERVICE_PLAN_RESTRICTED_EVENT_ID,
        atomicWithServicePlanTransition: true,
        failureResult: "ENTITLEMENT_RESTRICTION_EVENT_OUTBOX_FAILED",
        failedOutboxCommitsRestriction: false,
      },
    },
  }),
  action({
    id: "PLAT-ACT-TERMINATE-SERVICE-PLAN",
    label: "Finalize a Restricted Service Plan as Contract Terminated",
    targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
    operationKind: "UPDATE",
    inputFieldIds: [
      "PLAT-PLAN-F-CONTINUITY-REF",
      "PLAT-PLAN-F-CONTINUITY-VERSION",
      "PLAT-PLAN-F-RESTRICTION-REASON",
    ],
    outputFieldIds: [
      "PLAT-PLAN-F-RESTRICTION-REASON",
      "PLAT-PLAN-F-SERVICE-STATE",
      "PLAT-PLAN-F-VERSION",
    ],
    permissions: platformCommercialPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "RESTRICTED", to: "TERMINATED" },
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "CONTINUITY_WINDOW_NOT_CLOSED",
      "RESTRICTION_REASON_MISMATCH",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [{
        refFieldId: "PLAT-PLAN-F-CONTINUITY-REF",
        versionFieldId: "PLAT-PLAN-F-CONTINUITY-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
        requiredState: "CLOSED",
      }],
      terminalStateGuard: {
        requiredReasonCode: "CONTRACT_TERMINATED",
        requiredContinuityState: "CLOSED",
        reactivationAllowed: false,
      },
    },
  }),
  action({
    id: "PLAT-ACT-EXPIRE-SERVICE-PLAN",
    label: "Finalize a Restricted Service Plan as Expired",
    targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
    operationKind: "UPDATE",
    inputFieldIds: [
      "PLAT-PLAN-F-CONTINUITY-REF",
      "PLAT-PLAN-F-CONTINUITY-VERSION",
      "PLAT-PLAN-F-RESTRICTION-REASON",
    ],
    outputFieldIds: [
      "PLAT-PLAN-F-RESTRICTION-REASON",
      "PLAT-PLAN-F-SERVICE-STATE",
      "PLAT-PLAN-F-VERSION",
    ],
    permissions: platformCommercialPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "RESTRICTED", to: "EXPIRED" },
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "CONTINUITY_WINDOW_NOT_CLOSED",
      "RESTRICTION_REASON_MISMATCH",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [{
        refFieldId: "PLAT-PLAN-F-CONTINUITY-REF",
        versionFieldId: "PLAT-PLAN-F-CONTINUITY-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
        requiredState: "CLOSED",
      }],
      terminalStateGuard: {
        requiredReasonCode: "CONTRACT_EXPIRED",
        requiredContinuityState: "CLOSED",
        reactivationAllowed: false,
      },
    },
  }),
  action({
    id: "PLAT-ACT-SUPERSEDE-SERVICE-PLAN",
    label: "Link a Restricted or Ended Plan to a New Active Recovery Version",
    targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
    operationKind: "UPDATE",
    inputFieldIds: [
      "PLAT-PLAN-F-RECOVERY-PLAN-REF",
      "PLAT-PLAN-F-RECOVERY-PLAN-VERSION",
    ],
    outputFieldIds: [
      "PLAT-PLAN-F-RECOVERY-PLAN-REF",
      "PLAT-PLAN-F-RECOVERY-PLAN-VERSION",
      "PLAT-PLAN-F-SERVICE-STATE",
      "PLAT-PLAN-F-VERSION",
    ],
    permissions: platformCommercialPermissions,
    clients: [CLIENT.WEB],
    transition: { from: ["RESTRICTED", "TERMINATED", "EXPIRED"], to: "SUPERSEDED" },
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "RECOVERY_PLAN_NOT_ACTIVE",
      "RECOVERY_PLAN_SCHOOL_MISMATCH",
      "RECOVERY_PLAN_ID_REUSED",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [{
        refFieldId: "PLAT-PLAN-F-RECOVERY-PLAN-REF",
        versionFieldId: "PLAT-PLAN-F-RECOVERY-PLAN-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
        requiredState: "ACTIVE",
      }],
      recoveryVersionGuard: {
        sourceSchoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
        recoverySchoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
        sourceIdentityFieldId: "PLAT-PLAN-F-ID",
        recoveryIdentityFieldId: "PLAT-PLAN-F-ID",
        recoveryVersionFieldId: "PLAT-PLAN-F-VERSION",
        requiredRecoveryState: "ACTIVE",
        identityMustDiffer: true,
        schoolMustMatch: true,
        exactPinnedRecoveryVersionRequired: true,
        supersedesLineageRequired: true,
        sourceReactivationAllowed: false,
      },
    },
  }),
  action({
    id: "PLAT-ACT-CREATE-COMMERCIAL-BOUNDARY",
    label: "Create a School-only Payer and Governance Boundary",
    targetObjectId: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY",
    operationKind: "CREATE",
    inputFieldIds: [
      "PLAT-COMM-F-SCHOOL-REF",
      "PLAT-COMM-F-SCHOOL-VERSION",
      "PLAT-COMM-F-PAYER-KIND",
      "PLAT-COMM-F-FINANCIAL-CONTACT-REF",
      "PLAT-COMM-F-FINANCIAL-CONTACT-VERSION",
      "PLAT-COMM-F-GOVERNANCE-ADMIN-REF",
      "PLAT-COMM-F-GOVERNANCE-ADMIN-VERSION",
    ],
    outputFieldIds: [
      "PLAT-COMM-F-ID",
      "PLAT-COMM-F-PROHIBITED-CONSUMER-MODELS",
      "PLAT-COMM-F-STATUS",
      "PLAT-COMM-F-VERSION",
    ],
    permissions: platformCommercialPermissions,
    clients: [CLIENT.WEB],
    successState: "DRAFT",
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "COMMERCIAL_CONTACT_SEPARATION_REQUIRED",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      acceptedInputValues: [{
        fieldId: "PLAT-COMM-F-PAYER-KIND",
        optionSetId: "OPT-EXT-019",
        partitionId: "PLAT-COMMERCIAL-PAYER-KIND",
        codes: ["SCHOOL"],
      }],
      relatedStateGuards: [
        {
          refFieldId: "PLAT-COMM-F-SCHOOL-REF",
          versionFieldId: "PLAT-COMM-F-SCHOOL-VERSION",
          targetObjectId: "ACC-OBJ-SCHOOL",
          requiredState: "ACTIVE",
        },
        {
          refFieldId: "PLAT-COMM-F-FINANCIAL-CONTACT-REF",
          versionFieldId: "PLAT-COMM-F-FINANCIAL-CONTACT-VERSION",
          targetObjectId: "ACC-OBJ-SCHOOL-PROFILE",
          requiredState: "ACTIVE",
        },
        {
          refFieldId: "PLAT-COMM-F-GOVERNANCE-ADMIN-REF",
          versionFieldId: "PLAT-COMM-F-GOVERNANCE-ADMIN-VERSION",
          targetObjectId: "ACC-OBJ-SCHOOL-PROFILE",
          requiredState: "ACTIVE",
        },
      ],
      contactBindingGuards: {
        schoolRefFieldId: "PLAT-COMM-F-SCHOOL-REF",
        profileSchoolFieldId: "ACC-PROFILE-F-SCHOOL-ID",
        financialContactRefFieldId: "PLAT-COMM-F-FINANCIAL-CONTACT-REF",
        governanceAdministratorRefFieldId: "PLAT-COMM-F-GOVERNANCE-ADMIN-REF",
        governanceAdministratorRoleFieldId: "ACC-PROFILE-F-PROFILE-TYPE",
        governanceAdministratorRequiredRoleCode: "ROLE-SCHOOL-ADMIN",
        contactsMustDiffer: true,
        failureResult: "COMMERCIAL_CONTACT_SEPARATION_REQUIRED",
      },
    },
  }),
  action({
    id: "PLAT-ACT-CONFIRM-COMMERCIAL-BOUNDARY",
    label: "Confirm the School Commercial and Governance Separation",
    targetObjectId: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY",
    operationKind: "UPDATE",
    outputFieldIds: [
      "PLAT-COMM-F-SCHOOL-CONFIRMED-AT",
      "PLAT-COMM-F-STATUS",
      "PLAT-COMM-F-VERSION",
    ],
    permissions: schoolCommercialConfirmationPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "DRAFT", to: "CONFIRMED" },
    risk: RISK.HIGH,
  }),
  action({
    id: "PLAT-ACT-ACTIVATE-COMMERCIAL-BOUNDARY",
    label: "Activate a Confirmed School Commercial Boundary",
    targetObjectId: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY",
    operationKind: "UPDATE",
    outputFieldIds: ["PLAT-COMM-F-STATUS", "PLAT-COMM-F-VERSION"],
    permissions: platformCommercialPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "CONFIRMED", to: "ACTIVE" },
    risk: RISK.HIGH,
  }),
  action({
    id: "PLAT-ACT-OPEN-SERVICE-CONTINUITY",
    label: "Start Protected Activity Capture before Restricted Service",
    targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
    operationKind: "CREATE",
    inputFieldIds: [
      "PLAT-CONT-F-SCHOOL-REF",
      "PLAT-CONT-F-SCHOOL-VERSION",
      "PLAT-CONT-F-SERVICE-PLAN-REF",
      "PLAT-CONT-F-SERVICE-PLAN-VERSION",
      "PLAT-CONT-F-COMMERCIAL-BOUNDARY-REF",
      "PLAT-CONT-F-COMMERCIAL-BOUNDARY-VERSION",
      "PLAT-CONT-F-RESTRICTION-REASON",
      "PLAT-CONT-F-ACTIVITY-PROTECTION-UNTIL",
      "PLAT-CONT-F-EXIT-WINDOW-UNTIL",
      "PLAT-CONT-F-CONTINUING-DATA-RIGHTS-BASIS",
    ],
    outputFieldIds: [
      "PLAT-CONT-F-ID",
      "PLAT-CONT-F-RESTRICTED-AT",
      "PLAT-CONT-F-PROTECTED-OPERATIONS",
      "PLAT-CONT-F-NEW-ACTIVITY-POLICY",
      "PLAT-CONT-F-ELIGIBLE-ENTRY-COUNT",
      "PLAT-CONT-F-ELIGIBLE-SET-DIGEST",
      "PLAT-CONT-F-ELIGIBLE-MAX-DUE-AT",
      "PLAT-CONT-F-CAPTURED-ENTRY-COUNT",
      "PLAT-CONT-F-CAPTURED-SET-DIGEST",
      "PLAT-CONT-F-MANIFEST-STATUS",
      "PLAT-CONT-F-CAPTURE-RETRY-COUNT",
      "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
      "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      "PLAT-CONT-F-STATUS",
      "PLAT-CONT-F-VERSION",
    ],
    permissions: platformCommercialPermissions,
    clients: [CLIENT.WEB],
    successState: "CAPTURING_PROTECTED_ACTIVITIES",
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "INACTIVE_SERVICE_PLAN",
      "SCHOOL_SCOPE_MISMATCH",
      "EXISTING_CURRENT_CONTINUITY_WINDOW",
      "PROTECTION_WINDOW_TRUNCATES_ELIGIBLE_ACTIVITY",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [
        {
          refFieldId: "PLAT-CONT-F-SCHOOL-REF",
          versionFieldId: "PLAT-CONT-F-SCHOOL-VERSION",
          targetObjectId: "ACC-OBJ-SCHOOL",
          requiredState: "ACTIVE",
        },
        {
          refFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
          versionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
          targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
          requiredState: "ACTIVE",
        },
        {
          refFieldId: "PLAT-CONT-F-COMMERCIAL-BOUNDARY-REF",
          versionFieldId: "PLAT-CONT-F-COMMERCIAL-BOUNDARY-VERSION",
          targetObjectId: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY",
          requiredState: "ACTIVE",
        },
      ],
      schoolScopeGuard: {
        schoolRefFieldId: "PLAT-CONT-F-SCHOOL-REF",
        bindings: [{
          relatedRefFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
          relatedSchoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
        }, {
          relatedRefFieldId: "PLAT-CONT-F-COMMERCIAL-BOUNDARY-REF",
          relatedSchoolRefFieldId: "PLAT-COMM-F-SCHOOL-REF",
        }],
        comparison: "ALL_PINNED_SCHOOL_IDENTITIES_MUST_MATCH",
        failureResult: "SCHOOL_SCOPE_MISMATCH",
      },
      existingCurrentWindowGuard: {
        lookupObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
        schoolRefFieldId: "PLAT-CONT-F-SCHOOL-REF",
        servicePlanRefFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
        servicePlanVersionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
        statusFieldId: "PLAT-CONT-F-STATUS",
        excludedState: "CLOSED",
        maximumExistingMatchesBeforeCreate: 0,
        lookupRule: "EXACT_SCHOOL_AND_SERVICE_PLAN_VERSION_WITH_STATUS_NOT_CLOSED",
        ambiguityEffect: "BLOCK_CREATE",
        failureResult: "EXISTING_CURRENT_CONTINUITY_WINDOW",
      },
      eligibleSetSnapshotContract: {
        evaluationTimeFieldId: "PLAT-CONT-F-RESTRICTED-AT",
        studentWindowObjectId: "HW-OBJ-STUDENT-ACTIVITY-WINDOW",
        studentWindowStartFieldId: "HW-STUDENT-WINDOW-F-START-AT",
        studentWindowEndFieldId: "HW-STUDENT-WINDOW-F-DUE-AT",
        activityObjectId: "HW-OBJ-ASSIGNMENT",
        activityState: "PUBLISHED",
        publicationSnapshotObjectId: "HW-OBJ-PUBLICATION-SNAPSHOT",
        publicationSnapshotState: "SEALED",
        eligibilityRule: "START_AT_LE_CUTOFF_LT_DUE_AT_AND_ACTIVITY_PUBLISHED_WITH_SEALED_SNAPSHOT",
        deniedPurposeCodes: ["TEACHING_PRESENTATION"],
        expectedCountFieldId: "PLAT-CONT-F-ELIGIBLE-ENTRY-COUNT",
        expectedDigestFieldId: "PLAT-CONT-F-ELIGIBLE-SET-DIGEST",
        maximumDueAtFieldId: "PLAT-CONT-F-ELIGIBLE-MAX-DUE-AT",
        digestIdentityFieldIds: [
          "HW-STUDENT-WINDOW-F-ID",
          "HW-STUDENT-WINDOW-F-VERSION",
          "HW-ASSIGNMENT-F-ID",
          "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
          "HW-SNAPSHOT-F-ID",
          "HW-SNAPSHOT-F-VERSION",
        ],
        orderingRule: "LEXICOGRAPHIC_BY_IDENTITY_TUPLE",
        emptySetDigestRule: "CANONICAL_EMPTY_SET_DIGEST",
        snapshotMutationAllowed: false,
      },
      protectionCoverageGuard: {
        schoolProtectionEndFieldId: "PLAT-CONT-F-ACTIVITY-PROTECTION-UNTIL",
        eligibleMaximumDueAtFieldId: "PLAT-CONT-F-ELIGIBLE-MAX-DUE-AT",
        comparison: "SCHOOL_PROTECTION_END_GTE_MAX_ELIGIBLE_STUDENT_WINDOW_DUE_AT",
        emptySetRule: "FINITE_END_AFTER_ELIGIBILITY_CUTOFF",
        failureResult: "PROTECTION_WINDOW_TRUNCATES_ELIGIBLE_ACTIVITY",
      },
      manifestInitialization: {
        manifestStatusFieldId: "PLAT-CONT-F-MANIFEST-STATUS",
        manifestStatus: "CAPTURING",
        capturedCountFieldId: "PLAT-CONT-F-CAPTURED-ENTRY-COUNT",
        capturedCount: 0,
        capturedDigestFieldId: "PLAT-CONT-F-CAPTURED-SET-DIGEST",
        capturedDigestRule: "CANONICAL_EMPTY_SET_DIGEST",
        retryCountFieldId: "PLAT-CONT-F-CAPTURE-RETRY-COUNT",
        retryCount: 0,
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        initialAttemptEpoch: 1,
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
        expectedContinuityVersionRule: "EQUAL_RESULTING_CONTINUITY_VERSION",
        restrictionEffectiveAtFieldId: "PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT",
        restrictionEffectiveAt: null,
      },
      producedEventIds: [
        "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-REQUESTED",
        "EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-RECONCILE-REQUESTED",
      ],
      producedEventContextBindings: [{
        eventId: "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-REQUESTED",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }, {
        eventId: "EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-RECONCILE-REQUESTED",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }],
    },
  }),
  action({
    id: "PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY",
    label: "Capture an Eligible Published Student Activity Window for Continuity",
    targetObjectId: "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY",
    operationKind: "CREATE",
    inputFieldIds: [
      "PLAT-PROTECT-F-CONTINUITY-REF",
      "PLAT-PROTECT-F-CONTINUITY-VERSION",
      "PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH",
      "PLAT-PROTECT-F-EXPECTED-CONTINUITY-VERSION",
      "PLAT-PROTECT-F-STUDENT-WINDOW-REF",
      "PLAT-PROTECT-F-STUDENT-WINDOW-VERSION",
      "PLAT-PROTECT-F-ACTIVITY-REF",
      "PLAT-PROTECT-F-ACTIVITY-VERSION",
      "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-REF",
      "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-VERSION",
    ],
    outputFieldIds: [
      "PLAT-PROTECT-F-ID",
      "PLAT-PROTECT-F-CAPTURED-AT",
      "PLAT-PROTECT-F-PROTECTED-UNTIL",
      "PLAT-PROTECT-F-STATUS",
      "PLAT-PROTECT-F-VERSION",
    ],
    permissions: permissions(
      "SYSTEM",
      ["CURRENT_ACTOR", "ROLE-PLATFORM-OPS"],
      "the service-continuity event captures only exact student windows that were already published and still open at restriction time",
    ),
    successState: "PROTECTED",
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "ACTIVITY_NOT_ALREADY_PUBLISHED",
      "STUDENT_WINDOW_NOT_OPEN_AT_RESTRICTION",
      "SNAPSHOT_MISMATCH",
      "SCHOOL_SCOPE_MISMATCH",
      "CONTINUITY_NOT_CAPTURING",
      "ENTRY_OUTSIDE_ELIGIBLE_SET",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      executionMode: "SYSTEM_EVENT",
      trigger: { kind: "EVENT", eventId: "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-REQUESTED" },
      relatedStateGuards: [{
        refFieldId: "PLAT-PROTECT-F-CONTINUITY-REF",
        versionFieldId: "PLAT-PROTECT-F-CONTINUITY-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
        requiredState: "CAPTURING_PROTECTED_ACTIVITIES",
      }, {
        refFieldId: "PLAT-PROTECT-F-STUDENT-WINDOW-REF",
        versionFieldId: "PLAT-PROTECT-F-STUDENT-WINDOW-VERSION",
        targetObjectId: "HW-OBJ-STUDENT-ACTIVITY-WINDOW",
        requiredState: "ACTIVE",
      }, {
        refFieldId: "PLAT-PROTECT-F-ACTIVITY-REF",
        versionFieldId: "PLAT-PROTECT-F-ACTIVITY-VERSION",
        targetObjectId: "HW-OBJ-ASSIGNMENT",
        requiredState: "PUBLISHED",
      }, {
        refFieldId: "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-REF",
        versionFieldId: "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-VERSION",
        targetObjectId: "HW-OBJ-PUBLICATION-SNAPSHOT",
        requiredState: "SEALED",
      }],
      eligibilityGuard: {
        evaluationTimeFieldId: "PLAT-CONT-F-RESTRICTED-AT",
        studentWindowStartFieldId: "HW-STUDENT-WINDOW-F-START-AT",
        studentWindowEndFieldId: "HW-STUDENT-WINDOW-F-DUE-AT",
        timeRule: "START_AT_LE_RESTRICTION_LT_DUE_AT",
        protectedUntilFieldId: "PLAT-PROTECT-F-PROTECTED-UNTIL",
        schoolProtectionEndFieldId: "PLAT-CONT-F-ACTIVITY-PROTECTION-UNTIL",
        schoolProtectionCoverageRule: "SCHOOL_PROTECTION_END_GTE_STUDENT_DUE_AT",
        protectedUntilRule: "EQUAL_STUDENT_WINDOW_DUE_AT",
        activityPurposeFieldId: "HW-ASSIGNMENT-F-PURPOSE",
        deniedPurposeCodes: ["TEACHING_PRESENTATION"],
        schoolBinding: "ENTRY_ACTIVITY_CONTEXT_EQUALS_CONTINUITY_SCHOOL",
        laterCreatedEntriesAllowed: false,
      },
      manifestMembershipGuard: {
        expectedDigestFieldId: "PLAT-CONT-F-ELIGIBLE-SET-DIGEST",
        attemptEpochFieldId: "PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH",
        entryIdentityFieldIds: [
          "PLAT-PROTECT-F-STUDENT-WINDOW-REF",
          "PLAT-PROTECT-F-STUDENT-WINDOW-VERSION",
          "PLAT-PROTECT-F-ACTIVITY-REF",
          "PLAT-PROTECT-F-ACTIVITY-VERSION",
          "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-REF",
          "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-VERSION",
        ],
        membershipRule: "EXACT_IDENTITY_TUPLE_MUST_EXIST_IN_IMMUTABLE_ELIGIBLE_SET",
        uniquenessRule: "ONE_ENTRY_PER_CONTINUITY_AND_IDENTITY_TUPLE",
        reconciliationScopeRule: "COUNT_ALL_DISTINCT_ELIGIBLE_ENTRIES_FOR_CONTINUITY_AFTER_CURRENT_EVENT_CAS",
        outOfSetFailureResult: "ENTRY_OUTSIDE_ELIGIBLE_SET",
        duplicateEffect: "IDEMPOTENT_RETURN_EXISTING_IDENTICAL_ENTRY",
      },
      captureIdempotencyContract: {
        tupleFieldIds: [
          "PLAT-PROTECT-F-CONTINUITY-REF",
          "PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH",
          "PLAT-PROTECT-F-EXPECTED-CONTINUITY-VERSION",
          "PLAT-PROTECT-F-STUDENT-WINDOW-REF",
          "PLAT-PROTECT-F-STUDENT-WINDOW-VERSION",
          "PLAT-PROTECT-F-ACTIVITY-REF",
          "PLAT-PROTECT-F-ACTIVITY-VERSION",
          "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-REF",
          "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-VERSION",
        ],
        deliverySemantics: "AT_LEAST_ONCE",
        duplicateRule: "RETURN_EXISTING_ENTRY_WITHOUT_NEW_WRITE_OR_FAILURE_EVENT",
        conflictingTupleResult: "SNAPSHOT_MISMATCH",
      },
      captureAttemptCasGuard: {
        continuityRefFieldId: "PLAT-PROTECT-F-CONTINUITY-REF",
        pinnedContinuityVersionFieldId: "PLAT-PROTECT-F-CONTINUITY-VERSION",
        eventAttemptEpochFieldId: "PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH",
        eventExpectedContinuityVersionFieldId: "PLAT-PROTECT-F-EXPECTED-CONTINUITY-VERSION",
        currentAttemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        currentExpectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
        currentContinuityVersionFieldId: "PLAT-CONT-F-VERSION",
        requiredContinuityState: "CAPTURING_PROTECTED_ACTIVITIES",
        matchRule: "EVENT_EPOCH_AND_EXPECTED_VERSION_EQUAL_CURRENT_ATTEMPT_AND_OBJECT_VERSION",
        pinnedVersionRule: "PINNED_CONTINUITY_VERSION_EQUALS_EVENT_EXPECTED_CONTINUITY_VERSION",
        staleEventResult: "STALE_EVENT_IGNORED",
        staleEventEffect: "IDEMPOTENT_NO_OP",
        staleEventWritesAllowed: false,
        staleEventFailureEmissionAllowed: false,
      },
      nonFailureNoOpResults: ["STALE_EVENT_IGNORED"],
      producedEventIds: ["EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-RECONCILE-REQUESTED"],
      producedEventContextBindings: [{
        eventId: "EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-RECONCILE-REQUESTED",
        attemptEpochFieldId: "PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-PROTECT-F-EXPECTED-CONTINUITY-VERSION",
      }],
      failureEventRouting: [{
        eventId: "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-FAILED",
        eligibleResultCodes: [
          "ACTIVITY_NOT_ALREADY_PUBLISHED",
          "STUDENT_WINDOW_NOT_OPEN_AT_RESTRICTION",
          "SNAPSHOT_MISMATCH",
          "SCHOOL_SCOPE_MISMATCH",
          "ENTRY_OUTSIDE_ELIGIBLE_SET",
          "VALIDATION_FAILED",
          "VERSION_CONFLICT",
        ],
        emissionRule: "ONLY_WHEN_NON_RETRYABLE_OR_RETRY_BUDGET_EXHAUSTED",
        duplicateDeliveryEmitsFailure: false,
        attemptContextForwarding: {
          attemptEpochFieldId: "PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH",
          expectedContinuityVersionFieldId: "PLAT-PROTECT-F-EXPECTED-CONTINUITY-VERSION",
        },
      }],
    },
  }),
  action({
    id: "PLAT-ACT-RECONCILE-AND-SEAL-PROTECTED-ACTIVITY-MANIFEST",
    label: "Reconcile and Seal the Complete Protected Activity Manifest",
    targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
    operationKind: "UPDATE",
    inputFieldIds: [
      "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
      "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
    ],
    outputFieldIds: [
      "PLAT-CONT-F-CAPTURED-ENTRY-COUNT",
      "PLAT-CONT-F-CAPTURED-SET-DIGEST",
      "PLAT-CONT-F-MANIFEST-STATUS",
      "PLAT-CONT-F-MANIFEST-SEALED-AT",
      "PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT",
      "PLAT-CONT-F-STATUS",
      "PLAT-CONT-F-VERSION",
    ],
    permissions: permissions(
      "SYSTEM",
      ["CURRENT_ACTOR", "ROLE-PLATFORM-OPS"],
      "the system seals only a complete canonical manifest and atomically activates the restriction",
    ),
    transition: { from: "CAPTURING_PROTECTED_ACTIVITIES", to: "ACTIVITY_PROTECTION_OPEN" },
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "PROTECTED_ACTIVITY_MANIFEST_INCOMPLETE",
      "PROTECTED_ACTIVITY_MANIFEST_DIGEST_MISMATCH",
      "PROTECTED_ACTIVITY_MANIFEST_COUNT_OVERFLOW",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      executionMode: "SYSTEM_EVENT",
      trigger: {
        kind: "EVENT",
        eventId: "EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-RECONCILE-REQUESTED",
      },
      manifestReconciliationContract: {
        entryObjectId: "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY",
        continuityEntryRefFieldId: "PLAT-PROTECT-F-CONTINUITY-REF",
        entryCaptureAttemptEpochFieldId: "PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH",
        entryCaptureExpectedContinuityVersionFieldId: "PLAT-PROTECT-F-EXPECTED-CONTINUITY-VERSION",
        entryAttemptFieldsAreProvenanceOnly: true,
        entrySelectionRule: "ALL_DISTINCT_ELIGIBLE_ENTRIES_FOR_CONTINUITY_AFTER_CURRENT_EVENT_CAS",
        expectedCountFieldId: "PLAT-CONT-F-ELIGIBLE-ENTRY-COUNT",
        expectedDigestFieldId: "PLAT-CONT-F-ELIGIBLE-SET-DIGEST",
        capturedCountFieldId: "PLAT-CONT-F-CAPTURED-ENTRY-COUNT",
        capturedDigestFieldId: "PLAT-CONT-F-CAPTURED-SET-DIGEST",
        manifestStatusFieldId: "PLAT-CONT-F-MANIFEST-STATUS",
        requiredManifestStatus: "CAPTURING",
        sealedManifestStatus: "SEALED",
        countRule: "DISTINCT_CAPTURED_IDENTITY_COUNT_EQUALS_EXPECTED_COUNT",
        digestRule: "CANONICAL_CAPTURED_SET_DIGEST_EQUALS_EXPECTED_SET_DIGEST",
        zeroEligibleRule: "SEAL_ONLY_WHEN_EXPECTED_COUNT_IS_ZERO_AND_BOTH_DIGESTS_EQUAL_CANONICAL_EMPTY_SET_DIGEST",
        incompleteEffect: "KEEP_CAPTURING_WITH_RESTRICTION_NOT_EFFECTIVE",
        manifestSealedAtFieldId: "PLAT-CONT-F-MANIFEST-SEALED-AT",
        restrictionEffectiveAtFieldId: "PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT",
        sealAndRestrictionTimestampRule: "WRITE_SAME_ATOMIC_TIMESTAMP",
        partialSealAllowed: false,
      },
      captureAttemptCasGuard: {
        eventAttemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        eventExpectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
        currentAttemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        currentExpectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
        currentContinuityVersionFieldId: "PLAT-CONT-F-VERSION",
        requiredContinuityState: "CAPTURING_PROTECTED_ACTIVITIES",
        matchRule: "EVENT_EPOCH_AND_EXPECTED_VERSION_EQUAL_CURRENT_ATTEMPT_AND_OBJECT_VERSION",
        staleEventResult: "STALE_EVENT_IGNORED",
        staleEventEffect: "IDEMPOTENT_NO_OP",
        staleEventWritesAllowed: false,
        staleEventFailureEmissionAllowed: false,
      },
      nonFailureNoOpResults: ["STALE_EVENT_IGNORED"],
      failureEventRouting: [{
        eventId: "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-FAILED",
        eligibleResultCodes: [
          "PROTECTED_ACTIVITY_MANIFEST_DIGEST_MISMATCH",
          "PROTECTED_ACTIVITY_MANIFEST_COUNT_OVERFLOW",
        ],
        emissionRule: "IMMEDIATE_NON_RETRYABLE_RECONCILIATION_FAILURE",
        excludedResultCodes: ["PROTECTED_ACTIVITY_MANIFEST_INCOMPLETE"],
        attemptContextForwarding: {
          attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
          expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
        },
      }],
      producedEventIds: ["EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-SEALED"],
      producedEventContextBindings: [{
        eventId: "EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-SEALED",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }],
    },
  }),
  action({
    id: "PLAT-ACT-MARK-PROTECTED-ACTIVITY-CAPTURE-FAILED",
    label: "Mark Protected Activity Capture Failed without Activating Restriction",
    targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
    operationKind: "UPDATE",
    inputFieldIds: [
      "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
      "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      "PLAT-CONT-F-CAPTURE-FAILURE-REASON",
    ],
    outputFieldIds: [
      "PLAT-CONT-F-CAPTURE-FAILURE-REASON",
      "PLAT-CONT-F-MANIFEST-STATUS",
      "PLAT-CONT-F-STATUS",
      "PLAT-CONT-F-VERSION",
    ],
    permissions: permissions(
      "SYSTEM",
      ["CURRENT_ACTOR", "ROLE-PLATFORM-OPS"],
      "the system records a capture failure while leaving the service restriction ineffective",
    ),
    transition: { from: "CAPTURING_PROTECTED_ACTIVITIES", to: "CAPTURE_FAILED" },
    risk: RISK.HIGH,
    extras: {
      executionMode: "SYSTEM_EVENT",
      trigger: { kind: "EVENT", eventId: "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-FAILED" },
      captureAttemptCasGuard: {
        eventAttemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        eventExpectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
        currentAttemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        currentExpectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
        currentContinuityVersionFieldId: "PLAT-CONT-F-VERSION",
        requiredContinuityState: "CAPTURING_PROTECTED_ACTIVITIES",
        matchRule: "EVENT_EPOCH_AND_EXPECTED_VERSION_EQUAL_CURRENT_ATTEMPT_AND_OBJECT_VERSION",
        staleEventResult: "STALE_EVENT_IGNORED",
        staleEventEffect: "IDEMPOTENT_NO_OP",
        staleEventWritesAllowed: false,
        staleEventFailureEmissionAllowed: false,
      },
      nonFailureNoOpResults: ["STALE_EVENT_IGNORED"],
      captureFailureContract: {
        manifestStatusFieldId: "PLAT-CONT-F-MANIFEST-STATUS",
        manifestStatus: "CAPTURE_FAILED",
        restrictionEffectiveAtFieldId: "PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT",
        restrictionEffectiveAtMustRemain: null,
        preserveEligibleSetSnapshot: true,
        preserveCapturedEntries: true,
        staleAttemptRule: "EPOCH_OR_EXPECTED_VERSION_MISMATCH_RETURNS_STALE_EVENT_IGNORED",
        staleAttemptStateWriteAllowed: false,
      },
    },
  }),
  action({
    id: "PLAT-ACT-RETRY-PROTECTED-ACTIVITY-CAPTURE",
    label: "Retry Missing Protected Activity Capture Entries",
    targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
    operationKind: "UPDATE",
    inputFieldIds: [
      "PLAT-CONT-F-SERVICE-PLAN-REF",
      "PLAT-CONT-F-SERVICE-PLAN-VERSION",
      "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
      "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
    ],
    outputFieldIds: [
      "PLAT-CONT-F-CAPTURE-RETRY-COUNT",
      "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
      "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      "PLAT-CONT-F-MANIFEST-STATUS",
      "PLAT-CONT-F-STATUS",
      "PLAT-CONT-F-VERSION",
    ],
    permissions: platformCommercialPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "CAPTURE_FAILED", to: "CAPTURING_PROTECTED_ACTIVITIES" },
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "INACTIVE_SERVICE_PLAN",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [{
        refFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
        versionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
        requiredState: "ACTIVE",
      }],
      retryAttemptCasGuard: {
        requestAttemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        requestExpectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
        currentAttemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        currentExpectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
        currentContinuityVersionFieldId: "PLAT-CONT-F-VERSION",
        requiredContinuityState: "CAPTURE_FAILED",
        matchRule: "REQUEST_EPOCH_AND_EXPECTED_VERSION_EQUAL_FAILED_ATTEMPT_TOKENS",
        targetVersionCasRule: "REQUEST_TARGET_VERSION_EQUALS_CURRENT_CONTINUITY_VERSION",
        staleEventResult: "STALE_EVENT_IGNORED",
        staleEventEffect: "IDEMPOTENT_NO_OP",
        staleEventWritesAllowed: false,
      },
      nonFailureNoOpResults: ["STALE_EVENT_IGNORED"],
      captureRetryContract: {
        expectedCountFieldId: "PLAT-CONT-F-ELIGIBLE-ENTRY-COUNT",
        expectedDigestFieldId: "PLAT-CONT-F-ELIGIBLE-SET-DIGEST",
        retryCountFieldId: "PLAT-CONT-F-CAPTURE-RETRY-COUNT",
        retryCountRule: "INCREMENT_BY_ONE",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        attemptEpochRule: "ATOMIC_INCREMENT_BY_ONE",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
        expectedContinuityVersionRule: "EQUAL_RESULTING_CONTINUITY_VERSION",
        atomicMutationFieldIds: [
          "PLAT-CONT-F-CAPTURE-RETRY-COUNT",
          "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
          "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
          "PLAT-CONT-F-MANIFEST-STATUS",
          "PLAT-CONT-F-STATUS",
          "PLAT-CONT-F-VERSION",
        ],
        manifestStatusFieldId: "PLAT-CONT-F-MANIFEST-STATUS",
        manifestStatus: "CAPTURING",
        retrySelectionRule: "CAPTURE_ONLY_EXPECTED_IDENTITIES_NOT_ALREADY_PRESENT",
        preserveEligibleSetSnapshot: true,
        preserveCapturedEntries: true,
        priorAttemptEntriesRule: "REUSE_VALID_DISTINCT_ENTRIES_AND_RETAIN_CAPTURE_ATTEMPT_PROVENANCE",
        duplicateStudentDetailEntriesAllowed: false,
        restrictionEffectiveAtFieldId: "PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT",
        restrictionEffectiveAtMustRemain: null,
      },
      producedEventIds: [
        "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-REQUESTED",
        "EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-RECONCILE-REQUESTED",
      ],
      producedEventContextBindings: [{
        eventId: "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-REQUESTED",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }, {
        eventId: "EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-RECONCILE-REQUESTED",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }],
    },
  }),
  action({
    id: "PLAT-ACT-EVALUATE-NEW-ACTIVITY-ENTITLEMENT",
    label: "Evaluate New Activity Creation against Current Entitlement",
    targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
    operationKind: "READ",
    outputFieldIds: [
      "PLAT-PLAN-F-SCOPE",
      "PLAT-PLAN-F-SERVICE-STATE",
      "PLAT-PLAN-F-VERSION",
    ],
    permissions: [
      {
        effect: "ALLOW",
        actorRef: "CURRENT_ACTOR",
        condition: "the current school relationship may request an entitlement decision, but activity creation is allowed only inside the current active entitlement and never by a protection window alone",
      },
      {
        effect: "DENY",
        roleRef: "ROLE-PLATFORM-OPS",
        condition: "platform operations cannot bypass the school entitlement or create teaching activities",
      },
    ],
    clients: [CLIENT.WEB],
    failureResults: ["PERMISSION_DENIED", "ENTITLEMENT_DECISION_UNAVAILABLE"],
    extras: {
      entitlementDecisionContract: {
        guardedActionIds: [
          "HW-ACT-CREATE-DRAFT",
          "HW-ACT-CREATE-REPLACEMENT-DRAFT",
          "HW-ACT-PUBLISH-NOW",
          "HW-ACT-SCHEDULE-PUBLISH",
          "HW-ACT-PUBLISH-SCHEDULED",
          "HW-ACT-PUBLISH-REPLACEMENT",
        ],
        sourceObjectId: "PLAT-OBJ-SERVICE-PLAN",
        sourceIdentityFieldId: "PLAT-PLAN-F-ID",
        sourceVersionFieldId: "PLAT-PLAN-F-VERSION",
        sourceStateFieldId: "PLAT-PLAN-F-SERVICE-STATE",
        requiredSourceState: "ACTIVE",
        scopeFieldId: "PLAT-PLAN-F-SCOPE",
        scopeRule: "REQUESTED_ACTIVITY_CONTEXT_WITHIN_PINNED_SERVICE_PLAN_SCOPE",
        continuityObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
        continuityServicePlanRefFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
        continuityServicePlanVersionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
        continuityManifestStatusFieldId: "PLAT-CONT-F-MANIFEST-STATUS",
        continuityRestrictionEffectiveAtFieldId: "PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT",
        currentContinuitySelection: {
          lookupObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
          sourceSchoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
          continuitySchoolRefFieldId: "PLAT-CONT-F-SCHOOL-REF",
          continuityServicePlanRefFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
          continuityServicePlanVersionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
          continuityStatusFieldId: "PLAT-CONT-F-STATUS",
          excludedState: "CLOSED",
          maximumMatches: 1,
          selectionRule: "EXACT_SCHOOL_AND_PINNED_SERVICE_PLAN_VERSION_WITH_STATUS_NOT_CLOSED",
          uniquenessConstraintProperty: "currentWindowUniquenessConstraint",
          zeroMatchMeaning: "NO_CURRENT_CONTINUITY_WINDOW",
          ambiguousMatchResult: "ENTITLEMENT_DECISION_UNAVAILABLE",
          ambiguousMatchEffect: "BLOCK",
        },
        protectionWindowAuthorizesNewActivity: false,
        decisionBranches: [{
          branchId: "ACTIVE_PLAN_NO_CONTINUITY",
          sourcePredicate: "EXACT_PINNED_SERVICE_PLAN_STATE_IS_ACTIVE",
          continuityPredicate: "NO_CURRENT_CONTINUITY_WINDOW",
          scopePredicate: "REQUEST_WITHIN_PINNED_SERVICE_PLAN_SCOPE",
          predicateJoin: "AND",
          decisionCode: "ACTIVE_ALLOW",
          effect: "ALLOW",
        }, {
          branchId: "ACTIVE_PLAN_NON_CLOSED_CONTINUITY",
          sourcePredicate: "EXACT_PINNED_SERVICE_PLAN_STATE_IS_ACTIVE",
          continuityPredicate: "CURRENT_CONTINUITY_WINDOW_STATUS_NOT_CLOSED",
          scopePredicate: "REQUEST_WITHIN_PINNED_SERVICE_PLAN_SCOPE",
          predicateJoin: "AND",
          decisionCode: "CONTINUITY_WINDOW_BLOCK",
          effect: "BLOCK",
        }, {
          branchId: "NO_CURRENT_ENTITLEMENT",
          sourcePredicate: "SERVICE_PLAN_MISSING_OR_NOT_ACTIVE_OR_VERSION_MISMATCH",
          continuityPredicate: "ANY",
          scopePredicate: "MISSING_OR_REQUEST_OUTSIDE_PINNED_SERVICE_PLAN_SCOPE",
          predicateJoin: "OR_SOURCE_OR_SCOPE",
          decisionCode: "NO_ENTITLEMENT_BLOCK",
          effect: "BLOCK",
        }],
        allowedDecisionCodes: ["ACTIVE_ALLOW"],
        blockedDecisionCodes: ["CONTINUITY_WINDOW_BLOCK", "NO_ENTITLEMENT_BLOCK"],
        branchesMutuallyExclusive: true,
        branchesExhaustive: true,
        unknownDecisionEffect: "BLOCK",
        failureResult: "ACTIVITY_ENTITLEMENT_BLOCKED",
      },
    },
  }),
  action({
    id: "PLAT-ACT-ENTER-EXIT-WINDOW",
    label: "Enter the Explicit Service Exit Window",
    targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
    operationKind: "UPDATE",
    inputFieldIds: [
      "PLAT-CONT-F-SERVICE-PLAN-REF",
      "PLAT-CONT-F-SERVICE-PLAN-VERSION",
    ],
    outputFieldIds: ["PLAT-CONT-F-STATUS", "PLAT-CONT-F-VERSION"],
    permissions: platformCommercialPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "ACTIVITY_PROTECTION_OPEN", to: "EXIT_WINDOW_OPEN" },
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "INACTIVE_SERVICE_PLAN",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [{
        refFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
        versionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
        requiredState: "ACTIVE",
      }],
      producedEventIds: ["EVT-PLAT-SERVICE-EXIT-WINDOW-OPENED"],
    },
  }),
  action({
    id: "PLAT-ACT-CLOSE-SERVICE-CONTINUITY",
    label: "Close the Finite Service Continuity Window",
    targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
    operationKind: "UPDATE",
    inputFieldIds: [
      "PLAT-CONT-F-SERVICE-PLAN-REF",
      "PLAT-CONT-F-SERVICE-PLAN-VERSION",
    ],
    outputFieldIds: ["PLAT-CONT-F-STATUS", "PLAT-CONT-F-VERSION"],
    permissions: platformCommercialPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "EXIT_WINDOW_OPEN", to: "CLOSED" },
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "SERVICE_PLAN_NOT_RESTRICTED",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [{
        refFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
        versionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
        requiredState: "RESTRICTED",
      }],
      closeGuard: {
        requiredServicePlanState: "RESTRICTED",
        closedWindowDoesNotRestoreEntitlement: true,
        failureResult: "SERVICE_PLAN_NOT_RESTRICTED",
      },
    },
  }),
  action({
    id: "PLAT-ACT-VIEW-SERVICE-CONTINUITY",
    label: "View Current Protected Operations and Exit Deadlines",
    targetObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
    operationKind: "READ",
    outputFieldIds: [
      "PLAT-CONT-F-RESTRICTION-REASON",
      "PLAT-CONT-F-ACTIVITY-PROTECTION-UNTIL",
      "PLAT-CONT-F-EXIT-WINDOW-UNTIL",
      "PLAT-CONT-F-PROTECTED-OPERATIONS",
      "PLAT-CONT-F-NEW-ACTIVITY-POLICY",
      "PLAT-CONT-F-CONTINUING-DATA-RIGHTS-BASIS",
      "PLAT-CONT-F-ELIGIBLE-ENTRY-COUNT",
      "PLAT-CONT-F-ELIGIBLE-SET-DIGEST",
      "PLAT-CONT-F-ELIGIBLE-MAX-DUE-AT",
      "PLAT-CONT-F-CAPTURED-ENTRY-COUNT",
      "PLAT-CONT-F-CAPTURED-SET-DIGEST",
      "PLAT-CONT-F-MANIFEST-STATUS",
      "PLAT-CONT-F-MANIFEST-SEALED-AT",
      "PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT",
      "PLAT-CONT-F-CAPTURE-FAILURE-REASON",
      "PLAT-CONT-F-CAPTURE-RETRY-COUNT",
      "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
      "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      "PLAT-CONT-F-STATUS",
      "PLAT-CONT-F-VERSION",
    ],
    permissions: [
      {
        effect: "ALLOW",
        actorRef: "CURRENT_ACTOR",
        condition: "the current school relationship authorizes only the caller's protected operation and exposes no student learning detail",
      },
      {
        effect: "DENY",
        roleRef: "ROLE-PLATFORM-OPS",
        condition: "platform operations cannot use a continuity window to inspect student learning detail",
      },
    ],
    clients: [CLIENT.WEB],
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
      serviceContinuityOperationCode: "SECURITY_SUPPORT",
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
      serviceContinuityOperationCode: "SECURITY_SUPPORT",
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
  title: "School Onboarding, Commercial Boundary, Service Continuity, and Support Access",
  objective: "Operate school onboarding and support while enforcing school-only payment, separated financial and governance contacts, non-consumer monetization, and finite protected-activity and exit windows",
  entryConditions: ["the school has authorized a service onboarding context"],
  exitConditions: [
    "service state and the school-only payer boundary are school-confirmed",
    "financial contact and governance administrator profiles remain distinct",
    "every support access is scoped expiring and auditable",
    "restricted service protects already-published activities and explicit exit operations only through finite versioned windows",
  ],
  baselineDecisionIds: ["BASE-001", "BASE-007"],
  productDecisionIds: ["D085", "D088", "D089", "D091"],
  nfrIds: ["NFR-003", "NFR-006", "NFR-008"],
  objects: platformObjects,
  relationships: [
    {
      id: "PLAT-REL-CONTINUITY-SERVICE-PLAN",
      fromObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
      toObjectId: "PLAT-OBJ-SERVICE-PLAN",
      type: "AUTHORIZED_BY",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "keep capture unsealed and the restriction ineffective; a missing or non-active exact plan version blocks retry and new-activity creation",
    },
    {
      id: "PLAT-REL-CONTINUITY-COMMERCIAL-BOUNDARY",
      fromObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
      toObjectId: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY",
      type: "REQUIRES",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "freeze new operations, preserve the last auditable window version, and require a new current commercial boundary before any further entitlement decision",
    },
    {
      id: "PLAT-REL-PROTECTED-ENTRY-CONTINUITY",
      fromObjectId: "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY",
      toObjectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
      type: "RESULT_OF",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "retain the immutable captured entry for audit and deny any use after its finite protected-until time",
    },
    {
      id: "PLAT-REL-SERVICE-PLAN-RECOVERY",
      fromObjectId: "PLAT-OBJ-SERVICE-PLAN",
      toObjectId: "PLAT-OBJ-SERVICE-PLAN",
      type: "REFERENCES",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "never reactivate the restricted or ended source version; require another independently confirmed ACTIVE plan version",
    },
  ],
  actionFacts: platformActions,
  servicePlanEntitlementContract: {
    objectId: "PLAT-OBJ-SERVICE-PLAN",
    schoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
    schoolVersionFieldId: "PLAT-PLAN-F-SCHOOL-VERSION",
    stateFieldId: "PLAT-PLAN-F-SERVICE-STATE",
    versionFieldId: "PLAT-PLAN-F-VERSION",
    currentState: "ACTIVE",
    maximumCurrentVersionsPerSchool: 1,
    selectionRule: "EXACT_PINNED_ACTIVE_VERSION",
    createActionId: "PLAT-ACT-CREATE-SERVICE-PLAN",
    confirmActionId: "PLAT-ACT-CONFIRM-SERVICE-PLAN",
    activateActionId: "PLAT-ACT-ACTIVATE-SERVICE-PLAN",
    restrictActionId: "PLAT-ACT-RESTRICT-SERVICE-PLAN",
    terminateActionId: "PLAT-ACT-TERMINATE-SERVICE-PLAN",
    expireActionId: "PLAT-ACT-EXPIRE-SERVICE-PLAN",
    supersedeActionId: "PLAT-ACT-SUPERSEDE-SERVICE-PLAN",
    continuityRefFieldId: "PLAT-PLAN-F-CONTINUITY-REF",
    continuityVersionFieldId: "PLAT-PLAN-F-CONTINUITY-VERSION",
    restrictionReasonFieldId: "PLAT-PLAN-F-RESTRICTION-REASON",
    restrictionEffectiveAtFieldId: "PLAT-PLAN-F-RESTRICTION-EFFECTIVE-AT",
    recoveryPlanRefFieldId: "PLAT-PLAN-F-RECOVERY-PLAN-REF",
    recoveryPlanVersionFieldId: "PLAT-PLAN-F-RECOVERY-PLAN-VERSION",
    restrictedStates: ["RESTRICTED", "TERMINATED", "EXPIRED", "SUPERSEDED"],
    reactivationAllowed: false,
    recoveryRequiresNewActiveVersion: true,
    closedContinuityRestoresEntitlement: false,
  },
  commercialBoundaryContract: {
    objectId: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY",
    schoolRefFieldId: "PLAT-COMM-F-SCHOOL-REF",
    payerOptionSetId: "OPT-EXT-019",
    allowedPayerCodes: ["SCHOOL"],
    financialContactFieldId: "PLAT-COMM-F-FINANCIAL-CONTACT-REF",
    governanceAdministratorFieldId: "PLAT-COMM-F-GOVERNANCE-ADMIN-REF",
    contactsMustDiffer: true,
    governanceAdministratorRequiredRoleCode: "ROLE-SCHOOL-ADMIN",
    prohibitedConsumerModels: [
      "STUDENT_PAYMENT",
      "GUARDIAN_PAYMENT",
      "ADVERTISING",
      "WEAKNESS_BASED_COMMERCE",
      "CONTENT_MARKETPLACE",
      "TEACHER_REVENUE_SHARE",
    ],
    coreLearningLoopPaywallAllowed: false,
  },
  serviceContinuityContract: {
    objectId: "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
    servicePlanObjectId: "PLAT-OBJ-SERVICE-PLAN",
    servicePlanRefFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
    servicePlanVersionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
    requiredServicePlanState: "ACTIVE",
    openActionId: "PLAT-ACT-OPEN-SERVICE-CONTINUITY",
    viewActionId: "PLAT-ACT-VIEW-SERVICE-CONTINUITY",
    publishedActivityProtectionFieldId: "PLAT-CONT-F-ACTIVITY-PROTECTION-UNTIL",
    protectedActivityEntryObjectId: "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY",
    captureProtectedActivityActionId: "PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY",
    reconcileAndSealActionId: "PLAT-ACT-RECONCILE-AND-SEAL-PROTECTED-ACTIVITY-MANIFEST",
    markCaptureFailedActionId: "PLAT-ACT-MARK-PROTECTED-ACTIVITY-CAPTURE-FAILED",
    retryCaptureActionId: "PLAT-ACT-RETRY-PROTECTED-ACTIVITY-CAPTURE",
    captureRequestEventId: "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-REQUESTED",
    reconcileRequestEventId: "EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-RECONCILE-REQUESTED",
    captureFailedEventId: "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-FAILED",
    manifestSealedEventId: "EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-SEALED",
    enterExitWindowActionId: "PLAT-ACT-ENTER-EXIT-WINDOW",
    exitWindowOpenedEventId: "EVT-PLAT-SERVICE-EXIT-WINDOW-OPENED",
    restrictServicePlanActionId: "PLAT-ACT-RESTRICT-SERVICE-PLAN",
    closeActionId: "PLAT-ACT-CLOSE-SERVICE-CONTINUITY",
    closeRequiredServicePlanState: "RESTRICTED",
    closedWindowRestoresEntitlement: false,
    eligibleCountFieldId: "PLAT-CONT-F-ELIGIBLE-ENTRY-COUNT",
    eligibleDigestFieldId: "PLAT-CONT-F-ELIGIBLE-SET-DIGEST",
    eligibleMaximumDueAtFieldId: "PLAT-CONT-F-ELIGIBLE-MAX-DUE-AT",
    capturedCountFieldId: "PLAT-CONT-F-CAPTURED-ENTRY-COUNT",
    capturedDigestFieldId: "PLAT-CONT-F-CAPTURED-SET-DIGEST",
    manifestStatusFieldId: "PLAT-CONT-F-MANIFEST-STATUS",
    manifestStatusOptionSetId: "OPT-EXT-025",
    manifestSealedAtFieldId: "PLAT-CONT-F-MANIFEST-SEALED-AT",
    restrictionEffectiveAtFieldId: "PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT",
    captureRetryCountFieldId: "PLAT-CONT-F-CAPTURE-RETRY-COUNT",
    captureAttemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
    expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
    captureEntryAttemptEpochFieldId: "PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH",
    captureEntryExpectedContinuityVersionFieldId: "PLAT-PROTECT-F-EXPECTED-CONTINUITY-VERSION",
    captureAttemptCasGuardProperty: "captureAttemptCasGuard",
    retryAttemptCasGuardProperty: "retryAttemptCasGuard",
    eventAttemptContextContractProperty: "captureAttemptContextContract",
    staleEventResult: "STALE_EVENT_IGNORED",
    staleEventEffect: "IDEMPOTENT_NO_OP",
    retryAttemptEpochRule: "ATOMIC_INCREMENT_BY_ONE",
    retryExpectedContinuityVersionRule: "EQUAL_RESULTING_CONTINUITY_VERSION",
    currentWindowUniqueness: {
      schoolRefFieldId: "PLAT-CONT-F-SCHOOL-REF",
      servicePlanRefFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
      servicePlanVersionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
      statusFieldId: "PLAT-CONT-F-STATUS",
      excludedState: "CLOSED",
      maximumCurrentWindowsPerSchoolAndServicePlanVersion: 1,
      selectionRule: "EXACT_SCHOOL_AND_SERVICE_PLAN_VERSION_WITH_STATUS_NOT_CLOSED",
      openGuardProperty: "existingCurrentWindowGuard",
      openFailureResult: "EXISTING_CURRENT_CONTINUITY_WINDOW",
      ambiguityEffect: "FAIL_CLOSED",
    },
    initialWindowState: "CAPTURING_PROTECTED_ACTIVITIES",
    sealedWindowState: "ACTIVITY_PROTECTION_OPEN",
    captureFailedWindowState: "CAPTURE_FAILED",
    captureRequiredState: "CAPTURING_PROTECTED_ACTIVITIES",
    sealRule: "ELIGIBLE_AND_CAPTURED_COUNT_PLUS_CANONICAL_DIGEST_MUST_EXACTLY_MATCH",
    restrictionActivationRule: "ONLY_ATOMICALLY_WITH_SEALED_MANIFEST",
    protectedUntilRule: "EQUAL_STUDENT_WINDOW_DUE_AT",
    schoolProtectionCoverageRule: "SCHOOL_PROTECTION_END_GTE_MAX_ELIGIBLE_STUDENT_WINDOW_DUE_AT",
    exitWindowFieldId: "PLAT-CONT-F-EXIT-WINDOW-UNTIL",
    protectedOperations: [
      "COMPLETE_PUBLISHED_ACTIVITY",
      "HISTORICAL_READ",
      "LEGAL_EXPORT",
      "TRANSFER",
      "DELETION",
      "SECURITY_SUPPORT",
    ],
    newActivityPolicy: "BLOCK_NEW_ACTIVITY_OUTSIDE_CURRENT_ENTITLEMENT",
    activityCreationGuardActionId: "PLAT-ACT-EVALUATE-NEW-ACTIVITY-ENTITLEMENT",
    guardedActivityCreationActionIds: [
      "HW-ACT-CREATE-DRAFT",
      "HW-ACT-CREATE-REPLACEMENT-DRAFT",
      "HW-ACT-PUBLISH-NOW",
      "HW-ACT-SCHEDULE-PUBLISH",
      "HW-ACT-PUBLISH-SCHEDULED",
      "HW-ACT-PUBLISH-REPLACEMENT",
    ],
    protectedActivityCompletionActionIds: [
      "SUB-ACT-SUBMIT",
      "SUB-ACT-SUBMIT-PROTECTED",
      "SUB-ACT-RESUBMIT",
    ],
    operationBindings: [{
      operationCode: "COMPLETE_PUBLISHED_ACTIVITY",
      actionIds: ["SUB-ACT-SUBMIT", "SUB-ACT-SUBMIT-PROTECTED", "SUB-ACT-RESUBMIT"],
    }, {
      operationCode: "HISTORICAL_READ",
      actionIds: ["DGV-ACT-VIEW-OLD-SCHOOL-RESTRICTED-HISTORY"],
    }, {
      operationCode: "LEGAL_EXPORT",
      actionIds: [
        "DGV-ACT-REQUEST-EXPORT",
        "DGV-ACT-APPROVE-EXPORT",
        "DGV-ACT-DENY-EXPORT",
        "DGV-ACT-GENERATE-EXPORT",
        "DGV-ACT-COMPLETE-EXPORT",
        "DGV-ACT-FAIL-EXPORT",
        "DGV-ACT-EXPIRE-EXPORT",
        "DGV-ACT-DOWNLOAD-ROLE-BOUND-FILE",
      ],
    }, {
      operationCode: "TRANSFER",
      actionIds: [
        "DGV-ACT-REQUEST-STUDENT-TRANSFER",
        "DGV-ACT-AUTHORIZE-STUDENT-TRANSFER",
        "DGV-ACT-FREEZE-STUDENT-TRANSFER",
        "DGV-ACT-EXECUTE-STUDENT-TRANSFER",
        "DGV-ACT-DENY-STUDENT-TRANSFER",
      ],
    }, {
      operationCode: "DELETION",
      actionIds: [
        "ACC-ACT-REQUEST-IDENTITY-DELETION",
        "ACC-ACT-FREEZE-IDENTITY-DELETION",
        "ACC-ACT-RESUME-IDENTITY-DELETION",
        "ACC-ACT-COMPLETE-IDENTITY-DELETION",
      ],
    }, {
      operationCode: "SECURITY_SUPPORT",
      actionIds: ["PLAT-ACT-CREATE-SUPPORT-CASE", "PLAT-ACT-USE-SUPPORT-ACCESS"],
    }],
    continuingDataRightsBasis: "LAW_AND_CONTRACT",
    finiteWindowsRequired: true,
    unlimitedFreeFullServiceAfterTermination: false,
  },
  pages: [
    page(
      "PLAT-PAGE-SCHOOL-SERVICE-OPERATIONS",
      "Web School Service and Support Access Workspace",
      platformObjects
        .filter(({ id }) => id !== "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY")
        .map(({ id }) => id),
      platformObjects
        .filter(({ id }) => id !== "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY")
        .flatMap(({ fields }) => fields.map(({ id }) => id)),
      platformActions
        .filter(({ value }) => value.executionMode === "USER_TASK")
        .map(({ value }) => value.id),
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

const phaseTwoEntitlementObjects = [
  domainObject({
    id: "PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT",
    label: "Planned School-wide Phase-two Core Entitlement",
    identityFieldId: "PLAT-P2ENT-F-ID",
    responsibility: platformCommercialGovernance,
    states: ["DRAFT", "CONFIRMED", "ACTIVE", "RESTRICTED"],
    fields: phaseTwoEntitlementFields,
    sensitivityId: "S3",
    lifecyclePolicyId: "LIFE-001",
    overrides: {
      lineageBindings: [{
        refFieldId: "PLAT-P2ENT-F-SCHOOL-REF",
        versionFieldId: "PLAT-P2ENT-F-SCHOOL-VERSION",
        targetObjectId: "ACC-OBJ-SCHOOL",
        targetVersionFieldId: "ACC-SCHOOL-F-SCHOOL-VERSION",
      }, {
        refFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-REF",
        versionFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
        targetVersionFieldId: "PLAT-PLAN-F-VERSION",
      }, {
        refFieldId: "PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-REF",
        versionFieldId: "PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-VERSION",
        targetObjectId: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY",
        targetVersionFieldId: "PLAT-COMM-F-VERSION",
      }],
    },
  }),
];

const phaseTwoEntitlementActions = [
  action({
    id: "PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT",
    label: "Create a Planned School-wide Phase-two Core Entitlement",
    targetObjectId: "PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT",
    operationKind: "CREATE",
    inputFieldIds: [
      "PLAT-P2ENT-F-SCHOOL-REF",
      "PLAT-P2ENT-F-SCHOOL-VERSION",
      "PLAT-P2ENT-F-SERVICE-PLAN-REF",
      "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
      "PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-REF",
      "PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-VERSION",
    ],
    outputFieldIds: [
      "PLAT-P2ENT-F-ID",
      "PLAT-P2ENT-F-CORE-AI-ENTITLEMENTS",
      "PLAT-P2ENT-F-PACKAGE-EXPANSION-SCOPE",
      "PLAT-P2ENT-F-STATUS",
      "PLAT-P2ENT-F-VERSION",
    ],
    permissions: platformCommercialPermissions,
    clients: [CLIENT.WEB],
    successState: "DRAFT",
    risk: RISK.HIGH,
    extras: {
      relatedStateGuards: [{
        refFieldId: "PLAT-P2ENT-F-SCHOOL-REF",
        versionFieldId: "PLAT-P2ENT-F-SCHOOL-VERSION",
        targetObjectId: "ACC-OBJ-SCHOOL",
        requiredState: "ACTIVE",
      }, {
        refFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-REF",
        versionFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
        requiredState: "ACTIVE",
      }, {
        refFieldId: "PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-REF",
        versionFieldId: "PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-VERSION",
        targetObjectId: "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY",
        requiredState: "ACTIVE",
      }],
    },
  }),
  action({
    id: "PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT",
    label: "Confirm the Planned School-wide Phase-two Core Entitlement",
    targetObjectId: "PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT",
    operationKind: "UPDATE",
    outputFieldIds: ["PLAT-P2ENT-F-STATUS", "PLAT-P2ENT-F-VERSION"],
    permissions: schoolCommercialConfirmationPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "DRAFT", to: "CONFIRMED" },
    risk: RISK.HIGH,
  }),
  action({
    id: "PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT",
    label: "Activate a Confirmed School-wide Phase-two Core Entitlement",
    targetObjectId: "PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT",
    operationKind: "UPDATE",
    inputFieldIds: [
      "PLAT-P2ENT-F-SERVICE-PLAN-REF",
      "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
    ],
    outputFieldIds: ["PLAT-P2ENT-F-STATUS", "PLAT-P2ENT-F-VERSION"],
    permissions: platformCommercialPermissions,
    clients: [CLIENT.WEB],
    transition: { from: "CONFIRMED", to: "ACTIVE" },
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "SERVICE_PLAN_NOT_ACTIVE",
      "SCHOOL_SCOPE_MISMATCH",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
    ],
    extras: {
      relatedStateGuards: [{
        refFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-REF",
        versionFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
        requiredState: "ACTIVE",
      }],
      phaseTwoEntitlementActivationGuard: {
        entitledSchoolRefFieldId: "PLAT-P2ENT-F-SCHOOL-REF",
        servicePlanSchoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
        commercialBoundarySchoolRefFieldId: "PLAT-COMM-F-SCHOOL-REF",
        exactPinnedServicePlanVersionRequired: true,
        allSchoolIdentitiesMustMatch: true,
        requiredCoreEntitlementCodes: ["CORE_AI_ASSESSMENT", "MINIMUM_VIDEO_HELP"],
        failureResult: "SCHOOL_SCOPE_MISMATCH",
      },
    },
  }),
  action({
    id: "PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT",
    label: "Resolve the Exact Active School Phase-two Entitlement",
    targetObjectId: "PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT",
    operationKind: "READ",
    inputFieldIds: [
      "PLAT-P2ENT-F-SCHOOL-REF",
      "PLAT-P2ENT-F-SCHOOL-VERSION",
    ],
    outputFieldIds: [
      "PLAT-P2ENT-F-ID",
      "PLAT-P2ENT-F-SCHOOL-REF",
      "PLAT-P2ENT-F-SCHOOL-VERSION",
      "PLAT-P2ENT-F-SERVICE-PLAN-REF",
      "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
      "PLAT-P2ENT-F-CORE-AI-ENTITLEMENTS",
      "PLAT-P2ENT-F-STATUS",
      "PLAT-P2ENT-F-VERSION",
    ],
    permissions: permissions(
      "SYSTEM",
      ["CURRENT_ACTOR", "ROLE-PLATFORM-OPS"],
      "the system resolves exactly one ACTIVE phase-two entitlement for the school derived from the pinned service object",
    ),
    failureResults: [
      "PHASE_TWO_ENTITLEMENT_INACTIVE",
      "PHASE_TWO_SERVICE_PLAN_NOT_ACTIVE",
      "SERVICE_CONTINUITY_NOT_PROTECTED",
      "ENTITLEMENT_DECISION_UNAVAILABLE",
      "SCHOOL_SCOPE_MISMATCH",
    ],
    extras: {
      executionMode: "FLOW_INTERNAL",
      trigger: { kind: "FLOW", flowIds: ["DF-006"] },
      relatedStateGuards: [{
        refFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-REF",
        versionFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
        requiredState: "ACTIVE",
      }],
      activeEntitlementSelectionGuard: {
        schoolRefFieldId: "PLAT-P2ENT-F-SCHOOL-REF",
        schoolVersionFieldId: "PLAT-P2ENT-F-SCHOOL-VERSION",
        statusFieldId: "PLAT-P2ENT-F-STATUS",
        requiredState: "ACTIVE",
        versionFieldId: "PLAT-P2ENT-F-VERSION",
        maximumMatches: 1,
        selectionRule: "EXACT_SCHOOL_AND_ACTIVE_PHASE_TWO_ENTITLEMENT_VERSION",
        requestSchoolResolution: "PINNED_SERVICE_OBJECT_SCHOOL",
        zeroMatchResult: "PHASE_TWO_ENTITLEMENT_INACTIVE",
        ambiguousMatchResult: "ENTITLEMENT_DECISION_UNAVAILABLE",
        missingOrAmbiguousBehavior: "FAIL_CLOSED",
        sourceServicePlanRevalidation: phaseTwoServicePlanRevalidation({
          allowProtectedPublishedActivity: true,
        }),
      },
    },
  }),
  action({
    id: PHASE_TWO_ENTITLEMENT_RESTRICTION_ACTION_ID,
    label: "Restrict the Phase-two Entitlement Bound to a Restricted Service Plan",
    targetObjectId: "PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT",
    operationKind: "UPDATE",
    inputFieldIds: [
      "PLAT-P2ENT-F-SERVICE-PLAN-REF",
      "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
    ],
    outputFieldIds: ["PLAT-P2ENT-F-STATUS", "PLAT-P2ENT-F-VERSION"],
    permissions: permissions(
      "SYSTEM",
      ["CURRENT_ACTOR", "ROLE-PLATFORM-OPS"],
      "the exact ACTIVE entitlement pinned to the service-plan identity and pre-restriction version is restricted after the committed plan restriction event",
    ),
    transition: { from: "ACTIVE", to: "RESTRICTED" },
    risk: RISK.HIGH,
    failureResults: [
      "PERMISSION_DENIED",
      "SERVICE_PLAN_RESTRICTION_EVENT_INVALID",
      "SERVICE_PLAN_SOURCE_VERSION_MISMATCH",
      "PHASE_TWO_ENTITLEMENT_SOURCE_AMBIGUOUS",
      "VERSION_CONFLICT",
    ],
    extras: {
      executionMode: "SYSTEM_EVENT",
      trigger: { kind: "EVENT", eventId: PHASE_TWO_SERVICE_PLAN_RESTRICTED_EVENT_ID },
      relatedStateGuards: [{
        refFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-REF",
        versionFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
        targetObjectId: "PLAT-OBJ-SERVICE-PLAN",
        requiredStates: ["ACTIVE", "RESTRICTED"],
      }],
      entitlementRestrictionPropagationGuard: {
        eventId: PHASE_TWO_SERVICE_PLAN_RESTRICTED_EVENT_ID,
        entitlementServicePlanRefFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-REF",
        entitlementServicePlanVersionFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
        entitlementSchoolRefFieldId: "PLAT-P2ENT-F-SCHOOL-REF",
        sourceServicePlanIdentityFieldId: "PLAT-PLAN-F-ID",
        sourceServicePlanVersionFieldId: "PLAT-PLAN-F-VERSION",
        sourceServicePlanStateFieldId: "PLAT-PLAN-F-SERVICE-STATE",
        sourceServicePlanSchoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
        requiredSourceState: "RESTRICTED",
        entitlementPinnedVersionMustEqualEventPriorVersion: true,
        eventResultingVersionMustBeNewer: true,
        schoolMustMatch: true,
        maximumActiveMatches: 1,
        zeroMatchEffect: "IDEMPOTENT_NO_OP",
        duplicateEffect: "RETURN_EXISTING_RESTRICTED_ENTITLEMENT",
        ambiguityEffect: "FAIL_CLOSED",
        sourceVersionMismatchResult: "SERVICE_PLAN_SOURCE_VERSION_MISMATCH",
        ambiguityResult: "PHASE_TWO_ENTITLEMENT_SOURCE_AMBIGUOUS",
      },
      nonFailureNoOpResults: ["NO_ACTIVE_PHASE_TWO_ENTITLEMENT"],
    },
  }),
];

const phaseTwoEntitlementModule = moduleFact({
  id: "PLAT-002",
  phase: PHASE.SECOND,
  releaseStatus: RELEASE_STATUS.PLANNED,
  priority: "P1",
  title: "Planned School-wide AI Assessment and Minimum Video Entitlement",
  objective: "Define the second-stage school-wide minimum AI assessment and teaching-video guarantee without exposing it as a first-stage released capability",
  entryConditions: [
    "the school has an ACTIVE first-stage commercial boundary",
    "the product enters the second-stage service release",
  ],
  exitConditions: [
    "every second-stage school receives both core AI assessment and minimum video help",
    "package expansion remains limited to capacity, concurrency, analytics, and general support",
  ],
  baselineDecisionIds: ["BASE-007"],
  productDecisionIds: ["D090"],
  nfrIds: ["NFR-003", "NFR-006", "NFR-008"],
  dependencyModuleIds: ["PLAT-001"],
  objects: phaseTwoEntitlementObjects,
  relationships: [],
  actionFacts: phaseTwoEntitlementActions,
  phaseTwoEntitlementContract: {
    objectId: "PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT",
    schoolRefFieldId: "PLAT-P2ENT-F-SCHOOL-REF",
    servicePlanObjectId: "PLAT-OBJ-SERVICE-PLAN",
    servicePlanRefFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-REF",
    servicePlanVersionFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
    requiredServicePlanState: "ACTIVE",
    coreEntitlements: ["CORE_AI_ASSESSMENT", "MINIMUM_VIDEO_HELP"],
    packageExpansionScope: ["CAPACITY", "CONCURRENCY", "ANALYTICS", "GENERAL_SUPPORT"],
    schoolWideGuarantee: true,
    studentOrGuardianPaymentAllowed: false,
    coreLearningLoopPaywallAllowed: false,
    activationActionId: "PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT",
    resolveActiveActionId: "PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT",
    sourceServicePlanRevalidationRule:
      "EVERY_RESOLVER_AND_CORE_CONSUMER_REVALIDATES_THE_ENTITLEMENT_PINNED_CURRENT_SERVICE_PLAN_VERSION_AT_EXECUTION_WITH_ONLY_EXACT_FINITE_D091_PUBLISHED_ACTIVITY_FALLBACK",
    protectedContinuityConsumerActionIds: ["GRD-ACT-PROCESS"],
    strictActivePlanConsumerActionIds: [
      "PROG-ACT-SYNC-STUDENT-TARGET",
      "VIDEO-ACT-ENSURE-STUDENT-MINIMUM-ENTITLEMENT",
      "VIDEO-ACT-ENSURE-SCHOOL-OVERFLOW-POOL",
    ],
    restrictionPropagation: {
      sourceActionId: "PLAT-ACT-RESTRICT-SERVICE-PLAN",
      eventId: PHASE_TWO_SERVICE_PLAN_RESTRICTED_EVENT_ID,
      targetActionId: PHASE_TWO_ENTITLEMENT_RESTRICTION_ACTION_ID,
      flowId: PHASE_TWO_ENTITLEMENT_RESTRICTION_FLOW_ID,
      sourceState: "RESTRICTED",
      targetState: "RESTRICTED",
      eventOutboxAtomicWithSourceTransition: true,
      entitlementReactivationAllowed: false,
      recoveryRequiresNewEntitlementForNewActivePlan: true,
    },
    consumerBindings: [{
      entitlementCode: "CORE_AI_ASSESSMENT",
      actionIds: ["GRD-ACT-PROCESS", "PROG-ACT-SYNC-STUDENT-TARGET"],
    }, {
      entitlementCode: "MINIMUM_VIDEO_HELP",
      actionIds: [
        "VIDEO-ACT-ENSURE-STUDENT-MINIMUM-ENTITLEMENT",
        "VIDEO-ACT-ENSURE-SCHOOL-OVERFLOW-POOL",
      ],
    }],
    consumerRule: "EVERY_CORE_CONSUMER_PINS_ONE_EXACT_ACTIVE_SAME_SCHOOL_ENTITLEMENT_VERSION",
  },
  pages: [{
    ...page(
      "PLAT-PAGE-PHASE-TWO-ENTITLEMENT",
      "Planned School-wide Phase-two Entitlement Workspace",
      phaseTwoEntitlementObjects.map(({ id }) => id),
      phaseTwoEntitlementObjects.flatMap(({ fields }) => fields.map(({ id }) => id)),
      phaseTwoEntitlementActions
        .map(({ value }) => value.id)
        .filter((actionId) => ![
          "PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT",
          PHASE_TWO_ENTITLEMENT_RESTRICTION_ACTION_ID,
        ].includes(actionId)),
      [CLIENT.WEB],
    ),
    availability: RELEASE_STATUS.PLANNED,
  }],
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
  phaseTwoEntitlementModule,
  reportModule,
]);

export const extensionEvents = deepFreeze([
  {
    id: "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-REQUESTED",
    label: "Protected activity capture requested",
    definition: "A fixed eligible-set count and digest exists and missing immutable protected entries may be captured while the restriction remains ineffective.",
    producerActionIds: [
      "PLAT-ACT-OPEN-SERVICE-CONTINUITY",
      "PLAT-ACT-RETRY-PROTECTED-ACTIVITY-CAPTURE",
    ],
    triggeredActionIds: ["PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY"],
    captureAttemptContextContract: {
      contextKeys: ["captureAttemptEpoch", "expectedContinuityVersion"],
      producerBindings: [{
        actionId: "PLAT-ACT-OPEN-SERVICE-CONTINUITY",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }, {
        actionId: "PLAT-ACT-RETRY-PROTECTED-ACTIVITY-CAPTURE",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }],
      consumerBindings: [{
        actionId: "PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY",
        attemptEpochFieldId: "PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-PROTECT-F-EXPECTED-CONTINUITY-VERSION",
      }],
      consumerCasGuardProperty: "captureAttemptCasGuard",
      staleEventResult: "STALE_EVENT_IGNORED",
      staleEventEffect: "IDEMPOTENT_NO_OP",
    },
  },
  {
    id: "EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-RECONCILE-REQUESTED",
    label: "Protected activity manifest reconciliation requested",
    definition: "The system recomputes the captured set from distinct immutable entries and attempts an exact count-and-digest seal; an incomplete set remains CAPTURING.",
    producerActionIds: [
      "PLAT-ACT-OPEN-SERVICE-CONTINUITY",
      "PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY",
      "PLAT-ACT-RETRY-PROTECTED-ACTIVITY-CAPTURE",
    ],
    triggeredActionIds: ["PLAT-ACT-RECONCILE-AND-SEAL-PROTECTED-ACTIVITY-MANIFEST"],
    captureAttemptContextContract: {
      contextKeys: ["captureAttemptEpoch", "expectedContinuityVersion"],
      producerBindings: [{
        actionId: "PLAT-ACT-OPEN-SERVICE-CONTINUITY",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }, {
        actionId: "PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY",
        attemptEpochFieldId: "PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-PROTECT-F-EXPECTED-CONTINUITY-VERSION",
      }, {
        actionId: "PLAT-ACT-RETRY-PROTECTED-ACTIVITY-CAPTURE",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }],
      consumerBindings: [{
        actionId: "PLAT-ACT-RECONCILE-AND-SEAL-PROTECTED-ACTIVITY-MANIFEST",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }],
      consumerCasGuardProperty: "captureAttemptCasGuard",
      staleEventResult: "STALE_EVENT_IGNORED",
      staleEventEffect: "IDEMPOTENT_NO_OP",
    },
  },
  {
    id: "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-FAILED",
    label: "Protected activity capture failed after retry disposition",
    definition: "A non-retryable capture failure or exhausted retry budget is recorded; duplicate at-least-once delivery never emits this event.",
    producerActionIds: [
      "PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY",
      "PLAT-ACT-RECONCILE-AND-SEAL-PROTECTED-ACTIVITY-MANIFEST",
    ],
    triggeredActionIds: ["PLAT-ACT-MARK-PROTECTED-ACTIVITY-CAPTURE-FAILED"],
    captureAttemptContextContract: {
      contextKeys: ["captureAttemptEpoch", "expectedContinuityVersion"],
      producerBindings: [{
        actionId: "PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY",
        attemptEpochFieldId: "PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-PROTECT-F-EXPECTED-CONTINUITY-VERSION",
      }, {
        actionId: "PLAT-ACT-RECONCILE-AND-SEAL-PROTECTED-ACTIVITY-MANIFEST",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }],
      consumerBindings: [{
        actionId: "PLAT-ACT-MARK-PROTECTED-ACTIVITY-CAPTURE-FAILED",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }],
      consumerCasGuardProperty: "captureAttemptCasGuard",
      staleEventResult: "STALE_EVENT_IGNORED",
      staleEventEffect: "IDEMPOTENT_NO_OP",
      staleFailureStateWriteAllowed: false,
    },
  },
  {
    id: "EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-SEALED",
    label: "Protected activity manifest sealed and restriction activated",
    definition: "Expected and captured counts plus canonical digests match exactly, the manifest is SEALED, and the restriction becomes effective at the same atomic timestamp.",
    producerActionIds: ["PLAT-ACT-RECONCILE-AND-SEAL-PROTECTED-ACTIVITY-MANIFEST"],
    captureAttemptContextContract: {
      contextKeys: ["captureAttemptEpoch", "expectedContinuityVersion"],
      producerBindings: [{
        actionId: "PLAT-ACT-RECONCILE-AND-SEAL-PROTECTED-ACTIVITY-MANIFEST",
        attemptEpochFieldId: "PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH",
        expectedContinuityVersionFieldId: "PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION",
      }],
      consumerBindings: [],
      staleEventResult: "STALE_EVENT_IGNORED",
      staleEventEffect: "IDEMPOTENT_NO_OP",
    },
  },
  {
    id: "EVT-PLAT-SERVICE-EXIT-WINDOW-OPENED",
    label: "Service exit window opened for an exact active plan version",
    definition: "The protected-activity window has ended, the explicit exit window is open, and the exact pinned ACTIVE service-plan version must become RESTRICTED before the continuity window may close.",
    producerActionIds: ["PLAT-ACT-ENTER-EXIT-WINDOW"],
    triggeredActionIds: ["PLAT-ACT-RESTRICT-SERVICE-PLAN"],
    servicePlanTransitionContextContract: {
      contextKeys: [
        "servicePlanId",
        "servicePlanVersion",
        "continuityId",
        "continuityVersion",
        "restrictionReason",
        "restrictionEffectiveAt",
      ],
      producerBindings: [{
        actionId: "PLAT-ACT-ENTER-EXIT-WINDOW",
        servicePlanRefFieldId: "PLAT-CONT-F-SERVICE-PLAN-REF",
        servicePlanVersionFieldId: "PLAT-CONT-F-SERVICE-PLAN-VERSION",
        continuityIdentityFieldId: "PLAT-CONT-F-ID",
        continuityVersionFieldId: "PLAT-CONT-F-VERSION",
        restrictionReasonFieldId: "PLAT-CONT-F-RESTRICTION-REASON",
        restrictionEffectiveAtFieldId: "PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT",
      }],
      consumerBindings: [{
        actionId: "PLAT-ACT-RESTRICT-SERVICE-PLAN",
        continuityRefFieldId: "PLAT-PLAN-F-CONTINUITY-REF",
        continuityVersionFieldId: "PLAT-PLAN-F-CONTINUITY-VERSION",
        restrictionReasonFieldId: "PLAT-PLAN-F-RESTRICTION-REASON",
        restrictionEffectiveAtFieldId: "PLAT-PLAN-F-RESTRICTION-EFFECTIVE-AT",
      }],
      exactPinnedPlanVersionRequired: true,
      staleVersionEffect: "FAIL_CLOSED",
    },
  },
  {
    id: PHASE_TWO_SERVICE_PLAN_RESTRICTED_EVENT_ID,
    label: "Service plan restricted and dependent phase-two entitlement restriction requested",
    definition: "The exact ACTIVE service-plan identity and pre-transition version has committed RESTRICTED with an atomic outbox event; any ACTIVE phase-two entitlement pinned to that prior version must become RESTRICTED and cannot be revived.",
    producerActionIds: ["PLAT-ACT-RESTRICT-SERVICE-PLAN"],
    triggeredActionIds: [PHASE_TWO_ENTITLEMENT_RESTRICTION_ACTION_ID],
    servicePlanRestrictionPropagationContract: {
      contextKeys: [
        "servicePlanId",
        "priorServicePlanVersion",
        "resultingServicePlanVersion",
        "schoolRef",
        "resultingServicePlanState",
      ],
      producerBindings: [{
        actionId: "PLAT-ACT-RESTRICT-SERVICE-PLAN",
        servicePlanIdentityFieldId: "PLAT-PLAN-F-ID",
        priorServicePlanVersionSource: "TRANSITION_EXPECTED_VERSION",
        resultingServicePlanVersionFieldId: "PLAT-PLAN-F-VERSION",
        schoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
        resultingStateFieldId: "PLAT-PLAN-F-SERVICE-STATE",
      }],
      consumerBindings: [{
        actionId: PHASE_TWO_ENTITLEMENT_RESTRICTION_ACTION_ID,
        entitlementServicePlanRefFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-REF",
        entitlementServicePlanVersionFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
        entitlementSchoolRefFieldId: "PLAT-P2ENT-F-SCHOOL-REF",
      }],
      exactServicePlanIdentityRequired: true,
      entitlementPinnedVersionMustEqualPriorServicePlanVersion: true,
      resultingServicePlanState: "RESTRICTED",
      eventOutboxAtomicWithSourceTransition: true,
      staleOrAmbiguousEffect: "FAIL_CLOSED",
      zeroActiveEntitlementEffect: "IDEMPOTENT_NO_OP",
    },
  },
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
export const extensionFlows = deepFreeze([{
  id: PHASE_TWO_ENTITLEMENT_RESTRICTION_FLOW_ID,
  label: "Restricted Service Plan to Irreversibly Restricted Phase-two Entitlement",
  phase: PHASE.SECOND,
  contractProfile: "GENERIC",
  routingPolicy: "NONE",
  moduleIds: ["PLAT-001", "PLAT-002"],
  steps: [{
    order: 1,
    actionId: "PLAT-ACT-RESTRICT-SERVICE-PLAN",
    condition: "the D091 protected-activity window has ended, the exit window is open, and the exact ACTIVE service-plan version can commit its restriction event outbox atomically",
    providedInputs: [
      "PLAT-PLAN-F-CONTINUITY-REF",
      "PLAT-PLAN-F-CONTINUITY-VERSION",
      "PLAT-PLAN-F-RESTRICTION-REASON",
    ].map((fieldId) => ({ fieldId, provider: { actorRef: "SYSTEM" } })),
  }, {
    order: 2,
    actionId: PHASE_TWO_ENTITLEMENT_RESTRICTION_ACTION_ID,
    condition: "the committed event resolves at most one ACTIVE same-school entitlement pinned to the service plan's exact pre-restriction version",
    providedInputs: [
      "PLAT-P2ENT-F-SERVICE-PLAN-REF",
      "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
    ].map((fieldId) => ({ fieldId, provider: { actorRef: "SYSTEM" } })),
  }],
  sourceDataRefs: [
    {
      objectId: "PLAT-OBJ-SERVICE-PLAN",
      fieldId: "PLAT-PLAN-F-ID",
      version: "PLAT-PLAN-F-VERSION",
      cardinality: "ONE",
    },
    {
      objectId: "PLAT-OBJ-SERVICE-PLAN",
      fieldId: "PLAT-PLAN-F-SCHOOL-REF",
      version: "PLAT-PLAN-F-VERSION",
      cardinality: "ONE",
    },
    {
      objectId: "PLAT-OBJ-SERVICE-PLAN",
      fieldId: "PLAT-PLAN-F-SERVICE-STATE",
      version: "PLAT-PLAN-F-VERSION",
      cardinality: "ONE",
    },
  ],
  targetDataRefs: [{
    objectId: "PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT",
    fieldId: "PLAT-P2ENT-F-STATUS",
    version: "PLAT-P2ENT-F-VERSION",
  }, {
    objectId: "PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT",
    fieldId: "PLAT-P2ENT-F-VERSION",
    version: "PLAT-P2ENT-F-VERSION",
  }],
  idempotencyKeyParts: {
    identityFieldIds: ["PLAT-PLAN-F-ID"],
    versionFieldIds: ["PLAT-PLAN-F-VERSION"],
    fanoutFieldId: "PLAT-PLAN-F-SCHOOL-REF",
  },
  failureGranularity: "ONE_SERVICE_PLAN_RESTRICTION_VERSION_AND_ITS_EXACT_ACTIVE_PHASE_TWO_ENTITLEMENT",
  retryPolicy: {
    strategy: "REDELIVER_THE_COMMITTED_RESTRICTION_EVENT_AND_REVALIDATE_THE_EXACT_SOURCE_VERSION",
    maxAttempts: 8,
    retryableFailureResults: ["VERSION_CONFLICT"],
  },
  compensation: {
    strategy: "NEVER_REACTIVATE_THE_RESTRICTED_SERVICE_PLAN_OR_ENTITLEMENT",
    description: "an outbox failure leaves the plan ACTIVE and uncommitted; a downstream failure keeps the plan RESTRICTED, blocks new or non-protected consumers through synchronous source-plan revalidation, preserves only exact finite D091 published-activity completion, and retries entitlement restriction idempotently",
  },
  downstreamInvalidation: {
    strategy: "BLOCK_NEW_OR_NON_PROTECTED_PHASE_TWO_CONSUMPTION_AFTER_THE_FINITE_D091_BRANCH_CLOSES",
    targets: [
      "AI assessment processing outside an exact protected published-activity entry and finite window",
      "student progress target creation",
      "student minimum video entitlement creation",
      "school video overflow pool creation",
    ],
  },
  phaseTwoEntitlementRestrictionFlowContract: {
    producerActionId: "PLAT-ACT-RESTRICT-SERVICE-PLAN",
    eventId: PHASE_TWO_SERVICE_PLAN_RESTRICTED_EVENT_ID,
    consumerActionId: PHASE_TWO_ENTITLEMENT_RESTRICTION_ACTION_ID,
    entitlementReactivationAllowed: false,
    consumerFailureRestoresServicePlan: false,
    exactDuplicateCreatesAdditionalTransition: false,
    conflictingDuplicateEffect: "FAIL_CLOSED",
  },
}]);
export const extensionAiTasks = deepFreeze([]);
