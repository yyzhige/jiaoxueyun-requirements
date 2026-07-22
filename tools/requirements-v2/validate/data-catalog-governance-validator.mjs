import { buildModelIndex } from "./model-validator.mjs";

const CODE = "INVALID_D047_DATA_CATALOG_EXECUTION";
const CATALOG_OBJECT_ID = "DGV-OBJ-DATA-CATALOG-ENTRY";
const GOVERNANCE_CASE_OBJECT_ID = "DGV-OBJ-DATA-GOVERNANCE-CASE";
const CONTROL_SUBJECT_FIELD_ID = "DGV-CATALOG-F-CONTROL-SUBJECT";
const CONTROL_SCOPE_FIELD_ID = "DGV-CATALOG-F-CONTROL-SCOPE-REF";
const SOURCE_OBJECT_KIND_FIELD_ID = "DGV-CATALOG-F-SOURCE-OBJECT-KIND";
const UNIQUE_KEY_FIELD_IDS = [
  CONTROL_SUBJECT_FIELD_ID,
  CONTROL_SCOPE_FIELD_ID,
  SOURCE_OBJECT_KIND_FIELD_ID,
];
const GOVERNANCE_INPUT_FIELD_IDS = [
  "DGV-GOVCASE-F-TARGET-OBJECT-ID",
  "DGV-GOVCASE-F-TARGET-OBJECT-KIND",
  "DGV-GOVCASE-F-TARGET-CONTROL-SCOPE-REF",
  "DGV-GOVCASE-F-CATALOG-ENTRY-REF",
  "DGV-GOVCASE-F-CATALOG-ENTRY-VERSION",
  "DGV-GOVCASE-F-ACTION-KIND",
  "DGV-GOVCASE-F-LEGAL-BASIS",
  "DGV-GOVCASE-F-DISPUTE-BASIS",
];
const REQUIRED_FAILURE_RESULTS = [
  "CATALOG_NOT_ACTIVE",
  "CATALOG_VERSION_STALE",
  "CATALOG_OBJECT_KIND_MISMATCH",
  "CATALOG_SCOPE_MISMATCH",
  "ACTIVE_CATALOG_NOT_UNIQUE",
];
const EXPECTED_PARTITIONS = Object.freeze({
  SCHOOL: {
    managementScopeCode: "SCHOOL_PRIVATE",
    scopeRefKind: "SCHOOL_ID",
    authorizedActorRef: "ROLE-SCHOOL-ADMIN",
  },
  PLATFORM: {
    managementScopeCode: "PLATFORM_GOVERNANCE",
    scopeRefKind: "PLATFORM_TENANT_ID",
    authorizedActorRef: "ROLE-PLATFORM-GOVERNANCE",
  },
  STUDENT: {
    managementScopeCode: "STUDENT_MEMORY",
    scopeRefKind: "STUDENT_ID",
    authorizedActorRef: "ROLE-PLATFORM-GOVERNANCE",
  },
});

function list(value) {
  return Array.isArray(value) ? value : [];
}

function sameOrder(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function sameSet(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && new Set(left).size === left.length
    && left.every((value) => right.includes(value));
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

function fieldById(object, fieldId) {
  return list(object?.fields).find(({ id }) => id === fieldId);
}

function hasPermission(action, effect, actorRef) {
  return list(action?.permissions).some((permission) => (
    permission.effect === effect
    && (permission.roleRef ?? permission.dutyRef ?? permission.actorRef) === actorRef
  ));
}

function expectedPermissionScope(controlSubject) {
  return {
    kind: "CATALOG_CONTROL_SUBJECT_PARTITION",
    controlSubject,
    controlSubjectFieldId: CONTROL_SUBJECT_FIELD_ID,
    scopeRefFieldId: CONTROL_SCOPE_FIELD_ID,
    subjectMatch: "REQUIRED",
    scopeMatch: "REQUIRED",
    crossPartitionEffect: "DENY",
  };
}

function hasBoundaryScenario(index, action, resultCode) {
  return list(action?.scenarioIds).some((scenarioId) => {
    const scenario = index.scenarioById.get(scenarioId)?.value;
    return scenario?.resultCode === resultCode
      && scenario.kind === "BOUNDARY"
      && scenario.then?.expectedPermission === "DENY"
      && scenario.then?.expectedState?.mode === "UNCHANGED"
      && typeof scenario.failurePredicate === "string"
      && scenario.failurePredicate.length > 0;
  });
}

function validateCoveragePartitions(index, catalog) {
  const errors = [];
  const contract = catalog?.dataCatalogContract;
  const partitions = list(contract?.coveragePartitions);
  const allObjectIds = index.objects.map(({ value }) => value?.id).filter(Boolean).toSorted();
  const registeredIds = [];

  if (
    contract?.classificationKey?.scope !== "CONTROL_SUBJECT_PARTITION"
    || !sameOrder(contract?.classificationKey?.fieldIds, UNIQUE_KEY_FIELD_IDS)
  ) {
    errors.push(`${CODE} classificationKey must use the control-subject partition key`);
  }
  if (partitions.length !== Object.keys(EXPECTED_PARTITIONS).length) {
    errors.push(`${CODE} coveragePartitions must declare SCHOOL, PLATFORM, and STUDENT exactly once`);
  }

  const seenSubjects = new Set();
  for (const partition of partitions) {
    const expected = EXPECTED_PARTITIONS[partition?.controlSubject];
    if (!expected || seenSubjects.has(partition.controlSubject)) {
      errors.push(`${CODE} ${partition?.id ?? "<unknown>"} has an unknown or duplicate control subject`);
      continue;
    }
    seenSubjects.add(partition.controlSubject);
    if (
      partition.managementScopeCode !== expected.managementScopeCode
      || partition.scopeRefKind !== expected.scopeRefKind
      || partition.authorizedActorRef !== expected.authorizedActorRef
      || !sameOrder(partition.uniqueKeyFieldIds, UNIQUE_KEY_FIELD_IDS)
    ) {
      errors.push(`${CODE} ${partition.id} has an invalid management scope, actor, or unique key`);
    }
    const actualIds = index.objects
      .filter(({ value }) => value?.controlSubject === partition.controlSubject)
      .map(({ value }) => value.id)
      .toSorted();
    if (!sameOrder(list(partition.governedObjectIds), actualIds)) {
      errors.push(`${CODE} ${partition.id} does not exactly cover its controlSubject objects`);
    }
    registeredIds.push(...list(partition.governedObjectIds));
  }
  if (!sameSet(registeredIds, allObjectIds)) {
    errors.push(`${CODE} coveragePartitions must cover every governed object exactly once`);
  }
  if (!sameOrder(list(contract?.governedObjectIds), allObjectIds)) {
    errors.push(`${CODE} governedObjectIds aggregate must equal the partition union`);
  }

  const expectedActorMappings = partitions.map(({ controlSubject, authorizedActorRef }) => ({
    controlSubject,
    actorRef: authorizedActorRef,
  }));
  const expectedAuthorization = {
    controlSubjectFieldId: CONTROL_SUBJECT_FIELD_ID,
    scopeRefFieldId: CONTROL_SCOPE_FIELD_ID,
    crossPartitionEffect: "DENY",
    actorMappings: expectedActorMappings,
  };
  const expectedResponsibility = {
    responsibilitySource: "CONTROL_SUBJECT_PARTITION",
    controlSubjectFieldId: CONTROL_SUBJECT_FIELD_ID,
    scopeRefFieldId: CONTROL_SCOPE_FIELD_ID,
    schemaControlSubject: "PLATFORM",
    schemaOwnerRef: "ROLE-PLATFORM-GOVERNANCE",
    crossPartitionEffect: "DENY",
    responsibilityMappings: expectedActorMappings.map((mapping) => ({
      ...mapping,
      producerRef: mapping.actorRef,
      ownerRef: mapping.actorRef,
      confirmerRef: mapping.actorRef,
      stewardRef: mapping.actorRef,
    })),
  };
  if (!structurallyEqual(catalog?.catalogPartitionAuthorization, expectedAuthorization)) {
    errors.push(`${CODE} catalogPartitionAuthorization must map each controlSubject to exactly one authorized actor`);
  }
  if (!structurallyEqual(catalog?.catalogEntryResponsibilityContract, expectedResponsibility)) {
    errors.push(`${CODE} catalogEntryResponsibilityContract must derive entry responsibility from the same partition mapping`);
  }
  if (
    catalog?.controlSubject !== "PLATFORM"
    || catalog?.producerRef !== "ROLE-PLATFORM-GOVERNANCE"
    || catalog?.ownerRef !== "ROLE-PLATFORM-GOVERNANCE"
    || catalog?.confirmerRef !== "ROLE-PLATFORM-GOVERNANCE"
    || catalog?.stewardRef !== "ROLE-PLATFORM-GOVERNANCE"
  ) {
    errors.push(`${CODE} catalog schema responsibility must remain with platform governance`);
  }

  const catalogActions = index.actions
    .map(({ value }) => value)
    .filter(({ targetObjectId }) => targetObjectId === CATALOG_OBJECT_ID);
  for (const action of catalogActions) {
    if (
      !structurallyEqual(action.catalogPartitionAuthorization, expectedAuthorization)
      || !structurallyEqual(action.catalogEntryResponsibilityContract, expectedResponsibility)
    ) {
      errors.push(`${CODE} ${action.id} must carry the complete catalog partition authorization and responsibility snapshot`);
    }
    const allowPermissions = list(action.permissions).filter(({ effect }) => effect === "ALLOW");
    const permissionMappingValid = allowPermissions.length === expectedActorMappings.length
      && expectedActorMappings.every((mapping) => (
        allowPermissions.filter((permission) => (
          permission.roleRef === mapping.actorRef
          && structurallyEqual(permission.scope, expectedPermissionScope(mapping.controlSubject))
        )).length === 1
      ));
    if (!permissionMappingValid) {
      errors.push(`${CODE} ${action.id} must bind each actor to exactly one declared controlSubject permission scope`);
    }
    if (!hasPermission(action, "DENY", "ROLE-PLATFORM-OPS")) {
      errors.push(`${CODE} ${action.id} must deny operational actors outside catalog governance`);
    }
  }
  for (const action of catalogActions.filter(({ id }) => (
    [
      "DGV-ACT-REGISTER-DATA-CATALOG",
      "DGV-ACT-ACTIVATE-DATA-CATALOG",
      "DGV-ACT-RESOLVE-DATA-CATALOG",
    ].includes(id)
  ))) {
    if (!UNIQUE_KEY_FIELD_IDS.every((fieldId) => action.inputFieldIds.includes(fieldId))) {
      errors.push(`${CODE} ${action.id} must input the complete partition unique key`);
    }
  }
  const activate = index.actionById.get("DGV-ACT-ACTIVATE-DATA-CATALOG")?.value;
  const replace = index.actionById.get("DGV-ACT-SUPERSEDE-DATA-CATALOG")?.value;
  const resolve = index.actionById.get("DGV-ACT-RESOLVE-DATA-CATALOG")?.value;
  if (!sameOrder(activate?.activeClassificationEffect?.uniquenessKeyFieldIds, UNIQUE_KEY_FIELD_IDS)) {
    errors.push(`${CODE} initial activation must enforce the partition unique key`);
  }
  if (!sameOrder(replace?.atomicCatalogReplacement?.uniquenessKeyFieldIds, UNIQUE_KEY_FIELD_IDS)) {
    errors.push(`${CODE} replacement must preserve the partition unique key atomically`);
  }
  if (
    resolve?.activeClassificationLookup?.requiredState !== "ACTIVE"
    || resolve?.activeClassificationLookup?.requiredMatchCount !== 1
    || !sameOrder(resolve?.activeClassificationLookup?.uniquenessKeyFieldIds, UNIQUE_KEY_FIELD_IDS)
  ) {
    errors.push(`${CODE} catalog resolution must return exactly one ACTIVE partition match`);
  }
  return errors;
}

function validateGovernanceExecution(index, catalog, governanceCase) {
  const errors = [];
  const contract = governanceCase?.catalogExecutionContract;
  const refField = fieldById(governanceCase, contract?.catalogRefFieldId);
  const versionField = fieldById(governanceCase, contract?.catalogVersionFieldId);
  const lineageValid = list(governanceCase?.lineageBindings).some((binding) => (
    binding.refFieldId === contract?.catalogRefFieldId
    && binding.versionFieldId === contract?.catalogVersionFieldId
    && binding.targetObjectId === CATALOG_OBJECT_ID
    && binding.targetVersionFieldId === "DGV-CATALOG-F-VERSION"
  ));
  const referenceValid = refField?.valueSource?.kind === "OBJECT_REF"
    && refField.valueSource.targetObjectId === CATALOG_OBJECT_ID
    && refField.referenceIntegrity === "VERSION_PINNED"
    && refField.stateGuardPolicy === "ALWAYS_REQUIRED"
    && refField.versionBinding?.versionFieldId === contract?.catalogVersionFieldId
    && refField.versionBinding?.targetVersionFieldId === "DGV-CATALOG-F-VERSION"
    && versionField?.dataType === "INTEGER"
    && lineageValid;
  if (!referenceValid) {
    errors.push(`${CODE} governance case must version-pin its catalog entry reference`);
  }
  const contractValid = contract?.targetControlSubjectSource === "MODEL_OBJECT_REGISTRY"
    && contract?.catalogSourceObjectKindFieldId === SOURCE_OBJECT_KIND_FIELD_ID
    && contract?.catalogControlSubjectFieldId === CONTROL_SUBJECT_FIELD_ID
    && contract?.catalogControlScopeFieldId === CONTROL_SCOPE_FIELD_ID
    && contract?.requiredCatalogState === "ACTIVE"
    && contract?.requiredActiveMatchCount === 1
    && contract?.sourceObjectKindMustEqualTargetObjectKind === true
    && contract?.controlSubjectMustEqualTargetObjectControlSubject === true
    && contract?.controlScopeMustEqualTargetControlScope === true;
  if (!contractValid) {
    errors.push(`${CODE} governance case catalog execution equality contract is incomplete`);
  }

  const governanceActions = index.actions
    .map(({ value }) => value)
    .filter((action) => (
      action.targetObjectId === GOVERNANCE_CASE_OBJECT_ID
      && typeof action.governanceActionKind === "string"
    ));
  const expectedKinds = list(governanceCase?.fourActionPolicy?.actionKinds);
  if (!sameSet(governanceActions.map(({ governanceActionKind }) => governanceActionKind), expectedKinds)) {
    errors.push(`${CODE} the four governance actions must bind the four declared action kinds exactly once`);
  }
  if (!sameSet(refField?.actionApplicability?.requiredActionIds, governanceActions.map(({ id }) => id))) {
    errors.push(`${CODE} catalog reference applicability must bind every governance action`);
  }

  for (const action of governanceActions) {
    const guard = list(action.relatedStateGuards).find(({ refFieldId }) => (
      refFieldId === contract?.catalogRefFieldId
    ));
    const guardValid = guard?.versionFieldId === contract?.catalogVersionFieldId
      && guard?.targetObjectId === CATALOG_OBJECT_ID
      && guard?.requiredState === "ACTIVE";
    if (
      !sameOrder(action.inputFieldIds, GOVERNANCE_INPUT_FIELD_IDS)
      || !guardValid
      || !structurallyEqual(action.catalogExecutionGuard, contract)
    ) {
      errors.push(`${CODE} ${action.id} must bind the exact ACTIVE catalog execution contract`);
    }
    for (const resultCode of REQUIRED_FAILURE_RESULTS) {
      if (
        !list(action.failureResults).includes(resultCode)
        || !hasBoundaryScenario(index, action, resultCode)
      ) {
        errors.push(`${CODE} ${action.id} must fail closed for ${resultCode}`);
      }
    }
  }
  return errors;
}

export function validateDataCatalogGovernance(model) {
  if (model?.profile !== "ZHIXU_V2") return [];
  const index = buildModelIndex(model);
  const catalog = index.objectById.get(CATALOG_OBJECT_ID)?.value;
  const governanceCase = index.objectById.get(GOVERNANCE_CASE_OBJECT_ID)?.value;
  if (!catalog || !governanceCase) {
    return [`${CODE} catalog and governance case objects must both exist`];
  }
  return [
    ...validateCoveragePartitions(index, catalog),
    ...validateGovernanceExecution(index, catalog, governanceCase),
  ];
}
