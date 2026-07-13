# 按角色开始阅读

## 产品负责人

1. 先读 `01-update-summary.zh-CN.md`。
2. 先确认 `07-structured-requirements/data-ownership-matrix.md`、`field-option-catalog.md` 和 `data-flow-catalog.md` 的 Owner、选项来源、版本流转与失败规则。
3. 按 `02-indexes/current-module-packages.md` 审查 P0 模块。
4. 重点确认每份 PRD 的“产品评审摘要”、非范围、关键规则、数据合同和开放决策。
5. 产品确认前，模块状态保持“产品评审稿”或“概念边界稿”。

## 设计与前端架构

1. 先读 `11-message-to-frontend-architect.zh-CN.md`。
2. 对照模块 PRD 的 Node ID 与线框的 Prototype ID。
3. 对照 `field-option-catalog.md` 的 Field ID、控件、默认、级联、权限和历史失效状态。
4. 当前可以评审信息架构、载体和状态覆盖，不应开始生产代码映射。

## 后端与数据负责人

1. 先读 `12-message-to-backend-rd.zh-CN.md`。
2. 先读数据 Owner 矩阵、字段与选项字典、核心状态模型和 Flow Catalog。
3. 关注对象边界、权限矩阵、状态机、审计和跨模块刷新合同。
4. 模块 PRD 中的对象与行为是产品输入，不是最终 API、DTO 或数据库方案。

## QA

1. 先读 `14-message-to-qa.zh-CN.md`。
2. 由模块验收 ID 建立正向、异常、权限和跨上下文用例。
3. 每个选择型字段至少覆盖默认、无选项、加载失败、父项变化、权限收缩和历史失效值。
4. 每条 P0 Flow 至少覆盖重复提交、部分失败、版本冲突、权限变化、下游待同步和安全重试。
5. 当前只评审可测性，不把缺少实现证据误判为测试通过。

## 项目管理

1. 以 `02-product-review-status.zh-CN.md` 作为阶段状态。
2. 以 P0 主闭环顺序排产品评审，不按文件数量直接排开发任务。
3. 未完成产品确认的模块不进入技术方案讨论。
