CREATE OR REPLACE VIEW public.user_count_uploads
WITH (security_invoker)
AS SELECT
  uploaded_by as user_id,
  COUNT(*) AS count
FROM public.seniority_lists
GROUP BY uploaded_by;

