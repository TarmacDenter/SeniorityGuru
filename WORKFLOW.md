# Git Workflow

## Strategy: Trunk-Based Development

```
main ──────────────────────────────────────────► (production, tagged releases)
  ├── feature/foo ──────────────────────── PR → main (squash merge)
  ├── feature/bar ──────────────────────── PR → main (squash merge)
  └── hotfix/baz  ──────────────────────── PR → main (squash merge)
```

---

## Branch Types

| Branch | Purpose | Branch from | Merge to |
|---|---|---|---|
| `main` | Production code; every merge triggers a release | — | — |
| `feature/*` | New features or improvements | `main` | `main` (squash merge via PR) |
| `hotfix/*` | Emergency fixes for production | `main` | `main` (squash merge via PR) |

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

---

## Feature Branch Workflow

```bash
git checkout main && git pull origin main
git checkout -b feature/my-feature

# ... work, commit as many granular commits as you like ...

# When ready to ship — open a PR:
gh pr create --base main --head feature/my-feature --title "feat(scope): summary"
# Use Squash and merge on GitHub
```

For parallel agent work, use worktrees so each agent has an isolated checkout:

```bash
git worktree add .worktrees/my-feature -b feature/my-feature
# Launch a Claude session in .worktrees/my-feature/
# .claude/ is symlinked automatically — all permissions and settings inherited
```

---

## Hotfix Workflow

```bash
git checkout main && git pull
git checkout -b hotfix/fix-description

# Fix the issue, commit
gh pr create --base main --head hotfix/fix-description --title "fix(scope): description"
# Use Squash and merge on GitHub
```

---

## Releasing (Promoting to Main)

Use the `/ship` Claude slash command from the feature branch, or open the PR manually.

**Always squash merge** the PR on GitHub (never regular merge or rebase merge).

semantic-release runs automatically on every push to `main` and:
1. Analyzes the squash commit message
2. Bumps version in `package.json`
3. Generates/updates `CHANGELOG.md`
4. Creates a GitHub release + tag

---

## Quality Gates

| Gate | Where | Runs |
|---|---|---|
| commitlint | Local (commit-msg hook) | Conventional Commits format |
| typecheck + tests | Local (pre-push hook) | `npm run typecheck && npm test` |
| CI (typecheck + tests) | GitHub (push to `feature/*`, `hotfix/*`, PRs to `main`) | Same as pre-push |
| semantic-release | GitHub (push to `main`) | Version bump + changelog + tag |

---

## Branch Protection

### `main`
Require PR, CI must pass, squash merge only, no direct push.

---

## Worktree Agent Pattern

Each parallel Claude agent gets its own isolated worktree:

```bash
git worktree add .worktrees/feature-foo -b feature/foo
```

The `WorktreeCreate` hook automatically symlinks `.claude/` into the worktree, so all agents share the same permissions, MCP servers, and slash commands without any extra setup.

```
.worktrees/
  feature-foo/        ← full git checkout on feature/foo
    .claude -> ../../.claude   ← symlinked, not copied
  feature-bar/        ← full git checkout on feature/bar
    .claude -> ../../.claude
```

Clean up after merging:

```bash
git worktree remove .worktrees/feature-foo
git branch -d feature/foo
```
