# PLAT-001 School Onboarding, Commercial Boundary, Service Continuity, and Support Access Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | PLAT-001 |
| 阶段 | 1 |
| 交付状态 | BUILD_READY |
| 页面数量 | 2 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## PLAT-PAGE-SCHOOL-SERVICE-OPERATIONS Web School Service and Support Access Workspace

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | WEB | PLAT-OBJ-ONBOARDING-CASE / PLAT-OBJ-SERVICE-PLAN / PLAT-OBJ-POLICY-TEMPLATE / PLAT-OBJ-SUPPORT-CASE / PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY / PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-OBJ-ONBOARDING-CASE | PLAT-CASE-F-ID | School Onboarding Case ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-ONBOARDING-CASE | PLAT-CASE-F-SCHOOL | Onboarding School | ID | 是 | OPTION_SET: OPT-COM-002 | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-ONBOARDING-CASE | PLAT-CASE-F-IMPLEMENTATION-NOTES | Onboarding Implementation Notes | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-ONBOARDING-CASE | PLAT-CASE-F-STATUS | Onboarding Case Status | STRING | 是 | OPTION_SET: OPT-EXT-015 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-ID | School Service Plan ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SCHOOL-REF | Service Plan School | ID | 是 | OBJECT_REF: ACC-OBJ-SCHOOL | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SCHOOL-VERSION | Service Plan School Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SCOPE | School Service Plan Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SERVICE-STATE | School Service State | STRING | 是 | OPTION_SET: OPT-EXT-026 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-CONTINUITY-REF | Service Restriction Continuity Window | ID | 否 | OBJECT_REF: PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-CONTINUITY-VERSION | Service Restriction Continuity Window Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-RESTRICTION-REASON | Service Plan Restriction Reason | STRING | required when a service plan becomes restricted, terminated, or expired；状态=RESTRICTED/TERMINATED/EXPIRED；动作=PLAT-ACT-RESTRICT-SERVICE-PLAN/PLAT-ACT-TERMINATE-SERVICE-PLAN/PLAT-ACT-EXPIRE-SERVICE-PLAN | OPTION_SET: OPT-EXT-022 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-RESTRICTION-EFFECTIVE-AT | Service Plan Restriction Effective At | DATETIME | required when a service plan becomes restricted, terminated, or expired；状态=RESTRICTED/TERMINATED/EXPIRED；动作=PLAT-ACT-RESTRICT-SERVICE-PLAN | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-RECOVERY-PLAN-REF | Replacement Service Plan Version | ID | required when a restricted, terminated, or expired plan is superseded by a recovered version；状态=SUPERSEDED；动作=PLAT-ACT-SUPERSEDE-SERVICE-PLAN | OBJECT_REF: PLAT-OBJ-SERVICE-PLAN | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-RECOVERY-PLAN-VERSION | Replacement Service Plan Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SCHOOL-CONFIRMED-AT | School Confirmation Time | DATETIME | required only when the school confirms the service plan；状态=CONFIRMED；动作=PLAT-ACT-CONFIRM-SERVICE-PLAN | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-VERSION | School Service Plan Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-POLICY-TEMPLATE | PLAT-POLICY-F-ID | School Policy Template Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-POLICY-TEMPLATE | PLAT-POLICY-F-CONTENT | School Policy Template Content | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-POLICY-TEMPLATE | PLAT-POLICY-F-VERSION | Policy Template Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-POLICY-TEMPLATE | PLAT-POLICY-F-STATUS | Policy Template Status | STRING | 是 | OPTION_SET: OPT-EXT-016 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-ID | Audited School Support Case ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-PURPOSE | Support Case Purpose | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE | Requested Support Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUDIT-REASON | Support Case Audit Reason | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUD-SESSION-REF | Pinned Audited Access Session | ID | 是 | OBJECT_REF: AUD-OBJ-ACCESS-SESSION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION | Pinned Audited Session Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID | Authorized Session Operator Projection | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-STATUS | Support Case Status | STRING | 是 | OPTION_SET: OPT-EXT-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-ID | School-only Payer and Governance Boundary ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-SCHOOL-REF | Commercial School | ID | 是 | OBJECT_REF: ACC-OBJ-SCHOOL | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-SCHOOL-VERSION | Commercial School Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-PAYER-KIND | Commercial Payer Kind | STRING | 是 | OPTION_SET: OPT-EXT-019 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-FINANCIAL-CONTACT-REF | School Financial Contact Profile | ID | 是 | OBJECT_REF: ACC-OBJ-SCHOOL-PROFILE | IMMUTABLE | AUTHORIZED_SCOPE | must identify an active profile in the bound school |
| PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-FINANCIAL-CONTACT-VERSION | Financial Contact Profile Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-GOVERNANCE-ADMIN-REF | School Governance Administrator Profile | ID | 是 | OBJECT_REF: ACC-OBJ-SCHOOL-PROFILE | IMMUTABLE | AUTHORIZED_SCOPE | must identify a different active profile in the bound school whose profile type is ROLE-SCHOOL-ADMIN |
| PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-GOVERNANCE-ADMIN-VERSION | Governance Administrator Profile Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-PROHIBITED-CONSUMER-MODELS | Prohibited Consumer Monetization Models | STRING_ARRAY | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must prohibit STUDENT_PAYMENT, GUARDIAN_PAYMENT, ADVERTISING, WEAKNESS_BASED_COMMERCE, CONTENT_MARKETPLACE, and TEACHER_REVENUE_SHARE |
| PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-SCHOOL-CONFIRMED-AT | School Commercial Boundary Confirmation Time | DATETIME | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-STATUS | School Commercial Boundary Status | STRING | 是 | OPTION_SET: OPT-EXT-008 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-VERSION | School Commercial Boundary Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-ID | Protected Activity and Exit Window ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-SCHOOL-REF | Restricted Service School | ID | 是 | OBJECT_REF: ACC-OBJ-SCHOOL | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-SCHOOL-VERSION | Restricted Service School Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-SERVICE-PLAN-REF | Pinned Current School Service Plan | ID | 是 | OBJECT_REF: PLAT-OBJ-SERVICE-PLAN | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-SERVICE-PLAN-VERSION | Pinned Current Service Plan Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-COMMERCIAL-BOUNDARY-REF | Pinned School Commercial Boundary | ID | 是 | OBJECT_REF: PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-COMMERCIAL-BOUNDARY-VERSION | Pinned School Commercial Boundary Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-RESTRICTION-REASON | Service Restriction Reason | STRING | 是 | OPTION_SET: OPT-EXT-022 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-RESTRICTED-AT | Service Restriction Eligibility Cutoff | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | captures the atomic eligibility cutoff; no service restriction becomes effective until the protected-activity manifest is SEALED |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-ACTIVITY-PROTECTION-UNTIL | Published Activity Protection Window End | DATETIME | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must be finite and greater than or equal to the maximum original due time among all eligible student activity windows |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-EXIT-WINDOW-UNTIL | Explicit Exit Window End | DATETIME | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must be a finite documented exit deadline at or after the protected activity window end |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-PROTECTED-OPERATIONS | Operations Retained during Restricted Service | STRING_ARRAY | 是 | OPTION_SET: OPT-EXT-023 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must retain published-activity completion plus historical read, legal export, transfer, deletion, and security support only as required by contract and applicable law |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-NEW-ACTIVITY-POLICY | New Activity Creation under Restricted Service | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must equal BLOCK_NEW_ACTIVITY_OUTSIDE_CURRENT_ENTITLEMENT |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-CONTINUING-DATA-RIGHTS-BASIS | Continuing Data Rights Basis | TEXT | 是 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must cite applicable law and contract; cannot promise indefinite free operation of the full service |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-ELIGIBLE-ENTRY-COUNT | Expected Eligible Activity Entry Count | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must equal the cardinality of the immutable eligible set selected at the restriction eligibility cutoff |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-ELIGIBLE-SET-DIGEST | Expected Eligible Activity Set Digest | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must be a canonical digest over the ordered eligible student-window, activity-version, and publication-snapshot-version identities |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-ELIGIBLE-MAX-DUE-AT | Maximum Eligible Student Window Due Time | DATETIME | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | equals the maximum original due time of the eligible set and is absent only when the eligible count is zero |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-CAPTURED-ENTRY-COUNT | Reconciled Captured Activity Entry Count | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must be derived from distinct immutable protected-entry identities, never from attempted capture messages |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-CAPTURED-SET-DIGEST | Reconciled Captured Activity Set Digest | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must use the same canonical identity tuple and ordering as the eligible-set digest |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-MANIFEST-STATUS | Protected Activity Manifest Status | STRING | 是 | OPTION_SET: OPT-EXT-025 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-MANIFEST-SEALED-AT | Protected Activity Manifest Sealed At | DATETIME | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | is written atomically only when eligible and captured count plus digest are exactly equal |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT | Service Restriction Effective At | DATETIME | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | is written atomically with manifest sealing and never while the manifest is CAPTURING or CAPTURE_FAILED |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-CAPTURE-FAILURE-REASON | Protected Activity Capture Failure Reason | TEXT | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-CAPTURE-RETRY-COUNT | Protected Activity Capture Retry Count | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | starts at zero and increments once for each accepted retry without replacing the eligible-set snapshot |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH | Protected Activity Capture Attempt Epoch | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | starts at one and advances atomically by exactly one only when a failed capture attempt is retried |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION | Capture Attempt Expected Continuity Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | pins the service-continuity object version that every event in the current capture attempt must compare-and-swap against |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-STATUS | Service Continuity Status | STRING | 是 | OPTION_SET: OPT-EXT-024 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-VERSION | Service Continuity Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-ACT-CREATE-ONBOARDING-CASE | Create School Onboarding Case | CREATE | PLAT-CASE-F-SCHOOL<br>PLAT-CASE-F-IMPLEMENTATION-NOTES | PLAT-CASE-F-ID<br>PLAT-CASE-F-STATUS | CREATE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-CONFIRM-ONBOARDING-CASE | Record School Onboarding Confirmation | UPDATE |  | PLAT-CASE-F-STATUS | OPEN → SCHOOL_CONFIRMED | ROLE-SCHOOL-ADMIN | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-CREATE-SERVICE-PLAN | Create School Service Plan | CREATE | PLAT-PLAN-F-SCHOOL-REF<br>PLAT-PLAN-F-SCHOOL-VERSION<br>PLAT-PLAN-F-SCOPE | PLAT-PLAN-F-ID<br>PLAT-PLAN-F-SCHOOL-REF<br>PLAT-PLAN-F-SCHOOL-VERSION<br>PLAT-PLAN-F-SERVICE-STATE<br>PLAT-PLAN-F-VERSION | CREATE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-CONFIRM-SERVICE-PLAN | Confirm School Service Plan | UPDATE |  | PLAT-PLAN-F-SERVICE-STATE<br>PLAT-PLAN-F-SCHOOL-CONFIRMED-AT<br>PLAT-PLAN-F-VERSION | DRAFT → CONFIRMED | ROLE-SCHOOL-ADMIN | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-ACTIVATE-SERVICE-PLAN | Activate Confirmed School Service Plan | UPDATE |  | PLAT-PLAN-F-SERVICE-STATE<br>PLAT-PLAN-F-VERSION | CONFIRMED → ACTIVE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | LOW / REQUIRED | PERMISSION_DENIED / ACTIVE_SERVICE_PLAN_ALREADY_EXISTS / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-TERMINATE-SERVICE-PLAN | Finalize a Restricted Service Plan as Contract Terminated | UPDATE | PLAT-PLAN-F-CONTINUITY-REF<br>PLAT-PLAN-F-CONTINUITY-VERSION<br>PLAT-PLAN-F-RESTRICTION-REASON | PLAT-PLAN-F-RESTRICTION-REASON<br>PLAT-PLAN-F-SERVICE-STATE<br>PLAT-PLAN-F-VERSION | RESTRICTED → TERMINATED | ROLE-PLATFORM-GOVERNANCE | ROLE-STUDENT / ROLE-GUARDIAN / ROLE-TEACHER / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / CONTINUITY_WINDOW_NOT_CLOSED / RESTRICTION_REASON_MISMATCH / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-EXPIRE-SERVICE-PLAN | Finalize a Restricted Service Plan as Expired | UPDATE | PLAT-PLAN-F-CONTINUITY-REF<br>PLAT-PLAN-F-CONTINUITY-VERSION<br>PLAT-PLAN-F-RESTRICTION-REASON | PLAT-PLAN-F-RESTRICTION-REASON<br>PLAT-PLAN-F-SERVICE-STATE<br>PLAT-PLAN-F-VERSION | RESTRICTED → EXPIRED | ROLE-PLATFORM-GOVERNANCE | ROLE-STUDENT / ROLE-GUARDIAN / ROLE-TEACHER / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / CONTINUITY_WINDOW_NOT_CLOSED / RESTRICTION_REASON_MISMATCH / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-SUPERSEDE-SERVICE-PLAN | Link a Restricted or Ended Plan to a New Active Recovery Version | UPDATE | PLAT-PLAN-F-RECOVERY-PLAN-REF<br>PLAT-PLAN-F-RECOVERY-PLAN-VERSION | PLAT-PLAN-F-RECOVERY-PLAN-REF<br>PLAT-PLAN-F-RECOVERY-PLAN-VERSION<br>PLAT-PLAN-F-SERVICE-STATE<br>PLAT-PLAN-F-VERSION | RESTRICTED / TERMINATED / EXPIRED → SUPERSEDED | ROLE-PLATFORM-GOVERNANCE | ROLE-STUDENT / ROLE-GUARDIAN / ROLE-TEACHER / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / RECOVERY_PLAN_NOT_ACTIVE / RECOVERY_PLAN_SCHOOL_MISMATCH / RECOVERY_PLAN_ID_REUSED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-CREATE-COMMERCIAL-BOUNDARY | Create a School-only Payer and Governance Boundary | CREATE | PLAT-COMM-F-SCHOOL-REF<br>PLAT-COMM-F-SCHOOL-VERSION<br>PLAT-COMM-F-PAYER-KIND<br>PLAT-COMM-F-FINANCIAL-CONTACT-REF<br>PLAT-COMM-F-FINANCIAL-CONTACT-VERSION<br>PLAT-COMM-F-GOVERNANCE-ADMIN-REF<br>PLAT-COMM-F-GOVERNANCE-ADMIN-VERSION | PLAT-COMM-F-ID<br>PLAT-COMM-F-PROHIBITED-CONSUMER-MODELS<br>PLAT-COMM-F-STATUS<br>PLAT-COMM-F-VERSION | CREATE | ROLE-PLATFORM-GOVERNANCE | ROLE-STUDENT / ROLE-GUARDIAN / ROLE-TEACHER / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / COMMERCIAL_CONTACT_SEPARATION_REQUIRED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-CONFIRM-COMMERCIAL-BOUNDARY | Confirm the School Commercial and Governance Separation | UPDATE |  | PLAT-COMM-F-SCHOOL-CONFIRMED-AT<br>PLAT-COMM-F-STATUS<br>PLAT-COMM-F-VERSION | DRAFT → CONFIRMED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS / CURRENT_ACTOR | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-ACTIVATE-COMMERCIAL-BOUNDARY | Activate a Confirmed School Commercial Boundary | UPDATE |  | PLAT-COMM-F-STATUS<br>PLAT-COMM-F-VERSION | CONFIRMED → ACTIVE | ROLE-PLATFORM-GOVERNANCE | ROLE-STUDENT / ROLE-GUARDIAN / ROLE-TEACHER / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-OPEN-SERVICE-CONTINUITY | Start Protected Activity Capture before Restricted Service | CREATE | PLAT-CONT-F-SCHOOL-REF<br>PLAT-CONT-F-SCHOOL-VERSION<br>PLAT-CONT-F-SERVICE-PLAN-REF<br>PLAT-CONT-F-SERVICE-PLAN-VERSION<br>PLAT-CONT-F-COMMERCIAL-BOUNDARY-REF<br>PLAT-CONT-F-COMMERCIAL-BOUNDARY-VERSION<br>PLAT-CONT-F-RESTRICTION-REASON<br>PLAT-CONT-F-ACTIVITY-PROTECTION-UNTIL<br>PLAT-CONT-F-EXIT-WINDOW-UNTIL<br>PLAT-CONT-F-CONTINUING-DATA-RIGHTS-BASIS | PLAT-CONT-F-ID<br>PLAT-CONT-F-RESTRICTED-AT<br>PLAT-CONT-F-PROTECTED-OPERATIONS<br>PLAT-CONT-F-NEW-ACTIVITY-POLICY<br>PLAT-CONT-F-ELIGIBLE-ENTRY-COUNT<br>PLAT-CONT-F-ELIGIBLE-SET-DIGEST<br>PLAT-CONT-F-ELIGIBLE-MAX-DUE-AT<br>PLAT-CONT-F-CAPTURED-ENTRY-COUNT<br>PLAT-CONT-F-CAPTURED-SET-DIGEST<br>PLAT-CONT-F-MANIFEST-STATUS<br>PLAT-CONT-F-CAPTURE-RETRY-COUNT<br>PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH<br>PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION<br>PLAT-CONT-F-STATUS<br>PLAT-CONT-F-VERSION | CREATE | ROLE-PLATFORM-GOVERNANCE | ROLE-STUDENT / ROLE-GUARDIAN / ROLE-TEACHER / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / INACTIVE_SERVICE_PLAN / SCHOOL_SCOPE_MISMATCH / EXISTING_CURRENT_CONTINUITY_WINDOW / PROTECTION_WINDOW_TRUNCATES_ELIGIBLE_ACTIVITY / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-RETRY-PROTECTED-ACTIVITY-CAPTURE | Retry Missing Protected Activity Capture Entries | UPDATE | PLAT-CONT-F-SERVICE-PLAN-REF<br>PLAT-CONT-F-SERVICE-PLAN-VERSION<br>PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH<br>PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION | PLAT-CONT-F-CAPTURE-RETRY-COUNT<br>PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH<br>PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION<br>PLAT-CONT-F-MANIFEST-STATUS<br>PLAT-CONT-F-STATUS<br>PLAT-CONT-F-VERSION | CAPTURE_FAILED → CAPTURING_PROTECTED_ACTIVITIES | ROLE-PLATFORM-GOVERNANCE | ROLE-STUDENT / ROLE-GUARDIAN / ROLE-TEACHER / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / INACTIVE_SERVICE_PLAN / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-EVALUATE-NEW-ACTIVITY-ENTITLEMENT | Evaluate New Activity Creation against Current Entitlement | READ |  | PLAT-PLAN-F-SCOPE<br>PLAT-PLAN-F-SERVICE-STATE<br>PLAT-PLAN-F-VERSION | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / ENTITLEMENT_DECISION_UNAVAILABLE |
| PLAT-ACT-ENTER-EXIT-WINDOW | Enter the Explicit Service Exit Window | UPDATE | PLAT-CONT-F-SERVICE-PLAN-REF<br>PLAT-CONT-F-SERVICE-PLAN-VERSION | PLAT-CONT-F-STATUS<br>PLAT-CONT-F-VERSION | ACTIVITY_PROTECTION_OPEN → EXIT_WINDOW_OPEN | ROLE-PLATFORM-GOVERNANCE | ROLE-STUDENT / ROLE-GUARDIAN / ROLE-TEACHER / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / INACTIVE_SERVICE_PLAN / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-CLOSE-SERVICE-CONTINUITY | Close the Finite Service Continuity Window | UPDATE | PLAT-CONT-F-SERVICE-PLAN-REF<br>PLAT-CONT-F-SERVICE-PLAN-VERSION | PLAT-CONT-F-STATUS<br>PLAT-CONT-F-VERSION | EXIT_WINDOW_OPEN → CLOSED | ROLE-PLATFORM-GOVERNANCE | ROLE-STUDENT / ROLE-GUARDIAN / ROLE-TEACHER / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / SERVICE_PLAN_NOT_RESTRICTED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-VIEW-SERVICE-CONTINUITY | View Current Protected Operations and Exit Deadlines | READ |  | PLAT-CONT-F-RESTRICTION-REASON<br>PLAT-CONT-F-ACTIVITY-PROTECTION-UNTIL<br>PLAT-CONT-F-EXIT-WINDOW-UNTIL<br>PLAT-CONT-F-PROTECTED-OPERATIONS<br>PLAT-CONT-F-NEW-ACTIVITY-POLICY<br>PLAT-CONT-F-CONTINUING-DATA-RIGHTS-BASIS<br>PLAT-CONT-F-ELIGIBLE-ENTRY-COUNT<br>PLAT-CONT-F-ELIGIBLE-SET-DIGEST<br>PLAT-CONT-F-ELIGIBLE-MAX-DUE-AT<br>PLAT-CONT-F-CAPTURED-ENTRY-COUNT<br>PLAT-CONT-F-CAPTURED-SET-DIGEST<br>PLAT-CONT-F-MANIFEST-STATUS<br>PLAT-CONT-F-MANIFEST-SEALED-AT<br>PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT<br>PLAT-CONT-F-CAPTURE-FAILURE-REASON<br>PLAT-CONT-F-CAPTURE-RETRY-COUNT<br>PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH<br>PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION<br>PLAT-CONT-F-STATUS<br>PLAT-CONT-F-VERSION | UNCHANGED | CURRENT_ACTOR | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |
| PLAT-ACT-CREATE-POLICY-TEMPLATE | Create School Policy Template Version | CREATE | PLAT-POLICY-F-CONTENT | PLAT-POLICY-F-ID<br>PLAT-POLICY-F-VERSION<br>PLAT-POLICY-F-STATUS | CREATE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-CONFIRM-POLICY-TEMPLATE | Confirm School Policy Template Version | UPDATE |  | PLAT-POLICY-F-VERSION<br>PLAT-POLICY-F-STATUS | DRAFT → CONFIRMED | ROLE-SCHOOL-ADMIN | ROLE-STUDENT / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-ACTIVATE-POLICY-TEMPLATE | Activate Confirmed School Policy Template | UPDATE |  | PLAT-POLICY-F-VERSION<br>PLAT-POLICY-F-STATUS | CONFIRMED → ACTIVE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| PLAT-ACT-CREATE-SUPPORT-CASE | Create an AUD-authorized Support Case | CREATE | PLAT-SUPPORT-CASE-F-PURPOSE<br>PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE<br>PLAT-SUPPORT-CASE-F-AUDIT-REASON<br>PLAT-SUPPORT-CASE-F-AUD-SESSION-REF | PLAT-SUPPORT-CASE-F-ID<br>PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION<br>PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID<br>PLAT-SUPPORT-CASE-F-STATUS | CREATE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | HIGH / REQUIRED | PERMISSION_DENIED / ACCESS_INACTIVE / ACCESS_EXPIRED / ACCESS_OTHER_RECORD / ACCESS_SCOPE_DENIED / SOURCE_VERSION_STALE / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-CLOSE-SUPPORT-CASE | Close an Audited Support Case | UPDATE |  | PLAT-SUPPORT-CASE-F-STATUS | OPEN → CLOSED | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-USE-SUPPORT-ACCESS | Use an Active AUD-authorized Support Session | READ | PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE | PLAT-SUPPORT-CASE-F-PURPOSE<br>PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE<br>PLAT-SUPPORT-CASE-F-AUDIT-REASON<br>PLAT-SUPPORT-CASE-F-AUD-SESSION-REF<br>PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION<br>PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID<br>PLAT-SUPPORT-CASE-F-STATUS | UNCHANGED | ROLE-PLATFORM-OPS | ROLE-PLATFORM-OPS / ROLE-PLATFORM-OPS / ROLE-STUDENT | HIGH / REQUIRED | PERMISSION_DENIED / NOT_FOUND / ACCESS_INACTIVE / ACCESS_EXPIRED / ACCESS_OTHER_RECORD / ACCESS_SCOPE_DENIED / SOURCE_VERSION_STALE / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |

## PLAT-PAGE-MOBILE-SUPPORT-CASE Mobile AUD-authorized Support Case

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| BUILD_READY | APP | PLAT-OBJ-SUPPORT-CASE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-PURPOSE | Support Case Purpose | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE | Requested Support Scope | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUDIT-REASON | Support Case Audit Reason | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUD-SESSION-REF | Pinned Audited Access Session | ID | 是 | OBJECT_REF: AUD-OBJ-ACCESS-SESSION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION | Pinned Audited Session Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID | Authorized Session Operator Projection | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-STATUS | Support Case Status | STRING | 是 | OPTION_SET: OPT-EXT-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-ACT-CREATE-SUPPORT-CASE | Create an AUD-authorized Support Case | CREATE | PLAT-SUPPORT-CASE-F-PURPOSE<br>PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE<br>PLAT-SUPPORT-CASE-F-AUDIT-REASON<br>PLAT-SUPPORT-CASE-F-AUD-SESSION-REF | PLAT-SUPPORT-CASE-F-ID<br>PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION<br>PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID<br>PLAT-SUPPORT-CASE-F-STATUS | CREATE | ROLE-PLATFORM-OPS | ROLE-STUDENT / ROLE-TEACHER | HIGH / REQUIRED | PERMISSION_DENIED / ACCESS_INACTIVE / ACCESS_EXPIRED / ACCESS_OTHER_RECORD / ACCESS_SCOPE_DENIED / SOURCE_VERSION_STALE / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 本页不登记 Web 入口。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
