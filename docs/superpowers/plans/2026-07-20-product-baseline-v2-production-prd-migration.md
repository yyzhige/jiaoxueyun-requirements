# Product Baseline v2.0 Production PRD Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the generated Zhixu production requirements package from the finalized 2026-07-20 README v2.0 baseline, with complete D003-D096 traceability, correct three-stage ownership, and no retained rejected product rule.

**Architecture:** Preserve the facts → fail-closed validation → deterministic rendering pipeline. Add focused baseline, migration, traceability, launch-governance, phase-two, and phase-three fact files; make current-delivery status independent from product phase; regenerate all PRDs and page contracts from the validated model.

**Tech Stack:** Node.js 24, ES modules, `node:test`, Markdown, JSON, Git.

---

## File Map

### New product-baseline facts

- Create `tools/requirements-v2/facts/product-baseline-v2.mjs`: baseline metadata, phases, release statuses, product terminology, README chapter registry, and D003-D096 decision facts.
- Create `tools/requirements-v2/facts/baseline-migration.mjs`: old-rule → new-rule change records and rejected alternatives.
- Create `tools/requirements-v2/facts/baseline-traceability.mjs`: closed references from chapters and decisions to requirement contracts.
- Create `tools/requirements-v2/facts/launch-governance.mjs`: six metric groups, three launch gates, and phase completion rules.
- Create `tools/requirements-v2/facts/phase-two.mjs`: minimum progress and video modules plus second-stage Flows/events/options.
- Create `tools/requirements-v2/facts/phase-three.mjs`: long-term cognition and dual-progress extensions that cannot be represented by the old mixed modules.

### Existing domain facts

- Modify `tools/requirements-v2/model.mjs`: third phase, release statuses, and required baseline collections.
- Modify `tools/requirements-v2/facts/catalogs.mjs`: replace conflicting baseline decisions, roles/duties, Option Sets, metrics, NFRs, and phase extensions.
- Modify `tools/requirements-v2/facts/foundation.mjs`: school activation, single-admin recovery, relationship authorization, guardian assistance, identity deletion, transfer, export, and shared-device contracts.
- Modify `tools/requirements-v2/facts/teaching-loop.mjs`: first-stage activities/submissions and second-stage assessment/feedback/correction separation.
- Modify `tools/requirements-v2/facts/ai-reporting.mjs`: teacher action objects, factual reports, AI conversation phase, and long-term phase ownership.
- Modify `tools/requirements-v2/facts/extensions.mjs`: diagnostic score import, platform entitlement/exit, and removal of video as metadata-only extension.
- Modify `tools/requirements-v2/facts/index.mjs`: assemble new collections/modules/Flows and publish the 2026-07-20 review status.

### Validation and rendering

- Modify `tools/requirements-v2/validate/structure-validator.mjs`: closed shapes for the new catalogs, release status, status axes, and trace references.
- Modify `tools/requirements-v2/validate/model-validator.mjs`: uniqueness and cross-collection references for the new model collections.
- Modify `tools/requirements-v2/validate/semantic-validator.mjs`: baseline, phase, terminology, product invariant, traceability, metric-group, and launch-gate rules.
- Modify `tools/requirements-v2/render/contracts.mjs`: phase, status-axis, traceability, migration, authorization, answer-open, video, metric-group, and launch-gate documents.
- Modify `tools/requirements-v2/render/module-prd.mjs`: planned banners, phase completion boundaries, and baseline references.
- Modify `tools/requirements-v2/render/wireframe.mjs`: planned page contracts without current-release claims.
- Modify `tools/requirements-v2/render/package.mjs`: new artifacts, phase-aware indexes, manifest, and generated product baseline.

### Tests

- Create `tools/tests/requirements-v2-baseline-v2.test.mjs`: baseline/decision/phase/migration/traceability validation.
- Create `tools/tests/requirements-v2-product-invariants.test.mjs`: activity, identity, weak-network, AI, video, commercial, ranking, and terminology mutation tests.
- Create `tools/tests/requirements-v2-baseline-render.test.mjs`: generated trace/migration/status/phase and old-rule scans.
- Modify `tools/tests/requirements-v2-model.test.mjs`: update existing exact manifests and phase-dependent expectations.
- Modify `tools/tests/requirements-v2-render.test.mjs`: update artifact count, page count, and phase-aware manifest expectations.

## Task 1: Extend the Requirement Model for Three Phases and Baseline Collections

**Files:**
- Modify: `tools/requirements-v2/model.mjs`
- Modify: `tools/requirements-v2/validate/structure-validator.mjs`
- Create: `tools/tests/requirements-v2-baseline-v2.test.mjs`

- [ ] **Step 1: Write failing model-contract tests**

Add tests that require `PHASE.THIRD`, `RELEASE_STATUS`, and these top-level collections:

```js
const expectedCollections = [
  "phases",
  "productDecisions",
  "baselineChapters",
  "migrationChanges",
  "metricGroups",
  "launchGates",
];

test("publishes the finalized three-phase product contract", () => {
  assert.equal(PHASE.THIRD, 3);
  assert.deepEqual(Object.values(RELEASE_STATUS), ["BUILD_READY", "PLANNED"]);
  for (const key of expectedCollections) {
    assert.ok(MODEL_COLLECTIONS.some((entry) => entry.key === key), key);
  }
});
```

Add negative fixtures for an unknown phase, phase-one `PLANNED`, phase-two `BUILD_READY`, phase-three `BUILD_READY`, and a missing required collection.

- [ ] **Step 2: Run the tests and record RED**

Run: `node --test tools/tests/requirements-v2-baseline-v2.test.mjs`

Expected: failures for missing third phase, release status, and model collections.

- [ ] **Step 3: Add stable model constants and required collections**

Implement:

```js
export const PHASE = Object.freeze({ FIRST: 1, SECOND: 2, THIRD: 3 });
export const RELEASE_STATUS = Object.freeze({
  BUILD_READY: "BUILD_READY",
  PLANNED: "PLANNED",
});
```

Append the six new keys to `MODEL_COLLECTIONS`. Extend the structural validator so phase one accepts only `BUILD_READY` and phases two/three accept only `PLANNED`.

- [ ] **Step 4: Run the focused tests and commit**

Run: `node --test tools/tests/requirements-v2-baseline-v2.test.mjs`

Expected: the model-contract tests pass while full-model tests still fail because new facts are absent.

Commit: `feat: define finalized product baseline model contract`

## Task 2: Encode README v2.0, D003-D096, Migration Changes, Metrics, and Gates

**Files:**
- Create: `tools/requirements-v2/facts/product-baseline-v2.mjs`
- Create: `tools/requirements-v2/facts/baseline-migration.mjs`
- Create: `tools/requirements-v2/facts/launch-governance.mjs`
- Modify: `tools/requirements-v2/facts/catalogs.mjs`
- Modify: `tools/requirements-v2/facts/index.mjs`
- Modify: `tools/tests/requirements-v2-baseline-v2.test.mjs`

- [ ] **Step 1: Add RED tests for authoritative source completeness**

Require:

```js
assert.deepEqual(productBaseline, {
  id: "ZHIXU-PRODUCT-BASELINE-V2",
  version: "v2.0",
  decisionState: "finalized",
  baselineDate: "2026-07-20",
  sourcePath: "/Users/a1234/Desktop/student/README.md",
});
assert.deepEqual(phases.map(({ id }) => id), ["PHASE-1", "PHASE-2", "PHASE-3"]);
assert.equal(productDecisions.length, 94);
assert.deepEqual(productDecisions.map(({ id }) => id),
  Array.from({ length: 94 }, (_, index) => `D${String(index + 3).padStart(3, "0")}`));
```

Require every decision to include `statement`, `selectedRoute`, `rejectedRoutes`, `sourceSection`, `phaseIds`, and `chapterIds`.

Require README chapter IDs for every heading from `项目原则` through `产品验收与上线门`, and reject a decision whose chapter or phase is unknown.

- [ ] **Step 2: Run focused tests and record RED**

Run: `node --test tools/tests/requirements-v2-baseline-v2.test.mjs`

Expected: missing source facts and D003-D096 completeness failures.

- [ ] **Step 3: Implement baseline and decision facts**

Use grouped source declarations but emit one immutable fact per decision ID:

```js
function decisionGroup(ids, contract) {
  return ids.map((id) => ({ id, ...structuredClone(contract) }));
}

export const productDecisions = [
  ...decisionGroup(["D003"], {
    statement: "默认禁止综合能力排名、公开弱项榜和跨场景单一总分；保留具体活动分数、等级与匿名分布。",
    selectedRoute: "NO_DEFAULT_COMPOSITE_RANKING",
    rejectedRoutes: ["TEACHER_ONLY_NAMED_RANKING", "PUBLIC_COMPETITIVE_LEADERBOARD"],
    sourceSection: "讨论稿#83",
    phaseIds: ["PHASE-1", "PHASE-2", "PHASE-3"],
    chapterIds: ["BASE-CH-ROLE", "BASE-CH-AI-ASSESSMENT", "BASE-CH-PROGRESS"],
  }),
  ...decisionGroup(["D071"], {
    statement: "AI 结果使用处理、发布、争议纠正和有效性四个独立状态轴。",
    selectedRoute: "MULTI_AXIS_AI_RESULT_STATUS",
    rejectedRoutes: ["SINGLE_AI_RESULT_LIFECYCLE"],
    sourceSection: "讨论稿#83",
    phaseIds: ["PHASE-2"],
    chapterIds: ["BASE-CH-AI-ASSESSMENT"],
  }),
  ...decisionGroup(["D091"], {
    statement: "服务受限时保护已发布活动窗口并提供退出窗口，持续数据权利依法依合同执行。",
    selectedRoute: "PROTECTED_ACTIVITY_AND_EXIT_WINDOWS",
    rejectedRoutes: ["UNLIMITED_FREE_POST_TERMINATION_SERVICE"],
    sourceSection: "讨论稿#83",
    phaseIds: ["PHASE-1", "PHASE-2"],
    chapterIds: ["BASE-CH-COMMERCIAL"],
  }),
];
```

Fill the remaining decision groups exactly from discussion section 83; the emitted ID sequence must be D003-D096 without gaps.

- [ ] **Step 4: Implement migration changes**

Create records with this closed shape:

```js
{
  id: "MIG-071",
  decisionIds: ["D071"],
  oldRule: "AI result used one combined lifecycle",
  newRule: "processing, publication, dispute/correction, and validity are independent axes",
  rejectedReason: "one axis loses simultaneous state and permits invalid transitions",
  affected: {
    moduleIds: ["GRD-001", "PUB-001"],
    pageIds: [], flowIds: [], objectIds: [], actionIds: [],
    permissionActionIds: [], stateRefs: [], metricIds: [], scenarioIds: [],
  },
}
```

Include migration records for phase ownership, terminology, ranking, activity purpose/status/snapshot, identity/guardian, weak-network timeliness, raw-vs-derived data, AI result axes, answer opening, video, shared-device limits, and service-continuity limits.

- [ ] **Step 5: Implement six metric groups and three launch gates**

Add exact group IDs:

```js
[
  "MET-GROUP-USER-CLOSURE",
  "MET-GROUP-FACT-RELIABILITY",
  "MET-GROUP-AI-TEACHING-QUALITY",
  "MET-GROUP-SAFETY-DATA-RIGHTS",
  "MET-GROUP-FAIRNESS-ACCESSIBILITY",
  "MET-GROUP-TEACHER-SCHOOL-EFFICIENCY",
]
```

Add `GATE-ZERO-TOLERANCE`, `GATE-QUALITY-THRESHOLD`, and `GATE-EVIDENCE-COMPLETENESS`. Each metric must reference exactly one group and phase; each gate must include blocking conditions, evidence requirements, Owner, and affected phases.

- [ ] **Step 6: Run focused tests and commit**

Run: `node --test tools/tests/requirements-v2-baseline-v2.test.mjs`

Expected: baseline, decision, migration-shape, metric-group, and gate tests pass.

Commit: `feat: encode finalized product baseline decisions`

## Task 3: Make Phase and Release Semantics Fail Closed

**Files:**
- Modify: `tools/requirements-v2/validate/model-validator.mjs`
- Modify: `tools/requirements-v2/validate/semantic-validator.mjs`
- Modify: `tools/requirements-v2/render/module-prd.mjs`
- Modify: `tools/requirements-v2/render/wireframe.mjs`
- Modify: `tools/requirements-v2/render/package.mjs`
- Modify: `tools/tests/requirements-v2-baseline-v2.test.mjs`
- Modify: `tools/tests/requirements-v2-render.test.mjs`

- [ ] **Step 1: Add RED phase/release mutation tests**

Test these failures:

- a phase-one module marked `PLANNED`;
- a phase-two/three module marked `BUILD_READY`;
- a planned page missing `availability: "PLANNED"`;
- a planned module included in `currentReleaseModuleIds`;
- a build-ready Flow containing a planned action;
- a planned module rendered without a planned banner.

- [ ] **Step 2: Replace the old phase-two metadata-only rule**

Delete the semantic assumption that every phase-two module must have zero actions/pages. Add:

```js
if (module.phase === PHASE.FIRST && module.releaseStatus !== RELEASE_STATUS.BUILD_READY) {
  errors.push(`INVALID_PHASE_RELEASE_STATUS ${module.id}`);
}
if (module.phase !== PHASE.FIRST && module.releaseStatus !== RELEASE_STATUS.PLANNED) {
  errors.push(`INVALID_PHASE_RELEASE_STATUS ${module.id}`);
}
```

Validate planned actions/pages fully, but require `availability: "PLANNED"`, phase-matched dependencies, and exclusion from the current-release index.

- [ ] **Step 3: Render planned requirements without launch claims**

Render all module PRDs and page contracts. Every phase-two/three document begins with:

```text
交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。
```

The JSON manifest exposes `phase`, `releaseStatus`, `currentRelease`, and `wireframe` for all modules.

- [ ] **Step 4: Run tests and commit**

Run: `node --test tools/tests/requirements-v2-baseline-v2.test.mjs tools/tests/requirements-v2-render.test.mjs`

Expected: planned contracts are complete and excluded from the phase-one release manifest.

Commit: `feat: separate product phase from release status`

## Task 4: Rebuild School, Identity, Authorization, Guardian, and Data-Rights Facts

**Files:**
- Modify: `tools/requirements-v2/facts/foundation.mjs`
- Modify: `tools/requirements-v2/facts/catalogs.mjs`
- Create: `tools/tests/requirements-v2-product-invariants.test.mjs`

- [ ] **Step 1: Add RED foundation invariant tests**

Require objects/actions for:

- school application, platform subject review, first-admin acceptance, initialization validation, teaching activation;
- single-admin recovery plus platform second authorization and two-admin school confirmation;
- platform identity, login account, school profile, student primary-account relation, guardian relation, school data authorization, and task assistance session;
- expiring substitute-teaching relation with class, subject, duty, start, and end;
- high-impact authorization matrix and guardian dispute freeze;
- transfer authorization, old-school restricted history, role-separated export, identity deletion mapping removal, teacher author surrogate;
- shared-device cleanup limited to product-controlled state.

Add destructive tests for a permanent-post-deletion identity ID, guardian access without a task session, high-impact execution during dispute freeze, and custom duty widening a platform hard boundary.

- [ ] **Step 2: Implement foundation facts**

Add focused objects to `ACC`, `ORG`, `IAM`, `DGV`, and `AUD`. Use separate relationships rather than a generic guardian flag. The identity deletion action must output a deleted lookup mapping and a future registration action must create a new identity ID.

Add Option Sets for school activation axes, authorization impact, guardian-assistance status, dispute status, data-right action, export audience, and shared-device cleanup scope.

- [ ] **Step 3: Add exact permission boundaries**

Model:

- school admin cannot delete platform identity;
- guardian assistance cannot edit login identifiers, export full history, change learning state, or browse unrelated history;
- school admin default-deny on student detailed profile;
- platform support default-deny with existing audited access exception;
- substitute teacher scope expires with the teaching relation;
- custom duties cannot synthesize relationships.

- [ ] **Step 4: Run tests and commit**

Run: `node --test tools/tests/requirements-v2-product-invariants.test.mjs --test-name-pattern='school|identity|guardian|authorization|export|transfer|shared device'`

Expected: all foundation invariants and their destructive variants pass.

Commit: `feat: align school identity and guardian governance`

## Task 5: Rebuild First-Stage Activity, Submission, Teacher Action, and Student Home Facts

**Files:**
- Modify: `tools/requirements-v2/facts/teaching-loop.mjs`
- Modify: `tools/requirements-v2/facts/ai-reporting.mjs`
- Modify: `tools/requirements-v2/facts/catalogs.mjs`
- Modify: `tools/tests/requirements-v2-product-invariants.test.mjs`

- [ ] **Step 1: Add RED activity and teacher-workspace tests**

Require four activity purpose values:

```js
["FORMAL_ASSIGNMENT", "DAILY_PRACTICE", "DIAGNOSTIC_ASSESSMENT", "TEACHING_PRESENTATION"]
```

Require activity axes `governance`, `openWindow`, `archive`, `participation`, `time`, and `aiProcessing`. Reject a single combined status field.

Require separate TEA objects for `TEACHING_PROBLEM`, `TEACHER_JUDGMENT`, and `LINKED_TEACHING_ACTION`. Reject any transition where rejecting an AI suggestion automatically resolves the problem or completing an action produces mastery.

- [ ] **Step 2: Implement immutable activity publication and replacement**

Add publication snapshot fields for prompt/material/requirements/purpose/help-rule versions. Add actions for:

- cancel administrative;
- cancel content/right error;
- publish replacement activity;
- non-semantic correction version;
- assessment-standard correction version.

Semantic changes must target a new activity identity and reference the replaced activity. Teaching presentation must have no submission, lateness, completion, or mastery-producing action path.

- [ ] **Step 3: Implement weak-network intent credential**

Add `SUB-OBJ-INTENT-CREDENTIAL` with actor, activity, submission version, issued-at, content manifest, digest, expiry, completion window, and status. Add issue, complete-manifest-only, reject-manifest-change, expire, and platform-failure-protection actions.

The timeliness rule must use credential time only when the fixed manifest is completed within the window. Normal submissions continue to use the complete server receipt.

- [ ] **Step 4: Implement student-home compartments and teacher action views**

Student home exposes separate school-required, student-pending, system-processing, and personal-optional queries. System AI/media delay cannot mutate a student completion state.

Teacher pages use action queue as primary and class insight/student detail as core views. Homeroom pages expose cross-subject coordination aggregates and never inherit subject-detail access.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tools/tests/requirements-v2-product-invariants.test.mjs --test-name-pattern='activity|presentation|replacement|weak network|teacher action|student home'`

Expected: all first-stage product invariants pass.

Commit: `feat: rebuild first-stage teaching facts`

## Task 6: Rebuild Phase-Two AI Assessment, Feedback, Answer Opening, and Correction

**Files:**
- Modify: `tools/requirements-v2/facts/teaching-loop.mjs`
- Modify: `tools/requirements-v2/facts/ai-reporting.mjs`
- Modify: `tools/requirements-v2/facts/catalogs.mjs`
- Modify: `tools/tests/requirements-v2-product-invariants.test.mjs`

- [ ] **Step 1: Add RED AI assessment tests**

Require `GRD`, `PUB`, `CORR`, and `AIX` to be phase two and `PLANNED`. Reject teaching labels containing routine “审批”. Require the product term `AI 评定与完成判定`.

Require AI result axes:

```js
[
  "PROCESSING_STATUS",
  "PUBLICATION_STATUS",
  "DISPUTE_CORRECTION_STATUS",
  "VALIDITY_STATUS",
]
```

Require next-step values:

```js
["COMPLETED", "CORRECTION_REQUIRED", "MORE_INPUT_REQUIRED", "UNABLE_TO_DETERMINE", "EXCEPTION_REVIEW_REQUIRED"]
```

- [ ] **Step 2: Replace routine teacher confirmation**

AI assessment publishes only after permission, safety, and teaching-correctness gates pass. Unable-to-determine follows source quality → concrete supplementation → permitted alternate review → professional exception queue. The teacher duty can resolve an exception but is not a routine assessment node.

Add batch-impact location, review, notification, and derived-result recalculation while preserving original submissions and superseded result versions.

- [ ] **Step 3: Implement four feedback layers and answer-open enforcement**

Add feedback-layer and valid-attempt Option Sets. Explicit “I do not know” may be a valid attempt; blank, unrelated, and placeholder submissions are not.

Create independent answer, solution, and rubric open timestamps. Declare delivery surfaces:

```js
["PAGE", "SEARCH", "EXPORT", "NOTIFICATION", "AI_CONVERSATION", "VIDEO", "CACHE", "DIRECT_LINK"]
```

Every surface must reference the same open policy and reauthorize on access.

- [ ] **Step 4: Enforce raw fact and derived judgment separation**

Classify submissions/media/explanations as original facts and recognition/transcription/assessment/profile statements as derived judgments. Derived objects require source identity/version, validity, dispute, and supersession links. Reject any action that overwrites an original fact with derived content.

Persist no hidden chain-of-thought or vendor debug field. AI trace contains only task ID, external reference, model/capability/rule/safety versions, evidence references, result, and gate outcomes.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tools/tests/requirements-v2-product-invariants.test.mjs --test-name-pattern='AI assessment|feedback|answer open|raw fact|chain of thought|exception review'`

Expected: phase-two assessment and all negative mutations pass.

Commit: `feat: model AI assessment and completion determination`

## Task 7: Add Phase-Two Minimum Progress and Video Modules

**Files:**
- Create: `tools/requirements-v2/facts/phase-two.mjs`
- Modify: `tools/requirements-v2/facts/index.mjs`
- Modify: `tools/requirements-v2/facts/catalogs.mjs`
- Modify: `tools/tests/requirements-v2-product-invariants.test.mjs`

- [ ] **Step 1: Add RED PROG/VIDEO contract tests**

Require phase-two `PROG-001` and `VIDEO-001` modules with `PLANNED` release status. PROG must contain current grade/course, unit, target, prerequisite, target state, and next allowed target without a complete-profile dependency.

VIDEO must define problem-driven and progress-driven requests, source bindings, script/render gates, delivery, recall, controlled playback, low-bandwidth alternative, quota reservation, settlement, and release.

- [ ] **Step 2: Implement the minimum progress skeleton**

Add version-pinned relationships from current school/course and curriculum targets. The next-target action requires current target completion evidence and student choice; AI cannot auto-publish a new class activity.

- [ ] **Step 3: Implement video generation and delivery gates**

Bind videos to activity/submission, assessment standard/result, target, permissions, and material-right versions. Delivery requires script, media, safety, privacy, rights, teaching correctness, and playability gates all passed.

Controlled playback provides subtitles, summary, and low-bandwidth alternative, blocks ordinary product download, and explicitly does not claim to prevent external recording.

- [ ] **Step 4: Implement fair quota and recall**

Every active phase-two student receives a minimum entitlement and the school has an overflow pool. Problem-driven remediation has priority. Reserve on acceptance, settle on usable delivery, and release on platform failure, gate block, recall, or automatic retry.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tools/tests/requirements-v2-product-invariants.test.mjs --test-name-pattern='minimum progress|video|quota|controlled playback'`

Expected: both modules and destructive gate/quota mutations pass.

Commit: `feat: add phase-two progress and video contracts`

## Task 8: Move Long-Term Cognition and Dual Progress to Phase Three

**Files:**
- Create: `tools/requirements-v2/facts/phase-three.mjs`
- Modify: `tools/requirements-v2/facts/teaching-loop.mjs`
- Modify: `tools/requirements-v2/facts/ai-reporting.mjs`
- Modify: `tools/requirements-v2/facts/index.mjs`
- Modify: `tools/tests/requirements-v2-product-invariants.test.mjs`

- [ ] **Step 1: Add RED phase-three ownership tests**

Require `INS-001`, `PLN-001`, and `LPATH-001` to be phase three and planned. Reject their inclusion in phase-one Flows or release pages. Require class progress and personal progress as separate sources and node-level progress rather than one percentage.

- [ ] **Step 2: Rebuild cognition and progress facts**

Mastery remains reversible and evidence-based. Completion, correction, and video watching create evidence only. Node status includes not started, learning, pending validation, mastered, and review required, with source/time/reason history.

Subject teachers own subject detail and class progress; homeroom teachers see cross-subject coordination only. Students can challenge but not directly rewrite cognition.

- [ ] **Step 3: Register long-term video composition**

Attach reviewed reusable fragments plus individualized linking/example/pacing composition as a phase-three VIDEO extension. It cannot be a dependency of the phase-two minimum video Flow.

- [ ] **Step 4: Run tests and commit**

Run: `node --test tools/tests/requirements-v2-product-invariants.test.mjs --test-name-pattern='phase three|mastery|dual progress|long-term video'`

Expected: all long-term capabilities are planned phase-three contracts and absent from phase one.

Commit: `feat: move long-term cognition to phase three`

## Task 9: Implement Complete Baseline Traceability and Migration Impact

**Files:**
- Create: `tools/requirements-v2/facts/baseline-traceability.mjs`
- Modify: `tools/requirements-v2/facts/baseline-migration.mjs`
- Modify: `tools/requirements-v2/facts/index.mjs`
- Modify: `tools/requirements-v2/validate/model-validator.mjs`
- Modify: `tools/requirements-v2/validate/semantic-validator.mjs`
- Modify: `tools/tests/requirements-v2-baseline-v2.test.mjs`

- [ ] **Step 1: Add RED reference and coverage tests**

For every README chapter require non-empty module, page, object, action, state/axis, metric/gate, and scenario references when the chapter defines those contracts. Require every D003-D096 decision to appear in at least one chapter trace and migration record or have `migrationRequired: false` with a reason.

Add mutations for a missing page, cross-phase Flow, missing permission subject, unknown state axis, metric from the wrong group, chapter without failure scenario, and migration without an affected contract.

- [ ] **Step 2: Populate chapter traces from final facts**

Use closed references:

```js
{
  chapterId: "BASE-CH-AI-ASSESSMENT",
  decisionIds: ["D070", "D071", "D072", "D073", "D074", "D075", "D076", "D077", "D078"],
  moduleIds: ["GRD-001", "PUB-001", "CORR-001", "AIX-001"],
  pageIds: ["GRD-PAGE-REVIEW"],
  flowIds: ["DF-006", "DF-007", "DF-008", "DF-009", "DF-010"],
  objectIds: ["GRD-OBJ-DECISION"],
  actionIds: ["GRD-ACT-PROCESS"],
  permissionRefs: [{ actionId: "GRD-ACT-PROCESS", effect: "ALLOW", actorRef: "SYSTEM" }],
  stateRefs: [{ objectId: "GRD-OBJ-DECISION", axis: "PROCESSING_STATUS" }],
  metricIds: ["MET-AI-QUALITY-001"],
  launchGateIds: ["GATE-QUALITY-THRESHOLD", "GATE-EVIDENCE-COMPLETENESS"],
  scenarioIds: ["GRD-ACT-PROCESS-SCN-SUCCESS", "GRD-ACT-PROCESS-SCN-UNABLE-TO-DETERMINE"],
}
```

Use actual final IDs; do not retain an example ID if the final model uses a different ID.

- [ ] **Step 3: Complete migration affected references**

Each migration record must list affected module/page/Flow/object/action/permission/state/metric/scenario references. The validator checks the references and requires at least one affected reference outside `moduleIds`.

- [ ] **Step 4: Run tests and commit**

Run: `node --test tools/tests/requirements-v2-baseline-v2.test.mjs`

Expected: chapter, decision, and migration coverage are complete with zero unresolved references.

Commit: `feat: trace finalized baseline into requirement contracts`

## Task 10: Render the Production PRD, Trace Matrix, and Change Log

**Files:**
- Modify: `tools/requirements-v2/render/contracts.mjs`
- Modify: `tools/requirements-v2/render/module-prd.mjs`
- Modify: `tools/requirements-v2/render/wireframe.mjs`
- Modify: `tools/requirements-v2/render/package.mjs`
- Create: `tools/tests/requirements-v2-baseline-render.test.mjs`

- [ ] **Step 1: Add RED renderer tests**

Require artifacts for:

- `02-indexes/product-baseline-v2-traceability.md`;
- `02-indexes/D003-D096-decision-matrix.md`;
- `02-indexes/product-baseline-v2-migration-log.md`;
- `04-data-contracts/activity-status-axis-catalog.md`;
- `04-data-contracts/ai-result-status-axis-catalog.md`;
- `04-data-contracts/high-impact-authorization-matrix.md`;
- `04-data-contracts/weak-network-intent-credential.md`;
- `04-data-contracts/answer-open-surface-matrix.md`;
- `04-data-contracts/video-gate-quota-contract.md`;
- `04-data-contracts/metric-groups-launch-gates.md`.

Require all planned PRDs/pages to show the planned banner and all current-release pages to omit it.

- [ ] **Step 2: Render traceability and migration documents**

Each trace row must show chapter/decision, phase, release status, module/page/Flow/object/action, permission, state axis, metric/gate, and scenario. Each migration row must show old rule, new rule, rejected route/reason, and affected contracts.

- [ ] **Step 3: Render phase-aware indexes and handoffs**

Update the README, module index, page map, JSON manifest, frontend/backend/PM/QA handoffs, and semantic scan to distinguish `BUILD_READY` from `PLANNED`. Remove “phase two has no executable pages” wording.

- [ ] **Step 4: Generate the product baseline document from facts**

Include `docs/product/zhixu-teaching-cloud-prd-v2.0.md` in the artifact set. It must show baseline v2.0, finalized 2026-07-20 status, three phases, six metric groups, three gates, and authoritative source provenance.

- [ ] **Step 5: Run renderer tests and commit**

Run: `node --test tools/tests/requirements-v2-baseline-render.test.mjs tools/tests/requirements-v2-render.test.mjs`

Expected: all new artifacts and phase-aware manifests are deterministic.

Commit: `feat: render finalized production requirements package`

## Task 11: Regenerate and Remove Rejected Rules

**Files:**
- Modify through generation: `docs/product/zhixu-teaching-cloud-prd-v2.0.md`
- Regenerate: `docs/requirements/zhixu-handoff-v2.0/**`
- Modify: `tools/tests/requirements-v2-baseline-render.test.mjs`

- [ ] **Step 1: Set final review status through facts**

Use:

```js
{
  code: "PRODUCT_BASELINE_V2_FINALIZED_PRD_REVIEW_PASSED",
  label: "v2.0 finalized product baseline; production PRD semantic review passed",
  reviewedAt: "2026-07-20",
}
```

- [ ] **Step 2: Run validator and generator**

Run: `node tools/validate_v2_requirements.mjs`

Run: `node tools/generate_v2_requirements.mjs`

Expected: validation reports the final module and Flow counts; every artifact is rebuilt from facts.

- [ ] **Step 3: Add exact rejected-rule scans**

The generated package must contain zero positive requirements for:

- teaching-domain “审批” or teacher routine assessment approval;
- default comprehensive ranking or public weakness leaderboard;
- binary-only completed/returned AI outcome;
- complete upload as the only timeliness path;
- identity number permanent after deletion;
- teaching presentation producing submission/lateness/completion/mastery;
- one combined activity or AI-result lifecycle;
- full profile as a prerequisite of minimum phase-two video;
- clearing operating-system downloads/autofill;
- preventing external recording;
- unlimited free post-termination service;
- planned phase-two/three capability described as live.

Negative boundary statements and migration-log quotations are allowed only when explicitly marked rejected or replaced.

- [ ] **Step 4: Run full generated-package checks**

Verify Markdown links, JSON manifest paths, table structure, placeholders, serialization leaks, duplicate paths, old review status, phase banners, and deterministic regeneration.

- [ ] **Step 5: Commit regenerated artifacts**

Commit: `docs: regenerate finalized product baseline PRDs`

## Task 12: Full Verification and Independent Reviews

**Files:**
- Verify: all facts, validators, renderers, tests, and generated artifacts

- [ ] **Step 1: Run all tests**

Run: `node --test tools/tests/*.test.mjs`

Expected: all tests pass with zero fail, skipped, or cancelled tests.

- [ ] **Step 2: Run standalone validation and generation**

Run: `node tools/validate_v2_requirements.mjs`

Run: `node tools/generate_v2_requirements.mjs`

Run: `git diff --exit-code`

Expected: zero validation errors and no deterministic-generation diff.

- [ ] **Step 3: Perform independent specification review**

Review README v2.0 and discussion section 83 line by line against the generated trace matrix and migration log. Any missing D003-D096 decision, retained rejected route, wrong phase, or missing affected contract is Important and returns to its owning task.

- [ ] **Step 4: Perform independent quality review**

Review for duplicated registries, ID allowlists that can omit future facts, mutable shared fixture aliases, validators inferred from the field they validate, renderer-only truth, incomplete mutation tests, and large unfocused new files. Fix every Critical and Important issue and repeat both reviews.

- [ ] **Step 5: Commit final review fixes locally**

Use focused local commits. Do not merge, push, or delete the worktree.

- [ ] **Step 6: Run fresh completion proof**

After the final commit, rerun full tests, validator, generator, links, scans, manifest/hash, `git diff --check`, `git diff --exit-code`, and `git status --short --branch`.

Expected: clean local branch `codex/requirements-semantic-rebuild` with all prior and new commits preserved and no remote push.
