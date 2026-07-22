import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import {
  validateAiResponsibilityContracts,
} from "../requirements-v2/validate/ai-responsibility-validator.mjs";

const CONTRACT_ERROR = "INVALID_AI_RESPONSIBILITY_CONTRACT";
const ROLE_ERROR = "INVALID_AI_RESPONSIBILITY_ROLE";

function allObjects(model) {
  return model.modules.flatMap(({ objects }) => objects);
}

function objectById(model, objectId) {
  return allObjects(model).find(({ id }) => id === objectId);
}

function aiParticipantObjects(model) {
  return allObjects(model).filter((object) => (
    object.producerRef === "AI" || object.confirmerRef === "AI"
  ));
}

function assertRejected(mutator, code = CONTRACT_ERROR, evidence = "") {
  const model = structuredClone(requirementModel);
  mutator(model);
  const errors = validateAiResponsibilityContracts(model);
  assert.ok(errors.some((error) => (
    error.startsWith(code) && (!evidence || error.includes(evidence))
  )), errors.join("\n"));
}

test("dynamically accepts every explicit AI producer or confirmer derived from object facts", () => {
  const candidates = aiParticipantObjects(requirementModel);
  assert.deepEqual(candidates.map(({ id }) => id).toSorted(), [
    "CORR-OBJ-ATTEMPT-ASSESSMENT",
    "GRD-OBJ-DECISION",
    "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
  ]);
  assert.ok(candidates.every((object) => (
    object.dataNature === "AI_DERIVED"
    && object.originalFactOverwritePolicy === "FORBIDDEN"
    && object.derivedJudgmentContract
  )));
  assert.deepEqual(validateAiResponsibilityContracts(requirementModel), []);
});

test("discovers a newly AI-produced derived object without an object-id allowlist", () => {
  const model = structuredClone(requirementModel);
  objectById(model, "PUB-OBJ-RESULT").producerRef = "AI";
  assert.deepEqual(validateAiResponsibilityContracts(model), []);
});

test("accepts AI confirmation and the explicit aiResponsibilityContract alias", () => {
  const model = structuredClone(requirementModel);
  const decision = objectById(model, "GRD-OBJ-DECISION");
  decision.producerRef = "SYSTEM";
  decision.confirmerRef = "AI";
  decision.aiResponsibilityContract = structuredClone(decision.derivedJudgmentContract);
  delete decision.derivedJudgmentContract;
  assert.deepEqual(validateAiResponsibilityContracts(model), []);
});

test("rejects AI production or confirmation on student drafts, submissions, and raw corrections", () => {
  for (const objectId of ["SUB-OBJ-DRAFT", "SUB-OBJ-ATTEMPT", "CORR-OBJ-ATTEMPT"]) {
    for (const property of ["producerRef", "confirmerRef"]) {
      assertRejected((model) => {
        objectById(model, objectId)[property] = "AI";
      }, CONTRACT_ERROR, objectId);
    }
  }
});

test("rejects an AI participant when the explicit responsibility contract is removed", () => {
  for (const objectId of [
    "GRD-OBJ-DECISION",
    "GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION",
    "CORR-OBJ-ATTEMPT-ASSESSMENT",
  ]) {
    assertRejected((model) => {
      delete objectById(model, objectId).derivedJudgmentContract;
    }, CONTRACT_ERROR, objectId);
  }
});

test("rejects an AI participant when derived nature or original-fact protection is weakened", () => {
  assertRejected((model) => {
    objectById(model, "GRD-OBJ-DECISION").dataNature = "RAW_FACT";
  }, CONTRACT_ERROR, "dataNature=AI_DERIVED");
  assertRejected((model) => {
    objectById(model, "CORR-OBJ-ATTEMPT-ASSESSMENT")
      .originalFactOverwritePolicy = "ALLOWED";
  }, CONTRACT_ERROR, "originalFactOverwritePolicy=FORBIDDEN");
});

test("rejects AI ownership or stewardship on every governed object", () => {
  for (const property of ["ownerRef", "stewardRef"]) {
    assertRejected((model) => {
      objectById(model, "SUB-OBJ-ATTEMPT")[property] = "AI";
    }, ROLE_ERROR, `SUB-OBJ-ATTEMPT.${property}`);
  }
});

test("verifies source, version, validity, dispute, and supersession evidence", () => {
  const mutations = [
    (object) => { object.derivedJudgmentContract.sourceRefFieldId = "GRD-F-MISSING-SOURCE"; },
    (object) => { object.derivedJudgmentContract.sourceVersionFieldId = "GRD-F-MISSING-SOURCE-VERSION"; },
    (object) => { object.derivedJudgmentContract.validityFieldId = "GRD-F-MISSING-VALIDITY"; },
    (object) => { object.derivedJudgmentContract.disputeFieldId = "GRD-F-MISSING-DISPUTE"; },
    (object) => { object.derivedJudgmentContract.priorRefFieldId = "GRD-F-MISSING-PRIOR"; },
    (object) => { object.derivedJudgmentContract.priorVersionFieldId = "GRD-F-MISSING-PRIOR-VERSION"; },
    (object) => { object.derivedJudgmentContract.supersessionReasonFieldId = "GRD-F-MISSING-REASON"; },
    (object) => { object.derivedJudgmentContract.versionFieldId = "GRD-F-MISSING-VERSION"; },
    (object) => {
      const sourceRefFieldId = object.derivedJudgmentContract.sourceRefFieldId;
      object.lineageBindings = object.lineageBindings.filter(({ refFieldId }) => (
        refFieldId !== sourceRefFieldId
      ));
    },
    (object) => {
      object.derivedJudgmentContract.recomputation.requiredOutputFieldIds = [];
    },
  ];
  for (const mutate of mutations) {
    assertRejected((model) => {
      mutate(objectById(model, "GRD-OBJ-DECISION"));
    }, CONTRACT_ERROR, "GRD-OBJ-DECISION");
  }
});

test("rejects conflicting explicit AI responsibility contracts", () => {
  assertRejected((model) => {
    const decision = objectById(model, "GRD-OBJ-DECISION");
    decision.aiResponsibilityContract = structuredClone(decision.derivedJudgmentContract);
    decision.aiResponsibilityContract.validityFieldId = decision.derivedJudgmentContract.disputeFieldId;
  }, CONTRACT_ERROR, "declared AI responsibility contracts disagree");
});
