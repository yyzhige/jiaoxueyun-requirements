import {
  ANSWER_OPEN_POLICY_FIELD_IDS,
  ANSWER_OPEN_POLICY_ID,
  ANSWER_OPEN_TIME_FIELD_IDS,
  RESTRICTED_RESULT_CONTENT_FIELD_IDS,
  SAFE_RESULT_DISCOVERY_FIELD_IDS,
  answerOpenSurfaceExecutionRegistry,
} from "../facts/answer-open-delivery.mjs";

const list = (value) => (Array.isArray(value) ? value : []);

function sameSet(left, right) {
  return left.length === right.length
    && new Set(left).size === left.length
    && left.every((value) => right.includes(value));
}

function indexModel(model) {
  const moduleById = new Map();
  const actionById = new Map();
  const fieldById = new Map();
  const scenarios = [];
  for (const module of list(model?.modules)) {
    moduleById.set(module?.id, module);
    for (const action of list(module?.actions)) {
      actionById.set(action?.id, { moduleId: module?.id, action });
    }
    for (const object of list(module?.objects)) {
      for (const field of list(object?.fields)) fieldById.set(field?.id, { objectId: object?.id, field });
    }
    scenarios.push(...list(module?.scenarios));
  }
  return { moduleById, actionById, fieldById, scenarios };
}

function bindingBySurface(contract) {
  return new Map(list(contract?.enforcementBindings).map((binding) => [
    binding?.surface,
    binding,
  ]));
}

export function validateAnswerOpenDeliveryContracts(model) {
  if (model?.profile !== "ZHIXU_V2") return [];
  const modules = list(model?.modules);
  const publicationModule = modules.find(({ id }) => id === "PUB-001");
  const resultObject = publicationModule?.objects?.find(({ id }) => id === "PUB-OBJ-RESULT");
  if (!publicationModule || !resultObject || !publicationModule.answerOpenContract) return [];
  const errors = [];
  const index = indexModel(model);
  const publication = index.moduleById.get("PUB-001");
  const contract = publication?.answerOpenContract;
  const expectedSurfaces = answerOpenSurfaceExecutionRegistry.map(({ surface }) => surface);
  const bindings = bindingBySurface(contract);
  const registeredActionIds = new Set();

  if (
    contract?.policyId !== ANSWER_OPEN_POLICY_ID
    || !sameSet(list(contract?.surfaces), expectedSurfaces)
    || list(contract?.enforcementBindings).length !== expectedSurfaces.length
    || contract?.crossModuleBypassBehavior !== "FAIL_CLOSED"
    || contract?.actionMappingMustBeRealAndUnique !== true
  ) {
    errors.push("INVALID_ANSWER_OPEN_DELIVERY_CONTRACT registry must cover every D077 surface with fail-closed real-action mapping");
  }
  if (!sameSet(list(contract?.resultReadActionIds), [
    "PUB-ACT-VIEW-RESULT",
    "PUB-ACT-SEARCH-PUBLISHED-RESULTS",
    "PUB-ACT-OPEN-CACHED-RESULT",
    "PUB-ACT-OPEN-DIRECT-RESULT-LINK",
  ])) {
    errors.push("INVALID_ANSWER_OPEN_DELIVERY_CONTRACT result-read gateways must be explicit and complete");
  }

  for (const expected of answerOpenSurfaceExecutionRegistry) {
    const binding = bindings.get(expected.surface);
    const expectedActionIds = expected.stages.map(({ actionId }) => actionId);
    const expectedStages = expected.stages.map(({ stage }) => stage);
    const expectedBeforeOpenBehavior = expected.surface === "NOTIFICATION"
      ? "STRIP_RESTRICTED_CONTENT_AND_DELIVER_SAFE_SUMMARY"
      : "WITHHOLD_RESTRICTED_CONTENT";
    if (
      binding?.enforcementKind !== "ACTION"
      || binding?.moduleId !== expected.moduleId
      || !sameSet(list(binding?.actionIds), expectedActionIds)
      || JSON.stringify(binding?.executionStages) !== JSON.stringify(expectedStages)
      || binding?.policyId !== ANSWER_OPEN_POLICY_ID
      || !sameSet(list(binding?.policyFieldIds), ANSWER_OPEN_POLICY_FIELD_IDS)
      || !sameSet(list(binding?.openTimeFieldIds), ANSWER_OPEN_TIME_FIELD_IDS)
      || binding?.reauthorizeAtAccess !== true
      || binding?.beforeOpenBehavior !== expectedBeforeOpenBehavior
      || Object.hasOwn(binding ?? {}, "policyPointId")
    ) {
      errors.push(`INVALID_ANSWER_OPEN_DELIVERY_CONTRACT surface=${expected.surface} mapping is incomplete or rebound`);
      continue;
    }

    for (const { actionId, stage } of expected.stages) {
      if (registeredActionIds.has(actionId)) {
        errors.push(`INVALID_ANSWER_OPEN_DELIVERY_CONTRACT action=${actionId} impersonates more than one delivery surface`);
      }
      registeredActionIds.add(actionId);
      const entry = index.actionById.get(actionId);
      const action = entry?.action;
      const enforcement = action?.answerOpenEnforcement;
      const consumption = action?.restrictedResultConsumption;
      if (
        entry?.moduleId !== expected.moduleId
        || enforcement?.policyId !== ANSWER_OPEN_POLICY_ID
        || !sameSet(list(enforcement?.policyFieldIds), ANSWER_OPEN_POLICY_FIELD_IDS)
        || !sameSet(list(enforcement?.openTimeFieldIds), ANSWER_OPEN_TIME_FIELD_IDS)
        || !sameSet(list(enforcement?.surfaces), [expected.surface])
        || enforcement?.executionStage !== stage
        || enforcement?.reauthorizeAtAccess !== true
        || enforcement?.reauthorizeAtExecution !== true
        || enforcement?.currentTimeReevaluated !== true
        || enforcement?.sourceVersionRechecked !== true
        || enforcement?.beforeOpenBehavior !== expectedBeforeOpenBehavior
        || !sameSet(list(enforcement?.restrictedContentFieldIds), RESTRICTED_RESULT_CONTENT_FIELD_IDS)
        || consumption?.sourceObjectId !== "PUB-OBJ-RESULT"
        || consumption?.sourceIdentityFieldId !== "PUB-RESULT-F-ID"
        || consumption?.sourceVersionFieldId !== "PUB-RESULT-F-RESULT-VERSION"
        || !sameSet(list(consumption?.restrictedContentFieldIds), RESTRICTED_RESULT_CONTENT_FIELD_IDS)
        || consumption?.currentAuthorizationRequired !== true
        || consumption?.currentOpenTimeRequired !== true
        || consumption?.staleMissingOrClosedBehavior !== "FAIL_CLOSED_WITHOUT_RESTRICTED_CONTENT"
      ) {
        errors.push(`INVALID_ANSWER_OPEN_DELIVERY_CONTRACT action=${actionId} does not enforce D077 at its real execution boundary`);
      }
      if (
        expected.surface === "NOTIFICATION"
        && (
          consumption?.deliveryPayloadRule !== "SAFE_SUMMARY_AND_REAUTHORIZED_DIRECT_LINK_ONLY"
          || consumption?.restrictedPayloadBeforeOpen !== "STRIP_AND_CONTINUE_SAFE_SUMMARY"
          || list(action?.failureResults).includes("ANSWER_NOT_OPEN")
          || list(action?.outputFieldIds).some((fieldId) => (
            RESTRICTED_RESULT_CONTENT_FIELD_IDS.includes(fieldId)
          ))
        )
      ) {
        errors.push(`INVALID_ANSWER_OPEN_DELIVERY_CONTRACT action=${actionId} notification must strip restricted content and continue with a safe summary`);
      }
      if (["SEARCH", "CACHE", "DIRECT_LINK"].includes(expected.surface)) {
        const gateway = index.actionById.get("PUB-ACT-VIEW-RESULT")?.action;
        if (
          binding?.delegatesRestrictedContentToActionId !== "PUB-ACT-VIEW-RESULT"
          || consumption?.delegatesRestrictedContentToActionId !== "PUB-ACT-VIEW-RESULT"
          || consumption?.delegationCarriesSourceIdentityAndVersion !== true
          || consumption?.finalGatewayReauthorizes !== true
          || !gateway?.answerOpenEnforcement
          || gateway.answerOpenEnforcement.reauthorizeAtAccess !== true
          || gateway.answerOpenEnforcement.currentTimeReevaluated !== true
          || gateway.answerOpenEnforcement.sourceVersionRechecked !== true
          || !sameSet(list(action?.outputFieldIds), SAFE_RESULT_DISCOVERY_FIELD_IDS)
        ) {
          errors.push(`INVALID_ANSWER_OPEN_DELIVERY_CONTRACT action=${actionId} must delegate restricted content to the reauthorizing PUB view gateway`);
        }
      }
      if (
        !["AI_CONVERSATION", "NOTIFICATION"].includes(expected.surface)
        && (
          !list(action?.failureResults).includes("ANSWER_NOT_OPEN")
          || !index.scenarios.some((scenario) => (
            scenario?.actionId === actionId
            && scenario?.resultCode === "ANSWER_NOT_OPEN"
            && ["BOUNDARY", "FAILURE"].includes(scenario?.kind)
            && scenario?.then?.expectedPermission === "DENY"
          ))
        )
      ) {
        errors.push(`INVALID_ANSWER_OPEN_DELIVERY_CONTRACT action=${actionId} lacks a fail-closed answer-not-open boundary`);
      }
    }
  }

  for (const { moduleId, action } of index.actionById.values()) {
    if (!action?.restrictedResultConsumption) continue;
    if (!registeredActionIds.has(action.id) || !action?.answerOpenEnforcement) {
      errors.push(`INVALID_ANSWER_OPEN_DELIVERY_CONTRACT module=${moduleId} action=${action.id} consumes restricted result content outside the surface registry`);
    }
  }

  for (const fieldId of [
    ...ANSWER_OPEN_POLICY_FIELD_IDS,
    ...ANSWER_OPEN_TIME_FIELD_IDS,
    ...RESTRICTED_RESULT_CONTENT_FIELD_IDS,
  ]) {
    if (index.fieldById.get(fieldId)?.objectId !== "PUB-OBJ-RESULT") {
      errors.push(`INVALID_ANSWER_OPEN_DELIVERY_CONTRACT sourceField=${fieldId} is missing or rebound away from PUB-OBJ-RESULT`);
    }
  }

  return errors.sort();
}
