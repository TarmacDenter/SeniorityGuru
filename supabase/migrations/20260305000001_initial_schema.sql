-- ============================================================
-- SeniorityGuru — Initial Schema
-- Squashed from 8 pre-launch migrations into a single file.
-- ============================================================

-- ============================================================
-- 1. Airlines reference table
-- ============================================================
CREATE TABLE public.airlines (
  icao    text PRIMARY KEY,
  iata    text,
  name    text NOT NULL,
  alias   text
);

ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "airlines: public read"
  ON public.airlines FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.airlines TO anon, authenticated;

-- ============================================================
-- 2. Enum + Profiles table
-- ============================================================
CREATE TYPE public.user_role AS ENUM ('user', 'moderator', 'admin');

CREATE TABLE public.profiles (
  id                       uuid             PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                     public.user_role NOT NULL DEFAULT 'user',
  icao_code                text             REFERENCES public.airlines(icao) ON DELETE SET NULL,
  employee_number          text,
  mandatory_retirement_age integer          NOT NULL DEFAULT 65,
  created_at               timestamptz      NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- ============================================================
-- 3. Security definer helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;

-- ============================================================
-- 4. Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, icao_code)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'icao_code', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. Profiles RLS policies
-- ============================================================
CREATE POLICY "profiles: select"
  ON public.profiles FOR SELECT
  USING (
    (select auth.uid()) = id
    OR (select public.get_my_role()) = 'admin'
  );

CREATE POLICY "profiles: update"
  ON public.profiles FOR UPDATE
  USING (
    (select auth.uid()) = id
    OR (select public.get_my_role()) = 'admin'
  )
  WITH CHECK (
    CASE
      WHEN (select public.get_my_role()) = 'admin' THEN true
      ELSE (
        (select auth.uid()) = id
        AND role = (select public.get_my_role())
      )
    END
  );

-- ============================================================
-- 6. Seniority Lists
-- ============================================================
CREATE TABLE public.seniority_lists (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  airline         text        NOT NULL,
  title           text,
  effective_date  date        NOT NULL,
  uploaded_by     uuid        NOT NULL REFERENCES public.profiles(id),
  status          text        NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seniority_lists_status_check CHECK (status IN ('active', 'archived'))
);

ALTER TABLE public.seniority_lists ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seniority_lists TO authenticated;

CREATE POLICY "seniority_lists: select"
  ON public.seniority_lists FOR SELECT
  USING (
    (select auth.uid()) = uploaded_by
    OR (select public.get_my_role()) IN ('admin', 'moderator')
  );

CREATE POLICY "seniority_lists: insert own"
  ON public.seniority_lists FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = uploaded_by);

CREATE POLICY "seniority_lists: update"
  ON public.seniority_lists FOR UPDATE
  USING (
    (select auth.uid()) = uploaded_by
    OR (select public.get_my_role()) IN ('admin', 'moderator')
  )
  WITH CHECK (
    (select public.get_my_role()) IN ('admin', 'moderator')
    OR (select auth.uid()) = uploaded_by
  );

CREATE POLICY "seniority_lists: delete"
  ON public.seniority_lists FOR DELETE
  USING (
    (select auth.uid()) = uploaded_by
    OR (select public.get_my_role()) IN ('admin', 'moderator')
  );

-- ============================================================
-- 7. Seniority Entries
-- ============================================================
CREATE TABLE public.seniority_entries (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  seniority_number  integer NOT NULL,
  list_id           uuid    NOT NULL REFERENCES public.seniority_lists(id) ON DELETE CASCADE,
  employee_number   text    NOT NULL,
  name              text,
  hire_date         date    NOT NULL,
  base              text,
  seat              text,
  fleet             text,
  retire_date       date,
  CONSTRAINT seniority_entries_list_employee_unique UNIQUE (list_id, employee_number)
);

ALTER TABLE public.seniority_entries ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.seniority_entries TO authenticated;

CREATE POLICY "seniority_entries: select"
  ON public.seniority_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.seniority_lists
      WHERE id = seniority_entries.list_id
        AND uploaded_by = (select auth.uid())
    )
    OR (select public.get_my_role()) IN ('admin', 'moderator')
  );

CREATE POLICY "seniority_entries: insert own"
  ON public.seniority_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.seniority_lists
      WHERE id = seniority_entries.list_id
        AND uploaded_by = (select auth.uid())
    )
  );

CREATE POLICY "seniority_entries: staff delete"
  ON public.seniority_entries FOR DELETE
  USING ((select public.get_my_role()) IN ('admin', 'moderator'));
