# Discord-Inspired UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unfinished ElevenLabs visual layer across the Doc-Sense AI frontend with the approved Discord-inspired light/dark design system while preserving all existing product behavior.

**Architecture:** Make `src/index.css` the semantic design-token source of truth, then update the app shell and each route's component-local styles to consume those tokens. Preserve React state, services, routes, API calls, socket events, and behavioral markup except for small class additions needed to express visual hierarchy or accessibility.

**Tech Stack:** React 19, React Router 7, Vite 8, plain CSS and component-local `<style>` blocks, Lucide React, Vitest, React Testing Library, Google Fonts Hanken Grotesk and Inter.

## Global Constraints

- Preserve authentication, upload, document, project, chat, profile, theme, sidebar, route, API, and socket behavior exactly as specified in the approved design.
- Keep the light/dark theme toggle and its current persistence mechanism.
- Dark canvas is `#0a0d3a`; light canvas is `#f3f4ff`; primary action is `#5865f2`; high-intent action is `#35ed7e`; feature accent is `#ec48bd` dark and `#d83fac` light.
- Use Hanken Grotesk 700/800 for display text and Inter 400/500/600/700 for UI/body text.
- Do not add a component library, CSS framework, licensed font, Discord trademark asset, fake product data, or backend change.
- Preserve the existing uncommitted functional additions, especially `/upload`, Home navigation, and the project feature files.
- Remove every ElevenLabs-specific serif, warm-neutral, neutral-ink CTA, and pastel-only visual rule.
- All interactive controls need visible `:focus-visible` treatment and practical 44px touch targets.
- Honor `prefers-reduced-motion` for mesh, float, spinner, and hover motion.

---

### Task 1: Discord Theme Contract and Global Primitives

**Files:**
- Modify: `src/test/themeTokens.test.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: existing `.dark` class controlled by `AuthContext`
- Produces: semantic CSS variables and shared button, form, card, toast, focus, motion, and typography primitives used by all later tasks

- [ ] **Step 1: Replace the editorial token assertions with the Discord contract**

Use these exact expectations in `src/test/themeTokens.test.jsx`:

```jsx
import fs from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.join(cwd(), 'src/index.css'), 'utf8');
const rootBlock = css.match(/:root\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? '';
const darkBlock = css.match(/\.dark\s*\{(?<body>[\s\S]*?)\n\}/)?.groups?.body ?? '';

describe('Discord-inspired theme contract', () => {
  it('uses the approved open-source typography and removes the editorial serif', () => {
    expect(css).toContain('Hanken+Grotesk');
    expect(rootBlock).toContain("--font-display: 'Hanken Grotesk'");
    expect(rootBlock).toContain("--font-sans: 'Inter'");
    expect(css).not.toContain('EB Garamond');
  });

  it('defines the light Discord palette', () => {
    expect(rootBlock).toContain('--bg-primary: #f3f4ff;');
    expect(rootBlock).toContain('--bg-card: #ffffff;');
    expect(rootBlock).toContain('--text-primary: #1e1f22;');
    expect(rootBlock).toContain('--accent-color: #5865f2;');
    expect(rootBlock).toContain('--intent-color: #35ed7e;');
    expect(rootBlock).toContain('--accent-magenta: #d83fac;');
  });

  it('defines the canonical dark Discord palette', () => {
    expect(darkBlock).toContain('--bg-primary: #0a0d3a;');
    expect(darkBlock).toContain('--bg-card: #1e2353;');
    expect(darkBlock).toContain('--bg-onyx: #23272a;');
    expect(darkBlock).toContain('--text-primary: #ffffff;');
    expect(darkBlock).toContain('--accent-color: #5865f2;');
    expect(darkBlock).toContain('--accent-magenta: #ec48bd;');
  });

  it('includes reduced-motion protection and no ElevenLabs palette', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).not.toContain('#f5f5f5');
    expect(css).not.toContain('#0c0a09');
    expect(css).not.toContain('--gradient-mint');
    expect(css).not.toContain('--gradient-peach');
  });
});
```

- [ ] **Step 2: Run the token test and verify the red state**

Run: `npm test -- src/test/themeTokens.test.jsx --run`

Expected: FAIL on Hanken Grotesk, Discord palette values, and removed EB Garamond/editorial tokens.

- [ ] **Step 3: Replace global tokens and shared primitives**

Start `src/index.css` with the exact semantic contract below, then retain the existing reset/layout utilities while restyling them to use these variables:

```css
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Hanken Grotesk', 'Arial Black', sans-serif;
  --border-radius-xs: 6px;
  --border-radius-sm: 12px;
  --border-radius-md: 14px;
  --border-radius-lg: 16px;
  --border-radius-xl: 24px;
  --border-radius-xxl: 40px;
  --border-radius-pill: 9999px;
  --transition-fast: 160ms ease;
  --transition-normal: 260ms ease;
  --sidebar-width: 272px;
  --sidebar-minimized-width: 84px;
  --sidebar-transition-duration: 0.3s;

  --bg-primary: #f3f4ff;
  --bg-secondary: #e9ebff;
  --bg-card: #ffffff;
  --bg-elevated: #f8f8ff;
  --bg-strong: #dde0ff;
  --bg-onyx: #23272a;
  --bg-showcase: #ffffff;
  --bg-sidebar: rgba(248, 248, 255, 0.94);
  --text-primary: #1e1f22;
  --text-secondary: #4e5058;
  --text-muted: #6d6f78;
  --text-soft: #8b8d98;
  --border-color: rgba(88, 101, 242, 0.18);
  --border-soft: rgba(88, 101, 242, 0.1);
  --border-strong: rgba(88, 101, 242, 0.32);
  --accent-color: #5865f2;
  --accent-hover: #4752c4;
  --accent-light: rgba(88, 101, 242, 0.12);
  --accent-glow: rgba(88, 101, 242, 0.28);
  --accent-magenta: #d83fac;
  --accent-link: #006d9c;
  --intent-color: #35ed7e;
  --intent-hover: #25d96b;
  --on-accent: #ffffff;
  --on-intent: #101218;
  --mesh-primary: rgba(88, 101, 242, 0.3);
  --mesh-magenta: rgba(216, 63, 172, 0.22);
  --mesh-violet: rgba(125, 80, 245, 0.2);
  --sidebar-text: #1e1f22;
  --sidebar-text-muted: #5f6170;
  --sidebar-active-bg: #5865f2;
  --sidebar-hover-bg: rgba(88, 101, 242, 0.1);
  --sidebar-border: rgba(88, 101, 242, 0.18);
  --sidebar-control-border: rgba(88, 101, 242, 0.24);
  --sidebar-control-border-hover: #5865f2;
  --sidebar-user-bg: rgba(88, 101, 242, 0.08);
  --danger-color: #d92d4f;
  --danger-hover: #b91f3e;
  --danger-light: rgba(217, 45, 79, 0.1);
  --success-color: #168a4d;
  --success-light: rgba(22, 138, 77, 0.1);
  --warning-color: #b66a05;
  --warning-light: rgba(182, 106, 5, 0.12);
  --shadow-sm: 0 4px 16px rgba(44, 49, 110, 0.08);
  --shadow-md: 0 14px 38px rgba(44, 49, 110, 0.12);
  --shadow-lg: 0 24px 68px rgba(44, 49, 110, 0.18);
}

.dark {
  --bg-primary: #0a0d3a;
  --bg-secondary: #141945;
  --bg-card: #1e2353;
  --bg-elevated: #292f63;
  --bg-strong: #343a6f;
  --bg-onyx: #23272a;
  --bg-showcase: #000000;
  --bg-sidebar: rgba(14, 18, 63, 0.96);
  --text-primary: #ffffff;
  --text-secondary: #d6d8ea;
  --text-muted: #b9bbd0;
  --text-soft: #8f93b4;
  --border-color: rgba(255, 255, 255, 0.12);
  --border-soft: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.22);
  --accent-color: #5865f2;
  --accent-hover: #6d78f5;
  --accent-light: rgba(88, 101, 242, 0.2);
  --accent-glow: rgba(88, 101, 242, 0.38);
  --accent-magenta: #ec48bd;
  --accent-link: #00b0f4;
  --intent-color: #35ed7e;
  --intent-hover: #52f18f;
  --on-accent: #ffffff;
  --on-intent: #101218;
  --mesh-primary: rgba(88, 101, 242, 0.48);
  --mesh-magenta: rgba(236, 72, 189, 0.34);
  --mesh-violet: rgba(125, 80, 245, 0.32);
  --sidebar-text: #ffffff;
  --sidebar-text-muted: #b9bbd0;
  --sidebar-active-bg: #5865f2;
  --sidebar-hover-bg: rgba(255, 255, 255, 0.08);
  --sidebar-border: rgba(255, 255, 255, 0.1);
  --sidebar-control-border: rgba(255, 255, 255, 0.18);
  --sidebar-control-border-hover: rgba(255, 255, 255, 0.5);
  --sidebar-user-bg: rgba(255, 255, 255, 0.06);
  --danger-color: #ff6680;
  --danger-hover: #ff8095;
  --danger-light: rgba(255, 102, 128, 0.12);
  --success-color: #35ed7e;
  --success-light: rgba(53, 237, 126, 0.12);
  --warning-color: #ffc15c;
  --warning-light: rgba(255, 193, 92, 0.12);
  --shadow-sm: 0 4px 16px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 14px 38px rgba(0, 0, 0, 0.28);
  --shadow-lg: 0 24px 68px rgba(0, 0, 0, 0.38);
}
```

Implement shared `.btn`, `.btn-primary`, `.btn-intent`, `.btn-secondary`, `.btn-danger`, `.form-input`, `.card`, `.toast`, global headings, body mesh, `:focus-visible`, and reduced-motion rules with these exact hierarchy rules:

```css
.btn { min-height: 44px; border-radius: var(--border-radius-sm); font-weight: 600; }
.btn-primary { background: var(--accent-color); color: var(--on-accent); }
.btn-intent { background: var(--intent-color); color: var(--on-intent); }
.btn-secondary { background: var(--bg-elevated); border-color: var(--border-strong); color: var(--text-primary); }
.card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius-xl); }
:where(a, button, input, textarea, select):focus-visible { outline: 3px solid var(--accent-color); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 4: Run the token test and verify green**

Run: `npm test -- src/test/themeTokens.test.jsx --run`

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit the token system**

```bash
git add src/index.css src/test/themeTokens.test.jsx
git commit -m "feat: add Discord-inspired theme tokens"
```

### Task 2: App Shell, Sidebar, Authentication, and Feedback

**Files:**
- Modify: `src/App.css`
- Modify: `src/components/layout/Sidebar.jsx`
- Modify: `src/pages/auth/auth.css`
- Modify: `src/pages/auth/Login.jsx`
- Modify: `src/pages/auth/Register.jsx`
- Modify: `src/pages/auth/ForgotPassword.jsx`
- Modify: `src/pages/auth/ResetPassword.jsx`
- Modify: `src/components/ui/Loader.jsx`
- Modify: `src/context/ToastContext.jsx`
- Test: `src/test/Sidebar.test.jsx`

**Interfaces:**
- Consumes: Task 1 semantic variables, existing `useAuth()` theme/sidebar API
- Produces: Discord-inspired responsive shell and auth surfaces without changing auth or navigation behavior

- [ ] **Step 1: Extend the sidebar test with retained theme behavior and visual hooks**

Add source assertions without changing the existing route assertions:

```jsx
import fs from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';

const sidebarSource = fs.readFileSync(path.join(cwd(), 'src/components/layout/Sidebar.jsx'), 'utf8');
const authCss = fs.readFileSync(path.join(cwd(), 'src/pages/auth/auth.css'), 'utf8');

it('uses the Discord shell hooks while retaining theme switching', () => {
  expect(sidebarSource).toContain('var(--accent-magenta)');
  expect(sidebarSource).toContain('var(--sidebar-active-bg)');
  expect(authCss).toContain('var(--mesh-primary)');
  expect(authCss).toContain('var(--mesh-magenta)');
  expect(authCss).not.toContain('var(--gradient-mint)');
});
```

- [ ] **Step 2: Run the shell test and verify red**

Run: `npm test -- src/test/Sidebar.test.jsx --run`

Expected: FAIL because the sidebar does not use the magenta brand gradient and auth still references editorial gradient variables.

- [ ] **Step 3: Restyle the app shell and sidebar**

Keep sidebar markup and callbacks intact. Update component-local styles so `.brand-icon` and `.user-avatar` use `linear-gradient(135deg, var(--accent-color), var(--accent-magenta))`, `.nav-item.active` uses `var(--sidebar-active-bg)` with white text, rows use 14–16px radii, sidebar controls are 44px, and the hidden-sidebar button is Blurple. Preserve minimized labels, tooltips, mobile behavior, sticky positioning, and chat layout exceptions.

- [ ] **Step 4: Restyle the shared auth shell and auth-only component blocks**

Make `.auth-page` a themed mesh canvas; use a two-column rounded shell at 1024px+, compact stacked header below 1024px, Hanken Grotesk 800 headings, a Blurple-to-magenta brand pane, 40px outer radius, 16px form radius, and 44px controls. Replace every old gradient variable with `--mesh-primary`, `--mesh-violet`, or `--mesh-magenta`. Keep all form fields, validation, callbacks, and links intact.

- [ ] **Step 5: Align loaders and toasts**

Use Blurple skeleton gradients and spinners, 12–16px toast radius, raised theme surfaces, semantic leading colors, and no neutral editorial pill styling. Do not change loading conditions or toast lifecycle.

- [ ] **Step 6: Run focused shell/auth tests**

Run: `npm test -- src/test/Sidebar.test.jsx src/test/AuthContext.test.jsx src/test/ProtectedRoute.test.jsx --run`

Expected: PASS.

- [ ] **Step 7: Commit shell and auth**

```bash
git add src/App.css src/components/layout/Sidebar.jsx src/pages/auth src/components/ui/Loader.jsx src/context/ToastContext.jsx src/test/Sidebar.test.jsx
git commit -m "feat: redesign shell and authentication surfaces"
```

### Task 3: Dashboard, Upload, and Documents

**Files:**
- Modify: `src/pages/dashboard/Home.jsx`
- Modify: `src/pages/dashboard/UploadPage.jsx`
- Modify: `src/pages/dashboard/DocumentsList.jsx`
- Test: `src/test/Home.test.jsx`

**Interfaces:**
- Consumes: existing routes `/upload`, `/documents`, `/projects` and Task 1 shared primitives
- Produces: Discord hero, green high-intent upload CTA, feature cards, upload panel, table, badges, pagination, and empty states

- [ ] **Step 1: Add the dashboard design assertions**

Extend the first `Home` test with:

```jsx
expect(screen.getByRole('link', { name: /upload a pdf/i })).toHaveClass('btn-intent');
expect(container.querySelector('.dashboard-hero')).toHaveClass('discord-feature-panel');
expect(container.querySelector('.hero-summary')).toBeInTheDocument();
```

- [ ] **Step 2: Run the Home test and verify red**

Run: `npm test -- src/test/Home.test.jsx --run`

Expected: FAIL because the upload CTA is still `.btn-primary` and the hero lacks `.discord-feature-panel`.

- [ ] **Step 3: Implement the Home visual hierarchy**

Add `discord-feature-panel` to the hero and `btn-intent` to the upload CTA. Replace editorial hero gradients with Blurple/magenta/violet, make hero text white in both themes, use Hanken Grotesk 800 headings, 32–40px hero radius, translucent raised summary cards, gradient feature icons, magenta step accents, and responsive 3/2/1-column layouts. Preserve all copy, links, arrays, and semantics.

- [ ] **Step 4: Restyle Upload and Documents**

Use the shared display hierarchy for route headers. Make the upload dropzone a 32px raised feature panel with a dashed Blurple border, gradient icon tile, Blurple active progress and green complete progress, responsive action group, and three Discord-style step cards. Make documents a raised table with rounded scroll container, indigo header, semantic status pills, circular pagination controls, and a gradient-framed empty icon. Keep file validation, size limit, API calls, pagination, navigation, and status logic unchanged.

- [ ] **Step 5: Run focused dashboard tests**

Run: `npm test -- src/test/Home.test.jsx --run`

Expected: PASS.

- [ ] **Step 6: Commit dashboard routes**

```bash
git add src/pages/dashboard src/test/Home.test.jsx
git commit -m "feat: redesign dashboard and document workflows"
```

### Task 4: Projects and Profile

**Files:**
- Modify: `src/pages/projects/ProjectsList.jsx`
- Modify: `src/pages/projects/ProjectDetail.jsx`
- Modify: `src/pages/profile/Profile.jsx`
- Test: `src/test/ProjectsList.test.jsx`
- Test: `src/test/ProjectDetail.test.jsx`

**Interfaces:**
- Consumes: project service functions and shared Task 1 variables
- Produces: themed project cards, project detail panels, modal, room rows, and profile/security settings without service or state changes

- [ ] **Step 1: Add non-behavioral class hooks to existing project tests**

In the existing successful render cases, assert the current route roots and shared cards remain present:

```jsx
expect(container.querySelector('.projects-page')).toHaveClass('discord-route');
expect(container.querySelector('.project-card')).toBeInTheDocument();
```

For project detail:

```jsx
expect(container.querySelector('.project-detail-page')).toHaveClass('discord-route');
expect(container.querySelectorAll('.project-section').length).toBeGreaterThanOrEqual(2);
```

- [ ] **Step 2: Run project tests and verify red**

Run: `npm test -- src/test/ProjectsList.test.jsx src/test/ProjectDetail.test.jsx --run`

Expected: FAIL because the route roots lack `discord-route`.

- [ ] **Step 3: Restyle project list and detail**

Add `discord-route` to both roots. Use display headings, gradient project icon tiles, 24px raised cards, 16px controls, semantic status badges, an indigo table header, and a 24px modal with blurred backdrop. Keep all project APIs, normalization, creation, upload, file-state, chat availability, room, and navigation behavior intact.

- [ ] **Step 4: Restyle profile and security**

Use a responsive two-column settings shell, raised navigation card, 14px pill-like tab rows with a Blurple active state, 24px content panels, themed inputs, semantic password strength segments, and responsive form actions. Keep validation rules, update calls, password calls, tab state, and logout navigation unchanged.

- [ ] **Step 5: Run project/profile-adjacent tests**

Run: `npm test -- src/test/ProjectsList.test.jsx src/test/ProjectDetail.test.jsx src/test/AuthContext.test.jsx --run`

Expected: PASS.

- [ ] **Step 6: Commit project and profile surfaces**

```bash
git add src/pages/projects/ProjectsList.jsx src/pages/projects/ProjectDetail.jsx src/pages/profile/Profile.jsx src/test/ProjectsList.test.jsx src/test/ProjectDetail.test.jsx
git commit -m "feat: redesign projects and settings"
```

### Task 5: Document and Project Chat Workspaces

**Files:**
- Modify: `src/pages/document/DocumentChat.jsx`
- Modify: `src/pages/projects/ProjectChat.jsx`
- Test: `src/test/DocumentChat.test.jsx`
- Test: `src/test/ProjectChat.test.jsx`

**Interfaces:**
- Consumes: existing socket hook, REST fallbacks, room state, message state, and Task 1 variables
- Produces: Discord-like room rail, conversation header, message field, composer, notices, and mobile room tray

- [ ] **Step 1: Add workspace class assertions to chat tests**

In each successful chat render test, retain all behavior assertions and add:

```jsx
expect(container.querySelector('.chat-workspace')).toHaveClass('discord-chat-workspace');
expect(container.querySelector('.rooms-panel')).toBeInTheDocument();
expect(container.querySelector('.conversation-panel')).toBeInTheDocument();
```

- [ ] **Step 2: Run chat tests and verify red**

Run: `npm test -- src/test/DocumentChat.test.jsx src/test/ProjectChat.test.jsx --run`

Expected: FAIL because `.chat-workspace` lacks `discord-chat-workspace`.

- [ ] **Step 3: Restyle both chat workspaces without changing data flow**

Add `discord-chat-workspace` to both workspace roots. Use a 280px raised room rail, Blurple active room rows, onyx/indigo dark conversation surface, light raised counterpart, 64–72px header, full-height scroll region, Blurple user bubbles, raised assistant bubbles, 24px composer shell, circular send action, semantic connection/status pills, and a 24px create-room modal. Replace editorial mesh tokens with the Task 1 mesh tokens.

Below 768px, change `.chat-workspace` to a grid with a compact horizontal `.rooms-panel`; make `.rooms-list` a horizontal overflow tray, keep `.conversation-panel` at `min-height: 0`, and keep the composer visible at the bottom. Preserve selected room, socket streaming, pending questions, REST fallback, retry/error, message history, status notices, modal, and timestamps.

- [ ] **Step 4: Run chat and socket tests**

Run: `npm test -- src/test/DocumentChat.test.jsx src/test/ProjectChat.test.jsx src/test/useSocket.test.jsx --run`

Expected: PASS.

- [ ] **Step 5: Commit chat workspaces**

```bash
git add src/pages/document/DocumentChat.jsx src/pages/projects/ProjectChat.jsx src/test/DocumentChat.test.jsx src/test/ProjectChat.test.jsx
git commit -m "feat: redesign document and project chat"
```

### Task 6: Cross-Screen Cleanup and Verification

**Files:**
- Inspect: `src/**/*.jsx`
- Inspect: `src/**/*.css`
- Inspect: `docs/superpowers/specs/2026-07-10-discord-ui-redesign-design.md`

**Interfaces:**
- Consumes: Tasks 1–5
- Produces: one consistent light/dark UI with no ElevenLabs remnants and verified behavior/build quality

- [ ] **Step 1: Scan for forbidden visual remnants**

Run:

```bash
rg -n "EB Garamond|#f5f5f5|#0c0a09|#292524|gradient-mint|gradient-peach|gradient-lavender|gradient-sky|gradient-rose|editorial|ElevenLabs" src
```

Expected: no matches. Fix any match by mapping it to the approved semantic tokens; do not change behavior.

- [ ] **Step 2: Run the complete unit suite**

Run: `npm test -- --run`

Expected: all tests pass.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: exit 0. If existing code reports failures unrelated to this redesign, record the exact files and messages and do not hide them.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: Vite exits 0 and writes the production bundle.

- [ ] **Step 5: Validate diff quality and scope**

Run:

```bash
git diff --check
git status --short
git diff --stat HEAD~5..HEAD
```

Expected: no whitespace errors; changes are limited to the approved design docs, tests, shared UI, and route UI files; service and API behavior files are unchanged.

- [ ] **Step 6: Commit final cleanup if required**

```bash
git add src docs/superpowers/plans/2026-07-10-discord-ui-redesign.md
git commit -m "chore: finish Discord-inspired UI redesign"
```
