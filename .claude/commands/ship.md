Promote dev to main by opening a squash-merge PR (replaces the old release branch workflow).

1. Run `git checkout dev && git pull origin dev` to ensure dev is up to date.
2. Run `git log --oneline $(git merge-base main dev)..dev` to list all commits going into this release.
3. Analyze the commits to summarize what's shipping and determine the semantic version bump:
   - `feat` commits → minor bump
   - `fix` / `perf` commits → patch bump
   - `feat!` or `BREAKING CHANGE` → major bump
4. Draft a PR title using Conventional Commits format (e.g., `feat: add seniority projection`).
5. Draft a PR body with:
   - **Summary**: what's in this release (2-5 bullet points)
   - **Commits**: the full commit list from step 2
6. Ask the user to confirm, then run:
   ```
   gh pr create --base main --title "<title>" --body "<body>"
   ```
7. Remind the user:
   - Use **squash merge** on GitHub
   - semantic-release will auto-tag, bump version, and publish the release
