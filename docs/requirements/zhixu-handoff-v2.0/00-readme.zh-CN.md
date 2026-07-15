# 知序教学云 v2.0 需求交接包

| 属性 | 值 |
| --- | --- |
| 状态 | v2.0 product fact source; semantic review passed |
| 状态码 | PRODUCT_FACT_SOURCE_SEMANTIC_REVIEW_PASSED |
| 评审日期 | 2026-07-16 |
| 事实源 | tools/requirements-v2/facts → fail-closed validators → renderers |
| 模块 | 27 |
| 数据流 | 14 |

## 阅读顺序

- 产品与项目负责人：先读产品评审状态、需求追踪矩阵、开放决策和各模块 PRD。
- 前端：先读页面原型映射、模块页面合同、字段 Option Set 和权限矩阵。
- 后端：先读权威对象、状态模型、动作权限、数据流、生命周期和 AI 任务合同。
- 测试：先读完整性扫描、模块场景、失败因果语义和评审核对表。

## 不可变产品边界

- 产品端只有 Web 与 App，角色不与端绑定；App 不要求一比一复制 Web。
- AI 一句话能力位于产品内，继承当前学校、身份、学期、职责和数据权限。
- 正式成绩、学习解释和学科计划的专业确认归对应任课教师；班主任可查看本班全学科并协调，但不能替代他科写入。
- 第三方通知、AI 讲题视频和 AI 教学视频为第二阶段扩展。
