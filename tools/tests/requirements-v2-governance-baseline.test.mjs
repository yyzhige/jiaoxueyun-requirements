import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import { validateRequirementModel } from "../requirements-v2/validate/index.mjs";

const SCHOOL_READINESS_OBJECT_IDS = [
  "ACC-OBJ-SCHOOL-APPLICATION-REVIEW",
  "ACC-OBJ-SCHOOL",
  "ACC-OBJ-SCHOOL-INITIALIZATION",
  "ACC-OBJ-SCHOOL-SUBSCRIPTION",
  "ACC-OBJ-CLASS-COURSE-READINESS",
];

const TEACHER_DOMAINS = [
  "WORKBENCH",
  "TEACHING_SPACE",
  "LEARNING_ACTIVITIES",
  "MATERIALS_ASSETS",
  "NOTIFICATION_COLLABORATION",
  "ACCOUNT_HANDOVER",
];

const SCHOOL_ADMIN_DOMAINS = [
  "OVERVIEW_READINESS",
  "TEACHING_ORGANIZATION",
  "PEOPLE_RELATIONSHIPS",
  "PERMISSIONS_ACCOUNT_SECURITY",
  "ASSETS_HANDOVER",
  "AUDIT_DATA_SERVICES",
];

const DATA_CATALOG_AXIS_FIELD_IDS = [
  "DGV-CATALOG-F-NATURE",
  "DGV-CATALOG-F-DATA-SUBJECT",
  "DGV-CATALOG-F-MANAGEMENT-SCOPE",
  "DGV-CATALOG-F-SOURCE-RIGHTS",
  "DGV-CATALOG-F-PURPOSE",
  "DGV-CATALOG-F-SENSITIVITY",
  "DGV-CATALOG-F-PORTABILITY",
  "DGV-CATALOG-F-LIFECYCLE",
];

const GOVERNANCE_ACTION_IDS = [
  "DGV-ACT-CORRECT-DATA",
  "DGV-ACT-RESTRICT-DATA-ACCESS",
  "DGV-ACT-PHYSICALLY-DELETE-DATA",
  "DGV-ACT-IRREVERSIBLY-DEIDENTIFY-DATA",
];

const DELETION_OBJECT_CATEGORIES = [
  "RAW_TEXT",
  "IMAGE",
  "AUDIO",
  "AI_RESULT",
  "LEARNING_PROFILE",
  "VIDEO",
  "SCHOOL_FACT",
  "SHARED_ASSOCIATION",
  "LEGAL_HOLD_RECORD",
];

const DELETION_BINDING_FIELD_IDS = [
  "DGV-DELROW-F-DELETION-CASE-REF",
  "DGV-DELROW-F-DELETION-CASE-VERSION",
  "DGV-DELROW-F-INVENTORY-REF",
  "DGV-DELROW-F-INVENTORY-VERSION",
  "DGV-DELROW-F-INVENTORY-ITEM-ID",
  "DGV-DELROW-F-INVENTORY-ITEM-DIGEST",
  "DGV-DELROW-F-SOURCE-OBJECT-ID",
  "DGV-DELROW-F-SOURCE-OBJECT-VERSION",
  "DGV-DELROW-F-SOURCE-OBJECT-CATEGORY",
  "DGV-DELROW-F-LEGAL-BASIS",
  "DGV-DELROW-F-DISPUTE-BASIS",
  "DGV-DELROW-F-HIGH-IMPACT-AUTHORIZATION-ID",
  "DGV-DELROW-F-GOVERNANCE-ACTION",
  "DGV-DELROW-F-EXECUTION-STATUS",
];

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

function scenarioFor(model, actionId, resultCode) {
  return model.modules.flatMap((module) => module.scenarios)
    .find((scenario) => (
      scenario.actionId === actionId && scenario.resultCode === resultCode
    ));
}

function errorCodes(model) {
  return validateRequirementModel(model)
    .map((error) => error.split(" ", 1)[0]);
}

function mutate(mutator) {
  const model = structuredClone(requirementModel);
  mutator(model);
  return model;
}

function assertSemanticMutation(code, mutator) {
  const codes = errorCodes(mutate(mutator));
  assert.ok(codes.includes(code), codes.join("\n"));
}

test("keeps each governance baseline owner module unique after transformation", () => {
  assert.deepEqual(validateRequirementModel(requirementModel), []);
  for (const id of ["ACC-001", "TEA-001", "NOTI-001", "DGV-001", "CONTENT-001"]) {
    assert.equal(requirementModel.modules.filter((module) => module.id === id).length, 1, id);
    assert.equal(moduleById(requirementModel, id).governanceBaselineOwner.moduleId, id);
  }
});

test("models school identity, campus, group, name history, and reorganization separately", () => {
  const school = objectById(requirementModel, "ACC-OBJ-SCHOOL");
  assert.ok(school.fields.some(({ id }) => id === "ACC-SCHOOL-F-GOVERNANCE-BOUNDARY-ID"));
  for (const id of [
    "ACC-OBJ-CAMPUS",
    "ACC-OBJ-EDUCATION-GROUP",
    "ACC-OBJ-SCHOOL-NAME-VERSION",
    "ACC-OBJ-SCHOOL-REORGANIZATION",
  ]) {
    assert.ok(objectById(requirementModel, id), id);
  }
  const resolve = actionById(requirementModel, "ACC-ACT-RESOLVE-SCHOOL-DATA-BOUNDARY");
  assert.equal(resolve.operationKind, "READ");
  assert.ok(resolve.outputFieldIds.includes("ACC-SCHOOL-F-GOVERNANCE-BOUNDARY-ID"));
  assert.equal(
    scenarioFor(requirementModel, resolve.id, "IMPLICIT_DATA_SHARING_DENIED")
      ?.then.expectedPermission,
    "DENY",
  );
});

test("requires five independent school readiness sources before teaching activation", () => {
  const module = moduleById(requirementModel, "ACC-001");
  assert.deepEqual(module.schoolReadinessContract.axisObjectIds, SCHOOL_READINESS_OBJECT_IDS);
  assert.equal(new Set(SCHOOL_READINESS_OBJECT_IDS).size, 5);
  SCHOOL_READINESS_OBJECT_IDS.forEach((id) => assert.ok(objectById(requirementModel, id), id));

  const activate = actionById(requirementModel, "ACC-ACT-ACTIVATE-SCHOOL-TEACHING");
  assert.deepEqual(
    activate.relatedStateGuards.map(({ targetObjectId, requiredState }) => [
      targetObjectId,
      requiredState,
    ]),
    [
      ["ACC-OBJ-SCHOOL-APPLICATION-REVIEW", "APPROVED"],
      ["ACC-OBJ-SCHOOL", "ACTIVE"],
      ["ACC-OBJ-SCHOOL-INITIALIZATION", "READY"],
      ["ACC-OBJ-SCHOOL-SUBSCRIPTION", "ACTIVE"],
      ["ACC-OBJ-CLASS-COURSE-READINESS", "READY"],
    ],
  );
});

test("resolves teacher and school-admin responsibility domains without fixed navigation", () => {
  const module = moduleById(requirementModel, "TEA-001");
  assert.deepEqual(module.responsibilityDomainContracts, [
    {
      experienceKind: "TEACHER",
      domainIds: TEACHER_DOMAINS,
      fixedNavigationRequired: false,
      resolveActionId: "TEA-ACT-RESOLVE-TEACHER-EXPERIENCE",
    },
    {
      experienceKind: "SCHOOL_ADMIN",
      domainIds: SCHOOL_ADMIN_DOMAINS,
      fixedNavigationRequired: false,
      resolveActionId: "TEA-ACT-RESOLVE-SCHOOL-ADMIN-EXPERIENCE",
    },
  ]);
  for (const actionId of module.responsibilityDomainContracts.map(({ resolveActionId }) => resolveActionId)) {
    const action = actionById(requirementModel, actionId);
    assert.equal(action.targetObjectId, "TEA-OBJ-EXPERIENCE-RESOLUTION");
    assert.ok(action.outputFieldIds.includes("TEA-EXPERIENCE-F-RESOLVED-SURFACES"));
    assert.ok(action.scenarioIds.length > 1);
  }
});

test("separates business events, action todos, messages, and channel deliveries", () => {
  const module = moduleById(requirementModel, "NOTI-001");
  assert.deepEqual(module.operationalSeparationContract, {
    businessEventObjectId: "NOTI-OBJ-BUSINESS-EVENT",
    actionTodoObjectId: "NOTI-OBJ-ACTION-TODO",
    messageObjectId: "NOTI-OBJ-NOTIFICATION",
    deliveryObjectId: "NOTI-OBJ-CHANNEL-DELIVERY",
    messageReadChangesTodo: false,
  });
  assert.equal(new Set(Object.values(module.operationalSeparationContract)
    .filter((value) => typeof value === "string")).size, 4);
  assert.equal(actionById(requirementModel, "NOTI-ACT-MARK-READ").targetObjectId, "NOTI-OBJ-NOTIFICATION");
  assert.equal(actionById(requirementModel, "NOTI-ACT-RESOLVE-ACTION-TODO").targetObjectId, "NOTI-OBJ-ACTION-TODO");
  for (const actionId of ["NOTI-ACT-DELIVER", "NOTI-ACT-FAIL-DELIVERY", "NOTI-ACT-RETRY-DELIVERY"]) {
    assert.equal(actionById(requirementModel, actionId).targetObjectId, "NOTI-OBJ-CHANNEL-DELIVERY");
  }
});

test("makes age adaptation and accessibility part of the experience resolver", () => {
  const module = moduleById(requirementModel, "TEA-001");
  assert.deepEqual(module.accessibilityContract, {
    sharedSemanticInformationArchitecture: true,
    ageStages: ["PRIMARY", "MIDDLE"],
    ageAdaptationDimensions: ["LANGUAGE", "INFORMATION_DENSITY", "INTERACTION"],
    requiredCapabilities: [
      "KEYBOARD_OPERATION",
      "NON_VOICE_ALTERNATIVE",
      "TEXT_SCALING",
      "VISIBLE_FOCUS",
    ],
    resolveActionId: "TEA-ACT-RESOLVE-ACCESSIBLE-PRESENTATION",
  });
  const resolve = actionById(requirementModel, module.accessibilityContract.resolveActionId);
  for (const fieldId of [
    "TEA-EXPERIENCE-F-SEMANTIC-IA-VERSION",
    "TEA-EXPERIENCE-F-AGE-ADAPTATION",
    "TEA-EXPERIENCE-F-KEYBOARD-OPERATION",
    "TEA-EXPERIENCE-F-NON-VOICE-ALTERNATIVE",
    "TEA-EXPERIENCE-F-TEXT-SCALING",
    "TEA-EXPERIENCE-F-VISIBLE-FOCUS",
  ]) {
    assert.ok(resolve.outputFieldIds.includes(fieldId), fieldId);
  }
});

test("registers one authoritative active eight-axis classification for every governed object", () => {
  const catalog = objectById(requirementModel, "DGV-OBJ-DATA-CATALOG-ENTRY");
  const contract = catalog.dataCatalogContract;
  assert.deepEqual(contract.axisFieldIds, DATA_CATALOG_AXIS_FIELD_IDS);
  for (const fieldId of DATA_CATALOG_AXIS_FIELD_IDS) {
    const field = catalog.fields.find(({ id }) => id === fieldId);
    assert.equal(field.valueSource.kind, "OPTION_SET", fieldId);
  }
  const governedObjectIds = requirementModel.modules
    .flatMap((module) => module.objects.map(({ id }) => id))
    .toSorted();
  assert.deepEqual(contract.governedObjectIds, governedObjectIds);
  assert.equal(new Set(contract.governedObjectIds).size, governedObjectIds.length);
  assert.deepEqual(contract.classificationKey, {
    scope: "CONTROL_SUBJECT_PARTITION",
    fieldIds: [
      "DGV-CATALOG-F-CONTROL-SUBJECT",
      "DGV-CATALOG-F-CONTROL-SCOPE-REF",
      "DGV-CATALOG-F-SOURCE-OBJECT-KIND",
    ],
  });
  assert.deepEqual(
    contract.coveragePartitions.flatMap(({ governedObjectIds: objectIds }) => objectIds)
      .toSorted(),
    governedObjectIds,
  );
  assert.deepEqual(contract.activeClassification, {
    cardinality: "EXACTLY_ONE_PER_GOVERNED_OBJECT",
    statusFieldId: "DGV-CATALOG-F-STATUS",
    activeState: "ACTIVE",
    supersededState: "SUPERSEDED",
    initialActivationActionId: "DGV-ACT-ACTIVATE-DATA-CATALOG",
    atomicReplacementActionId: "DGV-ACT-SUPERSEDE-DATA-CATALOG",
    resolveActionId: "DGV-ACT-RESOLVE-DATA-CATALOG",
    initialActivationRequiresActiveCount: 0,
    replacementRequiresActiveCount: 1,
    activeCountAfterCommit: 1,
  });
  assert.deepEqual(contract.authoritativeAxisMappings, {
    dataNature: {
      fieldId: "DGV-CATALOG-F-NATURE",
      optionSetId: "OPT-BL2-003",
      objectProperty: "dataNature",
    },
    sensitivity: {
      fieldId: "DGV-CATALOG-F-SENSITIVITY",
      optionSetId: "OPT-BL2-008",
      objectProperty: "sensitivityId",
      modelCollection: "sensitivities",
    },
  });
  const dataNatureCodes = requirementModel.optionSets
    .find(({ id }) => id === "OPT-BL2-003").values.map(({ code }) => code);
  assert.deepEqual(dataNatureCodes, [
    "RAW_FACT",
    "TEACHING_BASELINE",
    "AI_DERIVED",
    "SYSTEM_GOVERNANCE",
  ]);
  assert.equal(requirementModel.modules.flatMap((module) => module.objects).every((object) => (
    !Object.hasOwn(object, "dataNature") || dataNatureCodes.includes(object.dataNature)
  )), true);
  const sensitivityCodes = requirementModel.optionSets
    .find(({ id }) => id === "OPT-BL2-008").values.map(({ code }) => code);
  assert.deepEqual(
    sensitivityCodes.toSorted(),
    requirementModel.sensitivities.map(({ id }) => id).toSorted(),
  );
  const activate = actionById(requirementModel, "DGV-ACT-ACTIVATE-DATA-CATALOG");
  assert.deepEqual(activate.activeClassificationEffect, {
    mode: "INITIAL_ACTIVATION",
    uniquenessKeyFieldIds: [
      "DGV-CATALOG-F-CONTROL-SUBJECT",
      "DGV-CATALOG-F-CONTROL-SCOPE-REF",
      "DGV-CATALOG-F-SOURCE-OBJECT-KIND",
    ],
    requiredActiveCountBefore: 0,
    activeCountAfterCommit: 1,
  });
  const replace = actionById(requirementModel, "DGV-ACT-SUPERSEDE-DATA-CATALOG");
  assert.equal(replace.atomicCatalogReplacement.commitMode, "ATOMIC");
  assert.deepEqual(replace.atomicCatalogReplacement.replacementStateTransition, {
    from: "DRAFT",
    to: "ACTIVE",
  });
  assert.equal(
    scenarioFor(requirementModel, activate.id, "ACTIVE_CATALOG_CONFLICT")
      ?.then.expectedPermission,
    "DENY",
  );
  assert.equal(
    scenarioFor(requirementModel, replace.id, "ACTIVE_CATALOG_NOT_UNIQUE")
      ?.then.expectedPermission,
    "DENY",
  );
  const resolve = actionById(requirementModel, "DGV-ACT-RESOLVE-DATA-CATALOG");
  assert.deepEqual(resolve.outputFieldIds, DATA_CATALOG_AXIS_FIELD_IDS);
  assert.deepEqual(resolve.inputFieldIds, [
    "DGV-CATALOG-F-CONTROL-SUBJECT",
    "DGV-CATALOG-F-CONTROL-SCOPE-REF",
    "DGV-CATALOG-F-SOURCE-OBJECT-KIND",
  ]);
  assert.equal(
    scenarioFor(requirementModel, resolve.id, "CATALOG_AXIS_INCOMPLETE")
      ?.then.expectedPermission,
    "DENY",
  );
  assert.equal(
    scenarioFor(requirementModel, resolve.id, "ACTIVE_CATALOG_NOT_UNIQUE")
      ?.then.expectedPermission,
    "DENY",
  );
});

test("rejects incomplete coverage, duplicate-active semantics, and divergent governance closures", () => {
  assertSemanticMutation("INVALID_D047_DATA_CATALOG", (model) => {
    objectById(model, "DGV-OBJ-DATA-CATALOG-ENTRY")
      .dataCatalogContract.governedObjectIds.pop();
  });
  assertSemanticMutation("INVALID_D047_DATA_CATALOG", (model) => {
    objectById(model, "DGV-OBJ-DATA-CATALOG-ENTRY")
      .dataCatalogContract.activeClassification.cardinality = "ONE_OR_MORE";
  });
  assertSemanticMutation("INVALID_D047_DATA_CATALOG", (model) => {
    actionById(model, "DGV-ACT-SUPERSEDE-DATA-CATALOG")
      .atomicCatalogReplacement.commitMode = "SEQUENTIAL";
  });
  assertSemanticMutation("INVALID_D047_DATA_CATALOG", (model) => {
    model.optionSets.find(({ id }) => id === "OPT-BL2-003").values[0].code
      = "ORIGINAL_LEARNING_FACT";
  });
  assertSemanticMutation("INVALID_D047_DATA_CATALOG", (model) => {
    model.optionSets.find(({ id }) => id === "OPT-BL2-008").values[0].code
      = "PUBLIC";
  });
  assertSemanticMutation("INVALID_D047_DATA_CATALOG", (model) => {
    objectById(model, "GRD-OBJ-DECISION").dataNature = "AI_DERIVED_JUDGMENT";
  });
});

test("implements correction, restriction, physical deletion, and irreversible deidentification as distinct actions", () => {
  const actionKinds = GOVERNANCE_ACTION_IDS.map((id) => {
    const action = actionById(requirementModel, id);
    assert.equal(action.targetObjectId, "DGV-OBJ-DATA-GOVERNANCE-CASE", id);
    assert.equal(action.risk, "HIGH", id);
    return action.governanceActionKind;
  });
  assert.deepEqual(actionKinds, [
    "CORRECT",
    "RESTRICT_ACCESS",
    "PHYSICAL_DELETE",
    "IRREVERSIBLE_DEIDENTIFY",
  ]);
  assert.equal(new Set(actionKinds).size, 4);
});

test("binds every student-deletion decision to one source category and a completed identity gate", () => {
  const decision = objectById(requirementModel, "DGV-OBJ-STUDENT-DELETION-DECISION");
  assert.deepEqual(decision.studentDeletionDecisionContract.objectCategories, DELETION_OBJECT_CATEGORIES);
  assert.deepEqual(
    decision.studentDeletionDecisionContract.requiredBindingFieldIds,
    DELETION_BINDING_FIELD_IDS,
  );
  const finalize = actionById(requirementModel, "DGV-ACT-FINALIZE-STUDENT-DELETION-MATRIX");
  assert.deepEqual(finalize.requiredObjectCategories, DELETION_OBJECT_CATEGORIES);
  const identityDelete = actionById(requirementModel, "ACC-ACT-COMPLETE-IDENTITY-DELETION");
  assert.ok(identityDelete.relatedStateGuards.some((guard) => (
    guard.targetObjectId === "DGV-OBJ-STUDENT-DELETION-CASE"
      && guard.requiredState === "COMPLETED"
  )));
});

test("separates material provenance, rights bundle, and product management scope", () => {
  const module = moduleById(requirementModel, "CONTENT-001");
  assert.deepEqual(module.materialRightsContract, {
    sourceGraphObjectId: "CONTENT-OBJ-MATERIAL-SOURCE-GRAPH",
    rightsBundleObjectId: "CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE",
    managementScopeObjectId: "CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE",
    publicReviewObjectId: "CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW",
    rightsResolveActionId: "CONTENT-ACT-RESOLVE-MATERIAL-RIGHTS",
    requiredRelationshipIds: [
      "CONTENT-REL-RIGHTS-SOURCE-GRAPH",
      "CONTENT-REL-SCOPE-SOURCE-GRAPH",
      "CONTENT-REL-SCOPE-RIGHTS",
    ],
    ownerRefDerivesRights: false,
  });
  const resolve = actionById(requirementModel, module.materialRightsContract.rightsResolveActionId);
  assert.equal(resolve.targetObjectId, "CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE");
  assert.deepEqual(resolve.rightsResolution.sourceObjectIds, [
    "CONTENT-OBJ-MATERIAL-SOURCE-GRAPH",
    "CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE",
    "CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE",
  ]);
  assert.deepEqual(resolve.rightsResolution.resolvedMaterialIdentityFieldIds, [
    "CONTENT-SOURCE-F-ROOT-MATERIAL-ID",
    "CONTENT-RIGHTS-F-MATERIAL-ID",
    "CONTENT-SCOPE-F-MATERIAL-ID",
  ]);
  assert.deepEqual(resolve.rightsResolution.sourceGraphConsistencyFieldIds, [
    "CONTENT-RIGHTS-F-SOURCE-GRAPH-REF",
    "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
  ]);
  assert.equal(resolve.rightsResolution.exactVersionMatchRequired, true);
  assert.equal(resolve.rightsResolution.ownerRefUsage, "PROHIBITED");
});

test("creates an independently authorized, deidentified, purpose-limited, revocable student sample copy", () => {
  const sample = objectById(requirementModel, "CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY");
  assert.deepEqual(sample.sampleCopyContract, {
    authorizationObjectId: "CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION",
    independentCopyRequired: true,
    deidentificationRequired: true,
    purposeLimitRequired: true,
    withdrawalActionId: "CONTENT-ACT-WITHDRAW-STUDENT-SAMPLE-AUTHORIZATION",
    removalActionId: "CONTENT-ACT-REMOVE-STUDENT-SAMPLE-COPY",
  });
  const create = actionById(requirementModel, "CONTENT-ACT-CREATE-STUDENT-SAMPLE-COPY");
  assert.ok(create.relatedStateGuards.some((guard) => (
    guard.targetObjectId === "CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION"
      && guard.requiredState === "AUTHORIZED"
  )));
});

test("fails closed when student work is promoted to the platform public layer in phases one or two", () => {
  const promote = actionById(requirementModel, "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC");
  assert.deepEqual(promote.publicPromotionGuard, {
    sourceKindFieldId: "CONTENT-SOURCE-F-SOURCE-KIND",
    sourceGraphRefFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
    rightsBundleRefFieldId: "CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF",
    reviewRefFieldId: "CONTENT-SCOPE-F-PLATFORM-REVIEW-REF",
    sourceKindEligibilityBinding: {
      sourceGraphObjectId: "CONTENT-OBJ-MATERIAL-SOURCE-GRAPH",
      sourceGraphRefFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-REF",
      sourceGraphVersionFieldId: "CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION",
      sourceGraphSourceKindFieldId: "CONTENT-SOURCE-F-SOURCE-KIND",
      managementScopeMirrorFieldId: "CONTENT-SCOPE-F-SOURCE-KIND",
      comparison: "EXACT_CODE",
      exactVersionRequired: true,
      materialIdentityFallbackAllowed: false,
    },
    prohibitedSourceKinds: ["STUDENT_WORK"],
    prohibitedPhaseIds: ["PHASE-1", "PHASE-2"],
    requiredReviewKinds: ["SOURCE_RIGHTS", "PRIVACY", "CONTENT_QUALITY", "PLATFORM_AUTHORIZATION"],
  });
  assert.equal(promote.requiredManagementScopeCode, "PLATFORM_PUBLIC");
  assert.ok(promote.outputFieldIds.includes("CONTENT-SCOPE-F-PLATFORM-REVIEW-REF"));
  assert.ok(promote.outputFieldIds.includes("CONTENT-SCOPE-F-PLATFORM-REVIEW-VERSION"));
  assert.equal(
    scenarioFor(requirementModel, promote.id, "STUDENT_WORK_PUBLIC_PROHIBITED")
      ?.then.expectedState.mode,
    "UNCHANGED",
  );
});

test("rejects missing or duplicate governance decision owners globally", () => {
  assertSemanticMutation("INVALID_GOVERNANCE_BASELINE_OWNER", (model) => {
    moduleById(model, "DGV-001").governanceBaselineOwner.decisionIds = ["D047", "D048"];
  });
  assertSemanticMutation("INVALID_GOVERNANCE_BASELINE_OWNER", (model) => {
    moduleById(model, "ORG-001").governanceBaselineOwner = {
      moduleId: "ORG-001",
      decisionIds: ["D049"],
    };
  });
});

test("rejects every fail-open student deletion matrix mutation", () => {
  assertSemanticMutation("INVALID_D049_STUDENT_DELETION_MATRIX", (model) => {
    objectById(model, "DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT")
      .inventorySnapshotContract.hiddenObjectAllowed = true;
  });
  assertSemanticMutation("INVALID_D049_STUDENT_DELETION_MATRIX", (model) => {
    objectById(model, "DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT")
      .matrixAggregationContract.exactOneDecisionPerInventoryItem = false;
  });
  assertSemanticMutation("INVALID_D049_STUDENT_DELETION_MATRIX", (model) => {
    objectById(model, "DGV-OBJ-STUDENT-DELETION-CASE")
      .identityDeletionGate.nonReleasableDecisionStates = ["FROZEN"];
  });
  assertSemanticMutation("INVALID_D049_STUDENT_DELETION_MATRIX", (model) => {
    delete scenarioFor(
      model,
      "DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT",
      "FAILED_DECISION",
    ).failurePredicate;
  });
  assertSemanticMutation("INVALID_D049_STUDENT_DELETION_MATRIX", (model) => {
    actionById(model, "DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX")
      .relatedStateGuards[0].requiredState = "READY";
  });
});

test("rejects split-source material rights and owner-derived rights", () => {
  assertSemanticMutation("INVALID_D067_MATERIAL_RIGHTS", (model) => {
    actionById(model, "CONTENT-ACT-RESOLVE-MATERIAL-RIGHTS")
      .rightsResolution.sourceGraphConsistencyFieldIds.pop();
  });
  assertSemanticMutation("INVALID_D067_MATERIAL_RIGHTS", (model) => {
    actionById(model, "CONTENT-ACT-RESOLVE-MATERIAL-RIGHTS").targetObjectId =
      "CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE";
  });
  assertSemanticMutation("INVALID_D067_MATERIAL_RIGHTS", (model) => {
    moduleById(model, "CONTENT-001").relationships
      .find(({ id }) => id === "CONTENT-REL-SCOPE-RIGHTS").toObjectId =
      "CONTENT-OBJ-MATERIAL-SOURCE-GRAPH";
  });
});

test("rejects metadata-only or incompletely reviewed platform-public promotion", () => {
  assertSemanticMutation("INVALID_D069_NO_STUDENT_PUBLIC_PROMOTION", (model) => {
    actionById(model, "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC").metadataOnly = true;
  });
  assertSemanticMutation("INVALID_D069_NO_STUDENT_PUBLIC_PROMOTION", (model) => {
    actionById(model, "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC")
      .requiredManagementScopeCode = "SCHOOL_PRIVATE";
  });
  assertSemanticMutation("INVALID_D069_NO_STUDENT_PUBLIC_PROMOTION", (model) => {
    actionById(model, "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC")
      .relatedStateGuards = actionById(
        model,
        "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC",
      ).relatedStateGuards.filter(({ targetObjectId }) => (
        targetObjectId !== "CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW"
      ));
  });
  assertSemanticMutation("INVALID_D069_NO_STUDENT_PUBLIC_PROMOTION", (model) => {
    actionById(model, "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC")
      .publicPromotionGuard.sourceKindEligibilityBinding.sourceGraphRefFieldId =
      "CONTENT-SCOPE-F-MATERIAL-ID";
  });
  assertSemanticMutation("INVALID_D069_NO_STUDENT_PUBLIC_PROMOTION", (model) => {
    objectById(model, "CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE")
      .sourceKindEligibilityBinding.exactVersionRequired = false;
  });
});

test("semantic validation rejects destructive governance contract mutations", () => {
  assertSemanticMutation("INVALID_D019_SCHOOL_GOVERNANCE_ENTITY", (model) => {
    objectById(model, "ACC-OBJ-SCHOOL").fields = objectById(model, "ACC-OBJ-SCHOOL").fields
      .filter(({ id }) => id !== "ACC-SCHOOL-F-GOVERNANCE-BOUNDARY-ID");
  });
  assertSemanticMutation("INVALID_D020_SCHOOL_READINESS_AXES", (model) => {
    actionById(model, "ACC-ACT-ACTIVATE-SCHOOL-TEACHING").relatedStateGuards.pop();
  });
  assertSemanticMutation("INVALID_D027_D028_RESPONSIBILITY_DOMAINS", (model) => {
    moduleById(model, "TEA-001").responsibilityDomainContracts[0].fixedNavigationRequired = true;
  });
  assertSemanticMutation("INVALID_D039_NOTIFICATION_SEPARATION", (model) => {
    moduleById(model, "NOTI-001").operationalSeparationContract.deliveryObjectId = "NOTI-OBJ-NOTIFICATION";
  });
  assertSemanticMutation("INVALID_D041_ACCESSIBILITY_CONTRACT", (model) => {
    moduleById(model, "TEA-001").accessibilityContract.requiredCapabilities.pop();
  });
  assertSemanticMutation("INVALID_D047_DATA_CATALOG", (model) => {
    objectById(model, "DGV-OBJ-DATA-CATALOG-ENTRY").dataCatalogContract.axisFieldIds.pop();
  });
  assertSemanticMutation("INVALID_D048_GOVERNANCE_ACTIONS", (model) => {
    actionById(model, "DGV-ACT-PHYSICALLY-DELETE-DATA").governanceActionKind = "RESTRICT_ACCESS";
  });
  assertSemanticMutation("INVALID_D049_STUDENT_DELETION_MATRIX", (model) => {
    actionById(model, "DGV-ACT-FINALIZE-STUDENT-DELETION-MATRIX").requiredObjectCategories.pop();
  });
  assertSemanticMutation("INVALID_D067_MATERIAL_RIGHTS", (model) => {
    actionById(model, "CONTENT-ACT-RESOLVE-MATERIAL-RIGHTS").rightsResolution.ownerRefUsage = "DERIVE";
  });
  assertSemanticMutation("INVALID_D068_STUDENT_SAMPLE_COPY", (model) => {
    objectById(model, "CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY").sampleCopyContract.deidentificationRequired = false;
  });
  assertSemanticMutation("INVALID_D069_NO_STUDENT_PUBLIC_PROMOTION", (model) => {
    actionById(model, "CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC").publicPromotionGuard.prohibitedSourceKinds = [];
  });
});
