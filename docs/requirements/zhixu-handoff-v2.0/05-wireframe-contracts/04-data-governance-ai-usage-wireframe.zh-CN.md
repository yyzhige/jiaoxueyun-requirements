# DGV-001 Governance, lifecycle, transfer, export, and data rights Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | DGV-001 |
| 阶段 | 1 |
| 交付状态 | BUILD_READY |
| 页面数量 | 12 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## DGV-PAGE-POLICY School Data Governance Policy

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | DGV-OBJ-POLICY | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-POLICY | DGV-POLICY-F-VERSION | Governance Policy Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-POLICY | DGV-POLICY-F-EXPLANATION | Data Use Explanation | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-VIEW-EXPLANATION | View School Data Use Explanation | READ | DGV-POLICY-F-SCHOOL-ID | DGV-POLICY-F-EXPLANATION<br>DGV-POLICY-F-VERSION | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## DGV-PAGE-RETENTION School Activation Retention Configuration

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | DGV-OBJ-RETENTION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-RETENTION | DGV-RETENTION-F-CATEGORY | Data Category | STRING | 是 | OPTION_SET: OPT-ENUM-044 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-RETENTION | DGV-RETENTION-F-PERIOD | School-owned Retention Period | DURATION | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-RETENTION | DGV-RETENTION-F-ACTIVATED-BY | Activated By School Administrator | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-RETENTION | DGV-RETENTION-F-STATUS | Retention Configuration Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-CONFIGURE-RETENTION | Configure School Activation Retention Periods | UPDATE | DGV-RETENTION-F-CATEGORY<br>DGV-RETENTION-F-PERIOD | DGV-RETENTION-F-ACTIVATED-BY<br>DGV-RETENTION-F-STATUS | UNSET → ACTIVE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-SUPERSEDE-RETENTION | Supersede an Active Retention Configuration | UPDATE | DGV-RETENTION-F-CATEGORY | DGV-RETENTION-F-STATUS | ACTIVE → SUPERSEDED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## DGV-PAGE-AI-BOUNDARY AI Data Scope and Purpose Boundary

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | DGV-OBJ-AI-RULE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-AI-RULE | DGV-AI-F-DATA-SCOPE | Allowed AI Data Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-AI-RULE | DGV-AI-F-PURPOSE | Allowed AI Purpose | STRING | 是 | OPTION_SET: OPT-V2-CLS-002 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-AI-RULE | DGV-AI-F-MODEL-USE | Model Training Use | STRING | 是 | OPTION_SET: OPT-ENUM-045 | EDITABLE | AUTHORIZED_SCOPE | must explicitly deny model training unless separately approved |
| DGV-OBJ-AI-RULE | DGV-AI-F-STATUS | AI Data Use Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-CONFIGURE-AI-USE | Configure AI Data Use Boundary | UPDATE | DGV-AI-F-DATA-SCOPE<br>DGV-AI-F-PURPOSE<br>DGV-AI-F-MODEL-USE | DGV-AI-F-STATUS | BLOCKED_UNSET_RETENTION → ACTIVE | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-DISABLE-AI-USE | Disable an Active AI Data Use Rule | UPDATE | DGV-AI-F-ID | DGV-AI-F-STATUS | ACTIVE → DISABLED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-SUPERSEDE-AI-RULE | Supersede an AI Data Use Rule | UPDATE | DGV-AI-F-ID | DGV-AI-F-STATUS | ACTIVE / DISABLED → SUPERSEDED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## DGV-PAGE-EXPORT-REQUEST Role-separated Purpose-bound Export Request

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | DGV-OBJ-EXPORT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-AUDIENCE | Export Right Audience | STRING | 是 | OPTION_SET: OPT-GOV-006 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-SUBJECT-ID | Export Data Subject or Object Owner ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-DATA-RIGHT-ACTION | Export Data-right Action | STRING | 是 | OPTION_SET: OPT-GOV-005 | IMMUTABLE | AUTHORIZED_SCOPE | must be EXPORT |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-SCOPE | Export Object Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-PURPOSE | Export Purpose | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-SOURCE-RIGHTS | Source Rights and Third-party Privacy Constraints | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-EXPIRY | Export File Expiry | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-RESULT | Export Result | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-REQUEST-EXPORT | Request a Role-separated Purpose-bound Data Export | CREATE | DGV-EXPORT-F-AUDIENCE<br>DGV-EXPORT-F-SUBJECT-ID<br>DGV-EXPORT-F-DATA-RIGHT-ACTION<br>DGV-EXPORT-F-SCOPE<br>DGV-EXPORT-F-PURPOSE<br>DGV-EXPORT-F-SOURCE-RIGHTS<br>DGV-EXPORT-F-EXPIRY | DGV-EXPORT-F-ID<br>DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF | CREATE | CURRENT_ACTOR | ROLE-PLATFORM-OPS / ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-DOWNLOAD-ROLE-BOUND-FILE | Download an Export after Reauthorization | READ | DGV-EXPORT-F-ID<br>DGV-EXPORT-F-AUDIENCE<br>DGV-EXPORT-F-EXPIRY | DGV-EXPORT-F-RESULT | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / ANSWER_NOT_OPEN |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## DGV-PAGE-EXPORT-DECISION Sensitive Role-separated Export Approval

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | DGV-OBJ-EXPORT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-AUDIENCE | Export Right Audience | STRING | 是 | OPTION_SET: OPT-GOV-006 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-SUBJECT-ID | Export Data Subject or Object Owner ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-SCOPE | Export Object Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-PURPOSE | Export Purpose | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-APPROVER | Export Approver ID | STRING | required before APPROVED；状态=APPROVED | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-DECISION-REASON | Export Decision Reason | TEXT | required for APPROVED or DENIED；状态=APPROVED/DENIED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-AUDIT-REF | Export Audit Reference | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-APPROVE-EXPORT | Approve a Sensitive Role-separated Export | UPDATE | DGV-EXPORT-F-ID<br>DGV-EXPORT-F-AUDIENCE<br>DGV-EXPORT-F-SCOPE<br>DGV-EXPORT-F-APPROVER<br>DGV-EXPORT-F-DECISION-REASON | DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF | REQUESTED → APPROVED | ROLE-PLATFORM-GOVERNANCE / ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-DENY-EXPORT | Deny a Sensitive Role-separated Export | UPDATE | DGV-EXPORT-F-ID<br>DGV-EXPORT-F-APPROVER<br>DGV-EXPORT-F-DECISION-REASON | DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF | REQUESTED → DENIED | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## DGV-PAGE-EXPORT-RESULT Expiring Role-bound Export Result

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | DGV-OBJ-EXPORT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-AUDIENCE | Export Right Audience | STRING | 是 | OPTION_SET: OPT-GOV-006 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-SCOPE | Export Object Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-EXPIRY | Export File Expiry | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-RESULT | Export Result | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-AUDIT-REF | Export Audit Reference | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## DGV-PAGE-EXPORT-NOTIFICATION Export Result Notification

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | DGV-OBJ-EXPORT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-EXPIRY | Export File Expiry | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-RESULT | Export Result | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## DGV-PAGE-STUDENT-TRANSFER Student Transfer Authorization and Permitted Subset

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | DGV-OBJ-TRANSFER-AUTHORIZATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-STUDENT-PROFILE-ID | Transferring Student Profile ID | ID | 是 | OPTION_SET: OPT-COM-010 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-FROM-SCHOOL-ID | Old School ID | ID | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-TO-SCHOOL-ID | New School ID | ID | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-PERMITTED-SUBSET | Authorized Learning Record Subset | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must include only student- or legally guardian-authorized facts whose source rights permit migration; never the complete student database |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-SOURCE-RIGHTS | Source Rights and Material Exclusions | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must exclude school-private materials and non-transferable video while permitting only separately authorized learning facts, evidence or non-leaking summaries |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID | High-impact Authorization ID | ID | 是 | OBJECT_REF: IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IMMUTABLE | AUTHORIZED_SCOPE | must resolve the exact registered high-impact authorization object and pinned version; an ordinary or unversioned ID is invalid |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-DISPUTE-STATUS | Guardian Dispute Status | STRING | 是 | OPTION_SET: OPT-GOV-004 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-EXPIRY | Transfer Authorization Expiry | DATETIME | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-STATUS | Transfer Authorization Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-RELATIONSHIP-SCOPE | Exact Transfer Relationship Scope | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must canonically identify the current old-school relationship and the validated new-school transfer relationship intent |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION | Pinned High-impact Authorization Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-OLD-MEMBERSHIP-REF | Pinned Old-school Membership Reference | ID | 否 | OBJECT_REF: ACC-OBJ-MEMBERSHIP | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION | Pinned Old-school Membership Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF | Pinned Old-school Student Data Authorization Reference | ID | 否 | OBJECT_REF: IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION | Pinned Old-school Data Authorization Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST | Authorized Migratable Subset Digest | STRING | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST | Source Rights and Exclusion Digest | STRING | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-CUTOVER-STARTED-AT | Transfer Cutover Started At | DATETIME | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-NEW-MEMBERSHIP-REF | Activated New-school Membership Reference | ID | 否 | OBJECT_REF: ACC-OBJ-MEMBERSHIP | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-NEW-MEMBERSHIP-VERSION | Activated New-school Membership Version | INTEGER | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-REF | Activated New-school Student Data Authorization Reference | ID | 否 | OBJECT_REF: IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-VERSION | Activated New-school Data Authorization Version | INTEGER | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-JOINT-ACTIVATION-COMMIT-ID | Joint Membership and Data Authorization Activation Commit ID | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-JOINT-ACTIVATION-EFFECTIVE-AT | Joint Membership and Data Authorization Effective At | DATETIME | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-CUTOVER-COMPLETED-AT | Transfer Cutover Completed At | DATETIME | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-REQUEST-STUDENT-TRANSFER | Request a Student Transfer Authorization | CREATE | DGV-TRANSFER-F-STUDENT-PROFILE-ID<br>DGV-TRANSFER-F-FROM-SCHOOL-ID<br>DGV-TRANSFER-F-TO-SCHOOL-ID<br>DGV-TRANSFER-F-PERMITTED-SUBSET<br>DGV-TRANSFER-F-SOURCE-RIGHTS<br>DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID<br>DGV-TRANSFER-F-EXPIRY<br>DGV-TRANSFER-F-RELATIONSHIP-SCOPE<br>DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION | DGV-TRANSFER-F-ID<br>DGV-TRANSFER-F-DISPUTE-STATUS<br>DGV-TRANSFER-F-STATUS<br>DGV-TRANSFER-F-VERSION<br>DGV-TRANSFER-F-OLD-MEMBERSHIP-REF<br>DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION<br>DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF<br>DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION<br>DGV-TRANSFER-F-OLD-GUARDIAN-AUTHORIZATION-MANIFEST-DIGEST<br>DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST<br>DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST | CREATE | ROLE-GUARDIAN | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-AUTHORIZE-STUDENT-TRANSFER | Authorize the Permitted Student Transfer Subset | UPDATE | DGV-TRANSFER-F-ID<br>DGV-TRANSFER-F-PERMITTED-SUBSET<br>DGV-TRANSFER-F-SOURCE-RIGHTS<br>DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID<br>DGV-TRANSFER-F-EXPIRY<br>DGV-TRANSFER-F-STUDENT-PROFILE-ID<br>DGV-TRANSFER-F-FROM-SCHOOL-ID<br>DGV-TRANSFER-F-TO-SCHOOL-ID<br>DGV-TRANSFER-F-RELATIONSHIP-SCOPE<br>DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION<br>DGV-TRANSFER-F-OLD-MEMBERSHIP-REF<br>DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION<br>DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF<br>DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION<br>DGV-TRANSFER-F-OLD-GUARDIAN-AUTHORIZATION-MANIFEST-DIGEST<br>DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST<br>DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST | DGV-TRANSFER-F-DISPUTE-STATUS<br>DGV-TRANSFER-F-STATUS<br>DGV-TRANSFER-F-VERSION | REQUESTED → AUTHORIZED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-FREEZE-STUDENT-TRANSFER | Freeze an Unexecuted Student Transfer during Dispute | UPDATE | DGV-TRANSFER-F-ID<br>DGV-TRANSFER-F-DISPUTE-STATUS | DGV-TRANSFER-F-DISPUTE-STATUS<br>DGV-TRANSFER-F-STATUS<br>DGV-TRANSFER-F-VERSION | REQUESTED / AUTHORIZED → FROZEN | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-EXECUTE-STUDENT-TRANSFER | Execute a Student Transfer with Restricted History and Subset | UPDATE | DGV-TRANSFER-F-ID<br>DGV-TRANSFER-F-PERMITTED-SUBSET<br>DGV-TRANSFER-F-SOURCE-RIGHTS<br>DGV-TRANSFER-F-DISPUTE-STATUS<br>DGV-TRANSFER-F-EXPIRY<br>DGV-TRANSFER-F-STUDENT-PROFILE-ID<br>DGV-TRANSFER-F-FROM-SCHOOL-ID<br>DGV-TRANSFER-F-TO-SCHOOL-ID<br>DGV-TRANSFER-F-RELATIONSHIP-SCOPE<br>DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID<br>DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION<br>DGV-TRANSFER-F-OLD-MEMBERSHIP-REF<br>DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION<br>DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF<br>DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION<br>DGV-TRANSFER-F-OLD-GUARDIAN-AUTHORIZATION-MANIFEST-DIGEST<br>DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST<br>DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST | DGV-TRANSFER-F-STATUS<br>DGV-TRANSFER-F-VERSION<br>DGV-TRANSFER-F-CUTOVER-STARTED-AT<br>DGV-TRANSFER-F-HIGH-IMPACT-EXECUTION-ID<br>DGV-TRANSFER-F-HIGH-IMPACT-EXECUTION-VERSION | AUTHORIZED → CUTOVER_PENDING | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED / HIGH_IMPACT_AUTHORIZATION_INVALID_REFERENCE / HIGH_IMPACT_AUTHORIZATION_NOT_AUTHORIZED / HIGH_IMPACT_AUTHORIZATION_EXPIRED / HIGH_IMPACT_AUTHORIZATION_STUDENT_MISMATCH / HIGH_IMPACT_AUTHORIZATION_ACTION_MISMATCH / HIGH_IMPACT_AUTHORIZATION_SCOPE_MISMATCH / HIGH_IMPACT_AUTHORIZATION_DISPUTED / OLD_MEMBERSHIP_VERSION_MISMATCH / OLD_SCHOOL_AUTHORIZATION_VERSION_MISMATCH / TRANSFER_SUBSET_DIGEST_MISMATCH / TRANSFER_CUTOVER_ALREADY_STARTED / VIDEO_RECALL_EVENT_OUTBOX_FAILED |
| DGV-ACT-DENY-STUDENT-TRANSFER | Deny an Invalid Student Transfer | UPDATE | DGV-TRANSFER-F-ID<br>DGV-TRANSFER-F-SOURCE-RIGHTS | DGV-TRANSFER-F-STATUS<br>DGV-TRANSFER-F-VERSION | REQUESTED → DENIED | ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## DGV-PAGE-OLD-SCHOOL-HISTORY Restricted Old-school Identifiable History

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-STUDENT-PROFILE-ID | Departed Student Profile ID | ID | 是 | OPTION_SET: OPT-COM-010 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-SCHOOL-ID | Old School ID | ID | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-PURPOSE | Restricted Historical Access Purpose | STRING | 是 | OPTION_SET: OPT-V2-CLS-003 | EDITABLE | AUTHORIZED_SCOPE | must be original teaching, dispute handling or a legal obligation |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-ROLE-SCOPE | Restricted Old-school Role Scope | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-EXPIRY | Identifiable Access Expiry | DATETIME | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-DEIDENTIFIED-REF | Irreversibly Deidentified Result Reference | ID | required after identifiable history is deidentified；状态=DEIDENTIFIED | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-STATUS | Old-school History Access Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-REF | Pinned Completed Transfer Authorization Reference | ID | 是 | OBJECT_REF: DGV-OBJ-TRANSFER-AUTHORIZATION | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-VERSION | Pinned Completed Transfer Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-OLD-MEMBERSHIP-REF | Pinned Terminated Old-school Membership Reference | ID | 是 | OBJECT_REF: ACC-OBJ-MEMBERSHIP | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-OLD-MEMBERSHIP-VERSION | Pinned Terminated Membership Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-PERMITTED-PURPOSE-DIGEST | Purpose, Role, Object, and Time Boundary Digest | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the exact student, school, object, and source version fixed by the transfer authorization |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-VIEW-OLD-SCHOOL-RESTRICTED-HISTORY | View Restricted Old-school History for an Allowed Purpose | READ | DGV-OLDHIST-F-ID<br>DGV-OLDHIST-F-PURPOSE<br>DGV-OLDHIST-F-EXPIRY | DGV-OLDHIST-F-STUDENT-PROFILE-ID<br>DGV-OLDHIST-F-ROLE-SCOPE<br>DGV-OLDHIST-F-STATUS | UNCHANGED | ROLE-ACADEMIC | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## DGV-PAGE-DATA-CATALOG Eight-axis Data Catalog

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | DGV-OBJ-DATA-CATALOG-ENTRY | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-ID | Data Catalog Entry ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-CONTROL-SUBJECT | Governed Object Control Subject | STRING | 是 | OPTION_SET: OPT-BL2-017 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-CONTROL-SCOPE-REF | Governed Control Scope Instance | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-SOURCE-OBJECT-KIND | Source Object Kind | STRING | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-NATURE | Data Nature | STRING | 是 | OPTION_SET: OPT-BL2-003 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-DATA-SUBJECT | Data Subject | STRING | 是 | OPTION_SET: OPT-BL2-004 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-MANAGEMENT-SCOPE | Management Scope | STRING | 是 | OPTION_SET: OPT-BL2-005 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-SOURCE-RIGHTS | Source Rights Basis | STRING | 是 | OPTION_SET: OPT-BL2-006 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-PURPOSE | Authorized Purpose | STRING | 是 | OPTION_SET: OPT-BL2-007 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-SENSITIVITY | Sensitivity | STRING | 是 | OPTION_SET: OPT-BL2-008 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-PORTABILITY | Portability | STRING | 是 | OPTION_SET: OPT-BL2-009 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-LIFECYCLE | Lifecycle | STRING | 是 | OPTION_SET: OPT-BL2-010 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-REPLACEMENT-DRAFT-REF | Replacement Draft Catalog Entry | ID | 否 | OBJECT_REF: DGV-OBJ-DATA-CATALOG-ENTRY | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-REPLACEMENT-DRAFT-VERSION | Replacement Draft Catalog Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-STATUS | Catalog Entry Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-VERSION | Catalog Entry Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-REGISTER-DATA-CATALOG | Register an Eight-axis Data Catalog Entry | CREATE | DGV-CATALOG-F-CONTROL-SUBJECT<br>DGV-CATALOG-F-CONTROL-SCOPE-REF<br>DGV-CATALOG-F-SOURCE-OBJECT-KIND<br>DGV-CATALOG-F-NATURE<br>DGV-CATALOG-F-DATA-SUBJECT<br>DGV-CATALOG-F-MANAGEMENT-SCOPE<br>DGV-CATALOG-F-SOURCE-RIGHTS<br>DGV-CATALOG-F-PURPOSE<br>DGV-CATALOG-F-SENSITIVITY<br>DGV-CATALOG-F-PORTABILITY<br>DGV-CATALOG-F-LIFECYCLE | DGV-CATALOG-F-ID<br>DGV-CATALOG-F-STATUS<br>DGV-CATALOG-F-VERSION | CREATE | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-GOVERNANCE / ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-ACTIVATE-DATA-CATALOG | Activate the Initial Complete Eight-axis Data Catalog Entry | UPDATE | DGV-CATALOG-F-ID<br>DGV-CATALOG-F-CONTROL-SUBJECT<br>DGV-CATALOG-F-CONTROL-SCOPE-REF<br>DGV-CATALOG-F-SOURCE-OBJECT-KIND<br>DGV-CATALOG-F-NATURE<br>DGV-CATALOG-F-DATA-SUBJECT<br>DGV-CATALOG-F-MANAGEMENT-SCOPE<br>DGV-CATALOG-F-SOURCE-RIGHTS<br>DGV-CATALOG-F-PURPOSE<br>DGV-CATALOG-F-SENSITIVITY<br>DGV-CATALOG-F-PORTABILITY<br>DGV-CATALOG-F-LIFECYCLE | DGV-CATALOG-F-STATUS<br>DGV-CATALOG-F-VERSION | DRAFT → ACTIVE | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-GOVERNANCE / ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / ACTIVE_CATALOG_CONFLICT / AUDIT_FAILED |
| DGV-ACT-SUPERSEDE-DATA-CATALOG | Atomically Supersede the Active Catalog Entry and Activate its Replacement Draft | UPDATE | DGV-CATALOG-F-ID<br>DGV-CATALOG-F-REPLACEMENT-DRAFT-REF<br>DGV-CATALOG-F-REPLACEMENT-DRAFT-VERSION | DGV-CATALOG-F-STATUS<br>DGV-CATALOG-F-VERSION | ACTIVE → SUPERSEDED | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-GOVERNANCE / ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / ACTIVE_CATALOG_NOT_UNIQUE / REPLACEMENT_CATALOG_INVALID / AUDIT_FAILED |
| DGV-ACT-RESOLVE-DATA-CATALOG | Resolve the Unique Active Eight-axis Data Governance Classification | READ | DGV-CATALOG-F-CONTROL-SUBJECT<br>DGV-CATALOG-F-CONTROL-SCOPE-REF<br>DGV-CATALOG-F-SOURCE-OBJECT-KIND | DGV-CATALOG-F-NATURE<br>DGV-CATALOG-F-DATA-SUBJECT<br>DGV-CATALOG-F-MANAGEMENT-SCOPE<br>DGV-CATALOG-F-SOURCE-RIGHTS<br>DGV-CATALOG-F-PURPOSE<br>DGV-CATALOG-F-SENSITIVITY<br>DGV-CATALOG-F-PORTABILITY<br>DGV-CATALOG-F-LIFECYCLE | UNCHANGED | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-GOVERNANCE / ROLE-PLATFORM-GOVERNANCE | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / CATALOG_AXIS_INCOMPLETE / ACTIVE_CATALOG_NOT_UNIQUE |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## DGV-PAGE-GOVERNANCE-ACTIONS Distinct Data Governance Actions

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | DGV-OBJ-DATA-GOVERNANCE-CASE / DGV-OBJ-DATA-CATALOG-ENTRY | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-ID | Data Governance Case ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-TARGET-OBJECT-ID | Target Object ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-TARGET-OBJECT-KIND | Target Object Kind | STRING | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-TARGET-CONTROL-SCOPE-REF | Target Control Scope Instance | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-CATALOG-ENTRY-REF | Pinned Active Eight-axis Catalog Entry | ID | 是 | OBJECT_REF: DGV-OBJ-DATA-CATALOG-ENTRY | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-CATALOG-ENTRY-VERSION | Pinned Catalog Entry Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-ACTION-KIND | Governance Action Kind | STRING | 是 | OPTION_SET: OPT-BL2-011 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-LEGAL-BASIS | Verified Legal or Contractual Basis | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-DISPUTE-BASIS | Dispute or Hold Basis | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-EXECUTION-EVIDENCE | Governance Execution Evidence | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-STATUS | Governance Case Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-VERSION | Governance Case Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-CORRECT-DATA | Correct a Data Fact without Replacing History | CREATE | DGV-GOVCASE-F-TARGET-OBJECT-ID<br>DGV-GOVCASE-F-TARGET-OBJECT-KIND<br>DGV-GOVCASE-F-TARGET-CONTROL-SCOPE-REF<br>DGV-GOVCASE-F-CATALOG-ENTRY-REF<br>DGV-GOVCASE-F-CATALOG-ENTRY-VERSION<br>DGV-GOVCASE-F-ACTION-KIND<br>DGV-GOVCASE-F-LEGAL-BASIS<br>DGV-GOVCASE-F-DISPUTE-BASIS | DGV-GOVCASE-F-ID<br>DGV-GOVCASE-F-EXECUTION-EVIDENCE<br>DGV-GOVCASE-F-STATUS<br>DGV-GOVCASE-F-VERSION | CREATE | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / CATALOG_NOT_ACTIVE / CATALOG_VERSION_STALE / CATALOG_OBJECT_KIND_MISMATCH / CATALOG_SCOPE_MISMATCH / ACTIVE_CATALOG_NOT_UNIQUE / AUDIT_FAILED |
| DGV-ACT-RESTRICT-DATA-ACCESS | Restrict Access without Claiming Deletion | CREATE | DGV-GOVCASE-F-TARGET-OBJECT-ID<br>DGV-GOVCASE-F-TARGET-OBJECT-KIND<br>DGV-GOVCASE-F-TARGET-CONTROL-SCOPE-REF<br>DGV-GOVCASE-F-CATALOG-ENTRY-REF<br>DGV-GOVCASE-F-CATALOG-ENTRY-VERSION<br>DGV-GOVCASE-F-ACTION-KIND<br>DGV-GOVCASE-F-LEGAL-BASIS<br>DGV-GOVCASE-F-DISPUTE-BASIS | DGV-GOVCASE-F-ID<br>DGV-GOVCASE-F-EXECUTION-EVIDENCE<br>DGV-GOVCASE-F-STATUS<br>DGV-GOVCASE-F-VERSION | CREATE | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / CATALOG_NOT_ACTIVE / CATALOG_VERSION_STALE / CATALOG_OBJECT_KIND_MISMATCH / CATALOG_SCOPE_MISMATCH / ACTIVE_CATALOG_NOT_UNIQUE / AUDIT_FAILED |
| DGV-ACT-PHYSICALLY-DELETE-DATA | Physically Delete Product-controlled Data | CREATE | DGV-GOVCASE-F-TARGET-OBJECT-ID<br>DGV-GOVCASE-F-TARGET-OBJECT-KIND<br>DGV-GOVCASE-F-TARGET-CONTROL-SCOPE-REF<br>DGV-GOVCASE-F-CATALOG-ENTRY-REF<br>DGV-GOVCASE-F-CATALOG-ENTRY-VERSION<br>DGV-GOVCASE-F-ACTION-KIND<br>DGV-GOVCASE-F-LEGAL-BASIS<br>DGV-GOVCASE-F-DISPUTE-BASIS | DGV-GOVCASE-F-ID<br>DGV-GOVCASE-F-EXECUTION-EVIDENCE<br>DGV-GOVCASE-F-STATUS<br>DGV-GOVCASE-F-VERSION | CREATE | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / CATALOG_NOT_ACTIVE / CATALOG_VERSION_STALE / CATALOG_OBJECT_KIND_MISMATCH / CATALOG_SCOPE_MISMATCH / ACTIVE_CATALOG_NOT_UNIQUE / AUDIT_FAILED |
| DGV-ACT-IRREVERSIBLY-DEIDENTIFY-DATA | Irreversibly Deidentify Data | CREATE | DGV-GOVCASE-F-TARGET-OBJECT-ID<br>DGV-GOVCASE-F-TARGET-OBJECT-KIND<br>DGV-GOVCASE-F-TARGET-CONTROL-SCOPE-REF<br>DGV-GOVCASE-F-CATALOG-ENTRY-REF<br>DGV-GOVCASE-F-CATALOG-ENTRY-VERSION<br>DGV-GOVCASE-F-ACTION-KIND<br>DGV-GOVCASE-F-LEGAL-BASIS<br>DGV-GOVCASE-F-DISPUTE-BASIS | DGV-GOVCASE-F-ID<br>DGV-GOVCASE-F-EXECUTION-EVIDENCE<br>DGV-GOVCASE-F-STATUS<br>DGV-GOVCASE-F-VERSION | CREATE | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / CATALOG_NOT_ACTIVE / CATALOG_VERSION_STALE / CATALOG_OBJECT_KIND_MISMATCH / CATALOG_SCOPE_MISMATCH / ACTIVE_CATALOG_NOT_UNIQUE / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## DGV-PAGE-STUDENT-DELETION-MATRIX Student Object-level Deletion Matrix

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | DGV-OBJ-STUDENT-DELETION-CASE / DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT / DGV-OBJ-STUDENT-DELETION-DECISION / DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-ID | Student Deletion Case ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-PLATFORM-IDENTITY-ID | Platform Identity ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-STUDENT-PROFILE-ID | Student Profile ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-HIGH-IMPACT-AUTHORIZATION-ID | High-impact Authorization ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-LEGAL-BASIS | Case Legal Basis | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-DISPUTE-BASIS | Case Dispute or Hold Basis | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-CATEGORY-COVERAGE | Nine-category Decision Coverage | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-STATUS | Student Deletion Case Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-VERSION | Student Deletion Case Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-MATRIX-SNAPSHOT-REF | Pinned Evaluated Student Deletion Matrix Snapshot | ID | written when the evaluated matrix is finalized and retained through identity deletion release；状态=MATRIX_COMPLETE/EXECUTING/COMPLETED/FAILED；动作=DGV-ACT-FINALIZE-STUDENT-DELETION-MATRIX | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION | Pinned Evaluated Matrix Snapshot Version | INTEGER | required from matrix finalization through identity deletion release；状态=MATRIX_COMPLETE/EXECUTING/COMPLETED/FAILED；动作=DGV-ACT-FINALIZE-STUDENT-DELETION-MATRIX | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-ID | Student Deletion Inventory Snapshot ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-DELETION-CASE-REF | Pinned Student Deletion Case for Inventory | ID | 是 | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-CASE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-DELETION-CASE-VERSION | Pinned Student Deletion Case Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-SOURCE-OBJECT-SET | Exact Source-object ID Category and Version Set | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-SOURCE-OBJECT-COUNT | Source-object Count | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-SOURCE-OBJECT-DIGEST | Source-object Inventory Digest | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-CAPTURED-AT | Inventory Captured At | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-STATUS | Inventory Snapshot Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-VERSION | Inventory Snapshot Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-ID | Student Deletion Decision ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-DELETION-CASE-REF | Pinned Student Deletion Case Reference | ID | 是 | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-CASE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-DELETION-CASE-VERSION | Pinned Student Deletion Case Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-INVENTORY-REF | Pinned Student Deletion Inventory Snapshot | ID | 是 | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-INVENTORY-VERSION | Pinned Student Deletion Inventory Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-INVENTORY-ITEM-ID | Frozen Inventory Item ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-INVENTORY-ITEM-DIGEST | Frozen Inventory Item Digest | STRING | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-SOURCE-OBJECT-ID | Source Object ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-SOURCE-OBJECT-VERSION | Source Object Version | INTEGER | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-SOURCE-OBJECT-CATEGORY | Source Object Category | STRING | 是 | OPTION_SET: OPT-BL2-012 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-LEGAL-BASIS | Object-specific Legal Basis | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-DISPUTE-BASIS | Object-specific Dispute or Hold Basis | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-HIGH-IMPACT-AUTHORIZATION-ID | Object Decision Authorization ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-GOVERNANCE-ACTION | Object-specific Governance Outcome | STRING | 是 | OPTION_SET: OPT-BL2-013 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-EXECUTION-STATUS | Object Decision Execution Status | STRING | 是 | OPTION_SET: OPT-BL2-014 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-EXECUTION-EVIDENCE | Object Decision Execution Evidence | JSON | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-VERSION | Student Deletion Decision Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-ID | Student Deletion Matrix Snapshot ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-DELETION-CASE-REF | Pinned Student Deletion Case for Matrix Evaluation | ID | 是 | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-CASE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-DELETION-CASE-VERSION | Pinned Student Deletion Case Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-INVENTORY-REF | Pinned Student Deletion Inventory for Matrix Evaluation | ID | 是 | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-INVENTORY-VERSION | Pinned Student Deletion Inventory Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-INVENTORY-DIGEST | Pinned Inventory Digest | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-INVENTORY-ITEM-COUNT | Inventory Item Count | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-DECISION-VERSION-SET | Exact Decision ID and Version Set | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-DECISION-SET-DIGEST | Decision Version Set Digest | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-DECISION-COUNT | Decision Count | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-MISSING-DECISION-COUNT | Missing Decision Count | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-DUPLICATE-DECISION-COUNT | Duplicate Decision Count | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-UNAUTHORIZED-DECISION-COUNT | Unauthorized Decision Count | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-UNRESOLVED-EXECUTION-COUNT | Unresolved Execution Count | INTEGER | required when completing or blocking matrix execution；状态=COMPLETED/BLOCKED；动作=DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT/DGV-ACT-BLOCK-STUDENT-DELETION-MATRIX-SNAPSHOT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-FAILED-EXECUTION-COUNT | Failed Execution Count | INTEGER | required when completing or blocking matrix execution；状态=COMPLETED/BLOCKED；动作=DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT/DGV-ACT-BLOCK-STUDENT-DELETION-MATRIX-SNAPSHOT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-FROZEN-EXECUTION-COUNT | Frozen Execution Count | INTEGER | required when completing or blocking matrix execution；状态=COMPLETED/BLOCKED；动作=DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT/DGV-ACT-BLOCK-STUDENT-DELETION-MATRIX-SNAPSHOT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-LAWFUL-RETENTION-COUNT | Lawful Retention Decision Count | INTEGER | required when completing matrix execution；状态=COMPLETED；动作=DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-EXECUTION-DIGEST | Terminal Decision Execution Digest | STRING | required when completing matrix execution；状态=COMPLETED；动作=DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-STATUS | Deletion Matrix Snapshot Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-VERSION | Deletion Matrix Snapshot Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-SCHOOL-SCOPE | Exact School Scope at Student Deletion Request | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must be the canonical exact school scope resolved for the student deletion case |
| DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-RELATIONSHIP-SCOPE | Exact Relationship Scope at Student Deletion Request | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must be the canonical exact identity, school, guardian, and enrollment relationship scope resolved for the deletion case |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-CAPTURE-STUDENT-DELETION-INVENTORY | Capture the Exact Student Source-object Inventory | CREATE | DGV-INVENTORY-F-DELETION-CASE-REF<br>DGV-INVENTORY-F-DELETION-CASE-VERSION | DGV-INVENTORY-F-ID<br>DGV-INVENTORY-F-SOURCE-OBJECT-SET<br>DGV-INVENTORY-F-SOURCE-OBJECT-COUNT<br>DGV-INVENTORY-F-SOURCE-OBJECT-DIGEST<br>DGV-INVENTORY-F-CAPTURED-AT<br>DGV-INVENTORY-F-STATUS<br>DGV-INVENTORY-F-VERSION | CREATE | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / SOURCE_INVENTORY_INCOMPLETE / AUDIT_FAILED |
| DGV-ACT-EVALUATE-STUDENT-DELETION-MATRIX | Evaluate Exact-one Decision Coverage for the Frozen Inventory | CREATE | DGV-MATRIX-F-DELETION-CASE-REF<br>DGV-MATRIX-F-DELETION-CASE-VERSION<br>DGV-MATRIX-F-INVENTORY-REF<br>DGV-MATRIX-F-INVENTORY-VERSION | DGV-MATRIX-F-ID<br>DGV-MATRIX-F-INVENTORY-DIGEST<br>DGV-MATRIX-F-INVENTORY-ITEM-COUNT<br>DGV-MATRIX-F-DECISION-VERSION-SET<br>DGV-MATRIX-F-DECISION-SET-DIGEST<br>DGV-MATRIX-F-DECISION-COUNT<br>DGV-MATRIX-F-MISSING-DECISION-COUNT<br>DGV-MATRIX-F-DUPLICATE-DECISION-COUNT<br>DGV-MATRIX-F-UNAUTHORIZED-DECISION-COUNT<br>DGV-MATRIX-F-STATUS<br>DGV-MATRIX-F-VERSION | CREATE | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / INVENTORY_MISMATCH / MISSING_DECISION / DUPLICATE_DECISION / UNAUTHORIZED_DECISION / AUDIT_FAILED |
| DGV-ACT-START-STUDENT-DELETION-MATRIX-SNAPSHOT | Start the Evaluated Student Deletion Matrix Execution | UPDATE | DGV-MATRIX-F-ID<br>DGV-MATRIX-F-DECISION-SET-DIGEST | DGV-MATRIX-F-STATUS<br>DGV-MATRIX-F-VERSION | READY → EXECUTING | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT | Complete the Exact Decision Execution Set | UPDATE | DGV-MATRIX-F-ID<br>DGV-MATRIX-F-DECISION-SET-DIGEST | DGV-MATRIX-F-UNRESOLVED-EXECUTION-COUNT<br>DGV-MATRIX-F-FAILED-EXECUTION-COUNT<br>DGV-MATRIX-F-FROZEN-EXECUTION-COUNT<br>DGV-MATRIX-F-LAWFUL-RETENTION-COUNT<br>DGV-MATRIX-F-EXECUTION-DIGEST<br>DGV-MATRIX-F-STATUS<br>DGV-MATRIX-F-VERSION | EXECUTING → COMPLETED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / DECISION_SET_CHANGED / UNRESOLVED_DECISION / FAILED_DECISION / FROZEN_DECISION / AUDIT_FAILED |
| DGV-ACT-BLOCK-STUDENT-DELETION-MATRIX-SNAPSHOT | Block an Incomplete Failed or Frozen Matrix Execution | UPDATE | DGV-MATRIX-F-ID<br>DGV-MATRIX-F-DECISION-SET-DIGEST | DGV-MATRIX-F-UNRESOLVED-EXECUTION-COUNT<br>DGV-MATRIX-F-FAILED-EXECUTION-COUNT<br>DGV-MATRIX-F-FROZEN-EXECUTION-COUNT<br>DGV-MATRIX-F-STATUS<br>DGV-MATRIX-F-VERSION | READY / EXECUTING → BLOCKED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-REQUEST-STUDENT-DELETION | Request a High-impact Student Deletion Case | CREATE | DGV-DELCASE-F-PLATFORM-IDENTITY-ID<br>DGV-DELCASE-F-STUDENT-PROFILE-ID<br>DGV-DELCASE-F-HIGH-IMPACT-AUTHORIZATION-ID<br>DGV-DELCASE-F-LEGAL-BASIS<br>DGV-DELCASE-F-DISPUTE-BASIS<br>DGV-DELCASE-F-SCHOOL-SCOPE<br>DGV-DELCASE-F-RELATIONSHIP-SCOPE | DGV-DELCASE-F-ID<br>DGV-DELCASE-F-CATEGORY-COVERAGE<br>DGV-DELCASE-F-STATUS<br>DGV-DELCASE-F-VERSION | CREATE | CURRENT_ACTOR | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-FREEZE-STUDENT-DELETION | Freeze an Unexecuted Student Deletion during Dispute | UPDATE | DGV-DELCASE-F-ID<br>DGV-DELCASE-F-DISPUTE-BASIS | DGV-DELCASE-F-STATUS<br>DGV-DELCASE-F-VERSION | REQUESTED → FROZEN | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-RESUME-STUDENT-DELETION | Resume a Resolved Student Deletion Dispute | UPDATE | DGV-DELCASE-F-ID<br>DGV-DELCASE-F-DISPUTE-BASIS | DGV-DELCASE-F-STATUS<br>DGV-DELCASE-F-VERSION | FROZEN → REQUESTED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-FINALIZE-STUDENT-DELETION-MATRIX | Finalize an Evaluated Exact Object-level Student Deletion Matrix | UPDATE | DGV-DELCASE-F-ID<br>DGV-DELCASE-F-MATRIX-SNAPSHOT-REF<br>DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION<br>DGV-DELCASE-F-HIGH-IMPACT-AUTHORIZATION-ID<br>DGV-DELCASE-F-LEGAL-BASIS<br>DGV-DELCASE-F-DISPUTE-BASIS | DGV-DELCASE-F-MATRIX-SNAPSHOT-REF<br>DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION<br>DGV-DELCASE-F-CATEGORY-COVERAGE<br>DGV-DELCASE-F-STATUS<br>DGV-DELCASE-F-VERSION | REQUESTED → MATRIX_COMPLETE | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / MATRIX_NOT_READY / AUDIT_FAILED |
| DGV-ACT-EXECUTE-STUDENT-DELETION-MATRIX | Execute the Pinned Evaluated Student Deletion Matrix | UPDATE | DGV-DELCASE-F-ID<br>DGV-DELCASE-F-MATRIX-SNAPSHOT-REF<br>DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION | DGV-DELCASE-F-STATUS<br>DGV-DELCASE-F-VERSION | MATRIX_COMPLETE → EXECUTING | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX | Complete Student Deletion after Every Pinned Object Decision Succeeds or Is Lawfully Retained | UPDATE | DGV-DELCASE-F-ID<br>DGV-DELCASE-F-MATRIX-SNAPSHOT-REF<br>DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION | DGV-DELCASE-F-STATUS<br>DGV-DELCASE-F-VERSION | EXECUTING → COMPLETED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / MATRIX_EXECUTION_INCOMPLETE / AUDIT_FAILED |
| DGV-ACT-FAIL-STUDENT-DELETION-MATRIX | Record a Blocked Student Deletion Matrix Execution | UPDATE | DGV-DELCASE-F-ID<br>DGV-DELCASE-F-MATRIX-SNAPSHOT-REF<br>DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION | DGV-DELCASE-F-STATUS<br>DGV-DELCASE-F-VERSION | EXECUTING → FAILED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-REGISTER-STUDENT-DELETION-DECISION | Register One Inventory-bound Object-level Student Deletion Decision | CREATE | DGV-DELROW-F-DELETION-CASE-REF<br>DGV-DELROW-F-DELETION-CASE-VERSION<br>DGV-DELROW-F-INVENTORY-REF<br>DGV-DELROW-F-INVENTORY-VERSION<br>DGV-DELROW-F-INVENTORY-ITEM-ID<br>DGV-DELROW-F-INVENTORY-ITEM-DIGEST<br>DGV-DELROW-F-SOURCE-OBJECT-ID<br>DGV-DELROW-F-SOURCE-OBJECT-VERSION<br>DGV-DELROW-F-SOURCE-OBJECT-CATEGORY<br>DGV-DELROW-F-LEGAL-BASIS<br>DGV-DELROW-F-DISPUTE-BASIS<br>DGV-DELROW-F-HIGH-IMPACT-AUTHORIZATION-ID<br>DGV-DELROW-F-GOVERNANCE-ACTION | DGV-DELROW-F-ID<br>DGV-DELROW-F-EXECUTION-STATUS<br>DGV-DELROW-F-VERSION | CREATE | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / INVENTORY_ITEM_MISMATCH / AUDIT_FAILED |
| DGV-ACT-AUTHORIZE-STUDENT-DELETION-DECISION | Authorize One Object-level Student Deletion Decision | UPDATE | DGV-DELROW-F-ID<br>DGV-DELROW-F-LEGAL-BASIS<br>DGV-DELROW-F-DISPUTE-BASIS<br>DGV-DELROW-F-HIGH-IMPACT-AUTHORIZATION-ID | DGV-DELROW-F-EXECUTION-STATUS<br>DGV-DELROW-F-VERSION | PENDING → AUTHORIZED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-FREEZE-STUDENT-DELETION-DECISION | Freeze One Object Decision during Dispute | UPDATE | DGV-DELROW-F-ID<br>DGV-DELROW-F-DISPUTE-BASIS | DGV-DELROW-F-EXECUTION-STATUS<br>DGV-DELROW-F-VERSION | PENDING / AUTHORIZED → FROZEN | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-EXECUTE-STUDENT-DELETION-DECISION | Execute One Authorized Object Decision | UPDATE | DGV-DELROW-F-ID<br>DGV-DELROW-F-GOVERNANCE-ACTION | DGV-DELROW-F-EXECUTION-STATUS<br>DGV-DELROW-F-EXECUTION-EVIDENCE<br>DGV-DELROW-F-VERSION | AUTHORIZED → EXECUTING | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-COMPLETE-STUDENT-DELETION-DECISION | Complete One Object Decision with Evidence | UPDATE | DGV-DELROW-F-ID<br>DGV-DELROW-F-EXECUTION-EVIDENCE | DGV-DELROW-F-EXECUTION-STATUS<br>DGV-DELROW-F-EXECUTION-EVIDENCE<br>DGV-DELROW-F-VERSION | EXECUTING → COMPLETED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-FAIL-STUDENT-DELETION-DECISION | Record One Failed Object Decision | UPDATE | DGV-DELROW-F-ID<br>DGV-DELROW-F-EXECUTION-EVIDENCE | DGV-DELROW-F-EXECUTION-STATUS<br>DGV-DELROW-F-EXECUTION-EVIDENCE<br>DGV-DELROW-F-VERSION | EXECUTING → FAILED | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
