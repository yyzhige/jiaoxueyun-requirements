# Task 7 Quality Closure Design

## Goal

Close the six Task 7 review findings with executable requirement contracts rather than descriptive conditions or assembly defaults.

## Report Authorization

- `RPT-DEFINITION-F-DATA-SCOPE` uses one static Option Set with exactly three profiles: assigned subject detail, assigned homeroom class aggregate, and authorized academic aggregate.
- `RPT-001` publishes closed metadata for every profile. Homeroom and academic profiles require `aggregateOnly: true` and `noStudentDetail: true`; the academic profile also requires an active authorization grant.
- Definition creation uses separate Actions per profile. Each Action accepts only its profile code and has one matching narrow ALLOW subject plus explicit cross-scope and platform-operations DENY rules.
- Report definitions and subscriptions use `CURRENT_ACTOR` as producer because more than one actor category can create them.
- Subscriptions retain the creator reference. Update, pause, and cancel use `CURRENT_ACTOR` own-record ALLOW and other-record DENY so actors cannot manage another role's subscription.
- AI ad-hoc and periodic report tasks are audience-specific. Subject teacher, homeroom, and academic variants target Actions that ALLOW the same audience and confirmer.

## AI Draft Capability

- AI Tasks and every Action targeted by an AI Task declare one closed capability: `QUERY`, `ANALYSIS`, `DRAFT`, `REPORT`, `PERIODIC`, `REMINDER`, or `CONTROLLED`.
- Validation requires exact Task-to-Action capability equality.
- Feedback and improvement-plan drafts target new AIX CREATE Actions whose only target is the `LIFE-005` temporary preview object. They never target score override, plan confirmation, publication, or another formal business mutation.
- Assignment drafting remains on the existing homework draft Action.
- Draft policy validation requires confirmation, no pre-confirmation business write, and a valid temporary AIX preview path. Retargeting a draft to publish, override, or confirm fails closed.

## Notification Ownership And Fields

- Mark-read and mark-handled allow `CURRENT_ACTOR` only for the notification recipient's own record and deny another recipient's record. This applies uniformly to student, subject-teacher, homeroom, and academic recipients. Platform operations remains denied.
- Conditional required fields bind to exactly one mutation Action: delivered time to deliver, failure code to fail, retry count to retry, read time to mark-read, and handled time to mark-handled.
- Action-level required-field coverage remains fail closed, and notification delivery failure never rolls back source business facts.

## Clarification Coverage

- The union of all blocking `whenMissing` entries must equal `parameterSchema.required` exactly.
- Unknown parameters, duplicate parameters within or across rules, missing required parameters, and non-blocking coverage all fail validation.

## State Reachability

- `NONE` is valid only for a one-state object with no state-changing Action.
- Every object with a CREATE/UPDATE write, transition, concrete success state, or nontrivial state model uses `ACTION_GRAPH` explicitly in its authored fact.
- Reachability starts from authored `initialStateIds` and CREATE success states, then follows declared transitions. Missing lifecycle Actions are added where the model owns the transition.
- No index default, helper enrichment, broad exemption, or implicit terminal-state reachability is allowed.

## Verification

- Each batch starts with focused tests that fail for the missing behavior, then passes after the minimal implementation.
- Completion requires focused tests, the full suite, CLI validation, syntax checks for every changed module, `git diff --check`, and self-review of all six findings.
