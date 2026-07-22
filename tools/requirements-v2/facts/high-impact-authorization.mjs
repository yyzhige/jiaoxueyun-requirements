import { deepFreeze } from "../model.mjs";

export const HIGH_IMPACT_AUTHORIZATION_OBJECT_ID = "IAM-OBJ-HIGH-IMPACT-AUTHORIZATION";
export const HIGH_IMPACT_AUTHORIZATION_VERSION_FIELD_ID = "IAM-HIAUTH-F-VERSION";
export const HIGH_IMPACT_RESERVATION_REQUEST_EVENT_ID = "EVT-HIGH-IMPACT-AUTHORIZATION-RESERVATION-REQUESTED";
export const HIGH_IMPACT_RESERVATION_ACTION_ID = "IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION";

export const CONSUMPTION_FIELDS = Object.freeze({
  key: "IAM-HIAUTH-F-CONSUMPTION-KEY",
  consumedAction: "IAM-HIAUTH-F-CONSUMED-ACTION-ID",
  targetRef: "IAM-HIAUTH-F-CONSUMED-TARGET-REF",
  targetVersion: "IAM-HIAUTH-F-CONSUMED-TARGET-VERSION",
  executionId: "IAM-HIAUTH-F-CONSUMED-EXECUTION-ID",
  executionVersion: "IAM-HIAUTH-F-CONSUMED-EXECUTION-VERSION",
  consumedAt: "IAM-HIAUTH-F-CONSUMED-AT",
});

export const RESERVATION_FIELDS = Object.freeze({
  reservationId: "IAM-HIAUTH-F-RESERVATION-ID",
  reservationVersion: "IAM-HIAUTH-F-RESERVATION-VERSION",
  reservedAt: "IAM-HIAUTH-F-RESERVED-AT",
});

const AUTHORIZATION_STUDENT_FIELD_ID = "IAM-HIAUTH-F-STUDENT-PROFILE-ID";
const AUTHORIZATION_ACTION_FIELD_ID = "IAM-HIAUTH-F-ACTION";
const AUTHORIZATION_EXPIRY_FIELD_ID = "IAM-HIAUTH-F-EXPIRY";
const AUTHORIZATION_DISPUTE_STATUS_FIELD_ID = "IAM-HIAUTH-F-DISPUTE-STATUS";
const AUTHORIZATION_SCHOOL_SCOPE_FIELD_ID = "IAM-HIAUTH-F-SCHOOL-SCOPE";
const AUTHORIZATION_RELATIONSHIP_SCOPE_FIELD_ID = "IAM-HIAUTH-F-RELATIONSHIP-SCOPE";
const DISPUTE_OBJECT_ID = "IAM-OBJ-GUARDIAN-DISPUTE";
const DISPUTE_AUTHORIZATION_REF_FIELD_ID = "IAM-DISPUTE-F-HIGH-IMPACT-AUTHORIZATION-ID";
const DISPUTE_AUTHORIZATION_VERSION_FIELD_ID = "IAM-DISPUTE-F-HIGH-IMPACT-AUTHORIZATION-VERSION";
const DISPUTE_STATUS_FIELD_ID = "IAM-DISPUTE-F-STATUS";

const HIGH_IMPACT_FAILURES = deepFreeze([
  {
    code: "HIGH_IMPACT_AUTHORIZATION_INVALID_REFERENCE",
    predicate: "the authorization reference or pinned version does not resolve to the exact registered high-impact authorization object",
  },
  {
    code: "HIGH_IMPACT_AUTHORIZATION_NOT_AUTHORIZED",
    predicate: "the exact pinned high-impact authorization version is not AUTHORIZED at action execution",
  },
  {
    code: "HIGH_IMPACT_AUTHORIZATION_EXPIRED",
    predicate: "the high-impact authorization expiry is not later than the server action-execution time",
  },
  {
    code: "HIGH_IMPACT_AUTHORIZATION_STUDENT_MISMATCH",
    predicate: "the authorized student differs from the student resolved from the exact target action context",
  },
  {
    code: "HIGH_IMPACT_AUTHORIZATION_ACTION_MISMATCH",
    predicate: "the authorized high-impact action code differs from the concrete domain action being executed",
  },
  {
    code: "HIGH_IMPACT_AUTHORIZATION_SCOPE_MISMATCH",
    predicate: "the exact canonical school or relationship scope differs from the target action context",
  },
  {
    code: "HIGH_IMPACT_AUTHORIZATION_DISPUTED",
    predicate: "the authorization dispute status or a linked guardian dispute is OPEN or FROZEN",
  },
]);

export const highImpactAuthorizationBindings = deepFreeze([
  {
    contractId: "D037-STUDENT-IDENTITY-DELETION",
    moduleId: "ACC-001",
    actionId: "ACC-ACT-COMPLETE-IDENTITY-DELETION",
    targetObjectId: "ACC-OBJ-PLATFORM-IDENTITY",
    referenceFieldId: "ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-ID",
    versionFieldId: "ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-VERSION",
    requiredActionCode: "DELETE",
    applicability: {
      kind: "FIELD_CODE",
      fieldId: "ACC-PIDENT-F-SUBJECT-KIND",
      requiredCode: "STUDENT",
    },
    targetContext: {
      objectId: "DGV-OBJ-STUDENT-DELETION-CASE",
      refFieldId: "ACC-PIDENT-F-DELETION-CASE-REF",
      refVersionFieldId: "ACC-PIDENT-F-DELETION-CASE-VERSION",
      contextVersionFieldId: "DGV-DELCASE-F-VERSION",
      requiredState: "COMPLETED",
      targetIdentityFieldId: "DGV-DELCASE-F-PLATFORM-IDENTITY-ID",
      targetActionIdentityFieldId: "ACC-PIDENT-F-ID",
      authorizationConsistencyFieldId: "DGV-DELCASE-F-HIGH-IMPACT-AUTHORIZATION-ID",
    },
    studentBinding: {
      authorizationFieldId: AUTHORIZATION_STUDENT_FIELD_ID,
      targetObjectId: "DGV-OBJ-STUDENT-DELETION-CASE",
      targetFieldId: "DGV-DELCASE-F-STUDENT-PROFILE-ID",
      comparison: "EXACT_ID",
    },
    schoolScopeBinding: {
      authorizationFieldId: AUTHORIZATION_SCHOOL_SCOPE_FIELD_ID,
      targetObjectId: "DGV-OBJ-STUDENT-DELETION-CASE",
      targetFieldIds: ["DGV-DELCASE-F-SCHOOL-SCOPE"],
      comparison: "EXACT_CANONICAL_SET",
    },
    relationshipScopeBinding: {
      authorizationFieldId: AUTHORIZATION_RELATIONSHIP_SCOPE_FIELD_ID,
      targetObjectId: "DGV-OBJ-STUDENT-DELETION-CASE",
      targetFieldIds: ["DGV-DELCASE-F-RELATIONSHIP-SCOPE"],
      comparison: "EXACT_CANONICAL_SET",
    },
    standardStateGuard: false,
  },
  {
    contractId: "D037-STUDENT-TRANSFER",
    moduleId: "DGV-001",
    actionId: "DGV-ACT-EXECUTE-STUDENT-TRANSFER",
    targetObjectId: "DGV-OBJ-TRANSFER-AUTHORIZATION",
    referenceFieldId: "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID",
    versionFieldId: "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION",
    requiredActionCode: "MIGRATE",
    applicability: { kind: "ALWAYS" },
    studentBinding: {
      authorizationFieldId: AUTHORIZATION_STUDENT_FIELD_ID,
      targetObjectId: "DGV-OBJ-TRANSFER-AUTHORIZATION",
      targetFieldId: "DGV-TRANSFER-F-STUDENT-PROFILE-ID",
      comparison: "EXACT_ID",
    },
    schoolScopeBinding: {
      authorizationFieldId: AUTHORIZATION_SCHOOL_SCOPE_FIELD_ID,
      targetObjectId: "DGV-OBJ-TRANSFER-AUTHORIZATION",
      targetFieldIds: [
        "DGV-TRANSFER-F-FROM-SCHOOL-ID",
        "DGV-TRANSFER-F-TO-SCHOOL-ID",
      ],
      comparison: "EXACT_CANONICAL_SET",
    },
    relationshipScopeBinding: {
      authorizationFieldId: AUTHORIZATION_RELATIONSHIP_SCOPE_FIELD_ID,
      targetObjectId: "DGV-OBJ-TRANSFER-AUTHORIZATION",
      targetFieldIds: ["DGV-TRANSFER-F-RELATIONSHIP-SCOPE"],
      comparison: "EXACT_CANONICAL_SET",
    },
    standardStateGuard: true,
  },
  {
    contractId: "D037-STUDENT-WORK-PLATFORM-PUBLIC",
    moduleId: "CONTENT-001",
    actionId: "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC",
    targetObjectId: "CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE",
    referenceFieldId: "CONTENT-SCOPE-F-HIGH-IMPACT-AUTHORIZATION-ID",
    versionFieldId: "CONTENT-SCOPE-F-HIGH-IMPACT-AUTHORIZATION-VERSION",
    requiredActionCode: "PUBLISH_STUDENT_WORK",
    applicability: {
      kind: "PINNED_SOURCE_GRAPH_FIELD_CODE_AND_PHASE",
      sourceGraphObjectId: "CONTENT-OBJ-MATERIAL-SOURCE-GRAPH",
      sourceGraphRefFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
      sourceGraphVersionFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION",
      sourceGraphSourceKindFieldId: "CONTENT-SOURCE-F-SOURCE-KIND",
      managementScopeMirrorFieldId: "CONTENT-SCOPE-F-SOURCE-KIND",
      comparison: "EXACT_CODE",
      exactVersionRequired: true,
      materialIdentityFallbackAllowed: false,
      requiredCode: "STUDENT_WORK",
      requiredPhaseIds: ["PHASE-3"],
      prohibitedPhaseIds: ["PHASE-1", "PHASE-2"],
      prohibitionResultCode: "STUDENT_WORK_PUBLIC_PROHIBITED",
    },
    studentBinding: {
      authorizationFieldId: AUTHORIZATION_STUDENT_FIELD_ID,
      targetObjectId: "CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE",
      targetFieldId: "CONTENT-SCOPE-F-STUDENT-PROFILE-ID",
      comparison: "EXACT_ID",
    },
    schoolScopeBinding: {
      authorizationFieldId: AUTHORIZATION_SCHOOL_SCOPE_FIELD_ID,
      targetObjectId: "CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE",
      targetFieldIds: ["CONTENT-SCOPE-F-SCHOOL-SCOPE"],
      comparison: "EXACT_CANONICAL_SET",
    },
    relationshipScopeBinding: {
      authorizationFieldId: AUTHORIZATION_RELATIONSHIP_SCOPE_FIELD_ID,
      targetObjectId: "CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE",
      targetFieldIds: ["CONTENT-SCOPE-F-RELATIONSHIP-SCOPE"],
      comparison: "EXACT_CANONICAL_SET",
    },
    standardStateGuard: false,
  },
]);

export const HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID = "EVT-HIGH-IMPACT-DOMAIN-ACTION-SUCCEEDED";

export const HIGH_IMPACT_EVENT_CONTEXT_KEYS = deepFreeze({
  reservation: [
    { key: "authorizationId", dataType: "ID", required: true, semanticRole: "PINNED_AUTHORIZATION_ID" },
    { key: "authorizationVersion", dataType: "INTEGER", required: true, semanticRole: "PINNED_AUTHORIZATION_VERSION" },
    { key: "authorizedActionCode", dataType: "STRING", required: true, semanticRole: "AUTHORIZED_ACTION_CODE" },
    { key: "targetObjectId", dataType: "STRING", required: true, semanticRole: "TARGET_OBJECT_KIND" },
    { key: "targetObjectRef", dataType: "ID", required: true, semanticRole: "TARGET_OBJECT_ID" },
    { key: "targetObjectVersion", dataType: "INTEGER", required: true, semanticRole: "TARGET_OBJECT_VERSION" },
    { key: "consumptionKey", dataType: "STRING", required: true, semanticRole: "AUTHORIZATION_RESERVATION_KEY" },
  ],
  success: [
    { key: "authorizationId", dataType: "ID", required: true, semanticRole: "PINNED_AUTHORIZATION_ID" },
    { key: "authorizationVersion", dataType: "INTEGER", required: true, semanticRole: "PINNED_AUTHORIZATION_VERSION" },
    { key: "authorizedActionCode", dataType: "STRING", required: true, semanticRole: "AUTHORIZED_ACTION_CODE" },
    { key: "targetObjectId", dataType: "STRING", required: true, semanticRole: "TARGET_OBJECT_KIND" },
    { key: "targetObjectRef", dataType: "ID", required: true, semanticRole: "TARGET_OBJECT_ID" },
    { key: "targetObjectVersion", dataType: "INTEGER", required: true, semanticRole: "TARGET_OBJECT_VERSION" },
    { key: "reservationId", dataType: "ID", required: true, semanticRole: "AUTHORIZATION_RESERVATION_ID" },
    { key: "reservationVersion", dataType: "INTEGER", required: true, semanticRole: "AUTHORIZATION_RESERVATION_VERSION" },
    { key: "domainEventId", dataType: "ID", required: true, semanticRole: "DOMAIN_EVENT_IDEMPOTENCY_ID" },
    { key: "domainEventVersion", dataType: "INTEGER", required: true, semanticRole: "DOMAIN_EVENT_IDEMPOTENCY_VERSION" },
    { key: "consumptionKey", dataType: "STRING", required: true, semanticRole: "AUTHORIZATION_RESERVATION_KEY" },
  ],
});

export const highImpactAuthorizationConsumptionBindings = deepFreeze([
  {
    contractId: "D037-CONSUME-STUDENT-IDENTITY-DELETION",
    moduleId: "ACC-001",
    guardActionId: "ACC-ACT-COMPLETE-IDENTITY-DELETION",
    domainSuccessActionId: "ACC-ACT-COMPLETE-IDENTITY-DELETION",
    targetObjectId: "ACC-OBJ-PLATFORM-IDENTITY",
    targetIdentityFieldId: "ACC-PIDENT-F-ID",
    targetVersionFieldId: "ACC-PIDENT-F-VERSION",
    authorizationReferenceFieldId: "ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-ID",
    authorizationVersionFieldId: "ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-VERSION",
    executionIdentityFieldId: "ACC-PIDENT-F-HIGH-IMPACT-EXECUTION-ID",
    executionVersionFieldId: "ACC-PIDENT-F-HIGH-IMPACT-EXECUTION-VERSION",
    actionCode: "DELETE",
    requiredSuccessState: "DELETED",
    applicability: {
      kind: "FIELD_CODE",
      fieldId: "ACC-PIDENT-F-SUBJECT-KIND",
      requiredCode: "STUDENT",
    },
  },
  {
    contractId: "D037-CONSUME-STUDENT-TRANSFER",
    moduleId: "DGV-001",
    guardActionId: "DGV-ACT-EXECUTE-STUDENT-TRANSFER",
    domainSuccessActionId: "DGV-ACT-COMPLETE-STUDENT-TRANSFER",
    targetObjectId: "DGV-OBJ-TRANSFER-AUTHORIZATION",
    targetIdentityFieldId: "DGV-TRANSFER-F-ID",
    targetVersionFieldId: "DGV-TRANSFER-F-VERSION",
    authorizationReferenceFieldId: "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID",
    authorizationVersionFieldId: "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION",
    executionIdentityFieldId: "DGV-TRANSFER-F-HIGH-IMPACT-EXECUTION-ID",
    executionVersionFieldId: "DGV-TRANSFER-F-HIGH-IMPACT-EXECUTION-VERSION",
    actionCode: "MIGRATE",
    requiredSuccessState: "EXECUTED",
    applicability: { kind: "ALWAYS" },
  },
  {
    contractId: "D037-CONSUME-STUDENT-WORK-PLATFORM-PUBLIC",
    moduleId: "CONTENT-001",
    guardActionId: "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC",
    domainSuccessActionId: "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC",
    targetObjectId: "CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE",
    targetIdentityFieldId: "CONTENT-SCOPE-F-ID",
    targetVersionFieldId: "CONTENT-SCOPE-F-VERSION",
    authorizationReferenceFieldId: "CONTENT-SCOPE-F-HIGH-IMPACT-AUTHORIZATION-ID",
    authorizationVersionFieldId: "CONTENT-SCOPE-F-HIGH-IMPACT-AUTHORIZATION-VERSION",
    executionIdentityFieldId: "CONTENT-SCOPE-F-HIGH-IMPACT-EXECUTION-ID",
    executionVersionFieldId: "CONTENT-SCOPE-F-HIGH-IMPACT-EXECUTION-VERSION",
    actionCode: "PUBLISH_STUDENT_WORK",
    requiredSuccessState: "ACTIVE",
    applicability: {
      kind: "PINNED_SOURCE_GRAPH_FIELD_CODE_AND_PHASE",
      sourceGraphObjectId: "CONTENT-OBJ-MATERIAL-SOURCE-GRAPH",
      sourceGraphRefFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
      sourceGraphVersionFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION",
      sourceGraphSourceKindFieldId: "CONTENT-SOURCE-F-SOURCE-KIND",
      managementScopeMirrorFieldId: "CONTENT-SCOPE-F-SOURCE-KIND",
      comparison: "EXACT_CODE",
      exactVersionRequired: true,
      materialIdentityFallbackAllowed: false,
      requiredCode: "STUDENT_WORK",
      requiredPhaseIds: ["PHASE-3"],
      prohibitedPhaseIds: ["PHASE-1", "PHASE-2"],
    },
  },
]);

export const highImpactAuthorizationEvents = deepFreeze([
  {
    id: HIGH_IMPACT_RESERVATION_REQUEST_EVENT_ID,
    label: "高影响领域动作请求原子占用授权版本",
    definition: "领域动作首次写入前提交精确目标上下文；IAM 以授权 ID、版本和 AUTHORIZED 状态执行原子 CAS，只有同一 reservation key 与目标可重试。",
    producerActionIds: highImpactAuthorizationConsumptionBindings.map(({ guardActionId }) => guardActionId),
    triggeredActionIds: [HIGH_IMPACT_RESERVATION_ACTION_ID],
    highImpactAuthorizationReservationEventContract: {
      contextKeys: structuredClone(HIGH_IMPACT_EVENT_CONTEXT_KEYS.reservation),
      producerBindings: highImpactAuthorizationConsumptionBindings.map((binding) => ({
        actionId: binding.guardActionId,
        actionCode: binding.actionCode,
        targetObjectId: binding.targetObjectId,
        authorizationReferenceFieldId: binding.authorizationReferenceFieldId,
        authorizationVersionFieldId: binding.authorizationVersionFieldId,
        targetIdentityFieldId: binding.targetIdentityFieldId,
        targetVersionFieldId: binding.targetVersionFieldId,
        applicability: structuredClone(binding.applicability),
      })),
      consumerActionId: HIGH_IMPACT_RESERVATION_ACTION_ID,
      compareAndSetBoundary: "BEFORE_FIRST_DOMAIN_WRITE",
      exactAuthorizationVersionRequired: true,
      exactDuplicateEffect: "RETURN_EXISTING_RESERVATION",
      conflictingDuplicateEffect: "FAIL_CLOSED",
    },
  },
  {
    id: HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID,
    label: "高影响领域动作成功并请求唯一消费授权版本",
    definition: "仅在身份彻底注销、学生转学最终完成或第三阶段学生作品平台公开成功与事件 outbox 原子提交后发出；终态事件只能把同一 RESERVED 授权版本转为 EXECUTED。",
    producerActionIds: highImpactAuthorizationConsumptionBindings.map(({ domainSuccessActionId }) => domainSuccessActionId),
    triggeredActionIds: ["IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION"],
    highImpactAuthorizationConsumptionEventContract: {
      contextKeys: structuredClone(HIGH_IMPACT_EVENT_CONTEXT_KEYS.success),
      producerBindings: highImpactAuthorizationConsumptionBindings.map((binding) => ({
        actionId: binding.domainSuccessActionId,
        guardActionId: binding.guardActionId,
        actionCode: binding.actionCode,
        targetObjectId: binding.targetObjectId,
        authorizationReferenceFieldId: binding.authorizationReferenceFieldId,
        authorizationVersionFieldId: binding.authorizationVersionFieldId,
        targetIdentityFieldId: binding.targetIdentityFieldId,
        targetVersionFieldId: binding.targetVersionFieldId,
        reservationIdentityFieldId: RESERVATION_FIELDS.reservationId,
        reservationVersionFieldId: RESERVATION_FIELDS.reservationVersion,
        executionIdentityFieldId: binding.executionIdentityFieldId,
        executionVersionFieldId: binding.executionVersionFieldId,
        requiredSuccessState: binding.requiredSuccessState,
        applicability: structuredClone(binding.applicability),
      })),
      consumerActionId: "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION",
      exactAuthorizationVersionRequired: true,
      reservationStateRequired: "RESERVED",
      oneAuthorizationVersionOneUse: true,
      consumptionKeyFormula: "SHA256(authorization-id|authorization-version|action-code|target-object-id|target-object-ref|target-object-version)",
      exactDuplicateEffect: "RETURN_EXISTING_EXECUTED_AUTHORIZATION",
      conflictingDuplicateEffect: "FAIL_CLOSED",
      domainEventRetryEffect: "RETRY_CONSUMPTION_ONLY_WITHOUT_REEXECUTING_DOMAIN_ACTION",
    },
  },
]);

function list(value) {
  return Array.isArray(value) ? value : [];
}

function requireExactlyOne(values, id, kind) {
  const matches = list(values).filter((value) => value?.id === id);
  if (matches.length !== 1) {
    throw new Error(`${kind} ${id} must exist exactly once before D037 transformation`);
  }
  return matches[0];
}

function addUnique(values, additions) {
  const existing = new Set(values);
  for (const value of additions) {
    if (!existing.has(value)) {
      values.push(value);
      existing.add(value);
    }
  }
}

function field(id, label, {
  dataType = "STRING",
  required = true,
  valueSource = { kind: "USER_INPUT" },
  mutability = "IMMUTABLE",
  validation = "must match the declared data type and authorized object scope",
  historyPolicy = "retain accepted values with actor, source, time, and version provenance",
  ...extras
} = {}) {
  return {
    id,
    label,
    dataType,
    required,
    valueSource,
    mutability,
    visibility: "AUTHORIZED_SCOPE",
    validation,
    historyPolicy,
    ...extras,
  };
}

function addField(object, value) {
  if (list(object.fields).some(({ id }) => id === value.id)) {
    throw new Error(`field ${value.id} already exists before D037 transformation`);
  }
  object.fields.push(value);
}

function addLineage(object, binding) {
  object.lineageBindings = list(object.lineageBindings);
  const duplicate = object.lineageBindings.some((candidate) => (
    candidate.refFieldId === binding.refFieldId
    && candidate.versionFieldId === binding.versionFieldId
    && candidate.targetObjectId === binding.targetObjectId
    && candidate.targetVersionFieldId === binding.targetVersionFieldId
  ));
  if (duplicate) throw new Error(`lineage ${binding.refFieldId} already exists`);
  object.lineageBindings.push(binding);
}

function upgradeVersionPinnedReference({
  object,
  referenceFieldId,
  versionFieldId,
  requiredActionIds,
  stateGuardPolicy,
  required,
}) {
  const reference = requireExactlyOne(object.fields, referenceFieldId, "reference field");
  reference.valueSource = {
    kind: "OBJECT_REF",
    targetObjectId: HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
  };
  reference.referenceIntegrity = "VERSION_PINNED";
  reference.stateGuardPolicy = stateGuardPolicy;
  reference.actionApplicability = { requiredActionIds: [...requiredActionIds] };
  reference.versionBinding = {
    versionFieldId,
    targetVersionFieldId: HIGH_IMPACT_AUTHORIZATION_VERSION_FIELD_ID,
  };
  reference.idempotencyRole = "OBJECT_REF";
  reference.required = required;
  reference.validation = "must resolve the exact registered high-impact authorization object and pinned version; an ordinary or unversioned ID is invalid";

  addField(object, field(versionFieldId, "Pinned High-impact Authorization Version", {
    dataType: "INTEGER",
    required,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }));
  addLineage(object, {
    refFieldId: referenceFieldId,
    versionFieldId,
    targetObjectId: HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
    targetVersionFieldId: HIGH_IMPACT_AUTHORIZATION_VERSION_FIELD_ID,
  });
}

function addVersionPinnedReference({
  object,
  referenceFieldId,
  versionFieldId,
  requiredActionIds = [],
  stateGuardPolicy = "NONE",
  required = false,
}) {
  addField(object, field(referenceFieldId, "Pinned High-impact Authorization", {
    dataType: "ID",
    required,
    valueSource: {
      kind: "OBJECT_REF",
      targetObjectId: HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
    },
    mutability: "IMMUTABLE",
    validation: "must resolve the exact registered high-impact authorization object and pinned version; an ordinary or unversioned ID is invalid",
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy,
    actionApplicability: { requiredActionIds: [...requiredActionIds] },
    versionBinding: {
      versionFieldId,
      targetVersionFieldId: HIGH_IMPACT_AUTHORIZATION_VERSION_FIELD_ID,
    },
    idempotencyRole: "OBJECT_REF",
  }));
  addField(object, field(versionFieldId, "Pinned High-impact Authorization Version", {
    dataType: "INTEGER",
    required,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }));
  addLineage(object, {
    refFieldId: referenceFieldId,
    versionFieldId,
    targetObjectId: HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
    targetVersionFieldId: HIGH_IMPACT_AUTHORIZATION_VERSION_FIELD_ID,
  });
}

function guardFor(binding) {
  return {
    contractId: binding.contractId,
    authorizationObjectId: HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
    referenceFieldId: binding.referenceFieldId,
    versionFieldId: binding.versionFieldId,
    targetVersionFieldId: HIGH_IMPACT_AUTHORIZATION_VERSION_FIELD_ID,
    reservationSourceState: "AUTHORIZED",
    domainWriteRequiredState: "RESERVED",
    reservationActionId: HIGH_IMPACT_RESERVATION_ACTION_ID,
    expiryFieldId: AUTHORIZATION_EXPIRY_FIELD_ID,
    expiryComparison: "SERVER_ACTION_TIME_BEFORE_EXPIRY",
    actionCodeFieldId: AUTHORIZATION_ACTION_FIELD_ID,
    requiredActionCode: binding.requiredActionCode,
    applicability: structuredClone(binding.applicability),
    studentBinding: structuredClone(binding.studentBinding),
    schoolScopeBinding: structuredClone(binding.schoolScopeBinding),
    relationshipScopeBinding: structuredClone(binding.relationshipScopeBinding),
    disputeGuard: {
      authorizationDisputeStatusFieldId: AUTHORIZATION_DISPUTE_STATUS_FIELD_ID,
      forbiddenAuthorizationDisputeStates: ["OPEN", "FROZEN"],
      disputeObjectId: DISPUTE_OBJECT_ID,
      disputeAuthorizationRefFieldId: DISPUTE_AUTHORIZATION_REF_FIELD_ID,
      disputeAuthorizationVersionFieldId: DISPUTE_AUTHORIZATION_VERSION_FIELD_ID,
      disputeStatusFieldId: DISPUTE_STATUS_FIELD_ID,
      forbiddenLinkedDisputeStates: ["OPEN", "FROZEN"],
      linkedDisputeResolution: "QUERY_EXACT_AUTHORIZATION_ID_AND_VERSION",
    },
    ...(binding.targetContext ? { targetContext: structuredClone(binding.targetContext) } : {}),
    failClosed: true,
  };
}

function appendBoundaryScenario(module, action, failure) {
  action.failureResults = list(action.failureResults);
  action.scenarioIds = list(action.scenarioIds);
  if (!action.failureResults.includes(failure.code)) action.failureResults.push(failure.code);
  const scenarioId = `${action.id}-SCN-${failure.code}`;
  if (!action.scenarioIds.includes(scenarioId)) action.scenarioIds.push(scenarioId);
  if (list(module.scenarios).some(({ id }) => id === scenarioId)) return;
  const pageId = list(module.pages).find(({ actionIds }) => list(actionIds).includes(action.id))?.id;
  module.scenarios.push({
    id: scenarioId,
    kind: "BOUNDARY",
    resultCode: failure.code,
    actionId: action.id,
    ...(action.executionMode === "USER_TASK"
      ? { pageId }
      : { trigger: structuredClone(action.trigger) }),
    given: `${failure.code} applies to ${action.label}`,
    when: `the actor requests ${action.label}`,
    failurePredicate: failure.predicate,
    then: {
      expectedData: `${action.label} returns ${failure.code} without any domain write or authorization consumption`,
      expectedState: { mode: "UNCHANGED" },
      expectedPermission: "DENY",
      expectedVisibility: "no student, school, relationship, or material data outside the exact authorized scope",
    },
  });
}

function attachGuard(module, binding) {
  const action = requireExactlyOne(module.actions, binding.actionId, "D037 action");
  addUnique(action.inputFieldIds, [binding.referenceFieldId, binding.versionFieldId]);
  action.highImpactAuthorizationGuard = guardFor(binding);
  for (const failure of HIGH_IMPACT_FAILURES) appendBoundaryScenario(module, action, failure);
  if (binding.standardStateGuard) {
    action.relatedStateGuards = list(action.relatedStateGuards);
    const matchingGuards = action.relatedStateGuards.filter((guard) => (
      guard.refFieldId === binding.referenceFieldId
      && guard.versionFieldId === binding.versionFieldId
      && guard.targetObjectId === HIGH_IMPACT_AUTHORIZATION_OBJECT_ID
    ));
    if (matchingGuards.length === 0) {
      action.relatedStateGuards.push({
        refFieldId: binding.referenceFieldId,
        versionFieldId: binding.versionFieldId,
        targetObjectId: HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
        requiredState: "RESERVED",
      });
    } else {
      for (const guard of matchingGuards) guard.requiredState = "RESERVED";
    }
  }
}

function enhanceIam(module) {
  const authorization = requireExactlyOne(
    module.objects,
    HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
    "D037 authorization object",
  );
  if (!list(authorization.states).includes("RESERVED")) {
    const executedIndex = authorization.states.indexOf("EXECUTED");
    authorization.states.splice(executedIndex < 0 ? authorization.states.length : executedIndex, 0, "RESERVED");
  }
  addField(authorization, field(
    AUTHORIZATION_SCHOOL_SCOPE_FIELD_ID,
    "Exact School Scope for High-impact Action",
    {
      dataType: "JSON",
      validation: "must be a canonical exact set of the schools affected by the requested high-impact action",
    },
  ));
  addField(authorization, field(
    AUTHORIZATION_RELATIONSHIP_SCOPE_FIELD_ID,
    "Exact Relationship Scope for High-impact Action",
    {
      dataType: "JSON",
      validation: "must be a canonical exact set of the school, guardian, identity, enrollment, or content relationships affected by the requested action",
    },
  ));
  authorization.highImpactAuthorizationMatrixContract = {
    contractVersion: 1,
    decisionId: "D037",
    authorizedState: "AUTHORIZED",
    reservedState: "RESERVED",
    studentFieldId: AUTHORIZATION_STUDENT_FIELD_ID,
    actionCodeFieldId: AUTHORIZATION_ACTION_FIELD_ID,
    schoolScopeFieldId: AUTHORIZATION_SCHOOL_SCOPE_FIELD_ID,
    relationshipScopeFieldId: AUTHORIZATION_RELATIONSHIP_SCOPE_FIELD_ID,
    expiryFieldId: AUTHORIZATION_EXPIRY_FIELD_ID,
    disputeStatusFieldId: AUTHORIZATION_DISPUTE_STATUS_FIELD_ID,
    executableDisputeStates: ["NONE", "RESOLVED", "REJECTED"],
    blockedDisputeStates: ["OPEN", "FROZEN"],
    requiredActionCodes: ["DELETE", "MIGRATE", "PUBLISH_STUDENT_WORK"],
    exactVersionRequired: true,
    failClosed: true,
  };

  for (const actionId of [
    "IAM-ACT-REQUEST-HIGH-IMPACT-AUTHORIZATION",
    "IAM-ACT-AUTHORIZE-HIGH-IMPACT-ACTION",
    "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION",
  ]) {
    const action = requireExactlyOne(module.actions, actionId, "D037 IAM action");
    addUnique(action.inputFieldIds, [
      AUTHORIZATION_STUDENT_FIELD_ID,
      AUTHORIZATION_ACTION_FIELD_ID,
      AUTHORIZATION_SCHOOL_SCOPE_FIELD_ID,
      AUTHORIZATION_RELATIONSHIP_SCOPE_FIELD_ID,
      AUTHORIZATION_EXPIRY_FIELD_ID,
    ]);
  }

  const dispute = requireExactlyOne(module.objects, DISPUTE_OBJECT_ID, "D037 dispute object");
  upgradeVersionPinnedReference({
    object: dispute,
    referenceFieldId: DISPUTE_AUTHORIZATION_REF_FIELD_ID,
    versionFieldId: DISPUTE_AUTHORIZATION_VERSION_FIELD_ID,
    requiredActionIds: [
      "IAM-ACT-RAISE-GUARDIAN-DISPUTE",
      "IAM-ACT-FREEZE-GUARDIAN-DISPUTE",
    ],
    stateGuardPolicy: "ALWAYS_REQUIRED",
    required: true,
  });
  for (const actionId of [
    "IAM-ACT-RAISE-GUARDIAN-DISPUTE",
    "IAM-ACT-FREEZE-GUARDIAN-DISPUTE",
  ]) {
    const action = requireExactlyOne(module.actions, actionId, "D037 dispute action");
    addUnique(action.inputFieldIds, [DISPUTE_AUTHORIZATION_VERSION_FIELD_ID]);
    action.relatedStateGuards = list(action.relatedStateGuards);
    action.relatedStateGuards.push({
      refFieldId: DISPUTE_AUTHORIZATION_REF_FIELD_ID,
      versionFieldId: DISPUTE_AUTHORIZATION_VERSION_FIELD_ID,
      targetObjectId: HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
      requiredStates: ["PENDING", "AUTHORIZED"],
    });
  }

  const authorizationPage = requireExactlyOne(
    module.pages,
    "IAM-PAGE-HIGH-IMPACT-AUTHORIZATION",
    "D037 authorization page",
  );
  addUnique(authorizationPage.fieldIds, [
    AUTHORIZATION_SCHOOL_SCOPE_FIELD_ID,
    AUTHORIZATION_RELATIONSHIP_SCOPE_FIELD_ID,
  ]);
  const disputePage = requireExactlyOne(
    module.pages,
    "IAM-PAGE-GUARDIAN-DISPUTE",
    "D037 dispute page",
  );
  addUnique(disputePage.fieldIds, [DISPUTE_AUTHORIZATION_VERSION_FIELD_ID]);
}

function enhanceAccount(module) {
  const identity = requireExactlyOne(
    module.objects,
    "ACC-OBJ-PLATFORM-IDENTITY",
    "D037 identity object",
  );
  const binding = highImpactAuthorizationBindings.find(({ moduleId }) => moduleId === module.id);
  upgradeVersionPinnedReference({
    object: identity,
    referenceFieldId: binding.referenceFieldId,
    versionFieldId: binding.versionFieldId,
    requiredActionIds: [],
    stateGuardPolicy: "NONE",
    required: false,
  });
  const request = requireExactlyOne(
    module.actions,
    "ACC-ACT-REQUEST-IDENTITY-DELETION",
    "D037 identity request action",
  );
  addUnique(request.inputFieldIds, [binding.versionFieldId]);
  addUnique(request.outputFieldIds, [binding.referenceFieldId, binding.versionFieldId]);
  attachGuard(module, binding);
  const page = requireExactlyOne(
    module.pages,
    "ACC-PAGE-PLATFORM-IDENTITY",
    "D037 identity page",
  );
  addUnique(page.fieldIds, [binding.versionFieldId]);
}

function enhanceDataGovernance(module) {
  const transferBinding = highImpactAuthorizationBindings.find(({ moduleId }) => (
    moduleId === module.id
  ));
  const transfer = requireExactlyOne(
    module.objects,
    transferBinding.targetObjectId,
    "D037 transfer object",
  );
  addField(transfer, field(
    "DGV-TRANSFER-F-RELATIONSHIP-SCOPE",
    "Exact Transfer Relationship Scope",
    {
      dataType: "JSON",
      validation: "must canonically identify the current old-school relationship and the validated new-school transfer relationship intent",
    },
  ));
  upgradeVersionPinnedReference({
    object: transfer,
    referenceFieldId: transferBinding.referenceFieldId,
    versionFieldId: transferBinding.versionFieldId,
    requiredActionIds: [
      "DGV-ACT-REQUEST-STUDENT-TRANSFER",
      "DGV-ACT-AUTHORIZE-STUDENT-TRANSFER",
      transferBinding.actionId,
    ],
    stateGuardPolicy: "ALWAYS_REQUIRED",
    required: true,
  });
  for (const actionId of [
    "DGV-ACT-REQUEST-STUDENT-TRANSFER",
    "DGV-ACT-AUTHORIZE-STUDENT-TRANSFER",
    transferBinding.actionId,
  ]) {
    const action = requireExactlyOne(module.actions, actionId, "D037 transfer action");
    addUnique(action.inputFieldIds, [
      "DGV-TRANSFER-F-STUDENT-PROFILE-ID",
      "DGV-TRANSFER-F-FROM-SCHOOL-ID",
      "DGV-TRANSFER-F-TO-SCHOOL-ID",
      "DGV-TRANSFER-F-RELATIONSHIP-SCOPE",
      transferBinding.referenceFieldId,
      transferBinding.versionFieldId,
    ]);
    action.relatedStateGuards = list(action.relatedStateGuards);
    action.relatedStateGuards.push({
      refFieldId: transferBinding.referenceFieldId,
      versionFieldId: transferBinding.versionFieldId,
      targetObjectId: HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
      requiredState: "AUTHORIZED",
    });
  }
  attachGuard(module, transferBinding);

  const deletionCase = requireExactlyOne(
    module.objects,
    "DGV-OBJ-STUDENT-DELETION-CASE",
    "D037 deletion case object",
  );
  addField(deletionCase, field(
    "DGV-DELCASE-F-SCHOOL-SCOPE",
    "Exact School Scope at Student Deletion Request",
    {
      dataType: "JSON",
      validation: "must be the canonical exact school scope resolved for the student deletion case",
    },
  ));
  addField(deletionCase, field(
    "DGV-DELCASE-F-RELATIONSHIP-SCOPE",
    "Exact Relationship Scope at Student Deletion Request",
    {
      dataType: "JSON",
      validation: "must be the canonical exact identity, school, guardian, and enrollment relationship scope resolved for the deletion case",
    },
  ));
  const deletionRequest = requireExactlyOne(
    module.actions,
    "DGV-ACT-REQUEST-STUDENT-DELETION",
    "D037 deletion request action",
  );
  addUnique(deletionRequest.inputFieldIds, [
    "DGV-DELCASE-F-SCHOOL-SCOPE",
    "DGV-DELCASE-F-RELATIONSHIP-SCOPE",
  ]);
  const transferPage = requireExactlyOne(
    module.pages,
    "DGV-PAGE-STUDENT-TRANSFER",
    "D037 transfer page",
  );
  addUnique(transferPage.fieldIds, [
    "DGV-TRANSFER-F-RELATIONSHIP-SCOPE",
    transferBinding.versionFieldId,
  ]);
  const deletionPage = requireExactlyOne(
    module.pages,
    "DGV-PAGE-STUDENT-DELETION-MATRIX",
    "D037 deletion page",
  );
  addUnique(deletionPage.fieldIds, [
    "DGV-DELCASE-F-SCHOOL-SCOPE",
    "DGV-DELCASE-F-RELATIONSHIP-SCOPE",
  ]);
}

function enhanceContent(module) {
  const binding = highImpactAuthorizationBindings.find(({ moduleId }) => moduleId === module.id);
  const scope = requireExactlyOne(module.objects, binding.targetObjectId, "D037 content scope");
  addField(scope, field("CONTENT-SCOPE-F-STUDENT-PROFILE-ID", "Student Profile for Student-work Public Use", {
    dataType: "ID",
    required: false,
    valueSource: { kind: "SYSTEM" },
    validation: "required and system-resolved from the pinned source graph when source kind is STUDENT_WORK",
  }));
  addField(scope, field("CONTENT-SCOPE-F-SCHOOL-SCOPE", "Exact School Scope for Student-work Public Use", {
    dataType: "JSON",
    required: false,
    valueSource: { kind: "SYSTEM" },
    validation: "required and canonically resolved from the source relationships when source kind is STUDENT_WORK",
  }));
  addField(scope, field("CONTENT-SCOPE-F-RELATIONSHIP-SCOPE", "Exact Relationship Scope for Student-work Public Use", {
    dataType: "JSON",
    required: false,
    valueSource: { kind: "SYSTEM" },
    validation: "required and canonically resolved from student, guardian, school, source-right, and content relationships when source kind is STUDENT_WORK",
  }));
  addVersionPinnedReference({
    object: scope,
    referenceFieldId: binding.referenceFieldId,
    versionFieldId: binding.versionFieldId,
    requiredActionIds: [],
    stateGuardPolicy: "NONE",
    required: false,
  });

  const createScope = requireExactlyOne(
    module.actions,
    "CONTENT-ACT-CREATE-MATERIAL-MANAGEMENT-SCOPE",
    "D037 content scope creation action",
  );
  addUnique(createScope.outputFieldIds, [
    "CONTENT-SCOPE-F-STUDENT-PROFILE-ID",
    "CONTENT-SCOPE-F-SCHOOL-SCOPE",
    "CONTENT-SCOPE-F-RELATIONSHIP-SCOPE",
  ]);
  const promote = requireExactlyOne(module.actions, binding.actionId, "D037 content promotion action");
  promote.label = "Promote a Fully Bound Material to the Platform Public Layer";
  addUnique(promote.inputFieldIds, [
    "CONTENT-SCOPE-F-STUDENT-PROFILE-ID",
    "CONTENT-SCOPE-F-SCHOOL-SCOPE",
    "CONTENT-SCOPE-F-RELATIONSHIP-SCOPE",
    binding.referenceFieldId,
    binding.versionFieldId,
  ]);
  addUnique(promote.outputFieldIds, [binding.referenceFieldId, binding.versionFieldId]);
  attachGuard(module, binding);

  const page = requireExactlyOne(
    module.pages,
    "CONTENT-PAGE-MATERIAL-RIGHTS",
    "D037 material rights page",
  );
  addUnique(page.fieldIds, [
    "CONTENT-SCOPE-F-STUDENT-PROFILE-ID",
    "CONTENT-SCOPE-F-SCHOOL-SCOPE",
    "CONTENT-SCOPE-F-RELATIONSHIP-SCOPE",
    binding.referenceFieldId,
    binding.versionFieldId,
  ]);
}

const ENHANCER_BY_MODULE_ID = new Map([
  ["IAM-001", enhanceIam],
  ["ACC-001", enhanceAccount],
  ["DGV-001", enhanceDataGovernance],
  ["CONTENT-001", enhanceContent],
]);

export function applyHighImpactAuthorizationContracts(sourceModules) {
  if (!Array.isArray(sourceModules)) {
    throw new Error("D037 high-impact authorization transformation requires a module array");
  }
  for (const moduleId of ENHANCER_BY_MODULE_ID.keys()) {
    requireExactlyOne(sourceModules, moduleId, "D037 owner module");
  }
  return sourceModules.map((sourceModule) => {
    const module = structuredClone(sourceModule);
    const enhance = ENHANCER_BY_MODULE_ID.get(module.id);
    if (enhance) enhance(module);
    return module;
  });
}

const DOMAIN_EXECUTION_FIELD_LABELS = Object.freeze({
  executionId: "High-impact Domain Execution ID",
  executionVersion: "High-impact Domain Execution Version",
});

function addFieldIfMissing(object, value) {
  if (!list(object.fields).some(({ id }) => id === value.id)) object.fields.push(value);
}

function addConsumptionFieldsToAuthorization(authorization) {
  addFieldIfMissing(authorization, field(CONSUMPTION_FIELDS.key, "Unique High-impact Authorization Consumption Key", {
    dataType: "STRING",
    required: {
      description: "required once the authorization version is consumed or reserved for a domain execution",
      whenStates: ["RESERVED", "EXECUTED"],
      whenActionIds: [HIGH_IMPACT_RESERVATION_ACTION_ID, "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION"],
    },
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    validation: "must be the canonical unique SHA256 consumption key for one authorization ID and version, action code, target and execution version",
  }));
  addFieldIfMissing(authorization, field(CONSUMPTION_FIELDS.consumedAction, "Reserved Domain Action ID", {
    dataType: "STRING",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    validation: "must equal the registered domain action whose exact target reserved this authorization version",
  }));
  addFieldIfMissing(authorization, field(CONSUMPTION_FIELDS.targetRef, "Consumed Domain Target Reference", {
    dataType: "ID",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }));
  addFieldIfMissing(authorization, field(CONSUMPTION_FIELDS.targetVersion, "Consumed Domain Target Version", {
    dataType: "INTEGER",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }));
  addFieldIfMissing(authorization, field(RESERVATION_FIELDS.reservationId, "Authoritative Reservation ID", {
    dataType: "ID",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    validation: "must be generated by the authoritative IAM reservation CAS and remain stable for exact retries",
  }));
  addFieldIfMissing(authorization, field(RESERVATION_FIELDS.reservationVersion, "Authoritative Reservation Version", {
    dataType: "INTEGER",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }));
  addFieldIfMissing(authorization, field(RESERVATION_FIELDS.reservedAt, "High-impact Authorization Reserved At", {
    dataType: "DATETIME",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }));
  addFieldIfMissing(authorization, field(CONSUMPTION_FIELDS.executionId, "Consumed Domain Execution ID", {
    dataType: "ID",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }));
  addFieldIfMissing(authorization, field(CONSUMPTION_FIELDS.executionVersion, "Consumed Domain Execution Version", {
    dataType: "INTEGER",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }));
  addFieldIfMissing(authorization, field(CONSUMPTION_FIELDS.consumedAt, "High-impact Authorization Consumed At", {
    dataType: "DATETIME",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }));
  authorization.highImpactAuthorizationMatrixContract = {
    ...authorization.highImpactAuthorizationMatrixContract,
    reservationContract: {
      eventId: HIGH_IMPACT_RESERVATION_REQUEST_EVENT_ID,
      reservationActionId: HIGH_IMPACT_RESERVATION_ACTION_ID,
      authoritativeObjectId: HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
      reservationKeyFieldId: CONSUMPTION_FIELDS.key,
      reservedActionFieldId: CONSUMPTION_FIELDS.consumedAction,
      reservedTargetRefFieldId: CONSUMPTION_FIELDS.targetRef,
      reservedTargetVersionFieldId: CONSUMPTION_FIELDS.targetVersion,
      reservationIdentityFieldId: RESERVATION_FIELDS.reservationId,
      reservationVersionFieldId: RESERVATION_FIELDS.reservationVersion,
      reservedAtFieldId: RESERVATION_FIELDS.reservedAt,
      oneUseOnly: true,
      firstReservationStateTransition: { from: "AUTHORIZED", to: "RESERVED" },
      exactDuplicateEffect: "RETURN_EXISTING_RESERVATION",
      conflictingTargetEffect: "FAIL_CLOSED",
      sameReservationTargetRetryAllowed: true,
      authorizationVersionCompareAndSetRequired: true,
      domainWriteBeforeReservationCommitAllowed: false,
      reservationKeyFormula: "SHA256(authorization-id|authorization-version|action-code|target-object-id|target-object-ref|target-object-version)",
    },
    consumptionContract: {
      eventId: HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID,
      consumerActionId: "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION",
      consumptionKeyFieldId: CONSUMPTION_FIELDS.key,
      consumedActionFieldId: CONSUMPTION_FIELDS.consumedAction,
      consumedTargetRefFieldId: CONSUMPTION_FIELDS.targetRef,
      consumedTargetVersionFieldId: CONSUMPTION_FIELDS.targetVersion,
      consumedExecutionIdFieldId: CONSUMPTION_FIELDS.executionId,
      consumedExecutionVersionFieldId: CONSUMPTION_FIELDS.executionVersion,
      consumedAtFieldId: CONSUMPTION_FIELDS.consumedAt,
      reservationIdentityFieldId: RESERVATION_FIELDS.reservationId,
      reservationVersionFieldId: RESERVATION_FIELDS.reservationVersion,
      oneUseOnly: true,
      authorizationStateTransition: { from: "RESERVED", to: "EXECUTED" },
      consumptionKeyFormula: "SHA256(authorization-id|authorization-version|action-code|target-object-id|target-object-ref|target-object-version)",
      exactDuplicateEffect: "RETURN_EXISTING_EXECUTED_AUTHORIZATION",
      conflictingDuplicateEffect: "FAIL_CLOSED",
      domainSuccessRequired: true,
      domainFailureBeforeEventEffect: "KEEP_RESERVED_FOR_SAME_TARGET_RETRY_ONLY",
      eventOutboxFailureEffect: "KEEP_DOMAIN_SUCCESS_UNCOMMITTED",
      consumerFailureEffect: "RETRY_SAME_EVENT_WITHOUT_REEXECUTING_DOMAIN_ACTION",
      partialAuthorizationAndConsumptionWriteAllowed: false,
    },
  };
}

function appendSystemEventScenario(module, action, resultCode, predicate, expectedData) {
  action.failureResults = list(action.failureResults);
  action.scenarioIds = list(action.scenarioIds);
  if (!action.failureResults.includes(resultCode)) action.failureResults.push(resultCode);
  const scenarioId = `${action.id}-SCN-${resultCode}`;
  if (!action.scenarioIds.includes(scenarioId)) action.scenarioIds.push(scenarioId);
  if (list(module.scenarios).some(({ id }) => id === scenarioId)) return;
  const pageId = list(module.pages).find(({ actionIds }) => list(actionIds).includes(action.id))?.id;
  module.scenarios.push({
    id: scenarioId,
    kind: "BOUNDARY",
    resultCode,
    actionId: action.id,
    ...(action.executionMode === "USER_TASK"
      ? { pageId }
      : { trigger: structuredClone(action.trigger) }),
    given: `${resultCode} applies to ${action.label}`,
    when: `the system consumes ${action.label}`,
    failurePredicate: predicate,
    then: {
      expectedData,
      expectedState: { mode: "UNCHANGED" },
      expectedPermission: "DENY",
      expectedVisibility: "no additional domain write and no authorization reuse",
    },
  });
}

function addDomainExecutionFields(module, binding) {
  const target = requireExactlyOne(module.objects, binding.targetObjectId, "D037 consumption target object");
  addFieldIfMissing(target, field(binding.executionIdentityFieldId, DOMAIN_EXECUTION_FIELD_LABELS.executionId, {
    dataType: "ID",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }));
  addFieldIfMissing(target, field(binding.executionVersionFieldId, DOMAIN_EXECUTION_FIELD_LABELS.executionVersion, {
    dataType: "INTEGER",
    required: false,
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
  }));
  const domainAction = requireExactlyOne(module.actions, binding.domainSuccessActionId, "D037 domain success action");
  const authorizationReference = requireExactlyOne(
    target.fields,
    binding.authorizationReferenceFieldId,
    "D037 domain authorization reference field",
  );
  addUnique(domainAction.inputFieldIds, [
    binding.authorizationReferenceFieldId,
    binding.authorizationVersionFieldId,
  ]);
  addUnique(domainAction.outputFieldIds, [
    binding.executionIdentityFieldId,
    binding.executionVersionFieldId,
  ]);
  if (authorizationReference.stateGuardPolicy !== "NONE") {
    authorizationReference.actionApplicability = authorizationReference.actionApplicability ?? {
      requiredActionIds: [],
    };
    addUnique(
      authorizationReference.actionApplicability.requiredActionIds,
      [binding.domainSuccessActionId],
    );
    domainAction.relatedStateGuards = list(domainAction.relatedStateGuards);
    const matchingGuards = domainAction.relatedStateGuards.filter((guard) => (
      guard.refFieldId === binding.authorizationReferenceFieldId
      && guard.versionFieldId === binding.authorizationVersionFieldId
      && guard.targetObjectId === HIGH_IMPACT_AUTHORIZATION_OBJECT_ID
    ));
    if (matchingGuards.length === 0) {
      domainAction.relatedStateGuards.push({
        refFieldId: binding.authorizationReferenceFieldId,
        versionFieldId: binding.authorizationVersionFieldId,
        targetObjectId: HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
        requiredState: "RESERVED",
      });
    } else {
      for (const guard of matchingGuards) guard.requiredState = "RESERVED";
    }
  }
  domainAction.producedEventIds = list(domainAction.producedEventIds);
  addUnique(domainAction.producedEventIds, [HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID]);
  domainAction.highImpactAuthorizationConsumptionProducer = {
    contractId: binding.contractId,
    eventId: HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID,
    guardActionId: binding.guardActionId,
    authorizationReferenceFieldId: binding.authorizationReferenceFieldId,
    authorizationVersionFieldId: binding.authorizationVersionFieldId,
    actionCode: binding.actionCode,
    targetObjectId: binding.targetObjectId,
    targetIdentityFieldId: binding.targetIdentityFieldId,
    targetVersionFieldId: binding.targetVersionFieldId,
    executionIdentityFieldId: binding.executionIdentityFieldId,
    executionVersionFieldId: binding.executionVersionFieldId,
    requiredSuccessState: binding.requiredSuccessState,
    applicability: structuredClone(binding.applicability),
    consumptionKeyFormula: "SHA256(authorization-id|authorization-version|action-code|target-object-id|target-object-ref|target-object-version)",
    reservationIdentityFieldId: RESERVATION_FIELDS.reservationId,
    reservationVersionFieldId: RESERVATION_FIELDS.reservationVersion,
    requiredAuthorizationState: "RESERVED",
    oneUseOnly: true,
    terminalDomainWriteAndEventOutboxAtomic: true,
    eventOutboxFailureEffect: "KEEP_DOMAIN_SUCCESS_UNCOMMITTED",
    duplicateDomainExecutionEffect: "RETURN_EXISTING_DOMAIN_RESULT_WITHOUT_SECOND_WRITE",
    conflictingExecutionEffect: "FAIL_CLOSED",
  };
  appendSystemEventScenario(
    module,
    domainAction,
    "HIGH_IMPACT_CONSUMPTION_EVENT_OUTBOX_FAILED",
    "the exact domain success cannot commit unless the versioned high-impact success event outbox commits atomically",
    "the domain action remains unchanged and no high-impact authorization is consumed",
  );
  const guardAction = requireExactlyOne(module.actions, binding.guardActionId, "D037 domain guard action");
  addUnique(guardAction.outputFieldIds, [
    binding.executionIdentityFieldId,
    binding.executionVersionFieldId,
  ]);
  guardAction.producedEventIds = list(guardAction.producedEventIds);
  addUnique(guardAction.producedEventIds, [HIGH_IMPACT_RESERVATION_REQUEST_EVENT_ID]);
  guardAction.relatedStateGuards = list(guardAction.relatedStateGuards);
  const guardActionAuthorizationGuards = guardAction.relatedStateGuards.filter((guard) => (
    guard.refFieldId === binding.authorizationReferenceFieldId
    && guard.versionFieldId === binding.authorizationVersionFieldId
    && guard.targetObjectId === HIGH_IMPACT_AUTHORIZATION_OBJECT_ID
  ));
  for (const guard of guardActionAuthorizationGuards) guard.requiredState = "RESERVED";
  guardAction.highImpactAuthorizationConsumptionReservation = {
    contractId: binding.contractId,
    reservationRequestEventId: HIGH_IMPACT_RESERVATION_REQUEST_EVENT_ID,
    reservationActionId: HIGH_IMPACT_RESERVATION_ACTION_ID,
    terminalSuccessEventId: HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID,
    authorizationReferenceFieldId: binding.authorizationReferenceFieldId,
    authorizationVersionFieldId: binding.authorizationVersionFieldId,
    actionCode: binding.actionCode,
    targetObjectId: binding.targetObjectId,
    targetIdentityFieldId: binding.targetIdentityFieldId,
    targetVersionFieldId: binding.targetVersionFieldId,
    domainExecutionIdentityFieldId: binding.executionIdentityFieldId,
    domainExecutionVersionFieldId: binding.executionVersionFieldId,
    consumptionKeyFormula: "SHA256(authorization-id|authorization-version|action-code|target-object-id|target-object-ref|target-object-version)",
    reservationBoundary: "BEFORE_FIRST_DOMAIN_WRITE",
    authorizationCompareAndSet: { from: "AUTHORIZED", to: "RESERVED", exactPinnedVersionRequired: true },
    reservationCommitAcknowledgementRequired: true,
    domainWriteRequiredAuthorizationState: "RESERVED",
    oneUseOnly: true,
    duplicateReservationEffect: "RETURN_EXISTING_RESERVATION_FOR_SAME_KEY_AND_TARGET",
    conflictingReservationEffect: "FAIL_CLOSED",
    domainFailureEffect: "KEEP_RESERVED_FOR_SAME_TARGET_RETRY_ONLY",
    authorizationReusableForDifferentTargetBeforeDomainSuccessEvent: false,
  };
}

function addReservationAction(module, authorization) {
  if (list(module.actions).some(({ id }) => id === HIGH_IMPACT_RESERVATION_ACTION_ID)) {
    throw new Error(`${HIGH_IMPACT_RESERVATION_ACTION_ID} already exists before D037 reservation transformation`);
  }
  const trigger = { kind: "EVENT", eventId: HIGH_IMPACT_RESERVATION_REQUEST_EVENT_ID };
  const failureResults = [
    "PERMISSION_DENIED",
    "VALIDATION_FAILED",
    "VERSION_CONFLICT",
    "AUDIT_FAILED",
    "AUTHORIZATION_NOT_AUTHORIZED",
    "AUTHORIZATION_EXPIRED",
    "AUTHORIZATION_DISPUTED",
    "RESERVATION_CONTEXT_MISMATCH",
    "RESERVATION_TARGET_CONFLICT",
  ];
  const reservationContract = {
    ...authorization.highImpactAuthorizationMatrixContract.reservationContract,
    compareAndSet: {
      objectId: HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
      versionFieldId: HIGH_IMPACT_AUTHORIZATION_VERSION_FIELD_ID,
      statusFieldId: "IAM-HIAUTH-F-STATUS",
      firstReservationExpectedState: "AUTHORIZED",
      firstReservationNextState: "RESERVED",
      atomicWithReservationFields: true,
      exactDuplicateRequiredFields: [
        CONSUMPTION_FIELDS.key,
        CONSUMPTION_FIELDS.consumedAction,
        CONSUMPTION_FIELDS.targetRef,
        CONSUMPTION_FIELDS.targetVersion,
      ],
      exactDuplicateEffect: "RETURN_EXISTING_RESERVATION",
      conflictingTargetEffect: "FAIL_CLOSED",
    },
    reservationCommitAcknowledgementRequiredBeforeDomainWrite: true,
  };
  const action = {
    id: HIGH_IMPACT_RESERVATION_ACTION_ID,
    label: "Atomically Reserve One High-impact Authorization Version",
    targetObjectId: HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
    inputFieldIds: [
      "IAM-HIAUTH-F-ID",
      HIGH_IMPACT_AUTHORIZATION_VERSION_FIELD_ID,
      AUTHORIZATION_ACTION_FIELD_ID,
      AUTHORIZATION_EXPIRY_FIELD_ID,
      AUTHORIZATION_DISPUTE_STATUS_FIELD_ID,
      AUTHORIZATION_SCHOOL_SCOPE_FIELD_ID,
      AUTHORIZATION_RELATIONSHIP_SCOPE_FIELD_ID,
      CONSUMPTION_FIELDS.key,
      CONSUMPTION_FIELDS.consumedAction,
      CONSUMPTION_FIELDS.targetRef,
      CONSUMPTION_FIELDS.targetVersion,
    ],
    outputFieldIds: [
      CONSUMPTION_FIELDS.key,
      CONSUMPTION_FIELDS.consumedAction,
      CONSUMPTION_FIELDS.targetRef,
      CONSUMPTION_FIELDS.targetVersion,
      RESERVATION_FIELDS.reservationId,
      RESERVATION_FIELDS.reservationVersion,
      RESERVATION_FIELDS.reservedAt,
      "IAM-HIAUTH-F-STATUS",
      HIGH_IMPACT_AUTHORIZATION_VERSION_FIELD_ID,
    ],
    transition: { from: ["AUTHORIZED", "RESERVED"], to: "RESERVED" },
    operationKind: "UPDATE",
    writes: true,
    risk: "HIGH",
    executionMode: "SYSTEM_EVENT",
    trigger,
    permissions: [
      { effect: "ALLOW", actorRef: "SYSTEM", condition: "the exact request context atomically compare-and-sets one AUTHORIZED version to RESERVED before any domain write" },
      { effect: "DENY", roleRef: "ROLE-SCHOOL-ADMIN", condition: "school roles cannot manually reserve or reuse a minor high-impact authorization" },
      { effect: "DENY", roleRef: "ROLE-PLATFORM-OPS", condition: "platform operations cannot bypass the exact version and target reservation CAS" },
    ],
    scenarioIds: [
      `${HIGH_IMPACT_RESERVATION_ACTION_ID}-SCN-SUCCESS`,
      ...failureResults.map((resultCode) => `${HIGH_IMPACT_RESERVATION_ACTION_ID}-SCN-${resultCode}`),
    ],
    idempotencyKey: `${HIGH_IMPACT_RESERVATION_ACTION_ID}:authorization-id:authorization-version:consumption-key:target-ref:target-version`,
    auditMode: "REQUIRED",
    failureResults,
    highImpactAuthorizationReservationContract: reservationContract,
  };
  module.actions.push(action);
  module.scenarios.push({
    id: `${action.id}-SCN-SUCCESS`,
    kind: "SUCCESS",
    actionId: action.id,
    trigger,
    given: "the exact authorization version is AUTHORIZED or already RESERVED for the same key and target",
    when: "the system atomically reserves the high-impact authorization version",
    then: {
      expectedData: "the first request commits AUTHORIZED to RESERVED with immutable reservation fields; an exact retry returns that reservation",
      expectedState: { mode: "STATE", value: "RESERVED" },
      expectedPermission: "ALLOW",
      expectedVisibility: "the exact authorization and reservation context only",
    },
  });
  for (const resultCode of failureResults) {
    module.scenarios.push({
      id: `${action.id}-SCN-${resultCode}`,
      kind: ["RESERVATION_CONTEXT_MISMATCH", "RESERVATION_TARGET_CONFLICT"].includes(resultCode)
        ? "BOUNDARY"
        : "FAILURE",
      resultCode,
      actionId: action.id,
      trigger,
      given: `${resultCode} prevents the reservation compare-and-set`,
      when: "the system attempts to reserve the high-impact authorization version",
      failurePredicate: resultCode === "RESERVATION_TARGET_CONFLICT"
        ? "the exact authorization version is RESERVED or EXECUTED for a different reservation key action target reference or target version"
        : `${resultCode} applies to the exact reservation request context`,
      then: {
        expectedData: "no reservation field or authorization state changes and no domain write may start",
        expectedState: { mode: "UNCHANGED" },
        expectedPermission: "DENY",
        expectedVisibility: "no data outside the exact authorization and target scope",
      },
    });
  }
}

function enhanceConsumptionIam(module) {
  const authorization = requireExactlyOne(module.objects, HIGH_IMPACT_AUTHORIZATION_OBJECT_ID, "D037 consumption authorization object");
  addConsumptionFieldsToAuthorization(authorization);
  addReservationAction(module, authorization);
  const execute = requireExactlyOne(module.actions, "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION", "D037 consumption action");
  execute.executionMode = "SYSTEM_EVENT";
  execute.trigger = { kind: "EVENT", eventId: HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID };
  delete execute.clients;
  execute.permissions = [
    { effect: "ALLOW", actorRef: "SYSTEM", condition: "the exact domain-success event proves the same RESERVED authorization version reservation key target and terminal domain execution" },
    { effect: "DENY", roleRef: "ROLE-SCHOOL-ADMIN", condition: "a school cannot manually consume or replay a minor high-impact authorization" },
    { effect: "DENY", roleRef: "ROLE-PLATFORM-OPS", condition: "platform operations cannot consume or replay a high-impact authorization outside the exact event contract" },
  ];
  execute.inputFieldIds = [
    ...new Set([
      ...execute.inputFieldIds,
      AUTHORIZATION_STUDENT_FIELD_ID,
      AUTHORIZATION_ACTION_FIELD_ID,
      AUTHORIZATION_EXPIRY_FIELD_ID,
      AUTHORIZATION_DISPUTE_STATUS_FIELD_ID,
      CONSUMPTION_FIELDS.key,
      CONSUMPTION_FIELDS.consumedAction,
      CONSUMPTION_FIELDS.targetRef,
      CONSUMPTION_FIELDS.targetVersion,
      RESERVATION_FIELDS.reservationId,
      RESERVATION_FIELDS.reservationVersion,
      CONSUMPTION_FIELDS.executionId,
      CONSUMPTION_FIELDS.executionVersion,
    ]),
  ];
  execute.outputFieldIds = [
    ...new Set([
      ...execute.outputFieldIds,
      CONSUMPTION_FIELDS.key,
      CONSUMPTION_FIELDS.consumedAction,
      CONSUMPTION_FIELDS.targetRef,
      CONSUMPTION_FIELDS.targetVersion,
      RESERVATION_FIELDS.reservationId,
      RESERVATION_FIELDS.reservationVersion,
      CONSUMPTION_FIELDS.executionId,
      CONSUMPTION_FIELDS.executionVersion,
      CONSUMPTION_FIELDS.consumedAt,
      "IAM-HIAUTH-F-STATUS",
      "IAM-HIAUTH-F-VERSION",
    ]),
  ];
  execute.transition = { from: "RESERVED", to: "EXECUTED" };
  execute.idempotencyKey = "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION:authorization-id:authorization-version:consumption-key:domain-execution-id:domain-execution-version";
  execute.highImpactAuthorizationConsumptionContract = authorization.highImpactAuthorizationMatrixContract.consumptionContract;
  execute.producedEventIds = list(execute.producedEventIds).filter((eventId) => (
    eventId !== "EVT-HIGH-IMPACT-AUTHORIZATION-CONSUMED"
  ));
  for (const scenario of list(module.scenarios).filter(({ actionId }) => actionId === execute.id)) {
    delete scenario.pageId;
    scenario.trigger = { kind: "EVENT", eventId: HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID };
    scenario.when = `the system consumes ${execute.label}`;
  }
  for (const [resultCode, predicate] of [
    ["AUTHORIZATION_VERSION_ALREADY_CONSUMED", "the exact authorization version already has a terminal consumption key"],
    ["CONSUMPTION_KEY_CONFLICT", "the same consumption key resolves to a different action, target, or execution version"],
    ["DOMAIN_ACTION_CODE_MISMATCH", "the event action code differs from the immutable authorization action code"],
    ["DOMAIN_TARGET_VERSION_MISMATCH", "the event target identity or target version differs from the original domain action"],
    ["DOMAIN_EXECUTION_VERSION_MISMATCH", "the event execution ID or execution version is not the exact terminal domain result"],
    ["AUTHORIZATION_EXPIRED", "the server event-consumption time is not before the authorization expiry"],
    ["AUTHORIZATION_DISPUTED", "the authorization or a linked guardian dispute is OPEN or FROZEN"],
  ]) {
    appendSystemEventScenario(
      module,
      execute,
      resultCode,
      predicate,
      "the authorization remains unchanged and the domain result is not replayed",
    );
  }
  const page = requireExactlyOne(module.pages, "IAM-PAGE-HIGH-IMPACT-AUTHORIZATION", "D037 consumption page");
  page.actionIds = list(page.actionIds).filter((actionId) => actionId !== execute.id);
  addUnique(page.fieldIds, [
    ...Object.values(CONSUMPTION_FIELDS),
    ...Object.values(RESERVATION_FIELDS),
  ]);
}

export function applyHighImpactAuthorizationConsumptionContracts(sourceModules) {
  if (!Array.isArray(sourceModules)) {
    throw new Error("D037 high-impact authorization consumption transformation requires a module array");
  }
  for (const moduleId of ["IAM-001", "ACC-001", "DGV-001", "CONTENT-001"]) {
    requireExactlyOne(sourceModules, moduleId, "D037 consumption owner module");
  }
  const transformed = sourceModules.map((sourceModule) => structuredClone(sourceModule));
  const iam = transformed.find(({ id }) => id === "IAM-001");
  enhanceConsumptionIam(iam);
  for (const binding of highImpactAuthorizationConsumptionBindings) {
    const module = transformed.find(({ id }) => id === binding.moduleId);
    addDomainExecutionFields(module, binding);
  }
  return transformed;
}
