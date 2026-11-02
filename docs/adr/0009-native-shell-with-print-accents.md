# Use a native dashboard shell with print accents

The dashboard is built from stock Nuxt UI dashboard parts: toolbar, cards, tables and tabs. It keeps a few accents from the printed seniority list of [ADR 0008](0008-printed-seniority-list-visual-identity.md): the Anchor Pilot's row keeps its highlighter, left bar and bold weight; type stays IBM Plex; ink stays primary; dark and light themes both stay, with dark as the default. Stamps, serif headings and dot leaders are dropped. They added noise and made the app feel unlike the other apps pilots use, and the stock parts already give every page the same structure. This record supersedes the parts of ADR 0008 that conflict with it. [docs/design-system.md](../design-system.md) holds the rules.

## Considered Options

- **Keep the full printed-list identity (ADR 0008):** rejected because stamps, serif headings, dot leaders and custom greenbar, gauge and tab markup made each page its own design and pushed content down. The redesign of #190 needs one shell for four sections.
- **Fully stock Nuxt UI, no accents:** rejected for the reason ADR 0008 gave. It carries no link to the subject, and the Anchor Pilot's row loses the one mark pilots look for first.

## Consequences

- Hypothetical Placement is shown as a stock badge with readable contrast in both themes, not as a stamp.
- "About this view" text sits behind an info icon that opens a popover, not in a collapsible that pushes content down.
- Peak bars and Retirement Wave bars stay in ink shades. Restoring color to them is out of scope.
- The shared greenbar table, gauge, stamp and dot-leader components are not built. One shared table (a stock table with the Anchor Pilot's row highlighted) serves Current › Status and List.
- The stamp token and the serif font token stay until the cleanup ticket removes their last use.
