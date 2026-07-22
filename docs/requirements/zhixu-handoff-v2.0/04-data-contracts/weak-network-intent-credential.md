# 弱网提交意图凭证合同

| 对象 | Owner | 数据主体 | 状态 |
| --- | --- | --- | --- |
| SUB-OBJ-INTENT-CREDENTIAL | ROLE-STUDENT | STUDENT_WORK | `ISSUED`、`COMPLETED`、`REJECTED`、`EXPIRED`、`PLATFORM_FAILURE_PROTECTED` |

## 字段

| Field ID | 名称 | 类型 | 必填 | 来源 | 可变性 |
| --- | --- | --- | --- | --- | --- |
| SUB-INTENT-F-ID | Intent Credential ID | ID | 是 | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-ACTOR-REF | Credential Actor Reference | ID | 是 | OBJECT_REF: ORG-OBJ-STUDENT | IMMUTABLE |
| SUB-INTENT-F-ACTIVITY-REF | Credential Activity Reference | ID | 是 | OBJECT_REF: HW-OBJ-ASSIGNMENT | IMMUTABLE |
| SUB-INTENT-F-ACTIVITY-VERSION | Credential Activity Publication Version | INTEGER | 是 | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-PUBLICATION-SNAPSHOT-REF | Credential Activity Publication Snapshot | ID | 是 | OBJECT_REF: HW-OBJ-PUBLICATION-SNAPSHOT | IMMUTABLE |
| SUB-INTENT-F-PUBLICATION-SNAPSHOT-VERSION | Credential Activity Publication Snapshot Version | INTEGER | 是 | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-SUBMISSION-VERSION | Credential Submission Version | INTEGER | 是 | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-PLATFORM-FAILURE-INCIDENT-REF | Pinned Platform Failure Incident Snapshot | ID | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | OBJECT_REF: SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT | IMMUTABLE |
| SUB-INTENT-F-PLATFORM-FAILURE-INCIDENT-VERSION | Pinned Platform Failure Incident Version | INTEGER | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-VERSION | Intent Credential Version | INTEGER | 是 | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-ISSUED-AT | Credential Issued At | DATETIME | required for an issued protected-timeliness credential；状态=ISSUED；动作=SUB-ACT-ISSUE-INTENT-CREDENTIAL | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-CONTENT-MANIFEST | Fixed Content Manifest | JSON | required for a normal intent credential or platform-failure protection；状态=ISSUED/PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-ISSUE-INTENT-CREDENTIAL/SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-MANIFEST-DIGEST | Fixed Content Manifest Digest | STRING | required for a normal intent credential or platform-failure protection；状态=ISSUED/PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-ISSUE-INTENT-CREDENTIAL/SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-EXPIRES-AT | Credential Expiry | DATETIME | required for an issued protected-timeliness credential；状态=ISSUED；动作=SUB-ACT-ISSUE-INTENT-CREDENTIAL | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-COMPLETION-WINDOW | Credential Completion Window | JSON | required for an issued protected-timeliness credential；状态=ISSUED；动作=SUB-ACT-ISSUE-INTENT-CREDENTIAL | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-PLATFORM-FAILURE-PROTECTED-AT | Platform Failure Timeliness Anchor | DATETIME | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-PLATFORM-FAILURE-PROTECTION-SCOPE | Exact Platform Failure Protection Scope | JSON | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-PLATFORM-FAILURE-PROTECTION-SCOPE-DIGEST | Canonical Platform Failure Protection Scope Digest | STRING | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-PLATFORM-FAILURE-PROTECTION-EXPIRES-AT | Platform Failure Protection Completion Deadline | DATETIME | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-PLATFORM-FAILURE-SOURCE-ATTESTATION | Platform Failure Source Attestation | JSON | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | SYSTEM | IMMUTABLE |
| SUB-INTENT-F-STATUS | Intent Credential Status | STRING | 是 | OPTION_SET: OPT-V2-TL-008 | SYSTEM_MANAGED |
| SUB-INTENT-F-COMPLETED-MANIFEST-DIGEST | Completed Manifest Digest | STRING | required after normal manifest completion or when platform failure protection freezes the failed request manifest；状态=COMPLETED/PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-COMPLETE-MANIFEST-INTENT/SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | SYSTEM | IMMUTABLE |

## 动作与权限

| Action ID | 操作 | 状态效果 | ALLOW / DENY | 失败结果 |
| --- | --- | --- | --- | --- |
| SUB-ACT-ISSUE-INTENT-CREDENTIAL | CREATE | CREATE → 成功场景状态 | ALLOW:ROLE-STUDENT (the student owns the draft and belongs to the assignment class scope)<br>DENY:ROLE-TEACHER (a teacher attempts to create or submit student work on the student's behalf)<br>DENY:ROLE-SCHOOL-ADMIN (school administration has no default access to student answer content)<br>DENY:ROLE-PLATFORM-OPS (platform operations has no default access to student answer content) | `PERMISSION_DENIED`、`DEADLINE_PASSED`、`ACTIVITY_NOT_ELIGIBLE`、`SNAPSHOT_MISMATCH`、`VERSION_CONFLICT`、`AUDIT_FAILED` |
| SUB-ACT-COMPLETE-MANIFEST-INTENT | UPDATE | ISSUED → COMPLETED | ALLOW:ROLE-STUDENT (the student owns the draft and belongs to the assignment class scope)<br>DENY:ROLE-TEACHER (a teacher attempts to create or submit student work on the student's behalf)<br>DENY:ROLE-SCHOOL-ADMIN (school administration has no default access to student answer content)<br>DENY:ROLE-PLATFORM-OPS (platform operations has no default access to student answer content) | `PERMISSION_DENIED`、`INTENT_CREDENTIAL_COMPLETION_REJECTED`、`MANIFEST_DIGEST_MISMATCH`、`COMPLETION_WINDOW_EXPIRED`、`VERSION_CONFLICT`、`AUDIT_FAILED` |
| SUB-ACT-REJECT-MANIFEST-CHANGE | UPDATE | ISSUED → REJECTED | ALLOW:ROLE-STUDENT (the student owns the draft and belongs to the assignment class scope)<br>DENY:ROLE-TEACHER (a teacher attempts to create or submit student work on the student's behalf)<br>DENY:ROLE-SCHOOL-ADMIN (school administration has no default access to student answer content)<br>DENY:ROLE-PLATFORM-OPS (platform operations has no default access to student answer content) | `PERMISSION_DENIED`、`MANIFEST_DIGEST_MISMATCH`、`VERSION_CONFLICT`、`AUDIT_FAILED` |
| SUB-ACT-EXPIRE-INTENT-CREDENTIAL | UPDATE | ISSUED → EXPIRED | ALLOW:SYSTEM (the system expires only an issued credential after its fixed expiry or completion window)<br>DENY:CURRENT_ACTOR (a user cannot extend or manually rewrite the credential expiry) | `NOT_FOUND`、`VERSION_CONFLICT`、`AUDIT_FAILED` |
| SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | CREATE | CREATE → 成功场景状态 | ALLOW:SYSTEM (the platform cannot issue a credential and records a school-wide failure protection outcome)<br>DENY:CURRENT_ACTOR (a user cannot self-declare platform failure protection) | `SYSTEM_FAILURE`、`INCIDENT_VERSION_MISMATCH`、`INCIDENT_SCOPE_MISMATCH`、`INCIDENT_NOT_ACTIVE_AT_DEADLINE`、`PROTECTION_SCOPE_DIGEST_MISMATCH`、`PROTECTION_SOURCE_ATTESTATION_INVALID`、`MANIFEST_DIGEST_MISMATCH`、`VERSION_CONFLICT`、`AUDIT_FAILED` |
