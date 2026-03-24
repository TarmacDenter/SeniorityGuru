import type { CompareResult, RetiredPilot, DepartedPilot, QualMove, RankChange, NewHire } from './seniority-compare'

export type DiffRow =
  | ({ kind: 'retired'; seniority_number: number } & Omit<RetiredPilot, 'seniority_number'>)
  | ({ kind: 'departed'; seniority_number: number } & Omit<DepartedPilot, 'seniority_number'>)
  | ({ kind: 'qualMove'; seniority_number: number } & Omit<QualMove, 'seniority_number'>)
  | ({ kind: 'rankChange'; seniority_number: number } & Omit<RankChange, 'new_rank'>)
  | ({ kind: 'newHire'; seniority_number: number } & Omit<NewHire, 'seniority_number'>)

const DELETED_KINDS = new Set<DiffRow['kind']>(['retired', 'departed'])

export function buildDiffRows(
  result: CompareResult,
  options: { includeRankChanges: boolean },
): DiffRow[] {
  const rows: DiffRow[] = []

  for (const p of result.retired) {
    const { seniority_number, ...rest } = p
    rows.push({ kind: 'retired', seniority_number, ...rest })
  }

  for (const p of result.departed) {
    const { seniority_number, ...rest } = p
    rows.push({ kind: 'departed', seniority_number, ...rest })
  }

  for (const p of result.qualMoves) {
    const { seniority_number, ...rest } = p
    rows.push({ kind: 'qualMove', seniority_number, ...rest })
  }

  if (options.includeRankChanges) {
    for (const p of result.rankChanges) {
      const { new_rank, ...rest } = p
      rows.push({ kind: 'rankChange', seniority_number: new_rank, ...rest })
    }
  }

  for (const p of result.newHires) {
    const { seniority_number, ...rest } = p
    rows.push({ kind: 'newHire', seniority_number, ...rest })
  }

  rows.sort((a, b) => {
    if (a.seniority_number !== b.seniority_number) {
      return a.seniority_number - b.seniority_number
    }
    // Deleted rows appear before non-deleted rows at the same position
    const aDeleted = DELETED_KINDS.has(a.kind) ? 0 : 1
    const bDeleted = DELETED_KINDS.has(b.kind) ? 0 : 1
    return aDeleted - bDeleted
  })

  return rows
}
