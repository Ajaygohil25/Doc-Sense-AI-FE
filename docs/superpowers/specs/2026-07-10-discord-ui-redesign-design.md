# Discord-Inspired UI Redesign Design

## Goal

Completely replace the unfinished ElevenLabs-inspired presentation in the Doc-Sense AI frontend with the supplied Discord-inspired design language across every public and authenticated screen. Preserve all product workflows, routes, API calls, socket behavior, responsive behavior, and the existing light/dark theme toggle.

## Design Strategy

Use a token-first replacement centered in `src/index.css`, followed by deliberate updates to every component-local style block that currently overrides global tokens. Keep the existing React component structure where it already represents the product correctly. Introduce shared styling primitives through semantic CSS variables and reusable class names instead of rewriting working business logic.

The dark theme is the canonical visual expression from the supplied brief: a deep-indigo canvas, raised indigo and onyx surfaces, white copy, Blurple controls, vibrant magenta feature gradients, and electric green reserved for the highest-intent action on a screen. The light theme translates the same hierarchy into pale-indigo canvas and white/lilac surfaces while retaining Blurple, magenta, green, typography, geometry, and component behavior.

## Product Behavior That Must Remain Intact

- Authentication: sign in, registration, forgot password, reset password, protected-route redirects, logout, and token refresh.
- Dashboard navigation and the dedicated `/upload` route.
- PDF upload validation, progress, processing states, and document history.
- Document chat room selection, socket streaming, REST fallback, status notices, and message history.
- Project creation, one-file-at-a-time uploads, project details, project chat rooms, and project knowledge-base chat.
- Profile editing, password validation, password change, and post-change logout.
- Sidebar expanded, minimized, hidden, and mobile behaviors.
- Light/dark theme persistence and toggle behavior.
- Existing service interfaces, route paths, API payloads, and socket event contracts.

## Typography

- Use Google Fonts `Hanken Grotesk` at weights 700 and 800 for display headings, section titles, large numerals, and brand copy. It is the open-source substitute recommended by the supplied design brief for proprietary ABC Ginto Nord.
- Use `Inter` at weights 400, 500, 600, and 700 for body copy, navigation, forms, tables, badges, chat messages, buttons, and dense UI.
- Display headings are bold, tightly tracked, short, and frequently uppercase. Route-level headings scale with `clamp()` so they remain expressive without overflowing on small screens.
- Default body copy is 16px, lead copy is 18px, and dense metadata is 13–14px, all with relaxed line height.

## Theme Tokens

### Dark Theme

- Canvas: `#0a0d3a`.
- Raised indigo: `#1e2353`.
- Onyx surface: `#23272a`.
- Deep showcase: `#000000`.
- Primary text: `#ffffff`.
- Secondary text: cool light lavender `#b9bbd0`.
- Primary action, active state, and focus: Blurple `#5865f2`.
- Highest-intent action: electric green `#35ed7e` with near-black text.
- Feature accent and selected decorative surface: magenta `#ec48bd`.
- Links: cyan `#00b0f4`.

### Light Theme

- Canvas: `#f3f4ff`.
- Secondary canvas: `#e9ebff`.
- Card and elevated surfaces: `#ffffff` and `#f8f8ff`.
- Primary text: `#1e1f22`.
- Secondary text: `#4e5058`.
- Borders: translucent indigo `rgba(88, 101, 242, 0.18)`.
- Primary action, active state, and focus: Blurple `#5865f2`.
- Highest-intent action: electric green `#35ed7e` with near-black text.
- Feature accent: magenta `#d83fac` with white text.
- Links: accessible cyan-blue `#006d9c`.

### Shared Token Rules

- Green is not a generic status or decoration color. It is reserved for the most important positive action on a screen, plus semantically successful status indicators where required.
- Blurple owns routine primary actions, navigation selection, progress, focus rings, and brand identity.
- Magenta is used for atmospheric gradients, feature panels, selected badges, and limited decorative emphasis.
- Shadows remain diffuse and subtle. Depth primarily comes from surface color, gradients, border contrast, overlap, and generous radii.
- Theme changes update every surface, control, border, text color, and decorative gradient; no light-only or dark-only orphan styles remain.

## Geometry and Motion

- Controls use 12–16px radii or pill geometry depending on their role.
- Standard cards use 16–24px radii. Hero, feature, auth, and prominent empty-state panels use 32–40px radii.
- Buttons and interactive controls have a minimum 44px touch target.
- The page background uses a restrained animated mesh of Blurple, violet, and magenta radial gradients. Animation must be CSS-only, slow, non-blocking, and disabled through `prefers-reduced-motion`.
- Hover states use small color, border, or one-to-two-pixel elevation changes. No large motion or layout shift is allowed.
- Focus-visible controls receive a high-contrast Blurple outline with sufficient offset.

## Shared App Shell

### Sidebar

- Preserve all current routes and expanded, minimized, hidden, and responsive behavior.
- Use a deep indigo sidebar in dark mode and a pale-indigo/white sidebar in light mode.
- Brand treatment uses the display face and a Blurple-backed brain mark.
- Navigation rows are generously rounded; inactive rows are quiet, hover rows use a raised surface, and the active row uses a Blurple field with high-contrast text.
- Theme, profile, logout, minimize, and hide controls use circular or pill geometry with clear hover, focus, and disabled states.
- The user avatar uses a Blurple-to-magenta gradient rather than the removed neutral editorial treatment.

### Main Content

- Keep the centered desktop content column and full-width chat exception.
- Use an atmospheric canvas behind route content without compromising text contrast.
- Route sections use an 8px spacing grid with 24–40px section rhythm.
- Mobile content remains single-column and never depends on horizontal scrolling, except data tables that already require an explicit scroll container.

## Shared Components

### Buttons

- `.btn-primary`: Blurple fill, white label, 12–16px radius, and strong focus ring.
- `.btn-intent`: electric green fill, dark label, reserved for the highest-intent action where appropriate.
- `.btn-secondary`: raised indigo/pale-lilac surface with visible border and theme-aware text.
- `.btn-danger`: semantic red treatment that harmonizes with the palette without being replaced by magenta.
- Icon buttons are round, at least 44px, and include accessible names.

### Forms

- Inputs use raised theme surfaces, visible borders, 12–14px radii, 44px minimum height, and Blurple focus treatment.
- Labels remain explicit and readable. Placeholder text is secondary, never the sole label.
- Validation and helper text preserve semantic error/success colors.
- Auth and modal forms use prominent rounded panels rather than flat page fields.

### Cards, Tables, Badges, Modals, and Toasts

- Standard cards use raised theme surfaces with a subtle indigo border and 16–24px radius.
- Feature cards use magenta/Blurple gradients with 32–40px radius; empty-state cards use a raised theme surface with a restrained gradient icon frame.
- Tables use a raised header, comfortable row padding, hairline row separators, and responsive overflow containers.
- Badges use compact pill geometry and semantic background/text combinations.
- Modals use a dimmed, blurred backdrop and a raised 24px-radius panel.
- Toasts use raised theme surfaces, a semantic leading accent, and accessible readable copy.

## Route-Level Design

### Authentication

- Sign in, registration, forgot password, and reset password share one responsive auth shell.
- A full-height indigo/pale-indigo canvas carries the animated gradient mesh.
- The form sits in a large rounded raised panel with a compact brand lockup, bold display heading, clear lead copy, and full-width controls.
- At 1024px and above, auth pages use a two-column panel with a branded gradient statement beside the form. Below 1024px, the statement becomes a compact header above the form without hiding required information.

### Dashboard Home

- Replace the editorial hero with a deep-indigo/Blurple-to-magenta hero panel using bold display copy and a clearly ranked CTA pair.
- Use a green highest-intent upload action and a secondary Blurple project action.
- Quick actions, recent documents, workflow guidance, and status information become rounded Discord-inspired feature cards.
- Decorative gradients and large numerals provide energy without adding new product features or fake metrics.

### Upload and Documents

- The upload drop zone becomes a prominent rounded feature panel with clear drag, selected, uploading, success, and failure states.
- Active progress uses Blurple and completed progress uses semantic green.
- Document history uses a raised responsive table, status pills, rounded pagination, and a deliberate empty state.
- Existing filters, refresh actions, open-chat actions, and API behavior remain unchanged.

### Projects and Project Detail

- Project cards use raised indigo/light surfaces with gradient icon tiles, clear metadata, and explicit open/chat actions.
- Creation and room modals use the shared modal system.
- Project detail groups file upload, processing notice, file table, and room list into separate rounded sections.
- File and room availability rules remain unchanged.

### Document and Project Chat

- Keep the current full-height chat exception and existing data flows.
- Use a Discord-like workspace: a raised channel/room rail, a conversation header, a scrolling message field, and a fixed composer.
- Active room rows use Blurple. Connection and processing states use compact semantic pills.
- User messages use a Blurple field; assistant messages use a raised theme surface with clear contrast.
- Streaming indicators, REST fallback, notices, empty states, room creation, and timestamps remain intact.
- Below 768px, the room rail becomes a compact horizontal, scrollable room tray above the conversation so room selection remains available without covering the composer.

### Profile and Settings

- Use a bold page heading and rounded two-column settings shell on larger screens.
- Navigation tabs use raised pill rows with a Blurple active state.
- Profile and password forms use the shared input and button system.
- Password strength and validation retain semantic meaning and accessible copy.

## Responsive Behavior

- Below 768px, all content grids become single-column, the sidebar uses its existing mobile treatment, auth decoration simplifies, CTA groups stack, tables scroll within their own container, and chat remains usable at viewport height.
- From 768px through 1023px, large feature splits stack where content would become cramped; two-column card grids may remain where labels fit.
- From 1024px upward, the persistent sidebar and multi-column layouts use the existing maximum content width.
- From 1280px upward, hero and feature panels use wider split layouts while keeping the readable body-copy measure constrained.

## Accessibility

- Maintain WCAG-oriented contrast for text, controls, badges, and focus indicators in both themes.
- Preserve semantic headings, labels, buttons, links, tables, and modal forms.
- Every icon-only control has an `aria-label` or equivalent accessible name.
- Interactive states do not rely on color alone.
- Touch targets are at least 44px where practical.
- Honor `prefers-reduced-motion` and avoid flashing or fast gradient movement.

## Implementation Boundaries

- Do not change backend contracts, REST endpoints, socket events, service signatures, route paths, or authentication storage.
- Do not introduce a new component library or CSS framework.
- Do not add licensed Discord fonts or copy Discord trademarks, logos, characters, or proprietary artwork.
- Do not add fake dashboard data, marketing sections, pricing, game rankings, or other content from the source analysis that is unrelated to Doc-Sense AI.
- Do not preserve any ElevenLabs-specific serif typography, warm-neutral palette, neutral ink CTAs, editorial pill treatment, or pastel-only atmosphere.
- Do not perform unrelated component or service refactors.

## Testing and Verification

- Replace the current theme-token test expectations with the Discord palette, Hanken Grotesk/Inter typography, two-theme contract, shared radii, and reduced-motion rules.
- Preserve and run sidebar behavior tests, including navigation separation and theme-toggle behavior.
- Preserve and run home route/action tests.
- Preserve and run auth, protected route, document chat, project list/detail/chat, socket, and context tests.
- Add focused tests only where markup or behavior must change to support responsive or accessible controls.
- Run the complete Vitest suite, ESLint, `git diff --check`, and a production Vite build.
- Inspect representative light and dark screens at mobile, tablet, and desktop widths when a browser-based preview is available.

## Completion Criteria

- Every route uses the Discord-inspired token system in both light and dark themes.
- No ElevenLabs serif font, warm-neutral palette, editorial visual rule, or obsolete ElevenLabs design document remains.
- Theme switching updates the entire interface consistently and persists through the existing mechanism.
- All existing product workflows remain functional.
- Automated tests and production build pass, with any pre-existing unrelated failure reported precisely.
