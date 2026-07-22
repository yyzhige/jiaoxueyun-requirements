# 未成年人高影响授权矩阵

| 对象 | Owner | 数据主体 | 状态 |
| --- | --- | --- | --- |
| IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | ROLE-STUDENT | HIGH_IMPACT_MINOR_AUTHORIZATION | `PENDING`、`AUTHORIZED`、`FROZEN`、`RESERVED`、`EXECUTED`、`REJECTED` |

## 字段

| Field ID | 名称 | 类型 | 必填 | 来源 | 可变性 |
| --- | --- | --- | --- | --- | --- |
| IAM-HIAUTH-F-ID | High-impact Authorization ID | ID | 是 | SYSTEM | IMMUTABLE |
| IAM-HIAUTH-F-STUDENT-PROFILE-ID | Affected Student Profile ID | ID | 是 | OPTION_SET: OPT-COM-010 | IMMUTABLE |
| IAM-HIAUTH-F-ACTION | Requested Data-right or High-impact Action | STRING | 是 | OPTION_SET: OPT-GOV-005 | IMMUTABLE |
| IAM-HIAUTH-F-IMPACT | Authorization Impact Level | STRING | 是 | OPTION_SET: OPT-GOV-002 | IMMUTABLE |
| IAM-HIAUTH-F-REQUESTER-ID | High-impact Action Requester ID | ID | 是 | USER_INPUT | IMMUTABLE |
| IAM-HIAUTH-F-VERIFIED-GUARDIAN-BASIS | Verified Guardian Authorization Basis | JSON | 是 | USER_INPUT | IMMUTABLE |
| IAM-HIAUTH-F-STUDENT-CONSIDERATION | Student Age and Situation Consideration | JSON | 是 | USER_INPUT | IMMUTABLE |
| IAM-HIAUTH-F-LEGAL-BASIS | Applicable Legal or Contractual Basis | JSON | 是 | USER_INPUT | IMMUTABLE |
| IAM-HIAUTH-F-DISPUTE-STATUS | Guardian Dispute Status | STRING | 是 | OPTION_SET: OPT-GOV-004 | SYSTEM_MANAGED |
| IAM-HIAUTH-F-EXPIRY | High-impact Authorization Expiry | DATETIME | 是 | USER_INPUT | IMMUTABLE |
| IAM-HIAUTH-F-STATUS | High-impact Authorization Status | STRING | 是 | SYSTEM | SYSTEM_MANAGED |
| IAM-HIAUTH-F-VERSION | High-impact Authorization Version | INTEGER | 是 | SYSTEM | SYSTEM_MANAGED |
| IAM-HIAUTH-F-SCHOOL-SCOPE | Exact School Scope for High-impact Action | JSON | 是 | USER_INPUT | IMMUTABLE |
| IAM-HIAUTH-F-RELATIONSHIP-SCOPE | Exact Relationship Scope for High-impact Action | JSON | 是 | USER_INPUT | IMMUTABLE |
| IAM-HIAUTH-F-CONSUMPTION-KEY | Unique High-impact Authorization Consumption Key | STRING | required once the authorization version is consumed or reserved for a domain execution；状态=RESERVED/EXECUTED；动作=IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION/IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION | SYSTEM | IMMUTABLE |
| IAM-HIAUTH-F-CONSUMED-ACTION-ID | Reserved Domain Action ID | STRING | 否 | SYSTEM | IMMUTABLE |
| IAM-HIAUTH-F-CONSUMED-TARGET-REF | Consumed Domain Target Reference | ID | 否 | SYSTEM | IMMUTABLE |
| IAM-HIAUTH-F-CONSUMED-TARGET-VERSION | Consumed Domain Target Version | INTEGER | 否 | SYSTEM | IMMUTABLE |
| IAM-HIAUTH-F-RESERVATION-ID | Authoritative Reservation ID | ID | 否 | SYSTEM | IMMUTABLE |
| IAM-HIAUTH-F-RESERVATION-VERSION | Authoritative Reservation Version | INTEGER | 否 | SYSTEM | IMMUTABLE |
| IAM-HIAUTH-F-RESERVED-AT | High-impact Authorization Reserved At | DATETIME | 否 | SYSTEM | IMMUTABLE |
| IAM-HIAUTH-F-CONSUMED-EXECUTION-ID | Consumed Domain Execution ID | ID | 否 | SYSTEM | IMMUTABLE |
| IAM-HIAUTH-F-CONSUMED-EXECUTION-VERSION | Consumed Domain Execution Version | INTEGER | 否 | SYSTEM | IMMUTABLE |
| IAM-HIAUTH-F-CONSUMED-AT | High-impact Authorization Consumed At | DATETIME | 否 | SYSTEM | IMMUTABLE |

## 动作与权限

| Action ID | 操作 | 状态效果 | ALLOW / DENY | 失败结果 |
| --- | --- | --- | --- | --- |
| IAM-ACT-REQUEST-HIGH-IMPACT-AUTHORIZATION | CREATE | CREATE → 成功场景状态 | ALLOW:CURRENT_ACTOR (the student or verified guardian requests a closed high-impact action with applicable legal basis)<br>DENY:ROLE-SCHOOL-ADMIN (a school cannot request or execute full platform identity deletion on behalf of a student)<br>DENY:ROLE-PLATFORM-OPS (platform operations cannot synthesize high-impact authorization) | `PERMISSION_DENIED`、`VALIDATION_FAILED`、`VERSION_CONFLICT`、`AUDIT_FAILED` |
| IAM-ACT-AUTHORIZE-HIGH-IMPACT-ACTION | UPDATE | PENDING → AUTHORIZED | ALLOW:ROLE-PLATFORM-GOVERNANCE (independent governance verifies the closed action matrix, minor's situation, guardian basis, legal basis, expiry and absence of dispute)<br>DENY:ROLE-SCHOOL-ADMIN (school roles and custom duties cannot authorize non-delegable high-impact actions)<br>DENY:ROLE-PLATFORM-OPS (platform operations cannot authorize high-impact actions) | `PERMISSION_DENIED`、`VALIDATION_FAILED`、`VERSION_CONFLICT`、`AUDIT_FAILED` |
| IAM-ACT-FREEZE-HIGH-IMPACT-ACTION | UPDATE | PENDING / AUTHORIZED → FROZEN | ALLOW:ROLE-PLATFORM-GOVERNANCE (an open guardian dispute freezes every unexecuted high-impact action)<br>DENY:ROLE-SCHOOL-ADMIN (a school cannot suppress a dispute freeze) | `PERMISSION_DENIED`、`VALIDATION_FAILED`、`VERSION_CONFLICT`、`AUDIT_FAILED` |
| IAM-ACT-RESUME-HIGH-IMPACT-ACTION | UPDATE | FROZEN → PENDING | ALLOW:ROLE-PLATFORM-GOVERNANCE (a resolved dispute returns the still-valid action for independent authorization review)<br>DENY:ROLE-PLATFORM-OPS (platform operations cannot unfreeze high-impact authorization) | `PERMISSION_DENIED`、`VALIDATION_FAILED`、`VERSION_CONFLICT`、`AUDIT_FAILED` |
| IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION | UPDATE | RESERVED → EXECUTED | ALLOW:SYSTEM (the exact domain-success event proves the same RESERVED authorization version reservation key target and terminal domain execution)<br>DENY:ROLE-SCHOOL-ADMIN (a school cannot manually consume or replay a minor high-impact authorization)<br>DENY:ROLE-PLATFORM-OPS (platform operations cannot consume or replay a high-impact authorization outside the exact event contract) | `PERMISSION_DENIED`、`VALIDATION_FAILED`、`VERSION_CONFLICT`、`AUDIT_FAILED`、`AUTHORIZATION_VERSION_ALREADY_CONSUMED`、`CONSUMPTION_KEY_CONFLICT`、`DOMAIN_ACTION_CODE_MISMATCH`、`DOMAIN_TARGET_VERSION_MISMATCH`、`DOMAIN_EXECUTION_VERSION_MISMATCH`、`AUTHORIZATION_EXPIRED`、`AUTHORIZATION_DISPUTED` |
| IAM-ACT-REJECT-HIGH-IMPACT-ACTION | UPDATE | PENDING → REJECTED | ALLOW:ROLE-PLATFORM-GOVERNANCE (the requested action lacks a valid authorization, legal basis or verifiable scope)<br>DENY:ROLE-PLATFORM-OPS (platform operations cannot decide high-impact authorization) | `PERMISSION_DENIED`、`VALIDATION_FAILED`、`VERSION_CONFLICT`、`AUDIT_FAILED` |
| IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION | UPDATE | AUTHORIZED / RESERVED → RESERVED | ALLOW:SYSTEM (the exact request context atomically compare-and-sets one AUTHORIZED version to RESERVED before any domain write)<br>DENY:ROLE-SCHOOL-ADMIN (school roles cannot manually reserve or reuse a minor high-impact authorization)<br>DENY:ROLE-PLATFORM-OPS (platform operations cannot bypass the exact version and target reservation CAS) | `PERMISSION_DENIED`、`VALIDATION_FAILED`、`VERSION_CONFLICT`、`AUDIT_FAILED`、`AUTHORIZATION_NOT_AUTHORIZED`、`AUTHORIZATION_EXPIRED`、`AUTHORIZATION_DISPUTED`、`RESERVATION_CONTEXT_MISMATCH`、`RESERVATION_TARGET_CONFLICT` |
