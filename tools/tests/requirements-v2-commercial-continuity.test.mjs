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

function assertHasCode(model, code) {
  const errors = validateRequirementModel(model);
  assert.ok(
    errors.some((error) => error.startsWith(code)),
    `${code}\n${errors.join("\n")}`,
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
  });
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
  ]) {
    assert.ok(actionById(requirementModel, actionId).outputFieldIds.includes("PLAT-PLAN-F-VERSION"));
  }
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
      ["ACTIVE_PLAN_CONTINUITY_NOT_SEALED", "ACTIVE_ALLOW", "ALLOW"],
      ["ACTIVE_PLAN_SEALED_RESTRICTION", "RESTRICTED_ALLOW_WITHIN_ENTITLEMENT", "ALLOW"],
      ["NO_CURRENT_ENTITLEMENT", "NO_ENTITLEMENT_BLOCK", "BLOCK"],
    ],
  );
  assert.equal(evaluator.entitlementDecisionContract.branchesExhaustive, true);
  assert.equal(evaluator.entitlementDecisionContract.unknownDecisionEffect, "BLOCK");

  for (const actionId of ["HW-ACT-CREATE-DRAFT", "HW-ACT-CREATE-REPLACEMENT-DRAFT"]) {
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
    .entitlementDecisionContract.requiredSourceState = "CONFIRMED";
  assertHasCode(nonActiveEntitlement, "INVALID_NEW_ACTIVITY_ENTITLEMENT_GUARD");

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
