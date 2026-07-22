import {
  closedClassificationFieldBindings,
  closedClassificationOptionSets,
} from "../facts/closed-classification-options.mjs";
import { buildModelIndex } from "./model-validator.mjs";

function registryKey(objectId, fieldId) {
  return `${objectId}\u0000${fieldId}`;
}

function hasExactKeys(value, expectedKeys) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const actualKeys = Object.keys(value);
  return actualKeys.length === expectedKeys.length
    && actualKeys.every((key) => expectedKeys.includes(key));
}

function sameOptionValues(actualValues, expectedValues) {
  return Array.isArray(actualValues)
    && actualValues.length === expectedValues.length
    && actualValues.every((value, index) => (
      hasExactKeys(value, ["code", "label"])
      && value.code === expectedValues[index].code
      && value.label === expectedValues[index].label
    ));
}

export function validateClosedClassificationOptions(model) {
  if (model?.profile !== "ZHIXU_V2") return [];

  const index = buildModelIndex(model);
  const errors = [];
  const expectedOptionSetById = new Map(closedClassificationOptionSets.map((optionSet) => (
    [optionSet.id, optionSet]
  )));
  const expectedBindingByKey = new Map(closedClassificationFieldBindings.map((binding) => (
    [registryKey(binding.objectId, binding.fieldId), binding]
  )));

  for (const expected of closedClassificationOptionSets) {
    const entries = index.optionSets.filter(({ value }) => value?.id === expected.id);
    if (entries.length === 0) {
      errors.push(
        `MISSING_CLOSED_CLASSIFICATION_OPTION_SET ${expected.id} is required`,
      );
      continue;
    }
    if (entries.length > 1) {
      errors.push(
        `DUPLICATE_CLOSED_CLASSIFICATION_OPTION_SET ${expected.id} must be unique`,
      );
    }

    const actual = entries[0].value;
    const codes = Array.isArray(actual?.values)
      ? actual.values.map(({ code }) => code)
      : [];
    if (new Set(codes).size !== codes.length) {
      errors.push(
        `DUPLICATE_CLOSED_CLASSIFICATION_CODE ${expected.id} contains a duplicate option code`,
      );
    }
    if (
      !hasExactKeys(actual, ["id", "key", "label", "mode", "values"])
      || actual.key !== expected.key
      || actual.label !== expected.label
      || actual.mode !== "STATIC"
      || !sameOptionValues(actual.values, expected.values)
    ) {
      errors.push(
        `INVALID_CLOSED_CLASSIFICATION_OPTIONS ${expected.id} must match its authoritative ordered code-label set`,
      );
    }
  }

  for (const expected of closedClassificationFieldBindings) {
    const entries = index.fields.filter(({ objectId, value }) => (
      objectId === expected.objectId && value?.id === expected.fieldId
    ));
    if (entries.length === 0) {
      errors.push(
        `MISSING_CLOSED_CLASSIFICATION_FIELD ${expected.objectId}.${expected.fieldId} is required`,
      );
      continue;
    }
    if (entries.length > 1) {
      errors.push(
        `DUPLICATE_CLOSED_CLASSIFICATION_FIELD ${expected.objectId}.${expected.fieldId} must be unique`,
      );
    }

    const source = entries[0].value?.valueSource;
    if (source?.kind === "USER_INPUT") {
      errors.push(
        `FREE_TEXT_CLOSED_CLASSIFICATION ${expected.fieldId} cannot fall back to free-text input`,
      );
    } else if (
      !hasExactKeys(source, ["kind", "optionSetId"])
      || source.kind !== "OPTION_SET"
      || source.optionSetId !== expected.optionSetId
    ) {
      errors.push(
        `INVALID_CLOSED_CLASSIFICATION_BINDING ${expected.fieldId} must bind ${expected.optionSetId}`,
      );
    }
  }

  for (const fieldEntry of index.fields) {
    const source = fieldEntry.value?.valueSource;
    if (
      source?.kind !== "OPTION_SET"
      || !expectedOptionSetById.has(source.optionSetId)
    ) continue;
    const expected = expectedBindingByKey.get(registryKey(
      fieldEntry.objectId,
      fieldEntry.value?.id,
    ));
    if (!expected || expected.optionSetId !== source.optionSetId) {
      errors.push(
        `MISAPPLIED_CLOSED_CLASSIFICATION_OPTION_SET ${fieldEntry.value?.id} cannot bind ${source.optionSetId}`,
      );
    }
  }

  return errors;
}
