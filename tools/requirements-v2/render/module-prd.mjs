import {
  actorText,
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
import { renderReleaseBanner } from "./release.mjs";

const list = (value) => (Array.isArray(value) ? value : []);

function stateId(state) {
  if (typeof state === "string") return state;
  return state?.id ?? state?.code ?? "—";
}

function transitionText(action) {
  if (action.transition) {
    return `${stateText(action.transition.from)} → ${stateText(action.transition.to)}`;
  }
  const successStates = list(action.scenarioIds)
    .filter((id) => id.includes("-SCN-SUCCESS"));
  return action.operationKind === "CREATE"
    ? `CREATE（成功状态由 ${successStates.join(" / ")} 定义）`
    : "UNCHANGED";
}

function renderDataCatalogContract(object) {
  const contract = object?.dataCatalogContract;
  if (!contract) return "";
  const active = contract.activeClassification ?? {};
  const mappings = contract.authoritativeAxisMappings ?? {};
  return normalizeDocument([
    "#### 数据目录覆盖与唯一 ACTIVE 合同",
    markdownTable(
      ["约束", "合同值"],
      [
        ["覆盖来源", contract.governedObjectIdSource],
        ["受治理对象", list(contract.governedObjectIds).join("<br>")],
        ["Source Object Kind", contract.sourceObjectKindValidation],
        ["分区模式", contract.classificationKey?.scope],
        ["分区唯一键", list(contract.classificationKey?.fieldIds).join(" / ")],
        ["ACTIVE 基数", active.cardinality],
        ["状态", `${active.activeState} / ${active.supersededState}`],
        ["初次激活", `${active.initialActivationActionId}; before=${active.initialActivationRequiresActiveCount}; after=${active.activeCountAfterCommit}`],
        ["原子替代", `${active.atomicReplacementActionId}; before=${active.replacementRequiresActiveCount}; after=${active.activeCountAfterCommit}`],
        ["唯一解析", active.resolveActionId],
        ["数据性质映射", `${mappings.dataNature?.fieldId} -> ${mappings.dataNature?.optionSetId} -> object.${mappings.dataNature?.objectProperty}`],
        ["敏感度映射", `${mappings.sensitivity?.fieldId} -> ${mappings.sensitivity?.optionSetId} -> ${mappings.sensitivity?.modelCollection}`],
      ],
    ),
    "#### 数据目录控制主体分区",
    markdownTable(
      ["分区", "控制主体", "管理范围", "范围实例", "授权主体", "唯一键", "受治理对象"],
      list(contract.coveragePartitions).map((partition) => [
        partition.id,
        partition.controlSubject,
        partition.managementScopeCode,
        partition.scopeRefKind,
        partition.authorizedActorRef,
        list(partition.uniqueKeyFieldIds).join(" / "),
        list(partition.governedObjectIds).join("<br>"),
      ]),
    ),
  ]);
}

function renderCatalogExecutionContract(object) {
  const contract = object?.catalogExecutionContract;
  if (!contract) return "";
  return normalizeDocument([
    "#### D047 治理动作目录执行合同",
    markdownTable(
      ["约束", "合同值"],
      [
        ["目录引用", `${contract.catalogRefFieldId} @ ${contract.catalogVersionFieldId}`],
        ["目标对象", `${contract.targetObjectIdFieldId} / ${contract.targetObjectKindFieldId}`],
        ["目标控制范围", contract.targetControlScopeFieldId],
        ["控制主体来源", contract.targetControlSubjectSource],
        ["目录状态与基数", `${contract.requiredCatalogState}; matches=${contract.requiredActiveMatchCount}`],
        ["对象种类等值 sourceObjectKindMustEqualTargetObjectKind", contract.sourceObjectKindMustEqualTargetObjectKind],
        ["控制主体等值 controlSubjectMustEqualTargetObjectControlSubject", contract.controlSubjectMustEqualTargetObjectControlSubject],
        ["控制范围等值 controlScopeMustEqualTargetControlScope", contract.controlScopeMustEqualTargetControlScope],
      ],
    ),
  ]);
}

function renderServicePlanContract(object) {
  const contract = object?.currentEntitlementConstraint;
  if (!contract) return "";
  return normalizeDocument([
    "#### 学校服务计划当前权益合同",
    markdownTable(
      ["约束", "合同值"],
      [
        ["学校 / 状态 / 版本字段", `${contract.schoolRefFieldId} / ${contract.stateFieldId} / ${contract.versionFieldId}`],
        ["唯一当前状态", contract.currentState],
        ["每校最大当前版本", contract.maximumCurrentVersionsPerSchool],
        ["解析规则", contract.selectionRule],
        ["非当前状态", list(contract.restrictedStates).join(" / ")],
        ["恢复规则", contract.recoveryRule],
      ],
    ),
  ]);
}

function renderContinuityWindowContract(object) {
  const contract = object?.currentWindowUniquenessConstraint;
  if (!contract) return "";
  return normalizeDocument([
    "#### 服务连续性窗口唯一性合同",
    markdownTable(
      ["约束", "合同值"],
      [
        ["学校 / 服务计划 / 版本", `${contract.schoolRefFieldId} / ${contract.servicePlanRefFieldId} / ${contract.servicePlanVersionFieldId}`],
        ["状态字段 / 排除状态", `${contract.statusFieldId} / ${contract.excludedState}`],
        ["最大未关闭窗口", contract.maximumCurrentWindowsPerSchoolAndServicePlanVersion],
        ["选择规则", contract.selectionRule],
        ["歧义处理", contract.ambiguityEffect],
      ],
    ),
  ]);
}

function renderPhaseTwoEntitlementContract(module) {
  const contract = module?.phaseTwoEntitlementContract;
  if (!contract) return "";
  return normalizeDocument([
    "## 第二阶段学校核心权益合同",
    markdownTable(
      ["约束", "合同值"],
      [
        ["权益对象", contract.objectId],
        ["学校字段", contract.schoolRefFieldId],
        ["服务计划绑定", `${contract.servicePlanObjectId} @ ${contract.servicePlanRefFieldId} / ${contract.servicePlanVersionFieldId}`],
        ["服务计划状态", contract.requiredServicePlanState],
        ["核心权益", list(contract.coreEntitlements).join(" / ")],
        ["全校保障", contract.schoolWideGuarantee],
        ["学生/监护人付费", contract.studentOrGuardianPaymentAllowed],
        ["核心学习闭环付费墙", contract.coreLearningLoopPaywallAllowed],
        ["激活动作", contract.activationActionId],
        ["消费者规则", contract.consumerRule],
      ],
    ),
    "### 核心权益消费者",
    markdownTable(
      ["权益代码", "消费 Action"],
      list(contract.consumerBindings).map((binding) => [
        binding.entitlementCode,
        list(binding.actionIds).join("<br>"),
      ]),
    ),
  ]);
}

function renderActionExtensionContracts(actions) {
  const sections = [];
  for (const action of list(actions)) {
    const entitlement = action.entitlementDecisionContract;
    if (entitlement) {
      sections.push(normalizeDocument([
        `### ${action.id} 新活动权益决策闭集`,
        markdownTable(
          ["约束", "合同值"],
          [
            ["受保护 Action", list(entitlement.guardedActionIds).join("<br>")],
            ["服务计划", `${entitlement.sourceObjectId} @ ${entitlement.sourceIdentityFieldId} / ${entitlement.sourceVersionFieldId}`],
            ["必要状态", entitlement.requiredSourceState],
            ["范围规则", entitlement.scopeRule],
            ["连续性选择", entitlement.currentContinuitySelection?.selectionRule],
            ["保护窗口授权新活动", entitlement.protectionWindowAuthorizesNewActivity],
            ["未知决策", entitlement.unknownDecisionEffect],
            ["失败结果", entitlement.failureResult],
          ],
        ),
        markdownTable(
          ["分支", "服务计划谓词", "连续性谓词", "范围谓词", "结果码", "效果"],
          list(entitlement.decisionBranches).map((branch) => [
            branch.branchId,
            branch.sourcePredicate,
            branch.continuityPredicate,
            branch.scopePredicate,
            branch.decisionCode,
            branch.effect,
          ]),
        ),
      ]));
    }

    const recovery = action.recoveryVersionGuard;
    if (recovery) {
      sections.push(normalizeDocument([
        `### ${action.id} 服务恢复新版本合同`,
        markdownTable(
          ["约束", "合同值"],
          [
            ["必要恢复状态", recovery.requiredRecoveryState],
            ["身份必须不同", recovery.identityMustDiffer],
            ["学校必须一致", recovery.schoolMustMatch],
            ["精确版本固定", recovery.exactPinnedRecoveryVersionRequired],
            ["替代血缘", recovery.supersedesLineageRequired],
            ["旧计划可重新激活 sourceReactivationAllowed", recovery.sourceReactivationAllowed],
          ],
        ),
      ]));
    }

    const manifest = action.manifestReconciliationContract;
    if (manifest) {
      sections.push(normalizeDocument([
        `### ${action.id} 保护活动清单封存合同`,
        markdownTable(
          ["约束", "合同值"],
          [
            ["条目对象", manifest.entryObjectId],
            ["条目选择", manifest.entrySelectionRule],
            ["数量规则", manifest.countRule],
            ["摘要规则", manifest.digestRule],
            ["零符合项", manifest.zeroEligibleRule],
            ["不完整效果", manifest.incompleteEffect],
            ["限制生效", manifest.sealAndRestrictionTimestampRule],
            ["允许部分封存", manifest.partialSealAllowed],
          ],
        ),
      ]));
    }
  }

  const phaseTwoGuards = list(actions).filter(({ phaseTwoEntitlementGuard }) => (
    Boolean(phaseTwoEntitlementGuard)
  ));
  if (phaseTwoGuards.length > 0) {
    sections.push(normalizeDocument([
      "### D090 第二阶段权益消费 Guard",
      markdownTable(
        ["Action ID", "权益", "权益对象", "引用 / 版本", "必要状态", "精确版本", "同校", "失败结果"],
        phaseTwoGuards.map((action) => {
          const guard = action.phaseTwoEntitlementGuard;
          return [
            action.id,
            guard.entitlementCode,
            guard.entitlementObjectId,
            `${guard.entitlementRefFieldId} / ${guard.entitlementVersionFieldId}`,
            guard.requiredEntitlementState,
            guard.exactPinnedVersionRequired,
            guard.schoolMustMatch,
            guard.failureResult,
          ];
        }),
      ),
    ]));
  }
  return sections.join("\n\n");
}

function renderMetadataModule(module) {
  const metadataRows = list(module.objects).flatMap((object) => (
    Object.entries(object)
      .filter(([key]) => !["id", "label", "fields", "states"].includes(key))
      .map(([key, value]) => [object.id, key, JSON.stringify(value)])
  ));
  return normalizeDocument([
    renderReleaseBanner(module),
    `# ${module.id} 规划元数据登记`,
    markdownTable(
      ["属性", "值"],
      [
        ["模块标题", module.title],
        ["阶段", module.phase],
        ["交付状态", module.releaseStatus],
        ["优先级", module.priority],
        ["合同类型", module.contractKind],
        ["目标", module.objective],
      ],
    ),
    "## 扩展边界",
    markdownList([
      "本文件只登记未来产品问题、依赖、角色和治理复用关系。",
      `可执行 Action 数量：${list(module.actions).length}。`,
      `可执行 Page 数量：${list(module.pages).length}。`,
      `第一阶段验收 Scenario 数量：${list(module.scenarios).length}。`,
      "在产品决策、权限、数据治理和交付入口完成评审前，不生成第一阶段行为。",
    ]),
    "## 未来对象元数据",
    markdownTable(
      ["Object ID", "对象", "状态", "字段"],
      list(module.objects).map((object) => [
        object.id,
        object.label,
        list(object.states).join(" / ") || "metadata-only",
        list(object.fields).map((field) => field.id).join(" / ") || "metadata-only",
      ]),
    ),
    "## 元数据属性（保留原始键名）",
    markdownTable(["Object ID", "属性键", "值"], metadataRows),
  ]);
}

function renderObjectSection(object) {
  return normalizeDocument([
    `### ${object.id} ${object.label}`,
    markdownTable(
      ["数据主体", "控制主体", "产生者", "Owner", "确认者", "Steward", "生命周期", "敏感级别", "读模式", "教师写入策略", "状态"],
      [[
        object.dataSubject,
        object.controlSubject,
        object.producerRef,
        object.ownerRef,
        object.confirmerRef,
        object.stewardRef,
        object.lifecyclePolicyId,
        object.sensitivityId,
        object.readMode,
        teacherWriteScopePolicyText(object.teacherWriteScopePolicy),
        list(object.states).map(stateId).join(" / "),
      ]],
    ),
    markdownTable(
      ["Field ID", "字段", "类型", "必填", "值来源", "可变性", "可见性", "幂等角色", "校验", "历史策略"],
      list(object.fields).map((field) => [
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
    renderDataCatalogContract(object),
    renderCatalogExecutionContract(object),
    renderServicePlanContract(object),
    renderContinuityWindowContract(object),
  ]);
}

function renderFailureSemantics(actions) {
  const rows = list(actions).flatMap((action) => (
    list(action.failureSemantics).map((semantic) => [
      action.id,
      semantic.resultCode,
      semantic.predicate,
      semantic.given,
      semantic.when,
      semantic.expectedData,
    ])
  ));
  if (rows.length === 0) return "";
  return normalizeDocument([
    "## 5. 业务失败因果语义",
    markdownTable(
      ["Action ID", "失败码", "因果谓词", "Given", "When", "Expected Data"],
      rows,
    ),
  ]);
}

export function renderModulePrd(module, model) {
  if (!module || typeof module !== "object") {
    throw new TypeError("renderModulePrd requires a module fact");
  }
  if (module.contractKind === "TASK8_REPORT_FUTURE_METADATA") {
    return renderMetadataModule(module);
  }

  const moduleFlows = list(model.flows).filter((flow) => list(flow.moduleIds).includes(module.id));
  const actionIds = new Set(list(module.actions).map((action) => action.id));
  const moduleAiTasks = list(model.aiTasks).filter((task) => actionIds.has(task.actionId));

  return normalizeDocument([
    renderReleaseBanner(module),
    `# ${module.id} ${module.title} PRD v2.0`,
    markdownTable(
      ["属性", "值"],
      [
        ["阶段", module.phase],
        ["交付状态", module.releaseStatus],
        ["优先级", module.priority],
        ["目标", module.objective],
        ["基线决策", joinIds(module.baselineDecisionIds)],
        ["NFR", joinIds(module.nfrIds)],
        ["进入条件", list(module.entryConditions).join("；")],
        ["退出条件", list(module.exitConditions).join("；")],
        ["依赖模块", joinIds(module.dependencyModuleIds)],
      ],
    ),
    "## 1. 范围与事实边界",
    markdownList([
      `本模块权威拥有 ${list(module.objects).length} 个对象、${list(module.actions).length} 个动作。`,
      "模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。",
      "页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。",
      "AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。",
    ]),
    renderPhaseTwoEntitlementContract(module),
    "## 2. 权威对象与字段合同",
    ...list(module.objects).map(renderObjectSection),
    "## 3. 对象关系",
    markdownTable(
      ["Relationship ID", "源对象", "关系", "目标对象", "基数", "所有权范围", "源失效处理"],
      list(module.relationships).map((relationship) => [
        relationship.id,
        relationship.fromObjectId,
        relationship.type,
        relationship.toObjectId,
        relationship.cardinality,
        relationship.ownershipScope,
        relationship.onSourceInvalidation,
      ]),
    ),
    "## 4. 可执行动作合同",
    markdownTable(
      ["Action ID", "动作", "目标对象", "操作", "授权边界", "访问例外", "输入 Field", "输出 Field", "状态效果", "ALLOW / DENY", "端 / 执行模式", "风险", "审计", "幂等键", "失败结果"],
      list(module.actions).map((action) => [
        action.id,
        action.label,
        action.targetObjectId,
        action.operationKind,
        professionalAuthorizationText(action),
        action.accessGuard?.exceptionKind ?? "—",
        list(action.inputFieldIds).join("<br>"),
        list(action.outputFieldIds).join("<br>"),
        transitionText(action),
        list(action.permissions).map((permission) => (
          `${permission.effect}:${actorText(permission)} — ${permission.condition}${
            permission.scope ? ` [${permissionScopeText(permission.scope)}]` : ""
          }`
        )).join("<br>"),
        list(action.clients).join(" / ") || action.executionMode,
        action.risk,
        action.auditMode,
        action.idempotencyKey ?? "—",
        list(action.failureResults).join(" / "),
      ]),
    ),
    renderActionExtensionContracts(module.actions),
    renderFailureSemantics(module.actions),
    "## 6. 状态可达性",
    markdownTable(
      ["Object ID", "状态", "进入动作", "离开动作"],
      list(module.objects).flatMap((object) => list(object.states).map((state) => {
        const id = stateId(state);
        return [
          object.id,
          id,
          list(module.actions).filter((action) => (
            action.targetObjectId === object.id
            && (action.transition?.to === id || list(action.scenarioIds).some((scenarioId) => (
              list(module.scenarios).some((scenario) => (
                scenario.id === scenarioId
                && scenario.then?.expectedState?.mode === "STATE"
                && scenario.then.expectedState.value === id
              ))
            )))
          )).map((action) => action.id).join("<br>"),
          list(module.actions).filter((action) => (
            action.targetObjectId === object.id
            && (action.transition?.from === id || list(action.transition?.from).includes(id))
          )).map((action) => action.id).join("<br>"),
        ];
      })),
    ),
    "## 7. 参与数据流",
    markdownTable(
      ["Flow ID", "数据流", "阶段", "参与模块", "本模块动作", "失败与补偿"],
      moduleFlows.map((flow) => [
        flow.id,
        flow.label,
        flow.phase,
        list(flow.moduleIds).join(" / "),
        list(flow.steps).filter((step) => actionIds.has(step.actionId)).map((step) => step.actionId).join("<br>"),
        [
          flow.failureGranularity,
          JSON.stringify(flow.retryPolicy),
          JSON.stringify(flow.compensation),
          JSON.stringify(flow.downstreamInvalidation),
        ].filter(Boolean).join("；"),
      ]),
    ),
    "## 8. 页面任务合同",
    markdownTable(
      ["Page ID", "页面", "交付可用性", "端", "对象", "字段", "动作", "区域", "视图状态"],
      list(module.pages).map((page) => [
        page.id,
        page.label,
        page.availability ?? module.releaseStatus,
        list(page.clients).join(" / "),
        list(page.objectIds ?? [page.objectId]).filter(Boolean).join("<br>"),
        list(page.fieldIds).join("<br>"),
        list(page.actionIds).join("<br>"),
        list(page.regions).join("<br>"),
        list(page.viewStates).join("<br>"),
      ]),
    ),
    "## 9. 验收场景",
    markdownTable(
      ["Scenario ID", "类型", "Action ID", "Given", "When", "Expected Data", "Expected State", "Permission", "失败码 / 谓词"],
      list(module.scenarios).map((scenario) => [
        scenario.id,
        scenario.kind,
        scenario.actionId,
        scenario.given,
        scenario.when,
        scenario.then?.expectedData,
        scenario.then?.expectedState?.mode === "STATE"
          ? scenario.then.expectedState.value
          : scenario.then?.expectedState?.mode,
        scenario.then?.expectedPermission,
        [scenario.resultCode, scenario.failurePredicate].filter(Boolean).join(" — "),
      ]),
    ),
    "## 10. AI 任务映射",
    markdownTable(
      ["Task ID", "任务", "类型", "目标 Action", "受众", "确认者", "预览字段", "失败行为"],
      moduleAiTasks.map((task) => [
        task.id,
        list(task.naturalLanguageExamples).join("<br>"),
        task.taskType,
        task.actionId,
        [...list(task.roleRefs), ...list(task.dutyRefs)].join(" / "),
        JSON.stringify(task.confirmer),
        list(task.previewFieldIds).join("<br>"),
        JSON.stringify(task.failureBehavior),
      ]),
    ),
    "## 11. 研发与测试就绪门禁",
    markdownList([
      "实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。",
      "所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。",
      "每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。",
      "每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。",
      "Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。",
    ]),
  ]);
}
