# Import Plugin Guide

Import Plugins define compiled-in Upload Types. The user selects an Upload Type before choosing a file. The application never infers a type or silently falls back to Generic spreadsheet.

## Lifecycle

The spreadsheet adapter decodes a file into an immutable `SourceSheet`. The pipeline calls the selected plugin's `prepare()` hook. Users then confirm Match Columns. The pipeline maps, converts, transforms, and validates one draft entry at a time. Only validated entries can be saved.

Create a plugin in `app/utils/import-pipeline/plugins/`, register it in `registry.ts`, and use `defineImportPlugin()`.

```ts
export const exampleImportPlugin = defineImportPlugin({
  id: 'example-airline', // Permanent lowercase slug.
  label: 'Example Airline',
  description: 'Example seniority-list export.',
  icon: 'i-lucide-plane',
  formatDescription: 'Expected spreadsheet columns.',
  prepare(sourceSheet) {
    return { columns: [], mappingSuggestions: {} }
  },
  transformMappedEntry: ({ draft, preparedRow }) => ({ entry: {} }),
})
```

`prepare()` must be synchronous and pure. It receives immutable source data and returns a `PreparationPatch`. It may add canonical or derived prepared columns, mapping suggestions, and typed issues. It must preserve every source row, column, and value.

`transformMappedEntry()` is optional. It receives an immutable mapped draft and prepared row. It returns an `EntryPatch`; it never mutates or replaces the draft. The pipeline preserves a row when a transformation throws or returns an invalid patch.

Plugins must not access Vue, browser APIs, stores, Dexie, logging, network services, or another airline plugin. Plugins cannot add persisted fields or custom mapping strategies. Use only shared issue kinds and fields from the contract in `app/utils/import-pipeline/types.ts`.

## Aliases and mappings

Use stable, namespaced Prepared Column IDs such as `plugin:example-airline:base`. Keep original source columns available. Match aliases as normalized complete headers. Leave ambiguous matches unresolved. Declare only explicit suggestions; Match Columns is always shown for confirmation.

Use transformations for airline-specific mapped-entry behavior. Use a canonical or derived Prepared Column when a rule needs extra context. The shared pipeline owns trimming, date conversion, Base/Seat/Fleet uppercasing, and domain validation.

## Tests and pull requests

Add fabricated fixtures and co-located tests for aliases, preparation, transformation, validation, failure recovery, and source-to-validated-entry behavior through the public pipeline seam. Verify deterministic results and immutable inputs. The registered plugin must pass the shared conformance suite.

Before a pull request, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Include the plugin, registry change, fixtures, tests, and any needed user-facing copy. Never add real pilot data. The reviewer verifies the pure lifecycle, permanent ID, and full observable import flow.
