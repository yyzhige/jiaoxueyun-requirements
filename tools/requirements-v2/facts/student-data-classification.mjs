const OBJECT_OVERRIDE_REQUIRED = "OBJECT_OVERRIDE_REQUIRED";

export const STUDENT_DATA_KIND = Object.freeze({
  NONE: "NONE",
  DETAIL: "DETAIL",
  AGGREGATE: "AGGREGATE",
});

const objectKindOverridesByDataSubject = new Map([
  ["SUBJECT_TEACHING_TASK", new Map([
    ["AIX-OBJ-TASK-PREVIEW", STUDENT_DATA_KIND.DETAIL],
    ["RPT-OBJ-DEFINITION", STUDENT_DATA_KIND.NONE],
    ["RPT-OBJ-SUBSCRIPTION", STUDENT_DATA_KIND.NONE],
    ["RPT-OBJ-RUN", STUDENT_DATA_KIND.AGGREGATE],
    ["RPT-OBJ-SNAPSHOT", STUDENT_DATA_KIND.AGGREGATE],
    ["RPT-OBJ-DELIVERY", STUDENT_DATA_KIND.AGGREGATE],
    ["LPATH-OBJ-TIMELINE-ENTRY", STUDENT_DATA_KIND.DETAIL],
    ["LPATH-OBJ-INTERPRETATION", STUDENT_DATA_KIND.DETAIL],
    ["NOTI-OBJ-NOTIFICATION", STUDENT_DATA_KIND.DETAIL],
  ])],
  ["ACADEMIC_OPERATION", new Map([
    ["EXM-OBJ-EXAM-EVENT", STUDENT_DATA_KIND.NONE],
    ["EXM-OBJ-SCORE-IMPORT", STUDENT_DATA_KIND.DETAIL],
    ["EXM-OBJ-AGGREGATE-RULE", STUDENT_DATA_KIND.NONE],
    ["SCH-OBJ-CALENDAR", STUDENT_DATA_KIND.NONE],
    ["SCH-OBJ-CONSTRAINT", STUDENT_DATA_KIND.NONE],
    ["SCH-OBJ-CONSTRAINT-SNAPSHOT", STUDENT_DATA_KIND.NONE],
    ["SCH-OBJ-CANDIDATE", STUDENT_DATA_KIND.NONE],
  ])],
]);

const registeredKindByDataSubject = new Map([
  ...[
    "SCHOOL_CONFIGURATION",
    "SCHOOL_ACTIVATION",
    "SCHOOL_ADMIN_RECOVERY",
    "SCHOOL_MEMBER_ACCOUNT",
    "PLATFORM_NATURAL_PERSON_IDENTITY",
    "LOGIN_ACCOUNT_CREDENTIAL_BOUNDARY",
    "SCHOOL_MEMBER_WORK_IDENTITY",
    "SCHOOL_MEMBER_PROFILE",
    "CURRENT_ACTOR_WORK_CONTEXT",
    "SCHOOL_TERM",
    "SCHOOL_GRADE",
    "SCHOOL_CLASS",
    "SCHOOL_SUBJECT_CATALOG",
    "SCHOOL_COURSE",
    "TEACHER",
    "STUDENT",
    "TEACHER_COURSE_ASSIGNMENT",
    "SUBSTITUTE_TEACHING_RELATION",
    "HOMEROOM_TEACHER_ASSIGNMENT",
    "ORGANIZATION_IMPORT",
    "ORGANIZATION_IMPORT_OBJECT",
    "SCHOOL_ROLE_POLICY",
    "SCHOOL_DUTY_GRANT",
    "SCHOOL_SCOPE_GRANT",
    "PERMISSION_EVALUATION",
    "TEMPORARY_SCHOOL_GRANT",
    "SCHOOL_DATA_GOVERNANCE",
    "SCHOOL_RETENTION_CONFIGURATION",
    "SCHOOL_AI_DATA_USE",
    "EXPORT_REQUESTER_AND_SCOPED_DATA",
    "AUDITED_SCHOOL_ACTIVITY",
    "ACCESS_REQUESTER_AND_SCOPED_DATA",
    "APPROVED_SENSITIVE_ACCESS",
    "AUDIT_REVIEW_CASE",
    "TEACHER_AUTHOR_SURROGATE",
    "SHARED_DEVICE_SESSION",
    "SUBJECT_CURRICULUM",
    "CURRENT_TEACHER_PREFERENCE",
    "SUBJECT_ASSIGNMENT",
    "GRADING_CAPABILITY",
    "ASSESSMENT_STANDARD",
    "SUBJECT_TEACHING_PREPARATION",
    "VERSIONED_TEACHING_CONTENT",
    "SCHOOL_SERVICE_CONFIGURATION",
    "AUDIT_PINNED_SUPPORT_CASE",
    "FUTURE_REPORTING_CONTRACT",
    "SCHOOL_ENTITY_STRUCTURE",
    "SCHOOL_READINESS_AXIS",
    "ROLE_EXPERIENCE_RESOLUTION",
    "DATA_CATALOG_ENTRY",
    "MATERIAL_PROVENANCE",
    "MATERIAL_RIGHTS_BUNDLE",
    "MATERIAL_MANAGEMENT_SCOPE",
  ].map((dataSubject) => [dataSubject, STUDENT_DATA_KIND.NONE]),
  ...[
    "STUDENT_WORK",
    "STUDENT_SCORE_AND_FEEDBACK",
    "SELECTED_STUDENT_RESULTS",
    "STUDENT_RESULT_PUBLICATION_PREVIEW",
    "DERIVED_LEARNING_DEPENDENCY_SNAPSHOT",
    "GRADEBOOK_VIEW_DEFINITION",
    "GRADEBOOK_COORDINATION",
    "STUDENT_EVIDENCE_AND_MASTERY",
    "STUDENT_IMPROVEMENT_PLAN",
    "SUBJECT_PLAN_SYNC",
    "HOMEROOM_PLAN_COORDINATION",
    "STUDENT_LOCAL_TASK_EXECUTION",
    "STUDENT_HOME_PROJECTION",
    "TEACHING_PROBLEM",
    "TEACHER_JUDGMENT",
    "LINKED_TEACHING_ACTION",
    "STUDENT_ACTIVITY_WINDOW",
    "STUDENT_PRIMARY_ACCOUNT_RELATION",
    "GUARDIAN_RELATION",
    "SCHOOL_STUDENT_DATA_AUTHORIZATION",
    "TASK_GUARDIAN_ASSISTANCE_SESSION",
    "HIGH_IMPACT_MINOR_AUTHORIZATION",
    "GUARDIAN_AUTHORIZATION_DISPUTE",
    "STUDENT_TRANSFER_AUTHORIZATION",
    "OLD_SCHOOL_RESTRICTED_STUDENT_HISTORY",
    "STUDENT_CORRECTION_TASK",
    "STUDENT_CORRECTION_ANSWER",
    "DERIVED_LEARNING_INTERPRETATION_INVALIDATION",
    "STUDENT_MANAGEMENT_VIEW_DEFINITION",
    "STUDENT_ATTENTION_COORDINATION",
    "STUDENT_SUBJECT_SCORE",
    "INITIAL_SUBMISSION_ATTEMPT_CLASSIFICATION",
    "CORRECTION_ATTEMPT_CLASSIFICATION",
    "STUDENT_ASSESSMENT_CHALLENGE",
    "TEACHING_BUSINESS_EVENT",
    "TEACHING_ACTION_TODO",
    "NOTIFICATION_MESSAGE",
    "NOTIFICATION_CHANNEL_DELIVERY",
    "DATA_GOVERNANCE_CASE",
    "STUDENT_DELETION_CASE",
    "STUDENT_DELETION_OBJECT_DECISION",
    "STUDENT_WORK_SAMPLE_AUTHORIZATION",
    "STUDENT_WORK_SAMPLE_COPY",
  ].map((dataSubject) => [dataSubject, STUDENT_DATA_KIND.DETAIL]),
  ...[
    "CURRENT_TEACHER_WORK_VIEW",
    "HOMEROOM_CLASS_COORDINATION",
  ].map((dataSubject) => [dataSubject, STUDENT_DATA_KIND.AGGREGATE]),
  ...[...objectKindOverridesByDataSubject.keys()].map((dataSubject) => [
    dataSubject,
    OBJECT_OVERRIDE_REQUIRED,
  ]),
]);

function classificationForKind(kind) {
  return {
    kind,
    privilegedReadPolicy: kind === STUDENT_DATA_KIND.NONE
      ? "NOT_APPLICABLE"
      : "DEFAULT_DENY",
  };
}

export function resolveStudentDataClassification(object) {
  const registeredKind = registeredKindByDataSubject.get(object?.dataSubject);
  if (!registeredKind) return null;
  if (registeredKind !== OBJECT_OVERRIDE_REQUIRED) {
    return classificationForKind(registeredKind);
  }
  const kind = objectKindOverridesByDataSubject
    .get(object.dataSubject)
    ?.get(object?.id);
  return kind ? classificationForKind(kind) : null;
}

export function studentDataClassificationMatchesRegistry(object) {
  const expected = resolveStudentDataClassification(object);
  const classification = object?.studentDataClassification;
  return expected
    && classification
    && typeof classification === "object"
    && !Array.isArray(classification)
    && Object.keys(classification).length === 2
    && Object.hasOwn(classification, "kind")
    && Object.hasOwn(classification, "privilegedReadPolicy")
    && classification.kind === expected.kind
    && classification.privilegedReadPolicy === expected.privilegedReadPolicy;
}

export function withStudentDataClassification(object, overrideKind) {
  const registeredKind = registeredKindByDataSubject.get(object?.dataSubject);
  const expected = resolveStudentDataClassification(object);
  if (!registeredKind) {
    throw new Error(`${object?.id ?? "object"} has an unclassified dataSubject`);
  }
  if (!expected) {
    throw new Error(`${object?.id ?? "object"} has no registered object classification`);
  }
  if (registeredKind === OBJECT_OVERRIDE_REQUIRED && !overrideKind) {
    throw new Error(`${object?.id ?? "object"} requires an object-level student data kind`);
  }
  if (overrideKind && overrideKind !== expected.kind) {
    throw new Error(`${object?.id ?? "object"} contradicts its registered classification`);
  }
  return {
    ...object,
    studentDataClassification: expected,
  };
}
