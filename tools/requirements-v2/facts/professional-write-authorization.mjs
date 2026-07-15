export const PROFESSIONAL_WRITE_BOUNDARY_KIND = "SUBJECT_COURSE_PROFESSIONAL_WRITE";
export const NON_PROFESSIONAL_WRITE_EXCEPTION_KIND = "NON_PROFESSIONAL_PROTECTED_OBJECT_WRITE";

const professionalWriteActionIds = new Set([
  "GRD-ACT-CORRECT-RECOGNITION",
  "GRD-ACT-ACCEPT-SUGGESTION",
  "GRD-ACT-OVERRIDE-SCORE",
  "GRD-ACT-MANUAL-GRADE",
  "GRD-ACT-BATCH-CONFIRM",
  "GRD-ACT-OPEN-CONFIRMED-REVISION",
  "GRD-ACT-CONFIRM-REVISION",
  "GRD-ACT-RESOLVE-VERSION-CONFLICT",
  "PUB-ACT-PREVIEW",
  "PUB-ACT-PREPARE-BATCH",
  "PUB-ACT-PUBLISH-SELECTED",
  "PUB-ACT-RETRY-FAILED",
  "PUB-ACT-CORRECT-RESULT",
  "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
  "SCO-ACT-CREATE-VIEW",
  "SCO-ACT-CREATE-FOLLOW-UP",
  "INS-ACT-CONFIRM-MASTERY",
  "INS-ACT-PUBLISH-INTERPRETATION",
  "PLN-ACT-CONFIRM-PLAN",
  "PLN-ACT-ADJUST-PLAN",
  "PLN-ACT-CLOSE-PLAN",
  "CORR-ACT-CONFIRM-JUDGMENT",
  "CORR-ACT-REQUEST-RETRY",
  "STU-ACT-SAVE-VIEW",
  "STU-ACT-CREATE-ATTENTION",
  "PREP-ACT-CREATE-LESSON-PLAN",
  "PREP-ACT-CONFIRM-LESSON-PLAN",
  "PREP-ACT-REFERENCE-MATERIAL",
  "PREP-ACT-VERIFY-MATERIAL-LICENSE",
  "PREP-ACT-PLAN-CLASSROOM-ACTIVITY",
  "PREP-ACT-RECORD-CLASSROOM-ACTIVITY",
  "PREP-ACT-GENERATE-ASSIGNMENT-DRAFT",
  "PREP-ACT-COMPLETE-ASSIGNMENT-DRAFT",
  "PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF",
  "EXM-ACT-CONFIRM-SUBJECT-SCORE",
  "EXM-ACT-REJECT-SUBJECT-SCORE",
  "EXM-ACT-REVISE-REJECTED-SUBJECT-SCORE",
  "EXM-ACT-CORRECT-SUBJECT-SCORE",
]);

const professionalWriteObjectIds = new Set([
  "GRD-OBJ-DECISION",
  "PUB-OBJ-PREVIEW",
  "PUB-OBJ-BATCH",
  "PUB-OBJ-RESULT",
  "SCO-OBJ-VIEW",
  "SCO-OBJ-FOLLOW-UP",
  "INS-OBJ-EVIDENCE",
  "PLN-OBJ-PLAN",
  "CORR-OBJ-ATTEMPT",
  "STU-OBJ-PROFILE",
  "STU-OBJ-ATTENTION",
  "PREP-OBJ-LESSON-PLAN",
  "PREP-OBJ-MATERIAL-REF",
  "PREP-OBJ-CLASSROOM-ACTIVITY",
  "PREP-OBJ-ASSIGNMENT-DRAFT",
  "EXM-OBJ-SUBJECT-SCORE",
]);

const professionalWriteExceptionRegistry = new Map([
  ["CORR-ACT-SUBMIT-INITIAL", {
    targetObjectId: "CORR-OBJ-ATTEMPT",
    purpose: "STUDENT_SUBMISSION",
    allowRoleRef: "ROLE-STUDENT",
  }],
  ["CORR-ACT-SUBMIT-LATE", {
    targetObjectId: "CORR-OBJ-ATTEMPT",
    purpose: "STUDENT_SUBMISSION",
    allowRoleRef: "ROLE-STUDENT",
  }],
  ["CORR-ACT-RESUBMIT", {
    targetObjectId: "CORR-OBJ-ATTEMPT",
    purpose: "STUDENT_SUBMISSION",
    allowRoleRef: "ROLE-STUDENT",
  }],
  ["EXM-ACT-CREATE-SUBJECT-SCORE", {
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    purpose: "ACADEMIC_SCORE_ADMINISTRATION",
    allowRoleRef: "ROLE-ACADEMIC",
  }],
  ["EXM-ACT-PUBLISH-SUBJECT-SCORE", {
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    purpose: "ACADEMIC_SCORE_ADMINISTRATION",
    allowRoleRef: "ROLE-ACADEMIC",
  }],
  ["EXM-ACT-REPUBLISH-CORRECTED-SCORE", {
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    purpose: "ACADEMIC_SCORE_ADMINISTRATION",
    allowRoleRef: "ROLE-ACADEMIC",
  }],
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isRegisteredProfessionalWriteAction(action) {
  return professionalWriteActionIds.has(action?.id);
}

export function isRegisteredProfessionalWriteObject(object) {
  return professionalWriteObjectIds.has(object?.id);
}

export function isProfessionalWriteAuthorizationBoundary(boundary) {
  return isRecord(boundary)
    && Object.keys(boundary).length === 1
    && boundary.kind === PROFESSIONAL_WRITE_BOUNDARY_KIND;
}

export function isProfessionalWritePolicy(policy) {
  return isRecord(policy)
    && Object.keys(policy).length === 1
    && policy.requiredAuthorizationBoundaryKind === PROFESSIONAL_WRITE_BOUNDARY_KIND;
}

export function resolveProfessionalWriteAuthorizationBoundary(action) {
  if (!isRegisteredProfessionalWriteAction(action)) return null;
  return { kind: PROFESSIONAL_WRITE_BOUNDARY_KIND };
}

export function resolveProfessionalWritePolicy(object) {
  if (!isRegisteredProfessionalWriteObject(object)) return null;
  return { requiredAuthorizationBoundaryKind: PROFESSIONAL_WRITE_BOUNDARY_KIND };
}

export function resolveProfessionalWriteException(action) {
  const registered = professionalWriteExceptionRegistry.get(action?.id);
  if (!registered) return null;
  return {
    targetObjectId: registered.targetObjectId,
    declaration: {
      kind: NON_PROFESSIONAL_WRITE_EXCEPTION_KIND,
      purpose: registered.purpose,
      allowRoleRef: registered.allowRoleRef,
    },
  };
}

export function matchesRegisteredProfessionalWriteException(action) {
  const registered = resolveProfessionalWriteException(action);
  const exception = action?.professionalWriteException;
  return registered !== null
    && isRecord(exception)
    && Object.keys(exception).length === 3
    && exception.kind === registered.declaration.kind
    && exception.purpose === registered.declaration.purpose
    && exception.allowRoleRef === registered.declaration.allowRoleRef;
}

export function withProfessionalWriteAuthorization(action) {
  const authorizationBoundary = resolveProfessionalWriteAuthorizationBoundary(action);
  const registeredException = resolveProfessionalWriteException(action);
  if (!authorizationBoundary && !registeredException) return action;
  return {
    ...action,
    ...(authorizationBoundary ? { authorizationBoundary } : {}),
    ...(registeredException ? {
      professionalWriteException: registeredException.declaration,
    } : {}),
  };
}

export function withProfessionalWritePolicy(object) {
  const professionalWritePolicy = resolveProfessionalWritePolicy(object);
  if (!professionalWritePolicy) return object;
  return {
    ...object,
    professionalWritePolicy,
  };
}
