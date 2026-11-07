# Measure the distance between pilots in Rank

The distance between two pilots is the difference in their dynamic Rank at the As-of Date. Senior pilots retired by then are not counted between them, following the anchored lens's `dynamicRank`. Seniority Number gaps and Publication Position gaps are never used as distance ([CONTEXT.md](../../CONTEXT.md), Seniority Number and Rank).

The interface shows the distance from the Anchor Pilot as **Positions ahead of you**:
- unsigned for a senior pilot ("1,943")
- "N behind" for a junior pilot
- "you" for the Anchor Pilot

`formatPositionsAheadLabel` in `presentation.ts` builds the wording, and the facade returns it.

## Considered Options

- **Signed Rank difference (`+1943`, `-389`, previous behavior):** rejected because a plus sign beside a senior pilot read as a rank gain, and the column header "Rank relative to me" did not say which direction was senior.
- **Seniority Number difference:** rejected because numbers have gaps and do not measure positions.
- **Publication Position difference:** rejected because it counts pilots who have already retired.

## Consequences

- A retired pilot has no position. "Retired ahead of you" rows show no distance column.
- Any new pilot-to-pilot comparison reuses the lens's `dynamicRank` and the presentation label rather than computing its own offset.
