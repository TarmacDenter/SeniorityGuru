# Use a printed seniority list visual identity

**Status:** partly superseded by [ADR 0009](0009-native-shell-with-print-accents.md). Stock Nuxt UI dashboard parts replace the greenbar tables, stamps, serif headings, dot leaders and custom tabs. The highlighter on the pilot's own line, IBM Plex type, ink as primary and both themes still stand.

The interface takes its look from an airline's printed seniority list: ruled tables on greenbar paper, IBM Plex type, a highlighter on the pilot's own line, and the same sheet on night paper in dark mode. Primary is ink, not a brand color. Dark is the default. [docs/design-system.md](../design-system.md) holds the rules, and `app/assets/css/main.css` holds the token values.

## Considered Options

- **Flight-deck instrument:** a dark-first gauge look in amber and cyan. Rejected because it reads as an aviation dashboard theme rather than the document pilots already know, and it works poorly in daylight.
- **Keep the stock Nuxt UI look (DM Sans, sky blue, slate cards):** rejected because it carries no link to the subject and gives the same card grid on every page.
- **Hosted web fonts:** rejected because the app promises to work offline with no data leaving the device. Fonts are bundled with `@fontsource`.

## Consequences

- Retirement proximity "soon" changes from yellow to teal, so it cannot be confused with the highlighter on the pilot's own line.
- Components use semantic tokens. Raw hex and Tailwind palette colors are not used for new work.
- The chart colors, sliders, switches and histograms need their own pass, tracked in the rollout in the design system file.
- The `app/components/dashboard/prototype/` folder is throwaway and is deleted once the dashboard panels are built.
