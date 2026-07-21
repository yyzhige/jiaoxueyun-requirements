import {
  MODEL_COLLECTIONS,
  PHASE,
  RELEASE_STATUS,
} from "../model.mjs";
import { studentDataClassificationMatchesRegistry } from "../facts/student-data-classification.mjs";
import { STUDENT_DETAIL_ACCESS_EXCEPTION_KIND } from "../facts/student-detail-access-exceptions.mjs";
import {
  PROFESSIONAL_WRITE_BOUNDARY_KIND,
  isProfessionalWriteAuthorizationBoundary,
  isProfessionalWritePolicy,
  matchesRegisteredProfessionalWriteException,
  professionalWritePolicyMatchesRegistry,
} from "../facts/professional-write-authorization.mjs";

const REQUIRED_MODEL_COLLECTIONS = MODEL_COLLECTIONS.map(({ key }) => key);
const BASELINE_V2_MODEL_COLLECTIONS = new Set([
  "phases",
  "productDecisions",
  "baselineChapters",
  "migrationChanges",
  "metricGroups",
  "launchGates",
]);
const MODULE_PHASES = new Set(Object.values(PHASE));
const MODULE_RELEASE_STATUSES = new Set(Object.values(RELEASE_STATUS));
const RELEASE_STATUS_BY_PHASE = new Map([
  [PHASE.FIRST, RELEASE_STATUS.BUILD_READY],
  [PHASE.SECOND, RELEASE_STATUS.PLANNED],
  [PHASE.THIRD, RELEASE_STATUS.PLANNED],
]);

const MAX_TRAVERSAL_DEPTH = 64;
const OPTION_SET_MODES = new Set(["STATIC", "RUNTIME_QUERY"]);
const RUNTIME_QUERY_ID_KINDS = new Set(["OBJECT_ID", "ACTION_ID"]);
const CLIENTS = new Set(["WEB", "APP"]);
const RISKS = new Set(["READ", "LOW", "HIGH"]);
const OPERATION_KINDS = new Set(["READ", "CREATE", "UPDATE"]);
const IDEMPOTENCY_ROLES = new Set([
  "OBJECT_ID",
  "OBJECT_REF",
  "OBJECT_VERSION",
  "FANOUT_SET",
]);
const REFERENCE_INTEGRITIES = new Set(["IDENTITY_ONLY", "VERSION_PINNED"]);
const STATE_GUARD_POLICIES = new Set([
  "NONE",
  "CREATE_REQUIRED",
  "UPDATE_REQUIRED",
  "ALWAYS_REQUIRED",
]);
const READ_MODES = new Set(["AUTHORIZED", "NO_DIRECT_READ", "STUDENT_TIMED_RELEASE"]);
const EXECUTION_MODES = new Set(["USER_TASK", "SYSTEM_EVENT", "FLOW_INTERNAL"]);
const AUDIT_MODES = new Set(["REQUIRED", "NOT_REQUIRED", "ATOMIC_SELF_RECORD"]);
const OBJECT_SEMANTIC_TYPES = new Set(["AUDIT_EVENT_SINK"]);
const SYSTEM_ACTOR_CATEGORIES = new Set(["SYSTEM", "AI", "CURRENT_ACTOR"]);
const SOURCE_DATA_CARDINALITIES = new Set(["ONE", "ZERO_MANY"]);
const FLOW_ROUTING_POLICIES = new Set([
  "NONE",
  "ACTION_CHOICE_REQUIRED",
  "OPTION_VALUE_REQUIRED",
]);
const FLOW_CONTRACT_PROFILES = new Set([
  "GENERIC",
  "LEARNING_PATH_AGGREGATION",
  "REPORT_MATERIALIZATION",
]);
const FLOW_SOURCE_SEMANTIC_ROLES = new Set([
  "SOURCE_IDENTITY",
  "SOURCE_VERSION",
  "SOURCE_FANOUT",
  "SOURCE_PAYLOAD",
]);
const FLOW_TARGET_SEMANTIC_ROLES = new Set([
  "TARGET_IDENTITY",
  "TARGET_VERSION",
  "TARGET_LINEAGE",
  "TARGET_PAYLOAD",
  "TARGET_STATE",
]);
const AI_TASK_TYPES = new Set([
  "QUERY",
  "ANALYSIS",
  "DRAFT",
  "AD_HOC_REPORT",
  "PERIODIC",
  "REMINDER",
  "CONTROLLED_ACTION",
]);
const AI_CAPABILITIES = new Set([
  "QUERY",
  "ANALYSIS",
  "DRAFT",
  "REPORT",
  "PERIODIC",
  "REMINDER",
  "CONTROLLED",
]);
const DRAFT_CONTENT_KINDS = new Set([
  "ASSIGNMENT",
  "FEEDBACK",
  "IMPROVEMENT_PLAN",
]);
const DRAFT_EFFECT_BOUNDARIES = new Set([
  "BUSINESS_DRAFT_ONLY",
  "TEMPORARY_PREVIEW_ONLY",
]);
const JSON_SCHEMA_TYPES = new Set([
  "string",
  "number",
  "integer",
  "boolean",
  "object",
  "array",
]);
const PERMISSION_ALLOWED_KEYS = new Set([
  "effect",
  "condition",
  "actorRef",
  "roleRef",
  "dutyRef",
  "scope",
]);
const SCENARIO_KINDS = new Set(["SUCCESS", "FAILURE", "BOUNDARY"]);
const DATA_TYPES = new Set([
  "STRING",
  "TEXT",
  "BOOLEAN",
  "INTEGER",
  "DECIMAL",
  "DATE",
  "DATETIME",
  "DURATION",
  "JSON",
  "STRING_ARRAY",
  "ID",
  "FILE_REFERENCE",
  "IMAGE_REFERENCE",
]);
const MUTABILITIES = new Set([
  "EDITABLE",
  "READ_ONLY",
  "IMMUTABLE",
  "SYSTEM_MANAGED",
]);
const DATA_EXPOSURE_VISIBILITIES = new Set([
  "AUTHORIZED_SCOPE",
  "OWNER_ONLY",
  "ASSIGNED_SCOPE",
  "SCHOOL_SCOPE",
  "PUBLIC",
  "INTERNAL",
]);
const RELATIONSHIP_TYPES = new Set([
  "ACTIVATES",
  "APPEARS_IN",
  "ASSIGNED_TO",
  "AUTHORIZED_BY",
  "BELONGS_TO",
  "CONFIGURES",
  "CONTAINS",
  "DERIVED_FROM",
  "EXTENDS_ROLE",
  "IMPLEMENTS",
  "INVALIDATES",
  "MAPS_TO",
  "OWNS",
  "PART_OF",
  "REFERENCES",
  "REQUIRES",
  "RESULT_OF",
  "REVIEWS",
  "TEMPORARILY_EXTENDS",
  "USES_SUBJECT",
  "VERSION_MEMBER",
]);
const CARDINALITIES = new Set([
  "ONE_TO_ONE",
  "ONE_TO_MANY",
  "MANY_TO_ONE",
  "MANY_TO_MANY",
]);
const OWNERSHIP_SCOPES = new Set([
  "SAME_SCHOOL",
  "SAME_TERM",
  "SAME_CONTEXT",
  "SAME_SUBJECT",
  "SAME_STUDENT",
  "CROSS_MODULE_REFERENCE",
]);
const EXTENSION_ALLOWED_KEYS = new Set([
  "id",
  "label",
  "phase",
  "status",
  "dependencies",
  "entryCriteria",
  "excludedFirstStageBehavior",
]);
const EXTENSION_EXECUTABLE_KEYS = new Set([
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
]);

export function formatValidationValue(value) {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (["number", "boolean", "bigint"].includes(typeof value)) {
    return String(value);
  }
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "[array]";
  if (typeof value === "object") return "[object]";
  return `[${typeof value}]`;
}

function childPath(path, property) {
  if (/^(?:0|[1-9]\d*)$/.test(property)) return `${path}[${property}]`;
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(property)) return `${path}.${property}`;
  return `${path}[${JSON.stringify(property)}]`;
}

function malformed(errors, path, detail) {
  errors.push(`MALFORMED_MODEL ${path} ${detail}`);
}

function cloneStructuredData(value, path, active, errors, depth = 0) {
  if (depth > MAX_TRAVERSAL_DEPTH) {
    malformed(errors, path, `exceeds maximum depth ${MAX_TRAVERSAL_DEPTH}`);
    return undefined;
  }
  if (value === null) return null;

  const valueType = typeof value;
  if (["string", "number", "boolean"].includes(valueType)) return value;
  if (valueType !== "object") {
    malformed(errors, path, `contains unsupported ${valueType} data`);
    return undefined;
  }
  if (active.has(value)) {
    malformed(errors, path, "contains cyclic data");
    return undefined;
  }

  let prototype;
  let keys;
  try {
    prototype = Object.getPrototypeOf(value);
    keys = Reflect.ownKeys(value);
  } catch {
    malformed(errors, path, "cannot be inspected safely");
    return undefined;
  }

  const isArray = Array.isArray(value);
  if (isArray) {
    let lengthDescriptor;
    try {
      lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    } catch {
      malformed(errors, path, "cannot be inspected safely");
      return undefined;
    }
    const indexedKeyCount = keys.filter((key) => (
      typeof key === "string"
      && /^(?:0|[1-9]\d*)$/.test(key)
      && Number(key) < 4_294_967_295
    )).length;
    if (indexedKeyCount !== lengthDescriptor?.value) {
      malformed(errors, path, "contains sparse array entries");
    }
  }
  const validPrototype = isArray
    ? prototype === Array.prototype
    : prototype === Object.prototype || prototype === null;
  if (!validPrototype) malformed(errors, path, "must use a plain prototype");

  const clone = isArray
    ? []
    : prototype === null ? Object.create(null) : {};
  active.add(value);

  for (const key of keys) {
    if (typeof key === "symbol") {
      malformed(errors, path, "contains a symbol-keyed property");
      continue;
    }
    if (isArray && key === "length") continue;

    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch {
      malformed(errors, childPath(path, key), "cannot be inspected safely");
      continue;
    }
    if (!descriptor || !("value" in descriptor)) {
      malformed(errors, childPath(path, key), "must be a data property");
      continue;
    }

    const clonedValue = cloneStructuredData(
      descriptor.value,
      childPath(path, key),
      active,
      errors,
      depth + 1,
    );
    if (clonedValue !== undefined) {
      Object.defineProperty(clone, key, {
        configurable: true,
        enumerable: true,
        value: clonedValue,
        writable: true,
      });
    }
  }

  active.delete(value);
  return clone;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidId(value) {
  return typeof value === "string" && value.trim() !== "";
}

function requireArray(errors, value, property, path) {
  if (!Array.isArray(value?.[property])) {
    errors.push(`INVALID_ENTITY_SHAPE ${path}.${property} must be an array`);
    return [];
  }
  return value[property];
}

function optionalArray(errors, value, property, path) {
  if (!Object.hasOwn(value, property)) return [];
  return requireArray(errors, value, property, path);
}

function requireRecord(errors, value, property, path) {
  if (!isRecord(value?.[property])) {
    errors.push(`INVALID_ENTITY_SHAPE ${path}.${property} must be an object`);
    return null;
  }
  return value[property];
}

function requireString(errors, value, property, path) {
  if (!isValidId(value?.[property])) {
    errors.push(
      `INVALID_ENTITY_SHAPE ${path}.${property} must be a non-empty string`,
    );
  }
}

function contractString(errors, value, property, path, code) {
  if (!isValidId(value?.[property])) {
    errors.push(`${code} ${path}.${property} must be a non-empty string`);
  }
}

function contractArray(errors, value, property, path, code, { nonEmpty = false } = {}) {
  if (!Array.isArray(value?.[property])) {
    errors.push(`${code} ${path}.${property} must be an array`);
    return [];
  }
  if (nonEmpty && value[property].length === 0) {
    errors.push(`${code} ${path}.${property} must be non-empty`);
  }
  return value[property];
}

function contractStringArray(errors, value, property, path, code, options = {}) {
  const values = contractArray(errors, value, property, path, code, options);
  const seen = new Set();
  values.forEach((entry, index) => {
    if (!isValidId(entry) || seen.has(entry)) {
      errors.push(`${code} ${path}.${property}[${index}] must be a unique non-empty string`);
    }
    if (isValidId(entry)) seen.add(entry);
  });
  return values;
}

function requireTrue(errors, value, property, path) {
  if (value?.[property] !== true) {
    errors.push(`INVALID_ENTITY_SHAPE ${path}.${property} must be true`);
  }
}

function validateObjectMembers(errors, values, path, label) {
  values.forEach((value, index) => {
    if (!isRecord(value)) {
      errors.push(`INVALID_ENTITY_SHAPE ${path}[${index}] ${label} must be an object`);
    }
  });
}

function validateEntities(errors, values, path, label, validate) {
  values.forEach((value, index) => {
    const entityPath = `${path}[${index}]`;
    if (!isRecord(value)) {
      errors.push(`INVALID_ENTITY_SHAPE ${entityPath} ${label} must be an object`);
      return;
    }
    if (!isValidId(value.id)) {
      errors.push(`INVALID_ENTITY_SHAPE ${entityPath}.id must be a non-empty string`);
    }
    validate?.(value, entityPath);
  });
}

function validateReferenceIntegrity(errors, field, path) {
  if (field.valueSource?.kind === "OBJECT_REF") {
    if (!REFERENCE_INTEGRITIES.has(field.referenceIntegrity)) {
      errors.push(
        `INVALID_LINEAGE_BINDING ${path}.referenceIntegrity must be IDENTITY_ONLY or VERSION_PINNED`,
      );
    }
    if (
      field.referenceIntegrity === "VERSION_PINNED"
      && !Object.hasOwn(field, "versionBinding")
    ) {
      errors.push(`INVALID_LINEAGE_BINDING ${path}.versionBinding is required for VERSION_PINNED`);
    }
    if (
      field.referenceIntegrity === "IDENTITY_ONLY"
      && Object.hasOwn(field, "versionBinding")
    ) {
      errors.push(`INVALID_LINEAGE_BINDING ${path}.versionBinding is forbidden for IDENTITY_ONLY`);
    }
    if (field.referenceIntegrity === "VERSION_PINNED") {
      if (!STATE_GUARD_POLICIES.has(field.stateGuardPolicy)) {
        errors.push(
          `INVALID_FIELD_CONTRACT ${path}.stateGuardPolicy must explicitly be NONE, CREATE_REQUIRED, UPDATE_REQUIRED, or ALWAYS_REQUIRED`,
        );
      }
      const actionApplicability = field.actionApplicability;
      const expectedApplicabilityKeys = new Set(["requiredActionIds"]);
      if (
        !isRecord(actionApplicability)
        || Object.keys(actionApplicability).length !== expectedApplicabilityKeys.size
        || Object.keys(actionApplicability).some((key) => !expectedApplicabilityKeys.has(key))
      ) {
        errors.push(
          `INVALID_FIELD_CONTRACT ${path}.actionApplicability must use the closed requiredActionIds shape`,
        );
      } else {
        contractStringArray(
          errors,
          actionApplicability,
          "requiredActionIds",
          `${path}.actionApplicability`,
          "INVALID_FIELD_CONTRACT",
        );
      }
    } else if (Object.hasOwn(field, "stateGuardPolicy")) {
      errors.push(
        `INVALID_FIELD_CONTRACT ${path}.stateGuardPolicy is allowed only for VERSION_PINNED references`,
      );
    }
    if (
      field.referenceIntegrity !== "VERSION_PINNED"
      && Object.hasOwn(field, "actionApplicability")
    ) {
      errors.push(
        `INVALID_FIELD_CONTRACT ${path}.actionApplicability is allowed only for VERSION_PINNED references`,
      );
    }
  } else if (
    Object.hasOwn(field, "referenceIntegrity")
    || Object.hasOwn(field, "versionBinding")
    || Object.hasOwn(field, "stateGuardPolicy")
  ) {
    errors.push(`INVALID_LINEAGE_BINDING ${path} reference integrity requires OBJECT_REF`);
  }
  if (
    field.valueSource?.kind !== "OBJECT_REF"
    && Object.hasOwn(field, "actionApplicability")
  ) {
    errors.push(
      `INVALID_FIELD_CONTRACT ${path}.actionApplicability is allowed only for VERSION_PINNED references`,
    );
  }
  if (Object.hasOwn(field, "versionBinding")) {
    const versionBinding = field.versionBinding;
    const expectedKeys = new Set(["versionFieldId", "targetVersionFieldId"]);
    if (
      !isRecord(versionBinding)
      || Object.keys(versionBinding).length !== expectedKeys.size
      || Object.keys(versionBinding).some((key) => !expectedKeys.has(key))
    ) {
      errors.push(`INVALID_LINEAGE_BINDING ${path}.versionBinding must use the closed version-binding shape`);
    } else {
      for (const property of expectedKeys) {
        contractString(
          errors,
          versionBinding,
          property,
          `${path}.versionBinding`,
          "INVALID_LINEAGE_BINDING",
        );
      }
    }
  }
}

function validateField(errors, field, path, strict, objectStateIds) {
  requireRecord(errors, field, "valueSource", path);
  validateReferenceIntegrity(errors, field, path);
  if (!strict) return;
  for (const property of [
    "label",
    "dataType",
    "mutability",
    "visibility",
    "validation",
    "historyPolicy",
  ]) {
    contractString(errors, field, property, path, "INVALID_FIELD_CONTRACT");
  }
  const required = field.required;
  if (typeof required !== "boolean" && !isRecord(required)) {
    errors.push(
      `INVALID_FIELD_CONTRACT ${path}.required must be boolean or a structured conditional rule`,
    );
  } else if (isRecord(required)) {
    const allowedKeys = new Set(["description", "whenStates", "whenActionIds"]);
    const requiredKeys = new Set(["description", "whenStates"]);
    if (
      [...requiredKeys].some((key) => !Object.hasOwn(required, key))
      || Object.keys(required).some((key) => !allowedKeys.has(key))
    ) {
      errors.push(
        `INVALID_FIELD_CONTRACT ${path}.required must use the closed description, whenStates, and optional whenActionIds shape`,
      );
    }
    contractString(
      errors,
      required,
      "description",
      `${path}.required`,
      "INVALID_FIELD_CONTRACT",
    );
    const whenStates = contractStringArray(
      errors,
      required,
      "whenStates",
      `${path}.required`,
      "INVALID_FIELD_CONTRACT",
      { nonEmpty: true },
    );
    for (const state of whenStates) {
      if (isValidId(state) && !objectStateIds.has(state)) {
        errors.push(
          `INVALID_FIELD_CONTRACT ${path}.required.whenStates contains unknown object state ${state}`,
        );
      }
    }
    if (Object.hasOwn(required, "whenActionIds")) {
      contractStringArray(
        errors,
        required,
        "whenActionIds",
        `${path}.required`,
        "INVALID_FIELD_CONTRACT",
        { nonEmpty: true },
      );
    }
  }
  if (!isRecord(field.valueSource)) {
    errors.push(`INVALID_FIELD_CONTRACT ${path}.valueSource must be an object`);
  }
  if (!DATA_TYPES.has(field.dataType)) {
    errors.push(`INVALID_FIELD_CONTRACT ${path}.dataType is unsupported`);
  }
  if (!MUTABILITIES.has(field.mutability)) {
    errors.push(`INVALID_FIELD_CONTRACT ${path}.mutability is unsupported`);
  }
  if (!DATA_EXPOSURE_VISIBILITIES.has(field.visibility)) {
    errors.push(`INVALID_FIELD_CONTRACT ${path}.visibility is unsupported`);
  }
  if (
    Object.hasOwn(field, "referenceType")
    && field.referenceType !== "AUTHORIZABLE_ACTION"
  ) {
    errors.push(`INVALID_FIELD_CONTRACT ${path}.referenceType is unsupported`);
  }
  if (
    Object.hasOwn(field, "idempotencyRole")
    && !IDEMPOTENCY_ROLES.has(field.idempotencyRole)
  ) {
    errors.push(`INVALID_FIELD_CONTRACT ${path}.idempotencyRole is unsupported`);
  }
  if (Object.hasOwn(field, "writeContract")) {
    const code = "INVALID_FIELD_WRITE_CONTRACT";
    const writeContract = field.writeContract;
    if (
      !isRecord(writeContract)
      || Object.keys(writeContract).length !== 2
      || !Object.hasOwn(writeContract, "initializers")
      || !Object.hasOwn(writeContract, "mutators")
    ) {
      errors.push(`${code} ${path}.writeContract must use the closed initializer and mutator shape`);
    } else {
      const initializers = writeContract.initializers;
      const mutators = writeContract.mutators;
      if (
        !isRecord(initializers)
        || Object.keys(initializers).length !== 2
        || !Object.hasOwn(initializers, "actionIds")
        || !Object.hasOwn(initializers, "value")
      ) {
        errors.push(`${code} ${path}.writeContract.initializers must declare actionIds and value`);
      } else {
        const actionIds = contractStringArray(errors, initializers, "actionIds", `${path}.writeContract.initializers`, code, { nonEmpty: true });
        validateUniqueStrings(errors, actionIds, `${path}.writeContract.initializers.actionIds`, code);
        if (typeof initializers.value !== "number" || !Number.isFinite(initializers.value)) {
          errors.push(`${code} ${path}.writeContract.initializers.value must be finite numeric data`);
        }
      }
      if (
        !isRecord(mutators)
        || Object.keys(mutators).length !== 3
        || !Object.hasOwn(mutators, "actionIds")
        || !Object.hasOwn(mutators, "operation")
        || !Object.hasOwn(mutators, "amount")
      ) {
        errors.push(`${code} ${path}.writeContract.mutators must declare actionIds, operation, and amount`);
      } else {
        const actionIds = contractStringArray(errors, mutators, "actionIds", `${path}.writeContract.mutators`, code, { nonEmpty: true });
        validateUniqueStrings(errors, actionIds, `${path}.writeContract.mutators.actionIds`, code);
        if (mutators.operation !== "INCREMENT") {
          errors.push(`${code} ${path}.writeContract.mutators.operation must be INCREMENT`);
        }
        if (typeof mutators.amount !== "number" || !Number.isFinite(mutators.amount)) {
          errors.push(`${code} ${path}.writeContract.mutators.amount must be finite numeric data`);
        }
      }
    }
  }
  if (Object.hasOwn(field, "releaseRequirement")) {
    const releaseRequirement = field.releaseRequirement;
    const expectedKeys = new Set(["readPolicyId", "requiredState", "visibleAtFieldId"]);
    if (
      !isRecord(releaseRequirement)
      || Object.keys(releaseRequirement).length !== expectedKeys.size
      || Object.keys(releaseRequirement).some((key) => !expectedKeys.has(key))
    ) {
      errors.push(`INVALID_READ_POLICY ${path}.releaseRequirement must use the closed release shape`);
    } else {
      for (const property of expectedKeys) {
        contractString(
          errors,
          releaseRequirement,
          property,
          `${path}.releaseRequirement`,
          "INVALID_READ_POLICY",
        );
      }
    }
  }
}

function validateObject(errors, object, path, strict) {
  const states = requireArray(errors, object, "states", path);
  const fields = requireArray(errors, object, "fields", path);
  if (strict) {
    for (const property of [
      "label",
      "dataSubject",
      "controlSubject",
      "producerRef",
      "ownerRef",
      "confirmerRef",
      "stewardRef",
      "lifecyclePolicyId",
      "sensitivityId",
    ]) {
      contractString(errors, object, property, path, "INVALID_OBJECT_CONTRACT");
    }
    if (!READ_MODES.has(object.readMode)) {
      errors.push(
        `INVALID_OBJECT_CONTRACT ${path}.readMode must be AUTHORIZED, NO_DIRECT_READ, or STUDENT_TIMED_RELEASE`,
      );
    }
    if (!studentDataClassificationMatchesRegistry(object)) {
      errors.push(
        `INVALID_STUDENT_DATA_CLASSIFICATION ${path}.studentDataClassification must exactly match the registered dataSubject and object classification`,
      );
    }
    if (Object.hasOwn(object, "professionalWritePolicy")) {
      const policy = object.professionalWritePolicy;
      if (!isProfessionalWritePolicy(policy)) {
        errors.push(
          `INVALID_OBJECT_CONTRACT ${path}.professionalWritePolicy must use the closed ${PROFESSIONAL_WRITE_BOUNDARY_KIND} shape`,
        );
      }
    }
    if (!professionalWritePolicyMatchesRegistry(object)) {
      errors.push(
        `INVALID_PROFESSIONAL_WRITE_POLICY ${object.id} professionalWritePolicy must exactly match professional write object registry membership`,
      );
    }
    const reachability = object.stateReachability;
    if (!isRecord(reachability)) {
      errors.push(
        `INVALID_STATE_REACHABILITY_POLICY ${path}.stateReachability must be an object`,
      );
    } else if (reachability.mode === "NONE") {
      if (Object.keys(reachability).length !== 1) {
        errors.push(
          `INVALID_STATE_REACHABILITY_POLICY ${path}.stateReachability NONE must use the closed mode shape`,
        );
      }
    } else if (reachability.mode === "ACTION_GRAPH") {
      const allowedKeys = new Set(["mode", "initialStateIds", "entrySources"]);
      if (
        !Object.hasOwn(reachability, "initialStateIds")
        || Object.keys(reachability).some((key) => !allowedKeys.has(key))
      ) {
        errors.push(
          `INVALID_STATE_REACHABILITY_POLICY ${path}.stateReachability ACTION_GRAPH must use the closed initialStateIds and optional entrySources shape`,
        );
      }
      contractStringArray(
        errors,
        reachability,
        "initialStateIds",
        `${path}.stateReachability`,
        "INVALID_STATE_REACHABILITY_POLICY",
      );
      if (Object.hasOwn(reachability, "entrySources")) {
        const entrySources = contractArray(
          errors,
          reachability,
          "entrySources",
          `${path}.stateReachability`,
          "INVALID_STATE_REACHABILITY_POLICY",
          { nonEmpty: true },
        );
        const expectedKeys = new Set(["kind", "stateId", "producerRef"]);
        entrySources.forEach((source, index) => {
          const sourcePath = `${path}.stateReachability.entrySources[${index}]`;
          if (
            !isRecord(source)
            || Object.keys(source).length !== expectedKeys.size
            || Object.keys(source).some((key) => !expectedKeys.has(key))
          ) {
            errors.push(
              `INVALID_STATE_REACHABILITY_POLICY ${sourcePath} must use the closed external source shape`,
            );
            return;
          }
          for (const property of expectedKeys) {
            contractString(
              errors,
              source,
              property,
              sourcePath,
              "INVALID_STATE_REACHABILITY_POLICY",
            );
          }
          if (source.kind !== "EXTERNAL_SOURCE") {
            errors.push(
              `INVALID_STATE_REACHABILITY_POLICY ${sourcePath}.kind must be EXTERNAL_SOURCE`,
            );
          }
        });
      }
    } else {
      errors.push(
        `INVALID_STATE_REACHABILITY_POLICY ${path}.stateReachability.mode must be NONE or ACTION_GRAPH`,
      );
    }
    if (
      Object.hasOwn(object, "semanticType")
      && !OBJECT_SEMANTIC_TYPES.has(object.semanticType)
    ) {
      errors.push(`INVALID_OBJECT_CONTRACT ${path}.semanticType is unsupported`);
    }
    if (states.length === 0) {
      errors.push(`INVALID_OBJECT_CONTRACT ${path}.states must be non-empty`);
    }
    if (fields.length === 0) {
      errors.push(`INVALID_OBJECT_CONTRACT ${path}.fields must be non-empty`);
    }
    const identityFields = fields.filter((field) => (
      isRecord(field) && field.idempotencyRole === "OBJECT_ID"
    ));
    const [identityField] = identityFields;
    if (
      identityFields.length !== 1
      || identityField?.dataType !== "ID"
      || identityField?.valueSource?.kind !== "SYSTEM"
      || identityField?.mutability !== "IMMUTABLE"
      || identityField?.visibility !== "AUTHORIZED_SCOPE"
    ) {
      errors.push(
        `INVALID_OBJECT_CONTRACT ${path} requires exactly one standard system object identity`,
      );
    }
    const seenStates = new Set();
    states.forEach((state, index) => {
      if (!isValidId(state) || seenStates.has(state)) {
        errors.push(
          `INVALID_OBJECT_CONTRACT ${path}.states[${index}] must be a unique non-empty string`,
        );
      }
      if (isValidId(state)) seenStates.add(state);
    });
    if (Object.hasOwn(object, "exclusiveSourceGroups")) {
      const groups = contractArray(
        errors,
        object,
        "exclusiveSourceGroups",
        path,
        "INVALID_OBJECT_CONTRACT",
        { nonEmpty: true },
      );
      if (groups.length < 2) {
        errors.push(
          `INVALID_OBJECT_CONTRACT ${path}.exclusiveSourceGroups must declare at least two alternatives`,
        );
      }
      const expectedKeys = new Set(["id", "fieldIds"]);
      const seenGroupIds = new Set();
      const seenFieldIds = new Set();
      groups.forEach((group, index) => {
        const groupPath = `${path}.exclusiveSourceGroups[${index}]`;
        if (!isRecord(group)) {
          errors.push(`INVALID_OBJECT_CONTRACT ${groupPath} must be an object`);
          return;
        }
        if (
          Object.keys(group).length !== expectedKeys.size
          || Object.keys(group).some((key) => !expectedKeys.has(key))
        ) {
          errors.push(
            `INVALID_OBJECT_CONTRACT ${groupPath} must use the closed id and fieldIds shape`,
          );
        }
        contractString(errors, group, "id", groupPath, "INVALID_OBJECT_CONTRACT");
        const fieldIds = contractStringArray(
          errors,
          group,
          "fieldIds",
          groupPath,
          "INVALID_OBJECT_CONTRACT",
          { nonEmpty: true },
        );
        if (isValidId(group.id) && seenGroupIds.has(group.id)) {
          errors.push(
            `INVALID_OBJECT_CONTRACT ${groupPath}.id must be unique within exclusiveSourceGroups`,
          );
        }
        if (isValidId(group.id)) seenGroupIds.add(group.id);
        for (const fieldId of fieldIds) {
          if (seenFieldIds.has(fieldId)) {
            errors.push(
              `INVALID_OBJECT_CONTRACT ${groupPath}.fieldIds must not overlap another exclusive source group`,
            );
          }
          seenFieldIds.add(fieldId);
        }
      });
    }
    if (Object.hasOwn(object, "lineageBindings")) {
      const lineageBindings = requireArray(errors, object, "lineageBindings", path);
      validateObjectMembers(errors, lineageBindings, `${path}.lineageBindings`, "lineage binding");
      const expectedKeys = new Set([
        "refFieldId",
        "versionFieldId",
        "targetObjectId",
        "targetVersionFieldId",
      ]);
      lineageBindings.forEach((binding, index) => {
        if (!isRecord(binding)) return;
        const bindingPath = `${path}.lineageBindings[${index}]`;
        if (
          Object.keys(binding).length !== expectedKeys.size
          || Object.keys(binding).some((key) => !expectedKeys.has(key))
        ) {
          errors.push(`INVALID_LINEAGE_BINDING ${bindingPath} must use the closed lineage shape`);
        }
        for (const property of expectedKeys) {
          contractString(errors, binding, property, bindingPath, "INVALID_LINEAGE_BINDING");
        }
      });
    }
    if (
      object.readMode === "STUDENT_TIMED_RELEASE"
      || Object.hasOwn(object, "readPolicies")
    ) {
      const readPolicies = requireArray(errors, object, "readPolicies", path);
      validateObjectMembers(errors, readPolicies, `${path}.readPolicies`, "read policy");
      if (object.readMode === "STUDENT_TIMED_RELEASE" && readPolicies.length === 0) {
        errors.push(`INVALID_READ_POLICY ${path}.readPolicies must be non-empty`);
      }
      const requiredPolicyKeys = new Set([
        "id",
        "actionId",
        "subject",
        "scope",
        "requiredState",
        "timeGates",
      ]);
      const allowedPolicyKeys = new Set([
        ...requiredPolicyKeys,
        "safeMetadataFieldIds",
      ]);
      readPolicies.forEach((policy, index) => {
        if (!isRecord(policy)) return;
        const policyPath = `${path}.readPolicies[${index}]`;
        if (
          [...requiredPolicyKeys].some((key) => !Object.hasOwn(policy, key))
          || Object.keys(policy).some((key) => !allowedPolicyKeys.has(key))
        ) {
          errors.push(`INVALID_READ_POLICY ${policyPath} must use the closed read-policy shape`);
        }
        contractString(errors, policy, "id", policyPath, "INVALID_READ_POLICY");
        contractString(errors, policy, "actionId", policyPath, "INVALID_READ_POLICY");
        contractString(errors, policy, "requiredState", policyPath, "INVALID_READ_POLICY");
        if (Object.hasOwn(policy, "safeMetadataFieldIds")) {
          contractStringArray(
            errors,
            policy,
            "safeMetadataFieldIds",
            policyPath,
            "INVALID_READ_POLICY",
          );
        }

        if (!isRecord(policy.subject)) {
          errors.push(`INVALID_READ_POLICY ${policyPath}.subject must be an object`);
        } else {
          const subjectKeys = ["actorRef", "roleRef", "dutyRef"]
            .filter((property) => Object.hasOwn(policy.subject, property));
          if (
            subjectKeys.length !== 1
            || Object.keys(policy.subject).length !== 1
            || !isValidId(policy.subject[subjectKeys[0]])
          ) {
            errors.push(`INVALID_READ_POLICY ${policyPath}.subject requires exactly one subject selector`);
          }
        }

        if (!isRecord(policy.scope)) {
          errors.push(`INVALID_READ_POLICY ${policyPath}.scope must be an object`);
        } else {
          const scopeKeys = Object.keys(policy.scope);
          if (
            scopeKeys.length !== 2
            || !scopeKeys.includes("kind")
            || !scopeKeys.includes("subjectFieldId")
            || policy.scope.kind !== "OWN_RECORD"
            || !isValidId(policy.scope.subjectFieldId)
          ) {
            errors.push(`INVALID_READ_POLICY ${policyPath}.scope must be an OWN_RECORD scope`);
          }
        }

        const timeGates = requireArray(errors, policy, "timeGates", policyPath);
        validateObjectMembers(errors, timeGates, `${policyPath}.timeGates`, "time gate");
        if (timeGates.length === 0) {
          errors.push(`INVALID_READ_POLICY ${policyPath}.timeGates must be non-empty`);
        }
        timeGates.forEach((timeGate, gateIndex) => {
          if (!isRecord(timeGate)) return;
          const gatePath = `${policyPath}.timeGates[${gateIndex}]`;
          const gateKeys = Object.keys(timeGate);
          if (
            gateKeys.length !== 2
            || !gateKeys.includes("visibleAtFieldId")
            || !gateKeys.includes("protectedFieldIds")
          ) {
            errors.push(`INVALID_READ_POLICY ${gatePath} must use the closed time-gate shape`);
          }
          contractString(
            errors,
            timeGate,
            "visibleAtFieldId",
            gatePath,
            "INVALID_READ_POLICY",
          );
          contractStringArray(
            errors,
            timeGate,
            "protectedFieldIds",
            gatePath,
            "INVALID_READ_POLICY",
            { nonEmpty: true },
          );
        });
      });
    }
  }
  const objectStateIds = new Set(states.filter(isValidId));
  validateEntities(errors, fields, `${path}.fields`, "field", (field, fieldPath) => {
    validateField(errors, field, fieldPath, strict, objectStateIds);
  });
}

function validateRelationship(errors, relationship, path) {
  for (const property of [
    "fromObjectId",
    "toObjectId",
    "type",
    "cardinality",
    "ownershipScope",
    "onSourceInvalidation",
  ]) {
    contractString(
      errors,
      relationship,
      property,
      path,
      "INVALID_RELATIONSHIP_CONTRACT",
    );
  }
  if (!RELATIONSHIP_TYPES.has(relationship.type)) {
    errors.push(`INVALID_RELATIONSHIP_CONTRACT ${path}.type is unsupported`);
  }
  if (!CARDINALITIES.has(relationship.cardinality)) {
    errors.push(`INVALID_RELATIONSHIP_CONTRACT ${path}.cardinality is unsupported`);
  }
  if (!OWNERSHIP_SCOPES.has(relationship.ownershipScope)) {
    errors.push(`INVALID_RELATIONSHIP_CONTRACT ${path}.ownershipScope is unsupported`);
  }
}

function validateActionTrigger(errors, trigger, path, expectedKind) {
  if (!isRecord(trigger)) {
    errors.push(`INVALID_ACTION_CONTRACT ${path} must be an object`);
    return;
  }
  if (expectedKind && trigger.kind !== expectedKind) {
    errors.push(`INVALID_ACTION_CONTRACT ${path}.kind must be ${expectedKind}`);
  }
  if (trigger.kind === "EVENT") {
    contractString(errors, trigger, "eventId", path, "INVALID_ACTION_CONTRACT");
    return;
  }
  if (trigger.kind === "FLOW") {
    contractStringArray(
      errors,
      trigger,
      "flowIds",
      path,
      "INVALID_ACTION_CONTRACT",
      { nonEmpty: true },
    );
    return;
  }
  errors.push(`INVALID_ACTION_CONTRACT ${path}.kind must be EVENT or FLOW`);
}

function validateDraftPurpose(errors, purpose, path, errorCode) {
  const expectedKeys = new Set([
    "contentKind",
    "effectBoundary",
    "targetLifecyclePolicyId",
    "targetStateId",
  ]);
  if (
    !isRecord(purpose)
    || Object.keys(purpose).length !== expectedKeys.size
    || Object.keys(purpose).some((key) => !expectedKeys.has(key))
  ) {
    errors.push(`${errorCode} ${path} must use the closed draft-purpose shape`);
    return;
  }
  for (const property of expectedKeys) {
    contractString(errors, purpose, property, path, errorCode);
  }
  if (!DRAFT_CONTENT_KINDS.has(purpose.contentKind)) {
    errors.push(`${errorCode} ${path}.contentKind must be a registered draft content kind`);
  }
  if (!DRAFT_EFFECT_BOUNDARIES.has(purpose.effectBoundary)) {
    errors.push(`${errorCode} ${path}.effectBoundary must be a registered draft effect boundary`);
  }
}

function validateDraftPurposeProfile(errors, profile, path) {
  const code = "INVALID_AI_DRAFT_PURPOSE";
  const expectedKeys = new Set([
    "taskId",
    "actionId",
    "contentKind",
    "effectBoundary",
    "targetObjectId",
    "targetLifecyclePolicyId",
    "targetStateId",
  ]);
  if (
    !isRecord(profile)
    || Object.keys(profile).length !== expectedKeys.size
    || Object.keys(profile).some((key) => !expectedKeys.has(key))
  ) {
    errors.push(`${code} ${path} must use the closed draft-purpose profile shape`);
    return;
  }
  for (const property of expectedKeys) {
    contractString(errors, profile, property, path, code);
  }
  if (!DRAFT_CONTENT_KINDS.has(profile.contentKind)) {
    errors.push(`${code} ${path}.contentKind must be a registered draft content kind`);
  }
  if (!DRAFT_EFFECT_BOUNDARIES.has(profile.effectBoundary)) {
    errors.push(`${code} ${path}.effectBoundary must be a registered draft effect boundary`);
  }
}

function validateAction(errors, action, path, strict) {
  requireArray(errors, action, "inputFieldIds", path);
  requireArray(errors, action, "outputFieldIds", path);
  const permissions = requireArray(errors, action, "permissions", path);
  validateObjectMembers(errors, permissions, `${path}.permissions`, "permission");
  requireArray(errors, action, "scenarioIds", path);
  if (Object.hasOwn(action, "transition") && !isRecord(action.transition)) {
    errors.push(`INVALID_ENTITY_SHAPE ${path}.transition must be an object`);
  } else if (isRecord(action.transition)) {
    const transitionPath = `${path}.transition`;
    if (Array.isArray(action.transition.from)) {
      const fromStates = contractStringArray(
        errors,
        action.transition,
        "from",
        transitionPath,
        "INVALID_ACTION_CONTRACT",
        { nonEmpty: true },
      );
      validateUniqueStrings(
        errors,
        fromStates,
        `${transitionPath}.from`,
        "INVALID_ACTION_CONTRACT",
      );
    } else {
      contractString(
        errors,
        action.transition,
        "from",
        transitionPath,
        "INVALID_ACTION_CONTRACT",
      );
    }
    contractString(
      errors,
      action.transition,
      "to",
      transitionPath,
      "INVALID_ACTION_CONTRACT",
    );
  }
  if (!strict) return;
  for (const property of ["label", "targetObjectId"]) {
    contractString(errors, action, property, path, "INVALID_ACTION_CONTRACT");
  }
  contractString(errors, action, "operationKind", path, "INVALID_ACTION_CONTRACT");
  if (isValidId(action.operationKind) && !OPERATION_KINDS.has(action.operationKind)) {
    errors.push(
      `INVALID_ACTION_OPERATION ${path}.operationKind must be READ, CREATE, or UPDATE`,
    );
  }
  if (Object.hasOwn(action, "capability")) {
    contractString(errors, action, "capability", path, "INVALID_ACTION_CONTRACT");
    if (!AI_CAPABILITIES.has(action.capability)) {
      errors.push(
        `INVALID_ACTION_CONTRACT ${path}.capability must be a registered AI capability`,
      );
    }
  }
  if (Object.hasOwn(action, "draftPurpose")) {
    validateDraftPurpose(
      errors,
      action.draftPurpose,
      `${path}.draftPurpose`,
      "INVALID_ACTION_CONTRACT",
    );
  }
  if (Object.hasOwn(action, "fieldWrites")) {
    const code = "INVALID_FIELD_WRITE_CONTRACT";
    const fieldWrites = contractArray(errors, action, "fieldWrites", path, code, { nonEmpty: true });
    const fieldIds = [];
    fieldWrites.forEach((fieldWrite, index) => {
      const fieldWritePath = `${path}.fieldWrites[${index}]`;
      if (!isRecord(fieldWrite)) {
        errors.push(`${code} ${fieldWritePath} must be an object`);
        return;
      }
      const expectedKeys = fieldWrite.mode === "INITIALIZE"
        ? new Set(["fieldId", "mode", "value"])
        : fieldWrite.mode === "INCREMENT"
          ? new Set(["fieldId", "mode", "amount"])
          : null;
      if (
        !expectedKeys
        || Object.keys(fieldWrite).length !== expectedKeys.size
        || Object.keys(fieldWrite).some((key) => !expectedKeys.has(key))
      ) {
        errors.push(`${code} ${fieldWritePath} must use a closed INITIALIZE or INCREMENT shape`);
        return;
      }
      contractString(errors, fieldWrite, "fieldId", fieldWritePath, code);
      fieldIds.push(fieldWrite.fieldId);
      const numericProperty = fieldWrite.mode === "INITIALIZE" ? "value" : "amount";
      if (
        typeof fieldWrite[numericProperty] !== "number"
        || !Number.isFinite(fieldWrite[numericProperty])
      ) {
        errors.push(`${code} ${fieldWritePath}.${numericProperty} must be finite numeric data`);
      }
    });
    validateUniqueStrings(errors, fieldIds, `${path}.fieldWrites`, code);
  }
  for (const property of ["inputFieldIds", "outputFieldIds"]) {
    contractStringArray(errors, action, property, path, "INVALID_ACTION_CONTRACT");
  }
  if (Object.hasOwn(action, "acceptedInputValues")) {
    const acceptedInputValues = contractArray(
      errors,
      action,
      "acceptedInputValues",
      path,
      "INVALID_ACTION_CONTRACT",
      { nonEmpty: true },
    );
    const expectedKeys = new Set(["fieldId", "optionSetId", "partitionId", "codes"]);
    acceptedInputValues.forEach((acceptedInputValue, index) => {
      const acceptedInputValuePath = `${path}.acceptedInputValues[${index}]`;
      if (
        !isRecord(acceptedInputValue)
        || Object.keys(acceptedInputValue).length !== expectedKeys.size
        || Object.keys(acceptedInputValue).some((key) => !expectedKeys.has(key))
      ) {
        errors.push(
          `INVALID_ACTION_CONTRACT ${acceptedInputValuePath} must use the closed fieldId, optionSetId, partitionId, and codes shape`,
        );
        return;
      }
      for (const property of ["fieldId", "optionSetId", "partitionId"]) {
        contractString(
          errors,
          acceptedInputValue,
          property,
          acceptedInputValuePath,
          "INVALID_ACTION_CONTRACT",
        );
      }
      const codes = contractStringArray(
        errors,
        acceptedInputValue,
        "codes",
        acceptedInputValuePath,
        "INVALID_ACTION_CONTRACT",
        { nonEmpty: true },
      );
      validateUniqueStrings(
        errors,
        codes,
        `${acceptedInputValuePath}.codes`,
        "INVALID_ACTION_CONTRACT",
      );
    });
  }
  if (Object.hasOwn(action, "relatedStateGuards")) {
    const relatedStateGuards = contractArray(
      errors,
      action,
      "relatedStateGuards",
      path,
      "INVALID_ACTION_CONTRACT",
      { nonEmpty: true },
    );
    const expectedKeys = new Set([
      "refFieldId",
      "versionFieldId",
      "targetObjectId",
      "requiredState",
    ]);
    relatedStateGuards.forEach((guard, index) => {
      const guardPath = `${path}.relatedStateGuards[${index}]`;
      if (
        !isRecord(guard)
        || Object.keys(guard).length !== expectedKeys.size
        || Object.keys(guard).some((key) => !expectedKeys.has(key))
      ) {
        errors.push(
          `INVALID_ACTION_CONTRACT ${guardPath} must use the closed refFieldId, versionFieldId, targetObjectId, and requiredState shape`,
        );
        return;
      }
      for (const property of expectedKeys) {
        contractString(
          errors,
          guard,
          property,
          guardPath,
          "INVALID_ACTION_CONTRACT",
        );
      }
    });
  }
  if (Object.hasOwn(action, "accessGuard")) {
    const guard = action.accessGuard;
    const guardPath = `${path}.accessGuard`;
    const expectedKeys = new Set([
      "exceptionKind",
      "sessionRefFieldId",
      "pinnedSessionVersionFieldId",
      "authorizedActorFieldId",
      "requestedScopeFieldId",
      "scopeFieldId",
      "expiresAtFieldId",
      "stateFieldId",
      "requiredState",
      "sourceVersionFieldId",
      "timeComparison",
      "actorBinding",
      "scopeBinding",
      "auditActionId",
      "auditOrdering",
    ]);
    if (
      !isRecord(guard)
      || Object.keys(guard).length !== expectedKeys.size
      || Object.keys(guard).some((key) => !expectedKeys.has(key))
    ) {
      errors.push(
        `INVALID_ACTION_CONTRACT ${guardPath} must use the closed AUD student-detail exception shape`,
      );
    }
    if (isRecord(guard)) {
      for (const property of expectedKeys) {
        contractString(
          errors,
          guard,
          property,
          guardPath,
          "INVALID_ACTION_CONTRACT",
        );
      }
      if (guard.exceptionKind !== STUDENT_DETAIL_ACCESS_EXCEPTION_KIND) {
        errors.push(
          `INVALID_ACTION_CONTRACT ${guardPath}.exceptionKind must be ${STUDENT_DETAIL_ACCESS_EXCEPTION_KIND}`,
        );
      }
    }
  }
  if (Object.hasOwn(action, "authorizationBoundary")) {
    const boundary = action.authorizationBoundary;
    if (!isProfessionalWriteAuthorizationBoundary(boundary)) {
      errors.push(
        `INVALID_ACTION_CONTRACT ${path}.authorizationBoundary must use the closed ${PROFESSIONAL_WRITE_BOUNDARY_KIND} shape`,
      );
    }
  }
  if (
    Object.hasOwn(action, "professionalWriteException")
    && !matchesRegisteredProfessionalWriteException(action)
  ) {
    errors.push(
      `INVALID_ACTION_CONTRACT ${path}.professionalWriteException must exactly match a registered non-professional protected-object write`,
    );
  }
  if (!EXECUTION_MODES.has(action.executionMode)) {
    errors.push(
      `INVALID_ACTION_CONTRACT ${path}.executionMode must be USER_TASK, SYSTEM_EVENT, or FLOW_INTERNAL`,
    );
  }
  if (action.executionMode === "USER_TASK") {
    contractStringArray(
      errors,
      action,
      "clients",
      path,
      "INVALID_ACTION_CONTRACT",
      { nonEmpty: true },
    ).forEach((client) => {
      if (isValidId(client) && !CLIENTS.has(client)) {
        errors.push(`INVALID_ACTION_CONTRACT ${path}.clients contains unsupported ${client}`);
      }
    });
    if (Object.hasOwn(action, "trigger")) {
      errors.push(`INVALID_ACTION_CONTRACT ${path}.trigger is not allowed for USER_TASK`);
    }
  } else if (action.executionMode === "SYSTEM_EVENT") {
    if (Object.hasOwn(action, "clients")) {
      errors.push(`INVALID_ACTION_CONTRACT ${path}.clients is not allowed for SYSTEM_EVENT`);
    }
    validateActionTrigger(errors, action.trigger, `${path}.trigger`, "EVENT");
  } else if (action.executionMode === "FLOW_INTERNAL") {
    if (Object.hasOwn(action, "clients")) {
      errors.push(`INVALID_ACTION_CONTRACT ${path}.clients is not allowed for FLOW_INTERNAL`);
    }
    validateActionTrigger(errors, action.trigger, `${path}.trigger`, "FLOW");
  }
  contractStringArray(
    errors,
    action,
    "scenarioIds",
    path,
    "INVALID_ACTION_CONTRACT",
    { nonEmpty: true },
  );
  contractArray(
    errors,
    action,
    "permissions",
    path,
    "INVALID_ACTION_CONTRACT",
  );
  permissions.forEach((permission, index) => {
    if (!isRecord(permission)) return;
    const permissionPath = `${path}.permissions[${index}]`;
    for (const property of Object.keys(permission)) {
      if (!PERMISSION_ALLOWED_KEYS.has(property)) {
        errors.push(
          `INVALID_PERMISSION_SUBJECT ${permissionPath}.${property} is not allowed`,
        );
      }
    }
    if (!["ALLOW", "DENY"].includes(permission.effect)) {
      errors.push(
        `INVALID_ACTION_CONTRACT ${permissionPath}.effect must be ALLOW or DENY`,
      );
    }
    if (!isValidId(permission.condition)) {
      errors.push(
        `INVALID_ACTION_CONTRACT ${permissionPath}.condition must be a non-empty string`,
      );
    }
    if (Object.hasOwn(permission, "scope")) {
      const scope = permission.scope;
      const recordScopeKeys = new Set(["kind", "subjectFieldId"]);
      const assignedSubjectCourseKeys = new Set([
        "kind",
        "subjectMatch",
        "courseMatch",
      ]);
      const validRecordScope = isRecord(scope)
        && Object.keys(scope).length === recordScopeKeys.size
        && Object.keys(scope).every((key) => recordScopeKeys.has(key))
        && ["OWN_RECORD", "OTHER_RECORD"].includes(scope.kind)
        && isValidId(scope.subjectFieldId);
      const validAssignedSubjectCourseScope = isRecord(scope)
        && Object.keys(scope).length === assignedSubjectCourseKeys.size
        && Object.keys(scope).every((key) => assignedSubjectCourseKeys.has(key))
        && scope.kind === "ASSIGNED_SUBJECT_COURSE"
        && scope.subjectMatch === "REQUIRED"
        && scope.courseMatch === "REQUIRED";
      if (!validRecordScope && !validAssignedSubjectCourseScope) {
        errors.push(
          `INVALID_ACTION_CONTRACT ${permissionPath}.scope must declare an OWN_RECORD, OTHER_RECORD, or ASSIGNED_SUBJECT_COURSE scope`,
        );
      }
    }
    const subjectProperties = ["actorRef", "roleRef", "dutyRef"]
      .filter((property) => Object.hasOwn(permission, property));
    if (subjectProperties.length !== 1) {
      errors.push(
        `INVALID_PERMISSION_SUBJECT ${permissionPath} requires exactly one subject selector`,
      );
      return;
    }
    const subjectProperty = subjectProperties[0];
    const subject = permission[subjectProperty];
    const validNamespace = (
      (subjectProperty === "actorRef" && SYSTEM_ACTOR_CATEGORIES.has(subject))
      || (
        subjectProperty === "roleRef"
        && typeof subject === "string"
        && subject.startsWith("ROLE-")
      )
      || (
        subjectProperty === "dutyRef"
        && typeof subject === "string"
        && subject.startsWith("DUTY-")
      )
    );
    if (!validNamespace) {
      errors.push(
        `INVALID_PERMISSION_SUBJECT ${permissionPath}.${subjectProperty} has the wrong namespace`,
      );
    }
  });
  const failureResults = contractStringArray(
    errors,
    action,
    "failureResults",
    path,
    "INVALID_ACTION_CONTRACT",
    { nonEmpty: true },
  );
  if (Object.hasOwn(action, "failureSemantics")) {
    const failureSemantics = contractArray(
      errors,
      action,
      "failureSemantics",
      path,
      "INVALID_ACTION_CONTRACT",
      { nonEmpty: true },
    );
    const resultCodes = [];
    const expectedKeys = new Set([
      "resultCode",
      "predicate",
      "given",
      "when",
      "expectedData",
    ]);
    failureSemantics.forEach((semantic, index) => {
      const semanticPath = `${path}.failureSemantics[${index}]`;
      if (
        !isRecord(semantic)
        || Object.keys(semantic).length !== expectedKeys.size
        || Object.keys(semantic).some((key) => !expectedKeys.has(key))
      ) {
        errors.push(
          `INVALID_ACTION_CONTRACT ${semanticPath} must use the closed resultCode, predicate, given, when, and expectedData shape`,
        );
        return;
      }
      for (const property of expectedKeys) {
        contractString(
          errors,
          semantic,
          property,
          semanticPath,
          "INVALID_ACTION_CONTRACT",
        );
      }
      resultCodes.push(semantic.resultCode);
      if (!failureResults.includes(semantic.resultCode)) {
        errors.push(
          `INVALID_ACTION_CONTRACT ${semanticPath}.resultCode must be declared in failureResults`,
        );
      }
    });
    validateUniqueStrings(
      errors,
      resultCodes,
      `${path}.failureSemantics`,
      "INVALID_ACTION_CONTRACT",
    );
  }
  if (typeof action.writes !== "boolean") {
    errors.push(`INVALID_ACTION_CONTRACT ${path}.writes must be boolean`);
  }
  if (!RISKS.has(action.risk)) {
    errors.push(`INVALID_ACTION_CONTRACT ${path}.risk must be READ, LOW, or HIGH`);
  }
  if (Object.hasOwn(action, "auditRequired")) {
    errors.push(`INVALID_AUDIT_MODE ${path}.auditRequired is obsolete and must not coexist`);
  }
  if (!AUDIT_MODES.has(action.auditMode)) {
    errors.push(
      `INVALID_AUDIT_MODE ${path}.auditMode must be REQUIRED, NOT_REQUIRED, or ATOMIC_SELF_RECORD`,
    );
  }
  if (action.risk === "HIGH") {
    if (!["REQUIRED", "ATOMIC_SELF_RECORD"].includes(action.auditMode)) {
      errors.push(`INVALID_AUDIT_MODE ${path}.auditMode must fail closed for HIGH risk`);
    }
    if (action.auditMode === "REQUIRED" && !failureResults.includes("AUDIT_FAILED")) {
      errors.push(
        `INVALID_ACTION_CONTRACT ${path}.failureResults must include AUDIT_FAILED for HIGH risk`,
      );
    }
  }
  if (
    action.auditMode === "ATOMIC_SELF_RECORD"
    && failureResults.includes("AUDIT_FAILED")
  ) {
    errors.push(
      `INVALID_AUDIT_MODE ${path}.failureResults must terminate without AUDIT_FAILED`,
    );
  }
  if (action.writes === true && !isValidId(action.idempotencyKey)) {
    errors.push(
      `INVALID_ACTION_CONTRACT ${path}.idempotencyKey is required for writes`,
    );
  }
}

function validatePage(errors, page, path, strict) {
  requireArray(errors, page, "fieldIds", path);
  requireArray(errors, page, "actionIds", path);
  optionalArray(errors, page, "objectIds", path);
  if (!strict) return;
  contractString(errors, page, "label", path, "INVALID_PAGE_CONTRACT");
  for (const property of ["fieldIds", "actionIds"]) {
    contractStringArray(errors, page, property, path, "INVALID_PAGE_CONTRACT");
  }
  contractStringArray(
    errors,
    page,
    "clients",
    path,
    "INVALID_PAGE_CONTRACT",
    { nonEmpty: true },
  ).forEach((client) => {
    if (isValidId(client) && !CLIENTS.has(client)) {
      errors.push(`INVALID_PAGE_CONTRACT ${path}.clients contains unsupported ${client}`);
    }
  });
  for (const property of ["regions", "viewStates"]) {
    contractStringArray(
      errors,
      page,
      property,
      path,
      "INVALID_PAGE_CONTRACT",
      { nonEmpty: true },
    );
  }
  const hasObjectId = isValidId(page.objectId);
  const hasObjectIds = Array.isArray(page.objectIds)
    && page.objectIds.length > 0
    && page.objectIds.every(isValidId);
  if (Object.hasOwn(page, "objectId") && Object.hasOwn(page, "objectIds")) {
    errors.push(
      `INVALID_PAGE_CONTRACT ${path} must not declare both objectId and objectIds`,
    );
  }
  if (!hasObjectId && !hasObjectIds) {
    errors.push(
      `INVALID_PAGE_CONTRACT ${path} requires objectId or non-empty objectIds`,
    );
  }
}

function validateScenario(errors, scenario, path, strict) {
  if (!strict) return;
  if (!SCENARIO_KINDS.has(scenario.kind)) {
    errors.push(
      `INVALID_SCENARIO_CONTRACT ${path}.kind must be SUCCESS, FAILURE, or BOUNDARY`,
    );
  }
  for (const property of ["actionId", "given", "when"]) {
    contractString(errors, scenario, property, path, "INVALID_SCENARIO_CONTRACT");
  }
  const hasPageId = Object.hasOwn(scenario, "pageId");
  const hasTrigger = Object.hasOwn(scenario, "trigger");
  if (hasPageId === hasTrigger) {
    errors.push(
      `INVALID_SCENARIO_CONTRACT ${path} requires exactly one of pageId or trigger`,
    );
  }
  if (hasPageId) {
    contractString(errors, scenario, "pageId", path, "INVALID_SCENARIO_CONTRACT");
  }
  if (hasTrigger) {
    validateActionTrigger(errors, scenario.trigger, `${path}.trigger`);
  }
  if (scenario.kind === "SUCCESS") {
    if (Object.hasOwn(scenario, "resultCode")) {
      errors.push(
        `INVALID_SCENARIO_CONTRACT ${path}.resultCode is not allowed for SUCCESS`,
      );
    }
    if (Object.hasOwn(scenario, "failurePredicate")) {
      errors.push(
        `INVALID_SCENARIO_CONTRACT ${path}.failurePredicate is not allowed for SUCCESS`,
      );
    }
  } else {
    contractString(errors, scenario, "resultCode", path, "INVALID_SCENARIO_CONTRACT");
    if (Object.hasOwn(scenario, "failurePredicate")) {
      contractString(
        errors,
        scenario,
        "failurePredicate",
        path,
        "INVALID_SCENARIO_CONTRACT",
      );
    }
  }
  const outcome = scenario.then;
  if (!isRecord(outcome)) {
    errors.push(`INVALID_SCENARIO_CONTRACT ${path}.then must be an object`);
    return;
  }
  for (const property of ["expectedData", "expectedPermission", "expectedVisibility"]) {
    contractString(errors, outcome, property, `${path}.then`, "INVALID_SCENARIO_CONTRACT");
  }
  const expectedState = outcome.expectedState;
  if (!isRecord(expectedState)) {
    errors.push(`INVALID_SCENARIO_STATE ${path}.then.expectedState must be an object`);
  } else if (expectedState.mode === "STATE") {
    if (!isValidId(expectedState.value)) {
      errors.push(
        `INVALID_SCENARIO_STATE ${path}.then.expectedState.value must be a non-empty state`,
      );
    }
  } else if (expectedState.mode === "UNCHANGED") {
    if (Object.hasOwn(expectedState, "value")) {
      errors.push(
        `INVALID_SCENARIO_STATE ${path}.then.expectedState.value is not allowed for UNCHANGED`,
      );
    }
  } else {
    errors.push(
      `INVALID_SCENARIO_STATE ${path}.then.expectedState.mode must be STATE or UNCHANGED`,
    );
  }
}

function validateModule(errors, module, path) {
  const phaseIsValid = MODULE_PHASES.has(module.phase);
  if (!phaseIsValid) {
    errors.push(`INVALID_MODULE_PHASE ${path}.phase must be 1, 2, or 3`);
  }
  const expectedReleaseStatus = RELEASE_STATUS_BY_PHASE.get(module.phase);
  if (
    !MODULE_RELEASE_STATUSES.has(module.releaseStatus)
    || (phaseIsValid && module.releaseStatus !== expectedReleaseStatus)
  ) {
    errors.push(
      `INVALID_PHASE_RELEASE_STATUS ${path}.releaseStatus=${formatValidationValue(module.releaseStatus)} is not valid for phase=${formatValidationValue(module.phase)}`,
    );
  }
  const strict = module.phase === PHASE.FIRST;
  if (strict) {
    for (const property of ["priority", "title", "objective"]) {
      contractString(errors, module, property, path, "INVALID_MODULE_CONTRACT");
    }
    for (const property of [
      "entryConditions",
      "exitConditions",
      "baselineDecisionIds",
      "nfrIds",
    ]) {
      contractStringArray(
        errors,
        module,
        property,
        path,
        "INVALID_MODULE_CONTRACT",
        { nonEmpty: true },
      );
    }
  }
  const objects = requireArray(errors, module, "objects", path);
  const relationships = strict
    ? contractArray(errors, module, "relationships", path, "INVALID_MODULE_CONTRACT")
    : optionalArray(errors, module, "relationships", path);
  const actions = requireArray(errors, module, "actions", path);
  const pages = requireArray(errors, module, "pages", path);
  const scenarios = requireArray(errors, module, "scenarios", path);
  if (Object.hasOwn(module, "draftPurposeProfiles")) {
    const profiles = contractArray(
      errors,
      module,
      "draftPurposeProfiles",
      path,
      "INVALID_AI_DRAFT_PURPOSE",
      { nonEmpty: true },
    );
    profiles.forEach((profile, index) => {
      validateDraftPurposeProfile(
        errors,
        profile,
        `${path}.draftPurposeProfiles[${index}]`,
      );
    });
  }
  validateEntities(errors, objects, `${path}.objects`, "object", (object, objectPath) => {
    validateObject(errors, object, objectPath, strict);
  });
  validateEntities(
    errors,
    relationships,
    `${path}.relationships`,
    "relationship",
    (relationship, relationshipPath) => {
      validateRelationship(errors, relationship, relationshipPath);
    },
  );
  validateEntities(errors, actions, `${path}.actions`, "action", (action, actionPath) => {
    validateAction(errors, action, actionPath, strict);
  });
  validateEntities(errors, pages, `${path}.pages`, "page", (page, pagePath) => {
    validatePage(errors, page, pagePath, strict);
  });
  validateEntities(errors, scenarios, `${path}.scenarios`, "scenario", (scenario, scenarioPath) => {
    validateScenario(errors, scenario, scenarioPath, strict);
  });
}

function validateFlow(errors, flow, path) {
  contractString(errors, flow, "label", path, "INVALID_FLOW_CONTRACT");
  const specializedProfile = FLOW_CONTRACT_PROFILES.has(flow.contractProfile)
    && flow.contractProfile !== "GENERIC";
  if (!FLOW_CONTRACT_PROFILES.has(flow.contractProfile)) {
    errors.push(
      `INVALID_FLOW_PROFILE ${path}.contractProfile must be GENERIC, LEARNING_PATH_AGGREGATION, or REPORT_MATERIALIZATION`,
    );
  }
  if (specializedProfile) {
    const participantRoles = contractArray(
      errors,
      flow,
      "participantRoles",
      path,
      "INVALID_FLOW_PROFILE",
      { nonEmpty: true },
    );
    const seenModules = new Set();
    const seenRoles = new Set();
    participantRoles.forEach((participant, index) => {
      const participantPath = `${path}.participantRoles[${index}]`;
      const participantKeys = new Set(["moduleId", "role"]);
      if (
        !isRecord(participant)
        || Object.keys(participant).length !== participantKeys.size
        || Object.keys(participant).some((key) => !participantKeys.has(key))
      ) {
        errors.push(
          `INVALID_FLOW_PROFILE ${participantPath} must use the closed moduleId and role shape`,
        );
        return;
      }
      for (const property of ["moduleId", "role"]) {
        contractString(errors, participant, property, participantPath, "INVALID_FLOW_PROFILE");
      }
      if (seenModules.has(participant.moduleId) || seenRoles.has(participant.role)) {
        errors.push(
          `INVALID_FLOW_PROFILE ${participantPath} moduleId and role must be unique`,
        );
      }
      seenModules.add(participant.moduleId);
      seenRoles.add(participant.role);
    });
  } else if (flow.contractProfile === "GENERIC" && Object.hasOwn(flow, "participantRoles")) {
    errors.push(
      `INVALID_FLOW_PROFILE ${path} GENERIC forbids specialized participant roles`,
    );
  }
  if (![1, 2].includes(flow.phase)) {
    errors.push(`INVALID_FLOW_CONTRACT ${path}.phase must be 1 or 2`);
  }
  if (!FLOW_ROUTING_POLICIES.has(flow.routingPolicy)) {
    errors.push(
      `INVALID_FLOW_CONTRACT ${path}.routingPolicy must explicitly be NONE, ACTION_CHOICE_REQUIRED, or OPTION_VALUE_REQUIRED`,
    );
  }
  contractStringArray(
    errors,
    flow,
    "moduleIds",
    path,
    "INVALID_FLOW_CONTRACT",
    { nonEmpty: true },
  );
  if (Object.hasOwn(flow, "sourceOnlyModuleIds")) {
    if (flow.contractProfile !== "LEARNING_PATH_AGGREGATION") {
      errors.push(
        `INVALID_FLOW_PROFILE ${path}.sourceOnlyModuleIds is reserved for LEARNING_PATH_AGGREGATION`,
      );
    }
    const sourceOnlyModuleIds = contractStringArray(
      errors,
      flow,
      "sourceOnlyModuleIds",
      path,
      "INVALID_FLOW_CONTRACT",
      { nonEmpty: true },
    );
    validateUniqueStrings(
      errors,
      sourceOnlyModuleIds,
      `${path}.sourceOnlyModuleIds`,
      "INVALID_FLOW_CONTRACT",
    );
  } else if (flow.contractProfile === "LEARNING_PATH_AGGREGATION") {
    errors.push(
      `INVALID_FLOW_PROFILE ${path}.sourceOnlyModuleIds is required for LEARNING_PATH_AGGREGATION`,
    );
  }
  const steps = contractArray(
    errors,
    flow,
    "steps",
    path,
    "INVALID_FLOW_CONTRACT",
    { nonEmpty: true },
  );
  if (!Array.isArray(flow.steps)) {
    errors.push(`INVALID_ENTITY_SHAPE ${path}.steps must be an array`);
  }
  steps.forEach((step, index) => {
    const stepPath = `${path}.steps[${index}]`;
    if (!isRecord(step)) {
      errors.push(`INVALID_FLOW_CONTRACT ${stepPath} must be an object`);
      return;
    }
    if (step.order !== index + 1) {
      errors.push(`INVALID_FLOW_CONTRACT ${stepPath}.order must be ${index + 1}`);
    }
    contractString(errors, step, "actionId", stepPath, "INVALID_FLOW_CONTRACT");
    if (specializedProfile) {
      contractString(errors, step, "semanticRole", stepPath, "INVALID_FLOW_PROFILE");
    } else if (flow.contractProfile === "GENERIC" && Object.hasOwn(step, "semanticRole")) {
      errors.push(`INVALID_FLOW_PROFILE ${stepPath} GENERIC forbids a semantic role`);
    }
    if (Object.hasOwn(step, "condition") && !isValidId(step.condition)) {
      errors.push(
        `INVALID_FLOW_CONTRACT ${stepPath}.condition must be a non-empty string when present`,
      );
    }
    if (!Object.hasOwn(step, "providedInputs")) return;
    const providedInputs = contractArray(
      errors,
      step,
      "providedInputs",
      stepPath,
      "INVALID_FLOW_CONTRACT",
    );
    const seenFieldIds = new Set();
    providedInputs.forEach((providedInput, providedInputIndex) => {
      const providedInputPath = `${stepPath}.providedInputs[${providedInputIndex}]`;
      if (!isRecord(providedInput)) {
        errors.push(`INVALID_FLOW_CONTRACT ${providedInputPath} must be an object`);
        return;
      }
      const expectedInputKeys = new Set(["fieldId", "provider"]);
      if (
        Object.keys(providedInput).length !== expectedInputKeys.size
        || Object.keys(providedInput).some((key) => !expectedInputKeys.has(key))
      ) {
        errors.push(
          `INVALID_FLOW_CONTRACT ${providedInputPath} must use the closed fieldId and provider shape`,
        );
      }
      contractString(
        errors,
        providedInput,
        "fieldId",
        providedInputPath,
        "INVALID_FLOW_CONTRACT",
      );
      if (seenFieldIds.has(providedInput.fieldId)) {
        errors.push(
          `INVALID_FLOW_CONTRACT ${providedInputPath}.fieldId must be unique within the step`,
        );
      }
      seenFieldIds.add(providedInput.fieldId);

      const provider = providedInput.provider;
      if (!isRecord(provider)) {
        errors.push(`INVALID_FLOW_CONTRACT ${providedInputPath}.provider must be an object`);
        return;
      }
      const subjectProperties = ["actorRef", "roleRef", "dutyRef"]
        .filter((property) => Object.hasOwn(provider, property));
      if (Object.keys(provider).length !== 1 || subjectProperties.length !== 1) {
        errors.push(
          `INVALID_FLOW_CONTRACT ${providedInputPath}.provider requires exactly one actorRef, roleRef, or dutyRef`,
        );
        return;
      }
      const subjectProperty = subjectProperties[0];
      const subject = provider[subjectProperty];
      const validNamespace = (
        (subjectProperty === "actorRef" && SYSTEM_ACTOR_CATEGORIES.has(subject))
        || (
          subjectProperty === "roleRef"
          && typeof subject === "string"
          && subject.startsWith("ROLE-")
        )
        || (
          subjectProperty === "dutyRef"
          && typeof subject === "string"
          && subject.startsWith("DUTY-")
        )
      );
      if (!validNamespace) {
        errors.push(
          `INVALID_FLOW_CONTRACT ${providedInputPath}.provider.${subjectProperty} has the wrong namespace`,
        );
      }
    });
  });
  if (Object.hasOwn(flow, "executionPaths")) {
    const executionPaths = contractArray(
      errors,
      flow,
      "executionPaths",
      path,
      "INVALID_FLOW_CONTRACT",
      { nonEmpty: true },
    );
    const validStepOrders = new Set(
      steps.map((step) => step?.order).filter(Number.isInteger),
    );
    const seenPathIds = new Set();
    const coveredStepOrders = new Set();
    executionPaths.forEach((executionPath, executionPathIndex) => {
      const executionPathPath = `${path}.executionPaths[${executionPathIndex}]`;
      if (!isRecord(executionPath)) {
        errors.push(`INVALID_FLOW_CONTRACT ${executionPathPath} must be an object`);
        return;
      }
      const expectedPathKeys = new Set([
        "id",
        "stepOrders",
        "providedInputs",
        "route",
        "sourceBindings",
        "idempotencyKeyParts",
        ...(specializedProfile ? ["semanticRole"] : []),
      ]);
      if (
        Object.keys(executionPath).some((key) => !expectedPathKeys.has(key))
      ) {
        errors.push(
          `INVALID_FLOW_CONTRACT ${executionPathPath} contains unsupported path contract keys`,
        );
      }
      contractString(
        errors,
        executionPath,
        "id",
        executionPathPath,
        "INVALID_FLOW_CONTRACT",
      );
      if (specializedProfile) {
        contractString(
          errors,
          executionPath,
          "semanticRole",
          executionPathPath,
          "INVALID_FLOW_PROFILE",
        );
      } else if (
        flow.contractProfile === "GENERIC"
        && Object.hasOwn(executionPath, "semanticRole")
      ) {
        errors.push(
          `INVALID_FLOW_PROFILE ${executionPathPath} GENERIC forbids a semantic role`,
        );
      }
      if (seenPathIds.has(executionPath.id)) {
        errors.push(`INVALID_FLOW_CONTRACT ${executionPathPath}.id must be unique`);
      }
      seenPathIds.add(executionPath.id);
      const route = executionPath.route;
      const routePath = `${executionPathPath}.route`;
      if (!isRecord(route)) {
        errors.push(`INVALID_FLOW_CONTRACT ${routePath} must be an object`);
      } else if (route.kind === "OPTION_VALUE") {
        const expectedRouteKeys = new Set([
          "kind",
          "fieldId",
          "values",
          "consumerStepOrder",
        ]);
        if (
          Object.keys(route).length !== expectedRouteKeys.size
          || Object.keys(route).some((key) => !expectedRouteKeys.has(key))
        ) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${routePath} must use the closed OPTION_VALUE route shape`,
          );
        }
        contractString(errors, route, "fieldId", routePath, "INVALID_FLOW_CONTRACT");
        const values = contractStringArray(
          errors,
          route,
          "values",
          routePath,
          "INVALID_FLOW_CONTRACT",
          { nonEmpty: true },
        );
        validateUniqueStrings(
          errors,
          values,
          `${routePath}.values`,
          "INVALID_FLOW_CONTRACT",
        );
        if (!Number.isInteger(route.consumerStepOrder)) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${routePath}.consumerStepOrder must be an integer`,
          );
        }
      } else if (route.kind === "ACTION_CHOICE") {
        const expectedRouteKeys = new Set(["kind", "consumerStepOrder"]);
        if (
          Object.keys(route).length !== expectedRouteKeys.size
          || Object.keys(route).some((key) => !expectedRouteKeys.has(key))
        ) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${routePath} must use the closed ACTION_CHOICE route shape`,
          );
        }
        if (!Number.isInteger(route.consumerStepOrder)) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${routePath}.consumerStepOrder must be an integer`,
          );
        }
      } else {
        errors.push(
          `INVALID_FLOW_CONTRACT ${routePath}.kind must be OPTION_VALUE or ACTION_CHOICE`,
        );
      }
      const stepOrders = contractArray(
        errors,
        executionPath,
        "stepOrders",
        executionPathPath,
        "INVALID_FLOW_CONTRACT",
        { nonEmpty: true },
      );
      const seenStepOrders = new Set();
      stepOrders.forEach((stepOrder, stepOrderIndex) => {
        if (
          !Number.isInteger(stepOrder)
          || !validStepOrders.has(stepOrder)
          || seenStepOrders.has(stepOrder)
          || (stepOrderIndex > 0 && stepOrders[stepOrderIndex - 1] >= stepOrder)
        ) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${executionPathPath}.stepOrders[${stepOrderIndex}] must be a unique ascending declared step order`,
          );
        }
        seenStepOrders.add(stepOrder);
        coveredStepOrders.add(stepOrder);
      });
      const pathProvidedInputs = contractArray(
        errors,
        executionPath,
        "providedInputs",
        executionPathPath,
        "INVALID_FLOW_CONTRACT",
      );
      const seenProvidedInputs = new Set();
      pathProvidedInputs.forEach((providedInput, providedInputIndex) => {
        const providedInputPath = (
          `${executionPathPath}.providedInputs[${providedInputIndex}]`
        );
        if (!isRecord(providedInput)) {
          errors.push(`INVALID_FLOW_CONTRACT ${providedInputPath} must be an object`);
          return;
        }
        const expectedInputKeys = new Set(["stepOrder", "fieldId", "provider"]);
        if (
          Object.keys(providedInput).length !== expectedInputKeys.size
          || Object.keys(providedInput).some((key) => !expectedInputKeys.has(key))
        ) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${providedInputPath} must use the closed stepOrder, fieldId, and provider shape`,
          );
        }
        if (
          !Number.isInteger(providedInput.stepOrder)
          || !seenStepOrders.has(providedInput.stepOrder)
        ) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${providedInputPath}.stepOrder must reference a step on the same path`,
          );
        }
        contractString(
          errors,
          providedInput,
          "fieldId",
          providedInputPath,
          "INVALID_FLOW_CONTRACT",
        );
        const inputKey = `${providedInput.stepOrder}:${providedInput.fieldId}`;
        if (seenProvidedInputs.has(inputKey)) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${providedInputPath} must be unique within the path`,
          );
        }
        seenProvidedInputs.add(inputKey);
        const provider = providedInput.provider;
        if (!isRecord(provider)) {
          errors.push(`INVALID_FLOW_CONTRACT ${providedInputPath}.provider must be an object`);
          return;
        }
        const subjectProperties = ["actorRef", "roleRef", "dutyRef"]
          .filter((property) => Object.hasOwn(provider, property));
        if (Object.keys(provider).length !== 1 || subjectProperties.length !== 1) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${providedInputPath}.provider requires exactly one actorRef, roleRef, or dutyRef`,
          );
          return;
        }
        const subjectProperty = subjectProperties[0];
        const subject = provider[subjectProperty];
        const validNamespace = (
          (subjectProperty === "actorRef" && SYSTEM_ACTOR_CATEGORIES.has(subject))
          || (
            subjectProperty === "roleRef"
            && typeof subject === "string"
            && subject.startsWith("ROLE-")
          )
          || (
            subjectProperty === "dutyRef"
            && typeof subject === "string"
            && subject.startsWith("DUTY-")
          )
        );
        if (!validNamespace) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${providedInputPath}.provider.${subjectProperty} has the wrong namespace`,
          );
        }
      });
      if (Object.hasOwn(executionPath, "sourceBindings")) {
        const sourceBindings = contractArray(
          errors,
          executionPath,
          "sourceBindings",
          executionPathPath,
          "INVALID_FLOW_CONTRACT",
          { nonEmpty: true },
        );
        const seenBindings = new Set();
        sourceBindings.forEach((binding, bindingIndex) => {
          const bindingPath = `${executionPathPath}.sourceBindings[${bindingIndex}]`;
          if (!isRecord(binding)) {
            errors.push(`INVALID_FLOW_CONTRACT ${bindingPath} must be an object`);
            return;
          }
          const bindingKeys = new Set([
            "sourceObjectId",
            "sourceIdentityFieldId",
            "sourceVersionFieldId",
            "consumerStepOrder",
            "targetRefFieldId",
            "targetVersionFieldId",
            "cardinality",
          ]);
          if (
            Object.keys(binding).length !== bindingKeys.size
            || Object.keys(binding).some((key) => !bindingKeys.has(key))
          ) {
            errors.push(
              `INVALID_FLOW_CONTRACT ${bindingPath} must use the closed source lineage binding shape`,
            );
          }
          for (const property of [
            "sourceObjectId",
            "sourceIdentityFieldId",
            "sourceVersionFieldId",
            "targetRefFieldId",
            "targetVersionFieldId",
          ]) {
            contractString(errors, binding, property, bindingPath, "INVALID_FLOW_CONTRACT");
          }
          if (
            !Number.isInteger(binding.consumerStepOrder)
            || !seenStepOrders.has(binding.consumerStepOrder)
          ) {
            errors.push(
              `INVALID_FLOW_CONTRACT ${bindingPath}.consumerStepOrder must reference a step on the same path`,
            );
          }
          if (binding.cardinality !== "ONE") {
            errors.push(`INVALID_FLOW_CONTRACT ${bindingPath}.cardinality must be ONE`);
          }
          const bindingKey = [
            binding.consumerStepOrder,
            binding.targetRefFieldId,
            binding.targetVersionFieldId,
          ].join(":" );
          if (seenBindings.has(bindingKey)) {
            errors.push(`INVALID_FLOW_CONTRACT ${bindingPath} must be unique within the path`);
          }
          seenBindings.add(bindingKey);
        });
      }
      if (Object.hasOwn(executionPath, "idempotencyKeyParts")) {
        const keyParts = executionPath.idempotencyKeyParts;
        const keyPartKeys = new Set([
          "identityFieldIds",
          "versionFieldIds",
          "fanoutFieldId",
        ]);
        if (
          !isRecord(keyParts)
          || Object.keys(keyParts).length !== keyPartKeys.size
          || Object.keys(keyParts).some((key) => !keyPartKeys.has(key))
        ) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${executionPathPath}.idempotencyKeyParts must use the closed identity, version, and fanout shape`,
          );
        } else {
          const identities = contractStringArray(
            errors,
            keyParts,
            "identityFieldIds",
            `${executionPathPath}.idempotencyKeyParts`,
            "INVALID_FLOW_CONTRACT",
            { nonEmpty: true },
          );
          const versions = contractStringArray(
            errors,
            keyParts,
            "versionFieldIds",
            `${executionPathPath}.idempotencyKeyParts`,
            "INVALID_FLOW_CONTRACT",
            { nonEmpty: true },
          );
          validateUniqueStrings(
            errors,
            identities,
            `${executionPathPath}.idempotencyKeyParts.identityFieldIds`,
            "INVALID_FLOW_CONTRACT",
          );
          validateUniqueStrings(
            errors,
            versions,
            `${executionPathPath}.idempotencyKeyParts.versionFieldIds`,
            "INVALID_FLOW_CONTRACT",
          );
          contractString(
            errors,
            keyParts,
            "fanoutFieldId",
            `${executionPathPath}.idempotencyKeyParts`,
            "INVALID_FLOW_CONTRACT",
          );
        }
      }
    });
    for (const stepOrder of validStepOrders) {
      if (!coveredStepOrders.has(stepOrder)) {
        errors.push(
          `INVALID_FLOW_CONTRACT ${path}.executionPaths must cover declared step order ${stepOrder}`,
        );
      }
    }
  }
  if (Object.hasOwn(flow, "systemProvidedInputs")) {
    errors.push(
      `INVALID_FLOW_CONTRACT ${path}.systemProvidedInputs is obsolete; use steps[].providedInputs`,
    );
  }
  for (const property of ["sourceDataRefs", "targetDataRefs"]) {
    const dataRefs = contractArray(
      errors,
      flow,
      property,
      path,
      "INVALID_FLOW_CONTRACT",
      { nonEmpty: true },
    );
    dataRefs.forEach((dataRef, index) => {
      const dataRefPath = `${path}.${property}[${index}]`;
      if (!isRecord(dataRef)) {
        errors.push(`INVALID_FLOW_CONTRACT ${dataRefPath} must be an object`);
        return;
      }
      for (const refProperty of ["objectId", "fieldId", "version"]) {
        contractString(
          errors,
          dataRef,
          refProperty,
          dataRefPath,
          "INVALID_FLOW_CONTRACT",
        );
      }
      if (property === "sourceDataRefs") {
        const expectedKeys = new Set([
          "objectId",
          "fieldId",
          "version",
          "cardinality",
          ...(specializedProfile ? ["semanticRole"] : []),
        ]);
        if (
          Object.keys(dataRef).length !== expectedKeys.size
          || Object.keys(dataRef).some((key) => !expectedKeys.has(key))
        ) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${dataRefPath} must use the closed objectId, fieldId, version, and cardinality shape`,
          );
        }
        if (!SOURCE_DATA_CARDINALITIES.has(dataRef.cardinality)) {
          errors.push(
            `INVALID_FLOW_CONTRACT ${dataRefPath}.cardinality must be ONE or ZERO_MANY`,
          );
        }
      }
      if (specializedProfile) {
        const allowedRoles = property === "sourceDataRefs"
          ? FLOW_SOURCE_SEMANTIC_ROLES
          : FLOW_TARGET_SEMANTIC_ROLES;
        if (!allowedRoles.has(dataRef.semanticRole)) {
          errors.push(
            `INVALID_FLOW_PROFILE ${dataRefPath}.semanticRole is not registered for ${property}`,
          );
        }
      } else if (
        flow.contractProfile === "GENERIC"
        && Object.hasOwn(dataRef, "semanticRole")
      ) {
        errors.push(`INVALID_FLOW_PROFILE ${dataRefPath} GENERIC forbids a semantic role`);
      }
    });
  }
  contractString(errors, flow, "failureGranularity", path, "INVALID_FLOW_CONTRACT");
  if (Object.hasOwn(flow, "idempotencyKey")) {
    errors.push(
      `INVALID_FLOW_CONTRACT ${path}.idempotencyKey is obsolete; use idempotencyKeyParts`,
    );
  }
  const idempotencyKeyParts = requireRecord(errors, flow, "idempotencyKeyParts", path);
  if (!idempotencyKeyParts) {
    errors.push(`INVALID_FLOW_CONTRACT ${path}.idempotencyKeyParts must be an object`);
  } else {
    const expectedKeys = new Set([
      "identityFieldIds",
      "versionFieldIds",
      "fanoutFieldId",
    ]);
    if (
      Object.keys(idempotencyKeyParts).length !== expectedKeys.size
      || Object.keys(idempotencyKeyParts).some((key) => !expectedKeys.has(key))
    ) {
      errors.push(
        `INVALID_FLOW_CONTRACT ${path}.idempotencyKeyParts must use the closed identity/version/fanout shape`,
      );
    }
    const identityFieldIds = contractStringArray(
      errors,
      idempotencyKeyParts,
      "identityFieldIds",
      `${path}.idempotencyKeyParts`,
      "INVALID_FLOW_CONTRACT",
      { nonEmpty: true },
    );
    const versionFieldIds = contractStringArray(
      errors,
      idempotencyKeyParts,
      "versionFieldIds",
      `${path}.idempotencyKeyParts`,
      "INVALID_FLOW_CONTRACT",
      { nonEmpty: true },
    );
    validateUniqueStrings(
      errors,
      identityFieldIds,
      `${path}.idempotencyKeyParts.identityFieldIds`,
      "INVALID_FLOW_CONTRACT",
    );
    validateUniqueStrings(
      errors,
      versionFieldIds,
      `${path}.idempotencyKeyParts.versionFieldIds`,
      "INVALID_FLOW_CONTRACT",
    );
    contractString(
      errors,
      idempotencyKeyParts,
      "fanoutFieldId",
      `${path}.idempotencyKeyParts`,
      "INVALID_FLOW_CONTRACT",
    );
  }
  const retryPolicy = requireRecord(errors, flow, "retryPolicy", path);
  if (!retryPolicy) {
    errors.push(`INVALID_FLOW_CONTRACT ${path}.retryPolicy must be an object`);
  } else {
    contractString(
      errors,
      retryPolicy,
      "strategy",
      `${path}.retryPolicy`,
      "INVALID_FLOW_CONTRACT",
    );
    if (!Number.isInteger(retryPolicy.maxAttempts) || retryPolicy.maxAttempts < 1) {
      errors.push(
        `INVALID_FLOW_CONTRACT ${path}.retryPolicy.maxAttempts must be a positive integer`,
      );
    }
    contractStringArray(
      errors,
      retryPolicy,
      "retryableFailureResults",
      `${path}.retryPolicy`,
      "INVALID_FLOW_CONTRACT",
    );
  }
  const compensation = requireRecord(errors, flow, "compensation", path);
  if (!compensation) {
    errors.push(`INVALID_FLOW_CONTRACT ${path}.compensation must be an object`);
  } else {
    for (const property of ["strategy", "description"]) {
      contractString(
        errors,
        compensation,
        property,
        `${path}.compensation`,
        "INVALID_FLOW_CONTRACT",
      );
    }
  }
  const invalidation = requireRecord(errors, flow, "downstreamInvalidation", path);
  if (!invalidation) {
    errors.push(`INVALID_FLOW_CONTRACT ${path}.downstreamInvalidation must be an object`);
  } else {
    contractString(
      errors,
      invalidation,
      "strategy",
      `${path}.downstreamInvalidation`,
      "INVALID_FLOW_CONTRACT",
    );
    contractStringArray(
      errors,
      invalidation,
      "targets",
      `${path}.downstreamInvalidation`,
      "INVALID_FLOW_CONTRACT",
    );
  }
}

function validateAiTask(errors, task, path) {
  const code = "INVALID_AI_TASK_CONTRACT";
  requireArray(errors, task, "previewFieldIds", path);
  if (!AI_TASK_TYPES.has(task.taskType)) {
    errors.push(`${code} ${path}.taskType must be a registered AI task type`);
  }
  const roleRefs = contractStringArray(errors, task, "roleRefs", path, code);
  const dutyRefs = contractStringArray(errors, task, "dutyRefs", path, code);
  if (roleRefs.length + dutyRefs.length === 0) {
    errors.push(`${code} ${path} requires at least one role or duty`);
  }
  contractStringArray(errors, task, "clients", path, code, { nonEmpty: true })
    .forEach((client) => {
      if (isValidId(client) && !CLIENTS.has(client)) {
        errors.push(`${code} ${path}.clients contains unsupported ${client}`);
      }
    });
  contractStringArray(
    errors,
    task,
    "naturalLanguageExamples",
    path,
    code,
    { nonEmpty: true },
  );
  contractString(errors, task, "actionId", path, code);
  contractString(errors, task, "capability", path, code);
  if (!AI_CAPABILITIES.has(task.capability)) {
    errors.push(`${code} ${path}.capability must be a registered AI capability`);
  }
  if (task.taskType === "DRAFT") {
    validateDraftPurpose(errors, task.draftPurpose, `${path}.draftPurpose`, code);
  } else if (Object.hasOwn(task, "draftPurpose")) {
    errors.push(`${code} ${path}.draftPurpose is allowed only for DRAFT tasks`);
  }
  if (!RISKS.has(task.risk)) {
    errors.push(`${code} ${path}.risk must be READ, LOW, or HIGH`);
  }
  if (typeof task.writes !== "boolean") {
    errors.push(`${code} ${path}.writes must be boolean`);
  }
  contractStringArray(errors, task, "previewFieldIds", path, code);

  const validateSchemaNode = (schema, schemaPath, { root = false } = {}) => {
    if (!isRecord(schema)) {
      errors.push(`${code} ${schemaPath} must be a schema object`);
      return;
    }
    if (!JSON_SCHEMA_TYPES.has(schema.type)) {
      errors.push(`${code} ${schemaPath}.type must be a supported JSON schema type`);
      return;
    }
    if (root && schema.type !== "object") {
      errors.push(`${code} ${schemaPath}.type must be object`);
    }

    if (schema.type === "array") {
      if (!isRecord(schema.items)) {
        errors.push(`${code} ${schemaPath}.items must be a schema object`);
      } else {
        validateSchemaNode(schema.items, `${schemaPath}.items`);
      }
    }

    if (schema.type === "object") {
      let properties;
      if (Object.hasOwn(schema, "properties")) {
        if (!isRecord(schema.properties)) {
          errors.push(`${code} ${schemaPath}.properties must be an object`);
        } else {
          properties = schema.properties;
          for (const [property, propertySchema] of Object.entries(properties)) {
            validateSchemaNode(propertySchema, `${schemaPath}.properties.${property}`);
          }
        }
      } else if (root) {
        errors.push(`${code} ${schemaPath}.properties must be an object`);
      }

      const required = Object.hasOwn(schema, "required") || root
        ? contractStringArray(errors, schema, "required", schemaPath, code)
        : [];
      for (const property of required) {
        if (!properties || !Object.hasOwn(properties, property)) {
          errors.push(`${code} ${schemaPath}.required references missing ${property}`);
        }
      }
    }

    if (root && schema.additionalProperties !== false) {
      errors.push(`${code} ${schemaPath}.additionalProperties must be false`);
    }
  };
  validateSchemaNode(task.parameterSchema, `${path}.parameterSchema`, { root: true });
  validateSchemaNode(task.resultSchema, `${path}.resultSchema`, { root: true });

  const clarificationRules = contractArray(
    errors,
    task,
    "clarificationRules",
    path,
    code,
    { nonEmpty: true },
  );
  const blockingMissingParameters = [];
  clarificationRules.forEach((rule, index) => {
    const rulePath = `${path}.clarificationRules[${index}]`;
    if (!isRecord(rule)) {
      errors.push(`${code} ${rulePath} must be an object`);
      return;
    }
    const whenMissing = contractStringArray(
      errors,
      rule,
      "whenMissing",
      rulePath,
      code,
      { nonEmpty: true },
    );
    if (rule.blocksExecution === true) {
      blockingMissingParameters.push(...whenMissing);
    }
    const parameterProperties = isRecord(task.parameterSchema?.properties)
      ? task.parameterSchema.properties
      : {};
    for (const parameter of whenMissing) {
      if (!Object.hasOwn(parameterProperties, parameter)) {
        errors.push(`${code} ${rulePath}.whenMissing references missing ${parameter}`);
      }
    }
    contractString(errors, rule, "prompt", rulePath, code);
    if (rule.blocksExecution !== true) {
      errors.push(`${code} ${rulePath}.blocksExecution must be true`);
    }
  });
  const requiredParameters = Array.isArray(task.parameterSchema?.required)
    ? task.parameterSchema.required.filter(isValidId)
    : [];
  const blockingMissingSet = new Set(blockingMissingParameters);
  if (
    blockingMissingSet.size !== blockingMissingParameters.length
    || blockingMissingSet.size !== requiredParameters.length
    || requiredParameters.some((parameter) => !blockingMissingSet.has(parameter))
  ) {
    errors.push(
      `${code} ${path}.clarificationRules blocking whenMissing union must exactly cover parameterSchema.required without duplicates`,
    );
  }

  const confirmer = task.confirmer;
  if (!isRecord(confirmer) || !["DUTY", "ROLE", "NOT_REQUIRED"].includes(confirmer.mode)) {
    errors.push(`${code} ${path}.confirmer must declare DUTY, ROLE, or NOT_REQUIRED mode`);
  } else {
    const expectedKeys = confirmer.mode === "DUTY"
      ? ["mode", "dutyRef"]
      : confirmer.mode === "ROLE"
        ? ["mode", "roleRef"]
        : ["mode"];
    if (
      Object.keys(confirmer).length !== expectedKeys.length
      || expectedKeys.some((property) => !Object.hasOwn(confirmer, property))
    ) {
      errors.push(`${code} ${path}.confirmer must use the closed ${confirmer.mode} shape`);
    }
    if (confirmer.mode === "DUTY" && !isValidId(confirmer.dutyRef)) {
      errors.push(`${code} ${path}.confirmer.dutyRef must be a non-empty duty ID`);
    }
    if (confirmer.mode === "ROLE" && !isValidId(confirmer.roleRef)) {
      errors.push(`${code} ${path}.confirmer.roleRef must be a non-empty role ID`);
    }
  }
  if (task.writes === true) {
    contractString(errors, task, "confirmerRef", path, code);
    const structuredRef = confirmer?.mode === "DUTY"
      ? confirmer.dutyRef
      : confirmer?.mode === "ROLE"
        ? confirmer.roleRef
        : undefined;
    if (isValidId(task.confirmerRef) && task.confirmerRef !== structuredRef) {
      errors.push(`${code} ${path}.confirmerRef must match the structured confirmer`);
    }
  } else if (Object.hasOwn(task, "confirmerRef")) {
    errors.push(`${code} ${path}.confirmerRef is not allowed when confirmation is not required`);
  }

  const failureBehavior = task.failureBehavior;
  if (
    !isRecord(failureBehavior)
    || failureBehavior.mode !== "FAIL_CLOSED"
    || failureBehavior.preservesBusinessFacts !== true
    || !isValidId(failureBehavior.manualFallback)
  ) {
    errors.push(`${code} ${path}.failureBehavior must fail closed and preserve business facts`);
  }
  const reversibility = task.reversibility;
  if (
    !isRecord(reversibility)
    || !["NOT_APPLICABLE", "TARGET_ACTION_POLICY"].includes(reversibility.mode)
    || !isValidId(reversibility.instructions)
  ) {
    errors.push(`${code} ${path}.reversibility must declare an explicit supported policy`);
  }
}

function validateUniqueStrings(errors, values, path, errorCode) {
  const seen = new Set();
  let valid = values.length > 0;
  values.forEach((value, index) => {
    if (!isValidId(value) || seen.has(value)) {
      valid = false;
      errors.push(`${errorCode} ${path}[${index}] must be a unique non-empty string`);
    }
    if (isValidId(value)) seen.add(value);
  });
  if (!valid && values.length === 0) {
    errors.push(`${errorCode} ${path} must be a non-empty array of unique strings`);
  }
}

function validateOptionSet(errors, optionSet, path) {
  requireString(errors, optionSet, "key", path);
  requireString(errors, optionSet, "label", path);
  if (!OPTION_SET_MODES.has(optionSet.mode)) {
    errors.push(
      `INVALID_ENTITY_SHAPE ${path}.mode must be STATIC or RUNTIME_QUERY`,
    );
  }

  const values = requireArray(errors, optionSet, "values", path);
  if (optionSet.mode === "STATIC") {
    if (values.length === 0) {
      errors.push(`INVALID_ENTITY_SHAPE ${path}.values must be non-empty for STATIC`);
    }
    const codes = new Set();
    const labels = new Set();
    values.forEach((value, index) => {
      const valuePath = `${path}.values[${index}]`;
      if (!isRecord(value)) {
        errors.push(`INVALID_ENTITY_SHAPE ${valuePath} Option Set value must be an object`);
        return;
      }
      requireString(errors, value, "code", valuePath);
      requireString(errors, value, "label", valuePath);
      if (optionSet.key === "questionType" && typeof value.isSubjective !== "boolean") {
        errors.push(
          `INVALID_ENTITY_SHAPE ${valuePath}.isSubjective must be a boolean`,
        );
      }
      if (
        (isValidId(value.code) && codes.has(value.code))
        || (isValidId(value.label) && labels.has(value.label))
      ) {
        errors.push(
          `DUPLICATE_OPTION_SET_VALUE ${valuePath} repeats a code or label`,
        );
      }
      if (isValidId(value.code)) codes.add(value.code);
      if (isValidId(value.label)) labels.add(value.label);
    });
    return;
  }

  if (optionSet.mode !== "RUNTIME_QUERY") return;
  if (values.length > 0) {
    errors.push(
      `INVALID_ENTITY_SHAPE ${path}.values must be empty for RUNTIME_QUERY`,
    );
  }
  const source = requireRecord(errors, optionSet, "source", path);
  if (!source) return;
  requireString(errors, source, "queryId", `${path}.source`);
  if (!RUNTIME_QUERY_ID_KINDS.has(source.idKind)) {
    errors.push(
      `INVALID_ENTITY_SHAPE ${path}.source.idKind must be OBJECT_ID or ACTION_ID`,
    );
  }
  const expectedValueField = source.idKind === "ACTION_ID" ? "actionId" : "objectId";
  if (source.valueField !== expectedValueField) {
    errors.push(
      `INVALID_ENTITY_SHAPE ${path}.source.valueField must match ${formatValidationValue(source.idKind)}`,
    );
  }
  if (source.labelField !== "displayName") {
    errors.push(
      `INVALID_ENTITY_SHAPE ${path}.source.labelField must be displayName`,
    );
  }
  if (source.labelSnapshot !== true) {
    errors.push(
      `INVALID_ENTITY_SHAPE ${path}.source.labelSnapshot must be true`,
    );
  }
  const filterContext = requireArray(
    errors,
    source,
    "filterContext",
    `${path}.source`,
  );
  validateUniqueStrings(
    errors,
    filterContext,
    `${path}.source.filterContext`,
    "INVALID_ENTITY_SHAPE",
  );
}

function validateMetricSeries(errors, metric, path) {
  if (!Object.hasOwn(metric, "series")) return;
  if (!Array.isArray(metric.series)) {
    errors.push(`INVALID_METRIC_SERIES ${path}.series must be an array`);
    return;
  }
  metric.series.forEach((series, index) => {
    const seriesPath = `${path}.series[${index}]`;
    if (!isRecord(series)) {
      errors.push(`INVALID_METRIC_SERIES ${seriesPath} must be an object`);
      return;
    }
    for (const property of [
      "id",
      "startEventId",
      "successEventId",
      "correlationKey",
    ]) {
      if (!isValidId(series[property])) {
        errors.push(
          `INVALID_METRIC_SERIES ${seriesPath}.${property} must be a non-empty string`,
        );
      }
    }
    if (series.target !== "100%") {
      errors.push(`INVALID_METRIC_SERIES ${seriesPath}.target must be 100%`);
    }
  });
}

function validateExtension(errors, extension, path) {
  for (const property of Object.keys(extension)) {
    if (EXTENSION_EXECUTABLE_KEYS.has(property)) continue;
    if (!EXTENSION_ALLOWED_KEYS.has(property)) {
      errors.push(`INVALID_EXTENSION_SCHEMA ${path}.${property} is not allowed`);
    }
  }
  if (!isValidId(extension.label)) {
    errors.push(`INVALID_EXTENSION_SCHEMA ${path}.label must be a non-empty string`);
  }
  if (extension.phase !== 2) {
    errors.push(`INVALID_EXTENSION_SCHEMA ${path}.phase must be 2`);
  }
  if (extension.status !== "REGISTERED_ONLY") {
    errors.push(
      `INVALID_EXTENSION_SCHEMA ${path}.status must be REGISTERED_ONLY`,
    );
  }
  for (const property of [
    "dependencies",
    "entryCriteria",
    "excludedFirstStageBehavior",
  ]) {
    if (!Array.isArray(extension[property])) {
      errors.push(`INVALID_EXTENSION_SCHEMA ${path}.${property} must be an array`);
      continue;
    }
    validateUniqueStrings(
      errors,
      extension[property],
      `${path}.${property}`,
      "INVALID_EXTENSION_SCHEMA",
    );
  }
}

function validateBaselineDecision(errors, decision, path) {
  requireString(errors, decision, "statement", path);
  requireString(errors, decision, "rationale", path);
  requireTrue(errors, decision, "immutable", path);
}

function validateLifecyclePolicy(errors, policy, path) {
  for (const property of [
    "scope",
    "writeRule",
    "historyRule",
    "retentionOwner",
    "expiryOrArchival",
  ]) {
    requireString(errors, policy, property, path);
  }
}

function validateSensitivity(errors, sensitivity, path) {
  requireString(errors, sensitivity, "label", path);
  requireString(errors, sensitivity, "handlingRule", path);
}

function validateEvent(errors, event, path) {
  requireString(errors, event, "label", path);
  requireString(errors, event, "definition", path);
  if (Object.hasOwn(event, "triggeredActionIds")) {
    const triggeredActionIds = requireArray(errors, event, "triggeredActionIds", path);
    validateUniqueStrings(
      errors,
      triggeredActionIds,
      `${path}.triggeredActionIds`,
      "INVALID_ENTITY_SHAPE",
    );
  }
  if (Object.hasOwn(event, "producerActionIds")) {
    const producerActionIds = contractStringArray(
      errors,
      event,
      "producerActionIds",
      path,
      "INVALID_ENTITY_SHAPE",
      { nonEmpty: true },
    );
    validateUniqueStrings(
      errors,
      producerActionIds,
      `${path}.producerActionIds`,
      "INVALID_ENTITY_SHAPE",
    );
  }
}

function validateNfr(errors, nfr, path) {
  requireString(errors, nfr, "statement", path);
  requireString(errors, nfr, "verification", path);
}

function validateModelShape(model) {
  const errors = [];
  const productionMarkerIds = new Set(["ACC-001", "ORG-001", "IAM-001", "DGV-001", "AUD-001"]);
  const hasProductionMarker = (Array.isArray(model.modules) ? model.modules : [])
    .some((module) => isRecord(module) && productionMarkerIds.has(module.id));
  if (!["GENERIC", "ZHIXU_V2"].includes(model.profile)) {
    errors.push("INVALID_MODEL_PROFILE model.profile must be GENERIC or ZHIXU_V2");
  } else if (hasProductionMarker && model.profile !== "ZHIXU_V2") {
    errors.push("INVALID_MODEL_PROFILE production foundation modules require ZHIXU_V2");
  }
  for (const property of REQUIRED_MODEL_COLLECTIONS) {
    if (!Array.isArray(model[property])) {
      const code = BASELINE_V2_MODEL_COLLECTIONS.has(property)
        ? "MISSING_REQUIRED_COLLECTION"
        : "MISSING_MODEL_COLLECTION";
      errors.push(`${code} ${property} must be an array`);
    }
  }

  if (Array.isArray(model.baselineDecisions)) {
    validateEntities(
      errors,
      model.baselineDecisions,
      "baselineDecisions",
      "baseline decision",
      (decision, path) => validateBaselineDecision(errors, decision, path),
    );
  }
  if (Array.isArray(model.roles)) {
    validateEntities(errors, model.roles, "roles", "role");
  }
  if (Array.isArray(model.duties)) {
    validateEntities(errors, model.duties, "duties", "duty", (duty, path) => {
      if (!isValidId(duty.roleId)) {
        errors.push(
          `INVALID_ENTITY_SHAPE ${path}.roleId must be a non-empty string`,
        );
      }
    });
  }
  if (Array.isArray(model.lifecyclePolicies)) {
    validateEntities(
      errors,
      model.lifecyclePolicies,
      "lifecyclePolicies",
      "lifecycle policy",
      (policy, path) => validateLifecyclePolicy(errors, policy, path),
    );
  }
  if (Array.isArray(model.sensitivities)) {
    validateEntities(
      errors,
      model.sensitivities,
      "sensitivities",
      "sensitivity",
      (sensitivity, path) => validateSensitivity(errors, sensitivity, path),
    );
  }
  if (Array.isArray(model.optionSets)) {
    validateEntities(
      errors,
      model.optionSets,
      "optionSets",
      "Option Set",
      (optionSet, path) => {
        validateOptionSet(errors, optionSet, path);
      },
    );
    const firstByKey = new Map();
    const firstByQueryId = new Map();
    model.optionSets.forEach((optionSet, index) => {
      if (!isRecord(optionSet)) return;
      if (isValidId(optionSet.key)) {
        if (firstByKey.has(optionSet.key)) {
          errors.push(
            `DUPLICATE_OPTION_SET_KEY optionSets[${index}].key -> ${optionSet.key}`,
          );
        } else {
          firstByKey.set(optionSet.key, index);
        }
      }
      const queryId = optionSet.mode === "RUNTIME_QUERY"
        ? optionSet.source?.queryId
        : undefined;
      if (isValidId(queryId)) {
        if (firstByQueryId.has(queryId)) {
          errors.push(
            `DUPLICATE_RUNTIME_QUERY optionSets[${index}].source.queryId -> ${queryId}`,
          );
        } else {
          firstByQueryId.set(queryId, index);
        }
      }
    });
  }
  if (Array.isArray(model.events)) {
    validateEntities(errors, model.events, "events", "event", (event, path) => {
      validateEvent(errors, event, path);
    });
  }
  if (Array.isArray(model.metrics)) {
    validateEntities(errors, model.metrics, "metrics", "metric", (metric, path) => {
      for (const property of [
        "ownerRef",
        "scope",
        "aggregation",
        "exclusions",
        "window",
      ]) {
        requireString(errors, metric, property, path);
      }
      if (Object.hasOwn(metric, "correlationKey")) {
        requireString(errors, metric, "correlationKey", path);
      }
      const eventIds = requireArray(errors, metric, "eventIds", path);
      eventIds.forEach((eventId, index) => {
        if (!isValidId(eventId)) {
          errors.push(
            `INVALID_ENTITY_SHAPE ${path}.eventIds[${index}] must be a non-empty string`,
          );
        }
      });
      validateMetricSeries(errors, metric, path);
    });
  }
  if (Array.isArray(model.nfrs)) {
    validateEntities(errors, model.nfrs, "nfrs", "NFR", (nfr, path) => {
      validateNfr(errors, nfr, path);
    });
  }
  if (Array.isArray(model.modules)) {
    validateEntities(errors, model.modules, "modules", "module", (module, path) => {
      validateModule(errors, module, path);
    });
  }
  if (Array.isArray(model.flows)) {
    validateEntities(errors, model.flows, "flows", "Flow", (flow, path) => {
      validateFlow(errors, flow, path);
    });
  }
  if (Array.isArray(model.aiTasks)) {
    validateEntities(errors, model.aiTasks, "aiTasks", "AI task", (task, path) => {
      validateAiTask(errors, task, path);
    });
  }
  if (Array.isArray(model.extensions)) {
    validateEntities(
      errors,
      model.extensions,
      "extensions",
      "extension",
      (extension, path) => {
        validateExtension(errors, extension, path);
      },
    );
  }
  return errors;
}

export function prepareRequirementModel(input) {
  if (input === null || typeof input !== "object") {
    return {
      errors: ["INVALID_MODEL requirement model must be an object"],
      model: null,
    };
  }

  let inputIsArray;
  try {
    inputIsArray = Array.isArray(input);
  } catch {
    return {
      errors: ["MALFORMED_MODEL model cannot be classified safely"],
      model: null,
    };
  }
  if (inputIsArray) {
    return {
      errors: ["INVALID_MODEL requirement model must be an object"],
      model: null,
    };
  }

  const errors = [];
  const model = cloneStructuredData(input, "model", new WeakSet(), errors) ?? {};
  errors.push(...validateModelShape(model));
  return { errors, model };
}
