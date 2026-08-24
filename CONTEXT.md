# SeniorityGuru

This context turns airline seniority-list spreadsheets into validated local data and analyzes pilot position over time. It defines the terms used by product, analysis, import, and user-visible feedback.

## Seniority Analysis Language

**Seniority Analysis Module**:
The supported public module is the barrel at `app/utils/seniority.ts`, imported as `~/utils/seniority`. It creates analysis context from validated entries and an As-of Date, then exposes completed domain and presentation results. Engine construction, snapshot creation, and presentation adapters remain internal implementation details.

**Seniority List**:
An airline's ordered collection of pilot entries at a stated effective date.

**Seniority Entry**:
One validated pilot record in a Seniority List.

**Seniority Number**:
The company-assigned ordering number for a pilot. A smaller number means greater company seniority, but numeric gaps do not represent positional distance.

**Rank**:
A one-based position calculated from membership in a defined pilot set. Rank, not Seniority Number, measures positional distance.

**Qualification**:
One Base, Seat, and Fleet combination.
_Avoid_: Qual, Cell

**Qualification Scope**:
An optional constraint over Base, Seat, Fleet, or any combination of them. An empty Qualification Scope means company-wide.
_Avoid_: Qual Spec, Cell Filter

**Anchor Pilot**:
The pilot whose relative Standing and projections are being analyzed.
_Avoid_: User Pilot, Subject Pilot

**Seniority Percentile**:
An inverted position measure within a defined pilot set. A value of 100 is the most senior end, and 0 is the most junior end.

**Standing**:
A pilot's Rank, pilot count, and Seniority Percentile within defined list and active-pilot sets.

**As-of Date**:
The date that determines current active status, age, Rank, and years of service.
_Avoid_: Reference Date, Today

**Projection Through Date**:
The inclusive upper date bound for a projection.
_Avoid_: Projection Horizon, End Date

**Scenario**:
A Qualification Scope and Growth Assumptions used for one analysis.

**Growth Assumptions**:
The modeled annual company growth state and decimal annual growth rate.
_Avoid_: Growth Config

**Qualification Threshold**:
The most junior active position in a Qualification, expressed as a Seniority Number and Seniority Percentile.
_Avoid_: Plug

**Holdable**:
A modeled outcome in which an Anchor Pilot's projected Seniority Percentile meets a Qualification Threshold. It does not imply contractual certainty.

**Retirement Wave**:
A retirement year with a notable concentration of scheduled retirements relative to other years in the same analysis.

## Seniority List Import Language

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
