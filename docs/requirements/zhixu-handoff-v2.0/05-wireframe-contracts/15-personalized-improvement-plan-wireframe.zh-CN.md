交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。

# PLN-001 Improvement Plans and Explicit Coordination Outputs Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | PLN-001 |
| 阶段 | 3 |
| 交付状态 | PLANNED |
| 页面数量 | 3 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## PLN-PAGE-PLAN Subject Improvement Plan Workspace

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | PLN-OBJ-PLAN | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLN-OBJ-PLAN | PLN-PLAN-F-ID | Improvement Plan ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-STUDENT-REF | Plan Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-SOURCE-DATA-ID | Source Evidence Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-SOURCE-EVIDENCE-REF | Source Evidence Reference | ID | 是 | OBJECT_REF: INS-OBJ-EVIDENCE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-SOURCE-EVIDENCE-VERSION | Source Evidence Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-GOAL-CANDIDATE | Improvement Goal Candidate | TEXT | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-TASK-CONTENT-CANDIDATE | Improvement Task Content Candidate | TEXT | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-WORKLOAD-CANDIDATE | Planned Workload Candidate | DECIMAL | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-DUE-AT-CANDIDATE | Plan Due Time Candidate | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-SUCCESS-CONDITION-CANDIDATE | Plan Success Condition Candidate | TEXT | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-EVIDENCE-REQUIREMENT-CANDIDATE | Completion Evidence Requirement Candidate | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-REVALIDATION-METHOD-CANDIDATE | Plan Revalidation Method Candidate | TEXT | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-GOAL | Improvement Goal | TEXT | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-SUBJECT | Improvement Subject | ID | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-KNOWLEDGE-POINT-REF | Plan Knowledge Point Reference | ID | 是 | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-KNOWLEDGE-POINT-VERSION | Plan Knowledge Point Version | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-PRIORITY | Improvement Priority | STRING | 是 | OPTION_SET: OPT-ENUM-012 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-TASK-CONTENT | Improvement Task Content | TEXT | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-WORKLOAD | Planned Workload | DECIMAL | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-DUE-AT | Plan Due Time | DATETIME | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-SUCCESS-CONDITION | Plan Success Condition | TEXT | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-EVIDENCE-REQUIREMENT | Completion Evidence Requirement | STRING | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | OPTION_SET: OPT-ENUM-034 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-REVALIDATION-METHOD | Plan Revalidation Method | TEXT | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-TEACHER-CONFIRMER-REF | Plan Teacher Confirmer Reference | ID | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | OBJECT_REF: ORG-OBJ-TEACHER | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-REF | Student Difficulty Feedback Reference | ID | required when a student difficulty report changes the plan；状态=ACTIVE；动作=PLN-ACT-ADJUST-PLAN | OBJECT_REF: APP-OBJ-TODO | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-VERSION | Student Difficulty Feedback Version | INTEGER | required when a student difficulty report changes the plan；状态=ACTIVE；动作=PLN-ACT-ADJUST-PLAN | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-ADJUSTMENT-REASON | Plan Adjustment Reason | TEXT | required when plan content or workload changes；状态=ACTIVE；动作=PLN-ACT-ADJUST-PLAN | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-CLOSE-REASON | Plan Close Reason | TEXT | required when the plan closes；状态=CLOSED；动作=PLN-ACT-CLOSE-PLAN | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-INVALIDATION-REF | Plan Evaluation Invalidation Reference | ID | required when the plan evaluation enters pending reconfirmation；状态=PENDING_RECONFIRM | OBJECT_REF: CORR-OBJ-INVALIDATION | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-INVALIDATION-VERSION | Plan Evaluation Invalidation Version | INTEGER | required when the plan evaluation enters pending reconfirmation；状态=PENDING_RECONFIRM | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-EVALUATION-STATE | Plan Evaluation State | STRING | required when an ACTIVE plan enters evaluation；状态=PENDING_RECONFIRM | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-EVALUATION-VERSION | Plan Evaluation Version | INTEGER | required when an ACTIVE plan enters evaluation；状态=PENDING_RECONFIRM | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-PLAN | PLN-PLAN-F-PLAN-VERSION | Improvement Plan Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLN-ACT-CONFIRM-PLAN | Confirm the Subject Improvement Plan | UPDATE | PLN-PLAN-F-GOAL<br>PLN-PLAN-F-SUBJECT<br>PLN-PLAN-F-KNOWLEDGE-POINT-REF<br>PLN-PLAN-F-KNOWLEDGE-POINT-VERSION<br>PLN-PLAN-F-PRIORITY<br>PLN-PLAN-F-TASK-CONTENT<br>PLN-PLAN-F-WORKLOAD<br>PLN-PLAN-F-DUE-AT<br>PLN-PLAN-F-SUCCESS-CONDITION<br>PLN-PLAN-F-EVIDENCE-REQUIREMENT<br>PLN-PLAN-F-REVALIDATION-METHOD<br>PLN-PLAN-F-TEACHER-CONFIRMER-REF | PLN-PLAN-F-TEACHER-CONFIRMER-REF<br>PLN-PLAN-F-PLAN-VERSION | CANDIDATE → ACTIVE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / MISSING_SUCCESS_CONDITION / STALE_INPUT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| PLN-ACT-ADJUST-PLAN | Adjust an Active Subject Improvement Plan | UPDATE | PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-REF<br>PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-VERSION<br>PLN-PLAN-F-TASK-CONTENT<br>PLN-PLAN-F-WORKLOAD<br>PLN-PLAN-F-DUE-AT<br>PLN-PLAN-F-ADJUSTMENT-REASON | PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-REF<br>PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-VERSION<br>PLN-PLAN-F-ADJUSTMENT-REASON<br>PLN-PLAN-F-PLAN-VERSION | ACTIVE → ACTIVE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / ADJUSTMENT_REASON_REQUIRED / STALE_INPUT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| PLN-ACT-CLOSE-PLAN | Close an Improvement Plan | UPDATE | PLN-PLAN-F-CLOSE-REASON | PLN-PLAN-F-CLOSE-REASON<br>PLN-PLAN-F-PLAN-VERSION | ACTIVE → CLOSED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / CLOSE_REASON_REQUIRED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## PLN-PAGE-HOMEROOM Read-only Homeroom Plan Coordination

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | PLN-OBJ-HOMEROOM-COORDINATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-ID | Homeroom Coordination Output ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-PLAN-REF | Coordinated Plan Reference | ID | 是 | OBJECT_REF: PLN-OBJ-PLAN | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-PLAN-VERSION | Coordinated Plan Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-CLASS-SCOPE | Homeroom Class Scope | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-LOAD-SUMMARY | Read-only Cross-subject Coordination Load | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-STATUS | Homeroom Coordination Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-OUTPUT-VERSION | Homeroom Coordination Output Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLN-ACT-VIEW-HOMEROOM-COORDINATION | View the Read-only Homeroom Plan Coordination | READ | PLN-HOMEROOM-F-ID | PLN-HOMEROOM-F-ID<br>PLN-HOMEROOM-F-PLAN-REF<br>PLN-HOMEROOM-F-PLAN-VERSION<br>PLN-HOMEROOM-F-CLASS-SCOPE<br>PLN-HOMEROOM-F-LOAD-SUMMARY<br>PLN-HOMEROOM-F-STATUS<br>PLN-HOMEROOM-F-OUTPUT-VERSION | UNCHANGED | DUTY-SUBJECT-TEACHER / DUTY-HOMEROOM | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## PLN-PAGE-CLASS-PROGRESS Subject Class Progress and Homeroom Coordination

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | PLN-OBJ-CLASS-PROGRESS | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-ID | Class Progress ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-CLASS-REF | Class Reference | ID | 是 | OBJECT_REF: ORG-OBJ-CLASS | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-SUBJECT | Subject | ID | 是 | OPTION_SET: OPT-COM-007 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-CURRICULUM-REF | Curriculum Reference | ID | 是 | OBJECT_REF: CURR-OBJ-CURRICULUM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-CURRICULUM-VERSION | Curriculum Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-UNIT | Current Unit | ID | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-TARGET-REF | Current Curriculum Target Reference | ID | 是 | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-TARGET-VERSION | Current Curriculum Target Version | ID | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-TEACHER-REF | Responsible Subject Teacher | ID | 是 | OBJECT_REF: ORG-OBJ-TEACHER | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-STATUS | Class Progress Status | STRING | 是 | OPTION_SET: OPT-PH3-003 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-CHANGE-REASON | Progress Change Reason | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-EFFECTIVE-AT | Progress Effective Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-VERSION | Class Progress Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLN-ACT-CREATE-CLASS-PROGRESS | Create Subject Class Progress | CREATE | PLN-CLASS-PROGRESS-F-CLASS-REF<br>PLN-CLASS-PROGRESS-F-SUBJECT<br>PLN-CLASS-PROGRESS-F-CURRICULUM-REF<br>PLN-CLASS-PROGRESS-F-CURRICULUM-VERSION<br>PLN-CLASS-PROGRESS-F-UNIT<br>PLN-CLASS-PROGRESS-F-TARGET-REF<br>PLN-CLASS-PROGRESS-F-TARGET-VERSION<br>PLN-CLASS-PROGRESS-F-CHANGE-REASON | PLN-CLASS-PROGRESS-F-ID<br>PLN-CLASS-PROGRESS-F-TEACHER-REF<br>PLN-CLASS-PROGRESS-F-STATUS<br>PLN-CLASS-PROGRESS-F-EFFECTIVE-AT<br>PLN-CLASS-PROGRESS-F-VERSION | CREATE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLN-ACT-ACTIVATE-CLASS-PROGRESS | Activate Subject Class Progress | UPDATE |  | PLN-CLASS-PROGRESS-F-STATUS<br>PLN-CLASS-PROGRESS-F-EFFECTIVE-AT<br>PLN-CLASS-PROGRESS-F-VERSION | DRAFT → ACTIVE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLN-ACT-ADVANCE-CLASS-PROGRESS | Advance Subject Class Curriculum Target | UPDATE | PLN-CLASS-PROGRESS-F-UNIT<br>PLN-CLASS-PROGRESS-F-TARGET-REF<br>PLN-CLASS-PROGRESS-F-TARGET-VERSION<br>PLN-CLASS-PROGRESS-F-CHANGE-REASON | PLN-CLASS-PROGRESS-F-UNIT<br>PLN-CLASS-PROGRESS-F-TARGET-REF<br>PLN-CLASS-PROGRESS-F-TARGET-VERSION<br>PLN-CLASS-PROGRESS-F-CHANGE-REASON<br>PLN-CLASS-PROGRESS-F-EFFECTIVE-AT<br>PLN-CLASS-PROGRESS-F-VERSION | ACTIVE → ACTIVE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | AUDIT_FAILED |
| PLN-ACT-COMPLETE-CLASS-PROGRESS | Complete Subject Class Progress | UPDATE | PLN-CLASS-PROGRESS-F-CHANGE-REASON | PLN-CLASS-PROGRESS-F-STATUS<br>PLN-CLASS-PROGRESS-F-CHANGE-REASON<br>PLN-CLASS-PROGRESS-F-EFFECTIVE-AT<br>PLN-CLASS-PROGRESS-F-VERSION | ACTIVE → COMPLETED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLN-ACT-REOPEN-CLASS-PROGRESS | Reopen Subject Class Progress | UPDATE | PLN-CLASS-PROGRESS-F-CHANGE-REASON | PLN-CLASS-PROGRESS-F-STATUS<br>PLN-CLASS-PROGRESS-F-CHANGE-REASON<br>PLN-CLASS-PROGRESS-F-EFFECTIVE-AT<br>PLN-CLASS-PROGRESS-F-VERSION | COMPLETED → ACTIVE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-STUDENT / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLN-ACT-VIEW-CLASS-PROGRESS | View Class Progress without Personal Mastery Detail | READ | PLN-CLASS-PROGRESS-F-CLASS-REF | PLN-CLASS-PROGRESS-F-ID<br>PLN-CLASS-PROGRESS-F-CLASS-REF<br>PLN-CLASS-PROGRESS-F-SUBJECT<br>PLN-CLASS-PROGRESS-F-CURRICULUM-REF<br>PLN-CLASS-PROGRESS-F-CURRICULUM-VERSION<br>PLN-CLASS-PROGRESS-F-UNIT<br>PLN-CLASS-PROGRESS-F-TARGET-REF<br>PLN-CLASS-PROGRESS-F-TARGET-VERSION<br>PLN-CLASS-PROGRESS-F-TEACHER-REF<br>PLN-CLASS-PROGRESS-F-STATUS<br>PLN-CLASS-PROGRESS-F-CHANGE-REASON<br>PLN-CLASS-PROGRESS-F-EFFECTIVE-AT<br>PLN-CLASS-PROGRESS-F-VERSION | UNCHANGED | DUTY-SUBJECT-TEACHER / DUTY-HOMEROOM / ROLE-STUDENT | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
