# DGV-001 Governance, lifecycle, and AI data use Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | DGV-001 |
| 阶段 | 1 |
| 页面数量 | 7 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## DGV-PAGE-POLICY School Data Governance Policy

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | DGV-OBJ-POLICY | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | DGV-OBJ-RETENTION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | DGV-OBJ-AI-RULE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-AI-RULE | DGV-AI-F-DATA-SCOPE | Allowed AI Data Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-AI-RULE | DGV-AI-F-PURPOSE | Allowed AI Purpose | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
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

## DGV-PAGE-EXPORT-REQUEST Purpose-bound Export Request

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | DGV-OBJ-EXPORT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-SCOPE | Export Object Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-PURPOSE | Export Purpose | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-EXPIRY | Export File Expiry | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-RESULT | Export Result | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-REQUEST-EXPORT | Request a Purpose-bound Data Export | CREATE | DGV-EXPORT-F-SCOPE<br>DGV-EXPORT-F-PURPOSE<br>DGV-EXPORT-F-EXPIRY | DGV-EXPORT-F-ID<br>DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF | CREATE | CURRENT_ACTOR | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## DGV-PAGE-EXPORT-DECISION Sensitive Export Approval

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | DGV-OBJ-EXPORT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-SCOPE | Export Object Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-PURPOSE | Export Purpose | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-APPROVER | Export Approver ID | STRING | required before APPROVED；状态=APPROVED | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-DECISION-REASON | Export Decision Reason | TEXT | required for APPROVED or DENIED；状态=APPROVED/DENIED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| DGV-OBJ-EXPORT | DGV-EXPORT-F-AUDIT-REF | Export Audit Reference | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-APPROVE-EXPORT | Approve a Sensitive Export Request | UPDATE | DGV-EXPORT-F-ID<br>DGV-EXPORT-F-APPROVER<br>DGV-EXPORT-F-DECISION-REASON | DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF | REQUESTED → APPROVED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-DENY-EXPORT | Deny a Sensitive Export Request | UPDATE | DGV-EXPORT-F-ID<br>DGV-EXPORT-F-APPROVER<br>DGV-EXPORT-F-DECISION-REASON | DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF | REQUESTED → DENIED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## DGV-PAGE-EXPORT-RESULT Expiring Export Result

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | DGV-OBJ-EXPORT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
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

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | DGV-OBJ-EXPORT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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
