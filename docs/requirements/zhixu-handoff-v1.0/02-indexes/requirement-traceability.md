# 需求追踪矩阵

| 业务目标 | 上游输入 | 主要模块 | 下游输出 | 关键门禁 |
|---|---|---|---|---|
| 正确进入学校空间 | 学校与账号 | ACC-001 | 当前学校、身份、学期 | 学校与身份切换后清空旧上下文 |
| 减少作业创建成本 | 班级、任课、内容 | TEA-001、HW-001 | 已发布作业 | 评分规则与提交方式完整 |
| 完成可靠提交 | 作业与截止规则 | SUB-001 | 不可变提交版本 | 弱网恢复、缺页与重拍可处理 |
| 提升批改效率 | 提交版本、评分规则 | GRD-001 | 教师确认结果 | 主观题、低置信与异常必须复核 |
| 可信发布成绩 | 教师确认结果 | PUB-001 | 发布成绩版本与反馈 | 发布前预览、修正留痕 |
| 形成可解释学情 | 已发布成绩、订正 | SCO-001、INS-001 | 掌握证据状态 | 单题不得形成强结论 |
| 形成可执行提升 | 掌握证据、任务负荷 | PLN-001 | 教师确认计划 | 任课教师负责学科内容，班主任协调总量 |
| 学生完成行动闭环 | 发布任务与计划 | APP-001、APP-002 | 订正与后续证据 | 仅展示本人已发布内容 |
| 保证学校可运营 | 组织数据 | ORG-001 | 班级、任课和权限基础 | 导入前校验与影响预览 |
| 安全使用 AI | 当前页面与授权数据 | AI-001、GOV-001 | 查询、草稿或确认任务 | 高风险操作二次确认与审计 |

## 数据合同追踪

| 模块 | 权威 / 源 Data ID | Field ID | Owner 门禁 |
|---|---|---|---|
| ACC-001 | DAT-ACC-01~04、DAT-ORG-01 | ACC-F001~F008 | 上下文选择不能改变实际授权 |
| TEA-001 | 继承作业、提交、批改、发布、跟进和计划源对象 | TEA-F001~F005 | 班主任协调不转移学科 Owner |
| PREP-001 | DAT-PREP-01~03 | PREP-F001~F007 | AI 草稿和课堂摘要不能成为正式判断 |
| HW-001 | DAT-HW-01~05 | HW-F001~F015 | 对应任课教师确认内容、评分与发布规则 |
| SUB-001 | DAT-SUB-01~03 | SUB-F001~F005 | 学生拥有原始作答，教师与 AI 不得代答 |
| GRD-001 | DAT-GRD-01~04，引用 DAT-SUB、DAT-HW | GRD-F001~F007 | AI 是产生者，对应任课教师是最终 Owner |
| PUB-001 | DAT-PUB-01~03 | PUB-F001~F007 | 发布和修正不覆盖教师确认历史 |
| SCO-001 | 继承 DAT-PUB-02/03、DAT-EXM-03/05 | SCO-F001~F008 | 成绩册和导出不建立独立成绩 Owner |
| EXM-001 | DAT-EXM-01~05 | EXM-F001~F013 | 教务拥有考试口径，任课教师拥有学科原始成绩 |
| STU-001 | DAT-STU-01/02，引用组织、成绩、学情和计划 | STU-F001~F007 | 聚合档案继承源 Owner，跟进记录按创建角色负责 |
| INS-001 | DAT-INS-01~03 | INS-F001~F011 | 对应任课教师确认知识点与掌握状态 |
| PLN-001 | DAT-PLN-01~05 | PLN-F001~F010 | 任课教师负责学科计划，班主任只负责全科协调 |
| APP-001 | 继承作业、提交、发布、订正和计划源对象 | APP1-F001~F002 | 首页分组不改变正式任务责任 |
| APP-002 | DAT-APP2-01~04 | APP2-F001~F006 | 学生负责订正作答，任课教师负责订正判定 |
| ORG-001 | DAT-ORG-01~11、DAT-ACC-02/03 | ORG-F001~F011 | 管理员负责成员授权，教务负责教学组织数据 |
| SCH-001 | DAT-SCH-01~04，引用 ORG 主数据 | SCH-F001~F012 | 求解器只产生候选，教务确认并发布 |
| AI-001 | DAT-AI-01~04，业务动作继承目标 Data ID | AI-F001~F007 | AI 不接管任何业务对象 Owner |
| GOV-001 | DAT-GOV-01~03、DAT-ACC-03 | GOV-F001~F011 | 管理员治理权限，不默认浏览全部教学明细 |
| CLI-001 | DAT-CLI-01~02，查询和动作继承目标 Data ID | CLI-F001~F006 | CLI 只是入口，不复制或转移业务责任 |

追踪事实源：`../07-structured-requirements/data-ownership-matrix.md`、`../07-structured-requirements/field-option-catalog.md`。

## Flow 合同追踪

| 模块 | Flow ID | 主要输入 | 主要输出 / 刷新 |
|---|---|---|---|
| ACC-001 | DF-001、DF-015、DF-016 | 学校、成员、身份、学期版本 | Active Context、全端上下文刷新 |
| TEA-001 | DF-003、DF-005、DF-006、DF-012、DF-013 | 各业务源状态 | 工作队列与班主任摘要派生刷新 |
| PREP-001 | DF-101、DF-003 | Lesson Plan、课堂上下文 | Classroom Session、Evidence、Assignment Draft |
| HW-001 | DF-003 | Assignment / Item / Rubric / Policy | Assignment Release、学生任务 |
| SUB-001 | DF-004、DF-005 | Assignment Release、草稿、媒体 | Submission Version、初评触发 |
| GRD-001 | DF-005、DF-006、DF-016 | Submission、Item、Rubric | Recognition、AI Suggestion、Grading Decision |
| PUB-001 | DF-007、DF-008、DF-016 | Grading Decision、Feedback Policy | Published Result、Revision、下游失效 / 刷新 |
| SCO-001 | DF-007、DF-008、DF-102 | 发布成绩、修正、考试成绩 | Gradebook View、统计、导出 |
| EXM-001 | DF-102 | Exam Event、Score Batch、Aggregate Rule | 考试发布结果、成绩册与学情刷新 |
| STU-001 | DF-007、DF-008、DF-010、DF-011、DF-012、DF-013、DF-102 | 组织、成绩、学情、计划 | Learning Profile、Follow-up Record |
| INS-001 | DF-007、DF-008、DF-009、DF-010、DF-011、DF-102 | 发布结果、订正、证据、Override | Mastery State、Improvement Candidate |
| PLN-001 | DF-008、DF-009、DF-010、DF-011、DF-012、DF-013 | Candidate、Mastery、负荷、任课关系 | Subject Plan、Coordination、Task、Evaluation |
| APP-001 | DF-003、DF-004、DF-007、DF-009、DF-011、DF-012、DF-015 | 已发布任务和执行状态 | Today Learning Feed、执行入口 |
| APP-002 | DF-007、DF-008、DF-009 | Published Result、Error Item、Hint Policy | Correction Attempt / Decision、新证据 |
| ORG-001 | DF-002、DF-013、DF-015 | Import Batch、组织主数据 | 主数据版本、权限刷新、责任交接 |
| SCH-001 | DF-201、DF-202、DF-016 | 组织输入、约束、课表版本 | Candidate、Timetable、Schedule Change、通知 |
| AI-001 | DF-014、DF-015、DF-016、DF-301 | 当前上下文、指令、目标版本 | Query、Draft、Preview、业务执行和审计 |
| GOV-001 | DF-001、DF-002、DF-013、DF-014、DF-015、DF-016、DF-202、DF-301 | 权限、业务操作、授权 | Effective Access、Audit Event、拒绝结果 |
| CLI-001 | DF-014、DF-015、DF-016、DF-301 | CLI Session、命令、Automation Grant | 目标业务结果、执行记录、审计 |

Flow 事实源：`../07-structured-requirements/data-flow-catalog.md`。
