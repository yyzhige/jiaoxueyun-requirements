import { buildModelIndex } from "./model-validator.mjs";

const ROLE_ERROR = "INVALID_AI_RESPONSIBILITY_ROLE";
const CONTRACT_ERROR = "INVALID_AI_RESPONSIBILITY_CONTRACT";
const AI_PARTICIPATION_FIELDS = ["producerRef", "confirmerRef"];
const HUMAN_RESPONSIBILITY_FIELDS = ["ownerRef", "stewardRef"];
const CONTRACT_PROPERTIES = ["derivedJudgmentContract", "aiResponsibilityContract"];
const CONTRACT_FIELD_PROPERTIES = [
  "sourceRefFieldId",
  "sourceVersionFieldId",
  "validityFieldId",
  "disputeFieldId",
  "priorRefFieldId",
  "priorVersionFieldId",
  "supersessionReasonFieldId",
  "versionFieldId",
];

function list(value) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function includesAll(values, requiredValues) {
  const available = new Set(list(values));
  return requiredValues.every((value) => available.has(value));
}

function sameCriticalContract(left, right) {
  return [
    ...CONTRACT_FIELD_PROPERTIES,
    "sourceOverwriteAllowed",
    "recomputationCreatesNewVersion",
    "priorVersionRequiredWhenRecomputed",
  ].every((property) => left?.[property] === right?.[property]);
}

function fieldById(object, fieldId) {
  return list(object?.fields).find(({ id }) => id === fieldId);
}

function hasLineageBinding(object, expected) {
  return list(object?.lineageBindings).some((binding) => (
    binding.refFieldId === expected.refFieldId
    && binding.versionFieldId === expected.versionFieldId
    && binding.targetObjectId === expected.targetObjectId
    && binding.targetVersionFieldId === expected.targetVersionFieldId
  ));
}

function hasStatusWrite(action, fieldId, code) {
  return list(action?.statusWrites).some((write) => (
    write.fieldId === fieldId && list(write.codes).includes(code)
  ));
}

function contractError(object, contractProperty, detail) {
  return `${CONTRACT_ERROR} ${object?.id ?? "<unknown>"}.${contractProperty} ${detail}`;
}

function validateDeclaredFields(object, contract, contractProperty) {
  const errors = [];
  const declaredFieldIds = CONTRACT_FIELD_PROPERTIES.map((property) => contract?.[property]);
  for (const [index, fieldId] of declaredFieldIds.entries()) {
    const property = CONTRACT_FIELD_PROPERTIES[index];
    if (!isNonEmptyString(fieldId) || !fieldById(object, fieldId)) {
      errors.push(contractError(
        object,
        contractProperty,
        `must resolve ${property} on the same object`,
      ));
    }
  }
  if (
    declaredFieldIds.every(isNonEmptyString)
    && new Set(declaredFieldIds).size !== declaredFieldIds.length
  ) {
    errors.push(contractError(
      object,
      contractProperty,
      "must use distinct fields for source, validity, dispute, supersession, and version evidence",
    ));
  }
  return errors;
}

function validateSourceBinding(index, object, contract, contractProperty) {
  const errors = [];
  const sourceRef = fieldById(object, contract?.sourceRefFieldId);
  const sourceVersion = fieldById(object, contract?.sourceVersionFieldId);
  const targetObjectId = sourceRef?.valueSource?.targetObjectId;
  const targetVersionFieldId = sourceRef?.versionBinding?.targetVersionFieldId;
  const targetObject = index.objectById.get(targetObjectId)?.value;
  const targetVersion = fieldById(targetObject, targetVersionFieldId);
  const binding = {
    refFieldId: contract?.sourceRefFieldId,
    versionFieldId: contract?.sourceVersionFieldId,
    targetObjectId,
    targetVersionFieldId,
  };
  const valid = sourceRef?.dataType === "ID"
    && sourceRef?.required === true
    && sourceRef?.mutability === "IMMUTABLE"
    && sourceRef?.valueSource?.kind === "OBJECT_REF"
    && isNonEmptyString(targetObjectId)
    && sourceRef?.referenceIntegrity === "VERSION_PINNED"
    && sourceRef?.versionBinding?.versionFieldId === contract?.sourceVersionFieldId
    && isNonEmptyString(targetVersionFieldId)
    && sourceVersion?.dataType === "INTEGER"
    && sourceVersion?.required === true
    && sourceVersion?.mutability === "IMMUTABLE"
    && targetObject
    && targetVersion?.dataType === "INTEGER"
    && hasLineageBinding(object, binding);
  if (!valid) {
    errors.push(contractError(
      object,
      contractProperty,
      "must version-pin one immutable, required source reference and source version through a resolvable lineage binding",
    ));
  }
  return errors;
}

function validateStatusFields(index, object, contract, contractProperty) {
  const errors = [];
  for (const property of ["validityFieldId", "disputeFieldId"]) {
    const field = fieldById(object, contract?.[property]);
    const optionSetId = field?.valueSource?.optionSetId;
    const valid = field?.dataType === "STRING"
      && field?.required === true
      && field?.mutability === "SYSTEM_MANAGED"
      && field?.valueSource?.kind === "OPTION_SET"
      && index.optionSetById.has(optionSetId);
    if (!valid) {
      errors.push(contractError(
        object,
        contractProperty,
        `${property} must be a required system-managed field backed by a registered Option Set`,
      ));
    }
  }
  return errors;
}

function validateSupersessionBinding(index, object, contract, contractProperty) {
  const errors = [];
  const priorRef = fieldById(object, contract?.priorRefFieldId);
  const priorVersion = fieldById(object, contract?.priorVersionFieldId);
  const reason = fieldById(object, contract?.supersessionReasonFieldId);
  const version = fieldById(object, contract?.versionFieldId);
  const binding = {
    refFieldId: contract?.priorRefFieldId,
    versionFieldId: contract?.priorVersionFieldId,
    targetObjectId: object?.id,
    targetVersionFieldId: contract?.versionFieldId,
  };
  const priorBindingValid = priorRef?.dataType === "ID"
    && priorRef?.mutability === "IMMUTABLE"
    && priorRef?.valueSource?.kind === "OBJECT_REF"
    && priorRef?.valueSource?.targetObjectId === object?.id
    && priorRef?.referenceIntegrity === "VERSION_PINNED"
    && priorRef?.versionBinding?.versionFieldId === contract?.priorVersionFieldId
    && priorRef?.versionBinding?.targetVersionFieldId === contract?.versionFieldId
    && priorVersion?.dataType === "INTEGER"
    && priorVersion?.mutability === "IMMUTABLE"
    && hasLineageBinding(object, binding);
  if (!priorBindingValid) {
    errors.push(contractError(
      object,
      contractProperty,
      "must version-pin the prior derived judgment to the same object lineage",
    ));
  }
  if (!reason || !["STRING", "TEXT"].includes(reason.dataType)) {
    errors.push(contractError(
      object,
      contractProperty,
      "must resolve a textual supersession reason field",
    ));
  }
  if (
    version?.dataType !== "INTEGER"
    || version?.required !== true
    || version?.idempotencyRole !== "OBJECT_VERSION"
  ) {
    errors.push(contractError(
      object,
      contractProperty,
      "must resolve one required OBJECT_VERSION field",
    ));
  }
  return errors;
}

function validateInitialization(index, object, contract, contractProperty) {
  const errors = [];
  const initialization = contract?.initialization;
  const action = index.actionById.get(initialization?.actionId)?.value;
  const requiredOutputFieldIds = [
    contract?.sourceRefFieldId,
    contract?.sourceVersionFieldId,
    contract?.validityFieldId,
    contract?.disputeFieldId,
    contract?.versionFieldId,
  ];
  const valid = isRecord(initialization)
    && isNonEmptyString(initialization.actionId)
    && isNonEmptyString(initialization.validityCode)
    && isNonEmptyString(initialization.disputeCode)
    && action?.targetObjectId === object?.id
    && includesAll(action?.outputFieldIds, requiredOutputFieldIds)
    && hasStatusWrite(action, contract?.validityFieldId, initialization.validityCode)
    && hasStatusWrite(action, contract?.disputeFieldId, initialization.disputeCode);
  if (!valid) {
    errors.push(contractError(
      object,
      contractProperty,
      "initialization must bind a real writer action and explicit validity/dispute writes",
    ));
  }
  return errors;
}

function validateRecomputation(index, object, contract, contractProperty) {
  const errors = [];
  const recomputation = contract?.recomputation;
  const actionIds = list(recomputation?.actionIds);
  const requiredOutputFieldIds = [
    contract?.priorRefFieldId,
    contract?.priorVersionFieldId,
    contract?.supersessionReasonFieldId,
    contract?.versionFieldId,
    contract?.validityFieldId,
    contract?.disputeFieldId,
  ];
  if (
    !isRecord(recomputation)
    || actionIds.length === 0
    || new Set(actionIds).size !== actionIds.length
    || !includesAll(recomputation?.requiredOutputFieldIds, requiredOutputFieldIds)
  ) {
    errors.push(contractError(
      object,
      contractProperty,
      "recomputation must declare unique writer actions and every supersession output field",
    ));
    return errors;
  }

  for (const actionId of actionIds) {
    const action = index.actionById.get(actionId)?.value;
    const statusWrite = recomputation?.statusWritesByActionId?.[actionId];
    const valid = action?.targetObjectId === object?.id
      && includesAll(action?.outputFieldIds, requiredOutputFieldIds)
      && isNonEmptyString(statusWrite?.validityCode)
      && isNonEmptyString(statusWrite?.disputeCode)
      && hasStatusWrite(action, contract?.validityFieldId, statusWrite?.validityCode)
      && hasStatusWrite(action, contract?.disputeFieldId, statusWrite?.disputeCode);
    if (!valid) {
      errors.push(contractError(
        object,
        contractProperty,
        `recomputation action ${actionId} must write the complete new-version, prior-version, reason, validity, and dispute evidence`,
      ));
    }
  }
  return errors;
}

function validateContract(index, object, contract, contractProperty) {
  if (!isRecord(contract)) {
    return [contractError(object, contractProperty, "must be an explicit object contract")];
  }
  const errors = [
    ...validateDeclaredFields(object, contract, contractProperty),
    ...validateSourceBinding(index, object, contract, contractProperty),
    ...validateStatusFields(index, object, contract, contractProperty),
    ...validateSupersessionBinding(index, object, contract, contractProperty),
    ...validateInitialization(index, object, contract, contractProperty),
    ...validateRecomputation(index, object, contract, contractProperty),
  ];
  if (
    contract.sourceOverwriteAllowed !== false
    || contract.recomputationCreatesNewVersion !== true
    || contract.priorVersionRequiredWhenRecomputed !== true
  ) {
    errors.push(contractError(
      object,
      contractProperty,
      "must forbid source overwrite and require a linked new version for recomputation",
    ));
  }
  return errors;
}

export function validateAiResponsibilityContracts(model) {
  if (model?.profile !== "ZHIXU_V2") return [];

  const index = buildModelIndex(model);
  const errors = [];
  for (const { value: object } of index.objects) {
    for (const property of HUMAN_RESPONSIBILITY_FIELDS) {
      if (object?.[property] === "AI") {
        errors.push(
          `${ROLE_ERROR} ${object?.id ?? "<unknown>"}.${property} AI cannot own or steward a governed business object`,
        );
      }
    }

    const aiFields = AI_PARTICIPATION_FIELDS.filter((property) => object?.[property] === "AI");
    if (aiFields.length === 0) continue;

    if (object?.dataNature !== "AI_DERIVED") {
      errors.push(
        `${CONTRACT_ERROR} ${object?.id ?? "<unknown>"}.${aiFields.join("+")} requires dataNature=AI_DERIVED`,
      );
    }
    if (object?.originalFactOverwritePolicy !== "FORBIDDEN") {
      errors.push(
        `${CONTRACT_ERROR} ${object?.id ?? "<unknown>"}.${aiFields.join("+")} requires originalFactOverwritePolicy=FORBIDDEN`,
      );
    }

    const declaredContracts = CONTRACT_PROPERTIES
      .filter((property) => Object.hasOwn(object, property))
      .map((property) => ({ property, contract: object[property] }));
    if (declaredContracts.length === 0) {
      errors.push(
        `${CONTRACT_ERROR} ${object?.id ?? "<unknown>"} requires an explicit derivedJudgmentContract or aiResponsibilityContract`,
      );
      continue;
    }
    for (const { property, contract } of declaredContracts) {
      errors.push(...validateContract(index, object, contract, property));
    }
    if (
      declaredContracts.length === 2
      && !sameCriticalContract(declaredContracts[0].contract, declaredContracts[1].contract)
    ) {
      errors.push(
        `${CONTRACT_ERROR} ${object?.id ?? "<unknown>"} declared AI responsibility contracts disagree on critical bindings or overwrite policy`,
      );
    }
  }
  return errors;
}
