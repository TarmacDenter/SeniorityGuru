# Use one As-of Date for the whole dashboard

Every Dashboard Section and Small View measures from one As-of Date: today. The analysis that `useSeniorityCore` builds carries it, and every seniority composable reads that analysis. No composable or component builds a second analysis with a different date. That includes the selected list's effective date. If pilots later need to view a historical list "as of" its effective date, that will be one scenario setting owned by `useScenario`, the single owner of shared scenario state. It applies to every section at once and is never a per-panel copy.

## Considered Options

- **Per-view As-of Date (previous behavior):** Upcoming retirements measured from the selected list's effective date; every other section measured from today. Rejected for three reasons:
  - Retirements already in the past were listed as "upcoming".
  - "Rank relative to me" was measured on a different date from Rank today.
  - Senior pilots who had retired before publication were counted in Rank today but never listed anywhere. A pilot saw "16 retired ahead" next to a table showing five.
- **The list's effective date for the whole dashboard:** rejected because Rank today, Standing, and the next-12-month counts would describe the publication date, not the day the pilot is reading them. The labels say "today" ([CONTEXT.md](../../CONTEXT.md), Rank).

## Consequences

- Windows such as Upcoming retirements, "Retirements senior to you (next 12 months)", and projections start at today.
- A table of upcoming retirements never contains a date on or before today; `useUpcomingRetirements.test.ts` asserts this.
- Selecting an older list changes the roster being analyzed, not the As-of Date.
- A historical As-of Date is a new scenario capability with its own decision, not a change to a single view.
