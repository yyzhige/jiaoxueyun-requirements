# 知序教学云产品总基线 v2.0

| 属性 | 值 |
|---|---|
| 版本 | v2.0 |
| 日期 | 2026-07-15 |
| 状态 | v2.0 语义重构中（待人工晋级） |
| 目标市场 | 河北省石家庄市公办初中 |
| 试点范围 | 一所学校、七年级、三个班、全学科 |
| 产品端 | Web、App |

## 1. 第一性原理目标

知序教学云第一阶段要验证的不是页面数量，也不是 AI 能否替代学校教学判断，而是：

在不降低成绩可信度和教师控制权的前提下，减少教师从收作业到发布反馈的重复劳动，并把作业结果转化为学生可执行、可跟踪、可再验证的下一步学习任务。

## 2. 不可变产品决策

- `BASE-001` 学校是采购、数据控制和治理主体。
- `BASE-002` 试点先固定河北省石家庄市公办初中，一所学校、七年级、三个班。
- `BASE-003` 全科表示所有学科进入统一作业、提交、反馈、成绩、证据和提升闭环，不承诺所有题型自动判分。
- `BASE-004` 产品只有 Web 和 App 两端，所有角色均可登录两端。
- `BASE-005` Web 是完整业务工作台；App 是高频移动协作与学习端，不要求一比一复制 Web。
- `BASE-006` 不做面向目标用户的终端命令行。“一句话操作”统一定义为 Web/App 内 AI 对话、快捷指令和可视化任务执行。
- `BASE-007` 教师使用统一工作身份，同时挂载任课教师、班主任等职责；读权限可按职责汇总，写权限按动作和对象逐项校验。
- `BASE-008` 班主任拥有本班全学科查看与协调权限，不拥有他科学科评分、掌握判断和计划内容修改权。
- `BASE-009` 学生每个学科的提升点必须同步给对应任课教师，班主任拥有本班全学科查看权限。
- `BASE-010` 第一阶段只做站内报告与通知；第三方渠道、AI 讲题视频、AI 教学视频作为第二阶段扩展登记。

## 3. 第一阶段主闭环

1. 学校、账号、身份、学期和组织主数据建立。
2. 任课教师创建并发布全科作业。
3. 学生在 App/Web 在线或拍照提交。
4. AI 按题型分级完成识别、初评和分流。
5. 任课教师复核并确认正式评分。
6. 教师发布成绩与反馈，学生查看后进入订正。
7. 订正和成绩形成学习证据、知识点归因和掌握候选。
8. 任课教师确认个性化提升计划，班主任查看全科协调。
9. 学生执行提升任务并反馈困难。
10. 定期报告和长期学习路径持续跟踪变化。

## 4. 成功指标

| Metric ID | 目标 | 指标 | 试点目标 |
| --- | --- | --- | --- |
| `MET-001` | 降低重复劳动 | 一轮作业反馈闭环的教师中位有效操作时长 | 相比试点前下降至少 30% |
| `MET-002` | 建立行动闭环 | 查看反馈后进入订正或提升任务的学生比例 | 至少 60% |
| `MET-003` | 保持教师控制 | 未经教师确认发布的主观题成绩数量 | 0 |
| `MET-004` | 保持数据安全 | 跨学校、跨班级、跨学生越权事件 | 0 |
| `MET-005` | 保持人工兜底 | AI 不可用时提交、批改和发布三条人工路径完成率 | 100% |

## 5. 模块基线

| 优先级 | 模块 ID | 模块 | 事实源 |
| --- | --- | --- | --- |
| P0 | ACC-001 | 学校入口、登录与工作上下文 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/01-school-entry-access_PRD_v2.0.md) |
| P0 | ORG-001 | 学校组织、成员与导入 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/02-organization-members-import_PRD_v2.0.md) |
| P0 | IAM-001 | 工作身份、职责授权与数据范围 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/03-identity-permission-scope_PRD_v2.0.md) |
| P0 | DGV-001 | 数据治理、生命周期与 AI 数据使用 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/04-data-governance-ai-usage_PRD_v2.0.md) |
| P0 | AUD-001 | 操作审计与敏感访问 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/05-audit-sensitive-access_PRD_v2.0.md) |
| P0 | CURR-001 | 课程、教材版本与知识点体系 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/06-curriculum-knowledge-map_PRD_v2.0.md) |
| P0 | TEA-001 | 教师与班主任工作台 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/07-teacher-homeroom-workbench_PRD_v2.0.md) |
| P0 | HW-001 | 作业创建与发布 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/08-assignment-create-release_PRD_v2.0.md) |
| P0 | SUB-001 | 学生作答与提交 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/09-student-answer-submit_PRD_v2.0.md) |
| P0 | GRD-001 | AI 初评与教师复核 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/10-ai-grading-review_PRD_v2.0.md) |
| P0 | PUB-001 | 成绩与反馈发布、修正 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/11-result-publish-correction_PRD_v2.0.md) |
| P0 | SCO-001 | 成绩册与成绩视图 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/12-gradebook-score-view_PRD_v2.0.md) |
| P0 | STU-001 | 教师学生管理与学生详情 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/13-teacher-student-management_PRD_v2.0.md) |
| P0 | INS-001 | 学习证据、知识点归因与掌握判断 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/14-mastery-evidence-insight_PRD_v2.0.md) |
| P0 | PLN-001 | 个性化提升与全科协调 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/15-personalized-improvement-plan_PRD_v2.0.md) |
| P0 | APP-001 | 学生首页与学习执行 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/16-student-home-learning-execution_PRD_v2.0.md) |
| P0 | CORR-001 | 反馈、错题与订正 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/17-feedback-correction_PRD_v2.0.md) |
| P0 | AIX-001 | AI 对话、可视化命令与任务执行 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/18-ai-conversation-task-execution_PRD_v2.0.md) |
| P0 | RPT-001 | 临时分析、定期报告与订阅 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/19-reports-subscriptions_PRD_v2.0.md) |
| P0 | LPATH-001 | 长期学习画像与学习路径 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/20-long-term-learning-path_PRD_v2.0.md) |
| P0 | NOTI-001 | 站内通知、投递与阅读状态 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/21-in-app-notification_PRD_v2.0.md) |
| P0 | PREP-001 | 教师备课与课堂授课 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/22-lesson-prep-delivery_PRD_v2.0.md) |
| P0 | CONTENT-001 | 题库与教学内容管理 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/23-question-content-management_PRD_v2.0.md) |
| P0 | EXM-001 | 考试与综合成绩管理 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/24-exam-score-management_PRD_v2.0.md) |
| P0 | SCH-001 | 教务辅助排课 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/25-academic-scheduling_PRD_v2.0.md) |
| P1 | REPORT-001 | 扩展报告合同（第二阶段元数据） | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/26-guardian-report-sharing_PRD_v2.0.md) |
| P0 | PLAT-001 | 平台学校入驻与运营治理 | [PRD](../requirements/zhixu-handoff-v2.0/03-full-prd-md/27-platform-onboarding-governance_PRD_v2.0.md) |

## 6. AI 报表与长期学习路径

| 形态 | 定义 | 保存规则 |
| --- | --- | --- |
| 临时 | 当前对话或页面即时生成的查询、分析和临时报表 | 会话内保留，可另存为报告定义 |
| 定期 | 按日、周、月或自定义周期生成的报告快照 | 保存订阅定义、运行快照、数据时间、源版本和权限结果 |
| 长期 | 跨学科、知识点和学习活动持续形成的学习路径 | 保存事实引用、教师确认的解释版本和变化时间线 |

## 7. 第二阶段扩展登记

- 第三方通知与外部消息渠道。
- AI 讲题视频生成。
- AI 教学视频生成。

以上扩展必须复用现有权限、数据治理、审计、知识点和教师确认合同，不允许重建学生数据事实。
