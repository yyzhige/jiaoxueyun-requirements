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

export const optionSets = deepFreeze([
  ...catalogOptionSets,
  ...teachingLoopOptionSets,
]);

export const events = deepFreeze([
  ...catalogEvents,
  ...teachingLoopEvents,
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

const authoredModules = [
  ...foundationModules,
  ...teachingLoopModules,
  ...aiReportingModules,
];

export const modules = deepFreeze(authoredModules.map((module) => ({
  ...module,
  objects: module.objects.map((object) => ({
    ...object,
    stateReachability: object.stateReachability ?? { mode: "NONE" },
  })),
})));
const authoredFlows = [
  ...foundationFlows,
  ...teachingLoopFlows,
  ...aiReportingFlows,
];
export const flows = deepFreeze(authoredFlows.map((flow) => ({
  ...flow,
  contractProfile: flow.contractProfile ?? "GENERIC",
})));
export const aiTasks = deepFreeze(aiReportingAiTasks);

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

export const requirementModel = defineRequirementModel(Object.fromEntries(
  MODEL_COLLECTIONS.map(({ key }) => [key, collectionFacts[key]]),
));
