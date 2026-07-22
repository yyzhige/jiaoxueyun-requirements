import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  baselineChapters,
  baselineTraceability,
  decisionTraceability,
  migrationChanges,
  productBaseline,
  productDecisions,
  requirementModel,
} from "../requirements-v2/facts/index.mjs";
import {
  TRACE_AXIS_KEYS,
  TRACE_AXIS_STATUS,
  acceptanceTestRegistry,
  assertTraceabilitySourceCoverage,
} from "../requirements-v2/facts/baseline-traceability.mjs";
import { validateRequirementModel } from "../requirements-v2/validate/index.mjs";
import { answerOpenSurfaceExecutionRegistry } from "../requirements-v2/facts/answer-open-delivery.mjs";
import {
  highImpactAuthorizationBindings,
  highImpactAuthorizationConsumptionBindings,
} from "../requirements-v2/facts/high-impact-authorization.mjs";
import { videoRecallSourceBindings } from "../requirements-v2/facts/video-recall-source-fanout.mjs";

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function errorsAfter(mutate) {
  const model = structuredClone(requirementModel);
  mutate(model);
  return validateRequirementModel(model).join("\n");
}

function assertClosedTraceAxes(trace) {
  assert.deepEqual(Object.keys(trace.axisApplicability), TRACE_AXIS_KEYS);
  for (const axisKey of TRACE_AXIS_KEYS) {
    const references = trace[axisKey];
    const contract = trace.axisApplicability[axisKey];
    assert.ok(contract.reasonCode, `${trace.id}.${axisKey}.reasonCode`);
    assert.ok(contract.reason.length >= 12, `${trace.id}.${axisKey}.reason`);
    assert.notEqual(contract.reason, "—", `${trace.id}.${axisKey}.reason`);
    assert.equal(
      contract.status,
      references.length > 0
        ? TRACE_AXIS_STATUS.APPLICABLE
        : TRACE_AXIS_STATUS.NOT_APPLICABLE,
      `${trace.id}.${axisKey}`,
    );
  }
}

test("traces every README chapter through exact applicable requirement axes", () => {
  assert.equal(baselineTraceability.length, baselineChapters.length);
  assert.deepEqual(
    new Set(baselineTraceability.map(({ chapterId }) => chapterId)),
    new Set(baselineChapters.map(({ id }) => id)),
  );
  for (const trace of baselineTraceability) {
    for (const property of ["phaseIds", "releaseStatuses"]) {
      assert.ok(trace[property].length > 0, `${trace.chapterId}.${property}`);
    }
    assertClosedTraceAxes(trace);
  }
  const tracedDecisions = new Set(baselineTraceability.flatMap(({ decisionIds }) => decisionIds));
  const migratedDecisions = new Set(migrationChanges.flatMap(({ decisionIds }) => decisionIds));
  assert.deepEqual(tracedDecisions, new Set(productDecisions.map(({ id }) => id)));
  assert.deepEqual(migratedDecisions, new Set(productDecisions.map(({ id }) => id)));
  assert.deepEqual(validateRequirementModel(requirementModel), []);
  assert.equal(
    assertTraceabilitySourceCoverage(readFileSync(productBaseline.sourcePath, "utf8")),
    true,
  );
  const traceByChapterId = new Map(baselineTraceability.map((trace) => [trace.chapterId, trace]));
  const teacherTrace = traceByChapterId.get("BASE-CH-TEACHER-EXPERIENCE");
  for (const pageId of ["TEA-PAGE-QUEUE", "TEA-PAGE-CLASS-INSIGHT", "TEA-PAGE-STUDENT-DETAIL"]) {
    assert.ok(teacherTrace.pageIds.includes(pageId), pageId);
  }
  for (const objectId of ["TEA-OBJ-TEACHING-PROBLEM", "TEA-OBJ-TEACHER-JUDGMENT", "TEA-OBJ-LINKED-TEACHING-ACTION"]) {
    assert.ok(teacherTrace.objectIds.includes(objectId), objectId);
  }
  assert.equal(teacherTrace.axisApplicability.stateRefs.status, TRACE_AXIS_STATUS.APPLICABLE);
  const masteryTrace = traceByChapterId.get("BASE-CH-MASTERY-VISIBILITY");
  assert.ok(masteryTrace.objectIds.includes("INS-OBJ-MASTERY-NODE"));
  assert.ok(masteryTrace.permissionRefs.some((ref) => ref.actionId === "PLN-ACT-VIEW-HOMEROOM-COORDINATION"));
  assert.ok(masteryTrace.stateRefs.includes("INS-OBJ-MASTERY-NODE.MASTERED"));
  const correctionTrace = traceByChapterId.get("BASE-CH-CORRECTION-REVIEW");
  for (const axisKey of ["pageIds", "objectIds", "permissionRefs", "stateRefs", "scenarioIds"]) {
    assert.equal(correctionTrace.axisApplicability[axisKey].status, TRACE_AXIS_STATUS.APPLICABLE, axisKey);
    assert.ok(correctionTrace[axisKey].length > 0, axisKey);
  }
  const videoTypesTrace = traceByChapterId.get("BASE-CH-VIDEO-TYPES");
  assert.ok(videoTypesTrace.decisionIds.includes("D081"));
  assert.ok(videoTypesTrace.decisionIds.includes("D082"));
});

test("resolves every trace test ID through a real executable-suite registry", () => {
  const registered = new Map(acceptanceTestRegistry.map((entry) => [entry.id, entry]));
  assert.equal(registered.size, acceptanceTestRegistry.length);
  for (const { suitePath, testName } of acceptanceTestRegistry) {
    const absoluteSuitePath = resolve(REPOSITORY_ROOT, suitePath);
    assert.equal(existsSync(absoluteSuitePath), true, suitePath);
    assert.ok(testName?.length > 12, `${suitePath}.testName`);
    assert.ok(
      readFileSync(absoluteSuitePath, "utf8").includes(`test(${JSON.stringify(testName)}`),
      `${suitePath} -> ${testName}`,
    );
  }
  for (const testId of new Set([
    ...baselineTraceability.flatMap(({ testIds }) => testIds),
    ...decisionTraceability.flatMap(({ testIds }) => testIds),
  ])) assert.ok(registered.has(testId), testId);
});

test("enforces foundational baseline acceptance contracts", () => {
  const tracedTestIds = new Set([
    ...baselineTraceability.flatMap(({ testIds }) => testIds),
    ...decisionTraceability.flatMap(({ testIds }) => testIds),
  ]);
  for (const testId of acceptanceTestRegistry
    .filter(({ testName }) => testName === "enforces foundational baseline acceptance contracts")
    .map(({ id }) => id)) {
    assert.ok(tracedTestIds.has(testId), testId);
  }
  const byId = new Map(productDecisions.map((decision) => [decision.id, decision]));
  assert.equal(byId.get("D003").selectedRoute, "NO_DEFAULT_COMPOSITE_RANKING");
  assert.equal(byId.get("D005").selectedRoute, "PRODUCTION_SAFE_FACT_FOUNDATION");
  assert.equal(byId.get("D006").selectedRoute, "THREE_PHASE_BASELINE");
  assert.equal(byId.get("D007").selectedRoute, "AI_ASSESSMENT_AND_COMPLETION");
  assert.ok(byId.get("D081").chapterIds.includes("BASE-CH-VIDEO-TYPES"));
  assert.ok(byId.get("D082").chapterIds.includes("BASE-CH-VIDEO-TYPES"));
});

test("fails README source coverage on heading, level, line, or count drift", () => {
  const readme = readFileSync(productBaseline.sourcePath, "utf8");
  assert.equal(assertTraceabilitySourceCoverage(readme), true);
  assert.equal(assertTraceabilitySourceCoverage(readme.replace("## 项目原则", "## 已漂移项目原则")), false);
  assert.equal(assertTraceabilitySourceCoverage(readme.replace("### AI 原生，事实先行", "## AI 原生，事实先行")), false);
  assert.equal(assertTraceabilitySourceCoverage(`\n${readme}`), false);
  assert.equal(assertTraceabilitySourceCoverage(`${readme}\n## 未登记章节\n`), false);
  assert.equal(assertTraceabilitySourceCoverage(null), false);
});

test("traces every D003-D096 decision only to its direct migration impact", () => {
  assert.equal(decisionTraceability.length, productDecisions.length);
  assert.deepEqual(
    decisionTraceability.map(({ decisionId }) => decisionId),
    productDecisions.map(({ id }) => id),
  );
  for (const trace of decisionTraceability) assertClosedTraceAxes(trace);
  const d042 = decisionTraceability.find(({ decisionId }) => decisionId === "D042");
  assert.deepEqual(d042.moduleIds, ["AUD-001"]);
  assert.deepEqual(d042.objectIds, ["AUD-OBJ-SHARED-DEVICE-SESSION"]);
  assert.ok(d042.actionIds.includes("AUD-ACT-CLEAN-SHARED-DEVICE-SESSION"));
  assert.equal(d042.moduleIds.some((id) => ["ACC-001", "STU-001", "NOTI-001"].includes(id)), false);

  const d071 = decisionTraceability.find(({ decisionId }) => decisionId === "D071");
  assert.deepEqual(d071.phaseIds, ["PHASE-2"]);
  assert.deepEqual(new Set(d071.moduleIds), new Set(["GRD-001", "PUB-001"]));
  assert.equal(d071.moduleIds.some((id) => ["TEA-001", "INS-001", "PLN-001"].includes(id)), false);

  const d091 = decisionTraceability.find(({ decisionId }) => decisionId === "D091");
  for (const id of [
    "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW",
    "PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY",
  ]) assert.ok(d091.objectIds.includes(id), id);
  for (const id of [
    "PLAT-ACT-OPEN-SERVICE-CONTINUITY",
    "PLAT-ACT-RECONCILE-AND-SEAL-PROTECTED-ACTIVITY-MANIFEST",
    "PLAT-ACT-ENTER-EXIT-WINDOW",
    "PLAT-ACT-CLOSE-SERVICE-CONTINUITY",
  ]) assert.ok(d091.actionIds.includes(id), id);
});

test("rejects missing chapter decision and contract references", () => {
  assert.match(errorsAfter((model) => {
    model.baselineTraceability.pop();
  }), /INVALID_BASELINE_TRACEABILITY/);
  assert.match(errorsAfter((model) => {
    model.baselineTraceability[0].pageIds[0] = "PAGE-UNKNOWN";
  }), /MISSING_BASELINE_TRACE_REFERENCE/);
  assert.match(errorsAfter((model) => {
    model.baselineTraceability[0].permissionRefs[0].actionId = "ACTION-UNKNOWN";
  }), /MISSING_BASELINE_TRACE_PERMISSION/);
  assert.match(errorsAfter((model) => {
    model.baselineTraceability[0].stateRefs[0] = "OBJECT-UNKNOWN.STATE";
  }), /MISSING_BASELINE_TRACE_STATE/);
  assert.match(errorsAfter((model) => {
    model.baselineTraceability[0].releaseStatuses = ["BUILD_READY"];
  }), /INVALID_BASELINE_TRACEABILITY/);
  assert.match(errorsAfter((model) => {
    const decisionId = model.productDecisions[0].id;
    for (const trace of model.baselineTraceability) {
      trace.decisionIds = trace.decisionIds.filter((id) => id !== decisionId);
    }
  }), /INVALID_BASELINE_TRACEABILITY/);
  assert.match(errorsAfter((model) => {
    model.decisionTraceability.find(({ decisionId }) => decisionId === "D042")
      .moduleIds = ["ACC-001"];
  }), /INVALID_BASELINE_TRACEABILITY/);
  assert.match(errorsAfter((model) => {
    model.decisionTraceability.find(({ decisionId }) => decisionId === "D071")
      .phaseIds = ["PHASE-1"];
  }), /INVALID_BASELINE_TRACEABILITY/);
  assert.match(errorsAfter((model) => {
    model.decisionTraceability.find(({ decisionId }) => decisionId === "D091")
      .permissionRefs[0].effect = "UNKNOWN";
  }), /INVALID_ENTITY_SHAPE|DECISION_TRACE_PERMISSION_MISMATCH/);
  assert.match(errorsAfter((model) => {
    const trace = model.baselineTraceability.find(({ pageIds }) => pageIds.length > 0);
    trace.pageIds = [];
  }), /INVALID_BASELINE_TRACEABILITY/);
  assert.match(errorsAfter((model) => {
    const trace = model.decisionTraceability.find(({ flowIds }) => flowIds.length === 0);
    trace.axisApplicability.flowIds.reason = "—";
  }), /INVALID_ENTITY_SHAPE|INVALID_BASELINE_TRACEABILITY/);
  assert.match(errorsAfter((model) => {
    const trace = model.decisionTraceability.find(({ stateRefs }) => stateRefs.length === 0);
    trace.axisApplicability.stateRefs.status = "APPLICABLE";
    trace.axisApplicability.stateRefs.reasonCode = "DIRECT_STATE_CONTRACT";
  }), /INVALID_BASELINE_TRACEABILITY/);
});

test("rejects incomplete migration impact and orphan migration references", () => {
  assert.match(errorsAfter((model) => {
    model.migrationChanges[0].affected.pageIds.push("PAGE-UNKNOWN");
  }), /MISSING_MIGRATION_REFERENCE/);
  assert.match(errorsAfter((model) => {
    const migration = model.migrationChanges.find(({ id }) => id === "MIG-096");
    for (const property of [
      "pageIds",
      "flowIds",
      "objectIds",
      "actionIds",
      "permissionActionIds",
      "stateRefs",
      "metricIds",
      "scenarioIds",
    ]) migration.affected[property] = [];
  }), /INVALID_BASELINE_TRACEABILITY|MISSING_MIGRATION_IMPACT/);
});

test("requires explicit per-decision sources instead of migration-group unions", () => {
  for (const migration of migrationChanges.filter(({ decisionIds }) => decisionIds.length > 1)) {
    assert.deepEqual(Object.keys(migration.decisionAffected).sort(), [...migration.decisionIds].sort());
    const signatures = migration.decisionIds.map((decisionId) => (
      JSON.stringify(migration.decisionAffected[decisionId].affected)
    ));
    assert.equal(new Set(signatures).size, migration.decisionIds.length, migration.id);
  }
  const d037 = decisionTraceability.find(({ decisionId }) => decisionId === "D037");
  assert.ok(d037.actionIds.includes("IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION"));
  assert.ok(d037.actionIds.includes("IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION"));
  assert.ok(d037.stateRefs.includes("IAM-OBJ-HIGH-IMPACT-AUTHORIZATION.RESERVED"));
  assert.ok(d037.scenarioIds.includes("IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION-SCN-RESERVATION_TARGET_CONFLICT"));
  assert.ok(d037.actionIds.includes("DGV-ACT-COMPLETE-STUDENT-TRANSFER"));
  assert.ok(d037.actionIds.includes("ACC-ACT-REQUEST-IDENTITY-DELETION"));
  assert.ok(d037.actionIds.includes("DGV-ACT-REQUEST-STUDENT-DELETION"));
  assert.ok(d037.actionIds.includes("CONTENT-ACT-CREATE-MATERIAL-MANAGEMENT-SCOPE"));
  assert.ok(d037.pageIds.includes("DGV-PAGE-STUDENT-DELETION-MATRIX"));
  assert.ok(d037.pageIds.includes("CONTENT-PAGE-MATERIAL-RIGHTS"));
  assert.equal(d037.pageIds.includes("CONTENT-PAGE-GOVERNANCE"), false);
  assert.equal(d037.flowIds.includes("DF-016"), false);
  for (const actionId of ["IAM-ACT-RAISE-GUARDIAN-DISPUTE", "IAM-ACT-FREEZE-GUARDIAN-DISPUTE"]) {
    assert.ok(d037.permissionRefs.some((ref) => ref.actionId === actionId && ref.effect === "ALLOW"));
    assert.ok(d037.scenarioIds.includes(`${actionId}-SCN-SUCCESS`));
  }
  assert.equal(d037.actionIds.includes("IAM-ACT-OPEN-TASK-ASSISTANCE-SESSION"), false);
  for (const actionId of new Set([
    ...highImpactAuthorizationBindings.map(({ actionId }) => actionId),
    ...highImpactAuthorizationConsumptionBindings.map(({ domainSuccessActionId }) => domainSuccessActionId),
  ])) assert.ok(d037.actionIds.includes(actionId), actionId);
  const d043 = decisionTraceability.find(({ decisionId }) => decisionId === "D043");
  for (const actionId of ["SUB-ACT-REJECT-MANIFEST-CHANGE", "SUB-ACT-EXPIRE-INTENT-CREDENTIAL"]) {
    assert.ok(d043.actionIds.includes(actionId), actionId);
    assert.ok(d043.permissionRefs.some((ref) => ref.actionId === actionId && ref.effect === "ALLOW"));
  }
  assert.ok(d043.stateRefs.includes("SUB-OBJ-INTENT-CREDENTIAL.REJECTED"));
  assert.ok(d043.stateRefs.includes("SUB-OBJ-INTENT-CREDENTIAL.EXPIRED"));
  const d051 = decisionTraceability.find(({ decisionId }) => decisionId === "D051");
  assert.ok(d051.pageIds.includes("ORG-PAGE-MEMBERS"));
  assert.ok(d051.permissionRefs.some((ref) => ref.actionId === "ORG-ACT-DEACTIVATE-TEACHER" && ref.effect === "ALLOW"));
  assert.ok(d051.stateRefs.includes("ORG-OBJ-TEACHER.DEACTIVATED"));
  assert.ok(d051.scenarioIds.includes("ORG-ACT-DEACTIVATE-TEACHER-SCN-SUCCESS"));
  const d052 = decisionTraceability.find(({ decisionId }) => decisionId === "D052");
  const d053 = decisionTraceability.find(({ decisionId }) => decisionId === "D053");
  for (const objectId of ["IAM-OBJ-SCHOOL-DATA-AUTHORIZATION", "IAM-OBJ-PERMISSION-DECISION"]) {
    assert.ok(d052.objectIds.includes(objectId), `D052:${objectId}`);
    assert.ok(d053.objectIds.includes(objectId), `D053:${objectId}`);
  }
  assert.ok(d052.actionIds.includes("DGV-ACT-REQUEST-STUDENT-TRANSFER"));
  assert.ok(d052.actionIds.includes("DGV-ACT-AUTHORIZE-STUDENT-TRANSFER"));
  assert.equal(d052.actionIds.includes("DGV-ACT-DEIDENTIFY-OLD-SCHOOL-HISTORY"), false);
  assert.ok(d053.actionIds.includes("DGV-ACT-DEIDENTIFY-OLD-SCHOOL-HISTORY"));
  assert.ok(d053.stateRefs.includes("DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY.DEIDENTIFIED"));
  assert.equal(d053.actionIds.includes("ACC-ACT-CREATE-PENDING-NEW-SCHOOL-MEMBERSHIP"), false);
  assert.equal(d053.actionIds.includes("ACC-ACT-ACTIVATE-NEW-SCHOOL-MEMBERSHIP"), false);
  const d077 = decisionTraceability.find(({ decisionId }) => decisionId === "D077");
  assert.ok(d077.flowIds.includes("DF-010"));
  assert.ok(d077.actionIds.includes("VIDEO-ACT-DELIVER-USABLE"));
  for (const actionId of answerOpenSurfaceExecutionRegistry.flatMap(({ stages }) => (
    stages.map(({ actionId }) => actionId)
  ))) assert.ok(d077.actionIds.includes(actionId), actionId);
  for (const objectId of ["AIX-OBJ-TASK-PREVIEW", "VIDEO-OBJ-REQUEST", "VIDEO-OBJ-SCHOOL-REQUEST"]) {
    assert.ok(d077.objectIds.includes(objectId), objectId);
  }
  const d084 = decisionTraceability.find(({ decisionId }) => decisionId === "D084");
  assert.ok(d084.flowIds.includes("DF-P2-003"));
  assert.ok(d084.objectIds.includes("VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT"));
  assert.ok(d084.actionIds.includes("VIDEO-ACT-LOCATE-RECALL-IMPACT"));
  assert.equal(d084.flowIds.includes("DF-016"), false);
  for (const pageId of ["ACC-PAGE-PLATFORM-IDENTITY", "ACC-PAGE-LOGIN-ACTIVATION", "CONTENT-PAGE-MATERIAL-RIGHTS"]) {
    assert.ok(d084.pageIds.includes(pageId), pageId);
  }
  for (const { actionId } of videoRecallSourceBindings) {
    assert.ok(d084.actionIds.includes(actionId), actionId);
  }
  const d090 = decisionTraceability.find(({ decisionId }) => decisionId === "D090");
  assert.ok(d090.flowIds.includes("DF-018"));
  assert.ok(d090.actionIds.includes("PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT"));
  assert.ok(d090.stateRefs.includes("PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT.RESTRICTED"));
  assert.ok(d090.moduleIds.includes("PLAT-001"));
  assert.ok(d090.pageIds.includes("PLAT-PAGE-PHASE-TWO-ENTITLEMENT"));
  assert.ok(d090.objectIds.includes("PLAT-OBJ-SERVICE-PLAN"));
  for (const actionId of [
    "PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT",
    "PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT",
    "PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT",
    "PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT",
    "PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT",
    "PLAT-ACT-RESTRICT-SERVICE-PLAN",
  ]) assert.ok(d090.actionIds.includes(actionId), actionId);
});

test("closes every traced action to its owning module and target object", () => {
  const actionTopology = new Map(requirementModel.modules.flatMap((module) => (
    module.actions.map((action) => [action.id, {
      moduleId: module.id,
      objectId: action.targetObjectId,
    }])
  )));
  for (const trace of [...decisionTraceability, ...baselineTraceability]) {
    for (const actionId of trace.actionIds) {
      const topology = actionTopology.get(actionId);
      const traceId = trace.decisionId ?? trace.chapterId;
      assert.ok(topology, `${traceId}:${actionId}`);
      assert.ok(trace.moduleIds.includes(topology.moduleId), `${traceId}:${topology.moduleId}`);
      assert.ok(trace.objectIds.includes(topology.objectId), `${traceId}:${topology.objectId}`);
    }
  }
});

test("D054-D055 search surfaces reauthorize and hide unauthorized existence", () => {
  const requiredActionIds = [
    "ACC-ACT-SEARCH-SCHOOL",
    "DGV-ACT-VIEW-OLD-SCHOOL-RESTRICTED-HISTORY",
    "PUB-ACT-SEARCH-PUBLISHED-RESULTS",
  ];
  const actionById = new Map(requirementModel.modules.flatMap((module) => (
    module.actions.map((action) => [action.id, action])
  )));
  const scenarioById = new Map(requirementModel.modules.flatMap((module) => (
    module.scenarios.map((scenario) => [scenario.id, scenario])
  )));
  for (const decisionId of ["D054", "D055"]) {
    const trace = decisionTraceability.find((entry) => entry.decisionId === decisionId);
    for (const actionId of requiredActionIds) {
      assert.ok(trace.actionIds.includes(actionId), `${decisionId}:${actionId}`);
      assert.ok(trace.permissionRefs.some((ref) => ref.actionId === actionId && ref.effect === "ALLOW"));
      assert.ok(trace.permissionRefs.some((ref) => ref.actionId === actionId && ref.effect === "DENY"));
      const action = actionById.get(actionId);
      const denialScenarioId = `${actionId}-SCN-PERMISSION_DENIED`;
      assert.ok(trace.scenarioIds.includes(denialScenarioId), `${decisionId}:${denialScenarioId}`);
      const denialText = JSON.stringify(scenarioById.get(denialScenarioId)?.then ?? {});
      assert.match(denialText, /(count|数量|facet|筛选|existence|存在)/i, denialScenarioId);
      assert.ok(action.targetObjectId);
    }
  }
});

test("fails closed for malformed reasons, chapter parent cycles, unknown tests, and invalid state codes", () => {
  assert.doesNotThrow(() => errorsAfter((model) => {
    model.baselineTraceability[0].axisApplicability.moduleIds.reason = null;
  }));
  assert.match(errorsAfter((model) => {
    model.baselineTraceability[0].axisApplicability.moduleIds.reason = null;
  }), /INVALID_ENTITY_SHAPE/);
  assert.match(errorsAfter((model) => {
    model.baselineChapters[0].parentId = model.baselineChapters[1].id;
    model.baselineChapters[1].parentId = model.baselineChapters[0].id;
  }), /BASELINE_CHAPTER_PARENT_CYCLE|INVALID_BASELINE_TRACEABILITY/);
  assert.match(errorsAfter((model) => {
    model.decisionTraceability[0].testIds.push("TEST-NOT-REGISTERED");
  }), /MISSING_DECISION_TRACE_REFERENCE|INVALID_BASELINE_TRACEABILITY/);
  assert.match(errorsAfter((model) => {
    const trace = model.decisionTraceability.find(({ stateRefs }) => stateRefs.length > 0);
    trace.stateRefs[0] = `${trace.stateRefs[0].split(".")[0]}.NOT_A_REAL_STATE`;
  }), /MISSING_DECISION_TRACE_STATE|INVALID_BASELINE_TRACEABILITY/);
  assert.match(errorsAfter((model) => {
    const trace = model.decisionTraceability.find(({ decisionId }) => decisionId === "D037");
    trace.moduleIds = [];
    trace.axisApplicability.moduleIds.status = "NOT_APPLICABLE";
    trace.axisApplicability.moduleIds.reasonCode = "NO_DIRECT_MODULE_CONTRACT";
  }), /INVALID_BASELINE_TRACEABILITY/);
  assert.match(errorsAfter((model) => {
    const migration = model.migrationChanges.find(({ id }) => id === "MIG-008");
    migration.decisionAffected.D008.affected.moduleIds = [];
    migration.decisionAffected.D008.axisApplicability.moduleIds.status = "NOT_APPLICABLE";
    migration.decisionAffected.D008.axisApplicability.moduleIds.reasonCode = "NO_DIRECT_MODULE_CONTRACT";
  }), /INVALID_BASELINE_TRACEABILITY/);
});
