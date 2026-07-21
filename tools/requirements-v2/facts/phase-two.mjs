import {
  CLIENT,
  PHASE,
  RELEASE_STATUS,
  RISK,
  deepFreeze,
  defineModule,
} from "../model.mjs";
import { withStudentDataClassification } from "./student-data-classification.mjs";

const WEB_APP = [CLIENT.WEB, CLIENT.APP];
const USER_TASK = "USER_TASK";
const SYSTEM_EVENT = "SYSTEM_EVENT";
const FLOW_INTERNAL = "FLOW_INTERNAL";

function optionSet(id, key, label, entries) {
  return {
    id,
    key,
    label,
    mode: "STATIC",
    values: entries.map(([code, valueLabel]) => ({ code, label: valueLabel })),
  };
}

function field(id, label, overrides = {}) {
  return {
    id,
    label,
    dataType: "STRING",
    required: true,
    valueSource: { kind: "USER_INPUT" },
    mutability: "EDITABLE",
    visibility: "AUTHORIZED_SCOPE",
    validation: "must match the declared data type and the current authorized object scope",
    historyPolicy: "retain the accepted value with its source and object version",
    ...overrides,
  };
}

function identityField(id, label) {
  return field(id, label, {
    dataType: "ID",
    valueSource: { kind: "SYSTEM" },
    mutability: "IMMUTABLE",
    idempotencyRole: "OBJECT_ID",
  });
}

function objectVersionField(id, label) {
  return field(id, label, {
    dataType: "INTEGER",
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    idempotencyRole: "OBJECT_VERSION",
  });
}

function systemField(id, label, dataType = "STRING", overrides = {}) {
  return field(id, label, {
    dataType,
    valueSource: { kind: "SYSTEM" },
    mutability: "SYSTEM_MANAGED",
    ...overrides,
  });
}

function identityRefField(id, label, targetObjectId, overrides = {}) {
  return field(id, label, {
    dataType: "ID",
    valueSource: { kind: "OBJECT_REF", targetObjectId },
    mutability: "IMMUTABLE",
    referenceIntegrity: "IDENTITY_ONLY",
    idempotencyRole: "OBJECT_REF",
    ...overrides,
  });
}

function pinnedReference({
  refFieldId,
  refLabel,
  versionFieldId,
  versionLabel,
  targetObjectId,
  targetVersionFieldId,
  required = true,
}) {
  return {
    fields: [
      field(refFieldId, refLabel, {
        dataType: "ID",
        required,
        valueSource: { kind: "OBJECT_REF", targetObjectId },
        mutability: "IMMUTABLE",
        referenceIntegrity: "VERSION_PINNED",
        stateGuardPolicy: "NONE",
        actionApplicability: { requiredActionIds: [] },
        versionBinding: { versionFieldId, targetVersionFieldId },
      }),
      systemField(versionFieldId, versionLabel, "INTEGER", {
        required,
        mutability: "IMMUTABLE",
      }),
    ],
    binding: {
      refFieldId,
      versionFieldId,
      targetObjectId,
      targetVersionFieldId,
    },
  };
}

function domainObject({
  id,
  label,
  dataSubject,
  controlSubject = "SCHOOL",
  producerRef,
  ownerRef,
  confirmerRef,
  stewardRef,
  lifecyclePolicyId = "LIFE-003",
  sensitivityId = "S4",
  states,
  fields,
  identityFieldId,
  overrides = {},
}) {
  const identityFields = fields.filter(({ id: fieldId, idempotencyRole }) => (
    fieldId === identityFieldId || idempotencyRole === "OBJECT_ID"
  ));
  if (identityFields.length !== 1 || identityFields[0].id !== identityFieldId) {
    throw new Error(`${id} requires one explicit object identity field`);
  }
  return withStudentDataClassification({
    id,
    label,
    dataSubject,
    controlSubject,
    producerRef,
    ownerRef,
    confirmerRef,
    stewardRef,
    lifecyclePolicyId,
    sensitivityId,
    stateReachability: { mode: "ACTION_GRAPH", initialStateIds: [] },
    states,
    fields,
    ...overrides,
  });
}

function actorReference(actorRef) {
  if (actorRef.startsWith("DUTY-")) return { dutyRef: actorRef };
  if (actorRef.startsWith("ROLE-")) return { roleRef: actorRef };
  return { actorRef };
}

function permission(effect, actorRef, condition, scope) {
  return {
    effect,
    ...actorReference(actorRef),
    condition,
    ...(scope ? { scope } : {}),
  };
}

function action({
  id,
  label,
  targetObjectId,
  operationKind,
  inputFieldIds = [],
  outputFieldIds = [],
  permissions,
  transition,
  successState,
  successStates,
  successData,
  failureResults,
  failureOutcomes = {},
  acceptedInputValues,
  clients = WEB_APP,
  executionMode = USER_TASK,
  trigger,
  risk,
}) {
  const writes = operationKind !== "READ";
  const effectiveRisk = risk ?? (writes ? RISK.LOW : RISK.READ);
  const defaultFailures = writes
    ? ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT"]
    : ["PERMISSION_DENIED", "NOT_FOUND"];
  const effectiveFailures = [...new Set([
    ...(failureResults ?? defaultFailures),
    ...(effectiveRisk === RISK.HIGH ? ["AUDIT_FAILED"] : []),
  ])];
  const states = successStates ?? [successState ?? transition?.to];
  const stateOutcome = (state) => state
    ? { mode: "STATE", value: state }
    : { mode: "UNCHANGED" };
  const successScenarios = states.map((state) => ({
    id: states.length === 1 ? `${id}-SCN-SUCCESS` : `${id}-SCN-SUCCESS-${state}`,
    kind: "SUCCESS",
    actionId: id,
    ...(executionMode === USER_TASK ? {} : { trigger }),
    given: `the source versions, authorization, and entry conditions for ${label} remain valid`,
    when: `the authorized actor requests ${label}`,
    then: {
      expectedData: successData ?? `${label} returns the accepted versioned result`,
      expectedState: stateOutcome(state),
      expectedPermission: "ALLOW",
      expectedVisibility: "only the authorized student, school, and source-right scope",
    },
  }));
  const failureScenarios = effectiveFailures.map((resultCode) => {
    const outcome = failureOutcomes[resultCode] ?? {};
    return {
      id: `${id}-SCN-${resultCode}`,
      kind: outcome.kind ?? "FAILURE",
      resultCode,
      actionId: id,
      ...(executionMode === USER_TASK ? {} : { trigger }),
      given: outcome.given ?? `${resultCode} applies to ${label}`,
      when: outcome.when ?? `the authorized actor requests ${label}`,
      then: {
        expectedData: outcome.expectedData
          ?? `${label} returns ${resultCode}, exposes no unauthorized data, and performs no hidden write`,
        expectedState: stateOutcome(outcome.expectedState),
        expectedPermission: outcome.expectedPermission ?? "DENY",
        expectedVisibility: outcome.expectedVisibility ?? "no data outside the authorized scope",
      },
    };
  });
  return {
    action: {
      id,
      label,
      targetObjectId,
      inputFieldIds,
      outputFieldIds,
      ...(acceptedInputValues ? { acceptedInputValues } : {}),
      ...(transition ? { transition } : {}),
      operationKind,
      writes,
      risk: effectiveRisk,
      executionMode,
      ...(executionMode === USER_TASK ? { clients } : { trigger }),
      permissions,
      scenarioIds: [
        ...successScenarios.map(({ id: scenarioId }) => scenarioId),
        ...failureScenarios.map(({ id: scenarioId }) => scenarioId),
      ],
      ...(writes ? { idempotencyKey: `${id}:school:service-scope:object-version:request-id` } : {}),
      auditMode: writes ? "REQUIRED" : "NOT_REQUIRED",
      failureResults: effectiveFailures,
    },
    scenarios: [...successScenarios, ...failureScenarios],
  };
}

function page(id, label, objectIds, fieldIds, actionIds, clients = WEB_APP) {
  return {
    id,
    label,
    availability: RELEASE_STATUS.PLANNED,
    clients,
    objectIds,
    fieldIds,
    actionIds,
    regions: ["CURRENT_CONTEXT", "PRIMARY_TASK", "SOURCE_AND_GATE_STATUS", "NEXT_ACTION"],
    viewStates: [
      "LOADING",
      "READY",
      "EMPTY",
      "ERROR",
      "FORBIDDEN",
      "STALE_VERSION",
      "PROCESSING",
      "BLOCKED",
      "RECALLED",
      "LOW_BANDWIDTH",
    ],
  };
}

function moduleFact({ actionFacts, pages, ...module }) {
  const pageByActionId = new Map();
  for (const pageValue of pages) {
    for (const actionId of pageValue.actionIds) pageByActionId.set(actionId, pageValue.id);
  }
  const readObjectIds = new Set(actionFacts
    .map(({ action: value }) => value)
    .filter(({ operationKind }) => operationKind === "READ")
    .map(({ targetObjectId }) => targetObjectId));
  return defineModule({
    ...module,
    objects: module.objects.map((value) => ({
      ...value,
      readMode: value.readMode
        ?? (readObjectIds.has(value.id) ? "AUTHORIZED" : "NO_DIRECT_READ"),
    })),
    actions: actionFacts.map(({ action: value }) => value),
    pages,
    scenarios: actionFacts.flatMap(({ action: value, scenarios }) => scenarios.map((scenario) => (
      value.executionMode === USER_TASK
        ? { ...scenario, pageId: pageByActionId.get(value.id) }
        : scenario
    ))),
  });
}

export const phaseTwoOptionSets = deepFreeze([
  optionSet("OPT-P2-PROG-TARGET-STATUS", "phaseTwoTargetStatus", "第二阶段目标状态", [
    ["NOT_STARTED", "未开始"],
    ["IN_PROGRESS", "学习中"],
    ["PENDING_COMPLETION_EVIDENCE", "待完成证据"],
    ["COMPLETED", "已完成"],
    ["PAUSED", "已暂停"],
  ]),
  optionSet("OPT-P2-PROG-STUDENT-CHOICE", "phaseTwoNextTargetChoice", "学生下一目标选择", [
    ["CONTINUE", "继续下一目标"],
    ["NOT_NOW", "暂不继续"],
  ]),
  optionSet("OPT-P2-VIDEO-REQUEST-KIND", "phaseTwoVideoRequestKind", "教学视频请求类型", [
    ["PROBLEM_DRIVEN", "问题驱动"],
    ["PROGRESS_DRIVEN", "学习进度驱动"],
  ]),
  optionSet("OPT-P2-VIDEO-GATE-STATUS", "phaseTwoVideoGateStatus", "教学视频闸门状态", [
    ["PENDING", "待检查"],
    ["PASSED", "已通过"],
    ["FAILED", "未通过"],
    ["UNAVAILABLE", "检查不可用"],
  ]),
  optionSet("OPT-P2-VIDEO-DELIVERY-STATUS", "phaseTwoVideoDeliveryStatus", "教学视频交付状态", [
    ["NOT_DELIVERED", "未交付"],
    ["DELIVERED", "已交付"],
    ["GATE_BLOCKED", "闸门阻断"],
    ["RECALLED", "已召回"],
  ]),
  optionSet("OPT-P2-VIDEO-QUOTA-SOURCE", "phaseTwoVideoQuotaSource", "教学视频额度来源", [
    ["STUDENT_MINIMUM", "学生最低保障"],
    ["SCHOOL_OVERFLOW", "学校共享溢出池"],
  ]),
  optionSet("OPT-P2-VIDEO-QUOTA-PRIORITY", "phaseTwoVideoQuotaPriority", "教学视频额度优先级", [
    ["PROBLEM_REMEDIATION", "问题补救"],
    ["PROGRESS_CORE", "进度核心学习"],
    ["NONESSENTIAL", "非必要生成"],
  ]),
  optionSet("OPT-P2-VIDEO-RELEASE-REASON", "phaseTwoVideoQuotaReleaseReason", "教学视频额度释放原因", [
    ["PLATFORM_FAILURE", "平台失败"],
    ["GATE_BLOCK", "必要闸门阻断"],
    ["CONTENT_RECALL", "内容召回"],
    ["AUTOMATIC_RETRY", "自动重试"],
  ]),
  optionSet("OPT-P2-VIDEO-DOWNLOAD-POLICY", "phaseTwoVideoDownloadPolicy", "个性化视频下载策略", [
    ["BLOCK_PRODUCT_ORDINARY_DOWNLOAD", "产品不提供普通文件下载"],
  ]),
  optionSet("OPT-P2-VIDEO-EXTERNAL-RECORDING-BOUNDARY", "phaseTwoVideoExternalRecordingBoundary", "外部录制能力边界", [
    ["NO_PREVENTION_CLAIM", "不承诺阻止外部录屏或拍摄"],
  ]),
  optionSet("OPT-P2-VIDEO-REQUESTER-KIND", "phaseTwoVideoRequesterKind", "教学视频请求人类型", [
    ["STUDENT", "学生本人"],
    ["SUBJECT_TEACHER", "对应任课教师"],
  ]),
  optionSet("OPT-P2-VIDEO-SERVICE-AUDIENCE", "phaseTwoVideoServiceAudience", "教学视频服务对象类型", [
    ["INDIVIDUAL_STUDENT", "单个学生"],
    ["CLASS", "班级"],
    ["STUDENT_GROUP", "有界学生群体"],
  ]),
  optionSet("OPT-P2-VIDEO-MANAGEMENT-SCOPE", "phaseTwoVideoManagementScope", "教学视频管理范围", [
    ["STUDENT_PERSONAL_LEARNING", "学生个人学习资产管理"],
    ["SCHOOL_PRIVATE_TEACHING", "学校私有教学资产管理"],
  ]),
  optionSet("OPT-P2-VIDEO-ACCESS-DOMAIN", "phaseTwoVideoAccessDomain", "教学视频访问域", [
    ["STUDENT_PERSONAL", "学生个人学习访问域"],
    ["SCHOOL_PRIVATE", "学校私有教学访问域"],
  ]),
  optionSet("OPT-P2-VIDEO-ACCESS-SCOPE", "phaseTwoVideoAccessScope", "教学视频访问范围", [
    ["SERVICED_STUDENT_ONLY", "仅服务学生本人"],
    ["AUTHORIZED_CLASS_OR_GROUP", "授权班级或学生群体"],
  ]),
  optionSet("OPT-P2-VIDEO-VERIFICATION-TARGET-KIND", "phaseTwoVideoVerificationTargetKind", "观看后验证目标类型", [
    ["CONCEPT", "概念"],
    ["CAUSAL", "因果"],
    ["LOGIC", "逻辑"],
    ["METHOD", "方法"],
    ["CHARACTER", "汉字"],
    ["WORD", "单词"],
    ["FIXED_COLLOCATION", "固定搭配"],
    ["MECHANICAL_FLUENCY", "机械熟练度"],
  ]),
  optionSet("OPT-P2-VIDEO-VERIFICATION-STRATEGY", "phaseTwoVideoVerificationStrategy", "观看后验证策略", [
    ["ADAPTIVE_NEW_CONTEXT", "目标适配的新情境验证"],
    ["FEYNMAN_ON_DEMAND", "按需费曼验证"],
    ["RETRIEVAL_PRACTICE", "提取练习"],
    ["SPACED_REVIEW", "间隔复习"],
  ]),
  optionSet("OPT-P2-VIDEO-VERIFICATION-MODALITY", "phaseTwoVideoVerificationModality", "观看后验证方式", [
    ["TEXT", "文字"],
    ["MATH_HANDWRITING", "数学手写过程"],
    ["STRUCTURED_QA", "结构化问答"],
    ["VARIANT_PRACTICE", "变式练习"],
    ["VOICE_OPTIONAL", "可选语音"],
  ]),
  optionSet("OPT-P2-VIDEO-FIRST-PROMPT-POLICY", "phaseTwoVideoFirstPromptPolicy", "首次表达提示策略", [
    ["NO_ANSWER_HINT_BEFORE_FIRST_EXPRESSION", "首次独立表达前不提供答案式提示"],
  ]),
  optionSet("OPT-P2-VIDEO-VERIFICATION-RESULT", "phaseTwoVideoVerificationResult", "新情境验证结果", [
    ["DEMONSTRATED_IN_NEW_CONTEXT", "在本次新情境中表现出理解"],
    ["NEEDS_RETEACHING", "需要返回缺口教学"],
    ["UNDETERMINED", "本次无法判断"],
  ]),
  optionSet("OPT-P2-VIDEO-NONKNOWLEDGE-SIGNAL", "phaseTwoVideoNonKnowledgeSignal", "不得直接形成知识缺口的信号", [
    ["ACCENT", "口音"],
    ["FLUENCY", "表达流利度"],
    ["SPEECH_RECOGNITION_ERROR", "语音识别错误"],
  ]),
]);

const progressContextRef = pinnedReference({
  refFieldId: "PROG-SNAPSHOT-F-WORK-CONTEXT-REF",
  refLabel: "Pinned Current School Work Context",
  versionFieldId: "PROG-SNAPSHOT-F-WORK-CONTEXT-VERSION",
  versionLabel: "Pinned Work Context Version",
  targetObjectId: "ACC-OBJ-CONTEXT",
  targetVersionFieldId: "ACC-CONTEXT-F-CONTEXT-VERSION",
});
const progressSchoolRef = pinnedReference({
  refFieldId: "PROG-SNAPSHOT-F-SCHOOL-PROFILE-REF",
  refLabel: "Pinned Current School Profile",
  versionFieldId: "PROG-SNAPSHOT-F-SCHOOL-PROFILE-VERSION",
  versionLabel: "Pinned School Profile Version",
  targetObjectId: "ACC-OBJ-SCHOOL-PROFILE",
  targetVersionFieldId: "ACC-PROFILE-F-VERSION",
});
const progressCurriculumRef = pinnedReference({
  refFieldId: "PROG-SNAPSHOT-F-CURRICULUM-REF",
  refLabel: "Pinned Curriculum Version",
  versionFieldId: "PROG-SNAPSHOT-F-CURRICULUM-VERSION",
  versionLabel: "Pinned Curriculum Version Number",
  targetObjectId: "CURR-OBJ-CURRICULUM",
  targetVersionFieldId: "CURR-CURRICULUM-F-VERSION",
});
const progressMappingRef = pinnedReference({
  refFieldId: "PROG-SNAPSHOT-F-TARGET-MAPPING-REF",
  refLabel: "Pinned Unit and Target Mapping",
  versionFieldId: "PROG-SNAPSHOT-F-TARGET-MAPPING-VERSION",
  versionLabel: "Pinned Unit and Target Mapping Version",
  targetObjectId: "CURR-OBJ-MAPPING",
  targetVersionFieldId: "CURR-MAPPING-F-VERSION",
});

const progressSnapshotFields = [
  identityField("PROG-SNAPSHOT-F-ID", "Progress Source Snapshot ID"),
  ...progressContextRef.fields,
  ...progressSchoolRef.fields,
  identityRefField("PROG-SNAPSHOT-F-GRADE-REF", "Current Grade", "ORG-OBJ-GRADE"),
  identityRefField("PROG-SNAPSHOT-F-COURSE-REF", "Current Course", "ORG-OBJ-COURSE"),
  systemField("PROG-SNAPSHOT-F-COURSE-SOURCE-VERSION", "Pinned Course Source Version", "INTEGER", {
    mutability: "IMMUTABLE",
    validation: "must pin the effective school, term, course, and course-source digest used for this snapshot",
  }),
  ...progressCurriculumRef.fields,
  identityRefField("PROG-SNAPSHOT-F-UNIT-REF", "Current Unit", "CURR-OBJ-CHAPTER"),
  systemField("PROG-SNAPSHOT-F-UNIT-SOURCE-VERSION", "Pinned Unit Source Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  identityRefField("PROG-SNAPSHOT-F-TARGET-REF", "Current Learning Target", "CURR-OBJ-KNOWLEDGE-POINT"),
  systemField("PROG-SNAPSHOT-F-TARGET-SOURCE-VERSION", "Pinned Learning Target Source Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  ...progressMappingRef.fields,
  systemField("PROG-SNAPSHOT-F-PREREQUISITE-TARGET-REFS", "Pinned Prerequisite Target References", "STRING_ARRAY", {
    mutability: "IMMUTABLE",
  }),
  systemField("PROG-SNAPSHOT-F-PREREQUISITE-TARGET-VERSIONS", "Pinned Prerequisite Target Versions", "JSON", {
    mutability: "IMMUTABLE",
    validation: "must provide one immutable source version for every prerequisite target reference",
  }),
  identityRefField("PROG-SNAPSHOT-F-NEXT-ALLOWED-TARGET-REF", "Next Allowed Learning Target", "CURR-OBJ-KNOWLEDGE-POINT"),
  systemField("PROG-SNAPSHOT-F-NEXT-ALLOWED-TARGET-VERSION", "Next Allowed Target Source Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  systemField("PROG-SNAPSHOT-F-STATUS", "Progress Source Snapshot Status", "STRING", {
    mutability: "SYSTEM_MANAGED",
  }),
  objectVersionField("PROG-SNAPSHOT-F-VERSION", "Progress Source Snapshot Version"),
];

const progressTargetSnapshotRef = pinnedReference({
  refFieldId: "PROG-TARGET-F-SNAPSHOT-REF",
  refLabel: "Pinned Course Target Snapshot",
  versionFieldId: "PROG-TARGET-F-SNAPSHOT-VERSION",
  versionLabel: "Pinned Course Target Snapshot Version",
  targetObjectId: "PROG-OBJ-COURSE-TARGET-SNAPSHOT",
  targetVersionFieldId: "PROG-SNAPSHOT-F-VERSION",
});
const progressCompletionEvidenceRef = pinnedReference({
  refFieldId: "PROG-TARGET-F-COMPLETION-EVIDENCE-REF",
  refLabel: "Current Target Completion Evidence",
  versionFieldId: "PROG-TARGET-F-COMPLETION-EVIDENCE-VERSION",
  versionLabel: "Current Target Completion Evidence Version",
  targetObjectId: "PUB-OBJ-RESULT",
  targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
  required: false,
});
const progressTargetFields = [
  identityField("PROG-TARGET-F-ID", "Student Current Target ID"),
  identityRefField("PROG-TARGET-F-STUDENT-REF", "Student", "ORG-OBJ-STUDENT"),
  ...progressTargetSnapshotRef.fields,
  systemField("PROG-TARGET-F-STATUS", "Current Target Status", "STRING", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-PROG-TARGET-STATUS" },
  }),
  ...progressCompletionEvidenceRef.fields,
  systemField("PROG-TARGET-F-STATUS-AT", "Current Target Status Time", "DATETIME", {
    mutability: "IMMUTABLE",
  }),
  objectVersionField("PROG-TARGET-F-VERSION", "Student Current Target Version"),
];

const progressChoiceCurrentTargetRef = pinnedReference({
  refFieldId: "PROG-CHOICE-F-CURRENT-TARGET-REF",
  refLabel: "Pinned Completed Current Target",
  versionFieldId: "PROG-CHOICE-F-CURRENT-TARGET-VERSION",
  versionLabel: "Pinned Completed Current Target Version",
  targetObjectId: "PROG-OBJ-STUDENT-TARGET",
  targetVersionFieldId: "PROG-TARGET-F-VERSION",
});
const progressChoiceEvidenceRef = pinnedReference({
  refFieldId: "PROG-CHOICE-F-COMPLETION-EVIDENCE-REF",
  refLabel: "Pinned Current Target Completion Evidence",
  versionFieldId: "PROG-CHOICE-F-COMPLETION-EVIDENCE-VERSION",
  versionLabel: "Pinned Completion Evidence Version",
  targetObjectId: "PUB-OBJ-RESULT",
  targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
});
const progressChoiceNextSnapshotRef = pinnedReference({
  refFieldId: "PROG-CHOICE-F-NEXT-SNAPSHOT-REF",
  refLabel: "Pinned Next Allowed Target Snapshot",
  versionFieldId: "PROG-CHOICE-F-NEXT-SNAPSHOT-VERSION",
  versionLabel: "Pinned Next Allowed Target Snapshot Version",
  targetObjectId: "PROG-OBJ-COURSE-TARGET-SNAPSHOT",
  targetVersionFieldId: "PROG-SNAPSHOT-F-VERSION",
});
const progressChoiceFields = [
  identityField("PROG-CHOICE-F-ID", "Next Target Choice ID"),
  identityRefField("PROG-CHOICE-F-STUDENT-REF", "Choosing Student", "ORG-OBJ-STUDENT"),
  ...progressChoiceCurrentTargetRef.fields,
  ...progressChoiceEvidenceRef.fields,
  ...progressChoiceNextSnapshotRef.fields,
  field("PROG-CHOICE-F-STUDENT-CHOICE", "Student Next Target Choice", {
    required: false,
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-PROG-STUDENT-CHOICE" },
  }),
  systemField("PROG-CHOICE-F-PROPOSED-AT", "Next Target Proposed Time", "DATETIME", {
    mutability: "IMMUTABLE",
  }),
  systemField("PROG-CHOICE-F-CHOSEN-AT", "Next Target Choice Time", "DATETIME", {
    required: false,
    mutability: "IMMUTABLE",
  }),
  systemField("PROG-CHOICE-F-STATUS", "Next Target Choice Status"),
  objectVersionField("PROG-CHOICE-F-VERSION", "Next Target Choice Version"),
];

const progressObjects = [
  domainObject({
    id: "PROG-OBJ-COURSE-TARGET-SNAPSHOT",
    label: "Version-pinned Current Grade Course Unit and Target Snapshot",
    dataSubject: "SUBJECT_CURRICULUM",
    producerRef: "SYSTEM",
    ownerRef: "ROLE-ACADEMIC",
    confirmerRef: "SYSTEM",
    stewardRef: "DUTY-SUBJECT-TEACHER",
    sensitivityId: "S2",
    states: ["ACTIVE", "SUPERSEDED"],
    fields: progressSnapshotFields,
    identityFieldId: "PROG-SNAPSHOT-F-ID",
    overrides: {
      lineageBindings: [
        progressContextRef.binding,
        progressSchoolRef.binding,
        progressCurriculumRef.binding,
        progressMappingRef.binding,
      ],
    },
  }),
  domainObject({
    id: "PROG-OBJ-STUDENT-TARGET",
    label: "Student Minimum Current Learning Target",
    dataSubject: "STUDENT_EVIDENCE_AND_MASTERY",
    producerRef: "SYSTEM",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "SYSTEM",
    stewardRef: "DUTY-SUBJECT-TEACHER",
    states: ["NOT_STARTED", "IN_PROGRESS", "PENDING_COMPLETION_EVIDENCE", "COMPLETED", "PAUSED"],
    fields: progressTargetFields,
    identityFieldId: "PROG-TARGET-F-ID",
    overrides: {
      lineageBindings: [progressTargetSnapshotRef.binding, progressCompletionEvidenceRef.binding],
    },
  }),
  domainObject({
    id: "PROG-OBJ-NEXT-TARGET-CHOICE",
    label: "Evidence-bound Student Next Target Choice",
    dataSubject: "STUDENT_EVIDENCE_AND_MASTERY",
    producerRef: "SYSTEM",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "ROLE-STUDENT",
    stewardRef: "DUTY-SUBJECT-TEACHER",
    states: ["PROPOSED", "SELECTED", "DEFERRED", "EXPIRED"],
    fields: progressChoiceFields,
    identityFieldId: "PROG-CHOICE-F-ID",
    overrides: {
      lineageBindings: [
        progressChoiceCurrentTargetRef.binding,
        progressChoiceEvidenceRef.binding,
        progressChoiceNextSnapshotRef.binding,
      ],
    },
  }),
];

const progressSnapshotInputs = progressSnapshotFields
  .filter(({ id, valueSource, idempotencyRole }) => (
    id !== "PROG-SNAPSHOT-F-STATUS"
    && id !== "PROG-SNAPSHOT-F-VERSION"
    && idempotencyRole !== "OBJECT_ID"
    && valueSource.kind !== "SYSTEM"
  ))
  .map(({ id }) => id);
const progressSnapshotSystemInputs = [
  "PROG-SNAPSHOT-F-WORK-CONTEXT-VERSION",
  "PROG-SNAPSHOT-F-SCHOOL-PROFILE-VERSION",
  "PROG-SNAPSHOT-F-COURSE-SOURCE-VERSION",
  "PROG-SNAPSHOT-F-CURRICULUM-VERSION",
  "PROG-SNAPSHOT-F-UNIT-SOURCE-VERSION",
  "PROG-SNAPSHOT-F-TARGET-SOURCE-VERSION",
  "PROG-SNAPSHOT-F-TARGET-MAPPING-VERSION",
  "PROG-SNAPSHOT-F-PREREQUISITE-TARGET-REFS",
  "PROG-SNAPSHOT-F-PREREQUISITE-TARGET-VERSIONS",
  "PROG-SNAPSHOT-F-NEXT-ALLOWED-TARGET-VERSION",
];

const progressActions = [
  action({
    id: "PROG-ACT-SYNC-COURSE-TARGET-SNAPSHOT",
    label: "Sync a Version-pinned Current Course Target Snapshot",
    targetObjectId: "PROG-OBJ-COURSE-TARGET-SNAPSHOT",
    operationKind: "CREATE",
    inputFieldIds: [...progressSnapshotInputs, ...progressSnapshotSystemInputs],
    outputFieldIds: ["PROG-SNAPSHOT-F-ID", "PROG-SNAPSHOT-F-STATUS", "PROG-SNAPSHOT-F-VERSION"],
    executionMode: SYSTEM_EVENT,
    trigger: { kind: "EVENT", eventId: "EVT-P2-PROGRESS-SOURCE-SNAPSHOT-READY" },
    permissions: [
      permission("ALLOW", "SYSTEM", "the current school context, effective course, and published curriculum target versions are all pinned"),
      permission("DENY", "AI", "AI cannot invent a school, course, unit, target, prerequisite, or source version"),
    ],
    successState: "ACTIVE",
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "VALIDATION_FAILED", "VERSION_CONFLICT"],
  }),
  action({
    id: "PROG-ACT-SYNC-STUDENT-TARGET",
    label: "Sync the Student Minimum Current Target State",
    targetObjectId: "PROG-OBJ-STUDENT-TARGET",
    operationKind: "CREATE",
    inputFieldIds: [
      "PROG-TARGET-F-STUDENT-REF",
      "PROG-TARGET-F-SNAPSHOT-REF",
      "PROG-TARGET-F-SNAPSHOT-VERSION",
    ],
    outputFieldIds: [
      "PROG-TARGET-F-ID",
      "PROG-TARGET-F-STATUS",
      "PROG-TARGET-F-STATUS-AT",
      "PROG-TARGET-F-VERSION",
    ],
    executionMode: SYSTEM_EVENT,
    trigger: { kind: "EVENT", eventId: "EVT-P2-PROGRESS-TARGET-STATUS-CHANGED" },
    permissions: [
      permission("ALLOW", "SYSTEM", "the target state is derived from current versioned activity and completion evidence without requiring a complete profile"),
      permission("DENY", "AI", "AI cannot declare completion without accepted current-target completion evidence"),
    ],
    successStates: ["NOT_STARTED", "IN_PROGRESS", "PENDING_COMPLETION_EVIDENCE", "COMPLETED", "PAUSED"],
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "EVIDENCE_NOT_ACCEPTED", "VERSION_CONFLICT"],
  }),
  action({
    id: "PROG-ACT-VIEW-CURRENT-TARGET",
    label: "View Current Grade Course Unit Target and Next Allowed Target",
    targetObjectId: "PROG-OBJ-STUDENT-TARGET",
    operationKind: "READ",
    inputFieldIds: ["PROG-TARGET-F-STUDENT-REF"],
    outputFieldIds: [
      "PROG-TARGET-F-STUDENT-REF",
      "PROG-TARGET-F-SNAPSHOT-REF",
      "PROG-TARGET-F-SNAPSHOT-VERSION",
      "PROG-TARGET-F-STATUS",
      "PROG-TARGET-F-COMPLETION-EVIDENCE-REF",
      "PROG-TARGET-F-COMPLETION-EVIDENCE-VERSION",
      "PROG-TARGET-F-STATUS-AT",
      "PROG-TARGET-F-VERSION",
    ],
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student reads only the student's current minimum progress record", {
        kind: "OWN_RECORD",
        subjectFieldId: "PROG-TARGET-F-STUDENT-REF",
      }),
      permission("DENY", "ROLE-SCHOOL-ADMIN", "school administration has no default access to an individual student's detailed progress evidence"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default access to student progress detail"),
    ],
    successData: "returns the pinned grade, course, unit, target, prerequisites, target state, completion evidence, and next allowed target without a complete-profile dependency",
  }),
  action({
    id: "PROG-ACT-PROPOSE-NEXT-TARGET",
    label: "Propose the Evidence-allowed Next Learning Target",
    targetObjectId: "PROG-OBJ-NEXT-TARGET-CHOICE",
    operationKind: "CREATE",
    inputFieldIds: [
      "PROG-CHOICE-F-STUDENT-REF",
      "PROG-CHOICE-F-CURRENT-TARGET-REF",
      "PROG-CHOICE-F-CURRENT-TARGET-VERSION",
      "PROG-CHOICE-F-COMPLETION-EVIDENCE-REF",
      "PROG-CHOICE-F-COMPLETION-EVIDENCE-VERSION",
      "PROG-CHOICE-F-NEXT-SNAPSHOT-REF",
      "PROG-CHOICE-F-NEXT-SNAPSHOT-VERSION",
    ],
    outputFieldIds: [
      "PROG-CHOICE-F-ID",
      "PROG-CHOICE-F-PROPOSED-AT",
      "PROG-CHOICE-F-STATUS",
      "PROG-CHOICE-F-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-001"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "the current target is COMPLETED with accepted versioned completion evidence and the next snapshot is allowed by prerequisites"),
      permission("DENY", "AI", "AI cannot choose for the student or automatically publish a class activity"),
    ],
    successState: "PROPOSED",
    successData: "creates only a proposed personal next target; it neither selects the target nor publishes or changes any class activity",
    failureResults: ["PERMISSION_DENIED", "CURRENT_TARGET_NOT_COMPLETED", "COMPLETION_EVIDENCE_REQUIRED", "PREREQUISITE_NOT_MET", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
  }),
  action({
    id: "PROG-ACT-SELECT-NEXT-TARGET",
    label: "Student Selects the Proposed Next Learning Target",
    targetObjectId: "PROG-OBJ-NEXT-TARGET-CHOICE",
    operationKind: "UPDATE",
    inputFieldIds: ["PROG-CHOICE-F-STUDENT-CHOICE"],
    acceptedInputValues: [{
      fieldId: "PROG-CHOICE-F-STUDENT-CHOICE",
      optionSetId: "OPT-P2-PROG-STUDENT-CHOICE",
      partitionId: "PROG-NEXT-TARGET-STUDENT-CHOICE",
      codes: ["CONTINUE"],
    }],
    outputFieldIds: [
      "PROG-CHOICE-F-STUDENT-CHOICE",
      "PROG-CHOICE-F-CHOSEN-AT",
      "PROG-CHOICE-F-STATUS",
      "PROG-CHOICE-F-VERSION",
    ],
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student explicitly selects the student's own still-valid proposal"),
      permission("DENY", "AI", "AI cannot select the next target or publish a class activity on the student's behalf"),
      permission("DENY", "DUTY-SUBJECT-TEACHER", "a teacher cannot silently convert a personal proposal into the student's choice"),
    ],
    transition: { from: "PROPOSED", to: "SELECTED" },
    successData: "records the student's explicit choice and permits only the selected personal next-target path; class progress and activities remain teacher-controlled",
    failureResults: ["PERMISSION_DENIED", "CHOICE_REQUIRED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
  }),
  action({
    id: "PROG-ACT-DEFER-NEXT-TARGET",
    label: "Student Defers the Proposed Next Learning Target",
    targetObjectId: "PROG-OBJ-NEXT-TARGET-CHOICE",
    operationKind: "UPDATE",
    inputFieldIds: ["PROG-CHOICE-F-STUDENT-CHOICE"],
    acceptedInputValues: [{
      fieldId: "PROG-CHOICE-F-STUDENT-CHOICE",
      optionSetId: "OPT-P2-PROG-STUDENT-CHOICE",
      partitionId: "PROG-NEXT-TARGET-STUDENT-CHOICE",
      codes: ["NOT_NOW"],
    }],
    outputFieldIds: [
      "PROG-CHOICE-F-STUDENT-CHOICE",
      "PROG-CHOICE-F-CHOSEN-AT",
      "PROG-CHOICE-F-STATUS",
      "PROG-CHOICE-F-VERSION",
    ],
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student explicitly defers the student's own still-valid proposal"),
      permission("DENY", "AI", "AI cannot override a student deferral or publish a class activity"),
    ],
    transition: { from: "PROPOSED", to: "DEFERRED" },
    successData: "records deferral without changing class progress, assigning work, or claiming a learning failure",
    failureResults: ["PERMISSION_DENIED", "CHOICE_REQUIRED", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
  }),
];

const progressPages = [
  page(
    "PROG-PAGE-STUDENT-CURRENT-TARGET",
    "Student Minimum Progress and Next Target Choice",
    ["PROG-OBJ-STUDENT-TARGET", "PROG-OBJ-NEXT-TARGET-CHOICE"],
    [...progressTargetFields, ...progressChoiceFields].map(({ id }) => id),
    [
      "PROG-ACT-VIEW-CURRENT-TARGET",
      "PROG-ACT-SELECT-NEXT-TARGET",
      "PROG-ACT-DEFER-NEXT-TARGET",
    ],
  ),
];

const progressModule = moduleFact({
  id: "PROG-001",
  phase: PHASE.SECOND,
  releaseStatus: RELEASE_STATUS.PLANNED,
  priority: "P0",
  title: "Phase-two Minimum Learning Progress",
  objective: "Provide a version-pinned current grade, course, unit, target, prerequisite, target state, and student-selected next allowed target without requiring a complete cognitive profile",
  entryConditions: ["the school, course, curriculum target, and student relation are current and authorized"],
  exitConditions: ["the student can inspect the minimum progress facts and explicitly select or defer only an evidence-allowed next target"],
  baselineDecisionIds: ["BASE-001", "BASE-003", "BASE-004", "BASE-005", "BASE-007", "BASE-010"],
  nfrIds: ["NFR-002", "NFR-006", "NFR-008"],
  dependencyModuleIds: ["ACC-001", "ORG-001", "CURR-001", "PUB-001"],
  objects: progressObjects,
  relationships: [
    {
      id: "PROG-REL-TARGET-SNAPSHOT",
      fromObjectId: "PROG-OBJ-STUDENT-TARGET",
      toObjectId: "PROG-OBJ-COURSE-TARGET-SNAPSHOT",
      type: "REFERENCES",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_STUDENT",
      onSourceInvalidation: "retain historical student progress and require a new current source snapshot",
    },
    {
      id: "PROG-REL-CHOICE-TARGET",
      fromObjectId: "PROG-OBJ-NEXT-TARGET-CHOICE",
      toObjectId: "PROG-OBJ-STUDENT-TARGET",
      type: "DERIVED_FROM",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_STUDENT",
      onSourceInvalidation: "expire an unselected proposal and preserve the student's recorded choice history",
    },
  ],
  actionFacts: progressActions,
  pages: progressPages,
});

const videoActivityRef = pinnedReference({
  refFieldId: "VIDEO-REQUEST-F-ACTIVITY-REF",
  refLabel: "Pinned Source Activity",
  versionFieldId: "VIDEO-REQUEST-F-ACTIVITY-VERSION",
  versionLabel: "Pinned Source Activity Version",
  targetObjectId: "HW-OBJ-ASSIGNMENT",
  targetVersionFieldId: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
  required: false,
});
const videoSubmissionRef = pinnedReference({
  refFieldId: "VIDEO-REQUEST-F-SUBMISSION-REF",
  refLabel: "Pinned Source Submission",
  versionFieldId: "VIDEO-REQUEST-F-SUBMISSION-VERSION",
  versionLabel: "Pinned Source Submission Version",
  targetObjectId: "SUB-OBJ-ATTEMPT",
  targetVersionFieldId: "SUB-ATTEMPT-F-SUBMISSION-VERSION",
  required: false,
});
const videoDecisionRef = pinnedReference({
  refFieldId: "VIDEO-REQUEST-F-ASSESSMENT-RESULT-REF",
  refLabel: "Pinned AI Assessment Result",
  versionFieldId: "VIDEO-REQUEST-F-ASSESSMENT-RESULT-VERSION",
  versionLabel: "Pinned AI Assessment Result Version",
  targetObjectId: "GRD-OBJ-DECISION",
  targetVersionFieldId: "GRD-DECISION-F-DECISION-VERSION",
});
const videoRubricRef = pinnedReference({
  refFieldId: "VIDEO-REQUEST-F-ASSESSMENT-STANDARD-REF",
  refLabel: "Pinned Assessment Standard",
  versionFieldId: "VIDEO-REQUEST-F-ASSESSMENT-STANDARD-VERSION",
  versionLabel: "Pinned Assessment Standard Version",
  targetObjectId: "HW-OBJ-RUBRIC",
  targetVersionFieldId: "HW-RUBRIC-F-RUBRIC-VERSION",
});
const videoPublishedResultRef = pinnedReference({
  refFieldId: "VIDEO-REQUEST-F-PUBLISHED-RESULT-REF",
  refLabel: "Pinned Published Assessment Result",
  versionFieldId: "VIDEO-REQUEST-F-PUBLISHED-RESULT-VERSION",
  versionLabel: "Pinned Published Assessment Result Version",
  targetObjectId: "PUB-OBJ-RESULT",
  targetVersionFieldId: "PUB-RESULT-F-RESULT-VERSION",
});
const videoMinimumProgressRef = pinnedReference({
  refFieldId: "VIDEO-REQUEST-F-MINIMUM-PROGRESS-REF",
  refLabel: "Pinned Minimum Learning State",
  versionFieldId: "VIDEO-REQUEST-F-MINIMUM-PROGRESS-VERSION",
  versionLabel: "Pinned Minimum Learning State Version",
  targetObjectId: "PROG-OBJ-STUDENT-TARGET",
  targetVersionFieldId: "PROG-TARGET-F-VERSION",
});
const videoNextChoiceRef = pinnedReference({
  refFieldId: "VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-REF",
  refLabel: "Pinned Student-selected Next Target",
  versionFieldId: "VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-VERSION",
  versionLabel: "Pinned Student-selected Next Target Version",
  targetObjectId: "PROG-OBJ-NEXT-TARGET-CHOICE",
  targetVersionFieldId: "PROG-CHOICE-F-VERSION",
  required: false,
});
const videoLicenseRef = pinnedReference({
  refFieldId: "VIDEO-REQUEST-F-MATERIAL-RIGHTS-REF",
  refLabel: "Pinned Source Material Rights",
  versionFieldId: "VIDEO-REQUEST-F-MATERIAL-RIGHTS-VERSION",
  versionLabel: "Pinned Source Material Rights Version",
  targetObjectId: "CONTENT-OBJ-LICENSE",
  targetVersionFieldId: "CONTENT-LICENSE-F-VERSION",
});
const videoContentPermissionRef = pinnedReference({
  refFieldId: "VIDEO-REQUEST-F-MATERIAL-PERMISSION-REF",
  refLabel: "Pinned Source Material Permission",
  versionFieldId: "VIDEO-REQUEST-F-MATERIAL-PERMISSION-VERSION",
  versionLabel: "Pinned Source Material Permission Version",
  targetObjectId: "CONTENT-OBJ-PERMISSION",
  targetVersionFieldId: "CONTENT-PERMISSION-F-VERSION",
});

const videoRequestFields = [
  identityField("VIDEO-REQUEST-F-ID", "Teaching Video Request ID"),
  identityRefField("VIDEO-REQUEST-F-STUDENT-REF", "Video Service Student", "ORG-OBJ-STUDENT"),
  field("VIDEO-REQUEST-F-REQUESTER-REF", "Video Requester", {
    dataType: "ID",
    mutability: "IMMUTABLE",
    validation: "must equal the authenticated student who owns VIDEO-REQUEST-F-STUDENT-REF",
  }),
  field("VIDEO-REQUEST-F-REQUESTER-KIND", "Video Requester Kind", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-REQUESTER-KIND" },
    mutability: "IMMUTABLE",
    validation: "must equal STUDENT for a personal video request",
  }),
  field("VIDEO-REQUEST-F-SERVICE-AUDIENCE", "Video Service Audience", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-SERVICE-AUDIENCE" },
    mutability: "IMMUTABLE",
    validation: "must equal INDIVIDUAL_STUDENT for a personal video request",
  }),
  systemField("VIDEO-REQUEST-F-SERVICE-OBJECT-REFS", "Video Service Object References", "STRING_ARRAY", {
    mutability: "IMMUTABLE",
    idempotencyRole: "FANOUT_SET",
    validation: "must contain exactly the serviced student reference and no class or unrelated student",
  }),
  field("VIDEO-REQUEST-F-MANAGEMENT-SCOPE", "Video Management Scope", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-MANAGEMENT-SCOPE" },
    mutability: "IMMUTABLE",
    validation: "must equal STUDENT_PERSONAL_LEARNING and remain under the serviced student's personal learning management",
  }),
  systemField("VIDEO-REQUEST-F-SOURCE-MATERIALS", "Pinned Source Materials", "JSON", {
    mutability: "IMMUTABLE",
    validation: "must list every source material ID, version, permission, and rights record included in generation",
  }),
  field("VIDEO-REQUEST-F-ACCESS-SCOPE", "Video Access Scope", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-ACCESS-SCOPE" },
    mutability: "IMMUTABLE",
    validation: "must equal SERVICED_STUDENT_ONLY",
  }),
  field("VIDEO-REQUEST-F-ACCESS-DOMAIN", "Video Access Domain", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-ACCESS-DOMAIN" },
    mutability: "IMMUTABLE",
    validation: "must equal STUDENT_PERSONAL",
  }),
  field("VIDEO-REQUEST-F-KIND", "Teaching Video Request Kind", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-REQUEST-KIND" },
  }),
  ...videoActivityRef.fields,
  ...videoSubmissionRef.fields,
  ...videoDecisionRef.fields,
  ...videoRubricRef.fields,
  ...videoPublishedResultRef.fields,
  ...videoMinimumProgressRef.fields,
  ...videoNextChoiceRef.fields,
  ...videoLicenseRef.fields,
  ...videoContentPermissionRef.fields,
  systemField("VIDEO-REQUEST-F-ANSWER-OPEN-POLICY-ID", "Answer Open Policy ID", "STRING", {
    mutability: "IMMUTABLE",
    validation: "must equal ANSWER-OPEN-POLICY-V2",
  }),
  systemField("VIDEO-REQUEST-F-ANSWER-OPEN-POLICY-VERSION", "Answer Open Policy Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-REQUEST-F-ANSWER-SOLUTION-RUBRIC-OPEN-AT", "Pinned Answer Solution and Rubric Open Times", "JSON", {
    mutability: "IMMUTABLE",
    validation: "must separately pin answerOpenAt, solutionOpenAt, and rubricOpenAt from the published result policy",
  }),
  systemField("VIDEO-REQUEST-F-SOURCE-BINDING-DIGEST", "Fixed Source Version Binding Digest", "STRING", {
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-REQUEST-F-ACCEPTED-AT", "Video Request Accepted Time", "DATETIME", {
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-REQUEST-F-STATUS", "Video Request Status"),
  objectVersionField("VIDEO-REQUEST-F-VERSION", "Teaching Video Request Version"),
];

const videoSchoolActivityRef = pinnedReference({
  refFieldId: "VIDEO-SCHOOL-REQUEST-F-ACTIVITY-REF",
  refLabel: "Pinned School Teaching Activity",
  versionFieldId: "VIDEO-SCHOOL-REQUEST-F-ACTIVITY-VERSION",
  versionLabel: "Pinned School Teaching Activity Version",
  targetObjectId: "HW-OBJ-ASSIGNMENT",
  targetVersionFieldId: "HW-ASSIGNMENT-F-PUBLICATION-VERSION",
});
const videoSchoolLicenseRef = pinnedReference({
  refFieldId: "VIDEO-SCHOOL-REQUEST-F-MATERIAL-RIGHTS-REF",
  refLabel: "Pinned School Source Material Rights",
  versionFieldId: "VIDEO-SCHOOL-REQUEST-F-MATERIAL-RIGHTS-VERSION",
  versionLabel: "Pinned School Source Material Rights Version",
  targetObjectId: "CONTENT-OBJ-LICENSE",
  targetVersionFieldId: "CONTENT-LICENSE-F-VERSION",
});
const videoSchoolPermissionRef = pinnedReference({
  refFieldId: "VIDEO-SCHOOL-REQUEST-F-MATERIAL-PERMISSION-REF",
  refLabel: "Pinned School Source Material Permission",
  versionFieldId: "VIDEO-SCHOOL-REQUEST-F-MATERIAL-PERMISSION-VERSION",
  versionLabel: "Pinned School Source Material Permission Version",
  targetObjectId: "CONTENT-OBJ-PERMISSION",
  targetVersionFieldId: "CONTENT-PERMISSION-F-VERSION",
});
const videoSchoolRequestFields = [
  identityField("VIDEO-SCHOOL-REQUEST-F-ID", "School-private Teaching Video Request ID"),
  identityRefField("VIDEO-SCHOOL-REQUEST-F-REQUESTER-TEACHER-REF", "Requesting Subject Teacher", "ORG-OBJ-TEACHER"),
  field("VIDEO-SCHOOL-REQUEST-F-REQUESTER-KIND", "School Video Requester Kind", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-REQUESTER-KIND" },
    mutability: "IMMUTABLE",
    validation: "must equal SUBJECT_TEACHER",
  }),
  field("VIDEO-SCHOOL-REQUEST-F-SERVICE-AUDIENCE", "School Video Service Audience", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-SERVICE-AUDIENCE" },
    mutability: "IMMUTABLE",
    validation: "must equal CLASS or STUDENT_GROUP inside the requesting teacher's effective assignment",
  }),
  identityRefField("VIDEO-SCHOOL-REQUEST-F-CLASS-REF", "Assigned Service Class", "ORG-OBJ-CLASS"),
  systemField("VIDEO-SCHOOL-REQUEST-F-SERVICE-OBJECT-REFS", "Authorized Class or Student Group References", "STRING_ARRAY", {
    mutability: "IMMUTABLE",
    idempotencyRole: "FANOUT_SET",
    validation: "must resolve to one assigned class or an explicit bounded subset of students in that class",
  }),
  field("VIDEO-SCHOOL-REQUEST-F-MANAGEMENT-SCOPE", "School Video Management Scope", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-MANAGEMENT-SCOPE" },
    mutability: "IMMUTABLE",
    validation: "must equal SCHOOL_PRIVATE_TEACHING and remain school-managed after the requesting teacher leaves",
  }),
  systemField("VIDEO-SCHOOL-REQUEST-F-SOURCE-MATERIALS", "Pinned School Source Materials", "JSON", {
    mutability: "IMMUTABLE",
    validation: "must list every school-private source material ID, version, permission, and rights record without exposing individual student submissions to the group",
  }),
  field("VIDEO-SCHOOL-REQUEST-F-ACCESS-SCOPE", "School Video Access Scope", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-ACCESS-SCOPE" },
    mutability: "IMMUTABLE",
    validation: "must equal AUTHORIZED_CLASS_OR_GROUP",
  }),
  field("VIDEO-SCHOOL-REQUEST-F-ACCESS-DOMAIN", "School Video Access Domain", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-ACCESS-DOMAIN" },
    mutability: "IMMUTABLE",
    validation: "must equal SCHOOL_PRIVATE and cannot migrate school-private materials unconditionally across schools",
  }),
  field("VIDEO-SCHOOL-REQUEST-F-KIND", "School Teaching Video Kind", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-REQUEST-KIND" },
    mutability: "IMMUTABLE",
    validation: "must equal PROBLEM_DRIVEN; student-selected progress video remains an individual student action",
  }),
  identityRefField("VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-REF", "Effective Teaching Assignment", "ORG-OBJ-TEACHING-ASSIGNMENT"),
  systemField("VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-VERSION", "Pinned Teaching Scope Snapshot Version", "INTEGER", {
    mutability: "IMMUTABLE",
    validation: "must pin the effective teacher, course, class, substitute relation if any, and authorization digest",
  }),
  ...videoSchoolActivityRef.fields,
  ...videoSchoolLicenseRef.fields,
  ...videoSchoolPermissionRef.fields,
  systemField("VIDEO-SCHOOL-REQUEST-F-TEACHING-BASIS", "Versioned Group Teaching Basis", "JSON", {
    mutability: "IMMUTABLE",
    validation: "must contain a teacher-confirmed group teaching problem or target without public ranking, permanent weakness labels, or individual answer disclosure",
  }),
  systemField("VIDEO-SCHOOL-REQUEST-F-ANSWER-OPEN-POLICY-ID", "School Video Answer Open Policy ID", "STRING", {
    mutability: "IMMUTABLE",
    validation: "must equal ANSWER-OPEN-POLICY-V2",
  }),
  systemField("VIDEO-SCHOOL-REQUEST-F-ANSWER-OPEN-POLICY-VERSION", "School Video Answer Open Policy Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-SCHOOL-REQUEST-F-SOURCE-BINDING-DIGEST", "School Video Fixed Source Binding Digest", "STRING", {
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-SCHOOL-REQUEST-F-ACCEPTED-AT", "School Video Request Accepted Time", "DATETIME", {
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-SCHOOL-REQUEST-F-STATUS", "School Video Request Status"),
  objectVersionField("VIDEO-SCHOOL-REQUEST-F-VERSION", "School Video Request Version"),
];

const videoAssetRequestRef = pinnedReference({
  refFieldId: "VIDEO-ASSET-F-REQUEST-REF",
  refLabel: "Pinned Teaching Video Request",
  versionFieldId: "VIDEO-ASSET-F-REQUEST-VERSION",
  versionLabel: "Pinned Teaching Video Request Version",
  targetObjectId: "VIDEO-OBJ-REQUEST",
  targetVersionFieldId: "VIDEO-REQUEST-F-VERSION",
  required: false,
});
const videoAssetSchoolRequestRef = pinnedReference({
  refFieldId: "VIDEO-ASSET-F-SCHOOL-REQUEST-REF",
  refLabel: "Pinned School-private Teaching Video Request",
  versionFieldId: "VIDEO-ASSET-F-SCHOOL-REQUEST-VERSION",
  versionLabel: "Pinned School-private Teaching Video Request Version",
  targetObjectId: "VIDEO-OBJ-SCHOOL-REQUEST",
  targetVersionFieldId: "VIDEO-SCHOOL-REQUEST-F-VERSION",
  required: false,
});
const gateField = (id, label) => systemField(id, label, "STRING", {
  valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-GATE-STATUS" },
});
const videoAssetFields = [
  identityField("VIDEO-ASSET-F-ID", "Teaching Video Asset ID"),
  identityRefField("VIDEO-ASSET-F-STUDENT-REF", "Video Service Student", "ORG-OBJ-STUDENT", { required: false }),
  ...videoAssetRequestRef.fields,
  ...videoAssetSchoolRequestRef.fields,
  systemField("VIDEO-ASSET-F-REQUESTER-REF", "Recorded Video Requester", "ID", {
    mutability: "IMMUTABLE",
    validation: "must match the accepted personal or school-private request requester",
  }),
  systemField("VIDEO-ASSET-F-REQUESTER-KIND", "Recorded Video Requester Kind", "STRING", {
    mutability: "IMMUTABLE",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-REQUESTER-KIND" },
  }),
  systemField("VIDEO-ASSET-F-SERVICE-AUDIENCE", "Recorded Video Service Audience", "STRING", {
    mutability: "IMMUTABLE",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-SERVICE-AUDIENCE" },
  }),
  systemField("VIDEO-ASSET-F-SERVICE-OBJECT-REFS", "Recorded Video Service Object References", "STRING_ARRAY", {
    mutability: "IMMUTABLE",
    idempotencyRole: "FANOUT_SET",
  }),
  systemField("VIDEO-ASSET-F-MANAGEMENT-SCOPE", "Recorded Video Management Scope", "STRING", {
    mutability: "IMMUTABLE",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-MANAGEMENT-SCOPE" },
  }),
  systemField("VIDEO-ASSET-F-SOURCE-MATERIALS", "Recorded Video Source Materials", "JSON", {
    mutability: "IMMUTABLE",
    validation: "must preserve the accepted request's complete source material IDs, versions, permissions, and rights",
  }),
  systemField("VIDEO-ASSET-F-ACCESS-SCOPE", "Recorded Video Access Scope", "STRING", {
    mutability: "IMMUTABLE",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-ACCESS-SCOPE" },
  }),
  systemField("VIDEO-ASSET-F-ACCESS-DOMAIN", "Recorded Video Access Domain", "STRING", {
    mutability: "IMMUTABLE",
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-ACCESS-DOMAIN" },
  }),
  systemField("VIDEO-ASSET-F-MANAGER-REF", "Recorded Asset Manager", "ID", {
    mutability: "IMMUTABLE",
    validation: "must be the serviced student for STUDENT_PERSONAL or the school for SCHOOL_PRIVATE; AI can never be the manager",
  }),
  systemField("VIDEO-ASSET-F-PROMOTION-POLICY", "Knowledge-layer Promotion Policy", "STRING", {
    mutability: "IMMUTABLE",
    validation: "must prohibit automatic school-knowledge or platform-public promotion and require fresh quality, privacy, and rights review before any sharing",
  }),
  systemField("VIDEO-ASSET-F-SCRIPT-REF", "Generated Script Reference", "FILE_REFERENCE", { required: false }),
  systemField("VIDEO-ASSET-F-MEDIA-REF", "Generated Video Media Reference", "FILE_REFERENCE", { required: false }),
  systemField("VIDEO-ASSET-F-SUBTITLE-REF", "Accessible Subtitle Reference", "FILE_REFERENCE", { required: false }),
  systemField("VIDEO-ASSET-F-SUMMARY", "Teaching Video Summary", "TEXT", { required: false }),
  systemField("VIDEO-ASSET-F-LOW-BANDWIDTH-ALTERNATIVE", "Text Image or Low-bandwidth Alternative", "JSON", { required: false }),
  gateField("VIDEO-ASSET-F-SCRIPT-GATE", "Script Gate"),
  gateField("VIDEO-ASSET-F-RENDER-GATE", "Rendered Media Gate"),
  gateField("VIDEO-ASSET-F-SAFETY-GATE", "Safety Gate"),
  gateField("VIDEO-ASSET-F-PRIVACY-GATE", "Privacy Gate"),
  gateField("VIDEO-ASSET-F-RIGHTS-GATE", "Source Rights Gate"),
  gateField("VIDEO-ASSET-F-PEDAGOGY-GATE", "Teaching Correctness Gate"),
  gateField("VIDEO-ASSET-F-PLAYABILITY-GATE", "Playability Gate"),
  systemField("VIDEO-ASSET-F-DOWNLOAD-POLICY", "Controlled Playback Download Policy", "STRING", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-DOWNLOAD-POLICY" },
  }),
  systemField("VIDEO-ASSET-F-EXTERNAL-RECORDING-BOUNDARY", "External Recording Capability Boundary", "STRING", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-EXTERNAL-RECORDING-BOUNDARY" },
  }),
  systemField("VIDEO-ASSET-F-DELIVERY-STATUS", "Teaching Video Delivery Status", "STRING", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-DELIVERY-STATUS" },
  }),
  systemField("VIDEO-ASSET-F-NOTIFIED-AT", "Student Delivery Notification Time", "DATETIME", { required: false }),
  systemField("VIDEO-ASSET-F-RECALL-REASON", "Video Recall Reason", "TEXT", { required: false }),
  objectVersionField("VIDEO-ASSET-F-VERSION", "Teaching Video Asset Version"),
];

const videoEntitlementFields = [
  identityField("VIDEO-ENTITLEMENT-F-ID", "Student Minimum Video Entitlement ID"),
  identityRefField("VIDEO-ENTITLEMENT-F-STUDENT-REF", "Active Phase-two Student", "ORG-OBJ-STUDENT"),
  systemField("VIDEO-ENTITLEMENT-F-PERIOD", "Entitlement Period"),
  systemField("VIDEO-ENTITLEMENT-F-MINIMUM-UNITS", "Guaranteed Minimum Usable Video Units", "INTEGER", {
    validation: "must be greater than zero for every active phase-two student and cannot depend on ranking, permanent weakness labels, or family payment",
  }),
  systemField("VIDEO-ENTITLEMENT-F-AVAILABLE-UNITS", "Available Guaranteed Units", "INTEGER"),
  systemField("VIDEO-ENTITLEMENT-F-STATUS", "Student Minimum Entitlement Status"),
  objectVersionField("VIDEO-ENTITLEMENT-F-VERSION", "Student Minimum Entitlement Version"),
];

const videoOverflowFields = [
  identityField("VIDEO-OVERFLOW-F-ID", "School Video Overflow Pool ID"),
  identityRefField("VIDEO-OVERFLOW-F-SCHOOL-REF", "School", "ACC-OBJ-SCHOOL-PROFILE"),
  systemField("VIDEO-OVERFLOW-F-PERIOD", "Overflow Pool Period"),
  systemField("VIDEO-OVERFLOW-F-AVAILABLE-UNITS", "School Shared Overflow Units", "INTEGER"),
  systemField("VIDEO-OVERFLOW-F-STATUS", "School Overflow Pool Status"),
  objectVersionField("VIDEO-OVERFLOW-F-VERSION", "School Overflow Pool Version"),
];

const videoLedgerRequestRef = pinnedReference({
  refFieldId: "VIDEO-LEDGER-F-REQUEST-REF",
  refLabel: "Pinned Accepted Video Request",
  versionFieldId: "VIDEO-LEDGER-F-REQUEST-VERSION",
  versionLabel: "Pinned Accepted Video Request Version",
  targetObjectId: "VIDEO-OBJ-REQUEST",
  targetVersionFieldId: "VIDEO-REQUEST-F-VERSION",
});
const videoLedgerFields = [
  identityField("VIDEO-LEDGER-F-ID", "Video Quota Ledger ID"),
  identityRefField("VIDEO-LEDGER-F-STUDENT-REF", "Quota Student", "ORG-OBJ-STUDENT"),
  ...videoLedgerRequestRef.fields,
  identityRefField("VIDEO-LEDGER-F-ENTITLEMENT-REF", "Student Minimum Entitlement", "VIDEO-OBJ-STUDENT-ENTITLEMENT", { required: false }),
  identityRefField("VIDEO-LEDGER-F-OVERFLOW-REF", "School Shared Overflow Pool", "VIDEO-OBJ-SCHOOL-OVERFLOW-POOL", { required: false }),
  systemField("VIDEO-LEDGER-F-SOURCE", "Quota Source", "STRING", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-QUOTA-SOURCE" },
  }),
  systemField("VIDEO-LEDGER-F-PRIORITY", "Quota Priority", "STRING", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-QUOTA-PRIORITY" },
  }),
  systemField("VIDEO-LEDGER-F-RESERVED-UNITS", "Reserved Video Units", "INTEGER"),
  systemField("VIDEO-LEDGER-F-SETTLED-UNITS", "Settled Usable Delivery Units", "INTEGER", { required: false }),
  systemField("VIDEO-LEDGER-F-RELEASE-REASON", "Quota Release Reason", "STRING", {
    required: false,
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-RELEASE-REASON" },
  }),
  systemField("VIDEO-LEDGER-F-STATUS", "Quota Ledger Status"),
  objectVersionField("VIDEO-LEDGER-F-VERSION", "Video Quota Ledger Version"),
];

const videoSchoolLedgerRequestRef = pinnedReference({
  refFieldId: "VIDEO-SCHOOL-LEDGER-F-REQUEST-REF",
  refLabel: "Pinned School-private Video Request",
  versionFieldId: "VIDEO-SCHOOL-LEDGER-F-REQUEST-VERSION",
  versionLabel: "Pinned School-private Video Request Version",
  targetObjectId: "VIDEO-OBJ-SCHOOL-REQUEST",
  targetVersionFieldId: "VIDEO-SCHOOL-REQUEST-F-VERSION",
});
const videoSchoolLedgerFields = [
  identityField("VIDEO-SCHOOL-LEDGER-F-ID", "School-private Video Quota Ledger ID"),
  ...videoSchoolLedgerRequestRef.fields,
  identityRefField("VIDEO-SCHOOL-LEDGER-F-OVERFLOW-REF", "School Shared Overflow Pool", "VIDEO-OBJ-SCHOOL-OVERFLOW-POOL"),
  systemField("VIDEO-SCHOOL-LEDGER-F-SERVICE-OBJECT-REFS", "School Video Service Object References", "STRING_ARRAY", {
    mutability: "IMMUTABLE",
    idempotencyRole: "FANOUT_SET",
  }),
  systemField("VIDEO-SCHOOL-LEDGER-F-PRIORITY", "School-private Video Quota Priority", "STRING", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-QUOTA-PRIORITY" },
  }),
  systemField("VIDEO-SCHOOL-LEDGER-F-RESERVED-UNITS", "Reserved School Video Units", "INTEGER"),
  systemField("VIDEO-SCHOOL-LEDGER-F-SETTLED-UNITS", "Settled School Video Units", "INTEGER", { required: false }),
  systemField("VIDEO-SCHOOL-LEDGER-F-RELEASE-REASON", "School Video Quota Release Reason", "STRING", {
    required: false,
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-RELEASE-REASON" },
  }),
  systemField("VIDEO-SCHOOL-LEDGER-F-STATUS", "School-private Video Quota Status"),
  objectVersionField("VIDEO-SCHOOL-LEDGER-F-VERSION", "School-private Video Quota Ledger Version"),
];

const videoVerificationAssetRef = pinnedReference({
  refFieldId: "VIDEO-VERIFY-F-ASSET-REF",
  refLabel: "Pinned Delivered Teaching Video Asset",
  versionFieldId: "VIDEO-VERIFY-F-ASSET-VERSION",
  versionLabel: "Pinned Delivered Teaching Video Asset Version",
  targetObjectId: "VIDEO-OBJ-ASSET",
  targetVersionFieldId: "VIDEO-ASSET-F-VERSION",
});
const videoVerificationFields = [
  identityField("VIDEO-VERIFY-F-ID", "Post-video Verification ID"),
  identityRefField("VIDEO-VERIFY-F-STUDENT-REF", "Verifying Student", "ORG-OBJ-STUDENT"),
  ...videoVerificationAssetRef.fields,
  identityRefField("VIDEO-VERIFY-F-TARGET-REF", "Single Verification Ability Target", "CURR-OBJ-KNOWLEDGE-POINT"),
  systemField("VIDEO-VERIFY-F-TARGET-SOURCE-VERSION", "Pinned Verification Target Source Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  field("VIDEO-VERIFY-F-TARGET-KIND", "Verification Target Kind", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-VERIFICATION-TARGET-KIND" },
    mutability: "IMMUTABLE",
  }),
  field("VIDEO-VERIFY-F-STRATEGY", "Verification Strategy", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-VERIFICATION-STRATEGY" },
    mutability: "IMMUTABLE",
    validation: "Feynman is on-demand only for concept, causal, logic, or method targets; character, word, fixed-collocation, and mechanical-fluency targets use retrieval practice or spaced review",
  }),
  field("VIDEO-VERIFY-F-MODALITY", "Verification Modality", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-VERIFICATION-MODALITY" },
    mutability: "IMMUTABLE",
    validation: "voice is optional and text, mathematical handwriting, structured Q&A, and variant practice remain equivalent alternatives",
  }),
  field("VIDEO-VERIFY-F-ABILITY-NODE-REFS", "Verification Ability Node References", {
    dataType: "STRING_ARRAY",
    mutability: "IMMUTABLE",
    validation: "must contain exactly one ability-node reference for every verification session",
  }),
  systemField("VIDEO-VERIFY-F-NEW-CONTEXT-DIGEST", "New-context Verification Digest", "STRING", {
    mutability: "IMMUTABLE",
    validation: "must differ materially from the teaching example and cannot reproduce an answer, solution, or rubric before the student's first expression",
  }),
  systemField("VIDEO-VERIFY-F-FIRST-PROMPT-POLICY", "First-expression Prompt Policy", "STRING", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-FIRST-PROMPT-POLICY" },
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-VERIFY-F-MAX-SPECIFIC-GAPS-PER-TURN", "Maximum Specific Gaps Per Follow-up", "INTEGER", {
    mutability: "IMMUTABLE",
    validation: "must equal one; each follow-up may pursue only one concrete gap",
  }),
  systemField("VIDEO-VERIFY-F-EXCLUDED-NONKNOWLEDGE-SIGNALS", "Signals Excluded from Knowledge-gap Inference", "STRING_ARRAY", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-NONKNOWLEDGE-SIGNAL" },
    mutability: "IMMUTABLE",
    validation: "must include accent, fluency, and speech-recognition error and none may directly create a knowledge gap",
  }),
  field("VIDEO-VERIFY-F-FIRST-EXPRESSION", "Student First Independent Expression", {
    dataType: "JSON",
    required: false,
  }),
  systemField("VIDEO-VERIFY-F-SPECIFIC-GAP", "One Specific Follow-up Gap", "JSON", {
    required: false,
    validation: "must contain at most one concrete knowledge gap supported by learning content, never accent, fluency, or recognition error alone",
  }),
  field("VIDEO-VERIFY-F-UNKNOWN-DECLARATION", "Student Unknown Declaration", {
    dataType: "BOOLEAN",
    required: false,
  }),
  systemField("VIDEO-VERIFY-F-RETEACHING-REF", "Returned Gap Teaching Reference", "ID", { required: false }),
  field("VIDEO-VERIFY-F-RETRY-REQUEST", "Student Different-context Retry Request", {
    dataType: "BOOLEAN",
    required: false,
    validation: "must be an explicit student request after targeted reteaching",
  }),
  systemField("VIDEO-VERIFY-F-DIFFERENT-CONTEXT-DIGEST", "Different-context Retry Digest", "STRING", {
    required: false,
    validation: "must differ from both the teaching example and the first verification context",
  }),
  field("VIDEO-VERIFY-F-DIFFERENT-CONTEXT-EXPRESSION", "Student Different-context Expression", {
    dataType: "JSON",
    required: false,
  }),
  systemField("VIDEO-VERIFY-F-RESULT", "Verification Result without Mastery Claim", "STRING", {
    required: false,
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-VERIFICATION-RESULT" },
    validation: "records only the result in this new context and cannot assert durable mastery from video viewing",
  }),
  systemField("VIDEO-VERIFY-F-EVIDENCE", "Verifiable Post-video Evidence", "JSON", {
    required: false,
    validation: "must cite the student's new-context response and exclude viewing duration, completion, accent, fluency, and recognition errors as mastery evidence",
  }),
  systemField("VIDEO-VERIFY-F-STATUS", "Post-video Verification Status"),
  objectVersionField("VIDEO-VERIFY-F-VERSION", "Post-video Verification Version"),
];

const videoFactVerificationRef = pinnedReference({
  refFieldId: "VIDEO-FACT-F-VERIFICATION-REF",
  refLabel: "Pinned Post-video Verification",
  versionFieldId: "VIDEO-FACT-F-VERIFICATION-VERSION",
  versionLabel: "Pinned Post-video Verification Version",
  targetObjectId: "VIDEO-OBJ-VERIFICATION",
  targetVersionFieldId: "VIDEO-VERIFY-F-VERSION",
});
const videoFactAssetRef = pinnedReference({
  refFieldId: "VIDEO-FACT-F-ASSET-REF",
  refLabel: "Pinned Teaching Video Asset",
  versionFieldId: "VIDEO-FACT-F-ASSET-VERSION",
  versionLabel: "Pinned Teaching Video Asset Version",
  targetObjectId: "VIDEO-OBJ-ASSET",
  targetVersionFieldId: "VIDEO-ASSET-F-VERSION",
});
const videoLearningFactFields = [
  identityField("VIDEO-FACT-F-ID", "Post-video Learning Fact ID"),
  identityRefField("VIDEO-FACT-F-STUDENT-REF", "Learning Fact Student", "ORG-OBJ-STUDENT"),
  ...videoFactAssetRef.fields,
  ...videoFactVerificationRef.fields,
  identityRefField("VIDEO-FACT-F-TARGET-REF", "Learning Fact Ability Target", "CURR-OBJ-KNOWLEDGE-POINT"),
  systemField("VIDEO-FACT-F-TARGET-SOURCE-VERSION", "Learning Fact Target Source Version", "INTEGER", {
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-FACT-F-NEW-CONTEXT-DIGEST", "Learning Fact New-context Digest", "STRING", {
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-FACT-F-STRATEGY", "Learning Fact Verification Strategy", "STRING", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-VERIFICATION-STRATEGY" },
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-FACT-F-MODALITY", "Learning Fact Verification Modality", "STRING", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-VERIFICATION-MODALITY" },
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-FACT-F-RESULT", "Learning Fact Verification Result", "STRING", {
    valueSource: { kind: "OPTION_SET", optionSetId: "OPT-P2-VIDEO-VERIFICATION-RESULT" },
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-FACT-F-EVIDENCE", "Learning Fact Evidence", "JSON", {
    mutability: "IMMUTABLE",
    validation: "must bind video, new-context verification, student response, result, and excluded nonknowledge signals; viewing alone is never sufficient",
  }),
  systemField("VIDEO-FACT-F-RECORDED-AT", "Learning Fact Recorded Time", "DATETIME", {
    mutability: "IMMUTABLE",
  }),
  systemField("VIDEO-FACT-F-STATUS", "Post-video Learning Fact Status"),
  objectVersionField("VIDEO-FACT-F-VERSION", "Post-video Learning Fact Version"),
];

const videoObjects = [
  domainObject({
    id: "VIDEO-OBJ-REQUEST",
    label: "Problem-driven or Progress-driven Teaching Video Request",
    dataSubject: "STUDENT_LOCAL_TASK_EXECUTION",
    producerRef: "ROLE-STUDENT",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "SYSTEM",
    stewardRef: "DUTY-SUBJECT-TEACHER",
    states: ["ACCEPTED", "CANCELLED"],
    fields: videoRequestFields,
    identityFieldId: "VIDEO-REQUEST-F-ID",
    overrides: {
      exclusiveSourceGroups: [
        {
          id: "PROBLEM_DRIVEN",
          fieldIds: [
            "VIDEO-REQUEST-F-ACTIVITY-REF",
            "VIDEO-REQUEST-F-ACTIVITY-VERSION",
            "VIDEO-REQUEST-F-SUBMISSION-REF",
            "VIDEO-REQUEST-F-SUBMISSION-VERSION",
          ],
        },
        {
          id: "PROGRESS_DRIVEN",
          fieldIds: [
            "VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-REF",
            "VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-VERSION",
          ],
        },
      ],
      lineageBindings: [
        videoActivityRef.binding,
        videoSubmissionRef.binding,
        videoDecisionRef.binding,
        videoRubricRef.binding,
        videoPublishedResultRef.binding,
        videoMinimumProgressRef.binding,
        videoNextChoiceRef.binding,
        videoLicenseRef.binding,
        videoContentPermissionRef.binding,
      ],
    },
  }),
  domainObject({
    id: "VIDEO-OBJ-SCHOOL-REQUEST",
    label: "Teacher-requested School-private Class or Student-group Video Request",
    dataSubject: "STUDENT_LOCAL_TASK_EXECUTION",
    producerRef: "DUTY-SUBJECT-TEACHER",
    ownerRef: "ROLE-SCHOOL-ADMIN",
    confirmerRef: "DUTY-SUBJECT-TEACHER",
    stewardRef: "ROLE-SCHOOL-ADMIN",
    sensitivityId: "S3",
    states: ["ACCEPTED", "CANCELLED"],
    fields: videoSchoolRequestFields,
    identityFieldId: "VIDEO-SCHOOL-REQUEST-F-ID",
    overrides: {
      lineageBindings: [
        videoSchoolActivityRef.binding,
        videoSchoolLicenseRef.binding,
        videoSchoolPermissionRef.binding,
      ],
    },
  }),
  domainObject({
    id: "VIDEO-OBJ-ASSET",
    label: "Gated Controlled-playback Teaching Video Rendition with Record-level Governance",
    dataSubject: "STUDENT_LOCAL_TASK_EXECUTION",
    producerRef: "SYSTEM",
    ownerRef: "SYSTEM",
    confirmerRef: "SYSTEM",
    stewardRef: "DUTY-SUBJECT-TEACHER",
    states: ["GENERATING", "GATE_BLOCKED", "DELIVERED", "RECALLED"],
    fields: videoAssetFields,
    identityFieldId: "VIDEO-ASSET-F-ID",
    overrides: {
      exclusiveSourceGroups: [
        {
          id: "STUDENT_PERSONAL",
          fieldIds: ["VIDEO-ASSET-F-REQUEST-REF", "VIDEO-ASSET-F-REQUEST-VERSION"],
        },
        {
          id: "SCHOOL_PRIVATE",
          fieldIds: [
            "VIDEO-ASSET-F-SCHOOL-REQUEST-REF",
            "VIDEO-ASSET-F-SCHOOL-REQUEST-VERSION",
          ],
        },
      ],
      lineageBindings: [videoAssetRequestRef.binding, videoAssetSchoolRequestRef.binding],
    },
  }),
  domainObject({
    id: "VIDEO-OBJ-STUDENT-ENTITLEMENT",
    label: "Per-active-student Minimum Video Entitlement",
    dataSubject: "STUDENT_LOCAL_TASK_EXECUTION",
    producerRef: "SYSTEM",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "SYSTEM",
    stewardRef: "ROLE-SCHOOL-ADMIN",
    states: ["AVAILABLE", "EXHAUSTED", "SUSPENDED"],
    fields: videoEntitlementFields,
    identityFieldId: "VIDEO-ENTITLEMENT-F-ID",
  }),
  domainObject({
    id: "VIDEO-OBJ-SCHOOL-OVERFLOW-POOL",
    label: "School Shared Video Overflow Pool",
    dataSubject: "SCHOOL_SERVICE_CONFIGURATION",
    producerRef: "SYSTEM",
    ownerRef: "ROLE-SCHOOL-ADMIN",
    confirmerRef: "ROLE-SCHOOL-ADMIN",
    stewardRef: "ROLE-SCHOOL-ADMIN",
    lifecyclePolicyId: "LIFE-001",
    sensitivityId: "S2",
    states: ["AVAILABLE", "EXHAUSTED", "SUSPENDED"],
    fields: videoOverflowFields,
    identityFieldId: "VIDEO-OVERFLOW-F-ID",
  }),
  domainObject({
    id: "VIDEO-OBJ-QUOTA-LEDGER",
    label: "Reserve Settle and Release Video Quota Ledger",
    dataSubject: "STUDENT_LOCAL_TASK_EXECUTION",
    producerRef: "SYSTEM",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "SYSTEM",
    stewardRef: "ROLE-SCHOOL-ADMIN",
    states: ["RESERVED", "SETTLED", "RELEASED"],
    fields: videoLedgerFields,
    identityFieldId: "VIDEO-LEDGER-F-ID",
    overrides: {
      exclusiveSourceGroups: [
        { id: "STUDENT_MINIMUM", fieldIds: ["VIDEO-LEDGER-F-ENTITLEMENT-REF"] },
        { id: "SCHOOL_OVERFLOW", fieldIds: ["VIDEO-LEDGER-F-OVERFLOW-REF"] },
      ],
      lineageBindings: [videoLedgerRequestRef.binding],
    },
  }),
  domainObject({
    id: "VIDEO-OBJ-SCHOOL-QUOTA-LEDGER",
    label: "School-private Video Reserve Settle and Release Ledger",
    dataSubject: "SCHOOL_SERVICE_CONFIGURATION",
    producerRef: "SYSTEM",
    ownerRef: "ROLE-SCHOOL-ADMIN",
    confirmerRef: "SYSTEM",
    stewardRef: "ROLE-SCHOOL-ADMIN",
    sensitivityId: "S3",
    states: ["RESERVED", "SETTLED", "RELEASED"],
    fields: videoSchoolLedgerFields,
    identityFieldId: "VIDEO-SCHOOL-LEDGER-F-ID",
    overrides: { lineageBindings: [videoSchoolLedgerRequestRef.binding] },
  }),
  domainObject({
    id: "VIDEO-OBJ-VERIFICATION",
    label: "One-node Post-video New-context Verification",
    dataSubject: "STUDENT_LOCAL_TASK_EXECUTION",
    producerRef: "ROLE-STUDENT",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "SYSTEM",
    stewardRef: "DUTY-SUBJECT-TEACHER",
    states: [
      "AWAITING_FIRST_EXPRESSION",
      "FIRST_EXPRESSION_RECORDED",
      "RETURN_TO_TEACHING",
      "AWAITING_DIFFERENT_CONTEXT_EXPRESSION",
      "DIFFERENT_CONTEXT_EXPRESSION_RECORDED",
      "COMPLETED",
    ],
    fields: videoVerificationFields,
    identityFieldId: "VIDEO-VERIFY-F-ID",
    overrides: { lineageBindings: [videoVerificationAssetRef.binding] },
  }),
  domainObject({
    id: "VIDEO-OBJ-LEARNING-FACT",
    label: "Post-video New-context Learning Fact",
    dataSubject: "STUDENT_EVIDENCE_AND_MASTERY",
    producerRef: "SYSTEM",
    ownerRef: "ROLE-STUDENT",
    confirmerRef: "SYSTEM",
    stewardRef: "DUTY-SUBJECT-TEACHER",
    states: ["RECORDED", "INVALIDATED"],
    fields: videoLearningFactFields,
    identityFieldId: "VIDEO-FACT-F-ID",
    overrides: {
      lineageBindings: [videoFactAssetRef.binding, videoFactVerificationRef.binding],
    },
  }),
];

const commonVideoRequestInputs = [
  "VIDEO-REQUEST-F-STUDENT-REF",
  "VIDEO-REQUEST-F-REQUESTER-REF",
  "VIDEO-REQUEST-F-REQUESTER-KIND",
  "VIDEO-REQUEST-F-SERVICE-AUDIENCE",
  "VIDEO-REQUEST-F-SERVICE-OBJECT-REFS",
  "VIDEO-REQUEST-F-MANAGEMENT-SCOPE",
  "VIDEO-REQUEST-F-SOURCE-MATERIALS",
  "VIDEO-REQUEST-F-ACCESS-SCOPE",
  "VIDEO-REQUEST-F-ACCESS-DOMAIN",
  "VIDEO-REQUEST-F-KIND",
  "VIDEO-REQUEST-F-ASSESSMENT-RESULT-REF",
  "VIDEO-REQUEST-F-ASSESSMENT-RESULT-VERSION",
  "VIDEO-REQUEST-F-ASSESSMENT-STANDARD-REF",
  "VIDEO-REQUEST-F-ASSESSMENT-STANDARD-VERSION",
  "VIDEO-REQUEST-F-PUBLISHED-RESULT-REF",
  "VIDEO-REQUEST-F-PUBLISHED-RESULT-VERSION",
  "VIDEO-REQUEST-F-MINIMUM-PROGRESS-REF",
  "VIDEO-REQUEST-F-MINIMUM-PROGRESS-VERSION",
  "VIDEO-REQUEST-F-MATERIAL-RIGHTS-REF",
  "VIDEO-REQUEST-F-MATERIAL-RIGHTS-VERSION",
  "VIDEO-REQUEST-F-MATERIAL-PERMISSION-REF",
  "VIDEO-REQUEST-F-MATERIAL-PERMISSION-VERSION",
  "VIDEO-REQUEST-F-ANSWER-OPEN-POLICY-ID",
  "VIDEO-REQUEST-F-ANSWER-OPEN-POLICY-VERSION",
  "VIDEO-REQUEST-F-ANSWER-SOLUTION-RUBRIC-OPEN-AT",
  "VIDEO-REQUEST-F-SOURCE-BINDING-DIGEST",
];
const videoRequestOutputs = [
  "VIDEO-REQUEST-F-ID",
  "VIDEO-REQUEST-F-ACCEPTED-AT",
  "VIDEO-REQUEST-F-STATUS",
  "VIDEO-REQUEST-F-VERSION",
];
const videoAssetGovernanceInputFields = [
  "VIDEO-ASSET-F-REQUESTER-REF",
  "VIDEO-ASSET-F-REQUESTER-KIND",
  "VIDEO-ASSET-F-SERVICE-AUDIENCE",
  "VIDEO-ASSET-F-SERVICE-OBJECT-REFS",
  "VIDEO-ASSET-F-MANAGEMENT-SCOPE",
  "VIDEO-ASSET-F-SOURCE-MATERIALS",
  "VIDEO-ASSET-F-ACCESS-SCOPE",
  "VIDEO-ASSET-F-ACCESS-DOMAIN",
  "VIDEO-ASSET-F-MANAGER-REF",
  "VIDEO-ASSET-F-PROMOTION-POLICY",
];
const videoAssetGovernanceOutputFields = [...videoAssetGovernanceInputFields];

const videoActions = [
  action({
    id: "VIDEO-ACT-ENSURE-STUDENT-MINIMUM-ENTITLEMENT",
    label: "Ensure Minimum Video Entitlement for Every Active Phase-two Student",
    targetObjectId: "VIDEO-OBJ-STUDENT-ENTITLEMENT",
    operationKind: "CREATE",
    inputFieldIds: [
      "VIDEO-ENTITLEMENT-F-STUDENT-REF",
      "VIDEO-ENTITLEMENT-F-PERIOD",
      "VIDEO-ENTITLEMENT-F-MINIMUM-UNITS",
      "VIDEO-ENTITLEMENT-F-AVAILABLE-UNITS",
    ],
    outputFieldIds: [
      "VIDEO-ENTITLEMENT-F-ID",
      "VIDEO-ENTITLEMENT-F-STATUS",
      "VIDEO-ENTITLEMENT-F-VERSION",
    ],
    executionMode: SYSTEM_EVENT,
    trigger: { kind: "EVENT", eventId: "EVT-P2-VIDEO-ENTITLEMENT-PERIOD-OPENED" },
    permissions: [
      permission("ALLOW", "SYSTEM", "each active phase-two student receives a positive minimum usable-video guarantee for the period"),
      permission("DENY", "CURRENT_ACTOR", "no user may reduce minimum help by ranking, permanent weakness labels, or family payment ability"),
    ],
    successStates: ["AVAILABLE", "EXHAUSTED"],
    failureResults: ["PERMISSION_DENIED", "INVALID_MINIMUM_GUARANTEE", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-ENSURE-SCHOOL-OVERFLOW-POOL",
    label: "Ensure the School Shared Video Overflow Pool",
    targetObjectId: "VIDEO-OBJ-SCHOOL-OVERFLOW-POOL",
    operationKind: "CREATE",
    inputFieldIds: [
      "VIDEO-OVERFLOW-F-SCHOOL-REF",
      "VIDEO-OVERFLOW-F-PERIOD",
      "VIDEO-OVERFLOW-F-AVAILABLE-UNITS",
    ],
    outputFieldIds: [
      "VIDEO-OVERFLOW-F-ID",
      "VIDEO-OVERFLOW-F-STATUS",
      "VIDEO-OVERFLOW-F-VERSION",
    ],
    executionMode: SYSTEM_EVENT,
    trigger: { kind: "EVENT", eventId: "EVT-P2-VIDEO-ENTITLEMENT-PERIOD-OPENED" },
    permissions: [
      permission("ALLOW", "SYSTEM", "the phase-two school service creates one versioned shared overflow pool for the period"),
      permission("DENY", "ROLE-STUDENT", "a student cannot alter school overflow capacity or priority"),
    ],
    successStates: ["AVAILABLE", "EXHAUSTED"],
    failureResults: ["PERMISSION_DENIED", "VALIDATION_FAILED", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-REQUEST-PROBLEM-DRIVEN",
    label: "Request a Problem-driven Teaching Video",
    targetObjectId: "VIDEO-OBJ-REQUEST",
    operationKind: "CREATE",
    inputFieldIds: [
      ...commonVideoRequestInputs,
      "VIDEO-REQUEST-F-ACTIVITY-REF",
      "VIDEO-REQUEST-F-ACTIVITY-VERSION",
      "VIDEO-REQUEST-F-SUBMISSION-REF",
      "VIDEO-REQUEST-F-SUBMISSION-VERSION",
    ],
    acceptedInputValues: [
      {
        fieldId: "VIDEO-REQUEST-F-KIND",
        optionSetId: "OPT-P2-VIDEO-REQUEST-KIND",
        partitionId: "VIDEO-REQUEST-KIND",
        codes: ["PROBLEM_DRIVEN"],
      },
    ],
    outputFieldIds: videoRequestOutputs,
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student owns the pinned activity and submission, requester and service object both equal that student, the access domain is student-personal, the published assessment and answer-open policy permit this teaching use, and every source version and material right remains valid", {
        kind: "OWN_RECORD",
        subjectFieldId: "VIDEO-REQUEST-F-STUDENT-REF",
      }),
      permission("DENY", "AI", "AI cannot create a student request, select a target, or publish a class activity"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default access to a student's problem-driven request"),
    ],
    successState: "ACCEPTED",
    successData: "accepts a student-personal problem-driven request and records requester, individual serviced student, personal management, source materials, serviced-student-only access, and exact activity, submission, assessment, permission, rights, and answer-open versions without requiring a complete profile",
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "ANSWER_NOT_OPEN", "RIGHTS_NOT_VALID", "VALIDATION_FAILED", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-REQUEST-PROGRESS-DRIVEN",
    label: "Request a Student-selected Progress-driven Teaching Video",
    targetObjectId: "VIDEO-OBJ-REQUEST",
    operationKind: "CREATE",
    inputFieldIds: [
      ...commonVideoRequestInputs,
      "VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-REF",
      "VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-VERSION",
    ],
    acceptedInputValues: [
      {
        fieldId: "VIDEO-REQUEST-F-KIND",
        optionSetId: "OPT-P2-VIDEO-REQUEST-KIND",
        partitionId: "VIDEO-REQUEST-KIND",
        codes: ["PROGRESS_DRIVEN"],
      },
    ],
    outputFieldIds: videoRequestOutputs,
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "requester and service object both equal the student, the access domain is student-personal, the current target has completion evidence, the student explicitly selected the still-valid next target, and all assessment, permission, rights, and answer-open versions remain valid", {
        kind: "OWN_RECORD",
        subjectFieldId: "VIDEO-REQUEST-F-STUDENT-REF",
      }),
      permission("DENY", "AI", "AI cannot choose the next target, create the request, or automatically publish a class activity"),
      permission("DENY", "DUTY-SUBJECT-TEACHER", "a teacher cannot silently substitute a class activity for the student's personal next-target choice"),
    ],
    successState: "ACCEPTED",
    successData: "accepts a student-personal progress-driven request, records requester, individual serviced student, personal management, source materials, serviced-student-only access, and requires completion evidence plus the student's explicit choice using the minimum progress skeleton rather than a complete profile",
    failureResults: ["PERMISSION_DENIED", "COMPLETION_EVIDENCE_REQUIRED", "STUDENT_CHOICE_REQUIRED", "SOURCE_VERSION_STALE", "ANSWER_NOT_OPEN", "RIGHTS_NOT_VALID", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-REQUEST-SCHOOL-GROUP",
    label: "Request a School-private Class or Student-group Teaching Video",
    targetObjectId: "VIDEO-OBJ-SCHOOL-REQUEST",
    operationKind: "CREATE",
    inputFieldIds: videoSchoolRequestFields
      .map(({ id }) => id)
      .filter((id) => ![
        "VIDEO-SCHOOL-REQUEST-F-ID",
        "VIDEO-SCHOOL-REQUEST-F-ACCEPTED-AT",
        "VIDEO-SCHOOL-REQUEST-F-STATUS",
        "VIDEO-SCHOOL-REQUEST-F-VERSION",
      ].includes(id)),
    outputFieldIds: [
      "VIDEO-SCHOOL-REQUEST-F-ID",
      "VIDEO-SCHOOL-REQUEST-F-ACCEPTED-AT",
      "VIDEO-SCHOOL-REQUEST-F-STATUS",
      "VIDEO-SCHOOL-REQUEST-F-VERSION",
    ],
    permissions: [
      permission("ALLOW", "DUTY-SUBJECT-TEACHER", "the requesting teacher has an effective assigned subject, course, and class relation; the class or bounded student group is inside that scope; and every source material, answer-open rule, permission, and right remains valid"),
      permission("DENY", "AI", "AI cannot become the requester, widen the service group, publish to a class, promote the asset to school knowledge, or share it publicly"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default access to a school's private teaching request or serviced student group"),
    ],
    successState: "ACCEPTED",
    successData: "records the teacher requester, bounded service class or student group, school-private management, versioned source materials, and access scope; the school continues management after the teacher leaves and no cross-school migration or knowledge-layer promotion is implied",
    failureResults: ["PERMISSION_DENIED", "TEACHING_SCOPE_INVALID", "GROUP_SCOPE_INVALID", "SOURCE_VERSION_STALE", "ANSWER_NOT_OPEN", "RIGHTS_NOT_VALID", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-RESERVE-STUDENT-MINIMUM",
    label: "Reserve Student Minimum Video Quota at Request Acceptance",
    targetObjectId: "VIDEO-OBJ-QUOTA-LEDGER",
    operationKind: "CREATE",
    inputFieldIds: [
      "VIDEO-LEDGER-F-STUDENT-REF",
      "VIDEO-LEDGER-F-REQUEST-REF",
      "VIDEO-LEDGER-F-REQUEST-VERSION",
      "VIDEO-LEDGER-F-ENTITLEMENT-REF",
      "VIDEO-LEDGER-F-SOURCE",
      "VIDEO-LEDGER-F-PRIORITY",
      "VIDEO-LEDGER-F-RESERVED-UNITS",
    ],
    outputFieldIds: ["VIDEO-LEDGER-F-ID", "VIDEO-LEDGER-F-STATUS", "VIDEO-LEDGER-F-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-002"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "the request is ACCEPTED, the student's guaranteed units are available, and problem remediation is ordered before progress and nonessential generation"),
      permission("DENY", "CURRENT_ACTOR", "quota cannot be allocated by public ranking, permanent weakness labels, or family payment ability"),
    ],
    successState: "RESERVED",
    successData: "atomically reserves the active student's minimum entitlement at accepted-request time without settling usage",
    failureResults: ["PERMISSION_DENIED", "REQUEST_NOT_ACCEPTED", "QUOTA_UNAVAILABLE", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-RESERVE-SCHOOL-OVERFLOW",
    label: "Reserve School Overflow Video Quota at Request Acceptance",
    targetObjectId: "VIDEO-OBJ-QUOTA-LEDGER",
    operationKind: "CREATE",
    inputFieldIds: [
      "VIDEO-LEDGER-F-STUDENT-REF",
      "VIDEO-LEDGER-F-REQUEST-REF",
      "VIDEO-LEDGER-F-REQUEST-VERSION",
      "VIDEO-LEDGER-F-OVERFLOW-REF",
      "VIDEO-LEDGER-F-SOURCE",
      "VIDEO-LEDGER-F-PRIORITY",
      "VIDEO-LEDGER-F-RESERVED-UNITS",
    ],
    outputFieldIds: ["VIDEO-LEDGER-F-ID", "VIDEO-LEDGER-F-STATUS", "VIDEO-LEDGER-F-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-002"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "the request is ACCEPTED, the student's minimum path is unavailable or preserved, the school overflow pool has units, and problem remediation remains first priority"),
      permission("DENY", "CURRENT_ACTOR", "school overflow cannot bypass the per-student minimum or prioritize by ranking, labels, or family payment"),
    ],
    successState: "RESERVED",
    successData: "atomically reserves the school shared overflow pool at accepted-request time without settling usage",
    failureResults: ["PERMISSION_DENIED", "REQUEST_NOT_ACCEPTED", "QUOTA_UNAVAILABLE", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-RESERVE-SCHOOL-GROUP-OVERFLOW",
    label: "Reserve School Overflow for a School-private Group Video",
    targetObjectId: "VIDEO-OBJ-SCHOOL-QUOTA-LEDGER",
    operationKind: "CREATE",
    inputFieldIds: [
      "VIDEO-SCHOOL-LEDGER-F-REQUEST-REF",
      "VIDEO-SCHOOL-LEDGER-F-REQUEST-VERSION",
      "VIDEO-SCHOOL-LEDGER-F-OVERFLOW-REF",
      "VIDEO-SCHOOL-LEDGER-F-SERVICE-OBJECT-REFS",
      "VIDEO-SCHOOL-LEDGER-F-PRIORITY",
      "VIDEO-SCHOOL-LEDGER-F-RESERVED-UNITS",
    ],
    acceptedInputValues: [{
      fieldId: "VIDEO-SCHOOL-LEDGER-F-PRIORITY",
      optionSetId: "OPT-P2-VIDEO-QUOTA-PRIORITY",
      partitionId: "VIDEO-SCHOOL-QUOTA-PRIORITY",
      codes: ["PROBLEM_REMEDIATION", "PROGRESS_CORE", "NONESSENTIAL"],
    }],
    outputFieldIds: [
      "VIDEO-SCHOOL-LEDGER-F-ID",
      "VIDEO-SCHOOL-LEDGER-F-STATUS",
      "VIDEO-SCHOOL-LEDGER-F-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-005"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "the school-private request is ACCEPTED, the serviced class or student group remains in the teacher's assigned scope, and school overflow is available without reducing any student's protected minimum"),
      permission("DENY", "CURRENT_ACTOR", "a teacher, student, ranking, weakness label, or family payment cannot bypass the protected student minimum or alter quota priority"),
    ],
    successState: "RESERVED",
    successData: "reserves only the school overflow pool for the bounded school-private group request and leaves every student's positive minimum untouched",
    failureResults: ["PERMISSION_DENIED", "REQUEST_NOT_ACCEPTED", "GROUP_SCOPE_INVALID", "QUOTA_UNAVAILABLE", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-START-GENERATION",
    label: "Start Source-bound Teaching Video Generation",
    targetObjectId: "VIDEO-OBJ-ASSET",
    operationKind: "CREATE",
    inputFieldIds: [
      "VIDEO-ASSET-F-STUDENT-REF",
      "VIDEO-ASSET-F-REQUEST-REF",
      "VIDEO-ASSET-F-REQUEST-VERSION",
      ...videoAssetGovernanceInputFields,
    ],
    acceptedInputValues: [
      {
        fieldId: "VIDEO-ASSET-F-REQUESTER-KIND",
        optionSetId: "OPT-P2-VIDEO-REQUESTER-KIND",
        partitionId: "VIDEO-ASSET-REQUESTER",
        codes: ["STUDENT"],
      },
      {
        fieldId: "VIDEO-ASSET-F-SERVICE-AUDIENCE",
        optionSetId: "OPT-P2-VIDEO-SERVICE-AUDIENCE",
        partitionId: "VIDEO-ASSET-AUDIENCE",
        codes: ["INDIVIDUAL_STUDENT"],
      },
      {
        fieldId: "VIDEO-ASSET-F-MANAGEMENT-SCOPE",
        optionSetId: "OPT-P2-VIDEO-MANAGEMENT-SCOPE",
        partitionId: "VIDEO-ASSET-MANAGEMENT",
        codes: ["STUDENT_PERSONAL_LEARNING"],
      },
      {
        fieldId: "VIDEO-ASSET-F-ACCESS-SCOPE",
        optionSetId: "OPT-P2-VIDEO-ACCESS-SCOPE",
        partitionId: "VIDEO-ASSET-ACCESS-SCOPE",
        codes: ["SERVICED_STUDENT_ONLY"],
      },
      {
        fieldId: "VIDEO-ASSET-F-ACCESS-DOMAIN",
        optionSetId: "OPT-P2-VIDEO-ACCESS-DOMAIN",
        partitionId: "VIDEO-ASSET-ACCESS-DOMAIN",
        codes: ["STUDENT_PERSONAL"],
      },
    ],
    outputFieldIds: [
      "VIDEO-ASSET-F-ID",
      "VIDEO-ASSET-F-SCRIPT-GATE",
      "VIDEO-ASSET-F-RENDER-GATE",
      "VIDEO-ASSET-F-SAFETY-GATE",
      "VIDEO-ASSET-F-PRIVACY-GATE",
      "VIDEO-ASSET-F-RIGHTS-GATE",
      "VIDEO-ASSET-F-PEDAGOGY-GATE",
      "VIDEO-ASSET-F-PLAYABILITY-GATE",
      "VIDEO-ASSET-F-DOWNLOAD-POLICY",
      "VIDEO-ASSET-F-EXTERNAL-RECORDING-BOUNDARY",
      "VIDEO-ASSET-F-DELIVERY-STATUS",
      ...videoAssetGovernanceOutputFields,
      "VIDEO-ASSET-F-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-002"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "the accepted request has an active quota reservation and all pinned source versions remain valid"),
      permission("DENY", "AI", "the generation model cannot own the asset, become its manager, publish, deliver, or widen the source scope by itself"),
    ],
    successState: "GENERATING",
    successData: "creates a source-bound personal asset rendition with the requester, serviced student, student-personal management, source materials, access scope, seven independent PENDING gates, and no delivery; AI is never its manager",
    failureResults: ["PERMISSION_DENIED", "QUOTA_NOT_RESERVED", "SOURCE_VERSION_STALE", "PLATFORM_FAILURE", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-START-SCHOOL-GROUP-GENERATION",
    label: "Start a Source-bound School-private Group Video Generation",
    targetObjectId: "VIDEO-OBJ-ASSET",
    operationKind: "CREATE",
    inputFieldIds: [
      "VIDEO-ASSET-F-SCHOOL-REQUEST-REF",
      "VIDEO-ASSET-F-SCHOOL-REQUEST-VERSION",
      ...videoAssetGovernanceInputFields,
    ],
    acceptedInputValues: [
      {
        fieldId: "VIDEO-ASSET-F-REQUESTER-KIND",
        optionSetId: "OPT-P2-VIDEO-REQUESTER-KIND",
        partitionId: "VIDEO-ASSET-REQUESTER",
        codes: ["SUBJECT_TEACHER"],
      },
      {
        fieldId: "VIDEO-ASSET-F-SERVICE-AUDIENCE",
        optionSetId: "OPT-P2-VIDEO-SERVICE-AUDIENCE",
        partitionId: "VIDEO-ASSET-AUDIENCE",
        codes: ["CLASS", "STUDENT_GROUP"],
      },
      {
        fieldId: "VIDEO-ASSET-F-MANAGEMENT-SCOPE",
        optionSetId: "OPT-P2-VIDEO-MANAGEMENT-SCOPE",
        partitionId: "VIDEO-ASSET-MANAGEMENT",
        codes: ["SCHOOL_PRIVATE_TEACHING"],
      },
      {
        fieldId: "VIDEO-ASSET-F-ACCESS-SCOPE",
        optionSetId: "OPT-P2-VIDEO-ACCESS-SCOPE",
        partitionId: "VIDEO-ASSET-ACCESS-SCOPE",
        codes: ["AUTHORIZED_CLASS_OR_GROUP"],
      },
      {
        fieldId: "VIDEO-ASSET-F-ACCESS-DOMAIN",
        optionSetId: "OPT-P2-VIDEO-ACCESS-DOMAIN",
        partitionId: "VIDEO-ASSET-ACCESS-DOMAIN",
        codes: ["SCHOOL_PRIVATE"],
      },
    ],
    outputFieldIds: [
      "VIDEO-ASSET-F-ID",
      "VIDEO-ASSET-F-SCRIPT-GATE",
      "VIDEO-ASSET-F-RENDER-GATE",
      "VIDEO-ASSET-F-SAFETY-GATE",
      "VIDEO-ASSET-F-PRIVACY-GATE",
      "VIDEO-ASSET-F-RIGHTS-GATE",
      "VIDEO-ASSET-F-PEDAGOGY-GATE",
      "VIDEO-ASSET-F-PLAYABILITY-GATE",
      "VIDEO-ASSET-F-DOWNLOAD-POLICY",
      "VIDEO-ASSET-F-EXTERNAL-RECORDING-BOUNDARY",
      "VIDEO-ASSET-F-DELIVERY-STATUS",
      ...videoAssetGovernanceOutputFields,
      "VIDEO-ASSET-F-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-005"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "the teacher-requested school-private request and school-overflow reservation remain valid, the served class or group is still authorized, and every pinned source and right is current"),
      permission("DENY", "AI", "the generation model cannot own the asset, widen the service group, publish it, promote it to a knowledge layer, or migrate school-private source material to another school"),
    ],
    successState: "GENERATING",
    successData: "creates a source-bound school-private rendition whose requester, served class or group, school management, source materials, and access scope remain explicit after the requesting teacher leaves",
    failureResults: ["PERMISSION_DENIED", "QUOTA_NOT_RESERVED", "GROUP_SCOPE_INVALID", "SOURCE_VERSION_STALE", "RIGHTS_NOT_VALID", "PLATFORM_FAILURE", "VERSION_CONFLICT"],
  }),
  ...[
    ["SCRIPT", "Script", "VIDEO-ASSET-F-SCRIPT-GATE", "VIDEO-ASSET-F-SCRIPT-REF"],
    ["RENDER", "Rendered Media", "VIDEO-ASSET-F-RENDER-GATE", "VIDEO-ASSET-F-MEDIA-REF"],
    ["SAFETY", "Safety", "VIDEO-ASSET-F-SAFETY-GATE"],
    ["PRIVACY", "Privacy", "VIDEO-ASSET-F-PRIVACY-GATE"],
    ["RIGHTS", "Source Rights", "VIDEO-ASSET-F-RIGHTS-GATE"],
    ["PEDAGOGY", "Teaching Correctness", "VIDEO-ASSET-F-PEDAGOGY-GATE"],
    ["PLAYABILITY", "Playability", "VIDEO-ASSET-F-PLAYABILITY-GATE"],
  ].map(([suffix, gateLabel, gateFieldId, artifactFieldId]) => action({
    id: `VIDEO-ACT-CHECK-${suffix}`,
    label: `Check Teaching Video ${gateLabel} Gate`,
    targetObjectId: "VIDEO-OBJ-ASSET",
    operationKind: "UPDATE",
    outputFieldIds: [
      ...(artifactFieldId ? [artifactFieldId] : []),
      gateFieldId,
      "VIDEO-ASSET-F-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-002", "DF-P2-005"] },
    permissions: [
      permission("ALLOW", "SYSTEM", `the registered ${gateLabel.toLowerCase()} checker evaluates the pinned request and records PASSED, FAILED, or UNAVAILABLE independently`),
      permission("DENY", "AI", "a generation model cannot mark its own mandatory gate passed or bypass a failed, timed-out, or unavailable gate"),
    ],
    transition: { from: "GENERATING", to: "GENERATING" },
    successData: `records the independent ${gateLabel.toLowerCase()} gate outcome without implying any other gate passed`,
    failureResults: ["PERMISSION_DENIED", "SOURCE_VERSION_STALE", "GATE_CHECK_FAILED", "GATE_CHECK_UNAVAILABLE", "VERSION_CONFLICT"],
  })),
  action({
    id: "VIDEO-ACT-DELIVER-USABLE",
    label: "Deliver and Notify Only a Fully Gated Usable Teaching Video",
    targetObjectId: "VIDEO-OBJ-ASSET",
    operationKind: "UPDATE",
    inputFieldIds: [
      "VIDEO-ASSET-F-SCRIPT-GATE",
      "VIDEO-ASSET-F-RENDER-GATE",
      "VIDEO-ASSET-F-SAFETY-GATE",
      "VIDEO-ASSET-F-PRIVACY-GATE",
      "VIDEO-ASSET-F-RIGHTS-GATE",
      "VIDEO-ASSET-F-PEDAGOGY-GATE",
      "VIDEO-ASSET-F-PLAYABILITY-GATE",
    ],
    outputFieldIds: [
      "VIDEO-ASSET-F-SUBTITLE-REF",
      "VIDEO-ASSET-F-SUMMARY",
      "VIDEO-ASSET-F-LOW-BANDWIDTH-ALTERNATIVE",
      "VIDEO-ASSET-F-DOWNLOAD-POLICY",
      "VIDEO-ASSET-F-EXTERNAL-RECORDING-BOUNDARY",
      "VIDEO-ASSET-F-DELIVERY-STATUS",
      "VIDEO-ASSET-F-NOTIFIED-AT",
      "VIDEO-ASSET-F-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-002", "DF-P2-005"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "SCRIPT, RENDER, SAFETY, PRIVACY, RIGHTS, PEDAGOGY, and PLAYABILITY are all PASSED and the assessment or teacher-confirmed teaching basis, activity, service scope, permission, material rights, answer-open policy, and every pinned source version are rechecked as current immediately before delivery"),
      permission("DENY", "AI", "AI cannot deliver, notify, or downgrade around any mandatory gate"),
    ],
    transition: { from: "GENERATING", to: "DELIVERED" },
    risk: RISK.HIGH,
    successData: "delivers one usable controlled-playback asset with subtitles, summary, low-bandwidth alternative, and an authorized learner notification only after all seven gates pass",
    failureResults: ["PERMISSION_DENIED", "GATE_NOT_PASSED", "SOURCE_VERSION_STALE", "AUTHORIZATION_STALE", "ANSWER_NOT_OPEN", "RIGHTS_NOT_VALID", "PLATFORM_FAILURE", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-SETTLE-USABLE-DELIVERY",
    label: "Settle Video Quota Only after Usable Delivery",
    targetObjectId: "VIDEO-OBJ-QUOTA-LEDGER",
    operationKind: "UPDATE",
    outputFieldIds: [
      "VIDEO-LEDGER-F-SETTLED-UNITS",
      "VIDEO-LEDGER-F-STATUS",
      "VIDEO-LEDGER-F-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-002"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "the student has received a usable DELIVERED asset after all mandatory gates passed"),
      permission("DENY", "CURRENT_ACTOR", "processing completion, partial media, notification failure, or an unusable result cannot be counted as successful delivery"),
    ],
    transition: { from: "RESERVED", to: "SETTLED" },
    successData: "settles exactly the reserved units after usable delivery and never charges again for the same request version",
    failureResults: ["PERMISSION_DENIED", "USABLE_DELIVERY_REQUIRED", "ALREADY_SETTLED", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-SETTLE-SCHOOL-GROUP-DELIVERY",
    label: "Settle School Group Video Quota Only after Usable Delivery",
    targetObjectId: "VIDEO-OBJ-SCHOOL-QUOTA-LEDGER",
    operationKind: "UPDATE",
    outputFieldIds: [
      "VIDEO-SCHOOL-LEDGER-F-SETTLED-UNITS",
      "VIDEO-SCHOOL-LEDGER-F-STATUS",
      "VIDEO-SCHOOL-LEDGER-F-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-005"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "the authorized class or student group received a usable DELIVERED school-private asset after all mandatory gates passed"),
      permission("DENY", "CURRENT_ACTOR", "generation, partial media, notification, or an unusable group result cannot settle school overflow quota"),
    ],
    transition: { from: "RESERVED", to: "SETTLED" },
    successData: "settles the school overflow reservation once after usable school-private delivery without changing protected student minimum entitlements",
    failureResults: ["PERMISSION_DENIED", "USABLE_DELIVERY_REQUIRED", "ALREADY_SETTLED", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-VIEW-CONTROLLED",
    label: "View a Reauthorized Controlled-playback Teaching Video",
    targetObjectId: "VIDEO-OBJ-ASSET",
    operationKind: "READ",
    inputFieldIds: ["VIDEO-ASSET-F-STUDENT-REF", "VIDEO-ASSET-F-ACCESS-DOMAIN"],
    acceptedInputValues: [{
      fieldId: "VIDEO-ASSET-F-ACCESS-DOMAIN",
      optionSetId: "OPT-P2-VIDEO-ACCESS-DOMAIN",
      partitionId: "VIDEO-ASSET-VIEW-ACCESS-DOMAIN",
      codes: ["STUDENT_PERSONAL"],
    }],
    outputFieldIds: [
      "VIDEO-ASSET-F-STUDENT-REF",
      "VIDEO-ASSET-F-MEDIA-REF",
      "VIDEO-ASSET-F-SUBTITLE-REF",
      "VIDEO-ASSET-F-SUMMARY",
      "VIDEO-ASSET-F-LOW-BANDWIDTH-ALTERNATIVE",
      "VIDEO-ASSET-F-DOWNLOAD-POLICY",
      "VIDEO-ASSET-F-EXTERNAL-RECORDING-BOUNDARY",
      "VIDEO-ASSET-F-DELIVERY-STATUS",
      "VIDEO-ASSET-F-ACCESS-DOMAIN",
      "VIDEO-ASSET-F-VERSION",
    ],
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "every access reauthorizes the current student relation, source permission, material rights, answer-open policy, asset validity, and not-recalled status before controlled playback", {
        kind: "OWN_RECORD",
        subjectFieldId: "VIDEO-ASSET-F-STUDENT-REF",
      }),
      permission("DENY", "ROLE-SCHOOL-ADMIN", "school administration has no default playback access to an individual student's video"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default playback access to an individual student's video"),
    ],
    successData: "streams controlled playback with subtitles, summary, and text, image, or low-bandwidth alternatives; the product offers no ordinary file download, makes no claim that external recording can be prevented, and records that viewing or completion alone is not mastery evidence",
    failureResults: ["PERMISSION_DENIED", "NOT_FOUND", "SOURCE_VERSION_STALE", "AUTHORIZATION_STALE", "ANSWER_NOT_OPEN", "RIGHTS_NOT_VALID", "VIDEO_RECALLED"],
  }),
  action({
    id: "VIDEO-ACT-VIEW-SCHOOL-PRIVATE",
    label: "View a Reauthorized School-private Class or Group Teaching Video",
    targetObjectId: "VIDEO-OBJ-ASSET",
    operationKind: "READ",
    inputFieldIds: ["VIDEO-ASSET-F-SERVICE-OBJECT-REFS", "VIDEO-ASSET-F-ACCESS-DOMAIN"],
    acceptedInputValues: [{
      fieldId: "VIDEO-ASSET-F-ACCESS-DOMAIN",
      optionSetId: "OPT-P2-VIDEO-ACCESS-DOMAIN",
      partitionId: "VIDEO-ASSET-VIEW-ACCESS-DOMAIN",
      codes: ["SCHOOL_PRIVATE"],
    }],
    outputFieldIds: [
      "VIDEO-ASSET-F-SERVICE-OBJECT-REFS",
      "VIDEO-ASSET-F-MEDIA-REF",
      "VIDEO-ASSET-F-SUBTITLE-REF",
      "VIDEO-ASSET-F-SUMMARY",
      "VIDEO-ASSET-F-LOW-BANDWIDTH-ALTERNATIVE",
      "VIDEO-ASSET-F-DOWNLOAD-POLICY",
      "VIDEO-ASSET-F-EXTERNAL-RECORDING-BOUNDARY",
      "VIDEO-ASSET-F-DELIVERY-STATUS",
      "VIDEO-ASSET-F-ACCESS-DOMAIN",
      "VIDEO-ASSET-F-VERSION",
    ],
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student has a current relation inside the recorded serviced class or bounded student group and every source, right, answer-open, asset-validity, and not-recalled check passes"),
      permission("ALLOW", "DUTY-SUBJECT-TEACHER", "the teacher has a current assigned subject and class relation matching the recorded school-private service scope"),
      permission("DENY", "ROLE-SCHOOL-ADMIN", "school management ownership does not grant default playback access to detailed learner-facing content"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default playback access to a school's private teaching asset"),
    ],
    successData: "streams the school-private asset only to current authorized class or group members and assigned teachers; teacher departure leaves school management intact, and viewing alone is not mastery evidence",
    failureResults: ["PERMISSION_DENIED", "NOT_FOUND", "OUTSIDE_SERVICE_SCOPE", "SOURCE_VERSION_STALE", "AUTHORIZATION_STALE", "ANSWER_NOT_OPEN", "RIGHTS_NOT_VALID", "VIDEO_RECALLED"],
  }),
  action({
    id: "VIDEO-ACT-BLOCK-DELIVERY",
    label: "Block Teaching Video Delivery on Gate or Platform Failure",
    targetObjectId: "VIDEO-OBJ-ASSET",
    operationKind: "UPDATE",
    outputFieldIds: ["VIDEO-ASSET-F-DELIVERY-STATUS", "VIDEO-ASSET-F-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-003"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "a mandatory gate failed, timed out, was unavailable, or the platform failed before usable delivery"),
      permission("DENY", "AI", "AI cannot bypass the block or expose partial script or media to the student"),
    ],
    transition: { from: "GENERATING", to: "GATE_BLOCKED" },
    risk: RISK.HIGH,
    successData: "keeps the asset undelivered, exposes only safe status, and leaves text, image, or low-bandwidth help available",
    failureResults: ["PERMISSION_DENIED", "NO_BLOCKING_CONDITION", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-RECALL",
    label: "Recall a Delivered or Blocked Teaching Video",
    targetObjectId: "VIDEO-OBJ-ASSET",
    operationKind: "UPDATE",
    inputFieldIds: ["VIDEO-ASSET-F-RECALL-REASON"],
    outputFieldIds: [
      "VIDEO-ASSET-F-RECALL-REASON",
      "VIDEO-ASSET-F-DELIVERY-STATUS",
      "VIDEO-ASSET-F-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-003"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "student deletion, transfer limits, source withdrawal, rights change, or content recall requires playback to stop"),
      permission("DENY", "AI", "a generation model cannot suppress, reverse, or hide a recall"),
    ],
    transition: { from: ["DELIVERED", "GATE_BLOCKED"], to: "RECALLED" },
    risk: RISK.HIGH,
    successData: "stops playback and triggers governed deletion, migration restriction, or access removal without claiming external copies can be recalled",
    failureResults: ["PERMISSION_DENIED", "RECALL_REASON_REQUIRED", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-RELEASE-QUOTA",
    label: "Release Reserved Video Quota without Duplicate Charge",
    targetObjectId: "VIDEO-OBJ-QUOTA-LEDGER",
    operationKind: "UPDATE",
    inputFieldIds: ["VIDEO-LEDGER-F-RELEASE-REASON"],
    acceptedInputValues: [{
      fieldId: "VIDEO-LEDGER-F-RELEASE-REASON",
      optionSetId: "OPT-P2-VIDEO-RELEASE-REASON",
      partitionId: "VIDEO-QUOTA-RELEASE-REASON",
      codes: ["PLATFORM_FAILURE", "GATE_BLOCK", "CONTENT_RECALL", "AUTOMATIC_RETRY"],
    }],
    outputFieldIds: [
      "VIDEO-LEDGER-F-RELEASE-REASON",
      "VIDEO-LEDGER-F-STATUS",
      "VIDEO-LEDGER-F-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-003"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "the student did not receive a usable result because of platform failure, a mandatory gate block, content recall, or automatic retry"),
      permission("DENY", "CURRENT_ACTOR", "a failed, blocked, recalled, or automatically retried request cannot remain charged or be deducted again"),
    ],
    transition: { from: "RESERVED", to: "RELEASED" },
    successData: "releases the full reservation and makes automatic retry eligible for a fresh reservation without duplicate deduction",
    failureResults: ["PERMISSION_DENIED", "RELEASE_REASON_REQUIRED", "ALREADY_SETTLED", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-RELEASE-SCHOOL-GROUP-QUOTA",
    label: "Release School Group Video Quota without Duplicate Charge",
    targetObjectId: "VIDEO-OBJ-SCHOOL-QUOTA-LEDGER",
    operationKind: "UPDATE",
    inputFieldIds: ["VIDEO-SCHOOL-LEDGER-F-RELEASE-REASON"],
    acceptedInputValues: [{
      fieldId: "VIDEO-SCHOOL-LEDGER-F-RELEASE-REASON",
      optionSetId: "OPT-P2-VIDEO-RELEASE-REASON",
      partitionId: "VIDEO-SCHOOL-QUOTA-RELEASE-REASON",
      codes: ["PLATFORM_FAILURE", "GATE_BLOCK", "CONTENT_RECALL", "AUTOMATIC_RETRY"],
    }],
    outputFieldIds: [
      "VIDEO-SCHOOL-LEDGER-F-RELEASE-REASON",
      "VIDEO-SCHOOL-LEDGER-F-STATUS",
      "VIDEO-SCHOOL-LEDGER-F-VERSION",
    ],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-003"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "the school-private group received no usable result because of platform failure, gate block, content recall, or automatic retry"),
      permission("DENY", "CURRENT_ACTOR", "a blocked, recalled, or automatically retried group request cannot remain charged or consume a second reservation"),
    ],
    transition: { from: "RESERVED", to: "RELEASED" },
    successData: "releases the school overflow reservation without touching protected student minimum entitlements or duplicating a deduction",
    failureResults: ["PERMISSION_DENIED", "RELEASE_REASON_REQUIRED", "ALREADY_SETTLED", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-START-NEW-CONTEXT-VERIFICATION",
    label: "Start One-node Post-video New-context Verification",
    targetObjectId: "VIDEO-OBJ-VERIFICATION",
    operationKind: "CREATE",
    inputFieldIds: [
      "VIDEO-VERIFY-F-STUDENT-REF",
      "VIDEO-VERIFY-F-ASSET-REF",
      "VIDEO-VERIFY-F-TARGET-REF",
      "VIDEO-VERIFY-F-TARGET-KIND",
      "VIDEO-VERIFY-F-STRATEGY",
      "VIDEO-VERIFY-F-MODALITY",
      "VIDEO-VERIFY-F-ABILITY-NODE-REFS",
    ],
    acceptedInputValues: [
      {
        fieldId: "VIDEO-VERIFY-F-TARGET-KIND",
        optionSetId: "OPT-P2-VIDEO-VERIFICATION-TARGET-KIND",
        partitionId: "VIDEO-VERIFY-TARGET-KIND",
        codes: ["CONCEPT", "CAUSAL", "LOGIC", "METHOD", "CHARACTER", "WORD", "FIXED_COLLOCATION", "MECHANICAL_FLUENCY"],
      },
      {
        fieldId: "VIDEO-VERIFY-F-STRATEGY",
        optionSetId: "OPT-P2-VIDEO-VERIFICATION-STRATEGY",
        partitionId: "VIDEO-VERIFY-STRATEGY",
        codes: ["ADAPTIVE_NEW_CONTEXT", "FEYNMAN_ON_DEMAND", "RETRIEVAL_PRACTICE", "SPACED_REVIEW"],
      },
      {
        fieldId: "VIDEO-VERIFY-F-MODALITY",
        optionSetId: "OPT-P2-VIDEO-VERIFICATION-MODALITY",
        partitionId: "VIDEO-VERIFY-MODALITY",
        codes: ["TEXT", "MATH_HANDWRITING", "STRUCTURED_QA", "VARIANT_PRACTICE", "VOICE_OPTIONAL"],
      },
    ],
    outputFieldIds: [
      "VIDEO-VERIFY-F-ID",
      "VIDEO-VERIFY-F-ASSET-VERSION",
      "VIDEO-VERIFY-F-TARGET-SOURCE-VERSION",
      "VIDEO-VERIFY-F-NEW-CONTEXT-DIGEST",
      "VIDEO-VERIFY-F-FIRST-PROMPT-POLICY",
      "VIDEO-VERIFY-F-MAX-SPECIFIC-GAPS-PER-TURN",
      "VIDEO-VERIFY-F-EXCLUDED-NONKNOWLEDGE-SIGNALS",
      "VIDEO-VERIFY-F-STATUS",
      "VIDEO-VERIFY-F-VERSION",
    ],
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the delivered, not-recalled asset serves this student; the system creates a target-appropriate new context; Feynman is on-demand only for concept, causal, logic, or method targets; character, word, fixed-collocation, or mechanical-fluency targets use retrieval practice or spaced review; one ability node is selected; and voice remains optional", {
        kind: "OWN_RECORD",
        subjectFieldId: "VIDEO-VERIFY-F-STUDENT-REF",
      }),
      permission("DENY", "AI", "AI cannot treat playback, completion, speaking style, accent, fluency, or recognition output as mastery or choose multiple ability nodes"),
    ],
    successState: "AWAITING_FIRST_EXPRESSION",
    successData: "opens one new-context verification with no answer-style hint before the student's first independent expression, at most one specific follow-up gap, equivalent nonvoice modalities, and explicit nonknowledge-signal exclusions",
    failureResults: ["PERMISSION_DENIED", "VIDEO_NOT_DELIVERED", "VIDEO_RECALLED", "TARGET_SCOPE_INVALID", "STRATEGY_NOT_APPLICABLE", "MULTIPLE_ABILITY_NODES", "SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-SUBMIT-FIRST-INDEPENDENT-EXPRESSION",
    label: "Submit the First Independent Verification Expression",
    targetObjectId: "VIDEO-OBJ-VERIFICATION",
    operationKind: "UPDATE",
    inputFieldIds: ["VIDEO-VERIFY-F-FIRST-EXPRESSION"],
    outputFieldIds: ["VIDEO-VERIFY-F-FIRST-EXPRESSION", "VIDEO-VERIFY-F-STATUS", "VIDEO-VERIFY-F-VERSION"],
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student submits an independent response before any answer-style hint and may use text, mathematical handwriting, structured Q&A, variant practice, or optional voice"),
      permission("DENY", "AI", "AI cannot supply, complete, or rewrite the student's first expression"),
    ],
    transition: { from: "AWAITING_FIRST_EXPRESSION", to: "FIRST_EXPRESSION_RECORDED" },
    successData: "records the student's first independent expression without inferring mastery from playback or presentation style",
    failureResults: ["PERMISSION_DENIED", "ANSWER_HINT_ALREADY_SHOWN", "EMPTY_EXPRESSION", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-PURSUE-ONE-SPECIFIC-GAP",
    label: "Pursue at Most One Specific Verification Gap",
    targetObjectId: "VIDEO-OBJ-VERIFICATION",
    operationKind: "UPDATE",
    outputFieldIds: ["VIDEO-VERIFY-F-SPECIFIC-GAP", "VIDEO-VERIFY-F-STATUS", "VIDEO-VERIFY-F-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-004"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "after the student's first expression, the AI verifier may ask about only one concrete content-supported gap and the system excludes accent, fluency, and recognition errors"),
      permission("DENY", "AI", "the model cannot write a durable knowledge gap, ask multiple gaps in one turn, or use speech presentation quality as the gap basis"),
    ],
    transition: { from: "FIRST_EXPRESSION_RECORDED", to: "FIRST_EXPRESSION_RECORDED" },
    successData: "records at most one concrete follow-up focus without turning it into a durable mastery or weakness judgment",
    failureResults: ["PERMISSION_DENIED", "FIRST_EXPRESSION_REQUIRED", "MULTIPLE_GAPS", "NONKNOWLEDGE_SIGNAL_ONLY", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-RETURN-UNKNOWN-TO-TEACHING",
    label: "Return an Unknown Response to Gap Teaching",
    targetObjectId: "VIDEO-OBJ-VERIFICATION",
    operationKind: "UPDATE",
    inputFieldIds: ["VIDEO-VERIFY-F-UNKNOWN-DECLARATION"],
    outputFieldIds: ["VIDEO-VERIFY-F-UNKNOWN-DECLARATION", "VIDEO-VERIFY-F-RETEACHING-REF", "VIDEO-VERIFY-F-STATUS", "VIDEO-VERIFY-F-VERSION"],
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student may state that the student does not know; the system returns to the one identified teaching gap without scoring presentation style"),
      permission("DENY", "AI", "AI cannot convert an unknown declaration into a permanent weakness, punishment, rank, or mastery result"),
    ],
    transition: { from: ["AWAITING_FIRST_EXPRESSION", "FIRST_EXPRESSION_RECORDED"], to: "RETURN_TO_TEACHING" },
    successData: "returns to targeted teaching and requires a materially different context before another result can be recorded",
    failureResults: ["PERMISSION_DENIED", "UNKNOWN_DECLARATION_REQUIRED", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-RETRY-DIFFERENT-CONTEXT",
    label: "Retry Verification in a Materially Different Context",
    targetObjectId: "VIDEO-OBJ-VERIFICATION",
    operationKind: "UPDATE",
    inputFieldIds: ["VIDEO-VERIFY-F-RETRY-REQUEST"],
    outputFieldIds: ["VIDEO-VERIFY-F-RETRY-REQUEST", "VIDEO-VERIFY-F-DIFFERENT-CONTEXT-DIGEST", "VIDEO-VERIFY-F-STATUS", "VIDEO-VERIFY-F-VERSION"],
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "after targeted reteaching the student starts a materially different context with the same one-node and no-answer-hint protections"),
      permission("DENY", "AI", "AI cannot reuse the answer, teaching example, or first verification context as the retry"),
    ],
    transition: { from: "RETURN_TO_TEACHING", to: "AWAITING_DIFFERENT_CONTEXT_EXPRESSION" },
    successData: "opens a different-context retry without changing the original response or claiming mastery",
    failureResults: ["PERMISSION_DENIED", "RETEACHING_REQUIRED", "CONTEXT_NOT_DIFFERENT", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-SUBMIT-DIFFERENT-CONTEXT-EXPRESSION",
    label: "Submit the Different-context Verification Expression",
    targetObjectId: "VIDEO-OBJ-VERIFICATION",
    operationKind: "UPDATE",
    inputFieldIds: ["VIDEO-VERIFY-F-DIFFERENT-CONTEXT-EXPRESSION"],
    outputFieldIds: ["VIDEO-VERIFY-F-DIFFERENT-CONTEXT-EXPRESSION", "VIDEO-VERIFY-F-STATUS", "VIDEO-VERIFY-F-VERSION"],
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student independently responds in the different context using any allowed voice or nonvoice modality"),
      permission("DENY", "AI", "AI cannot supply the retry response or make voice mandatory"),
    ],
    transition: { from: "AWAITING_DIFFERENT_CONTEXT_EXPRESSION", to: "DIFFERENT_CONTEXT_EXPRESSION_RECORDED" },
    successData: "records the independent different-context response without presentation-style scoring",
    failureResults: ["PERMISSION_DENIED", "ANSWER_HINT_ALREADY_SHOWN", "EMPTY_EXPRESSION", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-COMPLETE-NEW-CONTEXT-VERIFICATION",
    label: "Complete the New-context Verification without a Mastery Claim",
    targetObjectId: "VIDEO-OBJ-VERIFICATION",
    operationKind: "UPDATE",
    outputFieldIds: ["VIDEO-VERIFY-F-RESULT", "VIDEO-VERIFY-F-EVIDENCE", "VIDEO-VERIFY-F-STATUS", "VIDEO-VERIFY-F-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-004"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "a student response exists in the applicable new context and the evidence excludes viewing, completion, accent, fluency, and recognition errors from mastery or knowledge-gap inference"),
      permission("DENY", "AI", "AI cannot convert this single result into durable mastery, punishment, ranking, or an unsupported knowledge gap"),
    ],
    transition: { from: ["FIRST_EXPRESSION_RECORDED", "DIFFERENT_CONTEXT_EXPRESSION_RECORDED"], to: "COMPLETED" },
    successData: "records only demonstrated-in-this-context, needs-reteaching, or undetermined with verifiable response evidence",
    failureResults: ["PERMISSION_DENIED", "STUDENT_RESPONSE_REQUIRED", "NONKNOWLEDGE_SIGNAL_ONLY", "UNSUPPORTED_MASTERY_CLAIM", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-RECORD-POST-VIDEO-LEARNING-FACT",
    label: "Record the Video Verification and Result as a New Learning Fact",
    targetObjectId: "VIDEO-OBJ-LEARNING-FACT",
    operationKind: "CREATE",
    inputFieldIds: [
      "VIDEO-FACT-F-STUDENT-REF",
      "VIDEO-FACT-F-ASSET-REF",
      "VIDEO-FACT-F-ASSET-VERSION",
      "VIDEO-FACT-F-VERIFICATION-REF",
      "VIDEO-FACT-F-VERIFICATION-VERSION",
      "VIDEO-FACT-F-TARGET-REF",
      "VIDEO-FACT-F-TARGET-SOURCE-VERSION",
      "VIDEO-FACT-F-NEW-CONTEXT-DIGEST",
      "VIDEO-FACT-F-STRATEGY",
      "VIDEO-FACT-F-MODALITY",
      "VIDEO-FACT-F-RESULT",
      "VIDEO-FACT-F-EVIDENCE",
    ],
    acceptedInputValues: [
      {
        fieldId: "VIDEO-FACT-F-STRATEGY",
        optionSetId: "OPT-P2-VIDEO-VERIFICATION-STRATEGY",
        partitionId: "VIDEO-FACT-STRATEGY",
        codes: ["ADAPTIVE_NEW_CONTEXT", "FEYNMAN_ON_DEMAND", "RETRIEVAL_PRACTICE", "SPACED_REVIEW"],
      },
      {
        fieldId: "VIDEO-FACT-F-MODALITY",
        optionSetId: "OPT-P2-VIDEO-VERIFICATION-MODALITY",
        partitionId: "VIDEO-FACT-MODALITY",
        codes: ["TEXT", "MATH_HANDWRITING", "STRUCTURED_QA", "VARIANT_PRACTICE", "VOICE_OPTIONAL"],
      },
      {
        fieldId: "VIDEO-FACT-F-RESULT",
        optionSetId: "OPT-P2-VIDEO-VERIFICATION-RESULT",
        partitionId: "VIDEO-FACT-RESULT",
        codes: ["DEMONSTRATED_IN_NEW_CONTEXT", "NEEDS_RETEACHING", "UNDETERMINED"],
      },
    ],
    outputFieldIds: ["VIDEO-FACT-F-ID", "VIDEO-FACT-F-RECORDED-AT", "VIDEO-FACT-F-STATUS", "VIDEO-FACT-F-VERSION"],
    executionMode: FLOW_INTERNAL,
    trigger: { kind: "FLOW", flowIds: ["DF-P2-004"] },
    permissions: [
      permission("ALLOW", "SYSTEM", "the video source, completed one-node new-context verification, response evidence, result, and excluded nonknowledge signals are all version-pinned"),
      permission("DENY", "AI", "AI cannot create a learning fact from viewing, watch completion, accent, fluency, recognition error, or an uncompleted verification"),
    ],
    successState: "RECORDED",
    successData: "creates a new raw learning fact binding video, verification, response, and contextual result; it remains separate from durable mastery interpretation",
    failureResults: ["PERMISSION_DENIED", "VERIFICATION_NOT_COMPLETED", "SOURCE_VERSION_STALE", "UNSUPPORTED_MASTERY_CLAIM", "VERSION_CONFLICT"],
  }),
  action({
    id: "VIDEO-ACT-VIEW-POST-VIDEO-LEARNING-FACT",
    label: "View a Scoped Post-video Learning Fact",
    targetObjectId: "VIDEO-OBJ-LEARNING-FACT",
    operationKind: "READ",
    inputFieldIds: ["VIDEO-FACT-F-STUDENT-REF"],
    outputFieldIds: videoLearningFactFields.map(({ id }) => id),
    permissions: [
      permission("ALLOW", "ROLE-STUDENT", "the student reads only the student's own post-video fact", {
        kind: "OWN_RECORD",
        subjectFieldId: "VIDEO-FACT-F-STUDENT-REF",
      }),
      permission("ALLOW", "DUTY-SUBJECT-TEACHER", "the corresponding subject teacher reads the fact only in the assigned student, class, course, and target scope"),
      permission("ALLOW", "DUTY-HOMEROOM", "the homeroom teacher reads all-subject facts for the assigned class without changing subject interpretation"),
      permission("DENY", "ROLE-SCHOOL-ADMIN", "school administration has no default access to individual post-video learning facts"),
      permission("DENY", "ROLE-PLATFORM-OPS", "platform operations has no default access to individual post-video learning facts"),
    ],
    successData: "returns the versioned raw learning fact and its limitations without promoting it to durable mastery",
    failureResults: ["PERMISSION_DENIED", "NOT_FOUND", "SOURCE_VERSION_STALE"],
  }),
];

const videoPages = [
  page(
    "VIDEO-PAGE-STUDENT-REQUEST",
    "Student Problem or Progress Teaching Video Request",
    ["VIDEO-OBJ-REQUEST"],
    videoRequestFields.map(({ id }) => id),
    ["VIDEO-ACT-REQUEST-PROBLEM-DRIVEN", "VIDEO-ACT-REQUEST-PROGRESS-DRIVEN"],
  ),
  page(
    "VIDEO-PAGE-TEACHER-SCHOOL-REQUEST",
    "Teacher School-private Class or Student-group Video Request",
    ["VIDEO-OBJ-SCHOOL-REQUEST"],
    videoSchoolRequestFields.map(({ id }) => id),
    ["VIDEO-ACT-REQUEST-SCHOOL-GROUP"],
  ),
  page(
    "VIDEO-PAGE-CONTROLLED-PLAYBACK",
    "Controlled Teaching Video Playback and Alternatives",
    ["VIDEO-OBJ-ASSET"],
    videoAssetFields.map(({ id }) => id),
    ["VIDEO-ACT-VIEW-CONTROLLED", "VIDEO-ACT-VIEW-SCHOOL-PRIVATE"],
  ),
  page(
    "VIDEO-PAGE-POST-VIDEO-VERIFICATION",
    "Post-video New-context Verification and Learning Fact",
    ["VIDEO-OBJ-VERIFICATION", "VIDEO-OBJ-LEARNING-FACT"],
    [...videoVerificationFields, ...videoLearningFactFields].map(({ id }) => id),
    [
      "VIDEO-ACT-START-NEW-CONTEXT-VERIFICATION",
      "VIDEO-ACT-SUBMIT-FIRST-INDEPENDENT-EXPRESSION",
      "VIDEO-ACT-RETURN-UNKNOWN-TO-TEACHING",
      "VIDEO-ACT-RETRY-DIFFERENT-CONTEXT",
      "VIDEO-ACT-SUBMIT-DIFFERENT-CONTEXT-EXPRESSION",
      "VIDEO-ACT-VIEW-POST-VIDEO-LEARNING-FACT",
    ],
  ),
];

const videoModule = moduleFact({
  id: "VIDEO-001",
  phase: PHASE.SECOND,
  releaseStatus: RELEASE_STATUS.PLANNED,
  priority: "P0",
  title: "Phase-two Source-bound Teaching Video and New-context Verification",
  objective: "Generate student-personal or school-private problem/progress teaching videos with explicit requester, service object, management, source, and access governance; seven fail-closed gates; controlled playback; fair quota; and one-node new-context verification that records a raw learning fact instead of treating viewing as mastery",
  entryConditions: ["the requester, service object, assigned teaching or student scope, request source, assessment or teaching basis, answer-open policy, permissions, material rights, minimum progress when applicable, and phase-two service entitlement are current"],
  exitConditions: ["authorized learners receive a usable fully gated video or safe alternative, every quota reservation is settled or released exactly once, and any learning claim is backed by a separate new-context verification fact"],
  baselineDecisionIds: ["BASE-001", "BASE-003", "BASE-004", "BASE-005", "BASE-007", "BASE-010"],
  nfrIds: ["NFR-002", "NFR-005", "NFR-006", "NFR-008", "NFR-009"],
  dependencyModuleIds: ["ORG-001", "CURR-001", "PROG-001", "HW-001", "SUB-001", "GRD-001", "PUB-001", "CONTENT-001"],
  objects: videoObjects,
  relationships: [
    {
      id: "VIDEO-REL-ASSET-REQUEST",
      fromObjectId: "VIDEO-OBJ-ASSET",
      toObjectId: "VIDEO-OBJ-REQUEST",
      type: "DERIVED_FROM",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_STUDENT",
      onSourceInvalidation: "block delivery or recall playback while preserving the versioned request and audit history",
    },
    {
      id: "VIDEO-REL-LEDGER-REQUEST",
      fromObjectId: "VIDEO-OBJ-QUOTA-LEDGER",
      toObjectId: "VIDEO-OBJ-REQUEST",
      type: "REFERENCES",
      cardinality: "ONE_TO_ONE",
      ownershipScope: "SAME_STUDENT",
      onSourceInvalidation: "release an unsettled reservation and never duplicate a deduction",
    },
    {
      id: "VIDEO-REL-ASSET-SCHOOL-REQUEST",
      fromObjectId: "VIDEO-OBJ-ASSET",
      toObjectId: "VIDEO-OBJ-SCHOOL-REQUEST",
      type: "DERIVED_FROM",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "block or recall the school-private rendition, preserve school management history, and prohibit unconditional cross-school migration",
    },
    {
      id: "VIDEO-REL-SCHOOL-LEDGER-REQUEST",
      fromObjectId: "VIDEO-OBJ-SCHOOL-QUOTA-LEDGER",
      toObjectId: "VIDEO-OBJ-SCHOOL-REQUEST",
      type: "REFERENCES",
      cardinality: "ONE_TO_ONE",
      ownershipScope: "SAME_SCHOOL",
      onSourceInvalidation: "release an unsettled school-overflow reservation without changing protected student minimum entitlements",
    },
    {
      id: "VIDEO-REL-VERIFICATION-ASSET",
      fromObjectId: "VIDEO-OBJ-VERIFICATION",
      toObjectId: "VIDEO-OBJ-ASSET",
      type: "DERIVED_FROM",
      cardinality: "MANY_TO_ONE",
      ownershipScope: "SAME_STUDENT",
      onSourceInvalidation: "stop incomplete verification and retain completed raw facts with their source-validity limitation",
    },
    {
      id: "VIDEO-REL-LEARNING-FACT-VERIFICATION",
      fromObjectId: "VIDEO-OBJ-LEARNING-FACT",
      toObjectId: "VIDEO-OBJ-VERIFICATION",
      type: "DERIVED_FROM",
      cardinality: "ONE_TO_ONE",
      ownershipScope: "SAME_STUDENT",
      onSourceInvalidation: "invalidate future interpretation without rewriting the original response, contextual result, or source versions",
    },
  ],
  actionFacts: videoActions,
  pages: videoPages,
});

function sourceRef(objectId, fieldId, version) {
  return { objectId, fieldId, version, cardinality: "ONE" };
}

export const phaseTwoFlows = deepFreeze([
  {
    id: "DF-P2-001",
    label: "Minimum Progress Completion Evidence to Student Next Target Choice",
    phase: PHASE.SECOND,
    contractProfile: "GENERIC",
    routingPolicy: "NONE",
    moduleIds: ["PROG-001"],
    steps: [
      {
        order: 1,
        actionId: "PROG-ACT-VIEW-CURRENT-TARGET",
        providedInputs: [{ fieldId: "PROG-TARGET-F-STUDENT-REF", provider: { roleRef: "ROLE-STUDENT" } }],
      },
      {
        order: 2,
        actionId: "PROG-ACT-PROPOSE-NEXT-TARGET",
        condition: "the current target is COMPLETED with accepted current-version completion evidence",
        providedInputs: [
          "PROG-CHOICE-F-STUDENT-REF",
          "PROG-CHOICE-F-CURRENT-TARGET-REF",
          "PROG-CHOICE-F-CURRENT-TARGET-VERSION",
          "PROG-CHOICE-F-COMPLETION-EVIDENCE-REF",
          "PROG-CHOICE-F-COMPLETION-EVIDENCE-VERSION",
          "PROG-CHOICE-F-NEXT-SNAPSHOT-REF",
          "PROG-CHOICE-F-NEXT-SNAPSHOT-VERSION",
        ].map((fieldId) => ({ fieldId, provider: { actorRef: "SYSTEM" } })),
      },
      {
        order: 3,
        actionId: "PROG-ACT-SELECT-NEXT-TARGET",
        condition: "the student explicitly chooses to continue",
        providedInputs: [{ fieldId: "PROG-CHOICE-F-STUDENT-CHOICE", provider: { roleRef: "ROLE-STUDENT" } }],
      },
      {
        order: 4,
        actionId: "PROG-ACT-DEFER-NEXT-TARGET",
        condition: "the student explicitly chooses not now",
        providedInputs: [{ fieldId: "PROG-CHOICE-F-STUDENT-CHOICE", provider: { roleRef: "ROLE-STUDENT" } }],
      },
    ],
    sourceDataRefs: [
      sourceRef("PROG-OBJ-STUDENT-TARGET", "PROG-TARGET-F-ID", "PROG-TARGET-F-VERSION"),
      sourceRef("PROG-OBJ-STUDENT-TARGET", "PROG-TARGET-F-STUDENT-REF", "PROG-TARGET-F-VERSION"),
      sourceRef("PROG-OBJ-STUDENT-TARGET", "PROG-TARGET-F-COMPLETION-EVIDENCE-REF", "PROG-TARGET-F-VERSION"),
    ],
    targetDataRefs: [
      { objectId: "PROG-OBJ-NEXT-TARGET-CHOICE", fieldId: "PROG-CHOICE-F-ID", version: "PROG-CHOICE-F-VERSION" },
      { objectId: "PROG-OBJ-NEXT-TARGET-CHOICE", fieldId: "PROG-CHOICE-F-STATUS", version: "PROG-CHOICE-F-VERSION" },
      { objectId: "PROG-OBJ-NEXT-TARGET-CHOICE", fieldId: "PROG-CHOICE-F-VERSION", version: "PROG-CHOICE-F-VERSION" },
    ],
    idempotencyKeyParts: {
      identityFieldIds: ["PROG-TARGET-F-ID"],
      versionFieldIds: ["PROG-TARGET-F-VERSION"],
      fanoutFieldId: "PROG-TARGET-F-STUDENT-REF",
    },
    failureGranularity: "STUDENT_CURRENT_TARGET_AND_PROPOSAL_VERSION",
    retryPolicy: {
      strategy: "REFRESH_CURRENT_TARGET_EVIDENCE_AND_RETRY_PROPOSAL_ONLY",
      maxAttempts: 3,
      retryableFailureResults: ["SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
    },
    compensation: {
      strategy: "PRESERVE_CURRENT_TARGET_AND_STUDENT_CHOICE",
      description: "failure never changes class progress, publishes an activity, or invents a student choice",
    },
    downstreamInvalidation: {
      strategy: "EXPIRE_ONLY_UNSELECTED_STALE_PROPOSALS",
      targets: ["student next-target proposal", "progress-driven video request eligibility"],
    },
  },
  {
    id: "DF-P2-002",
    label: "Accepted Video Request through Full Gates to Usable Delivery and Settlement",
    phase: PHASE.SECOND,
    contractProfile: "GENERIC",
    routingPolicy: "NONE",
    moduleIds: ["VIDEO-001"],
    steps: [
      {
        order: 1,
        actionId: "VIDEO-ACT-RESERVE-STUDENT-MINIMUM",
        condition: "student minimum units are available",
        providedInputs: [
          "VIDEO-LEDGER-F-STUDENT-REF",
          "VIDEO-LEDGER-F-REQUEST-REF",
          "VIDEO-LEDGER-F-REQUEST-VERSION",
          "VIDEO-LEDGER-F-ENTITLEMENT-REF",
          "VIDEO-LEDGER-F-SOURCE",
          "VIDEO-LEDGER-F-PRIORITY",
          "VIDEO-LEDGER-F-RESERVED-UNITS",
        ].map((fieldId) => ({ fieldId, provider: { actorRef: "SYSTEM" } })),
      },
      {
        order: 2,
        actionId: "VIDEO-ACT-RESERVE-SCHOOL-OVERFLOW",
        condition: "the protected minimum path cannot serve the accepted request and school overflow is available",
        providedInputs: [
          "VIDEO-LEDGER-F-STUDENT-REF",
          "VIDEO-LEDGER-F-REQUEST-REF",
          "VIDEO-LEDGER-F-REQUEST-VERSION",
          "VIDEO-LEDGER-F-OVERFLOW-REF",
          "VIDEO-LEDGER-F-SOURCE",
          "VIDEO-LEDGER-F-PRIORITY",
          "VIDEO-LEDGER-F-RESERVED-UNITS",
        ].map((fieldId) => ({ fieldId, provider: { actorRef: "SYSTEM" } })),
      },
      {
        order: 3,
        actionId: "VIDEO-ACT-START-GENERATION",
        providedInputs: [
          "VIDEO-ASSET-F-STUDENT-REF",
          "VIDEO-ASSET-F-REQUEST-REF",
          "VIDEO-ASSET-F-REQUEST-VERSION",
          ...videoAssetGovernanceInputFields,
        ].map((fieldId) => ({ fieldId, provider: { actorRef: "SYSTEM" } })),
      },
      { order: 4, actionId: "VIDEO-ACT-CHECK-SCRIPT" },
      { order: 5, actionId: "VIDEO-ACT-CHECK-RENDER" },
      { order: 6, actionId: "VIDEO-ACT-CHECK-SAFETY" },
      { order: 7, actionId: "VIDEO-ACT-CHECK-PRIVACY" },
      { order: 8, actionId: "VIDEO-ACT-CHECK-RIGHTS" },
      { order: 9, actionId: "VIDEO-ACT-CHECK-PEDAGOGY" },
      { order: 10, actionId: "VIDEO-ACT-CHECK-PLAYABILITY" },
      { order: 11, actionId: "VIDEO-ACT-DELIVER-USABLE", condition: "all seven gates are PASSED and every source is still valid" },
      { order: 12, actionId: "VIDEO-ACT-SETTLE-USABLE-DELIVERY", condition: "the student received a usable DELIVERED asset" },
      {
        order: 13,
        actionId: "VIDEO-ACT-VIEW-CONTROLLED",
        condition: "each playback request passes fresh authorization",
        providedInputs: [{
          fieldId: "VIDEO-ASSET-F-STUDENT-REF",
          provider: { roleRef: "ROLE-STUDENT" },
        }],
      },
    ],
    sourceDataRefs: [
      sourceRef("VIDEO-OBJ-REQUEST", "VIDEO-REQUEST-F-ID", "VIDEO-REQUEST-F-VERSION"),
      sourceRef("VIDEO-OBJ-REQUEST", "VIDEO-REQUEST-F-STUDENT-REF", "VIDEO-REQUEST-F-VERSION"),
      sourceRef("VIDEO-OBJ-REQUEST", "VIDEO-REQUEST-F-SOURCE-BINDING-DIGEST", "VIDEO-REQUEST-F-VERSION"),
    ],
    targetDataRefs: [
      { objectId: "VIDEO-OBJ-ASSET", fieldId: "VIDEO-ASSET-F-ID", version: "VIDEO-ASSET-F-VERSION" },
      { objectId: "VIDEO-OBJ-ASSET", fieldId: "VIDEO-ASSET-F-DELIVERY-STATUS", version: "VIDEO-ASSET-F-VERSION" },
      { objectId: "VIDEO-OBJ-ASSET", fieldId: "VIDEO-ASSET-F-VERSION", version: "VIDEO-ASSET-F-VERSION" },
      { objectId: "VIDEO-OBJ-QUOTA-LEDGER", fieldId: "VIDEO-LEDGER-F-ID", version: "VIDEO-LEDGER-F-VERSION" },
      { objectId: "VIDEO-OBJ-QUOTA-LEDGER", fieldId: "VIDEO-LEDGER-F-STATUS", version: "VIDEO-LEDGER-F-VERSION" },
      { objectId: "VIDEO-OBJ-QUOTA-LEDGER", fieldId: "VIDEO-LEDGER-F-VERSION", version: "VIDEO-LEDGER-F-VERSION" },
    ],
    idempotencyKeyParts: {
      identityFieldIds: ["VIDEO-REQUEST-F-ID"],
      versionFieldIds: ["VIDEO-REQUEST-F-VERSION"],
      fanoutFieldId: "VIDEO-REQUEST-F-STUDENT-REF",
    },
    failureGranularity: "VIDEO_REQUEST_ASSET_GATE_AND_QUOTA_LEDGER_VERSION",
    retryPolicy: {
      strategy: "RELEASE_FAILED_RESERVATION_THEN_RETRY_FROM_PINNED_REQUEST",
      maxAttempts: 3,
      retryableFailureResults: ["PLATFORM_FAILURE", "GATE_CHECK_UNAVAILABLE", "VERSION_CONFLICT"],
    },
    compensation: {
      strategy: "NO_DELIVERY_OR_SETTLEMENT_UNTIL_ALL_GATES_PASS",
      description: "a failed generation preserves source facts, releases unsettled quota, and exposes a safe low-bandwidth alternative",
    },
    downstreamInvalidation: {
      strategy: "REAUTHORIZE_AND_STOP_PLAYBACK_WHEN_SOURCE_OR_RIGHTS_CHANGE",
      targets: ["controlled playback authorization", "student notification", "quota settlement eligibility"],
    },
  },
  {
    id: "DF-P2-003",
    label: "Video Gate Block or Recall to Quota Release",
    phase: PHASE.SECOND,
    contractProfile: "GENERIC",
    routingPolicy: "NONE",
    moduleIds: ["VIDEO-001"],
    steps: [
      { order: 1, actionId: "VIDEO-ACT-BLOCK-DELIVERY", condition: "a mandatory gate or platform step failed before usable delivery" },
      {
        order: 2,
        actionId: "VIDEO-ACT-RECALL",
        condition: "a delivered or blocked asset must be recalled",
        providedInputs: [{ fieldId: "VIDEO-ASSET-F-RECALL-REASON", provider: { actorRef: "SYSTEM" } }],
      },
      {
        order: 3,
        actionId: "VIDEO-ACT-RELEASE-QUOTA",
        condition: "platform failure, gate block, content recall, or automatic retry left no usable result",
        providedInputs: [{ fieldId: "VIDEO-LEDGER-F-RELEASE-REASON", provider: { actorRef: "SYSTEM" } }],
      },
      {
        order: 4,
        actionId: "VIDEO-ACT-RELEASE-SCHOOL-GROUP-QUOTA",
        condition: "a school-private platform failure, gate block, content recall, or automatic retry left no usable result",
        providedInputs: [{ fieldId: "VIDEO-SCHOOL-LEDGER-F-RELEASE-REASON", provider: { actorRef: "SYSTEM" } }],
      },
    ],
    sourceDataRefs: [
      sourceRef("VIDEO-OBJ-ASSET", "VIDEO-ASSET-F-ID", "VIDEO-ASSET-F-VERSION"),
      sourceRef("VIDEO-OBJ-ASSET", "VIDEO-ASSET-F-SERVICE-OBJECT-REFS", "VIDEO-ASSET-F-VERSION"),
      sourceRef("VIDEO-OBJ-ASSET", "VIDEO-ASSET-F-DELIVERY-STATUS", "VIDEO-ASSET-F-VERSION"),
    ],
    targetDataRefs: [
      { objectId: "VIDEO-OBJ-ASSET", fieldId: "VIDEO-ASSET-F-DELIVERY-STATUS", version: "VIDEO-ASSET-F-VERSION" },
      { objectId: "VIDEO-OBJ-ASSET", fieldId: "VIDEO-ASSET-F-VERSION", version: "VIDEO-ASSET-F-VERSION" },
      { objectId: "VIDEO-OBJ-QUOTA-LEDGER", fieldId: "VIDEO-LEDGER-F-RELEASE-REASON", version: "VIDEO-LEDGER-F-VERSION" },
      { objectId: "VIDEO-OBJ-QUOTA-LEDGER", fieldId: "VIDEO-LEDGER-F-VERSION", version: "VIDEO-LEDGER-F-VERSION" },
      { objectId: "VIDEO-OBJ-SCHOOL-QUOTA-LEDGER", fieldId: "VIDEO-SCHOOL-LEDGER-F-RELEASE-REASON", version: "VIDEO-SCHOOL-LEDGER-F-VERSION" },
      { objectId: "VIDEO-OBJ-SCHOOL-QUOTA-LEDGER", fieldId: "VIDEO-SCHOOL-LEDGER-F-VERSION", version: "VIDEO-SCHOOL-LEDGER-F-VERSION" },
    ],
    idempotencyKeyParts: {
      identityFieldIds: ["VIDEO-ASSET-F-ID"],
      versionFieldIds: ["VIDEO-ASSET-F-VERSION"],
      fanoutFieldId: "VIDEO-ASSET-F-SERVICE-OBJECT-REFS",
    },
    failureGranularity: "VIDEO_ASSET_AND_RESERVATION_VERSION",
    retryPolicy: {
      strategy: "RETRY_RELEASE_WITHOUT_REPEATING_DEDUCTION",
      maxAttempts: 5,
      retryableFailureResults: ["VERSION_CONFLICT", "AUDIT_FAILED"],
    },
    compensation: {
      strategy: "KEEP_PLAYBACK_BLOCKED_AND_RESERVATION_UNSETTLED_UNTIL_RELEASE_CONFIRMS",
      description: "release failure never reopens playback, settles quota, or creates another charge",
    },
    downstreamInvalidation: {
      strategy: "STOP_PLAYBACK_AND_INVALIDATE_DELIVERY_LINKS",
      targets: ["controlled playback session", "video deep link", "cached media authorization", "delivery notification"],
    },
  },
  {
    id: "DF-P2-004",
    label: "Delivered Video through One-node New-context Verification to a New Learning Fact",
    phase: PHASE.SECOND,
    contractProfile: "GENERIC",
    routingPolicy: "NONE",
    moduleIds: ["VIDEO-001"],
    steps: [
      {
        order: 1,
        actionId: "VIDEO-ACT-START-NEW-CONTEXT-VERIFICATION",
        condition: "the student starts a target-appropriate new context after authorized delivery",
        providedInputs: [
          "VIDEO-VERIFY-F-STUDENT-REF",
          "VIDEO-VERIFY-F-ASSET-REF",
          "VIDEO-VERIFY-F-TARGET-REF",
          "VIDEO-VERIFY-F-TARGET-KIND",
          "VIDEO-VERIFY-F-STRATEGY",
          "VIDEO-VERIFY-F-MODALITY",
          "VIDEO-VERIFY-F-ABILITY-NODE-REFS",
        ].map((fieldId) => ({ fieldId, provider: { roleRef: "ROLE-STUDENT" } })),
      },
      {
        order: 2,
        actionId: "VIDEO-ACT-SUBMIT-FIRST-INDEPENDENT-EXPRESSION",
        condition: "no answer-style hint was exposed before the first expression",
        providedInputs: [{ fieldId: "VIDEO-VERIFY-F-FIRST-EXPRESSION", provider: { roleRef: "ROLE-STUDENT" } }],
      },
      { order: 3, actionId: "VIDEO-ACT-PURSUE-ONE-SPECIFIC-GAP", condition: "one concrete content gap needs a follow-up" },
      {
        order: 4,
        actionId: "VIDEO-ACT-RETURN-UNKNOWN-TO-TEACHING",
        condition: "the student explicitly states that the student does not know",
        providedInputs: [{ fieldId: "VIDEO-VERIFY-F-UNKNOWN-DECLARATION", provider: { roleRef: "ROLE-STUDENT" } }],
      },
      {
        order: 5,
        actionId: "VIDEO-ACT-RETRY-DIFFERENT-CONTEXT",
        condition: "targeted gap teaching completed and a materially different context is ready",
        providedInputs: [{ fieldId: "VIDEO-VERIFY-F-RETRY-REQUEST", provider: { roleRef: "ROLE-STUDENT" } }],
      },
      {
        order: 6,
        actionId: "VIDEO-ACT-SUBMIT-DIFFERENT-CONTEXT-EXPRESSION",
        condition: "the retry path requires another independent expression",
        providedInputs: [{ fieldId: "VIDEO-VERIFY-F-DIFFERENT-CONTEXT-EXPRESSION", provider: { roleRef: "ROLE-STUDENT" } }],
      },
      { order: 7, actionId: "VIDEO-ACT-COMPLETE-NEW-CONTEXT-VERIFICATION" },
      {
        order: 8,
        actionId: "VIDEO-ACT-RECORD-POST-VIDEO-LEARNING-FACT",
        condition: "a completed verification has response evidence and a contextual result",
        providedInputs: [
          "VIDEO-FACT-F-STUDENT-REF",
          "VIDEO-FACT-F-ASSET-REF",
          "VIDEO-FACT-F-ASSET-VERSION",
          "VIDEO-FACT-F-VERIFICATION-REF",
          "VIDEO-FACT-F-VERIFICATION-VERSION",
          "VIDEO-FACT-F-TARGET-REF",
          "VIDEO-FACT-F-TARGET-SOURCE-VERSION",
          "VIDEO-FACT-F-NEW-CONTEXT-DIGEST",
          "VIDEO-FACT-F-STRATEGY",
          "VIDEO-FACT-F-MODALITY",
          "VIDEO-FACT-F-RESULT",
          "VIDEO-FACT-F-EVIDENCE",
        ].map((fieldId) => ({ fieldId, provider: { actorRef: "SYSTEM" } })),
      },
    ],
    sourceDataRefs: [
      sourceRef("VIDEO-OBJ-ASSET", "VIDEO-ASSET-F-ID", "VIDEO-ASSET-F-VERSION"),
      sourceRef("VIDEO-OBJ-ASSET", "VIDEO-ASSET-F-SERVICE-OBJECT-REFS", "VIDEO-ASSET-F-VERSION"),
      sourceRef("VIDEO-OBJ-ASSET", "VIDEO-ASSET-F-DELIVERY-STATUS", "VIDEO-ASSET-F-VERSION"),
    ],
    targetDataRefs: [
      { objectId: "VIDEO-OBJ-VERIFICATION", fieldId: "VIDEO-VERIFY-F-ID", version: "VIDEO-VERIFY-F-VERSION" },
      { objectId: "VIDEO-OBJ-VERIFICATION", fieldId: "VIDEO-VERIFY-F-STATUS", version: "VIDEO-VERIFY-F-VERSION" },
      { objectId: "VIDEO-OBJ-VERIFICATION", fieldId: "VIDEO-VERIFY-F-VERSION", version: "VIDEO-VERIFY-F-VERSION" },
      { objectId: "VIDEO-OBJ-LEARNING-FACT", fieldId: "VIDEO-FACT-F-ID", version: "VIDEO-FACT-F-VERSION" },
      { objectId: "VIDEO-OBJ-LEARNING-FACT", fieldId: "VIDEO-FACT-F-STATUS", version: "VIDEO-FACT-F-VERSION" },
      { objectId: "VIDEO-OBJ-LEARNING-FACT", fieldId: "VIDEO-FACT-F-VERSION", version: "VIDEO-FACT-F-VERSION" },
    ],
    idempotencyKeyParts: {
      identityFieldIds: ["VIDEO-ASSET-F-ID"],
      versionFieldIds: ["VIDEO-ASSET-F-VERSION"],
      fanoutFieldId: "VIDEO-ASSET-F-SERVICE-OBJECT-REFS",
    },
    failureGranularity: "STUDENT_VIDEO_TARGET_CONTEXT_AND_VERIFICATION_VERSION",
    retryPolicy: {
      strategy: "PRESERVE_EACH_EXPRESSION_AND_RETRY_ONLY_IN_A_DIFFERENT_CONTEXT",
      maxAttempts: 3,
      retryableFailureResults: ["SOURCE_VERSION_STALE", "CONTEXT_NOT_DIFFERENT", "VERSION_CONFLICT"],
    },
    compensation: {
      strategy: "NO_LEARNING_FACT_WITHOUT_COMPLETED_NEW_CONTEXT_EVIDENCE",
      description: "viewing, watch completion, an unknown response, or speech presentation quality never creates mastery; an unknown response returns to teaching before a different-context retry",
    },
    downstreamInvalidation: {
      strategy: "PRESERVE_RAW_RESPONSE_AND_INVALIDATE_ONLY_FUTURE_INTERPRETATION",
      targets: ["future mastery interpretation", "next-target eligibility", "personalized recommendation"],
    },
  },
  {
    id: "DF-P2-005",
    label: "Teacher School-private Group Request through Full Gates to Scoped Delivery",
    phase: PHASE.SECOND,
    contractProfile: "GENERIC",
    routingPolicy: "NONE",
    moduleIds: ["VIDEO-001"],
    steps: [
      {
        order: 1,
        actionId: "VIDEO-ACT-RESERVE-SCHOOL-GROUP-OVERFLOW",
        providedInputs: [
          "VIDEO-SCHOOL-LEDGER-F-REQUEST-REF",
          "VIDEO-SCHOOL-LEDGER-F-REQUEST-VERSION",
          "VIDEO-SCHOOL-LEDGER-F-OVERFLOW-REF",
          "VIDEO-SCHOOL-LEDGER-F-SERVICE-OBJECT-REFS",
          "VIDEO-SCHOOL-LEDGER-F-PRIORITY",
          "VIDEO-SCHOOL-LEDGER-F-RESERVED-UNITS",
        ].map((fieldId) => ({ fieldId, provider: { actorRef: "SYSTEM" } })),
      },
      {
        order: 2,
        actionId: "VIDEO-ACT-START-SCHOOL-GROUP-GENERATION",
        providedInputs: [
          "VIDEO-ASSET-F-SCHOOL-REQUEST-REF",
          "VIDEO-ASSET-F-SCHOOL-REQUEST-VERSION",
          ...videoAssetGovernanceInputFields,
        ].map((fieldId) => ({ fieldId, provider: { actorRef: "SYSTEM" } })),
      },
      { order: 3, actionId: "VIDEO-ACT-CHECK-SCRIPT" },
      { order: 4, actionId: "VIDEO-ACT-CHECK-RENDER" },
      { order: 5, actionId: "VIDEO-ACT-CHECK-SAFETY" },
      { order: 6, actionId: "VIDEO-ACT-CHECK-PRIVACY" },
      { order: 7, actionId: "VIDEO-ACT-CHECK-RIGHTS" },
      { order: 8, actionId: "VIDEO-ACT-CHECK-PEDAGOGY" },
      { order: 9, actionId: "VIDEO-ACT-CHECK-PLAYABILITY" },
      { order: 10, actionId: "VIDEO-ACT-DELIVER-USABLE" },
      { order: 11, actionId: "VIDEO-ACT-SETTLE-SCHOOL-GROUP-DELIVERY" },
      { order: 12, actionId: "VIDEO-ACT-VIEW-SCHOOL-PRIVATE" },
    ],
    sourceDataRefs: [
      sourceRef("VIDEO-OBJ-SCHOOL-REQUEST", "VIDEO-SCHOOL-REQUEST-F-ID", "VIDEO-SCHOOL-REQUEST-F-VERSION"),
      sourceRef("VIDEO-OBJ-SCHOOL-REQUEST", "VIDEO-SCHOOL-REQUEST-F-SERVICE-OBJECT-REFS", "VIDEO-SCHOOL-REQUEST-F-VERSION"),
      sourceRef("VIDEO-OBJ-SCHOOL-REQUEST", "VIDEO-SCHOOL-REQUEST-F-SOURCE-BINDING-DIGEST", "VIDEO-SCHOOL-REQUEST-F-VERSION"),
    ],
    targetDataRefs: [
      { objectId: "VIDEO-OBJ-ASSET", fieldId: "VIDEO-ASSET-F-ID", version: "VIDEO-ASSET-F-VERSION" },
      { objectId: "VIDEO-OBJ-ASSET", fieldId: "VIDEO-ASSET-F-DELIVERY-STATUS", version: "VIDEO-ASSET-F-VERSION" },
      { objectId: "VIDEO-OBJ-ASSET", fieldId: "VIDEO-ASSET-F-VERSION", version: "VIDEO-ASSET-F-VERSION" },
      { objectId: "VIDEO-OBJ-SCHOOL-QUOTA-LEDGER", fieldId: "VIDEO-SCHOOL-LEDGER-F-ID", version: "VIDEO-SCHOOL-LEDGER-F-VERSION" },
      { objectId: "VIDEO-OBJ-SCHOOL-QUOTA-LEDGER", fieldId: "VIDEO-SCHOOL-LEDGER-F-STATUS", version: "VIDEO-SCHOOL-LEDGER-F-VERSION" },
      { objectId: "VIDEO-OBJ-SCHOOL-QUOTA-LEDGER", fieldId: "VIDEO-SCHOOL-LEDGER-F-VERSION", version: "VIDEO-SCHOOL-LEDGER-F-VERSION" },
    ],
    idempotencyKeyParts: {
      identityFieldIds: ["VIDEO-SCHOOL-REQUEST-F-ID"],
      versionFieldIds: ["VIDEO-SCHOOL-REQUEST-F-VERSION"],
      fanoutFieldId: "VIDEO-SCHOOL-REQUEST-F-SERVICE-OBJECT-REFS",
    },
    failureGranularity: "SCHOOL_REQUEST_SERVICE_SCOPE_ASSET_GATE_AND_LEDGER_VERSION",
    retryPolicy: {
      strategy: "RELEASE_SCHOOL_RESERVATION_AND_RETRY_FROM_PINNED_PRIVATE_REQUEST",
      maxAttempts: 3,
      retryableFailureResults: ["PLATFORM_FAILURE", "GATE_CHECK_UNAVAILABLE", "VERSION_CONFLICT"],
    },
    compensation: {
      strategy: "NO_DELIVERY_SETTLEMENT_PROMOTION_OR_CROSS_SCHOOL_MIGRATION_ON_FAILURE",
      description: "the school keeps management metadata, students keep protected minimum quota, and no partial or unauthorized group content is exposed",
    },
    downstreamInvalidation: {
      strategy: "REAUTHORIZE_SERVICE_SCOPE_AND_RECALL_WHEN_SCHOOL_SOURCE_OR_RIGHTS_CHANGE",
      targets: ["school-private playback", "class or group delivery", "school quota settlement", "knowledge-layer sharing eligibility"],
    },
  },
]);

export const phaseTwoEvents = deepFreeze([
  {
    id: "EVT-P2-PROGRESS-SOURCE-SNAPSHOT-READY",
    label: "Current school course and curriculum target source snapshot ready",
    definition: "The current authorized school context, course source, and published curriculum target versions can be pinned.",
    triggeredActionIds: ["PROG-ACT-SYNC-COURSE-TARGET-SNAPSHOT"],
  },
  {
    id: "EVT-P2-PROGRESS-TARGET-STATUS-CHANGED",
    label: "Minimum current target status source changed",
    definition: "Versioned activity or completion evidence changes the student's minimum current target status.",
    triggeredActionIds: ["PROG-ACT-SYNC-STUDENT-TARGET"],
  },
  {
    id: "EVT-P2-VIDEO-ENTITLEMENT-PERIOD-OPENED",
    label: "Phase-two video entitlement period opened",
    definition: "A school enters a phase-two entitlement period for its active students and shared overflow pool.",
    triggeredActionIds: [
      "VIDEO-ACT-ENSURE-STUDENT-MINIMUM-ENTITLEMENT",
      "VIDEO-ACT-ENSURE-SCHOOL-OVERFLOW-POOL",
    ],
  },
]);

export const phaseTwoModules = deepFreeze([progressModule, videoModule]);
