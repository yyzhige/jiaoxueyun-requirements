import { RELEASE_STATUS, deepFreeze } from "../model.mjs";
import {
  baselineChapters,
  productDecisions,
} from "./product-baseline-v2.mjs";
import { migrationChanges } from "./baseline-migration.mjs";
import { metricGroups } from "./launch-governance.mjs";

const list = (value) => (Array.isArray(value) ? value : []);

export const TRACE_AXIS_STATUS = deepFreeze({
  APPLICABLE: "APPLICABLE",
  NOT_APPLICABLE: "NOT_APPLICABLE",
});

export const TRACE_AXIS_METADATA = deepFreeze({
  moduleIds: {
    label: "模块",
    applicableReasonCode: "DIRECT_MODULE_CONTRACT",
    notApplicableReasonCode: "NO_DIRECT_MODULE_CONTRACT",
    notApplicableReason: "本行不直接改变模块职责边界；影响由同一行已追踪的其他需求合同承载。",
  },
  pageIds: {
    label: "页面合同",
    applicableReasonCode: "DIRECT_PAGE_CONTRACT",
    notApplicableReasonCode: "NO_DIRECT_PAGE_CONTRACT",
    notApplicableReason: "本行不直接新增或改变用户页面合同；交互影响由已追踪的动作、对象或阶段边界承载。",
  },
  flowIds: {
    label: "数据流",
    applicableReasonCode: "DIRECT_DATA_FLOW_CONTRACT",
    notApplicableReasonCode: "NO_DIRECT_DATA_FLOW_CONTRACT",
    notApplicableReason: "本行不改变跨模块数据流；约束在已追踪模块的对象、动作或权限合同内闭合。",
  },
  objectIds: {
    label: "对象",
    applicableReasonCode: "DIRECT_OBJECT_CONTRACT",
    notApplicableReasonCode: "NO_DIRECT_OBJECT_CONTRACT",
    notApplicableReason: "本行不新增或改变权威对象；影响只约束现有页面、动作、状态、指标或验收门禁。",
  },
  actionIds: {
    label: "动作",
    applicableReasonCode: "DIRECT_ACTION_CONTRACT",
    notApplicableReasonCode: "NO_DIRECT_ACTION_CONTRACT",
    notApplicableReason: "本行不新增或改变命令、查询或系统动作；影响由对象、阶段、指标或门禁合同表达。",
  },
  permissionRefs: {
    label: "权限",
    applicableReasonCode: "DIRECT_PERMISSION_CONTRACT",
    notApplicableReasonCode: "NO_DIRECT_PERMISSION_CONTRACT",
    notApplicableReason: "本行不改变授权判定；相关执行仍服从被追踪动作已有的权限合同。",
  },
  stateRefs: {
    label: "状态",
    applicableReasonCode: "DIRECT_STATE_CONTRACT",
    notApplicableReasonCode: "NO_DIRECT_STATE_CONTRACT",
    notApplicableReason: "本行不新增或改变对象状态轴；约束通过其他已追踪合同轴表达。",
  },
  metricIds: {
    label: "指标",
    applicableReasonCode: "DIRECT_METRIC_CONTRACT",
    notApplicableReasonCode: "NO_DIRECT_METRIC_CONTRACT",
    notApplicableReason: "本行不直接定义六组平衡指标；阶段成效由产品验收章节统一聚合衡量。",
  },
  launchGateIds: {
    label: "上线门",
    applicableReasonCode: "DIRECT_LAUNCH_GATE_CONTRACT",
    notApplicableReasonCode: "NO_DIRECT_LAUNCH_GATE_CONTRACT",
    notApplicableReason: "本行不直接定义阶段上线门；零容忍、质量阈值和证据完整门由上线门章节统一执行。",
  },
  scenarioIds: {
    label: "业务场景",
    applicableReasonCode: "DIRECT_SCENARIO_CONTRACT",
    notApplicableReasonCode: "NO_DIRECT_SCENARIO_CONTRACT",
    notApplicableReason: "本行不新增独立业务场景；可执行验收由同一行测试门禁及其余直接合同覆盖。",
  },
  testIds: {
    label: "验收测试",
    applicableReasonCode: "DIRECT_ACCEPTANCE_TEST_CONTRACT",
    notApplicableReasonCode: "NO_DIRECT_ACCEPTANCE_TEST_CONTRACT",
    notApplicableReason: "本行不新增独立自动化门禁；验收由已追踪业务场景或上位基线门覆盖。",
  },
});

export const TRACE_AXIS_KEYS = deepFreeze(Object.keys(TRACE_AXIS_METADATA));

function registerAcceptanceTests(suitePath, testName, testIds) {
  return testIds.map((id) => ({ id, suitePath, testName }));
}

export const acceptanceTestRegistry = deepFreeze([
  ...registerAcceptanceTests("tools/tests/requirements-v2-baseline-traceability.test.mjs", "enforces foundational baseline acceptance contracts", [
    "BASELINE-AI-NATIVE-FACTS-FIRST",
    "BASELINE-CAPABILITY-TEXTBOOK-MAPPING",
    "BASELINE-CONTROLLED-CHANGE-TRACE",
    "BASELINE-DOCUMENT-REPOSITORY-BOUNDARY",
    "BASELINE-DUAL-PROGRESS-SEPARATION",
    "BASELINE-FROZEN-ASSESSMENT-STANDARD",
    "BASELINE-LOGIN-IDENTIFIER-RECOVERY",
    "BASELINE-PHASE-1-COMPLETION",
    "BASELINE-PLANNED-BANNER",
    "BASELINE-PLANNED-NOT-LAUNCHED",
    "BASELINE-TEACHING-TERMINOLOGY",
    "BASELINE-THREE-PHASE-OWNERSHIP",
    "INV-NO-DEFAULT-RANKING",
    "INV-PLANNED-NOT-LAUNCHED",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-product-invariants-teaching.test.mjs", "Task5 migration records trace publication, weak-network, help, quality, and integrity changes", [
    "BASELINE-ACTIVITY-PURPOSES",
    "BASELINE-ACTIVITY-STATUS-AXES",
    "BASELINE-CANCEL-REPLACE",
    "BASELINE-PRESENTATION-NO-EVIDENCE",
    "BASELINE-PUBLICATION-SNAPSHOT",
    "BASELINE-PURPOSE-AWARE-LATE-ENROLLEE-WINDOW",
    "BASELINE-VALID-ATTEMPT",
    "INVALID_ACADEMIC_INTEGRITY_SIGNAL_BOUNDARY",
    "INVALID_ACTIVITY_PURPOSE_POLICY_CONTRACT",
    "INVALID_DIAGNOSTIC_USE_BOUNDARY",
    "INVALID_HELP_ENVIRONMENT_EVIDENCE",
    "INVALID_INPUT_QUALITY_FACT",
    "INVALID_PER_STUDENT_STATUS_AXIS_WRITER",
    "INVALID_TEACHING_PRESENTATION_CONTRACT",
    "INVALID_TEACHING_PRESENTATION_TODO_BOUNDARY",
    "INVALID_WEAK_NETWORK_ACCEPTANCE_PATHS",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-product-invariants-ai.test.mjs", "rejects destructive mutations of every phase-two AI invariant", [
    "BASELINE-AI-EXCEPTION-QUEUE",
    "BASELINE-AI-MULTI-OUTCOME",
    "BASELINE-AI-PUBLICATION-FAIL-CLOSED",
    "BASELINE-AI-RESULT-STATUS-AXES",
    "BASELINE-BATCH-RECALCULATION",
    "BASELINE-FOUR-LAYER-FEEDBACK",
    "BASELINE-NO-CHAIN-OF-THOUGHT-PERSISTENCE",
    "BASELINE-RAW-DERIVED-SEPARATION",
    "INV-RAW-FACTS-IMMUTABLE",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-governance-baseline.test.mjs", "semantic validation rejects destructive governance contract mutations", [
    "BASELINE-EIGHT-AXIS-DATA-CATALOG",
    "BASELINE-EXPORT-DOUBLE-AUTHORIZATION",
    "BASELINE-FOUR-GOVERNANCE-ACTIONS",
    "BASELINE-MATERIAL-RIGHTS-BUNDLE",
    "BASELINE-NO-STUDENT-WORK-PUBLIC-PROMOTION",
    "BASELINE-OBJECT-DELETION-MATRIX",
    "BASELINE-OLD-SCHOOL-HISTORY-LIMITS",
    "BASELINE-ROLE-EXPORT-RIGHTS",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-baseline-traceability.test.mjs", "D054-D055 search surfaces reauthorize and hide unauthorized existence", [
    "BASELINE-SEARCH-REQUEST-REAUTHORIZATION",
    "BASELINE-SEARCH-SIDE-CHANNEL",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-product-invariants.test.mjs", "authorization boundaries cover substitute expiry, privileged default deny and disputes", [
    "BASELINE-ACCESSIBLE-EXPERIENCE",
    "BASELINE-EMERGENCY-ACCESS",
    "BASELINE-GUARDIAN-TASK-SESSION",
    "BASELINE-HOMEROOM-COORDINATION-ONLY",
    "BASELINE-IDENTITY-ID-LIFETIME",
    "BASELINE-NOTIFICATION-SEPARATION",
    "BASELINE-RELATIONSHIP-AUTHORIZATION",
    "BASELINE-RESPONSIBILITY-DOMAINS",
    "BASELINE-SCHOOL-READINESS-AXES",
    "BASELINE-SINGLE-ADMIN-RECOVERY",
    "BASELINE-STUDENT-HOME-COMPARTMENTS",
    "BASELINE-STUDENT-PRIMARY-ACCOUNT",
    "BASELINE-SUBSTITUTE-EXPIRY",
    "BASELINE-SUPPORT-SCOPED-ACCESS",
    "SHARED_DEVICE_PRODUCT_CONTROLLED_SCOPE",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-phase-two.test.mjs", "video requests pin both problem and progress sources plus assessment and rights versions", [
    "BASELINE-CONTROLLED-PLAYBACK-SCOPE",
    "BASELINE-VIDEO-ALL-GATES",
    "BASELINE-VIDEO-DELIVERY-SETTLEMENT",
    "BASELINE-VIDEO-FAIR-QUOTA",
    "BASELINE-VIDEO-LIFECYCLE-TRIGGERS",
    "BASELINE-VIDEO-MINIMUM-CONTEXT",
    "BASELINE-VIDEO-SOURCE-PINNING",
    "BASELINE-VIDEO-UNDERSTANDING-VERIFICATION",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-commercial-continuity.test.mjs", "commercial continuity requirement model passes every validator", [
    "BASELINE-CONTRACTUAL-DATA-RIGHTS",
    "BASELINE-CORE-AI-MINIMUM",
    "BASELINE-D090-CONSUMER-ENTITLEMENT-GUARDS",
    "BASELINE-PROTECTED-ACTIVITY-WINDOW",
    "BASELINE-SCHOOL-ONLY-PAYER",
    "BASELINE-SIX-METRIC-GROUPS",
    "BASELINE-THREE-LAUNCH-GATES",
    "D090-SERVICE-PLAN-EXECUTION-REVALIDATION",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-answer-open-delivery.test.mjs", "D077 binds every delivery surface to real execution actions", [
    "BASELINE-ANSWER-EXPOSED-EVIDENCE",
    "BASELINE-ANSWER-OPEN-ALL-SURFACES",
    "D077-ANSWER-OPEN-DELIVERY-SURFACES",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-high-impact-authorization.test.mjs", "D037 binds identity deletion, transfer, and phase-three student-work public promotion to one versioned IAM authorization", [
    "BASELINE-HIGH-IMPACT-FREEZE",
    "D037-HIGH-IMPACT-AUTHORIZATION-CONTRACT",
    "D037-HIGH-IMPACT-AUTHORIZATION-RESERVATION",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-weak-network-protection.test.mjs", "D043 keeps completed intent and platform incident protection as distinct proof branches", [
    "BASELINE-WEAK-NETWORK-INTENT-CREDENTIAL",
    "D043-PLATFORM-FAILURE-PROTECTED-SUBMISSION",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-teacher-author-surrogate.test.mjs", "D051 closes teacher identity deletion through one versioned event and non-recoverable authorship rewrite", [
    "BASELINE-DELETED-TEACHER-AUTHOR-SURROGATE",
    "D051-TEACHER-AUTHOR-SURROGATE-EVENT",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-transfer-lifecycle.test.mjs", "D052-D053 use ACC as the only membership authority and execute one forward-only version-pinned transfer cutover", [
    "BASELINE-TRANSFER-AUTHORIZATION-SUBSET",
    "D052-D053-TRANSFER-LIFECYCLE",
  ]),
  ...registerAcceptanceTests("tools/tests/requirements-v2-video-recall-source-fanout.test.mjs", "D084 binds five real source mutations to one versioned recall event and flow", [
    "D084-VIDEO-RECALL-SOURCE-FANOUT",
  ]),
]);

function composeAxisApplicability(sourceDeclarations, sourceLabel) {
  return Object.fromEntries(TRACE_AXIS_KEYS.map((axisKey) => {
    const metadata = TRACE_AXIS_METADATA[axisKey];
    const applicableSources = sourceDeclarations.filter((declaration) => (
      declaration?.[axisKey]?.status === TRACE_AXIS_STATUS.APPLICABLE
    ));
    return [axisKey, applicableSources.length > 0 ? {
      status: TRACE_AXIS_STATUS.APPLICABLE,
      reasonCode: metadata.applicableReasonCode,
      reason: `${sourceLabel} 的${metadata.label}轴由 ${applicableSources.length} 项显式来源声明为适用。`,
    } : {
      status: TRACE_AXIS_STATUS.NOT_APPLICABLE,
      reasonCode: metadata.notApplicableReasonCode,
      reason: `${sourceLabel} 的${metadata.label}轴由源基线显式声明为不适用，不从空引用反向推断。`,
    }];
  }));
}

const CHAPTER_BINDINGS = Object.freeze({
  "BASE-CH-PRINCIPLES": {
    moduleIds: ["DGV-001", "AUD-001"],
    pageIds: ["DGV-PAGE-POLICY", "AUD-PAGE-SEARCH"],
    flowIds: ["DF-001"],
    objectIds: ["DGV-OBJ-POLICY", "DGV-OBJ-AI-RULE", "AUD-OBJ-EVENT"],
    actionIds: ["DGV-ACT-CONFIGURE-AI-USE", "AUD-ACT-QUERY-AUDIT"],
    permissionActionIds: ["DGV-ACT-CONFIGURE-AI-USE", "AUD-ACT-QUERY-AUDIT"],
    stateRefs: ["DGV-OBJ-POLICY.ACTIVE", "AUD-OBJ-EVENT.ACCEPTED"],
    scenarioIds: ["DGV-ACT-CONFIGURE-AI-USE-SCN-SUCCESS", "AUD-ACT-QUERY-AUDIT-SCN-SUCCESS"],
  },
  "BASE-CH-SCOPE-PHASES": {
    moduleIds: ["ACC-001", "ORG-001"],
    pageIds: ["ACC-PAGE-SCHOOL-ENTRY", "ORG-PAGE-TREE"],
    flowIds: ["DF-001", "DF-004", "DF-P2-001"],
    objectIds: ["ACC-OBJ-SCHOOL", "ORG-OBJ-COURSE"],
    actionIds: ["ACC-ACT-SELECT-SCHOOL", "ORG-ACT-ACTIVATE-COURSE"],
    permissionActionIds: ["ACC-ACT-SELECT-SCHOOL", "ORG-ACT-ACTIVATE-COURSE"],
    stateRefs: ["ACC-OBJ-SCHOOL.ACTIVE", "ORG-OBJ-COURSE.ACTIVE"],
    scenarioIds: ["ACC-ACT-SELECT-SCHOOL-SCN-SUCCESS", "ORG-ACT-ACTIVATE-COURSE-SCN-SUCCESS"],
  },
  "BASE-CH-DATA-KNOWLEDGE": {
    moduleIds: ["DGV-001", "CONTENT-001", "CURR-001"],
    pageIds: ["DGV-PAGE-DATA-CATALOG", "CONTENT-PAGE-GOVERNANCE", "CURR-PAGE-KP-EDITOR"],
    flowIds: ["DF-006", "DF-011"],
    objectIds: ["DGV-OBJ-DATA-CATALOG-ENTRY", "CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE", "CONTENT-OBJ-PERMISSION", "CURR-OBJ-KNOWLEDGE-POINT", "CURR-OBJ-CURRICULUM"],
    actionIds: ["DGV-ACT-RESOLVE-DATA-CATALOG", "CONTENT-ACT-ACTIVATE-PERMISSION", "CURR-ACT-PUBLISH-VERSION"],
    permissionActionIds: ["DGV-ACT-RESOLVE-DATA-CATALOG", "CONTENT-ACT-ACTIVATE-PERMISSION", "CURR-ACT-PUBLISH-VERSION"],
    stateRefs: ["DGV-OBJ-DATA-CATALOG-ENTRY.ACTIVE", "CURR-OBJ-KNOWLEDGE-POINT.ACTIVE"],
    scenarioIds: ["DGV-ACT-RESOLVE-DATA-CATALOG-SCN-SUCCESS", "CONTENT-ACT-ACTIVATE-PERMISSION-SCN-SUCCESS"],
  },
  "BASE-CH-SCHOOL-GOVERNANCE": {
    moduleIds: ["ACC-001", "ORG-001", "IAM-001"],
    pageIds: ["ACC-PAGE-SCHOOL-READINESS-AXES", "ORG-PAGE-TEACHING-ASSIGNMENT", "IAM-PAGE-POLICY"],
    flowIds: ["DF-001", "DF-002"],
    objectIds: ["ACC-OBJ-SCHOOL-ACTIVATION", "ORG-OBJ-TEACHING-ASSIGNMENT", "IAM-OBJ-PERMISSION-DECISION"],
    actionIds: ["ACC-ACT-ACTIVATE-SCHOOL-TEACHING", "ORG-ACT-ACTIVATE-TEACHING-ASSIGNMENT", "IAM-ACT-EVALUATE-PERMISSION"],
    permissionActionIds: ["ACC-ACT-ACTIVATE-SCHOOL-TEACHING", "ORG-ACT-ACTIVATE-TEACHING-ASSIGNMENT", "IAM-ACT-EVALUATE-PERMISSION"],
    stateRefs: ["ACC-OBJ-SCHOOL-ACTIVATION.TEACHING_ACTIVE", "ORG-OBJ-TEACHING-ASSIGNMENT.EFFECTIVE"],
    scenarioIds: ["ACC-ACT-ACTIVATE-SCHOOL-TEACHING-SCN-SUCCESS", "IAM-ACT-EVALUATE-PERMISSION-SCN-SUCCESS-ALLOW"],
  },
  "BASE-CH-IDENTITY-GUARDIAN": {
    moduleIds: ["ACC-001", "IAM-001", "DGV-001"],
    pageIds: ["ACC-PAGE-LOGIN-ACCOUNT", "IAM-PAGE-TASK-ASSISTANCE", "DGV-PAGE-STUDENT-TRANSFER"],
    flowIds: ["DF-001", "DF-002"],
    objectIds: ["ACC-OBJ-PLATFORM-IDENTITY", "IAM-OBJ-TASK-ASSISTANCE-SESSION", "DGV-OBJ-TRANSFER-AUTHORIZATION"],
    actionIds: ["ACC-ACT-REGISTER-PLATFORM-IDENTITY", "IAM-ACT-OPEN-TASK-ASSISTANCE-SESSION", "DGV-ACT-AUTHORIZE-STUDENT-TRANSFER"],
    permissionActionIds: ["ACC-ACT-REGISTER-PLATFORM-IDENTITY", "IAM-ACT-OPEN-TASK-ASSISTANCE-SESSION", "DGV-ACT-AUTHORIZE-STUDENT-TRANSFER"],
    stateRefs: ["ACC-OBJ-PLATFORM-IDENTITY.ACTIVE", "IAM-OBJ-TASK-ASSISTANCE-SESSION.ACTIVE"],
    scenarioIds: ["ACC-ACT-REGISTER-PLATFORM-IDENTITY-SCN-SUCCESS", "IAM-ACT-OPEN-TASK-ASSISTANCE-SESSION-SCN-SUCCESS"],
  },
  "BASE-CH-ROLE": {
    moduleIds: ["TEA-001", "APP-001", "NOTI-001"],
    pageIds: ["TEA-PAGE-TODAY", "APP-PAGE-STUDENT-HOME", "NOTI-PAGE-INBOX"],
    flowIds: ["DF-015", "DF-013"],
    objectIds: ["TEA-OBJ-TEACHING-PROBLEM", "TEA-OBJ-LINKED-TEACHING-ACTION", "APP-OBJ-STUDENT-HOME", "NOTI-OBJ-NOTIFICATION"],
    actionIds: ["TEA-ACT-QUERY-ACTION-QUEUE", "APP-ACT-VIEW-STUDENT-HOME", "NOTI-ACT-MARK-HANDLED"],
    permissionActionIds: ["TEA-ACT-QUERY-ACTION-QUEUE", "APP-ACT-VIEW-STUDENT-HOME", "NOTI-ACT-MARK-HANDLED"],
    stateRefs: ["TEA-OBJ-TEACHING-PROBLEM.OPEN", "NOTI-OBJ-NOTIFICATION.READ"],
    scenarioIds: ["TEA-ACT-QUERY-ACTION-QUEUE-SCN-SUCCESS", "APP-ACT-VIEW-STUDENT-HOME-SCN-SUCCESS"],
  },
  "BASE-CH-TEACHER-EXPERIENCE": {
    moduleIds: ["TEA-001"],
    pageIds: ["TEA-PAGE-TODAY", "TEA-PAGE-QUEUE", "TEA-PAGE-CLASS-INSIGHT", "TEA-PAGE-STUDENT-DETAIL"],
    objectIds: ["TEA-OBJ-TEACHING-PROBLEM", "TEA-OBJ-TEACHER-JUDGMENT", "TEA-OBJ-LINKED-TEACHING-ACTION"],
    actionIds: ["TEA-ACT-CREATE-TEACHING-PROBLEM", "TEA-ACT-RECORD-TEACHER-JUDGMENT", "TEA-ACT-CREATE-LINKED-ACTION", "TEA-ACT-QUERY-ACTION-QUEUE", "TEA-ACT-QUERY-CLASS-INSIGHT", "TEA-ACT-QUERY-STUDENT-DETAIL", "TEA-ACT-RESOLVE-PROBLEM-AFTER-OBSERVATION", "TEA-ACT-REOPEN-PROBLEM"],
    permissionActionIds: ["TEA-ACT-CREATE-TEACHING-PROBLEM", "TEA-ACT-RECORD-TEACHER-JUDGMENT", "TEA-ACT-CREATE-LINKED-ACTION", "TEA-ACT-QUERY-ACTION-QUEUE", "TEA-ACT-QUERY-CLASS-INSIGHT", "TEA-ACT-QUERY-STUDENT-DETAIL", "TEA-ACT-RESOLVE-PROBLEM-AFTER-OBSERVATION", "TEA-ACT-REOPEN-PROBLEM"],
    stateRefs: ["TEA-OBJ-TEACHING-PROBLEM.OPEN", "TEA-OBJ-TEACHING-PROBLEM.RESOLVED", "TEA-OBJ-TEACHING-PROBLEM.REOPENED", "TEA-OBJ-TEACHER-JUDGMENT.RECORDED", "TEA-OBJ-LINKED-TEACHING-ACTION.PROPOSED", "TEA-OBJ-LINKED-TEACHING-ACTION.COMPLETED", "TEA-OBJ-LINKED-TEACHING-ACTION.OBSERVING"],
    scenarioIds: ["TEA-ACT-CREATE-TEACHING-PROBLEM-SCN-SUCCESS", "TEA-ACT-RECORD-TEACHER-JUDGMENT-SCN-SUCCESS", "TEA-ACT-CREATE-LINKED-ACTION-SCN-SUCCESS", "TEA-ACT-QUERY-ACTION-QUEUE-SCN-SUCCESS", "TEA-ACT-QUERY-CLASS-INSIGHT-SCN-SUCCESS", "TEA-ACT-QUERY-STUDENT-DETAIL-SCN-SUCCESS", "TEA-ACT-RESOLVE-PROBLEM-AFTER-OBSERVATION-SCN-SUCCESS", "TEA-ACT-REOPEN-PROBLEM-SCN-SUCCESS"],
  },
  "BASE-CH-ACTIVITY-EVIDENCE": {
    moduleIds: ["HW-001", "SUB-001", "APP-001"],
    pageIds: ["HW-PAGE-AUTHORING", "SUB-PAGE-APP", "APP-PAGE-STUDENT-HOME"],
    flowIds: ["DF-004", "DF-005", "DF-015"],
    objectIds: ["HW-OBJ-ASSIGNMENT", "SUB-OBJ-ATTEMPT", "APP-OBJ-TODO"],
    actionIds: ["HW-ACT-PUBLISH-NOW", "SUB-ACT-SUBMIT", "APP-ACT-CREATE-HOMEWORK-TODO"],
    permissionActionIds: ["HW-ACT-PUBLISH-NOW", "SUB-ACT-SUBMIT", "APP-ACT-CREATE-HOMEWORK-TODO"],
    stateRefs: ["HW-OBJ-ASSIGNMENT.PUBLISHED", "SUB-OBJ-ATTEMPT.SUBMITTED"],
    scenarioIds: ["HW-ACT-PUBLISH-NOW-SCN-SUCCESS", "SUB-ACT-SUBMIT-SCN-SUCCESS"],
  },
  "BASE-CH-AI-ASSESSMENT": {
    moduleIds: ["GRD-001", "PUB-001", "CORR-001", "AIX-001"],
    pageIds: ["GRD-PAGE-DECISION", "PUB-PAGE-STUDENT-RESULT", "CORR-PAGE-ATTEMPT"],
    flowIds: ["DF-006", "DF-007", "DF-008", "DF-009", "DF-010"],
    objectIds: ["GRD-OBJ-DECISION", "PUB-OBJ-RESULT", "CORR-OBJ-ATTEMPT-ASSESSMENT"],
    actionIds: ["GRD-ACT-PROCESS", "PUB-ACT-PUBLISH-RESULT", "CORR-ACT-NORMALIZE-SUBMISSION"],
    permissionActionIds: ["GRD-ACT-PROCESS", "PUB-ACT-PUBLISH-RESULT", "CORR-ACT-NORMALIZE-SUBMISSION"],
    stateRefs: ["GRD-OBJ-DECISION.AI_DETERMINED", "PUB-OBJ-RESULT.PUBLISHED"],
    scenarioIds: ["GRD-ACT-PROCESS-SCN-SUCCESS", "PUB-ACT-PUBLISH-RESULT-SCN-SUCCESS"],
  },
  "BASE-CH-VIDEO": {
    moduleIds: ["PROG-001", "VIDEO-001", "PUB-001"],
    pageIds: ["VIDEO-PAGE-CONTROLLED-PLAYBACK", "VIDEO-PAGE-POST-VIDEO-VERIFICATION", "PROG-PAGE-STUDENT-CURRENT-TARGET"],
    flowIds: ["DF-P2-001", "DF-P2-002", "DF-P2-003"],
    objectIds: ["VIDEO-OBJ-REQUEST", "VIDEO-OBJ-ASSET", "VIDEO-OBJ-VERIFICATION"],
    actionIds: ["VIDEO-ACT-REQUEST-PROBLEM-DRIVEN", "VIDEO-ACT-DELIVER-USABLE", "VIDEO-ACT-COMPLETE-NEW-CONTEXT-VERIFICATION"],
    permissionActionIds: ["VIDEO-ACT-REQUEST-PROBLEM-DRIVEN", "VIDEO-ACT-DELIVER-USABLE", "VIDEO-ACT-COMPLETE-NEW-CONTEXT-VERIFICATION"],
    stateRefs: ["VIDEO-OBJ-ASSET.DELIVERED", "VIDEO-OBJ-VERIFICATION.COMPLETED"],
    scenarioIds: ["VIDEO-ACT-REQUEST-PROBLEM-DRIVEN-SCN-SUCCESS", "VIDEO-ACT-DELIVER-USABLE-SCN-SUCCESS"],
  },
  "BASE-CH-PROGRESS": {
    moduleIds: ["PROG-001", "INS-001", "PLN-001", "LPATH-001"],
    pageIds: ["PROG-PAGE-STUDENT-CURRENT-TARGET", "INS-PAGE-PERSONAL-PROGRESS", "PLN-PAGE-CLASS-PROGRESS"],
    flowIds: ["DF-P2-001", "DF-011", "DF-013"],
    objectIds: ["PROG-OBJ-STUDENT-TARGET", "PROG-OBJ-NEXT-TARGET-CHOICE", "INS-OBJ-MASTERY-NODE", "PLN-OBJ-CLASS-PROGRESS"],
    actionIds: ["PROG-ACT-SELECT-NEXT-TARGET", "INS-ACT-CONFIRM-MASTERY-NODE", "PLN-ACT-VIEW-CLASS-PROGRESS"],
    permissionActionIds: ["PROG-ACT-SELECT-NEXT-TARGET", "INS-ACT-CONFIRM-MASTERY-NODE", "PLN-ACT-VIEW-CLASS-PROGRESS"],
    stateRefs: ["PROG-OBJ-STUDENT-TARGET.COMPLETED", "INS-OBJ-MASTERY-NODE.MASTERED"],
    scenarioIds: ["PROG-ACT-SELECT-NEXT-TARGET-SCN-SUCCESS", "INS-ACT-CONFIRM-MASTERY-NODE-SCN-SUCCESS"],
  },
  "BASE-CH-MASTERY-VISIBILITY": {
    moduleIds: ["INS-001", "PLN-001"],
    pageIds: ["INS-PAGE-STUDENT-MASTERY", "INS-PAGE-PERSONAL-PROGRESS", "INS-PAGE-MASTERY-CHALLENGES", "PLN-PAGE-HOMEROOM"],
    flowIds: ["DF-011", "DF-014"],
    objectIds: ["INS-OBJ-EVIDENCE", "INS-OBJ-MASTERY-NODE", "INS-OBJ-MASTERY-CHALLENGE", "PLN-OBJ-HOMEROOM-COORDINATION"],
    actionIds: ["INS-ACT-VIEW-MASTERY", "INS-ACT-VIEW-PERSONAL-PROGRESS", "INS-ACT-OPEN-MASTERY-CHALLENGE", "INS-ACT-RESOLVE-MASTERY-CHALLENGE", "PLN-ACT-VIEW-HOMEROOM-COORDINATION"],
    permissionActionIds: ["INS-ACT-VIEW-MASTERY", "INS-ACT-VIEW-PERSONAL-PROGRESS", "INS-ACT-OPEN-MASTERY-CHALLENGE", "INS-ACT-RESOLVE-MASTERY-CHALLENGE", "PLN-ACT-VIEW-HOMEROOM-COORDINATION"],
    stateRefs: ["INS-OBJ-EVIDENCE.TEACHER_CONFIRMED", "INS-OBJ-MASTERY-NODE.LEARNING", "INS-OBJ-MASTERY-NODE.MASTERED", "INS-OBJ-MASTERY-NODE.REVIEW_REQUIRED", "INS-OBJ-MASTERY-CHALLENGE.OPEN", "PLN-OBJ-HOMEROOM-COORDINATION.AVAILABLE"],
    scenarioIds: ["INS-ACT-VIEW-MASTERY-SCN-SUCCESS", "INS-ACT-VIEW-PERSONAL-PROGRESS-SCN-SUCCESS", "INS-ACT-OPEN-MASTERY-CHALLENGE-SCN-SUCCESS", "INS-ACT-RESOLVE-MASTERY-CHALLENGE-SCN-SUCCESS", "PLN-ACT-VIEW-HOMEROOM-COORDINATION-SCN-SUCCESS"],
  },
  "BASE-CH-CORRECTION-REVIEW": {
    moduleIds: ["CORR-001", "PUB-001", "INS-001"],
    pageIds: ["CORR-PAGE-ATTEMPT", "PUB-PAGE-STUDENT-RESULT", "INS-PAGE-EVIDENCE-REVIEW", "INS-PAGE-MASTERY-CHALLENGES"],
    flowIds: ["DF-008", "DF-009", "DF-010", "DF-011"],
    objectIds: ["CORR-OBJ-TASK", "CORR-OBJ-ATTEMPT", "CORR-OBJ-INVALIDATION", "PUB-OBJ-RESULT", "INS-OBJ-EVIDENCE", "INS-OBJ-MASTERY-CHALLENGE"],
    actionIds: ["CORR-ACT-CONFIRM-JUDGMENT", "CORR-ACT-REQUEST-RETRY", "CORR-ACT-COMPLETE-TASK", "CORR-ACT-RECORD-INVALIDATION", "PUB-ACT-CORRECT-RESULT", "INS-ACT-OPEN-MASTERY-CHALLENGE", "INS-ACT-RESOLVE-MASTERY-CHALLENGE"],
    permissionActionIds: ["CORR-ACT-CONFIRM-JUDGMENT", "CORR-ACT-REQUEST-RETRY", "CORR-ACT-COMPLETE-TASK", "CORR-ACT-RECORD-INVALIDATION", "PUB-ACT-CORRECT-RESULT", "INS-ACT-OPEN-MASTERY-CHALLENGE", "INS-ACT-RESOLVE-MASTERY-CHALLENGE"],
    stateRefs: ["CORR-OBJ-TASK.AWAITING_RETRY", "CORR-OBJ-TASK.COMPLETED", "CORR-OBJ-ATTEMPT.JUDGED", "CORR-OBJ-ATTEMPT.NEEDS_RETRY", "CORR-OBJ-INVALIDATION.RECORDED", "PUB-RESULT-F-DISPUTE-CORRECTION-STATUS", "INS-OBJ-MASTERY-CHALLENGE.OPEN", "INS-OBJ-MASTERY-CHALLENGE.RESOLVED"],
    scenarioIds: ["CORR-ACT-CONFIRM-JUDGMENT-SCN-SUCCESS", "CORR-ACT-REQUEST-RETRY-SCN-SUCCESS", "CORR-ACT-COMPLETE-TASK-SCN-SUCCESS", "CORR-ACT-RECORD-INVALIDATION-SCN-SUCCESS", "PUB-ACT-CORRECT-RESULT-SCN-SUCCESS", "INS-ACT-OPEN-MASTERY-CHALLENGE-SCN-SUCCESS", "INS-ACT-RESOLVE-MASTERY-CHALLENGE-SCN-SUCCESS"],
  },
  "BASE-CH-DATA-RIGHTS": {
    moduleIds: ["DGV-001", "ACC-001", "ORG-001"],
    pageIds: ["DGV-PAGE-EXPORT-REQUEST", "DGV-PAGE-OLD-SCHOOL-HISTORY", "ACC-PAGE-PLATFORM-IDENTITY"],
    flowIds: ["DF-001", "DF-005", "DF-011"],
    objectIds: ["DGV-OBJ-EXPORT", "DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY", "ACC-OBJ-PLATFORM-IDENTITY"],
    actionIds: ["DGV-ACT-REQUEST-EXPORT", "DGV-ACT-PHYSICALLY-DELETE-DATA", "DGV-ACT-AUTHORIZE-STUDENT-TRANSFER"],
    permissionActionIds: ["DGV-ACT-REQUEST-EXPORT", "DGV-ACT-PHYSICALLY-DELETE-DATA", "DGV-ACT-AUTHORIZE-STUDENT-TRANSFER"],
    stateRefs: ["DGV-OBJ-EXPORT.AVAILABLE", "ACC-OBJ-PLATFORM-IDENTITY.DELETED"],
    scenarioIds: ["DGV-ACT-REQUEST-EXPORT-SCN-SUCCESS", "DGV-ACT-PHYSICALLY-DELETE-DATA-SCN-SUCCESS"],
  },
  "BASE-CH-COMMERCIAL": {
    moduleIds: ["PLAT-001", "PLAT-002", "VIDEO-001"],
    pageIds: ["PLAT-PAGE-SCHOOL-SERVICE-OPERATIONS", "PLAT-PAGE-PHASE-TWO-ENTITLEMENT", "VIDEO-PAGE-CONTROLLED-PLAYBACK"],
    flowIds: ["DF-P2-002", "DF-P2-003"],
    objectIds: ["PLAT-OBJ-SERVICE-PLAN", "PLAT-OBJ-SERVICE-CONTINUITY-WINDOW", "VIDEO-OBJ-QUOTA-LEDGER"],
    actionIds: ["PLAT-ACT-ACTIVATE-SERVICE-PLAN", "PLAT-ACT-OPEN-SERVICE-CONTINUITY", "PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT"],
    permissionActionIds: ["PLAT-ACT-ACTIVATE-SERVICE-PLAN", "PLAT-ACT-OPEN-SERVICE-CONTINUITY", "PLAT-ACT-CREATE-PHASE-TWO-ENTITLEMENT"],
    stateRefs: ["PLAT-OBJ-SERVICE-CONTINUITY-WINDOW.ACTIVITY_PROTECTION_OPEN", "PLAT-OBJ-SERVICE-PLAN.ACTIVE"],
    scenarioIds: ["PLAT-ACT-ACTIVATE-SERVICE-PLAN-SCN-SUCCESS", "PLAT-ACT-OPEN-SERVICE-CONTINUITY-SCN-SUCCESS"],
  },
  "BASE-CH-LAUNCH": {
    moduleIds: ["AUD-001", "PLAT-001"],
    pageIds: ["AUD-PAGE-SEARCH", "PLAT-PAGE-SCHOOL-SERVICE-OPERATIONS"],
    flowIds: ["DF-001"],
    objectIds: ["AUD-OBJ-EVENT", "PLAT-OBJ-SERVICE-PLAN"],
    actionIds: ["AUD-ACT-QUERY-AUDIT", "PLAT-ACT-ACTIVATE-SERVICE-PLAN"],
    permissionActionIds: ["AUD-ACT-QUERY-AUDIT", "PLAT-ACT-ACTIVATE-SERVICE-PLAN"],
    stateRefs: ["AUD-OBJ-EVENT.ACCEPTED", "PLAT-OBJ-SERVICE-PLAN.ACTIVE"],
    scenarioIds: ["AUD-ACT-QUERY-AUDIT-SCN-SUCCESS", "PLAT-ACT-ACTIVATE-SERVICE-PLAN-SCN-SUCCESS"],
  },
  "BASE-CH-PRINCIPLES-AI-NATIVE": {
    moduleIds: ["DGV-001", "GRD-001", "AIX-001"],
    pageIds: ["DGV-PAGE-AI-BOUNDARY", "GRD-PAGE-DECISION", "AIX-PAGE-CONVERSATION"],
    flowIds: ["DF-006"],
    objectIds: ["DGV-OBJ-AI-RULE", "GRD-OBJ-DECISION", "AIX-OBJ-TASK-PREVIEW"],
    actionIds: ["DGV-ACT-CONFIGURE-AI-USE", "GRD-ACT-PROCESS", "AIX-ACT-PREPARE-TASK-PREVIEW"],
    permissionActionIds: ["DGV-ACT-CONFIGURE-AI-USE", "GRD-ACT-PROCESS", "AIX-ACT-PREPARE-TASK-PREVIEW"],
    stateRefs: ["DGV-OBJ-AI-RULE.ACTIVE", "GRD-OBJ-DECISION.AI_DETERMINED"],
    scenarioIds: ["DGV-ACT-CONFIGURE-AI-USE-SCN-SUCCESS", "GRD-ACT-PROCESS-SCN-SUCCESS"],
    testIds: ["BASELINE-AI-NATIVE-FACTS-FIRST"],
  },
  "BASE-CH-PRINCIPLES-CHANGE-CONTROL": {
    moduleIds: ["DGV-001", "AUD-001"],
    pageIds: ["DGV-PAGE-POLICY", "AUD-PAGE-SEARCH"],
    flowIds: ["DF-001"],
    objectIds: ["DGV-OBJ-POLICY", "DGV-OBJ-RETENTION", "AUD-OBJ-EVENT"],
    actionIds: ["DGV-ACT-CONFIGURE-RETENTION", "AUD-ACT-QUERY-AUDIT"],
    permissionActionIds: ["DGV-ACT-CONFIGURE-RETENTION", "AUD-ACT-QUERY-AUDIT"],
    stateRefs: ["DGV-OBJ-POLICY.ACTIVE", "AUD-OBJ-EVENT.ACCEPTED"],
    scenarioIds: ["DGV-ACT-CONFIGURE-RETENTION-SCN-SUCCESS", "AUD-ACT-QUERY-AUDIT-SCN-SUCCESS"],
    testIds: ["BASELINE-CONTROLLED-CHANGE-TRACE"],
  },
  "BASE-CH-CAPABILITY-MAPPING": {
    moduleIds: ["CURR-001", "INS-001", "PLN-001"],
    pageIds: ["CURR-PAGE-MAPPING", "INS-PAGE-PERSONAL-PROGRESS", "PLN-PAGE-CLASS-PROGRESS"],
    flowIds: ["DF-011", "DF-014"],
    objectIds: ["CURR-OBJ-MAPPING", "INS-OBJ-MASTERY-NODE", "PLN-OBJ-CLASS-PROGRESS"],
    actionIds: ["CURR-ACT-PUBLISH-MAPPING", "INS-ACT-VIEW-PERSONAL-PROGRESS", "PLN-ACT-VIEW-CLASS-PROGRESS"],
    permissionActionIds: ["CURR-ACT-PUBLISH-MAPPING", "INS-ACT-VIEW-PERSONAL-PROGRESS", "PLN-ACT-VIEW-CLASS-PROGRESS"],
    stateRefs: ["CURR-OBJ-MAPPING.PUBLISHED", "INS-OBJ-MASTERY-NODE.MASTERED", "PLN-OBJ-CLASS-PROGRESS.ACTIVE"],
    scenarioIds: ["CURR-ACT-PUBLISH-MAPPING-SCN-SUCCESS", "INS-ACT-VIEW-PERSONAL-PROGRESS-SCN-SUCCESS"],
    testIds: ["BASELINE-CAPABILITY-TEXTBOOK-MAPPING"],
  },
  "BASE-CH-LOGIN-RECOVERY": {
    moduleIds: ["ACC-001"],
    pageIds: ["ACC-PAGE-LOGIN-ACCOUNT", "ACC-PAGE-CONTEXT-RECOVERY"],
    flowIds: ["DF-001"],
    objectIds: ["ACC-OBJ-LOGIN-ACCOUNT", "ACC-OBJ-MEMBERSHIP"],
    actionIds: ["ACC-ACT-LOGIN", "ACC-ACT-UPDATE-LOGIN-IDENTIFIERS", "ACC-ACT-UNLOCK-LOGIN-ACCOUNT"],
    permissionActionIds: ["ACC-ACT-LOGIN", "ACC-ACT-UPDATE-LOGIN-IDENTIFIERS", "ACC-ACT-UNLOCK-LOGIN-ACCOUNT"],
    stateRefs: ["ACC-OBJ-LOGIN-ACCOUNT.ACTIVE", "ACC-OBJ-LOGIN-ACCOUNT.LOCKED"],
    scenarioIds: ["ACC-ACT-LOGIN-SCN-SUCCESS", "ACC-ACT-UNLOCK-LOGIN-ACCOUNT-SCN-SUCCESS"],
    testIds: ["BASELINE-LOGIN-IDENTIFIER-RECOVERY"],
  },
  "BASE-CH-ASSESSMENT-RUBRIC": {
    moduleIds: ["HW-001", "GRD-001"],
    pageIds: ["HW-PAGE-AUTHORING", "GRD-PAGE-DECISION"],
    flowIds: ["DF-004", "DF-006"],
    objectIds: ["HW-OBJ-PUBLICATION-SNAPSHOT", "GRD-OBJ-ASSESSMENT-STANDARD-VERSION"],
    actionIds: ["GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD", "GRD-ACT-CHECK-PHASE-TWO-ASSESSMENT-READINESS"],
    permissionActionIds: ["GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD", "GRD-ACT-CHECK-PHASE-TWO-ASSESSMENT-READINESS"],
    stateRefs: ["GRD-OBJ-ASSESSMENT-STANDARD-VERSION.FROZEN"],
    scenarioIds: ["GRD-ACT-GENERATE-FROZEN-ASSESSMENT-STANDARD-SCN-SUCCESS", "GRD-ACT-CHECK-PHASE-TWO-ASSESSMENT-READINESS-SCN-SUCCESS"],
    testIds: ["BASELINE-FROZEN-ASSESSMENT-STANDARD"],
  },
  "BASE-CH-VIDEO-VERIFICATION": {
    moduleIds: ["VIDEO-001"],
    pageIds: ["VIDEO-PAGE-POST-VIDEO-VERIFICATION"],
    flowIds: ["DF-P2-004", "DF-P2-005"],
    objectIds: ["VIDEO-OBJ-VERIFICATION"],
    actionIds: ["VIDEO-ACT-START-NEW-CONTEXT-VERIFICATION", "VIDEO-ACT-COMPLETE-NEW-CONTEXT-VERIFICATION"],
    permissionActionIds: ["VIDEO-ACT-START-NEW-CONTEXT-VERIFICATION", "VIDEO-ACT-COMPLETE-NEW-CONTEXT-VERIFICATION"],
    stateRefs: ["VIDEO-OBJ-VERIFICATION.COMPLETED"],
    scenarioIds: ["VIDEO-ACT-START-NEW-CONTEXT-VERIFICATION-SCN-SUCCESS", "VIDEO-ACT-COMPLETE-NEW-CONTEXT-VERIFICATION-SCN-SUCCESS"],
    testIds: ["BASELINE-VIDEO-UNDERSTANDING-VERIFICATION"],
  },
  "BASE-CH-DUAL-PROGRESS": {
    moduleIds: ["PROG-001", "INS-001", "PLN-001"],
    pageIds: ["PROG-PAGE-STUDENT-CURRENT-TARGET", "INS-PAGE-PERSONAL-PROGRESS", "PLN-PAGE-CLASS-PROGRESS"],
    flowIds: ["DF-P2-001", "DF-014"],
    objectIds: ["PROG-OBJ-STUDENT-TARGET", "INS-OBJ-MASTERY-NODE", "PLN-OBJ-CLASS-PROGRESS"],
    actionIds: ["PROG-ACT-VIEW-CURRENT-TARGET", "INS-ACT-VIEW-PERSONAL-PROGRESS", "PLN-ACT-VIEW-CLASS-PROGRESS"],
    permissionActionIds: ["PROG-ACT-VIEW-CURRENT-TARGET", "INS-ACT-VIEW-PERSONAL-PROGRESS", "PLN-ACT-VIEW-CLASS-PROGRESS"],
    stateRefs: ["PROG-OBJ-STUDENT-TARGET.IN_PROGRESS", "INS-OBJ-MASTERY-NODE.LEARNING", "PLN-OBJ-CLASS-PROGRESS.ACTIVE"],
    scenarioIds: ["PROG-ACT-VIEW-CURRENT-TARGET-SCN-SUCCESS", "INS-ACT-VIEW-PERSONAL-PROGRESS-SCN-SUCCESS", "PLN-ACT-VIEW-CLASS-PROGRESS-SCN-SUCCESS"],
    testIds: ["BASELINE-DUAL-PROGRESS-SEPARATION"],
  },
  "BASE-CH-DOCUMENT-REPOSITORY-BOUNDARY": {
    testIds: ["BASELINE-DOCUMENT-REPOSITORY-BOUNDARY"],
  },
});

const ALL_METRIC_IDS = Object.freeze(metricGroups.flatMap(({ metricIds }) => metricIds));
const ALL_LAUNCH_GATE_IDS = Object.freeze([
  "GATE-ZERO-TOLERANCE",
  "GATE-QUALITY-THRESHOLD",
  "GATE-EVIDENCE-COMPLETENESS",
]);

const CHAPTER_METRIC_IDS = new Map([
  ["BASE-CH-LAUNCH", ALL_METRIC_IDS],
  ["BASE-CH-METRICS", ALL_METRIC_IDS],
]);
const CHAPTER_LAUNCH_GATE_IDS = new Map([
  ["BASE-CH-LAUNCH", ALL_LAUNCH_GATE_IDS],
  ["BASE-CH-LAUNCH-GATES", ALL_LAUNCH_GATE_IDS],
]);

const DIRECT_CONTRACT_AXES = Object.freeze([
  "moduleIds",
  "pageIds",
  "flowIds",
  "objectIds",
  "actionIds",
  "permissionRefs",
  "stateRefs",
  "scenarioIds",
]);

const CHAPTER_DIRECT_APPLICABLE_AXIS_OVERRIDES = Object.freeze({
  "BASE-CH-PRINCIPLES": DIRECT_CONTRACT_AXES,
  "BASE-CH-SCOPE-PHASES": DIRECT_CONTRACT_AXES,
  "BASE-CH-DATA-KNOWLEDGE": DIRECT_CONTRACT_AXES,
  "BASE-CH-SCHOOL-GOVERNANCE": DIRECT_CONTRACT_AXES,
  "BASE-CH-IDENTITY-GUARDIAN": DIRECT_CONTRACT_AXES,
  "BASE-CH-ROLE": DIRECT_CONTRACT_AXES,
  "BASE-CH-TEACHER-EXPERIENCE": ["moduleIds", "pageIds", "objectIds", "actionIds", "permissionRefs", "stateRefs", "scenarioIds"],
  "BASE-CH-ACTIVITY-EVIDENCE": DIRECT_CONTRACT_AXES,
  "BASE-CH-AI-ASSESSMENT": DIRECT_CONTRACT_AXES,
  "BASE-CH-VIDEO": DIRECT_CONTRACT_AXES,
  "BASE-CH-PROGRESS": DIRECT_CONTRACT_AXES,
  "BASE-CH-MASTERY-VISIBILITY": DIRECT_CONTRACT_AXES,
  "BASE-CH-CORRECTION-REVIEW": DIRECT_CONTRACT_AXES,
  "BASE-CH-DATA-RIGHTS": DIRECT_CONTRACT_AXES,
  "BASE-CH-COMMERCIAL": DIRECT_CONTRACT_AXES,
  "BASE-CH-LAUNCH": [...DIRECT_CONTRACT_AXES, "metricIds", "launchGateIds"],
  "BASE-CH-PRINCIPLES-AI-NATIVE": [...DIRECT_CONTRACT_AXES, "testIds"],
  "BASE-CH-PRINCIPLES-CHANGE-CONTROL": [...DIRECT_CONTRACT_AXES, "testIds"],
  "BASE-CH-CAPABILITY-MAPPING": [...DIRECT_CONTRACT_AXES, "testIds"],
  "BASE-CH-LOGIN-RECOVERY": [...DIRECT_CONTRACT_AXES, "testIds"],
  "BASE-CH-ASSESSMENT-RUBRIC": [...DIRECT_CONTRACT_AXES, "testIds"],
  "BASE-CH-VIDEO-VERIFICATION": [...DIRECT_CONTRACT_AXES, "testIds"],
  "BASE-CH-DUAL-PROGRESS": [...DIRECT_CONTRACT_AXES, "testIds"],
  "BASE-CH-METRICS": ["metricIds"],
  "BASE-CH-LAUNCH-GATES": ["launchGateIds"],
  "BASE-CH-DOCUMENT-REPOSITORY-BOUNDARY": ["testIds"],
});

export const chapterDirectAxisDeclarations = deepFreeze(Object.fromEntries(
  baselineChapters.map(({ id }) => [
    id,
    [...(CHAPTER_DIRECT_APPLICABLE_AXIS_OVERRIDES[id] ?? [])],
  ]),
));

for (const chapter of baselineChapters) {
  const declared = new Set(chapterDirectAxisDeclarations[chapter.id]);
  for (const axisKey of TRACE_AXIS_KEYS) {
    const sourceKey = axisKey === "permissionRefs" ? "permissionActionIds" : axisKey;
    const directReferences = axisKey === "metricIds"
      ? CHAPTER_METRIC_IDS.get(chapter.id) ?? []
      : axisKey === "launchGateIds"
        ? CHAPTER_LAUNCH_GATE_IDS.get(chapter.id) ?? []
        : CHAPTER_BINDINGS[chapter.id]?.[sourceKey] ?? [];
    if (declared.has(axisKey) !== (directReferences.length > 0)) {
      throw new Error(`${chapter.id}.${axisKey} direct references and explicit applicability declaration differ`);
    }
  }
}
function unique(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))];
}

function phaseReleaseStatuses(phaseIds) {
  return unique(phaseIds.map((phaseId) => (
    phaseId === "PHASE-1" ? RELEASE_STATUS.BUILD_READY : RELEASE_STATUS.PLANNED
  )));
}

function actionIndex(modules) {
  return new Map(list(modules).flatMap((module) => (
    list(module.actions).map((action) => [action.id, action])
  )));
}

function permissionRefsForActionIds(actionIds, actions) {
  const refs = [];
  for (const actionId of unique(actionIds)) {
    const action = actions.get(actionId);
    for (const effect of unique(list(action?.permissions).map(({ effect }) => effect))) {
      refs.push({ actionId, effect });
    }
  }
  return refs;
}

function migrationsForDecision(decisionId) {
  return migrationChanges.filter(({ decisionIds }) => list(decisionIds).includes(decisionId));
}

function decisionSourcesFromMigrations(migrations, decisionId) {
  return migrations.map((migration) => migration.decisionAffected?.[decisionId]).filter(Boolean);
}

function impactFromDecisionSources(sources, key) {
  return unique(sources.flatMap(({ affected }) => list(affected?.[key])));
}

export function buildDecisionTraceability(modules) {
  const actions = actionIndex(modules);
  return deepFreeze(productDecisions.map((decision) => {
    const migrations = migrationsForDecision(decision.id);
    const sources = decisionSourcesFromMigrations(migrations, decision.id);
    const permissionActionIds = impactFromDecisionSources(sources, "permissionActionIds");
    const trace = {
      id: `DECISION-TRACE-${decision.id}`,
      decisionId: decision.id,
      migrationIds: migrations.map(({ id }) => id),
      chapterIds: [...decision.chapterIds],
      phaseIds: [...decision.phaseIds],
      releaseStatuses: phaseReleaseStatuses(decision.phaseIds),
      moduleIds: impactFromDecisionSources(sources, "moduleIds"),
      pageIds: impactFromDecisionSources(sources, "pageIds"),
      flowIds: impactFromDecisionSources(sources, "flowIds"),
      objectIds: impactFromDecisionSources(sources, "objectIds"),
      actionIds: impactFromDecisionSources(sources, "actionIds"),
      permissionRefs: permissionRefsForActionIds(permissionActionIds, actions),
      stateRefs: impactFromDecisionSources(sources, "stateRefs"),
      metricIds: impactFromDecisionSources(sources, "metricIds"),
      launchGateIds: impactFromDecisionSources(sources, "launchGateIds"),
      scenarioIds: impactFromDecisionSources(sources, "scenarioIds"),
      testIds: impactFromDecisionSources(sources, "testIds"),
    };
    return {
      ...trace,
      axisApplicability: composeAxisApplicability(
        sources.map(({ axisApplicability }) => axisApplicability),
        decision.id,
      ),
    };
  }));
}

const chapterById = new Map(baselineChapters.map((chapter) => [chapter.id, chapter]));

function chapterDecisionIds(chapter) {
  const ids = productDecisions
    .filter((decision) => list(decision.chapterIds).includes(chapter.id))
    .map((decision) => decision.id);
  for (const child of baselineChapters.filter(({ parentId }) => parentId === chapter.id)) {
    ids.push(...chapterDecisionIds(child));
  }
  return unique(ids);
}

function directChapterRefs(chapter, key) {
  return unique(list(CHAPTER_BINDINGS[chapter.id]?.[key]));
}

function directChapterAxisDeclaration(chapter) {
  const applicableAxes = new Set(chapterDirectAxisDeclarations[chapter.id] ?? []);
  return Object.fromEntries(TRACE_AXIS_KEYS.map((axisKey) => {
    const metadata = TRACE_AXIS_METADATA[axisKey];
    return [axisKey, applicableAxes.has(axisKey) ? {
      status: TRACE_AXIS_STATUS.APPLICABLE,
      reasonCode: metadata.applicableReasonCode,
      reason: `${chapter.id} 在章节源合同中显式绑定${metadata.label}引用。`,
    } : {
      status: TRACE_AXIS_STATUS.NOT_APPLICABLE,
      reasonCode: metadata.notApplicableReasonCode,
      reason: `${chapter.id} 的章节直属合同未声明${metadata.label}影响；是否适用仅由显式决策来源补充。`,
    }];
  }));
}

export function buildBaselineTraceability(modules, decisionTraceability) {
  const actions = actionIndex(modules);
  const decisionTraceById = new Map(list(decisionTraceability).map((trace) => [
    trace.decisionId,
    trace,
  ]));
  return deepFreeze(baselineChapters.map((chapter) => {
    const decisionIds = chapterDecisionIds(chapter);
    const decisionTraces = decisionIds.map((decisionId) => decisionTraceById.get(decisionId))
      .filter(Boolean);
    const refs = (key) => unique([
      ...decisionTraces.flatMap((trace) => list(trace[key])),
      ...directChapterRefs(chapter, key),
    ]);
    const permissionRefs = [
      ...decisionTraces.flatMap((trace) => list(trace.permissionRefs)),
      ...permissionRefsForActionIds(
        directChapterRefs(chapter, "permissionActionIds"),
        actions,
      ),
    ];
    const trace = {
      id: `TRACE-${chapter.id}`,
      chapterId: chapter.id,
      decisionIds,
      phaseIds: [...chapter.phaseIds],
      releaseStatuses: phaseReleaseStatuses(chapter.phaseIds),
      moduleIds: refs("moduleIds"),
      pageIds: refs("pageIds"),
      flowIds: refs("flowIds"),
      objectIds: refs("objectIds"),
      actionIds: refs("actionIds"),
      permissionRefs: [...new Map(permissionRefs.map((ref) => (
        [`${ref.actionId}:${ref.effect}`, ref]
      ))).values()],
      stateRefs: refs("stateRefs"),
      metricIds: unique([
        ...refs("metricIds"),
        ...(CHAPTER_METRIC_IDS.get(chapter.id) ?? []),
      ]),
      launchGateIds: unique([
        ...refs("launchGateIds"),
        ...(CHAPTER_LAUNCH_GATE_IDS.get(chapter.id) ?? []),
      ]),
      scenarioIds: refs("scenarioIds"),
      testIds: refs("testIds"),
    };
    return {
      ...trace,
      axisApplicability: composeAxisApplicability([
        directChapterAxisDeclaration(chapter),
        ...decisionTraces.map(({ axisApplicability }) => axisApplicability),
      ], chapter.id),
    };
  }));
}

export function assertTraceabilitySourceCoverage(readmeText) {
  if (typeof readmeText !== "string") return false;
  const actualHeadings = readmeText.split(/\r?\n/).flatMap((line, index) => {
    const match = line.match(/^(##|###)\s+(.+?)\s*$/);
    return match ? [{ level: match[1].length, title: match[2], line: index + 1 }] : [];
  });
  const expectedHeadings = baselineChapters.map((chapter) => ({
    level: chapter.level,
    title: chapter.heading,
    line: chapter.sourceLine,
  }));
  return actualHeadings.length === expectedHeadings.length
    && expectedHeadings.every((expected, index) => (
      actualHeadings[index]?.level === expected.level
      && actualHeadings[index]?.title === expected.title
      && actualHeadings[index]?.line === expected.line
      && chapterById.has(baselineChapters[index].id)
    ));
}
