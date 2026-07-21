import {
  MODEL_COLLECTIONS,
  RELEASE_STATUS,
  deepFreeze,
  defineRequirementModel,
} from "../model.mjs";
import {
  baselineChapters,
  deliveryState,
  phases,
  productBaseline,
  productDecisions,
  productInvariants,
  releaseStatuses,
  terminology,
} from "./product-baseline-v2.mjs";
import { migrationChanges } from "./baseline-migration.mjs";
import { launchGates, metricGroups } from "./launch-governance.mjs";
import {
  baselineDecisions,
  duties,
  events as catalogEvents,
  extensions,
  lifecyclePolicies,
  metrics,
  nfrs,
  optionSets as catalogOptionSets,
  roles,
  sensitivities,
} from "./catalogs.mjs";
import { foundationFlows, foundationModules } from "./foundation.mjs";
import {
  aiReportingAiTasks,
  aiReportingFlows,
  aiReportingModules,
} from "./ai-reporting.mjs";
import {
  teachingLoopFlows,
  teachingLoopEvents,
  teachingLoopModules,
  teachingLoopOptionSets,
} from "./teaching-loop.mjs";
import {
  extensionAiTasks,
  extensionEvents,
  extensionFlows,
  extensionModules,
  extensionOptionSets,
} from "./extensions.mjs";
import {
  deferPhaseThreeFlowActions,
  phaseTwoAssessmentEvents,
  phaseTwoAssessmentOptionSets,
  replacePhaseTwoAssessmentFlows,
  replacePhaseTwoAssessmentModules,
  replacePhaseTwoAssessmentOptionSets,
} from "./phase-two-assessment.mjs";

export const optionSets = deepFreeze(replacePhaseTwoAssessmentOptionSets([
  ...catalogOptionSets,
  ...teachingLoopOptionSets,
  ...extensionOptionSets,
  ...phaseTwoAssessmentOptionSets,
]));

export const events = deepFreeze([
  ...catalogEvents,
  ...teachingLoopEvents,
  ...extensionEvents,
  ...phaseTwoAssessmentEvents,
]);

export {
  baselineDecisions,
  duties,
  extensions,
  lifecyclePolicies,
  metrics,
  nfrs,
  roles,
  sensitivities,
};

export const modules = deepFreeze(deferPhaseThreeFlowActions(replacePhaseTwoAssessmentModules([
  ...foundationModules,
  ...teachingLoopModules,
  ...aiReportingModules,
  ...extensionModules,
])));
export const currentReleaseModuleIds = deepFreeze(
  modules
    .filter(({ releaseStatus }) => releaseStatus === RELEASE_STATUS.BUILD_READY)
    .map(({ id }) => id),
);
export const flows = deepFreeze(replacePhaseTwoAssessmentFlows([
  ...foundationFlows,
  ...teachingLoopFlows,
  ...aiReportingFlows,
  ...extensionFlows,
]));
export const aiTasks = deepFreeze([
  ...aiReportingAiTasks,
  ...extensionAiTasks,
]);

export {
  baselineChapters,
  deliveryState,
  phases,
  productBaseline,
  productDecisions,
  productInvariants,
  releaseStatuses,
  terminology,
  migrationChanges,
  metricGroups,
  launchGates,
};

export const reviewStatus = deepFreeze({
  code: "PRODUCT_BASELINE_V2_FINALIZED_FACTS_ENCODED",
  label: "README v2.0 finalized product baseline facts encoded; D003-D096 closed",
  reviewedAt: "2026-07-20",
});

const collectionFacts = {
  baselineDecisions,
  roles,
  duties,
  lifecyclePolicies,
  sensitivities,
  optionSets,
  events,
  metrics,
  nfrs,
  modules,
  flows,
  aiTasks,
  extensions,
  phases,
  productDecisions,
  baselineChapters,
  migrationChanges,
  metricGroups,
  launchGates,
};

export const requirementModel = defineRequirementModel({
  profile: "ZHIXU_V2",
  reviewStatus,
  productBaseline,
  deliveryState,
  terminology,
  productInvariants,
  currentReleaseModuleIds,
  ...Object.fromEntries(
    MODEL_COLLECTIONS.map(({ key }) => [key, collectionFacts[key]]),
  ),
});
