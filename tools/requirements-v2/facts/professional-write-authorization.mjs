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

const studentSubmissionPermissionSignature = {
  allowRoleRef: "ROLE-STUDENT",
  denyRoleRefs: ["ROLE-PLATFORM-OPS"],
  denyDutyRefs: ["DUTY-SUBJECT-TEACHER"],
  denyActorRefs: ["AI"],
  scopePolicy: "NO_SCOPE",
};

const academicScoreAdministrationPermissionSignature = {
  allowRoleRef: "ROLE-ACADEMIC",
  denyRoleRefs: ["ROLE-STUDENT", "ROLE-PLATFORM-OPS"],
  denyDutyRefs: [],
  denyActorRefs: [],
  scopePolicy: "NO_SCOPE",
};

const professionalWriteExceptionRegistry = new Map([
  ["CORR-ACT-SUBMIT-INITIAL", {
    targetObjectId: "CORR-OBJ-ATTEMPT",
    operationKind: "CREATE",
    purpose: "STUDENT_SUBMISSION",
    permissionSignature: studentSubmissionPermissionSignature,
  }],
  ["CORR-ACT-SUBMIT-LATE", {
    targetObjectId: "CORR-OBJ-ATTEMPT",
    operationKind: "CREATE",
    purpose: "STUDENT_SUBMISSION",
    permissionSignature: studentSubmissionPermissionSignature,
  }],
  ["CORR-ACT-RESUBMIT", {
    targetObjectId: "CORR-OBJ-ATTEMPT",
    operationKind: "CREATE",
    purpose: "STUDENT_SUBMISSION",
    permissionSignature: studentSubmissionPermissionSignature,
  }],
  ["EXM-ACT-CREATE-SUBJECT-SCORE", {
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    operationKind: "CREATE",
    purpose: "ACADEMIC_SCORE_ADMINISTRATION",
    permissionSignature: academicScoreAdministrationPermissionSignature,
  }],
  ["EXM-ACT-PUBLISH-SUBJECT-SCORE", {
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    operationKind: "UPDATE",
    purpose: "ACADEMIC_SCORE_ADMINISTRATION",
    permissionSignature: academicScoreAdministrationPermissionSignature,
  }],
  ["EXM-ACT-REPUBLISH-CORRECTED-SCORE", {
    targetObjectId: "EXM-OBJ-SUBJECT-SCORE",
    operationKind: "UPDATE",
    purpose: "ACADEMIC_SCORE_ADMINISTRATION",
    permissionSignature: academicScoreAdministrationPermissionSignature,
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

export function professionalWritePolicyMatchesRegistry(object) {
  const registeredPolicy = resolveProfessionalWritePolicy(object);
  const hasPolicy = Object.hasOwn(object ?? {}, "professionalWritePolicy");
  return registeredPolicy
    ? hasPolicy && isProfessionalWritePolicy(object.professionalWritePolicy)
    : !hasPolicy;
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
  const permissionSignature = registered.permissionSignature;
  return {
    targetObjectId: registered.targetObjectId,
    operationKind: registered.operationKind,
    executionMode: "USER_TASK",
    writes: true,
    declaration: {
      kind: NON_PROFESSIONAL_WRITE_EXCEPTION_KIND,
      purpose: registered.purpose,
      permissionSignature: {
        allowRoleRef: permissionSignature.allowRoleRef,
        denyRoleRefs: [...permissionSignature.denyRoleRefs],
        denyDutyRefs: [...permissionSignature.denyDutyRefs],
        denyActorRefs: [...permissionSignature.denyActorRefs],
        scopePolicy: permissionSignature.scopePolicy,
      },
    },
  };
}

function sameStringArray(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

export function matchesRegisteredProfessionalWriteException(action) {
  const registered = resolveProfessionalWriteException(action);
  const exception = action?.professionalWriteException;
  const signature = exception?.permissionSignature;
  const expectedSignature = registered?.declaration.permissionSignature;
  return registered !== null
    && isRecord(exception)
    && Object.keys(exception).length === 3
    && exception.kind === registered.declaration.kind
    && exception.purpose === registered.declaration.purpose
    && isRecord(signature)
    && Object.keys(signature).length === 5
    && signature.allowRoleRef === expectedSignature.allowRoleRef
    && sameStringArray(signature.denyRoleRefs, expectedSignature.denyRoleRefs)
    && sameStringArray(signature.denyDutyRefs, expectedSignature.denyDutyRefs)
    && sameStringArray(signature.denyActorRefs, expectedSignature.denyActorRefs)
    && signature.scopePolicy === expectedSignature.scopePolicy;
}

function permissionSubjectKey(permission) {
  if (!isRecord(permission) || !["ALLOW", "DENY"].includes(permission.effect)) return null;
  const refKeys = ["roleRef", "dutyRef", "actorRef"]
    .filter((key) => typeof permission[key] === "string" && permission[key] !== "");
  if (refKeys.length !== 1) return null;
  const refKey = refKeys[0];
  const scopePolicy = Object.hasOwn(permission, "scope") ? "SCOPED" : "NO_SCOPE";
  return `${permission.effect}:${refKey}:${permission[refKey]}:${scopePolicy}`;
}

export function matchesRegisteredProfessionalWriteExceptionPermissions(action) {
  const registered = resolveProfessionalWriteException(action);
  if (!registered || !Array.isArray(action?.permissions)) return false;
  const signature = registered.declaration.permissionSignature;
  const expected = [
    `ALLOW:roleRef:${signature.allowRoleRef}:${signature.scopePolicy}`,
    ...signature.denyRoleRefs.map((ref) => `DENY:roleRef:${ref}:${signature.scopePolicy}`),
    ...signature.denyDutyRefs.map((ref) => `DENY:dutyRef:${ref}:${signature.scopePolicy}`),
    ...signature.denyActorRefs.map((ref) => `DENY:actorRef:${ref}:${signature.scopePolicy}`),
  ];
  const actual = action.permissions.map(permissionSubjectKey);
  return actual.every((key) => key !== null)
    && actual.length === expected.length
    && new Set(actual).size === actual.length
    && expected.every((key) => actual.includes(key));
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
