交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。

# INS-001 Evidence and Mastery Interpretation Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | INS-001 |
| 阶段 | 3 |
| 交付状态 | PLANNED |
| 页面数量 | 4 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## INS-PAGE-EVIDENCE-REVIEW Evidence and Mastery Review

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | INS-OBJ-EVIDENCE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-ID | Evidence Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-STUDENT-REF | Evidence Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-SOURCE-DATA-ID | Evidence Source Data ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-SOURCE-RESULT-REF | Source Published Result Reference | ID | required for evidence derived from a published result；状态=CANDIDATE；动作=INS-ACT-CREATE-CANDIDATE | OBJECT_REF: PUB-OBJ-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-SOURCE-RESULT-VERSION | Source Published Result Version | INTEGER | required for evidence derived from a published result；状态=CANDIDATE；动作=INS-ACT-CREATE-CANDIDATE | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-SOURCE-CORRECTION-REF | Source Correction Attempt Reference | ID | required for correction-stage evidence；状态=CANDIDATE；动作=INS-ACT-CREATE-CANDIDATE | OBJECT_REF: CORR-OBJ-ATTEMPT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-SOURCE-CORRECTION-VERSION | Source Correction Version | INTEGER | required for correction-stage evidence；状态=CANDIDATE；动作=INS-ACT-CREATE-CANDIDATE | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-EVIDENCE-SOURCE | Evidence Source | STRING | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-STAGE | Evidence Stage | STRING | 是 | OPTION_SET: OPT-ENUM-008 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-KNOWLEDGE-POINT-REF | Knowledge Point Reference | ID | 是 | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-KNOWLEDGE-POINT-VERSION | Knowledge Point Version | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-RESULT | Answer Result | STRING | 是 | OPTION_SET: OPT-ENUM-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-ERROR-TYPE | Error Type | STRING | 是 | OPTION_SET: OPT-ENUM-010 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-WEIGHT | Evidence Weight | DECIMAL | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-VALIDITY | Evidence Validity | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-MASTERY-CANDIDATE | Mastery Interpretation Candidate | TEXT | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-MASTERY-INTERPRETATION | Teacher-confirmed Mastery Interpretation | TEXT | required when evidence reaches TEACHER_CONFIRMED；状态=TEACHER_CONFIRMED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-TEACHER-CONFIRMATION | Teacher Confirmation | STRING | required when evidence reaches TEACHER_CONFIRMED；状态=TEACHER_CONFIRMED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-STUDENT-VISIBLE-AT | Student Visible At | DATETIME | required when evidence reaches STUDENT_VISIBLE；状态=STUDENT_VISIBLE | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-INVALIDATION-REASON | Evidence Invalidation Reason | TEXT | required when evidence becomes stale；状态=STALE | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-PRIOR-EVIDENCE-REF | Prior Evidence Reference | ID | required when a new evidence version supersedes prior evidence；状态=CANDIDATE；动作=INS-ACT-CREATE-CANDIDATE | OBJECT_REF: INS-OBJ-EVIDENCE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-PRIOR-EVIDENCE-VERSION | Prior Evidence Version | INTEGER | required when a new evidence version supersedes prior evidence；状态=CANDIDATE；动作=INS-ACT-CREATE-CANDIDATE | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION | Mastery Interpretation Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-EVIDENCE-VERSION | Evidence Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INS-ACT-CONFIRM-MASTERY | Confirm the Evidence and Mastery Interpretation | UPDATE | INS-EVIDENCE-F-MASTERY-INTERPRETATION<br>INS-EVIDENCE-F-TEACHER-CONFIRMATION | INS-EVIDENCE-F-MASTERY-INTERPRETATION<br>INS-EVIDENCE-F-TEACHER-CONFIRMATION<br>INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION<br>INS-EVIDENCE-F-EVIDENCE-VERSION | CANDIDATE → TEACHER_CONFIRMED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS / AI | HIGH / REQUIRED | PERMISSION_DENIED / STALE_INPUT_VERSION / VERSION_CONFLICT / AUDIT_FAILED |
| INS-ACT-PUBLISH-INTERPRETATION | Publish the Teacher-confirmed Mastery Interpretation | UPDATE |  | INS-EVIDENCE-F-STUDENT-VISIBLE-AT<br>INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION<br>INS-EVIDENCE-F-EVIDENCE-VERSION | TEACHER_CONFIRMED → STUDENT_VISIBLE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS / AI | HIGH / REQUIRED | PERMISSION_DENIED / TEACHER_CONFIRMATION_REQUIRED / VERSION_CONFLICT / AUDIT_FAILED |
| INS-ACT-READ-CONFIRMED-EVIDENCE | Read Confirmed Evidence for Authorized Coordination | READ | INS-EVIDENCE-F-ID | INS-EVIDENCE-F-ID<br>INS-EVIDENCE-F-STUDENT-REF<br>INS-EVIDENCE-F-STAGE<br>INS-EVIDENCE-F-KNOWLEDGE-POINT-REF<br>INS-EVIDENCE-F-KNOWLEDGE-POINT-VERSION<br>INS-EVIDENCE-F-RESULT<br>INS-EVIDENCE-F-ERROR-TYPE<br>INS-EVIDENCE-F-WEIGHT<br>INS-EVIDENCE-F-VALIDITY<br>INS-EVIDENCE-F-TEACHER-CONFIRMATION<br>INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION<br>INS-EVIDENCE-F-EVIDENCE-VERSION | UNCHANGED | DUTY-SUBJECT-TEACHER / DUTY-HOMEROOM | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## INS-PAGE-STUDENT-MASTERY Student Mastery Interpretation

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | INS-OBJ-EVIDENCE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-STUDENT-REF | Evidence Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-RESULT | Answer Result | STRING | 是 | OPTION_SET: OPT-ENUM-009 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-MASTERY-INTERPRETATION | Teacher-confirmed Mastery Interpretation | TEXT | required when evidence reaches TEACHER_CONFIRMED；状态=TEACHER_CONFIRMED | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-EVIDENCE | INS-EVIDENCE-F-STUDENT-VISIBLE-AT | Student Visible At | DATETIME | required when evidence reaches STUDENT_VISIBLE；状态=STUDENT_VISIBLE | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INS-ACT-VIEW-MASTERY | View My Teacher-confirmed Mastery Interpretation | READ | INS-EVIDENCE-F-STUDENT-REF | INS-EVIDENCE-F-STUDENT-REF<br>INS-EVIDENCE-F-RESULT<br>INS-EVIDENCE-F-MASTERY-INTERPRETATION<br>INS-EVIDENCE-F-STUDENT-VISIBLE-AT | UNCHANGED | ROLE-STUDENT | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND / NOT_TEACHER_CONFIRMED / NOT_YET_VISIBLE |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## INS-PAGE-PERSONAL-PROGRESS Node-level Personal Progress

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | INS-OBJ-MASTERY-NODE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INS-OBJ-MASTERY-NODE | INS-MASTERY-F-ID | Mastery Node State ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-NODE | INS-MASTERY-F-STUDENT-REF | Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-NODE | INS-MASTERY-F-SUBJECT | Subject | ID | 是 | OPTION_SET: OPT-COM-007 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-NODE | INS-MASTERY-F-CAPABILITY-NODE-REF | Stable Capability Node Reference | ID | 是 | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-NODE | INS-MASTERY-F-CAPABILITY-NODE-VERSION | Stable Capability Node Version | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-NODE | INS-MASTERY-F-STATUS | Node-level Mastery Status | STRING | 是 | OPTION_SET: OPT-PH3-001 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-NODE | INS-MASTERY-F-LEARNING-PACE | Student-controlled Learning Pace | STRING | 是 | OPTION_SET: OPT-PH3-002 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-NODE | INS-MASTERY-F-EVIDENCE-REFS | Current Evidence References | JSON | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-NODE | INS-MASTERY-F-SOURCE-REASON | Status Change Source and Reason | TEXT | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-NODE | INS-MASTERY-F-EFFECTIVE-AT | Status Effective Time | DATETIME | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-NODE | INS-MASTERY-F-VERSION | Mastery Node State Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INS-ACT-INITIALIZE-PERSONAL-NODE | Initialize My Personal Capability Node | CREATE | INS-MASTERY-F-SUBJECT<br>INS-MASTERY-F-CAPABILITY-NODE-REF<br>INS-MASTERY-F-CAPABILITY-NODE-VERSION | INS-MASTERY-F-ID<br>INS-MASTERY-F-STUDENT-REF<br>INS-MASTERY-F-STATUS<br>INS-MASTERY-F-LEARNING-PACE<br>INS-MASTERY-F-EVIDENCE-REFS<br>INS-MASTERY-F-SOURCE-REASON<br>INS-MASTERY-F-EFFECTIVE-AT<br>INS-MASTERY-F-VERSION | CREATE | ROLE-STUDENT | AI / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| INS-ACT-START-PERSONAL-NODE | Start or Continue My Personal Capability Node | UPDATE |  | INS-MASTERY-F-STATUS<br>INS-MASTERY-F-SOURCE-REASON<br>INS-MASTERY-F-EFFECTIVE-AT<br>INS-MASTERY-F-VERSION | NOT_STARTED / REVIEW_REQUIRED → LEARNING | ROLE-STUDENT | AI / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| INS-ACT-CONTROL-PERSONAL-PACE | Pause Review or Resume My Personal Learning | UPDATE | INS-MASTERY-F-LEARNING-PACE | INS-MASTERY-F-LEARNING-PACE<br>INS-MASTERY-F-SOURCE-REASON<br>INS-MASTERY-F-EFFECTIVE-AT<br>INS-MASTERY-F-VERSION | LEARNING → LEARNING | ROLE-STUDENT | AI / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| INS-ACT-REQUEST-MASTERY-VALIDATION | Request Independent Validation for My Capability Node | UPDATE |  | INS-MASTERY-F-STATUS<br>INS-MASTERY-F-SOURCE-REASON<br>INS-MASTERY-F-EFFECTIVE-AT<br>INS-MASTERY-F-VERSION | LEARNING → PENDING_VALIDATION | ROLE-STUDENT | AI / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| INS-ACT-VIEW-PERSONAL-PROGRESS | View Authorized Node-level Personal Progress | READ | INS-MASTERY-F-STUDENT-REF | INS-MASTERY-F-ID<br>INS-MASTERY-F-STUDENT-REF<br>INS-MASTERY-F-SUBJECT<br>INS-MASTERY-F-CAPABILITY-NODE-REF<br>INS-MASTERY-F-CAPABILITY-NODE-VERSION<br>INS-MASTERY-F-STATUS<br>INS-MASTERY-F-LEARNING-PACE<br>INS-MASTERY-F-EVIDENCE-REFS<br>INS-MASTERY-F-SOURCE-REASON<br>INS-MASTERY-F-EFFECTIVE-AT<br>INS-MASTERY-F-VERSION | UNCHANGED | ROLE-STUDENT / DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |

## INS-PAGE-MASTERY-CHALLENGES Mastery Judgment Challenges

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | INS-OBJ-MASTERY-CHALLENGE | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-ID | Mastery Challenge ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-MASTERY-REF | Challenged Mastery Node Reference | ID | 是 | OBJECT_REF: INS-OBJ-MASTERY-NODE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-MASTERY-VERSION | Challenged Mastery Node Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-STUDENT-REF | Challenging Student Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-REASON | Challenge Reason | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-RESPONSE | Subject Teacher Response | TEXT | 否 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-CREATED-AT | Challenge Created At | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-RESOLVED-AT | Challenge Resolved At | DATETIME | 否 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-VERSION | Mastery Challenge Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INS-ACT-OPEN-MASTERY-CHALLENGE | Challenge a Mastery Judgment without Rewriting It | CREATE | INS-CHALLENGE-F-MASTERY-REF<br>INS-CHALLENGE-F-MASTERY-VERSION<br>INS-CHALLENGE-F-REASON | INS-CHALLENGE-F-ID<br>INS-CHALLENGE-F-STUDENT-REF<br>INS-CHALLENGE-F-CREATED-AT<br>INS-CHALLENGE-F-VERSION | CREATE | ROLE-STUDENT | AI / ROLE-PLATFORM-OPS | LOW / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| INS-ACT-RESOLVE-MASTERY-CHALLENGE | Resolve a Mastery Challenge with Professional Evidence | UPDATE | INS-CHALLENGE-F-RESPONSE | INS-CHALLENGE-F-RESPONSE<br>INS-CHALLENGE-F-RESOLVED-AT<br>INS-CHALLENGE-F-VERSION | OPEN → RESOLVED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | HIGH / REQUIRED | AUDIT_FAILED |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
