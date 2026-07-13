import { defineRequirementModel } from "../model.mjs";
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

export const modules = [];
export const flows = [];
export const aiTasks = [];

export const requirementModel = defineRequirementModel({
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
});
