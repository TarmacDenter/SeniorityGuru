Draft a pull request for the current branch following the project conventions.

1. Run `git branch --show-current` to identify the current branch.
2. Run `git log --oneline origin/dev..HEAD` (or `origin/main..HEAD` for hotfix/*) to see commits in this branch.
3. Determine the target branch:
   - `feature/*` → target: `dev`
   - `hotfix/*` → target: `main` (and note a second PR to `dev` is needed)
   - `release/*` → target: `main` (and note a second PR to `dev` is needed)
4. Infer the PR title from the commits using Conventional Commits format. The squash commit message will be the PR title.
5. Draft a PR body with:
   - **Summary**: what this PR does in 2-3 bullet points
   - **Test plan**: what to verify
6. Ask the user to confirm the title and body, then run:
   ```
   gh pr create --title "<title>" --body "<body>" --base <target>
   ```
7. If this is a hotfix or release branch, remind the user to also open a PR targeting `dev`.
