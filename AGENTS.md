# SeniorityGuru Agent Guide

Local-first Nuxt 4 PWA (`ssr: false`, no server). User data lives in IndexedDB through Dexie.

## Where to look

Read the nested `AGENTS.md` before editing in its directory. It holds that layer's boundaries and the existing code to extend.

| Editing | Read |
|---|---|
| anything under `app/` (data flow, Nuxt conventions) | [app/AGENTS.md](app/AGENTS.md) |
| `app/components/` | [app/components/AGENTS.md](app/components/AGENTS.md) |
| `app/pages/` | [app/pages/AGENTS.md](app/pages/AGENTS.md) |
| `app/composables/` | [app/composables/AGENTS.md](app/composables/AGENTS.md) |
| `app/stores/` | [app/stores/AGENTS.md](app/stores/AGENTS.md) |
| `app/utils/` (Dexie schema, Zod schemas, barrel) | [app/utils/AGENTS.md](app/utils/AGENTS.md) |
| `app/utils/seniority-engine/` | [app/utils/seniority-engine/AGENTS.md](app/utils/seniority-engine/AGENTS.md) |
| `app/utils/seniority-analysis/` | [app/utils/seniority-analysis/AGENTS.md](app/utils/seniority-analysis/AGENTS.md) |
| `app/utils/seniority-api/` | [app/utils/seniority-api/AGENTS.md](app/utils/seniority-api/AGENTS.md) |

Search the layer for an existing module before writing a new one. Extend it.

## References

- **Domain language:** Read [CONTEXT.md](CONTEXT.md) before naming anything a pilot sees or a domain value.
- **Decisions:** Read the matching record in `docs/adr/` before changing a behavior it governs.
- **Import plugin work:** Read [docs/import-plugins.md](docs/import-plugins.md) before adding or changing an airline upload type.
- **Contribution workflow:** Read [WORKFLOW.md](WORKFLOW.md) before creating a branch or opening a pull request.
- **Tests:** Keep tests next to the code they cover. Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` after code changes.

## Agent behavior

- Think before coding. State assumptions, surface tradeoffs, push back when warranted.
- Simplicity first. Minimum code that solves the problem. Nothing speculative.
- Surgical changes. Touch only what you must. Clean up only your own mess.
- Goal-driven execution. Define success criteria. Loop until verified.
- Worktrees default to `../worktrees/<branch>` as siblings of `repo-stable`.

## Agent skills

### Code review

When reviewing SeniorityGuru code, invoke [`.agents/skills/seniority-review/SKILL.md`](.agents/skills/seniority-review/SKILL.md). It defines the project-specific architecture and style review process.

### Issue tracker

Issues and specs are tracked in this repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The default five canonical triage labels are in use. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context layout. See `docs/agents/domain.md`.
