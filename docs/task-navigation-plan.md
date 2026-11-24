# Task-First Site Flow Plan

**Status:** Design interview complete for Phases 1 and 2 (2026-11-23); visual mockups next. This is a living document: it records every decision made so far and what is still open, so work can resume from it at any point.
**Scope:** The overall flow of the site, not only navigation: how visitors find their Task, how pages use space (desktop pages currently waste space on a left site sidebar plus a right page outline), and reworking registration to feel more like an app.
**Branch:** `users/michsco/task-nav` (from `origin/main`). Replaces the earlier persona-based attempt on `preview` (#2532).
**Constraints:** No backend (ModernApps) changes. Mobile first. Visitors have very different levels of technical ability, and many don't scroll to find more content.

Terms (Task, Task Chooser, Task Hub, Section Navigation, Happening Now, Event List, Program, Season) are defined in [`CONTEXT.md`](../CONTEXT.md).

## Why replace the `preview` attempt

- Its look and feel doesn't read as a modern site.
- Some of its organization isn't obvious.
- It starts from personas (Quizzer, Parent, Coach, Event Coordinator). Visitors should instead be asked what they want to do.
- Not a bad start: individual pieces may be reused where they fit the new flow.

## Decisions

| # | Decision | Notes |
| --- | --- | --- |
| D1 | Start fresh from the latest `main`; `preview` is reference only. | Pieces may be salvaged case by case. |
| D2 | Top-level navigation is by Task, not by audience. | Audience-specific content can live inside "Learn about Bible Quiz" if needed. |
| D3 | `/` becomes the Task Chooser ("What are you trying to do?"). The Event List moves to its own page; old `/?type=jbq\|tbq` links redirect there. | |
| D4 | A Happening Now strip sits above the Tasks on the home page, shown only while an event is live, linking to its scores. | Keeps tournament-day visitors one tap from scores. |
| D5 | Six Tasks (see below), plus News as its own top-level entry (D32). | Must fit one phone screen with no scrolling. |
| D6 | Registration starts from Live & upcoming events (each event card has a labeled Register action); there is no separate Register tile. The tile's description must make registration obvious. | |
| D7 | Quizzer Search is one canonical page, reachable by a search box on both the Live & upcoming and the Past scores & history hubs. | |
| D8 | Two phases, each a PR into `preview`: Phase 1 is the navigation shell; Phase 2 reworks registration to feel more like an app. Both are designed in this effort; nothing goes to `main` until both are ready. | |
| D9 | Each Task opens a Task Hub: a real page with its own URL, never a modal. Modals are for deeper, one-step choices (e.g. picking a Program, the Menu, dialogs within a flow). | Back button and bookmarks work as expected. |
| D10 | Desktop layout: no left sidebar on public pages; data and app pages (Event List, scores, Quizzer Search, registration) use the full width; long reading pages show a right-hand outline only on very wide screens, otherwise an "On this page" button at the top; Manage Events and Admin keep a left sidebar that collapses to icons. | Removes wasted space from the current three-column layout. |
| D11 | Header: logo (home) at left; Search and Sign in/name at right. On phones (and any window too narrow for the links) a Menu button labeled "Menu" opens a full-screen list of the six Tasks and News, with the current page's Task Hub at the top. On desktop there is no Menu button: the Tasks and News are header links, the current one underlined, and Manage events is reached from the account menu (D29) or the home page. Every page shows a "← [Task Hub]" breadcrumb above its title. | Revised 2026-11-23: a desktop Menu would only repeat the header links. |
| D12 | Tasks with several pages get Task-specific navigation: a slim left list of only that Task's pages on desktop, an "In this section" button under the breadcrumb on phones. Single-list Tasks have none. | |
| D13 | Keep existing URLs wherever possible. When a URL must change, decide on its redirect case by case rather than keeping a large redirect list. | Redirects live in `public/_redirects` (Cloudflare Pages). Its current entries point to `/?type=jbq\|tbq`, so they change with D3. Cloudflare can't match query strings in a source path, so `/?type=` needs a client-side redirect on the home page. |
| D14 | Choosing JBQ or TBQ never uses a modal: people switch often. A page that differs by Program shows an inline JBQ / TBQ switch at the top; on a first visit with no remembered choice, the page itself asks (two large buttons in place of its content). The browser remembers the choice. Pages with no equivalent in the other Program show no switch and simply say which Program they are for. Event and score lists use an All / JBQ / TBQ filter. | JBQ is mostly results; TBQ has far more content, so many TBQ pages have no JBQ counterpart. |
| D15 | The admin Task is always on the home page, as a quieter full-width row at the bottom; it asks for sign-in if needed. It covers more than events: Manage Events and reports, People & Permissions (moved out of the sign-in menu), Device overview, and Payouts. Each entry's visibility matches today's code exactly (e.g. Payouts needs the Payout Manager flag; People & Permissions needs at least Church-level admin). | No authorization rules change. |
| D16 | Happening Now uses the Event List's existing "live" rule (today is between the event's start and end dates). With one live event it shows "Live now: [event] · View scores"; with several, "N events live now · See them", opening Live & upcoming events filtered to live events. If the visitor has saved Event List filters (region, district, Program), it counts only matching live events ("2 events live in your district"), or says "No live events in your area · 4 live elsewhere". When filtered, the strip must make that obvious with an icon and text (exact treatment to be iterated in mockups). Always one line tall. | Computed in the browser from data the site already has. |
| D17 | Visual direction: calm and app-like (generous spacing, large rounded cards and tap targets, one accent color, clean sans-serif, simple line icons), with bolder, denser styling only on scores and live pages. Keep the current logo; its main color is the accent. | Starting point; refined with visual mockups. |
| D18 | Event cards: a status badge (Live now, Registration open, Registration closes [day], Upcoming, Finished) and labeled buttons for what applies (View scores, Register, Event details); the most important one is filled (Register while open, View scores when live). The list is sectioned Live now → Registration open → Coming up → Recently finished, each heading with a count. | Replaces today's card whose single destination changes with the event's state. |
| D19 | Past scores & history hub: Program switch, "Find a quizzer" box, a large season picker, that season's events as cards (View scores as the main action), then Nationals records and history. The season picker defaults to the Current Season if any of its events have results, otherwise the season before; the Next Season is never the default. Seasons from before online scoring get a short page linking to what exists. Season overview material (material breakdowns, scripture updates, writers' tips) moves to Study & practice. | Next Season = the highest-numbered season folder; it is added each year. |
| D20 | All History (Nationals records and general history) lives in the Past scores & history hub; Learn about Bible Quiz links to it. | Most history is past results. |
| D21 | Study & practice hub (JBQ / TBQ switch). TBQ: this season's material (material breakdown, scripture portion updates, Master and National memorization, discipleship, writers' tips) for the Current Season with a Next Season link; practice questions (free Application Questions and paid products); Training for Quizzers, Coaches and Officials; Study Hub sign-up. JBQ: Question Generator; this season's material with a Next Season link. | |
| D22 | The Task is "Apps, rules & downloads" ("Rulebooks, scoresheets, apps, forms & graphics"). Apps come first and are shared by both Programs, so they sit above the JBQ / TBQ switch; then Rules (current first, older under "Past rules"), Scoresheets, Forms, and Graphics & videos. The Manage events, people & more hub also links to EZScore. | Apps are among the most common downloads during a meet. ScoreKeep is not promoted in the new hubs (see Follow-ups). |
| D23 | Learn about Bible Quiz hub: "What is Bible Quiz?" (JBQ and TBQ cards opening `/jbq/` and `/tbq/`); Get started (starting or joining a team, contacts); Stay connected (Subscribe, Discord, and a link to News); TBQ extras (Scholarships, Products, Links); a link to History. Terms and Privacy move to the footer. The Wiki is dropped (no one has contributed to it). | "Get started" content may not exist yet: check during the content audit. |
| D24 | Home order (phone, 2 columns): Live & upcoming events · Past scores & history / Apps, rules & downloads · Study & practice / Learn about Bible Quiz · News / Manage events, people & more (full width, quieter). Desktop: the same six tiles in a 3 × 2 grid, the admin row beneath. | Ordered by how often visitors come for each. |
| D25 | Keep Starlight; replace its components (header, page frame, sidebar, page outline, others) as necessary. | [ADR 0001](adr/0001-keep-starlight-replace-shell.md). |
| D26 | Replacing `preview`: when the Phase 1 PR is ready, back up the current `preview` as `preview-v1`, reset `preview` to the latest `main`, then open Phase 1 as a PR into `preview`. Phase 2 follows the same way. **The reset happens only after the user confirms at that moment.** | Cloudflare rebuilds `preview` on each merge. |
| D27 | Manage events: Phases 1 and 2 change only its shell (new header, look, and navigation); its screens and flows stay as they are. A deeper workspace redesign may come later as its own phase. | Coordinators are a smaller, more practiced audience. |
| D28 | One Section Navigation component serves both Task-specific navigation (D12) and the event workspace. Desktop: a slim left list with groups (event workspace: Dashboard, Registration setup, Scoring, Summary, Reports, More) that collapses to icons. Phones: one button under the breadcrumb ("In this section ▾" / "In this event: Scoring ▾") opening a full-screen sheet. Breadcrumb "← Manage events, people & more / [Event]". Rare, risky actions (Clone, Delete) go under More. | Designed for the workspace's three-level nesting so the public version isn't too simple. Replaces the React sidebar inside Starlight's (`useReactSidebar`). |
| D29 | Account menu. Signed out: a single Sign in button. Signed in: the person's name opens My profile, My registrations, Manage events, people & more (only with admin access), and Sign out. While impersonating, the existing Stop impersonating banner stays at the top of every page and the menu shows "Viewing as [name]". | My registrations looks feasible without backend changes (the churches a person is authorized for, then `RegistrationService.getRegistrations` by church); verify against ModernApps before building, and drop it if not. |
| D30 | Site-wide rules for visitors who don't scroll: (1) each Task Hub's most important action fits on the first phone screen; (2) section headings show counts ("Registration open (4)") and hubs open with an "On this page" row of jump buttons; (3) long pages show a faded edge and "More below ↓" on the first screen; (4) key information is never hidden in collapsed panels; accordions are only for secondary detail. | |
| D31 | Validation on `preview` after each phase: a hallway test with 3–5 real people on their phones (including a parent and an older, less technical volunteer) doing five tasks (today's scores, last season's results, download the Coaching App, find the TBQ rulebook, register a church). Measure unaided success and taps; fix and repeat before `main`. After launch, compare Task Hub bounce in Google Analytics. More than one wrong tap for most testers means a design problem. | |
| D32 | News (the blog at `/news/`) is a top-level entry: a home tile, a header link on desktop, and a row in the phone Menu. Its URLs stay the same. | Newsletters carry dates and deadlines people need to find quickly. The `starlight-blog` plugin adds its own Starlight component overrides; check them against our replaced header, sidebar and page frame before the Phase 1 build. |

### Tasks (D5)

1. **Live & upcoming events**: today's scores, schedules and registration
2. **Past scores & history**: results by season, Nationals records and Bible Quiz history
3. **Study & practice**
4. **Apps, rules & downloads**
5. **Learn about Bible Quiz**
6. **Manage events, people & more**: events, reports, permissions, devices and other admin tools; requires sign-in (wording may still be polished)

Order is set by D24.

## Follow-ups (separate changes)

- Mark ScoreKeep as deprecated on the Apps page.

## Phase 2: Registration

Today: sign-in required; one long page per event and church with collapsible sections (Church, Teams, Individual Quizzers, Officials, Attendees, Forms, Payment), teams and people edited in dialogs, a separate Receipt page. Sections shown depend on the event. Changes save immediately (`RegistrationService.createOrUpdateChurch`; teams separately).

| # | Decision | Notes |
| --- | --- | --- |
| R1 | A first-time registration uses guided steps: one step per screen, a progress bar ("Step 3 of 6: Officials"), large Back and Next buttons, saving as you go, ending at Review & pay. Steps the event doesn't use don't appear. Once started, a registration opens on a summary screen where each step is a card (e.g. "Teams: 3 · Edit") that can be opened in any order; the progress bar's steps can also be tapped. | Teams and people change often after the first pass. No backend change: saves already happen per change. |
| R2 | Choosing the church: with exactly one authorized church, preselect it and skip the step; every step shows "Registering for: [church] · Change". With several, show them as large choices marked "already registered" where true; choosing a registered church opens its summary screen. "Find another church" opens search, ending with "Add a new church". Before sign-in, Register shows a short event card with "Sign in to register" instead of going straight to a sign-in screen. | The public Event List data has name, dates, registration dates and location, but not cost; show cost only if it is available without sign-in (verify, no backend change). |
| R3 | People steps (Teams, Individual Quizzers, Officials, Attendees) share one pattern: a list of cards with Edit and Remove, and a large "+ Add [role]" button at the top. Adding opens a dialog that searches people already in the system first (existing person lookup), with "Someone new" as the fallback. Teams are named first, then quizzers are added inside them the same way. On phones the dialogs are full-screen sheets with clear Done and Cancel. | |
| R4 | Forms step: a checklist grouped by person ("[form] · Open form ↗ · Not done"), headed "3 of 5 forms done"; people may continue with forms outstanding. The last step, Review & pay, recaps each step with Edit links, shows the total and a large Pay now button where online payment is enabled (otherwise how to pay), then the Receipt. Summary cards show status ("Forms: 2 still needed", "Balance due: $40", "Paid ✓"). Event owners' payment-entry tools stay on the summary screen, visible only to them. | |

## Open questions

- Refine from the mockups (canvas: https://claude.ai/artifact/4yXYA6ZiWdeGMSNzwD1SFy, private to the owner): labels, the filtered Happening Now treatment, and short desktop header labels ("Live & upcoming", "Past scores", "Apps & rules", "Study", "Learn").
- Registration "Add" search: confirm what the existing person lookup returns (e.g. people from other churches, past roles) before showing it.
- Possible Phase 3: a deeper redesign of the Manage events workspace.

## Phase 1 build plan

Started 2026-11-23 on `users/michsco/task-nav`. Each item is a commit; the PR into `preview` waits for the D26 confirmation.

| URL | Page | Notes |
| --- | --- | --- |
| `/` | Task Chooser with Happening Now | Old `/?type=jbq\|tbq` links redirect client-side to `/events/?type=…`. |
| `/events/` | Live & upcoming events | The Event List (`LiveAndUpcomingApp`), with the D18 cards and sections (built in a follow-up PR). |
| `/scores/` | Past scores & history | Season picker links to the existing `/{program}/seasons/{season}/results/` pages; History links. |
| `/downloads/` | Apps, rules & downloads | Links to `/apps/`, rules and `/tbq/downloads/`. |
| `/study/` | Study & practice | JBQ / TBQ switch. |
| `/learn/` | Learn about Bible Quiz | |
| `/news/` | News | Unchanged blog; the plugin's own header link is turned off (`navigation: "none"`). |
| `/manage/` | Manage events, people & more | Entries gated exactly as the account menu does today. |

Shell:

1. Header: logo, Task links and News (wide screens), Search, account menu, and a Menu button (narrow screens) opening a full-screen Menu.
2. A Starlight route middleware turns the site sidebar off on public pages, and narrows it to the current Task's pages (Section Navigation) under `/jbq/`, `/tbq/`, `/manage-events/` and `/admin/`.
3. Footer: Terms, Privacy and social links.
4. Breadcrumb "← [Task Hub]" above page titles.

Not in this pass: the Program first-visit prompt (D14). My registrations (D29) was built in a follow-up PR at `/my-registrations/`, using the existing `GET /api/Registration?cid=` route (no backend change). D28 was built in a follow-up PR (workspace groups, collapse to icons, the phone sheet label, and the "/ [Event]" breadcrumb). It still uses the existing Starlight and React sidebars rather than one shared Section Navigation component; that replacement remains open.

## Finish: rebase on `main`, then merge

`main` keeps moving while this work sits on `preview`: `bible-quiz-bot` commits new events and results to `main` every few hours, and other fixes land there too. So, as the last step of the whole plan (after Phase 2):

1. Rebase `preview` onto the latest `main`, so it carries every event and fix added since `preview` was reset (D26). Resolve conflicts in favor of `main`'s generated data (`src/data/generated/`) and this plan's shell changes. A rebase rewrites `preview`'s history, so publishing it needs a force-push (`git push --force-with-lease origin preview`): do it only with the owner's go-ahead and when no other PR into `preview` is open.
2. Run `npm ci && npm run build` and check the new hubs against the new events (Happening Now, the Event List, the season pickers).
3. Only then open the PR from `preview` into `main` (D8). Merging it deploys the site, so it happens only when the owner asks.

Before each hallway test (D31), refresh `preview` the same way so it shows current events; merging `main` into `preview` instead avoids the force-push when a PR into `preview` is open.
