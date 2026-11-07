# Every pilot count traces to the pilots it counts

Every count of pilots shown to a user is the length of a list the engine can return and the user can open. Examples: retired ahead, retirements in a window, senior retirements. The count is derived from the list: `countRetiredPilotsSeniorTo` is `retiredPilotsSeniorTo(...).length`. It is never a second filter that happens to look the same. The count and the list use the same population, As-of Date ([ADR 0010](0010-one-as-of-date-for-the-dashboard.md)), retirement boundary ([ADR 0011](0011-retirement-date-decides-retired-status.md)), and scope predicate (`scopePredicateIncludingAnchor` for anchored, scoped operations). Where the interface shows a count, it links to that list. For example, "N retired ahead" under Rank today opens List › Upcoming retirements › Retired ahead of you.

## Considered Options

- **Independent count functions (previous behavior):** Standing counted retired senior pilots with one filter; Upcoming retirements listed pilots with another, from another date. Rejected because the two drifted silently, and nothing showed the user which pilots made up the number.
- **Show only counts, with an explanation:** rejected because a number a pilot cannot check undermines trust in every other figure.

## Consequences

- A new count is added as an engine list first, with a test asserting `count === list.length` for the same inputs. See `math.test.ts` and `lens.test.ts` (`retiredPilotsSeniorToAnchor`).
- The facade returns the list as `domain` and its heading as `presentation`. Composables do not format counts themselves.
- Existing counts still computed by separate filters are to be brought under this rule when next changed:
  - `retirementsNext12Months`
  - Standing's `rollingNext12MonthRetirements` and `rollingNext12MonthRetirementsSeniorToAnchor`

  The senior count currently matches Upcoming retirements with a one-year horizon and "Senior to me only" by construction, not by shared code.
- Trajectory's `seniorRetirementCount` already uses `relativeUpcomingRetirements` and complies.
