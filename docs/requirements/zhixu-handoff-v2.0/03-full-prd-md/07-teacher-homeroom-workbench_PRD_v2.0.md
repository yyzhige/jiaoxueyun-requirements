# TEA-001 Teacher and homeroom workbench PRD v2.0

| 属性 | 值 |
| --- | --- |
| 阶段 | 1 |
| 优先级 | P0 |
| 目标 | Own teacher view definitions, preferences, and coordination items while referencing professional facts at source. |
| 基线决策 | `BASE-007`、`BASE-008`、`BASE-009` |
| NFR | `NFR-002`、`NFR-008` |
| 进入条件 | teacher duties and organization scope are effective；source modules expose authorized references without copying facts |
| 退出条件 | teacher work views retain source references only；homeroom coordination never writes another subject's professional facts |

## 1. 范围与事实边界

- 本模块权威拥有 3 个对象、10 个动作。
- 模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。
- 页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。
- AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。

## 2. 权威对象与字段合同

### TEA-OBJ-TODO-VIEW Teacher Todo View Definition

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURRENT_TEACHER_WORK_VIEW | SCHOOL | SYSTEM | SYSTEM | SYSTEM | SYSTEM | LIFE-001 | S2 | AUTHORIZED | ACTIVE / SUPERSEDED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-TODO-F-ID | Todo View Definition ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| TEA-TODO-F-TEACHER-ID | Teacher ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| TEA-TODO-F-SUBJECT-SCOPE | Subject Assignment Scope | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| TEA-TODO-F-SOURCE-REFS | External Todo Source References | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain source identifiers only and never copy professional facts |
| TEA-TODO-F-PROJECTION-SOURCE-REF | Todo Projection Source Reference | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| TEA-TODO-F-PROJECTION-SOURCE-VERSION | Todo Projection Source Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| TEA-TODO-F-FILTER | Todo View Filter | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### TEA-OBJ-COORDINATION Homeroom Coordination Item

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HOMEROOM_CLASS_COORDINATION | SCHOOL | CURRENT_ACTOR | DUTY-HOMEROOM | DUTY-HOMEROOM | ROLE-SCHOOL-ADMIN | LIFE-003 | S3 | AUTHORIZED | OPEN / IN_PROGRESS / CLOSED / CANCELLED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-COORD-F-ID | Coordination Item ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| TEA-COORD-F-CLASS-ID | Coordinated Class ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| TEA-COORD-F-SUBJECT-REFS | Referenced Subject Facts | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain references and never copy subject professional facts |
| TEA-COORD-F-TITLE | Coordination Title | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| TEA-COORD-F-NOTE | Coordination Note | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| TEA-COORD-F-STATUS | Coordination Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### TEA-OBJ-PREFERENCE Teacher Work Preference

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURRENT_TEACHER_PREFERENCE | SCHOOL | CURRENT_ACTOR | CURRENT_ACTOR | CURRENT_ACTOR | CURRENT_ACTOR | LIFE-001 | S2 | NO_DIRECT_READ | ACTIVE / SUPERSEDED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-PREF-F-ID | Work Preference ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| TEA-PREF-F-TEACHER-ID | Preference Teacher ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| TEA-PREF-F-DEFAULT-VIEW | Default Workspace View | STRING | 是 | OPTION_SET: OPT-ENUM-046 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| TEA-PREF-F-FILTERS | Saved Workspace Filters | JSON | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

## 3. 对象关系

| Relationship ID | 源对象 | 关系 | 目标对象 | 基数 | 所有权范围 | 源失效处理 |
| --- | --- | --- | --- | --- | --- | --- |
| TEA-REL-COORDINATION-VIEW | TEA-OBJ-COORDINATION | APPEARS_IN | TEA-OBJ-TODO-VIEW | MANY_TO_MANY | SAME_CONTEXT | refresh source references without copying or rewriting source facts |
| TEA-REL-PREFERENCE-VIEW | TEA-OBJ-PREFERENCE | CONFIGURES | TEA-OBJ-TODO-VIEW | MANY_TO_ONE | SAME_CONTEXT | fall back to the default view while preserving the preference version |

## 4. 可执行动作合同

| Action ID | 动作 | 目标对象 | 操作 | 访问例外 | 输入 Field | 输出 Field | 状态效果 | ALLOW / DENY | 端 / 执行模式 | 风险 | 审计 | 幂等键 | 失败结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-ACT-SYNC-TODO-VIEW | Sync a Versioned Teacher Todo Projection | TEA-OBJ-TODO-VIEW | CREATE | — | TEA-TODO-F-PROJECTION-SOURCE-REF<br>TEA-TODO-F-PROJECTION-SOURCE-VERSION<br>TEA-TODO-F-TEACHER-ID<br>TEA-TODO-F-SUBJECT-SCOPE<br>TEA-TODO-F-SOURCE-REFS<br>TEA-TODO-F-FILTER | TEA-TODO-F-ID<br>TEA-TODO-F-PROJECTION-SOURCE-REF<br>TEA-TODO-F-PROJECTION-SOURCE-VERSION<br>TEA-TODO-F-SOURCE-REFS | CREATE（成功状态由  定义） | ALLOW:SYSTEM — the system accepts only a registered versioned teacher-todo projection<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot synthesize teacher or student work-detail projections | SYSTEM_EVENT | HIGH | REQUIRED | TEA-ACT-SYNC-TODO-VIEW:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| TEA-ACT-QUERY-SUBJECT-TODOS | Query Assigned Subject Teacher Todos | TEA-OBJ-TODO-VIEW | READ | — | TEA-TODO-F-TEACHER-ID<br>TEA-TODO-F-SUBJECT-SCOPE<br>TEA-TODO-F-FILTER | TEA-TODO-F-SOURCE-REFS | UNCHANGED | ALLOW:DUTY-SUBJECT-TEACHER — subject teacher reads referenced tasks only in assigned subject and class scope<br>ALLOW:DUTY-SUBJECT-LEAD — subject lead reads referenced subject-wide queue facts without changing teacher-owned facts<br>DENY:ROLE-SCHOOL-ADMIN — school administration has no default access to teacher todo student-detail aggregates<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot read teacher or student work detail without school authorization | WEB / APP | READ | NOT_REQUIRED | — | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-QUERY-HOMEROOM-SUMMARY | Query Homeroom Whole-subject Summary | TEA-OBJ-COORDINATION | READ | — | TEA-COORD-F-CLASS-ID | TEA-COORD-F-SUBJECT-REFS | UNCHANGED | ALLOW:DUTY-HOMEROOM — homeroom duty may read all-subject references for the assigned class<br>DENY:ROLE-SCHOOL-ADMIN — school administration has no default access to homeroom student-detail aggregates<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail or all-subject class access | WEB / APP | READ | REQUIRED | — | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-CREATE-COORDINATION | Create a Homeroom Coordination Item | TEA-OBJ-COORDINATION | CREATE | — | TEA-COORD-F-CLASS-ID<br>TEA-COORD-F-SUBJECT-REFS<br>TEA-COORD-F-TITLE<br>TEA-COORD-F-NOTE | TEA-COORD-F-ID<br>TEA-COORD-F-STATUS | CREATE（成功状态由 TEA-ACT-CREATE-COORDINATION-SCN-SUCCESS 定义） | ALLOW:DUTY-HOMEROOM — homeroom duty may create coordination notes for the assigned class<br>DENY:DUTY-HOMEROOM — homeroom duty cannot write another subject's professional facts, scores, evidence, or plans | WEB / APP | LOW | REQUIRED | TEA-ACT-CREATE-COORDINATION:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-UPDATE-COORDINATION | Update a Homeroom Coordination Note | TEA-OBJ-COORDINATION | UPDATE | — | TEA-COORD-F-ID<br>TEA-COORD-F-TITLE<br>TEA-COORD-F-NOTE | TEA-COORD-F-STATUS | OPEN → IN_PROGRESS | ALLOW:DUTY-HOMEROOM — homeroom duty may update coordination-owned notes for the assigned class<br>DENY:DUTY-HOMEROOM — homeroom duty cannot write or overwrite other subject professional facts | WEB / APP | LOW | REQUIRED | TEA-ACT-UPDATE-COORDINATION:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-CLOSE-COORDINATION | Close a Resolved Homeroom Coordination Item | TEA-OBJ-COORDINATION | UPDATE | — | TEA-COORD-F-ID<br>TEA-COORD-F-NOTE | TEA-COORD-F-STATUS | IN_PROGRESS → CLOSED | ALLOW:DUTY-HOMEROOM — homeroom duty closes only coordination-owned items for the assigned class<br>DENY:DUTY-SUBJECT-TEACHER — subject teacher cannot close a homeroom coordination item but retains ownership of subject facts | WEB / APP | HIGH | REQUIRED | TEA-ACT-CLOSE-COORDINATION:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| TEA-ACT-CANCEL-COORDINATION | Cancel a Homeroom Coordination Item | TEA-OBJ-COORDINATION | UPDATE | — | TEA-COORD-F-ID<br>TEA-COORD-F-NOTE | TEA-COORD-F-STATUS | OPEN / IN_PROGRESS → CANCELLED | ALLOW:DUTY-HOMEROOM — homeroom duty cancels only coordination-owned items for the assigned class<br>DENY:DUTY-SUBJECT-TEACHER — subject teacher cannot cancel a homeroom coordination item | WEB / APP | HIGH | REQUIRED | TEA-ACT-CANCEL-COORDINATION:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| TEA-ACT-CREATE-PREFERENCE | Create Teacher Workspace Preference | TEA-OBJ-PREFERENCE | CREATE | — | TEA-PREF-F-DEFAULT-VIEW<br>TEA-PREF-F-FILTERS | TEA-PREF-F-ID<br>TEA-PREF-F-TEACHER-ID<br>TEA-PREF-F-DEFAULT-VIEW<br>TEA-PREF-F-FILTERS | CREATE（成功状态由 TEA-ACT-CREATE-PREFERENCE-SCN-SUCCESS 定义） | ALLOW:ROLE-TEACHER — teacher creates only the teacher's own workspace preference<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot create a teacher's personal work preference | WEB | LOW | REQUIRED | TEA-ACT-CREATE-PREFERENCE:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-UPDATE-PREFERENCE | Update Teacher Workspace Preference | TEA-OBJ-PREFERENCE | UPDATE | — | TEA-PREF-F-ID<br>TEA-PREF-F-DEFAULT-VIEW<br>TEA-PREF-F-FILTERS | TEA-PREF-F-DEFAULT-VIEW<br>TEA-PREF-F-FILTERS | ACTIVE → ACTIVE | ALLOW:ROLE-TEACHER — teacher updates only the teacher's own workspace preference<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot update a teacher's personal work preference | WEB | LOW | REQUIRED | TEA-ACT-UPDATE-PREFERENCE:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| TEA-ACT-SUPERSEDE-PREFERENCE | Supersede a Teacher Workspace Preference | TEA-OBJ-PREFERENCE | UPDATE | — | TEA-PREF-F-ID | TEA-PREF-F-DEFAULT-VIEW<br>TEA-PREF-F-FILTERS | ACTIVE → SUPERSEDED | ALLOW:ROLE-TEACHER — teacher supersedes only the teacher's own prior workspace preference<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot supersede a teacher's personal preference | WEB | LOW | REQUIRED | TEA-ACT-SUPERSEDE-PREFERENCE:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

## 6. 状态可达性

| Object ID | 状态 | 进入动作 | 离开动作 |
| --- | --- | --- | --- |
| TEA-OBJ-TODO-VIEW | ACTIVE | TEA-ACT-SYNC-TODO-VIEW |  |
| TEA-OBJ-TODO-VIEW | SUPERSEDED | TEA-ACT-SYNC-TODO-VIEW |  |
| TEA-OBJ-COORDINATION | OPEN | TEA-ACT-CREATE-COORDINATION | TEA-ACT-UPDATE-COORDINATION<br>TEA-ACT-CANCEL-COORDINATION |
| TEA-OBJ-COORDINATION | IN_PROGRESS | TEA-ACT-UPDATE-COORDINATION | TEA-ACT-CLOSE-COORDINATION<br>TEA-ACT-CANCEL-COORDINATION |
| TEA-OBJ-COORDINATION | CLOSED | TEA-ACT-CLOSE-COORDINATION |  |
| TEA-OBJ-COORDINATION | CANCELLED | TEA-ACT-CANCEL-COORDINATION |  |
| TEA-OBJ-PREFERENCE | ACTIVE | TEA-ACT-CREATE-PREFERENCE<br>TEA-ACT-UPDATE-PREFERENCE | TEA-ACT-UPDATE-PREFERENCE<br>TEA-ACT-SUPERSEDE-PREFERENCE |
| TEA-OBJ-PREFERENCE | SUPERSEDED | TEA-ACT-SUPERSEDE-PREFERENCE |  |

## 7. 参与数据流

| Flow ID | 数据流 | 阶段 | 参与模块 | 本模块动作 | 失败与补偿 |
| --- | --- | --- | --- | --- | --- |

## 8. 页面任务合同

| Page ID | 页面 | 端 | 对象 | 字段 | 动作 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-PAGE-TODAY | Teacher Today Workspace | WEB / APP | TEA-OBJ-TODO-VIEW<br>TEA-OBJ-PREFERENCE | TEA-TODO-F-SUBJECT-SCOPE<br>TEA-TODO-F-SOURCE-REFS<br>TEA-TODO-F-FILTER<br>TEA-PREF-F-DEFAULT-VIEW | TEA-ACT-QUERY-SUBJECT-TODOS | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| TEA-PAGE-QUEUE | Grading and Review Queue Summary | WEB / APP | TEA-OBJ-TODO-VIEW | TEA-TODO-F-SUBJECT-SCOPE<br>TEA-TODO-F-SOURCE-REFS<br>TEA-TODO-F-FILTER | TEA-ACT-QUERY-SUBJECT-TODOS | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| TEA-PAGE-HOMEROOM | Homeroom Whole-subject Overview | WEB / APP | TEA-OBJ-COORDINATION | TEA-COORD-F-CLASS-ID<br>TEA-COORD-F-SUBJECT-REFS<br>TEA-COORD-F-TITLE<br>TEA-COORD-F-NOTE<br>TEA-COORD-F-STATUS | TEA-ACT-QUERY-HOMEROOM-SUMMARY<br>TEA-ACT-CREATE-COORDINATION | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| TEA-PAGE-COORDINATION | Homeroom Coordination Detail | WEB / APP | TEA-OBJ-COORDINATION | TEA-COORD-F-SUBJECT-REFS<br>TEA-COORD-F-TITLE<br>TEA-COORD-F-NOTE<br>TEA-COORD-F-STATUS | TEA-ACT-UPDATE-COORDINATION<br>TEA-ACT-CLOSE-COORDINATION<br>TEA-ACT-CANCEL-COORDINATION | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| TEA-PAGE-PREFERENCE | Teacher Work Preference | WEB | TEA-OBJ-PREFERENCE | TEA-PREF-F-ID<br>TEA-PREF-F-DEFAULT-VIEW<br>TEA-PREF-F-FILTERS | TEA-ACT-CREATE-PREFERENCE<br>TEA-ACT-UPDATE-PREFERENCE<br>TEA-ACT-SUPERSEDE-PREFERENCE | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |

## 9. 验收场景

| Scenario ID | 类型 | Action ID | Given | When | Expected Data | Expected State | Permission | 失败码 / 谓词 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEA-ACT-SYNC-TODO-VIEW-SCN-SUCCESS-ACTIVE | SUCCESS | TEA-ACT-SYNC-TODO-VIEW | the actor meets the entry conditions for Sync a Versioned Teacher Todo Projection | the actor requests Sync a Versioned Teacher Todo Projection | Sync a Versioned Teacher Todo Projection returns the accepted task-specific result | ACTIVE | ALLOW |  |
| TEA-ACT-SYNC-TODO-VIEW-SCN-SUCCESS-SUPERSEDED | SUCCESS | TEA-ACT-SYNC-TODO-VIEW | the actor meets the entry conditions for Sync a Versioned Teacher Todo Projection | the actor requests Sync a Versioned Teacher Todo Projection | Sync a Versioned Teacher Todo Projection returns the accepted task-specific result | SUPERSEDED | ALLOW |  |
| TEA-ACT-SYNC-TODO-VIEW-SCN-PERMISSION_DENIED | FAILURE | TEA-ACT-SYNC-TODO-VIEW | PERMISSION_DENIED applies to Sync a Versioned Teacher Todo Projection | the actor requests Sync a Versioned Teacher Todo Projection | Sync a Versioned Teacher Todo Projection returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| TEA-ACT-SYNC-TODO-VIEW-SCN-VALIDATION_FAILED | FAILURE | TEA-ACT-SYNC-TODO-VIEW | VALIDATION_FAILED applies to Sync a Versioned Teacher Todo Projection | the actor requests Sync a Versioned Teacher Todo Projection | Sync a Versioned Teacher Todo Projection returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| TEA-ACT-SYNC-TODO-VIEW-SCN-VERSION_CONFLICT | FAILURE | TEA-ACT-SYNC-TODO-VIEW | VERSION_CONFLICT applies to Sync a Versioned Teacher Todo Projection | the actor requests Sync a Versioned Teacher Todo Projection | Sync a Versioned Teacher Todo Projection returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| TEA-ACT-SYNC-TODO-VIEW-SCN-AUDIT_FAILED | FAILURE | TEA-ACT-SYNC-TODO-VIEW | AUDIT_FAILED applies to Sync a Versioned Teacher Todo Projection | the actor requests Sync a Versioned Teacher Todo Projection | Sync a Versioned Teacher Todo Projection returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| TEA-ACT-QUERY-SUBJECT-TODOS-SCN-SUCCESS | SUCCESS | TEA-ACT-QUERY-SUBJECT-TODOS | the actor meets the entry conditions for Query Assigned Subject Teacher Todos | the actor requests Query Assigned Subject Teacher Todos | todo view returns references to source tasks and never copies score, evidence, or plan facts | UNCHANGED | ALLOW |  |
| TEA-ACT-QUERY-SUBJECT-TODOS-SCN-PERMISSION_DENIED | FAILURE | TEA-ACT-QUERY-SUBJECT-TODOS | PERMISSION_DENIED applies to Query Assigned Subject Teacher Todos | the actor requests Query Assigned Subject Teacher Todos | Query Assigned Subject Teacher Todos returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| TEA-ACT-QUERY-SUBJECT-TODOS-SCN-VALIDATION_FAILED | FAILURE | TEA-ACT-QUERY-SUBJECT-TODOS | VALIDATION_FAILED applies to Query Assigned Subject Teacher Todos | the actor requests Query Assigned Subject Teacher Todos | Query Assigned Subject Teacher Todos returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| TEA-ACT-QUERY-SUBJECT-TODOS-SCN-VERSION_CONFLICT | FAILURE | TEA-ACT-QUERY-SUBJECT-TODOS | VERSION_CONFLICT applies to Query Assigned Subject Teacher Todos | the actor requests Query Assigned Subject Teacher Todos | Query Assigned Subject Teacher Todos returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| TEA-ACT-QUERY-HOMEROOM-SUMMARY-SCN-SUCCESS | SUCCESS | TEA-ACT-QUERY-HOMEROOM-SUMMARY | the actor meets the entry conditions for Query Homeroom Whole-subject Summary | the actor requests Query Homeroom Whole-subject Summary | homeroom view resolves all-subject references without copying professional facts | UNCHANGED | ALLOW |  |
| TEA-ACT-QUERY-HOMEROOM-SUMMARY-SCN-PERMISSION_DENIED | FAILURE | TEA-ACT-QUERY-HOMEROOM-SUMMARY | PERMISSION_DENIED applies to Query Homeroom Whole-subject Summary | the actor requests Query Homeroom Whole-subject Summary | Query Homeroom Whole-subject Summary returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| TEA-ACT-QUERY-HOMEROOM-SUMMARY-SCN-VALIDATION_FAILED | FAILURE | TEA-ACT-QUERY-HOMEROOM-SUMMARY | VALIDATION_FAILED applies to Query Homeroom Whole-subject Summary | the actor requests Query Homeroom Whole-subject Summary | Query Homeroom Whole-subject Summary returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| TEA-ACT-QUERY-HOMEROOM-SUMMARY-SCN-VERSION_CONFLICT | FAILURE | TEA-ACT-QUERY-HOMEROOM-SUMMARY | VERSION_CONFLICT applies to Query Homeroom Whole-subject Summary | the actor requests Query Homeroom Whole-subject Summary | Query Homeroom Whole-subject Summary returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| TEA-ACT-CREATE-COORDINATION-SCN-SUCCESS | SUCCESS | TEA-ACT-CREATE-COORDINATION | the actor meets the entry conditions for Create a Homeroom Coordination Item | the actor requests Create a Homeroom Coordination Item | coordination item stores references and coordination notes only | OPEN | ALLOW |  |
| TEA-ACT-CREATE-COORDINATION-SCN-PERMISSION_DENIED | FAILURE | TEA-ACT-CREATE-COORDINATION | PERMISSION_DENIED applies to Create a Homeroom Coordination Item | the actor requests Create a Homeroom Coordination Item | Create a Homeroom Coordination Item returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| TEA-ACT-CREATE-COORDINATION-SCN-VALIDATION_FAILED | FAILURE | TEA-ACT-CREATE-COORDINATION | VALIDATION_FAILED applies to Create a Homeroom Coordination Item | the actor requests Create a Homeroom Coordination Item | Create a Homeroom Coordination Item returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| TEA-ACT-CREATE-COORDINATION-SCN-VERSION_CONFLICT | FAILURE | TEA-ACT-CREATE-COORDINATION | VERSION_CONFLICT applies to Create a Homeroom Coordination Item | the actor requests Create a Homeroom Coordination Item | Create a Homeroom Coordination Item returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| TEA-ACT-UPDATE-COORDINATION-SCN-SUCCESS | SUCCESS | TEA-ACT-UPDATE-COORDINATION | the actor meets the entry conditions for Update a Homeroom Coordination Note | the actor requests Update a Homeroom Coordination Note | Update a Homeroom Coordination Note returns the accepted task-specific result | IN_PROGRESS | ALLOW |  |
| TEA-ACT-UPDATE-COORDINATION-SCN-PERMISSION_DENIED | FAILURE | TEA-ACT-UPDATE-COORDINATION | PERMISSION_DENIED applies to Update a Homeroom Coordination Note | the actor requests Update a Homeroom Coordination Note | Update a Homeroom Coordination Note returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| TEA-ACT-UPDATE-COORDINATION-SCN-VALIDATION_FAILED | FAILURE | TEA-ACT-UPDATE-COORDINATION | VALIDATION_FAILED applies to Update a Homeroom Coordination Note | the actor requests Update a Homeroom Coordination Note | Update a Homeroom Coordination Note returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| TEA-ACT-UPDATE-COORDINATION-SCN-VERSION_CONFLICT | FAILURE | TEA-ACT-UPDATE-COORDINATION | VERSION_CONFLICT applies to Update a Homeroom Coordination Note | the actor requests Update a Homeroom Coordination Note | Update a Homeroom Coordination Note returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| TEA-ACT-CLOSE-COORDINATION-SCN-SUCCESS | SUCCESS | TEA-ACT-CLOSE-COORDINATION | the actor meets the entry conditions for Close a Resolved Homeroom Coordination Item | the actor requests Close a Resolved Homeroom Coordination Item | Close a Resolved Homeroom Coordination Item returns the accepted task-specific result | CLOSED | ALLOW |  |
| TEA-ACT-CLOSE-COORDINATION-SCN-PERMISSION_DENIED | FAILURE | TEA-ACT-CLOSE-COORDINATION | PERMISSION_DENIED applies to Close a Resolved Homeroom Coordination Item | the actor requests Close a Resolved Homeroom Coordination Item | Close a Resolved Homeroom Coordination Item returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| TEA-ACT-CLOSE-COORDINATION-SCN-VALIDATION_FAILED | FAILURE | TEA-ACT-CLOSE-COORDINATION | VALIDATION_FAILED applies to Close a Resolved Homeroom Coordination Item | the actor requests Close a Resolved Homeroom Coordination Item | Close a Resolved Homeroom Coordination Item returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| TEA-ACT-CLOSE-COORDINATION-SCN-VERSION_CONFLICT | FAILURE | TEA-ACT-CLOSE-COORDINATION | VERSION_CONFLICT applies to Close a Resolved Homeroom Coordination Item | the actor requests Close a Resolved Homeroom Coordination Item | Close a Resolved Homeroom Coordination Item returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| TEA-ACT-CLOSE-COORDINATION-SCN-AUDIT_FAILED | FAILURE | TEA-ACT-CLOSE-COORDINATION | AUDIT_FAILED applies to Close a Resolved Homeroom Coordination Item | the actor requests Close a Resolved Homeroom Coordination Item | Close a Resolved Homeroom Coordination Item returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| TEA-ACT-CANCEL-COORDINATION-SCN-SUCCESS | SUCCESS | TEA-ACT-CANCEL-COORDINATION | the actor meets the entry conditions for Cancel a Homeroom Coordination Item | the actor requests Cancel a Homeroom Coordination Item | Cancel a Homeroom Coordination Item returns the accepted task-specific result | CANCELLED | ALLOW |  |
| TEA-ACT-CANCEL-COORDINATION-SCN-PERMISSION_DENIED | FAILURE | TEA-ACT-CANCEL-COORDINATION | PERMISSION_DENIED applies to Cancel a Homeroom Coordination Item | the actor requests Cancel a Homeroom Coordination Item | Cancel a Homeroom Coordination Item returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| TEA-ACT-CANCEL-COORDINATION-SCN-VALIDATION_FAILED | FAILURE | TEA-ACT-CANCEL-COORDINATION | VALIDATION_FAILED applies to Cancel a Homeroom Coordination Item | the actor requests Cancel a Homeroom Coordination Item | Cancel a Homeroom Coordination Item returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| TEA-ACT-CANCEL-COORDINATION-SCN-VERSION_CONFLICT | FAILURE | TEA-ACT-CANCEL-COORDINATION | VERSION_CONFLICT applies to Cancel a Homeroom Coordination Item | the actor requests Cancel a Homeroom Coordination Item | Cancel a Homeroom Coordination Item returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| TEA-ACT-CANCEL-COORDINATION-SCN-AUDIT_FAILED | FAILURE | TEA-ACT-CANCEL-COORDINATION | AUDIT_FAILED applies to Cancel a Homeroom Coordination Item | the actor requests Cancel a Homeroom Coordination Item | Cancel a Homeroom Coordination Item returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| TEA-ACT-CREATE-PREFERENCE-SCN-SUCCESS | SUCCESS | TEA-ACT-CREATE-PREFERENCE | the actor meets the entry conditions for Create Teacher Workspace Preference | the actor requests Create Teacher Workspace Preference | Create Teacher Workspace Preference returns the accepted task-specific result | ACTIVE | ALLOW |  |
| TEA-ACT-CREATE-PREFERENCE-SCN-PERMISSION_DENIED | FAILURE | TEA-ACT-CREATE-PREFERENCE | PERMISSION_DENIED applies to Create Teacher Workspace Preference | the actor requests Create Teacher Workspace Preference | Create Teacher Workspace Preference returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| TEA-ACT-CREATE-PREFERENCE-SCN-VALIDATION_FAILED | FAILURE | TEA-ACT-CREATE-PREFERENCE | VALIDATION_FAILED applies to Create Teacher Workspace Preference | the actor requests Create Teacher Workspace Preference | Create Teacher Workspace Preference returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| TEA-ACT-CREATE-PREFERENCE-SCN-VERSION_CONFLICT | FAILURE | TEA-ACT-CREATE-PREFERENCE | VERSION_CONFLICT applies to Create Teacher Workspace Preference | the actor requests Create Teacher Workspace Preference | Create Teacher Workspace Preference returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| TEA-ACT-UPDATE-PREFERENCE-SCN-SUCCESS | SUCCESS | TEA-ACT-UPDATE-PREFERENCE | the actor meets the entry conditions for Update Teacher Workspace Preference | the actor requests Update Teacher Workspace Preference | Update Teacher Workspace Preference returns the accepted task-specific result | ACTIVE | ALLOW |  |
| TEA-ACT-UPDATE-PREFERENCE-SCN-PERMISSION_DENIED | FAILURE | TEA-ACT-UPDATE-PREFERENCE | PERMISSION_DENIED applies to Update Teacher Workspace Preference | the actor requests Update Teacher Workspace Preference | Update Teacher Workspace Preference returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| TEA-ACT-UPDATE-PREFERENCE-SCN-VALIDATION_FAILED | FAILURE | TEA-ACT-UPDATE-PREFERENCE | VALIDATION_FAILED applies to Update Teacher Workspace Preference | the actor requests Update Teacher Workspace Preference | Update Teacher Workspace Preference returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| TEA-ACT-UPDATE-PREFERENCE-SCN-VERSION_CONFLICT | FAILURE | TEA-ACT-UPDATE-PREFERENCE | VERSION_CONFLICT applies to Update Teacher Workspace Preference | the actor requests Update Teacher Workspace Preference | Update Teacher Workspace Preference returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| TEA-ACT-SUPERSEDE-PREFERENCE-SCN-SUCCESS | SUCCESS | TEA-ACT-SUPERSEDE-PREFERENCE | the actor meets the entry conditions for Supersede a Teacher Workspace Preference | the actor requests Supersede a Teacher Workspace Preference | Supersede a Teacher Workspace Preference returns the accepted task-specific result | SUPERSEDED | ALLOW |  |
| TEA-ACT-SUPERSEDE-PREFERENCE-SCN-PERMISSION_DENIED | FAILURE | TEA-ACT-SUPERSEDE-PREFERENCE | PERMISSION_DENIED applies to Supersede a Teacher Workspace Preference | the actor requests Supersede a Teacher Workspace Preference | Supersede a Teacher Workspace Preference returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| TEA-ACT-SUPERSEDE-PREFERENCE-SCN-VALIDATION_FAILED | FAILURE | TEA-ACT-SUPERSEDE-PREFERENCE | VALIDATION_FAILED applies to Supersede a Teacher Workspace Preference | the actor requests Supersede a Teacher Workspace Preference | Supersede a Teacher Workspace Preference returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| TEA-ACT-SUPERSEDE-PREFERENCE-SCN-VERSION_CONFLICT | FAILURE | TEA-ACT-SUPERSEDE-PREFERENCE | VERSION_CONFLICT applies to Supersede a Teacher Workspace Preference | the actor requests Supersede a Teacher Workspace Preference | Supersede a Teacher Workspace Preference returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |

## 10. AI 任务映射

| Task ID | 任务 | 类型 | 目标 Action | 受众 | 确认者 | 预览字段 | 失败行为 |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 11. 研发与测试就绪门禁

- 实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。
- 所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。
- 每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。
- 每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。
- Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。
