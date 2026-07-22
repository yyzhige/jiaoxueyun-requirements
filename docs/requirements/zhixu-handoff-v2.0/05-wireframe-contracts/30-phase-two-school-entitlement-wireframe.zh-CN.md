交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。

# PLAT-002 Planned School-wide AI Assessment and Minimum Video Entitlement Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | PLAT-002 |
| 阶段 | 2 |
| 交付状态 | PLANNED |
| 页面数量 | 1 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## PLAT-PAGE-PHASE-TWO-ENTITLEMENT Planned School-wide Phase-two Entitlement Workspace

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-ID | Planned School-wide Phase-two Core Entitlement ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-SCHOOL-REF | Phase-two Entitled School | ID | 是 | OBJECT_REF: ACC-OBJ-SCHOOL | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-SCHOOL-VERSION | Phase-two Entitled School Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-SERVICE-PLAN-REF | Pinned Active School Service Plan | ID | 是 | OBJECT_REF: PLAT-OBJ-SERVICE-PLAN | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-SERVICE-PLAN-VERSION | Pinned Active Service Plan Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-REF | Pinned School Commercial Boundary | ID | 是 | OBJECT_REF: PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-VERSION | Pinned Commercial Boundary Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-CORE-AI-ENTITLEMENTS | School-wide Core AI Entitlements | STRING_ARRAY | 是 | OPTION_SET: OPT-EXT-021 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must include CORE_AI_ASSESSMENT and MINIMUM_VIDEO_HELP for every school entering phase-two service and cannot be split into student or guardian payment |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-PACKAGE-EXPANSION-SCOPE | Permitted Package Expansion Scope | STRING_ARRAY | 是 | OPTION_SET: OPT-EXT-020 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | may expand only capacity, concurrency, analytics, and general support; safety, appeal, data rights, and the core learning loop are never paid add-ons |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-STATUS | Phase-two Entitlement Status | STRING | 是 | OPTION_SET: OPT-EXT-026 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-VERSION | Phase-two Entitlement Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared task-specific data type and authorized school scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT | Create a Planned School-wide Phase-two Core Entitlement | CREATE | PLAT-P2ENT-F-SCHOOL-REF<br>PLAT-P2ENT-F-SCHOOL-VERSION<br>PLAT-P2ENT-F-SERVICE-PLAN-REF<br>PLAT-P2ENT-F-SERVICE-PLAN-VERSION<br>PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-REF<br>PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-VERSION | PLAT-P2ENT-F-ID<br>PLAT-P2ENT-F-CORE-AI-ENTITLEMENTS<br>PLAT-P2ENT-F-PACKAGE-EXPANSION-SCOPE<br>PLAT-P2ENT-F-STATUS<br>PLAT-P2ENT-F-VERSION | CREATE | ROLE-PLATFORM-GOVERNANCE | ROLE-STUDENT / ROLE-GUARDIAN / ROLE-TEACHER / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-CONFIRM-PHASE-TWO-ENTITLEMENT | Confirm the Planned School-wide Phase-two Core Entitlement | UPDATE |  | PLAT-P2ENT-F-STATUS<br>PLAT-P2ENT-F-VERSION | DRAFT → CONFIRMED | ROLE-SCHOOL-ADMIN | ROLE-PLATFORM-OPS / CURRENT_ACTOR | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PLAT-ACT-ACTIVATE-PHASE-TWO-ENTITLEMENT | Activate a Confirmed School-wide Phase-two Core Entitlement | UPDATE | PLAT-P2ENT-F-SERVICE-PLAN-REF<br>PLAT-P2ENT-F-SERVICE-PLAN-VERSION | PLAT-P2ENT-F-STATUS<br>PLAT-P2ENT-F-VERSION | CONFIRMED → ACTIVE | ROLE-PLATFORM-GOVERNANCE | ROLE-STUDENT / ROLE-GUARDIAN / ROLE-TEACHER / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / SERVICE_PLAN_NOT_ACTIVE / SCHOOL_SCOPE_MISMATCH / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 本页不登记 App 入口。 |
