# ACC-001 School entry, login, and active context Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | ACC-001 |
| 阶段 | 1 |
| 页面数量 | 5 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## ACC-PAGE-SCHOOL-ENTRY Authorized School Selection

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | ACC-OBJ-SCHOOL | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | ACC-OBJ-MEMBERSHIP | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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
| ACC-ACT-LOGIN | Authenticate Account in Selected School | READ | ACC-MEMBER-F-ACCOUNT-ID-TYPE<br>ACC-MEMBER-F-ACCOUNT-ID<br>ACC-MEMBER-F-SCHOOL-ID | ACC-MEMBER-F-STATE | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-FIRST-ACTIVATION | Complete First Account Activation | UPDATE | ACC-MEMBER-F-ACTIVATION<br>ACC-MEMBER-F-ACCOUNT-ID-TYPE<br>ACC-MEMBER-F-ACCOUNT-ID | ACC-MEMBER-F-STATE | INVITED → ACTIVE | CURRENT_ACTOR | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-SUSPEND-MEMBERSHIP | Suspend an Active School Membership | UPDATE | ACC-MEMBER-F-ID | ACC-MEMBER-F-STATE | ACTIVE → SUSPENDED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-DEACTIVATE-MEMBERSHIP | Deactivate a School Membership | UPDATE | ACC-MEMBER-F-ID | ACC-MEMBER-F-STATE | ACTIVE / SUSPENDED → DEACTIVATED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ACC-PAGE-IDENTITY-TERM Effective Identity and Term Selection

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | ACC-OBJ-IDENTITY / ACC-OBJ-CONTEXT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | ACC-OBJ-CONTEXT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | ACC-OBJ-CONTEXT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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
