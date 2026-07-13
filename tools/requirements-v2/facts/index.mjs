import {
  MODEL_COLLECTIONS,
  deepFreeze,
  defineRequirementModel,
} from "../model.mjs";
import {
  baselineDecisions,
  duties,
  events,
  extensions,
  lifecyclePolicies,
  metrics,
  nfrs,
  optionSets,
  roles,
  sensitivities,
} from "./catalogs.mjs";
import { foundationFlows, foundationModules } from "./foundation.mjs";

export {
  baselineDecisions,
  duties,
  events,
  extensions,
  lifecyclePolicies,
  metrics,
  nfrs,
  optionSets,
  roles,
  sensitivities,
};

export const modules = foundationModules;
export const flows = foundationFlows;
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
