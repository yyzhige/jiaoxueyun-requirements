# AUD-001 Audit and sensitive access PRD v2.0

| 属性 | 值 |
| --- | --- |
| 阶段 | 1 |
| 优先级 | P0 |
| 目标 | Append immutable audit facts and gate sensitive access by school authorization, scope, and time. |
| 基线决策 | `BASE-001`、`BASE-007`、`BASE-008` |
| NFR | `NFR-008`、`NFR-009` |
| 进入条件 | audit storage accepts append-only events；sensitive access starts with no default platform-operations student detail |
| 退出条件 | all sensitive sessions are bounded by approved scope and expiry；review outcomes retain immutable source event references |

## 1. 范围与事实边界

- 本模块权威拥有 4 个对象、15 个动作。
- 模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。
- 页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。
- AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。

## 2. 权威对象与字段合同

### AUD-OBJ-EVENT Audit Event

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUDITED_SCHOOL_ACTIVITY | SCHOOL | SYSTEM | SYSTEM | SYSTEM | ROLE-SCHOOL-ADMIN | LIFE-004 | S4 | AUTHORIZED | ACCEPTED / ARCHIVED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-EVENT-F-ID | Audit Event ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-EVENT-F-TIME | Event Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-EVENT-F-ACTOR | Actor ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-EVENT-F-ACTION | Audited Action | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-EVENT-F-SCOPE | Audited Object Scope | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-EVENT-F-RESULT | Audited Result | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-EVENT-F-EVENT-VERSION | Audit Event Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### AUD-OBJ-ACCESS-REQUEST Sensitive Access Request

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACCESS_REQUESTER_AND_SCOPED_DATA | SCHOOL | CURRENT_ACTOR | CURRENT_ACTOR | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | LIFE-004 | S4 | NO_DIRECT_READ | REQUESTED / APPROVED / DENIED / EXPIRED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-REQUEST-F-ID | Sensitive Access Request ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-REQUEST-F-REQUESTER | Access Requester ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-REQUEST-F-SCOPE | Requested Sensitive Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-REQUEST-F-PURPOSE | Sensitive Access Purpose | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-REQUEST-F-EXPIRY | Requested Access Expiry | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-REQUEST-F-APPROVER | School Approver ID | STRING | required before APPROVED；状态=APPROVED | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-REQUEST-F-DECISION-REASON | Sensitive Access Decision Reason | TEXT | required for APPROVED or DENIED；状态=APPROVED/DENIED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-REQUEST-F-RESULT | Access Decision Result | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-REQUEST-F-VERSION | Sensitive Access Request Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### AUD-OBJ-ACCESS-SESSION Sensitive Access Session

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| APPROVED_SENSITIVE_ACCESS | SCHOOL | SYSTEM | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | LIFE-004 | S4 | NO_DIRECT_READ | ACTIVE / EXPIRED / REVOKED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-SESSION-F-ID | Sensitive Session ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-SESSION-F-REQUEST-ID | Approved Request ID | ID | 是 | OBJECT_REF: AUD-OBJ-ACCESS-REQUEST | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-SESSION-F-REQUEST-VERSION | Approved Request Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-SESSION-F-SCOPE | Session Object Scope | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-SESSION-F-START | Session Start | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-SESSION-F-EXPIRY | Session Expiry | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-SESSION-F-AUTHORIZED-OPERATOR-ID | Authorized Session Operator | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-SESSION-F-STATUS | Session Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-SESSION-F-VERSION | Sensitive Access Session Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### AUD-OBJ-REVIEW Audit Review Case

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUDIT_REVIEW_CASE | SCHOOL | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | LIFE-004 | S4 | NO_DIRECT_READ | OPEN / INVESTIGATING / RESOLVED / CLOSED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-REVIEW-F-ID | Review Case ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-REVIEW-F-EVENT-IDS | Related Audit Event IDs | STRING_ARRAY | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-REVIEW-F-REASON | Review Reason | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-REVIEW-F-RESOLUTION | Review Resolution | STRING | required before RESOLVED；状态=RESOLVED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| AUD-REVIEW-F-STATUS | Review Case Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

## 3. 对象关系

| Relationship ID | 源对象 | 关系 | 目标对象 | 基数 | 所有权范围 | 源失效处理 |
| --- | --- | --- | --- | --- | --- | --- |
| AUD-REL-SESSION-REQUEST | AUD-OBJ-ACCESS-SESSION | AUTHORIZED_BY | AUD-OBJ-ACCESS-REQUEST | MANY_TO_ONE | SAME_SCHOOL | expire the active session immediately |
| AUD-REL-REVIEW-EVENT | AUD-OBJ-REVIEW | REVIEWS | AUD-OBJ-EVENT | MANY_TO_MANY | SAME_SCHOOL | immutable accepted events cannot be invalidated; archive preserves references |

## 4. 可执行动作合同

| Action ID | 动作 | 目标对象 | 操作 | 授权边界 | 访问例外 | 输入 Field | 输出 Field | 状态效果 | ALLOW / DENY | 端 / 执行模式 | 风险 | 审计 | 幂等键 | 失败结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-ACT-APPEND-EVENT | Append an Immutable Audit Event | AUD-OBJ-EVENT | CREATE | — | — | AUD-EVENT-F-ACTOR<br>AUD-EVENT-F-ACTION<br>AUD-EVENT-F-SCOPE<br>AUD-EVENT-F-RESULT | AUD-EVENT-F-ID<br>AUD-EVENT-F-TIME<br>AUD-EVENT-F-EVENT-VERSION | CREATE（成功状态由 AUD-ACT-APPEND-EVENT-SCN-SUCCESS 定义） | ALLOW:SYSTEM — system append is mandatory for audited actions<br>DENY:CURRENT_ACTOR — no user may update or delete an accepted immutable audit event | SYSTEM_EVENT | HIGH | ATOMIC_SELF_RECORD | AUD-ACT-APPEND-EVENT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| AUD-ACT-ARCHIVE-EVENT | Archive a Retained Audit Event | AUD-OBJ-EVENT | UPDATE | — | — | AUD-EVENT-F-ID | AUD-EVENT-F-EVENT-VERSION | ACCEPTED → ARCHIVED | ALLOW:SYSTEM — the system archives an audit event only after its retention threshold<br>DENY:CURRENT_ACTOR — a user cannot archive or delete an audit event directly | SYSTEM_EVENT | HIGH | ATOMIC_SELF_RECORD | AUD-ACT-ARCHIVE-EVENT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| AUD-ACT-QUERY-AUDIT | Query Authorized Audit Events | AUD-OBJ-EVENT | READ | — | — | AUD-EVENT-F-SCOPE<br>AUD-EVENT-F-ACTOR<br>AUD-EVENT-F-ACTION | AUD-EVENT-F-ID<br>AUD-EVENT-F-TIME<br>AUD-EVENT-F-RESULT | UNCHANGED | ALLOW:ROLE-SCHOOL-ADMIN — school administrator acts inside school audit scope<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail access and requires school authorization, limited scope and time | WEB | READ | REQUIRED | — | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| AUD-ACT-REQUEST-SENSITIVE | Request Time-limited Sensitive Access | AUD-OBJ-ACCESS-REQUEST | CREATE | — | — | AUD-REQUEST-F-SCOPE<br>AUD-REQUEST-F-PURPOSE<br>AUD-REQUEST-F-EXPIRY | AUD-REQUEST-F-ID<br>AUD-REQUEST-F-REQUESTER<br>AUD-REQUEST-F-RESULT<br>AUD-REQUEST-F-VERSION | CREATE（成功状态由 AUD-ACT-REQUEST-SENSITIVE-SCN-SUCCESS 定义） | ALLOW:ROLE-PLATFORM-OPS — platform operations may request but not self-approve explicitly limited school scope and time<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail access without a school-approved request | WEB / APP | HIGH | REQUIRED | AUD-ACT-REQUEST-SENSITIVE:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-APPROVE-SENSITIVE | Approve Limited Sensitive Access | AUD-OBJ-ACCESS-REQUEST | UPDATE | — | — | AUD-REQUEST-F-ID<br>AUD-REQUEST-F-APPROVER<br>AUD-REQUEST-F-SCOPE<br>AUD-REQUEST-F-EXPIRY<br>AUD-REQUEST-F-DECISION-REASON | AUD-REQUEST-F-RESULT<br>AUD-REQUEST-F-VERSION | REQUESTED → APPROVED | ALLOW:ROLE-SCHOOL-ADMIN — school administrator acts inside school audit scope<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail access and requires school authorization, limited scope and time | WEB | HIGH | REQUIRED | AUD-ACT-APPROVE-SENSITIVE:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-DENY-SENSITIVE | Deny Sensitive Access | AUD-OBJ-ACCESS-REQUEST | UPDATE | — | — | AUD-REQUEST-F-ID<br>AUD-REQUEST-F-APPROVER<br>AUD-REQUEST-F-DECISION-REASON | AUD-REQUEST-F-RESULT<br>AUD-REQUEST-F-VERSION | REQUESTED → DENIED | ALLOW:ROLE-SCHOOL-ADMIN — school administrator acts inside school audit scope<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail access and requires school authorization, limited scope and time | WEB | HIGH | REQUIRED | AUD-ACT-DENY-SENSITIVE:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-EXPIRE-ACCESS-REQUEST | Expire a Sensitive Access Request | AUD-OBJ-ACCESS-REQUEST | UPDATE | — | — | AUD-REQUEST-F-ID<br>AUD-REQUEST-F-EXPIRY | AUD-REQUEST-F-RESULT<br>AUD-REQUEST-F-VERSION | REQUESTED / APPROVED → EXPIRED | ALLOW:SYSTEM — the system expires an unexecutable request at its declared deadline<br>DENY:CURRENT_ACTOR — a user cannot extend a sensitive request without a new approval | SYSTEM_EVENT | HIGH | REQUIRED | AUD-ACT-EXPIRE-ACCESS-REQUEST:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-OPEN-SESSION | Open an Approved Sensitive Access Session | AUD-OBJ-ACCESS-SESSION | CREATE | — | — | AUD-SESSION-F-REQUEST-ID<br>AUD-SESSION-F-REQUEST-VERSION<br>AUD-SESSION-F-SCOPE<br>AUD-SESSION-F-EXPIRY | AUD-SESSION-F-ID<br>AUD-SESSION-F-START<br>AUD-SESSION-F-AUTHORIZED-OPERATOR-ID<br>AUD-SESSION-F-STATUS<br>AUD-SESSION-F-VERSION | CREATE（成功状态由 AUD-ACT-OPEN-SESSION-SCN-SUCCESS 定义） | ALLOW:SYSTEM — system atomically opens only the school-approved scope and time and requires immutable audit<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot widen the approved student-detail scope | SYSTEM_EVENT | HIGH | REQUIRED | AUD-ACT-OPEN-SESSION:school:object:source-version:request-id | PERMISSION_DENIED / SOURCE_VERSION_STALE / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-EXPIRE-SESSION | Expire a Sensitive Access Session | AUD-OBJ-ACCESS-SESSION | UPDATE | — | — | AUD-SESSION-F-EXPIRY | AUD-SESSION-F-STATUS<br>AUD-SESSION-F-VERSION | ACTIVE → EXPIRED | ALLOW:SYSTEM — system expires the session at the approved deadline<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot extend a sensitive session directly | SYSTEM_EVENT | HIGH | REQUIRED | AUD-ACT-EXPIRE-SESSION:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-REVOKE-SESSION | Revoke a Sensitive Access Session | AUD-OBJ-ACCESS-SESSION | UPDATE | — | — | AUD-SESSION-F-ID | AUD-SESSION-F-STATUS<br>AUD-SESSION-F-VERSION | ACTIVE → REVOKED | ALLOW:ROLE-SCHOOL-ADMIN — school administrator acts inside school audit scope<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail access and requires school authorization, limited scope and time | WEB | HIGH | REQUIRED | AUD-ACT-REVOKE-SESSION:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-CREATE-REVIEW | Create an Audit Review Case | AUD-OBJ-REVIEW | CREATE | — | — | AUD-REVIEW-F-EVENT-IDS<br>AUD-REVIEW-F-REASON | AUD-REVIEW-F-ID<br>AUD-REVIEW-F-STATUS | CREATE（成功状态由 AUD-ACT-CREATE-REVIEW-SCN-SUCCESS 定义） | ALLOW:ROLE-SCHOOL-ADMIN — school administrator acts inside school audit scope<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail access and requires school authorization, limited scope and time | WEB | HIGH | REQUIRED | AUD-ACT-CREATE-REVIEW:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-INVESTIGATE-REVIEW | Start an Audit Review Investigation | AUD-OBJ-REVIEW | UPDATE | — | — | AUD-REVIEW-F-ID | AUD-REVIEW-F-STATUS | OPEN → INVESTIGATING | ALLOW:ROLE-SCHOOL-ADMIN — school administrator acts inside school audit scope<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail access and requires school authorization, limited scope and time | WEB | HIGH | REQUIRED | AUD-ACT-INVESTIGATE-REVIEW:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-RESOLVE-REVIEW | Resolve an Audit Review Case | AUD-OBJ-REVIEW | UPDATE | — | — | AUD-REVIEW-F-ID<br>AUD-REVIEW-F-RESOLUTION | AUD-REVIEW-F-STATUS | INVESTIGATING → RESOLVED | ALLOW:ROLE-SCHOOL-ADMIN — school administrator acts inside school audit scope<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail access and requires school authorization, limited scope and time | WEB | HIGH | REQUIRED | AUD-ACT-RESOLVE-REVIEW:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-CLOSE-REVIEW | Close a Resolved Audit Review Case | AUD-OBJ-REVIEW | UPDATE | — | — | AUD-REVIEW-F-ID | AUD-REVIEW-F-STATUS | RESOLVED → CLOSED | ALLOW:ROLE-SCHOOL-ADMIN — school administrator acts inside school audit scope<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail access and requires school authorization, limited scope and time | WEB | HIGH | REQUIRED | AUD-ACT-CLOSE-REVIEW:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| AUD-ACT-EXPORT-SUMMARY | Export an Authorized Audit Summary | AUD-OBJ-REVIEW | UPDATE | — | — | AUD-REVIEW-F-ID<br>AUD-REVIEW-F-EVENT-IDS | AUD-REVIEW-F-RESOLUTION | RESOLVED → RESOLVED | ALLOW:ROLE-SCHOOL-ADMIN — school administrator acts inside school audit scope<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail access and requires school authorization, limited scope and time | WEB | HIGH | REQUIRED | AUD-ACT-EXPORT-SUMMARY:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

## 6. 状态可达性

| Object ID | 状态 | 进入动作 | 离开动作 |
| --- | --- | --- | --- |
| AUD-OBJ-EVENT | ACCEPTED | AUD-ACT-APPEND-EVENT | AUD-ACT-ARCHIVE-EVENT |
| AUD-OBJ-EVENT | ARCHIVED | AUD-ACT-ARCHIVE-EVENT |  |
| AUD-OBJ-ACCESS-REQUEST | REQUESTED | AUD-ACT-REQUEST-SENSITIVE | AUD-ACT-APPROVE-SENSITIVE<br>AUD-ACT-DENY-SENSITIVE<br>AUD-ACT-EXPIRE-ACCESS-REQUEST |
| AUD-OBJ-ACCESS-REQUEST | APPROVED | AUD-ACT-APPROVE-SENSITIVE | AUD-ACT-EXPIRE-ACCESS-REQUEST |
| AUD-OBJ-ACCESS-REQUEST | DENIED | AUD-ACT-DENY-SENSITIVE |  |
| AUD-OBJ-ACCESS-REQUEST | EXPIRED | AUD-ACT-EXPIRE-ACCESS-REQUEST |  |
| AUD-OBJ-ACCESS-SESSION | ACTIVE | AUD-ACT-OPEN-SESSION | AUD-ACT-EXPIRE-SESSION<br>AUD-ACT-REVOKE-SESSION |
| AUD-OBJ-ACCESS-SESSION | EXPIRED | AUD-ACT-EXPIRE-SESSION |  |
| AUD-OBJ-ACCESS-SESSION | REVOKED | AUD-ACT-REVOKE-SESSION |  |
| AUD-OBJ-REVIEW | OPEN | AUD-ACT-CREATE-REVIEW | AUD-ACT-INVESTIGATE-REVIEW |
| AUD-OBJ-REVIEW | INVESTIGATING | AUD-ACT-INVESTIGATE-REVIEW | AUD-ACT-RESOLVE-REVIEW |
| AUD-OBJ-REVIEW | RESOLVED | AUD-ACT-RESOLVE-REVIEW<br>AUD-ACT-EXPORT-SUMMARY | AUD-ACT-CLOSE-REVIEW<br>AUD-ACT-EXPORT-SUMMARY |
| AUD-OBJ-REVIEW | CLOSED | AUD-ACT-CLOSE-REVIEW |  |

## 7. 参与数据流

| Flow ID | 数据流 | 阶段 | 参与模块 | 本模块动作 | 失败与补偿 |
| --- | --- | --- | --- | --- | --- |
| DF-002 | Organization Import and Permission Refresh | 1 | ORG-001 / IAM-001 / AUD-001 | AUD-ACT-APPEND-EVENT<br>AUD-ACT-APPEND-EVENT | OBJECT_ROW_WITH_PARTIAL_SUCCESS_AND_FAILED_ROW_RETRY；{"strategy":"RETRY_FAILED_ROWS_OR_AUDIT_APPEND","maxAttempts":5,"retryableFailureResults":["VERSION_CONFLICT","AUDIT_FAILED"]}；{"strategy":"ROLLBACK_UNAUDITED_PROVISIONAL_ROWS","description":"rollback provisional accepted rows to the pre-import version when outcome audit fails; do not recalculate permissions until the outcome audit succeeds"}；{"strategy":"INVALIDATE_AFFECTED_ORGANIZATION_SCOPES","targets":["permission decisions","active contexts","teacher work views"]} |

## 8. 页面任务合同

| Page ID | 页面 | 端 | 对象 | 字段 | 动作 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-PAGE-SEARCH | Authorized Audit Event Search | WEB | AUD-OBJ-EVENT | AUD-EVENT-F-TIME<br>AUD-EVENT-F-ACTOR<br>AUD-EVENT-F-ACTION<br>AUD-EVENT-F-SCOPE<br>AUD-EVENT-F-RESULT | AUD-ACT-QUERY-AUDIT | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| AUD-PAGE-ACCESS-REQUEST | Time-limited Sensitive Access Request | WEB / APP | AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-REQUESTER<br>AUD-REQUEST-F-SCOPE<br>AUD-REQUEST-F-PURPOSE<br>AUD-REQUEST-F-EXPIRY<br>AUD-REQUEST-F-RESULT | AUD-ACT-REQUEST-SENSITIVE | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| AUD-PAGE-ACCESS-APPROVAL | School Sensitive Access Approval | WEB | AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-SCOPE<br>AUD-REQUEST-F-PURPOSE<br>AUD-REQUEST-F-EXPIRY<br>AUD-REQUEST-F-APPROVER<br>AUD-REQUEST-F-DECISION-REASON<br>AUD-REQUEST-F-RESULT | AUD-ACT-APPROVE-SENSITIVE<br>AUD-ACT-DENY-SENSITIVE | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| AUD-PAGE-ACTIVE-SESSION | Active Sensitive Access Session | WEB | AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-SCOPE<br>AUD-SESSION-F-START<br>AUD-SESSION-F-EXPIRY<br>AUD-SESSION-F-AUTHORIZED-OPERATOR-ID<br>AUD-SESSION-F-STATUS | AUD-ACT-REVOKE-SESSION | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| AUD-PAGE-REVIEW | Audit Review Case Investigation | WEB | AUD-OBJ-REVIEW | AUD-REVIEW-F-EVENT-IDS<br>AUD-REVIEW-F-REASON<br>AUD-REVIEW-F-RESOLUTION<br>AUD-REVIEW-F-STATUS | AUD-ACT-CREATE-REVIEW<br>AUD-ACT-INVESTIGATE-REVIEW<br>AUD-ACT-RESOLVE-REVIEW<br>AUD-ACT-CLOSE-REVIEW<br>AUD-ACT-EXPORT-SUMMARY | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |

## 9. 验收场景

| Scenario ID | 类型 | Action ID | Given | When | Expected Data | Expected State | Permission | 失败码 / 谓词 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-ACT-APPEND-EVENT-SCN-SUCCESS | SUCCESS | AUD-ACT-APPEND-EVENT | the actor meets the entry conditions for Append an Immutable Audit Event | the actor requests Append an Immutable Audit Event | immutable audit event is appended before the audited result is final | ACCEPTED | ALLOW |  |
| AUD-ACT-APPEND-EVENT-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-APPEND-EVENT | PERMISSION_DENIED applies to Append an Immutable Audit Event | the actor requests Append an Immutable Audit Event | Append an Immutable Audit Event returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-APPEND-EVENT-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-APPEND-EVENT | VALIDATION_FAILED applies to Append an Immutable Audit Event | the actor requests Append an Immutable Audit Event | Append an Immutable Audit Event returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-APPEND-EVENT-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-APPEND-EVENT | VERSION_CONFLICT applies to Append an Immutable Audit Event | the actor requests Append an Immutable Audit Event | Append an Immutable Audit Event returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-ARCHIVE-EVENT-SCN-SUCCESS | SUCCESS | AUD-ACT-ARCHIVE-EVENT | the actor meets the entry conditions for Archive a Retained Audit Event | the actor requests Archive a Retained Audit Event | Archive a Retained Audit Event returns the accepted task-specific result | ARCHIVED | ALLOW |  |
| AUD-ACT-ARCHIVE-EVENT-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-ARCHIVE-EVENT | PERMISSION_DENIED applies to Archive a Retained Audit Event | the actor requests Archive a Retained Audit Event | Archive a Retained Audit Event returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-ARCHIVE-EVENT-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-ARCHIVE-EVENT | VALIDATION_FAILED applies to Archive a Retained Audit Event | the actor requests Archive a Retained Audit Event | Archive a Retained Audit Event returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-ARCHIVE-EVENT-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-ARCHIVE-EVENT | VERSION_CONFLICT applies to Archive a Retained Audit Event | the actor requests Archive a Retained Audit Event | Archive a Retained Audit Event returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-QUERY-AUDIT-SCN-SUCCESS | SUCCESS | AUD-ACT-QUERY-AUDIT | the actor meets the entry conditions for Query Authorized Audit Events | the actor requests Query Authorized Audit Events | Query Authorized Audit Events returns the accepted task-specific result | UNCHANGED | ALLOW |  |
| AUD-ACT-QUERY-AUDIT-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-QUERY-AUDIT | PERMISSION_DENIED applies to Query Authorized Audit Events | the actor requests Query Authorized Audit Events | Query Authorized Audit Events returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-QUERY-AUDIT-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-QUERY-AUDIT | VALIDATION_FAILED applies to Query Authorized Audit Events | the actor requests Query Authorized Audit Events | Query Authorized Audit Events returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-QUERY-AUDIT-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-QUERY-AUDIT | VERSION_CONFLICT applies to Query Authorized Audit Events | the actor requests Query Authorized Audit Events | Query Authorized Audit Events returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-REQUEST-SENSITIVE-SCN-SUCCESS | SUCCESS | AUD-ACT-REQUEST-SENSITIVE | the actor meets the entry conditions for Request Time-limited Sensitive Access | the actor requests Request Time-limited Sensitive Access | request remains non-executable until school authorization | REQUESTED | ALLOW |  |
| AUD-ACT-REQUEST-SENSITIVE-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-REQUEST-SENSITIVE | PERMISSION_DENIED applies to Request Time-limited Sensitive Access | the actor requests Request Time-limited Sensitive Access | Request Time-limited Sensitive Access returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-REQUEST-SENSITIVE-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-REQUEST-SENSITIVE | VALIDATION_FAILED applies to Request Time-limited Sensitive Access | the actor requests Request Time-limited Sensitive Access | Request Time-limited Sensitive Access returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-REQUEST-SENSITIVE-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-REQUEST-SENSITIVE | VERSION_CONFLICT applies to Request Time-limited Sensitive Access | the actor requests Request Time-limited Sensitive Access | Request Time-limited Sensitive Access returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-REQUEST-SENSITIVE-SCN-AUDIT_FAILED | FAILURE | AUD-ACT-REQUEST-SENSITIVE | AUDIT_FAILED applies to Request Time-limited Sensitive Access | the actor requests Request Time-limited Sensitive Access | Request Time-limited Sensitive Access returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| AUD-ACT-APPROVE-SENSITIVE-SCN-SUCCESS | SUCCESS | AUD-ACT-APPROVE-SENSITIVE | the actor meets the entry conditions for Approve Limited Sensitive Access | the actor requests Approve Limited Sensitive Access | Approve Limited Sensitive Access returns the accepted task-specific result | APPROVED | ALLOW |  |
| AUD-ACT-APPROVE-SENSITIVE-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-APPROVE-SENSITIVE | PERMISSION_DENIED applies to Approve Limited Sensitive Access | the actor requests Approve Limited Sensitive Access | Approve Limited Sensitive Access returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-APPROVE-SENSITIVE-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-APPROVE-SENSITIVE | VALIDATION_FAILED applies to Approve Limited Sensitive Access | the actor requests Approve Limited Sensitive Access | Approve Limited Sensitive Access returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-APPROVE-SENSITIVE-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-APPROVE-SENSITIVE | VERSION_CONFLICT applies to Approve Limited Sensitive Access | the actor requests Approve Limited Sensitive Access | Approve Limited Sensitive Access returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-APPROVE-SENSITIVE-SCN-AUDIT_FAILED | FAILURE | AUD-ACT-APPROVE-SENSITIVE | AUDIT_FAILED applies to Approve Limited Sensitive Access | the actor requests Approve Limited Sensitive Access | Approve Limited Sensitive Access returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| AUD-ACT-DENY-SENSITIVE-SCN-SUCCESS | SUCCESS | AUD-ACT-DENY-SENSITIVE | the actor meets the entry conditions for Deny Sensitive Access | the actor requests Deny Sensitive Access | Deny Sensitive Access returns the accepted task-specific result | DENIED | ALLOW |  |
| AUD-ACT-DENY-SENSITIVE-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-DENY-SENSITIVE | PERMISSION_DENIED applies to Deny Sensitive Access | the actor requests Deny Sensitive Access | Deny Sensitive Access returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-DENY-SENSITIVE-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-DENY-SENSITIVE | VALIDATION_FAILED applies to Deny Sensitive Access | the actor requests Deny Sensitive Access | Deny Sensitive Access returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-DENY-SENSITIVE-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-DENY-SENSITIVE | VERSION_CONFLICT applies to Deny Sensitive Access | the actor requests Deny Sensitive Access | Deny Sensitive Access returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-DENY-SENSITIVE-SCN-AUDIT_FAILED | FAILURE | AUD-ACT-DENY-SENSITIVE | AUDIT_FAILED applies to Deny Sensitive Access | the actor requests Deny Sensitive Access | Deny Sensitive Access returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| AUD-ACT-EXPIRE-ACCESS-REQUEST-SCN-SUCCESS | SUCCESS | AUD-ACT-EXPIRE-ACCESS-REQUEST | the actor meets the entry conditions for Expire a Sensitive Access Request | the actor requests Expire a Sensitive Access Request | Expire a Sensitive Access Request returns the accepted task-specific result | EXPIRED | ALLOW |  |
| AUD-ACT-EXPIRE-ACCESS-REQUEST-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-EXPIRE-ACCESS-REQUEST | PERMISSION_DENIED applies to Expire a Sensitive Access Request | the actor requests Expire a Sensitive Access Request | Expire a Sensitive Access Request returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-EXPIRE-ACCESS-REQUEST-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-EXPIRE-ACCESS-REQUEST | VALIDATION_FAILED applies to Expire a Sensitive Access Request | the actor requests Expire a Sensitive Access Request | Expire a Sensitive Access Request returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-EXPIRE-ACCESS-REQUEST-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-EXPIRE-ACCESS-REQUEST | VERSION_CONFLICT applies to Expire a Sensitive Access Request | the actor requests Expire a Sensitive Access Request | Expire a Sensitive Access Request returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-EXPIRE-ACCESS-REQUEST-SCN-AUDIT_FAILED | FAILURE | AUD-ACT-EXPIRE-ACCESS-REQUEST | AUDIT_FAILED applies to Expire a Sensitive Access Request | the actor requests Expire a Sensitive Access Request | Expire a Sensitive Access Request returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| AUD-ACT-OPEN-SESSION-SCN-SUCCESS | SUCCESS | AUD-ACT-OPEN-SESSION | the actor meets the entry conditions for Open an Approved Sensitive Access Session | the actor requests Open an Approved Sensitive Access Session | Open an Approved Sensitive Access Session returns the accepted task-specific result | ACTIVE | ALLOW |  |
| AUD-ACT-OPEN-SESSION-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-OPEN-SESSION | PERMISSION_DENIED applies to Open an Approved Sensitive Access Session | the actor requests Open an Approved Sensitive Access Session | Open an Approved Sensitive Access Session returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-OPEN-SESSION-SCN-SOURCE_VERSION_STALE | FAILURE | AUD-ACT-OPEN-SESSION | SOURCE_VERSION_STALE applies to Open an Approved Sensitive Access Session | the actor requests Open an Approved Sensitive Access Session | Open an Approved Sensitive Access Session returns SOURCE_VERSION_STALE without hidden writes | UNCHANGED | DENY | SOURCE_VERSION_STALE |
| AUD-ACT-OPEN-SESSION-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-OPEN-SESSION | VALIDATION_FAILED applies to Open an Approved Sensitive Access Session | the actor requests Open an Approved Sensitive Access Session | Open an Approved Sensitive Access Session returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-OPEN-SESSION-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-OPEN-SESSION | VERSION_CONFLICT applies to Open an Approved Sensitive Access Session | the actor requests Open an Approved Sensitive Access Session | Open an Approved Sensitive Access Session returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-OPEN-SESSION-SCN-AUDIT_FAILED | FAILURE | AUD-ACT-OPEN-SESSION | AUDIT_FAILED applies to Open an Approved Sensitive Access Session | the actor requests Open an Approved Sensitive Access Session | Open an Approved Sensitive Access Session returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| AUD-ACT-EXPIRE-SESSION-SCN-SUCCESS | SUCCESS | AUD-ACT-EXPIRE-SESSION | the actor meets the entry conditions for Expire a Sensitive Access Session | the actor requests Expire a Sensitive Access Session | Expire a Sensitive Access Session returns the accepted task-specific result | EXPIRED | ALLOW |  |
| AUD-ACT-EXPIRE-SESSION-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-EXPIRE-SESSION | PERMISSION_DENIED applies to Expire a Sensitive Access Session | the actor requests Expire a Sensitive Access Session | Expire a Sensitive Access Session returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-EXPIRE-SESSION-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-EXPIRE-SESSION | VALIDATION_FAILED applies to Expire a Sensitive Access Session | the actor requests Expire a Sensitive Access Session | Expire a Sensitive Access Session returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-EXPIRE-SESSION-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-EXPIRE-SESSION | VERSION_CONFLICT applies to Expire a Sensitive Access Session | the actor requests Expire a Sensitive Access Session | Expire a Sensitive Access Session returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-EXPIRE-SESSION-SCN-AUDIT_FAILED | FAILURE | AUD-ACT-EXPIRE-SESSION | AUDIT_FAILED applies to Expire a Sensitive Access Session | the actor requests Expire a Sensitive Access Session | Expire a Sensitive Access Session returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| AUD-ACT-REVOKE-SESSION-SCN-SUCCESS | SUCCESS | AUD-ACT-REVOKE-SESSION | the actor meets the entry conditions for Revoke a Sensitive Access Session | the actor requests Revoke a Sensitive Access Session | Revoke a Sensitive Access Session returns the accepted task-specific result | REVOKED | ALLOW |  |
| AUD-ACT-REVOKE-SESSION-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-REVOKE-SESSION | PERMISSION_DENIED applies to Revoke a Sensitive Access Session | the actor requests Revoke a Sensitive Access Session | Revoke a Sensitive Access Session returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-REVOKE-SESSION-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-REVOKE-SESSION | VALIDATION_FAILED applies to Revoke a Sensitive Access Session | the actor requests Revoke a Sensitive Access Session | Revoke a Sensitive Access Session returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-REVOKE-SESSION-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-REVOKE-SESSION | VERSION_CONFLICT applies to Revoke a Sensitive Access Session | the actor requests Revoke a Sensitive Access Session | Revoke a Sensitive Access Session returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-REVOKE-SESSION-SCN-AUDIT_FAILED | FAILURE | AUD-ACT-REVOKE-SESSION | AUDIT_FAILED applies to Revoke a Sensitive Access Session | the actor requests Revoke a Sensitive Access Session | Revoke a Sensitive Access Session returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| AUD-ACT-CREATE-REVIEW-SCN-SUCCESS | SUCCESS | AUD-ACT-CREATE-REVIEW | the actor meets the entry conditions for Create an Audit Review Case | the actor requests Create an Audit Review Case | Create an Audit Review Case returns the accepted task-specific result | OPEN | ALLOW |  |
| AUD-ACT-CREATE-REVIEW-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-CREATE-REVIEW | PERMISSION_DENIED applies to Create an Audit Review Case | the actor requests Create an Audit Review Case | Create an Audit Review Case returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-CREATE-REVIEW-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-CREATE-REVIEW | VALIDATION_FAILED applies to Create an Audit Review Case | the actor requests Create an Audit Review Case | Create an Audit Review Case returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-CREATE-REVIEW-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-CREATE-REVIEW | VERSION_CONFLICT applies to Create an Audit Review Case | the actor requests Create an Audit Review Case | Create an Audit Review Case returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-CREATE-REVIEW-SCN-AUDIT_FAILED | FAILURE | AUD-ACT-CREATE-REVIEW | AUDIT_FAILED applies to Create an Audit Review Case | the actor requests Create an Audit Review Case | Create an Audit Review Case returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| AUD-ACT-INVESTIGATE-REVIEW-SCN-SUCCESS | SUCCESS | AUD-ACT-INVESTIGATE-REVIEW | the actor meets the entry conditions for Start an Audit Review Investigation | the actor requests Start an Audit Review Investigation | Start an Audit Review Investigation returns the accepted task-specific result | INVESTIGATING | ALLOW |  |
| AUD-ACT-INVESTIGATE-REVIEW-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-INVESTIGATE-REVIEW | PERMISSION_DENIED applies to Start an Audit Review Investigation | the actor requests Start an Audit Review Investigation | Start an Audit Review Investigation returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-INVESTIGATE-REVIEW-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-INVESTIGATE-REVIEW | VALIDATION_FAILED applies to Start an Audit Review Investigation | the actor requests Start an Audit Review Investigation | Start an Audit Review Investigation returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-INVESTIGATE-REVIEW-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-INVESTIGATE-REVIEW | VERSION_CONFLICT applies to Start an Audit Review Investigation | the actor requests Start an Audit Review Investigation | Start an Audit Review Investigation returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-INVESTIGATE-REVIEW-SCN-AUDIT_FAILED | FAILURE | AUD-ACT-INVESTIGATE-REVIEW | AUDIT_FAILED applies to Start an Audit Review Investigation | the actor requests Start an Audit Review Investigation | Start an Audit Review Investigation returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| AUD-ACT-RESOLVE-REVIEW-SCN-SUCCESS | SUCCESS | AUD-ACT-RESOLVE-REVIEW | the actor meets the entry conditions for Resolve an Audit Review Case | the actor requests Resolve an Audit Review Case | Resolve an Audit Review Case returns the accepted task-specific result | RESOLVED | ALLOW |  |
| AUD-ACT-RESOLVE-REVIEW-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-RESOLVE-REVIEW | PERMISSION_DENIED applies to Resolve an Audit Review Case | the actor requests Resolve an Audit Review Case | Resolve an Audit Review Case returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-RESOLVE-REVIEW-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-RESOLVE-REVIEW | VALIDATION_FAILED applies to Resolve an Audit Review Case | the actor requests Resolve an Audit Review Case | Resolve an Audit Review Case returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-RESOLVE-REVIEW-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-RESOLVE-REVIEW | VERSION_CONFLICT applies to Resolve an Audit Review Case | the actor requests Resolve an Audit Review Case | Resolve an Audit Review Case returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-RESOLVE-REVIEW-SCN-AUDIT_FAILED | FAILURE | AUD-ACT-RESOLVE-REVIEW | AUDIT_FAILED applies to Resolve an Audit Review Case | the actor requests Resolve an Audit Review Case | Resolve an Audit Review Case returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| AUD-ACT-CLOSE-REVIEW-SCN-SUCCESS | SUCCESS | AUD-ACT-CLOSE-REVIEW | the actor meets the entry conditions for Close a Resolved Audit Review Case | the actor requests Close a Resolved Audit Review Case | Close a Resolved Audit Review Case returns the accepted task-specific result | CLOSED | ALLOW |  |
| AUD-ACT-CLOSE-REVIEW-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-CLOSE-REVIEW | PERMISSION_DENIED applies to Close a Resolved Audit Review Case | the actor requests Close a Resolved Audit Review Case | Close a Resolved Audit Review Case returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-CLOSE-REVIEW-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-CLOSE-REVIEW | VALIDATION_FAILED applies to Close a Resolved Audit Review Case | the actor requests Close a Resolved Audit Review Case | Close a Resolved Audit Review Case returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-CLOSE-REVIEW-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-CLOSE-REVIEW | VERSION_CONFLICT applies to Close a Resolved Audit Review Case | the actor requests Close a Resolved Audit Review Case | Close a Resolved Audit Review Case returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-CLOSE-REVIEW-SCN-AUDIT_FAILED | FAILURE | AUD-ACT-CLOSE-REVIEW | AUDIT_FAILED applies to Close a Resolved Audit Review Case | the actor requests Close a Resolved Audit Review Case | Close a Resolved Audit Review Case returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| AUD-ACT-EXPORT-SUMMARY-SCN-SUCCESS | SUCCESS | AUD-ACT-EXPORT-SUMMARY | the actor meets the entry conditions for Export an Authorized Audit Summary | the actor requests Export an Authorized Audit Summary | summary excludes unauthorized student detail and retains immutable source event references | RESOLVED | ALLOW |  |
| AUD-ACT-EXPORT-SUMMARY-SCN-PERMISSION_DENIED | FAILURE | AUD-ACT-EXPORT-SUMMARY | PERMISSION_DENIED applies to Export an Authorized Audit Summary | the actor requests Export an Authorized Audit Summary | Export an Authorized Audit Summary returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| AUD-ACT-EXPORT-SUMMARY-SCN-VALIDATION_FAILED | FAILURE | AUD-ACT-EXPORT-SUMMARY | VALIDATION_FAILED applies to Export an Authorized Audit Summary | the actor requests Export an Authorized Audit Summary | Export an Authorized Audit Summary returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| AUD-ACT-EXPORT-SUMMARY-SCN-VERSION_CONFLICT | FAILURE | AUD-ACT-EXPORT-SUMMARY | VERSION_CONFLICT applies to Export an Authorized Audit Summary | the actor requests Export an Authorized Audit Summary | Export an Authorized Audit Summary returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| AUD-ACT-EXPORT-SUMMARY-SCN-AUDIT_FAILED | FAILURE | AUD-ACT-EXPORT-SUMMARY | AUDIT_FAILED applies to Export an Authorized Audit Summary | the actor requests Export an Authorized Audit Summary | Export an Authorized Audit Summary returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |

## 10. AI 任务映射

| Task ID | 任务 | 类型 | 目标 Action | 受众 | 确认者 | 预览字段 | 失败行为 |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 11. 研发与测试就绪门禁

- 实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。
- 所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。
- 每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。
- 每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。
- Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。
