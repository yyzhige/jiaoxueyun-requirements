# 知序教学云 HTML Prototype Implementation Plan（已暂停）

> 当前状态：等待 `docs/requirements/zhixu-handoff-v1.0/` 产品需求包评审。
> 本计划基于旧单体 PRD，不能直接执行。产品确认后应按 Prototype ID 重新确定原型范围和任务拆分。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. This workspace is not a Git repository, so verification checkpoints replace commit steps.

**Goal:** Build a responsive, interactive HTML prototype that validates the approved school-selection, multi-role, assignment-to-improvement workflow across teacher Web, student App, academic administration, and the AI command center.

**Architecture:** Use a framework-free static application with one HTML entry, a focused CSS system, pure JavaScript state/model modules, and seeded demo data. Navigation and role switching render views from a shared application state; product behavior is simulated locally without backend calls. Use local Lucide assets and Playwright for deterministic visual verification.

**Tech Stack:** HTML5, CSS3, ES modules, Node.js built-in test runner, Lucide icons, Playwright, Python static server.

---

## File Map

- Create: `package.json` - dependency and verification scripts.
- Create: `prototype/index.html` - semantic application shell and fixed mount points.
- Create: `prototype/styles.css` - tokens, desktop layouts, student mobile layouts, responsive states.
- Create: `prototype/model.mjs` - role navigation, routes, state transitions, command previews.
- Create: `prototype/data.mjs` - fictional school, users, assignments, grades, plans, and schedule data.
- Create: `prototype/app.mjs` - DOM rendering and interaction handlers.
- Create: `prototype/tests/model.test.mjs` - state and permission behavior tests.
- Create: `prototype/tests/prototype.spec.mjs` - Playwright interaction and visual checks.
- Create: `prototype/assets/icons/` - selected Lucide SVG assets copied from the installed package.
- Create: `prototype/screenshots/` - verified desktop and mobile screenshots.

## Task 1: Project Harness And Pure State Model

**Files:**
- Create: `package.json`
- Create: `prototype/model.mjs`
- Create: `prototype/tests/model.test.mjs`

- [ ] **Step 1: Create package scripts and dependencies**

```json
{
  "name": "zhixu-teaching-cloud-prototype",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test prototype/tests/model.test.mjs",
    "serve": "python3 -m http.server 4173 -d prototype",
    "qa": "node prototype/tests/prototype.spec.mjs"
  },
  "dependencies": {
    "lucide-static": "^0.468.0",
    "playwright": "^1.61.1"
  }
}
```

- [ ] **Step 2: Write failing state tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  selectSchool,
  selectRole,
  navigate,
  createCommandPreview,
} from "../model.mjs";

test("school selection precedes role selection", () => {
  const state = createInitialState();
  assert.equal(state.route, "school-select");
  assert.throws(() => selectRole(state, "teacher"), /school/i);
});

test("role switch resets route and AI work context", () => {
  let state = selectSchool(createInitialState(), "mingde");
  state = selectRole(state, "teacher");
  state = navigate(state, "grading-review");
  state.aiContext.assignmentId = "hw-101";
  state = selectRole(state, "student");
  assert.equal(state.route, "student-home");
  assert.deepEqual(state.aiContext, {});
});

test("high-risk command produces a confirmation preview", () => {
  const preview = createCommandPreview("发布七年级一班数学作业成绩");
  assert.equal(preview.level, "high-risk");
  assert.equal(preview.requiresConfirmation, true);
  assert.equal(preview.scope.students, 42);
});
```

- [ ] **Step 3: Run tests and verify the model is missing**

Run: `npm test`

Expected: FAIL because `prototype/model.mjs` does not exist.

- [ ] **Step 4: Implement the minimal state model**

```js
export const roleHome = {
  teacher: "teacher-home",
  student: "student-home",
  admin: "admin-home",
};

export const navByRole = {
  teacher: ["teacher-home", "assignments", "grading-review", "gradebook", "students", "plans"],
  student: ["student-home", "student-learning", "student-assignments", "student-insights", "student-profile"],
  admin: ["admin-home", "organization", "teaching-tasks", "scheduling", "exam-data"],
};

export function createInitialState() {
  return { schoolId: null, role: null, route: "school-select", aiOpen: false, aiContext: {} };
}

export function selectSchool(state, schoolId) {
  return { ...state, schoolId, role: null, route: "role-select", aiContext: {} };
}

export function selectRole(state, role) {
  if (!state.schoolId) throw new Error("A school must be selected first");
  return { ...state, role, route: roleHome[role], aiContext: {} };
}

export function navigate(state, route) {
  if (!navByRole[state.role]?.includes(route) && !["assignment-create", "submission-progress", "publish-confirm", "student-submit", "student-feedback", "ai-center", "schedule-conflicts"].includes(route)) {
    throw new Error(`Route ${route} is unavailable for ${state.role}`);
  }
  return { ...state, route };
}

export function createCommandPreview(command) {
  const highRisk = /发布|删除|调课|批量通知/.test(command);
  return {
    command,
    level: highRisk ? "high-risk" : "draft",
    requiresConfirmation: highRisk,
    scope: { school: "石家庄明德实验中学", className: "七年级一班", students: 42 },
  };
}
```

- [ ] **Step 5: Run model tests**

Run: `npm test`

Expected: all tests PASS.

## Task 2: Demo Data, Application Shell, School And Role Entry

**Files:**
- Create: `prototype/data.mjs`
- Create: `prototype/index.html`
- Create: `prototype/app.mjs`
- Create: `prototype/styles.css`

- [ ] **Step 1: Add coherent fictional demo data**

Define one school, three roles, one class, assignments, students, grading exceptions, plans, and schedule conflicts. Use the same IDs across every screen.

```js
export const school = {
  id: "mingde",
  name: "石家庄明德实验中学",
  district: "石家庄市裕华区",
  code: "SJZ-MD-0713",
  term: "2026—2027 学年第一学期",
};

export const roles = [
  { id: "teacher", title: "数学教师 · 班主任", scope: "七年级一班、二班" },
  { id: "student", title: "学生", scope: "七年级一班 · 林晓雨" },
  { id: "admin", title: "教务人员", scope: "初中教务处" },
];
```

- [ ] **Step 2: Create the semantic HTML shell**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>知序教学云原型</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="app" aria-live="polite"></div>
    <div id="modal-root"></div>
    <script type="module" src="./app.mjs"></script>
  </body>
</html>
```

- [ ] **Step 3: Implement school and role renderers**

Implement `renderSchoolSelect()` and `renderRoleSelect()` with accessible buttons, school metadata, recent-school state, demo badge, and role scope.

- [ ] **Step 4: Add event delegation**

Use one document click handler for `[data-action]` elements. Route actions through pure state functions, then call `render()`.

- [ ] **Step 5: Add base tokens and entry layout**

Use a neutral background, dark text, blue primary, green success, amber warning, red danger, and 8px maximum card radius. Do not use gradients or decorative floating blobs.

- [ ] **Step 6: Verify entry flow manually**

Run: `npm run serve`

Open: `http://localhost:4173`

Expected: selecting the school reveals role choices; selecting a role opens its correct home.

## Task 3: Shared Desktop Shell And Teacher Workflow

**Files:**
- Modify: `prototype/app.mjs`
- Modify: `prototype/styles.css`

- [ ] **Step 1: Build the shared desktop shell**

Render a fixed-width sidebar, context header, main work area, and optional AI panel. The header must always show school, term, role, notifications, and role switch.

- [ ] **Step 2: Implement teacher dashboard**

Add today schedule, grading queue, deadlines, missing submissions, plan coordination, and compact trend visuals. Each urgent item links directly to its workflow.

- [ ] **Step 3: Implement assignment creation**

Create a four-step segmented flow: basic information, content, grading rules, publish preview. Include subject coverage and explicit human-review flags.

- [ ] **Step 4: Implement submission progress**

Display submitted, missing, image-warning, and grading states with filters and actionable rows.

- [ ] **Step 5: Implement grading review**

Use three columns: student queue, answer document, grading evidence. Include accept, edit score, request resubmission, and mark-recognition-error actions.

- [ ] **Step 6: Implement publish confirmation**

Show school, class, student count, processed exceptions, notification impact, and explicit confirm/cancel actions.

- [ ] **Step 7: Implement gradebook and student insight**

Use a dense table plus a student detail panel. Show grade versions, subject evidence states, and the distinction between score and mastery.

- [ ] **Step 8: Verify the teacher loop**

Expected path: teacher home → create assignment → submission progress → grading review → publish confirmation → gradebook.

## Task 4: Student App Workflow

**Files:**
- Modify: `prototype/app.mjs`
- Modify: `prototype/styles.css`

- [ ] **Step 1: Build the student application shell**

Use a mobile-first full-width layout with a top school bar, five-item bottom navigation, and AI assistant button. On desktop, constrain the content width without drawing a decorative phone frame.

- [ ] **Step 2: Implement today learning**

Show urgent homework, correction tasks, new feedback, weekly goal, and the next lesson. Keep ranking off the page.

- [ ] **Step 3: Implement online answer and photo submission**

Include question progress, autosave state, upload thumbnails, blur warning, missing-page warning, re-order controls, and final submission summary.

- [ ] **Step 4: Implement feedback and correction**

Show original answer, final score, error reason, staged hint, teacher comment, and correction action. Hide AI confidence and internal notes.

- [ ] **Step 5: Implement improvement plan**

Show one primary goal, two supporting goals, daily task load, subject teacher owner, class-teacher coordination, and stage review.

- [ ] **Step 6: Verify responsive text and controls**

At 375×812, confirm no button text clips, the bottom navigation stays stable, and the submission controls remain reachable.

## Task 5: Academic Administration And AI Command Center

**Files:**
- Modify: `prototype/app.mjs`
- Modify: `prototype/styles.css`

- [ ] **Step 1: Implement academic administration dashboard**

Show schedule changes, unresolved conflicts, missing teaching assignments, exam progress, and member-data warnings.

- [ ] **Step 2: Implement schedule conflict view**

Display teacher, class, room, and rule conflicts with suggested actions and a before/after preview. Do not allow direct publish without confirmation.

- [ ] **Step 3: Implement AI command center**

Provide a global command input, conversation history, current context chips, result cards, and a structured command preview.

- [ ] **Step 4: Implement continuous command examples**

Support the scripted flow: find declining students → group by weakness → create practice assignments → change deadline → save drafts.

- [ ] **Step 5: Implement high-risk confirmation**

For publish, delete, reschedule, and bulk notification phrases, render scope, affected records, consequences, and confirm/cancel buttons.

- [ ] **Step 6: Verify role isolation**

Switch teacher → student → admin and confirm route, navigation, data, and AI context all reset.

## Task 6: Icons, Accessibility, And Responsive Polish

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/app.mjs`
- Modify: `prototype/styles.css`
- Create: `prototype/assets/icons/*`

- [ ] **Step 1: Install dependencies**

Run: `npm install`

Expected: `node_modules/lucide-static` and `node_modules/playwright` exist.

- [ ] **Step 2: Copy only required Lucide icons**

Copy icons for home, school, users, clipboard, chart, calendar, book, sparkles, search, bell, check, alert, camera, upload, arrow, settings, and command into `prototype/assets/icons/`.

- [ ] **Step 3: Replace text glyphs with icon assets**

Icon-only buttons must use `aria-label` and `title`. Commands retain text labels where ambiguity exists.

- [ ] **Step 4: Add keyboard focus and modal behavior**

Every interactive element must have a visible focus ring. Escape closes modals and the AI panel; opening a modal moves focus to its heading.

- [ ] **Step 5: Add responsive breakpoints**

Desktop: 1280px and above. Tablet: 768–1279px. Mobile: below 768px. Sidebar collapses to an icon rail on tablet and becomes bottom navigation for the student role.

- [ ] **Step 6: Scan CSS palette and layout constraints**

Verify the interface is not dominated by one hue, card radius does not exceed 8px, sections are not nested cards, and fixed-format controls have stable dimensions.

## Task 7: Automated Verification And Screenshots

**Files:**
- Create: `prototype/tests/prototype.spec.mjs`
- Create: `prototype/screenshots/*`

- [ ] **Step 1: Write the Playwright verification script**

```js
import { chromium } from "playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://127.0.0.1:4173");
await page.getByRole("button", { name: /石家庄明德实验中学/ }).click();
await page.getByRole("button", { name: /数学教师/ }).click();
await assert.doesNotReject(() => page.getByRole("heading", { name: "教师工作台" }).waitFor());
await page.screenshot({ path: "prototype/screenshots/teacher-dashboard.png", fullPage: true });

await page.getByRole("button", { name: "切换身份" }).click();
await page.getByRole("button", { name: /^学生/ }).click();
await page.setViewportSize({ width: 375, height: 812 });
await page.screenshot({ path: "prototype/screenshots/student-home.png", fullPage: true });

assert.equal(await page.locator("body").evaluate(el => el.scrollWidth <= window.innerWidth), true);
await browser.close();
```

- [ ] **Step 2: Run unit tests**

Run: `npm test`

Expected: all model tests PASS.

- [ ] **Step 3: Start the static server**

Run: `npm run serve`

Expected: server listens on `http://127.0.0.1:4173`.

- [ ] **Step 4: Run Playwright QA**

Run: `npm run qa`

Expected: exit code 0 and screenshots created.

- [ ] **Step 5: Inspect desktop screenshots**

Check 1440×1000 teacher dashboard, grading review, admin scheduling, and AI command center for clipping, overlap, blank states, and incorrect role context.

- [ ] **Step 6: Inspect mobile screenshots**

Check 375×812 and 390×844 student home, submission, feedback, and improvement plan for text fit, stable navigation, and reachable actions.

- [ ] **Step 7: Run final checks**

Run:

```bash
npm test
npm run qa
rg -n "TODO|TBD|placeholder" prototype docs/product/zhixu-teaching-cloud-prd.md
```

Expected: tests and QA pass; no unfinished implementation markers remain.
