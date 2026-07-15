# NOTI-001 In-product Notification Delivery Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | NOTI-001 |
| 阶段 | 1 |
| 页面数量 | 1 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## NOTI-PAGE-INBOX Notification Inbox and Reminder Creation

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | NOTI-OBJ-NOTIFICATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-ID | Notification ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-SOURCE-EVENT | Notification Source Event | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-RECIPIENT | Notification Recipient | ID | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE | Summary Template | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-DEEP-LINK | Authorized Product Deep Link | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-CHANNEL | Notification Channel | STRING | 是 | OPTION_SET: OPT-ENUM-047 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-DELIVERED-AT | Delivered At | DATETIME | required only when NOTI-ACT-DELIVER succeeds；状态=DELIVERED；动作=NOTI-ACT-DELIVER | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-READ-AT | Read At | DATETIME | required only when NOTI-ACT-MARK-READ succeeds；状态=READ；动作=NOTI-ACT-MARK-READ | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-HANDLED-AT | Handled At | DATETIME | required only when NOTI-ACT-MARK-HANDLED succeeds；状态=HANDLED；动作=NOTI-ACT-MARK-HANDLED | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-FAILURE-CODE | Delivery Failure Code | STRING | required only when NOTI-ACT-FAIL-DELIVERY succeeds；状态=FAILED；动作=NOTI-ACT-FAIL-DELIVERY | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-RETRY-COUNT | Delivery Retry Count | INTEGER | required when notification creation initializes or retry increments the counter；状态=QUEUED；动作=NOTI-ACT-CREATE-REMINDER/NOTI-ACT-CREATE-REPORT-NOTIFICATION/NOTI-ACT-RETRY-DELIVERY | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-VERSION | Notification Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOTI-ACT-CREATE-REMINDER | Create an In-product Learning Reminder | CREATE | NOTI-NOTIFICATION-F-SOURCE-EVENT<br>NOTI-NOTIFICATION-F-RECIPIENT<br>NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE<br>NOTI-NOTIFICATION-F-DEEP-LINK | NOTI-NOTIFICATION-F-ID<br>NOTI-NOTIFICATION-F-CHANNEL<br>NOTI-NOTIFICATION-F-RETRY-COUNT<br>NOTI-NOTIFICATION-F-VERSION | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| NOTI-ACT-MARK-READ | Mark an In-product Notification Read | UPDATE | NOTI-NOTIFICATION-F-ID | NOTI-NOTIFICATION-F-READ-AT<br>NOTI-NOTIFICATION-F-VERSION | DELIVERED → READ | CURRENT_ACTOR | CURRENT_ACTOR / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| NOTI-ACT-MARK-HANDLED | Mark an In-product Notification Handled | UPDATE | NOTI-NOTIFICATION-F-ID | NOTI-NOTIFICATION-F-HANDLED-AT<br>NOTI-NOTIFICATION-F-VERSION | READ → HANDLED | CURRENT_ACTOR | CURRENT_ACTOR / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
