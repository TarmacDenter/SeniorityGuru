# Git Workflow

## Strategy: GitFlow

```
main ──────────────────────────────────────────► (production, tagged releases)
  │                         ▲
  └── develop ──────────────┤──────────────────► (integration branch)
        │          ▲        │
        └── feature/* ──────┘
```

---

## Branch Types

| Branch | Purpose | Branch from | Merge to |
|---|---|---|---|
| `main` | Production code; every merge triggers a release | — | — |
| `develop` | Integration; all feature work lands here | `main` | `main` via release branch |
| `feature/*` | New features or improvements | `develop` | `develop` |
| `release/vX.Y.Z` | Release stabilization; no new features | `develop` | `main` (+ back-merge to `develop`) |
| `hotfix/*` | Emergency fixes for production | `main` | `main` (+ back-merge to `develop`) |

---

## Branch Naming

```
feature/short-description
release/v1.2.0
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
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# ... work, commit with conventional messages ...

git push origin feature/my-feature
# Open PR: feature/my-feature → develop
# Use squash merge on GitHub
```

---

## Release Workflow

```bash
# Cut a release branch from develop
git checkout develop && git pull
git checkout -b release/v1.2.0

# Stabilize — only bug fixes on this branch
git push origin release/v1.2.0
# Open PR: release/v1.2.0 → main (squash merge)
# Also open PR: release/v1.2.0 → develop to back-merge fixes
```

semantic-release runs automatically on every push to `main` and:
1. Analyzes commits since last tag
2. Bumps version in `package.json`
3. Generates/updates `CHANGELOG.md`
4. Creates a GitHub release + tag

---

## Hotfix Workflow

```bash
git checkout main && git pull
git checkout -b hotfix/fix-description

# Fix the issue
git push origin hotfix/fix-description
# Open PR: hotfix/fix-description → main (squash merge)
# Open PR: hotfix/fix-description → develop (squash merge)
```

---

## PR Rules

- All PRs use **squash merge** — one clean commit per PR on the target branch
- PR title must follow Conventional Commits format (it becomes the squash commit message)
- Link to related issue in the PR description
- CI must pass (typecheck) before merging

---

## Protected Branches

Configure on GitHub:
- `main` — require PR, require CI pass, no direct push
- `develop` — require PR, require CI pass, no direct push
