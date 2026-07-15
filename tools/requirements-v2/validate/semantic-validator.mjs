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
  "RPT-ACT-CREATE-HOMEROOM-SUBSCRIPTION",
  "RPT-ACT-CREATE-ACADEMIC-SUBSCRIPTION",
  "RPT-ACT-UPDATE-SUBSCRIPTION",
  "RPT-ACT-PAUSE-SUBSCRIPTION",
  "RPT-ACT-CANCEL-SUBSCRIPTION",
]);

const AI_TASK_CAPABILITIES = new Map([
  ["QUERY", "QUERY"],
  ["ANALYSIS", "ANALYSIS"],
  ["DRAFT", "DRAFT"],
  ["AD_HOC_REPORT", "REPORT"],
  ["PERIODIC", "PERIODIC"],
  ["REMINDER", "REMINDER"],
  ["CONTROLLED_ACTION", "CONTROLLED"],
]);

const EXTERNAL_SOURCE_PROJECTION_CONTRACTS = [
  ["ACC-OBJ-SCHOOL", "ACC-ACT-SYNC-SCHOOL", "EVT-SCHOOL-DIRECTORY-SNAPSHOT-AVAILABLE", "ACC-SCHOOL-F-SOURCE-REF", "ACC-SCHOOL-F-SOURCE-VERSION"],
  ["ACC-OBJ-IDENTITY", "ACC-ACT-SYNC-IDENTITY", "EVT-IDENTITY-DIRECTORY-SNAPSHOT-AVAILABLE", "ACC-IDENTITY-F-SOURCE-REF", "ACC-IDENTITY-F-SOURCE-VERSION"],
  ["IAM-OBJ-ROLE-POLICY", "IAM-ACT-SYNC-ROLE-POLICY", "EVT-ROLE-POLICY-SNAPSHOT-AVAILABLE", "IAM-ROLE-F-SOURCE-REF", "IAM-ROLE-F-SOURCE-VERSION"],
  ["DGV-OBJ-POLICY", "DGV-ACT-SYNC-POLICY", "EVT-DATA-GOVERNANCE-POLICY-SNAPSHOT-AVAILABLE", "DGV-POLICY-F-SOURCE-REF", "DGV-POLICY-F-SOURCE-VERSION"],
  ["TEA-OBJ-TODO-VIEW", "TEA-ACT-SYNC-TODO-VIEW", "EVT-TEACHER-TODO-PROJECTION-AVAILABLE", "TEA-TODO-F-PROJECTION-SOURCE-REF", "TEA-TODO-F-PROJECTION-SOURCE-VERSION"],
  ["HW-OBJ-RUBRIC", "HW-ACT-SYNC-RUBRIC", "EVT-RUBRIC-SNAPSHOT-AVAILABLE", "HW-RUBRIC-F-SOURCE-REF", "HW-RUBRIC-F-SOURCE-VERSION"],
  ["GRD-OBJ-CAPABILITY-RULE", "GRD-ACT-SYNC-CAPABILITY-RULE", "EVT-GRADING-CAPABILITY-SNAPSHOT-AVAILABLE", "GRD-CAP-F-SOURCE-REF", "GRD-CAP-F-SOURCE-VERSION"],
];

const DESTRUCTIVE_LIFECYCLE_STATES = new Set([
  "SUSPENDED",
  "DEACTIVATED",
  "REVOKED",
  "ARCHIVED",
  "TRANSFERRED",
  "EXPIRED",
  "CANCELLED",
  "SUPERSEDED",
  "DEPRECATED",
  "RETIRED",
  "CLOSED",
  "INVALIDATED",
  "DISABLED",
  "STALE",
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
    const declaredActionIds = list(required.whenActionIds);
    for (const actionId of declaredActionIds) {
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
    const writerActionIds = index.actions
      .filter(({ moduleId, value: action }) => (
        moduleId === fieldEntry.moduleId
        && action?.targetObjectId === fieldEntry.objectId
        && action?.writes === true
        && list(action?.outputFieldIds).includes(fieldEntry.value?.id)
      ))
      .map(({ value }) => value.id);
    if (!setEquals(new Set(declaredActionIds), new Set(writerActionIds))) {
      errors.push(
        `INVALID_FIELD_ACTION_BINDING ${formatValidationValue(fieldEntry.value?.id)} declared=${declaredActionIds.map(formatValidationValue).sort().join(",")} writers=${writerActionIds.map(formatValidationValue).sort().join(",")}`,
      );
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

function fieldWriteContractErrors(index) {
  const errors = [];
  const fieldsWithContracts = index.fields.filter(({ value }) => (
    isRecord(value?.writeContract)
  ));
  for (const fieldEntry of fieldsWithContracts) {
    const field = fieldEntry.value;
    const contract = field.writeContract;
    const initializers = contract.initializers;
    const mutators = contract.mutators;
    const initializerActionIds = list(initializers?.actionIds);
    const mutatorActionIds = list(mutators?.actionIds);
    const declaredWriterIds = [...initializerActionIds, ...mutatorActionIds];
    const actualWriterIds = index.actions
      .filter(({ moduleId, value: action }) => (
        moduleId === fieldEntry.moduleId
        && action?.targetObjectId === fieldEntry.objectId
        && action?.writes === true
        && list(action?.outputFieldIds).includes(field?.id)
      ))
      .map(({ value }) => value.id);
    const requiredActionIds = isRecord(field.required)
      ? list(field.required.whenActionIds)
      : [];
    const actionSemanticsValid = declaredWriterIds.every((actionId) => {
      const actionEntry = index.actionById.get(actionId);
      const action = actionEntry?.value;
      const initializer = initializerActionIds.includes(actionId);
      const matchingWrites = records(action?.fieldWrites)
        .filter(({ fieldId }) => fieldId === field.id);
      const expectedMode = initializer ? "INITIALIZE" : mutators?.operation;
      const expectedValueProperty = initializer ? "value" : "amount";
      const expectedValue = initializer ? initializers?.value : mutators?.amount;
      return actionEntry?.moduleId === fieldEntry.moduleId
        && action?.targetObjectId === fieldEntry.objectId
        && action?.operationKind === (initializer ? "CREATE" : "UPDATE")
        && list(action?.outputFieldIds).includes(field.id)
        && matchingWrites.length === 1
        && matchingWrites[0].mode === expectedMode
        && matchingWrites[0][expectedValueProperty] === expectedValue;
    });
    const valid = field.dataType === "INTEGER"
      && field.valueSource?.kind === "SYSTEM"
      && field.mutability === "SYSTEM_MANAGED"
      && initializerActionIds.length > 0
      && mutatorActionIds.length > 0
      && new Set(declaredWriterIds).size === declaredWriterIds.length
      && setEquals(new Set(actualWriterIds), new Set(declaredWriterIds))
      && setEquals(new Set(requiredActionIds), new Set(declaredWriterIds))
      && initializers?.value === 0
      && mutators?.operation === "INCREMENT"
      && mutators?.amount === 1
      && actionSemanticsValid;
    if (!valid) {
      errors.push(
        `INVALID_FIELD_WRITE_CONTRACT ${formatValidationValue(field.id)} writers must exactly match INITIALIZE 0 and INCREMENT 1 Action semantics`,
      );
    }
  }
  for (const actionEntry of index.actions) {
    for (const fieldWrite of records(actionEntry.value?.fieldWrites)) {
      const fieldEntry = index.fieldById.get(fieldWrite?.fieldId);
      if (
        fieldEntry?.moduleId !== actionEntry.moduleId
        || fieldEntry?.objectId !== actionEntry.value?.targetObjectId
        || !isRecord(fieldEntry.value?.writeContract)
        || !list(actionEntry.value?.outputFieldIds).includes(fieldWrite?.fieldId)
      ) {
        errors.push(
          `INVALID_FIELD_WRITE_CONTRACT ${formatValidationValue(actionEntry.value?.id)} -> ${formatValidationValue(fieldWrite?.fieldId)} must bind one declared target-field write contract`,
        );
      }
    }
  }
  return errors;
}

function eventActionRoutingErrors(index) {
  const errors = [];
  for (const eventEntry of index.events) {
    const actionsByObjectId = new Map();
    for (const actionId of list(eventEntry.value?.triggeredActionIds)) {
      const action = index.actionById.get(actionId)?.value;
      if (
        action?.executionMode !== "SYSTEM_EVENT"
        || action?.trigger?.eventId !== eventEntry.value?.id
        || !isValidId(action?.targetObjectId)
      ) continue;
      const actions = actionsByObjectId.get(action.targetObjectId) ?? [];
      actions.push(action);
      actionsByObjectId.set(action.targetObjectId, actions);
    }

    for (const [objectId, actions] of actionsByObjectId) {
      for (let leftIndex = 0; leftIndex < actions.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < actions.length; rightIndex += 1) {
          const left = actions[leftIndex];
          const right = actions[rightIndex];
          const isImplicitCreateUpdate = (
            left.operationKind === "CREATE"
            && right.operationKind !== "CREATE"
          ) || (
            right.operationKind === "CREATE"
            && left.operationKind !== "CREATE"
          );
          const leftFrom = new Set(list(
            Array.isArray(left.transition?.from)
              ? left.transition.from
              : [left.transition?.from],
          ).filter(isValidId));
          const rightFrom = new Set(list(
            Array.isArray(right.transition?.from)
              ? right.transition.from
              : [right.transition?.from],
          ).filter(isValidId));
          const hasOverlappingExclusiveTransitions = isRecord(left.transition)
            && isRecord(right.transition)
            && [...leftFrom].some((state) => rightFrom.has(state))
            && left.transition.to !== right.transition.to;
          if (isImplicitCreateUpdate || hasOverlappingExclusiveTransitions) {
            errors.push(
              `INVALID_EVENT_ACTION_ROUTING ${formatValidationValue(eventEntry.value?.id)} -> ${formatValidationValue(objectId)} cannot route ${formatValidationValue(left.id)} and ${formatValidationValue(right.id)} without an explicit ordered Flow and identity binding`,
            );
          }
        }
      }
    }
  }
  return errors;
}

function stateReachabilityErrors(index) {
  const errors = [];
  for (const objectEntry of index.objects) {
    const object = objectEntry.value;
    const module = index.moduleById.get(objectEntry.moduleId)?.value;
    if (module?.phase !== 1) continue;

    const policy = object?.stateReachability;
    const declaredStates = stateIds(object);
    const objectActions = index.actions
      .filter(({ value }) => value?.targetObjectId === object?.id)
      .map(({ value }) => value);
    if (!isRecord(policy) || !["NONE", "ACTION_GRAPH"].includes(policy.mode)) {
      errors.push(
        `INVALID_STATE_REACHABILITY_POLICY ${formatValidationValue(object?.id)} must declare NONE or ACTION_GRAPH`,
      );
      continue;
    }
    if (policy.mode === "NONE") {
      if (!hasExactKeys(policy, ["mode"])) {
        errors.push(
          `INVALID_STATE_REACHABILITY_POLICY ${formatValidationValue(object?.id)} NONE must use the closed policy shape`,
        );
      }
      const hasStateChangingAction = objectActions.some((action) => (
        action?.writes === true
        || isRecord(action?.transition)
        || declaredStates.has(concreteActionState(index, action))
      ));
      if (declaredStates.size !== 1 || hasStateChangingAction) {
        errors.push(
          `INVALID_STATE_REACHABILITY_POLICY ${formatValidationValue(object?.id)} NONE requires one trivial state and no state-changing Action`,
        );
      }
      continue;
    }
    const policyKeys = Object.hasOwn(policy, "entrySources")
      ? ["mode", "initialStateIds", "entrySources"]
      : ["mode", "initialStateIds"];
    if (!hasExactKeys(policy, policyKeys)) {
      errors.push(
        `INVALID_STATE_REACHABILITY_POLICY ${formatValidationValue(object?.id)} ACTION_GRAPH must use the closed initialStateIds and optional entrySources shape`,
      );
      continue;
    }

    const initialStateIds = list(policy.initialStateIds);
    const validInitialStates = initialStateIds.every(isValidId)
      && new Set(initialStateIds).size === initialStateIds.length
      && initialStateIds.every((state) => declaredStates.has(state));
    const createActions = objectActions
      .filter(({ operationKind }) => operationKind === "CREATE");
    const declaredEntrySources = list(policy.entrySources);
    const entrySources = records(policy.entrySources);
    const externalSourceStates = new Set(entrySources.map(({ stateId }) => stateId));
    const readOnlyExternal = !objectActions.some(({ writes }) => writes === true);
    const validEntryContract = createActions.length > 0
      ? initialStateIds.length === 0 && declaredEntrySources.length === 0
      : readOnlyExternal
        ? declaredStates.size === 1
          && initialStateIds.length === 1
          && declaredEntrySources.length === 0
        : initialStateIds.length === 1 && declaredEntrySources.length === 0;
    if (!validEntryContract) {
      errors.push(
        `INVALID_STATE_ENTRY_SOURCE ${formatValidationValue(object?.id)} must derive entries from CREATE success or closed producer-bound external source evidence`,
      );
    }
    const scenarioStatesByActionId = new Map(objectActions.map((action) => [
      action.id,
      new Set(index.scenarios
        .filter(({ value }) => (
          value?.actionId === action.id
          && value?.then?.expectedState?.mode === "STATE"
          && declaredStates.has(value.then.expectedState.value)
        ))
        .map(({ value }) => value.then.expectedState.value)),
    ]));
    const createEntryStates = createActions.flatMap((action) => index.scenarios
      .filter(({ value }) => (
        value?.actionId === action.id
        && value?.kind === "SUCCESS"
        && value?.then?.expectedState?.mode === "STATE"
        && declaredStates.has(value.then.expectedState.value)
      ))
      .map(({ value }) => value.then.expectedState.value));
    const reachableStates = new Set([
      ...(createActions.length === 0 ? initialStateIds : []),
      ...externalSourceStates,
      ...createEntryStates,
    ]);
    if (!validInitialStates || reachableStates.size === 0) {
      errors.push(
        `INVALID_STATE_REACHABILITY_POLICY ${formatValidationValue(object?.id)} ACTION_GRAPH requires a declared initial state or CREATE success state`,
      );
      continue;
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const action of objectActions) {
        const transition = action?.transition;
        if (!isRecord(transition)) continue;
        const fromStates = Array.isArray(transition.from)
          ? transition.from
          : [transition.from];
        if (!fromStates.some((state) => reachableStates.has(state))) continue;
        const targetStates = new Set([
          transition.to,
          ...(scenarioStatesByActionId.get(action.id) ?? []),
        ]);
        for (const targetState of targetStates) {
          if (declaredStates.has(targetState) && !reachableStates.has(targetState)) {
            reachableStates.add(targetState);
            changed = true;
          }
        }
      }
    }
    const unreachableStates = [...declaredStates]
      .filter((state) => !reachableStates.has(state));
    if (unreachableStates.length > 0) {
      errors.push(
        `UNREACHABLE_OBJECT_STATE ${formatValidationValue(object?.id)} -> ${unreachableStates.map(formatValidationValue).join(",")}`,
      );
    }
  }
  return errors;
}

function externalSourceProvenanceErrors(index) {
  const errors = index.objects
    .filter(({ value }) => Object.hasOwn(value?.stateReachability ?? {}, "entrySources"))
    .map(({ value }) => (
      `INVALID_EXTERNAL_SOURCE_PROVENANCE ${formatValidationValue(value?.id)} metadata-only entrySources cannot replace a registered source Action, Event, and version binding`
    ));
  for (const [
    objectId,
    actionId,
    eventId,
    sourceRefFieldId,
    sourceVersionFieldId,
  ] of EXTERNAL_SOURCE_PROJECTION_CONTRACTS) {
    const objectEntry = index.objectById.get(objectId);
    if (!objectEntry) continue;
    const object = objectEntry?.value;
    const actionEntry = index.actionById.get(actionId);
    const action = actionEntry?.value;
    const event = index.eventById.get(eventId)?.value;
    const sourceRefField = index.fieldById.get(sourceRefFieldId);
    const sourceVersionField = index.fieldById.get(sourceVersionFieldId);
    const identityField = records(object?.fields)
      .find(({ idempotencyRole }) => idempotencyRole === "OBJECT_ID");
    const createActionIds = index.actions
      .filter(({ value }) => (
        value?.targetObjectId === objectId && value?.operationKind === "CREATE"
      ))
      .map(({ value }) => value.id);
    const successStates = new Set(index.scenarios
      .filter(({ value }) => (
        value?.actionId === actionId
        && value?.kind === "SUCCESS"
        && value?.then?.expectedState?.mode === "STATE"
      ))
      .map(({ value }) => value.then.expectedState.value));
    const sourceFieldsValid = [
      [sourceRefField, "ID"],
      [sourceVersionField, "INTEGER"],
    ].every(([fieldEntry, dataType]) => (
      fieldEntry?.objectId === objectId
      && fieldEntry.value?.dataType === dataType
      && fieldEntry.value?.valueSource?.kind === "SYSTEM"
      && fieldEntry.value?.mutability === "IMMUTABLE"
      && list(action?.inputFieldIds).includes(fieldEntry.value.id)
      && list(action?.outputFieldIds).includes(fieldEntry.value.id)
    ));
    const valid = objectEntry
      && actionEntry?.moduleId === objectEntry.moduleId
      && action?.targetObjectId === objectId
      && action?.operationKind === "CREATE"
      && action?.executionMode === "SYSTEM_EVENT"
      && action?.trigger?.kind === "EVENT"
      && action.trigger.eventId === eventId
      && setEquals(new Set(list(event?.triggeredActionIds)), new Set([actionId]))
      && createActionIds.length === 1
      && createActionIds[0] === actionId
      && sourceFieldsValid
      && isValidId(identityField?.id)
      && !list(action?.inputFieldIds).includes(identityField.id)
      && list(action?.outputFieldIds).includes(identityField.id)
      && setEquals(successStates, stateIds(object))
      && !Object.hasOwn(object?.stateReachability ?? {}, "entrySources")
      && list(object?.stateReachability?.initialStateIds).length === 0;
    if (!valid) {
      errors.push(
        `INVALID_EXTERNAL_SOURCE_PROVENANCE ${formatValidationValue(objectId)} must bind ${formatValidationValue(actionId)} to one registered source Event with immutable source reference and version inputs`,
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

function lifecycleRiskErrors(index) {
  const errors = [];
  for (const actionEntry of index.actions) {
    const action = actionEntry.value;
    const targetObject = index.objectById.get(action?.targetObjectId)?.value;
    if (
      !["S3", "S4"].includes(targetObject?.sensitivityId)
      || !DESTRUCTIVE_LIFECYCLE_STATES.has(action?.transition?.to)
    ) continue;
    const auditClosed = action?.auditMode === "ATOMIC_SELF_RECORD"
      || (
        action?.auditMode === "REQUIRED"
        && list(action?.failureResults).includes("AUDIT_FAILED")
      );
    if (action?.risk !== "HIGH" || !auditClosed) {
      errors.push(
        `INVALID_LIFECYCLE_RISK ${formatValidationValue(action?.id)} destructive ${formatValidationValue(targetObject?.sensitivityId)} transition must be HIGH risk and audit fail-closed`,
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
    const sourceOnlyModuleIds = new Set(list(flow?.sourceOnlyModuleIds));
    const expectedActionModuleIds = new Set(
      [...declaredModuleIds].filter((moduleId) => !sourceOnlyModuleIds.has(moduleId)),
    );
    const sourceDataModuleIds = new Set(list(flow?.sourceDataRefs)
      .map((dataRef) => index.objectById.get(dataRef?.objectId)?.moduleId)
      .filter(isValidId));
    const participantRolesValid = [...sourceOnlyModuleIds].every((moduleId) => (
      declaredModuleIds.has(moduleId)
      && !actionModuleIds.has(moduleId)
      && sourceDataModuleIds.has(moduleId)
    ));
    if (
      !participantRolesValid
      || !setEquals(expectedActionModuleIds, actionModuleIds)
    ) {
      const declared = [...declaredModuleIds]
        .map(formatValidationValue)
        .sort()
        .join(",");
      const actual = [...actionModuleIds]
        .map(formatValidationValue)
        .sort()
        .join(",");
      errors.push(
        `FLOW_PARTICIPANT_MISMATCH ${formatValidationValue(flow?.id)} declared=${declared} actionModules=${actual}`,
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

function flowProfileErrors(index) {
  const errors = [];
  const sameOrder = (actual, expected) => actual.length === expected.length
    && actual.every((value, position) => value === expected[position]);
  const sameSet = (actual, expected) => setEquals(new Set(actual), new Set(expected));
  const roleSequence = (values) => records(values).map(({ role }) => role);
  const participantModuleByRole = (flow) => new Map(
    records(flow?.participantRoles).map(({ role, moduleId }) => [role, moduleId]),
  );
  const actionForStep = (step) => index.actionById.get(step?.actionId);
  const refsHaveTargetSemantics = (flow, expectedTargetObjectIds) => {
    const targetRefs = records(flow?.targetDataRefs);
    if (!sameSet(
      targetRefs.map(({ objectId }) => objectId),
      expectedTargetObjectIds,
    )) return false;
    const refsByObjectId = new Map();
    for (const dataRef of targetRefs) {
      const values = refsByObjectId.get(dataRef.objectId) ?? [];
      values.push(dataRef);
      refsByObjectId.set(dataRef.objectId, values);
      const fieldEntry = index.fieldById.get(dataRef.fieldId);
      const object = index.objectById.get(dataRef.objectId)?.value;
      const lineageBindings = records(object?.lineageBindings);
      const roleValid = (
        dataRef.semanticRole === "TARGET_IDENTITY"
        && fieldEntry?.value?.idempotencyRole === "OBJECT_ID"
      ) || (
        dataRef.semanticRole === "TARGET_VERSION"
        && fieldEntry?.value?.idempotencyRole === "OBJECT_VERSION"
        && dataRef.fieldId === dataRef.version
      ) || (
        dataRef.semanticRole === "TARGET_LINEAGE"
        && lineageBindings.some((binding) => (
          binding?.refFieldId === dataRef.fieldId
          || binding?.versionFieldId === dataRef.fieldId
        ))
      ) || dataRef.semanticRole === "TARGET_PAYLOAD" || (
        dataRef.semanticRole === "TARGET_STATE"
        && fieldEntry?.value?.valueSource?.kind === "SYSTEM"
        && fieldEntry.value.mutability === "SYSTEM_MANAGED"
      );
      if (fieldEntry?.objectId !== dataRef.objectId || !roleValid) return false;
    }
    return expectedTargetObjectIds.every((objectId) => {
      const objectRefs = refsByObjectId.get(objectId) ?? [];
      return objectRefs.filter(({ semanticRole }) => semanticRole === "TARGET_IDENTITY").length
          === 1
        && objectRefs.filter(({ semanticRole }) => semanticRole === "TARGET_VERSION").length
          === 1;
    });
  };
  const sourceRefRoleValid = (dataRef, requiredFanoutFieldId) => {
    const fieldEntry = index.fieldById.get(dataRef?.fieldId);
    if (fieldEntry?.objectId !== dataRef?.objectId) return false;
    if (dataRef.semanticRole === "SOURCE_IDENTITY") {
      return fieldEntry.value?.idempotencyRole === "OBJECT_ID";
    }
    if (dataRef.semanticRole === "SOURCE_VERSION") {
      return fieldEntry.value?.idempotencyRole === "OBJECT_VERSION"
        && dataRef.fieldId === dataRef.version;
    }
    if (dataRef.semanticRole === "SOURCE_FANOUT") {
      return dataRef.fieldId === requiredFanoutFieldId
        && fieldEntry.value?.dataType === "ID"
        && fieldEntry.value?.valueSource?.kind === "OBJECT_REF"
        && fieldEntry.value?.mutability === "IMMUTABLE";
    }
    return dataRef.semanticRole === "SOURCE_PAYLOAD";
  };
  const policyMatches = (flow, expected) => (
    flow?.failureGranularity === expected.failureGranularity
    && hasExactKeys(flow?.retryPolicy, [
      "strategy",
      "maxAttempts",
      "retryableFailureResults",
    ])
    && flow.retryPolicy.strategy === expected.retryStrategy
    && flow.retryPolicy.maxAttempts === 4
    && sameSet(
      list(flow.retryPolicy.retryableFailureResults),
      expected.retryableFailureResults,
    )
    && flow?.compensation?.strategy === expected.compensationStrategy
    && flow?.downstreamInvalidation?.strategy === expected.invalidationStrategy
  );

  for (const flowEntry of index.flows) {
    const flow = flowEntry.value;
    if (flow?.contractProfile === "LEARNING_PATH_AGGREGATION") {
      const participantRoles = [
        "PUBLISHED_RESULT_SOURCE",
        "EVIDENCE_SOURCE",
        "CORRECTION_SOURCE",
        "PLAN_EXECUTION_SOURCE",
        "TEACHER_CONFIRMATION_SOURCE",
        "LEARNING_PATH_DERIVATION",
      ];
      const sourceRoles = participantRoles.slice(0, -1);
      const stepRoles = [
        "APPEND_PUBLISHED_RESULT",
        "APPEND_EVIDENCE",
        "APPEND_CORRECTION",
        "APPEND_PLAN_EXECUTION",
        "APPEND_TEACHER_CONFIRMATION",
        "CREATE_INTERPRETATION_CANDIDATE",
      ];
      const participants = records(flow.participantRoles);
      const moduleByRole = participantModuleByRole(flow);
      const steps = records(flow.steps);
      const paths = records(flow.executionPaths);
      const sourceRefs = records(flow.sourceDataRefs);
      const derivationModuleId = moduleByRole.get("LEARNING_PATH_DERIVATION");
      const sourceModuleIds = sourceRoles.map((role) => moduleByRole.get(role));
      let valid = sameOrder(roleSequence(participants), participantRoles)
        && sameOrder(participants.map(({ moduleId }) => moduleId), list(flow.moduleIds))
        && sameOrder(list(flow.sourceOnlyModuleIds), sourceModuleIds)
        && sameOrder(steps.map(({ semanticRole }) => semanticRole), stepRoles)
        && sameOrder(paths.map(({ semanticRole }) => semanticRole), sourceRoles)
        && steps.length === stepRoles.length
        && paths.length === sourceRoles.length;

      let timelineObjectId;
      for (let position = 0; position < sourceRoles.length; position += 1) {
        const sourceRole = sourceRoles[position];
        const step = steps[position];
        const actionEntry = actionForStep(step);
        const action = actionEntry?.value;
        const path = paths.find(({ semanticRole }) => semanticRole === sourceRole);
        const bindings = records(path?.sourceBindings);
        const binding = bindings[0];
        const sourceObjectEntry = index.objectById.get(binding?.sourceObjectId);
        const targetObject = index.objectById.get(action?.targetObjectId)?.value;
        const targetLineage = records(targetObject?.lineageBindings);
        const objectSourceRefs = sourceRefs.filter(({ objectId }) => (
          objectId === binding?.sourceObjectId
        ));
        const sourceRefByRole = new Map(objectSourceRefs.map((dataRef) => [
          dataRef.semanticRole,
          dataRef,
        ]));
        const identityRef = sourceRefByRole.get("SOURCE_IDENTITY");
        const versionRef = sourceRefByRole.get("SOURCE_VERSION");
        const fanoutRef = sourceRefByRole.get("SOURCE_FANOUT");
        if (position === 0) timelineObjectId = action?.targetObjectId;
        valid = valid
          && actionEntry?.moduleId === derivationModuleId
          && action?.operationKind === "CREATE"
          && action?.writes === true
          && action?.targetObjectId === timelineObjectId
          && path?.route?.kind === "ACTION_CHOICE"
          && path.route.consumerStepOrder === step?.order
          && list(path?.stepOrders).includes(step?.order)
          && bindings.length === 1
          && sourceObjectEntry?.moduleId === moduleByRole.get(sourceRole)
          && index.fieldById.get(binding?.sourceIdentityFieldId)?.objectId
            === binding?.sourceObjectId
          && index.fieldById.get(binding?.sourceVersionFieldId)?.objectId
            === binding?.sourceObjectId
          && list(action?.outputFieldIds).includes(binding?.targetRefFieldId)
          && list(action?.outputFieldIds).includes(binding?.targetVersionFieldId)
          && targetLineage.some((lineage) => (
            lineage?.refFieldId === binding?.targetRefFieldId
            && lineage?.versionFieldId === binding?.targetVersionFieldId
            && lineage?.targetObjectId === binding?.sourceObjectId
            && lineage?.targetVersionFieldId === binding?.sourceVersionFieldId
          ))
          && objectSourceRefs.length === 3
          && identityRef?.fieldId === binding?.sourceIdentityFieldId
          && versionRef?.fieldId === binding?.sourceVersionFieldId
          && sourceRefRoleValid(fanoutRef, path?.idempotencyKeyParts?.fanoutFieldId)
          && sourceRefRoleValid(identityRef)
          && sourceRefRoleValid(versionRef)
          && sameOrder(
            list(path?.idempotencyKeyParts?.identityFieldIds),
            [binding?.sourceIdentityFieldId],
          )
          && sameOrder(
            list(path?.idempotencyKeyParts?.versionFieldIds),
            [binding?.sourceVersionFieldId],
          );
      }

      const interpretationActionEntry = actionForStep(steps.at(-1));
      const interpretationAction = interpretationActionEntry?.value;
      const evidencePath = paths.find(({ semanticRole }) => semanticRole === "EVIDENCE_SOURCE");
      const writeTargetObjectIds = [...new Set(steps.map((step) => (
        actionForStep(step)?.value?.targetObjectId
      )).filter(isValidId))];
      valid = valid
        && interpretationActionEntry?.moduleId === derivationModuleId
        && interpretationAction?.operationKind === "CREATE"
        && interpretationAction?.writes === true
        && interpretationAction?.targetObjectId !== timelineObjectId
        && sameOrder(
          list(flow?.idempotencyKeyParts?.identityFieldIds),
          list(evidencePath?.idempotencyKeyParts?.identityFieldIds),
        )
        && sameOrder(
          list(flow?.idempotencyKeyParts?.versionFieldIds),
          list(evidencePath?.idempotencyKeyParts?.versionFieldIds),
        )
        && flow?.idempotencyKeyParts?.fanoutFieldId
          === evidencePath?.idempotencyKeyParts?.fanoutFieldId
        && refsHaveTargetSemantics(flow, writeTargetObjectIds)
        && policyMatches(flow, {
          failureGranularity: "STUDENT_SOURCE_FACT_VERSION",
          retryStrategy: "REFRESH_SELECTED_SOURCE_VERSION_AND_RETRY_FAILED_PATH_OBJECTS",
          retryableFailureResults: ["SOURCE_VERSION_STALE", "VERSION_CONFLICT"],
          compensationStrategy: "KEEP_ACCEPTED_SOURCE_FACT_AND_RETRY_ONLY_FAILED_DERIVED_OBJECTS",
          invalidationStrategy: "SUPERSEDE_OR_MARK_STALE_BY_SOURCE_VERSION",
        });
      if (!valid) {
        errors.push(
          `INVALID_FLOW_PROFILE ${formatValidationValue(flow?.id)} violates the LEARNING_PATH_AGGREGATION semantic role contract`,
        );
      }
    }

    if (flow?.contractProfile === "REPORT_MATERIALIZATION") {
      const participantRoles = [
        "STUDENT_EXECUTION_SOURCE",
        "PLAN_COORDINATION_SOURCE",
        "REPORT_PIPELINE",
        "NOTIFICATION_SINK",
      ];
      const stepRoles = [
        "READ_STUDENT_EXECUTION",
        "READ_PLAN_COORDINATION",
        "CREATE_AD_HOC_RUN",
        "CREATE_PERIODIC_RUN",
        "START_RUN",
        "COMPLETE_RUN",
        "MATERIALIZE_SNAPSHOT",
        "CREATE_DELIVERY",
        "CREATE_NOTIFICATION",
      ];
      const pathRoles = ["AD_HOC_RUN", "PERIODIC_RUN"];
      const participants = records(flow.participantRoles);
      const moduleByRole = participantModuleByRole(flow);
      const steps = records(flow.steps);
      const stepByRole = new Map(steps.map((step) => [step.semanticRole, step]));
      const paths = records(flow.executionPaths);
      const pathByRole = new Map(paths.map((path) => [path.semanticRole, path]));
      const actionByRole = new Map(steps.map((step) => [
        step.semanticRole,
        actionForStep(step),
      ]));
      const reportModuleId = moduleByRole.get("REPORT_PIPELINE");
      const notificationModuleId = moduleByRole.get("NOTIFICATION_SINK");
      const adHocPath = pathByRole.get("AD_HOC_RUN");
      const periodicPath = pathByRole.get("PERIODIC_RUN");
      const adHocRun = actionByRole.get("CREATE_AD_HOC_RUN")?.value;
      const periodicRun = actionByRole.get("CREATE_PERIODIC_RUN")?.value;
      const runObjectId = adHocRun?.targetObjectId;
      let valid = sameOrder(roleSequence(participants), participantRoles)
        && sameOrder(participants.map(({ moduleId }) => moduleId), list(flow.moduleIds))
        && sameOrder(steps.map(({ semanticRole }) => semanticRole), stepRoles)
        && sameOrder(paths.map(({ semanticRole }) => semanticRole), pathRoles)
        && !Object.hasOwn(flow, "sourceOnlyModuleIds")
        && actionByRole.get("READ_STUDENT_EXECUTION")?.moduleId
          === moduleByRole.get("STUDENT_EXECUTION_SOURCE")
        && actionByRole.get("READ_PLAN_COORDINATION")?.moduleId
          === moduleByRole.get("PLAN_COORDINATION_SOURCE")
        && ["READ_STUDENT_EXECUTION", "READ_PLAN_COORDINATION"].every((role) => {
          const action = actionByRole.get(role)?.value;
          return action?.operationKind === "READ" && action?.writes === false;
        })
        && ["CREATE_AD_HOC_RUN", "CREATE_PERIODIC_RUN"].every((role) => {
          const actionEntry = actionByRole.get(role);
          return actionEntry?.moduleId === reportModuleId
            && actionEntry.value?.operationKind === "CREATE"
            && actionEntry.value?.writes === true
            && actionEntry.value?.targetObjectId === runObjectId;
        });

      const pathValid = (path, runAction, expectedBindingCount) => {
        const routeStep = steps.find(({ order }) => order === path?.route?.consumerStepOrder);
        const bindings = records(path?.sourceBindings);
        const bindingIdentityIds = bindings.map(({ sourceIdentityFieldId }) => (
          sourceIdentityFieldId
        ));
        const bindingVersionIds = bindings.map(({ sourceVersionFieldId }) => (
          sourceVersionFieldId
        ));
        const extraIdentityIds = bindingIdentityIds.filter((fieldId) => (
          !list(flow?.idempotencyKeyParts?.identityFieldIds).includes(fieldId)
        ));
        const extraVersionIds = bindingVersionIds.filter((fieldId) => (
          !list(flow?.idempotencyKeyParts?.versionFieldIds).includes(fieldId)
        ));
        return routeStep?.actionId === runAction?.id
          && list(path?.stepOrders).map((order) => (
            steps.find((step) => step.order === order)?.semanticRole
          )).join("|") === [
            "READ_STUDENT_EXECUTION",
            "READ_PLAN_COORDINATION",
            path?.semanticRole === "AD_HOC_RUN" ? "CREATE_AD_HOC_RUN" : "CREATE_PERIODIC_RUN",
            "START_RUN",
            "COMPLETE_RUN",
            "MATERIALIZE_SNAPSHOT",
            "CREATE_DELIVERY",
            "CREATE_NOTIFICATION",
          ].join("|")
          && bindings.length === expectedBindingCount
          && bindings.every((binding) => (
            index.objectById.get(binding?.sourceObjectId)?.moduleId === reportModuleId
            && index.fieldById.get(binding?.sourceIdentityFieldId)?.objectId
              === binding.sourceObjectId
            && index.fieldById.get(binding?.sourceVersionFieldId)?.objectId
              === binding.sourceObjectId
            && index.fieldById.get(binding?.targetRefFieldId)?.objectId === runObjectId
            && index.fieldById.get(binding?.targetVersionFieldId)?.objectId === runObjectId
            && list(runAction?.inputFieldIds).includes(binding.targetRefFieldId)
            && list(runAction?.inputFieldIds).includes(binding.targetVersionFieldId)
            && [binding.targetRefFieldId, binding.targetVersionFieldId]
              .every((fieldId) => {
                const required = index.fieldById.get(fieldId)?.value?.required;
                const persistsForAction = isRecord(required)
                  && list(required.whenActionIds).includes(runAction?.id);
                return list(runAction?.outputFieldIds).includes(fieldId) === persistsForAction;
              })
          ))
          && sameSet(
            list(path?.idempotencyKeyParts?.identityFieldIds),
            [...list(flow?.idempotencyKeyParts?.identityFieldIds), ...extraIdentityIds],
          )
          && sameSet(
            list(path?.idempotencyKeyParts?.versionFieldIds),
            [...list(flow?.idempotencyKeyParts?.versionFieldIds), ...extraVersionIds],
          )
          && path?.idempotencyKeyParts?.fanoutFieldId
            === flow?.idempotencyKeyParts?.fanoutFieldId;
      };
      valid = valid && pathValid(adHocPath, adHocRun, 1)
        && pathValid(periodicPath, periodicRun, 2);

      const startRun = actionByRole.get("START_RUN")?.value;
      const completeRun = actionByRole.get("COMPLETE_RUN")?.value;
      const snapshotAction = actionByRole.get("MATERIALIZE_SNAPSHOT")?.value;
      const deliveryAction = actionByRole.get("CREATE_DELIVERY")?.value;
      const notificationAction = actionByRole.get("CREATE_NOTIFICATION")?.value;
      const snapshotObject = index.objectById.get(snapshotAction?.targetObjectId)?.value;
      const deliveryObject = index.objectById.get(deliveryAction?.targetObjectId)?.value;
      const notificationObject = index.objectById.get(notificationAction?.targetObjectId)?.value;
      valid = valid
        && [startRun, completeRun].every((action) => (
          action?.operationKind === "UPDATE"
          && action?.writes === true
          && action?.targetObjectId === runObjectId
        ))
        && startRun?.transition?.from === "QUEUED"
        && startRun?.transition?.to === "RUNNING"
        && completeRun?.transition?.from === "RUNNING"
        && completeRun?.transition?.to === "SUCCEEDED"
        && actionByRole.get("MATERIALIZE_SNAPSHOT")?.moduleId === reportModuleId
        && snapshotAction?.operationKind === "CREATE"
        && snapshotAction?.targetObjectId !== runObjectId
        && records(snapshotObject?.lineageBindings).some(({ targetObjectId }) => (
          targetObjectId === runObjectId
        ))
        && actionByRole.get("CREATE_DELIVERY")?.moduleId === reportModuleId
        && deliveryAction?.operationKind === "CREATE"
        && records(deliveryObject?.lineageBindings).some(({ targetObjectId }) => (
          targetObjectId === snapshotAction?.targetObjectId
        ))
        && deliveryObject?.channelPolicy?.mode === "PHASE_ONE_CLOSED"
        && actionByRole.get("CREATE_NOTIFICATION")?.moduleId === notificationModuleId
        && notificationAction?.operationKind === "CREATE"
        && notificationObject?.channelPolicy?.mode === "PHASE_ONE_CLOSED";

      const sourceRefs = records(flow.sourceDataRefs);
      const sourceRefByFieldId = new Map(sourceRefs.map((dataRef) => [dataRef.fieldId, dataRef]));
      const fanoutRef = sourceRefs.find(({ semanticRole }) => semanticRole === "SOURCE_FANOUT");
      const sourceModules = new Set(sourceRefs.map(({ objectId }) => (
        index.objectById.get(objectId)?.moduleId
      )));
      valid = valid
        && sourceRefs.every((dataRef) => sourceRefRoleValid(
          dataRef,
          flow?.idempotencyKeyParts?.fanoutFieldId,
        ))
        && sourceRefs.filter(({ semanticRole }) => semanticRole === "SOURCE_FANOUT").length === 1
        && fanoutRef?.fieldId === flow?.idempotencyKeyParts?.fanoutFieldId
        && sameSet(
          [...sourceModules],
          [
            moduleByRole.get("STUDENT_EXECUTION_SOURCE"),
            moduleByRole.get("PLAN_COORDINATION_SOURCE"),
            reportModuleId,
          ],
        )
        && [adHocPath, periodicPath].every((path) => records(path?.sourceBindings)
          .every((binding) => (
            sourceRefByFieldId.get(binding?.sourceIdentityFieldId)?.semanticRole
              === "SOURCE_IDENTITY"
            && sourceRefByFieldId.get(binding?.sourceVersionFieldId)?.semanticRole
              === "SOURCE_VERSION"
          )))
        && list(flow?.idempotencyKeyParts?.identityFieldIds).every((fieldId) => (
          sourceRefByFieldId.get(fieldId)?.semanticRole === "SOURCE_IDENTITY"
        ))
        && list(flow?.idempotencyKeyParts?.versionFieldIds).every((fieldId) => (
          sourceRefByFieldId.get(fieldId)?.semanticRole === "SOURCE_VERSION"
        ));
      const writeTargetObjectIds = [...new Set(stepRoles.slice(2).map((role) => (
        actionByRole.get(role)?.value?.targetObjectId
      )).filter(isValidId))];
      valid = valid
        && refsHaveTargetSemantics(flow, writeTargetObjectIds)
        && policyMatches(flow, {
          failureGranularity: "REPORT_RUN_SNAPSHOT_DELIVERY_AND_NOTIFICATION_OBJECT",
          retryStrategy: "RECHECK_PERMISSION_REFRESH_SOURCE_VERSIONS_AND_RETRY_FAILED_OUTPUTS",
          retryableFailureResults: [
            "SOURCE_VERSION_STALE",
            "DELIVERY_FAILED",
            "VERSION_CONFLICT",
          ],
          compensationStrategy: "KEEP_SOURCE_EXECUTION_RUN_AND_SNAPSHOT_WHILE_RETRYING_DELIVERY_ONLY",
          invalidationStrategy: "CREATE_A_NEW_RUN_FOR_NEW_SOURCE_VERSIONS",
        });
      if (!valid) {
        errors.push(
          `INVALID_FLOW_PROFILE ${formatValidationValue(flow?.id)} violates the REPORT_MATERIALIZATION semantic role contract`,
        );
      }
    }
  }
  return errors;
}

function aiTaskErrors(index) {
  const errors = [];
  const dutyRoleById = new Map(index.duties.map(({ value }) => [value?.id, value?.roleId]));
  const draftPurposeProfiles = records(
    index.moduleById.get("AIX-001")?.value?.draftPurposeProfiles,
  );
  const draftTasks = index.aiTasks
    .filter(({ value }) => value?.taskType === "DRAFT")
    .map(({ value }) => value);
  const draftProfileTaskIds = draftPurposeProfiles.map(({ taskId }) => taskId);
  if (
    draftPurposeProfiles.length !== draftTasks.length
    || new Set(draftProfileTaskIds).size !== draftProfileTaskIds.length
    || draftTasks.some((task) => !draftProfileTaskIds.includes(task.id))
    || draftPurposeProfiles.some((profile) => (
      !draftTasks.some((task) => task.id === profile.taskId)
    ))
  ) {
    errors.push(
      "INVALID_AI_DRAFT_PURPOSE AIX-001 must declare exactly one independent profile for every DRAFT task",
    );
  }
  const permissionMatchesUserSubject = (permission, subject) => {
    if (permission.actorRef === "CURRENT_ACTOR") return true;
    if (permission.actorRef === "SYSTEM" || permission.actorRef === "AI") return false;
    if (subject.roleRef) {
      return permission.roleRef === subject.roleRef;
    }
    if (subject.dutyRef) {
      return permission.dutyRef === subject.dutyRef
        || permission.roleRef === dutyRoleById.get(subject.dutyRef);
    }
    return false;
  };
  const permissionScopesOverlap = (left, right) => {
    if (!isRecord(left?.scope) || !isRecord(right?.scope)) return true;
    if (
      left.scope.subjectFieldId === right.scope.subjectFieldId
      && new Set([left.scope.kind, right.scope.kind]).size === 2
      && [left.scope.kind, right.scope.kind].every((kind) => (
        ["OWN_RECORD", "OTHER_RECORD"].includes(kind)
      ))
    ) return false;
    return true;
  };
  const subjectIsAuthorized = (permissions, subject) => {
    const matchingAllows = permissions.filter((permission) => (
      permission?.effect === "ALLOW"
      && permissionMatchesUserSubject(permission, subject)
    ));
    return matchingAllows.length > 0
      && !permissions.some((permission) => (
      permission?.effect === "DENY"
      && permissionMatchesUserSubject(permission, subject)
      && matchingAllows.some((allow) => permissionScopesOverlap(allow, permission))
      ));
  };
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
      task?.capability !== AI_TASK_CAPABILITIES.get(task?.taskType)
      || task?.capability !== targetAction?.capability
    ) {
      errors.push(
        `INVALID_AI_TASK_CAPABILITY ${formatValidationValue(task?.id)} must match its task type and target Action capability`,
      );
    }

    if (targetActionEntry) {
      const permissions = records(targetAction?.permissions);
      const audiences = [
        ...list(task?.roleRefs).map((roleRef) => ({ roleRef })),
        ...list(task?.dutyRefs).map((dutyRef) => ({ dutyRef })),
      ];
      if (
        audiences.length === 0
        || audiences.some((subject) => (
          !subjectIsAuthorized(permissions, subject)
        ))
      ) {
        errors.push(
          `INVALID_AI_ACTOR_AUTHORIZATION ${formatValidationValue(task?.id)} audiences must be allowed by the target Action`,
        );
      }
      if (
        task?.writes === true
        && !subjectIsAuthorized(
          permissions,
          task?.confirmer?.mode === "DUTY"
            ? { dutyRef: task.confirmer.dutyRef }
            : { roleRef: task?.confirmer?.roleRef },
        )
      ) {
        errors.push(
          `INVALID_AI_CONFIRMER_AUTHORIZATION ${formatValidationValue(task?.id)} confirmer must be allowed by the target Action`,
        );
      }
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
      const draftPurpose = task?.draftPurpose;
      const targetDraftPurpose = targetAction?.draftPurpose;
      const targetObject = index.objectById.get(targetAction?.targetObjectId)?.value;
      const targetLifecycle = index.lifecyclePolicyById
        .get(targetObject?.lifecyclePolicyId)?.value;
      const purposeProfiles = draftPurposeProfiles
        .filter(({ taskId }) => taskId === task?.id);
      const purposeProfile = purposeProfiles[0];
      const successStates = index.scenarios
        .filter(({ value }) => (
          value?.actionId === targetAction?.id
          && value?.kind === "SUCCESS"
          && value?.then?.expectedState?.mode === "STATE"
        ))
        .map(({ value }) => value.then.expectedState.value);
      const previewActionEntry = index.actionById.get(draftPolicy?.previewActionId);
      const previewObjectEntry = index.objectById.get(draftPolicy?.previewObjectId);
      const targetIsTemporaryAixPreview = targetActionEntry?.moduleId === "AIX-001"
        && targetAction?.targetObjectId === "AIX-OBJ-TASK-PREVIEW"
        && targetAction?.operationKind === "CREATE"
        && draftPolicy?.previewActionId === task?.actionId;
      const targetUsesSeparateAixPreview = targetActionEntry?.moduleId !== "AIX-001"
        && draftPolicy?.previewActionId === "AIX-ACT-PREPARE-TASK-PREVIEW";
      const draftPolicyValid = (targetIsTemporaryAixPreview || targetUsesSeparateAixPreview)
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
      const purposeKeys = [
        "contentKind",
        "effectBoundary",
        "targetLifecyclePolicyId",
        "targetStateId",
      ];
      const draftPurposeValid = hasExactKeys(draftPurpose, purposeKeys)
        && hasExactKeys(targetDraftPurpose, purposeKeys)
        && purposeProfiles.length === 1
        && purposeKeys.every((key) => draftPurpose[key] === targetDraftPurpose[key])
        && purposeProfile?.actionId === task?.actionId
        && purposeProfile?.targetObjectId === targetAction?.targetObjectId
        && purposeKeys.every((key) => draftPurpose[key] === purposeProfile?.[key])
        && targetAction?.operationKind === "CREATE"
        && targetObject?.lifecyclePolicyId === draftPurpose?.targetLifecyclePolicyId
        && successStates.length > 0
        && successStates.every((state) => state === draftPurpose?.targetStateId)
        && (
          (
            draftPurpose?.effectBoundary === "BUSINESS_DRAFT_ONLY"
            && targetLifecycle?.scope === "VERSIONED_TEACHING_FACTS"
            && draftPurpose?.targetStateId === "DRAFT"
          )
          || (
            draftPurpose?.effectBoundary === "TEMPORARY_PREVIEW_ONLY"
            && targetLifecycle?.scope === "TEMPORARY_AI_PREVIEWS"
            && draftPolicy?.previewActionId === task?.actionId
          )
        );
      if (!draftPurposeValid) {
        errors.push(
          `INVALID_AI_DRAFT_PURPOSE ${formatValidationValue(task?.id)} must bind its content purpose to a CREATE Action with the declared lifecycle and effect boundary`,
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
    const registeredConfirmer = task?.confirmerRef === (
      task?.confirmer?.mode === "DUTY"
        ? task.confirmer.dutyRef
        : task?.confirmer?.mode === "ROLE"
          ? task.confirmer.roleRef
          : undefined
    ) && (
      (task?.confirmer?.mode === "DUTY" && index.dutyIds.has(task.confirmer.dutyRef))
      || (task?.confirmer?.mode === "ROLE" && index.roleIds.has(task.confirmer.roleRef))
    );
    const previewFieldIds = new Set(list(task?.previewFieldIds));
    const previewComplete = list(targetAction?.inputFieldIds)
      .every((fieldId) => previewFieldIds.has(fieldId));
    if (previewFieldIds.size === 0 || !previewComplete || !registeredConfirmer) {
      errors.push(
        `AI_WRITE_WITHOUT_CONFIRMATION ${formatValidationValue(task?.id)} requires preview fields and an authorized confirmer`,
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
  const delivery = objectById.get("RPT-OBJ-DELIVERY");
  const lifecycleValid = setEquals(
    stateIds(subscription),
    new Set(["ACTIVE", "PAUSED", "CANCELLED"]),
  ) && setEquals(
    stateIds(run),
    new Set(["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "BLOCKED_PERMISSION"]),
  ) && setEquals(
    stateIds(delivery),
    new Set(["PENDING", "DELIVERED", "FAILED"]),
  ) && run?.stateReachability?.mode === "ACTION_GRAPH"
    && delivery?.stateReachability?.mode === "ACTION_GRAPH"
    && hasExactKeys(reportModule.lifecycleBoundaries, [
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
    "permissionFailureActionId",
    "sourceVersionCapture",
  ])
    && policy.permissionCheck === "RECHECK_EACH_RUN"
    && policy.dataCutoff === "RESOLVE_AT_RUN_START"
    && policy.permissionFailureState === "BLOCKED_PERMISSION"
    && policy.permissionFailureActionId === "RPT-ACT-BLOCK-RUN-PERMISSION"
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

  const flow = index.flows.find(({ value }) => value?.id === "DF-013")?.value;
  const stepByOrder = new Map(records(flow?.steps).map((step) => [step.order, step]));
  const actionById = new Map(records(reportModule.actions).map((action) => [action.id, action]));
  const pathById = new Map(records(flow?.executionPaths).map((path) => [path.id, path]));
  const adHocPath = pathById.get("AD_HOC");
  const periodicPath = pathById.get("PERIODIC");
  const bindingSignature = (binding) => [
    binding?.sourceObjectId,
    binding?.sourceIdentityFieldId,
    binding?.sourceVersionFieldId,
    binding?.consumerStepOrder,
    binding?.targetRefFieldId,
    binding?.targetVersionFieldId,
    binding?.cardinality,
  ].join("|");
  const expectedDefinitionBinding = (consumerStepOrder) => [
    "RPT-OBJ-DEFINITION",
    "RPT-DEFINITION-F-ID",
    "RPT-DEFINITION-F-VERSION",
    consumerStepOrder,
    "RPT-RUN-F-DEFINITION-REF",
    "RPT-RUN-F-DEFINITION-VERSION",
    "ONE",
  ].join("|");
  const expectedSubscriptionBinding = [
    "RPT-OBJ-SUBSCRIPTION",
    "RPT-SUBSCRIPTION-F-ID",
    "RPT-SUBSCRIPTION-F-VERSION",
    4,
    "RPT-RUN-F-SUBSCRIPTION-REF",
    "RPT-RUN-F-SUBSCRIPTION-VERSION",
    "ONE",
  ].join("|");
  const pathKeyValid = (path, expectedIdentityIds, expectedVersionIds) => (
    setEquals(
      new Set(list(path?.idempotencyKeyParts?.identityFieldIds)),
      new Set(expectedIdentityIds),
    )
    && setEquals(
      new Set(list(path?.idempotencyKeyParts?.versionFieldIds)),
      new Set(expectedVersionIds),
    )
    && path?.idempotencyKeyParts?.fanoutFieldId === "APP-TODO-F-STUDENT-REF"
  );
  const adHocRun = actionById.get("RPT-ACT-CREATE-AD-HOC-RUN");
  const periodicRun = actionById.get("RPT-ACT-CREATE-RUN");
  const reportExecutionPathValid = flow?.routingPolicy === "ACTION_CHOICE_REQUIRED"
    && pathById.size === 2
    && stepByOrder.get(3)?.actionId === "RPT-ACT-CREATE-AD-HOC-RUN"
    && stepByOrder.get(4)?.actionId === "RPT-ACT-CREATE-RUN"
    && adHocPath?.route?.kind === "ACTION_CHOICE"
    && adHocPath.route.consumerStepOrder === 3
    && periodicPath?.route?.kind === "ACTION_CHOICE"
    && periodicPath.route.consumerStepOrder === 4
    && setEquals(
      new Set(records(adHocPath?.sourceBindings).map(bindingSignature)),
      new Set([expectedDefinitionBinding(3)]),
    )
    && setEquals(
      new Set(records(periodicPath?.sourceBindings).map(bindingSignature)),
      new Set([expectedDefinitionBinding(4), expectedSubscriptionBinding]),
    )
    && setEquals(
      new Set(list(adHocRun?.inputFieldIds)),
      new Set(["RPT-RUN-F-DEFINITION-REF", "RPT-RUN-F-DEFINITION-VERSION"]),
    )
    && setEquals(
      new Set(list(periodicRun?.inputFieldIds)),
      new Set([
        "RPT-RUN-F-DEFINITION-REF",
        "RPT-RUN-F-DEFINITION-VERSION",
        "RPT-RUN-F-SUBSCRIPTION-REF",
        "RPT-RUN-F-SUBSCRIPTION-VERSION",
      ]),
    )
    && list(periodicRun?.outputFieldIds).includes("RPT-RUN-F-SUBSCRIPTION-REF")
    && list(periodicRun?.outputFieldIds).includes("RPT-RUN-F-SUBSCRIPTION-VERSION")
    && pathKeyValid(
      adHocPath,
      ["RPT-DEFINITION-F-ID", "APP-TODO-F-ID", "PLN-PLAN-F-ID"],
      [
        "RPT-DEFINITION-F-VERSION",
        "APP-TODO-F-AGGREGATION-VERSION",
        "PLN-PLAN-F-PLAN-VERSION",
        "PLN-HOMEROOM-F-OUTPUT-VERSION",
      ],
    )
    && pathKeyValid(
      periodicPath,
      [
        "RPT-DEFINITION-F-ID",
        "RPT-SUBSCRIPTION-F-ID",
        "APP-TODO-F-ID",
        "PLN-PLAN-F-ID",
      ],
      [
        "RPT-DEFINITION-F-VERSION",
        "RPT-SUBSCRIPTION-F-VERSION",
        "APP-TODO-F-AGGREGATION-VERSION",
        "PLN-PLAN-F-PLAN-VERSION",
        "PLN-HOMEROOM-F-OUTPUT-VERSION",
      ],
    );

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
  if (!reportExecutionPathValid) {
    errors.push(
      "INVALID_REPORT_EXECUTION_PATH DF-013 must separate ad-hoc definition runs from periodic definition-and-subscription runs with source-version idempotency",
    );
  }
  return errors;
}

function reportScopeErrors(index) {
  const reportModule = index.moduleById.get("RPT-001")?.value;
  if (!reportModule) return [];
  const definition = index.objectById.get("RPT-OBJ-DEFINITION")?.value;
  const scopeField = records(definition?.fields).find(({ id }) => (
    id === "RPT-DEFINITION-F-DATA-SCOPE"
  ));
  const optionSet = index.optionSetById.get("OPT-ENUM-048")?.value;
  const expectedProfiles = [
    {
      code: "SUBJECT_ASSIGNED",
      subjectScope: "ASSIGNED_SUBJECT",
      classScope: "ASSIGNED_CLASSES",
      aggregateOnly: false,
      noStudentDetail: false,
      requiresAuthorizedGrant: false,
    },
    {
      code: "HOMEROOM_ASSIGNED_CLASS_AGGREGATE",
      subjectScope: "ALL_SUBJECTS",
      classScope: "ASSIGNED_HOMEROOM_CLASS",
      aggregateOnly: true,
      noStudentDetail: true,
      requiresAuthorizedGrant: false,
    },
    {
      code: "ACADEMIC_AUTHORIZED_AGGREGATE",
      subjectScope: "AUTHORIZED_SUBJECTS",
      classScope: "AUTHORIZED_CLASSES",
      aggregateOnly: true,
      noStudentDetail: true,
      requiresAuthorizedGrant: true,
    },
  ];
  const expectedActions = [
    ["RPT-ACT-CREATE-AD-HOC-DEFINITION", "SUBJECT_ASSIGNED", "dutyRef", "DUTY-SUBJECT-TEACHER"],
    ["RPT-ACT-CREATE-HOMEROOM-DEFINITION", "HOMEROOM_ASSIGNED_CLASS_AGGREGATE", "dutyRef", "DUTY-HOMEROOM"],
    ["RPT-ACT-CREATE-ACADEMIC-DEFINITION", "ACADEMIC_AUTHORIZED_AGGREGATE", "roleRef", "ROLE-ACADEMIC"],
  ];
  const actionsValid = expectedActions.every(([
    actionId,
    code,
    subjectKey,
    subjectRef,
  ]) => {
    const action = index.actionById.get(actionId)?.value;
    const binding = records(action?.acceptedInputValues)[0];
    const allows = records(action?.permissions).filter(({ effect }) => effect === "ALLOW");
    return action?.targetObjectId === "RPT-OBJ-DEFINITION"
      && action?.capability === "REPORT"
      && records(action?.acceptedInputValues).length === 1
      && hasExactKeys(binding, ["fieldId", "optionSetId", "partitionId", "codes"])
      && binding.fieldId === "RPT-DEFINITION-F-DATA-SCOPE"
      && binding.optionSetId === "OPT-ENUM-048"
      && binding.partitionId === "RPT-DEFINITION-DATA-SCOPE"
      && setEquals(new Set(list(binding.codes)), new Set([code]))
      && allows.length === 1
      && allows[0]?.[subjectKey] === subjectRef
      && records(action?.permissions).some(({ effect, roleRef }) => (
        effect === "DENY" && roleRef === "ROLE-PLATFORM-OPS"
      ));
  });
  const valid = optionSet?.key === "reportDataScope"
    && optionSet?.mode === "STATIC"
    && setEquals(
      new Set(records(optionSet?.values).map(({ code }) => code)),
      new Set(expectedProfiles.map(({ code }) => code)),
    )
    && scopeField?.dataType === "STRING"
    && scopeField?.valueSource?.kind === "OPTION_SET"
    && scopeField.valueSource.optionSetId === "OPT-ENUM-048"
    && JSON.stringify(reportModule.dataScopeProfiles) === JSON.stringify(expectedProfiles)
    && definition?.producerRef === "CURRENT_ACTOR"
    && actionsValid;
  return valid ? [] : [
    "INVALID_REPORT_SCOPE_CONTRACT RPT-001 must execute subject, homeroom aggregate, and authorized academic aggregate scopes through closed profiles and Actions",
  ];
}

function reportSubscriptionOwnershipErrors(index) {
  const subscription = index.objectById.get("RPT-OBJ-SUBSCRIPTION")?.value;
  if (!subscription) return [];
  const creatorFieldId = "RPT-SUBSCRIPTION-F-CREATOR-REF";
  const scopeFieldId = "RPT-SUBSCRIPTION-F-DATA-SCOPE";
  const fieldIds = new Set(records(subscription.fields).map(({ id }) => id));
  const expectedCreateActions = [
    ["RPT-ACT-CREATE-SUBSCRIPTION", "SUBJECT_ASSIGNED", "dutyRef", "DUTY-SUBJECT-TEACHER"],
    ["RPT-ACT-CREATE-HOMEROOM-SUBSCRIPTION", "HOMEROOM_ASSIGNED_CLASS_AGGREGATE", "dutyRef", "DUTY-HOMEROOM"],
    ["RPT-ACT-CREATE-ACADEMIC-SUBSCRIPTION", "ACADEMIC_AUTHORIZED_AGGREGATE", "roleRef", "ROLE-ACADEMIC"],
  ];
  const createActionsValid = expectedCreateActions.every(([
    actionId,
    code,
    subjectKey,
    subjectRef,
  ]) => {
    const action = index.actionById.get(actionId)?.value;
    const binding = records(action?.acceptedInputValues)[0];
    const allows = records(action?.permissions).filter(({ effect }) => effect === "ALLOW");
    return action?.targetObjectId === subscription.id
      && action?.operationKind === "CREATE"
      && action?.capability === "PERIODIC"
      && list(action?.outputFieldIds).includes(creatorFieldId)
      && records(action?.acceptedInputValues).length === 1
      && binding?.fieldId === scopeFieldId
      && binding?.optionSetId === "OPT-ENUM-048"
      && binding?.partitionId === "RPT-SUBSCRIPTION-DATA-SCOPE"
      && setEquals(new Set(list(binding?.codes)), new Set([code]))
      && allows.length === 1
      && allows[0]?.[subjectKey] === subjectRef;
  });
  const managementActionsValid = [
    "RPT-ACT-UPDATE-SUBSCRIPTION",
    "RPT-ACT-PAUSE-SUBSCRIPTION",
    "RPT-ACT-CANCEL-SUBSCRIPTION",
  ].every((actionId) => {
    const action = index.actionById.get(actionId)?.value;
    const permissions = records(action?.permissions);
    return action?.capability === "PERIODIC"
      && permissions.some((permission) => (
        permission.effect === "ALLOW"
        && permission.actorRef === "CURRENT_ACTOR"
        && permission.scope?.kind === "OWN_RECORD"
        && permission.scope.subjectFieldId === creatorFieldId
      ))
      && permissions.some((permission) => (
        permission.effect === "DENY"
        && permission.actorRef === "CURRENT_ACTOR"
        && permission.scope?.kind === "OTHER_RECORD"
        && permission.scope.subjectFieldId === creatorFieldId
      ))
      && permissions.some(({ effect, roleRef }) => (
        effect === "DENY" && roleRef === "ROLE-PLATFORM-OPS"
      ));
  });
  const valid = subscription.producerRef === "CURRENT_ACTOR"
    && fieldIds.has(creatorFieldId)
    && fieldIds.has(scopeFieldId)
    && hasExactKeys(subscription.scopeBinding, [
      "definitionScopeFieldId",
      "subscriptionScopeFieldId",
      "mode",
    ])
    && subscription.scopeBinding.definitionScopeFieldId
      === "RPT-DEFINITION-F-DATA-SCOPE"
    && subscription.scopeBinding.subscriptionScopeFieldId === scopeFieldId
    && subscription.scopeBinding.mode === "MATCH_REQUIRED"
    && createActionsValid
    && managementActionsValid;
  return valid ? [] : [
    "INVALID_REPORT_SUBSCRIPTION_OWNERSHIP RPT-001 subscriptions must retain their creator and deny cross-actor management",
  ];
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
  const expectedSourceGroupSignatures = expectedSourceBindings.map(([kind]) => (
    `${kind}:LPATH-ENTRY-F-${kind}-REF,LPATH-ENTRY-F-${kind}-VERSION`
  ));
  const actualSourceGroupSignatures = records(timeline?.exclusiveSourceGroups)
    .map((group) => `${group.id}:${list(group.fieldIds).join(",")}`);
  const timelineValid = timeline?.crossTerm === true
    && setEquals(
      new Set(actualSourceGroupSignatures),
      new Set(expectedSourceGroupSignatures),
    )
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
  ) && interpretation?.stateReachability?.mode === "ACTION_GRAPH";

  const flow = index.flows.find(({ value }) => value?.id === "DF-011")?.value;
  const pathById = new Map(records(flow?.executionPaths).map((path) => [path.id, path]));
  const expectedPaths = [
    ["PUBLISHED_RESULT", "PUB-OBJ-RESULT", "PUB-RESULT-F-ID", "PUB-RESULT-F-RESULT-VERSION", 1, "PUBLISHED-RESULT"],
    ["EVIDENCE", "INS-OBJ-EVIDENCE", "INS-EVIDENCE-F-ID", "INS-EVIDENCE-F-EVIDENCE-VERSION", 2, "EVIDENCE"],
    ["CORRECTION", "CORR-OBJ-ATTEMPT", "CORR-ATTEMPT-F-ID", "CORR-ATTEMPT-F-CORRECTION-VERSION", 3, "CORRECTION"],
    ["PLAN_EXECUTION", "APP-OBJ-TODO", "APP-TODO-F-ID", "APP-TODO-F-AGGREGATION-VERSION", 4, "PLAN-EXECUTION"],
    ["TEACHER_CONFIRMATION", "GRD-OBJ-DECISION", "GRD-DECISION-F-ID", "GRD-DECISION-F-DECISION-VERSION", 5, "TEACHER-CONFIRMATION"],
  ];
  const sourcePathsValid = flow?.routingPolicy === "ACTION_CHOICE_REQUIRED"
    && setEquals(
      new Set(list(flow?.sourceOnlyModuleIds)),
      new Set(["PUB-001", "INS-001", "CORR-001", "APP-001", "GRD-001"]),
    )
    && pathById.size === expectedPaths.length
    && expectedPaths.every(([
      pathId,
      sourceObjectId,
      sourceIdentityFieldId,
      sourceVersionFieldId,
      consumerStepOrder,
      kind,
    ]) => {
      const path = pathById.get(pathId);
      const bindings = records(path?.sourceBindings);
      const binding = bindings[0];
      return bindings.length === 1
        && path?.route?.kind === "ACTION_CHOICE"
        && path.route.consumerStepOrder === consumerStepOrder
        && binding?.sourceObjectId === sourceObjectId
        && binding?.sourceIdentityFieldId === sourceIdentityFieldId
        && binding?.sourceVersionFieldId === sourceVersionFieldId
        && binding?.consumerStepOrder === consumerStepOrder
        && binding?.targetRefFieldId === `LPATH-ENTRY-F-${kind}-REF`
        && binding?.targetVersionFieldId === `LPATH-ENTRY-F-${kind}-VERSION`
        && binding?.cardinality === "ONE";
    });

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
  if (!sourcePathsValid) {
    errors.push(
      "INVALID_LEARNING_PATH_SOURCE_PATH DF-011 must bind exactly one published result, evidence, correction, plan execution, or teacher confirmation source per path",
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
  const recipientPolicy = notification.recipientPolicy;
  const notificationActionById = new Map(index.actions
    .filter(({ moduleId }) => moduleId === "NOTI-001")
    .map(({ value }) => [value.id, value]));
  const recipientActionsValid = ["NOTI-ACT-MARK-READ", "NOTI-ACT-MARK-HANDLED"]
    .every((actionId) => {
      const permissions = records(notificationActionById.get(actionId)?.permissions);
      return permissions.some((permission) => (
        permission.effect === "ALLOW"
        && permission.actorRef === "CURRENT_ACTOR"
        && permission.scope?.kind === "OWN_RECORD"
        && permission.scope.subjectFieldId === "NOTI-NOTIFICATION-F-RECIPIENT"
      )) && permissions.some((permission) => (
        permission.effect === "DENY"
        && permission.actorRef === "CURRENT_ACTOR"
        && permission.scope?.kind === "OTHER_RECORD"
        && permission.scope.subjectFieldId === "NOTI-NOTIFICATION-F-RECIPIENT"
      )) && permissions.some(({ effect, roleRef }) => (
        effect === "DENY" && roleRef === "ROLE-PLATFORM-OPS"
      ));
    });
  const valid = requiredFieldIds.every((fieldId) => fieldIds.has(fieldId))
    && notification?.stateReachability?.mode === "ACTION_GRAPH"
    && recipientActionsValid
    && hasExactKeys(recipientPolicy, [
      "subjectFieldId",
      "allowedRecipientSubjects",
      "mutationSubject",
      "ownershipMode",
    ])
    && recipientPolicy.subjectFieldId === "NOTI-NOTIFICATION-F-RECIPIENT"
    && setEquals(
      new Set(list(recipientPolicy.allowedRecipientSubjects)),
      new Set([
        "ROLE-STUDENT",
        "DUTY-SUBJECT-TEACHER",
        "DUTY-HOMEROOM",
        "ROLE-ACADEMIC",
      ]),
    )
    && list(recipientPolicy.allowedRecipientSubjects).length === 4
    && recipientPolicy.mutationSubject === "CURRENT_ACTOR"
    && recipientPolicy.ownershipMode === "OWN_RECORD_ONLY"
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

function notificationChannelErrors(index) {
  const errors = [];
  for (const objectEntry of index.objects) {
    const object = objectEntry.value;
    if (!Object.hasOwn(object ?? {}, "channelPolicy")) continue;
    const policy = object.channelPolicy;
    const allowedCodes = list(policy?.allowedCodes);
    const allowedCodeSet = new Set(allowedCodes);
    const field = records(object?.fields).find(({ id }) => id === policy?.fieldId);
    const optionSet = index.optionSetById.get(policy?.optionSetId)?.value;
    const optionValues = records(optionSet?.values);
    const optionCodes = optionValues.map(({ code }) => code);
    const channelValue = optionValues[0];
    const targetActions = index.actions.filter(({ value }) => (
      value?.targetObjectId === object?.id
    ));
    const valid = hasExactKeys(policy, [
      "mode",
      "fieldId",
      "optionSetId",
      "allowedCodes",
    ])
      && policy.mode === "PHASE_ONE_CLOSED"
      && allowedCodes.length > 0
      && allowedCodeSet.size === allowedCodes.length
      && allowedCodes.every(isValidId)
      && field?.valueSource?.kind === "OPTION_SET"
      && field.valueSource.optionSetId === policy.optionSetId
      && optionSet?.mode === "STATIC"
      && optionSet?.key === "notificationChannel"
      && optionValues.length === 1
      && hasExactKeys(channelValue, ["code", "label"])
      && channelValue.code === "IN_PRODUCT"
      && channelValue.label === "站内"
      && allowedCodes.length === 1
      && allowedCodes[0] === "IN_PRODUCT"
      && setEquals(new Set(optionCodes), allowedCodeSet)
      && targetActions.length > 0
      && targetActions.every(({ value }) => allowedCodeSet.has(value?.channel));
    if (!valid) {
      errors.push(
        `INVALID_NOTIFICATION_CHANNEL ${formatValidationValue(object?.id)} must remain closed to its declared phase-one delivery channels`,
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
    ...flowProfileErrors(index),
    ...actionErrors(index),
    ...lifecycleRiskErrors(index),
    ...actionApplicabilityErrors(index),
    ...conditionalRequiredErrors(index),
    ...fieldWriteContractErrors(index),
    ...eventActionRoutingErrors(index),
    ...stateReachabilityErrors(index),
    ...externalSourceProvenanceErrors(index),
    ...ownerErrors(index),
    ...aiTaskErrors(index),
    ...reportErrors(index),
    ...reportScopeErrors(index),
    ...reportSubscriptionOwnershipErrors(index),
    ...learningPathErrors(index),
    ...notificationErrors(index),
    ...notificationChannelErrors(index),
    ...phaseAndTemplateErrors(index),
    ...metricErrors(index),
    ...gradingCapabilityErrors(index),
  ];
}
