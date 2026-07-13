# 给后端研发的交接说明

对象: 后端研发

## 1. 本轮变化

- v2.0 不在 v1.0 上修补，而是重建产品基线和需求事实源。
- 27 个模块均提供 PRD、Web/App 线框合同、Data ID、Field ID、Flow ID 和验收标准。
- 原终端命令行产品形态已改为 Web/App 内 AI 对话和可视化任务执行。

## 2. 后端研发 重点

- 以 Data ID、Owner、状态机和 Flow 合同设计领域边界。
- 每个写入动作要有源版本、目标版本、幂等键、权限校验和审计。
- AI 任务通过目标模块 Flow 执行，不直接改写业务对象。
- 部分成功必须对象级记录，不能只返回整体成功。

## 3. 入口文件

- 产品基线: ../../product/zhixu-teaching-cloud-prd-v2.0.md
- 模块索引: 02-indexes/module-capability-matrix.md
- 追踪矩阵: 02-indexes/requirement-traceability.md
