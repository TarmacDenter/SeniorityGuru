# Dashboard review remediation

Baseline: local feature/ui-improvement at 936940ab76c8bbf0c199149980fe5cdf5a9cc4d0.
Sources: review of main...feature/ui-improvement, issues #181 and #190 with #190 taking precedence, subtickets #185–#200, and latest /tmp/handoff-seniorityguru-review-190.md.

## Outcome

Resolve the nine reported findings without changing seniority calculations or expanding the dashboard redesign. Keep the current branch as the integration target. Each ticket is independently implementable and has no blocking tickets.

Approved tickets, all child issues of #190:

- #201: Restore Full list controls on phones.
- #202: Keep list selection consistent across dashboard views.
- #203: Correct table labels, retirement marks and stock styling.
- #204: Return completed analysis values through the facade.

## Ticket 1: Restore Full list controls on phones

Pilots can open the Full list at phone width, search rows, select a Qualification and use Insert yourself when eligible.
- Make compact controls reachable through an accessible control; preserve desktop behavior.
- Keep the selected list while controls open and filters change.
- Replace the disabled phone search regression check with a passing test that exercises the real route.
- Verify mounted behavior and phone-browser interactions.

## Ticket 2: Keep list selection consistent across dashboard views

Pilots select a Seniority List in the shared scenario toolbar on Current, Trajectory and Demographics.
- The toolbar uses the same selection owner as the List picker; changes update analysis and the URL.
- Historical and Demo labels stay accurate.
- Open Holdability and Junior captains links carry the selected list, including historical lists.
- Reloading the destination retains that list.
- Existing legacy redirects and anchor-free behavior continue to work.
- Verify mounted dashboard selection, composable links, and route/reload behavior.

## Ticket 3: Correct table labels, retirement marks and stock styling

Pilots can distinguish Hypothetical Placement and retirement states consistently.
- Current Status displays the complete supplied Hypothetical Placement label and scope without hover.
- A retired Anchor Pilot keeps the anchor mark and receives the retirement strikethrough and status label.
- Upcoming retirements uses stock Nuxt UI UTable, without alternating stripes.
- Preserve sorting, scope filters, debounced whole-year horizon, anchor-free behavior and readable text.
- Verify mounted readable behavior; verify retirement and anchor marks visually in both themes, at phone and desktop widths.

## Ticket 4: Return completed analysis values through the facade

Preserve visible values while restoring documented layer ownership.
- The facade provides best-year selection/caption, senior retirement count/readout, demographics count/years-of-service/count formatting and Holdability summary wording.
- The Retirement Wave renderer receives a completed year-aligned percentile series and does not group domain samples.
- Extend existing analysis and presentation operations rather than adding a parallel public API.
- Share duplicated latest-retirement/horizon calculation only where semantics match; preserve existing empty-list fallback and horizon rounding.
- Keep facade, composable and mounted public behavior covered by focused existing tests.

## Boundaries

Use semantic tokens and the native shell with print accents. Components render; composables coordinate; analysis and domain display wording stay behind the seniority facade. Do not alter unrelated pending view-length choices, landscape height, iOS upload behavior or stale ADR wording. Preserve the user's uncommitted .codex/config.toml change.

## Execution and verification

Publish four ready-for-agent child tickets of #190, with no blocking edges. Implement each in its own subagent worktree and commit there. Integrate the commits onto feature/ui-improvement. Run focused checks during development, then lint, typecheck, layering grep and the complete test suite with at most four workers after integration. Run browser checks for changed interactions and table appearance. Review fixes on separate Standards and Spec axes. Remove only worktrees and branches created for this run after integration and verification. Finish with an evidence-based debrief; do not modify or close the parent issue.

