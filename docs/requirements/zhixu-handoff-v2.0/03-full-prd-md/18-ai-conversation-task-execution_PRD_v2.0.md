# AIX-001 AI Conversation and Controlled Task Preview PRD v2.0

| 属性 | 值 |
| --- | --- |
| 阶段 | 1 |
| 优先级 | P0 |
| 目标 | Resolve registered Web and App AI tasks into authorized structured previews without creating a second business fact |
| 基线决策 | `BASE-003`、`BASE-007`、`BASE-009` |
| NFR | `NFR-006`、`NFR-008` |
| 进入条件 | the user selects an active school, term, role, and authorized AI task |
| 退出条件 | the preview names one target Action and retains permission and source-version results |

## 1. 范围与事实边界

- 本模块权威拥有 1 个对象、3 个动作。
- 模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。
- 页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。
- AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。

## 2. 权威对象与字段合同

### AIX-OBJ-TASK-PREVIEW Temporary Registered AI Task Preview

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUBJECT_TEACHING_TASK | SCHOOL | CURRENT_ACTOR | DUTY-SUBJECT-TEACHER | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM | LIFE-005 | S3 | NO_DIRECT_READ | PREVIEW_READY |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AIX-PREVIEW-F-ID | AI Task Preview ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AIX-PREVIEW-F-TASK-ID | Registered AI Task ID | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AIX-PREVIEW-F-TARGET-ACTION-ID | Target Action ID | ID | 是 | OPTION_SET: OPT-COM-016 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AIX-PREVIEW-F-PARAMETERS | Resolved Parameters | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AIX-PREVIEW-F-PERMISSION-RESULT | Permission Result | STRING | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AIX-PREVIEW-F-SOURCE-VERSIONS | Source Versions | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AIX-PREVIEW-F-PAYLOAD | Structured Preview Payload | JSON | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AIX-PREVIEW-F-EXPIRES-AT | Preview Expiry Time | DATETIME | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AIX-PREVIEW-F-VERSION | AI Task Preview Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

## 3. 对象关系

| Relationship ID | 源对象 | 关系 | 目标对象 | 基数 | 所有权范围 | 源失效处理 |
| --- | --- | --- | --- | --- | --- | --- |

## 4. 可执行动作合同

| Action ID | 动作 | 目标对象 | 操作 | 访问例外 | 输入 Field | 输出 Field | 状态效果 | ALLOW / DENY | 端 / 执行模式 | 风险 | 审计 | 幂等键 | 失败结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AIX-ACT-PREPARE-TASK-PREVIEW | Prepare a Registered AI Task Preview | AIX-OBJ-TASK-PREVIEW | CREATE | — | AIX-PREVIEW-F-TASK-ID<br>AIX-PREVIEW-F-TARGET-ACTION-ID<br>AIX-PREVIEW-F-PARAMETERS | AIX-PREVIEW-F-ID<br>AIX-PREVIEW-F-PERMISSION-RESULT<br>AIX-PREVIEW-F-SOURCE-VERSIONS<br>AIX-PREVIEW-F-PAYLOAD<br>AIX-PREVIEW-F-EXPIRES-AT<br>AIX-PREVIEW-F-VERSION | CREATE（成功状态由 AIX-ACT-PREPARE-TASK-PREVIEW-SCN-SUCCESS 定义） | ALLOW:DUTY-SUBJECT-TEACHER — the corresponding subject teacher acts inside assigned subject, class, and student scope<br>DENY:ROLE-STUDENT — a student attempts to create or manage a teacher-owned definition or reminder<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student learning detail | WEB / APP | LOW | REQUIRED | AIX-ACT-PREPARE-TASK-PREVIEW:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW | Create a Temporary AI Feedback Draft Preview | AIX-OBJ-TASK-PREVIEW | CREATE | — | AIX-PREVIEW-F-TASK-ID<br>AIX-PREVIEW-F-TARGET-ACTION-ID<br>AIX-PREVIEW-F-PARAMETERS | AIX-PREVIEW-F-ID<br>AIX-PREVIEW-F-PERMISSION-RESULT<br>AIX-PREVIEW-F-SOURCE-VERSIONS<br>AIX-PREVIEW-F-PAYLOAD<br>AIX-PREVIEW-F-EXPIRES-AT<br>AIX-PREVIEW-F-VERSION | CREATE（成功状态由 AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW-SCN-SUCCESS 定义） | ALLOW:DUTY-SUBJECT-TEACHER — the corresponding subject teacher acts inside assigned subject, class, and student scope<br>DENY:ROLE-STUDENT — a student attempts to create or manage a teacher-owned definition or reminder<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student learning detail | WEB / APP | LOW | REQUIRED | AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW | Create a Temporary AI Improvement-plan Draft Preview | AIX-OBJ-TASK-PREVIEW | CREATE | — | AIX-PREVIEW-F-TASK-ID<br>AIX-PREVIEW-F-TARGET-ACTION-ID<br>AIX-PREVIEW-F-PARAMETERS | AIX-PREVIEW-F-ID<br>AIX-PREVIEW-F-PERMISSION-RESULT<br>AIX-PREVIEW-F-SOURCE-VERSIONS<br>AIX-PREVIEW-F-PAYLOAD<br>AIX-PREVIEW-F-EXPIRES-AT<br>AIX-PREVIEW-F-VERSION | CREATE（成功状态由 AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW-SCN-SUCCESS 定义） | ALLOW:DUTY-SUBJECT-TEACHER — the corresponding subject teacher acts inside assigned subject, class, and student scope<br>DENY:ROLE-STUDENT — a student attempts to create or manage a teacher-owned definition or reminder<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default access to student learning detail | WEB / APP | LOW | REQUIRED | AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

## 6. 状态可达性

| Object ID | 状态 | 进入动作 | 离开动作 |
| --- | --- | --- | --- |
| AIX-OBJ-TASK-PREVIEW | PREVIEW_READY | AIX-ACT-PREPARE-TASK-PREVIEW<br>AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW<br>AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW |  |

## 7. 参与数据流

| Flow ID | 数据流 | 阶段 | 参与模块 | 本模块动作 | 失败与补偿 |
| --- | --- | --- | --- | --- | --- |

## 8. 页面任务合同

| Page ID | 页面 | 端 | 对象 | 字段 | 动作 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AIX-PAGE-CONVERSATION | AI Conversation and Structured Confirmation | WEB / APP | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-ID<br>AIX-PREVIEW-F-TASK-ID<br>AIX-PREVIEW-F-TARGET-ACTION-ID<br>AIX-PREVIEW-F-PARAMETERS<br>AIX-PREVIEW-F-PERMISSION-RESULT<br>AIX-PREVIEW-F-SOURCE-VERSIONS<br>AIX-PREVIEW-F-PAYLOAD<br>AIX-PREVIEW-F-EXPIRES-AT<br>AIX-PREVIEW-F-VERSION | AIX-ACT-PREPARE-TASK-PREVIEW<br>AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW<br>AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |

## 9. 验收场景

| Scenario ID | 类型 | Action ID | Given | When | Expected Data | Expected State | Permission | 失败码 / 谓词 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AIX-ACT-PREPARE-TASK-PREVIEW-SCN-SUCCESS | SUCCESS | AIX-ACT-PREPARE-TASK-PREVIEW | the actor meets the entry conditions for Prepare a Registered AI Task Preview | the actor requests Prepare a Registered AI Task Preview | Prepare a Registered AI Task Preview returns the accepted versioned result | PREVIEW_READY | ALLOW |  |
| AIX-ACT-PREPARE-TASK-PREVIEW-SCN-PERMISSION_DENIED | FAILURE | AIX-ACT-PREPARE-TASK-PREVIEW | PERMISSION_DENIED applies to Prepare a Registered AI Task Preview | the actor requests Prepare a Registered AI Task Preview | Prepare a Registered AI Task Preview returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AIX-ACT-PREPARE-TASK-PREVIEW-SCN-VALIDATION_FAILED | FAILURE | AIX-ACT-PREPARE-TASK-PREVIEW | VALIDATION_FAILED applies to Prepare a Registered AI Task Preview | the actor requests Prepare a Registered AI Task Preview | Prepare a Registered AI Task Preview returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AIX-ACT-PREPARE-TASK-PREVIEW-SCN-VERSION_CONFLICT | FAILURE | AIX-ACT-PREPARE-TASK-PREVIEW | VERSION_CONFLICT applies to Prepare a Registered AI Task Preview | the actor requests Prepare a Registered AI Task Preview | Prepare a Registered AI Task Preview returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW-SCN-SUCCESS | SUCCESS | AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW | the actor meets the entry conditions for Create a Temporary AI Feedback Draft Preview | the actor requests Create a Temporary AI Feedback Draft Preview | Create a Temporary AI Feedback Draft Preview returns the accepted versioned result | PREVIEW_READY | ALLOW |  |
| AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW-SCN-PERMISSION_DENIED | FAILURE | AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW | PERMISSION_DENIED applies to Create a Temporary AI Feedback Draft Preview | the actor requests Create a Temporary AI Feedback Draft Preview | Create a Temporary AI Feedback Draft Preview returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW-SCN-VALIDATION_FAILED | FAILURE | AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW | VALIDATION_FAILED applies to Create a Temporary AI Feedback Draft Preview | the actor requests Create a Temporary AI Feedback Draft Preview | Create a Temporary AI Feedback Draft Preview returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW-SCN-VERSION_CONFLICT | FAILURE | AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW | VERSION_CONFLICT applies to Create a Temporary AI Feedback Draft Preview | the actor requests Create a Temporary AI Feedback Draft Preview | Create a Temporary AI Feedback Draft Preview returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW-SCN-SUCCESS | SUCCESS | AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW | the actor meets the entry conditions for Create a Temporary AI Improvement-plan Draft Preview | the actor requests Create a Temporary AI Improvement-plan Draft Preview | Create a Temporary AI Improvement-plan Draft Preview returns the accepted versioned result | PREVIEW_READY | ALLOW |  |
| AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW-SCN-PERMISSION_DENIED | FAILURE | AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW | PERMISSION_DENIED applies to Create a Temporary AI Improvement-plan Draft Preview | the actor requests Create a Temporary AI Improvement-plan Draft Preview | Create a Temporary AI Improvement-plan Draft Preview returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW-SCN-VALIDATION_FAILED | FAILURE | AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW | VALIDATION_FAILED applies to Create a Temporary AI Improvement-plan Draft Preview | the actor requests Create a Temporary AI Improvement-plan Draft Preview | Create a Temporary AI Improvement-plan Draft Preview returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW-SCN-VERSION_CONFLICT | FAILURE | AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW | VERSION_CONFLICT applies to Create a Temporary AI Improvement-plan Draft Preview | the actor requests Create a Temporary AI Improvement-plan Draft Preview | Create a Temporary AI Improvement-plan Draft Preview returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |

## 10. AI 任务映射

| Task ID | 任务 | 类型 | 目标 Action | 受众 | 确认者 | 预览字段 | 失败行为 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AI-TASK-FEEDBACK-DRAFT | Draft feedback for this reviewed submission | DRAFT | AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW | DUTY-SUBJECT-TEACHER | {"mode":"DUTY","dutyRef":"DUTY-SUBJECT-TEACHER"} | AIX-PREVIEW-F-TASK-ID<br>AIX-PREVIEW-F-TARGET-ACTION-ID<br>AIX-PREVIEW-F-PARAMETERS | {"mode":"FAIL_CLOSED","preservesBusinessFacts":true,"manualFallback":"continue through the target module's manual Web or App path"} |
| AI-TASK-IMPROVEMENT-PLAN-DRAFT | Draft a two-week improvement plan from the confirmed evidence | DRAFT | AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW | DUTY-SUBJECT-TEACHER | {"mode":"DUTY","dutyRef":"DUTY-SUBJECT-TEACHER"} | AIX-PREVIEW-F-TASK-ID<br>AIX-PREVIEW-F-TARGET-ACTION-ID<br>AIX-PREVIEW-F-PARAMETERS | {"mode":"FAIL_CLOSED","preservesBusinessFacts":true,"manualFallback":"continue through the target module's manual Web or App path"} |

## 11. 研发与测试就绪门禁

- 实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。
- 所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。
- 每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。
- 每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。
- Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。
