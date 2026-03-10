Draft a pull request for the current branch following the project conventions.

1. Run `git branch --show-current` to identify the current branch.
2. Determine the target branch and merge strategy:
   - `feature/*` → target: `dev` (rebase + fast-forward preferred, or squash merge via PR)
   - `hotfix/*` → target: `main` (squash merge via PR; remind to cherry-pick fix to `dev` after)
   - `dev` → target: `main` (squash merge via PR; this is a release)
3. Run `git log --oneline origin/<target>..HEAD` to see commits in this branch.
4. Infer the PR title from the commits using Conventional Commits format.
5. Draft a PR body with:
   - **Summary**: what this PR does in 2-3 bullet points
   - **Test plan**: what to verify
6. Ask the user to confirm the title and body, then run:
   ```
   gh pr create --title "<title>" --body "<body>" --base <target>
   ```
7. If this is a hotfix, remind the user to cherry-pick the fix onto `dev` after merge.
