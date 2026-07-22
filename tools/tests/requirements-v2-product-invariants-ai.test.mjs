import test from "node:test";
import assert from "node:assert/strict";

import { PHASE, RELEASE_STATUS } from "../requirements-v2/model.mjs";
import { requirementModel } from "../requirements-v2/facts/index.mjs";
import { validateRequirementModel } from "../requirements-v2/validate/index.mjs";

const ASSESSMENT_MODULE_IDS = ["GRD-001", "PUB-001", "CORR-001", "AIX-001"];
const RESULT_AXES = [
  "PROCESSING_STATUS",
  "PUBLICATION_STATUS",
  "DISPUTE_CORRECTION_STATUS",
  "VALIDITY_STATUS",
];
const NEXT_STEPS = [
  "COMPLETED",
  "CORRECTION_REQUIRED",
  "MORE_INPUT_REQUIRED",
  "UNABLE_TO_DETERMINE",
  "EXCEPTION_REVIEW_REQUIRED",
];
const FEEDBACK_LAYERS = [
  "RESULT_AND_ERROR_LOCATION",
  "NON_ANSWER_SCAFFOLD",
  "TARGETED_TEACHING",
  "COMPLETE_ANSWER_AND_SOLUTION",
];
const ANSWER_SURFACES = [
  "PAGE",
  "SEARCH",
  "EXPORT",
  "NOTIFICATION",
  "AI_CONVERSATION",
  "VIDEO",
  "CACHE",
  "DIRECT_LINK",
];
const ASSESSMENT_STANDARD_EVENT_ID = "EVT-HW-PUBLICATION-COMMITTED";
const STUDENT_ANSWER_ACTION_IDS = [
  "SUB-ACT-SAVE-DRAFT",
  "SUB-ACT-UPLOAD-CHUNK",
  "SUB-ACT-RETRY-UPLOAD",
  "SUB-ACT-SUBMIT",
];

function moduleById(model, id) {
  return model.modules.find((module) => module.id === id);
}

function objectById(model, id) {
  return model.modules.flatMap(({ objects }) => objects).find((object) => object.id === id);
}

function fieldById(model, id) {
  return model.modules
    .flatMap(({ objects }) => objects)
    .flatMap(({ fields }) => fields)
    .find((field) => field.id === id);
}

function actionById(model, id) {
  return model.modules.flatMap(({ actions }) => actions).find((action) => action.id === id);
}

function errorsAfter(mutate) {
  const model = structuredClone(requirementModel);
  mutate(model);
  return validateRequirementModel(model).join("\n");
}

test("models AI assessment and completion determination as complete planned phase-two contracts", () => {
  for (const id of ASSESSMENT_MODULE_IDS) {
    const module = moduleById(requirementModel, id);
    assert.equal(module.phase, PHASE.SECOND, id);
    assert.equal(module.releaseStatus, RELEASE_STATUS.PLANNED, id);
    assert.ok(module.pages.length > 0, id);
    assert.ok(module.pages.every(({ availability }) => availability === RELEASE_STATUS.PLANNED), id);
  }

  const terminology = requirementModel.terminology.find(({ id }) => id === "TERM-AI-ASSESSMENT");
  assert.equal(terminology.canonical, "AI 评定与完成判定");
  const teachingSurface = ASSESSMENT_MODULE_IDS
    .map((id) => JSON.stringify(moduleById(requirementModel, id)))
    .join("\n");
  assert.doesNotMatch(teachingSurface, /(?:日常|例行|常规).{0,12}审批|审批.{0,12}(?:日常|例行|常规)/u);
});

test("keeps phase-one submission independent while sharing the real publication event with phase two", () => {
  for (const actionId of STUDENT_ANSWER_ACTION_IDS) {
    assert.equal(
      Object.hasOwn(actionById(requirementModel, actionId), "assessmentStandardGate"),
      false,
      actionId,
    );
  }
  const publicationEvent = requirementModel.events.find(({ id }) => (
    id === ASSESSMENT_STANDARD_EVENT_ID
  ));
  assert.deepEqual(publicationEvent.producerActionIds, [
    "HW-ACT-PUBLISH-NOW",
    "HW-ACT-PUBLISH-SCHEDULED",
    "HW-ACT-PUBLISH-REPLACEMENT",
  ]);
  assert.deepEqual(publicationEvent.triggeredActionIds, [
    "HW-ACT-CREATE-PUBLISHED-STUDENT-WINDOW",
    "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD",
  ]);
  for (const actionId of publicationEvent.producerActionIds) {
    assert.ok(actionById(requirementModel, actionId).producedEventIds.includes(
      ASSESSMENT_STANDARD_EVENT_ID,
    ), actionId);
  }
  assert.equal(
    actionById(requirementModel, "HW-ACT-SCHEDULE-PUBLISH").producedEventIds
      ?.includes(ASSESSMENT_STANDARD_EVENT_ID) ?? false,
    false,
  );
  assert.equal(
    moduleById(requirementModel, "GRD-001")
      .assessmentStandardContract.phaseOneSubmissionDependency,
    "NONE",
  );
});

test("declares a fail-closed publication-snapshot consumer interface for assessment standards", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  assert.deepEqual(grading.assessmentStandardContract.sourceSnapshotInterface, {
    objectId: "HW-OBJ-PUBLICATION-SNAPSHOT",
    identityFieldId: "HW-SNAPSHOT-F-ID",
    versionFieldId: "HW-SNAPSHOT-F-VERSION",
    producerActionId: "HW-ACT-CREATE-PUBLICATION-SNAPSHOT",
    producerEventId: "EVT-HW-PUBLICATION-COMMITTED",
    requiredState: "SEALED",
    resolutionRequiredBeforeExecution: true,
  });
  for (const actionId of [
    "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD",
    "GRD-ACT-CHECK-PHASE-TWO-ASSESSMENT-READINESS",
  ]) {
    const action = actionById(requirementModel, actionId);
    assert.equal(action.publicationSnapshotGuard.failClosed, true, actionId);
    assert.equal(action.publicationSnapshotGuard.executionAllowedWithoutResolvedSource, false, actionId);
    assert.ok(action.inputFieldIds.length >= 2, actionId);
    assert.ok(action.outputFieldIds.includes("GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF"), actionId);
    assert.ok(action.outputFieldIds.includes("GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION"), actionId);
  }
});

test("separates AI result state axes and returns one explicit next step", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  assert.deepEqual(grading.aiAssessmentContract.statusAxes.map(({ axis }) => axis), RESULT_AXES);
  assert.deepEqual(grading.aiAssessmentContract.nextStep.values, NEXT_STEPS);
  assert.equal(grading.aiAssessmentContract.nextStep.requiredForEverySubmission, true);
  for (const axis of grading.aiAssessmentContract.statusAxes) {
    const field = fieldById(requirementModel, axis.fieldId);
    assert.ok(field, axis.fieldId);
    assert.equal(field.valueSource.optionSetId, axis.optionSetId);
  }
  assert.equal(
    fieldById(requirementModel, grading.aiAssessmentContract.nextStep.fieldId)
      .valueSource.optionSetId,
    grading.aiAssessmentContract.nextStep.optionSetId,
  );
});

test("restricts each next-step writer and never completes an explicit dont-know attempt", () => {
  const nextStep = moduleById(requirementModel, "GRD-001").aiAssessmentContract.nextStep;
  assert.deepEqual(nextStep.writerOutcomeMatrix["GRD-ACT-ROUTE-UNSUPPORTED"], [
    "MORE_INPUT_REQUIRED",
    "UNABLE_TO_DETERMINE",
  ]);
  assert.deepEqual(nextStep.writerOutcomeMatrix["GRD-ACT-ROUTE-AI-UNAVAILABLE"], [
    "UNABLE_TO_DETERMINE",
    "EXCEPTION_REVIEW_REQUIRED",
  ]);
  assert.equal(
    nextStep.initialAttemptOutcomeMatrix.EXPLICIT_DONT_KNOW.includes("COMPLETED"),
    false,
  );
  for (const [actionId, codes] of Object.entries(nextStep.writerOutcomeMatrix)) {
    const action = actionById(requirementModel, actionId);
    const write = action.statusWrites.find(({ fieldId }) => (
      fieldId === "GRD-DECISION-F-NEXT-STEP"
    ));
    assert.deepEqual(write.codes, codes, actionId);
    assert.deepEqual(action.nextStepOutcomeContract.allowedCodes, codes, actionId);
    assert.equal(action.nextStepOutcomeContract.explicitDontKnowMayWriteCompleted, false, actionId);
  }
});

test("version-binds the initial attempt classification into every assessment writer", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  const binding = grading.initialValidAttemptContract.decisionBinding;
  const decision = objectById(requirementModel, binding.decisionObjectId);
  const ref = decision.fields.find(({ id }) => id === binding.refFieldId);
  assert.equal(ref.referenceIntegrity, "VERSION_PINNED");
  assert.equal(ref.valueSource.targetObjectId, "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION");
  assert.equal(ref.versionBinding.versionFieldId, binding.versionFieldId);
  assert.equal(ref.versionBinding.targetVersionFieldId, binding.targetVersionFieldId);
  for (const actionId of binding.boundBeforeActionIds) {
    const action = actionById(requirementModel, actionId);
    assert.ok(action.inputFieldIds.includes(binding.refFieldId), actionId);
    assert.ok(action.inputFieldIds.includes(binding.versionFieldId), actionId);
    assert.equal(action.initialAttemptClassificationBinding.exactVersionRequired, true, actionId);
    assert.ok(action.relatedStateGuards.some((guard) => (
      guard.refFieldId === binding.refFieldId
      && guard.versionFieldId === binding.versionFieldId
      && guard.requiredState === "CLASSIFIED"
    )), actionId);
  }
  const flow = requirementModel.flows.find(({ id }) => id === "DF-006");
  const enqueue = flow.steps.find(({ actionId }) => actionId === "GRD-ACT-ENQUEUE");
  assert.deepEqual(enqueue.sourceBindings, [
    {
      sourceObjectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
      sourceFieldId: "GRD-ATTEMPT-CLASS-F-ID",
      targetFieldId: binding.refFieldId,
    },
    {
      sourceObjectId: "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
      sourceFieldId: "GRD-ATTEMPT-CLASS-F-VERSION",
      targetFieldId: binding.versionFieldId,
    },
  ]);
});

test("binds every AI result axis and determined next step to concrete writers", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  const publication = moduleById(requirementModel, "PUB-001");
  const writerContracts = [
    ...grading.aiAssessmentContract.statusAxisWriters,
    ...publication.resultAxisWriterContract,
  ];
  assert.deepEqual(
    requirementModel.optionSets
      .find(({ id }) => id === "OPT-AI2-001").values.map(({ code }) => code),
    ["QUEUED", "PROCESSING", "SUCCEEDED", "FAILED"],
  );
  for (const { fieldId, writerActionIds } of writerContracts) {
    assert.equal(fieldById(requirementModel, fieldId).required, true, fieldId);
    assert.ok(writerActionIds.length > 0, fieldId);
    for (const actionId of writerActionIds) {
      assert.ok(actionById(requirementModel, actionId).outputFieldIds.includes(fieldId), `${actionId}:${fieldId}`);
    }
  }
  const nextStep = grading.aiAssessmentContract.nextStep;
  assert.equal(nextStep.requiredForEveryDeterminedResult, true);
  assert.deepEqual(nextStep.allowedNoValueStates, ["QUEUED", "PROCESSING"]);
  assert.ok(nextStep.writerActionIds.length >= 3);
  for (const actionId of nextStep.writerActionIds) {
    assert.ok(actionById(requirementModel, actionId).outputFieldIds.includes(nextStep.fieldId), actionId);
  }
  assert.equal(actionById(requirementModel, "GRD-ACT-PROCESS").outputFieldIds.includes(nextStep.fieldId), false);
});

test("fails AI publication closed and keeps unable-to-determine out of routine teacher assessment", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  assert.deepEqual(
    grading.aiAssessmentContract.unableToDetermine.stages,
    [
      "SOURCE_QUALITY_CHECK",
      "CONCRETE_SUPPLEMENT_REQUEST",
      "PERMITTED_ALTERNATE_REVIEW",
      "PROFESSIONAL_EXCEPTION_QUEUE",
    ],
  );
  assert.equal(grading.aiAssessmentContract.unableToDetermine.routineTeacherAssessment, false);
  assert.equal(grading.aiAssessmentContract.unableToDetermine.unresolvedState, "UNPUBLISHED_UNDECIDED");

  const publication = moduleById(requirementModel, "PUB-001");
  assert.deepEqual(
    publication.aiPublicationContract.requiredGates,
    ["PERMISSION", "SAFETY", "TEACHING_CORRECTNESS"],
  );
  assert.equal(publication.aiPublicationContract.failureBehavior, "KEEP_UNPUBLISHED");
  const publish = actionById(requirementModel, "PUB-ACT-PUBLISH-RESULT");
  assert.deepEqual(
    new Set(publish.gateEvaluation.gateFieldIds),
    new Set(publication.aiPublicationContract.gateFieldIds),
  );
  assert.equal(publication.aiPublicationContract.gateFieldIds.every((fieldId) => (
    publish.outputFieldIds.includes(fieldId)
  )), true);
  for (const code of [
    "PERMISSION_GATE_FAILED",
    "SAFETY_GATE_FAILED",
    "TEACHING_CORRECTNESS_GATE_FAILED",
    "GATE_UNAVAILABLE",
  ]) assert.ok(publish.failureResults.includes(code), code);
});

test("preserves superseded versions through batch impact location, notification, and recalculation", () => {
  const publication = moduleById(requirementModel, "PUB-001");
  assert.deepEqual(publication.batchCorrectionContract.steps, [
    "LOCATE_AFFECTED_RESULTS",
    "FREEZE_CURRENT_DERIVED_USE",
    "REVIEW_CAUSE_AND_SCOPE",
    "RECALCULATE_DERIVED_RESULTS",
    "NOTIFY_AFFECTED_USERS",
  ]);
  assert.equal(publication.batchCorrectionContract.preserveOriginalFacts, true);
  assert.equal(publication.batchCorrectionContract.preserveSupersededResultVersions, true);
  for (const actionId of publication.batchCorrectionContract.actionIds) {
    assert.ok(actionById(requirementModel, actionId), actionId);
  }
  const flow = requirementModel.flows.find(({ id }) => id === "DF-009");
  assert.equal(flow.notificationBoundary.eventId, publication.batchCorrectionContract.notificationEventId);
  assert.equal(
    requirementModel.events.find(({ id }) => id === flow.notificationBoundary.eventId)
      .producerActionIds[0],
    flow.notificationBoundary.producerActionId,
  );
});

test("opens phase-two assessment only for an exact pre-answer frozen standard", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  const contract = grading.assessmentStandardContract;
  const standard = objectById(requirementModel, contract.objectId);
  const boundStandardVersion = fieldById(requirementModel, "GRD-DECISION-F-RUBRIC-VERSION");
  assert.deepEqual(standard.states, ["FROZEN"]);
  assert.equal(boundStandardVersion.dataType, "INTEGER");
  assert.equal(contract.generatedBeforeStudentAnswer, true);
  assert.equal(contract.immutableAfterGeneration, true);
  assert.equal(contract.scoreOrLevelOptional, true);
  assert.equal(contract.defaultIdentifiedCompositeRankingAllowed, false);
  for (const fieldId of contract.requiredContentFieldIds) {
    assert.equal(standard.fields.find(({ id }) => id === fieldId).mutability, "IMMUTABLE", fieldId);
  }
  assert.deepEqual(contract.phaseTwoActivationGate, {
    enforcementBoundary: "PHASE_TWO_ACTIVITY_ACTIVATION",
    actionId: "GRD-ACT-CHECK-PHASE-TWO-ASSESSMENT-READINESS",
    flowIds: ["DF-006"],
    sourceSnapshotRequired: true,
    frozenStandardRequired: true,
    requiredStandardState: "FROZEN",
    sourceSnapshotMatch: "EXACT_ACTIVITY_SNAPSHOT_ID_AND_VERSION",
    standardFrozenBeforeFirstAnswerRequired: true,
    successResult: "PHASE_TWO_ASSESSMENT_READY",
    failureBehavior: "KEEP_PHASE_TWO_ASSESSMENT_UNAVAILABLE",
    phaseOneSubmissionActionIds: [],
    phaseOneSubmissionBlocked: false,
    failClosedForPhaseTwoActivation: true,
  });
  assert.deepEqual(
    actionById(requirementModel, contract.phaseTwoActivationGate.actionId)
      .phaseTwoReadinessGate,
    {
      requiredState: "FROZEN",
      sourceSnapshotMatch: "EXACT_ACTIVITY_SNAPSHOT_ID_AND_VERSION",
      standardFrozenBeforeFirstAnswerRequired: true,
      successResult: "PHASE_TWO_ASSESSMENT_READY",
      failureBehavior: "KEEP_PHASE_TWO_ASSESSMENT_UNAVAILABLE",
      phaseOneSubmissionBlocked: false,
    },
  );
  assert.ok(requirementModel.flows.find(({ id }) => id === "DF-006").steps.some(({ actionId }) => (
    actionId === contract.phaseTwoActivationGate.actionId
  )));
  assert.equal(
    actionById(requirementModel, "GRD-ACT-PROCESS")
      .assessmentStandardBinding.matchMode,
    "EXACT_SUBMISSION_BOUND_VERSION",
  );
});

test("defines four feedback layers, valid attempts, and post-answer remedial evidence", () => {
  const publication = moduleById(requirementModel, "PUB-001");
  assert.deepEqual(publication.feedbackContract.layers, FEEDBACK_LAYERS);
  assert.equal(publication.feedbackContract.completeAnswerRequiresOpenPolicy, true);

  const correction = moduleById(requirementModel, "CORR-001");
  assert.deepEqual(correction.validAttemptContract.valid, [
    "SUBSTANTIVE_RESPONSE",
    "EXPLICIT_DONT_KNOW",
  ]);
  assert.deepEqual(correction.validAttemptContract.invalid, [
    "BLANK",
    "UNRELATED",
    "PLACEHOLDER",
  ]);
  assert.equal(correction.validAttemptContract.explicitDontKnowMeansCompleted, false);
  assert.equal(correction.validAttemptContract.explicitDontKnowUnlocksCompleteAnswer, false);
  assert.equal(correction.answerExposedEvidenceContract.independentEvidence, false);
  assert.equal(correction.answerExposedEvidenceContract.evidenceKind, "REMEDIAL_AFTER_ANSWER_EXPOSURE");
});

test("materializes every feedback layer and independent open time through declared writers", () => {
  const publication = moduleById(requirementModel, "PUB-001");
  const materialize = actionById(requirementModel, publication.feedbackContract.materializeActionId);
  const expectedFields = [
    ...Object.values(publication.feedbackContract.layerFieldBindings),
    ...Object.values(publication.answerOpenContract.fieldBindings),
    ...publication.answerOpenContract.policyFieldIds,
  ];
  assert.deepEqual(publication.feedbackContract.validAttemptFieldIds, [
    "GRD-ATTEMPT-CLASS-F-CLASSIFICATION",
    "CORR-ASSESSMENT-F-VALID-ATTEMPT",
  ]);
  for (const fieldId of expectedFields) {
    assert.ok(materialize.outputFieldIds.includes(fieldId), fieldId);
  }
});

test("uses one answer-open policy across every delivery surface with access-time reauthorization", () => {
  const publication = moduleById(requirementModel, "PUB-001");
  assert.deepEqual(publication.answerOpenContract.independentTimes, [
    "ANSWER_OPEN_AT",
    "SOLUTION_OPEN_AT",
    "RUBRIC_OPEN_AT",
  ]);
  assert.deepEqual(publication.answerOpenContract.surfaces, ANSWER_SURFACES);
  assert.equal(publication.answerOpenContract.sharedPolicy, true);
  assert.equal(publication.answerOpenContract.reauthorizeEveryAccess, true);
  assert.deepEqual(
    publication.answerOpenContract.enforcementBindings.map(({ surface }) => surface),
    ANSWER_SURFACES,
  );
  assert.equal(publication.answerOpenContract.enforcementBindings.every((binding) => (
    binding.reauthorizeAtAccess === true
    && binding.beforeOpenBehavior === (
      binding.surface === "NOTIFICATION"
        ? "STRIP_RESTRICTED_CONTENT_AND_DELIVER_SAFE_SUMMARY"
        : "WITHHOLD_RESTRICTED_CONTENT"
    )
    && (binding.actionIds?.length > 0 || binding.policyPointId)
  )), true);

  const aix = moduleById(requirementModel, "AIX-001");
  assert.equal(aix.answerOpenEnforcement.policyId, publication.answerOpenContract.policyId);
  assert.equal(aix.answerOpenEnforcement.surface, "AI_CONVERSATION");
  assert.equal(aix.answerOpenEnforcement.reauthorizeEveryAccess, true);
});

test("binds every answer-open surface to real reauthorizing actions", () => {
  const contract = moduleById(requirementModel, "PUB-001").answerOpenContract;
  for (const binding of contract.enforcementBindings) {
    assert.equal(binding.enforcementKind, "ACTION", binding.surface);
    assert.equal(Object.hasOwn(binding, "policyPointId"), false, binding.surface);
    assert.ok(binding.actionIds.length > 0, binding.surface);
    for (const actionId of binding.actionIds) {
      const enforcement = actionById(requirementModel, actionId).answerOpenEnforcement;
      assert.equal(enforcement.reauthorizeAtAccess, true, `${binding.surface}:${actionId}`);
      assert.ok(enforcement.surfaces.includes(binding.surface), `${binding.surface}:${actionId}`);
      assert.deepEqual(enforcement.policyFieldIds, contract.policyFieldIds);
      assert.deepEqual(enforcement.openTimeFieldIds, Object.values(contract.fieldBindings));
    }
  }
});

test("models student challenge professional evidence and version-preserving result resolution", () => {
  const publication = moduleById(requirementModel, "PUB-001");
  const challenge = objectById(requirementModel, "PUB-OBJ-RESULT-CHALLENGE");
  assert.deepEqual(challenge.states, ["OPEN", "EVIDENCE_SUBMITTED", "RESOLVED"]);
  assert.deepEqual(publication.challengeCorrectionContract.resolutionActionIds, [
    "PUB-ACT-CORRECT-CHALLENGED-RESULT",
    "PUB-ACT-REPLACE-RESULT",
    "PUB-ACT-INVALIDATE-RESULT",
    "PUB-ACT-UPHOLD-RESULT",
  ]);
  assert.equal(publication.challengeCorrectionContract.preservePriorResultVersions, true);
  assert.equal(publication.challengeCorrectionContract.originalFactOverwriteAllowed, false);
  assert.equal(actionById(requirementModel, "PUB-ACT-OPEN-RESULT-CHALLENGE").operationKind, "CREATE");
  assert.equal(
    actionById(requirementModel, "PUB-ACT-SUBMIT-PROFESSIONAL-EVIDENCE")
      .authorizationBoundary.kind,
    "SUBJECT_COURSE_PROFESSIONAL_WRITE",
  );
  for (const actionId of publication.challengeCorrectionContract.resolutionActionIds) {
    const outputs = actionById(requirementModel, actionId).outputFieldIds;
    assert.ok(outputs.includes("PUB-RESULT-F-PRIOR-RESULT-VERSION"), actionId);
    assert.ok(outputs.includes("PUB-RESULT-F-RESULT-VERSION"), actionId);
    assert.ok(outputs.includes("PUB-RESULT-F-DISPUTE-CORRECTION-STATUS"), actionId);
  }
});

test("classifies initial submissions without treating explicit dont-know as completion or mastery", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  const contract = grading.initialValidAttemptContract;
  assert.equal(contract.sourceObjectId, "SUB-OBJ-ATTEMPT");
  assert.equal(contract.classificationObjectId, "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION");
  assert.equal(contract.classifyActionId, "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT");
  assert.deepEqual(contract.valid, ["SUBSTANTIVE_RESPONSE", "EXPLICIT_DONT_KNOW"]);
  assert.deepEqual(contract.invalid, ["BLANK", "UNRELATED", "PLACEHOLDER"]);
  assert.equal(contract.explicitDontKnowMeansCompleted, false);
  assert.equal(contract.explicitDontKnowCreatesMasteryEvidence, false);
  assert.equal(contract.nextStepDeterminedBy, "EVIDENCE_AND_FROZEN_ASSESSMENT_STANDARD");
  const classify = actionById(requirementModel, contract.classifyActionId);
  assert.equal(classify.outputFieldIds.includes("GRD-DECISION-F-NEXT-STEP"), false);
  assert.equal(classify.outputFieldIds.includes("INS-EVIDENCE-F-MASTERY-STATUS"), false);
});

test("separates original learning facts from derived judgments and persists no hidden chain of thought", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  assert.deepEqual(grading.dataSeparationContract.originalFactObjectIds, [
    "SUB-OBJ-ATTEMPT",
    "CORR-OBJ-ATTEMPT",
  ]);
  assert.deepEqual(grading.dataSeparationContract.derivedJudgmentObjectIds, [
    "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
    "GRD-OBJ-DECISION",
    "PUB-OBJ-RESULT",
    "CORR-OBJ-ATTEMPT-ASSESSMENT",
  ]);
  assert.equal(grading.dataSeparationContract.overwriteOriginalFactAllowed, false);
  assert.deepEqual(grading.aiTraceContract.persistedFields, [
    "BUSINESS_TASK_ID",
    "EXTERNAL_REFERENCE",
    "MODEL_VERSION",
    "CAPABILITY_VERSION",
    "RULE_VERSION",
    "SAFETY_VERSION",
    "EVIDENCE_REFERENCES",
    "RESULT_REFERENCE",
    "GATE_OUTCOMES",
  ]);
  assert.deepEqual(grading.aiTraceContract.prohibitedPersistence, [
    "HIDDEN_CHAIN_OF_THOUGHT",
    "VENDOR_DEBUG_FIELDS",
    "FULL_UPSTREAM_REQUEST_BODY",
  ]);
  assert.equal(
    objectById(requirementModel, "GRD-OBJ-DECISION").dataNature,
    "AI_DERIVED",
  );

  const initialClassification = objectById(
    requirementModel,
    "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
  );
  assert.equal(initialClassification.dataNature, "AI_DERIVED");
  assert.equal(initialClassification.derivedJudgmentContract.sourceOverwriteAllowed, false);
  assert.equal(
    initialClassification.derivedJudgmentContract.priorVersionRequiredWhenRecomputed,
    true,
  );

  const rawCorrection = objectById(requirementModel, "CORR-OBJ-ATTEMPT");
  const correctionAssessment = objectById(
    requirementModel,
    "CORR-OBJ-ATTEMPT-ASSESSMENT",
  );
  assert.equal(rawCorrection.dataNature, "RAW_FACT");
  assert.equal(rawCorrection.originalFactOverwritePolicy, "FORBIDDEN");
  assert.equal(
    rawCorrection.fields.find(({ id }) => id === "CORR-ATTEMPT-F-CORRECTION-ANSWER").mutability,
    "IMMUTABLE",
  );
  assert.equal(correctionAssessment.dataNature, "AI_DERIVED");
  assert.equal(correctionAssessment.derivedJudgmentContract.sourceOverwriteAllowed, false);
  assert.equal(
    actionById(requirementModel, "CORR-ACT-NORMALIZE-SUBMISSION").targetObjectId,
    correctionAssessment.id,
  );
  assert.equal(
    actionById(requirementModel, "CORR-ACT-NORMALIZE-SUBMISSION").operationKind,
    "CREATE",
  );

  for (const objectId of grading.dataSeparationContract.derivedJudgmentObjectIds) {
    const object = objectById(requirementModel, objectId);
    const contract = object.derivedJudgmentContract;
    assert.equal(object.dataNature, "AI_DERIVED", objectId);
    assert.equal(object.originalFactOverwritePolicy, "FORBIDDEN", objectId);
    assert.equal(contract.sourceOverwriteAllowed, false, objectId);
    assert.equal(contract.recomputationCreatesNewVersion, true, objectId);
    assert.equal(contract.priorVersionRequiredWhenRecomputed, true, objectId);
    for (const key of [
      "sourceRefFieldId",
      "sourceVersionFieldId",
      "validityFieldId",
      "disputeFieldId",
      "priorRefFieldId",
      "priorVersionFieldId",
      "supersessionReasonFieldId",
      "versionFieldId",
    ]) {
      assert.ok(object.fields.some(({ id }) => id === contract[key]), `${objectId}:${key}`);
    }
  }
});

test("keeps professional exceptions distinct from routine grading terminology and routes", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  const renderedLabels = [
    ...grading.objects.flatMap((object) => [object.label, ...object.fields.map(({ label }) => label)]),
    ...grading.actions.map(({ label }) => label),
  ].join("\n");
  assert.doesNotMatch(
    renderedLabels,
    /manual grading|teacher review|teacher confirmation|grading route|grading capability/i,
  );
  const authoredLanguage = JSON.stringify({
    required: grading.objects.flatMap(({ fields }) => fields.map(({ required }) => required)),
    permissions: grading.actions.flatMap(({ permissions }) => permissions),
    scenarios: grading.scenarios,
  });
  assert.doesNotMatch(
    authoredLanguage,
    /Enqueue Submission for Grading|Sync a Versioned Grading|teacher confirmation|blocks confirmation|grading step|automated grading|grading decision/i,
  );

  const exceptionFlow = requirementModel.flows.find(({ id }) => id === "DF-007");
  assert.equal(exceptionFlow.failureGranularity, "PROFESSIONAL_EXCEPTION_RESULT_VERSION");
  assert.equal(
    exceptionFlow.retryPolicy.strategy,
    "REFRESH_SOURCE_VERSIONS_THEN_RETRY_PROFESSIONAL_EXCEPTION",
  );
  assert.equal(
    exceptionFlow.compensation.strategy,
    "KEEP_PRIOR_EFFECTIVE_ASSESSMENT_RESULT",
  );
  assert.doesNotMatch(
    exceptionFlow.executionPaths.map(({ id }) => id).join("\n"),
    /MANUAL|CONFIRM|OVERRIDE|SUGGESTION/,
  );
});

test("forbids routine AI assessment as a sole high-impact basis and fails external AI processing closed", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  assert.deepEqual(grading.highImpactUseContract.routineAssessmentSoleBasisForbiddenFor, [
    "DISCIPLINE",
    "PUBLIC_RANKING",
    "ADMISSION_OR_ADVANCEMENT",
    "IDENTITY_OR_BENEFIT_ELIGIBILITY",
    "OTHER_HIGH_IMPACT_DECISION",
  ]);
  assert.equal(grading.highImpactUseContract.independentAuthorizedEvidenceRequired, true);
  assert.deepEqual(grading.externalAiProcessingContract.defaultStudentDataUses, {
    trainingAllowed: false,
    unrelatedReuseAllowed: false,
    unauthorizedTransferAllowed: false,
  });
  assert.equal(grading.externalAiProcessingContract.activationPreconditions.length, 7);
  assert.equal(grading.externalAiProcessingContract.realStudentDataBlockedUntilComplete, true);
  const process = actionById(requirementModel, "GRD-ACT-PROCESS");
  assert.equal(process.externalAiProcessingGuard.failClosed, true);
  assert.ok(process.failureResults.includes("EXTERNAL_AI_CONTRACT_INCOMPLETE"));
});

test("keeps AI conversation persistence closed and every external AI action fail closed", () => {
  const aix = moduleById(requirementModel, "AIX-001");
  const preview = objectById(requirementModel, "AIX-OBJ-TASK-PREVIEW");
  assert.equal(preview.fields.some(({ dataType }) => dataType === "JSON"), false);
  assert.equal(
    preview.fields.some(({ id }) => [
      "AIX-PREVIEW-F-PARAMETERS",
      "AIX-PREVIEW-F-SOURCE-VERSIONS",
      "AIX-PREVIEW-F-PAYLOAD",
    ].includes(id)),
    false,
  );
  assert.deepEqual(aix.aiPersistenceContract.persistedFieldIds, preview.fields.map(({ id }) => id));
  assert.deepEqual(aix.aiPersistenceContract.prohibitedPersistence, [
    "HIDDEN_CHAIN_OF_THOUGHT",
    "VENDOR_DEBUG_FIELDS",
    "FULL_UPSTREAM_REQUEST_BODY",
    "UNKNOWN_PERSISTED_KEYS",
  ]);
  assert.equal(aix.aiPersistenceContract.unknownPersistedFields, "REJECT");
  assert.equal(aix.aiPersistenceContract.arbitraryJsonPayloadAllowed, false);
  for (const action of aix.actions) {
    assert.equal(action.externalAiProcessingGuard.failClosed, true, action.id);
    assert.ok(action.failureResults.includes("EXTERNAL_AI_CONTRACT_INCOMPLETE"), action.id);
    assert.deepEqual(action.persistenceContract.allowedInputFieldIds, action.inputFieldIds, action.id);
    assert.deepEqual(action.persistenceContract.allowedOutputFieldIds, action.outputFieldIds, action.id);
    assert.equal(action.persistenceContract.unknownPersistedFields, "REJECT", action.id);
    assert.deepEqual(action.gateEvaluation.gateFieldIds, aix.previewGateContract.gateFieldIds);
    assert.equal(action.gateEvaluation.requiredPassCode, "PASS", action.id);
    assert.equal(action.gateEvaluation.anyOtherOutcome, "KEEP_PREVIEW_UNAVAILABLE", action.id);
    for (const resultCode of aix.previewGateContract.gateFailureResults) {
      assert.ok(action.failureResults.includes(resultCode), `${action.id}:${resultCode}`);
    }
  }
  for (const task of requirementModel.aiTasks.filter(({ actionId }) => (
    aix.actions.some(({ id }) => id === actionId)
  ))) {
    assert.equal(task.resultSchema.additionalProperties, false, task.id);
    assert.equal(
      Object.values(task.resultSchema.properties).some(({ type, items }) => (
        type === "object" || items?.type === "object"
      )),
      false,
      task.id,
    );
    assert.equal(task.providerResponseBoundary.persisted, false, task.id);
    assert.equal(task.providerResponseBoundary.unknownKeysBeforePersistence, "REJECT", task.id);
  }
});

test("pins every result-derived AI conversation to one published result version", () => {
  const aix = moduleById(requirementModel, "AIX-001");
  const preview = objectById(requirementModel, "AIX-OBJ-TASK-PREVIEW");
  const sourceRef = fieldById(requirementModel, "AIX-PREVIEW-F-SOURCE-RESULT-REF");
  assert.deepEqual(sourceRef.valueSource, {
    kind: "OBJECT_REF",
    targetObjectId: "PUB-OBJ-RESULT",
  });
  assert.equal(sourceRef.referenceIntegrity, "VERSION_PINNED");
  assert.deepEqual(sourceRef.versionBinding, {
    versionFieldId: "AIX-PREVIEW-F-SOURCE-RESULT-VERSION",
    targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
  });
  assert.ok(preview.lineageBindings.some((binding) => (
    binding.refFieldId === sourceRef.id
    && binding.versionFieldId === "AIX-PREVIEW-F-SOURCE-RESULT-VERSION"
    && binding.targetObjectId === "PUB-OBJ-RESULT"
    && binding.targetVersionFieldId === "PUB-RESULT-F-RESULT-VERSION"
  )));
  assert.deepEqual(
    aix.answerOpenEnforcement.resultSourceBinding.resultBoundActionIds,
    [
      "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW",
      "AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW",
    ],
  );

  const mutations = [
    ["lineage", (model) => {
      objectById(model, "AIX-OBJ-TASK-PREVIEW").lineageBindings = [];
    }],
    ["reference source", (model) => {
      fieldById(model, "AIX-PREVIEW-F-SOURCE-RESULT-REF").valueSource = { kind: "SYSTEM" };
    }],
    ["target version", (model) => {
      fieldById(model, "AIX-PREVIEW-F-SOURCE-RESULT-REF")
        .versionBinding.targetVersionFieldId = "PUB-RESULT-F-ID";
    }],
    ["version input", (model) => {
      const action = actionById(model, "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW");
      action.inputFieldIds = action.inputFieldIds.filter((fieldId) => (
        fieldId !== "AIX-PREVIEW-F-SOURCE-RESULT-VERSION"
      ));
    }],
    ["published-state guard", (model) => {
      actionById(model, "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW").relatedStateGuards = [];
    }],
    ["policy source mapping", (model) => {
      actionById(model, "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW")
        .answerOpenSourceBinding.policyFieldMappings[0].sourceFieldId = "PUB-RESULT-F-ID";
    }],
    ["stale source behavior", (model) => {
      actionById(model, "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW")
        .answerOpenSourceBinding.staleMissingOrMismatchBehavior = "CONTINUE_PREVIEW";
    }],
    ["non-result restricted content", (model) => {
      actionById(model, "AIX-ACT-PREPARE-TASK-PREVIEW")
        .nonResultAnswerOpenContract.restrictedResultContentAllowed = true;
    }],
  ];
  for (const [label, mutate] of mutations) {
    assert.match(errorsAfter(mutate), /domain=AIX_SOURCE_LINEAGE\b/, label);
  }
});

test("rejects missing enforcement on every answer-open delivery surface", () => {
  for (const surface of ANSWER_SURFACES) {
    assert.match(errorsAfter((model) => {
      const bindings = moduleById(model, "PUB-001").answerOpenContract.enforcementBindings;
      bindings.splice(bindings.findIndex((binding) => binding.surface === surface), 1);
    }), /INVALID_PHASE_TWO_AI_ASSESSMENT_CONTRACT/, surface);
  }
});

test("rejects a coordinated protected-result export without answer-open enforcement", () => {
  const model = structuredClone(requirementModel);
  const publication = moduleById(model, "PUB-001");
  const sourceAction = actionById(model, "PUB-ACT-VIEW-RESULT");
  const sourcePage = publication.pages.find(({ id }) => id === "PUB-PAGE-STUDENT-RESULT");
  const addedAction = structuredClone(sourceAction);
  addedAction.id = "PUB-ACT-EXPORT-RAW-RESULT";
  addedAction.label = "Export Raw Result";
  delete addedAction.answerOpenEnforcement;
  const addedPageId = "PUB-PAGE-RAW-RESULT-EXPORT";
  const addedScenarios = publication.scenarios
    .filter(({ actionId }) => actionId === sourceAction.id)
    .map((scenario) => ({
      ...structuredClone(scenario),
      id: scenario.id.replace(sourceAction.id, addedAction.id),
      actionId: addedAction.id,
      pageId: addedPageId,
    }));
  addedAction.scenarioIds = addedScenarios.map(({ id }) => id);
  const addedPage = {
    ...structuredClone(sourcePage),
    id: addedPageId,
    label: "Raw Result Export",
    actionIds: [addedAction.id],
  };
  publication.actions.push(addedAction);
  publication.scenarios.push(...addedScenarios);
  publication.pages.push(addedPage);

  assert.match(
    validateRequirementModel(model).join("\n"),
    /domain=FEEDBACK_OPEN\b/,
  );
});

test("rejects restricted-result copies that omit release semantics on a new delivery action", () => {
  const model = structuredClone(requirementModel);
  const publication = moduleById(model, "PUB-001");
  const result = objectById(model, "PUB-OBJ-RESULT");
  const sourceField = result.fields.find(({ id }) => (
    id === "PUB-RESULT-F-FEEDBACK-LAYER-4"
  ));
  const duplicateField = {
    ...structuredClone(sourceField),
    id: "PUB-RESULT-F-COMPLETE-RESPONSE-COPY",
    label: "Complete Answer and Solution Copy",
    required: false,
  };
  delete duplicateField.releaseRequirement;
  result.fields.push(duplicateField);

  const sourceAction = actionById(model, "PUB-ACT-VIEW-RESULT");
  const action = {
    ...structuredClone(sourceAction),
    id: "PUB-ACT-EXPORT-COMPLETE-RESPONSE-COPY",
    label: "Export Complete Answer and Solution Copy",
    outputFieldIds: [duplicateField.id],
  };
  delete action.answerOpenEnforcement;
  const pageId = "PUB-PAGE-COMPLETE-RESPONSE-COPY";
  const scenarios = publication.scenarios
    .filter(({ actionId }) => actionId === sourceAction.id)
    .map((scenario) => ({
      ...structuredClone(scenario),
      id: scenario.id.replace(sourceAction.id, action.id),
      actionId: action.id,
      pageId,
    }));
  action.scenarioIds = scenarios.map(({ id }) => id);
  const page = {
    ...structuredClone(publication.pages.find(({ id }) => (
      id === "PUB-PAGE-STUDENT-RESULT"
    ))),
    id: pageId,
    label: "Complete Answer Copy Export",
    actionIds: [action.id],
    fieldIds: [...action.inputFieldIds, duplicateField.id],
  };
  publication.actions.push(action);
  publication.scenarios.push(...scenarios);
  publication.pages.push(page);

  assert.match(
    validateRequirementModel(model).join("\n"),
    /domain=FEEDBACK_OPEN\b/,
  );
});

test("rejects removal of the restricted-content meaning from answer solution and rubric fields", () => {
  for (const fieldId of [
    "PUB-RESULT-F-ANSWER",
    "PUB-RESULT-F-FEEDBACK-LAYER-4",
    "PUB-RESULT-F-ASSESSMENT-STANDARD-CONTENT",
  ]) {
    assert.match(errorsAfter((model) => {
      delete fieldById(model, fieldId).restrictedContent;
    }), /domain=FEEDBACK_OPEN\b/, fieldId);
  }
});

test("rejects every result-publication writer that omits the full gate contract", () => {
  for (const actionId of [
    "PUB-ACT-PUBLISH-RESULT",
    "PUB-ACT-RETRY-FAILED",
    "PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION",
    "PUB-ACT-CORRECT-CHALLENGED-RESULT",
    "PUB-ACT-REPLACE-RESULT",
    "PUB-ACT-UPHOLD-RESULT",
  ]) {
    assert.match(errorsAfter((model) => {
      delete actionById(model, actionId).gateEvaluation;
    }), /INVALID_PHASE_TWO_AI_ASSESSMENT_CONTRACT/, actionId);
  }
});

test("rejects a same-state published result version replacement without recomputation and gates", () => {
  assert.match(errorsAfter((model) => {
    actionById(model, "PUB-ACT-MARK-RESULT-CHALLENGED").outputFieldIds.push(
      "PUB-RESULT-F-PRIOR-RESULT-REF",
      "PUB-RESULT-F-PRIOR-RESULT-VERSION",
      "PUB-RESULT-F-PUBLIC-CORRECTION-NOTE",
    );
  }), /domain=PUBLICATION_CORRECTION\b/);
});

test("rejects destructive mutations of every phase-two AI invariant", () => {
  const mutations = [
    ["phase", (model) => { moduleById(model, "GRD-001").phase = PHASE.FIRST; }],
    ["axis", (model) => { moduleById(model, "GRD-001").aiAssessmentContract.statusAxes.pop(); }],
    ["next step", (model) => { moduleById(model, "GRD-001").aiAssessmentContract.nextStep.values.pop(); }],
    ["unsupported next-step writer", (model) => {
      actionById(model, "GRD-ACT-ROUTE-UNSUPPORTED").statusWrites
        .find(({ fieldId }) => fieldId === "GRD-DECISION-F-NEXT-STEP")
        .codes.push("COMPLETED");
    }],
    ["explicit dont-know completion", (model) => {
      moduleById(model, "GRD-001").aiAssessmentContract.nextStep
        .initialAttemptOutcomeMatrix.EXPLICIT_DONT_KNOW.push("COMPLETED");
    }],
    ["classification decision source binding", (model) => {
      model.flows.find(({ id }) => id === "DF-006").steps
        .find(({ actionId }) => actionId === "GRD-ACT-ENQUEUE")
        .sourceBindings.pop();
    }],
    ["classification writer version input", (model) => {
      const action = actionById(model, "GRD-ACT-ROUTE");
      action.inputFieldIds = action.inputFieldIds.filter((fieldId) => (
        fieldId !== "GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION"
      ));
    }],
    ["routine teacher", (model) => { moduleById(model, "GRD-001").aiAssessmentContract.unableToDetermine.routineTeacherAssessment = true; }],
    ["publication gate", (model) => { moduleById(model, "PUB-001").aiPublicationContract.requiredGates.pop(); }],
    ["publication gate action binding", (model) => { actionById(model, "PUB-ACT-PUBLISH-RESULT").outputFieldIds.pop(); }],
    ["batch history", (model) => { moduleById(model, "PUB-001").batchCorrectionContract.preserveSupersededResultVersions = false; }],
    ["notification boundary", (model) => { model.flows.find(({ id }) => id === "DF-009").notificationBoundary.eventId = "EVT-UNKNOWN"; }],
    ["feedback", (model) => { moduleById(model, "PUB-001").feedbackContract.layers.pop(); }],
    ["answer surface", (model) => { moduleById(model, "PUB-001").answerOpenContract.surfaces.pop(); }],
    ["valid attempt", (model) => { moduleById(model, "CORR-001").validAttemptContract.invalid.pop(); }],
    ["answer exposed evidence", (model) => { moduleById(model, "CORR-001").answerExposedEvidenceContract.independentEvidence = true; }],
    ["raw overwrite", (model) => { moduleById(model, "GRD-001").dataSeparationContract.overwriteOriginalFactAllowed = true; }],
    ["initial classification validity", (model) => {
      objectById(model, "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION")
        .derivedJudgmentContract.validityFieldId = "GRD-ATTEMPT-CLASS-F-UNKNOWN";
    }],
    ["decision derived contract", (model) => {
      objectById(model, "GRD-OBJ-DECISION")
        .derivedJudgmentContract.priorRefFieldId = "GRD-DECISION-F-ID";
    }],
    ["publication derived contract", (model) => {
      delete objectById(model, "PUB-OBJ-RESULT").derivedJudgmentContract;
    }],
    ["correction fact overwritten by derivation", (model) => {
      actionById(model, "CORR-ACT-NORMALIZE-SUBMISSION").targetObjectId = "CORR-OBJ-ATTEMPT";
    }],
    ["correction assessment source version", (model) => {
      objectById(model, "CORR-OBJ-ATTEMPT-ASSESSMENT")
        .lineageBindings[0].targetVersionFieldId = "CORR-ATTEMPT-F-ID";
    }],
    ["chain of thought", (model) => { moduleById(model, "GRD-001").aiTraceContract.prohibitedPersistence.shift(); }],
    ["hidden chain field", (model) => { objectById(model, "GRD-OBJ-DECISION").fields.push({ ...structuredClone(objectById(model, "GRD-OBJ-DECISION").fields[0]), id: "GRD-TRACE-F-HIDDEN-CHAIN-OF-THOUGHT", label: "Hidden Chain of Thought" }); }],
    ["assessment standard content", (model) => { moduleById(model, "GRD-001").assessmentStandardContract.requiredContentFieldIds.pop(); }],
    ["phase-two readiness gate", (model) => { actionById(model, "GRD-ACT-CHECK-PHASE-TWO-ASSESSMENT-READINESS").phaseTwoReadinessGate.failureBehavior = "ALLOW"; }],
    ["high impact sole basis", (model) => { moduleById(model, "GRD-001").highImpactUseContract.routineAssessmentSoleBasisForbiddenFor.pop(); }],
    ["external AI training", (model) => { moduleById(model, "GRD-001").externalAiProcessingContract.defaultStudentDataUses.trainingAllowed = true; }],
    ["AIX reauthorization", (model) => { moduleById(model, "AIX-001").answerOpenEnforcement.reauthorizeEveryAccess = false; }],
    ["AIX generic payload", (model) => {
      objectById(model, "AIX-OBJ-TASK-PREVIEW").fields.push({
        ...structuredClone(objectById(model, "AIX-OBJ-TASK-PREVIEW").fields[0]),
        id: "AIX-PREVIEW-F-PAYLOAD",
        label: "Generic JSON Payload",
        dataType: "JSON",
      });
    }],
    ["AIX external AI fail-open", (model) => {
      actionById(model, "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW")
        .externalAiProcessingGuard.failClosed = false;
    }],
    ["AIX visible content gate bypass", (model) => {
      actionById(model, "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW")
        .gateEvaluation.anyOtherOutcome = "CREATE_PREVIEW";
    }],
    ["AIX open provider result schema", (model) => {
      const task = model.aiTasks.find(({ id }) => id === "AI-TASK-FEEDBACK-DRAFT");
      task.resultSchema.properties.userVisibleContent = { type: "object" };
    }],
    ["AIX unknown persisted fields", (model) => {
      moduleById(model, "AIX-001").aiPersistenceContract.unknownPersistedFields = "ALLOW";
    }],
  ];

  for (const [label, mutate] of mutations) {
    assert.match(errorsAfter(mutate), /INVALID_PHASE_TWO_AI_ASSESSMENT_CONTRACT/, label);
  }
});

test("rejects structural destruction of phase-two writers, lineage, pages, and event chains", () => {
  const mutations = [
    ["phase-one submission coupling", (model) => {
      actionById(model, "SUB-ACT-SUBMIT").assessmentStandardGate = { requiredState: "FROZEN" };
    }],
    ["publication event producer binding", (model) => {
      actionById(model, "HW-ACT-PUBLISH-NOW").producedEventIds = [];
    }],
    ["publication event consumer binding", (model) => {
      model.events.find(({ id }) => id === ASSESSMENT_STANDARD_EVENT_ID)
        .triggeredActionIds.pop();
    }],
    ["publication snapshot state", (model) => {
      moduleById(model, "GRD-001").assessmentStandardContract
        .sourceSnapshotInterface.requiredState = "DRAFT";
    }],
    ["snapshot interface", (model) => {
      moduleById(model, "GRD-001").assessmentStandardContract
        .sourceSnapshotInterface.versionFieldId = "HW-SNAPSHOT-F-UNKNOWN";
    }],
    ["snapshot fail closed", (model) => {
      actionById(model, "GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD")
        .publicationSnapshotGuard.failClosed = false;
    }],
    ["processing axis writer", (model) => {
      moduleById(model, "GRD-001").aiAssessmentContract.statusAxisWriters[0]
        .writerActionIds.pop();
    }],
    ["publication axis writer", (model) => {
      moduleById(model, "PUB-001").resultAxisWriterContract
        .find(({ axis }) => axis === "PUBLICATION_STATUS").writerActionIds.pop();
    }],
    ["dispute axis writer", (model) => {
      moduleById(model, "PUB-001").resultAxisWriterContract
        .find(({ axis }) => axis === "DISPUTE_CORRECTION_STATUS").writerActionIds.pop();
    }],
    ["validity axis writer", (model) => {
      moduleById(model, "PUB-001").resultAxisWriterContract
        .find(({ axis }) => axis === "VALIDITY_STATUS").writerActionIds.pop();
    }],
    ["next-step required writer", (model) => {
      fieldById(model, "GRD-DECISION-F-NEXT-STEP").required.whenActionIds.pop();
    }],
    ["next-step action output", (model) => {
      const action = actionById(model, "GRD-ACT-ROUTE");
      action.outputFieldIds = action.outputFieldIds.filter((id) => id !== "GRD-DECISION-F-NEXT-STEP");
    }],
    ["feedback materialization", (model) => {
      const action = actionById(model, "PUB-ACT-MATERIALIZE-RESULT");
      action.outputFieldIds = action.outputFieldIds
        .filter((id) => id !== "PUB-RESULT-F-FEEDBACK-LAYER-4");
    }],
    ["open-time materialization", (model) => {
      const action = actionById(model, "PUB-ACT-MATERIALIZE-RESULT");
      action.outputFieldIds = action.outputFieldIds
        .filter((id) => id !== "PUB-RESULT-F-RUBRIC-OPEN-AT");
    }],
    ["surface action binding", (model) => {
      delete actionById(model, "PUB-ACT-VIEW-RESULT").answerOpenEnforcement;
    }],
    ["surface reauthorization", (model) => {
      actionById(model, "AIX-ACT-PREPARE-TASK-PREVIEW")
        .answerOpenEnforcement.reauthorizeAtAccess = false;
    }],
    ["challenge opened event", (model) => {
      model.events.find(({ id }) => id === "EVT-AI-ASSESSMENT-CHALLENGE-OPENED")
        .producerActionIds = ["PUB-ACT-UPHOLD-RESULT"];
    }],
    ["professional evidence event", (model) => {
      model.events.find(({ id }) => id === "EVT-AI-ASSESSMENT-PROFESSIONAL-EVIDENCE-SUBMITTED")
        .triggeredActionIds = ["PUB-ACT-CLOSE-RESULT-CHALLENGE"];
    }],
    ["challenge result history", (model) => {
      const action = actionById(model, "PUB-ACT-CORRECT-CHALLENGED-RESULT");
      action.outputFieldIds = action.outputFieldIds
        .filter((id) => id !== "PUB-RESULT-F-PRIOR-RESULT-VERSION");
    }],
    ["challenge page", (model) => {
      moduleById(model, "PUB-001").pages
        .find(({ id }) => id === "PUB-PAGE-RESULT-CHALLENGE").actionIds = [];
    }],
    ["initial-attempt lineage", (model) => {
      objectById(model, "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION")
        .lineageBindings[0].targetVersionFieldId = "SUB-ATTEMPT-F-ID";
    }],
    ["classification infers next step", (model) => {
      actionById(model, "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT")
        .outputFieldIds.push("GRD-DECISION-F-NEXT-STEP");
    }],
    ["dont-know means completed", (model) => {
      moduleById(model, "GRD-001").initialValidAttemptContract
        .explicitDontKnowMeansCompleted = true;
    }],
    ["dont-know means mastery", (model) => {
      moduleById(model, "GRD-001").initialValidAttemptContract
        .explicitDontKnowCreatesMasteryEvidence = true;
    }],
    ["batch correction requires challenge", (model) => {
      actionById(model, "PUB-ACT-CORRECT-RESULT").inputFieldIds
        .push("PUB-RESULT-F-CHALLENGE-REF");
    }],
    ["solution release gate", (model) => {
      fieldById(model, "PUB-RESULT-F-FEEDBACK-LAYER-4")
        .releaseRequirement.visibleAtFieldId = "PUB-RESULT-F-FEEDBACK-VISIBLE-AT";
    }],
    ["rubric read gate", (model) => {
      const policy = objectById(model, "PUB-OBJ-RESULT").readPolicies[0];
      policy.timeGates = policy.timeGates
        .filter(({ visibleAtFieldId }) => visibleAtFieldId !== "PUB-RESULT-F-RUBRIC-OPEN-AT");
    }],
  ];

  for (const [label, mutate] of mutations) {
    assert.match(errorsAfter(mutate), /INVALID_PHASE_TWO_AI_ASSESSMENT_CONTRACT/, label);
  }
});

test("rejects coordinated neutral AIX payload and unguarded write additions", () => {
  const model = structuredClone(requirementModel);
  const aix = moduleById(model, "AIX-001");
  const preview = objectById(model, "AIX-OBJ-TASK-PREVIEW");
  const neutralField = {
    ...structuredClone(preview.fields.find(({ id }) => id === "AIX-PREVIEW-F-USER-VISIBLE-CONTENT")),
    id: "AIX-PREVIEW-F-AUXILIARY-DATA",
    label: "Auxiliary Data",
    dataType: "JSON",
  };
  preview.fields.push(neutralField);
  preview.persistenceContract.allowedFieldIds.push(neutralField.id);
  aix.aiPersistenceContract.persistedFieldIds.push(neutralField.id);
  for (const action of aix.actions) {
    action.outputFieldIds.push(neutralField.id);
    action.persistenceContract.allowedOutputFieldIds.push(neutralField.id);
  }
  aix.pages.find(({ id }) => id === "AIX-PAGE-CONVERSATION").fieldIds.push(neutralField.id);

  const sourceAction = actionById(model, "AIX-ACT-PREPARE-TASK-PREVIEW");
  const addedAction = structuredClone(sourceAction);
  addedAction.id = "AIX-ACT-PERSIST-AUXILIARY-DATA";
  addedAction.label = "Persist Auxiliary AI Data";
  const sourceScenarios = aix.scenarios.filter(({ actionId }) => actionId === sourceAction.id);
  addedAction.scenarioIds = sourceScenarios.map(({ id }) => id.replace(sourceAction.id, addedAction.id));
  delete addedAction.externalAiProcessingGuard;
  delete addedAction.persistenceContract;
  delete addedAction.gateEvaluation;
  aix.actions.push(addedAction);
  aix.scenarios.push(...sourceScenarios.map((scenario) => ({
    ...structuredClone(scenario),
    id: scenario.id.replace(sourceAction.id, addedAction.id),
    actionId: addedAction.id,
  })));
  aix.pages.find(({ id }) => id === "AIX-PAGE-CONVERSATION").actionIds.push(addedAction.id);
  aix.aiPersistenceContract.externalAiGuardedActionIds.push(addedAction.id);

  assert.match(validateRequirementModel(model).join("\n"), /domain=AIX_PERSISTENCE\b/);
});

test("rejects incomplete derived-judgment initialization and supersession writers", () => {
  const mutations = [
    ["decision validity initialization", (model) => {
      const action = actionById(model, "GRD-ACT-ENQUEUE");
      action.statusWrites = action.statusWrites.filter(({ fieldId }) => (
        fieldId !== "GRD-DECISION-F-DERIVATION-VALIDITY-STATUS"
      ));
    }],
    ["decision dispute initialization", (model) => {
      const action = actionById(model, "GRD-ACT-ENQUEUE");
      action.statusWrites = action.statusWrites.filter(({ fieldId }) => (
        fieldId !== "GRD-DECISION-F-DERIVATION-DISPUTE-STATUS"
      ));
    }],
    ["decision recomputation validity", (model) => {
      const action = actionById(model, "GRD-ACT-OPEN-CONFIRMED-REVISION");
      action.outputFieldIds = action.outputFieldIds.filter((fieldId) => (
        fieldId !== "GRD-DECISION-F-DERIVATION-VALIDITY-STATUS"
      ));
      action.statusWrites = action.statusWrites.filter(({ fieldId }) => (
        fieldId !== "GRD-DECISION-F-DERIVATION-VALIDITY-STATUS"
      ));
    }],
    ["decision recomputation dispute", (model) => {
      const action = actionById(model, "GRD-ACT-OPEN-CONFIRMED-REVISION");
      action.outputFieldIds = action.outputFieldIds.filter((fieldId) => (
        fieldId !== "GRD-DECISION-F-DERIVATION-DISPUTE-STATUS"
      ));
      action.statusWrites = action.statusWrites.filter(({ fieldId }) => (
        fieldId !== "GRD-DECISION-F-DERIVATION-DISPUTE-STATUS"
      ));
    }],
    ["classification prior identity", (model) => {
      const action = actionById(model, "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT");
      action.outputFieldIds = action.outputFieldIds.filter((fieldId) => (
        fieldId !== "GRD-ATTEMPT-CLASS-F-PRIOR-CLASSIFICATION-REF"
      ));
    }],
    ["classification supersession reason", (model) => {
      const action = actionById(model, "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT");
      action.outputFieldIds = action.outputFieldIds.filter((fieldId) => (
        fieldId !== "GRD-ATTEMPT-CLASS-F-SUPERSESSION-REASON"
      ));
    }],
    ["correction prior assessment identity", (model) => {
      const action = actionById(model, "CORR-ACT-NORMALIZE-SUBMISSION");
      action.outputFieldIds = action.outputFieldIds.filter((fieldId) => (
        fieldId !== "CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-REF"
      ));
    }],
    ["correction validity required", (model) => {
      fieldById(model, "CORR-ASSESSMENT-F-VALIDITY-STATUS").required = false;
    }],
    ["published result prior identity", (model) => {
      const action = actionById(model, "PUB-ACT-CORRECT-RESULT");
      action.outputFieldIds = action.outputFieldIds.filter((fieldId) => (
        fieldId !== "PUB-RESULT-F-PRIOR-RESULT-REF"
      ));
    }],
  ];

  for (const [label, mutate] of mutations) {
    assert.match(errorsAfter(mutate), /domain=RAW_FACT_TRACE\b/, label);
  }
});

test("rejects an AIX external-AI action disguised as a read", () => {
  const model = structuredClone(requirementModel);
  const aix = moduleById(model, "AIX-001");
  const sourceAction = actionById(model, "AIX-ACT-PREPARE-TASK-PREVIEW");
  const addedAction = structuredClone(sourceAction);
  addedAction.id = "AIX-ACT-QUERY-UPSTREAM-EXPLANATION";
  addedAction.label = "Query Upstream Explanation";
  addedAction.operationKind = "READ";
  addedAction.writes = false;
  addedAction.risk = "READ";
  addedAction.inputFieldIds = ["AIX-PREVIEW-F-ID"];
  addedAction.outputFieldIds = ["AIX-PREVIEW-F-USER-VISIBLE-CONTENT"];
  delete addedAction.capability;
  delete addedAction.externalAiProcessingGuard;
  delete addedAction.persistenceContract;
  delete addedAction.gateEvaluation;
  delete addedAction.answerOpenEnforcement;
  delete addedAction.answerOpenPolicyRequired;
  delete addedAction.reauthorizeOnEveryAccess;
  addedAction.permissions.push({
    effect: "DENY",
    roleRef: "ROLE-SCHOOL-ADMIN",
    condition: "school administration has no default access to student AI detail",
  });
  const addedScenarios = aix.scenarios
    .filter(({ actionId }) => actionId === sourceAction.id)
    .map((scenario) => ({
      ...structuredClone(scenario),
      id: scenario.id.replace(sourceAction.id, addedAction.id),
      actionId: addedAction.id,
      then: {
        ...structuredClone(scenario.then),
        expectedState: { mode: "UNCHANGED" },
      },
    }));
  addedAction.scenarioIds = addedScenarios.map(({ id }) => id);
  aix.actions.push(addedAction);
  aix.scenarios.push(...addedScenarios);
  aix.pages.find(({ id }) => id === "AIX-PAGE-CONVERSATION").actionIds.push(addedAction.id);

  assert.match(validateRequirementModel(model).join("\n"), /domain=AIX_PERSISTENCE\b/);
});

test("closes assignment-draft and grading provider responses before persistence", () => {
  const assignmentDraft = requirementModel.aiTasks.find(({ id }) => (
    id === "AI-TASK-ASSIGNMENT-DRAFT"
  ));
  assert.equal(assignmentDraft.resultSchema.additionalProperties, false);
  assert.equal(
    Object.values(assignmentDraft.resultSchema.properties).some(({ type, items }) => (
      type === "object" || items?.type === "object"
    )),
    false,
  );
  assert.equal(assignmentDraft.providerResponseBoundary.persisted, false);
  assert.equal(assignmentDraft.providerResponseBoundary.unknownKeysBeforePersistence, "REJECT");
  assert.ok(assignmentDraft.resultPersistenceMapping);
  assert.ok(assignmentDraft.confirmationInputMapping);

  assert.match(errorsAfter((model) => {
    const decision = objectById(model, "GRD-OBJ-DECISION");
    decision.fields.push({
      ...structuredClone(decision.fields.find(({ id }) => (
        id === "GRD-DECISION-F-CONCLUSION"
      ))),
      id: "GRD-DECISION-F-AUXILIARY-MODEL-DATA",
      label: "Auxiliary Model Data",
      dataType: "JSON",
    });
    const process = actionById(model, "GRD-ACT-PROCESS");
    process.outputFieldIds.push("GRD-DECISION-F-AUXILIARY-MODEL-DATA");
    process.persistenceContract.allowedOutputFieldIds
      .push("GRD-DECISION-F-AUXILIARY-MODEL-DATA");
    process.providerResultContract.resultSchema.properties.auxiliaryData = { type: "string" };
    process.providerResultContract.resultPersistenceMapping.auxiliaryData = (
      "GRD-DECISION-F-AUXILIARY-MODEL-DATA"
    );
  }), /domain=RAW_FACT_TRACE\b/);

  assert.match(errorsAfter((model) => {
    const assessment = objectById(model, "CORR-OBJ-ATTEMPT-ASSESSMENT");
    assessment.fields.push({
      ...structuredClone(assessment.fields.find(({ id }) => (
        id === "CORR-ASSESSMENT-F-EVIDENCE-KIND"
      ))),
      id: "CORR-ASSESSMENT-F-AUXILIARY-MODEL-DATA",
      label: "Auxiliary Model Data",
      dataType: "JSON",
    });
    const normalize = actionById(model, "CORR-ACT-NORMALIZE-SUBMISSION");
    normalize.outputFieldIds.push("CORR-ASSESSMENT-F-AUXILIARY-MODEL-DATA");
    normalize.persistenceContract.allowedOutputFieldIds
      .push("CORR-ASSESSMENT-F-AUXILIARY-MODEL-DATA");
    normalize.providerResultContract.resultSchema.properties.auxiliaryData = { type: "string" };
    normalize.providerResultContract.resultPersistenceMapping.auxiliaryData = (
      "CORR-ASSESSMENT-F-AUXILIARY-MODEL-DATA"
    );
  }), /domain=RAW_FACT_TRACE\b/);
});

test("rejects undeclared provider contracts and provider-exclusive output writers", () => {
  assert.match(errorsAfter((model) => {
    actionById(model, "GRD-ACT-ROUTE").providerResultContract = structuredClone(
      actionById(model, "GRD-ACT-PROCESS").providerResultContract,
    );
  }), /domain=EXTERNAL_AI_HIGH_IMPACT\b/);

  assert.match(errorsAfter((model) => {
    const route = actionById(model, "GRD-ACT-ROUTE");
    route.outputFieldIds.push("GRD-DECISION-F-RECOGNIZED-ANSWER");
    const recognizedAnswer = fieldById(model, "GRD-DECISION-F-RECOGNIZED-ANSWER");
    recognizedAnswer.required.whenActionIds.push(route.id);
    recognizedAnswer.required.whenStates.push("AI_DETERMINED");
  }), /domain=EXTERNAL_AI_HIGH_IMPACT\b/);
});

test("fails external AI closed for every action that reads a student fact", () => {
  for (const actionId of [
    "GRD-ACT-CLASSIFY-INITIAL-ATTEMPT",
    "GRD-ACT-PROCESS",
    "CORR-ACT-NORMALIZE-SUBMISSION",
  ]) {
    const action = actionById(requirementModel, actionId);
    assert.equal(action.externalAiProcessingGuard?.failClosed, true, actionId);
    assert.ok(action.failureResults.includes("EXTERNAL_AI_CONTRACT_INCOMPLETE"), actionId);
  }
});

test("reports the broken AI contract domain instead of one umbrella-only error", () => {
  const mutations = [
    ["SNAPSHOT_READINESS", (model) => {
      moduleById(model, "GRD-001").assessmentStandardContract
        .sourceSnapshotInterface.versionFieldId = "HW-SNAPSHOT-F-UNKNOWN";
    }],
    ["AXES_NEXT_STEP", (model) => {
      moduleById(model, "PUB-001").resultAxisWriterContract[0].writerActionIds.pop();
    }],
    ["FEEDBACK_OPEN", (model) => {
      actionById(model, "PUB-ACT-VIEW-RESULT")
        .answerOpenEnforcement.reauthorizeAtAccess = false;
    }],
    ["CHALLENGE_CORRECTION", (model) => {
      moduleById(model, "PUB-001").challengeCorrectionContract.historyFieldIds.pop();
    }],
    ["INITIAL_VALID_ATTEMPT", (model) => {
      moduleById(model, "GRD-001").initialValidAttemptContract
        .explicitDontKnowCreatesMasteryEvidence = true;
    }],
    ["INITIAL_VALID_ATTEMPT", (model) => {
      model.flows.find(({ id }) => id === "DF-006").steps
        .find(({ actionId }) => actionId === "GRD-ACT-ENQUEUE")
        .providedInputs.pop();
    }],
    ["CORRECTION_VALID_ATTEMPT", (model) => {
      moduleById(model, "CORR-001").answerExposedEvidenceContract.independentEvidence = true;
    }],
    ["RAW_FACT_TRACE", (model) => {
      moduleById(model, "GRD-001").aiTraceContract.prohibitedPersistence.pop();
    }],
    ["RAW_FACT_TRACE", (model) => {
      delete objectById(model, "GRD-OBJ-DECISION").derivedJudgmentContract;
    }],
    ["EXTERNAL_AI_HIGH_IMPACT", (model) => {
      moduleById(model, "GRD-001").externalAiProcessingContract
        .defaultStudentDataUses.trainingAllowed = true;
    }],
    ["AIX_PERSISTENCE", (model) => {
      moduleById(model, "AIX-001").aiPersistenceContract.prohibitedPersistence.pop();
    }],
  ];

  for (const [domain, mutate] of mutations) {
    assert.match(errorsAfter(mutate), new RegExp(`domain=${domain}\\b`), domain);
  }
});
