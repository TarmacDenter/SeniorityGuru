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

- **Parser work:** Read [app/utils/parsers/ADDING_PARSERS.md](app/utils/parsers/ADDING_PARSERS.md) before adding or changing an airline parser.
- **Contribution workflow:** Read [WORKFLOW.md](WORKFLOW.md) before creating a branch or opening a pull request.
- **Tests:** Keep tests next to the code they cover. Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` after code changes.
