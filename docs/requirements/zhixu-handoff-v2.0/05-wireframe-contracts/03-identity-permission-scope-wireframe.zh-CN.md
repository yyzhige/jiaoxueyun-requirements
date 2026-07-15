# IAM-001 Identity, duty, and data scope Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | IAM-001 |
| 阶段 | 1 |
| 页面数量 | 5 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## IAM-PAGE-POLICY Login Role Policy and Effective Scope

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | IAM-OBJ-ROLE-POLICY / IAM-OBJ-PERMISSION-DECISION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-OBJ-ROLE-POLICY | IAM-ROLE-F-ROLE | Login Role | STRING | 是 | OPTION_SET: OPT-COM-003 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-ROLE-POLICY | IAM-ROLE-F-ACTIONS | Allowed Action Set | STRING_ARRAY | 是 | OPTION_SET: OPT-COM-016 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-ROLE-POLICY | IAM-ROLE-F-VERSION | Policy Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-SCOPE | Evaluated Object Scope | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-SOURCE-VERSIONS | Permission Source Versions | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-ACT-PREVIEW-SCOPE | Preview Effective Current Data Scope | READ | IAM-DECISION-F-SUBJECT<br>IAM-DECISION-F-ACTION | IAM-DECISION-F-SCOPE<br>IAM-DECISION-F-SOURCE-VERSIONS | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## IAM-PAGE-DUTY-GRANT Teacher Duty Grant Administration

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | IAM-OBJ-DUTY-GRANT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-GRANTOR-AUTHORITY | Grantor Authority | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-SUBJECT | Subject Account ID | STRING | 是 | OPTION_SET: OPT-COM-009 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-DUTY | Duty ID | STRING | 是 | OPTION_SET: OPT-ENUM-042 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-SCOPE | Duty Object Scope | JSON | 是 | OPTION_SET: OPT-COM-015 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-ACTIONS | Duty Granted Actions | STRING_ARRAY | 是 | OPTION_SET: OPT-COM-016 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-EFFECTIVE | Effective At | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-EXPIRY | Expires At | DATETIME | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-REASON | Grant Reason | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-STATUS | Duty Grant Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-ACT-GRANT-DUTY | Grant a Planned Teacher Duty | CREATE | IAM-DUTY-F-GRANTOR-AUTHORITY<br>IAM-DUTY-F-SUBJECT<br>IAM-DUTY-F-DUTY<br>IAM-DUTY-F-SCOPE<br>IAM-DUTY-F-ACTIONS<br>IAM-DUTY-F-EFFECTIVE<br>IAM-DUTY-F-EXPIRY<br>IAM-DUTY-F-REASON | IAM-DUTY-F-ID<br>IAM-DUTY-F-STATUS | CREATE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-ACTIVATE-DUTY-GRANT | Activate a Planned Teacher Duty Grant | UPDATE | IAM-DUTY-F-ID | IAM-DUTY-F-STATUS | PLANNED → EFFECTIVE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-EXPIRE-DUTY-GRANT | Expire an Effective Teacher Duty Grant | UPDATE | IAM-DUTY-F-ID | IAM-DUTY-F-STATUS | EFFECTIVE → EXPIRED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-REVOKE-DUTY-GRANT | Revoke a Teacher Duty Grant | UPDATE | IAM-DUTY-F-ID<br>IAM-DUTY-F-REASON | IAM-DUTY-F-STATUS | PLANNED / EFFECTIVE → REVOKED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## IAM-PAGE-SCOPE-GRANT Object-level Data Scope Grant Administration

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | IAM-OBJ-SCOPE-GRANT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-ID | Data Scope Grant ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-GRANTOR-AUTHORITY | Scope Grantor Authority | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-SUBJECT | Scope Subject ID | STRING | 是 | OPTION_SET: OPT-COM-009 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-DUTY | Target Duty ID | STRING | 是 | OPTION_SET: OPT-ENUM-042 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-SCOPE | Granted Object Scope | JSON | 是 | OPTION_SET: OPT-COM-015 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-ACTIONS | Granted Actions | STRING_ARRAY | 是 | OPTION_SET: OPT-COM-016 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-EFFECTIVE | Scope Effective At | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-EXPIRY | Scope Expires At | DATETIME | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-REASON | Scope Grant Reason | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-STATUS | Scope Grant Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-ACT-GRANT-SCOPE | Grant a Planned Object-level Data Scope | CREATE | IAM-SCOPE-F-GRANTOR-AUTHORITY<br>IAM-SCOPE-F-SUBJECT<br>IAM-SCOPE-F-DUTY<br>IAM-SCOPE-F-SCOPE<br>IAM-SCOPE-F-ACTIONS<br>IAM-SCOPE-F-EFFECTIVE<br>IAM-SCOPE-F-EXPIRY<br>IAM-SCOPE-F-REASON | IAM-SCOPE-F-ID<br>IAM-SCOPE-F-STATUS | CREATE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-ACTIVATE-SCOPE-GRANT | Activate a Planned Data Scope Grant | UPDATE | IAM-SCOPE-F-ID | IAM-SCOPE-F-STATUS | PLANNED → EFFECTIVE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-EXPIRE-SCOPE-GRANT | Expire an Effective Data Scope Grant | UPDATE | IAM-SCOPE-F-ID | IAM-SCOPE-F-STATUS | EFFECTIVE → EXPIRED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-REVOKE-GRANT | Revoke an Effective Data Scope Grant | UPDATE | IAM-SCOPE-F-ID<br>IAM-SCOPE-F-REASON | IAM-SCOPE-F-STATUS | EFFECTIVE → REVOKED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## IAM-PAGE-TEMP-GRANT Time-bounded Temporary Grant Administration

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | IAM-OBJ-TEMP-GRANT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-GRANTOR-AUTHORITY | Temporary Grantor Authority | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-SUBJECT | Temporary Subject ID | STRING | 是 | OPTION_SET: OPT-COM-009 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-DUTY | Temporary Duty ID | STRING | 是 | OPTION_SET: OPT-ENUM-042 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-SCOPE | Temporary Scope | JSON | 是 | OPTION_SET: OPT-COM-015 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-ACTIONS | Temporary Actions | STRING_ARRAY | 是 | OPTION_SET: OPT-COM-016 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-EFFECTIVE | Temporary Effective At | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-EXPIRY | Mandatory Expiry | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-REASON | Temporary Grant Reason | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-STATUS | Temporary Grant Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-ACT-CREATE-TEMP-GRANT | Create a Planned Time-bounded Temporary Grant | CREATE | IAM-TEMP-F-GRANTOR-AUTHORITY<br>IAM-TEMP-F-SUBJECT<br>IAM-TEMP-F-DUTY<br>IAM-TEMP-F-SCOPE<br>IAM-TEMP-F-ACTIONS<br>IAM-TEMP-F-EFFECTIVE<br>IAM-TEMP-F-EXPIRY<br>IAM-TEMP-F-REASON | IAM-TEMP-F-ID<br>IAM-TEMP-F-STATUS | CREATE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-ACTIVATE-TEMP-GRANT | Activate a Planned Temporary Grant | UPDATE | IAM-TEMP-F-ID | IAM-TEMP-F-STATUS | PLANNED → EFFECTIVE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-REVOKE-TEMP-GRANT | Revoke a Temporary Grant | UPDATE | IAM-TEMP-F-ID<br>IAM-TEMP-F-REASON | IAM-TEMP-F-STATUS | PLANNED / EFFECTIVE → REVOKED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## IAM-PAGE-REPLAY Permission Decision Replay

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | IAM-OBJ-PERMISSION-DECISION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-SUBJECT | Decision Subject ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-ACTION | Evaluated Action | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-RESULT | Permission Result | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-REASON | Permission Reason | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-SOURCE-VERSIONS | Permission Source Versions | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-ACT-REPLAY-DECISION | Replay a Permission Decision from Source Versions | READ | IAM-DECISION-F-ID<br>IAM-DECISION-F-SOURCE-VERSIONS | IAM-DECISION-F-RESULT<br>IAM-DECISION-F-REASON | UNCHANGED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |
