-- Allow users to delete their own seniority lists.
-- Child seniority_entries rows are cleaned up via ON DELETE CASCADE
-- (CASCADE bypasses RLS on child tables).
CREATE POLICY "seniority_lists: owner delete"
  ON public.seniority_lists FOR DELETE
  USING ((select auth.uid()) = uploaded_by);
