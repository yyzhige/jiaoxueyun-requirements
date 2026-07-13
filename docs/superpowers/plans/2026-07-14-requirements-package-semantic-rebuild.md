# Requirements Package Semantic Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the template-driven v2.0 generator with a validated domain-fact model that produces implementation-ready PRDs, object contracts, action permissions, state transitions, flows, AI tasks, page contracts, metrics, and testable scenarios for all 27 modules.

**Architecture:** Split generation into three layers: structured facts, fail-closed semantic validation, and Markdown rendering. The generated package remains under `docs/requirements/zhixu-handoff-v2.0`, while source facts and validators live under `tools/requirements-v2`; Node's built-in test runner verifies references, phase boundaries, and generated output before files are written.

**Tech Stack:** Node.js 24, ES modules, `node:test`, Markdown, Git.

---

## File Map

### Source Facts

- Create `tools/requirements-v2/model.mjs`: constructors, constants, and model assembly contract.
- Create `tools/requirements-v2/facts/catalogs.mjs`: baseline decisions, roles, duties, option sets, lifecycle policies, sensitivities, metrics, non-functional requirements, and phase extensions.
- Create `tools/requirements-v2/facts/foundation.mjs`: ACC, ORG, IAM, DGV, AUD, CURR, and TEA facts.
- Create `tools/requirements-v2/facts/teaching-loop.mjs`: HW, SUB, GRD, PUB, SCO, STU, INS, PLN, APP, and CORR facts.
- Create `tools/requirements-v2/facts/ai-reporting.mjs`: AIX, RPT, LPATH, and NOTI facts.
- Create `tools/requirements-v2/facts/extensions.mjs`: PREP, CONTENT, EXM, SCH, REPORT, and PLAT facts.
- Create `tools/requirements-v2/facts/index.mjs`: aggregate modules, cross-module flows, AI tasks, and baseline decisions.

### Validation

- Create `tools/requirements-v2/validate/model-validator.mjs`: required fields, uniqueness, and reference validation.
- Create `tools/requirements-v2/validate/semantic-validator.mjs`: action permissions, state transitions, flow symmetry, metric coverage, AI task mapping, and phase boundaries.
- Create `tools/requirements-v2/validate/index.mjs`: public validation API and formatted error output.
- Create `tools/validate_v2_requirements.mjs`: command-line validation entry point.

### Rendering

- Create `tools/requirements-v2/render/markdown.mjs`: Markdown table, list, heading, and link helpers.
- Create `tools/requirements-v2/render/contracts.mjs`: central object, field, relationship, state, permission, flow, lifecycle, AI, metric, and scan documents.
- Create `tools/requirements-v2/render/module-prd.mjs`: module-specific PRD renderer.
- Create `tools/requirements-v2/render/wireframe.mjs`: task-specific Web/App page contract renderer.
- Create `tools/requirements-v2/render/package.mjs`: package indexes, handoffs, review status, and file writes.
- Replace `tools/generate_v2_requirements.mjs`: validate first, then render; no embedded facts or default module templates.

### Tests

- Create `tools/tests/requirements-v2-model.test.mjs`: model and semantic validator tests.
- Create `tools/tests/requirements-v2-render.test.mjs`: rendered document and package integrity tests.

### Generated Documents

- Regenerate `docs/requirements/zhixu-handoff-v2.0/**` from the validated model.
- Modify `docs/product/zhixu-teaching-cloud-prd-v2.0.md`: add baseline decision IDs and metric references without changing approved product decisions.

## Task 1: Establish the Model Contract and Failing Tests

**Files:**
- Create: `tools/requirements-v2/model.mjs`
- Create: `tools/tests/requirements-v2-model.test.mjs`

- [ ] **Step 1: Write the failing model validation tests**

Create tests for duplicate IDs, a choice field without an Option Set, an action referencing a missing field, an invalid state transition, a Flow participant mismatch, an orphan Owner role, an executable phase-two page, an AI write task without confirmation, and a baseline metric without an event mapping.

```js
import test from "node:test";
import assert from "node:assert/strict";
import { validateRequirementModel } from "../requirements-v2/validate/index.mjs";

function validFixture() {
  return {
    roles: [{ id: "ROLE-STUDENT", label: "学生" }],
    duties: [],
    optionSets: [{ id: "OPT-BOOL", values: [{ code: "YES", label: "是" }] }],
    metrics: [{
      id: "MET-TEST",
      ownerRef: "ROLE-STUDENT",
      eventIds: ["EVT-TEST-START", "EVT-TEST-END"],
      scope: "fixture",
      aggregation: "duration",
      target: "defined",
    }],
    modules: [{
      id: "SUB-001",
      phase: 1,
      objects: [{
        id: "DAT-SUB-01",
        ownerRef: "ROLE-STUDENT",
        confirmerRef: "ROLE-STUDENT",
        states: ["DRAFT", "SUBMITTED"],
        fields: [{
          id: "SUB-F001",
          valueSource: { kind: "OPTION_SET", optionSetId: "OPT-BOOL" },
        }],
      }],
      actions: [{
        id: "SUB-ACT-01",
        targetObjectId: "DAT-SUB-01",
        inputFieldIds: ["SUB-F001"],
        outputFieldIds: [],
        transition: { from: "DRAFT", to: "SUBMITTED" },
        permissions: [{ effect: "ALLOW", roleRef: "ROLE-STUDENT" }],
        scenarioIds: ["SUB-SCN-01", "SUB-SCN-02"],
      }],
      pages: [],
      scenarios: [
        { id: "SUB-SCN-01", kind: "SUCCESS", actionId: "SUB-ACT-01" },
        { id: "SUB-SCN-02", kind: "BOUNDARY", actionId: "SUB-ACT-01" },
      ],
    }],
    flows: [{
      id: "DF-TEST",
      moduleIds: ["SUB-001"],
      steps: [{ actionId: "SUB-ACT-01" }],
    }],
    aiTasks: [],
    extensions: [],
  };
}

test("rejects a flow whose declared modules and action modules differ", () => {
  const model = validFixture();
  model.flows[0].moduleIds = ["HW-001"];
  model.flows[0].steps[0].actionId = "SUB-ACT-01";
  const errors = validateRequirementModel(model);
  assert.match(errors.join("\n"), /FLOW_PARTICIPANT_MISMATCH/);
});

test("rejects executable phase-two pages", () => {
  const model = validFixture();
  model.modules[0].phase = 2;
  model.modules[0].pages = [{ id: "REPORT-W01", actionIds: ["REPORT-ACT-01"] }];
  const errors = validateRequirementModel(model);
  assert.match(errors.join("\n"), /PHASE_BOUNDARY_EXECUTABLE_PAGE/);
});
```

- [ ] **Step 2: Run the tests and verify they fail because the validation API does not exist**

Run: `node --test tools/tests/requirements-v2-model.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `tools/requirements-v2/validate/index.mjs`.

- [ ] **Step 3: Define the model constructors and stable enums**

Implement constructors that preserve explicit values and never inject default fields, permissions, actions, pages, or scenarios.

```js
export const PHASE = Object.freeze({ FIRST: 1, SECOND: 2 });
export const RISK = Object.freeze({ READ: "READ", LOW: "LOW", HIGH: "HIGH" });
export const CLIENT = Object.freeze({ WEB: "WEB", APP: "APP" });

export function defineModule(value) {
  return structuredClone(value);
}

export function defineRequirementModel(value) {
  return structuredClone(value);
}
```

- [ ] **Step 4: Commit the failing tests and model contract**

```bash
git add tools/requirements-v2/model.mjs tools/tests/requirements-v2-model.test.mjs
git commit -m "test: define semantic requirements model contract"
```

## Task 2: Build Fail-Closed Validators

**Files:**
- Create: `tools/requirements-v2/validate/model-validator.mjs`
- Create: `tools/requirements-v2/validate/semantic-validator.mjs`
- Create: `tools/requirements-v2/validate/index.mjs`
- Create: `tools/validate_v2_requirements.mjs`
- Modify: `tools/tests/requirements-v2-model.test.mjs`

- [ ] **Step 1: Implement reference and uniqueness checks**

The model validator must report stable error codes for duplicate IDs, missing references, missing Option Sets, missing object fields, and invalid module ownership.

```js
export function validateReferences(model) {
  const errors = [];
  const fields = new Set(model.modules.flatMap((module) => module.objects.flatMap((object) => object.fields.map((field) => field.id))));
  const optionSets = new Set(model.optionSets.map((optionSet) => optionSet.id));

  for (const module of model.modules) {
    for (const object of module.objects) {
      for (const field of object.fields) {
        if (field.valueSource?.kind === "OPTION_SET" && !optionSets.has(field.valueSource.optionSetId)) {
          errors.push(`MISSING_OPTION_SET ${field.id} -> ${field.valueSource.optionSetId}`);
        }
      }
    }
    for (const action of module.actions) {
      for (const fieldId of [...action.inputFieldIds, ...action.outputFieldIds]) {
        if (!fields.has(fieldId)) errors.push(`MISSING_ACTION_FIELD ${action.id} -> ${fieldId}`);
      }
    }
  }
  return errors;
}
```

- [ ] **Step 2: Implement semantic checks**

Enforce these rules with named error codes:

- `FLOW_PARTICIPANT_MISMATCH`: Flow module set equals the modules owning its actions.
- `MISSING_ACTION_PERMISSION`: every action has at least one allow rule and explicit deny boundaries.
- `INVALID_STATE_TRANSITION`: source and target states belong to the target object.
- `MISSING_ACTION_SCENARIO`: every action has success plus failure or boundary coverage.
- `ORPHAN_OWNER_ROLE`: Owner and confirmer map to a login role, authorized duty, `SYSTEM`, `AI`, or current actor category.
- `AI_WRITE_WITHOUT_CONFIRMATION`: write tasks include preview fields and a confirmer duty.
- `PHASE_BOUNDARY_EXECUTABLE_PAGE`: phase-two extensions expose no executable first-stage pages or actions.
- `MISSING_METRIC_EVENT`: every baseline metric has numerator or duration events, scope, aggregation, and Owner.
- `FORBIDDEN_GENERIC_TEMPLATE`: reject the old five generic FR names and four generic page names.

- [ ] **Step 3: Add the validation command**

```js
import { requirementModel } from "./requirements-v2/facts/index.mjs";
import { assertValidRequirementModel } from "./requirements-v2/validate/index.mjs";

assertValidRequirementModel(requirementModel);
process.stdout.write(`validated modules=${requirementModel.modules.length} flows=${requirementModel.flows.length}\n`);
```

- [ ] **Step 4: Run validator unit tests**

Run: `node --test tools/tests/requirements-v2-model.test.mjs`

Expected: PASS for every invalid fixture and its expected error code.

- [ ] **Step 5: Commit validators**

```bash
git add tools/requirements-v2/validate tools/validate_v2_requirements.mjs tools/tests/requirements-v2-model.test.mjs
git commit -m "feat: add fail-closed requirements validators"
```

## Task 3: Define Shared Catalogs, Roles, Duties, Lifecycles, Metrics, and NFRs

**Files:**
- Create: `tools/requirements-v2/facts/catalogs.mjs`
- Create: `tools/requirements-v2/facts/index.mjs`
- Modify: `tools/tests/requirements-v2-model.test.mjs`

- [ ] **Step 1: Define immutable baseline decision IDs**

Create `BASE-001` through `BASE-010` for school governance, Shijiazhuang public-junior-high pilot scope, all-subject closed loop, Web/App clients, client capability asymmetry, in-product AI rather than terminal CLI, unified teacher identity, homeroom read/write boundary, subject-teacher improvement synchronization, and phase-two extension boundary.

- [ ] **Step 2: Define login roles and attachable duties**

Use these login roles: student, teacher, academic affairs, school administrator, platform operations. Define homeroom teacher and subject lead as duties attached to a teacher identity; preserve user-facing labels 任课教师、班主任、学科负责人.

```js
export const roles = [
  { id: "ROLE-STUDENT", label: "学生" },
  { id: "ROLE-TEACHER", label: "教师" },
  { id: "ROLE-ACADEMIC", label: "教务" },
  { id: "ROLE-SCHOOL-ADMIN", label: "学校管理员" },
  { id: "ROLE-PLATFORM-OPS", label: "平台运营" },
];

export const duties = [
  { id: "DUTY-SUBJECT-TEACHER", roleId: "ROLE-TEACHER", label: "任课教师" },
  { id: "DUTY-HOMEROOM", roleId: "ROLE-TEACHER", label: "班主任" },
  { id: "DUTY-SUBJECT-LEAD", roleId: "ROLE-TEACHER", label: "学科负责人" },
];
```

- [ ] **Step 3: Define lifecycle policies by object type**

Create separate policies for tenant configuration, school-year organization data, teaching facts, immutable audit events, temporary AI previews, report subscriptions, cross-term learning paths, and expiring exports. Do not reuse “current term writable” for all objects.

- [ ] **Step 4: Define baseline metrics**

Add `MET-001` through `MET-005` for teacher effective duration, student action conversion, unconfirmed subjective score publication, authorization violations, and AI-unavailable completion. Each metric must identify event IDs, scope, aggregation, Owner, and target.

- [ ] **Step 5: Define first-stage non-functional requirements**

Register these pilot defaults as explicit NFR facts:

- `NFR-001`: support 200 active pilot students and 60 concurrent submissions per class without losing accepted answers.
- `NFR-002`: non-AI list and detail reads have a p95 response target of 2 seconds at pilot load.
- `NFR-003`: draft-save acknowledgement has a p95 target of 1 second excluding media transfer.
- `NFR-004`: each submission supports up to 12 images, 10 MB per image, JPEG/PNG/HEIC, with resumable retry and retained successful parts.
- `NFR-005`: App preserves text and media-upload drafts across temporary disconnection; final submission requires a server receipt.
- `NFR-006`: AI work is asynchronous, exposes queued/processing/manual-fallback states, and never blocks manual grading or publication.
- `NFR-007`: Web supports the current and previous major Chrome and Edge versions; App product requirements support iOS 16+ and Android 10+.
- `NFR-008`: authorization denial, version conflict, audit failure, and partial success have distinct observable results.
- `NFR-009`: exact school retention periods are mandatory activation configuration owned by the school administrator; unset policies block sensitive export and AI use rather than applying an implicit duration.

- [ ] **Step 6: Define Option Sets with stable codes**

Retain valid existing Option Sets, split assignment type from submission method, add late policy, resubmission policy, score rounding, AI capability decision, task completion evidence, report schedule, report metric, and visibility policy sets.

- [ ] **Step 7: Run catalog validation**

Run: `node --test tools/tests/requirements-v2-model.test.mjs`

Expected: catalog tests PASS; full model test still reports missing modules until Tasks 4-7 populate them.

- [ ] **Step 8: Commit shared facts**

```bash
git add tools/requirements-v2/facts/catalogs.mjs tools/requirements-v2/facts/index.mjs tools/tests/requirements-v2-model.test.mjs
git commit -m "feat: define shared requirements catalogs"
```

## Task 4: Model Foundation and Governance Modules

**Files:**
- Create: `tools/requirements-v2/facts/foundation.mjs`
- Modify: `tools/requirements-v2/facts/index.mjs`
- Modify: `tools/tests/requirements-v2-model.test.mjs`

- [ ] **Step 1: Add ACC and ORG objects, fields, actions, states, and scenarios**

ACC actions must separately cover school search, login, first activation, identity selection, term selection, context switch, and context expiration. ORG must cover term, grade, class, teacher, student, teaching assignment, homeroom assignment, and batch import with object-level results.

- [ ] **Step 2: Add IAM action-level permission facts**

Define grant creation, scope preview, temporary grant, revoke, expiry, and permission decision replay. Every grant action must include grantor authority, target duty, scope, effective time, expiry, reason, and audit requirement.

- [ ] **Step 3: Add DGV and AUD lifecycle and sensitive-access facts**

Model retention policy, AI data-use policy, export request, sensitive access request, approval, session expiry, immutable audit append, and audit review case.

- [ ] **Step 4: Add CURR and TEA task facts**

CURR must model curriculum, textbook, chapter, knowledge point, and mapping versions. TEA must contain teacher todo queries and homeroom coordination actions without owning source scores, evidence, or plans.

- [ ] **Step 5: Run foundation tests**

Run: `node --test tools/tests/requirements-v2-model.test.mjs --test-name-pattern='foundation|permission|owner'`

Expected: PASS with no orphan `平台运营` or `学科负责人` references and no generic permission rows.

- [ ] **Step 6: Commit foundation facts**

```bash
git add tools/requirements-v2/facts/foundation.mjs tools/requirements-v2/facts/index.mjs tools/tests/requirements-v2-model.test.mjs
git commit -m "feat: model foundation requirements facts"
```

## Task 5: Model Assignment, Submission, Grading, and Publication

**Files:**
- Create: `tools/requirements-v2/facts/teaching-loop.mjs`
- Modify: `tools/requirements-v2/facts/index.mjs`
- Modify: `tools/tests/requirements-v2-model.test.mjs`

- [ ] **Step 1: Define HW fields and actions**

Include assignment title, instructions, subject, course, classes, open time, due time, late policy, resubmission policy, assignment type, item order, prompt, answer, points, Rubric version, knowledge points, feedback policy, notification policy, release version, and revision reason. Actions must distinguish draft creation, item editing, validation, preview, immediate release, scheduled release, close, and revision.

- [ ] **Step 2: Define SUB fields and actions**

Include answer payload by question type, media metadata, page and question mapping, image quality, upload session, draft version, submission version, late flag, resubmission relation, receipt, and weak-network recovery. Actions must distinguish save draft, upload part, retry upload, submit, resubmit, and view receipt.

- [ ] **Step 3: Define the full-subject AI grading capability matrix**

For each supported subject family, question type, and submission method record recognition level, scoring level, required evidence, mandatory review, batch-confirm eligibility, and unavailable fallback. Subjective questions remain mandatory-review; unsupported combinations route to manual grading.

- [ ] **Step 4: Define GRD fields and actions**

Include recognized answer, recognition regions, input submission version, item version, Rubric version, suggested score, score rationale, confidence status, limitations, teacher score, teacher feedback, correction reason, and decision version. Actions must distinguish enqueue, process, route, correct recognition, accept suggestion, override score, manual grade, batch confirm, and resolve version conflict.

- [ ] **Step 5: Define PUB fields and actions**

Include publish eligibility, blocker codes, answer and feedback visibility time, result version, correction version, public correction note, notification status, and dependent invalidation records. Actions must distinguish preview, publish selected students, retry failed publication, correct result, and re-confirm invalidated interpretations.

- [ ] **Step 6: Add end-to-end flow tests**

Test `DF-004` through `DF-009` for exact action participants, source and target Data IDs, source and target version fields, idempotency key composition, object-level failure, retry behavior, and downstream invalidation.

- [ ] **Step 7: Run core grading tests**

Run: `node --test tools/tests/requirements-v2-model.test.mjs --test-name-pattern='assignment|submission|grading|publication|DF-00'`

Expected: PASS; no acceptance statement references an undefined field.

- [ ] **Step 8: Commit the grading loop**

```bash
git add tools/requirements-v2/facts/teaching-loop.mjs tools/requirements-v2/facts/index.mjs tools/tests/requirements-v2-model.test.mjs
git commit -m "feat: model assignment and grading closed loop"
```

## Task 6: Model Scores, Evidence, Improvement, and Student Execution

**Files:**
- Modify: `tools/requirements-v2/facts/teaching-loop.mjs`
- Modify: `tools/tests/requirements-v2-model.test.mjs`

- [ ] **Step 1: Add SCO and STU view definitions without duplicate facts**

Gradebook and student detail objects must store query or column definitions, saved views, and follow-up records only. Score, evidence, and plan content must remain references to source Data IDs and versions.

- [ ] **Step 2: Add INS evidence and mastery contracts**

Define evidence source, stage, knowledge point version, result, error type, weight, validity, teacher confirmation, invalidation reason, and mastery interpretation version. AI can create attribution and mastery candidates; the subject teacher confirms student-visible interpretations.

- [ ] **Step 3: Add PLN plan and task contracts**

Define improvement goal, subject, knowledge point, priority, task content, workload, due time, success condition, evidence requirement, revalidation method, teacher confirmer, student difficulty feedback, adjustment reason, and close reason. Synchronization to the corresponding subject teacher and homeroom whole-class view must be explicit Flow outputs, not a report recipient field.

- [ ] **Step 4: Add APP and CORR execution contracts**

Define student todo aggregation, task deep links, local progress, completion evidence, difficulty feedback, correction answer, teacher judgment, repeated correction, and overdue handling. APP remains an aggregation and navigation module rather than a second owner of homework or plan facts.

- [ ] **Step 5: Add invalidation chain tests**

Verify that a result correction invalidates dependent evidence, mastery interpretations, improvement candidates, report interpretations, and learning-path explanations while preserving historical versions.

- [ ] **Step 6: Run learning-loop tests**

Run: `node --test tools/tests/requirements-v2-model.test.mjs --test-name-pattern='score|evidence|plan|student|correction|invalidation'`

Expected: PASS with subject-teacher confirmation and homeroom read-only coordination enforced.

- [ ] **Step 7: Commit learning-loop facts**

```bash
git add tools/requirements-v2/facts/teaching-loop.mjs tools/tests/requirements-v2-model.test.mjs
git commit -m "feat: model evidence and improvement loop"
```

## Task 7: Model AI Tasks, Reports, Long-Term Paths, and Notifications

**Files:**
- Create: `tools/requirements-v2/facts/ai-reporting.mjs`
- Modify: `tools/requirements-v2/facts/index.mjs`
- Modify: `tools/tests/requirements-v2-model.test.mjs`

- [ ] **Step 1: Define the AI task registry**

Register concrete tasks for authorized data query, learning analysis, assignment draft creation, feedback draft creation, improvement-plan draft creation, ad-hoc report creation, report subscription management, reminder creation, and controlled target actions. Each task must include role or duty, clients, natural-language examples, parameter schema, clarification rules, target Action ID, risk, preview fields, confirmer, result schema, failure behavior, and reversibility.

- [ ] **Step 2: Split report definition, subscription, run, snapshot, and delivery objects**

Report fields must include name, metric IDs, data scope, time range, schedule frequency, execution time, timezone, recipients, data cutoff, permission result, source versions, run result, and delivery state. Subscription and run use separate state machines.

- [ ] **Step 3: Define long-term cross-term path facts**

Learning path timeline entries reference published scores, evidence, corrections, plan execution, and teacher confirmations. Interpretation versions include subject, knowledge point, evidence references, explanation, confidence limitations, teacher confirmer, visible-from time, superseded-by relation, and stale reason.

- [ ] **Step 4: Define notification facts**

Notifications contain source event, recipient, summary template, deep link, delivered time, read time, handled time, failure code, and retry count. Notification failure never rolls back source business facts.

- [ ] **Step 5: Run AI and reporting tests**

Run: `node --test tools/tests/requirements-v2-model.test.mjs --test-name-pattern='AI task|report|learning path|notification'`

Expected: PASS; every write task maps to one Action ID and every report run rechecks permission.

- [ ] **Step 6: Commit AI and reporting facts**

```bash
git add tools/requirements-v2/facts/ai-reporting.mjs tools/requirements-v2/facts/index.mjs tools/tests/requirements-v2-model.test.mjs
git commit -m "feat: model AI reports and learning paths"
```

## Task 8: Complete P1-P3 Modules and Enforce Phase Boundaries

**Files:**
- Create: `tools/requirements-v2/facts/extensions.mjs`
- Modify: `tools/requirements-v2/facts/index.mjs`
- Modify: `tools/tests/requirements-v2-model.test.mjs`

- [ ] **Step 1: Define PREP, CONTENT, and EXM with full document granularity**

PREP covers lesson plans, material references, classroom activities, and generation of assignment drafts. CONTENT covers question versions, answers, analyses, knowledge mappings, licensing, and content permissions. EXM covers exam events, subject scores, import validation, aggregate score rules, publication, correction, and evidence output.

- [ ] **Step 2: Define SCH and PLAT action contracts**

SCH covers calendar, teacher, class, course, room, hard and soft constraints, candidate generation, conflict review, confirmation, publication, and stale candidates. PLAT covers onboarding case, service plan, policy template, school confirmation, service state, support access request, expiry, and audit without student-detail default access.

- [ ] **Step 3: Restrict REPORT to a phase-two extension registration**

REPORT keeps its future actors, dependencies, required permissions, data-governance reuse, and unresolved product decisions. It must not have executable Action IDs, Page IDs, first-stage acceptance scenarios, external links, or delivery behavior.

- [ ] **Step 4: Register third-party notifications and AI video as extensions only**

Store extension IDs, dependency contracts, entry criteria, and excluded first-stage behavior. Do not generate first-stage modules or page contracts for AI explanation video or AI teaching video.

- [ ] **Step 5: Run full 27-module validation**

Run: `node tools/validate_v2_requirements.mjs`

Expected: `validated modules=27` and zero validation errors.

- [ ] **Step 6: Commit remaining facts**

```bash
git add tools/requirements-v2/facts/extensions.mjs tools/requirements-v2/facts/index.mjs tools/tests/requirements-v2-model.test.mjs
git commit -m "feat: complete requirements domain facts"
```

## Task 9: Build Renderers and Replace the Generator

**Files:**
- Create: `tools/requirements-v2/render/markdown.mjs`
- Create: `tools/requirements-v2/render/contracts.mjs`
- Create: `tools/requirements-v2/render/module-prd.mjs`
- Create: `tools/requirements-v2/render/wireframe.mjs`
- Create: `tools/requirements-v2/render/package.mjs`
- Replace: `tools/generate_v2_requirements.mjs`
- Create: `tools/tests/requirements-v2-render.test.mjs`

- [ ] **Step 1: Write failing renderer tests**

Assert that GRD PRD renders score and rationale fields, RPT renders separate subscription and run states, APP renders student task pages rather than audit workbench pages, REPORT emits extension-only content, and the trace matrix includes baseline decision, Action, Data, Field, Flow, Page, Scenario, and Metric IDs.

```js
test("renders student task pages instead of the generic workbench template", () => {
  const appModule = requirementModel.modules.find((module) => module.id === "APP-001");
  const output = renderModuleWireframe(appModule, requirementModel);
  assert.match(output, /今日学习/);
  assert.doesNotMatch(output, /列表\/工作台|历史\/审计页/);
});
```

- [ ] **Step 2: Run renderer tests and verify failure**

Run: `node --test tools/tests/requirements-v2-render.test.mjs`

Expected: FAIL with missing renderer modules.

- [ ] **Step 3: Implement Markdown and central-contract renderers**

Render object field schemas, relationships, object-specific transitions, action permissions, detailed Flow contracts, AI task registry, metrics, lifecycle policies, and semantic scan results directly from validated facts.

- [ ] **Step 4: Implement PRD and page renderers**

PRDs iterate module-specific objects, actions, transitions, permissions, scenarios, NFRs, clients, and dependencies. Wireframes iterate task-specific pages and action mappings; phase-two extensions render no executable page contract.

- [ ] **Step 5: Replace the generator entry point**

```js
import { requirementModel } from "./requirements-v2/facts/index.mjs";
import { assertValidRequirementModel } from "./requirements-v2/validate/index.mjs";
import { renderRequirementPackage } from "./requirements-v2/render/package.mjs";

assertValidRequirementModel(requirementModel);
renderRequirementPackage(requirementModel, process.cwd());
```

- [ ] **Step 6: Run renderer tests**

Run: `node --test tools/tests/requirements-v2-render.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit renderers**

```bash
git add tools/requirements-v2/render tools/generate_v2_requirements.mjs tools/tests/requirements-v2-render.test.mjs
git commit -m "feat: render requirements from validated facts"
```

## Task 10: Regenerate the v2.0 Package and Baseline Traceability

**Files:**
- Modify: `docs/product/zhixu-teaching-cloud-prd-v2.0.md`
- Regenerate: `docs/requirements/zhixu-handoff-v2.0/**`

- [ ] **Step 1: Set the model review status to semantic reconstruction**

Set the review-status fact to `SEMANTIC_RECONSTRUCTION` before rendering. The renderer must derive both the package entry and review-status document from that fact; do not edit either generated Markdown file directly.

- [ ] **Step 2: Run validation before generation**

Run: `node tools/validate_v2_requirements.mjs`

Expected: `validated modules=27` with no errors.

- [ ] **Step 3: Generate all documents**

Run: `node tools/generate_v2_requirements.mjs`

Expected: central contracts, 27 PRDs, first-stage page contracts, extension registrations, indexes, handoffs, and scan report are regenerated.

- [ ] **Step 4: Verify baseline decision and metric traceability**

Run: `rg -n 'BASE-|MET-001|MET-002|MET-003|MET-004|MET-005' docs/product/zhixu-teaching-cloud-prd-v2.0.md docs/requirements/zhixu-handoff-v2.0/02-indexes/requirement-traceability.md`

Expected: every immutable decision and all five success metrics appear in the baseline and trace matrix.

- [ ] **Step 5: Commit generated requirements**

```bash
git add docs/product/zhixu-teaching-cloud-prd-v2.0.md docs/requirements/zhixu-handoff-v2.0
git commit -m "docs: regenerate semantic v2 requirements package"
```

## Task 11: Run Full Structural and Semantic Verification

**Files:**
- Verify: `tools/tests/requirements-v2-model.test.mjs`
- Verify: `tools/tests/requirements-v2-render.test.mjs`
- Modify: `docs/requirements/zhixu-handoff-v2.0/07-review-checklists/completeness-scan-report.md` through regeneration only

- [ ] **Step 1: Run all tests**

Run: `node --test tools/tests/requirements-v2-model.test.mjs tools/tests/requirements-v2-render.test.mjs`

Expected: all tests PASS.

- [ ] **Step 2: Re-run standalone validation**

Run: `node tools/validate_v2_requirements.mjs`

Expected: 27 modules, zero semantic errors, no phase boundary violations.

- [ ] **Step 3: Scan for the old template artifacts**

Run: `rg -n '对象查询与范围筛选|创建/修改/确认主动作|列表/工作台|详情/处理页|历史/审计页' docs/requirements/zhixu-handoff-v2.0`

Expected: no matches in module PRDs or page contracts.

- [ ] **Step 4: Scan for placeholders and positive terminal CLI requirements**

Run: `rg -n 'TBD|TODO|待补|占位|终端命令行入口|shell command|terminal CLI' docs/requirements/zhixu-handoff-v2.0`

Expected: no placeholders and no positive target-user terminal CLI requirement; negative boundary statements are allowed only in baseline or AI governance documents.

- [ ] **Step 5: Verify generated-file stability**

Run: `node tools/generate_v2_requirements.mjs && git diff --exit-code`

Expected: exit code 0, proving deterministic generation.

- [ ] **Step 6: Verify repository formatting and status**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only intentional verification changes, if any.

- [ ] **Step 7: Treat any verification failure as a return to the owning task**

Do not patch generated Markdown. A model failure returns to Tasks 3-8; a validation failure returns to Task 2; a rendering or determinism failure returns to Tasks 9-10. Re-run all Task 11 commands after the owning source is corrected.

## Task 12: Final Human Review and Fact-Source Promotion

**Files:**
- Modify through facts and regeneration: `docs/requirements/zhixu-handoff-v2.0/02-product-review-status.zh-CN.md`
- Modify through facts and regeneration: `docs/requirements/zhixu-handoff-v2.0/07-review-checklists/completeness-scan-report.md`

- [ ] **Step 1: Walk the complete first-stage teaching loop**

Manually verify school selection, identity context, assignment release, student submission, AI routing, teacher confirmation, result publication, correction, evidence, subject plan, homeroom coordination, student execution, periodic report, and long-term path using only generated references.

- [ ] **Step 2: Verify the five baseline success metrics can be calculated**

For each metric, identify its start and end events or numerator and denominator, data scope, exclusion rules, aggregation window, Owner, and pilot target in generated documents.

- [ ] **Step 3: Verify role boundaries with concrete negative scenarios**

Confirm that a homeroom-only duty cannot change another subject's score or plan, a school administrator cannot browse student details by default, platform operations cannot access student details, and students cannot access unpublished answers or results.

- [ ] **Step 4: Promote package status only after review passes**

Set review status to “v2.0 product fact source; semantic review passed” through the fact model and regenerate. Do not edit generated status documents directly.

- [ ] **Step 5: Run final proof commands**

Run: `node --test tools/tests/*.test.mjs && node tools/validate_v2_requirements.mjs && node tools/generate_v2_requirements.mjs && git diff --exit-code`

Expected: all tests PASS, validation reports zero errors, and deterministic generation produces no diff.

- [ ] **Step 6: Commit fact-source promotion**

```bash
git add tools docs
git commit -m "docs: promote semantically reviewed requirements baseline"
```
