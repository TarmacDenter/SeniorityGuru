CREATE TABLE public.admin_activity_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text        NOT NULL,
  actor_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  metadata    jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read activity log"
  ON public.admin_activity_log FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Trigger: user signup → log entry
CREATE OR REPLACE FUNCTION public.log_user_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.admin_activity_log (event_type, actor_id, metadata)
  VALUES ('user_signup', NEW.id, jsonb_build_object('user_id', NEW.id));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_user_signup();

-- Trigger: list upload → log entry
CREATE OR REPLACE FUNCTION public.log_list_upload()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.admin_activity_log (event_type, actor_id, metadata)
  VALUES ('list_upload', NEW.uploaded_by,
    jsonb_build_object('list_id', NEW.id, 'title', NEW.title, 'airline', NEW.airline));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_list_uploaded
  AFTER INSERT ON public.seniority_lists
  FOR EACH ROW EXECUTE FUNCTION public.log_list_upload();
