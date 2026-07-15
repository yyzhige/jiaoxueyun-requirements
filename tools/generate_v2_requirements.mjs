import { requirementModel } from "./requirements-v2/facts/index.mjs";
import { renderRequirementPackage } from "./requirements-v2/render/package.mjs";
import { assertValidRequirementModel } from "./requirements-v2/validate/index.mjs";

assertValidRequirementModel(requirementModel);
const artifacts = renderRequirementPackage(requirementModel, process.cwd());
process.stdout.write(
  `generated artifacts=${artifacts.length} modules=${requirementModel.modules.length} flows=${requirementModel.flows.length}\n`,
);
