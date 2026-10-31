# app/

`~/` resolves to `app/`.

## Data flow

```
Component → composable → store → Dexie
                ↓
        ~/utils/seniority   (seniority analysis, read-only)
```

| Layer | Owns | Rules |
|---|---|---|
| `components/`, `pages/` | rendering | [components](components/AGENTS.md), [pages](pages/AGENTS.md) |
| `composables/` | coordination across stores and the analysis facade | [composables](composables/AGENTS.md) |
| `stores/` | Dexie reads and writes, domain invariants | [stores](stores/AGENTS.md) |
| `utils/` | Dexie schema, Zod schemas, seniority analysis, pure helpers | [utils](utils/AGENTS.md) |

Each layer talks to the one next to it. Reach a lower layer through the layer above it.

## Nuxt conventions

- Use Nuxt navigation and route composables rather than direct Vue Router imports.
- Use Nuxt UI components and semantic UI tokens (`text-muted`, `text-highlighted`) for interface primitives and theme-aware styling.
