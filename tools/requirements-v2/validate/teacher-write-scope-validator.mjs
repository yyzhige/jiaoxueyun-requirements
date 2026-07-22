import {
  TEACHER_WRITE_SCOPE_POLICY_KIND,
  isAssignedSubjectCourseScope,
  isSubjectTeacherWriteAction,
  isTeacherWriteDomainBoundary,
  resolveTeacherWriteDomainContract,
  resolveTeacherWriteScopePolicy,
  teacherWriteDomainContractRegistry,
  teacherWriteScopePolicyMatchesExpected,
} from "../facts/teacher-write-scope.mjs";
import { buildModelIndex } from "./model-validator.mjs";

function list(value) {
  return Array.isArray(value) ? value : [];
}

function includesAll(values, requiredValues) {
  const available = new Set(list(values));
  return list(requiredValues).every((value) => available.has(value));
}

function fieldById(object, fieldId) {
  return list(object?.fields).find(({ id }) => id === fieldId);
}

function hasLineageBinding(object, expected) {
  return list(object?.lineageBindings).some((binding) => (
    binding.refFieldId === expected.refFieldId
    && binding.versionFieldId === expected.versionFieldId
    && binding.targetObjectId === expected.targetObjectId
    && binding.targetVersionFieldId === expected.targetVersionFieldId
  ));
}

function hasStateGuard(action, binding) {
  return list(action?.relatedStateGuards).some((guard) => (
    guard.refFieldId === binding.refFieldId
    && guard.versionFieldId === binding.versionFieldId
    && guard.targetObjectId === binding.targetObjectId
    && guard.requiredState === binding.requiredState
  ));
}

function contractFieldErrors(index, object, contract) {
  const errors = [];
  const ownFieldIds = new Set(list(object?.fields).map(({ id }) => id));
  const requiredOwnFieldIds = new Set([
    contract.identityFieldId,
    contract.versionFieldId,
    contract.principalBinding.subjectFieldId,
    ...list(contract.scopeBinding.requiredInputFieldIds),
    ...list(contract.scopeBinding.requiredOutputFieldIds),
    contract.scopeBinding.viaRefFieldId,
    contract.scopeBinding.viaVersionFieldId,
    contract.scopeBinding.scopeSnapshotFieldId,
    ...contract.sourceBindings.flatMap(({ refFieldId, versionFieldId }) => [
      refFieldId,
      versionFieldId,
    ]),
  ].filter(Boolean));
  for (const fieldId of requiredOwnFieldIds) {
    if (!ownFieldIds.has(fieldId)) {
      errors.push(
        `INVALID_TEACHER_DOMAIN_CONTRACT ${contract.contractId} cannot resolve target field ${fieldId}`,
      );
    }
  }

  const scopeTarget = contract.scopeBinding.targetObjectId
    ? index.objectById.get(contract.scopeBinding.targetObjectId)?.value
    : undefined;
  if (contract.scopeBinding.targetObjectId && !scopeTarget) {
    errors.push(
      `INVALID_TEACHER_DOMAIN_CONTRACT ${contract.contractId} cannot resolve one-hop target ${contract.scopeBinding.targetObjectId}`,
    );
  }
  for (const [key, value] of Object.entries(contract.scopeBinding)) {
    if (!key.startsWith("target") || !key.endsWith("FieldId") || !value || !scopeTarget) continue;
    if (!fieldById(scopeTarget, value)) {
      errors.push(
        `INVALID_TEACHER_DOMAIN_CONTRACT ${contract.contractId}.${key} cannot resolve ${value} on ${scopeTarget.id}`,
      );
    }
  }

  for (const binding of contract.sourceBindings) {
    const refField = fieldById(object, binding.refFieldId);
    const versionField = fieldById(object, binding.versionFieldId);
    const targetObject = index.objectById.get(binding.targetObjectId)?.value;
    if (!refField || !versionField || !targetObject) continue;
    if (!fieldById(targetObject, binding.targetVersionFieldId)) {
      errors.push(
        `INVALID_TEACHER_DOMAIN_CONTRACT ${contract.contractId} cannot resolve source version ${binding.targetObjectId}.${binding.targetVersionFieldId}`,
      );
    }
    if (binding.integrity !== "VERSION_PINNED_OBJECT_REF") continue;
    const sourceValid = refField.valueSource?.kind === "OBJECT_REF"
      && refField.valueSource.targetObjectId === binding.targetObjectId
      && refField.referenceIntegrity === "VERSION_PINNED"
      && refField.versionBinding?.versionFieldId === binding.versionFieldId
      && refField.versionBinding?.targetVersionFieldId === binding.targetVersionFieldId
      && hasLineageBinding(object, binding);
    if (!sourceValid) {
      errors.push(
        `INVALID_TEACHER_DOMAIN_CONTRACT ${contract.contractId} must preserve the version-pinned ${binding.refFieldId}/${binding.versionFieldId} source binding`,
      );
    }
  }
  return errors;
}

function contractActionErrors(action, contract) {
  const errors = [];
  const inputFieldIds = list(action.inputFieldIds);
  const outputFieldIds = list(action.outputFieldIds);
  const principal = contract.principalBinding;
  const createAction = action.operationKind === "CREATE";

  if (
    principal.requiredInput === "EVERY_WRITE"
    || (principal.requiredInput === "CREATE" && createAction)
  ) {
    if (!inputFieldIds.includes(principal.subjectFieldId)) {
      errors.push(
        `INVALID_TEACHER_DOMAIN_CONTRACT ${action.id} must input principal match field ${principal.subjectFieldId}`,
      );
    }
  }
  if (principal.requiredOutput === "CREATE" && createAction) {
    if (!outputFieldIds.includes(principal.subjectFieldId)) {
      errors.push(
        `INVALID_TEACHER_DOMAIN_CONTRACT ${action.id} must output principal snapshot field ${principal.subjectFieldId}`,
      );
    }
  }
  if (!includesAll(inputFieldIds, contract.scopeBinding.requiredInputFieldIds)) {
    errors.push(
      `INVALID_TEACHER_DOMAIN_CONTRACT ${action.id} is missing concrete scope input fields for ${contract.contractId}`,
    );
  }
  if (!includesAll(outputFieldIds, contract.scopeBinding.requiredOutputFieldIds)) {
    errors.push(
      `INVALID_TEACHER_DOMAIN_CONTRACT ${action.id} is missing concrete scope output fields for ${contract.contractId}`,
    );
  }
  if (!outputFieldIds.includes(contract.versionFieldId)) {
    errors.push(
      `INVALID_TEACHER_DOMAIN_CONTRACT ${action.id} must output version field ${contract.versionFieldId}`,
    );
  }
  if (createAction && !outputFieldIds.includes(contract.identityFieldId)) {
    errors.push(
      `INVALID_TEACHER_DOMAIN_CONTRACT ${action.id} must output identity field ${contract.identityFieldId}`,
    );
  }

  for (const binding of contract.sourceBindings) {
    const pair = [binding.refFieldId, binding.versionFieldId];
    const hasEither = pair.some((fieldId) => inputFieldIds.includes(fieldId));
    const mustInput = binding.applicability === "EVERY_WRITE"
      || (binding.applicability === "CREATE" && createAction)
      || (binding.applicability === "WHEN_REFERENCED" && hasEither);
    if (mustInput && !includesAll(inputFieldIds, pair)) {
      errors.push(
        `INVALID_TEACHER_DOMAIN_CONTRACT ${action.id} must input the complete ${binding.refFieldId}/${binding.versionFieldId} source pair`,
      );
    }
    if (binding.requiredState && mustInput && !hasStateGuard(action, binding)) {
      errors.push(
        `INVALID_TEACHER_DOMAIN_CONTRACT ${action.id} must guard ${binding.targetObjectId} at ${binding.requiredState}`,
      );
    }
  }
  return errors;
}

export function validateTeacherWriteScopes(model) {
  if (model?.profile !== "ZHIXU_V2") return [];

  const index = buildModelIndex(model);
  const errors = [];
  const candidates = index.actions.filter(({ value }) => (
    isSubjectTeacherWriteAction(value)
  ));
  const policyErrorObjectIds = new Set();
  const domainContractValidatedObjectIds = new Set();

  for (const { value: action } of candidates) {
    const targetObject = index.objectById.get(action.targetObjectId)?.value;
    if (!targetObject) {
      errors.push(
        `INVALID_TEACHER_WRITE_SCOPE ${action.id} cannot resolve target object ${action.targetObjectId}`,
      );
      continue;
    }

    const expectedPolicy = resolveTeacherWriteScopePolicy(targetObject);
    const actualPolicy = targetObject.teacherWriteScopePolicy;
    if (
      !teacherWriteScopePolicyMatchesExpected(actualPolicy, expectedPolicy)
      && !policyErrorObjectIds.has(targetObject.id)
    ) {
      policyErrorObjectIds.add(targetObject.id);
      errors.push(
        `INVALID_TEACHER_WRITE_SCOPE ${targetObject.id}.teacherWriteScopePolicy must match its assigned-subject-course or registered domain contract`,
      );
    }

    if (Object.hasOwn(targetObject, "professionalWritePolicy")) continue;

    const teacherAllows = list(action.permissions).filter(({ effect, dutyRef }) => (
      effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
    ));
    if (teacherAllows.length !== 1) {
      errors.push(
        `INVALID_TEACHER_WRITE_SCOPE ${action.id} must declare exactly one subject-teacher ALLOW permission`,
      );
      continue;
    }

    if (expectedPolicy.kind === TEACHER_WRITE_SCOPE_POLICY_KIND.ASSIGNED_SUBJECT_COURSE) {
      if (!isAssignedSubjectCourseScope(teacherAllows[0].scope)) {
        errors.push(
          `INVALID_TEACHER_WRITE_SCOPE ${action.id} must enforce ASSIGNED_SUBJECT_COURSE with required subject and course matches`,
        );
      }
      if (Object.hasOwn(action, "teacherWriteAuthorizationBoundary")) {
        errors.push(
          `INVALID_TEACHER_WRITE_SCOPE ${action.id} cannot replace assigned teaching scope with a domain boundary`,
        );
      }
      continue;
    }

    const contract = resolveTeacherWriteDomainContract(targetObject);
    if (!contract) {
      errors.push(
        `INVALID_TEACHER_DOMAIN_CONTRACT ${targetObject.id} has no structured domain registration`,
      );
      continue;
    }
    if (!domainContractValidatedObjectIds.has(targetObject.id)) {
      domainContractValidatedObjectIds.add(targetObject.id);
      errors.push(...contractFieldErrors(index, targetObject, contract));
    }
    if (Object.hasOwn(teacherAllows[0], "scope")) {
      errors.push(
        `INVALID_TEACHER_WRITE_SCOPE ${action.id} must use its registered domain contract instead of a generic permission scope`,
      );
    }
    if (!isTeacherWriteDomainBoundary(action.teacherWriteAuthorizationBoundary, contract)) {
      errors.push(
        `INVALID_TEACHER_WRITE_SCOPE ${action.id}.teacherWriteAuthorizationBoundary must bind the complete ${contract.contractId} v${contract.contractVersion} contract`,
      );
    }
    errors.push(...contractActionErrors(action, contract));
  }

  for (const [objectId, contract] of Object.entries(teacherWriteDomainContractRegistry)) {
    const object = index.objectById.get(objectId)?.value;
    const hasCandidate = candidates.some(({ value }) => value.targetObjectId === objectId);
    if (!object || !hasCandidate || contract.objectId !== objectId) {
      errors.push(
        `INVALID_TEACHER_DOMAIN_CONTRACT ${objectId} must resolve exactly one live subject-teacher write domain`,
      );
    }
  }

  for (const { value: action } of index.actions) {
    if (
      Object.hasOwn(action ?? {}, "teacherWriteAuthorizationBoundary")
      && !isSubjectTeacherWriteAction(action)
    ) {
      errors.push(
        `INVALID_TEACHER_WRITE_SCOPE ${action.id}.teacherWriteAuthorizationBoundary is allowed only on a subject-teacher user write`,
      );
    }
  }

  return errors;
}
