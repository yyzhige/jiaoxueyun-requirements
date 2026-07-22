import { PHASE, deepFreeze } from "../model.mjs";

function sourceRef(fieldId) {
  return {
    objectId: "ACC-OBJ-PLATFORM-IDENTITY",
    fieldId,
    version: "ACC-PIDENT-F-VERSION",
    cardinality: "ONE",
  };
}

function providedBySystem(...fieldIds) {
  return fieldIds.map((fieldId) => ({
    fieldId,
    provider: { actorRef: "SYSTEM" },
  }));
}

export const identityLifecycleFlows = deepFreeze([{
  id: "DF-016",
  label: "Teacher Identity Deletion to Non-recoverable Authorship Rewrite",
  phase: PHASE.FIRST,
  contractProfile: "GENERIC",
  routingPolicy: "NONE",
  moduleIds: ["ACC-001", "DGV-001"],
  steps: [
    {
      order: 1,
      actionId: "ACC-ACT-COMPLETE-IDENTITY-DELETION",
      condition: "the deletion subject kind is TEACHER, the fixed teaching-fact snapshot digest matches, the deletion matrix is complete, and the deletion event outbox can commit atomically",
    },
    {
      order: 2,
      actionId: "DGV-ACT-CREATE-TEACHER-AUTHOR-SURROGATE",
      condition: "the committed teacher-only deletion event is delivered with its exact event version and fixed teaching-fact scope digest",
      providedInputs: providedBySystem(
        "DGV-SURROGATE-F-DELETION-EVENT-ID",
        "DGV-SURROGATE-F-DELETION-EVENT-VERSION",
        "DGV-SURROGATE-F-TEACHING-FACT-SCOPE",
        "DGV-SURROGATE-F-TEACHING-FACT-SCOPE-DIGEST",
      ),
    },
  ],
  sourceDataRefs: [
    sourceRef("ACC-PIDENT-F-ID"),
    sourceRef("ACC-PIDENT-F-SUBJECT-KIND"),
    sourceRef("ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-ID"),
    sourceRef("ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-VERSION"),
    sourceRef("ACC-PIDENT-F-DELETION-CASE-REF"),
    sourceRef("ACC-PIDENT-F-DELETION-CASE-VERSION"),
  ],
  targetDataRefs: [
    {
      objectId: "ACC-OBJ-PLATFORM-IDENTITY",
      fieldId: "ACC-PIDENT-F-STATUS",
      version: "ACC-PIDENT-F-VERSION",
    },
    {
      objectId: "DGV-OBJ-TEACHER-AUTHOR-SURROGATE",
      fieldId: "DGV-SURROGATE-F-ID",
      version: "DGV-SURROGATE-F-VERSION",
    },
    {
      objectId: "DGV-OBJ-TEACHER-AUTHOR-SURROGATE",
      fieldId: "DGV-SURROGATE-F-AUTHORSHIP-MAPPING-DIGEST",
      version: "DGV-SURROGATE-F-VERSION",
    },
    {
      objectId: "DGV-OBJ-TEACHER-AUTHOR-SURROGATE",
      fieldId: "DGV-SURROGATE-F-STATUS",
      version: "DGV-SURROGATE-F-VERSION",
    },
  ],
  idempotencyKeyParts: {
    identityFieldIds: ["ACC-PIDENT-F-ID"],
    versionFieldIds: ["ACC-PIDENT-F-VERSION"],
    fanoutFieldId: "ACC-PIDENT-F-DELETION-CASE-REF",
  },
  failureGranularity: "ONE_TEACHER_DELETION_EVENT_VERSION_AND_ITS_EXACT_TEACHING_FACT_SET",
  retryPolicy: {
    strategy: "REDELIVER_THE_SAME_EVENT_VERSION_AND_RETURN_THE_EXISTING_MAPPING_FOR_EXACT_DUPLICATES",
    maxAttempts: 8,
    retryableFailureResults: [
      "VERSION_CONFLICT",
      "EVENT_OUTBOX_FAILED",
      "AUTHORSHIP_REWRITE_FAILED",
    ],
  },
  compensation: {
    strategy: "NEVER_RESTORE_A_DELETED_IDENTITY_OR_KEEP_A_PARTIAL_AUTHORSHIP_MAPPING",
    description: "an event outbox failure keeps deletion uncommitted; a downstream rewrite failure keeps the committed deletion and retries the same versioned event idempotently without restoring any recoverable identity lookup",
  },
  downstreamInvalidation: {
    strategy: "REMOVE_RECOVERABLE_AUTHOR_LOOKUP_AND_PRESERVE_VERSIONED_TEACHING_FACT_CONTENT",
    targets: [
      "teacher login and identity lookup mappings",
      "historical teaching-fact author pointers",
      "author search indexes and caches",
    ],
  },
  teacherAuthorSurrogateFlowContract: {
    producerActionId: "ACC-ACT-COMPLETE-IDENTITY-DELETION",
    eventId: "EVT-TEACHER-IDENTITY-DELETION-COMPLETED",
    consumerActionId: "DGV-ACT-CREATE-TEACHER-AUTHOR-SURROGATE",
    requiredSubjectKindCode: "TEACHER",
    producerFailureLeavesIdentityDeleted: false,
    consumerFailureRestoresIdentity: false,
    exactDuplicateCreatesAdditionalMapping: false,
    conflictingDuplicateEffect: "FAIL_CLOSED",
  },
}]);
