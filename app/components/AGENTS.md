# app/components/

Components render. Data and actions arrive through composables and props.

- Reach persistence through composables. Components import neither Pinia stores nor `~/utils/db`.
- Import seniority analysis only from `~/utils/seniority`. The facade builds snapshots, lenses, and scenarios and applies presentation adapters; components receive the finished values.
- Render the values the facade returns: Rank, Publication Position, Roster Size, Seniority Percentile, active pilot count, `hypotheticalLabel`, no-result labels. When a number or label is missing, add it to the facade (see [seniority-api](../utils/seniority-api/AGENTS.md)) and render that.
- Keep domain logic in `app/utils/`. A component with a block of domain computation belongs in the engine.
- Do not sort, group, filter, or format domain data in a component or its template. Take the finished list, order, and text from a composable or the facade.
- Style with semantic tokens only (`bg-default`, `text-muted`, `bg-mark`). No raw hex and no Tailwind palette colors. See [docs/design-system.md](../../docs/design-system.md).
- Page a `UTable` with `useTableFeatures` and render `ui/TablePagination`. A table never renders every row.
- Name displayed concepts with the terms in [CONTEXT.md](../../CONTEXT.md).
- Cover visible behavior with a mounted test next to the component. Assert text a pilot can read.
