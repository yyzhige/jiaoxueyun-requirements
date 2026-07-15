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
| 2 | HW-ACT-REVALIDATE-ITEM | an item is a revision draft | [] |
| 3 | HW-ACT-VALIDATE | the assignment is an initial draft | [] |
| 4 | HW-ACT-REVALIDATE-REVISION | the assignment is a revision draft | [] |
| 5 | HW-ACT-PREVIEW | — | [] |
| 6 | HW-ACT-PUBLISH-ITEM | every included item version is validated | [] |
| 7 | HW-ACT-PUBLISH-NOW | the teacher selects immediate publication | [] |
| 8 | HW-ACT-SCHEDULE-PUBLISH | the teacher selects scheduled publication instead of immediate publication | [] |
| 9 | APP-ACT-CREATE-HOMEWORK-TODO | the published assignment version becomes available to the assigned class scope | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-PUBLICATION-VERSION; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION | — |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION | — |
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
| 1 | GENERIC | HW-001 / SUB-001 | "NONE" | STUDENT_SUBMISSION_OBJECT_AND_MEDIA_CHUNK | {"strategy":"RETRY_FAILED_CHUNKS_OR_UNRECEIPTED_SUBMISSION","maxAttempts":5,"retryableFailureResults":["TRANSIENT_FAILURE","CHUNK_REJECTED","SERVER_RECEIPT_NOT_ISSUED"]} | {"strategy":"PRESERVE_DRAFT_AND_ACCEPTED_CHUNKS","description":"never roll back accepted chunks and never create a final submission without a server receipt"} | {"strategy":"INVALIDATE_STALE_SUBMISSION_DERIVATIONS","targets":["submission status","grading queue eligibility","late and resubmission projections"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-ID; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION; cardinality=ONE | — |
| HW-OBJ-ASSIGNMENT.HW-ASSIGNMENT-F-TITLE; version=HW-ASSIGNMENT-F-PUBLICATION-VERSION; cardinality=ONE | — |
| SUB-OBJ-DRAFT.SUB-DRAFT-F-ID; version=SUB-DRAFT-F-DRAFT-VERSION; cardinality=ONE | — |
| SUB-OBJ-DRAFT.SUB-DRAFT-F-ANSWER-PAYLOAD; version=SUB-DRAFT-F-DRAFT-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | HW-ACT-OPEN-PUBLISHED | — | [] |
| 2 | SUB-ACT-SAVE-DRAFT | — | [{"fieldId":"SUB-DRAFT-F-MEDIA-METADATA","provider":{"roleRef":"ROLE-STUDENT"}},{"fieldId":"SUB-DRAFT-F-PAGE-ITEM-MAPPING","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 3 | SUB-ACT-UPLOAD-CHUNK | the answer contains App media | [{"fieldId":"SUB-DRAFT-F-PENDING-CHUNK","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 4 | SUB-ACT-RETRY-UPLOAD | one or more media chunks failed while successful chunks remain accepted | [{"fieldId":"SUB-DRAFT-F-PENDING-CHUNK","provider":{"roleRef":"ROLE-STUDENT"}}] |
| 5 | SUB-ACT-SUBMIT | the server can issue a final submission receipt | [{"fieldId":"SUB-ATTEMPT-F-DRAFT-VERSION","provider":{"roleRef":"ROLE-STUDENT"}}] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-SUBMISSION-VERSION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-RECEIPT-ID; version=SUB-ATTEMPT-F-SUBMISSION-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["HW-ASSIGNMENT-F-ID"],"versionFieldIds":["HW-ASSIGNMENT-F-PUBLICATION-VERSION","SUB-DRAFT-F-DRAFT-VERSION"],"fanoutFieldId":"SUB-DRAFT-F-ID"} | STUDENT_SUBMISSION_OBJECT_AND_MEDIA_CHUNK | {"strategy":"RETRY_FAILED_CHUNKS_OR_UNRECEIPTED_SUBMISSION","maxAttempts":5,"retryableFailureResults":["TRANSIENT_FAILURE","CHUNK_REJECTED","SERVER_RECEIPT_NOT_ISSUED"]} | {"strategy":"PRESERVE_DRAFT_AND_ACCEPTED_CHUNKS","description":"never roll back accepted chunks and never create a final submission without a server receipt"} | {"strategy":"INVALIDATE_STALE_SUBMISSION_DERIVATIONS","targets":["submission status","grading queue eligibility","late and resubmission projections"]} |

## DF-006 Submission Grading Routing

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | HW-001 / SUB-001 / GRD-001 | "NONE" | SUBMISSION_ITEM_OBJECT_WITH_INDEPENDENT_MANUAL_ROUTE | {"strategy":"RETRY_QUEUE_AND_PROCESSING_WITH_MANUAL_CUTOFF","maxAttempts":3,"retryableFailureResults":["AI_UNAVAILABLE","VERSION_CONFLICT"]} | {"strategy":"ROUTE_MANUAL_WITHOUT_ROLLING_BACK_SUBMISSION","description":"an AI failure preserves the accepted submission and creates or keeps a manual grading route"} | {"strategy":"INVALIDATE_STALE_GRADING_QUEUE_VIEWS","targets":["subject teacher grading queue","AI suggestion preview","batch confirmation eligibility"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-ID; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| SUB-OBJ-ATTEMPT.SUB-ATTEMPT-F-SUBMISSION-VERSION; version=SUB-ATTEMPT-F-SUBMISSION-VERSION; cardinality=ONE | — |
| HW-OBJ-ITEM.HW-ITEM-F-ID; version=HW-ITEM-F-ITEM-VERSION; cardinality=ONE | — |
| HW-OBJ-ITEM.HW-ITEM-F-ITEM-VERSION; version=HW-ITEM-F-ITEM-VERSION; cardinality=ONE | — |
| HW-OBJ-RUBRIC.HW-RUBRIC-F-ID; version=HW-RUBRIC-F-RUBRIC-VERSION; cardinality=ONE | — |
| HW-OBJ-RUBRIC.HW-RUBRIC-F-RUBRIC-VERSION; version=HW-RUBRIC-F-RUBRIC-VERSION; cardinality=ONE | — |
| GRD-OBJ-CAPABILITY-RULE.GRD-CAP-F-RULE-ID; version=GRD-CAP-F-RULE-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | SUB-ACT-HANDOFF-ACCEPTED | — | [] |
| 2 | HW-ACT-RESOLVE-GRADING-SNAPSHOT | — | [] |
| 3 | GRD-ACT-ENQUEUE | — | [] |
| 4 | GRD-ACT-ROUTE-UNSUPPORTED | the exact combination is excluded from supported capability rules | [] |
| 5 | GRD-ACT-PROCESS | the exact combination has a supported recognition or scoring capability | [] |
| 6 | GRD-ACT-ROUTE | supported processing succeeds and requires teacher review or confirmation | [] |
| 7 | GRD-ACT-ROUTE-AI-UNAVAILABLE | AI processing is unavailable and the decision requires an explicit manual fallback | [] |

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

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["SUB-ATTEMPT-F-ID","HW-RUBRIC-F-ID","GRD-CAP-F-RULE-ID"],"versionFieldIds":["SUB-ATTEMPT-F-SUBMISSION-VERSION","HW-ITEM-F-ITEM-VERSION","HW-RUBRIC-F-RUBRIC-VERSION","GRD-CAP-F-RULE-VERSION"],"fanoutFieldId":"HW-ITEM-F-ID"} | SUBMISSION_ITEM_OBJECT_WITH_INDEPENDENT_MANUAL_ROUTE | {"strategy":"RETRY_QUEUE_AND_PROCESSING_WITH_MANUAL_CUTOFF","maxAttempts":3,"retryableFailureResults":["AI_UNAVAILABLE","VERSION_CONFLICT"]} | {"strategy":"ROUTE_MANUAL_WITHOUT_ROLLING_BACK_SUBMISSION","description":"an AI failure preserves the accepted submission and creates or keeps a manual grading route"} | {"strategy":"INVALIDATE_STALE_GRADING_QUEUE_VIEWS","targets":["subject teacher grading queue","AI suggestion preview","batch confirmation eligibility"]} |

## DF-007 Subject Teacher Grading Confirmation

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | GRD-001 | "ACTION_CHOICE_REQUIRED" | STUDENT_ITEM_GRADING_OBJECT | {"strategy":"REFRESH_SOURCE_VERSIONS_THEN_RECONFIRM","maxAttempts":3,"retryableFailureResults":["STALE_INPUT_VERSION","SOURCE_VERSION_STILL_STALE","VERSION_CONFLICT"]} | {"strategy":"KEEP_PRIOR_CONFIRMED_DECISION","description":"a failed confirmation never replaces the prior official decision and never publishes an unconfirmed subjective score"} | {"strategy":"INVALIDATE_PUBLICATION_ELIGIBILITY_AND_DERIVED_EXPLANATIONS","targets":["result publication eligibility","score explanation","knowledge evidence projection"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| GRD-OBJ-DECISION.GRD-DECISION-F-ID; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-SUBMISSION-REF; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-SUGGESTED-SCORE; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-SCORING-RATIONALE; version=GRD-DECISION-F-DECISION-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | GRD-ACT-CORRECT-RECOGNITION | recognized answer or region is incorrect | [{"fieldId":"GRD-DECISION-F-RECOGNIZED-ANSWER","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"GRD-DECISION-F-RECOGNIZED-REGION","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"GRD-DECISION-F-CORRECTION-REASON","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 2 | GRD-ACT-ACCEPT-SUGGESTION | an eligible suggestion is correct after teacher review | [{"fieldId":"GRD-DECISION-F-TEACHER-FEEDBACK","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 3 | GRD-ACT-OVERRIDE-SCORE | the corresponding subject teacher changes the suggestion with a reason | [{"fieldId":"GRD-DECISION-F-CORRECTION-REASON","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 4 | GRD-ACT-MANUAL-GRADE | AI is unavailable, the combination is unsupported, or the item is subjective | [] |
| 5 | GRD-ACT-BATCH-CONFIRM | every selected item is objective, eligible, and teacher-reviewed | [] |
| 6 | GRD-ACT-RESOLVE-VERSION-CONFLICT | submission, item, or Rubric versions changed before confirmation | [{"fieldId":"GRD-DECISION-F-CORRECTION-REASON","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |
| ACCEPT_SUGGESTION | — | 2 | {"kind":"ACTION_CHOICE","consumerStepOrder":2} | [] | [] | {} |
| CORRECT_RECOGNITION_AND_ACCEPT | — | 1 → 2 | {"kind":"ACTION_CHOICE","consumerStepOrder":2} | [] | [] | {} |
| OVERRIDE_SCORE | — | 3 | {"kind":"ACTION_CHOICE","consumerStepOrder":3} | [{"stepOrder":3,"fieldId":"GRD-DECISION-F-OFFICIAL-SCORE","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"stepOrder":3,"fieldId":"GRD-DECISION-F-TEACHER-FEEDBACK","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] | [] | {} |
| CORRECT_RECOGNITION_AND_OVERRIDE | — | 1 → 3 | {"kind":"ACTION_CHOICE","consumerStepOrder":3} | [{"stepOrder":3,"fieldId":"GRD-DECISION-F-OFFICIAL-SCORE","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"stepOrder":3,"fieldId":"GRD-DECISION-F-TEACHER-FEEDBACK","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] | [] | {} |
| MANUAL_GRADE | — | 4 | {"kind":"ACTION_CHOICE","consumerStepOrder":4} | [{"stepOrder":4,"fieldId":"GRD-DECISION-F-OFFICIAL-SCORE","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"stepOrder":4,"fieldId":"GRD-DECISION-F-TEACHER-FEEDBACK","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] | [] | {} |
| BATCH_CONFIRM | — | 5 | {"kind":"ACTION_CHOICE","consumerStepOrder":5} | [] | [] | {} |
| RESOLVE_VERSION_CONFLICT | — | 6 | {"kind":"ACTION_CHOICE","consumerStepOrder":6} | [] | [] | {} |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| GRD-OBJ-DECISION.GRD-DECISION-F-OFFICIAL-SCORE; version=GRD-DECISION-F-DECISION-VERSION | — |
| GRD-OBJ-DECISION.GRD-DECISION-F-TEACHER-FEEDBACK; version=GRD-DECISION-F-DECISION-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["GRD-DECISION-F-ID"],"versionFieldIds":["GRD-DECISION-F-DECISION-VERSION"],"fanoutFieldId":"GRD-DECISION-F-SUBMISSION-REF"} | STUDENT_ITEM_GRADING_OBJECT | {"strategy":"REFRESH_SOURCE_VERSIONS_THEN_RECONFIRM","maxAttempts":3,"retryableFailureResults":["STALE_INPUT_VERSION","SOURCE_VERSION_STILL_STALE","VERSION_CONFLICT"]} | {"strategy":"KEEP_PRIOR_CONFIRMED_DECISION","description":"a failed confirmation never replaces the prior official decision and never publishes an unconfirmed subjective score"} | {"strategy":"INVALIDATE_PUBLICATION_ELIGIBILITY_AND_DERIVED_EXPLANATIONS","targets":["result publication eligibility","score explanation","knowledge evidence projection"]} |

## DF-008 Confirmed Result Publication

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | GRD-001 / PUB-001 / CORR-001 | "NONE" | SELECTED_STUDENT_RESULT_OR_CORRECTION_TASK_OBJECT_WITH_PARTIAL_SUCCESS | {"strategy":"RETRY_FAILED_STUDENT_RESULTS_OR_CORRECTION_TASKS_ONLY","maxAttempts":5,"retryableFailureResults":["OBJECT_PUBLICATION_FAILED","SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"DO_NOT_UNPUBLISH_SUCCESSFUL_RESULTS","description":"retain successful student results and correction tasks, then retry only failed result or correction task objects after eligibility and source versions are rechecked"} | {"strategy":"INVALIDATE_STALE_STUDENT_RESULT_READS","targets":["student score view","student feedback view","notification delivery state"]} |

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

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | GRD-ACT-ACCEPT-SUGGESTION | the corresponding subject teacher confirms an eligible objective suggestion | [{"fieldId":"GRD-DECISION-F-SUGGESTED-SCORE","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"GRD-DECISION-F-TEACHER-FEEDBACK","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 2 | GRD-ACT-OVERRIDE-SCORE | the corresponding subject teacher confirms an overridden score | [{"fieldId":"GRD-DECISION-F-CORRECTION-REASON","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 3 | GRD-ACT-MANUAL-GRADE | the corresponding subject teacher confirms a subjective or manual score | [] |
| 4 | PUB-ACT-PREVIEW | — | [{"fieldId":"PUB-PREVIEW-F-BATCH-REF","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"PUB-PREVIEW-F-STUDENT-REF","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"PUB-PREVIEW-F-DECISION-REF","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 5 | PUB-ACT-PREPARE-BATCH | object-level eligibility and blocking codes are complete | [] |
| 6 | PUB-ACT-PUBLISH-SELECTED | the prepared batch is ready and every subjective score has teacher confirmation | [] |
| 7 | PUB-ACT-MATERIALIZE-RESULT | create one ready result for each eligible selected student | [] |
| 8 | PUB-ACT-PUBLISH-RESULT | the result is ready and its configured visibility policy permits publication | [] |
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

## DF-009 Published Result Correction

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | GRD-001 / PUB-001 / INS-001 / PLN-001 / CORR-001 | "NONE" | PUBLISHED_STUDENT_RESULT_AND_DEPENDENT_INTERPRETATION_OBJECT | {"strategy":"REFRESH_RESULT_DECISION_EVIDENCE_AND_PLAN_VERSIONS_THEN_RETRY_FAILED_OBJECTS","maxAttempts":3,"retryableFailureResults":["STALE_DECISION_VERSION","SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_PRIOR_RESULT_AND_DEPENDENT_VERSIONS_UNTIL_OBJECT_OUTCOMES_COMMIT","description":"a failed correction leaves prior result, evidence, mastery, plan evaluation, report, and learning-path history intact and retries only failed objects"} | {"strategy":"VERSION_AND_REQUIRE_RECONFIRMATION_FOR_EVERY_DEPENDENT_TARGET_KIND","targets":["EVIDENCE","MASTERY_INTERPRETATION","IMPROVEMENT_CANDIDATE","PLAN_EVALUATION","REPORT_INTERPRETATION","LEARNING_PATH_EXPLANATION"]} |

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
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-ID; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ZERO_MANY | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-SOURCE-RESULT-REF; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ZERO_MANY | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-SOURCE-RESULT-VERSION; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ZERO_MANY | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-EVIDENCE-VERSION; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ZERO_MANY | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-ID; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ZERO_MANY | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-SOURCE-EVIDENCE-REF; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ZERO_MANY | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-SOURCE-EVIDENCE-VERSION; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ZERO_MANY | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-PLAN-VERSION; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ZERO_MANY | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | PUB-ACT-RESOLVE-DEPENDENCY-SNAPSHOT | resolve current dependencies against the exact prior published result ID and version before any correction or invalidation write | [] |
| 2 | GRD-ACT-OPEN-CONFIRMED-REVISION | the corresponding subject teacher records the correction reason against the prior confirmed version | [] |
| 3 | GRD-ACT-CONFIRM-REVISION | the corresponding subject teacher confirms the revised score and feedback into a new decision version | [] |
| 4 | PUB-ACT-CORRECT-RESULT | the correction references the new confirmed decision version | [] |
| 5 | CORR-ACT-RECORD-INVALIDATION | the corrected result records every dependent target kind, source version, target version, and history-preservation outcome | [] |
| 6 | INS-ACT-MARK-STALE | evidence or mastery interpretation depends on the corrected result or decision version | [] |
| 7 | PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM | an improvement candidate or plan evaluation depends on the invalidated evidence version | [] |
| 8 | PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION | the publication-level explanation is regenerated and teacher-reconfirmed while future report and learning-path consumers remain versioned targets | [] |

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
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-VALIDITY; version=INS-EVIDENCE-F-EVIDENCE-VERSION | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-INVALIDATION-REASON; version=INS-EVIDENCE-F-EVIDENCE-VERSION | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION; version=INS-EVIDENCE-F-EVIDENCE-VERSION | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-EVIDENCE-VERSION; version=INS-EVIDENCE-F-EVIDENCE-VERSION | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-INVALIDATION-REF; version=PLN-PLAN-F-PLAN-VERSION | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-INVALIDATION-VERSION; version=PLN-PLAN-F-PLAN-VERSION | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-EVALUATION-STATE; version=PLN-PLAN-F-EVALUATION-VERSION | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-EVALUATION-VERSION; version=PLN-PLAN-F-EVALUATION-VERSION | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-PLAN-VERSION; version=PLN-PLAN-F-PLAN-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["GRD-DECISION-F-ID","PUB-RESULT-F-ID","PUB-DEPENDENCY-SNAPSHOT-F-ID"],"versionFieldIds":["GRD-DECISION-F-DECISION-VERSION","PUB-RESULT-F-RESULT-VERSION","PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION"],"fanoutFieldId":"PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET"} | PUBLISHED_STUDENT_RESULT_AND_DEPENDENT_INTERPRETATION_OBJECT | {"strategy":"REFRESH_RESULT_DECISION_EVIDENCE_AND_PLAN_VERSIONS_THEN_RETRY_FAILED_OBJECTS","maxAttempts":3,"retryableFailureResults":["STALE_DECISION_VERSION","SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_PRIOR_RESULT_AND_DEPENDENT_VERSIONS_UNTIL_OBJECT_OUTCOMES_COMMIT","description":"a failed correction leaves prior result, evidence, mastery, plan evaluation, report, and learning-path history intact and retries only failed objects"} | {"strategy":"VERSION_AND_REQUIRE_RECONFIRMATION_FOR_EVERY_DEPENDENT_TARGET_KIND","targets":["EVIDENCE","MASTERY_INTERPRETATION","IMPROVEMENT_CANDIDATE","PLAN_EVALUATION","REPORT_INTERPRETATION","LEARNING_PATH_EXPLANATION"]} |

## DF-010 Correction Submission Judgment and New Evidence

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | PUB-001 / INS-001 / PLN-001 / CORR-001 | "OPTION_VALUE_REQUIRED" | CORRECTION_AND_DEPENDENT_EVIDENCE_OBJECT | {"strategy":"REFRESH_RESULT_EVIDENCE_AND_CORRECTION_VERSIONS_THEN_RETRY_FAILED_OBJECTS","maxAttempts":3,"retryableFailureResults":["VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_PRIOR_VISIBLE_RESULT_AND_EVIDENCE_HISTORY","description":"a failed correction or invalidation leaves prior visible versions intact and retries only failed dependent objects"} | {"strategy":"VERSION_AND_RECONFIRM_EVERY_DEPENDENT_INTERPRETATION","targets":["EVIDENCE","MASTERY_INTERPRETATION","IMPROVEMENT_CANDIDATE","PLAN_EVALUATION","REPORT_INTERPRETATION","LEARNING_PATH_EXPLANATION"]} |

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
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-ID; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-SOURCE-RESULT-REF; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-SOURCE-RESULT-VERSION; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-EVIDENCE-VERSION; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-ID; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ONE | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-SOURCE-EVIDENCE-REF; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ONE | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-SOURCE-EVIDENCE-VERSION; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ONE | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-PLAN-VERSION; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | PUB-ACT-VIEW-RESULT | the student's published result and source decision versions are visible | [] |
| 2 | CORR-ACT-NORMALIZE-SUBMISSION | exactly one initial, late, or repeated student submission has reached SUBMITTED | [] |
| 3 | CORR-ACT-CONFIRM-JUDGMENT | the corresponding subject teacher confirms a PASSED or CLOSED correction judgment | [{"fieldId":"CORR-ATTEMPT-F-TEACHER-JUDGMENT","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 4 | CORR-ACT-REQUEST-RETRY | the corresponding subject teacher records NOT-PASSED or NEEDS-MORE and terminates this judgment path in NEEDS_RETRY | [] |
| 5 | CORR-ACT-COMPLETE-TASK | a PASSED or CLOSED judgment completes the exact guarded correction Task before dependent work | [] |
| 6 | CORR-ACT-MARK-TASK-AWAITING-RETRY | a NOT-PASSED or NEEDS-MORE judgment moves the exact guarded correction Task to AWAITING_RETRY and terminates | [] |
| 7 | CORR-ACT-RECORD-INVALIDATION | a PASSED or CLOSED judgment invalidates dependent versions with history retained | [] |
| 8 | INS-ACT-MARK-STALE | the prior evidence depends on the corrected result or decision version | [] |
| 9 | PLN-ACT-MARK-EVALUATION-PENDING-RECONFIRM | a plan evaluation depends on the corrected result, decision, evidence, or mastery version | [] |
| 10 | INS-ACT-CREATE-CANDIDATE | the PASSED or CLOSED correction produces a new evidence and mastery candidate | [] |
| 11 | INS-ACT-CONFIRM-MASTERY | the corresponding subject teacher confirms the candidate interpretation | [{"fieldId":"INS-EVIDENCE-F-MASTERY-INTERPRETATION","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}},{"fieldId":"INS-EVIDENCE-F-TEACHER-CONFIRMATION","provider":{"dutyRef":"DUTY-SUBJECT-TEACHER"}}] |
| 12 | INS-ACT-PUBLISH-INTERPRETATION | only the teacher-confirmed interpretation becomes student-visible | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |
| PASSED | — | 1 → 2 → 3 → 5 → 7 → 8 → 9 → 10 → 11 → 12 | {"kind":"OPTION_VALUE","fieldId":"CORR-ATTEMPT-F-TEACHER-JUDGMENT","values":["PASSED"],"consumerStepOrder":3} | [] | [] | {} |
| CLOSED | — | 1 → 2 → 3 → 5 → 7 → 8 → 9 → 10 → 11 → 12 | {"kind":"OPTION_VALUE","fieldId":"CORR-ATTEMPT-F-TEACHER-JUDGMENT","values":["CLOSED"],"consumerStepOrder":3} | [] | [] | {} |
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
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-ID; version=INS-EVIDENCE-F-EVIDENCE-VERSION | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-VALIDITY; version=INS-EVIDENCE-F-EVIDENCE-VERSION | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-RESULT; version=INS-EVIDENCE-F-EVIDENCE-VERSION | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-TEACHER-CONFIRMATION; version=INS-EVIDENCE-F-EVIDENCE-VERSION | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION; version=INS-EVIDENCE-F-EVIDENCE-VERSION | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-STUDENT-VISIBLE-AT; version=INS-EVIDENCE-F-EVIDENCE-VERSION | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-EVIDENCE-VERSION; version=INS-EVIDENCE-F-EVIDENCE-VERSION | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-INVALIDATION-REF; version=PLN-PLAN-F-PLAN-VERSION | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-EVALUATION-STATE; version=PLN-PLAN-F-EVALUATION-VERSION | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-EVALUATION-VERSION; version=PLN-PLAN-F-EVALUATION-VERSION | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-PLAN-VERSION; version=PLN-PLAN-F-PLAN-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["PUB-RESULT-F-ID","CORR-TASK-F-ID","CORR-ATTEMPT-F-ID","PLN-PLAN-F-ID"],"versionFieldIds":["PUB-RESULT-F-RESULT-VERSION","CORR-TASK-F-TASK-VERSION","CORR-ATTEMPT-F-CORRECTION-VERSION","INS-EVIDENCE-F-EVIDENCE-VERSION","PLN-PLAN-F-PLAN-VERSION"],"fanoutFieldId":"INS-EVIDENCE-F-ID"} | CORRECTION_AND_DEPENDENT_EVIDENCE_OBJECT | {"strategy":"REFRESH_RESULT_EVIDENCE_AND_CORRECTION_VERSIONS_THEN_RETRY_FAILED_OBJECTS","maxAttempts":3,"retryableFailureResults":["VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_PRIOR_VISIBLE_RESULT_AND_EVIDENCE_HISTORY","description":"a failed correction or invalidation leaves prior visible versions intact and retries only failed dependent objects"} | {"strategy":"VERSION_AND_RECONFIRM_EVERY_DEPENDENT_INTERPRETATION","targets":["EVIDENCE","MASTERY_INTERPRETATION","IMPROVEMENT_CANDIDATE","PLAN_EVALUATION","REPORT_INTERPRETATION","LEARNING_PATH_EXPLANATION"]} |

## DF-012 Improvement Candidate to Subject Plan and Cross-subject Coordination

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | INS-001 / PLN-001 / APP-001 | "NONE" | STUDENT_SUBJECT_PLAN_AND_SYNC_OUTPUT_OBJECT | {"strategy":"RETRY_FAILED_SYNC_OR_TODO_OUTPUT_AFTER_SOURCE_VERSION_REFRESH","maxAttempts":4,"retryableFailureResults":["SYNC_DELIVERY_FAILED","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_CONFIRMED_PLAN_AND_RETRY_ONLY_FAILED_OUTPUTS","description":"a sync failure never rolls back the teacher-confirmed plan and never grants homeroom plan-content mutation"} | {"strategy":"INVALIDATE_STALE_PLAN_OUTPUTS_BY_OBJECT_VERSION","targets":["subject teacher sync output","homeroom coordination output","student todo deep link"]} |

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
| 6 | APP-ACT-CREATE-PLAN-TODO | the student todo receives only a source-pinned plan deep link and local execution state | [] |

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
| APP-OBJ-TODO.APP-TODO-F-ID; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-STUDENT-REF; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-SOURCE-PLAN-REF; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-SOURCE-PLAN-VERSION; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-TASK-DEEP-LINK; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-STUDENT-VISIBLE-AT; version=APP-TODO-F-AGGREGATION-VERSION | — |
| APP-OBJ-TODO.APP-TODO-F-AGGREGATION-VERSION; version=APP-TODO-F-AGGREGATION-VERSION | — |

### 幂等与失败

| 幂等键 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- |
| {"identityFieldIds":["INS-EVIDENCE-F-ID"],"versionFieldIds":["INS-EVIDENCE-F-EVIDENCE-VERSION"],"fanoutFieldId":"INS-EVIDENCE-F-STUDENT-REF"} | STUDENT_SUBJECT_PLAN_AND_SYNC_OUTPUT_OBJECT | {"strategy":"RETRY_FAILED_SYNC_OR_TODO_OUTPUT_AFTER_SOURCE_VERSION_REFRESH","maxAttempts":4,"retryableFailureResults":["SYNC_DELIVERY_FAILED","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_CONFIRMED_PLAN_AND_RETRY_ONLY_FAILED_OUTPUTS","description":"a sync failure never rolls back the teacher-confirmed plan and never grants homeroom plan-content mutation"} | {"strategy":"INVALIDATE_STALE_PLAN_OUTPUTS_BY_OBJECT_VERSION","targets":["subject teacher sync output","homeroom coordination output","student todo deep link"]} |

## DF-014 Student Management Profile Aggregation

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GENERIC | SCO-001 / INS-001 / PLN-001 / APP-001 / STU-001 | "NONE" | STUDENT_PROFILE_SOURCE_AND_PROJECTION_OBJECT | {"strategy":"REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_PROFILE_OBJECTS","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_PRIOR_PROFILE_AND_TODO_VIEW_VERSIONS","description":"a failed aggregation preserves the prior view definitions and retries only stale or failed student objects"} | {"strategy":"INVALIDATE_ONLY_STALE_PROFILE_AND_TODO_PROJECTIONS","targets":["gradebook view definition","student profile view definition","student todo aggregation"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| SCO-OBJ-VIEW.SCO-VIEW-F-ID; version=SCO-VIEW-F-VIEW-VERSION; cardinality=ONE | — |
| SCO-OBJ-VIEW.SCO-VIEW-F-RESULT-REF; version=SCO-VIEW-F-VIEW-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-ID; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| INS-OBJ-EVIDENCE.INS-EVIDENCE-F-EVIDENCE-VERSION; version=INS-EVIDENCE-F-EVIDENCE-VERSION; cardinality=ONE | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-ID; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ONE | — |
| PLN-OBJ-PLAN.PLN-PLAN-F-PLAN-VERSION; version=PLN-PLAN-F-PLAN-VERSION; cardinality=ONE | — |
| PLN-OBJ-HOMEROOM-COORDINATION.PLN-HOMEROOM-F-ID; version=PLN-HOMEROOM-F-OUTPUT-VERSION; cardinality=ONE | — |
| APP-OBJ-TODO.APP-TODO-F-ID; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ONE | — |
| APP-OBJ-TODO.APP-TODO-F-STUDENT-REF; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ONE | — |

### 执行步骤

| 顺序 | Action ID | 条件 | providedInputs |
| --- | --- | --- | --- |
| 1 | SCO-ACT-READ-GRADEBOOK | the score view resolves exact PUB, INS, and PLN source versions | [] |
| 2 | INS-ACT-READ-CONFIRMED-EVIDENCE | the authorized evidence version is current | [] |
| 3 | PLN-ACT-VIEW-HOMEROOM-COORDINATION | the coordination output remains read-only and version-pinned | [] |
| 4 | APP-ACT-REFRESH-TODOS | student todo links refresh without copying source task content | [] |
| 5 | STU-ACT-BUILD-PROFILE | the profile materializes only query, column, saved-view, and source-lineage definitions | [] |

### 执行路径

| 路径 | 语义角色 | 步骤 | 路由 | providedInputs | 源绑定 | 路径幂等键 |
| --- | --- | --- | --- | --- | --- | --- |

### 数据输出

| 对象字段 | 语义 |
| --- | --- |
| APP-OBJ-TODO.APP-TODO-F-AGGREGATION-VERSION; version=APP-TODO-F-AGGREGATION-VERSION | — |
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
| {"identityFieldIds":["SCO-VIEW-F-ID","INS-EVIDENCE-F-ID","PLN-PLAN-F-ID","PLN-HOMEROOM-F-ID","APP-TODO-F-ID"],"versionFieldIds":["SCO-VIEW-F-VIEW-VERSION","INS-EVIDENCE-F-EVIDENCE-VERSION","PLN-PLAN-F-PLAN-VERSION","PLN-HOMEROOM-F-OUTPUT-VERSION","APP-TODO-F-AGGREGATION-VERSION"],"fanoutFieldId":"APP-TODO-F-STUDENT-REF"} | STUDENT_PROFILE_SOURCE_AND_PROJECTION_OBJECT | {"strategy":"REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_PROFILE_OBJECTS","maxAttempts":3,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT","AUDIT_FAILED"]} | {"strategy":"KEEP_PRIOR_PROFILE_AND_TODO_VIEW_VERSIONS","description":"a failed aggregation preserves the prior view definitions and retries only stale or failed student objects"} | {"strategy":"INVALIDATE_ONLY_STALE_PROFILE_AND_TODO_PROJECTIONS","targets":["gradebook view definition","student profile view definition","student todo aggregation"]} |

## DF-011 Versioned Learning Facts to Cross-term Learning Path

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | LEARNING_PATH_AGGREGATION | PUB-001 / INS-001 / CORR-001 / APP-001 / GRD-001 / LPATH-001 | "ACTION_CHOICE_REQUIRED" | STUDENT_SOURCE_FACT_VERSION | {"strategy":"REFRESH_SELECTED_SOURCE_VERSION_AND_RETRY_FAILED_PATH_OBJECTS","maxAttempts":4,"retryableFailureResults":["SOURCE_VERSION_STALE","VERSION_CONFLICT"]} | {"strategy":"KEEP_ACCEPTED_SOURCE_FACT_AND_RETRY_ONLY_FAILED_DERIVED_OBJECTS","description":"a learning-path failure never rewrites evidence and never removes an accepted timeline entry"} | {"strategy":"SUPERSEDE_OR_MARK_STALE_BY_SOURCE_VERSION","targets":["learning path interpretation version","authorized path read model"]} |

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

## DF-013 Student Plan Execution to Report Snapshot and In-product Delivery

| 阶段 | 合同 Profile | 参与模块 | 路由策略 | 失败粒度 | 重试策略 | 补偿 | 下游失效 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | REPORT_MATERIALIZATION | APP-001 / PLN-001 / RPT-001 / NOTI-001 | "ACTION_CHOICE_REQUIRED" | REPORT_RUN_SNAPSHOT_DELIVERY_AND_NOTIFICATION_OBJECT | {"strategy":"RECHECK_PERMISSION_REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_OUTPUTS","maxAttempts":4,"retryableFailureResults":["SOURCE_VERSION_STALE","DELIVERY_FAILED","VERSION_CONFLICT"]} | {"strategy":"KEEP_SOURCE_EXECUTION_RUN_AND_SNAPSHOT_WHILE_RETRYING_DELIVERY_ONLY","description":"delivery or notification failure never rolls back student execution, plan, successful run, or immutable snapshot"} | {"strategy":"CREATE_A_NEW_RUN_FOR_NEW_SOURCE_VERSIONS","targets":["future report run","future report snapshot","in-product delivery retry"]} |

### 数据输入

| 对象字段 | 语义 |
| --- | --- |
| RPT-OBJ-DEFINITION.RPT-DEFINITION-F-ID; version=RPT-DEFINITION-F-VERSION; cardinality=ONE; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| RPT-OBJ-DEFINITION.RPT-DEFINITION-F-VERSION; version=RPT-DEFINITION-F-VERSION; cardinality=ONE; role=SOURCE_VERSION | SOURCE_VERSION |
| APP-OBJ-TODO.APP-TODO-F-ID; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ONE; role=SOURCE_IDENTITY | SOURCE_IDENTITY |
| APP-OBJ-TODO.APP-TODO-F-STUDENT-REF; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ONE; role=SOURCE_FANOUT | SOURCE_FANOUT |
| APP-OBJ-TODO.APP-TODO-F-SOURCE-PLAN-REF; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ONE; role=SOURCE_PAYLOAD | SOURCE_PAYLOAD |
| APP-OBJ-TODO.APP-TODO-F-SOURCE-PLAN-VERSION; version=APP-TODO-F-AGGREGATION-VERSION; cardinality=ONE; role=SOURCE_PAYLOAD | SOURCE_PAYLOAD |
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
