import {
  CLIENT,
  PHASE,
  deepFreeze,
} from "../model.mjs";
import { withStudentDataClassification } from "./student-data-classification.mjs";

const FLOW_ID = "DF-017";
const MEMBERSHIP_SOURCE_EVENT_ID = "EVT-MEMBERSHIP-DIRECTORY-SNAPSHOT-AVAILABLE";
const START_EVENT_ID = "EVT-STUDENT-TRANSFER-CUTOVER-REQUESTED";
const COMPLETED_EVENT_ID = "EVT-TRANSFER-AUTHORIZATION-EXECUTED";
const CREATE_INVITED_MEMBERSHIP_ACTION_ID = "ACC-ACT-CREATE-INVITED-MEMBERSHIP-FROM-DIRECTORY";
const TRANSFER_ACTION_ID = "DGV-ACT-EXECUTE-STUDENT-TRANSFER";
const COMPLETE_ACTION_ID = "DGV-ACT-COMPLETE-STUDENT-TRANSFER";
const OLD_MEMBERSHIP_ACTION_ID = "ACC-ACT-TERMINATE-OLD-SCHOOL-MEMBERSHIP";
const LEGACY_PROFILE_ACTION_ID = "ORG-ACT-TRANSFER-STUDENT";
const OLD_AUTH_ACTION_ID = "IAM-ACT-TERMINATE-OLD-SCHOOL-STUDENT-DATA-AUTHORIZATION";
const OLD_GUARDIAN_AUTH_ACTION_ID = "IAM-ACT-REVOKE-OLD-SCHOOL-GUARDIAN-DELEGATIONS";
const CREATE_MEMBERSHIP_ACTION_ID = "ACC-ACT-CREATE-PENDING-NEW-SCHOOL-MEMBERSHIP";
const CREATE_AUTH_ACTION_ID = "IAM-ACT-CREATE-PENDING-NEW-SCHOOL-STUDENT-DATA-AUTHORIZATION";
const ACTIVATE_MEMBERSHIP_ACTION_ID = "ACC-ACT-ACTIVATE-NEW-SCHOOL-MEMBERSHIP";
const ACTIVATE_AUTH_ACTION_ID = "IAM-ACT-ACTIVATE-NEW-SCHOOL-STUDENT-DATA-AUTHORIZATION";
const HISTORY_ACTION_ID = "DGV-ACT-CREATE-OLD-SCHOOL-HISTORY-RESTRICTION";
const INVALIDATE_PERMISSION_ACTION_ID = "IAM-ACT-INVALIDATE-TRANSFERRED-STUDENT-PERMISSIONS";

const WEB_APP = [CLIENT.WEB, CLIENT.APP];
const SYSTEM_ALLOW = [{
  effect: "ALLOW",
  actorRef: "SYSTEM",
  condition: "the system resolves the exact transfer, student, school, membership, authorization, source-right, and object versions declared by DF-017",
}, {
  effect: "DENY",
  roleRef: "ROLE-SCHOOL-ADMIN",
  condition: "school roles cannot synthesize, widen, reorder, or directly execute a cross-school student transfer cutover",
}, {
  effect: "DENY",
  roleRef: "ROLE-PLATFORM-OPS",
  condition: "platform operations cannot override minor authorization, guardian dispute, source-right, or school-boundary checks",
}];

const DEFAULT_FAILURE_RESULTS = [
  "PERMISSION_DENIED",
  "VALIDATION_FAILED",
  "VERSION_CONFLICT",
  "AUDIT_FAILED",
];

function list(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return [...new Set(values)];
}

function requireOne(values, id, kind) {
  const matches = list(values).filter((value) => value?.id === id);
  if (matches.length !== 1) {
    throw new Error(`transfer lifecycle requires exactly one ${kind} ${id}`);
  }
  return matches[0];
}

function field(id, label, overrides = {}) {
  return {
    id,
    label,
    dataType: "STRING",
    required: true,
    valueSource: { kind: "USER_INPUT" },
    mutability: "EDITABLE",
    visibility: "AUTHORIZED_SCOPE",
    validation: "must match the exact student, school, object, and source version fixed by the transfer authorization",
    historyPolicy: "retain accepted values with transfer, actor, time, and source-version provenance",
    ...overrides,
  };
}

function systemField(id, label, dataType = "STRING", overrides = {}) {
  return field(id, label, {
    dataType,
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    ...overrides,
  });
}

function identityField(id, label) {
  return systemField(id, label, "ID", {
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_ID",
  });
}

function objectVersionField(id, label) {
  return systemField(id, label, "INTEGER", {
    idempotencyRole: "OBJECT_VERSION",
  });
}

function identityReference(id, label, targetObjectId, overrides = {}) {
  return field(id, label, {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId },
    referenceIntegrity: "IDENTITY_ONLY",
    mutability: "IMMUTABLE",
    ...overrides,
  });
}

function versionPinnedReference({
  id,
  label,
  targetObjectId,
  versionFieldId,
  targetVersionFieldId,
  required = false,
  mutability = "SYSTEM_MANAGED",
}) {
  return field(id, label, {
    dataType: "ID",
    required,
    valueSource: { kind: "OBJECT_REF", targetObjectId },
    referenceIntegrity: "VERSION_PINNED",
    stateGuardPolicy: "NONE",
    actionApplicability: { requiredActionIds: [] },
    versionBinding: { versionFieldId, targetVersionFieldId },
    mutability,
  });
}

function lineageBinding(refField) {
  return {
    refFieldId: refField.id,
    versionFieldId: refField.versionBinding.versionFieldId,
    targetObjectId: refField.valueSource.targetObjectId,
    targetVersionFieldId: refField.versionBinding.targetVersionFieldId,
  };
}

function appendFieldsAndLineage(object, additions) {
  const existingFieldIds = new Set(list(object.fields).map(({ id }) => id));
  const newFields = additions.filter(({ id }) => !existingFieldIds.has(id));
  object.fields.push(...newFields);
  const existingBindings = new Set(list(object.lineageBindings).map((binding) => (
    `${binding.refFieldId}:${binding.versionFieldId}:${binding.targetObjectId}:${binding.targetVersionFieldId}`
  )));
  const newBindings = newFields
    .filter(({ referenceIntegrity }) => referenceIntegrity === "VERSION_PINNED")
    .map(lineageBinding)
    .filter((binding) => !existingBindings.has(
      `${binding.refFieldId}:${binding.versionFieldId}:${binding.targetObjectId}:${binding.targetVersionFieldId}`,
    ));
  if (newBindings.length > 0) {
    object.lineageBindings = [...list(object.lineageBindings), ...newBindings];
  }
}

function scenario({
  id,
  actionId,
  trigger,
  kind,
  resultCode,
  label,
  expectedState,
  expectedData,
}) {
  return {
    id,
    kind,
    ...(resultCode ? { resultCode } : {}),
    actionId,
    trigger,
    given: kind === "SUCCESS"
      ? `all pinned authorization, relationship, school, source-right, and version checks pass for ${label}`
      : `${resultCode} applies while executing ${label}`,
    when: `the system executes ${label}`,
    then: {
      expectedData,
      expectedState: expectedState
        ? { mode: "STATE", value: expectedState }
        : { mode: "UNCHANGED" },
      expectedPermission: kind === "SUCCESS" ? "ALLOW" : "DENY",
      expectedVisibility: kind === "SUCCESS"
        ? "the exact transferring student and authorized old/new school scopes only"
        : "no old-school current access and no data outside the pinned transfer subset",
    },
  };
}

function actionFact({
  id,
  label,
  targetObjectId,
  operationKind,
  executionMode,
  trigger,
  inputFieldIds,
  outputFieldIds,
  transition,
  successState,
  successData,
  failureResults = [],
  idempotencyKey,
  overrides = {},
}) {
  const allFailureResults = unique([...DEFAULT_FAILURE_RESULTS, ...failureResults]);
  const successScenarioId = `${id}-SCN-SUCCESS`;
  const failureScenarioIds = allFailureResults.map((resultCode) => `${id}-SCN-${resultCode}`);
  return {
    action: {
      id,
      label,
      targetObjectId,
      inputFieldIds,
      outputFieldIds,
      ...(transition ? { transition } : {}),
      operationKind,
      writes: true,
      risk: "HIGH",
      executionMode,
      trigger,
      permissions: structuredClone(SYSTEM_ALLOW),
      scenarioIds: [successScenarioId, ...failureScenarioIds],
      idempotencyKey,
      auditMode: "REQUIRED",
      failureResults: allFailureResults,
      ...overrides,
    },
    scenarios: [
      scenario({
        id: successScenarioId,
        actionId: id,
        trigger,
        kind: "SUCCESS",
        label,
        expectedState: successState ?? transition?.to,
        expectedData: successData,
      }),
      ...allFailureResults.map((resultCode) => scenario({
        id: `${id}-SCN-${resultCode}`,
        actionId: id,
        trigger,
        kind: resultCode === "PERMISSION_DENIED" ? "BOUNDARY" : "FAILURE",
        resultCode,
        label,
        expectedData: `${resultCode} identifies the rejected transfer context and commits no wider or restored school access`,
      })),
    ],
  };
}

function flowTrigger() {
  return { kind: "FLOW", flowIds: [FLOW_ID] };
}

function eventTrigger(eventId) {
  return { kind: "EVENT", eventId };
}

function systemInputs(...fieldIds) {
  return fieldIds.map((fieldId) => ({
    fieldId,
    provider: { actorRef: "SYSTEM" },
  }));
}

function membershipFieldAdditions() {
  const platformIdentityRef = versionPinnedReference({
    id: "ACC-MEMBER-F-PLATFORM-IDENTITY-REF",
    label: "Pinned Platform Identity Reference",
    targetObjectId: "ACC-OBJ-PLATFORM-IDENTITY",
    versionFieldId: "ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION",
    targetVersionFieldId: "ACC-PIDENT-F-VERSION",
    mutability: "IMMUTABLE",
  });
  const schoolProfileRef = versionPinnedReference({
    id: "ACC-MEMBER-F-SCHOOL-PROFILE-REF",
    label: "Pinned School Profile Reference",
    targetObjectId: "ACC-OBJ-SCHOOL-PROFILE",
    versionFieldId: "ACC-MEMBER-F-SCHOOL-PROFILE-VERSION",
    targetVersionFieldId: "ACC-PROFILE-F-VERSION",
    mutability: "IMMUTABLE",
  });
  const transferRef = versionPinnedReference({
    id: "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF",
    label: "Pinned Transfer Authorization Reference",
    targetObjectId: "DGV-OBJ-TRANSFER-AUTHORIZATION",
    versionFieldId: "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION",
    targetVersionFieldId: "DGV-TRANSFER-F-VERSION",
  });
  const predecessorRef = versionPinnedReference({
    id: "ACC-MEMBER-F-PREDECESSOR-REF",
    label: "Pinned Predecessor Membership Reference",
    targetObjectId: "ACC-OBJ-MEMBERSHIP",
    versionFieldId: "ACC-MEMBER-F-PREDECESSOR-VERSION",
    targetVersionFieldId: "ACC-MEMBER-F-VERSION",
  });
  return [
    systemField("ACC-MEMBER-F-DIRECTORY-SNAPSHOT-ID", "Membership Directory Snapshot ID", "ID", { required: false, mutability: "IMMUTABLE" }),
    systemField("ACC-MEMBER-F-DIRECTORY-SNAPSHOT-VERSION", "Membership Directory Snapshot Version", "INTEGER", { required: false, mutability: "IMMUTABLE" }),
    platformIdentityRef,
    systemField("ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION", "Pinned Platform Identity Version", "INTEGER", { required: false, mutability: "IMMUTABLE" }),
    identityReference(
      "ACC-MEMBER-F-STUDENT-PROFILE-REF",
      "Student Profile Reference for Student Memberships",
      "ORG-OBJ-STUDENT",
      { required: false },
    ),
    schoolProfileRef,
    systemField("ACC-MEMBER-F-SCHOOL-PROFILE-VERSION", "Pinned School Profile Version", "INTEGER", { required: false, mutability: "IMMUTABLE" }),
    transferRef,
    systemField("ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION", "Pinned Transfer Authorization Version", "INTEGER", { required: false }),
    predecessorRef,
    systemField("ACC-MEMBER-F-PREDECESSOR-VERSION", "Pinned Predecessor Membership Version", "INTEGER", { required: false }),
    systemField("ACC-MEMBER-F-EFFECTIVE-AT", "Membership Effective At", "DATETIME", { required: false, mutability: "IMMUTABLE" }),
    systemField("ACC-MEMBER-F-TERMINATED-AT", "Membership Terminated At", "DATETIME", { required: false, mutability: "IMMUTABLE" }),
    systemField("ACC-MEMBER-F-JOINT-ACTIVATION-COMMIT-ID", "Joint Membership and Data Authorization Activation Commit ID", "ID", { required: false, mutability: "IMMUTABLE" }),
    objectVersionField("ACC-MEMBER-F-VERSION", "Membership Version"),
  ];
}

function schoolDataAuthorizationObject() {
  const membershipRef = versionPinnedReference({
    id: "IAM-SSDA-F-MEMBERSHIP-REF",
    label: "Pinned Student School Membership Reference",
    targetObjectId: "ACC-OBJ-MEMBERSHIP",
    versionFieldId: "IAM-SSDA-F-MEMBERSHIP-VERSION",
    targetVersionFieldId: "ACC-MEMBER-F-VERSION",
    required: true,
    mutability: "IMMUTABLE",
  });
  const sourceTransferRef = versionPinnedReference({
    id: "IAM-SSDA-F-SOURCE-TRANSFER-REF",
    label: "Pinned Source Transfer Authorization Reference",
    targetObjectId: "DGV-OBJ-TRANSFER-AUTHORIZATION",
    versionFieldId: "IAM-SSDA-F-SOURCE-TRANSFER-VERSION",
    targetVersionFieldId: "DGV-TRANSFER-F-VERSION",
    mutability: "IMMUTABLE",
  });
  const terminationTransferRef = versionPinnedReference({
    id: "IAM-SSDA-F-TERMINATION-TRANSFER-REF",
    label: "Pinned Termination Transfer Authorization Reference",
    targetObjectId: "DGV-OBJ-TRANSFER-AUTHORIZATION",
    versionFieldId: "IAM-SSDA-F-TERMINATION-TRANSFER-VERSION",
    targetVersionFieldId: "DGV-TRANSFER-F-VERSION",
  });
  return withStudentDataClassification({
    id: "IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION",
    label: "Student-to-school Data Authorization",
    dataSubject: "STUDENT_SCHOOL_DATA_AUTHORIZATION",
    controlSubject: "STUDENT",
    producerRef: "SYSTEM",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "ROLE-PLATFORM-GOVERNANCE",
    stewardRef: "ROLE-PLATFORM-GOVERNANCE",
    lifecyclePolicyId: "LIFE-009",
    sensitivityId: "S4",
    readMode: "AUTHORIZED",
    stateReachability: { mode: "ACTION_GRAPH", initialStateIds: [] },
    states: ["PENDING", "ACTIVE", "REVOKED"],
    fields: [
      identityField("IAM-SSDA-F-ID", "Student School Data Authorization ID"),
      identityReference(
        "IAM-SSDA-F-STUDENT-PROFILE-REF",
        "Authorized Student Profile Reference",
        "ORG-OBJ-STUDENT",
      ),
      field("IAM-SSDA-F-SCHOOL-ID", "Authorized School ID", {
        dataType: "ID",
        valueSource: { kind: "OPTION_SET", optionSetId: "OPT-COM-002" },
        mutability: "IMMUTABLE",
      }),
      membershipRef,
      systemField("IAM-SSDA-F-MEMBERSHIP-VERSION", "Pinned Membership Version", "INTEGER", { mutability: "IMMUTABLE" }),
      sourceTransferRef,
      systemField("IAM-SSDA-F-SOURCE-TRANSFER-VERSION", "Pinned Source Transfer Version", "INTEGER", { required: false, mutability: "IMMUTABLE" }),
      terminationTransferRef,
      systemField("IAM-SSDA-F-TERMINATION-TRANSFER-VERSION", "Pinned Termination Transfer Version", "INTEGER", { required: false }),
      systemField("IAM-SSDA-F-PERMITTED-SUBSET", "Authorized Migratable Learning Record Subset", "JSON", {
        mutability: "IMMUTABLE",
        validation: "must be a strict subset authorized by the student or legally valid guardian and must never represent the complete student database",
      }),
      systemField("IAM-SSDA-F-PERMITTED-SUBSET-DIGEST", "Authorized Subset Digest", "STRING", { mutability: "IMMUTABLE" }),
      systemField("IAM-SSDA-F-SOURCE-RIGHTS", "Source Rights and Material Exclusions", "JSON", {
        mutability: "IMMUTABLE",
        validation: "must exclude old-school private materials and every source that lacks transfer rights",
      }),
      systemField("IAM-SSDA-F-SOURCE-RIGHTS-DIGEST", "Source Rights Digest", "STRING", { mutability: "IMMUTABLE" }),
      systemField("IAM-SSDA-F-EFFECTIVE-AT", "Authorization Effective At", "DATETIME", { mutability: "IMMUTABLE" }),
      systemField("IAM-SSDA-F-JOINT-ACTIVATION-COMMIT-ID", "Joint Membership and Data Authorization Activation Commit ID", "ID", { required: false, mutability: "IMMUTABLE" }),
      systemField("IAM-SSDA-F-EXPIRY", "Authorization Expiry or Membership End", "DATETIME", { mutability: "IMMUTABLE" }),
      systemField("IAM-SSDA-F-REVOKED-AT", "Authorization Revoked At", "DATETIME", { required: false, mutability: "IMMUTABLE" }),
      systemField("IAM-SSDA-F-STATUS", "Student School Data Authorization Status"),
      objectVersionField("IAM-SSDA-F-VERSION", "Student School Data Authorization Version"),
    ],
    lineageBindings: [
      lineageBinding(membershipRef),
      lineageBinding(sourceTransferRef),
      lineageBinding(terminationTransferRef),
    ],
    transferSubsetContract: {
      subsetFieldId: "IAM-SSDA-F-PERMITTED-SUBSET",
      subsetDigestFieldId: "IAM-SSDA-F-PERMITTED-SUBSET-DIGEST",
      sourceRightsFieldId: "IAM-SSDA-F-SOURCE-RIGHTS",
      sourceRightsDigestFieldId: "IAM-SSDA-F-SOURCE-RIGHTS-DIGEST",
      fullDatabaseCopyAllowed: false,
      schoolPrivateMaterialMigrationAllowed: false,
      activeAuthorizationMustMatchActiveMembership: true,
      membershipAloneGrantsStudentDataAccess: false,
      authorizationAloneGrantsStudentDataAccess: false,
      permissionResolverRule: "MEMBERSHIP_AND_AUTHORIZATION_MUST_BOTH_BE_ACTIVE_WITH_SAME_TRANSFER_VERSION_JOINT_COMMIT_AND_EFFECTIVE_AT",
      jointEffectiveAtRequired: true,
      oldSchoolCurrentAccessAfterTermination: "DENY",
    },
  });
}

function transferFieldAdditions() {
  const oldMembershipRef = versionPinnedReference({
    id: "DGV-TRANSFER-F-OLD-MEMBERSHIP-REF",
    label: "Pinned Old-school Membership Reference",
    targetObjectId: "ACC-OBJ-MEMBERSHIP",
    versionFieldId: "DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION",
    targetVersionFieldId: "ACC-MEMBER-F-VERSION",
    mutability: "IMMUTABLE",
  });
  const oldAuthorizationRef = versionPinnedReference({
    id: "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF",
    label: "Pinned Old-school Student Data Authorization Reference",
    targetObjectId: "IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION",
    versionFieldId: "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION",
    targetVersionFieldId: "IAM-SSDA-F-VERSION",
    mutability: "IMMUTABLE",
  });
  const newMembershipRef = versionPinnedReference({
    id: "DGV-TRANSFER-F-NEW-MEMBERSHIP-REF",
    label: "Activated New-school Membership Reference",
    targetObjectId: "ACC-OBJ-MEMBERSHIP",
    versionFieldId: "DGV-TRANSFER-F-NEW-MEMBERSHIP-VERSION",
    targetVersionFieldId: "ACC-MEMBER-F-VERSION",
  });
  const newAuthorizationRef = versionPinnedReference({
    id: "DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-REF",
    label: "Activated New-school Student Data Authorization Reference",
    targetObjectId: "IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION",
    versionFieldId: "DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-VERSION",
    targetVersionFieldId: "IAM-SSDA-F-VERSION",
  });
  return [
    oldMembershipRef,
    systemField("DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION", "Pinned Old-school Membership Version", "INTEGER", { required: false, mutability: "IMMUTABLE" }),
    oldAuthorizationRef,
    systemField("DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION", "Pinned Old-school Data Authorization Version", "INTEGER", { required: false, mutability: "IMMUTABLE" }),
    systemField("DGV-TRANSFER-F-OLD-GUARDIAN-AUTHORIZATION-MANIFEST-DIGEST", "Old-school Guardian Delegation Manifest Digest", "STRING", { required: false, mutability: "IMMUTABLE" }),
    systemField("DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST", "Authorized Migratable Subset Digest", "STRING", { required: false, mutability: "IMMUTABLE" }),
    systemField("DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST", "Source Rights and Exclusion Digest", "STRING", { required: false, mutability: "IMMUTABLE" }),
    systemField("DGV-TRANSFER-F-CUTOVER-STARTED-AT", "Transfer Cutover Started At", "DATETIME", { required: false, mutability: "IMMUTABLE" }),
    newMembershipRef,
    systemField("DGV-TRANSFER-F-NEW-MEMBERSHIP-VERSION", "Activated New-school Membership Version", "INTEGER", { required: false }),
    newAuthorizationRef,
    systemField("DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-VERSION", "Activated New-school Data Authorization Version", "INTEGER", { required: false }),
    systemField("DGV-TRANSFER-F-JOINT-ACTIVATION-COMMIT-ID", "Joint Membership and Data Authorization Activation Commit ID", "ID", { required: false, mutability: "IMMUTABLE" }),
    systemField("DGV-TRANSFER-F-JOINT-ACTIVATION-EFFECTIVE-AT", "Joint Membership and Data Authorization Effective At", "DATETIME", { required: false, mutability: "IMMUTABLE" }),
    systemField("DGV-TRANSFER-F-CUTOVER-COMPLETED-AT", "Transfer Cutover Completed At", "DATETIME", { required: false, mutability: "IMMUTABLE" }),
  ];
}

function historyFieldAdditions() {
  const transferRef = versionPinnedReference({
    id: "DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-REF",
    label: "Pinned Completed Transfer Authorization Reference",
    targetObjectId: "DGV-OBJ-TRANSFER-AUTHORIZATION",
    versionFieldId: "DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-VERSION",
    targetVersionFieldId: "DGV-TRANSFER-F-VERSION",
    required: true,
    mutability: "IMMUTABLE",
  });
  const membershipRef = versionPinnedReference({
    id: "DGV-OLDHIST-F-OLD-MEMBERSHIP-REF",
    label: "Pinned Terminated Old-school Membership Reference",
    targetObjectId: "ACC-OBJ-MEMBERSHIP",
    versionFieldId: "DGV-OLDHIST-F-OLD-MEMBERSHIP-VERSION",
    targetVersionFieldId: "ACC-MEMBER-F-VERSION",
    required: true,
    mutability: "IMMUTABLE",
  });
  return [
    transferRef,
    systemField("DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-VERSION", "Pinned Completed Transfer Version", "INTEGER", { mutability: "IMMUTABLE" }),
    membershipRef,
    systemField("DGV-OLDHIST-F-OLD-MEMBERSHIP-VERSION", "Pinned Terminated Membership Version", "INTEGER", { mutability: "IMMUTABLE" }),
    systemField("DGV-OLDHIST-F-PERMITTED-PURPOSE-DIGEST", "Purpose, Role, Object, and Time Boundary Digest", "STRING", { mutability: "IMMUTABLE" }),
  ];
}

function addActionFacts(module, actionFacts) {
  module.actions.push(...actionFacts.map(({ action }) => action));
  module.scenarios.push(...actionFacts.flatMap(({ scenarios }) => scenarios));
}

function enhanceAccount(module) {
  const membership = requireOne(module.objects, "ACC-OBJ-MEMBERSHIP", "object");
  for (const state of ["PENDING", "TERMINATED"]) {
    if (!membership.states.includes(state)) membership.states.push(state);
  }
  appendFieldsAndLineage(membership, membershipFieldAdditions());
  membership.activeMembershipUniquenessContract = {
    platformIdentityFieldId: "ACC-MEMBER-F-PLATFORM-IDENTITY-REF",
    studentProfileFieldId: "ACC-MEMBER-F-STUDENT-PROFILE-REF",
    stateFieldId: "ACC-MEMBER-F-STATE",
    activeState: "ACTIVE",
    uniquenessScope: "ONE_ACTIVE_SCHOOL_MEMBERSHIP_PER_PLATFORM_IDENTITY",
    conflictEffect: "FAIL_CLOSED_WITHOUT_TERMINATING_THE_CURRENT_MEMBERSHIP",
  };
  membership.jointTransferActivationContract = {
    authorizationObjectId: "IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION",
    membershipStateFieldId: "ACC-MEMBER-F-STATE",
    membershipVersionFieldId: "ACC-MEMBER-F-VERSION",
    transferRefFieldId: "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF",
    transferVersionFieldId: "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION",
    jointCommitFieldId: "ACC-MEMBER-F-JOINT-ACTIVATION-COMMIT-ID",
    effectiveAtFieldId: "ACC-MEMBER-F-EFFECTIVE-AT",
    membershipAloneGrantsStudentDataAccess: false,
    authorizationAloneGrantsStudentDataAccess: false,
    sameEffectiveAtRequired: true,
    permissionResolverRule: "BOTH_ACTIVE_SAME_TRANSFER_VERSION_JOINT_COMMIT_AND_EFFECTIVE_AT",
  };
  membership.stateReachability = { mode: "ACTION_GRAPH", initialStateIds: [] };

  for (const actionId of [
    "ACC-ACT-LOGIN",
    "ACC-ACT-FIRST-ACTIVATION",
    "ACC-ACT-SUSPEND-MEMBERSHIP",
    "ACC-ACT-DEACTIVATE-MEMBERSHIP",
  ]) {
    const membershipAction = requireOne(module.actions, actionId, "action");
    membershipAction.outputFieldIds = unique([...membershipAction.outputFieldIds, "ACC-MEMBER-F-VERSION"]);
  }

  const createInvited = actionFact({
    id: CREATE_INVITED_MEMBERSHIP_ACTION_ID,
    label: "Create an Invited Membership from the Authoritative Directory Snapshot",
    targetObjectId: membership.id,
    operationKind: "CREATE",
    executionMode: "SYSTEM_EVENT",
    trigger: eventTrigger(MEMBERSHIP_SOURCE_EVENT_ID),
    inputFieldIds: [
      "ACC-MEMBER-F-ACCOUNT-ID-TYPE",
      "ACC-MEMBER-F-ACCOUNT-ID",
      "ACC-MEMBER-F-SCHOOL-ID",
      "ACC-MEMBER-F-ACTIVATION",
      "ACC-MEMBER-F-PLATFORM-IDENTITY-REF",
      "ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION",
      "ACC-MEMBER-F-STUDENT-PROFILE-REF",
      "ACC-MEMBER-F-SCHOOL-PROFILE-REF",
      "ACC-MEMBER-F-SCHOOL-PROFILE-VERSION",
      "ACC-MEMBER-F-DIRECTORY-SNAPSHOT-ID",
      "ACC-MEMBER-F-DIRECTORY-SNAPSHOT-VERSION",
    ],
    outputFieldIds: [
      "ACC-MEMBER-F-ID",
      "ACC-MEMBER-F-STATE",
      "ACC-MEMBER-F-VERSION",
      "ACC-MEMBER-F-DIRECTORY-SNAPSHOT-ID",
      "ACC-MEMBER-F-DIRECTORY-SNAPSHOT-VERSION",
    ],
    successState: "INVITED",
    successData: "the authoritative membership directory snapshot creates one INVITED school membership without granting an active session",
    failureResults: ["DIRECTORY_SNAPSHOT_STALE", "DUPLICATE_MEMBERSHIP", "STUDENT_OR_SCHOOL_MISMATCH"],
    idempotencyKey: `${CREATE_INVITED_MEMBERSHIP_ACTION_ID}:directory-snapshot-id:directory-snapshot-version:account-id:school-id`,
    overrides: {
      authoritativeMembershipProvisioningContract: {
        authoritativeMembershipObjectId: "ACC-OBJ-MEMBERSHIP",
        sourceEventId: MEMBERSHIP_SOURCE_EVENT_ID,
        createdState: "INVITED",
        activeAccessBeforeActivation: false,
        duplicateEffect: "RETURN_EXISTING_MEMBERSHIP",
        staleSnapshotEffect: "FAIL_CLOSED",
      },
    },
  });
  const terminate = actionFact({
    id: OLD_MEMBERSHIP_ACTION_ID,
    label: "Terminate the Pinned Old-school Membership",
    targetObjectId: membership.id,
    operationKind: "UPDATE",
    executionMode: "SYSTEM_EVENT",
    trigger: eventTrigger(START_EVENT_ID),
    inputFieldIds: [
      "ACC-MEMBER-F-ID",
      "ACC-MEMBER-F-PLATFORM-IDENTITY-REF",
      "ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION",
      "ACC-MEMBER-F-STUDENT-PROFILE-REF",
      "ACC-MEMBER-F-SCHOOL-PROFILE-REF",
      "ACC-MEMBER-F-SCHOOL-PROFILE-VERSION",
      "ACC-MEMBER-F-SCHOOL-ID",
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF",
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION",
    ],
    outputFieldIds: [
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF",
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION",
      "ACC-MEMBER-F-TERMINATED-AT",
      "ACC-MEMBER-F-STATE",
      "ACC-MEMBER-F-VERSION",
    ],
    transition: { from: "ACTIVE", to: "TERMINATED" },
    successData: "the exact old-school membership becomes TERMINATED before any new-school current access becomes active",
    failureResults: ["OLD_MEMBERSHIP_NOT_ACTIVE", "STUDENT_OR_SCHOOL_MISMATCH", "TRANSFER_VERSION_MISMATCH"],
    idempotencyKey: `${OLD_MEMBERSHIP_ACTION_ID}:transfer-id:transfer-version:old-membership-id:old-membership-version`,
    overrides: {
      transferMembershipTerminationContract: {
        authoritativeMembershipObjectId: "ACC-OBJ-MEMBERSHIP",
        requiredSourceState: "ACTIVE",
        requiredTargetState: "TERMINATED",
        exactStudentMatch: true,
        exactOldSchoolMatch: true,
        exactTransferVersionRequired: true,
        duplicateEffect: "RETURN_EXISTING_TERMINATED_MEMBERSHIP",
        conflictEffect: "FAIL_CLOSED",
      },
    },
  });
  const create = actionFact({
    id: CREATE_MEMBERSHIP_ACTION_ID,
    label: "Create a Pending New-school Membership",
    targetObjectId: membership.id,
    operationKind: "CREATE",
    executionMode: "FLOW_INTERNAL",
    trigger: flowTrigger(),
    inputFieldIds: [
      "ACC-MEMBER-F-ACCOUNT-ID-TYPE",
      "ACC-MEMBER-F-ACCOUNT-ID",
      "ACC-MEMBER-F-SCHOOL-ID",
      "ACC-MEMBER-F-ACTIVATION",
      "ACC-MEMBER-F-PLATFORM-IDENTITY-REF",
      "ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION",
      "ACC-MEMBER-F-STUDENT-PROFILE-REF",
      "ACC-MEMBER-F-SCHOOL-PROFILE-REF",
      "ACC-MEMBER-F-SCHOOL-PROFILE-VERSION",
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF",
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION",
      "ACC-MEMBER-F-PREDECESSOR-REF",
      "ACC-MEMBER-F-PREDECESSOR-VERSION",
      "ACC-MEMBER-F-EFFECTIVE-AT",
    ],
    outputFieldIds: [
      "ACC-MEMBER-F-ID",
      "ACC-MEMBER-F-STATE",
      "ACC-MEMBER-F-VERSION",
    ],
    successState: "PENDING",
    successData: "one non-readable PENDING membership is created for the exact new school and terminated predecessor",
    failureResults: ["ACTIVE_MEMBERSHIP_CONFLICT", "PREDECESSOR_NOT_TERMINATED", "NEW_SCHOOL_MISMATCH"],
    idempotencyKey: `${CREATE_MEMBERSHIP_ACTION_ID}:transfer-id:transfer-version:student-id:new-school-id`,
    overrides: {
      newSchoolMembershipContract: {
        authoritativeMembershipObjectId: "ACC-OBJ-MEMBERSHIP",
        requiredPredecessorState: "TERMINATED",
        createdState: "PENDING",
        readableBeforeActivation: false,
        grantsStudentDataAccessBeforeJointActivation: false,
        oneActiveMembershipInvariant: true,
      },
    },
  });
  const activate = actionFact({
    id: ACTIVATE_MEMBERSHIP_ACTION_ID,
    label: "Activate the Pending New-school Membership",
    targetObjectId: membership.id,
    operationKind: "UPDATE",
    executionMode: "FLOW_INTERNAL",
    trigger: flowTrigger(),
    inputFieldIds: [
      "ACC-MEMBER-F-ID",
      "ACC-MEMBER-F-PLATFORM-IDENTITY-REF",
      "ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION",
      "ACC-MEMBER-F-STUDENT-PROFILE-REF",
      "ACC-MEMBER-F-SCHOOL-PROFILE-REF",
      "ACC-MEMBER-F-SCHOOL-PROFILE-VERSION",
      "ACC-MEMBER-F-SCHOOL-ID",
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF",
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION",
      "ACC-MEMBER-F-PREDECESSOR-REF",
      "ACC-MEMBER-F-PREDECESSOR-VERSION",
      "ACC-MEMBER-F-JOINT-ACTIVATION-COMMIT-ID",
    ],
    outputFieldIds: [
      "ACC-MEMBER-F-STATE",
      "ACC-MEMBER-F-VERSION",
      "ACC-MEMBER-F-EFFECTIVE-AT",
      "ACC-MEMBER-F-JOINT-ACTIVATION-COMMIT-ID",
    ],
    transition: { from: "PENDING", to: "ACTIVE" },
    successData: "the new-school membership becomes the student's only ACTIVE school membership",
    failureResults: ["PREDECESSOR_NOT_TERMINATED", "ACTIVE_MEMBERSHIP_CONFLICT", "TRANSFER_VERSION_MISMATCH"],
    idempotencyKey: `${ACTIVATE_MEMBERSHIP_ACTION_ID}:transfer-id:transfer-version:new-membership-id:new-membership-version`,
    overrides: {
      jointActivationCommit: {
        authorizationActionId: ACTIVATE_AUTH_ACTION_ID,
        sharedCommitFieldId: "ACC-MEMBER-F-JOINT-ACTIVATION-COMMIT-ID",
        sharedEffectiveAtFieldId: "ACC-MEMBER-F-EFFECTIVE-AT",
        membershipAloneGrantsStudentDataAccess: false,
        permissionResolverRule: "BOTH_ACTIVE_SAME_TRANSFER_VERSION_JOINT_COMMIT_AND_EFFECTIVE_AT",
        partialFailureEffect: "NO_STUDENT_DATA_ACCESS_AND_FORWARD_RECONCILIATION",
      },
    },
  });
  addActionFacts(module, [createInvited, terminate, create, activate]);

  module.pages.push({
    id: "ACC-PAGE-STUDENT-TRANSFER-MEMBERSHIP",
    label: "Authoritative Student Transfer Membership Lifecycle",
    clients: WEB_APP,
    objectIds: [membership.id],
    fieldIds: [
      "ACC-MEMBER-F-ID",
      "ACC-MEMBER-F-PLATFORM-IDENTITY-REF",
      "ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION",
      "ACC-MEMBER-F-STUDENT-PROFILE-REF",
      "ACC-MEMBER-F-SCHOOL-PROFILE-REF",
      "ACC-MEMBER-F-SCHOOL-PROFILE-VERSION",
      "ACC-MEMBER-F-SCHOOL-ID",
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF",
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION",
      "ACC-MEMBER-F-PREDECESSOR-REF",
      "ACC-MEMBER-F-PREDECESSOR-VERSION",
      "ACC-MEMBER-F-EFFECTIVE-AT",
      "ACC-MEMBER-F-TERMINATED-AT",
      "ACC-MEMBER-F-JOINT-ACTIVATION-COMMIT-ID",
      "ACC-MEMBER-F-DIRECTORY-SNAPSHOT-ID",
      "ACC-MEMBER-F-DIRECTORY-SNAPSHOT-VERSION",
      "ACC-MEMBER-F-STATE",
      "ACC-MEMBER-F-VERSION",
    ],
    actionIds: [],
    regions: ["CONTEXT_HEADER", "TASK_WORK_AREA", "RESULT_AND_FAILURE_STATUS"],
    viewStates: ["LOADING", "READY", "EMPTY", "ERROR", "FORBIDDEN", "STALE_VERSION"],
  });
  module.authoritativeTransferMembershipContract = {
    objectId: membership.id,
    duplicateMembershipObjectAllowed: false,
    loginContextSource: "ACC-OBJ-MEMBERSHIP",
    permissionRelationshipSource: "ACC-OBJ-MEMBERSHIP",
    invitedEntrySourceActionId: CREATE_INVITED_MEMBERSHIP_ACTION_ID,
    invitedEntrySourceEventId: MEMBERSHIP_SOURCE_EVENT_ID,
  };
  return module;
}

function enhanceOrganization(module) {
  const studentProfile = requireOne(module.objects, "ORG-OBJ-STUDENT", "object");
  appendFieldsAndLineage(studentProfile, [
    objectVersionField("ORG-STUDENT-F-VERSION", "Student School-profile Projection Version"),
  ]);
  for (const actionId of [
    "ORG-ACT-CREATE-STUDENT",
    "ORG-ACT-UPDATE-STUDENT",
    LEGACY_PROFILE_ACTION_ID,
    "ORG-ACT-DEACTIVATE-MEMBER",
  ]) {
    const studentAction = requireOne(module.actions, actionId, "action");
    studentAction.outputFieldIds = unique([...studentAction.outputFieldIds, "ORG-STUDENT-F-VERSION"]);
  }

  const legacy = requireOne(module.actions, LEGACY_PROFILE_ACTION_ID, "action");
  legacy.label = "Mark the Old-school Student Profile Transferred after Membership Termination";
  legacy.executionMode = "FLOW_INTERNAL";
  legacy.trigger = flowTrigger();
  delete legacy.clients;
  legacy.permissions = structuredClone(SYSTEM_ALLOW);
  legacy.failureResults = unique([...legacy.failureResults, "TRANSFER_AUTHORIZATION_REQUIRED"]);
  legacy.legacyTransferBypassContract = {
    directSchoolExecutionAllowed: false,
    requiredFlowId: FLOW_ID,
    requiredMembershipTerminationActionId: OLD_MEMBERSHIP_ACTION_ID,
    profileProjectionOnly: true,
  };
  const missingFailureScenarioId = `${LEGACY_PROFILE_ACTION_ID}-SCN-TRANSFER_AUTHORIZATION_REQUIRED`;
  if (!legacy.scenarioIds.includes(missingFailureScenarioId)) {
    legacy.scenarioIds.push(missingFailureScenarioId);
    module.scenarios.push(scenario({
      id: missingFailureScenarioId,
      actionId: LEGACY_PROFILE_ACTION_ID,
      trigger: flowTrigger(),
      kind: "BOUNDARY",
      resultCode: "TRANSFER_AUTHORIZATION_REQUIRED",
      label: legacy.label,
      expectedData: "the old-school profile remains unchanged when DF-017 and its pinned high-impact authorization are absent",
    }));
  }
  for (const legacyScenario of module.scenarios.filter(({ actionId }) => actionId === LEGACY_PROFILE_ACTION_ID)) {
    delete legacyScenario.pageId;
    legacyScenario.trigger = flowTrigger();
  }
  const membersPage = requireOne(module.pages, "ORG-PAGE-MEMBERS", "page");
  membersPage.actionIds = membersPage.actionIds.filter((actionId) => actionId !== LEGACY_PROFILE_ACTION_ID);
  return module;
}

function enhanceIdentityAccess(module) {
  const authorization = schoolDataAuthorizationObject();
  module.objects.push(authorization);

  const terminate = actionFact({
    id: OLD_AUTH_ACTION_ID,
    label: "Terminate the Pinned Old-school Student Data Authorization",
    targetObjectId: authorization.id,
    operationKind: "UPDATE",
    executionMode: "FLOW_INTERNAL",
    trigger: flowTrigger(),
    inputFieldIds: [
      "IAM-SSDA-F-ID",
      "IAM-SSDA-F-STUDENT-PROFILE-REF",
      "IAM-SSDA-F-SCHOOL-ID",
      "IAM-SSDA-F-MEMBERSHIP-REF",
      "IAM-SSDA-F-MEMBERSHIP-VERSION",
      "IAM-SSDA-F-TERMINATION-TRANSFER-REF",
      "IAM-SSDA-F-TERMINATION-TRANSFER-VERSION",
    ],
    outputFieldIds: [
      "IAM-SSDA-F-TERMINATION-TRANSFER-REF",
      "IAM-SSDA-F-TERMINATION-TRANSFER-VERSION",
      "IAM-SSDA-F-REVOKED-AT",
      "IAM-SSDA-F-STATUS",
      "IAM-SSDA-F-VERSION",
    ],
    transition: { from: "ACTIVE", to: "REVOKED" },
    successData: "the old school loses every current student-data authorization before any new-school authorization becomes active",
    failureResults: ["OLD_AUTHORIZATION_NOT_ACTIVE", "STUDENT_OR_SCHOOL_MISMATCH", "MEMBERSHIP_VERSION_MISMATCH"],
    idempotencyKey: `${OLD_AUTH_ACTION_ID}:transfer-id:transfer-version:old-authorization-id:old-authorization-version`,
    overrides: {
      oldSchoolAuthorizationTerminationContract: {
        requiredMembershipState: "TERMINATED",
        requiredSourceState: "ACTIVE",
        requiredTargetState: "REVOKED",
        oldSchoolCurrentAccessAfterSuccess: "DENY",
        exactStudentSchoolAndVersionMatch: true,
      },
    },
  });
  const revokeGuardian = actionFact({
    id: OLD_GUARDIAN_AUTH_ACTION_ID,
    label: "Revoke Old-school Guardian Delegations without Ending Personal Guardian Relations",
    targetObjectId: "IAM-OBJ-SCHOOL-DATA-AUTHORIZATION",
    operationKind: "UPDATE",
    executionMode: "FLOW_INTERNAL",
    trigger: flowTrigger(),
    inputFieldIds: [
      "IAM-SDAUTH-F-ID",
      "IAM-SDAUTH-F-STUDENT-PROFILE-ID",
      "IAM-SDAUTH-F-SCHOOL-ID",
    ],
    outputFieldIds: ["IAM-SDAUTH-F-STATUS", "IAM-SDAUTH-F-VERSION"],
    transition: { from: "ACTIVE", to: "REVOKED" },
    successData: "every old-school guardian task delegation is revoked while the confirmed personal guardian relation remains unchanged",
    failureResults: ["GUARDIAN_DELEGATION_SCOPE_MISMATCH", "PERSONAL_GUARDIAN_RELATION_MUTATION_ATTEMPT"],
    idempotencyKey: `${OLD_GUARDIAN_AUTH_ACTION_ID}:transfer-id:transfer-version:guardian-delegation-manifest-digest`,
    overrides: {
      guardianRelationContinuityContract: {
        schoolAuthorizationEffect: "REVOKE_MATCHING_OLD_SCHOOL_AUTHORIZATIONS",
        personalGuardianRelationEffect: "UNCHANGED",
        zeroMatchingDelegationsEffect: "SUCCESS_WITH_EMPTY_MANIFEST",
        manifestDigestRequired: true,
      },
    },
  });
  const create = actionFact({
    id: CREATE_AUTH_ACTION_ID,
    label: "Create a Pending New-school Student Data Authorization Subset",
    targetObjectId: authorization.id,
    operationKind: "CREATE",
    executionMode: "FLOW_INTERNAL",
    trigger: flowTrigger(),
    inputFieldIds: [
      "IAM-SSDA-F-STUDENT-PROFILE-REF",
      "IAM-SSDA-F-SCHOOL-ID",
      "IAM-SSDA-F-MEMBERSHIP-REF",
      "IAM-SSDA-F-MEMBERSHIP-VERSION",
      "IAM-SSDA-F-SOURCE-TRANSFER-REF",
      "IAM-SSDA-F-SOURCE-TRANSFER-VERSION",
      "IAM-SSDA-F-PERMITTED-SUBSET",
      "IAM-SSDA-F-PERMITTED-SUBSET-DIGEST",
      "IAM-SSDA-F-SOURCE-RIGHTS",
      "IAM-SSDA-F-SOURCE-RIGHTS-DIGEST",
      "IAM-SSDA-F-EFFECTIVE-AT",
      "IAM-SSDA-F-EXPIRY",
    ],
    outputFieldIds: ["IAM-SSDA-F-ID", "IAM-SSDA-F-STATUS", "IAM-SSDA-F-VERSION"],
    successState: "PENDING",
    successData: "one PENDING authorization stores only the exact migratable subset and source-right exclusions pinned by the transfer",
    failureResults: ["SUBSET_NOT_AUTHORIZED", "SOURCE_RIGHTS_MISMATCH", "FULL_DATABASE_SCOPE_REJECTED", "NEW_SCHOOL_MISMATCH"],
    idempotencyKey: `${CREATE_AUTH_ACTION_ID}:transfer-id:transfer-version:student-id:new-school-id:subset-digest`,
    overrides: {
      newSchoolSubsetCreationContract: {
        requiredMembershipState: "PENDING",
        createdState: "PENDING",
        readableBeforeActivation: false,
        grantsStudentDataAccessBeforeJointActivation: false,
        exactSubsetDigestRequired: true,
        exactSourceRightsDigestRequired: true,
        fullDatabaseCopyAllowed: false,
      },
    },
  });
  const activate = actionFact({
    id: ACTIVATE_AUTH_ACTION_ID,
    label: "Activate the New-school Student Data Authorization Subset",
    targetObjectId: authorization.id,
    operationKind: "UPDATE",
    executionMode: "FLOW_INTERNAL",
    trigger: flowTrigger(),
    inputFieldIds: [
      "IAM-SSDA-F-ID",
      "IAM-SSDA-F-STUDENT-PROFILE-REF",
      "IAM-SSDA-F-SCHOOL-ID",
      "IAM-SSDA-F-MEMBERSHIP-REF",
      "IAM-SSDA-F-MEMBERSHIP-VERSION",
      "IAM-SSDA-F-SOURCE-TRANSFER-REF",
      "IAM-SSDA-F-SOURCE-TRANSFER-VERSION",
      "IAM-SSDA-F-PERMITTED-SUBSET-DIGEST",
      "IAM-SSDA-F-SOURCE-RIGHTS-DIGEST",
      "IAM-SSDA-F-JOINT-ACTIVATION-COMMIT-ID",
    ],
    outputFieldIds: [
      "IAM-SSDA-F-STATUS",
      "IAM-SSDA-F-VERSION",
      "IAM-SSDA-F-EFFECTIVE-AT",
      "IAM-SSDA-F-JOINT-ACTIVATION-COMMIT-ID",
    ],
    transition: { from: "PENDING", to: "ACTIVE" },
    successData: "the new school receives current access only to the exact authorized subset after its matching membership becomes ACTIVE",
    failureResults: ["NEW_MEMBERSHIP_NOT_ACTIVE", "SUBSET_DIGEST_MISMATCH", "SOURCE_RIGHTS_MISMATCH", "OLD_ACCESS_STILL_ACTIVE"],
    idempotencyKey: `${ACTIVATE_AUTH_ACTION_ID}:transfer-id:transfer-version:new-authorization-id:new-authorization-version`,
    overrides: {
      newSchoolSubsetActivationContract: {
        requiredMembershipState: "ACTIVE",
        requiredOldMembershipState: "TERMINATED",
        requiredOldAuthorizationState: "REVOKED",
        activeScopeEqualsPinnedSubset: true,
        membershipAndAuthorizationSameTransferVersionRequired: true,
        sameJointActivationCommitRequired: true,
        sameEffectiveAtRequired: true,
        authorizationAloneGrantsStudentDataAccess: false,
        permissionResolverRule: "BOTH_ACTIVE_SAME_TRANSFER_VERSION_JOINT_COMMIT_AND_EFFECTIVE_AT",
        partialFailureEffect: "NO_STUDENT_DATA_ACCESS_AND_FORWARD_RECONCILIATION",
        anyWiderScopeEffect: "FAIL_CLOSED",
      },
    },
  });
  const invalidate = actionFact({
    id: INVALIDATE_PERMISSION_ACTION_ID,
    label: "Invalidate Permission Decisions after Student Transfer Cutover",
    targetObjectId: "IAM-OBJ-PERMISSION-DECISION",
    operationKind: "UPDATE",
    executionMode: "SYSTEM_EVENT",
    trigger: eventTrigger(COMPLETED_EVENT_ID),
    inputFieldIds: ["IAM-DECISION-F-ID", "IAM-DECISION-F-SOURCE-VERSIONS"],
    outputFieldIds: [
      "IAM-DECISION-F-RESULT",
      "IAM-DECISION-F-REASON",
      "IAM-DECISION-F-SOURCE-VERSIONS",
      "IAM-DECISION-F-DECISION-VERSION",
    ],
    transition: { from: ["ALLOW", "DENY"], to: "STALE" },
    successData: "old-school contexts, caches, searches, exports, and authorization decisions are invalidated and must reauthorize from current relationships",
    failureResults: ["TRANSFER_CONTEXT_MISMATCH", "PERMISSION_INVALIDATION_INCOMPLETE"],
    idempotencyKey: `${INVALIDATE_PERMISSION_ACTION_ID}:transfer-id:transfer-version:permission-decision-id:permission-decision-version`,
  });
  addActionFacts(module, [terminate, revokeGuardian, create, activate, invalidate]);
  const evaluatePermission = requireOne(module.actions, "IAM-ACT-EVALUATE-PERMISSION", "action");
  evaluatePermission.studentTransferJointActivationGuard = {
    membershipObjectId: "ACC-OBJ-MEMBERSHIP",
    membershipStateFieldId: "ACC-MEMBER-F-STATE",
    membershipVersionFieldId: "ACC-MEMBER-F-VERSION",
    authorizationObjectId: authorization.id,
    authorizationStateFieldId: "IAM-SSDA-F-STATUS",
    authorizationVersionFieldId: "IAM-SSDA-F-VERSION",
    transferRefFieldIds: [
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF",
      "IAM-SSDA-F-SOURCE-TRANSFER-REF",
    ],
    transferVersionFieldIds: [
      "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION",
      "IAM-SSDA-F-SOURCE-TRANSFER-VERSION",
    ],
    jointCommitFieldIds: [
      "ACC-MEMBER-F-JOINT-ACTIVATION-COMMIT-ID",
      "IAM-SSDA-F-JOINT-ACTIVATION-COMMIT-ID",
    ],
    effectiveAtFieldIds: [
      "ACC-MEMBER-F-EFFECTIVE-AT",
      "IAM-SSDA-F-EFFECTIVE-AT",
    ],
    requiredStates: ["ACTIVE", "ACTIVE"],
    sameTransferVersionRequired: true,
    sameJointActivationCommitRequired: true,
    sameEffectiveAtRequired: true,
    mismatchEffect: "DENY",
  };
  module.pages.push({
    id: "IAM-PAGE-STUDENT-SCHOOL-DATA-AUTHORIZATION",
    label: "Student School Data Authorization and Transfer Subset",
    clients: WEB_APP,
    objectIds: [authorization.id],
    fieldIds: authorization.fields.map(({ id }) => id),
    actionIds: [],
    regions: ["CONTEXT_HEADER", "TASK_WORK_AREA", "RESULT_AND_FAILURE_STATUS"],
    viewStates: ["LOADING", "READY", "EMPTY", "ERROR", "FORBIDDEN", "STALE_VERSION"],
  });
  return module;
}

function addFlowFailureScenario(module, action, resultCode, expectedData) {
  const scenarioId = `${action.id}-SCN-${resultCode}`;
  action.failureResults = unique([...action.failureResults, resultCode]);
  if (!action.scenarioIds.includes(scenarioId)) action.scenarioIds.push(scenarioId);
  if (!module.scenarios.some(({ id }) => id === scenarioId)) {
    module.scenarios.push(scenario({
      id: scenarioId,
      actionId: action.id,
      trigger: flowTrigger(),
      kind: "FAILURE",
      resultCode,
      label: action.label,
      expectedData,
    }));
  }
}

function enhanceDataGovernance(module) {
  const transfer = requireOne(module.objects, "DGV-OBJ-TRANSFER-AUTHORIZATION", "object");
  const history = requireOne(module.objects, "DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY", "object");
  if (!transfer.states.includes("CUTOVER_PENDING")) transfer.states.push("CUTOVER_PENDING");
  appendFieldsAndLineage(transfer, transferFieldAdditions());
  appendFieldsAndLineage(history, historyFieldAdditions());

  const request = requireOne(module.actions, "DGV-ACT-REQUEST-STUDENT-TRANSFER", "action");
  request.outputFieldIds = unique([...request.outputFieldIds,
    "DGV-TRANSFER-F-OLD-MEMBERSHIP-REF",
    "DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION",
    "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF",
    "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION",
    "DGV-TRANSFER-F-OLD-GUARDIAN-AUTHORIZATION-MANIFEST-DIGEST",
    "DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST",
    "DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST",
  ]);
  request.transferRequestSnapshotContract = {
    currentMembershipResolver: "EXACTLY_ONE_ACTIVE_MEMBERSHIP_FOR_STUDENT_AND_FROM_SCHOOL",
    currentSchoolAuthorizationResolver: "EXACTLY_ONE_ACTIVE_STUDENT_SCHOOL_DATA_AUTHORIZATION",
    guardianDelegationResolver: "ZERO_MANY_MATCHING_OLD_SCHOOL_DELEGATIONS_WITH_FIXED_MANIFEST_DIGEST",
    subsetDigestSource: "SYSTEM_CANONICALIZATION_OF_PERMITTED_SUBSET",
    sourceRightsDigestSource: "SYSTEM_CANONICALIZATION_OF_SOURCE_RIGHTS_AND_EXCLUSIONS",
    missingOrAmbiguousSourceEffect: "FAIL_CLOSED",
  };

  const authorize = requireOne(module.actions, "DGV-ACT-AUTHORIZE-STUDENT-TRANSFER", "action");
  authorize.inputFieldIds = unique([...authorize.inputFieldIds,
    "DGV-TRANSFER-F-OLD-MEMBERSHIP-REF",
    "DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION",
    "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF",
    "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION",
    "DGV-TRANSFER-F-OLD-GUARDIAN-AUTHORIZATION-MANIFEST-DIGEST",
    "DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST",
    "DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST",
  ]);
  authorize.transferAuthorizationSubsetContract = {
    exactCurrentMembershipVersionRequired: true,
    exactCurrentSchoolAuthorizationVersionRequired: true,
    exactGuardianDelegationManifestDigestRequired: true,
    exactPermittedSubsetDigestRequired: true,
    exactSourceRightsDigestRequired: true,
    fullDatabaseCopyAllowed: false,
  };

  const execute = requireOne(module.actions, TRANSFER_ACTION_ID, "action");
  execute.transition = { from: "AUTHORIZED", to: "CUTOVER_PENDING" };
  execute.inputFieldIds = unique([...execute.inputFieldIds,
    "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION",
    "DGV-TRANSFER-F-OLD-MEMBERSHIP-REF",
    "DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION",
    "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF",
    "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION",
    "DGV-TRANSFER-F-OLD-GUARDIAN-AUTHORIZATION-MANIFEST-DIGEST",
    "DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST",
    "DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST",
  ]);
  execute.outputFieldIds = unique([...execute.outputFieldIds, "DGV-TRANSFER-F-CUTOVER-STARTED-AT"]);
  execute.producedEventIds = [START_EVENT_ID];
  execute.transferCutoverStartContract = {
    requiredAuthorizationState: "AUTHORIZED",
    resultingState: "CUTOVER_PENDING",
    completionStateBeforeCrossDomainWrites: "FORBIDDEN",
    exactHighImpactAuthorizationVersionRequired: true,
    exactOldMembershipVersionRequired: true,
    exactOldSchoolAuthorizationVersionRequired: true,
    oldGuardianDelegationManifestDigestRequired: true,
    exactSubsetAndSourceRightsDigestsRequired: true,
    duplicateStartEffect: "IDEMPOTENT_RESUME_FROM_PINNED_VERSIONS",
    conflictingStartEffect: "FAIL_CLOSED",
  };
  for (const resultCode of [
    "OLD_MEMBERSHIP_VERSION_MISMATCH",
    "OLD_SCHOOL_AUTHORIZATION_VERSION_MISMATCH",
    "TRANSFER_SUBSET_DIGEST_MISMATCH",
    "TRANSFER_CUTOVER_ALREADY_STARTED",
  ]) {
    const scenarioId = `${TRANSFER_ACTION_ID}-SCN-${resultCode}`;
    execute.failureResults = unique([...execute.failureResults, resultCode]);
    if (!execute.scenarioIds.includes(scenarioId)) execute.scenarioIds.push(scenarioId);
    if (!module.scenarios.some(({ id }) => id === scenarioId)) {
      const pageId = module.pages.find(({ actionIds }) => actionIds.includes(TRANSFER_ACTION_ID))?.id;
      module.scenarios.push({
        ...scenario({
          id: scenarioId,
          actionId: TRANSFER_ACTION_ID,
          trigger: eventTrigger(START_EVENT_ID),
          kind: "FAILURE",
          resultCode,
          label: execute.label,
          expectedData: `${resultCode} leaves the transfer outside EXECUTED and creates no wider school access`,
        }),
        pageId,
      });
      delete module.scenarios.at(-1).trigger;
    }
  }
  const executeSuccess = module.scenarios.find(({ id }) => id === `${TRANSFER_ACTION_ID}-SCN-SUCCESS`);
  if (executeSuccess) {
    executeSuccess.then.expectedState = { mode: "STATE", value: "CUTOVER_PENDING" };
    executeSuccess.then.expectedData = "the exact transfer enters CUTOVER_PENDING and emits one versioned cutover request; it is not EXECUTED yet";
  }

  const complete = actionFact({
    id: COMPLETE_ACTION_ID,
    label: "Complete the Student Transfer after Cross-domain Cutover",
    targetObjectId: transfer.id,
    operationKind: "UPDATE",
    executionMode: "FLOW_INTERNAL",
    trigger: flowTrigger(),
    inputFieldIds: [
      "DGV-TRANSFER-F-ID",
      "DGV-TRANSFER-F-STUDENT-PROFILE-ID",
      "DGV-TRANSFER-F-FROM-SCHOOL-ID",
      "DGV-TRANSFER-F-TO-SCHOOL-ID",
      "DGV-TRANSFER-F-OLD-MEMBERSHIP-REF",
      "DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION",
      "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF",
      "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION",
      "DGV-TRANSFER-F-NEW-MEMBERSHIP-REF",
      "DGV-TRANSFER-F-NEW-MEMBERSHIP-VERSION",
      "DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-REF",
      "DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-VERSION",
      "DGV-TRANSFER-F-JOINT-ACTIVATION-COMMIT-ID",
      "DGV-TRANSFER-F-JOINT-ACTIVATION-EFFECTIVE-AT",
      "DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST",
      "DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST",
    ],
    outputFieldIds: [
      "DGV-TRANSFER-F-NEW-MEMBERSHIP-REF",
      "DGV-TRANSFER-F-NEW-MEMBERSHIP-VERSION",
      "DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-REF",
      "DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-VERSION",
      "DGV-TRANSFER-F-JOINT-ACTIVATION-COMMIT-ID",
      "DGV-TRANSFER-F-JOINT-ACTIVATION-EFFECTIVE-AT",
      "DGV-TRANSFER-F-CUTOVER-COMPLETED-AT",
      "DGV-TRANSFER-F-STATUS",
      "DGV-TRANSFER-F-VERSION",
    ],
    transition: { from: "CUTOVER_PENDING", to: "EXECUTED" },
    successData: "the transfer reaches EXECUTED only after old membership and authorization are terminated and the new membership and exact subset authorization are ACTIVE",
    failureResults: ["OLD_ACCESS_STILL_ACTIVE", "NEW_MEMBERSHIP_NOT_ACTIVE", "NEW_AUTHORIZATION_NOT_ACTIVE", "SUBSET_OR_SOURCE_RIGHTS_MISMATCH"],
    idempotencyKey: `${COMPLETE_ACTION_ID}:transfer-id:cutover-start-version:new-membership-version:new-authorization-version`,
    overrides: {
      producedEventIds: [COMPLETED_EVENT_ID],
      transferCompletionContract: {
        requiredOldMembershipState: "TERMINATED",
        requiredOldSchoolAuthorizationState: "REVOKED",
        requiredNewMembershipState: "ACTIVE",
        requiredNewSchoolAuthorizationState: "ACTIVE",
        sameTransferVersionRequired: true,
        sameJointActivationCommitRequired: true,
        sameEffectiveAtRequired: true,
        halfActivatedVisibility: "DENY",
        exactStudentAndSchoolMatch: true,
        exactSubsetAndSourceRightsDigestsRequired: true,
        resultingTransferState: "EXECUTED",
      },
    },
  });
  addActionFacts(module, [complete]);

  const historyAction = requireOne(module.actions, HISTORY_ACTION_ID, "action");
  historyAction.inputFieldIds = unique([...historyAction.inputFieldIds,
    "DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-REF",
    "DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-VERSION",
    "DGV-OLDHIST-F-OLD-MEMBERSHIP-REF",
    "DGV-OLDHIST-F-OLD-MEMBERSHIP-VERSION",
    "DGV-OLDHIST-F-PERMITTED-PURPOSE-DIGEST",
  ]);
  historyAction.outputFieldIds = unique([...historyAction.outputFieldIds, "DGV-OLDHIST-F-PERMITTED-PURPOSE-DIGEST"]);
  historyAction.idempotencyKey = `${HISTORY_ACTION_ID}:transfer-id:transfer-version:old-membership-id:old-membership-version:purpose-boundary-digest`;
  historyAction.historyBoundaryContract = {
    requiredTransferState: "EXECUTED",
    requiredOldMembershipState: "TERMINATED",
    permittedPurposeCodes: ["ORIGINAL_TEACHING", "DISPUTE_HANDLING", "LEGAL_OBLIGATION"],
    roleScopeRequired: true,
    explicitExpiryRequired: true,
    defaultWithoutBoundary: "DENY_IDENTIFIABLE_HISTORY",
    everydayStatisticsMode: "IRREVERSIBLY_DEIDENTIFIED",
    expiryEffect: "DELETE_OR_IRREVERSIBLY_DEIDENTIFY_BY_OBJECT_RULE",
    duplicateEffect: "RETURN_EXISTING_RESTRICTED_HISTORY_BOUNDARY",
  };
  for (const resultCode of ["TRANSFER_VERSION_MISMATCH", "OLD_MEMBERSHIP_NOT_TERMINATED", "HISTORY_BOUNDARY_SCOPE_INVALID"]) {
    addFlowFailureScenario(
      module,
      historyAction,
      resultCode,
      `${resultCode} creates no identifiable-history access; the old-school history remains denied by default`,
    );
    const failureScenario = module.scenarios.find(({ id }) => id === `${historyAction.id}-SCN-${resultCode}`);
    if (failureScenario) failureScenario.trigger = eventTrigger(COMPLETED_EVENT_ID);
  }

  const transferPage = requireOne(module.pages, "DGV-PAGE-STUDENT-TRANSFER", "page");
  transferPage.fieldIds = unique([...transferPage.fieldIds,
    "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION",
    "DGV-TRANSFER-F-OLD-MEMBERSHIP-REF",
    "DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION",
    "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF",
    "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION",
    "DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST",
    "DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST",
    "DGV-TRANSFER-F-CUTOVER-STARTED-AT",
    "DGV-TRANSFER-F-NEW-MEMBERSHIP-REF",
    "DGV-TRANSFER-F-NEW-MEMBERSHIP-VERSION",
    "DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-REF",
    "DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-VERSION",
    "DGV-TRANSFER-F-JOINT-ACTIVATION-COMMIT-ID",
    "DGV-TRANSFER-F-JOINT-ACTIVATION-EFFECTIVE-AT",
    "DGV-TRANSFER-F-CUTOVER-COMPLETED-AT",
  ]);
  const historyPage = requireOne(module.pages, "DGV-PAGE-OLD-SCHOOL-HISTORY", "page");
  historyPage.fieldIds = unique([...historyPage.fieldIds,
    "DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-REF",
    "DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-VERSION",
    "DGV-OLDHIST-F-OLD-MEMBERSHIP-REF",
    "DGV-OLDHIST-F-OLD-MEMBERSHIP-VERSION",
    "DGV-OLDHIST-F-PERMITTED-PURPOSE-DIGEST",
  ]);
  module.transferLifecycleContract = {
    decisionIds: ["D052", "D053"],
    flowId: FLOW_ID,
    startEventId: START_EVENT_ID,
    completedEventId: COMPLETED_EVENT_ID,
    transferObjectId: transfer.id,
    membershipObjectId: "ACC-OBJ-MEMBERSHIP",
    schoolAuthorizationObjectId: "IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION",
    oldHistoryObjectId: history.id,
    oldSchoolCurrentAccessAfterCutoverStart: "TERMINATE_AND_NEVER_RESTORE",
    newSchoolAccessRule: "EXACT_PINNED_AUTHORIZED_SUBSET_ONLY",
    personalGuardianRelationEffect: "UNCHANGED",
  };
  return module;
}

const enhancerByModuleId = new Map([
  ["ACC-001", enhanceAccount],
  ["ORG-001", enhanceOrganization],
  ["IAM-001", enhanceIdentityAccess],
  ["DGV-001", enhanceDataGovernance],
]);

export function applyTransferLifecycleContracts(inputModules) {
  if (!Array.isArray(inputModules)) {
    throw new Error("transfer lifecycle transformation requires a module array");
  }
  return inputModules.map((sourceModule) => {
    const module = structuredClone(sourceModule);
    const enhancer = enhancerByModuleId.get(module?.id);
    return enhancer ? enhancer(module) : module;
  });
}

export const transferLifecycleEvents = deepFreeze([{
  id: MEMBERSHIP_SOURCE_EVENT_ID,
  label: "权威成员目录快照可同步",
  definition: "学校成员目录发布固定版本的成员身份、学校关系和邀请状态快照时，在 ACC 唯一权威 membership 中幂等创建 INVITED 入口。",
  triggeredActionIds: [CREATE_INVITED_MEMBERSHIP_ACTION_ID],
  authoritativeMembershipSnapshotContract: {
    consumerActionId: CREATE_INVITED_MEMBERSHIP_ACTION_ID,
    snapshotIdentityFieldId: "ACC-MEMBER-F-DIRECTORY-SNAPSHOT-ID",
    snapshotVersionFieldId: "ACC-MEMBER-F-DIRECTORY-SNAPSHOT-VERSION",
    duplicateDeliveryEffect: "RETURN_EXISTING_MEMBERSHIP",
    conflictingDeliveryEffect: "FAIL_CLOSED",
    activeAccessBeforeActivation: false,
  },
}, {
  id: START_EVENT_ID,
  label: "学生转学切换已请求",
  definition: "转学授权、高影响授权、旧校关系、旧校数据授权、可迁移子集和来源权利均固定版本后，触发旧校当前关系终止。",
  producerActionIds: [TRANSFER_ACTION_ID],
  triggeredActionIds: [OLD_MEMBERSHIP_ACTION_ID],
  transferCutoverContextContract: {
    contextKeys: [
      "transferAuthorizationId",
      "transferAuthorizationVersion",
      "studentProfileId",
      "fromSchoolId",
      "toSchoolId",
      "highImpactAuthorizationId",
      "highImpactAuthorizationVersion",
      "oldMembershipId",
      "oldMembershipVersion",
      "oldSchoolAuthorizationId",
      "oldSchoolAuthorizationVersion",
      "oldGuardianAuthorizationManifestDigest",
      "permittedSubsetDigest",
      "sourceRightsDigest",
    ],
    producerActionId: TRANSFER_ACTION_ID,
    firstConsumerActionId: OLD_MEMBERSHIP_ACTION_ID,
    exactTransferVersionRequired: true,
    exactContextDigestRequired: true,
    duplicateDeliveryEffect: "IDEMPOTENT_RESUME_FROM_PINNED_VERSIONS",
    conflictingDeliveryEffect: "FAIL_CLOSED",
  },
}]);

export function applyTransferLifecycleEventContracts(inputEvents) {
  if (!Array.isArray(inputEvents)) {
    throw new Error("transfer lifecycle event transformation requires an event array");
  }
  return inputEvents.map((sourceEvent) => {
    const event = structuredClone(sourceEvent);
    if (event?.id !== COMPLETED_EVENT_ID) return event;
    event.producerActionIds = [COMPLETE_ACTION_ID];
    event.triggeredActionIds = [HISTORY_ACTION_ID, INVALIDATE_PERMISSION_ACTION_ID];
    event.definition = "旧校当前 membership、学生数据授权和监护辅助授权已终止，新校 membership 与严格授权子集已激活且转学达到 EXECUTED 后，创建旧校期限化历史边界并使旧权限决定失效。";
    event.transferCompletionContextContract = {
      contextKeys: [
        "transferAuthorizationId",
        "transferAuthorizationVersion",
        "studentProfileId",
        "fromSchoolId",
        "toSchoolId",
        "oldMembershipId",
        "oldMembershipVersion",
        "newMembershipId",
        "newMembershipVersion",
        "newSchoolAuthorizationId",
        "newSchoolAuthorizationVersion",
        "jointActivationCommitId",
        "jointActivationEffectiveAt",
        "permittedSubsetDigest",
        "sourceRightsDigest",
        "completedAt",
      ],
      producerActionId: COMPLETE_ACTION_ID,
      consumerActionIds: [HISTORY_ACTION_ID, INVALIDATE_PERMISSION_ACTION_ID],
      exactTransferVersionRequired: true,
      duplicateDeliveryEffect: "RETURN_EXISTING_BOUNDARY_AND_STALE_PERMISSION_RESULTS",
      conflictingDeliveryEffect: "FAIL_CLOSED",
      historyConsumerFailureEffect: "DENY_IDENTIFIABLE_HISTORY_AND_RETRY_WITHOUT_RESTORING_OLD_ACCESS",
    };
    return event;
  });
}

function sourceRef(objectId, fieldId, version, cardinality = "ONE") {
  return { objectId, fieldId, version, cardinality };
}

function targetRef(objectId, fieldId, version) {
  return { objectId, fieldId, version };
}

export const transferLifecycleFlows = deepFreeze([{
  id: FLOW_ID,
  label: "Version-pinned Student Transfer Authorization Cutover",
  phase: PHASE.FIRST,
  contractProfile: "GENERIC",
  routingPolicy: "NONE",
  moduleIds: ["DGV-001", "ACC-001", "ORG-001", "IAM-001"],
  steps: [
    {
      order: 1,
      actionId: TRANSFER_ACTION_ID,
      condition: "the transfer and exact high-impact authorization are AUTHORIZED, unexpired, undisputed, and pin the current old-school relationship and permitted subset",
    },
    {
      order: 2,
      actionId: OLD_MEMBERSHIP_ACTION_ID,
      condition: "the cutover request event matches the exact active old-school membership and transfer context",
      providedInputs: systemInputs(
        "ACC-MEMBER-F-ID",
        "ACC-MEMBER-F-PLATFORM-IDENTITY-REF",
        "ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION",
        "ACC-MEMBER-F-STUDENT-PROFILE-REF",
        "ACC-MEMBER-F-SCHOOL-PROFILE-REF",
        "ACC-MEMBER-F-SCHOOL-PROFILE-VERSION",
        "ACC-MEMBER-F-SCHOOL-ID",
        "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF",
        "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION",
      ),
    },
    {
      order: 3,
      actionId: LEGACY_PROFILE_ACTION_ID,
      condition: "the old-school membership is TERMINATED and the school profile is updated only as a historical projection",
      providedInputs: systemInputs("ORG-STUDENT-F-ID", "ORG-STUDENT-F-CLASS-ID"),
    },
    {
      order: 4,
      actionId: OLD_AUTH_ACTION_ID,
      condition: "the exact old-school student data authorization matches the terminated membership",
      providedInputs: systemInputs(
        "IAM-SSDA-F-ID",
        "IAM-SSDA-F-STUDENT-PROFILE-REF",
        "IAM-SSDA-F-SCHOOL-ID",
        "IAM-SSDA-F-MEMBERSHIP-REF",
        "IAM-SSDA-F-MEMBERSHIP-VERSION",
        "IAM-SSDA-F-TERMINATION-TRANSFER-REF",
        "IAM-SSDA-F-TERMINATION-TRANSFER-VERSION",
      ),
    },
    {
      order: 5,
      actionId: OLD_GUARDIAN_AUTH_ACTION_ID,
      condition: "zero or more matching old-school guardian delegations are revoked without changing the personal guardian relation",
      providedInputs: systemInputs(
        "IAM-SDAUTH-F-ID",
        "IAM-SDAUTH-F-STUDENT-PROFILE-ID",
        "IAM-SDAUTH-F-SCHOOL-ID",
      ),
    },
    {
      order: 6,
      actionId: CREATE_MEMBERSHIP_ACTION_ID,
      condition: "old-school current membership and authorizations are terminated",
      providedInputs: systemInputs(
        "ACC-MEMBER-F-ACCOUNT-ID-TYPE",
        "ACC-MEMBER-F-ACCOUNT-ID",
        "ACC-MEMBER-F-SCHOOL-ID",
        "ACC-MEMBER-F-ACTIVATION",
        "ACC-MEMBER-F-PLATFORM-IDENTITY-REF",
        "ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION",
        "ACC-MEMBER-F-STUDENT-PROFILE-REF",
        "ACC-MEMBER-F-SCHOOL-PROFILE-REF",
        "ACC-MEMBER-F-SCHOOL-PROFILE-VERSION",
        "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF",
        "ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION",
        "ACC-MEMBER-F-PREDECESSOR-REF",
        "ACC-MEMBER-F-PREDECESSOR-VERSION",
        "ACC-MEMBER-F-EFFECTIVE-AT",
      ),
    },
    {
      order: 7,
      actionId: CREATE_AUTH_ACTION_ID,
      condition: "the PENDING new-school membership exists and the exact permitted subset and source rights remain valid",
      providedInputs: systemInputs(
        "IAM-SSDA-F-STUDENT-PROFILE-REF",
        "IAM-SSDA-F-SCHOOL-ID",
        "IAM-SSDA-F-MEMBERSHIP-REF",
        "IAM-SSDA-F-MEMBERSHIP-VERSION",
        "IAM-SSDA-F-SOURCE-TRANSFER-REF",
        "IAM-SSDA-F-SOURCE-TRANSFER-VERSION",
        "IAM-SSDA-F-PERMITTED-SUBSET",
        "IAM-SSDA-F-PERMITTED-SUBSET-DIGEST",
        "IAM-SSDA-F-SOURCE-RIGHTS",
        "IAM-SSDA-F-SOURCE-RIGHTS-DIGEST",
        "IAM-SSDA-F-EFFECTIVE-AT",
        "IAM-SSDA-F-EXPIRY",
      ),
    },
    {
      order: 8,
      actionId: ACTIVATE_MEMBERSHIP_ACTION_ID,
      condition: "there is no other active school membership and the predecessor remains TERMINATED",
      providedInputs: systemInputs("ACC-MEMBER-F-JOINT-ACTIVATION-COMMIT-ID"),
    },
    {
      order: 9,
      actionId: ACTIVATE_AUTH_ACTION_ID,
      condition: "the new membership is ACTIVE, old current access remains terminated, and the authorization still equals the pinned subset",
      providedInputs: systemInputs("IAM-SSDA-F-JOINT-ACTIVATION-COMMIT-ID"),
    },
    {
      order: 10,
      actionId: COMPLETE_ACTION_ID,
      condition: "old membership and authorization are terminated and the exact new membership and subset authorization are ACTIVE",
      providedInputs: systemInputs(
        "DGV-TRANSFER-F-ID",
        "DGV-TRANSFER-F-STUDENT-PROFILE-ID",
        "DGV-TRANSFER-F-FROM-SCHOOL-ID",
        "DGV-TRANSFER-F-TO-SCHOOL-ID",
        "DGV-TRANSFER-F-OLD-MEMBERSHIP-REF",
        "DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION",
        "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF",
        "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION",
        "DGV-TRANSFER-F-NEW-MEMBERSHIP-REF",
        "DGV-TRANSFER-F-NEW-MEMBERSHIP-VERSION",
        "DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-REF",
        "DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-VERSION",
        "DGV-TRANSFER-F-JOINT-ACTIVATION-COMMIT-ID",
        "DGV-TRANSFER-F-JOINT-ACTIVATION-EFFECTIVE-AT",
        "DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST",
        "DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST",
      ),
    },
    {
      order: 11,
      actionId: HISTORY_ACTION_ID,
      condition: "the completed event creates a purpose-, role-, object-, and time-limited old-school history boundary; failure leaves identifiable history denied",
      providedInputs: systemInputs(
        "DGV-OLDHIST-F-STUDENT-PROFILE-ID",
        "DGV-OLDHIST-F-SCHOOL-ID",
        "DGV-OLDHIST-F-PURPOSE",
        "DGV-OLDHIST-F-ROLE-SCOPE",
        "DGV-OLDHIST-F-EXPIRY",
        "DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-REF",
        "DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-VERSION",
        "DGV-OLDHIST-F-OLD-MEMBERSHIP-REF",
        "DGV-OLDHIST-F-OLD-MEMBERSHIP-VERSION",
        "DGV-OLDHIST-F-PERMITTED-PURPOSE-DIGEST",
      ),
    },
    {
      order: 12,
      actionId: INVALIDATE_PERMISSION_ACTION_ID,
      condition: "permission decisions and cached contexts derived from the former relationship become STALE",
      providedInputs: systemInputs("IAM-DECISION-F-ID", "IAM-DECISION-F-SOURCE-VERSIONS"),
    },
  ],
  sourceDataRefs: [
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-ID", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-STUDENT-PROFILE-ID", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-FROM-SCHOOL-ID", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-TO-SCHOOL-ID", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-DISPUTE-STATUS", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-EXPIRY", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-RELATIONSHIP-SCOPE", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-PERMITTED-SUBSET", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-SOURCE-RIGHTS", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-OLD-MEMBERSHIP-REF", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION", "DGV-TRANSFER-F-VERSION"),
    sourceRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-OLD-GUARDIAN-AUTHORIZATION-MANIFEST-DIGEST", "DGV-TRANSFER-F-VERSION"),
    sourceRef("ACC-OBJ-MEMBERSHIP", "ACC-MEMBER-F-ID", "ACC-MEMBER-F-VERSION"),
    sourceRef("ACC-OBJ-MEMBERSHIP", "ACC-MEMBER-F-STATE", "ACC-MEMBER-F-VERSION"),
    sourceRef("ORG-OBJ-STUDENT", "ORG-STUDENT-F-ID", "ORG-STUDENT-F-VERSION"),
    sourceRef("ORG-OBJ-STUDENT", "ORG-STUDENT-F-MEMBER-STATE", "ORG-STUDENT-F-VERSION"),
    sourceRef("IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION", "IAM-SSDA-F-ID", "IAM-SSDA-F-VERSION"),
    sourceRef("IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION", "IAM-SSDA-F-STATUS", "IAM-SSDA-F-VERSION"),
    sourceRef("IAM-OBJ-SCHOOL-DATA-AUTHORIZATION", "IAM-SDAUTH-F-ID", "IAM-SDAUTH-F-VERSION", "ZERO_MANY"),
    sourceRef("IAM-OBJ-HIGH-IMPACT-AUTHORIZATION", "IAM-HIAUTH-F-ID", "IAM-HIAUTH-F-VERSION"),
    sourceRef("IAM-OBJ-HIGH-IMPACT-AUTHORIZATION", "IAM-HIAUTH-F-STATUS", "IAM-HIAUTH-F-VERSION"),
    sourceRef("IAM-OBJ-HIGH-IMPACT-AUTHORIZATION", "IAM-HIAUTH-F-DISPUTE-STATUS", "IAM-HIAUTH-F-VERSION"),
    sourceRef("IAM-OBJ-HIGH-IMPACT-AUTHORIZATION", "IAM-HIAUTH-F-EXPIRY", "IAM-HIAUTH-F-VERSION"),
  ],
  targetDataRefs: [
    targetRef("ACC-OBJ-MEMBERSHIP", "ACC-MEMBER-F-STATE", "ACC-MEMBER-F-VERSION"),
    targetRef("ORG-OBJ-STUDENT", "ORG-STUDENT-F-MEMBER-STATE", "ORG-STUDENT-F-VERSION"),
    targetRef("IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION", "IAM-SSDA-F-STATUS", "IAM-SSDA-F-VERSION"),
    targetRef("IAM-OBJ-SCHOOL-DATA-AUTHORIZATION", "IAM-SDAUTH-F-STATUS", "IAM-SDAUTH-F-VERSION"),
    targetRef("DGV-OBJ-TRANSFER-AUTHORIZATION", "DGV-TRANSFER-F-STATUS", "DGV-TRANSFER-F-VERSION"),
    targetRef("DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY", "DGV-OLDHIST-F-STATUS", "DGV-OLDHIST-F-VERSION"),
    targetRef("IAM-OBJ-PERMISSION-DECISION", "IAM-DECISION-F-RESULT", "IAM-DECISION-F-DECISION-VERSION"),
  ],
  idempotencyKeyParts: {
    identityFieldIds: [
      "DGV-TRANSFER-F-ID",
      "ACC-MEMBER-F-ID",
      "ORG-STUDENT-F-ID",
      "IAM-SSDA-F-ID",
      "IAM-HIAUTH-F-ID",
    ],
    versionFieldIds: [
      "DGV-TRANSFER-F-VERSION",
      "ACC-MEMBER-F-VERSION",
      "ORG-STUDENT-F-VERSION",
      "IAM-SSDA-F-VERSION",
      "IAM-HIAUTH-F-VERSION",
    ],
    fanoutFieldId: "IAM-SDAUTH-F-ID",
  },
  failureGranularity: "FORWARD_ONLY_CROSS_DOMAIN_CUTOVER_WITH_OLD_ACCESS_NEVER_RESTORED",
  retryPolicy: {
    strategy: "IDEMPOTENT_RESUME_FROM_PINNED_TRANSFER_AND_OBJECT_VERSIONS",
    maxAttempts: 8,
    retryableFailureResults: ["VERSION_CONFLICT", "AUDIT_FAILED"],
  },
  compensation: {
    strategy: "FORWARD_ONLY_RECONCILIATION_NO_OLD_ACCESS_RESTORE",
    description: "after cutover starts, keep old membership, student-data authorization, and guardian school delegations terminated; keep pending new scope non-readable, revoke any partially activated wider scope, retry from pinned versions, and deny identifiable old-school history until its restricted boundary is committed",
  },
  downstreamInvalidation: {
    strategy: "INVALIDATE_ALL_FORMER_RELATIONSHIP_DERIVATIONS",
    targets: [
      "old-school active contexts",
      "permission decisions and caches",
      "search, aggregation, autocomplete, archive and direct links",
      "export generation and download authorization",
      "guardian task-assistance sessions",
      "teacher and homeroom work views",
    ],
  },
  transferCutoverFlowContract: {
    decisionIds: ["D052", "D053"],
    authoritativeMembershipObjectId: "ACC-OBJ-MEMBERSHIP",
    transferStateBeforeCrossDomainCompletion: "CUTOVER_PENDING",
    transferCompletionState: "EXECUTED",
    oldMembershipTerminalState: "TERMINATED",
    oldSchoolAuthorizationTerminalState: "REVOKED",
    newMembershipRequiredState: "ACTIVE",
    newSchoolAuthorizationRequiredState: "ACTIVE",
    newSchoolScopeRule: "EXACT_PINNED_AUTHORIZED_SUBSET_ONLY",
    membershipAloneGrantsStudentDataAccess: false,
    authorizationAloneGrantsStudentDataAccess: false,
    jointActivationRule: "BOTH_ACTIVE_SAME_TRANSFER_VERSION_JOINT_COMMIT_AND_EFFECTIVE_AT",
    halfActivatedVisibility: "DENY",
    fullDatabaseCopyAllowed: false,
    personalGuardianRelationEffect: "UNCHANGED",
    oldSchoolCurrentAccessRestorationAllowed: false,
    historyBoundaryFailureEffect: "DENY_IDENTIFIABLE_HISTORY_AND_RETRY",
    everydayOldSchoolStatisticsMode: "IRREVERSIBLY_DEIDENTIFIED",
  },
}]);

export const transferLifecycleContractIds = deepFreeze({
  flowId: FLOW_ID,
  membershipSourceEventId: MEMBERSHIP_SOURCE_EVENT_ID,
  startEventId: START_EVENT_ID,
  completedEventId: COMPLETED_EVENT_ID,
  actionIds: [
    CREATE_INVITED_MEMBERSHIP_ACTION_ID,
    TRANSFER_ACTION_ID,
    OLD_MEMBERSHIP_ACTION_ID,
    LEGACY_PROFILE_ACTION_ID,
    OLD_AUTH_ACTION_ID,
    OLD_GUARDIAN_AUTH_ACTION_ID,
    CREATE_MEMBERSHIP_ACTION_ID,
    CREATE_AUTH_ACTION_ID,
    ACTIVATE_MEMBERSHIP_ACTION_ID,
    ACTIVATE_AUTH_ACTION_ID,
    COMPLETE_ACTION_ID,
    HISTORY_ACTION_ID,
    INVALIDATE_PERMISSION_ACTION_ID,
  ],
});
