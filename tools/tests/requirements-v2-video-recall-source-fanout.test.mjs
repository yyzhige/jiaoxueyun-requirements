import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import {
  VIDEO_RECALL_FLOW_ID,
  VIDEO_RECALL_SOURCE_EVENT_ID,
  applyVideoRecallSourceContracts,
  applyVideoRecallSourceEvents,
  applyVideoRecallSourceFlowContracts,
  videoRecallSourceBindings,
} from "../requirements-v2/facts/video-recall-source-fanout.mjs";
import {
  validateVideoRecallSourceFanout,
} from "../requirements-v2/validate/video-recall-source-fanout-validator.mjs";

function decoratedModel() {
  const model = structuredClone(requirementModel);
  model.modules = applyVideoRecallSourceContracts(model.modules);
  model.events = applyVideoRecallSourceEvents(model.events);
  model.flows = applyVideoRecallSourceFlowContracts(model.flows);
  return model;
}

function objectById(model, objectId) {
  return model.modules.flatMap(({ objects }) => objects).find(({ id }) => id === objectId);
}

function actionById(model, actionId) {
  return model.modules.flatMap(({ actions }) => actions).find(({ id }) => id === actionId);
}

function eventById(model, eventId) {
  return model.events.find(({ id }) => id === eventId);
}

function flowById(model, flowId) {
  return model.flows.find(({ id }) => id === flowId);
}

function assertRejected(mutator, evidence = "") {
  const model = decoratedModel();
  mutator(model);
  const errors = validateVideoRecallSourceFanout(model);
  assert.ok(errors.some((error) => (
    error.startsWith("INVALID_D084_")
    && (!evidence || error.toLowerCase().includes(evidence.toLowerCase()))
  )), errors.join("\n"));
}

test("D084 binds five real source mutations to one versioned recall event and flow", () => {
  const model = decoratedModel();
  const event = eventById(model, VIDEO_RECALL_SOURCE_EVENT_ID);
  assert.deepEqual(event.producerActionIds, videoRecallSourceBindings.map(({ actionId }) => actionId));
  assert.deepEqual(event.triggeredActionIds, ["VIDEO-ACT-LOCATE-RECALL-IMPACT"]);
  for (const binding of videoRecallSourceBindings) {
    const action = actionById(model, binding.actionId);
    assert.ok(action.producedEventIds.includes(VIDEO_RECALL_SOURCE_EVENT_ID));
    assert.equal(action.videoRecallSourceEventBinding.sourceVersionFieldId, binding.sourceVersionFieldId);
  }
  assert.deepEqual(validateVideoRecallSourceFanout(model), []);
});

test("D084 rejects removal or rebinding of every source producer", () => {
  for (const binding of videoRecallSourceBindings) {
    assertRejected((model) => {
      actionById(model, binding.actionId).producedEventIds = [];
    }, `action=${binding.actionId}`);
    assertRejected((model) => {
      actionById(model, binding.actionId)
        .videoRecallSourceEventBinding.sourceVersionFieldId = "BROKEN-VERSION";
    }, `action=${binding.actionId}`);
    assertRejected((model) => {
      eventById(model, VIDEO_RECALL_SOURCE_EVENT_ID).sourceBindings
        .find(({ actionId }) => actionId === binding.actionId).sourceObjectId = "BROKEN-OBJECT";
    }, "unified event");
    assertRejected((model) => {
      const flow = flowById(model, VIDEO_RECALL_FLOW_ID);
      flow.sourceDataRefs = flow.sourceDataRefs.filter(({ objectId, fieldId }) => !(
        objectId === binding.sourceObjectId && fieldId === binding.sourceVersionFieldId
      ));
    }, "DF-P2-003");
  }
});

test("D084 requires a versioned membership source written by every state transition", () => {
  assertRejected((model) => {
    objectById(model, "ACC-OBJ-MEMBERSHIP").fields = objectById(model, "ACC-OBJ-MEMBERSHIP")
      .fields.filter(({ id }) => id !== "ACC-MEMBER-F-VERSION");
  }, "membership");
  for (const actionId of [
    "ACC-ACT-FIRST-ACTIVATION",
    "ACC-ACT-SUSPEND-MEMBERSHIP",
    "ACC-ACT-DEACTIVATE-MEMBERSHIP",
  ]) {
    assertRejected((model) => {
      const action = actionById(model, actionId);
      action.outputFieldIds = action.outputFieldIds.filter((id) => id !== "ACC-MEMBER-F-VERSION");
    }, "membership");
  }
});

test("D084 rejects a locator detached from the source event or immutable impact set", () => {
  assertRejected((model) => {
    actionById(model, "VIDEO-ACT-LOCATE-RECALL-IMPACT").trigger.eventId = "BROKEN-EVENT";
  }, "locator");
  assertRejected((model) => {
    eventById(model, VIDEO_RECALL_SOURCE_EVENT_ID).triggeredActionIds = [];
  }, "unified event");
  assertRejected((model) => {
    actionById(model, "VIDEO-ACT-LOCATE-RECALL-IMPACT").outputFieldIds = [];
  }, "locator");
  assertRejected((model) => {
    objectById(model, "VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT")
      .recallSourceBindingContract.exactlyOneSourceBindingRequired = false;
  }, "locator");
});

test("D084 rejects recall without the captured snapshot and source-event version", () => {
  assertRejected((model) => {
    actionById(model, "VIDEO-ACT-RECALL").relatedStateGuards = [];
  }, "execution");
  assertRejected((model) => {
    actionById(model, "VIDEO-ACT-RECALL")
      .recallExecutionContract.sourceEventVersionFieldId = "VIDEO-ASSET-F-VERSION";
  }, "execution");
  assertRejected((model) => {
    actionById(model, "VIDEO-ACT-RECALL").inputFieldIds = actionById(model, "VIDEO-ACT-RECALL")
      .inputFieldIds.filter((id) => id !== "VIDEO-ASSET-F-RECALL-SOURCE-EVENT-VERSION");
  }, "execution");
  assertRejected((model) => {
    actionById(model, "VIDEO-ACT-RECALL")
      .recallExecutionContract.alreadyRecalledBehavior = "CREATE_ANOTHER_RECALL";
  }, "execution");
});

test("D084 rejects delivery or playback that does not fail closed for recalled assets", () => {
  for (const actionId of [
    "VIDEO-ACT-DELIVER-USABLE",
    "VIDEO-ACT-VIEW-CONTROLLED",
    "VIDEO-ACT-VIEW-SCHOOL-PRIVATE",
  ]) {
    assertRejected((model) => {
      delete actionById(model, actionId).recallConsumptionGuard;
    }, `action=${actionId}`);
    assertRejected((model) => {
      const action = actionById(model, actionId);
      action.failureResults = action.failureResults.filter((code) => code !== "VIDEO_RECALLED");
    }, `action=${actionId}`);
  }
});

test("D084 rejects flow participant, branch, and exact-source-binding drift", () => {
  assertRejected((model) => {
    flowById(model, VIDEO_RECALL_FLOW_ID).moduleIds = ["VIDEO-001"];
  }, "DF-P2-003");
  assertRejected((model) => {
    flowById(model, VIDEO_RECALL_FLOW_ID).sourceOnlyModuleIds = ["ACC-001"];
  }, "DF-P2-003");
  assertRejected((model) => {
    flowById(model, VIDEO_RECALL_FLOW_ID).executionPaths.pop();
  }, "DF-P2-003");
  assertRejected((model) => {
    flowById(model, VIDEO_RECALL_FLOW_ID)
      .eventInvalidationContract.exactlyOneSourceBindingPerInvocation = false;
  }, "DF-P2-003");
});
