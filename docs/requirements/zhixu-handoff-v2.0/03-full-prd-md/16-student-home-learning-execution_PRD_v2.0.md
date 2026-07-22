# APP-001 Student Home and Source-pinned Task Execution PRD v2.0

| 属性 | 值 |
| --- | --- |
| 阶段 | 1 |
| 交付状态 | BUILD_READY |
| 优先级 | P0 |
| 目标 | Separate school-required, student-pending, system-processing, and personal-optional work without becoming a second source-of-truth owner |
| 基线决策 | `BASE-003`、`BASE-008`、`BASE-010` |
| NFR | `NFR-005`、`NFR-008` |
| 进入条件 | an authorized first-stage activity or student-owned source fact can be resolved |
| 退出条件 | the student sees four separate home compartments and system processing delay never changes source-owned completion |
| 依赖模块 | — |

## 1. 范围与事实边界

- 本模块权威拥有 2 个对象、6 个动作。
- 模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。
- 页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。
- AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。

## 2. 权威对象与字段合同

### APP-OBJ-TODO Student Todo Link and Local Execution State

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 教师写入策略 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STUDENT_LOCAL_TASK_EXECUTION | SCHOOL | SYSTEM | ROLE-STUDENT | DUTY-SUBJECT-TEACHER | ROLE-STUDENT | LIFE-003 | S3 | STUDENT_TIMED_RELEASE | — | READY |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| APP-TODO-F-ID | Student Todo Aggregation ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-TODO-F-STUDENT-REF | Todo Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_REF | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-TODO-F-SOURCE-ASSIGNMENT-REF | Source Assignment Reference | ID | required when the todo links to homework；状态=READY；动作=APP-ACT-CREATE-HOMEWORK-TODO | OBJECT_REF: HW-OBJ-ASSIGNMENT | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-TODO-F-SOURCE-ASSIGNMENT-VERSION | Source Assignment Version | INTEGER | required when the todo links to homework；状态=READY；动作=APP-ACT-CREATE-HOMEWORK-TODO | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-TODO-F-TASK-DEEP-LINK | Task Deep Link | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-TODO-F-LOCAL-PROGRESS | Student Local Progress | JSON | required when the student records local todo execution state；状态=READY；动作=APP-ACT-UPDATE-LOCAL-PROGRESS | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-TODO-F-COMPLETION-EVIDENCE | Student Completion Evidence | JSON | required when the student records local todo execution state；状态=READY；动作=APP-ACT-UPDATE-LOCAL-PROGRESS | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-TODO-F-DIFFICULTY-FEEDBACK | Student Difficulty Feedback | TEXT | required when the student records local todo execution state；状态=READY；动作=APP-ACT-UPDATE-LOCAL-PROGRESS | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-TODO-F-STUDENT-VISIBLE-AT | Todo Student Visible At | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-TODO-F-AGGREGATION-VERSION | Todo Aggregation Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### APP-OBJ-STUDENT-HOME Four-compartment Student Home Projection

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 教师写入策略 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STUDENT_HOME_PROJECTION | SCHOOL | SYSTEM | ROLE-STUDENT | SYSTEM | ROLE-STUDENT | LIFE-003 | S3 | AUTHORIZED | — | READY |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| APP-HOME-F-ID | Student Home Projection ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-HOME-F-STUDENT-REF | Home Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-HOME-F-SCHOOL-REQUIRED-REFS | School-required Activity References | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-HOME-F-STUDENT-PENDING-REFS | Student-pending Action References | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-HOME-F-SYSTEM-PROCESSING-REFS | System-processing References | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-HOME-F-PERSONAL-OPTIONAL-REFS | Personal Optional Learning References | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| APP-HOME-F-COMPLETION-FACT-REFS | Source-owned Completion Fact References | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | — | completion is read from source facts and never derived from AI or media processing delay | retain accepted values with source and version metadata |
| APP-HOME-F-AGGREGATION-VERSION | Student Home Aggregation Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

## 3. 对象关系

| Relationship ID | 源对象 | 关系 | 目标对象 | 基数 | 所有权范围 | 源失效处理 |
| --- | --- | --- | --- | --- | --- | --- |

## 4. 可执行动作合同

| Action ID | 动作 | 目标对象 | 操作 | 授权边界 | 访问例外 | 输入 Field | 输出 Field | 状态效果 | ALLOW / DENY | 端 / 执行模式 | 风险 | 审计 | 幂等键 | 失败结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| APP-ACT-BUILD-STUDENT-HOME | Build Four-compartment Student Home Projection | APP-OBJ-STUDENT-HOME | CREATE | — | — |  | APP-HOME-F-ID<br>APP-HOME-F-STUDENT-REF<br>APP-HOME-F-SCHOOL-REQUIRED-REFS<br>APP-HOME-F-STUDENT-PENDING-REFS<br>APP-HOME-F-SYSTEM-PROCESSING-REFS<br>APP-HOME-F-PERSONAL-OPTIONAL-REFS<br>APP-HOME-F-COMPLETION-FACT-REFS<br>APP-HOME-F-AGGREGATION-VERSION | CREATE（成功状态由 APP-ACT-BUILD-STUDENT-HOME-SCN-SUCCESS 定义） | ALLOW:SYSTEM — the verified Flow materializes or refreshes only source-pinned todo links<br>DENY:CURRENT_ACTOR — a user cannot invoke internal todo aggregation directly | FLOW_INTERNAL | LOW | REQUIRED | APP-ACT-BUILD-STUDENT-HOME:school:object:source-version:request-id | PERMISSION_DENIED / SOURCE_VERSION_STALE / VERSION_CONFLICT |
| APP-ACT-CREATE-HOMEWORK-TODO | Create a Homework-pinned Student Todo Link | APP-OBJ-TODO | CREATE | — | — |  | APP-TODO-F-ID<br>APP-TODO-F-STUDENT-REF<br>APP-TODO-F-TASK-DEEP-LINK<br>APP-TODO-F-STUDENT-VISIBLE-AT<br>APP-TODO-F-AGGREGATION-VERSION<br>APP-TODO-F-SOURCE-ASSIGNMENT-REF<br>APP-TODO-F-SOURCE-ASSIGNMENT-VERSION | CREATE（成功状态由 APP-ACT-CREATE-HOMEWORK-TODO-SCN-SUCCESS 定义） | ALLOW:SYSTEM — the verified Flow materializes or refreshes only source-pinned todo links<br>DENY:CURRENT_ACTOR — a user cannot invoke internal todo aggregation directly | FLOW_INTERNAL | LOW | REQUIRED | APP-ACT-CREATE-HOMEWORK-TODO:school:object:source-version:request-id | PERMISSION_DENIED / TODO_NOT_ALLOWED_FOR_PURPOSE / SOURCE_VERSION_STALE / VERSION_CONFLICT |
| APP-ACT-REFRESH-TODOS | Refresh Student Todo Aggregation | APP-OBJ-TODO | UPDATE | — | — |  | APP-TODO-F-TASK-DEEP-LINK<br>APP-TODO-F-AGGREGATION-VERSION | READY → READY | ALLOW:SYSTEM — the verified Flow materializes or refreshes only source-pinned todo links<br>DENY:CURRENT_ACTOR — a user cannot invoke internal todo aggregation directly | FLOW_INTERNAL | HIGH | REQUIRED | APP-ACT-REFRESH-TODOS:school:object:source-version:request-id | PERMISSION_DENIED / SOURCE_VERSION_STALE / VERSION_CONFLICT / AUDIT_FAILED |
| APP-ACT-VIEW-TODOS | View My Student Todo Aggregation | APP-OBJ-TODO | READ | — | — | APP-TODO-F-STUDENT-REF | APP-TODO-F-STUDENT-REF<br>APP-TODO-F-TASK-DEEP-LINK<br>APP-TODO-F-LOCAL-PROGRESS<br>APP-TODO-F-COMPLETION-EVIDENCE<br>APP-TODO-F-DIFFICULTY-FEEDBACK<br>APP-TODO-F-STUDENT-VISIBLE-AT | UNCHANGED | ALLOW:ROLE-STUDENT — the student reads only the student's own released todo aggregation<br>DENY:ROLE-SCHOOL-ADMIN — school administration has no default access to student todo execution detail<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student todo execution detail | WEB / APP | READ | NOT_REQUIRED | — | PERMISSION_DENIED / NOT_FOUND / NOT_YET_VISIBLE |
| APP-ACT-VIEW-STUDENT-HOME | View My Four-compartment Student Home | APP-OBJ-STUDENT-HOME | READ | — | — | APP-HOME-F-STUDENT-REF | APP-HOME-F-STUDENT-REF<br>APP-HOME-F-SCHOOL-REQUIRED-REFS<br>APP-HOME-F-STUDENT-PENDING-REFS<br>APP-HOME-F-SYSTEM-PROCESSING-REFS<br>APP-HOME-F-PERSONAL-OPTIONAL-REFS<br>APP-HOME-F-COMPLETION-FACT-REFS<br>APP-HOME-F-AGGREGATION-VERSION | UNCHANGED | ALLOW:ROLE-STUDENT — the student reads only the student's own four-compartment home projection<br>DENY:ROLE-SCHOOL-ADMIN — school administration has no default access to student home detail<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student home detail | WEB / APP | READ | NOT_REQUIRED | — | PERMISSION_DENIED / NOT_FOUND |
| APP-ACT-UPDATE-LOCAL-PROGRESS | Update My Local Todo Progress and Evidence | APP-OBJ-TODO | UPDATE | — | — | APP-TODO-F-LOCAL-PROGRESS<br>APP-TODO-F-COMPLETION-EVIDENCE<br>APP-TODO-F-DIFFICULTY-FEEDBACK | APP-TODO-F-LOCAL-PROGRESS<br>APP-TODO-F-COMPLETION-EVIDENCE<br>APP-TODO-F-DIFFICULTY-FEEDBACK<br>APP-TODO-F-AGGREGATION-VERSION | READY → READY | ALLOW:ROLE-STUDENT — the student reads or updates only local progress, completion evidence, and difficulty feedback on the student's own todo<br>DENY:DUTY-SUBJECT-TEACHER — a teacher cannot submit or rewrite student-local execution state on the student's behalf<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student todo execution detail | WEB / APP | LOW | REQUIRED | APP-ACT-UPDATE-LOCAL-PROGRESS:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

## 6. 状态可达性

| Object ID | 状态 | 进入动作 | 离开动作 |
| --- | --- | --- | --- |
| APP-OBJ-TODO | READY | APP-ACT-CREATE-HOMEWORK-TODO<br>APP-ACT-REFRESH-TODOS<br>APP-ACT-UPDATE-LOCAL-PROGRESS | APP-ACT-REFRESH-TODOS<br>APP-ACT-UPDATE-LOCAL-PROGRESS |
| APP-OBJ-STUDENT-HOME | READY | APP-ACT-BUILD-STUDENT-HOME |  |

## 7. 参与数据流

| Flow ID | 数据流 | 阶段 | 参与模块 | 本模块动作 | 失败与补偿 |
| --- | --- | --- | --- | --- | --- |
| DF-004 | Assignment Validation and Publication | 1 | HW-001 / APP-001 | APP-ACT-CREATE-HOMEWORK-TODO | ASSIGNMENT_OBJECT_VERSION_WITH_NO_PARTIAL_ITEM_PUBLICATION；{"strategy":"REVALIDATE_STALE_ASSIGNMENT_THEN_RETRY","maxAttempts":3,"retryableFailureResults":["VERSION_CONFLICT","AUDIT_FAILED"]}；{"strategy":"KEEP_PRIOR_PUBLICATION_VERSION","description":"a failed immediate or scheduled publication leaves the prior published version active"}；{"strategy":"INVALIDATE_NEW_STUDENT_ASSIGNMENT_READS_ONLY","targets":["student assignment list","submission eligibility cache","assignment notification preview"]} |
| DF-015 | First-stage Student Home Projection | 1 | HW-001 / SUB-001 / APP-001 | APP-ACT-BUILD-STUDENT-HOME<br>APP-ACT-REFRESH-TODOS | STUDENT_HOME_PROJECTION_OBJECT；{"strategy":"REFRESH_AUTHORIZED_SOURCE_VERSIONS_THEN_RETRY_HOME_PROJECTION","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT"]}；{"strategy":"KEEP_PRIOR_HOME_PROJECTION_AND_SOURCE_COMPLETION","description":"projection failure preserves the prior home view and never changes source-owned completion or lateness"}；{"strategy":"INVALIDATE_HOME_PROJECTION_ONLY","targets":["student home projection cache"]} |
| DF-013 | Student Plan Execution to Report Snapshot and In-product Delivery | 3 | APP-001 / PLN-001 / RPT-001 / NOTI-001 | APP-ACT-VIEW-TODOS | REPORT_RUN_SNAPSHOT_DELIVERY_AND_NOTIFICATION_OBJECT；{"strategy":"RECHECK_PERMISSION_REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_OUTPUTS","maxAttempts":4,"retryableFailureResults":["SOURCE_VERSION_STALE","DELIVERY_FAILED","VERSION_CONFLICT"]}；{"strategy":"KEEP_SOURCE_EXECUTION_RUN_AND_SNAPSHOT_WHILE_RETRYING_DELIVERY_ONLY","description":"delivery or notification failure never rolls back student execution, plan, successful run, or immutable snapshot"}；{"strategy":"CREATE_A_NEW_RUN_FOR_NEW_SOURCE_VERSIONS","targets":["future report run","future report snapshot","in-product delivery retry"]} |
| DF-011 | Versioned Learning Facts to Cross-term Learning Path | 3 | PUB-001 / INS-001 / CORR-001 / APP-001 / GRD-001 / LPATH-001 |  | STUDENT_SOURCE_FACT_VERSION；{"strategy":"REFRESH_SELECTED_SOURCE_VERSION_AND_RETRY_FAILED_PATH_OBJECTS","maxAttempts":4,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT"]}；{"strategy":"KEEP_ACCEPTED_SOURCE_FACT_AND_RETRY_ONLY_FAILED_DERIVED_OBJECTS","description":"a learning-path failure never rewrites evidence and never removes an accepted timeline entry"}；{"strategy":"SUPERSEDE_OR_MARK_STALE_BY_SOURCE_VERSION","targets":["learning path interpretation version","authorized path read model"]} |

## 8. 页面任务合同

| Page ID | 页面 | 交付可用性 | 端 | 对象 | 字段 | 动作 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| APP-PAGE-STUDENT-HOME | Four-compartment Student Home | BUILD_READY | WEB / APP | APP-OBJ-STUDENT-HOME | APP-HOME-F-STUDENT-REF<br>APP-HOME-F-SCHOOL-REQUIRED-REFS<br>APP-HOME-F-STUDENT-PENDING-REFS<br>APP-HOME-F-SYSTEM-PROCESSING-REFS<br>APP-HOME-F-PERSONAL-OPTIONAL-REFS<br>APP-HOME-F-COMPLETION-FACT-REFS<br>APP-HOME-F-AGGREGATION-VERSION | APP-ACT-VIEW-STUDENT-HOME | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| APP-PAGE-TODOS | Student Todo Execution | BUILD_READY | WEB / APP | APP-OBJ-TODO | APP-TODO-F-STUDENT-REF<br>APP-TODO-F-TASK-DEEP-LINK<br>APP-TODO-F-LOCAL-PROGRESS<br>APP-TODO-F-COMPLETION-EVIDENCE<br>APP-TODO-F-DIFFICULTY-FEEDBACK<br>APP-TODO-F-STUDENT-VISIBLE-AT | APP-ACT-VIEW-TODOS<br>APP-ACT-UPDATE-LOCAL-PROGRESS | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |

## 9. 验收场景

| Scenario ID | 类型 | Action ID | Given | When | Expected Data | Expected State | Permission | 失败码 / 谓词 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| APP-ACT-BUILD-STUDENT-HOME-SCN-SUCCESS | SUCCESS | APP-ACT-BUILD-STUDENT-HOME | the actor meets the entry conditions for Build Four-compartment Student Home Projection | the actor requests Build Four-compartment Student Home Projection | separates school-required, student-pending, system-processing, and personal-optional references; AI or media delay never mutates completion | READY | ALLOW |  |
| APP-ACT-BUILD-STUDENT-HOME-SCN-PERMISSION_DENIED | FAILURE | APP-ACT-BUILD-STUDENT-HOME | PERMISSION_DENIED applies to Build Four-compartment Student Home Projection | the actor requests Build Four-compartment Student Home Projection | Build Four-compartment Student Home Projection returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| APP-ACT-BUILD-STUDENT-HOME-SCN-SOURCE_VERSION_STALE | FAILURE | APP-ACT-BUILD-STUDENT-HOME | SOURCE_VERSION_STALE applies to Build Four-compartment Student Home Projection | the actor requests Build Four-compartment Student Home Projection | Build Four-compartment Student Home Projection returns SOURCE_VERSION_STALE without hidden writes | UNCHANGED | DENY | SOURCE_VERSION_STALE |
| APP-ACT-BUILD-STUDENT-HOME-SCN-VERSION_CONFLICT | FAILURE | APP-ACT-BUILD-STUDENT-HOME | VERSION_CONFLICT applies to Build Four-compartment Student Home Projection | the actor requests Build Four-compartment Student Home Projection | Build Four-compartment Student Home Projection returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| APP-ACT-CREATE-HOMEWORK-TODO-SCN-SUCCESS | SUCCESS | APP-ACT-CREATE-HOMEWORK-TODO | the actor meets the entry conditions for Create a Homework-pinned Student Todo Link | the actor requests Create a Homework-pinned Student Todo Link | creates only a source-pinned submittable homework deep link; teaching presentations create no todo or completion evidence | READY | ALLOW |  |
| APP-ACT-CREATE-HOMEWORK-TODO-SCN-PERMISSION_DENIED | FAILURE | APP-ACT-CREATE-HOMEWORK-TODO | PERMISSION_DENIED applies to Create a Homework-pinned Student Todo Link | the actor requests Create a Homework-pinned Student Todo Link | Create a Homework-pinned Student Todo Link returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| APP-ACT-CREATE-HOMEWORK-TODO-SCN-TODO_NOT_ALLOWED_FOR_PURPOSE | FAILURE | APP-ACT-CREATE-HOMEWORK-TODO | TODO_NOT_ALLOWED_FOR_PURPOSE applies to Create a Homework-pinned Student Todo Link | the actor requests Create a Homework-pinned Student Todo Link | Create a Homework-pinned Student Todo Link returns TODO_NOT_ALLOWED_FOR_PURPOSE without hidden writes | UNCHANGED | DENY | TODO_NOT_ALLOWED_FOR_PURPOSE |
| APP-ACT-CREATE-HOMEWORK-TODO-SCN-SOURCE_VERSION_STALE | FAILURE | APP-ACT-CREATE-HOMEWORK-TODO | SOURCE_VERSION_STALE applies to Create a Homework-pinned Student Todo Link | the actor requests Create a Homework-pinned Student Todo Link | Create a Homework-pinned Student Todo Link returns SOURCE_VERSION_STALE without hidden writes | UNCHANGED | DENY | SOURCE_VERSION_STALE |
| APP-ACT-CREATE-HOMEWORK-TODO-SCN-VERSION_CONFLICT | FAILURE | APP-ACT-CREATE-HOMEWORK-TODO | VERSION_CONFLICT applies to Create a Homework-pinned Student Todo Link | the actor requests Create a Homework-pinned Student Todo Link | Create a Homework-pinned Student Todo Link returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| APP-ACT-REFRESH-TODOS-SCN-SUCCESS | SUCCESS | APP-ACT-REFRESH-TODOS | the actor meets the entry conditions for Refresh Student Todo Aggregation | the actor requests Refresh Student Todo Aggregation | Refresh Student Todo Aggregation returns the accepted versioned result | READY | ALLOW |  |
| APP-ACT-REFRESH-TODOS-SCN-PERMISSION_DENIED | FAILURE | APP-ACT-REFRESH-TODOS | PERMISSION_DENIED applies to Refresh Student Todo Aggregation | the actor requests Refresh Student Todo Aggregation | Refresh Student Todo Aggregation returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| APP-ACT-REFRESH-TODOS-SCN-SOURCE_VERSION_STALE | FAILURE | APP-ACT-REFRESH-TODOS | SOURCE_VERSION_STALE applies to Refresh Student Todo Aggregation | the actor requests Refresh Student Todo Aggregation | Refresh Student Todo Aggregation returns SOURCE_VERSION_STALE without hidden writes | UNCHANGED | DENY | SOURCE_VERSION_STALE |
| APP-ACT-REFRESH-TODOS-SCN-VERSION_CONFLICT | FAILURE | APP-ACT-REFRESH-TODOS | VERSION_CONFLICT applies to Refresh Student Todo Aggregation | the actor requests Refresh Student Todo Aggregation | Refresh Student Todo Aggregation returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| APP-ACT-REFRESH-TODOS-SCN-AUDIT_FAILED | FAILURE | APP-ACT-REFRESH-TODOS | AUDIT_FAILED applies to Refresh Student Todo Aggregation | the actor requests Refresh Student Todo Aggregation | Refresh Student Todo Aggregation returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| APP-ACT-VIEW-TODOS-SCN-SUCCESS | SUCCESS | APP-ACT-VIEW-TODOS | the actor meets the entry conditions for View My Student Todo Aggregation | the actor requests View My Student Todo Aggregation | View My Student Todo Aggregation returns the accepted versioned result | UNCHANGED | ALLOW |  |
| APP-ACT-VIEW-TODOS-SCN-PERMISSION_DENIED | FAILURE | APP-ACT-VIEW-TODOS | PERMISSION_DENIED applies to View My Student Todo Aggregation | the actor requests View My Student Todo Aggregation | View My Student Todo Aggregation returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| APP-ACT-VIEW-TODOS-SCN-NOT_FOUND | FAILURE | APP-ACT-VIEW-TODOS | NOT_FOUND applies to View My Student Todo Aggregation | the actor requests View My Student Todo Aggregation | View My Student Todo Aggregation returns NOT_FOUND without hidden writes | UNCHANGED | DENY | NOT_FOUND |
| APP-ACT-VIEW-TODOS-SCN-NOT_YET_VISIBLE | FAILURE | APP-ACT-VIEW-TODOS | NOT_YET_VISIBLE applies to View My Student Todo Aggregation | the actor requests View My Student Todo Aggregation | View My Student Todo Aggregation returns NOT_YET_VISIBLE without hidden writes | UNCHANGED | DENY | NOT_YET_VISIBLE |
| APP-ACT-VIEW-STUDENT-HOME-SCN-SUCCESS | SUCCESS | APP-ACT-VIEW-STUDENT-HOME | the actor meets the entry conditions for View My Four-compartment Student Home | the actor requests View My Four-compartment Student Home | returns four separate compartments and preserves source-owned completion when processing is delayed | UNCHANGED | ALLOW |  |
| APP-ACT-VIEW-STUDENT-HOME-SCN-PERMISSION_DENIED | FAILURE | APP-ACT-VIEW-STUDENT-HOME | PERMISSION_DENIED applies to View My Four-compartment Student Home | the actor requests View My Four-compartment Student Home | View My Four-compartment Student Home returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| APP-ACT-VIEW-STUDENT-HOME-SCN-NOT_FOUND | FAILURE | APP-ACT-VIEW-STUDENT-HOME | NOT_FOUND applies to View My Four-compartment Student Home | the actor requests View My Four-compartment Student Home | View My Four-compartment Student Home returns NOT_FOUND without hidden writes | UNCHANGED | DENY | NOT_FOUND |
| APP-ACT-UPDATE-LOCAL-PROGRESS-SCN-SUCCESS | SUCCESS | APP-ACT-UPDATE-LOCAL-PROGRESS | the actor meets the entry conditions for Update My Local Todo Progress and Evidence | the actor requests Update My Local Todo Progress and Evidence | Update My Local Todo Progress and Evidence returns the accepted versioned result | READY | ALLOW |  |
| APP-ACT-UPDATE-LOCAL-PROGRESS-SCN-PERMISSION_DENIED | FAILURE | APP-ACT-UPDATE-LOCAL-PROGRESS | PERMISSION_DENIED applies to Update My Local Todo Progress and Evidence | the actor requests Update My Local Todo Progress and Evidence | Update My Local Todo Progress and Evidence returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| APP-ACT-UPDATE-LOCAL-PROGRESS-SCN-VALIDATION_FAILED | FAILURE | APP-ACT-UPDATE-LOCAL-PROGRESS | VALIDATION_FAILED applies to Update My Local Todo Progress and Evidence | the actor requests Update My Local Todo Progress and Evidence | Update My Local Todo Progress and Evidence returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| APP-ACT-UPDATE-LOCAL-PROGRESS-SCN-VERSION_CONFLICT | FAILURE | APP-ACT-UPDATE-LOCAL-PROGRESS | VERSION_CONFLICT applies to Update My Local Todo Progress and Evidence | the actor requests Update My Local Todo Progress and Evidence | Update My Local Todo Progress and Evidence returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |

## 10. AI 任务映射

| Task ID | 任务 | 类型 | 目标 Action | 受众 | 确认者 | 预览字段 | 失败行为 |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 11. 研发与测试就绪门禁

- 实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。
- 所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。
- 每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。
- 每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。
- Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。
