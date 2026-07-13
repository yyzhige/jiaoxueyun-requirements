# 数据 Owner 矩阵

责任分离规则：

- 数据主体: 数据描述或关联的人、班级、学校或业务对象。
- 产生者: 创建原始记录的人或系统。
- 业务 Owner: 对业务含义、正确性和纠正负责的角色。
- 确认者: 使候选或草稿成为正式业务值的人。
- 数据控制与治理主体: 学校。
- Steward: 日常质量、保留、归档和异常处理负责人。
- 技术处理者: 平台按学校授权处理数据。

| Data ID | 对象 | 数据主体 | 产生者 | 业务 Owner | 确认者 | 控制主体 | Steward | 技术处理者 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DAT-ACC-01 | School Space | 学校 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-ACC-02 | Account Membership | 账号与学校成员关系 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-ACC-03 | Work Identity Assignment | 用户工作身份与职责 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-ACC-04 | Active Work Context | 当前会话上下文 | 当前用户 | 当前用户 | 系统 | 学校 | 系统 | 平台按授权处理 |
| DAT-ORG-01 | Term | 学校学期 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-ORG-02 | Grade | 年级 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-ORG-03 | Class | 班级 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-ORG-04 | Subject Catalog | 学科目录 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-ORG-05 | Course | 课程 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-ORG-06 | Teacher Profile | 教师 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-ORG-07 | Student Profile | 学生 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-ORG-08 | Teaching Assignment | 任课关系 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-ORG-09 | Homeroom Assignment | 班主任关系 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-ORG-10 | Import Batch | 导入批次 | 导入操作者 | 导入操作者 | 导入操作者 | 学校 | 导入操作者 | 平台按授权处理 |
| DAT-IAM-01 | Role Policy | 学校权限策略 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-IAM-02 | Duty Grant | 职责授权 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-IAM-03 | Data Scope Grant | 数据范围授权 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-IAM-04 | Permission Decision | 权限校验结果 | 系统 | 系统 | 系统 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-DGV-01 | Data Governance Policy | 学校治理策略 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-DGV-02 | Data Retention Rule | 数据保留规则 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-DGV-03 | AI Data Use Rule | AI 数据使用规则 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-DGV-04 | Export Request | 导出请求 | 申请人 | 申请人 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-AUD-01 | Audit Event | 操作事件 | 系统 | 系统 | 系统 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-AUD-02 | Sensitive Access Session | 敏感访问会话 | 申请人 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-AUD-03 | Audit Review Case | 审计复核工单 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-CURR-01 | Curriculum Version | 课程体系 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-CURR-02 | Textbook Version | 教材版本 | 学科负责人 | 学科负责人 | 学科负责人 | 学校 | 学科负责人 | 平台按授权处理 |
| DAT-CURR-03 | Knowledge Point | 知识点 | 学科负责人 | 学科负责人 | 学科负责人 | 学校 | 学科负责人 | 平台按授权处理 |
| DAT-CURR-04 | Knowledge Mapping | 知识点映射关系 | 学科负责人 | 学科负责人 | 学科负责人 | 学校 | 学科负责人 | 平台按授权处理 |
| DAT-TEA-01 | Teacher Todo View | 教师待办视图 | 系统 | 系统 | 系统 | 学校 | 系统 | 平台按授权处理 |
| DAT-TEA-02 | Homeroom Coordination Item | 班级协调事项 | 班主任 | 班主任 | 班主任 | 学校 | 班主任 | 平台按授权处理 |
| DAT-TEA-03 | Teacher Work Preference | 工作台偏好 | 当前教师 | 当前教师 | 当前教师 | 学校 | 当前教师 | 平台按授权处理 |
| DAT-HW-01 | Assignment Draft | 作业草稿 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-HW-02 | Assignment Item | 题目项 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-HW-03 | Rubric Version | 评分规则 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-HW-04 | Feedback Policy | 反馈开放策略 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-HW-05 | Assignment Release | 作业发布版本 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-SUB-01 | Answer Draft | 学生作答草稿 | 学生 | 学生 | 学生 | 学校 | 系统 | 平台按授权处理 |
| DAT-SUB-02 | Submission Media | 图片/附件材料 | 学生 | 学生 | 学生 | 学校 | 系统 | 平台按授权处理 |
| DAT-SUB-03 | Submission Version | 正式提交版本 | 学生 | 学生 | 学生 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-GRD-01 | Recognition Result | 识别结果 | AI | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-GRD-02 | AI Grading Suggestion | AI 评分建议 | AI | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-GRD-03 | Teacher Grading Decision | 教师评分决定 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-GRD-04 | Grading Batch State | 批改批次状态 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-PUB-01 | Publish Preview | 发布预览 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-PUB-02 | Published Result Version | 已发布成绩反馈 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-PUB-03 | Result Correction Version | 成绩修正版本 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-PUB-04 | Student Feedback View | 学生反馈视图 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-SCO-01 | Gradebook View Definition | 成绩册视图定义 | 查询创建者 | 查询创建者 | 查询创建者 | 学校 | 查询创建者 | 平台按授权处理 |
| DAT-SCO-02 | Gradebook Snapshot | 成绩册快照 | 系统 | 系统 | 系统 | 学校 | 教务 | 平台按授权处理 |
| DAT-SCO-03 | Score Display Column | 成绩显示列 | 任课教师/教务 | 任课教师/教务 | 任课教师/教务 | 学校 | 任课教师/教务 | 平台按授权处理 |
| DAT-STU-01 | Student Detail View | 学生详情视图 | 系统 | 系统 | 系统 | 学校 | 系统 | 平台按授权处理 |
| DAT-STU-02 | Student Follow-up Note | 学生跟进记录 | 记录创建者 | 记录创建者 | 记录创建者 | 学校 | 记录创建者 | 平台按授权处理 |
| DAT-STU-03 | Student Attention Event | 学生关注事件 | 系统/教师 | 系统/教师 | 系统/教师 | 学校 | 系统/教师 | 平台按授权处理 |
| DAT-INS-01 | Learning Evidence | 学习证据 | 系统/教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-INS-02 | Knowledge Attribution | 知识点归因 | AI/系统 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-INS-03 | Mastery State | 掌握状态 | 系统/AI | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-INS-04 | Teacher Insight Correction | 教师修正记录 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-PLN-01 | Improvement Candidate | 提升候选 | AI/系统/教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-PLN-02 | Subject Improvement Plan | 学科提升计划 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-PLN-03 | Improvement Task | 提升任务 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-PLN-04 | Cross-subject Coordination View | 全科协调视图 | 系统 | 班主任 | 班主任 | 学校 | 班主任 | 平台按授权处理 |
| DAT-APP-01 | Student Today Task View | 学生今日任务 | 系统 | 系统 | 系统 | 学校 | 系统 | 平台按授权处理 |
| DAT-APP-02 | Student Learning Session | 学生学习会话 | 学生 | 学生 | 学生 | 学校 | 系统 | 平台按授权处理 |
| DAT-APP-03 | Student Difficulty Feedback | 困难反馈 | 学生 | 学生 | 学生 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-CORR-01 | Correction Task | 订正任务 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-CORR-02 | Correction Submission | 订正提交 | 学生 | 学生 | 学生 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-CORR-03 | Correction Decision | 订正判定 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-AIX-01 | AI Conversation | AI 对话会话 | 当前用户 | 当前用户 | 当前用户 | 学校 | 系统 | 平台按授权处理 |
| DAT-AIX-02 | AI Intent Resolution | 意图解析结果 | AI | 系统 | 系统 | 学校 | 系统 | 平台按授权处理 |
| DAT-AIX-03 | AI Execution Preview | 执行预览 | AI | 当前用户 | 当前用户 | 学校 | 系统 | 平台按授权处理 |
| DAT-AIX-04 | AI Task Run | AI 任务运行 | 系统 | 当前用户 | 当前用户 | 学校 | 系统 | 平台按授权处理 |
| DAT-RPT-01 | Ad-hoc Report View | 临时报表 | 查询创建者 | 查询创建者 | 查询创建者 | 学校 | 查询创建者 | 平台按授权处理 |
| DAT-RPT-02 | Report Subscription | 定期报告订阅 | 订阅创建者 | 订阅创建者 | 订阅创建者 | 学校 | 订阅创建者 | 平台按授权处理 |
| DAT-RPT-03 | Report Snapshot | 报告快照 | 系统 | 系统 | 系统 | 学校 | 订阅创建者 | 平台按授权处理 |
| DAT-RPT-04 | Report Delivery Record | 报告投递记录 | 系统 | 系统 | 系统 | 学校 | 系统 | 平台按授权处理 |
| DAT-LPATH-01 | Learning Path Timeline | 学习路径时间线 | 系统 | 系统 | 系统 | 学校 | 系统 | 平台按授权处理 |
| DAT-LPATH-02 | Confirmed Learning Interpretation | 已确认学习解释 | AI/系统 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-LPATH-03 | Learning Path Visibility Rule | 学习路径可见规则 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-NOTI-01 | Notification Template | 通知模板 | 源模块 Owner | 源模块 Owner | 源模块 Owner | 学校 | 源模块 Owner | 平台按授权处理 |
| DAT-NOTI-02 | Notification Delivery | 通知投递记录 | 系统 | 系统 | 系统 | 学校 | 系统 | 平台按授权处理 |
| DAT-NOTI-03 | Notification Read State | 阅读状态 | 接收者 | 接收者 | 接收者 | 学校 | 接收者 | 平台按授权处理 |
| DAT-PREP-01 | Lesson Plan | 备课方案 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-PREP-02 | Teaching Material Reference | 教学材料引用 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-PREP-03 | Classroom Activity Record | 课堂活动记录 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-CONTENT-01 | Question Item | 题目 | 学科负责人 | 学科负责人 | 学科负责人 | 学校 | 学科负责人 | 平台按授权处理 |
| DAT-CONTENT-02 | Answer Analysis | 答案解析 | 学科负责人 | 学科负责人 | 学科负责人 | 学校 | 学科负责人 | 平台按授权处理 |
| DAT-CONTENT-03 | Content Collection | 内容集合 | 学科负责人 | 学科负责人 | 学科负责人 | 学校 | 学科负责人 | 平台按授权处理 |
| DAT-CONTENT-04 | Content Permission | 内容授权 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-EXM-01 | Exam Event | 考试 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-EXM-02 | Exam Subject Score | 考试科目成绩 | 任课教师 | 任课教师 | 任课教师 | 学校 | 任课教师 | 平台按授权处理 |
| DAT-EXM-03 | Aggregate Score Rule | 综合成绩规则 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-EXM-04 | Exam Publish Version | 考试发布版本 | 教务/任课教师 | 教务/任课教师 | 教务/任课教师 | 学校 | 教务/任课教师 | 平台按授权处理 |
| DAT-SCH-01 | Scheduling Input | 排课输入 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-SCH-02 | Scheduling Constraint | 排课约束 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-SCH-03 | Schedule Candidate | 候选课表 | 系统 | 系统 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-SCH-04 | Published Timetable | 正式课表 | 教务 | 教务 | 教务 | 学校 | 教务 | 平台按授权处理 |
| DAT-REPORT-01 | Guardian Report Definition | 家长报告定义 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-REPORT-02 | Share Authorization | 分享授权 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
| DAT-REPORT-03 | Share Access Record | 分享访问记录 | 系统 | 系统 | 系统 | 学校 | 系统 | 平台按授权处理 |
| DAT-PLAT-01 | School Onboarding Case | 学校入驻工单 | 平台运营 | 平台运营 | 平台运营 | 学校 | 平台运营 | 平台按授权处理 |
| DAT-PLAT-02 | Service Plan | 服务方案 | 平台运营 | 平台运营 | 平台运营 | 学校 | 平台运营 | 平台按授权处理 |
| DAT-PLAT-03 | Tenant Policy Template | 租户策略模板 | 平台运营 | 平台运营 | 平台运营 | 学校 | 平台运营 | 平台按授权处理 |
| DAT-PLAT-04 | Support Access Request | 支持访问申请 | 学校管理员 | 学校管理员 | 学校管理员 | 学校 | 学校管理员 | 平台按授权处理 |
