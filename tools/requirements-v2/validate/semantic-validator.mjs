import { buildModelIndex } from "./model-validator.mjs";
import { formatValidationValue } from "./structure-validator.mjs";

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

const MIXED_CREATE_SEMANTICS = /(?:\bupdate\b|\bmaintain\b|\bsave\b|\breorder\b|\bupsert\b|\bmerge\b|(?:^|-)manage(?:-|$)|合并写入|存在则更新)/i;

const METRIC_EVENT_COUNTS = new Map([
  ["duration", 2],
  ["ratio", 2],
  ["conversion", 2],
  ["count", 1],
  ["boolean", 1],
]);

const EXTENSION_EXECUTABLE_KEYS = [
  "pageIds",
  "actionIds",
  "pages",
  "actions",
  "flows",
  "moduleIds",
  "aiTasks",
  "routes",
  "commands",
  "page",
  "action",
  "pageId",
  "actionId",
];

const PERIODIC_REPORT_ACTION_IDS = new Set([
  "RPT-ACT-CREATE-SUBSCRIPTION",
  "RPT-ACT-UPDATE-SUBSCRIPTION",
  "RPT-ACT-PAUSE-SUBSCRIPTION",
  "RPT-ACT-CANCEL-SUBSCRIPTION",
]);

function list(value) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function records(value) {
  return list(value).filter(isRecord);
}

function isPresent(value) {
  return value !== undefined
    && value !== null
    && !(typeof value === "string" && value.trim() === "");
}

function isValidId(value) {
  return typeof value === "string" && value.trim() !== "";
}

function setEquals(left, right) {
  if (left.size !== right.size) return false;
  return [...left].every((value) => right.has(value));
}

function hasExactKeys(value, expectedKeys) {
  return isRecord(value)
    && setEquals(new Set(Object.keys(value)), new Set(expectedKeys));
}

function hasStableIdempotencyRole(index, fieldId, allowedRoles) {
  const field = index.fieldById.get(fieldId)?.value;
  if (!allowedRoles.includes(field?.idempotencyRole)) return false;
  if (field.idempotencyRole === "FANOUT_SET") {
    return ["STRING_ARRAY", "JSON"].includes(field.dataType)
      && field.mutability === "IMMUTABLE"
      && field.valueSource?.kind === "SYSTEM";
  }
  if (field.idempotencyRole === "OBJECT_VERSION") {
    return field.dataType === "INTEGER"
      && ["IMMUTABLE", "SYSTEM_MANAGED"].includes(field.mutability)
      && field.valueSource?.kind === "SYSTEM";
  }
  if (field.dataType !== "ID" || field.mutability !== "IMMUTABLE") return false;
  if (field.idempotencyRole === "OBJECT_ID") {
    return field.valueSource?.kind === "SYSTEM";
  }
  return field.valueSource?.kind === "OBJECT_REF"
    && index.objectById.has(field.valueSource.targetObjectId);
}

function actorIsValid(index, reference) {
  return index.actorIds.has(reference);
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

function objectIdentityFieldId(object) {
  return records(object?.fields).find(({ idempotencyRole }) => (
    idempotencyRole === "OBJECT_ID"
  ))?.id;
}

function fieldIsRequiredForState(field, state, actionId) {
  if (!isValidId(state)) return false;
  if (field?.required === true) return true;
  if (!isRecord(field?.required)) return false;
  if (!list(field.required.whenStates).includes(state)) return false;
  if (!Object.hasOwn(field.required, "whenActionIds")) return true;
  return isValidId(actionId) && list(field.required.whenActionIds).includes(actionId);
}

function concreteActionState(index, action) {
  if (isValidId(action?.transition?.to)) return action.transition.to;
  const successStates = new Set(index.scenarios
    .filter(({ value }) => (
      value?.actionId === action?.id
      && value?.kind === "SUCCESS"
      && value?.then?.expectedState?.mode === "STATE"
      && isValidId(value.then.expectedState.value)
    ))
    .map(({ value }) => value.then.expectedState.value));
  return successStates.size === 1 ? [...successStates][0] : undefined;
}

function inheritedRequiredFieldIds(action, targetObject) {
  if (action?.operationKind !== "UPDATE") return new Set();
  const fromStates = Array.isArray(action?.transition?.from)
    ? action.transition.from
    : [action?.transition?.from].filter(isValidId);
  if (fromStates.length === 0) return new Set();
  return new Set(records(targetObject?.fields)
    .filter((field) => (
      isValidId(field?.id)
      && fromStates.every((state) => fieldIsRequiredForState(field, state))
    ))
    .map(({ id }) => id));
}

function actionStateCoverageFieldIds(action, targetObject, providedFieldIds = []) {
  return new Set([
    ...inheritedRequiredFieldIds(action, targetObject),
    ...list(action?.inputFieldIds),
    ...providedFieldIds,
    ...list(action?.outputFieldIds),
  ]);
}

function missingActionStateFieldIds(index, action, targetObject, providedFieldIds = []) {
  const concreteState = concreteActionState(index, action);
  const coveredFieldIds = actionStateCoverageFieldIds(
    action,
    targetObject,
    providedFieldIds,
  );
  return records(targetObject?.fields)
    .filter((field) => fieldIsRequiredForState(field, concreteState, action?.id))
    .map(({ id }) => id)
    .filter((fieldId) => !coveredFieldIds.has(fieldId));
}

function conditionalRequiredErrors(index) {
  const errors = [];
  for (const fieldEntry of index.fields) {
    const required = fieldEntry.value?.required;
    if (!isRecord(required) || !Object.hasOwn(required, "whenActionIds")) continue;
    for (const actionId of list(required.whenActionIds)) {
      const actionEntry = index.actionById.get(actionId);
      const action = actionEntry?.value;
      const concreteState = concreteActionState(index, action);
      if (
        !actionEntry
        || actionEntry.moduleId !== fieldEntry.moduleId
        || action?.targetObjectId !== fieldEntry.objectId
        || !list(required.whenStates).includes(concreteState)
      ) {
        errors.push(
          `INVALID_FIELD_CONTRACT ${formatValidationValue(fieldEntry.value?.id)} conditional action ${formatValidationValue(actionId)} must target the owning object in the same module and reach a declared required state`,
        );
      }
    }
  }
  for (const actionEntry of index.actions) {
    const action = actionEntry.value;
    const targetObject = index.objectById.get(action?.targetObjectId)?.value;
    const concreteState = concreteActionState(index, action);
    const missingFieldIds = missingActionStateFieldIds(index, action, targetObject);
    if (missingFieldIds.length > 0) {
      errors.push(
        `INVALID_ACTION_REQUIRED_FIELD ${formatValidationValue(action?.id)} state=${formatValidationValue(concreteState)} missing ${missingFieldIds.map(formatValidationValue).join(",")}`,
      );
    }
  }
  return errors;
}

function policyRequiresGuard(policy, operationKind) {
  return policy === "ALWAYS_REQUIRED"
    || (policy === "CREATE_REQUIRED" && operationKind === "CREATE")
    || (policy === "UPDATE_REQUIRED" && operationKind === "UPDATE");
}

function ownerErrors(index) {
  const errors = [];
  for (const objectEntry of index.objects) {
    for (const property of ["producerRef", "ownerRef", "confirmerRef", "stewardRef"]) {
      const reference = objectEntry.value?.[property];
      if (!actorIsValid(index, reference)) {
        errors.push(
          `ORPHAN_OWNER_ROLE ${formatValidationValue(objectEntry.value?.id)}.${property} -> ${formatValidationValue(reference)}`,
        );
      }
    }
  }
  for (const metricEntry of index.metrics) {
    const reference = metricEntry.value?.ownerRef;
    if (!actorIsValid(index, reference)) {
      errors.push(
        `ORPHAN_OWNER_ROLE ${formatValidationValue(metricEntry.value?.id)}.ownerRef -> ${formatValidationValue(reference)}`,
      );
    }
  }
  return errors;
}

function actionErrors(index) {
  const errors = [];
  const acceptedInputPartitions = new Map();
  for (const actionEntry of index.actions) {
    const action = actionEntry.value;
    const permissionEffects = new Set(
      list(action?.permissions).map((permission) => permission?.effect),
    );
    if (!permissionEffects.has("ALLOW") || !permissionEffects.has("DENY")) {
      errors.push(
        `MISSING_ACTION_PERMISSION ${formatValidationValue(action?.id)} requires ALLOW and DENY`,
      );
    }

    const targetObject = index.objectById.get(action?.targetObjectId)?.value;
    if (targetObject && action?.operationKind === "CREATE") {
      const allowPermissions = records(action?.permissions).filter(({ effect }) => (
        effect === "ALLOW"
      ));
      const producerRef = targetObject.producerRef;
      const userProducerMatches = allowPermissions.some((permission) => {
        const subject = permission?.actorRef ?? permission?.roleRef ?? permission?.dutyRef;
        if (producerRef === "CURRENT_ACTOR") {
          return isValidId(permission?.roleRef)
            || isValidId(permission?.dutyRef)
            || permission?.actorRef === "CURRENT_ACTOR";
        }
        return subject === producerRef;
      });
      const systemFlowProduces = action.executionMode !== "USER_TASK"
        && allowPermissions.some(({ actorRef }) => actorRef === "SYSTEM");
      if (!userProducerMatches && !systemFlowProduces) {
        errors.push(
          `INVALID_CREATE_PRODUCER ${formatValidationValue(action?.id)} ALLOW subject must match ${formatValidationValue(producerRef)} or a verified SYSTEM Flow producer`,
        );
      }
    }
    if (targetObject && action?.transition) {
      const states = stateIds(targetObject);
      const { from, to } = action.transition;
      const fromStates = Array.isArray(from) ? from : [from];
      if (
        fromStates.length === 0
        || fromStates.some((state) => !states.has(state))
        || !states.has(to)
      ) {
        errors.push(
          `INVALID_STATE_TRANSITION ${formatValidationValue(action?.id)} ${formatValidationValue(from)} -> ${formatValidationValue(to)}`,
        );
      }
    }

    for (const guard of list(action?.relatedStateGuards)) {
      const refField = index.fieldById.get(guard?.refFieldId);
      const versionField = index.fieldById.get(guard?.versionFieldId);
      const guardTarget = index.objectById.get(guard?.targetObjectId)?.value;
      const coveredFieldIds = new Set([
        ...list(action?.inputFieldIds),
        ...list(action?.outputFieldIds),
      ]);
      const lineageBinding = list(targetObject?.lineageBindings).find((binding) => (
        binding?.refFieldId === guard?.refFieldId
        && binding?.versionFieldId === guard?.versionFieldId
        && binding?.targetObjectId === guard?.targetObjectId
      ));
      const guardPolicy = refField?.value?.stateGuardPolicy;
      const guardValid = refField?.objectId === action?.targetObjectId
        && versionField?.objectId === action?.targetObjectId
        && refField?.value?.valueSource?.kind === "OBJECT_REF"
        && refField.value.valueSource.targetObjectId === guard?.targetObjectId
        && refField.value.referenceIntegrity === "VERSION_PINNED"
        && refField.value.versionBinding?.versionFieldId === guard?.versionFieldId
        && refField.value.versionBinding?.targetVersionFieldId
          === lineageBinding?.targetVersionFieldId
        && coveredFieldIds.has(guard?.refFieldId)
        && coveredFieldIds.has(guard?.versionFieldId)
        && policyRequiresGuard(guardPolicy, action?.operationKind)
        && stateIds(guardTarget).has(guard?.requiredState);
      if (!guardValid) {
        errors.push(
          `INVALID_ACTION_STATE_GUARD ${formatValidationValue(action?.id)} requires a covered version-pinned lineage to ${formatValidationValue(guard?.targetObjectId)}.${formatValidationValue(guard?.requiredState)}`,
        );
      }
    }

    const coveredFieldIds = new Set([
      ...list(action?.inputFieldIds),
      ...list(action?.outputFieldIds),
    ]);
    for (const refField of list(targetObject?.fields).filter((field) => (
      field?.valueSource?.kind === "OBJECT_REF"
      && field?.referenceIntegrity === "VERSION_PINNED"
    ))) {
      const versionFieldId = refField.versionBinding?.versionFieldId;
      const coversRef = coveredFieldIds.has(refField.id);
      const coversVersion = coveredFieldIds.has(versionFieldId);
      const guardRequired = policyRequiresGuard(
        refField.stateGuardPolicy,
        action?.operationKind,
      ) && (coversRef || coversVersion);
      const matchingGuards = list(action?.relatedStateGuards).filter((guard) => (
        guard?.refFieldId === refField.id
        && guard?.versionFieldId === versionFieldId
        && guard?.targetObjectId === refField.valueSource.targetObjectId
      ));
      if (
        (guardRequired && (!coversRef || !coversVersion || matchingGuards.length !== 1))
        || (!guardRequired && matchingGuards.length > 0)
      ) {
        errors.push(
          `INVALID_ACTION_STATE_GUARD ${formatValidationValue(action?.id)} must derive exactly one guard from ${formatValidationValue(refField.id)} policy=${formatValidationValue(refField.stateGuardPolicy)}`,
        );
      }
    }

    for (const acceptedInputValue of list(action?.acceptedInputValues)) {
      const fieldId = acceptedInputValue?.fieldId;
      const optionSetId = acceptedInputValue?.optionSetId;
      const partitionId = acceptedInputValue?.partitionId;
      const codes = list(acceptedInputValue?.codes);
      const fieldEntry = index.fieldById.get(fieldId);
      const optionSet = index.optionSetById.get(optionSetId)?.value;
      const optionValues = list(optionSet?.values);
      const registeredCodes = new Set(
        optionValues.filter(isRecord).map(({ code }) => code).filter(isValidId),
      );
      const bindingValid = list(action?.inputFieldIds).includes(fieldId)
        && fieldEntry?.objectId === action?.targetObjectId
        && fieldEntry?.value?.valueSource?.kind === "OPTION_SET"
        && fieldEntry.value.valueSource.optionSetId === optionSetId
        && optionSet?.mode === "STATIC"
        && registeredCodes.size === optionValues.length
        && codes.length > 0
        && codes.every(isValidId)
        && new Set(codes).size === codes.length
        && codes.every((code) => registeredCodes.has(code));
      if (!bindingValid) {
        errors.push(
          `INVALID_ACTION_INPUT_VALUES ${formatValidationValue(action?.id)} must accept registered STATIC Option Set values for an input owned by its target object`,
        );
      }

      const partitionKey = [action?.targetObjectId, fieldId, partitionId].join("\u0000");
      const partition = acceptedInputPartitions.get(partitionKey) ?? {
        optionSetId,
        registeredCodes,
        acceptedCodes: new Set(),
        valid: true,
      };
      if (partition.optionSetId !== optionSetId) partition.valid = false;
      for (const code of codes) {
        if (partition.acceptedCodes.has(code)) partition.valid = false;
        partition.acceptedCodes.add(code);
      }
      acceptedInputPartitions.set(partitionKey, partition);
    }

    const declaredScenarioIds = new Set(list(action?.scenarioIds));
    const actionScenarios = index.scenarios.filter(
      ({ value }) => value?.actionId === action?.id,
    );
    const successScenarios = actionScenarios.filter(
      ({ value }) => value?.kind === "SUCCESS",
    );
    const operationKind = action?.operationKind;
    const hasTransition = action?.transition !== null
      && typeof action?.transition === "object"
      && !Array.isArray(action.transition);
    const hasStateEffect = actionScenarios.some(
      ({ value }) => value?.then?.expectedState?.mode !== "UNCHANGED",
    );
    const hasCreatedSuccessState = successScenarios.length > 0
      && successScenarios.every(
        ({ value }) => value?.then?.expectedState?.mode === "STATE",
      );
    if (
      (operationKind === "READ" && (action?.writes !== false || hasTransition || hasStateEffect))
      || (
        operationKind === "CREATE"
        && (action?.writes !== true || hasTransition || !hasCreatedSuccessState)
      )
      || (operationKind === "UPDATE" && (action?.writes !== true || !hasTransition))
    ) {
      errors.push(
        `INVALID_ACTION_OPERATION ${formatValidationValue(action?.id)} has an inconsistent ${formatValidationValue(operationKind)} contract`,
      );
    }
    if (
      operationKind === "CREATE"
      && MIXED_CREATE_SEMANTICS.test(`${action?.id ?? ""} ${action?.label ?? ""}`)
    ) {
      errors.push(
        `INVALID_ACTION_OPERATION ${formatValidationValue(action?.id)} mixes CREATE with update semantics`,
      );
    }
    if (
      action?.transition
      && successScenarios.some(({ value }) => (
        value?.then?.expectedState?.mode !== "STATE"
        || value.then.expectedState.value !== action.transition.to
      ))
    ) {
      errors.push(
        `SCENARIO_TRANSITION_MISMATCH ${formatValidationValue(action?.id)} requires SUCCESS state ${formatValidationValue(action.transition.to)}`,
      );
    }
    if (
      action?.writes === true
      && successScenarios.some(({ value }) => value?.then?.expectedState?.mode !== "STATE")
    ) {
      errors.push(
        `MISSING_ACTION_STATE_EFFECT ${formatValidationValue(action?.id)} requires a concrete success state`,
      );
    }
    if (targetObject) {
      const states = stateIds(targetObject);
      for (const { value: scenario } of actionScenarios) {
        const expectedState = scenario?.then?.expectedState;
        if (
          expectedState?.mode === "STATE"
          && !states.has(expectedState.value)
        ) {
          errors.push(
            `INVALID_SCENARIO_STATE ${formatValidationValue(scenario?.id)} -> ${formatValidationValue(expectedState.value)}`,
          );
        }
      }
    }
    const actualScenarioIds = new Set(
      actionScenarios.map(({ value }) => value?.id),
    );
    const declaredFailureResults = list(action?.failureResults);
    const coveredFailureResults = actionScenarios
      .filter(({ value }) => value?.kind !== "SUCCESS")
      .map(({ value }) => value?.resultCode);
    const coveredFailureResultSet = new Set(coveredFailureResults);
    if (
      coveredFailureResults.length !== declaredFailureResults.length
      || coveredFailureResultSet.size !== coveredFailureResults.length
      || !setEquals(new Set(declaredFailureResults), coveredFailureResultSet)
    ) {
      errors.push(
        `INVALID_FAILURE_RESULT_COVERAGE ${formatValidationValue(action?.id)} requires one negative scenario per failure result`,
      );
    }
    const scenarioKinds = new Set(
      actionScenarios
        .filter(({ value }) => declaredScenarioIds.has(value?.id))
        .map(({ value }) => value?.kind),
    );
    const hasCoverage = scenarioKinds.has("SUCCESS")
      && (scenarioKinds.has("FAILURE") || scenarioKinds.has("BOUNDARY"));
    if (!setEquals(declaredScenarioIds, actualScenarioIds) || !hasCoverage) {
      errors.push(
        `MISSING_ACTION_SCENARIO ${formatValidationValue(action?.id)} requires matching SUCCESS and FAILURE/BOUNDARY scenarios`,
      );
    }

    for (const name of entityNames(action)) {
      if (FORBIDDEN_ACTION_NAMES.has(name)) {
        errors.push(
          `FORBIDDEN_GENERIC_TEMPLATE action ${formatValidationValue(action?.id)} -> ${name}`,
        );
      }
    }
  }
  for (const partition of acceptedInputPartitions.values()) {
    if (
      !partition.valid
      || !setEquals(partition.acceptedCodes, partition.registeredCodes)
    ) {
      errors.push(
        "INVALID_ACTION_INPUT_VALUES accepted action input partitions must be disjoint and exhaust their STATIC Option Set",
      );
    }
  }
  return errors;
}

function actionApplicabilityErrors(index) {
  const errors = [];
  for (const fieldEntry of index.fields.filter(({ value }) => (
    value?.referenceIntegrity === "VERSION_PINNED"
  ))) {
    const refField = fieldEntry.value;
    const versionFieldId = refField?.versionBinding?.versionFieldId;
    const requiredActionIds = list(refField?.actionApplicability?.requiredActionIds);
    const requiredActionIdSet = new Set(requiredActionIds);
    const requiredPolicyMatches = requiredActionIds.length > 0
      ? refField?.stateGuardPolicy !== "NONE"
      : refField?.stateGuardPolicy === "NONE";
    let valid = requiredPolicyMatches;

    const matchingActionIds = new Set();
    for (const actionEntry of index.actions) {
      const action = actionEntry.value;
      const matchingGuards = list(action?.relatedStateGuards).filter((guard) => (
        guard?.refFieldId === refField?.id
        && guard?.versionFieldId === versionFieldId
        && guard?.targetObjectId === refField?.valueSource?.targetObjectId
      ));
      if (matchingGuards.length > 0) matchingActionIds.add(action?.id);
    }

    for (const actionId of requiredActionIds) {
      const actionEntry = index.actionById.get(actionId);
      const action = actionEntry?.value;
      const coveredFieldIds = new Set([
        ...list(action?.inputFieldIds),
        ...list(action?.outputFieldIds),
      ]);
      const matchingGuards = list(action?.relatedStateGuards).filter((guard) => (
        guard?.refFieldId === refField?.id
        && guard?.versionFieldId === versionFieldId
        && guard?.targetObjectId === refField?.valueSource?.targetObjectId
      ));
      if (
        !actionEntry
        || actionEntry.moduleId !== fieldEntry.moduleId
        || action?.targetObjectId !== fieldEntry.objectId
        || !policyRequiresGuard(refField?.stateGuardPolicy, action?.operationKind)
        || !coveredFieldIds.has(refField?.id)
        || !coveredFieldIds.has(versionFieldId)
        || matchingGuards.length !== 1
      ) {
        valid = false;
      }
    }

    if (!setEquals(requiredActionIdSet, matchingActionIds)) valid = false;
    if (!valid) {
      errors.push(
        `INVALID_ACTION_STATE_GUARD ${formatValidationValue(refField?.id)} action applicability must exactly match same-module covered actions and derived guards for policy=${formatValidationValue(refField?.stateGuardPolicy)}`,
      );
    }
  }
  return errors;
}

function flowErrors(index) {
  const errors = [];
  for (const flowEntry of index.flows) {
    const flow = flowEntry.value;
    const declaredModuleIds = new Set(list(flow?.moduleIds));
    const participantPhases = new Set(
      [...declaredModuleIds]
        .map((moduleId) => index.moduleById.get(moduleId)?.value?.phase)
        .filter((phase) => phase !== undefined),
    );
    if (participantPhases.size !== 1 || !participantPhases.has(flow?.phase)) {
      errors.push(
        `FLOW_PHASE_MISMATCH ${formatValidationValue(flow?.id)} phase=${formatValidationValue(flow?.phase)} participantPhases=${[...participantPhases].sort().join(",")}`,
      );
    }
    const actionModuleIds = new Set();
    const stepActions = [];
    for (const step of list(flow?.steps)) {
      const actionEntry = index.actionById.get(step?.actionId);
      if (actionEntry) {
        actionModuleIds.add(actionEntry.moduleId);
        stepActions.push(actionEntry.value);
      }
    }
    if (!setEquals(declaredModuleIds, actionModuleIds)) {
      const declared = [...declaredModuleIds]
        .map(formatValidationValue)
        .sort()
        .join(",");
      const actual = [...actionModuleIds]
        .map(formatValidationValue)
        .sort()
        .join(",");
      errors.push(
        `FLOW_PARTICIPANT_MISMATCH ${formatValidationValue(flow?.id)} declared=${declared} actual=${actual}`,
      );
    }
    const dataModuleIds = new Set();
    for (const property of ["sourceDataRefs", "targetDataRefs"]) {
      for (const dataRef of list(flow?.[property])) {
        const objectEntry = index.objectById.get(dataRef?.objectId);
        if (objectEntry) dataModuleIds.add(objectEntry.moduleId);
      }
    }
    if (!setEquals(declaredModuleIds, dataModuleIds)) {
      const declared = [...declaredModuleIds]
        .map(formatValidationValue)
        .sort()
        .join(",");
      const actual = [...dataModuleIds]
        .map(formatValidationValue)
        .sort()
        .join(",");
      errors.push(
        `FLOW_DATA_PARTICIPANT_MISMATCH ${formatValidationValue(flow?.id)} declared=${declared} actual=${actual}`,
      );
    }

    const steps = [...list(flow?.steps)].sort((left, right) => (
      (left?.order ?? 0) - (right?.order ?? 0)
    ));
    const stepByOrder = new Map(steps.map((step) => [step?.order, step]));
    const providedInputsByStepOrder = new Map();
    const validateProvidedInput = (step, providedInput, pathId) => {
      const action = index.actionById.get(step?.actionId)?.value;
      const { fieldId, provider } = providedInput ?? {};
      const fieldEntry = index.fieldById.get(fieldId);
      const pathContext = pathId ? ` path=${formatValidationValue(pathId)}` : "";
      if (
        !action
        || !list(action.inputFieldIds).includes(fieldId)
        || fieldEntry?.objectId !== action.targetObjectId
      ) {
        errors.push(
          `INVALID_FLOW_INPUT_RESOLUTION ${formatValidationValue(flow?.id)}${pathContext} step=${formatValidationValue(step?.order)} provided field ${formatValidationValue(fieldId)} must be an input owned by the step target`,
        );
      }
      const providerEntries = isRecord(provider) ? Object.entries(provider) : [];
      const matchesAllowSubject = list(action?.permissions).some((permission) => (
        permission?.effect === "ALLOW"
        && providerEntries.length === 1
        && permission?.[providerEntries[0][0]] === providerEntries[0][1]
      ));
      const nonUserProviderIsSystemActor = (
        action?.executionMode === "USER_TASK"
        || provider?.actorRef === "SYSTEM"
        || provider?.actorRef === "AI"
      );
      if (!matchesAllowSubject || !nonUserProviderIsSystemActor) {
        errors.push(
          `INVALID_FLOW_INPUT_PROVIDER ${formatValidationValue(flow?.id)}${pathContext} step=${formatValidationValue(step?.order)} field=${formatValidationValue(fieldId)} provider must match an ALLOW subject for the step action`,
        );
      }
    };
    for (const step of steps) {
      const providedInputs = records(step?.providedInputs);
      providedInputsByStepOrder.set(
        step?.order,
        new Set(providedInputs.map(({ fieldId }) => fieldId)),
      );
      for (const providedInput of providedInputs) {
        validateProvidedInput(step, providedInput);
      }
    }
    const declaredExecutionPaths = list(flow?.executionPaths);
    const requiredRouteKind = new Map([
      ["ACTION_CHOICE_REQUIRED", "ACTION_CHOICE"],
      ["OPTION_VALUE_REQUIRED", "OPTION_VALUE"],
    ]).get(flow?.routingPolicy);
    if (flow?.routingPolicy === "NONE" && Object.hasOwn(flow, "executionPaths")) {
      errors.push(
        `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} NONE routing policy forbids execution paths`,
      );
    }
    if (requiredRouteKind && declaredExecutionPaths.length === 0) {
      errors.push(
        `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} ${formatValidationValue(flow?.routingPolicy)} requires execution paths`,
      );
    }
    if (requiredRouteKind && declaredExecutionPaths.some((executionPath) => (
      executionPath?.route?.kind !== requiredRouteKind
    ))) {
      errors.push(
        `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} ${formatValidationValue(flow?.routingPolicy)} requires ${formatValidationValue(requiredRouteKind)} routes`,
      );
    }
    const executionPaths = declaredExecutionPaths.length > 0
      ? declaredExecutionPaths
      : requiredRouteKind
        ? []
        : [{
        id: "DEFAULT",
        stepOrders: steps.map((step) => step?.order),
        providedInputs: [],
      }];
    if (declaredExecutionPaths.length > 0) {
      const optionRoutePartitions = new Map();
      for (const executionPath of executionPaths) {
        const route = executionPath?.route;
        const consumerStep = stepByOrder.get(route?.consumerStepOrder);
        const consumerAction = index.actionById.get(consumerStep?.actionId)?.value;
        const pathStepOrders = list(executionPath?.stepOrders);
        if (route?.kind === "ACTION_CHOICE") {
          if (
            !consumerStep
            || !consumerAction
            || !pathStepOrders.includes(route.consumerStepOrder)
          ) {
            errors.push(
              `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} path=${formatValidationValue(executionPath?.id)} ACTION_CHOICE must bind one action step in the path`,
            );
          }
          continue;
        }
        if (route?.kind !== "OPTION_VALUE") {
          errors.push(
            `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} path=${formatValidationValue(executionPath?.id)} requires an explicit route`,
          );
          continue;
        }

        const fieldEntry = index.fieldById.get(route?.fieldId);
        const field = fieldEntry?.value;
        const optionSet = field?.valueSource?.kind === "OPTION_SET"
          ? index.optionSetById.get(field.valueSource.optionSetId)?.value
          : undefined;
        const optionValues = list(optionSet?.values);
        const registeredCodes = new Set(
          optionValues.filter(isRecord).map(({ code }) => code).filter(isValidId),
        );
        const consumers = pathStepOrders.map((stepOrder) => ({
          step: stepByOrder.get(stepOrder),
          action: index.actionById.get(stepByOrder.get(stepOrder)?.actionId)?.value,
        })).filter(({ action }) => (
          list(action?.inputFieldIds).includes(route.fieldId)
        ));
        const acceptedBindings = list(consumerAction?.acceptedInputValues).filter((binding) => (
          binding?.fieldId === route.fieldId
          && binding?.optionSetId === field?.valueSource?.optionSetId
        ));
        const acceptedBinding = acceptedBindings.length === 1
          ? acceptedBindings[0]
          : undefined;
        const values = list(route?.values);
        const routeValid = optionSet?.mode === "STATIC"
          && registeredCodes.size === optionValues.length
          && values.length > 0
          && new Set(values).size === values.length
          && values.every((value) => registeredCodes.has(value))
          && pathStepOrders.includes(route.consumerStepOrder)
          && fieldEntry?.objectId === consumerAction?.targetObjectId
          && list(consumerAction?.inputFieldIds).includes(route.fieldId)
          && acceptedBinding
          && values.every((value) => list(acceptedBinding.codes).includes(value))
          && consumers.length === 1
          && consumers[0].step?.order === route.consumerStepOrder;
        if (!routeValid) {
          errors.push(
            `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} path=${formatValidationValue(executionPath?.id)} OPTION_VALUE must bind one accepted action consumer for registered values`,
          );
        }

        if (!acceptedBinding) continue;
        const partitionKey = [
          consumerAction?.targetObjectId,
          route.fieldId,
          acceptedBinding.partitionId,
        ].join("\u0000");
        const partition = optionRoutePartitions.get(partitionKey) ?? {
          registeredCodes,
          routedCodes: new Set(),
          valid: true,
        };
        for (const value of values) {
          if (partition.routedCodes.has(value)) partition.valid = false;
          partition.routedCodes.add(value);
        }
        optionRoutePartitions.set(partitionKey, partition);
      }
      for (const partition of optionRoutePartitions.values()) {
        if (!partition.valid || !setEquals(partition.routedCodes, partition.registeredCodes)) {
          errors.push(
            `INVALID_FLOW_BRANCH ${formatValidationValue(flow?.id)} OPTION_VALUE routes must be disjoint and exhaust each accepted partition`,
          );
        }
      }
    }
    const sourceFieldIdsForResolution = list(flow?.sourceDataRefs).flatMap((dataRef) => (
      [dataRef?.fieldId, dataRef?.version].filter(isValidId)
    ));
    for (const executionPath of executionPaths) {
      const pathProvidedInputsByStepOrder = new Map();
      for (const providedInput of records(executionPath?.providedInputs)) {
        const step = stepByOrder.get(providedInput?.stepOrder);
        if (step) validateProvidedInput(step, providedInput, executionPath?.id);
        const fieldIds = pathProvidedInputsByStepOrder.get(providedInput?.stepOrder)
          ?? new Set();
        fieldIds.add(providedInput?.fieldId);
        pathProvidedInputsByStepOrder.set(providedInput?.stepOrder, fieldIds);
      }
      const availableFieldIds = new Set(sourceFieldIdsForResolution);
      for (const stepOrder of list(executionPath?.stepOrders)) {
        const step = stepByOrder.get(stepOrder);
        const action = index.actionById.get(step?.actionId)?.value;
        if (!action) continue;
        const providedFieldIds = new Set([
          ...(providedInputsByStepOrder.get(stepOrder) ?? []),
          ...(pathProvidedInputsByStepOrder.get(stepOrder) ?? []),
        ]);
        const missingInputFieldIds = list(action.inputFieldIds).filter((fieldId) => (
          !availableFieldIds.has(fieldId) && !providedFieldIds.has(fieldId)
        ));
        if (missingInputFieldIds.length > 0) {
          errors.push(
            `INVALID_FLOW_INPUT_RESOLUTION ${formatValidationValue(flow?.id)} path=${formatValidationValue(executionPath?.id)} step=${formatValidationValue(stepOrder)} action=${formatValidationValue(action.id)} missing ${missingInputFieldIds.map(formatValidationValue).join(",")}`,
          );
        }
        const targetObject = index.objectById.get(action?.targetObjectId)?.value;
        const concreteState = concreteActionState(index, action);
        const missingStateFieldIds = missingActionStateFieldIds(
          index,
          action,
          targetObject,
          providedFieldIds,
        );
        if (missingStateFieldIds.length > 0) {
          errors.push(
            `INVALID_FLOW_TERMINAL_STATE ${formatValidationValue(flow?.id)} path=${formatValidationValue(executionPath?.id)} step=${formatValidationValue(stepOrder)} action=${formatValidationValue(action.id)} state=${formatValidationValue(concreteState)} missing ${missingStateFieldIds.map(formatValidationValue).join(",")}`,
          );
        }
        for (const fieldId of list(action.inputFieldIds)) {
          if (providedFieldIds.has(fieldId)) availableFieldIds.add(fieldId);
        }
        for (const fieldId of list(action.outputFieldIds)) availableFieldIds.add(fieldId);
      }
    }

    for (const targetRef of list(flow?.targetDataRefs)) {
      const produced = stepActions.some((action) => (
        action?.targetObjectId === targetRef?.objectId
        && list(action?.outputFieldIds).includes(targetRef?.fieldId)
      ));
      if (!produced) {
        errors.push(
          `INVALID_FLOW_TARGET_OUTPUT ${formatValidationValue(flow?.id)} -> ${formatValidationValue(targetRef?.objectId)}.${formatValidationValue(targetRef?.fieldId)}`,
        );
      }
    }

    const declaredFailureResults = new Set(
      stepActions.flatMap((action) => list(action?.failureResults)),
    );
    for (const resultCode of list(flow?.retryPolicy?.retryableFailureResults)) {
      if (!declaredFailureResults.has(resultCode)) {
        errors.push(
          `INVALID_FLOW_RETRY_RESULT ${formatValidationValue(flow?.id)} -> ${formatValidationValue(resultCode)}`,
        );
      }
    }

    const sourceRefs = records(flow?.sourceDataRefs);
    const sourceFieldIds = new Set(sourceRefs.map(({ fieldId }) => fieldId));
    const fixedSourceRefs = sourceRefs.filter(({ cardinality }) => cardinality === "ONE");
    const fixedSourceFieldIds = new Set(fixedSourceRefs.map(({ fieldId }) => fieldId));
    const fixedSourceVersionFieldIds = new Set(fixedSourceRefs.map(({ version }) => version));
    const keyParts = flow?.idempotencyKeyParts;
    const identityFieldIds = list(keyParts?.identityFieldIds);
    const versionFieldIds = list(keyParts?.versionFieldIds);
    const producedIdentityFieldIds = identityFieldIds.filter((fieldId) => (
      !fixedSourceFieldIds.has(fieldId)
    ));
    const producedVersionFieldIds = versionFieldIds.filter((fieldId) => (
      !fixedSourceVersionFieldIds.has(fieldId)
    ));
    const hasProducedKeyParts = producedIdentityFieldIds.length > 0
      || producedVersionFieldIds.length > 0;
    const producerCandidates = hasProducedKeyParts
      ? steps.map((step) => ({
        step,
        action: index.actionById.get(step?.actionId)?.value,
      })).filter(({ action }) => {
        const outputFieldIds = new Set(list(action?.outputFieldIds));
        return [...producedIdentityFieldIds, ...producedVersionFieldIds]
          .every((fieldId) => outputFieldIds.has(fieldId));
      })
      : [];
    const producer = producerCandidates.length === 1 ? producerCandidates[0] : undefined;
    const producerObject = index.objectById.get(producer?.action?.targetObjectId)?.value;
    const producerOutputFieldIds = new Set(list(producer?.action?.outputFieldIds));
    const producerObjectFieldIds = new Set(records(producerObject?.fields).map(({ id }) => id));
    const producerIdentityFieldId = objectIdentityFieldId(producerObject);
    const fanoutField = index.fieldById.get(keyParts?.fanoutFieldId)?.value;
    const hasExactSourceLineage = list(producerObject?.lineageBindings).some((binding) => {
      const targetObject = index.objectById.get(binding?.targetObjectId)?.value;
      const targetIdentityFieldId = objectIdentityFieldId(targetObject);
      return producerOutputFieldIds.has(binding?.refFieldId)
        && producerOutputFieldIds.has(binding?.versionFieldId)
        && fixedSourceRefs.some((sourceRef) => (
          sourceRef?.objectId === binding?.targetObjectId
          && sourceRef?.fieldId === targetIdentityFieldId
          && sourceRef?.version === binding?.targetVersionFieldId
        ));
    });
    const producerContractValid = !hasProducedKeyParts || (
      producerCandidates.length === 1
      && producer?.step?.order === 1
      && producer?.action?.operationKind === "CREATE"
      && producedIdentityFieldIds.length > 0
      && producedVersionFieldIds.length > 0
      && producedIdentityFieldIds.every((fieldId) => (
        producerObjectFieldIds.has(fieldId) && producerOutputFieldIds.has(fieldId)
      ))
      && producedVersionFieldIds.every((fieldId) => (
        producerObjectFieldIds.has(fieldId) && producerOutputFieldIds.has(fieldId)
      ))
      && identityFieldIds.includes(producerIdentityFieldId)
      && producerObjectFieldIds.has(keyParts?.fanoutFieldId)
      && producerOutputFieldIds.has(keyParts?.fanoutFieldId)
      && fanoutField?.idempotencyRole === "FANOUT_SET"
      && hasExactSourceLineage
    );
    if (!producerContractValid) {
      errors.push(
        `INVALID_FLOW_IDEMPOTENCY_PRODUCER ${formatValidationValue(flow?.id)} requires one first-step CREATE producer for the version-pinned identity, version, and fanout key fields`,
      );
    }
    const identityRolesValid = identityFieldIds.every((fieldId) => (
      hasStableIdempotencyRole(index, fieldId, ["OBJECT_ID", "OBJECT_REF"])
    ));
    const versionRolesValid = versionFieldIds.every((fieldId) => (
      hasStableIdempotencyRole(index, fieldId, ["OBJECT_VERSION"])
    ));
    const fanoutRoleValid = hasStableIdempotencyRole(
      index,
      keyParts?.fanoutFieldId,
      ["OBJECT_ID", "OBJECT_REF", "FANOUT_SET"],
    );
    const keyPartsDisjoint = identityFieldIds.every((fieldId) => (
      !versionFieldIds.includes(fieldId) && fieldId !== keyParts?.fanoutFieldId
    )) && versionFieldIds.every((fieldId) => fieldId !== keyParts?.fanoutFieldId);
    if (
      identityFieldIds.length === 0
      || identityFieldIds.some((fieldId) => (
        !fixedSourceFieldIds.has(fieldId) && !producerOutputFieldIds.has(fieldId)
      ))
      || !identityRolesValid
      || !versionRolesValid
      || !keyPartsDisjoint
      || [...fixedSourceVersionFieldIds].some((fieldId) => !versionFieldIds.includes(fieldId))
      || producedVersionFieldIds.some((fieldId) => !producerOutputFieldIds.has(fieldId))
      || (
        !sourceFieldIds.has(keyParts?.fanoutFieldId)
        && !producerOutputFieldIds.has(keyParts?.fanoutFieldId)
      )
      || !fanoutRoleValid
      || !producerContractValid
    ) {
      errors.push(
        `INVALID_FLOW_IDEMPOTENCY ${formatValidationValue(flow?.id)} requires disjoint source identity, declared version, and source fanout fields`,
      );
    }
  }
  return errors;
}

function aiTaskErrors(index) {
  const errors = [];
  for (const taskEntry of index.aiTasks) {
    const task = taskEntry.value;
    const targetActionEntry = index.actionById.get(task?.actionId);
    const targetAction = targetActionEntry?.value;
    const writesMatch = typeof task?.writes === "boolean"
      && typeof targetAction?.writes === "boolean"
      && task.writes === targetAction.writes;
    const readContractValid = !["QUERY", "ANALYSIS"].includes(task?.taskType)
      || (task?.writes === false && task?.risk === "READ");
    const clientsMatch = targetAction?.executionMode === "USER_TASK"
      && list(task?.clients).every((client) => list(targetAction?.clients).includes(client));
    const riskMatches = task?.risk === targetAction?.risk;
    if (
      targetActionEntry
      && (!writesMatch || !readContractValid || !clientsMatch || !riskMatches)
    ) {
      errors.push(
        `INVALID_AI_TARGET_ACTION ${formatValidationValue(task?.id)} must match the target Action write, risk, and client contract`,
      );
    }

    if (
      task?.taskType === "PERIODIC"
      && (
        targetActionEntry?.moduleId !== "RPT-001"
        || targetAction?.targetObjectId !== "RPT-OBJ-SUBSCRIPTION"
        || !PERIODIC_REPORT_ACTION_IDS.has(task?.actionId)
      )
    ) {
      errors.push(
        `INVALID_AI_PERIODIC_TARGET ${formatValidationValue(task?.id)} may manage only report subscriptions`,
      );
    }

    if (task?.taskType === "DRAFT") {
      const draftPolicy = task?.draftPolicy;
      const previewActionEntry = index.actionById.get(draftPolicy?.previewActionId);
      const previewObjectEntry = index.objectById.get(draftPolicy?.previewObjectId);
      const draftPolicyValid = draftPolicy?.previewActionId === "AIX-ACT-PREPARE-TASK-PREVIEW"
        && draftPolicy?.previewObjectId === "AIX-OBJ-TASK-PREVIEW"
        && draftPolicy.confirmationRequired === true
        && draftPolicy.businessWriteBeforeConfirmation === false
        && previewActionEntry?.moduleId === "AIX-001"
        && previewActionEntry.value?.targetObjectId === draftPolicy.previewObjectId
        && previewObjectEntry?.moduleId === "AIX-001"
        && previewObjectEntry.value?.lifecyclePolicyId === "LIFE-005";
      if (!draftPolicyValid) {
        errors.push(
          `INVALID_AI_DRAFT_POLICY ${formatValidationValue(task?.id)} must remain a temporary AIX preview until authorized confirmation`,
        );
      }
    }

    if (list(task?.roleRefs).includes("ROLE-STUDENT")) {
      const policy = task?.studentAccessPolicy;
      const policyValid = isRecord(policy)
        && ["answer", "explanation", "score", "feedback"]
          .every((property) => policy[property] === "OPEN_CONTENT_ONLY")
        && policy.sourceVersionRequired === true;
      if (!policyValid) {
        errors.push(
          `MISSING_AI_STUDENT_POLICY ${formatValidationValue(task?.id)} must enforce every content-open gate and source version`,
        );
      }
    }

    if (!task?.writes) continue;
    const registeredConfirmer = index.dutyIds.has(task?.confirmerDutyRef)
      && task?.confirmer?.mode === "DUTY"
      && task.confirmer.dutyRef === task.confirmerDutyRef;
    const previewFieldIds = new Set(list(task?.previewFieldIds));
    const previewComplete = list(targetAction?.inputFieldIds)
      .every((fieldId) => previewFieldIds.has(fieldId));
    if (previewFieldIds.size === 0 || !previewComplete || !registeredConfirmer) {
      errors.push(
        `AI_WRITE_WITHOUT_CONFIRMATION ${formatValidationValue(task?.id)} requires preview fields and an authorized duty confirmer`,
      );
    }
  }
  return errors;
}

function reportErrors(index) {
  const reportModule = index.moduleById.get("RPT-001")?.value;
  if (!reportModule) return [];
  const errors = [];
  const objectById = new Map(records(reportModule.objects).map((object) => [object.id, object]));
  const requiredObjectIds = [
    "RPT-OBJ-DEFINITION",
    "RPT-OBJ-SUBSCRIPTION",
    "RPT-OBJ-RUN",
    "RPT-OBJ-SNAPSHOT",
    "RPT-OBJ-DELIVERY",
  ];
  const fieldRequirements = new Map([
    ["RPT-OBJ-DEFINITION", [
      "RPT-DEFINITION-F-NAME",
      "RPT-DEFINITION-F-METRIC-IDS",
      "RPT-DEFINITION-F-DATA-SCOPE",
      "RPT-DEFINITION-F-TIME-RANGE",
    ]],
    ["RPT-OBJ-SUBSCRIPTION", [
      "RPT-SUBSCRIPTION-F-SCHEDULE-FREQUENCY",
      "RPT-SUBSCRIPTION-F-EXECUTION-TIME",
      "RPT-SUBSCRIPTION-F-TIMEZONE",
      "RPT-SUBSCRIPTION-F-RECIPIENTS",
    ]],
    ["RPT-OBJ-RUN", [
      "RPT-RUN-F-DATA-CUTOFF",
      "RPT-RUN-F-PERMISSION-RESULT",
      "RPT-RUN-F-SOURCE-VERSIONS",
      "RPT-RUN-F-RESULT",
    ]],
    ["RPT-OBJ-DELIVERY", ["RPT-DELIVERY-F-STATE"]],
  ]);
  const objectContractValid = setEquals(
    new Set(objectById.keys()),
    new Set(requiredObjectIds),
  ) && [...fieldRequirements].every(([objectId, fieldIds]) => {
    const actualFieldIds = new Set(records(objectById.get(objectId)?.fields).map(({ id }) => id));
    return fieldIds.every((fieldId) => actualFieldIds.has(fieldId));
  });

  const subscription = objectById.get("RPT-OBJ-SUBSCRIPTION");
  const run = objectById.get("RPT-OBJ-RUN");
  const lifecycleValid = setEquals(
    stateIds(subscription),
    new Set(["ACTIVE", "PAUSED", "CANCELLED"]),
  ) && setEquals(
    stateIds(run),
    new Set(["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "BLOCKED_PERMISSION"]),
  ) && hasExactKeys(reportModule.lifecycleBoundaries, [
    "subscriptionObjectId",
    "runObjectId",
    "sharedStateMachine",
  ])
    && reportModule.lifecycleBoundaries.subscriptionObjectId === "RPT-OBJ-SUBSCRIPTION"
    && reportModule.lifecycleBoundaries.runObjectId === "RPT-OBJ-RUN"
    && reportModule.lifecycleBoundaries.sharedStateMachine === false;

  const policy = run?.executionPolicy;
  const runPolicyValid = hasExactKeys(policy, [
    "permissionCheck",
    "dataCutoff",
    "permissionFailureState",
    "sourceVersionCapture",
  ])
    && policy.permissionCheck === "RECHECK_EACH_RUN"
    && policy.dataCutoff === "RESOLVE_AT_RUN_START"
    && policy.permissionFailureState === "BLOCKED_PERMISSION"
    && policy.sourceVersionCapture === "PIN_BEFORE_QUERY";

  const snapshot = objectById.get("RPT-OBJ-SNAPSHOT");
  const runRef = records(snapshot?.fields).find(({ id }) => id === "RPT-SNAPSHOT-F-RUN-REF");
  const snapshotPinValid = runRef?.valueSource?.kind === "OBJECT_REF"
    && runRef.valueSource.targetObjectId === "RPT-OBJ-RUN"
    && runRef.referenceIntegrity === "VERSION_PINNED"
    && runRef.versionBinding?.versionFieldId === "RPT-SNAPSHOT-F-RUN-VERSION"
    && runRef.versionBinding?.targetVersionFieldId === "RPT-RUN-F-VERSION"
    && records(snapshot?.fields).some(({ id }) => id === "RPT-SNAPSHOT-F-SOURCE-VERSIONS")
    && list(snapshot?.lineageBindings).some((binding) => (
      binding?.refFieldId === "RPT-SNAPSHOT-F-RUN-REF"
      && binding?.versionFieldId === "RPT-SNAPSHOT-F-RUN-VERSION"
      && binding?.targetObjectId === "RPT-OBJ-RUN"
      && binding?.targetVersionFieldId === "RPT-RUN-F-VERSION"
    ));

  const horizonValid = hasExactKeys(reportModule.timeHorizons, ["adHoc", "periodic"])
    && reportModule.timeHorizons.adHoc
      === "SESSION_ANALYSIS_SAVED_ONLY_ON_CONFIRMATION"
    && reportModule.timeHorizons.periodic
      === "SUBSCRIPTION_WITH_INDEPENDENT_RUN_SNAPSHOT_AND_DELIVERY"
    && index.moduleById.get("LPATH-001")?.value?.timeHorizon
      === "CROSS_TERM_APPEND_ONLY_LONG_TERM";

  if (
    !objectContractValid
    || !lifecycleValid
    || !runPolicyValid
    || !snapshotPinValid
    || !horizonValid
  ) {
    errors.push(
      "INVALID_REPORT_CONTRACT RPT-001 must separate report objects, lifecycles, run authorization, source pins, and time horizons",
    );
  }
  return errors;
}

function learningPathErrors(index) {
  const pathModule = index.moduleById.get("LPATH-001")?.value;
  if (!pathModule) return [];
  const errors = [];
  const timeline = index.objectById.get("LPATH-OBJ-TIMELINE-ENTRY")?.value;
  const interpretation = index.objectById.get("LPATH-OBJ-INTERPRETATION")?.value;
  const expectedSourceBindings = [
    ["PUBLISHED-RESULT", "PUB-OBJ-RESULT", "PUB-RESULT-F-RESULT-VERSION"],
    ["EVIDENCE", "INS-OBJ-EVIDENCE", "INS-EVIDENCE-F-EVIDENCE-VERSION"],
    ["CORRECTION", "CORR-OBJ-ATTEMPT", "CORR-ATTEMPT-F-CORRECTION-VERSION"],
    ["PLAN-EXECUTION", "APP-OBJ-TODO", "APP-TODO-F-AGGREGATION-VERSION"],
    ["TEACHER-CONFIRMATION", "GRD-OBJ-DECISION", "GRD-DECISION-F-DECISION-VERSION"],
  ];
  const timelineFieldById = new Map(records(timeline?.fields).map((field) => [field.id, field]));
  const timelineValid = timeline?.crossTerm === true
    && expectedSourceBindings.every(([kind, objectId, targetVersionFieldId]) => {
      const refFieldId = `LPATH-ENTRY-F-${kind}-REF`;
      const versionFieldId = `LPATH-ENTRY-F-${kind}-VERSION`;
      const refField = timelineFieldById.get(refFieldId);
      return refField?.valueSource?.kind === "OBJECT_REF"
        && refField.valueSource.targetObjectId === objectId
        && refField.referenceIntegrity === "VERSION_PINNED"
        && refField.versionBinding?.versionFieldId === versionFieldId
        && refField.versionBinding?.targetVersionFieldId === targetVersionFieldId
        && timelineFieldById.has(versionFieldId)
        && list(timeline?.lineageBindings).some((binding) => (
          binding?.refFieldId === refFieldId
          && binding?.versionFieldId === versionFieldId
          && binding?.targetObjectId === objectId
          && binding?.targetVersionFieldId === targetVersionFieldId
        ));
    });

  const interpretationFieldIds = new Set(
    records(interpretation?.fields).map(({ id }) => id),
  );
  const requiredInterpretationFieldIds = [
    "LPATH-INTERPRETATION-F-SUBJECT",
    "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-REF",
    "LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-VERSION",
    "LPATH-INTERPRETATION-F-EVIDENCE-REFS",
    "LPATH-INTERPRETATION-F-EXPLANATION",
    "LPATH-INTERPRETATION-F-CONFIDENCE",
    "LPATH-INTERPRETATION-F-LIMITATIONS",
    "LPATH-INTERPRETATION-F-TEACHER-CONFIRMER",
    "LPATH-INTERPRETATION-F-VISIBLE-FROM",
    "LPATH-INTERPRETATION-F-SUPERSEDED-BY-REF",
    "LPATH-INTERPRETATION-F-SUPERSEDED-BY-VERSION",
    "LPATH-INTERPRETATION-F-STALE-REASON",
    "LPATH-INTERPRETATION-F-VERSION",
  ];
  const interpretationValid = requiredInterpretationFieldIds.every((fieldId) => (
    interpretationFieldIds.has(fieldId)
  )) && setEquals(
    stateIds(interpretation),
    new Set(["CANDIDATE", "TEACHER_CONFIRMED", "STUDENT_VISIBLE", "SUPERSEDED", "STALE"]),
  );

  const history = pathModule.historyPolicy;
  const historyValid = hasExactKeys(history, [
    "timeline",
    "sourceFacts",
    "interpretationChange",
    "priorVersions",
  ])
    && history.timeline === "APPEND_ONLY_SOURCE_REFERENCES"
    && history.sourceFacts === "NEVER_COPY_OR_REWRITE"
    && history.interpretationChange === "CREATE_NEW_VERSION"
    && history.priorVersions === "RETAIN_WITH_SUPERSEDED_OR_STALE_REASON";

  const userWrites = records(pathModule.actions).filter(({ executionMode, writes }) => (
    executionMode === "USER_TASK" && writes === true
  ));
  const writesValid = userWrites.length > 0 && userWrites.every((action) => {
    const allows = records(action.permissions).filter(({ effect }) => effect === "ALLOW");
    return allows.length === 1
      && allows[0].dutyRef === "DUTY-SUBJECT-TEACHER"
      && records(action.permissions).some(({ effect, dutyRef }) => (
        effect === "DENY" && dutyRef === "DUTY-HOMEROOM"
      ));
  });
  const readAction = index.actionById.get("LPATH-ACT-VIEW-PATH")?.value;
  const readAllows = records(readAction?.permissions)
    .filter(({ effect }) => effect === "ALLOW")
    .map(({ dutyRef }) => dutyRef);
  const readValid = readAction?.writes === false
    && setEquals(
      new Set(readAllows),
      new Set(["DUTY-SUBJECT-TEACHER", "DUTY-HOMEROOM"]),
    );

  if (!timelineValid || !interpretationValid || !historyValid || !writesValid || !readValid) {
    errors.push(
      "INVALID_LEARNING_PATH_CONTRACT LPATH-001 must retain cross-term source versions and subject-owned interpretation history",
    );
  }
  return errors;
}

function notificationErrors(index) {
  const notification = index.objectById.get("NOTI-OBJ-NOTIFICATION")?.value;
  if (!notification) return [];
  const requiredFieldIds = [
    "NOTI-NOTIFICATION-F-SOURCE-EVENT",
    "NOTI-NOTIFICATION-F-RECIPIENT",
    "NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE",
    "NOTI-NOTIFICATION-F-DEEP-LINK",
    "NOTI-NOTIFICATION-F-DELIVERED-AT",
    "NOTI-NOTIFICATION-F-READ-AT",
    "NOTI-NOTIFICATION-F-HANDLED-AT",
    "NOTI-NOTIFICATION-F-FAILURE-CODE",
    "NOTI-NOTIFICATION-F-RETRY-COUNT",
  ];
  const fieldIds = new Set(records(notification.fields).map(({ id }) => id));
  const policy = notification.deliveryFailurePolicy;
  const valid = requiredFieldIds.every((fieldId) => fieldIds.has(fieldId))
    && hasExactKeys(policy, [
      "sourceBusinessFactRollback",
      "retryScope",
      "preserveAcceptedSourceVersion",
    ])
    && policy.sourceBusinessFactRollback === false
    && policy.retryScope === "NOTIFICATION_DELIVERY_ONLY"
    && policy.preserveAcceptedSourceVersion === true;
  return valid ? [] : [
    "INVALID_NOTIFICATION_CONTRACT NOTI-001 must retry delivery independently without rolling back source facts",
  ];
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
        `PHASE_BOUNDARY_EXECUTABLE_PAGE ${formatValidationValue(module?.id)} exposes pages or actions in phase two`,
      );
    }
  }
  for (const extensionEntry of index.extensions) {
    const extension = extensionEntry.value;
    const executable = EXTENSION_EXECUTABLE_KEYS
      .some((property) => Object.hasOwn(extension ?? {}, property));
    if (executable) {
      errors.push(
        `PHASE_BOUNDARY_EXECUTABLE_PAGE ${formatValidationValue(extension?.id)} exposes executable extension surface`,
      );
    }
  }
  for (const pageEntry of index.pages) {
    for (const name of entityNames(pageEntry.value)) {
      if (FORBIDDEN_PAGE_NAMES.has(name)) {
        errors.push(
          `FORBIDDEN_GENERIC_TEMPLATE page ${formatValidationValue(pageEntry.value?.id)} -> ${name}`,
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
    const requiredEventCount = METRIC_EVENT_COUNTS.get(metric?.aggregation) ?? 1;
    const distinctEventCount = new Set(
      list(metric?.eventIds).filter(isValidId),
    ).size;
    if (!METRIC_EVENT_COUNTS.has(metric?.aggregation)) {
      errors.push(
        `INVALID_METRIC_AGGREGATION ${formatValidationValue(metric?.id)} -> ${formatValidationValue(metric?.aggregation)}`,
      );
    }
    const complete = distinctEventCount >= requiredEventCount
      && Boolean(metric?.scope)
      && Boolean(metric?.aggregation)
      && Boolean(metric?.ownerRef)
      && isPresent(metric?.target);
    if (!complete) {
      errors.push(
        `MISSING_METRIC_EVENT ${formatValidationValue(metric?.id)} requires events, scope, aggregation, Owner, and target`,
      );
    }
    if (
      metric?.aggregation === "conversion"
      && list(metric?.eventIds).length > 2
    ) {
      const metricEventIds = list(metric.eventIds).filter(isValidId);
      const metricEventSet = new Set(metricEventIds);
      const usedEventIds = new Set();
      const seriesIds = new Set();
      let seriesValid = Array.isArray(metric.series)
        && metric.series.length > 0
        && metricEventSet.size === metricEventIds.length;
      for (const series of list(metric.series)) {
        const id = series?.id;
        const startEventId = series?.startEventId;
        const successEventId = series?.successEventId;
        const validPair = isValidId(id)
          && !seriesIds.has(id)
          && isValidId(startEventId)
          && isValidId(successEventId)
          && startEventId !== successEventId
          && isValidId(series?.correlationKey)
          && series?.target === "100%"
          && metricEventSet.has(startEventId)
          && metricEventSet.has(successEventId)
          && index.eventById.has(startEventId)
          && index.eventById.has(successEventId)
          && !usedEventIds.has(startEventId)
          && !usedEventIds.has(successEventId);
        if (!validPair) seriesValid = false;
        if (isValidId(id)) seriesIds.add(id);
        if (isValidId(startEventId)) usedEventIds.add(startEventId);
        if (isValidId(successEventId)) usedEventIds.add(successEventId);
      }
      if (!setEquals(metricEventSet, usedEventIds)) seriesValid = false;
      if (!seriesValid) {
        errors.push(
          `INVALID_METRIC_SERIES ${formatValidationValue(metric?.id)} requires non-overlapping resolvable conversion pairs covering every event`,
        );
      }
    }
  }
  return errors;
}

function gradingCapabilityErrors(index) {
  const errors = [];
  for (const moduleEntry of index.modules) {
    const module = moduleEntry.value;
    const declaresCapabilityFacts = Object.hasOwn(module ?? {}, "capabilityMatrix")
      || Object.hasOwn(module ?? {}, "capabilityApplicability");
    if (!declaresCapabilityFacts) continue;

    const matrix = list(module?.capabilityMatrix);
    const applicability = module?.capabilityApplicability;
    const dimensions = applicability?.dimensions;
    const subjectFamilies = list(dimensions?.subjectFamilies);
    const questionTypes = list(dimensions?.questionTypes);
    const submissionMethods = list(dimensions?.submissionMethods);
    const unsupportedRule = applicability?.unsupportedRule;
    const unsupportedDecision = unsupportedRule?.decision;
    const exceptCombinationIds = list(unsupportedRule?.exceptCombinationIds);
    const exactRulePriority = applicability?.exactRulePriority;
    const capabilityObjectId = applicability?.capabilityObjectId;
    const capabilityObjectEntry = index.objectById.get(capabilityObjectId);
    const fieldBindings = applicability?.fieldBindings;
    const optionProperties = [
      "subjectFamily",
      "questionType",
      "submissionMethod",
      "recognitionLevel",
      "scoringLevel",
      "requiredEvidence",
      "teacherReviewRequired",
      "batchConfirmEligibility",
      "unavailableFallback",
    ];
    const allowedCodesByProperty = new Map();
    const optionSetsByProperty = new Map();
    let fieldBindingsValid = hasExactKeys(fieldBindings, optionProperties)
      && capabilityObjectEntry?.moduleId === moduleEntry.value?.id;
    for (const property of optionProperties) {
      const binding = fieldBindings?.[property];
      const fieldEntry = index.fieldById.get(binding?.fieldId);
      const optionSetId = binding?.optionSetId;
      const optionSet = index.optionSetById.get(optionSetId)?.value;
      optionSetsByProperty.set(property, optionSet);
      if (
        !hasExactKeys(binding, ["fieldId", "optionSetId"])
        || fieldEntry?.moduleId !== moduleEntry.value?.id
        || fieldEntry?.objectId !== capabilityObjectId
        || fieldEntry?.value?.valueSource?.kind !== "OPTION_SET"
        || fieldEntry.value.valueSource.optionSetId !== optionSetId
      ) {
        fieldBindingsValid = false;
      }
      const optionValues = list(optionSet?.values);
      const recordValues = optionValues.filter(isRecord);
      const codes = new Set(recordValues.map(({ code }) => code).filter(isValidId));
      if (
        optionSet?.mode !== "STATIC"
        || codes.size === 0
        || recordValues.length !== optionValues.length
      ) {
        allowedCodesByProperty.set(property, null);
      } else {
        allowedCodesByProperty.set(property, codes);
      }
    }
    const codeIsAllowed = (property, value) => {
      const allowedCodes = allowedCodesByProperty.get(property);
      if (!allowedCodes) return false;
      const values = Array.isArray(value) ? value : [value];
      return values.length > 0 && values.every((entry) => allowedCodes.has(entry));
    };
    const questionTypeOptionSet = optionSetsByProperty.get("questionType");
    const questionTypeValues = list(questionTypeOptionSet?.values).filter(isRecord);
    const subjectiveQuestionTypes = new Set(
      questionTypeValues
        .filter(({ isSubjective }) => isSubjective === true)
        .map(({ code }) => code),
    );
    let valid = Array.isArray(module?.capabilityMatrix)
      && matrix.length > 0
      && hasExactKeys(applicability, [
        "exactRulePriority",
        "capabilityObjectId",
        "fieldBindings",
        "dimensions",
        "unsupportedRule",
      ])
      && hasExactKeys(dimensions, [
        "subjectFamilies",
        "questionTypes",
        "submissionMethods",
      ])
      && fieldBindingsValid
      && Number.isInteger(exactRulePriority)
      && Number.isInteger(unsupportedRule?.priority)
      && unsupportedRule.priority < exactRulePriority
      && hasExactKeys(unsupportedRule, [
        "id",
        "priority",
        "match",
        "exceptCombinationIds",
        "decision",
      ])
      && hasExactKeys(unsupportedRule?.match, [
        "subjectFamily",
        "questionType",
        "submissionMethod",
      ])
      && hasExactKeys(unsupportedDecision, [
        "recognitionLevel",
        "scoringLevel",
        "requiredEvidence",
        "teacherReviewRequired",
        "batchConfirmEligibility",
        "unavailableFallback",
      ])
      && unsupportedRule?.match?.subjectFamily === "*"
      && unsupportedRule?.match?.questionType === "*"
      && unsupportedRule?.match?.submissionMethod === "*"
      && optionProperties.every((property) => (
        isValidId(fieldBindings?.[property]?.fieldId)
        && isValidId(fieldBindings?.[property]?.optionSetId)
        && allowedCodesByProperty.get(property) !== null
      ));

    const dimensionLists = [subjectFamilies, questionTypes, submissionMethods];
    for (const values of dimensionLists) {
      if (
        values.length === 0
        || values.some((value) => !isValidId(value))
        || new Set(values).size !== values.length
      ) {
        valid = false;
      }
    }
    const dimensionOptionProperties = [
      [subjectFamilies, "subjectFamily"],
      [questionTypes, "questionType"],
      [submissionMethods, "submissionMethod"],
    ];
    if (dimensionOptionProperties.some(([values, property]) => (
      !setEquals(new Set(values), allowedCodesByProperty.get(property) ?? new Set())
    ))) {
      valid = false;
    }
    if (questionTypeValues.some(({ isSubjective }) => typeof isSubjective !== "boolean")) {
      valid = false;
    }

    const combinationId = (subjectFamily, questionType, submissionMethod) => (
      `${subjectFamily}|${questionType}|${submissionMethod}`
    );
    const exactMatchCounts = new Map();
    const supportedCombinationIds = [];
    const ruleIds = [];
    const ruleKeys = [
      "id",
      "subjectFamily",
      "questionType",
      "submissionMethod",
      "recognitionLevel",
      "scoringLevel",
      "requiredEvidence",
      "teacherReviewRequired",
      "batchConfirmEligibility",
      "unavailableFallback",
    ];
    for (const rule of matrix) {
      const subjectFamily = rule?.subjectFamily;
      const questionType = rule?.questionType;
      const submissionMethod = rule?.submissionMethod;
      const requiredEvidence = list(rule?.requiredEvidence);
      const ruleIsComplete = hasExactKeys(rule, ruleKeys)
        && isValidId(rule?.id)
        && subjectFamilies.includes(subjectFamily)
        && questionTypes.includes(questionType)
        && submissionMethods.includes(submissionMethod)
        && isValidId(rule?.recognitionLevel)
        && isValidId(rule?.scoringLevel)
        && requiredEvidence.length > 0
        && requiredEvidence.every(isValidId)
        && new Set(requiredEvidence).size === requiredEvidence.length
        && isValidId(rule?.teacherReviewRequired)
        && isValidId(rule?.batchConfirmEligibility)
        && isValidId(rule?.unavailableFallback)
        && !Object.hasOwn(rule ?? {}, "isSubjective")
        && optionProperties.every((property) => codeIsAllowed(property, rule?.[property]))
        && (
          !subjectiveQuestionTypes.has(questionType)
          || (
            rule.teacherReviewRequired === "YES"
            && rule.batchConfirmEligibility === "INELIGIBLE"
            && rule.scoringLevel !== "AUTO-SCORE"
          )
        );
      if (!ruleIsComplete) valid = false;
      if (isValidId(rule?.id)) ruleIds.push(rule.id);
      if (
        isValidId(subjectFamily)
        && isValidId(questionType)
        && isValidId(submissionMethod)
      ) {
        const id = combinationId(subjectFamily, questionType, submissionMethod);
        supportedCombinationIds.push(id);
        exactMatchCounts.set(id, (exactMatchCounts.get(id) ?? 0) + 1);
      }
    }

    const supportedCombinationIdSet = new Set(supportedCombinationIds);
    const exceptCombinationIdSet = new Set(exceptCombinationIds);
    if (
      new Set(ruleIds).size !== ruleIds.length
      || !isValidId(unsupportedRule?.id)
      || supportedCombinationIdSet.size !== supportedCombinationIds.length
      || exceptCombinationIdSet.size !== exceptCombinationIds.length
      || !setEquals(supportedCombinationIdSet, exceptCombinationIdSet)
    ) {
      valid = false;
    }
    if (
      unsupportedDecision === null
      || typeof unsupportedDecision !== "object"
      || Array.isArray(unsupportedDecision)
      || !isValidId(unsupportedDecision?.recognitionLevel)
      || !isValidId(unsupportedDecision?.scoringLevel)
      || list(unsupportedDecision?.requiredEvidence).length === 0
      || !list(unsupportedDecision?.requiredEvidence).every(isValidId)
      || new Set(list(unsupportedDecision?.requiredEvidence)).size
        !== list(unsupportedDecision?.requiredEvidence).length
      || unsupportedDecision?.teacherReviewRequired !== "YES"
      || unsupportedDecision?.batchConfirmEligibility !== "INELIGIBLE"
      || !isValidId(unsupportedDecision?.unavailableFallback)
      || ![
        "recognitionLevel",
        "scoringLevel",
        "requiredEvidence",
        "teacherReviewRequired",
        "batchConfirmEligibility",
        "unavailableFallback",
      ].every((property) => codeIsAllowed(property, unsupportedDecision?.[property]))
    ) {
      valid = false;
    }

    for (const subjectFamily of subjectFamilies) {
      for (const questionType of questionTypes) {
        for (const submissionMethod of submissionMethods) {
          const id = combinationId(subjectFamily, questionType, submissionMethod);
          const exactMatchCount = exactMatchCounts.get(id) ?? 0;
          const fallbackMatchCount = exceptCombinationIdSet.has(id) ? 0 : 1;
          if (exactMatchCount + fallbackMatchCount !== 1) valid = false;
        }
      }
    }

    if (!valid) {
      errors.push(
        `INVALID_GRADING_CAPABILITY_MATRIX ${formatValidationValue(module?.id)} requires one explicit non-overlapping decision for every declared combination and mandatory review for subjective questions`,
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
    ...actionApplicabilityErrors(index),
    ...conditionalRequiredErrors(index),
    ...ownerErrors(index),
    ...aiTaskErrors(index),
    ...reportErrors(index),
    ...learningPathErrors(index),
    ...notificationErrors(index),
    ...phaseAndTemplateErrors(index),
    ...metricErrors(index),
    ...gradingCapabilityErrors(index),
  ];
}
