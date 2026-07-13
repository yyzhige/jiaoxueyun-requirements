import { buildModelIndex } from "./model-validator.mjs";

const FORBIDDEN_ACTION_NAMES = new Set([
  "对象查询与范围筛选",
  "详情查看与版本追踪",
  "创建/修改/确认主动作",
  "AI 对话与草稿/执行",
  "审计、通知与下游失效",
]);

const FORBIDDEN_PAGE_NAMES = new Set([
  "列表/工作台",
  "详情/处理页",
  "预览/确认页",
  "历史/审计页",
]);

function list(value) {
  return Array.isArray(value) ? value : [];
}

function isPresent(value) {
  return value !== undefined
    && value !== null
    && !(typeof value === "string" && value.trim() === "");
}

function setEquals(left, right) {
  if (left.size !== right.size) return false;
  return [...left].every((value) => right.has(value));
}

function actorIsValid(index, reference) {
  return index.actorIds.has(reference);
}

function confirmerReference(task) {
  return task?.confirmerRef
    ?? task?.confirmerRoleRef
    ?? task?.confirmerDutyRef;
}

function entityNames(entity) {
  return [entity?.name, entity?.label, entity?.title]
    .filter((value) => typeof value === "string")
    .map((value) => value.trim());
}

function stateIds(object) {
  return new Set(list(object?.states).map((state) => {
    if (typeof state === "string") return state;
    return state?.id ?? state?.code;
  }));
}

function ownerErrors(index) {
  const errors = [];
  for (const objectEntry of index.objects) {
    for (const property of ["ownerRef", "confirmerRef"]) {
      const reference = objectEntry.value?.[property];
      if (!actorIsValid(index, reference)) {
        errors.push(
          `ORPHAN_OWNER_ROLE ${objectEntry.value?.id}.${property} -> ${String(reference)}`,
        );
      }
    }
  }
  for (const metricEntry of index.metrics) {
    const reference = metricEntry.value?.ownerRef;
    if (!actorIsValid(index, reference)) {
      errors.push(
        `ORPHAN_OWNER_ROLE ${metricEntry.value?.id}.ownerRef -> ${String(reference)}`,
      );
    }
  }
  return errors;
}

function actionErrors(index) {
  const errors = [];
  for (const actionEntry of index.actions) {
    const action = actionEntry.value;
    const permissionEffects = new Set(
      list(action?.permissions).map((permission) => permission?.effect),
    );
    if (!permissionEffects.has("ALLOW") || !permissionEffects.has("DENY")) {
      errors.push(`MISSING_ACTION_PERMISSION ${action?.id} requires ALLOW and DENY`);
    }

    const targetObject = index.objectById.get(action?.targetObjectId)?.value;
    if (targetObject && action?.transition) {
      const states = stateIds(targetObject);
      const { from, to } = action.transition;
      if (!states.has(from) || !states.has(to)) {
        errors.push(
          `INVALID_STATE_TRANSITION ${action?.id} ${String(from)} -> ${String(to)}`,
        );
      }
    }

    const declaredScenarioIds = new Set(list(action?.scenarioIds));
    const actionScenarios = index.scenarios.filter(
      ({ value }) => value?.actionId === action?.id,
    );
    const actualScenarioIds = new Set(
      actionScenarios.map(({ value }) => value?.id),
    );
    const scenarioKinds = new Set(
      actionScenarios
        .filter(({ value }) => declaredScenarioIds.has(value?.id))
        .map(({ value }) => value?.kind),
    );
    const hasCoverage = scenarioKinds.has("SUCCESS")
      && (scenarioKinds.has("FAILURE") || scenarioKinds.has("BOUNDARY"));
    if (!setEquals(declaredScenarioIds, actualScenarioIds) || !hasCoverage) {
      errors.push(
        `MISSING_ACTION_SCENARIO ${action?.id} requires matching SUCCESS and FAILURE/BOUNDARY scenarios`,
      );
    }

    for (const name of entityNames(action)) {
      if (FORBIDDEN_ACTION_NAMES.has(name)) {
        errors.push(`FORBIDDEN_GENERIC_TEMPLATE action ${action?.id} -> ${name}`);
      }
    }
  }
  return errors;
}

function flowErrors(index) {
  const errors = [];
  for (const flowEntry of index.flows) {
    const flow = flowEntry.value;
    const declaredModuleIds = new Set(list(flow?.moduleIds));
    const actionModuleIds = new Set();
    for (const step of list(flow?.steps)) {
      const actionEntry = index.actionById.get(step?.actionId);
      if (actionEntry) actionModuleIds.add(actionEntry.moduleId);
    }
    if (!setEquals(declaredModuleIds, actionModuleIds)) {
      errors.push(
        `FLOW_PARTICIPANT_MISMATCH ${flow?.id} declared=${[...declaredModuleIds].sort().join(",")} actual=${[...actionModuleIds].sort().join(",")}`,
      );
    }
  }
  return errors;
}

function aiTaskErrors(index) {
  const errors = [];
  for (const taskEntry of index.aiTasks) {
    const task = taskEntry.value;
    if (!task?.writes) continue;
    const confirmer = confirmerReference(task);
    const registeredConfirmer = index.roleIds.has(confirmer)
      || index.dutyIds.has(confirmer);
    if (list(task?.previewFieldIds).length === 0 || !registeredConfirmer) {
      errors.push(
        `AI_WRITE_WITHOUT_CONFIRMATION ${task?.id} requires preview fields and a role/duty confirmer`,
      );
    }
  }
  return errors;
}

function phaseAndTemplateErrors(index) {
  const errors = [];
  for (const moduleEntry of index.modules) {
    const module = moduleEntry.value;
    if (
      module?.phase === 2
      && (list(module?.pages).length > 0 || list(module?.actions).length > 0)
    ) {
      errors.push(
        `PHASE_BOUNDARY_EXECUTABLE_PAGE ${module?.id} exposes pages or actions in phase two`,
      );
    }
  }
  for (const pageEntry of index.pages) {
    for (const name of entityNames(pageEntry.value)) {
      if (FORBIDDEN_PAGE_NAMES.has(name)) {
        errors.push(
          `FORBIDDEN_GENERIC_TEMPLATE page ${pageEntry.value?.id} -> ${name}`,
        );
      }
    }
  }
  return errors;
}

function metricErrors(index) {
  const errors = [];
  for (const metricEntry of index.metrics) {
    const metric = metricEntry.value;
    const complete = list(metric?.eventIds).length > 0
      && Boolean(metric?.scope)
      && Boolean(metric?.aggregation)
      && Boolean(metric?.ownerRef)
      && isPresent(metric?.target);
    if (!complete) {
      errors.push(
        `MISSING_METRIC_EVENT ${metric?.id} requires events, scope, aggregation, Owner, and target`,
      );
    }
  }
  return errors;
}

export function validateModelSemantics(model) {
  const index = buildModelIndex(model);
  return [
    ...flowErrors(index),
    ...actionErrors(index),
    ...ownerErrors(index),
    ...aiTaskErrors(index),
    ...phaseAndTemplateErrors(index),
    ...metricErrors(index),
  ];
}
