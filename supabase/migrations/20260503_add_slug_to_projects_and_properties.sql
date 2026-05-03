-- Adds slug columns to projects and properties for SEO-friendly URLs.
-- Backfill is non-destructive; existing UUID URLs continue to resolve via the
-- application layer. Triggers keep slug in sync on subsequent inserts/updates.
--
-- Applied to production via Supabase MCP on 2026-05-03 (365 projects + 50
-- properties backfilled). This file exists for parity with local development
-- and for reference.

-- Slug generation helper
create or replace function public.generate_slug(input text) returns text
language plpgsql immutable as $$
declare
  s text;
begin
  s := lower(coalesce(input, ''));
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  if s = '' then
    s := 'item';
  end if;
  return s;
end;
$$;

-- Projects
alter table public.projects add column if not exists slug text;
create unique index if not exists projects_slug_unique on public.projects(slug) where slug is not null;

do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in select id, project_name, location, city from public.projects where slug is null loop
    base := public.generate_slug(
      coalesce(r.project_name, '') ||
      case when r.location is not null then '-' || r.location else '' end ||
      case when r.city is not null then '-' || r.city else '' end
    );
    candidate := base;
    n := 1;
    while exists (select 1 from public.projects where slug = candidate) loop
      n := n + 1;
      candidate := base || '-' || n::text;
    end loop;
    update public.projects set slug = candidate where id = r.id;
  end loop;
end$$;

-- Properties (uses `title` as the name source)
alter table public.properties add column if not exists slug text;
create unique index if not exists properties_slug_unique on public.properties(slug) where slug is not null;

do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in select id, title, location, city from public.properties where slug is null loop
    base := public.generate_slug(
      coalesce(r.title, '') ||
      case when r.location is not null then '-' || r.location else '' end ||
      case when r.city is not null then '-' || r.city else '' end
    );
    candidate := base;
    n := 1;
    while exists (select 1 from public.properties where slug = candidate) loop
      n := n + 1;
      candidate := base || '-' || n::text;
    end loop;
    update public.properties set slug = candidate where id = r.id;
  end loop;
end$$;

-- Triggers: auto-generate slug on insert/update if NULL
create or replace function public.auto_slug_projects() returns trigger
language plpgsql as $$
declare
  base text;
  candidate text;
  n int;
begin
  if new.slug is null and new.project_name is not null then
    base := public.generate_slug(
      new.project_name ||
      case when new.location is not null then '-' || new.location else '' end ||
      case when new.city is not null then '-' || new.city else '' end
    );
    candidate := base;
    n := 1;
    while exists (select 1 from public.projects where slug = candidate and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)) loop
      n := n + 1;
      candidate := base || '-' || n::text;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$;

create or replace function public.auto_slug_properties() returns trigger
language plpgsql as $$
declare
  base text;
  candidate text;
  n int;
begin
  if new.slug is null and new.title is not null then
    base := public.generate_slug(
      new.title ||
      case when new.location is not null then '-' || new.location else '' end ||
      case when new.city is not null then '-' || new.city else '' end
    );
    candidate := base;
    n := 1;
    while exists (select 1 from public.properties where slug = candidate and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)) loop
      n := n + 1;
      candidate := base || '-' || n::text;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_slug_projects on public.projects;
create trigger trg_auto_slug_projects before insert or update of project_name, location, city on public.projects
  for each row execute function public.auto_slug_projects();

drop trigger if exists trg_auto_slug_properties on public.properties;
create trigger trg_auto_slug_properties before insert or update of title, location, city on public.properties
  for each row execute function public.auto_slug_properties();
