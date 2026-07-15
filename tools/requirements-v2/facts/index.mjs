import {
  MODEL_COLLECTIONS,
  deepFreeze,
  defineRequirementModel,
} from "../model.mjs";
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

export const optionSets = deepFreeze([
  ...catalogOptionSets,
  ...teachingLoopOptionSets,
  ...extensionOptionSets,
]);

export const events = deepFreeze([
  ...catalogEvents,
  ...teachingLoopEvents,
  ...extensionEvents,
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

export const modules = deepFreeze([
  ...foundationModules,
  ...teachingLoopModules,
  ...aiReportingModules,
  ...extensionModules,
]);
export const flows = deepFreeze([
  ...foundationFlows,
  ...teachingLoopFlows,
  ...aiReportingFlows,
  ...extensionFlows,
]);
export const aiTasks = deepFreeze([
  ...aiReportingAiTasks,
  ...extensionAiTasks,
]);

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
};

export const requirementModel = defineRequirementModel({
  profile: "ZHIXU_V2",
  ...Object.fromEntries(
    MODEL_COLLECTIONS.map(({ key }) => [key, collectionFacts[key]]),
  ),
});
