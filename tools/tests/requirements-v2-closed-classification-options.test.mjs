import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import {
  decorateClosedClassificationFacts,
} from "../requirements-v2/facts/closed-classification-options.mjs";
import { prepareRequirementModel } from "../requirements-v2/validate/structure-validator.mjs";
import {
  validateClosedClassificationOptions,
} from "../requirements-v2/validate/closed-classification-options-validator.mjs";

const expectedOptions = {
  "OPT-V2-CLS-001": [
    ["PRIMARY", "小学"],
    ["MIDDLE", "初中"],
    ["NINE_YEAR", "九年一贯制学校"],
  ],
  "OPT-V2-CLS-002": [
    ["ASSESSMENT", "AI 评定与完成判定"],
    ["TEACHING_SUPPORT", "提示、讲解与针对性教学"],
    ["PERSONALIZATION", "个性化学习与进度建议"],
    ["CONTENT_GENERATION", "题目、变式与教学内容生成"],
  ],
  "OPT-V2-CLS-003": [
    ["ORIGINAL_TEACHING", "原教学延续"],
    ["DISPUTE_HANDLING", "争议处理"],
    ["LEGAL_OBLIGATION", "法定义务"],
  ],
  "OPT-V2-CLS-004": [
    ["AUTHORIZED_SUPPORT", "经授权的平台支持"],
    ["SCHOOL_LOCKOUT_RECOVERY", "学校锁定恢复"],
    ["SECURITY_INCIDENT_RESPONSE", "安全事件响应"],
    ["CHILD_SAFETY_RESPONSE", "儿童安全响应"],
    ["LEGAL_EMERGENCY_RESPONSE", "法定紧急响应"],
  ],
  "OPT-V2-CLS-005": [
    ["SUBMISSION_GAP", "持续未提交或迟交"],
    ["RECURRING_DIFFICULTY", "有连续证据的学习困难"],
    ["ASSESSMENT_OR_EVIDENCE_REVIEW", "评定或证据需要复核"],
    ["PROGRESS_OR_WORKLOAD_CONFLICT", "进度或学习负荷冲突"],
    ["COORDINATION_REQUIRED", "需要教师、班主任或监护协调"],
  ],
};

const expectedBindings = [
  ["ACC-OBJ-SCHOOL", "ACC-SCHOOL-F-TYPE", "OPT-V2-CLS-001"],
  ["DGV-OBJ-AI-RULE", "DGV-AI-F-PURPOSE", "OPT-V2-CLS-002"],
  ["DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY", "DGV-OLDHIST-F-PURPOSE", "OPT-V2-CLS-003"],
  ["AUD-OBJ-ACCESS-REQUEST", "AUD-REQUEST-F-PURPOSE", "OPT-V2-CLS-004"],
  ["SCO-OBJ-FOLLOW-UP", "SCO-FOLLOW-UP-F-ATTENTION-KIND", "OPT-V2-CLS-005"],
  ["STU-OBJ-ATTENTION", "STU-ATTENTION-F-KIND", "OPT-V2-CLS-005"],
];

function decoratedModel() {
  return structuredClone(decorateClosedClassificationFacts(
    structuredClone(requirementModel),
  ));
}

function optionSetById(model, optionSetId) {
  return model.optionSets.find(({ id }) => id === optionSetId);
}

function objectById(model, objectId) {
  return model.modules
    .flatMap((module) => module.objects)
    .find(({ id }) => id === objectId);
}

function fieldById(model, objectId, fieldId) {
  return objectById(model, objectId)?.fields.find(({ id }) => id === fieldId);
}

function hasError(errors, code, reference) {
  return errors.some((error) => (
    error.startsWith(`${code} `) && error.includes(reference)
  ));
}

test("decorates the six classification fields with the authoritative closed Option Sets", () => {
  const model = decoratedModel();

  for (const [optionSetId, expectedValues] of Object.entries(expectedOptions)) {
    const optionSet = optionSetById(model, optionSetId);
    assert.ok(optionSet, optionSetId);
    assert.deepEqual(
      optionSet.values.map(({ code, label }) => [code, label]),
      expectedValues,
      optionSetId,
    );
  }
  for (const [objectId, fieldId, optionSetId] of expectedBindings) {
    assert.deepEqual(fieldById(model, objectId, fieldId)?.valueSource, {
      kind: "OPTION_SET",
      optionSetId,
    });
  }
  assert.deepEqual(validateClosedClassificationOptions(model), []);

  const prepared = prepareRequirementModel(model);
  assert.deepEqual(prepared.errors, []);
});

test("the decorator is idempotent and does not mask an explicit wrong Option Set", () => {
  const once = decoratedModel();
  assert.deepEqual(decorateClosedClassificationFacts(once), once);

  const wrong = structuredClone(requirementModel);
  fieldById(wrong, "ACC-OBJ-SCHOOL", "ACC-SCHOOL-F-TYPE").valueSource = {
    kind: "OPTION_SET",
    optionSetId: "OPT-COM-003",
  };
  const decoratedWrong = decorateClosedClassificationFacts(wrong);
  assert.equal(
    fieldById(decoratedWrong, "ACC-OBJ-SCHOOL", "ACC-SCHOOL-F-TYPE")
      .valueSource.optionSetId,
    "OPT-COM-003",
  );
  assert.equal(
    hasError(
      validateClosedClassificationOptions(decoratedWrong),
      "INVALID_CLOSED_CLASSIFICATION_BINDING",
      "ACC-SCHOOL-F-TYPE",
    ),
    true,
  );
});

test("rejects deleted Option Sets, fields, and field bindings", () => {
  const missingOptionSet = decoratedModel();
  missingOptionSet.optionSets = missingOptionSet.optionSets.filter(({ id }) => (
    id !== "OPT-V2-CLS-003"
  ));
  assert.equal(
    hasError(
      validateClosedClassificationOptions(missingOptionSet),
      "MISSING_CLOSED_CLASSIFICATION_OPTION_SET",
      "OPT-V2-CLS-003",
    ),
    true,
  );

  const missingField = decoratedModel();
  const school = objectById(missingField, "ACC-OBJ-SCHOOL");
  school.fields = school.fields.filter(({ id }) => id !== "ACC-SCHOOL-F-TYPE");
  assert.equal(
    hasError(
      validateClosedClassificationOptions(missingField),
      "MISSING_CLOSED_CLASSIFICATION_FIELD",
      "ACC-SCHOOL-F-TYPE",
    ),
    true,
  );

  const missingBinding = decoratedModel();
  delete fieldById(
    missingBinding,
    "AUD-OBJ-ACCESS-REQUEST",
    "AUD-REQUEST-F-PURPOSE",
  ).valueSource;
  assert.equal(
    hasError(
      validateClosedClassificationOptions(missingBinding),
      "INVALID_CLOSED_CLASSIFICATION_BINDING",
      "AUD-REQUEST-F-PURPOSE",
    ),
    true,
  );
});

test("rejects a field rebound to the wrong Option Set", () => {
  const model = decoratedModel();
  fieldById(
    model,
    "DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY",
    "DGV-OLDHIST-F-PURPOSE",
  ).valueSource.optionSetId = "OPT-V2-CLS-004";

  const errors = validateClosedClassificationOptions(model);
  assert.equal(hasError(
    errors,
    "INVALID_CLOSED_CLASSIFICATION_BINDING",
    "DGV-OLDHIST-F-PURPOSE",
  ), true);
  assert.equal(hasError(
    errors,
    "MISAPPLIED_CLOSED_CLASSIFICATION_OPTION_SET",
    "DGV-OLDHIST-F-PURPOSE",
  ), true);
});

test("rejects missing, additional, and duplicate option codes", () => {
  const missing = decoratedModel();
  optionSetById(missing, "OPT-V2-CLS-002").values.pop();
  assert.equal(
    hasError(
      validateClosedClassificationOptions(missing),
      "INVALID_CLOSED_CLASSIFICATION_OPTIONS",
      "OPT-V2-CLS-002",
    ),
    true,
  );

  const additional = decoratedModel();
  optionSetById(additional, "OPT-V2-CLS-001").values.push({
    code: "UNREGISTERED",
    label: "未登记类型",
  });
  assert.equal(
    hasError(
      validateClosedClassificationOptions(additional),
      "INVALID_CLOSED_CLASSIFICATION_OPTIONS",
      "OPT-V2-CLS-001",
    ),
    true,
  );

  const duplicate = decoratedModel();
  optionSetById(duplicate, "OPT-V2-CLS-005").values.push({
    code: "SUBMISSION_GAP",
    label: "重复代码",
  });
  const duplicateErrors = validateClosedClassificationOptions(duplicate);
  assert.equal(hasError(
    duplicateErrors,
    "DUPLICATE_CLOSED_CLASSIFICATION_CODE",
    "OPT-V2-CLS-005",
  ), true);
  assert.equal(hasError(
    duplicateErrors,
    "INVALID_CLOSED_CLASSIFICATION_OPTIONS",
    "OPT-V2-CLS-005",
  ), true);
});

test("rejects free-text fallback on every closed classification field", () => {
  for (const [objectId, fieldId] of expectedBindings) {
    const model = decoratedModel();
    fieldById(model, objectId, fieldId).valueSource = { kind: "USER_INPUT" };
    assert.equal(
      hasError(
        validateClosedClassificationOptions(model),
        "FREE_TEXT_CLOSED_CLASSIFICATION",
        fieldId,
      ),
      true,
      fieldId,
    );
  }
});
