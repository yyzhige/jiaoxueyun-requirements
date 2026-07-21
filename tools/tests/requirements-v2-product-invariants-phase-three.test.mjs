import test from "node:test";
import assert from "node:assert/strict";

import { PHASE, RELEASE_STATUS } from "../requirements-v2/model.mjs";
import { requirementModel } from "../requirements-v2/facts/index.mjs";
import { validateRequirementModel } from "../requirements-v2/validate/index.mjs";

function moduleById(model, id) {
  return model.modules.find((module) => module.id === id);
}

function objectById(model, id) {
  return model.modules.flatMap((module) => module.objects)
    .find((object) => object.id === id);
}

function actionById(model, id) {
  return model.modules.flatMap((module) => module.actions)
    .find((action) => action.id === id);
}

function optionCodes(model, id) {
  return model.optionSets.find((optionSet) => optionSet.id === id)
    ?.values.map(({ code }) => code);
}

function sameMembers(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && expected.every((value) => actual.includes(value));
}

function hasPermission(action, effect, subjectKey, subjectValue, pattern) {
  return action?.permissions.some((permission) => (
    permission.effect === effect
    && permission[subjectKey] === subjectValue
    && (!pattern || pattern.test(permission.condition))
  ));
}

function phaseThreeInvariantErrors(model) {
  const errors = [];
  const requireInvariant = (condition, code) => {
    if (!condition) errors.push(code);
  };
  const longTermModuleIds = ["INS-001", "PLN-001", "LPATH-001"];
  const longTermModules = longTermModuleIds.map((id) => moduleById(model, id));

  requireInvariant(
    longTermModules.every((module) => (
      module?.phase === PHASE.THIRD
      && module.releaseStatus === RELEASE_STATUS.PLANNED
      && module.pages.every(({ availability }) => availability === RELEASE_STATUS.PLANNED)
      && !model.currentReleaseModuleIds.includes(module.id)
    ))
    && model.flows
      .filter(({ moduleIds }) => moduleIds.some((id) => longTermModuleIds.includes(id)))
      .every(({ phase }) => phase === PHASE.THIRD),
    "PHASE_THREE_OWNERSHIP",
  );

  const masteryNode = objectById(model, "INS-OBJ-MASTERY-NODE");
  const classProgress = objectById(model, "PLN-OBJ-CLASS-PROGRESS");
  const dualProgress = moduleById(model, "PLN-001")?.dualProgressContract;
  const masteryStateCodes = [
    "NOT_STARTED",
    "LEARNING",
    "PENDING_VALIDATION",
    "MASTERED",
    "REVIEW_REQUIRED",
  ];
  const longTermFieldText = longTermModules
    .flatMap((module) => module?.objects ?? [])
    .flatMap((object) => object.fields)
    .map(({ id, label }) => `${id} ${label}`)
    .join(" ");
  requireInvariant(
    masteryNode
    && classProgress
    && masteryNode.id !== classProgress.id
    && dualProgress?.classProgressObjectId === classProgress.id
    && dualProgress?.personalProgressObjectId === masteryNode.id
    && dualProgress?.aggregationRule.includes("never collapse into one overall percentage")
    && sameMembers(masteryNode.states, masteryStateCodes)
    && sameMembers(optionCodes(model, "OPT-PH3-001"), masteryStateCodes)
    && !/OVERALL.PERCENT|TOTAL.PERCENT|总百分比|整体百分比/i.test(longTermFieldText),
    "DUAL_PROGRESS_NODE_SEPARATION",
  );

  const confirmMastery = actionById(model, "INS-ACT-CONFIRM-MASTERY-NODE");
  const requireReview = actionById(model, "INS-ACT-MARK-MASTERY-REVIEW-REQUIRED");
  const masteryPolicy = moduleById(model, "INS-001")?.masteryEvidencePolicy;
  const studentMasteryWrites = moduleById(model, "INS-001")?.actions.filter((action) => (
    action.targetObjectId === "INS-OBJ-MASTERY-NODE"
    && action.writes
    && hasPermission(action, "ALLOW", "roleRef", "ROLE-STUDENT")
  )) ?? [];
  const historyFieldIds = new Set(masteryNode?.fields.map(({ id }) => id));
  requireInvariant(
    JSON.stringify(confirmMastery?.transition) === JSON.stringify({
      from: "PENDING_VALIDATION",
      to: "MASTERED",
    })
    && confirmMastery.executionMode === "SYSTEM_EVENT"
    && hasPermission(confirmMastery, "DENY", "actorRef", "AI", /alone cannot write MASTERED/i)
    && JSON.stringify(requireReview?.transition) === JSON.stringify({
      from: "MASTERED",
      to: "REVIEW_REQUIRED",
    })
    && masteryPolicy?.rule.includes("never directly write MASTERED")
    && sameMembers(masteryPolicy?.evidenceOnlySources, [
      "ASSIGNMENT_COMPLETION",
      "CORRECTION_COMPLETION",
      "VIDEO_WATCHING",
    ])
    && studentMasteryWrites.length > 0
    && studentMasteryWrites.every(({ transition }) => transition?.to !== "MASTERED")
    && [
      "INS-MASTERY-F-EVIDENCE-REFS",
      "INS-MASTERY-F-SOURCE-REASON",
      "INS-MASTERY-F-EFFECTIVE-AT",
      "INS-MASTERY-F-VERSION",
    ].every((id) => historyFieldIds.has(id)),
    "REVERSIBLE_EVIDENCE_BASED_MASTERY",
  );

  const personalRead = actionById(model, "INS-ACT-VIEW-PERSONAL-PROGRESS");
  const classRead = actionById(model, "PLN-ACT-VIEW-CLASS-PROGRESS");
  const classWrites = moduleById(model, "PLN-001")?.actions.filter((action) => (
    action.targetObjectId === "PLN-OBJ-CLASS-PROGRESS"
    && action.executionMode === "USER_TASK"
    && action.writes
  )) ?? [];
  const challenge = actionById(model, "INS-ACT-OPEN-MASTERY-CHALLENGE");
  requireInvariant(
    classWrites.length > 0
    && classWrites.every((action) => (
      hasPermission(action, "ALLOW", "dutyRef", "DUTY-SUBJECT-TEACHER")
      && hasPermission(action, "DENY", "dutyRef", "DUTY-HOMEROOM")
    ))
    && hasPermission(personalRead, "ALLOW", "dutyRef", "DUTY-SUBJECT-TEACHER")
    && hasPermission(personalRead, "DENY", "dutyRef", "DUTY-HOMEROOM", /coordination.*never subject-detail/i)
    && hasPermission(classRead, "ALLOW", "dutyRef", "DUTY-HOMEROOM", /coordination.*without personal mastery detail/i)
    && challenge?.targetObjectId === "INS-OBJ-MASTERY-CHALLENGE"
    && !challenge.outputFieldIds.includes("INS-MASTERY-F-STATUS"),
    "PHASE_THREE_ROLE_AND_CHALLENGE_BOUNDARY",
  );

  const composition = moduleById(model, "LPATH-001")?.longTermVideoComposition;
  const phaseTwoFlows = model.flows.filter(({ phase }) => phase === PHASE.SECOND);
  requireInvariant(
    composition?.phase === PHASE.THIRD
    && composition.sourceModuleId === "VIDEO-001"
    && sameMembers(composition.individualizedComposition, [
      "LINKING",
      "EXAMPLE",
      "PACING",
      "VERIFICATION",
    ])
    && /never depends/i.test(composition.phaseTwoDependencyRule)
    && phaseTwoFlows.every(({ moduleIds }) => !moduleIds.includes("LPATH-001")),
    "LONG_TERM_VIDEO_COMPOSITION_BOUNDARY",
  );

  return errors;
}

function assertInvariant(model, code) {
  assert.ok(phaseThreeInvariantErrors(model).includes(code), `${code} was not detected`);
}

test("phase three owns cognition plans and cross-term paths without current-release claims", () => {
  assert.deepEqual(validateRequirementModel(requirementModel), []);
  assert.deepEqual(phaseThreeInvariantErrors(requirementModel), []);
});

test("phase three destructive variant rejects a long-term module in a phase-one Flow", () => {
  const model = structuredClone(requirementModel);
  model.flows.find(({ id }) => id === "DF-011").phase = PHASE.FIRST;
  assertInvariant(model, "PHASE_THREE_OWNERSHIP");
  assert.ok(validateRequirementModel(model).some((error) => (
    error.includes("FLOW_PHASE_MISMATCH") || error.includes("INVALID_FLOW_RELEASE_BOUNDARY")
  )));
});

test("dual progress uses class and personal node sources instead of one percentage", () => {
  assert.deepEqual(phaseThreeInvariantErrors(requirementModel), []);
});

test("dual progress destructive variant rejects an overall mastery percentage", () => {
  const model = structuredClone(requirementModel);
  objectById(model, "INS-OBJ-MASTERY-NODE").fields.push({
    ...structuredClone(objectById(model, "INS-OBJ-MASTERY-NODE").fields[0]),
    id: "INS-MASTERY-F-OVERALL-PERCENTAGE",
    label: "Overall Mastery Percentage",
    idempotencyRole: undefined,
  });
  assertInvariant(model, "DUAL_PROGRESS_NODE_SEPARATION");
});

test("mastery is reversible and completion correction or video watching remain evidence only", () => {
  assert.deepEqual(phaseThreeInvariantErrors(requirementModel), []);
});

test("mastery destructive variant rejects direct student mastery", () => {
  const model = structuredClone(requirementModel);
  actionById(model, "INS-ACT-REQUEST-MASTERY-VALIDATION").transition.to = "MASTERED";
  assertInvariant(model, "REVERSIBLE_EVIDENCE_BASED_MASTERY");
});

test("mastery destructive variant rejects removing the review-required reversal", () => {
  const model = structuredClone(requirementModel);
  actionById(model, "INS-ACT-MARK-MASTERY-REVIEW-REQUIRED").transition.to = "MASTERED";
  assertInvariant(model, "REVERSIBLE_EVIDENCE_BASED_MASTERY");
});

test("phase three permissions separate subject detail homeroom coordination and student challenge", () => {
  assert.deepEqual(phaseThreeInvariantErrors(requirementModel), []);
});

test("phase three destructive variant rejects homeroom access to subject mastery detail", () => {
  const model = structuredClone(requirementModel);
  const read = actionById(model, "INS-ACT-VIEW-PERSONAL-PROGRESS");
  read.permissions = read.permissions.filter(({ dutyRef, effect }) => !(
    dutyRef === "DUTY-HOMEROOM" && effect === "DENY"
  ));
  read.permissions.push({
    effect: "ALLOW",
    dutyRef: "DUTY-HOMEROOM",
    condition: "homeroom can read all subject detail",
  });
  assertInvariant(model, "PHASE_THREE_ROLE_AND_CHALLENGE_BOUNDARY");
});

test("long-term video uses reviewed fragments and individualized composition only in phase three", () => {
  assert.deepEqual(phaseThreeInvariantErrors(requirementModel), []);
});

test("long-term video destructive variant rejects making composition a phase-two prerequisite", () => {
  const model = structuredClone(requirementModel);
  moduleById(model, "LPATH-001").longTermVideoComposition.phaseTwoDependencyRule = (
    "the phase-two minimum video requires the full long-term fragment library"
  );
  assertInvariant(model, "LONG_TERM_VIDEO_COMPOSITION_BOUNDARY");
});
