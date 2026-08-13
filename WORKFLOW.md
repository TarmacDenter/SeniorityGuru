# Git Workflow

## Strategy: Trunk-Based Development

`main` is the production trunk. Keep branches short-lived, integrate them through reviewed pull requests, and squash merge them back into `main`.

```
main ─────────────────────────────────────────► production
  ├── feature/short-description ─────── PR → main
  └── hotfix/short-description ──────── PR → main
```

## Branches

| Branch | Purpose | Start from | Merge into |
|---|---|---|---|
| `main` | Production trunk | — | — |
| `feature/*` | A focused feature or improvement | `main` | `main` |
| `hotfix/*` | An urgent production fix | `main` | `main` |

Do not commit directly to `main`.

## Create a Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/short-description
```

Use `hotfix/short-description` for an urgent production fix.

## Before Opening a Pull Request

Run the quality gates:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

GitHub Actions runs type checking and tests for feature and hotfix branches, and for pull requests targeting `main`.

## Open and Merge a Pull Request

Use a Conventional Commit title:

```bash
gh pr create --base main --head feature/short-description --title "feat(scope): summary"
```

Require review and passing checks. Squash merge the pull request into `main`.

## Commit Messages

Use `type(scope): description`.

| Type | Use when |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling or dependencies |
| `docs` | Documentation only |
| `refactor` | Internal restructuring with no behavior change |
| `test` | Adding or correcting tests |
| `ci` | Continuous-integration configuration |
| `perf` | Performance improvement |

Use `!` after the type or a `BREAKING CHANGE:` footer for a breaking change.
