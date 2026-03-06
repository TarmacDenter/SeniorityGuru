import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database'

type DbClient = SupabaseClient<Database>
type TableName = keyof Database['public']['Tables']

const BATCH_SIZE = 1000

/**
 * Fetch all rows from a Supabase table in batches to avoid PostgREST max_rows limit.
 * Returns the full result set or throws on error.
 */
export async function fetchAllRows<T extends TableName>(
  db: DbClient,
  table: T,
  build: (query: ReturnType<DbClient['from']>) => ReturnType<DbClient['from']>,
): Promise<Database['public']['Tables'][T]['Row'][]> {
  type Row = Database['public']['Tables'][T]['Row']
  let allRows: Row[] = []
  let from = 0

  while (true) {
    const query = build(db.from(table))
    const { data, error } = await (query as any).range(from, from + BATCH_SIZE - 1)

    if (error) throw error
    const batch = (data ?? []) as Row[]
    allRows = allRows.concat(batch)

    if (batch.length < BATCH_SIZE) break
    from += BATCH_SIZE
  }

  return allRows
}
