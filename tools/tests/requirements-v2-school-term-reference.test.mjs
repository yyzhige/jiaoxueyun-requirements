import test from "node:test";
import assert from "node:assert/strict";

import { requirementModel } from "../requirements-v2/facts/index.mjs";
import {
  SCHOOL_TERM_OPTION_SET_ID,
  SCHOOL_TERM_REFERENCE_ROLE,
  applySchoolTermReferenceRoles,
} from "../requirements-v2/facts/school-term-reference.mjs";
import {
  validateSchoolTermReferences,
} from "../requirements-v2/validate/school-term-reference-validator.mjs";

const currentSchoolTermFields = [
  ["ACC-OBJ-CONTEXT", "ACC-CONTEXT-F-TERM-ID"],
  ["ORG-OBJ-GRADE", "ORG-GRADE-F-TERM-ID"],
  ["ORG-OBJ-COURSE", "ORG-COURSE-F-TERM-ID"],
  ["LPATH-OBJ-TIMELINE-ENTRY", "LPATH-ENTRY-F-TERM-ID"],
  ["EXM-OBJ-EXAM-EVENT", "EXM-EVENT-F-TERM"],
  ["SCH-OBJ-CALENDAR", "SCH-CALENDAR-F-TERM"],
  ["ACC-OBJ-CLASS-COURSE-READINESS", "ACC-READINESS-F-TERM-ID"],
];

function allObjects(model) {
  return model.modules.flatMap((module) => module.objects);
}

function objectById(model, objectId) {
  return allObjects(model).find(({ id }) => id === objectId);
}

function fieldById(model, objectId, fieldId) {
  return objectById(model, objectId)?.fields.find(({ id }) => id === fieldId);
}

function hasError(errors, code, fieldId) {
  return errors.some((error) => error.startsWith(`${code} `) && error.includes(fieldId));
}

function sortFieldReferences(references) {
  return references.toSorted(([leftObjectId, leftFieldId], [rightObjectId, rightFieldId]) => (
    `${leftObjectId}.${leftFieldId}`.localeCompare(`${rightObjectId}.${rightFieldId}`)
  ));
}

test("assembles the seven authoritative school-term fields with explicit semantics", () => {
  const declared = allObjects(requirementModel).flatMap((object) => (
    object.fields
      .filter(({ semanticRole }) => semanticRole === SCHOOL_TERM_REFERENCE_ROLE)
      .map(({ id }) => [object.id, id])
  ));

  assert.deepEqual(
    sortFieldReferences(declared),
    sortFieldReferences(currentSchoolTermFields),
  );
  for (const [objectId, fieldId] of currentSchoolTermFields) {
    assert.deepEqual(fieldById(requirementModel, objectId, fieldId)?.valueSource, {
      kind: "OPTION_SET",
      optionSetId: SCHOOL_TERM_OPTION_SET_ID,
    });
  }
  assert.deepEqual(validateSchoolTermReferences(requirementModel), []);
});

test("the assembly helper adds only missing registered roles and is idempotent", () => {
  const modules = structuredClone(requirementModel.modules);
  for (const [objectId, fieldId] of currentSchoolTermFields) {
    delete fieldById({ modules }, objectId, fieldId).semanticRole;
  }

  const once = applySchoolTermReferenceRoles(modules);
  const twice = applySchoolTermReferenceRoles(once);
  assert.deepEqual(twice, once);
  for (const [objectId, fieldId] of currentSchoolTermFields) {
    assert.equal(
      fieldById({ modules: once }, objectId, fieldId).semanticRole,
      SCHOOL_TERM_REFERENCE_ROLE,
    );
  }
});

test("rejects a missing semantic role on every current school-term field", () => {
  for (const [objectId, fieldId] of currentSchoolTermFields) {
    const model = structuredClone(requirementModel);
    delete fieldById(model, objectId, fieldId).semanticRole;
    assert.equal(
      hasError(
        validateSchoolTermReferences(model),
        "INVALID_SCHOOL_TERM_SEMANTIC_ROLE",
        fieldId,
      ),
      true,
      fieldId,
    );
  }
});

test("rejects an explicit school-term role rebound to another Option Set", () => {
  for (const [objectId, fieldId] of currentSchoolTermFields) {
    const model = structuredClone(requirementModel);
    fieldById(model, objectId, fieldId).valueSource = {
      kind: "OPTION_SET",
      optionSetId: "OPT-COM-003",
    };
    assert.equal(
      hasError(
        validateSchoolTermReferences(model),
        "INVALID_SCHOOL_TERM_OPTION_SET",
        fieldId,
      ),
      true,
      fieldId,
    );
  }
});

test("accepts a new academic-period field only with the school-term semantic role", () => {
  const correct = structuredClone(requirementModel);
  const sourceField = structuredClone(fieldById(
    correct,
    "ACC-OBJ-CONTEXT",
    "ACC-CONTEXT-F-TERM-ID",
  ));
  sourceField.id = "SYN-F-ACADEMIC-PERIOD-ID";
  sourceField.label = "Academic Period ID";
  objectById(correct, "ACC-OBJ-CONTEXT").fields.push(sourceField);
  assert.deepEqual(validateSchoolTermReferences(correct), []);

  const wrong = structuredClone(correct);
  fieldById(
    wrong,
    "ACC-OBJ-CONTEXT",
    "SYN-F-ACADEMIC-PERIOD-ID",
  ).semanticRole = "ACADEMIC_PERIOD_REFERENCE";
  assert.equal(
    hasError(
      validateSchoolTermReferences(wrong),
      "INVALID_SCHOOL_TERM_SEMANTIC_ROLE",
      "SYN-F-ACADEMIC-PERIOD-ID",
    ),
    true,
  );
});

test("rejects the school-term semantic role on a non-term Option Set field", () => {
  const model = structuredClone(requirementModel);
  const loginRole = fieldById(model, "ACC-OBJ-IDENTITY", "ACC-IDENTITY-F-ROLE");
  loginRole.semanticRole = SCHOOL_TERM_REFERENCE_ROLE;

  assert.equal(
    hasError(
      validateSchoolTermReferences(model),
      "INVALID_SCHOOL_TERM_OPTION_SET",
      "ACC-IDENTITY-F-ROLE",
    ),
    true,
  );
});
