-- Allow users to update their own seniority lists (airline label, effective_date).
-- Staff (admin/moderator) already have update access via the staff update policy.
CREATE POLICY "seniority_lists: owner update"
  ON public.seniority_lists FOR UPDATE
  USING ((select auth.uid()) = uploaded_by)
  WITH CHECK ((select auth.uid()) = uploaded_by);
