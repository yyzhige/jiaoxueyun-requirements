# 知序教学云 v2.0 需求交接包

| 属性 | 值 |
|---|---|
| 版本 | v2.0 |
| 日期 | 2026-07-14 |
| 状态 | 新产品事实源 |
| 历史版本 | ../zhixu-handoff-v1.0 保留为历史评审稿，不覆盖 |

## 1. 阅读顺序

1. 先读产品总基线: ../../product/zhixu-teaching-cloud-prd-v2.0.md。
2. 再读模块与端能力索引: 02-indexes/module-capability-matrix.md。
3. 实现前读中央合同: 04-data-contracts/ 下的数据对象、Owner、字段、状态、权限、Flow。
4. 按模块读取 03-full-prd-md/ 与 05-wireframe-contracts/。
5. 最后用 02-indexes/requirement-traceability.md 和 07-review-checklists/completeness-scan-report.md 做缺失检查。

## 2. 包结构

| 目录 | 内容 |
| --- | --- |
| 02-indexes | 模块索引、端能力矩阵、追踪矩阵、开放决策 |
| 03-full-prd-md | 27 个模块 PRD，P0-P3 文档颗粒度一致 |
| 04-data-contracts | 权威对象、Owner、字段、Option Set、状态、权限、Flow、生命周期 |
| 05-wireframe-contracts | 27 个 Web/App 页面与能力线框合同 |
| 06-ai-contracts | AI 对话任务执行、报表、长期学习路径合同 |
| 07-review-checklists | 第一性原理治理准则、审查清单、扫描报告 |
| 08-role-handoffs | 跨角色责任矩阵 |

## 3. 当前基线

- 产品端: Web、App。
- 角色: 学生、任课教师、班主任、教务、学校管理员、平台运营；角色不绑定端。
- 第一阶段: 作业、提交、AI 初评、教师复核、成绩反馈、订正、证据、个性化提升、AI 对话、报告、长期路径、通知和治理。
- 第二阶段登记: 第三方通知、AI 讲题视频、AI 教学视频。
