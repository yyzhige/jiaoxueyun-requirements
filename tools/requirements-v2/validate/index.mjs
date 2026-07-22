import { validateAiResponsibilityContracts } from "./ai-responsibility-validator.mjs";
import { validateAnswerOpenDeliveryContracts } from "./answer-open-delivery-validator.mjs";
import { validateClosedClassificationOptions } from "./closed-classification-options-validator.mjs";
import { validateDataCatalogGovernance } from "./data-catalog-governance-validator.mjs";
import { validateHighImpactAuthorizationContracts } from "./high-impact-authorization-validator.mjs";
import { validateModelReferences } from "./model-validator.mjs";
import { validateSchoolTermReferences } from "./school-term-reference-validator.mjs";
import { validateModelSemantics } from "./semantic-validator.mjs";
import { prepareRequirementModel } from "./structure-validator.mjs";
import { validateTeacherWriteScopes } from "./teacher-write-scope-validator.mjs";
import { validateTeacherAuthorSurrogateContract } from "./teacher-author-surrogate-validator.mjs";
import { validateTransferLifecycleContract } from "./transfer-lifecycle-validator.mjs";
import { validateVideoRecallSourceFanout } from "./video-recall-source-fanout-validator.mjs";

export function validateRequirementModel(model) {
  const prepared = prepareRequirementModel(model);
  if (prepared.model === null) return prepared.errors.sort();

  return [
    ...prepared.errors,
    ...validateModelReferences(prepared.model),
    ...validateModelSemantics(prepared.model),
    ...validateAiResponsibilityContracts(prepared.model),
    ...validateAnswerOpenDeliveryContracts(prepared.model),
    ...validateClosedClassificationOptions(prepared.model),
    ...validateDataCatalogGovernance(prepared.model),
    ...validateHighImpactAuthorizationContracts(prepared.model),
    ...validateSchoolTermReferences(prepared.model),
    ...validateTeacherWriteScopes(prepared.model),
    ...validateTeacherAuthorSurrogateContract(prepared.model),
    ...validateTransferLifecycleContract(prepared.model),
    ...validateVideoRecallSourceFanout(prepared.model),
  ].sort();
}

export function assertValidRequirementModel(model) {
  const errors = validateRequirementModel(model);
  if (errors.length > 0) {
    throw new Error(`Invalid requirement model:\n${errors.join("\n")}`);
  }
}
