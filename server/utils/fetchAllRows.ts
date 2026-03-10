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
  const allRows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await queryBuilder.range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return allRows
}
