# app/utils/seniority-api/

The facade's coordinator. Its public face is the barrel `~/utils/seniority` (`app/utils/seniority.ts`); this module is an implementation detail behind it.

- `createSeniorityAnalysis` binds entries and an As-of Date, hides engine construction, and returns completed `{ domain, presentation }` outputs. Pass the real publication as `entries` and a New Hire Mode pilot as `modeledEntry`: Roster Size counts the modeled pilot, and Standing's `publicationPilotCount` (real pilots in the scope) does not.
- `qualificationPositions` is company-wide and takes no Qualification Scope, so the percentile and the Qualification Thresholds share one scale.
- Add an analysis operation here, then export its types and functions through `app/utils/seniority.ts`. Clients import only the barrel.
- Pass the Qualification Scope into presenters so presented values carry their labels (`hypotheticalLabel`, `endedByLabel`, `rosterSizeLabel`).
- Test operations through the public analysis object: extend `seniority.test.ts` and the feature tests beside it (`seniority.hypothetical-placement.test.ts`, `seniority.no-result.test.ts`).
- Read [seniority-engine/AGENTS.md](../seniority-engine/AGENTS.md) and [seniority-analysis/AGENTS.md](../seniority-analysis/AGENTS.md) for the layers it wraps.
