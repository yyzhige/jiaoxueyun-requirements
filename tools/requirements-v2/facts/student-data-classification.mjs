const OBJECT_OVERRIDE_REQUIRED = "OBJECT_OVERRIDE_REQUIRED";

export const STUDENT_DATA_KIND = Object.freeze({
  NONE: "NONE",
  DETAIL: "DETAIL",
  AGGREGATE: "AGGREGATE",
});

const defaultKindByDataSubject = new Map([
  ...[
    "SCHOOL_CONFIGURATION",
    "SCHOOL_MEMBER_ACCOUNT",
    "SCHOOL_MEMBER_WORK_IDENTITY",
    "CURRENT_ACTOR_WORK_CONTEXT",
    "SCHOOL_TERM",
    "SCHOOL_GRADE",
    "SCHOOL_CLASS",
    "SCHOOL_SUBJECT_CATALOG",
    "SCHOOL_COURSE",
    "TEACHER",
    "STUDENT",
    "TEACHER_COURSE_ASSIGNMENT",
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
    "SUBJECT_CURRICULUM",
    "CURRENT_TEACHER_PREFERENCE",
    "SUBJECT_ASSIGNMENT",
    "GRADING_CAPABILITY",
    "SUBJECT_TEACHING_PREPARATION",
    "VERSIONED_TEACHING_CONTENT",
    "ACADEMIC_OPERATION",
    "SCHOOL_SERVICE_CONFIGURATION",
    "AUDIT_PINNED_SUPPORT_CASE",
    "FUTURE_REPORTING_CONTRACT",
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
    "STUDENT_CORRECTION_TASK",
    "STUDENT_CORRECTION_ANSWER",
    "DERIVED_LEARNING_INTERPRETATION_INVALIDATION",
    "STUDENT_MANAGEMENT_VIEW_DEFINITION",
    "STUDENT_ATTENTION_COORDINATION",
    "STUDENT_SUBJECT_SCORE",
  ].map((dataSubject) => [dataSubject, STUDENT_DATA_KIND.DETAIL]),
  ...[
    "CURRENT_TEACHER_WORK_VIEW",
    "HOMEROOM_CLASS_COORDINATION",
  ].map((dataSubject) => [dataSubject, STUDENT_DATA_KIND.AGGREGATE]),
  ["SUBJECT_TEACHING_TASK", OBJECT_OVERRIDE_REQUIRED],
]);

export function withStudentDataClassification(object, overrideKind) {
  const defaultKind = defaultKindByDataSubject.get(object?.dataSubject);
  if (!defaultKind) {
    throw new Error(`${object?.id ?? "object"} has an unclassified dataSubject`);
  }
  if (defaultKind === OBJECT_OVERRIDE_REQUIRED && !overrideKind) {
    throw new Error(`${object?.id ?? "object"} requires an object-level student data kind`);
  }
  if (
    overrideKind
    && !Object.values(STUDENT_DATA_KIND).includes(overrideKind)
  ) {
    throw new Error(`${object?.id ?? "object"} has an invalid student data kind`);
  }
  if (
    defaultKind !== OBJECT_OVERRIDE_REQUIRED
    && overrideKind
    && overrideKind !== defaultKind
  ) {
    throw new Error(`${object?.id ?? "object"} contradicts its dataSubject classification`);
  }
  const kind = overrideKind ?? defaultKind;
  return {
    ...object,
    studentDataClassification: {
      kind,
      privilegedReadPolicy: kind === STUDENT_DATA_KIND.NONE
        ? "NOT_APPLICABLE"
        : "DEFAULT_DENY",
    },
  };
}
