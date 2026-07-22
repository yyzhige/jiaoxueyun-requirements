import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import { validateRequirementModel } from "../requirements-v2/validate/index.mjs";

function moduleById(id) {
  return requirementModel.modules.find((module) => module.id === id);
}

function objectById(module, id) {
  return module.objects.find((object) => object.id === id);
}

function actionById(module, id) {
  return module.actions.find((action) => action.id === id);
}

function fieldById(object, id) {
  return object.fields.find((field) => field.id === id);
}

function successData(module, actionId) {
  return module.scenarios.find((scenario) => (
    scenario.actionId === actionId && scenario.kind === "SUCCESS"
  ))?.then?.expectedData;
}

function assertInvalid(model, code) {
  const errors = validateRequirementModel(model);
  assert.ok(errors.some((error) => error.startsWith(code)), errors.join("\n"));
}

test("first-stage activity exposes four purposes and six independent status axes", () => {
  const activity = objectById(moduleById("HW-001"), "HW-OBJ-ASSIGNMENT");
  const purpose = fieldById(activity, "HW-ASSIGNMENT-F-PURPOSE");
  assert.equal(purpose.valueSource.optionSetId, "OPT-V2-TL-001");
  const purposeOptionSet = requirementModel.optionSets.find(({ id }) => id === "OPT-V2-TL-001");
  assert.deepEqual(
    purposeOptionSet.values.map(({ code }) => code),
    ["FORMAL_ASSIGNMENT", "DAILY_PRACTICE", "DIAGNOSTIC_ASSESSMENT", "TEACHING_PRESENTATION"],
  );
  assert.deepEqual(activity.statusAxes, [
    "governance",
    "openWindow",
    "archive",
    "participation",
    "time",
    "aiProcessing",
  ]);
  assert.deepEqual(
    activity.fields
      .filter((field) => field.activityStatusAxis)
      .map((field) => field.activityStatusAxis),
    ["governance", "openWindow", "archive", "participation", "time", "aiProcessing"],
  );
  assert.equal(activity.fields.some((field) => field.id === "HW-ASSIGNMENT-F-STATUS"), false);
});

test("activity publication seals one immutable snapshot before publication and splits replacement creation from publication", () => {
  const module = moduleById("HW-001");
  const activity = objectById(module, "HW-OBJ-ASSIGNMENT");
  const snapshotContract = activity.publicationSnapshot;
  const snapshot = objectById(module, "HW-OBJ-PUBLICATION-SNAPSHOT");
  assert.deepEqual(snapshotContract.facetFieldIds, [
    "HW-SNAPSHOT-F-ITEM-VERSION-MANIFEST",
    "HW-SNAPSHOT-F-MATERIAL-RIGHTS-MANIFEST",
    "HW-SNAPSHOT-F-REQUIREMENT-SNAPSHOT",
    "HW-SNAPSHOT-F-PURPOSE",
    "HW-SNAPSHOT-F-HELP-RULE-REF",
    "HW-SNAPSHOT-F-HELP-RULE-VERSION",
  ]);
  assert.deepEqual(snapshot.states, ["SEALED"]);
  assert.ok(snapshot.fields.every(({ mutability }) => mutability === "IMMUTABLE"));
  const createSnapshot = actionById(module, "HW-ACT-CREATE-PUBLICATION-SNAPSHOT");
  assert.equal(createSnapshot.executionMode, "FLOW_INTERNAL");
  assert.ok(snapshot.fields.every(({ id }) => createSnapshot.outputFieldIds.includes(id)));
  const publicationFlow = requirementModel.flows.find(({ id }) => id === "DF-004");
  const orderByActionId = new Map(publicationFlow.steps.map(({ actionId, order }) => [actionId, order]));
  for (const actionId of snapshotContract.bindBeforeActionIds) {
    assert.ok(orderByActionId.get("HW-ACT-CREATE-PUBLICATION-SNAPSHOT") < orderByActionId.get(actionId));
  }
  const publicationEvent = requirementModel.events.find(({ id }) => id === "EVT-HW-PUBLICATION-COMMITTED");
  assert.deepEqual(publicationEvent.producerActionIds, [
    "HW-ACT-PUBLISH-NOW",
    "HW-ACT-PUBLISH-SCHEDULED",
    "HW-ACT-PUBLISH-REPLACEMENT",
  ]);
  assert.deepEqual(publicationEvent.triggeredActionIds, [
    "HW-ACT-CREATE-PUBLISHED-STUDENT-WINDOW",
    "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD",
  ]);
  assert.equal(actionById(module, "HW-ACT-CANCEL-ADMINISTRATIVE").transition.to, "CANCELLED");
  assert.equal(actionById(module, "HW-ACT-CANCEL-CONTENT-RIGHT-ERROR").transition.to, "CANCELLED");
  assert.equal(actionById(module, "HW-ACT-CANCEL-FOR-REPLACEMENT").transition.to, "CANCELLED");
  assert.equal(actionById(module, "HW-ACT-CREATE-REPLACEMENT-DRAFT").operationKind, "CREATE");
  assert.equal(actionById(module, "HW-ACT-PUBLISH-REPLACEMENT").operationKind, "UPDATE");
  assert.match(successData(module, "HW-ACT-CREATE-REPLACEMENT-DRAFT"), /new replacement activity identity/i);
  assert.match(successData(module, "HW-ACT-PUBLISH-REPLACEMENT"), /already-created new replacement activity identity/i);
  assert.match(successData(module, "HW-ACT-VERSION-NON-SEMANTIC-CORRECTION"), /same activity/i);
  assert.match(successData(module, "HW-ACT-VERSION-ASSESSMENT-STANDARD-CORRECTION"), /same activity/i);
  assert.equal(module.actions.some(({ id }) => ["HW-ACT-REVISE", "HW-ACT-REVISE-ITEM"].includes(id)), false);
});

test("closed or cancelled activities enter history while archive remains independent", () => {
  const module = moduleById("HW-001");
  const activity = objectById(module, "HW-OBJ-ASSIGNMENT");
  assert.deepEqual(activity.historyArchivePolicy, {
    automaticHistoryEntryStateIds: ["CLOSED", "CANCELLED"],
    automaticHistoryEntryActionIds: [
      "HW-ACT-CLOSE",
      "HW-ACT-CANCEL-ADMINISTRATIVE",
      "HW-ACT-CANCEL-CONTENT-RIGHT-ERROR",
      "HW-ACT-CANCEL-FOR-REPLACEMENT",
    ],
    archiveFieldId: "HW-ASSIGNMENT-F-ARCHIVE-STATUS",
    archiveWriterActionIds: ["HW-ACT-ARCHIVE", "HW-ACT-UNARCHIVE"],
    archiveOptional: true,
    archiveIndependentFromHistory: true,
    archiveChangesPermissions: false,
    archiveChangesEvidence: false,
  });
  for (const actionId of activity.historyArchivePolicy.automaticHistoryEntryActionIds) {
    assert.match(successData(module, actionId), /automatically includes?.*history/i, actionId);
  }
});

test("teaching presentation has no submission-producing path", () => {
  const activity = objectById(moduleById("HW-001"), "HW-OBJ-ASSIGNMENT");
  assert.deepEqual(activity.presentationRestrictions, {
    producesSubmission: false,
    producesLateness: false,
    producesCompletion: false,
    producesMastery: false,
  });
  const flow = requirementModel.flows.find((candidate) => candidate.id === "DF-005");
  assert.equal(flow.presentationGuard.activityPurpose, "TEACHING_PRESENTATION");
  assert.equal(flow.presentationGuard.behavior, "REJECT_SUBMISSION_PATH");
  const submission = moduleById("SUB-001");
  for (const actionId of ["SUB-ACT-SUBMIT", "SUB-ACT-RESUBMIT"]) {
    const guard = actionById(submission, actionId).activityPurposeGuard;
    assert.deepEqual(guard.deniedPurposeCodes, ["TEACHING_PRESENTATION"]);
    assert.equal(guard.failureResult, "SUBMISSION_NOT_ALLOWED_FOR_PURPOSE");
  }
});

test("late enrollees receive purpose-aware version-pinned activity windows", () => {
  const module = moduleById("HW-001");
  const activity = objectById(module, "HW-OBJ-ASSIGNMENT");
  const window = objectById(module, "HW-OBJ-STUDENT-ACTIVITY-WINDOW");
  const policy = objectById(module, "HW-OBJ-SCHOOL-TIME-POLICY");
  assert.ok(policy);
  assert.equal(window.purposeAwareLateEnrolleeWindow, true);
  assert.deepEqual(
    activity.lateEnrolleeWindowContract.rules.find(({ purposeCode }) => purposeCode === "FORMAL_ASSIGNMENT"),
    {
      purposeCode: "FORMAL_ASSIGNMENT",
      allowedPolicyCodes: ["FORMAL_SCHOOL_FULL_DURATION"],
      durationSourceFieldId: "HW-TIME-POLICY-F-FORMAL-FULL-DURATION-MINUTES",
    },
  );
  const diagnostic = activity.lateEnrolleeWindowContract.rules
    .find(({ purposeCode }) => purposeCode === "DIAGNOSTIC_ASSESSMENT");
  assert.equal(diagnostic.reasonRequired, true);
  assert.deepEqual(diagnostic.allowedPolicyCodes, [
    "DIAGNOSTIC_SHARED_WINDOW",
    "DIAGNOSTIC_INDEPENDENT_WINDOW",
  ]);
  const create = actionById(module, "HW-ACT-CREATE-LATE-ENROLLEE-WINDOW");
  assert.equal(create.operationKind, "CREATE");
  assert.ok(create.outputFieldIds.includes("HW-STUDENT-WINDOW-F-REASON"));
  const homeFlow = requirementModel.flows.find(({ id }) => id === "DF-015");
  assert.ok(homeFlow.sourceDataRefs.some(({ fieldId }) => fieldId === "HW-STUDENT-WINDOW-F-STUDENT-REF"));
  assert.equal(homeFlow.sourceDataRefs.some(({ fieldId }) => fieldId === "HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS"), false);
  assert.deepEqual(homeFlow.idempotencyKeyParts, {
    identityFieldIds: ["HW-ASSIGNMENT-F-ID", "HW-STUDENT-WINDOW-F-ID"],
    versionFieldIds: ["HW-ASSIGNMENT-F-PUBLICATION-VERSION", "HW-STUDENT-WINDOW-F-VERSION"],
    fanoutFieldId: "HW-STUDENT-WINDOW-F-STUDENT-REF",
  });
});

test("accepted attempts preserve originals, untrusted uploads, and help-environment evidence", () => {
  const module = moduleById("SUB-001");
  const attempt = objectById(module, "SUB-OBJ-ATTEMPT");
  const helpFieldIds = [
    "SUB-ATTEMPT-F-ALLOWED-HELP",
    "SUB-ATTEMPT-F-OBSERVED-HELP",
    "SUB-ATTEMPT-F-DECLARED-EXTERNAL-HELP",
    "SUB-ATTEMPT-F-UNKNOWN-HELP-CONDITIONS",
  ];
  assert.deepEqual(new Set(attempt.helpEnvironmentEvidencePolicy.immutableFieldIds), new Set(helpFieldIds));
  assert.equal(attempt.helpEnvironmentEvidencePolicy.unknownMeaning, "INSUFFICIENT_EVIDENCE_ONLY");
  assert.equal(attempt.helpEnvironmentEvidencePolicy.unknownAdverseInference, false);
  assert.equal(
    fieldById(attempt, "SUB-ATTEMPT-F-UNKNOWN-HELP-CONDITIONS").adverseInferencePolicy,
    "FORBIDDEN",
  );
  assert.deepEqual(attempt.untrustedContentPolicy.forbiddenEffects, [
    "SYSTEM_INSTRUCTION",
    "PERMISSION",
    "GOVERNANCE_RULE",
  ]);
  for (const fieldId of helpFieldIds) {
    assert.equal(fieldById(attempt, fieldId).mutability, "IMMUTABLE");
    assert.ok(actionById(module, "SUB-ACT-SUBMIT").outputFieldIds.includes(fieldId));
    assert.ok(actionById(module, "SUB-ACT-RESUBMIT").outputFieldIds.includes(fieldId));
    assert.ok(actionById(module, "SUB-ACT-HANDOFF-ACCEPTED").outputFieldIds.includes(fieldId));
  }
});

test("weak-network intent credential binds actor, activity, fixed manifest, digest, expiry, window, and status", () => {
  const module = moduleById("SUB-001");
  const credential = objectById(module, "SUB-OBJ-INTENT-CREDENTIAL");
  const requiredIds = [
    "SUB-INTENT-F-ACTOR-REF",
    "SUB-INTENT-F-ACTIVITY-REF",
    "SUB-INTENT-F-SUBMISSION-VERSION",
    "SUB-INTENT-F-ISSUED-AT",
    "SUB-INTENT-F-CONTENT-MANIFEST",
    "SUB-INTENT-F-MANIFEST-DIGEST",
    "SUB-INTENT-F-EXPIRES-AT",
    "SUB-INTENT-F-COMPLETION-WINDOW",
    "SUB-INTENT-F-STATUS",
  ];
  for (const id of requiredIds) assert.ok(fieldById(credential, id), id);
  assert.equal(credential.intentCredential, true);
  assert.equal(successData(module, "SUB-ACT-COMPLETE-MANIFEST-INTENT").includes("fixed manifest"), true);
  assert.equal(successData(module, "SUB-ACT-REJECT-MANIFEST-CHANGE").includes("late protection"), true);
  assert.equal(
    successData(module, "SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION")
      .includes("without claiming that a normal credential was issued"),
    true,
  );
});

test("teacher workspace keeps problem, judgment, and linked action separate", () => {
  const module = moduleById("TEA-001");
  for (const id of ["TEA-OBJ-TEACHING-PROBLEM", "TEA-OBJ-TEACHER-JUDGMENT", "TEA-OBJ-LINKED-TEACHING-ACTION"]) {
    assert.ok(objectById(module, id), id);
  }
  assert.equal(successData(module, "TEA-ACT-RECORD-TEACHER-JUDGMENT").includes("does not close"), true);
  assert.match(successData(module, "TEA-ACT-COMPLETE-LINKED-ACTION"), /does not (?:resolve|produce).*mastery|does not.*mastery/i);
  assert.deepEqual(module.coreViews, ["ACTION_QUEUE", "CLASS_INSIGHT", "STUDENT_DETAIL"]);
  assert.equal(module.homeroomBoundary, "COORDINATION_OVERVIEW_ONLY");
});

test("destructive mutations cannot collapse activity axes or weaken the weak-network credential", () => {
  const collapsed = structuredClone(requirementModel);
  const activity = objectById(moduleById("HW-001"), "HW-OBJ-ASSIGNMENT");
  const copyActivity = collapsed.modules.find((module) => module.id === "HW-001").objects
    .find((object) => object.id === "HW-OBJ-ASSIGNMENT");
  copyActivity.statusAxes = ["status"];
  copyActivity.fields = copyActivity.fields.filter((field) => field.activityStatusAxis !== "aiProcessing");
  assertInvalid(collapsed, "INVALID_ACTIVITY_STATUS_AXES");

  const weak = structuredClone(requirementModel);
  const credential = weak.modules.find((module) => module.id === "SUB-001").objects
    .find((object) => object.id === "SUB-OBJ-INTENT-CREDENTIAL");
  credential.fields = credential.fields.filter((field) => field.id !== "SUB-INTENT-F-MANIFEST-DIGEST");
  assertInvalid(weak, "INVALID_WEAK_NETWORK_CREDENTIAL");
  assert.ok(activity);
});

test("destructive mutations cannot bypass activity replacement and correction boundaries", () => {
  const replacement = structuredClone(requirementModel);
  const replacementModule = replacement.modules.find((module) => module.id === "HW-001");
  replacementModule.actions.find((action) => action.id === "HW-ACT-PUBLISH-REPLACEMENT")
    .inputFieldIds = ["HW-ASSIGNMENT-F-TITLE"];
  assertInvalid(replacement, "INVALID_ACTIVITY_REPLACEMENT_CONTRACT");

  const correction = structuredClone(requirementModel);
  const correctionModule = correction.modules.find((module) => module.id === "HW-001");
  correctionModule.actions.find((action) => action.id === "HW-ACT-VERSION-NON-SEMANTIC-CORRECTION")
    .transition.to = "PUBLISHED";
  assertInvalid(correction, "INVALID_ACTIVITY_CORRECTION_CONTRACT");

  const uncancelled = structuredClone(requirementModel);
  uncancelled.modules.find((module) => module.id === "HW-001").actions
    .find((action) => action.id === "HW-ACT-CREATE-REPLACEMENT-DRAFT")
    .relatedStateGuards[0].requiredState = "PUBLISHED";
  assertInvalid(uncancelled, "INVALID_ACTIVITY_REPLACEMENT_CONTRACT");

  const genericRevision = structuredClone(requirementModel);
  const genericModule = genericRevision.modules.find((module) => module.id === "HW-001");
  const genericAction = structuredClone(genericModule.actions
    .find((action) => action.id === "HW-ACT-VERSION-NON-SEMANTIC-CORRECTION"));
  genericAction.id = "HW-ACT-REVISE";
  genericAction.inputFieldIds = ["HW-ASSIGNMENT-F-TITLE"];
  genericModule.actions.push(genericAction);
  assertInvalid(genericRevision, "INVALID_ACTIVITY_CORRECTION_CONTRACT");
});

test("destructive mutations cannot weaken presentation, history, or late-enrollee boundaries", () => {
  const presentation = structuredClone(requirementModel);
  delete presentation.modules.find((module) => module.id === "SUB-001").actions
    .find((action) => action.id === "SUB-ACT-SUBMIT").activityPurposeGuard;
  assertInvalid(presentation, "INVALID_TEACHING_PRESENTATION_CONTRACT");

  const history = structuredClone(requirementModel);
  history.modules.find((module) => module.id === "HW-001").objects
    .find((object) => object.id === "HW-OBJ-ASSIGNMENT")
    .historyArchivePolicy.archiveChangesEvidence = true;
  assertInvalid(history, "INVALID_ACTIVITY_HISTORY_ARCHIVE_CONTRACT");

  const lateEnrollee = structuredClone(requirementModel);
  lateEnrollee.modules.find((module) => module.id === "HW-001").objects
    .find((object) => object.id === "HW-OBJ-ASSIGNMENT")
    .lateEnrolleeWindowContract.rules
    .find(({ purposeCode }) => purposeCode === "DIAGNOSTIC_ASSESSMENT")
    .reasonRequired = false;
  assertInvalid(lateEnrollee, "INVALID_LATE_ENROLLEE_WINDOW_CONTRACT");
});

test("destructive mutations cannot weaken accepted originals, trust, quality, or help evidence", () => {
  const raw = structuredClone(requirementModel);
  raw.modules.find((module) => module.id === "SUB-001").objects
    .find((object) => object.id === "SUB-OBJ-ATTEMPT").fields
    .find((field) => field.id === "SUB-ATTEMPT-F-DRAFT-REF")
    .referenceIntegrity = "IDENTITY_ONLY";
  assertInvalid(raw, "INVALID_RAW_SUBMISSION_FACT_CONTRACT");

  const trust = structuredClone(requirementModel);
  trust.modules.find((module) => module.id === "SUB-001").objects
    .find((object) => object.id === "SUB-OBJ-ATTEMPT")
    .untrustedContentPolicy.forbiddenEffects = ["SYSTEM_INSTRUCTION"];
  assertInvalid(trust, "INVALID_UNTRUSTED_UPLOAD_BOUNDARY");

  const quality = structuredClone(requirementModel);
  quality.modules.find((module) => module.id === "SUB-001").objects
    .find((object) => object.id === "SUB-OBJ-INPUT-QUALITY")
    .forbiddenEffects = ["CORRECTNESS", "LATENESS", "COMPLETION"];
  assertInvalid(quality, "INVALID_INPUT_QUALITY_FACT");

  const help = structuredClone(requirementModel);
  help.modules.find((module) => module.id === "SUB-001").objects
    .find((object) => object.id === "SUB-OBJ-ATTEMPT")
    .helpEnvironmentEvidencePolicy.unknownAdverseInference = true;
  assertInvalid(help, "INVALID_HELP_ENVIRONMENT_EVIDENCE");
});

test("destructive mutations cannot turn rejecting an AI suggestion into problem resolution or mastery", () => {
  const model = structuredClone(requirementModel);
  const module = model.modules.find((candidate) => candidate.id === "TEA-001");
  const reject = actionById(module, "TEA-ACT-RECORD-TEACHER-JUDGMENT");
  reject.targetObjectId = "TEA-OBJ-TEACHING-PROBLEM";
  reject.outputFieldIds.push("TEA-PROBLEM-F-STATUS");
  const complete = actionById(module, "TEA-ACT-COMPLETE-LINKED-ACTION");
  complete.outputFieldIds.push("TEA-PROBLEM-F-MASTERY-STATUS");
  assertInvalid(model, "INVALID_TEACHER_ACTION_SEPARATION");
});

test("student home keeps four compartments and processing delay cannot mutate completion", () => {
  const module = moduleById("APP-001");
  const home = objectById(module, "APP-OBJ-STUDENT-HOME");
  assert.deepEqual(home.compartments, [
    "SCHOOL_REQUIRED",
    "STUDENT_PENDING",
    "SYSTEM_PROCESSING",
    "PERSONAL_OPTIONAL",
  ]);
  assert.equal(home.processingDelayPolicy, "DO_NOT_MUTATE_COMPLETION");
  assert.ok(module.pages.some((page) => page.id === "APP-PAGE-STUDENT-HOME"));

  const mutated = structuredClone(requirementModel);
  mutated.modules.find((candidate) => candidate.id === "APP-001")
    .objects.find((object) => object.id === "APP-OBJ-STUDENT-HOME")
    .processingDelayPolicy = "MUTATE_COMPLETION";
  assertInvalid(mutated, "INVALID_STUDENT_HOME_CONTRACT");

  const attemptBound = structuredClone(requirementModel);
  attemptBound.flows.find((flow) => flow.id === "DF-015")
    .idempotencyKeyParts.versionFieldIds.push("SUB-ATTEMPT-F-SUBMISSION-VERSION");
  assertInvalid(attemptBound, "INVALID_STUDENT_HOME_CONTRACT");
});

test("D008 closes one-purpose constrained-policy matrix and rejects free-form purpose policy drift", () => {
  const module = moduleById("HW-001");
  const activity = objectById(module, "HW-OBJ-ASSIGNMENT");
  assert.deepEqual(
    activity.purposePolicyContract.rules.map(({ purposeCode }) => purposeCode),
    ["FORMAL_ASSIGNMENT", "DAILY_PRACTICE", "DIAGNOSTIC_ASSESSMENT", "TEACHING_PRESENTATION"],
  );
  for (const actionId of [
    "HW-ACT-CREATE-DRAFT",
    "HW-ACT-CREATE-REPLACEMENT-DRAFT",
    "HW-ACT-VALIDATE",
    "HW-ACT-PUBLISH-NOW",
    "HW-ACT-SCHEDULE-PUBLISH",
    "HW-ACT-PUBLISH-SCHEDULED",
    "HW-ACT-PUBLISH-REPLACEMENT",
  ]) {
    assert.equal(actionById(module, actionId).purposePolicyGuard, activity.purposePolicyContract);
  }
  const drift = structuredClone(requirementModel);
  objectById(drift.modules.find(({ id }) => id === "HW-001"), "HW-OBJ-ASSIGNMENT")
    .purposePolicyContract.rules.pop();
  assertInvalid(drift, "INVALID_ACTIVITY_PURPOSE_POLICY_CONTRACT");
});

test("D009 limits diagnostics to internal learning diagnosis and rejects high-impact reuse", () => {
  const module = moduleById("HW-001");
  const activity = objectById(module, "HW-OBJ-ASSIGNMENT");
  const diagnostic = activity.purposePolicyContract.rules
    .find(({ purposeCode }) => purposeCode === "DIAGNOSTIC_ASSESSMENT");
  assert.equal(diagnostic.requiredDiagnosticUseCode, "INTERNAL_LEARNING_DIAGNOSIS");
  assert.equal(diagnostic.highImpactUseAllowed, false);
  assert.deepEqual(actionById(module, "HW-ACT-VALIDATE").diagnosticUseGuard.forbiddenHighImpactUses, [
    "ADMISSIONS_SELECTION",
    "LEGAL_GRADE_CERTIFICATION",
    "HIGH_IMPACT_FORMAL_EXAMINATION",
  ]);
  const widened = structuredClone(requirementModel);
  objectById(widened.modules.find(({ id }) => id === "HW-001"), "HW-OBJ-ASSIGNMENT")
    .purposePolicyContract.rules
    .find(({ purposeCode }) => purposeCode === "DIAGNOSTIC_ASSESSMENT")
    .highImpactUseAllowed = true;
  assertInvalid(widened, "INVALID_DIAGNOSTIC_USE_BOUNDARY");
});

test("D014 cancellation actions return exact unsubmitted, evidence, scope, and downstream effects", () => {
  const module = moduleById("HW-001");
  const expected = new Map([
    ["HW-ACT-CANCEL-ADMINISTRATIVE", ["REMOVE_REQUIRED_TASK", "PRESERVE_VALID", "EMPTY"]],
    ["HW-ACT-CANCEL-CONTENT-RIGHT-ERROR", ["REMOVE_REQUIRED_TASK", "INVALIDATE_AFFECTED_ONLY", "AFFECTED_SOURCE_VERSIONS_ONLY"]],
    ["HW-ACT-CANCEL-FOR-REPLACEMENT", ["REDIRECT_TO_REPLACEMENT", "PRESERVE_WITH_ORIGINAL_ACTIVITY", "EMPTY"]],
  ]);
  for (const [actionId, [unsubmitted, evidence, scope]] of expected) {
    const effects = actionById(module, actionId).cancellationEffects;
    assert.equal(effects.unsubmittedHandlingCode, unsubmitted);
    assert.equal(effects.evidenceDispositionCode, evidence);
    assert.equal(effects.evidenceInvalidationScope, scope);
    assert.ok(effects.downstreamActionCodes.length >= 3);
  }
  const incomplete = structuredClone(requirementModel);
  delete actionById(incomplete.modules.find(({ id }) => id === "HW-001"), "HW-ACT-CANCEL-CONTENT-RIGHT-ERROR")
    .cancellationEffects.evidenceInvalidationScope;
  assertInvalid(incomplete, "INVALID_ACTIVITY_CANCELLATION_EFFECTS");
});

test("D043 exposes fail-closed normal, completed-credential, and platform-failure receipt paths", () => {
  const module = moduleById("SUB-001");
  const attempt = objectById(module, "SUB-OBJ-ATTEMPT");
  const incident = objectById(module, "SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT");
  const credentialRef = fieldById(attempt, "SUB-ATTEMPT-F-INTENT-CREDENTIAL-REF");
  const normal = actionById(module, "SUB-ACT-SUBMIT");
  const protectedSubmit = actionById(module, "SUB-ACT-SUBMIT-PROTECTED");
  const completeIntent = actionById(module, "SUB-ACT-COMPLETE-MANIFEST-INTENT");
  const registerIncident = actionById(module, "SUB-ACT-REGISTER-PLATFORM-FAILURE-INCIDENT");
  const protectFailure = actionById(module, "SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION");
  assert.equal(normal.timelinessContract.source, "SERVER_RECEIPT_ACCEPTED_AT");
  assert.equal(normal.inputFieldIds.includes("SUB-ATTEMPT-F-INTENT-CREDENTIAL-REF"), false);
  assert.equal(normal.inputFieldIds.includes("SUB-ATTEMPT-F-INTENT-CREDENTIAL-VERSION"), false);
  assert.equal(credentialRef.referenceIntegrity, "VERSION_PINNED");
  assert.deepEqual(credentialRef.actionApplicability.requiredActionIds, ["SUB-ACT-SUBMIT-PROTECTED"]);
  assert.deepEqual(protectedSubmit.intentCredentialMatchGuard.requiredStates, [
    "COMPLETED",
    "PLATFORM_FAILURE_PROTECTED",
  ]);
  assert.deepEqual(protectedSubmit.intentCredentialMatchGuard.equalityBindings, [{
    credentialFieldId: "SUB-INTENT-F-ACTIVITY-REF",
    attemptFieldId: "SUB-ATTEMPT-F-ASSIGNMENT-REF",
  }, {
    credentialFieldId: "SUB-INTENT-F-ACTIVITY-VERSION",
    attemptFieldId: "SUB-ATTEMPT-F-ASSIGNMENT-VERSION",
  }, {
    credentialFieldId: "SUB-INTENT-F-PUBLICATION-SNAPSHOT-REF",
    attemptFieldId: "SUB-ATTEMPT-F-PUBLICATION-SNAPSHOT-REF",
  }, {
    credentialFieldId: "SUB-INTENT-F-PUBLICATION-SNAPSHOT-VERSION",
    attemptFieldId: "SUB-ATTEMPT-F-PUBLICATION-SNAPSHOT-VERSION",
  }, {
    credentialFieldId: "SUB-INTENT-F-SUBMISSION-VERSION",
    attemptFieldId: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
  }, {
    credentialFieldId: "SUB-INTENT-F-COMPLETED-MANIFEST-DIGEST",
    attemptFieldId: "SUB-ATTEMPT-F-CONTENT-DIGEST",
  }]);
  assert.equal(
    protectedSubmit.inputFieldIds.includes("SUB-ATTEMPT-F-INTENT-CREDENTIAL-VERSION"),
    true,
  );
  assert.equal(protectedSubmit.timelinessContract.source, "CREDENTIAL_STATE_DEPENDENT");
  assert.deepEqual(
    protectedSubmit.timelinessContract.stateSources.map(({ credentialState, source }) => ({
      credentialState,
      source,
    })),
    [{
      credentialState: "COMPLETED",
      source: "COMPLETED_INTENT_CREDENTIAL_ISSUED_AT",
    }, {
      credentialState: "PLATFORM_FAILURE_PROTECTED",
      source: "PLATFORM_FAILURE_INCIDENT_STARTED_AT",
    }],
  );
  assert.deepEqual(incident.states, ["FROZEN"]);
  assert.equal(registerIncident.executionMode, "SYSTEM_EVENT");
  assert.equal(registerIncident.platformFailureIncidentContract.clientDeclarationAllowed, false);
  assert.equal(protectFailure.platformFailureProtectionContract.actorSource, "SYSTEM_ONLY");
  assert.equal(protectFailure.platformFailureProtectionContract.clientSelfDeclarationAllowed, false);
  assert.ok(protectFailure.inputFieldIds.includes("SUB-INTENT-F-PLATFORM-FAILURE-INCIDENT-VERSION"));
  assert.ok(protectFailure.outputFieldIds.includes("SUB-INTENT-F-PLATFORM-FAILURE-PROTECTION-EXPIRES-AT"));
  assert.equal(
    completeIntent.intentCredentialMatchGuard.failureResult,
    "INTENT_CREDENTIAL_COMPLETION_REJECTED",
  );
  assert.equal(
    completeIntent.failureResults.includes("INTENT_CREDENTIAL_COMPLETION_REJECTED"),
    true,
  );
  assert.ok(module.scenarios.find(({ actionId, resultCode }) => (
    actionId === completeIntent.id
    && resultCode === "INTENT_CREDENTIAL_COMPLETION_REJECTED"
  )));
  const failOpen = structuredClone(requirementModel);
  actionById(failOpen.modules.find(({ id }) => id === "SUB-001"), "SUB-ACT-SUBMIT-PROTECTED")
    .intentCredentialMatchGuard.requiredStates = ["COMPLETED"];
  assertInvalid(failOpen, "INVALID_WEAK_NETWORK_ACCEPTANCE_PATHS");

  const hiddenCompletionFailure = structuredClone(requirementModel);
  const hiddenCompletionAction = actionById(
    hiddenCompletionFailure.modules.find(({ id }) => id === "SUB-001"),
    "SUB-ACT-COMPLETE-MANIFEST-INTENT",
  );
  hiddenCompletionAction.failureResults = hiddenCompletionAction.failureResults
    .filter((code) => code !== "INTENT_CREDENTIAL_COMPLETION_REJECTED");
  assertInvalid(hiddenCompletionFailure, "INVALID_WEAK_NETWORK_ACCEPTANCE_PATHS");

  const reboundCompletionFailure = structuredClone(requirementModel);
  actionById(
    reboundCompletionFailure.modules.find(({ id }) => id === "SUB-001"),
    "SUB-ACT-COMPLETE-MANIFEST-INTENT",
  ).intentCredentialMatchGuard.failureResult = "MANIFEST_DIGEST_MISMATCH";
  assertInvalid(reboundCompletionFailure, "INVALID_WEAK_NETWORK_ACCEPTANCE_PATHS");
});

test("D046 forbids automatic cheating classification from camera, face, recording, gaze, or typing signals", () => {
  const expectedSignals = [
    "CAMERA_MONITORING",
    "FACE_RECOGNITION",
    "CONTINUOUS_SCREEN_RECORDING",
    "GAZE_TRACKING",
    "TYPING_RHYTHM",
  ];
  for (const moduleId of ["HW-001", "SUB-001", "GRD-001"]) {
    assert.deepEqual(moduleById(moduleId).academicIntegrityPolicy.prohibitedSignalSources, expectedSignals);
    assert.equal(moduleById(moduleId).academicIntegrityPolicy.publicOrPermanentIntegrityLabelAllowed, false);
  }
  const weakened = structuredClone(requirementModel);
  weakened.modules.find(({ id }) => id === "GRD-001")
    .academicIntegrityPolicy.prohibitedSignalSources.pop();
  assertInvalid(weakened, "INVALID_ACADEMIC_INTEGRITY_SIGNAL_BOUNDARY");
});

test("Task5 migration records trace publication, weak-network, help, quality, and integrity changes", () => {
  const migrationById = new Map(requirementModel.migrationChanges.map((entry) => [entry.id, entry]));
  const publication = migrationById.get("MIG-012");
  assert.ok(publication.affected.objectIds.includes("HW-OBJ-PUBLICATION-SNAPSHOT"));
  assert.ok(publication.affected.actionIds.includes("HW-ACT-CREATE-PUBLICATION-SNAPSHOT"));
  assert.ok(publication.affected.scenarioIds.includes(
    "HW-ACT-CREATE-PUBLICATION-SNAPSHOT-SCN-SUCCESS",
  ));

  const weakNetwork = migrationById.get("MIG-043");
  assert.ok(weakNetwork.affected.objectIds.includes("SUB-OBJ-INTENT-CREDENTIAL"));
  assert.ok(weakNetwork.affected.actionIds.includes("SUB-ACT-SUBMIT-PROTECTED"));
  assert.ok(weakNetwork.affected.permissionActionIds.includes(
    "SUB-ACT-COMPLETE-MANIFEST-INTENT",
  ));
  assert.ok(weakNetwork.affected.scenarioIds.includes(
    "SUB-ACT-COMPLETE-MANIFEST-INTENT-SCN-INTENT_CREDENTIAL_COMPLETION_REJECTED",
  ));

  const evidence = migrationById.get("MIG-044");
  assert.deepEqual(evidence.decisionIds, ["D044", "D045", "D046"]);
  assert.ok(evidence.affected.objectIds.includes("HW-OBJ-HELP-RULE"));
  assert.ok(evidence.affected.objectIds.includes("SUB-OBJ-INPUT-QUALITY"));
  assert.ok(evidence.affected.testIds.includes("INVALID_ACADEMIC_INTEGRITY_SIGNAL_BOUNDARY"));
});

test("teaching presentations cannot create APP homework todos or local completion evidence", () => {
  const appModule = moduleById("APP-001");
  const todo = objectById(appModule, "APP-OBJ-TODO");
  const createTodo = actionById(appModule, "APP-ACT-CREATE-HOMEWORK-TODO");
  assert.deepEqual(createTodo.activityPurposeGuard.deniedPurposeCodes, ["TEACHING_PRESENTATION"]);
  assert.equal(todo.evidenceBoundary.teachingPresentationTodoAllowed, false);
  assert.equal(todo.evidenceBoundary.localProgressIsActivityCompletion, false);
  const bypass = structuredClone(requirementModel);
  delete actionById(bypass.modules.find(({ id }) => id === "APP-001"), "APP-ACT-CREATE-HOMEWORK-TODO")
    .activityPurposeGuard;
  assertInvalid(bypass, "INVALID_TEACHING_PRESENTATION_TODO_BOUNDARY");
});

test("per-student participation and time axes have explicit window writers", () => {
  const module = moduleById("HW-001");
  const window = objectById(module, "HW-OBJ-STUDENT-ACTIVITY-WINDOW");
  assert.equal(fieldById(window, "HW-STUDENT-WINDOW-F-PARTICIPATION-STATUS").activityStatusAxis, "participation");
  assert.equal(fieldById(window, "HW-STUDENT-WINDOW-F-TIME-STATUS").activityStatusAxis, "time");
  for (const actionId of [
    "HW-ACT-CREATE-PUBLISHED-STUDENT-WINDOW",
    "HW-ACT-CREATE-LATE-ENROLLEE-WINDOW",
  ]) {
    const createWindow = actionById(module, actionId);
    assert.ok(createWindow.outputFieldIds.includes("HW-STUDENT-WINDOW-F-PARTICIPATION-STATUS"));
    assert.ok(createWindow.outputFieldIds.includes("HW-STUDENT-WINDOW-F-TIME-STATUS"));
    assert.equal(createWindow.statusAxisInitialization.participationByPurpose.TEACHING_PRESENTATION, "NO_SUBMISSION_EXPECTED");
  }
  for (const actionId of [
    "HW-ACT-MARK-STUDENT-WINDOW-IN-PROGRESS",
    "HW-ACT-MARK-STUDENT-WINDOW-SUBMITTED",
    "HW-ACT-ADVANCE-STUDENT-WINDOW-TIME",
  ]) {
    assert.ok(actionById(module, actionId).axisMutation);
  }
  const missingWriter = structuredClone(requirementModel);
  const copyModule = missingWriter.modules.find(({ id }) => id === "HW-001");
  copyModule.actions = copyModule.actions.filter(({ id }) => id !== "HW-ACT-MARK-STUDENT-WINDOW-SUBMITTED");
  assertInvalid(missingWriter, "INVALID_PER_STUDENT_STATUS_AXIS_WRITER");
});
