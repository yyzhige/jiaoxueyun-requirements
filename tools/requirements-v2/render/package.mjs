import fs from "node:fs";
import path from "node:path";

import {
  renderAiTaskRegistry,
  renderAuthoritativeObjectCatalog,
  renderCrossRoleMatrix,
  renderDataFlowCatalog,
  renderFieldOptionCatalog,
  renderLifecycleAiUsage,
  renderMetricCatalog,
  renderOwnershipMatrix,
  renderPackageReviewChecklist,
  renderPermissionsMatrix,
  renderSemanticScan,
  renderStateModel,
  renderTraceability,
} from "./contracts.mjs";
import { renderModulePrd } from "./module-prd.mjs";
import { markdownList, markdownTable, normalizeDocument } from "./markdown.mjs";
import { renderModuleWireframe } from "./wireframe.mjs";
import { assertValidRequirementModel } from "../validate/index.mjs";

export const REQUIREMENT_PACKAGE_ROOT = "docs/requirements/zhixu-handoff-v2.0";

const list = (value) => (Array.isArray(value) ? value : []);

const MODULE_ARTIFACT_META = new Map([
  ["ACC-001", [1, "school-entry-access"]],
  ["ORG-001", [2, "organization-members-import"]],
  ["IAM-001", [3, "identity-permission-scope"]],
  ["DGV-001", [4, "data-governance-ai-usage"]],
  ["AUD-001", [5, "audit-sensitive-access"]],
  ["CURR-001", [6, "curriculum-knowledge-map"]],
  ["TEA-001", [7, "teacher-homeroom-workbench"]],
  ["HW-001", [8, "assignment-create-release"]],
  ["SUB-001", [9, "student-answer-submit"]],
  ["GRD-001", [10, "ai-grading-review"]],
  ["PUB-001", [11, "result-publish-correction"]],
  ["SCO-001", [12, "gradebook-score-view"]],
  ["STU-001", [13, "teacher-student-management"]],
  ["INS-001", [14, "mastery-evidence-insight"]],
  ["PLN-001", [15, "personalized-improvement-plan"]],
  ["APP-001", [16, "student-home-learning-execution"]],
  ["CORR-001", [17, "feedback-correction"]],
  ["AIX-001", [18, "ai-conversation-task-execution"]],
  ["RPT-001", [19, "reports-subscriptions"]],
  ["LPATH-001", [20, "long-term-learning-path"]],
  ["NOTI-001", [21, "in-app-notification"]],
  ["PREP-001", [22, "lesson-prep-delivery"]],
  ["CONTENT-001", [23, "question-content-management"]],
  ["EXM-001", [24, "exam-score-management"]],
  ["SCH-001", [25, "academic-scheduling"]],
  ["REPORT-001", [26, "guardian-report-sharing"]],
  ["PLAT-001", [27, "platform-onboarding-governance"]],
]);

function artifactMeta(moduleId) {
  const value = MODULE_ARTIFACT_META.get(moduleId);
  if (!value) throw new Error(`missing artifact metadata for module ${moduleId}`);
  return { index: String(value[0]).padStart(2, "0"), slug: value[1] };
}

function prdPath(module) {
  const { index, slug } = artifactMeta(module.id);
  return `${REQUIREMENT_PACKAGE_ROOT}/03-full-prd-md/${index}-${slug}_PRD_v2.0.md`;
}

function wireframePath(module) {
  const { index, slug } = artifactMeta(module.id);
  return `${REQUIREMENT_PACKAGE_ROOT}/05-wireframe-contracts/${index}-${slug}-wireframe.zh-CN.md`;
}

function validateReviewStatus(reviewStatus) {
  if (
    !reviewStatus
    || typeof reviewStatus !== "object"
    || Array.isArray(reviewStatus)
    || !["code", "label", "reviewedAt"].every((key) => (
      typeof reviewStatus[key] === "string" && reviewStatus[key].trim() !== ""
    ))
  ) throw new Error("model.reviewStatus requires code, label, and reviewedAt");
}

function moduleById(model, moduleId) {
  return list(model.modules).find((module) => module.id === moduleId);
}

function roleActionRows(model) {
  const actors = [
    ...list(model.roles).map((role) => ({ kind: "登录角色", ...role })),
    ...list(model.duties).map((duty) => ({ kind: "附加职责", ...duty })),
  ];
  return actors.map((actor) => {
    const actionIds = list(model.modules).flatMap((module) => (
      list(module.actions).filter((action) => list(action.permissions).some((permission) => (
        permission.effect === "ALLOW"
        && [permission.actorRef, permission.roleRef, permission.dutyRef].includes(actor.id)
      ))).map((action) => action.id)
    ));
    return [actor.kind, actor.id, actor.label, actor.roleId ?? "—", actionIds.join("<br>")];
  });
}

function renderReadme(model) {
  return normalizeDocument([
    "# 知序教学云 v2.0 需求交接包",
    markdownTable(
      ["属性", "值"],
      [
        ["状态", model.reviewStatus.label],
        ["状态码", model.reviewStatus.code],
        ["评审日期", model.reviewStatus.reviewedAt],
        ["事实源", "tools/requirements-v2/facts → fail-closed validators → renderers"],
        ["模块", list(model.modules).length],
        ["数据流", list(model.flows).length],
      ],
    ),
    "## 阅读顺序",
    markdownList([
      "产品与项目负责人：先读产品评审状态、需求追踪矩阵、开放决策和各模块 PRD。",
      "前端：先读页面原型映射、模块页面合同、字段 Option Set 和权限矩阵。",
      "后端：先读权威对象、状态模型、动作权限、数据流、生命周期和 AI 任务合同。",
      "测试：先读完整性扫描、模块场景、失败因果语义和评审核对表。",
    ]),
    "## 不可变产品边界",
    markdownList([
      "产品端只有 Web 与 App，角色不与端绑定；App 不要求一比一复制 Web。",
      "AI 一句话能力位于产品内，继承当前学校、身份、学期、职责和数据权限。",
      "正式成绩、学习解释和学科计划的专业确认归对应任课教师；班主任可查看本班全学科并协调，但不能替代他科写入。",
      "第三方通知、AI 讲题视频和 AI 教学视频为第二阶段扩展。",
    ]),
  ]);
}

function renderStartByRole(model) {
  return normalizeDocument([
    "# 按角色开始阅读",
    markdownTable(
      ["类型", "角色 / 职责 ID", "名称", "所属角色", "可执行 Action"],
      roleActionRows(model),
    ),
  ]);
}

function renderUpdateSummary(model) {
  const counts = {
    objects: list(model.modules).flatMap((module) => list(module.objects)).length,
    fields: list(model.modules).flatMap((module) => list(module.objects).flatMap((object) => list(object.fields))).length,
    actions: list(model.modules).flatMap((module) => list(module.actions)).length,
    pages: list(model.modules).flatMap((module) => list(module.pages)).length,
    scenarios: list(model.modules).flatMap((module) => list(module.scenarios)).length,
  };
  return normalizeDocument([
    "# v2.0 语义重构摘要",
    markdownTable(
      ["维度", "数量 / 结果"],
      [
        ["模块", list(model.modules).length],
        ["对象", counts.objects],
        ["字段", counts.fields],
        ["动作", counts.actions],
        ["页面", counts.pages],
        ["场景", counts.scenarios],
        ["数据流", list(model.flows).length],
        ["AI 任务", list(model.aiTasks).length],
        ["生成方式", "结构化事实校验通过后确定性渲染"],
      ],
    ),
  ]);
}

function renderReviewStatus(model) {
  return normalizeDocument([
    "# 产品评审状态",
    markdownTable(
      ["属性", "值"],
      [
        ["状态码", model.reviewStatus.code],
        ["状态", model.reviewStatus.label],
        ["评审日期", model.reviewStatus.reviewedAt],
        ["晋级条件", "全量生成、确定性检查、主闭环人工走查、五项指标可计算、四类权限负向场景通过"],
      ],
    ),
  ]);
}

function renderModulePackages(model) {
  return normalizeDocument([
    "# 当前模块包索引",
    markdownTable(
      ["序号", "模块", "标题", "阶段", "优先级", "对象", "动作", "页面", "PRD", "页面合同"],
      [...list(model.modules)].sort((left, right) => (
        artifactMeta(left.id).index.localeCompare(artifactMeta(right.id).index)
      )).map((module) => {
        const prd = prdPath(module).replace(`${REQUIREMENT_PACKAGE_ROOT}/`, "../");
        const wireframe = module.phase === 1
          ? wireframePath(module).replace(`${REQUIREMENT_PACKAGE_ROOT}/`, "../")
          : "第二阶段无可执行页面";
        return [
          artifactMeta(module.id).index,
          module.id,
          module.title,
          module.phase,
          module.priority,
          list(module.objects).length,
          list(module.actions).length,
          list(module.pages).length,
          `[PRD](${prd})`,
          module.phase === 1 ? `[页面合同](${wireframe})` : wireframe,
        ];
      }),
    ),
  ]);
}

function renderCapabilityMatrix(model) {
  return normalizeDocument([
    "# 模块能力矩阵",
    markdownTable(
      ["模块", "目标", "阶段", "优先级", "Web Page", "App Page", "系统/Flow Action", "AI Task", "基线", "NFR"],
      list(model.modules).map((module) => {
        const actionIds = new Set(list(module.actions).map((action) => action.id));
        return [
          module.id,
          module.objective,
          module.phase,
          module.priority,
          list(module.pages).filter((page) => list(page.clients).includes("WEB")).map((page) => page.id).join("<br>"),
          list(module.pages).filter((page) => list(page.clients).includes("APP")).map((page) => page.id).join("<br>"),
          list(module.actions).filter((action) => action.executionMode !== "USER_TASK").map((action) => action.id).join("<br>"),
          list(model.aiTasks).filter((task) => actionIds.has(task.actionId)).map((task) => task.id).join("<br>"),
          list(module.baselineDecisionIds).join(" / "),
          list(module.nfrIds).join(" / "),
        ];
      }),
    ),
  ]);
}

function renderOpenDecisions(model) {
  const rows = list(model.modules).flatMap((module) => (
    list(module.objects).flatMap((object) => list(object.unresolvedProductDecisions).map((decision) => [
      module.id,
      object.id,
      decision,
      "第二阶段产品评审",
    ]))
  ));
  return normalizeDocument([
    "# 开放产品决策",
    rows.length === 0
      ? "当前事实源没有未决产品问题。"
      : markdownTable(["模块", "对象", "未决问题", "关闭门禁"], rows),
  ]);
}

function renderPageMap(model) {
  return normalizeDocument([
    "# Page 与原型映射",
    markdownTable(
      ["模块", "Page ID", "页面", "端", "对象", "字段数", "Action", "页面合同"],
      list(model.modules).flatMap((module) => list(module.pages).map((page) => [
        module.id,
        page.id,
        page.label,
        list(page.clients).join(" / "),
        list(page.objectIds ?? [page.objectId]).filter(Boolean).join(" / "),
        list(page.fieldIds).length,
        list(page.actionIds).join("<br>"),
        `[页面合同](../${wireframePath(module).replace(`${REQUIREMENT_PACKAGE_ROOT}/`, "")})`,
      ])),
    ),
  ]);
}

function renderCurrentPackagesJson(model) {
  return `${JSON.stringify({
    reviewStatus: model.reviewStatus,
    modules: [...list(model.modules)].sort((left, right) => (
      artifactMeta(left.id).index.localeCompare(artifactMeta(right.id).index)
    )).map((module) => ({
      id: module.id,
      title: module.title,
      phase: module.phase,
      priority: module.priority,
      prd: prdPath(module),
      wireframe: module.phase === 1 ? wireframePath(module) : null,
      objectIds: list(module.objects).map((object) => object.id),
      actionIds: list(module.actions).map((action) => action.id),
      pageIds: list(module.pages).map((page) => page.id),
    })),
  }, null, 2)}\n`;
}

function renderAiReportPathContract(model) {
  const modules = ["RPT-001", "LPATH-001"].map((id) => moduleById(model, id));
  return normalizeDocument([
    "# 报告、定期画像与长期学习路径合同",
    markdownTable(
      ["模块", "对象", "状态", "Action", "Flow"],
      modules.map((module) => [
        module.id,
        list(module.objects).map((object) => object.id).join("<br>"),
        list(module.objects).map((object) => `${object.id}:${list(object.states).join("/")}`).join("<br>"),
        list(module.actions).map((action) => action.id).join("<br>"),
        list(model.flows).filter((flow) => list(flow.moduleIds).includes(module.id)).map((flow) => flow.id).join("<br>"),
      ]),
    ),
  ]);
}

function renderGovernance(model) {
  return normalizeDocument([
    "# 第一性原理与项目行动准则",
    markdownList([
      "先确定业务事实、Owner、确认者和权限边界，再讨论页面与实现。",
      "每个数据必须有唯一权威对象；视图、AI 建议、报告和学习画像只能保存源引用与版本，不能复制正式事实。",
      "每个动作必须回答谁能做、对什么范围做、读写哪些字段、状态如何变化、失败后什么不变。",
      "每个下拉和选择必须有稳定 Option Set 或授权运行时查询；不允许页面写死未经登记的值。",
      "数据流必须显式描述源对象、源版本、步骤、目标对象、幂等键、对象级失败、重试和下游失效。",
      "AI 能力按查询、分析、草稿、临时报告、定期任务和受控动作分级；写入必须预览、确认和审计。",
      "生成文档不是事实源；所有缺陷回到 facts、validators 或 renderers 修复后重生成。",
      `当前事实模型包含 ${list(model.modules).length} 个模块和 ${list(model.flows).length} 条 Flow。`,
    ]),
  ]);
}

function renderHandoff(title, audience, model, focus) {
  return normalizeDocument([
    `# ${title}`,
    `受众：${audience}。`,
    markdownList([
      `只以 ${model.reviewStatus.code} 状态下生成的 Object、Field、Action、Flow、Page、Scenario 和 Metric ID 为实现范围。`,
      focus,
      "发现字段、枚举、权限、状态或失败码缺失时，回到事实模型提出缺陷；不得在实现侧静默发明。",
      "第三方渠道和 AI 视频能力不在第一阶段实现范围。",
    ]),
  ]);
}

export function buildRequirementArtifacts(model) {
  validateReviewStatus(model?.reviewStatus);
  assertValidRequirementModel(model);
  if (!Array.isArray(model?.modules) || model.modules.length === 0) {
    throw new Error("model.modules must be a non-empty array");
  }
  const modelIds = new Set(model.modules.map((module) => module.id));
  if (
    modelIds.size !== model.modules.length
    || model.modules.some((module) => !MODULE_ARTIFACT_META.has(module.id))
    || [...MODULE_ARTIFACT_META.keys()].some((id) => !modelIds.has(id))
  ) throw new Error("module artifact metadata must exactly match the model modules");

  const artifacts = [];
  const add = (artifactPath, content) => {
    const normalized = typeof content === "string" && content.endsWith("\n")
      ? content
      : `${String(content ?? "").trimEnd()}\n`;
    artifacts.push({ path: artifactPath, content: normalized });
  };

  add(`${REQUIREMENT_PACKAGE_ROOT}/00-readme.zh-CN.md`, renderReadme(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/00-start-here-by-role.zh-CN.md`, renderStartByRole(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/01-update-summary.zh-CN.md`, renderUpdateSummary(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/02-product-review-status.zh-CN.md`, renderReviewStatus(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/02-indexes/current-module-packages.json`, renderCurrentPackagesJson(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/02-indexes/current-module-packages.md`, renderModulePackages(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/02-indexes/module-capability-matrix.md`, renderCapabilityMatrix(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/02-indexes/open-product-decisions.md`, renderOpenDecisions(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/02-indexes/page-prototype-map.md`, renderPageMap(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/02-indexes/requirement-traceability.md`, renderTraceability(model));

  for (const module of model.modules) {
    add(prdPath(module), renderModulePrd(module, model));
    if (module.phase === 1) add(wireframePath(module), renderModuleWireframe(module, model));
  }

  add(`${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/authoritative-object-catalog.md`, renderAuthoritativeObjectCatalog(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/core-object-state-model.md`, renderStateModel(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/data-flow-catalog.md`, renderDataFlowCatalog(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/data-lifecycle-ai-usage.md`, renderLifecycleAiUsage(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/data-ownership-matrix.md`, renderOwnershipMatrix(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/field-option-catalog.md`, renderFieldOptionCatalog(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/permissions-matrix.md`, renderPermissionsMatrix(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/04-data-contracts/success-metric-catalog.md`, renderMetricCatalog(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/06-ai-contracts/ai-conversation-task-execution.md`, renderAiTaskRegistry(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/06-ai-contracts/reports-learning-path-contract.md`, renderAiReportPathContract(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/07-review-checklists/completeness-scan-report.md`, renderSemanticScan(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/07-review-checklists/first-principles-governance.md`, renderGovernance(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/07-review-checklists/package-review-checklist.md`, renderPackageReviewChecklist(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/08-role-handoffs/cross-role-responsibility-matrix.md`, renderCrossRoleMatrix(model));
  add(`${REQUIREMENT_PACKAGE_ROOT}/11-message-to-frontend-architect.zh-CN.md`, renderHandoff("给前端架构师的交接", "前端架构与 Web/App 实现团队", model, "页面必须逐项引用 Page、Field、Action 与 Option Set；端差异只改变任务呈现，不改变权限和业务事实。"));
  add(`${REQUIREMENT_PACKAGE_ROOT}/12-message-to-backend-rd.zh-CN.md`, renderHandoff("给后端研发的交接", "后端与数据实现团队", model, "以对象责任、状态转换、动作输入输出、权限、幂等、审计和 Flow 版本合同为服务端边界。"));
  add(`${REQUIREMENT_PACKAGE_ROOT}/13-message-to-pm.zh-CN.md`, renderHandoff("给产品经理的交接", "产品经理与教研评审", model, "以基线决策、模块目标、开放决策、业务失败因果语义和验收场景完成产品评审。"));
  add(`${REQUIREMENT_PACKAGE_ROOT}/14-message-to-qa.zh-CN.md`, renderHandoff("给测试团队的交接", "测试与质量团队", model, "把每个 Scenario、失败码、权限 DENY、版本冲突和 Flow 补偿转为正向与负向自动化用例。"));

  artifacts.sort((left, right) => left.path.localeCompare(right.path));
  const paths = artifacts.map((artifact) => artifact.path);
  if (new Set(paths).size !== paths.length) throw new Error("duplicate generated artifact path");
  return artifacts;
}

export function renderRequirementPackage(model, root = process.cwd()) {
  const artifacts = buildRequirementArtifacts(model);
  const absolutePackageRoot = path.join(root, REQUIREMENT_PACKAGE_ROOT);
  fs.rmSync(absolutePackageRoot, { recursive: true, force: true });
  for (const artifact of artifacts) {
    const destination = path.join(root, artifact.path);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, artifact.content, "utf8");
  }
  return artifacts;
}
