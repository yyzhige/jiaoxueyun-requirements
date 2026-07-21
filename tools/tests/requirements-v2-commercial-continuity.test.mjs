import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import { validateRequirementModel } from "../requirements-v2/validate/index.mjs";

function moduleById(model, id) {
  return model.modules.find((module) => module.id === id);
}

function objectById(model, id) {
  return model.modules.flatMap(({ objects }) => objects).find((object) => object.id === id);
}

function actionById(model, id) {
  return model.modules.flatMap(({ actions }) => actions).find((action) => action.id === id);
}

function optionCodes(model, id) {
  return model.optionSets.find((optionSet) => optionSet.id === id).values.map(({ code }) => code);
}

function assertCommercialInvalid(mutate) {
  const model = structuredClone(requirementModel);
  mutate(model);
  const errors = validateRequirementModel(model);
  assert.ok(
    errors.some((error) => error.startsWith("INVALID_COMMERCIAL_CONTINUITY_CONTRACT")),
    errors.join("\n"),
  );
}

test("school is the only payer and finance contact is separate from governance administration", () => {
  const platform = moduleById(requirementModel, "PLAT-001");
  const boundary = objectById(requirementModel, "PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY");
  assert.deepEqual(optionCodes(requirementModel, "OPT-EXT-019"), ["SCHOOL"]);
  assert.equal(boundary.ownerRef, "ROLE-SCHOOL-ADMIN");
  assert.equal(boundary.producerRef, "ROLE-PLATFORM-GOVERNANCE");
  assert.equal(platform.commercialBoundaryContract.contactsMustDiffer, true);
  assert.equal(
    platform.commercialBoundaryContract.financialContactFieldId,
    "PLAT-COMM-F-FINANCIAL-CONTACT-REF",
  );
  assert.equal(
    platform.commercialBoundaryContract.governanceAdministratorFieldId,
    "PLAT-COMM-F-GOVERNANCE-ADMIN-REF",
  );
  const confirm = actionById(requirementModel, "PLAT-ACT-CONFIRM-COMMERCIAL-BOUNDARY");
  assert.ok(confirm.permissions.some(({ effect, roleRef, condition }) => (
    effect === "ALLOW"
      && roleRef === "ROLE-SCHOOL-ADMIN"
      && /distinct from.*financial contact/i.test(condition)
  )));
});

test("core AI is school-wide and package expansion cannot sell safety or the learning loop", () => {
  const contract = moduleById(requirementModel, "PLAT-001").commercialBoundaryContract;
  assert.deepEqual(contract.coreEntitlements, ["CORE_AI_ASSESSMENT", "MINIMUM_VIDEO_HELP"]);
  assert.deepEqual(contract.packageExpansionScope, [
    "CAPACITY",
    "CONCURRENCY",
    "ANALYTICS",
    "GENERAL_SUPPORT",
  ]);
  assert.deepEqual(contract.prohibitedConsumerModels, [
    "STUDENT_PAYMENT",
    "GUARDIAN_PAYMENT",
    "ADVERTISING",
    "WEAKNESS_BASED_COMMERCE",
    "CONTENT_MARKETPLACE",
    "TEACHER_REVENUE_SHARE",
  ]);
  assert.equal(contract.coreLearningLoopPaywallAllowed, false);
});

test("restricted service uses finite activity-protection and exit windows with lawful continuing rights", () => {
  const platform = moduleById(requirementModel, "PLAT-001");
  const contract = platform.serviceContinuityContract;
  assert.deepEqual(contract.protectedOperations, [
    "COMPLETE_PUBLISHED_ACTIVITY",
    "HISTORICAL_READ",
    "LEGAL_EXPORT",
    "TRANSFER",
    "DELETION",
    "SECURITY_SUPPORT",
  ]);
  assert.equal(contract.newActivityPolicy, "BLOCK_NEW_ACTIVITY_OUTSIDE_CURRENT_ENTITLEMENT");
  assert.equal(
    contract.protectedActivityManifestFieldId,
    "PLAT-CONT-F-PROTECTED-ACTIVITY-MANIFEST",
  );
  assert.equal(
    contract.activityCreationGuardActionId,
    "PLAT-ACT-EVALUATE-NEW-ACTIVITY-ENTITLEMENT",
  );
  assert.equal(contract.continuingDataRightsBasis, "LAW_AND_CONTRACT");
  assert.equal(contract.finiteWindowsRequired, true);
  assert.equal(contract.unlimitedFreeFullServiceAfterTermination, false);
  assert.deepEqual(
    objectById(requirementModel, "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW").states,
    ["ACTIVITY_PROTECTION_OPEN", "EXIT_WINDOW_OPEN", "CLOSED"],
  );
  assert.deepEqual(
    actionById(requirementModel, "PLAT-ACT-ENTER-EXIT-WINDOW").transition,
    { from: "ACTIVITY_PROTECTION_OPEN", to: "EXIT_WINDOW_OPEN" },
  );
  assert.ok(
    actionById(requirementModel, "PLAT-ACT-EVALUATE-NEW-ACTIVITY-ENTITLEMENT")
      .failureResults.includes("ACTIVITY_ENTITLEMENT_BLOCKED"),
  );
});

test("destructive mutations cannot introduce consumer payment or remove core entitlements", () => {
  assertCommercialInvalid((model) => {
    model.optionSets.find(({ id }) => id === "OPT-EXT-019").values.push({
      code: "GUARDIAN",
      label: "监护人",
    });
  });
  assertCommercialInvalid((model) => {
    moduleById(model, "PLAT-001").commercialBoundaryContract.contactsMustDiffer = false;
  });
  assertCommercialInvalid((model) => {
    moduleById(model, "PLAT-001").commercialBoundaryContract.coreEntitlements.pop();
  });
  assertCommercialInvalid((model) => {
    moduleById(model, "PLAT-001").commercialBoundaryContract.prohibitedConsumerModels
      .splice(2, 1);
  });
  assertCommercialInvalid((model) => {
    moduleById(model, "PLAT-001").commercialBoundaryContract.coreLearningLoopPaywallAllowed = true;
  });
});

test("destructive mutations cannot create an infinite free-service promise or cut protected rights", () => {
  assertCommercialInvalid((model) => {
    moduleById(model, "PLAT-001").serviceContinuityContract
      .unlimitedFreeFullServiceAfterTermination = true;
  });
  assertCommercialInvalid((model) => {
    moduleById(model, "PLAT-001").serviceContinuityContract.protectedOperations.shift();
  });
  assertCommercialInvalid((model) => {
    moduleById(model, "PLAT-001").serviceContinuityContract.newActivityPolicy = "ALLOW_ALL";
  });
  assertCommercialInvalid((model) => {
    actionById(model, "PLAT-ACT-OPEN-SERVICE-CONTINUITY").inputFieldIds =
      actionById(model, "PLAT-ACT-OPEN-SERVICE-CONTINUITY").inputFieldIds
        .filter((fieldId) => fieldId !== "PLAT-CONT-F-EXIT-WINDOW-UNTIL");
  });
  assertCommercialInvalid((model) => {
    actionById(model, "PLAT-ACT-OPEN-SERVICE-CONTINUITY").inputFieldIds =
      actionById(model, "PLAT-ACT-OPEN-SERVICE-CONTINUITY").inputFieldIds
        .filter((fieldId) => fieldId !== "PLAT-CONT-F-PROTECTED-ACTIVITY-MANIFEST");
  });
  assertCommercialInvalid((model) => {
    actionById(model, "PLAT-ACT-EVALUATE-NEW-ACTIVITY-ENTITLEMENT").failureResults =
      ["PERMISSION_DENIED", "NOT_FOUND"];
  });
  assertCommercialInvalid((model) => {
    actionById(model, "PLAT-ACT-CLOSE-SERVICE-CONTINUITY").transition.from =
      "ACTIVITY_PROTECTION_OPEN";
  });
});
