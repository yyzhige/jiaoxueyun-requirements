import { deepFreeze } from "../model.mjs";

export const ANSWER_OPEN_POLICY_ID = "ANSWER-OPEN-POLICY-V2";

export const ANSWER_OPEN_POLICY_FIELD_IDS = deepFreeze([
  "PUB-RESULT-F-ANSWER-OPEN-POLICY-ID",
  "PUB-RESULT-F-ANSWER-OPEN-POLICY-VERSION",
]);

export const ANSWER_OPEN_TIME_FIELD_IDS = deepFreeze([
  "PUB-RESULT-F-ANSWER-OPEN-AT",
  "PUB-RESULT-F-SOLUTION-OPEN-AT",
  "PUB-RESULT-F-RUBRIC-OPEN-AT",
]);

export const RESTRICTED_RESULT_CONTENT_FIELD_IDS = deepFreeze([
  "PUB-RESULT-F-ANSWER",
  "PUB-RESULT-F-FEEDBACK-LAYER-4",
  "PUB-RESULT-F-ASSESSMENT-STANDARD-CONTENT",
]);

export const SAFE_RESULT_DISCOVERY_FIELD_IDS = deepFreeze([
  "PUB-RESULT-F-ID",
  "PUB-RESULT-F-STUDENT-REF",
  "PUB-RESULT-F-RESULT-VERSION",
  ...ANSWER_OPEN_POLICY_FIELD_IDS,
  ...ANSWER_OPEN_TIME_FIELD_IDS,
]);

export const answerOpenSurfaceExecutionRegistry = deepFreeze([
  {
    surface: "PAGE",
    moduleId: "PUB-001",
    stages: [{ stage: "READ", actionId: "PUB-ACT-VIEW-RESULT" }],
  },
  {
    surface: "SEARCH",
    moduleId: "PUB-001",
    stages: [{ stage: "SEARCH", actionId: "PUB-ACT-SEARCH-PUBLISHED-RESULTS" }],
  },
  {
    surface: "EXPORT",
    moduleId: "DGV-001",
    stages: [
      { stage: "GENERATE", actionId: "DGV-ACT-GENERATE-EXPORT" },
      { stage: "FINALIZE", actionId: "DGV-ACT-COMPLETE-EXPORT" },
      { stage: "DOWNLOAD", actionId: "DGV-ACT-DOWNLOAD-ROLE-BOUND-FILE" },
    ],
  },
  {
    surface: "NOTIFICATION",
    moduleId: "NOTI-001",
    stages: [
      { stage: "QUEUE", actionId: "NOTI-ACT-QUEUE-DELIVERY" },
      { stage: "DELIVER", actionId: "NOTI-ACT-DELIVER" },
    ],
  },
  {
    surface: "AI_CONVERSATION",
    moduleId: "AIX-001",
    stages: [
      { stage: "PREVIEW", actionId: "AIX-ACT-PREPARE-TASK-PREVIEW" },
      { stage: "FEEDBACK_DRAFT", actionId: "AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW" },
      { stage: "PLAN_DRAFT", actionId: "AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW" },
    ],
  },
  {
    surface: "VIDEO",
    moduleId: "VIDEO-001",
    stages: [
      { stage: "REQUEST", actionId: "VIDEO-ACT-REQUEST-PROBLEM-DRIVEN" },
      { stage: "REQUEST", actionId: "VIDEO-ACT-REQUEST-PROGRESS-DRIVEN" },
      { stage: "REQUEST", actionId: "VIDEO-ACT-REQUEST-SCHOOL-GROUP" },
      { stage: "GENERATE", actionId: "VIDEO-ACT-START-GENERATION" },
      { stage: "GENERATE", actionId: "VIDEO-ACT-START-SCHOOL-GROUP-GENERATION" },
      { stage: "DELIVER", actionId: "VIDEO-ACT-DELIVER-USABLE" },
      { stage: "ACCESS", actionId: "VIDEO-ACT-VIEW-CONTROLLED" },
      { stage: "ACCESS", actionId: "VIDEO-ACT-VIEW-SCHOOL-PRIVATE" },
    ],
  },
  {
    surface: "CACHE",
    moduleId: "PUB-001",
    stages: [{ stage: "READ", actionId: "PUB-ACT-OPEN-CACHED-RESULT" }],
  },
  {
    surface: "DIRECT_LINK",
    moduleId: "PUB-001",
    stages: [{ stage: "READ", actionId: "PUB-ACT-OPEN-DIRECT-RESULT-LINK" }],
  },
]);

const resultReadActions = [
  ["PUB-ACT-SEARCH-PUBLISHED-RESULTS", "Search My Published Results"],
  ["PUB-ACT-OPEN-CACHED-RESULT", "Open a Cached Result after Server Reauthorization"],
  ["PUB-ACT-OPEN-DIRECT-RESULT-LINK", "Open a Direct Result Link after Server Reauthorization"],
];

function moduleById(modules, moduleId) {
  const module = modules.find(({ id }) => id === moduleId);
  if (!module) throw new Error(`answer-open delivery requires module ${moduleId}`);
  return module;
}

function actionById(module, actionId) {
  const action = module.actions.find(({ id }) => id === actionId);
  if (!action) throw new Error(`answer-open delivery requires action ${actionId}`);
  return action;
}

function addResultReadAction(publication, actionId, label) {
  if (publication.actions.some(({ id }) => id === actionId)) return;
  const sourceAction = actionById(publication, "PUB-ACT-VIEW-RESULT");
  const clonedAction = structuredClone(sourceAction);
  clonedAction.id = actionId;
  clonedAction.label = label;
  clonedAction.outputFieldIds = [...SAFE_RESULT_DISCOVERY_FIELD_IDS];
  clonedAction.scenarioIds = sourceAction.scenarioIds.map((scenarioId) => (
    scenarioId.replace(sourceAction.id, actionId)
  ));
  publication.actions.push(clonedAction);

  const sourceScenarioIds = new Set(sourceAction.scenarioIds);
  const scenarios = publication.scenarios
    .filter(({ id }) => sourceScenarioIds.has(id))
    .map((scenario) => {
      const cloned = structuredClone(scenario);
      cloned.id = scenario.id.replace(sourceAction.id, actionId);
      cloned.actionId = actionId;
      cloned.when = `the student requests ${label}`;
      if (cloned.kind === "SUCCESS") {
        cloned.then.expectedData = `${label} returns only authorized result identity, policy, and open-time metadata; restricted content still requires PUB-ACT-VIEW-RESULT`;
      }
      if (["PERMISSION_DENIED", "NOT_FOUND"].includes(cloned.resultCode)) {
        cloned.then.expectedData = `${label} returns one neutral no-result envelope with no count, facet, ordering, autocomplete, error-shape, timing, or existence signal`;
        cloned.then.expectedVisibility = "no metadata or existence signal outside the current authorized student-result scope";
      }
      return cloned;
    });
  publication.scenarios.push(...scenarios);

  const page = publication.pages.find(({ id }) => id === "PUB-PAGE-STUDENT-RESULT");
  if (!page) throw new Error("answer-open delivery requires PUB-PAGE-STUDENT-RESULT");
  if (!page.actionIds.includes(actionId)) page.actionIds.push(actionId);
}

function appendFailureScenario(module, action, resultCode) {
  if (!action.failureResults.includes(resultCode)) action.failureResults.push(resultCode);
  const scenarioId = `${action.id}-SCN-${resultCode}`;
  if (!action.scenarioIds.includes(scenarioId)) action.scenarioIds.push(scenarioId);
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
    given: "restricted answer, solution, or assessment-standard content is not open under the current policy and source version",
    when: `the actor requests ${action.label}`,
    then: {
      expectedData: `${action.label} withholds restricted content and returns ${resultCode}`,
      expectedState: { mode: "UNCHANGED" },
      expectedPermission: "DENY",
      expectedVisibility: "safe metadata only; no restricted content, derived payload, cached copy, or direct-link disclosure",
    },
  });
}

function enforcementFor(surface, stage, existing = {}) {
  const beforeOpenBehavior = surface === "NOTIFICATION"
    ? "STRIP_RESTRICTED_CONTENT_AND_DELIVER_SAFE_SUMMARY"
    : "WITHHOLD_RESTRICTED_CONTENT";
  return {
    ...structuredClone(existing),
    policyId: ANSWER_OPEN_POLICY_ID,
    policyFieldIds: [...ANSWER_OPEN_POLICY_FIELD_IDS],
    openTimeFieldIds: [...ANSWER_OPEN_TIME_FIELD_IDS],
    surfaces: [surface],
    executionStage: stage,
    reauthorizeAtAccess: true,
    reauthorizeAtExecution: true,
    currentTimeReevaluated: true,
    sourceVersionRechecked: true,
    beforeOpenBehavior,
    restrictedContentFieldIds: [...RESTRICTED_RESULT_CONTENT_FIELD_IDS],
    failureResult: surface === "AI_CONVERSATION"
      ? "ANSWER_OPEN_GATE_FAILED"
      : "ANSWER_NOT_OPEN",
  };
}

function attachSurfaceContract(modules, entry) {
  const module = moduleById(modules, entry.moduleId);
  for (const { actionId, stage } of entry.stages) {
    const action = actionById(module, actionId);
    action.answerOpenEnforcement = enforcementFor(
      entry.surface,
      stage,
      action.answerOpenEnforcement,
    );
    action.restrictedResultConsumption = {
      sourceObjectId: "PUB-OBJ-RESULT",
      sourceIdentityFieldId: "PUB-RESULT-F-ID",
      sourceVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
      restrictedContentFieldIds: [...RESTRICTED_RESULT_CONTENT_FIELD_IDS],
      sourceResolution: entry.surface === "EXPORT"
        ? "AUTHORIZED_VERSION_PINNED_RESULT_SET"
        : "EXACT_VERSION_PINNED_RESULT_OR_DERIVATION",
      currentAuthorizationRequired: true,
      currentOpenTimeRequired: true,
      staleMissingOrClosedBehavior: "FAIL_CLOSED_WITHOUT_RESTRICTED_CONTENT",
    };
    if (["SEARCH", "CACHE", "DIRECT_LINK"].includes(entry.surface)) {
      action.restrictedResultConsumption.delegatesRestrictedContentToActionId = "PUB-ACT-VIEW-RESULT";
      action.restrictedResultConsumption.delegationCarriesSourceIdentityAndVersion = true;
      action.restrictedResultConsumption.finalGatewayReauthorizes = true;
    }
    if (entry.surface === "NOTIFICATION") {
      action.restrictedResultConsumption.deliveryPayloadRule = "SAFE_SUMMARY_AND_REAUTHORIZED_DIRECT_LINK_ONLY";
      action.restrictedResultConsumption.restrictedPayloadBeforeOpen = "STRIP_AND_CONTINUE_SAFE_SUMMARY";
    }
    if (!["AI_CONVERSATION", "NOTIFICATION"].includes(entry.surface)) {
      appendFailureScenario(module, action, "ANSWER_NOT_OPEN");
    }
  }
}

export function applyAnswerOpenDeliveryContracts(inputModules) {
  const modules = structuredClone(inputModules);
  const publication = moduleById(modules, "PUB-001");
  for (const [actionId, label] of resultReadActions) {
    addResultReadAction(publication, actionId, label);
  }
  for (const entry of answerOpenSurfaceExecutionRegistry) {
    attachSurfaceContract(modules, entry);
  }

  publication.answerOpenContract.enforcementBindings = answerOpenSurfaceExecutionRegistry
    .map(({ surface, moduleId, stages }) => ({
      surface,
      enforcementKind: "ACTION",
      moduleId,
      actionIds: stages.map(({ actionId }) => actionId),
      executionStages: stages.map(({ stage }) => stage),
      policyId: ANSWER_OPEN_POLICY_ID,
      policyFieldIds: [...ANSWER_OPEN_POLICY_FIELD_IDS],
      openTimeFieldIds: [...ANSWER_OPEN_TIME_FIELD_IDS],
      reauthorizeAtAccess: true,
      beforeOpenBehavior: surface === "NOTIFICATION"
        ? "STRIP_RESTRICTED_CONTENT_AND_DELIVER_SAFE_SUMMARY"
        : "WITHHOLD_RESTRICTED_CONTENT",
      ...(["SEARCH", "CACHE", "DIRECT_LINK"].includes(surface)
        ? { delegatesRestrictedContentToActionId: "PUB-ACT-VIEW-RESULT" }
        : {}),
    }));
  publication.answerOpenContract.resultReadActionIds = [
    "PUB-ACT-VIEW-RESULT",
    ...resultReadActions.map(([actionId]) => actionId),
  ];
  publication.answerOpenContract.crossModuleBypassBehavior = "FAIL_CLOSED";
  publication.answerOpenContract.actionMappingMustBeRealAndUnique = true;
  return modules;
}
