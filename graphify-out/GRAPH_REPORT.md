# Graph Report - upload-column-suggestion-labels-impl  (2026-10-31)

## Corpus Check
- 313 files · ~109,106 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: (none) 7, .csv 3, .toml 1)

## Summary
- 1807 nodes · 4042 edges · 141 communities (92 shown, 49 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 150 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `95cc6152`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- usePwaInstall.ts
- RetirementComparison.vue
- lens.ts
- parse.ts
- package.json
- pages/dashboard.vue
- upload.vue
- RetirementsTab.vue
- analysis.ts
- upload/index.ts
- seniority-list.ts
- SeniorityListViewer.vue
- AnchoredSeniorityLens
- demographics.ts
- utils/temporal.ts
- stores/seniority.ts
- utils/seniority.ts
- _useConfirm.test.ts
- import-pipeline/types.ts
- GrowthBar.vue
- UploadColumnMapper.vue
- SeniorityGuru
- formatYear
- demo-enter.ts
- logger.ts
- fuzz-data.ts
- UploadReviewTable.vue
- test
- lists.vue
- useUserStore
- compare.vue
- useSeniorityNav.ts
- utils/hooks.ts
- import-attempts.ts
- user.ts
- generate-demo-v2.ts
- PositionTab.vue
- UploadColumnMapper.test.ts
- devDependencies
- scripts
- ComparisonDiffTab.vue
- registry.ts
- ComparisonDiffTab.test.ts
- ComparisonTab.test.ts
- BaseStatusTable.vue
- fields.ts
- TrajectoryDemo.vue
- seniority-analysis/math.ts
- build-diff-rows.test.ts
- useDemoBanner.ts
- pages/index.vue
- seniority-compare.ts
- _useFileIO
- useSeniorityStore
- scripts/tsconfig.json
- useSeniorityCore.ts
- sortableHeader.ts
- vue-chartjs
- Wayfinder Child Ticket
- RetirementSnapshot.vue
- snapshot.ts
- SeniorityComparison.vue
- RetirementsTab.test.ts
- usePwaInstall
- SeniorityLensImplementation
- serializeInstant
- factories.ts
- theme.vue
- Domain Docs
- @nuxt/ui
- DashboardChart.vue
- DashboardStatCard.vue
- MobileBottomBar.test.ts
- @vueuse/core
- parsePlainDate
- QualFilterBar.vue
- @nuxt/ui
- pnpm-workspace.yaml
- formatDate
- _useFileIO.ts
- SettingsPreferencesCard.vue
- utils/temporal.ts
- FilePhase
- changelog.md
- formatRowError.ts
- SeniorityUpload
- PercentileThresholdCalculator.vue
- import-attempts.test.ts
- @nuxt/content
- DemographicsTab.vue
- Import Plugin
- tsconfig.json
- AppButtonToggle.vue
- stores/seniority.test.ts
- node_modules_pnpm_vue_3_5_41_typescript_5_9_3_node_modules_vue_index
- vitest
- app.vue
- utils/seniority.test.ts
- InfoIcon.vue
- layouts/dashboard.vue
- robots.txt
- Local-first Architecture
- SidebarFooter.vue
- SettingsWhatsNewCard.vue
- AppSearchInput.vue
- how-it-works.vue
- whats-new.vue
- 0001-code-based-import-plugin-lifecycle.md
- 0002-explicit-import-plugin-selection.md
- 0003-separate-import-domain-from-ui.md
- 0004-immutable-import-pipeline.md
- 0005-defer-full-temporal-migration.md
- Skills needs-info
- Skills needs-triage
- Skills ready-for-agent
- Skills ready-for-human
- Skills wontfix
- Import Context
- Seniority Guru Apple Touch Icon
- SeniorityGuru App Icon
- SeniorityGuru Application Icon

## God Nodes (most connected - your core abstractions)
1. `vitest` - 96 edges
2. `parsePlainDate()` - 48 edges
3. `PlainDate` - 45 edges
4. `useSeniorityStore` - 38 edges
5. `SeniorityEntry` - 38 edges
6. `@nuxt/test-utils` - 35 edges
7. `useSeniorityCore()` - 29 edges
8. `AnchoredSeniorityAnalysis` - 27 edges
9. `useUserStore` - 26 edges
10. `Implementation Decisions` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Replace the legacy parser framework without an adapter` --references--> `ImportPlugin`  [INFERRED]
  docs/adr/0006-replace-the-legacy-parser-framework.md → app/utils/import-pipeline/types.ts
- `Implementation Decisions` --references--> `SeniorityEntry`  [INFERRED]
  docs/specs/seniority-domain-api-and-presentation-seam-refactor.md → app/utils/schemas/seniority-list.ts
- `User Stories` --references--> `SeniorityEntry`  [INFERRED]
  docs/specs/seniority-domain-api-and-presentation-seam-refactor.md → app/utils/schemas/seniority-list.ts
- `Implementation Decisions` --references--> `SeniorityTrajectory`  [INFERRED]
  docs/specs/seniority-domain-api-and-presentation-seam-refactor.md → app/utils/seniority-analysis/math.ts
- `Implementation Decisions` --references--> `SeniorityTrajectoryComparison`  [INFERRED]
  docs/specs/seniority-domain-api-and-presentation-seam-refactor.md → app/utils/seniority-analysis/math.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Wayfinding Ticket Flow** — docs_agents_issue_tracker_wayfinder_map, docs_agents_issue_tracker_child_ticket, docs_agents_issue_tracker_native_issue_dependencies, docs_agents_issue_tracker_frontier_query, docs_agents_issue_tracker_claim, docs_agents_issue_tracker_resolve [EXTRACTED 1.00]
- **Canonical Triage Role Mappings** — docs_agents_triage_labels_skills_needs_triage, docs_agents_triage_labels_tracker_needs_triage, docs_agents_triage_labels_skills_needs_info, docs_agents_triage_labels_tracker_needs_info, docs_agents_triage_labels_skills_ready_for_agent, docs_agents_triage_labels_tracker_ready_for_agent, docs_agents_triage_labels_skills_ready_for_human, docs_agents_triage_labels_tracker_ready_for_human, docs_agents_triage_labels_skills_wontfix, docs_agents_triage_labels_tracker_wontfix [EXTRACTED 1.00]

## Communities (141 total, 49 thin omitted)

### Community 0 - "usePwaInstall.ts"
Cohesion: 0.31
Nodes (4): BeforeInstallPromptEvent, deferredInstallPrompt, sharedShowIosModal, isStandaloneMode()

### Community 1 - "RetirementComparison.vue"
Cohesion: 0.20
Nodes (10): chartData, chartOptions, { colors }, compareScope, currentScope, props, qualificationScopeOptions, { scopeOptions, specForLabel } (+2 more)

### Community 2 - "lens.ts"
Cohesion: 0.10
Nodes (31): EntryPredicate, SeniorityTrajectoryPoint, TrajectoryChange, AnchoredSeniorityLensImplementation, asOfDate(), CreateSeniorityLensOptions, LensContext, analyzeRetirementYears() (+23 more)

### Community 3 - "parse.ts"
Cohesion: 0.19
Nodes (17): EXCEL_EPOCH_MS, ISO_DATE_REGEX, NAMED_MONTH_FORMATS, DATE_PARSERS, detectDateFormat(), _detectFormat(), detectFutureDateFormat(), FUTURE_DATE_PARSERS (+9 more)

### Community 4 - "package.json"
Cohesion: 0.07
Nodes (27): dependencies, better-sqlite3@^12.8.0, dexie@^4.3.0, @fontsource/jetbrains-mono@^5.2.8, @fontsource-variable/dm-sans@^5.2.8, @internationalized/date@^3.12.0, nuxt@^4.5.2, @nuxt/ui@^4.10.0 (+19 more)

### Community 5 - "pages/dashboard.vue"
Cohesion: 0.10
Nodes (19): { activeTab, tabs }, activeTabLabel, { chartData: trajectoryChartData, changes: trajectoryChanges }, compactNotice, compactNoticeDismissed, dashboardControlsOpen, { employeeNumber }, fullBleedTabs (+11 more)

### Community 6 - "upload.vue"
Cohesion: 0.08
Nodes (19): activeFilterLabel, activeRowFilter, canAdvance, changeFormat(), clearRowFilter(), currentStep, currentStepIndex, files (+11 more)

### Community 7 - "RetirementsTab.vue"
Cohesion: 0.10
Nodes (20): availableBases, availableFleets, availableSeats, baseItems, columns, filterBase, filterFleet, filterSeat (+12 more)

### Community 8 - "analysis.ts"
Cohesion: 0.12
Nodes (32): RetirementCountProjection, SeniorityTrajectory, SeniorityTrajectoryComparison, formatQualification(), formatQualificationScope(), formatSeniorityCount(), formatSeniorityRankChange(), presentAgeBucket() (+24 more)

### Community 9 - "upload/index.ts"
Cohesion: 0.12
Nodes (22): DEFAULT_COLUMN_MAP, DEFAULT_MAPPING_OPTIONS, ColumnSource, ConfirmPhase, MappingPhase, ProcessingPhase, ProgressTracker, UploadColumnMap (+14 more)

### Community 10 - "seniority-list.ts"
Cohesion: 0.11
Nodes (22): log, draftSchema, ImportDiagnosticTraceSchema, importIssueSchema, mappingSelectionSchema, preparationPatchSchema, preparedColumnSchema, preparedSheetSchema (+14 more)

### Community 11 - "SeniorityListViewer.vue"
Cohesion: 0.06
Nodes (32): canInsert, columns, columnVisibility, currentPage, { employeeNumber }, expanded, focusUserPage(), globalFilter (+24 more)

### Community 12 - "AnchoredSeniorityLens"
Cohesion: 0.09
Nodes (19): AnchoredSeniorityAnalysis, createSeniorityAnalysis(), AnchorNotFoundError, createSeniorityLens(), asOfDate, assertAnchoredLensCapabilities(), assertOrganizationLensCapabilities(), createOrganizationLens() (+11 more)

### Community 13 - "demographics.ts"
Cohesion: 0.18
Nodes (18): computeYOSDate(), AGE_BUCKETS, analyzeAgeDistribution(), analyzeQualificationComposition(), analyzeYearsOfServiceBuckets(), analyzeYearsOfServiceDistribution(), findCaptainQualificationThresholds(), asOfDate (+10 more)

### Community 14 - "utils/temporal.ts"
Cohesion: 0.18
Nodes (20): effectiveDateModel, addYearsDate(), addYearsISO(), computeRetireDate(), computeRetireDateValue(), currentYear(), deriveAge(), diffYears() (+12 more)

### Community 15 - "stores/seniority.ts"
Cohesion: 0.17
Nodes (16): mockStore, ImportAttemptInput, log, ImportAttemptDomain, localImportAttemptToDomain(), localListToSeniorityList(), seniorityEntryToInput(), seniorityEntryToLocalEntry() (+8 more)

### Community 16 - "utils/seniority.ts"
Cohesion: 0.10
Nodes (33): NewHireControls, SeniorityTrajectoryPoint, useGrowthAssumptions(), useScopeFilter(), SeniorityEntry, GrowthAssumptions, CalculateRetirementCountProjectionOptions, CalculateSeniorityTrajectoryComparisonOptions (+25 more)

### Community 17 - "_useConfirm.test.ts"
Cohesion: 0.27
Nodes (7): createUploadSession(), createMapping(), createConfirm(), mockStore, _useConfirm(), createFileIO(), createReview()

### Community 18 - "import-pipeline/types.ts"
Cohesion: 0.09
Nodes (24): ReviewPhase, normalizeMappedEntry(), validateImportEntry(), cloneAndFreeze(), columnValue(), entryPatchSchema, importIssueSchema, mapEntry() (+16 more)

### Community 19 - "GrowthBar.vue"
Cohesion: 0.40
Nodes (4): emit, enabled, props, sliderValue

### Community 20 - "UploadColumnMapper.vue"
Cohesion: 0.16
Nodes (15): buildOptions(), columnLabels, ColumnOption, emit, optionsFor(), props, requiredFields, untaggedOptions (+7 more)

### Community 21 - "SeniorityGuru"
Cohesion: 0.06
Nodes (29): SeniorityGuru Agent Guide, Boundaries, Design quality, Findings, Nuxt and TypeScript, Review process, Review rules, Schemas and domain types (+21 more)

### Community 22 - "formatYear"
Cohesion: 0.08
Nodes (22): { defaults, colors }, props, trajectoryChartData, trajectoryChartOptions, waveChartData, waveChartOptions, chartData, chartOptions (+14 more)

### Community 23 - "demo-enter.ts"
Cohesion: 0.18
Nodes (10): registerDemoEnterHook(), Handler, mockNavigateTo, mockSeniorityStore, mockUserStore, runtimeHandlers, localEntryToSeniorityEntry(), DEMO_EMPLOYEE_NUMBER (+2 more)

### Community 24 - "logger.ts"
Cohesion: 0.21
Nodes (12): downloadLog(), entryCount, clearLogBuffer(), emit(), exportLogAsText(), getLogBuffer(), LOG_LEVELS, LogEntry (+4 more)

### Community 25 - "fuzz-data.ts"
Cohesion: 0.18
Nodes (19): assignSeat(), baseSamples, baseSampleSizing, buildHireDatePool(), buildSeatCurve(), fakeName(), fuzzRow(), makeEmployeeIdPool() (+11 more)

### Community 26 - "UploadReviewTable.vue"
Cohesion: 0.14
Nodes (10): columns, currentPage, displayEntries, editableFields, editingCell, emit, IndexedEntry, pageCount (+2 more)

### Community 27 - "test"
Cohesion: 0.11
Nodes (20): jobs, test, typecheck, name, on, pull_request, push, branches (+12 more)

### Community 28 - "lists.vue"
Cohesion: 0.17
Nodes (11): SeniorityListSummary, columns, { editOpen, saving, editState, deleteOpen, deleting, deleteTarget, openEdit, saveEdit, confirmDelete, doDelete }, filteredLists, { lists, listsLoading, listsError, fetchLists, deleteList: storeDeleteList, updateList: storeUpdateList }, log, SeniorityList, {
  tableRef: listsTable,
  globalFilter,
  sorting,
  pagination,
  paginationOptions,
  currentPage,
  pageCount,
  totalRows,
} (+3 more)

### Community 29 - "useUserStore"
Cohesion: 0.21
Nodes (10): clearAll(), { clearAllData }, confirm, loading, toast, mockImportAttemptsStore, mockSeniorityStore, mockUserStore (+2 more)

### Community 30 - "compare.vue"
Cohesion: 0.15
Nodes (16): activeCompareTab, compareTabs, { employeeNumber }, listIdA, listIdB, { lists, listOptions, fetchLists }, { loading, error, comparison }, route (+8 more)

### Community 31 - "useSeniorityNav.ts"
Cohesion: 0.31
Nodes (7): DASHBOARD_TABS, useDashboardTabs(), useSeniorityNav(), DashboardTab, DEFAULT_TAB, resolveTab(), VALID_TABS

### Community 32 - "utils/hooks.ts"
Cohesion: 0.13
Nodes (15): registerDemoExitHook(), Handler, mockNavigateTo, mockSeniorityStore, mockUserStore, runtimeHandlers, enterDemo(), #app (+7 more)

### Community 33 - "import-attempts.ts"
Cohesion: 0.23
Nodes (9): attempts, useImportAttempts(), exportAttempt(), load(), remove(), update(), newestFirst(), useImportAttemptsStore (+1 more)

### Community 34 - "user.ts"
Cohesion: 0.17
Nodes (15): useUser(), clearPreferences(), loadPreferences(), savePreference(), log, mockDb, useUserStore, ImportMappingPreference (+7 more)

### Community 35 - "generate-demo-v2.ts"
Cohesion: 0.08
Nodes (22): test, FIXTURE, uploadTestList(), MOBILE_VIEWPORT, config, manifest, @playwright/test, applyNewHires() (+14 more)

### Community 36 - "PositionTab.vue"
Cohesion: 0.15
Nodes (12): { employeeNumber }, growthAssumptions, { hasData, newHire, anchoredAnalysis, projectionEndDate }, hasEmployeeNumber, hasProjection, positionSliderMax, positionYearsInput, projectionYears (+4 more)

### Community 37 - "UploadColumnMapper.test.ts"
Cohesion: 0.13
Nodes (9): columnMap, Item, mappingOptions, USelectMenu, lastSeenDate, mountComposable(), useChangelog(), mockUserStore (+1 more)

### Community 38 - "devDependencies"
Cohesion: 0.08
Nodes (35): devDependencies, @commitlint/cli@^20.4.3, @commitlint/config-conventional@^20.4.3, eslint@^9.39.4, fake-indexeddb@^6.2.5, @faker-js/faker@^10.4.0, happy-dom@^20.8.3, @iconify-json/lucide@^1.2.96 (+27 more)

### Community 39 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dev:debug, fuzz, generate, lint, lint:fix (+7 more)

### Community 40 - "ComparisonDiffTab.vue"
Cohesion: 0.15
Nodes (10): badgeLabel(), filteredRows, isEmpty, page, PAGE_SIZE_OPTIONS, pageSize, paginatedRows, props (+2 more)

### Community 41 - "registry.ts"
Cohesion: 0.25
Nodes (6): config, emit, feedbackEmail, infoUploadType, props, showInfoModal

### Community 42 - "ComparisonDiffTab.test.ts"
Cohesion: 0.17
Nodes (6): DepartedRow, QualMoveRow, RetiredRow, SeniorityNumberChangeRow, DiffRow, DEMO_DIFF_ROWS

### Community 43 - "ComparisonTab.test.ts"
Cohesion: 0.17
Nodes (11): activeFilters, filteredData, filterOptions, props, table, ComparisonTabExposed, testColumns, testData (+3 more)

### Community 44 - "BaseStatusTable.vue"
Cohesion: 0.17
Nodes (12): adjusted, availableSeats, BaseStatusRow, columns, displayData, DisplayRow, highlightClass(), isMobile (+4 more)

### Community 45 - "fields.ts"
Cohesion: 0.09
Nodes (43): IMPORT_FIELDS, ImportField, importFieldLabel(), matchingColumns(), normalizeHeader(), preparedColumn(), preparedColumnId(), deepFreeze() (+35 more)

### Community 46 - "TrajectoryDemo.vue"
Cohesion: 0.17
Nodes (12): activePreset, chartData, chartOptions, container, generateTrajectory(), growthRate, legendItems, qualificationScope (+4 more)

### Community 47 - "seniority-analysis/math.ts"
Cohesion: 0.19
Nodes (20): isRetiredBy(), calculateAdditionalSeniorityPilots(), DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS, calculateRetirementCountProjection(), calculateSeniorityPercentile(), calculateSeniorityRank(), calculateSeniorityTrajectory(), calculateSeniorityTrajectoryComparison() (+12 more)

### Community 48 - "build-diff-rows.test.ts"
Cohesion: 0.22
Nodes (3): diffRows, buildDiffRows(), emptyResult

### Community 49 - "useDemoBanner.ts"
Cohesion: 0.17
Nodes (12): dismissBanner(), emit, props, { showBanner, dismiss, exit }, mockEmitHook, mockGetPreference, mockSavePreference, mockSeniorityLists (+4 more)

### Community 50 - "pages/index.vue"
Cohesion: 0.07
Nodes (22): props, rowMaxCounts, sortedPositions, BASE_QUAL_SCALES, config, dataOwnershipItems, demoAgeBuckets, demoAgeData (+14 more)

### Community 51 - "seniority-compare.ts"
Cohesion: 0.22
Nodes (9): {
  mockNavigateTo,
  mockRouteQuery,
  mockFetchLists,
  mockLists,
  mockComparison,
}, DELETED_KINDS, CompareResult, DepartedPilot, Entry, NewHire, QualMove, RetiredPilot (+1 more)

### Community 52 - "_useFileIO"
Cohesion: 0.21
Nodes (16): useSeniorityUpload(), clearUploadType(), reset(), resetDownstream(), selectUploadType(), _useFileIO(), applyPreparedSheet(), includeExcludedRows() (+8 more)

### Community 53 - "useSeniorityStore"
Cohesion: 0.18
Nodes (12): useSeniorityCompare(), fetchListData(), loadComparison(), useSeniorityLists(), clearStore(), fetchEntries(), fetchLists(), updateList() (+4 more)

### Community 54 - "scripts/tsconfig.json"
Cohesion: 0.22
Nodes (8): ../tsconfig.json, compilerOptions, baseUrl, paths, types, exclude, extends, include

### Community 55 - "useSeniorityCore.ts"
Cohesion: 0.05
Nodes (49): { deleteList }, deletingId, ListItem, toast, rank, {
  chartData: trajectoryChartData,
  computeComparativeTrajectory,
  computeRetirementProjection,
}, growthAssumptions, { hasData, hasAnchor, analysis, anchoredAnalysis, projectionEndDate } (+41 more)

### Community 56 - "sortableHeader.ts"
Cohesion: 0.38
Nodes (3): sortableHeader(), @tanstack/vue-table@^8.21.3, @tanstack/vue-table

### Community 57 - "vue-chartjs"
Cohesion: 0.17
Nodes (10): chartData, chartOptions, { defaults, colors }, props, chartData, chartOptions, { defaults, colors }, props (+2 more)

### Community 58 - "Wayfinder Child Ticket"
Cohesion: 0.20
Nodes (11): Wayfinder Child Ticket, Ticket Claim, Frontier Query, GitHub CLI, GitHub Issue Tracker, GitHub Issues, GitHub Native Issue Dependencies, Pull Requests (+3 more)

### Community 59 - "RetirementSnapshot.vue"
Cohesion: 0.20
Nodes (10): columns, formatDate(), maxYears, PresentedSeniorityTrajectoryPoint, props, SeniorityTrajectoryPoint, tableData, TableRow (+2 more)

### Community 60 - "snapshot.ts"
Cohesion: 0.06
Nodes (51): accentVariant, emit, employeeNumber, loading, onSave(), { savePreference }, toast, validationError (+43 more)

### Community 61 - "SeniorityComparison.vue"
Cohesion: 0.20
Nodes (9): chartData, chartOptions, { colors }, compareScope, currentScope, defaultScope, props, qualificationScopeOptions (+1 more)

### Community 62 - "RetirementsTab.test.ts"
Cohesion: 0.18
Nodes (6): entries(), mockStoreState, mockUpcomingRetirements, sampleRows, mockStore, makePartialEntry()

### Community 63 - "usePwaInstall"
Cohesion: 0.47
Nodes (5): dismissBanner(), emit, props, { showBanner, isIos, showIosModal, install, snooze, dismiss }, snoozeBanner()

### Community 64 - "SeniorityLensImplementation"
Cohesion: 0.14
Nodes (3): commonLensMethods(), SeniorityLensImplementation, CommonSeniorityLens

### Community 65 - "serializeInstant"
Cohesion: 0.32
Nodes (9): toConfirmedMappings(), _useColumnMapping(), apply(), usePwaInstall(), snooze(), createLogger(), log(), nowInstant() (+1 more)

### Community 66 - "factories.ts"
Cohesion: 0.13
Nodes (15): stubs, save(), mockLoadPreferences, mockSavePreference, mockSeniorityEntries, mockUserStore, makeDomainEntry(), makeEntry() (+7 more)

### Community 67 - "theme.vue"
Cohesion: 0.25
Nodes (7): componentColors, iconColors, retirementTokens, semanticColors, shades, surfaceTokens, textTokens

### Community 68 - "Domain Docs"
Cohesion: 0.25
Nodes (6): Architecture Decision Records, CONTEXT-MAP.md, CONTEXT.md, Domain Docs, Canonical Triage Roles, Triage Labels

### Community 69 - "@nuxt/ui"
Cohesion: 0.25
Nodes (6): ByBase, columns, props, QualificationComposition, rows, SizeRow

### Community 70 - "DashboardChart.vue"
Cohesion: 0.33
Nodes (6): chartComponent, chartComponents, deepMerge(), { defaults }, mergedOptions, props

### Community 71 - "DashboardStatCard.vue"
Cohesion: 0.29
Nodes (5): animatedNumber, displayValue, isAnimating, numericTarget, props

### Community 72 - "MobileBottomBar.test.ts"
Cohesion: 0.29
Nodes (4): { hasUnseenChanges }, navItems, route, mockRoute

### Community 73 - "@vueuse/core"
Cohesion: 0.28
Nodes (8): commitGotoPage(), emit, gotoPageInput, handleGotoKeydown(), isMobile, props, @vueuse/core@^13.0.0, @vueuse/core

### Community 75 - "parsePlainDate"
Cohesion: 0.11
Nodes (15): birthDateModel, { newHire: newHireMode }, toast, getDropdownItems(), useListManagement(), confirmDelete(), openEdit(), saveEdit() (+7 more)

### Community 76 - "QualFilterBar.vue"
Cohesion: 0.33
Nodes (3): base, fleet, seat

### Community 77 - "@nuxt/ui"
Cohesion: 0.15
Nodes (9): BaseSeatRow, columns, props, tabs, attrs, buttonProps, props, shareData (+1 more)

### Community 79 - "formatDate"
Cohesion: 0.22
Nodes (7): columns, TableRow, birthDateModel, { employeeNumber }, { newHire: newHireMode }, formatDate(), todayISO()

### Community 80 - "_useFileIO.ts"
Cohesion: 0.24
Nodes (8): DecodeWorkbookResult, SourceCellValue, decodeSheet(), decodeWorkbook(), normalizeCell(), WorkbookFile, xlsx@^0.18.5, xlsx

### Community 81 - "SettingsPreferencesCard.vue"
Cohesion: 0.25
Nodes (6): loading, { retirementAge, savePreference }, state, toast, UpdatePreferencesSchema, UpdatePreferencesState

### Community 82 - "utils/temporal.ts"
Cohesion: 0.43
Nodes (4): memoizeLast(), stableStringify(), addLocalCalendarDays(), Instant

### Community 84 - "changelog.md"
Cohesion: 0.33
Nodes (5): April 26, 2026, August 12, 2026, March 25, 2026, March 26, 2026, March 30, 2026

### Community 85 - "formatRowError.ts"
Cohesion: 0.60
Nodes (3): dateFields, formatRowError(), humanizeField()

### Community 87 - "PercentileThresholdCalculator.vue"
Cohesion: 0.50
Nodes (4): emit, handlePercentileChange(), props, sliderValue

### Community 88 - "import-attempts.test.ts"
Cohesion: 0.50
Nodes (3): records, pinia@^3.0.4, pinia

### Community 90 - "DemographicsTab.vue"
Cohesion: 0.12
Nodes (19): accentVariant, animatedPercentile, props, yearsOfService, ageDistribution, captainQualificationThresholds, demographicsResult, { hasData, newHire, analysis, anchoredAnalysis, userEntry } (+11 more)

### Community 92 - "Import Plugin"
Cohesion: 0.50
Nodes (5): Entry Patch, Import Pipeline, Import Plugin, Preparation Patch, Import Plugin Lifecycle

### Community 95 - "tsconfig.json"
Cohesion: 0.50
Nodes (3): ./.nuxt/tsconfig.json, exclude, extends

### Community 98 - "stores/seniority.test.ts"
Cohesion: 0.22
Nodes (7): expectedAdaptedEntry, mockDb, mockEmitHook, mockList1, mockList2, mockLocalEntry, LocalSeniorityList

### Community 100 - "node_modules_pnpm_vue_3_5_41_typescript_5_9_3_node_modules_vue_index"
Cohesion: 0.14
Nodes (11): demographicsPresentation, demographicsResult, { mockAnalysis, mockAnchoredAnalysis, mockHasData, mockReady, mockRetirementAge, mockSelectedBase, mockQualificationScope }, { mockAnchoredAnalysis, mockHasData, mockProjectionEndDate }, { mockHasData, mockHasAnchor, mockAnalysis, mockAnchoredAnalysis }, { mockAnalysis, mockHasData }, state, { mockEnabled, mockReset, mockToastAdd } (+3 more)

### Community 101 - "vitest"
Cohesion: 0.08
Nodes (18): BannerVm, { mockSavePreference, mockToastAdd }, emit, tabs, mockQualFilter, bmcUrl, config, feedbackEmail (+10 more)

### Community 106 - "utils/seniority.test.ts"
Cohesion: 0.33
Nodes (3): asOfDate, assertPublicCapabilityAndReadonlyTypes(), entries

## Knowledge Gaps
- **30 isolated node(s):** `../tsconfig.json`, `./.nuxt/tsconfig.json`, `All User Agents`, `Site-wide Access`, `Local-first Architecture` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 809 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `usePwaInstall.ts`, `lens.ts`, `parse.ts`, `analysis.ts`, `upload/index.ts`, `seniority-list.ts`, `AnchoredSeniorityLens`, `demographics.ts`, `utils/temporal.ts`, `stores/seniority.ts`, `utils/seniority.ts`, `_useConfirm.test.ts`, `import-pipeline/types.ts`, `UploadColumnMapper.vue`, `demo-enter.ts`, `logger.ts`, `lists.vue`, `useUserStore`, `useSeniorityNav.ts`, `utils/hooks.ts`, `user.ts`, `generate-demo-v2.ts`, `PositionTab.vue`, `UploadColumnMapper.test.ts`, `devDependencies`, `ComparisonDiffTab.test.ts`, `ComparisonTab.test.ts`, `fields.ts`, `seniority-analysis/math.ts`, `build-diff-rows.test.ts`, `useDemoBanner.ts`, `pages/index.vue`, `seniority-compare.ts`, `useSeniorityCore.ts`, `sortableHeader.ts`, `snapshot.ts`, `RetirementsTab.test.ts`, `factories.ts`, `MobileBottomBar.test.ts`, `parsePlainDate`, `formatDate`, `_useFileIO.ts`, `utils/temporal.ts`, `formatRowError.ts`, `import-attempts.test.ts`, `stores/seniority.test.ts`, `node_modules_pnpm_vue_3_5_41_typescript_5_9_3_node_modules_vue_index`, `utils/seniority.test.ts`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `useSeniorityStore` (e.g. with `clearAll()` and `clearStore()`) actually correct?**
  _`useSeniorityStore` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `../tsconfig.json`, `./.nuxt/tsconfig.json`, `All User Agents` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lens.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09797979797979799 - nodes in this community are weakly interconnected._
- **Why does `@nuxt/ui` connect `@nuxt/ui` to `package.json`, `@nuxt/ui`, `upload.vue`, `RetirementsTab.vue`, `devDependencies`, `ComparisonTab.test.ts`, `BaseStatusTable.vue`, `SeniorityListViewer.vue`, `formatDate`, `UploadColumnMapper.vue`, `UploadReviewTable.vue`, `RetirementSnapshot.vue`, `lists.vue`, `compare.vue`, `useSeniorityNav.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `SeniorityEntry` (e.g. with `Implementation Decisions` and `User Stories`) actually correct?**
  _`SeniorityEntry` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._