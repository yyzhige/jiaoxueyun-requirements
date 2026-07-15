# STU-001 Source-pinned Student Management Profile PRD v2.0

| 属性 | 值 |
| --- | --- |
| 阶段 | 1 |
| 优先级 | P0 |
| 目标 | Aggregate authorized profile view definitions and attention records without owning a second score, evidence, or plan fact |
| 基线决策 | `BASE-003`、`BASE-008`、`BASE-010` |
| NFR | `NFR-008` |
| 进入条件 | the authorized teacher scope resolves source result, evidence, plan, and todo versions |
| 退出条件 | the profile and attention records retain exact source lineage and read-only homeroom coordination |

## 1. 范围与事实边界

- 本模块权威拥有 2 个对象、5 个动作。
- 模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。
- 页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。
- AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。

## 2. 权威对象与字段合同

### STU-OBJ-PROFILE Student Profile Query Column and Saved View Definition

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STUDENT_MANAGEMENT_VIEW_DEFINITION | SCHOOL | SYSTEM | DUTY-SUBJECT-TEACHER | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LIFE-003 | S3 | AUTHORIZED | READY |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STU-PROFILE-F-ID | Student Management Profile View ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-STUDENT-REF | Managed Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-RESULT-DATA-ID | Source Result Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-RESULT-REF | Source Result Reference | ID | 是 | OBJECT_REF: PUB-OBJ-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-RESULT-VERSION | Source Result Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-EVIDENCE-DATA-ID | Source Evidence Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-EVIDENCE-REF | Source Evidence Reference | ID | 是 | OBJECT_REF: INS-OBJ-EVIDENCE | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-EVIDENCE-VERSION | Source Evidence Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-PLAN-DATA-ID | Source Plan Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-PLAN-REF | Source Plan Reference | ID | 是 | OBJECT_REF: PLN-OBJ-PLAN | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-PLAN-VERSION | Source Plan Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-QUERY-DEFINITION | Student Profile Query Definition | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-COLUMN-DEFINITION | Student Profile Column Definition | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-SAVED-VIEW-DEFINITION | Saved Student Profile View Definition | JSON | required when a teacher saves a custom profile view；状态=READY；动作=STU-ACT-SAVE-VIEW | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-PROFILE-F-PROFILE-VERSION | Student Profile View Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### STU-OBJ-ATTENTION Student Attention and Follow-up Record

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STUDENT_ATTENTION_COORDINATION | SCHOOL | DUTY-SUBJECT-TEACHER | DUTY-SUBJECT-TEACHER | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LIFE-003 | S3 | AUTHORIZED | OPEN |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STU-ATTENTION-F-ID | Student Attention Record ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-ATTENTION-F-PROFILE-REF | Student Profile View Reference | ID | 是 | OBJECT_REF: STU-OBJ-PROFILE | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-ATTENTION-F-PROFILE-VERSION | Student Profile View Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-ATTENTION-F-KIND | Student Attention Event Kind | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-ATTENTION-F-FOLLOW-UP-NOTE | Student Attention Follow-up Note | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| STU-ATTENTION-F-VERSION | Student Attention Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

## 3. 对象关系

| Relationship ID | 源对象 | 关系 | 目标对象 | 基数 | 所有权范围 | 源失效处理 |
| --- | --- | --- | --- | --- | --- | --- |
| STU-REL-ATTENTION-PROFILE | STU-OBJ-ATTENTION | REFERENCES | STU-OBJ-PROFILE | MANY_TO_ONE | SAME_STUDENT | retain attention history and mark the source profile view version stale |

## 4. 可执行动作合同

| Action ID | 动作 | 目标对象 | 操作 | 输入 Field | 输出 Field | 状态效果 | ALLOW / DENY | 端 / 执行模式 | 风险 | 审计 | 幂等键 | 失败结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STU-ACT-BUILD-PROFILE | Build a Source-pinned Student Management Profile | STU-OBJ-PROFILE | CREATE |  | STU-PROFILE-F-ID<br>STU-PROFILE-F-STUDENT-REF<br>STU-PROFILE-F-RESULT-DATA-ID<br>STU-PROFILE-F-RESULT-REF<br>STU-PROFILE-F-RESULT-VERSION<br>STU-PROFILE-F-EVIDENCE-DATA-ID<br>STU-PROFILE-F-EVIDENCE-REF<br>STU-PROFILE-F-EVIDENCE-VERSION<br>STU-PROFILE-F-PLAN-DATA-ID<br>STU-PROFILE-F-PLAN-REF<br>STU-PROFILE-F-PLAN-VERSION<br>STU-PROFILE-F-QUERY-DEFINITION<br>STU-PROFILE-F-COLUMN-DEFINITION<br>STU-PROFILE-F-PROFILE-VERSION | CREATE（成功状态由 STU-ACT-BUILD-PROFILE-SCN-SUCCESS 定义） | ALLOW:SYSTEM — the verified aggregation Flow builds only source-pinned profile view definitions<br>DENY:CURRENT_ACTOR — a user cannot invoke internal student profile materialization directly | FLOW_INTERNAL | LOW | REQUIRED | STU-ACT-BUILD-PROFILE:school:object:source-version:request-id | PERMISSION_DENIED / SOURCE_VERSION_STALE / VERSION_CONFLICT |
| STU-ACT-OPEN-PROFILE | Open the Authorized Student Management Profile | STU-OBJ-PROFILE | READ | STU-PROFILE-F-ID | STU-PROFILE-F-ID<br>STU-PROFILE-F-STUDENT-REF<br>STU-PROFILE-F-RESULT-DATA-ID<br>STU-PROFILE-F-RESULT-REF<br>STU-PROFILE-F-RESULT-VERSION<br>STU-PROFILE-F-EVIDENCE-DATA-ID<br>STU-PROFILE-F-EVIDENCE-REF<br>STU-PROFILE-F-EVIDENCE-VERSION<br>STU-PROFILE-F-PLAN-DATA-ID<br>STU-PROFILE-F-PLAN-REF<br>STU-PROFILE-F-PLAN-VERSION<br>STU-PROFILE-F-QUERY-DEFINITION<br>STU-PROFILE-F-COLUMN-DEFINITION<br>STU-PROFILE-F-SAVED-VIEW-DEFINITION<br>STU-PROFILE-F-PROFILE-VERSION | UNCHANGED | ALLOW:DUTY-SUBJECT-TEACHER — the corresponding subject teacher reads only the assigned subject, class, and student scope<br>ALLOW:DUTY-HOMEROOM — the homeroom teacher reads the assigned class across subjects for read-only coordination<br>DENY:ROLE-SCHOOL-ADMIN — a school administrator has no default permission to read student learning detail<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default permission to read student learning detail | WEB / APP | READ | NOT_REQUIRED | — | PERMISSION_DENIED / NOT_FOUND |
| STU-ACT-SAVE-VIEW | Save a Student Profile View Definition | STU-OBJ-PROFILE | UPDATE | STU-PROFILE-F-SAVED-VIEW-DEFINITION | STU-PROFILE-F-SAVED-VIEW-DEFINITION<br>STU-PROFILE-F-PROFILE-VERSION | READY → READY | ALLOW:DUTY-SUBJECT-TEACHER — the corresponding subject teacher writes only inside the assigned subject, class, and student scope<br>DENY:DUTY-HOMEROOM — a homeroom teacher attempts to mutate another subject's score, evidence, plan, correction, or follow-up facts<br>DENY:ROLE-SCHOOL-ADMIN — a school administrator attempts to read or mutate student learning detail without a separately authorized case<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student learning detail | WEB / APP | LOW | REQUIRED | STU-ACT-SAVE-VIEW:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| STU-ACT-CREATE-ATTENTION | Create a Student Attention Record | STU-OBJ-ATTENTION | CREATE | STU-ATTENTION-F-PROFILE-REF<br>STU-ATTENTION-F-PROFILE-VERSION<br>STU-ATTENTION-F-KIND<br>STU-ATTENTION-F-FOLLOW-UP-NOTE | STU-ATTENTION-F-ID<br>STU-ATTENTION-F-VERSION | CREATE（成功状态由 STU-ACT-CREATE-ATTENTION-SCN-SUCCESS 定义） | ALLOW:DUTY-SUBJECT-TEACHER — the corresponding subject teacher writes only inside the assigned subject, class, and student scope<br>DENY:DUTY-HOMEROOM — a homeroom teacher attempts to mutate another subject's score, evidence, plan, correction, or follow-up facts<br>DENY:ROLE-SCHOOL-ADMIN — a school administrator attempts to read or mutate student learning detail without a separately authorized case<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student learning detail | WEB / APP | LOW | REQUIRED | STU-ACT-CREATE-ATTENTION:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| STU-ACT-VIEW-ATTENTION | View Student Attention Records | STU-OBJ-ATTENTION | READ | STU-ATTENTION-F-ID | STU-ATTENTION-F-ID<br>STU-ATTENTION-F-PROFILE-REF<br>STU-ATTENTION-F-PROFILE-VERSION<br>STU-ATTENTION-F-KIND<br>STU-ATTENTION-F-FOLLOW-UP-NOTE<br>STU-ATTENTION-F-VERSION | UNCHANGED | ALLOW:DUTY-SUBJECT-TEACHER — the corresponding subject teacher reads only the assigned subject, class, and student scope<br>ALLOW:DUTY-HOMEROOM — the homeroom teacher reads the assigned class across subjects for read-only coordination<br>DENY:ROLE-SCHOOL-ADMIN — a school administrator has no default permission to read student learning detail<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default permission to read student learning detail | WEB / APP | READ | NOT_REQUIRED | — | PERMISSION_DENIED / NOT_FOUND |

## 6. 状态可达性

| Object ID | 状态 | 进入动作 | 离开动作 |
| --- | --- | --- | --- |
| STU-OBJ-PROFILE | READY | STU-ACT-BUILD-PROFILE<br>STU-ACT-SAVE-VIEW | STU-ACT-SAVE-VIEW |
| STU-OBJ-ATTENTION | OPEN | STU-ACT-CREATE-ATTENTION |  |

## 7. 参与数据流

| Flow ID | 数据流 | 阶段 | 参与模块 | 本模块动作 | 失败与补偿 |
| --- | --- | --- | --- | --- | --- |
| DF-014 | Student Management Profile Aggregation | 1 | SCO-001 / INS-001 / PLN-001 / APP-001 / STU-001 | STU-ACT-BUILD-PROFILE | STUDENT_PROFILE_SOURCE_AND_PROJECTION_OBJECT；{"strategy":"REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_PROFILE_OBJECTS","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]}；{"strategy":"KEEP_PRIOR_PROFILE_AND_TODO_VIEW_VERSIONS","description":"a failed aggregation preserves the prior view definitions and retries only stale or failed student objects"}；{"strategy":"INVALIDATE_ONLY_STALE_PROFILE_AND_TODO_PROJECTIONS","targets":["gradebook view definition","student profile view definition","student todo aggregation"]} |

## 8. 页面任务合同

| Page ID | 页面 | 端 | 对象 | 字段 | 动作 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| STU-PAGE-PROFILE | Authorized Student Management Profile | WEB / APP | STU-OBJ-PROFILE | STU-PROFILE-F-ID<br>STU-PROFILE-F-STUDENT-REF<br>STU-PROFILE-F-RESULT-DATA-ID<br>STU-PROFILE-F-RESULT-REF<br>STU-PROFILE-F-RESULT-VERSION<br>STU-PROFILE-F-EVIDENCE-DATA-ID<br>STU-PROFILE-F-EVIDENCE-REF<br>STU-PROFILE-F-EVIDENCE-VERSION<br>STU-PROFILE-F-PLAN-DATA-ID<br>STU-PROFILE-F-PLAN-REF<br>STU-PROFILE-F-PLAN-VERSION<br>STU-PROFILE-F-QUERY-DEFINITION<br>STU-PROFILE-F-COLUMN-DEFINITION<br>STU-PROFILE-F-SAVED-VIEW-DEFINITION<br>STU-PROFILE-F-PROFILE-VERSION | STU-ACT-OPEN-PROFILE<br>STU-ACT-SAVE-VIEW | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| STU-PAGE-ATTENTION | Student Attention Follow-up Workspace | WEB / APP | STU-OBJ-ATTENTION | STU-ATTENTION-F-ID<br>STU-ATTENTION-F-PROFILE-REF<br>STU-ATTENTION-F-PROFILE-VERSION<br>STU-ATTENTION-F-KIND<br>STU-ATTENTION-F-FOLLOW-UP-NOTE<br>STU-ATTENTION-F-VERSION | STU-ACT-CREATE-ATTENTION<br>STU-ACT-VIEW-ATTENTION | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |

## 9. 验收场景

| Scenario ID | 类型 | Action ID | Given | When | Expected Data | Expected State | Permission | 失败码 / 谓词 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STU-ACT-BUILD-PROFILE-SCN-SUCCESS | SUCCESS | STU-ACT-BUILD-PROFILE | the actor meets the entry conditions for Build a Source-pinned Student Management Profile | the actor requests Build a Source-pinned Student Management Profile | builds only query, column, view, and pinned lineage definitions without copying source score, evidence, or plan content | READY | ALLOW |  |
| STU-ACT-BUILD-PROFILE-SCN-PERMISSION_DENIED | FAILURE | STU-ACT-BUILD-PROFILE | PERMISSION_DENIED applies to Build a Source-pinned Student Management Profile | the actor requests Build a Source-pinned Student Management Profile | Build a Source-pinned Student Management Profile returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| STU-ACT-BUILD-PROFILE-SCN-SOURCE_VERSION_STALE | FAILURE | STU-ACT-BUILD-PROFILE | SOURCE_VERSION_STALE applies to Build a Source-pinned Student Management Profile | the actor requests Build a Source-pinned Student Management Profile | Build a Source-pinned Student Management Profile returns SOURCE_VERSION_STALE without hidden writes | UNCHANGED | DENY | SOURCE_VERSION_STALE |
| STU-ACT-BUILD-PROFILE-SCN-VERSION_CONFLICT | FAILURE | STU-ACT-BUILD-PROFILE | VERSION_CONFLICT applies to Build a Source-pinned Student Management Profile | the actor requests Build a Source-pinned Student Management Profile | Build a Source-pinned Student Management Profile returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| STU-ACT-OPEN-PROFILE-SCN-SUCCESS | SUCCESS | STU-ACT-OPEN-PROFILE | the actor meets the entry conditions for Open the Authorized Student Management Profile | the actor requests Open the Authorized Student Management Profile | Open the Authorized Student Management Profile returns the accepted versioned result | UNCHANGED | ALLOW |  |
| STU-ACT-OPEN-PROFILE-SCN-PERMISSION_DENIED | FAILURE | STU-ACT-OPEN-PROFILE | PERMISSION_DENIED applies to Open the Authorized Student Management Profile | the actor requests Open the Authorized Student Management Profile | Open the Authorized Student Management Profile returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| STU-ACT-OPEN-PROFILE-SCN-NOT_FOUND | FAILURE | STU-ACT-OPEN-PROFILE | NOT_FOUND applies to Open the Authorized Student Management Profile | the actor requests Open the Authorized Student Management Profile | Open the Authorized Student Management Profile returns NOT_FOUND without hidden writes | UNCHANGED | DENY | NOT_FOUND |
| STU-ACT-SAVE-VIEW-SCN-SUCCESS | SUCCESS | STU-ACT-SAVE-VIEW | the actor meets the entry conditions for Save a Student Profile View Definition | the actor requests Save a Student Profile View Definition | Save a Student Profile View Definition returns the accepted versioned result | READY | ALLOW |  |
| STU-ACT-SAVE-VIEW-SCN-PERMISSION_DENIED | FAILURE | STU-ACT-SAVE-VIEW | PERMISSION_DENIED applies to Save a Student Profile View Definition | the actor requests Save a Student Profile View Definition | Save a Student Profile View Definition returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| STU-ACT-SAVE-VIEW-SCN-VALIDATION_FAILED | FAILURE | STU-ACT-SAVE-VIEW | VALIDATION_FAILED applies to Save a Student Profile View Definition | the actor requests Save a Student Profile View Definition | Save a Student Profile View Definition returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| STU-ACT-SAVE-VIEW-SCN-VERSION_CONFLICT | FAILURE | STU-ACT-SAVE-VIEW | VERSION_CONFLICT applies to Save a Student Profile View Definition | the actor requests Save a Student Profile View Definition | Save a Student Profile View Definition returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| STU-ACT-CREATE-ATTENTION-SCN-SUCCESS | SUCCESS | STU-ACT-CREATE-ATTENTION | the actor meets the entry conditions for Create a Student Attention Record | the actor requests Create a Student Attention Record | Create a Student Attention Record returns the accepted versioned result | OPEN | ALLOW |  |
| STU-ACT-CREATE-ATTENTION-SCN-PERMISSION_DENIED | FAILURE | STU-ACT-CREATE-ATTENTION | PERMISSION_DENIED applies to Create a Student Attention Record | the actor requests Create a Student Attention Record | Create a Student Attention Record returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| STU-ACT-CREATE-ATTENTION-SCN-VALIDATION_FAILED | FAILURE | STU-ACT-CREATE-ATTENTION | VALIDATION_FAILED applies to Create a Student Attention Record | the actor requests Create a Student Attention Record | Create a Student Attention Record returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| STU-ACT-CREATE-ATTENTION-SCN-VERSION_CONFLICT | FAILURE | STU-ACT-CREATE-ATTENTION | VERSION_CONFLICT applies to Create a Student Attention Record | the actor requests Create a Student Attention Record | Create a Student Attention Record returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| STU-ACT-VIEW-ATTENTION-SCN-SUCCESS | SUCCESS | STU-ACT-VIEW-ATTENTION | the actor meets the entry conditions for View Student Attention Records | the actor requests View Student Attention Records | View Student Attention Records returns the accepted versioned result | UNCHANGED | ALLOW |  |
| STU-ACT-VIEW-ATTENTION-SCN-PERMISSION_DENIED | FAILURE | STU-ACT-VIEW-ATTENTION | PERMISSION_DENIED applies to View Student Attention Records | the actor requests View Student Attention Records | View Student Attention Records returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| STU-ACT-VIEW-ATTENTION-SCN-NOT_FOUND | FAILURE | STU-ACT-VIEW-ATTENTION | NOT_FOUND applies to View Student Attention Records | the actor requests View Student Attention Records | View Student Attention Records returns NOT_FOUND without hidden writes | UNCHANGED | DENY | NOT_FOUND |

## 10. AI 任务映射

| Task ID | 任务 | 类型 | 目标 Action | 受众 | 确认者 | 预览字段 | 失败行为 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AI-TASK-AUTHORIZED-DATA-QUERY | Show the authorized learning profile for this student | QUERY | STU-ACT-OPEN-PROFILE | DUTY-SUBJECT-TEACHER / DUTY-HOMEROOM | {"mode":"NOT_REQUIRED"} | STU-PROFILE-F-ID<br>STU-PROFILE-F-PROFILE-VERSION | {"mode":"FAIL_CLOSED","preservesBusinessFacts":true,"manualFallback":"continue through the target module's manual Web or App path"} |

## 11. 研发与测试就绪门禁

- 实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。
- 所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。
- 每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。
- 每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。
- Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。
