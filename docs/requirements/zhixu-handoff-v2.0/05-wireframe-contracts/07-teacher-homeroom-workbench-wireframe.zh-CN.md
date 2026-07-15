# TEA-001 Teacher and homeroom workbench Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | TEA-001 |
| 阶段 | 1 |
| 页面数量 | 5 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## TEA-PAGE-TODAY Teacher Today Workspace

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | TEA-OBJ-TODO-VIEW / TEA-OBJ-PREFERENCE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-ACT-QUERY-SUBJECT-TODOS | Query Assigned Subject Teacher Todos | READ | TEA-TODO-F-TEACHER-ID<br>TEA-TODO-F-SUBJECT-SCOPE<br>TEA-TODO-F-FILTER | TEA-TODO-F-SOURCE-REFS | UNCHANGED | DUTY-SUBJECT-TEACHER / DUTY-SUBJECT-LEAD | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## TEA-PAGE-QUEUE Grading and Review Queue Summary

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | TEA-OBJ-TODO-VIEW | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-ACT-QUERY-SUBJECT-TODOS | Query Assigned Subject Teacher Todos | READ | TEA-TODO-F-TEACHER-ID<br>TEA-TODO-F-SUBJECT-SCOPE<br>TEA-TODO-F-FILTER | TEA-TODO-F-SOURCE-REFS | UNCHANGED | DUTY-SUBJECT-TEACHER / DUTY-SUBJECT-LEAD | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## TEA-PAGE-HOMEROOM Homeroom Whole-subject Overview

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | TEA-OBJ-COORDINATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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
| TEA-ACT-QUERY-HOMEROOM-SUMMARY | Query Homeroom Whole-subject Summary | READ | TEA-COORD-F-CLASS-ID | TEA-COORD-F-SUBJECT-REFS | UNCHANGED | DUTY-HOMEROOM | ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-CREATE-COORDINATION | Create a Homeroom Coordination Item | CREATE | TEA-COORD-F-CLASS-ID<br>TEA-COORD-F-SUBJECT-REFS<br>TEA-COORD-F-TITLE<br>TEA-COORD-F-NOTE | TEA-COORD-F-ID<br>TEA-COORD-F-STATUS | CREATE | DUTY-HOMEROOM | DUTY-HOMEROOM | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## TEA-PAGE-COORDINATION Homeroom Coordination Detail

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | TEA-OBJ-COORDINATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | TEA-OBJ-PREFERENCE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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
| APP | 本页不登记 App 入口。 |
