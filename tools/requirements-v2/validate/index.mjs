import { validateModelReferences } from "./model-validator.mjs";
import { validateModelSemantics } from "./semantic-validator.mjs";

export function validateRequirementModel(model) {
  return [
    ...validateModelReferences(model),
    ...validateModelSemantics(model),
  ].sort();
}

export function assertValidRequirementModel(model) {
  const errors = validateRequirementModel(model);
  if (errors.length > 0) {
    throw new Error(`Invalid requirement model:\n${errors.join("\n")}`);
  }
}
