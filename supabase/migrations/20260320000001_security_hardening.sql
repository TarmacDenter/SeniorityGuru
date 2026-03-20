-- ============================================================
-- Security hardening pass
-- 1. Fix SECURITY DEFINER trigger functions — add SET search_path = public
-- 2. admin_activity_log: actor_id ON DELETE SET NULL + nullable
-- 3. admin_activity_log: CHECK constraint on event_type
-- 4. Drop dead SELECT RLS policy (no GRANT exists; service role bypasses RLS)
-- ============================================================

-- ============================================================
-- 1. Recreate trigger functions with SET search_path = public
--    (CREATE OR REPLACE cannot change SET options — must drop and recreate
--    while triggers temporarily reference a missing function; this is safe
--    within a single transaction because Postgres validates at trigger-fire
--    time, not at definition time)
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_user_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_activity_log (event_type, actor_id, metadata)
  VALUES ('user_signup', NEW.id, jsonb_build_object('user_id', NEW.id));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_list_upload()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_activity_log (event_type, actor_id, metadata)
  VALUES ('list_upload', NEW.uploaded_by,
    jsonb_build_object('list_id', NEW.id, 'title', NEW.title, 'airline', NEW.airline));
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. actor_id: NOT NULL → nullable + ON DELETE CASCADE → SET NULL
-- ============================================================
ALTER TABLE public.admin_activity_log
  ALTER COLUMN actor_id DROP NOT NULL;

ALTER TABLE public.admin_activity_log
  DROP CONSTRAINT admin_activity_log_actor_id_fkey;

ALTER TABLE public.admin_activity_log
  ADD CONSTRAINT admin_activity_log_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================================
-- 3. Constrain event_type to known values
-- ============================================================
ALTER TABLE public.admin_activity_log
  ADD CONSTRAINT admin_activity_log_event_type_check
  CHECK (event_type IN ('user_signup', 'list_upload', 'account_deletion'));

-- ============================================================
-- 4. Drop dead SELECT policy — table is service-role-only;
--    no GRANT means the policy is never evaluated via PostgREST.
-- ============================================================
DROP POLICY IF EXISTS "Admins can read activity log" ON public.admin_activity_log;
