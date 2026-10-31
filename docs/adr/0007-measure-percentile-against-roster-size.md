# Measure Seniority Percentile against Roster Size

Seniority Percentile is a pilot's dynamic Rank measured against the Roster Size: the pilots in the publication within the scope, retired pilots included. Rank still drops as senior pilots retire, but the count stays fixed unless Growth Assumptions apply. Standing and trajectory year zero use the same scale for any scope, so year-zero projection equals Standing. Qualification Position and Qualification Thresholds are company-wide, so they share that scale only for the company-wide scope.

## Considered Options

- **Active survivors:** retired pilots leave both Rank and the count. Rejected because the percentile then moves with junior retirements and cannot be reproduced from the published list. It also implies a population the user cannot see.
- **Replacement hiring:** every retiree is replaced to hold the count constant. Rejected because it adds an unrequested hiring rule and requires a placement policy. Growth stays an explicit assumption.
- **Active count as denominator (previous Standing behavior):** rejected because it disagreed with trajectory and Qualification Position, producing a different percentile for the same pilot on the same date.

## Consequences

- Standing's percentile changes for any list that contains retired pilots.
- The static retired-inclusive ordinal remains visible as Publication Position, so the original list order is not lost.
- Active pilot count is still disclosed beside Roster Size, but it is never a percentile denominator.
- An Anchor Pilot outside the Qualification Scope receives a Hypothetical Placement instead of a no-result. The Anchor Pilot counts as a modeled pilot of that scope (as New Hire Mode's simulated pilot does), so Roster Size is the scope plus one and Rank never exceeds it. Standing and trajectory year zero still agree for that scope. Only a retired Anchor Pilot has no result.
- Qualification Position's current percentile equals Standing only for the company-wide scope. It takes no Qualification Scope, so a scoped percentile is never compared with company-wide Qualification Thresholds.
