# The retirement date, not the publication, decides retired status

A pilot is retired on and after their retirement date: `isRetiredBy(retire_date, asOfDate)`, that is `retire_date ≤ As-of Date`. This holds even when the publication still prints them. A pilot whose retirement date falls before the list's effective date is retired for every As-of Date on or after that date.

Retirement windows ("upcoming", "next 12 months", retirement-count buckets) are exclusive at the start and inclusive at the end: `from < retire_date ≤ through`. At the same date, "retired" and "upcoming" never overlap, and together they account for every pilot with a retirement date.

## Considered Options

- **Trust the publication:** a printed pilot is active on the effective date, and retirements count only after it. Rejected because the retirement age is a hard limit. A printed row past its retirement date is publication lag or a stale row, not an active pilot. Trusting it would overstate Rank today for every junior pilot.
- **Flag such rows at import and let the user choose per list:** deferred. It adds a per-list setting for a case the retirement date already answers. If imported retirement dates prove unreliable, revisit this at the import boundary ([import-plugins.md](../import-plugins.md)), not in the analysis.

## Consequences

- Pilots retired before publication reduce Rank and appear in "Retired ahead of you" ([ADR 0012](0012-every-count-traces-to-its-pilots.md)). They stay in Roster Size ([ADR 0007](0007-measure-percentile-against-roster-size.md)).
- The interface does not separate "retired before publication" from "retired since". A pilot needs the count and the pilots behind it, not their publication timing.
- Every retired-status or window check calls `isRetiredBy` or `retiresWithinNextYear` from `~/utils/date`. Inline date comparisons for retirement are not allowed, so the boundary cannot drift between modules.
