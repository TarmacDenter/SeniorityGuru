import { z } from 'zod'
import { SeniorityEntrySchema } from '../schemas/seniority-list'
import { ImportFieldSchema } from './fields'
import type { ImportDiagnosticTrace } from './types'

const sourceCellValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
const sourceSheetSchema = z.object({
  id: z.string(),
  name: z.string(),
  columns: z.array(z.object({ id: z.string(), label: z.string().nullable() })),
  rows: z.array(z.object({ id: z.string(), cells: z.array(sourceCellValueSchema) })),
})
const preparedColumnSchema = z.object({
  id: z.string(),
  label: z.string(),
  sourceColumnId: z.string().optional(),
})
const preparedSheetSchema = z.object({
  sourceSheet: sourceSheetSchema,
  columns: z.array(preparedColumnSchema),
  rows: z.array(z.object({
    sourceRowId: z.string(),
    included: z.boolean().optional(),
    cells: z.record(z.string(), sourceCellValueSchema),
  })),
})
const importIssueSchema = z.object({
  kind: z.enum(['ambiguous-alias', 'preparation-failed', 'transformation-failed', 'validation-failed']),
  field: ImportFieldSchema.optional(),
  message: z.string().min(1),
})
const preparationPatchSchema = z.object({
  columns: z.array(preparedColumnSchema).optional(),
  cellValues: z.record(z.string(), z.record(z.string(), sourceCellValueSchema)).optional(),
  mappingSuggestions: z.record(ImportFieldSchema, z.string()).optional(),
  issues: z.array(importIssueSchema).optional(),
  metadata: z.object({ effectiveDate: z.string().optional(), title: z.string().optional() }).optional(),
  excludedSourceRowIds: z.array(z.string()).optional(),
})
const mappingSelectionSchema = z.union([
  z.object({ kind: z.literal('column'), columnId: z.string() }),
  z.object({ kind: z.literal('combined-name'), firstNameColumnId: z.string(), lastNameColumnId: z.string() }),
  z.object({ kind: z.literal('retirement-from-birth-date'), columnId: z.string(), retirementAge: z.number() }),
])
const draftSchema = z.object({
  id: z.string(),
  sourceRowId: z.string(),
  entry: SeniorityEntrySchema.partial(),
  issues: z.array(importIssueSchema),
})
const reviewEditPatchSchema = z.object({
  action: z.enum(['update-cell', 'delete-row', 'insert-row', 'delete-error-rows']),
  entries: z.array(z.record(z.string(), z.unknown())),
  at: z.string(),
})

/** Validates the complete local diagnostic record before it crosses IndexedDB. */
export const ImportDiagnosticTraceSchema: z.ZodType<ImportDiagnosticTrace> = z.object({
  diagnosticSchemaVersion: z.literal(3),
  appBuildVersion: z.string(),
  plugin: z.object({ id: z.string(), label: z.string() }),
  file: z.object({ name: z.string() }),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  stage: z.enum(['reading', 'prepared', 'mapped', 'review', 'completed']),
  outcome: z.enum(['review', 'saved', 'failed']),
  error: z.string().optional(),
  sourceSheet: sourceSheetSchema.optional(),
  preparation: z.object({
    headerRowIndex: z.number(),
    patch: preparationPatchSchema,
    preparedSheet: preparedSheetSchema,
    issues: z.array(importIssueSchema),
    metadata: z.object({ effectiveDate: z.string().nullable(), title: z.string().nullable() }),
  }).optional(),
  mapping: z.object({
    confirmedMappings: z.record(ImportFieldSchema, mappingSelectionSchema),
    processedDrafts: z.array(draftSchema),
    transformationIssues: z.array(importIssueSchema),
  }).optional(),
  validation: z.object({ rowErrors: z.record(z.string(), z.array(z.string())) }).optional(),
  review: z.object({ editPatches: z.array(reviewEditPatchSchema) }).optional(),
  final: z.object({
    entries: z.array(z.unknown()),
    outcome: z.enum(['saved', 'failed']),
    savedListId: z.number().optional(),
    completedAt: z.string(),
  }).optional(),
})
