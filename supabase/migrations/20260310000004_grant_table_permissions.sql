-- Grant table-level permissions to authenticated and anon roles.
-- RLS policies remain the actual access control — these grants
-- simply allow PostgREST (Data API) to route requests to RLS.

-- airlines: anon needs SELECT for signup dropdown; authenticated for general use
GRANT SELECT ON public.airlines TO anon, authenticated;

-- profiles: authenticated users read/update own (enforced by RLS)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- seniority_lists: authenticated users CRUD own lists (enforced by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seniority_lists TO authenticated;

-- seniority_entries: authenticated users read/insert own entries (enforced by RLS)
GRANT SELECT, INSERT ON public.seniority_entries TO authenticated;
