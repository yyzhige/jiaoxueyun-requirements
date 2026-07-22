import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import { validateModelSemantics } from "../requirements-v2/validate/semantic-validator.mjs";

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

function d043Errors(model) {
  return validateModelSemantics(model).filter((error) => (
    error.startsWith("INVALID_WEAK_NETWORK_CREDENTIAL")
    || error.startsWith("INVALID_WEAK_NETWORK_ACCEPTANCE_PATHS")
  ));
}

function errorsAfter(mutator) {
  const model = structuredClone(requirementModel);
  mutator(model);
  return d043Errors(model).join("\n");
}

test("D043 keeps completed intent and platform incident protection as distinct proof branches", () => {
  assert.deepEqual(d043Errors(requirementModel), []);

  const incident = objectById(
    requirementModel,
    "SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT",
  );
  const register = actionById(
    requirementModel,
    "SUB-ACT-REGISTER-PLATFORM-FAILURE-INCIDENT",
  );
  const protection = actionById(
    requirementModel,
    "SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION",
  );
  const submit = actionById(requirementModel, "SUB-ACT-SUBMIT-PROTECTED");
  const flow = flowById(requirementModel, "DF-005");

  assert.deepEqual(incident.states, ["FROZEN"]);
  assert.deepEqual(register.producedEventIds, [
    "EVT-SUB-PLATFORM-FAILURE-INCIDENT-REGISTERED",
  ]);
  assert.equal(protection.trigger.eventId, "EVT-SUB-PLATFORM-FAILURE-INCIDENT-REGISTERED");
  assert.equal(
    protection.platformFailureProtectionContract.protectedAtRule,
    "COPY_EXACT_PINNED_INCIDENT_STARTED_AT",
  );
  assert.deepEqual(submit.intentCredentialMatchGuard.requiredStates, [
    "COMPLETED",
    "PLATFORM_FAILURE_PROTECTED",
  ]);
  assert.deepEqual(
    submit.timelinessContract.stateSources.map(({ source }) => source),
    [
      "COMPLETED_INTENT_CREDENTIAL_ISSUED_AT",
      "PLATFORM_FAILURE_INCIDENT_STARTED_AT",
    ],
  );
  assert.ok(flow.executionPaths.some(({ id }) => id === "PLATFORM_FAILURE_PROTECTION"));
});

test("D043 fails closed when incident source, version, scope, manifest, state, or window is weakened", () => {
  const mutations = [
    ["platform state removed", (model) => {
      actionById(model, "SUB-ACT-SUBMIT-PROTECTED")
        .intentCredentialMatchGuard.requiredStates = ["COMPLETED"];
    }],
    ["platform state guard removed", (model) => {
      const action = actionById(model, "SUB-ACT-SUBMIT-PROTECTED");
      action.relatedStateGuards.find(({ refFieldId }) => (
        refFieldId === "SUB-ATTEMPT-F-INTENT-CREDENTIAL-REF"
      )).requiredStates = ["COMPLETED"];
    }],
    ["platform source disguised as issued time", (model) => {
      actionById(model, "SUB-ACT-SUBMIT-PROTECTED")
        .timelinessContract.stateSources[1].sourceCredentialFieldId = "SUB-INTENT-F-ISSUED-AT";
    }],
    ["incident version input removed", (model) => {
      const action = actionById(model, "SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION");
      action.inputFieldIds = action.inputFieldIds.filter((fieldId) => (
        fieldId !== "SUB-INTENT-F-PLATFORM-FAILURE-INCIDENT-VERSION"
      ));
    }],
    ["incident state guard weakened", (model) => {
      actionById(model, "SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION")
        .relatedStateGuards.find(({ refFieldId }) => (
          refFieldId === "SUB-INTENT-F-PLATFORM-FAILURE-INCIDENT-REF"
        )).requiredState = "COMPLETED";
    }],
    ["failed request manifest removed", (model) => {
      const action = actionById(model, "SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION");
      action.inputFieldIds = action.inputFieldIds.filter((fieldId) => (
        fieldId !== "SUB-INTENT-F-MANIFEST-DIGEST"
      ));
    }],
    ["finite protection deadline removed", (model) => {
      const action = actionById(model, "SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION");
      action.outputFieldIds = action.outputFieldIds.filter((fieldId) => (
        fieldId !== "SUB-INTENT-F-PLATFORM-FAILURE-PROTECTION-EXPIRES-AT"
      ));
    }],
    ["client self declaration enabled", (model) => {
      actionById(model, "SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION")
        .platformFailureProtectionContract.clientSelfDeclarationAllowed = true;
    }],
    ["event producer removed", (model) => {
      eventById(model, "EVT-SUB-PLATFORM-FAILURE-INCIDENT-REGISTERED")
        .producerActionIds = [];
    }],
    ["failure path removed", (model) => {
      const flow = flowById(model, "DF-005");
      flow.executionPaths = flow.executionPaths.filter(({ id }) => (
        id !== "PLATFORM_FAILURE_PROTECTION"
      ));
    }],
    ["scope attestation omitted", (model) => {
      actionById(model, "SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION")
        .platformFailureProtectionContract.sourceAttestationFieldId = "UNKNOWN";
    }],
  ];

  for (const [label, mutate] of mutations) {
    assert.match(errorsAfter(mutate), /INVALID_WEAK_NETWORK_/, label);
  }
});
