import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import {
  buildRequirementArtifacts,
} from "../requirements-v2/render/package.mjs";
import {
  renderAiTaskRegistry,
  renderAuthoritativeObjectCatalog,
  renderDataFlowCatalog,
  renderLifecycleAiUsage,
  renderMetricCatalog,
  renderPermissionsMatrix,
  renderTraceability,
} from "../requirements-v2/render/contracts.mjs";
import {
  renderModulePrd,
} from "../requirements-v2/render/module-prd.mjs";
import {
  renderModuleWireframe,
} from "../requirements-v2/render/wireframe.mjs";

function moduleById(id) {
  return requirementModel.modules.find((module) => module.id === id);
}

function renderableModel() {
  const model = structuredClone(requirementModel);
  model.reviewStatus = {
    code: "PRODUCT_FACT_SOURCE_SEMANTIC_REVIEW_PASSED",
    label: "v2.0 product fact source; semantic review passed",
    reviewedAt: "2026-07-16",
  };
  return model;
}

function repositoryFiles(root, directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return repositoryFiles(root, absolutePath);
    return [path.relative(root, absolutePath).split(path.sep).join("/")];
  });
}

test("publishes the passed semantic review status as a source fact", () => {
  assert.deepEqual(requirementModel.reviewStatus, {
    code: "PRODUCT_BASELINE_V2_FINALIZED_PRD_REVIEW_PASSED",
    label: "v2.0 finalized product baseline; production PRD semantic review passed",
    reviewedAt: "2026-07-20",
  });
});

test("renders AI assessment rationale and bounded professional exception facts", () => {
  const output = renderModulePrd(moduleById("GRD-001"), requirementModel);

  for (const expected of [
    "GRD-001",
    "GRD-OBJ-DECISION",
    "GRD-DECISION-F-SUGGESTED-SCORE",
    "Suggested Score",
    "GRD-DECISION-F-SCORING-RATIONALE",
    "Scoring Rationale",
    "GRD-DECISION-F-OFFICIAL-SCORE",
    "Effective Activity Score or Level \\(optional\\)",
    "Professional Exception Feedback \\(exception only\\)",
    "GRD-ACT-OVERRIDE-SCORE",
    "GRD-ACT-MANUAL-GRADE",
  ]) assert.match(output, new RegExp(expected));
  assert.doesNotMatch(output, /Teacher Official Score|Teacher Feedback/);
  assert.doesNotMatch(output, /对象查询与范围筛选|创建\/修改\/确认主动作/);
});

test("renders report subscription and run as separate object lifecycles", () => {
  const output = renderModulePrd(moduleById("RPT-001"), requirementModel);

  assert.match(output, /RPT-OBJ-SUBSCRIPTION[\s\S]*ACTIVE[\s\S]*PAUSED[\s\S]*CANCELLED/);
  assert.match(output, /RPT-OBJ-RUN[\s\S]*QUEUED[\s\S]*RUNNING[\s\S]*BLOCKED_PERMISSION/);
  assert.match(output, /RPT-ACT-CREATE-SUBSCRIPTION/);
  assert.match(output, /RPT-ACT-CREATE-RUN/);
  assert.match(output, /RPT-RUN-F-PERMISSION-RESULT/);
});

test("renders student task pages instead of a generic workbench template", () => {
  const output = renderModuleWireframe(moduleById("APP-001"), requirementModel);

  for (const expected of [
    "APP-PAGE-TODOS",
    "Student Todo Execution",
    "APP-TODO-F-LOCAL-PROGRESS",
    "APP-TODO-F-COMPLETION-EVIDENCE",
    "APP-ACT-VIEW-TODOS",
    "APP-ACT-UPDATE-LOCAL-PROGRESS",
  ]) assert.match(output, new RegExp(expected));
  assert.doesNotMatch(output, /列表\/工作台|详情\/处理页|历史\/审计页/);
});

test("renders REPORT as an independent planned metadata contract", () => {
  const output = renderModulePrd(moduleById("REPORT-001"), requirementModel);

  assert.match(output, /规划元数据登记/);
  assert.match(output, /^交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。/);
  assert.match(output, /REPORT-OBJ-FUTURE-CONTRACT/);
  assert.match(output, /unresolvedProductDecisions/);
  assert.doesNotMatch(output, /## 可执行动作|Page ID|Scenario ID/);
  assert.match(
    renderModuleWireframe(moduleById("REPORT-001"), requirementModel),
    /^交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。/,
  );
});

test("renders phase-two and phase-three modules as planned contracts with banners", () => {
  for (const phase of [2, 3]) {
    const module = structuredClone(moduleById("DGV-001"));
    module.phase = phase;
    module.releaseStatus = "PLANNED";
    module.pages.forEach((page) => { page.availability = "PLANNED"; });

    for (const output of [
      renderModulePrd(module, requirementModel),
      renderModuleWireframe(module, requirementModel),
    ]) {
      assert.match(
        output,
        /^交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。/,
      );
      assert.match(output, /DGV-001/);
    }
  }
});

test("renders traceability across every implementation contract namespace", () => {
  const output = renderTraceability(requirementModel);

  for (const expected of [
    "BASE-001",
    "GRD-ACT-OVERRIDE-SCORE",
    "GRD-OBJ-DECISION",
    "GRD-DECISION-F-OFFICIAL-SCORE",
    "DF-004",
    "GRD-PAGE-DECISION",
    "GRD-ACT-OVERRIDE-SCORE-SCN-SUCCESS",
    "MET-001",
  ]) assert.match(output, new RegExp(expected));
  assert.match(output, /BASE-001[\s\S]*学校是采购主体、数据控制主体和治理责任主体/);
});

test("renders AI task intent from authored examples instead of a missing label", () => {
  const output = renderAiTaskRegistry(requirementModel);

  assert.match(output, /AI-TASK-AUTHORIZED-DATA-QUERY/);
  assert.match(output, /Show the authorized learning profile for this student/);
  assert.match(output, /STU-ACT-OPEN-PROFILE/);
});

test("renders every teacher write scope policy and independent domain boundary", () => {
  const output = renderModulePrd(moduleById("AIX-001"), requirementModel);

  assert.match(output, /DOMAIN_CONTRACT;contract=AIX_TASK_PREVIEW_AUTHORIZATION_GATE;enforcement=ACTION_DOMAIN_BOUNDARY/);
  assert.match(output, /teacherWriteAuthorizationBoundary:kind=DOMAIN_CONTRACT;contract=AIX_TASK_PREVIEW_AUTHORIZATION_GATE/);
});

test("renders the complete D047 data catalog coverage and uniqueness contract", () => {
  const output = renderModulePrd(moduleById("DGV-001"), requirementModel);

  for (const expected of [
    "ALL_MODEL_OBJECT_IDS",
    "EXACTLY_ONE_PER_GOVERNED_OBJECT",
    "DGV-ACT-ACTIVATE-DATA-CATALOG",
    "DGV-ACT-SUPERSEDE-DATA-CATALOG",
    "DGV-ACT-RESOLVE-DATA-CATALOG",
    "OPT-BL2-003",
    "OPT-BL2-008",
    "CONTROL_SUBJECT_PARTITION",
    "ROLE-SCHOOL-ADMIN",
    "ROLE-PLATFORM-GOVERNANCE",
    "STUDENT_MEMORY",
    "VIDEO-OBJ-ASSET",
    "DGV-GOVCASE-F-CATALOG-ENTRY-VERSION",
    "sourceObjectKindMustEqualTargetObjectKind",
  ]) assert.match(output, new RegExp(expected));
});

test("renders commercial continuity and D090 consumer contracts", () => {
  const platform = renderModulePrd(moduleById("PLAT-001"), requirementModel);
  for (const expected of [
    "A_RESTRICTED_TERMINATED_OR_EXPIRED_PLAN_REQUIRES_A_NEW_ACTIVE_VERSION_AND_MAY_NOT_RETURN_TO_ACTIVE",
    "ACTIVE_PLAN_NON_CLOSED_CONTINUITY",
    "CONTINUITY_WINDOW_BLOCK",
    "HW-ACT-PUBLISH-REPLACEMENT",
    "sourceReactivationAllowed",
    "SEAL_ONLY_WHEN_EXPECTED_COUNT_IS_ZERO",
  ]) assert.match(platform, new RegExp(expected));

  const entitlement = renderModulePrd(moduleById("PLAT-002"), requirementModel);
  for (const expected of [
    "EVERY_CORE_CONSUMER_PINS_ONE_EXACT_ACTIVE_SAME_SCHOOL_ENTITLEMENT_VERSION",
    "GRD-ACT-PROCESS",
    "PROG-ACT-SYNC-STUDENT-TARGET",
    "VIDEO-ACT-ENSURE-STUDENT-MINIMUM-ENTITLEMENT",
    "VIDEO-ACT-ENSURE-SCHOOL-OVERFLOW-POOL",
  ]) assert.match(entitlement, new RegExp(expected));

  for (const moduleId of ["GRD-001", "PROG-001", "VIDEO-001"]) {
    const output = renderModulePrd(moduleById(moduleId), requirementModel);
    assert.match(output, /D090 第二阶段权益消费 Guard/);
    assert.match(output, /PHASE_TWO_ENTITLEMENT_INACTIVE/);
  }
});

test("renders the authored lifecycle policy keys without empty legacy columns", () => {
  const output = renderLifecycleAiUsage(requirementModel);

  assert.match(output, /TENANT_CONFIGURATION/);
  assert.match(output, /仅学校管理员可通过受审计的配置变更写入/);
  assert.match(output, /每次生效保留前后版本/);
  assert.match(output, /ROLE-SCHOOL-ADMIN/);
  assert.match(output, /学校停用后按激活时配置的期限归档/);
});

test("renders authoritative data nature and teacher write policy columns", () => {
  const output = renderAuthoritativeObjectCatalog(requirementModel);

  assert.match(output, /数据性质/);
  assert.match(output, /AI_DERIVED/);
  assert.match(output, /教师写入策略/);
  assert.match(output, /ASSIGNED_SUBJECT_COURSE/);
  assert.match(output, /AIX_TASK_PREVIEW_AUTHORIZATION_GATE/);
});

test("renders assigned subject-course permission scope as a machine-readable contract", () => {
  const permissions = renderPermissionsMatrix(requirementModel);
  const grading = renderModulePrd(moduleById("GRD-001"), requirementModel);

  for (const output of [permissions, grading]) {
    assert.match(
      output,
      /ASSIGNED_SUBJECT_COURSE:subject=REQUIRED;course=REQUIRED/,
    );
    assert.doesNotMatch(output, /ASSIGNED_SUBJECT_COURSE:undefined/);
  }
});

test("renders student-data classification and the AUD access exception", () => {
  const catalog = renderAuthoritativeObjectCatalog(requirementModel);
  assert.match(
    catalog,
    /PLN-OBJ-PLAN[^\n]*DETAIL[^\n]*DEFAULT_DENY/,
  );
  assert.match(
    catalog,
    /ORG-OBJ-STUDENT[^\n]*NONE[^\n]*NOT_APPLICABLE/,
  );

  for (const output of [
    renderPermissionsMatrix(requirementModel),
    renderModulePrd(moduleById("PLAT-001"), requirementModel),
  ]) {
    assert.match(
      output,
      /PLAT-ACT-USE-SUPPORT-ACCESS[^\n]*AUD_SESSION_STUDENT_DETAIL/,
    );
  }
});

test("renders declared professional write authorization boundaries", () => {
  for (const output of [
    renderPermissionsMatrix(requirementModel),
    renderModulePrd(moduleById("GRD-001"), requirementModel),
  ]) {
    assert.match(
      output,
      /GRD-ACT-OVERRIDE-SCORE[^\n]*authorizationBoundary:kind=SUBJECT_COURSE_PROFESSIONAL_WRITE/,
    );
  }
});

test("renders explicit non-professional write exceptions in authorization columns", () => {
  for (const output of [
    renderPermissionsMatrix(requirementModel),
    renderModulePrd(moduleById("CORR-001"), requirementModel),
  ]) {
    assert.match(
      output,
      /CORR-ACT-SUBMIT-INITIAL[^\n]*professionalWriteException:kind=NON_PROFESSIONAL_PROTECTED_OBJECT_WRITE;contract=STUDENT_SUBMISSION/,
    );
  }
});

test("blocks scoped non-professional exceptions before building artifacts", () => {
  const model = structuredClone(requirementModel);
  const correction = model.modules.find(({ id }) => id === "CORR-001");
  const action = correction.actions.find(({ id }) => id === "CORR-ACT-SUBMIT-INITIAL");
  action.permissions = action.permissions.map((permission) => structuredClone(permission));
  action.permissions.find(({ effect }) => effect === "ALLOW").scope = {
    kind: "OTHER_RECORD",
    subjectFieldId: "CORR-ATTEMPT-F-STUDENT-REF",
  };

  assert.throws(
    () => buildRequirementArtifacts(model),
    /INVALID_ACADEMIC_ACCESS_BOUNDARY CORR-ACT-SUBMIT-INITIAL/,
  );
});

test("blocks unauthorized access exceptions before rendering artifacts", () => {
  const model = structuredClone(requirementModel);
  const platform = model.modules.find(({ id }) => id === "PLAT-001");
  const publication = model.modules.find(({ id }) => id === "PUB-001");
  const canonicalGuard = platform.actions
    .find(({ id }) => id === "PLAT-ACT-USE-SUPPORT-ACCESS").accessGuard;
  publication.actions
    .find(({ id }) => id === "PUB-ACT-VIEW-RESULT").accessGuard = structuredClone(canonicalGuard);

  assert.throws(
    () => buildRequirementArtifacts(model),
    /INVALID_STUDENT_DETAIL_ACCESS_EXCEPTION/,
  );
});

test("renders Flow failure granularity providers compensation and invalidation", () => {
  const output = renderDataFlowCatalog(requirementModel);

  assert.match(output, /STEP_WITH_NO_CONTEXT_ACTIVATION_BEFORE_ALL_CHECKS_PASS/);
  assert.match(output, /providedInputs/);
  assert.match(output, /EXPIRE_PARTIAL_CONTEXT/);
  assert.match(output, /INVALIDATE_PREVIOUS_CONTEXT_DERIVATIONS/);
  assert.match(output, /DF-009 Batch AI Assessment Impact Location, Correction, Notification, and Recalculation/);
  assert.match(output, /KEEP_ORIGINAL_FACTS_AND_PRIOR_RESULT_VERSIONS/);
  assert.match(output, /## DF-011\b/);
  assert.match(output, /PUBLISHED_RESULT_SOURCE/);
  assert.match(output, /LPATH-ENTRY-F-PUBLISHED-RESULT-REF/);
});

test("renders metric statistic target and event calculation facts", () => {
  const output = renderMetricCatalog(requirementModel);

  assert.match(output, /MET-001/);
  assert.match(output, /median/);
  assert.match(output, /studentFeedbackViewId/);
  assert.match(output, /相对试点基线降低>=30%/);
  assert.match(output, /EVT-TEACHER-OPERATION-STARTED/);
});

test("builds one deterministic artifact set with planned contracts and release manifest", () => {
  const missingStatus = structuredClone(requirementModel);
  delete missingStatus.reviewStatus;
  assert.throws(
    () => buildRequirementArtifacts(missingStatus),
    /reviewStatus/,
  );
  const model = renderableModel();
  const first = buildRequirementArtifacts(model);
  const second = buildRequirementArtifacts(model);
  const paths = first.map(({ path }) => path);
  const manifestArtifact = first.find(({ path }) => (
    path.endsWith("02-indexes/current-module-packages.json")
  ));
  const manifest = JSON.parse(manifestArtifact.content);

  assert.deepEqual(first, second);
  assert.equal(new Set(paths).size, paths.length);
  assert.equal(
    paths.filter((path) => path.includes("/03-full-prd-md/")).length,
    model.modules.length,
  );
  assert.equal(
    paths.filter((path) => path.includes("/05-wireframe-contracts/")).length,
    model.modules.length,
  );
  assert.equal(paths.some((path) => path.includes("guardian-report-sharing-wireframe")), true);
  assert.deepEqual(manifest.currentReleaseModuleIds, model.currentReleaseModuleIds);
  const reportManifest = manifest.modules.find(({ id }) => id === "REPORT-001");
  assert.equal(reportManifest.releaseStatus, "PLANNED");
  assert.equal(reportManifest.currentRelease, false);
  assert.match(reportManifest.wireframe, /05-wireframe-contracts/);
  for (const moduleEntry of manifest.modules) {
    assert.equal(paths.includes(moduleEntry.prd), true, `${moduleEntry.id}:prd`);
    assert.equal(paths.includes(moduleEntry.wireframe), true, `${moduleEntry.id}:wireframe`);
  }
  assert.equal(paths.includes("docs/requirements/zhixu-handoff-v2.0/02-indexes/requirement-traceability.md"), true);
  assert.equal(first.every(({ content }) => content.endsWith("\n")), true);
  const generatedContent = first.map(({ content }) => content).join("\n");
  assert.doesNotMatch(generatedContent, /\[object Object\]/);
  assert.doesNotMatch(
    generatedContent,
    /(?<![-A-Z0-9_])(TODO|TBD|FIXME)(?![-A-Z0-9_])|待补充|待定|占位符(?!扫描)|[Ll]orem [Ii]psum/,
  );
  assert.doesNotMatch(generatedContent, /(?:file:\/\/|\/Users\/|\/private\/|\/var\/folders\/)/);
  assert.doesNotMatch(generatedContent, /\[[^\]]*\]\((?:\s*|#)\)/);
  assert.doesNotMatch(
    generatedContent,
    /TPSf[0-9A-Za-z]+|api_key\s*=|Authorization:\s*Bearer|sk-[A-Za-z0-9_-]{20,}/,
  );
});

test("resolves every generated relative Markdown link", () => {
  const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
  const artifacts = buildRequirementArtifacts(requirementModel);
  const artifactPaths = new Set(artifacts.map(({ path: artifactPath }) => artifactPath));

  for (const artifact of artifacts) {
    for (const match of artifact.content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split("#")[0];
      if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
      const resolved = path.posix.normalize(path.posix.join(
        path.posix.dirname(artifact.path),
        target,
      ));
      assert.equal(
        artifactPaths.has(resolved) || existsSync(path.join(repositoryRoot, resolved)),
        true,
        `${artifact.path}: unresolved Markdown link ${target}`,
      );
    }
  }
});

test("publishes defect-derived first-principles completion rules", () => {
  const governance = buildRequirementArtifacts(requirementModel).find(({ path: artifactPath }) => (
    artifactPath.endsWith("/07-review-checklists/first-principles-governance.md")
  ));
  assert.ok(governance);
  for (const expected of [
    "引用为空不能自动推导为 N/A",
    "禁止把迁移组并集复制成每个决策的影响范围",
    "状态码与测试文件也必须精确存在",
    "必须同时追踪动作所属模块和目标对象",
    "每条正向合同都要有破坏性负向测试证明不能绕过",
    "不得为了页面方便把治理、开放、参与、时间、处理、发布、纠正或有效性压成单一状态",
    "不得把未来扩展问题呈现成当前基线尚未完成",
    "不得渲染本机绝对路径、临时目录、访问密钥或其他环境私有值",
    "任一门禁失败都不得宣称需求包完成",
  ]) assert.match(governance.content, new RegExp(expected));
});

test("keeps repository requirement snapshots byte-identical to the generator", () => {
  const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
  const artifacts = buildRequirementArtifacts(requirementModel);
  const packagePrefix = "docs/requirements/zhixu-handoff-v2.0/";
  const expectedPackagePaths = artifacts
    .map(({ path: artifactPath }) => artifactPath)
    .filter((artifactPath) => artifactPath.startsWith(packagePrefix))
    .sort();
  const actualPackagePaths = repositoryFiles(
    repositoryRoot,
    path.join(repositoryRoot, "docs/requirements/zhixu-handoff-v2.0"),
  ).sort();

  assert.deepEqual(
    actualPackagePaths,
    expectedPackagePaths,
    "generated requirement directory contains missing, stale, or extra artifacts; run node tools/generate_v2_requirements.mjs",
  );

  for (const artifact of artifacts) {
    const destination = path.join(repositoryRoot, artifact.path);
    assert.equal(existsSync(destination), true, `missing generated artifact ${artifact.path}`);
    assert.equal(
      readFileSync(destination, "utf8"),
      artifact.content,
      `generated artifact drifted from facts/renderers: ${artifact.path}`,
    );
  }
});

test("generator validates and writes only the semantic artifact set", () => {
  const root = mkdtempSync(path.join(tmpdir(), "zhixu-render-"));
  const generator = fileURLToPath(new URL("../generate_v2_requirements.mjs", import.meta.url));
  try {
    const result = spawnSync(process.execPath, [generator], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const packageRoot = path.join(root, "docs/requirements/zhixu-handoff-v2.0");
    const grading = readFileSync(
      path.join(packageRoot, "03-full-prd-md/10-ai-grading-review_PRD_v2.0.md"),
      "utf8",
    );
    assert.match(grading, /GRD-DECISION-F-SCORING-RATIONALE/);
    assert.equal(
      existsSync(path.join(
        packageRoot,
        "05-wireframe-contracts/26-guardian-report-sharing-wireframe.zh-CN.md",
      )),
      true,
    );
    const trace = readFileSync(
      path.join(packageRoot, "02-indexes/requirement-traceability.md"),
      "utf8",
    );
    assert.match(trace, /BASE-001/);
    assert.match(trace, /MET-005/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
