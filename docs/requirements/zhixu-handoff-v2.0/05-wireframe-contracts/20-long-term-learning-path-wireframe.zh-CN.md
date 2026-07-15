# LPATH-001 Cross-term Learning Path Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | LPATH-001 |
| 阶段 | 1 |
| 页面数量 | 1 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## LPATH-PAGE-PATH Cross-term Learning Path and Interpretation Review

| 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- |
| WEB / APP | LPATH-OBJ-TIMELINE-ENTRY / LPATH-OBJ-INTERPRETATION | CONTEXT_HEADER / TASK_WORK_AREA / RESULT_AND_FAILURE_STATUS | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-ID | Learning Timeline Entry ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-STUDENT-REF | Learning Path Student | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-TERM-ID | Timeline Entry Term | ID | 是 | OPTION_SET: OPT-COM-003 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-EVENT-TYPE | Learning Path Event Type | STRING | 是 | OPTION_SET: OPT-ENUM-013 | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-PUBLISHED-RESULT-REF | PUBLISHED-RESULT Source Reference | ID | 否 | OBJECT_REF: PUB-OBJ-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-PUBLISHED-RESULT-VERSION | PUBLISHED-RESULT Source Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-EVIDENCE-REF | EVIDENCE Source Reference | ID | 否 | OBJECT_REF: INS-OBJ-EVIDENCE | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-EVIDENCE-VERSION | EVIDENCE Source Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-CORRECTION-REF | CORRECTION Source Reference | ID | 否 | OBJECT_REF: CORR-OBJ-ATTEMPT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-CORRECTION-VERSION | CORRECTION Source Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-PLAN-EXECUTION-REF | PLAN-EXECUTION Source Reference | ID | 否 | OBJECT_REF: APP-OBJ-TODO | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-PLAN-EXECUTION-VERSION | PLAN-EXECUTION Source Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-TEACHER-CONFIRMATION-REF | TEACHER-CONFIRMATION Source Reference | ID | 否 | OBJECT_REF: GRD-OBJ-DECISION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-TEACHER-CONFIRMATION-VERSION | TEACHER-CONFIRMATION Source Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-RECORDED-AT | Timeline Entry Recorded At | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-VERSION | Learning Timeline Entry Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-ID | Learning Path Interpretation ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-SUBJECT | Interpretation Subject | ID | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-REF | Interpretation Knowledge Point | ID | 否 | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-VERSION | Interpretation Knowledge Point Version | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-EVIDENCE-REFS | Versioned Evidence References | JSON | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must contain one or more evidence ID and version pairs |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-EXPLANATION | Teacher-confirmed Explanation | TEXT | required after corresponding subject-teacher confirmation；状态=TEACHER_CONFIRMED/STUDENT_VISIBLE；动作=LPATH-ACT-CONFIRM-INTERPRETATION | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-CONFIDENCE | Explanation Confidence | DECIMAL | required after corresponding subject-teacher confirmation；状态=TEACHER_CONFIRMED/STUDENT_VISIBLE；动作=LPATH-ACT-CONFIRM-INTERPRETATION | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-LIMITATIONS | Explanation Limitations | TEXT | required after corresponding subject-teacher confirmation；状态=TEACHER_CONFIRMED/STUDENT_VISIBLE；动作=LPATH-ACT-CONFIRM-INTERPRETATION | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-TEACHER-CONFIRMER | Corresponding Subject Teacher Confirmer | ID | required after corresponding subject-teacher confirmation；状态=TEACHER_CONFIRMED/STUDENT_VISIBLE；动作=LPATH-ACT-CONFIRM-INTERPRETATION | OBJECT_REF: ORG-OBJ-TEACHER | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-VISIBLE-FROM | Student Visible From | DATETIME | required when the interpretation becomes student visible；状态=STUDENT_VISIBLE；动作=LPATH-ACT-PUBLISH-INTERPRETATION | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-SUPERSEDED-BY-REF | Superseding Interpretation Reference | ID | required when a prior interpretation is superseded；状态=SUPERSEDED；动作=LPATH-ACT-SUPERSEDE-INTERPRETATION | OBJECT_REF: LPATH-OBJ-INTERPRETATION | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-SUPERSEDED-BY-VERSION | Superseding Interpretation Version | INTEGER | required when a prior interpretation is superseded；状态=SUPERSEDED；动作=LPATH-ACT-SUPERSEDE-INTERPRETATION | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-STALE-REASON | Interpretation Stale Reason | TEXT | required when a source version makes the interpretation stale；状态=STALE；动作=LPATH-ACT-MARK-INTERPRETATION-STALE | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |
| LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-VERSION | Learning Path Interpretation Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LPATH-ACT-CONFIRM-INTERPRETATION | Confirm a Subject Learning Path Interpretation | UPDATE | LPATH-INTERPRETATION-F-SUBJECT<br>LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-REF<br>LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-VERSION<br>LPATH-INTERPRETATION-F-EVIDENCE-REFS<br>LPATH-INTERPRETATION-F-EXPLANATION<br>LPATH-INTERPRETATION-F-CONFIDENCE<br>LPATH-INTERPRETATION-F-LIMITATIONS<br>LPATH-INTERPRETATION-F-TEACHER-CONFIRMER | LPATH-INTERPRETATION-F-EXPLANATION<br>LPATH-INTERPRETATION-F-CONFIDENCE<br>LPATH-INTERPRETATION-F-LIMITATIONS<br>LPATH-INTERPRETATION-F-TEACHER-CONFIRMER<br>LPATH-INTERPRETATION-F-VERSION | CANDIDATE → TEACHER_CONFIRMED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / AI / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| LPATH-ACT-SUPERSEDE-INTERPRETATION | Supersede a Learning Path Interpretation Version | UPDATE | LPATH-INTERPRETATION-F-SUPERSEDED-BY-REF<br>LPATH-INTERPRETATION-F-SUPERSEDED-BY-VERSION | LPATH-INTERPRETATION-F-SUPERSEDED-BY-REF<br>LPATH-INTERPRETATION-F-SUPERSEDED-BY-VERSION<br>LPATH-INTERPRETATION-F-VERSION | TEACHER_CONFIRMED / STUDENT_VISIBLE → SUPERSEDED | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / AI / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| LPATH-ACT-PUBLISH-INTERPRETATION | Publish a Teacher-confirmed Learning Path Interpretation | UPDATE | LPATH-INTERPRETATION-F-VISIBLE-FROM | LPATH-INTERPRETATION-F-VISIBLE-FROM<br>LPATH-INTERPRETATION-F-VERSION | TEACHER_CONFIRMED → STUDENT_VISIBLE | DUTY-SUBJECT-TEACHER | DUTY-HOMEROOM / AI / ROLE-PLATFORM-OPS | HIGH / REQUIRED | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT / AUDIT_FAILED |
| LPATH-ACT-VIEW-PATH | View the Authorized Cross-term Learning Path | READ | LPATH-ENTRY-F-STUDENT-REF | LPATH-ENTRY-F-ID<br>LPATH-ENTRY-F-STUDENT-REF<br>LPATH-ENTRY-F-TERM-ID<br>LPATH-ENTRY-F-EVENT-TYPE<br>LPATH-ENTRY-F-PUBLISHED-RESULT-REF<br>LPATH-ENTRY-F-PUBLISHED-RESULT-VERSION<br>LPATH-ENTRY-F-EVIDENCE-REF<br>LPATH-ENTRY-F-EVIDENCE-VERSION<br>LPATH-ENTRY-F-CORRECTION-REF<br>LPATH-ENTRY-F-CORRECTION-VERSION<br>LPATH-ENTRY-F-PLAN-EXECUTION-REF<br>LPATH-ENTRY-F-PLAN-EXECUTION-VERSION<br>LPATH-ENTRY-F-TEACHER-CONFIRMATION-REF<br>LPATH-ENTRY-F-TEACHER-CONFIRMATION-VERSION<br>LPATH-ENTRY-F-RECORDED-AT<br>LPATH-ENTRY-F-VERSION | UNCHANGED | DUTY-SUBJECT-TEACHER / DUTY-HOMEROOM | ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
