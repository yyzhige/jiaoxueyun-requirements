function scalar(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (["number", "boolean", "bigint"].includes(typeof value)) return String(value);
  return JSON.stringify(value);
}

export function escapeMarkdownCell(value) {
  return scalar(value)
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>");
}

export function markdownTable(headers, rows) {
  const safeHeaders = headers.map(escapeMarkdownCell);
  return [
    `| ${safeHeaders.join(" | ")} |`,
    `| ${safeHeaders.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => (
      `| ${headers.map((_, index) => escapeMarkdownCell(row[index])).join(" | ")} |`
    )),
  ].join("\n");
}

export function markdownList(items, emptyText = "（无）") {
  if (!Array.isArray(items) || items.length === 0) return `- ${emptyText}`;
  return items.map((item) => `- ${scalar(item)}`).join("\n");
}

export function inlineCode(value) {
  const text = scalar(value);
  const fence = text.includes("`") ? "``" : "`";
  return `${fence}${text}${fence}`;
}

export function joinIds(values, emptyText = "—") {
  if (!Array.isArray(values) || values.length === 0) return emptyText;
  return values.map(inlineCode).join("、");
}

export function stateText(value) {
  if (Array.isArray(value)) return value.join(" / ");
  return scalar(value) || "—";
}

export function actorText(permission) {
  if (!permission || typeof permission !== "object") return "—";
  return permission.actorRef ?? permission.roleRef ?? permission.dutyRef ?? "—";
}

export function permissionScopeText(scope) {
  if (!scope || typeof scope !== "object") return "—";
  if (["OWN_RECORD", "OTHER_RECORD"].includes(scope.kind)) {
    return `${scope.kind}:${scope.subjectFieldId}`;
  }
  if (scope.kind === "ASSIGNED_SUBJECT_COURSE") {
    return `${scope.kind}:subject=${scope.subjectMatch};course=${scope.courseMatch}`;
  }
  return JSON.stringify(scope);
}

export function professionalAuthorizationText(action) {
  if (!action || typeof action !== "object") return "—";
  if (action.authorizationBoundary) {
    return `authorizationBoundary:kind=${action.authorizationBoundary.kind}`;
  }
  if (action.professionalWriteException) {
    return [
      `professionalWriteException:kind=${action.professionalWriteException.kind}`,
      `contract=${action.professionalWriteException.purpose}`,
    ].join(";");
  }
  return "—";
}

export function requiredText(required) {
  if (required === true) return "是";
  if (required === false) return "否";
  if (!required || typeof required !== "object") return "—";
  return [
    required.description,
    Array.isArray(required.whenStates) ? `状态=${required.whenStates.join("/")}` : undefined,
    Array.isArray(required.whenActionIds) ? `动作=${required.whenActionIds.join("/")}` : undefined,
  ].filter(Boolean).join("；");
}

export function valueSourceText(valueSource) {
  if (!valueSource || typeof valueSource !== "object") return "—";
  const reference = valueSource.optionSetId
    ?? valueSource.queryId
    ?? valueSource.targetObjectId
    ?? valueSource.code
    ?? valueSource.expression;
  return [valueSource.kind, reference].filter(Boolean).join(": ");
}

export function normalizeDocument(parts) {
  return `${parts.filter((part) => typeof part === "string" && part.trim() !== "")
    .map((part) => part.trim())
    .join("\n\n")}\n`;
}
