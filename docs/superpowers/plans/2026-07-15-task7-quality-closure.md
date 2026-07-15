# Task 7 Quality Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make report scope, AI draft capability, notification ownership, clarification coverage, conditional notification fields, and state reachability executable and fail closed.

**Architecture:** Extend the existing authored facts with closed scope and capability metadata, then enforce them in the generic structure and semantic validators. Keep report and notification policy inside their owning modules, and migrate state reachability in source facts without index-time enrichment.

**Tech Stack:** Node.js ESM, `node:test`, authored JavaScript requirement facts, structural and semantic validators.

---

### Task 1: Report Scopes And Draft Capabilities

**Files:**
- Modify: `tools/requirements-v2/facts/catalogs.mjs`
- Modify: `tools/requirements-v2/facts/ai-reporting.mjs`
- Modify: `tools/requirements-v2/facts/teaching-loop.mjs`
- Modify: `tools/requirements-v2/validate/structure-validator.mjs`
- Modify: `tools/requirements-v2/validate/semantic-validator.mjs`
- Test: `tools/tests/requirements-v2-model.test.mjs`

- [ ] **Step 1: Write focused failing tests**

Add tests named `executes report authorization through closed audience scopes`, `keeps report subscription management with the creating actor`, and `binds AI drafts to capability-matched temporary preview Actions`. Mutate scope metadata, accepted codes, permission subjects, creator ownership, capability values, and draft targets to prove every boundary fails closed.

- [ ] **Step 2: Verify RED**

Run:

```bash
node --test tools/tests/requirements-v2-model.test.mjs --test-name-pattern='report authorization|subscription management|capability-matched'
```

Expected: all new tests fail because the closed scope profiles, own-record subscription contract, capabilities, and AIX draft Actions do not exist.

- [ ] **Step 3: Implement the minimal report and capability facts**

Add the static data-scope Option Set, closed report profile metadata, profile-specific definition CREATE Actions, creator-bound subscription fields and permissions, audience-specific AI task variants, and AIX feedback/plan preview CREATE Actions. Add optional Action capability structure validation, required AI Task capability validation, exact Task-to-Action matching, and temporary preview draft validation.

- [ ] **Step 4: Verify GREEN**

Run the focused command from Step 2. Expected: all focused tests pass with no unrelated failure.

### Task 2: Notification And Clarification Contracts

**Files:**
- Modify: `tools/requirements-v2/facts/ai-reporting.mjs`
- Modify: `tools/requirements-v2/validate/structure-validator.mjs`
- Modify: `tools/requirements-v2/validate/semantic-validator.mjs`
- Test: `tools/tests/requirements-v2-model.test.mjs`

- [ ] **Step 1: Write focused failing tests**

Add tests named `lets every supported recipient mutate only their own notification`, `binds notification mutation fields to exactly one Action`, and `covers every required AI parameter with blocking clarification`. Include wrong recipient, operations access, removed output fields, missing metric/data-scope/time-range coverage, unknown parameters, and duplicate parameters.

- [ ] **Step 2: Verify RED**

Run:

```bash
node --test tools/tests/requirements-v2-model.test.mjs --test-name-pattern='supported recipient|notification mutation fields|blocking clarification'
```

Expected: the new tests fail because notification ownership is student-specific, conditional field bindings are absent, and clarification union coverage is not enforced.

- [ ] **Step 3: Implement the minimal notification and clarification rules**

Replace student-specific recipient permissions with `CURRENT_ACTOR` own/other-record rules plus operations DENY. Add structured `required.whenActionIds` bindings and remove unrelated Action outputs. Extend AI Task structure validation to compare the exact union of blocking clarification parameters with the required schema properties and reject duplicates across rules.

- [ ] **Step 4: Verify GREEN**

Run the focused command from Step 2. Expected: all focused tests pass and the nonrollback policy remains unchanged.

### Task 3: Full State Reachability Migration

**Files:**
- Modify: `tools/requirements-v2/facts/foundation.mjs`
- Modify: `tools/requirements-v2/facts/teaching-loop.mjs`
- Modify: `tools/requirements-v2/facts/ai-reporting.mjs`
- Modify: `tools/requirements-v2/validate/semantic-validator.mjs`
- Test: `tools/tests/requirements-v2-model.test.mjs`

- [ ] **Step 1: Write the generic failing test**

Add `rejects NONE for polymorphic or state-changing objects`, covering an existing ACTION_GRAPH object downgraded to NONE and a one-state write object downgraded to NONE.

- [ ] **Step 2: Verify RED**

Run:

```bash
node --test tools/tests/requirements-v2-model.test.mjs --test-name-pattern='rejects NONE'
```

Expected: the downgraded models are accepted by the current validator.

- [ ] **Step 3: Enforce the NONE rule and audit the full model**

Require a one-state target with no state-changing Action for NONE. Run the full model test to enumerate every authored object that must move to ACTION_GRAPH. For each object, author the real entry states and add missing lifecycle Actions where the module owns the transition.

- [ ] **Step 4: Verify GREEN**

Run the focused state test and then:

```bash
node --test tools/tests/requirements-v2-model.test.mjs
```

Expected: the focused test and full model suite pass without an exemption or index default.

### Task 4: Final Verification And Commit

**Files:**
- Verify every changed file

- [ ] **Step 1: Run complete verification**

```bash
node --test tools/tests/*.test.mjs
node tools/validate_v2_requirements.mjs
node --check tools/requirements-v2/facts/catalogs.mjs
node --check tools/requirements-v2/facts/foundation.mjs
node --check tools/requirements-v2/facts/teaching-loop.mjs
node --check tools/requirements-v2/facts/ai-reporting.mjs
node --check tools/requirements-v2/validate/structure-validator.mjs
node --check tools/requirements-v2/validate/semantic-validator.mjs
node --check tools/tests/requirements-v2-model.test.mjs
git diff --check
```

Expected: zero test failures, CLI validation success, every syntax check exits zero, and no diff whitespace errors.

- [ ] **Step 2: Self-review all six findings**

Inspect the staged diff and confirm report negative scopes, draft retarget failures, recipient ownership, NONE restrictions, clarification equality, and notification field bindings each have both positive and negative tests.

- [ ] **Step 3: Create the local commit**

```bash
git add docs/superpowers/specs/2026-07-15-task7-quality-closure-design.md docs/superpowers/plans/2026-07-15-task7-quality-closure.md tools/requirements-v2 tools/tests/requirements-v2-model.test.mjs
git commit -m "Close Task 7 semantic quality gaps"
```

Do not push.
