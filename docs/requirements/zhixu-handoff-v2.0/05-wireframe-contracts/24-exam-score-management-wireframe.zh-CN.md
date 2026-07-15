# EXM-001 Exam Event Score Import and Publication Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | EXM-001 |
| 阶段 | 1 |
| 页面数量 | 3 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## EXM-PAGE-ACADEMIC-OPERATIONS Exam Academic Operations Workspace

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | EXM-OBJ-EXAM-EVENT / EXM-OBJ-SCORE-IMPORT / EXM-OBJ-AGGREGATE-RULE / EXM-OBJ-SUBJECT-SCORE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-ID | Exam Event ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-NAME | Exam Event Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-TERM | Exam Term | STRING | 是 | OPTION_SET: OPT-COM-004 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-STATUS | Exam Event Status | STRING | 是 | OPTION_SET: OPT-EXT-004 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-PUBLICATION-AT | Exam Publication Time | DATETIME | required only when the exam event is published；状态=PUBLISHED；动作=EXM-ACT-PUBLISH-EVENT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-ID | Subject Score Import Batch ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-FILE | Subject Score Import File | FILE_REFERENCE | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-SUBJECT | Imported Subject | STRING | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-VALIDATION | Import Validation Result | STRING | 是 | OPTION_SET: OPT-EXT-005 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-EVIDENCE | Import Validation Evidence | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-VERSION | Score Import Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-REJECTION-REASON | Score Import Rejection Reason | TEXT | required when score import validation is REJECTED；状态=REJECTED；动作=EXM-ACT-REJECT-SCORE-IMPORT | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-AGGREGATE-RULE | EXM-RULE-F-ID | Aggregate Score Rule Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-AGGREGATE-RULE | EXM-RULE-F-DEFINITION | Aggregate Score Rule Definition | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-AGGREGATE-RULE | EXM-RULE-F-VERSION | Aggregate Score Rule Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-ID | Published Subject Score Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-STUDENT-ID | Student | ID | 是 | OPTION_SET: OPT-COM-010 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-SUBJECT | Subject | ID | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-SCORE | Published Subject Score | DECIMAL | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-EVIDENCE | Subject Score Evidence | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-IMPORT-REF | Pinned Passed Score Import | ID | 是 | OBJECT_REF: EXM-OBJ-SCORE-IMPORT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-IMPORT-VERSION | Pinned Score Import Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-TEACHER-CONFIRMED-AT | Subject Teacher Confirmation Time | DATETIME | required only after subject-teacher confirmation；状态=TEACHER_CONFIRMED；动作=EXM-ACT-CONFIRM-SUBJECT-SCORE | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-VISIBLE-AT | Student Score Visible Time | DATETIME | required when the subject score is first published；状态=PUBLISHED；动作=EXM-ACT-PUBLISH-SUBJECT-SCORE | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-CONFIRMATION-DECISION | Subject Score Confirmation Decision | STRING | required for subject-teacher confirmation or rejection；状态=TEACHER_CONFIRMED/REJECTED；动作=EXM-ACT-CONFIRM-SUBJECT-SCORE/EXM-ACT-REJECT-SUBJECT-SCORE | OPTION_SET: OPT-EXT-018 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-CONFIRMATION-REASON | Subject Score Confirmation Reason | TEXT | required for subject-teacher confirmation or rejection；状态=TEACHER_CONFIRMED/REJECTED；动作=EXM-ACT-CONFIRM-SUBJECT-SCORE/EXM-ACT-REJECT-SUBJECT-SCORE | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-VERSION | Subject Score Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXM-ACT-CREATE-EVENT | Create Exam Event | CREATE | EXM-EVENT-F-NAME<br>EXM-EVENT-F-TERM | EXM-EVENT-F-ID<br>EXM-EVENT-F-STATUS | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-PUBLISH-EVENT | Publish Exam Event | UPDATE |  | EXM-EVENT-F-STATUS<br>EXM-EVENT-F-PUBLICATION-AT | DRAFT → PUBLISHED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-OPEN-CORRECTION | Open Exam Correction Window | UPDATE |  | EXM-EVENT-F-STATUS | PUBLISHED → CORRECTION_OPEN | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-IMPORT-SCORES | Import Subject Scores | CREATE | EXM-IMPORT-F-FILE<br>EXM-IMPORT-F-SUBJECT | EXM-IMPORT-F-ID<br>EXM-IMPORT-F-VALIDATION<br>EXM-IMPORT-F-EVIDENCE<br>EXM-IMPORT-F-VERSION | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-VALIDATE-SCORE-IMPORT | Validate Subject Score Import | UPDATE |  | EXM-IMPORT-F-VALIDATION<br>EXM-IMPORT-F-EVIDENCE<br>EXM-IMPORT-F-VERSION | PENDING → PASSED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / IMPORT_REJECTED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-REJECT-SCORE-IMPORT | Reject Invalid Subject Score Import | UPDATE | EXM-IMPORT-F-REJECTION-REASON | EXM-IMPORT-F-VALIDATION<br>EXM-IMPORT-F-EVIDENCE<br>EXM-IMPORT-F-VERSION<br>EXM-IMPORT-F-REJECTION-REASON | PENDING → REJECTED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-REVISE-REJECTED-IMPORT | Revise Rejected Subject Score Import | UPDATE | EXM-IMPORT-F-FILE | EXM-IMPORT-F-VALIDATION<br>EXM-IMPORT-F-EVIDENCE<br>EXM-IMPORT-F-VERSION | REJECTED → PENDING | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-ACCEPT-SCORE-IMPORT | Accept Validated Subject Score Import | UPDATE |  | EXM-IMPORT-F-VALIDATION<br>EXM-IMPORT-F-EVIDENCE<br>EXM-IMPORT-F-VERSION | PASSED → ACCEPTED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / IMPORT_REJECTED / SOURCE_VERSION_STALE / VERSION_CONFLICT |
| EXM-ACT-CREATE-AGGREGATE-RULE | Create Aggregate Score Rule Version | CREATE | EXM-RULE-F-DEFINITION | EXM-RULE-F-ID<br>EXM-RULE-F-VERSION | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-ACTIVATE-AGGREGATE-RULE | Activate Aggregate Score Rule Version | UPDATE |  | EXM-RULE-F-VERSION | DRAFT → ACTIVE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-CREATE-SUBJECT-SCORE | Create Imported Subject Score Version | CREATE | EXM-SCORE-F-STUDENT-ID<br>EXM-SCORE-F-SUBJECT<br>EXM-SCORE-F-SCORE<br>EXM-SCORE-F-IMPORT-REF<br>EXM-SCORE-F-IMPORT-VERSION | EXM-SCORE-F-ID<br>EXM-SCORE-F-EVIDENCE<br>EXM-SCORE-F-VERSION | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / IMPORT_REJECTED / SOURCE_VERSION_STALE / VERSION_CONFLICT |
| EXM-ACT-CONFIRM-SUBJECT-SCORE | Confirm Subject Score Professionally | UPDATE | EXM-SCORE-F-CONFIRMATION-DECISION<br>EXM-SCORE-F-CONFIRMATION-REASON | EXM-SCORE-F-EVIDENCE<br>EXM-SCORE-F-TEACHER-CONFIRMED-AT<br>EXM-SCORE-F-VERSION<br>EXM-SCORE-F-CONFIRMATION-DECISION<br>EXM-SCORE-F-CONFIRMATION-REASON | IMPORTED → TEACHER_CONFIRMED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / SCORE_REJECTED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-REJECT-SUBJECT-SCORE | Reject Imported Subject Score for Revision | UPDATE | EXM-SCORE-F-CONFIRMATION-DECISION<br>EXM-SCORE-F-CONFIRMATION-REASON | EXM-SCORE-F-EVIDENCE<br>EXM-SCORE-F-VERSION<br>EXM-SCORE-F-CONFIRMATION-DECISION<br>EXM-SCORE-F-CONFIRMATION-REASON | IMPORTED → REJECTED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-REVISE-REJECTED-SUBJECT-SCORE | Revise Rejected Subject Score | UPDATE | EXM-SCORE-F-SCORE | EXM-SCORE-F-SCORE<br>EXM-SCORE-F-EVIDENCE<br>EXM-SCORE-F-VERSION | REJECTED → IMPORTED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-PUBLISH-SUBJECT-SCORE | Publish Teacher Confirmed Subject Score | UPDATE |  | EXM-SCORE-F-VISIBLE-AT<br>EXM-SCORE-F-VERSION | TEACHER_CONFIRMED → PUBLISHED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / SCORE_REJECTED / TEACHER_CONFIRMATION_REQUIRED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-CORRECT-SUBJECT-SCORE | Correct Published Subject Score | UPDATE | EXM-SCORE-F-SCORE | EXM-SCORE-F-EVIDENCE<br>EXM-SCORE-F-VERSION | PUBLISHED → CORRECTED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-REPUBLISH-CORRECTED-SCORE | Republish Corrected Subject Score | UPDATE |  | EXM-SCORE-F-VERSION | CORRECTED → PUBLISHED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## EXM-PAGE-MOBILE-ACADEMIC-REVIEW Mobile Exam Academic Review

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| APP | EXM-OBJ-EXAM-EVENT / EXM-OBJ-SCORE-IMPORT / EXM-OBJ-AGGREGATE-RULE / EXM-OBJ-SUBJECT-SCORE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-ID | Exam Event ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-NAME | Exam Event Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-TERM | Exam Term | STRING | 是 | OPTION_SET: OPT-COM-004 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-STATUS | Exam Event Status | STRING | 是 | OPTION_SET: OPT-EXT-004 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-PUBLICATION-AT | Exam Publication Time | DATETIME | required only when the exam event is published；状态=PUBLISHED；动作=EXM-ACT-PUBLISH-EVENT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-ID | Subject Score Import Batch ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-FILE | Subject Score Import File | FILE_REFERENCE | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-SUBJECT | Imported Subject | STRING | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-VALIDATION | Import Validation Result | STRING | 是 | OPTION_SET: OPT-EXT-005 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-EVIDENCE | Import Validation Evidence | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-VERSION | Score Import Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-REJECTION-REASON | Score Import Rejection Reason | TEXT | required when score import validation is REJECTED；状态=REJECTED；动作=EXM-ACT-REJECT-SCORE-IMPORT | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-AGGREGATE-RULE | EXM-RULE-F-ID | Aggregate Score Rule Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-AGGREGATE-RULE | EXM-RULE-F-DEFINITION | Aggregate Score Rule Definition | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-AGGREGATE-RULE | EXM-RULE-F-VERSION | Aggregate Score Rule Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-ID | Published Subject Score Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-STUDENT-ID | Student | ID | 是 | OPTION_SET: OPT-COM-010 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-SUBJECT | Subject | ID | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-SCORE | Published Subject Score | DECIMAL | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-EVIDENCE | Subject Score Evidence | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-IMPORT-REF | Pinned Passed Score Import | ID | 是 | OBJECT_REF: EXM-OBJ-SCORE-IMPORT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-IMPORT-VERSION | Pinned Score Import Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-TEACHER-CONFIRMED-AT | Subject Teacher Confirmation Time | DATETIME | required only after subject-teacher confirmation；状态=TEACHER_CONFIRMED；动作=EXM-ACT-CONFIRM-SUBJECT-SCORE | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-VISIBLE-AT | Student Score Visible Time | DATETIME | required when the subject score is first published；状态=PUBLISHED；动作=EXM-ACT-PUBLISH-SUBJECT-SCORE | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-CONFIRMATION-DECISION | Subject Score Confirmation Decision | STRING | required for subject-teacher confirmation or rejection；状态=TEACHER_CONFIRMED/REJECTED；动作=EXM-ACT-CONFIRM-SUBJECT-SCORE/EXM-ACT-REJECT-SUBJECT-SCORE | OPTION_SET: OPT-EXT-018 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-CONFIRMATION-REASON | Subject Score Confirmation Reason | TEXT | required for subject-teacher confirmation or rejection；状态=TEACHER_CONFIRMED/REJECTED；动作=EXM-ACT-CONFIRM-SUBJECT-SCORE/EXM-ACT-REJECT-SUBJECT-SCORE | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-VERSION | Subject Score Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXM-ACT-CREATE-EVENT | Create Exam Event | CREATE | EXM-EVENT-F-NAME<br>EXM-EVENT-F-TERM | EXM-EVENT-F-ID<br>EXM-EVENT-F-STATUS | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-PUBLISH-EVENT | Publish Exam Event | UPDATE |  | EXM-EVENT-F-STATUS<br>EXM-EVENT-F-PUBLICATION-AT | DRAFT → PUBLISHED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-OPEN-CORRECTION | Open Exam Correction Window | UPDATE |  | EXM-EVENT-F-STATUS | PUBLISHED → CORRECTION_OPEN | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-CREATE-AGGREGATE-RULE | Create Aggregate Score Rule Version | CREATE | EXM-RULE-F-DEFINITION | EXM-RULE-F-ID<br>EXM-RULE-F-VERSION | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-ACTIVATE-AGGREGATE-RULE | Activate Aggregate Score Rule Version | UPDATE |  | EXM-RULE-F-VERSION | DRAFT → ACTIVE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-CREATE-SUBJECT-SCORE | Create Imported Subject Score Version | CREATE | EXM-SCORE-F-STUDENT-ID<br>EXM-SCORE-F-SUBJECT<br>EXM-SCORE-F-SCORE<br>EXM-SCORE-F-IMPORT-REF<br>EXM-SCORE-F-IMPORT-VERSION | EXM-SCORE-F-ID<br>EXM-SCORE-F-EVIDENCE<br>EXM-SCORE-F-VERSION | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / IMPORT_REJECTED / SOURCE_VERSION_STALE / VERSION_CONFLICT |
| EXM-ACT-CONFIRM-SUBJECT-SCORE | Confirm Subject Score Professionally | UPDATE | EXM-SCORE-F-CONFIRMATION-DECISION<br>EXM-SCORE-F-CONFIRMATION-REASON | EXM-SCORE-F-EVIDENCE<br>EXM-SCORE-F-TEACHER-CONFIRMED-AT<br>EXM-SCORE-F-VERSION<br>EXM-SCORE-F-CONFIRMATION-DECISION<br>EXM-SCORE-F-CONFIRMATION-REASON | IMPORTED → TEACHER_CONFIRMED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / SCORE_REJECTED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-REJECT-SUBJECT-SCORE | Reject Imported Subject Score for Revision | UPDATE | EXM-SCORE-F-CONFIRMATION-DECISION<br>EXM-SCORE-F-CONFIRMATION-REASON | EXM-SCORE-F-EVIDENCE<br>EXM-SCORE-F-VERSION<br>EXM-SCORE-F-CONFIRMATION-DECISION<br>EXM-SCORE-F-CONFIRMATION-REASON | IMPORTED → REJECTED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-REVISE-REJECTED-SUBJECT-SCORE | Revise Rejected Subject Score | UPDATE | EXM-SCORE-F-SCORE | EXM-SCORE-F-SCORE<br>EXM-SCORE-F-EVIDENCE<br>EXM-SCORE-F-VERSION | REJECTED → IMPORTED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-PUBLISH-SUBJECT-SCORE | Publish Teacher Confirmed Subject Score | UPDATE |  | EXM-SCORE-F-VISIBLE-AT<br>EXM-SCORE-F-VERSION | TEACHER_CONFIRMED → PUBLISHED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / SCORE_REJECTED / TEACHER_CONFIRMATION_REQUIRED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-CORRECT-SUBJECT-SCORE | Correct Published Subject Score | UPDATE | EXM-SCORE-F-SCORE | EXM-SCORE-F-EVIDENCE<br>EXM-SCORE-F-VERSION | PUBLISHED → CORRECTED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| EXM-ACT-REPUBLISH-CORRECTED-SCORE | Republish Corrected Subject Score | UPDATE |  | EXM-SCORE-F-VERSION | CORRECTED → PUBLISHED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 本页不登记 Web 入口。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## EXM-PAGE-STUDENT-PUBLISHED-SCORE Student Published Subject Score

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | EXM-OBJ-SUBJECT-SCORE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-STUDENT-ID | Student | ID | 是 | OPTION_SET: OPT-COM-010 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-SCORE | Published Subject Score | DECIMAL | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-EVIDENCE | Subject Score Evidence | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-VERSION | Subject Score Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-VISIBLE-AT | Student Score Visible Time | DATETIME | required when the subject score is first published；状态=PUBLISHED；动作=EXM-ACT-PUBLISH-SUBJECT-SCORE | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXM-ACT-VIEW-PUBLISHED-SCORE | View My Published Subject Score | READ | EXM-SCORE-F-STUDENT-ID | EXM-SCORE-F-STUDENT-ID<br>EXM-SCORE-F-SCORE<br>EXM-SCORE-F-EVIDENCE<br>EXM-SCORE-F-VERSION<br>EXM-SCORE-F-VISIBLE-AT | UNCHANGED | ROLE-STUDENT | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / RESULT_NOT_PUBLISHED / RESULT_NOT_VISIBLE |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
