Start an emergency hotfix branch from main following the project GitFlow workflow.

1. Run `git status` to confirm the working tree is clean.
2. Run `git checkout main && git pull origin main` to ensure main is up to date.
3. Ask the user: "What is the hotfix? (used for branch name and commit message)"
4. Create a branch named `hotfix/<short-description>` using kebab-case.
5. Run `git checkout -b hotfix/<short-description>`.
6. Confirm the branch was created and remind the user:
   - This branch must merge to **both** `main` and `dev`
   - Commit format: `fix(scope): description`
   - Open two PRs after the fix: one targeting `main`, one targeting `dev`
   - semantic-release will auto-tag and release when `main` is merged
