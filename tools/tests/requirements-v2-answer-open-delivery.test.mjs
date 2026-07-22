import test from "node:test";
import assert from "node:assert/strict";

import {
  SAFE_RESULT_DISCOVERY_FIELD_IDS,
  answerOpenSurfaceExecutionRegistry,
  applyAnswerOpenDeliveryContracts,
} from "../requirements-v2/facts/answer-open-delivery.mjs";
import { requirementModel } from "../requirements-v2/facts/index.mjs";
import {
  validateAnswerOpenDeliveryContracts,
} from "../requirements-v2/validate/answer-open-delivery-validator.mjs";

function decoratedModel() {
  const model = structuredClone(requirementModel);
  model.modules = applyAnswerOpenDeliveryContracts(model.modules);
  return model;
}

function moduleById(model, moduleId) {
  return model.modules.find(({ id }) => id === moduleId);
}

function actionById(model, actionId) {
  return model.modules.flatMap(({ actions }) => actions)
    .find(({ id }) => id === actionId);
}

function assertRejected(mutator, evidence = "") {
  const model = decoratedModel();
  mutator(model);
  const errors = validateAnswerOpenDeliveryContracts(model);
  assert.ok(errors.some((error) => (
    error.startsWith("INVALID_ANSWER_OPEN_DELIVERY_CONTRACT")
    && (!evidence || error.includes(evidence))
  )), errors.join("\n"));
}

test("D077 binds every delivery surface to real execution actions", () => {
  const model = decoratedModel();
  const contract = moduleById(model, "PUB-001").answerOpenContract;
  assert.deepEqual(
    contract.enforcementBindings.map(({ surface }) => surface),
    answerOpenSurfaceExecutionRegistry.map(({ surface }) => surface),
  );
  for (const { moduleId, stages, surface } of answerOpenSurfaceExecutionRegistry) {
    for (const { actionId, stage } of stages) {
      const action = actionById(model, actionId);
      assert.ok(action, `${moduleId}:${actionId}`);
      assert.deepEqual(action.answerOpenEnforcement.surfaces, [surface]);
      assert.equal(action.answerOpenEnforcement.executionStage, stage);
      assert.equal(action.answerOpenEnforcement.reauthorizeAtAccess, true);
      assert.equal(action.answerOpenEnforcement.currentTimeReevaluated, true);
      assert.equal(action.answerOpenEnforcement.sourceVersionRechecked, true);
    }
  }
  assert.deepEqual(validateAnswerOpenDeliveryContracts(model), []);
});

test("D077 rejects deletion or rebinding of every registered surface action", () => {
  for (const { moduleId, stages, surface } of answerOpenSurfaceExecutionRegistry) {
    for (const { actionId } of stages) {
      assertRejected((model) => {
        const module = moduleById(model, moduleId);
        module.actions = module.actions.filter(({ id }) => id !== actionId);
      }, `action=${actionId}`);
      assertRejected((model) => {
        actionById(model, actionId).answerOpenEnforcement.surfaces = ["BROKEN_SURFACE"];
      }, `action=${actionId}`);
      assertRejected((model) => {
        const binding = moduleById(model, "PUB-001").answerOpenContract
          .enforcementBindings.find((candidate) => candidate.surface === surface);
        binding.actionIds = binding.actionIds.filter((id) => id !== actionId);
      }, `surface=${surface}`);
    }
  }
});

test("D077 search, cache, and direct links return safe metadata then delegate to the final gateway", () => {
  for (const actionId of [
    "PUB-ACT-SEARCH-PUBLISHED-RESULTS",
    "PUB-ACT-OPEN-CACHED-RESULT",
    "PUB-ACT-OPEN-DIRECT-RESULT-LINK",
  ]) {
    const model = decoratedModel();
    assert.deepEqual(actionById(model, actionId).outputFieldIds, SAFE_RESULT_DISCOVERY_FIELD_IDS);
    assertRejected((mutated) => {
      actionById(mutated, actionId)
        .restrictedResultConsumption.delegatesRestrictedContentToActionId = "PUB-ACT-MATERIALIZE-RESULT";
    }, `action=${actionId}`);
    assertRejected((mutated) => {
      actionById(mutated, actionId)
        .restrictedResultConsumption.delegationCarriesSourceIdentityAndVersion = false;
    }, `action=${actionId}`);
    assertRejected((mutated) => {
      actionById(mutated, actionId)
        .restrictedResultConsumption.finalGatewayReauthorizes = false;
    }, `action=${actionId}`);
    assertRejected((mutated) => {
      actionById(mutated, actionId).outputFieldIds.push("PUB-RESULT-F-ANSWER");
    }, `action=${actionId}`);
  }
});

test("D077 rejects a final result gateway that stops reauthorizing time or source version", () => {
  for (const property of [
    "reauthorizeAtAccess",
    "currentTimeReevaluated",
    "sourceVersionRechecked",
  ]) {
    assertRejected((model) => {
      actionById(model, "PUB-ACT-VIEW-RESULT").answerOpenEnforcement[property] = false;
    }, "PUB-ACT-VIEW-RESULT");
  }
});

test("D077 notification strips restricted payload but continues the safe summary", () => {
  for (const actionId of ["NOTI-ACT-QUEUE-DELIVERY", "NOTI-ACT-DELIVER"]) {
    const model = decoratedModel();
    const action = actionById(model, actionId);
    assert.equal(
      action.answerOpenEnforcement.beforeOpenBehavior,
      "STRIP_RESTRICTED_CONTENT_AND_DELIVER_SAFE_SUMMARY",
    );
    assert.ok(!action.failureResults.includes("ANSWER_NOT_OPEN"));
    assertRejected((mutated) => {
      actionById(mutated, actionId).failureResults.push("ANSWER_NOT_OPEN");
    }, `action=${actionId}`);
    assertRejected((mutated) => {
      actionById(mutated, actionId)
        .restrictedResultConsumption.restrictedPayloadBeforeOpen = "BLOCK_DELIVERY";
    }, `action=${actionId}`);
    assertRejected((mutated) => {
      actionById(mutated, actionId).outputFieldIds.push("PUB-RESULT-F-FEEDBACK-LAYER-4");
    }, `action=${actionId}`);
  }
});

test("D077 rejects an unregistered restricted-result consumer", () => {
  assertRejected((model) => {
    const consumer = actionById(model, "HW-ACT-CREATE-DRAFT");
    consumer.restrictedResultConsumption = structuredClone(
      actionById(model, "PUB-ACT-VIEW-RESULT").restrictedResultConsumption,
    );
  }, "outside the surface registry");
});

test("D077 rejects missing fail-closed boundaries and incomplete gateway registry", () => {
  assertRejected((model) => {
    const action = actionById(model, "PUB-ACT-OPEN-CACHED-RESULT");
    action.failureResults = action.failureResults.filter((code) => code !== "ANSWER_NOT_OPEN");
  }, "lacks a fail-closed");
  assertRejected((model) => {
    moduleById(model, "PUB-001").answerOpenContract.resultReadActionIds.pop();
  }, "result-read gateways");
});
