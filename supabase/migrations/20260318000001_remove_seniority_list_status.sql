ALTER TABLE public.seniority_lists
  DROP CONSTRAINT IF EXISTS seniority_lists_status_check,
  DROP COLUMN IF EXISTS status;
