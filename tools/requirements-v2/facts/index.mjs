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

export const modules = deepFreeze([]);
export const flows = deepFreeze([]);
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
