# 权威对象目录

每个 Data ID 只能有一个业务 Owner。派生视图必须引用源 Data ID 和版本，不能复制第二套事实。

| Data ID | 对象 | 模块 | 模块名称 | 数据主体 | 敏感级别 | 生命周期 |
| --- | --- | --- | --- | --- | --- | --- |
| DAT-ACC-01 | School Space | ACC-001 | 学校入口、登录与工作上下文 | 学校 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ACC-02 | Account Membership | ACC-001 | 学校入口、登录与工作上下文 | 账号与学校成员关系 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ACC-03 | Work Identity Assignment | ACC-001 | 学校入口、登录与工作上下文 | 用户工作身份与职责 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ACC-04 | Active Work Context | ACC-001 | 学校入口、登录与工作上下文 | 当前会话上下文 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ORG-01 | Term | ORG-001 | 学校组织、成员与导入 | 学校学期 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ORG-02 | Grade | ORG-001 | 学校组织、成员与导入 | 年级 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ORG-03 | Class | ORG-001 | 学校组织、成员与导入 | 班级 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ORG-04 | Subject Catalog | ORG-001 | 学校组织、成员与导入 | 学科目录 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ORG-05 | Course | ORG-001 | 学校组织、成员与导入 | 课程 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ORG-06 | Teacher Profile | ORG-001 | 学校组织、成员与导入 | 教师 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ORG-07 | Student Profile | ORG-001 | 学校组织、成员与导入 | 学生 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ORG-08 | Teaching Assignment | ORG-001 | 学校组织、成员与导入 | 任课关系 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ORG-09 | Homeroom Assignment | ORG-001 | 学校组织、成员与导入 | 班主任关系 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-ORG-10 | Import Batch | ORG-001 | 学校组织、成员与导入 | 导入批次 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-IAM-01 | Role Policy | IAM-001 | 工作身份、职责授权与数据范围 | 学校权限策略 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-IAM-02 | Duty Grant | IAM-001 | 工作身份、职责授权与数据范围 | 职责授权 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-IAM-03 | Data Scope Grant | IAM-001 | 工作身份、职责授权与数据范围 | 数据范围授权 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-IAM-04 | Permission Decision | IAM-001 | 工作身份、职责授权与数据范围 | 权限校验结果 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-DGV-01 | Data Governance Policy | DGV-001 | 数据治理、生命周期与 AI 数据使用 | 学校治理策略 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-DGV-02 | Data Retention Rule | DGV-001 | 数据治理、生命周期与 AI 数据使用 | 数据保留规则 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-DGV-03 | AI Data Use Rule | DGV-001 | 数据治理、生命周期与 AI 数据使用 | AI 数据使用规则 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-DGV-04 | Export Request | DGV-001 | 数据治理、生命周期与 AI 数据使用 | 导出请求 | S4 敏感导出数据 | 导出文件到期销毁并保留审计 |
| DAT-AUD-01 | Audit Event | AUD-001 | 操作审计与敏感访问 | 操作事件 | S3 安全审计数据 | 不可变追加，按学校策略长期保留 |
| DAT-AUD-02 | Sensitive Access Session | AUD-001 | 操作审计与敏感访问 | 敏感访问会话 | S4 敏感访问数据 | 到期失效，不删除审计 |
| DAT-AUD-03 | Audit Review Case | AUD-001 | 操作审计与敏感访问 | 审计复核工单 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-CURR-01 | Curriculum Version | CURR-001 | 课程、教材版本与知识点体系 | 课程体系 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-CURR-02 | Textbook Version | CURR-001 | 课程、教材版本与知识点体系 | 教材版本 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-CURR-03 | Knowledge Point | CURR-001 | 课程、教材版本与知识点体系 | 知识点 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-CURR-04 | Knowledge Mapping | CURR-001 | 课程、教材版本与知识点体系 | 知识点映射关系 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-TEA-01 | Teacher Todo View | TEA-001 | 教师与班主任工作台 | 教师待办视图 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-TEA-02 | Homeroom Coordination Item | TEA-001 | 教师与班主任工作台 | 班级协调事项 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-TEA-03 | Teacher Work Preference | TEA-001 | 教师与班主任工作台 | 工作台偏好 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-HW-01 | Assignment Draft | HW-001 | 作业创建与发布 | 作业草稿 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-HW-02 | Assignment Item | HW-001 | 作业创建与发布 | 题目项 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-HW-03 | Rubric Version | HW-001 | 作业创建与发布 | 评分规则 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-HW-04 | Feedback Policy | HW-001 | 作业创建与发布 | 反馈开放策略 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-HW-05 | Assignment Release | HW-001 | 作业创建与发布 | 作业发布版本 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-SUB-01 | Answer Draft | SUB-001 | 学生作答与提交 | 学生作答草稿 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-SUB-02 | Submission Media | SUB-001 | 学生作答与提交 | 图片/附件材料 | S3 未成年人学习材料 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-SUB-03 | Submission Version | SUB-001 | 学生作答与提交 | 正式提交版本 | S3 未成年人学习材料 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-GRD-01 | Recognition Result | GRD-001 | AI 初评与教师复核 | 识别结果 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-GRD-02 | AI Grading Suggestion | GRD-001 | AI 初评与教师复核 | AI 评分建议 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-GRD-03 | Teacher Grading Decision | GRD-001 | AI 初评与教师复核 | 教师评分决定 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-GRD-04 | Grading Batch State | GRD-001 | AI 初评与教师复核 | 批改批次状态 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PUB-01 | Publish Preview | PUB-001 | 成绩与反馈发布、修正 | 发布预览 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PUB-02 | Published Result Version | PUB-001 | 成绩与反馈发布、修正 | 已发布成绩反馈 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PUB-03 | Result Correction Version | PUB-001 | 成绩与反馈发布、修正 | 成绩修正版本 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PUB-04 | Student Feedback View | PUB-001 | 成绩与反馈发布、修正 | 学生反馈视图 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-SCO-01 | Gradebook View Definition | SCO-001 | 成绩册与成绩视图 | 成绩册视图定义 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-SCO-02 | Gradebook Snapshot | SCO-001 | 成绩册与成绩视图 | 成绩册快照 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-SCO-03 | Score Display Column | SCO-001 | 成绩册与成绩视图 | 成绩显示列 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-STU-01 | Student Detail View | STU-001 | 教师学生管理与学生详情 | 学生详情视图 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-STU-02 | Student Follow-up Note | STU-001 | 教师学生管理与学生详情 | 学生跟进记录 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-STU-03 | Student Attention Event | STU-001 | 教师学生管理与学生详情 | 学生关注事件 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-INS-01 | Learning Evidence | INS-001 | 学习证据、知识点归因与掌握判断 | 学习证据 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-INS-02 | Knowledge Attribution | INS-001 | 学习证据、知识点归因与掌握判断 | 知识点归因 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-INS-03 | Mastery State | INS-001 | 学习证据、知识点归因与掌握判断 | 掌握状态 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-INS-04 | Teacher Insight Correction | INS-001 | 学习证据、知识点归因与掌握判断 | 教师修正记录 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PLN-01 | Improvement Candidate | PLN-001 | 个性化提升与全科协调 | 提升候选 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PLN-02 | Subject Improvement Plan | PLN-001 | 个性化提升与全科协调 | 学科提升计划 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PLN-03 | Improvement Task | PLN-001 | 个性化提升与全科协调 | 提升任务 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PLN-04 | Cross-subject Coordination View | PLN-001 | 个性化提升与全科协调 | 全科协调视图 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-APP-01 | Student Today Task View | APP-001 | 学生首页与学习执行 | 学生今日任务 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-APP-02 | Student Learning Session | APP-001 | 学生首页与学习执行 | 学生学习会话 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-APP-03 | Student Difficulty Feedback | APP-001 | 学生首页与学习执行 | 困难反馈 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-CORR-01 | Correction Task | CORR-001 | 反馈、错题与订正 | 订正任务 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-CORR-02 | Correction Submission | CORR-001 | 反馈、错题与订正 | 订正提交 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-CORR-03 | Correction Decision | CORR-001 | 反馈、错题与订正 | 订正判定 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-AIX-01 | AI Conversation | AIX-001 | AI 对话、可视化命令与任务执行 | AI 对话会话 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-AIX-02 | AI Intent Resolution | AIX-001 | AI 对话、可视化命令与任务执行 | 意图解析结果 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-AIX-03 | AI Execution Preview | AIX-001 | AI 对话、可视化命令与任务执行 | 执行预览 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-AIX-04 | AI Task Run | AIX-001 | AI 对话、可视化命令与任务执行 | AI 任务运行 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-RPT-01 | Ad-hoc Report View | RPT-001 | 临时分析、定期报告与订阅 | 临时报表 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-RPT-02 | Report Subscription | RPT-001 | 临时分析、定期报告与订阅 | 定期报告订阅 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-RPT-03 | Report Snapshot | RPT-001 | 临时分析、定期报告与订阅 | 报告快照 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-RPT-04 | Report Delivery Record | RPT-001 | 临时分析、定期报告与订阅 | 报告投递记录 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-LPATH-01 | Learning Path Timeline | LPATH-001 | 长期学习画像与学习路径 | 学习路径时间线 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-LPATH-02 | Confirmed Learning Interpretation | LPATH-001 | 长期学习画像与学习路径 | 已确认学习解释 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-LPATH-03 | Learning Path Visibility Rule | LPATH-001 | 长期学习画像与学习路径 | 学习路径可见规则 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-NOTI-01 | Notification Template | NOTI-001 | 站内通知、投递与阅读状态 | 通知模板 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-NOTI-02 | Notification Delivery | NOTI-001 | 站内通知、投递与阅读状态 | 通知投递记录 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-NOTI-03 | Notification Read State | NOTI-001 | 站内通知、投递与阅读状态 | 阅读状态 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PREP-01 | Lesson Plan | PREP-001 | 教师备课与课堂授课 | 备课方案 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PREP-02 | Teaching Material Reference | PREP-001 | 教师备课与课堂授课 | 教学材料引用 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PREP-03 | Classroom Activity Record | PREP-001 | 教师备课与课堂授课 | 课堂活动记录 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-CONTENT-01 | Question Item | CONTENT-001 | 题库与教学内容管理 | 题目 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-CONTENT-02 | Answer Analysis | CONTENT-001 | 题库与教学内容管理 | 答案解析 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-CONTENT-03 | Content Collection | CONTENT-001 | 题库与教学内容管理 | 内容集合 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-CONTENT-04 | Content Permission | CONTENT-001 | 题库与教学内容管理 | 内容授权 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-EXM-01 | Exam Event | EXM-001 | 考试与综合成绩管理 | 考试 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-EXM-02 | Exam Subject Score | EXM-001 | 考试与综合成绩管理 | 考试科目成绩 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-EXM-03 | Aggregate Score Rule | EXM-001 | 考试与综合成绩管理 | 综合成绩规则 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-EXM-04 | Exam Publish Version | EXM-001 | 考试与综合成绩管理 | 考试发布版本 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-SCH-01 | Scheduling Input | SCH-001 | 教务辅助排课 | 排课输入 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-SCH-02 | Scheduling Constraint | SCH-001 | 教务辅助排课 | 排课约束 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-SCH-03 | Schedule Candidate | SCH-001 | 教务辅助排课 | 候选课表 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-SCH-04 | Published Timetable | SCH-001 | 教务辅助排课 | 正式课表 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-REPORT-01 | Guardian Report Definition | REPORT-001 | 家长报告受控分享 | 家长报告定义 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-REPORT-02 | Share Authorization | REPORT-001 | 家长报告受控分享 | 分享授权 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-REPORT-03 | Share Access Record | REPORT-001 | 家长报告受控分享 | 分享访问记录 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PLAT-01 | School Onboarding Case | PLAT-001 | 平台学校入驻与运营治理 | 学校入驻工单 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PLAT-02 | Service Plan | PLAT-001 | 平台学校入驻与运营治理 | 服务方案 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PLAT-03 | Tenant Policy Template | PLAT-001 | 平台学校入驻与运营治理 | 租户策略模板 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
| DAT-PLAT-04 | Support Access Request | PLAT-001 | 平台学校入驻与运营治理 | 支持访问申请 | S2 教学业务数据 | 当前学期可写，历史学期只读；按学校保留策略归档 |
