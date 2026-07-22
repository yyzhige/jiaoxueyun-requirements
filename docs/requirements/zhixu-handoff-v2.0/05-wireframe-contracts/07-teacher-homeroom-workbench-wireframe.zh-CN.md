# TEA-001 Teacher and homeroom workbench Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | TEA-001 |
| 阶段 | 1 |
| 交付状态 | BUILD_READY |
| 页面数量 | 8 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## TEA-PAGE-TODAY Teacher Action-first Workspace

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | TEA-OBJ-TODO-VIEW / TEA-OBJ-PREFERENCE / TEA-OBJ-LINKED-TEACHING-ACTION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-OBJ-TODO-VIEW | TEA-TODO-F-SUBJECT-SCOPE | Subject Assignment Scope | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TODO-VIEW | TEA-TODO-F-SOURCE-REFS | External Todo Source References | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TODO-VIEW | TEA-TODO-F-FILTER | Todo View Filter | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-PREFERENCE | TEA-PREF-F-DEFAULT-VIEW | Default Workspace View | STRING | 是 | OPTION_SET: OPT-ENUM-046 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-TITLE | Teaching Action Title | STRING | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-DUE-AT | Teaching Action Due At | DATETIME | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-STATUS | Linked Teaching Action Status | STRING | 否 | OPTION_SET: OPT-V2-TL-011 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-ACT-QUERY-SUBJECT-TODOS | Query Assigned Subject Teacher Todos | READ | TEA-TODO-F-TEACHER-ID<br>TEA-TODO-F-SUBJECT-SCOPE<br>TEA-TODO-F-FILTER | TEA-TODO-F-SOURCE-REFS | UNCHANGED | DUTY-SUBJECT-TEACHER / DUTY-SUBJECT-LEAD | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-QUERY-ACTION-QUEUE | Query Teacher Action Queue | READ |  | TEA-ACTION-F-PROBLEM-REF<br>TEA-ACTION-F-JUDGMENT-REF<br>TEA-ACTION-F-TITLE<br>TEA-ACTION-F-OWNER-REF<br>TEA-ACTION-F-DUE-AT<br>TEA-ACTION-F-STATUS | UNCHANGED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## TEA-PAGE-QUEUE Teaching Action Queue

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | TEA-OBJ-TEACHING-PROBLEM / TEA-OBJ-TEACHER-JUDGMENT / TEA-OBJ-LINKED-TEACHING-ACTION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-STUDENT-REF | Problem Student Reference | ID | 否 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-SUBJECT-ID | Problem Subject | ID | 否 | OPTION_SET: OPT-COM-007 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-CLASS-ID | Problem Class | ID | 否 | OPTION_SET: OPT-COM-006 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-STATEMENT | Teaching Problem Statement | TEXT | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-SOURCE-REFS | Problem Evidence References | JSON | 否 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-RESPONSIBLE-TEACHER-REF | Responsible Teacher Reference | ID | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-PRIORITY | Problem Priority | STRING | 否 | OPTION_SET: OPT-ENUM-012 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-REVIEW-AT | Problem Review At | DATETIME | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-STATUS | Teaching Problem Status | STRING | 否 | OPTION_SET: OPT-V2-TL-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-RESOLUTION-EVIDENCE | Problem Resolution Evidence | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHER-JUDGMENT | TEA-JUDGMENT-F-PROBLEM-REF | Judgment Problem Reference | ID | 否 | OBJECT_REF: TEA-OBJ-TEACHING-PROBLEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHER-JUDGMENT | TEA-JUDGMENT-F-TYPE | Teacher Judgment Type | STRING | 否 | OPTION_SET: OPT-V2-TL-010 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHER-JUDGMENT | TEA-JUDGMENT-F-RATIONALE | Teacher Judgment Rationale | TEXT | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-PROBLEM-REF | Action Problem Reference | ID | 否 | OBJECT_REF: TEA-OBJ-TEACHING-PROBLEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-JUDGMENT-REF | Action Judgment Reference | ID | 否 | OBJECT_REF: TEA-OBJ-TEACHER-JUDGMENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-TITLE | Teaching Action Title | STRING | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-OWNER-REF | Teaching Action Owner | ID | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-DUE-AT | Teaching Action Due At | DATETIME | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-STATUS | Linked Teaching Action Status | STRING | 否 | OPTION_SET: OPT-V2-TL-011 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-COMPLETION-EVIDENCE | Teaching Action Completion Evidence | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-OBSERVATION-RESULT | Teaching Action Observation Result | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-ACT-CREATE-TEACHING-PROBLEM | Create a Trackable Teaching Problem | CREATE | TEA-PROBLEM-F-STUDENT-REF<br>TEA-PROBLEM-F-SUBJECT-ID<br>TEA-PROBLEM-F-CLASS-ID<br>TEA-PROBLEM-F-STATEMENT<br>TEA-PROBLEM-F-SOURCE-REFS<br>TEA-PROBLEM-F-RESPONSIBLE-TEACHER-REF<br>TEA-PROBLEM-F-PRIORITY<br>TEA-PROBLEM-F-REVIEW-AT | TEA-PROBLEM-F-ID<br>TEA-PROBLEM-F-STATUS | CREATE | DUTY-SUBJECT-TEACHER / SYSTEM | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-CONFIRM-PROBLEM | Confirm a Teaching Problem Requires Attention | UPDATE |  | TEA-PROBLEM-F-STATUS | OPEN / REOPENED → CONFIRMED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-DEFER-PROBLEM | Defer a Teaching Problem with Review Time | UPDATE | TEA-PROBLEM-F-REVIEW-AT | TEA-PROBLEM-F-REVIEW-AT<br>TEA-PROBLEM-F-STATUS | OPEN / CONFIRMED / REOPENED → DEFERRED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-OBSERVE-PROBLEM | Move a Teaching Problem to Result Observation | UPDATE | TEA-PROBLEM-F-REVIEW-AT | TEA-PROBLEM-F-REVIEW-AT<br>TEA-PROBLEM-F-STATUS | OPEN / CONFIRMED / DEFERRED / REOPENED → OBSERVING | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-RECORD-TEACHER-JUDGMENT | Record Teacher Judgment on a Teaching Problem | CREATE | TEA-JUDGMENT-F-PROBLEM-REF<br>TEA-JUDGMENT-F-TYPE<br>TEA-JUDGMENT-F-RATIONALE | TEA-JUDGMENT-F-ID<br>TEA-JUDGMENT-F-ACTOR-REF<br>TEA-JUDGMENT-F-RECORDED-AT | CREATE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / PROBLEM_NOT_ACTIVE / VERSION_CONFLICT |
| TEA-ACT-CREATE-LINKED-ACTION | Create a Linked Teaching Action | CREATE | TEA-ACTION-F-PROBLEM-REF<br>TEA-ACTION-F-JUDGMENT-REF<br>TEA-ACTION-F-TITLE<br>TEA-ACTION-F-OWNER-REF<br>TEA-ACTION-F-DUE-AT | TEA-ACTION-F-ID<br>TEA-ACTION-F-STATUS | CREATE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-PLAN-LINKED-ACTION | Plan a Linked Teaching Action | UPDATE | TEA-ACTION-F-OWNER-REF<br>TEA-ACTION-F-DUE-AT | TEA-ACTION-F-OWNER-REF<br>TEA-ACTION-F-DUE-AT<br>TEA-ACTION-F-STATUS | PROPOSED → PLANNED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-START-LINKED-ACTION | Start a Linked Teaching Action | UPDATE | TEA-ACTION-F-OWNER-REF<br>TEA-ACTION-F-DUE-AT | TEA-ACTION-F-STATUS | PROPOSED / PLANNED → IN_PROGRESS | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-COMPLETE-LINKED-ACTION | Complete a Linked Teaching Action | UPDATE | TEA-ACTION-F-COMPLETION-EVIDENCE | TEA-ACTION-F-COMPLETION-EVIDENCE<br>TEA-ACTION-F-STATUS | IN_PROGRESS → COMPLETED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-OBSERVE-LINKED-ACTION | Record Linked Action Observation | UPDATE | TEA-ACTION-F-OBSERVATION-RESULT | TEA-ACTION-F-OBSERVATION-RESULT<br>TEA-ACTION-F-STATUS | COMPLETED → OBSERVING | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-CANCEL-LINKED-ACTION | Cancel a Linked Teaching Action | UPDATE | TEA-ACTION-F-COMPLETION-EVIDENCE | TEA-ACTION-F-COMPLETION-EVIDENCE<br>TEA-ACTION-F-STATUS | PROPOSED / PLANNED / IN_PROGRESS → CANCELLED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| TEA-ACT-RESOLVE-PROBLEM-AFTER-OBSERVATION | Resolve a Teaching Problem after Observation | UPDATE | TEA-PROBLEM-F-RESOLUTION-EVIDENCE | TEA-PROBLEM-F-RESOLUTION-EVIDENCE<br>TEA-PROBLEM-F-STATUS | OPEN / CONFIRMED / DEFERRED / OBSERVING / REOPENED → RESOLVED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| TEA-ACT-REOPEN-PROBLEM | Reopen a Teaching Problem from New Evidence | UPDATE | TEA-PROBLEM-F-SOURCE-REFS<br>TEA-PROBLEM-F-REVIEW-AT | TEA-PROBLEM-F-STATUS | RESOLVED → REOPENED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-QUERY-ACTION-QUEUE | Query Teacher Action Queue | READ |  | TEA-ACTION-F-PROBLEM-REF<br>TEA-ACTION-F-JUDGMENT-REF<br>TEA-ACTION-F-TITLE<br>TEA-ACTION-F-OWNER-REF<br>TEA-ACTION-F-DUE-AT<br>TEA-ACTION-F-STATUS | UNCHANGED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## TEA-PAGE-CLASS-INSIGHT Assigned Class Teaching Insight

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | TEA-OBJ-TEACHING-PROBLEM | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-SUBJECT-ID | Problem Subject | ID | 否 | OPTION_SET: OPT-COM-007 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-CLASS-ID | Problem Class | ID | 否 | OPTION_SET: OPT-COM-006 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-STATEMENT | Teaching Problem Statement | TEXT | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-PRIORITY | Problem Priority | STRING | 否 | OPTION_SET: OPT-ENUM-012 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-STATUS | Teaching Problem Status | STRING | 否 | OPTION_SET: OPT-V2-TL-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-ACT-QUERY-CLASS-INSIGHT | Query Assigned Class Teaching Insight | READ |  | TEA-PROBLEM-F-SUBJECT-ID<br>TEA-PROBLEM-F-CLASS-ID<br>TEA-PROBLEM-F-STATEMENT<br>TEA-PROBLEM-F-PRIORITY<br>TEA-PROBLEM-F-STATUS | UNCHANGED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## TEA-PAGE-STUDENT-DETAIL Assigned Student Teaching Detail

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | TEA-OBJ-TEACHING-PROBLEM / TEA-OBJ-TEACHER-JUDGMENT / TEA-OBJ-LINKED-TEACHING-ACTION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-STUDENT-REF | Problem Student Reference | ID | 否 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-STATEMENT | Teaching Problem Statement | TEXT | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-SOURCE-REFS | Problem Evidence References | JSON | 否 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-PRIORITY | Problem Priority | STRING | 否 | OPTION_SET: OPT-ENUM-012 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-STATUS | Teaching Problem Status | STRING | 否 | OPTION_SET: OPT-V2-TL-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHER-JUDGMENT | TEA-JUDGMENT-F-TYPE | Teacher Judgment Type | STRING | 否 | OPTION_SET: OPT-V2-TL-010 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-TEACHER-JUDGMENT | TEA-JUDGMENT-F-RATIONALE | Teacher Judgment Rationale | TEXT | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-TITLE | Teaching Action Title | STRING | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-STATUS | Linked Teaching Action Status | STRING | 否 | OPTION_SET: OPT-V2-TL-011 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-OBSERVATION-RESULT | Teaching Action Observation Result | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-ACT-QUERY-STUDENT-DETAIL | Query Assigned Student Teaching Detail | READ | TEA-PROBLEM-F-STUDENT-REF | TEA-PROBLEM-F-STUDENT-REF<br>TEA-PROBLEM-F-STATEMENT<br>TEA-PROBLEM-F-SOURCE-REFS<br>TEA-PROBLEM-F-PRIORITY<br>TEA-PROBLEM-F-STATUS | UNCHANGED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## TEA-PAGE-HOMEROOM Homeroom Whole-subject Overview

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | TEA-OBJ-COORDINATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-OBJ-COORDINATION | TEA-COORD-F-CLASS-ID | Coordinated Class ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-COORDINATION | TEA-COORD-F-SUBJECT-REFS | Referenced Subject Facts | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-COORDINATION | TEA-COORD-F-TITLE | Coordination Title | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-COORDINATION | TEA-COORD-F-NOTE | Coordination Note | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-COORDINATION | TEA-COORD-F-STATUS | Coordination Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-ACT-QUERY-HOMEROOM-SUMMARY | Query Homeroom Whole-subject Summary | READ | TEA-COORD-F-CLASS-ID | TEA-COORD-F-SUBJECT-REFS | UNCHANGED | DUTY-HOMEROOM | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-CREATE-COORDINATION | Create a Homeroom Coordination Item | CREATE | TEA-COORD-F-CLASS-ID<br>TEA-COORD-F-SUBJECT-REFS<br>TEA-COORD-F-TITLE<br>TEA-COORD-F-NOTE | TEA-COORD-F-ID<br>TEA-COORD-F-STATUS | CREATE | DUTY-HOMEROOM | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## TEA-PAGE-COORDINATION Homeroom Coordination Detail

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | TEA-OBJ-COORDINATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-OBJ-COORDINATION | TEA-COORD-F-SUBJECT-REFS | Referenced Subject Facts | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-COORDINATION | TEA-COORD-F-TITLE | Coordination Title | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-COORDINATION | TEA-COORD-F-NOTE | Coordination Note | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-COORDINATION | TEA-COORD-F-STATUS | Coordination Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-ACT-UPDATE-COORDINATION | Update a Homeroom Coordination Note | UPDATE | TEA-COORD-F-ID<br>TEA-COORD-F-TITLE<br>TEA-COORD-F-NOTE | TEA-COORD-F-STATUS | OPEN → IN_PROGRESS | DUTY-HOMEROOM | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-CLOSE-COORDINATION | Close a Resolved Homeroom Coordination Item | UPDATE | TEA-COORD-F-ID<br>TEA-COORD-F-NOTE | TEA-COORD-F-STATUS | IN_PROGRESS → CLOSED | DUTY-HOMEROOM | DUTY-SUBJECT-TEACHER | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| TEA-ACT-CANCEL-COORDINATION | Cancel a Homeroom Coordination Item | UPDATE | TEA-COORD-F-ID<br>TEA-COORD-F-NOTE | TEA-COORD-F-STATUS | OPEN / IN_PROGRESS → CANCELLED | DUTY-HOMEROOM | DUTY-SUBJECT-TEACHER | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## TEA-PAGE-PREFERENCE Teacher Work Preference

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | TEA-OBJ-PREFERENCE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-OBJ-PREFERENCE | TEA-PREF-F-ID | Work Preference ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-PREFERENCE | TEA-PREF-F-DEFAULT-VIEW | Default Workspace View | STRING | 是 | OPTION_SET: OPT-ENUM-046 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-PREFERENCE | TEA-PREF-F-FILTERS | Saved Workspace Filters | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-ACT-CREATE-PREFERENCE | Create Teacher Workspace Preference | CREATE | TEA-PREF-F-DEFAULT-VIEW<br>TEA-PREF-F-FILTERS | TEA-PREF-F-ID<br>TEA-PREF-F-TEACHER-ID<br>TEA-PREF-F-DEFAULT-VIEW<br>TEA-PREF-F-FILTERS | CREATE | ROLE-TEACHER | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-UPDATE-PREFERENCE | Update Teacher Workspace Preference | UPDATE | TEA-PREF-F-ID<br>TEA-PREF-F-DEFAULT-VIEW<br>TEA-PREF-F-FILTERS | TEA-PREF-F-DEFAULT-VIEW<br>TEA-PREF-F-FILTERS | ACTIVE → ACTIVE | ROLE-TEACHER | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-SUPERSEDE-PREFERENCE | Supersede a Teacher Workspace Preference | UPDATE | TEA-PREF-F-ID | TEA-PREF-F-DEFAULT-VIEW<br>TEA-PREF-F-FILTERS | ACTIVE → SUPERSEDED | ROLE-TEACHER | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## TEA-PAGE-ROLE-EXPERIENCE Role Responsibility and Accessible Experience

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | TEA-OBJ-EXPERIENCE-RESOLUTION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-ID | Experience Resolution ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-ACTOR-ID | Current Actor ID | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-KIND | Experience Kind | STRING | 是 | OPTION_SET: OPT-BL2-001 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-DUTY-CONTEXT | Current Duty and Object Context | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-RESPONSIBILITY-DOMAINS | Resolved Responsibility Domains | STRING_ARRAY | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-RESOLVED-SURFACES | Resolved Cross-page Surfaces | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-FIXED-NAVIGATION-REQUIRED | Fixed Navigation Required | BOOLEAN | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must always be false; responsibility domains may compose across pages |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-AGE-STAGE | Age Stage | STRING | 是 | OPTION_SET: OPT-BL2-002 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-SEMANTIC-IA-VERSION | Shared Semantic Information Architecture Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-AGE-ADAPTATION | Age-adapted Language Density and Interaction | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-KEYBOARD-OPERATION | Keyboard Operation Available | BOOLEAN | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-NON-VOICE-ALTERNATIVE | Non-voice Alternative Available | BOOLEAN | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-TEXT-SCALING | Text Scaling Available | BOOLEAN | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-VISIBLE-FOCUS | Visible Focus Available | BOOLEAN | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-VERSION | Experience Resolution Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-ACT-RESOLVE-TEACHER-EXPERIENCE | Resolve Teacher Responsibility Domains and Surfaces | CREATE | TEA-EXPERIENCE-F-ACTOR-ID<br>TEA-EXPERIENCE-F-KIND<br>TEA-EXPERIENCE-F-DUTY-CONTEXT<br>TEA-EXPERIENCE-F-AGE-STAGE | TEA-EXPERIENCE-F-ID<br>TEA-EXPERIENCE-F-RESPONSIBILITY-DOMAINS<br>TEA-EXPERIENCE-F-RESOLVED-SURFACES<br>TEA-EXPERIENCE-F-FIXED-NAVIGATION-REQUIRED<br>TEA-EXPERIENCE-F-SEMANTIC-IA-VERSION<br>TEA-EXPERIENCE-F-AGE-ADAPTATION<br>TEA-EXPERIENCE-F-KEYBOARD-OPERATION<br>TEA-EXPERIENCE-F-NON-VOICE-ALTERNATIVE<br>TEA-EXPERIENCE-F-TEXT-SCALING<br>TEA-EXPERIENCE-F-VISIBLE-FOCUS<br>TEA-EXPERIENCE-F-VERSION | CREATE | ROLE-TEACHER | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-RESOLVE-SCHOOL-ADMIN-EXPERIENCE | Resolve School Administrator Responsibility Domains and Surfaces | CREATE | TEA-EXPERIENCE-F-ACTOR-ID<br>TEA-EXPERIENCE-F-KIND<br>TEA-EXPERIENCE-F-DUTY-CONTEXT<br>TEA-EXPERIENCE-F-AGE-STAGE | TEA-EXPERIENCE-F-ID<br>TEA-EXPERIENCE-F-RESPONSIBILITY-DOMAINS<br>TEA-EXPERIENCE-F-RESOLVED-SURFACES<br>TEA-EXPERIENCE-F-FIXED-NAVIGATION-REQUIRED<br>TEA-EXPERIENCE-F-SEMANTIC-IA-VERSION<br>TEA-EXPERIENCE-F-AGE-ADAPTATION<br>TEA-EXPERIENCE-F-KEYBOARD-OPERATION<br>TEA-EXPERIENCE-F-NON-VOICE-ALTERNATIVE<br>TEA-EXPERIENCE-F-TEXT-SCALING<br>TEA-EXPERIENCE-F-VISIBLE-FOCUS<br>TEA-EXPERIENCE-F-VERSION | CREATE | ROLE-SCHOOL-ADMIN | ROLE-TEACHER / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-RESOLVE-ACCESSIBLE-PRESENTATION | Resolve Age-adapted Accessible Presentation | READ | TEA-EXPERIENCE-F-ID<br>TEA-EXPERIENCE-F-AGE-STAGE | TEA-EXPERIENCE-F-SEMANTIC-IA-VERSION<br>TEA-EXPERIENCE-F-AGE-ADAPTATION<br>TEA-EXPERIENCE-F-KEYBOARD-OPERATION<br>TEA-EXPERIENCE-F-NON-VOICE-ALTERNATIVE<br>TEA-EXPERIENCE-F-TEXT-SCALING<br>TEA-EXPERIENCE-F-VISIBLE-FOCUS<br>TEA-EXPERIENCE-F-VERSION | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / ACCESSIBILITY_PROFILE_INCOMPLETE |
| TEA-ACT-INVALIDATE-EXPERIENCE-RESOLUTION | Invalidate a Stale Role Experience Resolution | UPDATE | TEA-EXPERIENCE-F-ID<br>TEA-EXPERIENCE-F-VERSION | TEA-EXPERIENCE-F-VERSION | RESOLVED → STALE | CURRENT_ACTOR | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
