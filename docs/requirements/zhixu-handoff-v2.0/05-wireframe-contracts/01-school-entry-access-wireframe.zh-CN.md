# ACC-001 School activation, identity, login, and active context Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | ACC-001 |
| 阶段 | 1 |
| 交付状态 | BUILD_READY |
| 页面数量 | 13 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## ACC-PAGE-SCHOOL-ENTRY Authorized School Selection

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-SCHOOL | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-SCHOOL | ACC-SCHOOL-F-ID | School ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL | ACC-SCHOOL-F-NAME | School Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL | ACC-SCHOOL-F-REGION | School Region | STRING | 是 | OPTION_SET: OPT-COM-001 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL | ACC-SCHOOL-F-SERVICE-STATE | Service State | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-SEARCH-SCHOOL | Search Authorized School Before Entry | READ | ACC-SCHOOL-F-REGION<br>ACC-SCHOOL-F-NAME | ACC-SCHOOL-F-ID<br>ACC-SCHOOL-F-SCHOOL-VERSION<br>ACC-SCHOOL-F-SERVICE-STATE | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-SELECT-SCHOOL | Select School for Account Entry | READ | ACC-SCHOOL-F-ID | ACC-SCHOOL-F-SCHOOL-VERSION<br>ACC-SCHOOL-F-SERVICE-STATE | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-LOGIN-ACTIVATION Selected School Login and First Activation

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-MEMBERSHIP | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-ACCOUNT-ID-TYPE | Account Identifier Type | STRING | 是 | OPTION_SET: OPT-ENUM-025 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-ACCOUNT-ID | Account Identifier Value | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-SCHOOL-ID | Membership School ID | STRING | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-ACTIVATION | Activation Method | STRING | 是 | OPTION_SET: OPT-ENUM-026 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-STATE | Membership State | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-LOGIN | Authenticate Account in Selected School | READ | ACC-MEMBER-F-ACCOUNT-ID-TYPE<br>ACC-MEMBER-F-ACCOUNT-ID<br>ACC-MEMBER-F-SCHOOL-ID | ACC-MEMBER-F-STATE<br>ACC-MEMBER-F-VERSION | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-FIRST-ACTIVATION | Complete First Account Activation | UPDATE | ACC-MEMBER-F-ACTIVATION<br>ACC-MEMBER-F-ACCOUNT-ID-TYPE<br>ACC-MEMBER-F-ACCOUNT-ID | ACC-MEMBER-F-STATE<br>ACC-MEMBER-F-VERSION | INVITED → ACTIVE | CURRENT_ACTOR | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-SUSPEND-MEMBERSHIP | Suspend an Active School Membership | UPDATE | ACC-MEMBER-F-ID | ACC-MEMBER-F-STATE<br>ACC-MEMBER-F-VERSION | ACTIVE → SUSPENDED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-DEACTIVATE-MEMBERSHIP | Deactivate a School Membership | UPDATE | ACC-MEMBER-F-ID | ACC-MEMBER-F-STATE<br>ACC-MEMBER-F-VERSION | ACTIVE / SUSPENDED → DEACTIVATED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED / VIDEO_RECALL_EVENT_OUTBOX_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-IDENTITY-TERM Effective Identity and Term Selection

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-IDENTITY / ACC-OBJ-CONTEXT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-IDENTITY | ACC-IDENTITY-F-ROLE | Login Role | STRING | 是 | OPTION_SET: OPT-COM-003 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-IDENTITY | ACC-IDENTITY-F-DUTIES | Assigned Duties | STRING_ARRAY | 否 | OPTION_SET: OPT-ENUM-042 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-SCHOOL-ID | Context School ID | STRING | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-IDENTITY-ID | Context Identity ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-TERM-ID | Context Term ID | STRING | 是 | OPTION_SET: OPT-COM-004 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-STATUS | Context Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-SELECT-IDENTITY | Select Effective Work Identity | READ | ACC-IDENTITY-F-ROLE<br>ACC-IDENTITY-F-DUTIES | ACC-IDENTITY-F-SCOPES<br>ACC-IDENTITY-F-IDENTITY-VERSION | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-SELECT-TERM | Select Current or Historical Term | CREATE | ACC-CONTEXT-F-SCHOOL-ID<br>ACC-CONTEXT-F-IDENTITY-ID<br>ACC-CONTEXT-F-TERM-ID | ACC-CONTEXT-F-ID<br>ACC-CONTEXT-F-CREATED<br>ACC-CONTEXT-F-EXPIRY<br>ACC-CONTEXT-F-CONTEXT-VERSION<br>ACC-CONTEXT-F-STATUS | CREATE | CURRENT_ACTOR | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-CONTEXT-SWITCH Active Context Switcher

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-CONTEXT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-SCHOOL-ID | Context School ID | STRING | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-IDENTITY-ID | Context Identity ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-TERM-ID | Context Term ID | STRING | 是 | OPTION_SET: OPT-COM-004 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-STATUS | Context Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-SWITCH-CONTEXT | Switch Active School Identity and Term Context | CREATE | ACC-CONTEXT-F-SCHOOL-ID<br>ACC-CONTEXT-F-IDENTITY-ID<br>ACC-CONTEXT-F-TERM-ID | ACC-CONTEXT-F-ID<br>ACC-CONTEXT-F-CREATED<br>ACC-CONTEXT-F-EXPIRY<br>ACC-CONTEXT-F-CONTEXT-VERSION<br>ACC-CONTEXT-F-STATUS | CREATE | CURRENT_ACTOR | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-CONTEXT-RECOVERY Expired Context Recovery

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-CONTEXT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-SCHOOL-ID | Context School ID | STRING | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-IDENTITY-ID | Context Identity ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-TERM-ID | Context Term ID | STRING | 是 | OPTION_SET: OPT-COM-004 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-EXPIRY | Expires At | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CONTEXT | ACC-CONTEXT-F-STATUS | Context Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-SWITCH-CONTEXT | Switch Active School Identity and Term Context | CREATE | ACC-CONTEXT-F-SCHOOL-ID<br>ACC-CONTEXT-F-IDENTITY-ID<br>ACC-CONTEXT-F-TERM-ID | ACC-CONTEXT-F-ID<br>ACC-CONTEXT-F-CREATED<br>ACC-CONTEXT-F-EXPIRY<br>ACC-CONTEXT-F-CONTEXT-VERSION<br>ACC-CONTEXT-F-STATUS | CREATE | CURRENT_ACTOR | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-SCHOOL-ACTIVATION School Subject Review and Teaching Activation

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-SCHOOL-ACTIVATION / ACC-OBJ-SCHOOL-APPLICATION-REVIEW / ACC-OBJ-SCHOOL-INITIALIZATION / ACC-OBJ-SCHOOL-SUBSCRIPTION / ACC-OBJ-CLASS-COURSE-READINESS / ACC-OBJ-SCHOOL | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SCHOOL-NAME | Applied School Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SUBJECT-REF | Verified School Legal Subject Reference | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-FIRST-ADMIN-ID | First Administrator Identity ID | ID | required from first-administrator acceptance onward；状态=FIRST_ADMIN_ACCEPTED/INITIALIZATION_VALIDATED/TEACHING_ACTIVE | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-INITIALIZATION-EVIDENCE | Initialization Validation Evidence | JSON | required before initialization is validated；状态=INITIALIZATION_VALIDATED/TEACHING_ACTIVE | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SUBSCRIPTION-READY | Subscription Readiness | STRING | required before initialization is validated；状态=INITIALIZATION_VALIDATED/TEACHING_ACTIVE | OPTION_SET: OPT-ENUM-001 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-CLASS-COURSE-READY | Class and Course Readiness | STRING | required before initialization is validated；状态=INITIALIZATION_VALIDATED/TEACHING_ACTIVE | OPTION_SET: OPT-ENUM-001 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-COMPLETED-AXES | Independently Completed Activation Axes | STRING_ARRAY | 是 | OPTION_SET: OPT-GOV-001 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must add an axis only after its own evidence and authorizer have passed |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-STATUS | School Activation Case Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-APPLICATION-REF | ACC-OBJ-SCHOOL-APPLICATION-REVIEW Readiness Reference | ID | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | OBJECT_REF: ACC-OBJ-SCHOOL-APPLICATION-REVIEW | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-APPLICATION-VERSION | ACC-OBJ-SCHOOL-APPLICATION-REVIEW Pinned Version | INTEGER | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SCHOOL-REF | ACC-OBJ-SCHOOL Readiness Reference | ID | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | OBJECT_REF: ACC-OBJ-SCHOOL | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SCHOOL-VERSION | ACC-OBJ-SCHOOL Pinned Version | INTEGER | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-INITIALIZATION-REF | ACC-OBJ-SCHOOL-INITIALIZATION Readiness Reference | ID | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | OBJECT_REF: ACC-OBJ-SCHOOL-INITIALIZATION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-INITIALIZATION-VERSION | ACC-OBJ-SCHOOL-INITIALIZATION Pinned Version | INTEGER | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SUBSCRIPTION-REF | ACC-OBJ-SCHOOL-SUBSCRIPTION Readiness Reference | ID | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | OBJECT_REF: ACC-OBJ-SCHOOL-SUBSCRIPTION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SUBSCRIPTION-VERSION | ACC-OBJ-SCHOOL-SUBSCRIPTION Pinned Version | INTEGER | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-CLASS-COURSE-REF | ACC-OBJ-CLASS-COURSE-READINESS Readiness Reference | ID | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | OBJECT_REF: ACC-OBJ-CLASS-COURSE-READINESS | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-CLASS-COURSE-VERSION | ACC-OBJ-CLASS-COURSE-READINESS Pinned Version | INTEGER | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-SUBMIT-SCHOOL-APPLICATION | Submit a School Subject Application | CREATE | ACC-ACTIVATION-F-SCHOOL-NAME<br>ACC-ACTIVATION-F-SUBJECT-REF | ACC-ACTIVATION-F-ID<br>ACC-ACTIVATION-F-COMPLETED-AXES<br>ACC-ACTIVATION-F-STATUS<br>ACC-ACTIVATION-F-VERSION | CREATE | CURRENT_ACTOR | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-PLATFORM-REVIEW-SCHOOL-SUBJECT | Approve the Platform School Subject Review | UPDATE | ACC-ACTIVATION-F-ID<br>ACC-ACTIVATION-F-SUBJECT-REF | ACC-ACTIVATION-F-COMPLETED-AXES<br>ACC-ACTIVATION-F-STATUS<br>ACC-ACTIVATION-F-VERSION | APPLICATION_SUBMITTED → SUBJECT_APPROVED | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS / ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-REJECT-SCHOOL-SUBJECT | Reject an Unverified School Subject Application | UPDATE | ACC-ACTIVATION-F-ID<br>ACC-ACTIVATION-F-SUBJECT-REF | ACC-ACTIVATION-F-STATUS<br>ACC-ACTIVATION-F-VERSION | APPLICATION_SUBMITTED → REJECTED | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-FIRST-ADMIN-ACCEPT-AUTHORIZATION | Accept the First School Administrator Authorization | UPDATE | ACC-ACTIVATION-F-ID<br>ACC-ACTIVATION-F-FIRST-ADMIN-ID | ACC-ACTIVATION-F-COMPLETED-AXES<br>ACC-ACTIVATION-F-STATUS<br>ACC-ACTIVATION-F-VERSION | SUBJECT_APPROVED → FIRST_ADMIN_ACCEPTED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-VALIDATE-SCHOOL-INITIALIZATION | Validate Complete School Initialization | UPDATE | ACC-ACTIVATION-F-ID<br>ACC-ACTIVATION-F-INITIALIZATION-EVIDENCE<br>ACC-ACTIVATION-F-SUBSCRIPTION-READY<br>ACC-ACTIVATION-F-CLASS-COURSE-READY | ACC-ACTIVATION-F-COMPLETED-AXES<br>ACC-ACTIVATION-F-STATUS<br>ACC-ACTIVATION-F-VERSION | FIRST_ADMIN_ACCEPTED → INITIALIZATION_VALIDATED | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS / ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-ACTIVATE-SCHOOL-TEACHING | Activate School Teaching | UPDATE | ACC-ACTIVATION-F-ID<br>ACC-ACTIVATION-F-APPLICATION-REF<br>ACC-ACTIVATION-F-APPLICATION-VERSION<br>ACC-ACTIVATION-F-SCHOOL-REF<br>ACC-ACTIVATION-F-SCHOOL-VERSION<br>ACC-ACTIVATION-F-INITIALIZATION-REF<br>ACC-ACTIVATION-F-INITIALIZATION-VERSION<br>ACC-ACTIVATION-F-SUBSCRIPTION-REF<br>ACC-ACTIVATION-F-SUBSCRIPTION-VERSION<br>ACC-ACTIVATION-F-CLASS-COURSE-REF<br>ACC-ACTIVATION-F-CLASS-COURSE-VERSION | ACC-ACTIVATION-F-COMPLETED-AXES<br>ACC-ACTIVATION-F-STATUS<br>ACC-ACTIVATION-F-VERSION<br>ACC-ACTIVATION-F-APPLICATION-REF<br>ACC-ACTIVATION-F-APPLICATION-VERSION<br>ACC-ACTIVATION-F-SCHOOL-REF<br>ACC-ACTIVATION-F-SCHOOL-VERSION<br>ACC-ACTIVATION-F-INITIALIZATION-REF<br>ACC-ACTIVATION-F-INITIALIZATION-VERSION<br>ACC-ACTIVATION-F-SUBSCRIPTION-REF<br>ACC-ACTIVATION-F-SUBSCRIPTION-VERSION<br>ACC-ACTIVATION-F-CLASS-COURSE-REF<br>ACC-ACTIVATION-F-CLASS-COURSE-VERSION | INITIALIZATION_VALIDATED → TEACHING_ACTIVE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-PLATFORM-IDENTITY Platform Identity Lifecycle and Full Deletion

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-PLATFORM-IDENTITY | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-ID | Platform Identity Number | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must be unique and immutable only while this identity exists; it is never reused, and later registration after deletion creates a new number |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-CLAIM-DIGEST | Verified Natural-person Claim Digest | STRING | 是 | USER_INPUT | IMMUTABLE | OWNER_ONLY | must match the declared data type and authorized object scope |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-CREATED-AT | Identity Created At | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-ID | High-impact Authorization ID | ID | 否 | OBJECT_REF: IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IMMUTABLE | AUTHORIZED_SCOPE | must resolve the exact registered high-impact authorization object and pinned version; an ordinary or unversioned ID is invalid |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-LOOKUP-MAPPING-STATUS | Recoverable Identity Lookup Mapping Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must become DELETED when full identity deletion completes and cannot later return to ACTIVE |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-STATUS | Platform Identity Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-SUBJECT-KIND | Platform Identity Subject Kind | STRING | 是 | OPTION_SET: OPT-BL2-004 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT | Versioned Teaching Facts Requiring Historical Authorship | JSON | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | for a teacher deletion, must contain only the fixed teaching fact IDs and source versions that require historical authorship; it must not contain a recoverable identity claim |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT-DIGEST | Canonical Teaching Fact Snapshot Digest | STRING | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must be the canonical digest of the exact ordered teaching fact ID and version set emitted for teacher authorship rewriting |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-DELETION-EVENT-ID | Teacher Identity Deletion Completion Event ID | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-DELETION-EVENT-VERSION | Teacher Identity Deletion Completion Event Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-DELETION-CASE-REF | Completed Student Deletion Matrix Reference | ID | required before final platform identity deletion；状态=DELETED；动作=ACC-ACT-COMPLETE-IDENTITY-DELETION | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-CASE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-DELETION-CASE-VERSION | Pinned Student Deletion Matrix Version | INTEGER | required before final platform identity deletion；状态=DELETED；动作=ACC-ACT-COMPLETE-IDENTITY-DELETION | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-VERSION | Pinned High-impact Authorization Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-REGISTER-PLATFORM-IDENTITY | Register a New Platform Natural-person Identity | CREATE | ACC-PIDENT-F-CLAIM-DIGEST<br>ACC-PIDENT-F-SUBJECT-KIND | ACC-PIDENT-F-ID<br>ACC-PIDENT-F-CREATED-AT<br>ACC-PIDENT-F-LOOKUP-MAPPING-STATUS<br>ACC-PIDENT-F-STATUS<br>ACC-PIDENT-F-VERSION<br>ACC-PIDENT-F-SUBJECT-KIND | CREATE | CURRENT_ACTOR | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-REQUEST-IDENTITY-DELETION | Request Full Platform Identity Deletion | UPDATE | ACC-PIDENT-F-ID<br>ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-ID<br>ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-VERSION | ACC-PIDENT-F-STATUS<br>ACC-PIDENT-F-VERSION<br>ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-ID<br>ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-VERSION | ACTIVE → DELETION_REQUESTED | CURRENT_ACTOR | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-FREEZE-IDENTITY-DELETION | Freeze Identity Deletion during Guardian Dispute | UPDATE | ACC-PIDENT-F-ID<br>ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-ID | ACC-PIDENT-F-STATUS<br>ACC-PIDENT-F-VERSION | DELETION_REQUESTED → DISPUTE_FROZEN | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-RESUME-IDENTITY-DELETION | Resume Identity Deletion after Dispute Resolution | UPDATE | ACC-PIDENT-F-ID<br>ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-ID | ACC-PIDENT-F-STATUS<br>ACC-PIDENT-F-VERSION | DISPUTE_FROZEN → DELETION_REQUESTED | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-COMPLETE-IDENTITY-DELETION | Complete Identity Deletion and Remove Lookup Mapping | UPDATE | ACC-PIDENT-F-ID<br>ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-ID<br>ACC-PIDENT-F-SUBJECT-KIND<br>ACC-PIDENT-F-DELETION-CASE-REF<br>ACC-PIDENT-F-DELETION-CASE-VERSION<br>ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-VERSION | ACC-PIDENT-F-LOOKUP-MAPPING-STATUS<br>ACC-PIDENT-F-STATUS<br>ACC-PIDENT-F-VERSION<br>ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT<br>ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT-DIGEST<br>ACC-PIDENT-F-DELETION-EVENT-ID<br>ACC-PIDENT-F-DELETION-EVENT-VERSION<br>ACC-PIDENT-F-DELETION-CASE-REF<br>ACC-PIDENT-F-DELETION-CASE-VERSION<br>ACC-PIDENT-F-HIGH-IMPACT-EXECUTION-ID<br>ACC-PIDENT-F-HIGH-IMPACT-EXECUTION-VERSION | DELETION_REQUESTED → DELETED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED / TEACHING_FACT_SNAPSHOT_MISMATCH / EVENT_OUTBOX_FAILED / HIGH_IMPACT_AUTHORIZATION_INVALID_REFERENCE / HIGH_IMPACT_AUTHORIZATION_NOT_AUTHORIZED / HIGH_IMPACT_AUTHORIZATION_EXPIRED / HIGH_IMPACT_AUTHORIZATION_STUDENT_MISMATCH / HIGH_IMPACT_AUTHORIZATION_ACTION_MISMATCH / HIGH_IMPACT_AUTHORIZATION_SCOPE_MISMATCH / HIGH_IMPACT_AUTHORIZATION_DISPUTED / HIGH_IMPACT_CONSUMPTION_EVENT_OUTBOX_FAILED / VIDEO_RECALL_EVENT_OUTBOX_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-LOGIN-ACCOUNT Login Account and Identifier Security

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-LOGIN-ACCOUNT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-LOGIN-ACCOUNT | ACC-LACCOUNT-F-PLATFORM-IDENTITY-ID | Bound Platform Identity ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-LOGIN-ACCOUNT | ACC-LACCOUNT-F-MOBILE | Bound Mobile Identifier | STRING | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | optional; at most one active account may bind the same mobile identifier |
| ACC-OBJ-LOGIN-ACCOUNT | ACC-LACCOUNT-F-EMAIL | Bound Email Identifier | STRING | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | optional; at most one active account may bind the same email identifier |
| ACC-OBJ-LOGIN-ACCOUNT | ACC-LACCOUNT-F-USERNAME | Bound Username Identifier | STRING | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | optional; at most one active account may bind the same username identifier |
| ACC-OBJ-LOGIN-ACCOUNT | ACC-LACCOUNT-F-STATUS | Login Account Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-CREATE-LOGIN-ACCOUNT | Create a Login Account for a Platform Identity | CREATE | ACC-LACCOUNT-F-PLATFORM-IDENTITY-ID<br>ACC-LACCOUNT-F-MOBILE<br>ACC-LACCOUNT-F-EMAIL<br>ACC-LACCOUNT-F-USERNAME | ACC-LACCOUNT-F-ID<br>ACC-LACCOUNT-F-STATUS<br>ACC-LACCOUNT-F-VERSION | CREATE | CURRENT_ACTOR | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-UPDATE-LOGIN-IDENTIFIERS | Update Controlled Login Identifiers | UPDATE | ACC-LACCOUNT-F-ID<br>ACC-LACCOUNT-F-MOBILE<br>ACC-LACCOUNT-F-EMAIL<br>ACC-LACCOUNT-F-USERNAME | ACC-LACCOUNT-F-STATUS<br>ACC-LACCOUNT-F-VERSION | ACTIVE → ACTIVE | CURRENT_ACTOR | ROLE-GUARDIAN / ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-LOCK-LOGIN-ACCOUNT | Lock a Compromised Login Account | UPDATE | ACC-LACCOUNT-F-ID | ACC-LACCOUNT-F-STATUS<br>ACC-LACCOUNT-F-VERSION | ACTIVE → LOCKED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-UNLOCK-LOGIN-ACCOUNT | Unlock a Verified Login Account | UPDATE | ACC-LACCOUNT-F-ID | ACC-LACCOUNT-F-STATUS<br>ACC-LACCOUNT-F-VERSION | LOCKED → ACTIVE | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-DELETE-LOGIN-ACCOUNT | Delete Login Credentials after Identity Deletion | UPDATE | ACC-LACCOUNT-F-ID<br>ACC-LACCOUNT-F-PLATFORM-IDENTITY-ID | ACC-LACCOUNT-F-STATUS<br>ACC-LACCOUNT-F-VERSION | ACTIVE / LOCKED → DELETED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-SCHOOL-PROFILE School Profile and Student Primary-account Claim

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-SCHOOL-PROFILE / ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-PLATFORM-IDENTITY-ID | Platform Identity ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-SCHOOL-ID | Profile School ID | ID | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-PROFILE-TYPE | School Profile Type | STRING | 是 | OPTION_SET: OPT-COM-003 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-SCHOOL-PERSON-NUMBER | School-local Student or Employee Number | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | unique only among current people in the same school and may change after transfer or departure |
| ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-EFFECTIVE-START | School Relationship Start | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-EFFECTIVE-END | School Relationship End | DATETIME | required when the school relationship ends；状态=ENDED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-STATUS | School Profile Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | ACC-PRIMARY-F-STUDENT-PROFILE-ID | Student School Profile ID | ID | 是 | OPTION_SET: OPT-COM-010 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | ACC-PRIMARY-F-LOGIN-ACCOUNT-ID | Student Login Account ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | ACC-PRIMARY-F-EFFECTIVE-AT | Primary Relation Effective At | DATETIME | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | ACC-PRIMARY-F-ENDED-AT | Primary Relation Ended At | DATETIME | required when the primary relation ends；状态=ENDED | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | ACC-PRIMARY-F-STATUS | Student Primary-account Relation Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | only one ACTIVE relation may exist for the same student profile |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-CREATE-SCHOOL-PROFILE | Create a School-specific Member Profile | CREATE | ACC-PROFILE-F-PLATFORM-IDENTITY-ID<br>ACC-PROFILE-F-SCHOOL-ID<br>ACC-PROFILE-F-PROFILE-TYPE<br>ACC-PROFILE-F-SCHOOL-PERSON-NUMBER<br>ACC-PROFILE-F-EFFECTIVE-START | ACC-PROFILE-F-ID<br>ACC-PROFILE-F-STATUS<br>ACC-PROFILE-F-VERSION | CREATE | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-ACTIVATE-SCHOOL-PROFILE | Activate a Verified School Member Profile | UPDATE | ACC-PROFILE-F-ID | ACC-PROFILE-F-STATUS<br>ACC-PROFILE-F-VERSION | PENDING → ACTIVE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-END-SCHOOL-PROFILE | End a School Member Profile without Deleting Identity | UPDATE | ACC-PROFILE-F-ID<br>ACC-PROFILE-F-EFFECTIVE-END | ACC-PROFILE-F-STATUS<br>ACC-PROFILE-F-VERSION | PENDING / ACTIVE → ENDED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-CREATE-STUDENT-PRIMARY-ACCOUNT-RELATION | Create a Student Primary-account Relation | CREATE | ACC-PRIMARY-F-STUDENT-PROFILE-ID<br>ACC-PRIMARY-F-LOGIN-ACCOUNT-ID<br>ACC-PRIMARY-F-EFFECTIVE-AT | ACC-PRIMARY-F-ID<br>ACC-PRIMARY-F-STATUS<br>ACC-PRIMARY-F-VERSION | CREATE | ROLE-SCHOOL-ADMIN | ROLE-GUARDIAN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-ACTIVATE-STUDENT-PRIMARY-ACCOUNT | Activate the Sole Student Primary Account | UPDATE | ACC-PRIMARY-F-ID | ACC-PRIMARY-F-STATUS<br>ACC-PRIMARY-F-VERSION | PENDING → ACTIVE | ROLE-SCHOOL-ADMIN | ROLE-GUARDIAN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-END-STUDENT-PRIMARY-ACCOUNT | End a Student Primary-account Relation | UPDATE | ACC-PRIMARY-F-ID<br>ACC-PRIMARY-F-ENDED-AT | ACC-PRIMARY-F-STATUS<br>ACC-PRIMARY-F-VERSION | PENDING / ACTIVE → ENDED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-ADMIN-RECOVERY Independent Administrator Recovery Authorization

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-ADMIN-RECOVERY | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-SCHOOL-ID | Recovery School ID | ID | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-REQUESTER-ID | Requesting Administrator ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-SINGLE-ADMIN | School Has One Valid Administrator | STRING | 是 | OPTION_SET: OPT-ENUM-001 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-SENSITIVE-ACTION | Requested Sensitive Action | STRING_ARRAY | 是 | OPTION_SET: OPT-COM-016 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-PLATFORM-AUTHORIZER-ID | Independent Platform Governance Authorizer ID | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | required only for the single-administrator path and must differ from the requester |
| ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-SCHOOL-CONFIRMER-IDS | Distinct School Administrator Confirmer IDs | STRING_ARRAY | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | required only for the dual-administrator path and must contain two distinct currently valid administrators |
| ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-EXPIRY | Recovery Authorization Expiry | DATETIME | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-STATUS | Administrator Recovery Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-REQUEST-ADMIN-RECOVERY | Request a Governed School Administrator Recovery | CREATE | ACC-RECOVERY-F-SCHOOL-ID<br>ACC-RECOVERY-F-REQUESTER-ID<br>ACC-RECOVERY-F-SINGLE-ADMIN<br>ACC-RECOVERY-F-SENSITIVE-ACTION<br>ACC-RECOVERY-F-EXPIRY | ACC-RECOVERY-F-ID<br>ACC-RECOVERY-F-STATUS<br>ACC-RECOVERY-F-VERSION | CREATE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-SECOND-AUTHORIZE-SINGLE-ADMIN-RECOVERY | Second-authorize a Single-administrator Recovery | UPDATE | ACC-RECOVERY-F-ID<br>ACC-RECOVERY-F-PLATFORM-AUTHORIZER-ID | ACC-RECOVERY-F-STATUS<br>ACC-RECOVERY-F-VERSION | REQUESTED → PLATFORM_SECOND_AUTHORIZED | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS / ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-CONFIRM-DUAL-ADMIN-RECOVERY | Confirm a Sensitive Recovery with Two School Administrators | UPDATE | ACC-RECOVERY-F-ID<br>ACC-RECOVERY-F-SCHOOL-CONFIRMER-IDS | ACC-RECOVERY-F-STATUS<br>ACC-RECOVERY-F-VERSION | REQUESTED → SCHOOL_DUAL_CONFIRMED | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-DENY-ADMIN-RECOVERY | Deny an Invalid Administrator Recovery | UPDATE | ACC-RECOVERY-F-ID | ACC-RECOVERY-F-STATUS<br>ACC-RECOVERY-F-VERSION | REQUESTED → DENIED | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-EXECUTE-ADMIN-RECOVERY | Execute an Independently Authorized Administrator Recovery | UPDATE | ACC-RECOVERY-F-ID<br>ACC-RECOVERY-F-EXPIRY | ACC-RECOVERY-F-STATUS<br>ACC-RECOVERY-F-VERSION | PLATFORM_SECOND_AUTHORIZED / SCHOOL_DUAL_CONFIRMED → EXECUTED | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-SCHOOL-GOVERNANCE-ENTITY School Entity and Governance Boundary

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-SCHOOL / ACC-OBJ-CAMPUS / ACC-OBJ-EDUCATION-GROUP / ACC-OBJ-SCHOOL-NAME-VERSION / ACC-OBJ-SCHOOL-REORGANIZATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-SCHOOL | ACC-SCHOOL-F-GOVERNANCE-BOUNDARY-ID | Independent School Governance Boundary ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL | ACC-SCHOOL-F-LEGAL-SUBJECT-REF | Verified School Legal Subject Reference | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CAMPUS | ACC-CAMPUS-F-ID | Campus ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CAMPUS | ACC-CAMPUS-F-SCHOOL-ID | Independent School Entity ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CAMPUS | ACC-CAMPUS-F-NAME | Campus Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CAMPUS | ACC-CAMPUS-F-VERSION | Campus Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-EDUCATION-GROUP | ACC-GROUP-F-ID | Education Group ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-EDUCATION-GROUP | ACC-GROUP-F-NAME | Education Group Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-EDUCATION-GROUP | ACC-GROUP-F-MEMBER-SCHOOL-IDS | Explicit Member School IDs | STRING_ARRAY | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-EDUCATION-GROUP | ACC-GROUP-F-DATA-SHARING-AUTHORIZATION-REFS | Explicit Data-sharing Authorization References | JSON | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-EDUCATION-GROUP | ACC-GROUP-F-VERSION | Education Group Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-NAME-VERSION | ACC-NAME-F-ID | School Name Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-NAME-VERSION | ACC-NAME-F-SCHOOL-ID | School Entity ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-NAME-VERSION | ACC-NAME-F-DISPLAY-NAME | School Display Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-NAME-VERSION | ACC-NAME-F-EFFECTIVE-AT | Name Effective Time | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-NAME-VERSION | ACC-NAME-F-VERSION | School Name Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-ID | School Reorganization Case ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-KIND | Reorganization Kind | STRING | 是 | OPTION_SET: OPT-BL2-016 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-SOURCE-SCHOOL-IDS | Source School Entity IDs | STRING_ARRAY | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-TARGET-SCHOOL-IDS | Target School Entity IDs | STRING_ARRAY | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-DATA-MIGRATION-AUTHORIZATION | Object-level Data Migration Authorization | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-STATUS | Reorganization Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-VERSION | Reorganization Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-REGISTER-CAMPUS | Register a Campus without Merging School Data Boundaries | CREATE | ACC-CAMPUS-F-SCHOOL-ID<br>ACC-CAMPUS-F-NAME | ACC-CAMPUS-F-ID<br>ACC-CAMPUS-F-VERSION | CREATE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-REGISTER-EDUCATION-GROUP | Register an Education Group with Explicit Member Schools | CREATE | ACC-GROUP-F-NAME<br>ACC-GROUP-F-MEMBER-SCHOOL-IDS | ACC-GROUP-F-ID<br>ACC-GROUP-F-DATA-SHARING-AUTHORIZATION-REFS<br>ACC-GROUP-F-VERSION | CREATE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-RECORD-SCHOOL-NAME-VERSION | Record a School Name Version without Changing Identity | CREATE | ACC-NAME-F-SCHOOL-ID<br>ACC-NAME-F-DISPLAY-NAME<br>ACC-NAME-F-EFFECTIVE-AT | ACC-NAME-F-ID<br>ACC-NAME-F-VERSION | CREATE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-REQUEST-SCHOOL-REORGANIZATION | Record a Governed School Reorganization Case | CREATE | ACC-REORG-F-KIND<br>ACC-REORG-F-SOURCE-SCHOOL-IDS<br>ACC-REORG-F-TARGET-SCHOOL-IDS<br>ACC-REORG-F-DATA-MIGRATION-AUTHORIZATION | ACC-REORG-F-ID<br>ACC-REORG-F-STATUS<br>ACC-REORG-F-VERSION | CREATE | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-AUTHORIZE-SCHOOL-REORGANIZATION | Authorize Object-level School Reorganization Effects | UPDATE | ACC-REORG-F-ID<br>ACC-REORG-F-DATA-MIGRATION-AUTHORIZATION | ACC-REORG-F-STATUS<br>ACC-REORG-F-VERSION | REQUESTED → AUTHORIZED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-EXECUTE-SCHOOL-REORGANIZATION | Execute an Authorized School Reorganization | UPDATE | ACC-REORG-F-ID<br>ACC-REORG-F-DATA-MIGRATION-AUTHORIZATION | ACC-REORG-F-STATUS<br>ACC-REORG-F-VERSION | AUTHORIZED → EXECUTED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-END-CAMPUS | End a Campus Relation without Ending the School | UPDATE | ACC-CAMPUS-F-ID | ACC-CAMPUS-F-VERSION | ACTIVE → ENDED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-END-EDUCATION-GROUP | End an Education Group Relation without Ending Member Schools | UPDATE | ACC-GROUP-F-ID | ACC-GROUP-F-VERSION | ACTIVE → ENDED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-SUPERSEDE-SCHOOL-NAME | Supersede a School Name Version | UPDATE | ACC-NAME-F-ID | ACC-NAME-F-VERSION | ACTIVE → SUPERSEDED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-DENY-SCHOOL-REORGANIZATION | Deny an Unsupported School Reorganization | UPDATE | ACC-REORG-F-ID<br>ACC-REORG-F-DATA-MIGRATION-AUTHORIZATION | ACC-REORG-F-STATUS<br>ACC-REORG-F-VERSION | REQUESTED → DENIED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-RESOLVE-SCHOOL-DATA-BOUNDARY | Resolve the Independent School Data Boundary | READ | ACC-SCHOOL-F-ID<br>ACC-SCHOOL-F-SCHOOL-VERSION | ACC-SCHOOL-F-GOVERNANCE-BOUNDARY-ID<br>ACC-SCHOOL-F-LEGAL-SUBJECT-REF<br>ACC-SCHOOL-F-SCHOOL-VERSION | UNCHANGED | CURRENT_ACTOR | CURRENT_ACTOR | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / IMPLICIT_DATA_SHARING_DENIED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-SCHOOL-READINESS-AXES Independent School Readiness Axes

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-SCHOOL-APPLICATION-REVIEW / ACC-OBJ-SCHOOL-INITIALIZATION / ACC-OBJ-SCHOOL-SUBSCRIPTION / ACC-OBJ-CLASS-COURSE-READINESS | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-SCHOOL-APPLICATION-REVIEW | ACC-APPREVIEW-F-ID | School Application Review ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-APPLICATION-REVIEW | ACC-APPREVIEW-F-APPLICANT-REF | Applicant Reference | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-APPLICATION-REVIEW | ACC-APPREVIEW-F-LEGAL-SUBJECT-EVIDENCE | Legal Subject Evidence | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-APPLICATION-REVIEW | ACC-APPREVIEW-F-DECISION | Application Review Decision | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-APPLICATION-REVIEW | ACC-APPREVIEW-F-VERSION | Application Review Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-INITIALIZATION | ACC-INIT-F-ID | School Initialization ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-INITIALIZATION | ACC-INIT-F-SCHOOL-ID | School Entity ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-INITIALIZATION | ACC-INIT-F-CHECKLIST-EVIDENCE | Atomic Initialization Checklist Evidence | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-INITIALIZATION | ACC-INIT-F-STATUS | Initialization Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-INITIALIZATION | ACC-INIT-F-VERSION | Initialization Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-SUBSCRIPTION | ACC-SUBSCRIPTION-F-ID | School Subscription ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-SUBSCRIPTION | ACC-SUBSCRIPTION-F-SCHOOL-ID | School Entity ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-SUBSCRIPTION | ACC-SUBSCRIPTION-F-CONTRACT-REF | School Contract Reference | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-SUBSCRIPTION | ACC-SUBSCRIPTION-F-STATUS | Subscription Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-SCHOOL-SUBSCRIPTION | ACC-SUBSCRIPTION-F-VERSION | Subscription Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CLASS-COURSE-READINESS | ACC-READINESS-F-ID | Class and Course Readiness ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CLASS-COURSE-READINESS | ACC-READINESS-F-SCHOOL-ID | School Entity ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CLASS-COURSE-READINESS | ACC-READINESS-F-TERM-ID | Current Term ID | ID | 是 | OPTION_SET: OPT-COM-004 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CLASS-COURSE-READINESS | ACC-READINESS-F-CLASS-COURSE-EVIDENCE | Class and Course Validation Evidence | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CLASS-COURSE-READINESS | ACC-READINESS-F-STATUS | Class and Course Readiness Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-CLASS-COURSE-READINESS | ACC-READINESS-F-VERSION | Class and Course Readiness Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-CREATE-SCHOOL-APPLICATION-REVIEW | Submit an Independent School Application Review | CREATE | ACC-APPREVIEW-F-APPLICANT-REF<br>ACC-APPREVIEW-F-LEGAL-SUBJECT-EVIDENCE | ACC-APPREVIEW-F-ID<br>ACC-APPREVIEW-F-DECISION<br>ACC-APPREVIEW-F-VERSION | CREATE | CURRENT_ACTOR | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-APPROVE-SCHOOL-APPLICATION-REVIEW | Approve a Verified School Application | UPDATE | ACC-APPREVIEW-F-ID<br>ACC-APPREVIEW-F-LEGAL-SUBJECT-EVIDENCE | ACC-APPREVIEW-F-DECISION<br>ACC-APPREVIEW-F-VERSION | SUBMITTED → APPROVED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-REJECT-SCHOOL-APPLICATION-REVIEW | Reject an Unverified School Application | UPDATE | ACC-APPREVIEW-F-ID<br>ACC-APPREVIEW-F-LEGAL-SUBJECT-EVIDENCE | ACC-APPREVIEW-F-DECISION<br>ACC-APPREVIEW-F-VERSION | SUBMITTED → REJECTED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-CREATE-SCHOOL-INITIALIZATION | Create School Initialization Readiness | CREATE | ACC-INIT-F-SCHOOL-ID<br>ACC-INIT-F-CHECKLIST-EVIDENCE | ACC-INIT-F-ID<br>ACC-INIT-F-STATUS<br>ACC-INIT-F-VERSION | CREATE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-VALIDATE-INDEPENDENT-INITIALIZATION | Validate the Atomic School Initialization Checklist | UPDATE | ACC-INIT-F-ID<br>ACC-INIT-F-CHECKLIST-EVIDENCE | ACC-INIT-F-STATUS<br>ACC-INIT-F-VERSION | NOT_STARTED → VALIDATING | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-MARK-INDEPENDENT-INITIALIZATION-READY | Mark Independent Initialization Ready | UPDATE | ACC-INIT-F-ID<br>ACC-INIT-F-CHECKLIST-EVIDENCE | ACC-INIT-F-STATUS<br>ACC-INIT-F-VERSION | VALIDATING → READY | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-CREATE-SCHOOL-SUBSCRIPTION | Create Independent School Subscription Readiness | CREATE | ACC-SUBSCRIPTION-F-SCHOOL-ID<br>ACC-SUBSCRIPTION-F-CONTRACT-REF | ACC-SUBSCRIPTION-F-ID<br>ACC-SUBSCRIPTION-F-STATUS<br>ACC-SUBSCRIPTION-F-VERSION | CREATE | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-ACTIVATE-SCHOOL-SUBSCRIPTION | Activate Independent School Subscription | UPDATE | ACC-SUBSCRIPTION-F-ID<br>ACC-SUBSCRIPTION-F-CONTRACT-REF | ACC-SUBSCRIPTION-F-STATUS<br>ACC-SUBSCRIPTION-F-VERSION | PENDING → ACTIVE | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-CREATE-CLASS-COURSE-READINESS | Create Class and Course Readiness | CREATE | ACC-READINESS-F-SCHOOL-ID<br>ACC-READINESS-F-TERM-ID<br>ACC-READINESS-F-CLASS-COURSE-EVIDENCE | ACC-READINESS-F-ID<br>ACC-READINESS-F-STATUS<br>ACC-READINESS-F-VERSION | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-MARK-CLASS-COURSE-READY | Mark Class and Course Axis Ready | UPDATE | ACC-READINESS-F-ID<br>ACC-READINESS-F-CLASS-COURSE-EVIDENCE | ACC-READINESS-F-STATUS<br>ACC-READINESS-F-VERSION | NOT_READY → READY | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-BLOCK-SCHOOL-INITIALIZATION | Block Incomplete School Initialization | UPDATE | ACC-INIT-F-ID<br>ACC-INIT-F-CHECKLIST-EVIDENCE | ACC-INIT-F-STATUS<br>ACC-INIT-F-VERSION | NOT_STARTED / VALIDATING → BLOCKED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-RESTRICT-SCHOOL-SUBSCRIPTION | Restrict a School Subscription | UPDATE | ACC-SUBSCRIPTION-F-ID<br>ACC-SUBSCRIPTION-F-CONTRACT-REF | ACC-SUBSCRIPTION-F-STATUS<br>ACC-SUBSCRIPTION-F-VERSION | ACTIVE → RESTRICTED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-END-SCHOOL-SUBSCRIPTION | End a School Subscription after the Protected Exit Window | UPDATE | ACC-SUBSCRIPTION-F-ID<br>ACC-SUBSCRIPTION-F-CONTRACT-REF | ACC-SUBSCRIPTION-F-STATUS<br>ACC-SUBSCRIPTION-F-VERSION | ACTIVE / RESTRICTED → ENDED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-BLOCK-CLASS-COURSE-READINESS | Block Invalid Class and Course Readiness | UPDATE | ACC-READINESS-F-ID<br>ACC-READINESS-F-CLASS-COURSE-EVIDENCE | ACC-READINESS-F-STATUS<br>ACC-READINESS-F-VERSION | NOT_READY → BLOCKED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-STUDENT-TRANSFER-MEMBERSHIP Authoritative Student Transfer Membership Lifecycle

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | ACC-OBJ-MEMBERSHIP | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-ID | Account Membership ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-PLATFORM-IDENTITY-REF | Pinned Platform Identity Reference | ID | 否 | OBJECT_REF: ACC-OBJ-PLATFORM-IDENTITY | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION | Pinned Platform Identity Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-STUDENT-PROFILE-REF | Student Profile Reference for Student Memberships | ID | 否 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-SCHOOL-PROFILE-REF | Pinned School Profile Reference | ID | 否 | OBJECT_REF: ACC-OBJ-SCHOOL-PROFILE | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-SCHOOL-PROFILE-VERSION | Pinned School Profile Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-SCHOOL-ID | Membership School ID | STRING | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF | Pinned Transfer Authorization Reference | ID | 否 | OBJECT_REF: DGV-OBJ-TRANSFER-AUTHORIZATION | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION | Pinned Transfer Authorization Version | INTEGER | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-PREDECESSOR-REF | Pinned Predecessor Membership Reference | ID | 否 | OBJECT_REF: ACC-OBJ-MEMBERSHIP | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-PREDECESSOR-VERSION | Pinned Predecessor Membership Version | INTEGER | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-EFFECTIVE-AT | Membership Effective At | DATETIME | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-TERMINATED-AT | Membership Terminated At | DATETIME | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-JOINT-ACTIVATION-COMMIT-ID | Joint Membership and Data Authorization Activation Commit ID | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-DIRECTORY-SNAPSHOT-ID | Membership Directory Snapshot ID | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-DIRECTORY-SNAPSHOT-VERSION | Membership Directory Snapshot Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-STATE | Membership State | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-VERSION | Membership Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
