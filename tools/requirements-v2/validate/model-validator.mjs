import { formatValidationValue } from "./structure-validator.mjs";
import { MODEL_COLLECTIONS } from "../model.mjs";

const SYSTEM_ACTOR_CATEGORIES = new Set([
  "SYSTEM",
  "AI",
  "CURRENT_ACTOR",
]);

const VALUE_SOURCE_KINDS = new Set([
  "OPTION_SET",
  "SYSTEM",
  "USER_INPUT",
  "OBJECT_REF",
  "RUNTIME_QUERY",
  "DERIVED",
  "CONSTANT",
]);
const RUNTIME_QUERY_ID_KINDS = new Map([
  ["QUERY-AUTHORIZED-SCHOOLS", "OBJECT_ID"],
  ["QUERY-SCHOOL-TERMS", "OBJECT_ID"],
  ["QUERY-SCHOOL-GRADES", "OBJECT_ID"],
  ["QUERY-AUTHORIZED-CLASSES", "OBJECT_ID"],
  ["QUERY-AUTHORIZED-SUBJECTS", "OBJECT_ID"],
  ["QUERY-AUTHORIZED-COURSES", "OBJECT_ID"],
  ["QUERY-SCHOOL-TEACHERS", "OBJECT_ID"],
  ["QUERY-AUTHORIZED-STUDENTS", "OBJECT_ID"],
  ["QUERY-KNOWLEDGE-POINTS", "OBJECT_ID"],
  ["QUERY-AUTHORIZED-ASSIGNMENTS", "OBJECT_ID"],
  ["QUERY-AUTHORIZED-EXAMS", "OBJECT_ID"],
  ["QUERY-AUTHORIZABLE-SCOPE-OBJECTS", "OBJECT_ID"],
  ["QUERY-AUTHORIZABLE-ACTIONS", "ACTION_ID"],
]);
const AUTHORIZABLE_ACTION_FILTER_CONTEXT = [
  "schoolId",
  "termId",
  "grantorRoleId",
  "grantorDutyIds",
  "targetDutyId",
  "scopeObjectIds",
];

function list(value) {
  return Array.isArray(value) ? value : [];
}

function sameStringSet(left, right) {
  const leftSet = new Set(list(left));
  const rightSet = new Set(list(right));
  return leftSet.size === rightSet.size
    && [...leftSet].every((value) => rightSet.has(value));
}

function triggersMatch(left, right) {
  if (left?.kind !== right?.kind) return false;
  if (left?.kind === "EVENT") return left.eventId === right.eventId;
  if (left?.kind === "FLOW") return sameStringSet(left.flowIds, right.flowIds);
  return false;
}

function addEntities(entries, values, type, path) {
  list(values).forEach((value, index) => {
    entries.push({
      id: value?.id,
      path: `${path}[${index}]`,
      type,
    });
  });
}

function isValidId(value) {
  return typeof value === "string" && value.trim() !== "";
}

function mapById(entries) {
  const result = new Map();
  for (const entry of entries) {
    if (isValidId(entry.value?.id) && !result.has(entry.value.id)) {
      result.set(entry.value.id, entry);
    }
  }
  return result;
}

export function buildModelIndex(model) {
  const baselineDecisions = list(model?.baselineDecisions).map((value, index) => ({
    value,
    path: `baselineDecisions[${index}]`,
  }));
  const roles = list(model?.roles).map((value, index) => ({
    value,
    path: `roles[${index}]`,
  }));
  const duties = list(model?.duties).map((value, index) => ({
    value,
    path: `duties[${index}]`,
  }));
  const lifecyclePolicies = list(model?.lifecyclePolicies).map((value, index) => ({
    value,
    path: `lifecyclePolicies[${index}]`,
  }));
  const sensitivities = list(model?.sensitivities).map((value, index) => ({
    value,
    path: `sensitivities[${index}]`,
  }));
  const optionSets = list(model?.optionSets).map((value, index) => ({
    value,
    path: `optionSets[${index}]`,
  }));
  const events = list(model?.events).map((value, index) => ({
    value,
    path: `events[${index}]`,
  }));
  const metrics = list(model?.metrics).map((value, index) => ({
    value,
    path: `metrics[${index}]`,
  }));
  const nfrs = list(model?.nfrs).map((value, index) => ({
    value,
    path: `nfrs[${index}]`,
  }));
  const modules = list(model?.modules).map((value, index) => ({
    value,
    path: `modules[${index}]`,
  }));
  const flows = list(model?.flows).map((value, index) => ({
    value,
    path: `flows[${index}]`,
  }));
  const aiTasks = list(model?.aiTasks).map((value, index) => ({
    value,
    path: `aiTasks[${index}]`,
  }));
  const extensions = list(model?.extensions).map((value, index) => ({
    value,
    path: `extensions[${index}]`,
  }));
  const objects = [];
  const fields = [];
  const actions = [];
  const relationships = [];
  const pages = [];
  const scenarios = [];

  for (const moduleEntry of modules) {
    const moduleId = moduleEntry.value?.id;
    list(moduleEntry.value?.objects).forEach((value, index) => {
      const objectEntry = {
        value,
        moduleId,
        path: `${moduleEntry.path}.objects[${index}]`,
      };
      objects.push(objectEntry);
      list(value?.fields).forEach((field, fieldIndex) => {
        fields.push({
          value: field,
          moduleId,
          objectId: value?.id,
          path: `${objectEntry.path}.fields[${fieldIndex}]`,
        });
      });
    });
    list(moduleEntry.value?.actions).forEach((value, index) => {
      actions.push({
        value,
        moduleId,
        path: `${moduleEntry.path}.actions[${index}]`,
      });
    });
    list(moduleEntry.value?.relationships).forEach((value, index) => {
      relationships.push({
        value,
        moduleId,
        path: `${moduleEntry.path}.relationships[${index}]`,
      });
    });
    list(moduleEntry.value?.pages).forEach((value, index) => {
      pages.push({
        value,
        moduleId,
        path: `${moduleEntry.path}.pages[${index}]`,
      });
    });
    list(moduleEntry.value?.scenarios).forEach((value, index) => {
      scenarios.push({
        value,
        moduleId,
        path: `${moduleEntry.path}.scenarios[${index}]`,
      });
    });
  }

  const roleIds = new Set(
    roles.map(({ value }) => value?.id).filter(isValidId),
  );
  const dutyIds = new Set(
    duties
      .filter(({ value }) => roleIds.has(value?.roleId))
      .map(({ value }) => value?.id)
      .filter(isValidId),
  );

  return {
    actions,
    actionById: mapById(actions),
    actorIds: new Set([...roleIds, ...dutyIds, ...SYSTEM_ACTOR_CATEGORIES]),
    aiTasks,
    baselineDecisionById: mapById(baselineDecisions),
    baselineDecisions,
    duties,
    dutyIds,
    extensions,
    events,
    eventById: mapById(events),
    fields,
    fieldById: mapById(fields),
    flows,
    lifecyclePolicyById: mapById(lifecyclePolicies),
    lifecyclePolicies,
    metrics,
    modules,
    moduleById: mapById(modules),
    objects,
    objectById: mapById(objects),
    optionSets,
    optionSetById: mapById(optionSets),
    pages,
    pageById: mapById(pages),
    nfrById: mapById(nfrs),
    nfrs,
    relationships,
    roles,
    roleIds,
    scenarios,
    scenarioById: mapById(scenarios),
    sensitivityById: mapById(sensitivities),
    sensitivities,
  };
}

function duplicateIdErrors(index) {
  const entries = [];
  for (const { key, label } of MODEL_COLLECTIONS) {
    addEntities(entries, index[key].map(({ value }) => value), label, key);
  }
  addEntities(entries, index.objects.map(({ value }) => value), "object", "objects");
  addEntities(entries, index.fields.map(({ value }) => value), "field", "fields");
  addEntities(entries, index.actions.map(({ value }) => value), "action", "actions");
  addEntities(
    entries,
    index.relationships.map(({ value }) => value),
    "relationship",
    "relationships",
  );
  addEntities(entries, index.pages.map(({ value }) => value), "page", "pages");
  addEntities(entries, index.scenarios.map(({ value }) => value), "scenario", "scenarios");

  const firstById = new Map();
  const errors = [];
  for (const entry of entries) {
    if (!isValidId(entry.id)) continue;
    const first = firstById.get(entry.id);
    if (first) {
      errors.push(
        `DUPLICATE_ID ${entry.id} at ${first.type} ${first.path} and ${entry.type} ${entry.path}`,
      );
    } else {
      firstById.set(entry.id, entry);
    }
  }
  return errors;
}

function actorReferenceIsValid(index, reference, property) {
  if (property.startsWith("roleRef") || property.startsWith("roleId")) {
    return index.roleIds.has(reference) || SYSTEM_ACTOR_CATEGORIES.has(reference);
  }
  if (property.startsWith("dutyRef") || property.startsWith("dutyId")) {
    return index.dutyIds.has(reference);
  }
  return index.actorIds.has(reference);
}

function checkActorReference(errors, index, reference, path, property = "actorRef") {
  if (!actorReferenceIsValid(index, reference, property)) {
    errors.push(
      `MISSING_ACTOR_REFERENCE ${path} -> ${formatValidationValue(reference)}`,
    );
  }
}

function actorReferences(value) {
  const references = [];
  for (const property of [
    "actorRef",
    "roleRef",
    "dutyRef",
    "ownerRef",
    "producerRef",
    "confirmerRef",
    "stewardRef",
    "confirmerRoleRef",
    "confirmerDutyRef",
  ]) {
    if (Object.hasOwn(value ?? {}, property)) {
      references.push({ reference: value[property], property });
    }
  }
  for (const property of [
    "actorRefs",
    "roleRefs",
    "dutyRefs",
    "actorIds",
    "roleIds",
    "dutyIds",
  ]) {
    list(value?.[property]).forEach((reference, index) => {
      references.push({ reference, property: `${property}[${index}]` });
    });
  }
  return references;
}

function checkActorReferences(errors, index, value, path) {
  const references = actorReferences(value);
  if (references.length === 0) {
    errors.push(`MISSING_ACTOR_REFERENCE ${path} -> no actor reference`);
    return;
  }

  for (const { reference, property } of references) {
    checkActorReference(errors, index, reference, `${path}.${property}`, property);
  }
}

function checkPermissionSubject(errors, index, permission, path) {
  const subjectProperties = ["actorRef", "roleRef", "dutyRef"]
    .filter((property) => Object.hasOwn(permission ?? {}, property));
  if (subjectProperties.length !== 1) {
    errors.push(`INVALID_PERMISSION_SUBJECT ${path} requires exactly one subject selector`);
    return;
  }
  const property = subjectProperties[0];
  const reference = permission[property];
  const valid = (
    (property === "actorRef" && SYSTEM_ACTOR_CATEGORIES.has(reference))
    || (property === "roleRef" && index.roleIds.has(reference))
    || (property === "dutyRef" && index.dutyIds.has(reference))
  );
  if (!valid) {
    errors.push(
      `INVALID_PERMISSION_SUBJECT ${path}.${property} -> ${formatValidationValue(reference)}`,
    );
  }
}

function permissionAllowsUser(index, permission) {
  return permission?.effect === "ALLOW" && (
    permission.actorRef === "CURRENT_ACTOR"
    || index.roleIds.has(permission.roleRef)
    || index.dutyIds.has(permission.dutyRef)
  );
}

export function validateModelReferences(model) {
  const index = buildModelIndex(model);
  const errors = duplicateIdErrors(index);

  for (const optionSetEntry of index.optionSets) {
    const optionSet = optionSetEntry.value;
    if (optionSet?.mode !== "RUNTIME_QUERY") continue;
    const expectedIdKind = RUNTIME_QUERY_ID_KINDS.get(optionSet?.source?.queryId);
    const expectedValueField = expectedIdKind === "ACTION_ID" ? "actionId" : "objectId";
    if (
      !expectedIdKind
      || optionSet?.source?.idKind !== expectedIdKind
      || optionSet?.source?.valueField !== expectedValueField
    ) {
      errors.push(
        `INVALID_RUNTIME_QUERY_SOURCE ${formatValidationValue(optionSet?.id)} -> ${formatValidationValue(optionSet?.source?.queryId)}`,
      );
    }
  }

  for (const dutyEntry of index.duties) {
    if (!index.roleIds.has(dutyEntry.value?.roleId)) {
      errors.push(
        `MISSING_DUTY_ROLE ${formatValidationValue(dutyEntry.value?.id)} -> ${formatValidationValue(dutyEntry.value?.roleId)}`,
      );
    }
  }

  for (const policyEntry of index.lifecyclePolicies) {
    checkActorReference(
      errors,
      index,
      policyEntry.value?.retentionOwner,
      `${policyEntry.path}.retentionOwner`,
    );
  }

  for (const nfrEntry of index.nfrs) {
    if (Object.hasOwn(nfrEntry.value ?? {}, "ownerRef")) {
      checkActorReference(
        errors,
        index,
        nfrEntry.value?.ownerRef,
        `${nfrEntry.path}.ownerRef`,
      );
    }
  }

  for (const fieldEntry of index.fields) {
    const valueSource = fieldEntry.value?.valueSource;
    if (!VALUE_SOURCE_KINDS.has(valueSource?.kind)) {
      errors.push(
        `INVALID_VALUE_SOURCE ${formatValidationValue(fieldEntry.value?.id)} -> ${formatValidationValue(valueSource?.kind)}`,
      );
    } else if (
      valueSource.kind === "OPTION_SET"
      && !index.optionSetById.has(valueSource.optionSetId)
    ) {
      errors.push(
        `MISSING_OPTION_SET ${formatValidationValue(fieldEntry.value?.id)} -> ${formatValidationValue(valueSource.optionSetId)}`,
      );
    } else if (
      valueSource.kind === "OBJECT_REF"
      && !index.objectById.has(valueSource.targetObjectId)
    ) {
      errors.push(
        `MISSING_VALUE_SOURCE_REFERENCE ${formatValidationValue(fieldEntry.value?.id)} OBJECT_REF requires targetObjectId`,
      );
    } else if (
      valueSource.kind === "RUNTIME_QUERY"
      && !isValidId(valueSource.queryId)
    ) {
      errors.push(
        `MISSING_VALUE_SOURCE_REFERENCE ${formatValidationValue(fieldEntry.value?.id)} RUNTIME_QUERY requires queryId`,
      );
    }
    if (fieldEntry.value?.referenceType === "AUTHORIZABLE_ACTION") {
      const optionSet = valueSource?.kind === "OPTION_SET"
        ? index.optionSetById.get(valueSource.optionSetId)?.value
        : undefined;
      const source = optionSet?.source;
      const filterContext = list(source?.filterContext);
      const validFilterContext = (
        filterContext.length === AUTHORIZABLE_ACTION_FILTER_CONTEXT.length
        && AUTHORIZABLE_ACTION_FILTER_CONTEXT.every((value, position) => (
          filterContext[position] === value
        ))
      );
      if (
        valueSource?.kind !== "OPTION_SET"
        || valueSource.optionSetId !== "OPT-COM-016"
        || optionSet?.mode !== "RUNTIME_QUERY"
        || !Array.isArray(optionSet?.values)
        || optionSet.values.length !== 0
        || source?.queryId !== "QUERY-AUTHORIZABLE-ACTIONS"
        || source?.idKind !== "ACTION_ID"
        || source?.valueField !== "actionId"
        || source?.labelField !== "displayName"
        || source?.labelSnapshot !== true
        || !validFilterContext
      ) {
        errors.push(
          `INVALID_AUTHORIZABLE_ACTION_SOURCE ${formatValidationValue(fieldEntry.value?.id)} requires the global authorizable Action ID query`,
        );
      }
    }
  }

  for (const objectEntry of index.objects) {
    for (const property of ["producerRef", "ownerRef", "confirmerRef", "stewardRef"]) {
      checkActorReference(
        errors,
        index,
        objectEntry.value?.[property],
        `${objectEntry.path}.${property}`,
      );
    }
    if (!index.lifecyclePolicyById.has(objectEntry.value?.lifecyclePolicyId)) {
      errors.push(
        `MISSING_LIFECYCLE_REFERENCE ${formatValidationValue(objectEntry.value?.id)} -> ${formatValidationValue(objectEntry.value?.lifecyclePolicyId)}`,
      );
    }
    if (!index.sensitivityById.has(objectEntry.value?.sensitivityId)) {
      errors.push(
        `MISSING_SENSITIVITY_REFERENCE ${formatValidationValue(objectEntry.value?.id)} -> ${formatValidationValue(objectEntry.value?.sensitivityId)}`,
      );
    }
  }

  for (const moduleEntry of index.modules) {
    for (const baselineDecisionId of list(moduleEntry.value?.baselineDecisionIds)) {
      if (!index.baselineDecisionById.has(baselineDecisionId)) {
        errors.push(
          `MISSING_BASELINE_DECISION_REFERENCE ${formatValidationValue(moduleEntry.value?.id)} -> ${formatValidationValue(baselineDecisionId)}`,
        );
      }
    }
    for (const nfrId of list(moduleEntry.value?.nfrIds)) {
      if (!index.nfrById.has(nfrId)) {
        errors.push(
          `MISSING_NFR_REFERENCE ${formatValidationValue(moduleEntry.value?.id)} -> ${formatValidationValue(nfrId)}`,
        );
      }
    }
  }

  for (const relationshipEntry of index.relationships) {
    for (const property of ["fromObjectId", "toObjectId"]) {
      const objectId = relationshipEntry.value?.[property];
      const objectEntry = index.objectById.get(objectId);
      if (!objectEntry) {
        errors.push(
          `MISSING_RELATIONSHIP_OBJECT ${formatValidationValue(relationshipEntry.value?.id)}.${property} -> ${formatValidationValue(objectId)}`,
        );
      } else if (objectEntry.moduleId !== relationshipEntry.moduleId) {
        errors.push(
          `INVALID_MODULE_OWNERSHIP ${formatValidationValue(relationshipEntry.value?.id)} -> object ${formatValidationValue(objectId)} belongs to ${formatValidationValue(objectEntry.moduleId)}`,
        );
      }
    }
  }

  for (const actionEntry of index.actions) {
    const action = actionEntry.value;
    const targetObjectEntry = index.objectById.get(action?.targetObjectId);
    if (!targetObjectEntry) {
      errors.push(
        `MISSING_ACTION_OBJECT ${formatValidationValue(action?.id)} -> ${formatValidationValue(action?.targetObjectId)}`,
      );
    } else if (targetObjectEntry.moduleId !== actionEntry.moduleId) {
      errors.push(
        `INVALID_MODULE_OWNERSHIP ${formatValidationValue(action?.id)} -> object ${formatValidationValue(action?.targetObjectId)} belongs to ${formatValidationValue(targetObjectEntry.moduleId)}`,
      );
    }
    if (
      action?.auditMode === "ATOMIC_SELF_RECORD"
      && (
        action.executionMode !== "SYSTEM_EVENT"
        || action.writes !== true
        || targetObjectEntry?.value?.semanticType !== "AUDIT_EVENT_SINK"
      )
    ) {
      errors.push(
        `INVALID_AUDIT_MODE ${formatValidationValue(action?.id)} requires a writable SYSTEM_EVENT audit event sink`,
      );
    }
    for (const property of ["inputFieldIds", "outputFieldIds"]) {
      list(action?.[property]).forEach((fieldId) => {
        const fieldEntry = index.fieldById.get(fieldId);
        if (!fieldEntry) {
          errors.push(
            `MISSING_ACTION_FIELD ${formatValidationValue(action?.id)} -> ${formatValidationValue(fieldId)}`,
          );
        } else if (
          targetObjectEntry
          && fieldEntry.objectId !== targetObjectEntry.value.id
        ) {
          errors.push(
            `INVALID_OBJECT_OWNERSHIP ${formatValidationValue(action?.id)} -> field ${formatValidationValue(fieldId)} belongs to ${formatValidationValue(fieldEntry.objectId)}`,
          );
        }
      });
    }
    const permissions = list(action?.permissions);
    permissions.forEach((permission, permissionIndex) => {
      checkPermissionSubject(
        errors,
        index,
        permission,
        `${actionEntry.path}.permissions[${permissionIndex}]`,
      );
      checkActorReferences(
        errors,
        index,
        permission,
        `${actionEntry.path}.permissions[${permissionIndex}]`,
      );
    });
    if (
      action?.executionMode === "USER_TASK"
      && !permissions.some((permission) => permissionAllowsUser(index, permission))
    ) {
      errors.push(
        `INVALID_PERMISSION_SUBJECT ${formatValidationValue(action?.id)} requires user ALLOW for USER_TASK execution`,
      );
    } else if (
      action?.executionMode !== "USER_TASK"
      && !permissions.some((permission) => (
        permission?.effect === "ALLOW" && permission?.actorRef === "SYSTEM"
      ))
    ) {
      errors.push(
        `INVALID_PERMISSION_SUBJECT ${formatValidationValue(action?.id)} requires SYSTEM ALLOW for non-user execution`,
      );
    }
    const exposingPages = index.pages.filter(({ moduleId, value }) => (
      moduleId === actionEntry.moduleId && list(value?.actionIds).includes(action?.id)
    ));
    if (action?.executionMode === "USER_TASK") {
      for (const client of list(action?.clients)) {
        if (!exposingPages.some(({ value }) => list(value?.clients).includes(client))) {
          errors.push(
            `INVALID_CLIENT_EXPOSURE ${formatValidationValue(action?.id)} -> ${formatValidationValue(client)}`,
          );
        }
      }
    } else if (exposingPages.length > 0) {
      errors.push(
        `INVALID_ACTION_EXPOSURE ${formatValidationValue(action?.id)} must not be exposed by a page`,
      );
    }
    if (action?.executionMode === "SYSTEM_EVENT") {
      const eventEntry = index.eventById.get(action?.trigger?.eventId);
      if (
        !eventEntry
        || !list(eventEntry.value?.triggeredActionIds).includes(action?.id)
      ) {
        errors.push(
          `INVALID_ACTION_TRIGGER ${formatValidationValue(action?.id)} -> ${formatValidationValue(action?.trigger?.eventId)}`,
        );
      }
    }
    if (action?.executionMode === "FLOW_INTERNAL") {
      const actualFlowIds = index.flows
        .filter(({ value }) => list(value?.steps).some(({ actionId }) => actionId === action?.id))
        .map(({ value }) => value?.id);
      if (!sameStringSet(action?.trigger?.flowIds, actualFlowIds)) {
        errors.push(
          `INVALID_ACTION_TRIGGER ${formatValidationValue(action?.id)} requires exact containing Flow references`,
        );
      }
    }
  }

  for (const pageEntry of index.pages) {
    const page = pageEntry.value;
    const declaredObjectIds = isValidId(page?.objectId)
      ? [page.objectId]
      : list(page?.objectIds);
    const declaredObjectIdSet = new Set(declaredObjectIds.filter(isValidId));
    if (
      list(page?.fieldIds).length > 0
      && declaredObjectIdSet.size === 0
    ) {
      errors.push(
        `MISSING_PAGE_OBJECT ${formatValidationValue(page?.id)} -> no declared object`,
      );
    }
    for (const objectId of declaredObjectIds) {
      const objectEntry = index.objectById.get(objectId);
      if (!objectEntry) {
        errors.push(
          `MISSING_PAGE_OBJECT ${formatValidationValue(page?.id)} -> ${formatValidationValue(objectId)}`,
        );
      } else if (objectEntry.moduleId !== pageEntry.moduleId) {
        errors.push(
          `INVALID_MODULE_OWNERSHIP ${formatValidationValue(page?.id)} -> object ${formatValidationValue(objectId)} belongs to ${formatValidationValue(objectEntry.moduleId)}`,
        );
      }
    }
    for (const fieldId of list(page?.fieldIds)) {
      const fieldEntry = index.fieldById.get(fieldId);
      if (!fieldEntry) {
        errors.push(
          `MISSING_PAGE_FIELD ${formatValidationValue(page?.id)} -> ${formatValidationValue(fieldId)}`,
        );
      } else if (fieldEntry.moduleId !== pageEntry.moduleId) {
        errors.push(
          `INVALID_MODULE_OWNERSHIP ${formatValidationValue(page?.id)} -> field ${formatValidationValue(fieldId)} belongs to ${formatValidationValue(fieldEntry.moduleId)}`,
        );
      } else if (
        declaredObjectIdSet.size > 0
        && !declaredObjectIdSet.has(fieldEntry.objectId)
      ) {
        errors.push(
          `INVALID_OBJECT_OWNERSHIP ${formatValidationValue(page?.id)} -> field ${formatValidationValue(fieldId)} belongs to ${formatValidationValue(fieldEntry.objectId)}`,
        );
      }
    }
    for (const actionId of list(page?.actionIds)) {
      const actionEntry = index.actionById.get(actionId);
      if (!actionEntry) {
        errors.push(
          `MISSING_PAGE_ACTION ${formatValidationValue(page?.id)} -> ${formatValidationValue(actionId)}`,
        );
      } else if (actionEntry.moduleId !== pageEntry.moduleId) {
        errors.push(
          `INVALID_MODULE_OWNERSHIP ${formatValidationValue(page?.id)} -> action ${formatValidationValue(actionId)} belongs to ${formatValidationValue(actionEntry.moduleId)}`,
        );
      } else if (actionEntry.value?.executionMode !== "USER_TASK") {
        errors.push(
          `INVALID_ACTION_EXPOSURE ${formatValidationValue(page?.id)} -> ${formatValidationValue(actionId)}`,
        );
      } else {
        const pageFieldIds = new Set(list(page?.fieldIds));
        for (const fieldId of list(actionEntry.value?.inputFieldIds)) {
          const field = index.fieldById.get(fieldId)?.value;
          if (field && field.valueSource?.kind !== "SYSTEM" && !pageFieldIds.has(fieldId)) {
            errors.push(
              `MISSING_PAGE_ACTION_INPUT ${formatValidationValue(page?.id)} -> action ${formatValidationValue(actionId)} requires ${formatValidationValue(fieldId)}`,
            );
          }
        }
        for (const client of list(page?.clients)) {
          if (!list(actionEntry.value?.clients).includes(client)) {
            errors.push(
              `INVALID_CLIENT_EXPOSURE ${formatValidationValue(page?.id)} -> action ${formatValidationValue(actionId)} does not support ${formatValidationValue(client)}`,
            );
          }
        }
      }
    }
  }

  for (const scenarioEntry of index.scenarios) {
    const actionEntry = index.actionById.get(scenarioEntry.value?.actionId);
    if (!actionEntry) {
      errors.push(
        `MISSING_SCENARIO_ACTION ${formatValidationValue(scenarioEntry.value?.id)} -> ${formatValidationValue(scenarioEntry.value?.actionId)}`,
      );
    } else if (actionEntry.moduleId !== scenarioEntry.moduleId) {
      errors.push(
        `INVALID_MODULE_OWNERSHIP ${formatValidationValue(scenarioEntry.value?.id)} -> action ${formatValidationValue(scenarioEntry.value?.actionId)} belongs to ${formatValidationValue(actionEntry.moduleId)}`,
      );
    }
    if (actionEntry?.value?.executionMode === "USER_TASK") {
      const pageEntry = index.pageById.get(scenarioEntry.value?.pageId);
      if (
        Object.hasOwn(scenarioEntry.value ?? {}, "trigger")
        || !pageEntry
        || pageEntry.moduleId !== scenarioEntry.moduleId
        || !list(pageEntry.value?.actionIds).includes(scenarioEntry.value?.actionId)
      ) {
        errors.push(
          `INVALID_SCENARIO_PAGE ${formatValidationValue(scenarioEntry.value?.id)} -> ${formatValidationValue(scenarioEntry.value?.pageId)}`,
        );
      }
    } else if (
      Object.hasOwn(scenarioEntry.value ?? {}, "pageId")
      || !triggersMatch(scenarioEntry.value?.trigger, actionEntry?.value?.trigger)
    ) {
      errors.push(
        `INVALID_ACTION_TRIGGER ${formatValidationValue(scenarioEntry.value?.id)} must trace its action trigger`,
      );
    }
  }

  for (const eventEntry of index.events) {
    for (const actionId of list(eventEntry.value?.triggeredActionIds)) {
      const action = index.actionById.get(actionId)?.value;
      if (
        action?.executionMode !== "SYSTEM_EVENT"
        || action?.trigger?.eventId !== eventEntry.value?.id
      ) {
        errors.push(
          `INVALID_ACTION_TRIGGER ${formatValidationValue(eventEntry.value?.id)} -> ${formatValidationValue(actionId)}`,
        );
      }
    }
  }

  for (const flowEntry of index.flows) {
    const flow = flowEntry.value;
    for (const moduleId of list(flow?.moduleIds)) {
      if (!index.moduleById.has(moduleId)) {
        errors.push(
          `MISSING_FLOW_MODULE ${formatValidationValue(flow?.id)} -> ${formatValidationValue(moduleId)}`,
        );
      }
    }
    list(flow?.steps).forEach((step, stepIndex) => {
      if (!index.actionById.has(step?.actionId)) {
        errors.push(
          `MISSING_FLOW_ACTION ${formatValidationValue(flow?.id)}.steps[${stepIndex}] -> ${formatValidationValue(step?.actionId)}`,
        );
      }
    });
    for (const property of ["sourceDataRefs", "targetDataRefs"]) {
      list(flow?.[property]).forEach((dataRef, dataRefIndex) => {
        const objectEntry = index.objectById.get(dataRef?.objectId);
        const fieldEntry = index.fieldById.get(dataRef?.fieldId);
        if (!objectEntry || !fieldEntry) {
          errors.push(
            `MISSING_FLOW_DATA_REFERENCE ${formatValidationValue(flow?.id)}.${property}[${dataRefIndex}] -> ${formatValidationValue(dataRef?.objectId)}.${formatValidationValue(dataRef?.fieldId)}`,
          );
        } else if (fieldEntry.objectId !== objectEntry.value.id) {
          errors.push(
            `INVALID_OBJECT_OWNERSHIP ${formatValidationValue(flow?.id)}.${property}[${dataRefIndex}] -> field ${formatValidationValue(dataRef?.fieldId)} belongs to ${formatValidationValue(fieldEntry.objectId)}`,
          );
        }
      });
    }
  }

  for (const metricEntry of index.metrics) {
    checkActorReference(
      errors,
      index,
      metricEntry.value?.ownerRef,
      `${metricEntry.path}.ownerRef`,
    );
    list(metricEntry.value?.eventIds).forEach((eventId, eventIndex) => {
      if (!index.eventById.has(eventId)) {
        errors.push(
          `MISSING_METRIC_EVENT_REFERENCE ${formatValidationValue(metricEntry.value?.id)}.eventIds[${eventIndex}] -> ${formatValidationValue(eventId)}`,
        );
      }
    });
  }

  for (const taskEntry of index.aiTasks) {
    const task = taskEntry.value;
    const targetActionEntry = index.actionById.get(task?.actionId);
    if (!targetActionEntry) {
      errors.push(
        `MISSING_AI_ACTION ${formatValidationValue(task?.id)} -> ${formatValidationValue(task?.actionId)}`,
      );
    }
    const previewableFieldIds = new Set([
      ...list(targetActionEntry?.value?.inputFieldIds),
      ...list(targetActionEntry?.value?.outputFieldIds),
    ]);
    for (const fieldId of list(task?.previewFieldIds)) {
      if (!index.fieldById.has(fieldId)) {
        errors.push(
          `MISSING_AI_PREVIEW_FIELD ${formatValidationValue(task?.id)} -> ${formatValidationValue(fieldId)}`,
        );
      } else if (
        task?.writes
        && targetActionEntry
        && !previewableFieldIds.has(fieldId)
      ) {
        errors.push(
          `INVALID_AI_PREVIEW_FIELD ${formatValidationValue(task?.id)} -> ${formatValidationValue(fieldId)}`,
        );
      }
    }
    checkActorReferences(errors, index, task, taskEntry.path);
  }

  return errors;
}
