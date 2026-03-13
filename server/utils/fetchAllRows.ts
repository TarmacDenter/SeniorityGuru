const PAGE_SIZE = 1000

interface RangeQuery<T> {
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
}

/**
 * Fetch all rows from a Supabase query in batches to avoid PostgREST max_rows limit.
 * Server-side version for use in Nitro API routes.
 */
export async function fetchAllRows<T>(
  queryBuilder: RangeQuery<T>,
): Promise<T[]> {

  const fetchBatch = async (offset: number, acc: T[]): Promise<T[]> => {
    const { data, error } = await queryBuilder.range(offset, offset + PAGE_SIZE - 1)
    if (error) {
      throw new Error(`Failed to fetch rows: ${error.message}`)
    }
    if (!Array.isArray(data)) {
      throw new Error(`Expected data to be an array, got ${typeof data}`)
    }
    if (data && data.length > 0) {
      const next = [...acc, ...data]
      if (data.length < PAGE_SIZE) return next
      return fetchBatch(offset + PAGE_SIZE, next)
    }
    return acc
  }
  
  return fetchBatch(0, [])
}
