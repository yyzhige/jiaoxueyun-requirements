交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。

# VIDEO-001 Phase-two Source-bound Teaching Video and New-context Verification Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | VIDEO-001 |
| 阶段 | 2 |
| 交付状态 | PLANNED |
| 页面数量 | 4 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## VIDEO-PAGE-STUDENT-REQUEST Student Problem or Progress Teaching Video Request

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | VIDEO-OBJ-REQUEST | CURRENT_CONTEXT / PRIMARY_TASK / SOURCE_AND_GATE_STATUS / NEXT_ACTION | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION / PROCESSING / BLOCKED / RECALLED / LOW_BANDWIDTH |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ID | Teaching Video Request ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-STUDENT-REF | Video Service Student | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-REQUESTER-REF | Video Requester | ID | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must equal the authenticated student who owns VIDEO-REQUEST-F-STUDENT-REF |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-REQUESTER-KIND | Video Requester Kind | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-REQUESTER-KIND | IMMUTABLE | AUTHORIZED_SCOPE | must equal STUDENT for a personal video request |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-SERVICE-AUDIENCE | Video Service Audience | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-SERVICE-AUDIENCE | IMMUTABLE | AUTHORIZED_SCOPE | must equal INDIVIDUAL_STUDENT for a personal video request |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-SERVICE-OBJECT-REFS | Video Service Object References | STRING_ARRAY | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must contain exactly the serviced student reference and no class or unrelated student |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MANAGEMENT-SCOPE | Video Management Scope | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-MANAGEMENT-SCOPE | IMMUTABLE | AUTHORIZED_SCOPE | must equal STUDENT_PERSONAL_LEARNING and remain under the serviced student's personal learning management |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-SOURCE-MATERIALS | Pinned Source Materials | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must list every source material ID, version, permission, and rights record included in generation |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ACCESS-SCOPE | Video Access Scope | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-ACCESS-SCOPE | IMMUTABLE | AUTHORIZED_SCOPE | must equal SERVICED_STUDENT_ONLY |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ACCESS-DOMAIN | Video Access Domain | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-ACCESS-DOMAIN | IMMUTABLE | AUTHORIZED_SCOPE | must equal STUDENT_PERSONAL |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-KIND | Teaching Video Request Kind | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-REQUEST-KIND | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ACTIVITY-REF | Pinned Source Activity | ID | 否 | OBJECT_REF: HW-OBJ-ASSIGNMENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ACTIVITY-VERSION | Pinned Source Activity Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-SUBMISSION-REF | Pinned Source Submission | ID | 否 | OBJECT_REF: SUB-OBJ-ATTEMPT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-SUBMISSION-VERSION | Pinned Source Submission Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ASSESSMENT-RESULT-REF | Pinned AI Assessment Result | ID | 是 | OBJECT_REF: GRD-OBJ-DECISION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ASSESSMENT-RESULT-VERSION | Pinned AI Assessment Result Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ASSESSMENT-STANDARD-REF | Pinned Assessment Standard | ID | 是 | OBJECT_REF: GRD-OBJ-ASSESSMENT-STANDARD-VERSION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ASSESSMENT-STANDARD-VERSION | Pinned Assessment Standard Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-PUBLISHED-RESULT-REF | Pinned Published Assessment Result | ID | 是 | OBJECT_REF: PUB-OBJ-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-PUBLISHED-RESULT-VERSION | Pinned Published Assessment Result Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MINIMUM-PROGRESS-REF | Pinned Minimum Learning State | ID | 是 | OBJECT_REF: PROG-OBJ-STUDENT-TARGET | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MINIMUM-PROGRESS-VERSION | Pinned Minimum Learning State Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-REF | Pinned Student-selected Next Target | ID | 否 | OBJECT_REF: PROG-OBJ-NEXT-TARGET-CHOICE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-VERSION | Pinned Student-selected Next Target Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MATERIAL-RIGHTS-REF | Pinned Source Material Rights | ID | 是 | OBJECT_REF: CONTENT-OBJ-LICENSE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MATERIAL-RIGHTS-VERSION | Pinned Source Material Rights Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MATERIAL-PERMISSION-REF | Pinned Source Material Permission | ID | 是 | OBJECT_REF: CONTENT-OBJ-PERMISSION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MATERIAL-PERMISSION-VERSION | Pinned Source Material Permission Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ANSWER-OPEN-POLICY-ID | Answer Open Policy ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must equal ANSWER-OPEN-POLICY-V2 |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ANSWER-OPEN-POLICY-VERSION | Answer Open Policy Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ANSWER-SOLUTION-RUBRIC-OPEN-AT | Pinned Answer Solution and Rubric Open Times | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must separately pin answerOpenAt, solutionOpenAt, and rubricOpenAt from the published result policy |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-SOURCE-BINDING-DIGEST | Fixed Source Version Binding Digest | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ACCEPTED-AT | Video Request Accepted Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-STATUS | Video Request Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-VERSION | Teaching Video Request Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VIDEO-ACT-REQUEST-PROBLEM-DRIVEN | Request a Problem-driven Teaching Video | CREATE | VIDEO-REQUEST-F-STUDENT-REF<br>VIDEO-REQUEST-F-REQUESTER-REF<br>VIDEO-REQUEST-F-REQUESTER-KIND<br>VIDEO-REQUEST-F-SERVICE-AUDIENCE<br>VIDEO-REQUEST-F-SERVICE-OBJECT-REFS<br>VIDEO-REQUEST-F-MANAGEMENT-SCOPE<br>VIDEO-REQUEST-F-SOURCE-MATERIALS<br>VIDEO-REQUEST-F-ACCESS-SCOPE<br>VIDEO-REQUEST-F-ACCESS-DOMAIN<br>VIDEO-REQUEST-F-KIND<br>VIDEO-REQUEST-F-ASSESSMENT-RESULT-REF<br>VIDEO-REQUEST-F-ASSESSMENT-RESULT-VERSION<br>VIDEO-REQUEST-F-ASSESSMENT-STANDARD-REF<br>VIDEO-REQUEST-F-ASSESSMENT-STANDARD-VERSION<br>VIDEO-REQUEST-F-PUBLISHED-RESULT-REF<br>VIDEO-REQUEST-F-PUBLISHED-RESULT-VERSION<br>VIDEO-REQUEST-F-MINIMUM-PROGRESS-REF<br>VIDEO-REQUEST-F-MINIMUM-PROGRESS-VERSION<br>VIDEO-REQUEST-F-MATERIAL-RIGHTS-REF<br>VIDEO-REQUEST-F-MATERIAL-RIGHTS-VERSION<br>VIDEO-REQUEST-F-MATERIAL-PERMISSION-REF<br>VIDEO-REQUEST-F-MATERIAL-PERMISSION-VERSION<br>VIDEO-REQUEST-F-ANSWER-OPEN-POLICY-ID<br>VIDEO-REQUEST-F-ANSWER-OPEN-POLICY-VERSION<br>VIDEO-REQUEST-F-ANSWER-SOLUTION-RUBRIC-OPEN-AT<br>VIDEO-REQUEST-F-SOURCE-BINDING-DIGEST<br>VIDEO-REQUEST-F-ACTIVITY-REF<br>VIDEO-REQUEST-F-ACTIVITY-VERSION<br>VIDEO-REQUEST-F-SUBMISSION-REF<br>VIDEO-REQUEST-F-SUBMISSION-VERSION | VIDEO-REQUEST-F-ID<br>VIDEO-REQUEST-F-ACCEPTED-AT<br>VIDEO-REQUEST-F-STATUS<br>VIDEO-REQUEST-F-VERSION | CREATE | ROLE-STUDENT | AI / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / SOURCE_VERSION_STALE / ANSWER_NOT_OPEN / RIGHTS_NOT_VALID / VALIDATION_FAILED / VERSION_CONFLICT |
| VIDEO-ACT-REQUEST-PROGRESS-DRIVEN | Request a Student-selected Progress-driven Teaching Video | CREATE | VIDEO-REQUEST-F-STUDENT-REF<br>VIDEO-REQUEST-F-REQUESTER-REF<br>VIDEO-REQUEST-F-REQUESTER-KIND<br>VIDEO-REQUEST-F-SERVICE-AUDIENCE<br>VIDEO-REQUEST-F-SERVICE-OBJECT-REFS<br>VIDEO-REQUEST-F-MANAGEMENT-SCOPE<br>VIDEO-REQUEST-F-SOURCE-MATERIALS<br>VIDEO-REQUEST-F-ACCESS-SCOPE<br>VIDEO-REQUEST-F-ACCESS-DOMAIN<br>VIDEO-REQUEST-F-KIND<br>VIDEO-REQUEST-F-ASSESSMENT-RESULT-REF<br>VIDEO-REQUEST-F-ASSESSMENT-RESULT-VERSION<br>VIDEO-REQUEST-F-ASSESSMENT-STANDARD-REF<br>VIDEO-REQUEST-F-ASSESSMENT-STANDARD-VERSION<br>VIDEO-REQUEST-F-PUBLISHED-RESULT-REF<br>VIDEO-REQUEST-F-PUBLISHED-RESULT-VERSION<br>VIDEO-REQUEST-F-MINIMUM-PROGRESS-REF<br>VIDEO-REQUEST-F-MINIMUM-PROGRESS-VERSION<br>VIDEO-REQUEST-F-MATERIAL-RIGHTS-REF<br>VIDEO-REQUEST-F-MATERIAL-RIGHTS-VERSION<br>VIDEO-REQUEST-F-MATERIAL-PERMISSION-REF<br>VIDEO-REQUEST-F-MATERIAL-PERMISSION-VERSION<br>VIDEO-REQUEST-F-ANSWER-OPEN-POLICY-ID<br>VIDEO-REQUEST-F-ANSWER-OPEN-POLICY-VERSION<br>VIDEO-REQUEST-F-ANSWER-SOLUTION-RUBRIC-OPEN-AT<br>VIDEO-REQUEST-F-SOURCE-BINDING-DIGEST<br>VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-REF<br>VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-VERSION | VIDEO-REQUEST-F-ID<br>VIDEO-REQUEST-F-ACCEPTED-AT<br>VIDEO-REQUEST-F-STATUS<br>VIDEO-REQUEST-F-VERSION | CREATE | ROLE-STUDENT | AI / DUTY-SUBJECT-TEACHER | LOW / REQUIRED | PERMISSION_DENIED / COMPLETION_EVIDENCE_REQUIRED / STUDENT_CHOICE_REQUIRED / SOURCE_VERSION_STALE / ANSWER_NOT_OPEN / RIGHTS_NOT_VALID / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## VIDEO-PAGE-TEACHER-SCHOOL-REQUEST Teacher School-private Class or Student-group Video Request

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | VIDEO-OBJ-SCHOOL-REQUEST | CURRENT_CONTEXT / PRIMARY_TASK / SOURCE_AND_GATE_STATUS / NEXT_ACTION | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION / PROCESSING / BLOCKED / RECALLED / LOW_BANDWIDTH |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ID | School-private Teaching Video Request ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-REQUESTER-TEACHER-REF | Requesting Subject Teacher | ID | 是 | OBJECT_REF: ORG-OBJ-TEACHER | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-REQUESTER-KIND | School Video Requester Kind | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-REQUESTER-KIND | IMMUTABLE | AUTHORIZED_SCOPE | must equal SUBJECT_TEACHER |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-SERVICE-AUDIENCE | School Video Service Audience | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-SERVICE-AUDIENCE | IMMUTABLE | AUTHORIZED_SCOPE | must equal CLASS or STUDENT_GROUP inside the requesting teacher's effective assignment |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-CLASS-REF | Assigned Service Class | ID | 是 | OBJECT_REF: ORG-OBJ-CLASS | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-SERVICE-OBJECT-REFS | Authorized Class or Student Group References | STRING_ARRAY | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must resolve to one assigned class or an explicit bounded subset of students in that class |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-MANAGEMENT-SCOPE | School Video Management Scope | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-MANAGEMENT-SCOPE | IMMUTABLE | AUTHORIZED_SCOPE | must equal SCHOOL_PRIVATE_TEACHING and remain school-managed after the requesting teacher leaves |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-SOURCE-MATERIALS | Pinned School Source Materials | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must list every school-private source material ID, version, permission, and rights record without exposing individual student submissions to the group |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ACCESS-SCOPE | School Video Access Scope | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-ACCESS-SCOPE | IMMUTABLE | AUTHORIZED_SCOPE | must equal AUTHORIZED_CLASS_OR_GROUP |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ACCESS-DOMAIN | School Video Access Domain | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-ACCESS-DOMAIN | IMMUTABLE | AUTHORIZED_SCOPE | must equal SCHOOL_PRIVATE and cannot migrate school-private materials unconditionally across schools |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-KIND | School Teaching Video Kind | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-REQUEST-KIND | IMMUTABLE | AUTHORIZED_SCOPE | must equal PROBLEM_DRIVEN; student-selected progress video remains an individual student action |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-REF | Effective Teaching Assignment | ID | 是 | OBJECT_REF: ORG-OBJ-TEACHING-ASSIGNMENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-VERSION | Pinned Teaching Scope Snapshot Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must pin the effective teacher, course, class, substitute relation if any, and authorization digest |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ACTIVITY-REF | Pinned School Teaching Activity | ID | 是 | OBJECT_REF: HW-OBJ-ASSIGNMENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ACTIVITY-VERSION | Pinned School Teaching Activity Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-MATERIAL-RIGHTS-REF | Pinned School Source Material Rights | ID | 是 | OBJECT_REF: CONTENT-OBJ-LICENSE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-MATERIAL-RIGHTS-VERSION | Pinned School Source Material Rights Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-MATERIAL-PERMISSION-REF | Pinned School Source Material Permission | ID | 是 | OBJECT_REF: CONTENT-OBJ-PERMISSION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-MATERIAL-PERMISSION-VERSION | Pinned School Source Material Permission Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-TEACHING-BASIS | Versioned Group Teaching Basis | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must contain a teacher-confirmed group teaching problem or target without public ranking, permanent weakness labels, or individual answer disclosure |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ANSWER-OPEN-POLICY-ID | School Video Answer Open Policy ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must equal ANSWER-OPEN-POLICY-V2 |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ANSWER-OPEN-POLICY-VERSION | School Video Answer Open Policy Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-SOURCE-BINDING-DIGEST | School Video Fixed Source Binding Digest | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ACCEPTED-AT | School Video Request Accepted Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-STATUS | School Video Request Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-VERSION | School Video Request Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VIDEO-ACT-REQUEST-SCHOOL-GROUP | Request a School-private Class or Student-group Teaching Video | CREATE | VIDEO-SCHOOL-REQUEST-F-REQUESTER-TEACHER-REF<br>VIDEO-SCHOOL-REQUEST-F-REQUESTER-KIND<br>VIDEO-SCHOOL-REQUEST-F-SERVICE-AUDIENCE<br>VIDEO-SCHOOL-REQUEST-F-CLASS-REF<br>VIDEO-SCHOOL-REQUEST-F-SERVICE-OBJECT-REFS<br>VIDEO-SCHOOL-REQUEST-F-MANAGEMENT-SCOPE<br>VIDEO-SCHOOL-REQUEST-F-SOURCE-MATERIALS<br>VIDEO-SCHOOL-REQUEST-F-ACCESS-SCOPE<br>VIDEO-SCHOOL-REQUEST-F-ACCESS-DOMAIN<br>VIDEO-SCHOOL-REQUEST-F-KIND<br>VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-REF<br>VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-VERSION<br>VIDEO-SCHOOL-REQUEST-F-ACTIVITY-REF<br>VIDEO-SCHOOL-REQUEST-F-ACTIVITY-VERSION<br>VIDEO-SCHOOL-REQUEST-F-MATERIAL-RIGHTS-REF<br>VIDEO-SCHOOL-REQUEST-F-MATERIAL-RIGHTS-VERSION<br>VIDEO-SCHOOL-REQUEST-F-MATERIAL-PERMISSION-REF<br>VIDEO-SCHOOL-REQUEST-F-MATERIAL-PERMISSION-VERSION<br>VIDEO-SCHOOL-REQUEST-F-TEACHING-BASIS<br>VIDEO-SCHOOL-REQUEST-F-ANSWER-OPEN-POLICY-ID<br>VIDEO-SCHOOL-REQUEST-F-ANSWER-OPEN-POLICY-VERSION<br>VIDEO-SCHOOL-REQUEST-F-SOURCE-BINDING-DIGEST | VIDEO-SCHOOL-REQUEST-F-ID<br>VIDEO-SCHOOL-REQUEST-F-ACCEPTED-AT<br>VIDEO-SCHOOL-REQUEST-F-STATUS<br>VIDEO-SCHOOL-REQUEST-F-VERSION | CREATE | DUTY-SUBJECT-TEACHER | AI / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / TEACHING_SCOPE_INVALID / GROUP_SCOPE_INVALID / SOURCE_VERSION_STALE / ANSWER_NOT_OPEN / RIGHTS_NOT_VALID / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## VIDEO-PAGE-CONTROLLED-PLAYBACK Controlled Teaching Video Playback and Alternatives

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | VIDEO-OBJ-ASSET | CURRENT_CONTEXT / PRIMARY_TASK / SOURCE_AND_GATE_STATUS / NEXT_ACTION | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION / PROCESSING / BLOCKED / RECALLED / LOW_BANDWIDTH |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-ID | Teaching Video Asset ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-STUDENT-REF | Video Service Student | ID | 否 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-REQUEST-REF | Pinned Teaching Video Request | ID | 否 | OBJECT_REF: VIDEO-OBJ-REQUEST | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-REQUEST-VERSION | Pinned Teaching Video Request Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SCHOOL-REQUEST-REF | Pinned School-private Teaching Video Request | ID | 否 | OBJECT_REF: VIDEO-OBJ-SCHOOL-REQUEST | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SCHOOL-REQUEST-VERSION | Pinned School-private Teaching Video Request Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-REQUESTER-REF | Recorded Video Requester | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the accepted personal or school-private request requester |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-REQUESTER-KIND | Recorded Video Requester Kind | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-REQUESTER-KIND | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SERVICE-AUDIENCE | Recorded Video Service Audience | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-SERVICE-AUDIENCE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SERVICE-OBJECT-REFS | Recorded Video Service Object References | STRING_ARRAY | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-MANAGEMENT-SCOPE | Recorded Video Management Scope | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-MANAGEMENT-SCOPE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SOURCE-MATERIALS | Recorded Video Source Materials | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must preserve the accepted request's complete source material IDs, versions, permissions, and rights |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-ACCESS-SCOPE | Recorded Video Access Scope | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-ACCESS-SCOPE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-ACCESS-DOMAIN | Recorded Video Access Domain | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-ACCESS-DOMAIN | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-MANAGER-REF | Recorded Asset Manager | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must be the serviced student for STUDENT_PERSONAL or the school for SCHOOL_PRIVATE; AI can never be the manager |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-PROMOTION-POLICY | Knowledge-layer Promotion Policy | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must prohibit automatic school-knowledge or platform-public promotion and require fresh quality, privacy, and rights review before any sharing |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SCRIPT-REF | Generated Script Reference | FILE_REFERENCE | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-MEDIA-REF | Generated Video Media Reference | FILE_REFERENCE | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SUBTITLE-REF | Accessible Subtitle Reference | FILE_REFERENCE | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SUMMARY | Teaching Video Summary | TEXT | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-LOW-BANDWIDTH-ALTERNATIVE | Text Image or Low-bandwidth Alternative | JSON | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SCRIPT-GATE | Script Gate | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RENDER-GATE | Rendered Media Gate | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SAFETY-GATE | Safety Gate | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-PRIVACY-GATE | Privacy Gate | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RIGHTS-GATE | Source Rights Gate | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-PEDAGOGY-GATE | Teaching Correctness Gate | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-PLAYABILITY-GATE | Playability Gate | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-DOWNLOAD-POLICY | Controlled Playback Download Policy | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-DOWNLOAD-POLICY | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-EXTERNAL-RECORDING-BOUNDARY | External Recording Capability Boundary | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-EXTERNAL-RECORDING-BOUNDARY | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-DELIVERY-STATUS | Teaching Video Delivery Status | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-DELIVERY-STATUS | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-NOTIFIED-AT | Student Delivery Notification Time | DATETIME | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RECALL-REASON | Video Recall Reason | TEXT | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RECALL-IMPACT-REF | Pinned Video Recall Impact Snapshot | ID | 否 | OBJECT_REF: VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RECALL-IMPACT-VERSION | Pinned Video Recall Impact Snapshot Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RECALL-TRIGGER-KIND | Applied Video Recall Trigger Kind | STRING | 否 | OPTION_SET: OPT-P2-VIDEO-RECALL-TRIGGER | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RECALL-SOURCE-EVENT-ID | Applied Recall Source Event ID | STRING | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RECALL-SOURCE-EVENT-VERSION | Applied Recall Source Event Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-ASSET | VIDEO-ASSET-F-VERSION | Teaching Video Asset Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VIDEO-ACT-VIEW-CONTROLLED | View a Reauthorized Controlled-playback Teaching Video | READ | VIDEO-ASSET-F-STUDENT-REF<br>VIDEO-ASSET-F-ACCESS-DOMAIN | VIDEO-ASSET-F-STUDENT-REF<br>VIDEO-ASSET-F-MEDIA-REF<br>VIDEO-ASSET-F-SUBTITLE-REF<br>VIDEO-ASSET-F-SUMMARY<br>VIDEO-ASSET-F-LOW-BANDWIDTH-ALTERNATIVE<br>VIDEO-ASSET-F-DOWNLOAD-POLICY<br>VIDEO-ASSET-F-EXTERNAL-RECORDING-BOUNDARY<br>VIDEO-ASSET-F-DELIVERY-STATUS<br>VIDEO-ASSET-F-ACCESS-DOMAIN<br>VIDEO-ASSET-F-VERSION | UNCHANGED | ROLE-STUDENT | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / SOURCE_VERSION_STALE / AUTHORIZATION_STALE / ANSWER_NOT_OPEN / RIGHTS_NOT_VALID / VIDEO_RECALLED |
| VIDEO-ACT-VIEW-SCHOOL-PRIVATE | View a Reauthorized School-private Class or Group Teaching Video | READ | VIDEO-ASSET-F-SERVICE-OBJECT-REFS<br>VIDEO-ASSET-F-ACCESS-DOMAIN | VIDEO-ASSET-F-SERVICE-OBJECT-REFS<br>VIDEO-ASSET-F-MEDIA-REF<br>VIDEO-ASSET-F-SUBTITLE-REF<br>VIDEO-ASSET-F-SUMMARY<br>VIDEO-ASSET-F-LOW-BANDWIDTH-ALTERNATIVE<br>VIDEO-ASSET-F-DOWNLOAD-POLICY<br>VIDEO-ASSET-F-EXTERNAL-RECORDING-BOUNDARY<br>VIDEO-ASSET-F-DELIVERY-STATUS<br>VIDEO-ASSET-F-ACCESS-DOMAIN<br>VIDEO-ASSET-F-VERSION | UNCHANGED | ROLE-STUDENT / DUTY-SUBJECT-TEACHER | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / OUTSIDE_SERVICE_SCOPE / SOURCE_VERSION_STALE / AUTHORIZATION_STALE / ANSWER_NOT_OPEN / RIGHTS_NOT_VALID / VIDEO_RECALLED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## VIDEO-PAGE-POST-VIDEO-VERIFICATION Post-video New-context Verification and Learning Fact

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | VIDEO-OBJ-VERIFICATION / VIDEO-OBJ-LEARNING-FACT | CURRENT_CONTEXT / PRIMARY_TASK / SOURCE_AND_GATE_STATUS / NEXT_ACTION | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION / PROCESSING / BLOCKED / RECALLED / LOW_BANDWIDTH |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-ID | Post-video Verification ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-STUDENT-REF | Verifying Student | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-ASSET-REF | Pinned Delivered Teaching Video Asset | ID | 是 | OBJECT_REF: VIDEO-OBJ-ASSET | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-ASSET-VERSION | Pinned Delivered Teaching Video Asset Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-TARGET-REF | Single Verification Ability Target | ID | 是 | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-TARGET-SOURCE-VERSION | Pinned Verification Target Source Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-TARGET-KIND | Verification Target Kind | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-TARGET-KIND | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-STRATEGY | Verification Strategy | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-STRATEGY | IMMUTABLE | AUTHORIZED_SCOPE | Feynman is on-demand only for concept, causal, logic, or method targets; character, word, fixed-collocation, and mechanical-fluency targets use retrieval practice or spaced review |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-MODALITY | Verification Modality | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-MODALITY | IMMUTABLE | AUTHORIZED_SCOPE | voice is optional and text, mathematical handwriting, structured Q&A, and variant practice remain equivalent alternatives |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-ABILITY-NODE-REFS | Verification Ability Node References | STRING_ARRAY | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must contain exactly one ability-node reference for every verification session |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-NEW-CONTEXT-DIGEST | New-context Verification Digest | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must differ materially from the teaching example and cannot reproduce an answer, solution, or rubric before the student's first expression |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-FIRST-PROMPT-POLICY | First-expression Prompt Policy | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-FIRST-PROMPT-POLICY | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-MAX-SPECIFIC-GAPS-PER-TURN | Maximum Specific Gaps Per Follow-up | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must equal one; each follow-up may pursue only one concrete gap |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-EXCLUDED-NONKNOWLEDGE-SIGNALS | Signals Excluded from Knowledge-gap Inference | STRING_ARRAY | 是 | OPTION_SET: OPT-P2-VIDEO-NONKNOWLEDGE-SIGNAL | IMMUTABLE | AUTHORIZED_SCOPE | must include accent, fluency, and speech-recognition error and none may directly create a knowledge gap |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-FIRST-EXPRESSION | Student First Independent Expression | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-SPECIFIC-GAP | One Specific Follow-up Gap | JSON | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must contain at most one concrete knowledge gap supported by learning content, never accent, fluency, or recognition error alone |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-UNKNOWN-DECLARATION | Student Unknown Declaration | BOOLEAN | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-RETEACHING-REF | Returned Gap Teaching Reference | ID | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-RETRY-REQUEST | Student Different-context Retry Request | BOOLEAN | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must be an explicit student request after targeted reteaching |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-DIFFERENT-CONTEXT-DIGEST | Different-context Retry Digest | STRING | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must differ from both the teaching example and the first verification context |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-DIFFERENT-CONTEXT-EXPRESSION | Student Different-context Expression | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-RESULT | Verification Result without Mastery Claim | STRING | 否 | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-RESULT | SYSTEM_MANAGED | AUTHORIZED_SCOPE | records only the result in this new context and cannot assert durable mastery from video viewing |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-EVIDENCE | Verifiable Post-video Evidence | JSON | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must cite the student's new-context response and exclude viewing duration, completion, accent, fluency, and recognition errors as mastery evidence |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-STATUS | Post-video Verification Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-VERSION | Post-video Verification Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-ID | Post-video Learning Fact ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-STUDENT-REF | Learning Fact Student | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-ASSET-REF | Pinned Teaching Video Asset | ID | 是 | OBJECT_REF: VIDEO-OBJ-ASSET | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-ASSET-VERSION | Pinned Teaching Video Asset Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-VERIFICATION-REF | Pinned Post-video Verification | ID | 是 | OBJECT_REF: VIDEO-OBJ-VERIFICATION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-VERIFICATION-VERSION | Pinned Post-video Verification Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-TARGET-REF | Learning Fact Ability Target | ID | 是 | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-TARGET-SOURCE-VERSION | Learning Fact Target Source Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-NEW-CONTEXT-DIGEST | Learning Fact New-context Digest | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-STRATEGY | Learning Fact Verification Strategy | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-STRATEGY | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-MODALITY | Learning Fact Verification Modality | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-MODALITY | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-RESULT | Learning Fact Verification Result | STRING | 是 | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-EVIDENCE | Learning Fact Evidence | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must bind video, new-context verification, student response, result, and excluded nonknowledge signals; viewing alone is never sufficient |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-RECORDED-AT | Learning Fact Recorded Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-STATUS | Post-video Learning Fact Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-VERSION | Post-video Learning Fact Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VIDEO-ACT-START-NEW-CONTEXT-VERIFICATION | Start One-node Post-video New-context Verification | CREATE | VIDEO-VERIFY-F-STUDENT-REF<br>VIDEO-VERIFY-F-ASSET-REF<br>VIDEO-VERIFY-F-TARGET-REF<br>VIDEO-VERIFY-F-TARGET-KIND<br>VIDEO-VERIFY-F-STRATEGY<br>VIDEO-VERIFY-F-MODALITY<br>VIDEO-VERIFY-F-ABILITY-NODE-REFS | VIDEO-VERIFY-F-ID<br>VIDEO-VERIFY-F-ASSET-VERSION<br>VIDEO-VERIFY-F-TARGET-SOURCE-VERSION<br>VIDEO-VERIFY-F-NEW-CONTEXT-DIGEST<br>VIDEO-VERIFY-F-FIRST-PROMPT-POLICY<br>VIDEO-VERIFY-F-MAX-SPECIFIC-GAPS-PER-TURN<br>VIDEO-VERIFY-F-EXCLUDED-NONKNOWLEDGE-SIGNALS<br>VIDEO-VERIFY-F-STATUS<br>VIDEO-VERIFY-F-VERSION | CREATE | ROLE-STUDENT | AI | LOW / REQUIRED | PERMISSION_DENIED / VIDEO_NOT_DELIVERED / VIDEO_RECALLED / TARGET_SCOPE_INVALID / STRATEGY_NOT_APPLICABLE / MULTIPLE_ABILITY_NODES / SOURCE_VERSION_STALE / VERSION_CONFLICT |
| VIDEO-ACT-SUBMIT-FIRST-INDEPENDENT-EXPRESSION | Submit the First Independent Verification Expression | UPDATE | VIDEO-VERIFY-F-FIRST-EXPRESSION | VIDEO-VERIFY-F-FIRST-EXPRESSION<br>VIDEO-VERIFY-F-STATUS<br>VIDEO-VERIFY-F-VERSION | AWAITING_FIRST_EXPRESSION → FIRST_EXPRESSION_RECORDED | ROLE-STUDENT | AI | LOW / REQUIRED | PERMISSION_DENIED / ANSWER_HINT_ALREADY_SHOWN / EMPTY_EXPRESSION / VERSION_CONFLICT |
| VIDEO-ACT-RETURN-UNKNOWN-TO-TEACHING | Return an Unknown Response to Gap Teaching | UPDATE | VIDEO-VERIFY-F-UNKNOWN-DECLARATION | VIDEO-VERIFY-F-UNKNOWN-DECLARATION<br>VIDEO-VERIFY-F-RETEACHING-REF<br>VIDEO-VERIFY-F-STATUS<br>VIDEO-VERIFY-F-VERSION | AWAITING_FIRST_EXPRESSION / FIRST_EXPRESSION_RECORDED → RETURN_TO_TEACHING | ROLE-STUDENT | AI | LOW / REQUIRED | PERMISSION_DENIED / UNKNOWN_DECLARATION_REQUIRED / VERSION_CONFLICT |
| VIDEO-ACT-RETRY-DIFFERENT-CONTEXT | Retry Verification in a Materially Different Context | UPDATE | VIDEO-VERIFY-F-RETRY-REQUEST | VIDEO-VERIFY-F-RETRY-REQUEST<br>VIDEO-VERIFY-F-DIFFERENT-CONTEXT-DIGEST<br>VIDEO-VERIFY-F-STATUS<br>VIDEO-VERIFY-F-VERSION | RETURN_TO_TEACHING → AWAITING_DIFFERENT_CONTEXT_EXPRESSION | ROLE-STUDENT | AI | LOW / REQUIRED | PERMISSION_DENIED / RETEACHING_REQUIRED / CONTEXT_NOT_DIFFERENT / VERSION_CONFLICT |
| VIDEO-ACT-SUBMIT-DIFFERENT-CONTEXT-EXPRESSION | Submit the Different-context Verification Expression | UPDATE | VIDEO-VERIFY-F-DIFFERENT-CONTEXT-EXPRESSION | VIDEO-VERIFY-F-DIFFERENT-CONTEXT-EXPRESSION<br>VIDEO-VERIFY-F-STATUS<br>VIDEO-VERIFY-F-VERSION | AWAITING_DIFFERENT_CONTEXT_EXPRESSION → DIFFERENT_CONTEXT_EXPRESSION_RECORDED | ROLE-STUDENT | AI | LOW / REQUIRED | PERMISSION_DENIED / ANSWER_HINT_ALREADY_SHOWN / EMPTY_EXPRESSION / VERSION_CONFLICT |
| VIDEO-ACT-VIEW-POST-VIDEO-LEARNING-FACT | View a Scoped Post-video Learning Fact | READ | VIDEO-FACT-F-STUDENT-REF | VIDEO-FACT-F-ID<br>VIDEO-FACT-F-STUDENT-REF<br>VIDEO-FACT-F-ASSET-REF<br>VIDEO-FACT-F-ASSET-VERSION<br>VIDEO-FACT-F-VERIFICATION-REF<br>VIDEO-FACT-F-VERIFICATION-VERSION<br>VIDEO-FACT-F-TARGET-REF<br>VIDEO-FACT-F-TARGET-SOURCE-VERSION<br>VIDEO-FACT-F-NEW-CONTEXT-DIGEST<br>VIDEO-FACT-F-STRATEGY<br>VIDEO-FACT-F-MODALITY<br>VIDEO-FACT-F-RESULT<br>VIDEO-FACT-F-EVIDENCE<br>VIDEO-FACT-F-RECORDED-AT<br>VIDEO-FACT-F-STATUS<br>VIDEO-FACT-F-VERSION | UNCHANGED | ROLE-STUDENT / DUTY-SUBJECT-TEACHER / DUTY-HOMEROOM | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / SOURCE_VERSION_STALE |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
