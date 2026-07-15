# APP-001 Student Todo Aggregation and Local Execution Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | APP-001 |
| 阶段 | 1 |
| 页面数量 | 1 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## APP-PAGE-TODOS Student Todo Execution

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | APP-OBJ-TODO | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| APP-OBJ-TODO | APP-TODO-F-STUDENT-REF | Todo Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| APP-OBJ-TODO | APP-TODO-F-TASK-DEEP-LINK | Task Deep Link | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| APP-OBJ-TODO | APP-TODO-F-LOCAL-PROGRESS | Student Local Progress | JSON | required when the student records local todo execution state；状态=READY；动作=APP-ACT-UPDATE-LOCAL-PROGRESS | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| APP-OBJ-TODO | APP-TODO-F-COMPLETION-EVIDENCE | Student Completion Evidence | JSON | required when the student records local todo execution state；状态=READY；动作=APP-ACT-UPDATE-LOCAL-PROGRESS | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| APP-OBJ-TODO | APP-TODO-F-DIFFICULTY-FEEDBACK | Student Difficulty Feedback | TEXT | required when the student records local todo execution state；状态=READY；动作=APP-ACT-UPDATE-LOCAL-PROGRESS | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| APP-OBJ-TODO | APP-TODO-F-STUDENT-VISIBLE-AT | Todo Student Visible At | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| APP-ACT-VIEW-TODOS | View My Student Todo Aggregation | READ | APP-TODO-F-STUDENT-REF | APP-TODO-F-STUDENT-REF<br>APP-TODO-F-TASK-DEEP-LINK<br>APP-TODO-F-LOCAL-PROGRESS<br>APP-TODO-F-COMPLETION-EVIDENCE<br>APP-TODO-F-DIFFICULTY-FEEDBACK<br>APP-TODO-F-STUDENT-VISIBLE-AT | UNCHANGED | ROLE-STUDENT | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / NOT_YET_VISIBLE |
| APP-ACT-UPDATE-LOCAL-PROGRESS | Update My Local Todo Progress and Evidence | UPDATE | APP-TODO-F-LOCAL-PROGRESS<br>APP-TODO-F-COMPLETION-EVIDENCE<br>APP-TODO-F-DIFFICULTY-FEEDBACK | APP-TODO-F-LOCAL-PROGRESS<br>APP-TODO-F-COMPLETION-EVIDENCE<br>APP-TODO-F-DIFFICULTY-FEEDBACK<br>APP-TODO-F-AGGREGATION-VERSION | READY → READY | ROLE-STUDENT | DUTY-SUBJECT-TEACHER / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
