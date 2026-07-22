# 数据流转合同

## DF-001 School Context Establishment

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | ACC-001 / ORG-001 / IAM-001 | "NONE" | STEP_WITH_NO_CONTEXT_ACTIVATION_BEFORE_ALL_CHECKS_PASS | {"strategy":"RETRY_READS_AND_IDEMPOTENT_CONTEXT_WRITE","maxAttempts":3,"retryableFailureResults":["VERSION_CONFLICT"]} | {"strategy":"EXPIRE_PARTIAL_CONTEXT","description":"if a context write exists before final acceptance, expire it and require full re-establishment"} | {"strategy":"INVALIDATE_PREVIOUS_CONTEXT_DERIVATIONS","targets":["permission cache","term-scoped navigation","write authorization tokens"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| ACC-OBJ-SCHOOL.ACC-SCHOOL-F-ID; version=ACC-SCHOOL-F-SCHOOL-VERSION; cardinality=ONE | — |
| ACC-OBJ-IDENTITY.ACC-IDENTITY-F-ID; version=ACC-IDENTITY-F-IDENTITY-VERSION; cardinality=ONE | — |
| ACC-OBJ-IDENTITY.ACC-IDENTITY-F-SCOPES; version=ACC-IDENTITY-F-IDENTITY-VERSION; cardinality=ONE | — |
| ORG-OBJ-TERM.ORG-TERM-F-ID; version=ORG-TERM-F-TERM-VERSION; cardinality=ONE | — |
| ORG-OBJ-TERM.ORG-TERM-F-STATUS; version=ORG-TERM-F-TERM-VERSION; cardinality=ONE | — |
| IAM-OBJ-PERMISSION-DECISION.IAM-DECISION-F-ID; version=IAM-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| IAM-OBJ-PERMISSION-DECISION.IAM-DECISION-F-SOURCE-VERSIONS; version=IAM-DECISION-F-DECISION-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | ACC-ACT-SEARCH-SCHOOL | — | [{"fieldId":"ACC-SCHOOL-F-REGION","provider":{"actorRef":"CURRENT_ACTOR"}},{"fieldId":"ACC-SCHOOL-F-NAME","provider":{"actorRef":"CURRENT_ACTOR"}}] |
| 2 | ACC-ACT-SELECT-SCHOOL | — | [] |
| 3 | ACC-ACT-FIRST-ACTIVATION | membership state is INVITED | [{"fieldId":"ACC-MEMBER-F-ACTIVATION","provider":{"actorRef":"CURRENT_ACTOR"}},{"fieldId":"ACC-MEMBER-F-ACCOUNT-ID-TYPE","provider":{"actorRef":"CURRENT_ACTOR"}},{"fieldId":"ACC-MEMBER-F-ACCOUNT-ID","provider":{"actorRef":"CURRENT_ACTOR"}}] |
| 4 | ACC-ACT-LOGIN | membership state is ACTIVE after optional activation | [{"fieldId":"ACC-MEMBER-F-ACCOUNT-ID-TYPE","provider":{"actorRef":"CURRENT_ACTOR"}},{"fieldId":"ACC-MEMBER-F-ACCOUNT-ID","provider":{"actorRef":"CURRENT_ACTOR"}},{"fieldId":"ACC-MEMBER-F-SCHOOL-ID","provider":{"actorRef":"CURRENT_ACTOR"}}] |
| 5 | ACC-ACT-SELECT-IDENTITY | — | [{"fieldId":"ACC-IDENTITY-F-ROLE","provider":{"actorRef":"CURRENT_ACTOR"}},{"fieldId":"ACC-IDENTITY-F-DUTIES","provider":{"actorRef":"CURRENT_ACTOR"}}] |
| 6 | ACC-ACT-SELECT-TERM | — | [{"fieldId":"ACC-CONTEXT-F-SCHOOL-ID","provider":{"actorRef":"CURRENT_ACTOR"}},{"fieldId":"ACC-CONTEXT-F-IDENTITY-ID","provider":{"actorRef":"CURRENT_ACTOR"}},{"fieldId":"ACC-CONTEXT-F-TERM-ID","provider":{"actorRef":"CURRENT_ACTOR"}}] |
| 7 | ORG-ACT-RESOLVE-CONTEXT-SCOPE | — | [] |
| 8 | IAM-ACT-EVALUATE-PERMISSION | — | [{"fieldId":"IAM-DECISION-F-SUBJECT","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-DECISION-F-ACTION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-DECISION-F-SCOPE","provider":{"actorRef":"SYSTEM"}}] |
| 9 | ACC-ACT-SWITCH-CONTEXT | — | [{"fieldId":"ACC-CONTEXT-F-SCHOOL-ID","provider":{"actorRef":"CURRENT_ACTOR"}},{"fieldId":"ACC-CONTEXT-F-IDENTITY-ID","provider":{"actorRef":"CURRENT_ACTOR"}},{"fieldId":"ACC-CONTEXT-F-TERM-ID","provider":{"actorRef":"CURRENT_ACTOR"}}] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| ACC-OBJ-CONTEXT.ACC-CONTEXT-F-STATUS; version=ACC-CONTEXT-F-CONTEXT-VERSION | — |
| IAM-OBJ-PERMISSION-DECISION.IAM-DECISION-F-RESULT; version=IAM-DECISION-F-DECISION-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["ACC-SCHOOL-F-ID","ACC-IDENTITY-F-ID","ORG-TERM-F-ID"],"versionFieldIds":["ACC-SCHOOL-F-SCHOOL-VERSION","ACC-IDENTITY-F-IDENTITY-VERSION","ORG-TERM-F-TERM-VERSION","IAM-DECISION-F-DECISION-VERSION"],"fanoutFieldId":"IAM-DECISION-F-ID"} | STEP_WITH_NO_CONTEXT_ACTIVATION_BEFORE_ALL_CHECKS_PASS | {"strategy":"RETRY_READS_AND_IDEMPOTENT_CONTEXT_WRITE","maxAttempts":3,"retryableFailureResults":["VERSION_CONFLICT"]} | {"strategy":"EXPIRE_PARTIAL_CONTEXT","description":"if a context write exists before final acceptance, expire it and require full re-establishment"} | {"strategy":"INVALIDATE_PREVIOUS_CONTEXT_DERIVATIONS","targets":["permission cache","term-scoped navigation","write authorization tokens"]} |

## DF-002 Organization Import and Permission Refresh

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | ORG-001 / IAM-001 / AUD-001 | "NONE" | OBJECT_ROW_WITH_PARTIAL_SUCCESS_AND_FAILED_ROW_RETRY | {"strategy":"RETRY_FAILED_ROWS_OR_AUDIT_APPEND","maxAttempts":5,"retryableFailureResults":["VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"ROLLBACK_UNAUDITED_PROVISIONAL_ROWS","description":"rollback provisional accepted rows to the pre-import version when outcome audit fails; do not recalculate permissions until the outcome audit succeeds"} | {"strategy":"INVALIDATE_AFFECTED_ORGANIZATION_SCOPES","targets":["permission decisions","active contexts","teacher work views"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| ORG-OBJ-IMPORT-BATCH.ORG-IMPORT-F-ID; version=ORG-IMPORT-F-BATCH-VERSION; cardinality=ONE | — |
| ORG-OBJ-IMPORT-BATCH.ORG-IMPORT-F-TEMPLATE-VERSION; version=ORG-IMPORT-F-BATCH-VERSION; cardinality=ONE | — |
| ORG-OBJ-IMPORT-ROW.ORG-IMPORT-ROW-F-ID; version=ORG-IMPORT-ROW-F-ROW-VERSION; cardinality=ONE | — |
| ORG-OBJ-IMPORT-ROW.ORG-IMPORT-ROW-F-RESULT-TYPE; version=ORG-IMPORT-ROW-F-ROW-VERSION; cardinality=ONE | — |
| IAM-OBJ-PERMISSION-DECISION.IAM-DECISION-F-ID; version=IAM-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| IAM-OBJ-PERMISSION-DECISION.IAM-DECISION-F-SOURCE-VERSIONS; version=IAM-DECISION-F-DECISION-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | ORG-ACT-UPLOAD-IMPORT | — | [{"fieldId":"ORG-IMPORT-F-OBJECT-TYPE","provider":{"roleRef":"ROLE-ACADEMIC"}}] |
| 2 | ORG-ACT-MAP-IMPORT-FIELDS | — | [{"fieldId":"ORG-IMPORT-F-MAPPING","provider":{"roleRef":"ROLE-ACADEMIC"}}] |
| 3 | ORG-ACT-VALIDATE-IMPORT | — | [{"fieldId":"ORG-IMPORT-ROW-F-BATCH-ID","provider":{"roleRef":"ROLE-ACADEMIC"}}] |
| 4 | IAM-ACT-EVALUATE-PERMISSION | import validation passed for the affected object rows | [{"fieldId":"IAM-DECISION-F-SUBJECT","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-DECISION-F-ACTION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-DECISION-F-SCOPE","provider":{"actorRef":"SYSTEM"}}] |
| 5 | AUD-ACT-APPEND-EVENT | audit gate records intended object-level writes before acceptance | [{"fieldId":"AUD-EVENT-F-ACTOR","provider":{"actorRef":"SYSTEM"}},{"fieldId":"AUD-EVENT-F-ACTION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"AUD-EVENT-F-SCOPE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"AUD-EVENT-F-RESULT","provider":{"actorRef":"SYSTEM"}}] |
| 6 | ORG-ACT-CONFIRM-IMPORT | permission and audit gate succeeded; accepted rows remain provisional until outcome audit | [] |
| 7 | AUD-ACT-APPEND-EVENT | outcome audit records accepted, rejected, and partial-success rows before final acceptance | [{"fieldId":"AUD-EVENT-F-ACTOR","provider":{"actorRef":"SYSTEM"}},{"fieldId":"AUD-EVENT-F-ACTION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"AUD-EVENT-F-SCOPE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"AUD-EVENT-F-RESULT","provider":{"actorRef":"SYSTEM"}}] |
| 8 | ORG-ACT-FINALIZE-AUDITED-IMPORT | outcome audit succeeded and the batch has no rejected rows | [] |
| 9 | ORG-ACT-FINALIZE-AUDITED-PARTIAL-IMPORT | partial result outcome audit succeeded and rejected rows remain for correction | [] |
| 10 | IAM-ACT-RECALCULATE-PERMISSIONS | audited import was finalized and accepted organization rows changed permission sources | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| ORG-OBJ-IMPORT-BATCH.ORG-IMPORT-F-STATUS; version=ORG-IMPORT-F-BATCH-VERSION | — |
| IAM-OBJ-PERMISSION-DECISION.IAM-DECISION-F-SOURCE-VERSIONS; version=IAM-DECISION-F-DECISION-VERSION | — |
| AUD-OBJ-EVENT.AUD-EVENT-F-ID; version=AUD-EVENT-F-EVENT-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["ORG-IMPORT-F-ID","IAM-DECISION-F-ID"],"versionFieldIds":["ORG-IMPORT-F-BATCH-VERSION","ORG-IMPORT-ROW-F-ROW-VERSION","IAM-DECISION-F-DECISION-VERSION"],"fanoutFieldId":"ORG-IMPORT-ROW-F-ID"} | OBJECT_ROW_WITH_PARTIAL_SUCCESS_AND_FAILED_ROW_RETRY | {"strategy":"RETRY_FAILED_ROWS_OR_AUDIT_APPEND","maxAttempts":5,"retryableFailureResults":["VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"ROLLBACK_UNAUDITED_PROVISIONAL_ROWS","description":"rollback provisional accepted rows to the pre-import version when outcome audit fails; do not recalculate permissions until the outcome audit succeeds"} | {"strategy":"INVALIDATE_AFFECTED_ORGANIZATION_SCOPES","targets":["permission decisions","active contexts","teacher work views"]} |

## DF-003 Curriculum Version Publication

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | CURR-001 | "NONE" | VERSION_PUBLICATION_WITH_NO_PARTIAL_PUBLISH | {"strategy":"REVALIDATE_STALE_DRAFT_THEN_RETRY","maxAttempts":3,"retryableFailureResults":["VERSION_CONFLICT"]} | {"strategy":"KEEP_PRIOR_PUBLISHED_VERSION","description":"failed publication leaves the prior published version active and the draft unreferenced by new work"} | {"strategy":"NEW_WORK_ONLY","targets":["new assignment curriculum selectors","new knowledge-path selectors","historical assignment and evidence references are immutable and never rewritten"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| CURR-OBJ-CURRICULUM.CURR-CURRICULUM-F-ID; version=CURR-CURRICULUM-F-VERSION; cardinality=ONE | — |
| CURR-OBJ-CURRICULUM.CURR-CURRICULUM-F-VALIDATION; version=CURR-CURRICULUM-F-VERSION; cardinality=ONE | — |
| CURR-OBJ-MAPPING.CURR-MAPPING-F-ID; version=CURR-MAPPING-F-VERSION; cardinality=ONE | — |
| CURR-OBJ-MAPPING.CURR-MAPPING-F-VERSION; version=CURR-MAPPING-F-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | CURR-ACT-VALIDATE-MAPPING | — | [] |
| 2 | CURR-ACT-VALIDATE-VERSION | — | [] |
| 3 | CURR-ACT-PUBLISH-MAPPING | — | [] |
| 4 | CURR-ACT-PUBLISH-VERSION | — | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| CURR-OBJ-MAPPING.CURR-MAPPING-F-STATUS; version=CURR-MAPPING-F-VERSION | — |
| CURR-OBJ-CURRICULUM.CURR-CURRICULUM-F-STATUS; version=CURR-CURRICULUM-F-VERSION | — |
| CURR-OBJ-CURRICULUM.CURR-CURRICULUM-F-PUBLISHED-AT; version=CURR-CURRICULUM-F-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["CURR-CURRICULUM-F-ID"],"versionFieldIds":["CURR-CURRICULUM-F-VERSION","CURR-MAPPING-F-VERSION"],"fanoutFieldId":"CURR-MAPPING-F-ID"} | VERSION_PUBLICATION_WITH_NO_PARTIAL_PUBLISH | {"strategy":"REVALIDATE_STALE_DRAFT_THEN_RETRY","maxAttempts":3,"retryableFailureResults":["VERSION_CONFLICT"]} | {"strategy":"KEEP_PRIOR_PUBLISHED_VERSION","description":"failed publication leaves the prior published version active and the draft unreferenced by new work"} | {"strategy":"NEW_WORK_ONLY","targets":["new assignment curriculum selectors","new knowledge-path selectors","historical assignment and evidence references are immutable and never rewritten"]} |

## DF-016 Teacher Identity Deletion to Non-recoverable Authorship Rewrite

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | ACC-001 / DGV-001 | "NONE" | ONE_TEACHER_DELETION_EVENT_VERSION_AND_ITS_EXACT_TEACHING_FACT_SET | {"strategy":"REDELIVER_THE_SAME_EVENT_VERSION_AND_RETURN_THE_EXISTING_MAPPING_FOR_EXACT_DUPLICATES","maxAttempts":8,"retryableFailureResults":["VERSION_CONFLICT","EVENT_OUTBOX_FAILED","AUTHORSHIP_REWRITE_FAILED"]} | {"strategy":"NEVER_RESTORE_A_DELETED_IDENTITY_OR_KEEP_A_PARTIAL_AUTHORSHIP_MAPPING","description":"an event outbox failure keeps deletion uncommitted; a downstream rewrite failure keeps the committed deletion and retries the same versioned event idempotently without restoring any recoverable identity lookup"} | {"strategy":"REMOVE_RECOVERABLE_AUTHOR_LOOKUP_AND_PRESERVE_VERSIONED_TEACHING_FACT_CONTENT","targets":["teacher login and identity lookup mappings","historical teaching-fact author pointers","author search indexes and caches"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| ACC-OBJ-PLATFORM-IDENTITY.ACC-PIDENT-F-ID; version=ACC-PIDENT-F-VERSION; cardinality=ONE | — |
| ACC-OBJ-PLATFORM-IDENTITY.ACC-PIDENT-F-SUBJECT-KIND; version=ACC-PIDENT-F-VERSION; cardinality=ONE | — |
| ACC-OBJ-PLATFORM-IDENTITY.ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-ID; version=ACC-PIDENT-F-VERSION; cardinality=ONE | — |
| ACC-OBJ-PLATFORM-IDENTITY.ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-VERSION; version=ACC-PIDENT-F-VERSION; cardinality=ONE | — |
| ACC-OBJ-PLATFORM-IDENTITY.ACC-PIDENT-F-DELETION-CASE-REF; version=ACC-PIDENT-F-VERSION; cardinality=ONE | — |
| ACC-OBJ-PLATFORM-IDENTITY.ACC-PIDENT-F-DELETION-CASE-VERSION; version=ACC-PIDENT-F-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | ACC-ACT-COMPLETE-IDENTITY-DELETION | the deletion subject kind is TEACHER, the fixed teaching-fact snapshot digest matches, the deletion matrix is complete, and the deletion event outbox can commit atomically | [] |
| 2 | DGV-ACT-CREATE-TEACHER-AUTHOR-SURROGATE | the committed teacher-only deletion event is delivered with its exact event version and fixed teaching-fact scope digest | [{"fieldId":"DGV-SURROGATE-F-DELETION-EVENT-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-SURROGATE-F-DELETION-EVENT-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-SURROGATE-F-TEACHING-FACT-SCOPE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-SURROGATE-F-TEACHING-FACT-SCOPE-DIGEST","provider":{"actorRef":"SYSTEM"}}] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| ACC-OBJ-PLATFORM-IDENTITY.ACC-PIDENT-F-STATUS; version=ACC-PIDENT-F-VERSION | — |
| DGV-OBJ-TEACHER-AUTHOR-SURROGATE.DGV-SURROGATE-F-ID; version=DGV-SURROGATE-F-VERSION | — |
| DGV-OBJ-TEACHER-AUTHOR-SURROGATE.DGV-SURROGATE-F-AUTHORSHIP-MAPPING-DIGEST; version=DGV-SURROGATE-F-VERSION | — |
| DGV-OBJ-TEACHER-AUTHOR-SURROGATE.DGV-SURROGATE-F-STATUS; version=DGV-SURROGATE-F-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["ACC-PIDENT-F-ID"],"versionFieldIds":["ACC-PIDENT-F-VERSION"],"fanoutFieldId":"ACC-PIDENT-F-DELETION-CASE-REF"} | ONE_TEACHER_DELETION_EVENT_VERSION_AND_ITS_EXACT_TEACHING_FACT_SET | {"strategy":"REDELIVER_THE_SAME_EVENT_VERSION_AND_RETURN_THE_EXISTING_MAPPING_FOR_EXACT_DUPLICATES","maxAttempts":8,"retryableFailureResults":["VERSION_CONFLICT","EVENT_OUTBOX_FAILED","AUTHORSHIP_REWRITE_FAILED"]} | {"strategy":"NEVER_RESTORE_A_DELETED_IDENTITY_OR_KEEP_A_PARTIAL_AUTHORSHIP_MAPPING","description":"an event outbox failure keeps deletion uncommitted; a downstream rewrite failure keeps the committed deletion and retries the same versioned event idempotently without restoring any recoverable identity lookup"} | {"strategy":"REMOVE_RECOVERABLE_AUTHOR_LOOKUP_AND_PRESERVE_VERSIONED_TEACHING_FACT_CONTENT","targets":["teacher login and identity lookup mappings","historical teaching-fact author pointers","author search indexes and caches"]} |

## DF-004 Assignment Validation and Publication

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | HW-001 / APP-001 | "NONE" | ASSIGNMENT_OBJECT_VERSION_WITH_NO_PARTIAL_ITEM_PUBLICATION | {"strategy":"REVALIDATE_STALE_ASSIGNMENT_THEN_RETRY","maxAttempts":3,"retryableFailureResults":["VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_PRIOR_PUBLICATION_VERSION","description":"a failed immediate or scheduled publication leaves the prior published version active"} | {"strategy":"INVALIDATE_NEW_STUDENT_ASSIGNMENT_READS_ONLY","targets":["student assignment list","submission eligibility cache","assignment notification preview"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-ID; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION; cardinality=ONE | — |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-DUE-AT; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION; cardinality=ONE | — |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION; cardinality=ONE | — |
| HW-OBJ-ITEM.HW-ITEM-F-ID; version=HW-ITEM-F-ITEM-VERSION; cardinality=ONE | — |
| HW-OBJ-ITEM.HW-ITEM-F-PROMPT; version=HW-ITEM-F-ITEM-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | HW-ACT-VALIDATE-ITEM | an item is an initial draft | [] |
| 2 | HW-ACT-VALIDATE | the assignment is an initial draft | [] |
| 3 | HW-ACT-REVALIDATE-REVISION | the assignment contains only an allowed correction draft | [] |
| 4 | HW-ACT-PREVIEW | — | [] |
| 5 | HW-ACT-PUBLISH-ITEM | every included initial item version is validated | [] |
| 6 | HW-ACT-CREATE-PUBLICATION-SNAPSHOT | the validated activity and its published help rule are resolved and sealed before any publication transition | [{"fieldId":"HW-SNAPSHOT-F-ACTIVITY-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"HW-SNAPSHOT-F-ACTIVITY-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"HW-SNAPSHOT-F-HELP-RULE-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"HW-SNAPSHOT-F-HELP-RULE-VERSION","provider":{"actorRef":"SYSTEM"}}] |
| 7 | HW-ACT-PUBLISH-NOW | the teacher selects immediate publication and the sealed snapshot is bound | [] |
| 8 | HW-ACT-SCHEDULE-PUBLISH | the teacher selects scheduled publication and the sealed snapshot is bound | [] |
| 9 | HW-ACT-PUBLISH-REPLACEMENT | the validated activity is a replacement draft and the sealed snapshot is bound | [] |
| 10 | APP-ACT-CREATE-HOMEWORK-TODO | a submittable published activity version becomes available to the assigned class scope | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| HW-OBJ-PUBLICATION-SNAPSHOT.HW-SNAPSHOT-F-ID; version=HW-SNAPSHOT-F-VERSION | — |
| HW-OBJ-PUBLICATION-SNAPSHOT.HW-SNAPSHOT-F-SNAPSHOT-HASH; version=HW-SNAPSHOT-F-VERSION | — |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-PUBLICATION-VERSION; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION | — |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION | — |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-PUBLICATION-SNAPSHOT-REF; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION | — |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-PUBLICATION-SNAPSHOT-VERSION; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-ID; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-STUDENT-REF; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-SOURCE-ASSIGNMENT-REF; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-SOURCE-ASSIGNMENT-VERSION; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-TASK-DEEP-LINK; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-STUDENT-VISIBLE-AT; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-AGGREGATION-VERSION; version=APP-TODO-F-AGGREGATION-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["HW-ASSIGNMENT-F-ID"],"versionFieldIds":["HW-ASSIGNMENT-F-PUBLICATION-VERSION","HW-ITEM-F-ITEM-VERSION"],"fanoutFieldId":"HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS"} | ASSIGNMENT_OBJECT_VERSION_WITH_NO_PARTIAL_ITEM_PUBLICATION | {"strategy":"REVALIDATE_STALE_ASSIGNMENT_THEN_RETRY","maxAttempts":3,"retryableFailureResults":["VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_PRIOR_PUBLICATION_VERSION","description":"a failed immediate or scheduled publication leaves the prior published version active"} | {"strategy":"INVALIDATE_NEW_STUDENT_ASSIGNMENT_READS_ONLY","targets":["student assignment list","submission eligibility cache","assignment notification preview"]} |

## DF-005 Published Assignment Student Submission

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | HW-001 / SUB-001 | "ACTION_CHOICE_REQUIRED" | STUDENT_SUBMISSION_OBJECT_AND_MEDIA_CHUNK | {"strategy":"RETRY_FAILED_CHUNKS_OR_UNRECEIPTED_SUBMISSION","maxAttempts":5,"retryableFailureResults":["TRANSIENT_FAILURE","CHUNK_REJECTED","SERVER_RECEIPT_NOT_ISSUED"]} | {"strategy":"PRESERVE_DRAFT_AND_ACCEPTED_CHUNKS","description":"never roll back accepted chunks and never create a final submission without a server receipt"} | {"strategy":"INVALIDATE_STALE_SUBMISSION_DERIVATIONS","targets":["submission status","grading queue eligibility","late and resubmission projections"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-ID; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION; cardinality=ONE | — |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-TITLE; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION; cardinality=ONE | — |
| SUB-OBJ-DRAFT.SUB-DRAFT-F-ID; version=SUB-DRAFT-F-DRAFT-VERSION; cardinality=ONE | — |
| SUB-OBJ-DRAFT.SUB-DRAFT-F-ANSWER-PAYLOAD; version=SUB-DRAFT-F-DRAFT-VERSION; cardinality=ONE | — |
| SUB-OBJ-DRAFT.SUB-DRAFT-F-IMAGE-REFS; version=SUB-DRAFT-F-DRAFT-VERSION; cardinality=ONE | — |
| SUB-OBJ-DRAFT.SUB-DRAFT-F-FILE-REFS; version=SUB-DRAFT-F-DRAFT-VERSION; cardinality=ONE | — |
| SUB-OBJ-DRAFT.SUB-DRAFT-F-AUDIO-REFS; version=SUB-DRAFT-F-DRAFT-VERSION; cardinality=ONE | — |
| SUB-OBJ-DRAFT.SUB-DRAFT-F-EXPLANATION; version=SUB-DRAFT-F-DRAFT-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | HW-ACT-OPEN-PUBLISHED | — | [] |
| 2 | SUB-ACT-SAVE-DRAFT | — | [{"fieldId":"SUB-DRAFT-F-ASSIGNMENT-REF","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-DRAFT-F-ASSIGNMENT-VERSION","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-DRAFT-F-ANSWER-PAYLOAD","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-DRAFT-F-IMAGE-REFS","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-DRAFT-F-FILE-REFS","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-DRAFT-F-AUDIO-REFS","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-DRAFT-F-EXPLANATION","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-DRAFT-F-MEDIA-METADATA","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-DRAFT-F-PAGE-ITEM-MAPPING","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 3 | SUB-ACT-UPLOAD-CHUNK | the answer contains App media | [{"fieldId":"SUB-DRAFT-F-PENDING-CHUNK","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 4 | SUB-ACT-RETRY-UPLOAD | one or more media chunks failed while successful chunks remain accepted | [{"fieldId":"SUB-DRAFT-F-PENDING-CHUNK","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 5 | SUB-ACT-SUBMIT | the server can issue a final submission receipt | [{"fieldId":"SUB-ATTEMPT-F-ASSIGNMENT-REF","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-ASSIGNMENT-VERSION","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-PUBLICATION-SNAPSHOT-REF","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-PUBLICATION-SNAPSHOT-VERSION","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-DRAFT-REF","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-DRAFT-VERSION","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-DECLARED-EXTERNAL-HELP","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 6 | SUB-ACT-SUBMIT-PROTECTED | the student presents either a matching COMPLETED intent credential or a matching PLATFORM_FAILURE_PROTECTED record for the same fixed manifest inside the state-specific bounded window | [{"fieldId":"SUB-ATTEMPT-F-ASSIGNMENT-REF","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-ASSIGNMENT-VERSION","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-PUBLICATION-SNAPSHOT-REF","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-PUBLICATION-SNAPSHOT-VERSION","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-DRAFT-REF","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-DRAFT-VERSION","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-DECLARED-EXTERNAL-HELP","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-INTENT-CREDENTIAL-REF","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-ATTEMPT-F-INTENT-CREDENTIAL-VERSION","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 7 | HW-ACT-MARK-STUDENT-WINDOW-SUBMITTED | the accepted attempt has a server receipt and belongs to the exact student window | [{"fieldId":"HW-STUDENT-WINDOW-F-PARTICIPATION-STATUS","provider":{"actorRef":"SYSTEM"}}] |
| 8 | SUB-ACT-RECORD-INPUT-QUALITY | the accepted submission contains observable image or page inputs | [{"fieldId":"SUB-QUALITY-F-ATTEMPT-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"SUB-QUALITY-F-ATTEMPT-VERSION","provider":{"actorRef":"SYSTEM"}}] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |
| NORMAL_SERVER_RECEIPT | — | 1 → 2 → 3 → 4 → 5 → 7 → 8 | {"kind":"ACTION_CHOICE","consumerStepOrder":5} | [] | [] | {} |
| COMPLETED_INTENT_CREDENTIAL | — | 1 → 2 → 3 → 4 → 6 → 7 → 8 | {"kind":"ACTION_CHOICE","consumerStepOrder":6} | [] | [] | {} |
| PLATFORM_FAILURE_PROTECTION | — | 1 → 2 → 3 → 4 → 6 → 7 → 8 | {"kind":"ACTION_CHOICE","consumerStepOrder":6} | [] | [] | {} |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| HW-OBJ-STUDENT-ACTIVITY-WINDOW.HW-STUDENT-WINDOW-F-PARTICIPATION-STATUS; version=HW-STUDENT-WINDOW-F-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-SUBMISSION-VERSION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RECEIPT-ID; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-ASSIGNMENT-REF; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-ASSIGNMENT-VERSION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-PUBLICATION-SNAPSHOT-REF; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-PUBLICATION-SNAPSHOT-VERSION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-DRAFT-REF; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-DRAFT-VERSION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RAW-ANSWER-PAYLOAD; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RAW-IMAGE-REFS; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RAW-FILE-REFS; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RAW-AUDIO-REFS; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RAW-EXPLANATION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-CONTENT-MANIFEST; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-CONTENT-DIGEST; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-CONTENT-TRUST-CLASS; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-ALLOWED-HELP; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-OBSERVED-HELP; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-DECLARED-EXTERNAL-HELP; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-UNKNOWN-HELP-CONDITIONS; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-TIMELINESS-SOURCE; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-TIMELINESS-EVALUATED-AT; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-INTENT-CREDENTIAL-REF; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-INTENT-CREDENTIAL-VERSION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-INPUT-QUALITY.SUB-QUALITY-F-VERSION; version=SUB-QUALITY-F-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["HW-ASSIGNMENT-F-ID"],"versionFieldIds":["HW-ASSIGNMENT-F-PUBLICATION-VERSION","SUB-DRAFT-F-DRAFT-VERSION"],"fanoutFieldId":"SUB-DRAFT-F-ID"} | STUDENT_SUBMISSION_OBJECT_AND_MEDIA_CHUNK | {"strategy":"RETRY_FAILED_CHUNKS_OR_UNRECEIPTED_SUBMISSION","maxAttempts":5,"retryableFailureResults":["TRANSIENT_FAILURE","CHUNK_REJECTED","SERVER_RECEIPT_NOT_ISSUED"]} | {"strategy":"PRESERVE_DRAFT_AND_ACCEPTED_CHUNKS","description":"never roll back accepted chunks and never create a final submission without a server receipt"} | {"strategy":"INVALIDATE_STALE_SUBMISSION_DERIVATIONS","targets":["submission status","grading queue eligibility","late and resubmission projections"]} |

## DF-006 Submission to AI Assessment and Completion Determination

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | GENERIC | HW-001 / SUB-001 / GRD-001 / PLAT-002 | "NONE" | SUBMISSION_ITEM_AI_ASSESSMENT_RESULT_VERSION | {"strategy":"RETRY_FAILED_AI_ASSESSMENT_WITHOUT_CHANGING_SUBMISSION_FACTS","maxAttempts":3,"retryableFailureResults":["AI_UNAVAILABLE","VERSION_CONFLICT"]} | {"strategy":"KEEP_UNPUBLISHED_AND_RETURN_AN_EXPLICIT_RECOVERY_NEXT_STEP","description":"an AI failure preserves the accepted submission and frozen standard, then requests concrete supplementation, permitted alternate review, or bounded professional exception review"} | {"strategy":"INVALIDATE_STALE_AI_ASSESSMENT_DERIVED_VIEWS","targets":["AI assessment result","exception queue","publication eligibility"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-ID; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-SUBMISSION-VERSION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-ASSIGNMENT-REF; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-ASSIGNMENT-VERSION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-PUBLICATION-SNAPSHOT-REF; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-PUBLICATION-SNAPSHOT-VERSION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-DRAFT-REF; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-DRAFT-VERSION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RAW-ANSWER-PAYLOAD; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RAW-IMAGE-REFS; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RAW-FILE-REFS; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RAW-AUDIO-REFS; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RAW-EXPLANATION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-CONTENT-MANIFEST; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-CONTENT-DIGEST; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-CONTENT-TRUST-CLASS; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-ALLOWED-HELP; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-OBSERVED-HELP; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-DECLARED-EXTERNAL-HELP; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-UNKNOWN-HELP-CONDITIONS; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-TIMELINESS-SOURCE; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-TIMELINESS-EVALUATED-AT; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-INTENT-CREDENTIAL-REF; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-INTENT-CREDENTIAL-VERSION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| HW-OBJ-ITEM.HW-ITEM-F-ID; version=HW-ITEM-F-ITEM-VERSION; cardinality=ONE | — |
| HW-OBJ-ITEM.HW-ITEM-F-ITEM-VERSION; version=HW-ITEM-F-ITEM-VERSION; cardinality=ONE | — |
| HW-OBJ-RUBRIC.HW-RUBRIC-F-ID; version=HW-RUBRIC-F-RUBRIC-VERSION; cardinality=ONE | — |
| HW-OBJ-RUBRIC.HW-RUBRIC-F-RUBRIC-VERSION; version=HW-RUBRIC-F-RUBRIC-VERSION; cardinality=ONE | — |
| GRD-OBJ-CAPABILITY-RULE.GRD-CAP-F-RULE-ID; version=GRD-CAP-F-RULE-VERSION; cardinality=ONE | — |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT.PLAT-P2ENT-F-ID; version=PLAT-P2ENT-F-VERSION; cardinality=ONE | — |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT.PLAT-P2ENT-F-SCHOOL-REF; version=PLAT-P2ENT-F-VERSION; cardinality=ONE | — |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT.PLAT-P2ENT-F-CORE-AI-ENTITLEMENTS; version=PLAT-P2ENT-F-VERSION; cardinality=ONE | — |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT.PLAT-P2ENT-F-VERSION; version=PLAT-P2ENT-F-VERSION; cardinality=ONE | — |
| GRD-OBJ-ASSESSMENT-STANDARD-VERSION.GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF; version=GRD-STANDARD-F-VERSION; cardinality=ONE | — |
| GRD-OBJ-ASSESSMENT-STANDARD-VERSION.GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION; version=GRD-STANDARD-F-VERSION; cardinality=ONE | — |
| GRD-OBJ-ASSESSMENT-STANDARD-VERSION.GRD-STANDARD-F-ID; version=GRD-STANDARD-F-VERSION; cardinality=ONE | — |
| GRD-OBJ-ASSESSMENT-STANDARD-VERSION.GRD-STANDARD-F-VERSION; version=GRD-STANDARD-F-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | SUB-ACT-HANDOFF-ACCEPTED | — | [] |
| 2 | GRD-ACT-CLASSIFY-INITIAL-ATTEMPT | classify the initial submission as substantive, explicit don't-know, blank, unrelated, or placeholder without inferring completion or mastery | [{"fieldId":"GRD-ATTEMPT-CLASS-F-SUBMISSION-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"GRD-ATTEMPT-CLASS-F-SUBMISSION-VERSION","provider":{"actorRef":"SYSTEM"}}] |
| 3 | HW-ACT-RESOLVE-GRADING-SNAPSHOT | — | [] |
| 4 | GRD-ACT-CHECK-PHASE-TWO-ASSESSMENT-READINESS | resolve the exact frozen assessment-standard version bound to the accepted submission activity snapshot | [] |
| 5 | GRD-ACT-ENQUEUE | — | [{"fieldId":"GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION","provider":{"actorRef":"SYSTEM"}}] |
| 6 | GRD-ACT-ROUTE-UNSUPPORTED | source or input quality requires a concrete supplementation request | [] |
| 7 | PLAT-ACT-RESOLVE-ACTIVE-PHASE-TWO-ENTITLEMENT | the pinned submission activity resolves to exactly one same-school ACTIVE D090 entitlement | [{"fieldId":"PLAT-P2ENT-F-SCHOOL-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"PLAT-P2ENT-F-SCHOOL-VERSION","provider":{"actorRef":"SYSTEM"}}] |
| 8 | GRD-ACT-PROCESS | the source versions, frozen assessment standard, exact ACTIVE same-school D090 entitlement, external-processing contract, and input quality permit AI assessment | [{"fieldId":"GRD-DECISION-F-CORE-ENTITLEMENT-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"GRD-DECISION-F-CORE-ENTITLEMENT-VERSION","provider":{"actorRef":"SYSTEM"}}] |
| 9 | GRD-ACT-ROUTE | AI assessment returns one explicit next step without routine human intervention | [] |
| 10 | GRD-ACT-ROUTE-AI-UNAVAILABLE | a permitted alternate review is attempted before the professional exception queue | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| GRD-OBJ-DECISION.GRD-DECISION-F-SUBMISSION-REF; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-SUBMISSION-VERSION; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-ITEM-REF; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-ITEM-VERSION; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-RUBRIC-REF; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-RUBRIC-VERSION; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-CAPABILITY-RULE-REF; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-CAPABILITY-RULE-VERSION; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-ROUTE; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-DECISION-VERSION; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION.GRD-ATTEMPT-CLASS-F-ID; version=GRD-ATTEMPT-CLASS-F-VERSION | — |
| GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION.GRD-ATTEMPT-CLASS-F-CLASSIFICATION; version=GRD-ATTEMPT-CLASS-F-VERSION | — |
| GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION.GRD-ATTEMPT-CLASS-F-VERSION; version=GRD-ATTEMPT-CLASS-F-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-CORE-ENTITLEMENT-REF; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-CORE-ENTITLEMENT-VERSION; version=GRD-DECISION-F-DECISION-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["SUB-ATTEMPT-F-ID","HW-RUBRIC-F-ID","GRD-CAP-F-RULE-ID","GRD-STANDARD-F-ID","PLAT-P2ENT-F-ID"],"versionFieldIds":["SUB-ATTEMPT-F-SUBMISSION-VERSION","HW-ITEM-F-ITEM-VERSION","HW-RUBRIC-F-RUBRIC-VERSION","GRD-CAP-F-RULE-VERSION","GRD-STANDARD-F-VERSION","PLAT-P2ENT-F-VERSION"],"fanoutFieldId":"HW-ITEM-F-ID"} | SUBMISSION_ITEM_AI_ASSESSMENT_RESULT_VERSION | {"strategy":"RETRY_FAILED_AI_ASSESSMENT_WITHOUT_CHANGING_SUBMISSION_FACTS","maxAttempts":3,"retryableFailureResults":["AI_UNAVAILABLE","VERSION_CONFLICT"]} | {"strategy":"KEEP_UNPUBLISHED_AND_RETURN_AN_EXPLICIT_RECOVERY_NEXT_STEP","description":"an AI failure preserves the accepted submission and frozen standard, then requests concrete supplementation, permitted alternate review, or bounded professional exception review"} | {"strategy":"INVALIDATE_STALE_AI_ASSESSMENT_DERIVED_VIEWS","targets":["AI assessment result","exception queue","publication eligibility"]} |

## DF-007 Bounded Professional AI Assessment Exception Resolution

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | GENERIC | GRD-001 | "ACTION_CHOICE_REQUIRED" | PROFESSIONAL_EXCEPTION_RESULT_VERSION | {"strategy":"REFRESH_SOURCE_VERSIONS_THEN_RETRY_PROFESSIONAL_EXCEPTION","maxAttempts":3,"retryableFailureResults":["STALE_INPUT_VERSION","SOURCE_VERSION_STILL_STALE","VERSION_CONFLICT"]} | {"strategy":"KEEP_PRIOR_EFFECTIVE_ASSESSMENT_RESULT","description":"a failed exception resolution never replaces the prior effective result and never publishes an unresolved exception"} | {"strategy":"INVALIDATE_PUBLICATION_ELIGIBILITY_AND_DERIVED_EXPLANATIONS","targets":["result publication eligibility","assessment explanation","knowledge evidence projection"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| GRD-OBJ-DECISION.GRD-DECISION-F-ID; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-SUBMISSION-REF; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-SUGGESTED-SCORE; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-SCORING-RATIONALE; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | GRD-ACT-CORRECT-RECOGNITION | an authorized specialist corrects recognition evidence without changing the original submission; this path is unavailable for routine assessment | [{"fieldId":"GRD-DECISION-F-RECOGNIZED-ANSWER","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"GRD-DECISION-F-RECOGNIZED-REGION","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"GRD-DECISION-F-CORRECTION-REASON","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 2 | GRD-ACT-ACCEPT-SUGGESTION | an authorized professional exception uses the existing AI result with evidence-backed feedback; this path is unavailable for routine assessment | [{"fieldId":"GRD-DECISION-F-TEACHER-FEEDBACK","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 3 | GRD-ACT-OVERRIDE-SCORE | an authorized professional exception records an evidence-backed score, level, or feedback correction; this path is unavailable for routine assessment | [{"fieldId":"GRD-DECISION-F-CORRECTION-REASON","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 4 | GRD-ACT-MANUAL-GRADE | the explicit next step requires a bounded professional exception resolution; this path is unavailable for routine assessment | [] |
| 5 | GRD-ACT-BATCH-CONFIRM | each selected result independently qualifies for the same bounded professional exception resolution; this path is unavailable for routine assessment | [] |
| 6 | GRD-ACT-RESOLVE-VERSION-CONFLICT | an authorized specialist resolves only the stale source-version conflict; this path is unavailable for routine assessment | [{"fieldId":"GRD-DECISION-F-CORRECTION-REASON","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |
| USE_EXISTING_AI_RESULT | — | 2 | {"kind":"ACTION_CHOICE","consumerStepOrder":2} | [] | [] | {} |
| CORRECT_RECOGNITION_AND_USE_AI_RESULT | — | 1 → 2 | {"kind":"ACTION_CHOICE","consumerStepOrder":2} | [] | [] | {} |
| EVIDENCE_BACKED_EXCEPTION_CORRECTION | — | 3 | {"kind":"ACTION_CHOICE","consumerStepOrder":3} | [{"stepOrder":3,"fieldId":"GRD-DECISION-F-OFFICIAL-SCORE","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"stepOrder":3,"fieldId":"GRD-DECISION-F-TEACHER-FEEDBACK","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] | [] | {} |
| CORRECT_RECOGNITION_AND_EXCEPTION_CORRECTION | — | 1 → 3 | {"kind":"ACTION_CHOICE","consumerStepOrder":3} | [{"stepOrder":3,"fieldId":"GRD-DECISION-F-OFFICIAL-SCORE","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"stepOrder":3,"fieldId":"GRD-DECISION-F-TEACHER-FEEDBACK","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] | [] | {} |
| PROFESSIONAL_EXCEPTION_RESOLUTION | — | 4 | {"kind":"ACTION_CHOICE","consumerStepOrder":4} | [{"stepOrder":4,"fieldId":"GRD-DECISION-F-OFFICIAL-SCORE","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"stepOrder":4,"fieldId":"GRD-DECISION-F-TEACHER-FEEDBACK","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] | [] | {} |
| BOUNDED_BATCH_EXCEPTION_RESOLUTION | — | 5 | {"kind":"ACTION_CHOICE","consumerStepOrder":5} | [] | [] | {} |
| RESOLVE_VERSION_CONFLICT | — | 6 | {"kind":"ACTION_CHOICE","consumerStepOrder":6} | [] | [] | {} |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| GRD-OBJ-DECISION.GRD-DECISION-F-OFFICIAL-SCORE; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-TEACHER-FEEDBACK; version=GRD-DECISION-F-DECISION-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["GRD-DECISION-F-ID"],"versionFieldIds":["GRD-DECISION-F-DECISION-VERSION"],"fanoutFieldId":"GRD-DECISION-F-SUBMISSION-REF"} | PROFESSIONAL_EXCEPTION_RESULT_VERSION | {"strategy":"REFRESH_SOURCE_VERSIONS_THEN_RETRY_PROFESSIONAL_EXCEPTION","maxAttempts":3,"retryableFailureResults":["STALE_INPUT_VERSION","SOURCE_VERSION_STILL_STALE","VERSION_CONFLICT"]} | {"strategy":"KEEP_PRIOR_EFFECTIVE_ASSESSMENT_RESULT","description":"a failed exception resolution never replaces the prior effective result and never publishes an unresolved exception"} | {"strategy":"INVALIDATE_PUBLICATION_ELIGIBILITY_AND_DERIVED_EXPLANATIONS","targets":["result publication eligibility","assessment explanation","knowledge evidence projection"]} |

## DF-008 AI Assessment Gate Evaluation and Publication

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | GENERIC | GRD-001 / PUB-001 / CORR-001 | "NONE" | SELECTED_STUDENT_RESULT_OR_CORRECTION_TASK_OBJECT_WITH_PARTIAL_SUCCESS | {"strategy":"RETRY_FAILED_STUDENT_RESULTS_OR_CORRECTION_TASKS_ONLY","maxAttempts":5,"retryableFailureResults":["OBJECT_PUBLICATION_FAILED","SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"DO_NOT_UNPUBLISH_SUCCESSFUL_RESULTS","description":"retain successful student results and correction tasks, then retry only failed result or correction task objects after eligibility and source versions are rechecked"} | {"strategy":"INVALIDATE_STALE_STUDENT_RESULT_READS","targets":["student score view","student feedback view","notification delivery state"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| GRD-OBJ-DECISION.GRD-DECISION-F-ID; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-OFFICIAL-SCORE; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| PUB-OBJ-BATCH.PUB-BATCH-F-ID; version=PUB-BATCH-F-BATCH-VERSION; cardinality=ONE | — |
| PUB-OBJ-BATCH.PUB-BATCH-F-SELECTED-STUDENT-IDS; version=PUB-BATCH-F-BATCH-VERSION; cardinality=ONE | — |
| PUB-OBJ-BATCH.PUB-BATCH-F-STUDENT-SCOPE-SNAPSHOT; version=PUB-BATCH-F-BATCH-VERSION; cardinality=ONE | — |
| PUB-OBJ-BATCH.PUB-BATCH-F-VISIBILITY-POLICY; version=PUB-BATCH-F-BATCH-VERSION; cardinality=ONE | — |
| PUB-OBJ-BATCH.PUB-BATCH-F-ANSWER-VISIBLE-AT; version=PUB-BATCH-F-BATCH-VERSION; cardinality=ONE | — |
| PUB-OBJ-BATCH.PUB-BATCH-F-FEEDBACK-VISIBLE-AT; version=PUB-BATCH-F-BATCH-VERSION; cardinality=ONE | — |
| PUB-OBJ-BATCH.PUB-BATCH-F-NOTIFICATION-POLICY; version=PUB-BATCH-F-BATCH-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | GRD-ACT-ACCEPT-SUGGESTION | an authorized professional exception uses the existing AI result; routine determined results skip this optional step | [{"fieldId":"GRD-DECISION-F-SUGGESTED-SCORE","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"GRD-DECISION-F-TEACHER-FEEDBACK","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 2 | GRD-ACT-OVERRIDE-SCORE | an authorized evidence-backed professional exception correction exists; routine determined results skip this optional step | [{"fieldId":"GRD-DECISION-F-CORRECTION-REASON","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 3 | GRD-ACT-MANUAL-GRADE | the explicit next step is EXCEPTION_REVIEW_REQUIRED and an authorized specialist resolves it | [] |
| 4 | PUB-ACT-PREVIEW | — | [{"fieldId":"PUB-PREVIEW-F-BATCH-REF","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"PUB-PREVIEW-F-STUDENT-REF","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"PUB-PREVIEW-F-DECISION-REF","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 5 | PUB-ACT-PREPARE-BATCH | object-level eligibility and blocking codes are complete | [] |
| 6 | PUB-ACT-PUBLISH-SELECTED | every selected result has one explicit next step and all required gates are ready for object-level evaluation | [] |
| 7 | PUB-ACT-MATERIALIZE-RESULT | create one ready result for each eligible selected student | [] |
| 8 | PUB-ACT-PUBLISH-RESULT | permission, safety, and teaching correctness gates all pass; any failure keeps the result unpublished | [] |
| 9 | CORR-ACT-AUTO-CREATE-TASK | the published result requires correction and no correction task exists for its exact result version | [] |
| 10 | PUB-ACT-FINALIZE-BATCH | all student result attempts and required correction task creations have an object-level outcome | [] |
| 11 | PUB-ACT-RETRY-FAILED | only object-level failed student results are retried | [] |
| 12 | PUB-ACT-RECONCILE-BATCH | all retried student results now have a terminal object-level outcome | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| PUB-OBJ-BATCH.PUB-BATCH-F-OBJECT-RESULTS; version=PUB-BATCH-F-BATCH-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-RESULT-VERSION; version=PUB-RESULT-F-RESULT-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-STUDENT-REF; version=PUB-RESULT-F-RESULT-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-SOURCE-DECISION-REF; version=PUB-RESULT-F-RESULT-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-DECISION-VERSION; version=PUB-RESULT-F-RESULT-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-ANSWER; version=PUB-RESULT-F-RESULT-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-SCORE; version=PUB-RESULT-F-RESULT-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-FEEDBACK; version=PUB-RESULT-F-RESULT-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-ANSWER-VISIBLE-AT; version=PUB-RESULT-F-RESULT-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-SCORE-VISIBLE-AT; version=PUB-RESULT-F-RESULT-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-FEEDBACK-VISIBLE-AT; version=PUB-RESULT-F-RESULT-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-NOTIFICATION-STATUS; version=PUB-RESULT-F-RESULT-VERSION | — |
| CORR-OBJ-TASK.CORR-TASK-F-ID; version=CORR-TASK-F-TASK-VERSION | — |
| CORR-OBJ-TASK.CORR-TASK-F-STUDENT-REF; version=CORR-TASK-F-TASK-VERSION | — |
| CORR-OBJ-TASK.CORR-TASK-F-SOURCE-DATA-ID; version=CORR-TASK-F-TASK-VERSION | — |
| CORR-OBJ-TASK.CORR-TASK-F-SOURCE-RESULT-REF; version=CORR-TASK-F-TASK-VERSION | — |
| CORR-OBJ-TASK.CORR-TASK-F-SOURCE-RESULT-VERSION; version=CORR-TASK-F-TASK-VERSION | — |
| CORR-OBJ-TASK.CORR-TASK-F-DUE-AT; version=CORR-TASK-F-TASK-VERSION | — |
| CORR-OBJ-TASK.CORR-TASK-F-TASK-VERSION; version=CORR-TASK-F-TASK-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["GRD-DECISION-F-ID","PUB-BATCH-F-ID"],"versionFieldIds":["GRD-DECISION-F-DECISION-VERSION","PUB-BATCH-F-BATCH-VERSION"],"fanoutFieldId":"PUB-BATCH-F-STUDENT-SCOPE-SNAPSHOT"} | SELECTED_STUDENT_RESULT_OR_CORRECTION_TASK_OBJECT_WITH_PARTIAL_SUCCESS | {"strategy":"RETRY_FAILED_STUDENT_RESULTS_OR_CORRECTION_TASKS_ONLY","maxAttempts":5,"retryableFailureResults":["OBJECT_PUBLICATION_FAILED","SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"DO_NOT_UNPUBLISH_SUCCESSFUL_RESULTS","description":"retain successful student results and correction tasks, then retry only failed result or correction task objects after eligibility and source versions are rechecked"} | {"strategy":"INVALIDATE_STALE_STUDENT_RESULT_READS","targets":["student score view","student feedback view","notification delivery state"]} |

## DF-009 Batch AI Assessment Impact Location, Correction, Notification, and Recalculation

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | GENERIC | GRD-001 / PUB-001 / CORR-001 | "NONE" | AFFECTED_ASSESSMENT_RESULT_VERSION | {"strategy":"RETRY_ONLY_FAILED_AFFECTED_RESULT_VERSIONS","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_ORIGINAL_FACTS_AND_PRIOR_RESULT_VERSIONS","description":"failed recalculation never overwrites a submission or removes the last auditable result version"} | {"strategy":"PUBLISH_VERSIONED_DERIVED_INVALIDATION_FOR_PHASE_OWNERS","targets":["CURRENT_RESULT","FUTURE_COGNITION","FUTURE_PLAN","FUTURE_REPORT","FUTURE_LEARNING_PATH"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| GRD-OBJ-DECISION.GRD-DECISION-F-ID; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-DECISION-VERSION; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-OFFICIAL-SCORE; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-TEACHER-FEEDBACK; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-CORRECTION-REASON; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-ID; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ONE | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-STUDENT-REF; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ONE | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-RESULT-VERSION; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ONE | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-CORRECTION-DECISION-REF; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ONE | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-NEW-DECISION-VERSION; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ONE | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-PUBLIC-CORRECTION-NOTE; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | PUB-ACT-RESOLVE-DEPENDENCY-SNAPSHOT | locate every result version affected by the reported question, answer, standard, model, or rule version | [] |
| 2 | GRD-ACT-OPEN-CONFIRMED-REVISION | open a versioned recalculation scope without modifying the original submission or superseded result | [] |
| 3 | GRD-ACT-CONFIRM-REVISION | produce the corrected assessment result version under the same source and gate rules | [] |
| 4 | PUB-ACT-CORRECT-RESULT | replace current derived use while retaining the prior published result version | [] |
| 5 | CORR-ACT-RECORD-INVALIDATION | record downstream invalidation targets for later phase-owned recalculation consumers | [] |
| 6 | PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION | publish the corrected explanation only after all gates pass and queue affected-user notification | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| PUB-OBJ-DEPENDENCY-SNAPSHOT.PUB-DEPENDENCY-SNAPSHOT-F-ID; version=PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION | — |
| PUB-OBJ-DEPENDENCY-SNAPSHOT.PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-REF; version=PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION | — |
| PUB-OBJ-DEPENDENCY-SNAPSHOT.PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-VERSION; version=PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION | — |
| PUB-OBJ-DEPENDENCY-SNAPSHOT.PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET; version=PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION | — |
| PUB-OBJ-DEPENDENCY-SNAPSHOT.PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION; version=PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-DECISION-VERSION; version=GRD-DECISION-F-DECISION-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-CORRECTION-DECISION-REF; version=PUB-RESULT-F-CORRECTION-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-NEW-DECISION-VERSION; version=PUB-RESULT-F-CORRECTION-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-CORRECTION-VERSION; version=PUB-RESULT-F-CORRECTION-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-INVALIDATION-VERSION; version=PUB-RESULT-F-INVALIDATION-VERSION | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS; version=PUB-RESULT-F-INVALIDATION-VERSION | — |
| CORR-OBJ-INVALIDATION.CORR-INVALIDATION-F-ID; version=CORR-INVALIDATION-F-INVALIDATION-VERSION | — |
| CORR-OBJ-INVALIDATION.CORR-INVALIDATION-F-TARGET-KINDS; version=CORR-INVALIDATION-F-INVALIDATION-VERSION | — |
| CORR-OBJ-INVALIDATION.CORR-INVALIDATION-F-TARGET-TRANSITIONS; version=CORR-INVALIDATION-F-INVALIDATION-VERSION | — |
| CORR-OBJ-INVALIDATION.CORR-INVALIDATION-F-TARGET-VERSIONS; version=CORR-INVALIDATION-F-INVALIDATION-VERSION | — |
| CORR-OBJ-INVALIDATION.CORR-INVALIDATION-F-TARGET-OUTCOMES; version=CORR-INVALIDATION-F-INVALIDATION-VERSION | — |
| CORR-OBJ-INVALIDATION.CORR-INVALIDATION-F-HISTORY-PRESERVATION; version=CORR-INVALIDATION-F-INVALIDATION-VERSION | — |
| CORR-OBJ-INVALIDATION.CORR-INVALIDATION-F-INVALIDATION-VERSION; version=CORR-INVALIDATION-F-INVALIDATION-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["GRD-DECISION-F-ID","PUB-RESULT-F-ID","PUB-DEPENDENCY-SNAPSHOT-F-ID"],"versionFieldIds":["GRD-DECISION-F-DECISION-VERSION","PUB-RESULT-F-RESULT-VERSION","PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION"],"fanoutFieldId":"PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET"} | AFFECTED_ASSESSMENT_RESULT_VERSION | {"strategy":"RETRY_ONLY_FAILED_AFFECTED_RESULT_VERSIONS","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_ORIGINAL_FACTS_AND_PRIOR_RESULT_VERSIONS","description":"failed recalculation never overwrites a submission or removes the last auditable result version"} | {"strategy":"PUBLISH_VERSIONED_DERIVED_INVALIDATION_FOR_PHASE_OWNERS","targets":["CURRENT_RESULT","FUTURE_COGNITION","FUTURE_PLAN","FUTURE_REPORT","FUTURE_LEARNING_PATH"]} |

## DF-010 Professional Exception Correction and Versioned Downstream Recalculation

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | GENERIC | PUB-001 / CORR-001 | "OPTION_VALUE_REQUIRED" | CORRECTION_ATTEMPT_AND_RESULT_INVALIDATION_VERSION | {"strategy":"RETRY_ONLY_FAILED_CORRECTION_OR_INVALIDATION_OBJECTS","maxAttempts":3,"retryableFailureResults":["VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_PRIOR_RESULT_AND_CORRECTION_HISTORY","description":"failed exception handling preserves the last visible result and every student correction attempt"} | {"strategy":"PUBLISH_VERSIONED_DERIVED_INVALIDATION_FOR_PHASE_OWNERS","targets":["CURRENT_RESULT","FUTURE_COGNITION","FUTURE_PLAN"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| PUB-OBJ-RESULT.PUB-RESULT-F-ID; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ONE | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-STUDENT-REF; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ONE | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-SOURCE-DECISION-REF; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ONE | — |
| PUB-OBJ-RESULT.PUB-RESULT-F-DECISION-VERSION; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ONE | — |
| CORR-OBJ-TASK.CORR-TASK-F-ID; version=CORR-TASK-F-TASK-VERSION; cardinality=ONE | — |
| CORR-OBJ-TASK.CORR-TASK-F-STUDENT-REF; version=CORR-TASK-F-TASK-VERSION; cardinality=ONE | — |
| CORR-OBJ-TASK.CORR-TASK-F-SOURCE-RESULT-REF; version=CORR-TASK-F-TASK-VERSION; cardinality=ONE | — |
| CORR-OBJ-TASK.CORR-TASK-F-SOURCE-RESULT-VERSION; version=CORR-TASK-F-TASK-VERSION; cardinality=ONE | — |
| CORR-OBJ-TASK.CORR-TASK-F-TASK-VERSION; version=CORR-TASK-F-TASK-VERSION; cardinality=ONE | — |
| CORR-OBJ-ATTEMPT.CORR-ATTEMPT-F-ID; version=CORR-ATTEMPT-F-CORRECTION-VERSION; cardinality=ONE | — |
| CORR-OBJ-ATTEMPT.CORR-ATTEMPT-F-TASK-REF; version=CORR-ATTEMPT-F-CORRECTION-VERSION; cardinality=ONE | — |
| CORR-OBJ-ATTEMPT.CORR-ATTEMPT-F-TASK-VERSION; version=CORR-ATTEMPT-F-CORRECTION-VERSION; cardinality=ONE | — |
| CORR-OBJ-ATTEMPT.CORR-ATTEMPT-F-CORRECTION-ANSWER; version=CORR-ATTEMPT-F-CORRECTION-VERSION; cardinality=ONE | — |
| CORR-OBJ-ATTEMPT.CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT; version=CORR-ATTEMPT-F-CORRECTION-VERSION; cardinality=ONE | — |
| CORR-OBJ-ATTEMPT.CORR-ATTEMPT-F-CORRECTION-VERSION; version=CORR-ATTEMPT-F-CORRECTION-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | PUB-ACT-VIEW-RESULT | the student's published result and source decision versions are visible | [] |
| 2 | CORR-ACT-NORMALIZE-SUBMISSION | exactly one initial, late, or repeated student submission has reached SUBMITTED | [{"fieldId":"CORR-ASSESSMENT-F-SOURCE-ATTEMPT-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION","provider":{"actorRef":"SYSTEM"}}] |
| 3 | CORR-ACT-CONFIRM-JUDGMENT | the explicit next step is EXCEPTION_REVIEW_REQUIRED and an authorized specialist records a completed exception resolution | [{"fieldId":"CORR-ATTEMPT-F-TEACHER-JUDGMENT","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 4 | CORR-ACT-REQUEST-RETRY | the explicit next step is EXCEPTION_REVIEW_REQUIRED and an authorized specialist records the precise missing evidence or retry condition | [] |
| 5 | CORR-ACT-COMPLETE-TASK | a PASSED or CLOSED judgment completes the exact guarded correction Task before dependent work | [] |
| 6 | CORR-ACT-MARK-TASK-AWAITING-RETRY | a NOT-PASSED or NEEDS-MORE judgment moves the exact guarded correction Task to AWAITING_RETRY and terminates | [] |
| 7 | CORR-ACT-RECORD-INVALIDATION | the exception resolution emits versioned invalidation targets without directly executing phase-three cognition or plan actions | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |
| PASSED | — | 1 → 2 → 3 → 5 → 7 | {"kind":"OPTION_VALUE","fieldId":"CORR-ATTEMPT-F-TEACHER-JUDGMENT","values":["PASSED"],"consumerStepOrder":3} | [] | [] | {} |
| CLOSED | — | 1 → 2 → 3 → 5 → 7 | {"kind":"OPTION_VALUE","fieldId":"CORR-ATTEMPT-F-TEACHER-JUDGMENT","values":["CLOSED"],"consumerStepOrder":3} | [] | [] | {} |
| NOT_PASSED | — | 1 → 2 → 4 → 6 | {"kind":"OPTION_VALUE","fieldId":"CORR-ATTEMPT-F-TEACHER-JUDGMENT","values":["NOT-PASSED"],"consumerStepOrder":4} | [{"stepOrder":4,"fieldId":"CORR-ATTEMPT-F-TEACHER-JUDGMENT","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] | [] | {} |
| NEEDS_MORE | — | 1 → 2 → 4 → 6 | {"kind":"OPTION_VALUE","fieldId":"CORR-ATTEMPT-F-TEACHER-JUDGMENT","values":["NEEDS-MORE"],"consumerStepOrder":4} | [{"stepOrder":4,"fieldId":"CORR-ATTEMPT-F-TEACHER-JUDGMENT","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] | [] | {} |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| CORR-OBJ-ATTEMPT.CORR-ATTEMPT-F-TEACHER-JUDGMENT; version=CORR-ATTEMPT-F-CORRECTION-VERSION | — |
| CORR-OBJ-ATTEMPT.CORR-ATTEMPT-F-CORRECTION-VERSION; version=CORR-ATTEMPT-F-CORRECTION-VERSION | — |
| CORR-OBJ-INVALIDATION.CORR-INVALIDATION-F-ID; version=CORR-INVALIDATION-F-INVALIDATION-VERSION | — |
| CORR-OBJ-INVALIDATION.CORR-INVALIDATION-F-TARGET-KINDS; version=CORR-INVALIDATION-F-INVALIDATION-VERSION | — |
| CORR-OBJ-INVALIDATION.CORR-INVALIDATION-F-TARGET-TRANSITIONS; version=CORR-INVALIDATION-F-INVALIDATION-VERSION | — |
| CORR-OBJ-INVALIDATION.CORR-INVALIDATION-F-TARGET-VERSIONS; version=CORR-INVALIDATION-F-INVALIDATION-VERSION | — |
| CORR-OBJ-INVALIDATION.CORR-INVALIDATION-F-HISTORY-PRESERVATION; version=CORR-INVALIDATION-F-INVALIDATION-VERSION | — |
| CORR-OBJ-ATTEMPT-ASSESSMENT.CORR-ASSESSMENT-F-ID; version=CORR-ASSESSMENT-F-VERSION | — |
| CORR-OBJ-ATTEMPT-ASSESSMENT.CORR-ASSESSMENT-F-SOURCE-ATTEMPT-REF; version=CORR-ASSESSMENT-F-VERSION | — |
| CORR-OBJ-ATTEMPT-ASSESSMENT.CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION; version=CORR-ASSESSMENT-F-VERSION | — |
| CORR-OBJ-ATTEMPT-ASSESSMENT.CORR-ASSESSMENT-F-VALID-ATTEMPT; version=CORR-ASSESSMENT-F-VERSION | — |
| CORR-OBJ-ATTEMPT-ASSESSMENT.CORR-ASSESSMENT-F-NEXT-STEP; version=CORR-ASSESSMENT-F-VERSION | — |
| CORR-OBJ-ATTEMPT-ASSESSMENT.CORR-ASSESSMENT-F-VALIDITY-STATUS; version=CORR-ASSESSMENT-F-VERSION | — |
| CORR-OBJ-ATTEMPT-ASSESSMENT.CORR-ASSESSMENT-F-DISPUTE-CORRECTION-STATUS; version=CORR-ASSESSMENT-F-VERSION | — |
| CORR-OBJ-ATTEMPT-ASSESSMENT.CORR-ASSESSMENT-F-VERSION; version=CORR-ASSESSMENT-F-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["PUB-RESULT-F-ID","CORR-TASK-F-ID"],"versionFieldIds":["PUB-RESULT-F-RESULT-VERSION","CORR-TASK-F-TASK-VERSION","CORR-ATTEMPT-F-CORRECTION-VERSION"],"fanoutFieldId":"CORR-ATTEMPT-F-ID"} | CORRECTION_ATTEMPT_AND_RESULT_INVALIDATION_VERSION | {"strategy":"RETRY_ONLY_FAILED_CORRECTION_OR_INVALIDATION_OBJECTS","maxAttempts":3,"retryableFailureResults":["VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_PRIOR_RESULT_AND_CORRECTION_HISTORY","description":"failed exception handling preserves the last visible result and every student correction attempt"} | {"strategy":"PUBLISH_VERSIONED_DERIVED_INVALIDATION_FOR_PHASE_OWNERS","targets":["CURRENT_RESULT","FUTURE_COGNITION","FUTURE_PLAN"]} |

## DF-012 Improvement Candidate to Subject Plan and Cross-subject Coordination

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | GENERIC | INS-001 / PLN-001 | "NONE" | STUDENT_SUBJECT_PLAN_AND_SYNC_OUTPUT_OBJECT | {"strategy":"RETRY_FAILED_SYNC_OR_TODO_OUTPUT_AFTER_SOURCE_VERSION_REFRESH","maxAttempts":4,"retryableFailureResults":["SYNC_DELIVERY_FAILED","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_CONFIRMED_PLAN_AND_RETRY_ONLY_FAILED_OUTPUTS","description":"a sync failure never rolls back the teacher-confirmed plan and never grants homeroom plan-content mutation"} | {"strategy":"INVALIDATE_STALE_PLAN_OUTPUTS_BY_OBJECT_VERSION","targets":["subject teacher sync output","homeroom coordination output"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-ID; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-STUDENT-REF; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-KNOWLEDGE-POINT-REF; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-RESULT; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-TEACHER-CONFIRMATION; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-EVIDENCE-VERSION; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | INS-ACT-READ-CONFIRMED-EVIDENCE | the evidence and mastery interpretation are teacher-confirmed and current | [] |
| 2 | PLN-ACT-CREATE-CANDIDATE | the evidence supports a versioned improvement candidate | [] |
| 3 | PLN-ACT-CONFIRM-PLAN | the corresponding subject teacher confirms the plan content | [{"fieldId":"PLN-PLAN-F-GOAL","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"PLN-PLAN-F-TASK-CONTENT","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"PLN-PLAN-F-WORKLOAD","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"PLN-PLAN-F-DUE-AT","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"PLN-PLAN-F-SUCCESS-CONDITION","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"PLN-PLAN-F-EVIDENCE-REQUIREMENT","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"PLN-PLAN-F-REVALIDATION-METHOD","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"PLN-PLAN-F-TEACHER-CONFIRMER-REF","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 4 | PLN-ACT-SYNC-SUBJECT-TEACHER | the confirmed plan creates a subject-teacher synchronization output | [] |
| 5 | PLN-ACT-SYNC-HOMEROOM-COORDINATION | the confirmed plan creates a distinct read-only homeroom coordination output | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| PLN-OBJ-PLAN.PLN-PLAN-F-ID; version=PLN-PLAN-F-PLAN-VERSION | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-SOURCE-EVIDENCE-REF; version=PLN-PLAN-F-PLAN-VERSION | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-SOURCE-EVIDENCE-VERSION; version=PLN-PLAN-F-PLAN-VERSION | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-PLAN-VERSION; version=PLN-PLAN-F-PLAN-VERSION | — |
| PLN-OBJ-SUBJECT-SYNC.PLN-SUBJECT-SYNC-F-OUTPUT-VERSION; version=PLN-SUBJECT-SYNC-F-OUTPUT-VERSION | — |
| PLN-OBJ-HOMEROOM-COORDINATION.PLN-HOMEROOM-F-OUTPUT-VERSION; version=PLN-HOMEROOM-F-OUTPUT-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["INS-EVIDENCE-F-ID"],"versionFieldIds":["INS-EVIDENCE-F-EVIDENCE-VERSION"],"fanoutFieldId":"INS-EVIDENCE-F-STUDENT-REF"} | STUDENT_SUBJECT_PLAN_AND_SYNC_OUTPUT_OBJECT | {"strategy":"RETRY_FAILED_SYNC_OR_TODO_OUTPUT_AFTER_SOURCE_VERSION_REFRESH","maxAttempts":4,"retryableFailureResults":["SYNC_DELIVERY_FAILED","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_CONFIRMED_PLAN_AND_RETRY_ONLY_FAILED_OUTPUTS","description":"a sync failure never rolls back the teacher-confirmed plan and never grants homeroom plan-content mutation"} | {"strategy":"INVALIDATE_STALE_PLAN_OUTPUTS_BY_OBJECT_VERSION","targets":["subject teacher sync output","homeroom coordination output"]} |

## DF-014 Student Management Profile Aggregation

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | GENERIC | SCO-001 / INS-001 / PLN-001 / STU-001 | "NONE" | STUDENT_PROFILE_SOURCE_AND_PROJECTION_OBJECT | {"strategy":"REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_PROFILE_OBJECTS","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT"]} | {"strategy":"KEEP_PRIOR_PROFILE_VIEW_VERSION","description":"a failed aggregation preserves the prior profile view definition and retries only stale or failed student objects"} | {"strategy":"INVALIDATE_ONLY_STALE_PROFILE_PROJECTIONS","targets":["gradebook view definition","student profile view definition"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| SCO-OBJ-VIEW.SCO-VIEW-F-ID; version=SCO-VIEW-F-VIEW-VERSION; cardinality=ONE | — |
| SCO-OBJ-VIEW.SCO-VIEW-F-RESULT-REF; version=SCO-VIEW-F-VIEW-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-ID; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-STUDENT-REF; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-EVIDENCE-VERSION; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-ID; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ONE | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-PLAN-VERSION; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ONE | — |
| PLN-OBJ-HOMEROOM-COORDINATION.PLN-HOMEROOM-F-ID; version=PLN-HOMEROOM-F-OUTPUT-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | SCO-ACT-READ-GRADEBOOK | the score view resolves exact PUB, INS, and PLN source versions | [] |
| 2 | INS-ACT-READ-CONFIRMED-EVIDENCE | the authorized evidence version is current | [] |
| 3 | PLN-ACT-VIEW-HOMEROOM-COORDINATION | the coordination output remains read-only and version-pinned | [] |
| 4 | STU-ACT-BUILD-PROFILE | the profile materializes only query, column, saved-view, and source-lineage definitions | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| STU-OBJ-PROFILE.STU-PROFILE-F-ID; version=STU-PROFILE-F-PROFILE-VERSION | — |
| STU-OBJ-PROFILE.STU-PROFILE-F-RESULT-REF; version=STU-PROFILE-F-PROFILE-VERSION | — |
| STU-OBJ-PROFILE.STU-PROFILE-F-RESULT-VERSION; version=STU-PROFILE-F-PROFILE-VERSION | — |
| STU-OBJ-PROFILE.STU-PROFILE-F-EVIDENCE-REF; version=STU-PROFILE-F-PROFILE-VERSION | — |
| STU-OBJ-PROFILE.STU-PROFILE-F-EVIDENCE-VERSION; version=STU-PROFILE-F-PROFILE-VERSION | — |
| STU-OBJ-PROFILE.STU-PROFILE-F-PLAN-REF; version=STU-PROFILE-F-PROFILE-VERSION | — |
| STU-OBJ-PROFILE.STU-PROFILE-F-PLAN-VERSION; version=STU-PROFILE-F-PROFILE-VERSION | — |
| STU-OBJ-PROFILE.STU-PROFILE-F-QUERY-DEFINITION; version=STU-PROFILE-F-PROFILE-VERSION | — |
| STU-OBJ-PROFILE.STU-PROFILE-F-COLUMN-DEFINITION; version=STU-PROFILE-F-PROFILE-VERSION | — |
| STU-OBJ-PROFILE.STU-PROFILE-F-PROFILE-VERSION; version=STU-PROFILE-F-PROFILE-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["SCO-VIEW-F-ID","INS-EVIDENCE-F-ID","PLN-PLAN-F-ID","PLN-HOMEROOM-F-ID"],"versionFieldIds":["SCO-VIEW-F-VIEW-VERSION","INS-EVIDENCE-F-EVIDENCE-VERSION","PLN-PLAN-F-PLAN-VERSION","PLN-HOMEROOM-F-OUTPUT-VERSION"],"fanoutFieldId":"INS-EVIDENCE-F-STUDENT-REF"} | STUDENT_PROFILE_SOURCE_AND_PROJECTION_OBJECT | {"strategy":"REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_PROFILE_OBJECTS","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT"]} | {"strategy":"KEEP_PRIOR_PROFILE_VIEW_VERSION","description":"a failed aggregation preserves the prior profile view definition and retries only stale or failed student objects"} | {"strategy":"INVALIDATE_ONLY_STALE_PROFILE_PROJECTIONS","targets":["gradebook view definition","student profile view definition"]} |

## DF-015 First-stage Student Home Projection

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | HW-001 / SUB-001 / APP-001 | "NONE" | STUDENT_HOME_PROJECTION_OBJECT | {"strategy":"REFRESH_AUTHORIZED_SOURCE_VERSIONS_THEN_RETRY_HOME_PROJECTION","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT"]} | {"strategy":"KEEP_PRIOR_HOME_PROJECTION_AND_SOURCE_COMPLETION","description":"projection failure preserves the prior home view and never changes source-owned completion or lateness"} | {"strategy":"INVALIDATE_HOME_PROJECTION_ONLY","targets":["student home projection cache"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-ID; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION; cardinality=ONE | — |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-PURPOSE; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION; cardinality=ONE | — |
| HW-OBJ-STUDENT-ACTIVITY-WINDOW.HW-STUDENT-WINDOW-F-ID; version=HW-STUDENT-WINDOW-F-VERSION; cardinality=ONE | — |
| HW-OBJ-STUDENT-ACTIVITY-WINDOW.HW-STUDENT-WINDOW-F-ACTIVITY-REF; version=HW-STUDENT-WINDOW-F-VERSION; cardinality=ONE | — |
| HW-OBJ-STUDENT-ACTIVITY-WINDOW.HW-STUDENT-WINDOW-F-ACTIVITY-VERSION; version=HW-STUDENT-WINDOW-F-VERSION; cardinality=ONE | — |
| HW-OBJ-STUDENT-ACTIVITY-WINDOW.HW-STUDENT-WINDOW-F-PUBLICATION-SNAPSHOT-REF; version=HW-STUDENT-WINDOW-F-VERSION; cardinality=ONE | — |
| HW-OBJ-STUDENT-ACTIVITY-WINDOW.HW-STUDENT-WINDOW-F-PUBLICATION-SNAPSHOT-VERSION; version=HW-STUDENT-WINDOW-F-VERSION; cardinality=ONE | — |
| HW-OBJ-STUDENT-ACTIVITY-WINDOW.HW-STUDENT-WINDOW-F-STUDENT-REF; version=HW-STUDENT-WINDOW-F-VERSION; cardinality=ONE | — |
| HW-OBJ-STUDENT-ACTIVITY-WINDOW.HW-STUDENT-WINDOW-F-PARTICIPATION-STATUS; version=HW-STUDENT-WINDOW-F-VERSION; cardinality=ONE | — |
| HW-OBJ-STUDENT-ACTIVITY-WINDOW.HW-STUDENT-WINDOW-F-TIME-STATUS; version=HW-STUDENT-WINDOW-F-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-ID; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ZERO_MANY | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RECEIPT-ID; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ZERO_MANY | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-LATE-FLAG; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ZERO_MANY | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | APP-ACT-BUILD-STUDENT-HOME | the four compartments are rebuilt from current authorized source facts | [] |
| 2 | HW-ACT-OPEN-PUBLISHED | the current activity is authorized and open | [] |
| 3 | SUB-ACT-VIEW-RECEIPT | an accepted submission receipt exists | [] |
| 4 | APP-ACT-REFRESH-TODOS | source-pinned activity links require refresh | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| APP-OBJ-TODO.APP-TODO-F-AGGREGATION-VERSION; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-STUDENT-HOME.APP-HOME-F-STUDENT-REF; version=APP-HOME-F-AGGREGATION-VERSION | — |
| APP-OBJ-STUDENT-HOME.APP-HOME-F-SCHOOL-REQUIRED-REFS; version=APP-HOME-F-AGGREGATION-VERSION | — |
| APP-OBJ-STUDENT-HOME.APP-HOME-F-STUDENT-PENDING-REFS; version=APP-HOME-F-AGGREGATION-VERSION | — |
| APP-OBJ-STUDENT-HOME.APP-HOME-F-SYSTEM-PROCESSING-REFS; version=APP-HOME-F-AGGREGATION-VERSION | — |
| APP-OBJ-STUDENT-HOME.APP-HOME-F-PERSONAL-OPTIONAL-REFS; version=APP-HOME-F-AGGREGATION-VERSION | — |
| APP-OBJ-STUDENT-HOME.APP-HOME-F-COMPLETION-FACT-REFS; version=APP-HOME-F-AGGREGATION-VERSION | — |
| APP-OBJ-STUDENT-HOME.APP-HOME-F-AGGREGATION-VERSION; version=APP-HOME-F-AGGREGATION-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["HW-ASSIGNMENT-F-ID","HW-STUDENT-WINDOW-F-ID"],"versionFieldIds":["HW-ASSIGNMENT-F-PUBLICATION-VERSION","HW-STUDENT-WINDOW-F-VERSION"],"fanoutFieldId":"HW-STUDENT-WINDOW-F-STUDENT-REF"} | STUDENT_HOME_PROJECTION_OBJECT | {"strategy":"REFRESH_AUTHORIZED_SOURCE_VERSIONS_THEN_RETRY_HOME_PROJECTION","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT"]} | {"strategy":"KEEP_PRIOR_HOME_PROJECTION_AND_SOURCE_COMPLETION","description":"projection failure preserves the prior home view and never changes source-owned completion or lateness"} | {"strategy":"INVALIDATE_HOME_PROJECTION_ONLY","targets":["student home projection cache"]} |

## DF-013 Student Plan Execution to Report Snapshot and In-product Delivery

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | REPORT_MATERIALIZATION | APP-001 / PLN-001 / RPT-001 / NOTI-001 | "ACTION_CHOICE_REQUIRED" | REPORT_RUN_SNAPSHOT_DELIVERY_AND_NOTIFICATION_OBJECT | {"strategy":"RECHECK_PERMISSION_REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_OUTPUTS","maxAttempts":4,"retryableFailureResults":["SOURCE_VERSION_STALE","DELIVERY_FAILED","VERSION_CONFLICT"]} | {"strategy":"KEEP_SOURCE_EXECUTION_RUN_AND_SNAPSHOT_WHILE_RETRYING_DELIVERY_ONLY","description":"delivery or notification failure never rolls back student execution, plan, successful run, or immutable snapshot"} | {"strategy":"CREATE_A_NEW_RUN_FOR_NEW_SOURCE_VERSIONS","targets":["future report run","future report snapshot","in-product delivery retry"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| RPT-OBJ-DEFINITION.RPT-DEFINITION-F-ID; version=RPT-DEFINITION-F-VERSION; cardinality=ONE; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| RPT-OBJ-DEFINITION.RPT-DEFINITION-F-VERSION; version=RPT-DEFINITION-F-VERSION; cardinality=ONE; role=SOURCE_VERSION | SOURCE_VERSION |
| APP-OBJ-TODO.APP-TODO-F-ID; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ONE; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| APP-OBJ-TODO.APP-TODO-F-STUDENT-REF; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ONE; role=SOURCE_FANOUT | SOURCE_FANOUT |
| APP-OBJ-TODO.APP-TODO-F-LOCAL-PROGRESS; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ONE; role=SOURCE_PAYLOAD | SOURCE_PAYLOAD |
| APP-OBJ-TODO.APP-TODO-F-COMPLETION-EVIDENCE; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ONE; role=SOURCE_PAYLOAD | SOURCE_PAYLOAD |
| APP-OBJ-TODO.APP-TODO-F-DIFFICULTY-FEEDBACK; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ONE; role=SOURCE_PAYLOAD | SOURCE_PAYLOAD |
| APP-OBJ-TODO.APP-TODO-F-AGGREGATION-VERSION; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ONE; role=SOURCE_VERSION | SOURCE_VERSION |
| PLN-OBJ-PLAN.PLN-PLAN-F-ID; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ONE; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| PLN-OBJ-PLAN.PLN-PLAN-F-PLAN-VERSION; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ONE; role=SOURCE_VERSION | SOURCE_VERSION |
| PLN-OBJ-HOMEROOM-COORDINATION.PLN-HOMEROOM-F-ID; version=PLN-HOMEROOM-F-OUTPUT-VERSION; cardinality=ONE; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| PLN-OBJ-HOMEROOM-COORDINATION.PLN-HOMEROOM-F-OUTPUT-VERSION; version=PLN-HOMEROOM-F-OUTPUT-VERSION; cardinality=ONE; role=SOURCE_VERSION | SOURCE_VERSION |
| RPT-OBJ-SUBSCRIPTION.RPT-SUBSCRIPTION-F-ID; version=RPT-SUBSCRIPTION-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| RPT-OBJ-SUBSCRIPTION.RPT-SUBSCRIPTION-F-VERSION; version=RPT-SUBSCRIPTION-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_VERSION | SOURCE_VERSION |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | APP-ACT-VIEW-TODOS | the student execution source is read inside the student's authorized scope | [] |
| 2 | PLN-ACT-VIEW-HOMEROOM-COORDINATION | the plan coordination source remains read-only | [] |
| 3 | RPT-ACT-CREATE-AD-HOC-RUN | an authorized ad-hoc definition is pinned without a subscription | [{"fieldId":"RPT-RUN-F-DEFINITION-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"RPT-RUN-F-DEFINITION-VERSION","provider":{"actorRef":"SYSTEM"}}] |
| 4 | RPT-ACT-CREATE-RUN | an active periodic subscription and its definition are pinned | [{"fieldId":"RPT-RUN-F-DEFINITION-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"RPT-RUN-F-DEFINITION-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"RPT-RUN-F-SUBSCRIPTION-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"RPT-RUN-F-SUBSCRIPTION-VERSION","provider":{"actorRef":"SYSTEM"}}] |
| 5 | RPT-ACT-START-RUN | the queued run passes permission and source-version checks | [] |
| 6 | RPT-ACT-COMPLETE-RUN | the source-pinned report query completes | [] |
| 7 | RPT-ACT-MATERIALIZE-SNAPSHOT | the successful run becomes an immutable snapshot | [] |
| 8 | RPT-ACT-CREATE-DELIVERY | the snapshot receives a separate in-product delivery record | [] |
| 9 | NOTI-ACT-CREATE-REPORT-NOTIFICATION | the product notification contains only an authorized summary and deep link | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |
| AD_HOC | AD_HOC_RUN | 1 → 2 → 3 → 5 → 6 → 7 → 8 → 9 | {"kind":"ACTION_CHOICE","consumerStepOrder":3} | [] | [{"sourceObjectId":"RPT-OBJ-DEFINITION","sourceIdentityFieldId":"RPT-DEFINITION-F-ID","sourceVersionFieldId":"RPT-DEFINITION-F-VERSION","consumerStepOrder":3,"targetRefFieldId":"RPT-RUN-F-DEFINITION-REF","targetVersionFieldId":"RPT-RUN-F-DEFINITION-VERSION","cardinality":"ONE"}] | {"identityFieldIds":["RPT-DEFINITION-F-ID","APP-TODO-F-ID","PLN-PLAN-F-ID"],"versionFieldIds":["RPT-DEFINITION-F-VERSION","APP-TODO-F-AGGREGATION-VERSION","PLN-PLAN-F-PLAN-VERSION","PLN-HOMEROOM-F-OUTPUT-VERSION"],"fanoutFieldId":"APP-TODO-F-STUDENT-REF"} |
| PERIODIC | PERIODIC_RUN | 1 → 2 → 4 → 5 → 6 → 7 → 8 → 9 | {"kind":"ACTION_CHOICE","consumerStepOrder":4} | [] | [{"sourceObjectId":"RPT-OBJ-DEFINITION","sourceIdentityFieldId":"RPT-DEFINITION-F-ID","sourceVersionFieldId":"RPT-DEFINITION-F-VERSION","consumerStepOrder":4,"targetRefFieldId":"RPT-RUN-F-DEFINITION-REF","targetVersionFieldId":"RPT-RUN-F-DEFINITION-VERSION","cardinality":"ONE"},{"sourceObjectId":"RPT-OBJ-SUBSCRIPTION","sourceIdentityFieldId":"RPT-SUBSCRIPTION-F-ID","sourceVersionFieldId":"RPT-SUBSCRIPTION-F-VERSION","consumerStepOrder":4,"targetRefFieldId":"RPT-RUN-F-SUBSCRIPTION-REF","targetVersionFieldId":"RPT-RUN-F-SUBSCRIPTION-VERSION","cardinality":"ONE"}] | {"identityFieldIds":["RPT-DEFINITION-F-ID","RPT-SUBSCRIPTION-F-ID","APP-TODO-F-ID","PLN-PLAN-F-ID"],"versionFieldIds":["RPT-DEFINITION-F-VERSION","RPT-SUBSCRIPTION-F-VERSION","APP-TODO-F-AGGREGATION-VERSION","PLN-PLAN-F-PLAN-VERSION","PLN-HOMEROOM-F-OUTPUT-VERSION"],"fanoutFieldId":"APP-TODO-F-STUDENT-REF"} |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| RPT-OBJ-RUN.RPT-RUN-F-ID; version=RPT-RUN-F-VERSION; role=TARGET_IDENTITY | TARGET_IDENTITY |
| RPT-OBJ-RUN.RPT-RUN-F-PERMISSION-RESULT; version=RPT-RUN-F-VERSION; role=TARGET_PAYLOAD | TARGET_PAYLOAD |
| RPT-OBJ-RUN.RPT-RUN-F-DATA-CUTOFF; version=RPT-RUN-F-VERSION; role=TARGET_PAYLOAD | TARGET_PAYLOAD |
| RPT-OBJ-RUN.RPT-RUN-F-SOURCE-VERSIONS; version=RPT-RUN-F-VERSION; role=TARGET_PAYLOAD | TARGET_PAYLOAD |
| RPT-OBJ-RUN.RPT-RUN-F-RESULT; version=RPT-RUN-F-VERSION; role=TARGET_PAYLOAD | TARGET_PAYLOAD |
| RPT-OBJ-RUN.RPT-RUN-F-VERSION; version=RPT-RUN-F-VERSION; role=TARGET_VERSION | TARGET_VERSION |
| RPT-OBJ-SNAPSHOT.RPT-SNAPSHOT-F-ID; version=RPT-SNAPSHOT-F-VERSION; role=TARGET_IDENTITY | TARGET_IDENTITY |
| RPT-OBJ-SNAPSHOT.RPT-SNAPSHOT-F-RUN-REF; version=RPT-SNAPSHOT-F-VERSION; role=TARGET_LINEAGE | TARGET_LINEAGE |
| RPT-OBJ-SNAPSHOT.RPT-SNAPSHOT-F-RUN-VERSION; version=RPT-SNAPSHOT-F-VERSION; role=TARGET_LINEAGE | TARGET_LINEAGE |
| RPT-OBJ-SNAPSHOT.RPT-SNAPSHOT-F-SOURCE-VERSIONS; version=RPT-SNAPSHOT-F-VERSION; role=TARGET_PAYLOAD | TARGET_PAYLOAD |
| RPT-OBJ-SNAPSHOT.RPT-SNAPSHOT-F-VERSION; version=RPT-SNAPSHOT-F-VERSION; role=TARGET_VERSION | TARGET_VERSION |
| RPT-OBJ-DELIVERY.RPT-DELIVERY-F-ID; version=RPT-DELIVERY-F-VERSION; role=TARGET_IDENTITY | TARGET_IDENTITY |
| RPT-OBJ-DELIVERY.RPT-DELIVERY-F-STATE; version=RPT-DELIVERY-F-VERSION; role=TARGET_STATE | TARGET_STATE |
| RPT-OBJ-DELIVERY.RPT-DELIVERY-F-VERSION; version=RPT-DELIVERY-F-VERSION; role=TARGET_VERSION | TARGET_VERSION |
| NOTI-OBJ-NOTIFICATION.NOTI-NOTIFICATION-F-ID; version=NOTI-NOTIFICATION-F-VERSION; role=TARGET_IDENTITY | TARGET_IDENTITY |
| NOTI-OBJ-NOTIFICATION.NOTI-NOTIFICATION-F-DEEP-LINK; version=NOTI-NOTIFICATION-F-VERSION; role=TARGET_PAYLOAD | TARGET_PAYLOAD |
| NOTI-OBJ-NOTIFICATION.NOTI-NOTIFICATION-F-VERSION; version=NOTI-NOTIFICATION-F-VERSION; role=TARGET_VERSION | TARGET_VERSION |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["RPT-DEFINITION-F-ID","APP-TODO-F-ID","PLN-PLAN-F-ID"],"versionFieldIds":["RPT-DEFINITION-F-VERSION","APP-TODO-F-AGGREGATION-VERSION","PLN-PLAN-F-PLAN-VERSION","PLN-HOMEROOM-F-OUTPUT-VERSION"],"fanoutFieldId":"APP-TODO-F-STUDENT-REF"} | REPORT_RUN_SNAPSHOT_DELIVERY_AND_NOTIFICATION_OBJECT | {"strategy":"RECHECK_PERMISSION_REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_OUTPUTS","maxAttempts":4,"retryableFailureResults":["SOURCE_VERSION_STALE","DELIVERY_FAILED","VERSION_CONFLICT"]} | {"strategy":"KEEP_SOURCE_EXECUTION_RUN_AND_SNAPSHOT_WHILE_RETRYING_DELIVERY_ONLY","description":"delivery or notification failure never rolls back student execution, plan, successful run, or immutable snapshot"} | {"strategy":"CREATE_A_NEW_RUN_FOR_NEW_SOURCE_VERSIONS","targets":["future report run","future report snapshot","in-product delivery retry"]} |

## DF-018 Restricted Service Plan to Irreversibly Restricted Phase-two Entitlement

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | GENERIC | PLAT-001 / PLAT-002 | "NONE" | ONE_SERVICE_PLAN_RESTRICTION_VERSION_AND_ITS_EXACT_ACTIVE_PHASE_TWO_ENTITLEMENT | {"strategy":"REDELIVER_THE_COMMITTED_RESTRICTION_EVENT_AND_REVALIDATE_THE_EXACT_SOURCE_VERSION","maxAttempts":8,"retryableFailureResults":["VERSION_CONFLICT"]} | {"strategy":"NEVER_REACTIVATE_THE_RESTRICTED_SERVICE_PLAN_OR_ENTITLEMENT","description":"an outbox failure leaves the plan ACTIVE and uncommitted; a downstream failure keeps the plan RESTRICTED, blocks new or non-protected consumers through synchronous source-plan revalidation, preserves only exact finite D091 published-activity completion, and retries entitlement restriction idempotently"} | {"strategy":"BLOCK_NEW_OR_NON_PROTECTED_PHASE_TWO_CONSUMPTION_AFTER_THE_FINITE_D091_BRANCH_CLOSES","targets":["AI assessment processing outside an exact protected published-activity entry and finite window","student progress target creation","student minimum video entitlement creation","school video overflow pool creation"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| PLAT-OBJ-SERVICE-PLAN.PLAT-PLAN-F-ID; version=PLAT-PLAN-F-VERSION; cardinality=ONE | — |
| PLAT-OBJ-SERVICE-PLAN.PLAT-PLAN-F-SCHOOL-REF; version=PLAT-PLAN-F-VERSION; cardinality=ONE | — |
| PLAT-OBJ-SERVICE-PLAN.PLAT-PLAN-F-SERVICE-STATE; version=PLAT-PLAN-F-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | PLAT-ACT-RESTRICT-SERVICE-PLAN | the D091 protected-activity window has ended, the exit window is open, and the exact ACTIVE service-plan version can commit its restriction event outbox atomically | [{"fieldId":"PLAT-PLAN-F-CONTINUITY-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"PLAT-PLAN-F-CONTINUITY-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"PLAT-PLAN-F-RESTRICTION-REASON","provider":{"actorRef":"SYSTEM"}}] |
| 2 | PLAT-ACT-RESTRICT-PHASE-TWO-ENTITLEMENT | the committed event resolves at most one ACTIVE same-school entitlement pinned to the service plan's exact pre-restriction version | [{"fieldId":"PLAT-P2ENT-F-SERVICE-PLAN-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"PLAT-P2ENT-F-SERVICE-PLAN-VERSION","provider":{"actorRef":"SYSTEM"}}] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT.PLAT-P2ENT-F-STATUS; version=PLAT-P2ENT-F-VERSION | — |
| PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT.PLAT-P2ENT-F-VERSION; version=PLAT-P2ENT-F-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["PLAT-PLAN-F-ID"],"versionFieldIds":["PLAT-PLAN-F-VERSION"],"fanoutFieldId":"PLAT-PLAN-F-SCHOOL-REF"} | ONE_SERVICE_PLAN_RESTRICTION_VERSION_AND_ITS_EXACT_ACTIVE_PHASE_TWO_ENTITLEMENT | {"strategy":"REDELIVER_THE_COMMITTED_RESTRICTION_EVENT_AND_REVALIDATE_THE_EXACT_SOURCE_VERSION","maxAttempts":8,"retryableFailureResults":["VERSION_CONFLICT"]} | {"strategy":"NEVER_REACTIVATE_THE_RESTRICTED_SERVICE_PLAN_OR_ENTITLEMENT","description":"an outbox failure leaves the plan ACTIVE and uncommitted; a downstream failure keeps the plan RESTRICTED, blocks new or non-protected consumers through synchronous source-plan revalidation, preserves only exact finite D091 published-activity completion, and retries entitlement restriction idempotently"} | {"strategy":"BLOCK_NEW_OR_NON_PROTECTED_PHASE_TWO_CONSUMPTION_AFTER_THE_FINITE_D091_BRANCH_CLOSES","targets":["AI assessment processing outside an exact protected published-activity entry and finite window","student progress target creation","student minimum video entitlement creation","school video overflow pool creation"]} |

## DF-P2-001 Minimum Progress Completion Evidence to Student Next Target Choice

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | GENERIC | PROG-001 | "NONE" | STUDENT_CURRENT_TARGET_AND_PROPOSAL_VERSION | {"strategy":"REFRESH_CURRENT_TARGET_EVIDENCE_AND_RETRY_PROPOSAL_ONLY","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT"]} | {"strategy":"PRESERVE_CURRENT_TARGET_AND_STUDENT_CHOICE","description":"failure never changes class progress, publishes an activity, or invents a student choice"} | {"strategy":"EXPIRE_ONLY_UNSELECTED_STALE_PROPOSALS","targets":["student next-target proposal","progress-driven video request eligibility"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| PROG-OBJ-STUDENT-TARGET.PROG-TARGET-F-ID; version=PROG-TARGET-F-VERSION; cardinality=ONE | — |
| PROG-OBJ-STUDENT-TARGET.PROG-TARGET-F-STUDENT-REF; version=PROG-TARGET-F-VERSION; cardinality=ONE | — |
| PROG-OBJ-STUDENT-TARGET.PROG-TARGET-F-COMPLETION-EVIDENCE-REF; version=PROG-TARGET-F-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | PROG-ACT-VIEW-CURRENT-TARGET | — | [{"fieldId":"PROG-TARGET-F-STUDENT-REF","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 2 | PROG-ACT-PROPOSE-NEXT-TARGET | the current target is COMPLETED with accepted current-version completion evidence | [{"fieldId":"PROG-CHOICE-F-STUDENT-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"PROG-CHOICE-F-CURRENT-TARGET-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"PROG-CHOICE-F-CURRENT-TARGET-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"PROG-CHOICE-F-COMPLETION-EVIDENCE-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"PROG-CHOICE-F-COMPLETION-EVIDENCE-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"PROG-CHOICE-F-NEXT-SNAPSHOT-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"PROG-CHOICE-F-NEXT-SNAPSHOT-VERSION","provider":{"actorRef":"SYSTEM"}}] |
| 3 | PROG-ACT-SELECT-NEXT-TARGET | the student explicitly chooses to continue | [{"fieldId":"PROG-CHOICE-F-STUDENT-CHOICE","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 4 | PROG-ACT-DEFER-NEXT-TARGET | the student explicitly chooses not now | [{"fieldId":"PROG-CHOICE-F-STUDENT-CHOICE","provider":{"roleRef":"ROLE-STUDENT"}}] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| PROG-OBJ-NEXT-TARGET-CHOICE.PROG-CHOICE-F-ID; version=PROG-CHOICE-F-VERSION | — |
| PROG-OBJ-NEXT-TARGET-CHOICE.PROG-CHOICE-F-STATUS; version=PROG-CHOICE-F-VERSION | — |
| PROG-OBJ-NEXT-TARGET-CHOICE.PROG-CHOICE-F-VERSION; version=PROG-CHOICE-F-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["PROG-TARGET-F-ID"],"versionFieldIds":["PROG-TARGET-F-VERSION"],"fanoutFieldId":"PROG-TARGET-F-STUDENT-REF"} | STUDENT_CURRENT_TARGET_AND_PROPOSAL_VERSION | {"strategy":"REFRESH_CURRENT_TARGET_EVIDENCE_AND_RETRY_PROPOSAL_ONLY","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT"]} | {"strategy":"PRESERVE_CURRENT_TARGET_AND_STUDENT_CHOICE","description":"failure never changes class progress, publishes an activity, or invents a student choice"} | {"strategy":"EXPIRE_ONLY_UNSELECTED_STALE_PROPOSALS","targets":["student next-target proposal","progress-driven video request eligibility"]} |

## DF-P2-002 Accepted Video Request through Full Gates to Usable Delivery and Settlement

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | GENERIC | VIDEO-001 | "NONE" | VIDEO_REQUEST_ASSET_GATE_AND_QUOTA_LEDGER_VERSION | {"strategy":"RELEASE_FAILED_RESERVATION_THEN_RETRY_FROM_PINNED_REQUEST","maxAttempts":3,"retryableFailureResults":["PLATFORM_FAILURE","GATE_CHECK_UNAVAILABLE","VERSION_CONFLICT"]} | {"strategy":"NO_DELIVERY_OR_SETTLEMENT_UNTIL_ALL_GATES_PASS","description":"a failed generation preserves source facts, releases unsettled quota, and exposes a safe low-bandwidth alternative"} | {"strategy":"REAUTHORIZE_AND_STOP_PLAYBACK_WHEN_SOURCE_OR_RIGHTS_CHANGE","targets":["controlled playback authorization","student notification","quota settlement eligibility"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| VIDEO-OBJ-REQUEST.VIDEO-REQUEST-F-ID; version=VIDEO-REQUEST-F-VERSION; cardinality=ONE | — |
| VIDEO-OBJ-REQUEST.VIDEO-REQUEST-F-STUDENT-REF; version=VIDEO-REQUEST-F-VERSION; cardinality=ONE | — |
| VIDEO-OBJ-REQUEST.VIDEO-REQUEST-F-SOURCE-BINDING-DIGEST; version=VIDEO-REQUEST-F-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | VIDEO-ACT-RESERVE-STUDENT-MINIMUM | student minimum units are available | [{"fieldId":"VIDEO-LEDGER-F-STUDENT-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-LEDGER-F-REQUEST-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-LEDGER-F-REQUEST-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-LEDGER-F-ENTITLEMENT-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-LEDGER-F-SOURCE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-LEDGER-F-PRIORITY","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-LEDGER-F-RESERVED-UNITS","provider":{"actorRef":"SYSTEM"}}] |
| 2 | VIDEO-ACT-RESERVE-SCHOOL-OVERFLOW | the protected minimum path cannot serve the accepted request and school overflow is available | [{"fieldId":"VIDEO-LEDGER-F-STUDENT-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-LEDGER-F-REQUEST-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-LEDGER-F-REQUEST-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-LEDGER-F-OVERFLOW-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-LEDGER-F-SOURCE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-LEDGER-F-PRIORITY","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-LEDGER-F-RESERVED-UNITS","provider":{"actorRef":"SYSTEM"}}] |
| 3 | VIDEO-ACT-START-GENERATION | — | [{"fieldId":"VIDEO-ASSET-F-STUDENT-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-REQUEST-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-REQUEST-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-REQUESTER-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-REQUESTER-KIND","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-SERVICE-AUDIENCE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-SERVICE-OBJECT-REFS","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-MANAGEMENT-SCOPE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-SOURCE-MATERIALS","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-ACCESS-SCOPE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-ACCESS-DOMAIN","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-MANAGER-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-PROMOTION-POLICY","provider":{"actorRef":"SYSTEM"}}] |
| 4 | VIDEO-ACT-CHECK-SCRIPT | — | [] |
| 5 | VIDEO-ACT-CHECK-RENDER | — | [] |
| 6 | VIDEO-ACT-CHECK-SAFETY | — | [] |
| 7 | VIDEO-ACT-CHECK-PRIVACY | — | [] |
| 8 | VIDEO-ACT-CHECK-RIGHTS | — | [] |
| 9 | VIDEO-ACT-CHECK-PEDAGOGY | — | [] |
| 10 | VIDEO-ACT-CHECK-PLAYABILITY | — | [] |
| 11 | VIDEO-ACT-DELIVER-USABLE | all seven gates are PASSED and every source is still valid | [] |
| 12 | VIDEO-ACT-SETTLE-USABLE-DELIVERY | the student received a usable DELIVERED asset | [] |
| 13 | VIDEO-ACT-VIEW-CONTROLLED | each playback request passes fresh authorization | [{"fieldId":"VIDEO-ASSET-F-STUDENT-REF","provider":{"roleRef":"ROLE-STUDENT"}}] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-ID; version=VIDEO-ASSET-F-VERSION | — |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-DELIVERY-STATUS; version=VIDEO-ASSET-F-VERSION | — |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-VERSION; version=VIDEO-ASSET-F-VERSION | — |
| VIDEO-OBJ-QUOTA-LEDGER.VIDEO-LEDGER-F-ID; version=VIDEO-LEDGER-F-VERSION | — |
| VIDEO-OBJ-QUOTA-LEDGER.VIDEO-LEDGER-F-STATUS; version=VIDEO-LEDGER-F-VERSION | — |
| VIDEO-OBJ-QUOTA-LEDGER.VIDEO-LEDGER-F-VERSION; version=VIDEO-LEDGER-F-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["VIDEO-REQUEST-F-ID"],"versionFieldIds":["VIDEO-REQUEST-F-VERSION"],"fanoutFieldId":"VIDEO-REQUEST-F-STUDENT-REF"} | VIDEO_REQUEST_ASSET_GATE_AND_QUOTA_LEDGER_VERSION | {"strategy":"RELEASE_FAILED_RESERVATION_THEN_RETRY_FROM_PINNED_REQUEST","maxAttempts":3,"retryableFailureResults":["PLATFORM_FAILURE","GATE_CHECK_UNAVAILABLE","VERSION_CONFLICT"]} | {"strategy":"NO_DELIVERY_OR_SETTLEMENT_UNTIL_ALL_GATES_PASS","description":"a failed generation preserves source facts, releases unsettled quota, and exposes a safe low-bandwidth alternative"} | {"strategy":"REAUTHORIZE_AND_STOP_PLAYBACK_WHEN_SOURCE_OR_RIGHTS_CHANGE","targets":["controlled playback authorization","student notification","quota settlement eligibility"]} |

## DF-P2-003 Video Gate Block or Versioned Source Invalidation to Recall and Quota Release

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | EVENT_INVALIDATION_FANOUT | ACC-001 / DGV-001 / CONTENT-001 / VIDEO-001 | "ACTION_CHOICE_REQUIRED" | ONE_SOURCE_EVENT_VERSION_ONE_IMMUTABLE_AFFECTED_ASSET_SET_AND_ONE_RESERVATION_VERSION | {"strategy":"REDELIVER_SAME_SOURCE_EVENT_AND_RESUME_ONLY_UNFINISHED_ASSET_RECALLS_OR_RELEASES","maxAttempts":8,"retryableFailureResults":["RECALL_SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_CURRENT_SOURCE_FAIL_CLOSED_AND_NEVER_REOPEN_RECALLED_PLAYBACK","description":"a failed fanout keeps current-source delivery and playback checks closed, preserves the immutable impact snapshot, and retries only unfinished recalls or releases"} | {"strategy":"STOP_PLAYBACK_INVALIDATE_LINKS_AND_REAUTHORIZE_EVERY_DERIVED_DELIVERY_SURFACE","targets":["controlled playback session","video deep link","cached media authorization","delivery notification","AI conversation and report references"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| ACC-OBJ-PLATFORM-IDENTITY.ACC-PIDENT-F-ID; version=ACC-PIDENT-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| ACC-OBJ-PLATFORM-IDENTITY.ACC-PIDENT-F-VERSION; version=ACC-PIDENT-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_VERSION | SOURCE_VERSION |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-ID; version=DGV-TRANSFER-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-VERSION; version=DGV-TRANSFER-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_VERSION | SOURCE_VERSION |
| ACC-OBJ-MEMBERSHIP.ACC-MEMBER-F-ID; version=ACC-MEMBER-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| ACC-OBJ-MEMBERSHIP.ACC-MEMBER-F-VERSION; version=ACC-MEMBER-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_VERSION | SOURCE_VERSION |
| CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE.CONTENT-RIGHTS-F-ID; version=CONTENT-RIGHTS-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE.CONTENT-RIGHTS-F-VERSION; version=CONTENT-RIGHTS-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_VERSION | SOURCE_VERSION |
| CONTENT-OBJ-MATERIAL-SOURCE-GRAPH.CONTENT-SOURCE-F-ID; version=CONTENT-SOURCE-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| CONTENT-OBJ-MATERIAL-SOURCE-GRAPH.CONTENT-SOURCE-F-VERSION; version=CONTENT-SOURCE-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_VERSION | SOURCE_VERSION |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-ID; version=VIDEO-ASSET-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-VERSION; version=VIDEO-ASSET-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_VERSION | SOURCE_VERSION |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-SERVICE-OBJECT-REFS; version=VIDEO-ASSET-F-VERSION; cardinality=ZERO_MANY; role=SOURCE_PAYLOAD | SOURCE_PAYLOAD |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | VIDEO-ACT-LOCATE-RECALL-IMPACT | one registered versioned source event is delivered and resolves exactly one source binding | [{"fieldId":"VIDEO-RECALL-F-TRIGGER-KIND","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-RECALL-F-SOURCE-EVENT-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-RECALL-F-SOURCE-EVENT-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-RECALL-F-SOURCE-MODULE-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-RECALL-F-SOURCE-OBJECT-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-RECALL-F-SOURCE-OBJECT-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-RECALL-F-SOURCE-OBJECT-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-RECALL-F-AFFECTED-ASSET-REFS","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-RECALL-F-AFFECTED-ASSET-DIGEST","provider":{"actorRef":"SYSTEM"}}] |
| 2 | VIDEO-ACT-BLOCK-DELIVERY | a mandatory gate or platform step failed before usable delivery | [] |
| 3 | VIDEO-ACT-RECALL | the asset belongs to the immutable affected set captured for the exact source event version | [{"fieldId":"VIDEO-ASSET-F-RECALL-REASON","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-RECALL-IMPACT-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-RECALL-IMPACT-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-RECALL-TRIGGER-KIND","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-RECALL-SOURCE-EVENT-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-RECALL-SOURCE-EVENT-VERSION","provider":{"actorRef":"SYSTEM"}}] |
| 4 | VIDEO-ACT-RELEASE-QUOTA | the personal reservation produced no currently usable result | [{"fieldId":"VIDEO-LEDGER-F-RELEASE-REASON","provider":{"actorRef":"SYSTEM"}}] |
| 5 | VIDEO-ACT-RELEASE-SCHOOL-GROUP-QUOTA | the school-private reservation produced no currently usable result | [{"fieldId":"VIDEO-SCHOOL-LEDGER-F-RELEASE-REASON","provider":{"actorRef":"SYSTEM"}}] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |
| GATE_BLOCK_RELEASE | GATE_BLOCK_RELEASE | 2 → 4 → 5 | {"kind":"ACTION_CHOICE","consumerStepOrder":2} | [] | [] | {} |
| SOURCE_INVALIDATION_RECALL_RELEASE | SOURCE_INVALIDATION_RECALL_RELEASE | 1 → 3 → 4 → 5 | {"kind":"ACTION_CHOICE","consumerStepOrder":1} | [] | [] | {} |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT.VIDEO-RECALL-F-ID; version=VIDEO-RECALL-F-VERSION; role=TARGET_IDENTITY | TARGET_IDENTITY |
| VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT.VIDEO-RECALL-F-AFFECTED-ASSET-REFS; version=VIDEO-RECALL-F-VERSION; role=TARGET_PAYLOAD | TARGET_PAYLOAD |
| VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT.VIDEO-RECALL-F-VERSION; version=VIDEO-RECALL-F-VERSION; role=TARGET_VERSION | TARGET_VERSION |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-DELIVERY-STATUS; version=VIDEO-ASSET-F-VERSION; role=TARGET_STATE | TARGET_STATE |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-VERSION; version=VIDEO-ASSET-F-VERSION; role=TARGET_VERSION | TARGET_VERSION |
| VIDEO-OBJ-QUOTA-LEDGER.VIDEO-LEDGER-F-RELEASE-REASON; version=VIDEO-LEDGER-F-VERSION; role=TARGET_PAYLOAD | TARGET_PAYLOAD |
| VIDEO-OBJ-QUOTA-LEDGER.VIDEO-LEDGER-F-VERSION; version=VIDEO-LEDGER-F-VERSION; role=TARGET_VERSION | TARGET_VERSION |
| VIDEO-OBJ-SCHOOL-QUOTA-LEDGER.VIDEO-SCHOOL-LEDGER-F-RELEASE-REASON; version=VIDEO-SCHOOL-LEDGER-F-VERSION; role=TARGET_PAYLOAD | TARGET_PAYLOAD |
| VIDEO-OBJ-SCHOOL-QUOTA-LEDGER.VIDEO-SCHOOL-LEDGER-F-VERSION; version=VIDEO-SCHOOL-LEDGER-F-VERSION; role=TARGET_VERSION | TARGET_VERSION |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["VIDEO-RECALL-F-ID"],"versionFieldIds":["VIDEO-RECALL-F-VERSION"],"fanoutFieldId":"VIDEO-RECALL-F-AFFECTED-ASSET-REFS"} | ONE_SOURCE_EVENT_VERSION_ONE_IMMUTABLE_AFFECTED_ASSET_SET_AND_ONE_RESERVATION_VERSION | {"strategy":"REDELIVER_SAME_SOURCE_EVENT_AND_RESUME_ONLY_UNFINISHED_ASSET_RECALLS_OR_RELEASES","maxAttempts":8,"retryableFailureResults":["RECALL_SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_CURRENT_SOURCE_FAIL_CLOSED_AND_NEVER_REOPEN_RECALLED_PLAYBACK","description":"a failed fanout keeps current-source delivery and playback checks closed, preserves the immutable impact snapshot, and retries only unfinished recalls or releases"} | {"strategy":"STOP_PLAYBACK_INVALIDATE_LINKS_AND_REAUTHORIZE_EVERY_DERIVED_DELIVERY_SURFACE","targets":["controlled playback session","video deep link","cached media authorization","delivery notification","AI conversation and report references"]} |

## DF-P2-004 Delivered Video through One-node New-context Verification to a New Learning Fact

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | GENERIC | VIDEO-001 | "NONE" | STUDENT_VIDEO_TARGET_CONTEXT_AND_VERIFICATION_VERSION | {"strategy":"PRESERVE_EACH_EXPRESSION_AND_RETRY_ONLY_IN_A_DIFFERENT_CONTEXT","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","CONTEXT_NOT_DIFFERENT","VERSION_CONFLICT"]} | {"strategy":"NO_LEARNING_FACT_WITHOUT_COMPLETED_NEW_CONTEXT_EVIDENCE","description":"viewing, watch completion, an unknown response, or speech presentation quality never creates mastery; an unknown response returns to teaching before a different-context retry"} | {"strategy":"PRESERVE_RAW_RESPONSE_AND_INVALIDATE_ONLY_FUTURE_INTERPRETATION","targets":["future mastery interpretation","next-target eligibility","personalized recommendation"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-ID; version=VIDEO-ASSET-F-VERSION; cardinality=ONE | — |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-SERVICE-OBJECT-REFS; version=VIDEO-ASSET-F-VERSION; cardinality=ONE | — |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-DELIVERY-STATUS; version=VIDEO-ASSET-F-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | VIDEO-ACT-START-NEW-CONTEXT-VERIFICATION | the student starts a target-appropriate new context after authorized delivery | [{"fieldId":"VIDEO-VERIFY-F-STUDENT-REF","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"VIDEO-VERIFY-F-ASSET-REF","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"VIDEO-VERIFY-F-TARGET-REF","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"VIDEO-VERIFY-F-TARGET-KIND","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"VIDEO-VERIFY-F-STRATEGY","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"VIDEO-VERIFY-F-MODALITY","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"VIDEO-VERIFY-F-ABILITY-NODE-REFS","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 2 | VIDEO-ACT-SUBMIT-FIRST-INDEPENDENT-EXPRESSION | no answer-style hint was exposed before the first expression | [{"fieldId":"VIDEO-VERIFY-F-FIRST-EXPRESSION","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 3 | VIDEO-ACT-PURSUE-ONE-SPECIFIC-GAP | one concrete content gap needs a follow-up | [] |
| 4 | VIDEO-ACT-RETURN-UNKNOWN-TO-TEACHING | the student explicitly states that the student does not know | [{"fieldId":"VIDEO-VERIFY-F-UNKNOWN-DECLARATION","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 5 | VIDEO-ACT-RETRY-DIFFERENT-CONTEXT | targeted gap teaching completed and a materially different context is ready | [{"fieldId":"VIDEO-VERIFY-F-RETRY-REQUEST","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 6 | VIDEO-ACT-SUBMIT-DIFFERENT-CONTEXT-EXPRESSION | the retry path requires another independent expression | [{"fieldId":"VIDEO-VERIFY-F-DIFFERENT-CONTEXT-EXPRESSION","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 7 | VIDEO-ACT-COMPLETE-NEW-CONTEXT-VERIFICATION | — | [] |
| 8 | VIDEO-ACT-RECORD-POST-VIDEO-LEARNING-FACT | a completed verification has response evidence and a contextual result | [{"fieldId":"VIDEO-FACT-F-STUDENT-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-FACT-F-ASSET-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-FACT-F-ASSET-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-FACT-F-VERIFICATION-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-FACT-F-VERIFICATION-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-FACT-F-TARGET-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-FACT-F-TARGET-SOURCE-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-FACT-F-NEW-CONTEXT-DIGEST","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-FACT-F-STRATEGY","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-FACT-F-MODALITY","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-FACT-F-RESULT","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-FACT-F-EVIDENCE","provider":{"actorRef":"SYSTEM"}}] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| VIDEO-OBJ-VERIFICATION.VIDEO-VERIFY-F-ID; version=VIDEO-VERIFY-F-VERSION | — |
| VIDEO-OBJ-VERIFICATION.VIDEO-VERIFY-F-STATUS; version=VIDEO-VERIFY-F-VERSION | — |
| VIDEO-OBJ-VERIFICATION.VIDEO-VERIFY-F-VERSION; version=VIDEO-VERIFY-F-VERSION | — |
| VIDEO-OBJ-LEARNING-FACT.VIDEO-FACT-F-ID; version=VIDEO-FACT-F-VERSION | — |
| VIDEO-OBJ-LEARNING-FACT.VIDEO-FACT-F-STATUS; version=VIDEO-FACT-F-VERSION | — |
| VIDEO-OBJ-LEARNING-FACT.VIDEO-FACT-F-VERSION; version=VIDEO-FACT-F-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["VIDEO-ASSET-F-ID"],"versionFieldIds":["VIDEO-ASSET-F-VERSION"],"fanoutFieldId":"VIDEO-ASSET-F-SERVICE-OBJECT-REFS"} | STUDENT_VIDEO_TARGET_CONTEXT_AND_VERIFICATION_VERSION | {"strategy":"PRESERVE_EACH_EXPRESSION_AND_RETRY_ONLY_IN_A_DIFFERENT_CONTEXT","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","CONTEXT_NOT_DIFFERENT","VERSION_CONFLICT"]} | {"strategy":"NO_LEARNING_FACT_WITHOUT_COMPLETED_NEW_CONTEXT_EVIDENCE","description":"viewing, watch completion, an unknown response, or speech presentation quality never creates mastery; an unknown response returns to teaching before a different-context retry"} | {"strategy":"PRESERVE_RAW_RESPONSE_AND_INVALIDATE_ONLY_FUTURE_INTERPRETATION","targets":["future mastery interpretation","next-target eligibility","personalized recommendation"]} |

## DF-P2-005 Teacher School-private Group Request through Full Gates to Scoped Delivery

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | GENERIC | VIDEO-001 | "NONE" | SCHOOL_REQUEST_SERVICE_SCOPE_ASSET_GATE_AND_LEDGER_VERSION | {"strategy":"RELEASE_SCHOOL_RESERVATION_AND_RETRY_FROM_PINNED_PRIVATE_REQUEST","maxAttempts":3,"retryableFailureResults":["PLATFORM_FAILURE","GATE_CHECK_UNAVAILABLE","VERSION_CONFLICT"]} | {"strategy":"NO_DELIVERY_SETTLEMENT_PROMOTION_OR_CROSS_SCHOOL_MIGRATION_ON_FAILURE","description":"the school keeps management metadata, students keep protected minimum quota, and no partial or unauthorized group content is exposed"} | {"strategy":"REAUTHORIZE_SERVICE_SCOPE_AND_RECALL_WHEN_SCHOOL_SOURCE_OR_RIGHTS_CHANGE","targets":["school-private playback","class or group delivery","school quota settlement","knowledge-layer sharing eligibility"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| VIDEO-OBJ-SCHOOL-REQUEST.VIDEO-SCHOOL-REQUEST-F-ID; version=VIDEO-SCHOOL-REQUEST-F-VERSION; cardinality=ONE | — |
| VIDEO-OBJ-SCHOOL-REQUEST.VIDEO-SCHOOL-REQUEST-F-SERVICE-OBJECT-REFS; version=VIDEO-SCHOOL-REQUEST-F-VERSION; cardinality=ONE | — |
| VIDEO-OBJ-SCHOOL-REQUEST.VIDEO-SCHOOL-REQUEST-F-SOURCE-BINDING-DIGEST; version=VIDEO-SCHOOL-REQUEST-F-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | VIDEO-ACT-RESERVE-SCHOOL-GROUP-OVERFLOW | — | [{"fieldId":"VIDEO-SCHOOL-LEDGER-F-REQUEST-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-SCHOOL-LEDGER-F-REQUEST-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-SCHOOL-LEDGER-F-OVERFLOW-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-SCHOOL-LEDGER-F-SERVICE-OBJECT-REFS","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-SCHOOL-LEDGER-F-PRIORITY","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-SCHOOL-LEDGER-F-RESERVED-UNITS","provider":{"actorRef":"SYSTEM"}}] |
| 2 | VIDEO-ACT-START-SCHOOL-GROUP-GENERATION | — | [{"fieldId":"VIDEO-ASSET-F-SCHOOL-REQUEST-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-SCHOOL-REQUEST-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-REQUESTER-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-REQUESTER-KIND","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-SERVICE-AUDIENCE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-SERVICE-OBJECT-REFS","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-MANAGEMENT-SCOPE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-SOURCE-MATERIALS","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-ACCESS-SCOPE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-ACCESS-DOMAIN","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-MANAGER-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"VIDEO-ASSET-F-PROMOTION-POLICY","provider":{"actorRef":"SYSTEM"}}] |
| 3 | VIDEO-ACT-CHECK-SCRIPT | — | [] |
| 4 | VIDEO-ACT-CHECK-RENDER | — | [] |
| 5 | VIDEO-ACT-CHECK-SAFETY | — | [] |
| 6 | VIDEO-ACT-CHECK-PRIVACY | — | [] |
| 7 | VIDEO-ACT-CHECK-RIGHTS | — | [] |
| 8 | VIDEO-ACT-CHECK-PEDAGOGY | — | [] |
| 9 | VIDEO-ACT-CHECK-PLAYABILITY | — | [] |
| 10 | VIDEO-ACT-DELIVER-USABLE | — | [] |
| 11 | VIDEO-ACT-SETTLE-SCHOOL-GROUP-DELIVERY | — | [] |
| 12 | VIDEO-ACT-VIEW-SCHOOL-PRIVATE | — | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-ID; version=VIDEO-ASSET-F-VERSION | — |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-DELIVERY-STATUS; version=VIDEO-ASSET-F-VERSION | — |
| VIDEO-OBJ-ASSET.VIDEO-ASSET-F-VERSION; version=VIDEO-ASSET-F-VERSION | — |
| VIDEO-OBJ-SCHOOL-QUOTA-LEDGER.VIDEO-SCHOOL-LEDGER-F-ID; version=VIDEO-SCHOOL-LEDGER-F-VERSION | — |
| VIDEO-OBJ-SCHOOL-QUOTA-LEDGER.VIDEO-SCHOOL-LEDGER-F-STATUS; version=VIDEO-SCHOOL-LEDGER-F-VERSION | — |
| VIDEO-OBJ-SCHOOL-QUOTA-LEDGER.VIDEO-SCHOOL-LEDGER-F-VERSION; version=VIDEO-SCHOOL-LEDGER-F-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["VIDEO-SCHOOL-REQUEST-F-ID"],"versionFieldIds":["VIDEO-SCHOOL-REQUEST-F-VERSION"],"fanoutFieldId":"VIDEO-SCHOOL-REQUEST-F-SERVICE-OBJECT-REFS"} | SCHOOL_REQUEST_SERVICE_SCOPE_ASSET_GATE_AND_LEDGER_VERSION | {"strategy":"RELEASE_SCHOOL_RESERVATION_AND_RETRY_FROM_PINNED_PRIVATE_REQUEST","maxAttempts":3,"retryableFailureResults":["PLATFORM_FAILURE","GATE_CHECK_UNAVAILABLE","VERSION_CONFLICT"]} | {"strategy":"NO_DELIVERY_SETTLEMENT_PROMOTION_OR_CROSS_SCHOOL_MIGRATION_ON_FAILURE","description":"the school keeps management metadata, students keep protected minimum quota, and no partial or unauthorized group content is exposed"} | {"strategy":"REAUTHORIZE_SERVICE_SCOPE_AND_RECALL_WHEN_SCHOOL_SOURCE_OR_RIGHTS_CHANGE","targets":["school-private playback","class or group delivery","school quota settlement","knowledge-layer sharing eligibility"]} |

## DF-017 Version-pinned Student Transfer Authorization Cutover

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | DGV-001 / ACC-001 / ORG-001 / IAM-001 | "NONE" | FORWARD_ONLY_CROSS_DOMAIN_CUTOVER_WITH_OLD_ACCESS_NEVER_RESTORED | {"strategy":"IDEMPOTENT_RESUME_FROM_PINNED_TRANSFER_AND_OBJECT_VERSIONS","maxAttempts":8,"retryableFailureResults":["VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"FORWARD_ONLY_RECONCILIATION_NO_OLD_ACCESS_RESTORE","description":"after cutover starts, keep old membership, student-data authorization, and guardian school delegations terminated; keep pending new scope non-readable, revoke any partially activated wider scope, retry from pinned versions, and deny identifiable old-school history until its restricted boundary is committed"} | {"strategy":"INVALIDATE_ALL_FORMER_RELATIONSHIP_DERIVATIONS","targets":["old-school active contexts","permission decisions and caches","search, aggregation, autocomplete, archive and direct links","export generation and download authorization","guardian task-assistance sessions","teacher and homeroom work views"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-ID; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-STUDENT-PROFILE-ID; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-FROM-SCHOOL-ID; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-TO-SCHOOL-ID; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-DISPUTE-STATUS; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-EXPIRY; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-RELATIONSHIP-SCOPE; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-PERMITTED-SUBSET; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-SOURCE-RIGHTS; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-OLD-MEMBERSHIP-REF; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-OLD-GUARDIAN-AUTHORIZATION-MANIFEST-DIGEST; version=DGV-TRANSFER-F-VERSION; cardinality=ONE | — |
| ACC-OBJ-MEMBERSHIP.ACC-MEMBER-F-ID; version=ACC-MEMBER-F-VERSION; cardinality=ONE | — |
| ACC-OBJ-MEMBERSHIP.ACC-MEMBER-F-STATE; version=ACC-MEMBER-F-VERSION; cardinality=ONE | — |
| ORG-OBJ-STUDENT.ORG-STUDENT-F-ID; version=ORG-STUDENT-F-VERSION; cardinality=ONE | — |
| ORG-OBJ-STUDENT.ORG-STUDENT-F-MEMBER-STATE; version=ORG-STUDENT-F-VERSION; cardinality=ONE | — |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION.IAM-SSDA-F-ID; version=IAM-SSDA-F-VERSION; cardinality=ONE | — |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION.IAM-SSDA-F-STATUS; version=IAM-SSDA-F-VERSION; cardinality=ONE | — |
| IAM-OBJ-SCHOOL-DATA-AUTHORIZATION.IAM-SDAUTH-F-ID; version=IAM-SDAUTH-F-VERSION; cardinality=ZERO_MANY | — |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION.IAM-HIAUTH-F-ID; version=IAM-HIAUTH-F-VERSION; cardinality=ONE | — |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION.IAM-HIAUTH-F-STATUS; version=IAM-HIAUTH-F-VERSION; cardinality=ONE | — |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION.IAM-HIAUTH-F-DISPUTE-STATUS; version=IAM-HIAUTH-F-VERSION; cardinality=ONE | — |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION.IAM-HIAUTH-F-EXPIRY; version=IAM-HIAUTH-F-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | DGV-ACT-EXECUTE-STUDENT-TRANSFER | the transfer and exact high-impact authorization are AUTHORIZED, unexpired, undisputed, and pin the current old-school relationship and permitted subset | [] |
| 2 | ACC-ACT-TERMINATE-OLD-SCHOOL-MEMBERSHIP | the cutover request event matches the exact active old-school membership and transfer context | [{"fieldId":"ACC-MEMBER-F-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-PLATFORM-IDENTITY-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-STUDENT-PROFILE-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-SCHOOL-PROFILE-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-SCHOOL-PROFILE-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-SCHOOL-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION","provider":{"actorRef":"SYSTEM"}}] |
| 3 | ORG-ACT-TRANSFER-STUDENT | the old-school membership is TERMINATED and the school profile is updated only as a historical projection | [{"fieldId":"ORG-STUDENT-F-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ORG-STUDENT-F-CLASS-ID","provider":{"actorRef":"SYSTEM"}}] |
| 4 | IAM-ACT-TERMINATE-OLD-SCHOOL-STUDENT-DATA-AUTHORIZATION | the exact old-school student data authorization matches the terminated membership | [{"fieldId":"IAM-SSDA-F-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-STUDENT-PROFILE-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-SCHOOL-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-MEMBERSHIP-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-MEMBERSHIP-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-TERMINATION-TRANSFER-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-TERMINATION-TRANSFER-VERSION","provider":{"actorRef":"SYSTEM"}}] |
| 5 | IAM-ACT-REVOKE-OLD-SCHOOL-GUARDIAN-DELEGATIONS | zero or more matching old-school guardian delegations are revoked without changing the personal guardian relation | [{"fieldId":"IAM-SDAUTH-F-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SDAUTH-F-STUDENT-PROFILE-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SDAUTH-F-SCHOOL-ID","provider":{"actorRef":"SYSTEM"}}] |
| 6 | ACC-ACT-CREATE-PENDING-NEW-SCHOOL-MEMBERSHIP | old-school current membership and authorizations are terminated | [{"fieldId":"ACC-MEMBER-F-ACCOUNT-ID-TYPE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-ACCOUNT-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-SCHOOL-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-ACTIVATION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-PLATFORM-IDENTITY-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-STUDENT-PROFILE-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-SCHOOL-PROFILE-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-SCHOOL-PROFILE-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-PREDECESSOR-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-PREDECESSOR-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"ACC-MEMBER-F-EFFECTIVE-AT","provider":{"actorRef":"SYSTEM"}}] |
| 7 | IAM-ACT-CREATE-PENDING-NEW-SCHOOL-STUDENT-DATA-AUTHORIZATION | the PENDING new-school membership exists and the exact permitted subset and source rights remain valid | [{"fieldId":"IAM-SSDA-F-STUDENT-PROFILE-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-SCHOOL-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-MEMBERSHIP-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-MEMBERSHIP-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-SOURCE-TRANSFER-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-SOURCE-TRANSFER-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-PERMITTED-SUBSET","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-PERMITTED-SUBSET-DIGEST","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-SOURCE-RIGHTS","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-SOURCE-RIGHTS-DIGEST","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-EFFECTIVE-AT","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-SSDA-F-EXPIRY","provider":{"actorRef":"SYSTEM"}}] |
| 8 | ACC-ACT-ACTIVATE-NEW-SCHOOL-MEMBERSHIP | there is no other active school membership and the predecessor remains TERMINATED | [{"fieldId":"ACC-MEMBER-F-JOINT-ACTIVATION-COMMIT-ID","provider":{"actorRef":"SYSTEM"}}] |
| 9 | IAM-ACT-ACTIVATE-NEW-SCHOOL-STUDENT-DATA-AUTHORIZATION | the new membership is ACTIVE, old current access remains terminated, and the authorization still equals the pinned subset | [{"fieldId":"IAM-SSDA-F-JOINT-ACTIVATION-COMMIT-ID","provider":{"actorRef":"SYSTEM"}}] |
| 10 | DGV-ACT-COMPLETE-STUDENT-TRANSFER | old membership and authorization are terminated and the exact new membership and subset authorization are ACTIVE | [{"fieldId":"DGV-TRANSFER-F-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-STUDENT-PROFILE-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-FROM-SCHOOL-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-TO-SCHOOL-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-OLD-MEMBERSHIP-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-NEW-MEMBERSHIP-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-NEW-MEMBERSHIP-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-JOINT-ACTIVATION-COMMIT-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-JOINT-ACTIVATION-EFFECTIVE-AT","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST","provider":{"actorRef":"SYSTEM"}}] |
| 11 | DGV-ACT-CREATE-OLD-SCHOOL-HISTORY-RESTRICTION | the completed event creates a purpose-, role-, object-, and time-limited old-school history boundary; failure leaves identifiable history denied | [{"fieldId":"DGV-OLDHIST-F-STUDENT-PROFILE-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-OLDHIST-F-SCHOOL-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-OLDHIST-F-PURPOSE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-OLDHIST-F-ROLE-SCOPE","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-OLDHIST-F-EXPIRY","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-OLDHIST-F-OLD-MEMBERSHIP-REF","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-OLDHIST-F-OLD-MEMBERSHIP-VERSION","provider":{"actorRef":"SYSTEM"}},{"fieldId":"DGV-OLDHIST-F-PERMITTED-PURPOSE-DIGEST","provider":{"actorRef":"SYSTEM"}}] |
| 12 | IAM-ACT-INVALIDATE-TRANSFERRED-STUDENT-PERMISSIONS | permission decisions and cached contexts derived from the former relationship become STALE | [{"fieldId":"IAM-DECISION-F-ID","provider":{"actorRef":"SYSTEM"}},{"fieldId":"IAM-DECISION-F-SOURCE-VERSIONS","provider":{"actorRef":"SYSTEM"}}] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| ACC-OBJ-MEMBERSHIP.ACC-MEMBER-F-STATE; version=ACC-MEMBER-F-VERSION | — |
| ORG-OBJ-STUDENT.ORG-STUDENT-F-MEMBER-STATE; version=ORG-STUDENT-F-VERSION | — |
| IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION.IAM-SSDA-F-STATUS; version=IAM-SSDA-F-VERSION | — |
| IAM-OBJ-SCHOOL-DATA-AUTHORIZATION.IAM-SDAUTH-F-STATUS; version=IAM-SDAUTH-F-VERSION | — |
| DGV-OBJ-TRANSFER-AUTHORIZATION.DGV-TRANSFER-F-STATUS; version=DGV-TRANSFER-F-VERSION | — |
| DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY.DGV-OLDHIST-F-STATUS; version=DGV-OLDHIST-F-VERSION | — |
| IAM-OBJ-PERMISSION-DECISION.IAM-DECISION-F-RESULT; version=IAM-DECISION-F-DECISION-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["DGV-TRANSFER-F-ID","ACC-MEMBER-F-ID","ORG-STUDENT-F-ID","IAM-SSDA-F-ID","IAM-HIAUTH-F-ID"],"versionFieldIds":["DGV-TRANSFER-F-VERSION","ACC-MEMBER-F-VERSION","ORG-STUDENT-F-VERSION","IAM-SSDA-F-VERSION","IAM-HIAUTH-F-VERSION"],"fanoutFieldId":"IAM-SDAUTH-F-ID"} | FORWARD_ONLY_CROSS_DOMAIN_CUTOVER_WITH_OLD_ACCESS_NEVER_RESTORED | {"strategy":"IDEMPOTENT_RESUME_FROM_PINNED_TRANSFER_AND_OBJECT_VERSIONS","maxAttempts":8,"retryableFailureResults":["VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"FORWARD_ONLY_RECONCILIATION_NO_OLD_ACCESS_RESTORE","description":"after cutover starts, keep old membership, student-data authorization, and guardian school delegations terminated; keep pending new scope non-readable, revoke any partially activated wider scope, retry from pinned versions, and deny identifiable old-school history until its restricted boundary is committed"} | {"strategy":"INVALIDATE_ALL_FORMER_RELATIONSHIP_DERIVATIONS","targets":["old-school active contexts","permission decisions and caches","search, aggregation, autocomplete, archive and direct links","export generation and download authorization","guardian task-assistance sessions","teacher and homeroom work views"]} |

## DF-011 Versioned Learning Facts to Cross-term Learning Path

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | LEARNING_PATH_AGGREGATION | PUB-001 / INS-001 / CORR-001 / APP-001 / GRD-001 / LPATH-001 | "ACTION_CHOICE_REQUIRED" | STUDENT_SOURCE_FACT_VERSION | {"strategy":"REFRESH_SELECTED_SOURCE_VERSION_AND_RETRY_FAILED_PATH_OBJECTS","maxAttempts":4,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT"]} | {"strategy":"KEEP_ACCEPTED_SOURCE_FACT_AND_RETRY_ONLY_FAILED_DERIVED_OBJECTS","description":"a learning-path failure never rewrites evidence and never removes an accepted timeline entry"} | {"strategy":"SUPERSEDE_OR_MARK_STALE_BY_SOURCE_VERSION","targets":["learning path interpretation version","authorized path read model"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| PUB-OBJ-RESULT.PUB-RESULT-F-ID; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ZERO_MANY; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| PUB-OBJ-RESULT.PUB-RESULT-F-STUDENT-REF; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ZERO_MANY; role=SOURCE_FANOUT | SOURCE_FANOUT |
| PUB-OBJ-RESULT.PUB-RESULT-F-RESULT-VERSION; version=PUB-RESULT-F-RESULT-VERSION; cardinality=ZERO_MANY; role=SOURCE_VERSION | SOURCE_VERSION |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-ID; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-STUDENT-REF; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE; role=SOURCE_FANOUT | SOURCE_FANOUT |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-EVIDENCE-VERSION; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE; role=SOURCE_VERSION | SOURCE_VERSION |
| CORR-OBJ-ATTEMPT.CORR-ATTEMPT-F-ID; version=CORR-ATTEMPT-F-CORRECTION-VERSION; cardinality=ZERO_MANY; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| CORR-OBJ-ATTEMPT.CORR-ATTEMPT-F-STUDENT-REF; version=CORR-ATTEMPT-F-CORRECTION-VERSION; cardinality=ZERO_MANY; role=SOURCE_FANOUT | SOURCE_FANOUT |
| CORR-OBJ-ATTEMPT.CORR-ATTEMPT-F-CORRECTION-VERSION; version=CORR-ATTEMPT-F-CORRECTION-VERSION; cardinality=ZERO_MANY; role=SOURCE_VERSION | SOURCE_VERSION |
| APP-OBJ-TODO.APP-TODO-F-ID; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ZERO_MANY; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| APP-OBJ-TODO.APP-TODO-F-STUDENT-REF; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ZERO_MANY; role=SOURCE_FANOUT | SOURCE_FANOUT |
| APP-OBJ-TODO.APP-TODO-F-AGGREGATION-VERSION; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ZERO_MANY; role=SOURCE_VERSION | SOURCE_VERSION |
| GRD-OBJ-DECISION.GRD-DECISION-F-ID; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ZERO_MANY; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| GRD-OBJ-DECISION.GRD-DECISION-F-SUBMISSION-REF; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ZERO_MANY; role=SOURCE_FANOUT | SOURCE_FANOUT |
| GRD-OBJ-DECISION.GRD-DECISION-F-DECISION-VERSION; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ZERO_MANY; role=SOURCE_VERSION | SOURCE_VERSION |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | LPATH-ACT-APPEND-PUBLISHED-RESULT-TIMELINE | one current PUBLISHED_RESULT source version is appended without copying the source fact | [] |
| 2 | LPATH-ACT-APPEND-EVIDENCE-TIMELINE | one current EVIDENCE source version is appended without copying the source fact | [] |
| 3 | LPATH-ACT-APPEND-CORRECTION-TIMELINE | one current CORRECTION source version is appended without copying the source fact | [] |
| 4 | LPATH-ACT-APPEND-PLAN-EXECUTION-TIMELINE | one current PLAN_EXECUTION source version is appended without copying the source fact | [] |
| 5 | LPATH-ACT-APPEND-TEACHER-CONFIRMATION-TIMELINE | one current TEACHER_CONFIRMATION source version is appended without copying the source fact | [] |
| 6 | LPATH-ACT-CREATE-INTERPRETATION-CANDIDATE | a teacher-confirmed evidence version supports an explainable candidate for subject-teacher review | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |
| PUBLISHED_RESULT | PUBLISHED_RESULT_SOURCE | 1 | {"kind":"ACTION_CHOICE","consumerStepOrder":1} | [] | [{"sourceObjectId":"PUB-OBJ-RESULT","sourceIdentityFieldId":"PUB-RESULT-F-ID","sourceVersionFieldId":"PUB-RESULT-F-RESULT-VERSION","consumerStepOrder":1,"targetRefFieldId":"LPATH-ENTRY-F-PUBLISHED-RESULT-REF","targetVersionFieldId":"LPATH-ENTRY-F-PUBLISHED-RESULT-VERSION","cardinality":"ONE"}] | {"identityFieldIds":["PUB-RESULT-F-ID"],"versionFieldIds":["PUB-RESULT-F-RESULT-VERSION"],"fanoutFieldId":"PUB-RESULT-F-STUDENT-REF"} |
| EVIDENCE | EVIDENCE_SOURCE | 2 → 6 | {"kind":"ACTION_CHOICE","consumerStepOrder":2} | [] | [{"sourceObjectId":"INS-OBJ-EVIDENCE","sourceIdentityFieldId":"INS-EVIDENCE-F-ID","sourceVersionFieldId":"INS-EVIDENCE-F-EVIDENCE-VERSION","consumerStepOrder":2,"targetRefFieldId":"LPATH-ENTRY-F-EVIDENCE-REF","targetVersionFieldId":"LPATH-ENTRY-F-EVIDENCE-VERSION","cardinality":"ONE"}] | {"identityFieldIds":["INS-EVIDENCE-F-ID"],"versionFieldIds":["INS-EVIDENCE-F-EVIDENCE-VERSION"],"fanoutFieldId":"INS-EVIDENCE-F-STUDENT-REF"} |
| CORRECTION | CORRECTION_SOURCE | 3 | {"kind":"ACTION_CHOICE","consumerStepOrder":3} | [] | [{"sourceObjectId":"CORR-OBJ-ATTEMPT","sourceIdentityFieldId":"CORR-ATTEMPT-F-ID","sourceVersionFieldId":"CORR-ATTEMPT-F-CORRECTION-VERSION","consumerStepOrder":3,"targetRefFieldId":"LPATH-ENTRY-F-CORRECTION-REF","targetVersionFieldId":"LPATH-ENTRY-F-CORRECTION-VERSION","cardinality":"ONE"}] | {"identityFieldIds":["CORR-ATTEMPT-F-ID"],"versionFieldIds":["CORR-ATTEMPT-F-CORRECTION-VERSION"],"fanoutFieldId":"CORR-ATTEMPT-F-STUDENT-REF"} |
| PLAN_EXECUTION | PLAN_EXECUTION_SOURCE | 4 | {"kind":"ACTION_CHOICE","consumerStepOrder":4} | [] | [{"sourceObjectId":"APP-OBJ-TODO","sourceIdentityFieldId":"APP-TODO-F-ID","sourceVersionFieldId":"APP-TODO-F-AGGREGATION-VERSION","consumerStepOrder":4,"targetRefFieldId":"LPATH-ENTRY-F-PLAN-EXECUTION-REF","targetVersionFieldId":"LPATH-ENTRY-F-PLAN-EXECUTION-VERSION","cardinality":"ONE"}] | {"identityFieldIds":["APP-TODO-F-ID"],"versionFieldIds":["APP-TODO-F-AGGREGATION-VERSION"],"fanoutFieldId":"APP-TODO-F-STUDENT-REF"} |
| TEACHER_CONFIRMATION | TEACHER_CONFIRMATION_SOURCE | 5 | {"kind":"ACTION_CHOICE","consumerStepOrder":5} | [] | [{"sourceObjectId":"GRD-OBJ-DECISION","sourceIdentityFieldId":"GRD-DECISION-F-ID","sourceVersionFieldId":"GRD-DECISION-F-DECISION-VERSION","consumerStepOrder":5,"targetRefFieldId":"LPATH-ENTRY-F-TEACHER-CONFIRMATION-REF","targetVersionFieldId":"LPATH-ENTRY-F-TEACHER-CONFIRMATION-VERSION","cardinality":"ONE"}] | {"identityFieldIds":["GRD-DECISION-F-ID"],"versionFieldIds":["GRD-DECISION-F-DECISION-VERSION"],"fanoutFieldId":"GRD-DECISION-F-SUBMISSION-REF"} |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| LPATH-OBJ-TIMELINE-ENTRY.LPATH-ENTRY-F-ID; version=LPATH-ENTRY-F-VERSION; role=TARGET_IDENTITY | TARGET_IDENTITY |
| LPATH-OBJ-TIMELINE-ENTRY.LPATH-ENTRY-F-PUBLISHED-RESULT-REF; version=LPATH-ENTRY-F-VERSION; role=TARGET_LINEAGE | TARGET_LINEAGE |
| LPATH-OBJ-TIMELINE-ENTRY.LPATH-ENTRY-F-PUBLISHED-RESULT-VERSION; version=LPATH-ENTRY-F-VERSION; role=TARGET_LINEAGE | TARGET_LINEAGE |
| LPATH-OBJ-TIMELINE-ENTRY.LPATH-ENTRY-F-EVIDENCE-REF; version=LPATH-ENTRY-F-VERSION; role=TARGET_LINEAGE | TARGET_LINEAGE |
| LPATH-OBJ-TIMELINE-ENTRY.LPATH-ENTRY-F-EVIDENCE-VERSION; version=LPATH-ENTRY-F-VERSION; role=TARGET_LINEAGE | TARGET_LINEAGE |
| LPATH-OBJ-TIMELINE-ENTRY.LPATH-ENTRY-F-CORRECTION-REF; version=LPATH-ENTRY-F-VERSION; role=TARGET_LINEAGE | TARGET_LINEAGE |
| LPATH-OBJ-TIMELINE-ENTRY.LPATH-ENTRY-F-CORRECTION-VERSION; version=LPATH-ENTRY-F-VERSION; role=TARGET_LINEAGE | TARGET_LINEAGE |
| LPATH-OBJ-TIMELINE-ENTRY.LPATH-ENTRY-F-PLAN-EXECUTION-REF; version=LPATH-ENTRY-F-VERSION; role=TARGET_LINEAGE | TARGET_LINEAGE |
| LPATH-OBJ-TIMELINE-ENTRY.LPATH-ENTRY-F-PLAN-EXECUTION-VERSION; version=LPATH-ENTRY-F-VERSION; role=TARGET_LINEAGE | TARGET_LINEAGE |
| LPATH-OBJ-TIMELINE-ENTRY.LPATH-ENTRY-F-TEACHER-CONFIRMATION-REF; version=LPATH-ENTRY-F-VERSION; role=TARGET_LINEAGE | TARGET_LINEAGE |
| LPATH-OBJ-TIMELINE-ENTRY.LPATH-ENTRY-F-TEACHER-CONFIRMATION-VERSION; version=LPATH-ENTRY-F-VERSION; role=TARGET_LINEAGE | TARGET_LINEAGE |
| LPATH-OBJ-TIMELINE-ENTRY.LPATH-ENTRY-F-VERSION; version=LPATH-ENTRY-F-VERSION; role=TARGET_VERSION | TARGET_VERSION |
| LPATH-OBJ-INTERPRETATION.LPATH-INTERPRETATION-F-ID; version=LPATH-INTERPRETATION-F-VERSION; role=TARGET_IDENTITY | TARGET_IDENTITY |
| LPATH-OBJ-INTERPRETATION.LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-REF; version=LPATH-INTERPRETATION-F-VERSION; role=TARGET_PAYLOAD | TARGET_PAYLOAD |
| LPATH-OBJ-INTERPRETATION.LPATH-INTERPRETATION-F-EVIDENCE-REFS; version=LPATH-INTERPRETATION-F-VERSION; role=TARGET_PAYLOAD | TARGET_PAYLOAD |
| LPATH-OBJ-INTERPRETATION.LPATH-INTERPRETATION-F-VERSION; version=LPATH-INTERPRETATION-F-VERSION; role=TARGET_VERSION | TARGET_VERSION |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["INS-EVIDENCE-F-ID"],"versionFieldIds":["INS-EVIDENCE-F-EVIDENCE-VERSION"],"fanoutFieldId":"INS-EVIDENCE-F-STUDENT-REF"} | STUDENT_SOURCE_FACT_VERSION | {"strategy":"REFRESH_SELECTED_SOURCE_VERSION_AND_RETRY_FAILED_PATH_OBJECTS","maxAttempts":4,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT"]} | {"strategy":"KEEP_ACCEPTED_SOURCE_FACT_AND_RETRY_ONLY_FAILED_DERIVED_OBJECTS","description":"a learning-path failure never rewrites evidence and never removes an accepted timeline entry"} | {"strategy":"SUPERSEDE_OR_MARK_STALE_BY_SOURCE_VERSION","targets":["learning path interpretation version","authorized path read model"]} |
