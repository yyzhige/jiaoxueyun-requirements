import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import {
  TEACHER_WRITE_SCOPE_POLICY_KIND,
  applyTeacherWriteScopePolicies,
  isAssignedSubjectCourseScope,
  isSubjectTeacherWriteAction,
  isTeacherWriteDomainBoundary,
  resolveTeacherWriteDomainContract,
  resolveTeacherWriteScopePolicy,
  teacherWriteDomainContractRegistry,
  teacherWriteScopePolicyMatchesExpected,
} from "../requirements-v2/facts/teacher-write-scope.mjs";
import { validateTeacherWriteScopes } from "../requirements-v2/validate/teacher-write-scope-validator.mjs";

function allObjects(model) {
  return model.modules.flatMap((module) => module.objects);
}

function allActions(model) {
  return model.modules.flatMap((module) => module.actions);
}

function objectById(model, objectId) {
  return allObjects(model).find(({ id }) => id === objectId);
}

function actionById(model, actionId) {
  return allActions(model).find(({ id }) => id === actionId);
}

function teacherAllows(action) {
  return action.permissions.filter(({ effect, dutyRef }) => (
    effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
  ));
}

test("dynamically closes every subject-teacher user write through its target object policy", () => {
  const candidates = allActions(requirementModel).filter(isSubjectTeacherWriteAction);
  const candidateTargetIds = new Set(candidates.map(({ targetObjectId }) => targetObjectId));
  const declaredPolicyTargetIds = new Set(allObjects(requirementModel)
    .filter((object) => Object.hasOwn(object, "teacherWriteScopePolicy"))
    .map(({ id }) => id));
  const assignedActions = [];
  const domainActions = [];

  assert.ok(candidates.length > 0);
  assert.deepEqual(declaredPolicyTargetIds, candidateTargetIds);
  for (const action of candidates) {
    const targetObject = objectById(requirementModel, action.targetObjectId);
    const expectedPolicy = resolveTeacherWriteScopePolicy(targetObject);
    const allows = teacherAllows(action);
    assert.equal(allows.length, 1, action.id);
    assert.equal(
      teacherWriteScopePolicyMatchesExpected(
        targetObject.teacherWriteScopePolicy,
        expectedPolicy,
      ),
      true,
      targetObject.id,
    );
    if (expectedPolicy.kind === TEACHER_WRITE_SCOPE_POLICY_KIND.ASSIGNED_SUBJECT_COURSE) {
      assignedActions.push(action);
      assert.equal(isAssignedSubjectCourseScope(allows[0].scope), true, action.id);
      assert.equal(Object.hasOwn(action, "teacherWriteAuthorizationBoundary"), false, action.id);
    } else {
      domainActions.push(action);
      assert.equal(Object.hasOwn(allows[0], "scope"), false, action.id);
      assert.equal(
        isTeacherWriteDomainBoundary(
          action.teacherWriteAuthorizationBoundary,
          expectedPolicy.contractId,
        ),
        true,
        action.id,
      );
    }
  }
  assert.ok(assignedActions.length > 0);
  assert.ok(domainActions.length > 0);
  assert.deepEqual(validateTeacherWriteScopes(requirementModel), []);
});

test("applies the secure assigned-course default to a newly introduced action without an action registry", () => {
  const syntheticModules = [{
    id: "SYN-001",
    objects: [{ id: "SYN-OBJ-TEACHER-WRITE" }],
    actions: [{
      id: "SYN-ACT-NEW-TEACHER-WRITE",
      targetObjectId: "SYN-OBJ-TEACHER-WRITE",
      executionMode: "USER_TASK",
      operationKind: "CREATE",
      writes: true,
      permissions: [{
        effect: "ALLOW",
        dutyRef: "DUTY-SUBJECT-TEACHER",
        condition: "the assigned teacher performs a new write",
      }],
    }],
  }];

  const once = applyTeacherWriteScopePolicies(syntheticModules);
  const twice = applyTeacherWriteScopePolicies(once);
  assert.deepEqual(twice, once);
  assert.equal(
    once[0].objects[0].teacherWriteScopePolicy.kind,
    TEACHER_WRITE_SCOPE_POLICY_KIND.ASSIGNED_SUBJECT_COURSE,
  );
  assert.equal(
    isAssignedSubjectCourseScope(once[0].actions[0].permissions[0].scope),
    true,
  );
});

test("rejects missing assigned scope, missing object policy, and mismatched domain boundaries", () => {
  const assignedSource = allActions(requirementModel).find((action) => {
    if (!isSubjectTeacherWriteAction(action)) return false;
    return resolveTeacherWriteScopePolicy(objectById(requirementModel, action.targetObjectId))
      .kind === TEACHER_WRITE_SCOPE_POLICY_KIND.ASSIGNED_SUBJECT_COURSE;
  });
  const domainSource = allActions(requirementModel).find((action) => {
    if (!isSubjectTeacherWriteAction(action)) return false;
    return resolveTeacherWriteScopePolicy(objectById(requirementModel, action.targetObjectId))
      .kind === TEACHER_WRITE_SCOPE_POLICY_KIND.DOMAIN_CONTRACT;
  });
  assert.ok(assignedSource);
  assert.ok(domainSource);

  const missingScope = structuredClone(requirementModel);
  delete teacherAllows(actionById(missingScope, assignedSource.id))[0].scope;
  assert.ok(validateTeacherWriteScopes(missingScope).some((error) => (
    error.includes("INVALID_TEACHER_WRITE_SCOPE")
    && error.includes(assignedSource.id)
    && error.includes("ASSIGNED_SUBJECT_COURSE")
  )));

  const missingPolicy = structuredClone(requirementModel);
  delete objectById(missingPolicy, assignedSource.targetObjectId).teacherWriteScopePolicy;
  assert.ok(validateTeacherWriteScopes(missingPolicy).some((error) => (
    error.includes("INVALID_TEACHER_WRITE_SCOPE")
    && error.includes(assignedSource.targetObjectId)
    && error.includes("teacherWriteScopePolicy")
  )));

  const wrongDomainBoundary = structuredClone(requirementModel);
  actionById(
    wrongDomainBoundary,
    domainSource.id,
  ).teacherWriteAuthorizationBoundary.contractId = "UNREGISTERED_DOMAIN_CONTRACT";
  assert.ok(validateTeacherWriteScopes(wrongDomainBoundary).some((error) => (
    error.includes("INVALID_TEACHER_WRITE_SCOPE")
    && error.includes(domainSource.id)
    && error.includes("teacherWriteAuthorizationBoundary")
  )));

  const wrongDomainPolicy = structuredClone(requirementModel);
  objectById(
    wrongDomainPolicy,
    domainSource.targetObjectId,
  ).teacherWriteScopePolicy.contractId = "UNREGISTERED_DOMAIN_CONTRACT";
  assert.ok(validateTeacherWriteScopes(wrongDomainPolicy).some((error) => (
    error.includes("INVALID_TEACHER_WRITE_SCOPE")
    && error.includes(domainSource.targetObjectId)
    && error.includes("teacherWriteScopePolicy")
  )));

  const genericScopeOnDomain = structuredClone(requirementModel);
  teacherAllows(actionById(genericScopeOnDomain, domainSource.id))[0].scope = {
    kind: "ASSIGNED_SUBJECT_COURSE",
    subjectMatch: "REQUIRED",
    courseMatch: "REQUIRED",
  };
  assert.ok(validateTeacherWriteScopes(genericScopeOnDomain).some((error) => (
    error.includes("INVALID_TEACHER_WRITE_SCOPE")
    && error.includes(domainSource.id)
    && error.includes("registered domain contract")
  )));
});

test("discovers a newly widened teacher write even when its Action ID was never registered", () => {
  const model = structuredClone(requirementModel);
  const target = allActions(model).find((action) => (
    action.executionMode === "USER_TASK"
    && action.writes === true
    && !isSubjectTeacherWriteAction(action)
    && Array.isArray(action.permissions)
    && !Object.hasOwn(objectById(model, action.targetObjectId) ?? {}, "teacherWriteScopePolicy")
  ));
  assert.ok(target);
  target.permissions.push({
    effect: "ALLOW",
    dutyRef: "DUTY-SUBJECT-TEACHER",
    condition: "an accidental new teacher write is introduced",
  });

  const errors = validateTeacherWriteScopes(model);
  assert.ok(errors.some((error) => (
    error.includes("INVALID_TEACHER_WRITE_SCOPE")
    && error.includes(target.targetObjectId)
    && error.includes("teacherWriteScopePolicy")
  )));
  assert.ok(errors.some((error) => (
    error.includes("INVALID_TEACHER_WRITE_SCOPE")
    && error.includes(target.id)
    && error.includes("ASSIGNED_SUBJECT_COURSE")
  )));
});

test("registers structured domain contracts with concrete principal, scope, and source bindings", () => {
  assert.equal(Object.keys(teacherWriteDomainContractRegistry).length, 9);
  for (const [objectId, contract] of Object.entries(teacherWriteDomainContractRegistry)) {
    assert.equal(contract.objectId, objectId);
    assert.equal(contract.contractVersion, 1);
    assert.equal(typeof contract.principalBinding.subjectFieldId, "string", objectId);
    assert.equal(typeof contract.scopeBinding.kind, "string", objectId);
    assert.ok(Array.isArray(contract.sourceBindings), objectId);
    assert.equal(
      resolveTeacherWriteDomainContract(objectById(requirementModel, objectId)),
      contract,
      objectId,
    );
  }
  assert.equal(
    teacherWriteDomainContractRegistry["NOTI-OBJ-ACTION-TODO"]
      .principalBinding.subjectFieldId,
    "NOTI-TODO-F-ASSIGNEE-ID",
  );
  assert.equal(
    teacherWriteDomainContractRegistry["NOTI-OBJ-NOTIFICATION"]
      .principalBinding.subjectFieldId,
    "NOTI-NOTIFICATION-F-RECIPIENT",
  );
  assert.deepEqual(
    teacherWriteDomainContractRegistry["INS-OBJ-MASTERY-CHALLENGE"].scopeBinding,
    {
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
  );
});

test("rejects missing assignee, recipient, permission result, and version-pinned source bindings", () => {
  const mutations = [
    (model) => {
      actionById(model, "NOTI-ACT-CREATE-ACTION-TODO").inputFieldIds =
        actionById(model, "NOTI-ACT-CREATE-ACTION-TODO").inputFieldIds
          .filter((id) => id !== "NOTI-TODO-F-ASSIGNEE-ID");
    },
    (model) => {
      actionById(model, "NOTI-ACT-CREATE-REMINDER").inputFieldIds =
        actionById(model, "NOTI-ACT-CREATE-REMINDER").inputFieldIds
          .filter((id) => id !== "NOTI-NOTIFICATION-F-RECIPIENT");
    },
    (model) => {
      actionById(model, "AIX-ACT-PREPARE-TASK-PREVIEW").outputFieldIds =
        actionById(model, "AIX-ACT-PREPARE-TASK-PREVIEW").outputFieldIds
          .filter((id) => id !== "AIX-PREVIEW-F-PERMISSION-RESULT");
    },
    (model) => {
      objectById(model, "RPT-OBJ-SUBSCRIPTION").lineageBindings = [];
    },
    (model) => {
      actionById(model, "CONTENT-ACT-CREATE-STUDENT-SAMPLE-COPY")
        .relatedStateGuards[0].requiredState = "DRAFT";
    },
    (model) => {
      actionById(model, "VIDEO-ACT-REQUEST-SCHOOL-GROUP").inputFieldIds =
        actionById(model, "VIDEO-ACT-REQUEST-SCHOOL-GROUP").inputFieldIds
          .filter((id) => id !== "VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-VERSION");
    },
  ];
  for (const mutate of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assert.ok(
      validateTeacherWriteScopes(model).some((error) => (
        error.includes("INVALID_TEACHER_DOMAIN_CONTRACT")
      )),
      validateTeacherWriteScopes(model).join("\n"),
    );
  }
});

test("rejects a mastery challenge when its persisted one-hop student subject or evidence path breaks", () => {
  for (const fieldId of [
    "INS-MASTERY-F-STUDENT-REF",
    "INS-MASTERY-F-SUBJECT",
    "INS-MASTERY-F-EVIDENCE-REFS",
  ]) {
    const model = structuredClone(requirementModel);
    objectById(model, "INS-OBJ-MASTERY-NODE").fields =
      objectById(model, "INS-OBJ-MASTERY-NODE").fields
        .filter(({ id }) => id !== fieldId);
    assert.ok(validateTeacherWriteScopes(model).some((error) => (
      error.includes("INVALID_TEACHER_DOMAIN_CONTRACT")
      && error.includes(fieldId)
    )), fieldId);
  }

  const staleBoundary = structuredClone(requirementModel);
  actionById(staleBoundary, "INS-ACT-RESOLVE-MASTERY-CHALLENGE")
    .teacherWriteAuthorizationBoundary.scopeBinding.targetEvidenceFieldId =
      "INS-MASTERY-F-SOURCE-REASON";
  assert.ok(validateTeacherWriteScopes(staleBoundary).some((error) => (
    error.includes("INVALID_TEACHER_WRITE_SCOPE")
    && error.includes("complete INS_VERSIONED_MASTERY_CHALLENGE")
  )));
});
