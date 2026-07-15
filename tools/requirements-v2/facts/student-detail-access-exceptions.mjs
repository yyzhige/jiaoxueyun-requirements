export const STUDENT_DETAIL_ACCESS_EXCEPTION_KIND = "AUD_SESSION_STUDENT_DETAIL";

const exceptionBindings = [
  {
    exceptionKind: STUDENT_DETAIL_ACCESS_EXCEPTION_KIND,
    moduleId: "PLAT-001",
    actionId: "PLAT-ACT-CREATE-SUPPORT-CASE",
    targetObjectId: "PLAT-OBJ-SUPPORT-CASE",
    operationKind: "CREATE",
    executionMode: "USER_TASK",
  },
  {
    exceptionKind: STUDENT_DETAIL_ACCESS_EXCEPTION_KIND,
    moduleId: "PLAT-001",
    actionId: "PLAT-ACT-USE-SUPPORT-ACCESS",
    targetObjectId: "PLAT-OBJ-SUPPORT-CASE",
    operationKind: "READ",
    executionMode: "USER_TASK",
  },
].map((binding) => Object.freeze(binding));

const bindingByActionId = new Map(exceptionBindings.map((binding) => [
  binding.actionId,
  binding,
]));

export function resolveStudentDetailAccessException(actionId) {
  return bindingByActionId.get(actionId) ?? null;
}
