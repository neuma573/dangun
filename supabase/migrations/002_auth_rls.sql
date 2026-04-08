-- ════════════════════════════════════════════════
--  단군비즈 CRM — Auth RLS Migration
--
--  Replaces the anon-allow-all policies from 001
--  with authenticated-only access.
--
--  Run this AFTER creating your Supabase Auth user:
--    Supabase Dashboard → Authentication → Users → Add user
-- ════════════════════════════════════════════════

-- Drop the wide-open anon policies from migration 001
DROP POLICY IF EXISTS "anon_all_customers" ON public.customers;
DROP POLICY IF EXISTS "anon_all_trash"     ON public.trash;

-- Allow only authenticated (logged-in) users
CREATE POLICY "auth_all_customers" ON public.customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_trash" ON public.trash
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
