# NOTI-001 In-product Notification Delivery Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | NOTI-001 |
| 阶段 | 1 |
| 交付状态 | BUILD_READY |
| 页面数量 | 3 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## NOTI-PAGE-INBOX Notification Message Inbox

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | NOTI-OBJ-NOTIFICATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-ID | Notification Message ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-SOURCE-EVENT | Source Business Event ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-RECIPIENT | Notification Recipient | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE | Authorized Minimal Summary Template | STRING | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-DEEP-LINK | Reauthorized Product Deep Link | STRING | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-READ-AT | Read At | DATETIME | required only after the recipient reads the message；状态=READ；动作=NOTI-ACT-MARK-READ | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-ARCHIVED-AT | Archived At | DATETIME | required only when the recipient archives the message；状态=ARCHIVED；动作=NOTI-ACT-MARK-HANDLED | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-VERSION | Notification Message Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOTI-ACT-CREATE-REMINDER | Create an Authorized In-product Reminder Message | CREATE | NOTI-NOTIFICATION-F-SOURCE-EVENT<br>NOTI-NOTIFICATION-F-RECIPIENT<br>NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE<br>NOTI-NOTIFICATION-F-DEEP-LINK | NOTI-NOTIFICATION-F-ID<br>NOTI-NOTIFICATION-F-VERSION | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| NOTI-ACT-MARK-READ | Mark an In-product Message Read | UPDATE | NOTI-NOTIFICATION-F-ID | NOTI-NOTIFICATION-F-READ-AT<br>NOTI-NOTIFICATION-F-VERSION | AVAILABLE → READ | CURRENT_ACTOR | CURRENT_ACTOR / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| NOTI-ACT-MARK-HANDLED | Archive an In-product Message without Resolving its Todo | UPDATE | NOTI-NOTIFICATION-F-ID | NOTI-NOTIFICATION-F-ARCHIVED-AT<br>NOTI-NOTIFICATION-F-VERSION | READ → ARCHIVED | CURRENT_ACTOR | CURRENT_ACTOR / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## NOTI-PAGE-ACTION-TODO Teaching Action Todo Queue

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | NOTI-OBJ-ACTION-TODO / NOTI-OBJ-BUSINESS-EVENT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-ID | Action Todo ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-SOURCE-EVENT-ID | Source Business Event ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-ASSIGNEE-ID | Assigned Teacher ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-TEACHING-ISSUE | Teaching Issue | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-TEACHER-JUDGMENT | Teacher Judgment | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-LINKED-ACTIONS | Linked Teaching Actions | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-RESOLUTION-EVIDENCE | New Evidence Supporting Resolution | JSON | required only when observation supports resolution；状态=RESOLVED；动作=NOTI-ACT-RESOLVE-ACTION-TODO | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-STATUS | Action Todo Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-VERSION | Action Todo Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-BUSINESS-EVENT | NOTI-EVENT-F-ID | Business Event ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-BUSINESS-EVENT | NOTI-EVENT-F-SOURCE-OBJECT-ID | Source Business Object ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-BUSINESS-EVENT | NOTI-EVENT-F-SOURCE-VERSION | Source Business Object Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-BUSINESS-EVENT | NOTI-EVENT-F-EVENT-KIND | Business Event Kind | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-BUSINESS-EVENT | NOTI-EVENT-F-OCCURRED-AT | Business Event Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-BUSINESS-EVENT | NOTI-EVENT-F-VERSION | Business Event Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOTI-ACT-CREATE-ACTION-TODO | Create a Teaching Action Todo from a Business Event | CREATE | NOTI-TODO-F-SOURCE-EVENT-ID<br>NOTI-TODO-F-ASSIGNEE-ID<br>NOTI-TODO-F-TEACHING-ISSUE | NOTI-TODO-F-ID<br>NOTI-TODO-F-STATUS<br>NOTI-TODO-F-VERSION | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| NOTI-ACT-START-ACTION-TODO | Start a Teaching Action Todo | UPDATE | NOTI-TODO-F-ID<br>NOTI-TODO-F-TEACHER-JUDGMENT<br>NOTI-TODO-F-LINKED-ACTIONS | NOTI-TODO-F-STATUS<br>NOTI-TODO-F-VERSION | OPEN → IN_PROGRESS | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| NOTI-ACT-OBSERVE-ACTION-TODO | Move a Completed Teaching Action into Result Observation | UPDATE | NOTI-TODO-F-ID<br>NOTI-TODO-F-LINKED-ACTIONS | NOTI-TODO-F-STATUS<br>NOTI-TODO-F-VERSION | IN_PROGRESS → OBSERVING | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| NOTI-ACT-RESOLVE-ACTION-TODO | Resolve a Teaching Issue from New Evidence | UPDATE | NOTI-TODO-F-ID<br>NOTI-TODO-F-RESOLUTION-EVIDENCE | NOTI-TODO-F-RESOLUTION-EVIDENCE<br>NOTI-TODO-F-STATUS<br>NOTI-TODO-F-VERSION | OBSERVING → RESOLVED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| NOTI-ACT-REOPEN-ACTION-TODO | Reopen a Teaching Issue after New Contrary Evidence | UPDATE | NOTI-TODO-F-ID<br>NOTI-TODO-F-TEACHING-ISSUE | NOTI-TODO-F-STATUS<br>NOTI-TODO-F-VERSION | RESOLVED → OPEN | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| NOTI-ACT-CANCEL-ACTION-TODO | Cancel an Invalid Teaching Action Todo | UPDATE | NOTI-TODO-F-ID<br>NOTI-TODO-F-TEACHER-JUDGMENT | NOTI-TODO-F-STATUS<br>NOTI-TODO-F-VERSION | OPEN / IN_PROGRESS / OBSERVING → CANCELLED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## NOTI-PAGE-DELIVERY-MONITOR Notification Delivery Monitor

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | NOTI-OBJ-CHANNEL-DELIVERY | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-ID | Channel Delivery Attempt ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-MESSAGE-REF | Pinned Notification Message Reference | ID | 是 | OBJECT_REF: NOTI-OBJ-NOTIFICATION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-MESSAGE-VERSION | Pinned Notification Message Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-CHANNEL | Delivery Channel | STRING | 是 | OPTION_SET: OPT-ENUM-047 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-DELIVERED-AT | Delivered At | DATETIME | required only after a delivery receipt succeeds；状态=DELIVERED；动作=NOTI-ACT-DELIVER | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-FAILURE-CODE | Delivery Failure Code | STRING | required only after a delivery attempt fails；状态=FAILED；动作=NOTI-ACT-FAIL-DELIVERY | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-RETRY-COUNT | Delivery Retry Count | INTEGER | required when queueing or retrying an independent delivery；状态=QUEUED；动作=NOTI-ACT-QUEUE-DELIVERY/NOTI-ACT-RETRY-DELIVERY | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-VERSION | Channel Delivery Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
