# 给前端架构师的交接

受众：前端架构与 Web/App 实现团队。

- 只以 PRODUCT_FACT_SOURCE_SEMANTIC_REVIEW_PASSED 状态下生成的 Object、Field、Action、Flow、Page、Scenario 和 Metric ID 为实现范围。
- 页面必须逐项引用 Page、Field、Action 与 Option Set；端差异只改变任务呈现，不改变权限和业务事实。
- 发现字段、枚举、权限、状态或失败码缺失时，回到事实模型提出缺陷；不得在实现侧静默发明。
- 第三方渠道和 AI 视频能力不在第一阶段实现范围。
