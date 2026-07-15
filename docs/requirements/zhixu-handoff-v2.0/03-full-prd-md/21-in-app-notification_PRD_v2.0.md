# NOTI-001 In-product Notification Delivery PRD v2.0

| 属性 | 值 |
| --- | --- |
| 阶段 | 1 |
| 优先级 | P0 |
| 目标 | Deliver authorized product summaries and deep links without rolling back accepted source business facts |
| 基线决策 | `BASE-003`、`BASE-008`、`BASE-010` |
| NFR | `NFR-002`、`NFR-008` |
| 进入条件 | an authorized source event or reminder request identifies recipients |
| 退出条件 | the in-product notification is queued with independent delivery state |

## 1. 范围与事实边界

- 本模块权威拥有 1 个对象、7 个动作。
- 模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。
- 页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。
- AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。

## 2. 权威对象与字段合同

### NOTI-OBJ-NOTIFICATION In-product Notification

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUBJECT_TEACHING_TASK | SCHOOL | CURRENT_ACTOR | DUTY-SUBJECT-TEACHER | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LIFE-003 | S3 | NO_DIRECT_READ | QUEUED / DELIVERED / READ / HANDLED / FAILED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOTI-NOTIFICATION-F-ID | Notification ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| NOTI-NOTIFICATION-F-SOURCE-EVENT | Notification Source Event | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| NOTI-NOTIFICATION-F-RECIPIENT | Notification Recipient | ID | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE | Summary Template | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| NOTI-NOTIFICATION-F-DEEP-LINK | Authorized Product Deep Link | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| NOTI-NOTIFICATION-F-CHANNEL | Notification Channel | STRING | 是 | OPTION_SET: OPT-ENUM-047 | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| NOTI-NOTIFICATION-F-DELIVERED-AT | Delivered At | DATETIME | required only when NOTI-ACT-DELIVER succeeds；状态=DELIVERED；动作=NOTI-ACT-DELIVER | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| NOTI-NOTIFICATION-F-READ-AT | Read At | DATETIME | required only when NOTI-ACT-MARK-READ succeeds；状态=READ；动作=NOTI-ACT-MARK-READ | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| NOTI-NOTIFICATION-F-HANDLED-AT | Handled At | DATETIME | required only when NOTI-ACT-MARK-HANDLED succeeds；状态=HANDLED；动作=NOTI-ACT-MARK-HANDLED | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| NOTI-NOTIFICATION-F-FAILURE-CODE | Delivery Failure Code | STRING | required only when NOTI-ACT-FAIL-DELIVERY succeeds；状态=FAILED；动作=NOTI-ACT-FAIL-DELIVERY | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| NOTI-NOTIFICATION-F-RETRY-COUNT | Delivery Retry Count | INTEGER | required when notification creation initializes or retry increments the counter；状态=QUEUED；动作=NOTI-ACT-CREATE-REMINDER/NOTI-ACT-CREATE-REPORT-NOTIFICATION/NOTI-ACT-RETRY-DELIVERY | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| NOTI-NOTIFICATION-F-VERSION | Notification Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

## 3. 对象关系

| Relationship ID | 源对象 | 关系 | 目标对象 | 基数 | 所有权范围 | 源失效处理 |
| --- | --- | --- | --- | --- | --- | --- |

## 4. 可执行动作合同

| Action ID | 动作 | 目标对象 | 操作 | 输入 Field | 输出 Field | 状态效果 | ALLOW / DENY | 端 / 执行模式 | 风险 | 审计 | 幂等键 | 失败结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOTI-ACT-CREATE-REMINDER | Create an In-product Learning Reminder | NOTI-OBJ-NOTIFICATION | CREATE | NOTI-NOTIFICATION-F-SOURCE-EVENT<br>NOTI-NOTIFICATION-F-RECIPIENT<br>NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE<br>NOTI-NOTIFICATION-F-DEEP-LINK | NOTI-NOTIFICATION-F-ID<br>NOTI-NOTIFICATION-F-CHANNEL<br>NOTI-NOTIFICATION-F-RETRY-COUNT<br>NOTI-NOTIFICATION-F-VERSION | CREATE（成功状态由 NOTI-ACT-CREATE-REMINDER-SCN-SUCCESS 定义） | ALLOW:DUTY-SUBJECT-TEACHER — the corresponding subject teacher acts inside assigned subject, class, and student scope<br>DENY:ROLE-STUDENT — a student attempts to create or manage a teacher-owned definition or reminder<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student learning detail | WEB / APP | LOW | REQUIRED | NOTI-ACT-CREATE-REMINDER:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| NOTI-ACT-CREATE-REPORT-NOTIFICATION | Create an In-product Report Notification | NOTI-OBJ-NOTIFICATION | CREATE |  | NOTI-NOTIFICATION-F-ID<br>NOTI-NOTIFICATION-F-SOURCE-EVENT<br>NOTI-NOTIFICATION-F-RECIPIENT<br>NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE<br>NOTI-NOTIFICATION-F-DEEP-LINK<br>NOTI-NOTIFICATION-F-CHANNEL<br>NOTI-NOTIFICATION-F-RETRY-COUNT<br>NOTI-NOTIFICATION-F-VERSION | CREATE（成功状态由 NOTI-ACT-CREATE-REPORT-NOTIFICATION-SCN-SUCCESS 定义） | ALLOW:SYSTEM — the verified report Flow writes only authorized source-pinned report records<br>DENY:CURRENT_ACTOR — a user cannot invoke an internal report materialization action directly | FLOW_INTERNAL | LOW | REQUIRED | NOTI-ACT-CREATE-REPORT-NOTIFICATION:school:object:source-version:request-id | PERMISSION_DENIED / DELIVERY_FAILED / VERSION_CONFLICT |
| NOTI-ACT-DELIVER | Record an In-product Notification Delivery | NOTI-OBJ-NOTIFICATION | UPDATE |  | NOTI-NOTIFICATION-F-DELIVERED-AT<br>NOTI-NOTIFICATION-F-VERSION | QUEUED → DELIVERED | ALLOW:SYSTEM — the verified delivery event updates only the target notification<br>DENY:CURRENT_ACTOR — a user cannot invoke notification delivery state changes directly | SYSTEM_EVENT | LOW | REQUIRED | NOTI-ACT-DELIVER:school:object:source-version:request-id | PERMISSION_DENIED / VERSION_CONFLICT |
| NOTI-ACT-FAIL-DELIVERY | Record an In-product Notification Delivery Failure | NOTI-OBJ-NOTIFICATION | UPDATE |  | NOTI-NOTIFICATION-F-FAILURE-CODE<br>NOTI-NOTIFICATION-F-VERSION | QUEUED → FAILED | ALLOW:SYSTEM — the verified delivery event updates only the target notification<br>DENY:CURRENT_ACTOR — a user cannot invoke notification delivery state changes directly | SYSTEM_EVENT | LOW | REQUIRED | NOTI-ACT-FAIL-DELIVERY:school:object:source-version:request-id | PERMISSION_DENIED / VERSION_CONFLICT |
| NOTI-ACT-RETRY-DELIVERY | Retry an In-product Notification Delivery | NOTI-OBJ-NOTIFICATION | UPDATE |  | NOTI-NOTIFICATION-F-RETRY-COUNT<br>NOTI-NOTIFICATION-F-VERSION | FAILED → QUEUED | ALLOW:SYSTEM — the verified delivery event updates only the target notification<br>DENY:CURRENT_ACTOR — a user cannot invoke notification delivery state changes directly | SYSTEM_EVENT | LOW | REQUIRED | NOTI-ACT-RETRY-DELIVERY:school:object:source-version:request-id | PERMISSION_DENIED / VERSION_CONFLICT |
| NOTI-ACT-MARK-READ | Mark an In-product Notification Read | NOTI-OBJ-NOTIFICATION | UPDATE | NOTI-NOTIFICATION-F-ID | NOTI-NOTIFICATION-F-READ-AT<br>NOTI-NOTIFICATION-F-VERSION | DELIVERED → READ | ALLOW:CURRENT_ACTOR — the authenticated recipient is acting on the recipient's own notification [OWN_RECORD:NOTI-NOTIFICATION-F-RECIPIENT]<br>DENY:CURRENT_ACTOR — the authenticated actor is not the notification recipient [OTHER_RECORD:NOTI-NOTIFICATION-F-RECIPIENT]<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student notifications | WEB / APP | LOW | REQUIRED | NOTI-ACT-MARK-READ:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| NOTI-ACT-MARK-HANDLED | Mark an In-product Notification Handled | NOTI-OBJ-NOTIFICATION | UPDATE | NOTI-NOTIFICATION-F-ID | NOTI-NOTIFICATION-F-HANDLED-AT<br>NOTI-NOTIFICATION-F-VERSION | READ → HANDLED | ALLOW:CURRENT_ACTOR — the authenticated recipient is acting on the recipient's own notification [OWN_RECORD:NOTI-NOTIFICATION-F-RECIPIENT]<br>DENY:CURRENT_ACTOR — the authenticated actor is not the notification recipient [OTHER_RECORD:NOTI-NOTIFICATION-F-RECIPIENT]<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student notifications | WEB / APP | LOW | REQUIRED | NOTI-ACT-MARK-HANDLED:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

## 6. 状态可达性

| Object ID | 状态 | 进入动作 | 离开动作 |
| --- | --- | --- | --- |
| NOTI-OBJ-NOTIFICATION | QUEUED | NOTI-ACT-CREATE-REMINDER<br>NOTI-ACT-CREATE-REPORT-NOTIFICATION<br>NOTI-ACT-RETRY-DELIVERY | NOTI-ACT-DELIVER<br>NOTI-ACT-FAIL-DELIVERY |
| NOTI-OBJ-NOTIFICATION | DELIVERED | NOTI-ACT-DELIVER | NOTI-ACT-MARK-READ |
| NOTI-OBJ-NOTIFICATION | READ | NOTI-ACT-MARK-READ | NOTI-ACT-MARK-HANDLED |
| NOTI-OBJ-NOTIFICATION | HANDLED | NOTI-ACT-MARK-HANDLED |  |
| NOTI-OBJ-NOTIFICATION | FAILED | NOTI-ACT-FAIL-DELIVERY | NOTI-ACT-RETRY-DELIVERY |

## 7. 参与数据流

| Flow ID | 数据流 | 阶段 | 参与模块 | 本模块动作 | 失败与补偿 |
| --- | --- | --- | --- | --- | --- |
| DF-013 | Student Plan Execution to Report Snapshot and In-product Delivery | 1 | APP-001 / PLN-001 / RPT-001 / NOTI-001 | NOTI-ACT-CREATE-REPORT-NOTIFICATION | REPORT_RUN_SNAPSHOT_DELIVERY_AND_NOTIFICATION_OBJECT；{"strategy":"RECHECK_PERMISSION_REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_OUTPUTS","maxAttempts":4,"retryableFailureResults":["SOURCE_VERSION_STALE","DELIVERY_FAILED","VERSION_CONFLICT"]}；{"strategy":"KEEP_SOURCE_EXECUTION_RUN_AND_SNAPSHOT_WHILE_RETRYING_DELIVERY_ONLY","description":"delivery or notification failure never rolls back student execution, plan, successful run, or immutable snapshot"}；{"strategy":"CREATE_A_NEW_RUN_FOR_NEW_SOURCE_VERSIONS","targets":["future report run","future report snapshot","in-product delivery retry"]} |

## 8. 页面任务合同

| Page ID | 页面 | 端 | 对象 | 字段 | 动作 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NOTI-PAGE-INBOX | Notification Inbox and Reminder Creation | WEB / APP | NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-ID<br>NOTI-NOTIFICATION-F-SOURCE-EVENT<br>NOTI-NOTIFICATION-F-RECIPIENT<br>NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE<br>NOTI-NOTIFICATION-F-DEEP-LINK<br>NOTI-NOTIFICATION-F-CHANNEL<br>NOTI-NOTIFICATION-F-DELIVERED-AT<br>NOTI-NOTIFICATION-F-READ-AT<br>NOTI-NOTIFICATION-F-HANDLED-AT<br>NOTI-NOTIFICATION-F-FAILURE-CODE<br>NOTI-NOTIFICATION-F-RETRY-COUNT<br>NOTI-NOTIFICATION-F-VERSION | NOTI-ACT-CREATE-REMINDER<br>NOTI-ACT-MARK-READ<br>NOTI-ACT-MARK-HANDLED | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |

## 9. 验收场景

| Scenario ID | 类型 | Action ID | Given | When | Expected Data | Expected State | Permission | 失败码 / 谓词 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOTI-ACT-CREATE-REMINDER-SCN-SUCCESS | SUCCESS | NOTI-ACT-CREATE-REMINDER | the actor meets the entry conditions for Create an In-product Learning Reminder | the actor requests Create an In-product Learning Reminder | Create an In-product Learning Reminder returns the accepted versioned result | QUEUED | ALLOW |  |
| NOTI-ACT-CREATE-REMINDER-SCN-PERMISSION_DENIED | FAILURE | NOTI-ACT-CREATE-REMINDER | PERMISSION_DENIED applies to Create an In-product Learning Reminder | the actor requests Create an In-product Learning Reminder | Create an In-product Learning Reminder returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| NOTI-ACT-CREATE-REMINDER-SCN-VALIDATION_FAILED | FAILURE | NOTI-ACT-CREATE-REMINDER | VALIDATION_FAILED applies to Create an In-product Learning Reminder | the actor requests Create an In-product Learning Reminder | Create an In-product Learning Reminder returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| NOTI-ACT-CREATE-REMINDER-SCN-VERSION_CONFLICT | FAILURE | NOTI-ACT-CREATE-REMINDER | VERSION_CONFLICT applies to Create an In-product Learning Reminder | the actor requests Create an In-product Learning Reminder | Create an In-product Learning Reminder returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| NOTI-ACT-CREATE-REPORT-NOTIFICATION-SCN-SUCCESS | SUCCESS | NOTI-ACT-CREATE-REPORT-NOTIFICATION | the actor meets the entry conditions for Create an In-product Report Notification | the actor requests Create an In-product Report Notification | Create an In-product Report Notification returns the accepted versioned result | QUEUED | ALLOW |  |
| NOTI-ACT-CREATE-REPORT-NOTIFICATION-SCN-PERMISSION_DENIED | FAILURE | NOTI-ACT-CREATE-REPORT-NOTIFICATION | PERMISSION_DENIED applies to Create an In-product Report Notification | the actor requests Create an In-product Report Notification | Create an In-product Report Notification returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| NOTI-ACT-CREATE-REPORT-NOTIFICATION-SCN-DELIVERY_FAILED | FAILURE | NOTI-ACT-CREATE-REPORT-NOTIFICATION | DELIVERY_FAILED applies to Create an In-product Report Notification | the actor requests Create an In-product Report Notification | Create an In-product Report Notification returns DELIVERY_FAILED without hidden writes | UNCHANGED | DENY | DELIVERY_FAILED |
| NOTI-ACT-CREATE-REPORT-NOTIFICATION-SCN-VERSION_CONFLICT | FAILURE | NOTI-ACT-CREATE-REPORT-NOTIFICATION | VERSION_CONFLICT applies to Create an In-product Report Notification | the actor requests Create an In-product Report Notification | Create an In-product Report Notification returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| NOTI-ACT-DELIVER-SCN-SUCCESS | SUCCESS | NOTI-ACT-DELIVER | the actor meets the entry conditions for Record an In-product Notification Delivery | the actor requests Record an In-product Notification Delivery | Record an In-product Notification Delivery returns the accepted versioned result | DELIVERED | ALLOW |  |
| NOTI-ACT-DELIVER-SCN-PERMISSION_DENIED | FAILURE | NOTI-ACT-DELIVER | PERMISSION_DENIED applies to Record an In-product Notification Delivery | the actor requests Record an In-product Notification Delivery | Record an In-product Notification Delivery returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| NOTI-ACT-DELIVER-SCN-VERSION_CONFLICT | FAILURE | NOTI-ACT-DELIVER | VERSION_CONFLICT applies to Record an In-product Notification Delivery | the actor requests Record an In-product Notification Delivery | Record an In-product Notification Delivery returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| NOTI-ACT-FAIL-DELIVERY-SCN-SUCCESS | SUCCESS | NOTI-ACT-FAIL-DELIVERY | the actor meets the entry conditions for Record an In-product Notification Delivery Failure | the actor requests Record an In-product Notification Delivery Failure | Record an In-product Notification Delivery Failure returns the accepted versioned result | FAILED | ALLOW |  |
| NOTI-ACT-FAIL-DELIVERY-SCN-PERMISSION_DENIED | FAILURE | NOTI-ACT-FAIL-DELIVERY | PERMISSION_DENIED applies to Record an In-product Notification Delivery Failure | the actor requests Record an In-product Notification Delivery Failure | Record an In-product Notification Delivery Failure returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| NOTI-ACT-FAIL-DELIVERY-SCN-VERSION_CONFLICT | FAILURE | NOTI-ACT-FAIL-DELIVERY | VERSION_CONFLICT applies to Record an In-product Notification Delivery Failure | the actor requests Record an In-product Notification Delivery Failure | Record an In-product Notification Delivery Failure returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| NOTI-ACT-RETRY-DELIVERY-SCN-SUCCESS | SUCCESS | NOTI-ACT-RETRY-DELIVERY | the actor meets the entry conditions for Retry an In-product Notification Delivery | the actor requests Retry an In-product Notification Delivery | Retry an In-product Notification Delivery returns the accepted versioned result | QUEUED | ALLOW |  |
| NOTI-ACT-RETRY-DELIVERY-SCN-PERMISSION_DENIED | FAILURE | NOTI-ACT-RETRY-DELIVERY | PERMISSION_DENIED applies to Retry an In-product Notification Delivery | the actor requests Retry an In-product Notification Delivery | Retry an In-product Notification Delivery returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| NOTI-ACT-RETRY-DELIVERY-SCN-VERSION_CONFLICT | FAILURE | NOTI-ACT-RETRY-DELIVERY | VERSION_CONFLICT applies to Retry an In-product Notification Delivery | the actor requests Retry an In-product Notification Delivery | Retry an In-product Notification Delivery returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| NOTI-ACT-MARK-READ-SCN-SUCCESS | SUCCESS | NOTI-ACT-MARK-READ | the actor meets the entry conditions for Mark an In-product Notification Read | the actor requests Mark an In-product Notification Read | Mark an In-product Notification Read returns the accepted versioned result | READ | ALLOW |  |
| NOTI-ACT-MARK-READ-SCN-PERMISSION_DENIED | FAILURE | NOTI-ACT-MARK-READ | PERMISSION_DENIED applies to Mark an In-product Notification Read | the actor requests Mark an In-product Notification Read | Mark an In-product Notification Read returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| NOTI-ACT-MARK-READ-SCN-VALIDATION_FAILED | FAILURE | NOTI-ACT-MARK-READ | VALIDATION_FAILED applies to Mark an In-product Notification Read | the actor requests Mark an In-product Notification Read | Mark an In-product Notification Read returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| NOTI-ACT-MARK-READ-SCN-VERSION_CONFLICT | FAILURE | NOTI-ACT-MARK-READ | VERSION_CONFLICT applies to Mark an In-product Notification Read | the actor requests Mark an In-product Notification Read | Mark an In-product Notification Read returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| NOTI-ACT-MARK-HANDLED-SCN-SUCCESS | SUCCESS | NOTI-ACT-MARK-HANDLED | the actor meets the entry conditions for Mark an In-product Notification Handled | the actor requests Mark an In-product Notification Handled | Mark an In-product Notification Handled returns the accepted versioned result | HANDLED | ALLOW |  |
| NOTI-ACT-MARK-HANDLED-SCN-PERMISSION_DENIED | FAILURE | NOTI-ACT-MARK-HANDLED | PERMISSION_DENIED applies to Mark an In-product Notification Handled | the actor requests Mark an In-product Notification Handled | Mark an In-product Notification Handled returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| NOTI-ACT-MARK-HANDLED-SCN-VALIDATION_FAILED | FAILURE | NOTI-ACT-MARK-HANDLED | VALIDATION_FAILED applies to Mark an In-product Notification Handled | the actor requests Mark an In-product Notification Handled | Mark an In-product Notification Handled returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| NOTI-ACT-MARK-HANDLED-SCN-VERSION_CONFLICT | FAILURE | NOTI-ACT-MARK-HANDLED | VERSION_CONFLICT applies to Mark an In-product Notification Handled | the actor requests Mark an In-product Notification Handled | Mark an In-product Notification Handled returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |

## 10. AI 任务映射

| Task ID | 任务 | 类型 | 目标 Action | 受众 | 确认者 | 预览字段 | 失败行为 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AI-TASK-CREATE-REMINDER | Remind this student in the App to finish the correction task tomorrow | REMINDER | NOTI-ACT-CREATE-REMINDER | DUTY-SUBJECT-TEACHER | {"mode":"DUTY","dutyRef":"DUTY-SUBJECT-TEACHER"} | NOTI-NOTIFICATION-F-SOURCE-EVENT<br>NOTI-NOTIFICATION-F-RECIPIENT<br>NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE<br>NOTI-NOTIFICATION-F-DEEP-LINK | {"mode":"FAIL_CLOSED","preservesBusinessFacts":true,"manualFallback":"continue through the target module's manual Web or App path"} |

## 11. 研发与测试就绪门禁

- 实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。
- 所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。
- 每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。
- 每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。
- Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。
