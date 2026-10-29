# Graph Report - repo-stable  (2026-10-29)

## Corpus Check
- 311 files · ~104,625 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: (none) 7, .csv 3, .toml 1)

## Summary
- 1789 nodes · 3981 edges · 144 communities (95 shown, 49 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 150 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `60415494`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- logger.ts
- RetirementComparison.vue
- lens.ts
- parse.ts
- dependencies
- pages/dashboard.vue
- upload.vue
- RetirementsTab.vue
- analysis.ts
- upload/index.ts
- QualSeniorityScale.vue
- SeniorityListViewer.vue
- lens.test.ts
- node_modules_pnpm_vue_3_5_41_typescript_5_9_3_node_modules_vue_index
- date/index.ts
- useSeniorityStore
- useSeniorityCompare
- fields.ts
- process-confirmed-mappings.ts
- utils/seniority.ts
- TrajectoryTab.vue
- SeniorityGuru
- formatYear
- demo-enter.ts
- _useReview.ts
- fuzz-data.ts
- UploadReviewTable.vue
- test
- lists.vue
- useClearAllData.ts
- compare.vue
- isStandaloneMode
- utils/hooks.ts
- import-attempts.ts
- SeniorityLensImplementation
- generate-demo-v2.ts
- PositionTab.vue
- parse-spreadsheet.ts
- package.json
- scripts
- ComparisonDiffTab.vue
- ImportPlugin
- ComparisonDiffTab.test.ts
- @nuxt/ui
- BaseStatusTable.vue
- jetblue.ts
- TrajectoryDemo.vue
- seniority-analysis/math.ts
- UploadColumnMapper.vue
- useUserStore
- pages/index.vue
- seniority-compare.ts
- _useFileIO
- demographics.ts
- scripts/tsconfig.json
- useQualFilter.test.ts
- sortableHeader.ts
- SettingsPreferencesCard.vue
- Wayfinder Child Ticket
- RetirementSnapshot.vue
- snapshot.ts
- SeniorityComparison.vue
- RetirementsTab.test.ts
- InstallBanner.vue
- demo-enter.test.ts
- useSeniorityCore.ts
- factories.ts
- theme.vue
- Domain Docs
- QualSizesCard.vue
- DashboardChart.vue
- DashboardStatCard.vue
- MobileBottomBar.test.ts
- @vueuse/core
- formatDate
- QualFilterBar.vue
- BaseSeatBreakdown.vue
- pnpm-workspace.yaml
- ShareButton.vue
- import-pipeline/types.ts
- usePwaInstall.test.ts
- demo-exit.test.ts
- useListManagement
- changelog.md
- vue-chartjs
- PercentileThresholdCalculator.vue
- DemographicsTab.vue
- SupportModal.vue
- Import Plugin
- tsconfig.json
- TabChips.test.ts
- AppButtonToggle.vue
- utils/temporal.ts
- seniority/index.ts
- useTableFeatures.ts
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
- app_utils_temporal_temporal
- Import Context
- Seniority Guru Apple Touch Icon
- SeniorityGuru App Icon
- SeniorityGuru Application Icon
- RecentListsTimeline.vue
- useTrajectory.test.ts

## God Nodes (most connected - your core abstractions)
1. `vitest` - 94 edges
2. `parsePlainDate()` - 46 edges
3. `PlainDate` - 44 edges
4. `useSeniorityStore` - 38 edges
5. `SeniorityEntry` - 38 edges
6. `@nuxt/test-utils` - 34 edges
7. `useSeniorityCore()` - 29 edges
8. `AnchoredSeniorityAnalysis` - 27 edges
9. `useUserStore` - 26 edges
10. `Implementation Decisions` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Import domain glossary` --references--> `ImportField`  [INFERRED]
  docs/domain-glossary.md → app/utils/import-pipeline/fields.ts
- `Replace the legacy parser framework without an adapter` --references--> `ImportPlugin`  [INFERRED]
  docs/adr/0006-replace-the-legacy-parser-framework.md → app/utils/import-pipeline/types.ts
- `Implementation Decisions` --references--> `SeniorityEntry`  [INFERRED]
  docs/specs/seniority-domain-api-and-presentation-seam-refactor.md → app/utils/schemas/seniority-list.ts
- `User Stories` --references--> `SeniorityEntry`  [INFERRED]
  docs/specs/seniority-domain-api-and-presentation-seam-refactor.md → app/utils/schemas/seniority-list.ts
- `Implementation Decisions` --references--> `SeniorityTrajectory`  [INFERRED]
  docs/specs/seniority-domain-api-and-presentation-seam-refactor.md → app/utils/seniority-analysis/math.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Wayfinding Ticket Flow** — docs_agents_issue_tracker_wayfinder_map, docs_agents_issue_tracker_child_ticket, docs_agents_issue_tracker_native_issue_dependencies, docs_agents_issue_tracker_frontier_query, docs_agents_issue_tracker_claim, docs_agents_issue_tracker_resolve [EXTRACTED 1.00]
- **Canonical Triage Role Mappings** — docs_agents_triage_labels_skills_needs_triage, docs_agents_triage_labels_tracker_needs_triage, docs_agents_triage_labels_skills_needs_info, docs_agents_triage_labels_tracker_needs_info, docs_agents_triage_labels_skills_ready_for_agent, docs_agents_triage_labels_tracker_ready_for_agent, docs_agents_triage_labels_skills_ready_for_human, docs_agents_triage_labels_tracker_ready_for_human, docs_agents_triage_labels_skills_wontfix, docs_agents_triage_labels_tracker_wontfix [EXTRACTED 1.00]

## Communities (144 total, 49 thin omitted)

### Community 0 - "logger.ts"
Cohesion: 0.13
Nodes (22): downloadLog(), entryCount, usePwaInstall(), snooze(), clearLogBuffer(), createLogger(), log(), emit() (+14 more)

### Community 1 - "RetirementComparison.vue"
Cohesion: 0.20
Nodes (10): chartData, chartOptions, { colors }, compareScope, currentScope, props, qualificationScopeOptions, { scopeOptions, specForLabel } (+2 more)

### Community 2 - "lens.ts"
Cohesion: 0.10
Nodes (31): EntryPredicate, SeniorityTrajectoryPoint, TrajectoryChange, AnchoredSeniorityLensImplementation, asOfDate(), CreateSeniorityLensOptions, LensContext, analyzeRetirementYears() (+23 more)

### Community 3 - "parse.ts"
Cohesion: 0.18
Nodes (18): EXCEL_EPOCH_MS, ISO_DATE_REGEX, NAMED_MONTH_FORMATS, DATE_PARSERS, DateParser, detectDateFormat(), _detectFormat(), detectFutureDateFormat() (+10 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (30): dependencies, better-sqlite3@^12.8.0, dexie@^4.3.0, @fontsource/jetbrains-mono@^5.2.8, @fontsource-variable/dm-sans@^5.2.8, @internationalized/date@^3.12.0, nuxt@^4.5.2, @nuxt/content@^3.12.0 (+22 more)

### Community 5 - "pages/dashboard.vue"
Cohesion: 0.09
Nodes (26): DASHBOARD_TABS, useDashboardTabs(), useSeniorityNav(), { activeTab, tabs }, activeTabLabel, { chartData: trajectoryChartData, changes: trajectoryChanges }, compactNotice, compactNoticeDismissed (+18 more)

### Community 6 - "upload.vue"
Cohesion: 0.08
Nodes (19): activeFilterLabel, activeRowFilter, canAdvance, changeFormat(), clearRowFilter(), currentStep, currentStepIndex, files (+11 more)

### Community 7 - "RetirementsTab.vue"
Cohesion: 0.10
Nodes (20): availableBases, availableFleets, availableSeats, baseItems, columns, filterBase, filterFleet, filterSeat (+12 more)

### Community 8 - "analysis.ts"
Cohesion: 0.12
Nodes (33): RetirementCountProjection, SeniorityTrajectory, SeniorityTrajectoryComparison, formatQualification(), formatQualificationScope(), formatSeniorityCount(), formatSeniorityRankChange(), presentAgeBucket() (+25 more)

### Community 9 - "upload/index.ts"
Cohesion: 0.12
Nodes (22): columnMap, mappingOptions, DEFAULT_COLUMN_MAP, DEFAULT_MAPPING_OPTIONS, createUploadSession(), MappingPhase, ProcessingPhase, ProgressTracker (+14 more)

### Community 10 - "QualSeniorityScale.vue"
Cohesion: 0.17
Nodes (6): props, rowMaxCounts, sortedPositions, SEAT_ORDER, sortQualificationPositions(), PresentedQualificationPosition

### Community 11 - "SeniorityListViewer.vue"
Cohesion: 0.06
Nodes (32): canInsert, columns, columnVisibility, currentPage, { employeeNumber }, expanded, focusUserPage(), globalFilter (+24 more)

### Community 12 - "lens.test.ts"
Cohesion: 0.08
Nodes (21): useGrowthAssumptions(), DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS, createSeniorityAnalysis(), AnchorNotFoundError, createSeniorityLens(), asOfDate, assertAnchoredLensCapabilities(), assertOrganizationLensCapabilities() (+13 more)

### Community 13 - "node_modules_pnpm_vue_3_5_41_typescript_5_9_3_node_modules_vue_index"
Cohesion: 0.23
Nodes (9): { mockAnalysis, mockAnchoredAnalysis, mockHasData }, { mockAnchoredAnalysis, mockHasData }, { mockHasData, mockHasAnchor, mockAnalysis, mockAnchoredAnalysis }, { mockAnalysis, mockHasData }, state, { mockEnabled, mockReset, mockToastAdd }, {
  mockNavigateTo,
  mockRouteQuery,
  mockLoadPreferences,
  mockFetchLists,
  mockFetchEntries,
  mockLists,
}, mockReviewErrorCount (+1 more)

### Community 14 - "date/index.ts"
Cohesion: 0.22
Nodes (19): todayISO(), addYearsDate(), addYearsISO(), computeRetireDate(), computeRetireDateValue(), computeYOS(), currentYear(), deriveAge() (+11 more)

### Community 15 - "useSeniorityStore"
Cohesion: 0.13
Nodes (24): useSeniorityLists(), clearStore(), fetchEntries(), fetchLists(), updateList(), compareListsByRecency(), log, useSeniorityStore (+16 more)

### Community 16 - "useSeniorityCompare"
Cohesion: 0.67
Nodes (4): useSeniorityCompare(), fetchListData(), loadComparison(), computeComparison()

### Community 17 - "fields.ts"
Cohesion: 0.11
Nodes (20): draftSchema, ImportDiagnosticTraceSchema, importIssueSchema, mappingSelectionSchema, preparationPatchSchema, preparedColumnSchema, preparedSheetSchema, reviewEditPatchSchema (+12 more)

### Community 18 - "process-confirmed-mappings.ts"
Cohesion: 0.09
Nodes (21): ConfirmPhase, ReviewPhase, normalizeMappedEntry(), validateImportEntry(), cloneAndFreeze(), columnValue(), entryPatchSchema, importIssueSchema (+13 more)

### Community 19 - "utils/seniority.ts"
Cohesion: 0.09
Nodes (36): emit, enabled, props, sliderValue, NewHireControls, SeniorityTrajectoryPoint, useScopeFilter(), SeniorityEntry (+28 more)

### Community 20 - "TrajectoryTab.vue"
Cohesion: 0.11
Nodes (17): {
  chartData: trajectoryChartData,
  computeComparativeTrajectory,
  computeRetirementProjection,
}, growthAssumptions, { hasData, hasAnchor, analysis, anchoredAnalysis, projectionEndDate }, isBannerDismissed, qualificationFilter, qualificationScopeOptions, qualificationTrajectoryChanges, { rankCard } (+9 more)

### Community 21 - "SeniorityGuru"
Cohesion: 0.06
Nodes (29): SeniorityGuru Agent Guide, Boundaries, Design quality, Findings, Nuxt and TypeScript, Review process, Review rules, Schemas and domain types (+21 more)

### Community 22 - "formatYear"
Cohesion: 0.08
Nodes (23): { defaults, colors }, props, trajectoryChartData, trajectoryChartOptions, waveChartData, waveChartOptions, chartData, chartOptions (+15 more)

### Community 23 - "demo-enter.ts"
Cohesion: 0.36
Nodes (3): DEMO_EMPLOYEE_NUMBER, mdyToISO(), parseDemoCSV()

### Community 24 - "_useReview.ts"
Cohesion: 0.19
Nodes (19): formatIssueMessage(), formatPipelineIssue(), formatSchemaIssues(), isStructuralMessage(), log, reportReviewChange(), createReview(), _useReview() (+11 more)

### Community 25 - "fuzz-data.ts"
Cohesion: 0.18
Nodes (19): assignSeat(), baseSamples, baseSampleSizing, buildHireDatePool(), buildSeatCurve(), fakeName(), fuzzRow(), makeEmployeeIdPool() (+11 more)

### Community 26 - "UploadReviewTable.vue"
Cohesion: 0.12
Nodes (13): columns, currentPage, displayEntries, editableFields, editingCell, emit, IndexedEntry, pageCount (+5 more)

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

### Community 29 - "useClearAllData.ts"
Cohesion: 0.21
Nodes (10): clearAll(), { clearAllData }, confirm, loading, toast, mockImportAttemptsStore, mockSeniorityStore, mockUserStore (+2 more)

### Community 30 - "compare.vue"
Cohesion: 0.14
Nodes (18): activeCompareTab, compareTabs, diffRows, { employeeNumber }, listIdA, listIdB, { lists, listOptions, fetchLists }, { loading, error, comparison } (+10 more)

### Community 32 - "utils/hooks.ts"
Cohesion: 0.20
Nodes (8): enterDemo(), #app, AppHooks, HookHandler, RuntimeNuxtHooks, freshHooks(), Handler, runtimeHandlers

### Community 33 - "import-attempts.ts"
Cohesion: 0.16
Nodes (14): attempts, useImportAttempts(), exportAttempt(), load(), remove(), update(), ImportAttemptInput, log (+6 more)

### Community 34 - "SeniorityLensImplementation"
Cohesion: 0.14
Nodes (3): commonLensMethods(), SeniorityLensImplementation, CommonSeniorityLens

### Community 35 - "generate-demo-v2.ts"
Cohesion: 0.08
Nodes (22): test, FIXTURE, uploadTestList(), MOBILE_VIEWPORT, config, manifest, @playwright/test, applyNewHires() (+14 more)

### Community 36 - "PositionTab.vue"
Cohesion: 0.13
Nodes (16): accentVariant, animatedPercentile, props, yearsOfService, { employeeNumber }, growthAssumptions, { hasData, newHire, anchoredAnalysis, projectionEndDate }, hasEmployeeNumber (+8 more)

### Community 37 - "parse-spreadsheet.ts"
Cohesion: 0.36
Nodes (7): applyColumnMap(), autoDetectColumnMap(), ColumnMap, isColumnMapComplete(), MappingOptions, mapSingleRow(), parseSpreadsheetData()

### Community 38 - "package.json"
Cohesion: 0.08
Nodes (35): devDependencies, @commitlint/cli@^20.4.3, @commitlint/config-conventional@^20.4.3, eslint@^9.39.4, fake-indexeddb@^6.2.5, @faker-js/faker@^10.4.0, happy-dom@^20.8.3, @iconify-json/lucide@^1.2.96 (+27 more)

### Community 39 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dev:debug, fuzz, generate, lint, lint:fix (+7 more)

### Community 40 - "ComparisonDiffTab.vue"
Cohesion: 0.15
Nodes (10): badgeLabel(), filteredRows, isEmpty, page, PAGE_SIZE_OPTIONS, pageSize, paginatedRows, props (+2 more)

### Community 41 - "ImportPlugin"
Cohesion: 0.12
Nodes (10): config, emit, feedbackEmail, infoUploadType, props, showInfoModal, SeniorityUpload, ImportPlugin (+2 more)

### Community 42 - "ComparisonDiffTab.test.ts"
Cohesion: 0.17
Nodes (6): DepartedRow, QualMoveRow, RankChangeRow, RetiredRow, DiffRow, DEMO_DIFF_ROWS

### Community 43 - "@nuxt/ui"
Cohesion: 0.15
Nodes (13): activeFilters, filteredData, filterOptions, props, table, ComparisonTabExposed, testColumns, testData (+5 more)

### Community 44 - "BaseStatusTable.vue"
Cohesion: 0.17
Nodes (12): adjusted, availableSeats, BaseStatusRow, columns, displayData, DisplayRow, highlightClass(), isMobile (+4 more)

### Community 45 - "jetblue.ts"
Cohesion: 0.10
Nodes (40): ImportField, importFieldLabel(), matchingColumns(), normalizeHeader(), preparedColumn(), preparedColumnId(), deepFreeze(), sourceSheet (+32 more)

### Community 46 - "TrajectoryDemo.vue"
Cohesion: 0.17
Nodes (12): activePreset, chartData, chartOptions, container, generateTrajectory(), growthRate, legendItems, qualificationScope (+4 more)

### Community 47 - "seniority-analysis/math.ts"
Cohesion: 0.25
Nodes (18): isRetiredBy(), calculateAdditionalSeniorityPilots(), calculateRetirementCountProjection(), calculateSeniorityPercentile(), calculateSeniorityRank(), calculateSeniorityTrajectory(), calculateSeniorityTrajectoryComparison(), calculateTrajectoryChanges() (+10 more)

### Community 48 - "UploadColumnMapper.vue"
Cohesion: 0.33
Nodes (5): columnOptions, emit, props, requiredFields, updateOption()

### Community 49 - "useUserStore"
Cohesion: 0.09
Nodes (27): dismissBanner(), emit, props, { showBanner, dismiss, exit }, mockEmitHook, mockGetPreference, mockSavePreference, mockSeniorityLists (+19 more)

### Community 50 - "pages/index.vue"
Cohesion: 0.12
Nodes (16): BASE_QUAL_SCALES, config, dataOwnershipItems, demoAgeBuckets, demoAgeData, demoEntering, demoProjection, demoProjectionYears (+8 more)

### Community 51 - "seniority-compare.ts"
Cohesion: 0.18
Nodes (9): DELETED_KINDS, emptyResult, CompareResult, DepartedPilot, Entry, NewHire, QualMove, RankChange (+1 more)

### Community 52 - "_useFileIO"
Cohesion: 0.19
Nodes (18): useSeniorityUpload(), clearUploadType(), reset(), resetDownstream(), selectUploadType(), toConfirmedMappings(), _useColumnMapping(), apply() (+10 more)

### Community 53 - "demographics.ts"
Cohesion: 0.16
Nodes (19): computeYOSDate(), AGE_BUCKETS, analyzeAgeDistribution(), analyzeQualificationComposition(), analyzeYearsOfServiceBuckets(), analyzeYearsOfServiceDistribution(), findCaptainQualificationThresholds(), asOfDate (+11 more)

### Community 54 - "scripts/tsconfig.json"
Cohesion: 0.22
Nodes (8): ../tsconfig.json, compilerOptions, baseUrl, paths, types, exclude, extends, include

### Community 55 - "useQualFilter.test.ts"
Cohesion: 0.22
Nodes (8): mockStore, mockUserStore, _resetCoreSingletons(), mockStore, mockUserStore, mockStore, mockUserStore, resetMockStores()

### Community 56 - "sortableHeader.ts"
Cohesion: 0.38
Nodes (3): sortableHeader(), @tanstack/vue-table@^8.21.3, @tanstack/vue-table

### Community 57 - "SettingsPreferencesCard.vue"
Cohesion: 0.25
Nodes (6): loading, { retirementAge, savePreference }, state, toast, UpdatePreferencesSchema, UpdatePreferencesState

### Community 58 - "Wayfinder Child Ticket"
Cohesion: 0.20
Nodes (11): Wayfinder Child Ticket, Ticket Claim, Frontier Query, GitHub CLI, GitHub Issue Tracker, GitHub Issues, GitHub Native Issue Dependencies, Pull Requests (+3 more)

### Community 59 - "RetirementSnapshot.vue"
Cohesion: 0.22
Nodes (9): columns, formatDate(), maxYears, PresentedSeniorityTrajectoryPoint, props, SeniorityTrajectoryPoint, TableRow, yearsToShow (+1 more)

### Community 60 - "snapshot.ts"
Cohesion: 0.09
Nodes (32): accentVariant, emit, employeeNumber, loading, onSave(), { savePreference }, toast, validationError (+24 more)

### Community 61 - "SeniorityComparison.vue"
Cohesion: 0.20
Nodes (9): chartData, chartOptions, { colors }, compareScope, currentScope, defaultScope, props, qualificationScopeOptions (+1 more)

### Community 62 - "RetirementsTab.test.ts"
Cohesion: 0.25
Nodes (4): entries(), mockStoreState, mockUpcomingRetirements, sampleRows

### Community 63 - "InstallBanner.vue"
Cohesion: 0.47
Nodes (5): dismissBanner(), emit, props, { showBanner, isIos, showIosModal, install, snooze, dismiss }, snoozeBanner()

### Community 64 - "demo-enter.test.ts"
Cohesion: 0.33
Nodes (5): Handler, mockNavigateTo, mockSeniorityStore, mockUserStore, runtimeHandlers

### Community 65 - "useSeniorityCore.ts"
Cohesion: 0.25
Nodes (6): birthDate, enabled, log, selectedBase, selectedFleet, selectedSeat

### Community 66 - "factories.ts"
Cohesion: 0.12
Nodes (15): stubs, mockStore, mockLoadPreferences, mockSavePreference, mockSeniorityEntries, mockUserStore, makeDomainEntry(), makeEntry() (+7 more)

### Community 67 - "theme.vue"
Cohesion: 0.25
Nodes (7): componentColors, iconColors, retirementTokens, semanticColors, shades, surfaceTokens, textTokens

### Community 68 - "Domain Docs"
Cohesion: 0.25
Nodes (6): Architecture Decision Records, CONTEXT-MAP.md, CONTEXT.md, Domain Docs, Canonical Triage Roles, Triage Labels

### Community 69 - "QualSizesCard.vue"
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

### Community 75 - "formatDate"
Cohesion: 0.14
Nodes (9): columns, TableRow, birthDateModel, { employeeNumber }, { newHire: newHireMode }, birthDateModel, { newHire: newHireMode }, toast (+1 more)

### Community 76 - "QualFilterBar.vue"
Cohesion: 0.33
Nodes (3): base, fleet, seat

### Community 77 - "BaseSeatBreakdown.vue"
Cohesion: 0.33
Nodes (4): BaseSeatRow, columns, props, tabs

### Community 79 - "ShareButton.vue"
Cohesion: 0.33
Nodes (4): attrs, buttonProps, props, shareData

### Community 80 - "import-pipeline/types.ts"
Cohesion: 0.11
Nodes (15): FilePhase, log, DecodedWorkbook, DecodeError, DecodeWorkbookResult, ImportDiagnosticTrace, MappedEntryTransformationInput, SourceCellValue (+7 more)

### Community 81 - "usePwaInstall.test.ts"
Cohesion: 0.22
Nodes (5): lastSeenDate, mountComposable(), useChangelog(), mockUserStore, mountComposable()

### Community 82 - "demo-exit.test.ts"
Cohesion: 0.21
Nodes (8): registerDemoEnterHook(), registerDemoExitHook(), Handler, mockNavigateTo, mockSeniorityStore, mockUserStore, runtimeHandlers, defineHook()

### Community 83 - "useListManagement"
Cohesion: 0.40
Nodes (5): getDropdownItems(), useListManagement(), confirmDelete(), openEdit(), saveEdit()

### Community 84 - "changelog.md"
Cohesion: 0.33
Nodes (5): April 26, 2026, August 12, 2026, March 25, 2026, March 26, 2026, March 30, 2026

### Community 86 - "vue-chartjs"
Cohesion: 0.17
Nodes (10): chartData, chartOptions, { defaults, colors }, props, chartData, chartOptions, { defaults, colors }, props (+2 more)

### Community 87 - "PercentileThresholdCalculator.vue"
Cohesion: 0.50
Nodes (4): emit, handlePercentileChange(), props, sliderValue

### Community 90 - "DemographicsTab.vue"
Cohesion: 0.17
Nodes (11): ageDistribution, captainQualificationThresholds, demographicsResult, { hasData, newHire, analysis, anchoredAnalysis, userEntry }, qualificationComposition, qualificationFilter, ready, { retirementAge } (+3 more)

### Community 91 - "SupportModal.vue"
Cohesion: 0.40
Nodes (3): bmcUrl, config, feedbackEmail

### Community 92 - "Import Plugin"
Cohesion: 0.50
Nodes (5): Entry Patch, Import Pipeline, Import Plugin, Preparation Patch, Import Plugin Lifecycle

### Community 95 - "tsconfig.json"
Cohesion: 0.50
Nodes (3): ./.nuxt/tsconfig.json, exclude, extends

### Community 98 - "utils/temporal.ts"
Cohesion: 0.14
Nodes (16): log, createConfirm(), mockStore, _useConfirm(), save(), expectedAdaptedEntry, mockDb, mockEmitHook (+8 more)

### Community 99 - "seniority/index.ts"
Cohesion: 0.31
Nodes (8): entryValues(), useQualificationFilter(), useSeniorityCore(), BaseStatusRow, RankCardData, RetirementSnapshotData, StatCard, useStanding()

### Community 101 - "vitest"
Cohesion: 0.09
Nodes (14): BannerVm, { mockSavePreference, mockToastAdd }, demographicsPresentation, demographicsResult, mockQualFilter, CardVm, { mockSavePreference, mockToastAdd }, CardVm (+6 more)

### Community 106 - "utils/seniority.test.ts"
Cohesion: 0.33
Nodes (3): asOfDate, assertPublicCapabilityAndReadonlyTypes(), entries

### Community 139 - "app_utils_temporal_temporal"
Cohesion: 0.36
Nodes (5): effectiveDateModel, dateValueToPlainDate(), plainDateToDateValue(), memoizeLast(), stableStringify()

### Community 169 - "RecentListsTimeline.vue"
Cohesion: 0.33
Nodes (4): { deleteList }, deletingId, ListItem, toast

### Community 170 - "useTrajectory.test.ts"
Cohesion: 0.47
Nodes (5): mockStore, mockUserStore, useTrajectory(), computeComparativeTrajectory(), computeRetirementProjection()

## Knowledge Gaps
- **30 isolated node(s):** `../tsconfig.json`, `./.nuxt/tsconfig.json`, `All User Agents`, `Site-wide Access`, `Local-first Architecture` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 798 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `logger.ts`, `parse.ts`, `pages/dashboard.vue`, `analysis.ts`, `upload/index.ts`, `QualSeniorityScale.vue`, `app_utils_temporal_temporal`, `lens.test.ts`, `node_modules_pnpm_vue_3_5_41_typescript_5_9_3_node_modules_vue_index`, `date/index.ts`, `useSeniorityStore`, `fields.ts`, `process-confirmed-mappings.ts`, `demo-enter.ts`, `_useReview.ts`, `UploadReviewTable.vue`, `lists.vue`, `useClearAllData.ts`, `isStandaloneMode`, `utils/hooks.ts`, `import-attempts.ts`, `generate-demo-v2.ts`, `parse-spreadsheet.ts`, `package.json`, `ComparisonDiffTab.test.ts`, `@nuxt/ui`, `useTrajectory.test.ts`, `jetblue.ts`, `seniority-analysis/math.ts`, `useUserStore`, `seniority-compare.ts`, `demographics.ts`, `useQualFilter.test.ts`, `sortableHeader.ts`, `snapshot.ts`, `RetirementsTab.test.ts`, `demo-enter.test.ts`, `factories.ts`, `MobileBottomBar.test.ts`, `formatDate`, `import-pipeline/types.ts`, `usePwaInstall.test.ts`, `demo-exit.test.ts`, `SupportModal.vue`, `TabChips.test.ts`, `utils/temporal.ts`, `useTableFeatures.ts`, `utils/seniority.test.ts`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `useSeniorityStore` (e.g. with `clearAll()` and `clearStore()`) actually correct?**
  _`useSeniorityStore` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `../tsconfig.json`, `./.nuxt/tsconfig.json`, `All User Agents` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `logger.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Why does `chart.js` connect `formatYear` to `RetirementComparison.vue`, `DashboardChart.vue`, `package.json`, `TrajectoryDemo.vue`, `vue-chartjs`, `SeniorityComparison.vue`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `SeniorityEntry` (e.g. with `Implementation Decisions` and `User Stories`) actually correct?**
  _`SeniorityEntry` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `lens.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09696969696969697 - nodes in this community are weakly interconnected._