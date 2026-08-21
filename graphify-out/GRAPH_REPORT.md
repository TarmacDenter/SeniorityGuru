# Graph Report - local  (2026-08-20)

## Corpus Check
- 304 files · ~98,253 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1634 nodes · 3275 edges · 164 communities (116 shown, 48 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 91 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3f213fa9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- seniority-engine/index.ts
- AnchoredSeniorityLensImpl
- upload.vue
- pages/dashboard.vue
- RetirementsTab.vue
- upload/index.ts
- _useFileIO
- useSeniorityCore.ts
- logger.ts
- SeniorityListViewer.vue
- snapshot.ts
- createLogger
- PositionTab.vue
- parse.ts
- lens.test.ts
- lens.ts
- pages/index.vue
- QualSeniorityScale.vue
- seniority-engine/types.ts
- date/index.ts
- jetblue.ts
- TrajectoryTab.vue
- useSeniorityStore
- compare.vue
- fuzz-data.ts
- parsePlainDate
- formatYear
- UploadReviewTable.vue
- lists.vue
- SeniorityGuru
- user.ts
- parse-spreadsheet.ts
- import-pipeline/types.ts
- process-confirmed-mappings.ts
- todayPlainDate
- utils/temporal.ts
- generate-demo-v2.ts
- RetirementSnapshot.vue
- factories.ts
- fields.ts
- devDependencies
- scripts
- ComparisonDiffTab.vue
- DemographicsTab.vue
- useUserStore
- GrowthBar.vue
- ComparisonTab.vue
- BaseStatusTable.vue
- TrajectoryDemo.vue
- useImportAttemptsStore
- seniority-list.ts
- EmployeeNumberBanner.vue
- useSeniorityCore.test.ts
- FilePhase
- scripts/tsconfig.json
- RetirementComparison.vue
- normalizeEmployeeNumber
- SettingsPreferencesCard.vue
- Wayfinder Child Ticket
- SeniorityComparison.vue
- JuniorCaptainTable.vue
- usePwaInstall.ts
- seniority-compare.ts
- Review rules
- post-commit
- ComparisonDiffTab.test.ts
- seniority/index.ts
- ImportPlugin
- theme.vue
- Domain Docs
- QualSizesCard.vue
- DashboardChart.vue
- DashboardStatCard.vue
- MobileBottomBar.vue
- TablePagination.vue
- UploadColumnMapper.vue
- QualFilterBar.vue
- BaseSeatBreakdown.vue
- RecentListsTimeline.vue
- ShareButton.vue
- changelog.md
- useChangelog.ts
- useClearAllData.test.ts
- package.json
- AgeDistributionChart.vue
- PercentileThresholdCalculator.vue
- YearsOfServiceBreakdown.vue
- SeniorityRankCard.vue
- formatDate
- SupportModal.vue
- Import Plugin
- upload.ts
- tsconfig.json
- TabChips.vue
- 0001-code-based-import-plugin-lifecycle.md
- AppButtonToggle.vue
- 0002-explicit-import-plugin-selection.md
- memoizeLast
- 0003-separate-import-domain-from-ui.md
- useTableFeatures.ts
- compare.test.ts
- nuxt.config.test.ts
- app.vue
- 0004-immutable-import-pipeline.md
- InfoIcon.vue
- layouts/dashboard.vue
- trajectory-analysis.ts
- robots.txt
- SeniorityGuru Agent Guide
- Local-first Architecture
- SidebarFooter.vue
- SettingsWhatsNewCard.vue
- AppSearchInput.vue
- how-it-works.vue
- whats-new.vue
- @commitlint/config-conventional
- Skills needs-info
- Skills needs-triage
- Skills ready-for-agent
- Skills ready-for-human
- Skills wontfix
- test.ts
- mobile.spec.ts
- pre-push
- happy-dom
- @iconify-json/lucide
- 0005-defer-full-temporal-migration.md
- @playwright/test
- typescript
- vitest
- @vue/test-utils
- vue-tsc
- Import Context
- Seniority Guru Apple Touch Icon
- SeniorityGuru App Icon
- SeniorityGuru Application Icon
- 0006-replace-the-legacy-parser-framework.md
- domain-glossary.md
- post-checkout
- @nuxt/eslint

## God Nodes (most connected - your core abstractions)
1. `parsePlainDate()` - 36 edges
2. `useSeniorityStore` - 35 edges
3. `useSeniorityCore()` - 31 edges
4. `SeniorityEntry` - 31 edges
5. `PlainDate` - 29 edges
6. `useUserStore` - 25 edges
7. `SeniorityEntryInput` - 25 edges
8. `todayPlainDate()` - 22 edges
9. `useImportAttemptsStore` - 21 edges
10. `createLogger()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `TableRow` --references--> `PlainDate`  [EXTRACTED]
  app/components/analytics/JuniorCaptainTable.vue → app/utils/temporal.ts
- `positionScenario` --calls--> `createScenario()`  [EXTRACTED]
  app/components/dashboard/tabs/PositionTab.vue → app/utils/seniority-engine/scenario.ts
- `RetirementTimeline` --calls--> `diffYears()`  [EXTRACTED]
  app/components/seniority/SeniorityListViewer.vue → app/utils/date/math.ts
- `useSeniorityStore` --indirect_call--> `clearAll()`  [INFERRED]
  app/stores/seniority.ts → app/components/settings/SettingsClearDataCard.vue
- `useSeniorityStore` --indirect_call--> `fetchLists()`  [INFERRED]
  app/stores/seniority.ts → app/composables/seniority/modules/useSeniorityLists.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Wayfinding Ticket Flow** — docs_agents_issue_tracker_wayfinder_map, docs_agents_issue_tracker_child_ticket, docs_agents_issue_tracker_native_issue_dependencies, docs_agents_issue_tracker_frontier_query, docs_agents_issue_tracker_claim, docs_agents_issue_tracker_resolve [EXTRACTED 1.00]
- **Canonical Triage Role Mappings** — docs_agents_triage_labels_skills_needs_triage, docs_agents_triage_labels_tracker_needs_triage, docs_agents_triage_labels_skills_needs_info, docs_agents_triage_labels_tracker_needs_info, docs_agents_triage_labels_skills_ready_for_agent, docs_agents_triage_labels_tracker_ready_for_agent, docs_agents_triage_labels_skills_ready_for_human, docs_agents_triage_labels_tracker_ready_for_human, docs_agents_triage_labels_skills_wontfix, docs_agents_triage_labels_tracker_wontfix [EXTRACTED 1.00]

## Communities (164 total, 48 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.05
Nodes (43): better-sqlite3, chart.js, dexie, @fontsource/jetbrains-mono, @fontsource-variable/dm-sans, @internationalized/date, nuxt, @nuxt/content (+35 more)

### Community 1 - "seniority-engine/index.ts"
Cohesion: 0.14
Nodes (24): NewHireControls, useGrowthConfig(), useScopeFilter(), DEFAULT_GROWTH_CONFIG, GrowthConfig, SeniorityEntry, COMPANY_WIDE, enumerateQualSpecs() (+16 more)

### Community 2 - "AnchoredSeniorityLensImpl"
Cohesion: 0.14
Nodes (11): AnchoredSeniorityLensImpl, LensContext, SeniorityLensImpl, DemographicsResult, RetirementProjectionOptions, RetirementProjectionResult, RetirementWaveBucket, Scenario (+3 more)

### Community 3 - "upload.vue"
Cohesion: 0.07
Nodes (24): activeFilterLabel, activeRowFilter, canAdvance, changeFormat(), clearRowFilter(), currentStep, currentStepIndex, effectiveDateModel (+16 more)

### Community 4 - "pages/dashboard.vue"
Cohesion: 0.09
Nodes (22): DASHBOARD_TABS, useDashboardTabs(), useSeniorityNav(), { activeTab, tabs }, { employeeNumber }, fullBleedTabs, { hasData, hasAnchor: userFound, isNewHireMode, newHire, anchoredLens }, hasEmployeeNumber (+14 more)

### Community 5 - "RetirementsTab.vue"
Cohesion: 0.07
Nodes (24): availableBases, availableFleets, availableSeats, baseItems, columns, filterBase, filterFleet, filterSeat (+16 more)

### Community 6 - "upload/index.ts"
Cohesion: 0.11
Nodes (24): columnMap, mappingOptions, DEFAULT_COLUMN_MAP, DEFAULT_MAPPING_OPTIONS, createUploadSession(), MappingPhase, ProcessingPhase, ProgressTracker (+16 more)

### Community 7 - "_useFileIO"
Cohesion: 0.18
Nodes (18): useSeniorityUpload(), clearUploadType(), reset(), resetDownstream(), selectUploadType(), toConfirmedMappings(), _useColumnMapping(), apply() (+10 more)

### Community 8 - "useSeniorityCore.ts"
Cohesion: 0.19
Nodes (12): mockStore, mockUserStore, useQualFilter(), birthDate, enabled, log, selectedBase, selectedFleet (+4 more)

### Community 9 - "logger.ts"
Cohesion: 0.21
Nodes (14): downloadLog(), entryCount, clearLogBuffer(), log(), emit(), exportLogAsText(), getLogBuffer(), LOG_LEVELS (+6 more)

### Community 10 - "SeniorityListViewer.vue"
Cohesion: 0.07
Nodes (29): canInsert, columns, columnVisibility, currentPage, { employeeNumber }, { entries, isNewHireMode }, expanded, focusUserPage() (+21 more)

### Community 11 - "snapshot.ts"
Cohesion: 0.10
Nodes (31): formatIssueMessage(), formatPipelineIssue(), formatSchemaIssues(), isStructuralMessage(), reportReviewChange(), _useReview(), acknowledgePipelineIssues(), deleteErrorRows() (+23 more)

### Community 12 - "createLogger"
Cohesion: 0.19
Nodes (12): clearAll(), { clearAllData }, confirm, loading, toast, useSeniorityCompare(), fetchListData(), loadComparison() (+4 more)

### Community 13 - "PositionTab.vue"
Cohesion: 0.15
Nodes (11): { employeeNumber }, growthConfig, { hasData, newHire, anchoredLens, userEntry }, hasEmployeeNumber, hasProjection, positionScenario, positionYearsInput, projectionYears (+3 more)

### Community 14 - "parse.ts"
Cohesion: 0.18
Nodes (18): EXCEL_EPOCH_MS, ISO_DATE_REGEX, NAMED_MONTH_FORMATS, DATE_PARSERS, DateParser, detectDateFormat(), _detectFormat(), detectFutureDateFormat() (+10 more)

### Community 15 - "lens.test.ts"
Cohesion: 0.09
Nodes (10): AnchorNotFoundError, createLens(), asOfDate, assertBaseLensCapabilities(), entries, makeLens(), snapshot, AnchoredSeniorityLens (+2 more)

### Community 16 - "lens.ts"
Cohesion: 0.17
Nodes (26): addYearsDate(), isRetiredBy(), computeAdditionalPilots(), cellKey(), CreateLensOptions, referenceDate(), computePercentile(), percentileValue() (+18 more)

### Community 17 - "pages/index.vue"
Cohesion: 0.05
Nodes (34): Handler, mockNavigateTo, mockSeniorityStore, mockUserStore, runtimeHandlers, Handler, mockNavigateTo, mockSeniorityStore (+26 more)

### Community 18 - "QualSeniorityScale.vue"
Cohesion: 0.16
Nodes (8): props, rowMaxCounts, sortedScales, SEAT_ORDER, sortQualificationScales(), DensityBucket, QualDemographicScale, QualDemographicSnapshot

### Community 19 - "seniority-engine/types.ts"
Cohesion: 0.16
Nodes (20): computeYOSDate(), AGE_BUCKETS, computeAgeDistribution(), computeQualComposition(), computeYosDistribution(), computeYosHistogram(), findMostJuniorCA(), qualKey() (+12 more)

### Community 20 - "date/index.ts"
Cohesion: 0.26
Nodes (16): addYearsISO(), computeRetireDate(), computeRetireDateValue(), computeYOS(), currentYear(), deriveAge(), diffDateYears(), diffYears() (+8 more)

### Community 21 - "jetblue.ts"
Cohesion: 0.10
Nodes (38): ImportField, importFieldLabel(), matchingColumns(), normalizeHeader(), preparedColumn(), preparedColumnId(), sourceSheet, decomposeDeltaCategory() (+30 more)

### Community 22 - "TrajectoryTab.vue"
Cohesion: 0.10
Nodes (17): {
  chartData: trajectoryChartData,
  computeComparativeTrajectory,
  computeRetirementProjection,
}, growthConfig, { hasData, hasAnchor, entries, lens, anchoredLens }, isBannerDismissed, qualFilter, qualTrajectoryDeltas, { rankCard }, ready (+9 more)

### Community 23 - "useSeniorityStore"
Cohesion: 0.11
Nodes (17): { showBanner, dismiss, exit }, mockStore, useSeniorityLists(), clearStore(), fetchEntries(), fetchLists(), updateList(), mockEmitHook (+9 more)

### Community 24 - "compare.vue"
Cohesion: 0.14
Nodes (18): activeCompareTab, compareTabs, diffRows, { employeeNumber }, listIdA, listIdB, { lists, listOptions, fetchLists }, { loading, error, comparison } (+10 more)

### Community 25 - "fuzz-data.ts"
Cohesion: 0.21
Nodes (19): assignSeat(), baseSamples, baseSampleSizing, buildHireDatePool(), buildSeatCurve(), fakeName(), fuzzRow(), makeEmployeeIdPool() (+11 more)

### Community 26 - "parsePlainDate"
Cohesion: 0.12
Nodes (13): birthDateModel, { newHire: newHireMode }, { mockEnabled, mockReset, mockToastAdd }, toast, log, createConfirm(), mockStore, _useConfirm() (+5 more)

### Community 27 - "formatYear"
Cohesion: 0.12
Nodes (17): { defaults, colors }, props, trajectoryChartData, trajectoryChartOptions, waveChartData, waveChartOptions, chartData, chartOptions (+9 more)

### Community 28 - "UploadReviewTable.vue"
Cohesion: 0.12
Nodes (13): columns, currentPage, displayEntries, editableFields, editingCell, emit, IndexedEntry, pageCount (+5 more)

### Community 29 - "lists.vue"
Cohesion: 0.12
Nodes (15): SeniorityListSummary, columns, { editOpen, saving, editState, deleteOpen, deleting, deleteTarget, openEdit, saveEdit, confirmDelete, doDelete }, filteredLists, getDropdownItems(), { lists, listsLoading, listsError, fetchLists, deleteList: storeDeleteList, updateList: storeUpdateList }, log, SeniorityList (+7 more)

### Community 30 - "SeniorityGuru"
Cohesion: 0.10
Nodes (19): Contributing to SeniorityGuru, Contribution checklist, Import plugins, Commands, Contributing, Git workflow, License, SeniorityGuru (+11 more)

### Community 31 - "user.ts"
Cohesion: 0.20
Nodes (10): log, mockDb, ImportMappingPreference, ImportMappingPreferenceSchema, ImportMappingsSchema, NewHireConfig, NewHireConfigSchema, PREFERENCE_DESERIALIZERS (+2 more)

### Community 32 - "parse-spreadsheet.ts"
Cohesion: 0.36
Nodes (7): applyColumnMap(), autoDetectColumnMap(), ColumnMap, isColumnMapComplete(), MappingOptions, mapSingleRow(), parseSpreadsheetData()

### Community 33 - "import-pipeline/types.ts"
Cohesion: 0.17
Nodes (11): DecodedWorkbook, DecodeError, DecodeWorkbookResult, MappedEntryTransformationInput, SourceCellValue, SourceColumn, SourceRow, decodeSheet() (+3 more)

### Community 34 - "process-confirmed-mappings.ts"
Cohesion: 0.18
Nodes (16): normalizeMappedEntry(), validateImportEntry(), cloneAndFreeze(), columnValue(), entryPatchSchema, importIssueSchema, mapEntry(), mapField() (+8 more)

### Community 35 - "todayPlainDate"
Cohesion: 0.22
Nodes (11): demographicScenario, userYos, positionSliderMax, projectionDate, scopedScenario, projected, tableData, useTrajectory() (+3 more)

### Community 36 - "utils/temporal.ts"
Cohesion: 0.11
Nodes (30): snooze(), ImportAttemptInput, log, newestFirst(), records, compareListsByRecency(), log, expectedAdaptedEntry (+22 more)

### Community 37 - "generate-demo-v2.ts"
Cohesion: 0.21
Nodes (15): applyNewHires(), applyRetirements(), applyTransfers(), applyUpgrades(), BASE_ROTATION, __dirname, isoToMdy(), logger (+7 more)

### Community 38 - "RetirementSnapshot.vue"
Cohesion: 0.22
Nodes (8): columns, maxYears, props, tableData, TableRow, TrajectoryPoint, yearsToShow, formatRankDelta()

### Community 39 - "factories.ts"
Cohesion: 0.15
Nodes (13): state, stubs, mockLoadPreferences, mockSavePreference, mockSeniorityEntries, mockUserStore, makeDomainEntry(), makeEntry() (+5 more)

### Community 40 - "fields.ts"
Cohesion: 0.11
Nodes (20): draftSchema, ImportDiagnosticTraceSchema, importIssueSchema, mappingSelectionSchema, preparationPatchSchema, preparedColumnSchema, preparedSheetSchema, reviewEditPatchSchema (+12 more)

### Community 41 - "devDependencies"
Cohesion: 0.13
Nodes (15): @commitlint/cli, eslint, fake-indexeddb, @faker-js/faker, @nuxt/test-utils, devDependencies, @commitlint/cli, eslint (+7 more)

### Community 42 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dev:debug, fuzz, generate, lint, lint:fix (+7 more)

### Community 43 - "ComparisonDiffTab.vue"
Cohesion: 0.15
Nodes (10): badgeLabel(), filteredRows, isEmpty, page, PAGE_SIZE_OPTIONS, pageSize, paginatedRows, props (+2 more)

### Community 44 - "DemographicsTab.vue"
Cohesion: 0.13
Nodes (13): ageDistribution, demographicsResult, { hasData, newHire, lens, userEntry }, mostJuniorCAs, qualComposition, qualFilter, ready, { retirementAge } (+5 more)

### Community 45 - "useUserStore"
Cohesion: 0.21
Nodes (12): useUser(), clearPreferences(), loadPreferences(), savePreference(), registerDemoEnterHook(), registerDemoExitHook(), useUserStore, localEntryToSeniorityEntry() (+4 more)

### Community 46 - "GrowthBar.vue"
Cohesion: 0.40
Nodes (4): emit, enabled, props, sliderValue

### Community 47 - "ComparisonTab.vue"
Cohesion: 0.17
Nodes (11): activeFilters, filteredData, filterOptions, props, table, ComparisonTabExposed, testColumns, testData (+3 more)

### Community 48 - "BaseStatusTable.vue"
Cohesion: 0.17
Nodes (12): adjusted, availableSeats, BaseStatusRow, columns, displayData, DisplayRow, highlightClass(), isMobile (+4 more)

### Community 49 - "TrajectoryDemo.vue"
Cohesion: 0.17
Nodes (12): activePreset, chartData, chartOptions, container, generateTrajectory(), growthRate, legendItems, QualKey (+4 more)

### Community 50 - "useImportAttemptsStore"
Cohesion: 0.26
Nodes (8): attempts, useImportAttempts(), exportAttempt(), load(), remove(), update(), useImportAttemptsStore, formatInstantLocal()

### Community 51 - "seniority-list.ts"
Cohesion: 0.11
Nodes (10): mockStore, ConfirmPhase, ReviewPhase, log, makePartialEntry(), DraftSeniorityEntry, EntryPatch, SeniorityEntryInput (+2 more)

### Community 52 - "EmployeeNumberBanner.vue"
Cohesion: 0.18
Nodes (10): accentVariant, emit, employeeNumber, loading, onSave(), { savePreference }, BannerVm, { mockSavePreference, mockToastAdd } (+2 more)

### Community 53 - "useSeniorityCore.test.ts"
Cohesion: 0.24
Nodes (8): _resetCoreSingletons(), mockStore, mockUserStore, mockStore, mockUserStore, mockStore, mockUserStore, resetMockStores()

### Community 55 - "scripts/tsconfig.json"
Cohesion: 0.17
Nodes (11): node, node_modules, **/*.ts, ../tsconfig.json, compilerOptions, baseUrl, paths, types (+3 more)

### Community 56 - "RetirementComparison.vue"
Cohesion: 0.20
Nodes (10): chartData, chartOptions, { colors }, compareScope, currentScope, entriesRef, props, { scopeOptions, specForLabel } (+2 more)

### Community 57 - "normalizeEmployeeNumber"
Cohesion: 0.20
Nodes (9): anchorFound, { employeeNumber: currentEmployeeNumber, savePreference }, employeeNumberInput, loading, onSave(), CardVm, { mockSavePreference, mockToastAdd }, toast (+1 more)

### Community 58 - "SettingsPreferencesCard.vue"
Cohesion: 0.18
Nodes (8): loading, { retirementAge, savePreference }, state, CardVm, { mockSavePreference, mockToastAdd }, toast, UpdatePreferencesSchema, UpdatePreferencesState

### Community 59 - "Wayfinder Child Ticket"
Cohesion: 0.20
Nodes (11): Wayfinder Child Ticket, Ticket Claim, Frontier Query, GitHub CLI, GitHub Issue Tracker, GitHub Issues, GitHub Native Issue Dependencies, Pull Requests (+3 more)

### Community 60 - "SeniorityComparison.vue"
Cohesion: 0.20
Nodes (9): chartData, chartOptions, { colors }, compareScope, currentScope, defaultScope, entriesRef, props (+1 more)

### Community 61 - "JuniorCaptainTable.vue"
Cohesion: 0.40
Nodes (4): columns, props, TableRow, tableRows

### Community 62 - "usePwaInstall.ts"
Cohesion: 0.14
Nodes (9): { showBanner, isIos, showIosModal, install, snooze, dismiss }, mockUserStore, mountComposable(), usePwaInstall(), { mockNavigateTo, mockIsStandalone }, BeforeInstallPromptEvent, deferredInstallPrompt, sharedShowIosModal (+1 more)

### Community 63 - "seniority-compare.ts"
Cohesion: 0.18
Nodes (9): DELETED_KINDS, emptyResult, CompareResult, DepartedPilot, Entry, NewHire, QualMove, RankChange (+1 more)

### Community 64 - "Review rules"
Cohesion: 0.22
Nodes (8): Boundaries, Design quality, Findings, Nuxt and TypeScript, Review process, Review rules, Schemas and domain types, SeniorityGuru code review

### Community 65 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 66 - "ComparisonDiffTab.test.ts"
Cohesion: 0.17
Nodes (6): DepartedRow, QualMoveRow, RankChangeRow, RetiredRow, DiffRow, DEMO_DIFF_ROWS

### Community 67 - "seniority/index.ts"
Cohesion: 0.57
Nodes (5): BaseStatusRow, RankCardData, RetirementSnapshotData, StatCard, useStanding()

### Community 68 - "ImportPlugin"
Cohesion: 0.15
Nodes (8): config, emit, feedbackEmail, infoUploadType, props, showInfoModal, SeniorityUpload, ImportPlugin

### Community 69 - "theme.vue"
Cohesion: 0.25
Nodes (7): componentColors, iconColors, retirementTokens, semanticColors, shades, surfaceTokens, textTokens

### Community 70 - "Domain Docs"
Cohesion: 0.25
Nodes (8): ADR Conflicts, Architecture Decision Records, CONTEXT-MAP.md, CONTEXT.md, Domain Docs, Glossary Vocabulary, Canonical Triage Roles, Triage Labels

### Community 71 - "QualSizesCard.vue"
Cohesion: 0.29
Nodes (6): ByBase, columns, props, QualCompositionRow, rows, SizeRow

### Community 72 - "DashboardChart.vue"
Cohesion: 0.33
Nodes (6): chartComponent, chartComponents, deepMerge(), { defaults }, mergedOptions, props

### Community 73 - "DashboardStatCard.vue"
Cohesion: 0.29
Nodes (5): animatedNumber, displayValue, isAnimating, numericTarget, props

### Community 74 - "MobileBottomBar.vue"
Cohesion: 0.29
Nodes (4): { hasUnseenChanges }, navItems, route, mockRoute

### Community 75 - "TablePagination.vue"
Cohesion: 0.38
Nodes (6): commitGotoPage(), emit, gotoPageInput, handleGotoKeydown(), isMobile, props

### Community 76 - "UploadColumnMapper.vue"
Cohesion: 0.33
Nodes (5): columnOptions, emit, props, requiredFields, updateOption()

### Community 77 - "QualFilterBar.vue"
Cohesion: 0.33
Nodes (3): base, fleet, seat

### Community 78 - "BaseSeatBreakdown.vue"
Cohesion: 0.33
Nodes (4): BaseSeatRow, columns, props, tabs

### Community 79 - "RecentListsTimeline.vue"
Cohesion: 0.33
Nodes (4): { deleteList }, deletingId, ListItem, toast

### Community 80 - "ShareButton.vue"
Cohesion: 0.33
Nodes (4): attrs, buttonProps, props, shareData

### Community 81 - "changelog.md"
Cohesion: 0.33
Nodes (5): April 26, 2026, August 12, 2026, March 25, 2026, March 26, 2026, March 30, 2026

### Community 82 - "useChangelog.ts"
Cohesion: 0.40
Nodes (3): lastSeenDate, mountComposable(), useChangelog()

### Community 83 - "useClearAllData.test.ts"
Cohesion: 0.50
Nodes (3): mockImportAttemptsStore, mockSeniorityStore, mockUserStore

### Community 84 - "package.json"
Cohesion: 0.33
Nodes (5): license, name, packageManager, private, type

### Community 85 - "AgeDistributionChart.vue"
Cohesion: 0.40
Nodes (4): chartData, chartOptions, { defaults, colors }, props

### Community 86 - "PercentileThresholdCalculator.vue"
Cohesion: 0.50
Nodes (4): emit, handlePercentileChange(), props, sliderValue

### Community 87 - "YearsOfServiceBreakdown.vue"
Cohesion: 0.40
Nodes (4): chartData, chartOptions, { defaults, colors }, props

### Community 88 - "SeniorityRankCard.vue"
Cohesion: 0.40
Nodes (4): accentVariant, animatedPercentile, props, yearsOfService

### Community 89 - "formatDate"
Cohesion: 0.16
Nodes (11): birthDateModel, { employeeNumber }, { newHire: newHireMode }, formatDate(), chartData, chartOptions, { colors }, props (+3 more)

### Community 90 - "SupportModal.vue"
Cohesion: 0.40
Nodes (3): bmcUrl, config, feedbackEmail

### Community 91 - "Import Plugin"
Cohesion: 0.50
Nodes (5): Entry Patch, Import Pipeline, Import Plugin, Preparation Patch, Import Plugin Lifecycle

### Community 93 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): ./.nuxt/tsconfig.json, scripts, exclude, extends

### Community 162 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

## Knowledge Gaps
- **641 isolated node(s):** `props`, `{ defaults, colors }`, `chartData`, `chartOptions`, `props` (+636 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CommonSeniorityLens` connect `lens.test.ts` to `seniority-engine/index.ts`, `seniority-engine/types.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `createLogger()` connect `createLogger` to `upload.vue`, `utils/temporal.ts`, `generate-demo-v2.ts`, `upload/index.ts`, `useSeniorityCore.ts`, `logger.ts`, `seniority-list.ts`, `parsePlainDate`, `lists.vue`, `usePwaInstall.ts`, `user.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `useUserStore` connect `useUserStore` to `upload/index.ts`, `_useFileIO`, `useSeniorityCore.ts`, `createLogger`, `useSeniorityStore`, `usePwaInstall.ts`, `user.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `useSeniorityStore` (e.g. with `clearAll()` and `clearStore()`) actually correct?**
  _`useSeniorityStore` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `props`, `{ defaults, colors }`, `chartData` to the rest of the system?**
  _641 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `seniority-engine/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13513513513513514 - nodes in this community are weakly interconnected._