import test from "node:test";
import assert from "node:assert/strict";

import {
  MODEL_COLLECTIONS,
  PHASE,
  RELEASE_STATUS,
} from "../requirements-v2/model.mjs";
import { validateRequirementModel } from "../requirements-v2/validate/index.mjs";
import { prepareRequirementModel } from "../requirements-v2/validate/structure-validator.mjs";

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

test("exports the finalized phase and release-status constants", () => {
  assert.deepEqual(PHASE, { FIRST: 1, SECOND: 2, THIRD: 3 });
  assert.deepEqual(RELEASE_STATUS, {
    BUILD_READY: "BUILD_READY",
    PLANNED: "PLANNED",
  });
  assert.equal(Object.isFrozen(PHASE), true);
  assert.equal(Object.isFrozen(RELEASE_STATUS), true);
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

test("preserves the legacy missing-model collection error contract", () => {
  for (const collection of LEGACY_MODEL_COLLECTIONS) {
    const fixture = validFixture();
    fixture.modules = [];
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
