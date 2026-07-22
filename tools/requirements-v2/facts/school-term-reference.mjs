export const SCHOOL_TERM_REFERENCE_ROLE = "SCHOOL_TERM_REFERENCE";
export const SCHOOL_TERM_OPTION_SET_ID = "OPT-COM-004";

export const schoolTermReferenceFieldRegistry = Object.freeze([
  Object.freeze({
    objectId: "ACC-OBJ-CONTEXT",
    fieldId: "ACC-CONTEXT-F-TERM-ID",
  }),
  Object.freeze({
    objectId: "ORG-OBJ-GRADE",
    fieldId: "ORG-GRADE-F-TERM-ID",
  }),
  Object.freeze({
    objectId: "ORG-OBJ-COURSE",
    fieldId: "ORG-COURSE-F-TERM-ID",
  }),
  Object.freeze({
    objectId: "LPATH-OBJ-TIMELINE-ENTRY",
    fieldId: "LPATH-ENTRY-F-TERM-ID",
  }),
  Object.freeze({
    objectId: "EXM-OBJ-EXAM-EVENT",
    fieldId: "EXM-EVENT-F-TERM",
  }),
  Object.freeze({
    objectId: "SCH-OBJ-CALENDAR",
    fieldId: "SCH-CALENDAR-F-TERM",
  }),
  Object.freeze({
    objectId: "ACC-OBJ-CLASS-COURSE-READINESS",
    fieldId: "ACC-READINESS-F-TERM-ID",
  }),
]);

const registeredFieldIdsByObjectId = new Map();
for (const { objectId, fieldId } of schoolTermReferenceFieldRegistry) {
  const fieldIds = registeredFieldIdsByObjectId.get(objectId) ?? new Set();
  fieldIds.add(fieldId);
  registeredFieldIdsByObjectId.set(objectId, fieldIds);
}

export function applySchoolTermReferenceRoles(modules) {
  return modules.map((module) => ({
    ...module,
    objects: module.objects.map((object) => {
      const registeredFieldIds = registeredFieldIdsByObjectId.get(object.id);
      if (!registeredFieldIds) return object;
      return {
        ...object,
        fields: object.fields.map((field) => (
          registeredFieldIds.has(field.id) && !Object.hasOwn(field, "semanticRole")
            ? { ...field, semanticRole: SCHOOL_TERM_REFERENCE_ROLE }
            : field
        )),
      };
    }),
  }));
}
