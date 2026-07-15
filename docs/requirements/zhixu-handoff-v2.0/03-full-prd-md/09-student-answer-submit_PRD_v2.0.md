# SUB-001 Student Answering and Submission PRD v2.0

| 属性 | 值 |
| --- | --- |
| 阶段 | 1 |
| 优先级 | P0 |
| 目标 | Preserve answer drafts and uploaded chunks while requiring a server receipt for final submission |
| 基线决策 | `BASE-003`、`BASE-004`、`BASE-005` |
| NFR | `NFR-001`、`NFR-003`、`NFR-004`、`NFR-005`、`NFR-008` |
| 进入条件 | the student can open a published assignment in the assigned class scope |
| 退出条件 | the submitted or resubmitted version has an immutable server receipt |

## 1. 范围与事实边界

- 本模块权威拥有 2 个对象、8 个动作。
- 模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。
- 页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。
- AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。

## 2. 权威对象与字段合同

### SUB-OBJ-DRAFT Student Answer Draft

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STUDENT_WORK | SCHOOL | ROLE-STUDENT | ROLE-STUDENT | SYSTEM | DUTY-SUBJECT-TEACHER | LIFE-003 | S3 | NO_DIRECT_READ | DRAFT / UPLOADING / READY_TO_SUBMIT |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUB-DRAFT-F-ID | Submission Draft ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-DRAFT-F-ANSWER-PAYLOAD | Answer Payload by Question Type | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must use the payload schema registered for each assignment item question type | retain accepted values with source and version metadata |
| SUB-DRAFT-F-MEDIA-METADATA | Media Metadata | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-DRAFT-F-PAGE-ITEM-MAPPING | Page and Item Mapping | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-DRAFT-F-IMAGE-QUALITY | Image Quality | STRING | 是 | OPTION_SET: OPT-ENUM-027 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-DRAFT-F-UPLOAD-SESSION-ID | Upload Session | ID | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-DRAFT-F-PENDING-CHUNK | Pending Upload Chunk | FILE_REFERENCE | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain only until the chunk is accepted or the upload session expires |
| SUB-DRAFT-F-SUCCESSFUL-CHUNKS | Successful Upload Chunks | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-DRAFT-F-DRAFT-VERSION | Draft Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT | Weak Network Recovery Checkpoint | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | may contain only the latest draft and chunks already acknowledged by the server | retain accepted values with source and version metadata |
| SUB-DRAFT-F-ASSIGNMENT-VERSION | Assignment Publication Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### SUB-OBJ-ATTEMPT Submission Attempt Version

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STUDENT_WORK | SCHOOL | ROLE-STUDENT | ROLE-STUDENT | SYSTEM | DUTY-SUBJECT-TEACHER | LIFE-003 | S3 | AUTHORIZED | SUBMITTED / RESUBMITTED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUB-ATTEMPT-F-ID | Submission Attempt ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-ATTEMPT-F-DRAFT-VERSION | Submitted Draft Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-ATTEMPT-F-SUBMISSION-VERSION | Submission Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-ATTEMPT-F-LATE-FLAG | Late Submission Flag | BOOLEAN | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-ATTEMPT-F-RESUBMISSION-OF | Resubmission Relationship | ID | required for a resubmission and absent for the first accepted submission；状态=RESUBMITTED；动作=SUB-ACT-RESUBMIT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-ATTEMPT-F-RECEIPT-ID | Submission Receipt | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | Receipt Issued Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

## 3. 对象关系

| Relationship ID | 源对象 | 关系 | 目标对象 | 基数 | 所有权范围 | 源失效处理 |
| --- | --- | --- | --- | --- | --- | --- |
| SUB-REL-ATTEMPT-DRAFT | SUB-OBJ-ATTEMPT | DERIVED_FROM | SUB-OBJ-DRAFT | MANY_TO_ONE | SAME_STUDENT | retain accepted submission versions and receipts; invalidate only unsubmitted draft derivations |

## 4. 可执行动作合同

| Action ID | 动作 | 目标对象 | 操作 | 访问例外 | 输入 Field | 输出 Field | 状态效果 | ALLOW / DENY | 端 / 执行模式 | 风险 | 审计 | 幂等键 | 失败结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUB-ACT-SAVE-DRAFT | Save Answer Draft | SUB-OBJ-DRAFT | UPDATE | — | SUB-DRAFT-F-ANSWER-PAYLOAD<br>SUB-DRAFT-F-MEDIA-METADATA<br>SUB-DRAFT-F-PAGE-ITEM-MAPPING | SUB-DRAFT-F-DRAFT-VERSION<br>SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT | DRAFT → DRAFT | ALLOW:ROLE-STUDENT — the student owns the draft and belongs to the assignment class scope<br>DENY:ROLE-TEACHER — a teacher attempts to create or submit student work on the student's behalf<br>DENY:ROLE-SCHOOL-ADMIN — school administration has no default access to student answer content<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student answer content | WEB / APP | LOW | REQUIRED | SUB-ACT-SAVE-DRAFT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SUB-ACT-UPLOAD-CHUNK | Upload Media Chunk | SUB-OBJ-DRAFT | UPDATE | — | SUB-DRAFT-F-PENDING-CHUNK | SUB-DRAFT-F-UPLOAD-SESSION-ID<br>SUB-DRAFT-F-SUCCESSFUL-CHUNKS<br>SUB-DRAFT-F-IMAGE-QUALITY<br>SUB-DRAFT-F-DRAFT-VERSION | DRAFT → UPLOADING | ALLOW:ROLE-STUDENT — the student owns the draft and belongs to the assignment class scope<br>DENY:ROLE-TEACHER — a teacher attempts to create or submit student work on the student's behalf<br>DENY:ROLE-SCHOOL-ADMIN — school administration has no default access to student answer content<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student answer content | APP | LOW | REQUIRED | SUB-ACT-UPLOAD-CHUNK:school:object:source-version:request-id | PERMISSION_DENIED / CHUNK_REJECTED / TRANSIENT_FAILURE / VERSION_CONFLICT |
| SUB-ACT-RETRY-UPLOAD | Retry Failed Media Upload | SUB-OBJ-DRAFT | UPDATE | — | SUB-DRAFT-F-PENDING-CHUNK | SUB-DRAFT-F-SUCCESSFUL-CHUNKS<br>SUB-DRAFT-F-IMAGE-QUALITY<br>SUB-DRAFT-F-DRAFT-VERSION | UPLOADING → UPLOADING | ALLOW:ROLE-STUDENT — the student owns the draft and belongs to the assignment class scope<br>DENY:ROLE-TEACHER — a teacher attempts to create or submit student work on the student's behalf<br>DENY:ROLE-SCHOOL-ADMIN — school administration has no default access to student answer content<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student answer content | APP | LOW | REQUIRED | SUB-ACT-RETRY-UPLOAD:school:object:source-version:request-id | PERMISSION_DENIED / CHUNK_REJECTED / TRANSIENT_FAILURE / VERSION_CONFLICT |
| SUB-ACT-MARK-DRAFT-READY | Mark an Answer Draft Ready to Submit | SUB-OBJ-DRAFT | UPDATE | — | SUB-DRAFT-F-ANSWER-PAYLOAD | SUB-DRAFT-F-IMAGE-QUALITY<br>SUB-DRAFT-F-DRAFT-VERSION<br>SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT | DRAFT / UPLOADING → READY_TO_SUBMIT | ALLOW:ROLE-STUDENT — the student owns the draft and belongs to the assignment class scope<br>DENY:ROLE-TEACHER — a teacher attempts to create or submit student work on the student's behalf<br>DENY:ROLE-SCHOOL-ADMIN — school administration has no default access to student answer content<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student answer content | WEB / APP | LOW | REQUIRED | SUB-ACT-MARK-DRAFT-READY:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SUB-ACT-SUBMIT | Submit Assignment Answers | SUB-OBJ-ATTEMPT | CREATE | — | SUB-ATTEMPT-F-DRAFT-VERSION | SUB-ATTEMPT-F-ID<br>SUB-ATTEMPT-F-SUBMISSION-VERSION<br>SUB-ATTEMPT-F-LATE-FLAG<br>SUB-ATTEMPT-F-RECEIPT-ID<br>SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | CREATE（成功状态由 SUB-ACT-SUBMIT-SCN-SUCCESS 定义） | ALLOW:ROLE-STUDENT — the student owns the draft and belongs to the assignment class scope<br>DENY:ROLE-TEACHER — a teacher attempts to create or submit student work on the student's behalf<br>DENY:ROLE-SCHOOL-ADMIN — school administration has no default access to student answer content<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student answer content | WEB / APP | HIGH | REQUIRED | SUB-ACT-SUBMIT:school:student:assignment-version:draft-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / OFFLINE_FINAL_SUBMISSION_BLOCKED / SERVER_RECEIPT_NOT_ISSUED / VERSION_CONFLICT / AUDIT_FAILED |
| SUB-ACT-RESUBMIT | Resubmit Assignment Answers | SUB-OBJ-ATTEMPT | UPDATE | — | SUB-ATTEMPT-F-DRAFT-VERSION<br>SUB-ATTEMPT-F-RESUBMISSION-OF | SUB-ATTEMPT-F-RESUBMISSION-OF<br>SUB-ATTEMPT-F-SUBMISSION-VERSION<br>SUB-ATTEMPT-F-RECEIPT-ID<br>SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | SUBMITTED → RESUBMITTED | ALLOW:ROLE-STUDENT — the student owns the draft and belongs to the assignment class scope<br>DENY:ROLE-TEACHER — a teacher attempts to create or submit student work on the student's behalf<br>DENY:ROLE-SCHOOL-ADMIN — school administration has no default access to student answer content<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student answer content | WEB / APP | HIGH | REQUIRED | SUB-ACT-RESUBMIT:school:object:source-version:request-id | PERMISSION_DENIED / RESUBMISSION_POLICY_BLOCKED / OFFLINE_FINAL_SUBMISSION_BLOCKED / SERVER_RECEIPT_NOT_ISSUED / VERSION_CONFLICT / AUDIT_FAILED |
| SUB-ACT-VIEW-RECEIPT | View Submission Receipt | SUB-OBJ-ATTEMPT | READ | — |  | SUB-ATTEMPT-F-SUBMISSION-VERSION<br>SUB-ATTEMPT-F-LATE-FLAG<br>SUB-ATTEMPT-F-RESUBMISSION-OF<br>SUB-ATTEMPT-F-RECEIPT-ID<br>SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | UNCHANGED | ALLOW:ROLE-STUDENT — the student owns the draft and belongs to the assignment class scope<br>DENY:ROLE-TEACHER — a teacher attempts to create or submit student work on the student's behalf<br>DENY:ROLE-SCHOOL-ADMIN — school administration has no default access to student answer content<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student answer content | WEB / APP | READ | NOT_REQUIRED | — | PERMISSION_DENIED / NOT_FOUND |
| SUB-ACT-HANDOFF-ACCEPTED | Handoff Accepted Submission Version | SUB-OBJ-ATTEMPT | READ | — |  | SUB-ATTEMPT-F-SUBMISSION-VERSION<br>SUB-ATTEMPT-F-RECEIPT-ID | UNCHANGED | ALLOW:SYSTEM — DF-006 reads an accepted submission carrying a server receipt<br>DENY:CURRENT_ACTOR — users cannot invoke the internal accepted-submission handoff | FLOW_INTERNAL | READ | NOT_REQUIRED | — | PERMISSION_DENIED / NOT_FOUND |

## 6. 状态可达性

| Object ID | 状态 | 进入动作 | 离开动作 |
| --- | --- | --- | --- |
| SUB-OBJ-DRAFT | DRAFT | SUB-ACT-SAVE-DRAFT | SUB-ACT-SAVE-DRAFT<br>SUB-ACT-UPLOAD-CHUNK<br>SUB-ACT-MARK-DRAFT-READY |
| SUB-OBJ-DRAFT | UPLOADING | SUB-ACT-UPLOAD-CHUNK<br>SUB-ACT-RETRY-UPLOAD | SUB-ACT-RETRY-UPLOAD<br>SUB-ACT-MARK-DRAFT-READY |
| SUB-OBJ-DRAFT | READY_TO_SUBMIT | SUB-ACT-MARK-DRAFT-READY |  |
| SUB-OBJ-ATTEMPT | SUBMITTED | SUB-ACT-SUBMIT | SUB-ACT-RESUBMIT |
| SUB-OBJ-ATTEMPT | RESUBMITTED | SUB-ACT-RESUBMIT |  |

## 7. 参与数据流

| Flow ID | 数据流 | 阶段 | 参与模块 | 本模块动作 | 失败与补偿 |
| --- | --- | --- | --- | --- | --- |
| DF-005 | Published Assignment Student Submission | 1 | HW-001 / SUB-001 | SUB-ACT-SAVE-DRAFT<br>SUB-ACT-UPLOAD-CHUNK<br>SUB-ACT-RETRY-UPLOAD<br>SUB-ACT-SUBMIT | STUDENT_SUBMISSION_OBJECT_AND_MEDIA_CHUNK；{"strategy":"RETRY_FAILED_CHUNKS_OR_UNRECEIPTED_SUBMISSION","maxAttempts":5,"retryableFailureResults":["TRANSIENT_FAILURE","CHUNK_REJECTED","SERVER_RECEIPT_NOT_ISSUED"]}；{"strategy":"PRESERVE_DRAFT_AND_ACCEPTED_CHUNKS","description":"never roll back accepted chunks and never create a final submission without a server receipt"}；{"strategy":"INVALIDATE_STALE_SUBMISSION_DERIVATIONS","targets":["submission status","grading queue eligibility","late and resubmission projections"]} |
| DF-006 | Submission Grading Routing | 1 | HW-001 / SUB-001 / GRD-001 | SUB-ACT-HANDOFF-ACCEPTED | SUBMISSION_ITEM_OBJECT_WITH_INDEPENDENT_MANUAL_ROUTE；{"strategy":"RETRY_QUEUE_AND_PROCESSING_WITH_MANUAL_CUTOFF","maxAttempts":3,"retryableFailureResults":["AI_UNAVAILABLE","VERSION_CONFLICT"]}；{"strategy":"ROUTE_MANUAL_WITHOUT_ROLLING_BACK_SUBMISSION","description":"an AI failure preserves the accepted submission and creates or keeps a manual grading route"}；{"strategy":"INVALIDATE_STALE_GRADING_QUEUE_VIEWS","targets":["subject teacher grading queue","AI suggestion preview","batch confirmation eligibility"]} |

## 8. 页面任务合同

| Page ID | 页面 | 端 | 对象 | 字段 | 动作 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SUB-PAGE-APP | App Student Submission Workspace | APP | SUB-OBJ-DRAFT<br>SUB-OBJ-ATTEMPT | SUB-DRAFT-F-ID<br>SUB-DRAFT-F-ANSWER-PAYLOAD<br>SUB-DRAFT-F-MEDIA-METADATA<br>SUB-DRAFT-F-PAGE-ITEM-MAPPING<br>SUB-DRAFT-F-IMAGE-QUALITY<br>SUB-DRAFT-F-UPLOAD-SESSION-ID<br>SUB-DRAFT-F-PENDING-CHUNK<br>SUB-DRAFT-F-SUCCESSFUL-CHUNKS<br>SUB-DRAFT-F-DRAFT-VERSION<br>SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT<br>SUB-DRAFT-F-ASSIGNMENT-VERSION<br>SUB-ATTEMPT-F-ID<br>SUB-ATTEMPT-F-DRAFT-VERSION<br>SUB-ATTEMPT-F-SUBMISSION-VERSION<br>SUB-ATTEMPT-F-LATE-FLAG<br>SUB-ATTEMPT-F-RESUBMISSION-OF<br>SUB-ATTEMPT-F-RECEIPT-ID<br>SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | SUB-ACT-SAVE-DRAFT<br>SUB-ACT-UPLOAD-CHUNK<br>SUB-ACT-RETRY-UPLOAD<br>SUB-ACT-MARK-DRAFT-READY<br>SUB-ACT-SUBMIT<br>SUB-ACT-RESUBMIT<br>SUB-ACT-VIEW-RECEIPT | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| SUB-PAGE-WEB | Web Student Submission Workspace | WEB | SUB-OBJ-DRAFT<br>SUB-OBJ-ATTEMPT | SUB-DRAFT-F-ID<br>SUB-DRAFT-F-ANSWER-PAYLOAD<br>SUB-DRAFT-F-MEDIA-METADATA<br>SUB-DRAFT-F-PAGE-ITEM-MAPPING<br>SUB-DRAFT-F-IMAGE-QUALITY<br>SUB-DRAFT-F-UPLOAD-SESSION-ID<br>SUB-DRAFT-F-PENDING-CHUNK<br>SUB-DRAFT-F-SUCCESSFUL-CHUNKS<br>SUB-DRAFT-F-DRAFT-VERSION<br>SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT<br>SUB-DRAFT-F-ASSIGNMENT-VERSION<br>SUB-ATTEMPT-F-ID<br>SUB-ATTEMPT-F-DRAFT-VERSION<br>SUB-ATTEMPT-F-SUBMISSION-VERSION<br>SUB-ATTEMPT-F-LATE-FLAG<br>SUB-ATTEMPT-F-RESUBMISSION-OF<br>SUB-ATTEMPT-F-RECEIPT-ID<br>SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | SUB-ACT-SAVE-DRAFT<br>SUB-ACT-MARK-DRAFT-READY<br>SUB-ACT-SUBMIT<br>SUB-ACT-RESUBMIT<br>SUB-ACT-VIEW-RECEIPT | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |

## 9. 验收场景

| Scenario ID | 类型 | Action ID | Given | When | Expected Data | Expected State | Permission | 失败码 / 谓词 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUB-ACT-SAVE-DRAFT-SCN-SUCCESS | SUCCESS | SUB-ACT-SAVE-DRAFT | the actor meets the entry conditions for Save Answer Draft | the actor requests Save Answer Draft | stores the versioned answer draft without claiming final submission | DRAFT | ALLOW |  |
| SUB-ACT-SAVE-DRAFT-SCN-PERMISSION_DENIED | FAILURE | SUB-ACT-SAVE-DRAFT | PERMISSION_DENIED applies to Save Answer Draft | the actor requests Save Answer Draft | Save Answer Draft returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| SUB-ACT-SAVE-DRAFT-SCN-VALIDATION_FAILED | FAILURE | SUB-ACT-SAVE-DRAFT | VALIDATION_FAILED applies to Save Answer Draft | the actor requests Save Answer Draft | Save Answer Draft returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| SUB-ACT-SAVE-DRAFT-SCN-VERSION_CONFLICT | FAILURE | SUB-ACT-SAVE-DRAFT | VERSION_CONFLICT applies to Save Answer Draft | the actor requests Save Answer Draft | Save Answer Draft returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| SUB-ACT-UPLOAD-CHUNK-SCN-SUCCESS | SUCCESS | SUB-ACT-UPLOAD-CHUNK | the actor meets the entry conditions for Upload Media Chunk | the actor requests Upload Media Chunk | Upload Media Chunk returns the accepted versioned result | UPLOADING | ALLOW |  |
| SUB-ACT-UPLOAD-CHUNK-SCN-PERMISSION_DENIED | FAILURE | SUB-ACT-UPLOAD-CHUNK | PERMISSION_DENIED applies to Upload Media Chunk | the actor requests Upload Media Chunk | Upload Media Chunk returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| SUB-ACT-UPLOAD-CHUNK-SCN-CHUNK_REJECTED | FAILURE | SUB-ACT-UPLOAD-CHUNK | CHUNK_REJECTED applies to Upload Media Chunk | the actor requests Upload Media Chunk | Upload Media Chunk returns CHUNK_REJECTED without hidden writes | UNCHANGED | DENY | CHUNK_REJECTED |
| SUB-ACT-UPLOAD-CHUNK-SCN-TRANSIENT_FAILURE | FAILURE | SUB-ACT-UPLOAD-CHUNK | TRANSIENT_FAILURE applies to Upload Media Chunk | the actor requests Upload Media Chunk | Upload Media Chunk returns TRANSIENT_FAILURE without hidden writes | UNCHANGED | DENY | TRANSIENT_FAILURE |
| SUB-ACT-UPLOAD-CHUNK-SCN-VERSION_CONFLICT | FAILURE | SUB-ACT-UPLOAD-CHUNK | VERSION_CONFLICT applies to Upload Media Chunk | the actor requests Upload Media Chunk | Upload Media Chunk returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| SUB-ACT-RETRY-UPLOAD-SCN-SUCCESS | SUCCESS | SUB-ACT-RETRY-UPLOAD | the actor meets the entry conditions for Retry Failed Media Upload | the actor requests Retry Failed Media Upload | Retry Failed Media Upload returns the accepted versioned result | UPLOADING | ALLOW |  |
| SUB-ACT-RETRY-UPLOAD-SCN-PERMISSION_DENIED | FAILURE | SUB-ACT-RETRY-UPLOAD | PERMISSION_DENIED applies to Retry Failed Media Upload | the actor requests Retry Failed Media Upload | Retry Failed Media Upload returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| SUB-ACT-RETRY-UPLOAD-SCN-CHUNK_REJECTED | FAILURE | SUB-ACT-RETRY-UPLOAD | CHUNK_REJECTED applies to Retry Failed Media Upload | the actor requests Retry Failed Media Upload | Retry Failed Media Upload returns CHUNK_REJECTED without hidden writes | UNCHANGED | DENY | CHUNK_REJECTED |
| SUB-ACT-RETRY-UPLOAD-SCN-TRANSIENT_FAILURE | FAILURE | SUB-ACT-RETRY-UPLOAD | TRANSIENT_FAILURE applies to Retry Failed Media Upload | the actor requests Retry Failed Media Upload | Retry Failed Media Upload returns TRANSIENT_FAILURE without hidden writes | UNCHANGED | DENY | TRANSIENT_FAILURE |
| SUB-ACT-RETRY-UPLOAD-SCN-VERSION_CONFLICT | FAILURE | SUB-ACT-RETRY-UPLOAD | VERSION_CONFLICT applies to Retry Failed Media Upload | the actor requests Retry Failed Media Upload | Retry Failed Media Upload returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| SUB-ACT-MARK-DRAFT-READY-SCN-SUCCESS | SUCCESS | SUB-ACT-MARK-DRAFT-READY | the actor meets the entry conditions for Mark an Answer Draft Ready to Submit | the actor requests Mark an Answer Draft Ready to Submit | records that required answer payload and acknowledged media chunks are ready for final submission | READY_TO_SUBMIT | ALLOW |  |
| SUB-ACT-MARK-DRAFT-READY-SCN-PERMISSION_DENIED | FAILURE | SUB-ACT-MARK-DRAFT-READY | PERMISSION_DENIED applies to Mark an Answer Draft Ready to Submit | the actor requests Mark an Answer Draft Ready to Submit | Mark an Answer Draft Ready to Submit returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| SUB-ACT-MARK-DRAFT-READY-SCN-VALIDATION_FAILED | FAILURE | SUB-ACT-MARK-DRAFT-READY | VALIDATION_FAILED applies to Mark an Answer Draft Ready to Submit | the actor requests Mark an Answer Draft Ready to Submit | Mark an Answer Draft Ready to Submit returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| SUB-ACT-MARK-DRAFT-READY-SCN-VERSION_CONFLICT | FAILURE | SUB-ACT-MARK-DRAFT-READY | VERSION_CONFLICT applies to Mark an Answer Draft Ready to Submit | the actor requests Mark an Answer Draft Ready to Submit | Mark an Answer Draft Ready to Submit returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| SUB-ACT-SUBMIT-SCN-SUCCESS | SUCCESS | SUB-ACT-SUBMIT | the actor meets the entry conditions for Submit Assignment Answers | the actor requests Submit Assignment Answers | accepts the immutable submission version only after issuing a server receipt | SUBMITTED | ALLOW |  |
| SUB-ACT-SUBMIT-SCN-PERMISSION_DENIED | FAILURE | SUB-ACT-SUBMIT | PERMISSION_DENIED applies to Submit Assignment Answers | the actor requests Submit Assignment Answers | Submit Assignment Answers returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| SUB-ACT-SUBMIT-SCN-VALIDATION_FAILED | FAILURE | SUB-ACT-SUBMIT | VALIDATION_FAILED applies to Submit Assignment Answers | the actor requests Submit Assignment Answers | Submit Assignment Answers returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| SUB-ACT-SUBMIT-SCN-OFFLINE_FINAL_SUBMISSION_BLOCKED | BOUNDARY | SUB-ACT-SUBMIT | OFFLINE_FINAL_SUBMISSION_BLOCKED applies to Submit Assignment Answers | the actor requests Submit Assignment Answers | retains the latest draft and successful chunks but never claims final submission without a server receipt | UNCHANGED | DENY | OFFLINE_FINAL_SUBMISSION_BLOCKED |
| SUB-ACT-SUBMIT-SCN-SERVER_RECEIPT_NOT_ISSUED | FAILURE | SUB-ACT-SUBMIT | SERVER_RECEIPT_NOT_ISSUED applies to Submit Assignment Answers | the actor requests Submit Assignment Answers | Submit Assignment Answers returns SERVER_RECEIPT_NOT_ISSUED without hidden writes | UNCHANGED | DENY | SERVER_RECEIPT_NOT_ISSUED |
| SUB-ACT-SUBMIT-SCN-VERSION_CONFLICT | FAILURE | SUB-ACT-SUBMIT | VERSION_CONFLICT applies to Submit Assignment Answers | the actor requests Submit Assignment Answers | Submit Assignment Answers returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| SUB-ACT-SUBMIT-SCN-AUDIT_FAILED | FAILURE | SUB-ACT-SUBMIT | AUDIT_FAILED applies to Submit Assignment Answers | the actor requests Submit Assignment Answers | Submit Assignment Answers returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| SUB-ACT-RESUBMIT-SCN-SUCCESS | SUCCESS | SUB-ACT-RESUBMIT | the actor meets the entry conditions for Resubmit Assignment Answers | the actor requests Resubmit Assignment Answers | creates a new immutable submission linked to the prior submission and issues a new server receipt | RESUBMITTED | ALLOW |  |
| SUB-ACT-RESUBMIT-SCN-PERMISSION_DENIED | FAILURE | SUB-ACT-RESUBMIT | PERMISSION_DENIED applies to Resubmit Assignment Answers | the actor requests Resubmit Assignment Answers | Resubmit Assignment Answers returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| SUB-ACT-RESUBMIT-SCN-RESUBMISSION_POLICY_BLOCKED | FAILURE | SUB-ACT-RESUBMIT | RESUBMISSION_POLICY_BLOCKED applies to Resubmit Assignment Answers | the actor requests Resubmit Assignment Answers | Resubmit Assignment Answers returns RESUBMISSION_POLICY_BLOCKED without hidden writes | UNCHANGED | DENY | RESUBMISSION_POLICY_BLOCKED |
| SUB-ACT-RESUBMIT-SCN-OFFLINE_FINAL_SUBMISSION_BLOCKED | BOUNDARY | SUB-ACT-RESUBMIT | OFFLINE_FINAL_SUBMISSION_BLOCKED applies to Resubmit Assignment Answers | the actor requests Resubmit Assignment Answers | retains the latest draft and successful chunks but never creates a resubmission without a server receipt | UNCHANGED | DENY | OFFLINE_FINAL_SUBMISSION_BLOCKED |
| SUB-ACT-RESUBMIT-SCN-SERVER_RECEIPT_NOT_ISSUED | FAILURE | SUB-ACT-RESUBMIT | SERVER_RECEIPT_NOT_ISSUED applies to Resubmit Assignment Answers | the actor requests Resubmit Assignment Answers | Resubmit Assignment Answers returns SERVER_RECEIPT_NOT_ISSUED without hidden writes | UNCHANGED | DENY | SERVER_RECEIPT_NOT_ISSUED |
| SUB-ACT-RESUBMIT-SCN-VERSION_CONFLICT | FAILURE | SUB-ACT-RESUBMIT | VERSION_CONFLICT applies to Resubmit Assignment Answers | the actor requests Resubmit Assignment Answers | Resubmit Assignment Answers returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| SUB-ACT-RESUBMIT-SCN-AUDIT_FAILED | FAILURE | SUB-ACT-RESUBMIT | AUDIT_FAILED applies to Resubmit Assignment Answers | the actor requests Resubmit Assignment Answers | Resubmit Assignment Answers returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| SUB-ACT-VIEW-RECEIPT-SCN-SUCCESS | SUCCESS | SUB-ACT-VIEW-RECEIPT | the actor meets the entry conditions for View Submission Receipt | the actor requests View Submission Receipt | returns the server-issued receipt for the student's accepted submission version | UNCHANGED | ALLOW |  |
| SUB-ACT-VIEW-RECEIPT-SCN-PERMISSION_DENIED | FAILURE | SUB-ACT-VIEW-RECEIPT | PERMISSION_DENIED applies to View Submission Receipt | the actor requests View Submission Receipt | View Submission Receipt returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| SUB-ACT-VIEW-RECEIPT-SCN-NOT_FOUND | FAILURE | SUB-ACT-VIEW-RECEIPT | NOT_FOUND applies to View Submission Receipt | the actor requests View Submission Receipt | View Submission Receipt returns NOT_FOUND without hidden writes | UNCHANGED | DENY | NOT_FOUND |
| SUB-ACT-HANDOFF-ACCEPTED-SCN-SUCCESS | SUCCESS | SUB-ACT-HANDOFF-ACCEPTED | the actor meets the entry conditions for Handoff Accepted Submission Version | the actor requests Handoff Accepted Submission Version | returns only the immutable accepted submission version and server receipt | UNCHANGED | ALLOW |  |
| SUB-ACT-HANDOFF-ACCEPTED-SCN-PERMISSION_DENIED | FAILURE | SUB-ACT-HANDOFF-ACCEPTED | PERMISSION_DENIED applies to Handoff Accepted Submission Version | the actor requests Handoff Accepted Submission Version | Handoff Accepted Submission Version returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| SUB-ACT-HANDOFF-ACCEPTED-SCN-NOT_FOUND | FAILURE | SUB-ACT-HANDOFF-ACCEPTED | NOT_FOUND applies to Handoff Accepted Submission Version | the actor requests Handoff Accepted Submission Version | Handoff Accepted Submission Version returns NOT_FOUND without hidden writes | UNCHANGED | DENY | NOT_FOUND |

## 10. AI 任务映射

| Task ID | 任务 | 类型 | 目标 Action | 受众 | 确认者 | 预览字段 | 失败行为 |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 11. 研发与测试就绪门禁

- 实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。
- 所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。
- 每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。
- 每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。
- Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。
