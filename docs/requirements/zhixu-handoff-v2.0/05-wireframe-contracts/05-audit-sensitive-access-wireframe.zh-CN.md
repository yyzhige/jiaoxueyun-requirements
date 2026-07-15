# AUD-001 Audit and sensitive access Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | AUD-001 |
| 阶段 | 1 |
| 页面数量 | 5 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## AUD-PAGE-SEARCH Authorized Audit Event Search

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | AUD-OBJ-EVENT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-OBJ-EVENT | AUD-EVENT-F-TIME | Event Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-EVENT | AUD-EVENT-F-ACTOR | Actor ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-EVENT | AUD-EVENT-F-ACTION | Audited Action | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-EVENT | AUD-EVENT-F-SCOPE | Audited Object Scope | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-EVENT | AUD-EVENT-F-RESULT | Audited Result | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-ACT-QUERY-AUDIT | Query Authorized Audit Events | READ | AUD-EVENT-F-SCOPE<br>AUD-EVENT-F-ACTOR<br>AUD-EVENT-F-ACTION | AUD-EVENT-F-ID<br>AUD-EVENT-F-TIME<br>AUD-EVENT-F-RESULT | UNCHANGED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## AUD-PAGE-ACCESS-REQUEST Time-limited Sensitive Access Request

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | AUD-OBJ-ACCESS-REQUEST | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-REQUESTER | Access Requester ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-SCOPE | Requested Sensitive Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-PURPOSE | Sensitive Access Purpose | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-EXPIRY | Requested Access Expiry | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-RESULT | Access Decision Result | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-ACT-REQUEST-SENSITIVE | Request Time-limited Sensitive Access | CREATE | AUD-REQUEST-F-SCOPE<br>AUD-REQUEST-F-PURPOSE<br>AUD-REQUEST-F-EXPIRY | AUD-REQUEST-F-ID<br>AUD-REQUEST-F-REQUESTER<br>AUD-REQUEST-F-RESULT<br>AUD-REQUEST-F-VERSION | CREATE | ROLE-PLATFORM-OPS | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## AUD-PAGE-ACCESS-APPROVAL School Sensitive Access Approval

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | AUD-OBJ-ACCESS-REQUEST | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-SCOPE | Requested Sensitive Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-PURPOSE | Sensitive Access Purpose | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-EXPIRY | Requested Access Expiry | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-APPROVER | School Approver ID | STRING | required before APPROVED；状态=APPROVED | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-DECISION-REASON | Sensitive Access Decision Reason | TEXT | required for APPROVED or DENIED；状态=APPROVED/DENIED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-RESULT | Access Decision Result | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-ACT-APPROVE-SENSITIVE | Approve Limited Sensitive Access | UPDATE | AUD-REQUEST-F-ID<br>AUD-REQUEST-F-APPROVER<br>AUD-REQUEST-F-SCOPE<br>AUD-REQUEST-F-EXPIRY<br>AUD-REQUEST-F-DECISION-REASON | AUD-REQUEST-F-RESULT<br>AUD-REQUEST-F-VERSION | REQUESTED → APPROVED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-DENY-SENSITIVE | Deny Sensitive Access | UPDATE | AUD-REQUEST-F-ID<br>AUD-REQUEST-F-APPROVER<br>AUD-REQUEST-F-DECISION-REASON | AUD-REQUEST-F-RESULT<br>AUD-REQUEST-F-VERSION | REQUESTED → DENIED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## AUD-PAGE-ACTIVE-SESSION Active Sensitive Access Session

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | AUD-OBJ-ACCESS-SESSION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-SCOPE | Session Object Scope | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-START | Session Start | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-EXPIRY | Session Expiry | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-AUTHORIZED-OPERATOR-ID | Authorized Session Operator | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-STATUS | Session Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-ACT-REVOKE-SESSION | Revoke a Sensitive Access Session | UPDATE | AUD-SESSION-F-ID | AUD-SESSION-F-STATUS<br>AUD-SESSION-F-VERSION | ACTIVE → REVOKED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## AUD-PAGE-REVIEW Audit Review Case Investigation

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | AUD-OBJ-REVIEW | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-OBJ-REVIEW | AUD-REVIEW-F-EVENT-IDS | Related Audit Event IDs | STRING_ARRAY | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-REVIEW | AUD-REVIEW-F-REASON | Review Reason | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-REVIEW | AUD-REVIEW-F-RESOLUTION | Review Resolution | STRING | required before RESOLVED；状态=RESOLVED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AUD-OBJ-REVIEW | AUD-REVIEW-F-STATUS | Review Case Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-ACT-CREATE-REVIEW | Create an Audit Review Case | CREATE | AUD-REVIEW-F-EVENT-IDS<br>AUD-REVIEW-F-REASON | AUD-REVIEW-F-ID<br>AUD-REVIEW-F-STATUS | CREATE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-INVESTIGATE-REVIEW | Start an Audit Review Investigation | UPDATE | AUD-REVIEW-F-ID | AUD-REVIEW-F-STATUS | OPEN → INVESTIGATING | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-RESOLVE-REVIEW | Resolve an Audit Review Case | UPDATE | AUD-REVIEW-F-ID<br>AUD-REVIEW-F-RESOLUTION | AUD-REVIEW-F-STATUS | INVESTIGATING → RESOLVED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-CLOSE-REVIEW | Close a Resolved Audit Review Case | UPDATE | AUD-REVIEW-F-ID | AUD-REVIEW-F-STATUS | RESOLVED → CLOSED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-EXPORT-SUMMARY | Export an Authorized Audit Summary | UPDATE | AUD-REVIEW-F-ID<br>AUD-REVIEW-F-EVENT-IDS | AUD-REVIEW-F-RESOLUTION | RESOLVED → RESOLVED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |
