-- Adds the `direction` column to properties for parity with projects.
-- Direction is a Bangalore-zone hint (North / South / East / West / Central)
-- used as a filter on the public listings dashboard.
--
-- Apply via Supabase Dashboard SQL editor or `supabase db push`.

alter table public.properties add column if not exists direction text;
comment on column public.properties.direction is 'North / South / East / West / Central — Bangalore zone hint, used by listing filters.';

-- Optional CHECK to constrain values (matches the project select options)
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'properties_direction_chk') then
        alter table public.properties
            add constraint properties_direction_chk
            check (direction is null or direction in ('North','South','East','West','Central'));
    end if;
    if not exists (select 1 from pg_constraint where conname = 'projects_direction_chk') then
        alter table public.projects
            add constraint projects_direction_chk
            check (direction is null or direction in ('North','South','East','West','Central'));
    end if;
end$$;
