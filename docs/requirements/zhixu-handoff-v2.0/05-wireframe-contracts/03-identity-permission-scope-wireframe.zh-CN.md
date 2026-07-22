# IAM-001 Relationship authorization, guardian assistance, and high-impact control Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | IAM-001 |
| 阶段 | 1 |
| 交付状态 | BUILD_READY |
| 页面数量 | 11 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## IAM-PAGE-POLICY Login Role Policy and Effective Scope

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | IAM-OBJ-ROLE-POLICY / IAM-OBJ-PERMISSION-DECISION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | IAM-OBJ-DUTY-GRANT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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
| IAM-ACT-GRANT-DUTY | Grant a Planned Teacher Duty | CREATE | IAM-DUTY-F-GRANTOR-AUTHORITY<br>IAM-DUTY-F-SUBJECT<br>IAM-DUTY-F-DUTY<br>IAM-DUTY-F-SCOPE<br>IAM-DUTY-F-ACTIONS<br>IAM-DUTY-F-EFFECTIVE<br>IAM-DUTY-F-EXPIRY<br>IAM-DUTY-F-REASON | IAM-DUTY-F-ID<br>IAM-DUTY-F-STATUS | CREATE | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / RELATIONSHIP_REQUIRED / HARD_BOUNDARY_DENIED / AUDIT_FAILED |
| IAM-ACT-ACTIVATE-DUTY-GRANT | Activate a Planned Teacher Duty Grant | UPDATE | IAM-DUTY-F-ID | IAM-DUTY-F-STATUS | PLANNED → EFFECTIVE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-EXPIRE-DUTY-GRANT | Expire an Effective Teacher Duty Grant | UPDATE | IAM-DUTY-F-ID | IAM-DUTY-F-STATUS | EFFECTIVE → EXPIRED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-REVOKE-DUTY-GRANT | Revoke a Teacher Duty Grant | UPDATE | IAM-DUTY-F-ID<br>IAM-DUTY-F-REASON | IAM-DUTY-F-STATUS | PLANNED / EFFECTIVE → REVOKED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## IAM-PAGE-SCOPE-GRANT Object-level Data Scope Grant Administration

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | IAM-OBJ-SCOPE-GRANT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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
| IAM-ACT-GRANT-SCOPE | Grant a Planned Object-level Data Scope | CREATE | IAM-SCOPE-F-GRANTOR-AUTHORITY<br>IAM-SCOPE-F-SUBJECT<br>IAM-SCOPE-F-DUTY<br>IAM-SCOPE-F-SCOPE<br>IAM-SCOPE-F-ACTIONS<br>IAM-SCOPE-F-EFFECTIVE<br>IAM-SCOPE-F-EXPIRY<br>IAM-SCOPE-F-REASON | IAM-SCOPE-F-ID<br>IAM-SCOPE-F-STATUS | CREATE | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / RELATIONSHIP_REQUIRED / HARD_BOUNDARY_DENIED / AUDIT_FAILED |
| IAM-ACT-ACTIVATE-SCOPE-GRANT | Activate a Planned Data Scope Grant | UPDATE | IAM-SCOPE-F-ID | IAM-SCOPE-F-STATUS | PLANNED → EFFECTIVE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-EXPIRE-SCOPE-GRANT | Expire an Effective Data Scope Grant | UPDATE | IAM-SCOPE-F-ID | IAM-SCOPE-F-STATUS | EFFECTIVE → EXPIRED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-REVOKE-GRANT | Revoke an Effective Data Scope Grant | UPDATE | IAM-SCOPE-F-ID<br>IAM-SCOPE-F-REASON | IAM-SCOPE-F-STATUS | EFFECTIVE → REVOKED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## IAM-PAGE-TEMP-GRANT Time-bounded Temporary Grant Administration

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | IAM-OBJ-TEMP-GRANT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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
| IAM-ACT-CREATE-TEMP-GRANT | Create a Planned Time-bounded Temporary Grant | CREATE | IAM-TEMP-F-GRANTOR-AUTHORITY<br>IAM-TEMP-F-SUBJECT<br>IAM-TEMP-F-DUTY<br>IAM-TEMP-F-SCOPE<br>IAM-TEMP-F-ACTIONS<br>IAM-TEMP-F-EFFECTIVE<br>IAM-TEMP-F-EXPIRY<br>IAM-TEMP-F-REASON | IAM-TEMP-F-ID<br>IAM-TEMP-F-STATUS | CREATE | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / RELATIONSHIP_REQUIRED / HARD_BOUNDARY_DENIED / AUDIT_FAILED |
| IAM-ACT-ACTIVATE-TEMP-GRANT | Activate a Planned Temporary Grant | UPDATE | IAM-TEMP-F-ID | IAM-TEMP-F-STATUS | PLANNED → EFFECTIVE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-REVOKE-TEMP-GRANT | Revoke a Temporary Grant | UPDATE | IAM-TEMP-F-ID<br>IAM-TEMP-F-REASON | IAM-TEMP-F-STATUS | PLANNED / EFFECTIVE → REVOKED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## IAM-PAGE-REPLAY Permission Decision Replay

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | IAM-OBJ-PERMISSION-DECISION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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

## IAM-PAGE-GUARDIAN-RELATION Personal Guardian Relation Verification

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | IAM-OBJ-GUARDIAN-RELATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-OBJ-GUARDIAN-RELATION | IAM-GREL-F-GUARDIAN-ACCOUNT-ID | Guardian Account ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-GUARDIAN-RELATION | IAM-GREL-F-STUDENT-PROFILE-ID | Student Profile ID | ID | 是 | OPTION_SET: OPT-COM-010 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-GUARDIAN-RELATION | IAM-GREL-F-VERIFICATION-EVIDENCE | Guardian Verification Evidence | JSON | 是 | USER_INPUT | IMMUTABLE | OWNER_ONLY | must match the declared data type and authorized object scope |
| IAM-OBJ-GUARDIAN-RELATION | IAM-GREL-F-ASSISTANCE-STATUS | Guardian Assistance Status | STRING | 是 | OPTION_SET: OPT-GOV-003 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-GUARDIAN-RELATION | IAM-GREL-F-STATUS | Guardian Relation Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-ACT-REQUEST-GUARDIAN-RELATION | Request a Personal Guardian Relation | CREATE | IAM-GREL-F-GUARDIAN-ACCOUNT-ID<br>IAM-GREL-F-STUDENT-PROFILE-ID<br>IAM-GREL-F-VERIFICATION-EVIDENCE | IAM-GREL-F-ID<br>IAM-GREL-F-ASSISTANCE-STATUS<br>IAM-GREL-F-STATUS<br>IAM-GREL-F-VERSION | CREATE | ROLE-GUARDIAN | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-CONFIRM-GUARDIAN-RELATION | Confirm a Verified Personal Guardian Relation | UPDATE | IAM-GREL-F-ID<br>IAM-GREL-F-VERIFICATION-EVIDENCE | IAM-GREL-F-ASSISTANCE-STATUS<br>IAM-GREL-F-STATUS<br>IAM-GREL-F-VERSION | PENDING → CONFIRMED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-DISPUTE-GUARDIAN-RELATION | Dispute a Confirmed Guardian Relation | UPDATE | IAM-GREL-F-ID<br>IAM-GREL-F-VERIFICATION-EVIDENCE | IAM-GREL-F-ASSISTANCE-STATUS<br>IAM-GREL-F-STATUS<br>IAM-GREL-F-VERSION | CONFIRMED → DISPUTED | ROLE-GUARDIAN | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-END-GUARDIAN-RELATION | End a Personal Guardian Relation | UPDATE | IAM-GREL-F-ID<br>IAM-GREL-F-VERIFICATION-EVIDENCE | IAM-GREL-F-ASSISTANCE-STATUS<br>IAM-GREL-F-STATUS<br>IAM-GREL-F-VERSION | PENDING / CONFIRMED / DISPUTED → ENDED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## IAM-PAGE-SCHOOL-DATA-AUTHORIZATION School-scoped Guardian Data Authorization

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-GUARDIAN-RELATION-ID | Confirmed Guardian Relation ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-STUDENT-PROFILE-ID | Authorized Student Profile ID | ID | 是 | OPTION_SET: OPT-COM-010 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-SCHOOL-ID | Authorizing School ID | ID | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-SCOPE | Minimum School Data and Delegated Task Scope | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must exclude complete history, login identifiers, learning-state writes, public sharing and unrelated tasks |
| IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-ACTIONS | Authorized Task Assistance Actions | STRING_ARRAY | 是 | OPTION_SET: OPT-COM-016 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-EFFECTIVE | School Data Authorization Effective At | DATETIME | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-EXPIRY | School Data Authorization Expiry | DATETIME | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-STATUS | School Data Authorization Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-ACT-CREATE-SCHOOL-DATA-AUTHORIZATION | Create School-scoped Guardian Data Authorization | CREATE | IAM-SDAUTH-F-GUARDIAN-RELATION-ID<br>IAM-SDAUTH-F-STUDENT-PROFILE-ID<br>IAM-SDAUTH-F-SCHOOL-ID<br>IAM-SDAUTH-F-SCOPE<br>IAM-SDAUTH-F-ACTIONS<br>IAM-SDAUTH-F-EFFECTIVE<br>IAM-SDAUTH-F-EXPIRY | IAM-SDAUTH-F-ID<br>IAM-SDAUTH-F-STATUS<br>IAM-SDAUTH-F-VERSION | CREATE | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-ACTIVATE-SCHOOL-DATA-AUTHORIZATION | Activate School-scoped Guardian Data Authorization | UPDATE | IAM-SDAUTH-F-ID<br>IAM-SDAUTH-F-EFFECTIVE<br>IAM-SDAUTH-F-EXPIRY | IAM-SDAUTH-F-STATUS<br>IAM-SDAUTH-F-VERSION | PENDING → ACTIVE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-REVOKE-SCHOOL-DATA-AUTHORIZATION | Revoke School-scoped Guardian Data Authorization | UPDATE | IAM-SDAUTH-F-ID | IAM-SDAUTH-F-STATUS<br>IAM-SDAUTH-F-VERSION | PENDING / ACTIVE → REVOKED | ROLE-SCHOOL-ADMIN / ROLE-GUARDIAN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## IAM-PAGE-TASK-ASSISTANCE Short-lived Guardian Task Assistance

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | IAM-OBJ-TASK-ASSISTANCE-SESSION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-GUARDIAN-RELATION-ID | Confirmed Guardian Relation ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-SCHOOL-AUTHORIZATION-ID | Active School Data Authorization ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-STUDENT-PROFILE-ID | Selected Child Profile ID | ID | 是 | OPTION_SET: OPT-COM-010 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-TASK-ID | Selected Current Task ID | ID | 是 | OPTION_SET: OPT-COM-012 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-SCOPE | Current Task Minimum Necessary Scope | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-START | Assistance Session Start | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-EXPIRY | Assistance Session Expiry | DATETIME | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-GUARDIAN-PARTICIPATION | Recorded Guardian Participation Fact | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | records observed assistance without inferring cheating or independent mastery |
| IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-ASSISTANCE-STATUS | Guardian Assistance Status | STRING | 是 | OPTION_SET: OPT-GOV-003 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-STATUS | Task Assistance Session Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-ACT-OPEN-TASK-ASSISTANCE-SESSION | Open a Short-lived Task-level Guardian Assistance Session | CREATE | IAM-ASSIST-F-GUARDIAN-RELATION-ID<br>IAM-ASSIST-F-SCHOOL-AUTHORIZATION-ID<br>IAM-ASSIST-F-STUDENT-PROFILE-ID<br>IAM-ASSIST-F-TASK-ID<br>IAM-ASSIST-F-SCOPE<br>IAM-ASSIST-F-EXPIRY | IAM-ASSIST-F-ID<br>IAM-ASSIST-F-START<br>IAM-ASSIST-F-ASSISTANCE-STATUS<br>IAM-ASSIST-F-STATUS<br>IAM-ASSIST-F-VERSION | CREATE | ROLE-GUARDIAN | ROLE-GUARDIAN / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-RECORD-TASK-ASSISTANCE | Record Guardian Participation in the Current Task | UPDATE | IAM-ASSIST-F-ID<br>IAM-ASSIST-F-TASK-ID<br>IAM-ASSIST-F-GUARDIAN-PARTICIPATION | IAM-ASSIST-F-ASSISTANCE-STATUS<br>IAM-ASSIST-F-STATUS<br>IAM-ASSIST-F-VERSION | ACTIVE → ACTIVE | ROLE-GUARDIAN | ROLE-GUARDIAN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-REVOKE-TASK-ASSISTANCE-SESSION | Revoke an Active Task Assistance Session | UPDATE | IAM-ASSIST-F-ID | IAM-ASSIST-F-ASSISTANCE-STATUS<br>IAM-ASSIST-F-STATUS<br>IAM-ASSIST-F-VERSION | ACTIVE → REVOKED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## IAM-PAGE-HIGH-IMPACT-AUTHORIZATION Minor High-impact Authorization Matrix

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-STUDENT-PROFILE-ID | Affected Student Profile ID | ID | 是 | OPTION_SET: OPT-COM-010 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-ACTION | Requested Data-right or High-impact Action | STRING | 是 | OPTION_SET: OPT-GOV-005 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-IMPACT | Authorization Impact Level | STRING | 是 | OPTION_SET: OPT-GOV-002 | IMMUTABLE | AUTHORIZED_SCOPE | full deletion, cross-school migration and student-work publication must be HIGH_IMPACT or NON_DELEGABLE |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-REQUESTER-ID | High-impact Action Requester ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-VERIFIED-GUARDIAN-BASIS | Verified Guardian Authorization Basis | JSON | 是 | USER_INPUT | IMMUTABLE | OWNER_ONLY | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-STUDENT-CONSIDERATION | Student Age and Situation Consideration | JSON | 是 | USER_INPUT | IMMUTABLE | OWNER_ONLY | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-LEGAL-BASIS | Applicable Legal or Contractual Basis | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-DISPUTE-STATUS | Guardian Dispute Status | STRING | 是 | OPTION_SET: OPT-GOV-004 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-EXPIRY | High-impact Authorization Expiry | DATETIME | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-STATUS | High-impact Authorization Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-SCHOOL-SCOPE | Exact School Scope for High-impact Action | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must be a canonical exact set of the schools affected by the requested high-impact action |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-RELATIONSHIP-SCOPE | Exact Relationship Scope for High-impact Action | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must be a canonical exact set of the school, guardian, identity, enrollment, or content relationships affected by the requested action |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMPTION-KEY | Unique High-impact Authorization Consumption Key | STRING | required once the authorization version is consumed or reserved for a domain execution；状态=RESERVED/EXECUTED；动作=IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION/IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must be the canonical unique SHA256 consumption key for one authorization ID and version, action code, target and execution version |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMED-ACTION-ID | Reserved Domain Action ID | STRING | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must equal the registered domain action whose exact target reserved this authorization version |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMED-TARGET-REF | Consumed Domain Target Reference | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMED-TARGET-VERSION | Consumed Domain Target Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMED-EXECUTION-ID | Consumed Domain Execution ID | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMED-EXECUTION-VERSION | Consumed Domain Execution Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMED-AT | High-impact Authorization Consumed At | DATETIME | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-RESERVATION-ID | Authoritative Reservation ID | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must be generated by the authoritative IAM reservation CAS and remain stable for exact retries |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-RESERVATION-VERSION | Authoritative Reservation Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-RESERVED-AT | High-impact Authorization Reserved At | DATETIME | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-ACT-REQUEST-HIGH-IMPACT-AUTHORIZATION | Request a Minor High-impact Authorization | CREATE | IAM-HIAUTH-F-STUDENT-PROFILE-ID<br>IAM-HIAUTH-F-ACTION<br>IAM-HIAUTH-F-IMPACT<br>IAM-HIAUTH-F-REQUESTER-ID<br>IAM-HIAUTH-F-VERIFIED-GUARDIAN-BASIS<br>IAM-HIAUTH-F-STUDENT-CONSIDERATION<br>IAM-HIAUTH-F-LEGAL-BASIS<br>IAM-HIAUTH-F-EXPIRY<br>IAM-HIAUTH-F-SCHOOL-SCOPE<br>IAM-HIAUTH-F-RELATIONSHIP-SCOPE | IAM-HIAUTH-F-ID<br>IAM-HIAUTH-F-DISPUTE-STATUS<br>IAM-HIAUTH-F-STATUS<br>IAM-HIAUTH-F-VERSION | CREATE | CURRENT_ACTOR | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-AUTHORIZE-HIGH-IMPACT-ACTION | Authorize a Verified Minor High-impact Action | UPDATE | IAM-HIAUTH-F-ID<br>IAM-HIAUTH-F-VERIFIED-GUARDIAN-BASIS<br>IAM-HIAUTH-F-STUDENT-CONSIDERATION<br>IAM-HIAUTH-F-LEGAL-BASIS<br>IAM-HIAUTH-F-EXPIRY<br>IAM-HIAUTH-F-STUDENT-PROFILE-ID<br>IAM-HIAUTH-F-ACTION<br>IAM-HIAUTH-F-SCHOOL-SCOPE<br>IAM-HIAUTH-F-RELATIONSHIP-SCOPE | IAM-HIAUTH-F-DISPUTE-STATUS<br>IAM-HIAUTH-F-STATUS<br>IAM-HIAUTH-F-VERSION | PENDING → AUTHORIZED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-FREEZE-HIGH-IMPACT-ACTION | Freeze an Unexecuted High-impact Action during Guardian Dispute | UPDATE | IAM-HIAUTH-F-ID<br>IAM-HIAUTH-F-DISPUTE-STATUS | IAM-HIAUTH-F-DISPUTE-STATUS<br>IAM-HIAUTH-F-STATUS<br>IAM-HIAUTH-F-VERSION | PENDING / AUTHORIZED → FROZEN | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-RESUME-HIGH-IMPACT-ACTION | Resume High-impact Review after Dispute Resolution | UPDATE | IAM-HIAUTH-F-ID<br>IAM-HIAUTH-F-DISPUTE-STATUS | IAM-HIAUTH-F-DISPUTE-STATUS<br>IAM-HIAUTH-F-STATUS<br>IAM-HIAUTH-F-VERSION | FROZEN → PENDING | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-REJECT-HIGH-IMPACT-ACTION | Reject an Invalid High-impact Authorization | UPDATE | IAM-HIAUTH-F-ID<br>IAM-HIAUTH-F-LEGAL-BASIS | IAM-HIAUTH-F-STATUS<br>IAM-HIAUTH-F-VERSION | PENDING → REJECTED | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## IAM-PAGE-GUARDIAN-DISPUTE Guardian Authorization Dispute and Freeze

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | IAM-OBJ-GUARDIAN-DISPUTE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-HIGH-IMPACT-AUTHORIZATION-ID | Disputed High-impact Authorization ID | ID | 是 | OBJECT_REF: IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IMMUTABLE | AUTHORIZED_SCOPE | must resolve the exact registered high-impact authorization object and pinned version; an ordinary or unversioned ID is invalid |
| IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-RAISED-BY | Dispute Requester ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-EVIDENCE | Guardian Dispute Evidence | JSON | 是 | USER_INPUT | IMMUTABLE | OWNER_ONLY | must match the declared data type and authorized object scope |
| IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-RESOLUTION | Independent Dispute Resolution | JSON | required when the dispute is resolved or rejected；状态=RESOLVED/REJECTED | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-STATUS | Guardian Dispute Status | STRING | 是 | OPTION_SET: OPT-GOV-004 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-HIGH-IMPACT-AUTHORIZATION-VERSION | Pinned High-impact Authorization Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-ACT-RAISE-GUARDIAN-DISPUTE | Raise a Guardian Authorization Dispute | CREATE | IAM-DISPUTE-F-HIGH-IMPACT-AUTHORIZATION-ID<br>IAM-DISPUTE-F-RAISED-BY<br>IAM-DISPUTE-F-EVIDENCE<br>IAM-DISPUTE-F-HIGH-IMPACT-AUTHORIZATION-VERSION | IAM-DISPUTE-F-ID<br>IAM-DISPUTE-F-STATUS<br>IAM-DISPUTE-F-VERSION | CREATE | ROLE-GUARDIAN | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-FREEZE-GUARDIAN-DISPUTE | Apply Guardian Dispute Freeze | UPDATE | IAM-DISPUTE-F-ID<br>IAM-DISPUTE-F-HIGH-IMPACT-AUTHORIZATION-ID<br>IAM-DISPUTE-F-HIGH-IMPACT-AUTHORIZATION-VERSION | IAM-DISPUTE-F-STATUS<br>IAM-DISPUTE-F-VERSION | OPEN → FROZEN | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-RESOLVE-GUARDIAN-DISPUTE | Resolve a Guardian Authorization Dispute | UPDATE | IAM-DISPUTE-F-ID<br>IAM-DISPUTE-F-RESOLUTION | IAM-DISPUTE-F-STATUS<br>IAM-DISPUTE-F-VERSION | OPEN / FROZEN → RESOLVED | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| IAM-ACT-REJECT-GUARDIAN-DISPUTE | Reject an Unsupported Guardian Dispute | UPDATE | IAM-DISPUTE-F-ID<br>IAM-DISPUTE-F-RESOLUTION | IAM-DISPUTE-F-STATUS<br>IAM-DISPUTE-F-VERSION | OPEN → REJECTED | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## IAM-PAGE-STUDENT-SCHOOL-DATA-AUTHORIZATION Student School Data Authorization and Transfer Subset

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-ID | Student School Data Authorization ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-STUDENT-PROFILE-REF | Authorized Student Profile Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-SCHOOL-ID | Authorized School ID | ID | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-MEMBERSHIP-REF | Pinned Student School Membership Reference | ID | 是 | OBJECT_REF: ACC-OBJ-MEMBERSHIP | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-MEMBERSHIP-VERSION | Pinned Membership Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-SOURCE-TRANSFER-REF | Pinned Source Transfer Authorization Reference | ID | 否 | OBJECT_REF: DGV-OBJ-TRANSFER-AUTHORIZATION | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-SOURCE-TRANSFER-VERSION | Pinned Source Transfer Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-TERMINATION-TRANSFER-REF | Pinned Termination Transfer Authorization Reference | ID | 否 | OBJECT_REF: DGV-OBJ-TRANSFER-AUTHORIZATION | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-TERMINATION-TRANSFER-VERSION | Pinned Termination Transfer Version | INTEGER | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-PERMITTED-SUBSET | Authorized Migratable Learning Record Subset | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must be a strict subset authorized by the student or legally valid guardian and must never represent the complete student database |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-PERMITTED-SUBSET-DIGEST | Authorized Subset Digest | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-SOURCE-RIGHTS | Source Rights and Material Exclusions | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must exclude old-school private materials and every source that lacks transfer rights |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-SOURCE-RIGHTS-DIGEST | Source Rights Digest | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-EFFECTIVE-AT | Authorization Effective At | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-JOINT-ACTIVATION-COMMIT-ID | Joint Membership and Data Authorization Activation Commit ID | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-EXPIRY | Authorization Expiry or Membership End | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-REVOKED-AT | Authorization Revoked At | DATETIME | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-STATUS | Student School Data Authorization Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-VERSION | Student School Data Authorization Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
