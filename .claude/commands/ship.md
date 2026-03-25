Promote the current feature branch to main via a squash-merge PR.

1. Run `git branch --show-current` to get the current branch name. If on `main`, abort and tell the user to run this from a feature branch.
2. Run `git log --oneline $(git merge-base main HEAD)..HEAD` to list all commits going into this release.
3. Analyze the commits to summarize what's shipping.
4. Draft a PR title using Conventional Commits format (e.g., `feat: add seniority projection`).
5. Draft a PR body with:
   - **Summary**: what's in this release (2-5 bullet points)
   - **Commits**: the full commit list from step 2
6. Ask the user to confirm, then run:
   ```
   gh pr create --base main --head <current-branch> --title "<title>" --body "<body>"
   ```
7. Remind the user:
   - Use **Squash and merge** on GitHub (not regular merge, not rebase)
