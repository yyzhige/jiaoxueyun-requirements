# DGV-001 Governance, lifecycle, and AI data use PRD v2.0

| 属性 | 值 |
| --- | --- |
| 阶段 | 1 |
| 优先级 | P0 |
| 目标 | Make school-owned retention, sensitive export, and AI data-use decisions explicit and auditable. |
| 基线决策 | `BASE-001`、`BASE-006` |
| NFR | `NFR-008`、`NFR-009` |
| 进入条件 | the school administrator controls activation governance；data categories and sensitivities are registered |
| 退出条件 | retention periods have explicit school-owned values；sensitive export and AI use remain blocked while retention is unset |

## 1. 范围与事实边界

- 本模块权威拥有 4 个对象、14 个动作。
- 模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。
- 页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。
- AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。

## 2. 权威对象与字段合同

### DGV-OBJ-POLICY Data Governance Policy

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCHOOL_DATA_GOVERNANCE | SCHOOL | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | LIFE-001 | S4 | AUTHORIZED | DRAFT / ACTIVE / SUPERSEDED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-POLICY-F-ID | Governance Policy ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-POLICY-F-SOURCE-REF | Governance Policy Source Reference | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-POLICY-F-SOURCE-VERSION | Governance Policy Source Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-POLICY-F-SCHOOL-ID | Governed School ID | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-POLICY-F-VERSION | Governance Policy Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-POLICY-F-EXPLANATION | Data Use Explanation | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### DGV-OBJ-RETENTION Data Retention Rule

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCHOOL_RETENTION_CONFIGURATION | SCHOOL | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | LIFE-001 | S4 | NO_DIRECT_READ | UNSET / ACTIVE / SUPERSEDED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-RETENTION-F-ID | Retention Rule ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-RETENTION-F-CATEGORY | Data Category | STRING | 是 | OPTION_SET: OPT-ENUM-044 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-RETENTION-F-PERIOD | School-owned Retention Period | DURATION | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-RETENTION-F-ACTIVATED-BY | Activated By School Administrator | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-RETENTION-F-STATUS | Retention Configuration Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### DGV-OBJ-AI-RULE AI Data Use Rule

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCHOOL_AI_DATA_USE | SCHOOL | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | LIFE-001 | S4 | NO_DIRECT_READ | BLOCKED_UNSET_RETENTION / ACTIVE / DISABLED / SUPERSEDED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-AI-F-ID | AI Data Use Rule ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-AI-F-DATA-SCOPE | Allowed AI Data Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-AI-F-PURPOSE | Allowed AI Purpose | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-AI-F-MODEL-USE | Model Training Use | STRING | 是 | OPTION_SET: OPT-ENUM-045 | EDITABLE | AUTHORIZED_SCOPE | — | must explicitly deny model training unless separately approved | retain accepted values with source and version metadata |
| DGV-AI-F-STATUS | AI Data Use Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

### DGV-OBJ-EXPORT Export Request

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXPORT_REQUESTER_AND_SCOPED_DATA | SCHOOL | CURRENT_ACTOR | CURRENT_ACTOR | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | LIFE-008 | S4 | NO_DIRECT_READ | REQUESTED / APPROVED / DENIED / GENERATING / AVAILABLE / EXPIRED / FAILED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-EXPORT-F-ID | Export Request ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-EXPORT-F-SCOPE | Export Object Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-EXPORT-F-PURPOSE | Export Purpose | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-EXPORT-F-APPROVER | Export Approver ID | STRING | required before APPROVED；状态=APPROVED | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-EXPORT-F-DECISION-REASON | Export Decision Reason | TEXT | required for APPROVED or DENIED；状态=APPROVED/DENIED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-EXPORT-F-EXPIRY | Export File Expiry | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-EXPORT-F-RESULT | Export Result | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |
| DGV-EXPORT-F-AUDIT-REF | Export Audit Reference | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared data type and authorized object scope | retain accepted values with source and version metadata |

## 3. 对象关系

| Relationship ID | 源对象 | 关系 | 目标对象 | 基数 | 所有权范围 | 源失效处理 |
| --- | --- | --- | --- | --- | --- | --- |
| DGV-REL-RETENTION-POLICY | DGV-OBJ-RETENTION | IMPLEMENTS | DGV-OBJ-POLICY | MANY_TO_ONE | SAME_SCHOOL | block sensitive use until the new governance version is activated |
| DGV-REL-AI-RETENTION | DGV-OBJ-AI-RULE | REQUIRES | DGV-OBJ-RETENTION | MANY_TO_ONE | SAME_SCHOOL | disable AI data use immediately |
| DGV-REL-EXPORT-POLICY | DGV-OBJ-EXPORT | AUTHORIZED_BY | DGV-OBJ-POLICY | MANY_TO_ONE | SAME_SCHOOL | deny ungenerated requests and preserve completed request audit facts |

## 4. 可执行动作合同

| Action ID | 动作 | 目标对象 | 操作 | 访问例外 | 输入 Field | 输出 Field | 状态效果 | ALLOW / DENY | 端 / 执行模式 | 风险 | 审计 | 幂等键 | 失败结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-SYNC-POLICY | Sync a Versioned Data Governance Policy Snapshot | DGV-OBJ-POLICY | CREATE | — | DGV-POLICY-F-SOURCE-REF<br>DGV-POLICY-F-SOURCE-VERSION<br>DGV-POLICY-F-SCHOOL-ID<br>DGV-POLICY-F-EXPLANATION | DGV-POLICY-F-ID<br>DGV-POLICY-F-SOURCE-REF<br>DGV-POLICY-F-SOURCE-VERSION<br>DGV-POLICY-F-VERSION | CREATE（成功状态由  定义） | ALLOW:SYSTEM — the system accepts only a registered versioned school-governance snapshot<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot synthesize or replace a school-governance snapshot | SYSTEM_EVENT | HIGH | REQUIRED | DGV-ACT-SYNC-POLICY:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-VIEW-EXPLANATION | View School Data Use Explanation | DGV-OBJ-POLICY | READ | — | DGV-POLICY-F-SCHOOL-ID | DGV-POLICY-F-EXPLANATION<br>DGV-POLICY-F-VERSION | UNCHANGED | ALLOW:CURRENT_ACTOR — school members may view the active school explanation<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot view student-detail governance data without school authorization | WEB / APP | READ | NOT_REQUIRED | — | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| DGV-ACT-CONFIGURE-RETENTION | Configure School Activation Retention Periods | DGV-OBJ-RETENTION | UPDATE | — | DGV-RETENTION-F-CATEGORY<br>DGV-RETENTION-F-PERIOD | DGV-RETENTION-F-ACTIVATED-BY<br>DGV-RETENTION-F-STATUS | UNSET → ACTIVE | ALLOW:ROLE-SCHOOL-ADMIN — school administrator owns activation governance and explicit export authorization<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail export or AI use access without school authorization | WEB | HIGH | REQUIRED | DGV-ACT-CONFIGURE-RETENTION:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-SUPERSEDE-RETENTION | Supersede an Active Retention Configuration | DGV-OBJ-RETENTION | UPDATE | — | DGV-RETENTION-F-CATEGORY | DGV-RETENTION-F-STATUS | ACTIVE → SUPERSEDED | ALLOW:ROLE-SCHOOL-ADMIN — school administrator owns activation governance and explicit export authorization<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail export or AI use access without school authorization | WEB | HIGH | REQUIRED | DGV-ACT-SUPERSEDE-RETENTION:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-CONFIGURE-AI-USE | Configure AI Data Use Boundary | DGV-OBJ-AI-RULE | UPDATE | — | DGV-AI-F-DATA-SCOPE<br>DGV-AI-F-PURPOSE<br>DGV-AI-F-MODEL-USE | DGV-AI-F-STATUS | BLOCKED_UNSET_RETENTION → ACTIVE | ALLOW:ROLE-SCHOOL-ADMIN — school administrator owns activation governance and explicit export authorization<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail export or AI use access without school authorization | WEB | HIGH | REQUIRED | DGV-ACT-CONFIGURE-AI-USE:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-DISABLE-AI-USE | Disable an Active AI Data Use Rule | DGV-OBJ-AI-RULE | UPDATE | — | DGV-AI-F-ID | DGV-AI-F-STATUS | ACTIVE → DISABLED | ALLOW:ROLE-SCHOOL-ADMIN — school administrator owns activation governance and explicit export authorization<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail export or AI use access without school authorization | WEB | HIGH | REQUIRED | DGV-ACT-DISABLE-AI-USE:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-SUPERSEDE-AI-RULE | Supersede an AI Data Use Rule | DGV-OBJ-AI-RULE | UPDATE | — | DGV-AI-F-ID | DGV-AI-F-STATUS | ACTIVE / DISABLED → SUPERSEDED | ALLOW:ROLE-SCHOOL-ADMIN — school administrator owns activation governance and explicit export authorization<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail export or AI use access without school authorization | WEB | HIGH | REQUIRED | DGV-ACT-SUPERSEDE-AI-RULE:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-REQUEST-EXPORT | Request a Purpose-bound Data Export | DGV-OBJ-EXPORT | CREATE | — | DGV-EXPORT-F-SCOPE<br>DGV-EXPORT-F-PURPOSE<br>DGV-EXPORT-F-EXPIRY | DGV-EXPORT-F-ID<br>DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF | CREATE（成功状态由 DGV-ACT-REQUEST-EXPORT-SCN-SUCCESS 定义） | ALLOW:CURRENT_ACTOR — requester may request only an authorized school object scope and purpose<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot request student-detail export by default | WEB | HIGH | REQUIRED | DGV-ACT-REQUEST-EXPORT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-APPROVE-EXPORT | Approve a Sensitive Export Request | DGV-OBJ-EXPORT | UPDATE | — | DGV-EXPORT-F-ID<br>DGV-EXPORT-F-APPROVER<br>DGV-EXPORT-F-DECISION-REASON | DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF | REQUESTED → APPROVED | ALLOW:ROLE-SCHOOL-ADMIN — school administrator owns activation governance and explicit export authorization<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail export or AI use access without school authorization | WEB | HIGH | REQUIRED | DGV-ACT-APPROVE-EXPORT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-DENY-EXPORT | Deny a Sensitive Export Request | DGV-OBJ-EXPORT | UPDATE | — | DGV-EXPORT-F-ID<br>DGV-EXPORT-F-APPROVER<br>DGV-EXPORT-F-DECISION-REASON | DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF | REQUESTED → DENIED | ALLOW:ROLE-SCHOOL-ADMIN — school administrator owns activation governance and explicit export authorization<br>DENY:ROLE-PLATFORM-OPS — platform operations has no default student-detail export or AI use access without school authorization | WEB | HIGH | REQUIRED | DGV-ACT-DENY-EXPORT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-GENERATE-EXPORT | Start an Approved Expiring Export | DGV-OBJ-EXPORT | UPDATE | — | DGV-EXPORT-F-ID<br>DGV-EXPORT-F-SCOPE<br>DGV-EXPORT-F-EXPIRY | DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF | APPROVED → GENERATING | ALLOW:SYSTEM — system generates only the approved immutable scope and expiry<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot expand or regenerate student detail outside approval | SYSTEM_EVENT | HIGH | REQUIRED | DGV-ACT-GENERATE-EXPORT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-COMPLETE-EXPORT | Complete an Expiring Export | DGV-OBJ-EXPORT | UPDATE | — | DGV-EXPORT-F-ID | DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF | GENERATING → AVAILABLE | ALLOW:SYSTEM — the system exposes only the completed approved export<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot mark an incomplete export available | SYSTEM_EVENT | HIGH | REQUIRED | DGV-ACT-COMPLETE-EXPORT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-FAIL-EXPORT | Record a Failed Export Generation | DGV-OBJ-EXPORT | UPDATE | — | DGV-EXPORT-F-ID | DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF | GENERATING → FAILED | ALLOW:SYSTEM — the system records a failed generation without widening the approved scope<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot replace a failed export with unapproved data | SYSTEM_EVENT | HIGH | REQUIRED | DGV-ACT-FAIL-EXPORT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| DGV-ACT-EXPIRE-EXPORT | Expire and Remove an Export File | DGV-OBJ-EXPORT | UPDATE | — | DGV-EXPORT-F-EXPIRY | DGV-EXPORT-F-RESULT | AVAILABLE → EXPIRED | ALLOW:SYSTEM — system expires the file at its explicit deadline<br>DENY:CURRENT_ACTOR — a user cannot extend an export file without a new request | SYSTEM_EVENT | HIGH | REQUIRED | DGV-ACT-EXPIRE-EXPORT:school:object:source-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

## 6. 状态可达性

| Object ID | 状态 | 进入动作 | 离开动作 |
| --- | --- | --- | --- |
| DGV-OBJ-POLICY | DRAFT | DGV-ACT-SYNC-POLICY |  |
| DGV-OBJ-POLICY | ACTIVE | DGV-ACT-SYNC-POLICY |  |
| DGV-OBJ-POLICY | SUPERSEDED | DGV-ACT-SYNC-POLICY |  |
| DGV-OBJ-RETENTION | UNSET |  | DGV-ACT-CONFIGURE-RETENTION |
| DGV-OBJ-RETENTION | ACTIVE | DGV-ACT-CONFIGURE-RETENTION | DGV-ACT-SUPERSEDE-RETENTION |
| DGV-OBJ-RETENTION | SUPERSEDED | DGV-ACT-SUPERSEDE-RETENTION |  |
| DGV-OBJ-AI-RULE | BLOCKED_UNSET_RETENTION | DGV-ACT-CONFIGURE-AI-USE | DGV-ACT-CONFIGURE-AI-USE |
| DGV-OBJ-AI-RULE | ACTIVE | DGV-ACT-CONFIGURE-AI-USE | DGV-ACT-DISABLE-AI-USE<br>DGV-ACT-SUPERSEDE-AI-RULE |
| DGV-OBJ-AI-RULE | DISABLED | DGV-ACT-DISABLE-AI-USE | DGV-ACT-SUPERSEDE-AI-RULE |
| DGV-OBJ-AI-RULE | SUPERSEDED | DGV-ACT-SUPERSEDE-AI-RULE |  |
| DGV-OBJ-EXPORT | REQUESTED | DGV-ACT-REQUEST-EXPORT | DGV-ACT-APPROVE-EXPORT<br>DGV-ACT-DENY-EXPORT |
| DGV-OBJ-EXPORT | APPROVED | DGV-ACT-APPROVE-EXPORT | DGV-ACT-GENERATE-EXPORT |
| DGV-OBJ-EXPORT | DENIED | DGV-ACT-DENY-EXPORT |  |
| DGV-OBJ-EXPORT | GENERATING | DGV-ACT-GENERATE-EXPORT | DGV-ACT-COMPLETE-EXPORT<br>DGV-ACT-FAIL-EXPORT |
| DGV-OBJ-EXPORT | AVAILABLE | DGV-ACT-COMPLETE-EXPORT | DGV-ACT-EXPIRE-EXPORT |
| DGV-OBJ-EXPORT | EXPIRED | DGV-ACT-EXPIRE-EXPORT |  |
| DGV-OBJ-EXPORT | FAILED | DGV-ACT-FAIL-EXPORT |  |

## 7. 参与数据流

| Flow ID | 数据流 | 阶段 | 参与模块 | 本模块动作 | 失败与补偿 |
| --- | --- | --- | --- | --- | --- |

## 8. 页面任务合同

| Page ID | 页面 | 端 | 对象 | 字段 | 动作 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-PAGE-POLICY | School Data Governance Policy | WEB / APP | DGV-OBJ-POLICY | DGV-POLICY-F-VERSION<br>DGV-POLICY-F-EXPLANATION | DGV-ACT-VIEW-EXPLANATION | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| DGV-PAGE-RETENTION | School Activation Retention Configuration | WEB | DGV-OBJ-RETENTION | DGV-RETENTION-F-CATEGORY<br>DGV-RETENTION-F-PERIOD<br>DGV-RETENTION-F-ACTIVATED-BY<br>DGV-RETENTION-F-STATUS | DGV-ACT-CONFIGURE-RETENTION<br>DGV-ACT-SUPERSEDE-RETENTION | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| DGV-PAGE-AI-BOUNDARY | AI Data Scope and Purpose Boundary | WEB | DGV-OBJ-AI-RULE | DGV-AI-F-DATA-SCOPE<br>DGV-AI-F-PURPOSE<br>DGV-AI-F-MODEL-USE<br>DGV-AI-F-STATUS | DGV-ACT-CONFIGURE-AI-USE<br>DGV-ACT-DISABLE-AI-USE<br>DGV-ACT-SUPERSEDE-AI-RULE | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| DGV-PAGE-EXPORT-REQUEST | Purpose-bound Export Request | WEB | DGV-OBJ-EXPORT | DGV-EXPORT-F-SCOPE<br>DGV-EXPORT-F-PURPOSE<br>DGV-EXPORT-F-EXPIRY<br>DGV-EXPORT-F-RESULT | DGV-ACT-REQUEST-EXPORT | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| DGV-PAGE-EXPORT-DECISION | Sensitive Export Approval | WEB | DGV-OBJ-EXPORT | DGV-EXPORT-F-SCOPE<br>DGV-EXPORT-F-PURPOSE<br>DGV-EXPORT-F-APPROVER<br>DGV-EXPORT-F-DECISION-REASON<br>DGV-EXPORT-F-AUDIT-REF | DGV-ACT-APPROVE-EXPORT<br>DGV-ACT-DENY-EXPORT | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| DGV-PAGE-EXPORT-RESULT | Expiring Export Result | WEB | DGV-OBJ-EXPORT | DGV-EXPORT-F-SCOPE<br>DGV-EXPORT-F-EXPIRY<br>DGV-EXPORT-F-RESULT<br>DGV-EXPORT-F-AUDIT-REF |  | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |
| DGV-PAGE-EXPORT-NOTIFICATION | Export Result Notification | WEB / APP | DGV-OBJ-EXPORT | DGV-EXPORT-F-EXPIRY<br>DGV-EXPORT-F-RESULT |  | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |

## 9. 验收场景

| Scenario ID | 类型 | Action ID | Given | When | Expected Data | Expected State | Permission | 失败码 / 谓词 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DGV-ACT-SYNC-POLICY-SCN-SUCCESS-DRAFT | SUCCESS | DGV-ACT-SYNC-POLICY | the actor meets the entry conditions for Sync a Versioned Data Governance Policy Snapshot | the actor requests Sync a Versioned Data Governance Policy Snapshot | Sync a Versioned Data Governance Policy Snapshot returns the accepted task-specific result | DRAFT | ALLOW |  |
| DGV-ACT-SYNC-POLICY-SCN-SUCCESS-ACTIVE | SUCCESS | DGV-ACT-SYNC-POLICY | the actor meets the entry conditions for Sync a Versioned Data Governance Policy Snapshot | the actor requests Sync a Versioned Data Governance Policy Snapshot | Sync a Versioned Data Governance Policy Snapshot returns the accepted task-specific result | ACTIVE | ALLOW |  |
| DGV-ACT-SYNC-POLICY-SCN-SUCCESS-SUPERSEDED | SUCCESS | DGV-ACT-SYNC-POLICY | the actor meets the entry conditions for Sync a Versioned Data Governance Policy Snapshot | the actor requests Sync a Versioned Data Governance Policy Snapshot | Sync a Versioned Data Governance Policy Snapshot returns the accepted task-specific result | SUPERSEDED | ALLOW |  |
| DGV-ACT-SYNC-POLICY-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-SYNC-POLICY | PERMISSION_DENIED applies to Sync a Versioned Data Governance Policy Snapshot | the actor requests Sync a Versioned Data Governance Policy Snapshot | Sync a Versioned Data Governance Policy Snapshot returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-SYNC-POLICY-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-SYNC-POLICY | VALIDATION_FAILED applies to Sync a Versioned Data Governance Policy Snapshot | the actor requests Sync a Versioned Data Governance Policy Snapshot | Sync a Versioned Data Governance Policy Snapshot returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-SYNC-POLICY-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-SYNC-POLICY | VERSION_CONFLICT applies to Sync a Versioned Data Governance Policy Snapshot | the actor requests Sync a Versioned Data Governance Policy Snapshot | Sync a Versioned Data Governance Policy Snapshot returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-SYNC-POLICY-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-SYNC-POLICY | AUDIT_FAILED applies to Sync a Versioned Data Governance Policy Snapshot | the actor requests Sync a Versioned Data Governance Policy Snapshot | Sync a Versioned Data Governance Policy Snapshot returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| DGV-ACT-VIEW-EXPLANATION-SCN-SUCCESS | SUCCESS | DGV-ACT-VIEW-EXPLANATION | the actor meets the entry conditions for View School Data Use Explanation | the actor requests View School Data Use Explanation | View School Data Use Explanation returns the accepted task-specific result | UNCHANGED | ALLOW |  |
| DGV-ACT-VIEW-EXPLANATION-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-VIEW-EXPLANATION | PERMISSION_DENIED applies to View School Data Use Explanation | the actor requests View School Data Use Explanation | View School Data Use Explanation returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-VIEW-EXPLANATION-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-VIEW-EXPLANATION | VALIDATION_FAILED applies to View School Data Use Explanation | the actor requests View School Data Use Explanation | View School Data Use Explanation returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-VIEW-EXPLANATION-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-VIEW-EXPLANATION | VERSION_CONFLICT applies to View School Data Use Explanation | the actor requests View School Data Use Explanation | View School Data Use Explanation returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-CONFIGURE-RETENTION-SCN-SUCCESS | SUCCESS | DGV-ACT-CONFIGURE-RETENTION | the actor meets the entry conditions for Configure School Activation Retention Periods | the actor requests Configure School Activation Retention Periods | school-owned retention periods become an explicit activation configuration with no implicit defaults | ACTIVE | ALLOW |  |
| DGV-ACT-CONFIGURE-RETENTION-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-CONFIGURE-RETENTION | PERMISSION_DENIED applies to Configure School Activation Retention Periods | the actor requests Configure School Activation Retention Periods | Configure School Activation Retention Periods returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-CONFIGURE-RETENTION-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-CONFIGURE-RETENTION | VALIDATION_FAILED applies to Configure School Activation Retention Periods | the actor requests Configure School Activation Retention Periods | Configure School Activation Retention Periods returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-CONFIGURE-RETENTION-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-CONFIGURE-RETENTION | VERSION_CONFLICT applies to Configure School Activation Retention Periods | the actor requests Configure School Activation Retention Periods | Configure School Activation Retention Periods returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-CONFIGURE-RETENTION-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-CONFIGURE-RETENTION | AUDIT_FAILED applies to Configure School Activation Retention Periods | the actor requests Configure School Activation Retention Periods | Configure School Activation Retention Periods returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| DGV-ACT-SUPERSEDE-RETENTION-SCN-SUCCESS | SUCCESS | DGV-ACT-SUPERSEDE-RETENTION | the actor meets the entry conditions for Supersede an Active Retention Configuration | the actor requests Supersede an Active Retention Configuration | Supersede an Active Retention Configuration returns the accepted task-specific result | SUPERSEDED | ALLOW |  |
| DGV-ACT-SUPERSEDE-RETENTION-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-SUPERSEDE-RETENTION | PERMISSION_DENIED applies to Supersede an Active Retention Configuration | the actor requests Supersede an Active Retention Configuration | Supersede an Active Retention Configuration returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-SUPERSEDE-RETENTION-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-SUPERSEDE-RETENTION | VALIDATION_FAILED applies to Supersede an Active Retention Configuration | the actor requests Supersede an Active Retention Configuration | Supersede an Active Retention Configuration returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-SUPERSEDE-RETENTION-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-SUPERSEDE-RETENTION | VERSION_CONFLICT applies to Supersede an Active Retention Configuration | the actor requests Supersede an Active Retention Configuration | Supersede an Active Retention Configuration returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-SUPERSEDE-RETENTION-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-SUPERSEDE-RETENTION | AUDIT_FAILED applies to Supersede an Active Retention Configuration | the actor requests Supersede an Active Retention Configuration | Supersede an Active Retention Configuration returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| DGV-ACT-CONFIGURE-AI-USE-SCN-SUCCESS | SUCCESS | DGV-ACT-CONFIGURE-AI-USE | the actor meets the entry conditions for Configure AI Data Use Boundary | the actor requests Configure AI Data Use Boundary | AI use is enabled only for the declared scope and purpose after retention is configured | ACTIVE | ALLOW |  |
| DGV-ACT-CONFIGURE-AI-USE-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-CONFIGURE-AI-USE | PERMISSION_DENIED applies to Configure AI Data Use Boundary | the actor requests Configure AI Data Use Boundary | Configure AI Data Use Boundary returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-CONFIGURE-AI-USE-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-CONFIGURE-AI-USE | VALIDATION_FAILED applies to Configure AI Data Use Boundary | the actor requests Configure AI Data Use Boundary | unset retention blocks sensitive AI use and returns BLOCKED_UNSET_RETENTION | BLOCKED_UNSET_RETENTION | DENY | VALIDATION_FAILED |
| DGV-ACT-CONFIGURE-AI-USE-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-CONFIGURE-AI-USE | VERSION_CONFLICT applies to Configure AI Data Use Boundary | the actor requests Configure AI Data Use Boundary | Configure AI Data Use Boundary returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-CONFIGURE-AI-USE-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-CONFIGURE-AI-USE | AUDIT_FAILED applies to Configure AI Data Use Boundary | the actor requests Configure AI Data Use Boundary | Configure AI Data Use Boundary returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| DGV-ACT-DISABLE-AI-USE-SCN-SUCCESS | SUCCESS | DGV-ACT-DISABLE-AI-USE | the actor meets the entry conditions for Disable an Active AI Data Use Rule | the actor requests Disable an Active AI Data Use Rule | Disable an Active AI Data Use Rule returns the accepted task-specific result | DISABLED | ALLOW |  |
| DGV-ACT-DISABLE-AI-USE-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-DISABLE-AI-USE | PERMISSION_DENIED applies to Disable an Active AI Data Use Rule | the actor requests Disable an Active AI Data Use Rule | Disable an Active AI Data Use Rule returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-DISABLE-AI-USE-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-DISABLE-AI-USE | VALIDATION_FAILED applies to Disable an Active AI Data Use Rule | the actor requests Disable an Active AI Data Use Rule | Disable an Active AI Data Use Rule returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-DISABLE-AI-USE-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-DISABLE-AI-USE | VERSION_CONFLICT applies to Disable an Active AI Data Use Rule | the actor requests Disable an Active AI Data Use Rule | Disable an Active AI Data Use Rule returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-DISABLE-AI-USE-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-DISABLE-AI-USE | AUDIT_FAILED applies to Disable an Active AI Data Use Rule | the actor requests Disable an Active AI Data Use Rule | Disable an Active AI Data Use Rule returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| DGV-ACT-SUPERSEDE-AI-RULE-SCN-SUCCESS | SUCCESS | DGV-ACT-SUPERSEDE-AI-RULE | the actor meets the entry conditions for Supersede an AI Data Use Rule | the actor requests Supersede an AI Data Use Rule | Supersede an AI Data Use Rule returns the accepted task-specific result | SUPERSEDED | ALLOW |  |
| DGV-ACT-SUPERSEDE-AI-RULE-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-SUPERSEDE-AI-RULE | PERMISSION_DENIED applies to Supersede an AI Data Use Rule | the actor requests Supersede an AI Data Use Rule | Supersede an AI Data Use Rule returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-SUPERSEDE-AI-RULE-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-SUPERSEDE-AI-RULE | VALIDATION_FAILED applies to Supersede an AI Data Use Rule | the actor requests Supersede an AI Data Use Rule | Supersede an AI Data Use Rule returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-SUPERSEDE-AI-RULE-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-SUPERSEDE-AI-RULE | VERSION_CONFLICT applies to Supersede an AI Data Use Rule | the actor requests Supersede an AI Data Use Rule | Supersede an AI Data Use Rule returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-SUPERSEDE-AI-RULE-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-SUPERSEDE-AI-RULE | AUDIT_FAILED applies to Supersede an AI Data Use Rule | the actor requests Supersede an AI Data Use Rule | Supersede an AI Data Use Rule returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| DGV-ACT-REQUEST-EXPORT-SCN-SUCCESS | SUCCESS | DGV-ACT-REQUEST-EXPORT | the actor meets the entry conditions for Request a Purpose-bound Data Export | the actor requests Request a Purpose-bound Data Export | Request a Purpose-bound Data Export returns the accepted task-specific result | REQUESTED | ALLOW |  |
| DGV-ACT-REQUEST-EXPORT-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-REQUEST-EXPORT | PERMISSION_DENIED applies to Request a Purpose-bound Data Export | the actor requests Request a Purpose-bound Data Export | unauthorized sensitive scope blocks the export request | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-REQUEST-EXPORT-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-REQUEST-EXPORT | VALIDATION_FAILED applies to Request a Purpose-bound Data Export | the actor requests Request a Purpose-bound Data Export | unset retention blocks the export request | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-REQUEST-EXPORT-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-REQUEST-EXPORT | VERSION_CONFLICT applies to Request a Purpose-bound Data Export | the actor requests Request a Purpose-bound Data Export | Request a Purpose-bound Data Export returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-REQUEST-EXPORT-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-REQUEST-EXPORT | AUDIT_FAILED applies to Request a Purpose-bound Data Export | the actor requests Request a Purpose-bound Data Export | Request a Purpose-bound Data Export returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| DGV-ACT-APPROVE-EXPORT-SCN-SUCCESS | SUCCESS | DGV-ACT-APPROVE-EXPORT | the actor meets the entry conditions for Approve a Sensitive Export Request | the actor requests Approve a Sensitive Export Request | Approve a Sensitive Export Request returns the accepted task-specific result | APPROVED | ALLOW |  |
| DGV-ACT-APPROVE-EXPORT-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-APPROVE-EXPORT | PERMISSION_DENIED applies to Approve a Sensitive Export Request | the actor requests Approve a Sensitive Export Request | Approve a Sensitive Export Request returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-APPROVE-EXPORT-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-APPROVE-EXPORT | VALIDATION_FAILED applies to Approve a Sensitive Export Request | the actor requests Approve a Sensitive Export Request | Approve a Sensitive Export Request returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-APPROVE-EXPORT-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-APPROVE-EXPORT | VERSION_CONFLICT applies to Approve a Sensitive Export Request | the actor requests Approve a Sensitive Export Request | Approve a Sensitive Export Request returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-APPROVE-EXPORT-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-APPROVE-EXPORT | AUDIT_FAILED applies to Approve a Sensitive Export Request | the actor requests Approve a Sensitive Export Request | Approve a Sensitive Export Request returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| DGV-ACT-DENY-EXPORT-SCN-SUCCESS | SUCCESS | DGV-ACT-DENY-EXPORT | the actor meets the entry conditions for Deny a Sensitive Export Request | the actor requests Deny a Sensitive Export Request | Deny a Sensitive Export Request returns the accepted task-specific result | DENIED | ALLOW |  |
| DGV-ACT-DENY-EXPORT-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-DENY-EXPORT | PERMISSION_DENIED applies to Deny a Sensitive Export Request | the actor requests Deny a Sensitive Export Request | Deny a Sensitive Export Request returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-DENY-EXPORT-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-DENY-EXPORT | VALIDATION_FAILED applies to Deny a Sensitive Export Request | the actor requests Deny a Sensitive Export Request | Deny a Sensitive Export Request returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-DENY-EXPORT-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-DENY-EXPORT | VERSION_CONFLICT applies to Deny a Sensitive Export Request | the actor requests Deny a Sensitive Export Request | Deny a Sensitive Export Request returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-DENY-EXPORT-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-DENY-EXPORT | AUDIT_FAILED applies to Deny a Sensitive Export Request | the actor requests Deny a Sensitive Export Request | Deny a Sensitive Export Request returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| DGV-ACT-GENERATE-EXPORT-SCN-SUCCESS | SUCCESS | DGV-ACT-GENERATE-EXPORT | the actor meets the entry conditions for Start an Approved Expiring Export | the actor requests Start an Approved Expiring Export | Start an Approved Expiring Export returns the accepted task-specific result | GENERATING | ALLOW |  |
| DGV-ACT-GENERATE-EXPORT-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-GENERATE-EXPORT | PERMISSION_DENIED applies to Start an Approved Expiring Export | the actor requests Start an Approved Expiring Export | Start an Approved Expiring Export returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-GENERATE-EXPORT-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-GENERATE-EXPORT | VALIDATION_FAILED applies to Start an Approved Expiring Export | the actor requests Start an Approved Expiring Export | Start an Approved Expiring Export returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-GENERATE-EXPORT-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-GENERATE-EXPORT | VERSION_CONFLICT applies to Start an Approved Expiring Export | the actor requests Start an Approved Expiring Export | Start an Approved Expiring Export returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-GENERATE-EXPORT-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-GENERATE-EXPORT | AUDIT_FAILED applies to Start an Approved Expiring Export | the actor requests Start an Approved Expiring Export | Start an Approved Expiring Export returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| DGV-ACT-COMPLETE-EXPORT-SCN-SUCCESS | SUCCESS | DGV-ACT-COMPLETE-EXPORT | the actor meets the entry conditions for Complete an Expiring Export | the actor requests Complete an Expiring Export | Complete an Expiring Export returns the accepted task-specific result | AVAILABLE | ALLOW |  |
| DGV-ACT-COMPLETE-EXPORT-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-COMPLETE-EXPORT | PERMISSION_DENIED applies to Complete an Expiring Export | the actor requests Complete an Expiring Export | Complete an Expiring Export returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-COMPLETE-EXPORT-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-COMPLETE-EXPORT | VALIDATION_FAILED applies to Complete an Expiring Export | the actor requests Complete an Expiring Export | Complete an Expiring Export returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-COMPLETE-EXPORT-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-COMPLETE-EXPORT | VERSION_CONFLICT applies to Complete an Expiring Export | the actor requests Complete an Expiring Export | Complete an Expiring Export returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-COMPLETE-EXPORT-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-COMPLETE-EXPORT | AUDIT_FAILED applies to Complete an Expiring Export | the actor requests Complete an Expiring Export | Complete an Expiring Export returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| DGV-ACT-FAIL-EXPORT-SCN-SUCCESS | SUCCESS | DGV-ACT-FAIL-EXPORT | the actor meets the entry conditions for Record a Failed Export Generation | the actor requests Record a Failed Export Generation | Record a Failed Export Generation returns the accepted task-specific result | FAILED | ALLOW |  |
| DGV-ACT-FAIL-EXPORT-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-FAIL-EXPORT | PERMISSION_DENIED applies to Record a Failed Export Generation | the actor requests Record a Failed Export Generation | Record a Failed Export Generation returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-FAIL-EXPORT-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-FAIL-EXPORT | VALIDATION_FAILED applies to Record a Failed Export Generation | the actor requests Record a Failed Export Generation | Record a Failed Export Generation returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-FAIL-EXPORT-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-FAIL-EXPORT | VERSION_CONFLICT applies to Record a Failed Export Generation | the actor requests Record a Failed Export Generation | Record a Failed Export Generation returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-FAIL-EXPORT-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-FAIL-EXPORT | AUDIT_FAILED applies to Record a Failed Export Generation | the actor requests Record a Failed Export Generation | Record a Failed Export Generation returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |
| DGV-ACT-EXPIRE-EXPORT-SCN-SUCCESS | SUCCESS | DGV-ACT-EXPIRE-EXPORT | the actor meets the entry conditions for Expire and Remove an Export File | the actor requests Expire and Remove an Export File | Expire and Remove an Export File returns the accepted task-specific result | EXPIRED | ALLOW |  |
| DGV-ACT-EXPIRE-EXPORT-SCN-PERMISSION_DENIED | FAILURE | DGV-ACT-EXPIRE-EXPORT | PERMISSION_DENIED applies to Expire and Remove an Export File | the actor requests Expire and Remove an Export File | Expire and Remove an Export File returns PERMISSION_DENIED without hidden writes | UNCHANGED | DENY | PERMISSION_DENIED |
| DGV-ACT-EXPIRE-EXPORT-SCN-VALIDATION_FAILED | FAILURE | DGV-ACT-EXPIRE-EXPORT | VALIDATION_FAILED applies to Expire and Remove an Export File | the actor requests Expire and Remove an Export File | Expire and Remove an Export File returns VALIDATION_FAILED without hidden writes | UNCHANGED | DENY | VALIDATION_FAILED |
| DGV-ACT-EXPIRE-EXPORT-SCN-VERSION_CONFLICT | FAILURE | DGV-ACT-EXPIRE-EXPORT | VERSION_CONFLICT applies to Expire and Remove an Export File | the actor requests Expire and Remove an Export File | Expire and Remove an Export File returns VERSION_CONFLICT without hidden writes | UNCHANGED | DENY | VERSION_CONFLICT |
| DGV-ACT-EXPIRE-EXPORT-SCN-AUDIT_FAILED | FAILURE | DGV-ACT-EXPIRE-EXPORT | AUDIT_FAILED applies to Expire and Remove an Export File | the actor requests Expire and Remove an Export File | Expire and Remove an Export File returns AUDIT_FAILED without hidden writes | UNCHANGED | DENY | AUDIT_FAILED |

## 10. AI 任务映射

| Task ID | 任务 | 类型 | 目标 Action | 受众 | 确认者 | 预览字段 | 失败行为 |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 11. 研发与测试就绪门禁

- 实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。
- 所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。
- 每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。
- 每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。
- Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。
