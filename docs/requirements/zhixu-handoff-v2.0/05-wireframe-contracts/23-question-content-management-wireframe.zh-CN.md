# CONTENT-001 Versioned Question and Content Governance Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | CONTENT-001 |
| 阶段 | 1 |
| 页面数量 | 1 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## CONTENT-PAGE-GOVERNANCE Question and Content Governance Workspace

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | CONTENT-OBJ-QUESTION-VERSION / CONTENT-OBJ-LICENSE / CONTENT-OBJ-PERMISSION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-ID | Question Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-SCHOOL-ID | Content School | ID | 是 | OPTION_SET: OPT-COM-002 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-SUBJECT-ID | Content Subject | ID | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-COURSE-ID | Content Course | ID | 是 | OPTION_SET: OPT-COM-008 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-STEM | Question Stem | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-ANSWER | Question Answer | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-ANALYSIS | Question Analysis | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-KNOWLEDGE-MAPPINGS | Knowledge Point Mappings | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-VERSION | Question Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-AVAILABILITY | Question Availability | STRING | 是 | OPTION_SET: OPT-EXT-003 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-LICENSE-REF | Pinned Content License | ID | 是 | OBJECT_REF: CONTENT-OBJ-LICENSE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-LICENSE-VERSION | Pinned Content License Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-PERMISSION-REF | Pinned Content Permission | ID | 是 | OBJECT_REF: CONTENT-OBJ-PERMISSION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-PERMISSION-VERSION | Pinned Content Permission Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-LICENSE | CONTENT-LICENSE-F-ID | Content License Record ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-LICENSE | CONTENT-LICENSE-F-RIGHTSHOLDER | Content Rightsholder | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-LICENSE | CONTENT-LICENSE-F-TERMS | Content License Terms | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-LICENSE | CONTENT-LICENSE-F-STATUS | Content License Status | STRING | 是 | OPTION_SET: OPT-EXT-011 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-LICENSE | CONTENT-LICENSE-F-VERSION | Content License Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-ID | Content Permission Grant ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-SCOPE | Content Permission Scope | STRING | 是 | OPTION_SET: OPT-EXT-010 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-SCHOOL-ID | Authorized School | ID | 否 | OPTION_SET: OPT-COM-002 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-SUBJECT-ID | Authorized Subject | ID | 否 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-COURSE-ID | Authorized Course | ID | 否 | OPTION_SET: OPT-COM-008 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-GRANTEE-ID | Permission Grantee | ID | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-EFFECTIVE-AT | Permission Effective Time | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-EXPIRES-AT | Permission Expiry Time | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-VERSION | Content Permission Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CONTENT-ACT-CREATE-QUESTION-VERSION | Create Question Version | CREATE | CONTENT-QUESTION-F-SCHOOL-ID<br>CONTENT-QUESTION-F-SUBJECT-ID<br>CONTENT-QUESTION-F-COURSE-ID<br>CONTENT-QUESTION-F-STEM<br>CONTENT-QUESTION-F-ANSWER<br>CONTENT-QUESTION-F-ANALYSIS<br>CONTENT-QUESTION-F-KNOWLEDGE-MAPPINGS<br>CONTENT-QUESTION-F-LICENSE-REF<br>CONTENT-QUESTION-F-PERMISSION-REF | CONTENT-QUESTION-F-ID<br>CONTENT-QUESTION-F-VERSION<br>CONTENT-QUESTION-F-AVAILABILITY<br>CONTENT-QUESTION-F-LICENSE-VERSION<br>CONTENT-QUESTION-F-PERMISSION-VERSION | CREATE | DUTY-SUBJECT-LEAD | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CONTENT-ACT-PUBLISH-QUESTION-VERSION | Publish Question Version | UPDATE | CONTENT-QUESTION-F-LICENSE-REF<br>CONTENT-QUESTION-F-LICENSE-VERSION<br>CONTENT-QUESTION-F-PERMISSION-REF<br>CONTENT-QUESTION-F-PERMISSION-VERSION | CONTENT-QUESTION-F-VERSION<br>CONTENT-QUESTION-F-AVAILABILITY | DRAFT → PUBLISHED | DUTY-SUBJECT-LEAD | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / LICENSE_INACTIVE / CONTENT_PERMISSION_INACTIVE / SOURCE_VERSION_STALE / VERSION_CONFLICT |
| CONTENT-ACT-CREATE-LICENSE | Create Content License Record | CREATE | CONTENT-LICENSE-F-RIGHTSHOLDER<br>CONTENT-LICENSE-F-TERMS | CONTENT-LICENSE-F-ID<br>CONTENT-LICENSE-F-STATUS<br>CONTENT-LICENSE-F-VERSION | CREATE | DUTY-SUBJECT-LEAD | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CONTENT-ACT-ACTIVATE-LICENSE | Activate Content License | UPDATE |  | CONTENT-LICENSE-F-STATUS<br>CONTENT-LICENSE-F-VERSION | DRAFT → ACTIVE | DUTY-SUBJECT-LEAD | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CONTENT-ACT-CREATE-SCHOOL-PERMISSION | Create School Content Permission Grant | CREATE | CONTENT-PERMISSION-F-SCOPE<br>CONTENT-PERMISSION-F-SCHOOL-ID<br>CONTENT-PERMISSION-F-GRANTEE-ID<br>CONTENT-PERMISSION-F-EFFECTIVE-AT<br>CONTENT-PERMISSION-F-EXPIRES-AT | CONTENT-PERMISSION-F-ID<br>CONTENT-PERMISSION-F-VERSION | CREATE | DUTY-SUBJECT-LEAD | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CONTENT-ACT-CREATE-SUBJECT-PERMISSION | Create Subject Content Permission Grant | CREATE | CONTENT-PERMISSION-F-SCOPE<br>CONTENT-PERMISSION-F-SUBJECT-ID<br>CONTENT-PERMISSION-F-GRANTEE-ID<br>CONTENT-PERMISSION-F-EFFECTIVE-AT<br>CONTENT-PERMISSION-F-EXPIRES-AT | CONTENT-PERMISSION-F-ID<br>CONTENT-PERMISSION-F-VERSION | CREATE | DUTY-SUBJECT-LEAD | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CONTENT-ACT-CREATE-COURSE-PERMISSION | Create Course Content Permission Grant | CREATE | CONTENT-PERMISSION-F-SCOPE<br>CONTENT-PERMISSION-F-COURSE-ID<br>CONTENT-PERMISSION-F-GRANTEE-ID<br>CONTENT-PERMISSION-F-EFFECTIVE-AT<br>CONTENT-PERMISSION-F-EXPIRES-AT | CONTENT-PERMISSION-F-ID<br>CONTENT-PERMISSION-F-VERSION | CREATE | DUTY-SUBJECT-LEAD | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CONTENT-ACT-ACTIVATE-PERMISSION | Activate Content Permission Grant | UPDATE |  | CONTENT-PERMISSION-F-VERSION | DRAFT → ACTIVE | DUTY-SUBJECT-LEAD | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
