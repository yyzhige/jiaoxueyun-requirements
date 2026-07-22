export const TEACHER_WRITE_SCOPE_POLICY_KIND = Object.freeze({
  ASSIGNED_SUBJECT_COURSE: "ASSIGNED_SUBJECT_COURSE",
  DOMAIN_CONTRACT: "DOMAIN_CONTRACT",
});

export const TEACHER_WRITE_DOMAIN_BOUNDARY_KIND = "DOMAIN_CONTRACT";

export const ASSIGNED_SUBJECT_COURSE_SCOPE = Object.freeze({
  kind: "ASSIGNED_SUBJECT_COURSE",
  subjectMatch: "REQUIRED",
  courseMatch: "REQUIRED",
});

const ASSIGNED_SUBJECT_COURSE_POLICY = Object.freeze({
  kind: TEACHER_WRITE_SCOPE_POLICY_KIND.ASSIGNED_SUBJECT_COURSE,
  resolutionMode: "DIRECT_PERMISSION_SCOPE",
  subjectMatch: "REQUIRED",
  courseMatch: "REQUIRED",
});

function domainContract({
  contractId,
  objectId,
  identityFieldId,
  versionFieldId,
  principalBinding,
  scopeBinding,
  sourceBindings = [],
}) {
  return Object.freeze({
    contractId,
    contractVersion: 1,
    objectId,
    identityFieldId,
    versionFieldId,
    principalBinding: Object.freeze(principalBinding),
    scopeBinding: Object.freeze(scopeBinding),
    sourceBindings: Object.freeze(sourceBindings.map((binding) => Object.freeze(binding))),
  });
}

const DOMAIN_CONTRACTS = [
  domainContract({
    contractId: "AIX_TASK_PREVIEW_AUTHORIZATION_GATE",
    objectId: "AIX-OBJ-TASK-PREVIEW",
    identityFieldId: "AIX-PREVIEW-F-ID",
    versionFieldId: "AIX-PREVIEW-F-VERSION",
    principalBinding: {
      kind: "CURRENT_ACTOR_AUTHORIZATION_GATE",
      subjectFieldId: "AIX-PREVIEW-F-TARGET-ACTION-ID",
      resultFieldId: "AIX-PREVIEW-F-PERMISSION-RESULT",
      requiredInput: "EVERY_WRITE",
    },
    scopeBinding: {
      kind: "REGISTERED_ACTION_PERMISSION",
      requiredInputFieldIds: ["AIX-PREVIEW-F-TARGET-ACTION-ID"],
      requiredOutputFieldIds: [
        "AIX-PREVIEW-F-PERMISSION-RESULT",
        "AIX-PREVIEW-F-PERMISSION-GATE",
        "AIX-PREVIEW-F-AUTHORIZATION-CHECKED-AT",
        "AIX-PREVIEW-F-SOURCE-VERSION-REFS",
      ],
    },
    sourceBindings: [{
      refFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-REF",
      versionFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-VERSION",
      targetObjectId: "PUB-OBJ-RESULT",
      targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
      requiredState: "PUBLISHED",
      applicability: "WHEN_REFERENCED",
      integrity: "VERSION_PINNED_OBJECT_REF",
    }],
  }),
  domainContract({
    contractId: "RPT_SUBJECT_ASSIGNED_DEFINITION_PROFILE",
    objectId: "RPT-OBJ-DEFINITION",
    identityFieldId: "RPT-DEFINITION-F-ID",
    versionFieldId: "RPT-DEFINITION-F-VERSION",
    principalBinding: {
      kind: "SUBJECT_ASSIGNED_SCOPE_CODE",
      subjectFieldId: "RPT-DEFINITION-F-DATA-SCOPE",
      requiredInput: "EVERY_WRITE",
      requiredCode: "SUBJECT_ASSIGNED",
    },
    scopeBinding: {
      kind: "ASSIGNED_SUBJECT_COURSE_FROM_REPORT_SCOPE",
      requiredInputFieldIds: ["RPT-DEFINITION-F-DATA-SCOPE"],
      requiredOutputFieldIds: [],
    },
  }),
  domainContract({
    contractId: "RPT_SUBJECT_ASSIGNED_SUBSCRIPTION_PROFILE",
    objectId: "RPT-OBJ-SUBSCRIPTION",
    identityFieldId: "RPT-SUBSCRIPTION-F-ID",
    versionFieldId: "RPT-SUBSCRIPTION-F-VERSION",
    principalBinding: {
      kind: "CURRENT_ACTOR_SNAPSHOT",
      subjectFieldId: "RPT-SUBSCRIPTION-F-CREATOR-REF",
      requiredOutput: "CREATE",
    },
    scopeBinding: {
      kind: "ASSIGNED_SUBJECT_COURSE_FROM_REPORT_SCOPE",
      requiredInputFieldIds: ["RPT-SUBSCRIPTION-F-DATA-SCOPE"],
      requiredOutputFieldIds: ["RPT-SUBSCRIPTION-F-CREATOR-REF"],
    },
    sourceBindings: [{
      refFieldId: "RPT-SUBSCRIPTION-F-DEFINITION-REF",
      versionFieldId: "RPT-SUBSCRIPTION-F-DEFINITION-VERSION",
      targetObjectId: "RPT-OBJ-DEFINITION",
      targetVersionFieldId: "RPT-DEFINITION-F-VERSION",
      requiredState: "ACTIVE",
      applicability: "EVERY_WRITE",
      integrity: "VERSION_PINNED_OBJECT_REF",
    }],
  }),
  domainContract({
    contractId: "NOTI_ASSIGNEE_ACTION_TODO",
    objectId: "NOTI-OBJ-ACTION-TODO",
    identityFieldId: "NOTI-TODO-F-ID",
    versionFieldId: "NOTI-TODO-F-VERSION",
    principalBinding: {
      kind: "CURRENT_ACTOR_MATCH_FIELD",
      subjectFieldId: "NOTI-TODO-F-ASSIGNEE-ID",
      requiredInput: "CREATE",
      mutationResolution: "TARGET_RECORD",
    },
    scopeBinding: {
      kind: "ASSIGNEE_MATCH",
      requiredInputFieldIds: [],
      requiredOutputFieldIds: [],
    },
  }),
  domainContract({
    contractId: "NOTI_AUTHORIZED_RECIPIENT_MESSAGE",
    objectId: "NOTI-OBJ-NOTIFICATION",
    identityFieldId: "NOTI-NOTIFICATION-F-ID",
    versionFieldId: "NOTI-NOTIFICATION-F-VERSION",
    principalBinding: {
      kind: "AUTHORIZED_RECIPIENT_MATCH_FIELD",
      subjectFieldId: "NOTI-NOTIFICATION-F-RECIPIENT",
      requiredInput: "CREATE",
      mutationResolution: "TARGET_RECORD",
    },
    scopeBinding: {
      kind: "AUTHORIZED_RECIPIENT",
      requiredInputFieldIds: [],
      requiredOutputFieldIds: [],
    },
  }),
  domainContract({
    contractId: "CONTENT_PURPOSE_LIMITED_SAMPLE_AUTHORIZATION",
    objectId: "CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION",
    identityFieldId: "CONTENT-SAMPLEAUTH-F-ID",
    versionFieldId: "CONTENT-SAMPLEAUTH-F-VERSION",
    principalBinding: {
      kind: "SOURCE_RECORD_AUTHORIZED_TEACHER",
      subjectFieldId: "CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-ID",
      requiredInput: "CREATE",
    },
    scopeBinding: {
      kind: "ASSIGNED_SUBJECT_COURSE_ONE_HOP",
      viaRefFieldId: "CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-ID",
      viaVersionFieldId: "CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-VERSION",
      targetObjectId: "SUB-OBJ-ATTEMPT",
      targetVersionFieldId: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      targetSubjectFieldId: "SUB-ATTEMPT-F-ASSIGNMENT-REF",
      targetEvidenceFieldId: "SUB-ATTEMPT-F-CONTENT-DIGEST",
      requiredInputFieldIds: [
        "CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-ID",
        "CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-VERSION",
      ],
      requiredOutputFieldIds: [],
    },
    sourceBindings: [{
      refFieldId: "CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-ID",
      versionFieldId: "CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-VERSION",
      targetObjectId: "SUB-OBJ-ATTEMPT",
      targetVersionFieldId: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
      applicability: "CREATE",
      integrity: "VERSION_PAIR",
    }],
  }),
  domainContract({
    contractId: "CONTENT_AUTHORIZED_DEIDENTIFIED_SAMPLE_COPY",
    objectId: "CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY",
    identityFieldId: "CONTENT-SAMPLE-F-ID",
    versionFieldId: "CONTENT-SAMPLE-F-VERSION",
    principalBinding: {
      kind: "SOURCE_AUTHORIZATION_ACTOR",
      subjectFieldId: "CONTENT-SAMPLE-F-AUTHORIZATION-REF",
      requiredInput: "CREATE",
    },
    scopeBinding: {
      kind: "AUTHORIZED_SOURCE_ONE_HOP",
      viaRefFieldId: "CONTENT-SAMPLE-F-AUTHORIZATION-REF",
      viaVersionFieldId: "CONTENT-SAMPLE-F-AUTHORIZATION-VERSION",
      targetObjectId: "CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION",
      targetVersionFieldId: "CONTENT-SAMPLEAUTH-F-VERSION",
      requiredInputFieldIds: [
        "CONTENT-SAMPLE-F-AUTHORIZATION-REF",
        "CONTENT-SAMPLE-F-AUTHORIZATION-VERSION",
      ],
      requiredOutputFieldIds: [],
    },
    sourceBindings: [{
      refFieldId: "CONTENT-SAMPLE-F-AUTHORIZATION-REF",
      versionFieldId: "CONTENT-SAMPLE-F-AUTHORIZATION-VERSION",
      targetObjectId: "CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION",
      targetVersionFieldId: "CONTENT-SAMPLEAUTH-F-VERSION",
      requiredState: "AUTHORIZED",
      applicability: "EVERY_WRITE",
      integrity: "VERSION_PINNED_OBJECT_REF",
    }],
  }),
  domainContract({
    contractId: "VIDEO_VERSIONED_TEACHING_SCOPE_REQUEST",
    objectId: "VIDEO-OBJ-SCHOOL-REQUEST",
    identityFieldId: "VIDEO-SCHOOL-REQUEST-F-ID",
    versionFieldId: "VIDEO-SCHOOL-REQUEST-F-VERSION",
    principalBinding: {
      kind: "CURRENT_TEACHER_MATCH_FIELD",
      subjectFieldId: "VIDEO-SCHOOL-REQUEST-F-REQUESTER-TEACHER-REF",
      requiredInput: "CREATE",
    },
    scopeBinding: {
      kind: "ASSIGNED_SUBJECT_COURSE_ONE_HOP",
      viaRefFieldId: "VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-REF",
      viaVersionFieldId: "VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-VERSION",
      targetObjectId: "ORG-OBJ-TEACHING-ASSIGNMENT",
      targetTeacherFieldId: "ORG-TEACHING-F-TEACHER-ID",
      targetCourseFieldId: "ORG-TEACHING-F-COURSE-ID",
      targetClassFieldId: "ORG-TEACHING-F-CLASS-ID",
      scopeSnapshotFieldId: "VIDEO-SCHOOL-REQUEST-F-SOURCE-BINDING-DIGEST",
      requiredInputFieldIds: [
        "VIDEO-SCHOOL-REQUEST-F-REQUESTER-TEACHER-REF",
        "VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-REF",
        "VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-VERSION",
      ],
      requiredOutputFieldIds: [],
    },
    sourceBindings: [
      ["ACTIVITY", "HW-OBJ-ASSIGNMENT", "HW-ASSIGNMENT-F-PUBLICATION-VERSION"],
      ["MATERIAL-RIGHTS", "CONTENT-OBJ-LICENSE", "CONTENT-LICENSE-F-VERSION"],
      ["MATERIAL-PERMISSION", "CONTENT-OBJ-PERMISSION", "CONTENT-PERMISSION-F-VERSION"],
    ].map(([kind, targetObjectId, targetVersionFieldId]) => ({
      refFieldId: `VIDEO-SCHOOL-REQUEST-F-${kind}-REF`,
      versionFieldId: `VIDEO-SCHOOL-REQUEST-F-${kind}-VERSION`,
      targetObjectId,
      targetVersionFieldId,
      applicability: "EVERY_WRITE",
      integrity: "VERSION_PINNED_OBJECT_REF",
    })),
  }),
  domainContract({
    contractId: "INS_VERSIONED_MASTERY_CHALLENGE",
    objectId: "INS-OBJ-MASTERY-CHALLENGE",
    identityFieldId: "INS-CHALLENGE-F-ID",
    versionFieldId: "INS-CHALLENGE-F-VERSION",
    principalBinding: {
      kind: "MASTERY_STUDENT_AND_SUBJECT_ONE_HOP",
      subjectFieldId: "INS-CHALLENGE-F-STUDENT-REF",
      requiredInput: "TARGET_RECORD",
    },
    scopeBinding: {
      kind: "ASSIGNED_SUBJECT_COURSE_ONE_HOP",
      viaRefFieldId: "INS-CHALLENGE-F-MASTERY-REF",
      viaVersionFieldId: "INS-CHALLENGE-F-MASTERY-VERSION",
      targetObjectId: "INS-OBJ-MASTERY-NODE",
      targetVersionFieldId: "INS-MASTERY-F-VERSION",
      targetStudentFieldId: "INS-MASTERY-F-STUDENT-REF",
      targetSubjectFieldId: "INS-MASTERY-F-SUBJECT",
      targetEvidenceFieldId: "INS-MASTERY-F-EVIDENCE-REFS",
      requiredInputFieldIds: [],
      requiredOutputFieldIds: [],
    },
    sourceBindings: [{
      refFieldId: "INS-CHALLENGE-F-MASTERY-REF",
      versionFieldId: "INS-CHALLENGE-F-MASTERY-VERSION",
      targetObjectId: "INS-OBJ-MASTERY-NODE",
      targetVersionFieldId: "INS-MASTERY-F-VERSION",
      applicability: "TARGET_RECORD",
      integrity: "VERSION_PINNED_OBJECT_REF",
    }],
  }),
];

export const teacherWriteDomainContractRegistry = Object.freeze(
  Object.fromEntries(DOMAIN_CONTRACTS.map((contract) => [contract.objectId, contract])),
);

const domainContractById = new Map(
  DOMAIN_CONTRACTS.map((contract) => [contract.contractId, contract]),
);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, expectedKeys) {
  if (!isRecord(value)) return false;
  const actualKeys = Object.keys(value);
  return actualKeys.length === expectedKeys.length
    && actualKeys.every((key) => expectedKeys.includes(key));
}

function structurallyEqual(left, right) {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => structurallyEqual(value, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).toSorted();
  const rightKeys = Object.keys(right).toSorted();
  return structurallyEqual(leftKeys, rightKeys)
    && leftKeys.every((key) => structurallyEqual(left[key], right[key]));
}

function domainPolicy(contract) {
  return {
    kind: TEACHER_WRITE_SCOPE_POLICY_KIND.DOMAIN_CONTRACT,
    contractId: contract.contractId,
    contractVersion: contract.contractVersion,
    enforcement: "ACTION_DOMAIN_BOUNDARY",
  };
}

export function buildTeacherWriteDomainBoundary(contract) {
  return {
    kind: TEACHER_WRITE_DOMAIN_BOUNDARY_KIND,
    contractId: contract.contractId,
    contractVersion: contract.contractVersion,
    objectId: contract.objectId,
    principalBinding: structuredClone(contract.principalBinding),
    scopeBinding: structuredClone(contract.scopeBinding),
    sourceBindings: structuredClone(contract.sourceBindings),
  };
}

export function isSubjectTeacherWriteAction(action) {
  return action?.executionMode === "USER_TASK"
    && action?.writes === true
    && action?.operationKind !== "READ"
    && Array.isArray(action?.permissions)
    && action.permissions.some(({ effect, dutyRef }) => (
      effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
    ));
}

export function resolveTeacherWriteDomainContract(object) {
  return teacherWriteDomainContractRegistry[object?.id];
}

export function resolveTeacherWriteScopePolicy(object) {
  const contract = resolveTeacherWriteDomainContract(object);
  return contract ? domainPolicy(contract) : { ...ASSIGNED_SUBJECT_COURSE_POLICY };
}

export function isAssignedSubjectCourseScope(scope) {
  return hasExactKeys(scope, ["kind", "subjectMatch", "courseMatch"])
    && scope.kind === ASSIGNED_SUBJECT_COURSE_SCOPE.kind
    && scope.subjectMatch === ASSIGNED_SUBJECT_COURSE_SCOPE.subjectMatch
    && scope.courseMatch === ASSIGNED_SUBJECT_COURSE_SCOPE.courseMatch;
}

export function isTeacherWriteScopePolicy(policy) {
  if (!isRecord(policy)) return false;
  if (policy.kind === TEACHER_WRITE_SCOPE_POLICY_KIND.ASSIGNED_SUBJECT_COURSE) {
    return hasExactKeys(
      policy,
      ["kind", "resolutionMode", "subjectMatch", "courseMatch"],
    )
      && policy.resolutionMode === "DIRECT_PERMISSION_SCOPE"
      && policy.subjectMatch === "REQUIRED"
      && policy.courseMatch === "REQUIRED";
  }
  const contract = domainContractById.get(policy.contractId);
  return policy.kind === TEACHER_WRITE_SCOPE_POLICY_KIND.DOMAIN_CONTRACT
    && hasExactKeys(policy, ["kind", "contractId", "contractVersion", "enforcement"])
    && contract?.contractVersion === policy.contractVersion
    && policy.enforcement === "ACTION_DOMAIN_BOUNDARY";
}

export function teacherWriteScopePolicyMatchesExpected(policy, expectedPolicy) {
  return isTeacherWriteScopePolicy(policy)
    && isTeacherWriteScopePolicy(expectedPolicy)
    && structurallyEqual(policy, expectedPolicy);
}

export function isTeacherWriteDomainBoundary(boundary, contractOrId) {
  const contract = typeof contractOrId === "string"
    ? domainContractById.get(contractOrId)
    : contractOrId;
  return Boolean(contract)
    && structurallyEqual(boundary, buildTeacherWriteDomainBoundary(contract));
}

export function applyTeacherWriteScopePolicies(modules) {
  const candidateTargetObjectIds = new Set(
    modules.flatMap(({ actions = [] }) => actions
      .filter(isSubjectTeacherWriteAction)
      .map(({ targetObjectId }) => targetObjectId)),
  );
  const objectById = new Map(
    modules.flatMap(({ objects = [] }) => objects.map((object) => [object.id, object])),
  );
  const policyByObjectId = new Map(
    [...candidateTargetObjectIds].flatMap((objectId) => {
      const object = objectById.get(objectId);
      return object ? [[objectId, resolveTeacherWriteScopePolicy(object)]] : [];
    }),
  );

  return modules.map((module) => ({
    ...module,
    objects: module.objects.map((object) => {
      const policy = policyByObjectId.get(object.id);
      if (!policy || Object.hasOwn(object, "teacherWriteScopePolicy")) return object;
      return { ...object, teacherWriteScopePolicy: policy };
    }),
    actions: module.actions.map((action) => {
      if (!isSubjectTeacherWriteAction(action)) return action;
      const policy = policyByObjectId.get(action.targetObjectId);
      if (!policy) return action;
      if (policy.kind === TEACHER_WRITE_SCOPE_POLICY_KIND.DOMAIN_CONTRACT) {
        const contract = resolveTeacherWriteDomainContract(objectById.get(action.targetObjectId));
        return Object.hasOwn(action, "teacherWriteAuthorizationBoundary")
          ? action
          : {
              ...action,
              teacherWriteAuthorizationBoundary: buildTeacherWriteDomainBoundary(contract),
            };
      }
      return {
        ...action,
        permissions: action.permissions.map((permission) => (
          permission.effect === "ALLOW"
          && permission.dutyRef === "DUTY-SUBJECT-TEACHER"
          && !Object.hasOwn(permission, "scope")
            ? { ...permission, scope: { ...ASSIGNED_SUBJECT_COURSE_SCOPE } }
            : permission
        )),
      };
    }),
  }));
}
