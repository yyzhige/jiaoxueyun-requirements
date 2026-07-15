# ACC-001 School entry, login, and active context PRD v2.0

| 属性 | 值 |
| --- | --- |
| 阶段 | 1 |
| 优先级 | P0 |
| 目标 | Establish an explicit school, identity, and term context before any protected work. |
| 基线决策 | `BASE-001`、`BASE-004`、`BASE-005`、`BASE-007` |
| NFR | `NFR-002`、`NFR-007`、`NFR-008` |
| 进入条件 | the user starts without an implicit recent-school selection；the school directory and account membership source are available |
| 退出条件 | an authorized active context has explicit school, identity, term, and expiry；historical terms are marked read-only |

## 1. 范围与事实边界

- 本模块权威拥有 4 个对象、13 个动作。
- 模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。
- 页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。
- AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。

## 2. 权威对象与字段合同

### ACC-OBJ-SCHOOL School Space

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCHOOL_CONFIGURATION | SCHOOL | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | LIFE-001 | S2 | AUTHORIZED | ACTIVE / SUSPENDED / CLOSED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-SCHOOL-F-ID | School ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-SCHOOL-F-SOURCE-REF | School Directory Source Reference | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-SCHOOL-F-SOURCE-VERSION | School Directory Source Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-SCHOOL-F-NAME | School Name | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-SCHOOL-F-REGION | School Region | STRING | 是 | OPTION_SET: OPT-COM-001 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-SCHOOL-F-TYPE | School Type | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-SCHOOL-F-SCHOOL-VERSION | School Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-SCHOOL-F-SERVICE-STATE | Service State | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### ACC-OBJ-MEMBERSHIP Account Membership

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCHOOL_MEMBER_ACCOUNT | SCHOOL | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | LIFE-001 | S4 | AUTHORIZED | INVITED / ACTIVE / SUSPENDED / DEACTIVATED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-MEMBER-F-ID | Account Membership ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-MEMBER-F-ACCOUNT-ID-TYPE | Account Identifier Type | STRING | 是 | OPTION_SET: OPT-ENUM-025 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-MEMBER-F-ACCOUNT-ID | Account Identifier Value | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-MEMBER-F-SCHOOL-ID | Membership School ID | STRING | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-MEMBER-F-ACTIVATION | Activation Method | STRING | 是 | OPTION_SET: OPT-ENUM-026 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-MEMBER-F-STATE | Membership State | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### ACC-OBJ-IDENTITY Work Identity Assignment

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCHOOL_MEMBER_WORK_IDENTITY | SCHOOL | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | LIFE-002 | S4 | AUTHORIZED | PENDING / EFFECTIVE / EXPIRED / REVOKED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-IDENTITY-F-ID | Identity Assignment ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-IDENTITY-F-SOURCE-REF | Identity Directory Source Reference | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-IDENTITY-F-SOURCE-VERSION | Identity Directory Source Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-IDENTITY-F-ROLE | Login Role | STRING | 是 | OPTION_SET: OPT-COM-003 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-IDENTITY-F-DUTIES | Assigned Duties | STRING_ARRAY | 否 | OPTION_SET: OPT-ENUM-042 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-IDENTITY-F-SCOPES | Effective Data Scopes | STRING_ARRAY | 是 | SYSTEM | READ_ONLY | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-IDENTITY-F-IDENTITY-VERSION | Identity Assignment Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-IDENTITY-F-EFFECTIVE | Effective At | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-IDENTITY-F-EXPIRY | Expires At | DATETIME | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### ACC-OBJ-CONTEXT Active Work Context

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CURRENT_ACTOR_WORK_CONTEXT | SCHOOL | CURRENT_ACTOR | CURRENT_ACTOR | SYSTEM | SYSTEM | LIFE-001 | S4 | NO_DIRECT_READ | ACTIVE / READ_ONLY / EXPIRED / INVALIDATED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-CONTEXT-F-ID | Work Context ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-CONTEXT-F-SCHOOL-ID | Context School ID | STRING | 是 | OPTION_SET: OPT-COM-002 | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-CONTEXT-F-IDENTITY-ID | Context Identity ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-CONTEXT-F-TERM-ID | Context Term ID | STRING | 是 | OPTION_SET: OPT-COM-004 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-CONTEXT-F-CREATED | Created At | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-CONTEXT-F-EXPIRY | Expires At | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-CONTEXT-F-CONTEXT-VERSION | Context Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| ACC-CONTEXT-F-STATUS | Context Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

## 3. 对象关系

| Relationship ID | 源对象 | 关系 | 目标对象 | 基数 | 所有权范围 | 源失效处理 |
| --- | --- | --- | --- | --- | --- | --- |
| ACC-REL-MEMBERSHIP-SCHOOL | ACC-OBJ-MEMBERSHIP | BELONGS_TO | ACC-OBJ-SCHOOL | MANY_TO_ONE | SAME_SCHOOL | invalidate identities and active contexts for the membership |
| ACC-REL-CONTEXT-IDENTITY | ACC-OBJ-CONTEXT | ACTIVATES | ACC-OBJ-IDENTITY | MANY_TO_ONE | SAME_CONTEXT | expire the active context immediately |

## 4. 可执行动作合同

| Action ID | 动作 | 目标对象 | 操作 | 输入 Field | 输出 Field | 状态效果 | ALLOW / DENY | 端 / 执行模式 | 风险 | 审计 | 幂等键 | 失败结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-SYNC-SCHOOL | Sync a Versioned School Directory Snapshot | ACC-OBJ-SCHOOL | CREATE | ACC-SCHOOL-F-SOURCE-REF<br>ACC-SCHOOL-F-SOURCE-VERSION<br>ACC-SCHOOL-F-NAME<br>ACC-SCHOOL-F-REGION<br>ACC-SCHOOL-F-TYPE<br>ACC-SCHOOL-F-SERVICE-STATE | ACC-SCHOOL-F-ID<br>ACC-SCHOOL-F-SOURCE-REF<br>ACC-SCHOOL-F-SOURCE-VERSION<br>ACC-SCHOOL-F-SCHOOL-VERSION<br>ACC-SCHOOL-F-SERVICE-STATE | CREATE（成功状态由  定义） | ALLOW:SYSTEM — the system accepts only a registered versioned school-directory snapshot<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot synthesize or alter a school-directory snapshot | SYSTEM_EVENT | HIGH | REQUIRED | ACC-ACT-SYNC-SCHOOL:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-SYNC-IDENTITY | Sync a Versioned Work Identity Snapshot | ACC-OBJ-IDENTITY | CREATE | ACC-IDENTITY-F-SOURCE-REF<br>ACC-IDENTITY-F-SOURCE-VERSION<br>ACC-IDENTITY-F-ROLE<br>ACC-IDENTITY-F-DUTIES<br>ACC-IDENTITY-F-SCOPES<br>ACC-IDENTITY-F-EFFECTIVE<br>ACC-IDENTITY-F-EXPIRY | ACC-IDENTITY-F-ID<br>ACC-IDENTITY-F-SOURCE-REF<br>ACC-IDENTITY-F-SOURCE-VERSION<br>ACC-IDENTITY-F-SCOPES<br>ACC-IDENTITY-F-IDENTITY-VERSION | CREATE（成功状态由  定义） | ALLOW:SYSTEM — the system accepts only a registered versioned identity-directory snapshot<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot synthesize or extend a work identity snapshot | SYSTEM_EVENT | HIGH | REQUIRED | ACC-ACT-SYNC-IDENTITY:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-SEARCH-SCHOOL | Search Authorized School Before Entry | ACC-OBJ-SCHOOL | READ | ACC-SCHOOL-F-REGION<br>ACC-SCHOOL-F-NAME | ACC-SCHOOL-F-ID<br>ACC-SCHOOL-F-SCHOOL-VERSION<br>ACC-SCHOOL-F-SERVICE-STATE | UNCHANGED | ALLOW:CURRENT_ACTOR — school first search is limited to schools visible to the actor<br>DENY:ROLE-PLATFORM-OPS — platform operations has no school member entry without school authorization | WEB / APP | READ | NOT_REQUIRED | — | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-SELECT-SCHOOL | Select School for Account Entry | ACC-OBJ-SCHOOL | READ | ACC-SCHOOL-F-ID | ACC-SCHOOL-F-SCHOOL-VERSION<br>ACC-SCHOOL-F-SERVICE-STATE | UNCHANGED | ALLOW:CURRENT_ACTOR — the actor explicitly selects one authorized active school<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot select a school member context without authorization | WEB / APP | READ | REQUIRED | — | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-LOGIN | Authenticate Account in Selected School | ACC-OBJ-MEMBERSHIP | READ | ACC-MEMBER-F-ACCOUNT-ID-TYPE<br>ACC-MEMBER-F-ACCOUNT-ID<br>ACC-MEMBER-F-SCHOOL-ID | ACC-MEMBER-F-STATE | UNCHANGED | ALLOW:CURRENT_ACTOR — all approved login roles may authenticate on Web and App after selecting a school<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot assume a school member identity | WEB / APP | READ | REQUIRED | — | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-FIRST-ACTIVATION | Complete First Account Activation | ACC-OBJ-MEMBERSHIP | UPDATE | ACC-MEMBER-F-ACTIVATION<br>ACC-MEMBER-F-ACCOUNT-ID-TYPE<br>ACC-MEMBER-F-ACCOUNT-ID | ACC-MEMBER-F-STATE | INVITED → ACTIVE | ALLOW:CURRENT_ACTOR — the invited member may activate only the selected school membership<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot activate a member account by default | WEB / APP | LOW | REQUIRED | ACC-ACT-FIRST-ACTIVATION:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-SUSPEND-MEMBERSHIP | Suspend an Active School Membership | ACC-OBJ-MEMBERSHIP | UPDATE | ACC-MEMBER-F-ID | ACC-MEMBER-F-STATE | ACTIVE → SUSPENDED | ALLOW:ROLE-SCHOOL-ADMIN — school administration suspends only a membership owned by the school<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot suspend a school membership by default | WEB / APP | HIGH | REQUIRED | ACC-ACT-SUSPEND-MEMBERSHIP:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-DEACTIVATE-MEMBERSHIP | Deactivate a School Membership | ACC-OBJ-MEMBERSHIP | UPDATE | ACC-MEMBER-F-ID | ACC-MEMBER-F-STATE | ACTIVE / SUSPENDED → DEACTIVATED | ALLOW:ROLE-SCHOOL-ADMIN — school administration deactivates only a membership owned by the school<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot deactivate a school membership by default | WEB / APP | HIGH | REQUIRED | ACC-ACT-DEACTIVATE-MEMBERSHIP:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-SELECT-IDENTITY | Select Effective Work Identity | ACC-OBJ-IDENTITY | READ | ACC-IDENTITY-F-ROLE<br>ACC-IDENTITY-F-DUTIES | ACC-IDENTITY-F-SCOPES<br>ACC-IDENTITY-F-IDENTITY-VERSION | UNCHANGED | ALLOW:CURRENT_ACTOR — the actor may select only an effective assigned role and duty set<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot select an ungranted school identity | WEB / APP | READ | REQUIRED | — | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-SELECT-TERM | Select Current or Historical Term | ACC-OBJ-CONTEXT | CREATE | ACC-CONTEXT-F-SCHOOL-ID<br>ACC-CONTEXT-F-IDENTITY-ID<br>ACC-CONTEXT-F-TERM-ID | ACC-CONTEXT-F-ID<br>ACC-CONTEXT-F-CREATED<br>ACC-CONTEXT-F-EXPIRY<br>ACC-CONTEXT-F-CONTEXT-VERSION<br>ACC-CONTEXT-F-STATUS | CREATE（成功状态由  定义） | ALLOW:CURRENT_ACTOR — the term is inside the selected school and identity scope<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot open a school term without authorization | WEB / APP | LOW | REQUIRED | ACC-ACT-SELECT-TERM:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-SWITCH-CONTEXT | Switch Active School Identity and Term Context | ACC-OBJ-CONTEXT | CREATE | ACC-CONTEXT-F-SCHOOL-ID<br>ACC-CONTEXT-F-IDENTITY-ID<br>ACC-CONTEXT-F-TERM-ID | ACC-CONTEXT-F-ID<br>ACC-CONTEXT-F-CREATED<br>ACC-CONTEXT-F-EXPIRY<br>ACC-CONTEXT-F-CONTEXT-VERSION<br>ACC-CONTEXT-F-STATUS | CREATE（成功状态由 ACC-ACT-SWITCH-CONTEXT-SCN-SUCCESS 定义） | ALLOW:CURRENT_ACTOR — every destination component is re-authorized before context switch<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot switch into student detail or school identity by default | WEB / APP | LOW | REQUIRED | ACC-ACT-SWITCH-CONTEXT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| ACC-ACT-EXPIRE-CONTEXT | Expire Stale Active Work Context | ACC-OBJ-CONTEXT | UPDATE | ACC-CONTEXT-F-EXPIRY | ACC-CONTEXT-F-STATUS | ACTIVE → EXPIRED | ALLOW:SYSTEM — the system expires a context at its declared expiry<br>DENY:CURRENT_ACTOR — a user cannot extend an expired context without re-establishment | SYSTEM_EVENT | HIGH | REQUIRED | ACC-ACT-EXPIRE-CONTEXT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| ACC-ACT-INVALIDATE-CONTEXT | Invalidate a Context with Stale Source Versions | ACC-OBJ-CONTEXT | UPDATE |  | ACC-CONTEXT-F-STATUS | ACTIVE / READ_ONLY → INVALIDATED | ALLOW:SYSTEM — the system invalidates a context after a bound school, identity, or term version changes<br>DENY:CURRENT_ACTOR — a user cannot keep a context active after its source version changes | SYSTEM_EVENT | HIGH | REQUIRED | ACC-ACT-INVALIDATE-CONTEXT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

## 6. 状态可达性

| Object ID | 状态 | 进入动作 | 离开动作 |
| --- | --- | --- | --- |
| ACC-OBJ-SCHOOL | ACTIVE | ACC-ACT-SYNC-SCHOOL |  |
| ACC-OBJ-SCHOOL | SUSPENDED | ACC-ACT-SYNC-SCHOOL |  |
| ACC-OBJ-SCHOOL | CLOSED | ACC-ACT-SYNC-SCHOOL |  |
| ACC-OBJ-MEMBERSHIP | INVITED |  | ACC-ACT-FIRST-ACTIVATION |
| ACC-OBJ-MEMBERSHIP | ACTIVE | ACC-ACT-FIRST-ACTIVATION | ACC-ACT-SUSPEND-MEMBERSHIP<br>ACC-ACT-DEACTIVATE-MEMBERSHIP |
| ACC-OBJ-MEMBERSHIP | SUSPENDED | ACC-ACT-SUSPEND-MEMBERSHIP | ACC-ACT-DEACTIVATE-MEMBERSHIP |
| ACC-OBJ-MEMBERSHIP | DEACTIVATED | ACC-ACT-DEACTIVATE-MEMBERSHIP |  |
| ACC-OBJ-IDENTITY | PENDING | ACC-ACT-SYNC-IDENTITY |  |
| ACC-OBJ-IDENTITY | EFFECTIVE | ACC-ACT-SYNC-IDENTITY |  |
| ACC-OBJ-IDENTITY | EXPIRED | ACC-ACT-SYNC-IDENTITY |  |
| ACC-OBJ-IDENTITY | REVOKED | ACC-ACT-SYNC-IDENTITY |  |
| ACC-OBJ-CONTEXT | ACTIVE | ACC-ACT-SELECT-TERM<br>ACC-ACT-SWITCH-CONTEXT | ACC-ACT-EXPIRE-CONTEXT<br>ACC-ACT-INVALIDATE-CONTEXT |
| ACC-OBJ-CONTEXT | READ_ONLY | ACC-ACT-SELECT-TERM<br>ACC-ACT-SWITCH-CONTEXT | ACC-ACT-INVALIDATE-CONTEXT |
| ACC-OBJ-CONTEXT | EXPIRED | ACC-ACT-EXPIRE-CONTEXT |  |
| ACC-OBJ-CONTEXT | INVALIDATED | ACC-ACT-INVALIDATE-CONTEXT |  |

## 7. 参与数据流

| Flow ID | 数据流 | 阶段 | 参与模块 | 本模块动作 | 失败与补偿 |
| --- | --- | --- | --- | --- | --- |
| DF-001 | School Context Establishment | 1 | ACC-001 / ORG-001 / IAM-001 | ACC-ACT-SEARCH-SCHOOL<br>ACC-ACT-SELECT-SCHOOL<br>ACC-ACT-FIRST-ACTIVATION<br>ACC-ACT-LOGIN<br>ACC-ACT-SELECT-IDENTITY<br>ACC-ACT-SELECT-TERM<br>ACC-ACT-SWITCH-CONTEXT | STEP_WITH_NO_CONTEXT_ACTIVATION_BEFORE_ALL_CHECKS_PASS；{"strategy":"RETRY_READS_AND_IDEMPOTENT_CONTEXT_WRITE","maxAttempts":3,"retryableFailureResults":["VERSION_CONFLICT"]}；{"strategy":"EXPIRE_PARTIAL_CONTEXT","description":"if a context write exists before final acceptance, expire it and require full re-establishment"}；{"strategy":"INVALIDATE_PREVIOUS_CONTEXT_DERIVATIONS","targets":["permission cache","term-scoped navigation","write authorization tokens"]} |

## 8. 页面任务合同

| Page ID | 页面 | 端 | 对象 | 字段 | 动作 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-PAGE-SCHOOL-ENTRY | Authorized School Selection | WEB / APP | ACC-OBJ-SCHOOL | ACC-SCHOOL-F-ID<br>ACC-SCHOOL-F-NAME<br>ACC-SCHOOL-F-REGION<br>ACC-SCHOOL-F-SERVICE-STATE | ACC-ACT-SEARCH-SCHOOL<br>ACC-ACT-SELECT-SCHOOL | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| ACC-PAGE-LOGIN-ACTIVATION | Selected School Login and First Activation | WEB / APP | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-ACCOUNT-ID-TYPE<br>ACC-MEMBER-F-ACCOUNT-ID<br>ACC-MEMBER-F-SCHOOL-ID<br>ACC-MEMBER-F-ACTIVATION<br>ACC-MEMBER-F-STATE | ACC-ACT-LOGIN<br>ACC-ACT-FIRST-ACTIVATION<br>ACC-ACT-SUSPEND-MEMBERSHIP<br>ACC-ACT-DEACTIVATE-MEMBERSHIP | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| ACC-PAGE-IDENTITY-TERM | Effective Identity and Term Selection | WEB / APP | ACC-OBJ-IDENTITY<br>ACC-OBJ-CONTEXT | ACC-IDENTITY-F-ROLE<br>ACC-IDENTITY-F-DUTIES<br>ACC-CONTEXT-F-SCHOOL-ID<br>ACC-CONTEXT-F-IDENTITY-ID<br>ACC-CONTEXT-F-TERM-ID<br>ACC-CONTEXT-F-STATUS | ACC-ACT-SELECT-IDENTITY<br>ACC-ACT-SELECT-TERM | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| ACC-PAGE-CONTEXT-SWITCH | Active Context Switcher | WEB / APP | ACC-OBJ-CONTEXT | ACC-CONTEXT-F-SCHOOL-ID<br>ACC-CONTEXT-F-IDENTITY-ID<br>ACC-CONTEXT-F-TERM-ID<br>ACC-CONTEXT-F-STATUS | ACC-ACT-SWITCH-CONTEXT | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| ACC-PAGE-CONTEXT-RECOVERY | Expired Context Recovery | WEB / APP | ACC-OBJ-CONTEXT | ACC-CONTEXT-F-SCHOOL-ID<br>ACC-CONTEXT-F-IDENTITY-ID<br>ACC-CONTEXT-F-TERM-ID<br>ACC-CONTEXT-F-EXPIRY<br>ACC-CONTEXT-F-STATUS | ACC-ACT-SWITCH-CONTEXT | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |

## 9. 验收场景

| Scenario ID | 类型 | Action ID | Given | When | Expected Data | Expected State | Permission | 失败码 / 谓词 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-ACT-SYNC-SCHOOL-SCN-SUCCESS-ACTIVE | SUCCESS | ACC-ACT-SYNC-SCHOOL | the actor meets the entry conditions for Sync a Versioned School Directory Snapshot | the actor requests Sync a Versioned School Directory Snapshot | Sync a Versioned School Directory Snapshot returns the accepted task-specific result | ACTIVE | ALLOW |  |
| ACC-ACT-SYNC-SCHOOL-SCN-SUCCESS-SUSPENDED | SUCCESS | ACC-ACT-SYNC-SCHOOL | the actor meets the entry conditions for Sync a Versioned School Directory Snapshot | the actor requests Sync a Versioned School Directory Snapshot | Sync a Versioned School Directory Snapshot returns the accepted task-specific result | SUSPENDED | ALLOW |  |
| ACC-ACT-SYNC-SCHOOL-SCN-SUCCESS-CLOSED | SUCCESS | ACC-ACT-SYNC-SCHOOL | the actor meets the entry conditions for Sync a Versioned School Directory Snapshot | the actor requests Sync a Versioned School Directory Snapshot | Sync a Versioned School Directory Snapshot returns the accepted task-specific result | CLOSED | ALLOW |  |
| ACC-ACT-SYNC-SCHOOL-SCN-PERMISSION_DENIED | FAILURE | ACC-ACT-SYNC-SCHOOL | PERMISSION_DENIED applies to Sync a Versioned School Directory Snapshot | the actor requests Sync a Versioned School Directory Snapshot | Sync a Versioned School Directory Snapshot returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-SYNC-SCHOOL-SCN-VALIDATION_FAILED | FAILURE | ACC-ACT-SYNC-SCHOOL | VALIDATION_FAILED applies to Sync a Versioned School Directory Snapshot | the actor requests Sync a Versioned School Directory Snapshot | Sync a Versioned School Directory Snapshot returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| ACC-ACT-SYNC-SCHOOL-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-SYNC-SCHOOL | VERSION_CONFLICT applies to Sync a Versioned School Directory Snapshot | the actor requests Sync a Versioned School Directory Snapshot | Sync a Versioned School Directory Snapshot returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-SYNC-SCHOOL-SCN-AUDIT_FAILED | FAILURE | ACC-ACT-SYNC-SCHOOL | AUDIT_FAILED applies to Sync a Versioned School Directory Snapshot | the actor requests Sync a Versioned School Directory Snapshot | Sync a Versioned School Directory Snapshot returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| ACC-ACT-SYNC-IDENTITY-SCN-SUCCESS-PENDING | SUCCESS | ACC-ACT-SYNC-IDENTITY | the actor meets the entry conditions for Sync a Versioned Work Identity Snapshot | the actor requests Sync a Versioned Work Identity Snapshot | Sync a Versioned Work Identity Snapshot returns the accepted task-specific result | PENDING | ALLOW |  |
| ACC-ACT-SYNC-IDENTITY-SCN-SUCCESS-EFFECTIVE | SUCCESS | ACC-ACT-SYNC-IDENTITY | the actor meets the entry conditions for Sync a Versioned Work Identity Snapshot | the actor requests Sync a Versioned Work Identity Snapshot | Sync a Versioned Work Identity Snapshot returns the accepted task-specific result | EFFECTIVE | ALLOW |  |
| ACC-ACT-SYNC-IDENTITY-SCN-SUCCESS-EXPIRED | SUCCESS | ACC-ACT-SYNC-IDENTITY | the actor meets the entry conditions for Sync a Versioned Work Identity Snapshot | the actor requests Sync a Versioned Work Identity Snapshot | Sync a Versioned Work Identity Snapshot returns the accepted task-specific result | EXPIRED | ALLOW |  |
| ACC-ACT-SYNC-IDENTITY-SCN-SUCCESS-REVOKED | SUCCESS | ACC-ACT-SYNC-IDENTITY | the actor meets the entry conditions for Sync a Versioned Work Identity Snapshot | the actor requests Sync a Versioned Work Identity Snapshot | Sync a Versioned Work Identity Snapshot returns the accepted task-specific result | REVOKED | ALLOW |  |
| ACC-ACT-SYNC-IDENTITY-SCN-PERMISSION_DENIED | FAILURE | ACC-ACT-SYNC-IDENTITY | PERMISSION_DENIED applies to Sync a Versioned Work Identity Snapshot | the actor requests Sync a Versioned Work Identity Snapshot | Sync a Versioned Work Identity Snapshot returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-SYNC-IDENTITY-SCN-VALIDATION_FAILED | FAILURE | ACC-ACT-SYNC-IDENTITY | VALIDATION_FAILED applies to Sync a Versioned Work Identity Snapshot | the actor requests Sync a Versioned Work Identity Snapshot | Sync a Versioned Work Identity Snapshot returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| ACC-ACT-SYNC-IDENTITY-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-SYNC-IDENTITY | VERSION_CONFLICT applies to Sync a Versioned Work Identity Snapshot | the actor requests Sync a Versioned Work Identity Snapshot | Sync a Versioned Work Identity Snapshot returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-SYNC-IDENTITY-SCN-AUDIT_FAILED | FAILURE | ACC-ACT-SYNC-IDENTITY | AUDIT_FAILED applies to Sync a Versioned Work Identity Snapshot | the actor requests Sync a Versioned Work Identity Snapshot | Sync a Versioned Work Identity Snapshot returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| ACC-ACT-SEARCH-SCHOOL-SCN-SUCCESS | SUCCESS | ACC-ACT-SEARCH-SCHOOL | the actor meets the entry conditions for Search Authorized School Before Entry | the actor requests Search Authorized School Before Entry | school first search returns authorized schools and never auto-enters a recent school | UNCHANGED | ALLOW |  |
| ACC-ACT-SEARCH-SCHOOL-SCN-PERMISSION_DENIED | BOUNDARY | ACC-ACT-SEARCH-SCHOOL | PERMISSION_DENIED applies to Search Authorized School Before Entry | the actor requests Search Authorized School Before Entry | no auto entry occurs when no authorized school matches | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-SEARCH-SCHOOL-SCN-VALIDATION_FAILED | FAILURE | ACC-ACT-SEARCH-SCHOOL | VALIDATION_FAILED applies to Search Authorized School Before Entry | the actor requests Search Authorized School Before Entry | Search Authorized School Before Entry returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| ACC-ACT-SEARCH-SCHOOL-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-SEARCH-SCHOOL | VERSION_CONFLICT applies to Search Authorized School Before Entry | the actor requests Search Authorized School Before Entry | Search Authorized School Before Entry returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-SELECT-SCHOOL-SCN-SUCCESS | SUCCESS | ACC-ACT-SELECT-SCHOOL | the actor meets the entry conditions for Select School for Account Entry | the actor requests Select School for Account Entry | the selected school becomes the explicit login boundary without auto-entering it | UNCHANGED | ALLOW |  |
| ACC-ACT-SELECT-SCHOOL-SCN-PERMISSION_DENIED | FAILURE | ACC-ACT-SELECT-SCHOOL | PERMISSION_DENIED applies to Select School for Account Entry | the actor requests Select School for Account Entry | Select School for Account Entry returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-SELECT-SCHOOL-SCN-VALIDATION_FAILED | FAILURE | ACC-ACT-SELECT-SCHOOL | VALIDATION_FAILED applies to Select School for Account Entry | the actor requests Select School for Account Entry | Select School for Account Entry returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| ACC-ACT-SELECT-SCHOOL-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-SELECT-SCHOOL | VERSION_CONFLICT applies to Select School for Account Entry | the actor requests Select School for Account Entry | Select School for Account Entry returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-LOGIN-SCN-SUCCESS | SUCCESS | ACC-ACT-LOGIN | the actor meets the entry conditions for Authenticate Account in Selected School | the actor requests Authenticate Account in Selected School | the selected school and account membership are authenticated on Web or App | UNCHANGED | ALLOW |  |
| ACC-ACT-LOGIN-SCN-PERMISSION_DENIED | FAILURE | ACC-ACT-LOGIN | PERMISSION_DENIED applies to Authenticate Account in Selected School | the actor requests Authenticate Account in Selected School | login is denied without an explicitly selected school or active membership | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-LOGIN-SCN-VALIDATION_FAILED | FAILURE | ACC-ACT-LOGIN | VALIDATION_FAILED applies to Authenticate Account in Selected School | the actor requests Authenticate Account in Selected School | Authenticate Account in Selected School returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| ACC-ACT-LOGIN-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-LOGIN | VERSION_CONFLICT applies to Authenticate Account in Selected School | the actor requests Authenticate Account in Selected School | Authenticate Account in Selected School returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-FIRST-ACTIVATION-SCN-SUCCESS | SUCCESS | ACC-ACT-FIRST-ACTIVATION | the actor meets the entry conditions for Complete First Account Activation | the actor requests Complete First Account Activation | Complete First Account Activation returns the accepted task-specific result | ACTIVE | ALLOW |  |
| ACC-ACT-FIRST-ACTIVATION-SCN-PERMISSION_DENIED | FAILURE | ACC-ACT-FIRST-ACTIVATION | PERMISSION_DENIED applies to Complete First Account Activation | the actor requests Complete First Account Activation | Complete First Account Activation returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-FIRST-ACTIVATION-SCN-VALIDATION_FAILED | FAILURE | ACC-ACT-FIRST-ACTIVATION | VALIDATION_FAILED applies to Complete First Account Activation | the actor requests Complete First Account Activation | Complete First Account Activation returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| ACC-ACT-FIRST-ACTIVATION-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-FIRST-ACTIVATION | VERSION_CONFLICT applies to Complete First Account Activation | the actor requests Complete First Account Activation | Complete First Account Activation returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-SUSPEND-MEMBERSHIP-SCN-SUCCESS | SUCCESS | ACC-ACT-SUSPEND-MEMBERSHIP | the actor meets the entry conditions for Suspend an Active School Membership | the actor requests Suspend an Active School Membership | Suspend an Active School Membership returns the accepted task-specific result | SUSPENDED | ALLOW |  |
| ACC-ACT-SUSPEND-MEMBERSHIP-SCN-PERMISSION_DENIED | FAILURE | ACC-ACT-SUSPEND-MEMBERSHIP | PERMISSION_DENIED applies to Suspend an Active School Membership | the actor requests Suspend an Active School Membership | Suspend an Active School Membership returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-SUSPEND-MEMBERSHIP-SCN-VALIDATION_FAILED | FAILURE | ACC-ACT-SUSPEND-MEMBERSHIP | VALIDATION_FAILED applies to Suspend an Active School Membership | the actor requests Suspend an Active School Membership | Suspend an Active School Membership returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| ACC-ACT-SUSPEND-MEMBERSHIP-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-SUSPEND-MEMBERSHIP | VERSION_CONFLICT applies to Suspend an Active School Membership | the actor requests Suspend an Active School Membership | Suspend an Active School Membership returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-SUSPEND-MEMBERSHIP-SCN-AUDIT_FAILED | FAILURE | ACC-ACT-SUSPEND-MEMBERSHIP | AUDIT_FAILED applies to Suspend an Active School Membership | the actor requests Suspend an Active School Membership | Suspend an Active School Membership returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| ACC-ACT-DEACTIVATE-MEMBERSHIP-SCN-SUCCESS | SUCCESS | ACC-ACT-DEACTIVATE-MEMBERSHIP | the actor meets the entry conditions for Deactivate a School Membership | the actor requests Deactivate a School Membership | Deactivate a School Membership returns the accepted task-specific result | DEACTIVATED | ALLOW |  |
| ACC-ACT-DEACTIVATE-MEMBERSHIP-SCN-PERMISSION_DENIED | FAILURE | ACC-ACT-DEACTIVATE-MEMBERSHIP | PERMISSION_DENIED applies to Deactivate a School Membership | the actor requests Deactivate a School Membership | Deactivate a School Membership returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-DEACTIVATE-MEMBERSHIP-SCN-VALIDATION_FAILED | FAILURE | ACC-ACT-DEACTIVATE-MEMBERSHIP | VALIDATION_FAILED applies to Deactivate a School Membership | the actor requests Deactivate a School Membership | Deactivate a School Membership returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| ACC-ACT-DEACTIVATE-MEMBERSHIP-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-DEACTIVATE-MEMBERSHIP | VERSION_CONFLICT applies to Deactivate a School Membership | the actor requests Deactivate a School Membership | Deactivate a School Membership returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-DEACTIVATE-MEMBERSHIP-SCN-AUDIT_FAILED | FAILURE | ACC-ACT-DEACTIVATE-MEMBERSHIP | AUDIT_FAILED applies to Deactivate a School Membership | the actor requests Deactivate a School Membership | Deactivate a School Membership returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| ACC-ACT-SELECT-IDENTITY-SCN-SUCCESS | SUCCESS | ACC-ACT-SELECT-IDENTITY | the actor meets the entry conditions for Select Effective Work Identity | the actor requests Select Effective Work Identity | Select Effective Work Identity returns the accepted task-specific result | UNCHANGED | ALLOW |  |
| ACC-ACT-SELECT-IDENTITY-SCN-PERMISSION_DENIED | FAILURE | ACC-ACT-SELECT-IDENTITY | PERMISSION_DENIED applies to Select Effective Work Identity | the actor requests Select Effective Work Identity | Select Effective Work Identity returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-SELECT-IDENTITY-SCN-VALIDATION_FAILED | FAILURE | ACC-ACT-SELECT-IDENTITY | VALIDATION_FAILED applies to Select Effective Work Identity | the actor requests Select Effective Work Identity | Select Effective Work Identity returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| ACC-ACT-SELECT-IDENTITY-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-SELECT-IDENTITY | VERSION_CONFLICT applies to Select Effective Work Identity | the actor requests Select Effective Work Identity | Select Effective Work Identity returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-SELECT-TERM-SCN-SUCCESS-ACTIVE | SUCCESS | ACC-ACT-SELECT-TERM | the actor meets the entry conditions for Select Current or Historical Term | the actor requests Select Current or Historical Term | current term creates a writable context; historical term creates a read-only context | ACTIVE | ALLOW |  |
| ACC-ACT-SELECT-TERM-SCN-SUCCESS-READ_ONLY | SUCCESS | ACC-ACT-SELECT-TERM | the actor meets the entry conditions for Select Current or Historical Term | the actor requests Select Current or Historical Term | current term creates a writable context; historical term creates a read-only context | READ_ONLY | ALLOW |  |
| ACC-ACT-SELECT-TERM-SCN-PERMISSION_DENIED | FAILURE | ACC-ACT-SELECT-TERM | PERMISSION_DENIED applies to Select Current or Historical Term | the actor requests Select Current or Historical Term | Select Current or Historical Term returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-SELECT-TERM-SCN-VALIDATION_FAILED | FAILURE | ACC-ACT-SELECT-TERM | VALIDATION_FAILED applies to Select Current or Historical Term | the actor requests Select Current or Historical Term | Select Current or Historical Term returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| ACC-ACT-SELECT-TERM-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-SELECT-TERM | VERSION_CONFLICT applies to Select Current or Historical Term | the actor requests Select Current or Historical Term | Select Current or Historical Term returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-SWITCH-CONTEXT-SCN-SUCCESS | SUCCESS | ACC-ACT-SWITCH-CONTEXT | the actor meets the entry conditions for Switch Active School Identity and Term Context | the actor requests Switch Active School Identity and Term Context | the new context becomes active only after school, identity, term, and scope checks | ACTIVE | ALLOW |  |
| ACC-ACT-SWITCH-CONTEXT-SCN-PERMISSION_DENIED | FAILURE | ACC-ACT-SWITCH-CONTEXT | PERMISSION_DENIED applies to Switch Active School Identity and Term Context | the actor requests Switch Active School Identity and Term Context | Switch Active School Identity and Term Context returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-SWITCH-CONTEXT-SCN-VALIDATION_FAILED | BOUNDARY | ACC-ACT-SWITCH-CONTEXT | VALIDATION_FAILED applies to Switch Active School Identity and Term Context | the actor requests Switch Active School Identity and Term Context | a historical-term destination becomes an explicitly read-only context | READ_ONLY | ALLOW | VALIDATION_FAILED |
| ACC-ACT-SWITCH-CONTEXT-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-SWITCH-CONTEXT | VERSION_CONFLICT applies to Switch Active School Identity and Term Context | the actor requests Switch Active School Identity and Term Context | Switch Active School Identity and Term Context returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-EXPIRE-CONTEXT-SCN-SUCCESS | SUCCESS | ACC-ACT-EXPIRE-CONTEXT | the actor meets the entry conditions for Expire Stale Active Work Context | the actor requests Expire Stale Active Work Context | the stale context is expired and all writes require context recovery | EXPIRED | ALLOW |  |
| ACC-ACT-EXPIRE-CONTEXT-SCN-PERMISSION_DENIED | FAILURE | ACC-ACT-EXPIRE-CONTEXT | PERMISSION_DENIED applies to Expire Stale Active Work Context | the actor requests Expire Stale Active Work Context | Expire Stale Active Work Context returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-EXPIRE-CONTEXT-SCN-VALIDATION_FAILED | FAILURE | ACC-ACT-EXPIRE-CONTEXT | VALIDATION_FAILED applies to Expire Stale Active Work Context | the actor requests Expire Stale Active Work Context | Expire Stale Active Work Context returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| ACC-ACT-EXPIRE-CONTEXT-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-EXPIRE-CONTEXT | VERSION_CONFLICT applies to Expire Stale Active Work Context | the actor requests Expire Stale Active Work Context | Expire Stale Active Work Context returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-EXPIRE-CONTEXT-SCN-AUDIT_FAILED | FAILURE | ACC-ACT-EXPIRE-CONTEXT | AUDIT_FAILED applies to Expire Stale Active Work Context | the actor requests Expire Stale Active Work Context | Expire Stale Active Work Context returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| ACC-ACT-INVALIDATE-CONTEXT-SCN-SUCCESS | SUCCESS | ACC-ACT-INVALIDATE-CONTEXT | the actor meets the entry conditions for Invalidate a Context with Stale Source Versions | the actor requests Invalidate a Context with Stale Source Versions | Invalidate a Context with Stale Source Versions returns the accepted task-specific result | INVALIDATED | ALLOW |  |
| ACC-ACT-INVALIDATE-CONTEXT-SCN-PERMISSION_DENIED | FAILURE | ACC-ACT-INVALIDATE-CONTEXT | PERMISSION_DENIED applies to Invalidate a Context with Stale Source Versions | the actor requests Invalidate a Context with Stale Source Versions | Invalidate a Context with Stale Source Versions returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| ACC-ACT-INVALIDATE-CONTEXT-SCN-VALIDATION_FAILED | FAILURE | ACC-ACT-INVALIDATE-CONTEXT | VALIDATION_FAILED applies to Invalidate a Context with Stale Source Versions | the actor requests Invalidate a Context with Stale Source Versions | Invalidate a Context with Stale Source Versions returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| ACC-ACT-INVALIDATE-CONTEXT-SCN-VERSION_CONFLICT | FAILURE | ACC-ACT-INVALIDATE-CONTEXT | VERSION_CONFLICT applies to Invalidate a Context with Stale Source Versions | the actor requests Invalidate a Context with Stale Source Versions | Invalidate a Context with Stale Source Versions returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| ACC-ACT-INVALIDATE-CONTEXT-SCN-AUDIT_FAILED | FAILURE | ACC-ACT-INVALIDATE-CONTEXT | AUDIT_FAILED applies to Invalidate a Context with Stale Source Versions | the actor requests Invalidate a Context with Stale Source Versions | Invalidate a Context with Stale Source Versions returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |

## 10. AI 任务映射

| Task ID | 任务 | 类型 | 目标 Action | 受众 | 确认者 | 预览字段 | 失败行为 |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 11. 研发与测试就绪门禁

- 实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。
- 所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。
- 每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。
- 每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。
- Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。
