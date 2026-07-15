# ORG-001 Organization, members, and import Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | ORG-001 |
| 阶段 | 1 |
| 页面数量 | 8 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## ORG-PAGE-TREE Term Grade Class Subject and Course Organization Tree

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | ORG-OBJ-TERM / ORG-OBJ-GRADE / ORG-OBJ-CLASS / ORG-OBJ-SUBJECT / ORG-OBJ-COURSE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-OBJ-TERM | ORG-TERM-F-ID | Term ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-TERM | ORG-TERM-F-NAME | Term Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-TERM | ORG-TERM-F-START | Start Date | DATE | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-TERM | ORG-TERM-F-END | End Date | DATE | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-GRADE | ORG-GRADE-F-ID | Grade ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-GRADE | ORG-GRADE-F-NAME | Grade Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-GRADE | ORG-GRADE-F-TERM-ID | Term ID | STRING | 是 | OPTION_SET: OPT-COM-004 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-GRADE | ORG-GRADE-F-STATUS | Grade Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-CLASS | ORG-CLASS-F-ID | Class ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-CLASS | ORG-CLASS-F-NAME | Class Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-CLASS | ORG-CLASS-F-GRADE-ID | Grade ID | STRING | 是 | OPTION_SET: OPT-COM-005 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-SUBJECT | ORG-SUBJECT-F-ID | Subject ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-SUBJECT | ORG-SUBJECT-F-NAME | Subject Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-COURSE | ORG-COURSE-F-ID | Course ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-COURSE | ORG-COURSE-F-NAME | Course Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-COURSE | ORG-COURSE-F-SUBJECT-ID | Subject ID | STRING | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-COURSE | ORG-COURSE-F-TERM-ID | Term ID | STRING | 是 | OPTION_SET: OPT-COM-004 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-COURSE | ORG-COURSE-F-STATUS | Course Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-ACT-CREATE-TERM-VERSION | Create a School Term Version | CREATE | ORG-TERM-F-NAME<br>ORG-TERM-F-START<br>ORG-TERM-F-END | ORG-TERM-F-ID<br>ORG-TERM-F-TERM-VERSION<br>ORG-TERM-F-STATUS | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-ACTIVATE-TERM | Activate a Draft School Term | UPDATE | ORG-TERM-F-ID | ORG-TERM-F-TERM-VERSION<br>ORG-TERM-F-STATUS | DRAFT → CURRENT | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-CLOSE-TERM | Close a Current School Term | UPDATE | ORG-TERM-F-ID | ORG-TERM-F-TERM-VERSION<br>ORG-TERM-F-STATUS | CURRENT → HISTORICAL | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-ARCHIVE-TERM | Archive a Historical School Term | UPDATE | ORG-TERM-F-ID | ORG-TERM-F-TERM-VERSION<br>ORG-TERM-F-STATUS | HISTORICAL → ARCHIVED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-CREATE-GRADE | Create a Term Grade | CREATE | ORG-GRADE-F-NAME<br>ORG-GRADE-F-TERM-ID | ORG-GRADE-F-ID<br>ORG-GRADE-F-STATUS | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-UPDATE-GRADE | Update an Active Term Grade | UPDATE | ORG-GRADE-F-ID<br>ORG-GRADE-F-NAME<br>ORG-GRADE-F-TERM-ID | ORG-GRADE-F-STATUS | ACTIVE → ACTIVE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-MARK-GRADE-HISTORICAL | Mark a Grade Historical after Term Close | UPDATE | ORG-GRADE-F-ID | ORG-GRADE-F-STATUS | ACTIVE → HISTORICAL | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-CREATE-CLASS | Create a Term Class | CREATE | ORG-CLASS-F-NAME<br>ORG-CLASS-F-GRADE-ID | ORG-CLASS-F-ID<br>ORG-CLASS-F-STATUS | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-UPDATE-CLASS | Update an Active Term Class | UPDATE | ORG-CLASS-F-ID<br>ORG-CLASS-F-NAME<br>ORG-CLASS-F-GRADE-ID | ORG-CLASS-F-STATUS | ACTIVE → ACTIVE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-MARK-CLASS-HISTORICAL | Mark a Class Historical after Term Close | UPDATE | ORG-CLASS-F-ID | ORG-CLASS-F-STATUS | ACTIVE → HISTORICAL | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-DEACTIVATE-CLASS | Deactivate a Class | UPDATE | ORG-CLASS-F-ID | ORG-CLASS-F-STATUS | ACTIVE / HISTORICAL → DEACTIVATED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-CREATE-SUBJECT | Create a School Subject | CREATE | ORG-SUBJECT-F-NAME | ORG-SUBJECT-F-ID<br>ORG-SUBJECT-F-STATUS | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-UPDATE-SUBJECT | Update an Active School Subject | UPDATE | ORG-SUBJECT-F-ID<br>ORG-SUBJECT-F-NAME | ORG-SUBJECT-F-STATUS | ACTIVE → ACTIVE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-DEPRECATE-SUBJECT | Deprecate a School Subject | UPDATE | ORG-SUBJECT-F-ID | ORG-SUBJECT-F-STATUS | ACTIVE → DEPRECATED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-CREATE-COURSE | Create a Term Course | CREATE | ORG-COURSE-F-NAME<br>ORG-COURSE-F-SUBJECT-ID<br>ORG-COURSE-F-TERM-ID | ORG-COURSE-F-ID<br>ORG-COURSE-F-STATUS | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-UPDATE-COURSE | Update a Draft Term Course | UPDATE | ORG-COURSE-F-ID<br>ORG-COURSE-F-NAME<br>ORG-COURSE-F-SUBJECT-ID<br>ORG-COURSE-F-TERM-ID | ORG-COURSE-F-STATUS | DRAFT → DRAFT | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-ACTIVATE-COURSE | Activate a Draft Term Course | UPDATE | ORG-COURSE-F-ID | ORG-COURSE-F-STATUS | DRAFT → ACTIVE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-END-COURSE | End an Active Term Course | UPDATE | ORG-COURSE-F-ID | ORG-COURSE-F-STATUS | ACTIVE → ENDED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-RESOLVE-CONTEXT-SCOPE | Resolve Current Term and Organization Scope | READ | ORG-TERM-F-ID | ORG-TERM-F-TERM-VERSION<br>ORG-TERM-F-STATUS | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## ORG-PAGE-MEMBERS Teacher and Student Member Management

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | ORG-OBJ-TEACHER / ORG-OBJ-STUDENT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-OBJ-TEACHER | ORG-TEACHER-F-ID | Teacher ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-TEACHER | ORG-TEACHER-F-NAME | Teacher Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-TEACHER | ORG-TEACHER-F-MEMBER-STATE | Member State | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-STUDENT | ORG-STUDENT-F-ID | Student ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-STUDENT | ORG-STUDENT-F-NAME | Student Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-STUDENT | ORG-STUDENT-F-CLASS-ID | Class ID | STRING | 是 | OPTION_SET: OPT-COM-006 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-STUDENT | ORG-STUDENT-F-MEMBER-STATE | Member State | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-ACT-CREATE-TEACHER | Create a Teacher Profile | CREATE | ORG-TEACHER-F-NAME | ORG-TEACHER-F-ID<br>ORG-TEACHER-F-MEMBER-STATE | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-UPDATE-TEACHER | Update an Active Teacher Profile | UPDATE | ORG-TEACHER-F-ID<br>ORG-TEACHER-F-NAME | ORG-TEACHER-F-MEMBER-STATE | ACTIVE → ACTIVE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-SUSPEND-TEACHER | Suspend a Teacher Profile | UPDATE | ORG-TEACHER-F-ID | ORG-TEACHER-F-MEMBER-STATE | ACTIVE → SUSPENDED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ORG-ACT-DEACTIVATE-TEACHER | Deactivate a Teacher Profile | UPDATE | ORG-TEACHER-F-ID | ORG-TEACHER-F-MEMBER-STATE | ACTIVE / SUSPENDED → DEACTIVATED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ORG-ACT-CREATE-STUDENT | Create a Student Profile | CREATE | ORG-STUDENT-F-NAME<br>ORG-STUDENT-F-CLASS-ID | ORG-STUDENT-F-ID<br>ORG-STUDENT-F-MEMBER-STATE | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-UPDATE-STUDENT | Update an Active Student Profile | UPDATE | ORG-STUDENT-F-ID<br>ORG-STUDENT-F-NAME<br>ORG-STUDENT-F-CLASS-ID | ORG-STUDENT-F-MEMBER-STATE | ACTIVE → ACTIVE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-TRANSFER-STUDENT | Transfer a Student Profile | UPDATE | ORG-STUDENT-F-ID<br>ORG-STUDENT-F-CLASS-ID | ORG-STUDENT-F-MEMBER-STATE | ACTIVE → TRANSFERRED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ORG-ACT-DEACTIVATE-MEMBER | Deactivate a School Member Profile | UPDATE | ORG-STUDENT-F-ID | ORG-STUDENT-F-MEMBER-STATE | ACTIVE → DEACTIVATED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## ORG-PAGE-IMPORT-TEMPLATE Import Object and Template Selection

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | ORG-OBJ-IMPORT-BATCH | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-OBJ-IMPORT-BATCH | ORG-IMPORT-F-OBJECT-TYPE | Import Object Type | STRING | 是 | OPTION_SET: OPT-ENUM-020 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-BATCH | ORG-IMPORT-F-TEMPLATE-VERSION | Template Version | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-ACT-DOWNLOAD-IMPORT-TEMPLATE | Download Object-specific Import Template | READ | ORG-IMPORT-F-OBJECT-TYPE | ORG-IMPORT-F-TEMPLATE-VERSION | UNCHANGED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-UPLOAD-IMPORT | Upload Organization Import Workbook | CREATE | ORG-IMPORT-F-OBJECT-TYPE<br>ORG-IMPORT-F-TEMPLATE-VERSION | ORG-IMPORT-F-ID<br>ORG-IMPORT-F-BATCH-VERSION<br>ORG-IMPORT-F-STATUS | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## ORG-PAGE-IMPORT-MAPPING Import Mapping and Row Validation

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | ORG-OBJ-IMPORT-BATCH / ORG-OBJ-IMPORT-ROW | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-OBJ-IMPORT-BATCH | ORG-IMPORT-F-MAPPING | Field Mapping | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-BATCH | ORG-IMPORT-F-STATUS | Import Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-RESULT-TYPE | Object Result Type | STRING | 是 | OPTION_SET: OPT-ENUM-021 | READ_ONLY | AUTHORIZED_SCOPE | must be CREATE, UPDATE, NO_CHANGE, REJECT, or DEACTIVATE |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-VALIDATION-RESULT | Row Validation Result | STRING | 是 | OPTION_SET: OPT-ENUM-022 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-ERRORS | Row Errors | STRING_ARRAY | 否 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-CONFLICTS | Row Conflicts | STRING_ARRAY | 否 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-ACT-MAP-IMPORT-FIELDS | Map Workbook Columns to Organization Fields | UPDATE | ORG-IMPORT-F-MAPPING | ORG-IMPORT-F-BATCH-VERSION<br>ORG-IMPORT-F-STATUS | UPLOADED → MAPPED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-VALIDATE-IMPORT-BATCH | Validate a Mapped Organization Import Batch | UPDATE | ORG-IMPORT-F-ID | ORG-IMPORT-F-BATCH-VERSION<br>ORG-IMPORT-F-STATUS | MAPPED → VALIDATED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-REJECT-IMPORT-BATCH | Reject an Invalid Organization Import Batch | UPDATE | ORG-IMPORT-F-ID | ORG-IMPORT-F-BATCH-VERSION<br>ORG-IMPORT-F-STATUS | MAPPED / VALIDATED → REJECTED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-VALIDATE-IMPORT | Validate Object-level Import Rows | UPDATE | ORG-IMPORT-ROW-F-BATCH-ID | ORG-IMPORT-ROW-F-ROW-VERSION<br>ORG-IMPORT-ROW-F-RESULT-TYPE<br>ORG-IMPORT-ROW-F-VALIDATION-RESULT<br>ORG-IMPORT-ROW-F-ERRORS<br>ORG-IMPORT-ROW-F-CONFLICTS | PENDING → VALIDATED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-CONFIRM-IMPORT | Confirm Object-level Import | UPDATE | ORG-IMPORT-F-ID | ORG-IMPORT-F-BATCH-VERSION<br>ORG-IMPORT-F-STATUS | MAPPED / VALIDATED → PENDING_OUTCOME_AUDIT | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / PARTIAL_SUCCESS / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## ORG-PAGE-IMPORT-RESULT Object-level Import Result and Retry

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | ORG-OBJ-IMPORT-BATCH / ORG-OBJ-IMPORT-ROW | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-OBJ-IMPORT-BATCH | ORG-IMPORT-F-STATUS | Import Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-RESULT-TYPE | Object Result Type | STRING | 是 | OPTION_SET: OPT-ENUM-021 | READ_ONLY | AUTHORIZED_SCOPE | must be CREATE, UPDATE, NO_CHANGE, REJECT, or DEACTIVATE |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-ERRORS | Row Errors | STRING_ARRAY | 否 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-CONFLICTS | Row Conflicts | STRING_ARRAY | 否 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-OBJECT-ID | Affected Object ID | STRING | 否 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-ACT-MARK-IMPORT-ROW-RETRYABLE | Mark a Failed Import Row Retryable | UPDATE | ORG-IMPORT-ROW-F-ID | ORG-IMPORT-ROW-F-VALIDATION-RESULT<br>ORG-IMPORT-ROW-F-ERRORS<br>ORG-IMPORT-ROW-F-CONFLICTS | VALIDATED → RETRYABLE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-RETRY-FAILED-ROWS | Retry Corrected Failed Import Rows | UPDATE | ORG-IMPORT-ROW-F-ID | ORG-IMPORT-ROW-F-RESULT-TYPE<br>ORG-IMPORT-ROW-F-ERRORS<br>ORG-IMPORT-ROW-F-CONFLICTS | RETRYABLE → VALIDATED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## ORG-PAGE-TEACHING-ASSIGNMENT Subject and Homeroom Teaching Assignment

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | ORG-OBJ-TEACHING-ASSIGNMENT / ORG-OBJ-HOMEROOM-ASSIGNMENT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-TEACHER-ID | Teacher ID | STRING | 是 | OPTION_SET: OPT-COM-009 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-COURSE-ID | Course ID | STRING | 是 | OPTION_SET: OPT-COM-008 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-CLASS-ID | Class ID | STRING | 是 | OPTION_SET: OPT-COM-006 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-EFFECTIVE | Effective Range | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-HOMEROOM-ASSIGNMENT | ORG-HOMEROOM-F-TEACHER-ID | Homeroom Teacher ID | STRING | 是 | OPTION_SET: OPT-COM-009 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-HOMEROOM-ASSIGNMENT | ORG-HOMEROOM-F-CLASS-ID | Homeroom Class ID | STRING | 是 | OPTION_SET: OPT-COM-006 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-HOMEROOM-ASSIGNMENT | ORG-HOMEROOM-F-EFFECTIVE | Effective Range | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-ACT-ASSIGN-SUBJECT-TEACHER | Assign a Subject Teacher to Course and Class | CREATE | ORG-TEACHING-F-TEACHER-ID<br>ORG-TEACHING-F-COURSE-ID<br>ORG-TEACHING-F-CLASS-ID<br>ORG-TEACHING-F-EFFECTIVE | ORG-TEACHING-F-ID | CREATE | ROLE-ACADEMIC | DUTY-SUBJECT-LEAD | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-ACTIVATE-TEACHING-ASSIGNMENT | Activate a Planned Teaching Assignment | UPDATE | ORG-TEACHING-F-ID<br>ORG-TEACHING-F-EFFECTIVE | ORG-TEACHING-F-EFFECTIVE | PLANNED → EFFECTIVE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-EXPIRE-TEACHING-ASSIGNMENT | Expire an Effective Teaching Assignment | UPDATE | ORG-TEACHING-F-ID | ORG-TEACHING-F-EFFECTIVE | EFFECTIVE → EXPIRED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-REVOKE-TEACHING-ASSIGNMENT | Revoke a Teaching Assignment | UPDATE | ORG-TEACHING-F-ID | ORG-TEACHING-F-EFFECTIVE | PLANNED / EFFECTIVE → REVOKED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-ASSIGN-HOMEROOM | Assign a Homeroom Teacher to a Class | CREATE | ORG-HOMEROOM-F-TEACHER-ID<br>ORG-HOMEROOM-F-CLASS-ID<br>ORG-HOMEROOM-F-EFFECTIVE | ORG-HOMEROOM-F-ID | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-ACTIVATE-HOMEROOM-ASSIGNMENT | Activate a Planned Homeroom Assignment | UPDATE | ORG-HOMEROOM-F-ID<br>ORG-HOMEROOM-F-EFFECTIVE | ORG-HOMEROOM-F-EFFECTIVE | PLANNED → EFFECTIVE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-EXPIRE-HOMEROOM-ASSIGNMENT | Expire an Effective Homeroom Assignment | UPDATE | ORG-HOMEROOM-F-ID | ORG-HOMEROOM-F-EFFECTIVE | EFFECTIVE → EXPIRED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-REVOKE-HOMEROOM-ASSIGNMENT | Revoke a Homeroom Assignment | UPDATE | ORG-HOMEROOM-F-ID | ORG-HOMEROOM-F-EFFECTIVE | PLANNED / EFFECTIVE → REVOKED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## ORG-PAGE-APP-MY-TEACHING-SCOPE My Class and Teaching Scope

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| APP | ORG-OBJ-TEACHING-ASSIGNMENT / ORG-OBJ-HOMEROOM-ASSIGNMENT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-TEACHER-ID | Teacher ID | STRING | 是 | OPTION_SET: OPT-COM-009 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-COURSE-ID | Course ID | STRING | 是 | OPTION_SET: OPT-COM-008 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-CLASS-ID | Class ID | STRING | 是 | OPTION_SET: OPT-COM-006 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-EFFECTIVE | Effective Range | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-HOMEROOM-ASSIGNMENT | ORG-HOMEROOM-F-CLASS-ID | Homeroom Class ID | STRING | 是 | OPTION_SET: OPT-COM-006 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-HOMEROOM-ASSIGNMENT | ORG-HOMEROOM-F-EFFECTIVE | Effective Range | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-ACT-VIEW-MY-TEACHING-SCOPE | View My Class and Teaching Scope on App | READ | ORG-TEACHING-F-TEACHER-ID | ORG-TEACHING-F-COURSE-ID<br>ORG-TEACHING-F-CLASS-ID<br>ORG-TEACHING-F-EFFECTIVE | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 本页不登记 Web 入口。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## ORG-PAGE-APP-IMPORT-RESULT Import Result Notification and Anomaly Confirmation

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| APP | ORG-OBJ-IMPORT-BATCH / ORG-OBJ-IMPORT-ROW | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-OBJ-IMPORT-BATCH | ORG-IMPORT-F-STATUS | Import Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-RESULT-TYPE | Object Result Type | STRING | 是 | OPTION_SET: OPT-ENUM-021 | READ_ONLY | AUTHORIZED_SCOPE | must be CREATE, UPDATE, NO_CHANGE, REJECT, or DEACTIVATE |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-VALIDATION-RESULT | Row Validation Result | STRING | 是 | OPTION_SET: OPT-ENUM-022 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-ERRORS | Row Errors | STRING_ARRAY | 否 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-CONFLICTS | Row Conflicts | STRING_ARRAY | 否 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-ANOMALY-CONFIRMATION | Anomaly Confirmation | STRING | 是 | OPTION_SET: OPT-ENUM-001 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-CONFIRMATION-NOTE | Anomaly Confirmation Note | TEXT | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORG-ACT-VIEW-IMPORT-NOTIFICATION | View Import Result Notification on App | READ | ORG-IMPORT-F-ID | ORG-IMPORT-F-STATUS | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ORG-ACT-CONFIRM-IMPORT-ANOMALY | Confirm an Import Anomaly on App | UPDATE | ORG-IMPORT-ROW-F-ID<br>ORG-IMPORT-ROW-F-ANOMALY-CONFIRMATION<br>ORG-IMPORT-ROW-F-CONFIRMATION-NOTE | ORG-IMPORT-ROW-F-VALIDATION-RESULT<br>ORG-IMPORT-ROW-F-ERRORS<br>ORG-IMPORT-ROW-F-CONFLICTS | VALIDATED → VALIDATED | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 本页不登记 Web 入口。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
