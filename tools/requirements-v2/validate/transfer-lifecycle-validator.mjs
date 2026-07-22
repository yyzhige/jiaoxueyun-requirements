import { buildModelIndex } from "./model-validator.mjs";

const CODE = "INVALID_TRANSFER_LIFECYCLE_CONTRACT";
const FLOW_ID = "DF-017";
const MEMBERSHIP_SOURCE_EVENT_ID = "EVT-MEMBERSHIP-DIRECTORY-SNAPSHOT-AVAILABLE";
const START_EVENT_ID = "EVT-STUDENT-TRANSFER-CUTOVER-REQUESTED";
const COMPLETED_EVENT_ID = "EVT-TRANSFER-AUTHORIZATION-EXECUTED";
const TRANSFER_OBJECT_ID = "DGV-OBJ-TRANSFER-AUTHORIZATION";
const MEMBERSHIP_OBJECT_ID = "ACC-OBJ-MEMBERSHIP";
const AUTHORIZATION_OBJECT_ID = "IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION";
const HISTORY_OBJECT_ID = "DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY";
const CREATE_INVITED_MEMBERSHIP_ACTION_ID = "ACC-ACT-CREATE-INVITED-MEMBERSHIP-FROM-DIRECTORY";

const ACTION_IDS = Object.freeze({
  start: "DGV-ACT-EXECUTE-STUDENT-TRANSFER",
  terminateMembership: "ACC-ACT-TERMINATE-OLD-SCHOOL-MEMBERSHIP",
  legacyProjection: "ORG-ACT-TRANSFER-STUDENT",
  terminateAuthorization: "IAM-ACT-TERMINATE-OLD-SCHOOL-STUDENT-DATA-AUTHORIZATION",
  revokeGuardianDelegations: "IAM-ACT-REVOKE-OLD-SCHOOL-GUARDIAN-DELEGATIONS",
  createMembership: "ACC-ACT-CREATE-PENDING-NEW-SCHOOL-MEMBERSHIP",
  createAuthorization: "IAM-ACT-CREATE-PENDING-NEW-SCHOOL-STUDENT-DATA-AUTHORIZATION",
  activateMembership: "ACC-ACT-ACTIVATE-NEW-SCHOOL-MEMBERSHIP",
  activateAuthorization: "IAM-ACT-ACTIVATE-NEW-SCHOOL-STUDENT-DATA-AUTHORIZATION",
  complete: "DGV-ACT-COMPLETE-STUDENT-TRANSFER",
  history: "DGV-ACT-CREATE-OLD-SCHOOL-HISTORY-RESTRICTION",
  invalidatePermissions: "IAM-ACT-INVALIDATE-TRANSFERRED-STUDENT-PERMISSIONS",
});

const EXPECTED_STEPS = Object.freeze(Object.values(ACTION_IDS));
const D052_TRACE_ACTION_IDS = Object.freeze([
  "DGV-ACT-REQUEST-STUDENT-TRANSFER",
  "DGV-ACT-AUTHORIZE-STUDENT-TRANSFER",
  "DGV-ACT-FREEZE-STUDENT-TRANSFER",
  CREATE_INVITED_MEMBERSHIP_ACTION_ID,
  ACTION_IDS.start,
  ACTION_IDS.terminateMembership,
  ACTION_IDS.legacyProjection,
  ACTION_IDS.terminateAuthorization,
  ACTION_IDS.revokeGuardianDelegations,
  ACTION_IDS.createMembership,
  ACTION_IDS.createAuthorization,
  ACTION_IDS.activateMembership,
  ACTION_IDS.activateAuthorization,
  ACTION_IDS.complete,
  ACTION_IDS.invalidatePermissions,
]);
const D053_TRACE_ACTION_IDS = Object.freeze([
  ACTION_IDS.start,
  ACTION_IDS.terminateMembership,
  ACTION_IDS.terminateAuthorization,
  ACTION_IDS.revokeGuardianDelegations,
  ACTION_IDS.complete,
  ACTION_IDS.history,
  ACTION_IDS.invalidatePermissions,
  "DGV-ACT-VIEW-OLD-SCHOOL-RESTRICTED-HISTORY",
  "DGV-ACT-DEIDENTIFY-OLD-SCHOOL-HISTORY",
]);
const REQUIRED_TRACE_ACTION_IDS = Object.freeze([
  ...new Set([...D052_TRACE_ACTION_IDS, ...D053_TRACE_ACTION_IDS]),
]);

function list(value) {
  return Array.isArray(value) ? value : [];
}

function sameStrings(values, expected) {
  const actual = list(values);
  return actual.length === expected.length
    && expected.every((value) => actual.includes(value));
}

function sameOrder(values, expected) {
  return JSON.stringify(list(values)) === JSON.stringify(expected);
}

function hasAll(values, required) {
  const actual = new Set(list(values));
  return required.every((value) => actual.has(value));
}

function field(object, fieldId) {
  return list(object?.fields).find(({ id }) => id === fieldId);
}

function action(index, actionId) {
  return index.actionById.get(actionId)?.value;
}

function event(index, eventId) {
  return index.eventById.get(eventId)?.value;
}

function flow(index, flowId) {
  return index.flows.find(({ value }) => value?.id === flowId)?.value;
}

function fail(errors, detail) {
  errors.push(`${CODE} ${detail}`);
}

function versionPinnedFieldValid(object, refFieldId, versionFieldId, targetObjectId, targetVersionFieldId) {
  const ref = field(object, refFieldId);
  const version = field(object, versionFieldId);
  const lineage = list(object?.lineageBindings).find((binding) => (
    binding?.refFieldId === refFieldId
    && binding?.versionFieldId === versionFieldId
    && binding?.targetObjectId === targetObjectId
    && binding?.targetVersionFieldId === targetVersionFieldId
  ));
  return ref?.valueSource?.kind === "OBJECT_REF"
    && ref.valueSource.targetObjectId === targetObjectId
    && ref.referenceIntegrity === "VERSION_PINNED"
    && ref.versionBinding?.versionFieldId === versionFieldId
    && ref.versionBinding?.targetVersionFieldId === targetVersionFieldId
    && version?.dataType === "INTEGER"
    && lineage;
}

function triggerMatches(actionValue, kind, id) {
  if (kind === "EVENT") {
    return actionValue?.executionMode === "SYSTEM_EVENT"
      && actionValue?.trigger?.kind === "EVENT"
      && actionValue.trigger.eventId === id;
  }
  return actionValue?.executionMode === "FLOW_INTERNAL"
    && actionValue?.trigger?.kind === "FLOW"
    && sameStrings(actionValue.trigger.flowIds, [id]);
}

function flowHasRef(flowValue, property, objectId, fieldId, version) {
  return list(flowValue?.[property]).some((ref) => (
    ref?.objectId === objectId
    && ref?.fieldId === fieldId
    && ref?.version === version
  ));
}

export function validateTransferLifecycleContract(model) {
  if (model?.profile !== "ZHIXU_V2") return [];

  const errors = [];
  const index = buildModelIndex(model);
  const organization = index.moduleById.get("ORG-001")?.value;
  const identityAccess = index.moduleById.get("IAM-001")?.value;
  const governance = index.moduleById.get("DGV-001")?.value;
  const membership = index.objectById.get(MEMBERSHIP_OBJECT_ID)?.value;
  const authorization = index.objectById.get(AUTHORIZATION_OBJECT_ID)?.value;
  const transfer = index.objectById.get(TRANSFER_OBJECT_ID)?.value;
  const history = index.objectById.get(HISTORY_OBJECT_ID)?.value;
  const transferFlow = flow(index, FLOW_ID);
  const membershipSourceEvent = event(index, MEMBERSHIP_SOURCE_EVENT_ID);
  const startEvent = event(index, START_EVENT_ID);
  const completedEvent = event(index, COMPLETED_EVENT_ID);

  if (
    !organization
    || !identityAccess
    || !governance
    || !membership
    || !authorization
    || !transfer
    || !history
    || !transferFlow
    || !membershipSourceEvent
    || !startEvent
    || !completedEvent
  ) {
    fail(errors, "D052-D053 require ORG, IAM, DGV objects, two events, and one cross-domain Flow");
    return errors;
  }

  const actions = Object.fromEntries(
    Object.entries(ACTION_IDS).map(([key, actionId]) => [key, action(index, actionId)]),
  );
  const createInvitedMembership = action(index, CREATE_INVITED_MEMBERSHIP_ACTION_ID);
  if (Object.values(actions).some((value) => !value) || !createInvitedMembership) {
    fail(errors, "DF-017 requires every old-access termination, new-subset creation, activation, completion, history, and invalidation action");
    return errors;
  }

  if (
    !hasAll(membership.states, ["INVITED", "PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED", "TERMINATED"])
    || membership.activeMembershipUniquenessContract?.activeState !== "ACTIVE"
    || membership.activeMembershipUniquenessContract?.uniquenessScope
      !== "ONE_ACTIVE_SCHOOL_MEMBERSHIP_PER_PLATFORM_IDENTITY"
    || membership.activeMembershipUniquenessContract?.conflictEffect
      !== "FAIL_CLOSED_WITHOUT_TERMINATING_THE_CURRENT_MEMBERSHIP"
    || membership.jointTransferActivationContract?.membershipAloneGrantsStudentDataAccess !== false
    || membership.jointTransferActivationContract?.authorizationAloneGrantsStudentDataAccess !== false
    || membership.jointTransferActivationContract?.permissionResolverRule
      !== "BOTH_ACTIVE_SAME_TRANSFER_VERSION_JOINT_COMMIT_AND_EFFECTIVE_AT"
    || membership.jointTransferActivationContract?.sameEffectiveAtRequired !== true
    || membership.jointTransferActivationContract?.effectiveAtFieldId !== "ACC-MEMBER-F-EFFECTIVE-AT"
    || !sameStrings(membership.stateReachability?.initialStateIds, [])
    || !versionPinnedFieldValid(
      membership,
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF",
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION",
      TRANSFER_OBJECT_ID,
      "DGV-TRANSFER-F-VERSION",
    )
    || !versionPinnedFieldValid(
      membership,
      "ACC-MEMBER-F-PREDECESSOR-REF",
      "ACC-MEMBER-F-PREDECESSOR-VERSION",
      MEMBERSHIP_OBJECT_ID,
      "ACC-MEMBER-F-VERSION",
    )
    || field(membership, "ACC-MEMBER-F-STUDENT-PROFILE-REF")?.valueSource?.targetObjectId
      !== "ORG-OBJ-STUDENT"
  ) {
    fail(errors, "ACC membership must remain the only authority, be versioned and single-active, pin the transfer/predecessor, and deny data access until joint activation");
  }

  if (
    !sameStrings(authorization.states, ["PENDING", "ACTIVE", "REVOKED"])
    || authorization.studentDataClassification?.kind !== "DETAIL"
    || authorization.transferSubsetContract?.fullDatabaseCopyAllowed !== false
    || authorization.transferSubsetContract?.schoolPrivateMaterialMigrationAllowed !== false
    || authorization.transferSubsetContract?.activeAuthorizationMustMatchActiveMembership !== true
    || authorization.transferSubsetContract?.membershipAloneGrantsStudentDataAccess !== false
    || authorization.transferSubsetContract?.authorizationAloneGrantsStudentDataAccess !== false
    || authorization.transferSubsetContract?.permissionResolverRule
      !== "MEMBERSHIP_AND_AUTHORIZATION_MUST_BOTH_BE_ACTIVE_WITH_SAME_TRANSFER_VERSION_JOINT_COMMIT_AND_EFFECTIVE_AT"
    || authorization.transferSubsetContract?.jointEffectiveAtRequired !== true
    || !sameStrings(authorization.stateReachability?.initialStateIds, [])
    || authorization.transferSubsetContract?.oldSchoolCurrentAccessAfterTermination !== "DENY"
    || !versionPinnedFieldValid(
      authorization,
      "IAM-SSDA-F-MEMBERSHIP-REF",
      "IAM-SSDA-F-MEMBERSHIP-VERSION",
      MEMBERSHIP_OBJECT_ID,
      "ACC-MEMBER-F-VERSION",
    )
    || !versionPinnedFieldValid(
      authorization,
      "IAM-SSDA-F-SOURCE-TRANSFER-REF",
      "IAM-SSDA-F-SOURCE-TRANSFER-VERSION",
      TRANSFER_OBJECT_ID,
      "DGV-TRANSFER-F-VERSION",
    )
    || !hasAll(authorization.fields.map(({ id }) => id), [
      "IAM-SSDA-F-PERMITTED-SUBSET",
      "IAM-SSDA-F-PERMITTED-SUBSET-DIGEST",
      "IAM-SSDA-F-SOURCE-RIGHTS",
      "IAM-SSDA-F-SOURCE-RIGHTS-DIGEST",
      "IAM-SSDA-F-JOINT-ACTIVATION-COMMIT-ID",
    ])
    || field(authorization, "IAM-SSDA-F-STUDENT-PROFILE-REF")?.valueSource?.targetObjectId
      !== "ORG-OBJ-STUDENT"
  ) {
    fail(errors, "new-school access must be a membership-bound, version-pinned, source-right-limited subset and never a database copy");
  }

  if (
    !transfer.states.includes("CUTOVER_PENDING")
    || actions.start.transition?.from !== "AUTHORIZED"
    || actions.start.transition?.to !== "CUTOVER_PENDING"
    || !hasAll(actions.start.producedEventIds, [START_EVENT_ID])
    || actions.start.transferCutoverStartContract?.completionStateBeforeCrossDomainWrites !== "FORBIDDEN"
    || actions.start.transferCutoverStartContract?.exactHighImpactAuthorizationVersionRequired !== true
    || !hasAll(actions.start.inputFieldIds, [
      "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID",
      "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION",
      "DGV-TRANSFER-F-OLD-MEMBERSHIP-REF",
      "DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION",
      "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF",
      "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION",
      "DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST",
      "DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST",
    ])
    || actions.complete.transition?.from !== "CUTOVER_PENDING"
    || actions.complete.transition?.to !== "EXECUTED"
    || !hasAll(actions.complete.producedEventIds, [COMPLETED_EVENT_ID])
    || actions.complete.transferCompletionContract?.requiredOldMembershipState !== "TERMINATED"
    || actions.complete.transferCompletionContract?.requiredOldSchoolAuthorizationState !== "REVOKED"
    || actions.complete.transferCompletionContract?.requiredNewMembershipState !== "ACTIVE"
    || actions.complete.transferCompletionContract?.requiredNewSchoolAuthorizationState !== "ACTIVE"
    || actions.complete.transferCompletionContract?.sameTransferVersionRequired !== true
    || actions.complete.transferCompletionContract?.sameJointActivationCommitRequired !== true
    || actions.complete.transferCompletionContract?.sameEffectiveAtRequired !== true
    || actions.complete.transferCompletionContract?.halfActivatedVisibility !== "DENY"
  ) {
    fail(errors, "transfer execution must enter CUTOVER_PENDING and may reach EXECUTED only after exact cross-domain completion");
  }

  if (
    !versionPinnedFieldValid(
      transfer,
      "DGV-TRANSFER-F-OLD-MEMBERSHIP-REF",
      "DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION",
      MEMBERSHIP_OBJECT_ID,
      "ACC-MEMBER-F-VERSION",
    )
    || !versionPinnedFieldValid(
      transfer,
      "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF",
      "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION",
      AUTHORIZATION_OBJECT_ID,
      "IAM-SSDA-F-VERSION",
    )
    || !versionPinnedFieldValid(
      transfer,
      "DGV-TRANSFER-F-NEW-MEMBERSHIP-REF",
      "DGV-TRANSFER-F-NEW-MEMBERSHIP-VERSION",
      MEMBERSHIP_OBJECT_ID,
      "ACC-MEMBER-F-VERSION",
    )
    || !versionPinnedFieldValid(
      transfer,
      "DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-REF",
      "DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-VERSION",
      AUTHORIZATION_OBJECT_ID,
      "IAM-SSDA-F-VERSION",
    )
  ) {
    fail(errors, "transfer must pin old and new membership and school-authorization identities with exact versions");
  }

  if (
    !triggerMatches(createInvitedMembership, "EVENT", MEMBERSHIP_SOURCE_EVENT_ID)
    || createInvitedMembership.operationKind !== "CREATE"
    || !hasAll(createInvitedMembership.outputFieldIds, [
      "ACC-MEMBER-F-ID",
      "ACC-MEMBER-F-STATE",
      "ACC-MEMBER-F-VERSION",
      "ACC-MEMBER-F-DIRECTORY-SNAPSHOT-ID",
      "ACC-MEMBER-F-DIRECTORY-SNAPSHOT-VERSION",
    ])
    || createInvitedMembership.authoritativeMembershipProvisioningContract?.createdState !== "INVITED"
    || createInvitedMembership.authoritativeMembershipProvisioningContract?.activeAccessBeforeActivation !== false
    || !sameStrings(membershipSourceEvent.triggeredActionIds, [CREATE_INVITED_MEMBERSHIP_ACTION_ID])
    || membershipSourceEvent.authoritativeMembershipSnapshotContract?.consumerActionId
      !== CREATE_INVITED_MEMBERSHIP_ACTION_ID
    || membershipSourceEvent.authoritativeMembershipSnapshotContract?.conflictingDeliveryEffect
      !== "FAIL_CLOSED"
  ) {
    fail(errors, "ACC membership INVITED entry must come from one versioned authoritative directory event and CREATE action");
  }

  const memberPage = index.pageById.get("ORG-PAGE-MEMBERS")?.value;
  if (
    actions.legacyProjection.executionMode !== "FLOW_INTERNAL"
    || !sameStrings(actions.legacyProjection.trigger?.flowIds, [FLOW_ID])
    || actions.legacyProjection.legacyTransferBypassContract?.directSchoolExecutionAllowed !== false
    || list(memberPage?.actionIds).includes(ACTION_IDS.legacyProjection)
    || index.pages.some(({ value: page }) => list(page?.actionIds).includes(ACTION_IDS.legacyProjection))
  ) {
    fail(errors, "the legacy school-member action must be an internal projection and must not remain a page-level transfer bypass");
  }

  if (
    !triggerMatches(actions.terminateMembership, "EVENT", START_EVENT_ID)
    || actions.terminateMembership.transition?.to !== "TERMINATED"
    || actions.terminateMembership.transferMembershipTerminationContract?.exactTransferVersionRequired !== true
    || !triggerMatches(actions.terminateAuthorization, "FLOW", FLOW_ID)
    || actions.terminateAuthorization.transition?.to !== "REVOKED"
    || actions.terminateAuthorization.oldSchoolAuthorizationTerminationContract?.oldSchoolCurrentAccessAfterSuccess !== "DENY"
    || actions.revokeGuardianDelegations.guardianRelationContinuityContract?.personalGuardianRelationEffect !== "UNCHANGED"
    || actions.createMembership.newSchoolMembershipContract?.createdState !== "PENDING"
    || actions.createMembership.newSchoolMembershipContract?.readableBeforeActivation !== false
    || actions.createAuthorization.newSchoolSubsetCreationContract?.fullDatabaseCopyAllowed !== false
    || actions.createAuthorization.newSchoolSubsetCreationContract?.exactSubsetDigestRequired !== true
    || actions.activateMembership.transition?.to !== "ACTIVE"
    || actions.activateMembership.jointActivationCommit?.membershipAloneGrantsStudentDataAccess !== false
    || actions.activateMembership.jointActivationCommit?.permissionResolverRule
      !== "BOTH_ACTIVE_SAME_TRANSFER_VERSION_JOINT_COMMIT_AND_EFFECTIVE_AT"
    || actions.activateMembership.jointActivationCommit?.partialFailureEffect
      !== "NO_STUDENT_DATA_ACCESS_AND_FORWARD_RECONCILIATION"
    || actions.activateAuthorization.transition?.to !== "ACTIVE"
    || actions.activateAuthorization.newSchoolSubsetActivationContract?.activeScopeEqualsPinnedSubset !== true
    || actions.activateAuthorization.newSchoolSubsetActivationContract?.sameJointActivationCommitRequired !== true
    || actions.activateAuthorization.newSchoolSubsetActivationContract?.sameEffectiveAtRequired !== true
    || actions.activateAuthorization.newSchoolSubsetActivationContract?.authorizationAloneGrantsStudentDataAccess !== false
    || actions.activateAuthorization.newSchoolSubsetActivationContract?.permissionResolverRule
      !== "BOTH_ACTIVE_SAME_TRANSFER_VERSION_JOINT_COMMIT_AND_EFFECTIVE_AT"
    || action(index, "IAM-ACT-EVALUATE-PERMISSION")?.studentTransferJointActivationGuard?.mismatchEffect !== "DENY"
    || action(index, "IAM-ACT-EVALUATE-PERMISSION")?.studentTransferJointActivationGuard?.sameTransferVersionRequired !== true
    || action(index, "IAM-ACT-EVALUATE-PERMISSION")?.studentTransferJointActivationGuard?.sameJointActivationCommitRequired !== true
    || action(index, "IAM-ACT-EVALUATE-PERMISSION")?.studentTransferJointActivationGuard?.sameEffectiveAtRequired !== true
    || !sameStrings(
      action(index, "IAM-ACT-EVALUATE-PERMISSION")?.studentTransferJointActivationGuard?.effectiveAtFieldIds,
      ["ACC-MEMBER-F-EFFECTIVE-AT", "IAM-SSDA-F-EFFECTIVE-AT"],
    )
  ) {
    fail(errors, "old access termination and pending-to-active new-school subset actions must use the closed transfer semantics");
  }

  if (
    !sameStrings(startEvent.producerActionIds, [ACTION_IDS.start])
    || !sameStrings(startEvent.triggeredActionIds, [ACTION_IDS.terminateMembership])
    || startEvent.transferCutoverContextContract?.producerActionId !== ACTION_IDS.start
    || startEvent.transferCutoverContextContract?.firstConsumerActionId !== ACTION_IDS.terminateMembership
    || startEvent.transferCutoverContextContract?.exactTransferVersionRequired !== true
    || startEvent.transferCutoverContextContract?.conflictingDeliveryEffect !== "FAIL_CLOSED"
    || !triggerMatches(actions.terminateMembership, "EVENT", START_EVENT_ID)
  ) {
    fail(errors, "cutover-request event producer, consumer, context, and version bindings must be symmetric");
  }

  if (
    !sameStrings(completedEvent.producerActionIds, [ACTION_IDS.complete])
    || !sameStrings(completedEvent.triggeredActionIds, [ACTION_IDS.history, ACTION_IDS.invalidatePermissions])
    || completedEvent.transferCompletionContextContract?.producerActionId !== ACTION_IDS.complete
    || !sameStrings(
      completedEvent.transferCompletionContextContract?.consumerActionIds,
      [ACTION_IDS.history, ACTION_IDS.invalidatePermissions],
    )
    || completedEvent.transferCompletionContextContract?.historyConsumerFailureEffect
      !== "DENY_IDENTIFIABLE_HISTORY_AND_RETRY_WITHOUT_RESTORING_OLD_ACCESS"
    || !triggerMatches(actions.history, "EVENT", COMPLETED_EVENT_ID)
    || !triggerMatches(actions.invalidatePermissions, "EVENT", COMPLETED_EVENT_ID)
  ) {
    fail(errors, "completion event must bind one exact producer to history-boundary and permission-invalidation consumers");
  }

  if (
    !versionPinnedFieldValid(
      history,
      "DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-REF",
      "DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-VERSION",
      TRANSFER_OBJECT_ID,
      "DGV-TRANSFER-F-VERSION",
    )
    || !versionPinnedFieldValid(
      history,
      "DGV-OLDHIST-F-OLD-MEMBERSHIP-REF",
      "DGV-OLDHIST-F-OLD-MEMBERSHIP-VERSION",
      MEMBERSHIP_OBJECT_ID,
      "ACC-MEMBER-F-VERSION",
    )
    || !sameStrings(actions.history.historyBoundaryContract?.permittedPurposeCodes, [
      "ORIGINAL_TEACHING",
      "DISPUTE_HANDLING",
      "LEGAL_OBLIGATION",
    ])
    || actions.history.historyBoundaryContract?.roleScopeRequired !== true
    || actions.history.historyBoundaryContract?.explicitExpiryRequired !== true
    || actions.history.historyBoundaryContract?.defaultWithoutBoundary !== "DENY_IDENTIFIABLE_HISTORY"
    || actions.history.historyBoundaryContract?.everydayStatisticsMode !== "IRREVERSIBLY_DEIDENTIFIED"
  ) {
    fail(errors, "old-school identifiable history must pin the completed transfer and terminated membership and remain purpose-, role-, and time-limited");
  }

  if (
    !sameOrder(transferFlow.steps.map(({ actionId }) => actionId), EXPECTED_STEPS)
    || !sameStrings(transferFlow.moduleIds, ["DGV-001", "ACC-001", "ORG-001", "IAM-001"])
    || transferFlow.failureGranularity !== "FORWARD_ONLY_CROSS_DOMAIN_CUTOVER_WITH_OLD_ACCESS_NEVER_RESTORED"
    || transferFlow.compensation?.strategy !== "FORWARD_ONLY_RECONCILIATION_NO_OLD_ACCESS_RESTORE"
    || !String(transferFlow.compensation?.description).includes("keep old membership")
    || transferFlow.transferCutoverFlowContract?.oldSchoolCurrentAccessRestorationAllowed !== false
    || transferFlow.transferCutoverFlowContract?.fullDatabaseCopyAllowed !== false
    || transferFlow.transferCutoverFlowContract?.newSchoolScopeRule !== "EXACT_PINNED_AUTHORIZED_SUBSET_ONLY"
    || transferFlow.transferCutoverFlowContract?.authoritativeMembershipObjectId !== MEMBERSHIP_OBJECT_ID
    || transferFlow.transferCutoverFlowContract?.membershipAloneGrantsStudentDataAccess !== false
    || transferFlow.transferCutoverFlowContract?.authorizationAloneGrantsStudentDataAccess !== false
    || transferFlow.transferCutoverFlowContract?.jointActivationRule
      !== "BOTH_ACTIVE_SAME_TRANSFER_VERSION_JOINT_COMMIT_AND_EFFECTIVE_AT"
    || transferFlow.transferCutoverFlowContract?.halfActivatedVisibility !== "DENY"
    || transferFlow.transferCutoverFlowContract?.personalGuardianRelationEffect !== "UNCHANGED"
    || transferFlow.transferCutoverFlowContract?.historyBoundaryFailureEffect !== "DENY_IDENTIFIABLE_HISTORY_AND_RETRY"
    || !sameStrings(transferFlow.idempotencyKeyParts?.identityFieldIds, [
      "DGV-TRANSFER-F-ID",
      "ACC-MEMBER-F-ID",
      "ORG-STUDENT-F-ID",
      "IAM-SSDA-F-ID",
      "IAM-HIAUTH-F-ID",
    ])
    || !sameStrings(transferFlow.idempotencyKeyParts?.versionFieldIds, [
      "DGV-TRANSFER-F-VERSION",
      "ACC-MEMBER-F-VERSION",
      "ORG-STUDENT-F-VERSION",
      "IAM-SSDA-F-VERSION",
      "IAM-HIAUTH-F-VERSION",
    ])
    || transferFlow.idempotencyKeyParts?.fanoutFieldId !== "IAM-SDAUTH-F-ID"
    || !flowHasRef(transferFlow, "sourceDataRefs", TRANSFER_OBJECT_ID, "DGV-TRANSFER-F-DISPUTE-STATUS", "DGV-TRANSFER-F-VERSION")
    || !flowHasRef(transferFlow, "sourceDataRefs", TRANSFER_OBJECT_ID, "DGV-TRANSFER-F-EXPIRY", "DGV-TRANSFER-F-VERSION")
    || !flowHasRef(transferFlow, "sourceDataRefs", TRANSFER_OBJECT_ID, "DGV-TRANSFER-F-RELATIONSHIP-SCOPE", "DGV-TRANSFER-F-VERSION")
    || !flowHasRef(transferFlow, "targetDataRefs", MEMBERSHIP_OBJECT_ID, "ACC-MEMBER-F-STATE", "ACC-MEMBER-F-VERSION")
    || !flowHasRef(transferFlow, "targetDataRefs", AUTHORIZATION_OBJECT_ID, "IAM-SSDA-F-STATUS", "IAM-SSDA-F-VERSION")
    || !flowHasRef(transferFlow, "targetDataRefs", TRANSFER_OBJECT_ID, "DGV-TRANSFER-F-STATUS", "DGV-TRANSFER-F-VERSION")
    || !flowHasRef(transferFlow, "targetDataRefs", HISTORY_OBJECT_ID, "DGV-OLDHIST-F-STATUS", "DGV-OLDHIST-F-VERSION")
    || !list(transferFlow.sourceDataRefs).some((ref) => (
      ref.objectId === "IAM-OBJ-SCHOOL-DATA-AUTHORIZATION"
      && ref.fieldId === "IAM-SDAUTH-F-ID"
      && ref.cardinality === "ZERO_MANY"
    ))
  ) {
    fail(errors, "DF-017 must execute the exact ordered cutover with forward-only compensation and complete cross-domain targets");
  }

  const migration = list(model.migrationChanges).find(({ id }) => id === "MIG-052");
  const d052Trace = list(model.decisionTraceability)
    .find((trace) => trace?.decisionId === "D052");
  const d053Trace = list(model.decisionTraceability)
    .find((trace) => trace?.decisionId === "D053");
  if (
    !migration
    || !hasAll(migration.affected?.moduleIds, ["ACC-001", "ORG-001", "IAM-001", "DGV-001"])
    || !hasAll(migration.affected?.flowIds, [FLOW_ID])
    || !hasAll(migration.affected?.objectIds, [MEMBERSHIP_OBJECT_ID, AUTHORIZATION_OBJECT_ID, TRANSFER_OBJECT_ID, HISTORY_OBJECT_ID])
    || !hasAll(migration.affected?.actionIds, REQUIRED_TRACE_ACTION_IDS)
    || !hasAll(migration.affected?.stateRefs, [
      "ACC-OBJ-MEMBERSHIP.INVITED",
      "ACC-OBJ-MEMBERSHIP.TERMINATED",
      "IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION.REVOKED",
    ])
    || !hasAll(migration.affected?.scenarioIds, [
      `${CREATE_INVITED_MEMBERSHIP_ACTION_ID}-SCN-SUCCESS`,
      `${ACTION_IDS.complete}-SCN-SUCCESS`,
    ])
    || !hasAll(migration.affected?.testIds, ["D052-D053-TRANSFER-LIFECYCLE"])
    || !d052Trace
    || !d053Trace
    || !hasAll(d052Trace.flowIds, [FLOW_ID])
    || !hasAll(d053Trace.flowIds, [FLOW_ID])
    || !hasAll(d052Trace.objectIds, [MEMBERSHIP_OBJECT_ID, AUTHORIZATION_OBJECT_ID, TRANSFER_OBJECT_ID, "IAM-OBJ-SCHOOL-DATA-AUTHORIZATION", "IAM-OBJ-PERMISSION-DECISION"])
    || !hasAll(d053Trace.objectIds, [MEMBERSHIP_OBJECT_ID, AUTHORIZATION_OBJECT_ID, TRANSFER_OBJECT_ID, HISTORY_OBJECT_ID, "IAM-OBJ-SCHOOL-DATA-AUTHORIZATION", "IAM-OBJ-PERMISSION-DECISION"])
    || !hasAll(d052Trace.actionIds, D052_TRACE_ACTION_IDS)
    || !hasAll(d053Trace.actionIds, D053_TRACE_ACTION_IDS)
    || hasAll(d052Trace.actionIds, ["DGV-ACT-VIEW-OLD-SCHOOL-RESTRICTED-HISTORY"])
    || hasAll(d052Trace.actionIds, ["DGV-ACT-DEIDENTIFY-OLD-SCHOOL-HISTORY"])
    || hasAll(d053Trace.actionIds, [CREATE_INVITED_MEMBERSHIP_ACTION_ID])
    || hasAll(d053Trace.actionIds, [ACTION_IDS.createMembership])
    || hasAll(d053Trace.actionIds, [ACTION_IDS.activateMembership])
  ) {
    fail(errors, "D052 and D053 must separately trace transfer-subset cutover versus old-school history enforcement without group-union pollution");
  }

  if (index.objectById.has("ORG-OBJ-STUDENT-SCHOOL-MEMBERSHIP")) {
    fail(errors, "a second ORG membership authority is forbidden; login, context, and permission must use ACC-OBJ-MEMBERSHIP");
  }

  return errors;
}
