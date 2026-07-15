# 给后端研发的交接

受众：后端与数据实现团队。

- 只以 PRODUCT_FACT_SOURCE_SEMANTIC_REVIEW_PASSED 状态下生成的 Object、Field、Action、Flow、Page、Scenario 和 Metric ID 为实现范围。
- 以对象责任、状态转换、动作输入输出、权限、幂等、审计和 Flow 版本合同为服务端边界。
- 发现字段、枚举、权限、状态或失败码缺失时，回到事实模型提出缺陷；不得在实现侧静默发明。
- 第三方渠道和 AI 视频能力不在第一阶段实现范围。
