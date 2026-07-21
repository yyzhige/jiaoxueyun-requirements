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

test("freezes a complete assessment standard before student answers and pins AI use to it", () => {
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
  for (const actionId of contract.studentAnswerGateActionIds) {
    assert.deepEqual(actionById(requirementModel, actionId).assessmentStandardGate, {
      standardObjectId: contract.objectId,
      requiredState: "FROZEN",
      matchMode: "EXACT_ACTIVITY_SNAPSHOT_ID_AND_VERSION",
      missingBehavior: "BLOCK_STUDENT_ANSWER",
    });
  }
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
    && binding.beforeOpenBehavior === "WITHHOLD_RESTRICTED_CONTENT"
    && (binding.actionIds?.length > 0 || binding.policyPointId)
  )), true);

  const aix = moduleById(requirementModel, "AIX-001");
  assert.equal(aix.answerOpenEnforcement.policyId, publication.answerOpenContract.policyId);
  assert.equal(aix.answerOpenEnforcement.surface, "AI_CONVERSATION");
  assert.equal(aix.answerOpenEnforcement.reauthorizeEveryAccess, true);
});

test("separates original learning facts from derived judgments and persists no hidden chain of thought", () => {
  const grading = moduleById(requirementModel, "GRD-001");
  assert.deepEqual(grading.dataSeparationContract.originalFactObjectIds, ["SUB-OBJ-ATTEMPT"]);
  assert.deepEqual(grading.dataSeparationContract.derivedJudgmentObjectIds, [
    "GRD-OBJ-DECISION",
    "PUB-OBJ-RESULT",
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
    "AI_DERIVED_JUDGMENT",
  );
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

test("rejects missing enforcement on every answer-open delivery surface", () => {
  for (const surface of ANSWER_SURFACES) {
    assert.match(errorsAfter((model) => {
      const bindings = moduleById(model, "PUB-001").answerOpenContract.enforcementBindings;
      bindings.splice(bindings.findIndex((binding) => binding.surface === surface), 1);
    }), /INVALID_PHASE_TWO_AI_ASSESSMENT_CONTRACT/, surface);
  }
});

test("rejects destructive mutations of every phase-two AI invariant", () => {
  const mutations = [
    ["phase", (model) => { moduleById(model, "GRD-001").phase = PHASE.FIRST; }],
    ["axis", (model) => { moduleById(model, "GRD-001").aiAssessmentContract.statusAxes.pop(); }],
    ["next step", (model) => { moduleById(model, "GRD-001").aiAssessmentContract.nextStep.values.pop(); }],
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
    ["chain of thought", (model) => { moduleById(model, "GRD-001").aiTraceContract.prohibitedPersistence.shift(); }],
    ["hidden chain field", (model) => { objectById(model, "GRD-OBJ-DECISION").fields.push({ ...structuredClone(objectById(model, "GRD-OBJ-DECISION").fields[0]), id: "GRD-TRACE-F-HIDDEN-CHAIN-OF-THOUGHT", label: "Hidden Chain of Thought" }); }],
    ["assessment standard content", (model) => { moduleById(model, "GRD-001").assessmentStandardContract.requiredContentFieldIds.pop(); }],
    ["student answer standard gate", (model) => { delete actionById(model, "SUB-ACT-SUBMIT").assessmentStandardGate; }],
    ["high impact sole basis", (model) => { moduleById(model, "GRD-001").highImpactUseContract.routineAssessmentSoleBasisForbiddenFor.pop(); }],
    ["external AI training", (model) => { moduleById(model, "GRD-001").externalAiProcessingContract.defaultStudentDataUses.trainingAllowed = true; }],
    ["AIX reauthorization", (model) => { moduleById(model, "AIX-001").answerOpenEnforcement.reauthorizeEveryAccess = false; }],
  ];

  for (const [label, mutate] of mutations) {
    assert.match(errorsAfter(mutate), /INVALID_PHASE_TWO_AI_ASSESSMENT_CONTRACT/, label);
  }
});
