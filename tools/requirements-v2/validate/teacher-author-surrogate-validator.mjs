import { buildModelIndex } from "./model-validator.mjs";

const CODE = "INVALID_TEACHER_AUTHOR_SURROGATE_CONTRACT";
const EVENT_ID = "EVT-TEACHER-IDENTITY-DELETION-COMPLETED";
const PRODUCER_ACTION_ID = "ACC-ACT-COMPLETE-IDENTITY-DELETION";
const CONSUMER_ACTION_ID = "DGV-ACT-CREATE-TEACHER-AUTHOR-SURROGATE";
const SURROGATE_OBJECT_ID = "DGV-OBJ-TEACHER-AUTHOR-SURROGATE";
const FLOW_ID = "DF-016";

function list(value) {
  return Array.isArray(value) ? value : [];
}

function hasAll(values, required) {
  const actual = new Set(list(values));
  return required.every((value) => actual.has(value));
}

function sameStrings(values, expected) {
  const actual = list(values);
  return actual.length === expected.length && hasAll(actual, expected);
}

function field(object, fieldId) {
  return list(object?.fields).find(({ id }) => id === fieldId);
}

function fail(errors, detail) {
  errors.push(`${CODE} ${detail}`);
}

export function validateTeacherAuthorSurrogateContract(model) {
  if (model?.profile !== "ZHIXU_V2") return [];

  const errors = [];
  const index = buildModelIndex(model);
  const account = index.moduleById.get("ACC-001")?.value;
  const governance = index.moduleById.get("DGV-001")?.value;
  const identity = index.objectById.get("ACC-OBJ-PLATFORM-IDENTITY")?.value;
  const surrogate = index.objectById.get(SURROGATE_OBJECT_ID)?.value;
  const producer = index.actionById.get(PRODUCER_ACTION_ID)?.value;
  const consumer = index.actionById.get(CONSUMER_ACTION_ID)?.value;
  const event = index.eventById.get(EVENT_ID)?.value;
  const flow = index.flows.find(({ value }) => value?.id === FLOW_ID)?.value;
  const registration = index.actionById.get("ACC-ACT-REGISTER-PLATFORM-IDENTITY")?.value;

  if (!account || !governance || !identity || !surrogate || !producer || !consumer || !event || !flow) {
    fail(errors, "D051 requires the ACC producer, DGV consumer, event, surrogate object, and cross-domain Flow");
    return errors;
  }

  const identityFields = [
    "ACC-PIDENT-F-SUBJECT-KIND",
    "ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT",
    "ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT-DIGEST",
    "ACC-PIDENT-F-DELETION-EVENT-ID",
    "ACC-PIDENT-F-DELETION-EVENT-VERSION",
  ];
  if (!identityFields.every((fieldId) => field(identity, fieldId))) {
    fail(errors, "the platform identity must carry the teacher-only event source fields");
  }
  const subjectKind = field(identity, "ACC-PIDENT-F-SUBJECT-KIND");
  const factSnapshot = field(identity, "ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT");
  if (
    subjectKind?.valueSource?.optionSetId !== "OPT-BL2-004"
    || subjectKind?.mutability !== "IMMUTABLE"
    || factSnapshot?.valueSource?.kind !== "SYSTEM"
    || factSnapshot?.mutability !== "IMMUTABLE"
    || !hasAll(registration?.inputFieldIds, [subjectKind?.id])
    || !hasAll(registration?.outputFieldIds, [subjectKind?.id])
  ) {
    fail(errors, "teacher subject kind and fixed teaching-fact snapshot must be immutable registered source facts");
  }

  const producerInputFields = [
    "ACC-PIDENT-F-SUBJECT-KIND",
    "ACC-PIDENT-F-DELETION-CASE-REF",
    "ACC-PIDENT-F-DELETION-CASE-VERSION",
  ];
  const producerOutputFields = [
    "ACC-PIDENT-F-DELETION-EVENT-ID",
    "ACC-PIDENT-F-DELETION-EVENT-VERSION",
    "ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT",
    "ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT-DIGEST",
  ];
  const emission = producer.teacherDeletionEventEmission;
  if (
    producer.transition?.to !== "DELETED"
    || !hasAll(producer.inputFieldIds, producerInputFields)
    || hasAll(producer.inputFieldIds, ["ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT"])
    || hasAll(producer.inputFieldIds, ["ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT-DIGEST"])
    || !hasAll(producer.outputFieldIds, producerOutputFields)
    || !hasAll(producer.producedEventIds, [EVENT_ID])
    || emission?.eventId !== EVENT_ID
    || emission?.subjectKindFieldId !== "ACC-PIDENT-F-SUBJECT-KIND"
    || emission?.requiredSubjectKindCode !== "TEACHER"
    || emission?.requiredSuccessState !== "DELETED"
    || emission?.sourceVersionFieldId !== "ACC-PIDENT-F-VERSION"
    || emission?.eventCommitRule !== "AFTER_ATOMIC_IDENTITY_DELETION_AND_LOOKUP_REMOVAL"
    || emission?.nonTeacherEffect !== "NO_EVENT"
    || emission?.failedDeletionEffect !== "NO_EVENT"
    || emission?.outboxFailureEffect !== "KEEP_DELETION_UNCOMMITTED"
    || emission?.recoverableIdentityInPayloadAllowed !== false
    || emission?.teachingFactSnapshotResolution !== "SYSTEM_ENUMERATES_AUTHORIZED_TEACHING_FACT_IDS_AND_SOURCE_VERSIONS_INSIDE_THE_DELETION_TRANSACTION"
    || !hasAll(producer.failureResults, [
      "TEACHING_FACT_SNAPSHOT_MISMATCH",
      "EVENT_OUTBOX_FAILED",
    ])
  ) {
    fail(errors, "identity deletion must produce the event only for a committed teacher deletion and fail closed before commit");
  }

  const eventContract = event.teacherDeletionContextContract;
  const expectedEventContextKeys = [
    "subjectKind",
    "deletionEventId",
    "deletionEventVersion",
    "deletionResultVersion",
    "teachingFactScope",
    "teachingFactScopeDigest",
  ];
  const producerBinding = list(eventContract?.producerBindings)[0];
  const consumerBinding = list(eventContract?.consumerBindings)[0];
  if (
    !sameStrings(event.producerActionIds, [PRODUCER_ACTION_ID])
    || !sameStrings(event.triggeredActionIds, [CONSUMER_ACTION_ID])
    || !sameStrings(eventContract?.contextKeys, expectedEventContextKeys)
    || eventContract?.producerActionId !== PRODUCER_ACTION_ID
    || eventContract?.consumerActionId !== CONSUMER_ACTION_ID
    || eventContract?.requiredSubjectKindCode !== "TEACHER"
    || eventContract?.exactEventVersionRequired !== true
    || eventContract?.exactTeachingFactScopeDigestRequired !== true
    || eventContract?.recoverableIdentityPayloadAllowed !== false
    || eventContract?.duplicateDeliveryEffect !== "RETURN_EXISTING_SURROGATE_AND_MAPPING"
    || eventContract?.conflictingDeliveryEffect !== "FAIL_CLOSED"
    || list(eventContract?.producerBindings).length !== 1
    || producerBinding?.actionId !== PRODUCER_ACTION_ID
    || producerBinding?.eventIdentityFieldId !== "ACC-PIDENT-F-DELETION-EVENT-ID"
    || producerBinding?.eventVersionFieldId !== "ACC-PIDENT-F-DELETION-EVENT-VERSION"
    || producerBinding?.deletionResultVersionFieldId !== "ACC-PIDENT-F-VERSION"
    || producerBinding?.teachingFactScopeFieldId !== "ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT"
    || producerBinding?.teachingFactScopeDigestFieldId !== "ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT-DIGEST"
    || list(eventContract?.consumerBindings).length !== 1
    || consumerBinding?.actionId !== CONSUMER_ACTION_ID
    || consumerBinding?.eventIdentityFieldId !== "DGV-SURROGATE-F-DELETION-EVENT-ID"
    || consumerBinding?.eventVersionFieldId !== "DGV-SURROGATE-F-DELETION-EVENT-VERSION"
    || consumerBinding?.teachingFactScopeFieldId !== "DGV-SURROGATE-F-TEACHING-FACT-SCOPE"
    || consumerBinding?.teachingFactScopeDigestFieldId !== "DGV-SURROGATE-F-TEACHING-FACT-SCOPE-DIGEST"
  ) {
    fail(errors, "the event must bind one exact producer payload to one exact consumer payload");
  }

  const surrogateFields = [
    "DGV-SURROGATE-F-ID",
    "DGV-SURROGATE-F-DELETION-EVENT-ID",
    "DGV-SURROGATE-F-DELETION-EVENT-VERSION",
    "DGV-SURROGATE-F-TEACHING-FACT-SCOPE",
    "DGV-SURROGATE-F-TEACHING-FACT-SCOPE-DIGEST",
    "DGV-SURROGATE-F-AUTHORSHIP-MAPPING-DIGEST",
    "DGV-SURROGATE-F-REWRITE-EVIDENCE",
    "DGV-SURROGATE-F-STATUS",
    "DGV-SURROGATE-F-VERSION",
  ];
  const surrogateContract = surrogate.teacherAuthorSurrogateContract;
  const forbiddenReverseLookupField = list(surrogate.fields).some(({ id }) => (
    [
      "DGV-SURROGATE-F-ORIGINAL-IDENTITY-ID",
      "DGV-SURROGATE-F-PLATFORM-IDENTITY-ID",
      "DGV-SURROGATE-F-CLAIM-DIGEST",
      "DGV-SURROGATE-F-LOGIN-ACCOUNT-ID",
    ].includes(id)
  ));
  if (
    !surrogateFields.every((fieldId) => field(surrogate, fieldId))
    || forbiddenReverseLookupField
    || JSON.stringify(surrogate).includes("ACC-PIDENT-F-ID")
    || surrogateContract?.sourceEventId !== EVENT_ID
    || surrogateContract?.sourceEventVersionFieldId !== "DGV-SURROGATE-F-DELETION-EVENT-VERSION"
    || surrogateContract?.mappingRule !== "REPLACE_ONLY_AUTHOR_POINTER_FOR_EXACT_FACT_ID_AND_SOURCE_VERSION_SET"
    || surrogateContract?.mappingAtomicWithSurrogateCreation !== true
    || surrogateContract?.teachingFactContentMutationAllowed !== false
    || surrogateContract?.recoverableOriginalIdentityFieldAllowed !== false
    || surrogateContract?.reverseLookupIndexAllowed !== false
  ) {
    fail(errors, "the surrogate mapping must preserve teaching facts without any recoverable original identity field or index");
  }

  const consumerInputFields = [
    "DGV-SURROGATE-F-DELETION-EVENT-ID",
    "DGV-SURROGATE-F-DELETION-EVENT-VERSION",
    "DGV-SURROGATE-F-TEACHING-FACT-SCOPE",
    "DGV-SURROGATE-F-TEACHING-FACT-SCOPE-DIGEST",
  ];
  const consumerOutputFields = [
    "DGV-SURROGATE-F-ID",
    "DGV-SURROGATE-F-AUTHORSHIP-MAPPING-DIGEST",
    "DGV-SURROGATE-F-REWRITE-EVIDENCE",
    "DGV-SURROGATE-F-STATUS",
    "DGV-SURROGATE-F-VERSION",
  ];
  const consumerContract = consumer.teacherDeletionEventConsumer;
  const duplicate = consumer.duplicateDeliveryPolicy;
  const rewrite = consumer.authorshipRewriteContract;
  if (
    consumer.executionMode !== "SYSTEM_EVENT"
    || consumer.trigger?.eventId !== EVENT_ID
    || !hasAll(consumer.inputFieldIds, consumerInputFields)
    || !hasAll(consumer.outputFieldIds, consumerOutputFields)
    || consumer.idempotencyKey !== `${CONSUMER_ACTION_ID}:deletion-event-id:deletion-event-version:teaching-fact-scope-digest`
    || consumerContract?.producerActionId !== PRODUCER_ACTION_ID
    || consumerContract?.requiredSubjectKindCode !== "TEACHER"
    || consumerContract?.exactEventVersionRequired !== true
    || consumerContract?.exactScopeDigestRequired !== true
    || consumerContract?.missingOrAmbiguousEventEffect !== "FAIL_CLOSED"
    || !sameStrings(duplicate?.keyFieldIds, [
      "DGV-SURROGATE-F-DELETION-EVENT-ID",
      "DGV-SURROGATE-F-DELETION-EVENT-VERSION",
      "DGV-SURROGATE-F-TEACHING-FACT-SCOPE-DIGEST",
    ])
    || duplicate?.exactDuplicateEffect !== "RETURN_EXISTING_SURROGATE_AND_MAPPING"
    || duplicate?.conflictingDuplicateEffect !== "FAIL_CLOSED"
    || duplicate?.conflictingDuplicateResult !== "DUPLICATE_EVENT_CONFLICT"
    || duplicate?.additionalWriteAllowed !== false
    || rewrite?.permittedMutation !== "AUTHOR_POINTER_TO_NON_RECOVERABLE_SURROGATE_ONLY"
    || rewrite?.contentOrAssessmentMutationAllowed !== false
    || rewrite?.originalIdentityPersistenceAllowed !== false
    || rewrite?.atomicFailureEffect !== "NO_SURROGATE_AND_NO_PARTIAL_MAPPING"
    || !hasAll(consumer.failureResults, [
      "NON_TEACHER_DELETION_EVENT",
      "EVENT_VERSION_MISMATCH",
      "TEACHING_FACT_SCOPE_MISMATCH",
      "REVERSE_LOOKUP_RISK",
      "AUTHORSHIP_REWRITE_FAILED",
      "DUPLICATE_EVENT_CONFLICT",
    ])
  ) {
    fail(errors, "the consumer must version-pin, fail closed, and return the same mapping for exact duplicate delivery");
  }

  const expectedSteps = [PRODUCER_ACTION_ID, CONSUMER_ACTION_ID];
  const flowContract = flow.teacherAuthorSurrogateFlowContract;
  if (
    flow.phase !== 1
    || !sameStrings(flow.moduleIds, ["ACC-001", "DGV-001"])
    || list(flow.steps).length !== 2
    || list(flow.steps).some((step, index) => (
      step?.order !== index + 1 || step?.actionId !== expectedSteps[index]
    ))
    || !sameStrings(flow.idempotencyKeyParts?.identityFieldIds, ["ACC-PIDENT-F-ID"])
    || !sameStrings(flow.idempotencyKeyParts?.versionFieldIds, ["ACC-PIDENT-F-VERSION"])
    || flow.idempotencyKeyParts?.fanoutFieldId !== "ACC-PIDENT-F-DELETION-CASE-REF"
    || flow.compensation?.strategy !== "NEVER_RESTORE_A_DELETED_IDENTITY_OR_KEEP_A_PARTIAL_AUTHORSHIP_MAPPING"
    || flowContract?.producerActionId !== PRODUCER_ACTION_ID
    || flowContract?.eventId !== EVENT_ID
    || flowContract?.consumerActionId !== CONSUMER_ACTION_ID
    || flowContract?.requiredSubjectKindCode !== "TEACHER"
    || flowContract?.producerFailureLeavesIdentityDeleted !== false
    || flowContract?.consumerFailureRestoresIdentity !== false
    || flowContract?.exactDuplicateCreatesAdditionalMapping !== false
    || flowContract?.conflictingDuplicateEffect !== "FAIL_CLOSED"
  ) {
    fail(errors, "DF-016 must preserve producer-event-consumer order and never compensate by restoring the deleted identity");
  }

  const governanceContract = governance.teacherAuthorSurrogateContract;
  if (
    governanceContract?.producerModuleId !== "ACC-001"
    || governanceContract?.consumerModuleId !== "DGV-001"
    || governanceContract?.eventId !== EVENT_ID
    || governanceContract?.flowId !== FLOW_ID
    || governanceContract?.producerActionId !== PRODUCER_ACTION_ID
    || governanceContract?.consumerActionId !== CONSUMER_ACTION_ID
    || governanceContract?.surrogateObjectId !== SURROGATE_OBJECT_ID
    || governanceContract?.originalIdentityLookupAfterDeletion !== "FORBIDDEN"
  ) {
    fail(errors, "the DGV owner contract must expose the complete D051 cross-domain chain");
  }

  const requiredScenarioIds = [
    `${PRODUCER_ACTION_ID}-SCN-TEACHING_FACT_SNAPSHOT_MISMATCH`,
    `${PRODUCER_ACTION_ID}-SCN-EVENT_OUTBOX_FAILED`,
    `${CONSUMER_ACTION_ID}-SCN-EVENT_VERSION_MISMATCH`,
    `${CONSUMER_ACTION_ID}-SCN-TEACHING_FACT_SCOPE_MISMATCH`,
    `${CONSUMER_ACTION_ID}-SCN-REVERSE_LOOKUP_RISK`,
    `${CONSUMER_ACTION_ID}-SCN-AUTHORSHIP_REWRITE_FAILED`,
    `${CONSUMER_ACTION_ID}-SCN-DUPLICATE_EVENT_CONFLICT`,
  ];
  if (!requiredScenarioIds.every((scenarioId) => index.scenarioById.has(scenarioId))) {
    fail(errors, "D051 must declare fail-closed scenarios for source, version, scope, rewrite, and duplicate conflicts");
  }

  const trace = list(model.decisionTraceability).find(({ decisionId }) => decisionId === "D051");
  if (
    !hasAll(trace?.moduleIds, ["ACC-001", "DGV-001"])
    || !hasAll(trace?.flowIds, [FLOW_ID])
    || !hasAll(trace?.objectIds, ["ACC-OBJ-PLATFORM-IDENTITY", SURROGATE_OBJECT_ID])
    || !hasAll(trace?.actionIds, [PRODUCER_ACTION_ID, CONSUMER_ACTION_ID])
    || !hasAll(trace?.testIds, ["D051-TEACHER-AUTHOR-SURROGATE-EVENT"])
  ) {
    fail(errors, "D051 traceability must include the real ACC-DGV event Flow, objects, actions, and destructive test contract");
  }

  return errors;
}
