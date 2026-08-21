# Graph Report - local  (2026-08-20)

## Corpus Check
- 304 files · ~98,381 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1633 nodes · 3270 edges · 172 communities (122 shown, 50 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 91 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `68cfe83b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- seniority-engine/index.ts
- Scenario
- upload.vue
- pages/dashboard.vue
- RetirementsTab.vue
- upload/index.ts
- _useFileIO
- useSeniorityCore.ts
- utils/temporal.ts
- SeniorityListViewer.vue
- _useReview
- _useConfirm.ts
- jetblue.ts
- parse.ts
- lens.test.ts
- seniority-math.ts
- utils/hooks.ts
- pages/index.vue
- seniority-engine/types.ts
- date/index.ts
- delta.ts
- TrajectoryTab.vue
- useSeniorityStore
- compare.vue
- fuzz-data.ts
- SettingsNewHireModeCard.vue
- formatYear
- UploadReviewTable.vue
- lists.vue
- SeniorityGuru
- useUserStore
- _useFileIO.ts
- import-pipeline/types.ts
- process-confirmed-mappings.ts
- PositionTab.vue
- seniority.ts
- generate-demo-v2.ts
- RetirementSnapshot.vue
- seniority-list.ts
- fields.ts
- devDependencies
- scripts
- ComparisonDiffTab.vue
- DemographicsTab.vue
- parsePlainDate
- GrowthBar.vue
- ComparisonTab.vue
- BaseStatusTable.vue
- TrajectoryDemo.vue
- useImportAttemptsStore
- ReviewPhase
- EmployeeNumberBanner.vue
- PlainDate
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
- registry.ts
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
- _useFileIO.test.ts
- package.json
- AgeDistributionChart.vue
- PercentileThresholdCalculator.vue
- YearsOfServiceBreakdown.vue
- SeniorityRankCard.vue
- TrajectoryChart.vue
- SupportModal.vue
- Import Plugin
- upload.ts
- tsconfig.json
- TabChips.vue
- 0001-code-based-import-plugin-lifecycle.md
- AppButtonToggle.vue
- 0002-explicit-import-plugin-selection.md
- lens.ts
- 0003-separate-import-domain-from-ui.md
- useTableFeatures.ts
- compare.test.ts
- nuxt.config.test.ts
- app.vue
- 0004-immutable-import-pipeline.md
- InfoIcon.vue
- layouts/dashboard.vue
- snapshot.ts
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
- validate-entries.ts
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
- build-diff-rows.test.ts
- seniority.test.ts
- useUser.test.ts
- decodeWorkbook
- useSeniorityCompare
- ProgressTracker
- SeniorityUpload
- @commitlint/cli

## God Nodes (most connected - your core abstractions)
1. `parsePlainDate()` - 37 edges
2. `useSeniorityStore` - 35 edges
3. `PlainDate` - 32 edges
4. `useSeniorityCore()` - 31 edges
5. `SeniorityEntry` - 31 edges
6. `useUserStore` - 25 edges
7. `SeniorityEntryInput` - 25 edges
8. `todayPlainDate()` - 22 edges
9. `useImportAttemptsStore` - 21 edges
10. `createLogger()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `TableRow` --references--> `PlainDate`  [EXTRACTED]
  app/components/analytics/JuniorCaptainTable.vue → app/utils/temporal.ts
- `bestYear` --calls--> `extractYear()`  [EXTRACTED]
  app/components/dashboard/TrajectoryDeltaSparkline.vue → app/utils/date/math.ts
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

## Communities (172 total, 50 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.05
Nodes (43): better-sqlite3, chart.js, dexie, @fontsource/jetbrains-mono, @fontsource-variable/dm-sans, @internationalized/date, nuxt, @nuxt/content (+35 more)

### Community 1 - "seniority-engine/index.ts"
Cohesion: 0.15
Nodes (18): useGrowthConfig(), useScopeFilter(), DEFAULT_GROWTH_CONFIG, GrowthConfig, COMPANY_WIDE, enumerateQualSpecs(), QualSpec, qualSpecEquals() (+10 more)

### Community 2 - "Scenario"
Cohesion: 0.16
Nodes (8): LensContext, SeniorityLensImpl, DemographicsResult, RetirementProjectionOptions, RetirementProjectionResult, RetirementWaveBucket, Scenario, SenioritySnapshot

### Community 3 - "upload.vue"
Cohesion: 0.07
Nodes (24): activeFilterLabel, activeRowFilter, canAdvance, changeFormat(), clearRowFilter(), currentStep, currentStepIndex, effectiveDateModel (+16 more)

### Community 4 - "pages/dashboard.vue"
Cohesion: 0.09
Nodes (22): DASHBOARD_TABS, useDashboardTabs(), useSeniorityNav(), { activeTab, tabs }, { employeeNumber }, fullBleedTabs, { hasData, hasAnchor: userFound, isNewHireMode, newHire, anchoredLens, projectionEndDate }, hasEmployeeNumber (+14 more)

### Community 5 - "RetirementsTab.vue"
Cohesion: 0.07
Nodes (24): availableBases, availableFleets, availableSeats, baseItems, columns, filterBase, filterFleet, filterSeat (+16 more)

### Community 6 - "upload/index.ts"
Cohesion: 0.20
Nodes (15): DEFAULT_COLUMN_MAP, DEFAULT_MAPPING_OPTIONS, ConfirmPhase, MappingPhase, ProcessingPhase, UploadColumnMap, UploadMappingOptions, UploadSession (+7 more)

### Community 7 - "_useFileIO"
Cohesion: 0.18
Nodes (18): useSeniorityUpload(), clearUploadType(), reset(), resetDownstream(), selectUploadType(), toConfirmedMappings(), _useColumnMapping(), apply() (+10 more)

### Community 8 - "useSeniorityCore.ts"
Cohesion: 0.13
Nodes (20): mockStore, mockUserStore, useQualFilter(), birthDate, enabled, log, _resetCoreSingletons(), selectedBase (+12 more)

### Community 9 - "utils/temporal.ts"
Cohesion: 0.19
Nodes (17): downloadLog(), entryCount, snooze(), clearLogBuffer(), log(), emit(), exportLogAsText(), getLogBuffer() (+9 more)

### Community 10 - "SeniorityListViewer.vue"
Cohesion: 0.07
Nodes (29): canInsert, columns, columnVisibility, currentPage, { employeeNumber }, { entries, isNewHireMode }, expanded, focusUserPage() (+21 more)

### Community 11 - "_useReview"
Cohesion: 0.18
Nodes (18): formatIssueMessage(), formatPipelineIssue(), formatSchemaIssues(), isStructuralMessage(), reportReviewChange(), createReview(), _useReview(), acknowledgePipelineIssues() (+10 more)

### Community 12 - "_useConfirm.ts"
Cohesion: 0.15
Nodes (12): clearAll(), { clearAllData }, confirm, loading, toast, log, mockImportAttemptsStore, mockSeniorityStore (+4 more)

### Community 13 - "jetblue.ts"
Cohesion: 0.18
Nodes (16): genericImportPlugin, aliases, createJetBlueImportPlugin(), hasJetBlueEuMarker(), headerIndex(), jetblueImportPlugin, JetBlueImportPluginOptions, normalize() (+8 more)

### Community 14 - "parse.ts"
Cohesion: 0.16
Nodes (20): EXCEL_EPOCH_MS, ISO_DATE_REGEX, NAMED_MONTH_FORMATS, DATE_PARSERS, DateParser, detectDateFormat(), _detectFormat(), detectFutureDateFormat() (+12 more)

### Community 15 - "lens.test.ts"
Cohesion: 0.12
Nodes (9): AnchorNotFoundError, createLens(), asOfDate, entries, makeLens(), projectionEndDate, snapshot, CommonSeniorityLens (+1 more)

### Community 16 - "seniority-math.ts"
Cohesion: 0.17
Nodes (21): isRetiredBy(), computeAdditionalPilots(), cellKey(), computePercentile(), percentileValue(), projectQualViewer(), entries, applyProjectionToSnapshots() (+13 more)

### Community 17 - "utils/hooks.ts"
Cohesion: 0.10
Nodes (19): Handler, mockNavigateTo, mockSeniorityStore, mockUserStore, runtimeHandlers, registerDemoExitHook(), Handler, mockNavigateTo (+11 more)

### Community 18 - "pages/index.vue"
Cohesion: 0.07
Nodes (24): props, rowMaxCounts, sortedScales, BASE_QUAL_SCALES, config, dataOwnershipItems, demoAgeBuckets, demoAgeData (+16 more)

### Community 19 - "seniority-engine/types.ts"
Cohesion: 0.14
Nodes (17): AGE_BUCKETS, AnchoredSeniorityLensImpl, findThresholdYear(), AgeBucket, FilterFn, MostJuniorCARow, QualCompositionRow, StandingResult (+9 more)

### Community 20 - "date/index.ts"
Cohesion: 0.25
Nodes (18): addYearsDate(), addYearsISO(), computeRetireDate(), computeRetireDateValue(), computeYOS(), currentYear(), deriveAge(), diffDateYears() (+10 more)

### Community 21 - "delta.ts"
Cohesion: 0.22
Nodes (17): importFieldLabel(), matchingColumns(), normalizeHeader(), preparedColumn(), preparedColumnId(), decomposeDeltaCategory(), deltaImportPlugin, headerFields (+9 more)

### Community 22 - "TrajectoryTab.vue"
Cohesion: 0.10
Nodes (17): {
  chartData: trajectoryChartData,
  computeComparativeTrajectory,
  computeRetirementProjection,
}, growthConfig, { hasData, hasAnchor, entries, lens, anchoredLens, projectionEndDate }, isBannerDismissed, qualFilter, qualTrajectoryDeltas, { rankCard }, ready (+9 more)

### Community 23 - "useSeniorityStore"
Cohesion: 0.12
Nodes (17): { showBanner, dismiss, exit }, useSeniorityLists(), clearStore(), fetchEntries(), fetchLists(), updateList(), mockEmitHook, mockGetPreference (+9 more)

### Community 24 - "compare.vue"
Cohesion: 0.15
Nodes (16): activeCompareTab, compareTabs, { employeeNumber }, listIdA, listIdB, { lists, listOptions, fetchLists }, { loading, error, comparison }, route (+8 more)

### Community 25 - "fuzz-data.ts"
Cohesion: 0.21
Nodes (19): assignSeat(), baseSamples, baseSampleSizing, buildHireDatePool(), buildSeatCurve(), fakeName(), fuzzRow(), makeEmployeeIdPool() (+11 more)

### Community 26 - "SettingsNewHireModeCard.vue"
Cohesion: 0.25
Nodes (4): birthDateModel, { newHire: newHireMode }, { mockEnabled, mockReset, mockToastAdd }, toast

### Community 27 - "formatYear"
Cohesion: 0.12
Nodes (16): { defaults, colors }, props, trajectoryChartData, trajectoryChartOptions, waveChartData, waveChartOptions, chartData, chartOptions (+8 more)

### Community 28 - "UploadReviewTable.vue"
Cohesion: 0.12
Nodes (13): columns, currentPage, displayEntries, editableFields, editingCell, emit, IndexedEntry, pageCount (+5 more)

### Community 29 - "lists.vue"
Cohesion: 0.11
Nodes (19): birthDateModel, { employeeNumber }, { newHire: newHireMode }, SeniorityListSummary, columns, { editOpen, saving, editState, deleteOpen, deleting, deleteTarget, openEdit, saveEdit, confirmDelete, doDelete }, filteredLists, getDropdownItems() (+11 more)

### Community 30 - "SeniorityGuru"
Cohesion: 0.10
Nodes (19): Contributing to SeniorityGuru, Contribution checklist, Import plugins, Commands, Contributing, Git workflow, License, SeniorityGuru (+11 more)

### Community 31 - "useUserStore"
Cohesion: 0.16
Nodes (15): useUser(), clearPreferences(), loadPreferences(), savePreference(), log, mockDb, useUserStore, ImportMappingPreference (+7 more)

### Community 32 - "_useFileIO.ts"
Cohesion: 0.26
Nodes (9): log, DecodedWorkbook, applyColumnMap(), autoDetectColumnMap(), ColumnMap, isColumnMapComplete(), MappingOptions, mapSingleRow() (+1 more)

### Community 33 - "import-pipeline/types.ts"
Cohesion: 0.18
Nodes (13): ImportField, ConfirmedMappings, DecodeError, DecodeWorkbookResult, EntryPatch, MappedEntryTransformationInput, PreparationPatch, PrepareImportResult (+5 more)

### Community 34 - "process-confirmed-mappings.ts"
Cohesion: 0.18
Nodes (15): validateImportEntry(), cloneAndFreeze(), columnValue(), entryPatchSchema, importIssueSchema, mapEntry(), mapField(), nextBatch() (+7 more)

### Community 35 - "PositionTab.vue"
Cohesion: 0.13
Nodes (22): demographicScenario, userYos, { employeeNumber }, growthConfig, { hasData, newHire, anchoredLens, projectionEndDate }, hasEmployeeNumber, hasProjection, positionScenario (+14 more)

### Community 36 - "seniority.ts"
Cohesion: 0.15
Nodes (19): mockStore, ImportAttemptInput, log, records, log, ImportAttemptDomain, localImportAttemptToDomain(), localListToSeniorityList() (+11 more)

### Community 37 - "generate-demo-v2.ts"
Cohesion: 0.21
Nodes (15): applyNewHires(), applyRetirements(), applyTransfers(), applyUpgrades(), BASE_ROTATION, __dirname, isoToMdy(), logger (+7 more)

### Community 38 - "RetirementSnapshot.vue"
Cohesion: 0.16
Nodes (11): columns, formatDate(), maxYears, props, tableData, TableRow, TrajectoryPoint, yearsToShow (+3 more)

### Community 39 - "seniority-list.ts"
Cohesion: 0.19
Nodes (10): state, stubs, mockStore, makeDomainEntry(), makeEntry(), makeList(), makePartialEntry(), isCalendarDate() (+2 more)

### Community 40 - "fields.ts"
Cohesion: 0.10
Nodes (21): draftSchema, ImportDiagnosticTraceSchema, importIssueSchema, mappingSelectionSchema, preparationPatchSchema, preparedColumnSchema, preparedSheetSchema, reviewEditPatchSchema (+13 more)

### Community 41 - "devDependencies"
Cohesion: 0.13
Nodes (15): eslint, fake-indexeddb, @faker-js/faker, @nuxt/test-utils, devDependencies, eslint, fake-indexeddb, @faker-js/faker (+7 more)

### Community 42 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dev:debug, fuzz, generate, lint, lint:fix (+7 more)

### Community 43 - "ComparisonDiffTab.vue"
Cohesion: 0.15
Nodes (10): badgeLabel(), filteredRows, isEmpty, page, PAGE_SIZE_OPTIONS, pageSize, paginatedRows, props (+2 more)

### Community 44 - "DemographicsTab.vue"
Cohesion: 0.13
Nodes (13): ageDistribution, demographicsResult, { hasData, newHire, lens, userEntry }, mostJuniorCAs, qualComposition, qualFilter, ready, { retirementAge } (+5 more)

### Community 45 - "parsePlainDate"
Cohesion: 0.21
Nodes (9): { mockAnchoredLens, mockHasData }, save(), registerDemoEnterHook(), localEntryToSeniorityEntry(), DEMO_EMPLOYEE_NUMBER, mdyToISO(), parseDemoCSV(), date() (+1 more)

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
Cohesion: 0.23
Nodes (9): attempts, useImportAttempts(), exportAttempt(), load(), remove(), update(), newestFirst(), useImportAttemptsStore (+1 more)

### Community 52 - "EmployeeNumberBanner.vue"
Cohesion: 0.18
Nodes (10): accentVariant, emit, employeeNumber, loading, onSave(), { savePreference }, BannerVm, { mockSavePreference, mockToastAdd } (+2 more)

### Community 53 - "PlainDate"
Cohesion: 0.22
Nodes (7): NewHireControls, SeniorityEntry, assertBaseLensCapabilities(), QualViewerOptions, QualViewerRow, AnchoredSeniorityLens, PlainDate

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
Cohesion: 0.33
Nodes (8): DELETED_KINDS, CompareResult, DepartedPilot, Entry, NewHire, QualMove, RankChange, RetiredPilot

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
Cohesion: 0.50
Nodes (6): BaseStatusRow, RankCardData, RetirementSnapshotData, StatCard, useStanding(), formatNumber()

### Community 68 - "registry.ts"
Cohesion: 0.15
Nodes (9): config, emit, feedbackEmail, infoUploadType, props, showInfoModal, sourceSheet, importPlugins (+1 more)

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
Cohesion: 0.22
Nodes (7): columnOptions, emit, props, requiredFields, columnMap, mappingOptions, updateOption()

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

### Community 83 - "_useFileIO.test.ts"
Cohesion: 0.19
Nodes (10): createUploadSession(), createMapping(), { mockProcessConfirmedMappings }, createConfirm(), mockStore, _useConfirm(), createFileIO(), mockDecodeWorkbook (+2 more)

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

### Community 89 - "TrajectoryChart.vue"
Cohesion: 0.40
Nodes (4): chartData, chartOptions, { colors }, props

### Community 90 - "SupportModal.vue"
Cohesion: 0.40
Nodes (3): bmcUrl, config, feedbackEmail

### Community 91 - "Import Plugin"
Cohesion: 0.50
Nodes (5): Entry Patch, Import Pipeline, Import Plugin, Preparation Patch, Import Plugin Lifecycle

### Community 93 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): ./.nuxt/tsconfig.json, scripts, exclude, extends

### Community 98 - "lens.ts"
Cohesion: 0.24
Nodes (14): computeYOSDate(), computeAgeDistribution(), computeQualComposition(), computeYosDistribution(), computeYosHistogram(), findMostJuniorCA(), qualKey(), asOfDate (+6 more)

### Community 107 - "snapshot.ts"
Cohesion: 0.29
Nodes (7): collectDuplicateIssues(), EntryIdentity, InvalidSnapshotDataError, issuesToErrorMap(), SnapshotIssueCode, SnapshotValidationIssue, validateSnapshotEntries()

### Community 131 - "validate-entries.ts"
Cohesion: 0.40
Nodes (8): validateSnapshotEntryIssues(), computeStructuralErrors(), computeStructuralIssues(), issuesToErrorMap(), pushIssue(), validateEntries(), ValidationIssue, ValidationIssueCode

### Community 162 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 164 - "build-diff-rows.test.ts"
Cohesion: 0.22
Nodes (3): diffRows, buildDiffRows(), emptyResult

### Community 165 - "seniority.test.ts"
Cohesion: 0.25
Nodes (7): expectedAdaptedEntry, mockDb, mockEmitHook, mockList1, mockList2, mockLocalEntry, LocalSeniorityList

### Community 166 - "useUser.test.ts"
Cohesion: 0.40
Nodes (4): mockLoadPreferences, mockSavePreference, mockSeniorityEntries, mockUserStore

### Community 168 - "useSeniorityCompare"
Cohesion: 0.67
Nodes (4): useSeniorityCompare(), fetchListData(), loadComparison(), computeComparison()

## Knowledge Gaps
- **642 isolated node(s):** `props`, `{ defaults, colors }`, `chartData`, `chartOptions`, `props` (+637 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createLogger()` connect `_useConfirm.ts` to `_useFileIO.ts`, `upload.vue`, `seniority.ts`, `generate-demo-v2.ts`, `upload/index.ts`, `useSeniorityCompare`, `useSeniorityCore.ts`, `utils/temporal.ts`, `lists.vue`, `usePwaInstall.ts`, `useUserStore`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `SeniorityEntry` connect `PlainDate` to `seniority-engine/index.ts`, `lens.ts`, `Scenario`, `seniority.ts`, `seniority.test.ts`, `useUser.test.ts`, `seniority-list.ts`, `useSeniorityCore.ts`, `snapshot.ts`, `_useConfirm.ts`, `seniority-math.ts`, `seniority-engine/types.ts`, `RetirementComparison.vue`, `SeniorityComparison.vue`, `seniority-compare.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `useUserStore` connect `useUserStore` to `_useFileIO.ts`, `upload/index.ts`, `_useFileIO`, `useSeniorityCore.ts`, `_useConfirm.ts`, `parsePlainDate`, `utils/hooks.ts`, `useSeniorityStore`, `usePwaInstall.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `useSeniorityStore` (e.g. with `clearAll()` and `clearStore()`) actually correct?**
  _`useSeniorityStore` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `props`, `{ defaults, colors }`, `chartData` to the rest of the system?**
  _642 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `seniority-engine/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14838709677419354 - nodes in this community are weakly interconnected._