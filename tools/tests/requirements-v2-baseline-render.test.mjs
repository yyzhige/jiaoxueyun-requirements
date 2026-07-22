import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import {
  buildRequirementArtifacts,
  REQUIREMENT_PACKAGE_ROOT,
} from "../requirements-v2/render/package.mjs";
import { PLANNED_DELIVERY_BANNER } from "../requirements-v2/render/release.mjs";

const REQUIRED_ARTIFACTS = [
  `${REQUIREMENT_PACKAGE_ROOT}/02-indexes/product-baseline-v2-traceability.md`,
  `${REQUIREMENT_PACKAGE_ROOT}/02-indexes/D003-D096-decision-matrix.md`,
  `${REQUIREMENT_PACKAGE_ROOT}/02-indexes/product-baseline-v2-migration-log.md`,
  `${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/activity-status-axis-catalog.md`,
  `${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/ai-result-status-axis-catalog.md`,
  `${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/high-impact-authorization-matrix.md`,
  `${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/weak-network-intent-credential.md`,
  `${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/answer-open-surface-matrix.md`,
  `${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/video-gate-quota-contract.md`,
  `${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/metric-groups-launch-gates.md`,
  "docs/product/zhixu-teaching-cloud-prd-v2.0.md",
];

function artifactMap() {
  return new Map(buildRequirementArtifacts(requirementModel).map(({ path, content }) => [path, content]));
}

test("renders the finalized baseline trace migration and focused data contracts", () => {
  const artifacts = artifactMap();
  for (const path of REQUIRED_ARTIFACTS) assert.ok(artifacts.has(path), path);
  const trace = artifacts.get(`${REQUIREMENT_PACKAGE_ROOT}/02-indexes/product-baseline-v2-traceability.md`);
  const decisions = artifacts.get(`${REQUIREMENT_PACKAGE_ROOT}/02-indexes/D003-D096-decision-matrix.md`);
  const migration = artifacts.get(`${REQUIREMENT_PACKAGE_ROOT}/02-indexes/product-baseline-v2-migration-log.md`);
  for (const chapter of requirementModel.baselineChapters) assert.match(trace, new RegExp(chapter.id));
  for (const decision of requirementModel.productDecisions) assert.match(decisions, new RegExp(`\\b${decision.id}\\b`));
  for (const change of requirementModel.migrationChanges) assert.match(migration, new RegExp(`\\b${change.id}\\b`));
  assert.match(migration, /逐决策精确影响/);
  assert.match(migration, /IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION/);
  assert.match(migration, /D077-ANSWER-OPEN-DELIVERY-SURFACES/);
  assert.match(migration, /VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT/);
  assert.match(migration, /PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT/);
  assert.match(trace, /N\/A \[`NO_DIRECT_/);
  assert.match(decisions, /N\/A \[`NO_DIRECT_/);
  assert.doesNotMatch(trace, /\| — \||<br>—/);
  assert.doesNotMatch(decisions, /\| — \||<br>—/);
  const decisionRow = (decisionId) => decisions.split("\n")
    .find((line) => line.startsWith(`| ${decisionId} |`));
  assert.match(decisionRow("D042"), /AUD-001/);
  assert.doesNotMatch(decisionRow("D042"), /ACC-001|STU-001|NOTI-001/);
  assert.match(decisionRow("D071"), /GRD-001/);
  assert.doesNotMatch(decisionRow("D071"), /TEA-001|INS-001|PLN-001/);
  assert.match(decisionRow("D091"), /PLAT-OBJ-SERVICE-CONTINUITY-WINDOW/);
  assert.match(decisionRow("D091"), /PLAT-ACT-CLOSE-SERVICE-CONTINUITY/);
  const deferred = artifacts.get(`${REQUIREMENT_PACKAGE_ROOT}/02-indexes/open-product-decisions.md`);
  assert.match(deferred, /D003-D096 与当前产品基线决策已全部关闭/);
  assert.match(deferred, /不影响 v2\.0 定版/);
  const review = artifacts.get(`${REQUIREMENT_PACKAGE_ROOT}/02-product-review-status.zh-CN.md`);
  assert.match(review, /六组指标均可计算/);
  assert.match(review, /三类上线门证据闭合/);
  assert.doesNotMatch(review, /五项指标|四类权限/);
});

test("renders current and planned contracts with exact phase claims", () => {
  const artifacts = artifactMap();
  const manifest = JSON.parse(artifacts.get(`${REQUIREMENT_PACKAGE_ROOT}/02-indexes/current-module-packages.json`));
  for (const module of requirementModel.modules) {
    const entry = manifest.modules.find(({ id }) => id === module.id);
    assert.equal(entry.phase, module.phase, module.id);
    assert.equal(entry.releaseStatus, module.releaseStatus, module.id);
    const prd = artifacts.get(entry.prd);
    const wireframe = artifacts.get(entry.wireframe);
    if (module.releaseStatus === "PLANNED") {
      assert.match(prd, new RegExp(PLANNED_DELIVERY_BANNER));
      assert.match(wireframe, new RegExp(PLANNED_DELIVERY_BANNER));
    } else {
      assert.doesNotMatch(prd, new RegExp(PLANNED_DELIVERY_BANNER));
      assert.doesNotMatch(wireframe, new RegExp(PLANNED_DELIVERY_BANNER));
    }
  }
});

test("removes obsolete review and stage claims outside the explicit migration log", () => {
  const artifacts = artifactMap();
  const searchable = [...artifacts]
    .filter(([path]) => !path.endsWith("product-baseline-v2-migration-log.md"))
    .map(([, content]) => content)
    .join("\n");
  assert.doesNotMatch(searchable, /PRODUCT_BASELINE_V2_FINALIZED_FACTS_ENCODED/);
  assert.doesNotMatch(searchable, /第二阶段无可执行页面/);
  assert.doesNotMatch(searchable, /第三方通知、AI 讲题视频和 AI 教学视频为第二阶段扩展/);
  assert.doesNotMatch(searchable, /27 模块清单/);
  assert.match(searchable, /PRODUCT_BASELINE_V2_FINALIZED_PRD_REVIEW_PASSED/);
});
