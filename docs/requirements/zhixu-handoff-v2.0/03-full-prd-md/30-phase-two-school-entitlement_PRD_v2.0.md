交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。

# PLAT-002 Planned School-wide AI Assessment and Minimum Video Entitlement PRD v2.0

| 属性 | 值 |
| --- | --- |
| 阶段 | 2 |
| 交付状态 | PLANNED |
| 优先级 | P1 |
| 目标 | Define the second-stage school-wide minimum AI assessment and teaching-video guarantee without exposing it as a first-stage released capability |
| 基线决策 | `BASE-007` |
| NFR | `NFR-003`、`NFR-006`、`NFR-008` |
| 进入条件 | the school has an ACTIVE first-stage commercial boundary；the product enters the second-stage service release |
| 退出条件 | every second-stage school receives both core AI assessment and minimum video help；package expansion remains limited to capacity, concurrency, analytics, and general support |
| 依赖模块 | `PLAT-001` |

## 1. 范围与事实边界

- 本模块权威拥有 1 个对象、5 个动作。
- 模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。
- 页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。
- AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。

## 第二阶段学校核心权益合同

| 约束 | 合同值 |
| --- | --- |
| 权益对象 | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT |
| 学校字段 | PLAT-P2ENT-F-SCHOOL-REF |
| 服务计划绑定 | PLAT-OBJ-SERVICE-PLAN @ PLAT-P2ENT-F-SERVICE-PLAN-REF / PLAT-P2ENT-F-SERVICE-PLAN-VERSION |
| 服务计划状态 | ACTIVE |
| 核心权益 | CORE_AI_ASSESSMENT / MINIMUM_VIDEO_HELP |
| 全校保障 | true |
| 学生/监护人付费 | false |
| 核心学习闭环付费墙 | false |
| 激活动作 | PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT |
| 消费者规则 | EVERY_CORE_CONSUMER_PINS_ONE_EXACT_ACTIVE_SAME_SCHOOL_ENTITLEMENT_VERSION |

### 核心权益消费者

| 权益代码 | 消费 Action |
| --- | --- |
| CORE_AI_ASSESSMENT | GRD-ACT-PROCESS<br>PROG-ACT-SYNC-STUDENT-TARGET |
| MINIMUM_VIDEO_HELP | VIDEO-ACT-ENSURE-STUDENT-MINIMUM-ENTITLEMENT<br>VIDEO-ACT-ENSURE-SCHOOL-OVERFLOW-POOL |

## 2. 权威对象与字段合同

### PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT Planned School-wide Phase-two Core Entitlement

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 教师写入策略 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCHOOL_SERVICE_CONFIGURATION | SCHOOL | ROLE-PLATFORM-GOVERNANCE | ROLE-SCHOOL-ADMIN | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-GOVERNANCE | LIFE-001 | S3 | AUTHORIZED | — | DRAFT / CONFIRMED / ACTIVE / RESTRICTED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-P2ENT-F-ID | Planned School-wide Phase-two Core Entitlement ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| PLAT-P2ENT-F-SCHOOL-REF | Phase-two Entitled School | ID | 是 | OBJECT_REF: ACC-OBJ-SCHOOL | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| PLAT-P2ENT-F-SCHOOL-VERSION | Phase-two Entitled School Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| PLAT-P2ENT-F-SERVICE-PLAN-REF | Pinned Active School Service Plan | ID | 是 | OBJECT_REF: PLAT-OBJ-SERVICE-PLAN | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| PLAT-P2ENT-F-SERVICE-PLAN-VERSION | Pinned Active Service Plan Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-REF | Pinned School Commercial Boundary | ID | 是 | OBJECT_REF: PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-VERSION | Pinned Commercial Boundary Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| PLAT-P2ENT-F-CORE-AI-ENTITLEMENTS | School-wide Core AI Entitlements | STRING_ARRAY | 是 | OPTION_SET: OPT-EXT-021 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must include CORE_AI_ASSESSMENT and MINIMUM_VIDEO_HELP for every school entering phase-two service and cannot be split into student or guardian payment | retain the accepted value with actor, time, and version provenance |
| PLAT-P2ENT-F-PACKAGE-EXPANSION-SCOPE | Permitted Package Expansion Scope | STRING_ARRAY | 是 | OPTION_SET: OPT-EXT-020 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | may expand only capacity, concurrency, analytics, and general support; safety, appeal, data rights, and the core learning loop are never paid add-ons | retain the accepted value with actor, time, and version provenance |
| PLAT-P2ENT-F-STATUS | Phase-two Entitlement Status | STRING | 是 | OPTION_SET: OPT-EXT-026 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| PLAT-P2ENT-F-VERSION | Phase-two Entitlement Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |

## 3. 对象关系

| Relationship ID | 源对象 | 关系 | 目标对象 | 基数 | 所有权范围 | 源失效处理 |
| --- | --- | --- | --- | --- | --- | --- |

## 4. 可执行动作合同

| Action ID | 动作 | 目标对象 | 操作 | 授权边界 | 访问例外 | 输入 Field | 输出 Field | 状态效果 | ALLOW / DENY | 端 / 执行模式 | 风险 | 审计 | 幂等键 | 失败结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT | Create a Planned School-wide Phase-two Core Entitlement | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | CREATE | — | — | PLAT-P2ENT-F-SCHOOL-REF<br>PLAT-P2ENT-F-SCHOOL-VERSION<br>PLAT-P2ENT-F-SERVICE-PLAN-REF<br>PLAT-P2ENT-F-SERVICE-PLAN-VERSION<br>PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-REF<br>PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-VERSION | PLAT-P2ENT-F-ID<br>PLAT-P2ENT-F-CORE-AI-ENTITLEMENTS<br>PLAT-P2ENT-F-PACKAGE-EXPANSION-SCOPE<br>PLAT-P2ENT-F-STATUS<br>PLAT-P2ENT-F-VERSION | CREATE（成功状态由 PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT-SCN-SUCCESS 定义） | ALLOW:ROLE-PLATFORM-GOVERNANCE — platform governance may change only the school's versioned commercial or continuity boundary without opening student learning detail<br>DENY:ROLE-STUDENT — ROLE-STUDENT is outside the task-specific owner and authorized object scope<br>DENY:ROLE-GUARDIAN — ROLE-GUARDIAN is outside the task-specific owner and authorized object scope<br>DENY:ROLE-TEACHER — ROLE-TEACHER is outside the task-specific owner and authorized object scope<br>DENY:ROLE-PLATFORM-OPS — ROLE-PLATFORM-OPS is outside the task-specific owner and authorized object scope | WEB | HIGH | REQUIRED | PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT:school:object-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT | Confirm the Planned School-wide Phase-two Core Entitlement | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | UPDATE | — | — |  | PLAT-P2ENT-F-STATUS<br>PLAT-P2ENT-F-VERSION | DRAFT → CONFIRMED | ALLOW:ROLE-SCHOOL-ADMIN — the current actor matches the active governance administrator profile pinned on the commercial boundary and is distinct from its financial contact profile<br>DENY:ROLE-PLATFORM-OPS — platform operations cannot confirm a school's payer, entitlement, or governance separation<br>DENY:CURRENT_ACTOR — the current actor is only the financial contact or does not match the pinned governance administrator profile | WEB | HIGH | REQUIRED | PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT:school:object-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT | Activate a Confirmed School-wide Phase-two Core Entitlement | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | UPDATE | — | — | PLAT-P2ENT-F-SERVICE-PLAN-REF<br>PLAT-P2ENT-F-SERVICE-PLAN-VERSION | PLAT-P2ENT-F-STATUS<br>PLAT-P2ENT-F-VERSION | CONFIRMED → ACTIVE | ALLOW:ROLE-PLATFORM-GOVERNANCE — platform governance may change only the school's versioned commercial or continuity boundary without opening student learning detail<br>DENY:ROLE-STUDENT — ROLE-STUDENT is outside the task-specific owner and authorized object scope<br>DENY:ROLE-GUARDIAN — ROLE-GUARDIAN is outside the task-specific owner and authorized object scope<br>DENY:ROLE-TEACHER — ROLE-TEACHER is outside the task-specific owner and authorized object scope<br>DENY:ROLE-PLATFORM-OPS — ROLE-PLATFORM-OPS is outside the task-specific owner and authorized object scope | WEB | HIGH | REQUIRED | PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT:school:object-version:request-id | PERMISSION_DENIED / SERVICE_PLAN_NOT_ACTIVE / SCHOOL_SCOPE_MISMATCH / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT | Resolve the Exact Active School Phase-two Entitlement | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | READ | — | — | PLAT-P2ENT-F-SCHOOL-REF<br>PLAT-P2ENT-F-SCHOOL-VERSION | PLAT-P2ENT-F-ID<br>PLAT-P2ENT-F-SCHOOL-REF<br>PLAT-P2ENT-F-SCHOOL-VERSION<br>PLAT-P2ENT-F-SERVICE-PLAN-REF<br>PLAT-P2ENT-F-SERVICE-PLAN-VERSION<br>PLAT-P2ENT-F-CORE-AI-ENTITLEMENTS<br>PLAT-P2ENT-F-STATUS<br>PLAT-P2ENT-F-VERSION | UNCHANGED | ALLOW:SYSTEM — the system resolves exactly one ACTIVE phase-two entitlement for the school derived from the pinned service object<br>DENY:CURRENT_ACTOR — CURRENT_ACTOR is outside the task-specific owner and authorized object scope<br>DENY:ROLE-PLATFORM-OPS — ROLE-PLATFORM-OPS is outside the task-specific owner and authorized object scope | FLOW_INTERNAL | READ | NOT_REQUIRED | — | PHASE_TWO_ENTITLEMENT_INACTIVE / PHASE_TWO_SERVICE_PLAN_NOT_ACTIVE / SERVICE_CONTINUITY_NOT_PROTECTED / ENTITLEMENT_DECISION_UNAVAILABLE / SCHOOL_SCOPE_MISMATCH |
| PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT | Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | UPDATE | — | — | PLAT-P2ENT-F-SERVICE-PLAN-REF<br>PLAT-P2ENT-F-SERVICE-PLAN-VERSION | PLAT-P2ENT-F-STATUS<br>PLAT-P2ENT-F-VERSION | ACTIVE → RESTRICTED | ALLOW:SYSTEM — the exact ACTIVE entitlement pinned to the service-plan identity and pre-restriction version is restricted after the committed plan restriction event<br>DENY:CURRENT_ACTOR — CURRENT_ACTOR is outside the task-specific owner and authorized object scope<br>DENY:ROLE-PLATFORM-OPS — ROLE-PLATFORM-OPS is outside the task-specific owner and authorized object scope | SYSTEM_EVENT | HIGH | REQUIRED | PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT:school:object-version:request-id | PERMISSION_DENIED / SERVICE_PLAN_RESTRICTION_EVENT_INVALID / SERVICE_PLAN_SOURCE_VERSION_MISMATCH / PHASE_TWO_ENTITLEMENT_SOURCE_AMBIGUOUS / VERSION_CONFLICT / AUDIT_FAILED |

## 6. 状态可达性

| Object ID | 状态 | 进入动作 | 离开动作 |
| --- | --- | --- | --- |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | DRAFT | PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT | PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | CONFIRMED | PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT | PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | ACTIVE | PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT | PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | RESTRICTED | PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT |  |

## 7. 参与数据流

| Flow ID | 数据流 | 阶段 | 参与模块 | 本模块动作 | 失败与补偿 |
| --- | --- | --- | --- | --- | --- |
| DF-006 | Submission to AI Assessment and Completion Determination | 2 | HW-001 / SUB-001 / GRD-001 / PLAT-002 | PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT | SUBMISSION_ITEM_AI_ASSESSMENT_RESULT_VERSION；{"strategy":"RETRY_FAILED_AI_ASSESSMENT_WITHOUT_CHANGING_SUBMISSION_FACTS","maxAttempts":3,"retryableFailureResults":["AI_UNAVAILABLE","VERSION_CONFLICT"]}；{"strategy":"KEEP_UNPUBLISHED_AND_RETURN_AN_EXPLICIT_RECOVERY_NEXT_STEP","description":"an AI failure preserves the accepted submission and frozen standard, then requests concrete supplementation, permitted alternate review, or bounded professional exception review"}；{"strategy":"INVALIDATE_STALE_AI_ASSESSMENT_DERIVED_VIEWS","targets":["AI assessment result","exception queue","publication eligibility"]} |
| DF-018 | Restricted Service Plan to Irreversibly Restricted Phase-two Entitlement | 2 | PLAT-001 / PLAT-002 | PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT | ONE_SERVICE_PLAN_RESTRICTION_VERSION_AND_ITS_EXACT_ACTIVE_PHASE_TWO_ENTITLEMENT；{"strategy":"REDELIVER_THE_COMMITTED_RESTRICTION_EVENT_AND_REVALIDATE_THE_EXACT_SOURCE_VERSION","maxAttempts":8,"retryableFailureResults":["VERSION_CONFLICT"]}；{"strategy":"NEVER_REACTIVATE_THE_RESTRICTED_SERVICE_PLAN_OR_ENTITLEMENT","description":"an outbox failure leaves the plan ACTIVE and uncommitted; a downstream failure keeps the plan RESTRICTED, blocks new or non-protected consumers through synchronous source-plan revalidation, preserves only exact finite D091 published-activity completion, and retries entitlement restriction idempotently"}；{"strategy":"BLOCK_NEW_OR_NON_PROTECTED_PHASE_TWO_CONSUMPTION_AFTER_THE_FINITE_D091_BRANCH_CLOSES","targets":["AI assessment processing outside an exact protected published-activity entry and finite window","student progress target creation","student minimum video entitlement creation","school video overflow pool creation"]} |

## 8. 页面任务合同

| Page ID | 页面 | 交付可用性 | 端 | 对象 | 字段 | 动作 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-PAGE-PHASE-TWO-ENTITLEMENT | Planned School-wide Phase-two Entitlement Workspace | PLANNED | WEB | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-ID<br>PLAT-P2ENT-F-SCHOOL-REF<br>PLAT-P2ENT-F-SCHOOL-VERSION<br>PLAT-P2ENT-F-SERVICE-PLAN-REF<br>PLAT-P2ENT-F-SERVICE-PLAN-VERSION<br>PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-REF<br>PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-VERSION<br>PLAT-P2ENT-F-CORE-AI-ENTITLEMENTS<br>PLAT-P2ENT-F-PACKAGE-EXPANSION-SCOPE<br>PLAT-P2ENT-F-STATUS<br>PLAT-P2ENT-F-VERSION | PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT<br>PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT<br>PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |

## 9. 验收场景

| Scenario ID | 类型 | Action ID | Given | When | Expected Data | Expected State | Permission | 失败码 / 谓词 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT-SCN-SUCCESS | SUCCESS | PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT | the authorized actor satisfies the task-specific entry conditions for Create a Planned School-wide Phase-two Core Entitlement | the actor requests Create a Planned School-wide Phase-two Core Entitlement | Create a Planned School-wide Phase-two Core Entitlement returns the accepted versioned task result without widening scope | DRAFT | ALLOW |  |
| PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT-SCN-PERMISSION_DENIED | FAILURE | PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT | PERMISSION_DENIED blocks Create a Planned School-wide Phase-two Core Entitlement | the actor requests Create a Planned School-wide Phase-two Core Entitlement | Create a Planned School-wide Phase-two Core Entitlement returns PERMISSION_DENIED and performs no hidden write | UNCHANGED | DENY | PERMISSION_DENIED |
| PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT-SCN-VALIDATION_FAILED | FAILURE | PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT | VALIDATION_FAILED blocks Create a Planned School-wide Phase-two Core Entitlement | the actor requests Create a Planned School-wide Phase-two Core Entitlement | Create a Planned School-wide Phase-two Core Entitlement returns VALIDATION_FAILED and performs no hidden write | UNCHANGED | DENY | VALIDATION_FAILED |
| PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT-SCN-VERSION_CONFLICT | FAILURE | PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT | VERSION_CONFLICT blocks Create a Planned School-wide Phase-two Core Entitlement | the actor requests Create a Planned School-wide Phase-two Core Entitlement | Create a Planned School-wide Phase-two Core Entitlement returns VERSION_CONFLICT and performs no hidden write | UNCHANGED | DENY | VERSION_CONFLICT |
| PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT-SCN-AUDIT_FAILED | FAILURE | PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT | AUDIT_FAILED blocks Create a Planned School-wide Phase-two Core Entitlement | the actor requests Create a Planned School-wide Phase-two Core Entitlement | Create a Planned School-wide Phase-two Core Entitlement returns AUDIT_FAILED and performs no hidden write | UNCHANGED | DENY | AUDIT_FAILED |
| PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT-SCN-SUCCESS | SUCCESS | PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT | the authorized actor satisfies the task-specific entry conditions for Confirm the Planned School-wide Phase-two Core Entitlement | the actor requests Confirm the Planned School-wide Phase-two Core Entitlement | Confirm the Planned School-wide Phase-two Core Entitlement returns the accepted versioned task result without widening scope | CONFIRMED | ALLOW |  |
| PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT-SCN-PERMISSION_DENIED | FAILURE | PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT | PERMISSION_DENIED blocks Confirm the Planned School-wide Phase-two Core Entitlement | the actor requests Confirm the Planned School-wide Phase-two Core Entitlement | Confirm the Planned School-wide Phase-two Core Entitlement returns PERMISSION_DENIED and performs no hidden write | UNCHANGED | DENY | PERMISSION_DENIED |
| PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT-SCN-VALIDATION_FAILED | FAILURE | PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT | VALIDATION_FAILED blocks Confirm the Planned School-wide Phase-two Core Entitlement | the actor requests Confirm the Planned School-wide Phase-two Core Entitlement | Confirm the Planned School-wide Phase-two Core Entitlement returns VALIDATION_FAILED and performs no hidden write | UNCHANGED | DENY | VALIDATION_FAILED |
| PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT-SCN-VERSION_CONFLICT | FAILURE | PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT | VERSION_CONFLICT blocks Confirm the Planned School-wide Phase-two Core Entitlement | the actor requests Confirm the Planned School-wide Phase-two Core Entitlement | Confirm the Planned School-wide Phase-two Core Entitlement returns VERSION_CONFLICT and performs no hidden write | UNCHANGED | DENY | VERSION_CONFLICT |
| PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT-SCN-AUDIT_FAILED | FAILURE | PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT | AUDIT_FAILED blocks Confirm the Planned School-wide Phase-two Core Entitlement | the actor requests Confirm the Planned School-wide Phase-two Core Entitlement | Confirm the Planned School-wide Phase-two Core Entitlement returns AUDIT_FAILED and performs no hidden write | UNCHANGED | DENY | AUDIT_FAILED |
| PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT-SCN-SUCCESS | SUCCESS | PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT | the authorized actor satisfies the task-specific entry conditions for Activate a Confirmed School-wide Phase-two Core Entitlement | the actor requests Activate a Confirmed School-wide Phase-two Core Entitlement | Activate a Confirmed School-wide Phase-two Core Entitlement returns the accepted versioned task result without widening scope | ACTIVE | ALLOW |  |
| PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT-SCN-PERMISSION_DENIED | FAILURE | PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT | PERMISSION_DENIED blocks Activate a Confirmed School-wide Phase-two Core Entitlement | the actor requests Activate a Confirmed School-wide Phase-two Core Entitlement | Activate a Confirmed School-wide Phase-two Core Entitlement returns PERMISSION_DENIED and performs no hidden write | UNCHANGED | DENY | PERMISSION_DENIED |
| PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT-SCN-SERVICE_PLAN_NOT_ACTIVE | FAILURE | PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT | SERVICE_PLAN_NOT_ACTIVE blocks Activate a Confirmed School-wide Phase-two Core Entitlement | the actor requests Activate a Confirmed School-wide Phase-two Core Entitlement | Activate a Confirmed School-wide Phase-two Core Entitlement returns SERVICE_PLAN_NOT_ACTIVE and performs no hidden write | UNCHANGED | DENY | SERVICE_PLAN_NOT_ACTIVE |
| PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT-SCN-SCHOOL_SCOPE_MISMATCH | FAILURE | PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT | SCHOOL_SCOPE_MISMATCH blocks Activate a Confirmed School-wide Phase-two Core Entitlement | the actor requests Activate a Confirmed School-wide Phase-two Core Entitlement | Activate a Confirmed School-wide Phase-two Core Entitlement returns SCHOOL_SCOPE_MISMATCH and performs no hidden write | UNCHANGED | DENY | SCHOOL_SCOPE_MISMATCH |
| PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT-SCN-VALIDATION_FAILED | FAILURE | PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT | VALIDATION_FAILED blocks Activate a Confirmed School-wide Phase-two Core Entitlement | the actor requests Activate a Confirmed School-wide Phase-two Core Entitlement | Activate a Confirmed School-wide Phase-two Core Entitlement returns VALIDATION_FAILED and performs no hidden write | UNCHANGED | DENY | VALIDATION_FAILED |
| PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT-SCN-VERSION_CONFLICT | FAILURE | PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT | VERSION_CONFLICT blocks Activate a Confirmed School-wide Phase-two Core Entitlement | the actor requests Activate a Confirmed School-wide Phase-two Core Entitlement | Activate a Confirmed School-wide Phase-two Core Entitlement returns VERSION_CONFLICT and performs no hidden write | UNCHANGED | DENY | VERSION_CONFLICT |
| PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT-SCN-AUDIT_FAILED | FAILURE | PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT | AUDIT_FAILED blocks Activate a Confirmed School-wide Phase-two Core Entitlement | the actor requests Activate a Confirmed School-wide Phase-two Core Entitlement | Activate a Confirmed School-wide Phase-two Core Entitlement returns AUDIT_FAILED and performs no hidden write | UNCHANGED | DENY | AUDIT_FAILED |
| PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT-SCN-SUCCESS | SUCCESS | PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT | the authorized actor satisfies the task-specific entry conditions for Resolve the Exact Active School Phase-two Entitlement | the actor requests Resolve the Exact Active School Phase-two Entitlement | Resolve the Exact Active School Phase-two Entitlement returns the accepted versioned task result without widening scope | UNCHANGED | ALLOW |  |
| PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT-SCN-PHASE_TWO_ENTITLEMENT_INACTIVE | FAILURE | PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT | PHASE_TWO_ENTITLEMENT_INACTIVE blocks Resolve the Exact Active School Phase-two Entitlement | the actor requests Resolve the Exact Active School Phase-two Entitlement | Resolve the Exact Active School Phase-two Entitlement returns PHASE_TWO_ENTITLEMENT_INACTIVE and performs no hidden write | UNCHANGED | DENY | PHASE_TWO_ENTITLEMENT_INACTIVE |
| PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT-SCN-PHASE_TWO_SERVICE_PLAN_NOT_ACTIVE | FAILURE | PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT | PHASE_TWO_SERVICE_PLAN_NOT_ACTIVE blocks Resolve the Exact Active School Phase-two Entitlement | the actor requests Resolve the Exact Active School Phase-two Entitlement | Resolve the Exact Active School Phase-two Entitlement returns PHASE_TWO_SERVICE_PLAN_NOT_ACTIVE and performs no hidden write | UNCHANGED | DENY | PHASE_TWO_SERVICE_PLAN_NOT_ACTIVE |
| PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT-SCN-SERVICE_CONTINUITY_NOT_PROTECTED | FAILURE | PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT | SERVICE_CONTINUITY_NOT_PROTECTED blocks Resolve the Exact Active School Phase-two Entitlement | the actor requests Resolve the Exact Active School Phase-two Entitlement | Resolve the Exact Active School Phase-two Entitlement returns SERVICE_CONTINUITY_NOT_PROTECTED and performs no hidden write | UNCHANGED | DENY | SERVICE_CONTINUITY_NOT_PROTECTED |
| PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT-SCN-ENTITLEMENT_DECISION_UNAVAILABLE | FAILURE | PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT | ENTITLEMENT_DECISION_UNAVAILABLE blocks Resolve the Exact Active School Phase-two Entitlement | the actor requests Resolve the Exact Active School Phase-two Entitlement | Resolve the Exact Active School Phase-two Entitlement returns ENTITLEMENT_DECISION_UNAVAILABLE and performs no hidden write | UNCHANGED | DENY | ENTITLEMENT_DECISION_UNAVAILABLE |
| PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT-SCN-SCHOOL_SCOPE_MISMATCH | FAILURE | PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT | SCHOOL_SCOPE_MISMATCH blocks Resolve the Exact Active School Phase-two Entitlement | the actor requests Resolve the Exact Active School Phase-two Entitlement | Resolve the Exact Active School Phase-two Entitlement returns SCHOOL_SCOPE_MISMATCH and performs no hidden write | UNCHANGED | DENY | SCHOOL_SCOPE_MISMATCH |
| PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT-SCN-SUCCESS | SUCCESS | PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT | the authorized actor satisfies the task-specific entry conditions for Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | the actor requests Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | Restrict the Phase-two Entitlement Bound to a Restricted Service Plan returns the accepted versioned task result without widening scope | RESTRICTED | ALLOW |  |
| PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT-SCN-PERMISSION_DENIED | FAILURE | PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT | PERMISSION_DENIED blocks Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | the actor requests Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | Restrict the Phase-two Entitlement Bound to a Restricted Service Plan returns PERMISSION_DENIED and performs no hidden write | UNCHANGED | DENY | PERMISSION_DENIED |
| PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT-SCN-SERVICE_PLAN_RESTRICTION_EVENT_INVALID | FAILURE | PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT | SERVICE_PLAN_RESTRICTION_EVENT_INVALID blocks Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | the actor requests Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | Restrict the Phase-two Entitlement Bound to a Restricted Service Plan returns SERVICE_PLAN_RESTRICTION_EVENT_INVALID and performs no hidden write | UNCHANGED | DENY | SERVICE_PLAN_RESTRICTION_EVENT_INVALID |
| PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT-SCN-SERVICE_PLAN_SOURCE_VERSION_MISMATCH | FAILURE | PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT | SERVICE_PLAN_SOURCE_VERSION_MISMATCH blocks Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | the actor requests Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | Restrict the Phase-two Entitlement Bound to a Restricted Service Plan returns SERVICE_PLAN_SOURCE_VERSION_MISMATCH and performs no hidden write | UNCHANGED | DENY | SERVICE_PLAN_SOURCE_VERSION_MISMATCH |
| PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT-SCN-PHASE_TWO_ENTITLEMENT_SOURCE_AMBIGUOUS | FAILURE | PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT | PHASE_TWO_ENTITLEMENT_SOURCE_AMBIGUOUS blocks Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | the actor requests Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | Restrict the Phase-two Entitlement Bound to a Restricted Service Plan returns PHASE_TWO_ENTITLEMENT_SOURCE_AMBIGUOUS and performs no hidden write | UNCHANGED | DENY | PHASE_TWO_ENTITLEMENT_SOURCE_AMBIGUOUS |
| PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT-SCN-VERSION_CONFLICT | FAILURE | PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT | VERSION_CONFLICT blocks Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | the actor requests Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | Restrict the Phase-two Entitlement Bound to a Restricted Service Plan returns VERSION_CONFLICT and performs no hidden write | UNCHANGED | DENY | VERSION_CONFLICT |
| PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT-SCN-AUDIT_FAILED | FAILURE | PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT | AUDIT_FAILED blocks Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | the actor requests Restrict the Phase-two Entitlement Bound to a Restricted Service Plan | Restrict the Phase-two Entitlement Bound to a Restricted Service Plan returns AUDIT_FAILED and performs no hidden write | UNCHANGED | DENY | AUDIT_FAILED |

## 10. AI 任务映射

| Task ID | 任务 | 类型 | 目标 Action | 受众 | 确认者 | 预览字段 | 失败行为 |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 11. 研发与测试就绪门禁

- 实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。
- 所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。
- 每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。
- 每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。
- Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。
