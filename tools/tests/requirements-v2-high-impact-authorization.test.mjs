import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import { validateHighImpactAuthorizationContracts } from "../requirements-v2/validate/high-impact-authorization-validator.mjs";

function actionById(model, actionId) {
  return model.modules.flatMap(({ actions }) => actions)
    .find(({ id }) => id === actionId);
}

function objectById(model, objectId) {
  return model.modules.flatMap(({ objects }) => objects)
    .find(({ id }) => id === objectId);
}

function moduleById(model, moduleId) {
  return model.modules.find(({ id }) => id === moduleId);
}

function eventById(model, eventId) {
  return model.events.find(({ id }) => id === eventId);
}

function scenarioById(model, scenarioId) {
  return model.modules.flatMap(({ scenarios }) => scenarios)
    .find(({ id }) => id === scenarioId);
}

function errorsAfter(mutator) {
  const model = structuredClone(requirementModel);
  mutator(model);
  return validateHighImpactAuthorizationContracts(model).join("\n");
}

test("D037 binds identity deletion, transfer, and phase-three student-work public promotion to one versioned IAM authorization", () => {
  assert.deepEqual(validateHighImpactAuthorizationContracts(requirementModel), []);

  const identity = objectById(requirementModel, "ACC-OBJ-PLATFORM-IDENTITY");
  const transfer = objectById(requirementModel, "DGV-OBJ-TRANSFER-AUTHORIZATION");
  const scope = objectById(requirementModel, "CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE");
  const refs = [
    identity.fields.find(({ id }) => id === "ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-ID"),
    transfer.fields.find(({ id }) => id === "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID"),
    scope.fields.find(({ id }) => id === "CONTENT-SCOPE-F-HIGH-IMPACT-AUTHORIZATION-ID"),
  ];
  assert.deepEqual(
    refs.map((field) => [field.valueSource.kind, field.valueSource.targetObjectId, field.referenceIntegrity]),
    [
      ["OBJECT_REF", "IAM-OBJ-HIGH-IMPACT-AUTHORIZATION", "VERSION_PINNED"],
      ["OBJECT_REF", "IAM-OBJ-HIGH-IMPACT-AUTHORIZATION", "VERSION_PINNED"],
      ["OBJECT_REF", "IAM-OBJ-HIGH-IMPACT-AUTHORIZATION", "VERSION_PINNED"],
    ],
  );

  for (const [actionId, actionCode] of [
    ["ACC-ACT-COMPLETE-IDENTITY-DELETION", "DELETE"],
    ["DGV-ACT-EXECUTE-STUDENT-TRANSFER", "MIGRATE"],
    ["CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC", "PUBLISH_STUDENT_WORK"],
  ]) {
    const action = actionById(requirementModel, actionId);
    assert.equal(action.highImpactAuthorizationGuard.authorizationObjectId, "IAM-OBJ-HIGH-IMPACT-AUTHORIZATION");
    assert.equal(action.highImpactAuthorizationGuard.reservationSourceState, "AUTHORIZED");
    assert.equal(action.highImpactAuthorizationGuard.domainWriteRequiredState, "RESERVED");
    assert.equal(
      action.highImpactAuthorizationGuard.reservationActionId,
      "IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION",
    );
    assert.equal(action.highImpactAuthorizationGuard.requiredActionCode, actionCode);
    assert.equal(action.highImpactAuthorizationGuard.expiryComparison, "SERVER_ACTION_TIME_BEFORE_EXPIRY");
    assert.deepEqual(action.highImpactAuthorizationGuard.disputeGuard.forbiddenLinkedDisputeStates, ["OPEN", "FROZEN"]);
  }

  const publicAction = actionById(requirementModel, "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC");
  assert.deepEqual(publicAction.publicPromotionGuard.prohibitedPhaseIds, ["PHASE-1", "PHASE-2"]);
  assert.equal(Object.hasOwn(publicAction.publicPromotionGuard, "prohibitionResultCode"), false);
  assert.deepEqual(publicAction.highImpactAuthorizationGuard.applicability, {
    kind: "PINNED_SOURCE_GRAPH_FIELD_CODE_AND_PHASE",
    sourceGraphObjectId: "CONTENT-OBJ-MATERIAL-SOURCE-GRAPH",
    sourceGraphRefFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
    sourceGraphVersionFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION",
    sourceGraphSourceKindFieldId: "CONTENT-SOURCE-F-SOURCE-KIND",
    managementScopeMirrorFieldId: "CONTENT-SCOPE-F-SOURCE-KIND",
    comparison: "EXACT_CODE",
    exactVersionRequired: true,
    materialIdentityFallbackAllowed: false,
    requiredCode: "STUDENT_WORK",
    requiredPhaseIds: ["PHASE-3"],
    prohibitedPhaseIds: ["PHASE-1", "PHASE-2"],
    prohibitionResultCode: "STUDENT_WORK_PUBLIC_PROHIBITED",
  });

  const executeAuthorization = actionById(
    requirementModel,
    "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION",
  );
  const reserveAuthorization = actionById(
    requirementModel,
    "IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION",
  );
  const authorization = objectById(
    requirementModel,
    "IAM-OBJ-HIGH-IMPACT-AUTHORIZATION",
  );
  assert.ok(authorization.states.includes("RESERVED"));
  assert.equal(reserveAuthorization.executionMode, "SYSTEM_EVENT");
  assert.deepEqual(reserveAuthorization.transition, {
    from: ["AUTHORIZED", "RESERVED"],
    to: "RESERVED",
  });
  assert.deepEqual(
    reserveAuthorization.highImpactAuthorizationReservationContract.compareAndSet,
    {
      objectId: "IAM-OBJ-HIGH-IMPACT-AUTHORIZATION",
      versionFieldId: "IAM-HIAUTH-F-VERSION",
      statusFieldId: "IAM-HIAUTH-F-STATUS",
      firstReservationExpectedState: "AUTHORIZED",
      firstReservationNextState: "RESERVED",
      atomicWithReservationFields: true,
      exactDuplicateRequiredFields: [
        "IAM-HIAUTH-F-CONSUMPTION-KEY",
        "IAM-HIAUTH-F-CONSUMED-ACTION-ID",
        "IAM-HIAUTH-F-CONSUMED-TARGET-REF",
        "IAM-HIAUTH-F-CONSUMED-TARGET-VERSION",
      ],
      exactDuplicateEffect: "RETURN_EXISTING_RESERVATION",
      conflictingTargetEffect: "FAIL_CLOSED",
    },
  );
  assert.equal(executeAuthorization.executionMode, "SYSTEM_EVENT");
  assert.deepEqual(executeAuthorization.transition, { from: "RESERVED", to: "EXECUTED" });
  assert.equal(requirementModel.modules.flatMap(({ pages }) => pages).some(({ actionIds }) => (
    actionIds.includes(executeAuthorization.id)
  )), false);
  assert.equal(requirementModel.modules.flatMap(({ pages }) => pages).some(({ actionIds }) => (
    actionIds.includes(reserveAuthorization.id)
  )), false);

  const successEvent = eventById(
    requirementModel,
    "EVT-HIGH-IMPACT-DOMAIN-ACTION-SUCCEEDED",
  );
  assert.deepEqual(
    successEvent.highImpactAuthorizationConsumptionEventContract.contextKeys
      .map(({ key, semanticRole }) => [key, semanticRole]),
    [
      ["authorizationId", "PINNED_AUTHORIZATION_ID"],
      ["authorizationVersion", "PINNED_AUTHORIZATION_VERSION"],
      ["authorizedActionCode", "AUTHORIZED_ACTION_CODE"],
      ["targetObjectId", "TARGET_OBJECT_KIND"],
      ["targetObjectRef", "TARGET_OBJECT_ID"],
      ["targetObjectVersion", "TARGET_OBJECT_VERSION"],
      ["reservationId", "AUTHORIZATION_RESERVATION_ID"],
      ["reservationVersion", "AUTHORIZATION_RESERVATION_VERSION"],
      ["domainEventId", "DOMAIN_EVENT_IDEMPOTENCY_ID"],
      ["domainEventVersion", "DOMAIN_EVENT_IDEMPOTENCY_VERSION"],
      ["consumptionKey", "AUTHORIZATION_RESERVATION_KEY"],
    ],
  );

  const transferReference = transfer.fields.find(({ id }) => (
    id === "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID"
  ));
  assert.ok(transferReference.actionApplicability.requiredActionIds.includes(
    "DGV-ACT-COMPLETE-STUDENT-TRANSFER",
  ));
  const completeTransfer = actionById(requirementModel, "DGV-ACT-COMPLETE-STUDENT-TRANSFER");
  assert.equal(completeTransfer.relatedStateGuards.filter((guard) => (
    guard.refFieldId === "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID"
      && guard.versionFieldId === "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION"
      && guard.targetObjectId === "IAM-OBJ-HIGH-IMPACT-AUTHORIZATION"
      && guard.requiredState === "RESERVED"
  )).length, 1);

  const deletionOutbox = scenarioById(
    requirementModel,
    "ACC-ACT-COMPLETE-IDENTITY-DELETION-SCN-HIGH_IMPACT_CONSUMPTION_EVENT_OUTBOX_FAILED",
  );
  assert.equal(deletionOutbox.pageId, "ACC-PAGE-PLATFORM-IDENTITY");
  assert.equal(Object.hasOwn(deletionOutbox, "trigger"), false);
  const transferOutbox = scenarioById(
    requirementModel,
    "DGV-ACT-COMPLETE-STUDENT-TRANSFER-SCN-HIGH_IMPACT_CONSUMPTION_EVENT_OUTBOX_FAILED",
  );
  assert.deepEqual(transferOutbox.trigger, completeTransfer.trigger);
  assert.equal(Object.hasOwn(transferOutbox, "pageId"), false);
});

test("D037 destructive mutations fail closed for identity, student, expiry, dispute, scope, action, and ordinary-ID bypass", () => {
  const mutations = [
    ["ordinary ID bypass", (model) => {
      const field = objectById(model, "DGV-OBJ-TRANSFER-AUTHORIZATION").fields
        .find(({ id }) => id === "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID");
      field.valueSource = { kind: "USER_INPUT" };
      delete field.referenceIntegrity;
      delete field.versionBinding;
    }],
    ["wrong student binding", (model) => {
      actionById(model, "DGV-ACT-EXECUTE-STUDENT-TRANSFER")
        .highImpactAuthorizationGuard.studentBinding.targetFieldId = "DGV-TRANSFER-F-TO-SCHOOL-ID";
    }],
    ["wrong action code", (model) => {
      actionById(model, "ACC-ACT-COMPLETE-IDENTITY-DELETION")
        .highImpactAuthorizationGuard.requiredActionCode = "MIGRATE";
    }],
    ["expiry check weakened", (model) => {
      actionById(model, "DGV-ACT-EXECUTE-STUDENT-TRANSFER")
        .highImpactAuthorizationGuard.expiryComparison = "CLIENT_TIME";
    }],
    ["dispute freeze weakened", (model) => {
      actionById(model, "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC")
        .highImpactAuthorizationGuard.disputeGuard.forbiddenLinkedDisputeStates = ["OPEN"];
    }],
    ["scope binding weakened", (model) => {
      actionById(model, "DGV-ACT-EXECUTE-STUDENT-TRANSFER")
        .highImpactAuthorizationGuard.schoolScopeBinding.targetFieldIds = ["DGV-TRANSFER-F-FROM-SCHOOL-ID"];
    }],
    ["authorization object copied locally", (model) => {
      actionById(model, "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC")
        .highImpactAuthorizationGuard.authorizationObjectId = "CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION";
    }],
    ["expired phase prohibition removed", (model) => {
      actionById(model, "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC")
        .publicPromotionGuard.prohibitedPhaseIds = ["PHASE-1"];
    }],
    ["pinned version input removed", (model) => {
      actionById(model, "DGV-ACT-EXECUTE-STUDENT-TRANSFER").inputFieldIds = actionById(
        model,
        "DGV-ACT-EXECUTE-STUDENT-TRANSFER",
      ).inputFieldIds.filter((fieldId) => fieldId !== "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION");
    }],
  ];

  for (const [label, mutate] of mutations) {
    assert.match(errorsAfter(mutate), /INVALID_D037_HIGH_IMPACT_AUTHORIZATION/, label);
  }
});

test("D037 uniquely consumes authorization versions only after terminal domain success and rejects routing or replay regressions", () => {
  const mutations = [
    ["system consumer exposed by a page", (model) => {
      moduleById(model, "IAM-001").pages
        .find(({ id }) => id === "IAM-PAGE-HIGH-IMPACT-AUTHORIZATION")
        .actionIds.push("IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION");
    }],
    ["user-task outbox scenario loses page binding", (model) => {
      const scenario = scenarioById(
        model,
        "ACC-ACT-COMPLETE-IDENTITY-DELETION-SCN-HIGH_IMPACT_CONSUMPTION_EVENT_OUTBOX_FAILED",
      );
      delete scenario.pageId;
      scenario.trigger = undefined;
    }],
    ["transfer terminal guard removed", (model) => {
      const action = actionById(model, "DGV-ACT-COMPLETE-STUDENT-TRANSFER");
      action.relatedStateGuards = action.relatedStateGuards.filter(({ refFieldId }) => (
        refFieldId !== "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID"
      ));
    }],
    ["terminal producer removed from shared event", (model) => {
      const event = eventById(model, "EVT-HIGH-IMPACT-DOMAIN-ACTION-SUCCEEDED");
      event.producerActionIds = event.producerActionIds.filter((actionId) => (
        actionId !== "DGV-ACT-COMPLETE-STUDENT-TRANSFER"
      ));
    }],
    ["consumer trigger changed", (model) => {
      actionById(model, "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION").trigger.eventId = "EVT-UNKNOWN";
    }],
    ["authorization version made reusable", (model) => {
      objectById(model, "IAM-OBJ-HIGH-IMPACT-AUTHORIZATION")
        .highImpactAuthorizationMatrixContract.consumptionContract.oneUseOnly = false;
    }],
    ["reservation state removed", (model) => {
      const authorization = objectById(model, "IAM-OBJ-HIGH-IMPACT-AUTHORIZATION");
      authorization.states = authorization.states.filter((state) => state !== "RESERVED");
    }],
    ["reservation CAS made non-atomic", (model) => {
      actionById(model, "IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION")
        .highImpactAuthorizationReservationContract.compareAndSet
        .atomicWithReservationFields = false;
    }],
    ["conflicting target can reuse reservation", (model) => {
      actionById(model, "IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION")
        .highImpactAuthorizationReservationContract.compareAndSet
        .conflictingTargetEffect = "RETURN_EXISTING_RESERVATION";
    }],
    ["reservation transition bypasses RESERVED", (model) => {
      actionById(model, "IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION")
        .transition = { from: "AUTHORIZED", to: "EXECUTED" };
    }],
    ["terminal consumer skips RESERVED", (model) => {
      actionById(model, "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION")
        .transition = { from: "AUTHORIZED", to: "EXECUTED" };
    }],
    ["success event context loses domain event version", (model) => {
      const contract = eventById(model, "EVT-HIGH-IMPACT-DOMAIN-ACTION-SUCCEEDED")
        .highImpactAuthorizationConsumptionEventContract;
      contract.contextKeys = contract.contextKeys.filter(({ key }) => key !== "domainEventVersion");
    }],
    ["event context keys weakened to untyped strings", (model) => {
      const contract = eventById(model, "EVT-HIGH-IMPACT-DOMAIN-ACTION-SUCCEEDED")
        .highImpactAuthorizationConsumptionEventContract;
      contract.contextKeys = contract.contextKeys.map(({ key }) => key);
    }],
    ["consumption key weakened", (model) => {
      eventById(model, "EVT-HIGH-IMPACT-DOMAIN-ACTION-SUCCEEDED")
        .highImpactAuthorizationConsumptionEventContract.consumptionKeyFormula = "authorization-id";
    }],
    ["duplicate domain write allowed", (model) => {
      actionById(model, "ACC-ACT-COMPLETE-IDENTITY-DELETION")
        .highImpactAuthorizationConsumptionProducer.duplicateDomainExecutionEffect = "WRITE_AGAIN";
    }],
    ["terminal domain event removed", (model) => {
      const action = actionById(model, "DGV-ACT-COMPLETE-STUDENT-TRANSFER");
      action.producedEventIds = action.producedEventIds.filter((eventId) => (
        eventId !== "EVT-HIGH-IMPACT-DOMAIN-ACTION-SUCCEEDED"
      ));
    }],
    ["D069 public guard shape widened", (model) => {
      actionById(model, "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC")
        .publicPromotionGuard.prohibitionResultCode = "STUDENT_WORK_PUBLIC_PROHIBITED";
    }],
    ["D069 fail-closed scenario removed", (model) => {
      const module = moduleById(model, "CONTENT-001");
      module.scenarios = module.scenarios.filter(({ id }) => (
        id !== "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC-SCN-STUDENT_WORK_PUBLIC_PROHIBITED"
      ));
    }],
    ["D069 source-kind eligibility weakened to material ID", (model) => {
      actionById(model, "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC")
        .publicPromotionGuard.sourceKindEligibilityBinding.sourceGraphRefFieldId =
        "CONTENT-SCOPE-F-MATERIAL-ID";
    }],
  ];

  for (const [label, mutate] of mutations) {
    assert.match(errorsAfter(mutate), /INVALID_D037_HIGH_IMPACT_AUTHORIZATION/, label);
  }
});
