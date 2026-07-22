# STU-001 Source-pinned Student Management Profile Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | STU-001 |
| 阶段 | 1 |
| 交付状态 | BUILD_READY |
| 页面数量 | 2 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## STU-PAGE-PROFILE Authorized Student Management Profile

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | STU-OBJ-PROFILE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STU-OBJ-PROFILE | STU-PROFILE-F-ID | Student Management Profile View ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-STUDENT-REF | Managed Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-RESULT-DATA-ID | Source Result Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-RESULT-REF | Source Result Reference | ID | 是 | OBJECT_REF: PUB-OBJ-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-RESULT-VERSION | Source Result Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-EVIDENCE-DATA-ID | Source Evidence Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-EVIDENCE-REF | Source Evidence Reference | ID | 是 | OBJECT_REF: INS-OBJ-EVIDENCE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-EVIDENCE-VERSION | Source Evidence Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-PLAN-DATA-ID | Source Plan Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-PLAN-REF | Source Plan Reference | ID | 是 | OBJECT_REF: PLN-OBJ-PLAN | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-PLAN-VERSION | Source Plan Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-QUERY-DEFINITION | Student Profile Query Definition | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-COLUMN-DEFINITION | Student Profile Column Definition | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-SAVED-VIEW-DEFINITION | Saved Student Profile View Definition | JSON | required when a teacher saves a custom profile view；状态=READY；动作=STU-ACT-SAVE-VIEW | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-PROFILE | STU-PROFILE-F-PROFILE-VERSION | Student Profile View Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STU-ACT-OPEN-PROFILE | Open the Authorized Student Management Profile | READ | STU-PROFILE-F-ID | STU-PROFILE-F-ID<br>STU-PROFILE-F-STUDENT-REF<br>STU-PROFILE-F-RESULT-DATA-ID<br>STU-PROFILE-F-RESULT-REF<br>STU-PROFILE-F-RESULT-VERSION<br>STU-PROFILE-F-EVIDENCE-DATA-ID<br>STU-PROFILE-F-EVIDENCE-REF<br>STU-PROFILE-F-EVIDENCE-VERSION<br>STU-PROFILE-F-PLAN-DATA-ID<br>STU-PROFILE-F-PLAN-REF<br>STU-PROFILE-F-PLAN-VERSION<br>STU-PROFILE-F-QUERY-DEFINITION<br>STU-PROFILE-F-COLUMN-DEFINITION<br>STU-PROFILE-F-SAVED-VIEW-DEFINITION<br>STU-PROFILE-F-PROFILE-VERSION | UNCHANGED | DUTY-SUBJECT-TEACHER / DUTY-HOMEROOM | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |
| STU-ACT-SAVE-VIEW | Save a Student Profile View Definition | UPDATE | STU-PROFILE-F-SAVED-VIEW-DEFINITION | STU-PROFILE-F-SAVED-VIEW-DEFINITION<br>STU-PROFILE-F-PROFILE-VERSION | READY → READY | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## STU-PAGE-ATTENTION Student Attention Follow-up Workspace

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB / APP | STU-OBJ-ATTENTION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STU-OBJ-ATTENTION | STU-ATTENTION-F-ID | Student Attention Record ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-ATTENTION | STU-ATTENTION-F-PROFILE-REF | Student Profile View Reference | ID | 是 | OBJECT_REF: STU-OBJ-PROFILE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-ATTENTION | STU-ATTENTION-F-PROFILE-VERSION | Student Profile View Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-ATTENTION | STU-ATTENTION-F-KIND | Student Attention Event Kind | STRING | 是 | OPTION_SET: OPT-V2-CLS-005 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-ATTENTION | STU-ATTENTION-F-FOLLOW-UP-NOTE | Student Attention Follow-up Note | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| STU-OBJ-ATTENTION | STU-ATTENTION-F-VERSION | Student Attention Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STU-ACT-CREATE-ATTENTION | Create a Student Attention Record | CREATE | STU-ATTENTION-F-PROFILE-REF<br>STU-ATTENTION-F-PROFILE-VERSION<br>STU-ATTENTION-F-KIND<br>STU-ATTENTION-F-FOLLOW-UP-NOTE | STU-ATTENTION-F-ID<br>STU-ATTENTION-F-VERSION | CREATE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| STU-ACT-VIEW-ATTENTION | View Student Attention Records | READ | STU-ATTENTION-F-ID | STU-ATTENTION-F-ID<br>STU-ATTENTION-F-PROFILE-REF<br>STU-ATTENTION-F-PROFILE-VERSION<br>STU-ATTENTION-F-KIND<br>STU-ATTENTION-F-FOLLOW-UP-NOTE<br>STU-ATTENTION-F-VERSION | UNCHANGED | DUTY-SUBJECT-TEACHER / DUTY-HOMEROOM | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
