# SCH-001 Calendar Constraint and Schedule Publication Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | SCH-001 |
| 阶段 | 1 |
| 页面数量 | 2 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## SCH-PAGE-SCHEDULE-OPERATIONS Web Schedule Generation and Conflict Review Workspace

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB | SCH-OBJ-CALENDAR / SCH-OBJ-CONSTRAINT / SCH-OBJ-CONSTRAINT-SNAPSHOT / SCH-OBJ-CANDIDATE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCH-OBJ-CALENDAR | SCH-CALENDAR-F-ID | School Calendar Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CALENDAR | SCH-CALENDAR-F-TERM | School Term | STRING | 是 | OPTION_SET: OPT-COM-004 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CALENDAR | SCH-CALENDAR-F-WORKING-DAYS | Working Days and Periods | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CALENDAR | SCH-CALENDAR-F-VERSION | Calendar Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-ID | Schedule Constraint ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-KIND | Constraint Kind | STRING | 是 | OPTION_SET: OPT-EXT-017 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-HARDNESS | Constraint Hardness | STRING | 是 | OPTION_SET: OPT-EXT-006 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-TEACHER-AVAILABILITY-WINDOWS | Teacher Availability Windows | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-CLASS-COURSE-PERIOD-RULES | Class Course Period Rules | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-TEACHER-LOAD-LIMITS | Teacher Course Load Limits | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-ROOM-CAPACITY-RULES | Room Capacity Rules | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-VERSION | Constraint Snapshot Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT-SNAPSHOT | SCH-CONSTRAINT-SNAPSHOT-F-ID | Immutable Constraint Snapshot ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT-SNAPSHOT | SCH-CONSTRAINT-SNAPSHOT-F-ITEMS | Constraint Snapshot Items | JSON | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT-SNAPSHOT | SCH-CONSTRAINT-SNAPSHOT-F-CONSTRAINT-IDS | Constraint Snapshot Stable IDs | STRING_ARRAY | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT-SNAPSHOT | SCH-CONSTRAINT-SNAPSHOT-F-HASH | Constraint Snapshot Hash | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT-SNAPSHOT | SCH-CONSTRAINT-SNAPSHOT-F-STATUS | Constraint Snapshot Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CONSTRAINT-SNAPSHOT | SCH-CONSTRAINT-SNAPSHOT-F-VERSION | Constraint Snapshot Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-ID | Schedule Candidate Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-ASSIGNMENTS | Candidate Teacher Class Course Room Assignments | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-HARD-CHECK | Hard Constraint Check | STRING | 是 | OPTION_SET: OPT-EXT-007 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CONFLICTS | Conflict Review Findings | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-SOFT-CONSTRAINT-ACKNOWLEDGED | Soft Constraint Acknowledgement | BOOLEAN | required when the schedule candidate is confirmed；状态=CONFIRMED；动作=SCH-ACT-CONFIRM-CANDIDATE | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-STATUS | Schedule Candidate Status | STRING | 是 | OPTION_SET: OPT-EXT-014 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CALENDAR-REF | Pinned Calendar Version | ID | 是 | OBJECT_REF: SCH-OBJ-CALENDAR | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CALENDAR-VERSION | Pinned Calendar Version Number | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF | Pinned Constraint Snapshot | ID | 是 | OBJECT_REF: SCH-OBJ-CONSTRAINT-SNAPSHOT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION | Pinned Constraint Snapshot Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCH-ACT-CREATE-CALENDAR | Create School Calendar Version | CREATE | SCH-CALENDAR-F-TERM<br>SCH-CALENDAR-F-WORKING-DAYS | SCH-CALENDAR-F-ID<br>SCH-CALENDAR-F-VERSION | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-PUBLISH-CALENDAR | Publish School Calendar Version | UPDATE |  | SCH-CALENDAR-F-VERSION | DRAFT → PUBLISHED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-CREATE-TEACHER-AVAILABILITY-CONSTRAINT | Create Teacher Availability Constraint Snapshot | CREATE | SCH-CONSTRAINT-F-KIND<br>SCH-CONSTRAINT-F-HARDNESS<br>SCH-CONSTRAINT-F-TEACHER-AVAILABILITY-WINDOWS | SCH-CONSTRAINT-F-ID<br>SCH-CONSTRAINT-F-VERSION | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-CREATE-CLASS-PERIOD-CONSTRAINT | Create Class Course Period Constraint Snapshot | CREATE | SCH-CONSTRAINT-F-KIND<br>SCH-CONSTRAINT-F-HARDNESS<br>SCH-CONSTRAINT-F-CLASS-COURSE-PERIOD-RULES | SCH-CONSTRAINT-F-ID<br>SCH-CONSTRAINT-F-VERSION | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-CREATE-COURSE-LOAD-CONSTRAINT | Create Teacher Course Load Constraint Snapshot | CREATE | SCH-CONSTRAINT-F-KIND<br>SCH-CONSTRAINT-F-HARDNESS<br>SCH-CONSTRAINT-F-TEACHER-LOAD-LIMITS | SCH-CONSTRAINT-F-ID<br>SCH-CONSTRAINT-F-VERSION | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-CREATE-ROOM-CAPACITY-CONSTRAINT | Create Room Capacity Constraint Snapshot | CREATE | SCH-CONSTRAINT-F-KIND<br>SCH-CONSTRAINT-F-HARDNESS<br>SCH-CONSTRAINT-F-ROOM-CAPACITY-RULES | SCH-CONSTRAINT-F-ID<br>SCH-CONSTRAINT-F-VERSION | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-ACTIVATE-CONSTRAINT | Activate Schedule Constraint | UPDATE |  | SCH-CONSTRAINT-F-HARDNESS<br>SCH-CONSTRAINT-F-VERSION | DRAFT → ACTIVE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-CREATE-CONSTRAINT-SNAPSHOT | Create Complete Constraint Snapshot | CREATE | SCH-CONSTRAINT-SNAPSHOT-F-ITEMS | SCH-CONSTRAINT-SNAPSHOT-F-ID<br>SCH-CONSTRAINT-SNAPSHOT-F-CONSTRAINT-IDS<br>SCH-CONSTRAINT-SNAPSHOT-F-HASH<br>SCH-CONSTRAINT-SNAPSHOT-F-VERSION<br>SCH-CONSTRAINT-SNAPSHOT-F-STATUS | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-ACTIVATE-CONSTRAINT-SNAPSHOT | Activate Complete Constraint Snapshot | UPDATE |  | SCH-CONSTRAINT-SNAPSHOT-F-STATUS<br>SCH-CONSTRAINT-SNAPSHOT-F-VERSION | DRAFT → ACTIVE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-REPLACE-CONSTRAINT-SNAPSHOT | Replace Active Constraint Snapshot | UPDATE |  | SCH-CONSTRAINT-SNAPSHOT-F-STATUS<br>SCH-CONSTRAINT-SNAPSHOT-F-VERSION | ACTIVE → REPLACED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-GENERATE-CANDIDATE | Generate Schedule Candidate | CREATE | SCH-CANDIDATE-F-ASSIGNMENTS<br>SCH-CANDIDATE-F-CALENDAR-REF<br>SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF | SCH-CANDIDATE-F-ID<br>SCH-CANDIDATE-F-HARD-CHECK<br>SCH-CANDIDATE-F-CONFLICTS<br>SCH-CANDIDATE-F-STATUS<br>SCH-CANDIDATE-F-CALENDAR-VERSION<br>SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION | CREATE | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / SOURCE_VERSION_STALE / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-REVIEW-CONFLICTS | Review Schedule Candidate Conflicts | UPDATE |  | SCH-CANDIDATE-F-CONFLICTS<br>SCH-CANDIDATE-F-STATUS | GENERATED → REVIEWED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-CONFIRM-CANDIDATE | Confirm Hard-Constraint-Clean Schedule Candidate | UPDATE | SCH-CANDIDATE-F-HARD-CHECK<br>SCH-CANDIDATE-F-CALENDAR-REF<br>SCH-CANDIDATE-F-CALENDAR-VERSION<br>SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF<br>SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION<br>SCH-CANDIDATE-F-SOFT-CONSTRAINT-ACKNOWLEDGED | SCH-CANDIDATE-F-STATUS<br>SCH-CANDIDATE-F-SOFT-CONSTRAINT-ACKNOWLEDGED | REVIEWED → CONFIRMED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / HARD_CONSTRAINT_FAILED / SOURCE_VERSION_STALE / VALIDATION_FAILED / VERSION_CONFLICT |
| SCH-ACT-PUBLISH-CANDIDATE | Publish Confirmed Schedule Candidate | UPDATE | SCH-CANDIDATE-F-CALENDAR-REF<br>SCH-CANDIDATE-F-CALENDAR-VERSION<br>SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF<br>SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION<br>SCH-CANDIDATE-F-HARD-CHECK<br>SCH-CANDIDATE-F-SOFT-CONSTRAINT-ACKNOWLEDGED | SCH-CANDIDATE-F-STATUS | CONFIRMED → PUBLISHED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / SOURCE_VERSION_STALE / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## SCH-PAGE-MOBILE-CONFLICT-REVIEW Mobile Schedule Conflict Review

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| APP | SCH-OBJ-CANDIDATE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-ASSIGNMENTS | Candidate Teacher Class Course Room Assignments | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-HARD-CHECK | Hard Constraint Check | STRING | 是 | OPTION_SET: OPT-EXT-007 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CONFLICTS | Conflict Review Findings | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-SOFT-CONSTRAINT-ACKNOWLEDGED | Soft Constraint Acknowledgement | BOOLEAN | required when the schedule candidate is confirmed；状态=CONFIRMED；动作=SCH-ACT-CONFIRM-CANDIDATE | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-STATUS | Schedule Candidate Status | STRING | 是 | OPTION_SET: OPT-EXT-014 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CALENDAR-REF | Pinned Calendar Version | ID | 是 | OBJECT_REF: SCH-OBJ-CALENDAR | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CALENDAR-VERSION | Pinned Calendar Version Number | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF | Pinned Constraint Snapshot | ID | 是 | OBJECT_REF: SCH-OBJ-CONSTRAINT-SNAPSHOT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION | Pinned Constraint Snapshot Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCH-ACT-REVIEW-CONFLICTS | Review Schedule Candidate Conflicts | UPDATE |  | SCH-CANDIDATE-F-CONFLICTS<br>SCH-CANDIDATE-F-STATUS | GENERATED → REVIEWED | ROLE-ACADEMIC | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 本页不登记 Web 入口。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
