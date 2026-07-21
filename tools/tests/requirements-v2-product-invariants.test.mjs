import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import { validateRequirementModel } from "../requirements-v2/validate/index.mjs";

function moduleById(model, id) {
  return model.modules.find((module) => module.id === id);
}

function objectById(model, id) {
  return model.modules.flatMap((module) => module.objects)
    .find((object) => object.id === id);
}

function actionById(model, id) {
  return model.modules.flatMap((module) => module.actions)
    .find((action) => action.id === id);
}

function fieldById(model, id) {
  return model.modules.flatMap((module) => module.objects)
    .flatMap((object) => object.fields)
    .find((field) => field.id === id);
}

function optionCodes(model, id) {
  return model.optionSets.find((optionSet) => optionSet.id === id)
    ?.values.map(({ code }) => code);
}

function hasPermission(action, effect, subjectKey, subjectValue, pattern) {
  return action?.permissions.some((permission) => (
    permission.effect === effect
    && permission[subjectKey] === subjectValue
    && (!pattern || pattern.test(permission.condition))
  ));
}

function sameMembers(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && expected.every((value) => actual.includes(value));
}

function foundationGovernanceInvariantErrors(model) {
  const errors = [];
  const requireInvariant = (condition, code) => {
    if (!condition) errors.push(code);
  };

  const activation = objectById(model, "ACC-OBJ-SCHOOL-ACTIVATION");
  const activationActions = [
    ["ACC-ACT-SUBMIT-SCHOOL-APPLICATION", undefined, "APPLICATION_SUBMITTED"],
    ["ACC-ACT-PLATFORM-REVIEW-SCHOOL-SUBJECT", "APPLICATION_SUBMITTED", "SUBJECT_APPROVED"],
    ["ACC-ACT-FIRST-ADMIN-ACCEPT-AUTHORIZATION", "SUBJECT_APPROVED", "FIRST_ADMIN_ACCEPTED"],
    ["ACC-ACT-VALIDATE-SCHOOL-INITIALIZATION", "FIRST_ADMIN_ACCEPTED", "INITIALIZATION_VALIDATED"],
    ["ACC-ACT-ACTIVATE-SCHOOL-TEACHING", "INITIALIZATION_VALIDATED", "TEACHING_ACTIVE"],
  ];
  requireInvariant(
    activationActions.every(([id, from, to]) => {
      const action = actionById(model, id);
      if (!action) return false;
      if (from === undefined) {
        return action.operationKind === "CREATE"
          && moduleById(model, "ACC-001").scenarios.some((scenario) => (
            scenario.actionId === id
            && scenario.kind === "SUCCESS"
            && scenario.then.expectedState.value === to
          ));
      }
      return action.transition?.from === from && action.transition?.to === to;
    }),
    "SCHOOL_ACTIVATION_SEQUENCE",
  );
  requireInvariant(
    activation?.fields.some(({ id, valueSource }) => (
      id === "ACC-ACTIVATION-F-COMPLETED-AXES"
      && valueSource.optionSetId === "OPT-GOV-001"
    ))
    && sameMembers(optionCodes(model, "OPT-GOV-001"), [
      "PLATFORM_SUBJECT_REVIEW",
      "FIRST_ADMIN_ACCEPTANCE",
      "INITIALIZATION_VALIDATION",
      "SUBSCRIPTION_READINESS",
      "CLASS_COURSE_READINESS",
      "TEACHING_ACTIVATION",
    ]),
    "SCHOOL_ACTIVATION_AXES",
  );

  const recoverySecond = actionById(model, "ACC-ACT-SECOND-AUTHORIZE-SINGLE-ADMIN-RECOVERY");
  const recoveryDual = actionById(model, "ACC-ACT-CONFIRM-DUAL-ADMIN-RECOVERY");
  requireInvariant(
    hasPermission(recoverySecond, "ALLOW", "roleRef", "ROLE-PLATFORM-GOVERNANCE", /exactly one valid administrator|single-administrator/i)
    && hasPermission(recoverySecond, "DENY", "roleRef", "ROLE-SCHOOL-ADMIN", /cannot self-authorize/i)
    && hasPermission(recoveryDual, "ALLOW", "roleRef", "ROLE-SCHOOL-ADMIN", /two distinct/i),
    "SCHOOL_ADMIN_RECOVERY_DUAL_CONTROL",
  );

  const identityIds = [
    "ACC-OBJ-PLATFORM-IDENTITY",
    "ACC-OBJ-LOGIN-ACCOUNT",
    "ACC-OBJ-SCHOOL-PROFILE",
    "ACC-OBJ-STUDENT-PRIMARY-ACCOUNT",
  ];
  requireInvariant(
    identityIds.every((id) => objectById(model, id))
    && new Set(identityIds).size === identityIds.length,
    "IDENTITY_ACCOUNT_PROFILE_SEPARATION",
  );
  requireInvariant(
    sameMembers(optionCodes(model, "OPT-ENUM-025"), ["MOBILE", "EMAIL", "USERNAME"]),
    "LOGIN_IDENTIFIER_CONTRACT",
  );
  const identityNumber = fieldById(model, "ACC-PIDENT-F-ID");
  const deleteIdentity = actionById(model, "ACC-ACT-COMPLETE-IDENTITY-DELETION");
  const registerIdentity = actionById(model, "ACC-ACT-REGISTER-PLATFORM-IDENTITY");
  requireInvariant(
    /after deletion creates a new number|later registration after deletion creates a new number/i.test(identityNumber?.validation)
    && /full deletion removes every recoverable lookup mapping/i.test(identityNumber?.historyPolicy)
    && deleteIdentity?.outputFieldIds.includes("ACC-PIDENT-F-LOOKUP-MAPPING-STATUS")
    && registerIdentity?.outputFieldIds.includes("ACC-PIDENT-F-ID")
    && /newly generated|never revives/i.test(registerIdentity?.scenarioIds?.length
      ? moduleById(model, "ACC-001").scenarios.find((scenario) => (
        scenario.actionId === registerIdentity.id && scenario.kind === "SUCCESS"
      ))?.then.expectedData
      : ""),
    "IDENTITY_NUMBER_LIFECYCLE",
  );
  requireInvariant(
    hasPermission(deleteIdentity, "DENY", "roleRef", "ROLE-SCHOOL-ADMIN", /cannot execute platform identity deletion/i),
    "SCHOOL_CANNOT_DELETE_PLATFORM_IDENTITY",
  );

  const guardianObjects = [
    "IAM-OBJ-GUARDIAN-RELATION",
    "IAM-OBJ-SCHOOL-DATA-AUTHORIZATION",
    "IAM-OBJ-TASK-ASSISTANCE-SESSION",
  ];
  const openAssistance = actionById(model, "IAM-ACT-OPEN-TASK-ASSISTANCE-SESSION");
  requireInvariant(
    guardianObjects.every((id) => objectById(model, id))
    && !model.modules.flatMap((module) => module.objects)
      .flatMap((object) => object.fields)
      .some(({ id }) => /GUARDIAN.FLAG|GUARDIAN-FLAG/i.test(id)),
    "GUARDIAN_RELATIONSHIP_SEPARATION",
  );
  requireInvariant(
    hasPermission(openAssistance, "ALLOW", "roleRef", "ROLE-GUARDIAN", /confirmed guardian relation.*active school authorization.*selected child.*current task/i)
    && hasPermission(openAssistance, "DENY", "roleRef", "ROLE-GUARDIAN", /without a task session.*login-identifier edits.*full-history export.*learning-state writes/i),
    "GUARDIAN_TASK_SESSION_REQUIRED",
  );

  const substitute = objectById(model, "ORG-OBJ-SUBSTITUTE-TEACHING-RELATION");
  requireInvariant(
    [
      "ORG-SUBSTITUTE-F-TEACHER-ID",
      "ORG-SUBSTITUTE-F-CLASS-ID",
      "ORG-SUBSTITUTE-F-SUBJECT-ID",
      "ORG-SUBSTITUTE-F-DUTY-ID",
      "ORG-SUBSTITUTE-F-START",
      "ORG-SUBSTITUTE-F-END",
    ].every((id) => substitute?.fields.some((field) => field.id === id))
    && actionById(model, "ORG-ACT-EXPIRE-SUBSTITUTE-RELATION")?.executionMode === "SYSTEM_EVENT",
    "SUBSTITUTE_RELATION_SCOPE_AND_EXPIRY",
  );

  const evaluatePermission = actionById(model, "IAM-ACT-EVALUATE-PERMISSION");
  requireInvariant(
    hasPermission(evaluatePermission, "DENY", "roleRef", "ROLE-SCHOOL-ADMIN", /default-denied.*student detailed learning profiles.*cannot use a custom duty to synthesize/i)
    && hasPermission(evaluatePermission, "DENY", "roleRef", "ROLE-PLATFORM-OPS", /default-denied.*approved, audited, scope-bound and expiring access session/i),
    "PRIVILEGED_DEFAULT_DENY",
  );
  const delegationActions = [
    "IAM-ACT-GRANT-DUTY",
    "IAM-ACT-GRANT-SCOPE",
    "IAM-ACT-CREATE-TEMP-GRANT",
  ].map((id) => actionById(model, id));
  requireInvariant(
    delegationActions.every((action) => (
      action.failureResults.includes("RELATIONSHIP_REQUIRED")
      && action.failureResults.includes("HARD_BOUNDARY_DENIED")
      && hasPermission(action, "DENY", "roleRef", "ROLE-SCHOOL-ADMIN", /custom duty cannot synthesize.*relationships.*hard boundaries/i)
    )),
    "CUSTOM_DUTY_HARD_BOUNDARY",
  );

  const executeHighImpact = actionById(model, "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION");
  requireInvariant(
    hasPermission(executeHighImpact, "ALLOW", "roleRef", "ROLE-PLATFORM-GOVERNANCE", /AUTHORIZED.*unexpired.*NONE or RESOLVED/i)
    && hasPermission(executeHighImpact, "DENY", "roleRef", "ROLE-PLATFORM-GOVERNANCE", /OPEN or FROZEN/i)
    && sameMembers(optionCodes(model, "OPT-GOV-004"), ["NONE", "OPEN", "FROZEN", "RESOLVED", "REJECTED"]),
    "HIGH_IMPACT_DISPUTE_FREEZE",
  );

  const exportRequest = actionById(model, "DGV-ACT-REQUEST-EXPORT");
  const exportGenerate = actionById(model, "DGV-ACT-GENERATE-EXPORT");
  const exportDownload = actionById(model, "DGV-ACT-DOWNLOAD-ROLE-BOUND-FILE");
  requireInvariant(
    sameMembers(optionCodes(model, "OPT-GOV-006"), ["STUDENT", "GUARDIAN", "TEACHER", "SCHOOL"])
    && optionCodes(model, "OPT-GOV-005")?.includes("PUBLISH_STUDENT_WORK")
    && ["DGV-EXPORT-F-AUDIENCE", "DGV-EXPORT-F-SUBJECT-ID", "DGV-EXPORT-F-SOURCE-RIGHTS"]
      .every((id) => exportRequest?.inputFieldIds.includes(id))
    && hasPermission(exportGenerate, "ALLOW", "actorRef", "SYSTEM", /reauthorizes.*requester.*audience.*object ownership.*source rights.*scope.*expiry.*generation time/i)
    && hasPermission(exportDownload, "ALLOW", "actorRef", "CURRENT_ACTOR", /reauthorized at download time.*immutable audience.*unexpired link/i),
    "ROLE_SEPARATED_EXPORT",
  );

  const transfer = actionById(model, "DGV-ACT-EXECUTE-STUDENT-TRANSFER");
  const oldSchoolRead = actionById(model, "DGV-ACT-VIEW-OLD-SCHOOL-RESTRICTED-HISTORY");
  const surrogate = objectById(model, "DGV-OBJ-TEACHER-AUTHOR-SURROGATE");
  requireInvariant(
    /changes authorization rather than copying the complete database.*old school remains restricted.*permitted subset/i.test(
      moduleById(model, "DGV-001").scenarios.find((scenario) => (
        scenario.actionId === transfer?.id && scenario.kind === "SUCCESS"
      ))?.then.expectedData,
    )
    && hasPermission(oldSchoolRead, "DENY", "roleRef", "ROLE-SCHOOL-ADMIN", /no default access/i)
    && hasPermission(oldSchoolRead, "DENY", "roleRef", "ROLE-PLATFORM-OPS", /approved audited access session/i)
    && !surrogate?.fields.some(({ id }) => /ORIGINAL.*IDENTITY|TEACHER.*IDENTITY/i.test(id)),
    "TRANSFER_OLD_SCHOOL_AND_AUTHOR_SURROGATE",
  );

  const sharedCleanup = actionById(model, "AUD-ACT-CLEAN-SHARED-DEVICE-SESSION");
  const sharedResult = moduleById(model, "AUD-001").scenarios.find((scenario) => (
    scenario.actionId === sharedCleanup?.id && scenario.kind === "SUCCESS"
  ))?.then.expectedData;
  requireInvariant(
    sameMembers(optionCodes(model, "OPT-GOV-007"), [
      "PRODUCT_PAGE_STATE",
      "PRODUCT_CACHE",
      "PRODUCT_TEMP_FILE",
      "SENSITIVE_NOTIFICATION_PREVIEW",
      "PRODUCT_DOWNLOAD_PERMISSION",
    ])
    && /without claiming control of screenshots, browser downloads or autofill/i.test(sharedResult)
    && !/clear(?:s|ed)?.*operating-system|remove(?:s|d)?.*browser downloads/i.test(sharedResult),
    "SHARED_DEVICE_PRODUCT_CONTROLLED_SCOPE",
  );

  return errors;
}

function assertInvariant(model, code) {
  assert.ok(
    foundationGovernanceInvariantErrors(model).includes(code),
    `${code} was not detected`,
  );
}

test("school activation and administrator recovery use independent governed stages", () => {
  assert.deepEqual(foundationGovernanceInvariantErrors(requirementModel), []);
});

test("identity, account, school profile and student primary account remain separate", () => {
  assert.deepEqual(validateRequirementModel(requirementModel), []);
  assert.deepEqual(foundationGovernanceInvariantErrors(requirementModel), []);
});

test("identity destructive variant rejects a permanent post-deletion identity number", () => {
  const model = structuredClone(requirementModel);
  fieldById(model, "ACC-PIDENT-F-ID").validation = "the identity number is permanent forever after deletion";
  assertInvariant(model, "IDENTITY_NUMBER_LIFECYCLE");
});

test("guardian access requires a confirmed relation, school authorization and current task session", () => {
  assert.deepEqual(foundationGovernanceInvariantErrors(requirementModel), []);
});

test("guardian destructive variant rejects assistance without a task-level session", () => {
  const model = structuredClone(requirementModel);
  const action = actionById(model, "IAM-ACT-OPEN-TASK-ASSISTANCE-SESSION");
  action.permissions.find(({ effect, roleRef }) => (
    effect === "ALLOW" && roleRef === "ROLE-GUARDIAN"
  )).condition = "a personal guardian relation alone grants all student history access";
  assertInvariant(model, "GUARDIAN_TASK_SESSION_REQUIRED");
});

test("authorization boundaries cover substitute expiry, privileged default deny and disputes", () => {
  assert.deepEqual(foundationGovernanceInvariantErrors(requirementModel), []);
});

test("authorization destructive variant rejects high-impact execution during dispute freeze", () => {
  const model = structuredClone(requirementModel);
  const action = actionById(model, "IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION");
  action.permissions = action.permissions.filter(({ effect, roleRef }) => !(
    effect === "DENY" && roleRef === "ROLE-PLATFORM-GOVERNANCE"
  ));
  assertInvariant(model, "HIGH_IMPACT_DISPUTE_FREEZE");
});

test("authorization destructive variant rejects custom duty widening a platform hard boundary", () => {
  const model = structuredClone(requirementModel);
  const action = actionById(model, "IAM-ACT-GRANT-DUTY");
  action.failureResults = action.failureResults.filter((code) => code !== "HARD_BOUNDARY_DENIED");
  action.permissions = action.permissions.filter(({ effect, roleRef }) => !(
    effect === "DENY" && roleRef === "ROLE-SCHOOL-ADMIN"
  ));
  assertInvariant(model, "CUSTOM_DUTY_HARD_BOUNDARY");
});

test("export and transfer rights remain role-separated and source-right bounded", () => {
  assert.deepEqual(foundationGovernanceInvariantErrors(requirementModel), []);
});

test("export destructive variant rejects a missing student-work publication authorization action", () => {
  const model = structuredClone(requirementModel);
  const dataRightActions = model.optionSets.find(({ id }) => id === "OPT-GOV-005");
  dataRightActions.values = dataRightActions.values.filter(({ code }) => (
    code !== "PUBLISH_STUDENT_WORK"
  ));
  assertInvariant(model, "ROLE_SEPARATED_EXPORT");
});

test("export destructive variant rejects generation without independent reauthorization", () => {
  const model = structuredClone(requirementModel);
  const action = actionById(model, "DGV-ACT-GENERATE-EXPORT");
  action.permissions.find(({ effect, actorRef }) => (
    effect === "ALLOW" && actorRef === "SYSTEM"
  )).condition = "the system trusts the earlier approval without reauthorization";
  assertInvariant(model, "ROLE_SEPARATED_EXPORT");
});

test("shared device cleanup is limited to product-controlled state", () => {
  assert.deepEqual(foundationGovernanceInvariantErrors(requirementModel), []);
});

test("shared device destructive variant rejects operating-system cleanup claims", () => {
  const model = structuredClone(requirementModel);
  const scenario = moduleById(model, "AUD-001").scenarios.find((candidate) => (
    candidate.actionId === "AUD-ACT-CLEAN-SHARED-DEVICE-SESSION"
    && candidate.kind === "SUCCESS"
  ));
  scenario.then.expectedData = "clears operating-system downloads, screenshots and browser autofill";
  assertInvariant(model, "SHARED_DEVICE_PRODUCT_CONTROLLED_SCOPE");
});
