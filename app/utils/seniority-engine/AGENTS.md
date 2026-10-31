# app/utils/seniority-engine/

Pure analytics over validated `SeniorityEntry` values: snapshots, lenses, As-of Dates, scenarios, Qualification Scope, memoization, and contextual analysis. No Vue, stores, or Dexie.

- Clients reach this layer through the facade ([seniority-api](../seniority-api/AGENTS.md)). Add a capability here, then expose it there.
- Seniority Percentile is Rank measured against Roster Size ([ADR 0007](../../../docs/adr/0007-measure-percentile-against-roster-size.md)). Pick the denominator in one place per operation so Standing, trajectory, and Qualification Position reconcile.
- Use the terms in [CONTEXT.md](../../../CONTEXT.md).

## Existing code to extend

- `snapshot.ts`: `createSenioritySnapshot` validates entries and indexes them.
- `lens.ts`: `createSeniorityLens` and the anchored lens (`withAnchor`) provide Standing, trajectory, trajectory comparison, percentile crossing, Qualification Position, and relative upcoming retirements.
- **Hypothetical Placement** lives in `lens.ts`. `scopePredicateIncludingAnchor` counts an Anchor Pilot outside the Qualification Scope as a modeled member, so every scoped operation computes a result. `NoResult` means a retired Anchor Pilot only. Extend this predicate for new scoped operations.
- `qualification-scope.ts`: scope predicate, equality, and the ordered scope options (fully qualified scopes first).
- `qualification-position.ts`: Qualification Thresholds and the Anchor Pilot's position against them.
- `qual-viewer.ts`: list viewer rows, including the inserted Anchor Pilot marker.
- `demographics.ts`, `retirement-analysis.ts`, `trajectory-analysis.ts`: age, service, retirement, and crossing analysis.
- `scenario.ts`: `createSeniorityScenario` (Qualification Scope plus Growth Assumptions).
- `memoize.ts`: `memoizeLast` for per-lens caching.
