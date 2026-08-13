# Import Plugins

Import plugins define a supported upload type. Each plugin is compiled into the application and is selected explicitly by the user.

## Contract

Create the plugin in `app/utils/import-pipeline/plugins/`. It must use `defineImportPlugin()` and provide stable metadata, a unique lowercase ID, and a pure `prepare()` function.

`prepare()` receives an immutable source sheet. It may add canonical or derived columns and mapping suggestions. It must not modify the source sheet, access browser services, stores, network services, or another plugin.

Use `transformMappedEntry()` only for per-row airline behavior. It receives an immutable mapped draft and must return an entry patch or typed issue. The shared pipeline converts values, validates entries, and preserves the original row when a plugin transformation fails.

## Tests

Each plugin needs focused tests for supported aliases, preparation, transformations, and manual-mapping recovery. Add the plugin to `plugins/registry.ts`. The upload flow always shows Match Columns, even when every mapping is suggested.

## Data handling

The decoder retains source values in memory only during the upload. The local diagnostic store retains at most five attempts and 50 MB. Users can export or delete diagnostics in Settings.
