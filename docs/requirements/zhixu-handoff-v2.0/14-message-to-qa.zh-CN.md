# 给 QA 的交接说明

对象: QA

## 1. 本轮变化

- v2.0 不在 v1.0 上修补，而是重建产品基线和需求事实源。
- 27 个模块均提供 PRD、Web/App 线框合同、Data ID、Field ID、Flow ID 和验收标准。
- 原终端命令行产品形态已改为 Web/App 内 AI 对话和可视化任务执行。

## 2. QA 重点

- 按 Flow ID 组织端到端用例，按模块 AC 组织功能验收。
- 重点覆盖权限、上下文失效、源版本变化、部分成功、AI 不可用、审计失败。
- App/Web 差异按 Capability Matrix 验证，不按页面数量一比一要求。
- 学生可见内容必须验证教师确认门禁。

## 3. 入口文件

- 产品基线: ../../product/zhixu-teaching-cloud-prd-v2.0.md
- 模块索引: 02-indexes/module-capability-matrix.md
- 追踪矩阵: 02-indexes/requirement-traceability.md
