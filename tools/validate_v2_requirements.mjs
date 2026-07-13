import { requirementModel } from "./requirements-v2/facts/index.mjs";
import { assertValidRequirementModel } from "./requirements-v2/validate/index.mjs";

assertValidRequirementModel(requirementModel);
process.stdout.write(
  `validated modules=${requirementModel.modules.length} flows=${requirementModel.flows.length}\n`,
);
