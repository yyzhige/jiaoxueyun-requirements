import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import { validateTeacherAuthorSurrogateContract } from "../requirements-v2/validate/teacher-author-surrogate-validator.mjs";

function moduleById(model, moduleId) {
  return model.modules.find(({ id }) => id === moduleId);
}

function objectById(model, objectId) {
  return model.modules.flatMap(({ objects }) => objects)
    .find(({ id }) => id === objectId);
}

function actionById(model, actionId) {
  return model.modules.flatMap(({ actions }) => actions)
    .find(({ id }) => id === actionId);
}

function eventById(model, eventId) {
  return model.events.find(({ id }) => id === eventId);
}

function flowById(model, flowId) {
  return model.flows.find(({ id }) => id === flowId);
}

function errorsAfter(mutator) {
  const model = structuredClone(requirementModel);
  mutator(model);
  return validateTeacherAuthorSurrogateContract(model).join("\n");
}

test("D051 closes teacher identity deletion through one versioned event and non-recoverable authorship rewrite", () => {
  assert.deepEqual(validateTeacherAuthorSurrogateContract(requirementModel), []);

  const producer = actionById(requirementModel, "ACC-ACT-COMPLETE-IDENTITY-DELETION");
  const consumer = actionById(requirementModel, "DGV-ACT-CREATE-TEACHER-AUTHOR-SURROGATE");
  const event = eventById(requirementModel, "EVT-TEACHER-IDENTITY-DELETION-COMPLETED");
  const flow = flowById(requirementModel, "DF-016");
  const surrogate = objectById(requirementModel, "DGV-OBJ-TEACHER-AUTHOR-SURROGATE");

  assert.ok(producer.producedEventIds.includes(event.id));
  assert.deepEqual(event.producerActionIds, [producer.id]);
  assert.deepEqual(event.triggeredActionIds, [consumer.id]);
  assert.equal(consumer.trigger.eventId, event.id);
  assert.equal(producer.teacherDeletionEventEmission.requiredSubjectKindCode, "TEACHER");
  assert.equal(producer.teacherDeletionEventEmission.nonTeacherEffect, "NO_EVENT");
  assert.equal(
    producer.inputFieldIds.includes("ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT"),
    false,
  );
  assert.equal(
    producer.outputFieldIds.includes("ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT"),
    true,
  );
  assert.equal(
    consumer.duplicateDeliveryPolicy.exactDuplicateEffect,
    "RETURN_EXISTING_SURROGATE_AND_MAPPING",
  );
  assert.equal(
    consumer.authorshipRewriteContract.originalIdentityPersistenceAllowed,
    false,
  );
  assert.equal(
    surrogate.fields.some(({ id }) => id === "DGV-SURROGATE-F-PLATFORM-IDENTITY-ID"),
    false,
  );
  assert.deepEqual(flow.steps.map(({ actionId }) => actionId), [producer.id, consumer.id]);
  assert.equal(flow.teacherAuthorSurrogateFlowContract.consumerFailureRestoresIdentity, false);
});

test("D051 destructive mutations fail the dedicated producer-event-consumer gate", () => {
  const mutations = [
    ["missing producer event", (model) => {
      actionById(model, "ACC-ACT-COMPLETE-IDENTITY-DELETION").producedEventIds = [];
    }],
    ["missing event producer", (model) => {
      eventById(model, "EVT-TEACHER-IDENTITY-DELETION-COMPLETED").producerActionIds = [];
    }],
    ["student event widening", (model) => {
      actionById(model, "ACC-ACT-COMPLETE-IDENTITY-DELETION")
        .teacherDeletionEventEmission.requiredSubjectKindCode = "STUDENT";
    }],
    ["circular system snapshot input", (model) => {
      actionById(model, "ACC-ACT-COMPLETE-IDENTITY-DELETION")
        .inputFieldIds.push("ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT");
    }],
    ["event version binding removed", (model) => {
      eventById(model, "EVT-TEACHER-IDENTITY-DELETION-COMPLETED")
        .teacherDeletionContextContract.consumerBindings[0].eventVersionFieldId = "UNKNOWN";
    }],
    ["consumer event version input removed", (model) => {
      const action = actionById(model, "DGV-ACT-CREATE-TEACHER-AUTHOR-SURROGATE");
      action.inputFieldIds = action.inputFieldIds.filter((fieldId) => (
        fieldId !== "DGV-SURROGATE-F-DELETION-EVENT-VERSION"
      ));
    }],
    ["duplicate creates another mapping", (model) => {
      actionById(model, "DGV-ACT-CREATE-TEACHER-AUTHOR-SURROGATE")
        .duplicateDeliveryPolicy.exactDuplicateEffect = "CREATE_ANOTHER_MAPPING";
    }],
    ["original identity persistence enabled", (model) => {
      actionById(model, "DGV-ACT-CREATE-TEACHER-AUTHOR-SURROGATE")
        .authorshipRewriteContract.originalIdentityPersistenceAllowed = true;
    }],
    ["reverse lookup field added", (model) => {
      objectById(model, "DGV-OBJ-TEACHER-AUTHOR-SURROGATE").fields.push({
        id: "DGV-SURROGATE-F-PLATFORM-IDENTITY-ID",
      });
    }],
    ["consumer step removed", (model) => {
      flowById(model, "DF-016").steps.pop();
    }],
    ["identity restoration compensation", (model) => {
      flowById(model, "DF-016").compensation.strategy = "RESTORE_DELETED_IDENTITY";
    }],
    ["rewrite failure scenario removed", (model) => {
      const module = moduleById(model, "DGV-001");
      module.scenarios = module.scenarios.filter(({ id }) => (
        id !== "DGV-ACT-CREATE-TEACHER-AUTHOR-SURROGATE-SCN-AUTHORSHIP_REWRITE_FAILED"
      ));
    }],
    ["D051 flow trace removed", (model) => {
      model.decisionTraceability.find(({ decisionId }) => decisionId === "D051").flowIds = [];
    }],
  ];

  for (const [label, mutate] of mutations) {
    assert.match(
      errorsAfter(mutate),
      /INVALID_TEACHER_AUTHOR_SURROGATE_CONTRACT/,
      label,
    );
  }
});
