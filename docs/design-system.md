# SeniorityGuru design system: the printed seniority list

The interface reads like an airline's printed seniority list: ruled tables on greenbar paper, set in a typewriter-and-typeset type family, with your own line marked in highlighter. Dark mode is the same sheet on night paper. Dark is the default.

Token values live in `app/assets/css/main.css`. This file names the roles and the rules for using them. When a value changes, change it there only.

## Principles

1. **The list is the interface.** Position is shown as rows of the real list wherever possible, with your line marked.
2. **Structure carries information.** A rule, a stripe or an indent means something. No decoration.
3. **One loud thing.** The highlighter marks the pilot's own line and nothing else.
4. **Words follow [CONTEXT.md](../CONTEXT.md).** Rank beside Seniority Number. "Hypothetical Placement in <scope>" is always shown.
5. **Works offline, on a phone, in both modes.** Fonts are bundled. Layouts are designed at phone width first.

## Tokens

Use semantic tokens (`bg-default`, `text-muted`, `border-default`, `text-highlighted`) in components. Do not use raw hex or Tailwind palette colors.

| Role | Token | Use |
|---|---|---|
| Page | `--ui-bg` | The paper. |
| Stripe | `--ui-bg-accented` | Greenbar rows. |
| Sheet | `--ui-bg-elevated` | Header bar, cards, anything raised above the page. |
| Quiet surface | `--ui-bg-muted` | Sidebars, wells. |
| Rule | `--ui-border`, `--ui-border-muted` | Table rules, dividers. |
| Ink | `--ui-text` | Body text. |
| Ink, strong | `--ui-text-highlighted` | Figures, headings. |
| Ink, soft | `--ui-text-muted`, `--ui-text-toned`, `--ui-text-dimmed` | Labels, notes, disabled. |
| Primary | `--ui-primary` | Ink. Solid buttons and active navigation. |
| Highlighter | `--mark`, with text `--mark-ink` | The pilot's own line. Text on it stays dark in both modes. |
| Stamp | `--stamp` | "Hypothetical Placement" labels and warnings in print style. |
| Retirement | `--ui-past`, `--ui-imminent`, `--ui-soon` | Retirement proximity: red, orange, teal. Teal, so it never reads as the highlighter. |

## Type

All three families are IBM Plex, bundled with `@fontsource`. No CDN.

| Family | Token | Use |
|---|---|---|
| Plex Sans | `font-sans` | Controls, labels, column headers, navigation. |
| Plex Serif | `font-serif` | Page and section titles, notes, italic annotations. |
| Plex Mono | `font-mono` | List rows and every figure: Rank, Seniority Number, percentiles. |

- Figures use tabular numerals (set globally on `body`).
- Percentiles always show one decimal so columns align (`2.0%`, `12.0%`, `98.3%`).
- Body text lines stay under 80 characters.
- Column headers are sentence case, not all caps.

## Patterns

- **Greenbar table.** Alternating rows use the stripe token. A row with a note under it (such as a Hypothetical Placement line) is one stripe: group the pair in one `tbody`.
- **Your line.** Highlighter background, dark text, bold, and a dark bar on the left edge. No icons or carets.
- **Dot leaders.** Label, dotted rule, figure, for short fact lists such as Roster Size and Active pilots.
- **Tabs.** Left-aligned at their natural width with a 1.5rem gap. The selected tab has a highlighter underline under its label only. The first label lines up with the content edge below.
- **Header bar.** Raised sheet: `--ui-bg-elevated`, hairline rule and a soft shadow. It stays above scrolling content.
- **Stamp.** A "Hypothetical Placement" label is a stamp: stamp color, 2px border, slight rotation. Use sparingly.
- **Gauge.** Seniority Percentile is a thin ink bar on a stripe track, with the value in mono beside it.
- **Alignment.** Numbers are right-aligned in their own column. Names and labels are left-aligned. Qualification rows use separate columns for Rank, "of N" and percentile.

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
- Hardcoded blue is gone from the rank card progress bar (now an ink gauge) and the Compare statistics.

## Rollout

1. Foundation: tokens, fonts, toggle, header bar. Done.
2. Dashboard panels: Now, Next, Qualifications, Lists, built from the prototype variants. Sorting and grouping move into composables, with tests. Old `?tab=` links keep working.
3. Shared components: greenbar table, tabs, gauge, stamp, dot-leader list, replacing per-page markup.
4. Controls: slider, switch, histograms.
5. Remaining pages: Lists, Compare, Upload, Settings, landing, How it works.
6. Cleanup: remove the prototype folder, the variant switcher and the `?variant=` handling.
