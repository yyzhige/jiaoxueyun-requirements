import test from "node:test";
import assert from "node:assert/strict";

import {
  PHASE,
  RELEASE_STATUS,
} from "../requirements-v2/model.mjs";
import { requirementModel } from "../requirements-v2/facts/index.mjs";
import { validateRequirementModel } from "../requirements-v2/validate/index.mjs";

function moduleById(model, id) {
  return model.modules.find((module) => module.id === id);
}

function objectById(model, id) {
  return model.modules.flatMap(({ objects }) => objects).find((object) => object.id === id);
}

function actionById(model, id) {
  return model.modules.flatMap(({ actions }) => actions).find((action) => action.id === id);
}

function fieldById(model, id) {
  return model.modules.flatMap(({ objects }) => objects)
    .flatMap(({ fields }) => fields)
    .find((field) => field.id === id);
}

function eventById(model, id) {
  return model.events.find((event) => event.id === id);
}

function optionCodes(model, id) {
  return model.optionSets.find((optionSet) => optionSet.id === id).values
    .map(({ code }) => code);
}

function assertHasCode(model, code, context = "") {
  const errors = validateRequirementModel(model);
  assert.ok(
    errors.some((error) => error.startsWith(code)),
    `${context ? `${context}: ` : ""}${code}\n${errors.join("\n")}`,
  );
}

test("commercial continuity requirement model passes every validator", () => {
  assert.deepEqual(validateRequirementModel(requirementModel), []);
});

test("school is the payer object and finance/governance contacts are structurally separated", () => {
  const platform = moduleById(requirementModel, "PLAT-001");
  const boundary = objectById(requirementModel, "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY");
  const schoolRef = fieldById(requirementModel, "PLAT-COMM-F-SCHOOL-REF");
  const create = actionById(requirementModel, "PLAT-ACT-CREATE-COMMERCIAL-BOUNDARY");

  assert.deepEqual(optionCodes(requirementModel, "OPT-EXT-019"), ["SCHOOL"]);
  assert.equal(schoolRef.valueSource.targetObjectId, "ACC-OBJ-SCHOOL");
  assert.equal(schoolRef.versionBinding.targetVersionFieldId, "ACC-SCHOOL-F-SCHOOL-VERSION");
  assert.equal(platform.commercialBoundaryContract.schoolRefFieldId, schoolRef.id);
  assert.deepEqual(boundary.referenceSeparationConstraints, [{
    leftRefFieldId: "PLAT-COMM-F-FINANCIAL-CONTACT-REF",
    rightRefFieldId: "PLAT-COMM-F-GOVERNANCE-ADMIN-REF",
    comparison: "MUST_DIFFER",
    scope: "SAME_SCHOOL",
    schoolRefFieldId: "PLAT-COMM-F-SCHOOL-REF",
    sourceSchoolFieldId: "ACC-PROFILE-F-SCHOOL-ID",
  }]);
  assert.equal(create.contactBindingGuards.contactsMustDiffer, true);
  assert.equal(
    create.contactBindingGuards.governanceAdministratorRequiredRoleCode,
    "ROLE-SCHOOL-ADMIN",
  );
  assert.ok(create.failureResults.includes("COMMERCIAL_CONTACT_SEPARATION_REQUIRED"));
});

test("D090 is a planned phase-two entitlement and is absent from the first-stage release", () => {
  const platform = moduleById(requirementModel, "PLAT-001");
  const phaseTwo = moduleById(requirementModel, "PLAT-002");
  const contract = phaseTwo.phaseTwoEntitlementContract;

  assert.equal(platform.productDecisionIds.includes("D090"), false);
  assert.equal(phaseTwo.phase, PHASE.SECOND);
  assert.equal(phaseTwo.releaseStatus, RELEASE_STATUS.PLANNED);
  assert.equal(requirementModel.currentReleaseModuleIds.includes("PLAT-002"), false);
  assert.deepEqual(phaseTwo.productDecisionIds, ["D090"]);
  assert.deepEqual(contract.coreEntitlements, [
    "CORE_AI_ASSESSMENT",
    "MINIMUM_VIDEO_HELP",
  ]);
  assert.deepEqual(contract.packageExpansionScope, [
    "CAPACITY",
    "CONCURRENCY",
    "ANALYTICS",
    "GENERAL_SUPPORT",
  ]);
  assert.equal(contract.schoolWideGuarantee, true);
  assert.equal(contract.studentOrGuardianPaymentAllowed, false);
  assert.equal(contract.coreLearningLoopPaywallAllowed, false);
  assert.equal(
    contract.resolveActiveActionId,
    "PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT",
  );
  assert.equal(
    contract.consumerRule,
    "EVERY_CORE_CONSUMER_PINS_ONE_EXACT_ACTIVE_SAME_SCHOOL_ENTITLEMENT_VERSION",
  );
  assert.deepEqual(contract.consumerBindings, [{
    entitlementCode: "CORE_AI_ASSESSMENT",
    actionIds: ["GRD-ACT-PROCESS", "PROG-ACT-SYNC-STUDENT-TARGET"],
  }, {
    entitlementCode: "MINIMUM_VIDEO_HELP",
    actionIds: [
      "VIDEO-ACT-ENSURE-STUDENT-MINIMUM-ENTITLEMENT",
      "VIDEO-ACT-ENSURE-SCHOOL-OVERFLOW-POOL",
    ],
  }]);
});

test("D090 binds PLAT GRD PROG and VIDEO to one exact active same-school entitlement", () => {
  const expectedConsumers = new Map([
    ["GRD-ACT-PROCESS", [
      "CORE_AI_ASSESSMENT",
      "GRD-001",
      "GRD-DECISION-F-CORE-ENTITLEMENT-REF",
      "GRD-DECISION-F-CORE-ENTITLEMENT-VERSION",
    ]],
    ["PROG-ACT-SYNC-STUDENT-TARGET", [
      "CORE_AI_ASSESSMENT",
      "PROG-001",
      "PROG-TARGET-F-CORE-ENTITLEMENT-REF",
      "PROG-TARGET-F-CORE-ENTITLEMENT-VERSION",
    ]],
    ["VIDEO-ACT-ENSURE-STUDENT-MINIMUM-ENTITLEMENT", [
      "MINIMUM_VIDEO_HELP",
      "VIDEO-001",
      "VIDEO-ENTITLEMENT-F-CORE-ENTITLEMENT-REF",
      "VIDEO-ENTITLEMENT-F-CORE-ENTITLEMENT-VERSION",
    ]],
    ["VIDEO-ACT-ENSURE-SCHOOL-OVERFLOW-POOL", [
      "MINIMUM_VIDEO_HELP",
      "VIDEO-001",
      "VIDEO-OVERFLOW-F-CORE-ENTITLEMENT-REF",
      "VIDEO-OVERFLOW-F-CORE-ENTITLEMENT-VERSION",
    ]],
  ]);
  for (const [actionId, [code, moduleId, refFieldId, versionFieldId]] of expectedConsumers) {
    const module = moduleById(requirementModel, moduleId);
    const action = actionById(requirementModel, actionId);
    const guard = action.phaseTwoEntitlementGuard;
    const binding = module.phaseTwoCoreEntitlementBindings.find(({ consumerActionIds }) => (
      consumerActionIds.includes(actionId)
    ));
    assert.equal(binding.entitlementCode, code);
    assert.equal(binding.entitlementRefFieldId, refFieldId);
    assert.equal(binding.entitlementVersionFieldId, versionFieldId);
    assert.equal(guard.entitlementCode, code);
    assert.equal(guard.entitlementObjectId, "PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT");
    assert.equal(guard.entitlementRefFieldId, refFieldId);
    assert.equal(guard.entitlementVersionFieldId, versionFieldId);
    assert.equal(guard.requiredEntitlementState, "ACTIVE");
    assert.equal(guard.exactPinnedVersionRequired, true);
    assert.equal(guard.schoolMustMatch, true);
    assert.equal(guard.matchCardinality, "EXACTLY_ONE");
    assert.equal(guard.missingOrAmbiguousBehavior, "FAIL_CLOSED");
    assert.ok(action.inputFieldIds.includes(refFieldId));
    assert.ok(action.inputFieldIds.includes(versionFieldId));
    assert.ok(action.failureResults.includes("PHASE_TWO_ENTITLEMENT_INACTIVE"));
    assert.ok(action.failureResults.includes("SCHOOL_SCOPE_MISMATCH"));
    assert.ok(action.relatedStateGuards.some((stateGuard) => (
      stateGuard.refFieldId === refFieldId
      && stateGuard.versionFieldId === versionFieldId
      && stateGuard.requiredState === "ACTIVE"
    )));
  }

  const resolver = actionById(
    requirementModel,
    "PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT",
  );
  assert.equal(resolver.operationKind, "READ");
  assert.equal(resolver.executionMode, "FLOW_INTERNAL");
  assert.equal(resolver.activeEntitlementSelectionGuard.maximumMatches, 1);
  assert.equal(resolver.activeEntitlementSelectionGuard.requiredState, "ACTIVE");
  assert.equal(
    resolver.activeEntitlementSelectionGuard.missingOrAmbiguousBehavior,
    "FAIL_CLOSED",
  );
  const flow = requirementModel.flows.find(({ id }) => id === "DF-006");
  const resolverStep = flow.steps.find(({ actionId }) => actionId === resolver.id);
  const processStep = flow.steps.find(({ actionId }) => actionId === "GRD-ACT-PROCESS");
  assert.ok(resolverStep.order < processStep.order);
  assert.ok(flow.moduleIds.includes("PLAT-002"));
  assert.ok(flow.idempotencyKeyParts.identityFieldIds.includes("PLAT-P2ENT-F-ID"));
  assert.ok(flow.idempotencyKeyParts.versionFieldIds.includes("PLAT-P2ENT-F-VERSION"));
  assert.ok(actionById(requirementModel, "GRD-ACT-PROCESS").outputFieldIds
    .includes("GRD-DECISION-F-CORE-ENTITLEMENT-REF"));
});

test("D090 revalidates the entitlement-pinned current service-plan version at every consumer", () => {
  const expectedBase = {
    resolverActionId: "PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT",
    servicePlanObjectId: "PLAT-OBJ-SERVICE-PLAN",
    entitlementServicePlanRefFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-REF",
    entitlementServicePlanVersionFieldId: "PLAT-P2ENT-F-SERVICE-PLAN-VERSION",
    servicePlanStateFieldId: "PLAT-PLAN-F-SERVICE-STATE",
    servicePlanVersionFieldId: "PLAT-PLAN-F-VERSION",
    requiredCurrentState: "ACTIVE",
    currentVersionMustEqualPinnedVersion: true,
    checkedAtExecution: true,
    staleMissingOrAmbiguousBehavior: "FAIL_CLOSED",
    failureResult: "PHASE_TWO_SERVICE_PLAN_NOT_ACTIVE",
  };
  const protectedPublishedActivityFallback = {
    mode: "EXACT_FINITE_D091_PROTECTED_ACTIVITY",
    protectedEntryObjectId: "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY",
    protectedEntryActivityRefFieldId: "PLAT-PROTECT-F-ACTIVITY-REF",
    protectedEntryActivityVersionFieldId: "PLAT-PROTECT-F-ACTIVITY-VERSION",
    protectedEntryPublicationSnapshotRefFieldId: "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-REF",
    protectedEntryPublicationSnapshotVersionFieldId:
      "PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-VERSION",
    protectedUntilFieldId: "PLAT-PROTECT-F-PROTECTED-UNTIL",
    serviceObjectResolution: "PINNED_SUBMISSION_ACTIVITY_AND_PUBLICATION_SNAPSHOT",
    requiredProtectedOperation: "COMPLETE_PUBLISHED_ACTIVITY",
    timeRule: "CURRENT_TIME_LE_PROTECTED_UNTIL",
    exactVersionMatchRequired: true,
    finiteWindowRequired: true,
    failureResult: "SERVICE_CONTINUITY_NOT_PROTECTED",
  };
  const strictActivePlanActionIds = [
    "PROG-ACT-SYNC-STUDENT-TARGET",
    "VIDEO-ACT-ENSURE-STUDENT-MINIMUM-ENTITLEMENT",
    "VIDEO-ACT-ENSURE-SCHOOL-OVERFLOW-POOL",
  ];

  const resolver = actionById(
    requirementModel,
    "PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT",
  );
  assert.deepEqual(
    resolver.activeEntitlementSelectionGuard.sourceServicePlanRevalidation,
    {
      ...expectedBase,
      allowedAuthorizationBranches: [
        "CURRENT_ACTIVE_SERVICE_PLAN",
        "EXACT_FINITE_D091_PROTECTED_ACTIVITY",
      ],
      continuityFallback: protectedPublishedActivityFallback,
    },
  );
  assert.ok(resolver.failureResults.includes("PHASE_TWO_SERVICE_PLAN_NOT_ACTIVE"));
  assert.ok(resolver.failureResults.includes("SERVICE_CONTINUITY_NOT_PROTECTED"));

  const grading = actionById(requirementModel, "GRD-ACT-PROCESS");
  assert.deepEqual(grading.phaseTwoEntitlementGuard.sourceServicePlanRevalidation, {
    ...expectedBase,
    allowedAuthorizationBranches: [
      "CURRENT_ACTIVE_SERVICE_PLAN",
      "EXACT_FINITE_D091_PROTECTED_ACTIVITY",
    ],
    continuityFallback: protectedPublishedActivityFallback,
  });
  assert.ok(grading.failureResults.includes("PHASE_TWO_SERVICE_PLAN_NOT_ACTIVE"));
  assert.ok(grading.failureResults.includes("SERVICE_CONTINUITY_NOT_PROTECTED"));

  for (const actionId of strictActivePlanActionIds) {
    const action = actionById(requirementModel, actionId);
    assert.deepEqual(
      action.phaseTwoEntitlementGuard.sourceServicePlanRevalidation,
      {
        ...expectedBase,
        allowedAuthorizationBranches: ["CURRENT_ACTIVE_SERVICE_PLAN"],
        continuityFallback: { mode: "NONE" },
      },
      actionId,
    );
    assert.ok(action.failureResults.includes("PHASE_TWO_SERVICE_PLAN_NOT_ACTIVE"), actionId);
  }

  assert.equal(
    moduleById(requirementModel, "PLAT-002").phaseTwoEntitlementContract
      .sourceServicePlanRevalidationRule,
    "EVERY_RESOLVER_AND_CORE_CONSUMER_REVALIDATES_THE_ENTITLEMENT_PINNED_CURRENT_SERVICE_PLAN_VERSION_AT_EXECUTION_WITH_ONLY_EXACT_FINITE_D091_PUBLISHED_ACTIVITY_FALLBACK",
  );
  assert.deepEqual(
    moduleById(requirementModel, "PLAT-002").phaseTwoEntitlementContract
      .protectedContinuityConsumerActionIds,
    ["GRD-ACT-PROCESS"],
  );
  assert.deepEqual(
    moduleById(requirementModel, "PLAT-002").phaseTwoEntitlementContract
      .strictActivePlanConsumerActionIds,
    strictActivePlanActionIds,
  );
});

test("D090 propagates service-plan restriction to its active phase-two entitlement", () => {
  const entitlement = objectById(requirementModel, "PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT");
  const restrictPlan = actionById(requirementModel, "PLAT-ACT-RESTRICT-SERVICE-PLAN");
  const restrictEntitlement = actionById(
    requirementModel,
    "PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT",
  );
  const event = eventById(requirementModel, "EVT-PLAT-SERVICE-PLAN-RESTRICTED");
  const flow = requirementModel.flows.find(({ id }) => id === "DF-018");
  const propagation = moduleById(requirementModel, "PLAT-002")
    .phaseTwoEntitlementContract.restrictionPropagation;

  assert.deepEqual(entitlement.states, ["DRAFT", "CONFIRMED", "ACTIVE", "RESTRICTED"]);
  assert.equal(
    fieldById(requirementModel, "PLAT-P2ENT-F-STATUS").valueSource.optionSetId,
    "OPT-EXT-026",
  );
  assert.ok(restrictPlan.producedEventIds.includes(event.id));
  assert.ok(restrictPlan.failureResults.includes("ENTITLEMENT_RESTRICTION_EVENT_OUTBOX_FAILED"));
  assert.deepEqual(event.producerActionIds, [restrictPlan.id]);
  assert.deepEqual(event.triggeredActionIds, [restrictEntitlement.id]);
  assert.deepEqual(restrictEntitlement.transition, { from: "ACTIVE", to: "RESTRICTED" });
  assert.equal(restrictEntitlement.trigger.eventId, event.id);
  assert.equal(
    restrictEntitlement.entitlementRestrictionPropagationGuard
      .entitlementPinnedVersionMustEqualEventPriorVersion,
    true,
  );
  assert.equal(
    restrictEntitlement.entitlementRestrictionPropagationGuard.ambiguityEffect,
    "FAIL_CLOSED",
  );
  assert.ok(restrictEntitlement.failureResults.includes("SERVICE_PLAN_SOURCE_VERSION_MISMATCH"));
  assert.ok(restrictEntitlement.failureResults.includes("PHASE_TWO_ENTITLEMENT_SOURCE_AMBIGUOUS"));
  assert.deepEqual(flow.moduleIds, ["PLAT-001", "PLAT-002"]);
  assert.deepEqual(flow.steps.map(({ actionId }) => actionId), [
    restrictPlan.id,
    restrictEntitlement.id,
  ]);
  assert.deepEqual(propagation, {
    sourceActionId: "PLAT-ACT-RESTRICT-SERVICE-PLAN",
    eventId: "EVT-PLAT-SERVICE-PLAN-RESTRICTED",
    targetActionId: "PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT",
    flowId: "DF-018",
    sourceState: "RESTRICTED",
    targetState: "RESTRICTED",
    eventOutboxAtomicWithSourceTransition: true,
    entitlementReactivationAllowed: false,
    recoveryRequiresNewEntitlementForNewActivePlan: true,
  });
});

test("current entitlement is one exact ACTIVE service-plan version for one ACTIVE school", () => {
  const platform = moduleById(requirementModel, "PLAT-001");
  const plan = objectById(requirementModel, "PLAT-OBJ-SERVICE-PLAN");
  const create = actionById(requirementModel, "PLAT-ACT-CREATE-SERVICE-PLAN");
  const activate = actionById(requirementModel, "PLAT-ACT-ACTIVATE-SERVICE-PLAN");
  const continuity = objectById(requirementModel, "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW");
  const openContinuity = actionById(requirementModel, "PLAT-ACT-OPEN-SERVICE-CONTINUITY");
  const evaluateEntitlement = actionById(
    requirementModel,
    "PLAT-ACT-EVALUATE-NEW-ACTIVITY-ENTITLEMENT",
  );

  assert.deepEqual(plan.currentEntitlementConstraint, {
    schoolRefFieldId: "PLAT-PLAN-F-SCHOOL-REF",
    stateFieldId: "PLAT-PLAN-F-SERVICE-STATE",
    versionFieldId: "PLAT-PLAN-F-VERSION",
    currentState: "ACTIVE",
    maximumCurrentVersionsPerSchool: 1,
    selectionRule: "EXACT_PINNED_ACTIVE_VERSION",
    restrictedStates: ["RESTRICTED", "TERMINATED", "EXPIRED", "SUPERSEDED"],
    recoveryRule: "A_RESTRICTED_TERMINATED_OR_EXPIRED_PLAN_REQUIRES_A_NEW_ACTIVE_VERSION_AND_MAY_NOT_RETURN_TO_ACTIVE",
  });
  assert.deepEqual(optionCodes(requirementModel, "OPT-EXT-026"), [
    "DRAFT",
    "CONFIRMED",
    "ACTIVE",
    "RESTRICTED",
    "TERMINATED",
    "EXPIRED",
    "SUPERSEDED",
  ]);
  assert.equal(platform.servicePlanEntitlementContract.reactivationAllowed, false);
  assert.equal(platform.servicePlanEntitlementContract.recoveryRequiresNewActiveVersion, true);
  assert.equal(platform.servicePlanEntitlementContract.closedContinuityRestoresEntitlement, false);
  assert.equal(platform.servicePlanEntitlementContract.objectId, plan.id);
  assert.equal(
    plan.lineageBindings.find(({ refFieldId }) => refFieldId === "PLAT-PLAN-F-SCHOOL-REF")
      .targetObjectId,
    "ACC-OBJ-SCHOOL",
  );
  assert.equal(
    create.relatedStateGuards.find(({ refFieldId }) => refFieldId === "PLAT-PLAN-F-SCHOOL-REF")
      .requiredState,
    "ACTIVE",
  );
  assert.equal(activate.currentEntitlementActivationGuard.maximumCurrentVersionsPerSchool, 1);
  assert.ok(activate.failureResults.includes("ACTIVE_SERVICE_PLAN_ALREADY_EXISTS"));
  assert.equal(
    continuity.currentWindowUniquenessConstraint
      .maximumCurrentWindowsPerSchoolAndServicePlanVersion,
    1,
  );
  assert.equal(
    openContinuity.existingCurrentWindowGuard.maximumExistingMatchesBeforeCreate,
    0,
  );
  assert.ok(openContinuity.failureResults.includes("EXISTING_CURRENT_CONTINUITY_WINDOW"));
  assert.equal(
    evaluateEntitlement.entitlementDecisionContract.currentContinuitySelection.maximumMatches,
    1,
  );
  assert.equal(
    evaluateEntitlement.entitlementDecisionContract.currentContinuitySelection
      .ambiguousMatchEffect,
    "BLOCK",
  );
  for (const actionId of [
    "PLAT-ACT-CREATE-SERVICE-PLAN",
    "PLAT-ACT-CONFIRM-SERVICE-PLAN",
    "PLAT-ACT-ACTIVATE-SERVICE-PLAN",
    "PLAT-ACT-RESTRICT-SERVICE-PLAN",
    "PLAT-ACT-TERMINATE-SERVICE-PLAN",
    "PLAT-ACT-EXPIRE-SERVICE-PLAN",
    "PLAT-ACT-SUPERSEDE-SERVICE-PLAN",
  ]) {
    assert.ok(actionById(requirementModel, actionId).outputFieldIds.includes("PLAT-PLAN-F-VERSION"));
  }
  assert.equal(
    actionById(requirementModel, "PLAT-ACT-SUPERSEDE-SERVICE-PLAN")
      .recoveryVersionGuard.identityMustDiffer,
    true,
  );
});

test("published-activity protection is an immutable version-pinned entry set", () => {
  const platform = moduleById(requirementModel, "PLAT-001");
  const contract = platform.serviceContinuityContract;
  const continuity = objectById(requirementModel, "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW");
  const entry = objectById(requirementModel, "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY");
  const open = actionById(requirementModel, "PLAT-ACT-OPEN-SERVICE-CONTINUITY");
  const capture = actionById(requirementModel, "PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY");
  const reconcile = actionById(
    requirementModel,
    "PLAT-ACT-RECONCILE-AND-SEAL-PROTECTED-ACTIVITY-MANIFEST",
  );
  const markFailed = actionById(
    requirementModel,
    "PLAT-ACT-MARK-PROTECTED-ACTIVITY-CAPTURE-FAILED",
  );
  const retry = actionById(
    requirementModel,
    "PLAT-ACT-RETRY-PROTECTED-ACTIVITY-CAPTURE",
  );
  const captureEvent = eventById(
    requirementModel,
    "EVT-PLAT-PROTECTED-ACTIVITY-CAPTURE-REQUESTED",
  );
  const reconcileEvent = eventById(
    requirementModel,
    "EVT-PLAT-PROTECTED-ACTIVITY-MANIFEST-RECONCILE-REQUESTED",
  );

  assert.equal(contract.protectedActivityEntryObjectId, entry.id);
  assert.equal(contract.captureProtectedActivityActionId, capture.id);
  assert.equal(contract.reconcileAndSealActionId, reconcile.id);
  assert.deepEqual(continuity.states, [
    "CAPTURING_PROTECTED_ACTIVITIES",
    "ACTIVITY_PROTECTION_OPEN",
    "CAPTURE_FAILED",
    "EXIT_WINDOW_OPEN",
    "CLOSED",
  ]);
  assert.equal(entry.immutableAfterCreate, true);
  assert.deepEqual(entry.states, ["PROTECTED"]);
  assert.equal(entry.studentDataClassification.kind, "DETAIL");
  assert.deepEqual(
    entry.lineageBindings.map(({ targetObjectId }) => targetObjectId),
    [
      "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
      "HW-OBJ-STUDENT-ACTIVITY-WINDOW",
      "HW-OBJ-ASSIGNMENT",
      "HW-OBJ-PUBLICATION-SNAPSHOT",
    ],
  );
  assert.equal(capture.executionMode, "SYSTEM_EVENT");
  assert.equal(
    capture.relatedStateGuards.find(({ refFieldId }) => (
      refFieldId === "PLAT-PROTECT-F-CONTINUITY-REF"
    )).requiredState,
    "CAPTURING_PROTECTED_ACTIVITIES",
  );
  assert.equal(capture.eligibilityGuard.timeRule, "START_AT_LE_RESTRICTION_LT_DUE_AT");
  assert.equal(capture.eligibilityGuard.protectedUntilRule, "EQUAL_STUDENT_WINDOW_DUE_AT");
  assert.equal(
    open.protectionCoverageGuard.comparison,
    "SCHOOL_PROTECTION_END_GTE_MAX_ELIGIBLE_STUDENT_WINDOW_DUE_AT",
  );
  assert.equal(capture.eligibilityGuard.laterCreatedEntriesAllowed, false);
  assert.equal(capture.captureIdempotencyContract.deliverySemantics, "AT_LEAST_ONCE");
  assert.equal(
    capture.captureIdempotencyContract.duplicateRule,
    "RETURN_EXISTING_ENTRY_WITHOUT_NEW_WRITE_OR_FAILURE_EVENT",
  );
  assert.deepEqual(captureEvent.producerActionIds, [open.id, retry.id]);
  assert.deepEqual(captureEvent.triggeredActionIds, [capture.id]);
  assert.deepEqual(reconcileEvent.producerActionIds, [open.id, capture.id, retry.id]);
  assert.deepEqual(reconcileEvent.triggeredActionIds, [reconcile.id]);
  assert.deepEqual(reconcile.transition, {
    from: "CAPTURING_PROTECTED_ACTIVITIES",
    to: "ACTIVITY_PROTECTION_OPEN",
  });
  assert.equal(
    reconcile.manifestReconciliationContract.zeroEligibleRule,
    "SEAL_ONLY_WHEN_EXPECTED_COUNT_IS_ZERO_AND_BOTH_DIGESTS_EQUAL_CANONICAL_EMPTY_SET_DIGEST",
  );
  assert.equal(reconcile.manifestReconciliationContract.partialSealAllowed, false);
  assert.equal(
    reconcile.manifestReconciliationContract.sealAndRestrictionTimestampRule,
    "WRITE_SAME_ATOMIC_TIMESTAMP",
  );
  assert.deepEqual(markFailed.transition, {
    from: "CAPTURING_PROTECTED_ACTIVITIES",
    to: "CAPTURE_FAILED",
  });
  assert.equal(markFailed.captureFailureContract.restrictionEffectiveAtMustRemain, null);
  assert.deepEqual(retry.transition, {
    from: "CAPTURE_FAILED",
    to: "CAPTURING_PROTECTED_ACTIVITIES",
  });
  assert.equal(retry.captureRetryContract.preserveEligibleSetSnapshot, true);
  assert.equal(
    fieldById(requirementModel, "PLAT-CONT-F-PROTECTED-ACTIVITY-MANIFEST"),
    undefined,
  );
});

test("real activity creation and submission actions carry fail-closed continuity guards", () => {
  const evaluator = actionById(
    requirementModel,
    "PLAT-ACT-EVALUATE-NEW-ACTIVITY-ENTITLEMENT",
  );
  assert.equal(evaluator.targetObjectId, "PLAT-OBJ-SERVICE-PLAN");
  assert.equal(evaluator.failureResults.includes("NOT_FOUND"), false);
  assert.deepEqual(
    evaluator.entitlementDecisionContract.decisionBranches.map((branch) => [
      branch.branchId,
      branch.decisionCode,
      branch.effect,
    ]),
    [
      ["ACTIVE_PLAN_NO_CONTINUITY", "ACTIVE_ALLOW", "ALLOW"],
      ["ACTIVE_PLAN_NON_CLOSED_CONTINUITY", "CONTINUITY_WINDOW_BLOCK", "BLOCK"],
      ["NO_CURRENT_ENTITLEMENT", "NO_ENTITLEMENT_BLOCK", "BLOCK"],
    ],
  );
  assert.equal(evaluator.entitlementDecisionContract.branchesExhaustive, true);
  assert.equal(evaluator.entitlementDecisionContract.unknownDecisionEffect, "BLOCK");
  assert.deepEqual(
    objectById(requirementModel, "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW")
      .states.filter((state) => state !== "CLOSED"),
    [
      "CAPTURING_PROTECTED_ACTIVITIES",
      "ACTIVITY_PROTECTION_OPEN",
      "CAPTURE_FAILED",
      "EXIT_WINDOW_OPEN",
    ],
  );
  assert.equal(
    evaluator.entitlementDecisionContract.decisionBranches
      .find(({ branchId }) => branchId === "ACTIVE_PLAN_NON_CLOSED_CONTINUITY")
      .continuityPredicate,
    "CURRENT_CONTINUITY_WINDOW_STATUS_NOT_CLOSED",
  );

  const guardedActionIds = [
    "HW-ACT-CREATE-DRAFT",
    "HW-ACT-CREATE-REPLACEMENT-DRAFT",
    "HW-ACT-PUBLISH-NOW",
    "HW-ACT-SCHEDULE-PUBLISH",
    "HW-ACT-PUBLISH-SCHEDULED",
    "HW-ACT-PUBLISH-REPLACEMENT",
  ];
  assert.deepEqual(evaluator.entitlementDecisionContract.guardedActionIds, guardedActionIds);
  for (const actionId of guardedActionIds) {
    const action = actionById(requirementModel, actionId);
    const guard = action.commercialEntitlementGuard;
    assert.equal(
      guard.decisionActionId,
      "PLAT-ACT-EVALUATE-NEW-ACTIVITY-ENTITLEMENT",
    );
    assert.equal(guard.sourceObjectId, "PLAT-OBJ-SERVICE-PLAN");
    assert.equal(guard.sourceVersionFieldId, "PLAT-PLAN-F-VERSION");
    assert.equal(guard.requiredSourceState, "ACTIVE");
    assert.equal(guard.protectionWindowAuthorizesNewActivity, false);
    assert.equal(guard.decisionClosure.branchesExhaustive, true);
    assert.equal(
      guard.decisionEvidenceContract.sourceVersionProperty,
      "entitlementSourceVersion",
    );
    assert.ok(action.failureResults.includes("ACTIVITY_ENTITLEMENT_BLOCKED"));
  }

  for (const actionId of ["SUB-ACT-SUBMIT", "SUB-ACT-SUBMIT-PROTECTED", "SUB-ACT-RESUBMIT"]) {
    const action = actionById(requirementModel, actionId);
    assert.equal(action.serviceContinuityOperationCode, "COMPLETE_PUBLISHED_ACTIVITY");
    assert.equal(
      action.serviceContinuityGuard.protectedEntryObjectId,
      "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY",
    );
    assert.equal(action.serviceContinuityGuard.restrictedBehavior, "REQUIRE_EXACT_PROTECTED_ENTRY");
    assert.ok(action.failureResults.includes("SERVICE_CONTINUITY_NOT_PROTECTED"));
  }
});

test("continuing rights bind bidirectionally to real export transfer deletion and support actions", () => {
  const bindings = moduleById(requirementModel, "PLAT-001")
    .serviceContinuityContract.operationBindings;
  const expectedCodes = [
    "COMPLETE_PUBLISHED_ACTIVITY",
    "HISTORICAL_READ",
    "LEGAL_EXPORT",
    "TRANSFER",
    "DELETION",
    "SECURITY_SUPPORT",
  ];
  assert.deepEqual(bindings.map(({ operationCode }) => operationCode), expectedCodes);
  for (const { operationCode, actionIds } of bindings) {
    assert.ok(actionIds.length > 0, operationCode);
    for (const actionId of actionIds) {
      assert.equal(
        actionById(requirementModel, actionId).serviceContinuityOperationCode,
        operationCode,
        actionId,
      );
    }
  }
});

test("destructive mutations fail school and phase-two commercial boundaries", () => {
  const ambiguousCurrentPlan = structuredClone(requirementModel);
  objectById(ambiguousCurrentPlan, "PLAT-OBJ-SERVICE-PLAN")
    .currentEntitlementConstraint.maximumCurrentVersionsPerSchool = 2;
  assertHasCode(ambiguousCurrentPlan, "INVALID_SERVICE_PLAN_ENTITLEMENT");

  const wrongSchoolObject = structuredClone(requirementModel);
  fieldById(wrongSchoolObject, "PLAT-COMM-F-SCHOOL-REF")
    .valueSource.targetObjectId = "ACC-OBJ-SCHOOL-PROFILE";
  assertHasCode(wrongSchoolObject, "INVALID_COMMERCIAL_SCHOOL_BOUNDARY");

  const missingSeparation = structuredClone(requirementModel);
  delete objectById(
    missingSeparation,
    "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY",
  ).referenceSeparationConstraints;
  assertHasCode(missingSeparation, "INVALID_COMMERCIAL_SCHOOL_BOUNDARY");

  const phaseOneLeak = structuredClone(requirementModel);
  moduleById(phaseOneLeak, "PLAT-002").releaseStatus = RELEASE_STATUS.BUILD_READY;
  assertHasCode(phaseOneLeak, "INVALID_PHASE_TWO_COMMERCIAL_ENTITLEMENT");

  const removedMinimum = structuredClone(requirementModel);
  moduleById(removedMinimum, "PLAT-002").phaseTwoEntitlementContract.coreEntitlements.pop();
  assertHasCode(removedMinimum, "INVALID_PHASE_TWO_COMMERCIAL_ENTITLEMENT");
});

test("service-plan recovery requires a new active identity and never revives the old plan", () => {
  const reactivationAllowed = structuredClone(requirementModel);
  moduleById(reactivationAllowed, "PLAT-001").servicePlanEntitlementContract
    .reactivationAllowed = true;
  assertHasCode(reactivationAllowed, "INVALID_SERVICE_PLAN_ENTITLEMENT");

  const oldIdentityReactivated = structuredClone(requirementModel);
  actionById(oldIdentityReactivated, "PLAT-ACT-ACTIVATE-SERVICE-PLAN")
    .transition.from = "RESTRICTED";
  assertHasCode(oldIdentityReactivated, "INVALID_SERVICE_PLAN_ENTITLEMENT");

  const reusedRecoveryIdentity = structuredClone(requirementModel);
  actionById(reusedRecoveryIdentity, "PLAT-ACT-SUPERSEDE-SERVICE-PLAN")
    .recoveryVersionGuard.identityMustDiffer = false;
  assertHasCode(reusedRecoveryIdentity, "INVALID_SERVICE_PLAN_ENTITLEMENT");

  const closedWindowRevivesOldPlan = structuredClone(requirementModel);
  moduleById(closedWindowRevivesOldPlan, "PLAT-001").serviceContinuityContract
    .closedWindowRestoresEntitlement = true;
  assertHasCode(closedWindowRevivesOldPlan, "INVALID_SERVICE_PLAN_ENTITLEMENT");

  const unrestrictedBeforeExit = structuredClone(requirementModel);
  actionById(unrestrictedBeforeExit, "PLAT-ACT-RESTRICT-SERVICE-PLAN")
    .relatedStateGuards[0].requiredState = "CAPTURING_PROTECTED_ACTIVITIES";
  assertHasCode(unrestrictedBeforeExit, "INVALID_SERVICE_PLAN_ENTITLEMENT");
});

test("D090 destructive mutations fail every PLAT GRD PROG and VIDEO consumer boundary", () => {
  const missingConsumerRule = structuredClone(requirementModel);
  delete moduleById(missingConsumerRule, "PLAT-002").phaseTwoEntitlementContract.consumerRule;
  assertHasCode(missingConsumerRule, "INVALID_PHASE_TWO_CORE_CONSUMER_ENTITLEMENT");

  const missingPlatformProgressConsumer = structuredClone(requirementModel);
  moduleById(missingPlatformProgressConsumer, "PLAT-002")
    .phaseTwoEntitlementContract.consumerBindings[0].actionIds = ["GRD-ACT-PROCESS"];
  assertHasCode(missingPlatformProgressConsumer, "INVALID_PHASE_TWO_CORE_CONSUMER_ENTITLEMENT");

  const missingVideoBinding = structuredClone(requirementModel);
  moduleById(missingVideoBinding, "VIDEO-001").phaseTwoCoreEntitlementBindings.pop();
  assertHasCode(missingVideoBinding, "INVALID_PHASE_TWO_CORE_CONSUMER_ENTITLEMENT");

  const wrongGradingGuardVersion = structuredClone(requirementModel);
  actionById(wrongGradingGuardVersion, "GRD-ACT-PROCESS")
    .relatedStateGuards.find(({ refFieldId }) => (
      refFieldId === "GRD-DECISION-F-CORE-ENTITLEMENT-REF"
    )).versionFieldId = "GRD-DECISION-F-DECISION-VERSION";
  assertHasCode(wrongGradingGuardVersion, "INVALID_PHASE_TWO_CORE_CONSUMER_ENTITLEMENT");

  const gradingEvidenceNotPersisted = structuredClone(requirementModel);
  actionById(gradingEvidenceNotPersisted, "GRD-ACT-PROCESS").outputFieldIds =
    actionById(gradingEvidenceNotPersisted, "GRD-ACT-PROCESS").outputFieldIds
      .filter((fieldId) => fieldId !== "GRD-DECISION-F-CORE-ENTITLEMENT-REF");
  assertHasCode(gradingEvidenceNotPersisted, "INVALID_PHASE_TWO_CORE_CONSUMER_ENTITLEMENT");

  const progressFailOpen = structuredClone(requirementModel);
  actionById(progressFailOpen, "PROG-ACT-SYNC-STUDENT-TARGET")
    .phaseTwoEntitlementGuard.requiredEntitlementState = "CONFIRMED";
  assertHasCode(progressFailOpen, "INVALID_PHASE_TWO_CORE_CONSUMER_ENTITLEMENT");

  const videoWrongEntitlementCode = structuredClone(requirementModel);
  actionById(videoWrongEntitlementCode, "VIDEO-ACT-ENSURE-STUDENT-MINIMUM-ENTITLEMENT")
    .phaseTwoEntitlementGuard.entitlementCode = "CORE_AI_ASSESSMENT";
  assertHasCode(videoWrongEntitlementCode, "INVALID_PHASE_TWO_CORE_CONSUMER_ENTITLEMENT");

  const resolverFailOpen = structuredClone(requirementModel);
  actionById(resolverFailOpen, "PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT")
    .activeEntitlementSelectionGuard.missingOrAmbiguousBehavior = "ALLOW_FIRST_MATCH";
  assertHasCode(resolverFailOpen, "INVALID_PHASE_TWO_CORE_CONSUMER_ENTITLEMENT");

  const missingResolverStep = structuredClone(requirementModel);
  missingResolverStep.flows.find(({ id }) => id === "DF-006").steps =
    missingResolverStep.flows.find(({ id }) => id === "DF-006").steps
      .filter(({ actionId }) => actionId !== "PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT");
  assertHasCode(missingResolverStep, "INVALID_PHASE_TWO_CORE_CONSUMER_ENTITLEMENT");
});

test("D090 destructive mutations fail service-plan revalidation and restriction propagation", () => {
  const missingProgressRevalidation = structuredClone(requirementModel);
  delete actionById(missingProgressRevalidation, "PROG-ACT-SYNC-STUDENT-TARGET")
    .phaseTwoEntitlementGuard.sourceServicePlanRevalidation;
  assertHasCode(
    missingProgressRevalidation,
    "INVALID_PHASE_TWO_CORE_CONSUMER_SERVICE_PLAN_REVALIDATION",
  );

  const staleVersionAllowed = structuredClone(requirementModel);
  actionById(staleVersionAllowed, "VIDEO-ACT-ENSURE-STUDENT-MINIMUM-ENTITLEMENT")
    .phaseTwoEntitlementGuard.sourceServicePlanRevalidation
    .currentVersionMustEqualPinnedVersion = false;
  assertHasCode(
    staleVersionAllowed,
    "INVALID_PHASE_TWO_CORE_CONSUMER_SERVICE_PLAN_REVALIDATION",
  );

  const continuityOverride = structuredClone(requirementModel);
  actionById(continuityOverride, "GRD-ACT-PROCESS")
    .phaseTwoEntitlementGuard.sourceServicePlanRevalidation
    .continuityFallback.finiteWindowRequired = false;
  assertHasCode(
    continuityOverride,
    "INVALID_PHASE_TWO_CORE_CONSUMER_SERVICE_PLAN_REVALIDATION",
  );

  const missingFailureCode = structuredClone(requirementModel);
  actionById(missingFailureCode, "VIDEO-ACT-ENSURE-SCHOOL-OVERFLOW-POOL")
    .failureResults = actionById(
      missingFailureCode,
      "VIDEO-ACT-ENSURE-SCHOOL-OVERFLOW-POOL",
    ).failureResults.filter((result) => result !== "PHASE_TWO_SERVICE_PLAN_NOT_ACTIVE");
  assertHasCode(
    missingFailureCode,
    "INVALID_PHASE_TWO_CORE_CONSUMER_SERVICE_PLAN_REVALIDATION",
  );

  const missingRestrictionEvent = structuredClone(requirementModel);
  actionById(missingRestrictionEvent, "PLAT-ACT-RESTRICT-SERVICE-PLAN")
    .producedEventIds = [];
  assertHasCode(
    missingRestrictionEvent,
    "INVALID_PHASE_TWO_ENTITLEMENT_RESTRICTION_PROPAGATION",
  );

  const wrongPriorVersionBinding = structuredClone(requirementModel);
  eventById(wrongPriorVersionBinding, "EVT-PLAT-SERVICE-PLAN-RESTRICTED")
    .servicePlanRestrictionPropagationContract.producerBindings[0]
    .priorServicePlanVersionSource = "RESULTING_VERSION";
  assertHasCode(
    wrongPriorVersionBinding,
    "INVALID_PHASE_TWO_ENTITLEMENT_RESTRICTION_PROPAGATION",
  );

  const missingPropagationStep = structuredClone(requirementModel);
  missingPropagationStep.flows.find(({ id }) => id === "DF-018").steps.pop();
  assertHasCode(
    missingPropagationStep,
    "INVALID_PHASE_TWO_ENTITLEMENT_RESTRICTION_PROPAGATION",
  );

  const reactivationAllowed = structuredClone(requirementModel);
  moduleById(reactivationAllowed, "PLAT-002")
    .phaseTwoEntitlementContract.restrictionPropagation.entitlementReactivationAllowed = true;
  assertHasCode(
    reactivationAllowed,
    "INVALID_PHASE_TWO_ENTITLEMENT_RESTRICTION_PROPAGATION",
  );
});

test("D090 destructive coverage closes field lineage guard dependency and flow identity gaps", () => {
  const mutations = [{
    name: "missing grading entitlement reference field",
    mutate(model) {
      const decision = objectById(model, "GRD-OBJ-DECISION");
      decision.fields = decision.fields
        .filter(({ id }) => id !== "GRD-DECISION-F-CORE-ENTITLEMENT-REF");
    },
  }, {
    name: "missing grading entitlement version field",
    mutate(model) {
      const decision = objectById(model, "GRD-OBJ-DECISION");
      decision.fields = decision.fields
        .filter(({ id }) => id !== "GRD-DECISION-F-CORE-ENTITLEMENT-VERSION");
    },
  }, {
    name: "grading entitlement reference targets the wrong object",
    mutate(model) {
      fieldById(model, "GRD-DECISION-F-CORE-ENTITLEMENT-REF")
        .valueSource.targetObjectId = "PLAT-OBJ-SERVICE-PLAN";
    },
  }, {
    name: "grading entitlement pins the wrong target version field",
    mutate(model) {
      fieldById(model, "GRD-DECISION-F-CORE-ENTITLEMENT-REF")
        .versionBinding.targetVersionFieldId = "PLAT-PLAN-F-VERSION";
    },
  }, {
    name: "grading entitlement lineage is absent",
    mutate(model) {
      const decision = objectById(model, "GRD-OBJ-DECISION");
      decision.lineageBindings = decision.lineageBindings.filter(({ refFieldId }) => (
        refFieldId !== "GRD-DECISION-F-CORE-ENTITLEMENT-REF"
      ));
    },
  }, {
    name: "grading entitlement state guard is absent",
    mutate(model) {
      const action = actionById(model, "GRD-ACT-PROCESS");
      action.relatedStateGuards = action.relatedStateGuards.filter(({ refFieldId }) => (
        refFieldId !== "GRD-DECISION-F-CORE-ENTITLEMENT-REF"
      ));
    },
  }, {
    name: "grading entitlement state guard accepts a non-active entitlement",
    mutate(model) {
      actionById(model, "GRD-ACT-PROCESS").relatedStateGuards
        .find(({ refFieldId }) => (
          refFieldId === "GRD-DECISION-F-CORE-ENTITLEMENT-REF"
        )).requiredState = "CONFIRMED";
    },
  }, {
    name: "grading process does not receive the entitlement reference",
    mutate(model) {
      const action = actionById(model, "GRD-ACT-PROCESS");
      action.inputFieldIds = action.inputFieldIds
        .filter((fieldId) => fieldId !== "GRD-DECISION-F-CORE-ENTITLEMENT-REF");
    },
  }, {
    name: "grading process does not require the same school",
    mutate(model) {
      actionById(model, "GRD-ACT-PROCESS").phaseTwoEntitlementGuard.schoolMustMatch = false;
    },
  }, {
    name: "grading process resolves school from the wrong entitlement field",
    mutate(model) {
      actionById(model, "GRD-ACT-PROCESS")
        .phaseTwoEntitlementGuard.entitlementSchoolRefFieldId = "PLAT-P2ENT-F-SERVICE-PLAN-REF";
    },
  }, {
    name: "grading process omits inactive entitlement failure",
    mutate(model) {
      const action = actionById(model, "GRD-ACT-PROCESS");
      action.failureResults = action.failureResults
        .filter((result) => result !== "PHASE_TWO_ENTITLEMENT_INACTIVE");
    },
  }, {
    name: "grading guard returns the wrong failure result",
    mutate(model) {
      actionById(model, "GRD-ACT-PROCESS")
        .phaseTwoEntitlementGuard.failureResult = "ENTITLEMENT_DECISION_UNAVAILABLE";
    },
  }, {
    name: "grading guard allows non-exact cardinality",
    mutate(model) {
      actionById(model, "GRD-ACT-PROCESS")
        .phaseTwoEntitlementGuard.matchCardinality = "AT_MOST_ONE";
    },
  }, {
    name: "platform omits the grading consumer",
    mutate(model) {
      const binding = moduleById(model, "PLAT-002")
        .phaseTwoEntitlementContract.consumerBindings[0];
      binding.actionIds = binding.actionIds.filter((actionId) => actionId !== "GRD-ACT-PROCESS");
    },
  }, {
    name: "platform omits one video consumer",
    mutate(model) {
      const binding = moduleById(model, "PLAT-002")
        .phaseTwoEntitlementContract.consumerBindings[1];
      binding.actionIds = binding.actionIds.filter((actionId) => (
        actionId !== "VIDEO-ACT-ENSURE-SCHOOL-OVERFLOW-POOL"
      ));
    },
  }, {
    name: "grading module omits its consumer binding",
    mutate(model) {
      delete moduleById(model, "GRD-001").phaseTwoCoreEntitlementBindings;
    },
  }, {
    name: "grading module omits the entitlement dependency",
    mutate(model) {
      const module = moduleById(model, "GRD-001");
      module.dependencyModuleIds = module.dependencyModuleIds
        .filter((moduleId) => moduleId !== "PLAT-002");
    },
  }, {
    name: "assessment flow omits entitlement identity from idempotency",
    mutate(model) {
      const flow = model.flows.find(({ id }) => id === "DF-006");
      flow.idempotencyKeyParts.identityFieldIds = flow.idempotencyKeyParts.identityFieldIds
        .filter((fieldId) => fieldId !== "PLAT-P2ENT-F-ID");
    },
  }, {
    name: "assessment flow omits entitlement version from idempotency",
    mutate(model) {
      const flow = model.flows.find(({ id }) => id === "DF-006");
      flow.idempotencyKeyParts.versionFieldIds = flow.idempotencyKeyParts.versionFieldIds
        .filter((fieldId) => fieldId !== "PLAT-P2ENT-F-VERSION");
    },
  }, {
    name: "assessment flow omits entitlement reference source binding",
    mutate(model) {
      const flow = model.flows.find(({ id }) => id === "DF-006");
      const process = flow.steps.find(({ actionId }) => actionId === "GRD-ACT-PROCESS");
      process.sourceBindings = process.sourceBindings.filter(({ targetFieldId }) => (
        targetFieldId !== "GRD-DECISION-F-CORE-ENTITLEMENT-REF"
      ));
    },
  }, {
    name: "assessment flow omits entitlement version provided input",
    mutate(model) {
      const flow = model.flows.find(({ id }) => id === "DF-006");
      const process = flow.steps.find(({ actionId }) => actionId === "GRD-ACT-PROCESS");
      process.providedInputs = process.providedInputs.filter(({ fieldId }) => (
        fieldId !== "GRD-DECISION-F-CORE-ENTITLEMENT-VERSION"
      ));
    },
  }];

  for (const { name, mutate } of mutations) {
    const model = structuredClone(requirementModel);
    mutate(model);
    assertHasCode(model, "INVALID_PHASE_TWO_CORE_CONSUMER_ENTITLEMENT", name);
  }
});

test("destructive mutations fail protected manifest and activity entitlement guards", () => {
  const mutableEntry = structuredClone(requirementModel);
  objectById(mutableEntry, "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY").immutableAfterCreate = false;
  assertHasCode(mutableEntry, "INVALID_PROTECTED_ACTIVITY_MANIFEST");

  const wrongCaptureState = structuredClone(requirementModel);
  actionById(wrongCaptureState, "PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY")
    .relatedStateGuards.find(({ refFieldId }) => (
      refFieldId === "PLAT-PROTECT-F-ACTIVITY-REF"
    )).requiredState = "DRAFT";
  assertHasCode(wrongCaptureState, "INVALID_PROTECTED_ACTIVITY_MANIFEST");

  const partialSeal = structuredClone(requirementModel);
  actionById(
    partialSeal,
    "PLAT-ACT-RECONCILE-AND-SEAL-PROTECTED-ACTIVITY-MANIFEST",
  ).manifestReconciliationContract.partialSealAllowed = true;
  assertHasCode(partialSeal, "INVALID_PROTECTED_ACTIVITY_MANIFEST");

  const emptySetFailOpen = structuredClone(requirementModel);
  actionById(
    emptySetFailOpen,
    "PLAT-ACT-RECONCILE-AND-SEAL-PROTECTED-ACTIVITY-MANIFEST",
  ).manifestReconciliationContract.zeroEligibleRule = "SEAL_WHEN_COUNT_IS_ZERO";
  assertHasCode(emptySetFailOpen, "INVALID_PROTECTED_ACTIVITY_MANIFEST");

  const truncatedProtection = structuredClone(requirementModel);
  actionById(truncatedProtection, "PLAT-ACT-OPEN-SERVICE-CONTINUITY")
    .protectionCoverageGuard.comparison = "SCHOOL_PROTECTION_END_LT_MAX_DUE_AT";
  assertHasCode(truncatedProtection, "INVALID_SERVICE_CONTINUITY_WINDOW");

  const shortenedStudentWindow = structuredClone(requirementModel);
  actionById(shortenedStudentWindow, "PLAT-ACT-CAPTURE-PROTECTED-ACTIVITY-ENTRY")
    .eligibilityGuard.protectedUntilRule = "TRUNCATE_AT_SCHOOL_PROTECTION_END";
  assertHasCode(shortenedStudentWindow, "INVALID_PROTECTED_ACTIVITY_MANIFEST");

  const restrictionBeforeSeal = structuredClone(requirementModel);
  actionById(restrictionBeforeSeal, "PLAT-ACT-OPEN-SERVICE-CONTINUITY")
    .manifestInitialization.restrictionEffectiveAt = "NOW";
  assertHasCode(restrictionBeforeSeal, "INVALID_SERVICE_CONTINUITY_WINDOW");

  const newActivityFailOpen = structuredClone(requirementModel);
  actionById(newActivityFailOpen, "HW-ACT-CREATE-DRAFT")
    .commercialEntitlementGuard.protectionWindowAuthorizesNewActivity = true;
  assertHasCode(newActivityFailOpen, "INVALID_NEW_ACTIVITY_ENTITLEMENT_GUARD");

  const nonActiveEntitlement = structuredClone(requirementModel);
  actionById(nonActiveEntitlement, "PLAT-ACT-EVALUATE-NEW-ACTIVITY-ENTITLEMENT")
    .entitlementDecisionContract.requiredSourceState = "RESTRICTED";
  assertHasCode(nonActiveEntitlement, "INVALID_NEW_ACTIVITY_ENTITLEMENT_GUARD");

  const capturingFailOpen = structuredClone(requirementModel);
  actionById(capturingFailOpen, "PLAT-ACT-EVALUATE-NEW-ACTIVITY-ENTITLEMENT")
    .entitlementDecisionContract.decisionBranches
    .find(({ branchId }) => branchId === "ACTIVE_PLAN_NON_CLOSED_CONTINUITY")
    .effect = "ALLOW";
  assertHasCode(capturingFailOpen, "INVALID_NEW_ACTIVITY_ENTITLEMENT_GUARD");

  const unguardedScheduledPublish = structuredClone(requirementModel);
  delete actionById(unguardedScheduledPublish, "HW-ACT-PUBLISH-SCHEDULED")
    .commercialEntitlementGuard;
  assertHasCode(unguardedScheduledPublish, "INVALID_NEW_ACTIVITY_ENTITLEMENT_GUARD");

  const noContinuityBlocked = structuredClone(requirementModel);
  actionById(noContinuityBlocked, "PLAT-ACT-EVALUATE-NEW-ACTIVITY-ENTITLEMENT")
    .entitlementDecisionContract.decisionBranches
    .find(({ branchId }) => branchId === "ACTIVE_PLAN_NO_CONTINUITY")
    .decisionCode = "NO_ENTITLEMENT_BLOCK";
  assertHasCode(noContinuityBlocked, "INVALID_NEW_ACTIVITY_ENTITLEMENT_GUARD");

  const missingDecisionEvidence = structuredClone(requirementModel);
  actionById(missingDecisionEvidence, "HW-ACT-CREATE-DRAFT")
    .commercialEntitlementGuard.decisionEvidenceContract.sourceVersionProperty = "omitted";
  assertHasCode(missingDecisionEvidence, "INVALID_NEW_ACTIVITY_ENTITLEMENT_GUARD");
});

test("destructive mutations fail continuing-right action bindings and finite windows", () => {
  const extraSealWriter = structuredClone(requirementModel);
  actionById(
    extraSealWriter,
    "PLAT-ACT-MARK-PROTECTED-ACTIVITY-CAPTURE-FAILED",
  ).outputFieldIds.push("PLAT-CONT-F-MANIFEST-SEALED-AT");
  assertHasCode(extraSealWriter, "INVALID_SERVICE_CONTINUITY_WRITER");

  const extraRestrictionWriter = structuredClone(requirementModel);
  actionById(
    extraRestrictionWriter,
    "PLAT-ACT-RETRY-PROTECTED-ACTIVITY-CAPTURE",
  ).outputFieldIds.push("PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT");
  assertHasCode(extraRestrictionWriter, "INVALID_SERVICE_CONTINUITY_WRITER");

  const alternateOpenTransition = structuredClone(requirementModel);
  actionById(alternateOpenTransition, "PLAT-ACT-CLOSE-SERVICE-CONTINUITY")
    .transition.to = "ACTIVITY_PROTECTION_OPEN";
  assertHasCode(alternateOpenTransition, "INVALID_SERVICE_CONTINUITY_WRITER");

  const unboundExport = structuredClone(requirementModel);
  actionById(unboundExport, "DGV-ACT-REQUEST-EXPORT").serviceContinuityOperationCode = "TRANSFER";
  assertHasCode(unboundExport, "INVALID_SERVICE_CONTINUITY_ACTION_BINDING");

  const undeclaredSupportAction = structuredClone(requirementModel);
  actionById(undeclaredSupportAction, "PLAT-ACT-CLOSE-SUPPORT-CASE")
    .serviceContinuityOperationCode = "SECURITY_SUPPORT";
  assertHasCode(undeclaredSupportAction, "INVALID_SERVICE_CONTINUITY_ACTION_BINDING");

  const unguardedSubmission = structuredClone(requirementModel);
  delete actionById(unguardedSubmission, "SUB-ACT-SUBMIT").serviceContinuityGuard;
  assertHasCode(unguardedSubmission, "INVALID_SERVICE_CONTINUITY_ACTION_BINDING");

  const infiniteService = structuredClone(requirementModel);
  moduleById(infiniteService, "PLAT-001").serviceContinuityContract
    .unlimitedFreeFullServiceAfterTermination = true;
  assertHasCode(infiniteService, "INVALID_SERVICE_CONTINUITY_WINDOW");
});
