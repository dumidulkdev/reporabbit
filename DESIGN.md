# RepoRabbit — DESIGN.md

> Brand contract for the RepoRabbit UI, following the OpenDesign workflow:
> brief → direction → design system → artifact → handoff.
> Source system: **OpenDesign `linear-app`** (Linear-inspired, Productivity & SaaS),
> `nexu-io/open-design` — `design-systems/linear-app/DESIGN.md` (370 lines),
> `design-tokens.json` (56 tokens, grade: excellent), `tokens.css`.
> Artifact type: OpenDesign **dashboard** (single-page HTML artifact that reads
> this `DESIGN.md`). The repo also ships a `github-dashboard` design template;
> this design follows that dashboard pattern with the Linear system.
> Prototype: `reporabbit-ui-design.html` (same folder). All screens in the
> prototype are built from the tokens below — no other palette is used.

## 1. Product

RepoRabbit is a GitHub Engineering Analytics platform. It answers one question
for an engineering lead: **what is stuck, and why?** The UI is a working
tool, not a marketing page. Density and scanability matter more than
decoration. Every screen must be readable at a glance, with numbers, tables
and trends doing the work.

Audience: engineering leads and developers. Tone: precise, quiet, factual.

## 2. Visual theme

Dark-mode-native, Linear-style. Near-black canvas; content emerges through
small steps of white opacity, not through colour. One accent only.

- Page background: `#08090a`
- Panel / sidebar background: `#0f1011`
- Elevated surface (cards, dropdowns, dialogs): `#191a1b`
- Hover surface: `#28282c` (used sparingly)
- Primary text: `#f7f8f8` (never pure `#ffffff`)
- Secondary text: `#d0d6e0`
- Muted text: `#8a8f98`
- Meta text (timestamps, disabled): `#62666d`
- Border (default): `rgba(255,255,255,0.08)`
- Border (subtle): `rgba(255,255,255,0.05)`
- Brand accent: `#5e6ad2` (filled primary actions only)
- Accent interactive: `#7170ff` (links, active nav)
- Accent hover: `#828fff`
- Success: `#27a644` — status dots and "healthy" text only
- Warning: `#eab308` — stale / at-risk text and dots only
- Danger: `#dc2626` — blocked / failing text and dots only

No gradients anywhere. No gradient hero, no coloured card backgrounds, no
purple/blue blobs. Elevation comes from background luminance steps
(`rgba(255,255,255,0.02)` → `0.04` → `0.05`), never from drop shadows on
dark surfaces.

## 3. Typography

- Primary: **Inter Variable**, `font-feature-settings: "cv01", "ss03"`,
  fallbacks `SF Pro Display, -apple-system, system-ui, Segoe UI, Roboto`.
- Monospace (repo names, hashes, code, technical labels): **Berkeley Mono**,
  fallbacks `ui-monospace, SF Mono, Menlo, Consolas, monospace`.
- Weights: 400 reading, 510 emphasis / navigation, 590 strong emphasis.
  (In the HTML prototype and in Astro, 510/590 map to the variable font's
  500/600 stops where the variable file is unavailable.)
- Display / page titles: 24px, weight 510, letter-spacing `-0.288px`.
- Section titles: 15px, weight 590.
- Body / table text: 13–14px, weight 400, line-height 1.5.
- Metadata / timestamps: 12px, weight 400, `#8a8f98`.
- KPI numbers: 28px, weight 510, tight tracking; delta text 12px.
- Letter-spacing is negative at large sizes only; body text is normal.

## 4. Layout

- App shell: left sidebar 232px (`#0f1011`, right border
  `rgba(255,255,255,0.05)`), main column fluid, max content width 1200px,
  24px gutters, 8px base grid.
- Top bar: 56px, search trigger (`⌘K`), time-range control (7d / 30d / 90d),
  Sync button, avatar. Sticky, `#08090a` with bottom border.
- Sidebar sections: **Workspace** (Dashboard, Pull Requests, Repositories,
  Contributors, Alerts), **System** (Settings). Repo switcher at the top,
  user at the bottom. Active item: `rgba(255,255,255,0.05)` background,
  `#f7f8f8` text, 2px accent bar on the left edge.
- Cards: `rgba(255,255,255,0.02)` background, `1px solid
  rgba(255,255,255,0.08)` border, 8px radius, 16px padding. Featured
  panels 12px radius. No shadow.
- Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48px.
- Breakpoints: <768px single column, sidebar collapses to icons;
  768–1024px two-column KPI grid; >1024px full layout.

## 5. Components

### Buttons
- Primary: `#5e6ad2` background, white text, 6px radius, 8px 14px padding.
  Hover `#828fff`. Used for one action per screen at most (Sync, Connect repo).
- Ghost: `rgba(255,255,255,0.02)` background, `1px solid
  rgba(255,255,255,0.08)` border, `#e2e4e7` text, 6px radius.
- Subtle / toolbar: `rgba(255,255,255,0.04)` background, `#d0d6e0` text.
- Icon button: 28px circle, `rgba(255,255,255,0.03)` background,
  `1px solid rgba(255,255,255,0.08)` border.

### Tables (the core component)
- Header row: 11px uppercase, letter-spacing 0.06em, `#62666d`, 32px tall,
  bottom border `rgba(255,255,255,0.05)`.
- Rows: 48px, 13px text, bottom border `rgba(255,255,255,0.05)`.
  Hover: `rgba(255,255,255,0.02)`.
- Status is a 6px dot + plain text (`Open`, `Needs review`, `Stale`,
  `Merged`, `Blocked`) — never a filled coloured pill.
- Labels: at most two per row, plain text in a 9999px pill with a
  `1px solid #23252a` border, `#d0d6e0` text, transparent background.
  No label rain.

### KPI stat
- Label 12px `#8a8f98`; value 28px weight 510 `#f7f8f8`; delta 12px
  (`#27a644` better, `#dc2626` worse) with an arrow character, never an icon
  badge. Small caption line underneath in `#62666d`.

### Filters
- Segmented control (All / Open / Needs review / Stale / Merged) as a
  single bordered group; active segment `rgba(255,255,255,0.06)`.
- Selects and search input: `rgba(255,255,255,0.02)` background,
  `1px solid rgba(255,255,255,0.08)` border, 6px radius, 12px 14px padding.

### Charts
- Line and bar charts in SVG, stroke `#7170ff` (line) or
  `rgba(255,255,255,0.14)` (bars), grid lines `rgba(255,255,255,0.05)`,
  axis labels 11px `#62666d`. No chart legends in colour; one series per
  chart, labelled in text above it. DORA metrics are four plain rows with a
  thin progress bar in `#5e6ad2` and a numeric value.

### Alerts
- Alert row: coloured dot (amber/red/green) + 13px text + repo/PR link +
  timestamp. No banner, no coloured background block.

### Avatars
- 24px circles with initials on `#28282c`, `#d0d6e0` text. No photos in
  the prototype; the Astro build may use GitHub avatar URLs.

## 6. Screens

### Dashboard (main screen)
Top: page title "Overview", subtitle with workspace and last sync.
KPI row (4): PR cycle time 1.8d (↓0.4d vs previous period), Review latency
6.2h (↓1.1h), Merge rate 87% (↑3pp), Open PRs 23 (5 stale).
Row 2: "Cycle time trend" line chart (7d/30d/90d) + "DORA metrics" panel
(lead time 1.8d, deployment frequency 4.2/week, change failure rate 6%,
time to restore 3.4h).
Row 3: "Needs attention" table — the 5 stalest / longest-waiting PRs.
Row 4: "Weekly volume" bar chart + "Top contributors" mini-list.

### Pull Requests explorer
Filter bar: search, Author select, Label select, status segments, Stale-only
toggle, sort (Newest / Longest waiting / Most changed).
Table columns: PR (title + `#number` + repo), Author, Labels (max 2),
Changes (+add/−del), Review time, Status, Age.
Row click opens a detail panel: description, checks, reviewers, timeline,
and the actions Request review / Merge (disabled in prototype).
Empty state: "No pull requests match these filters." with a Clear filters
action. No illustration.

### Repositories
Table/cards: repo name (mono), visibility, sync status dot + "Synced 12 min
ago", open PRs, merged this period, avg cycle time, last activity.
Primary action: "Connect repository" (ghost button, opens a form state in
the Astro build; in the prototype it shows the form inline).
A repo row can be selected to filter the Dashboard to that repo.

### Contributors
Leaderboard table: rank, contributor, PRs merged, reviews given, avg review
time, lines changed (+/−), trend arrow. Above it, a churn bar chart
(additions vs deletions per contributor). No gamification, no badges, no
points — just the numbers.

### Alerts
List of stale-PR, large-PR and failed-check alerts with dot, text, link and
time. Mark-all-read as a ghost button. (Included as a screen in the
prototype; lower fidelity than Dashboard / PR explorer.)

### Settings
Workspace name, GitHub token / connection state, sync interval, stale-PR
threshold (days), notification preferences. Plain form rows, ghost Save.
(Included as a simple screen in the prototype.)

## 7. Data (prototype sample data)

Clearly labelled "Sample data" in the prototype. Repos under
`dumidulkdev`: `reporabbit`, `astro-commerce`, `fastapi-invoicing`,
`notes-api`. Authors: Dumidu Lakshan, Anika Perera, Shenali Fernando,
Kavindu Rajapakse, Nethmi Silva. PR titles are realistic engineering
titles (e.g. "Add rate limiting to the GitHub sync worker").
Numbers are internally consistent within a screen; the 7d/30d/90d switch
changes the KPI values and the trend chart.

## 8. Do / Don't (Dumidu's rules, binding)

- DO use one accent (`#5e6ad2` / `#7170ff`) and neutrals everywhere else.
- DO use real tables, real numbers, real-looking PR titles and repo names.
- DO keep status as dot + text; keep labels to max two per row.
- DON'T use gradients, gradient text, glow, or coloured card backgrounds.
- DON'T use badge/pill overload, emoji, or decorative illustration.
- DON'T use weight 700; max weight is 590.
- DON'T use pure white text or solid dark borders on dark surfaces.
- DON'T add marketing copy or a hero section inside the app.

## 9. Handoff to the Astro build

- Tailwind v4 theme tokens map 1:1 from §2 (`--bg`, `--surface`, `--fg`,
  `--muted`, `--border`, `--accent`, `--success`, `--warn`, `--danger`).
- shadcn-style components: Button (primary/ghost/subtle), Table, Select,
  Input, Tabs/segmented control, Card, Avatar, Dialog (PR detail).
- Charts: React islands (Recharts or plain SVG as in the prototype) fed by
  the FastAPI `/metrics` and `/pulls` endpoints; no chart library may
  introduce its own palette — pass the tokens in.
- Fonts: Inter Variable via `@fontsource-variable/inter`, Berkeley Mono via
  system mono stack; `font-feature-settings: "cv01", "ss03"`.
- The prototype is the visual spec. If a screen in the build differs from
  the prototype, the prototype wins unless Dumidu approves the change.

## 10. Decisions for Dumidu

1. **Dark only, or add a light mode later?** Prototype and system are
   dark-only (Linear is dark-native). Light mode is a separate piece of
   work — confirm whether it is wanted at all.
2. **Accent:** indigo `#5e6ad2` from Linear. Keep it, or switch to a
   neutral/graphite accent with indigo reserved for links only?
3. **Avatars:** initials in the prototype. Use real GitHub avatar images
   in the build, or keep initials for a cleaner look?
4. **Repo scope:** prototype shows 4 sample repos. Confirm the real
   first repos to connect are Dumidu's own public repos.
