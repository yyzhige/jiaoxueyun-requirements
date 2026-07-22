import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import {
  validateDataCatalogGovernance,
} from "../requirements-v2/validate/data-catalog-governance-validator.mjs";

function objectById(model, objectId) {
  return model.modules.flatMap(({ objects }) => objects)
    .find(({ id }) => id === objectId);
}

function actionById(model, actionId) {
  return model.modules.flatMap(({ actions }) => actions)
    .find(({ id }) => id === actionId);
}

function scenarioFor(model, actionId, resultCode) {
  return model.modules.flatMap(({ scenarios }) => scenarios)
    .find((scenario) => scenario.actionId === actionId && scenario.resultCode === resultCode);
}

function assertRejected(mutator, evidence) {
  const model = structuredClone(requirementModel);
  mutator(model);
  const errors = validateDataCatalogGovernance(model);
  assert.ok(errors.some((error) => (
    error.startsWith("INVALID_D047_DATA_CATALOG_EXECUTION")
    && (!evidence || error.includes(evidence))
  )), errors.join("\n"));
}

test("partitions every governed object by its real control subject and scope authority", () => {
  const catalog = objectById(requirementModel, "DGV-OBJ-DATA-CATALOG-ENTRY");
  const contract = catalog.dataCatalogContract;
  assert.equal(catalog.controlSubject, "PLATFORM");
  for (const property of ["producerRef", "ownerRef", "confirmerRef", "stewardRef"]) {
    assert.equal(catalog[property], "ROLE-PLATFORM-GOVERNANCE", property);
  }
  assert.deepEqual(contract.classificationKey, {
    scope: "CONTROL_SUBJECT_PARTITION",
    fieldIds: [
      "DGV-CATALOG-F-CONTROL-SUBJECT",
      "DGV-CATALOG-F-CONTROL-SCOPE-REF",
      "DGV-CATALOG-F-SOURCE-OBJECT-KIND",
    ],
  });
  assert.deepEqual(contract.coveragePartitions.map((partition) => ({
    controlSubject: partition.controlSubject,
    managementScopeCode: partition.managementScopeCode,
    scopeRefKind: partition.scopeRefKind,
    authorizedActorRef: partition.authorizedActorRef,
  })), [
    {
      controlSubject: "SCHOOL",
      managementScopeCode: "SCHOOL_PRIVATE",
      scopeRefKind: "SCHOOL_ID",
      authorizedActorRef: "ROLE-SCHOOL-ADMIN",
    },
    {
      controlSubject: "PLATFORM",
      managementScopeCode: "PLATFORM_GOVERNANCE",
      scopeRefKind: "PLATFORM_TENANT_ID",
      authorizedActorRef: "ROLE-PLATFORM-GOVERNANCE",
    },
    {
      controlSubject: "STUDENT",
      managementScopeCode: "STUDENT_MEMORY",
      scopeRefKind: "STUDENT_ID",
      authorizedActorRef: "ROLE-PLATFORM-GOVERNANCE",
    },
  ]);
  assert.deepEqual(catalog.catalogPartitionAuthorization, {
    controlSubjectFieldId: "DGV-CATALOG-F-CONTROL-SUBJECT",
    scopeRefFieldId: "DGV-CATALOG-F-CONTROL-SCOPE-REF",
    crossPartitionEffect: "DENY",
    actorMappings: [
      { controlSubject: "SCHOOL", actorRef: "ROLE-SCHOOL-ADMIN" },
      { controlSubject: "PLATFORM", actorRef: "ROLE-PLATFORM-GOVERNANCE" },
      { controlSubject: "STUDENT", actorRef: "ROLE-PLATFORM-GOVERNANCE" },
    ],
  });
  assert.equal(
    catalog.catalogEntryResponsibilityContract.responsibilitySource,
    "CONTROL_SUBJECT_PARTITION",
  );
  assert.equal(
    catalog.catalogEntryResponsibilityContract.crossPartitionEffect,
    "DENY",
  );
  const registeredIds = contract.coveragePartitions
    .flatMap(({ governedObjectIds }) => governedObjectIds);
  const allObjectIds = requirementModel.modules
    .flatMap(({ objects }) => objects.map(({ id }) => id));
  const studentPartition = contract.coveragePartitions
    .find(({ controlSubject }) => controlSubject === "STUDENT");
  assert.ok(
    studentPartition.governedObjectIds.includes(
      "IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION",
    ),
  );
  assert.equal(new Set(registeredIds).size, registeredIds.length);
  assert.deepEqual(registeredIds.toSorted(), allObjectIds.toSorted());
  assert.deepEqual(contract.governedObjectIds, allObjectIds.toSorted());
  assert.deepEqual(validateDataCatalogGovernance(requirementModel), []);
});

test("binds every catalog action permission and responsibility snapshot to one controlSubject", () => {
  const catalog = objectById(requirementModel, "DGV-OBJ-DATA-CATALOG-ENTRY");
  const catalogActions = requirementModel.modules
    .flatMap(({ actions }) => actions)
    .filter(({ targetObjectId }) => targetObjectId === catalog.id);
  const expectedMappings = [
    ["SCHOOL", "ROLE-SCHOOL-ADMIN"],
    ["PLATFORM", "ROLE-PLATFORM-GOVERNANCE"],
    ["STUDENT", "ROLE-PLATFORM-GOVERNANCE"],
  ];
  assert.equal(catalogActions.length, 4);
  for (const action of catalogActions) {
    assert.deepEqual(action.catalogPartitionAuthorization, catalog.catalogPartitionAuthorization);
    assert.deepEqual(
      action.catalogEntryResponsibilityContract,
      catalog.catalogEntryResponsibilityContract,
    );
    const allows = action.permissions.filter(({ effect }) => effect === "ALLOW");
    assert.equal(allows.length, expectedMappings.length, action.id);
    for (const [controlSubject, actorRef] of expectedMappings) {
      const permission = allows.find((candidate) => (
        candidate.roleRef === actorRef
        && candidate.scope?.controlSubject === controlSubject
      ));
      assert.ok(permission, `${action.id}:${controlSubject}`);
      assert.deepEqual(permission.scope, {
        kind: "CATALOG_CONTROL_SUBJECT_PARTITION",
        controlSubject,
        controlSubjectFieldId: "DGV-CATALOG-F-CONTROL-SUBJECT",
        scopeRefFieldId: "DGV-CATALOG-F-CONTROL-SCOPE-REF",
        subjectMatch: "REQUIRED",
        scopeMatch: "REQUIRED",
        crossPartitionEffect: "DENY",
      });
    }
  }
});

test("version-pins an ACTIVE catalog and binds object kind plus governance scope on all four actions", () => {
  const governanceCase = objectById(requirementModel, "DGV-OBJ-DATA-GOVERNANCE-CASE");
  const refField = governanceCase.fields.find(({ id }) => (
    id === "DGV-GOVCASE-F-CATALOG-ENTRY-REF"
  ));
  assert.equal(refField.valueSource.kind, "OBJECT_REF");
  assert.equal(refField.valueSource.targetObjectId, "DGV-OBJ-DATA-CATALOG-ENTRY");
  assert.equal(refField.referenceIntegrity, "VERSION_PINNED");
  assert.equal(governanceCase.catalogExecutionContract.requiredCatalogState, "ACTIVE");
  assert.equal(governanceCase.catalogExecutionContract.requiredActiveMatchCount, 1);
  assert.equal(
    governanceCase.catalogExecutionContract.sourceObjectKindMustEqualTargetObjectKind,
    true,
  );
  assert.equal(governanceCase.catalogExecutionContract.controlScopeMustEqualTargetControlScope, true);

  const governanceActions = requirementModel.modules
    .flatMap(({ actions }) => actions)
    .filter(({ targetObjectId, governanceActionKind }) => (
      targetObjectId === governanceCase.id && governanceActionKind
    ));
  assert.equal(governanceActions.length, 4);
  for (const action of governanceActions) {
    assert.ok(action.relatedStateGuards.some((guard) => (
      guard.refFieldId === "DGV-GOVCASE-F-CATALOG-ENTRY-REF"
      && guard.versionFieldId === "DGV-GOVCASE-F-CATALOG-ENTRY-VERSION"
      && guard.requiredState === "ACTIVE"
    )), action.id);
    for (const resultCode of [
      "CATALOG_NOT_ACTIVE",
      "CATALOG_VERSION_STALE",
      "CATALOG_OBJECT_KIND_MISMATCH",
      "CATALOG_SCOPE_MISMATCH",
      "ACTIVE_CATALOG_NOT_UNIQUE",
    ]) {
      assert.ok(action.failureResults.includes(resultCode), `${action.id}:${resultCode}`);
      assert.equal(scenarioFor(requirementModel, action.id, resultCode).kind, "BOUNDARY");
      assert.equal(
        scenarioFor(requirementModel, action.id, resultCode).then.expectedPermission,
        "DENY",
      );
    }
  }
});

test("rejects missing, duplicate, or cross-partition catalog coverage", () => {
  assertRejected((model) => {
    objectById(model, "DGV-OBJ-DATA-CATALOG-ENTRY")
      .dataCatalogContract.coveragePartitions[0].governedObjectIds.pop();
  }, "does not exactly cover");
  assertRejected((model) => {
    const contract = objectById(model, "DGV-OBJ-DATA-CATALOG-ENTRY").dataCatalogContract;
    contract.coveragePartitions[1].governedObjectIds.push(
      contract.coveragePartitions[0].governedObjectIds[0],
    );
  });
  assertRejected((model) => {
    objectById(model, "DGV-OBJ-DATA-CATALOG-ENTRY")
      .dataCatalogContract.coveragePartitions[2].managementScopeCode = "SCHOOL_PRIVATE";
  }, "invalid management scope");
  assertRejected((model) => {
    objectById(model, "DGV-OBJ-DATA-CATALOG-ENTRY")
      .dataCatalogContract.classificationKey.scope = "CURRENT_SCHOOL";
  }, "control-subject partition key");
});

test("rejects DRAFT or SUPERSEDED catalogs, stale versions, and non-unique ACTIVE resolution", () => {
  assertRejected((model) => {
    actionById(model, "DGV-ACT-CORRECT-DATA")
      .relatedStateGuards[0].requiredState = "DRAFT";
  }, "DGV-ACT-CORRECT-DATA");
  assertRejected((model) => {
    actionById(model, "DGV-ACT-RESTRICT-DATA-ACCESS")
      .relatedStateGuards[0].requiredState = "SUPERSEDED";
  }, "DGV-ACT-RESTRICT-DATA-ACCESS");
  assertRejected((model) => {
    const ref = objectById(model, "DGV-OBJ-DATA-GOVERNANCE-CASE").fields
      .find(({ id }) => id === "DGV-GOVCASE-F-CATALOG-ENTRY-REF");
    ref.versionBinding.targetVersionFieldId = "DGV-CATALOG-F-STATUS";
  }, "version-pin");
  for (const requiredMatchCount of [0, 2]) {
    assertRejected((model) => {
      objectById(model, "DGV-OBJ-DATA-GOVERNANCE-CASE")
        .catalogExecutionContract.requiredActiveMatchCount = requiredMatchCount;
    }, "equality contract");
    assertRejected((model) => {
      actionById(model, "DGV-ACT-RESOLVE-DATA-CATALOG")
        .activeClassificationLookup.requiredMatchCount = requiredMatchCount;
    }, "exactly one ACTIVE");
  }
});

test("rejects wrong catalog objects, object-kind mismatches, scope widening, and missing fail-closed paths", () => {
  assertRejected((model) => {
    const ref = objectById(model, "DGV-OBJ-DATA-GOVERNANCE-CASE").fields
      .find(({ id }) => id === "DGV-GOVCASE-F-CATALOG-ENTRY-REF");
    ref.valueSource.targetObjectId = "DGV-OBJ-POLICY";
  }, "version-pin");
  assertRejected((model) => {
    objectById(model, "DGV-OBJ-DATA-GOVERNANCE-CASE")
      .catalogExecutionContract.sourceObjectKindMustEqualTargetObjectKind = false;
  }, "equality contract");
  assertRejected((model) => {
    objectById(model, "DGV-OBJ-DATA-GOVERNANCE-CASE")
      .catalogExecutionContract.controlScopeMustEqualTargetControlScope = false;
  }, "equality contract");
  assertRejected((model) => {
    actionById(model, "DGV-ACT-PHYSICALLY-DELETE-DATA")
      .catalogExecutionGuard.catalogControlScopeFieldId = "DGV-CATALOG-F-MANAGEMENT-SCOPE";
  }, "DGV-ACT-PHYSICALLY-DELETE-DATA");
  assertRejected((model) => {
    const action = actionById(model, "DGV-ACT-IRREVERSIBLY-DEIDENTIFY-DATA");
    action.failureResults = action.failureResults
      .filter((code) => code !== "CATALOG_OBJECT_KIND_MISMATCH");
  }, "CATALOG_OBJECT_KIND_MISMATCH");
});

test("rejects actor partition misbindings, cross-partition widening, and school ownership of the schema", () => {
  assertRejected((model) => {
    objectById(model, "DGV-OBJ-DATA-CATALOG-ENTRY")
      .catalogPartitionAuthorization.actorMappings[0].actorRef =
        "ROLE-PLATFORM-GOVERNANCE";
  }, "catalogPartitionAuthorization");
  assertRejected((model) => {
    objectById(model, "DGV-OBJ-DATA-CATALOG-ENTRY")
      .catalogEntryResponsibilityContract.responsibilityMappings[2].ownerRef =
        "ROLE-SCHOOL-ADMIN";
  }, "catalogEntryResponsibilityContract");
  assertRejected((model) => {
    actionById(model, "DGV-ACT-REGISTER-DATA-CATALOG")
      .catalogPartitionAuthorization.crossPartitionEffect = "ALLOW";
  }, "complete catalog partition authorization");
  assertRejected((model) => {
    const permission = actionById(model, "DGV-ACT-ACTIVATE-DATA-CATALOG")
      .permissions.find(({ scope }) => scope?.controlSubject === "SCHOOL");
    permission.roleRef = "ROLE-PLATFORM-GOVERNANCE";
  }, "exactly one declared controlSubject");
  assertRejected((model) => {
    const permission = actionById(model, "DGV-ACT-SUPERSEDE-DATA-CATALOG")
      .permissions.find(({ scope }) => scope?.controlSubject === "STUDENT");
    permission.scope.crossPartitionEffect = "ALLOW";
  }, "exactly one declared controlSubject");
  for (const property of ["ownerRef", "stewardRef"]) {
    assertRejected((model) => {
      objectById(model, "DGV-OBJ-DATA-CATALOG-ENTRY")[property] = "ROLE-SCHOOL-ADMIN";
    }, "schema responsibility");
  }
});
