# Graph Report - upload-column-suggestion-labels-impl  (2026-10-31)

## Corpus Check
- 313 files · ~108,737 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: (none) 7, .csv 3, .toml 1)

## Summary
- 1805 nodes · 4035 edges · 143 communities (92 shown, 51 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 150 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3d76e5b5`
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
- QualSeniorityScale.vue
- SeniorityListViewer.vue
- AnchoredSeniorityLens
- upload.test.ts
- utils/temporal.ts
- useSeniorityStore
- lens.test.ts
- _useConfirm.ts
- import-pipeline/types.ts
- GrowthBar.vue
- TrajectoryTab.vue
- SeniorityGuru
- formatYear
- demo-enter.ts
- SeniorityEntryInput
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
- seniority-list.ts
- build-diff-rows.test.ts
- useDemoBanner.ts
- pages/index.vue
- seniority-compare.ts
- logger.ts
- TrajectoryDeltaSparkline.vue
- scripts/tsconfig.json
- useSeniorityCore.ts
- sortableHeader.ts
- AgeDistributionChart.vue
- Wayfinder Child Ticket
- RetirementSnapshot.vue
- snapshot.ts
- SeniorityComparison.vue
- RetirementsTab.test.ts
- usePwaInstall
- TrajectoryChart.vue
- DiffRow
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
- BaseSeatBreakdown.vue
- pnpm-workspace.yaml
- ShareButton.vue
- _useFileIO.ts
- useChangelog.test.ts
- compare.test.ts
- seniority.demographics.test.ts
- changelog.md
- @faker-js/faker
- chart.js
- PercentileThresholdCalculator.vue
- DemographicsTab.vue
- Import Plugin
- tsconfig.json
- TabChips.test.ts
- AppButtonToggle.vue
- db.ts
- seniority/index.ts
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
- RecentListsTimeline.vue
- useTrajectory.ts

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

## Communities (143 total, 51 thin omitted)

### Community 0 - "usePwaInstall.ts"
Cohesion: 0.31
Nodes (4): BeforeInstallPromptEvent, deferredInstallPrompt, sharedShowIosModal, isStandaloneMode()

### Community 1 - "RetirementComparison.vue"
Cohesion: 0.20
Nodes (10): chartData, chartOptions, { colors }, compareScope, currentScope, props, qualificationScopeOptions, { scopeOptions, specForLabel } (+2 more)

### Community 2 - "lens.ts"
Cohesion: 0.09
Nodes (38): computeYOSDate(), EntryPredicate, SeniorityTrajectoryPoint, TrajectoryChange, AGE_BUCKETS, analyzeAgeDistribution(), analyzeQualificationComposition(), analyzeYearsOfServiceBuckets() (+30 more)

### Community 3 - "parse.ts"
Cohesion: 0.08
Nodes (32): columnLabels, ColumnOption, emit, props, requiredFields, updateOption(), EXCEL_EPOCH_MS, ISO_DATE_REGEX (+24 more)

### Community 4 - "package.json"
Cohesion: 0.08
Nodes (34): dependencies, better-sqlite3@^12.8.0, dexie@^4.3.0, @fontsource/jetbrains-mono@^5.2.8, @fontsource-variable/dm-sans@^5.2.8, @internationalized/date@^3.12.0, nuxt@^4.5.2, @nuxt/content@^3.12.0 (+26 more)

### Community 5 - "pages/dashboard.vue"
Cohesion: 0.11
Nodes (18): { activeTab, tabs }, activeTabLabel, { chartData: trajectoryChartData, changes: trajectoryChanges }, compactNotice, compactNoticeDismissed, dashboardControlsOpen, { employeeNumber }, fullBleedTabs (+10 more)

### Community 6 - "upload.vue"
Cohesion: 0.08
Nodes (19): activeFilterLabel, activeRowFilter, canAdvance, changeFormat(), clearRowFilter(), currentStep, currentStepIndex, files (+11 more)

### Community 7 - "RetirementsTab.vue"
Cohesion: 0.10
Nodes (20): availableBases, availableFleets, availableSeats, baseItems, columns, filterBase, filterFleet, filterSeat (+12 more)

### Community 8 - "analysis.ts"
Cohesion: 0.08
Nodes (52): useScopeFilter(), RetirementCountProjection, SeniorityTrajectory, SeniorityTrajectoryComparison, formatQualification(), formatQualificationScope(), formatSeniorityCount(), formatSeniorityRankChange() (+44 more)

### Community 9 - "upload/index.ts"
Cohesion: 0.15
Nodes (15): DEFAULT_COLUMN_MAP, DEFAULT_MAPPING_OPTIONS, ColumnSource, MappingPhase, ProcessingPhase, ProgressTracker, SeniorityUpload, UploadColumnMap (+7 more)

### Community 10 - "QualSeniorityScale.vue"
Cohesion: 0.20
Nodes (5): props, rowMaxCounts, sortedPositions, SEAT_ORDER, sortQualificationPositions()

### Community 11 - "SeniorityListViewer.vue"
Cohesion: 0.06
Nodes (33): canInsert, columns, columnVisibility, currentPage, { employeeNumber }, expanded, focusUserPage(), globalFilter (+25 more)

### Community 12 - "AnchoredSeniorityLens"
Cohesion: 0.06
Nodes (16): AnchorNotFoundError, commonLensMethods(), SeniorityLensImplementation, assertAnchoredLensCapabilities(), assertOrganizationLensCapabilities(), AnchoredSeniorityLens, CommonSeniorityLens, Qualification (+8 more)

### Community 14 - "utils/temporal.ts"
Cohesion: 0.16
Nodes (24): effectiveDateModel, formatMonthYear(), todayISO(), addYearsDate(), addYearsISO(), computeRetireDate(), computeYOS(), currentYear() (+16 more)

### Community 15 - "useSeniorityStore"
Cohesion: 0.15
Nodes (22): useSeniorityCompare(), fetchListData(), loadComparison(), useSeniorityLists(), clearStore(), fetchEntries(), fetchLists(), updateList() (+14 more)

### Community 16 - "lens.test.ts"
Cohesion: 0.18
Nodes (10): useGrowthAssumptions(), calculateAdditionalSeniorityPilots(), DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS, createSeniorityLens(), asOfDate, createOrganizationLens(), entries, snapshot (+2 more)

### Community 17 - "_useConfirm.ts"
Cohesion: 0.17
Nodes (11): createUploadSession(), createMapping(), { mockProcessConfirmedMappings }, log, createConfirm(), mockStore, _useConfirm(), createFileIO() (+3 more)

### Community 18 - "import-pipeline/types.ts"
Cohesion: 0.11
Nodes (25): ImportField, validateImportEntry(), cloneAndFreeze(), columnValue(), entryPatchSchema, importIssueSchema, mapEntry(), mapField() (+17 more)

### Community 19 - "GrowthBar.vue"
Cohesion: 0.40
Nodes (4): emit, enabled, props, sliderValue

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
Cohesion: 0.15
Nodes (14): { defaults, colors }, props, trajectoryChartData, trajectoryChartOptions, waveChartData, waveChartOptions, chartData, chartOptions (+6 more)

### Community 23 - "demo-enter.ts"
Cohesion: 0.18
Nodes (10): registerDemoEnterHook(), Handler, mockNavigateTo, mockSeniorityStore, mockUserStore, runtimeHandlers, localEntryToSeniorityEntry(), DEMO_EMPLOYEE_NUMBER (+2 more)

### Community 24 - "SeniorityEntryInput"
Cohesion: 0.19
Nodes (4): ConfirmPhase, ReviewPhase, log, SeniorityEntryInput

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
Cohesion: 0.19
Nodes (10): SeniorityListSummary, columns, { editOpen, saving, editState, deleteOpen, deleting, deleteTarget, openEdit, saveEdit, confirmDelete, doDelete }, { lists, listsLoading, listsError, fetchLists, deleteList: storeDeleteList, updateList: storeUpdateList }, log, SeniorityList, {
  tableRef: listsTable,
  globalFilter,
  sorting,
  pagination,
  paginationOptions,
  currentPage,
  pageCount,
  totalRows,
}, toast (+2 more)

### Community 29 - "useUserStore"
Cohesion: 0.16
Nodes (16): clearAll(), { clearAllData }, confirm, loading, toast, mockImportAttemptsStore, mockSeniorityStore, mockUserStore (+8 more)

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
Cohesion: 0.16
Nodes (13): attempts, useImportAttempts(), exportAttempt(), load(), remove(), update(), log, newestFirst() (+5 more)

### Community 34 - "user.ts"
Cohesion: 0.24
Nodes (9): log, ImportMappingPreference, ImportMappingPreferenceSchema, ImportMappingsSchema, NewHireConfig, NewHireConfigSchema, PREFERENCE_DESERIALIZERS, PREFERENCE_SERIALIZERS (+1 more)

### Community 35 - "generate-demo-v2.ts"
Cohesion: 0.08
Nodes (22): test, FIXTURE, uploadTestList(), MOBILE_VIEWPORT, config, manifest, @playwright/test, applyNewHires() (+14 more)

### Community 36 - "PositionTab.vue"
Cohesion: 0.14
Nodes (14): userYos, { employeeNumber }, growthAssumptions, { hasData, newHire, anchoredAnalysis, projectionEndDate }, hasEmployeeNumber, hasProjection, positionSliderMax, positionYearsInput (+6 more)

### Community 37 - "UploadColumnMapper.test.ts"
Cohesion: 0.20
Nodes (6): columnMap, Item, mappingOptions, USelectMenu, mockUserStore, mountComposable()

### Community 38 - "devDependencies"
Cohesion: 0.07
Nodes (28): devDependencies, @commitlint/cli@^20.4.3, @commitlint/config-conventional@^20.4.3, eslint@^9.39.4, fake-indexeddb@^6.2.5, happy-dom@^20.8.3, @iconify-json/lucide@^1.2.96, @nuxt/eslint@^1.15.2 (+20 more)

### Community 39 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dev:debug, fuzz, generate, lint, lint:fix (+7 more)

### Community 40 - "ComparisonDiffTab.vue"
Cohesion: 0.15
Nodes (10): badgeLabel(), filteredRows, isEmpty, page, PAGE_SIZE_OPTIONS, pageSize, paginatedRows, props (+2 more)

### Community 41 - "registry.ts"
Cohesion: 0.18
Nodes (7): config, emit, feedbackEmail, infoUploadType, props, showInfoModal, importPlugins

### Community 42 - "ComparisonDiffTab.test.ts"
Cohesion: 0.22
Nodes (4): DepartedRow, QualMoveRow, RetiredRow, SeniorityNumberChangeRow

### Community 43 - "ComparisonTab.test.ts"
Cohesion: 0.17
Nodes (11): activeFilters, filteredData, filterOptions, props, table, ComparisonTabExposed, testColumns, testData (+3 more)

### Community 44 - "BaseStatusTable.vue"
Cohesion: 0.17
Nodes (12): adjusted, availableSeats, BaseStatusRow, columns, displayData, DisplayRow, highlightClass(), isMobile (+4 more)

### Community 45 - "fields.ts"
Cohesion: 0.05
Nodes (64): loading, { retirementAge, savePreference }, state, toast, UpdatePreferencesSchema, UpdatePreferencesState, draftSchema, ImportDiagnosticTraceSchema (+56 more)

### Community 46 - "TrajectoryDemo.vue"
Cohesion: 0.17
Nodes (12): activePreset, chartData, chartOptions, container, generateTrajectory(), growthRate, legendItems, qualificationScope (+4 more)

### Community 47 - "seniority-list.ts"
Cohesion: 0.11
Nodes (38): isRetiredBy(), SeniorityEntry, GrowthAssumptions, calculateRetirementCountProjection(), CalculateRetirementCountProjectionOptions, calculateSeniorityPercentile(), calculateSeniorityRank(), calculateSeniorityTrajectory() (+30 more)

### Community 48 - "build-diff-rows.test.ts"
Cohesion: 0.22
Nodes (3): diffRows, buildDiffRows(), emptyResult

### Community 49 - "useDemoBanner.ts"
Cohesion: 0.17
Nodes (12): dismissBanner(), emit, props, { showBanner, dismiss, exit }, mockEmitHook, mockGetPreference, mockSavePreference, mockSeniorityLists (+4 more)

### Community 50 - "pages/index.vue"
Cohesion: 0.11
Nodes (16): BASE_QUAL_SCALES, config, dataOwnershipItems, demoAgeBuckets, demoAgeData, demoEntering, demoProjection, demoProjectionYears (+8 more)

### Community 51 - "seniority-compare.ts"
Cohesion: 0.33
Nodes (8): DELETED_KINDS, CompareResult, DepartedPilot, Entry, NewHire, QualMove, RetiredPilot, SeniorityNumberChange

### Community 52 - "logger.ts"
Cohesion: 0.11
Nodes (33): downloadLog(), entryCount, useSeniorityUpload(), clearUploadType(), reset(), resetDownstream(), selectUploadType(), toConfirmedMappings() (+25 more)

### Community 53 - "TrajectoryDeltaSparkline.vue"
Cohesion: 0.33
Nodes (5): bestYear, chartData, chartOptions, { colors }, props

### Community 54 - "scripts/tsconfig.json"
Cohesion: 0.22
Nodes (8): ../tsconfig.json, compilerOptions, baseUrl, paths, types, exclude, extends, include

### Community 55 - "useSeniorityCore.ts"
Cohesion: 0.11
Nodes (20): entryValues(), mockStore, mockUserStore, useQualificationFilter(), birthDate, enabled, log, NewHireControls (+12 more)

### Community 56 - "sortableHeader.ts"
Cohesion: 0.38
Nodes (3): sortableHeader(), @tanstack/vue-table@^8.21.3, @tanstack/vue-table

### Community 57 - "AgeDistributionChart.vue"
Cohesion: 0.40
Nodes (4): chartData, chartOptions, { defaults, colors }, props

### Community 58 - "Wayfinder Child Ticket"
Cohesion: 0.20
Nodes (11): Wayfinder Child Ticket, Ticket Claim, Frontier Query, GitHub CLI, GitHub Issue Tracker, GitHub Issues, GitHub Native Issue Dependencies, Pull Requests (+3 more)

### Community 59 - "RetirementSnapshot.vue"
Cohesion: 0.22
Nodes (8): columns, formatDate(), maxYears, PresentedSeniorityTrajectoryPoint, props, SeniorityTrajectoryPoint, TableRow, yearsToShow

### Community 60 - "snapshot.ts"
Cohesion: 0.06
Nodes (51): accentVariant, emit, employeeNumber, loading, onSave(), { savePreference }, toast, validationError (+43 more)

### Community 61 - "SeniorityComparison.vue"
Cohesion: 0.20
Nodes (9): chartData, chartOptions, { colors }, compareScope, currentScope, defaultScope, props, qualificationScopeOptions (+1 more)

### Community 62 - "RetirementsTab.test.ts"
Cohesion: 0.25
Nodes (4): entries(), mockStoreState, mockUpcomingRetirements, sampleRows

### Community 63 - "usePwaInstall"
Cohesion: 0.25
Nodes (8): dismissBanner(), emit, props, { showBanner, isIos, showIosModal, install, snooze, dismiss }, snoozeBanner(), usePwaInstall(), snooze(), addLocalCalendarDays()

### Community 64 - "TrajectoryChart.vue"
Cohesion: 0.40
Nodes (4): chartData, chartOptions, { colors }, props

### Community 66 - "factories.ts"
Cohesion: 0.12
Nodes (15): stubs, mockStore, mockLoadPreferences, mockSavePreference, mockSeniorityEntries, mockUserStore, makeDomainEntry(), makeEntry() (+7 more)

### Community 67 - "theme.vue"
Cohesion: 0.25
Nodes (7): componentColors, iconColors, retirementTokens, semanticColors, shades, surfaceTokens, textTokens

### Community 68 - "Domain Docs"
Cohesion: 0.25
Nodes (6): Architecture Decision Records, CONTEXT-MAP.md, CONTEXT.md, Domain Docs, Canonical Triage Roles, Triage Labels

### Community 69 - "@nuxt/ui"
Cohesion: 0.17
Nodes (10): columns, TableRow, ByBase, columns, props, QualificationComposition, rows, SizeRow (+2 more)

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
Cohesion: 0.10
Nodes (19): birthDateModel, { employeeNumber }, { newHire: newHireMode }, birthDateModel, { newHire: newHireMode }, toast, save(), useDashboardListSelection() (+11 more)

### Community 76 - "QualFilterBar.vue"
Cohesion: 0.33
Nodes (3): base, fleet, seat

### Community 77 - "BaseSeatBreakdown.vue"
Cohesion: 0.33
Nodes (4): BaseSeatRow, columns, props, tabs

### Community 79 - "ShareButton.vue"
Cohesion: 0.33
Nodes (4): attrs, buttonProps, props, shareData

### Community 80 - "_useFileIO.ts"
Cohesion: 0.13
Nodes (10): FilePhase, log, DecodedWorkbook, DecodeWorkbookResult, SourceCellValue, decodeSheet(), decodeWorkbook(), normalizeCell() (+2 more)

### Community 81 - "useChangelog.test.ts"
Cohesion: 0.40
Nodes (3): lastSeenDate, mountComposable(), useChangelog()

### Community 83 - "seniority.demographics.test.ts"
Cohesion: 0.50
Nodes (3): asOfDate, entries, options

### Community 84 - "changelog.md"
Cohesion: 0.33
Nodes (5): April 26, 2026, August 12, 2026, March 25, 2026, March 26, 2026, March 30, 2026

### Community 86 - "chart.js"
Cohesion: 0.20
Nodes (6): chartData, chartOptions, { defaults, colors }, props, chart.js@^4.5.1, chart.js

### Community 87 - "PercentileThresholdCalculator.vue"
Cohesion: 0.50
Nodes (4): emit, handlePercentileChange(), props, sliderValue

### Community 90 - "DemographicsTab.vue"
Cohesion: 0.17
Nodes (11): ageDistribution, captainQualificationThresholds, demographicsResult, { hasData, newHire, analysis, anchoredAnalysis, userEntry }, matchingPilotCount, qualificationComposition, qualificationFilter, ready (+3 more)

### Community 92 - "Import Plugin"
Cohesion: 0.50
Nodes (5): Entry Patch, Import Pipeline, Import Plugin, Preparation Patch, Import Plugin Lifecycle

### Community 95 - "tsconfig.json"
Cohesion: 0.50
Nodes (3): ./.nuxt/tsconfig.json, exclude, extends

### Community 98 - "db.ts"
Cohesion: 0.12
Nodes (13): ImportAttemptInput, expectedAdaptedEntry, mockDb, mockEmitHook, mockList1, mockList2, mockLocalEntry, db (+5 more)

### Community 99 - "seniority/index.ts"
Cohesion: 0.25
Nodes (10): accentVariant, animatedPercentile, props, rank, yearsOfService, BaseStatusRow, RankCardData, RetirementSnapshotData (+2 more)

### Community 100 - "node_modules_pnpm_vue_3_5_41_typescript_5_9_3_node_modules_vue_index"
Cohesion: 0.15
Nodes (11): demographicsPresentation, demographicsResult, { mockAnalysis, mockAnchoredAnalysis, mockHasData, mockReady, mockRetirementAge, mockSelectedBase, mockQualificationScope }, { mockAnchoredAnalysis, mockHasData, mockProjectionEndDate }, { mockHasData, mockHasAnchor, mockAnalysis, mockAnchoredAnalysis }, { mockAnalysis, mockHasData }, state, { mockEnabled, mockReset, mockToastAdd } (+3 more)

### Community 101 - "vitest"
Cohesion: 0.09
Nodes (16): BannerVm, { mockSavePreference, mockToastAdd }, mockQualFilter, bmcUrl, config, feedbackEmail, CardVm, { mockSavePreference, mockToastAdd } (+8 more)

### Community 106 - "utils/seniority.test.ts"
Cohesion: 0.33
Nodes (3): asOfDate, assertPublicCapabilityAndReadonlyTypes(), entries

### Community 169 - "RecentListsTimeline.vue"
Cohesion: 0.33
Nodes (4): { deleteList }, deletingId, ListItem, toast

### Community 170 - "useTrajectory.ts"
Cohesion: 0.24
Nodes (7): SeniorityTrajectoryPoint, mockStore, mockUserStore, useTrajectory(), computeComparativeTrajectory(), computeRetirementProjection(), PresentedTrajectoryChange

## Knowledge Gaps
- **30 isolated node(s):** `../tsconfig.json`, `./.nuxt/tsconfig.json`, `All User Agents`, `Site-wide Access`, `Local-first Architecture` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 810 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `usePwaInstall.ts`, `lens.ts`, `parse.ts`, `package.json`, `analysis.ts`, `upload/index.ts`, `QualSeniorityScale.vue`, `upload.test.ts`, `utils/temporal.ts`, `useSeniorityStore`, `lens.test.ts`, `_useConfirm.ts`, `import-pipeline/types.ts`, `demo-enter.ts`, `UploadReviewTable.vue`, `lists.vue`, `useUserStore`, `useSeniorityNav.ts`, `utils/hooks.ts`, `import-attempts.ts`, `generate-demo-v2.ts`, `PositionTab.vue`, `UploadColumnMapper.test.ts`, `devDependencies`, `registry.ts`, `ComparisonDiffTab.test.ts`, `ComparisonTab.test.ts`, `useTrajectory.ts`, `fields.ts`, `seniority-list.ts`, `build-diff-rows.test.ts`, `useDemoBanner.ts`, `pages/index.vue`, `logger.ts`, `useSeniorityCore.ts`, `sortableHeader.ts`, `snapshot.ts`, `RetirementsTab.test.ts`, `factories.ts`, `MobileBottomBar.test.ts`, `parsePlainDate`, `_useFileIO.ts`, `useChangelog.test.ts`, `compare.test.ts`, `seniority.demographics.test.ts`, `TabChips.test.ts`, `db.ts`, `seniority/index.ts`, `node_modules_pnpm_vue_3_5_41_typescript_5_9_3_node_modules_vue_index`, `utils/seniority.test.ts`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `useSeniorityStore` (e.g. with `clearAll()` and `clearStore()`) actually correct?**
  _`useSeniorityStore` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `../tsconfig.json`, `./.nuxt/tsconfig.json`, `All User Agents` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lens.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09143686502177069 - nodes in this community are weakly interconnected._
- **Why does `@nuxt/ui` connect `@nuxt/ui` to `parse.ts`, `package.json`, `upload.vue`, `RetirementsTab.vue`, `ComparisonTab.test.ts`, `BaseStatusTable.vue`, `BaseSeatBreakdown.vue`, `SeniorityListViewer.vue`, `ShareButton.vue`, `UploadReviewTable.vue`, `RetirementSnapshot.vue`, `lists.vue`, `compare.vue`, `useSeniorityNav.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `SeniorityEntry` (e.g. with `Implementation Decisions` and `User Stories`) actually correct?**
  _`SeniorityEntry` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `parse.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08456659619450317 - nodes in this community are weakly interconnected._