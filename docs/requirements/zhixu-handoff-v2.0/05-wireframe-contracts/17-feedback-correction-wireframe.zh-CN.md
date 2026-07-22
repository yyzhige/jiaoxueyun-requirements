交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。

# CORR-001 AI-driven Correction and Reassessment Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | CORR-001 |
| 阶段 | 2 |
| 交付状态 | PLANNED |
| 页面数量 | 1 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## CORR-PAGE-ATTEMPT Student Correction and Bounded Professional Exception Workspace

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | CORR-OBJ-TASK / CORR-OBJ-ATTEMPT / CORR-OBJ-ATTEMPT-ASSESSMENT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CORR-OBJ-TASK | CORR-TASK-F-ID | Correction Task ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-TASK | CORR-TASK-F-STUDENT-REF | Correction Task Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-TASK | CORR-TASK-F-SOURCE-DATA-ID | Correction Task Source Result Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-TASK | CORR-TASK-F-SOURCE-RESULT-REF | Correction Task Source Result Reference | ID | 是 | OBJECT_REF: PUB-OBJ-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-TASK | CORR-TASK-F-SOURCE-RESULT-VERSION | Correction Task Source Result Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-TASK | CORR-TASK-F-DUE-AT | Correction Task Due Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-TASK | CORR-TASK-F-OVERDUE-HANDLING | Correction Task Overdue Handling | TEXT | required when the correction task reaches OVERDUE；状态=OVERDUE | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-TASK | CORR-TASK-F-TASK-VERSION | Correction Task Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-ID | Correction Attempt ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-STUDENT-REF | Correction Attempt Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-TASK-REF | Correction Task Reference | ID | 是 | OBJECT_REF: CORR-OBJ-TASK | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-TASK-VERSION | Correction Task Version at Submission | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF | Prior Correction Attempt Reference | ID | required for a resubmission and absent for the first accepted submission；状态=SUBMITTED；动作=CORR-ACT-RESUBMIT | OBJECT_REF: CORR-OBJ-ATTEMPT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION | Prior Correction Attempt Version | INTEGER | required for a resubmission and absent for the first accepted submission；状态=SUBMITTED；动作=CORR-ACT-RESUBMIT | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-CORRECTION-ANSWER | Student Correction Answer | JSON | required when the correction reaches SUBMITTED；状态=SUBMITTED | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-TEACHER-JUDGMENT | Professional Exception Resolution (exception only) | STRING | required when the correction reaches JUDGED or NEEDS_RETRY；状态=JUDGED/NEEDS_RETRY | OPTION_SET: OPT-ENUM-028 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-TEACHER-CONFIRMER-REF | Authorized Professional Exception Resolver | ID | required when the correction reaches JUDGED or NEEDS_RETRY；状态=JUDGED/NEEDS_RETRY | OBJECT_REF: ORG-OBJ-TEACHER | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT | Repeated Correction Count | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-OVERDUE-HANDLING | Correction Overdue Handling | TEXT | required when an overdue correction is submitted；状态=SUBMITTED；动作=CORR-ACT-SUBMIT-LATE | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-CORRECTION-VERSION | Correction Attempt Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-ID | Correction Attempt Assessment ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-SOURCE-ATTEMPT-REF | Source Correction Attempt Reference | ID | 是 | OBJECT_REF: CORR-OBJ-ATTEMPT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION | Source Correction Attempt Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-VALID-ATTEMPT | Correction Attempt Classification | STRING | 是 | OPTION_SET: OPT-AI2-008 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-NEXT-STEP | Correction AI Assessment Next Step | STRING | 是 | OPTION_SET: OPT-AI2-005 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-ANSWER-EXPOSURE | Answer Exposure Condition | STRING | 是 | OPTION_SET: OPT-AI2-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-EVIDENCE-KIND | Correction Evidence Kind | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-VALIDITY-STATUS | Correction Assessment Validity Status | STRING | 是 | OPTION_SET: OPT-AI2-004 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-DISPUTE-CORRECTION-STATUS | Correction Assessment Dispute and Correction Status | STRING | 是 | OPTION_SET: OPT-AI2-003 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-REF | Prior Correction Assessment Reference | ID | 否 | OBJECT_REF: CORR-OBJ-ATTEMPT-ASSESSMENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-VERSION | Prior Correction Assessment Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-SUPERSESSION-REASON | Correction Assessment Supersession Reason | TEXT | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-VERSION | Correction Attempt Assessment Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CORR-ACT-CREATE-TASK | Create a Correction Task | CREATE | CORR-TASK-F-STUDENT-REF<br>CORR-TASK-F-SOURCE-RESULT-REF<br>CORR-TASK-F-SOURCE-RESULT-VERSION | CORR-TASK-F-ID<br>CORR-TASK-F-SOURCE-DATA-ID<br>CORR-TASK-F-DUE-AT<br>CORR-TASK-F-TASK-VERSION | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / AI / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CORR-ACT-SUBMIT-INITIAL | Submit an Open Correction Answer | CREATE | CORR-ATTEMPT-F-CORRECTION-ANSWER | CORR-ATTEMPT-F-ID<br>CORR-ATTEMPT-F-STUDENT-REF<br>CORR-ATTEMPT-F-TASK-REF<br>CORR-ATTEMPT-F-TASK-VERSION<br>CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT<br>CORR-ATTEMPT-F-CORRECTION-VERSION | CREATE | ROLE-STUDENT | DUTY-SUBJECT-TEACHER / AI / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CORR-ACT-SUBMIT-LATE | Submit an Overdue Correction Answer | CREATE | CORR-ATTEMPT-F-CORRECTION-ANSWER | CORR-ATTEMPT-F-ID<br>CORR-ATTEMPT-F-STUDENT-REF<br>CORR-ATTEMPT-F-TASK-REF<br>CORR-ATTEMPT-F-TASK-VERSION<br>CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT<br>CORR-ATTEMPT-F-CORRECTION-VERSION<br>CORR-ATTEMPT-F-OVERDUE-HANDLING | CREATE | ROLE-STUDENT | DUTY-SUBJECT-TEACHER / AI / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CORR-ACT-CONFIRM-JUDGMENT | Resolve a Completed Professional Correction Exception | UPDATE | CORR-ATTEMPT-F-TEACHER-JUDGMENT | CORR-ATTEMPT-F-TEACHER-JUDGMENT<br>CORR-ATTEMPT-F-TEACHER-CONFIRMER-REF<br>CORR-ATTEMPT-F-CORRECTION-VERSION | SUBMITTED → JUDGED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS / AI | HIGH / REQUIRED | PERMISSION_DENIED / STALE_RESULT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| CORR-ACT-REQUEST-RETRY | Resolve a Retry Professional Correction Exception | UPDATE | CORR-ATTEMPT-F-TEACHER-JUDGMENT | CORR-ATTEMPT-F-TEACHER-JUDGMENT<br>CORR-ATTEMPT-F-TEACHER-CONFIRMER-REF<br>CORR-ATTEMPT-F-CORRECTION-VERSION | SUBMITTED → NEEDS_RETRY | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS / AI | HIGH / REQUIRED | PERMISSION_DENIED / STALE_RESULT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| CORR-ACT-RESUBMIT | Resubmit a Repeated Correction | CREATE | CORR-ATTEMPT-F-CORRECTION-ANSWER | CORR-ATTEMPT-F-ID<br>CORR-ATTEMPT-F-STUDENT-REF<br>CORR-ATTEMPT-F-TASK-REF<br>CORR-ATTEMPT-F-TASK-VERSION<br>CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT<br>CORR-ATTEMPT-F-CORRECTION-VERSION<br>CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF<br>CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION | CREATE | ROLE-STUDENT | DUTY-SUBJECT-TEACHER / AI / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
