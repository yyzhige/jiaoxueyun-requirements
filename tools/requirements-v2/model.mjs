export const PHASE = Object.freeze({ FIRST: 1, SECOND: 2 });
export const RISK = Object.freeze({ READ: "READ", LOW: "LOW", HIGH: "HIGH" });
export const CLIENT = Object.freeze({ WEB: "WEB", APP: "APP" });

export function defineModule(value) {
  return structuredClone(value);
}

export function defineRequirementModel(value) {
  return structuredClone(value);
}
