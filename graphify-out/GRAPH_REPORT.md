# Graph Report - local  (2026-08-23)

## Corpus Check
- 309 files · ~104,262 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1721 nodes · 3493 edges · 172 communities (122 shown, 50 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `825ea37a`
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
- utils/temporal.ts
- date/index.ts
- useSeniorityStore
- db.ts
- snapshot.ts
- process-confirmed-mappings.ts
- utils/seniority.ts
- TrajectoryTab.vue
- SeniorityGuru
- formatYear
- demo-enter.ts
- _useReview.ts
- fuzz-data.ts
- UploadReviewTable.vue
- user.ts
- lists.vue
- qualification-position.ts
- compare.vue
- usePwaInstall.ts
- PlainDate
- import-attempts.ts
- AnchoredSeniorityLensImplementation
- generate-demo-v2.ts
- PositionTab.vue
- parse-spreadsheet.ts
- devDependencies
- scripts
- ComparisonDiffTab.vue
- ImportPlugin
- ComparisonDiffTab.test.ts
- ComparisonTab.vue
- BaseStatusTable.vue
- jetblue.ts
- TrajectoryDemo.vue
- seniority-analysis/math.test.ts
- SeniorityEntryInput
- useUserStore
- pages/index.vue
- seniority-compare.ts
- _useFileIO
- qualification-scope.ts
- scripts/tsconfig.json
- useQualFilter.test.ts
- useSeniorityCore
- SettingsPreferencesCard.vue
- Wayfinder Child Ticket
- RetirementSnapshot.vue
- normalizeEmployeeNumber
- SeniorityComparison.vue
- RetirementsTab.test.ts
- Review rules
- build-diff-rows.test.ts
- useSeniorityCore.ts
- seniority-list.ts
- theme.vue
- Domain Docs
- QualSizesCard.vue
- DashboardChart.vue
- DashboardStatCard.vue
- MobileBottomBar.vue
- TablePagination.vue
- @commitlint/config-conventional
- formatDate
- QualFilterBar.vue
- BaseSeatBreakdown.vue
- stores/seniority.test.ts
- ShareButton.vue
- import-pipeline/types.ts
- useChangelog.ts
- utils/hooks.ts
- useListManagement
- changelog.md
- package.json
- AgeDistributionChart.vue
- PercentileThresholdCalculator.vue
- YearsOfServiceBreakdown.vue
- GrowthBar.vue
- DemographicsTab.vue
- SupportModal.vue
- Import Plugin
- upload.ts
- post-commit
- tsconfig.json
- TabChips.vue
- AppButtonToggle.vue
- _useConfirm.ts
- seniority/index.ts
- useTableFeatures.ts
- compare.test.ts
- useGrowthAssumptions.ts
- post-checkout
- nuxt.config.test.ts
- app.vue
- utils/seniority.test.ts
- InfoIcon.vue
- DiffRow
- layouts/dashboard.vue
- robots.txt
- SeniorityGuru Agent Guide
- Local-first Architecture
- SidebarFooter.vue
- SettingsWhatsNewCard.vue
- AppSearchInput.vue
- how-it-works.vue
- whats-new.vue
- Seniority Domain API and Presentation Seam Refactor
- 0001-code-based-import-plugin-lifecycle.md
- 0002-explicit-import-plugin-selection.md
- 0003-separate-import-domain-from-ui.md
- 0004-immutable-import-pipeline.md
- 0005-defer-full-temporal-migration.md
- 0006-replace-the-legacy-parser-framework.md
- Skills needs-info
- Skills needs-triage
- Skills ready-for-agent
- Skills ready-for-human
- Skills wontfix
- domain-glossary.md
- test.ts
- mobile.spec.ts
- pre-push
- happy-dom
- @iconify-json/lucide
- memoizeLast
- @playwright/test
- typescript
- vitest
- @vue/test-utils
- vue-tsc
- Import Context
- Seniority Guru Apple Touch Icon
- SeniorityGuru App Icon
- SeniorityGuru Application Icon
- RecentListsTimeline.vue
- useTrajectory
- @nuxt/eslint

## God Nodes (most connected - your core abstractions)
1. `PlainDate` - 44 edges
2. `parsePlainDate()` - 44 edges
3. `useSeniorityStore` - 36 edges
4. `SeniorityEntry` - 36 edges
5. `useSeniorityCore()` - 29 edges
6. `useUserStore` - 25 edges
7. `SeniorityEntryInput` - 25 edges
8. `useImportAttemptsStore` - 21 edges
9. `normalizeEmployeeNumber()` - 21 edges
10. `AnchoredSeniorityLensImplementation` - 21 edges

## Surprising Connections (you probably didn't know these)
- `TableRow` --references--> `PlainDate`  [EXTRACTED]
  app/components/analytics/JuniorCaptainTable.vue → app/utils/temporal.ts
- `tableData` --calls--> `formatYear()`  [EXTRACTED]
  app/components/dashboard/RetirementSnapshot.vue → app/utils/date/format.ts
- `useSeniorityStore` --indirect_call--> `clearAll()`  [INFERRED]
  app/stores/seniority.ts → app/components/settings/SettingsClearDataCard.vue
- `useSeniorityStore` --indirect_call--> `fetchLists()`  [INFERRED]
  app/stores/seniority.ts → app/composables/seniority/modules/useSeniorityLists.ts
- `useSeniorityStore` --indirect_call--> `updateList()`  [INFERRED]
  app/stores/seniority.ts → app/composables/seniority/modules/useSeniorityLists.ts

## Import Cycles
- 3-file cycle: `app/utils/seniority-engine/qualification-key.ts -> app/utils/seniority-engine/types.ts -> app/utils/seniority-engine/qualification-scope.ts -> app/utils/seniority-engine/qualification-key.ts`

## Hyperedges (group relationships)
- **Wayfinding Ticket Flow** — docs_agents_issue_tracker_wayfinder_map, docs_agents_issue_tracker_child_ticket, docs_agents_issue_tracker_native_issue_dependencies, docs_agents_issue_tracker_frontier_query, docs_agents_issue_tracker_claim, docs_agents_issue_tracker_resolve [EXTRACTED 1.00]
- **Canonical Triage Role Mappings** — docs_agents_triage_labels_skills_needs_triage, docs_agents_triage_labels_tracker_needs_triage, docs_agents_triage_labels_skills_needs_info, docs_agents_triage_labels_tracker_needs_info, docs_agents_triage_labels_skills_ready_for_agent, docs_agents_triage_labels_tracker_ready_for_agent, docs_agents_triage_labels_skills_ready_for_human, docs_agents_triage_labels_tracker_ready_for_human, docs_agents_triage_labels_skills_wontfix, docs_agents_triage_labels_tracker_wontfix [EXTRACTED 1.00]

## Communities (172 total, 50 thin omitted)

### Community 0 - "logger.ts"
Cohesion: 0.10
Nodes (27): clearAll(), { clearAllData }, confirm, loading, toast, downloadLog(), entryCount, mockImportAttemptsStore (+19 more)

### Community 1 - "RetirementComparison.vue"
Cohesion: 0.20
Nodes (10): chartData, chartOptions, { colors }, compareScope, currentScope, props, qualificationScopeOptions, { scopeOptions, specForLabel } (+2 more)

### Community 2 - "lens.ts"
Cohesion: 0.11
Nodes (33): computeYOSDate(), EntryPredicate, AGE_BUCKETS, analyzeAgeDistribution(), analyzeQualificationComposition(), analyzeYearsOfServiceBuckets(), analyzeYearsOfServiceDistribution(), findCaptainQualificationThresholds() (+25 more)

### Community 3 - "parse.ts"
Cohesion: 0.16
Nodes (16): EXCEL_EPOCH_MS, ISO_DATE_REGEX, NAMED_MONTH_FORMATS, DATE_PARSERS, DateParser, detectDateFormat(), _detectFormat(), detectFutureDateFormat() (+8 more)

### Community 4 - "dependencies"
Cohesion: 0.05
Nodes (43): better-sqlite3, chart.js, dexie, @fontsource/jetbrains-mono, @fontsource-variable/dm-sans, @internationalized/date, nuxt, @nuxt/content (+35 more)

### Community 5 - "pages/dashboard.vue"
Cohesion: 0.10
Nodes (20): DASHBOARD_TABS, useDashboardTabs(), useSeniorityNav(), { activeTab, tabs }, { chartData: trajectoryChartData, changes: trajectoryChanges }, { employeeNumber }, fullBleedTabs, { hasData, hasAnchor: userFound, isNewHireMode, newHire } (+12 more)

### Community 6 - "upload.vue"
Cohesion: 0.07
Nodes (24): activeFilterLabel, activeRowFilter, canAdvance, changeFormat(), clearRowFilter(), currentStep, currentStepIndex, effectiveDateModel (+16 more)

### Community 7 - "RetirementsTab.vue"
Cohesion: 0.10
Nodes (20): availableBases, availableFleets, availableSeats, baseItems, columns, filterBase, filterFleet, filterSeat (+12 more)

### Community 8 - "analysis.ts"
Cohesion: 0.11
Nodes (34): RetirementCountProjection, SeniorityTrajectory, SeniorityTrajectoryComparison, formatQualification(), formatQualificationScope(), formatSeniorityCount(), formatSeniorityRankChange(), presentAgeBucket() (+26 more)

### Community 9 - "upload/index.ts"
Cohesion: 0.12
Nodes (22): columnMap, mappingOptions, DEFAULT_COLUMN_MAP, DEFAULT_MAPPING_OPTIONS, createUploadSession(), MappingPhase, ProcessingPhase, ProgressTracker (+14 more)

### Community 10 - "QualSeniorityScale.vue"
Cohesion: 0.19
Nodes (6): props, rowMaxCounts, sortedPositions, SEAT_ORDER, sortQualificationPositions(), PresentedQualificationPosition

### Community 11 - "SeniorityListViewer.vue"
Cohesion: 0.07
Nodes (32): canInsert, columns, columnVisibility, currentPage, { employeeNumber }, expanded, focusUserPage(), globalFilter (+24 more)

### Community 12 - "lens.test.ts"
Cohesion: 0.07
Nodes (13): AnchorNotFoundError, createSeniorityLens(), SeniorityLensImplementation, asOfDate, assertAnchoredLensCapabilities(), assertOrganizationLensCapabilities(), createOrganizationLens(), entries (+5 more)

### Community 13 - "utils/temporal.ts"
Cohesion: 0.14
Nodes (12): demographicsPresentation, demographicsResult, { mockAnalysis, mockAnchoredAnalysis, mockHasData }, { mockAnchoredAnalysis, mockHasData }, attempts, isCalendarDate(), date(), asOf() (+4 more)

### Community 14 - "date/index.ts"
Cohesion: 0.27
Nodes (15): addYearsISO(), computeRetireDate(), computeRetireDateValue(), currentYear(), deriveAge(), diffYears(), isRetiredBy(), retiresInYear() (+7 more)

### Community 15 - "useSeniorityStore"
Cohesion: 0.17
Nodes (18): mockStore, useSeniorityLists(), clearStore(), fetchEntries(), fetchLists(), updateList(), compareListsByRecency(), log (+10 more)

### Community 16 - "db.ts"
Cohesion: 0.18
Nodes (10): useSeniorityCompare(), fetchListData(), loadComparison(), db, LocalPreference, LocalSeniorityList, SeniorityGuruDB, SeniorityList (+2 more)

### Community 17 - "snapshot.ts"
Cohesion: 0.20
Nodes (10): collectDuplicateIssues(), createSenioritySnapshot(), EntryIdentity, getSeniorityEntryValues(), InvalidSenioritySnapshotDataError, issuesToErrorMap(), SenioritySnapshotIssueCode, SenioritySnapshotValidationIssue (+2 more)

### Community 18 - "process-confirmed-mappings.ts"
Cohesion: 0.11
Nodes (27): normalizeDate, normalizeDateFuture(), hasRequiredColumnMappings(), hasRequiredImportMappings(), IMPORT_FIELD_DEFINITIONS, IMPORT_FIELDS, ImportFieldDefinition, ImportFieldSchema (+19 more)

### Community 19 - "utils/seniority.ts"
Cohesion: 0.12
Nodes (20): SeniorityTrajectoryPoint, useScopeFilter(), PresentedQualificationViewerEntry, PresentedTrajectoryChange, createSeniorityAnalysis(), PercentileCrossingAnalysisOptions, RelativeUpcomingRetirementAnalysisOptions, RetirementCountProjectionAnalysisOptions (+12 more)

### Community 20 - "TrajectoryTab.vue"
Cohesion: 0.09
Nodes (19): {
  chartData: trajectoryChartData,
  computeComparativeTrajectory,
  computeRetirementProjection,
}, growthAssumptions, { hasData, hasAnchor, analysis, anchoredAnalysis, projectionEndDate }, isBannerDismissed, qualificationFilter, qualificationScopeOptions, qualificationTrajectoryChanges, { rankCard } (+11 more)

### Community 21 - "SeniorityGuru"
Cohesion: 0.10
Nodes (19): Contributing to SeniorityGuru, Contribution checklist, Import plugins, Commands, Contributing, Git workflow, License, SeniorityGuru (+11 more)

### Community 22 - "formatYear"
Cohesion: 0.12
Nodes (17): { defaults, colors }, props, trajectoryChartData, trajectoryChartOptions, waveChartData, waveChartOptions, chartData, chartOptions (+9 more)

### Community 23 - "demo-enter.ts"
Cohesion: 0.29
Nodes (6): registerDemoEnterHook(), localEntryToSeniorityEntry(), LocalSeniorityEntry, DEMO_EMPLOYEE_NUMBER, mdyToISO(), parseDemoCSV()

### Community 24 - "_useReview.ts"
Cohesion: 0.08
Nodes (38): formatIssueMessage(), formatPipelineIssue(), formatSchemaIssues(), isStructuralMessage(), log, reportReviewChange(), createReview(), _useReview() (+30 more)

### Community 25 - "fuzz-data.ts"
Cohesion: 0.21
Nodes (19): assignSeat(), baseSamples, baseSampleSizing, buildHireDatePool(), buildSeatCurve(), fakeName(), fuzzRow(), makeEmployeeIdPool() (+11 more)

### Community 26 - "UploadReviewTable.vue"
Cohesion: 0.12
Nodes (13): columns, currentPage, displayEntries, editableFields, editingCell, emit, IndexedEntry, pageCount (+5 more)

### Community 27 - "user.ts"
Cohesion: 0.20
Nodes (10): log, mockDb, ImportMappingPreference, ImportMappingPreferenceSchema, ImportMappingsSchema, NewHireConfig, NewHireConfigSchema, PREFERENCE_DESERIALIZERS (+2 more)

### Community 28 - "lists.vue"
Cohesion: 0.14
Nodes (12): SeniorityListSummary, columns, { editOpen, saving, editState, deleteOpen, deleting, deleteTarget, openEdit, saveEdit, confirmDelete, doDelete }, filteredLists, { lists, listsLoading, listsError, fetchLists, deleteList: storeDeleteList, updateList: storeUpdateList }, log, SeniorityList, {
  tableRef: listsTable,
  globalFilter,
  sorting,
  pagination,
  paginationOptions,
  currentPage,
  pageCount,
  totalRows,
} (+4 more)

### Community 29 - "qualification-position.ts"
Cohesion: 0.22
Nodes (11): calculateAdditionalSeniorityPilots(), DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS, date(), calculateSeniorityPercentile(), analyzeQualificationDistributions(), analyzeQualificationPositions(), companyPercentile(), isActiveAt() (+3 more)

### Community 30 - "compare.vue"
Cohesion: 0.14
Nodes (18): activeCompareTab, compareTabs, diffRows, { employeeNumber }, listIdA, listIdB, { lists, listOptions, fetchLists }, { loading, error, comparison } (+10 more)

### Community 31 - "usePwaInstall.ts"
Cohesion: 0.14
Nodes (9): { showBanner, isIos, showIosModal, install, snooze, dismiss }, mockUserStore, mountComposable(), usePwaInstall(), { mockNavigateTo, mockIsStandalone }, BeforeInstallPromptEvent, deferredInstallPrompt, sharedShowIosModal (+1 more)

### Community 32 - "PlainDate"
Cohesion: 0.24
Nodes (16): NewHireControls, SeniorityEntry, GrowthAssumptions, CalculateRetirementCountProjectionOptions, CalculateSeniorityTrajectoryComparisonOptions, CalculateSeniorityTrajectoryOptions, RetirementCountBucket, SeniorityTrajectoryComparisonPoint (+8 more)

### Community 33 - "import-attempts.ts"
Cohesion: 0.21
Nodes (11): useImportAttempts(), exportAttempt(), load(), remove(), update(), ImportAttemptInput, log, newestFirst() (+3 more)

### Community 34 - "AnchoredSeniorityLensImplementation"
Cohesion: 0.27
Nodes (6): calculateSeniorityRank(), countRetiredPilotsSeniorTo(), AnchoredSeniorityLensImplementation, asOfDate(), commonLensMethods(), SeniorityTrajectoryComparisonOptions

### Community 35 - "generate-demo-v2.ts"
Cohesion: 0.21
Nodes (15): applyNewHires(), applyRetirements(), applyTransfers(), applyUpgrades(), BASE_ROTATION, __dirname, isoToMdy(), logger (+7 more)

### Community 36 - "PositionTab.vue"
Cohesion: 0.16
Nodes (13): { employeeNumber }, growthAssumptions, { hasData, newHire, anchoredAnalysis, projectionEndDate }, hasEmployeeNumber, hasProjection, positionSliderMax, positionYearsInput, projectionDate (+5 more)

### Community 37 - "parse-spreadsheet.ts"
Cohesion: 0.18
Nodes (12): columnOptions, emit, props, requiredFields, updateOption(), applyColumnMap(), autoDetectColumnMap(), ColumnMap (+4 more)

### Community 38 - "devDependencies"
Cohesion: 0.13
Nodes (15): @commitlint/cli, eslint, fake-indexeddb, @faker-js/faker, @nuxt/test-utils, devDependencies, @commitlint/cli, eslint (+7 more)

### Community 39 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dev:debug, fuzz, generate, lint, lint:fix (+7 more)

### Community 40 - "ComparisonDiffTab.vue"
Cohesion: 0.15
Nodes (10): badgeLabel(), filteredRows, isEmpty, page, PAGE_SIZE_OPTIONS, pageSize, paginatedRows, props (+2 more)

### Community 41 - "ImportPlugin"
Cohesion: 0.15
Nodes (8): config, emit, feedbackEmail, infoUploadType, props, showInfoModal, SeniorityUpload, ImportPlugin

### Community 42 - "ComparisonDiffTab.test.ts"
Cohesion: 0.22
Nodes (4): DepartedRow, QualMoveRow, RankChangeRow, RetiredRow

### Community 43 - "ComparisonTab.vue"
Cohesion: 0.17
Nodes (11): activeFilters, filteredData, filterOptions, props, table, ComparisonTabExposed, testColumns, testData (+3 more)

### Community 44 - "BaseStatusTable.vue"
Cohesion: 0.17
Nodes (12): adjusted, availableSeats, BaseStatusRow, columns, displayData, DisplayRow, highlightClass(), isMobile (+4 more)

### Community 45 - "jetblue.ts"
Cohesion: 0.10
Nodes (38): ImportField, importFieldLabel(), matchingColumns(), normalizeHeader(), preparedColumn(), preparedColumnId(), sourceSheet, decomposeDeltaCategory() (+30 more)

### Community 46 - "TrajectoryDemo.vue"
Cohesion: 0.17
Nodes (12): activePreset, chartData, chartOptions, container, generateTrajectory(), growthRate, legendItems, qualificationScope (+4 more)

### Community 47 - "seniority-analysis/math.test.ts"
Cohesion: 0.33
Nodes (8): calculateRetirementCountProjection(), calculateSeniorityTrajectory(), calculateSeniorityTrajectoryComparison(), calculateTrajectoryChanges(), calculateTrajectoryPoints(), generateAnnualSeniorityDates(), asOfDate, date()

### Community 48 - "SeniorityEntryInput"
Cohesion: 0.18
Nodes (5): ConfirmPhase, ReviewPhase, DraftSeniorityEntry, EntryPatch, SeniorityEntryInput

### Community 49 - "useUserStore"
Cohesion: 0.16
Nodes (14): { showBanner, dismiss, exit }, mockEmitHook, mockGetPreference, mockSavePreference, mockSeniorityLists, mountComposable(), useDemoBanner(), exit() (+6 more)

### Community 50 - "pages/index.vue"
Cohesion: 0.11
Nodes (17): BASE_QUAL_SCALES, config, dataOwnershipItems, demoAgeBuckets, demoAgeData, demoEntering, demoProjection, demoProjectionYears (+9 more)

### Community 51 - "seniority-compare.ts"
Cohesion: 0.33
Nodes (8): DELETED_KINDS, CompareResult, DepartedPilot, Entry, NewHire, QualMove, RankChange, RetiredPilot

### Community 52 - "_useFileIO"
Cohesion: 0.18
Nodes (18): useSeniorityUpload(), clearUploadType(), reset(), resetDownstream(), selectUploadType(), toConfirmedMappings(), _useColumnMapping(), apply() (+10 more)

### Community 53 - "qualification-scope.ts"
Cohesion: 0.39
Nodes (7): qualificationKey(), COMPANY_WIDE_QUALIFICATION_SCOPE, enumerateQualificationScopes(), qualificationScopesEqual(), qualificationScopeToEntryPredicate(), scopeSortKey(), entries

### Community 54 - "scripts/tsconfig.json"
Cohesion: 0.17
Nodes (11): node, node_modules, **/*.ts, ../tsconfig.json, compilerOptions, baseUrl, paths, types (+3 more)

### Community 55 - "useQualFilter.test.ts"
Cohesion: 0.20
Nodes (10): mockStore, mockUserStore, _resetCoreSingletons(), mockStore, mockUserStore, mockStore, mockUserStore, mockStore (+2 more)

### Community 56 - "useSeniorityCore"
Cohesion: 0.47
Nodes (3): entryValues(), useQualificationFilter(), useSeniorityCore()

### Community 57 - "SettingsPreferencesCard.vue"
Cohesion: 0.18
Nodes (8): loading, { retirementAge, savePreference }, state, CardVm, { mockSavePreference, mockToastAdd }, toast, UpdatePreferencesSchema, UpdatePreferencesState

### Community 58 - "Wayfinder Child Ticket"
Cohesion: 0.20
Nodes (11): Wayfinder Child Ticket, Ticket Claim, Frontier Query, GitHub CLI, GitHub Issue Tracker, GitHub Issues, GitHub Native Issue Dependencies, Pull Requests (+3 more)

### Community 59 - "RetirementSnapshot.vue"
Cohesion: 0.22
Nodes (8): columns, maxYears, PresentedSeniorityTrajectoryPoint, props, SeniorityTrajectoryPoint, tableData, TableRow, yearsToShow

### Community 60 - "normalizeEmployeeNumber"
Cohesion: 0.10
Nodes (18): accentVariant, emit, employeeNumber, loading, onSave(), { savePreference }, BannerVm, { mockSavePreference, mockToastAdd } (+10 more)

### Community 61 - "SeniorityComparison.vue"
Cohesion: 0.11
Nodes (16): formatDate(), chartData, chartOptions, { colors }, compareScope, currentScope, defaultScope, props (+8 more)

### Community 62 - "RetirementsTab.test.ts"
Cohesion: 0.29
Nodes (4): { mockHasData, mockHasAnchor, mockAnalysis, mockAnchoredAnalysis }, mockStoreState, mockUpcomingRetirements, sampleRows

### Community 63 - "Review rules"
Cohesion: 0.22
Nodes (8): Boundaries, Design quality, Findings, Nuxt and TypeScript, Review process, Review rules, Schemas and domain types, SeniorityGuru code review

### Community 65 - "useSeniorityCore.ts"
Cohesion: 0.29
Nodes (6): birthDate, enabled, log, selectedBase, selectedFleet, selectedSeat

### Community 66 - "seniority-list.ts"
Cohesion: 0.14
Nodes (14): state, stubs, mockStore, mockLoadPreferences, mockSavePreference, mockSeniorityEntries, mockUserStore, makeDomainEntry() (+6 more)

### Community 67 - "theme.vue"
Cohesion: 0.25
Nodes (7): componentColors, iconColors, retirementTokens, semanticColors, shades, surfaceTokens, textTokens

### Community 68 - "Domain Docs"
Cohesion: 0.25
Nodes (8): ADR Conflicts, Architecture Decision Records, CONTEXT-MAP.md, CONTEXT.md, Domain Docs, Glossary Vocabulary, Canonical Triage Roles, Triage Labels

### Community 69 - "QualSizesCard.vue"
Cohesion: 0.29
Nodes (6): ByBase, columns, props, QualificationComposition, rows, SizeRow

### Community 70 - "DashboardChart.vue"
Cohesion: 0.33
Nodes (6): chartComponent, chartComponents, deepMerge(), { defaults }, mergedOptions, props

### Community 71 - "DashboardStatCard.vue"
Cohesion: 0.29
Nodes (5): animatedNumber, displayValue, isAnimating, numericTarget, props

### Community 72 - "MobileBottomBar.vue"
Cohesion: 0.29
Nodes (4): { hasUnseenChanges }, navItems, route, mockRoute

### Community 73 - "TablePagination.vue"
Cohesion: 0.38
Nodes (6): commitGotoPage(), emit, gotoPageInput, handleGotoKeydown(), isMobile, props

### Community 75 - "formatDate"
Cohesion: 0.14
Nodes (10): columns, TableRow, birthDateModel, { employeeNumber }, { newHire: newHireMode }, birthDateModel, { newHire: newHireMode }, { mockEnabled, mockReset, mockToastAdd } (+2 more)

### Community 76 - "QualFilterBar.vue"
Cohesion: 0.33
Nodes (3): base, fleet, seat

### Community 77 - "BaseSeatBreakdown.vue"
Cohesion: 0.33
Nodes (4): BaseSeatRow, columns, props, tabs

### Community 78 - "stores/seniority.test.ts"
Cohesion: 0.29
Nodes (6): expectedAdaptedEntry, mockDb, mockEmitHook, mockList1, mockList2, mockLocalEntry

### Community 79 - "ShareButton.vue"
Cohesion: 0.33
Nodes (4): attrs, buttonProps, props, shareData

### Community 80 - "import-pipeline/types.ts"
Cohesion: 0.11
Nodes (14): FilePhase, log, DecodedWorkbook, DecodeError, DecodeWorkbookResult, ImportDiagnosticTrace, MappedEntryTransformationInput, SourceCellValue (+6 more)

### Community 81 - "useChangelog.ts"
Cohesion: 0.40
Nodes (3): lastSeenDate, mountComposable(), useChangelog()

### Community 82 - "utils/hooks.ts"
Cohesion: 0.10
Nodes (19): Handler, mockNavigateTo, mockSeniorityStore, mockUserStore, runtimeHandlers, registerDemoExitHook(), Handler, mockNavigateTo (+11 more)

### Community 83 - "useListManagement"
Cohesion: 0.40
Nodes (5): getDropdownItems(), useListManagement(), confirmDelete(), openEdit(), saveEdit()

### Community 84 - "changelog.md"
Cohesion: 0.33
Nodes (5): April 26, 2026, August 12, 2026, March 25, 2026, March 26, 2026, March 30, 2026

### Community 85 - "package.json"
Cohesion: 0.33
Nodes (5): license, name, packageManager, private, type

### Community 86 - "AgeDistributionChart.vue"
Cohesion: 0.40
Nodes (4): chartData, chartOptions, { defaults, colors }, props

### Community 87 - "PercentileThresholdCalculator.vue"
Cohesion: 0.50
Nodes (4): emit, handlePercentileChange(), props, sliderValue

### Community 88 - "YearsOfServiceBreakdown.vue"
Cohesion: 0.40
Nodes (4): chartData, chartOptions, { defaults, colors }, props

### Community 89 - "GrowthBar.vue"
Cohesion: 0.40
Nodes (4): emit, enabled, props, sliderValue

### Community 90 - "DemographicsTab.vue"
Cohesion: 0.13
Nodes (17): accentVariant, animatedPercentile, props, yearsOfService, ageDistribution, captainQualificationThresholds, demographicsResult, { hasData, newHire, analysis, anchoredAnalysis, userEntry } (+9 more)

### Community 91 - "SupportModal.vue"
Cohesion: 0.40
Nodes (3): bmcUrl, config, feedbackEmail

### Community 92 - "Import Plugin"
Cohesion: 0.50
Nodes (5): Entry Patch, Import Pipeline, Import Plugin, Preparation Patch, Import Plugin Lifecycle

### Community 94 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 95 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): ./.nuxt/tsconfig.json, scripts, exclude, extends

### Community 98 - "_useConfirm.ts"
Cohesion: 0.32
Nodes (5): log, createConfirm(), mockStore, _useConfirm(), save()

### Community 99 - "seniority/index.ts"
Cohesion: 0.57
Nodes (5): BaseStatusRow, RankCardData, RetirementSnapshotData, StatCard, useStanding()

### Community 103 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 106 - "utils/seniority.test.ts"
Cohesion: 0.40
Nodes (3): asOfDate, assertPublicCapabilityAndReadonlyTypes(), entries

### Community 121 - "Seniority Domain API and Presentation Seam Refactor"
Cohesion: 0.22
Nodes (8): Further Notes, Implementation Decisions, Out of Scope, Problem Statement, Seniority Domain API and Presentation Seam Refactor, Solution, Testing Decisions, User Stories

### Community 169 - "RecentListsTimeline.vue"
Cohesion: 0.33
Nodes (4): { deleteList }, deletingId, ListItem, toast

## Knowledge Gaps
- **653 isolated node(s):** `props`, `{ defaults, colors }`, `chartData`, `chartOptions`, `columns` (+648 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SeniorityEntry` connect `PlainDate` to `useSeniorityCore.ts`, `_useConfirm.ts`, `seniority-list.ts`, `lens.ts`, `AnchoredSeniorityLensImplementation`, `analysis.ts`, `lens.test.ts`, `stores/seniority.test.ts`, `useSeniorityStore`, `db.ts`, `snapshot.ts`, `seniority-compare.ts`, `qualification-scope.ts`, `useSeniorityCore`, `qualification-position.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `useSeniorityUpload()` connect `_useFileIO` to `import-attempts.ts`, `seniority-list.ts`, `seniority/index.ts`, `_useConfirm.ts`, `upload.vue`, `upload/index.ts`, `useUserStore`, `_useReview.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `useUserStore` connect `useUserStore` to `logger.ts`, `useSeniorityCore.ts`, `upload/index.ts`, `import-pipeline/types.ts`, `utils/hooks.ts`, `_useFileIO`, `demo-enter.ts`, `useSeniorityCore`, `user.ts`, `usePwaInstall.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `useSeniorityStore` (e.g. with `clearAll()` and `clearStore()`) actually correct?**
  _`useSeniorityStore` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `props`, `{ defaults, colors }`, `chartData` to the rest of the system?**
  _653 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `logger.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10227272727272728 - nodes in this community are weakly interconnected._
- **Should `lens.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10993657505285412 - nodes in this community are weakly interconnected._