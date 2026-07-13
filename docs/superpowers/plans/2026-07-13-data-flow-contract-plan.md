# 知序需求包数据流转合同 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. 本工作区不是 Git 仓库，因此不执行提交步骤。

**Goal:** 为 19 个模块建立可追踪、可 Mock、可联调、可验收的数据流转合同。

**Architecture:** 新建中央 `data-flow-catalog.md` 定义 Flow ID、输入输出版本、责任交接、执行方式、幂等、失败、补偿和验收；模块 PRD 只引用相关 Flow ID，索引和评审清单负责覆盖检查。

**Tech Stack:** Markdown、`rg`、标准 Unix 文本校验命令。

---

### Task 1: 固化流转设计基线

**Files:**
- Create: `docs/superpowers/specs/2026-07-13-data-flow-contract-design.md`

- [x] 区分数据流转与页面跳转。
- [x] 定义源版本、目标版本、责任交接、幂等和补偿原则。
- [x] 比较逐 PRD、总图和中央 Flow Catalog 三种方案。
- [x] 明确产品合同与技术实现边界。

### Task 2: 建立 P0 Flow Catalog

**Files:**
- Create: `docs/requirements/zhixu-handoff-v1.0/07-structured-requirements/data-flow-catalog.md`

- [x] 定义学校、身份、组织导入和权限刷新流。
- [x] 定义作业发布、学生提交、AI 初评、教师复核和成绩发布流。
- [x] 定义成绩修正、订正、学情、提升计划和学生反馈流。
- [x] 定义任课变更、上下文失效、AI / CLI 高风险动作和审计流。
- [x] 为每条 P0 流补齐输入、输出、Owner、执行、幂等、失败、失效和验收。

### Task 3: 建立长期模块 Flow Contract

**Files:**
- Modify: `docs/requirements/zhixu-handoff-v1.0/07-structured-requirements/data-flow-catalog.md`

- [x] 定义备课到授课证据和作业草稿流。
- [x] 定义考试成绩到成绩册与学情流。
- [x] 定义排课候选到正式课表流。
- [x] 定义调课、代课和通知流。
- [x] 定义 CLI 自动化授权生命周期流。

### Task 4: 回填 19 份模块 PRD

**Files:**
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/*.md`

- [x] 每份 PRD 增加“数据流转合同”章节。
- [x] 引用适用 Flow ID、输入 Data ID、输出 Data ID 和本模块责任。
- [x] 派生视图只声明刷新来源，不建立第二份权威事实。

### Task 5: 更新索引与评审门禁

**Files:**
- Modify: `docs/requirements/zhixu-handoff-v1.0/00-readme.zh-CN.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/00-start-here-by-role.zh-CN.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/01-update-summary.zh-CN.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/02-indexes/current-module-packages.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/02-indexes/requirement-traceability.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/09-review-checklists/package-review-checklist.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/12-message-to-backend-rd.zh-CN.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/14-message-to-qa.zh-CN.md`

- [x] 将 Flow Catalog 加入事实源和阅读顺序。
- [x] 在追踪矩阵登记模块到 Flow ID 的关系。
- [x] 增加版本输入输出、幂等、失败、失效和验收门禁。

### Task 6: 完整性校验

**Files:**
- Verify: `docs/requirements/zhixu-handoff-v1.0/**/*.md`

- [x] 检查 19 个模块均存在“数据流转合同”章节。
- [x] 检查所有被引用 Flow ID 均在中央 Catalog 定义且唯一。
- [x] 检查每条 P0 流包含输入、输出、Owner 交接、幂等、失败和验收。
- [x] 检查 Flow 引用的 Data ID 均已在 Owner 矩阵登记。
- [x] 检查 Markdown 表格列数一致且没有未解释占位符。

