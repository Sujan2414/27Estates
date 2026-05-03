-- Custom FAQs per project / property (AEO + GEO).
--
-- Adds a `faqs jsonb` column to projects and properties. NULL means "no
-- custom FAQs — fall back to auto-generated". Non-null is expected to be
-- an array of { question, answer } objects.
--
-- Apply via Supabase Dashboard SQL editor or `supabase db push`. Additive
-- and reversible (`alter table … drop column faqs`).

alter table public.projects   add column if not exists faqs jsonb;
alter table public.properties add column if not exists faqs jsonb;

comment on column public.projects.faqs   is 'Optional array of { question, answer } objects. When NULL, the project page falls back to auto-generated FAQs.';
comment on column public.properties.faqs is 'Optional array of { question, answer } objects. When NULL, the property page falls back to auto-generated FAQs.';

-- Optional CHECK constraint to enforce shape. We keep it loose (jsonb array,
-- each element an object with at least question + answer string keys) so the
-- admin UI can fail-safe without rigid validation.
do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'projects_faqs_shape_chk'
    ) then
        alter table public.projects
            add constraint projects_faqs_shape_chk
            check (
                faqs is null
                or (jsonb_typeof(faqs) = 'array'
                    and not exists (
                        select 1 from jsonb_array_elements(faqs) e
                        where jsonb_typeof(e) <> 'object'
                          or e ? 'question' is false
                          or e ? 'answer' is false
                    ))
            );
    end if;
    if not exists (
        select 1 from pg_constraint where conname = 'properties_faqs_shape_chk'
    ) then
        alter table public.properties
            add constraint properties_faqs_shape_chk
            check (
                faqs is null
                or (jsonb_typeof(faqs) = 'array'
                    and not exists (
                        select 1 from jsonb_array_elements(faqs) e
                        where jsonb_typeof(e) <> 'object'
                          or e ? 'question' is false
                          or e ? 'answer' is false
                    ))
            );
    end if;
end$$;
