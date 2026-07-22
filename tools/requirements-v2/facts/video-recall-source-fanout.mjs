import { deepFreeze } from "../model.mjs";

export const VIDEO_RECALL_SOURCE_EVENT_ID = "EVT-P2-VIDEO-RECALL-SOURCE-CHANGED";
export const VIDEO_RECALL_FLOW_ID = "DF-P2-003";

export const videoRecallSourceBindings = deepFreeze([
  {
    actionId: "ACC-ACT-COMPLETE-IDENTITY-DELETION",
    moduleId: "ACC-001",
    triggerKind: "IDENTITY_DELETION",
    sourceObjectId: "ACC-OBJ-PLATFORM-IDENTITY",
    sourceIdentityFieldId: "ACC-PIDENT-F-ID",
    sourceVersionFieldId: "ACC-PIDENT-F-VERSION",
    applicability: "the deleted platform identity subject kind is STUDENT",
  },
  {
    actionId: "DGV-ACT-EXECUTE-STUDENT-TRANSFER",
    moduleId: "DGV-001",
    triggerKind: "STUDENT_TRANSFER",
    sourceObjectId: "DGV-OBJ-TRANSFER-AUTHORIZATION",
    sourceIdentityFieldId: "DGV-TRANSFER-F-ID",
    sourceVersionFieldId: "DGV-TRANSFER-F-VERSION",
    applicability: "the authorized transfer commits its permitted subset and source-right limits",
  },
  {
    actionId: "ACC-ACT-DEACTIVATE-MEMBERSHIP",
    moduleId: "ACC-001",
    triggerKind: "RELATIONSHIP_TERMINATION",
    sourceObjectId: "ACC-OBJ-MEMBERSHIP",
    sourceIdentityFieldId: "ACC-MEMBER-F-ID",
    sourceVersionFieldId: "ACC-MEMBER-F-VERSION",
    applicability: "the deactivated school membership terminates a student's current access relation",
  },
  {
    actionId: "CONTENT-ACT-REVOKE-MATERIAL-RIGHTS-BUNDLE",
    moduleId: "CONTENT-001",
    triggerKind: "SOURCE_RIGHTS_WITHDRAWAL",
    sourceObjectId: "CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE",
    sourceIdentityFieldId: "CONTENT-RIGHTS-F-ID",
    sourceVersionFieldId: "CONTENT-RIGHTS-F-VERSION",
    applicability: "an ACTIVE material rights bundle becomes REVOKED",
  },
  {
    actionId: "CONTENT-ACT-INVALIDATE-MATERIAL-SOURCE-GRAPH",
    moduleId: "CONTENT-001",
    triggerKind: "CONTENT_RECALL",
    sourceObjectId: "CONTENT-OBJ-MATERIAL-SOURCE-GRAPH",
    sourceIdentityFieldId: "CONTENT-SOURCE-F-ID",
    sourceVersionFieldId: "CONTENT-SOURCE-F-VERSION",
    applicability: "an ACTIVE material source graph becomes INVALIDATED after source withdrawal or recall",
  },
]);

export const videoRecallSourceEvent = deepFreeze({
  id: VIDEO_RECALL_SOURCE_EVENT_ID,
  label: "Versioned source change requires teaching-video impact location and recall",
  definition: "A committed student identity deletion, transfer, student relationship termination, material-right withdrawal, or material-source recall may invalidate one or more source-bound teaching videos.",
  producerActionIds: videoRecallSourceBindings.map(({ actionId }) => actionId),
  triggeredActionIds: ["VIDEO-ACT-LOCATE-RECALL-IMPACT"],
  sourceBindings: videoRecallSourceBindings,
  versionContract: {
    eventIdentity: "DETERMINISTIC_FROM_PRODUCER_ACTION_AND_SOURCE_IDENTITY",
    eventVersion: "PINNED_TO_COMMITTED_SOURCE_OBJECT_VERSION",
    exactlyOneSourceBindingPerEvent: true,
    duplicateDeliveryBehavior: "RETURN_EXISTING_IMPACT_SNAPSHOT_AND_RECALL_RESULT",
    conflictingDuplicateBehavior: "FAIL_CLOSED_AND_AUDIT",
  },
});

const sourceImpactInputFieldIds = [
  "VIDEO-RECALL-F-TRIGGER-KIND",
  "VIDEO-RECALL-F-SOURCE-EVENT-ID",
  "VIDEO-RECALL-F-SOURCE-EVENT-VERSION",
  "VIDEO-RECALL-F-SOURCE-MODULE-ID",
  "VIDEO-RECALL-F-SOURCE-OBJECT-ID",
  "VIDEO-RECALL-F-SOURCE-OBJECT-REF",
  "VIDEO-RECALL-F-SOURCE-OBJECT-VERSION",
  "VIDEO-RECALL-F-AFFECTED-ASSET-REFS",
  "VIDEO-RECALL-F-AFFECTED-ASSET-DIGEST",
];

const sourceImpactOutputFieldIds = [
  "VIDEO-RECALL-F-ID",
  ...sourceImpactInputFieldIds,
  "VIDEO-RECALL-F-CAPTURED-AT",
  "VIDEO-RECALL-F-STATUS",
  "VIDEO-RECALL-F-VERSION",
];

const recallInputFieldIds = [
  "VIDEO-ASSET-F-RECALL-REASON",
  "VIDEO-ASSET-F-RECALL-IMPACT-REF",
  "VIDEO-ASSET-F-RECALL-IMPACT-VERSION",
  "VIDEO-ASSET-F-RECALL-TRIGGER-KIND",
  "VIDEO-ASSET-F-RECALL-SOURCE-EVENT-ID",
  "VIDEO-ASSET-F-RECALL-SOURCE-EVENT-VERSION",
];

function moduleById(modules, moduleId) {
  const module = modules.find(({ id }) => id === moduleId);
  if (!module) throw new Error(`video recall source fanout requires module ${moduleId}`);
  return module;
}

function actionEntry(modules, actionId) {
  for (const module of modules) {
    const action = module.actions.find(({ id }) => id === actionId);
    if (action) return { module, action };
  }
  throw new Error(`video recall source fanout requires action ${actionId}`);
}

function objectById(module, objectId) {
  const object = module.objects.find(({ id }) => id === objectId);
  if (!object) throw new Error(`video recall source fanout requires object ${objectId}`);
  return object;
}

function appendUnique(values, value) {
  if (!values.includes(value)) values.push(value);
}

function appendFailureScenario(module, action, resultCode, expectedData) {
  appendUnique(action.failureResults, resultCode);
  const scenarioId = `${action.id}-SCN-${resultCode}`;
  appendUnique(action.scenarioIds, scenarioId);
  if (module.scenarios.some(({ id }) => id === scenarioId)) return;
  const pageId = module.pages.find(({ actionIds }) => actionIds.includes(action.id))?.id;
  module.scenarios.push({
    id: scenarioId,
    kind: "BOUNDARY",
    resultCode,
    actionId: action.id,
    ...(action.executionMode === "USER_TASK"
      ? { pageId }
      : { trigger: structuredClone(action.trigger) }),
    given: "the source mutation is valid but its atomic video-recall event outbox record cannot be committed",
    when: `the authorized actor requests ${action.label}`,
    then: {
      expectedData,
      expectedState: { mode: "UNCHANGED" },
      expectedPermission: "DENY",
      expectedVisibility: "no source mutation is acknowledged without a durable recall event; already-invalid sources remain fail-closed at playback",
    },
  });
}

function decorateMembershipVersion(accessModule) {
  const membership = objectById(accessModule, "ACC-OBJ-MEMBERSHIP");
  if (!membership.fields.some(({ id }) => id === "ACC-MEMBER-F-VERSION")) {
    const template = objectById(accessModule, "ACC-OBJ-SCHOOL").fields
      .find(({ id }) => id === "ACC-SCHOOL-F-SCHOOL-VERSION");
    membership.fields.push({
      ...structuredClone(template),
      id: "ACC-MEMBER-F-VERSION",
      label: "Account Membership Version",
    });
  }
  for (const actionId of [
    "ACC-ACT-FIRST-ACTIVATION",
    "ACC-ACT-SUSPEND-MEMBERSHIP",
    "ACC-ACT-DEACTIVATE-MEMBERSHIP",
  ]) {
    appendUnique(actionEntry([accessModule], actionId).action.outputFieldIds, "ACC-MEMBER-F-VERSION");
  }
}

function decorateSourceProducer(modules, binding) {
  const { module, action } = actionEntry(modules, binding.actionId);
  appendUnique(action.producedEventIds ??= [], VIDEO_RECALL_SOURCE_EVENT_ID);
  action.videoRecallSourceEventBinding = {
    eventId: VIDEO_RECALL_SOURCE_EVENT_ID,
    triggerKind: binding.triggerKind,
    sourceModuleId: binding.moduleId,
    sourceObjectId: binding.sourceObjectId,
    sourceIdentityFieldId: binding.sourceIdentityFieldId,
    sourceVersionFieldId: binding.sourceVersionFieldId,
    applicability: binding.applicability,
    outboxCommit: "ATOMIC_WITH_SOURCE_MUTATION",
    delivery: "AT_LEAST_ONCE_WITH_IDEMPOTENT_CONSUMPTION",
    playbackProtectionDuringDeliveryDelay: "REAUTHORIZE_CURRENT_SOURCE_AND_FAIL_CLOSED",
  };
  appendFailureScenario(
    module,
    action,
    "VIDEO_RECALL_EVENT_OUTBOX_FAILED",
    `${action.label} does not commit a new source version until the same transaction durably records ${VIDEO_RECALL_SOURCE_EVENT_ID}`,
  );
}

function decorateVideoModule(videoModule) {
  const impact = objectById(videoModule, "VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT");
  impact.recallSourceBindingContract = {
    eventId: VIDEO_RECALL_SOURCE_EVENT_ID,
    exactlyOneSourceBindingRequired: true,
    sourceIdentityAndVersionRequired: true,
    affectedAssetSetImmutable: true,
    sourceBindings: structuredClone(videoRecallSourceBindings),
    zeroAffectedAssetBehavior: "RECORD_EMPTY_IMPACT_SNAPSHOT_AND_ACKNOWLEDGE_EVENT",
  };

  const locate = actionEntry([videoModule], "VIDEO-ACT-LOCATE-RECALL-IMPACT").action;
  locate.executionMode = "SYSTEM_EVENT";
  locate.trigger = { kind: "EVENT", eventId: VIDEO_RECALL_SOURCE_EVENT_ID };
  locate.inputFieldIds = [...sourceImpactInputFieldIds];
  locate.outputFieldIds = [...sourceImpactOutputFieldIds];
  locate.recallImpactResolutionContract = {
    sourceEventId: VIDEO_RECALL_SOURCE_EVENT_ID,
    sourceBindings: structuredClone(videoRecallSourceBindings),
    exactlyOneSourceBindingRequired: true,
    sourceIdentityAndVersionRequired: true,
    affectedAssetSetMode: "EXACT_IMMUTABLE_VERSION_PINNED_SET",
    locatorIdempotencyKeyParts: [
      "VIDEO-RECALL-F-SOURCE-EVENT-ID",
      "VIDEO-RECALL-F-SOURCE-EVENT-VERSION",
      "VIDEO-RECALL-F-SOURCE-OBJECT-REF",
      "VIDEO-RECALL-F-SOURCE-OBJECT-VERSION",
    ],
    zeroAffectedAssetBehavior: "RETURN_CAPTURED_EMPTY_SET",
    staleOrConflictingSourceBehavior: "FAIL_CLOSED_WITHOUT_RECALL_MUTATION",
  };
  for (const scenario of videoModule.scenarios.filter(({ actionId }) => actionId === locate.id)) {
    delete scenario.pageId;
    scenario.trigger = structuredClone(locate.trigger);
  }

  const recall = actionEntry([videoModule], "VIDEO-ACT-RECALL").action;
  recall.inputFieldIds = [...recallInputFieldIds];
  recall.recallExecutionContract = {
    impactObjectId: "VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT",
    impactRefFieldId: "VIDEO-ASSET-F-RECALL-IMPACT-REF",
    impactVersionFieldId: "VIDEO-ASSET-F-RECALL-IMPACT-VERSION",
    sourceEventIdFieldId: "VIDEO-ASSET-F-RECALL-SOURCE-EVENT-ID",
    sourceEventVersionFieldId: "VIDEO-ASSET-F-RECALL-SOURCE-EVENT-VERSION",
    triggerKindFieldId: "VIDEO-ASSET-F-RECALL-TRIGGER-KIND",
    exactlyCapturedAssetOnly: true,
    idempotencyKeyParts: [
      "VIDEO-ASSET-F-ID",
      "VIDEO-ASSET-F-RECALL-IMPACT-REF",
      "VIDEO-ASSET-F-RECALL-IMPACT-VERSION",
      "VIDEO-ASSET-F-RECALL-SOURCE-EVENT-ID",
      "VIDEO-ASSET-F-RECALL-SOURCE-EVENT-VERSION",
    ],
    alreadyRecalledBehavior: "RETURN_EXISTING_RECALL_VERSION_WITHOUT_DUPLICATE_RELEASE",
    externalCopyRecallClaimAllowed: false,
  };

  videoModule.videoRecallSourceFanoutContract = {
    eventId: VIDEO_RECALL_SOURCE_EVENT_ID,
    flowId: VIDEO_RECALL_FLOW_ID,
    sourceBindings: structuredClone(videoRecallSourceBindings),
    locatorActionId: locate.id,
    recallActionId: recall.id,
    deliveryAndPlaybackGuardActionIds: [
      "VIDEO-ACT-DELIVER-USABLE",
      "VIDEO-ACT-VIEW-CONTROLLED",
      "VIDEO-ACT-VIEW-SCHOOL-PRIVATE",
    ],
    currentSourceReauthorizationRequired: true,
    eventDeliveryDelayBehavior: "FAIL_CLOSED_AT_DELIVERY_AND_PLAYBACK",
  };
}

export function applyVideoRecallSourceContracts(inputModules) {
  const modules = structuredClone(inputModules);
  decorateMembershipVersion(moduleById(modules, "ACC-001"));
  for (const binding of videoRecallSourceBindings) decorateSourceProducer(modules, binding);
  decorateVideoModule(moduleById(modules, "VIDEO-001"));
  return modules;
}

export function applyVideoRecallSourceEvents(inputEvents) {
  return [
    ...structuredClone(inputEvents).filter(({ id }) => id !== VIDEO_RECALL_SOURCE_EVENT_ID),
    structuredClone(videoRecallSourceEvent),
  ];
}

function sourceDataRefsFor(binding) {
  return [
    {
      objectId: binding.sourceObjectId,
      fieldId: binding.sourceIdentityFieldId,
      version: binding.sourceVersionFieldId,
      cardinality: "ZERO_MANY",
      semanticRole: "SOURCE_IDENTITY",
    },
    {
      objectId: binding.sourceObjectId,
      fieldId: binding.sourceVersionFieldId,
      version: binding.sourceVersionFieldId,
      cardinality: "ZERO_MANY",
      semanticRole: "SOURCE_VERSION",
    },
  ];
}

function providedBySystem(fieldIds) {
  return fieldIds.map((fieldId) => ({ fieldId, provider: { actorRef: "SYSTEM" } }));
}

export function applyVideoRecallSourceFlowContracts(inputFlows) {
  const flows = structuredClone(inputFlows);
  const flow = flows.find(({ id }) => id === VIDEO_RECALL_FLOW_ID);
  if (!flow) throw new Error(`video recall source fanout requires flow ${VIDEO_RECALL_FLOW_ID}`);

  flow.label = "Video Gate Block or Versioned Source Invalidation to Recall and Quota Release";
  flow.contractProfile = "EVENT_INVALIDATION_FANOUT";
  flow.routingPolicy = "ACTION_CHOICE_REQUIRED";
  flow.moduleIds = ["ACC-001", "DGV-001", "CONTENT-001", "VIDEO-001"];
  flow.sourceOnlyModuleIds = ["ACC-001", "DGV-001", "CONTENT-001"];
  flow.participantRoles = [
    { moduleId: "ACC-001", role: "IDENTITY_AND_RELATION_SOURCE" },
    { moduleId: "DGV-001", role: "TRANSFER_SOURCE" },
    { moduleId: "CONTENT-001", role: "MATERIAL_INVALIDATION_SOURCE" },
    { moduleId: "VIDEO-001", role: "VIDEO_RECALL_PIPELINE" },
  ];
  flow.steps = [
    {
      order: 1,
      actionId: "VIDEO-ACT-LOCATE-RECALL-IMPACT",
      semanticRole: "LOCATE_RECALL_IMPACT",
      condition: "one registered versioned source event is delivered and resolves exactly one source binding",
      providedInputs: providedBySystem(sourceImpactInputFieldIds),
    },
    {
      order: 2,
      actionId: "VIDEO-ACT-BLOCK-DELIVERY",
      semanticRole: "BLOCK_FAILED_DELIVERY",
      condition: "a mandatory gate or platform step failed before usable delivery",
    },
    {
      order: 3,
      actionId: "VIDEO-ACT-RECALL",
      semanticRole: "APPLY_CAPTURED_RECALL",
      condition: "the asset belongs to the immutable affected set captured for the exact source event version",
      providedInputs: providedBySystem(recallInputFieldIds),
    },
    {
      order: 4,
      actionId: "VIDEO-ACT-RELEASE-QUOTA",
      semanticRole: "RELEASE_PERSONAL_QUOTA",
      condition: "the personal reservation produced no currently usable result",
      providedInputs: providedBySystem(["VIDEO-LEDGER-F-RELEASE-REASON"]),
    },
    {
      order: 5,
      actionId: "VIDEO-ACT-RELEASE-SCHOOL-GROUP-QUOTA",
      semanticRole: "RELEASE_SCHOOL_QUOTA",
      condition: "the school-private reservation produced no currently usable result",
      providedInputs: providedBySystem(["VIDEO-SCHOOL-LEDGER-F-RELEASE-REASON"]),
    },
  ];
  flow.executionPaths = [
    {
      id: "GATE_BLOCK_RELEASE",
      semanticRole: "GATE_BLOCK_RELEASE",
      route: { kind: "ACTION_CHOICE", consumerStepOrder: 2 },
      stepOrders: [2, 4, 5],
      providedInputs: [],
    },
    {
      id: "SOURCE_INVALIDATION_RECALL_RELEASE",
      semanticRole: "SOURCE_INVALIDATION_RECALL_RELEASE",
      route: { kind: "ACTION_CHOICE", consumerStepOrder: 1 },
      stepOrders: [1, 3, 4, 5],
      providedInputs: [],
    },
  ];
  flow.sourceDataRefs = [
    ...videoRecallSourceBindings.flatMap(sourceDataRefsFor),
    {
      objectId: "VIDEO-OBJ-ASSET",
      fieldId: "VIDEO-ASSET-F-ID",
      version: "VIDEO-ASSET-F-VERSION",
      cardinality: "ZERO_MANY",
      semanticRole: "SOURCE_IDENTITY",
    },
    {
      objectId: "VIDEO-OBJ-ASSET",
      fieldId: "VIDEO-ASSET-F-VERSION",
      version: "VIDEO-ASSET-F-VERSION",
      cardinality: "ZERO_MANY",
      semanticRole: "SOURCE_VERSION",
    },
    {
      objectId: "VIDEO-OBJ-ASSET",
      fieldId: "VIDEO-ASSET-F-SERVICE-OBJECT-REFS",
      version: "VIDEO-ASSET-F-VERSION",
      cardinality: "ZERO_MANY",
      semanticRole: "SOURCE_PAYLOAD",
    },
  ];
  flow.targetDataRefs = [
    { objectId: "VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT", fieldId: "VIDEO-RECALL-F-ID", version: "VIDEO-RECALL-F-VERSION", semanticRole: "TARGET_IDENTITY" },
    { objectId: "VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT", fieldId: "VIDEO-RECALL-F-AFFECTED-ASSET-REFS", version: "VIDEO-RECALL-F-VERSION", semanticRole: "TARGET_PAYLOAD" },
    { objectId: "VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT", fieldId: "VIDEO-RECALL-F-VERSION", version: "VIDEO-RECALL-F-VERSION", semanticRole: "TARGET_VERSION" },
    { objectId: "VIDEO-OBJ-ASSET", fieldId: "VIDEO-ASSET-F-DELIVERY-STATUS", version: "VIDEO-ASSET-F-VERSION", semanticRole: "TARGET_STATE" },
    { objectId: "VIDEO-OBJ-ASSET", fieldId: "VIDEO-ASSET-F-VERSION", version: "VIDEO-ASSET-F-VERSION", semanticRole: "TARGET_VERSION" },
    { objectId: "VIDEO-OBJ-QUOTA-LEDGER", fieldId: "VIDEO-LEDGER-F-RELEASE-REASON", version: "VIDEO-LEDGER-F-VERSION", semanticRole: "TARGET_PAYLOAD" },
    { objectId: "VIDEO-OBJ-QUOTA-LEDGER", fieldId: "VIDEO-LEDGER-F-VERSION", version: "VIDEO-LEDGER-F-VERSION", semanticRole: "TARGET_VERSION" },
    { objectId: "VIDEO-OBJ-SCHOOL-QUOTA-LEDGER", fieldId: "VIDEO-SCHOOL-LEDGER-F-RELEASE-REASON", version: "VIDEO-SCHOOL-LEDGER-F-VERSION", semanticRole: "TARGET_PAYLOAD" },
    { objectId: "VIDEO-OBJ-SCHOOL-QUOTA-LEDGER", fieldId: "VIDEO-SCHOOL-LEDGER-F-VERSION", version: "VIDEO-SCHOOL-LEDGER-F-VERSION", semanticRole: "TARGET_VERSION" },
  ];
  flow.idempotencyKeyParts = {
    identityFieldIds: ["VIDEO-RECALL-F-ID"],
    versionFieldIds: ["VIDEO-RECALL-F-VERSION"],
    fanoutFieldId: "VIDEO-RECALL-F-AFFECTED-ASSET-REFS",
  };
  flow.failureGranularity = "ONE_SOURCE_EVENT_VERSION_ONE_IMMUTABLE_AFFECTED_ASSET_SET_AND_ONE_RESERVATION_VERSION";
  flow.retryPolicy = {
    strategy: "REDELIVER_SAME_SOURCE_EVENT_AND_RESUME_ONLY_UNFINISHED_ASSET_RECALLS_OR_RELEASES",
    maxAttempts: 8,
    retryableFailureResults: [
      "RECALL_SOURCE_VERSION_STALE",
      "VERSION_CONFLICT",
      "AUDIT_FAILED",
    ],
  };
  flow.compensation = {
    strategy: "KEEP_CURRENT_SOURCE_FAIL_CLOSED_AND_NEVER_REOPEN_RECALLED_PLAYBACK",
    description: "a failed fanout keeps current-source delivery and playback checks closed, preserves the immutable impact snapshot, and retries only unfinished recalls or releases",
  };
  flow.downstreamInvalidation = {
    strategy: "STOP_PLAYBACK_INVALIDATE_LINKS_AND_REAUTHORIZE_EVERY_DERIVED_DELIVERY_SURFACE",
    targets: [
      "controlled playback session",
      "video deep link",
      "cached media authorization",
      "delivery notification",
      "AI conversation and report references",
    ],
  };
  flow.eventInvalidationContract = {
    eventId: VIDEO_RECALL_SOURCE_EVENT_ID,
    sourceBindings: structuredClone(videoRecallSourceBindings),
    exactlyOneSourceBindingPerInvocation: true,
    sourceOnlyModuleIds: [...flow.sourceOnlyModuleIds],
    impactSnapshotObjectId: "VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT",
    locatorActionId: "VIDEO-ACT-LOCATE-RECALL-IMPACT",
    recallActionId: "VIDEO-ACT-RECALL",
    emptyFanoutBehavior: "ACKNOWLEDGE_WITH_CAPTURED_EMPTY_SNAPSHOT",
    duplicateEventBehavior: "RETURN_EXISTING_SNAPSHOT_AND_RECALL_RESULTS",
    conflictingEventBehavior: "FAIL_CLOSED_AND_AUDIT",
  };
  return flows;
}
