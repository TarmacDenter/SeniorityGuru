# Git Workflow

## Strategy: Linear Dev with Rebase (Solo Dev)

```
main ──────────────────────────────────────────► (production, tagged releases)
  │                         ▲
  └── dev ──────────────┤──────────────────► (integration / staging)
        │          ▲
        └── feature/* ──────┘
```

---

## Branch Types

| Branch | Purpose | Branch from | Merge to |
|---|---|---|---|
| `main` | Production code; every merge triggers a release | — | — |
| `dev` | Integration & staging; all feature work lands here | `main` | `main` (squash merge via PR) |
| `feature/*` | New features or improvements | `dev` | `dev` (rebase + fast-forward merge) |
| `hotfix/*` | Emergency fixes for production | `main` | `main` (squash merge via PR, then cherry-pick to `dev`) |

---

## Branch Naming

```
feature/short-description
hotfix/short-description
```

---

## Commit Messages — Conventional Commits

Format: `type(scope): description`

| Type | Use when |
|---|---|
| `feat` | New feature (triggers minor version bump) |
| `fix` | Bug fix (triggers patch version bump) |
| `chore` | Build, tooling, dependencies |
| `docs` | Documentation only |
| `refactor` | Code restructure, no behavior change |
| `test` | Adding or fixing tests |
| `ci` | CI/CD configuration |
| `perf` | Performance improvement |

Breaking changes: append `!` after the type (`feat!:`) or add `BREAKING CHANGE:` in the footer.

Examples:
```
feat(auth): add PKCE login flow
fix(seniority): correct rank calculation for tied hire dates
chore(deps): upgrade nuxt to 4.1.0
feat!: rename seniority_entries columns
```

---

## Feature Branch Workflow

```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# ... work, commit with conventional messages ...

# When ready to integrate:
git fetch origin dev
git rebase origin/dev
git checkout dev
git merge --ff-only feature/my-feature
git push origin dev

# Clean up
git branch -d feature/my-feature
```

For small changes, pushing directly to `dev` is fine.

---

## Promoting Dev to Main (Release)

```bash
# Optionally clean up dev history first
git checkout dev
git rebase -i $(git merge-base dev main)

# Push dev, then open a PR: dev → main (squash merge)
git push origin dev
gh pr create --base main --title "feat: <release summary>"
```

semantic-release runs automatically on every push to `main` and:
1. Analyzes the squash commit message
2. Bumps version in `package.json`
3. Generates/updates `CHANGELOG.md`
4. Creates a GitHub release + tag

---

## Hotfix Workflow

```bash
git checkout main && git pull
git checkout -b hotfix/fix-description

# Fix the issue, commit
git push origin hotfix/fix-description

# Open PR: hotfix/fix-description → main (squash merge)
# After merge, cherry-pick the fix onto dev:
git checkout dev && git pull
git cherry-pick <commit-sha>
git push origin dev
```

---

## Quality Gates

| Gate | Where | Runs |
|---|---|---|
| commitlint | Local (commit-msg hook) | Conventional Commits format |
| typecheck + tests | Local (pre-push hook) | `npm run typecheck && npm test` |
| CI (typecheck + tests) | GitHub (push to `dev`, PRs to `main`/`dev`) | Same as pre-push |
| semantic-release | GitHub (push to `main`) | Version bump + changelog + tag |

---

## Branch Protection

Configure on GitHub:
- `main` — require PR, require CI pass (typecheck + test), no direct push
- `dev` — **unprotected** (push directly, force-push allowed for history revision)
