-- ============================================================
-- Consolidate duplicate permissive policies into single policies
-- per role+action to improve performance. Also fixes:
--   - Missing DELETE grant on seniority_entries
--   - uploaded_by transfer vulnerability in owner update
-- ============================================================

-- 1. seniority_lists UPDATE: merge "staff update" + "owner update"
DROP POLICY "seniority_lists: staff update" ON public.seniority_lists;
DROP POLICY "seniority_lists: owner update" ON public.seniority_lists;

CREATE POLICY "seniority_lists: update"
  ON public.seniority_lists FOR UPDATE
  USING (
    (select auth.uid()) = uploaded_by
    OR (select public.get_my_role()) IN ('admin', 'moderator')
  )
  WITH CHECK (
    -- Staff can write any values
    (select public.get_my_role()) IN ('admin', 'moderator')
    -- Owners can update but cannot transfer uploaded_by
    OR (
      (select auth.uid()) = uploaded_by
    )
  );

-- 2. seniority_lists DELETE: merge "staff delete" + "owner delete"
DROP POLICY "seniority_lists: staff delete" ON public.seniority_lists;
DROP POLICY "seniority_lists: owner delete" ON public.seniority_lists;

CREATE POLICY "seniority_lists: delete"
  ON public.seniority_lists FOR DELETE
  USING (
    (select auth.uid()) = uploaded_by
    OR (select public.get_my_role()) IN ('admin', 'moderator')
  );

-- 3. Add missing DELETE grant on seniority_entries (for staff delete policy)
GRANT DELETE ON public.seniority_entries TO authenticated;
