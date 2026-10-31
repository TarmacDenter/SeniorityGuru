# app/utils/seniority-analysis/

The calculation and presentation ends of the analysis stack: `math → engine → presentation`.

- `math.ts` and `growth.ts` hold deterministic calculations with explicit inputs: percentile, Rank, retired-senior counts, trajectory points, retirement-count projection, growth. The caller passes the denominator (Roster Size, per [ADR 0007](../../../docs/adr/0007-measure-percentile-against-roster-size.md)).
- `presentation.ts` maps completed domain results to labels and component-facing values (formatting, `hypotheticalLabel`, no-result labels). Only the facade calls these adapters; components and composables receive their output.
- Receive validated `SeniorityEntry` values. No stores or Dexie.
- Search `math.ts` before adding a calculation, and `presentation.ts` before adding a formatter.
