# PREP-001 Lesson Preparation and Classroom Activity Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | PREP-001 |
| 阶段 | 1 |
| 交付状态 | BUILD_READY |
| 页面数量 | 2 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## PREP-PAGE-LESSON-WORKSPACE Web Lesson Preparation Workspace

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | PREP-OBJ-LESSON-PLAN / PREP-OBJ-MATERIAL-REF / PREP-OBJ-CLASSROOM-ACTIVITY / PREP-OBJ-ASSIGNMENT-DRAFT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-ID | Lesson Plan Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-SUBJECT | Subject | ID | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-COURSE | Course | ID | 是 | OPTION_SET: OPT-COM-008 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-TITLE | Lesson Plan Title | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-RUBRIC-VERSION | Lesson Rubric Version | ID | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-KNOWLEDGE-POINT-IDS | Lesson Knowledge Points | STRING_ARRAY | 是 | OPTION_SET: OPT-COM-011 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-VERSION | Lesson Plan Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-STATUS | Lesson Plan Status | STRING | 是 | OPTION_SET: OPT-EXT-001 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-MATERIAL-REF | PREP-MATERIAL-F-ID | Teaching Material Reference ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-MATERIAL-REF | PREP-MATERIAL-F-REFERENCE | Teaching Material Reference | FILE_REFERENCE | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-MATERIAL-REF | PREP-MATERIAL-F-USAGE-PURPOSE | Material Usage Purpose | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-MATERIAL-REF | PREP-MATERIAL-F-LICENSE-STATUS | Material License Status | STRING | 是 | OPTION_SET: OPT-EXT-002 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-CLASSROOM-ACTIVITY | PREP-ACTIVITY-F-ID | Classroom Activity Record ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-CLASSROOM-ACTIVITY | PREP-ACTIVITY-F-INSTRUCTIONS | Classroom Activity Instructions | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-CLASSROOM-ACTIVITY | PREP-ACTIVITY-F-EVIDENCE | Classroom Activity Evidence | JSON | required only when classroom activity completion is recorded；状态=RECORDED；动作=PREP-ACT-RECORD-CLASSROOM-ACTIVITY | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-CLASSROOM-ACTIVITY | PREP-ACTIVITY-F-STATUS | Classroom Activity Status | STRING | 是 | OPTION_SET: OPT-EXT-012 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-ID | Generated Assignment Draft ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-CONTENT | Generated and Teacher-completed Assignment Draft Content | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-SOURCE-LESSON-REF | Pinned Confirmed Lesson Plan | ID | 是 | OBJECT_REF: PREP-OBJ-LESSON-PLAN | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-SOURCE-LESSON-VERSION | Source Lesson Plan Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-STATUS | Assignment Draft Status | STRING | 是 | OPTION_SET: OPT-EXT-013 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PREP-ACT-CREATE-LESSON-PLAN | Create Lesson Plan Version | CREATE | PREP-LESSON-F-SUBJECT<br>PREP-LESSON-F-COURSE<br>PREP-LESSON-F-TITLE<br>PREP-LESSON-F-RUBRIC-VERSION<br>PREP-LESSON-F-KNOWLEDGE-POINT-IDS | PREP-LESSON-F-ID<br>PREP-LESSON-F-VERSION<br>PREP-LESSON-F-STATUS | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-CONFIRM-LESSON-PLAN | Confirm Lesson Plan Version | UPDATE |  | PREP-LESSON-F-VERSION<br>PREP-LESSON-F-STATUS | DRAFT → CONFIRMED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-REFERENCE-MATERIAL | Reference Teaching Material | CREATE | PREP-MATERIAL-F-REFERENCE<br>PREP-MATERIAL-F-USAGE-PURPOSE | PREP-MATERIAL-F-ID<br>PREP-MATERIAL-F-LICENSE-STATUS | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-VERIFY-MATERIAL-LICENSE | Verify Teaching Material License | UPDATE |  | PREP-MATERIAL-F-LICENSE-STATUS | PENDING → VERIFIED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-PLAN-CLASSROOM-ACTIVITY | Plan Classroom Activity | CREATE | PREP-ACTIVITY-F-INSTRUCTIONS | PREP-ACTIVITY-F-ID<br>PREP-ACTIVITY-F-STATUS | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-GENERATE-ASSIGNMENT-DRAFT | Generate Assignment Draft for Teacher Confirmation | CREATE | PREP-DRAFT-F-SOURCE-LESSON-REF | PREP-DRAFT-F-ID<br>PREP-DRAFT-F-CONTENT<br>PREP-DRAFT-F-SOURCE-LESSON-VERSION<br>PREP-DRAFT-F-STATUS | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / LESSON_STALE / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-COMPLETE-ASSIGNMENT-DRAFT | Complete Teacher-required Assignment Draft Fields | UPDATE | PREP-DRAFT-F-CONTENT | PREP-DRAFT-F-CONTENT<br>PREP-DRAFT-F-STATUS | DRAFT → DRAFT | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF | Confirm Complete Draft for Formal HW Creation | UPDATE | PREP-DRAFT-F-SOURCE-LESSON-REF<br>PREP-DRAFT-F-SOURCE-LESSON-VERSION | PREP-DRAFT-F-STATUS | DRAFT → READY_FOR_HANDOFF | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / LESSON_STALE / HANDOFF_INCOMPLETE / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## PREP-PAGE-MOBILE-CLASSROOM Mobile Classroom Activity Workspace

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | APP | PREP-OBJ-LESSON-PLAN / PREP-OBJ-MATERIAL-REF / PREP-OBJ-CLASSROOM-ACTIVITY / PREP-OBJ-ASSIGNMENT-DRAFT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-ID | Lesson Plan Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-SUBJECT | Subject | ID | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-COURSE | Course | ID | 是 | OPTION_SET: OPT-COM-008 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-TITLE | Lesson Plan Title | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-RUBRIC-VERSION | Lesson Rubric Version | ID | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-KNOWLEDGE-POINT-IDS | Lesson Knowledge Points | STRING_ARRAY | 是 | OPTION_SET: OPT-COM-011 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-VERSION | Lesson Plan Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-STATUS | Lesson Plan Status | STRING | 是 | OPTION_SET: OPT-EXT-001 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-MATERIAL-REF | PREP-MATERIAL-F-ID | Teaching Material Reference ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-MATERIAL-REF | PREP-MATERIAL-F-REFERENCE | Teaching Material Reference | FILE_REFERENCE | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-MATERIAL-REF | PREP-MATERIAL-F-USAGE-PURPOSE | Material Usage Purpose | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-MATERIAL-REF | PREP-MATERIAL-F-LICENSE-STATUS | Material License Status | STRING | 是 | OPTION_SET: OPT-EXT-002 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-CLASSROOM-ACTIVITY | PREP-ACTIVITY-F-ID | Classroom Activity Record ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-CLASSROOM-ACTIVITY | PREP-ACTIVITY-F-INSTRUCTIONS | Classroom Activity Instructions | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-CLASSROOM-ACTIVITY | PREP-ACTIVITY-F-EVIDENCE | Classroom Activity Evidence | JSON | required only when classroom activity completion is recorded；状态=RECORDED；动作=PREP-ACT-RECORD-CLASSROOM-ACTIVITY | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-CLASSROOM-ACTIVITY | PREP-ACTIVITY-F-STATUS | Classroom Activity Status | STRING | 是 | OPTION_SET: OPT-EXT-012 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-ID | Generated Assignment Draft ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-CONTENT | Generated and Teacher-completed Assignment Draft Content | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-SOURCE-LESSON-REF | Pinned Confirmed Lesson Plan | ID | 是 | OBJECT_REF: PREP-OBJ-LESSON-PLAN | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-SOURCE-LESSON-VERSION | Source Lesson Plan Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-STATUS | Assignment Draft Status | STRING | 是 | OPTION_SET: OPT-EXT-013 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PREP-ACT-CREATE-LESSON-PLAN | Create Lesson Plan Version | CREATE | PREP-LESSON-F-SUBJECT<br>PREP-LESSON-F-COURSE<br>PREP-LESSON-F-TITLE<br>PREP-LESSON-F-RUBRIC-VERSION<br>PREP-LESSON-F-KNOWLEDGE-POINT-IDS | PREP-LESSON-F-ID<br>PREP-LESSON-F-VERSION<br>PREP-LESSON-F-STATUS | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-CONFIRM-LESSON-PLAN | Confirm Lesson Plan Version | UPDATE |  | PREP-LESSON-F-VERSION<br>PREP-LESSON-F-STATUS | DRAFT → CONFIRMED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-REFERENCE-MATERIAL | Reference Teaching Material | CREATE | PREP-MATERIAL-F-REFERENCE<br>PREP-MATERIAL-F-USAGE-PURPOSE | PREP-MATERIAL-F-ID<br>PREP-MATERIAL-F-LICENSE-STATUS | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-VERIFY-MATERIAL-LICENSE | Verify Teaching Material License | UPDATE |  | PREP-MATERIAL-F-LICENSE-STATUS | PENDING → VERIFIED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-PLAN-CLASSROOM-ACTIVITY | Plan Classroom Activity | CREATE | PREP-ACTIVITY-F-INSTRUCTIONS | PREP-ACTIVITY-F-ID<br>PREP-ACTIVITY-F-STATUS | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-RECORD-CLASSROOM-ACTIVITY | Record Classroom Activity Completion | UPDATE | PREP-ACTIVITY-F-EVIDENCE | PREP-ACTIVITY-F-EVIDENCE<br>PREP-ACTIVITY-F-STATUS | PLANNED → RECORDED | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-GENERATE-ASSIGNMENT-DRAFT | Generate Assignment Draft for Teacher Confirmation | CREATE | PREP-DRAFT-F-SOURCE-LESSON-REF | PREP-DRAFT-F-ID<br>PREP-DRAFT-F-CONTENT<br>PREP-DRAFT-F-SOURCE-LESSON-VERSION<br>PREP-DRAFT-F-STATUS | CREATE | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / LESSON_STALE / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-COMPLETE-ASSIGNMENT-DRAFT | Complete Teacher-required Assignment Draft Fields | UPDATE | PREP-DRAFT-F-CONTENT | PREP-DRAFT-F-CONTENT<br>PREP-DRAFT-F-STATUS | DRAFT → DRAFT | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PREP-ACT-CONFIRM-ASSIGNMENT-HANDOFF | Confirm Complete Draft for Formal HW Creation | UPDATE | PREP-DRAFT-F-SOURCE-LESSON-REF<br>PREP-DRAFT-F-SOURCE-LESSON-VERSION | PREP-DRAFT-F-STATUS | DRAFT → READY_FOR_HANDOFF | DUTY-SUBJECT-TEACHER | ROLE-STUDENT / DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / LESSON_STALE / HANDOFF_INCOMPLETE / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 本页不登记 Web 入口。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
