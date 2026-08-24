# Seniority Domain API and Presentation Seam Refactor

## Problem Statement

SeniorityGuru's seniority calculations, contextual analysis, and presentation transformations currently use mixed module boundaries and mixed vocabulary. Generic public names such as `computeRank()` and `createLens()` do not identify their domain when Nuxt auto-imports them. Public types also use ambiguous terms such as `Qual`, `Cell`, `adjusted`, and `seniority` for values with different meanings.

The current API does not always distinguish a Seniority Number from a Rank. A Seniority Number is the company-assigned ordering number. A Rank is a one-based position calculated from membership in a defined pilot set. This ambiguity causes incorrect positional distances and percentile calculations when Seniority Numbers are not contiguous.

The engine also returns chart arrays and display labels beside domain results. This makes components convenient in the short term, but it hides the boundary between analysis and presentation. The snapshot contract describes immutable data while exposing mutable collection types. Employee-number validation uses normalized identity, while snapshot lookup uses raw identity.

The refactor must make the seniority API easier to understand and harder to misuse. It must preserve current user-visible behavior and calculation formulas, except for the three identified identity, positional-distance, and qualification-viewer percentile defects.

## Solution

Organize the seniority subsystem around a clear analysis flow:

`math → engine → presentation`

The math layer will contain pure calculations whose results follow only from explicit arguments. The engine will own snapshots, the As-of Date, scenarios, qualification scope, lenses, memoization, and contextual analysis. The presentation layer will transform completed domain results into labels, chart series, and component-facing structures without recalculating seniority.

Keep the existing immutable capability seam. A `SeniorityLens` will expose organization analysis only. Calling `withAnchor()` will return an `AnchoredSeniorityLens` with pilot-relative capabilities. The anchored lens will share the snapshot and organization memoization without mutating the organization lens.

The public module boundary is the barrel at `app/utils/seniority.ts`, imported as `~/utils/seniority`. It exposes `createSeniorityAnalysis`, supported result types, and supported errors. Entry invariants are enforced by the persistence write seam before data reaches Dexie. `seniority-api/analysis.ts`, the engine modules, and presentation adapters are internal implementation details. Clients must not import those modules directly or depend on the coordinator's file name.

Use one consistent seniority vocabulary across public functions, types, results, tests, and domain documentation. Use explicit dates and domain-qualified utility names. Return domain-shaped results from math and engine operations. Build chart-shaped values and display labels through presentation adapters.

## User Stories

1. As a pilot, I want Seniority Number and Rank treated as different concepts, so that displayed positions remain correct when numbers contain gaps.

2. As a pilot, I want a smaller Seniority Number to continue to mean greater company seniority, so that the refactor preserves list ordering.

3. As a pilot, I want Rank calculated from the pilots in the selected set, so that Rank represents an actual position.

4. As a pilot, I want seniority percentiles to keep their current direction, so that 100 remains the most senior end of a list.

5. As a pilot, I want company-wide standing and Qualification standing to use explicit names, so that I can understand what each value measures.

6. As a pilot, I want list values and active-pilot values identified separately, so that retired pilots do not make standing labels ambiguous.

7. As a pilot, I want rolling 12-month retirement counts named as rolling counts, so that I do not confuse them with calendar-year counts.

8. As a pilot, I want relative retirement positions to count actual pilots, so that gaps in Seniority Numbers do not inflate the distance.

9. As a pilot, I want qualification-viewer percentiles calculated from Rank, so that non-contiguous Seniority Numbers do not distort them.

10. As a pilot, I want equivalent employee-number forms to identify the same pilot, so that leading zeroes do not prevent lookup.

11. As a pilot, I want duplicate employee checks and employee lookup to use the same identity rule, so that imported data behaves consistently.

12. As a pilot, I want organization analysis without selecting an Anchor Pilot, so that company-level demographics and retirements remain available independently.

13. As a pilot, I want pilot-relative analysis only after selecting an Anchor Pilot, so that the application cannot return meaningless nullable standing results.

14. As a pilot, I want a clear failure when an Anchor Pilot does not exist, so that missing identity is not mistaken for empty analysis.

15. As a pilot, I want trajectories bounded by an explicit Projection Through Date, so that the projection horizon is visible at the call site.

16. As a pilot, I want annual trajectory samples through the requested inclusive bound, so that no sample occurs after the selected date.

17. As a pilot, I want projection assumptions separate from projection dates, so that scope and growth do not hide the analysis horizon.

18. As a pilot, I want Qualification Scope to support Base, Seat, Fleet, or any combination, so that I can analyze the relevant pilot set.

19. As a pilot, I want an empty Qualification Scope to mean company-wide, so that the default analysis remains predictable.

20. As a pilot, I want growth rates represented as decimal annual rates, so that projection assumptions have one consistent meaning.

21. As a pilot, I want qualification positions to expose current and projected percentiles, so that I can compare present standing with modeled standing.

22. As a pilot, I want each Qualification threshold to expose its Seniority Number and percentile, so that the threshold meaning is explicit.

23. As a pilot, I want Holdable identified as a modeled outcome, so that the application does not imply contractual certainty.

24. As a pilot, I want retirement projections returned as dated count buckets, so that the same analysis can support more than one chart.

25. As a pilot, I want retirement-wave classifications to preserve their existing formula, so that this refactor does not change analytical meaning.

26. As a pilot, I want demographic results to preserve current counts and distributions, so that existing insights do not change during the refactor.

27. As a pilot, I want chart labels derived from domain dates and numeric bounds, so that presentation choices do not alter the analysis.

28. As a pilot, I want current application defaults selected outside the engine, so that each engine call still receives its effective date explicitly.

29. As a user of the Qualification viewer, I want Company Rank, Qualification Rank, Seniority Number, and percentile fields named distinctly, so that each column has one meaning.

30. As a user of the Qualification viewer, I want inserted markers to use the same identity and Rank rules as real rows, so that comparison results remain accurate.

31. As a developer, I want a documented seniority vocabulary, so that code, tests, and product discussions use the same terms.

32. As a developer, I want `Qualification` to mean one Base, Seat, and Fleet combination, so that public APIs do not expose ambiguous `Qual` or `Cell` terms.

33. As a developer, I want `QualificationScope` to mean an optional constraint over Base, Seat, and Fleet, so that a scope is not confused with a populated Qualification.

34. As a developer, I want public utility names to include the seniority domain, so that Nuxt auto-import call sites remain understandable.

35. As a developer, I want pure math to accept explicit values and options, so that I can test it without lenses, Vue, stores, or application defaults.

36. As a developer, I want the engine to compose math and own analysis context, so that As-of Date, scope, and memoization rules stay consistent.

37. As a developer, I want presentation adapters to consume completed domain results, so that UI code does not duplicate seniority calculations.

38. As a developer, I want trajectory results to contain points and changes without chart arrays, so that the domain model is independent of Chart.js.

39. As a developer, I want retirement results to contain dated buckets and counts without formatted labels, so that multiple views can reuse them.

40. As a developer, I want demographic buckets to contain numeric bounds and counts, so that display labels remain a presentation concern.

41. As a developer, I want Qualification values to omit a display label, so that the core type contains only Base, Seat, and Fleet.

42. As a developer, I want snapshot collections exposed through readonly TypeScript types, so that callers receive a compile-time non-mutating contract.

43. As a developer, I want snapshot documentation to avoid runtime-freezing claims, so that the documented guarantee matches the implementation.

44. As a developer, I want `withAnchor()` to preserve the organization lens and shared memoization, so that deriving a pilot lens remains cheap and predictable.

45. As a developer, I want each anchored lens to own pilot-specific memoization, so that relative results do not leak between anchors.

46. As a developer, I want one public seniority API barrel, so that explicit imports have one supported entry point without duplicate public vocabularies.

47. As a developer, I want internal helpers omitted from the public barrel, so that Nuxt does not generate generic or conflicting auto-import names.

48. As a developer, I want validated `SeniorityEntry` values to remain the engine input, so that the refactor does not duplicate upload-boundary validation.

49. As a developer, I want `Temporal.PlainDate` to remain the application date boundary, so that the refactor does not introduce another date model.

50. As a maintainer, I want old public aliases removed after migration, so that the codebase has one vocabulary for each concept.

51. As a maintainer, I want existing formula tests retained, so that moving responsibilities does not silently change analytics.

52. As a maintainer, I want non-contiguous Seniority Numbers in regression fixtures, so that future code cannot confuse numeric difference with positional distance.

53. As a maintainer, I want presentation adapters tested without repeating engine calculations, so that each test suite has a clear responsibility.

54. As a maintainer, I want the final module layout to follow real responsibilities instead of a prescribed file count, so that the refactor does not create shallow placeholder modules.

## Implementation Decisions

- Extend the repository's existing single-context domain documentation with Seniority Analysis terms. Do not create a second context document.

- Define these terms consistently: Seniority List, Seniority Entry, Seniority Number, Rank, Qualification, Qualification Scope, Anchor Pilot, Seniority Percentile, Standing, As-of Date, Projection Through Date, Scenario, Growth Assumptions, Qualification Threshold, Holdable, and Retirement Wave.

- A Seniority Number is the company-assigned ordering number. Smaller numbers are more senior. It is not a positional distance.

- A Rank is a one-based position within a defined set of pilots. Calculate Rank from collection membership.

- A Qualification is one Base, Seat, and Fleet combination. A Qualification Scope constrains any subset of those dimensions. An empty scope means company-wide.

- A Seniority Percentile remains inverted. A value of 100 is most senior, and a value of 0 is most junior.

- The As-of Date determines current state, including active status, age, Rank, and years of service.

- Every bounded calculation will receive an explicit `through` argument. Scenario will not supply a default projection horizon.

- Treat `through` as an inclusive upper bound. Annual sampling starts at the As-of Date and advances by whole years. Include samples that fall on or before `through`. Do not append an extra partial-year sample when `through` falls between anniversaries.

- Application composables may choose effective projection defaults. They must pass the resolved `through` value to the engine.

- The analysis and result flow is math, then engine, then presentation. Engine code may depend on math. Presentation code may consume engine or math result types. Math must not depend on engine or presentation. Engine must not depend on presentation.

- Math will contain deterministic seniority calculations. It will not depend on lenses, Vue, Pinia, stores, Dexie, composables, application defaults, chart formatting, or display labels.

- The engine will own snapshots, lenses, As-of Date, Anchor Pilot, Scenario, Qualification Scope, memoization, organization analysis, and pilot-relative analysis.

- Presentation will create chart series, formatted dates, numeric labels, qualification labels, and component-facing display structures from completed domain results. It must not calculate Rank, percentile, retirement counts, growth, holdability, or relative position.

- Use the smallest coherent modules within the math, engine, and presentation boundaries. Do not create files only to mirror a target tree.

- Keep `withAnchor()` as the capability seam. Do not introduce a mutable lens or builder.

- `SeniorityLens` will expose organization-only operations inside the engine. It will not be a client-facing import and will not expose the Anchor Pilot, standing, trajectory, trajectory comparison, percentile crossing, or qualification positions.

- `AnchoredSeniorityLens` will add pilot-relative operations and retain organization operations inside the engine. The public barrel exposes the corresponding `SeniorityAnalysis` and `AnchoredSeniorityAnalysis` capabilities without exposing lens construction.

- Calling `withAnchor()` will not mutate the organization lens. The anchored lens will share the same snapshot, As-of Date, and organization-level memoized results. Each anchored lens may memoize pilot-relative results independently.

- Preserve `AnchorNotFoundError` for missing employee lookup.

- Normalize employee numbers with the existing canonical normalization rule during duplicate validation, snapshot indexing, `withAnchor()` lookup, and engine identity lookup. Equivalent numeric identifiers with leading zeroes will resolve to the same identity.

- Preserve validated `SeniorityEntry` as the downstream data type. Preserve its snake_case fields. Do not introduce a parallel camelCase Anchor Pilot data transfer type in this refactor.

- Preserve `Temporal.PlainDate` for domain dates. Use `asOfDate`, `from`, `through`, `hireDate`, and `retirementDate` for their respective semantics.

- Expose snapshot entries, sorted entries, Qualification groups, employee lookup, dimension values, and Qualifications through readonly TypeScript collection types. Rename ambiguous snapshot members to domain terms such as entries by seniority, entries by Qualification, bases, seats, fleets, and Qualifications.

- The readonly snapshot contract is compile-time only. Do not claim runtime freezing, deep cloning, or deep runtime immutability.

- Use domain nouns instead of generic `Result` and rendered `Row` suffixes where a domain concept exists. Use `EntryPredicate`, `QualificationScope`, `Qualification`, `SeniorityStanding`, `QualificationStanding`, `SeniorityTrajectory`, `SeniorityTrajectoryPoint`, `TrajectoryChange`, `SeniorityTrajectoryComparison`, `RetirementCountProjection`, `PercentileCrossingResult`, `QualificationDistribution`, `QualificationPosition`, `QualificationComposition`, `CaptainQualificationThreshold`, `YearsOfServiceDistribution`, `YearsOfServiceBucket`, `RetirementYearAnalysis`, `UpcomingRetirement`, and `RelativeUpcomingRetirement`.

- Rename vague standing fields to distinguish list and active values. Use list Rank, active Rank, list pilot count, active pilot count, list percentile, active percentile, retired pilots senior to the anchor, rolling next-12-month retirements, and Qualification standing.

- Rename the organization retirement method and related standing fields from “this year” to “next 12 months.” Preserve the existing rolling-window calculation.

- Represent each Qualification Standing with a Qualification value, list and active Rank, list and active pilot counts, list and active percentiles, and whether it is the anchor's current Qualification.

- Use domain-qualified public utility names. Constructors and calculation names will identify seniority or the specific seniority concept at the call site. Avoid generic public names such as `computeRank`, `computePercentile`, `createSnapshot`, `createLens`, `createScenario`, `formatNumber`, and `formatLabel`.

- Prefer option objects for public methods that accept more than one independent concept. Pure helper parameters will not use `user` when they mean a general subject pilot.

- Seniority trajectory math will own annual date generation. Callers will provide entries, Seniority Number, `from`, `through`, an optional predicate, and Growth Assumptions rather than prebuilding time points.

- Trajectory changes will expose percentile-point change. Presentation may identify chart-highlight peaks. Peak highlighting is not domain analysis.

- A Seniority Trajectory will return readonly dated Rank and percentile points plus readonly trajectory changes. It will not return `chartData`, `labels`, or `data`.

- Trajectory comparison within one Seniority List will return dated domain points with baseline and comparison percentiles. It will not return parallel chart arrays or use `current` when the value means baseline. This scenario comparison remains distinct from out-of-scope list-to-list analytics.

- A percentile crossing will expose a numeric crossing year. Do not retain a generic threshold result type.

- A Retirement Count Projection will return readonly buckets. Each bucket will contain its inclusive `through` date and retirement count. The projection will also contain the scoped pilot count. It will not contain formatted labels or chart arrays.

- Demographic domain results will expose numeric ranges and counts. Age buckets will use minimum age, optional maximum age, and pilot count. Years-of-service buckets will use minimum years, optional maximum years, and pilot count. Presentation will create the current range labels.

- A Qualification value will contain Base, Seat, and Fleet only. Presentation will format its label.

- A Qualification Distribution will expose its Qualification, active pilot count, threshold percentile, threshold Seniority Number, percentile quartiles, maximum percentile, and readonly percentile-density buckets. Density buckets will expose minimum percentile, maximum percentile, and pilot count.

- A Qualification Position will expose its Qualification Distribution, current percentile, projected percentile, and modeled Holdable state. Replace the staged public “snapshot then apply projection” seam with one anchored engine operation that receives explicit `through` and assumptions.

- Scenario will contain Qualification Scope and Growth Assumptions only. Remove every projection date or projection horizon from Scenario.

- Growth Assumptions will use an explicit annual growth-rate field. Remove unused Qualification-specific growth overrides from the new public contract. Do not add behavior for those overrides in this refactor.

- Keep Qualification viewer analysis in the engine because it calculates ordering, active Rank, Qualification Rank, percentiles, and marker insertion. Move only formatting and component adaptation to presentation.

- Replace public `Qual` terms in the Qualification viewer with `Qualification`. Rename positional fields to Company Rank and Qualification Rank. Keep Seniority Number fields explicit. Remove or rename duplicate fields so no field called `seniority` contains a Rank.

- Calculate Qualification viewer list percentiles from positional Rank within the relevant list, not from Seniority Number. Apply the same rule to inserted markers.

- Correct relative retirement position by subtracting the two calculated company-list Ranks. Expose the signed value as positions senior to the anchor. A positive value means the listed pilot is senior to the anchor, zero means the anchor, and a negative value means the listed pilot is junior. Do not subtract Seniority Numbers and call the result Rank.

- Correct employee-number indexing and lookup normalization. Correct Qualification viewer percentile calculations. Preserve every other existing calculation formula and selection rule, including percentile direction, growth, retirement-wave classification, trajectory, retirement counts, qualification thresholds, and demographics.

- Keep `app/utils/seniority.ts` as the one public seniority API barrel for supported explicit imports. Clients import from `~/utils/seniority`. Do not add per-directory barrels, expose `seniority-api/analysis.ts`, or expose internal helpers solely for convenience.

- Remove old public aliases after consumers migrate. Do not retain compatibility shims that leave two public vocabularies for one concept.

- Verify that exported utility names do not collide in Nuxt's generated auto-import declarations.

## Testing Decisions

- Treat tests as behavior contracts. Assert public inputs, outputs, capabilities, errors, and identity. Do not assert private class names, internal helper calls, file placement, or cache implementation details.

- Use the existing lens contract as the primary test seam. It is the highest existing seam that covers snapshot context, As-of Date, organization analysis, pilot-relative analysis, and memoization.

- Keep focused lower-level calculation tests when the lens seam cannot isolate an important formula or boundary case.

- Keep focused presentation-adapter tests because presentation output is intentionally absent from the lens contract.

- Extend lens contract tests to verify that the organization lens lacks anchored methods, the anchored lens adds anchored methods, and organization methods remain available on the anchored lens.

- Verify that `withAnchor()` leaves the organization lens unchanged, shares its exact snapshot, reuses organization memoization, and keeps pilot-relative memoization separate by anchor.

- Verify that a missing employee throws `AnchorNotFoundError`.

- Verify canonical employee lookup with raw and normalized forms, including equivalent numeric employee numbers with leading zeroes.

- Verify snapshot Seniority ordering, Qualification indexing, dimension values, duplicate validation, and employee indexing through public behavior.

- Add compile-time assertions for readonly snapshot entries, arrays, and maps. Do not add runtime-freezing assertions.

- Use explicit As-of Dates and Projection Through Dates in every calculation test. Avoid clock-dependent assertions.

- Verify annual date generation when `through` equals an anniversary, falls between anniversaries, precedes the As-of Date, and spans multiple years. Confirm that only annual samples on or before `through` appear.

- Use non-contiguous Seniority Numbers such as 100, 105, 110, and 125 in Rank and relative-position tests.

- Verify list Rank, active Rank, list and active pilot counts, list and active percentiles, retired pilots senior to the anchor, rolling 12-month retirements, and Qualification standing.

- Verify trajectories across As-of Date, explicit `through`, Qualification Scope, Growth Assumptions, Rank, percentile, changes, and memoization.

- Verify retirement projections as domain buckets with explicit dates, counts, scoped pilot count, and Qualification Scope. Assert that engine results contain no chart labels or chart arrays.

- Verify Qualification distributions, thresholds, current percentile, projected percentile, density, and Holdable state through the anchored lens.

- Add Qualification viewer tests where Seniority Numbers are non-contiguous. Verify list, company, and Qualification percentiles from positional Rank for real rows and inserted markers.

- Verify upcoming retirement filtering, inclusive `through`, Qualification Scope, optional senior-only behavior, and positional distance based on actual pilots.

- Verify age distribution, unknown-age counts, years-of-service distribution, years-of-service buckets, Qualification composition, and Captain Qualification thresholds.

- Verify annual retirement counts, Retirement Wave classification, and Qualification Scope without changing the current classification formula.

- Test presentation adapters independently. Map Seniority Trajectories, Retirement Count Projections, demographic buckets, and Qualifications into expected labels and chart series.

- Presentation tests will use constructed domain results. They will not recompute or duplicate seniority formulas.

- Use the existing lens, snapshot, seniority math, Qualification viewer, qualification-position, retirement-analysis, demographics, composable, and component tests as prior art and regression coverage.

- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` after implementation.

- Regenerate or prepare Nuxt auto-import declarations after utility moves. Inspect the generated declarations and fail verification if seniority exports create duplicate or ambiguous auto-import names.

## Out of Scope

- UI redesign or new user-facing analytics.

- Changes to the percentile formula, growth formula, retirement-wave classification formula, retirement formulas, trajectory formulas, demographic formulas, or qualification-threshold formulas beyond the three named defect corrections.

- Qualification-specific growth override behavior. The unused override shape will leave the public contract.

- List-to-list comparison analytics. Existing list-comparison code and its current field semantics are not part of this refactor.

- Import pipeline changes, validation-schema redesign, or a repository-wide snake_case-to-camelCase migration.

- IndexedDB schema changes, persistence changes, stores, Dexie, authentication, accounts, or server behavior.

- Replacing `Temporal.PlainDate` or performing a broader date migration.

- Runtime freezing, deep cloning, or proxy-based immutability for snapshots.

- A mutable lens, builder pattern, nullable pilot-relative methods on the organization lens, or speculative abstraction layers.

- Performance changes that do not support the existing shared lens memoization contract.

- Creating placeholder modules or duplicate barrels solely to match a proposed directory tree.

- Publishing this work spec as a GitHub issue or applying the `ready-for-agent` label.

## Further Notes

- Implement the refactor in dependency order: establish vocabulary, separate math and engine responsibilities, rename domain types and results, update lens contracts, add presentation adapters, migrate consumers, then remove obsolete aliases.

- Keep each migration step behavior-preserving and independently verifiable where practical.

- The three intentional corrections are normalized employee identity, positional-distance counting, and Qualification viewer percentile calculation. Treat any other changed result as a regression unless this specification explicitly requires it.

- Preserve existing UI labels where they express product language. Map renamed domain fields through presentation or component adapters rather than forcing a UI redesign.

- The implementation is complete when a developer can identify math, contextual engine analysis, and presentation transformation from a utility's location, name, signature, and result type without reading its implementation.

- This document is a local work spec. It must remain in the repository and must not be published to the issue tracker as part of spec creation.
