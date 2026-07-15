import {
  actorText,
  inlineCode,
  joinIds,
  markdownList,
  markdownTable,
  normalizeDocument,
  permissionScopeText,
  requiredText,
  stateText,
  valueSourceText,
} from "./markdown.mjs";

const list = (value) => (Array.isArray(value) ? value : []);

function allObjects(model) {
  return list(model.modules).flatMap((module) => (
    list(module.objects).map((object) => ({ module, object }))
  ));
}

function allFields(model) {
  return allObjects(model).flatMap(({ module, object }) => (
    list(object.fields).map((field) => ({ module, object, field }))
  ));
}

function allActions(model) {
  return list(model.modules).flatMap((module) => (
    list(module.actions).map((action) => ({ module, action }))
  ));
}

function allPages(model) {
  return list(model.modules).flatMap((module) => (
    list(module.pages).map((page) => ({ module, page }))
  ));
}

function allScenarios(model) {
  return list(model.modules).flatMap((module) => (
    list(module.scenarios).map((scenario) => ({ module, scenario }))
  ));
}

function transitionText(action) {
  if (!action.transition) return action.operationKind === "CREATE"
    ? `CREATE → ${list(action.scenarioIds).length > 0 ? "成功场景状态" : "—"}`
    : "不改变状态";
  return `${stateText(action.transition.from)} → ${stateText(action.transition.to)}`;
}

function permissionText(permissions) {
  return list(permissions).map((permission) => (
    `${permission.effect}:${actorText(permission)} (${permission.condition})${
      permission.scope ? ` [${permissionScopeText(permission.scope)}]` : ""
    }`
  )).join("<br>");
}

function dataRefText(ref) {
  if (!ref || typeof ref !== "object") return "—";
  return [
    `${ref.objectId}.${ref.fieldId}`,
    ref.version ? `version=${ref.version}` : undefined,
    ref.cardinality ? `cardinality=${ref.cardinality}` : undefined,
    ref.semanticRole ? `role=${ref.semanticRole}` : undefined,
  ].filter(Boolean).join("; ");
}

export function renderAuthoritativeObjectCatalog(model) {
  return normalizeDocument([
    "# 权威对象与字段目录",
    "所有对象、字段、Owner、确认者、生命周期和敏感级别均直接来自已校验事实模型；跨模块消费只能使用对象 ID、字段 ID 和版本绑定。",
    "## 对象目录",
    markdownTable(
      ["模块", "Object ID", "对象", "数据主体", "产生者", "Owner", "确认者", "Steward", "生命周期", "敏感级别", "读取模式", "状态"],
      allObjects(model).map(({ module, object }) => [
        module.id,
        object.id,
        object.label,
        object.dataSubject,
        object.producerRef,
        object.ownerRef,
        object.confirmerRef,
        object.stewardRef,
        object.lifecyclePolicyId,
        object.sensitivityId,
        object.readMode,
        list(object.states).map((state) => typeof state === "string" ? state : state.id ?? state.code).join(" / "),
      ]),
    ),
    "## 字段目录",
    markdownTable(
      ["模块", "Object ID", "Field ID", "字段", "类型", "必填", "值来源", "可变性", "可见性", "幂等角色", "校验", "历史策略"],
      allFields(model).map(({ module, object, field }) => [
        module.id,
        object.id,
        field.id,
        field.label,
        field.dataType,
        requiredText(field.required),
        valueSourceText(field.valueSource),
        field.mutability,
        field.visibility,
        field.idempotencyRole ?? "—",
        field.validation,
        field.historyPolicy,
      ]),
    ),
  ]);
}

export function renderOwnershipMatrix(model) {
  return normalizeDocument([
    "# 数据 Owner 与责任矩阵",
    markdownTable(
      ["模块", "Object ID", "控制主体", "数据主体", "产生者", "业务 Owner", "确认者", "Steward", "默认读模式"],
      allObjects(model).map(({ module, object }) => [
        module.id,
        object.id,
        object.controlSubject,
        object.dataSubject,
        object.producerRef,
        object.ownerRef,
        object.confirmerRef,
        object.stewardRef,
        object.readMode,
      ]),
    ),
  ]);
}

export function renderStateModel(model) {
  const actions = allActions(model);
  return normalizeDocument([
    "# 对象状态与动作转换合同",
    "## 对象状态",
    markdownTable(
      ["模块", "Object ID", "初始状态来源", "全部状态"],
      allObjects(model).map(({ module, object }) => [
        module.id,
        object.id,
        object.stateReachability?.mode === "ACTION_GRAPH"
          ? `Action Graph；显式初始=${stateText(object.stateReachability.initialStateIds)}`
          : object.stateReachability?.mode,
        list(object.states).map((state) => typeof state === "string" ? state : state.id ?? state.code).join(" / "),
      ]),
    ),
    "## 动作转换",
    markdownTable(
      ["模块", "Action ID", "目标对象", "操作", "状态效果", "风险", "审计", "失败结果"],
      actions.map(({ module, action }) => [
        module.id,
        action.id,
        action.targetObjectId,
        action.operationKind,
        transitionText(action),
        action.risk,
        action.auditMode,
        list(action.failureResults).join(" / "),
      ]),
    ),
  ]);
}

export function renderPermissionsMatrix(model) {
  return normalizeDocument([
    "# Action 级权限矩阵",
    "每一行均为可执行动作的显式 ALLOW 或 DENY 决策；客户端可见性不能替代服务端权限判断。",
    markdownTable(
      ["模块", "Action ID", "目标对象", "效果", "主体", "条件", "记录范围", "端", "风险", "审计"],
      allActions(model).flatMap(({ module, action }) => (
        list(action.permissions).map((permission) => [
          module.id,
          action.id,
          action.targetObjectId,
          permission.effect,
          actorText(permission),
          permission.condition,
          permissionScopeText(permission.scope),
          list(action.clients).join(" / ") || action.executionMode,
          action.risk,
          action.auditMode,
        ])
      )),
    ),
  ]);
}

export function renderFieldOptionCatalog(model) {
  return normalizeDocument([
    "# 字段与 Option Set 合同",
    "## Option Set",
    markdownTable(
      ["Option Set ID", "键", "名称", "模式", "稳定值 / 运行时来源"],
      list(model.optionSets).map((optionSet) => [
        optionSet.id,
        optionSet.key,
        optionSet.label,
        optionSet.mode,
        optionSet.mode === "STATIC"
          ? list(optionSet.values).map((value) => `${value.code}=${value.label}`).join("<br>")
          : JSON.stringify(optionSet.source),
      ]),
    ),
    "## 字段引用",
    markdownTable(
      ["模块", "Object ID", "Field ID", "字段", "类型", "值来源", "必填", "可变性", "可见性"],
      allFields(model).map(({ module, object, field }) => [
        module.id,
        object.id,
        field.id,
        field.label,
        field.dataType,
        valueSourceText(field.valueSource),
        requiredText(field.required),
        field.mutability,
        field.visibility,
      ]),
    ),
  ]);
}

export function renderDataFlowCatalog(model) {
  const sections = list(model.flows).map((flow) => normalizeDocument([
    `## ${flow.id} ${flow.label}`,
    markdownTable(
      ["阶段", "合同 Profile", "参与模块", "路由策略", "失败粒度", "重试策略", "补偿", "下游失效"],
      [[
        flow.phase,
        flow.contractProfile,
        list(flow.moduleIds).join(" / "),
        JSON.stringify(flow.routingPolicy),
        flow.failureGranularity,
        JSON.stringify(flow.retryPolicy),
        JSON.stringify(flow.compensation),
        JSON.stringify(flow.downstreamInvalidation),
      ]],
    ),
    "### 数据输入",
    markdownTable(
      ["对象字段", "语义"],
      list(flow.sourceDataRefs).map((ref) => [dataRefText(ref), ref.semanticRole ?? "—"]),
    ),
    "### 执行步骤",
    markdownTable(
      ["顺序", "Action ID", "条件", "providedInputs"],
      list(flow.steps).map((step) => [
        step.order,
        step.actionId,
        step.condition ?? "—",
        JSON.stringify(step.providedInputs ?? []),
      ]),
    ),
    "### 执行路径",
    markdownTable(
      ["路径", "语义角色", "步骤", "路由", "providedInputs", "源绑定", "路径幂等键"],
      list(flow.executionPaths).map((path) => [
        path.id,
        path.semanticRole ?? "—",
        list(path.stepOrders).join(" → "),
        JSON.stringify(path.route),
        JSON.stringify(path.providedInputs ?? []),
        JSON.stringify(path.sourceBindings ?? []),
        JSON.stringify(path.idempotencyKeyParts ?? {}),
      ]),
    ),
    "### 数据输出",
    markdownTable(
      ["对象字段", "语义"],
      list(flow.targetDataRefs).map((ref) => [dataRefText(ref), ref.semanticRole ?? "—"]),
    ),
    "### 幂等与失败",
    markdownTable(
      ["幂等键", "失败粒度", "重试策略", "补偿", "下游失效"],
      [[
        JSON.stringify(flow.idempotencyKeyParts),
        flow.failureGranularity,
        JSON.stringify(flow.retryPolicy),
        JSON.stringify(flow.compensation),
        JSON.stringify(flow.downstreamInvalidation),
      ]],
    ),
  ]));
  return normalizeDocument(["# 数据流转合同", ...sections]);
}

export function renderLifecycleAiUsage(model) {
  return normalizeDocument([
    "# 数据生命周期、敏感级别与 AI 使用边界",
    "## 生命周期策略",
    markdownTable(
      ["Policy ID", "适用范围", "写入规则", "历史规则", "保留 Owner", "到期 / 归档"],
      list(model.lifecyclePolicies).map((policy) => [
        policy.id,
        policy.scope,
        policy.writeRule,
        policy.historyRule,
        policy.retentionOwner,
        policy.expiryOrArchival,
      ]),
    ),
    "## 敏感级别",
    markdownTable(
      ["Sensitivity ID", "名称", "处理规则"],
      list(model.sensitivities).map((sensitivity) => [
        sensitivity.id,
        sensitivity.label,
        sensitivity.handlingRule,
      ]),
    ),
    "## 非功能门禁",
    markdownTable(
      ["NFR ID", "要求", "Owner", "验证"],
      list(model.nfrs).map((nfr) => [nfr.id, nfr.statement, nfr.ownerRef, nfr.verification]),
    ),
    "## 第二阶段扩展",
    markdownTable(
      ["Extension ID", "名称", "阶段", "状态", "依赖", "准入条件", "第一阶段排除行为"],
      list(model.extensions).map((extension) => [
        extension.id,
        extension.label,
        extension.phase,
        extension.status,
        list(extension.dependencies).join("<br>"),
        list(extension.entryCriteria).join("<br>"),
        list(extension.excludedFirstStageBehavior).join("<br>"),
      ]),
    ),
  ]);
}

export function renderAiTaskRegistry(model) {
  return normalizeDocument([
    "# AI 对话与任务执行合同",
    "AI 是产品内 Web/App 能力；不存在面向目标用户的终端命令行入口。写入类任务必须预览、确认、权限复核和审计。",
    markdownTable(
      ["Task ID", "任务", "类型", "能力", "目标 Action", "端", "受众", "确认者", "预览字段", "草稿边界", "失败行为"],
      list(model.aiTasks).map((task) => [
        task.id,
        list(task.naturalLanguageExamples).join("<br>"),
        task.taskType,
        task.capability,
        task.actionId,
        list(task.clients).join(" / "),
        [...list(task.roleRefs), ...list(task.dutyRefs)].join(" / "),
        JSON.stringify(task.confirmer),
        list(task.previewFieldIds).join("<br>"),
        JSON.stringify(task.draftPurpose),
        JSON.stringify(task.failureBehavior),
      ]),
    ),
  ]);
}

export function renderMetricCatalog(model) {
  return normalizeDocument([
    "# 成功指标与事件计算合同",
    markdownTable(
      ["Metric ID", "Owner", "范围", "聚合", "统计量", "关联键", "窗口", "事件", "排除", "目标", "序列"],
      list(model.metrics).map((metric) => [
        metric.id,
        metric.ownerRef,
        metric.scope,
        metric.aggregation,
        metric.statistic ?? "—",
        metric.correlationKey ?? "—",
        metric.window,
        list(metric.eventIds).join(" / "),
        metric.exclusions,
        metric.target,
        JSON.stringify(metric.series),
      ]),
    ),
  ]);
}

export function renderTraceability(model) {
  const objects = allObjects(model);
  const fields = allFields(model);
  const actions = allActions(model);
  const pages = allPages(model);
  const scenarios = allScenarios(model);
  const rows = [];

  for (const decision of list(model.baselineDecisions)) {
    rows.push([
      "Baseline",
      decision.id,
      "全局",
      decision.statement,
      list(model.modules).filter((module) => list(module.baselineDecisionIds).includes(decision.id)).map((module) => module.id).join(" / "),
    ]);
  }
  for (const { module, object } of objects) {
    rows.push([
      "Object",
      object.id,
      module.id,
      object.label,
      list(object.fields).map((field) => field.id).join(" / "),
    ]);
  }
  for (const { module, object, field } of fields) {
    const consumers = actions.filter(({ action }) => (
      list(action.inputFieldIds).includes(field.id) || list(action.outputFieldIds).includes(field.id)
    )).map(({ action }) => action.id);
    rows.push(["Field", field.id, module.id, object.id, consumers.join(" / ")]);
  }
  for (const { module, action } of actions) {
    const consumers = [
      ...pages.filter(({ page }) => list(page.actionIds).includes(action.id)).map(({ page }) => page.id),
      ...list(model.flows).filter((flow) => list(flow.steps).some((step) => step.actionId === action.id)).map((flow) => flow.id),
      ...list(model.aiTasks).filter((task) => task.actionId === action.id).map((task) => task.id),
    ];
    rows.push(["Action", action.id, module.id, action.targetObjectId, consumers.join(" / ")]);
  }
  for (const flow of list(model.flows)) {
    rows.push([
      "Flow",
      flow.id,
      list(flow.moduleIds).join(" / "),
      flow.label,
      list(flow.steps).map((step) => step.actionId).join(" / "),
    ]);
  }
  for (const { module, page } of pages) {
    rows.push(["Page", page.id, module.id, page.label, list(page.actionIds).join(" / ")]);
  }
  for (const { module, scenario } of scenarios) {
    rows.push([
      "Scenario",
      scenario.id,
      module.id,
      scenario.actionId,
      scenario.resultCode ?? scenario.then?.expectedState?.value ?? "SUCCESS",
    ]);
  }
  for (const metric of list(model.metrics)) {
    rows.push(["Metric", metric.id, metric.ownerRef, metric.scope, list(metric.eventIds).join(" / ")]);
  }
  for (const task of list(model.aiTasks)) {
    rows.push([
      "AI Task",
      task.id,
      "全局",
      list(task.naturalLanguageExamples).join(" / "),
      task.actionId,
    ]);
  }

  return normalizeDocument([
    "# 需求追踪矩阵",
    "该矩阵由结构化事实逐项生成，覆盖基线决策、对象、字段、动作、数据流、页面、场景、指标和 AI 任务。",
    markdownTable(["类型", "ID", "模块 / Owner", "上游 / 说明", "下游 / 映射"], rows),
  ]);
}

export function renderCrossRoleMatrix(model) {
  const roleRows = [
    ...list(model.roles).map((role) => ["登录角色", role.id, role.label, "—"]),
    ...list(model.duties).map((duty) => ["附加职责", duty.id, duty.label, duty.roleId]),
  ];
  return normalizeDocument([
    "# 跨角色责任与动作边界",
    "## 身份与职责",
    markdownTable(["类型", "ID", "名称", "所属登录角色"], roleRows),
    "## 动作授权",
    markdownTable(
      ["模块", "Action ID", "ALLOW", "DENY", "目标对象"],
      allActions(model).map(({ module, action }) => [
        module.id,
        action.id,
        list(action.permissions).filter((permission) => permission.effect === "ALLOW").map(actorText).join(" / "),
        list(action.permissions).filter((permission) => permission.effect === "DENY").map(actorText).join(" / "),
        action.targetObjectId,
      ]),
    ),
  ]);
}

export function renderSemanticScan(model) {
  const counts = {
    modules: list(model.modules).length,
    objects: allObjects(model).length,
    fields: allFields(model).length,
    actions: allActions(model).length,
    pages: allPages(model).length,
    scenarios: allScenarios(model).length,
    flows: list(model.flows).length,
    aiTasks: list(model.aiTasks).length,
    metrics: list(model.metrics).length,
  };
  return normalizeDocument([
    "# 完整性与语义扫描报告",
    `reviewStatus: ${inlineCode(model.reviewStatus?.code)}`,
    markdownTable(
      ["检查项", "结果", "证据"],
      [
        ["结构化事实规模", "PASS", Object.entries(counts).map(([key, value]) => `${key}=${value}`).join("；")],
        ["27 模块清单", counts.modules === 27 ? "PASS" : "FAIL", "事实模型 modules"],
        ["第二阶段无可执行页面", list(model.modules).filter((module) => module.phase === 2).every((module) => list(module.pages).length === 0 && list(module.actions).length === 0) ? "PASS" : "FAIL", "phase=2 actions/pages"],
        ["对象责任字段", allObjects(model).every(({ object }) => [object.producerRef, object.ownerRef, object.confirmerRef, object.stewardRef].every(Boolean)) ? "PASS" : "FAIL", "producer/owner/confirmer/steward"],
        ["动作场景追踪", allActions(model).every(({ action }) => list(action.scenarioIds).length > 1) ? "PASS" : "FAIL", "scenarioIds"],
        ["生成源", "PASS", "validated facts → renderers → Markdown"],
      ],
    ),
  ]);
}

export function renderPackageReviewChecklist(model) {
  return normalizeDocument([
    "# 需求包评审核对表",
    markdownList([
      `确认 ${list(model.modules).length} 个模块均来自同一事实模型。`,
      "确认每个第一阶段对象均有 Owner、确认者、生命周期、敏感级别和可达状态。",
      "确认每个动作均有输入、输出、ALLOW/DENY、状态效果、失败码和验收场景。",
      "确认下拉与选择字段只引用中央 Option Set。",
      "确认 Flow 的源对象、源版本、动作顺序、目标对象、幂等和补偿可追踪。",
      "确认班主任全学科只读协调不扩大为他科学科写权限。",
      "确认 Web/App 共享权限判断，但不要求 App 一比一复制 Web。",
      "确认第三方渠道、AI 讲题视频和 AI 教学视频只作为第二阶段扩展。",
    ]),
  ]);
}
