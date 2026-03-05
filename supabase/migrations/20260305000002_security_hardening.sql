-- ============================================================
-- Security hardening: status constraint + UPDATE/DELETE policies
-- ============================================================

-- 1. Enforce valid status values at the DB level
ALTER TABLE public.seniority_lists
  ADD CONSTRAINT seniority_lists_status_check
  CHECK (status IN ('active', 'archived'));

-- 2. seniority_lists: staff can update (e.g. archive a list)
CREATE POLICY "seniority_lists: staff update"
  ON public.seniority_lists FOR UPDATE
  USING ((select public.get_my_role()) IN ('admin', 'moderator'))
  WITH CHECK ((select public.get_my_role()) IN ('admin', 'moderator'));

-- 3. seniority_lists: staff can delete
CREATE POLICY "seniority_lists: staff delete"
  ON public.seniority_lists FOR DELETE
  USING ((select public.get_my_role()) IN ('admin', 'moderator'));

-- 4. seniority_entries: staff can delete (owner delete cascades via list delete)
CREATE POLICY "seniority_entries: staff delete"
  ON public.seniority_entries FOR DELETE
  USING ((select public.get_my_role()) IN ('admin', 'moderator'));
