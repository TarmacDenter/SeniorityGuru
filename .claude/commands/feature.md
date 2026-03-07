Start a new feature branch following the project GitFlow workflow.

1. Run `git status` to confirm the working tree is clean.
2. Run `git checkout dev && git pull origin dev` to ensure dev is up to date.
3. Ask the user: "What is this feature? (used for branch name)"
4. Create a branch named `feature/<short-description>` using kebab-case, no ticket numbers.
5. Run `git checkout -b feature/<short-description>`.
6. Confirm the branch was created and remind the user:
   - Commits must follow Conventional Commits: `feat(scope): description`
   - PR target is `dev`, merged via squash merge
   - PR title must follow the same format as the commit message
