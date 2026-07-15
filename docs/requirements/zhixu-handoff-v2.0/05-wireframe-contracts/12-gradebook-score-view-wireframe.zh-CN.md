# SCO-001 Source-pinned Gradebook Views Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | SCO-001 |
| 阶段 | 1 |
| 页面数量 | 2 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## SCO-PAGE-GRADEBOOK Authorized Gradebook Projection

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | SCO-OBJ-VIEW | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCO-OBJ-VIEW | SCO-VIEW-F-ID | Gradebook View ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-STUDENT-REF | Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-RESULT-DATA-ID | Source Result Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-RESULT-REF | Source Result Reference | ID | 是 | OBJECT_REF: PUB-OBJ-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-RESULT-VERSION | Source Result Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-EVIDENCE-DATA-ID | Source Evidence Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-EVIDENCE-REF | Source Evidence Reference | ID | 是 | OBJECT_REF: INS-OBJ-EVIDENCE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-EVIDENCE-VERSION | Source Evidence Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-PLAN-DATA-ID | Source Plan Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-PLAN-REF | Source Plan Reference | ID | 是 | OBJECT_REF: PLN-OBJ-PLAN | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-PLAN-VERSION | Source Plan Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-QUERY-DEFINITION | Gradebook Query Definition | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-COLUMN-DEFINITION | Gradebook Column Definition | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-SAVED-VIEW-DEFINITION | Saved Gradebook View Definition | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-VIEW | SCO-VIEW-F-VIEW-VERSION | Gradebook View Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCO-ACT-CREATE-VIEW | Create a Source-pinned Gradebook View | CREATE | SCO-VIEW-F-STUDENT-REF<br>SCO-VIEW-F-RESULT-REF<br>SCO-VIEW-F-RESULT-VERSION<br>SCO-VIEW-F-EVIDENCE-REF<br>SCO-VIEW-F-EVIDENCE-VERSION<br>SCO-VIEW-F-PLAN-REF<br>SCO-VIEW-F-PLAN-VERSION<br>SCO-VIEW-F-QUERY-DEFINITION<br>SCO-VIEW-F-COLUMN-DEFINITION<br>SCO-VIEW-F-SAVED-VIEW-DEFINITION | SCO-VIEW-F-ID<br>SCO-VIEW-F-RESULT-DATA-ID<br>SCO-VIEW-F-EVIDENCE-DATA-ID<br>SCO-VIEW-F-PLAN-DATA-ID<br>SCO-VIEW-F-VIEW-VERSION | CREATE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCO-ACT-READ-GRADEBOOK | Read the Authorized Gradebook Projection | READ | SCO-VIEW-F-ID | SCO-VIEW-F-ID<br>SCO-VIEW-F-STUDENT-REF<br>SCO-VIEW-F-RESULT-DATA-ID<br>SCO-VIEW-F-RESULT-REF<br>SCO-VIEW-F-RESULT-VERSION<br>SCO-VIEW-F-EVIDENCE-DATA-ID<br>SCO-VIEW-F-EVIDENCE-REF<br>SCO-VIEW-F-EVIDENCE-VERSION<br>SCO-VIEW-F-PLAN-DATA-ID<br>SCO-VIEW-F-PLAN-REF<br>SCO-VIEW-F-PLAN-VERSION<br>SCO-VIEW-F-QUERY-DEFINITION<br>SCO-VIEW-F-COLUMN-DEFINITION<br>SCO-VIEW-F-SAVED-VIEW-DEFINITION<br>SCO-VIEW-F-VIEW-VERSION | UNCHANGED | DUTY-SUBJECT-TEACHER / DUTY-HOMEROOM | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## SCO-PAGE-FOLLOW-UP Gradebook Follow-up Workspace

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | SCO-OBJ-FOLLOW-UP | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-ID | Gradebook Follow-up ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-VIEW-REF | Gradebook View Reference | ID | 是 | OBJECT_REF: SCO-OBJ-VIEW | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-VIEW-VERSION | Gradebook View Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-ATTENTION-KIND | Attention Event Kind | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-NOTE | Follow-up Note | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-VERSION | Follow-up Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCO-ACT-CREATE-FOLLOW-UP | Create a Gradebook Follow-up Record | CREATE | SCO-FOLLOW-UP-F-VIEW-REF<br>SCO-FOLLOW-UP-F-VIEW-VERSION<br>SCO-FOLLOW-UP-F-ATTENTION-KIND<br>SCO-FOLLOW-UP-F-NOTE | SCO-FOLLOW-UP-F-ID<br>SCO-FOLLOW-UP-F-VERSION | CREATE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCO-ACT-VIEW-FOLLOW-UP | View Gradebook Follow-up Records | READ | SCO-FOLLOW-UP-F-ID | SCO-FOLLOW-UP-F-ID<br>SCO-FOLLOW-UP-F-VIEW-REF<br>SCO-FOLLOW-UP-F-VIEW-VERSION<br>SCO-FOLLOW-UP-F-ATTENTION-KIND<br>SCO-FOLLOW-UP-F-NOTE<br>SCO-FOLLOW-UP-F-VERSION | UNCHANGED | DUTY-SUBJECT-TEACHER / DUTY-HOMEROOM | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
