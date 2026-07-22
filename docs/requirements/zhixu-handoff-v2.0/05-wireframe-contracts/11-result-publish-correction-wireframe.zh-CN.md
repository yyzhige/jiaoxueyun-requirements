交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。

# PUB-001 AI Assessment Publication, Feedback, and Result Correction Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | PUB-001 |
| 阶段 | 2 |
| 交付状态 | PLANNED |
| 页面数量 | 4 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## PUB-PAGE-RELEASE Result Release Workspace

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | PUB-OBJ-BATCH / PUB-OBJ-PREVIEW / PUB-OBJ-RESULT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-OBJ-BATCH | PUB-BATCH-F-ID | Publication Batch ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-BATCH | PUB-BATCH-F-SELECTED-STUDENT-IDS | Selected Student Scope | STRING_ARRAY | 是 | OPTION_SET: OPT-COM-010 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-BATCH | PUB-BATCH-F-VISIBILITY-POLICY | Result Visibility Policy | STRING | 是 | OPTION_SET: OPT-ENUM-040 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-BATCH | PUB-BATCH-F-ANSWER-VISIBLE-AT | Configured Answer Visible Time | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-BATCH | PUB-BATCH-F-FEEDBACK-VISIBLE-AT | Configured Feedback Visible Time | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-BATCH | PUB-BATCH-F-NOTIFICATION-POLICY | Result Notification Policy | STRING | 是 | OPTION_SET: OPT-TL-012 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-BATCH | PUB-BATCH-F-BATCH-VERSION | Publication Batch Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-BATCH | PUB-BATCH-F-STUDENT-SCOPE-SNAPSHOT | Immutable Selected Student Scope | STRING_ARRAY | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-BATCH | PUB-BATCH-F-OBJECT-RESULTS | Student-level Publication Results | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must record an independent success or failure result for every selected student |
| PUB-OBJ-BATCH | PUB-BATCH-F-STATUS | Publication Batch Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-PREVIEW | PUB-PREVIEW-F-ID | Publication Preview ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-PREVIEW | PUB-PREVIEW-F-BATCH-REF | Publication Batch Reference | ID | 是 | OBJECT_REF: PUB-OBJ-BATCH | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-PREVIEW | PUB-PREVIEW-F-STUDENT-REF | Selected Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-PREVIEW | PUB-PREVIEW-F-DECISION-REF | Confirmed Decision Reference | ID | 是 | OBJECT_REF: GRD-OBJ-DECISION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-PREVIEW | PUB-PREVIEW-F-ELIGIBILITY | Preview Publication Eligibility | STRING | 是 | OPTION_SET: OPT-TL-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-PREVIEW | PUB-PREVIEW-F-BLOCKING-CODES | Preview Publication Blocking Codes | STRING_ARRAY | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-PREVIEW | PUB-PREVIEW-F-ANSWER-VISIBLE-AT | Resolved Answer Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-PREVIEW | PUB-PREVIEW-F-FEEDBACK-VISIBLE-AT | Resolved Feedback Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-PREVIEW | PUB-PREVIEW-F-NOTIFICATION-PREVIEW | Resolved Notification Preview | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ID | Published Result ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-STUDENT-REF | Selected Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SOURCE-DECISION-REF | Source Decision Reference | ID | 是 | OBJECT_REF: GRD-OBJ-DECISION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-DECISION-VERSION | Confirmed Decision Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-CORRECTION-DECISION-REF | Correction Decision Reference | ID | required only for the declared version-preserving batch correction writer；状态=INVALIDATED；动作=PUB-ACT-CORRECT-RESULT | OBJECT_REF: GRD-OBJ-DECISION | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-NEW-DECISION-VERSION | New Confirmed Decision Version | INTEGER | required only for the declared version-preserving batch correction writer；状态=INVALIDATED；动作=PUB-ACT-CORRECT-RESULT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER | Published Answer | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SCORE | Published Score | DECIMAL | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK | Published Feedback | TEXT | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ELIGIBILITY | Publication Eligibility | STRING | 是 | OPTION_SET: OPT-TL-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-BLOCKING-CODES | Publication Blocking Codes | STRING_ARRAY | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER-VISIBLE-AT | Answer Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SCORE-VISIBLE-AT | Score Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-VISIBLE-AT | Feedback Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-RESULT-VERSION | Result Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-CORRECTION-VERSION | Correction Version | INTEGER | required only for the declared version-preserving batch correction writer；状态=INVALIDATED；动作=PUB-ACT-CORRECT-RESULT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-INVALIDATION-VERSION | Dependent Invalidation Version | INTEGER | required only for the declared version-preserving batch correction writer；状态=INVALIDATED/PUBLISHED；动作=PUB-ACT-CORRECT-RESULT/PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-PUBLIC-CORRECTION-NOTE | Public Correction Note | TEXT | required when a published result is corrected；状态=INVALIDATED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-NOTIFICATION-STATUS | Notification Status | STRING | 是 | OPTION_SET: OPT-TL-010 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS | Downstream Invalidation Records | JSON | required only for the declared version-preserving batch correction writer；状态=INVALIDATED/PUBLISHED；动作=PUB-ACT-CORRECT-RESULT/PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-ACT-PREVIEW | Preview Result Publication | CREATE | PUB-PREVIEW-F-BATCH-REF<br>PUB-PREVIEW-F-STUDENT-REF<br>PUB-PREVIEW-F-DECISION-REF | PUB-PREVIEW-F-ID<br>PUB-PREVIEW-F-ELIGIBILITY<br>PUB-PREVIEW-F-BLOCKING-CODES<br>PUB-PREVIEW-F-ANSWER-VISIBLE-AT<br>PUB-PREVIEW-F-FEEDBACK-VISIBLE-AT<br>PUB-PREVIEW-F-NOTIFICATION-PREVIEW | CREATE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / NOT_FOUND / VISIBILITY_POLICY_BLOCKED |
| PUB-ACT-PREPARE-BATCH | Prepare Result Publication Batch | UPDATE | PUB-BATCH-F-SELECTED-STUDENT-IDS<br>PUB-BATCH-F-VISIBILITY-POLICY<br>PUB-BATCH-F-ANSWER-VISIBLE-AT<br>PUB-BATCH-F-FEEDBACK-VISIBLE-AT<br>PUB-BATCH-F-NOTIFICATION-POLICY | PUB-BATCH-F-BATCH-VERSION<br>PUB-BATCH-F-STUDENT-SCOPE-SNAPSHOT<br>PUB-BATCH-F-OBJECT-RESULTS<br>PUB-BATCH-F-STATUS | DRAFT → READY | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / UNCONFIRMED_SUBJECTIVE_SCORE / VISIBILITY_POLICY_BLOCKED / VERSION_CONFLICT / AUDIT_FAILED |
| PUB-ACT-PUBLISH-SELECTED | Publish Results to Selected Students | UPDATE | PUB-BATCH-F-SELECTED-STUDENT-IDS | PUB-BATCH-F-BATCH-VERSION<br>PUB-BATCH-F-OBJECT-RESULTS<br>PUB-BATCH-F-STATUS | READY → PUBLISHING | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / UNCONFIRMED_SUBJECTIVE_SCORE / VISIBILITY_POLICY_BLOCKED / VERSION_CONFLICT / AUDIT_FAILED |
| PUB-ACT-RETRY-FAILED | Retry Failed Result Publication | UPDATE |  | PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-NOTIFICATION-STATUS<br>PUB-RESULT-F-PERMISSION-GATE<br>PUB-RESULT-F-SAFETY-GATE<br>PUB-RESULT-F-TEACHING-CORRECTNESS-GATE<br>PUB-RESULT-F-PUBLICATION-STATUS<br>PUB-RESULT-F-VALIDITY-STATUS | PUBLISH_FAILED → PUBLISHED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / UNCONFIRMED_SUBJECTIVE_SCORE / VISIBILITY_POLICY_BLOCKED / OBJECT_PUBLICATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED / PERMISSION_GATE_FAILED / SAFETY_GATE_FAILED / TEACHING_CORRECTNESS_GATE_FAILED / GATE_UNAVAILABLE |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## PUB-PAGE-CORRECTION Published Result Correction Workspace

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | PUB-OBJ-RESULT / PUB-OBJ-RESULT-CHALLENGE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-OBJ-RESULT | PUB-RESULT-F-ID | Published Result ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-STUDENT-REF | Selected Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SOURCE-DECISION-REF | Source Decision Reference | ID | 是 | OBJECT_REF: GRD-OBJ-DECISION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-DECISION-VERSION | Confirmed Decision Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-CORRECTION-DECISION-REF | Correction Decision Reference | ID | required only for the declared version-preserving batch correction writer；状态=INVALIDATED；动作=PUB-ACT-CORRECT-RESULT | OBJECT_REF: GRD-OBJ-DECISION | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-NEW-DECISION-VERSION | New Confirmed Decision Version | INTEGER | required only for the declared version-preserving batch correction writer；状态=INVALIDATED；动作=PUB-ACT-CORRECT-RESULT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER | Published Answer | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SCORE | Published Score | DECIMAL | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK | Published Feedback | TEXT | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ELIGIBILITY | Publication Eligibility | STRING | 是 | OPTION_SET: OPT-TL-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-BLOCKING-CODES | Publication Blocking Codes | STRING_ARRAY | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER-VISIBLE-AT | Answer Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SCORE-VISIBLE-AT | Score Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-VISIBLE-AT | Feedback Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-RESULT-VERSION | Result Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-CORRECTION-VERSION | Correction Version | INTEGER | required only for the declared version-preserving batch correction writer；状态=INVALIDATED；动作=PUB-ACT-CORRECT-RESULT | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-INVALIDATION-VERSION | Dependent Invalidation Version | INTEGER | required only for the declared version-preserving batch correction writer；状态=INVALIDATED/PUBLISHED；动作=PUB-ACT-CORRECT-RESULT/PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-PUBLIC-CORRECTION-NOTE | Public Correction Note | TEXT | required when a published result is corrected；状态=INVALIDATED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-NOTIFICATION-STATUS | Notification Status | STRING | 是 | OPTION_SET: OPT-TL-010 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS | Downstream Invalidation Records | JSON | required only for the declared version-preserving batch correction writer；状态=INVALIDATED/PUBLISHED；动作=PUB-ACT-CORRECT-RESULT/PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-ID | Assessment Challenge ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-RESULT-REF | Challenged Result Reference | ID | 是 | OBJECT_REF: PUB-OBJ-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared assessment dispute contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-RESULT-VERSION | Challenged Result Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-STUDENT-REASON | Student Challenge Reason | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared assessment dispute contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-STUDENT-EVIDENCE-REFS | Student Challenge Evidence References | STRING_ARRAY | 否 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared assessment dispute contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-PROFESSIONAL-EVIDENCE-REFS | Professional Resolution Evidence References | STRING_ARRAY | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared assessment dispute contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-RESOLUTION | Assessment Challenge Resolution | STRING | required when a challenge reaches RESOLVED；状态=RESOLVED；动作=PUB-ACT-CLOSE-RESULT-CHALLENGE | OPTION_SET: OPT-AI2-010 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-STATUS | Assessment Challenge Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-VERSION | Assessment Challenge Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-CHALLENGE-REF | Assessment Challenge Reference | ID | 否 | OBJECT_REF: PUB-OBJ-RESULT-CHALLENGE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-CHALLENGE-VERSION | Assessment Challenge Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-ACT-CORRECT-RESULT | Correct Affected Result Versions from a Confirmed Source Revision | UPDATE | PUB-RESULT-F-CORRECTION-DECISION-REF<br>PUB-RESULT-F-NEW-DECISION-VERSION<br>PUB-RESULT-F-PUBLIC-CORRECTION-NOTE | PUB-RESULT-F-CORRECTION-DECISION-REF<br>PUB-RESULT-F-NEW-DECISION-VERSION<br>PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-CORRECTION-VERSION<br>PUB-RESULT-F-INVALIDATION-VERSION<br>PUB-RESULT-F-NOTIFICATION-STATUS<br>PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS<br>PUB-RESULT-F-PRIOR-RESULT-REF<br>PUB-RESULT-F-PRIOR-RESULT-VERSION<br>PUB-RESULT-F-PUBLIC-CORRECTION-NOTE<br>PUB-RESULT-F-PUBLICATION-STATUS<br>PUB-RESULT-F-DISPUTE-CORRECTION-STATUS<br>PUB-RESULT-F-VALIDITY-STATUS | PUBLISHED → INVALIDATED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / CORRECTION_NOTE_REQUIRED / STALE_DECISION_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION | Reconfirm Invalidated Explanation | UPDATE | PUB-RESULT-F-PUBLIC-CORRECTION-NOTE<br>PUB-RESULT-F-ID | PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-INVALIDATION-VERSION<br>PUB-RESULT-F-NOTIFICATION-STATUS<br>PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS<br>PUB-RESULT-F-PUBLICATION-STATUS<br>PUB-RESULT-F-DISPUTE-CORRECTION-STATUS<br>PUB-RESULT-F-VALIDITY-STATUS<br>PUB-RESULT-F-PERMISSION-GATE<br>PUB-RESULT-F-SAFETY-GATE<br>PUB-RESULT-F-TEACHING-CORRECTNESS-GATE | INVALIDATED → PUBLISHED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / INVALIDATION_UNRESOLVED / STALE_DECISION_VERSION / VERSION_CONFLICT / AUDIT_FAILED / PERMISSION_GATE_FAILED / SAFETY_GATE_FAILED / TEACHING_CORRECTNESS_GATE_FAILED / GATE_UNAVAILABLE |
| PUB-ACT-SUBMIT-PROFESSIONAL-EVIDENCE | Submit Professional Evidence for an Assessment Challenge | UPDATE | PUB-CHALLENGE-F-ID<br>PUB-CHALLENGE-F-VERSION<br>PUB-CHALLENGE-F-PROFESSIONAL-EVIDENCE-REFS | PUB-CHALLENGE-F-PROFESSIONAL-EVIDENCE-REFS<br>PUB-CHALLENGE-F-STATUS<br>PUB-CHALLENGE-F-VERSION | OPEN → EVIDENCE_SUBMITTED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PUB-ACT-CORRECT-CHALLENGED-RESULT | Correct a Challenged Result as a New Version | UPDATE | PUB-RESULT-F-CHALLENGE-REF<br>PUB-RESULT-F-CHALLENGE-VERSION<br>PUB-RESULT-F-PUBLIC-CORRECTION-NOTE | PUB-RESULT-F-PRIOR-RESULT-REF<br>PUB-RESULT-F-PRIOR-RESULT-VERSION<br>PUB-RESULT-F-PUBLIC-CORRECTION-NOTE<br>PUB-RESULT-F-CHALLENGE-REF<br>PUB-RESULT-F-CHALLENGE-VERSION<br>PUB-RESULT-F-RESOLUTION-KIND<br>PUB-RESULT-F-RESOLUTION-EVIDENCE-REFS<br>PUB-RESULT-F-PUBLICATION-STATUS<br>PUB-RESULT-F-DISPUTE-CORRECTION-STATUS<br>PUB-RESULT-F-VALIDITY-STATUS<br>PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-PERMISSION-GATE<br>PUB-RESULT-F-SAFETY-GATE<br>PUB-RESULT-F-TEACHING-CORRECTNESS-GATE | PUBLISHED → PUBLISHED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED / PERMISSION_GATE_FAILED / SAFETY_GATE_FAILED / TEACHING_CORRECTNESS_GATE_FAILED / GATE_UNAVAILABLE |
| PUB-ACT-REPLACE-RESULT | Replace a Challenged Result with a New Version | UPDATE | PUB-RESULT-F-CHALLENGE-REF<br>PUB-RESULT-F-CHALLENGE-VERSION<br>PUB-RESULT-F-PUBLIC-CORRECTION-NOTE | PUB-RESULT-F-PRIOR-RESULT-REF<br>PUB-RESULT-F-PRIOR-RESULT-VERSION<br>PUB-RESULT-F-PUBLIC-CORRECTION-NOTE<br>PUB-RESULT-F-CHALLENGE-REF<br>PUB-RESULT-F-CHALLENGE-VERSION<br>PUB-RESULT-F-RESOLUTION-KIND<br>PUB-RESULT-F-RESOLUTION-EVIDENCE-REFS<br>PUB-RESULT-F-PUBLICATION-STATUS<br>PUB-RESULT-F-DISPUTE-CORRECTION-STATUS<br>PUB-RESULT-F-VALIDITY-STATUS<br>PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-PERMISSION-GATE<br>PUB-RESULT-F-SAFETY-GATE<br>PUB-RESULT-F-TEACHING-CORRECTNESS-GATE | PUBLISHED → PUBLISHED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED / PERMISSION_GATE_FAILED / SAFETY_GATE_FAILED / TEACHING_CORRECTNESS_GATE_FAILED / GATE_UNAVAILABLE |
| PUB-ACT-INVALIDATE-RESULT | Invalidate a Challenged Result without Replacement | UPDATE | PUB-RESULT-F-CHALLENGE-REF<br>PUB-RESULT-F-CHALLENGE-VERSION<br>PUB-RESULT-F-PUBLIC-CORRECTION-NOTE | PUB-RESULT-F-PRIOR-RESULT-REF<br>PUB-RESULT-F-PRIOR-RESULT-VERSION<br>PUB-RESULT-F-PUBLIC-CORRECTION-NOTE<br>PUB-RESULT-F-CHALLENGE-REF<br>PUB-RESULT-F-CHALLENGE-VERSION<br>PUB-RESULT-F-RESOLUTION-KIND<br>PUB-RESULT-F-RESOLUTION-EVIDENCE-REFS<br>PUB-RESULT-F-PUBLICATION-STATUS<br>PUB-RESULT-F-DISPUTE-CORRECTION-STATUS<br>PUB-RESULT-F-VALIDITY-STATUS<br>PUB-RESULT-F-RESULT-VERSION | PUBLISHED → INVALIDATED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| PUB-ACT-UPHOLD-RESULT | Uphold a Challenged Result with Evidence | UPDATE | PUB-RESULT-F-CHALLENGE-REF<br>PUB-RESULT-F-CHALLENGE-VERSION<br>PUB-RESULT-F-PUBLIC-CORRECTION-NOTE | PUB-RESULT-F-PRIOR-RESULT-REF<br>PUB-RESULT-F-PRIOR-RESULT-VERSION<br>PUB-RESULT-F-PUBLIC-CORRECTION-NOTE<br>PUB-RESULT-F-CHALLENGE-REF<br>PUB-RESULT-F-CHALLENGE-VERSION<br>PUB-RESULT-F-RESOLUTION-KIND<br>PUB-RESULT-F-RESOLUTION-EVIDENCE-REFS<br>PUB-RESULT-F-PUBLICATION-STATUS<br>PUB-RESULT-F-DISPUTE-CORRECTION-STATUS<br>PUB-RESULT-F-VALIDITY-STATUS<br>PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-PERMISSION-GATE<br>PUB-RESULT-F-SAFETY-GATE<br>PUB-RESULT-F-TEACHING-CORRECTNESS-GATE | PUBLISHED → PUBLISHED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED / PERMISSION_GATE_FAILED / SAFETY_GATE_FAILED / TEACHING_CORRECTNESS_GATE_FAILED / GATE_UNAVAILABLE |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## PUB-PAGE-STUDENT-RESULT Student Published Result

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | PUB-OBJ-RESULT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-OBJ-RESULT | PUB-RESULT-F-STUDENT-REF | Selected Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER | Published Answer | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SCORE | Published Score | DECIMAL | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK | Published Feedback | TEXT | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-LAYER-1 | Feedback Layer 1: Result and Error Location | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-LAYER-2 | Feedback Layer 2: Non-answer Scaffold | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-LAYER-3 | Feedback Layer 3: Targeted Teaching | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-LAYER-4 | Feedback Layer 4: Complete Answer and Solution | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ASSESSMENT-STANDARD-CONTENT | Opened Assessment Standard Content | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-RESULT-VERSION | Result Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER-OPEN-POLICY-ID | Answer-open Policy ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER-OPEN-POLICY-VERSION | Answer-open Policy Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER-OPEN-AT | Complete Answer Open Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SOLUTION-OPEN-AT | Complete Solution Open Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-RUBRIC-OPEN-AT | Assessment Standard Open Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SCORE-VISIBLE-AT | Score Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-VISIBLE-AT | Feedback Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-ACT-VIEW-RESULT | View My Published Result | READ | PUB-RESULT-F-STUDENT-REF | PUB-RESULT-F-STUDENT-REF<br>PUB-RESULT-F-ANSWER<br>PUB-RESULT-F-SCORE<br>PUB-RESULT-F-FEEDBACK<br>PUB-RESULT-F-FEEDBACK-LAYER-1<br>PUB-RESULT-F-FEEDBACK-LAYER-2<br>PUB-RESULT-F-FEEDBACK-LAYER-3<br>PUB-RESULT-F-FEEDBACK-LAYER-4<br>PUB-RESULT-F-ASSESSMENT-STANDARD-CONTENT<br>PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-ANSWER-OPEN-POLICY-ID<br>PUB-RESULT-F-ANSWER-OPEN-POLICY-VERSION<br>PUB-RESULT-F-ANSWER-OPEN-AT<br>PUB-RESULT-F-SOLUTION-OPEN-AT<br>PUB-RESULT-F-RUBRIC-OPEN-AT<br>PUB-RESULT-F-SCORE-VISIBLE-AT<br>PUB-RESULT-F-FEEDBACK-VISIBLE-AT | UNCHANGED | ROLE-STUDENT | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / RESULT_NOT_PUBLISHED / ANSWER_NOT_VISIBLE / SCORE_NOT_VISIBLE / FEEDBACK_NOT_VISIBLE / ANSWER_NOT_OPEN |
| PUB-ACT-SEARCH-PUBLISHED-RESULTS | Search My Published Results | READ | PUB-RESULT-F-STUDENT-REF | PUB-RESULT-F-ID<br>PUB-RESULT-F-STUDENT-REF<br>PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-ANSWER-OPEN-POLICY-ID<br>PUB-RESULT-F-ANSWER-OPEN-POLICY-VERSION<br>PUB-RESULT-F-ANSWER-OPEN-AT<br>PUB-RESULT-F-SOLUTION-OPEN-AT<br>PUB-RESULT-F-RUBRIC-OPEN-AT | UNCHANGED | ROLE-STUDENT | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / RESULT_NOT_PUBLISHED / ANSWER_NOT_VISIBLE / SCORE_NOT_VISIBLE / FEEDBACK_NOT_VISIBLE / ANSWER_NOT_OPEN |
| PUB-ACT-OPEN-CACHED-RESULT | Open a Cached Result after Server Reauthorization | READ | PUB-RESULT-F-STUDENT-REF | PUB-RESULT-F-ID<br>PUB-RESULT-F-STUDENT-REF<br>PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-ANSWER-OPEN-POLICY-ID<br>PUB-RESULT-F-ANSWER-OPEN-POLICY-VERSION<br>PUB-RESULT-F-ANSWER-OPEN-AT<br>PUB-RESULT-F-SOLUTION-OPEN-AT<br>PUB-RESULT-F-RUBRIC-OPEN-AT | UNCHANGED | ROLE-STUDENT | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / RESULT_NOT_PUBLISHED / ANSWER_NOT_VISIBLE / SCORE_NOT_VISIBLE / FEEDBACK_NOT_VISIBLE / ANSWER_NOT_OPEN |
| PUB-ACT-OPEN-DIRECT-RESULT-LINK | Open a Direct Result Link after Server Reauthorization | READ | PUB-RESULT-F-STUDENT-REF | PUB-RESULT-F-ID<br>PUB-RESULT-F-STUDENT-REF<br>PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-ANSWER-OPEN-POLICY-ID<br>PUB-RESULT-F-ANSWER-OPEN-POLICY-VERSION<br>PUB-RESULT-F-ANSWER-OPEN-AT<br>PUB-RESULT-F-SOLUTION-OPEN-AT<br>PUB-RESULT-F-RUBRIC-OPEN-AT | UNCHANGED | ROLE-STUDENT | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / RESULT_NOT_PUBLISHED / ANSWER_NOT_VISIBLE / SCORE_NOT_VISIBLE / FEEDBACK_NOT_VISIBLE / ANSWER_NOT_OPEN |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## PUB-PAGE-RESULT-CHALLENGE Open a Challenge against My Published Assessment Result

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | PUB-OBJ-RESULT-CHALLENGE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-ID | Assessment Challenge ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-RESULT-REF | Challenged Result Reference | ID | 是 | OBJECT_REF: PUB-OBJ-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared assessment dispute contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-RESULT-VERSION | Challenged Result Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-STUDENT-REASON | Student Challenge Reason | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared assessment dispute contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-STUDENT-EVIDENCE-REFS | Student Challenge Evidence References | STRING_ARRAY | 否 | USER_INPUT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared assessment dispute contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-PROFESSIONAL-EVIDENCE-REFS | Professional Resolution Evidence References | STRING_ARRAY | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared assessment dispute contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-RESOLUTION | Assessment Challenge Resolution | STRING | required when a challenge reaches RESOLVED；状态=RESOLVED；动作=PUB-ACT-CLOSE-RESULT-CHALLENGE | OPTION_SET: OPT-AI2-010 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-STATUS | Assessment Challenge Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |
| PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-VERSION | Assessment Challenge Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared AI assessment contract and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-ACT-OPEN-RESULT-CHALLENGE | Open a Challenge against My Published Assessment Result | CREATE | PUB-CHALLENGE-F-RESULT-REF<br>PUB-CHALLENGE-F-RESULT-VERSION<br>PUB-CHALLENGE-F-STUDENT-REASON<br>PUB-CHALLENGE-F-STUDENT-EVIDENCE-REFS | PUB-CHALLENGE-F-ID<br>PUB-CHALLENGE-F-STATUS<br>PUB-CHALLENGE-F-VERSION | CREATE | ROLE-STUDENT | ROLE-TEACHER / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
