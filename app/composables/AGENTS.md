# app/composables/

Composables coordinate. They call stores and the seniority analysis facade and expose reactive values to components.

- A composable coordinates actions that span stores. Stores stay independent of each other.
- Persistence validation lives in the store. Call the store and surface its result.
- Import seniority analysis only from `~/utils/seniority` ([seniority-api](../utils/seniority-api/AGENTS.md)). Build analysis through `createSeniorityAnalysis`; the engine, presentation adapters, snapshots, lenses, and scenarios stay behind it.
- Take every rank, percentile, count, and label from the facade's `domain` and `presentation` values. When a value is missing, add it to the engine and expose it through the facade.
- A figure that needs a Rank or Roster Size is `null` when the Anchor Pilot has none (retired); components render a placeholder. Never zero-fill.
- Text a composable assembles for display (trend lines, captions) is presentation. Build it in `seniority-analysis/presentation.ts` and return it from the facade.
- Cover behavior with a test through the composable's public return value.

## Existing code to extend

- `seniority/modules/useSeniorityCore.ts` builds the analysis the other seniority composables read, including New Hire Mode's synthetic entry. Start there.
- `seniority/modules/useStanding.ts` and `useTrajectory.ts` shape Standing and trajectory results for the dashboard. Add dashboard-facing fields to these.
- `seniority/upload/` is the upload flow; read [docs/import-plugins.md](../../docs/import-plugins.md) first.
- `useScopeFilter.ts` maps Qualification Scope options to labels.
