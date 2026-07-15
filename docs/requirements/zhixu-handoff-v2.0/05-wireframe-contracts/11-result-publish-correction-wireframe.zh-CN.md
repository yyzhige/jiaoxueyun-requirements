# PUB-001 Result Publication and Correction Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | PUB-001 |
| 阶段 | 1 |
| 页面数量 | 3 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## PUB-PAGE-RELEASE Result Release Workspace

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | PUB-OBJ-BATCH / PUB-OBJ-PREVIEW / PUB-OBJ-RESULT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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
| PUB-OBJ-RESULT | PUB-RESULT-F-CORRECTION-DECISION-REF | Correction Decision Reference | ID | required when correcting a published result；状态=INVALIDATED | OBJECT_REF: GRD-OBJ-DECISION | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-NEW-DECISION-VERSION | New Confirmed Decision Version | INTEGER | required when correcting a published result；状态=INVALIDATED | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER | Published Answer | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SCORE | Published Score | DECIMAL | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK | Published Feedback | TEXT | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ELIGIBILITY | Publication Eligibility | STRING | 是 | OPTION_SET: OPT-TL-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-BLOCKING-CODES | Publication Blocking Codes | STRING_ARRAY | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER-VISIBLE-AT | Answer Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SCORE-VISIBLE-AT | Score Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-VISIBLE-AT | Feedback Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-RESULT-VERSION | Result Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-CORRECTION-VERSION | Correction Version | INTEGER | required when a published result is corrected；状态=INVALIDATED | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-INVALIDATION-VERSION | Dependent Invalidation Version | INTEGER | required when a published result correction invalidates dependent interpretations；状态=INVALIDATED | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-PUBLIC-CORRECTION-NOTE | Public Correction Note | TEXT | required when a published result is corrected；状态=INVALIDATED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-NOTIFICATION-STATUS | Notification Status | STRING | 是 | OPTION_SET: OPT-TL-010 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS | Downstream Invalidation Records | JSON | required when a published result correction invalidates dependent interpretations；状态=INVALIDATED | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-ACT-PREVIEW | Preview Result Publication | CREATE | PUB-PREVIEW-F-BATCH-REF<br>PUB-PREVIEW-F-STUDENT-REF<br>PUB-PREVIEW-F-DECISION-REF | PUB-PREVIEW-F-ID<br>PUB-PREVIEW-F-ELIGIBILITY<br>PUB-PREVIEW-F-BLOCKING-CODES<br>PUB-PREVIEW-F-ANSWER-VISIBLE-AT<br>PUB-PREVIEW-F-FEEDBACK-VISIBLE-AT<br>PUB-PREVIEW-F-NOTIFICATION-PREVIEW | CREATE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / NOT_FOUND / VISIBILITY_POLICY_BLOCKED |
| PUB-ACT-PREPARE-BATCH | Prepare Result Publication Batch | UPDATE | PUB-BATCH-F-SELECTED-STUDENT-IDS<br>PUB-BATCH-F-VISIBILITY-POLICY<br>PUB-BATCH-F-ANSWER-VISIBLE-AT<br>PUB-BATCH-F-FEEDBACK-VISIBLE-AT<br>PUB-BATCH-F-NOTIFICATION-POLICY | PUB-BATCH-F-BATCH-VERSION<br>PUB-BATCH-F-STUDENT-SCOPE-SNAPSHOT<br>PUB-BATCH-F-OBJECT-RESULTS<br>PUB-BATCH-F-STATUS | DRAFT → READY | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / UNCONFIRMED_SUBJECTIVE_SCORE / VISIBILITY_POLICY_BLOCKED / VERSION_CONFLICT / AUDIT_FAILED |
| PUB-ACT-PUBLISH-SELECTED | Publish Results to Selected Students | UPDATE | PUB-BATCH-F-SELECTED-STUDENT-IDS | PUB-BATCH-F-BATCH-VERSION<br>PUB-BATCH-F-OBJECT-RESULTS<br>PUB-BATCH-F-STATUS | READY → PUBLISHING | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / UNCONFIRMED_SUBJECTIVE_SCORE / VISIBILITY_POLICY_BLOCKED / VERSION_CONFLICT / AUDIT_FAILED |
| PUB-ACT-RETRY-FAILED | Retry Failed Result Publication | UPDATE |  | PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-NOTIFICATION-STATUS | PUBLISH_FAILED → PUBLISHED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / UNCONFIRMED_SUBJECTIVE_SCORE / VISIBILITY_POLICY_BLOCKED / OBJECT_PUBLICATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## PUB-PAGE-CORRECTION Published Result Correction Workspace

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | PUB-OBJ-RESULT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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
| PUB-OBJ-RESULT | PUB-RESULT-F-CORRECTION-DECISION-REF | Correction Decision Reference | ID | required when correcting a published result；状态=INVALIDATED | OBJECT_REF: GRD-OBJ-DECISION | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-NEW-DECISION-VERSION | New Confirmed Decision Version | INTEGER | required when correcting a published result；状态=INVALIDATED | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER | Published Answer | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SCORE | Published Score | DECIMAL | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK | Published Feedback | TEXT | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ELIGIBILITY | Publication Eligibility | STRING | 是 | OPTION_SET: OPT-TL-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-BLOCKING-CODES | Publication Blocking Codes | STRING_ARRAY | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER-VISIBLE-AT | Answer Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SCORE-VISIBLE-AT | Score Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-VISIBLE-AT | Feedback Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-RESULT-VERSION | Result Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-CORRECTION-VERSION | Correction Version | INTEGER | required when a published result is corrected；状态=INVALIDATED | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-INVALIDATION-VERSION | Dependent Invalidation Version | INTEGER | required when a published result correction invalidates dependent interpretations；状态=INVALIDATED | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-PUBLIC-CORRECTION-NOTE | Public Correction Note | TEXT | required when a published result is corrected；状态=INVALIDATED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-NOTIFICATION-STATUS | Notification Status | STRING | 是 | OPTION_SET: OPT-TL-010 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS | Downstream Invalidation Records | JSON | required when a published result correction invalidates dependent interpretations；状态=INVALIDATED | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-ACT-CORRECT-RESULT | Correct Published Result | UPDATE | PUB-RESULT-F-CORRECTION-DECISION-REF<br>PUB-RESULT-F-NEW-DECISION-VERSION<br>PUB-RESULT-F-PUBLIC-CORRECTION-NOTE | PUB-RESULT-F-CORRECTION-DECISION-REF<br>PUB-RESULT-F-NEW-DECISION-VERSION<br>PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-CORRECTION-VERSION<br>PUB-RESULT-F-INVALIDATION-VERSION<br>PUB-RESULT-F-NOTIFICATION-STATUS<br>PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS | PUBLISHED → INVALIDATED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / CORRECTION_NOTE_REQUIRED / STALE_DECISION_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION | Reconfirm Invalidated Explanation | UPDATE | PUB-RESULT-F-PUBLIC-CORRECTION-NOTE | PUB-RESULT-F-RESULT-VERSION<br>PUB-RESULT-F-INVALIDATION-VERSION<br>PUB-RESULT-F-NOTIFICATION-STATUS<br>PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS | INVALIDATED → PUBLISHED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / INVALIDATION_UNRESOLVED / STALE_DECISION_VERSION / VERSION_CONFLICT / AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## PUB-PAGE-STUDENT-RESULT Student Published Result

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | PUB-OBJ-RESULT | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

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
| PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER-VISIBLE-AT | Answer Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-SCORE-VISIBLE-AT | Score Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-VISIBLE-AT | Feedback Visible Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| PUB-OBJ-RESULT | PUB-RESULT-F-RESULT-VERSION | Result Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-ACT-VIEW-RESULT | View My Published Result | READ | PUB-RESULT-F-STUDENT-REF | PUB-RESULT-F-STUDENT-REF<br>PUB-RESULT-F-ANSWER<br>PUB-RESULT-F-SCORE<br>PUB-RESULT-F-FEEDBACK<br>PUB-RESULT-F-ANSWER-VISIBLE-AT<br>PUB-RESULT-F-SCORE-VISIBLE-AT<br>PUB-RESULT-F-FEEDBACK-VISIBLE-AT<br>PUB-RESULT-F-RESULT-VERSION | UNCHANGED | ROLE-STUDENT | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / RESULT_NOT_PUBLISHED / ANSWER_NOT_VISIBLE / SCORE_NOT_VISIBLE / FEEDBACK_NOT_VISIBLE |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
