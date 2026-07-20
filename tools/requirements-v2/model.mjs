export const PHASE = Object.freeze({ FIRST: 1, SECOND: 2, THIRD: 3 });
export const RELEASE_STATUS = Object.freeze({
  BUILD_READY: "BUILD_READY",
  PLANNED: "PLANNED",
});
export const RISK = Object.freeze({ READ: "READ", LOW: "LOW", HIGH: "HIGH" });
export const CLIENT = Object.freeze({ WEB: "WEB", APP: "APP" });

export function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

export const MODEL_COLLECTIONS = deepFreeze([
  { key: "baselineDecisions", label: "baseline decision" },
  { key: "roles", label: "role" },
  { key: "duties", label: "duty" },
  { key: "lifecyclePolicies", label: "lifecycle policy" },
  { key: "sensitivities", label: "sensitivity" },
  { key: "optionSets", label: "Option Set" },
  { key: "events", label: "event" },
  { key: "metrics", label: "metric" },
  { key: "nfrs", label: "NFR" },
  { key: "modules", label: "module" },
  { key: "flows", label: "Flow" },
  { key: "aiTasks", label: "AI task" },
  { key: "extensions", label: "extension" },
  { key: "phases", label: "phase" },
  { key: "productDecisions", label: "product decision" },
  { key: "baselineChapters", label: "baseline chapter" },
  { key: "migrationChanges", label: "migration change" },
  { key: "metricGroups", label: "metric group" },
  { key: "launchGates", label: "launch gate" },
]);

export function defineModule(value) {
  return deepFreeze(structuredClone(value));
}

export function defineRequirementModel(value) {
  return deepFreeze(structuredClone(value));
}
