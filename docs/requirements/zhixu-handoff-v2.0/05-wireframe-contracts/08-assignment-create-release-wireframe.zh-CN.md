# HW-001 Assignment Authoring and Publication Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | HW-001 |
| 阶段 | 1 |
| 页面数量 | 2 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## HW-PAGE-AUTHORING Assignment Authoring Workspace

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | HW-OBJ-ASSIGNMENT / HW-OBJ-ITEM | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-ID | Assignment ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-TITLE | Assignment Title | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-INSTRUCTIONS | Assignment Instructions | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-SUBJECT-ID | Subject | ID | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-COURSE-ID | Course | ID | 是 | OPTION_SET: OPT-COM-008 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-CLASS-SCOPE-IDS | Class Scope | STRING_ARRAY | 是 | OPTION_SET: OPT-COM-006 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS | Published Student Fanout Set | STRING_ARRAY | required when the assignment reaches PUBLISHED；状态=PUBLISHED | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-OPEN-AT | Open Time | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-DUE-AT | Due Time | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-LATE-POLICY | Late Policy | STRING | 是 | OPTION_SET: OPT-ENUM-032 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-RESUBMISSION-POLICY | Resubmission Policy | STRING | 是 | OPTION_SET: OPT-ENUM-033 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-ASSIGNMENT-TYPE | Assignment Type | STRING | 是 | OPTION_SET: OPT-ENUM-002 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-QUESTION-ORDER | Question Order | STRING | 是 | OPTION_SET: OPT-TL-001 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-RUBRIC-VERSION | Assignment Rubric Version | ID | 是 | RUNTIME_QUERY: QUERY-AUTHORIZED-RUBRIC-VERSIONS | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-KNOWLEDGE-POINT-IDS | Assignment Knowledge Points | STRING_ARRAY | 是 | OPTION_SET: OPT-COM-011 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-FEEDBACK-POLICY | Feedback Policy | STRING | 是 | OPTION_SET: OPT-ENUM-004 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-NOTIFICATION-POLICY | Notification Policy | STRING | 是 | OPTION_SET: OPT-TL-002 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-PUBLICATION-VERSION | Publication Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-REVISION-REASON | Revision Reason | TEXT | required when revising a published assignment；状态=REVISION_DRAFT；动作=HW-ACT-REVISE | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ITEM | HW-ITEM-F-ID | Assignment Item ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ITEM | HW-ITEM-F-ITEM-VERSION | Item Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ITEM | HW-ITEM-F-QUESTION-TYPE | Question Type | STRING | 是 | OPTION_SET: OPT-ENUM-003 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ITEM | HW-ITEM-F-ORDER | Item Order | INTEGER | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ITEM | HW-ITEM-F-PROMPT | Question Prompt | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ITEM | HW-ITEM-F-ANSWER-KEY | Answer Key | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ITEM | HW-ITEM-F-POINTS | Item Points | DECIMAL | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ITEM | HW-ITEM-F-RUBRIC-VERSION | Item Rubric Version | ID | 是 | RUNTIME_QUERY: QUERY-AUTHORIZED-RUBRIC-VERSIONS | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ITEM | HW-ITEM-F-RUBRIC-REF | Item Rubric Reference | ID | 是 | OBJECT_REF: HW-OBJ-RUBRIC | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ITEM | HW-ITEM-F-KNOWLEDGE-POINT-IDS | Item Knowledge Points | STRING_ARRAY | 是 | OPTION_SET: OPT-COM-011 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HW-ACT-CREATE-DRAFT | Create Assignment Draft | CREATE | HW-ASSIGNMENT-F-TITLE<br>HW-ASSIGNMENT-F-INSTRUCTIONS<br>HW-ASSIGNMENT-F-SUBJECT-ID<br>HW-ASSIGNMENT-F-COURSE-ID<br>HW-ASSIGNMENT-F-CLASS-SCOPE-IDS<br>HW-ASSIGNMENT-F-OPEN-AT<br>HW-ASSIGNMENT-F-DUE-AT<br>HW-ASSIGNMENT-F-LATE-POLICY<br>HW-ASSIGNMENT-F-RESUBMISSION-POLICY<br>HW-ASSIGNMENT-F-ASSIGNMENT-TYPE<br>HW-ASSIGNMENT-F-QUESTION-ORDER<br>HW-ASSIGNMENT-F-RUBRIC-VERSION<br>HW-ASSIGNMENT-F-KNOWLEDGE-POINT-IDS<br>HW-ASSIGNMENT-F-FEEDBACK-POLICY<br>HW-ASSIGNMENT-F-NOTIFICATION-POLICY | HW-ASSIGNMENT-F-ID<br>HW-ASSIGNMENT-F-PUBLICATION-VERSION | CREATE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| HW-ACT-CREATE-ITEM | Create Assignment Item | CREATE | HW-ITEM-F-QUESTION-TYPE<br>HW-ITEM-F-ORDER<br>HW-ITEM-F-PROMPT<br>HW-ITEM-F-ANSWER-KEY<br>HW-ITEM-F-POINTS<br>HW-ITEM-F-RUBRIC-VERSION<br>HW-ITEM-F-KNOWLEDGE-POINT-IDS<br>HW-ITEM-F-RUBRIC-REF | HW-ITEM-F-ID<br>HW-ITEM-F-ITEM-VERSION | CREATE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| HW-ACT-EDIT-ITEM | Edit Assignment Item | UPDATE | HW-ITEM-F-QUESTION-TYPE<br>HW-ITEM-F-ORDER<br>HW-ITEM-F-PROMPT<br>HW-ITEM-F-ANSWER-KEY<br>HW-ITEM-F-POINTS<br>HW-ITEM-F-RUBRIC-VERSION<br>HW-ITEM-F-KNOWLEDGE-POINT-IDS | HW-ITEM-F-ITEM-VERSION | DRAFT → DRAFT | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| HW-ACT-VALIDATE-ITEM | Validate Assignment Item Version | UPDATE |  | HW-ITEM-F-ITEM-VERSION | DRAFT → VALIDATED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / INCOMPLETE_ITEM / VERSION_CONFLICT |
| HW-ACT-VALIDATE | Validate Assignment Version | UPDATE |  | HW-ASSIGNMENT-F-PUBLICATION-VERSION | DRAFT → VALIDATED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / INCOMPLETE_ITEM / VERSION_CONFLICT |
| HW-ACT-REVALIDATE-ITEM | Revalidate Revised Assignment Item | UPDATE |  | HW-ITEM-F-ITEM-VERSION | REVISION_DRAFT → VALIDATED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / INCOMPLETE_ITEM / VERSION_CONFLICT |
| HW-ACT-REVALIDATE-REVISION | Revalidate Assignment Revision | UPDATE |  | HW-ASSIGNMENT-F-PUBLICATION-VERSION | REVISION_DRAFT → VALIDATED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / INCOMPLETE_ITEM / VERSION_CONFLICT |
| HW-ACT-PREVIEW | Preview Assignment as Student | READ |  | HW-ASSIGNMENT-F-ID<br>HW-ASSIGNMENT-F-TITLE<br>HW-ASSIGNMENT-F-INSTRUCTIONS<br>HW-ASSIGNMENT-F-SUBJECT-ID<br>HW-ASSIGNMENT-F-COURSE-ID<br>HW-ASSIGNMENT-F-CLASS-SCOPE-IDS<br>HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS<br>HW-ASSIGNMENT-F-OPEN-AT<br>HW-ASSIGNMENT-F-DUE-AT<br>HW-ASSIGNMENT-F-LATE-POLICY<br>HW-ASSIGNMENT-F-RESUBMISSION-POLICY<br>HW-ASSIGNMENT-F-ASSIGNMENT-TYPE<br>HW-ASSIGNMENT-F-QUESTION-ORDER<br>HW-ASSIGNMENT-F-RUBRIC-VERSION<br>HW-ASSIGNMENT-F-KNOWLEDGE-POINT-IDS<br>HW-ASSIGNMENT-F-FEEDBACK-POLICY<br>HW-ASSIGNMENT-F-NOTIFICATION-POLICY<br>HW-ASSIGNMENT-F-PUBLICATION-VERSION<br>HW-ASSIGNMENT-F-REVISION-REASON | UNCHANGED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |
| HW-ACT-PUBLISH-ITEM | Publish Validated Assignment Item | UPDATE |  | HW-ITEM-F-ITEM-VERSION | VALIDATED → PUBLISHED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| HW-ACT-PUBLISH-NOW | Publish Assignment Immediately | UPDATE |  | HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS<br>HW-ASSIGNMENT-F-PUBLICATION-VERSION | VALIDATED → PUBLISHED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| HW-ACT-SCHEDULE-PUBLISH | Schedule Assignment Publication | UPDATE | HW-ASSIGNMENT-F-OPEN-AT | HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS<br>HW-ASSIGNMENT-F-PUBLICATION-VERSION | VALIDATED → SCHEDULED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| HW-ACT-CLOSE | Close Assignment | UPDATE |  | HW-ASSIGNMENT-F-PUBLICATION-VERSION | PUBLISHED → CLOSED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| HW-ACT-REVISE | Revise Published Assignment | UPDATE | HW-ASSIGNMENT-F-REVISION-REASON | HW-ASSIGNMENT-F-REVISION-REASON<br>HW-ASSIGNMENT-F-PUBLICATION-VERSION | PUBLISHED → REVISION_DRAFT | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| HW-ACT-REVISE-ITEM | Revise Published Assignment Item | UPDATE | HW-ITEM-F-QUESTION-TYPE<br>HW-ITEM-F-ORDER<br>HW-ITEM-F-PROMPT<br>HW-ITEM-F-ANSWER-KEY<br>HW-ITEM-F-POINTS<br>HW-ITEM-F-RUBRIC-VERSION<br>HW-ITEM-F-KNOWLEDGE-POINT-IDS | HW-ITEM-F-ITEM-VERSION | PUBLISHED → REVISION_DRAFT | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## HW-PAGE-STUDENT Published Assignment Reader

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | HW-OBJ-ASSIGNMENT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-TITLE | Assignment Title | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-INSTRUCTIONS | Assignment Instructions | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-OPEN-AT | Open Time | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-DUE-AT | Due Time | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-PUBLICATION-VERSION | Publication Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HW-ACT-OPEN-PUBLISHED | Open Published Assignment | READ |  | HW-ASSIGNMENT-F-TITLE<br>HW-ASSIGNMENT-F-INSTRUCTIONS<br>HW-ASSIGNMENT-F-OPEN-AT<br>HW-ASSIGNMENT-F-DUE-AT<br>HW-ASSIGNMENT-F-PUBLICATION-VERSION | UNCHANGED | ROLE-STUDENT | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / NOT_OPEN_YET |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
