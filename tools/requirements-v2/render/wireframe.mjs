import {
  actorText,
  markdownList,
  markdownTable,
  normalizeDocument,
  requiredText,
  stateText,
  valueSourceText,
} from "./markdown.mjs";
import { renderReleaseBanner } from "./release.mjs";

const list = (value) => (Array.isArray(value) ? value : []);

function transitionText(action) {
  if (!action?.transition) return action?.operationKind === "CREATE" ? "CREATE" : "UNCHANGED";
  return `${stateText(action.transition.from)} → ${stateText(action.transition.to)}`;
}

export function renderModuleWireframe(module) {
  if (!module || typeof module !== "object") {
    throw new TypeError("renderModuleWireframe requires a module fact");
  }
  const fieldById = new Map(list(module.objects).flatMap((object) => (
    list(object.fields).map((field) => [field.id, { object, field }])
  )));
  const actionById = new Map(list(module.actions).map((action) => [action.id, action]));
  const pageSections = list(module.pages).map((page) => {
    const pageFields = list(page.fieldIds).map((id) => fieldById.get(id)).filter(Boolean);
    const pageActions = list(page.actionIds).map((id) => actionById.get(id)).filter(Boolean);
    return normalizeDocument([
      `## ${page.id} ${page.label}`,
      markdownTable(
        ["交付可用性", "适用端", "对象", "区域", "视图状态"],
        [[
          page.availability ?? module.releaseStatus,
          list(page.clients).join(" / "),
          list(page.objectIds ?? [page.objectId]).filter(Boolean).join(" / "),
          list(page.regions).join(" / "),
          list(page.viewStates).join(" / "),
        ]],
      ),
      "### 页面任务",
      markdownList([
        "进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。",
        "页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。",
        "提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。",
        "版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。",
      ]),
      "### 字段与控件语义",
      markdownTable(
        ["Object ID", "Field ID", "字段", "类型", "必填", "值来源 / Option Set", "可变性", "可见性", "校验"],
        pageFields.map(({ object, field }) => [
          object.id,
          field.id,
          field.label,
          field.dataType,
          requiredText(field.required),
          valueSourceText(field.valueSource),
          field.mutability,
          field.visibility,
          field.validation,
        ]),
      ),
      "### 动作与反馈",
      markdownTable(
        ["Action ID", "动作", "操作", "输入", "输出", "状态效果", "ALLOW", "DENY", "风险 / 审计", "失败反馈"],
        pageActions.map((action) => [
          action.id,
          action.label,
          action.operationKind,
          list(action.inputFieldIds).join("<br>"),
          list(action.outputFieldIds).join("<br>"),
          transitionText(action),
          list(action.permissions).filter((permission) => permission.effect === "ALLOW").map(actorText).join(" / "),
          list(action.permissions).filter((permission) => permission.effect === "DENY").map(actorText).join(" / "),
          `${action.risk} / ${action.auditMode}`,
          list(action.failureResults).join(" / "),
        ]),
      ),
      "### Web / App 差异",
      markdownTable(
        ["端", "本页要求"],
        [
          ["WEB", list(page.clients).includes("WEB") ? "支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。" : "本页不登记 Web 入口。"],
          ["APP", list(page.clients).includes("APP") ? "支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。" : "本页不登记 App 入口。"],
        ],
      ),
    ]);
  });

  return normalizeDocument([
    renderReleaseBanner(module),
    `# ${module.id} ${module.title} Web/App 页面合同 v2.0`,
    markdownTable(
      ["属性", "值"],
      [
        ["模块", module.id],
        ["阶段", module.phase],
        ["交付状态", module.releaseStatus],
        ["页面数量", list(module.pages).length],
        ["端原则", "同一事实与权限合同，按端任务频率和复杂度差异化"],
      ],
    ),
    ...pageSections,
  ]);
}
