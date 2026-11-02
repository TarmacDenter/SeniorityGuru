# SeniorityGuru design system: native shell, print accents

The interface is a native Nuxt UI dashboard: stock toolbar, cards, tables and tabs. A few accents come from an airline's printed seniority list: your own line marked in highlighter, IBM Plex type, and ink as the primary color. Dark and light modes are both supported. Dark is the default.

The decision is recorded in [ADR 0009](adr/0009-native-shell-with-print-accents.md), which partly supersedes [ADR 0008](adr/0008-printed-seniority-list-visual-identity.md).

Token values live in `app/assets/css/main.css`. This file names the roles and the rules for using them. When a value changes, change it there only.

## Principles

1. **Stock parts first.** Use the Nuxt UI dashboard components as they ship. Add custom markup only for the accents below.
2. **The list is the interface.** Position is shown as rows of the real list wherever possible, with your line marked.
3. **One loud thing.** The highlighter marks the pilot's own line and nothing else.
4. **Words follow [CONTEXT.md](../CONTEXT.md).** Rank beside Seniority Number. "Hypothetical Placement in <scope>" is always shown.
5. **Works offline, on a phone, in both modes.** Fonts are bundled. Layouts are designed at phone width first.

## Tokens

Use semantic tokens (`bg-default`, `text-muted`, `border-default`, `text-highlighted`) in components. Do not use raw hex or Tailwind palette colors.

| Role | Token | Use |
|---|---|---|
| Page | `--ui-bg` | The page background. |
| Raised | `--ui-bg-elevated` | Navbar, cards, anything raised above the page. |
| Quiet surface | `--ui-bg-muted` | Sidebars, wells. |
| Accented surface | `--ui-bg-accented` | Hover and selected states in stock components. |
| Rule | `--ui-border`, `--ui-border-muted` | Table rules, dividers. |
| Ink | `--ui-text` | Body text. |
| Ink, strong | `--ui-text-highlighted` | Figures, headings. |
| Ink, soft | `--ui-text-muted`, `--ui-text-toned`, `--ui-text-dimmed` | Labels, notes, disabled. |
| Primary | `--ui-primary` | Ink. Solid buttons and active navigation. |
| Highlighter | `--mark`, with text `--mark-ink` | The pilot's own line. Text on it stays dark in both modes, muted text included. |
| Retirement | `--ui-past`, `--ui-imminent`, `--ui-soon` | Retirement proximity: red, orange, teal. Teal, so it never reads as the highlighter. |

The `font-serif` and `--stamp` tokens are removed. The dashed "not holdable yet" Qualification Threshold marker is dashed ink.

## Type

Type is IBM Plex, bundled with `@fontsource`. No CDN.

| Family | Token | Use |
|---|---|---|
| Plex Sans | `font-sans` | Page and section titles, controls, labels, column headers, navigation, notes. |
| Plex Mono | `font-mono` | List rows and every figure: Rank, Seniority Number, percentiles. |

- Headings are not set in serif.
- Figures use tabular numerals (set globally on `body`).
- Percentiles always show one decimal so columns align (`2.0%`, `12.0%`, `98.3%`).
- Body text lines stay under 80 characters.
- Column headers are sentence case, not all caps.

## Patterns

- **Shell.** `UDashboardGroup` with `UDashboardSidebar` for the sections and `UDashboardPanel` for each page. The page title sits in `UDashboardNavbar`. The scenario controls sit in `UDashboardToolbar`.
- **Tabs.** A section's small views use stock `UTabs` in a row under the top bar. On a phone the row scrolls sideways.
- **Cards.** Each presentation sits in a stock `UCard`.
- **Tables.** Use stock `UTable`. Rows are not striped.
- **Your line.** Highlighter background, dark text, bold, and an ink bar on the left edge (`--ui-text-highlighted`: dark on light paper, white on night paper, so it shows in both modes). No icons or carets. This is the one custom mark on a stock table.
- **Short facts.** Figures such as Roster Size and Active pilots are a label with the figure beside or under it. No dot leaders.
- **Hypothetical Placement.** A stock `UBadge` that reads "Hypothetical Placement in <scope>". Its text meets contrast in both modes. It never uses the highlighter.
- **About this view.** Explanations sit behind an info icon that opens a `UPopover`. They are not shown inline or in a collapsible.
- **Alignment.** Numbers are right-aligned in their own column. Names and labels are left-aligned. Qualification rows use separate columns for Rank, "of N" and percentile.

Stamps, dot leaders, greenbar stripes and the ink gauge are not used.

## Theme and controls

- The sun/moon button is in the header on every page. It is a `UColorModeButton`.
- Dark is the default (`nuxt.config.ts`, `colorMode.preference`).
- Every new component is checked in both modes at 500px and at desktop width before it merges.

## Tools

- **Token playground.** `/dev/theme`.

## Controls and charts

- **Ruler slider.** Tick marks along the track and a highlighter thumb with an ink outline. Styled in `app/theme.ts`.
- **Switch.** Square-cornered ink toggle with its state spelled out: use `AppSwitch`, which shows "On" or "Off" beside it.
- **Charts.** `useChartTheme` resolves the semantic tokens for the active mode and refreshes when the mode changes. Bars and lines are single ink; the pilot's own bucket is the highlighter.
- **Peak and Retirement Wave bars.** Shades of ink, not color.

## Rollout

1. Foundation: tokens, fonts, toggle, header bar. Done.
2. Visual identity: native shell with print accents (ADR 0009). Done.
3. Navigation shell: Current, Trajectory, Demographics and List in the sidebar and bottom bar, with small views as tabs.
4. Sections: each section and small view built on stock parts. Sorting, grouping and labels live in composables, with tests.
5. Shared components: one anchored table (stock table, your line highlighted) for Current › Status and List.
6. Remaining pages: Upload, Settings, landing, How it works. Done.
7. Cleanup: remove the stamp and serif tokens, and components nothing references.
