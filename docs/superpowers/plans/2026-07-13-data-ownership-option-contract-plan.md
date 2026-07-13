# 知序需求包数据责任与选项合同 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. 本工作区不是 Git 仓库，因此不执行提交步骤。

**Goal:** 为 19 个模块补齐数据 Owner、选择型字段、选项来源和模块引用，使需求包可直接支撑原型、Mock 接口与验收设计。

**Architecture:** 使用中央事实源加模块薄引用。`data-ownership-matrix.md` 负责对象责任，`field-option-catalog.md` 负责控件与选项，模块 PRD 只声明适用的 Data ID、Field ID 和局部差异。

**Tech Stack:** Markdown、`rg`、标准 Unix 文本检查命令。

---

### Task 1: 固化设计基线

**Files:**
- Create: `docs/superpowers/specs/2026-07-13-data-ownership-option-contract-design.md`

- [x] 写明数据 Owner 与操作权限的区别。
- [x] 写明字段继承、AI 非 Owner 和班主任协调边界。
- [x] 比较逐 PRD、中央字典和中央事实源加薄引用三种方案。
- [x] 定义两份中央合同的字段结构和完成标准。

### Task 2: 建立数据 Owner 矩阵

**Files:**
- Create: `docs/requirements/zhixu-handoff-v1.0/07-structured-requirements/data-ownership-matrix.md`

- [x] 为组织、账号、身份、学期、班级、课程和任课关系定义主数据责任。
- [x] 为作业、提交、AI 建议、教师确认、发布成绩和修正定义交易数据责任。
- [x] 为学情证据、掌握状态、提升计划和订正定义学科责任与班主任协调边界。
- [x] 为考试、排课、权限、审计、AI 会话和 CLI 自动化定义治理责任。
- [x] 检查每行只有一个最终 Owner，AI 和派生视图不成为最终 Owner。

### Task 3: 建立字段与选项字典

**Files:**
- Create: `docs/requirements/zhixu-handoff-v1.0/07-structured-requirements/field-option-catalog.md`

- [x] 定义固定枚举、学校主数据、权限范围和运行时派生四类 Option Set。
- [x] 定义跨模块复用的学校、身份、学期、年级、班级、学科、课程、教师和时间范围选项。
- [x] 为 ACC、TEA、PREP、HW、SUB、GRD、PUB、SCO、EXM 建立字段映射。
- [x] 为 STU、INS、PLN、APP1、APP2、ORG、SCH、AI、GOV、CLI 建立字段映射。
- [x] 为每个字段补齐控件、必填、默认、联动、权限和失效规则。

### Task 4: 回填 P0 核心模块 PRD

**Files:**
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/01-school-entry-access_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/02-teacher-workbench_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/04-assignment-create_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/05-assignment-submit_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/06-ai-grading-review_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/07-results-publish-correction_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/08-gradebook_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/10-student-management_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/11-mastery-evidence_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/12-improvement-plan_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/13-student-home_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/14-feedback-correction_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/15-organization-import_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/17-ai-command-center_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/18-permissions-audit_PRD_v1.0.md`

- [x] 每份 PRD 增加数据责任与选择型字段合同章节。
- [x] 引用 Data ID 和 Field ID，不复制中央字典内容。
- [x] 对 APP-001 和 AI-001 补充原来缺失的字段合同入口。

### Task 5: 回填长期模块 PRD

**Files:**
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/03-lesson-prep-delivery_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/09-exam-score-management_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/16-academic-scheduling_PRD_v1.0.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/19-admin-cli_PRD_v1.0.md`

- [x] 为概念边界模块建立完整合同骨架，不虚构目标学校尚未确认的业务值。
- [x] 对 SCH-001 和 CLI-001 补充原来缺失的字段合同入口。

### Task 6: 更新入口与评审规则

**Files:**
- Modify: `docs/requirements/zhixu-handoff-v1.0/00-readme.zh-CN.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/09-review-checklists/package-review-checklist.md`
- Modify: `docs/requirements/zhixu-handoff-v1.0/02-indexes/requirement-traceability.md`

- [x] 在阅读顺序中加入两份中央合同。
- [x] 将“字段：有”升级为 Owner、Field ID、Option Set、联动和失效规则检查。
- [x] 在追踪矩阵中登记中央合同与 19 个模块的关系。

### Task 7: 完整性校验

**Files:**
- Verify: `docs/requirements/zhixu-handoff-v1.0/**/*.md`

- [x] 运行 `rg -L '数据责任与选择型字段合同' docs/requirements/zhixu-handoff-v1.0/03-full-prd-md/*.md`，预期无文件输出。
- [x] 运行 `rg -n '最终 Owner \| AI|最终 Owner \| 系统' data-ownership-matrix.md`，预期无匹配。
- [x] 检查 19 个模块前缀均出现在字段字典中。
- [x] 检查设计和中央合同中没有 `TBD`、`TODO` 或未解释的占位符。
- [x] 抽查 ACC、HW、SCO、PLN、ORG、GOV 的级联、权限和历史失效规则。

