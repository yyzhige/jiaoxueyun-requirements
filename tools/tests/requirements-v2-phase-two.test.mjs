import test from "node:test";
import assert from "node:assert/strict";

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

function optionById(model, id) {
  return model.optionSets.find((optionSet) => optionSet.id === id);
}

function flowById(model, id) {
  return model.flows.find((flow) => flow.id === id);
}

function assertHasCode(errors, code) {
  assert.ok(errors.some((error) => error.startsWith(code)), `${code} was not reported`);
}

test("minimum progress is a planned skeleton with current grade course unit target prerequisites and explicit next-target choice", () => {
  const progress = moduleById(requirementModel, "PROG-001");
  const snapshot = objectById(requirementModel, "PROG-OBJ-COURSE-TARGET-SNAPSHOT");
  const target = objectById(requirementModel, "PROG-OBJ-STUDENT-TARGET");
  const choice = objectById(requirementModel, "PROG-OBJ-NEXT-TARGET-CHOICE");

  assert.equal(progress.phase, 2);
  assert.equal(progress.releaseStatus, "PLANNED");
  for (const fieldId of [
    "PROG-SNAPSHOT-F-GRADE-REF",
    "PROG-SNAPSHOT-F-COURSE-REF",
    "PROG-SNAPSHOT-F-UNIT-REF",
    "PROG-SNAPSHOT-F-TARGET-REF",
    "PROG-SNAPSHOT-F-PREREQUISITE-TARGET-REFS",
    "PROG-SNAPSHOT-F-NEXT-ALLOWED-TARGET-REF",
  ]) assert.ok(snapshot.fields.some(({ id }) => id === fieldId), fieldId);
  assert.ok(target.fields.some(({ id }) => id === "PROG-TARGET-F-STATUS"));
  assert.ok(choice.fields.some(({ id }) => id === "PROG-CHOICE-F-STUDENT-CHOICE"));
  assert.ok(actionById(requirementModel, "PROG-ACT-PROPOSE-NEXT-TARGET")
    .inputFieldIds.includes("PROG-CHOICE-F-COMPLETION-EVIDENCE-REF"));
  assert.ok(actionById(requirementModel, "PROG-ACT-SELECT-NEXT-TARGET")
    .permissions.some(({ roleRef, effect }) => roleRef === "ROLE-STUDENT" && effect === "ALLOW"));
  assert.deepEqual(validateRequirementModel(requirementModel), []);
});

test("minimum progress rejects a complete-profile dependency and missing completion evidence", () => {
  const model = structuredClone(requirementModel);
  moduleById(model, "PROG-001").dependencyModuleIds.push("INS-001");
  actionById(model, "PROG-ACT-PROPOSE-NEXT-TARGET").inputFieldIds =
    actionById(model, "PROG-ACT-PROPOSE-NEXT-TARGET").inputFieldIds
      .filter((id) => id !== "PROG-CHOICE-F-COMPLETION-EVIDENCE-REF");
  const errors = validateRequirementModel(model);
  assertHasCode(errors, "INVALID_MINIMUM_PROGRESS_CONTRACT");
});

test("AI cannot turn a proposed next target into a class activity or a student choice", () => {
  const model = structuredClone(requirementModel);
  const action = actionById(model, "PROG-ACT-SELECT-NEXT-TARGET");
  action.permissions = action.permissions.filter(({ actorRef }) => actorRef !== "AI");
  const errors = validateRequirementModel(model);
  assertHasCode(errors, "INVALID_MINIMUM_PROGRESS_CONTRACT");
});

test("video requests pin both problem and progress sources plus assessment and rights versions", () => {
  const request = objectById(requirementModel, "VIDEO-OBJ-REQUEST");
  const problem = actionById(requirementModel, "VIDEO-ACT-REQUEST-PROBLEM-DRIVEN");
  const progress = actionById(requirementModel, "VIDEO-ACT-REQUEST-PROGRESS-DRIVEN");
  assert.deepEqual(optionById(requirementModel, "OPT-P2-VIDEO-REQUEST-KIND").values.map(({ code }) => code), [
    "PROBLEM_DRIVEN",
    "PROGRESS_DRIVEN",
  ]);
  for (const pair of [
    ["VIDEO-REQUEST-F-ASSESSMENT-RESULT-REF", "VIDEO-REQUEST-F-ASSESSMENT-RESULT-VERSION"],
    ["VIDEO-REQUEST-F-ASSESSMENT-STANDARD-REF", "VIDEO-REQUEST-F-ASSESSMENT-STANDARD-VERSION"],
    ["VIDEO-REQUEST-F-PUBLISHED-RESULT-REF", "VIDEO-REQUEST-F-PUBLISHED-RESULT-VERSION"],
    ["VIDEO-REQUEST-F-MATERIAL-RIGHTS-REF", "VIDEO-REQUEST-F-MATERIAL-RIGHTS-VERSION"],
    ["VIDEO-REQUEST-F-MATERIAL-PERMISSION-REF", "VIDEO-REQUEST-F-MATERIAL-PERMISSION-VERSION"],
  ]) {
    const ref = request.lineageBindings.find(({ refFieldId }) => refFieldId === pair[0]);
    assert.equal(ref.versionFieldId, pair[1]);
  }
  assert.ok(problem.inputFieldIds.includes("VIDEO-REQUEST-F-ACTIVITY-REF"));
  assert.ok(progress.inputFieldIds.includes("VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-REF"));
  assert.deepEqual(validateRequirementModel(requirementModel), []);
});

test("video delivery is blocked when any one of seven independent gates is not passed", () => {
  const model = structuredClone(requirementModel);
  const deliver = actionById(model, "VIDEO-ACT-DELIVER-USABLE");
  deliver.inputFieldIds = deliver.inputFieldIds.filter((id) => id !== "VIDEO-ASSET-F-RIGHTS-GATE");
  const errors = validateRequirementModel(model);
  assertHasCode(errors, "INVALID_VIDEO_GATE_CONTRACT");
});

test("controlled playback keeps subtitles, summary, low-bandwidth alternative and honest download boundary", () => {
  const model = structuredClone(requirementModel);
  optionById(model, "OPT-P2-VIDEO-EXTERNAL-RECORDING-BOUNDARY").values[0].code = "PREVENT_EXTERNAL_RECORDING";
  const errors = validateRequirementModel(model);
  assertHasCode(errors, "INVALID_VIDEO_CONTROLLED_PLAYBACK_CONTRACT");
});

test("video quota reserves before generation, settles only on usable delivery, and releases on every non-delivery cause", () => {
  const model = structuredClone(requirementModel);
  const release = actionById(model, "VIDEO-ACT-RELEASE-QUOTA");
  release.acceptedInputValues[0].codes = ["PLATFORM_FAILURE"];
  const settle = actionById(model, "VIDEO-ACT-SETTLE-USABLE-DELIVERY");
  settle.permissions.find(({ effect, actorRef }) => effect === "ALLOW" && actorRef === "SYSTEM").condition =
    "processing completed, so settle regardless of whether a usable video was delivered";
  const errors = validateRequirementModel(model);
  assertHasCode(errors, "INVALID_VIDEO_QUOTA_CONTRACT");
});

test("recall stops playback and participates in quota release", () => {
  const model = structuredClone(requirementModel);
  actionById(model, "VIDEO-ACT-VIEW-CONTROLLED").failureResults =
    actionById(model, "VIDEO-ACT-VIEW-CONTROLLED").failureResults
      .filter((code) => code !== "VIDEO_RECALLED");
  const errors = validateRequirementModel(model);
  assertHasCode(errors, "INVALID_VIDEO_RECALL_CONTRACT");
});

test("video access governance records requester service object management source and access scope for personal and school-private assets", () => {
  const personal = objectById(requirementModel, "VIDEO-OBJ-REQUEST");
  const school = objectById(requirementModel, "VIDEO-OBJ-SCHOOL-REQUEST");
  const asset = objectById(requirementModel, "VIDEO-OBJ-ASSET");
  const schoolAction = actionById(requirementModel, "VIDEO-ACT-REQUEST-SCHOOL-GROUP");

  for (const fieldId of [
    "VIDEO-REQUEST-F-REQUESTER-REF",
    "VIDEO-REQUEST-F-SERVICE-OBJECT-REFS",
    "VIDEO-REQUEST-F-MANAGEMENT-SCOPE",
    "VIDEO-REQUEST-F-SOURCE-MATERIALS",
    "VIDEO-REQUEST-F-ACCESS-SCOPE",
  ]) assert.ok(personal.fields.some(({ id }) => id === fieldId), fieldId);
  for (const fieldId of [
    "VIDEO-SCHOOL-REQUEST-F-REQUESTER-TEACHER-REF",
    "VIDEO-SCHOOL-REQUEST-F-SERVICE-OBJECT-REFS",
    "VIDEO-SCHOOL-REQUEST-F-MANAGEMENT-SCOPE",
    "VIDEO-SCHOOL-REQUEST-F-SOURCE-MATERIALS",
    "VIDEO-SCHOOL-REQUEST-F-ACCESS-SCOPE",
  ]) assert.ok(school.fields.some(({ id }) => id === fieldId), fieldId);
  assert.equal(school.ownerRef, "ROLE-SCHOOL-ADMIN");
  assert.equal(asset.ownerRef, "SYSTEM");
  assert.ok(schoolAction.permissions.some(({ effect, dutyRef }) => (
    effect === "ALLOW" && dutyRef === "DUTY-SUBJECT-TEACHER"
  )));
  assert.ok(flowById(requirementModel, "DF-P2-005").steps.some(({ actionId }) => (
    actionId === "VIDEO-ACT-VIEW-SCHOOL-PRIVATE"
  )));
  assert.deepEqual(validateRequirementModel(requirementModel), []);
});

test("school-private video cannot lose school management or become automatically portable or public", () => {
  const model = structuredClone(requirementModel);
  objectById(model, "VIDEO-OBJ-SCHOOL-REQUEST").ownerRef = "DUTY-SUBJECT-TEACHER";
  objectById(model, "VIDEO-OBJ-ASSET").fields.find(({ id }) => (
    id === "VIDEO-ASSET-F-PROMOTION-POLICY"
  )).validation = "automatically publish every accepted video to the public knowledge layer";
  actionById(model, "VIDEO-ACT-START-SCHOOL-GROUP-GENERATION").permissions =
    actionById(model, "VIDEO-ACT-START-SCHOOL-GROUP-GENERATION").permissions
      .filter(({ actorRef }) => actorRef !== "AI");
  assertHasCode(validateRequirementModel(model), "INVALID_VIDEO_ACCESS_GOVERNANCE_CONTRACT");
});

test("post-video verification creates a separate version-pinned learning fact instead of treating viewing as mastery", () => {
  const verification = objectById(requirementModel, "VIDEO-OBJ-VERIFICATION");
  const fact = objectById(requirementModel, "VIDEO-OBJ-LEARNING-FACT");
  const flow = flowById(requirementModel, "DF-P2-004");

  assert.ok(verification.fields.some(({ id }) => id === "VIDEO-VERIFY-F-ABILITY-NODE-REFS"));
  assert.ok(verification.fields.some(({ id }) => id === "VIDEO-VERIFY-F-FIRST-EXPRESSION"));
  assert.ok(fact.lineageBindings.some(({ refFieldId }) => (
    refFieldId === "VIDEO-FACT-F-VERIFICATION-REF"
  )));
  const actions = flow.steps.map(({ actionId }) => actionId);
  assert.ok(actions.indexOf("VIDEO-ACT-RECORD-POST-VIDEO-LEARNING-FACT")
    > actions.indexOf("VIDEO-ACT-COMPLETE-NEW-CONTEXT-VERIFICATION"));
  assert.doesNotMatch(
    JSON.stringify(optionById(requirementModel, "OPT-P2-VIDEO-VERIFICATION-RESULT")),
    /MASTERY|MASTERED/,
  );
  assert.deepEqual(validateRequirementModel(requirementModel), []);
});

test("view completion cannot be mutated into mastery evidence or bypass the completed verification fact path", () => {
  const model = structuredClone(requirementModel);
  model.modules.flatMap((module) => module.scenarios).find((scenario) => (
    scenario.actionId === "VIDEO-ACT-VIEW-CONTROLLED" && scenario.kind === "SUCCESS"
  )).then.expectedData = "watch completion directly proves durable mastery";
  flowById(model, "DF-P2-004").steps = flowById(model, "DF-P2-004").steps
    .filter(({ actionId }) => actionId !== "VIDEO-ACT-COMPLETE-NEW-CONTEXT-VERIFICATION");
  assertHasCode(validateRequirementModel(model), "INVALID_VIDEO_VERIFICATION_CONTRACT");
});

test("Feynman remains on-demand one-node and cannot reveal an answer before the first expression", () => {
  const model = structuredClone(requirementModel);
  optionById(model, "OPT-P2-VIDEO-VERIFICATION-STRATEGY").values = [{
    code: "FEYNMAN_ON_DEMAND",
    label: "所有目标统一强制费曼",
  }];
  const abilityNodes = objectById(model, "VIDEO-OBJ-VERIFICATION").fields.find(({ id }) => (
    id === "VIDEO-VERIFY-F-ABILITY-NODE-REFS"
  ));
  abilityNodes.validation = "may contain multiple ability nodes";
  actionById(model, "VIDEO-ACT-SUBMIT-FIRST-INDEPENDENT-EXPRESSION").failureResults =
    actionById(model, "VIDEO-ACT-SUBMIT-FIRST-INDEPENDENT-EXPRESSION").failureResults
      .filter((code) => code !== "ANSWER_HINT_ALREADY_SHOWN");
  assertHasCode(validateRequirementModel(model), "INVALID_VIDEO_VERIFICATION_CONTRACT");
});

test("voice remains optional and accent fluency or recognition error cannot become a knowledge gap", () => {
  const model = structuredClone(requirementModel);
  optionById(model, "OPT-P2-VIDEO-VERIFICATION-MODALITY").values = [{
    code: "VOICE_OPTIONAL",
    label: "强制语音",
  }];
  optionById(model, "OPT-P2-VIDEO-NONKNOWLEDGE-SIGNAL").values = [{
    code: "ACCENT",
    label: "口音直接计为知识缺口",
  }];
  actionById(model, "VIDEO-ACT-PURSUE-ONE-SPECIFIC-GAP").permissions =
    actionById(model, "VIDEO-ACT-PURSUE-ONE-SPECIFIC-GAP").permissions
      .filter(({ actorRef }) => actorRef !== "AI");
  assertHasCode(validateRequirementModel(model), "INVALID_VIDEO_VERIFICATION_CONTRACT");
});

test("an unknown response must return to teaching and retry in a materially different context", () => {
  const model = structuredClone(requirementModel);
  actionById(model, "VIDEO-ACT-RETURN-UNKNOWN-TO-TEACHING").transition.to =
    "FIRST_EXPRESSION_RECORDED";
  actionById(model, "VIDEO-ACT-RETRY-DIFFERENT-CONTEXT").transition.to =
    "FIRST_EXPRESSION_RECORDED";
  flowById(model, "DF-P2-004").steps = flowById(model, "DF-P2-004").steps
    .filter(({ actionId }) => actionId !== "VIDEO-ACT-SUBMIT-DIFFERENT-CONTEXT-EXPRESSION");
  assertHasCode(validateRequirementModel(model), "INVALID_VIDEO_VERIFICATION_CONTRACT");
});
