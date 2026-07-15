# GRD-001 Grading Routing and Teacher Decision Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | GRD-001 |
| 阶段 | 1 |
| 页面数量 | 1 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## GRD-PAGE-DECISION Subject Teacher Grading Workspace

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | GRD-OBJ-CAPABILITY-RULE / GRD-OBJ-DECISION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-RULE-ID | Capability Rule ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-RULE-VERSION | Capability Rule Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SOURCE-REF | Capability Rule Source Reference | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SOURCE-VERSION | Capability Rule Source Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SUBJECT-FAMILY | Subject Family | STRING | 是 | OPTION_SET: OPT-TL-003 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-QUESTION-TYPE | Question Type | STRING | 是 | OPTION_SET: OPT-ENUM-003 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SUBMISSION-METHOD | Submission Method | STRING | 是 | OPTION_SET: OPT-ENUM-031 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-RECOGNITION-LEVEL | Recognition Level | STRING | 是 | OPTION_SET: OPT-TL-004 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SCORING-LEVEL | Scoring Level | STRING | 是 | OPTION_SET: OPT-TL-005 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-REQUIRED-EVIDENCE | Required Evidence | STRING_ARRAY | 是 | OPTION_SET: OPT-TL-006 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-TEACHER-REVIEW | Teacher Review Required | STRING | 是 | OPTION_SET: OPT-ENUM-001 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-BATCH-CONFIRM | Batch Confirmation Eligibility | STRING | 是 | OPTION_SET: OPT-TL-007 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-UNAVAILABLE-FALLBACK | Unavailable Fallback | STRING | 是 | OPTION_SET: OPT-TL-008 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-ID | Grading Decision ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-RECOGNIZED-ANSWER | Recognized Answer | JSON | required when automated grading processing produces recognition evidence；状态=PROCESSING；动作=GRD-ACT-PROCESS | SYSTEM | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-RECOGNIZED-REGION | Recognized Region | JSON | required when automated grading processing produces recognition evidence；状态=PROCESSING；动作=GRD-ACT-PROCESS | SYSTEM | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-SUBMISSION-REF | Input Submission Reference | ID | 是 | OBJECT_REF: SUB-OBJ-ATTEMPT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-SUBMISSION-VERSION | Input Submission Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-ITEM-REF | Input Item Reference | ID | 是 | OBJECT_REF: HW-OBJ-ITEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-ITEM-VERSION | Input Item Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-RUBRIC-REF | Input Rubric Reference | ID | 是 | OBJECT_REF: HW-OBJ-RUBRIC | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-RUBRIC-VERSION | Input Rubric Version | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-CAPABILITY-RULE-REF | Capability Rule Reference | ID | 是 | OBJECT_REF: GRD-OBJ-CAPABILITY-RULE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-CAPABILITY-RULE-VERSION | Capability Rule Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-SUGGESTED-SCORE | Suggested Score | DECIMAL | required when automated grading processing produces a scoring suggestion；状态=PROCESSING；动作=GRD-ACT-PROCESS | SYSTEM | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-SCORING-RATIONALE | Scoring Rationale | TEXT | required when automated grading processing produces a scoring suggestion；状态=PROCESSING；动作=GRD-ACT-PROCESS | SYSTEM | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-CONFIDENCE | Confidence Status | STRING | required when automated grading processing produces a scoring suggestion；状态=PROCESSING；动作=GRD-ACT-PROCESS | OPTION_SET: OPT-ENUM-005 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-LIMITATION | Limitation Note | TEXT | required when automated grading processing produces a scoring suggestion；状态=PROCESSING；动作=GRD-ACT-PROCESS | SYSTEM | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-OFFICIAL-SCORE | Teacher Official Score | DECIMAL | required when the grading decision reaches TEACHER_CONFIRMED；状态=TEACHER_CONFIRMED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-TEACHER-FEEDBACK | Teacher Feedback | TEXT | required when the grading decision reaches TEACHER_CONFIRMED；状态=TEACHER_CONFIRMED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-CORRECTION-REASON | Correction Reason | STRING | required when correcting recognition, overriding a score, or revising a confirmed decision；状态=ROUTED_REVIEW/TEACHER_CONFIRMED/REVISION_PENDING/QUEUED；动作=GRD-ACT-CORRECT-RECOGNITION/GRD-ACT-OVERRIDE-SCORE/GRD-ACT-OPEN-CONFIRMED-REVISION/GRD-ACT-CONFIRM-REVISION/GRD-ACT-RESOLVE-VERSION-CONFLICT | OPTION_SET: OPT-ENUM-006 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-DECISION-VERSION | Decision Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-PRIOR-DECISION-VERSION | Prior Confirmed Decision Version | INTEGER | required when revising a confirmed decision；状态=REVISION_PENDING；动作=GRD-ACT-OPEN-CONFIRMED-REVISION | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-ROUTE | Grading Route | STRING | required when the grading decision reaches ROUTED_REVIEW or ROUTED_MANUAL；状态=ROUTED_REVIEW/ROUTED_MANUAL | OPTION_SET: OPT-TL-011 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GRD-ACT-CORRECT-RECOGNITION | Correct Recognized Answer Region | UPDATE | GRD-DECISION-F-RECOGNIZED-ANSWER<br>GRD-DECISION-F-RECOGNIZED-REGION<br>GRD-DECISION-F-CORRECTION-REASON | GRD-DECISION-F-CORRECTION-REASON<br>GRD-DECISION-F-DECISION-VERSION | ROUTED_REVIEW → ROUTED_REVIEW | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| GRD-ACT-ACCEPT-SUGGESTION | Accept Suggested Score | UPDATE | GRD-DECISION-F-SUGGESTED-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-DECISION-VERSION | ROUTED_REVIEW → TEACHER_CONFIRMED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / SUBJECTIVE_REVIEW_REQUIRED / STALE_INPUT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| GRD-ACT-OVERRIDE-SCORE | Override Suggested Score | UPDATE | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-CORRECTION-REASON | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-CORRECTION-REASON<br>GRD-DECISION-F-DECISION-VERSION | ROUTED_REVIEW → TEACHER_CONFIRMED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / CORRECTION_REASON_REQUIRED / STALE_INPUT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| GRD-ACT-MANUAL-GRADE | Grade Submission Manually | UPDATE | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-DECISION-VERSION | ROUTED_MANUAL → TEACHER_CONFIRMED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / MISSING_REQUIRED_EVIDENCE / STALE_INPUT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| GRD-ACT-BATCH-CONFIRM | Batch Confirm Eligible Scores | UPDATE | GRD-DECISION-F-SUGGESTED-SCORE<br>GRD-DECISION-F-SCORING-RATIONALE | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-DECISION-VERSION | ROUTED_REVIEW → TEACHER_CONFIRMED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / SUBJECTIVE_ITEMS_INELIGIBLE / LOW_CONFIDENCE_INELIGIBLE / VERSION_CONFLICT / AUDIT_FAILED |
| GRD-ACT-OPEN-CONFIRMED-REVISION | Open Confirmed Decision Revision | UPDATE | GRD-DECISION-F-CORRECTION-REASON | GRD-DECISION-F-CORRECTION-REASON<br>GRD-DECISION-F-PRIOR-DECISION-VERSION<br>GRD-DECISION-F-DECISION-VERSION | TEACHER_CONFIRMED → REVISION_PENDING | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / CORRECTION_REASON_REQUIRED / VERSION_CONFLICT / AUDIT_FAILED |
| GRD-ACT-CONFIRM-REVISION | Confirm Revised Decision | UPDATE | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-CORRECTION-REASON | GRD-DECISION-F-CORRECTION-REASON<br>GRD-DECISION-F-DECISION-VERSION | REVISION_PENDING → TEACHER_CONFIRMED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / CORRECTION_REASON_REQUIRED / STALE_INPUT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| GRD-ACT-RESOLVE-VERSION-CONFLICT | Resolve Grading Version Conflict | UPDATE | GRD-DECISION-F-CORRECTION-REASON | GRD-DECISION-F-SUBMISSION-REF<br>GRD-DECISION-F-SUBMISSION-VERSION<br>GRD-DECISION-F-ITEM-REF<br>GRD-DECISION-F-ITEM-VERSION<br>GRD-DECISION-F-RUBRIC-REF<br>GRD-DECISION-F-RUBRIC-VERSION<br>GRD-DECISION-F-CAPABILITY-RULE-REF<br>GRD-DECISION-F-CAPABILITY-RULE-VERSION<br>GRD-DECISION-F-CORRECTION-REASON<br>GRD-DECISION-F-DECISION-VERSION | CONFLICT → QUEUED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / SOURCE_VERSION_STILL_STALE / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
