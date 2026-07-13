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

function list(value) {
  return Array.isArray(value) ? value : [];
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
    baselineDecisions,
    duties,
    dutyIds,
    extensions,
    events,
    eventById: mapById(events),
    fields,
    fieldById: mapById(fields),
    flows,
    lifecyclePolicies,
    metrics,
    modules,
    moduleById: mapById(modules),
    objects,
    objectById: mapById(objects),
    optionSets,
    optionSetById: mapById(optionSets),
    pages,
    nfrs,
    roles,
    roleIds,
    scenarios,
    scenarioById: mapById(scenarios),
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

function checkActorReference(errors, index, reference, path) {
  if (!index.actorIds.has(reference)) {
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
    "confirmerRef",
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
    checkActorReference(errors, index, reference, `${path}.${property}`);
  }
}

export function validateModelReferences(model) {
  const index = buildModelIndex(model);
  const errors = duplicateIdErrors(index);

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
  }

  for (const objectEntry of index.objects) {
    for (const property of ["ownerRef", "confirmerRef"]) {
      checkActorReference(
        errors,
        index,
        objectEntry.value?.[property],
        `${objectEntry.path}.${property}`,
      );
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
    list(action?.permissions).forEach((permission, permissionIndex) => {
      checkActorReferences(
        errors,
        index,
        permission,
        `${actionEntry.path}.permissions[${permissionIndex}]`,
      );
    });
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
