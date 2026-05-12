-- supabase/migrations/20260427_employee_locations_open_read.sql
--
-- Open read access on employee_locations to ALL authenticated employees,
-- not just admins/managers. Workmate is an internal team-coordination app
-- and the live-locations map is one of its core features — the previous
-- admin-only policy meant a regular employee saw only their own pin and
-- thought the feature was broken.
--
-- Write/update/delete still locked down to row owner via the existing
-- "employee can upsert own location" policy. We only widen SELECT.

drop policy if exists "admin can read all locations" on public.employee_locations;

create policy "authenticated can read all locations"
  on public.employee_locations for select
  to authenticated
  using (true);
