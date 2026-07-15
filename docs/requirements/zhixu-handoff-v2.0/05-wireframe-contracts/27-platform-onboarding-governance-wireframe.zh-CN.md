# PLAT-001 School Onboarding Service and Support Access Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | PLAT-001 |
| 阶段 | 1 |
| 页面数量 | 2 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## PLAT-PAGE-SCHOOL-SERVICE-OPERATIONS Web School Service and Support Access Workspace

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | PLAT-OBJ-ONBOARDING-CASE / PLAT-OBJ-SERVICE-PLAN / PLAT-OBJ-POLICY-TEMPLATE / PLAT-OBJ-SUPPORT-CASE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-OBJ-ONBOARDING-CASE | PLAT-CASE-F-ID | School Onboarding Case ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-ONBOARDING-CASE | PLAT-CASE-F-SCHOOL | Onboarding School | ID | 是 | OPTION_SET: OPT-COM-002 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-ONBOARDING-CASE | PLAT-CASE-F-IMPLEMENTATION-NOTES | Onboarding Implementation Notes | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-ONBOARDING-CASE | PLAT-CASE-F-STATUS | Onboarding Case Status | STRING | 是 | OPTION_SET: OPT-EXT-015 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-ID | School Service Plan ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SCOPE | School Service Plan Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SERVICE-STATE | School Service State | STRING | 是 | OPTION_SET: OPT-EXT-008 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SCHOOL-CONFIRMED-AT | School Confirmation Time | DATETIME | required only when the school confirms the service plan；状态=CONFIRMED；动作=PLAT-ACT-CONFIRM-SERVICE-PLAN | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-POLICY-TEMPLATE | PLAT-POLICY-F-ID | School Policy Template Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-POLICY-TEMPLATE | PLAT-POLICY-F-CONTENT | School Policy Template Content | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-POLICY-TEMPLATE | PLAT-POLICY-F-VERSION | Policy Template Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-POLICY-TEMPLATE | PLAT-POLICY-F-STATUS | Policy Template Status | STRING | 是 | OPTION_SET: OPT-EXT-016 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-ID | Audited School Support Case ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-PURPOSE | Support Case Purpose | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE | Requested Support Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUDIT-REASON | Support Case Audit Reason | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUD-SESSION-REF | Pinned Audited Access Session | ID | 是 | OBJECT_REF: AUD-OBJ-ACCESS-SESSION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION | Pinned Audited Session Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID | Authorized Session Operator Projection | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-STATUS | Support Case Status | STRING | 是 | OPTION_SET: OPT-EXT-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-ACT-CREATE-ONBOARDING-CASE | Create School Onboarding Case | CREATE | PLAT-CASE-F-SCHOOL<br>PLAT-CASE-F-IMPLEMENTATION-NOTES | PLAT-CASE-F-ID<br>PLAT-CASE-F-STATUS | CREATE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-CONFIRM-ONBOARDING-CASE | Record School Onboarding Confirmation | UPDATE |  | PLAT-CASE-F-STATUS | OPEN → SCHOOL_CONFIRMED | ROLE-SCHOOL-ADMIN | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-CREATE-SERVICE-PLAN | Create School Service Plan | CREATE | PLAT-PLAN-F-SCOPE | PLAT-PLAN-F-ID<br>PLAT-PLAN-F-SERVICE-STATE | CREATE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-CONFIRM-SERVICE-PLAN | Confirm School Service Plan | UPDATE |  | PLAT-PLAN-F-SERVICE-STATE<br>PLAT-PLAN-F-SCHOOL-CONFIRMED-AT | DRAFT → CONFIRMED | ROLE-SCHOOL-ADMIN | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-ACTIVATE-SERVICE-PLAN | Activate Confirmed School Service Plan | UPDATE |  | PLAT-PLAN-F-SERVICE-STATE | CONFIRMED → ACTIVE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-CREATE-POLICY-TEMPLATE | Create School Policy Template Version | CREATE | PLAT-POLICY-F-CONTENT | PLAT-POLICY-F-ID<br>PLAT-POLICY-F-VERSION<br>PLAT-POLICY-F-STATUS | CREATE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-CONFIRM-POLICY-TEMPLATE | Confirm School Policy Template Version | UPDATE |  | PLAT-POLICY-F-VERSION<br>PLAT-POLICY-F-STATUS | DRAFT → CONFIRMED | ROLE-SCHOOL-ADMIN | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-ACTIVATE-POLICY-TEMPLATE | Activate Confirmed School Policy Template | UPDATE |  | PLAT-POLICY-F-VERSION<br>PLAT-POLICY-F-STATUS | CONFIRMED → ACTIVE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-CREATE-SUPPORT-CASE | Create an AUD-authorized Support Case | CREATE | PLAT-SUPPORT-CASE-F-PURPOSE<br>PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE<br>PLAT-SUPPORT-CASE-F-AUDIT-REASON<br>PLAT-SUPPORT-CASE-F-AUD-SESSION-REF | PLAT-SUPPORT-CASE-F-ID<br>PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION<br>PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID<br>PLAT-SUPPORT-CASE-F-STATUS | CREATE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | HIGH / REQUIRED | PERMISSION_DENIED / ACCESS_INACTIVE / ACCESS_EXPIRED / ACCESS_OTHER_RECORD / ACCESS_SCOPE_DENIED / SOURCE_VERSION_STALE / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-CLOSE-SUPPORT-CASE | Close an Audited Support Case | UPDATE |  | PLAT-SUPPORT-CASE-F-STATUS | OPEN → CLOSED | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-USE-SUPPORT-ACCESS | Use an Active AUD-authorized Support Session | READ | PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE | PLAT-SUPPORT-CASE-F-PURPOSE<br>PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE<br>PLAT-SUPPORT-CASE-F-AUDIT-REASON<br>PLAT-SUPPORT-CASE-F-AUD-SESSION-REF<br>PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION<br>PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID<br>PLAT-SUPPORT-CASE-F-STATUS | UNCHANGED | ROLE-PLATFORM-OPS | ROLE-PLATFORM-OPS / ROLE-PLATFORM-OPS / ROLE-STUDENT | HIGH / REQUIRED | PERMISSION_DENIED / NOT_FOUND / ACCESS_INACTIVE / ACCESS_EXPIRED / ACCESS_OTHER_RECORD / ACCESS_SCOPE_DENIED / SOURCE_VERSION_STALE / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## PLAT-PAGE-MOBILE-SUPPORT-CASE Mobile AUD-authorized Support Case

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| APP | PLAT-OBJ-SUPPORT-CASE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-PURPOSE | Support Case Purpose | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE | Requested Support Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUDIT-REASON | Support Case Audit Reason | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUD-SESSION-REF | Pinned Audited Access Session | ID | 是 | OBJECT_REF: AUD-OBJ-ACCESS-SESSION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION | Pinned Audited Session Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID | Authorized Session Operator Projection | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-STATUS | Support Case Status | STRING | 是 | OPTION_SET: OPT-EXT-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-ACT-CREATE-SUPPORT-CASE | Create an AUD-authorized Support Case | CREATE | PLAT-SUPPORT-CASE-F-PURPOSE<br>PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE<br>PLAT-SUPPORT-CASE-F-AUDIT-REASON<br>PLAT-SUPPORT-CASE-F-AUD-SESSION-REF | PLAT-SUPPORT-CASE-F-ID<br>PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION<br>PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID<br>PLAT-SUPPORT-CASE-F-STATUS | CREATE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | HIGH / REQUIRED | PERMISSION_DENIED / ACCESS_INACTIVE / ACCESS_EXPIRED / ACCESS_OTHER_RECORD / ACCESS_SCOPE_DENIED / SOURCE_VERSION_STALE / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 本页不登记 Web 入口。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
