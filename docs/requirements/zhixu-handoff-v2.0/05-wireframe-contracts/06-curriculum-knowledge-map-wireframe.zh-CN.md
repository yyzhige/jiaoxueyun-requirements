# CURR-001 Curriculum, textbook, and knowledge map Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | CURR-001 |
| 阶段 | 1 |
| 页面数量 | 6 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## CURR-PAGE-VERSIONS Curriculum Version Management

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | CURR-OBJ-CURRICULUM | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-NAME | Curriculum Version Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-SUBJECT | Curriculum Subject | STRING | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-STATUS | Curriculum Version Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-PUBLISHED-AT | Published At | DATETIME | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURR-ACT-CREATE-DRAFT | Create a Curriculum Version Draft | CREATE | CURR-CURRICULUM-F-NAME<br>CURR-CURRICULUM-F-SUBJECT | CURR-CURRICULUM-F-ID<br>CURR-CURRICULUM-F-VERSION<br>CURR-CURRICULUM-F-STATUS | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CURR-ACT-BEGIN-VALIDATION | Begin Curriculum Version Validation | UPDATE | CURR-CURRICULUM-F-ID | CURR-CURRICULUM-F-VERSION<br>CURR-CURRICULUM-F-STATUS | DRAFT → VALIDATING | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| CURR-ACT-DEPRECATE-VERSION | Deprecate a Published Curriculum Version | UPDATE | CURR-CURRICULUM-F-ID | CURR-CURRICULUM-F-STATUS | PUBLISHED → DEPRECATED | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## CURR-PAGE-TEXTBOOK-TREE Textbook and Chapter Version Tree

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | CURR-OBJ-TEXTBOOK / CURR-OBJ-CHAPTER | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURR-OBJ-TEXTBOOK | CURR-TEXTBOOK-F-NAME | Textbook Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-TEXTBOOK | CURR-TEXTBOOK-F-EDITION | Textbook Edition | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-CHAPTER | CURR-CHAPTER-F-ID | Chapter ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-CHAPTER | CURR-CHAPTER-F-TITLE | Chapter Title | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-CHAPTER | CURR-CHAPTER-F-ORDER | Chapter Order | INTEGER | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURR-ACT-ADD-TEXTBOOK | Add a Textbook Version to Curriculum | CREATE | CURR-TEXTBOOK-F-CURRICULUM-ID<br>CURR-TEXTBOOK-F-NAME<br>CURR-TEXTBOOK-F-EDITION | CURR-TEXTBOOK-F-ID<br>CURR-TEXTBOOK-F-STATUS | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CURR-ACT-ACTIVATE-TEXTBOOK | Activate a Draft Textbook Version | UPDATE | CURR-TEXTBOOK-F-ID | CURR-TEXTBOOK-F-STATUS | DRAFT → ACTIVE | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CURR-ACT-DEPRECATE-TEXTBOOK | Deprecate an Active Textbook Version | UPDATE | CURR-TEXTBOOK-F-ID | CURR-TEXTBOOK-F-STATUS | ACTIVE → DEPRECATED | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CURR-ACT-CREATE-CHAPTER | Create a Textbook Chapter | CREATE | CURR-CHAPTER-F-TEXTBOOK-ID<br>CURR-CHAPTER-F-TITLE<br>CURR-CHAPTER-F-ORDER | CURR-CHAPTER-F-ID<br>CURR-CHAPTER-F-STATUS | CREATE | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CURR-ACT-REORDER-CHAPTER | Reorder a Draft Textbook Chapter | UPDATE | CURR-CHAPTER-F-ID<br>CURR-CHAPTER-F-ORDER | CURR-CHAPTER-F-ORDER<br>CURR-CHAPTER-F-STATUS | DRAFT → DRAFT | ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CURR-ACT-ACTIVATE-CHAPTER | Activate a Draft Textbook Chapter | UPDATE | CURR-CHAPTER-F-ID | CURR-CHAPTER-F-STATUS | DRAFT → ACTIVE | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CURR-ACT-DEPRECATE-CHAPTER | Deprecate an Active Textbook Chapter | UPDATE | CURR-CHAPTER-F-ID | CURR-CHAPTER-F-STATUS | ACTIVE → DEPRECATED | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## CURR-PAGE-KP-EDITOR Knowledge Point Version Editor

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | CURR-OBJ-KNOWLEDGE-POINT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURR-OBJ-KNOWLEDGE-POINT | CURR-KP-F-NAME | Knowledge Point Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-KNOWLEDGE-POINT | CURR-KP-F-DEFINITION | Knowledge Point Definition | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-KNOWLEDGE-POINT | CURR-KP-F-PARENT-ID | Parent Knowledge Point ID | STRING | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-KNOWLEDGE-POINT | CURR-KP-F-STATUS | Knowledge Point Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURR-ACT-CREATE-KNOWLEDGE-VERSION | Create a Knowledge Point Version | CREATE | CURR-KP-F-NAME<br>CURR-KP-F-DEFINITION<br>CURR-KP-F-PARENT-ID | CURR-KP-F-ID<br>CURR-KP-F-STATUS | CREATE | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CURR-ACT-ACTIVATE-KNOWLEDGE-VERSION | Activate a Draft Knowledge Point Version | UPDATE | CURR-KP-F-ID | CURR-KP-F-STATUS | DRAFT → ACTIVE | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CURR-ACT-DEPRECATE-KNOWLEDGE-VERSION | Deprecate an Active Knowledge Point Version | UPDATE | CURR-KP-F-ID | CURR-KP-F-STATUS | ACTIVE → DEPRECATED | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## CURR-PAGE-MAPPING Chapter Knowledge Mapping Review

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | CURR-OBJ-MAPPING | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURR-OBJ-MAPPING | CURR-MAPPING-F-CHAPTER-ID | Mapped Chapter ID | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-MAPPING | CURR-MAPPING-F-KP-ID | Mapped Knowledge Point ID | STRING | 是 | OPTION_SET: OPT-COM-011 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-MAPPING | CURR-MAPPING-F-RELATION | Mapping Relation | STRING | 是 | OPTION_SET: OPT-ENUM-043 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-MAPPING | CURR-MAPPING-F-STATUS | Mapping Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURR-ACT-CREATE-MAPPING | Map a Chapter to a Knowledge Point | CREATE | CURR-MAPPING-F-CHAPTER-ID<br>CURR-MAPPING-F-KP-ID<br>CURR-MAPPING-F-RELATION | CURR-MAPPING-F-ID<br>CURR-MAPPING-F-VERSION<br>CURR-MAPPING-F-STATUS | CREATE | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CURR-ACT-DEPRECATE-MAPPING | Deprecate a Published Knowledge Mapping | UPDATE | CURR-MAPPING-F-ID<br>CURR-MAPPING-F-VERSION | CURR-MAPPING-F-VERSION<br>CURR-MAPPING-F-STATUS | PUBLISHED → DEPRECATED | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## CURR-PAGE-PUBLISH Curriculum and Mapping Publication Preview

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | CURR-OBJ-CURRICULUM / CURR-OBJ-MAPPING | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-VALIDATION | Version Validation Result | JSON | required when the curriculum version reaches VALIDATED；状态=VALIDATED | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-STATUS | Curriculum Version Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-PUBLISHED-AT | Published At | DATETIME | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-MAPPING | CURR-MAPPING-F-VERSION | Mapping Source Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-MAPPING | CURR-MAPPING-F-STATUS | Mapping Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURR-ACT-VALIDATE-MAPPING | Validate Knowledge Mapping Publication Readiness | UPDATE | CURR-MAPPING-F-ID<br>CURR-MAPPING-F-VERSION | CURR-MAPPING-F-VERSION<br>CURR-MAPPING-F-STATUS | DRAFT → VALIDATED | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| CURR-ACT-VALIDATE-VERSION | Validate Curriculum Publication Readiness | UPDATE | CURR-CURRICULUM-F-ID | CURR-CURRICULUM-F-VERSION<br>CURR-CURRICULUM-F-VALIDATION<br>CURR-CURRICULUM-F-STATUS | DRAFT / VALIDATING → VALIDATED | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| CURR-ACT-PUBLISH-MAPPING | Publish a Validated Knowledge Mapping | UPDATE | CURR-MAPPING-F-ID<br>CURR-MAPPING-F-VERSION | CURR-MAPPING-F-VERSION<br>CURR-MAPPING-F-STATUS | VALIDATED → PUBLISHED | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| CURR-ACT-PUBLISH-VERSION | Publish a Validated Curriculum Version | UPDATE | CURR-CURRICULUM-F-ID<br>CURR-CURRICULUM-F-VALIDATION | CURR-CURRICULUM-F-VERSION<br>CURR-CURRICULUM-F-STATUS<br>CURR-CURRICULUM-F-PUBLISHED-AT | VALIDATED → PUBLISHED | DUTY-SUBJECT-LEAD / ROLE-ACADEMIC | ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## CURR-PAGE-PATH Published Knowledge Path Viewer

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | CURR-OBJ-MAPPING | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURR-OBJ-MAPPING | CURR-MAPPING-F-CHAPTER-ID | Mapped Chapter ID | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-MAPPING | CURR-MAPPING-F-KP-ID | Mapped Knowledge Point ID | STRING | 是 | OPTION_SET: OPT-COM-011 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-MAPPING | CURR-MAPPING-F-RELATION | Mapping Relation | STRING | 是 | OPTION_SET: OPT-ENUM-043 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| CURR-OBJ-MAPPING | CURR-MAPPING-F-VERSION | Mapping Source Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURR-ACT-VIEW-KNOWLEDGE-PATH | View Student or Teacher Knowledge Path | READ | CURR-MAPPING-F-VERSION | CURR-MAPPING-F-CHAPTER-ID<br>CURR-MAPPING-F-KP-ID<br>CURR-MAPPING-F-RELATION | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
