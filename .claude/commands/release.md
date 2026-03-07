Prepare a release branch from dev following the project GitFlow workflow.

1. Run `git status` to confirm the working tree is clean.
2. Run `git checkout dev && git pull origin dev`.
3. Run `git log --oneline $(git describe --tags --abbrev=0 HEAD)..HEAD` (or `git log --oneline main..dev` if no tags exist) to summarize commits going into this release.
4. Analyze the commits to determine the next version following semver:
   - `feat` commits → minor bump
   - `fix` / `perf` commits → patch bump
   - `feat!` or `BREAKING CHANGE` → major bump
5. Propose the version (e.g., `v1.2.0`) and ask the user to confirm.
6. Create the release branch: `git checkout -b release/v<version>`.
7. Push: `git push origin release/v<version>`.
8. Remind the user:
   - Only bug fixes go on this branch — no new features
   - Open a PR: `release/v<version>` → `main` (squash merge)
   - Open a PR: `release/v<version>` → `dev` (squash merge, to back-merge any fixes)
   - semantic-release will automatically tag and publish the release when `main` is merged
