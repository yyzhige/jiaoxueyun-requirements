# 完整性与语义扫描报告

reviewStatus: `PRODUCT_BASELINE_V2_FINALIZED_PRD_REVIEW_PASSED`

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| 结构化事实规模 | PASS | modules=30；objects=164；fields=1852；actions=638；pages=115；scenarios=3323；flows=23；aiTasks=22；metrics=7 |
| 模块清单与元数据一致 | PASS | 事实模型 modules |
| 规划能力不进入当前发布 | PASS | phase/releaseStatus/currentReleaseModuleIds |
| README v2.0 全章节逐轴追踪 | PASS | chapters=58; axis-closed traces=58 |
| D003-D096 决策逐轴直接影响闭合 | PASS | axis-closed decision traces=94; decisions=94 |
| D003-D096 迁移覆盖 | PASS | decisions=94 |
| 对象责任字段 | PASS | producer/owner/confirmer/steward |
| 动作场景追踪 | PASS | scenarioIds |
| 生成源 | PASS | validated facts → renderers → Markdown |
