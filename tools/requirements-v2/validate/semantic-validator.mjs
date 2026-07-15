import { buildModelIndex } from "./model-validator.mjs";
import { formatValidationValue } from "./structure-validator.mjs";
import { resolveStudentDataClassification } from "../facts/student-data-classification.mjs";
import {
  STUDENT_DETAIL_ACCESS_EXCEPTION_KIND,
  resolveStudentDetailAccessException,
} from "../facts/student-detail-access-exceptions.mjs";
import {
  isProfessionalWriteAuthorizationBoundary,
  isProfessionalWritePolicy,
  isRegisteredProfessionalWriteAction,
  isRegisteredProfessionalWriteObject,
  matchesRegisteredProfessionalWriteException,
  resolveProfessionalWriteException,
} from "../facts/professional-write-authorization.mjs";

const FORBIDDEN_ACTION_NAMES = new Set([
  "对象查询与范围筛选",
  "详情查看与版本追踪",
  "创建/修改/确认主动作",
  "AI 对话与草稿/执行",
  "审计、通知与下游失效",
]);

const FORBIDDEN_PAGE_NAMES = new Set([
  "列表/工作台",
  "详情/处理页",
  "预览/确认页",
  "历史/审计页",
]);

const MIXED_CREATE_SEMANTICS = /(?:\bupdate\b|\bmaintain\b|\bsave\b|\breorder\b|\bupsert\b|\bmerge\b|(?:^|-)manage(?:-|$)|合并写入|存在则更新)/i;

const METRIC_EVENT_COUNTS = new Map([
  ["duration", 2],
  ["ratio", 2],
  ["conversion", 2],
  ["count", 1],
  ["boolean", 1],
]);

const EXTENSION_EXECUTABLE_KEYS = [
  "pageIds",
  "actionIds",
  "pages",
  "actions",
  "flows",
  "moduleIds",
  "aiTasks",
  "routes",
  "commands",
  "page",
  "action",
  "pageId",
  "actionId",
];

const PERIODIC_REPORT_ACTION_IDS = new Set([
  "RPT-ACT-CREATE-SUBSCRIPTION",
  "RPT-ACT-CREATE-HOMEROOM-SUBSCRIPTION",
  "RPT-ACT-CREATE-ACADEMIC-SUBSCRIPTION",
  "RPT-ACT-UPDATE-SUBSCRIPTION",
  "RPT-ACT-PAUSE-SUBSCRIPTION",
  "RPT-ACT-CANCEL-SUBSCRIPTION",
]);

const TASK8_MODULE_MANIFEST = new Map([
  ["PREP-001", {
    objectIds: [
      "PREP-OBJ-LESSON-PLAN",
      "PREP-OBJ-MATERIAL-REF",
      "PREP-OBJ-CLASSROOM-ACTIVITY",
      "PREP-OBJ-ASSIGNMENT-DRAFT",
    ],
    actionTargets: [
      ["PREP-ACT-CREATE-LESSON-PLAN", "PREP-OBJ-LESSON-PLAN"],
      ["PREP-ACT-CONFIRM-LESSON-PLAN", "PREP-OBJ-LESSON-PLAN"],
      ["PREP-ACT-REFERENCE-MATERIAL", "PREP-OBJ-MATERIAL-REF"],
      ["PREP-ACT-VERIFY-MATERIAL-LICENSE", "PREP-OBJ-MATERIAL-REF"],
      ["PREP-ACT-PLAN-CLASSROOM-ACTIVITY", "PREP-OBJ-CLASSROOM-ACTIVITY"],
      ["PREP-ACT-RECORD-CLASSROOM-ACTIVITY", "PREP-OBJ-CLASSROOM-ACTIVITY"],
      ["PREP-ACT-GENERATE-ASSIGNMENT-DRAFT", "PREP-OBJ-ASSIGNMENT-DRAFT"],
      ["PREP-ACT-COMPLETE-ASSIGNMENT-DRAFT", "PREP-OBJ-ASSIGNMENT-DRAFT"],
      ["PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF", "PREP-OBJ-ASSIGNMENT-DRAFT"],
    ],
    pageIds: ["PREP-PAGE-LESSON-WORKSPACE", "PREP-PAGE-MOBILE-CLASSROOM"],
  }],
  ["CONTENT-001", {
    objectIds: [
      "CONTENT-OBJ-QUESTION-VERSION",
      "CONTENT-OBJ-LICENSE",
      "CONTENT-OBJ-PERMISSION",
    ],
    actionTargets: [
      ["CONTENT-ACT-CREATE-QUESTION-VERSION", "CONTENT-OBJ-QUESTION-VERSION"],
      ["CONTENT-ACT-PUBLISH-QUESTION-VERSION", "CONTENT-OBJ-QUESTION-VERSION"],
      ["CONTENT-ACT-CREATE-LICENSE", "CONTENT-OBJ-LICENSE"],
      ["CONTENT-ACT-ACTIVATE-LICENSE", "CONTENT-OBJ-LICENSE"],
      ["CONTENT-ACT-CREATE-SCHOOL-PERMISSION", "CONTENT-OBJ-PERMISSION"],
      ["CONTENT-ACT-CREATE-SUBJECT-PERMISSION", "CONTENT-OBJ-PERMISSION"],
      ["CONTENT-ACT-CREATE-COURSE-PERMISSION", "CONTENT-OBJ-PERMISSION"],
      ["CONTENT-ACT-ACTIVATE-PERMISSION", "CONTENT-OBJ-PERMISSION"],
    ],
    pageIds: ["CONTENT-PAGE-GOVERNANCE"],
  }],
  ["EXM-001", {
    objectIds: [
      "EXM-OBJ-EXAM-EVENT",
      "EXM-OBJ-SCORE-IMPORT",
      "EXM-OBJ-AGGREGATE-RULE",
      "EXM-OBJ-SUBJECT-SCORE",
    ],
    actionTargets: [
      ["EXM-ACT-CREATE-EVENT", "EXM-OBJ-EXAM-EVENT"],
      ["EXM-ACT-PUBLISH-EVENT", "EXM-OBJ-EXAM-EVENT"],
      ["EXM-ACT-OPEN-CORRECTION", "EXM-OBJ-EXAM-EVENT"],
      ["EXM-ACT-IMPORT-SCORES", "EXM-OBJ-SCORE-IMPORT"],
      ["EXM-ACT-VALIDATE-SCORE-IMPORT", "EXM-OBJ-SCORE-IMPORT"],
      ["EXM-ACT-REJECT-SCORE-IMPORT", "EXM-OBJ-SCORE-IMPORT"],
      ["EXM-ACT-REVISE-REJECTED-IMPORT", "EXM-OBJ-SCORE-IMPORT"],
      ["EXM-ACT-ACCEPT-SCORE-IMPORT", "EXM-OBJ-SCORE-IMPORT"],
      ["EXM-ACT-CREATE-AGGREGATE-RULE", "EXM-OBJ-AGGREGATE-RULE"],
      ["EXM-ACT-ACTIVATE-AGGREGATE-RULE", "EXM-OBJ-AGGREGATE-RULE"],
      ["EXM-ACT-CREATE-SUBJECT-SCORE", "EXM-OBJ-SUBJECT-SCORE"],
      ["EXM-ACT-CONFIRM-SUBJECT-SCORE", "EXM-OBJ-SUBJECT-SCORE"],
      ["EXM-ACT-REJECT-SUBJECT-SCORE", "EXM-OBJ-SUBJECT-SCORE"],
      ["EXM-ACT-REVISE-REJECTED-SUBJECT-SCORE", "EXM-OBJ-SUBJECT-SCORE"],
      ["EXM-ACT-PUBLISH-SUBJECT-SCORE", "EXM-OBJ-SUBJECT-SCORE"],
      ["EXM-ACT-CORRECT-SUBJECT-SCORE", "EXM-OBJ-SUBJECT-SCORE"],
      ["EXM-ACT-REPUBLISH-CORRECTED-SCORE", "EXM-OBJ-SUBJECT-SCORE"],
      ["EXM-ACT-VIEW-PUBLISHED-SCORE", "EXM-OBJ-SUBJECT-SCORE"],
    ],
    pageIds: [
      "EXM-PAGE-ACADEMIC-OPERATIONS",
      "EXM-PAGE-MOBILE-ACADEMIC-REVIEW",
      "EXM-PAGE-STUDENT-PUBLISHED-SCORE",
    ],
  }],
  ["SCH-001", {
    objectIds: [
      "SCH-OBJ-CALENDAR",
      "SCH-OBJ-CONSTRAINT",
      "SCH-OBJ-CONSTRAINT-SNAPSHOT",
      "SCH-OBJ-CANDIDATE",
    ],
    actionTargets: [
      ["SCH-ACT-CREATE-CALENDAR", "SCH-OBJ-CALENDAR"],
      ["SCH-ACT-PUBLISH-CALENDAR", "SCH-OBJ-CALENDAR"],
      ["SCH-ACT-CREATE-TEACHER-AVAILABILITY-CONSTRAINT", "SCH-OBJ-CONSTRAINT"],
      ["SCH-ACT-CREATE-CLASS-PERIOD-CONSTRAINT", "SCH-OBJ-CONSTRAINT"],
      ["SCH-ACT-CREATE-COURSE-LOAD-CONSTRAINT", "SCH-OBJ-CONSTRAINT"],
      ["SCH-ACT-CREATE-ROOM-CAPACITY-CONSTRAINT", "SCH-OBJ-CONSTRAINT"],
      ["SCH-ACT-ACTIVATE-CONSTRAINT", "SCH-OBJ-CONSTRAINT"],
      ["SCH-ACT-CREATE-CONSTRAINT-SNAPSHOT", "SCH-OBJ-CONSTRAINT-SNAPSHOT"],
      ["SCH-ACT-ACTIVATE-CONSTRAINT-SNAPSHOT", "SCH-OBJ-CONSTRAINT-SNAPSHOT"],
      ["SCH-ACT-REPLACE-CONSTRAINT-SNAPSHOT", "SCH-OBJ-CONSTRAINT-SNAPSHOT"],
      ["SCH-ACT-GENERATE-CANDIDATE", "SCH-OBJ-CANDIDATE"],
      ["SCH-ACT-REVIEW-CONFLICTS", "SCH-OBJ-CANDIDATE"],
      ["SCH-ACT-CONFIRM-CANDIDATE", "SCH-OBJ-CANDIDATE"],
      ["SCH-ACT-PUBLISH-CANDIDATE", "SCH-OBJ-CANDIDATE"],
      ["SCH-ACT-MARK-CANDIDATE-STALE", "SCH-OBJ-CANDIDATE"],
    ],
    pageIds: ["SCH-PAGE-SCHEDULE-OPERATIONS", "SCH-PAGE-MOBILE-CONFLICT-REVIEW"],
  }],
  ["PLAT-001", {
    objectIds: [
      "PLAT-OBJ-ONBOARDING-CASE",
      "PLAT-OBJ-SERVICE-PLAN",
      "PLAT-OBJ-POLICY-TEMPLATE",
      "PLAT-OBJ-SUPPORT-CASE",
    ],
    actionTargets: [
      ["PLAT-ACT-CREATE-ONBOARDING-CASE", "PLAT-OBJ-ONBOARDING-CASE"],
      ["PLAT-ACT-CONFIRM-ONBOARDING-CASE", "PLAT-OBJ-ONBOARDING-CASE"],
      ["PLAT-ACT-CREATE-SERVICE-PLAN", "PLAT-OBJ-SERVICE-PLAN"],
      ["PLAT-ACT-CONFIRM-SERVICE-PLAN", "PLAT-OBJ-SERVICE-PLAN"],
      ["PLAT-ACT-ACTIVATE-SERVICE-PLAN", "PLAT-OBJ-SERVICE-PLAN"],
      ["PLAT-ACT-CREATE-POLICY-TEMPLATE", "PLAT-OBJ-POLICY-TEMPLATE"],
      ["PLAT-ACT-CONFIRM-POLICY-TEMPLATE", "PLAT-OBJ-POLICY-TEMPLATE"],
      ["PLAT-ACT-ACTIVATE-POLICY-TEMPLATE", "PLAT-OBJ-POLICY-TEMPLATE"],
      ["PLAT-ACT-CREATE-SUPPORT-CASE", "PLAT-OBJ-SUPPORT-CASE"],
      ["PLAT-ACT-CLOSE-SUPPORT-CASE", "PLAT-OBJ-SUPPORT-CASE"],
      ["PLAT-ACT-USE-SUPPORT-ACCESS", "PLAT-OBJ-SUPPORT-CASE"],
    ],
    pageIds: [
      "PLAT-PAGE-SCHOOL-SERVICE-OPERATIONS",
      "PLAT-PAGE-MOBILE-SUPPORT-CASE",
    ],
  }],
  ["REPORT-001", {
    objectIds: ["REPORT-OBJ-FUTURE-CONTRACT"],
    actionTargets: [],
    pageIds: [],
  }],
]);

const TASK8_OPTION_SET_IDS = Array.from(
  { length: 18 },
  (_, index) => `OPT-EXT-${String(index + 1).padStart(3, "0")}`,
);

const TASK8_EVENT_IDS = [
  "EVT-EXM-SCORE-PUBLISHED",
  "EVT-SCH-SOURCE-VERSION-CHANGED",
];

const ZHIXU_PRODUCTION_MARKER_MODULE_IDS = new Set([
  "ACC-001",
  "ORG-001",
  "IAM-001",
  "DGV-001",
  "AUD-001",
]);

const TASK8_BUSINESS_FAILURES = new Map([
  ["CONTENT-ACT-PUBLISH-QUESTION-VERSION", [
    "LICENSE_INACTIVE",
    "CONTENT_PERMISSION_INACTIVE",
  ]],
  ["EXM-ACT-VALIDATE-SCORE-IMPORT", ["IMPORT_REJECTED"]],
  ["EXM-ACT-ACCEPT-SCORE-IMPORT", ["IMPORT_REJECTED"]],
  ["EXM-ACT-CREATE-SUBJECT-SCORE", ["IMPORT_REJECTED"]],
  ["EXM-ACT-CONFIRM-SUBJECT-SCORE", ["SCORE_REJECTED"]],
  ["EXM-ACT-PUBLISH-SUBJECT-SCORE", [
    "SCORE_REJECTED",
    "TEACHER_CONFIRMATION_REQUIRED",
  ]],
  ["EXM-ACT-VIEW-PUBLISHED-SCORE", [
    "RESULT_NOT_PUBLISHED",
    "RESULT_NOT_VISIBLE",
  ]],
  ["SCH-ACT-GENERATE-CANDIDATE", ["SOURCE_VERSION_STALE"]],
  ["SCH-ACT-CONFIRM-CANDIDATE", [
    "HARD_CONSTRAINT_FAILED",
    "SOURCE_VERSION_STALE",
  ]],
  ["SCH-ACT-PUBLISH-CANDIDATE", ["SOURCE_VERSION_STALE"]],
  ["PREP-ACT-GENERATE-ASSIGNMENT-DRAFT", ["LESSON_STALE"]],
  ["PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF", [
    "LESSON_STALE",
    "HANDOFF_INCOMPLETE",
  ]],
  ["PLAT-ACT-CREATE-SUPPORT-CASE", [
    "ACCESS_INACTIVE",
    "ACCESS_EXPIRED",
    "ACCESS_OTHER_RECORD",
    "ACCESS_SCOPE_DENIED",
  ]],
  ["PLAT-ACT-USE-SUPPORT-ACCESS", [
    "ACCESS_INACTIVE",
    "ACCESS_EXPIRED",
    "ACCESS_OTHER_RECORD",
    "ACCESS_SCOPE_DENIED",
    "AUDIT_FAILED",
  ]],
]);

const TASK8_GENERIC_FAILURE_CODES = new Set([
  "PERMISSION_DENIED",
  "NOT_FOUND",
  "VALIDATION_FAILED",
  "VERSION_CONFLICT",
  "SOURCE_VERSION_STALE",
  "AUDIT_FAILED",
]);

const TASK8_BUSINESS_FAILURE_PREDICATES = new Map([
  ["CONTENT-ACT-PUBLISH-QUESTION-VERSION:LICENSE_INACTIVE", "license.state !== ACTIVE || license.version !== pinnedLicenseVersion"],
  ["CONTENT-ACT-PUBLISH-QUESTION-VERSION:CONTENT_PERMISSION_INACTIVE", "contentPermission.state !== ACTIVE || currentTime >= contentPermission.expiresAt || !contentPermission.covers(questionContext, currentActor)"],
  ["EXM-ACT-VALIDATE-SCORE-IMPORT:IMPORT_REJECTED", "blockingImportValidationErrors.length > 0"],
  ["EXM-ACT-ACCEPT-SCORE-IMPORT:IMPORT_REJECTED", "scoreImport.state !== PASSED || blockingImportValidationErrors.length > 0"],
  ["EXM-ACT-CREATE-SUBJECT-SCORE:IMPORT_REJECTED", "scoreImport.state !== ACCEPTED"],
  ["EXM-ACT-CONFIRM-SUBJECT-SCORE:SCORE_REJECTED", "confirmationDecision !== CONFIRM || subjectScore.state === REJECTED"],
  ["EXM-ACT-PUBLISH-SUBJECT-SCORE:SCORE_REJECTED", "subjectScore.state === REJECTED"],
  ["EXM-ACT-PUBLISH-SUBJECT-SCORE:TEACHER_CONFIRMATION_REQUIRED", "subjectScore.state !== TEACHER_CONFIRMED || teacherConfirmedAt == null"],
  ["EXM-ACT-VIEW-PUBLISHED-SCORE:RESULT_NOT_PUBLISHED", "subjectScore.state !== PUBLISHED"],
  ["EXM-ACT-VIEW-PUBLISHED-SCORE:RESULT_NOT_VISIBLE", "subjectScore.state === PUBLISHED && currentTime < visibleAt"],
  ["SCH-ACT-GENERATE-CANDIDATE:SOURCE_VERSION_STALE", "calendar.state !== PUBLISHED || constraintSnapshot.state !== ACTIVE || sourceVersionChangedDuringGeneration === true"],
  ["SCH-ACT-CONFIRM-CANDIDATE:HARD_CONSTRAINT_FAILED", "candidate.hardConstraintCheck !== PASS"],
  ["SCH-ACT-CONFIRM-CANDIDATE:SOURCE_VERSION_STALE", "candidate.calendarVersion !== calendar.version || candidate.constraintSnapshotVersion !== constraintSnapshot.version || calendar.state !== PUBLISHED || constraintSnapshot.state !== ACTIVE"],
  ["SCH-ACT-PUBLISH-CANDIDATE:SOURCE_VERSION_STALE", "candidate.calendarVersion !== calendar.version || candidate.constraintSnapshotVersion !== constraintSnapshot.version || calendar.state !== PUBLISHED || constraintSnapshot.state !== ACTIVE"],
  ["PREP-ACT-GENERATE-ASSIGNMENT-DRAFT:LESSON_STALE", "lessonPlan.state !== CONFIRMED || sourceLessonVersionCapture !== lessonPlan.version"],
  ["PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF:LESSON_STALE", "draft.sourceLessonVersion !== lessonPlan.version || lessonPlan.state !== CONFIRMED"],
  ["PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF:HANDOFF_INCOMPLETE", "completedBindingCount !== 15 || missingTeacherRequiredPayloadPaths.length > 0 || unknownPayloadPaths.length > 0"],
  ["PLAT-ACT-CREATE-SUPPORT-CASE:ACCESS_INACTIVE", "auditSession.state !== ACTIVE"],
  ["PLAT-ACT-CREATE-SUPPORT-CASE:ACCESS_EXPIRED", "currentTime >= auditSession.expiresAt"],
  ["PLAT-ACT-CREATE-SUPPORT-CASE:ACCESS_OTHER_RECORD", "currentActor.id !== auditSession.authorizedOperatorId"],
  ["PLAT-ACT-CREATE-SUPPORT-CASE:ACCESS_SCOPE_DENIED", "!auditSession.scope.contains(requestedScope)"],
  ["PLAT-ACT-USE-SUPPORT-ACCESS:ACCESS_INACTIVE", "auditSession.state !== ACTIVE"],
  ["PLAT-ACT-USE-SUPPORT-ACCESS:ACCESS_EXPIRED", "currentTime >= auditSession.expiresAt"],
  ["PLAT-ACT-USE-SUPPORT-ACCESS:ACCESS_OTHER_RECORD", "currentActor.id !== auditSession.authorizedOperatorId"],
  ["PLAT-ACT-USE-SUPPORT-ACCESS:ACCESS_SCOPE_DENIED", "!auditSession.scope.contains(requestedScope)"],
  ["PLAT-ACT-USE-SUPPORT-ACCESS:AUDIT_FAILED", "appendAuditEventBeforeDataReturn !== SUCCESS"],
]);

const AI_TASK_CAPABILITIES = new Map([
  ["QUERY", "QUERY"],
  ["ANALYSIS", "ANALYSIS"],
  ["DRAFT", "DRAFT"],
  ["AD_HOC_REPORT", "REPORT"],
  ["PERIODIC", "PERIODIC"],
  ["REMINDER", "REMINDER"],
  ["CONTROLLED_ACTION", "CONTROLLED"],
]);

const EXTERNAL_SOURCE_PROJECTION_CONTRACTS = [
  ["ACC-OBJ-SCHOOL", "ACC-ACT-SYNC-SCHOOL", "EVT-SCHOOL-DIRECTORY-SNAPSHOT-AVAILABLE", "ACC-SCHOOL-F-SOURCE-REF", "ACC-SCHOOL-F-SOURCE-VERSION"],
  ["ACC-OBJ-IDENTITY", "ACC-ACT-SYNC-IDENTITY", "EVT-IDENTITY-DIRECTORY-SNAPSHOT-AVAILABLE", "ACC-IDENTITY-F-SOURCE-REF", "ACC-IDENTITY-F-SOURCE-VERSION"],
  ["IAM-OBJ-ROLE-POLICY", "IAM-ACT-SYNC-ROLE-POLICY", "EVT-ROLE-POLICY-SNAPSHOT-AVAILABLE", "IAM-ROLE-F-SOURCE-REF", "IAM-ROLE-F-SOURCE-VERSION"],
  ["DGV-OBJ-POLICY", "DGV-ACT-SYNC-POLICY", "EVT-DATA-GOVERNANCE-POLICY-SNAPSHOT-AVAILABLE", "DGV-POLICY-F-SOURCE-REF", "DGV-POLICY-F-SOURCE-VERSION"],
  ["TEA-OBJ-TODO-VIEW", "TEA-ACT-SYNC-TODO-VIEW", "EVT-TEACHER-TODO-PROJECTION-AVAILABLE", "TEA-TODO-F-PROJECTION-SOURCE-REF", "TEA-TODO-F-PROJECTION-SOURCE-VERSION"],
  ["HW-OBJ-RUBRIC", "HW-ACT-SYNC-RUBRIC", "EVT-RUBRIC-SNAPSHOT-AVAILABLE", "HW-RUBRIC-F-SOURCE-REF", "HW-RUBRIC-F-SOURCE-VERSION"],
  ["GRD-OBJ-CAPABILITY-RULE", "GRD-ACT-SYNC-CAPABILITY-RULE", "EVT-GRADING-CAPABILITY-SNAPSHOT-AVAILABLE", "GRD-CAP-F-SOURCE-REF", "GRD-CAP-F-SOURCE-VERSION"],
];

const DESTRUCTIVE_LIFECYCLE_STATES = new Set([
  "SUSPENDED",
  "DEACTIVATED",
  "REVOKED",
  "ARCHIVED",
  "TRANSFERRED",
  "EXPIRED",
  "CANCELLED",
  "SUPERSEDED",
  "DEPRECATED",
  "RETIRED",
  "CLOSED",
  "INVALIDATED",
  "DISABLED",
  "STALE",
]);

function list(value) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function records(value) {
  return list(value).filter(isRecord);
}

function task8ProfileEnabled(index) {
  return index.modelProfile === "ZHIXU_V2"
    || index.modules.some(({ value }) => ZHIXU_PRODUCTION_MARKER_MODULE_IDS.has(value?.id));
}

function isPresent(value) {
  return value !== undefined
    && value !== null
    && !(typeof value === "string" && value.trim() === "");
}

function isValidId(value) {
  return typeof value === "string" && value.trim() !== "";
}

function setEquals(left, right) {
  if (left.size !== right.size) return false;
  return [...left].every((value) => right.has(value));
}

function sameStringSet(left, right) {
  return setEquals(new Set(list(left)), new Set(list(right)));
}

function hasExactKeys(value, expectedKeys) {
  return isRecord(value)
    && setEquals(new Set(Object.keys(value)), new Set(expectedKeys));
}

function academicAccessBoundaryErrors(index) {
  const errors = [];
  for (const { moduleId, value: action } of index.actions) {
    const module = index.moduleById.get(moduleId)?.value;
    if (module?.phase !== 1) continue;
    const permissions = records(action?.permissions);
    const subjectTeacherAllows = permissions.filter(({ effect, dutyRef }) => (
      effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
    ));
    const allowScope = subjectTeacherAllows[0]?.scope;
    const targetObject = index.objectById.get(action?.targetObjectId)?.value;
    const registeredAction = isRegisteredProfessionalWriteAction(action);
    const registeredTarget = isRegisteredProfessionalWriteObject(targetObject);
    const targetDeclaresPolicy = Object.hasOwn(targetObject ?? {}, "professionalWritePolicy");
    const isUserWrite = action?.executionMode === "USER_TASK"
      && action?.operationKind !== "READ"
      && action?.writes === true;
    const hasBoundaryDeclaration = Object.hasOwn(action ?? {}, "authorizationBoundary");
    const hasExceptionDeclaration = Object.hasOwn(action ?? {}, "professionalWriteException");
    const registeredException = resolveProfessionalWriteException(action);
    const permissionDeniedScenarioValid = index.scenarios.some(({ value: scenario }) => (
      scenario?.actionId === action?.id
      && scenario?.resultCode === "PERMISSION_DENIED"
      && scenario?.then?.expectedPermission === "DENY"
      && scenario?.then?.expectedState?.mode === "UNCHANGED"
    ));
    const isPolicyTargetedUserWrite = action?.executionMode === "USER_TASK"
      && action?.operationKind !== "READ"
      && (registeredTarget || targetDeclaresPolicy);
    if (registeredException || hasExceptionDeclaration) {
      const allows = permissions.filter(({ effect }) => effect === "ALLOW");
      const validException = !registeredAction
        && isUserWrite
        && registeredTarget
        && isProfessionalWritePolicy(targetObject?.professionalWritePolicy)
        && registeredException?.targetObjectId === action.targetObjectId
        && matchesRegisteredProfessionalWriteException(action)
        && allows.length === 1
        && allows[0].roleRef === registeredException?.declaration.allowRoleRef
        && permissionDeniedScenarioValid;
      if (!validException) {
        errors.push(
          `INVALID_ACADEMIC_ACCESS_BOUNDARY ${action.id} requires a registry-consistent professional-write boundary or explicit non-professional exception`,
        );
      }
      continue;
    }
    if (!registeredAction && !isPolicyTargetedUserWrite && !hasBoundaryDeclaration) continue;
    const valid = isUserWrite
      && isProfessionalWriteAuthorizationBoundary(action.authorizationBoundary)
      && registeredTarget
      && isProfessionalWritePolicy(targetObject?.professionalWritePolicy)
      && subjectTeacherAllows.length === 1
      && hasExactKeys(allowScope, ["kind", "subjectMatch", "courseMatch"])
      && allowScope.kind === "ASSIGNED_SUBJECT_COURSE"
      && allowScope.subjectMatch === "REQUIRED"
      && allowScope.courseMatch === "REQUIRED"
      && permissions.some(({ effect, dutyRef }) => (
        effect === "DENY" && dutyRef === "DUTY-HOMEROOM"
      ))
      && !permissions.some(({ effect, dutyRef }) => (
        effect === "ALLOW" && dutyRef === "DUTY-HOMEROOM"
      ))
      && permissionDeniedScenarioValid;
    if (!valid) {
      errors.push(
        `INVALID_ACADEMIC_ACCESS_BOUNDARY ${action.id} requires a declared professional-write boundary, assigned subject-course scope, and homeroom default deny`,
      );
    }
  }
  return errors;
}

function studentDetailAccessBoundaryErrors(index) {
  const errors = [];
  for (const { value: action } of index.actions) {
    const targetObject = index.objectById.get(action?.targetObjectId)?.value;
    if (
      action?.executionMode !== "USER_TASK"
      || action?.operationKind !== "READ"
      || !targetObject
    ) continue;
    const registeredClassification = resolveStudentDataClassification(targetObject);
    if (
      registeredClassification
      && registeredClassification.privilegedReadPolicy !== "DEFAULT_DENY"
    ) continue;
    const permissions = records(action?.permissions);
    const roleBoundariesValid = ["ROLE-SCHOOL-ADMIN", "ROLE-PLATFORM-OPS"]
      .every((roleRef) => (
        permissions.some(({ effect, roleRef: permissionRoleRef }) => (
          effect === "DENY" && permissionRoleRef === roleRef
        ))
        && !permissions.some(({ effect, roleRef: permissionRoleRef }) => (
          effect === "ALLOW" && permissionRoleRef === roleRef
        ))
      ));
    const deniedScenarioValid = index.scenarios.some(({ value: scenario }) => (
      scenario?.actionId === action.id
      && scenario?.resultCode === "PERMISSION_DENIED"
      && scenario?.then?.expectedPermission === "DENY"
      && scenario?.then?.expectedState?.mode === "UNCHANGED"
    ));
    if (!roleBoundariesValid || !deniedScenarioValid) {
      errors.push(
        `INVALID_STUDENT_DETAIL_ACCESS_BOUNDARY ${action.id} must deny school-admin and platform-ops default student-detail reads`,
      );
    }
  }
  return errors;
}

function studentDetailAccessExceptionErrors(index) {
  const errors = [];
  for (const { moduleId, value: action } of index.actions) {
    const expected = resolveStudentDetailAccessException(action?.id);
    const hasAccessGuard = Object.hasOwn(action ?? {}, "accessGuard");
    if (!expected && !hasAccessGuard) continue;
    const valid = expected
      && hasAccessGuard
      && action.accessGuard?.exceptionKind === expected.exceptionKind
      && moduleId === expected.moduleId
      && action.targetObjectId === expected.targetObjectId
      && action.operationKind === expected.operationKind
      && action.executionMode === expected.executionMode;
    if (!valid) {
      errors.push(
        `INVALID_STUDENT_DETAIL_ACCESS_EXCEPTION ${formatValidationValue(action?.id)} is not an authorized student-detail access exception occurrence`,
      );
    }
  }
  return errors;
}

function hasExactValues(value, expected) {
  return hasExactKeys(value, Object.keys(expected))
    && Object.entries(expected).every(([property, expectedValue]) => (
      value[property] === expectedValue
    ));
}

function hasStableIdempotencyRole(index, fieldId, allowedRoles) {
  const field = index.fieldById.get(fieldId)?.value;
  if (!allowedRoles.includes(field?.idempotencyRole)) return false;
  if (field.idempotencyRole === "FANOUT_SET") {
    return ["STRING_ARRAY", "JSON"].includes(field.dataType)
      && field.mutability === "IMMUTABLE"
      && field.valueSource?.kind === "SYSTEM";
  }
  if (field.idempotencyRole === "OBJECT_VERSION") {
    return field.dataType === "INTEGER"
      && ["IMMUTABLE", "SYSTEM_MANAGED"].includes(field.mutability)
      && field.valueSource?.kind === "SYSTEM";
  }
  if (field.dataType !== "ID" || field.mutability !== "IMMUTABLE") return false;
  if (field.idempotencyRole === "OBJECT_ID") {
    return field.valueSource?.kind === "SYSTEM";
  }
  return field.valueSource?.kind === "OBJECT_REF"
    && index.objectById.has(field.valueSource.targetObjectId);
}

function actorIsValid(index, reference) {
  return index.actorIds.has(reference);
}

function entityNames(entity) {
  return [entity?.name, entity?.label, entity?.title]
    .filter((value) => typeof value === "string")
    .map((value) => value.trim());
}

function stateIds(object) {
  return new Set(list(object?.states).map((state) => {
    if (typeof state === "string") return state;
    return state?.id ?? state?.code;
  }));
}

function objectIdentityFieldId(object) {
  return records(object?.fields).find(({ idempotencyRole }) => (
    idempotencyRole === "OBJECT_ID"
  ))?.id;
}

function fieldIsRequiredForState(field, state, actionId) {
  if (!isValidId(state)) return false;
  if (field?.required === true) return true;
  if (!isRecord(field?.required)) return false;
  if (!list(field.required.whenStates).includes(state)) return false;
  if (!Object.hasOwn(field.required, "whenActionIds")) return true;
  return isValidId(actionId) && list(field.required.whenActionIds).includes(actionId);
}

function concreteActionState(index, action) {
  if (isValidId(action?.transition?.to)) return action.transition.to;
  const successStates = new Set(index.scenarios
    .filter(({ value }) => (
      value?.actionId === action?.id
      && value?.kind === "SUCCESS"
      && value?.then?.expectedState?.mode === "STATE"
      && isValidId(value.then.expectedState.value)
    ))
    .map(({ value }) => value.then.expectedState.value));
  return successStates.size === 1 ? [...successStates][0] : undefined;
}

function inheritedRequiredFieldIds(action, targetObject) {
  if (action?.operationKind !== "UPDATE") return new Set();
  const fromStates = Array.isArray(action?.transition?.from)
    ? action.transition.from
    : [action?.transition?.from].filter(isValidId);
  if (fromStates.length === 0) return new Set();
  return new Set(records(targetObject?.fields)
    .filter((field) => (
      isValidId(field?.id)
      && fromStates.every((state) => fieldIsRequiredForState(field, state))
    ))
    .map(({ id }) => id));
}

function actionStateCoverageFieldIds(action, targetObject, providedFieldIds = []) {
  return new Set([
    ...inheritedRequiredFieldIds(action, targetObject),
    ...list(action?.inputFieldIds),
    ...providedFieldIds,
    ...list(action?.outputFieldIds),
  ]);
}

function missingActionStateFieldIds(index, action, targetObject, providedFieldIds = []) {
  const concreteState = concreteActionState(index, action);
  const coveredFieldIds = actionStateCoverageFieldIds(
    action,
    targetObject,
    providedFieldIds,
  );
  return records(targetObject?.fields)
    .filter((field) => fieldIsRequiredForState(field, concreteState, action?.id))
    .map(({ id }) => id)
    .filter((fieldId) => !coveredFieldIds.has(fieldId));
}

function conditionalRequiredErrors(index) {
  const errors = [];
  for (const fieldEntry of index.fields) {
    const required = fieldEntry.value?.required;
    if (!isRecord(required) || !Object.hasOwn(required, "whenActionIds")) continue;
    const declaredActionIds = list(required.whenActionIds);
    for (const actionId of declaredActionIds) {
      const actionEntry = index.actionById.get(actionId);
      const action = actionEntry?.value;
      const concreteState = concreteActionState(index, action);
      if (
        !actionEntry
        || actionEntry.moduleId !== fieldEntry.moduleId
        || action?.targetObjectId !== fieldEntry.objectId
        || !list(required.whenStates).includes(concreteState)
      ) {
        errors.push(
          `INVALID_FIELD_CONTRACT ${formatValidationValue(fieldEntry.value?.id)} conditional action ${formatValidationValue(actionId)} must target the owning object in the same module and reach a declared required state`,
        );
      }
    }
    const writerActionIds = index.actions
      .filter(({ moduleId, value: action }) => (
        moduleId === fieldEntry.moduleId
        && action?.targetObjectId === fieldEntry.objectId
        && action?.writes === true
        && list(action?.outputFieldIds).includes(fieldEntry.value?.id)
      ))
      .map(({ value }) => value.id);
    if (!setEquals(new Set(declaredActionIds), new Set(writerActionIds))) {
      errors.push(
        `INVALID_FIELD_ACTION_BINDING ${formatValidationValue(fieldEntry.value?.id)} declared=${declaredActionIds.map(formatValidationValue).sort().join(",")} writers=${writerActionIds.map(formatValidationValue).sort().join(",")}`,
      );
    }
  }
  for (const actionEntry of index.actions) {
    const action = actionEntry.value;
    const targetObject = index.objectById.get(action?.targetObjectId)?.value;
    const concreteState = concreteActionState(index, action);
    const missingFieldIds = missingActionStateFieldIds(index, action, targetObject);
    if (missingFieldIds.length > 0) {
      errors.push(
        `INVALID_ACTION_REQUIRED_FIELD ${formatValidationValue(action?.id)} state=${formatValidationValue(concreteState)} missing ${missingFieldIds.map(formatValidationValue).join(",")}`,
      );
    }
  }
  return errors;
}

function fieldWriteContractErrors(index) {
  const errors = [];
  const fieldsWithContracts = index.fields.filter(({ value }) => (
    isRecord(value?.writeContract)
  ));
  for (const fieldEntry of fieldsWithContracts) {
    const field = fieldEntry.value;
    const contract = field.writeContract;
    const initializers = contract.initializers;
    const mutators = contract.mutators;
    const initializerActionIds = list(initializers?.actionIds);
    const mutatorActionIds = list(mutators?.actionIds);
    const declaredWriterIds = [...initializerActionIds, ...mutatorActionIds];
    const actualWriterIds = index.actions
      .filter(({ moduleId, value: action }) => (
        moduleId === fieldEntry.moduleId
        && action?.targetObjectId === fieldEntry.objectId
        && action?.writes === true
        && list(action?.outputFieldIds).includes(field?.id)
      ))
      .map(({ value }) => value.id);
    const requiredActionIds = isRecord(field.required)
      ? list(field.required.whenActionIds)
      : [];
    const actionSemanticsValid = declaredWriterIds.every((actionId) => {
      const actionEntry = index.actionById.get(actionId);
      const action = actionEntry?.value;
      const initializer = initializerActionIds.includes(actionId);
      const matchingWrites = records(action?.fieldWrites)
        .filter(({ fieldId }) => fieldId === field.id);
      const expectedMode = initializer ? "INITIALIZE" : mutators?.operation;
      const expectedValueProperty = initializer ? "value" : "amount";
      const expectedValue = initializer ? initializers?.value : mutators?.amount;
      return actionEntry?.moduleId === fieldEntry.moduleId
        && action?.targetObjectId === fieldEntry.objectId
        && action?.operationKind === (initializer ? "CREATE" : "UPDATE")
        && list(action?.outputFieldIds).includes(field.id)
        && matchingWrites.length === 1
        && matchingWrites[0].mode === expectedMode
        && matchingWrites[0][expectedValueProperty] === expectedValue;
    });
    const valid = field.dataType === "INTEGER"
      && field.valueSource?.kind === "SYSTEM"
      && field.mutability === "SYSTEM_MANAGED"
      && initializerActionIds.length > 0
      && mutatorActionIds.length > 0
      && new Set(declaredWriterIds).size === declaredWriterIds.length
      && setEquals(new Set(actualWriterIds), new Set(declaredWriterIds))
      && setEquals(new Set(requiredActionIds), new Set(declaredWriterIds))
      && initializers?.value === 0
      && mutators?.operation === "INCREMENT"
      && mutators?.amount === 1
      && actionSemanticsValid;
    if (!valid) {
      errors.push(
        `INVALID_FIELD_WRITE_CONTRACT ${formatValidationValue(field.id)} writers must exactly match INITIALIZE 0 and INCREMENT 1 Action semantics`,
      );
    }
  }
  for (const actionEntry of index.actions) {
    for (const fieldWrite of records(actionEntry.value?.fieldWrites)) {
      const fieldEntry = index.fieldById.get(fieldWrite?.fieldId);
      if (
        fieldEntry?.moduleId !== actionEntry.moduleId
        || fieldEntry?.objectId !== actionEntry.value?.targetObjectId
        || !isRecord(fieldEntry.value?.writeContract)
        || !list(actionEntry.value?.outputFieldIds).includes(fieldWrite?.fieldId)
      ) {
        errors.push(
          `INVALID_FIELD_WRITE_CONTRACT ${formatValidationValue(actionEntry.value?.id)} -> ${formatValidationValue(fieldWrite?.fieldId)} must bind one declared target-field write contract`,
        );
      }
    }
  }
  return errors;
}

function eventActionRoutingErrors(index) {
  const errors = [];
  for (const eventEntry of index.events) {
    const actionsByObjectId = new Map();
    for (const actionId of list(eventEntry.value?.triggeredActionIds)) {
      const action = index.actionById.get(actionId)?.value;
      if (
        action?.executionMode !== "SYSTEM_EVENT"
        || action?.trigger?.eventId !== eventEntry.value?.id
        || !isValidId(action?.targetObjectId)
      ) continue;
      const actions = actionsByObjectId.get(action.targetObjectId) ?? [];
      actions.push(action);
      actionsByObjectId.set(action.targetObjectId, actions);
    }

    for (const [objectId, actions] of actionsByObjectId) {
      for (let leftIndex = 0; leftIndex < actions.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < actions.length; rightIndex += 1) {
          const left = actions[leftIndex];
          const right = actions[rightIndex];
          const isImplicitCreateUpdate = (
            left.operationKind === "CREATE"
            && right.operationKind !== "CREATE"
          ) || (
            right.operationKind === "CREATE"
            && left.operationKind !== "CREATE"
          );
          const leftFrom = new Set(list(
            Array.isArray(left.transition?.from)
              ? left.transition.from
              : [left.transition?.from],
          ).filter(isValidId));
          const rightFrom = new Set(list(
            Array.isArray(right.transition?.from)
              ? right.transition.from
              : [right.transition?.from],
          ).filter(isValidId));
          const hasOverlappingExclusiveTransitions = isRecord(left.transition)
            && isRecord(right.transition)
            && [...leftFrom].some((state) => rightFrom.has(state))
            && left.transition.to !== right.transition.to;
          if (isImplicitCreateUpdate || hasOverlappingExclusiveTransitions) {
            errors.push(
              `INVALID_EVENT_ACTION_ROUTING ${formatValidationValue(eventEntry.value?.id)} -> ${formatValidationValue(objectId)} cannot route ${formatValidationValue(left.id)} and ${formatValidationValue(right.id)} without an explicit ordered Flow and identity binding`,
            );
          }
        }
      }
    }
  }
  return errors;
}

function stateReachabilityErrors(index) {
  const errors = [];
  for (const objectEntry of index.objects) {
    const object = objectEntry.value;
    const module = index.moduleById.get(objectEntry.moduleId)?.value;
    if (module?.phase !== 1) continue;

    const policy = object?.stateReachability;
    const declaredStates = stateIds(object);
    const objectActions = index.actions
      .filter(({ value }) => value?.targetObjectId === object?.id)
      .map(({ value }) => value);
    if (!isRecord(policy) || !["NONE", "ACTION_GRAPH"].includes(policy.mode)) {
      errors.push(
        `INVALID_STATE_REACHABILITY_POLICY ${formatValidationValue(object?.id)} must declare NONE or ACTION_GRAPH`,
      );
      continue;
    }
    if (policy.mode === "NONE") {
      if (!hasExactKeys(policy, ["mode"])) {
        errors.push(
          `INVALID_STATE_REACHABILITY_POLICY ${formatValidationValue(object?.id)} NONE must use the closed policy shape`,
        );
      }
      const hasStateChangingAction = objectActions.some((action) => (
        action?.writes === true
        || isRecord(action?.transition)
        || declaredStates.has(concreteActionState(index, action))
      ));
      if (declaredStates.size !== 1 || hasStateChangingAction) {
        errors.push(
          `INVALID_STATE_REACHABILITY_POLICY ${formatValidationValue(object?.id)} NONE requires one trivial state and no state-changing Action`,
        );
      }
      continue;
    }
    const policyKeys = Object.hasOwn(policy, "entrySources")
      ? ["mode", "initialStateIds", "entrySources"]
      : ["mode", "initialStateIds"];
    if (!hasExactKeys(policy, policyKeys)) {
      errors.push(
        `INVALID_STATE_REACHABILITY_POLICY ${formatValidationValue(object?.id)} ACTION_GRAPH must use the closed initialStateIds and optional entrySources shape`,
      );
      continue;
    }

    const initialStateIds = list(policy.initialStateIds);
    const validInitialStates = initialStateIds.every(isValidId)
      && new Set(initialStateIds).size === initialStateIds.length
      && initialStateIds.every((state) => declaredStates.has(state));
    const createActions = objectActions
      .filter(({ operationKind }) => operationKind === "CREATE");
    const declaredEntrySources = list(policy.entrySources);
    const entrySources = records(policy.entrySources);
    const externalSourceStates = new Set(entrySources.map(({ stateId }) => stateId));
    const readOnlyExternal = !objectActions.some(({ writes }) => writes === true);
    const validEntryContract = createActions.length > 0
      ? initialStateIds.length === 0 && declaredEntrySources.length === 0
      : readOnlyExternal
        ? declaredStates.size === 1
          && initialStateIds.length === 1
          && declaredEntrySources.length === 0
        : initialStateIds.length === 1 && declaredEntrySources.length === 0;
    if (!validEntryContract) {
      errors.push(
        `INVALID_STATE_ENTRY_SOURCE ${formatValidationValue(object?.id)} must derive entries from CREATE success or closed producer-bound external source evidence`,
      );
    }
    const scenarioStatesByActionId = new Map(objectActions.map((action) => [
      action.id,
      new Set(index.scenarios
        .filter(({ value }) => (
          value?.actionId === action.id
          && value?.then?.expectedState?.mode === "STATE"
          && declaredStates.has(value.then.expectedState.value)
        ))
        .map(({ value }) => value.then.expectedState.value)),
    ]));
    const createEntryStates = createActions.flatMap((action) => index.scenarios
      .filter(({ value }) => (
        value?.actionId === action.id
        && value?.kind === "SUCCESS"
        && value?.then?.expectedState?.mode === "STATE"
        && declaredStates.has(value.then.expectedState.value)
      ))
      .map(({ value }) => value.then.expectedState.value));
    const reachableStates = new Set([
      ...(createActions.length === 0 ? initialStateIds : []),
      ...externalSourceStates,
      ...createEntryStates,
    ]);
    if (!validInitialStates || reachableStates.size === 0) {
      errors.push(
        `INVALID_STATE_REACHABILITY_POLICY ${formatValidationValue(object?.id)} ACTION_GRAPH requires a declared initial state or CREATE success state`,
      );
      continue;
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const action of objectActions) {
        const transition = action?.transition;
        if (!isRecord(transition)) continue;
        const fromStates = Array.isArray(transition.from)
          ? transition.from
          : [transition.from];
        if (!fromStates.some((state) => reachableStates.has(state))) continue;
        const targetStates = new Set([
          transition.to,
          ...(scenarioStatesByActionId.get(action.id) ?? []),
        ]);
        for (const targetState of targetStates) {
          if (declaredStates.has(targetState) && !reachableStates.has(targetState)) {
            reachableStates.add(targetState);
            changed = true;
          }
        }
      }
    }
    const unreachableStates = [...declaredStates]
      .filter((state) => !reachableStates.has(state));
    if (unreachableStates.length > 0) {
      errors.push(
        `UNREACHABLE_OBJECT_STATE ${formatValidationValue(object?.id)} -> ${unreachableStates.map(formatValidationValue).join(",")}`,
      );
    }
  }
  return errors;
}

function externalSourceProvenanceErrors(index) {
  const errors = index.objects
    .filter(({ value }) => Object.hasOwn(value?.stateReachability ?? {}, "entrySources"))
    .map(({ value }) => (
      `INVALID_EXTERNAL_SOURCE_PROVENANCE ${formatValidationValue(value?.id)} metadata-only entrySources cannot replace a registered source Action, Event, and version binding`
    ));
  for (const [
    objectId,
    actionId,
    eventId,
    sourceRefFieldId,
    sourceVersionFieldId,
  ] of EXTERNAL_SOURCE_PROJECTION_CONTRACTS) {
    const objectEntry = index.objectById.get(objectId);
    if (!objectEntry) continue;
    const object = objectEntry?.value;
    const actionEntry = index.actionById.get(actionId);
    const action = actionEntry?.value;
    const event = index.eventById.get(eventId)?.value;
    const sourceRefField = index.fieldById.get(sourceRefFieldId);
    const sourceVersionField = index.fieldById.get(sourceVersionFieldId);
    const identityField = records(object?.fields)
      .find(({ idempotencyRole }) => idempotencyRole === "OBJECT_ID");
    const createActionIds = index.actions
      .filter(({ value }) => (
        value?.targetObjectId === objectId && value?.operationKind === "CREATE"
      ))
      .map(({ value }) => value.id);
    const successStates = new Set(index.scenarios
      .filter(({ value }) => (
        value?.actionId === actionId
        && value?.kind === "SUCCESS"
        && value?.then?.expectedState?.mode === "STATE"
      ))
      .map(({ value }) => value.then.expectedState.value));
    const sourceFieldsValid = [
      [sourceRefField, "ID"],
      [sourceVersionField, "INTEGER"],
    ].every(([fieldEntry, dataType]) => (
      fieldEntry?.objectId === objectId
      && fieldEntry.value?.dataType === dataType
      && fieldEntry.value?.valueSource?.kind === "SYSTEM"
      && fieldEntry.value?.mutability === "IMMUTABLE"
      && list(action?.inputFieldIds).includes(fieldEntry.value.id)
      && list(action?.outputFieldIds).includes(fieldEntry.value.id)
    ));
    const valid = objectEntry
      && actionEntry?.moduleId === objectEntry.moduleId
      && action?.targetObjectId === objectId
      && action?.operationKind === "CREATE"
      && action?.executionMode === "SYSTEM_EVENT"
      && action?.trigger?.kind === "EVENT"
      && action.trigger.eventId === eventId
      && setEquals(new Set(list(event?.triggeredActionIds)), new Set([actionId]))
      && createActionIds.length === 1
      && createActionIds[0] === actionId
      && sourceFieldsValid
      && isValidId(identityField?.id)
      && !list(action?.inputFieldIds).includes(identityField.id)
      && list(action?.outputFieldIds).includes(identityField.id)
      && setEquals(successStates, stateIds(object))
      && !Object.hasOwn(object?.stateReachability ?? {}, "entrySources")
      && list(object?.stateReachability?.initialStateIds).length === 0;
    if (!valid) {
      errors.push(
        `INVALID_EXTERNAL_SOURCE_PROVENANCE ${formatValidationValue(objectId)} must bind ${formatValidationValue(actionId)} to one registered source Event with immutable source reference and version inputs`,
      );
    }
  }
  return errors;
}

function policyRequiresGuard(policy, operationKind) {
  return policy === "ALWAYS_REQUIRED"
    || (policy === "CREATE_REQUIRED" && operationKind === "CREATE")
    || (policy === "UPDATE_REQUIRED" && operationKind === "UPDATE");
}

function ownerErrors(index) {
  const errors = [];
  for (const objectEntry of index.objects) {
    for (const property of ["producerRef", "ownerRef", "confirmerRef", "stewardRef"]) {
      const reference = objectEntry.value?.[property];
      if (!actorIsValid(index, reference)) {
        errors.push(
          `ORPHAN_OWNER_ROLE ${formatValidationValue(objectEntry.value?.id)}.${property} -> ${formatValidationValue(reference)}`,
        );
      }
    }
  }
  for (const metricEntry of index.metrics) {
    const reference = metricEntry.value?.ownerRef;
    if (!actorIsValid(index, reference)) {
      errors.push(
        `ORPHAN_OWNER_ROLE ${formatValidationValue(metricEntry.value?.id)}.ownerRef -> ${formatValidationValue(reference)}`,
      );
    }
  }
  return errors;
}

function actionErrors(index) {
  const errors = [];
  const acceptedInputPartitions = new Map();
  for (const actionEntry of index.actions) {
    const action = actionEntry.value;
    const permissionEffects = new Set(
      list(action?.permissions).map((permission) => permission?.effect),
    );
    if (!permissionEffects.has("ALLOW") || !permissionEffects.has("DENY")) {
      errors.push(
        `MISSING_ACTION_PERMISSION ${formatValidationValue(action?.id)} requires ALLOW and DENY`,
      );
    }

    const targetObject = index.objectById.get(action?.targetObjectId)?.value;
    if (targetObject && action?.operationKind === "CREATE") {
      const allowPermissions = records(action?.permissions).filter(({ effect }) => (
        effect === "ALLOW"
      ));
      const producerRef = targetObject.producerRef;
      const userProducerMatches = allowPermissions.some((permission) => {
        const subject = permission?.actorRef ?? permission?.roleRef ?? permission?.dutyRef;
        if (producerRef === "CURRENT_ACTOR") {
          return isValidId(permission?.roleRef)
            || isValidId(permission?.dutyRef)
            || permission?.actorRef === "CURRENT_ACTOR";
        }
        return subject === producerRef;
      });
      const systemFlowProduces = action.executionMode !== "USER_TASK"
        && allowPermissions.some(({ actorRef }) => actorRef === "SYSTEM");
      if (!userProducerMatches && !systemFlowProduces) {
        errors.push(
          `INVALID_CREATE_PRODUCER ${formatValidationValue(action?.id)} ALLOW subject must match ${formatValidationValue(producerRef)} or a verified SYSTEM Flow producer`,
        );
      }
    }
    if (targetObject && action?.transition) {
      const states = stateIds(targetObject);
      const { from, to } = action.transition;
      const fromStates = Array.isArray(from) ? from : [from];
      if (
        fromStates.length === 0
        || fromStates.some((state) => !states.has(state))
        || !states.has(to)
      ) {
        errors.push(
          `INVALID_STATE_TRANSITION ${formatValidationValue(action?.id)} ${formatValidationValue(from)} -> ${formatValidationValue(to)}`,
        );
      }
    }

    for (const guard of list(action?.relatedStateGuards)) {
      const refField = index.fieldById.get(guard?.refFieldId);
      const versionField = index.fieldById.get(guard?.versionFieldId);
      const guardTarget = index.objectById.get(guard?.targetObjectId)?.value;
      const coveredFieldIds = new Set([
        ...list(action?.inputFieldIds),
        ...list(action?.outputFieldIds),
      ]);
      const lineageBinding = list(targetObject?.lineageBindings).find((binding) => (
        binding?.refFieldId === guard?.refFieldId
        && binding?.versionFieldId === guard?.versionFieldId
        && binding?.targetObjectId === guard?.targetObjectId
      ));
      const guardPolicy = refField?.value?.stateGuardPolicy;
      const guardValid = refField?.objectId === action?.targetObjectId
        && versionField?.objectId === action?.targetObjectId
        && refField?.value?.valueSource?.kind === "OBJECT_REF"
        && refField.value.valueSource.targetObjectId === guard?.targetObjectId
        && refField.value.referenceIntegrity === "VERSION_PINNED"
        && refField.value.versionBinding?.versionFieldId === guard?.versionFieldId
        && refField.value.versionBinding?.targetVersionFieldId
          === lineageBinding?.targetVersionFieldId
        && coveredFieldIds.has(guard?.refFieldId)
        && coveredFieldIds.has(guard?.versionFieldId)
        && policyRequiresGuard(guardPolicy, action?.operationKind)
        && stateIds(guardTarget).has(guard?.requiredState);
      if (!guardValid) {
        errors.push(
          `INVALID_ACTION_STATE_GUARD ${formatValidationValue(action?.id)} requires a covered version-pinned lineage to ${formatValidationValue(guard?.targetObjectId)}.${formatValidationValue(guard?.requiredState)}`,
        );
      }
    }

    const coveredFieldIds = new Set([
      ...list(action?.inputFieldIds),
      ...list(action?.outputFieldIds),
    ]);
    for (const refField of list(targetObject?.fields).filter((field) => (
      field?.valueSource?.kind === "OBJECT_REF"
      && field?.referenceIntegrity === "VERSION_PINNED"
    ))) {
      const versionFieldId = refField.versionBinding?.versionFieldId;
      const coversRef = coveredFieldIds.has(refField.id);
      const coversVersion = coveredFieldIds.has(versionFieldId);
      const guardRequired = policyRequiresGuard(
        refField.stateGuardPolicy,
        action?.operationKind,
      ) && (coversRef || coversVersion);
      const matchingGuards = list(action?.relatedStateGuards).filter((guard) => (
        guard?.refFieldId === refField.id
        && guard?.versionFieldId === versionFieldId
        && guard?.targetObjectId === refField.valueSource.targetObjectId
      ));
      if (
        (guardRequired && (!coversRef || !coversVersion || matchingGuards.length !== 1))
        || (!guardRequired && matchingGuards.length > 0)
      ) {
        errors.push(
          `INVALID_ACTION_STATE_GUARD ${formatValidationValue(action?.id)} must derive exactly one guard from ${formatValidationValue(refField.id)} policy=${formatValidationValue(refField.stateGuardPolicy)}`,
        );
      }
    }

    for (const acceptedInputValue of list(action?.acceptedInputValues)) {
      const fieldId = acceptedInputValue?.fieldId;
      const optionSetId = acceptedInputValue?.optionSetId;
      const partitionId = acceptedInputValue?.partitionId;
      const codes = list(acceptedInputValue?.codes);
      const fieldEntry = index.fieldById.get(fieldId);
      const optionSet = index.optionSetById.get(optionSetId)?.value;
      const optionValues = list(optionSet?.values);
      const registeredCodes = new Set(
        optionValues.filter(isRecord).map(({ code }) => code).filter(isValidId),
      );
      const bindingValid = list(action?.inputFieldIds).includes(fieldId)
        && fieldEntry?.objectId === action?.targetObjectId
        && fieldEntry?.value?.valueSource?.kind === "OPTION_SET"
        && fieldEntry.value.valueSource.optionSetId === optionSetId
        && optionSet?.mode === "STATIC"
        && registeredCodes.size === optionValues.length
        && codes.length > 0
        && codes.every(isValidId)
        && new Set(codes).size === codes.length
        && codes.every((code) => registeredCodes.has(code));
      if (!bindingValid) {
        errors.push(
          `INVALID_ACTION_INPUT_VALUES ${formatValidationValue(action?.id)} must accept registered STATIC Option Set values for an input owned by its target object`,
        );
      }

      const partitionKey = [action?.targetObjectId, fieldId, partitionId].join("\u0000");
      const partition = acceptedInputPartitions.get(partitionKey) ?? {
        optionSetId,
        registeredCodes,
        acceptedCodes: new Set(),
        valid: true,
      };
      if (partition.optionSetId !== optionSetId) partition.valid = false;
      for (const code of codes) {
        if (partition.acceptedCodes.has(code)) partition.valid = false;
        partition.acceptedCodes.add(code);
      }
      acceptedInputPartitions.set(partitionKey, partition);
    }

    const declaredScenarioIds = new Set(list(action?.scenarioIds));
    const actionScenarios = index.scenarios.filter(
      ({ value }) => value?.actionId === action?.id,
    );
    const successScenarios = actionScenarios.filter(
      ({ value }) => value?.kind === "SUCCESS",
    );
    const operationKind = action?.operationKind;
    const hasTransition = action?.transition !== null
      && typeof action?.transition === "object"
      && !Array.isArray(action.transition);
    const hasStateEffect = actionScenarios.some(
      ({ value }) => value?.then?.expectedState?.mode !== "UNCHANGED",
    );
    const hasCreatedSuccessState = successScenarios.length > 0
      && successScenarios.every(
        ({ value }) => value?.then?.expectedState?.mode === "STATE",
      );
    if (
      (operationKind === "READ" && (action?.writes !== false || hasTransition || hasStateEffect))
      || (
        operationKind === "CREATE"
        && (action?.writes !== true || hasTransition || !hasCreatedSuccessState)
      )
      || (operationKind === "UPDATE" && (action?.writes !== true || !hasTransition))
    ) {
      errors.push(
        `INVALID_ACTION_OPERATION ${formatValidationValue(action?.id)} has an inconsistent ${formatValidationValue(operationKind)} contract`,
      );
    }
    if (
      operationKind === "CREATE"
      && MIXED_CREATE_SEMANTICS.test(`${action?.id ?? ""} ${action?.label ?? ""}`)
    ) {
      errors.push(
        `INVALID_ACTION_OPERATION ${formatValidationValue(action?.id)} mixes CREATE with update semantics`,
      );
    }
    if (
      action?.transition
      && successScenarios.some(({ value }) => (
        value?.then?.expectedState?.mode !== "STATE"
        || value.then.expectedState.value !== action.transition.to
      ))
    ) {
      errors.push(
        `SCENARIO_TRANSITION_MISMATCH ${formatValidationValue(action?.id)} requires SUCCESS state ${formatValidationValue(action.transition.to)}`,
      );
    }
    if (
      action?.writes === true
      && successScenarios.some(({ value }) => value?.then?.expectedState?.mode !== "STATE")
    ) {
      errors.push(
        `MISSING_ACTION_STATE_EFFECT ${formatValidationValue(action?.id)} requires a concrete success state`,
      );
    }
    if (targetObject) {
      const states = stateIds(targetObject);
      for (const { value: scenario } of actionScenarios) {
        const expectedState = scenario?.then?.expectedState;
        if (
          expectedState?.mode === "STATE"
          && !states.has(expectedState.value)
        ) {
          errors.push(
            `INVALID_SCENARIO_STATE ${formatValidationValue(scenario?.id)} -> ${formatValidationValue(expectedState.value)}`,
          );
        }
      }
    }
    const actualScenarioIds = new Set(
      actionScenarios.map(({ value }) => value?.id),
    );
    const declaredFailureResults = list(action?.failureResults);
    const coveredFailureResults = actionScenarios
      .filter(({ value }) => value?.kind !== "SUCCESS")
      .map(({ value }) => value?.resultCode);
    const coveredFailureResultSet = new Set(coveredFailureResults);
    if (
      coveredFailureResults.length !== declaredFailureResults.length
      || coveredFailureResultSet.size !== coveredFailureResults.length
      || !setEquals(new Set(declaredFailureResults), coveredFailureResultSet)
    ) {
      errors.push(
        `INVALID_FAILURE_RESULT_COVERAGE ${formatValidationValue(action?.id)} requires one negative scenario per failure result`,
      );
    }
    const scenarioKinds = new Set(
      actionScenarios
        .filter(({ value }) => declaredScenarioIds.has(value?.id))
        .map(({ value }) => value?.kind),
    );
    const hasCoverage = scenarioKinds.has("SUCCESS")
      && (scenarioKinds.has("FAILURE") || scenarioKinds.has("BOUNDARY"));
    if (!setEquals(declaredScenarioIds, actualScenarioIds) || !hasCoverage) {
      errors.push(
        `MISSING_ACTION_SCENARIO ${formatValidationValue(action?.id)} requires matching SUCCESS and FAILURE/BOUNDARY scenarios`,
      );
    }

    for (const name of entityNames(action)) {
      if (FORBIDDEN_ACTION_NAMES.has(name)) {
        errors.push(
          `FORBIDDEN_GENERIC_TEMPLATE action ${formatValidationValue(action?.id)} -> ${name}`,
        );
      }
    }
  }
  for (const partition of acceptedInputPartitions.values()) {
    if (
      !partition.valid
      || !setEquals(partition.acceptedCodes, partition.registeredCodes)
    ) {
      errors.push(
        "INVALID_ACTION_INPUT_VALUES accepted action input partitions must be disjoint and exhaust their STATIC Option Set",
      );
    }
  }
  return errors;
}

function lifecycleRiskErrors(index) {
  const errors = [];
  for (const actionEntry of index.actions) {
    const action = actionEntry.value;
    const targetObject = index.objectById.get(action?.targetObjectId)?.value;
    if (
      !["S3", "S4"].includes(targetObject?.sensitivityId)
      || !DESTRUCTIVE_LIFECYCLE_STATES.has(action?.transition?.to)
    ) continue;
    const auditClosed = action?.auditMode === "ATOMIC_SELF_RECORD"
      || (
        action?.auditMode === "REQUIRED"
        && list(action?.failureResults).includes("AUDIT_FAILED")
      );
    if (action?.risk !== "HIGH" || !auditClosed) {
      errors.push(
        `INVALID_LIFECYCLE_RISK ${formatValidationValue(action?.id)} destructive ${formatValidationValue(targetObject?.sensitivityId)} transition must be HIGH risk and audit fail-closed`,
      );
    }
  }
  return errors;
}

function actionApplicabilityErrors(index) {
  const errors = [];
  for (const fieldEntry of index.fields.filter(({ value }) => (
    value?.referenceIntegrity === "VERSION_PINNED"
  ))) {
    const refField = fieldEntry.value;
    const versionFieldId = refField?.versionBinding?.versionFieldId;
    const requiredActionIds = list(refField?.actionApplicability?.requiredActionIds);
    const requiredActionIdSet = new Set(requiredActionIds);
    const requiredPolicyMatches = requiredActionIds.length > 0
      ? refField?.stateGuardPolicy !== "NONE"
      : refField?.stateGuardPolicy === "NONE";
    let valid = requiredPolicyMatches;

    const matchingActionIds = new Set();
    for (const actionEntry of index.actions) {
      const action = actionEntry.value;
      const matchingGuards = list(action?.relatedStateGuards).filter((guard) => (
        guard?.refFieldId === refField?.id
        && guard?.versionFieldId === versionFieldId
        && guard?.targetObjectId === refField?.valueSource?.targetObjectId
      ));
      if (matchingGuards.length > 0) matchingActionIds.add(action?.id);
    }

    for (const actionId of requiredActionIds) {
      const actionEntry = index.actionById.get(actionId);
      const action = actionEntry?.value;
      const coveredFieldIds = new Set([
        ...list(action?.inputFieldIds),
        ...list(action?.outputFieldIds),
      ]);
      const matchingGuards = list(action?.relatedStateGuards).filter((guard) => (
        guard?.refFieldId === refField?.id
        && guard?.versionFieldId === versionFieldId
        && guard?.targetObjectId === refField?.valueSource?.targetObjectId
      ));
      if (
        !actionEntry
        || actionEntry.moduleId !== fieldEntry.moduleId
        || action?.targetObjectId !== fieldEntry.objectId
        || !policyRequiresGuard(refField?.stateGuardPolicy, action?.operationKind)
        || !coveredFieldIds.has(refField?.id)
        || !coveredFieldIds.has(versionFieldId)
        || matchingGuards.length !== 1
      ) {
        valid = false;
      }
    }

    if (!setEquals(requiredActionIdSet, matchingActionIds)) valid = false;
    if (!valid) {
      errors.push(
        `INVALID_ACTION_STATE_GUARD ${formatValidationValue(refField?.id)} action applicability must exactly match same-module covered actions and derived guards for policy=${formatValidationValue(refField?.stateGuardPolicy)}`,
      );
    }
  }
  return errors;
}

function flowErrors(index) {
  const errors = [];
  for (const flowEntry of index.flows) {
    const flow = flowEntry.value;
    const declaredModuleIds = new Set(list(flow?.moduleIds));
    const participantPhases = new Set(
      [...declaredModuleIds]
        .map((moduleId) => index.moduleById.get(moduleId)?.value?.phase)
        .filter((phase) => phase !== undefined),
    );
    if (participantPhases.size !== 1 || !participantPhases.has(flow?.phase)) {
      errors.push(
        `FLOW_PHASE_MISMATCH ${formatValidationValue(flow?.id)} phase=${formatValidationValue(flow?.phase)} participantPhases=${[...participantPhases].sort().join(",")}`,
      );
    }
    const actionModuleIds = new Set();
    const stepActions = [];
    for (const step of list(flow?.steps)) {
      const actionEntry = index.actionById.get(step?.actionId);
      if (actionEntry) {
        actionModuleIds.add(actionEntry.moduleId);
        stepActions.push(actionEntry.value);
      }
    }
    const sourceOnlyModuleIds = new Set(list(flow?.sourceOnlyModuleIds));
    const expectedActionModuleIds = new Set(
      [...declaredModuleIds].filter((moduleId) => !sourceOnlyModuleIds.has(moduleId)),
    );
    const sourceDataModuleIds = new Set(list(flow?.sourceDataRefs)
      .map((dataRef) => index.objectById.get(dataRef?.objectId)?.moduleId)
      .filter(isValidId));
    const participantRolesValid = [...sourceOnlyModuleIds].every((moduleId) => (
      declaredModuleIds.has(moduleId)
      && !actionModuleIds.has(moduleId)
      && sourceDataModuleIds.has(moduleId)
    ));
    if (
      !participantRolesValid
      || !setEquals(expectedActionModuleIds, actionModuleIds)
    ) {
      const declared = [...declaredModuleIds]
        .map(formatValidationValue)
        .sort()
        .join(",");
      const actual = [...actionModuleIds]
        .map(formatValidationValue)
        .sort()
        .join(",");
      errors.push(
        `FLOW_PARTICIPANT_MISMATCH ${formatValidationValue(flow?.id)} declared=${declared} actionModules=${actual}`,
      );
    }
    const dataModuleIds = new Set();
    for (const property of ["sourceDataRefs", "targetDataRefs"]) {
      for (const dataRef of list(flow?.[property])) {
        const objectEntry = index.objectById.get(dataRef?.objectId);
        if (objectEntry) dataModuleIds.add(objectEntry.moduleId);
      }
    }
    if (!setEquals(declaredModuleIds, dataModuleIds)) {
      const declared = [...declaredModuleIds]
        .map(formatValidationValue)
        .sort()
        .join(",");
      const actual = [...dataModuleIds]
        .map(formatValidationValue)
        .sort()
        .join(",");
      errors.push(
        `FLOW_DATA_PARTICIPANT_MISMATCH ${formatValidationValue(flow?.id)} declared=${declared} actual=${actual}`,
      );
    }

    const steps = [...list(flow?.steps)].sort((left, right) => (
      (left?.order ?? 0) - (right?.order ?? 0)
    ));
    const stepByOrder = new Map(steps.map((step) => [step?.order, step]));
    const providedInputsByStepOrder = new Map();
    const validateProvidedInput = (step, providedInput, pathId) => {
      const action = index.actionById.get(step?.actionId)?.value;
      const { fieldId, provider } = providedInput ?? {};
      const fieldEntry = index.fieldById.get(fieldId);
      const pathContext = pathId ? ` path=${formatValidationValue(pathId)}` : "";
      if (
        !action
        || !list(action.inputFieldIds).includes(fieldId)
        || fieldEntry?.objectId !== action.targetObjectId
      ) {
        errors.push(
          `INVALID_FLOW_INPUT_RESOLUTION ${formatValidationValue(flow?.id)}${pathContext} step=${formatValidationValue(step?.order)} provided field ${formatValidationValue(fieldId)} must be an input owned by the step target`,
        );
      }
      const providerEntries = isRecord(provider) ? Object.entries(provider) : [];
      const matchesAllowSubject = list(action?.permissions).some((permission) => (
        permission?.effect === "ALLOW"
        && providerEntries.length === 1
        && permission?.[providerEntries[0][0]] === providerEntries[0][1]
      ));
      const nonUserProviderIsSystemActor = (
        action?.executionMode === "USER_TASK"
        || provider?.actorRef === "SYSTEM"
        || provider?.actorRef === "AI"
      );
      if (!matchesAllowSubject || !nonUserProviderIsSystemActor) {
        errors.push(
          `INVALID_FLOW_INPUT_PROVIDER ${formatValidationValue(flow?.id)}${pathContext} step=${formatValidationValue(step?.order)} field=${formatValidationValue(fieldId)} provider must match an ALLOW subject for the step action`,
        );
      }
    };
    for (const step of steps) {
      const providedInputs = records(step?.providedInputs);
      providedInputsByStepOrder.set(
        step?.order,
        new Set(providedInputs.map(({ fieldId }) => fieldId)),
      );
      for (const providedInput of providedInputs) {
        validateProvidedInput(step, providedInput);
      }
    }
    const declaredExecutionPaths = list(flow?.executionPaths);
    const requiredRouteKind = new Map([
      ["ACTION_CHOICE_REQUIRED", "ACTION_CHOICE"],
      ["OPTION_VALUE_REQUIRED", "OPTION_VALUE"],
    ]).get(flow?.routingPolicy);
    if (flow?.routingPolicy === "NONE" && Object.hasOwn(flow, "executionPaths")) {
      errors.push(
        `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} NONE routing policy forbids execution paths`,
      );
    }
    if (requiredRouteKind && declaredExecutionPaths.length === 0) {
      errors.push(
        `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} ${formatValidationValue(flow?.routingPolicy)} requires execution paths`,
      );
    }
    if (requiredRouteKind && declaredExecutionPaths.some((executionPath) => (
      executionPath?.route?.kind !== requiredRouteKind
    ))) {
      errors.push(
        `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} ${formatValidationValue(flow?.routingPolicy)} requires ${formatValidationValue(requiredRouteKind)} routes`,
      );
    }
    const executionPaths = declaredExecutionPaths.length > 0
      ? declaredExecutionPaths
      : requiredRouteKind
        ? []
        : [{
        id: "DEFAULT",
        stepOrders: steps.map((step) => step?.order),
        providedInputs: [],
      }];
    if (declaredExecutionPaths.length > 0) {
      const optionRoutePartitions = new Map();
      for (const executionPath of executionPaths) {
        const route = executionPath?.route;
        const consumerStep = stepByOrder.get(route?.consumerStepOrder);
        const consumerAction = index.actionById.get(consumerStep?.actionId)?.value;
        const pathStepOrders = list(executionPath?.stepOrders);
        if (route?.kind === "ACTION_CHOICE") {
          if (
            !consumerStep
            || !consumerAction
            || !pathStepOrders.includes(route.consumerStepOrder)
          ) {
            errors.push(
              `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} path=${formatValidationValue(executionPath?.id)} ACTION_CHOICE must bind one action step in the path`,
            );
          }
          continue;
        }
        if (route?.kind !== "OPTION_VALUE") {
          errors.push(
            `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} path=${formatValidationValue(executionPath?.id)} requires an explicit route`,
          );
          continue;
        }

        const fieldEntry = index.fieldById.get(route?.fieldId);
        const field = fieldEntry?.value;
        const optionSet = field?.valueSource?.kind === "OPTION_SET"
          ? index.optionSetById.get(field.valueSource.optionSetId)?.value
          : undefined;
        const optionValues = list(optionSet?.values);
        const registeredCodes = new Set(
          optionValues.filter(isRecord).map(({ code }) => code).filter(isValidId),
        );
        const consumers = pathStepOrders.map((stepOrder) => ({
          step: stepByOrder.get(stepOrder),
          action: index.actionById.get(stepByOrder.get(stepOrder)?.actionId)?.value,
        })).filter(({ action }) => (
          list(action?.inputFieldIds).includes(route.fieldId)
        ));
        const acceptedBindings = list(consumerAction?.acceptedInputValues).filter((binding) => (
          binding?.fieldId === route.fieldId
          && binding?.optionSetId === field?.valueSource?.optionSetId
        ));
        const acceptedBinding = acceptedBindings.length === 1
          ? acceptedBindings[0]
          : undefined;
        const values = list(route?.values);
        const routeValid = optionSet?.mode === "STATIC"
          && registeredCodes.size === optionValues.length
          && values.length > 0
          && new Set(values).size === values.length
          && values.every((value) => registeredCodes.has(value))
          && pathStepOrders.includes(route.consumerStepOrder)
          && fieldEntry?.objectId === consumerAction?.targetObjectId
          && list(consumerAction?.inputFieldIds).includes(route.fieldId)
          && acceptedBinding
          && values.every((value) => list(acceptedBinding.codes).includes(value))
          && consumers.length === 1
          && consumers[0].step?.order === route.consumerStepOrder;
        if (!routeValid) {
          errors.push(
            `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} path=${formatValidationValue(executionPath?.id)} OPTION_VALUE must bind one accepted action consumer for registered values`,
          );
        }

        if (!acceptedBinding) continue;
        const partitionKey = [
          consumerAction?.targetObjectId,
          route.fieldId,
          acceptedBinding.partitionId,
        ].join("\u0000");
        const partition = optionRoutePartitions.get(partitionKey) ?? {
          registeredCodes,
          routedCodes: new Set(),
          valid: true,
        };
        for (const value of values) {
          if (partition.routedCodes.has(value)) partition.valid = false;
          partition.routedCodes.add(value);
        }
        optionRoutePartitions.set(partitionKey, partition);
      }
      for (const partition of optionRoutePartitions.values()) {
        if (!partition.valid || !setEquals(partition.routedCodes, partition.registeredCodes)) {
          errors.push(
            `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} OPTION_VALUE routes must be disjoint and exhaust each accepted partition`,
          );
        }
      }
    }
    const sourceFieldIdsForResolution = list(flow?.sourceDataRefs).flatMap((dataRef) => (
      [dataRef?.fieldId, dataRef?.version].filter(isValidId)
    ));
    for (const executionPath of executionPaths) {
      const pathProvidedInputsByStepOrder = new Map();
      for (const providedInput of records(executionPath?.providedInputs)) {
        const step = stepByOrder.get(providedInput?.stepOrder);
        if (step) validateProvidedInput(step, providedInput, executionPath?.id);
        const fieldIds = pathProvidedInputsByStepOrder.get(providedInput?.stepOrder)
          ?? new Set();
        fieldIds.add(providedInput?.fieldId);
        pathProvidedInputsByStepOrder.set(providedInput?.stepOrder, fieldIds);
      }
      const availableFieldIds = new Set(sourceFieldIdsForResolution);
      for (const stepOrder of list(executionPath?.stepOrders)) {
        const step = stepByOrder.get(stepOrder);
        const action = index.actionById.get(step?.actionId)?.value;
        if (!action) continue;
        const providedFieldIds = new Set([
          ...(providedInputsByStepOrder.get(stepOrder) ?? []),
          ...(pathProvidedInputsByStepOrder.get(stepOrder) ?? []),
        ]);
        const missingInputFieldIds = list(action.inputFieldIds).filter((fieldId) => (
          !availableFieldIds.has(fieldId) && !providedFieldIds.has(fieldId)
        ));
        if (missingInputFieldIds.length > 0) {
          errors.push(
            `INVALID_FLOW_INPUT_RESOLUTION ${formatValidationValue(flow?.id)} path=${formatValidationValue(executionPath?.id)} step=${formatValidationValue(stepOrder)} action=${formatValidationValue(action.id)} missing ${missingInputFieldIds.map(formatValidationValue).join(",")}`,
          );
        }
        const targetObject = index.objectById.get(action?.targetObjectId)?.value;
        const concreteState = concreteActionState(index, action);
        const missingStateFieldIds = missingActionStateFieldIds(
          index,
          action,
          targetObject,
          providedFieldIds,
        );
        if (missingStateFieldIds.length > 0) {
          errors.push(
            `INVALID_FLOW_TERMINAL_STATE ${formatValidationValue(flow?.id)} path=${formatValidationValue(executionPath?.id)} step=${formatValidationValue(stepOrder)} action=${formatValidationValue(action.id)} state=${formatValidationValue(concreteState)} missing ${missingStateFieldIds.map(formatValidationValue).join(",")}`,
          );
        }
        for (const fieldId of list(action.inputFieldIds)) {
          if (providedFieldIds.has(fieldId)) availableFieldIds.add(fieldId);
        }
        for (const fieldId of list(action.outputFieldIds)) availableFieldIds.add(fieldId);
      }
    }

    for (const targetRef of list(flow?.targetDataRefs)) {
      const produced = stepActions.some((action) => (
        action?.targetObjectId === targetRef?.objectId
        && list(action?.outputFieldIds).includes(targetRef?.fieldId)
      ));
      if (!produced) {
        errors.push(
          `INVALID_FLOW_TARGET_OUTPUT ${formatValidationValue(flow?.id)} -> ${formatValidationValue(targetRef?.objectId)}.${formatValidationValue(targetRef?.fieldId)}`,
        );
      }
    }

    const declaredFailureResults = new Set(
      stepActions.flatMap((action) => list(action?.failureResults)),
    );
    for (const resultCode of list(flow?.retryPolicy?.retryableFailureResults)) {
      if (!declaredFailureResults.has(resultCode)) {
        errors.push(
          `INVALID_FLOW_RETRY_RESULT ${formatValidationValue(flow?.id)} -> ${formatValidationValue(resultCode)}`,
        );
      }
    }

    const sourceRefs = records(flow?.sourceDataRefs);
    const sourceFieldIds = new Set(sourceRefs.map(({ fieldId }) => fieldId));
    const fixedSourceRefs = sourceRefs.filter(({ cardinality }) => cardinality === "ONE");
    const fixedSourceFieldIds = new Set(fixedSourceRefs.map(({ fieldId }) => fieldId));
    const fixedSourceVersionFieldIds = new Set(fixedSourceRefs.map(({ version }) => version));
    const keyParts = flow?.idempotencyKeyParts;
    const identityFieldIds = list(keyParts?.identityFieldIds);
    const versionFieldIds = list(keyParts?.versionFieldIds);
    const producedIdentityFieldIds = identityFieldIds.filter((fieldId) => (
      !fixedSourceFieldIds.has(fieldId)
    ));
    const producedVersionFieldIds = versionFieldIds.filter((fieldId) => (
      !fixedSourceVersionFieldIds.has(fieldId)
    ));
    const hasProducedKeyParts = producedIdentityFieldIds.length > 0
      || producedVersionFieldIds.length > 0;
    const producerCandidates = hasProducedKeyParts
      ? steps.map((step) => ({
        step,
        action: index.actionById.get(step?.actionId)?.value,
      })).filter(({ action }) => {
        const outputFieldIds = new Set(list(action?.outputFieldIds));
        return [...producedIdentityFieldIds, ...producedVersionFieldIds]
          .every((fieldId) => outputFieldIds.has(fieldId));
      })
      : [];
    const producer = producerCandidates.length === 1 ? producerCandidates[0] : undefined;
    const producerObject = index.objectById.get(producer?.action?.targetObjectId)?.value;
    const producerOutputFieldIds = new Set(list(producer?.action?.outputFieldIds));
    const producerObjectFieldIds = new Set(records(producerObject?.fields).map(({ id }) => id));
    const producerIdentityFieldId = objectIdentityFieldId(producerObject);
    const fanoutField = index.fieldById.get(keyParts?.fanoutFieldId)?.value;
    const hasExactSourceLineage = list(producerObject?.lineageBindings).some((binding) => {
      const targetObject = index.objectById.get(binding?.targetObjectId)?.value;
      const targetIdentityFieldId = objectIdentityFieldId(targetObject);
      return producerOutputFieldIds.has(binding?.refFieldId)
        && producerOutputFieldIds.has(binding?.versionFieldId)
        && fixedSourceRefs.some((sourceRef) => (
          sourceRef?.objectId === binding?.targetObjectId
          && sourceRef?.fieldId === targetIdentityFieldId
          && sourceRef?.version === binding?.targetVersionFieldId
        ));
    });
    const producerContractValid = !hasProducedKeyParts || (
      producerCandidates.length === 1
      && producer?.step?.order === 1
      && producer?.action?.operationKind === "CREATE"
      && producedIdentityFieldIds.length > 0
      && producedVersionFieldIds.length > 0
      && producedIdentityFieldIds.every((fieldId) => (
        producerObjectFieldIds.has(fieldId) && producerOutputFieldIds.has(fieldId)
      ))
      && producedVersionFieldIds.every((fieldId) => (
        producerObjectFieldIds.has(fieldId) && producerOutputFieldIds.has(fieldId)
      ))
      && identityFieldIds.includes(producerIdentityFieldId)
      && producerObjectFieldIds.has(keyParts?.fanoutFieldId)
      && producerOutputFieldIds.has(keyParts?.fanoutFieldId)
      && fanoutField?.idempotencyRole === "FANOUT_SET"
      && hasExactSourceLineage
    );
    if (!producerContractValid) {
      errors.push(
        `INVALID_FLOW_IDEMPOTENCY_PRODUCER ${formatValidationValue(flow?.id)} requires one first-step CREATE producer for the version-pinned identity, version, and fanout key fields`,
      );
    }
    const identityRolesValid = identityFieldIds.every((fieldId) => (
      hasStableIdempotencyRole(index, fieldId, ["OBJECT_ID", "OBJECT_REF"])
    ));
    const versionRolesValid = versionFieldIds.every((fieldId) => (
      hasStableIdempotencyRole(index, fieldId, ["OBJECT_VERSION"])
    ));
    const fanoutRoleValid = hasStableIdempotencyRole(
      index,
      keyParts?.fanoutFieldId,
      ["OBJECT_ID", "OBJECT_REF", "FANOUT_SET"],
    );
    const keyPartsDisjoint = identityFieldIds.every((fieldId) => (
      !versionFieldIds.includes(fieldId) && fieldId !== keyParts?.fanoutFieldId
    )) && versionFieldIds.every((fieldId) => fieldId !== keyParts?.fanoutFieldId);
    if (
      identityFieldIds.length === 0
      || identityFieldIds.some((fieldId) => (
        !fixedSourceFieldIds.has(fieldId) && !producerOutputFieldIds.has(fieldId)
      ))
      || !identityRolesValid
      || !versionRolesValid
      || !keyPartsDisjoint
      || [...fixedSourceVersionFieldIds].some((fieldId) => !versionFieldIds.includes(fieldId))
      || producedVersionFieldIds.some((fieldId) => !producerOutputFieldIds.has(fieldId))
      || (
        !sourceFieldIds.has(keyParts?.fanoutFieldId)
        && !producerOutputFieldIds.has(keyParts?.fanoutFieldId)
      )
      || !fanoutRoleValid
      || !producerContractValid
    ) {
      errors.push(
        `INVALID_FLOW_IDEMPOTENCY ${formatValidationValue(flow?.id)} requires disjoint source identity, declared version, and source fanout fields`,
      );
    }
  }
  return errors;
}

function flowProfileErrors(index) {
  const errors = [];
  const sameOrder = (actual, expected) => actual.length === expected.length
    && actual.every((value, position) => value === expected[position]);
  const sameSet = (actual, expected) => setEquals(new Set(actual), new Set(expected));
  const roleSequence = (values) => records(values).map(({ role }) => role);
  const participantModuleByRole = (flow) => new Map(
    records(flow?.participantRoles).map(({ role, moduleId }) => [role, moduleId]),
  );
  const actionForStep = (step) => index.actionById.get(step?.actionId);
  const refsHaveTargetSemantics = (flow, expectedTargetObjectIds) => {
    const targetRefs = records(flow?.targetDataRefs);
    if (!sameSet(
      targetRefs.map(({ objectId }) => objectId),
      expectedTargetObjectIds,
    )) return false;
    const refsByObjectId = new Map();
    for (const dataRef of targetRefs) {
      const values = refsByObjectId.get(dataRef.objectId) ?? [];
      values.push(dataRef);
      refsByObjectId.set(dataRef.objectId, values);
      const fieldEntry = index.fieldById.get(dataRef.fieldId);
      const object = index.objectById.get(dataRef.objectId)?.value;
      const lineageBindings = records(object?.lineageBindings);
      const roleValid = (
        dataRef.semanticRole === "TARGET_IDENTITY"
        && fieldEntry?.value?.idempotencyRole === "OBJECT_ID"
      ) || (
        dataRef.semanticRole === "TARGET_VERSION"
        && fieldEntry?.value?.idempotencyRole === "OBJECT_VERSION"
        && dataRef.fieldId === dataRef.version
      ) || (
        dataRef.semanticRole === "TARGET_LINEAGE"
        && lineageBindings.some((binding) => (
          binding?.refFieldId === dataRef.fieldId
          || binding?.versionFieldId === dataRef.fieldId
        ))
      ) || dataRef.semanticRole === "TARGET_PAYLOAD" || (
        dataRef.semanticRole === "TARGET_STATE"
        && fieldEntry?.value?.valueSource?.kind === "SYSTEM"
        && fieldEntry.value.mutability === "SYSTEM_MANAGED"
      );
      if (fieldEntry?.objectId !== dataRef.objectId || !roleValid) return false;
    }
    return expectedTargetObjectIds.every((objectId) => {
      const objectRefs = refsByObjectId.get(objectId) ?? [];
      return objectRefs.filter(({ semanticRole }) => semanticRole === "TARGET_IDENTITY").length
          === 1
        && objectRefs.filter(({ semanticRole }) => semanticRole === "TARGET_VERSION").length
          === 1;
    });
  };
  const sourceRefRoleValid = (dataRef, requiredFanoutFieldId) => {
    const fieldEntry = index.fieldById.get(dataRef?.fieldId);
    if (fieldEntry?.objectId !== dataRef?.objectId) return false;
    if (dataRef.semanticRole === "SOURCE_IDENTITY") {
      return fieldEntry.value?.idempotencyRole === "OBJECT_ID";
    }
    if (dataRef.semanticRole === "SOURCE_VERSION") {
      return fieldEntry.value?.idempotencyRole === "OBJECT_VERSION"
        && dataRef.fieldId === dataRef.version;
    }
    if (dataRef.semanticRole === "SOURCE_FANOUT") {
      return dataRef.fieldId === requiredFanoutFieldId
        && fieldEntry.value?.dataType === "ID"
        && fieldEntry.value?.valueSource?.kind === "OBJECT_REF"
        && fieldEntry.value?.mutability === "IMMUTABLE";
    }
    return dataRef.semanticRole === "SOURCE_PAYLOAD";
  };
  const policyMatches = (flow, expected) => (
    flow?.failureGranularity === expected.failureGranularity
    && hasExactKeys(flow?.retryPolicy, [
      "strategy",
      "maxAttempts",
      "retryableFailureResults",
    ])
    && flow.retryPolicy.strategy === expected.retryStrategy
    && flow.retryPolicy.maxAttempts === 4
    && sameSet(
      list(flow.retryPolicy.retryableFailureResults),
      expected.retryableFailureResults,
    )
    && flow?.compensation?.strategy === expected.compensationStrategy
    && flow?.downstreamInvalidation?.strategy === expected.invalidationStrategy
  );

  for (const flowEntry of index.flows) {
    const flow = flowEntry.value;
    if (flow?.contractProfile === "LEARNING_PATH_AGGREGATION") {
      const participantRoles = [
        "PUBLISHED_RESULT_SOURCE",
        "EVIDENCE_SOURCE",
        "CORRECTION_SOURCE",
        "PLAN_EXECUTION_SOURCE",
        "TEACHER_CONFIRMATION_SOURCE",
        "LEARNING_PATH_DERIVATION",
      ];
      const sourceRoles = participantRoles.slice(0, -1);
      const stepRoles = [
        "APPEND_PUBLISHED_RESULT",
        "APPEND_EVIDENCE",
        "APPEND_CORRECTION",
        "APPEND_PLAN_EXECUTION",
        "APPEND_TEACHER_CONFIRMATION",
        "CREATE_INTERPRETATION_CANDIDATE",
      ];
      const participants = records(flow.participantRoles);
      const moduleByRole = participantModuleByRole(flow);
      const steps = records(flow.steps);
      const paths = records(flow.executionPaths);
      const sourceRefs = records(flow.sourceDataRefs);
      const derivationModuleId = moduleByRole.get("LEARNING_PATH_DERIVATION");
      const sourceModuleIds = sourceRoles.map((role) => moduleByRole.get(role));
      let valid = sameOrder(roleSequence(participants), participantRoles)
        && sameOrder(participants.map(({ moduleId }) => moduleId), list(flow.moduleIds))
        && sameOrder(list(flow.sourceOnlyModuleIds), sourceModuleIds)
        && sameOrder(steps.map(({ semanticRole }) => semanticRole), stepRoles)
        && sameOrder(paths.map(({ semanticRole }) => semanticRole), sourceRoles)
        && steps.length === stepRoles.length
        && paths.length === sourceRoles.length;

      let timelineObjectId;
      for (let position = 0; position < sourceRoles.length; position += 1) {
        const sourceRole = sourceRoles[position];
        const step = steps[position];
        const actionEntry = actionForStep(step);
        const action = actionEntry?.value;
        const path = paths.find(({ semanticRole }) => semanticRole === sourceRole);
        const bindings = records(path?.sourceBindings);
        const binding = bindings[0];
        const sourceObjectEntry = index.objectById.get(binding?.sourceObjectId);
        const targetObject = index.objectById.get(action?.targetObjectId)?.value;
        const targetLineage = records(targetObject?.lineageBindings);
        const objectSourceRefs = sourceRefs.filter(({ objectId }) => (
          objectId === binding?.sourceObjectId
        ));
        const sourceRefByRole = new Map(objectSourceRefs.map((dataRef) => [
          dataRef.semanticRole,
          dataRef,
        ]));
        const identityRef = sourceRefByRole.get("SOURCE_IDENTITY");
        const versionRef = sourceRefByRole.get("SOURCE_VERSION");
        const fanoutRef = sourceRefByRole.get("SOURCE_FANOUT");
        if (position === 0) timelineObjectId = action?.targetObjectId;
        valid = valid
          && actionEntry?.moduleId === derivationModuleId
          && action?.operationKind === "CREATE"
          && action?.writes === true
          && action?.targetObjectId === timelineObjectId
          && path?.route?.kind === "ACTION_CHOICE"
          && path.route.consumerStepOrder === step?.order
          && list(path?.stepOrders).includes(step?.order)
          && bindings.length === 1
          && sourceObjectEntry?.moduleId === moduleByRole.get(sourceRole)
          && index.fieldById.get(binding?.sourceIdentityFieldId)?.objectId
            === binding?.sourceObjectId
          && index.fieldById.get(binding?.sourceVersionFieldId)?.objectId
            === binding?.sourceObjectId
          && list(action?.outputFieldIds).includes(binding?.targetRefFieldId)
          && list(action?.outputFieldIds).includes(binding?.targetVersionFieldId)
          && targetLineage.some((lineage) => (
            lineage?.refFieldId === binding?.targetRefFieldId
            && lineage?.versionFieldId === binding?.targetVersionFieldId
            && lineage?.targetObjectId === binding?.sourceObjectId
            && lineage?.targetVersionFieldId === binding?.sourceVersionFieldId
          ))
          && objectSourceRefs.length === 3
          && identityRef?.fieldId === binding?.sourceIdentityFieldId
          && versionRef?.fieldId === binding?.sourceVersionFieldId
          && sourceRefRoleValid(fanoutRef, path?.idempotencyKeyParts?.fanoutFieldId)
          && sourceRefRoleValid(identityRef)
          && sourceRefRoleValid(versionRef)
          && sameOrder(
            list(path?.idempotencyKeyParts?.identityFieldIds),
            [binding?.sourceIdentityFieldId],
          )
          && sameOrder(
            list(path?.idempotencyKeyParts?.versionFieldIds),
            [binding?.sourceVersionFieldId],
          );
      }

      const interpretationActionEntry = actionForStep(steps.at(-1));
      const interpretationAction = interpretationActionEntry?.value;
      const evidencePath = paths.find(({ semanticRole }) => semanticRole === "EVIDENCE_SOURCE");
      const writeTargetObjectIds = [...new Set(steps.map((step) => (
        actionForStep(step)?.value?.targetObjectId
      )).filter(isValidId))];
      valid = valid
        && interpretationActionEntry?.moduleId === derivationModuleId
        && interpretationAction?.operationKind === "CREATE"
        && interpretationAction?.writes === true
        && interpretationAction?.targetObjectId !== timelineObjectId
        && sameOrder(
          list(flow?.idempotencyKeyParts?.identityFieldIds),
          list(evidencePath?.idempotencyKeyParts?.identityFieldIds),
        )
        && sameOrder(
          list(flow?.idempotencyKeyParts?.versionFieldIds),
          list(evidencePath?.idempotencyKeyParts?.versionFieldIds),
        )
        && flow?.idempotencyKeyParts?.fanoutFieldId
          === evidencePath?.idempotencyKeyParts?.fanoutFieldId
        && refsHaveTargetSemantics(flow, writeTargetObjectIds)
        && policyMatches(flow, {
          failureGranularity: "STUDENT_SOURCE_FACT_VERSION",
          retryStrategy: "REFRESH_SELECTED_SOURCE_VERSION_AND_RETRY_FAILED_PATH_OBJECTS",
          retryableFailureResults: ["SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
          compensationStrategy: "KEEP_ACCEPTED_SOURCE_FACT_AND_RETRY_ONLY_FAILED_DERIVED_OBJECTS",
          invalidationStrategy: "SUPERSEDE_OR_MARK_STALE_BY_SOURCE_VERSION",
        });
      if (!valid) {
        errors.push(
          `INVALID_FLOW_PROFILE ${formatValidationValue(flow?.id)} violates the LEARNING_PATH_AGGREGATION semantic role contract`,
        );
      }
    }

    if (flow?.contractProfile === "REPORT_MATERIALIZATION") {
      const participantRoles = [
        "STUDENT_EXECUTION_SOURCE",
        "PLAN_COORDINATION_SOURCE",
        "REPORT_PIPELINE",
        "NOTIFICATION_SINK",
      ];
      const stepRoles = [
        "READ_STUDENT_EXECUTION",
        "READ_PLAN_COORDINATION",
        "CREATE_AD_HOC_RUN",
        "CREATE_PERIODIC_RUN",
        "START_RUN",
        "COMPLETE_RUN",
        "MATERIALIZE_SNAPSHOT",
        "CREATE_DELIVERY",
        "CREATE_NOTIFICATION",
      ];
      const pathRoles = ["AD_HOC_RUN", "PERIODIC_RUN"];
      const participants = records(flow.participantRoles);
      const moduleByRole = participantModuleByRole(flow);
      const steps = records(flow.steps);
      const stepByRole = new Map(steps.map((step) => [step.semanticRole, step]));
      const paths = records(flow.executionPaths);
      const pathByRole = new Map(paths.map((path) => [path.semanticRole, path]));
      const actionByRole = new Map(steps.map((step) => [
        step.semanticRole,
        actionForStep(step),
      ]));
      const reportModuleId = moduleByRole.get("REPORT_PIPELINE");
      const notificationModuleId = moduleByRole.get("NOTIFICATION_SINK");
      const adHocPath = pathByRole.get("AD_HOC_RUN");
      const periodicPath = pathByRole.get("PERIODIC_RUN");
      const adHocRun = actionByRole.get("CREATE_AD_HOC_RUN")?.value;
      const periodicRun = actionByRole.get("CREATE_PERIODIC_RUN")?.value;
      const runObjectId = adHocRun?.targetObjectId;
      let valid = sameOrder(roleSequence(participants), participantRoles)
        && sameOrder(participants.map(({ moduleId }) => moduleId), list(flow.moduleIds))
        && sameOrder(steps.map(({ semanticRole }) => semanticRole), stepRoles)
        && sameOrder(paths.map(({ semanticRole }) => semanticRole), pathRoles)
        && !Object.hasOwn(flow, "sourceOnlyModuleIds")
        && actionByRole.get("READ_STUDENT_EXECUTION")?.moduleId
          === moduleByRole.get("STUDENT_EXECUTION_SOURCE")
        && actionByRole.get("READ_PLAN_COORDINATION")?.moduleId
          === moduleByRole.get("PLAN_COORDINATION_SOURCE")
        && ["READ_STUDENT_EXECUTION", "READ_PLAN_COORDINATION"].every((role) => {
          const action = actionByRole.get(role)?.value;
          return action?.operationKind === "READ" && action?.writes === false;
        })
        && ["CREATE_AD_HOC_RUN", "CREATE_PERIODIC_RUN"].every((role) => {
          const actionEntry = actionByRole.get(role);
          return actionEntry?.moduleId === reportModuleId
            && actionEntry.value?.operationKind === "CREATE"
            && actionEntry.value?.writes === true
            && actionEntry.value?.targetObjectId === runObjectId;
        });

      const pathValid = (path, runAction, expectedBindingCount) => {
        const routeStep = steps.find(({ order }) => order === path?.route?.consumerStepOrder);
        const bindings = records(path?.sourceBindings);
        const bindingIdentityIds = bindings.map(({ sourceIdentityFieldId }) => (
          sourceIdentityFieldId
        ));
        const bindingVersionIds = bindings.map(({ sourceVersionFieldId }) => (
          sourceVersionFieldId
        ));
        const extraIdentityIds = bindingIdentityIds.filter((fieldId) => (
          !list(flow?.idempotencyKeyParts?.identityFieldIds).includes(fieldId)
        ));
        const extraVersionIds = bindingVersionIds.filter((fieldId) => (
          !list(flow?.idempotencyKeyParts?.versionFieldIds).includes(fieldId)
        ));
        return routeStep?.actionId === runAction?.id
          && list(path?.stepOrders).map((order) => (
            steps.find((step) => step.order === order)?.semanticRole
          )).join("|") === [
            "READ_STUDENT_EXECUTION",
            "READ_PLAN_COORDINATION",
            path?.semanticRole === "AD_HOC_RUN" ? "CREATE_AD_HOC_RUN" : "CREATE_PERIODIC_RUN",
            "START_RUN",
            "COMPLETE_RUN",
            "MATERIALIZE_SNAPSHOT",
            "CREATE_DELIVERY",
            "CREATE_NOTIFICATION",
          ].join("|")
          && bindings.length === expectedBindingCount
          && bindings.every((binding) => (
            index.objectById.get(binding?.sourceObjectId)?.moduleId === reportModuleId
            && index.fieldById.get(binding?.sourceIdentityFieldId)?.objectId
              === binding.sourceObjectId
            && index.fieldById.get(binding?.sourceVersionFieldId)?.objectId
              === binding.sourceObjectId
            && index.fieldById.get(binding?.targetRefFieldId)?.objectId === runObjectId
            && index.fieldById.get(binding?.targetVersionFieldId)?.objectId === runObjectId
            && list(runAction?.inputFieldIds).includes(binding.targetRefFieldId)
            && list(runAction?.inputFieldIds).includes(binding.targetVersionFieldId)
            && [binding.targetRefFieldId, binding.targetVersionFieldId]
              .every((fieldId) => {
                const required = index.fieldById.get(fieldId)?.value?.required;
                const persistsForAction = isRecord(required)
                  && list(required.whenActionIds).includes(runAction?.id);
                return list(runAction?.outputFieldIds).includes(fieldId) === persistsForAction;
              })
          ))
          && sameSet(
            list(path?.idempotencyKeyParts?.identityFieldIds),
            [...list(flow?.idempotencyKeyParts?.identityFieldIds), ...extraIdentityIds],
          )
          && sameSet(
            list(path?.idempotencyKeyParts?.versionFieldIds),
            [...list(flow?.idempotencyKeyParts?.versionFieldIds), ...extraVersionIds],
          )
          && path?.idempotencyKeyParts?.fanoutFieldId
            === flow?.idempotencyKeyParts?.fanoutFieldId;
      };
      valid = valid && pathValid(adHocPath, adHocRun, 1)
        && pathValid(periodicPath, periodicRun, 2);

      const startRun = actionByRole.get("START_RUN")?.value;
      const completeRun = actionByRole.get("COMPLETE_RUN")?.value;
      const snapshotAction = actionByRole.get("MATERIALIZE_SNAPSHOT")?.value;
      const deliveryAction = actionByRole.get("CREATE_DELIVERY")?.value;
      const notificationAction = actionByRole.get("CREATE_NOTIFICATION")?.value;
      const snapshotObject = index.objectById.get(snapshotAction?.targetObjectId)?.value;
      const deliveryObject = index.objectById.get(deliveryAction?.targetObjectId)?.value;
      const notificationObject = index.objectById.get(notificationAction?.targetObjectId)?.value;
      valid = valid
        && [startRun, completeRun].every((action) => (
          action?.operationKind === "UPDATE"
          && action?.writes === true
          && action?.targetObjectId === runObjectId
        ))
        && startRun?.transition?.from === "QUEUED"
        && startRun?.transition?.to === "RUNNING"
        && completeRun?.transition?.from === "RUNNING"
        && completeRun?.transition?.to === "SUCCEEDED"
        && actionByRole.get("MATERIALIZE_SNAPSHOT")?.moduleId === reportModuleId
        && snapshotAction?.operationKind === "CREATE"
        && snapshotAction?.targetObjectId !== runObjectId
        && records(snapshotObject?.lineageBindings).some(({ targetObjectId }) => (
          targetObjectId === runObjectId
        ))
        && actionByRole.get("CREATE_DELIVERY")?.moduleId === reportModuleId
        && deliveryAction?.operationKind === "CREATE"
        && records(deliveryObject?.lineageBindings).some(({ targetObjectId }) => (
          targetObjectId === snapshotAction?.targetObjectId
        ))
        && deliveryObject?.channelPolicy?.mode === "PHASE_ONE_CLOSED"
        && actionByRole.get("CREATE_NOTIFICATION")?.moduleId === notificationModuleId
        && notificationAction?.operationKind === "CREATE"
        && notificationObject?.channelPolicy?.mode === "PHASE_ONE_CLOSED";

      const sourceRefs = records(flow.sourceDataRefs);
      const sourceRefByFieldId = new Map(sourceRefs.map((dataRef) => [dataRef.fieldId, dataRef]));
      const fanoutRef = sourceRefs.find(({ semanticRole }) => semanticRole === "SOURCE_FANOUT");
      const sourceModules = new Set(sourceRefs.map(({ objectId }) => (
        index.objectById.get(objectId)?.moduleId
      )));
      valid = valid
        && sourceRefs.every((dataRef) => sourceRefRoleValid(
          dataRef,
          flow?.idempotencyKeyParts?.fanoutFieldId,
        ))
        && sourceRefs.filter(({ semanticRole }) => semanticRole === "SOURCE_FANOUT").length === 1
        && fanoutRef?.fieldId === flow?.idempotencyKeyParts?.fanoutFieldId
        && sameSet(
          [...sourceModules],
          [
            moduleByRole.get("STUDENT_EXECUTION_SOURCE"),
            moduleByRole.get("PLAN_COORDINATION_SOURCE"),
            reportModuleId,
          ],
        )
        && [adHocPath, periodicPath].every((path) => records(path?.sourceBindings)
          .every((binding) => (
            sourceRefByFieldId.get(binding?.sourceIdentityFieldId)?.semanticRole
              === "SOURCE_IDENTITY"
            && sourceRefByFieldId.get(binding?.sourceVersionFieldId)?.semanticRole
              === "SOURCE_VERSION"
          )))
        && list(flow?.idempotencyKeyParts?.identityFieldIds).every((fieldId) => (
          sourceRefByFieldId.get(fieldId)?.semanticRole === "SOURCE_IDENTITY"
        ))
        && list(flow?.idempotencyKeyParts?.versionFieldIds).every((fieldId) => (
          sourceRefByFieldId.get(fieldId)?.semanticRole === "SOURCE_VERSION"
        ));
      const writeTargetObjectIds = [...new Set(stepRoles.slice(2).map((role) => (
        actionByRole.get(role)?.value?.targetObjectId
      )).filter(isValidId))];
      valid = valid
        && refsHaveTargetSemantics(flow, writeTargetObjectIds)
        && policyMatches(flow, {
          failureGranularity: "REPORT_RUN_SNAPSHOT_DELIVERY_AND_NOTIFICATION_OBJECT",
          retryStrategy: "RECHECK_PERMISSION_REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_OUTPUTS",
          retryableFailureResults: [
            "SOURCE_VERSION_STALE",
            "DELIVERY_FAILED",
            "VERSION_CONFLICT",
          ],
          compensationStrategy: "KEEP_SOURCE_EXECUTION_RUN_AND_SNAPSHOT_WHILE_RETRYING_DELIVERY_ONLY",
          invalidationStrategy: "CREATE_A_NEW_RUN_FOR_NEW_SOURCE_VERSIONS",
        });
      if (!valid) {
        errors.push(
          `INVALID_FLOW_PROFILE ${formatValidationValue(flow?.id)} violates the REPORT_MATERIALIZATION semantic role contract`,
        );
      }
    }
  }
  return errors;
}

function aiTaskErrors(index) {
  const errors = [];
  const dutyRoleById = new Map(index.duties.map(({ value }) => [value?.id, value?.roleId]));
  const draftPurposeProfiles = records(
    index.moduleById.get("AIX-001")?.value?.draftPurposeProfiles,
  );
  const draftTasks = index.aiTasks
    .filter(({ value }) => value?.taskType === "DRAFT")
    .map(({ value }) => value);
  const draftProfileTaskIds = draftPurposeProfiles.map(({ taskId }) => taskId);
  if (
    draftPurposeProfiles.length !== draftTasks.length
    || new Set(draftProfileTaskIds).size !== draftProfileTaskIds.length
    || draftTasks.some((task) => !draftProfileTaskIds.includes(task.id))
    || draftPurposeProfiles.some((profile) => (
      !draftTasks.some((task) => task.id === profile.taskId)
    ))
  ) {
    errors.push(
      "INVALID_AI_DRAFT_PURPOSE AIX-001 must declare exactly one independent profile for every DRAFT task",
    );
  }
  const permissionMatchesUserSubject = (permission, subject) => {
    if (permission.actorRef === "CURRENT_ACTOR") return true;
    if (permission.actorRef === "SYSTEM" || permission.actorRef === "AI") return false;
    if (subject.roleRef) {
      return permission.roleRef === subject.roleRef;
    }
    if (subject.dutyRef) {
      return permission.dutyRef === subject.dutyRef
        || permission.roleRef === dutyRoleById.get(subject.dutyRef);
    }
    return false;
  };
  const permissionScopesOverlap = (left, right) => {
    if (!isRecord(left?.scope) || !isRecord(right?.scope)) return true;
    if (
      left.scope.subjectFieldId === right.scope.subjectFieldId
      && new Set([left.scope.kind, right.scope.kind]).size === 2
      && [left.scope.kind, right.scope.kind].every((kind) => (
        ["OWN_RECORD", "OTHER_RECORD"].includes(kind)
      ))
    ) return false;
    return true;
  };
  const subjectIsAuthorized = (permissions, subject) => {
    const matchingAllows = permissions.filter((permission) => (
      permission?.effect === "ALLOW"
      && permissionMatchesUserSubject(permission, subject)
    ));
    return matchingAllows.length > 0
      && !permissions.some((permission) => (
      permission?.effect === "DENY"
      && permissionMatchesUserSubject(permission, subject)
      && matchingAllows.some((allow) => permissionScopesOverlap(allow, permission))
      ));
  };
  for (const taskEntry of index.aiTasks) {
    const task = taskEntry.value;
    const targetActionEntry = index.actionById.get(task?.actionId);
    const targetAction = targetActionEntry?.value;
    const writesMatch = typeof task?.writes === "boolean"
      && typeof targetAction?.writes === "boolean"
      && task.writes === targetAction.writes;
    const readContractValid = !["QUERY", "ANALYSIS"].includes(task?.taskType)
      || (task?.writes === false && task?.risk === "READ");
    const clientsMatch = targetAction?.executionMode === "USER_TASK"
      && list(task?.clients).every((client) => list(targetAction?.clients).includes(client));
    const riskMatches = task?.risk === targetAction?.risk;
    if (
      targetActionEntry
      && (!writesMatch || !readContractValid || !clientsMatch || !riskMatches)
    ) {
      errors.push(
        `INVALID_AI_TARGET_ACTION ${formatValidationValue(task?.id)} must match the target Action write, risk, and client contract`,
      );
    }
    if (
      task?.capability !== AI_TASK_CAPABILITIES.get(task?.taskType)
      || task?.capability !== targetAction?.capability
    ) {
      errors.push(
        `INVALID_AI_TASK_CAPABILITY ${formatValidationValue(task?.id)} must match its task type and target Action capability`,
      );
    }

    if (targetActionEntry) {
      const permissions = records(targetAction?.permissions);
      const audiences = [
        ...list(task?.roleRefs).map((roleRef) => ({ roleRef })),
        ...list(task?.dutyRefs).map((dutyRef) => ({ dutyRef })),
      ];
      if (
        audiences.length === 0
        || audiences.some((subject) => (
          !subjectIsAuthorized(permissions, subject)
        ))
      ) {
        errors.push(
          `INVALID_AI_ACTOR_AUTHORIZATION ${formatValidationValue(task?.id)} audiences must be allowed by the target Action`,
        );
      }
      if (
        task?.writes === true
        && !subjectIsAuthorized(
          permissions,
          task?.confirmer?.mode === "DUTY"
            ? { dutyRef: task.confirmer.dutyRef }
            : { roleRef: task?.confirmer?.roleRef },
        )
      ) {
        errors.push(
          `INVALID_AI_CONFIRMER_AUTHORIZATION ${formatValidationValue(task?.id)} confirmer must be allowed by the target Action`,
        );
      }
    }

    if (
      task?.taskType === "PERIODIC"
      && (
        targetActionEntry?.moduleId !== "RPT-001"
        || targetAction?.targetObjectId !== "RPT-OBJ-SUBSCRIPTION"
        || !PERIODIC_REPORT_ACTION_IDS.has(task?.actionId)
      )
    ) {
      errors.push(
        `INVALID_AI_PERIODIC_TARGET ${formatValidationValue(task?.id)} may manage only report subscriptions`,
      );
    }

    if (task?.taskType === "DRAFT") {
      const draftPolicy = task?.draftPolicy;
      const draftPurpose = task?.draftPurpose;
      const targetDraftPurpose = targetAction?.draftPurpose;
      const targetObject = index.objectById.get(targetAction?.targetObjectId)?.value;
      const targetLifecycle = index.lifecyclePolicyById
        .get(targetObject?.lifecyclePolicyId)?.value;
      const purposeProfiles = draftPurposeProfiles
        .filter(({ taskId }) => taskId === task?.id);
      const purposeProfile = purposeProfiles[0];
      const successStates = index.scenarios
        .filter(({ value }) => (
          value?.actionId === targetAction?.id
          && value?.kind === "SUCCESS"
          && value?.then?.expectedState?.mode === "STATE"
        ))
        .map(({ value }) => value.then.expectedState.value);
      const previewActionEntry = index.actionById.get(draftPolicy?.previewActionId);
      const previewObjectEntry = index.objectById.get(draftPolicy?.previewObjectId);
      const targetIsTemporaryAixPreview = targetActionEntry?.moduleId === "AIX-001"
        && targetAction?.targetObjectId === "AIX-OBJ-TASK-PREVIEW"
        && targetAction?.operationKind === "CREATE"
        && draftPolicy?.previewActionId === task?.actionId;
      const targetUsesSeparateAixPreview = targetActionEntry?.moduleId !== "AIX-001"
        && draftPolicy?.previewActionId === "AIX-ACT-PREPARE-TASK-PREVIEW";
      const draftPolicyValid = (targetIsTemporaryAixPreview || targetUsesSeparateAixPreview)
        && draftPolicy?.previewObjectId === "AIX-OBJ-TASK-PREVIEW"
        && draftPolicy.confirmationRequired === true
        && draftPolicy.businessWriteBeforeConfirmation === false
        && previewActionEntry?.moduleId === "AIX-001"
        && previewActionEntry.value?.targetObjectId === draftPolicy.previewObjectId
        && previewObjectEntry?.moduleId === "AIX-001"
        && previewObjectEntry.value?.lifecyclePolicyId === "LIFE-005";
      if (!draftPolicyValid) {
        errors.push(
          `INVALID_AI_DRAFT_POLICY ${formatValidationValue(task?.id)} must remain a temporary AIX preview until authorized confirmation`,
        );
      }
      const purposeKeys = [
        "contentKind",
        "effectBoundary",
        "targetLifecyclePolicyId",
        "targetStateId",
      ];
      const draftPurposeValid = hasExactKeys(draftPurpose, purposeKeys)
        && hasExactKeys(targetDraftPurpose, purposeKeys)
        && purposeProfiles.length === 1
        && purposeKeys.every((key) => draftPurpose[key] === targetDraftPurpose[key])
        && purposeProfile?.actionId === task?.actionId
        && purposeProfile?.targetObjectId === targetAction?.targetObjectId
        && purposeKeys.every((key) => draftPurpose[key] === purposeProfile?.[key])
        && targetAction?.operationKind === "CREATE"
        && targetObject?.lifecyclePolicyId === draftPurpose?.targetLifecyclePolicyId
        && successStates.length > 0
        && successStates.every((state) => state === draftPurpose?.targetStateId)
        && (
          (
            draftPurpose?.effectBoundary === "BUSINESS_DRAFT_ONLY"
            && targetLifecycle?.scope === "VERSIONED_TEACHING_FACTS"
            && draftPurpose?.targetStateId === "DRAFT"
          )
          || (
            draftPurpose?.effectBoundary === "TEMPORARY_PREVIEW_ONLY"
            && targetLifecycle?.scope === "TEMPORARY_AI_PREVIEWS"
            && draftPolicy?.previewActionId === task?.actionId
          )
        );
      if (!draftPurposeValid) {
        errors.push(
          `INVALID_AI_DRAFT_PURPOSE ${formatValidationValue(task?.id)} must bind its content purpose to a CREATE Action with the declared lifecycle and effect boundary`,
        );
      }
    }

    if (list(task?.roleRefs).includes("ROLE-STUDENT")) {
      const policy = task?.studentAccessPolicy;
      const policyValid = isRecord(policy)
        && ["answer", "explanation", "score", "feedback"]
          .every((property) => policy[property] === "OPEN_CONTENT_ONLY")
        && policy.sourceVersionRequired === true;
      if (!policyValid) {
        errors.push(
          `MISSING_AI_STUDENT_POLICY ${formatValidationValue(task?.id)} must enforce every content-open gate and source version`,
        );
      }
    }

    if (!task?.writes) continue;
    const registeredConfirmer = task?.confirmerRef === (
      task?.confirmer?.mode === "DUTY"
        ? task.confirmer.dutyRef
        : task?.confirmer?.mode === "ROLE"
          ? task.confirmer.roleRef
          : undefined
    ) && (
      (task?.confirmer?.mode === "DUTY" && index.dutyIds.has(task.confirmer.dutyRef))
      || (task?.confirmer?.mode === "ROLE" && index.roleIds.has(task.confirmer.roleRef))
    );
    const previewFieldIds = new Set(list(task?.previewFieldIds));
    const previewComplete = list(targetAction?.inputFieldIds)
      .every((fieldId) => previewFieldIds.has(fieldId));
    if (previewFieldIds.size === 0 || !previewComplete || !registeredConfirmer) {
      errors.push(
        `AI_WRITE_WITHOUT_CONFIRMATION ${formatValidationValue(task?.id)} requires preview fields and an authorized confirmer`,
      );
    }
  }
  return errors;
}

function reportErrors(index) {
  const reportModule = index.moduleById.get("RPT-001")?.value;
  if (!reportModule) return [];
  const errors = [];
  const objectById = new Map(records(reportModule.objects).map((object) => [object.id, object]));
  const requiredObjectIds = [
    "RPT-OBJ-DEFINITION",
    "RPT-OBJ-SUBSCRIPTION",
    "RPT-OBJ-RUN",
    "RPT-OBJ-SNAPSHOT",
    "RPT-OBJ-DELIVERY",
  ];
  const fieldRequirements = new Map([
    ["RPT-OBJ-DEFINITION", [
      "RPT-DEFINITION-F-NAME",
      "RPT-DEFINITION-F-METRIC-IDS",
      "RPT-DEFINITION-F-DATA-SCOPE",
      "RPT-DEFINITION-F-TIME-RANGE",
    ]],
    ["RPT-OBJ-SUBSCRIPTION", [
      "RPT-SUBSCRIPTION-F-SCHEDULE-FREQUENCY",
      "RPT-SUBSCRIPTION-F-EXECUTION-TIME",
      "RPT-SUBSCRIPTION-F-TIMEZONE",
      "RPT-SUBSCRIPTION-F-RECIPIENTS",
    ]],
    ["RPT-OBJ-RUN", [
      "RPT-RUN-F-DATA-CUTOFF",
      "RPT-RUN-F-PERMISSION-RESULT",
      "RPT-RUN-F-SOURCE-VERSIONS",
      "RPT-RUN-F-RESULT",
    ]],
    ["RPT-OBJ-DELIVERY", ["RPT-DELIVERY-F-STATE"]],
  ]);
  const objectContractValid = setEquals(
    new Set(objectById.keys()),
    new Set(requiredObjectIds),
  ) && [...fieldRequirements].every(([objectId, fieldIds]) => {
    const actualFieldIds = new Set(records(objectById.get(objectId)?.fields).map(({ id }) => id));
    return fieldIds.every((fieldId) => actualFieldIds.has(fieldId));
  });

  const subscription = objectById.get("RPT-OBJ-SUBSCRIPTION");
  const run = objectById.get("RPT-OBJ-RUN");
  const delivery = objectById.get("RPT-OBJ-DELIVERY");
  const lifecycleValid = setEquals(
    stateIds(subscription),
    new Set(["ACTIVE", "PAUSED", "CANCELLED"]),
  ) && setEquals(
    stateIds(run),
    new Set(["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "BLOCKED_PERMISSION"]),
  ) && setEquals(
    stateIds(delivery),
    new Set(["PENDING", "DELIVERED", "FAILED"]),
  ) && run?.stateReachability?.mode === "ACTION_GRAPH"
    && delivery?.stateReachability?.mode === "ACTION_GRAPH"
    && hasExactKeys(reportModule.lifecycleBoundaries, [
      "subscriptionObjectId",
      "runObjectId",
      "sharedStateMachine",
    ])
    && reportModule.lifecycleBoundaries.subscriptionObjectId === "RPT-OBJ-SUBSCRIPTION"
    && reportModule.lifecycleBoundaries.runObjectId === "RPT-OBJ-RUN"
    && reportModule.lifecycleBoundaries.sharedStateMachine === false;

  const policy = run?.executionPolicy;
  const runPolicyValid = hasExactKeys(policy, [
    "permissionCheck",
    "dataCutoff",
    "permissionFailureState",
    "permissionFailureActionId",
    "sourceVersionCapture",
  ])
    && policy.permissionCheck === "RECHECK_EACH_RUN"
    && policy.dataCutoff === "RESOLVE_AT_RUN_START"
    && policy.permissionFailureState === "BLOCKED_PERMISSION"
    && policy.permissionFailureActionId === "RPT-ACT-BLOCK-RUN-PERMISSION"
    && policy.sourceVersionCapture === "PIN_BEFORE_QUERY";

  const snapshot = objectById.get("RPT-OBJ-SNAPSHOT");
  const runRef = records(snapshot?.fields).find(({ id }) => id === "RPT-SNAPSHOT-F-RUN-REF");
  const snapshotPinValid = runRef?.valueSource?.kind === "OBJECT_REF"
    && runRef.valueSource.targetObjectId === "RPT-OBJ-RUN"
    && runRef.referenceIntegrity === "VERSION_PINNED"
    && runRef.versionBinding?.versionFieldId === "RPT-SNAPSHOT-F-RUN-VERSION"
    && runRef.versionBinding?.targetVersionFieldId === "RPT-RUN-F-VERSION"
    && records(snapshot?.fields).some(({ id }) => id === "RPT-SNAPSHOT-F-SOURCE-VERSIONS")
    && list(snapshot?.lineageBindings).some((binding) => (
      binding?.refFieldId === "RPT-SNAPSHOT-F-RUN-REF"
      && binding?.versionFieldId === "RPT-SNAPSHOT-F-RUN-VERSION"
      && binding?.targetObjectId === "RPT-OBJ-RUN"
      && binding?.targetVersionFieldId === "RPT-RUN-F-VERSION"
    ));

  const horizonValid = hasExactKeys(reportModule.timeHorizons, ["adHoc", "periodic"])
    && reportModule.timeHorizons.adHoc
      === "SESSION_ANALYSIS_SAVED_ONLY_ON_CONFIRMATION"
    && reportModule.timeHorizons.periodic
      === "SUBSCRIPTION_WITH_INDEPENDENT_RUN_SNAPSHOT_AND_DELIVERY"
    && index.moduleById.get("LPATH-001")?.value?.timeHorizon
      === "CROSS_TERM_APPEND_ONLY_LONG_TERM";

  const flow = index.flows.find(({ value }) => value?.id === "DF-013")?.value;
  const stepByOrder = new Map(records(flow?.steps).map((step) => [step.order, step]));
  const actionById = new Map(records(reportModule.actions).map((action) => [action.id, action]));
  const pathById = new Map(records(flow?.executionPaths).map((path) => [path.id, path]));
  const adHocPath = pathById.get("AD_HOC");
  const periodicPath = pathById.get("PERIODIC");
  const bindingSignature = (binding) => [
    binding?.sourceObjectId,
    binding?.sourceIdentityFieldId,
    binding?.sourceVersionFieldId,
    binding?.consumerStepOrder,
    binding?.targetRefFieldId,
    binding?.targetVersionFieldId,
    binding?.cardinality,
  ].join("|");
  const expectedDefinitionBinding = (consumerStepOrder) => [
    "RPT-OBJ-DEFINITION",
    "RPT-DEFINITION-F-ID",
    "RPT-DEFINITION-F-VERSION",
    consumerStepOrder,
    "RPT-RUN-F-DEFINITION-REF",
    "RPT-RUN-F-DEFINITION-VERSION",
    "ONE",
  ].join("|");
  const expectedSubscriptionBinding = [
    "RPT-OBJ-SUBSCRIPTION",
    "RPT-SUBSCRIPTION-F-ID",
    "RPT-SUBSCRIPTION-F-VERSION",
    4,
    "RPT-RUN-F-SUBSCRIPTION-REF",
    "RPT-RUN-F-SUBSCRIPTION-VERSION",
    "ONE",
  ].join("|");
  const pathKeyValid = (path, expectedIdentityIds, expectedVersionIds) => (
    setEquals(
      new Set(list(path?.idempotencyKeyParts?.identityFieldIds)),
      new Set(expectedIdentityIds),
    )
    && setEquals(
      new Set(list(path?.idempotencyKeyParts?.versionFieldIds)),
      new Set(expectedVersionIds),
    )
    && path?.idempotencyKeyParts?.fanoutFieldId === "APP-TODO-F-STUDENT-REF"
  );
  const adHocRun = actionById.get("RPT-ACT-CREATE-AD-HOC-RUN");
  const periodicRun = actionById.get("RPT-ACT-CREATE-RUN");
  const reportExecutionPathValid = flow?.routingPolicy === "ACTION_CHOICE_REQUIRED"
    && pathById.size === 2
    && stepByOrder.get(3)?.actionId === "RPT-ACT-CREATE-AD-HOC-RUN"
    && stepByOrder.get(4)?.actionId === "RPT-ACT-CREATE-RUN"
    && adHocPath?.route?.kind === "ACTION_CHOICE"
    && adHocPath.route.consumerStepOrder === 3
    && periodicPath?.route?.kind === "ACTION_CHOICE"
    && periodicPath.route.consumerStepOrder === 4
    && setEquals(
      new Set(records(adHocPath?.sourceBindings).map(bindingSignature)),
      new Set([expectedDefinitionBinding(3)]),
    )
    && setEquals(
      new Set(records(periodicPath?.sourceBindings).map(bindingSignature)),
      new Set([expectedDefinitionBinding(4), expectedSubscriptionBinding]),
    )
    && setEquals(
      new Set(list(adHocRun?.inputFieldIds)),
      new Set(["RPT-RUN-F-DEFINITION-REF", "RPT-RUN-F-DEFINITION-VERSION"]),
    )
    && setEquals(
      new Set(list(periodicRun?.inputFieldIds)),
      new Set([
        "RPT-RUN-F-DEFINITION-REF",
        "RPT-RUN-F-DEFINITION-VERSION",
        "RPT-RUN-F-SUBSCRIPTION-REF",
        "RPT-RUN-F-SUBSCRIPTION-VERSION",
      ]),
    )
    && list(periodicRun?.outputFieldIds).includes("RPT-RUN-F-SUBSCRIPTION-REF")
    && list(periodicRun?.outputFieldIds).includes("RPT-RUN-F-SUBSCRIPTION-VERSION")
    && pathKeyValid(
      adHocPath,
      ["RPT-DEFINITION-F-ID", "APP-TODO-F-ID", "PLN-PLAN-F-ID"],
      [
        "RPT-DEFINITION-F-VERSION",
        "APP-TODO-F-AGGREGATION-VERSION",
        "PLN-PLAN-F-PLAN-VERSION",
        "PLN-HOMEROOM-F-OUTPUT-VERSION",
      ],
    )
    && pathKeyValid(
      periodicPath,
      [
        "RPT-DEFINITION-F-ID",
        "RPT-SUBSCRIPTION-F-ID",
        "APP-TODO-F-ID",
        "PLN-PLAN-F-ID",
      ],
      [
        "RPT-DEFINITION-F-VERSION",
        "RPT-SUBSCRIPTION-F-VERSION",
        "APP-TODO-F-AGGREGATION-VERSION",
        "PLN-PLAN-F-PLAN-VERSION",
        "PLN-HOMEROOM-F-OUTPUT-VERSION",
      ],
    );

  if (
    !objectContractValid
    || !lifecycleValid
    || !runPolicyValid
    || !snapshotPinValid
    || !horizonValid
  ) {
    errors.push(
      "INVALID_REPORT_CONTRACT RPT-001 must separate report objects, lifecycles, run authorization, source pins, and time horizons",
    );
  }
  if (!reportExecutionPathValid) {
    errors.push(
      "INVALID_REPORT_EXECUTION_PATH DF-013 must separate ad-hoc definition runs from periodic definition-and-subscription runs with source-version idempotency",
    );
  }
  return errors;
}

function reportScopeErrors(index) {
  const reportModule = index.moduleById.get("RPT-001")?.value;
  if (!reportModule) return [];
  const definition = index.objectById.get("RPT-OBJ-DEFINITION")?.value;
  const scopeField = records(definition?.fields).find(({ id }) => (
    id === "RPT-DEFINITION-F-DATA-SCOPE"
  ));
  const optionSet = index.optionSetById.get("OPT-ENUM-048")?.value;
  const expectedProfiles = [
    {
      code: "SUBJECT_ASSIGNED",
      subjectScope: "ASSIGNED_SUBJECT",
      classScope: "ASSIGNED_CLASSES",
      aggregateOnly: false,
      noStudentDetail: false,
      requiresAuthorizedGrant: false,
    },
    {
      code: "HOMEROOM_ASSIGNED_CLASS_AGGREGATE",
      subjectScope: "ALL_SUBJECTS",
      classScope: "ASSIGNED_HOMEROOM_CLASS",
      aggregateOnly: true,
      noStudentDetail: true,
      requiresAuthorizedGrant: false,
    },
    {
      code: "ACADEMIC_AUTHORIZED_AGGREGATE",
      subjectScope: "AUTHORIZED_SUBJECTS",
      classScope: "AUTHORIZED_CLASSES",
      aggregateOnly: true,
      noStudentDetail: true,
      requiresAuthorizedGrant: true,
    },
  ];
  const expectedActions = [
    ["RPT-ACT-CREATE-AD-HOC-DEFINITION", "SUBJECT_ASSIGNED", "dutyRef", "DUTY-SUBJECT-TEACHER"],
    ["RPT-ACT-CREATE-HOMEROOM-DEFINITION", "HOMEROOM_ASSIGNED_CLASS_AGGREGATE", "dutyRef", "DUTY-HOMEROOM"],
    ["RPT-ACT-CREATE-ACADEMIC-DEFINITION", "ACADEMIC_AUTHORIZED_AGGREGATE", "roleRef", "ROLE-ACADEMIC"],
  ];
  const actionsValid = expectedActions.every(([
    actionId,
    code,
    subjectKey,
    subjectRef,
  ]) => {
    const action = index.actionById.get(actionId)?.value;
    const binding = records(action?.acceptedInputValues)[0];
    const allows = records(action?.permissions).filter(({ effect }) => effect === "ALLOW");
    return action?.targetObjectId === "RPT-OBJ-DEFINITION"
      && action?.capability === "REPORT"
      && records(action?.acceptedInputValues).length === 1
      && hasExactKeys(binding, ["fieldId", "optionSetId", "partitionId", "codes"])
      && binding.fieldId === "RPT-DEFINITION-F-DATA-SCOPE"
      && binding.optionSetId === "OPT-ENUM-048"
      && binding.partitionId === "RPT-DEFINITION-DATA-SCOPE"
      && setEquals(new Set(list(binding.codes)), new Set([code]))
      && allows.length === 1
      && allows[0]?.[subjectKey] === subjectRef
      && records(action?.permissions).some(({ effect, roleRef }) => (
        effect === "DENY" && roleRef === "ROLE-PLATFORM-OPS"
      ));
  });
  const valid = optionSet?.key === "reportDataScope"
    && optionSet?.mode === "STATIC"
    && setEquals(
      new Set(records(optionSet?.values).map(({ code }) => code)),
      new Set(expectedProfiles.map(({ code }) => code)),
    )
    && scopeField?.dataType === "STRING"
    && scopeField?.valueSource?.kind === "OPTION_SET"
    && scopeField.valueSource.optionSetId === "OPT-ENUM-048"
    && JSON.stringify(reportModule.dataScopeProfiles) === JSON.stringify(expectedProfiles)
    && definition?.producerRef === "CURRENT_ACTOR"
    && actionsValid;
  return valid ? [] : [
    "INVALID_REPORT_SCOPE_CONTRACT RPT-001 must execute subject, homeroom aggregate, and authorized academic aggregate scopes through closed profiles and Actions",
  ];
}

function reportSubscriptionOwnershipErrors(index) {
  const subscription = index.objectById.get("RPT-OBJ-SUBSCRIPTION")?.value;
  if (!subscription) return [];
  const creatorFieldId = "RPT-SUBSCRIPTION-F-CREATOR-REF";
  const scopeFieldId = "RPT-SUBSCRIPTION-F-DATA-SCOPE";
  const fieldIds = new Set(records(subscription.fields).map(({ id }) => id));
  const expectedCreateActions = [
    ["RPT-ACT-CREATE-SUBSCRIPTION", "SUBJECT_ASSIGNED", "dutyRef", "DUTY-SUBJECT-TEACHER"],
    ["RPT-ACT-CREATE-HOMEROOM-SUBSCRIPTION", "HOMEROOM_ASSIGNED_CLASS_AGGREGATE", "dutyRef", "DUTY-HOMEROOM"],
    ["RPT-ACT-CREATE-ACADEMIC-SUBSCRIPTION", "ACADEMIC_AUTHORIZED_AGGREGATE", "roleRef", "ROLE-ACADEMIC"],
  ];
  const createActionsValid = expectedCreateActions.every(([
    actionId,
    code,
    subjectKey,
    subjectRef,
  ]) => {
    const action = index.actionById.get(actionId)?.value;
    const binding = records(action?.acceptedInputValues)[0];
    const allows = records(action?.permissions).filter(({ effect }) => effect === "ALLOW");
    return action?.targetObjectId === subscription.id
      && action?.operationKind === "CREATE"
      && action?.capability === "PERIODIC"
      && list(action?.outputFieldIds).includes(creatorFieldId)
      && records(action?.acceptedInputValues).length === 1
      && binding?.fieldId === scopeFieldId
      && binding?.optionSetId === "OPT-ENUM-048"
      && binding?.partitionId === "RPT-SUBSCRIPTION-DATA-SCOPE"
      && setEquals(new Set(list(binding?.codes)), new Set([code]))
      && allows.length === 1
      && allows[0]?.[subjectKey] === subjectRef;
  });
  const managementActionsValid = [
    "RPT-ACT-UPDATE-SUBSCRIPTION",
    "RPT-ACT-PAUSE-SUBSCRIPTION",
    "RPT-ACT-CANCEL-SUBSCRIPTION",
  ].every((actionId) => {
    const action = index.actionById.get(actionId)?.value;
    const permissions = records(action?.permissions);
    return action?.capability === "PERIODIC"
      && permissions.some((permission) => (
        permission.effect === "ALLOW"
        && permission.actorRef === "CURRENT_ACTOR"
        && permission.scope?.kind === "OWN_RECORD"
        && permission.scope.subjectFieldId === creatorFieldId
      ))
      && permissions.some((permission) => (
        permission.effect === "DENY"
        && permission.actorRef === "CURRENT_ACTOR"
        && permission.scope?.kind === "OTHER_RECORD"
        && permission.scope.subjectFieldId === creatorFieldId
      ))
      && permissions.some(({ effect, roleRef }) => (
        effect === "DENY" && roleRef === "ROLE-PLATFORM-OPS"
      ));
  });
  const valid = subscription.producerRef === "CURRENT_ACTOR"
    && fieldIds.has(creatorFieldId)
    && fieldIds.has(scopeFieldId)
    && hasExactKeys(subscription.scopeBinding, [
      "definitionScopeFieldId",
      "subscriptionScopeFieldId",
      "mode",
    ])
    && subscription.scopeBinding.definitionScopeFieldId
      === "RPT-DEFINITION-F-DATA-SCOPE"
    && subscription.scopeBinding.subscriptionScopeFieldId === scopeFieldId
    && subscription.scopeBinding.mode === "MATCH_REQUIRED"
    && createActionsValid
    && managementActionsValid;
  return valid ? [] : [
    "INVALID_REPORT_SUBSCRIPTION_OWNERSHIP RPT-001 subscriptions must retain their creator and deny cross-actor management",
  ];
}

function learningPathErrors(index) {
  const pathModule = index.moduleById.get("LPATH-001")?.value;
  if (!pathModule) return [];
  const errors = [];
  const timeline = index.objectById.get("LPATH-OBJ-TIMELINE-ENTRY")?.value;
  const interpretation = index.objectById.get("LPATH-OBJ-INTERPRETATION")?.value;
  const expectedSourceBindings = [
    ["PUBLISHED-RESULT", "PUB-OBJ-RESULT", "PUB-RESULT-F-RESULT-VERSION"],
    ["EVIDENCE", "INS-OBJ-EVIDENCE", "INS-EVIDENCE-F-EVIDENCE-VERSION"],
    ["CORRECTION", "CORR-OBJ-ATTEMPT", "CORR-ATTEMPT-F-CORRECTION-VERSION"],
    ["PLAN-EXECUTION", "APP-OBJ-TODO", "APP-TODO-F-AGGREGATION-VERSION"],
    ["TEACHER-CONFIRMATION", "GRD-OBJ-DECISION", "GRD-DECISION-F-DECISION-VERSION"],
  ];
  const timelineFieldById = new Map(records(timeline?.fields).map((field) => [field.id, field]));
  const expectedSourceGroupSignatures = expectedSourceBindings.map(([kind]) => (
    `${kind}:LPATH-ENTRY-F-${kind}-REF,LPATH-ENTRY-F-${kind}-VERSION`
  ));
  const actualSourceGroupSignatures = records(timeline?.exclusiveSourceGroups)
    .map((group) => `${group.id}:${list(group.fieldIds).join(",")}`);
  const timelineValid = timeline?.crossTerm === true
    && setEquals(
      new Set(actualSourceGroupSignatures),
      new Set(expectedSourceGroupSignatures),
    )
    && expectedSourceBindings.every(([kind, objectId, targetVersionFieldId]) => {
      const refFieldId = `LPATH-ENTRY-F-${kind}-REF`;
      const versionFieldId = `LPATH-ENTRY-F-${kind}-VERSION`;
      const refField = timelineFieldById.get(refFieldId);
      return refField?.valueSource?.kind === "OBJECT_REF"
        && refField.valueSource.targetObjectId === objectId
        && refField.referenceIntegrity === "VERSION_PINNED"
        && refField.versionBinding?.versionFieldId === versionFieldId
        && refField.versionBinding?.targetVersionFieldId === targetVersionFieldId
        && timelineFieldById.has(versionFieldId)
        && list(timeline?.lineageBindings).some((binding) => (
          binding?.refFieldId === refFieldId
          && binding?.versionFieldId === versionFieldId
          && binding?.targetObjectId === objectId
          && binding?.targetVersionFieldId === targetVersionFieldId
        ));
    });

  const interpretationFieldIds = new Set(
    records(interpretation?.fields).map(({ id }) => id),
  );
  const requiredInterpretationFieldIds = [
    "LPATH-INTERPRETATION-F-SUBJECT",
    "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-REF",
    "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-VERSION",
    "LPATH-INTERPRETATION-F-EVIDENCE-REFS",
    "LPATH-INTERPRETATION-F-EXPLANATION",
    "LPATH-INTERPRETATION-F-CONFIDENCE",
    "LPATH-INTERPRETATION-F-LIMITATIONS",
    "LPATH-INTERPRETATION-F-TEACHER-CONFIRMER",
    "LPATH-INTERPRETATION-F-VISIBLE-FROM",
    "LPATH-INTERPRETATION-F-SUPERSEDED-BY-REF",
    "LPATH-INTERPRETATION-F-SUPERSEDED-BY-VERSION",
    "LPATH-INTERPRETATION-F-STALE-REASON",
    "LPATH-INTERPRETATION-F-VERSION",
  ];
  const interpretationValid = requiredInterpretationFieldIds.every((fieldId) => (
    interpretationFieldIds.has(fieldId)
  )) && setEquals(
    stateIds(interpretation),
    new Set(["CANDIDATE", "TEACHER_CONFIRMED", "STUDENT_VISIBLE", "SUPERSEDED", "STALE"]),
  ) && interpretation?.stateReachability?.mode === "ACTION_GRAPH";

  const flow = index.flows.find(({ value }) => value?.id === "DF-011")?.value;
  const pathById = new Map(records(flow?.executionPaths).map((path) => [path.id, path]));
  const expectedPaths = [
    ["PUBLISHED_RESULT", "PUB-OBJ-RESULT", "PUB-RESULT-F-ID", "PUB-RESULT-F-RESULT-VERSION", 1, "PUBLISHED-RESULT"],
    ["EVIDENCE", "INS-OBJ-EVIDENCE", "INS-EVIDENCE-F-ID", "INS-EVIDENCE-F-EVIDENCE-VERSION", 2, "EVIDENCE"],
    ["CORRECTION", "CORR-OBJ-ATTEMPT", "CORR-ATTEMPT-F-ID", "CORR-ATTEMPT-F-CORRECTION-VERSION", 3, "CORRECTION"],
    ["PLAN_EXECUTION", "APP-OBJ-TODO", "APP-TODO-F-ID", "APP-TODO-F-AGGREGATION-VERSION", 4, "PLAN-EXECUTION"],
    ["TEACHER_CONFIRMATION", "GRD-OBJ-DECISION", "GRD-DECISION-F-ID", "GRD-DECISION-F-DECISION-VERSION", 5, "TEACHER-CONFIRMATION"],
  ];
  const sourcePathsValid = flow?.routingPolicy === "ACTION_CHOICE_REQUIRED"
    && setEquals(
      new Set(list(flow?.sourceOnlyModuleIds)),
      new Set(["PUB-001", "INS-001", "CORR-001", "APP-001", "GRD-001"]),
    )
    && pathById.size === expectedPaths.length
    && expectedPaths.every(([
      pathId,
      sourceObjectId,
      sourceIdentityFieldId,
      sourceVersionFieldId,
      consumerStepOrder,
      kind,
    ]) => {
      const path = pathById.get(pathId);
      const bindings = records(path?.sourceBindings);
      const binding = bindings[0];
      return bindings.length === 1
        && path?.route?.kind === "ACTION_CHOICE"
        && path.route.consumerStepOrder === consumerStepOrder
        && binding?.sourceObjectId === sourceObjectId
        && binding?.sourceIdentityFieldId === sourceIdentityFieldId
        && binding?.sourceVersionFieldId === sourceVersionFieldId
        && binding?.consumerStepOrder === consumerStepOrder
        && binding?.targetRefFieldId === `LPATH-ENTRY-F-${kind}-REF`
        && binding?.targetVersionFieldId === `LPATH-ENTRY-F-${kind}-VERSION`
        && binding?.cardinality === "ONE";
    });

  const history = pathModule.historyPolicy;
  const historyValid = hasExactKeys(history, [
    "timeline",
    "sourceFacts",
    "interpretationChange",
    "priorVersions",
  ])
    && history.timeline === "APPEND_ONLY_SOURCE_REFERENCES"
    && history.sourceFacts === "NEVER_COPY_OR_REWRITE"
    && history.interpretationChange === "CREATE_NEW_VERSION"
    && history.priorVersions === "RETAIN_WITH_SUPERSEDED_OR_STALE_REASON";

  const userWrites = records(pathModule.actions).filter(({ executionMode, writes }) => (
    executionMode === "USER_TASK" && writes === true
  ));
  const writesValid = userWrites.length > 0 && userWrites.every((action) => {
    const allows = records(action.permissions).filter(({ effect }) => effect === "ALLOW");
    return allows.length === 1
      && allows[0].dutyRef === "DUTY-SUBJECT-TEACHER"
      && records(action.permissions).some(({ effect, dutyRef }) => (
        effect === "DENY" && dutyRef === "DUTY-HOMEROOM"
      ));
  });
  const readAction = index.actionById.get("LPATH-ACT-VIEW-PATH")?.value;
  const readAllows = records(readAction?.permissions)
    .filter(({ effect }) => effect === "ALLOW")
    .map(({ dutyRef }) => dutyRef);
  const readValid = readAction?.writes === false
    && setEquals(
      new Set(readAllows),
      new Set(["DUTY-SUBJECT-TEACHER", "DUTY-HOMEROOM"]),
    );

  if (!timelineValid || !interpretationValid || !historyValid || !writesValid || !readValid) {
    errors.push(
      "INVALID_LEARNING_PATH_CONTRACT LPATH-001 must retain cross-term source versions and subject-owned interpretation history",
    );
  }
  if (!sourcePathsValid) {
    errors.push(
      "INVALID_LEARNING_PATH_SOURCE_PATH DF-011 must bind exactly one published result, evidence, correction, plan execution, or teacher confirmation source per path",
    );
  }
  return errors;
}

function notificationErrors(index) {
  const notification = index.objectById.get("NOTI-OBJ-NOTIFICATION")?.value;
  if (!notification) return [];
  const requiredFieldIds = [
    "NOTI-NOTIFICATION-F-SOURCE-EVENT",
    "NOTI-NOTIFICATION-F-RECIPIENT",
    "NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE",
    "NOTI-NOTIFICATION-F-DEEP-LINK",
    "NOTI-NOTIFICATION-F-DELIVERED-AT",
    "NOTI-NOTIFICATION-F-READ-AT",
    "NOTI-NOTIFICATION-F-HANDLED-AT",
    "NOTI-NOTIFICATION-F-FAILURE-CODE",
    "NOTI-NOTIFICATION-F-RETRY-COUNT",
  ];
  const fieldIds = new Set(records(notification.fields).map(({ id }) => id));
  const policy = notification.deliveryFailurePolicy;
  const recipientPolicy = notification.recipientPolicy;
  const notificationActionById = new Map(index.actions
    .filter(({ moduleId }) => moduleId === "NOTI-001")
    .map(({ value }) => [value.id, value]));
  const recipientActionsValid = ["NOTI-ACT-MARK-READ", "NOTI-ACT-MARK-HANDLED"]
    .every((actionId) => {
      const permissions = records(notificationActionById.get(actionId)?.permissions);
      return permissions.some((permission) => (
        permission.effect === "ALLOW"
        && permission.actorRef === "CURRENT_ACTOR"
        && permission.scope?.kind === "OWN_RECORD"
        && permission.scope.subjectFieldId === "NOTI-NOTIFICATION-F-RECIPIENT"
      )) && permissions.some((permission) => (
        permission.effect === "DENY"
        && permission.actorRef === "CURRENT_ACTOR"
        && permission.scope?.kind === "OTHER_RECORD"
        && permission.scope.subjectFieldId === "NOTI-NOTIFICATION-F-RECIPIENT"
      )) && permissions.some(({ effect, roleRef }) => (
        effect === "DENY" && roleRef === "ROLE-PLATFORM-OPS"
      ));
    });
  const valid = requiredFieldIds.every((fieldId) => fieldIds.has(fieldId))
    && notification?.stateReachability?.mode === "ACTION_GRAPH"
    && recipientActionsValid
    && hasExactKeys(recipientPolicy, [
      "subjectFieldId",
      "allowedRecipientSubjects",
      "mutationSubject",
      "ownershipMode",
    ])
    && recipientPolicy.subjectFieldId === "NOTI-NOTIFICATION-F-RECIPIENT"
    && setEquals(
      new Set(list(recipientPolicy.allowedRecipientSubjects)),
      new Set([
        "ROLE-STUDENT",
        "DUTY-SUBJECT-TEACHER",
        "DUTY-HOMEROOM",
        "ROLE-ACADEMIC",
      ]),
    )
    && list(recipientPolicy.allowedRecipientSubjects).length === 4
    && recipientPolicy.mutationSubject === "CURRENT_ACTOR"
    && recipientPolicy.ownershipMode === "OWN_RECORD_ONLY"
    && hasExactKeys(policy, [
      "sourceBusinessFactRollback",
      "retryScope",
      "preserveAcceptedSourceVersion",
    ])
    && policy.sourceBusinessFactRollback === false
    && policy.retryScope === "NOTIFICATION_DELIVERY_ONLY"
    && policy.preserveAcceptedSourceVersion === true;
  return valid ? [] : [
    "INVALID_NOTIFICATION_CONTRACT NOTI-001 must retry delivery independently without rolling back source facts",
  ];
}

function notificationChannelErrors(index) {
  const errors = [];
  for (const objectEntry of index.objects) {
    const object = objectEntry.value;
    if (!Object.hasOwn(object ?? {}, "channelPolicy")) continue;
    const policy = object.channelPolicy;
    const allowedCodes = list(policy?.allowedCodes);
    const allowedCodeSet = new Set(allowedCodes);
    const field = records(object?.fields).find(({ id }) => id === policy?.fieldId);
    const optionSet = index.optionSetById.get(policy?.optionSetId)?.value;
    const optionValues = records(optionSet?.values);
    const optionCodes = optionValues.map(({ code }) => code);
    const channelValue = optionValues[0];
    const targetActions = index.actions.filter(({ value }) => (
      value?.targetObjectId === object?.id
    ));
    const valid = hasExactKeys(policy, [
      "mode",
      "fieldId",
      "optionSetId",
      "allowedCodes",
    ])
      && policy.mode === "PHASE_ONE_CLOSED"
      && allowedCodes.length > 0
      && allowedCodeSet.size === allowedCodes.length
      && allowedCodes.every(isValidId)
      && field?.valueSource?.kind === "OPTION_SET"
      && field.valueSource.optionSetId === policy.optionSetId
      && optionSet?.mode === "STATIC"
      && optionSet?.key === "notificationChannel"
      && optionValues.length === 1
      && hasExactKeys(channelValue, ["code", "label"])
      && channelValue.code === "IN_PRODUCT"
      && channelValue.label === "站内"
      && allowedCodes.length === 1
      && allowedCodes[0] === "IN_PRODUCT"
      && setEquals(new Set(optionCodes), allowedCodeSet)
      && targetActions.length > 0
      && targetActions.every(({ value }) => allowedCodeSet.has(value?.channel));
    if (!valid) {
      errors.push(
        `INVALID_NOTIFICATION_CHANNEL ${formatValidationValue(object?.id)} must remain closed to its declared phase-one delivery channels`,
      );
    }
  }
  return errors;
}

function phaseAndTemplateErrors(index) {
  const errors = [];
  for (const moduleEntry of index.modules) {
    const module = moduleEntry.value;
    const phaseTwoExecutable = [
      "actions",
      "pages",
      "scenarios",
      "flows",
      "aiTasks",
      "externalLinks",
      "deliveryBehavior",
    ].some((property) => list(module?.[property]).length > 0);
    if (
      module?.phase === 2
      && phaseTwoExecutable
    ) {
      errors.push(
        `PHASE_BOUNDARY_EXECUTABLE_PAGE ${formatValidationValue(module?.id)} exposes pages or actions in phase two`,
      );
    }
  }
  for (const extensionEntry of index.extensions) {
    const extension = extensionEntry.value;
    const executable = EXTENSION_EXECUTABLE_KEYS
      .some((property) => Object.hasOwn(extension ?? {}, property));
    if (executable) {
      errors.push(
        `PHASE_BOUNDARY_EXECUTABLE_PAGE ${formatValidationValue(extension?.id)} exposes executable extension surface`,
      );
    }
  }
  for (const pageEntry of index.pages) {
    for (const name of entityNames(pageEntry.value)) {
      if (FORBIDDEN_PAGE_NAMES.has(name)) {
        errors.push(
          `FORBIDDEN_GENERIC_TEMPLATE page ${formatValidationValue(pageEntry.value?.id)} -> ${name}`,
        );
      }
    }
  }
  return errors;
}

function contentGovernanceErrors(index) {
  const moduleEntry = index.moduleById.get("CONTENT-001");
  const questionEntry = index.objectById.get("CONTENT-OBJ-QUESTION-VERSION");
  const licenseEntry = index.objectById.get("CONTENT-OBJ-LICENSE");
  const permissionEntry = index.objectById.get("CONTENT-OBJ-PERMISSION");
  const publishEntry = index.actionById.get("CONTENT-ACT-PUBLISH-QUESTION-VERSION");
  if (
    !moduleEntry
    || questionEntry?.moduleId !== "CONTENT-001"
    || licenseEntry?.moduleId !== "CONTENT-001"
    || permissionEntry?.moduleId !== "CONTENT-001"
    || publishEntry?.moduleId !== "CONTENT-001"
  ) return task8ProfileEnabled(index)
    ? ["INVALID_CONTENT_GOVERNANCE_CONTRACT CONTENT-001 prerequisites are missing"]
    : [];

  const question = questionEntry.value;
  const permission = permissionEntry.value;
  const publish = publishEntry.value;
  const action = (id) => index.actionById.get(id)?.value;
  const hasExactUniqueStrings = (actual, expected) => {
    const values = list(actual);
    return values.length === expected.length
      && values.every(isValidId)
      && new Set(values).size === values.length
      && setEquals(new Set(values), new Set(expected));
  };
  const ownedFieldMatches = (fieldId, objectId, dataType, optionSetId) => {
    const fieldEntry = index.fieldById.get(fieldId);
    const field = fieldEntry?.value;
    return fieldEntry?.moduleId === "CONTENT-001"
      && fieldEntry?.objectId === objectId
      && field?.dataType === dataType
      && (optionSetId === undefined || hasExactValues(field?.valueSource, {
        kind: "OPTION_SET",
        optionSetId,
      }));
  };
  const questionContextFields = [
    ["CONTENT-QUESTION-F-SCHOOL-ID", "OPT-COM-002"],
    ["CONTENT-QUESTION-F-SUBJECT-ID", "OPT-COM-007"],
    ["CONTENT-QUESTION-F-COURSE-ID", "OPT-COM-008"],
  ];
  const grantFacts = [
    {
      scopeCode: "SCHOOL",
      payloadFieldId: "CONTENT-PERMISSION-F-SCHOOL-ID",
      optionSetId: "OPT-COM-002",
      actionId: "CONTENT-ACT-CREATE-SCHOOL-PERMISSION",
    },
    {
      scopeCode: "SUBJECT",
      payloadFieldId: "CONTENT-PERMISSION-F-SUBJECT-ID",
      optionSetId: "OPT-COM-007",
      actionId: "CONTENT-ACT-CREATE-SUBJECT-PERMISSION",
    },
    {
      scopeCode: "COURSE",
      payloadFieldId: "CONTENT-PERMISSION-F-COURSE-ID",
      optionSetId: "OPT-COM-008",
      actionId: "CONTENT-ACT-CREATE-COURSE-PERMISSION",
    },
  ];
  const commonGrantInputFieldIds = [
    "CONTENT-PERMISSION-F-GRANTEE-ID",
    "CONTENT-PERMISSION-F-EFFECTIVE-AT",
    "CONTENT-PERMISSION-F-EXPIRES-AT",
  ];
  const createQuestion = action("CONTENT-ACT-CREATE-QUESTION-VERSION");
  const sourceGroups = records(permission?.exclusiveSourceGroups);
  const scopeValues = records(index.optionSetById.get("OPT-EXT-010")?.value?.values);
  const coverage = publish?.permissionCoverage;
  let valid = questionContextFields.every(([fieldId, optionSetId]) => (
    ownedFieldMatches(fieldId, question.id, "ID", optionSetId)
    && index.fieldById.get(fieldId)?.value?.required === true
    && list(createQuestion?.inputFieldIds).includes(fieldId)
  ))
    && ownedFieldMatches(
      "CONTENT-PERMISSION-F-SCOPE",
      permission.id,
      "STRING",
      "OPT-EXT-010",
    )
    && hasExactUniqueStrings(scopeValues.map(({ code }) => code), grantFacts.map(({ scopeCode }) => (
      scopeCode
    )))
    && grantFacts.every(({ payloadFieldId, optionSetId }) => (
      ownedFieldMatches(payloadFieldId, permission.id, "ID", optionSetId)
      && index.fieldById.get(payloadFieldId)?.value?.required === false
    ))
    && ownedFieldMatches(
      "CONTENT-PERMISSION-F-GRANTEE-ID",
      permission.id,
      "ID",
    )
    && ownedFieldMatches(
      "CONTENT-PERMISSION-F-EFFECTIVE-AT",
      permission.id,
      "DATETIME",
    )
    && ownedFieldMatches(
      "CONTENT-PERMISSION-F-EXPIRES-AT",
      permission.id,
      "DATETIME",
    )
    && sourceGroups.length === grantFacts.length
    && grantFacts.every(({ scopeCode, payloadFieldId }) => sourceGroups.filter((group) => (
      hasExactKeys(group, ["id", "fieldIds"])
      && group.id === scopeCode
      && hasExactUniqueStrings(group.fieldIds, [payloadFieldId])
    )).length === 1)
    && grantFacts.every(({ scopeCode, payloadFieldId, actionId }) => {
      const grantActionEntry = index.actionById.get(actionId);
      const grantAction = grantActionEntry?.value;
      const acceptedValues = records(grantAction?.acceptedInputValues);
      const expectedInputFieldIds = [
        "CONTENT-PERMISSION-F-SCOPE",
        payloadFieldId,
        ...commonGrantInputFieldIds,
      ];
      return grantActionEntry?.moduleId === "CONTENT-001"
        && grantAction?.targetObjectId === permission.id
        && grantAction?.operationKind === "CREATE"
        && grantAction?.writes === true
        && hasExactUniqueStrings(grantAction?.inputFieldIds, expectedInputFieldIds)
        && hasExactUniqueStrings(grantAction?.outputFieldIds, [
          "CONTENT-PERMISSION-F-ID",
          "CONTENT-PERMISSION-F-VERSION",
        ])
        && acceptedValues.length === 1
        && hasExactKeys(acceptedValues[0], [
          "fieldId",
          "optionSetId",
          "partitionId",
          "codes",
        ])
        && acceptedValues[0].fieldId === "CONTENT-PERMISSION-F-SCOPE"
        && acceptedValues[0].optionSetId === "OPT-EXT-010"
        && acceptedValues[0].partitionId === "CONTENT-PERMISSION-SCOPE"
        && hasExactUniqueStrings(acceptedValues[0].codes, [scopeCode]);
    })
    && hasExactKeys(coverage, [
      "grantRefFieldId",
      "grantScopeFieldId",
      "contentContextFieldIds",
      "grantContextFieldIds",
      "granteeFieldId",
      "effectiveAtFieldId",
      "expiresAtFieldId",
      "predicate",
    ])
    && coverage.grantRefFieldId === "CONTENT-QUESTION-F-PERMISSION-REF"
    && coverage.grantScopeFieldId === "CONTENT-PERMISSION-F-SCOPE"
    && hasExactValues(coverage.contentContextFieldIds, {
      schoolId: "CONTENT-QUESTION-F-SCHOOL-ID",
      subjectId: "CONTENT-QUESTION-F-SUBJECT-ID",
      courseId: "CONTENT-QUESTION-F-COURSE-ID",
    })
    && hasExactValues(coverage.grantContextFieldIds, {
      schoolId: "CONTENT-PERMISSION-F-SCHOOL-ID",
      subjectId: "CONTENT-PERMISSION-F-SUBJECT-ID",
      courseId: "CONTENT-PERMISSION-F-COURSE-ID",
    })
    && coverage.granteeFieldId === "CONTENT-PERMISSION-F-GRANTEE-ID"
    && coverage.effectiveAtFieldId === "CONTENT-PERMISSION-F-EFFECTIVE-AT"
    && coverage.expiresAtFieldId === "CONTENT-PERMISSION-F-EXPIRES-AT"
    && coverage.predicate === "ACTIVE_GRANT_COVERS_CONTENT_CONTEXT_AND_CURRENT_TIME";
  const expectedRefs = [
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
  ];
  valid = valid && expectedRefs.every((expected) => {
    const refEntry = index.fieldById.get(expected.refFieldId);
    const versionEntry = index.fieldById.get(expected.versionFieldId);
    const targetVersionEntry = index.fieldById.get(expected.targetVersionFieldId);
    const ref = refEntry?.value;
    return refEntry?.moduleId === "CONTENT-001"
      && refEntry?.objectId === question.id
      && ref?.dataType === "ID"
      && ref?.mutability === "IMMUTABLE"
      && ref?.referenceIntegrity === "VERSION_PINNED"
      && ref?.stateGuardPolicy === "UPDATE_REQUIRED"
      && hasExactValues(ref?.valueSource, {
        kind: "OBJECT_REF",
        targetObjectId: expected.targetObjectId,
      })
      && hasExactValues(ref?.versionBinding, {
        versionFieldId: expected.versionFieldId,
        targetVersionFieldId: expected.targetVersionFieldId,
      })
      && hasExactKeys(ref?.actionApplicability, ["requiredActionIds"])
      && sameStringSet(ref?.actionApplicability?.requiredActionIds, [
        "CONTENT-ACT-PUBLISH-QUESTION-VERSION",
      ])
      && versionEntry?.moduleId === "CONTENT-001"
      && versionEntry?.objectId === question.id
      && versionEntry?.value?.dataType === "INTEGER"
      && versionEntry?.value?.mutability === "IMMUTABLE"
      && targetVersionEntry?.moduleId === "CONTENT-001"
      && targetVersionEntry?.objectId === expected.targetObjectId
      && targetVersionEntry?.value?.dataType === "INTEGER"
      && targetVersionEntry?.value?.idempotencyRole === "OBJECT_VERSION";
  });

  const lineageBindings = records(question?.lineageBindings);
  valid = valid
    && lineageBindings.length === expectedRefs.length
    && expectedRefs.every((expected) => lineageBindings.some((binding) => (
      hasExactValues(binding, expected)
    )));

  const expectedRelationships = [
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
  ];
  const relationships = records(moduleEntry.value?.relationships);
  valid = valid
    && relationships.length === expectedRelationships.length
    && expectedRelationships.every((expected) => relationships.some((relationship) => (
      hasExactValues(relationship, expected)
    )));

  const expectedGuards = expectedRefs.map((expected) => ({
    refFieldId: expected.refFieldId,
    versionFieldId: expected.versionFieldId,
    targetObjectId: expected.targetObjectId,
    requiredState: "ACTIVE",
  }));
  const guards = records(publish?.relatedStateGuards);
  const allowPermissions = records(publish?.permissions).filter(({ effect }) => (
    effect === "ALLOW"
  ));
  valid = valid
    && publish?.targetObjectId === question.id
    && publish?.operationKind === "UPDATE"
    && publish?.transition?.from === "DRAFT"
    && publish?.transition?.to === "PUBLISHED"
    && sameStringSet(publish?.inputFieldIds, expectedRefs.flatMap((expected) => [
      expected.refFieldId,
      expected.versionFieldId,
    ]))
    && sameStringSet(publish?.outputFieldIds, [
      "CONTENT-QUESTION-F-VERSION",
      "CONTENT-QUESTION-F-AVAILABILITY",
    ])
    && guards.length === expectedGuards.length
    && expectedGuards.every((expected) => guards.some((guard) => (
      hasExactValues(guard, expected)
    )))
    && allowPermissions.length === 1
    && allowPermissions[0]?.dutyRef === "DUTY-SUBJECT-LEAD"
    && !Object.hasOwn(allowPermissions[0] ?? {}, "roleRef")
    && !Object.hasOwn(allowPermissions[0] ?? {}, "actorRef")
    && sameStringSet(publish?.failureResults, [
      "PERMISSION_DENIED",
      "LICENSE_INACTIVE",
      "CONTENT_PERMISSION_INACTIVE",
      "SOURCE_VERSION_STALE",
      "VERSION_CONFLICT",
    ]);

  return valid
    ? []
    : [
      "INVALID_CONTENT_GOVERNANCE_CONTRACT CONTENT question publication requires active version-pinned license and permission lineage under the subject lead",
    ];
}

function task8PhaseFieldErrors(index) {
  if (!task8ProfileEnabled(index)) return [];

  const phaseFields = [
    {
      moduleId: "PREP-001",
      objectId: "PREP-OBJ-CLASSROOM-ACTIVITY",
      fieldId: "PREP-ACTIVITY-F-EVIDENCE",
      writerActionId: "PREP-ACT-RECORD-CLASSROOM-ACTIVITY",
      requiredState: "RECORDED",
    },
    {
      moduleId: "EXM-001",
      objectId: "EXM-OBJ-EXAM-EVENT",
      fieldId: "EXM-EVENT-F-PUBLICATION-AT",
      writerActionId: "EXM-ACT-PUBLISH-EVENT",
      requiredState: "PUBLISHED",
    },
    {
      moduleId: "PLAT-001",
      objectId: "PLAT-OBJ-SERVICE-PLAN",
      fieldId: "PLAT-PLAN-F-SCHOOL-CONFIRMED-AT",
      writerActionId: "PLAT-ACT-CONFIRM-SERVICE-PLAN",
      requiredState: "CONFIRMED",
    },
  ];
  const valid = phaseFields.every((expected) => {
    const fieldEntry = index.fieldById.get(expected.fieldId);
    const required = fieldEntry?.value?.required;
    const writerEntry = index.actionById.get(expected.writerActionId);
    const writer = writerEntry?.value;
    const writerEntries = index.actions.filter(({ value }) => (
      value?.writes === true
      && list(value?.outputFieldIds).includes(expected.fieldId)
    ));
    return fieldEntry?.moduleId === expected.moduleId
      && fieldEntry?.objectId === expected.objectId
      && hasExactKeys(required, ["description", "whenStates", "whenActionIds"])
      && isValidId(required.description)
      && list(required.whenStates).length === 1
      && required.whenStates[0] === expected.requiredState
      && list(required.whenActionIds).length === 1
      && required.whenActionIds[0] === expected.writerActionId
      && writerEntry?.moduleId === expected.moduleId
      && writer?.targetObjectId === expected.objectId
      && writer?.writes === true
      && concreteActionState(index, writer) === expected.requiredState
      && list(writer?.outputFieldIds).filter((fieldId) => (
        fieldId === expected.fieldId
      )).length === 1
      && writerEntries.length === 1
      && writerEntries[0]?.value?.id === expected.writerActionId;
  });
  return valid
    ? []
    : [
      "INVALID_TASK8_PHASE_FIELD_CONTRACT Task 8 phase fields require one exclusive semantic-stage writer and matching conditional requirement",
    ];
}

function examGovernanceErrors(index) {
  const moduleEntry = index.moduleById.get("EXM-001");
  const importEntry = index.objectById.get("EXM-OBJ-SCORE-IMPORT");
  const scoreEntry = index.objectById.get("EXM-OBJ-SUBJECT-SCORE");
  const requiredActionIds = [
    "EXM-ACT-IMPORT-SCORES",
    "EXM-ACT-VALIDATE-SCORE-IMPORT",
    "EXM-ACT-REJECT-SCORE-IMPORT",
    "EXM-ACT-REVISE-REJECTED-IMPORT",
    "EXM-ACT-ACCEPT-SCORE-IMPORT",
    "EXM-ACT-CREATE-SUBJECT-SCORE",
    "EXM-ACT-CONFIRM-SUBJECT-SCORE",
    "EXM-ACT-REJECT-SUBJECT-SCORE",
    "EXM-ACT-REVISE-REJECTED-SUBJECT-SCORE",
    "EXM-ACT-PUBLISH-SUBJECT-SCORE",
    "EXM-ACT-REPUBLISH-CORRECTED-SCORE",
  ];
  if (
    !moduleEntry
    || importEntry?.moduleId !== "EXM-001"
    || scoreEntry?.moduleId !== "EXM-001"
    || requiredActionIds.some((id) => index.actionById.get(id)?.moduleId !== "EXM-001")
  ) return task8ProfileEnabled(index)
    ? ["INVALID_EXAM_GOVERNANCE_CONTRACT EXM-001 prerequisites are missing"]
    : [];

  const exam = moduleEntry.value;
  const score = scoreEntry.value;
  const action = (id) => index.actionById.get(id)?.value;
  const importOption = index.optionSetById.get("OPT-EXT-005")?.value;
  const decisionOption = index.optionSetById.get("OPT-EXT-018")?.value;
  const exactOptionCodes = (optionSet, expectedCodes) => {
    const values = records(optionSet?.values);
    const codes = values.map(({ code }) => code);
    return values.length === expectedCodes.length
      && codes.every(isValidId)
      && sameStringSet(codes, expectedCodes);
  };

  let valid = setEquals(
    stateIds(importEntry.value),
    new Set(["PENDING", "PASSED", "REJECTED", "ACCEPTED"]),
  )
    && exactOptionCodes(importOption, ["PENDING", "PASSED", "REJECTED"])
    && exactOptionCodes(decisionOption, ["CONFIRM", "REJECT"])
    && concreteActionState(index, action("EXM-ACT-IMPORT-SCORES")) === "PENDING";

  const importTransitions = [
    ["EXM-ACT-VALIDATE-SCORE-IMPORT", "PENDING", "PASSED"],
    ["EXM-ACT-REJECT-SCORE-IMPORT", "PENDING", "REJECTED"],
    ["EXM-ACT-REVISE-REJECTED-IMPORT", "REJECTED", "PENDING"],
    ["EXM-ACT-ACCEPT-SCORE-IMPORT", "PASSED", "ACCEPTED"],
  ];
  valid = valid && importTransitions.every(([actionId, from, to]) => (
    action(actionId)?.targetObjectId === "EXM-OBJ-SCORE-IMPORT"
    && action(actionId)?.transition?.from === from
    && action(actionId)?.transition?.to === to
  ));

  const importRefEntry = index.fieldById.get("EXM-SCORE-F-IMPORT-REF");
  const importVersionEntry = index.fieldById.get("EXM-SCORE-F-IMPORT-VERSION");
  const sourceVersionEntry = index.fieldById.get("EXM-IMPORT-F-VERSION");
  const importRef = importRefEntry?.value;
  const expectedLineage = {
    refFieldId: "EXM-SCORE-F-IMPORT-REF",
    versionFieldId: "EXM-SCORE-F-IMPORT-VERSION",
    targetObjectId: "EXM-OBJ-SCORE-IMPORT",
    targetVersionFieldId: "EXM-IMPORT-F-VERSION",
  };
  valid = valid
    && importRefEntry?.moduleId === "EXM-001"
    && importRefEntry?.objectId === score.id
    && importRef?.dataType === "ID"
    && importRef?.mutability === "IMMUTABLE"
    && importRef?.referenceIntegrity === "VERSION_PINNED"
    && importRef?.stateGuardPolicy === "CREATE_REQUIRED"
    && hasExactValues(importRef?.valueSource, {
      kind: "OBJECT_REF",
      targetObjectId: "EXM-OBJ-SCORE-IMPORT",
    })
    && hasExactValues(importRef?.versionBinding, {
      versionFieldId: "EXM-SCORE-F-IMPORT-VERSION",
      targetVersionFieldId: "EXM-IMPORT-F-VERSION",
    })
    && hasExactKeys(importRef?.actionApplicability, ["requiredActionIds"])
    && sameStringSet(importRef?.actionApplicability?.requiredActionIds, [
      "EXM-ACT-CREATE-SUBJECT-SCORE",
    ])
    && importVersionEntry?.moduleId === "EXM-001"
    && importVersionEntry?.objectId === score.id
    && importVersionEntry?.value?.dataType === "INTEGER"
    && importVersionEntry?.value?.mutability === "IMMUTABLE"
    && sourceVersionEntry?.moduleId === "EXM-001"
    && sourceVersionEntry?.objectId === "EXM-OBJ-SCORE-IMPORT"
    && sourceVersionEntry?.value?.dataType === "INTEGER"
    && sourceVersionEntry?.value?.idempotencyRole === "OBJECT_VERSION";

  const lineageBindings = records(score?.lineageBindings);
  const relationships = records(exam?.relationships);
  valid = valid
    && lineageBindings.length === 1
    && hasExactValues(lineageBindings[0], expectedLineage)
    && relationships.length === 1
    && hasExactValues(relationships[0], {
      id: "EXM-REL-SCORE-IMPORT",
      fromObjectId: "EXM-OBJ-SUBJECT-SCORE",
      toObjectId: "EXM-OBJ-SCORE-IMPORT",
      type: "DERIVED_FROM",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "block score creation and mark unconfirmed derived score versions stale",
    });

  const createScore = action("EXM-ACT-CREATE-SUBJECT-SCORE");
  const createGuards = records(createScore?.relatedStateGuards);
  valid = valid
    && createScore?.operationKind === "CREATE"
    && createScore?.targetObjectId === score.id
    && concreteActionState(index, createScore) === "IMPORTED"
    && sameStringSet(createScore?.inputFieldIds, [
      "EXM-SCORE-F-STUDENT-ID",
      "EXM-SCORE-F-SUBJECT",
      "EXM-SCORE-F-SCORE",
      "EXM-SCORE-F-IMPORT-REF",
      "EXM-SCORE-F-IMPORT-VERSION",
    ])
    && sameStringSet(createScore?.outputFieldIds, [
      "EXM-SCORE-F-ID",
      "EXM-SCORE-F-EVIDENCE",
      "EXM-SCORE-F-VERSION",
    ])
    && createGuards.length === 1
    && hasExactValues(createGuards[0], {
      refFieldId: "EXM-SCORE-F-IMPORT-REF",
      versionFieldId: "EXM-SCORE-F-IMPORT-VERSION",
      targetObjectId: "EXM-OBJ-SCORE-IMPORT",
      requiredState: "ACCEPTED",
    })
    && sameStringSet(createScore?.failureResults, [
      "PERMISSION_DENIED",
      "IMPORT_REJECTED",
      "SOURCE_VERSION_STALE",
      "VERSION_CONFLICT",
    ]);

  const writerIdsFor = (fieldId) => index.actions
    .filter(({ moduleId, value }) => (
      moduleId === "EXM-001"
      && value?.writes === true
      && list(value?.outputFieldIds).includes(fieldId)
    ))
    .map(({ value }) => value.id);
  valid = valid
    && sameStringSet(writerIdsFor("EXM-SCORE-F-TEACHER-CONFIRMED-AT"), [
      "EXM-ACT-CONFIRM-SUBJECT-SCORE",
    ])
    && sameStringSet(writerIdsFor("EXM-SCORE-F-VISIBLE-AT"), [
      "EXM-ACT-PUBLISH-SUBJECT-SCORE",
    ]);

  const teacherConfirmedAt = index.fieldById
    .get("EXM-SCORE-F-TEACHER-CONFIRMED-AT")?.value;
  const visibleAt = index.fieldById.get("EXM-SCORE-F-VISIBLE-AT")?.value;
  valid = valid
    && sameStringSet(teacherConfirmedAt?.required?.whenStates, ["TEACHER_CONFIRMED"])
    && sameStringSet(teacherConfirmedAt?.required?.whenActionIds, [
      "EXM-ACT-CONFIRM-SUBJECT-SCORE",
    ])
    && sameStringSet(visibleAt?.required?.whenStates, ["PUBLISHED"])
    && sameStringSet(visibleAt?.required?.whenActionIds, [
      "EXM-ACT-PUBLISH-SUBJECT-SCORE",
    ])
    && sameStringSet(action("EXM-ACT-PUBLISH-SUBJECT-SCORE")?.outputFieldIds, [
      "EXM-SCORE-F-VISIBLE-AT",
      "EXM-SCORE-F-VERSION",
    ])
    && sameStringSet(action("EXM-ACT-REPUBLISH-CORRECTED-SCORE")?.outputFieldIds, [
      "EXM-SCORE-F-VERSION",
    ]);

  const decisionActions = [
    {
      id: "EXM-ACT-CONFIRM-SUBJECT-SCORE",
      from: "IMPORTED",
      to: "TEACHER_CONFIRMED",
      code: "CONFIRM",
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
    },
    {
      id: "EXM-ACT-REJECT-SUBJECT-SCORE",
      from: "IMPORTED",
      to: "REJECTED",
      code: "REJECT",
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
    },
  ];
  valid = valid && decisionActions.every((expected) => {
    const decisionAction = action(expected.id);
    const acceptedValues = records(decisionAction?.acceptedInputValues);
    const allows = records(decisionAction?.permissions).filter(({ effect }) => (
      effect === "ALLOW"
    ));
    return decisionAction?.transition?.from === expected.from
      && decisionAction?.transition?.to === expected.to
      && sameStringSet(decisionAction?.inputFieldIds, expected.inputFieldIds)
      && sameStringSet(decisionAction?.outputFieldIds, expected.outputFieldIds)
      && acceptedValues.length === 1
      && acceptedValues[0]?.fieldId === "EXM-SCORE-F-CONFIRMATION-DECISION"
      && acceptedValues[0]?.optionSetId === "OPT-EXT-018"
      && acceptedValues[0]?.partitionId === "EXM-SCORE-CONFIRMATION"
      && sameStringSet(acceptedValues[0]?.codes, [expected.code])
      && allows.length === 1
      && allows[0]?.dutyRef === "DUTY-SUBJECT-TEACHER"
      && !Object.hasOwn(allows[0] ?? {}, "roleRef")
      && !Object.hasOwn(allows[0] ?? {}, "actorRef");
  });

  const revise = action("EXM-ACT-REVISE-REJECTED-SUBJECT-SCORE");
  const reviseAllows = records(revise?.permissions).filter(({ effect }) => effect === "ALLOW");
  valid = valid
    && revise?.transition?.from === "REJECTED"
    && revise?.transition?.to === "IMPORTED"
    && sameStringSet(revise?.inputFieldIds, ["EXM-SCORE-F-SCORE"])
    && sameStringSet(revise?.outputFieldIds, [
      "EXM-SCORE-F-SCORE",
      "EXM-SCORE-F-EVIDENCE",
      "EXM-SCORE-F-VERSION",
    ])
    && reviseAllows.length === 1
    && reviseAllows[0]?.dutyRef === "DUTY-SUBJECT-TEACHER"
    && !Object.hasOwn(reviseAllows[0] ?? {}, "roleRef")
    && !Object.hasOwn(reviseAllows[0] ?? {}, "actorRef");

  const scorePublishedEvent = index.eventById.get("EVT-EXM-SCORE-PUBLISHED")?.value;
  valid = valid
    && Array.isArray(scorePublishedEvent?.producerActionIds)
    && scorePublishedEvent.producerActionIds.length === 1
    && scorePublishedEvent.producerActionIds[0] === "EXM-ACT-PUBLISH-SUBJECT-SCORE";

  return valid
    ? []
    : [
      "INVALID_EXAM_GOVERNANCE_CONTRACT EXM score import and publication require passed version lineage and exclusive subject-teacher decisions",
    ];
}

function scheduleSourceErrors(index) {
  const moduleEntry = index.moduleById.get("SCH-001");
  const calendarEntry = index.objectById.get("SCH-OBJ-CALENDAR");
  const candidateEntry = index.objectById.get("SCH-OBJ-CANDIDATE");
  const constraintEntry = index.objectById.get("SCH-OBJ-CONSTRAINT");
  const snapshotEntry = index.objectById.get("SCH-OBJ-CONSTRAINT-SNAPSHOT");
  const requiredActionIds = [
    "SCH-ACT-PUBLISH-CALENDAR",
    "SCH-ACT-CREATE-TEACHER-AVAILABILITY-CONSTRAINT",
    "SCH-ACT-CREATE-CLASS-PERIOD-CONSTRAINT",
    "SCH-ACT-CREATE-COURSE-LOAD-CONSTRAINT",
    "SCH-ACT-CREATE-ROOM-CAPACITY-CONSTRAINT",
    "SCH-ACT-CREATE-CONSTRAINT-SNAPSHOT",
    "SCH-ACT-ACTIVATE-CONSTRAINT-SNAPSHOT",
    "SCH-ACT-REPLACE-CONSTRAINT-SNAPSHOT",
    "SCH-ACT-GENERATE-CANDIDATE",
    "SCH-ACT-CONFIRM-CANDIDATE",
    "SCH-ACT-PUBLISH-CANDIDATE",
    "SCH-ACT-MARK-CANDIDATE-STALE",
  ];
  if (
    !moduleEntry
    || calendarEntry?.moduleId !== "SCH-001"
    || candidateEntry?.moduleId !== "SCH-001"
    || constraintEntry?.moduleId !== "SCH-001"
    || snapshotEntry?.moduleId !== "SCH-001"
    || requiredActionIds.some((id) => index.actionById.get(id)?.moduleId !== "SCH-001")
  ) return task8ProfileEnabled(index)
    ? ["INVALID_SCHEDULE_SOURCE_CONTRACT SCH-001 prerequisites are missing"]
    : [];

  const candidate = candidateEntry.value;
  const action = (id) => index.actionById.get(id)?.value;
  const exactUniqueStrings = (values, expected) => {
    const actual = list(values);
    return actual.length === expected.length
      && actual.every(isValidId)
      && new Set(actual).size === actual.length
      && setEquals(new Set(actual), new Set(expected));
  };
  const expectedSources = [
    {
      refFieldId: "SCH-CANDIDATE-F-CALENDAR-REF",
      versionFieldId: "SCH-CANDIDATE-F-CALENDAR-VERSION",
      targetObjectId: "SCH-OBJ-CALENDAR",
      targetVersionFieldId: "SCH-CALENDAR-F-VERSION",
      requiredState: "PUBLISHED",
    },
    {
      refFieldId: "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF",
      versionFieldId: "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION",
      targetObjectId: "SCH-OBJ-CONSTRAINT-SNAPSHOT",
      targetVersionFieldId: "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
      requiredState: "ACTIVE",
    },
  ];
  const sourceActionIds = [
    "SCH-ACT-GENERATE-CANDIDATE",
    "SCH-ACT-CONFIRM-CANDIDATE",
    "SCH-ACT-PUBLISH-CANDIDATE",
  ];
  let valid = expectedSources.every((expected) => {
    const refEntry = index.fieldById.get(expected.refFieldId);
    const versionEntry = index.fieldById.get(expected.versionFieldId);
    const targetVersionEntry = index.fieldById.get(expected.targetVersionFieldId);
    const ref = refEntry?.value;
    return refEntry?.moduleId === "SCH-001"
      && refEntry?.objectId === candidate.id
      && ref?.dataType === "ID"
      && ref?.mutability === "IMMUTABLE"
      && ref?.referenceIntegrity === "VERSION_PINNED"
      && ref?.stateGuardPolicy === "ALWAYS_REQUIRED"
      && hasExactValues(ref?.valueSource, {
        kind: "OBJECT_REF",
        targetObjectId: expected.targetObjectId,
      })
      && hasExactValues(ref?.versionBinding, {
        versionFieldId: expected.versionFieldId,
        targetVersionFieldId: expected.targetVersionFieldId,
      })
      && hasExactKeys(ref?.actionApplicability, ["requiredActionIds"])
      && sameStringSet(ref?.actionApplicability?.requiredActionIds, sourceActionIds)
      && versionEntry?.objectId === candidate.id
      && versionEntry?.value?.dataType === "INTEGER"
      && versionEntry?.value?.mutability === "IMMUTABLE"
      && targetVersionEntry?.objectId === expected.targetObjectId
      && targetVersionEntry?.value?.dataType === "INTEGER"
      && targetVersionEntry?.value?.idempotencyRole === "OBJECT_VERSION";
  });

  const lineageBindings = records(candidate?.lineageBindings);
  valid = valid
    && lineageBindings.length === expectedSources.length
    && expectedSources.every((expected) => lineageBindings.some((binding) => (
      hasExactValues(binding, {
        refFieldId: expected.refFieldId,
        versionFieldId: expected.versionFieldId,
        targetObjectId: expected.targetObjectId,
        targetVersionFieldId: expected.targetVersionFieldId,
      })
    )))
    && !index.fieldById.has("SCH-CANDIDATE-F-SOURCE-VERSION");

  const expectedRelationships = [
    {
      id: "SCH-REL-CANDIDATE-CALENDAR",
      fromObjectId: "SCH-OBJ-CANDIDATE",
      toObjectId: "SCH-OBJ-CALENDAR",
    },
    {
      id: "SCH-REL-CANDIDATE-CONSTRAINT-SNAPSHOT",
      fromObjectId: "SCH-OBJ-CANDIDATE",
      toObjectId: "SCH-OBJ-CONSTRAINT-SNAPSHOT",
    },
  ];
  const relationships = records(moduleEntry.value?.relationships);
  valid = valid && expectedRelationships.every((expected) => relationships.some((value) => (
    value?.id === expected.id
    && value?.fromObjectId === expected.fromObjectId
    && value?.toObjectId === expected.toObjectId
    && value?.type === "DERIVED_FROM"
    && value?.cardinality === "MANY_TO_ONE"
    && value?.ownershipScope === "SAME_SCHOOL"
  )));

  const payloadSpecs = [
    {
      fieldId: "SCH-CONSTRAINT-F-TEACHER-AVAILABILITY-WINDOWS",
      kindCode: "TEACHER_AVAILABILITY",
      requiredKeys: ["teacherId", "availablePeriods"],
      actionId: "SCH-ACT-CREATE-TEACHER-AVAILABILITY-CONSTRAINT",
    },
    {
      fieldId: "SCH-CONSTRAINT-F-CLASS-COURSE-PERIOD-RULES",
      kindCode: "CLASS_PERIOD",
      requiredKeys: ["classId", "courseId", "allowedPeriods"],
      actionId: "SCH-ACT-CREATE-CLASS-PERIOD-CONSTRAINT",
    },
    {
      fieldId: "SCH-CONSTRAINT-F-TEACHER-LOAD-LIMITS",
      kindCode: "COURSE_LOAD",
      requiredKeys: ["teacherId", "courseId", "maxPeriodsPerWeek"],
      actionId: "SCH-ACT-CREATE-COURSE-LOAD-CONSTRAINT",
    },
    {
      fieldId: "SCH-CONSTRAINT-F-ROOM-CAPACITY-RULES",
      kindCode: "ROOM_CAPACITY",
      requiredKeys: ["roomId", "minimumCapacity"],
      actionId: "SCH-ACT-CREATE-ROOM-CAPACITY-CONSTRAINT",
    },
  ];
  const sourceGroups = records(constraintEntry.value?.exclusiveSourceGroups);
  valid = valid
    && sourceGroups.length === payloadSpecs.length
    && payloadSpecs.every((expected) => {
      const payloadEntry = index.fieldById.get(expected.fieldId);
      const create = action(expected.actionId);
      const accepted = records(create?.acceptedInputValues);
      return payloadEntry?.moduleId === "SCH-001"
        && payloadEntry?.objectId === "SCH-OBJ-CONSTRAINT"
        && payloadEntry?.value?.dataType === "JSON"
        && payloadEntry?.value?.required === false
        && hasExactKeys(payloadEntry?.value?.payloadContract, ["kindCode", "requiredKeys"])
        && payloadEntry.value.payloadContract.kindCode === expected.kindCode
        && sameStringSet(
          payloadEntry.value.payloadContract.requiredKeys,
          expected.requiredKeys,
        )
        && sourceGroups.some((group) => (
          group?.id === expected.kindCode
          && sameStringSet(group?.fieldIds, [expected.fieldId])
        ))
        && create?.operationKind === "CREATE"
        && create?.targetObjectId === "SCH-OBJ-CONSTRAINT"
        && sameStringSet(create?.inputFieldIds, [
          "SCH-CONSTRAINT-F-KIND",
          "SCH-CONSTRAINT-F-HARDNESS",
          expected.fieldId,
        ])
        && sameStringSet(create?.outputFieldIds, [
          "SCH-CONSTRAINT-F-ID",
          "SCH-CONSTRAINT-F-VERSION",
        ])
        && concreteActionState(index, create) === "DRAFT"
        && accepted.length === 1
        && accepted[0]?.fieldId === "SCH-CONSTRAINT-F-KIND"
        && accepted[0]?.optionSetId === "OPT-EXT-017"
        && accepted[0]?.partitionId === "SCH-CONSTRAINT-KIND"
        && sameStringSet(accepted[0]?.codes, [expected.kindCode]);
    });

  const snapshot = snapshotEntry.value;
  const itemsEntry = index.fieldById.get("SCH-CONSTRAINT-SNAPSHOT-F-ITEMS");
  const constraintIdsEntry = index.fieldById
    .get("SCH-CONSTRAINT-SNAPSHOT-F-CONSTRAINT-IDS");
  const hashEntry = index.fieldById.get("SCH-CONSTRAINT-SNAPSHOT-F-HASH");
  const snapshotStatusEntry = index.fieldById.get("SCH-CONSTRAINT-SNAPSHOT-F-STATUS");
  const snapshotVersionEntry = index.fieldById.get("SCH-CONSTRAINT-SNAPSHOT-F-VERSION");
  const itemContract = itemsEntry?.value?.snapshotItemContract;
  const requiredKindCodes = payloadSpecs.map(({ kindCode }) => kindCode);
  valid = valid
    && setEquals(stateIds(snapshot), new Set(["DRAFT", "ACTIVE", "REPLACED"]))
    && itemsEntry?.moduleId === "SCH-001"
    && itemsEntry?.objectId === snapshot.id
    && itemsEntry?.value?.dataType === "JSON"
    && itemsEntry?.value?.mutability === "IMMUTABLE"
    && hasExactKeys(itemContract, [
      "sourceObjectId",
      "sourceVersionFieldId",
      "requiredKeys",
      "groupBy",
      "requiredKindCodes",
      "perKindCardinality",
    ])
    && itemContract?.sourceObjectId === "SCH-OBJ-CONSTRAINT"
    && itemContract?.sourceVersionFieldId === "SCH-CONSTRAINT-F-VERSION"
    && exactUniqueStrings(itemContract?.requiredKeys, [
      "constraintId",
      "constraintVersion",
      "kind",
      "hardness",
    ])
    && itemContract?.groupBy === "kind"
    && exactUniqueStrings(itemContract?.requiredKindCodes, requiredKindCodes)
    && itemContract?.perKindCardinality === "EXACTLY_ONE"
    && constraintIdsEntry?.moduleId === "SCH-001"
    && constraintIdsEntry?.objectId === snapshot.id
    && constraintIdsEntry?.value?.dataType === "STRING_ARRAY"
    && constraintIdsEntry?.value?.mutability === "IMMUTABLE"
    && hasStableIdempotencyRole(
      index,
      "SCH-CONSTRAINT-SNAPSHOT-F-CONSTRAINT-IDS",
      ["FANOUT_SET"],
    )
    && hashEntry?.moduleId === "SCH-001"
    && hashEntry?.objectId === snapshot.id
    && hashEntry?.value?.dataType === "STRING"
    && hashEntry?.value?.mutability === "IMMUTABLE"
    && snapshotStatusEntry?.moduleId === "SCH-001"
    && snapshotStatusEntry?.objectId === snapshot.id
    && snapshotStatusEntry?.value?.dataType === "STRING"
    && snapshotVersionEntry?.moduleId === "SCH-001"
    && snapshotVersionEntry?.objectId === snapshot.id
    && snapshotVersionEntry?.value?.dataType === "INTEGER"
    && snapshotVersionEntry?.value?.idempotencyRole === "OBJECT_VERSION";

  const createSnapshot = action("SCH-ACT-CREATE-CONSTRAINT-SNAPSHOT");
  const activateSnapshot = action("SCH-ACT-ACTIVATE-CONSTRAINT-SNAPSHOT");
  const replaceSnapshot = action("SCH-ACT-REPLACE-CONSTRAINT-SNAPSHOT");
  valid = valid
    && createSnapshot?.operationKind === "CREATE"
    && createSnapshot?.targetObjectId === snapshot.id
    && concreteActionState(index, createSnapshot) === "DRAFT"
    && exactUniqueStrings(createSnapshot?.inputFieldIds, [
      "SCH-CONSTRAINT-SNAPSHOT-F-ITEMS",
    ])
    && exactUniqueStrings(createSnapshot?.outputFieldIds, [
      "SCH-CONSTRAINT-SNAPSHOT-F-ID",
      "SCH-CONSTRAINT-SNAPSHOT-F-CONSTRAINT-IDS",
      "SCH-CONSTRAINT-SNAPSHOT-F-HASH",
      "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
      "SCH-CONSTRAINT-SNAPSHOT-F-STATUS",
    ])
    && activateSnapshot?.targetObjectId === snapshot.id
    && activateSnapshot?.transition?.from === "DRAFT"
    && activateSnapshot?.transition?.to === "ACTIVE"
    && exactUniqueStrings(activateSnapshot?.outputFieldIds, [
      "SCH-CONSTRAINT-SNAPSHOT-F-STATUS",
      "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
    ])
    && replaceSnapshot?.targetObjectId === snapshot.id
    && replaceSnapshot?.transition?.from === "ACTIVE"
    && replaceSnapshot?.transition?.to === "REPLACED"
    && exactUniqueStrings(replaceSnapshot?.outputFieldIds, [
      "SCH-CONSTRAINT-SNAPSHOT-F-STATUS",
      "SCH-CONSTRAINT-SNAPSHOT-F-VERSION",
    ]);

  valid = valid && sourceActionIds.every((actionId) => {
    const sourceAction = action(actionId);
    const guards = records(sourceAction?.relatedStateGuards);
    return list(sourceAction?.failureResults).includes("SOURCE_VERSION_STALE")
      && guards.length === expectedSources.length
      && expectedSources.every((expected) => guards.some((guard) => (
        hasExactValues(guard, {
          refFieldId: expected.refFieldId,
          versionFieldId: expected.versionFieldId,
          targetObjectId: expected.targetObjectId,
          requiredState: expected.requiredState,
        })
      )));
  });

  const expectedRecheckActionIds = [
    "SCH-ACT-CONFIRM-CANDIDATE",
    "SCH-ACT-PUBLISH-CANDIDATE",
  ];
  valid = valid && expectedRecheckActionIds.every((actionId) => {
    const recheckAction = action(actionId);
    const recheck = recheckAction?.sourceRecheck;
    return hasExactKeys(recheck, ["versionFieldIds", "hardGate", "softGate"])
      && exactUniqueStrings(recheck?.versionFieldIds, [
        "SCH-CANDIDATE-F-CALENDAR-VERSION",
        "SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION",
      ])
      && hasExactValues(recheck?.hardGate, {
        fieldId: "SCH-CANDIDATE-F-HARD-CHECK",
        requiredCode: "PASS",
      })
      && hasExactValues(recheck?.softGate, {
        fieldId: "SCH-CANDIDATE-F-SOFT-CONSTRAINT-ACKNOWLEDGED",
        requiredValue: true,
      })
      && [
        ...recheck.versionFieldIds,
        recheck.hardGate.fieldId,
        recheck.softGate.fieldId,
      ].every((fieldId) => list(recheckAction?.inputFieldIds).includes(fieldId));
  });

  const stale = action("SCH-ACT-MARK-CANDIDATE-STALE");
  const staleAllows = records(stale?.permissions).filter(({ effect }) => effect === "ALLOW");
  const staleEvent = index.eventById.get("EVT-SCH-SOURCE-VERSION-CHANGED")?.value;
  valid = valid
    && stale?.executionMode === "SYSTEM_EVENT"
    && !Object.hasOwn(stale ?? {}, "clients")
    && hasExactValues(stale?.trigger, {
      kind: "EVENT",
      eventId: "EVT-SCH-SOURCE-VERSION-CHANGED",
    })
    && sameStringSet(stale?.transition?.from, [
      "GENERATED",
      "REVIEWED",
      "CONFIRMED",
      "PUBLISHED",
    ])
    && stale?.transition?.to === "STALE"
    && sameStringSet(stale?.outputFieldIds, ["SCH-CANDIDATE-F-STATUS"])
    && staleAllows.length === 1
    && staleAllows[0]?.actorRef === "SYSTEM"
    && sameStringSet(staleEvent?.triggeredActionIds, [
      "SCH-ACT-MARK-CANDIDATE-STALE",
    ])
    && exactUniqueStrings(staleEvent?.producerActionIds, [
      "SCH-ACT-PUBLISH-CALENDAR",
      "SCH-ACT-ACTIVATE-CONSTRAINT-SNAPSHOT",
      "SCH-ACT-REPLACE-CONSTRAINT-SNAPSHOT",
    ])
    && !index.pages.some(({ value }) => (
      list(value?.actionIds).includes("SCH-ACT-MARK-CANDIDATE-STALE")
    ));

  return valid
    ? []
    : [
      "INVALID_SCHEDULE_SOURCE_CONTRACT SCH candidates require closed calendar and kind-specific constraint lineage with event-driven staleness",
    ];
}

function preparationHandoffErrors(index) {
  const moduleEntry = index.moduleById.get("PREP-001");
  const lessonEntry = index.objectById.get("PREP-OBJ-LESSON-PLAN");
  const draftEntry = index.objectById.get("PREP-OBJ-ASSIGNMENT-DRAFT");
  const generateEntry = index.actionById.get("PREP-ACT-GENERATE-ASSIGNMENT-DRAFT");
  const completeEntry = index.actionById.get("PREP-ACT-COMPLETE-ASSIGNMENT-DRAFT");
  const confirmEntry = index.actionById.get("PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF");
  const formalEntry = index.actionById.get("HW-ACT-CREATE-DRAFT");
  if (
    !moduleEntry
    || lessonEntry?.moduleId !== "PREP-001"
    || draftEntry?.moduleId !== "PREP-001"
    || generateEntry?.moduleId !== "PREP-001"
    || completeEntry?.moduleId !== "PREP-001"
    || confirmEntry?.moduleId !== "PREP-001"
    || formalEntry?.moduleId !== "HW-001"
  ) return task8ProfileEnabled(index)
    ? ["INVALID_PREPARATION_HANDOFF_CONTRACT PREP-001 prerequisites are missing"]
    : [];

  const draft = draftEntry.value;
  const generate = generateEntry.value;
  const complete = completeEntry.value;
  const confirm = confirmEntry.value;
  const formal = formalEntry.value;
  const lessonRefEntry = index.fieldById.get("PREP-DRAFT-F-SOURCE-LESSON-REF");
  const lessonVersionEntry = index.fieldById
    .get("PREP-DRAFT-F-SOURCE-LESSON-VERSION");
  const sourceVersionEntry = index.fieldById.get("PREP-LESSON-F-VERSION");
  const payloadEntry = index.fieldById.get("PREP-DRAFT-F-CONTENT");
  const lessonRef = lessonRefEntry?.value;
  const expectedFormalInputFieldIds = [
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
  ];
  const expectedBindings = [
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
  ];
  const exactOrderedUniqueStrings = (actual, expected) => (
    Array.isArray(actual)
    && actual.length === expected.length
    && new Set(actual).size === actual.length
    && actual.every((value, position) => value === expected[position])
  );
  const expectedLineage = {
    refFieldId: "PREP-DRAFT-F-SOURCE-LESSON-REF",
    versionFieldId: "PREP-DRAFT-F-SOURCE-LESSON-VERSION",
    targetObjectId: "PREP-OBJ-LESSON-PLAN",
    targetVersionFieldId: "PREP-LESSON-F-VERSION",
  };
  let valid = lessonRefEntry?.moduleId === "PREP-001"
    && lessonRefEntry?.objectId === draft.id
    && list(draft?.states).length === 2
    && setEquals(stateIds(draft), new Set(["DRAFT", "READY_FOR_HANDOFF"]))
    && lessonRef?.dataType === "ID"
    && lessonRef?.mutability === "IMMUTABLE"
    && lessonRef?.referenceIntegrity === "VERSION_PINNED"
    && lessonRef?.stateGuardPolicy === "ALWAYS_REQUIRED"
    && hasExactValues(lessonRef?.valueSource, {
      kind: "OBJECT_REF",
      targetObjectId: "PREP-OBJ-LESSON-PLAN",
    })
    && hasExactValues(lessonRef?.versionBinding, {
      versionFieldId: "PREP-DRAFT-F-SOURCE-LESSON-VERSION",
      targetVersionFieldId: "PREP-LESSON-F-VERSION",
    })
    && hasExactKeys(lessonRef?.actionApplicability, ["requiredActionIds"])
    && exactOrderedUniqueStrings(lessonRef?.actionApplicability?.requiredActionIds, [
      "PREP-ACT-GENERATE-ASSIGNMENT-DRAFT",
      "PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF",
    ])
    && lessonVersionEntry?.moduleId === "PREP-001"
    && lessonVersionEntry?.objectId === draft.id
    && lessonVersionEntry?.value?.dataType === "INTEGER"
    && lessonVersionEntry?.value?.mutability === "IMMUTABLE"
    && sourceVersionEntry?.objectId === lessonEntry.value?.id
    && sourceVersionEntry?.value?.dataType === "INTEGER"
    && sourceVersionEntry?.value?.idempotencyRole === "OBJECT_VERSION";

  const lineageBindings = records(draft?.lineageBindings);
  const relationships = records(moduleEntry.value?.relationships);
  valid = valid
    && lineageBindings.length === 1
    && hasExactValues(lineageBindings[0], expectedLineage)
    && relationships.some((relationship) => (
      relationship?.id === "PREP-REL-DRAFT-LESSON"
      && relationship?.fromObjectId === draft.id
      && relationship?.toObjectId === lessonEntry.value?.id
      && relationship?.type === "DERIVED_FROM"
      && relationship?.cardinality === "MANY_TO_ONE"
      && relationship?.ownershipScope === "SAME_SUBJECT"
    ));

  const guards = records(generate?.relatedStateGuards);
  const expectedGuard = {
    refFieldId: "PREP-DRAFT-F-SOURCE-LESSON-REF",
    versionFieldId: "PREP-DRAFT-F-SOURCE-LESSON-VERSION",
    targetObjectId: "PREP-OBJ-LESSON-PLAN",
    requiredState: "CONFIRMED",
  };
  const subjectTeacherIsExclusiveAllow = (actionValue) => {
    const allows = records(actionValue?.permissions).filter(({ effect }) => effect === "ALLOW");
    return allows.length === 1
      && allows[0]?.dutyRef === "DUTY-SUBJECT-TEACHER"
      && !Object.hasOwn(allows[0] ?? {}, "roleRef")
      && !Object.hasOwn(allows[0] ?? {}, "actorRef");
  };
  valid = valid
    && generate?.operationKind === "CREATE"
    && generate?.targetObjectId === draft.id
    && concreteActionState(index, generate) === "DRAFT"
    && exactOrderedUniqueStrings(generate?.inputFieldIds, ["PREP-DRAFT-F-SOURCE-LESSON-REF"])
    && exactOrderedUniqueStrings(generate?.outputFieldIds, [
      "PREP-DRAFT-F-ID",
      "PREP-DRAFT-F-CONTENT",
      "PREP-DRAFT-F-SOURCE-LESSON-VERSION",
      "PREP-DRAFT-F-STATUS",
    ])
    && guards.length === 1
    && hasExactValues(guards[0], expectedGuard)
    && list(generate?.failureResults).includes("LESSON_STALE")
    && subjectTeacherIsExclusiveAllow(generate)
    && !Object.hasOwn(generate ?? {}, "handoffContract")
    && complete?.operationKind === "UPDATE"
    && complete?.targetObjectId === draft.id
    && complete?.transition?.from === "DRAFT"
    && complete?.transition?.to === "DRAFT"
    && exactOrderedUniqueStrings(complete?.inputFieldIds, ["PREP-DRAFT-F-CONTENT"])
    && exactOrderedUniqueStrings(complete?.outputFieldIds, [
      "PREP-DRAFT-F-CONTENT",
      "PREP-DRAFT-F-STATUS",
    ])
    && subjectTeacherIsExclusiveAllow(complete)
    && !Object.hasOwn(complete ?? {}, "handoffContract")
    && confirm?.operationKind === "UPDATE"
    && confirm?.targetObjectId === draft.id
    && confirm?.transition?.from === "DRAFT"
    && confirm?.transition?.to === "READY_FOR_HANDOFF"
    && exactOrderedUniqueStrings(confirm?.inputFieldIds, [
      "PREP-DRAFT-F-SOURCE-LESSON-REF",
      "PREP-DRAFT-F-SOURCE-LESSON-VERSION",
    ])
    && exactOrderedUniqueStrings(confirm?.outputFieldIds, ["PREP-DRAFT-F-STATUS"])
    && records(confirm?.relatedStateGuards).length === 1
    && hasExactValues(records(confirm?.relatedStateGuards)[0], expectedGuard)
    && subjectTeacherIsExclusiveAllow(confirm)
    && list(confirm?.failureResults).includes("LESSON_STALE")
    && list(confirm?.failureResults).includes("HANDOFF_INCOMPLETE");

  const handoff = confirm?.handoffContract;
  const formalAllows = records(formal?.permissions).filter(({ effect }) => effect === "ALLOW");
  const bindings = records(handoff?.fieldBindings);
  const payloadSchema = payloadEntry?.value?.handoffPayloadSchema;
  const payloadProperties = isRecord(payloadSchema?.properties)
    ? payloadSchema.properties
    : {};
  const payloadBindings = expectedBindings.filter(({ sourceKind }) => (
    sourceKind === "GENERATED_PAYLOAD" || sourceKind === "TEACHER_REQUIRED"
  ));
  const lessonBindings = expectedBindings.filter(({ sourceKind }) => (
    sourceKind === "LESSON_FIELD"
  ));
  valid = valid
    && hasExactKeys(handoff, [
      "formalActionId",
      "payloadFieldId",
      "formalInputFieldIds",
      "fieldBindings",
      "completionRule",
      "requiredConfirmationDutyRef",
      "effectBoundary",
    ])
    && handoff?.formalActionId === formal.id
    && handoff?.payloadFieldId === "PREP-DRAFT-F-CONTENT"
    && payloadEntry?.objectId === draft.id
    && payloadEntry?.value?.dataType === "JSON"
    && exactOrderedUniqueStrings(formal?.inputFieldIds, expectedFormalInputFieldIds)
    && exactOrderedUniqueStrings(handoff?.formalInputFieldIds, expectedFormalInputFieldIds)
    && bindings.length === expectedBindings.length
    && bindings.every((binding, position) => hasExactValues(
      binding,
      expectedBindings[position],
    ))
    && lessonBindings.every(({ targetFieldId, sourceFieldId, sourceVersionFieldId }) => {
      const targetField = index.fieldById.get(targetFieldId);
      const sourceField = index.fieldById.get(sourceFieldId);
      return targetField?.objectId === "HW-OBJ-ASSIGNMENT"
        && sourceField?.objectId === "PREP-OBJ-LESSON-PLAN"
        && targetField?.value?.dataType === sourceField?.value?.dataType
        && sourceVersionFieldId === "PREP-LESSON-F-VERSION";
    })
    && hasExactKeys(payloadSchema, [
      "schemaVersion",
      "additionalProperties",
      "properties",
    ])
    && payloadSchema?.schemaVersion === "PREP_HW_DRAFT_V1"
    && payloadSchema?.additionalProperties === false
    && setEquals(
      new Set(Object.keys(payloadProperties)),
      new Set(payloadBindings.map(({ payloadPath }) => payloadPath)),
    )
    && payloadBindings.every(({ targetFieldId, payloadPath }) => {
      const property = payloadProperties[payloadPath];
      return hasExactKeys(property, ["dataType", "required"])
        && property.required === true
        && property.dataType === index.fieldById.get(targetFieldId)?.value?.dataType;
    })
    && hasExactValues(handoff?.completionRule, {
      failureResult: "HANDOFF_INCOMPLETE",
      requiredBindingCount: 15,
      requireAllTeacherInputs: true,
      rejectUnknownPayloadFields: true,
    })
    && handoff?.requiredConfirmationDutyRef === "DUTY-SUBJECT-TEACHER"
    && handoff?.effectBoundary === "DRAFT_ONLY_UNTIL_FORMAL_HW_ACTION"
    && formal?.operationKind === "CREATE"
    && formal?.targetObjectId === "HW-OBJ-ASSIGNMENT"
    && formalAllows.some(({ dutyRef }) => dutyRef === "DUTY-SUBJECT-TEACHER");

  return valid
    ? []
    : [
      "INVALID_PREPARATION_HANDOFF_CONTRACT PREP assignment drafts require confirmed lesson lineage and the exact formal HW draft input surface",
    ];
}

function platformAuditErrors(index) {
  const auditModule = index.moduleById.get("AUD-001")?.value;
  const platformModule = index.moduleById.get("PLAT-001")?.value;
  const requestEntry = index.objectById.get("AUD-OBJ-ACCESS-REQUEST");
  const sessionEntry = index.objectById.get("AUD-OBJ-ACCESS-SESSION");
  const supportEntry = index.objectById.get("PLAT-OBJ-SUPPORT-CASE");
  const requiredActionIds = [
    "AUD-ACT-REQUEST-SENSITIVE",
    "AUD-ACT-APPROVE-SENSITIVE",
    "AUD-ACT-DENY-SENSITIVE",
    "AUD-ACT-EXPIRE-ACCESS-REQUEST",
    "AUD-ACT-OPEN-SESSION",
    "AUD-ACT-EXPIRE-SESSION",
    "AUD-ACT-REVOKE-SESSION",
    "AUD-ACT-APPEND-EVENT",
    "PLAT-ACT-CREATE-SUPPORT-CASE",
    "PLAT-ACT-CLOSE-SUPPORT-CASE",
    "PLAT-ACT-USE-SUPPORT-ACCESS",
  ];
  if (
    !auditModule
    || !platformModule
    || requestEntry?.moduleId !== "AUD-001"
    || sessionEntry?.moduleId !== "AUD-001"
    || supportEntry?.moduleId !== "PLAT-001"
    || requiredActionIds.some((id) => !index.actionById.has(id))
  ) return task8ProfileEnabled(index)
    ? ["INVALID_PLATFORM_AUD_CONTRACT PLAT-001 or AUD-001 prerequisites are missing"]
    : [];

  const action = (id) => index.actionById.get(id)?.value;
  const field = (id) => index.fieldById.get(id);
  const exactUniqueStrings = (values, expected) => (
    Array.isArray(values)
    && values.length === expected.length
    && new Set(values).size === values.length
    && setEquals(new Set(values), new Set(expected))
  );
  const expectedSessionLineage = {
    refFieldId: "AUD-SESSION-F-REQUEST-ID",
    versionFieldId: "AUD-SESSION-F-REQUEST-VERSION",
    targetObjectId: "AUD-OBJ-ACCESS-REQUEST",
    targetVersionFieldId: "AUD-REQUEST-F-VERSION",
  };
  const expectedSupportLineage = {
    refFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
    versionFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
    targetObjectId: "AUD-OBJ-ACCESS-SESSION",
    targetVersionFieldId: "AUD-SESSION-F-VERSION",
  };
  const expectedGuard = {
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
  const expectedRelatedGuard = {
    refFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
    versionFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
    targetObjectId: "AUD-OBJ-ACCESS-SESSION",
    requiredState: "ACTIVE",
  };

  const requestVersion = field("AUD-REQUEST-F-VERSION");
  const sessionVersion = field("AUD-SESSION-F-VERSION");
  const sessionRequest = field("AUD-SESSION-F-REQUEST-ID");
  const sessionRequestVersion = field("AUD-SESSION-F-REQUEST-VERSION");
  const sessionOperator = field("AUD-SESSION-F-AUTHORIZED-OPERATOR-ID");
  let valid = requestVersion?.objectId === requestEntry.value?.id
    && requestVersion?.value?.dataType === "INTEGER"
    && requestVersion?.value?.mutability === "IMMUTABLE"
    && requestVersion?.value?.idempotencyRole === "OBJECT_VERSION"
    && sessionVersion?.objectId === sessionEntry.value?.id
    && sessionVersion?.value?.dataType === "INTEGER"
    && sessionVersion?.value?.mutability === "IMMUTABLE"
    && sessionVersion?.value?.idempotencyRole === "OBJECT_VERSION"
    && sessionRequest?.objectId === sessionEntry.value?.id
    && sessionRequest?.value?.referenceIntegrity === "VERSION_PINNED"
    && hasExactValues(sessionRequest?.value?.valueSource, {
      kind: "OBJECT_REF",
      targetObjectId: "AUD-OBJ-ACCESS-REQUEST",
    })
    && hasExactValues(sessionRequest?.value?.versionBinding, {
      versionFieldId: "AUD-SESSION-F-REQUEST-VERSION",
      targetVersionFieldId: "AUD-REQUEST-F-VERSION",
    })
    && sessionRequestVersion?.objectId === sessionEntry.value?.id
    && sessionOperator?.objectId === sessionEntry.value?.id
    && sessionOperator?.value?.dataType === "ID"
    && sessionOperator?.value?.mutability === "IMMUTABLE"
    && hasExactValues(sessionOperator?.value?.sourceBinding, {
      sourceRefFieldId: "AUD-SESSION-F-REQUEST-ID",
      sourceVersionFieldId: "AUD-SESSION-F-REQUEST-VERSION",
      sourceFieldId: "AUD-REQUEST-F-REQUESTER",
    })
    && records(sessionEntry.value?.lineageBindings).length === 1
    && hasExactValues(records(sessionEntry.value?.lineageBindings)[0], expectedSessionLineage)
    && setEquals(stateIds(requestEntry.value), new Set([
      "REQUESTED", "APPROVED", "DENIED", "EXPIRED",
    ]))
    && setEquals(stateIds(sessionEntry.value), new Set(["ACTIVE", "EXPIRED", "REVOKED"]));

  const openSession = action("AUD-ACT-OPEN-SESSION");
  valid = valid
    && openSession?.operationKind === "CREATE"
    && openSession?.targetObjectId === "AUD-OBJ-ACCESS-SESSION"
    && exactUniqueStrings(openSession?.outputFieldIds, [
      "AUD-SESSION-F-ID",
      "AUD-SESSION-F-START",
      "AUD-SESSION-F-AUTHORIZED-OPERATOR-ID",
      "AUD-SESSION-F-STATUS",
      "AUD-SESSION-F-VERSION",
    ])
    && records(openSession?.relatedStateGuards).length === 1
    && hasExactValues(records(openSession?.relatedStateGuards)[0], {
      refFieldId: "AUD-SESSION-F-REQUEST-ID",
      versionFieldId: "AUD-SESSION-F-REQUEST-VERSION",
      targetObjectId: "AUD-OBJ-ACCESS-REQUEST",
      requiredState: "APPROVED",
    });

  const support = supportEntry.value;
  const supportRef = field("PLAT-SUPPORT-CASE-F-AUD-SESSION-REF");
  const supportVersion = field("PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION");
  const projectedOperator = field("PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID");
  const requestedScope = field("PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE");
  valid = valid
    && support?.lifecyclePolicyId === "LIFE-001"
    && setEquals(stateIds(support), new Set(["OPEN", "CLOSED"]))
    && supportRef?.objectId === support.id
    && supportRef?.value?.dataType === "ID"
    && supportRef?.value?.mutability === "IMMUTABLE"
    && supportRef?.value?.referenceIntegrity === "VERSION_PINNED"
    && supportRef?.value?.stateGuardPolicy === "ALWAYS_REQUIRED"
    && hasExactValues(supportRef?.value?.valueSource, {
      kind: "OBJECT_REF",
      targetObjectId: "AUD-OBJ-ACCESS-SESSION",
    })
    && hasExactValues(supportRef?.value?.versionBinding, {
      versionFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
      targetVersionFieldId: "AUD-SESSION-F-VERSION",
    })
    && hasExactKeys(supportRef?.value?.actionApplicability, ["requiredActionIds"])
    && exactUniqueStrings(supportRef?.value?.actionApplicability?.requiredActionIds, [
      "PLAT-ACT-CREATE-SUPPORT-CASE",
      "PLAT-ACT-USE-SUPPORT-ACCESS",
    ])
    && supportVersion?.objectId === support.id
    && supportVersion?.value?.dataType === "INTEGER"
    && supportVersion?.value?.mutability === "IMMUTABLE"
    && projectedOperator?.objectId === support.id
    && requestedScope?.objectId === support.id
    && requestedScope?.value?.dataType === "JSON"
    && hasExactValues(projectedOperator?.value?.sourceBinding, {
      sourceRefFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
      sourceVersionFieldId: "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
      sourceFieldId: "AUD-SESSION-F-AUTHORIZED-OPERATOR-ID",
    })
    && records(support?.lineageBindings).length === 1
    && hasExactValues(records(support?.lineageBindings)[0], expectedSupportLineage);

  const supportActions = index.actions
    .filter(({ moduleId, value }) => (
      moduleId === "PLAT-001" && value?.targetObjectId === "PLAT-OBJ-SUPPORT-CASE"
    ))
    .map(({ value }) => value.id);
  valid = valid
    && exactUniqueStrings(supportActions, [
      "PLAT-ACT-CREATE-SUPPORT-CASE",
      "PLAT-ACT-CLOSE-SUPPORT-CASE",
      "PLAT-ACT-USE-SUPPORT-ACCESS",
    ])
    && !index.actionById.has("PLAT-ACT-REQUEST-SUPPORT-ACCESS")
    && !index.actionById.has("PLAT-ACT-APPROVE-SUPPORT-ACCESS")
    && !index.actionById.has("PLAT-ACT-EXPIRE-SUPPORT-ACCESS");

  const createCase = action("PLAT-ACT-CREATE-SUPPORT-CASE");
  const closeCase = action("PLAT-ACT-CLOSE-SUPPORT-CASE");
  const useAccess = action("PLAT-ACT-USE-SUPPORT-ACCESS");
  for (const guardedAction of [createCase, useAccess]) {
    valid = valid
      && records(guardedAction?.relatedStateGuards).length === 1
      && hasExactValues(records(guardedAction?.relatedStateGuards)[0], expectedRelatedGuard)
      && hasExactValues(guardedAction?.accessGuard, expectedGuard);
  }
  valid = valid
    && createCase?.operationKind === "CREATE"
    && createCase?.targetObjectId === support.id
    && exactUniqueStrings(createCase?.inputFieldIds, [
      "PLAT-SUPPORT-CASE-F-PURPOSE",
      "PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE",
      "PLAT-SUPPORT-CASE-F-AUDIT-REASON",
      "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
    ])
    && exactUniqueStrings(createCase?.outputFieldIds, [
      "PLAT-SUPPORT-CASE-F-ID",
      "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
      "PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID",
      "PLAT-SUPPORT-CASE-F-STATUS",
    ])
    && createCase?.risk === "HIGH"
    && createCase?.auditMode === "REQUIRED"
    && exactUniqueStrings(createCase?.failureResults, [
      "PERMISSION_DENIED",
      "ACCESS_INACTIVE",
      "ACCESS_EXPIRED",
      "ACCESS_OTHER_RECORD",
      "ACCESS_SCOPE_DENIED",
      "SOURCE_VERSION_STALE",
      "VALIDATION_FAILED",
      "VERSION_CONFLICT",
      "AUDIT_FAILED",
    ])
    && closeCase?.transition?.from === "OPEN"
    && closeCase?.transition?.to === "CLOSED"
    && closeCase?.risk === "HIGH"
    && closeCase?.auditMode === "REQUIRED"
    && useAccess?.operationKind === "READ"
    && useAccess?.writes === false
    && exactUniqueStrings(useAccess?.inputFieldIds, [
      "PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE",
    ])
    && exactUniqueStrings(useAccess?.outputFieldIds, [
      "PLAT-SUPPORT-CASE-F-PURPOSE",
      "PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE",
      "PLAT-SUPPORT-CASE-F-AUDIT-REASON",
      "PLAT-SUPPORT-CASE-F-AUD-SESSION-REF",
      "PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION",
      "PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID",
      "PLAT-SUPPORT-CASE-F-STATUS",
    ])
    && useAccess?.risk === "HIGH"
    && useAccess?.auditMode === "REQUIRED"
    && exactUniqueStrings(useAccess?.failureResults, [
      "PERMISSION_DENIED",
      "NOT_FOUND",
      "ACCESS_INACTIVE",
      "ACCESS_EXPIRED",
      "ACCESS_OTHER_RECORD",
      "ACCESS_SCOPE_DENIED",
      "SOURCE_VERSION_STALE",
      "AUDIT_FAILED",
    ])
    && records(useAccess?.permissions).filter((permission) => (
      permission.effect === "ALLOW" && permission.roleRef === "ROLE-PLATFORM-OPS"
    )).length === 1
    && records(useAccess?.permissions).some((permission) => (
      permission.effect === "ALLOW"
      && permission.roleRef === "ROLE-PLATFORM-OPS"
      && permission.scope?.kind === "OWN_RECORD"
      && permission.scope?.subjectFieldId
        === "PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID"
    ))
    && records(useAccess?.permissions).some((permission) => (
      permission.effect === "DENY"
      && permission.roleRef === "ROLE-PLATFORM-OPS"
      && permission.scope?.kind === "OTHER_RECORD"
      && permission.scope?.subjectFieldId
        === "PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID"
    ))
    && hasExactValues(action("AUD-ACT-APPEND-EVENT")?.targetObjectId
      ? { targetObjectId: action("AUD-ACT-APPEND-EVENT").targetObjectId }
      : null, { targetObjectId: "AUD-OBJ-EVENT" });

  return valid
    ? []
    : [
      "INVALID_PLATFORM_AUD_CONTRACT PLAT support cases must reuse one active versioned AUD session authority without a second approval lifecycle",
    ];
}

function task8BusinessFailureErrors(index) {
  const task8Enabled = task8ProfileEnabled(index)
    || [...TASK8_BUSINESS_FAILURES.keys()].some((id) => index.actionById.has(id));
  if (!task8Enabled) return [];

  const requiredPredicateKeys = new Set(
    [...TASK8_BUSINESS_FAILURES].flatMap(([actionId, codes]) => (
      codes.map((code) => `${actionId}:${code}`)
    )),
  );
  let valid = setEquals(
    requiredPredicateKeys,
    new Set(TASK8_BUSINESS_FAILURE_PREDICATES.keys()),
  );
  for (const [actionId, requiredCodes] of TASK8_BUSINESS_FAILURES) {
    const action = index.actionById.get(actionId)?.value;
    const failureResults = list(action?.failureResults);
    const scenarioIdValues = list(action?.scenarioIds);
    const scenarioIds = new Set(scenarioIdValues);
    const requiredCodeSet = new Set(requiredCodes);
    const semantics = records(action?.failureSemantics);
    const semanticCodes = semantics.map(({ resultCode }) => resultCode);
    if (
      !action
      || !Array.isArray(action?.failureResults)
      || failureResults.length !== new Set(failureResults).size
      || scenarioIdValues.length !== scenarioIds.size
      || requiredCodes.some((code) => (
        failureResults.filter((value) => value === code).length !== 1
      ))
      || failureResults.some((code) => (
        !requiredCodeSet.has(code) && !TASK8_GENERIC_FAILURE_CODES.has(code)
      ))
      || !Array.isArray(action?.failureSemantics)
      || semantics.length !== action.failureSemantics.length
      || semantics.length !== requiredCodes.length
      || semanticCodes.length !== new Set(semanticCodes).size
      || !setEquals(new Set(semanticCodes), requiredCodeSet)
    ) {
      valid = false;
      continue;
    }
    for (const code of requiredCodes) {
      const semantic = semantics.find(({ resultCode }) => resultCode === code);
      const expectedPredicate = TASK8_BUSINESS_FAILURE_PREDICATES
        .get(`${actionId}:${code}`);
      const scenarios = index.scenarios.filter(({ value }) => (
        value?.actionId === actionId
        && value?.kind !== "SUCCESS"
        && value?.resultCode === code
      ));
      if (
        !hasExactKeys(semantic, [
          "resultCode",
          "predicate",
          "given",
          "when",
          "expectedData",
        ])
        || !isValidId(expectedPredicate)
        || semantic?.predicate !== expectedPredicate
        || !isValidId(semantic?.given)
        || !isValidId(semantic?.when)
        || !isValidId(semantic?.expectedData)
        || scenarios.length !== 1
        || scenarios[0].value?.id !== `${actionId}-SCN-${code}`
        || scenarios[0].value?.kind !== "FAILURE"
        || !scenarioIds.has(scenarios[0].value?.id)
        || scenarios[0].value?.failurePredicate !== semantic?.predicate
        || scenarios[0].value?.given !== semantic?.given
        || scenarios[0].value?.when !== semantic?.when
        || scenarios[0].value?.then?.expectedData !== semantic?.expectedData
        || scenarios[0].value?.then?.expectedState?.mode !== "UNCHANGED"
        || scenarios[0].value?.then?.expectedPermission !== "DENY"
      ) {
        valid = false;
      }
    }
    const authoredPredicateScenarios = index.scenarios.filter(({ value }) => (
      value?.actionId === actionId
      && Object.hasOwn(value ?? {}, "failurePredicate")
    ));
    if (
      authoredPredicateScenarios.length !== requiredCodes.length
      || authoredPredicateScenarios.some(({ value }) => (
        !requiredCodeSet.has(value?.resultCode)
      ))
    ) valid = false;
  }

  return valid
    ? []
    : [
      "INVALID_TASK8_BUSINESS_FAILURE_CONTRACT Task 8 guarded Actions require one closed causal predicate and one matching fail-closed scenario per declared business result",
    ];
}

function task8ManifestErrors(index) {
  const requiredObjectIds = new Set();
  const requiredActionIds = new Set();
  const requiredPageIds = new Set();
  for (const manifest of TASK8_MODULE_MANIFEST.values()) {
    manifest.objectIds.forEach((id) => requiredObjectIds.add(id));
    manifest.actionTargets.forEach(([id]) => requiredActionIds.add(id));
    manifest.pageIds.forEach((id) => requiredPageIds.add(id));
  }
  const task8EntityPresent = task8ProfileEnabled(index)
    || (
      index.baselineDecisionById.has("BASE-001")
      && index.baselineDecisionById.has("BASE-010")
    )
    || [...TASK8_MODULE_MANIFEST.keys()].some((id) => index.moduleById.has(id))
    || index.objects.some(({ value }) => requiredObjectIds.has(value?.id))
    || index.actions.some(({ value }) => requiredActionIds.has(value?.id))
    || index.pages.some(({ value }) => requiredPageIds.has(value?.id))
    || TASK8_OPTION_SET_IDS.some((id) => index.optionSetById.has(id))
    || TASK8_EVENT_IDS.some((id) => index.eventById.has(id));
  if (!task8EntityPresent) return [];

  let valid = true;
  for (const [moduleId, manifest] of TASK8_MODULE_MANIFEST) {
    const moduleEntry = index.moduleById.get(moduleId);
    if (!moduleEntry) {
      valid = false;
      continue;
    }
    if (moduleId === "REPORT-001") {
      valid = valid
        && moduleEntry.value?.contractKind === "TASK8_REPORT_FUTURE_METADATA";
    }
    for (const objectId of manifest.objectIds) {
      valid = valid && index.objectById.get(objectId)?.moduleId === moduleId;
    }
    for (const [actionId, targetObjectId] of manifest.actionTargets) {
      const actionEntry = index.actionById.get(actionId);
      valid = valid
        && actionEntry?.moduleId === moduleId
        && actionEntry?.value?.targetObjectId === targetObjectId;
    }
    for (const pageId of manifest.pageIds) {
      valid = valid && index.pageById.get(pageId)?.moduleId === moduleId;
    }
  }
  valid = valid
    && TASK8_OPTION_SET_IDS.every((id) => index.optionSetById.has(id))
    && TASK8_EVENT_IDS.every((id) => index.eventById.has(id));

  return valid
    ? []
    : [
      "MISSING_TASK8_CONTRACT Task 8 requires the closed PREP, CONTENT, EXM, SCH, PLAT, and REPORT entity and capability manifest",
    ];
}

function extensionModuleErrors(index) {
  const errors = [];
  const examModule = index.moduleById.get("EXM-001")?.value;
  const scoreObject = index.objectById.get("EXM-OBJ-SUBJECT-SCORE")?.value;
  if (examModule && scoreObject) {
    const platformOpsAllowed = list(examModule.actions).some((action) => (
      action?.targetObjectId === scoreObject.id
      && records(action?.permissions).some((permission) => (
        permission.effect === "ALLOW" && permission.roleRef === "ROLE-PLATFORM-OPS"
      ))
    ));
    if (platformOpsAllowed) {
      errors.push(
        "INVALID_EXTENSION_PERMISSION EXM-OBJ-SUBJECT-SCORE must deny platform operations default access to student score detail",
      );
    }
  }

  const confirmCandidate = index.actionById.get("SCH-ACT-CONFIRM-CANDIDATE")?.value;
  if (confirmCandidate) {
    const gate = confirmCandidate.constraintGate;
    const valid = hasExactKeys(gate, ["fieldId", "requiredCode", "onFailure"])
      && gate.fieldId === "SCH-CANDIDATE-F-HARD-CHECK"
      && gate.requiredCode === "PASS"
      && gate.onFailure === "BLOCK_CONFIRMATION"
      && list(confirmCandidate.inputFieldIds).includes(gate.fieldId)
      && confirmCandidate.transition?.from === "REVIEWED"
      && confirmCandidate.transition?.to === "CONFIRMED";
    if (!valid) {
      errors.push(
        "INVALID_SCHEDULE_CONSTRAINT_GATE SCH-ACT-CONFIRM-CANDIDATE requires a fail-closed hard-constraint PASS gate",
      );
    }
  }

  const reportModule = index.moduleById.get("REPORT-001")?.value;
  if (reportModule) {
    const reportObjects = records(reportModule.objects);
    const reportObject = reportObjects.find(({ id }) => (
      id === "REPORT-OBJ-FUTURE-CONTRACT"
    ));
    const uniqueStrings = (values) => (
      Array.isArray(values)
      && values.length > 0
      && values.every(isValidId)
      && new Set(values).size === values.length
    );
    const expectedObjectKeys = [
      "id",
      "label",
      "dataSubject",
      "controlSubject",
      "producerRef",
      "ownerRef",
      "confirmerRef",
      "stewardRef",
      "lifecyclePolicyId",
      "sensitivityId",
      "states",
      "fields",
      "futureActors",
      "dependencies",
      "requiredPermissions",
      "reuseModuleIds",
      "unresolvedProductDecisions",
    ];
    const actorsValid = uniqueStrings(reportObject?.futureActors)
      && reportObject.futureActors.every((actorRef) => (
        index.roleIds.has(actorRef) || index.dutyIds.has(actorRef)
      ));
    const reuseValid = uniqueStrings(reportObject?.reuseModuleIds)
      && reportObject.reuseModuleIds.length === 1
      && reportObject.reuseModuleIds[0] === "DGV-001"
      && index.moduleById.has("DGV-001");
    const valid = reportModule.title === "Future Extended Reporting Contract"
      && reportObjects.length === 1
      && hasExactKeys(reportObject, expectedObjectKeys)
      && list(reportObject.states).length === 0
      && list(reportObject.fields).length === 0
      && actorsValid
      && uniqueStrings(reportObject.dependencies)
      && uniqueStrings(reportObject.requiredPermissions)
      && reuseValid
      && uniqueStrings(reportObject.unresolvedProductDecisions);
    if (!valid) {
      errors.push(
        "INVALID_REPORT_METADATA_CONTRACT REPORT-OBJ-FUTURE-CONTRACT requires closed non-executable actors, dependencies, permissions, DGV reuse, and unresolved decisions",
      );
    }
  }
  return errors;
}

function metricErrors(index) {
  const errors = [];
  for (const metricEntry of index.metrics) {
    const metric = metricEntry.value;
    const requiredEventCount = METRIC_EVENT_COUNTS.get(metric?.aggregation) ?? 1;
    const distinctEventCount = new Set(
      list(metric?.eventIds).filter(isValidId),
    ).size;
    if (!METRIC_EVENT_COUNTS.has(metric?.aggregation)) {
      errors.push(
        `INVALID_METRIC_AGGREGATION ${formatValidationValue(metric?.id)} -> ${formatValidationValue(metric?.aggregation)}`,
      );
    }
    const complete = distinctEventCount >= requiredEventCount
      && Boolean(metric?.scope)
      && Boolean(metric?.aggregation)
      && Boolean(metric?.ownerRef)
      && isPresent(metric?.target);
    if (!complete) {
      errors.push(
        `MISSING_METRIC_EVENT ${formatValidationValue(metric?.id)} requires events, scope, aggregation, Owner, and target`,
      );
    }
    if (
      metric?.aggregation === "conversion"
      && list(metric?.eventIds).length === 2
      && !isValidId(metric?.correlationKey)
    ) {
      errors.push(
        `INVALID_METRIC_SERIES ${formatValidationValue(metric?.id)} requires a correlationKey for its conversion event pair`,
      );
    }
    if (
      metric?.aggregation === "conversion"
      && list(metric?.eventIds).length > 2
    ) {
      const metricEventIds = list(metric.eventIds).filter(isValidId);
      const metricEventSet = new Set(metricEventIds);
      const usedEventIds = new Set();
      const seriesIds = new Set();
      let seriesValid = Array.isArray(metric.series)
        && metric.series.length > 0
        && metricEventSet.size === metricEventIds.length;
      for (const series of list(metric.series)) {
        const id = series?.id;
        const startEventId = series?.startEventId;
        const successEventId = series?.successEventId;
        const validPair = isValidId(id)
          && !seriesIds.has(id)
          && isValidId(startEventId)
          && isValidId(successEventId)
          && startEventId !== successEventId
          && isValidId(series?.correlationKey)
          && series?.target === "100%"
          && metricEventSet.has(startEventId)
          && metricEventSet.has(successEventId)
          && index.eventById.has(startEventId)
          && index.eventById.has(successEventId)
          && !usedEventIds.has(startEventId)
          && !usedEventIds.has(successEventId);
        if (!validPair) seriesValid = false;
        if (isValidId(id)) seriesIds.add(id);
        if (isValidId(startEventId)) usedEventIds.add(startEventId);
        if (isValidId(successEventId)) usedEventIds.add(successEventId);
      }
      if (!setEquals(metricEventSet, usedEventIds)) seriesValid = false;
      if (!seriesValid) {
        errors.push(
          `INVALID_METRIC_SERIES ${formatValidationValue(metric?.id)} requires non-overlapping resolvable conversion pairs covering every event`,
        );
      }
    }
  }
  return errors;
}

function gradingCapabilityErrors(index) {
  const errors = [];
  for (const moduleEntry of index.modules) {
    const module = moduleEntry.value;
    const declaresCapabilityFacts = Object.hasOwn(module ?? {}, "capabilityMatrix")
      || Object.hasOwn(module ?? {}, "capabilityApplicability");
    if (!declaresCapabilityFacts) continue;

    const matrix = list(module?.capabilityMatrix);
    const applicability = module?.capabilityApplicability;
    const dimensions = applicability?.dimensions;
    const subjectFamilies = list(dimensions?.subjectFamilies);
    const questionTypes = list(dimensions?.questionTypes);
    const submissionMethods = list(dimensions?.submissionMethods);
    const unsupportedRule = applicability?.unsupportedRule;
    const unsupportedDecision = unsupportedRule?.decision;
    const exceptCombinationIds = list(unsupportedRule?.exceptCombinationIds);
    const exactRulePriority = applicability?.exactRulePriority;
    const capabilityObjectId = applicability?.capabilityObjectId;
    const capabilityObjectEntry = index.objectById.get(capabilityObjectId);
    const fieldBindings = applicability?.fieldBindings;
    const optionProperties = [
      "subjectFamily",
      "questionType",
      "submissionMethod",
      "recognitionLevel",
      "scoringLevel",
      "requiredEvidence",
      "teacherReviewRequired",
      "batchConfirmEligibility",
      "unavailableFallback",
    ];
    const allowedCodesByProperty = new Map();
    const optionSetsByProperty = new Map();
    let fieldBindingsValid = hasExactKeys(fieldBindings, optionProperties)
      && capabilityObjectEntry?.moduleId === moduleEntry.value?.id;
    for (const property of optionProperties) {
      const binding = fieldBindings?.[property];
      const fieldEntry = index.fieldById.get(binding?.fieldId);
      const optionSetId = binding?.optionSetId;
      const optionSet = index.optionSetById.get(optionSetId)?.value;
      optionSetsByProperty.set(property, optionSet);
      if (
        !hasExactKeys(binding, ["fieldId", "optionSetId"])
        || fieldEntry?.moduleId !== moduleEntry.value?.id
        || fieldEntry?.objectId !== capabilityObjectId
        || fieldEntry?.value?.valueSource?.kind !== "OPTION_SET"
        || fieldEntry.value.valueSource.optionSetId !== optionSetId
      ) {
        fieldBindingsValid = false;
      }
      const optionValues = list(optionSet?.values);
      const recordValues = optionValues.filter(isRecord);
      const codes = new Set(recordValues.map(({ code }) => code).filter(isValidId));
      if (
        optionSet?.mode !== "STATIC"
        || codes.size === 0
        || recordValues.length !== optionValues.length
      ) {
        allowedCodesByProperty.set(property, null);
      } else {
        allowedCodesByProperty.set(property, codes);
      }
    }
    const codeIsAllowed = (property, value) => {
      const allowedCodes = allowedCodesByProperty.get(property);
      if (!allowedCodes) return false;
      const values = Array.isArray(value) ? value : [value];
      return values.length > 0 && values.every((entry) => allowedCodes.has(entry));
    };
    const questionTypeOptionSet = optionSetsByProperty.get("questionType");
    const questionTypeValues = list(questionTypeOptionSet?.values).filter(isRecord);
    const subjectiveQuestionTypes = new Set(
      questionTypeValues
        .filter(({ isSubjective }) => isSubjective === true)
        .map(({ code }) => code),
    );
    let valid = Array.isArray(module?.capabilityMatrix)
      && matrix.length > 0
      && hasExactKeys(applicability, [
        "exactRulePriority",
        "capabilityObjectId",
        "fieldBindings",
        "dimensions",
        "unsupportedRule",
      ])
      && hasExactKeys(dimensions, [
        "subjectFamilies",
        "questionTypes",
        "submissionMethods",
      ])
      && fieldBindingsValid
      && Number.isInteger(exactRulePriority)
      && Number.isInteger(unsupportedRule?.priority)
      && unsupportedRule.priority < exactRulePriority
      && hasExactKeys(unsupportedRule, [
        "id",
        "priority",
        "match",
        "exceptCombinationIds",
        "decision",
      ])
      && hasExactKeys(unsupportedRule?.match, [
        "subjectFamily",
        "questionType",
        "submissionMethod",
      ])
      && hasExactKeys(unsupportedDecision, [
        "recognitionLevel",
        "scoringLevel",
        "requiredEvidence",
        "teacherReviewRequired",
        "batchConfirmEligibility",
        "unavailableFallback",
      ])
      && unsupportedRule?.match?.subjectFamily === "*"
      && unsupportedRule?.match?.questionType === "*"
      && unsupportedRule?.match?.submissionMethod === "*"
      && optionProperties.every((property) => (
        isValidId(fieldBindings?.[property]?.fieldId)
        && isValidId(fieldBindings?.[property]?.optionSetId)
        && allowedCodesByProperty.get(property) !== null
      ));

    const dimensionLists = [subjectFamilies, questionTypes, submissionMethods];
    for (const values of dimensionLists) {
      if (
        values.length === 0
        || values.some((value) => !isValidId(value))
        || new Set(values).size !== values.length
      ) {
        valid = false;
      }
    }
    const dimensionOptionProperties = [
      [subjectFamilies, "subjectFamily"],
      [questionTypes, "questionType"],
      [submissionMethods, "submissionMethod"],
    ];
    if (dimensionOptionProperties.some(([values, property]) => (
      !setEquals(new Set(values), allowedCodesByProperty.get(property) ?? new Set())
    ))) {
      valid = false;
    }
    if (questionTypeValues.some(({ isSubjective }) => typeof isSubjective !== "boolean")) {
      valid = false;
    }

    const combinationId = (subjectFamily, questionType, submissionMethod) => (
      `${subjectFamily}|${questionType}|${submissionMethod}`
    );
    const exactMatchCounts = new Map();
    const supportedCombinationIds = [];
    const ruleIds = [];
    const ruleKeys = [
      "id",
      "subjectFamily",
      "questionType",
      "submissionMethod",
      "recognitionLevel",
      "scoringLevel",
      "requiredEvidence",
      "teacherReviewRequired",
      "batchConfirmEligibility",
      "unavailableFallback",
    ];
    for (const rule of matrix) {
      const subjectFamily = rule?.subjectFamily;
      const questionType = rule?.questionType;
      const submissionMethod = rule?.submissionMethod;
      const requiredEvidence = list(rule?.requiredEvidence);
      const ruleIsComplete = hasExactKeys(rule, ruleKeys)
        && isValidId(rule?.id)
        && subjectFamilies.includes(subjectFamily)
        && questionTypes.includes(questionType)
        && submissionMethods.includes(submissionMethod)
        && isValidId(rule?.recognitionLevel)
        && isValidId(rule?.scoringLevel)
        && requiredEvidence.length > 0
        && requiredEvidence.every(isValidId)
        && new Set(requiredEvidence).size === requiredEvidence.length
        && isValidId(rule?.teacherReviewRequired)
        && isValidId(rule?.batchConfirmEligibility)
        && isValidId(rule?.unavailableFallback)
        && !Object.hasOwn(rule ?? {}, "isSubjective")
        && optionProperties.every((property) => codeIsAllowed(property, rule?.[property]))
        && (
          !subjectiveQuestionTypes.has(questionType)
          || (
            rule.teacherReviewRequired === "YES"
            && rule.batchConfirmEligibility === "INELIGIBLE"
            && rule.scoringLevel !== "AUTO-SCORE"
          )
        );
      if (!ruleIsComplete) valid = false;
      if (isValidId(rule?.id)) ruleIds.push(rule.id);
      if (
        isValidId(subjectFamily)
        && isValidId(questionType)
        && isValidId(submissionMethod)
      ) {
        const id = combinationId(subjectFamily, questionType, submissionMethod);
        supportedCombinationIds.push(id);
        exactMatchCounts.set(id, (exactMatchCounts.get(id) ?? 0) + 1);
      }
    }

    const supportedCombinationIdSet = new Set(supportedCombinationIds);
    const exceptCombinationIdSet = new Set(exceptCombinationIds);
    if (
      new Set(ruleIds).size !== ruleIds.length
      || !isValidId(unsupportedRule?.id)
      || supportedCombinationIdSet.size !== supportedCombinationIds.length
      || exceptCombinationIdSet.size !== exceptCombinationIds.length
      || !setEquals(supportedCombinationIdSet, exceptCombinationIdSet)
    ) {
      valid = false;
    }
    if (
      unsupportedDecision === null
      || typeof unsupportedDecision !== "object"
      || Array.isArray(unsupportedDecision)
      || !isValidId(unsupportedDecision?.recognitionLevel)
      || !isValidId(unsupportedDecision?.scoringLevel)
      || list(unsupportedDecision?.requiredEvidence).length === 0
      || !list(unsupportedDecision?.requiredEvidence).every(isValidId)
      || new Set(list(unsupportedDecision?.requiredEvidence)).size
        !== list(unsupportedDecision?.requiredEvidence).length
      || unsupportedDecision?.teacherReviewRequired !== "YES"
      || unsupportedDecision?.batchConfirmEligibility !== "INELIGIBLE"
      || !isValidId(unsupportedDecision?.unavailableFallback)
      || ![
        "recognitionLevel",
        "scoringLevel",
        "requiredEvidence",
        "teacherReviewRequired",
        "batchConfirmEligibility",
        "unavailableFallback",
      ].every((property) => codeIsAllowed(property, unsupportedDecision?.[property]))
    ) {
      valid = false;
    }

    for (const subjectFamily of subjectFamilies) {
      for (const questionType of questionTypes) {
        for (const submissionMethod of submissionMethods) {
          const id = combinationId(subjectFamily, questionType, submissionMethod);
          const exactMatchCount = exactMatchCounts.get(id) ?? 0;
          const fallbackMatchCount = exceptCombinationIdSet.has(id) ? 0 : 1;
          if (exactMatchCount + fallbackMatchCount !== 1) valid = false;
        }
      }
    }

    if (!valid) {
      errors.push(
        `INVALID_GRADING_CAPABILITY_MATRIX ${formatValidationValue(module?.id)} requires one explicit non-overlapping decision for every declared combination and mandatory review for subjective questions`,
      );
    }
  }
  return errors;
}

export function validateModelSemantics(model) {
  const index = buildModelIndex(model);
  return [
    ...task8ManifestErrors(index),
    ...contentGovernanceErrors(index),
    ...task8PhaseFieldErrors(index),
    ...examGovernanceErrors(index),
    ...scheduleSourceErrors(index),
    ...preparationHandoffErrors(index),
    ...studentDetailAccessExceptionErrors(index),
    ...platformAuditErrors(index),
    ...task8BusinessFailureErrors(index),
    ...flowErrors(index),
    ...flowProfileErrors(index),
    ...actionErrors(index),
    ...academicAccessBoundaryErrors(index),
    ...studentDetailAccessBoundaryErrors(index),
    ...lifecycleRiskErrors(index),
    ...actionApplicabilityErrors(index),
    ...conditionalRequiredErrors(index),
    ...fieldWriteContractErrors(index),
    ...eventActionRoutingErrors(index),
    ...stateReachabilityErrors(index),
    ...externalSourceProvenanceErrors(index),
    ...ownerErrors(index),
    ...aiTaskErrors(index),
    ...reportErrors(index),
    ...reportScopeErrors(index),
    ...reportSubscriptionOwnershipErrors(index),
    ...learningPathErrors(index),
    ...notificationErrors(index),
    ...notificationChannelErrors(index),
    ...extensionModuleErrors(index),
    ...phaseAndTemplateErrors(index),
    ...metricErrors(index),
    ...gradingCapabilityErrors(index),
  ];
}
