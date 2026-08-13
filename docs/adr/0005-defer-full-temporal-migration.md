# Separate the full Temporal migration from import redesign

The import-plugin redesign keeps the existing `YYYY-MM-DD` date boundary and continues to use the shared date module. A follow-up migration will replace Day.js with Temporal, define `Temporal.PlainDate` application boundaries, add IndexedDB and JSON serialization adapters, and migrate schemas, analytics, composables, and UI adapters. Keeping these changes separate limits the import redesign while preserving the intended long-term date model.
