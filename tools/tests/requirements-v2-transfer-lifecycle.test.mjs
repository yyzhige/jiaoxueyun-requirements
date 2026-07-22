import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import {
  validateTransferLifecycleContract,
} from "../requirements-v2/validate/transfer-lifecycle-validator.mjs";

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

function pageById(model, pageId) {
  return model.modules.flatMap(({ pages }) => pages)
    .find(({ id }) => id === pageId);
}

function eventById(model, eventId) {
  return model.events.find(({ id }) => id === eventId);
}

function flowById(model, flowId) {
  return model.flows.find(({ id }) => id === flowId);
}

function fieldById(model, objectId, fieldId) {
  return objectById(model, objectId).fields.find(({ id }) => id === fieldId);
}

function errorsAfter(mutator) {
  const model = structuredClone(requirementModel);
  mutator(model);
  return validateTransferLifecycleContract(model).join("\n");
}

test("D052-D053 use ACC as the only membership authority and execute one forward-only version-pinned transfer cutover", () => {
  assert.deepEqual(validateTransferLifecycleContract(requirementModel), []);

  const membership = objectById(requirementModel, "ACC-OBJ-MEMBERSHIP");
  const authorization = objectById(
    requirementModel,
    "IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION",
  );
  const flow = flowById(requirementModel, "DF-017");
  const permission = actionById(requirementModel, "IAM-ACT-EVALUATE-PERMISSION");

  assert.equal(
    requirementModel.modules.flatMap(({ objects }) => objects)
      .some(({ id }) => id === "ORG-OBJ-STUDENT-SCHOOL-MEMBERSHIP"),
    false,
  );
  assert.deepEqual(membership.stateReachability.initialStateIds, []);
  assert.deepEqual(authorization.stateReachability.initialStateIds, []);
  assert.equal(
    actionById(requirementModel, "ACC-ACT-CREATE-INVITED-MEMBERSHIP-FROM-DIRECTORY")
      .authoritativeMembershipProvisioningContract.createdState,
    "INVITED",
  );
  assert.deepEqual(
    eventById(requirementModel, "EVT-MEMBERSHIP-DIRECTORY-SNAPSHOT-AVAILABLE")
      .triggeredActionIds,
    ["ACC-ACT-CREATE-INVITED-MEMBERSHIP-FROM-DIRECTORY"],
  );
  assert.deepEqual(flow.steps.map(({ actionId }) => actionId), [
    "DGV-ACT-EXECUTE-STUDENT-TRANSFER",
    "ACC-ACT-TERMINATE-OLD-SCHOOL-MEMBERSHIP",
    "ORG-ACT-TRANSFER-STUDENT",
    "IAM-ACT-TERMINATE-OLD-SCHOOL-STUDENT-DATA-AUTHORIZATION",
    "IAM-ACT-REVOKE-OLD-SCHOOL-GUARDIAN-DELEGATIONS",
    "ACC-ACT-CREATE-PENDING-NEW-SCHOOL-MEMBERSHIP",
    "IAM-ACT-CREATE-PENDING-NEW-SCHOOL-STUDENT-DATA-AUTHORIZATION",
    "ACC-ACT-ACTIVATE-NEW-SCHOOL-MEMBERSHIP",
    "IAM-ACT-ACTIVATE-NEW-SCHOOL-STUDENT-DATA-AUTHORIZATION",
    "DGV-ACT-COMPLETE-STUDENT-TRANSFER",
    "DGV-ACT-CREATE-OLD-SCHOOL-HISTORY-RESTRICTION",
    "IAM-ACT-INVALIDATE-TRANSFERRED-STUDENT-PERMISSIONS",
  ]);
  assert.equal(
    flow.compensation.strategy,
    "FORWARD_ONLY_RECONCILIATION_NO_OLD_ACCESS_RESTORE",
  );
  assert.equal(flow.idempotencyKeyParts.fanoutFieldId, "IAM-SDAUTH-F-ID");
  assert.equal(authorization.transferSubsetContract.fullDatabaseCopyAllowed, false);
  assert.equal(
    permission.studentTransferJointActivationGuard.sameEffectiveAtRequired,
    true,
  );
  assert.deepEqual(
    permission.studentTransferJointActivationGuard.effectiveAtFieldIds,
    ["ACC-MEMBER-F-EFFECTIVE-AT", "IAM-SSDA-F-EFFECTIVE-AT"],
  );
  assert.equal(
    pageById(requirementModel, "ORG-PAGE-MEMBERS").actionIds
      .includes("ORG-ACT-TRANSFER-STUDENT"),
    false,
  );
  const d052 = requirementModel.decisionTraceability
    .find(({ decisionId }) => decisionId === "D052");
  const d053 = requirementModel.decisionTraceability
    .find(({ decisionId }) => decisionId === "D053");
  assert.ok(d052.actionIds.includes("DGV-ACT-REQUEST-STUDENT-TRANSFER"));
  assert.ok(d052.actionIds.includes("DGV-ACT-AUTHORIZE-STUDENT-TRANSFER"));
  assert.equal(d052.actionIds.includes("DGV-ACT-DEIDENTIFY-OLD-SCHOOL-HISTORY"), false);
  assert.ok(d053.actionIds.includes("DGV-ACT-DEIDENTIFY-OLD-SCHOOL-HISTORY"));
  assert.equal(d053.actionIds.includes("ACC-ACT-CREATE-PENDING-NEW-SCHOOL-MEMBERSHIP"), false);
  assert.equal(d053.actionIds.includes("ACC-ACT-ACTIVATE-NEW-SCHOOL-MEMBERSHIP"), false);
  assert.ok(d053.stateRefs.includes("DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY.DEIDENTIFIED"));
});

test("D052-D053 destructive mutations fail the dedicated transfer lifecycle gate", () => {
  const mutations = [
    ["legacy page bypass restored", (model) => {
      pageById(model, "ORG-PAGE-MEMBERS").actionIds.push("ORG-ACT-TRANSFER-STUDENT");
    }],
    ["old membership termination removed", (model) => {
      flowById(model, "DF-017").steps = flowById(model, "DF-017").steps
        .filter(({ actionId }) => actionId !== "ACC-ACT-TERMINATE-OLD-SCHOOL-MEMBERSHIP");
    }],
    ["old school authorization termination removed", (model) => {
      flowById(model, "DF-017").steps = flowById(model, "DF-017").steps
        .filter(({ actionId }) => (
          actionId !== "IAM-ACT-TERMINATE-OLD-SCHOOL-STUDENT-DATA-AUTHORIZATION"
        ));
    }],
    ["transfer rebound to a non-authoritative membership", (model) => {
      fieldById(
        model,
        "DGV-OBJ-TRANSFER-AUTHORIZATION",
        "DGV-TRANSFER-F-OLD-MEMBERSHIP-REF",
      ).valueSource.targetObjectId = "ORG-OBJ-STUDENT";
    }],
    ["student authorization rebound to a school profile", (model) => {
      fieldById(
        model,
        "IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION",
        "IAM-SSDA-F-STUDENT-PROFILE-REF",
      ).valueSource.targetObjectId = "ACC-OBJ-SCHOOL-PROFILE";
    }],
    ["membership alone grants student data access", (model) => {
      objectById(model, "ACC-OBJ-MEMBERSHIP")
        .jointTransferActivationContract.membershipAloneGrantsStudentDataAccess = true;
    }],
    ["joint effective time equality removed", (model) => {
      actionById(model, "IAM-ACT-EVALUATE-PERMISSION")
        .studentTransferJointActivationGuard.sameEffectiveAtRequired = false;
    }],
    ["new school authorization widened to the full database", (model) => {
      objectById(model, "IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION")
        .transferSubsetContract.fullDatabaseCopyAllowed = true;
    }],
    ["compensation restores old school access", (model) => {
      flowById(model, "DF-017").compensation.strategy = "RESTORE_OLD_SCHOOL_ACCESS";
    }],
    ["completion event loses a consumer", (model) => {
      eventById(model, "EVT-TRANSFER-AUTHORIZATION-EXECUTED").triggeredActionIds = [
        "DGV-ACT-CREATE-OLD-SCHOOL-HISTORY-RESTRICTION",
      ];
    }],
    ["history loses the terminated membership version", (model) => {
      objectById(model, "DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY").lineageBindings = [];
    }],
    ["transfer trace loses the real flow", (model) => {
      model.decisionTraceability.find(({ decisionId }) => decisionId === "D052").flowIds = [];
    }],
    ["D052 regains the D053 history-only action union", (model) => {
      model.decisionTraceability.find(({ decisionId }) => decisionId === "D052")
        .actionIds.push("DGV-ACT-DEIDENTIFY-OLD-SCHOOL-HISTORY");
    }],
    ["D053 regains the D052 new-school membership action union", (model) => {
      model.decisionTraceability.find(({ decisionId }) => decisionId === "D053")
        .actionIds.push("ACC-ACT-CREATE-PENDING-NEW-SCHOOL-MEMBERSHIP");
    }],
    ["INVITED entry source event is disconnected", (model) => {
      eventById(model, "EVT-MEMBERSHIP-DIRECTORY-SNAPSHOT-AVAILABLE")
        .triggeredActionIds = [];
    }],
    ["flow idempotency uses a mutable pinned field", (model) => {
      flowById(model, "DF-017").idempotencyKeyParts.versionFieldIds = [
        "DGV-TRANSFER-F-VERSION",
        "DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION",
      ];
    }],
    ["first-step dispute source is removed", (model) => {
      flowById(model, "DF-017").sourceDataRefs = flowById(model, "DF-017").sourceDataRefs
        .filter(({ fieldId }) => fieldId !== "DGV-TRANSFER-F-DISPUTE-STATUS");
    }],
    ["personal guardian relationship is terminated", (model) => {
      actionById(model, "IAM-ACT-REVOKE-OLD-SCHOOL-GUARDIAN-DELEGATIONS")
        .guardianRelationContinuityContract.personalGuardianRelationEffect = "TERMINATED";
    }],
  ];

  for (const [label, mutate] of mutations) {
    assert.match(
      errorsAfter(mutate),
      /INVALID_TRANSFER_LIFECYCLE_CONTRACT/,
      label,
    );
  }
});
