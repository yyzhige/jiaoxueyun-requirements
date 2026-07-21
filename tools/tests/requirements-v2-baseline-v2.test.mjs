import test from "node:test";
import assert from "node:assert/strict";

import {
  MODEL_COLLECTIONS,
  PHASE,
  RELEASE_STATUS,
} from "../requirements-v2/model.mjs";
import { validateRequirementModel } from "../requirements-v2/validate/index.mjs";
import { prepareRequirementModel } from "../requirements-v2/validate/structure-validator.mjs";
import {
  baselineChapters,
  baselineDecisions,
  launchGates,
  metricGroups,
  metrics,
  migrationChanges,
  phases,
  productBaseline,
  productDecisions,
  requirementModel,
} from "../requirements-v2/facts/index.mjs";

const NEW_BASELINE_COLLECTIONS = [
  "phases",
  "productDecisions",
  "baselineChapters",
  "migrationChanges",
  "metricGroups",
  "launchGates",
];

const LEGACY_MODEL_COLLECTIONS = [
  "baselineDecisions",
  "roles",
  "duties",
  "lifecyclePolicies",
  "sensitivities",
  "optionSets",
  "events",
  "metrics",
  "nfrs",
  "modules",
  "flows",
  "aiTasks",
  "extensions",
];

const EXPECTED_BASELINE_CHAPTER_IDS = [
  "BASE-CH-PRINCIPLES",
  "BASE-CH-PRINCIPLES-AI-NATIVE",
  "BASE-CH-PRINCIPLES-HUMAN-RESPONSIBILITY",
  "BASE-CH-PRINCIPLES-CHANGE-CONTROL",
  "BASE-CH-SCOPE-PHASES",
  "BASE-CH-SCOPE-GRADES-SUBJECTS",
  "BASE-CH-PHASE-1",
  "BASE-CH-PHASE-2",
  "BASE-CH-PHASE-3",
  "BASE-CH-DATA-KNOWLEDGE",
  "BASE-CH-COGNITION-LAYERS",
  "BASE-CH-MATERIAL-RIGHTS",
  "BASE-CH-CAPABILITY-MAPPING",
  "BASE-CH-SCHOOL-GOVERNANCE",
  "BASE-CH-SCHOOL-ACTIVATION",
  "BASE-CH-TEACHING-RELATIONSHIPS",
  "BASE-CH-PERMISSION-GOVERNANCE",
  "BASE-CH-IDENTITY-GUARDIAN",
  "BASE-CH-IDENTITY-SEPARATION",
  "BASE-CH-LOGIN-RECOVERY",
  "BASE-CH-ROSTER-CLAIM",
  "BASE-CH-GUARDIAN-ASSISTANCE",
  "BASE-CH-ROLE",
  "BASE-CH-TEACHER-EXPERIENCE",
  "BASE-CH-STUDENT-EXPERIENCE",
  "BASE-CH-NOTIFICATION-ACCESSIBILITY",
  "BASE-CH-ACTIVITY-EVIDENCE",
  "BASE-CH-ACTIVITY-PURPOSE",
  "BASE-CH-ACTIVITY-LIFECYCLE",
  "BASE-CH-ORIGINAL-SUBMISSION",
  "BASE-CH-TIMELINESS-CORRECTION",
  "BASE-CH-HELP-EVIDENCE",
  "BASE-CH-AI-ASSESSMENT",
  "BASE-CH-ASSESSMENT-RUBRIC",
  "BASE-CH-ASSESSMENT-RESULT",
  "BASE-CH-FEEDBACK-ANSWER",
  "BASE-CH-AI-SAFETY-BOUNDARY",
  "BASE-CH-VIDEO",
  "BASE-CH-VIDEO-TYPES",
  "BASE-CH-VIDEO-ASSET-ACCESS",
  "BASE-CH-VIDEO-VERIFICATION",
  "BASE-CH-PROGRESS",
  "BASE-CH-DUAL-PROGRESS",
  "BASE-CH-MASTERY-VISIBILITY",
  "BASE-CH-CORRECTION-REVIEW",
  "BASE-CH-DATA-RIGHTS",
  "BASE-CH-TRANSFER-HISTORY",
  "BASE-CH-DELETION",
  "BASE-CH-SEARCH-EXPORT",
  "BASE-CH-EXTERNAL-AI",
  "BASE-CH-COMMERCIAL",
  "BASE-CH-LAYERED-GOVERNANCE",
  "BASE-CH-COMMERCIAL-BOUNDARY",
  "BASE-CH-VIDEO-QUOTA",
  "BASE-CH-LAUNCH",
  "BASE-CH-METRICS",
  "BASE-CH-LAUNCH-GATES",
];

function validFixture(overrides = {}) {
  const module = {
    id: "BASELINE-MODULE-001",
    phase: PHASE.FIRST,
    releaseStatus: RELEASE_STATUS.BUILD_READY,
    priority: "P0",
    title: "Baseline contract fixture",
    objective: "Exercise the finalized baseline structure contract",
    entryConditions: ["the baseline is approved"],
    exitConditions: ["the baseline structure is valid"],
    baselineDecisionIds: ["BASELINE-DECISION-001"],
    nfrIds: ["NFR-001"],
    objects: [],
    relationships: [],
    actions: [],
    pages: [],
    scenarios: [],
    ...overrides,
  };

  return {
    profile: "GENERIC",
    currentReleaseModuleIds: module.releaseStatus === RELEASE_STATUS.BUILD_READY
      ? [module.id]
      : [],
    baselineDecisions: [{
      id: "BASELINE-DECISION-001",
      statement: "the baseline contract is explicit",
      rationale: "the fixture must satisfy its own references",
      immutable: true,
    }],
    roles: [],
    duties: [],
    lifecyclePolicies: [],
    sensitivities: [],
    optionSets: [],
    events: [],
    metrics: [],
    nfrs: [{
      id: "NFR-001",
      statement: "the baseline contract remains deterministic",
      verification: "run the model validation suite",
    }],
    modules: [module],
    flows: [],
    aiTasks: [],
    extensions: [],
    phases: [],
    productDecisions: [],
    baselineChapters: [],
    migrationChanges: [],
    metricGroups: [],
    launchGates: [],
  };
}

function errorCodes(errors) {
  return errors.map((error) => error.split(" ", 1)[0]);
}

function assertHasCode(errors, code) {
  assert.ok(errorCodes(errors).includes(code), errors.join("\n"));
}

function assertOnlyCode(errors, code) {
  assert.deepEqual(errorCodes(errors), [code], errors.join("\n"));
}

function plannedDgvFixture(phase) {
  const model = structuredClone(requirementModel);
  const module = model.modules.find(({ id }) => id === "DGV-001");
  module.phase = phase;
  module.releaseStatus = RELEASE_STATUS.PLANNED;
  module.pages.forEach((page) => { page.availability = RELEASE_STATUS.PLANNED; });
  model.currentReleaseModuleIds = model.currentReleaseModuleIds
    .filter((id) => id !== module.id);
  return { model, module };
}

test("exports the finalized phase and release-status constants", () => {
  assert.deepEqual(PHASE, { FIRST: 1, SECOND: 2, THIRD: 3 });
  assert.deepEqual(RELEASE_STATUS, {
    BUILD_READY: "BUILD_READY",
    PLANNED: "PLANNED",
  });
  assert.equal(Object.isFrozen(PHASE), true);
  assert.equal(Object.isFrozen(RELEASE_STATUS), true);
});

test("encodes the finalized README v2.0 baseline and all D003-D096 decisions", () => {
  assert.deepEqual(productBaseline, {
    id: "ZHIXU-PRODUCT-BASELINE-V2",
    version: "v2.0",
    decisionState: "finalized",
    baselineDate: "2026-07-20",
    sourcePath: "/Users/a1234/Desktop/student/README.md",
  });
  assert.deepEqual(phases.map(({ id }) => id), ["PHASE-1", "PHASE-2", "PHASE-3"]);
  assert.deepEqual(
    productDecisions.map(({ id }) => id),
    Array.from({ length: 94 }, (_, index) => `D${String(index + 3).padStart(3, "0")}`),
  );
  for (const decision of productDecisions) {
    for (const property of ["statement", "selectedRoute", "rejectedRoutes", "sourceSection", "phaseIds", "chapterIds"]) {
      assert.ok(Object.hasOwn(decision, property), `${decision.id}.${property}`);
    }
  }
});

test("registers every README heading through 产品验收与上线门 with source anchors", () => {
  assert.deepEqual(
    baselineChapters.map(({ id }) => id),
    EXPECTED_BASELINE_CHAPTER_IDS,
  );
  assert.equal(new Set(baselineChapters.map(({ sourceLine }) => sourceLine)).size, baselineChapters.length);
  for (const chapter of baselineChapters) {
    assert.equal(chapter.sourcePath, "/Users/a1234/Desktop/student/README.md");
    assert.match(chapter.sourceAnchor, /^README\.md:\d+$/);
    assert.ok(chapter.phaseIds.length > 0, chapter.id);
  }
});

test("publishes migration changes, six metric groups, and three launch gates", () => {
  assert.ok(migrationChanges.length >= 20);
  for (const change of migrationChanges) {
    assert.ok(change.decisionIds.length > 0, change.id);
    assert.ok(change.oldRule && change.newRule && change.rejectedReason, change.id);
    assert.deepEqual(
      Object.keys(change.affected).sort(),
      ["actionIds", "flowIds", "metricIds", "moduleIds", "objectIds", "pageIds", "permissionActionIds", "scenarioIds", "stateRefs", "testIds"],
    );
  }
  assert.deepEqual(metricGroups.map(({ id }) => id), [
    "MET-GROUP-USER-CLOSURE",
    "MET-GROUP-FACT-RELIABILITY",
    "MET-GROUP-AI-TEACHING-QUALITY",
    "MET-GROUP-SAFETY-DATA-RIGHTS",
    "MET-GROUP-FAIRNESS-ACCESSIBILITY",
    "MET-GROUP-TEACHER-SCHOOL-EFFICIENCY",
  ]);
  assert.ok(metricGroups.every(({ metricIds }) => metricIds.length > 0));
  assert.deepEqual(launchGates.map(({ id }) => id), [
    "GATE-ZERO-TOLERANCE",
    "GATE-QUALITY-THRESHOLD",
    "GATE-EVIDENCE-COMPLETENESS",
  ]);
  assert.ok(launchGates.every(({ blockingConditions, evidenceRequirements, ownerRef }) => (
    blockingConditions.length > 0 && evidenceRequirements.length > 0 && ownerRef
  )));
  assert.ok(metrics.every(({ groupId, phaseId }) => groupId && phaseId));
});

test("rejects baseline decisions, metadata, and metric contracts with unresolved references", () => {
  const unknownDecisionPhase = structuredClone(requirementModel);
  unknownDecisionPhase.productDecisions[0].phaseIds = ["PHASE-UNKNOWN"];
  assertHasCode(validateRequirementModel(unknownDecisionPhase), "MISSING_PRODUCT_DECISION_PHASE");

  const unknownDecisionChapter = structuredClone(requirementModel);
  unknownDecisionChapter.productDecisions[0].chapterIds = ["BASE-CH-UNKNOWN"];
  assertHasCode(validateRequirementModel(unknownDecisionChapter), "MISSING_PRODUCT_DECISION_CHAPTER");

  const invalidMetadata = structuredClone(requirementModel);
  invalidMetadata.productBaseline.version = "v1.0";
  assertHasCode(validateRequirementModel(invalidMetadata), "INVALID_BASELINE_METADATA");

  const invalidInvariantPhase = structuredClone(requirementModel);
  invalidInvariantPhase.productInvariants[0].phaseIds = ["PHASE-UNKNOWN"];
  assertHasCode(validateRequirementModel(invalidInvariantPhase), "MISSING_PRODUCT_INVARIANT_PHASE");

  const invalidMetadataShape = structuredClone(requirementModel);
  invalidMetadataShape.productBaseline.unexpected = true;
  assertHasCode(validateRequirementModel(invalidMetadataShape), "INVALID_ENTITY_SHAPE");

  const invalidMetric = structuredClone(requirementModel);
  delete invalidMetric.metrics[0].groupId;
  assertHasCode(validateRequirementModel(invalidMetric), "INVALID_ENTITY_SHAPE");
  assertHasCode(validateRequirementModel(invalidMetric), "MISSING_METRIC_GROUP");

  const invalidGroup = structuredClone(requirementModel);
  invalidGroup.metricGroups[0].metricIds = [];
  assertHasCode(validateRequirementModel(invalidGroup), "INVALID_ENTITY_SHAPE");
});

test("replaces the baseline rules that conflict with README v2.0", () => {
  const byId = new Map(baselineDecisions.map((entry) => [entry.id, entry.statement]));
  assert.match(byId.get("BASE-003"), /事实|原始材料/);
  assert.doesNotMatch(byId.get("BASE-003"), /主观判断保留教师确认/);
  assert.match(byId.get("BASE-008"), /概览/);
  assert.doesNotMatch(byId.get("BASE-008"), /可读取本班全体学生和全学科信息/);
  assert.match(byId.get("BASE-010"), /第二阶段/);
});

test("publishes and requires all baseline-v2 top-level collections", () => {
  const collectionKeys = MODEL_COLLECTIONS.map(({ key }) => key);

  for (const collection of NEW_BASELINE_COLLECTIONS) {
    assert.ok(collectionKeys.includes(collection), collection);

    const fixture = validFixture();
    delete fixture[collection];
    assertOnlyCode(
      validateRequirementModel(fixture),
      "MISSING_REQUIRED_COLLECTION",
    );
  }
});

test("rejects primitive and null elements in every baseline-v2 collection", () => {
  for (const collection of NEW_BASELINE_COLLECTIONS) {
    for (const invalidElement of [null, 7, "x", {}]) {
      const fixture = validFixture();
      fixture[collection] = [invalidElement];
      assertHasCode(
        validateRequirementModel(fixture),
        "INVALID_ENTITY_SHAPE",
      );
    }
  }
});

test("preserves the legacy missing-model collection error contract", () => {
  for (const collection of LEGACY_MODEL_COLLECTIONS) {
    const fixture = validFixture();
    fixture.modules = [];
    fixture.currentReleaseModuleIds = [];
    delete fixture[collection];
    assertOnlyCode(
      validateRequirementModel(fixture),
      "MISSING_MODEL_COLLECTION",
    );
  }
});

test("accepts the complete minimal baseline-v2 fixture", () => {
  assert.deepEqual(prepareRequirementModel(validFixture()).errors, []);
  assert.deepEqual(validateRequirementModel(validFixture()), []);
});

test("rejects missing and unknown module phases", () => {
  for (const phase of [undefined, null, 0, 4, "1"]) {
    const fixture = validFixture();
    if (phase === undefined) delete fixture.modules[0].phase;
    else fixture.modules[0].phase = phase;

    assertOnlyCode(
      validateRequirementModel(fixture),
      "INVALID_MODULE_PHASE",
    );
  }
});

test("rejects missing and unknown module release statuses", () => {
  for (const releaseStatus of [undefined, null, "", "BUILDING", {}]) {
    const fixture = validFixture();
    if (releaseStatus === undefined) delete fixture.modules[0].releaseStatus;
    else fixture.modules[0].releaseStatus = releaseStatus;
    fixture.currentReleaseModuleIds = releaseStatus === RELEASE_STATUS.BUILD_READY
      ? [fixture.modules[0].id]
      : [];

    assertOnlyCode(
      validateRequirementModel(fixture),
      "INVALID_PHASE_RELEASE_STATUS",
    );
  }
});

test("enforces the closed phase and release-status combinations", () => {
  for (const [phase, releaseStatus] of [
    [PHASE.FIRST, RELEASE_STATUS.PLANNED],
    [PHASE.SECOND, RELEASE_STATUS.BUILD_READY],
    [PHASE.THIRD, RELEASE_STATUS.BUILD_READY],
  ]) {
    assertOnlyCode(
      validateRequirementModel(validFixture({ phase, releaseStatus })),
      "INVALID_PHASE_RELEASE_STATUS",
    );
  }

  for (const [phase, releaseStatus] of [
    [PHASE.FIRST, RELEASE_STATUS.BUILD_READY],
    [PHASE.SECOND, RELEASE_STATUS.PLANNED],
    [PHASE.THIRD, RELEASE_STATUS.PLANNED],
  ]) {
    assert.deepEqual(
      validateRequirementModel(validFixture({ phase, releaseStatus })),
      [],
    );
  }
});

test("keeps malformed and null inputs deterministic", () => {
  assert.deepEqual(prepareRequirementModel(null), {
    errors: ["INVALID_MODEL requirement model must be an object"],
    model: null,
  });

  const fixture = validFixture();
  fixture.modules = [null];
  assert.doesNotThrow(() => prepareRequirementModel(fixture));
  assertHasCode(prepareRequirementModel(fixture).errors, "INVALID_ENTITY_SHAPE");
});

test("requires an explicit current-release manifest and excludes planned modules", () => {
  const missing = validFixture();
  delete missing.currentReleaseModuleIds;
  assertHasCode(
    validateRequirementModel(missing),
    "INVALID_CURRENT_RELEASE_MANIFEST",
  );

  const planned = validFixture({
    phase: PHASE.SECOND,
    releaseStatus: RELEASE_STATUS.PLANNED,
  });
  planned.currentReleaseModuleIds = [planned.modules[0].id];
  assertHasCode(
    validateRequirementModel(planned),
    "INVALID_CURRENT_RELEASE_MANIFEST",
  );
});

test("requires planned pages to declare planned availability for phase two and three", () => {
  for (const phase of [PHASE.SECOND, PHASE.THIRD]) {
    const { model, module } = plannedDgvFixture(phase);
    module.pages.forEach((page) => { delete page.availability; });

    assertHasCode(
      validateRequirementModel(model),
      "INVALID_PAGE_AVAILABILITY",
    );
  }
});

test("fully validates executable planned modules in phase two and three", () => {
  for (const phase of [PHASE.SECOND, PHASE.THIRD]) {
    const { model } = plannedDgvFixture(phase);
    assert.deepEqual(validateRequirementModel(model), []);

    const invalidAction = plannedDgvFixture(phase);
    delete invalidAction.module.actions[0].operationKind;
    assertHasCode(
      validateRequirementModel(invalidAction.model),
      "INVALID_ACTION_CONTRACT",
    );

    const invalidPage = plannedDgvFixture(phase);
    delete invalidPage.module.pages[0].label;
    assertHasCode(
      validateRequirementModel(invalidPage.model),
      "INVALID_PAGE_CONTRACT",
    );
  }
});

test("rejects a build-ready Flow that contains a planned action", () => {
  const model = structuredClone(requirementModel);
  const flow = model.flows.find(({ steps }) => steps.some(({ actionId }) => actionId));
  const actionId = flow.steps.find(({ actionId }) => actionId)?.actionId;
  const actionModule = model.modules.find(({ actions }) => (
    actions.some(({ id }) => id === actionId)
  ));
  actionModule.phase = PHASE.SECOND;
  actionModule.releaseStatus = RELEASE_STATUS.PLANNED;
  actionModule.pages.forEach((page) => { page.availability = RELEASE_STATUS.PLANNED; });
  model.currentReleaseModuleIds = model.currentReleaseModuleIds
    .filter((id) => id !== actionModule.id);

  assertHasCode(
    validateRequirementModel(model),
    "INVALID_FLOW_RELEASE_BOUNDARY",
  );
});

test("rejects current modules that depend on planned modules", () => {
  const model = structuredClone(requirementModel);
  model.modules.find(({ id }) => id === "DGV-001").dependencyModuleIds = [
    "REPORT-001",
  ];

  assertHasCode(
    validateRequirementModel(model),
    "PHASE_DEPENDENCY_MISMATCH",
  );
});
