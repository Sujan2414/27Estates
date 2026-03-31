-- supabase/migrations/20260331_employee_locations.sql
create table if not exists public.employee_locations (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.profiles(id) on delete cascade,
  lat           double precision not null,
  lng           double precision not null,
  accuracy      double precision,
  heading       double precision,
  updated_at    timestamptz not null default now(),
  unique (employee_id)   -- one row per employee, upserted on update
);

-- Enable Realtime
alter publication supabase_realtime add table public.employee_locations;

-- RLS: employees can write their own row; admins/managers can read all
alter table public.employee_locations enable row level security;

create policy "employee can upsert own location"
  on public.employee_locations for all
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

create policy "admin can read all locations"
  on public.employee_locations for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin', 'manager')
    )
  );
