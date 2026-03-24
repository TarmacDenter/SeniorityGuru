# Git Workflow

## Strategy: Squash-at-Every-Boundary (Solo Dev)

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
| `feature/*` | New features or improvements | `dev` | `dev` (squash merge) |
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

# ... work, commit as many granular commits as you like ...

# When ready to integrate — squash merge into dev:
git checkout dev
git pull origin dev
git merge --squash feature/my-feature
git commit -m "feat(scope): summary of the feature"
git push origin dev

# Clean up
git branch -D feature/my-feature
```

**Why squash merge (not rebase + fast-forward)?** After `/ship`, `sync-dev.yml` resets `origin/dev` to `main`. If dev has 20 individual commits but main has one squash, the histories diverge and local dev becomes incompatible with origin/dev. Squashing features into dev keeps both sides at the same granularity — one commit per feature — so the post-ship reset produces compatible history.

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

Use the `/ship` Claude slash command to automate steps 2-4.

**Always squash merge** the PR on GitHub (never regular merge or rebase merge).

### After merge — automatic realignment

Squash merge creates a new commit on `main` not in `dev`'s history. `sync-dev.yml` handles realignment automatically:

1. CI passes on `main`
2. `sync-dev.yml` fires and force-resets `origin/dev` to `main`
3. Locally, run `git pull origin dev` (or `git reset --hard origin/dev` if local dev has stale branches)

Because features are squash-merged into dev (one commit per feature), the post-ship reset produces compatible history — no orphaned commits, no divergence.

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
| Database migrations | GitHub (`migrations.yml`, gated on CI passing) | `supabase db push` to dev or prod |
| semantic-release | GitHub (push to `main`) | Version bump + changelog + tag |

---

## Branch Protection

Both branches are protected via GitHub Rulesets (Settings → Rules → Rulesets).

### `main`
Standard protection — require PR, CI must pass, no direct push.

### `dev` — Ruleset: "Dev w/bypass"
- **Bypass**: Repository admin (always allow) — owner can push directly and force-push
- **Restrict updates** — non-admins cannot push directly; all changes via PR
- **Restrict deletions** — branch cannot be deleted by non-admins
- **Require a pull request before merging** — 0 required approvals
- **Require status checks to pass** — `Test` + `Typecheck` from CI must be green
- **Require branches to be up to date** — PRs must be current before merging
- **Require linear history** — merge commits blocked; squash or rebase merge only
- **Block force pushes** — blocked for non-admins (admin bypass covers post-ship realignment)
