# Graph Report - local  (2026-08-23)

## Corpus Check
- 307 files · ~103,904 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1717 nodes · 3484 edges · 164 communities (116 shown, 48 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 101 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a4f22984`
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
- demographics.ts
- date/index.ts
- qualification-scope.ts
- utils/temporal.ts
- seniority-list.ts
- process-confirmed-mappings.ts
- seniority-analysis/math.ts
- useSeniorityCore.ts
- SeniorityGuru
- formatYear
- delta.ts
- snapshot.ts
- fuzz-data.ts
- UploadReviewTable.vue
- useSeniorityStore
- lists.vue
- SettingsNewHireModeCard.vue
- compare.vue
- pwa-standalone.ts
- PlainDate
- diagnostic-schema.ts
- prepare-import.ts
- generate-demo-v2.ts
- PositionTab.vue
- fields.ts
- devDependencies
- scripts
- ComparisonDiffTab.vue
- registry.ts
- ComparisonDiffTab.test.ts
- ComparisonTab.vue
- BaseStatusTable.vue
- generic.ts
- TrajectoryDemo.vue
- jetblue.ts
- ReviewPhase
- useDemoBanner.test.ts
- pwa-prompt.ts
- seniority-compare.ts
- _useFileIO
- useSeniorityCompare
- scripts/tsconfig.json
- useClearAllData.test.ts
- toggleInsert
- SettingsPreferencesCard.vue
- Wayfinder Child Ticket
- RetirementSnapshot.vue
- qualificationOptionKey
- SeniorityComparison.vue
- useUser.test.ts
- Review rules
- build-diff-rows.test.ts
- makeDomainEntry
- utils/seniority.test.ts
- theme.vue
- Domain Docs
- QualSizesCard.vue
- DashboardChart.vue
- DashboardStatCard.vue
- MobileBottomBar.vue
- TablePagination.vue
- @commitlint/config-conventional
- AnchoredSeniorityLensImplementation
- QualFilterBar.vue
- BaseSeatBreakdown.vue
- ShareButton.vue
- import-pipeline/types.ts
- useChangelog.ts
- pages/index.vue
- useImportAttemptsStore
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
- useTableFeatures.ts
- compare.test.ts
- post-checkout
- nuxt.config.test.ts
- app.vue
- InfoIcon.vue
- SettingsClearDataCard.vue
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
- @nuxt/eslint
- @playwright/test
- typescript
- vitest
- @vue/test-utils
- vue-tsc
- Import Context
- Seniority Guru Apple Touch Icon
- SeniorityGuru App Icon
- SeniorityGuru Application Icon

## God Nodes (most connected - your core abstractions)
1. `PlainDate` - 44 edges
2. `parsePlainDate()` - 43 edges
3. `SeniorityEntry` - 36 edges
4. `useSeniorityStore` - 35 edges
5. `useSeniorityCore()` - 29 edges
6. `useUserStore` - 25 edges
7. `SeniorityEntryInput` - 25 edges
8. `useImportAttemptsStore` - 21 edges
9. `normalizeEmployeeNumber()` - 21 edges
10. `AnchoredSeniorityLensImplementation` - 21 edges

## Surprising Connections (you probably didn't know these)
- `useSeniorityStore` --indirect_call--> `fetchLists()`  [INFERRED]
  app/stores/seniority.ts → app/composables/seniority/modules/useSeniorityLists.ts
- `useSeniorityStore` --indirect_call--> `updateList()`  [INFERRED]
  app/stores/seniority.ts → app/composables/seniority/modules/useSeniorityLists.ts
- `useSeniorityStore` --indirect_call--> `fetchEntries()`  [INFERRED]
  app/stores/seniority.ts → app/composables/seniority/modules/useSeniorityLists.ts
- `useSeniorityStore` --indirect_call--> `clearStore()`  [INFERRED]
  app/stores/seniority.ts → app/composables/seniority/modules/useSeniorityLists.ts
- `TableRow` --references--> `PlainDate`  [EXTRACTED]
  app/components/analytics/JuniorCaptainTable.vue → app/utils/temporal.ts

## Import Cycles
- 3-file cycle: `app/utils/seniority-engine/qualification-key.ts -> app/utils/seniority-engine/types.ts -> app/utils/seniority-engine/qualification-scope.ts -> app/utils/seniority-engine/qualification-key.ts`

## Hyperedges (group relationships)
- **Wayfinding Ticket Flow** — docs_agents_issue_tracker_wayfinder_map, docs_agents_issue_tracker_child_ticket, docs_agents_issue_tracker_native_issue_dependencies, docs_agents_issue_tracker_frontier_query, docs_agents_issue_tracker_claim, docs_agents_issue_tracker_resolve [EXTRACTED 1.00]
- **Canonical Triage Role Mappings** — docs_agents_triage_labels_skills_needs_triage, docs_agents_triage_labels_tracker_needs_triage, docs_agents_triage_labels_skills_needs_info, docs_agents_triage_labels_tracker_needs_info, docs_agents_triage_labels_skills_ready_for_agent, docs_agents_triage_labels_tracker_ready_for_agent, docs_agents_triage_labels_skills_ready_for_human, docs_agents_triage_labels_tracker_ready_for_human, docs_agents_triage_labels_skills_wontfix, docs_agents_triage_labels_tracker_wontfix [EXTRACTED 1.00]

## Communities (164 total, 48 thin omitted)

### Community 0 - "logger.ts"
Cohesion: 0.13
Nodes (20): { showBanner, isIos, showIosModal, install, snooze, dismiss }, downloadLog(), entryCount, mockUserStore, mountComposable(), usePwaInstall(), snooze(), clearLogBuffer() (+12 more)

### Community 1 - "RetirementComparison.vue"
Cohesion: 0.20
Nodes (10): chartData, chartOptions, { colors }, compareScope, currentScope, props, qualificationScopeOptions, { scopeOptions, specForLabel } (+2 more)

### Community 2 - "lens.ts"
Cohesion: 0.15
Nodes (21): EntryPredicate, RetirementCountProjection, SeniorityTrajectoryPoint, CreateSeniorityLensOptions, LensContext, analyzeRetirementYears(), findPercentileCrossing(), DemographicsOptions (+13 more)

### Community 3 - "parse.ts"
Cohesion: 0.09
Nodes (31): columnOptions, emit, props, requiredFields, updateOption(), EXCEL_EPOCH_MS, ISO_DATE_REGEX, NAMED_MONTH_FORMATS (+23 more)

### Community 4 - "dependencies"
Cohesion: 0.05
Nodes (43): better-sqlite3, chart.js, dexie, @fontsource/jetbrains-mono, @fontsource-variable/dm-sans, @internationalized/date, nuxt, @nuxt/content (+35 more)

### Community 5 - "pages/dashboard.vue"
Cohesion: 0.07
Nodes (29): { deleteList }, deletingId, ListItem, toast, useSeniorityLists(), clearStore(), fetchEntries(), fetchLists() (+21 more)

### Community 6 - "upload.vue"
Cohesion: 0.07
Nodes (24): activeFilterLabel, activeRowFilter, canAdvance, changeFormat(), clearRowFilter(), currentStep, currentStepIndex, effectiveDateModel (+16 more)

### Community 7 - "RetirementsTab.vue"
Cohesion: 0.07
Nodes (24): availableBases, availableFleets, availableSeats, baseItems, columns, filterBase, filterFleet, filterSeat (+16 more)

### Community 8 - "analysis.ts"
Cohesion: 0.08
Nodes (54): SeniorityTrajectoryPoint, useScopeFilter(), SeniorityTrajectory, SeniorityTrajectoryComparison, TrajectoryChange, formatQualification(), formatQualificationScope(), formatSeniorityCount() (+46 more)

### Community 9 - "upload/index.ts"
Cohesion: 0.11
Nodes (20): columnMap, mappingOptions, DEFAULT_COLUMN_MAP, DEFAULT_MAPPING_OPTIONS, ConfirmPhase, FilePhase, MappingPhase, ProcessingPhase (+12 more)

### Community 10 - "QualSeniorityScale.vue"
Cohesion: 0.18
Nodes (5): props, rowMaxCounts, sortedPositions, SEAT_ORDER, sortQualificationPositions()

### Community 11 - "SeniorityListViewer.vue"
Cohesion: 0.07
Nodes (27): canInsert, columns, columnVisibility, currentPage, { employeeNumber }, expanded, globalFilter, insertDisabledReason (+19 more)

### Community 12 - "lens.test.ts"
Cohesion: 0.07
Nodes (12): AnchorNotFoundError, createSeniorityLens(), SeniorityLensImplementation, asOfDate, assertAnchoredLensCapabilities(), assertOrganizationLensCapabilities(), createOrganizationLens(), entries (+4 more)

### Community 13 - "demographics.ts"
Cohesion: 0.21
Nodes (15): computeYOSDate(), AGE_BUCKETS, analyzeAgeDistribution(), analyzeQualificationComposition(), analyzeYearsOfServiceBuckets(), analyzeYearsOfServiceDistribution(), findCaptainQualificationThresholds(), asOfDate (+7 more)

### Community 14 - "date/index.ts"
Cohesion: 0.24
Nodes (15): todayISO(), addYearsISO(), computeRetireDate(), currentYear(), deriveAge(), diffYears(), extractYear(), retiresInYear() (+7 more)

### Community 15 - "qualification-scope.ts"
Cohesion: 0.31
Nodes (8): analyzeSeniorityQualificationViewer(), qualificationKey(), COMPANY_WIDE_QUALIFICATION_SCOPE, enumerateQualificationScopes(), qualificationScopesEqual(), qualificationScopeToEntryPredicate(), scopeSortKey(), entries

### Community 16 - "utils/temporal.ts"
Cohesion: 0.09
Nodes (34): mockStore, useClearAllData(), ImportAttemptInput, log, records, log, expectedAdaptedEntry, mockDb (+26 more)

### Community 17 - "seniority-list.ts"
Cohesion: 0.11
Nodes (17): mockStore, createUploadSession(), createConfirm(), mockStore, _useConfirm(), createFileIO(), mockDecodeWorkbook, mockRead (+9 more)

### Community 18 - "process-confirmed-mappings.ts"
Cohesion: 0.16
Nodes (17): validateImportEntry(), cloneAndFreeze(), columnValue(), entryPatchSchema, importIssueSchema, mapEntry(), mapField(), nextBatch() (+9 more)

### Community 19 - "seniority-analysis/math.ts"
Cohesion: 0.13
Nodes (25): isRetiredBy(), calculateAdditionalSeniorityPilots(), DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS, date(), calculateRetirementCountProjection(), calculateSeniorityPercentile(), calculateSeniorityRank(), calculateSeniorityTrajectory() (+17 more)

### Community 20 - "useSeniorityCore.ts"
Cohesion: 0.05
Nodes (47): {
  chartData: trajectoryChartData,
  computeComparativeTrajectory,
  computeRetirementProjection,
}, growthAssumptions, { hasData, hasAnchor, analysis, anchoredAnalysis, projectionEndDate }, isBannerDismissed, qualificationFilter, qualificationScopeOptions, qualificationTrajectoryChanges, { rankCard } (+39 more)

### Community 21 - "SeniorityGuru"
Cohesion: 0.10
Nodes (19): Contributing to SeniorityGuru, Contribution checklist, Import plugins, Commands, Contributing, Git workflow, License, SeniorityGuru (+11 more)

### Community 22 - "formatYear"
Cohesion: 0.12
Nodes (16): { defaults, colors }, props, trajectoryChartData, trajectoryChartOptions, waveChartData, waveChartOptions, chartData, chartOptions (+8 more)

### Community 23 - "delta.ts"
Cohesion: 0.31
Nodes (9): normalizeHeader(), decomposeDeltaCategory(), deltaImportPlugin, headerFields, headerIndex(), id(), mapDeltaSeat(), prepare() (+1 more)

### Community 24 - "snapshot.ts"
Cohesion: 0.05
Nodes (52): accentVariant, emit, employeeNumber, loading, onSave(), { savePreference }, BannerVm, { mockSavePreference, mockToastAdd } (+44 more)

### Community 25 - "fuzz-data.ts"
Cohesion: 0.21
Nodes (19): assignSeat(), baseSamples, baseSampleSizing, buildHireDatePool(), buildSeatCurve(), fakeName(), fuzzRow(), makeEmployeeIdPool() (+11 more)

### Community 26 - "UploadReviewTable.vue"
Cohesion: 0.12
Nodes (13): columns, currentPage, displayEntries, editableFields, editingCell, emit, IndexedEntry, pageCount (+5 more)

### Community 27 - "useSeniorityStore"
Cohesion: 0.09
Nodes (29): { showBanner, dismiss, exit }, useDemoBanner(), exit(), useUser(), clearPreferences(), loadPreferences(), savePreference(), registerDemoEnterHook() (+21 more)

### Community 28 - "lists.vue"
Cohesion: 0.09
Nodes (21): columns, TableRow, birthDateModel, { employeeNumber }, { newHire: newHireMode }, SeniorityListSummary, columns, { editOpen, saving, editState, deleteOpen, deleting, deleteTarget, openEdit, saveEdit, confirmDelete, doDelete } (+13 more)

### Community 29 - "SettingsNewHireModeCard.vue"
Cohesion: 0.25
Nodes (4): birthDateModel, { newHire: newHireMode }, { mockEnabled, mockReset, mockToastAdd }, toast

### Community 30 - "compare.vue"
Cohesion: 0.15
Nodes (16): activeCompareTab, compareTabs, { employeeNumber }, listIdA, listIdB, { lists, listOptions, fetchLists }, { loading, error, comparison }, route (+8 more)

### Community 32 - "PlainDate"
Cohesion: 0.22
Nodes (13): NewHireControls, useGrowthAssumptions(), SeniorityEntry, GrowthAssumptions, CalculateRetirementCountProjectionOptions, CalculateSeniorityTrajectoryComparisonOptions, CalculateSeniorityTrajectoryOptions, CreateSeniorityAnalysisOptions (+5 more)

### Community 33 - "diagnostic-schema.ts"
Cohesion: 0.17
Nodes (11): draftSchema, ImportDiagnosticTraceSchema, importIssueSchema, mappingSelectionSchema, preparationPatchSchema, preparedColumnSchema, preparedSheetSchema, reviewEditPatchSchema (+3 more)

### Community 34 - "prepare-import.ts"
Cohesion: 0.23
Nodes (10): ImportField, genericImportPlugin, applyPatch(), importPluginSchema, preparationPatchSchema, prepareImport(), sourceColumns(), sourceSheet (+2 more)

### Community 35 - "generate-demo-v2.ts"
Cohesion: 0.21
Nodes (15): applyNewHires(), applyRetirements(), applyTransfers(), applyUpgrades(), BASE_ROTATION, __dirname, isoToMdy(), logger (+7 more)

### Community 36 - "PositionTab.vue"
Cohesion: 0.14
Nodes (14): { employeeNumber }, growthAssumptions, { hasData, newHire, anchoredAnalysis, projectionEndDate }, hasEmployeeNumber, hasProjection, positionSliderMax, positionYearsInput, projectionDate (+6 more)

### Community 37 - "fields.ts"
Cohesion: 0.29
Nodes (8): hasRequiredColumnMappings(), hasRequiredImportMappings(), IMPORT_FIELD_DEFINITIONS, IMPORT_FIELDS, ImportFieldDefinition, MappingSelection, MappingStrategy, requiredImportFields()

### Community 38 - "devDependencies"
Cohesion: 0.13
Nodes (15): @commitlint/cli, eslint, fake-indexeddb, @faker-js/faker, @nuxt/test-utils, devDependencies, @commitlint/cli, eslint (+7 more)

### Community 39 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dev:debug, fuzz, generate, lint, lint:fix (+7 more)

### Community 40 - "ComparisonDiffTab.vue"
Cohesion: 0.15
Nodes (10): badgeLabel(), filteredRows, isEmpty, page, PAGE_SIZE_OPTIONS, pageSize, paginatedRows, props (+2 more)

### Community 41 - "registry.ts"
Cohesion: 0.15
Nodes (9): config, emit, feedbackEmail, infoUploadType, props, showInfoModal, sourceSheet, importPlugins (+1 more)

### Community 42 - "ComparisonDiffTab.test.ts"
Cohesion: 0.17
Nodes (6): DepartedRow, QualMoveRow, RankChangeRow, RetiredRow, DiffRow, DEMO_DIFF_ROWS

### Community 43 - "ComparisonTab.vue"
Cohesion: 0.17
Nodes (11): activeFilters, filteredData, filterOptions, props, table, ComparisonTabExposed, testColumns, testData (+3 more)

### Community 44 - "BaseStatusTable.vue"
Cohesion: 0.17
Nodes (12): adjusted, availableSeats, BaseStatusRow, columns, displayData, DisplayRow, highlightClass(), isMobile (+4 more)

### Community 45 - "generic.ts"
Cohesion: 0.49
Nodes (8): importFieldLabel(), matchingColumns(), preparedColumn(), preparedColumnId(), FIELD_ALIASES, prepare(), prepare(), PreparedColumn

### Community 46 - "TrajectoryDemo.vue"
Cohesion: 0.17
Nodes (12): activePreset, chartData, chartOptions, container, generateTrajectory(), growthRate, legendItems, qualificationScope (+4 more)

### Community 47 - "jetblue.ts"
Cohesion: 0.36
Nodes (8): aliases, createJetBlueImportPlugin(), hasJetBlueEuMarker(), headerIndex(), jetblueImportPlugin, JetBlueImportPluginOptions, normalize(), defineImportPlugin()

### Community 49 - "useDemoBanner.test.ts"
Cohesion: 0.33
Nodes (5): mockEmitHook, mockGetPreference, mockSavePreference, mockSeniorityLists, mountComposable()

### Community 50 - "pwa-prompt.ts"
Cohesion: 0.47
Nodes (3): BeforeInstallPromptEvent, deferredInstallPrompt, sharedShowIosModal

### Community 51 - "seniority-compare.ts"
Cohesion: 0.33
Nodes (8): DELETED_KINDS, CompareResult, DepartedPilot, Entry, NewHire, QualMove, RankChange, RetiredPilot

### Community 52 - "_useFileIO"
Cohesion: 0.15
Nodes (20): useSeniorityUpload(), clearUploadType(), reset(), resetDownstream(), selectUploadType(), createMapping(), { mockProcessConfirmedMappings }, toConfirmedMappings() (+12 more)

### Community 53 - "useSeniorityCompare"
Cohesion: 0.67
Nodes (4): useSeniorityCompare(), fetchListData(), loadComparison(), computeComparison()

### Community 54 - "scripts/tsconfig.json"
Cohesion: 0.17
Nodes (11): node, node_modules, **/*.ts, ../tsconfig.json, compilerOptions, baseUrl, paths, types (+3 more)

### Community 55 - "useClearAllData.test.ts"
Cohesion: 0.50
Nodes (3): mockImportAttemptsStore, mockSeniorityStore, mockUserStore

### Community 56 - "toggleInsert"
Cohesion: 0.67
Nodes (3): focusUserPage(), scrollToUserRow(), toggleInsert()

### Community 57 - "SettingsPreferencesCard.vue"
Cohesion: 0.18
Nodes (8): loading, { retirementAge, savePreference }, state, CardVm, { mockSavePreference, mockToastAdd }, toast, UpdatePreferencesSchema, UpdatePreferencesState

### Community 58 - "Wayfinder Child Ticket"
Cohesion: 0.20
Nodes (11): Wayfinder Child Ticket, Ticket Claim, Frontier Query, GitHub CLI, GitHub Issue Tracker, GitHub Issues, GitHub Native Issue Dependencies, Pull Requests (+3 more)

### Community 59 - "RetirementSnapshot.vue"
Cohesion: 0.13
Nodes (14): columns, formatDate(), maxYears, PresentedSeniorityTrajectoryPoint, props, SeniorityTrajectoryPoint, tableData, TableRow (+6 more)

### Community 61 - "SeniorityComparison.vue"
Cohesion: 0.20
Nodes (9): chartData, chartOptions, { colors }, compareScope, currentScope, defaultScope, props, qualificationScopeOptions (+1 more)

### Community 62 - "useUser.test.ts"
Cohesion: 0.40
Nodes (4): mockLoadPreferences, mockSavePreference, mockSeniorityEntries, mockUserStore

### Community 63 - "Review rules"
Cohesion: 0.22
Nodes (8): Boundaries, Design quality, Findings, Nuxt and TypeScript, Review process, Review rules, Schemas and domain types, SeniorityGuru code review

### Community 64 - "build-diff-rows.test.ts"
Cohesion: 0.22
Nodes (3): diffRows, buildDiffRows(), emptyResult

### Community 65 - "makeDomainEntry"
Cohesion: 0.29
Nodes (6): state, stubs, makeDomainEntry(), makeList(), makeEntry(), assertReadonlySnapshot()

### Community 66 - "utils/seniority.test.ts"
Cohesion: 0.33
Nodes (3): asOfDate, assertPublicCapabilityAndReadonlyTypes(), entries

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

### Community 75 - "AnchoredSeniorityLensImplementation"
Cohesion: 0.25
Nodes (5): AnchoredSeniorityLensImplementation, asOfDate(), commonLensMethods(), memoizeLast(), stableStringify()

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
Cohesion: 0.17
Nodes (12): DecodedWorkbook, DecodeError, DecodeWorkbookResult, MappedEntryTransformationInput, SourceCellValue, SourceColumn, SourceRow, SourceSheet (+4 more)

### Community 81 - "useChangelog.ts"
Cohesion: 0.40
Nodes (3): lastSeenDate, mountComposable(), useChangelog()

### Community 82 - "pages/index.vue"
Cohesion: 0.05
Nodes (34): Handler, mockNavigateTo, mockSeniorityStore, mockUserStore, runtimeHandlers, Handler, mockNavigateTo, mockSeniorityStore (+26 more)

### Community 83 - "useImportAttemptsStore"
Cohesion: 0.19
Nodes (11): attempts, save(), useImportAttempts(), exportAttempt(), load(), remove(), update(), newestFirst() (+3 more)

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
Cohesion: 0.11
Nodes (20): accentVariant, animatedPercentile, props, yearsOfService, ageDistribution, captainQualificationThresholds, demographicsResult, { hasData, newHire, analysis, anchoredAnalysis, userEntry } (+12 more)

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

### Community 103 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 108 - "SettingsClearDataCard.vue"
Cohesion: 0.29
Nodes (6): clearAll(), { clearAllData }, confirm, loading, toast, clearAllData()

### Community 121 - "Seniority Domain API and Presentation Seam Refactor"
Cohesion: 0.22
Nodes (8): Further Notes, Implementation Decisions, Out of Scope, Problem Statement, Seniority Domain API and Presentation Seam Refactor, Solution, Testing Decisions, User Stories

## Knowledge Gaps
- **653 isolated node(s):** `props`, `{ defaults, colors }`, `chartData`, `chartOptions`, `columns` (+648 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SeniorityEntry` connect `PlainDate` to `makeDomainEntry`, `lens.ts`, `analysis.ts`, `upload/index.ts`, `AnchoredSeniorityLensImplementation`, `lens.test.ts`, `demographics.ts`, `qualification-scope.ts`, `utils/temporal.ts`, `seniority-list.ts`, `seniority-analysis/math.ts`, `useSeniorityCore.ts`, `seniority-compare.ts`, `snapshot.ts`, `useUser.test.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `useSeniorityUpload()` connect `_useFileIO` to `upload.vue`, `upload/index.ts`, `seniority-list.ts`, `useImportAttemptsStore`, `useSeniorityCore.ts`, `snapshot.ts`, `useSeniorityStore`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `useUserStore` connect `useSeniorityStore` to `logger.ts`, `upload/index.ts`, `utils/temporal.ts`, `useSeniorityCore.ts`, `_useFileIO`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `useSeniorityStore` (e.g. with `clearAll()` and `clearStore()`) actually correct?**
  _`useSeniorityStore` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `props`, `{ defaults, colors }`, `chartData` to the rest of the system?**
  _653 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `logger.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12962962962962962 - nodes in this community are weakly interconnected._
- **Should `lens.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1471264367816092 - nodes in this community are weakly interconnected._