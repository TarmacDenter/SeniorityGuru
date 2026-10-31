# app/components/

Components render. Data and actions arrive through composables and props.

- Reach persistence through composables. Components import neither Pinia stores nor `~/utils/db`.
- Import seniority analysis only from `~/utils/seniority`. The facade builds snapshots, lenses, and scenarios and applies presentation adapters; components receive the finished values.
- Render the values the facade returns: Rank, Publication Position, Roster Size, Seniority Percentile, active pilot count, `hypotheticalLabel`, no-result labels. When a number or label is missing, add it to the facade (see [seniority-api](../utils/seniority-api/AGENTS.md)) and render that.
- Keep domain logic in `app/utils/`. A component with a block of domain computation belongs in the engine.
- Name displayed concepts with the terms in [CONTEXT.md](../../CONTEXT.md).
- Cover visible behavior with a mounted test next to the component. Assert text a pilot can read.
