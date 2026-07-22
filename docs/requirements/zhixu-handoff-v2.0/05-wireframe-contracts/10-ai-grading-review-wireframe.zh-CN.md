交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。

# GRD-001 AI Assessment and Completion Determination Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | GRD-001 |
| 阶段 | 2 |
| 交付状态 | PLANNED |
| 页面数量 | 1 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## GRD-PAGE-DECISION AI Assessment Exception and Source Correction Workspace

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | GRD-OBJ-CAPABILITY-RULE / GRD-OBJ-DECISION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-RULE-ID | Capability Rule ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-RULE-VERSION | Capability Rule Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SOURCE-REF | Capability Rule Source Reference | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SOURCE-VERSION | Capability Rule Source Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SUBJECT-FAMILY | Subject Family | STRING | 是 | OPTION_SET: OPT-TL-003 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-QUESTION-TYPE | Question Type | STRING | 是 | OPTION_SET: OPT-ENUM-003 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SUBMISSION-METHOD | Submission Method | STRING | 是 | OPTION_SET: OPT-ENUM-031 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-RECOGNITION-LEVEL | Recognition Level | STRING | 是 | OPTION_SET: OPT-TL-004 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SCORING-LEVEL | Scoring Level | STRING | 是 | OPTION_SET: OPT-TL-005 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-REQUIRED-EVIDENCE | Required Evidence | STRING_ARRAY | 是 | OPTION_SET: OPT-TL-006 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-TEACHER-REVIEW | Professional Exception Review Requirement | STRING | 是 | OPTION_SET: OPT-ENUM-001 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-BATCH-CONFIRM | Automated Batch Determination Eligibility | STRING | 是 | OPTION_SET: OPT-TL-007 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-UNAVAILABLE-FALLBACK | Unable-to-determine Recovery Route | STRING | 是 | OPTION_SET: OPT-TL-008 | READ_ONLY | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-ID | AI Assessment Result ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-RECOGNIZED-ANSWER | Recognized Answer | TEXT | required when AI assessment processing produces recognition evidence；状态=PROCESSING；动作=GRD-ACT-PROCESS | SYSTEM | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-RECOGNIZED-REGION | Recognized Region | TEXT | required when AI assessment processing produces recognition evidence；状态=PROCESSING；动作=GRD-ACT-PROCESS | SYSTEM | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-SUBMISSION-REF | Input Submission Reference | ID | 是 | OBJECT_REF: SUB-OBJ-ATTEMPT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-SUBMISSION-VERSION | Input Submission Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-ITEM-REF | Input Item Reference | ID | 是 | OBJECT_REF: HW-OBJ-ITEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-ITEM-VERSION | Input Item Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-RUBRIC-REF | Frozen Assessment Standard Reference | ID | 是 | OBJECT_REF: GRD-OBJ-ASSESSMENT-STANDARD-VERSION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-RUBRIC-VERSION | Frozen Assessment Standard Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-CAPABILITY-RULE-REF | Capability Rule Reference | ID | 是 | OBJECT_REF: GRD-OBJ-CAPABILITY-RULE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-CAPABILITY-RULE-VERSION | Capability Rule Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-SUGGESTED-SCORE | Suggested Score | DECIMAL | required when AI assessment processing produces a scoring suggestion；状态=PROCESSING；动作=GRD-ACT-PROCESS | SYSTEM | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-SCORING-RATIONALE | Scoring Rationale | TEXT | required when AI assessment processing produces a scoring suggestion；状态=PROCESSING；动作=GRD-ACT-PROCESS | SYSTEM | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-CONFIDENCE | Confidence Status | STRING | required when AI assessment processing produces a scoring suggestion；状态=PROCESSING；动作=GRD-ACT-PROCESS | OPTION_SET: OPT-ENUM-005 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-LIMITATION | Limitation Note | TEXT | required when AI assessment processing produces a scoring suggestion；状态=PROCESSING；动作=GRD-ACT-PROCESS | SYSTEM | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-OFFICIAL-SCORE | Effective Activity Score or Level (optional) | DECIMAL | required when the AI assessment result reaches EXCEPTION_RESOLVED；状态=EXCEPTION_RESOLVED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-TEACHER-FEEDBACK | Professional Exception Feedback (exception only) | TEXT | required when the AI assessment result reaches EXCEPTION_RESOLVED；状态=EXCEPTION_RESOLVED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-CORRECTION-REASON | Evidence-backed Correction or Exception Reason | STRING | required when correcting recognition, overriding a score, or revising a confirmed decision；状态=AI_DETERMINED/EXCEPTION_RESOLVED/CORRECTION_PENDING/QUEUED；动作=GRD-ACT-CORRECT-RECOGNITION/GRD-ACT-OVERRIDE-SCORE/GRD-ACT-OPEN-CONFIRMED-REVISION/GRD-ACT-CONFIRM-REVISION/GRD-ACT-RESOLVE-VERSION-CONFLICT | OPTION_SET: OPT-ENUM-006 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-DECISION-VERSION | Decision Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-PRIOR-DECISION-VERSION | Prior Effective Assessment Result Version | INTEGER | required when revising a confirmed decision；状态=CORRECTION_PENDING；动作=GRD-ACT-OPEN-CONFIRMED-REVISION | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-ROUTE | AI Assessment Route | STRING | required when the AI assessment result reaches AI_DETERMINED or EXCEPTION_REVIEW_REQUIRED；状态=AI_DETERMINED/EXCEPTION_REVIEW_REQUIRED | OPTION_SET: OPT-TL-011 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-CORE-ENTITLEMENT-REF | Pinned Active School Phase-two Core Entitlement | ID | required whenever the queued decision is processed by the second-stage AI assessment service；状态=PROCESSING；动作=GRD-ACT-PROCESS | OBJECT_REF: PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-CORE-ENTITLEMENT-VERSION | Pinned Active School Phase-two Core Entitlement Version | INTEGER | required with the exact school phase-two entitlement used for AI assessment；状态=PROCESSING；动作=GRD-ACT-PROCESS | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-PROCESSING-STATUS | AI Assessment Processing Status | STRING | 是 | OPTION_SET: OPT-AI2-001 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-NEXT-STEP | Explicit Completion-determination Next Step | STRING | required for every determined, unable-to-determine, or professionally resolved assessment result；状态=AI_DETERMINED/EXCEPTION_REVIEW_REQUIRED/EXCEPTION_RESOLVED；动作=GRD-ACT-ROUTE/GRD-ACT-ROUTE-UNSUPPORTED/GRD-ACT-ROUTE-AI-UNAVAILABLE/GRD-ACT-ACCEPT-SUGGESTION/GRD-ACT-OVERRIDE-SCORE/GRD-ACT-MANUAL-GRADE/GRD-ACT-BATCH-CONFIRM/GRD-ACT-CONFIRM-REVISION | OPTION_SET: OPT-AI2-005 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF | Initial Attempt Classification Reference | ID | 是 | OBJECT_REF: GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION | Initial Attempt Classification Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-DERIVATION-VALIDITY-STATUS | Assessment Derivation Validity | STRING | 是 | OPTION_SET: OPT-AI2-004 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-DERIVATION-DISPUTE-STATUS | Assessment Derivation Dispute Status | STRING | 是 | OPTION_SET: OPT-AI2-003 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-PRIOR-DECISION-REF | Prior Assessment Decision Reference | ID | required when revising a confirmed decision；状态=CORRECTION_PENDING；动作=GRD-ACT-OPEN-CONFIRMED-REVISION | OBJECT_REF: GRD-OBJ-DECISION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-ACTIVITY-SNAPSHOT-REF | Published Activity Snapshot Reference | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-ACTIVITY-SNAPSHOT-VERSION | Published Activity Snapshot Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-HELP-ENVIRONMENT | Actual Help Environment | JSON | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-INPUT-QUALITY | Input and Recognition Quality | STRING_ARRAY | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-EVIDENCE-REFS | Verifiable Evidence References | STRING_ARRAY | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-CONCLUSION | AI Assessment Conclusion | TEXT | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-FEEDBACK-REF | Versioned Feedback Reference | ID | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-DECISION-F-NEXT-ACTION | Concrete Next Action | TEXT | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-TRACE-F-BUSINESS-TASK-ID | AI Business Task ID | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-TRACE-F-EXTERNAL-REFERENCE | External Processing Reference | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-TRACE-F-MODEL-VERSION | Model Version | STRING | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-TRACE-F-CAPABILITY-VERSION | AI Capability Version | STRING | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-TRACE-F-RULE-VERSION | Assessment Rule Version | STRING | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-TRACE-F-SAFETY-VERSION | Safety Policy Version | STRING | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-TRACE-F-EVIDENCE-REFERENCES | Trace Evidence References | STRING_ARRAY | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-TRACE-F-RESULT-REFERENCE | Trace Result Reference | ID | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| GRD-OBJ-DECISION | GRD-TRACE-F-GATE-OUTCOMES | Trace Gate Outcomes | STRING_ARRAY | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GRD-ACT-CORRECT-RECOGNITION | Correct a Derived Recognition Version | UPDATE | GRD-DECISION-F-RECOGNIZED-ANSWER<br>GRD-DECISION-F-RECOGNIZED-REGION<br>GRD-DECISION-F-CORRECTION-REASON | GRD-DECISION-F-CORRECTION-REASON<br>GRD-DECISION-F-DECISION-VERSION | AI_DETERMINED → AI_DETERMINED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| GRD-ACT-ACCEPT-SUGGESTION | Resolve an Authorized Exception Using the Existing AI Result | UPDATE | GRD-DECISION-F-SUGGESTED-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF<br>GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-DECISION-VERSION<br>GRD-DECISION-F-PROCESSING-STATUS<br>GRD-DECISION-F-NEXT-STEP<br>GRD-DECISION-F-NEXT-ACTION | AI_DETERMINED → EXCEPTION_RESOLVED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / SUBJECTIVE_REVIEW_REQUIRED / STALE_INPUT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| GRD-ACT-OVERRIDE-SCORE | Create an Evidence-backed Professional Exception Correction | UPDATE | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-CORRECTION-REASON<br>GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF<br>GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-CORRECTION-REASON<br>GRD-DECISION-F-DECISION-VERSION<br>GRD-DECISION-F-PROCESSING-STATUS<br>GRD-DECISION-F-NEXT-STEP<br>GRD-DECISION-F-NEXT-ACTION | AI_DETERMINED → EXCEPTION_RESOLVED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / CORRECTION_REASON_REQUIRED / STALE_INPUT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| GRD-ACT-MANUAL-GRADE | Resolve an Authorized Professional Assessment Exception | UPDATE | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF<br>GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-DECISION-VERSION<br>GRD-DECISION-F-PROCESSING-STATUS<br>GRD-DECISION-F-NEXT-STEP<br>GRD-DECISION-F-NEXT-ACTION | EXCEPTION_REVIEW_REQUIRED → EXCEPTION_RESOLVED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / MISSING_REQUIRED_EVIDENCE / STALE_INPUT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| GRD-ACT-BATCH-CONFIRM | Resolve a Bounded Batch Professional Exception Scope | UPDATE | GRD-DECISION-F-SUGGESTED-SCORE<br>GRD-DECISION-F-SCORING-RATIONALE<br>GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF<br>GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-DECISION-VERSION<br>GRD-DECISION-F-PROCESSING-STATUS<br>GRD-DECISION-F-NEXT-STEP<br>GRD-DECISION-F-NEXT-ACTION | AI_DETERMINED → EXCEPTION_RESOLVED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / SUBJECTIVE_ITEMS_INELIGIBLE / LOW_CONFIDENCE_INELIGIBLE / VERSION_CONFLICT / AUDIT_FAILED |
| GRD-ACT-OPEN-CONFIRMED-REVISION | Open an Evidence-backed Result Correction Version | UPDATE | GRD-DECISION-F-CORRECTION-REASON | GRD-DECISION-F-CORRECTION-REASON<br>GRD-DECISION-F-PRIOR-DECISION-VERSION<br>GRD-DECISION-F-DECISION-VERSION<br>GRD-DECISION-F-PRIOR-DECISION-REF<br>GRD-DECISION-F-DERIVATION-VALIDITY-STATUS<br>GRD-DECISION-F-DERIVATION-DISPUTE-STATUS | EXCEPTION_RESOLVED → CORRECTION_PENDING | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / CORRECTION_REASON_REQUIRED / VERSION_CONFLICT / AUDIT_FAILED |
| GRD-ACT-CONFIRM-REVISION | Publish a Professional Exception Correction Version | UPDATE | GRD-DECISION-F-OFFICIAL-SCORE<br>GRD-DECISION-F-TEACHER-FEEDBACK<br>GRD-DECISION-F-CORRECTION-REASON<br>GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF<br>GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION | GRD-DECISION-F-CORRECTION-REASON<br>GRD-DECISION-F-DECISION-VERSION<br>GRD-DECISION-F-PROCESSING-STATUS<br>GRD-DECISION-F-NEXT-STEP<br>GRD-DECISION-F-NEXT-ACTION | CORRECTION_PENDING → EXCEPTION_RESOLVED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / CORRECTION_REASON_REQUIRED / STALE_INPUT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| GRD-ACT-RESOLVE-VERSION-CONFLICT | Resolve an Assessment Source-version Conflict | UPDATE | GRD-DECISION-F-CORRECTION-REASON | GRD-DECISION-F-SUBMISSION-REF<br>GRD-DECISION-F-SUBMISSION-VERSION<br>GRD-DECISION-F-ITEM-REF<br>GRD-DECISION-F-ITEM-VERSION<br>GRD-DECISION-F-RUBRIC-REF<br>GRD-DECISION-F-RUBRIC-VERSION<br>GRD-DECISION-F-CAPABILITY-RULE-REF<br>GRD-DECISION-F-CAPABILITY-RULE-VERSION<br>GRD-DECISION-F-CORRECTION-REASON<br>GRD-DECISION-F-DECISION-VERSION | CONFLICT → QUEUED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / SOURCE_VERSION_STILL_STALE / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
