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

export const modules = deepFreeze([...foundationModules, ...teachingLoopModules]);
export const flows = deepFreeze([...foundationFlows, ...teachingLoopFlows]);
export const aiTasks = deepFreeze([]);

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
