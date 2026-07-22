交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。

# PROG-001 Phase-two Minimum Learning Progress Web/App 页面合同 v2.0

| 属性 | 值 |
| --- | --- |
| 模块 | PROG-001 |
| 阶段 | 2 |
| 交付状态 | PLANNED |
| 页面数量 | 1 |
| 端原则 | 同一事实与权限合同，按端任务频率和复杂度差异化 |

## PROG-PAGE-STUDENT-CURRENT-TARGET Student Minimum Progress and Next Target Choice

| 交付可用性 | 适用端 | 对象 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- |
| PLANNED | WEB / APP | PROG-OBJ-STUDENT-TARGET / PROG-OBJ-NEXT-TARGET-CHOICE | CURRENT_CONTEXT / PRIMARY_TASK / SOURCE_AND_GATE_STATUS / NEXT_ACTION | LOADING / READY / EMPTY / ERROR / FORBIDDEN / STALE_VERSION / PROCESSING / BLOCKED / RECALLED / LOW_BANDWIDTH |

### 页面任务

- 进入页面时先校验学校、身份、学期、职责和对象范围；失败进入 FORBIDDEN 或 CONTEXT_EXPIRED。
- 页面只编排本合同列出的 Action；控件隐藏不能替代服务端 DENY。
- 提交前展示输入字段、目标对象、当前版本、状态效果、失败码和审计级别。
- 版本冲突、源版本过期、部分成功和 AI 不可用必须使用不同结果态。

### 字段与控件语义

| Object ID | Field ID | 字段 | 类型 | 必填 | 值来源 / Option Set | 可变性 | 可见性 | 校验 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-ID | Student Current Target ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-STUDENT-REF | Student | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-SNAPSHOT-REF | Pinned Course Target Snapshot | ID | 是 | OBJECT_REF: PROG-OBJ-COURSE-TARGET-SNAPSHOT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-SNAPSHOT-VERSION | Pinned Course Target Snapshot Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-CORE-ENTITLEMENT-REF | Pinned Active School Phase-two Core Entitlement | ID | 是 | OBJECT_REF: PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-CORE-ENTITLEMENT-VERSION | Pinned Active School Phase-two Core Entitlement Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-STATUS | Current Target Status | STRING | 是 | OPTION_SET: OPT-P2-PROG-TARGET-STATUS | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-COMPLETION-EVIDENCE-REF | Current Target Completion Evidence | ID | 否 | OBJECT_REF: PUB-OBJ-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-COMPLETION-EVIDENCE-VERSION | Current Target Completion Evidence Version | INTEGER | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-STATUS-AT | Current Target Status Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-VERSION | Student Current Target Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-ID | Next Target Choice ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-STUDENT-REF | Choosing Student | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-CURRENT-TARGET-REF | Pinned Completed Current Target | ID | 是 | OBJECT_REF: PROG-OBJ-STUDENT-TARGET | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-CURRENT-TARGET-VERSION | Pinned Completed Current Target Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-COMPLETION-EVIDENCE-REF | Pinned Current Target Completion Evidence | ID | 是 | OBJECT_REF: PUB-OBJ-RESULT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-COMPLETION-EVIDENCE-VERSION | Pinned Completion Evidence Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-NEXT-SNAPSHOT-REF | Pinned Next Allowed Target Snapshot | ID | 是 | OBJECT_REF: PROG-OBJ-COURSE-TARGET-SNAPSHOT | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-NEXT-SNAPSHOT-VERSION | Pinned Next Allowed Target Snapshot Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-STUDENT-CHOICE | Student Next Target Choice | STRING | 否 | OPTION_SET: OPT-P2-PROG-STUDENT-CHOICE | EDITABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-PROPOSED-AT | Next Target Proposed Time | DATETIME | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-CHOSEN-AT | Next Target Choice Time | DATETIME | 否 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-STATUS | Next Target Choice Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |
| PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-VERSION | Next Target Choice Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | must match the declared data type and the current authorized object scope |

### 动作与反馈

| Action ID | 动作 | 操作 | 输入 | 输出 | 状态效果 | ALLOW | DENY | 风险 / 审计 | 失败反馈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PROG-ACT-VIEW-CURRENT-TARGET | View Current Grade Course Unit Target and Next Allowed Target | READ | PROG-TARGET-F-STUDENT-REF | PROG-TARGET-F-STUDENT-REF<br>PROG-TARGET-F-SNAPSHOT-REF<br>PROG-TARGET-F-SNAPSHOT-VERSION<br>PROG-TARGET-F-STATUS<br>PROG-TARGET-F-COMPLETION-EVIDENCE-REF<br>PROG-TARGET-F-COMPLETION-EVIDENCE-VERSION<br>PROG-TARGET-F-STATUS-AT<br>PROG-TARGET-F-VERSION | UNCHANGED | ROLE-STUDENT | ROLE-SCHOOL-ADMIN / ROLE-PLATFORM-OPS | READ / NOT_REQUIRED | PERMISSION_DENIED / NOT_FOUND |
| PROG-ACT-SELECT-NEXT-TARGET | Student Selects the Proposed Next Learning Target | UPDATE | PROG-CHOICE-F-STUDENT-CHOICE | PROG-CHOICE-F-STUDENT-CHOICE<br>PROG-CHOICE-F-CHOSEN-AT<br>PROG-CHOICE-F-STATUS<br>PROG-CHOICE-F-VERSION | PROPOSED → SELECTED | ROLE-STUDENT | AI / DUTY-SUBJECT-TEACHER | LOW / REQUIRED | PERMISSION_DENIED / CHOICE_REQUIRED / SOURCE_VERSION_STALE / VERSION_CONFLICT |
| PROG-ACT-DEFER-NEXT-TARGET | Student Defers the Proposed Next Learning Target | UPDATE | PROG-CHOICE-F-STUDENT-CHOICE | PROG-CHOICE-F-STUDENT-CHOICE<br>PROG-CHOICE-F-CHOSEN-AT<br>PROG-CHOICE-F-STATUS<br>PROG-CHOICE-F-VERSION | PROPOSED → DEFERRED | ROLE-STUDENT | AI | LOW / REQUIRED | PERMISSION_DENIED / CHOICE_REQUIRED / SOURCE_VERSION_STALE / VERSION_CONFLICT |

### Web / App 差异

| 端 | 本页要求 |
| --- | --- |
| WEB | 支持本页登记的完整任务；批量、复杂表格和治理配置优先在 Web 呈现。 |
| APP | 支持本页登记的高频移动任务、摘要、提醒或必要确认；不要求复制未登记的 Web 复杂能力。 |
