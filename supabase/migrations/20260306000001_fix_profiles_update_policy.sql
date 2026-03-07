-- Fix infinite recursion in profiles UPDATE policy.
-- The WITH CHECK clause had an inline SELECT on profiles which triggered
-- the SELECT policy, which called get_my_role(), which queried profiles
-- again — causing infinite recursion (error 42P17).
--
-- Fix: use get_my_role() (SECURITY DEFINER, bypasses RLS) to read the
-- current role instead of an inline sub-select that goes through RLS.

DROP POLICY "profiles: update" ON public.profiles;

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
