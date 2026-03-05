-- ============================================================
-- 1. Airlines reference table (ICAO codes)
-- ============================================================
CREATE TABLE public.airlines (
  icao    text PRIMARY KEY,
  iata    text,
  name    text NOT NULL,
  alias   text   -- alternate/common name for the airline
);

ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;

-- Anyone can read airlines — needed for signup dropdown before auth
CREATE POLICY "airlines: public read"
  ON public.airlines FOR SELECT
  TO anon, authenticated
  USING (true);

-- No seed data in migration — airlines are loaded separately from CSV.
-- See: supabase/scripts/seed-airlines.js + supabase/data/iata_airlines.csv

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
  -- NOTE: hire_date is intentionally omitted. It is derived by looking up the
  -- user's employee_number in seniority_entries and is not stored redundantly.
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Security definer helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;

-- ============================================================
-- 4. Auto-create profile on signup
--    Reads icao_code from user metadata if provided at signup.
--    ON CONFLICT DO NOTHING makes seed + normal signup safe.
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
-- 5. RLS policies for profiles
--    Consolidated + initplan-safe (wrapped in SELECT)
-- ============================================================

-- SELECT: user reads own OR admin reads all
CREATE POLICY "profiles: select"
  ON public.profiles FOR SELECT
  USING (
    (select auth.uid()) = id
    OR (select public.get_my_role()) = 'admin'
  );

-- UPDATE: user updates own (no role escalation) OR admin updates all
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
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = (select auth.uid()))
      )
    END
  );

-- ============================================================
-- 6. Seniority Lists
-- ============================================================
CREATE TABLE public.seniority_lists (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  airline         text        NOT NULL,
  effective_date  date        NOT NULL,
  uploaded_by     uuid        NOT NULL REFERENCES public.profiles(id),
  status          text        NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seniority_lists ENABLE ROW LEVEL SECURITY;

-- SELECT: owner OR staff
CREATE POLICY "seniority_lists: select"
  ON public.seniority_lists FOR SELECT
  USING (
    (select auth.uid()) = uploaded_by
    OR (select public.get_my_role()) IN ('admin', 'moderator')
  );

-- INSERT: authenticated users insert own
CREATE POLICY "seniority_lists: insert own"
  ON public.seniority_lists FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = uploaded_by);

-- ============================================================
-- 7. Seniority Entries
-- ============================================================
CREATE TABLE public.seniority_entries (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id           uuid    NOT NULL REFERENCES public.seniority_lists(id) ON DELETE CASCADE,
  seniority_number  integer NOT NULL,
  employee_number   text    NOT NULL,
  name              text,
  hire_date         date    NOT NULL,
  base              text,
  seat              text,
  fleet             text,
  retire_date       date,
  -- An employee may appear only once per list publication
  CONSTRAINT seniority_entries_list_employee_unique UNIQUE (list_id, employee_number)
);

ALTER TABLE public.seniority_entries ENABLE ROW LEVEL SECURITY;

-- SELECT: owns parent list OR staff
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

-- INSERT: authenticated users insert for own lists
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
