# AIX-001 AI Conversation and Controlled Task Preview Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | AIX-001 |
| 阶段 | 1 |
| 页面数量 | 1 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## AIX-PAGE-CONVERSATION AI Conversation and Structured Confirmation

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | AIX-OBJ-TASK-PREVIEW | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-ID | AI Task Preview ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-TASK-ID | Registered AI Task ID | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-TARGET-ACTION-ID | Target Action ID | ID | 是 | OPTION_SET: OPT-COM-016 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-PARAMETERS | Resolved Parameters | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-PERMISSION-RESULT | Permission Result | STRING | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-SOURCE-VERSIONS | Source Versions | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-PAYLOAD | Structured Preview Payload | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-EXPIRES-AT | Preview Expiry Time | DATETIME | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-VERSION | AI Task Preview Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AIX-ACT-PREPARE-TASK-PREVIEW | Prepare a Registered AI Task Preview | CREATE | AIX-PREVIEW-F-TASK-ID<br>AIX-PREVIEW-F-TARGET-ACTION-ID<br>AIX-PREVIEW-F-PARAMETERS | AIX-PREVIEW-F-ID<br>AIX-PREVIEW-F-PERMISSION-RESULT<br>AIX-PREVIEW-F-SOURCE-VERSIONS<br>AIX-PREVIEW-F-PAYLOAD<br>AIX-PREVIEW-F-EXPIRES-AT<br>AIX-PREVIEW-F-VERSION | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW | Create a Temporary AI Feedback Draft Preview | CREATE | AIX-PREVIEW-F-TASK-ID<br>AIX-PREVIEW-F-TARGET-ACTION-ID<br>AIX-PREVIEW-F-PARAMETERS | AIX-PREVIEW-F-ID<br>AIX-PREVIEW-F-PERMISSION-RESULT<br>AIX-PREVIEW-F-SOURCE-VERSIONS<br>AIX-PREVIEW-F-PAYLOAD<br>AIX-PREVIEW-F-EXPIRES-AT<br>AIX-PREVIEW-F-VERSION | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW | Create a Temporary AI Improvement-plan Draft Preview | CREATE | AIX-PREVIEW-F-TASK-ID<br>AIX-PREVIEW-F-TARGET-ACTION-ID<br>AIX-PREVIEW-F-PARAMETERS | AIX-PREVIEW-F-ID<br>AIX-PREVIEW-F-PERMISSION-RESULT<br>AIX-PREVIEW-F-SOURCE-VERSIONS<br>AIX-PREVIEW-F-PAYLOAD<br>AIX-PREVIEW-F-EXPIRES-AT<br>AIX-PREVIEW-F-VERSION | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
