# Seniority List Import

This context turns airline seniority-list spreadsheets into validated local data. It defines the terms used by import code and user-visible feedback.

## Language

**Import Plugin**: A compiled-in definition that prepares an airline format or Generic spreadsheet and may transform mapped entries. Avoid: pre-parser, parser framework.

**Upload Type**: The user-facing choice that selects an Import Plugin. Avoid: parser, plugin.

**Import Pipeline**: The shared sequence that prepares a decoded Source Sheet, maps fields, transforms mapped entries, validates entries, and produces saved data. Avoid: upload parser.

**Source Sheet**: The unchanged spreadsheet columns and rows produced by decoding. Each source row and column has a stable identity. Avoid: temporary raw rows.

**Prepared Sheet**: A lossless working view that retains every Source Sheet column and adds derived columns. Mapping and transformations use this view. Avoid: normalized replacement sheet.

**Sheet Preparation**: A pure plugin operation that inspects a selected sheet and returns a Preparation Patch. Avoid: pre-parser.

**Preparation Patch**: An immutable description of derived columns, mapping suggestions, row selections, metadata suggestions, and typed issues. Avoid: replacement sheet.

**Entry Patch**: An immutable description of mapped-entry changes and typed issues. Avoid: replacement entry.

**Mapped-entry Transformation**: A plugin operation that changes one mapped entry before validation. It may inspect its Prepared Row and Source-row Identity. Avoid: post-parser.

**Source-row Identity**: A stable reference that connects a mapped entry to its prepared source row. Avoid: table index, display row number.

**Manual Mapping**: The user's confirmed assignment of preserved prepared columns to seniority-entry fields. Match Columns always appears. Avoid: parser failure.

**Plugin-required Mapping**: A mapping required for a plugin transformation even when the saved domain field is optional.

**Preparation Issue**: A plugin cannot confidently prepare all or part of a sheet. It does not prevent manual mapping.

**Transformation Issue**: A mapped-entry transformation cannot complete for one row. The mapped row stays available and Save blocks until the user resolves or keeps it.

**Blocking Import Error**: A read or decode error that prevents a Source Sheet from being created.

**Import Attempt**: A locally retained diagnostic record for one upload. Attempts and saved seniority lists have independent deletion lifecycles.

**Diagnostic Bundle**: A user-created export of one Import Attempt. It can include pilot and seniority-list data and is never sent automatically.

**Mapping Preference**: A locally saved per-plugin mapping choice identified by a stable Prepared Column ID or normalized source header. It always requires confirmation.
