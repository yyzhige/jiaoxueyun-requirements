export const SYSTEM_ACTOR_CATEGORIES = new Set([
  "SYSTEM",
  "AI",
  "CURRENT_ACTOR",
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

function mapById(entries) {
  const result = new Map();
  for (const entry of entries) {
    if (typeof entry.value?.id === "string" && !result.has(entry.value.id)) {
      result.set(entry.value.id, entry);
    }
  }
  return result;
}

export function buildModelIndex(model) {
  const roles = list(model?.roles).map((value, index) => ({
    value,
    path: `roles[${index}]`,
  }));
  const duties = list(model?.duties).map((value, index) => ({
    value,
    path: `duties[${index}]`,
  }));
  const optionSets = list(model?.optionSets).map((value, index) => ({
    value,
    path: `optionSets[${index}]`,
  }));
  const metrics = list(model?.metrics).map((value, index) => ({
    value,
    path: `metrics[${index}]`,
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

  const roleIds = new Set(roles.map(({ value }) => value?.id));
  const dutyIds = new Set(duties.map(({ value }) => value?.id));

  return {
    actions,
    actionById: mapById(actions),
    actorIds: new Set([...roleIds, ...dutyIds, ...SYSTEM_ACTOR_CATEGORIES]),
    aiTasks,
    duties,
    dutyIds,
    extensions,
    fields,
    fieldById: mapById(fields),
    flows,
    metrics,
    modules,
    moduleById: mapById(modules),
    objects,
    objectById: mapById(objects),
    optionSets,
    optionSetById: mapById(optionSets),
    pages,
    roles,
    roleIds,
    scenarios,
    scenarioById: mapById(scenarios),
  };
}

function duplicateIdErrors(index) {
  const entries = [];
  addEntities(entries, index.roles.map(({ value }) => value), "role", "roles");
  addEntities(entries, index.duties.map(({ value }) => value), "duty", "duties");
  addEntities(
    entries,
    index.optionSets.map(({ value }) => value),
    "Option Set",
    "optionSets",
  );
  addEntities(entries, index.metrics.map(({ value }) => value), "metric", "metrics");
  addEntities(entries, index.modules.map(({ value }) => value), "module", "modules");
  addEntities(entries, index.objects.map(({ value }) => value), "object", "objects");
  addEntities(entries, index.fields.map(({ value }) => value), "field", "fields");
  addEntities(entries, index.actions.map(({ value }) => value), "action", "actions");
  addEntities(entries, index.pages.map(({ value }) => value), "page", "pages");
  addEntities(entries, index.scenarios.map(({ value }) => value), "scenario", "scenarios");
  addEntities(entries, index.flows.map(({ value }) => value), "Flow", "flows");
  addEntities(entries, index.aiTasks.map(({ value }) => value), "AI task", "aiTasks");
  addEntities(
    entries,
    index.extensions.map(({ value }) => value),
    "extension",
    "extensions",
  );

  const firstById = new Map();
  const errors = [];
  for (const entry of entries) {
    if (typeof entry.id !== "string") continue;
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
    errors.push(`MISSING_ACTOR_REFERENCE ${path} -> ${String(reference)}`);
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

export function validateModelReferences(model) {
  const index = buildModelIndex(model);
  const errors = duplicateIdErrors(index);

  for (const fieldEntry of index.fields) {
    const valueSource = fieldEntry.value?.valueSource;
    if (
      valueSource?.kind === "OPTION_SET"
      && !index.optionSetById.has(valueSource.optionSetId)
    ) {
      errors.push(
        `MISSING_OPTION_SET ${fieldEntry.value?.id} -> ${String(valueSource.optionSetId)}`,
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
    if (!index.objectById.has(action?.targetObjectId)) {
      errors.push(
        `MISSING_ACTION_OBJECT ${action?.id} -> ${String(action?.targetObjectId)}`,
      );
    }
    for (const property of ["inputFieldIds", "outputFieldIds"]) {
      list(action?.[property]).forEach((fieldId) => {
        if (!index.fieldById.has(fieldId)) {
          errors.push(`MISSING_ACTION_FIELD ${action?.id} -> ${String(fieldId)}`);
        }
      });
    }
    list(action?.permissions).forEach((permission, permissionIndex) => {
      for (const { reference, property } of actorReferences(permission)) {
        checkActorReference(
          errors,
          index,
          reference,
          `${actionEntry.path}.permissions[${permissionIndex}].${property}`,
        );
      }
    });
  }

  for (const pageEntry of index.pages) {
    const page = pageEntry.value;
    for (const objectId of [page?.objectId, ...list(page?.objectIds)]) {
      if (!index.objectById.has(objectId)) {
        errors.push(`MISSING_PAGE_OBJECT ${page?.id} -> ${String(objectId)}`);
      }
    }
    for (const fieldId of list(page?.fieldIds)) {
      if (!index.fieldById.has(fieldId)) {
        errors.push(`MISSING_PAGE_FIELD ${page?.id} -> ${String(fieldId)}`);
      }
    }
    for (const actionId of list(page?.actionIds)) {
      if (!index.actionById.has(actionId)) {
        errors.push(`MISSING_PAGE_ACTION ${page?.id} -> ${String(actionId)}`);
      }
    }
  }

  for (const scenarioEntry of index.scenarios) {
    if (!index.actionById.has(scenarioEntry.value?.actionId)) {
      errors.push(
        `MISSING_SCENARIO_ACTION ${scenarioEntry.value?.id} -> ${String(scenarioEntry.value?.actionId)}`,
      );
    }
  }

  for (const flowEntry of index.flows) {
    const flow = flowEntry.value;
    for (const moduleId of list(flow?.moduleIds)) {
      if (!index.moduleById.has(moduleId)) {
        errors.push(`MISSING_FLOW_MODULE ${flow?.id} -> ${String(moduleId)}`);
      }
    }
    list(flow?.steps).forEach((step, stepIndex) => {
      if (!index.actionById.has(step?.actionId)) {
        errors.push(
          `MISSING_FLOW_ACTION ${flow?.id}.steps[${stepIndex}] -> ${String(step?.actionId)}`,
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
  }

  for (const taskEntry of index.aiTasks) {
    const task = taskEntry.value;
    if (!index.actionById.has(task?.actionId)) {
      errors.push(`MISSING_AI_ACTION ${task?.id} -> ${String(task?.actionId)}`);
    }
    for (const fieldId of list(task?.previewFieldIds)) {
      if (!index.fieldById.has(fieldId)) {
        errors.push(`MISSING_AI_PREVIEW_FIELD ${task?.id} -> ${String(fieldId)}`);
      }
    }
    for (const { reference, property } of actorReferences(task)) {
      checkActorReference(errors, index, reference, `${taskEntry.path}.${property}`);
    }
  }

  return errors;
}
