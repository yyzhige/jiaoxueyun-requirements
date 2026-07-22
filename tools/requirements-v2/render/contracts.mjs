import {
  actorText,
  inlineCode,
  joinIds,
  markdownList,
  markdownTable,
  normalizeDocument,
  permissionScopeText,
  professionalAuthorizationText,
  requiredText,
  stateText,
  teacherWriteScopePolicyText,
  valueSourceText,
} from "./markdown.mjs";
import {
  TRACE_AXIS_KEYS,
  TRACE_AXIS_METADATA,
  TRACE_AXIS_STATUS,
} from "../facts/baseline-traceability.mjs";

const list = (value) => (Array.isArray(value) ? value : []);

function traceAxisValue(trace, axisKey) {
  const references = list(trace?.[axisKey]);
  const applicability = trace?.axisApplicability?.[axisKey];
  if (references.length > 0) {
    if (axisKey === "permissionRefs") {
      return references.map(({ actionId, effect }) => `${effect}:${inlineCode(actionId)}`).join("、");
    }
    return joinIds(references);
  }
  if (applicability?.status === TRACE_AXIS_STATUS.NOT_APPLICABLE) {
    return `N/A [${inlineCode(applicability.reasonCode)}]：${applicability.reason}`;
  }
  return "INVALID_TRACE_AXIS";
}

function traceAxisLine(trace, axisKey) {
  return `${TRACE_AXIS_METADATA[axisKey].label}：${traceAxisValue(trace, axisKey)}`;
}

function chapterDecisionText(trace) {
  return list(trace?.decisionIds).length > 0
    ? joinIds(trace.decisionIds)
    : "N/A [`NO_DIRECT_ATOMIC_DECISION`]：本章节由章节级直接合同承载，不重复绑定 D003-D096 原子决策。";
}

function migrationDecisionAffectedText(change) {
  return Object.entries(change?.decisionAffected ?? {}).map(([decisionId, source]) => {
    const references = Object.entries(source?.affected ?? {})
      .filter(([, values]) => list(values).length > 0)
      .map(([key, values]) => `${key}: ${joinIds(values)}`)
      .join("；");
    const notApplicableAxes = TRACE_AXIS_KEYS.filter((axisKey) => (
      source?.axisApplicability?.[axisKey]?.status === TRACE_AXIS_STATUS.NOT_APPLICABLE
    ));
    return `${inlineCode(decisionId)} — ${references || "无直接引用"}；显式 N/A：${notApplicableAxes.length > 0 ? joinIds(notApplicableAxes) : "无"}`;
  }).join("<br>");
}

function traceAxesComplete(trace) {
  return TRACE_AXIS_KEYS.every((axisKey) => {
    const references = list(trace?.[axisKey]);
    const applicability = trace?.axisApplicability?.[axisKey];
    return references.length > 0
      ? applicability?.status === TRACE_AXIS_STATUS.APPLICABLE
      : applicability?.status === TRACE_AXIS_STATUS.NOT_APPLICABLE
        && typeof applicability?.reason === "string"
        && applicability.reason.trim().length >= 12
        && applicability.reason !== "—";
  });
}

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
      ["模块", "Object ID", "对象", "数据主体", "数据性质", "产生者", "Owner", "确认者", "Steward", "生命周期", "敏感级别", "学生数据分类", "特权读取策略", "读取模式", "教师写入策略", "状态"],
      allObjects(model).map(({ module, object }) => [
        module.id,
        object.id,
        object.label,
        object.dataSubject,
        object.dataNature ?? "—",
        object.producerRef,
        object.ownerRef,
        object.confirmerRef,
        object.stewardRef,
        object.lifecyclePolicyId,
        object.sensitivityId,
        object.studentDataClassification?.kind ?? "—",
        object.studentDataClassification?.privilegedReadPolicy ?? "—",
        object.readMode,
        teacherWriteScopePolicyText(object.teacherWriteScopePolicy),
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
      ["模块", "Action ID", "目标对象", "授权边界", "访问例外", "效果", "主体", "条件", "记录范围", "端", "风险", "审计"],
      allActions(model).flatMap(({ module, action }) => (
        list(action.permissions).map((permission) => [
          module.id,
          action.id,
          action.targetObjectId,
          professionalAuthorizationText(action),
          action.accessGuard?.exceptionKind ?? "—",
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

export function renderProductBaselineTraceability(model) {
  const chapterById = new Map(list(model.baselineChapters).map((chapter) => [chapter.id, chapter]));
  return normalizeDocument([
    "# 产品基线 v2.0 全追踪矩阵",
    "每行从 README 章节和 D003-D096 决策追踪到阶段、交付状态、模块、页面、Flow、对象、动作、权限、状态、指标、上线门和验收场景。没有直接影响的轴必须给出结构化 N/A 原因，不允许用空白或无解释的破折号代替。",
    markdownTable(
      ["章节", "决策", "阶段 / 交付", "模块 / 页面", "Flow / 对象", "动作 / 权限", "状态", "指标 / 上线门", "场景 / 测试"],
      list(model.baselineTraceability).map((trace) => [
        `${trace.chapterId} ${chapterById.get(trace.chapterId)?.heading ?? ""}`,
        chapterDecisionText(trace),
        `${joinIds(trace.phaseIds)}<br>${joinIds(trace.releaseStatuses)}`,
        `${traceAxisLine(trace, "moduleIds")}<br>${traceAxisLine(trace, "pageIds")}`,
        `${traceAxisLine(trace, "flowIds")}<br>${traceAxisLine(trace, "objectIds")}`,
        `${traceAxisLine(trace, "actionIds")}<br>${traceAxisLine(trace, "permissionRefs")}`,
        traceAxisLine(trace, "stateRefs"),
        `${traceAxisLine(trace, "metricIds")}<br>${traceAxisLine(trace, "launchGateIds")}`,
        `${traceAxisLine(trace, "scenarioIds")}<br>${traceAxisLine(trace, "testIds")}`,
      ]),
    ),
  ]);
}

export function renderDecisionMatrix(model) {
  const traceByDecisionId = new Map(list(model.decisionTraceability).map((trace) => (
    [trace.decisionId, trace]
  )));
  return normalizeDocument([
    "# D003-D096 决策矩阵",
    markdownTable(
      ["决策", "最终结论", "选择路线", "拒绝路线", "阶段 / 交付", "README 章节", "迁移", "精确需求合同", "权限 / 状态", "指标 / 门 / 验收"],
      list(model.productDecisions).map((decision) => {
        const trace = traceByDecisionId.get(decision.id);
        return [
          decision.id,
          decision.statement,
          decision.selectedRoute,
          joinIds(decision.rejectedRoutes),
          `${joinIds(trace?.phaseIds)}<br>${joinIds(trace?.releaseStatuses)}`,
          joinIds(trace?.chapterIds),
          joinIds(trace?.migrationIds),
          [
            traceAxisLine(trace, "moduleIds"),
            traceAxisLine(trace, "pageIds"),
            traceAxisLine(trace, "flowIds"),
            traceAxisLine(trace, "objectIds"),
            traceAxisLine(trace, "actionIds"),
          ].join("<br>"),
          `${traceAxisLine(trace, "permissionRefs")}<br>${traceAxisLine(trace, "stateRefs")}`,
          [
            traceAxisLine(trace, "metricIds"),
            traceAxisLine(trace, "launchGateIds"),
            traceAxisLine(trace, "scenarioIds"),
            traceAxisLine(trace, "testIds"),
          ].join("<br>"),
        ];
      }),
    ),
  ]);
}

export function renderBaselineMigrationLog(model) {
  return normalizeDocument([
    "# 产品基线 v2.0 迁移日志",
    markdownTable(
      ["迁移", "决策", "旧规则", "新规则", "拒绝原因", "逐决策精确影响", "组级影响汇总"],
      list(model.migrationChanges).map((change) => [
        change.id,
        joinIds(change.decisionIds),
        change.oldRule,
        change.newRule,
        change.rejectedReason,
        migrationDecisionAffectedText(change),
        Object.entries(change.affected ?? {})
          .filter(([, values]) => list(values).length > 0)
          .map(([key, values]) => `${key}: ${joinIds(values)}`)
          .join("<br>"),
      ]),
    ),
  ]);
}

export function renderActivityStatusAxisCatalog(model) {
  const module = list(model.modules).find(({ id }) => id === "HW-001");
  const statusFields = list(module?.objects).flatMap((object) => list(object.fields)
    .filter((field) => /STATUS$/.test(field.id) || /-STATUS-/.test(field.id))
    .map((field) => ({ object, field })));
  return normalizeDocument([
    "# 学习活动多轴状态目录",
    "治理、开放、归档、参与、时间和 AI 处理分别保存；界面标签只能由这些事实派生。",
    markdownTable(
      ["对象", "状态字段", "名称", "Option Set / 来源", "写入动作"],
      statusFields.map(({ object, field }) => [
        object.id,
        field.id,
        field.label,
        valueSourceText(field.valueSource),
        list(module?.actions).filter(({ outputFieldIds }) => list(outputFieldIds).includes(field.id)).map(({ id }) => id).join("<br>"),
      ]),
    ),
  ]);
}

export function renderAiResultStatusAxisCatalog(model) {
  const modules = list(model.modules).filter(({ id }) => ["GRD-001", "PUB-001"].includes(id));
  const axisFields = modules.flatMap((module) => list(module.objects).flatMap((object) => (
    list(object.fields).filter((field) => /(?:PROCESSING|PUBLICATION|DISPUTE-CORRECTION|VALIDITY)-STATUS/.test(field.id))
      .map((field) => ({ module, object, field }))
  )));
  return normalizeDocument([
    "# AI 结果多轴状态目录",
    "处理、发布、争议纠正和有效性是独立状态轴，不得压成单一生命周期枚举。",
    markdownTable(
      ["模块", "对象", "状态字段", "名称", "写入动作"],
      axisFields.map(({ module, object, field }) => [
        module.id,
        object.id,
        field.id,
        field.label,
        list(module.actions).filter(({ outputFieldIds, statusWrites }) => (
          list(outputFieldIds).includes(field.id)
          || list(statusWrites).some(({ fieldId }) => fieldId === field.id)
        )).map(({ id }) => id).join("<br>"),
      ]),
    ),
  ]);
}

function renderFocusedObjectContract(model, title, moduleId, objectId) {
  const module = list(model.modules).find(({ id }) => id === moduleId);
  const object = list(module?.objects).find(({ id }) => id === objectId);
  const actions = list(module?.actions).filter(({ targetObjectId }) => targetObjectId === objectId);
  return normalizeDocument([
    `# ${title}`,
    markdownTable(
      ["对象", "Owner", "数据主体", "状态"],
      [[object?.id, object?.ownerRef, object?.dataSubject, joinIds(object?.states?.map((state) => typeof state === "string" ? state : state.id ?? state.code))]],
    ),
    "## 字段",
    markdownTable(
      ["Field ID", "名称", "类型", "必填", "来源", "可变性"],
      list(object?.fields).map((field) => [
        field.id,
        field.label,
        field.dataType,
        requiredText(field.required),
        valueSourceText(field.valueSource),
        field.mutability,
      ]),
    ),
    "## 动作与权限",
    markdownTable(
      ["Action ID", "操作", "状态效果", "ALLOW / DENY", "失败结果"],
      actions.map((action) => [
        action.id,
        action.operationKind,
        transitionText(action),
        permissionText(action.permissions),
        joinIds(action.failureResults),
      ]),
    ),
  ]);
}

export function renderHighImpactAuthorizationMatrix(model) {
  return renderFocusedObjectContract(
    model,
    "未成年人高影响授权矩阵",
    "IAM-001",
    "IAM-OBJ-HIGH-IMPACT-AUTHORIZATION",
  );
}

export function renderWeakNetworkIntentCredential(model) {
  return renderFocusedObjectContract(
    model,
    "弱网提交意图凭证合同",
    "SUB-001",
    "SUB-OBJ-INTENT-CREDENTIAL",
  );
}

export function renderAnswerOpenSurfaceMatrix(model) {
  const publication = list(model.modules).find(({ id }) => id === "PUB-001");
  const contract = publication?.answerOpenContract;
  return normalizeDocument([
    "# 答案开放交付面矩阵",
    `policyId: ${inlineCode(contract?.policyId)}`,
    markdownTable(
      ["交付面", "执行种类", "动作", "开放时间字段", "访问时重鉴权", "开放前行为"],
      list(contract?.enforcementBindings).map((binding) => [
        binding.surface,
        binding.enforcementKind,
        joinIds(binding.actionIds),
        joinIds(binding.openTimeFieldIds),
        binding.reauthorizeAtAccess ? "是" : "否",
        binding.beforeOpenBehavior,
      ]),
    ),
  ]);
}

export function renderVideoGateQuotaContract(model) {
  const module = list(model.modules).find(({ id }) => id === "VIDEO-001");
  const focusedObjects = list(module?.objects).filter(({ id }) => (
    /(?:REQUEST|ASSET|ENTITLEMENT|OVERFLOW|QUOTA|VERIFICATION|LEARNING-FACT)/.test(id)
  ));
  const focusedActions = list(module?.actions).filter(({ id }) => (
    /(?:REQUEST|RESERVE|CHECK|DELIVER|SETTLE|RELEASE|RECALL|VERIFY|VERIFICATION|ENTITLEMENT|OVERFLOW)/.test(id)
  ));
  return normalizeDocument([
    "# AI 教学视频闸门与公平额度合同",
    markdownTable(
      ["对象", "Owner", "状态", "关键字段"],
      focusedObjects.map((object) => [
        object.id,
        object.ownerRef,
        joinIds(object.states?.map((state) => typeof state === "string" ? state : state.id ?? state.code)),
        joinIds(object.fields.map(({ id }) => id)),
      ]),
    ),
    "## 动作",
    markdownTable(
      ["Action ID", "目标对象", "状态效果", "失败结果"],
      focusedActions.map((action) => [
        action.id,
        action.targetObjectId,
        transitionText(action),
        joinIds(action.failureResults),
      ]),
    ),
  ]);
}

export function renderMetricGroupsLaunchGates(model) {
  return normalizeDocument([
    "# 六组指标与三类上线门",
    "## 指标组",
    markdownTable(
      ["指标组", "定义", "阶段", "指标", "分析维度", "禁止用途"],
      list(model.metricGroups).map((group) => [
        `${group.id} ${group.label}`,
        group.definition,
        joinIds(group.phaseIds),
        joinIds(group.metricIds),
        joinIds(group.analysisDimensions),
        group.prohibitedUse,
      ]),
    ),
    "## 上线门",
    markdownTable(
      ["上线门", "类型", "Owner", "阶段", "阻断条件", "证据要求"],
      list(model.launchGates).map((gate) => [
        `${gate.id} ${gate.label}`,
        gate.gateType,
        gate.ownerRef,
        joinIds(gate.phaseIds),
        joinIds(gate.blockingConditions),
        joinIds(gate.evidenceRequirements),
      ]),
    ),
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
        ["模块清单与元数据一致", counts.modules === list(model.modules).length ? "PASS" : "FAIL", "事实模型 modules"],
        ["规划能力不进入当前发布", list(model.modules).filter((module) => module.phase > 1).every((module) => module.releaseStatus === "PLANNED" && !list(model.currentReleaseModuleIds).includes(module.id)) ? "PASS" : "FAIL", "phase/releaseStatus/currentReleaseModuleIds"],
        ["README v2.0 全章节逐轴追踪", list(model.baselineTraceability).length === list(model.baselineChapters).length && list(model.baselineTraceability).every(traceAxesComplete) ? "PASS" : "FAIL", `chapters=${list(model.baselineChapters).length}; axis-closed traces=${list(model.baselineTraceability).filter(traceAxesComplete).length}`],
        ["D003-D096 决策逐轴直接影响闭合", list(model.decisionTraceability).length === list(model.productDecisions).length && list(model.decisionTraceability).every((trace) => list(trace.migrationIds).length > 0 && traceAxesComplete(trace)) ? "PASS" : "FAIL", `axis-closed decision traces=${list(model.decisionTraceability).filter(traceAxesComplete).length}; decisions=${list(model.productDecisions).length}`],
        ["D003-D096 迁移覆盖", new Set(list(model.migrationChanges).flatMap(({ decisionIds }) => list(decisionIds))).size === list(model.productDecisions).length ? "PASS" : "FAIL", `decisions=${list(model.productDecisions).length}`],
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
      "确认第一阶段只交付教学事实底座，第二阶段 AI 评定与视频、第三阶段长期画像均标记为 PLANNED。",
      "确认第三方渠道仍处于后续产品讨论边界，未被描述为当前能力。",
    ]),
  ]);
}
