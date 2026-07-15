# SCO-001 Source-pinned Gradebook Views PRD v2.0

| 属性 | 值 |
| --- | --- |
| 阶段 | 1 |
| 优先级 | P0 |
| 目标 | Define authorized score views and follow-up records without owning a second official score, evidence, or plan fact |
| 基线决策 | `BASE-003`、`BASE-008`、`BASE-010` |
| NFR | `NFR-008` |
| 进入条件 | published result, evidence, and plan versions are available as independently owned sources |
| 退出条件 | every displayed value resolves through its source Data ID, object reference, and pinned version |

## 1. 范围与事实边界

- 本模块权威拥有 2 个对象、4 个动作。
- 模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。
- 页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。
- AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。

## 2. 权威对象与字段合同

### SCO-OBJ-VIEW Gradebook Query Column and Saved View Definition

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GRADEBOOK_VIEW_DEFINITION | SCHOOL | DUTY-SUBJECT-TEACHER | DUTY-SUBJECT-TEACHER | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LIFE-003 | S3 | AUTHORIZED | ACTIVE |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCO-VIEW-F-ID | Gradebook View ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-STUDENT-REF | Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-RESULT-DATA-ID | Source Result Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-RESULT-REF | Source Result Reference | ID | 是 | OBJECT_REF: PUB-OBJ-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-RESULT-VERSION | Source Result Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-EVIDENCE-DATA-ID | Source Evidence Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-EVIDENCE-REF | Source Evidence Reference | ID | 是 | OBJECT_REF: INS-OBJ-EVIDENCE | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-EVIDENCE-VERSION | Source Evidence Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-PLAN-DATA-ID | Source Plan Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-PLAN-REF | Source Plan Reference | ID | 是 | OBJECT_REF: PLN-OBJ-PLAN | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-PLAN-VERSION | Source Plan Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-QUERY-DEFINITION | Gradebook Query Definition | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-COLUMN-DEFINITION | Gradebook Column Definition | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-SAVED-VIEW-DEFINITION | Saved Gradebook View Definition | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-VIEW-F-VIEW-VERSION | Gradebook View Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### SCO-OBJ-FOLLOW-UP Gradebook Follow-up and Attention Record

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GRADEBOOK_COORDINATION | SCHOOL | DUTY-SUBJECT-TEACHER | DUTY-SUBJECT-TEACHER | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LIFE-003 | S3 | AUTHORIZED | OPEN |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCO-FOLLOW-UP-F-ID | Gradebook Follow-up ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-FOLLOW-UP-F-VIEW-REF | Gradebook View Reference | ID | 是 | OBJECT_REF: SCO-OBJ-VIEW | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-FOLLOW-UP-F-VIEW-VERSION | Gradebook View Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-FOLLOW-UP-F-ATTENTION-KIND | Attention Event Kind | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-FOLLOW-UP-F-NOTE | Follow-up Note | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| SCO-FOLLOW-UP-F-VERSION | Follow-up Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

## 3. 对象关系

| Relationship ID | 源对象 | 关系 | 目标对象 | 基数 | 所有权范围 | 源失效处理 |
| --- | --- | --- | --- | --- | --- | --- |
| SCO-REL-FOLLOW-UP-VIEW | SCO-OBJ-FOLLOW-UP | REFERENCES | SCO-OBJ-VIEW | MANY_TO_ONE | SAME_STUDENT | retain follow-up history and mark the referenced view version stale |

## 4. 可执行动作合同

| Action ID | 动作 | 目标对象 | 操作 | 输入 Field | 输出 Field | 状态效果 | ALLOW / DENY | 端 / 执行模式 | 风险 | 审计 | 幂等键 | 失败结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCO-ACT-CREATE-VIEW | Create a Source-pinned Gradebook View | SCO-OBJ-VIEW | CREATE | SCO-VIEW-F-STUDENT-REF<br>SCO-VIEW-F-RESULT-REF<br>SCO-VIEW-F-RESULT-VERSION<br>SCO-VIEW-F-EVIDENCE-REF<br>SCO-VIEW-F-EVIDENCE-VERSION<br>SCO-VIEW-F-PLAN-REF<br>SCO-VIEW-F-PLAN-VERSION<br>SCO-VIEW-F-QUERY-DEFINITION<br>SCO-VIEW-F-COLUMN-DEFINITION<br>SCO-VIEW-F-SAVED-VIEW-DEFINITION | SCO-VIEW-F-ID<br>SCO-VIEW-F-RESULT-DATA-ID<br>SCO-VIEW-F-EVIDENCE-DATA-ID<br>SCO-VIEW-F-PLAN-DATA-ID<br>SCO-VIEW-F-VIEW-VERSION | CREATE（成功状态由 SCO-ACT-CREATE-VIEW-SCN-SUCCESS 定义） | ALLOW:DUTY-SUBJECT-TEACHER — the corresponding subject teacher writes only inside the assigned subject, class, and student scope<br>DENY:DUTY-HOMEROOM — a homeroom teacher attempts to mutate another subject's score, evidence, plan, correction, or follow-up facts<br>DENY:ROLE-SCHOOL-ADMIN — a school administrator attempts to read or mutate student learning detail without a separately authorized case<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student learning detail | WEB / APP | LOW | REQUIRED | SCO-ACT-CREATE-VIEW:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCO-ACT-READ-GRADEBOOK | Read the Authorized Gradebook Projection | SCO-OBJ-VIEW | READ | SCO-VIEW-F-ID | SCO-VIEW-F-ID<br>SCO-VIEW-F-STUDENT-REF<br>SCO-VIEW-F-RESULT-DATA-ID<br>SCO-VIEW-F-RESULT-REF<br>SCO-VIEW-F-RESULT-VERSION<br>SCO-VIEW-F-EVIDENCE-DATA-ID<br>SCO-VIEW-F-EVIDENCE-REF<br>SCO-VIEW-F-EVIDENCE-VERSION<br>SCO-VIEW-F-PLAN-DATA-ID<br>SCO-VIEW-F-PLAN-REF<br>SCO-VIEW-F-PLAN-VERSION<br>SCO-VIEW-F-QUERY-DEFINITION<br>SCO-VIEW-F-COLUMN-DEFINITION<br>SCO-VIEW-F-SAVED-VIEW-DEFINITION<br>SCO-VIEW-F-VIEW-VERSION | UNCHANGED | ALLOW:DUTY-SUBJECT-TEACHER — the corresponding subject teacher reads only the assigned subject, class, and student scope<br>ALLOW:DUTY-HOMEROOM — the homeroom teacher reads the assigned class across subjects for read-only coordination<br>DENY:ROLE-SCHOOL-ADMIN — a school administrator has no default permission to read student learning detail<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default permission to read student learning detail | WEB / APP | READ | NOT_REQUIRED | — | PERMISSION_DENIED / NOT_FOUND |
| SCO-ACT-CREATE-FOLLOW-UP | Create a Gradebook Follow-up Record | SCO-OBJ-FOLLOW-UP | CREATE | SCO-FOLLOW-UP-F-VIEW-REF<br>SCO-FOLLOW-UP-F-VIEW-VERSION<br>SCO-FOLLOW-UP-F-ATTENTION-KIND<br>SCO-FOLLOW-UP-F-NOTE | SCO-FOLLOW-UP-F-ID<br>SCO-FOLLOW-UP-F-VERSION | CREATE（成功状态由 SCO-ACT-CREATE-FOLLOW-UP-SCN-SUCCESS 定义） | ALLOW:DUTY-SUBJECT-TEACHER — the corresponding subject teacher writes only inside the assigned subject, class, and student scope<br>DENY:DUTY-HOMEROOM — a homeroom teacher attempts to mutate another subject's score, evidence, plan, correction, or follow-up facts<br>DENY:ROLE-SCHOOL-ADMIN — a school administrator attempts to read or mutate student learning detail without a separately authorized case<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student learning detail | WEB / APP | LOW | REQUIRED | SCO-ACT-CREATE-FOLLOW-UP:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| SCO-ACT-VIEW-FOLLOW-UP | View Gradebook Follow-up Records | SCO-OBJ-FOLLOW-UP | READ | SCO-FOLLOW-UP-F-ID | SCO-FOLLOW-UP-F-ID<br>SCO-FOLLOW-UP-F-VIEW-REF<br>SCO-FOLLOW-UP-F-VIEW-VERSION<br>SCO-FOLLOW-UP-F-ATTENTION-KIND<br>SCO-FOLLOW-UP-F-NOTE<br>SCO-FOLLOW-UP-F-VERSION | UNCHANGED | ALLOW:DUTY-SUBJECT-TEACHER — the corresponding subject teacher reads only the assigned subject, class, and student scope<br>ALLOW:DUTY-HOMEROOM — the homeroom teacher reads the assigned class across subjects for read-only coordination<br>DENY:ROLE-SCHOOL-ADMIN — a school administrator has no default permission to read student learning detail<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default permission to read student learning detail | WEB / APP | READ | NOT_REQUIRED | — | PERMISSION_DENIED / NOT_FOUND |

## 6. 状态可达性

| Object ID | 状态 | 进入动作 | 离开动作 |
| --- | --- | --- | --- |
| SCO-OBJ-VIEW | ACTIVE | SCO-ACT-CREATE-VIEW |  |
| SCO-OBJ-FOLLOW-UP | OPEN | SCO-ACT-CREATE-FOLLOW-UP |  |

## 7. 参与数据流

| Flow ID | 数据流 | 阶段 | 参与模块 | 本模块动作 | 失败与补偿 |
| --- | --- | --- | --- | --- | --- |
| DF-014 | Student Management Profile Aggregation | 1 | SCO-001 / INS-001 / PLN-001 / APP-001 / STU-001 | SCO-ACT-READ-GRADEBOOK | STUDENT_PROFILE_SOURCE_AND_PROJECTION_OBJECT；{"strategy":"REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_PROFILE_OBJECTS","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]}；{"strategy":"KEEP_PRIOR_PROFILE_AND_TODO_VIEW_VERSIONS","description":"a failed aggregation preserves the prior view definitions and retries only stale or failed student objects"}；{"strategy":"INVALIDATE_ONLY_STALE_PROFILE_AND_TODO_PROJECTIONS","targets":["gradebook view definition","student profile view definition","student todo aggregation"]} |

## 8. 页面任务合同

| Page ID | 页面 | 端 | 对象 | 字段 | 动作 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCO-PAGE-GRADEBOOK | Authorized Gradebook Projection | WEB / APP | SCO-OBJ-VIEW | SCO-VIEW-F-ID<br>SCO-VIEW-F-STUDENT-REF<br>SCO-VIEW-F-RESULT-DATA-ID<br>SCO-VIEW-F-RESULT-REF<br>SCO-VIEW-F-RESULT-VERSION<br>SCO-VIEW-F-EVIDENCE-DATA-ID<br>SCO-VIEW-F-EVIDENCE-REF<br>SCO-VIEW-F-EVIDENCE-VERSION<br>SCO-VIEW-F-PLAN-DATA-ID<br>SCO-VIEW-F-PLAN-REF<br>SCO-VIEW-F-PLAN-VERSION<br>SCO-VIEW-F-QUERY-DEFINITION<br>SCO-VIEW-F-COLUMN-DEFINITION<br>SCO-VIEW-F-SAVED-VIEW-DEFINITION<br>SCO-VIEW-F-VIEW-VERSION | SCO-ACT-CREATE-VIEW<br>SCO-ACT-READ-GRADEBOOK | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| SCO-PAGE-FOLLOW-UP | Gradebook Follow-up Workspace | WEB / APP | SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-ID<br>SCO-FOLLOW-UP-F-VIEW-REF<br>SCO-FOLLOW-UP-F-VIEW-VERSION<br>SCO-FOLLOW-UP-F-ATTENTION-KIND<br>SCO-FOLLOW-UP-F-NOTE<br>SCO-FOLLOW-UP-F-VERSION | SCO-ACT-CREATE-FOLLOW-UP<br>SCO-ACT-VIEW-FOLLOW-UP | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |

## 9. 验收场景

| Scenario ID | 类型 | Action ID | Given | When | Expected Data | Expected State | Permission | 失败码 / 谓词 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCO-ACT-CREATE-VIEW-SCN-SUCCESS | SUCCESS | SCO-ACT-CREATE-VIEW | the actor meets the entry conditions for Create a Source-pinned Gradebook View | the actor requests Create a Source-pinned Gradebook View | creates only a view definition and version-pinned source links without copying score, evidence, or plan content | ACTIVE | ALLOW |  |
| SCO-ACT-CREATE-VIEW-SCN-PERMISSION_DENIED | FAILURE | SCO-ACT-CREATE-VIEW | PERMISSION_DENIED applies to Create a Source-pinned Gradebook View | the actor requests Create a Source-pinned Gradebook View | Create a Source-pinned Gradebook View returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| SCO-ACT-CREATE-VIEW-SCN-VALIDATION_FAILED | FAILURE | SCO-ACT-CREATE-VIEW | VALIDATION_FAILED applies to Create a Source-pinned Gradebook View | the actor requests Create a Source-pinned Gradebook View | Create a Source-pinned Gradebook View returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| SCO-ACT-CREATE-VIEW-SCN-VERSION_CONFLICT | FAILURE | SCO-ACT-CREATE-VIEW | VERSION_CONFLICT applies to Create a Source-pinned Gradebook View | the actor requests Create a Source-pinned Gradebook View | Create a Source-pinned Gradebook View returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| SCO-ACT-READ-GRADEBOOK-SCN-SUCCESS | SUCCESS | SCO-ACT-READ-GRADEBOOK | the actor meets the entry conditions for Read the Authorized Gradebook Projection | the actor requests Read the Authorized Gradebook Projection | resolves current projection columns through the pinned PUB, INS, and PLN source versions | UNCHANGED | ALLOW |  |
| SCO-ACT-READ-GRADEBOOK-SCN-PERMISSION_DENIED | FAILURE | SCO-ACT-READ-GRADEBOOK | PERMISSION_DENIED applies to Read the Authorized Gradebook Projection | the actor requests Read the Authorized Gradebook Projection | Read the Authorized Gradebook Projection returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| SCO-ACT-READ-GRADEBOOK-SCN-NOT_FOUND | FAILURE | SCO-ACT-READ-GRADEBOOK | NOT_FOUND applies to Read the Authorized Gradebook Projection | the actor requests Read the Authorized Gradebook Projection | Read the Authorized Gradebook Projection returns NOT_FOUND without hidden writes | UNCHANGED | DENY | NOT_FOUND |
| SCO-ACT-CREATE-FOLLOW-UP-SCN-SUCCESS | SUCCESS | SCO-ACT-CREATE-FOLLOW-UP | the actor meets the entry conditions for Create a Gradebook Follow-up Record | the actor requests Create a Gradebook Follow-up Record | Create a Gradebook Follow-up Record returns the accepted versioned result | OPEN | ALLOW |  |
| SCO-ACT-CREATE-FOLLOW-UP-SCN-PERMISSION_DENIED | FAILURE | SCO-ACT-CREATE-FOLLOW-UP | PERMISSION_DENIED applies to Create a Gradebook Follow-up Record | the actor requests Create a Gradebook Follow-up Record | Create a Gradebook Follow-up Record returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| SCO-ACT-CREATE-FOLLOW-UP-SCN-VALIDATION_FAILED | FAILURE | SCO-ACT-CREATE-FOLLOW-UP | VALIDATION_FAILED applies to Create a Gradebook Follow-up Record | the actor requests Create a Gradebook Follow-up Record | Create a Gradebook Follow-up Record returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| SCO-ACT-CREATE-FOLLOW-UP-SCN-VERSION_CONFLICT | FAILURE | SCO-ACT-CREATE-FOLLOW-UP | VERSION_CONFLICT applies to Create a Gradebook Follow-up Record | the actor requests Create a Gradebook Follow-up Record | Create a Gradebook Follow-up Record returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| SCO-ACT-VIEW-FOLLOW-UP-SCN-SUCCESS | SUCCESS | SCO-ACT-VIEW-FOLLOW-UP | the actor meets the entry conditions for View Gradebook Follow-up Records | the actor requests View Gradebook Follow-up Records | View Gradebook Follow-up Records returns the accepted versioned result | UNCHANGED | ALLOW |  |
| SCO-ACT-VIEW-FOLLOW-UP-SCN-PERMISSION_DENIED | FAILURE | SCO-ACT-VIEW-FOLLOW-UP | PERMISSION_DENIED applies to View Gradebook Follow-up Records | the actor requests View Gradebook Follow-up Records | View Gradebook Follow-up Records returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| SCO-ACT-VIEW-FOLLOW-UP-SCN-NOT_FOUND | FAILURE | SCO-ACT-VIEW-FOLLOW-UP | NOT_FOUND applies to View Gradebook Follow-up Records | the actor requests View Gradebook Follow-up Records | View Gradebook Follow-up Records returns NOT_FOUND without hidden writes | UNCHANGED | DENY | NOT_FOUND |

## 10. AI 任务映射

| Task ID | 任务 | 类型 | 目标 Action | 受众 | 确认者 | 预览字段 | 失败行为 |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 11. 研发与测试就绪门禁

- 实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。
- 所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。
- 每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。
- 每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。
- Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。
