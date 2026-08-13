# Import domain glossary

- **Upload Type**: The user-facing choice that selects one compiled-in `ImportPlugin`.
- **Import Plugin**: A pure, synchronous definition of preparation and optional mapped-entry transformation.
- **Source Sheet**: Lossless decoded data from one workbook sheet, with stable row and column identities.
- **Prepared Sheet**: A Source Sheet plus canonical, derived, or context-only columns added by preparation.
- **Preparation Patch**: Validated, immutable changes returned by `prepare()`.
- **Prepared Column**: A stable column available to mapping, including its namespaced plugin identity when plugin-created.
- **Confirmed Mapping**: A user-approved choice connecting an `ImportField` to a Prepared Column or shared mapping strategy.
- **Entry Patch**: Validated, immutable changes returned by `transformMappedEntry()` for one mapped row.
- **Import Issue**: A typed, actionable problem attached to preparation, transformation, or validation.
- **Import Attempt**: A local diagnostic record containing the stages and data needed to understand one import.

Use these terms in code, issues, tests, and contributor documentation. Use “Upload Type” in user-facing copy and `ImportPlugin` in technical interfaces.
