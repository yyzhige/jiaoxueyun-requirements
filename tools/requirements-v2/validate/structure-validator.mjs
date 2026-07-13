const REQUIRED_MODEL_COLLECTIONS = [
  "roles",
  "duties",
  "optionSets",
  "metrics",
  "modules",
  "flows",
  "aiTasks",
  "extensions",
];

const MAX_TRAVERSAL_DEPTH = 64;

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

function validateField(errors, field, path) {
  requireRecord(errors, field, "valueSource", path);
}

function validateObject(errors, object, path) {
  requireArray(errors, object, "states", path);
  const fields = requireArray(errors, object, "fields", path);
  validateEntities(errors, fields, `${path}.fields`, "field", (field, fieldPath) => {
    validateField(errors, field, fieldPath);
  });
}

function validateAction(errors, action, path) {
  requireArray(errors, action, "inputFieldIds", path);
  requireArray(errors, action, "outputFieldIds", path);
  const permissions = requireArray(errors, action, "permissions", path);
  validateObjectMembers(errors, permissions, `${path}.permissions`, "permission");
  requireArray(errors, action, "scenarioIds", path);
  if (Object.hasOwn(action, "transition") && !isRecord(action.transition)) {
    errors.push(`INVALID_ENTITY_SHAPE ${path}.transition must be an object`);
  }
}

function validatePage(errors, page, path) {
  requireArray(errors, page, "fieldIds", path);
  requireArray(errors, page, "actionIds", path);
  optionalArray(errors, page, "objectIds", path);
}

function validateModule(errors, module, path) {
  if (![1, 2].includes(module.phase)) {
    errors.push(`INVALID_MODULE_PHASE ${path}.phase must be 1 or 2`);
  }
  const objects = requireArray(errors, module, "objects", path);
  const actions = requireArray(errors, module, "actions", path);
  const pages = requireArray(errors, module, "pages", path);
  const scenarios = requireArray(errors, module, "scenarios", path);
  validateEntities(errors, objects, `${path}.objects`, "object", (object, objectPath) => {
    validateObject(errors, object, objectPath);
  });
  validateEntities(errors, actions, `${path}.actions`, "action", (action, actionPath) => {
    validateAction(errors, action, actionPath);
  });
  validateEntities(errors, pages, `${path}.pages`, "page", (page, pagePath) => {
    validatePage(errors, page, pagePath);
  });
  validateEntities(errors, scenarios, `${path}.scenarios`, "scenario");
}

function validateFlow(errors, flow, path) {
  requireArray(errors, flow, "moduleIds", path);
  const steps = requireArray(errors, flow, "steps", path);
  validateObjectMembers(errors, steps, `${path}.steps`, "Flow step");
}

function validateAiTask(errors, task, path) {
  requireArray(errors, task, "previewFieldIds", path);
  for (const property of [
    "actorRefs",
    "roleRefs",
    "dutyRefs",
    "actorIds",
    "roleIds",
    "dutyIds",
  ]) {
    optionalArray(errors, task, property, path);
  }
}

function validateExtension(errors, extension, path) {
  for (const property of [
    "pageIds",
    "actionIds",
    "pages",
    "actions",
    "dependencies",
  ]) {
    optionalArray(errors, extension, property, path);
  }
}

function validateModelShape(model) {
  const errors = [];
  for (const property of REQUIRED_MODEL_COLLECTIONS) {
    if (!Array.isArray(model[property])) {
      errors.push(`MISSING_MODEL_COLLECTION ${property} must be an array`);
    }
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
  if (Array.isArray(model.optionSets)) {
    validateEntities(
      errors,
      model.optionSets,
      "optionSets",
      "Option Set",
      (optionSet, path) => {
        const values = requireArray(errors, optionSet, "values", path);
        validateObjectMembers(errors, values, `${path}.values`, "Option Set value");
      },
    );
  }
  if (Array.isArray(model.metrics)) {
    validateEntities(errors, model.metrics, "metrics", "metric", (metric, path) => {
      requireArray(errors, metric, "eventIds", path);
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
