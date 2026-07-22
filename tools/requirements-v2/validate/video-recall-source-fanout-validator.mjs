import {
  VIDEO_RECALL_FLOW_ID,
  VIDEO_RECALL_SOURCE_EVENT_ID,
  videoRecallSourceBindings,
} from "../facts/video-recall-source-fanout.mjs";

const list = (value) => (Array.isArray(value) ? value : []);

function sameStrings(actual, expected) {
  return actual.length === expected.length
    && new Set(actual).size === actual.length
    && actual.every((value) => expected.includes(value));
}

function sameRecords(actual, expected, keys) {
  if (actual.length !== expected.length) return false;
  return expected.every((expectedRecord) => actual.some((actualRecord) => (
    keys.every((key) => actualRecord?.[key] === expectedRecord?.[key])
  )));
}

function indexModel(model) {
  const moduleById = new Map();
  const objectById = new Map();
  const actionById = new Map();
  const fieldById = new Map();
  for (const module of list(model?.modules)) {
    moduleById.set(module?.id, module);
    for (const object of list(module?.objects)) {
      objectById.set(object?.id, { moduleId: module?.id, object });
      for (const field of list(object?.fields)) {
        fieldById.set(field?.id, { moduleId: module?.id, objectId: object?.id, field });
      }
    }
    for (const action of list(module?.actions)) {
      actionById.set(action?.id, { moduleId: module?.id, action });
    }
  }
  return {
    moduleById,
    objectById,
    actionById,
    fieldById,
    eventById: new Map(list(model?.events).map((event) => [event?.id, event])),
    flowById: new Map(list(model?.flows).map((flow) => [flow?.id, flow])),
    optionSetById: new Map(list(model?.optionSets).map((optionSet) => [optionSet?.id, optionSet])),
  };
}

function sourceRefPresent(flow, binding, fieldId, semanticRole) {
  return list(flow?.sourceDataRefs).some((dataRef) => (
    dataRef?.objectId === binding.sourceObjectId
    && dataRef?.fieldId === fieldId
    && dataRef?.version === binding.sourceVersionFieldId
    && dataRef?.cardinality === "ZERO_MANY"
    && dataRef?.semanticRole === semanticRole
  ));
}

export function validateVideoRecallSourceFanout(model) {
  if (model?.profile !== "ZHIXU_V2") return [];
  const modules = list(model?.modules);
  if (!modules.some(({ id }) => id === "VIDEO-001")
    || !modules.some(({ id }) => id === "ACC-001")) return [];
  const errors = [];
  const index = indexModel(model);
  const event = index.eventById.get(VIDEO_RECALL_SOURCE_EVENT_ID);
  const flow = index.flowById.get(VIDEO_RECALL_FLOW_ID);
  const expectedProducerIds = videoRecallSourceBindings.map(({ actionId }) => actionId);
  const expectedTriggerKinds = videoRecallSourceBindings.map(({ triggerKind }) => triggerKind);

  const recallOptionSet = index.optionSetById.get("OPT-P2-VIDEO-RECALL-TRIGGER");
  if (!sameStrings(list(recallOptionSet?.values).map(({ code }) => code), expectedTriggerKinds)) {
    errors.push("INVALID_D084_VIDEO_RECALL_SOURCE trigger kinds must exactly cover every finalized D084 source change");
  }

  if (
    !event
    || !sameStrings(list(event.producerActionIds), expectedProducerIds)
    || !sameStrings(list(event.triggeredActionIds), ["VIDEO-ACT-LOCATE-RECALL-IMPACT"])
    || event?.versionContract?.exactlyOneSourceBindingPerEvent !== true
    || !sameRecords(list(event?.sourceBindings), videoRecallSourceBindings, [
      "actionId",
      "moduleId",
      "triggerKind",
      "sourceObjectId",
      "sourceIdentityFieldId",
      "sourceVersionFieldId",
      "applicability",
    ])
  ) {
    errors.push("INVALID_D084_VIDEO_RECALL_EVENT unified event must bind five real source actions to one versioned idempotent consumer");
  }

  for (const binding of videoRecallSourceBindings) {
    const entry = index.actionById.get(binding.actionId);
    const action = entry?.action;
    const contract = action?.videoRecallSourceEventBinding;
    const coveredFields = new Set([...list(action?.inputFieldIds), ...list(action?.outputFieldIds)]);
    if (
      entry?.moduleId !== binding.moduleId
      || action?.targetObjectId !== binding.sourceObjectId
      || !list(action?.producedEventIds).includes(VIDEO_RECALL_SOURCE_EVENT_ID)
      || !coveredFields.has(binding.sourceIdentityFieldId)
      || !list(action?.outputFieldIds).includes(binding.sourceVersionFieldId)
      || contract?.eventId !== VIDEO_RECALL_SOURCE_EVENT_ID
      || contract?.triggerKind !== binding.triggerKind
      || contract?.sourceModuleId !== binding.moduleId
      || contract?.sourceObjectId !== binding.sourceObjectId
      || contract?.sourceIdentityFieldId !== binding.sourceIdentityFieldId
      || contract?.sourceVersionFieldId !== binding.sourceVersionFieldId
      || contract?.applicability !== binding.applicability
      || contract?.outboxCommit !== "ATOMIC_WITH_SOURCE_MUTATION"
      || contract?.delivery !== "AT_LEAST_ONCE_WITH_IDEMPOTENT_CONSUMPTION"
      || contract?.playbackProtectionDuringDeliveryDelay !== "REAUTHORIZE_CURRENT_SOURCE_AND_FAIL_CLOSED"
      || !list(action?.failureResults).includes("VIDEO_RECALL_EVENT_OUTBOX_FAILED")
    ) {
      errors.push(`INVALID_D084_VIDEO_RECALL_PRODUCER action=${binding.actionId} lacks its exact source-version event binding`);
    }
  }

  const membership = index.objectById.get("ACC-OBJ-MEMBERSHIP")?.object;
  const membershipVersion = index.fieldById.get("ACC-MEMBER-F-VERSION");
  if (
    membershipVersion?.objectId !== membership?.id
    || membershipVersion?.field?.idempotencyRole !== "OBJECT_VERSION"
    || membershipVersion?.field?.mutability !== "SYSTEM_MANAGED"
    || ![
      "ACC-ACT-FIRST-ACTIVATION",
      "ACC-ACT-SUSPEND-MEMBERSHIP",
      "ACC-ACT-DEACTIVATE-MEMBERSHIP",
    ].every((actionId) => (
      list(index.actionById.get(actionId)?.action?.outputFieldIds).includes("ACC-MEMBER-F-VERSION")
    ))
  ) {
    errors.push("INVALID_D084_MEMBERSHIP_VERSION relationship termination requires a monotonic membership object version written by every state transition");
  }

  const impact = index.objectById.get("VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT")?.object;
  const locate = index.actionById.get("VIDEO-ACT-LOCATE-RECALL-IMPACT")?.action;
  const impactContract = impact?.recallSourceBindingContract;
  const locatorContract = locate?.recallImpactResolutionContract;
  if (
    locate?.executionMode !== "SYSTEM_EVENT"
    || locate?.trigger?.kind !== "EVENT"
    || locate?.trigger?.eventId !== VIDEO_RECALL_SOURCE_EVENT_ID
    || locate?.targetObjectId !== impact?.id
    || !sameStrings(list(locate?.inputFieldIds), [
      "VIDEO-RECALL-F-TRIGGER-KIND",
      "VIDEO-RECALL-F-SOURCE-EVENT-ID",
      "VIDEO-RECALL-F-SOURCE-EVENT-VERSION",
      "VIDEO-RECALL-F-SOURCE-MODULE-ID",
      "VIDEO-RECALL-F-SOURCE-OBJECT-ID",
      "VIDEO-RECALL-F-SOURCE-OBJECT-REF",
      "VIDEO-RECALL-F-SOURCE-OBJECT-VERSION",
      "VIDEO-RECALL-F-AFFECTED-ASSET-REFS",
      "VIDEO-RECALL-F-AFFECTED-ASSET-DIGEST",
    ])
    || ![
      "VIDEO-RECALL-F-ID",
      "VIDEO-RECALL-F-SOURCE-EVENT-ID",
      "VIDEO-RECALL-F-SOURCE-EVENT-VERSION",
      "VIDEO-RECALL-F-SOURCE-OBJECT-REF",
      "VIDEO-RECALL-F-SOURCE-OBJECT-VERSION",
      "VIDEO-RECALL-F-AFFECTED-ASSET-REFS",
      "VIDEO-RECALL-F-VERSION",
    ].every((fieldId) => list(locate?.outputFieldIds).includes(fieldId))
    || impactContract?.eventId !== VIDEO_RECALL_SOURCE_EVENT_ID
    || impactContract?.exactlyOneSourceBindingRequired !== true
    || locatorContract?.sourceEventId !== VIDEO_RECALL_SOURCE_EVENT_ID
    || locatorContract?.exactlyOneSourceBindingRequired !== true
    || locatorContract?.affectedAssetSetMode !== "EXACT_IMMUTABLE_VERSION_PINNED_SET"
    || locatorContract?.zeroAffectedAssetBehavior !== "RETURN_CAPTURED_EMPTY_SET"
  ) {
    errors.push("INVALID_D084_VIDEO_RECALL_LOCATOR the unified event must create one immutable version-pinned affected-asset snapshot before recall");
  }

  const recall = index.actionById.get("VIDEO-ACT-RECALL")?.action;
  const recallContract = recall?.recallExecutionContract;
  const recallGuard = list(recall?.relatedStateGuards).find(({ refFieldId }) => (
    refFieldId === "VIDEO-ASSET-F-RECALL-IMPACT-REF"
  ));
  if (
    recallContract?.impactObjectId !== "VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT"
    || recallContract?.impactVersionFieldId !== "VIDEO-ASSET-F-RECALL-IMPACT-VERSION"
    || recallContract?.sourceEventVersionFieldId !== "VIDEO-ASSET-F-RECALL-SOURCE-EVENT-VERSION"
    || recallContract?.exactlyCapturedAssetOnly !== true
    || recallContract?.alreadyRecalledBehavior !== "RETURN_EXISTING_RECALL_VERSION_WITHOUT_DUPLICATE_RELEASE"
    || recallContract?.externalCopyRecallClaimAllowed !== false
    || !sameStrings(list(recallContract?.idempotencyKeyParts), [
      "VIDEO-ASSET-F-ID",
      "VIDEO-ASSET-F-RECALL-IMPACT-REF",
      "VIDEO-ASSET-F-RECALL-IMPACT-VERSION",
      "VIDEO-ASSET-F-RECALL-SOURCE-EVENT-ID",
      "VIDEO-ASSET-F-RECALL-SOURCE-EVENT-VERSION",
    ])
    || recallGuard?.versionFieldId !== "VIDEO-ASSET-F-RECALL-IMPACT-VERSION"
    || recallGuard?.targetObjectId !== "VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT"
    || recallGuard?.requiredState !== "CAPTURED"
    || ![
      "VIDEO-ASSET-F-RECALL-IMPACT-REF",
      "VIDEO-ASSET-F-RECALL-IMPACT-VERSION",
      "VIDEO-ASSET-F-RECALL-SOURCE-EVENT-ID",
      "VIDEO-ASSET-F-RECALL-SOURCE-EVENT-VERSION",
    ].every((fieldId) => (
      list(recall?.inputFieldIds).includes(fieldId)
      && list(recall?.outputFieldIds).includes(fieldId)
    ))
  ) {
    errors.push("INVALID_D084_VIDEO_RECALL_EXECUTION recall must consume the captured impact and exact source-event version idempotently");
  }

  for (const actionId of [
    "VIDEO-ACT-DELIVER-USABLE",
    "VIDEO-ACT-VIEW-CONTROLLED",
    "VIDEO-ACT-VIEW-SCHOOL-PRIVATE",
  ]) {
    const action = index.actionById.get(actionId)?.action;
    const guard = action?.recallConsumptionGuard;
    if (
      guard?.statusFieldId !== "VIDEO-ASSET-F-DELIVERY-STATUS"
      || guard?.forbiddenStatus !== "RECALLED"
      || guard?.checkedAtExecution !== true
      || guard?.staleOrMissingStatusBehavior !== "FAIL_CLOSED"
      || guard?.failureResult !== "VIDEO_RECALLED"
      || !list(action?.failureResults).includes("VIDEO_RECALLED")
    ) {
      errors.push(`INVALID_D084_VIDEO_RECALL_CONSUMER action=${actionId} may deliver or play a recalled asset`);
    }
  }

  const expectedParticipantRoles = [
    { moduleId: "ACC-001", role: "IDENTITY_AND_RELATION_SOURCE" },
    { moduleId: "DGV-001", role: "TRANSFER_SOURCE" },
    { moduleId: "CONTENT-001", role: "MATERIAL_INVALIDATION_SOURCE" },
    { moduleId: "VIDEO-001", role: "VIDEO_RECALL_PIPELINE" },
  ];
  const expectedSteps = [
    ["VIDEO-ACT-LOCATE-RECALL-IMPACT", "LOCATE_RECALL_IMPACT"],
    ["VIDEO-ACT-BLOCK-DELIVERY", "BLOCK_FAILED_DELIVERY"],
    ["VIDEO-ACT-RECALL", "APPLY_CAPTURED_RECALL"],
    ["VIDEO-ACT-RELEASE-QUOTA", "RELEASE_PERSONAL_QUOTA"],
    ["VIDEO-ACT-RELEASE-SCHOOL-GROUP-QUOTA", "RELEASE_SCHOOL_QUOTA"],
  ];
  const sourceRefsValid = videoRecallSourceBindings.every((binding) => (
    sourceRefPresent(flow, binding, binding.sourceIdentityFieldId, "SOURCE_IDENTITY")
    && sourceRefPresent(flow, binding, binding.sourceVersionFieldId, "SOURCE_VERSION")
  ));
  if (
    flow?.contractProfile !== "EVENT_INVALIDATION_FANOUT"
    || flow?.routingPolicy !== "ACTION_CHOICE_REQUIRED"
    || !sameStrings(list(flow?.moduleIds), ["ACC-001", "DGV-001", "CONTENT-001", "VIDEO-001"])
    || !sameStrings(list(flow?.sourceOnlyModuleIds), ["ACC-001", "DGV-001", "CONTENT-001"])
    || !sameRecords(list(flow?.participantRoles), expectedParticipantRoles, ["moduleId", "role"])
    || !expectedSteps.every(([actionId, semanticRole], indexValue) => (
      flow?.steps?.[indexValue]?.order === indexValue + 1
      && flow.steps[indexValue].actionId === actionId
      && flow.steps[indexValue].semanticRole === semanticRole
    ))
    || !sameStrings(list(flow?.executionPaths).map(({ semanticRole }) => semanticRole), [
      "GATE_BLOCK_RELEASE",
      "SOURCE_INVALIDATION_RECALL_RELEASE",
    ])
    || !sourceRefsValid
    || flow?.eventInvalidationContract?.eventId !== VIDEO_RECALL_SOURCE_EVENT_ID
    || flow?.eventInvalidationContract?.exactlyOneSourceBindingPerInvocation !== true
    || flow?.eventInvalidationContract?.locatorActionId !== "VIDEO-ACT-LOCATE-RECALL-IMPACT"
    || flow?.eventInvalidationContract?.recallActionId !== "VIDEO-ACT-RECALL"
    || flow?.eventInvalidationContract?.emptyFanoutBehavior !== "ACKNOWLEDGE_WITH_CAPTURED_EMPTY_SNAPSHOT"
  ) {
    errors.push("INVALID_D084_VIDEO_RECALL_FLOW DF-P2-003 must model real source-only participants, one-of source bindings, impact location, recall, and fail-closed fanout");
  }

  return errors.sort();
}
