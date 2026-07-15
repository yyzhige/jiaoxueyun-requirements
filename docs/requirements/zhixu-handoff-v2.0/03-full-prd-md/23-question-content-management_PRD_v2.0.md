# CONTENT-001 Versioned Question and Content Governance PRD v2.0

| 属性 | 值 |
| --- | --- |
| 阶段 | 1 |
| 优先级 | P0 |
| 目标 | Keep question answers analyses knowledge mappings licensing permissions and availability version-complete |
| 基线决策 | `BASE-003`、`BASE-007` |
| NFR | `NFR-006`、`NFR-008` |
| 进入条件 | the subject lead has an authorized subject content-governance context |
| 退出条件 | published content is traceable to active licensing and permission facts |

## 1. 范围与事实边界

- 本模块权威拥有 3 个对象、8 个动作。
- 模块外对象只能以 Object ID、Field ID 和显式源版本引用，不能复制第二套业务事实。
- 页面可见性不是权限边界；每次执行必须按 Action 合同重新判断 ALLOW、DENY、状态和源版本。
- AI 只能查询、分析、生成临时草稿或发起受控动作；不能跳过正式 Action、确认者和审计。

## 2. 权威对象与字段合同

### CONTENT-OBJ-QUESTION-VERSION Question Version

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VERSIONED_TEACHING_CONTENT | SCHOOL | DUTY-SUBJECT-LEAD | DUTY-SUBJECT-LEAD | DUTY-SUBJECT-LEAD | ROLE-ACADEMIC | LIFE-003 | S2 | AUTHORIZED | DRAFT / PUBLISHED |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CONTENT-QUESTION-F-ID | Question Version ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-SCHOOL-ID | Content School | ID | 是 | OPTION_SET: OPT-COM-002 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-SUBJECT-ID | Content Subject | ID | 是 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-COURSE-ID | Content Course | ID | 是 | OPTION_SET: OPT-COM-008 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-STEM | Question Stem | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-ANSWER | Question Answer | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-ANALYSIS | Question Analysis | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-KNOWLEDGE-MAPPINGS | Knowledge Point Mappings | JSON | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-VERSION | Question Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-AVAILABILITY | Question Availability | STRING | 是 | OPTION_SET: OPT-EXT-003 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-LICENSE-REF | Pinned Content License | ID | 是 | OBJECT_REF: CONTENT-OBJ-LICENSE | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-LICENSE-VERSION | Pinned Content License Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-PERMISSION-REF | Pinned Content Permission | ID | 是 | OBJECT_REF: CONTENT-OBJ-PERMISSION | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-QUESTION-F-PERMISSION-VERSION | Pinned Content Permission Version | INTEGER | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |

### CONTENT-OBJ-LICENSE Content License Record

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VERSIONED_TEACHING_CONTENT | SCHOOL | DUTY-SUBJECT-LEAD | DUTY-SUBJECT-LEAD | DUTY-SUBJECT-LEAD | ROLE-ACADEMIC | LIFE-003 | S2 | AUTHORIZED | DRAFT / ACTIVE |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CONTENT-LICENSE-F-ID | Content License Record ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-LICENSE-F-RIGHTSHOLDER | Content Rightsholder | STRING | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-LICENSE-F-TERMS | Content License Terms | TEXT | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-LICENSE-F-STATUS | Content License Status | STRING | 是 | OPTION_SET: OPT-EXT-011 | SYSTEM_MANAGED | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-LICENSE-F-VERSION | Content License Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |

### CONTENT-OBJ-PERMISSION Content Permission Grant

| 数据主体 | 控制主体 | 产生者 | Owner | 确认者 | Steward | 生命周期 | 敏感级别 | 读模式 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VERSIONED_TEACHING_CONTENT | SCHOOL | DUTY-SUBJECT-LEAD | DUTY-SUBJECT-LEAD | DUTY-SUBJECT-LEAD | ROLE-ACADEMIC | LIFE-003 | S3 | AUTHORIZED | DRAFT / ACTIVE |

| Field ID | 字段 | 类型 | 必填 | 值来源 | 可变性 | 可见性 | 幂等角色 | 校验 | 历史策略 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CONTENT-PERMISSION-F-ID | Content Permission Grant ID | ID | 是 | SYSTEM | IMMUTABLE | AUTHORIZED_SCOPE | OBJECT_ID | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-PERMISSION-F-SCOPE | Content Permission Scope | STRING | 是 | OPTION_SET: OPT-EXT-010 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-PERMISSION-F-SCHOOL-ID | Authorized School | ID | 否 | OPTION_SET: OPT-COM-002 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-PERMISSION-F-SUBJECT-ID | Authorized Subject | ID | 否 | OPTION_SET: OPT-COM-007 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-PERMISSION-F-COURSE-ID | Authorized Course | ID | 否 | OPTION_SET: OPT-COM-008 | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-PERMISSION-F-GRANTEE-ID | Permission Grantee | ID | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-PERMISSION-F-EFFECTIVE-AT | Permission Effective Time | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-PERMISSION-F-EXPIRES-AT | Permission Expiry Time | DATETIME | 是 | USER_INPUT | EDITABLE | AUTHORIZED_SCOPE | — | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |
| CONTENT-PERMISSION-F-VERSION | Content Permission Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED | AUTHORIZED_SCOPE | OBJECT_VERSION | must match the declared task-specific data type and authorized school scope | retain the accepted value with actor, time, and version provenance |

## 3. 对象关系

| Relationship ID | 源对象 | 关系 | 目标对象 | 基数 | 所有权范围 | 源失效处理 |
| --- | --- | --- | --- | --- | --- | --- |
| CONTENT-REL-QUESTION-LICENSE | CONTENT-OBJ-QUESTION-VERSION | REQUIRES | CONTENT-OBJ-LICENSE | MANY_TO_ONE | SAME_SUBJECT | block publication and require a new pinned active license version |
| CONTENT-REL-QUESTION-PERMISSION | CONTENT-OBJ-QUESTION-VERSION | AUTHORIZED_BY | CONTENT-OBJ-PERMISSION | MANY_TO_ONE | SAME_SUBJECT | block publication and require a new pinned active permission version |

## 4. 可执行动作合同

| Action ID | 动作 | 目标对象 | 操作 | 输入 Field | 输出 Field | 状态效果 | ALLOW / DENY | 端 / 执行模式 | 风险 | 审计 | 幂等键 | 失败结果 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CONTENT-ACT-CREATE-QUESTION-VERSION | Create Question Version | CONTENT-OBJ-QUESTION-VERSION | CREATE | CONTENT-QUESTION-F-SCHOOL-ID<br>CONTENT-QUESTION-F-SUBJECT-ID<br>CONTENT-QUESTION-F-COURSE-ID<br>CONTENT-QUESTION-F-STEM<br>CONTENT-QUESTION-F-ANSWER<br>CONTENT-QUESTION-F-ANALYSIS<br>CONTENT-QUESTION-F-KNOWLEDGE-MAPPINGS<br>CONTENT-QUESTION-F-LICENSE-REF<br>CONTENT-QUESTION-F-PERMISSION-REF | CONTENT-QUESTION-F-ID<br>CONTENT-QUESTION-F-VERSION<br>CONTENT-QUESTION-F-AVAILABILITY<br>CONTENT-QUESTION-F-LICENSE-VERSION<br>CONTENT-QUESTION-F-PERMISSION-VERSION | CREATE（成功状态由 CONTENT-ACT-CREATE-QUESTION-VERSION-SCN-SUCCESS 定义） | ALLOW:DUTY-SUBJECT-LEAD — the subject lead acts inside the assigned subject content-governance scope<br>DENY:ROLE-STUDENT — ROLE-STUDENT is outside the task-specific owner and authorized object scope<br>DENY:ROLE-PLATFORM-OPS — ROLE-PLATFORM-OPS is outside the task-specific owner and authorized object scope | WEB / APP | LOW | REQUIRED | CONTENT-ACT-CREATE-QUESTION-VERSION:school:object-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CONTENT-ACT-PUBLISH-QUESTION-VERSION | Publish Question Version | CONTENT-OBJ-QUESTION-VERSION | UPDATE | CONTENT-QUESTION-F-LICENSE-REF<br>CONTENT-QUESTION-F-LICENSE-VERSION<br>CONTENT-QUESTION-F-PERMISSION-REF<br>CONTENT-QUESTION-F-PERMISSION-VERSION | CONTENT-QUESTION-F-VERSION<br>CONTENT-QUESTION-F-AVAILABILITY | DRAFT → PUBLISHED | ALLOW:DUTY-SUBJECT-LEAD — the subject lead acts inside the assigned subject content-governance scope<br>DENY:ROLE-STUDENT — ROLE-STUDENT is outside the task-specific owner and authorized object scope<br>DENY:ROLE-PLATFORM-OPS — ROLE-PLATFORM-OPS is outside the task-specific owner and authorized object scope | WEB / APP | LOW | REQUIRED | CONTENT-ACT-PUBLISH-QUESTION-VERSION:school:object-version:request-id | PERMISSION_DENIED / LICENSE_INACTIVE / CONTENT_PERMISSION_INACTIVE / SOURCE_VERSION_STALE / VERSION_CONFLICT |
| CONTENT-ACT-CREATE-LICENSE | Create Content License Record | CONTENT-OBJ-LICENSE | CREATE | CONTENT-LICENSE-F-RIGHTSHOLDER<br>CONTENT-LICENSE-F-TERMS | CONTENT-LICENSE-F-ID<br>CONTENT-LICENSE-F-STATUS<br>CONTENT-LICENSE-F-VERSION | CREATE（成功状态由 CONTENT-ACT-CREATE-LICENSE-SCN-SUCCESS 定义） | ALLOW:DUTY-SUBJECT-LEAD — the subject lead acts inside the assigned subject content-governance scope<br>DENY:ROLE-STUDENT — ROLE-STUDENT is outside the task-specific owner and authorized object scope<br>DENY:ROLE-PLATFORM-OPS — ROLE-PLATFORM-OPS is outside the task-specific owner and authorized object scope | WEB / APP | LOW | REQUIRED | CONTENT-ACT-CREATE-LICENSE:school:object-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CONTENT-ACT-ACTIVATE-LICENSE | Activate Content License | CONTENT-OBJ-LICENSE | UPDATE |  | CONTENT-LICENSE-F-STATUS<br>CONTENT-LICENSE-F-VERSION | DRAFT → ACTIVE | ALLOW:DUTY-SUBJECT-LEAD — the subject lead acts inside the assigned subject content-governance scope<br>DENY:ROLE-STUDENT — ROLE-STUDENT is outside the task-specific owner and authorized object scope<br>DENY:ROLE-PLATFORM-OPS — ROLE-PLATFORM-OPS is outside the task-specific owner and authorized object scope | WEB / APP | LOW | REQUIRED | CONTENT-ACT-ACTIVATE-LICENSE:school:object-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CONTENT-ACT-CREATE-SCHOOL-PERMISSION | Create School Content Permission Grant | CONTENT-OBJ-PERMISSION | CREATE | CONTENT-PERMISSION-F-SCOPE<br>CONTENT-PERMISSION-F-SCHOOL-ID<br>CONTENT-PERMISSION-F-GRANTEE-ID<br>CONTENT-PERMISSION-F-EFFECTIVE-AT<br>CONTENT-PERMISSION-F-EXPIRES-AT | CONTENT-PERMISSION-F-ID<br>CONTENT-PERMISSION-F-VERSION | CREATE（成功状态由 CONTENT-ACT-CREATE-SCHOOL-PERMISSION-SCN-SUCCESS 定义） | ALLOW:DUTY-SUBJECT-LEAD — the subject lead acts inside the assigned subject content-governance scope<br>DENY:ROLE-STUDENT — ROLE-STUDENT is outside the task-specific owner and authorized object scope<br>DENY:ROLE-PLATFORM-OPS — ROLE-PLATFORM-OPS is outside the task-specific owner and authorized object scope | WEB / APP | LOW | REQUIRED | CONTENT-ACT-CREATE-SCHOOL-PERMISSION:school:object-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CONTENT-ACT-CREATE-SUBJECT-PERMISSION | Create Subject Content Permission Grant | CONTENT-OBJ-PERMISSION | CREATE | CONTENT-PERMISSION-F-SCOPE<br>CONTENT-PERMISSION-F-SUBJECT-ID<br>CONTENT-PERMISSION-F-GRANTEE-ID<br>CONTENT-PERMISSION-F-EFFECTIVE-AT<br>CONTENT-PERMISSION-F-EXPIRES-AT | CONTENT-PERMISSION-F-ID<br>CONTENT-PERMISSION-F-VERSION | CREATE（成功状态由 CONTENT-ACT-CREATE-SUBJECT-PERMISSION-SCN-SUCCESS 定义） | ALLOW:DUTY-SUBJECT-LEAD — the subject lead acts inside the assigned subject content-governance scope<br>DENY:ROLE-STUDENT — ROLE-STUDENT is outside the task-specific owner and authorized object scope<br>DENY:ROLE-PLATFORM-OPS — ROLE-PLATFORM-OPS is outside the task-specific owner and authorized object scope | WEB / APP | LOW | REQUIRED | CONTENT-ACT-CREATE-SUBJECT-PERMISSION:school:object-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CONTENT-ACT-CREATE-COURSE-PERMISSION | Create Course Content Permission Grant | CONTENT-OBJ-PERMISSION | CREATE | CONTENT-PERMISSION-F-SCOPE<br>CONTENT-PERMISSION-F-COURSE-ID<br>CONTENT-PERMISSION-F-GRANTEE-ID<br>CONTENT-PERMISSION-F-EFFECTIVE-AT<br>CONTENT-PERMISSION-F-EXPIRES-AT | CONTENT-PERMISSION-F-ID<br>CONTENT-PERMISSION-F-VERSION | CREATE（成功状态由 CONTENT-ACT-CREATE-COURSE-PERMISSION-SCN-SUCCESS 定义） | ALLOW:DUTY-SUBJECT-LEAD — the subject lead acts inside the assigned subject content-governance scope<br>DENY:ROLE-STUDENT — ROLE-STUDENT is outside the task-specific owner and authorized object scope<br>DENY:ROLE-PLATFORM-OPS — ROLE-PLATFORM-OPS is outside the task-specific owner and authorized object scope | WEB / APP | LOW | REQUIRED | CONTENT-ACT-CREATE-COURSE-PERMISSION:school:object-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |
| CONTENT-ACT-ACTIVATE-PERMISSION | Activate Content Permission Grant | CONTENT-OBJ-PERMISSION | UPDATE |  | CONTENT-PERMISSION-F-VERSION | DRAFT → ACTIVE | ALLOW:DUTY-SUBJECT-LEAD — the subject lead acts inside the assigned subject content-governance scope<br>DENY:ROLE-STUDENT — ROLE-STUDENT is outside the task-specific owner and authorized object scope<br>DENY:ROLE-PLATFORM-OPS — ROLE-PLATFORM-OPS is outside the task-specific owner and authorized object scope | WEB / APP | LOW | REQUIRED | CONTENT-ACT-ACTIVATE-PERMISSION:school:object-version:request-id | PERMISSION_DENIED / VALIDATION_FAILED / VERSION_CONFLICT |

## 5. 业务失败因果语义

| Action ID | 失败码 | 因果谓词 | Given | When | Expected Data |
| --- | --- | --- | --- | --- | --- |
| CONTENT-ACT-PUBLISH-QUESTION-VERSION | LICENSE_INACTIVE | license.state !== ACTIVE \|\| license.version !== pinnedLicenseVersion | the question draft pins a license that is not ACTIVE or no longer matches the pinned license version | the subject lead requests publication of the question version | LICENSE_INACTIVE identifies the blocked license reference and preserves the question version in DRAFT |
| CONTENT-ACT-PUBLISH-QUESTION-VERSION | CONTENT_PERMISSION_INACTIVE | contentPermission.state !== ACTIVE \|\| currentTime >= contentPermission.expiresAt \|\| !contentPermission.covers(questionContext, currentActor) | the pinned content permission is inactive, expired, assigned to another grantee, or does not cover the question school, subject, and course context | the subject lead requests publication of the question version | CONTENT_PERMISSION_INACTIVE identifies the uncovered permission context and preserves the question version in DRAFT |

## 6. 状态可达性

| Object ID | 状态 | 进入动作 | 离开动作 |
| --- | --- | --- | --- |
| CONTENT-OBJ-QUESTION-VERSION | DRAFT | CONTENT-ACT-CREATE-QUESTION-VERSION | CONTENT-ACT-PUBLISH-QUESTION-VERSION |
| CONTENT-OBJ-QUESTION-VERSION | PUBLISHED | CONTENT-ACT-PUBLISH-QUESTION-VERSION |  |
| CONTENT-OBJ-LICENSE | DRAFT | CONTENT-ACT-CREATE-LICENSE | CONTENT-ACT-ACTIVATE-LICENSE |
| CONTENT-OBJ-LICENSE | ACTIVE | CONTENT-ACT-ACTIVATE-LICENSE |  |
| CONTENT-OBJ-PERMISSION | DRAFT | CONTENT-ACT-CREATE-SCHOOL-PERMISSION<br>CONTENT-ACT-CREATE-SUBJECT-PERMISSION<br>CONTENT-ACT-CREATE-COURSE-PERMISSION | CONTENT-ACT-ACTIVATE-PERMISSION |
| CONTENT-OBJ-PERMISSION | ACTIVE | CONTENT-ACT-ACTIVATE-PERMISSION |  |

## 7. 参与数据流

| Flow ID | 数据流 | 阶段 | 参与模块 | 本模块动作 | 失败与补偿 |
| --- | --- | --- | --- | --- | --- |

## 8. 页面任务合同

| Page ID | 页面 | 端 | 对象 | 字段 | 动作 | 区域 | 视图状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CONTENT-PAGE-GOVERNANCE | Question and Content Governance Workspace | WEB / APP | CONTENT-OBJ-QUESTION-VERSION<br>CONTENT-OBJ-LICENSE<br>CONTENT-OBJ-PERMISSION | CONTENT-QUESTION-F-ID<br>CONTENT-QUESTION-F-SCHOOL-ID<br>CONTENT-QUESTION-F-SUBJECT-ID<br>CONTENT-QUESTION-F-COURSE-ID<br>CONTENT-QUESTION-F-STEM<br>CONTENT-QUESTION-F-ANSWER<br>CONTENT-QUESTION-F-ANALYSIS<br>CONTENT-QUESTION-F-KNOWLEDGE-MAPPINGS<br>CONTENT-QUESTION-F-VERSION<br>CONTENT-QUESTION-F-AVAILABILITY<br>CONTENT-QUESTION-F-LICENSE-REF<br>CONTENT-QUESTION-F-LICENSE-VERSION<br>CONTENT-QUESTION-F-PERMISSION-REF<br>CONTENT-QUESTION-F-PERMISSION-VERSION<br>CONTENT-LICENSE-F-ID<br>CONTENT-LICENSE-F-RIGHTSHOLDER<br>CONTENT-LICENSE-F-TERMS<br>CONTENT-LICENSE-F-STATUS<br>CONTENT-LICENSE-F-VERSION<br>CONTENT-PERMISSION-F-ID<br>CONTENT-PERMISSION-F-SCOPE<br>CONTENT-PERMISSION-F-SCHOOL-ID<br>CONTENT-PERMISSION-F-SUBJECT-ID<br>CONTENT-PERMISSION-F-COURSE-ID<br>CONTENT-PERMISSION-F-GRANTEE-ID<br>CONTENT-PERMISSION-F-EFFECTIVE-AT<br>CONTENT-PERMISSION-F-EXPIRES-AT<br>CONTENT-PERMISSION-F-VERSION | CONTENT-ACT-CREATE-QUESTION-VERSION<br>CONTENT-ACT-PUBLISH-QUESTION-VERSION<br>CONTENT-ACT-CREATE-LICENSE<br>CONTENT-ACT-ACTIVATE-LICENSE<br>CONTENT-ACT-CREATE-SCHOOL-PERMISSION<br>CONTENT-ACT-CREATE-SUBJECT-PERMISSION<br>CONTENT-ACT-CREATE-COURSE-PERMISSION<br>CONTENT-ACT-ACTIVATE-PERMISSION | CONTEXT_HEADER<br>TASK_WORK_AREA<br>RESULT_AND_FAILURE_STATUS | LOADING<br>READY<br>EMPTY<br>ERROR<br>FORBIDDEN<br>STALE_VERSION |

## 9. 验收场景

| Scenario ID | 类型 | Action ID | Given | When | Expected Data | Expected State | Permission | 失败码 / 谓词 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CONTENT-ACT-CREATE-QUESTION-VERSION-SCN-SUCCESS | SUCCESS | CONTENT-ACT-CREATE-QUESTION-VERSION | the authorized actor satisfies the task-specific entry conditions for Create Question Version | the actor requests Create Question Version | Create Question Version returns the accepted versioned task result without widening scope | DRAFT | ALLOW |  |
| CONTENT-ACT-CREATE-QUESTION-VERSION-SCN-PERMISSION_DENIED | FAILURE | CONTENT-ACT-CREATE-QUESTION-VERSION | PERMISSION_DENIED blocks Create Question Version | the actor requests Create Question Version | Create Question Version returns PERMISSION_DENIED and performs no hidden write | UNCHANGED | DENY | PERMISSION_DENIED |
| CONTENT-ACT-CREATE-QUESTION-VERSION-SCN-VALIDATION_FAILED | FAILURE | CONTENT-ACT-CREATE-QUESTION-VERSION | VALIDATION_FAILED blocks Create Question Version | the actor requests Create Question Version | Create Question Version returns VALIDATION_FAILED and performs no hidden write | UNCHANGED | DENY | VALIDATION_FAILED |
| CONTENT-ACT-CREATE-QUESTION-VERSION-SCN-VERSION_CONFLICT | FAILURE | CONTENT-ACT-CREATE-QUESTION-VERSION | VERSION_CONFLICT blocks Create Question Version | the actor requests Create Question Version | Create Question Version returns VERSION_CONFLICT and performs no hidden write | UNCHANGED | DENY | VERSION_CONFLICT |
| CONTENT-ACT-PUBLISH-QUESTION-VERSION-SCN-SUCCESS | SUCCESS | CONTENT-ACT-PUBLISH-QUESTION-VERSION | the authorized actor satisfies the task-specific entry conditions for Publish Question Version | the actor requests Publish Question Version | Publish Question Version returns the accepted versioned task result without widening scope | PUBLISHED | ALLOW |  |
| CONTENT-ACT-PUBLISH-QUESTION-VERSION-SCN-PERMISSION_DENIED | FAILURE | CONTENT-ACT-PUBLISH-QUESTION-VERSION | PERMISSION_DENIED blocks Publish Question Version | the actor requests Publish Question Version | Publish Question Version returns PERMISSION_DENIED and performs no hidden write | UNCHANGED | DENY | PERMISSION_DENIED |
| CONTENT-ACT-PUBLISH-QUESTION-VERSION-SCN-LICENSE_INACTIVE | FAILURE | CONTENT-ACT-PUBLISH-QUESTION-VERSION | the question draft pins a license that is not ACTIVE or no longer matches the pinned license version | the subject lead requests publication of the question version | LICENSE_INACTIVE identifies the blocked license reference and preserves the question version in DRAFT | UNCHANGED | DENY | LICENSE_INACTIVE — license.state !== ACTIVE \|\| license.version !== pinnedLicenseVersion |
| CONTENT-ACT-PUBLISH-QUESTION-VERSION-SCN-CONTENT_PERMISSION_INACTIVE | FAILURE | CONTENT-ACT-PUBLISH-QUESTION-VERSION | the pinned content permission is inactive, expired, assigned to another grantee, or does not cover the question school, subject, and course context | the subject lead requests publication of the question version | CONTENT_PERMISSION_INACTIVE identifies the uncovered permission context and preserves the question version in DRAFT | UNCHANGED | DENY | CONTENT_PERMISSION_INACTIVE — contentPermission.state !== ACTIVE \|\| currentTime >= contentPermission.expiresAt \|\| !contentPermission.covers(questionContext, currentActor) |
| CONTENT-ACT-PUBLISH-QUESTION-VERSION-SCN-SOURCE_VERSION_STALE | FAILURE | CONTENT-ACT-PUBLISH-QUESTION-VERSION | SOURCE_VERSION_STALE blocks Publish Question Version | the actor requests Publish Question Version | Publish Question Version returns SOURCE_VERSION_STALE and performs no hidden write | UNCHANGED | DENY | SOURCE_VERSION_STALE |
| CONTENT-ACT-PUBLISH-QUESTION-VERSION-SCN-VERSION_CONFLICT | FAILURE | CONTENT-ACT-PUBLISH-QUESTION-VERSION | VERSION_CONFLICT blocks Publish Question Version | the actor requests Publish Question Version | Publish Question Version returns VERSION_CONFLICT and performs no hidden write | UNCHANGED | DENY | VERSION_CONFLICT |
| CONTENT-ACT-CREATE-LICENSE-SCN-SUCCESS | SUCCESS | CONTENT-ACT-CREATE-LICENSE | the authorized actor satisfies the task-specific entry conditions for Create Content License Record | the actor requests Create Content License Record | Create Content License Record returns the accepted versioned task result without widening scope | DRAFT | ALLOW |  |
| CONTENT-ACT-CREATE-LICENSE-SCN-PERMISSION_DENIED | FAILURE | CONTENT-ACT-CREATE-LICENSE | PERMISSION_DENIED blocks Create Content License Record | the actor requests Create Content License Record | Create Content License Record returns PERMISSION_DENIED and performs no hidden write | UNCHANGED | DENY | PERMISSION_DENIED |
| CONTENT-ACT-CREATE-LICENSE-SCN-VALIDATION_FAILED | FAILURE | CONTENT-ACT-CREATE-LICENSE | VALIDATION_FAILED blocks Create Content License Record | the actor requests Create Content License Record | Create Content License Record returns VALIDATION_FAILED and performs no hidden write | UNCHANGED | DENY | VALIDATION_FAILED |
| CONTENT-ACT-CREATE-LICENSE-SCN-VERSION_CONFLICT | FAILURE | CONTENT-ACT-CREATE-LICENSE | VERSION_CONFLICT blocks Create Content License Record | the actor requests Create Content License Record | Create Content License Record returns VERSION_CONFLICT and performs no hidden write | UNCHANGED | DENY | VERSION_CONFLICT |
| CONTENT-ACT-ACTIVATE-LICENSE-SCN-SUCCESS | SUCCESS | CONTENT-ACT-ACTIVATE-LICENSE | the authorized actor satisfies the task-specific entry conditions for Activate Content License | the actor requests Activate Content License | Activate Content License returns the accepted versioned task result without widening scope | ACTIVE | ALLOW |  |
| CONTENT-ACT-ACTIVATE-LICENSE-SCN-PERMISSION_DENIED | FAILURE | CONTENT-ACT-ACTIVATE-LICENSE | PERMISSION_DENIED blocks Activate Content License | the actor requests Activate Content License | Activate Content License returns PERMISSION_DENIED and performs no hidden write | UNCHANGED | DENY | PERMISSION_DENIED |
| CONTENT-ACT-ACTIVATE-LICENSE-SCN-VALIDATION_FAILED | FAILURE | CONTENT-ACT-ACTIVATE-LICENSE | VALIDATION_FAILED blocks Activate Content License | the actor requests Activate Content License | Activate Content License returns VALIDATION_FAILED and performs no hidden write | UNCHANGED | DENY | VALIDATION_FAILED |
| CONTENT-ACT-ACTIVATE-LICENSE-SCN-VERSION_CONFLICT | FAILURE | CONTENT-ACT-ACTIVATE-LICENSE | VERSION_CONFLICT blocks Activate Content License | the actor requests Activate Content License | Activate Content License returns VERSION_CONFLICT and performs no hidden write | UNCHANGED | DENY | VERSION_CONFLICT |
| CONTENT-ACT-CREATE-SCHOOL-PERMISSION-SCN-SUCCESS | SUCCESS | CONTENT-ACT-CREATE-SCHOOL-PERMISSION | the authorized actor satisfies the task-specific entry conditions for Create School Content Permission Grant | the actor requests Create School Content Permission Grant | Create School Content Permission Grant returns the accepted versioned task result without widening scope | DRAFT | ALLOW |  |
| CONTENT-ACT-CREATE-SCHOOL-PERMISSION-SCN-PERMISSION_DENIED | FAILURE | CONTENT-ACT-CREATE-SCHOOL-PERMISSION | PERMISSION_DENIED blocks Create School Content Permission Grant | the actor requests Create School Content Permission Grant | Create School Content Permission Grant returns PERMISSION_DENIED and performs no hidden write | UNCHANGED | DENY | PERMISSION_DENIED |
| CONTENT-ACT-CREATE-SCHOOL-PERMISSION-SCN-VALIDATION_FAILED | FAILURE | CONTENT-ACT-CREATE-SCHOOL-PERMISSION | VALIDATION_FAILED blocks Create School Content Permission Grant | the actor requests Create School Content Permission Grant | Create School Content Permission Grant returns VALIDATION_FAILED and performs no hidden write | UNCHANGED | DENY | VALIDATION_FAILED |
| CONTENT-ACT-CREATE-SCHOOL-PERMISSION-SCN-VERSION_CONFLICT | FAILURE | CONTENT-ACT-CREATE-SCHOOL-PERMISSION | VERSION_CONFLICT blocks Create School Content Permission Grant | the actor requests Create School Content Permission Grant | Create School Content Permission Grant returns VERSION_CONFLICT and performs no hidden write | UNCHANGED | DENY | VERSION_CONFLICT |
| CONTENT-ACT-CREATE-SUBJECT-PERMISSION-SCN-SUCCESS | SUCCESS | CONTENT-ACT-CREATE-SUBJECT-PERMISSION | the authorized actor satisfies the task-specific entry conditions for Create Subject Content Permission Grant | the actor requests Create Subject Content Permission Grant | Create Subject Content Permission Grant returns the accepted versioned task result without widening scope | DRAFT | ALLOW |  |
| CONTENT-ACT-CREATE-SUBJECT-PERMISSION-SCN-PERMISSION_DENIED | FAILURE | CONTENT-ACT-CREATE-SUBJECT-PERMISSION | PERMISSION_DENIED blocks Create Subject Content Permission Grant | the actor requests Create Subject Content Permission Grant | Create Subject Content Permission Grant returns PERMISSION_DENIED and performs no hidden write | UNCHANGED | DENY | PERMISSION_DENIED |
| CONTENT-ACT-CREATE-SUBJECT-PERMISSION-SCN-VALIDATION_FAILED | FAILURE | CONTENT-ACT-CREATE-SUBJECT-PERMISSION | VALIDATION_FAILED blocks Create Subject Content Permission Grant | the actor requests Create Subject Content Permission Grant | Create Subject Content Permission Grant returns VALIDATION_FAILED and performs no hidden write | UNCHANGED | DENY | VALIDATION_FAILED |
| CONTENT-ACT-CREATE-SUBJECT-PERMISSION-SCN-VERSION_CONFLICT | FAILURE | CONTENT-ACT-CREATE-SUBJECT-PERMISSION | VERSION_CONFLICT blocks Create Subject Content Permission Grant | the actor requests Create Subject Content Permission Grant | Create Subject Content Permission Grant returns VERSION_CONFLICT and performs no hidden write | UNCHANGED | DENY | VERSION_CONFLICT |
| CONTENT-ACT-CREATE-COURSE-PERMISSION-SCN-SUCCESS | SUCCESS | CONTENT-ACT-CREATE-COURSE-PERMISSION | the authorized actor satisfies the task-specific entry conditions for Create Course Content Permission Grant | the actor requests Create Course Content Permission Grant | Create Course Content Permission Grant returns the accepted versioned task result without widening scope | DRAFT | ALLOW |  |
| CONTENT-ACT-CREATE-COURSE-PERMISSION-SCN-PERMISSION_DENIED | FAILURE | CONTENT-ACT-CREATE-COURSE-PERMISSION | PERMISSION_DENIED blocks Create Course Content Permission Grant | the actor requests Create Course Content Permission Grant | Create Course Content Permission Grant returns PERMISSION_DENIED and performs no hidden write | UNCHANGED | DENY | PERMISSION_DENIED |
| CONTENT-ACT-CREATE-COURSE-PERMISSION-SCN-VALIDATION_FAILED | FAILURE | CONTENT-ACT-CREATE-COURSE-PERMISSION | VALIDATION_FAILED blocks Create Course Content Permission Grant | the actor requests Create Course Content Permission Grant | Create Course Content Permission Grant returns VALIDATION_FAILED and performs no hidden write | UNCHANGED | DENY | VALIDATION_FAILED |
| CONTENT-ACT-CREATE-COURSE-PERMISSION-SCN-VERSION_CONFLICT | FAILURE | CONTENT-ACT-CREATE-COURSE-PERMISSION | VERSION_CONFLICT blocks Create Course Content Permission Grant | the actor requests Create Course Content Permission Grant | Create Course Content Permission Grant returns VERSION_CONFLICT and performs no hidden write | UNCHANGED | DENY | VERSION_CONFLICT |
| CONTENT-ACT-ACTIVATE-PERMISSION-SCN-SUCCESS | SUCCESS | CONTENT-ACT-ACTIVATE-PERMISSION | the authorized actor satisfies the task-specific entry conditions for Activate Content Permission Grant | the actor requests Activate Content Permission Grant | Activate Content Permission Grant returns the accepted versioned task result without widening scope | ACTIVE | ALLOW |  |
| CONTENT-ACT-ACTIVATE-PERMISSION-SCN-PERMISSION_DENIED | FAILURE | CONTENT-ACT-ACTIVATE-PERMISSION | PERMISSION_DENIED blocks Activate Content Permission Grant | the actor requests Activate Content Permission Grant | Activate Content Permission Grant returns PERMISSION_DENIED and performs no hidden write | UNCHANGED | DENY | PERMISSION_DENIED |
| CONTENT-ACT-ACTIVATE-PERMISSION-SCN-VALIDATION_FAILED | FAILURE | CONTENT-ACT-ACTIVATE-PERMISSION | VALIDATION_FAILED blocks Activate Content Permission Grant | the actor requests Activate Content Permission Grant | Activate Content Permission Grant returns VALIDATION_FAILED and performs no hidden write | UNCHANGED | DENY | VALIDATION_FAILED |
| CONTENT-ACT-ACTIVATE-PERMISSION-SCN-VERSION_CONFLICT | FAILURE | CONTENT-ACT-ACTIVATE-PERMISSION | VERSION_CONFLICT blocks Activate Content Permission Grant | the actor requests Activate Content Permission Grant | Activate Content Permission Grant returns VERSION_CONFLICT and performs no hidden write | UNCHANGED | DENY | VERSION_CONFLICT |

## 10. AI 任务映射

| Task ID | 任务 | 类型 | 目标 Action | 受众 | 确认者 | 预览字段 | 失败行为 |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 11. 研发与测试就绪门禁

- 实现不得发明未登记的 Object、Field、Action、状态、失败码或 Option Set 值。
- 所有选择字段必须调用其 valueSource 指定的静态 Option Set 或授权运行时查询。
- 每个写入动作按 idempotencyKey、对象当前版本、权限、状态和审计模式失败关闭。
- 每个 Scenario 都应转化为可执行测试；失败场景必须验证对象状态不变和越权数据不返回。
- Web/App 只共享事实与权限合同；页面布局和高频能力可以按端差异化。
