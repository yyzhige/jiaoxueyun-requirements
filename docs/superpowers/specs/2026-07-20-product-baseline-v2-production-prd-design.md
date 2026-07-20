# Product Baseline v2.0 Production PRD Migration Design

date: 2026-07-20
status: approved_by_finalized_product_baseline
authoritative_source: /Users/a1234/Desktop/student/README.md
decision_record: /Users/a1234/Desktop/student/讨论稿.md#83
high_level_vision_only: /Users/a1234/Desktop/student/产品蓝图.html

## 1. Objective

Migrate the generated Zhixu requirements package from the 2026-07-16 semantic baseline to the finalized 2026-07-20 product baseline. The new package must describe the full target product without presenting phase-two or phase-three capabilities as already delivered, and must preserve the existing facts-first, fail-closed generation architecture.

The migration is complete only when README v2.0 chapters and D003-D096 can be traced to modules, pages, Flows, objects, actions, permissions, status dimensions, metrics, and acceptance scenarios, and when every generated Markdown file is rebuilt from validated facts.

## 2. Source Precedence

1. `README.md` v2.0 is authoritative for product functions, permissions, data, state, phase, and acceptance boundaries.
2. Discussion section 83 explains the selected route, rejected alternatives, and replacement relationship for D003-D096.
3. `产品蓝图.html` supplies only target shape, stage names, and investor-facing value. It cannot introduce detailed permissions, data retention, technical design, or internal governance.
4. Existing requirement facts are retained only when consistent with the first three sources.
5. Generated Markdown is never edited as a fact source.

## 3. Approaches Considered

### Approach A: Patch generated PRD prose

Rejected. It would create fast visible alignment but leave validators, page contracts, Flows, permissions, states, and tests on the old product. The next generator run would also erase the changes.

### Approach B: Retag whole modules by phase

Rejected. Several current modules mix first-stage facts, second-stage AI behavior, and third-stage long-term interpretation. Moving an entire module would either remove required first-stage facts or falsely publish future behavior as current.

### Approach C: Structured baseline migration with mixed-module decomposition

Selected. Stable module IDs remain when their business responsibility survives, but mixed objects and actions move to the phase that owns them or to a new focused module. Baseline chapters, decisions, migration changes, metric groups, and launch gates become validated facts and drive generated traceability.

## 4. Phase and Release Model

`phase` describes the product stage that owns a requirement. `releaseStatus` describes whether that requirement is in the current delivery scope.

| Phase | Name | Release interpretation |
|---|---|---|
| 1 | 教学事实底座 | `BUILD_READY`; current delivery scope. Completion requires safe operation with real minor students, not merely an internal happy-path loop. |
| 2 | AI 评定与个性化教学视频 | `PLANNED`; complete production requirements and planned page contracts, excluded from the phase-one release manifest. |
| 3 | 长期认知画像与双轨进度 | `PLANNED`; complete long-term requirements and planned page contracts, excluded from the phase-one release manifest. |

Phase-two and phase-three contracts may define objects, actions, states, pages, and Flows so engineering can estimate and review them. Renderers must display a planned banner, release gate, and dependencies, and must not call them live or first-stage executable.

## 5. Module Ownership

### Phase one

- `ACC`, `ORG`, `IAM`, `DGV`, `AUD`: school activation, identity/account/profile separation, relationship authorization, guardian assistance, high-impact authorization, lifecycle, export, migration, deletion, and sensitive access.
- `CURR`, `CONTENT`: curriculum, materials, source rights, stable learning objectives, and versioned content facts without claiming long-term student cognition.
- `TEA`: action-first teacher workspace with teaching problem, teacher judgment, and linked action as separate facts. First-stage items can arise from operational and manually recorded facts; AI recommendations remain phase two.
- `HW`: four activity purposes, immutable publication snapshot, replacement activity rules, and independent governance/open/archive/participation/time/AI status dimensions.
- `SUB`: original answers and media, help environment, server submission receipt, weak-network intent credential, fixed manifest digest, completion window, and platform-failure protection.
- `APP`, `STU`, `NOTI`: student required/pending/processing/optional home areas, source-pinned management facts, in-product notifications, deep-link reauthorization, accessibility, and shared-device protection within product-controlled scope.
- `PREP`, `EXM`, `SCH`, `PLAT`: factual preparation, school diagnostic score import, schedules, school onboarding, service entitlement, activity protection window, and exit rights. They must not imply AI assessment, long-term profile, or unlimited free post-termination service.
- `RPT`: factual operational reports only. AI-generated analysis and long-term cognition reports are not phase-one capabilities.

### Phase two

- `GRD`: renamed product responsibility “AI 评定与完成判定”; no routine teacher approval node. It returns completed, correction required, more input required, unable to determine, or exception review required.
- `PUB`: four-layer feedback, publication gates, independent answer/solution/rubric open times, dispute/correction, and batch impact recalculation.
- `CORR`: AI-driven correction and re-evaluation with professional exception review, without turning teachers back into routine assessors.
- `AIX`: in-product AI conversation constrained by current permissions, answer-open rules, and confirmed actions.
- New `PROG`: minimum progress skeleton—current grade/course, unit, learning target, prerequisites, target status, and next allowed target.
- New `VIDEO`: problem-driven and progress-driven video, source version binding, all pre-delivery gates, controlled playback, accessibility and low-bandwidth alternatives, recall, minimum fair quota, reservation and settlement.

### Phase three

- `INS`: long-term evidence interpretation and reversible mastery judgment.
- `PLN`: long-term personalized improvement and cross-subject coordination based on continuous evidence.
- `LPATH`: cross-term cognitive history and dual-track class/personal progress.
- Long-term reusable reviewed video fragments and individualized composition are attached to `VIDEO` as phase-three extension contracts, not prerequisites of the phase-two minimum loop.

## 6. Structured Baseline Facts

Create focused catalogs instead of expanding the already large domain files:

- `product-baseline-v2.mjs`: baseline metadata, three phases, delivery states, terminology, product invariants, D003-D096 decisions, and README chapter registry.
- `baseline-traceability.mjs`: chapter and decision mappings to module/page/Flow/object/action/permission/state/metric/scenario references.
- `baseline-migration.mjs`: old rule, new rule, reason, rejected route, and affected references.
- `launch-governance.mjs`: six balanced metric groups and three launch-gate types.

Every reference is an ID or a closed structured reference. Free-text lists do not satisfy traceability.

## 7. Mandatory Domain Replacements

### Terminology

- Teaching uses “AI 评定与完成判定”.
- “审批” is allowed only for identity, authorization, school activation, governance, emergency access, and comparable administrative workflows.
- Generated teaching PRDs must not use routine teacher approval as an AI assessment step.

### Ranking and score use

- No default comprehensive ranking, public weakness leaderboard, or cross-context single score.
- Specific activity scores and levels remain allowed.
- Group insight uses anonymous distribution, coverage, trends, and concrete targets.

### Activity semantics

- Primary purposes are formal assignment, daily practice, diagnostic assessment, and teaching presentation.
- Teaching presentation cannot create submission, lateness, completion, or mastery evidence.
- Publication freezes prompt, material, requirement, purpose, and critical help rules.
- Semantic changes require cancellation and replacement; only non-semantic corrections and assessment-standard corrections can version the same activity.
- Governance, open window, archive, participation, time, and AI processing are independent status axes.

### Identity, relationship, and guardian governance

- Platform identity, login account, and school profile remain separate.
- Identity number is immutable and non-reusable only while the identity exists; full deletion removes lookup mapping, and later registration creates a new number.
- Student primary account, guardian relation, school data authorization, and short task-level assistance session are separate.
- High-impact authorization and guardian disputes use a closed authorization matrix and dispute freeze.
- Temporary substitute teaching requires an expiring teaching relationship.

### Weak-network timeliness

- Normal acceptance uses the complete server receipt time.
- Protected timeliness requires a pre-deadline server credential bound to actor, activity, submission version, fixed content manifest digest, and limited completion window.
- Added or replaced content, expired credentials, or late completion are not protected.
- If the platform cannot issue a credential, system-failure protection applies; the student is not required to obtain an unavailable credential.

### Original facts and AI-derived judgments

- Original answers, media, explanations, and interaction facts are immutable source facts.
- Recognition, transcription, assessment, diagnosis, mastery, and profile statements are derived, versioned, challengeable, correctable, and replaceable.
- Hidden chain-of-thought and vendor debug fields are removed before business persistence; only verifiable teaching rationale and minimum business trace are stored.

### AI result status and feedback

- AI results have independent processing, publication, dispute/correction, and validity axes.
- The next-step outcome is completed, correction required, more input required, unable to determine, or exception review required.
- Four feedback layers are result/error location, non-answer scaffold, targeted teaching, and complete answer/solution.
- Answer, solution, and rubric open times govern pages, search, export, notifications, AI conversation, video, cache, and direct links.
- Required permission, safety, or teaching-correctness gate failure keeps content unpublished.

### Commercial and continuity boundaries

- The school is the payer; financial contact and governance administrator are separate.
- No student/guardian payment, advertising, weakness-based commerce, content marketplace, or teacher revenue share in the current baseline.
- Core phase-two AI assessment and minimum video help are school-wide baseline entitlements.
- Termination protects already published activities for a defined window and provides an exit window; continuing data rights follow law and contract, not an unlimited free-service promise.
- Controlled playback does not claim to stop external recording.

## 8. Traceability Contract

Each README chapter must provide:

- chapter ID, heading, source line anchor, phase ownership, decision IDs, and requirement summary;
- module IDs and page IDs;
- Flow IDs;
- object IDs and action IDs;
- permission references as `moduleId/actionId/effect/subject`;
- state references as object plus axis or state;
- metric IDs and launch-gate IDs;
- positive, boundary, and failure scenario IDs.

The validator rejects missing source chapters, unresolved references, phase-inconsistent references, decisions without a chapter, chapters without acceptance scenarios, and migration changes without affected contracts.

## 9. Validation Rules

Add fail-closed checks for:

- exact phase catalog and release-status combinations;
- no current-release surface from planned phases;
- no planned capability described as launched;
- teaching use of “审批” outside governance contexts;
- default ranking, public weakness board, or single aggregate-score capabilities;
- teaching presentation connected to submission or evidence-producing actions;
- activity single-state compression or missing required state axes;
- semantic post-publication mutation without replacement;
- weak-network timeliness without credential, manifest digest, and bounded completion window;
- identity IDs described as permanent after deletion;
- AI result missing any status axis or using binary-only next steps;
- answer-open policy not applied to every declared delivery surface;
- hidden chain-of-thought persistence;
- video delivery without all gates or source versions;
- unlimited post-termination service wording;
- incomplete six-group metrics or three launch gates;
- incomplete chapter/decision/migration traceability.

## 10. Rendering

Generate from facts:

- product baseline summary with three phases and release statuses;
- updated module PRDs and page contracts, including planned banners;
- README chapter-to-contract trace matrix;
- D003-D096 decision matrix;
- old-rule → new-rule migration change log;
- independent activity and AI-result status-axis catalogs;
- high-impact authorization and guardian-assistance contracts;
- weak-network intent credential contract;
- answer-open cross-surface matrix;
- video gate and quota contract;
- six metric groups and three launch-gate catalog.

The package index and JSON manifest must distinguish current build scope from planned target requirements.

## 11. Verification

- Model tests first establish red failures for old phase, terminology, activity, identity, weak-network, AI result, video, commercial, metric, and traceability rules.
- Domain facts are changed only after the corresponding red tests exist.
- Renderer tests verify planned banners, trace matrices, migration logs, and removal of rejected wording.
- Full tests, validator, generation, link checker, placeholder scan, old-rule scan, JSON index validation, and deterministic regeneration must pass.
- Independent spec review verifies README/D003-D096 coverage and rejected-route removal.
- Independent quality review verifies single sources of truth, fail-closed validators, exact mutation tests, and maintainable file boundaries.

## 12. Approval and Execution

The user declared README v2.0 finalized, closed the atomic decision queue, and authorized autonomous execution without additional item-by-item confirmation. This design therefore records the approved implementation interpretation and proceeds directly to an implementation plan.
