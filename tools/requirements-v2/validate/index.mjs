import { validateModelReferences } from "./model-validator.mjs";
import { validateModelSemantics } from "./semantic-validator.mjs";
import { prepareRequirementModel } from "./structure-validator.mjs";

export function validateRequirementModel(model) {
  const prepared = prepareRequirementModel(model);
  if (prepared.model === null) return prepared.errors.sort();

  return [
    ...prepared.errors,
    ...validateModelReferences(prepared.model),
    ...validateModelSemantics(prepared.model),
  ].sort();
}

export function assertValidRequirementModel(model) {
  const errors = validateRequirementModel(model);
  if (errors.length > 0) {
    throw new Error(`Invalid requirement model:\n${errors.join("\n")}`);
  }
}
