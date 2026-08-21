# SeniorityGuru Agent Guide

## Architecture

SeniorityGuru is a local-first Nuxt 4 progressive web app. It is a client-side application (`ssr: false`) with no server routes, authentication, accounts, or cloud data store. User data remains in IndexedDB through Dexie.

### Data boundaries

Keep the data flow shallow:

```
Component → composable → store → Dexie
```

- Components and pages use composables. They do not import Pinia stores or `~/utils/db`.
- Stores own all Dexie reads and writes. A write updates the store's reactive state in the same operation.
- Stores do not import other stores. A composable coordinates actions that span stores.
- `app/utils/db.ts` owns the Dexie schema. Add a new version block for every schema change. Preserve all existing version blocks and their order.

### Domain model

- `seniorityLists` stores list metadata.
- `seniorityEntries` stores pilot rows linked by `listId`.
- `preferences` stores user settings as key-value pairs.
- `app/utils/seniority-engine/` contains pure analytics. It receives validated `SeniorityEntry` values and does not access stores or Dexie.
- Zod schemas in `app/utils/schemas/` validate data at the upload boundary. Downstream code uses the validated domain types.

### Framework conventions

- `~/` resolves to `app/`.
- Use Nuxt navigation and route composables rather than direct Vue Router imports.
- Use Nuxt UI components and semantic UI tokens for interface primitives and theme-aware styling.

## References

- **Import plugin work:** Read [docs/import-plugins.md](docs/import-plugins.md) before adding or changing an airline upload type.
- **Contribution workflow:** Read [WORKFLOW.md](WORKFLOW.md) before creating a branch or opening a pull request.
- **Tests:** Keep tests next to the code they cover. Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` after code changes.

## Agent behavior
- Think before coding. State assumptions, surface tradeoffs, push back when warranted.
- Simplicity first. Minimum code that solves the problem. Nothing speculative.
- Surgical changes. Touch only what you must. Clean up only your own mess.
- Goal-driven execution. Define success criteria. Loop until verified.


## Agent skills

### Code review

When reviewing SeniorityGuru code, invoke [`.agents/skills/seniority-review/SKILL.md`](.agents/skills/seniority-review/SKILL.md). It defines the project-specific architecture and style review process.

### Issue tracker

Issues and specs are tracked in this repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The default five canonical triage labels are in use. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context layout. See `docs/agents/domain.md`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
