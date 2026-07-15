# SUB-001 Student Answering and Submission Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | SUB-001 |
| 阶段 | 1 |
| 页面数量 | 2 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## SUB-PAGE-APP App Student Submission Workspace

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| APP | SUB-OBJ-DRAFT / SUB-OBJ-ATTEMPT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-ID | Submission Draft ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-ANSWER-PAYLOAD | Answer Payload by Question Type | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must use the payload schema registered for each assignment item question type |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-MEDIA-METADATA | Media Metadata | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-PAGE-ITEM-MAPPING | Page and Item Mapping | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-IMAGE-QUALITY | Image Quality | STRING | 是 | OPTION_SET: OPT-ENUM-027 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-UPLOAD-SESSION-ID | Upload Session | ID | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-PENDING-CHUNK | Pending Upload Chunk | FILE_REFERENCE | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-SUCCESSFUL-CHUNKS | Successful Upload Chunks | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-DRAFT-VERSION | Draft Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT | Weak Network Recovery Checkpoint | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | may contain only the latest draft and chunks already acknowledged by the server |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-ASSIGNMENT-VERSION | Assignment Publication Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-ID | Submission Attempt ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-DRAFT-VERSION | Submitted Draft Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-SUBMISSION-VERSION | Submission Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-LATE-FLAG | Late Submission Flag | BOOLEAN | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RESUBMISSION-OF | Resubmission Relationship | ID | required for a resubmission and absent for the first accepted submission；状态=RESUBMITTED；动作=SUB-ACT-RESUBMIT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RECEIPT-ID | Submission Receipt | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | Receipt Issued Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUB-ACT-SAVE-DRAFT | Save Answer Draft | UPDATE | SUB-DRAFT-F-ANSWER-PAYLOAD<br>SUB-DRAFT-F-MEDIA-METADATA<br>SUB-DRAFT-F-PAGE-ITEM-MAPPING | SUB-DRAFT-F-DRAFT-VERSION<br>SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT | DRAFT → DRAFT | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SUB-ACT-UPLOAD-CHUNK | Upload Media Chunk | UPDATE | SUB-DRAFT-F-PENDING-CHUNK | SUB-DRAFT-F-UPLOAD-SESSION-ID<br>SUB-DRAFT-F-SUCCESSFUL-CHUNKS<br>SUB-DRAFT-F-IMAGE-QUALITY<br>SUB-DRAFT-F-DRAFT-VERSION | DRAFT → UPLOADING | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / CHUNK_REJECTED / TRANSIENT_FAILURE / VERSION_CONFLICT |
| SUB-ACT-RETRY-UPLOAD | Retry Failed Media Upload | UPDATE | SUB-DRAFT-F-PENDING-CHUNK | SUB-DRAFT-F-SUCCESSFUL-CHUNKS<br>SUB-DRAFT-F-IMAGE-QUALITY<br>SUB-DRAFT-F-DRAFT-VERSION | UPLOADING → UPLOADING | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / CHUNK_REJECTED / TRANSIENT_FAILURE / VERSION_CONFLICT |
| SUB-ACT-MARK-DRAFT-READY | Mark an Answer Draft Ready to Submit | UPDATE | SUB-DRAFT-F-ANSWER-PAYLOAD | SUB-DRAFT-F-IMAGE-QUALITY<br>SUB-DRAFT-F-DRAFT-VERSION<br>SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT | DRAFT / UPLOADING → READY_TO_SUBMIT | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SUB-ACT-SUBMIT | Submit Assignment Answers | CREATE | SUB-ATTEMPT-F-DRAFT-VERSION | SUB-ATTEMPT-F-ID<br>SUB-ATTEMPT-F-SUBMISSION-VERSION<br>SUB-ATTEMPT-F-LATE-FLAG<br>SUB-ATTEMPT-F-RECEIPT-ID<br>SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | CREATE | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / OFFLINE_FINAL_SUBMISSION_BLOCKED / SERVER_RECEIPT_NOT_ISSUED / VERSION_CONFLICT / AUDIT_FAILED |
| SUB-ACT-RESUBMIT | Resubmit Assignment Answers | UPDATE | SUB-ATTEMPT-F-DRAFT-VERSION<br>SUB-ATTEMPT-F-RESUBMISSION-OF | SUB-ATTEMPT-F-RESUBMISSION-OF<br>SUB-ATTEMPT-F-SUBMISSION-VERSION<br>SUB-ATTEMPT-F-RECEIPT-ID<br>SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | SUBMITTED → RESUBMITTED | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / RESUBMISSION_POLICY_BLOCKED / OFFLINE_FINAL_SUBMISSION_BLOCKED / SERVER_RECEIPT_NOT_ISSUED / VERSION_CONFLICT / AUDIT_FAILED |
| SUB-ACT-VIEW-RECEIPT | View Submission Receipt | READ |  | SUB-ATTEMPT-F-SUBMISSION-VERSION<br>SUB-ATTEMPT-F-LATE-FLAG<br>SUB-ATTEMPT-F-RESUBMISSION-OF<br>SUB-ATTEMPT-F-RECEIPT-ID<br>SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | UNCHANGED | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 本页不登记 Web 入口。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## SUB-PAGE-WEB Web Student Submission Workspace

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | SUB-OBJ-DRAFT / SUB-OBJ-ATTEMPT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-ID | Submission Draft ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-ANSWER-PAYLOAD | Answer Payload by Question Type | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must use the payload schema registered for each assignment item question type |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-MEDIA-METADATA | Media Metadata | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-PAGE-ITEM-MAPPING | Page and Item Mapping | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-IMAGE-QUALITY | Image Quality | STRING | 是 | OPTION_SET: OPT-ENUM-027 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-UPLOAD-SESSION-ID | Upload Session | ID | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-PENDING-CHUNK | Pending Upload Chunk | FILE_REFERENCE | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-SUCCESSFUL-CHUNKS | Successful Upload Chunks | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-DRAFT-VERSION | Draft Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT | Weak Network Recovery Checkpoint | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | may contain only the latest draft and chunks already acknowledged by the server |
| SUB-OBJ-DRAFT | SUB-DRAFT-F-ASSIGNMENT-VERSION | Assignment Publication Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-ID | Submission Attempt ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-DRAFT-VERSION | Submitted Draft Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-SUBMISSION-VERSION | Submission Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-LATE-FLAG | Late Submission Flag | BOOLEAN | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RESUBMISSION-OF | Resubmission Relationship | ID | required for a resubmission and absent for the first accepted submission；状态=RESUBMITTED；动作=SUB-ACT-RESUBMIT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RECEIPT-ID | Submission Receipt | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | Receipt Issued Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUB-ACT-SAVE-DRAFT | Save Answer Draft | UPDATE | SUB-DRAFT-F-ANSWER-PAYLOAD<br>SUB-DRAFT-F-MEDIA-METADATA<br>SUB-DRAFT-F-PAGE-ITEM-MAPPING | SUB-DRAFT-F-DRAFT-VERSION<br>SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT | DRAFT → DRAFT | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SUB-ACT-MARK-DRAFT-READY | Mark an Answer Draft Ready to Submit | UPDATE | SUB-DRAFT-F-ANSWER-PAYLOAD | SUB-DRAFT-F-IMAGE-QUALITY<br>SUB-DRAFT-F-DRAFT-VERSION<br>SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT | DRAFT / UPLOADING → READY_TO_SUBMIT | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SUB-ACT-SUBMIT | Submit Assignment Answers | CREATE | SUB-ATTEMPT-F-DRAFT-VERSION | SUB-ATTEMPT-F-ID<br>SUB-ATTEMPT-F-SUBMISSION-VERSION<br>SUB-ATTEMPT-F-LATE-FLAG<br>SUB-ATTEMPT-F-RECEIPT-ID<br>SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | CREATE | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / OFFLINE_FINAL_SUBMISSION_BLOCKED / SERVER_RECEIPT_NOT_ISSUED / VERSION_CONFLICT / AUDIT_FAILED |
| SUB-ACT-RESUBMIT | Resubmit Assignment Answers | UPDATE | SUB-ATTEMPT-F-DRAFT-VERSION<br>SUB-ATTEMPT-F-RESUBMISSION-OF | SUB-ATTEMPT-F-RESUBMISSION-OF<br>SUB-ATTEMPT-F-SUBMISSION-VERSION<br>SUB-ATTEMPT-F-RECEIPT-ID<br>SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | SUBMITTED → RESUBMITTED | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / RESUBMISSION_POLICY_BLOCKED / OFFLINE_FINAL_SUBMISSION_BLOCKED / SERVER_RECEIPT_NOT_ISSUED / VERSION_CONFLICT / AUDIT_FAILED |
| SUB-ACT-VIEW-RECEIPT | View Submission Receipt | READ |  | SUB-ATTEMPT-F-SUBMISSION-VERSION<br>SUB-ATTEMPT-F-LATE-FLAG<br>SUB-ATTEMPT-F-RESUBMISSION-OF<br>SUB-ATTEMPT-F-RECEIPT-ID<br>SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | UNCHANGED | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |
