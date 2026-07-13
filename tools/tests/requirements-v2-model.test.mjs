import test from "node:test";
import assert from "node:assert/strict";

import { validateRequirementModel } from "../requirements-v2/validate/index.mjs";
import {
  CLIENT,
  PHASE,
  RISK,
  defineModule,
  defineRequirementModel,
} from "../requirements-v2/model.mjs";

function validFixture() {
  return {
    roles: [{ id: "ROLE-STUDENT", label: "student" }],
    duties: [],
    optionSets: [{
      id: "OPT-BOOL",
      values: [{ code: "YES", label: "yes" }],
    }],
    metrics: [{
      id: "MET-TEST",
      ownerRef: "ROLE-STUDENT",
      eventIds: ["EVT-TEST-START", "EVT-TEST-END"],
      scope: "fixture",
      aggregation: "duration",
      target: "defined",
    }],
    modules: [{
      id: "SUB-001",
      phase: PHASE.FIRST,
      objects: [{
        id: "DAT-SUB-01",
        ownerRef: "ROLE-STUDENT",
        confirmerRef: "ROLE-STUDENT",
        states: ["DRAFT", "SUBMITTED"],
        fields: [{
          id: "SUB-F001",
          valueSource: { kind: "OPTION_SET", optionSetId: "OPT-BOOL" },
        }],
      }],
      actions: [{
        id: "SUB-ACT-01",
        targetObjectId: "DAT-SUB-01",
        inputFieldIds: ["SUB-F001"],
        outputFieldIds: [],
        transition: { from: "DRAFT", to: "SUBMITTED" },
        permissions: [{ effect: "ALLOW", roleRef: "ROLE-STUDENT" }],
        scenarioIds: ["SUB-SCN-01", "SUB-SCN-02"],
      }],
      pages: [],
      scenarios: [
        { id: "SUB-SCN-01", kind: "SUCCESS", actionId: "SUB-ACT-01" },
        { id: "SUB-SCN-02", kind: "BOUNDARY", actionId: "SUB-ACT-01" },
      ],
    }],
    flows: [{
      id: "DF-TEST",
      moduleIds: ["SUB-001"],
      steps: [{ actionId: "SUB-ACT-01" }],
    }],
    aiTasks: [],
    extensions: [],
  };
}

test("accepts the complete semantic fixture", () => {
  assert.deepEqual(validateRequirementModel(validFixture()), []);
});

test("exports stable model constants", () => {
  assert.deepEqual(PHASE, { FIRST: 1, SECOND: 2 });
  assert.deepEqual(RISK, { READ: "READ", LOW: "LOW", HIGH: "HIGH" });
  assert.deepEqual(CLIENT, { WEB: "WEB", APP: "APP" });
  assert.equal(Object.isFrozen(PHASE), true);
  assert.equal(Object.isFrozen(RISK), true);
  assert.equal(Object.isFrozen(CLIENT), true);
});

test("defineModule returns an independent clone without defaults", () => {
  const source = { id: "SUB-001", objects: [] };
  const module = defineModule(source);

  assert.deepEqual(module, source);
  assert.notEqual(module, source);
  assert.notEqual(module.objects, source.objects);
  assert.deepEqual(Object.keys(module), ["id", "objects"]);
});

test("defineRequirementModel returns an independent clone without defaults", () => {
  const source = { roles: [], modules: [] };
  const model = defineRequirementModel(source);

  assert.deepEqual(model, source);
  assert.notEqual(model, source);
  assert.notEqual(model.roles, source.roles);
  assert.notEqual(model.modules, source.modules);
  assert.deepEqual(Object.keys(model), ["roles", "modules"]);
});

test("rejects duplicate IDs", () => {
  const model = validFixture();
  model.roles.push({ id: "ROLE-STUDENT", label: "duplicate student" });

  const errors = validateRequirementModel(model);

  assert.match(errors.join("\n"), /DUPLICATE_ID/);
});

test("rejects a choice field without an Option Set", () => {
  const model = validFixture();
  model.optionSets = [];

  const errors = validateRequirementModel(model);

  assert.match(errors.join("\n"), /MISSING_OPTION_SET/);
});

test("rejects an action referencing a missing field", () => {
  const model = validFixture();
  model.modules[0].actions[0].inputFieldIds = ["SUB-F999"];

  const errors = validateRequirementModel(model);

  assert.match(errors.join("\n"), /MISSING_ACTION_FIELD/);
});

test("rejects an invalid state transition", () => {
  const model = validFixture();
  model.modules[0].actions[0].transition.to = "ARCHIVED";

  const errors = validateRequirementModel(model);

  assert.match(errors.join("\n"), /INVALID_STATE_TRANSITION/);
});

test("rejects a flow whose declared modules and action modules differ", () => {
  const model = validFixture();
  model.flows[0].moduleIds = ["HW-001"];

  const errors = validateRequirementModel(model);

  assert.match(errors.join("\n"), /FLOW_PARTICIPANT_MISMATCH/);
});

test("rejects an orphan Owner role", () => {
  const model = validFixture();
  model.modules[0].objects[0].ownerRef = "ROLE-ORPHAN";

  const errors = validateRequirementModel(model);

  assert.match(errors.join("\n"), /ORPHAN_OWNER_ROLE/);
});

test("rejects executable phase-two pages", () => {
  const model = validFixture();
  model.modules[0].phase = PHASE.SECOND;
  model.modules[0].pages = [{
    id: "REPORT-W01",
    actionIds: ["SUB-ACT-01"],
  }];

  const errors = validateRequirementModel(model);

  assert.match(errors.join("\n"), /PHASE_BOUNDARY_EXECUTABLE_PAGE/);
});

test("rejects an AI write task without confirmation", () => {
  const model = validFixture();
  model.aiTasks = [{
    id: "AI-TASK-01",
    actionId: "SUB-ACT-01",
    risk: RISK.HIGH,
    writes: true,
    previewFieldIds: ["SUB-F001"],
  }];

  const errors = validateRequirementModel(model);

  assert.match(errors.join("\n"), /AI_WRITE_WITHOUT_CONFIRMATION/);
});

test("rejects a baseline metric without an event mapping", () => {
  const model = validFixture();
  model.metrics[0].eventIds = [];

  const errors = validateRequirementModel(model);

  assert.match(errors.join("\n"), /MISSING_METRIC_EVENT/);
});
