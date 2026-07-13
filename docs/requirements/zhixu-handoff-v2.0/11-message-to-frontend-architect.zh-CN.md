# 给前端架构师的交接说明

对象: 前端架构师

## 1. 本轮变化

- v2.0 不在 v1.0 上修补，而是重建产品基线和需求事实源。
- 27 个模块均提供 PRD、Web/App 线框合同、Data ID、Field ID、Flow ID 和验收标准。
- 原终端命令行产品形态已改为 Web/App 内 AI 对话和可视化任务执行。

## 2. 前端架构师 重点

- 不要按角色拆端，Web/App 均可登录全部角色；按 Capability Matrix 做端能力差异。
- 所有选择型字段使用 field-option-catalog.md 中的 Field ID 和 Option Set。
- 高风险写入必须有预览页、二次确认、部分成功状态和审计摘要。
- AI 对话入口不能绕过模块 PRD 的权限和状态门禁。

## 3. 入口文件

- 产品基线: ../../product/zhixu-teaching-cloud-prd-v2.0.md
- 模块索引: 02-indexes/module-capability-matrix.md
- 追踪矩阵: 02-indexes/requirement-traceability.md
