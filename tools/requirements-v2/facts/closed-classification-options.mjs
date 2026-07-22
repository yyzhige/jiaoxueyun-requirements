import { deepFreeze } from "../model.mjs";

function optionSet(id, key, label, values) {
  return {
    id,
    key,
    label,
    mode: "STATIC",
    values: values.map(([code, valueLabel]) => ({ code, label: valueLabel })),
  };
}

export const closedClassificationOptionSets = deepFreeze([
  optionSet("OPT-V2-CLS-001", "schoolType", "学校类型", [
    ["PRIMARY", "小学"],
    ["MIDDLE", "初中"],
    ["NINE_YEAR", "九年一贯制学校"],
  ]),
  optionSet("OPT-V2-CLS-002", "aiDataUsePurpose", "AI 数据使用目的", [
    ["ASSESSMENT", "AI 评定与完成判定"],
    ["TEACHING_SUPPORT", "提示、讲解与针对性教学"],
    ["PERSONALIZATION", "个性化学习与进度建议"],
    ["CONTENT_GENERATION", "题目、变式与教学内容生成"],
  ]),
  optionSet("OPT-V2-CLS-003", "oldSchoolHistoryAccessPurpose", "旧校可识别历史访问目的", [
    ["ORIGINAL_TEACHING", "原教学延续"],
    ["DISPUTE_HANDLING", "争议处理"],
    ["LEGAL_OBLIGATION", "法定义务"],
  ]),
  optionSet("OPT-V2-CLS-004", "sensitiveAccessPurpose", "高敏感访问目的", [
    ["AUTHORIZED_SUPPORT", "经授权的平台支持"],
    ["SCHOOL_LOCKOUT_RECOVERY", "学校锁定恢复"],
    ["SECURITY_INCIDENT_RESPONSE", "安全事件响应"],
    ["CHILD_SAFETY_RESPONSE", "儿童安全响应"],
    ["LEGAL_EMERGENCY_RESPONSE", "法定紧急响应"],
  ]),
  optionSet("OPT-V2-CLS-005", "teachingAttentionKind", "教学关注事件类型", [
    ["SUBMISSION_GAP", "持续未提交或迟交"],
    ["RECURRING_DIFFICULTY", "有连续证据的学习困难"],
    ["ASSESSMENT_OR_EVIDENCE_REVIEW", "评定或证据需要复核"],
    ["PROGRESS_OR_WORKLOAD_CONFLICT", "进度或学习负荷冲突"],
    ["COORDINATION_REQUIRED", "需要教师、班主任或监护协调"],
  ]),
]);

export const closedClassificationFieldBindings = deepFreeze([
  {
    objectId: "ACC-OBJ-SCHOOL",
    fieldId: "ACC-SCHOOL-F-TYPE",
    optionSetId: "OPT-V2-CLS-001",
  },
  {
    objectId: "DGV-OBJ-AI-RULE",
    fieldId: "DGV-AI-F-PURPOSE",
    optionSetId: "OPT-V2-CLS-002",
  },
  {
    objectId: "DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY",
    fieldId: "DGV-OLDHIST-F-PURPOSE",
    optionSetId: "OPT-V2-CLS-003",
  },
  {
    objectId: "AUD-OBJ-ACCESS-REQUEST",
    fieldId: "AUD-REQUEST-F-PURPOSE",
    optionSetId: "OPT-V2-CLS-004",
  },
  {
    objectId: "SCO-OBJ-FOLLOW-UP",
    fieldId: "SCO-FOLLOW-UP-F-ATTENTION-KIND",
    optionSetId: "OPT-V2-CLS-005",
  },
  {
    objectId: "STU-OBJ-ATTENTION",
    fieldId: "STU-ATTENTION-F-KIND",
    optionSetId: "OPT-V2-CLS-005",
  },
]);

const bindingByObjectId = new Map();
for (const binding of closedClassificationFieldBindings) {
  const objectBindings = bindingByObjectId.get(binding.objectId) ?? new Map();
  objectBindings.set(binding.fieldId, binding);
  bindingByObjectId.set(binding.objectId, objectBindings);
}

function isOpenTextValueSource(valueSource) {
  return valueSource === undefined || (
    valueSource?.kind === "USER_INPUT"
    && Object.keys(valueSource).length === 1
  );
}

export function applyClosedClassificationOptionSets(optionSets) {
  const existingIds = new Set(optionSets.map(({ id }) => id));
  return [
    ...optionSets,
    ...closedClassificationOptionSets.filter(({ id }) => !existingIds.has(id)),
  ];
}

export function applyClosedClassificationFieldValueSources(modules) {
  return modules.map((module) => ({
    ...module,
    objects: module.objects.map((object) => {
      const objectBindings = bindingByObjectId.get(object.id);
      if (!objectBindings) return object;
      return {
        ...object,
        fields: object.fields.map((field) => {
          const binding = objectBindings.get(field.id);
          if (!binding || !isOpenTextValueSource(field.valueSource)) return field;
          return {
            ...field,
            valueSource: {
              kind: "OPTION_SET",
              optionSetId: binding.optionSetId,
            },
          };
        }),
      };
    }),
  }));
}

export function decorateClosedClassificationFacts(model) {
  return {
    ...model,
    optionSets: applyClosedClassificationOptionSets(model.optionSets),
    modules: applyClosedClassificationFieldValueSources(model.modules),
  };
}
