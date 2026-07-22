import { buildModelIndex } from "./model-validator.mjs";
import {
  CONSUMPTION_FIELDS,
  HIGH_IMPACT_EVENT_CONTEXT_KEYS,
  HIGH_IMPACT_RESERVATION_ACTION_ID,
  HIGH_IMPACT_RESERVATION_REQUEST_EVENT_ID,
  RESERVATION_FIELDS,
} from "../facts/high-impact-authorization.mjs";
import {
  HIGH_IMPACT_AUTHORIZATION_OBJECT_ID,
  HIGH_IMPACT_AUTHORIZATION_VERSION_FIELD_ID,
  HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID,
  highImpactAuthorizationBindings,
  highImpactAuthorizationConsumptionBindings,
} from "../facts/high-impact-authorization.mjs";

const CODE = "INVALID_D037_HIGH_IMPACT_AUTHORIZATION";
const AUTHORIZATION_STUDENT_FIELD_ID = "IAM-HIAUTH-F-STUDENT-PROFILE-ID";
const AUTHORIZATION_ACTION_FIELD_ID = "IAM-HIAUTH-F-ACTION";
const AUTHORIZATION_EXPIRY_FIELD_ID = "IAM-HIAUTH-F-EXPIRY";
const AUTHORIZATION_DISPUTE_STATUS_FIELD_ID = "IAM-HIAUTH-F-DISPUTE-STATUS";
const AUTHORIZATION_SCHOOL_SCOPE_FIELD_ID = "IAM-HIAUTH-F-SCHOOL-SCOPE";
const AUTHORIZATION_RELATIONSHIP_SCOPE_FIELD_ID = "IAM-HIAUTH-F-RELATIONSHIP-SCOPE";
const DISPUTE_OBJECT_ID = "IAM-OBJ-GUARDIAN-DISPUTE";
const DISPUTE_REF_FIELD_ID = "IAM-DISPUTE-F-HIGH-IMPACT-AUTHORIZATION-ID";
const DISPUTE_VERSION_FIELD_ID = "IAM-DISPUTE-F-HIGH-IMPACT-AUTHORIZATION-VERSION";
const DISPUTE_STATUS_FIELD_ID = "IAM-DISPUTE-F-STATUS";
const REQUIRED_FAILURE_CODES = [
  "HIGH_IMPACT_AUTHORIZATION_INVALID_REFERENCE",
  "HIGH_IMPACT_AUTHORIZATION_NOT_AUTHORIZED",
  "HIGH_IMPACT_AUTHORIZATION_EXPIRED",
  "HIGH_IMPACT_AUTHORIZATION_STUDENT_MISMATCH",
  "HIGH_IMPACT_AUTHORIZATION_ACTION_MISMATCH",
  "HIGH_IMPACT_AUTHORIZATION_SCOPE_MISMATCH",
  "HIGH_IMPACT_AUTHORIZATION_DISPUTED",
];

function list(value) {
  return Array.isArray(value) ? value : [];
}

function sameSet(left, right) {
  const a = [...new Set(list(left))].toSorted();
  const b = [...new Set(list(right))].toSorted();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function sameRecord(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function field(object, fieldId) {
  return list(object?.fields).find(({ id }) => id === fieldId);
}

function action(index, actionId) {
  return index.actionById.get(actionId)?.value;
}

function object(index, objectId) {
  return index.objectById.get(objectId)?.value;
}

function fail(errors, detail) {
  errors.push(`${CODE} ${detail}`);
}

function exactLineage(objectValue, referenceFieldId, versionFieldId) {
  return list(objectValue?.lineageBindings).some((binding) => (
    binding.refFieldId === referenceFieldId
    && binding.versionFieldId === versionFieldId
    && binding.targetObjectId === HIGH_IMPACT_AUTHORIZATION_OBJECT_ID
    && binding.targetVersionFieldId === HIGH_IMPACT_AUTHORIZATION_VERSION_FIELD_ID
  ));
}

function exactReference(index, objectValue, referenceFieldId, versionFieldId, requiredActionIds, stateGuardPolicy) {
  const reference = field(objectValue, referenceFieldId);
  const version = field(objectValue, versionFieldId);
  return Boolean(
    reference
    && version
    && reference.dataType === "ID"
    && reference.valueSource?.kind === "OBJECT_REF"
    && reference.valueSource.targetObjectId === HIGH_IMPACT_AUTHORIZATION_OBJECT_ID
    && reference.referenceIntegrity === "VERSION_PINNED"
    && reference.versionBinding?.versionFieldId === versionFieldId
    && reference.versionBinding?.targetVersionFieldId === HIGH_IMPACT_AUTHORIZATION_VERSION_FIELD_ID
    && reference.stateGuardPolicy === stateGuardPolicy
    && sameSet(reference.actionApplicability?.requiredActionIds, requiredActionIds)
    && version.dataType === "INTEGER"
    && version.valueSource?.kind === "SYSTEM"
    && exactLineage(objectValue, referenceFieldId, versionFieldId)
  );
}

function hasSingleGuard(actionValue, binding, requiredState) {
  return hasSingleReferenceGuard(
    actionValue,
    binding.referenceFieldId,
    binding.versionFieldId,
    requiredState,
  );
}

function hasSingleReferenceGuard(actionValue, referenceFieldId, versionFieldId, requiredState) {
  return list(actionValue?.relatedStateGuards).filter((guard) => (
    guard.refFieldId === referenceFieldId
    && guard.versionFieldId === versionFieldId
    && guard.targetObjectId === HIGH_IMPACT_AUTHORIZATION_OBJECT_ID
    && guard.requiredState === requiredState
  )).length === 1;
}

function exactScenarioExecutionBinding(module, actionValue, scenario) {
  const hasPageId = Object.hasOwn(scenario ?? {}, "pageId");
  const hasTrigger = Object.hasOwn(scenario ?? {}, "trigger");
  if (actionValue?.executionMode === "USER_TASK") {
    const pageId = list(module?.pages).find(({ actionIds }) => (
      list(actionIds).includes(actionValue.id)
    ))?.id;
    return hasPageId && !hasTrigger && scenario.pageId === pageId;
  }
  return !hasPageId && hasTrigger && sameRecord(scenario.trigger, actionValue?.trigger);
}

function expectedGuard(binding) {
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
    applicability: binding.applicability,
    studentBinding: binding.studentBinding,
    schoolScopeBinding: binding.schoolScopeBinding,
    relationshipScopeBinding: binding.relationshipScopeBinding,
    disputeGuard: {
      authorizationDisputeStatusFieldId: AUTHORIZATION_DISPUTE_STATUS_FIELD_ID,
      forbiddenAuthorizationDisputeStates: ["OPEN", "FROZEN"],
      disputeObjectId: DISPUTE_OBJECT_ID,
      disputeAuthorizationRefFieldId: DISPUTE_REF_FIELD_ID,
      disputeAuthorizationVersionFieldId: DISPUTE_VERSION_FIELD_ID,
      disputeStatusFieldId: DISPUTE_STATUS_FIELD_ID,
      forbiddenLinkedDisputeStates: ["OPEN", "FROZEN"],
      linkedDisputeResolution: "QUERY_EXACT_AUTHORIZATION_ID_AND_VERSION",
    },
    ...(binding.targetContext ? { targetContext: binding.targetContext } : {}),
    failClosed: true,
  };
}

function validateDisputeContract(index, errors) {
  const dispute = object(index, DISPUTE_OBJECT_ID);
  const ref = field(dispute, DISPUTE_REF_FIELD_ID);
  const version = field(dispute, DISPUTE_VERSION_FIELD_ID);
  const raise = action(index, "IAM-ACT-RAISE-GUARDIAN-DISPUTE");
  const freeze = action(index, "IAM-ACT-FREEZE-GUARDIAN-DISPUTE");
  if (
    !dispute
    || !exactReference(index, dispute, DISPUTE_REF_FIELD_ID, DISPUTE_VERSION_FIELD_ID, [
      "IAM-ACT-RAISE-GUARDIAN-DISPUTE",
      "IAM-ACT-FREEZE-GUARDIAN-DISPUTE",
    ], "ALWAYS_REQUIRED")
    || !list(raise?.inputFieldIds).includes(DISPUTE_VERSION_FIELD_ID)
    || !list(freeze?.inputFieldIds).includes(DISPUTE_VERSION_FIELD_ID)
    || list(raise?.relatedStateGuards).filter(({ refFieldId, versionFieldId, targetObjectId }) => (
      refFieldId === DISPUTE_REF_FIELD_ID
      && versionFieldId === DISPUTE_VERSION_FIELD_ID
      && targetObjectId === HIGH_IMPACT_AUTHORIZATION_OBJECT_ID
    )).length !== 1
    || list(freeze?.relatedStateGuards).filter(({ refFieldId, versionFieldId, targetObjectId }) => (
      refFieldId === DISPUTE_REF_FIELD_ID
      && versionFieldId === DISPUTE_VERSION_FIELD_ID
      && targetObjectId === HIGH_IMPACT_AUTHORIZATION_OBJECT_ID
    )).length !== 1
  ) {
    fail(errors, "guardian dispute must version-pin its high-impact authorization reference and guard the exact authorization object");
  }
  const authorization = object(index, HIGH_IMPACT_AUTHORIZATION_OBJECT_ID);
  const contract = authorization?.highImpactAuthorizationMatrixContract;
  if (
    !authorization
    || !contract
    || contract.decisionId !== "D037"
    || contract.authorizedState !== "AUTHORIZED"
    || contract.reservedState !== "RESERVED"
    || contract.studentFieldId !== AUTHORIZATION_STUDENT_FIELD_ID
    || contract.actionCodeFieldId !== AUTHORIZATION_ACTION_FIELD_ID
    || contract.schoolScopeFieldId !== AUTHORIZATION_SCHOOL_SCOPE_FIELD_ID
    || contract.relationshipScopeFieldId !== AUTHORIZATION_RELATIONSHIP_SCOPE_FIELD_ID
    || contract.expiryFieldId !== AUTHORIZATION_EXPIRY_FIELD_ID
    || contract.disputeStatusFieldId !== AUTHORIZATION_DISPUTE_STATUS_FIELD_ID
    || !sameSet(contract.blockedDisputeStates, ["OPEN", "FROZEN"])
    || !sameSet(contract.requiredActionCodes, ["DELETE", "MIGRATE", "PUBLISH_STUDENT_WORK"])
    || contract.exactVersionRequired !== true
    || contract.failClosed !== true
    || !list(authorization.states).includes("RESERVED")
    || !field(authorization, AUTHORIZATION_SCHOOL_SCOPE_FIELD_ID)
    || !field(authorization, AUTHORIZATION_RELATIONSHIP_SCOPE_FIELD_ID)
  ) {
    fail(errors, "the IAM high-impact authorization matrix must expose one versioned student/action/school/relationship/expiry/dispute contract");
  }
  if (!ref || !version) fail(errors, "guardian dispute version fields are missing");
}

function validateBinding(index, errors, binding) {
  const module = index.moduleById.get(binding.moduleId)?.value;
  const target = object(index, binding.targetObjectId);
  const actionValue = action(index, binding.actionId);
  const authorization = object(index, HIGH_IMPACT_AUTHORIZATION_OBJECT_ID);
  if (!module || !target || !actionValue || !authorization) {
    fail(errors, `${binding.contractId} requires its module, target action, target object, and IAM authorization object`);
    return;
  }

  const standardActionIds = binding.standardStateGuard
    ? binding.contractId === "D037-STUDENT-TRANSFER"
      ? [
        "DGV-ACT-REQUEST-STUDENT-TRANSFER",
        "DGV-ACT-AUTHORIZE-STUDENT-TRANSFER",
        binding.actionId,
        "DGV-ACT-COMPLETE-STUDENT-TRANSFER",
      ]
      : [binding.actionId]
    : [];
  const stateGuardPolicy = binding.standardStateGuard ? "ALWAYS_REQUIRED" : "NONE";
  if (!exactReference(index, target, binding.referenceFieldId, binding.versionFieldId, standardActionIds, stateGuardPolicy)) {
    fail(errors, `${binding.contractId} must use one exact VERSION_PINNED reference to ${HIGH_IMPACT_AUTHORIZATION_OBJECT_ID}; ordinary IDs cannot bypass it`);
  }
  if (!list(actionValue.inputFieldIds).includes(binding.referenceFieldId) || !list(actionValue.inputFieldIds).includes(binding.versionFieldId)) {
    fail(errors, `${binding.actionId} must input both the high-impact authorization ID reference and its pinned version`);
  }
  if (binding.standardStateGuard && !hasSingleGuard(actionValue, binding, "RESERVED")) {
    fail(errors, `${binding.actionId} must complete the authoritative reservation before domain writes and guard the pinned authorization at RESERVED`);
  }
  const guard = actionValue.highImpactAuthorizationGuard;
  if (!guard || !sameRecord(guard, expectedGuard(binding))) {
    fail(errors, `${binding.actionId} must declare the D037 state, expiry, student, action-code, scope, dispute, and conditional-phase guard without weakening it`);
  }

  const studentTarget = object(index, binding.studentBinding.targetObjectId);
  if (!field(studentTarget, binding.studentBinding.targetFieldId)) {
    fail(errors, `${binding.contractId} student binding target field ${binding.studentBinding.targetFieldId} is missing`);
  }
  if (!field(authorization, binding.studentBinding.authorizationFieldId)) {
    fail(errors, `${binding.contractId} authorization student field is missing`);
  }
  for (const scopeBinding of [binding.schoolScopeBinding, binding.relationshipScopeBinding]) {
    const scopeTarget = object(index, scopeBinding.targetObjectId);
    if (!field(authorization, scopeBinding.authorizationFieldId)) {
      fail(errors, `${binding.contractId} authorization scope field ${scopeBinding.authorizationFieldId} is missing`);
    }
    if (list(scopeBinding.targetFieldIds).some((fieldId) => !field(scopeTarget, fieldId))) {
      fail(errors, `${binding.contractId} scope binding target fields are incomplete`);
    }
  }

  const missingFailureCodes = REQUIRED_FAILURE_CODES.filter((code) => (
    !list(actionValue.failureResults).includes(code)
    || !list(actionValue.scenarioIds).includes(`${binding.actionId}-SCN-${code}`)
    || !list(index.moduleById.get(binding.moduleId)?.value?.scenarios).some((scenario) => (
      scenario.id === `${binding.actionId}-SCN-${code}`
      && scenario.actionId === binding.actionId
      && scenario.resultCode === code
      && scenario.then?.expectedPermission === "DENY"
      && scenario.then?.expectedState?.mode === "UNCHANGED"
    ))
  ));
  if (missingFailureCodes.length > 0) {
    fail(errors, `${binding.actionId} must expose fail-closed D037 scenarios for ${missingFailureCodes.join(", ")}`);
  }

  if (binding.targetContext) {
    const context = object(index, binding.targetContext.objectId);
    const contextFields = [
      binding.targetContext.targetIdentityFieldId,
      binding.targetContext.authorizationConsistencyFieldId,
    ];
    const targetAction = object(index, binding.targetObjectId);
    if (
      !context
      || !targetAction
      || contextFields.some((fieldId) => !field(context, fieldId))
      || !field(targetAction, binding.referenceFieldId)
      || !field(targetAction, binding.versionFieldId)
      || !field(targetAction, binding.targetContext.refFieldId)
      || !field(targetAction, binding.targetContext.refVersionFieldId)
      || !field(context, binding.targetContext.contextVersionFieldId)
    ) {
      fail(errors, `${binding.contractId} deletion target context must bind the exact completed case, identity, and authorization IDs`);
    }
  }

  if (binding.contractId === "D037-STUDENT-WORK-PLATFORM-PUBLIC") {
    const promotionGuard = actionValue.publicPromotionGuard;
    const prohibitionScenario = list(module.scenarios).find(({ id }) => (
      id === `${binding.actionId}-SCN-STUDENT_WORK_PUBLIC_PROHIBITED`
    ));
    if (
      !promotionGuard
      || !sameSet(Object.keys(promotionGuard), [
        "sourceKindFieldId",
        "sourceGraphRefFieldId",
        "rightsBundleRefFieldId",
        "reviewRefFieldId",
        "sourceKindEligibilityBinding",
        "prohibitedSourceKinds",
        "prohibitedPhaseIds",
        "requiredReviewKinds",
      ])
      || !sameSet(promotionGuard.prohibitedSourceKinds, ["STUDENT_WORK"])
      || !sameSet(promotionGuard.prohibitedPhaseIds, ["PHASE-1", "PHASE-2"])
      || !sameSet(promotionGuard.requiredReviewKinds, ["SOURCE_RIGHTS", "PRIVACY", "CONTENT_QUALITY", "PLATFORM_AUTHORIZATION"])
      || !sameRecord(promotionGuard.sourceKindEligibilityBinding, {
        sourceGraphObjectId: "CONTENT-OBJ-MATERIAL-SOURCE-GRAPH",
        sourceGraphRefFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
        sourceGraphVersionFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION",
        sourceGraphSourceKindFieldId: "CONTENT-SOURCE-F-SOURCE-KIND",
        managementScopeMirrorFieldId: "CONTENT-SCOPE-F-SOURCE-KIND",
        comparison: "EXACT_CODE",
        exactVersionRequired: true,
        materialIdentityFallbackAllowed: false,
      })
      || !sameRecord(target.sourceKindEligibilityBinding, promotionGuard.sourceKindEligibilityBinding)
      || !sameRecord(binding.applicability, {
        kind: "PINNED_SOURCE_GRAPH_FIELD_CODE_AND_PHASE",
        ...promotionGuard.sourceKindEligibilityBinding,
        requiredCode: "STUDENT_WORK",
        requiredPhaseIds: ["PHASE-3"],
        prohibitedPhaseIds: ["PHASE-1", "PHASE-2"],
        prohibitionResultCode: "STUDENT_WORK_PUBLIC_PROHIBITED",
      })
      || !list(actionValue.failureResults).includes("STUDENT_WORK_PUBLIC_PROHIBITED")
      || prohibitionScenario?.actionId !== binding.actionId
      || prohibitionScenario?.resultCode !== "STUDENT_WORK_PUBLIC_PROHIBITED"
      || prohibitionScenario?.then?.expectedPermission !== "DENY"
      || prohibitionScenario?.then?.expectedState?.mode !== "UNCHANGED"
    ) {
      fail(errors, "student-work platform public promotion must retain the unconditional PHASE-1/PHASE-2 prohibition before the PHASE-3 authorization branch");
    }
  }
}

function expectedConsumptionProducer(binding) {
  return {
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
    applicability: binding.applicability,
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
}

function expectedReservation(binding) {
  return {
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

function validateConsumptionContract(index, errors) {
  const reservationEvent = index.eventById.get(HIGH_IMPACT_RESERVATION_REQUEST_EVENT_ID)?.value;
  const expectedReservationProducerActionIds = highImpactAuthorizationConsumptionBindings
    .map(({ guardActionId }) => guardActionId);
  const reservationEventContract = reservationEvent?.highImpactAuthorizationReservationEventContract;
  if (
    !reservationEvent
    || !sameSet(reservationEvent.producerActionIds, expectedReservationProducerActionIds)
    || !sameSet(reservationEvent.triggeredActionIds, [HIGH_IMPACT_RESERVATION_ACTION_ID])
    || !sameRecord(reservationEventContract?.contextKeys, HIGH_IMPACT_EVENT_CONTEXT_KEYS.reservation)
    || reservationEventContract?.consumerActionId !== HIGH_IMPACT_RESERVATION_ACTION_ID
    || reservationEventContract?.compareAndSetBoundary !== "BEFORE_FIRST_DOMAIN_WRITE"
    || reservationEventContract?.exactAuthorizationVersionRequired !== true
    || reservationEventContract?.exactDuplicateEffect !== "RETURN_EXISTING_RESERVATION"
    || reservationEventContract?.conflictingDuplicateEffect !== "FAIL_CLOSED"
    || list(reservationEventContract?.producerBindings).length !== highImpactAuthorizationConsumptionBindings.length
  ) {
    fail(errors, "the reservation request event must carry one structured authorization/action/target context into the authoritative pre-write CAS action");
  }

  const event = index.eventById.get(HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID)?.value;
  const expectedProducerActionIds = highImpactAuthorizationConsumptionBindings
    .map(({ domainSuccessActionId }) => domainSuccessActionId);
  const eventContract = event?.highImpactAuthorizationConsumptionEventContract;
  if (
    !event
    || !sameSet(event.producerActionIds, expectedProducerActionIds)
    || !sameSet(event.triggeredActionIds, ["IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION"])
    || !sameRecord(eventContract?.contextKeys, HIGH_IMPACT_EVENT_CONTEXT_KEYS.success)
    || eventContract?.consumerActionId !== "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION"
    || eventContract?.exactAuthorizationVersionRequired !== true
    || eventContract?.reservationStateRequired !== "RESERVED"
    || eventContract?.oneAuthorizationVersionOneUse !== true
    || eventContract?.consumptionKeyFormula !== "SHA256(authorization-id|authorization-version|action-code|target-object-id|target-object-ref|target-object-version)"
    || eventContract?.exactDuplicateEffect !== "RETURN_EXISTING_EXECUTED_AUTHORIZATION"
    || eventContract?.conflictingDuplicateEffect !== "FAIL_CLOSED"
    || eventContract?.domainEventRetryEffect !== "RETRY_CONSUMPTION_ONLY_WITHOUT_REEXECUTING_DOMAIN_ACTION"
    || list(eventContract?.producerBindings).length !== highImpactAuthorizationConsumptionBindings.length
  ) {
    fail(errors, "the shared domain-success event must bind all three terminal domain actions to one exact, one-use authorization consumption action");
  }

  for (const binding of highImpactAuthorizationConsumptionBindings) {
    const module = index.moduleById.get(binding.moduleId)?.value;
    const target = object(index, binding.targetObjectId);
    const domainSuccess = action(index, binding.domainSuccessActionId);
    const guardAction = action(index, binding.guardActionId);
    const authorizationReference = field(target, binding.authorizationReferenceFieldId);
    const outboxScenario = list(module?.scenarios).find(({ id }) => (
      id === `${binding.domainSuccessActionId}-SCN-HIGH_IMPACT_CONSUMPTION_EVENT_OUTBOX_FAILED`
    ));
    const eventBinding = list(eventContract?.producerBindings).find(({ actionId }) => (
      actionId === binding.domainSuccessActionId
    ));
    const reservationEventBinding = list(reservationEventContract?.producerBindings).find(({ actionId }) => (
      actionId === binding.guardActionId
    ));
    const expectedReservationEventBinding = {
      actionId: binding.guardActionId,
      actionCode: binding.actionCode,
      targetObjectId: binding.targetObjectId,
      authorizationReferenceFieldId: binding.authorizationReferenceFieldId,
      authorizationVersionFieldId: binding.authorizationVersionFieldId,
      targetIdentityFieldId: binding.targetIdentityFieldId,
      targetVersionFieldId: binding.targetVersionFieldId,
      applicability: binding.applicability,
    };
    const expectedEventBinding = {
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
      applicability: binding.applicability,
    };
    if (
      !module
      || !target
      || !domainSuccess
      || !guardAction
      || !sameRecord(reservationEventBinding, expectedReservationEventBinding)
      || !sameRecord(eventBinding, expectedEventBinding)
      || !sameRecord(domainSuccess.highImpactAuthorizationConsumptionProducer, expectedConsumptionProducer(binding))
      || !sameRecord(guardAction.highImpactAuthorizationConsumptionReservation, expectedReservation(binding))
      || !list(domainSuccess.inputFieldIds).includes(binding.authorizationReferenceFieldId)
      || !list(domainSuccess.inputFieldIds).includes(binding.authorizationVersionFieldId)
      || !list(domainSuccess.outputFieldIds).includes(binding.executionIdentityFieldId)
      || !list(domainSuccess.outputFieldIds).includes(binding.executionVersionFieldId)
      || !field(target, binding.executionIdentityFieldId)
      || !field(target, binding.executionVersionFieldId)
      || !list(guardAction.outputFieldIds).includes(binding.executionIdentityFieldId)
      || !list(guardAction.outputFieldIds).includes(binding.executionVersionFieldId)
      || !list(guardAction.producedEventIds).includes(HIGH_IMPACT_RESERVATION_REQUEST_EVENT_ID)
      || !list(domainSuccess.producedEventIds).includes(HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID)
      || domainSuccess.transition?.to !== binding.requiredSuccessState
      || !domainSuccess.idempotencyKey
      || !list(domainSuccess.failureResults).includes("HIGH_IMPACT_CONSUMPTION_EVENT_OUTBOX_FAILED")
      || outboxScenario?.resultCode !== "HIGH_IMPACT_CONSUMPTION_EVENT_OUTBOX_FAILED"
      || outboxScenario?.then?.expectedPermission !== "DENY"
      || outboxScenario?.then?.expectedState?.mode !== "UNCHANGED"
      || !exactScenarioExecutionBinding(module, domainSuccess, outboxScenario)
      || (authorizationReference?.stateGuardPolicy !== "NONE"
        && !hasSingleReferenceGuard(
          domainSuccess,
          binding.authorizationReferenceFieldId,
          binding.authorizationVersionFieldId,
          "RESERVED",
        ))
    ) {
      fail(errors, `${binding.contractId} must reserve once, emit the shared event only at terminal success, and retry consumption without repeating the domain write`);
    }
  }

  const authorization = object(index, HIGH_IMPACT_AUTHORIZATION_OBJECT_ID);
  const matrixReservation = authorization?.highImpactAuthorizationMatrixContract?.reservationContract;
  const matrixConsumption = authorization?.highImpactAuthorizationMatrixContract?.consumptionContract;
  const reserve = action(index, HIGH_IMPACT_RESERVATION_ACTION_ID);
  const execute = action(index, "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION");
  const reserveExposedByPage = index.pages.some(({ value }) => (
    list(value?.actionIds).includes(HIGH_IMPACT_RESERVATION_ACTION_ID)
  ));
  const executeExposedByPage = index.pages.some(({ value }) => (
    list(value?.actionIds).includes("IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION")
  ));
  const iamModule = index.moduleById.get("IAM-001")?.value;
  const executeScenarios = list(iamModule?.scenarios).filter(({ actionId }) => (
    actionId === "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION"
  ));
  const reserveScenarios = list(iamModule?.scenarios).filter(({ actionId }) => (
    actionId === HIGH_IMPACT_RESERVATION_ACTION_ID
  ));
  const requiredConsumptionFields = Object.values(CONSUMPTION_FIELDS);
  const requiredReservationFields = Object.values(RESERVATION_FIELDS);
  const expectedReservationCompareAndSet = {
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
  };
  if (
    !authorization
    || requiredConsumptionFields.some((fieldId) => !field(authorization, fieldId))
    || requiredReservationFields.some((fieldId) => !field(authorization, fieldId))
    || !matrixReservation
    || matrixReservation.eventId !== HIGH_IMPACT_RESERVATION_REQUEST_EVENT_ID
    || matrixReservation.reservationActionId !== HIGH_IMPACT_RESERVATION_ACTION_ID
    || matrixReservation.authoritativeObjectId !== HIGH_IMPACT_AUTHORIZATION_OBJECT_ID
    || matrixReservation.oneUseOnly !== true
    || matrixReservation.firstReservationStateTransition?.from !== "AUTHORIZED"
    || matrixReservation.firstReservationStateTransition?.to !== "RESERVED"
    || matrixReservation.exactDuplicateEffect !== "RETURN_EXISTING_RESERVATION"
    || matrixReservation.conflictingTargetEffect !== "FAIL_CLOSED"
    || matrixReservation.sameReservationTargetRetryAllowed !== true
    || matrixReservation.authorizationVersionCompareAndSetRequired !== true
    || matrixReservation.domainWriteBeforeReservationCommitAllowed !== false
    || !reserve
    || reserve.executionMode !== "SYSTEM_EVENT"
    || reserveExposedByPage
    || reserve.trigger?.eventId !== HIGH_IMPACT_RESERVATION_REQUEST_EVENT_ID
    || !sameRecord(reserve.transition, { from: ["AUTHORIZED", "RESERVED"], to: "RESERVED" })
    || !sameRecord(
      reserve.highImpactAuthorizationReservationContract?.compareAndSet,
      expectedReservationCompareAndSet,
    )
    || reserve.highImpactAuthorizationReservationContract
      ?.reservationCommitAcknowledgementRequiredBeforeDomainWrite !== true
    || requiredReservationFields.some((fieldId) => !list(reserve.outputFieldIds).includes(fieldId))
    || !String(reserve.idempotencyKey).includes("consumption-key")
    || reserveScenarios.length === 0
    || reserveScenarios.some((scenario) => !exactScenarioExecutionBinding(
      iamModule,
      reserve,
      scenario,
    ))
    || !matrixConsumption
    || matrixConsumption.eventId !== HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID
    || matrixConsumption.consumerActionId !== "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION"
    || matrixConsumption.oneUseOnly !== true
    || matrixConsumption.authorizationStateTransition?.from !== "RESERVED"
    || matrixConsumption.authorizationStateTransition?.to !== "EXECUTED"
    || matrixConsumption.exactDuplicateEffect !== "RETURN_EXISTING_EXECUTED_AUTHORIZATION"
    || matrixConsumption.conflictingDuplicateEffect !== "FAIL_CLOSED"
    || matrixConsumption.eventOutboxFailureEffect !== "KEEP_DOMAIN_SUCCESS_UNCOMMITTED"
    || matrixConsumption.consumerFailureEffect !== "RETRY_SAME_EVENT_WITHOUT_REEXECUTING_DOMAIN_ACTION"
    || matrixConsumption.partialAuthorizationAndConsumptionWriteAllowed !== false
    || !execute
    || execute.executionMode !== "SYSTEM_EVENT"
    || executeExposedByPage
    || execute.trigger?.eventId !== HIGH_IMPACT_DOMAIN_SUCCESS_EVENT_ID
    || execute.transition?.from !== "RESERVED"
    || execute.transition?.to !== "EXECUTED"
    || !sameRecord(execute.highImpactAuthorizationConsumptionContract, matrixConsumption)
    || requiredConsumptionFields.some((fieldId) => !list(execute.outputFieldIds).includes(fieldId))
    || !String(execute.idempotencyKey).includes("consumption-key")
    || executeScenarios.length === 0
    || executeScenarios.some((scenario) => !exactScenarioExecutionBinding(
      iamModule,
      execute,
      scenario,
    ))
  ) {
    fail(errors, "IAM must atomically reserve one exact AUTHORIZED version before domain writes, reject concurrent targets, and consume only that RESERVED version after terminal success");
  }
}

export function validateHighImpactAuthorizationContracts(model) {
  if (model?.profile !== "ZHIXU_V2") return [];
  const index = buildModelIndex(model);
  const errors = [];
  validateDisputeContract(index, errors);
  validateConsumptionContract(index, errors);
  const targetObjectIds = new Set();
  for (const binding of highImpactAuthorizationBindings) {
    targetObjectIds.add(binding.referenceFieldId);
    validateBinding(index, errors, binding);
  }
  if (targetObjectIds.size !== 3) {
    fail(errors, "D037 must bind three distinct domain reference fields to one IAM authorization object");
  }
  const actionRefs = highImpactAuthorizationBindings.map((binding) => {
    const actionValue = action(index, binding.actionId);
    return actionValue?.highImpactAuthorizationGuard?.authorizationObjectId;
  });
  if (!actionRefs.every((objectId) => objectId === HIGH_IMPACT_AUTHORIZATION_OBJECT_ID)) {
    fail(errors, "all three D037 real actions must resolve the same IAM-OBJ-HIGH-IMPACT-AUTHORIZATION target, never a copied local authorization");
  }
  return errors;
}
