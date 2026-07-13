# 知序教学云需求交接包 v1.0

本包将原单体 PRD 拆为模块级产品需求。产品语义以模块 PRD 为准；线框用于约束页面载体，结构化摘要用于检索，评审清单用于检查需求完整性。

> 当前结论：本包是 `产品评审稿`。现在只讨论并确认产品形态，技术方案和开发计划继续后置。

| 项目 | 数量 / 状态 |
|---|---|
| 模块总数 | 19 |
| P0 试点模块 | 15 |
| P1-P3 长期模块 | 4 |
| 已完成人工确认 | 0 |
| 产品已确认 | 0 |
| 待技术方案 | 0 |
| HTML 产品原型 | 等待本包产品评审 |

## 阅读顺序

1. 按角色阅读 `00-start-here-by-role.zh-CN.md`。
2. 阅读 `02-product-review-status.zh-CN.md`，理解当前产品评审状态。
3. 阅读 `07-structured-requirements/core-object-state-model.md`、`data-ownership-matrix.md`、`field-option-catalog.md` 和 `data-flow-catalog.md`，理解跨模块状态、数据责任、选择型字段和数据流转合同。
4. 从 `02-indexes/current-module-packages.md` 选择模块。
5. 先读模块 PRD，再读同 ID 的线框、结构化需求摘要和评审清单。

## 事实源关系

- 历史产品基线：`../../product/zhixu-teaching-cloud-prd.md`
- 新模块事实源：`03-full-prd-md/`
- 页面结构合同：`05-full-wireframe-md/`
- 跨模块状态事实源：`07-structured-requirements/core-object-state-model.md`
- 数据责任事实源：`07-structured-requirements/data-ownership-matrix.md`
- 选择型字段事实源：`07-structured-requirements/field-option-catalog.md`
- 数据流转事实源：`07-structured-requirements/data-flow-catalog.md`
- 其他结构化需求摘要：`07-structured-requirements/`
- 角色交付说明：`08-role-handoffs/`
- 模块评审清单：`09-review-checklists/`

## 关键边界

1. 试点只验证“一所学校、七年级、三个班”的教学闭环。
2. 全科表示共享作业、提交、反馈、成绩和提升流程，不表示所有题型自动判分。
3. AI 初评不是正式成绩；主观题与低置信结果必须由教师确认。
4. 学科提升点归对应任课教师；班主任拥有本班全学科查看与协调权，但不能越权修改学科判断。
5. 排课、综合考试成绩、真实 CLI 和完整备课授课属于长期合同，不进入首轮试点开发授权。
6. 每个权威数据对象必须有唯一人类 Owner；AI、派生视图和导出文件不成为最终 Owner。
7. 所有下拉、单选、多选、级联和自动完成字段必须引用 Field ID 与 Option Set，不能由原型或研发临时发明选项。
8. 所有跨模块权威写入必须引用 Flow ID，并定义源版本、目标版本、责任交接、幂等、失败和下游失效。
