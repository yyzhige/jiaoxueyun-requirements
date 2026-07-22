import {
  SCHOOL_TERM_OPTION_SET_ID,
  SCHOOL_TERM_REFERENCE_ROLE,
  schoolTermReferenceFieldRegistry,
} from "../facts/school-term-reference.mjs";
import { buildModelIndex } from "./model-validator.mjs";

const likelySchoolTermReferenceId = /(?:^|-)(?:TERM|ACADEMIC-PERIOD)(?:-ID)?$/;

function registryKey(objectId, fieldId) {
  return `${objectId}\u0000${fieldId}`;
}

function bindsAuthoritativeSchoolTermOptionSet(field) {
  const source = field?.valueSource;
  return source?.kind === "OPTION_SET"
    && source.optionSetId === SCHOOL_TERM_OPTION_SET_ID
    && Object.keys(source).length === 2;
}

export function validateSchoolTermReferences(model) {
  if (model?.profile !== "ZHIXU_V2") return [];

  const index = buildModelIndex(model);
  const errors = [];
  const registeredKeys = new Set(schoolTermReferenceFieldRegistry.map((entry) => (
    registryKey(entry.objectId, entry.fieldId)
  )));
  const entriesByKey = new Map();

  for (const fieldEntry of index.fields) {
    const key = registryKey(fieldEntry.objectId, fieldEntry.value?.id);
    const entries = entriesByKey.get(key) ?? [];
    entries.push(fieldEntry);
    entriesByKey.set(key, entries);
  }

  for (const { objectId, fieldId } of schoolTermReferenceFieldRegistry) {
    const entries = entriesByKey.get(registryKey(objectId, fieldId)) ?? [];
    if (entries.length === 0) {
      errors.push(
        `MISSING_SCHOOL_TERM_REFERENCE_FIELD ${objectId}.${fieldId} is required by the authoritative school-term field registry`,
      );
    } else if (entries.length > 1) {
      errors.push(
        `DUPLICATE_SCHOOL_TERM_REFERENCE_FIELD ${objectId}.${fieldId} must resolve to exactly one field`,
      );
    }
  }

  const checkedOptionSetPaths = new Set();
  for (const fieldEntry of index.fields) {
    const field = fieldEntry.value;
    const key = registryKey(fieldEntry.objectId, field?.id);
    const registered = registeredKeys.has(key);
    const likelyOmission = typeof field?.id === "string"
      && likelySchoolTermReferenceId.test(field.id);
    const declaresRole = field?.semanticRole === SCHOOL_TERM_REFERENCE_ROLE;

    if ((registered || likelyOmission) && !declaresRole) {
      errors.push(
        `INVALID_SCHOOL_TERM_SEMANTIC_ROLE ${field?.id} must declare semanticRole ${SCHOOL_TERM_REFERENCE_ROLE}`,
      );
    }

    if ((registered || likelyOmission || declaresRole) && !checkedOptionSetPaths.has(fieldEntry.path)) {
      checkedOptionSetPaths.add(fieldEntry.path);
      if (!bindsAuthoritativeSchoolTermOptionSet(field)) {
        errors.push(
          `INVALID_SCHOOL_TERM_OPTION_SET ${field?.id} must bind the authoritative ${SCHOOL_TERM_OPTION_SET_ID} school-term Option Set`,
        );
      }
    }
  }

  return errors;
}
