import { createLogger } from '#shared/utils/logger'

const PAGE_SIZE = 1000
const log = createLogger('fetch-all-rows')

interface RangeQuery<T> {
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
}

/** Fetch all rows in batches to avoid PostgREST's max_rows limit (default 1000). */
export async function fetchAllRows<T>(
  queryBuilder: RangeQuery<T>,
  context: string,
): Promise<T[]> {

  const fetchBatch = async (offset: number, batch: number, acc: T[]): Promise<T[]> => {
    const { data, error } = await queryBuilder.range(offset, offset + PAGE_SIZE - 1)
    if (error) {
      log.error('Batch fetch failed', { context, batch, offset, error: error.message })
      throw new Error(`Failed to fetch rows: ${error.message}`)
    }
    if (!Array.isArray(data)) {
      log.error('Unexpected data type', { context, batch, offset, type: typeof data })
      throw new Error(`Expected data to be an array, got ${typeof data}`)
    }
    if (data && data.length > 0) {
      const next = [...acc, ...data]
      log.debug('Batch fetched', { context, batch, offset, rows: data.length, total: next.length })
      if (data.length < PAGE_SIZE) return next
      return fetchBatch(offset + PAGE_SIZE, batch + 1, next)
    }
    return acc
  }

  const rows = await fetchBatch(0, 1, [])
  log.debug('Fetch complete', { context, totalRows: rows.length })
  return rows
}
