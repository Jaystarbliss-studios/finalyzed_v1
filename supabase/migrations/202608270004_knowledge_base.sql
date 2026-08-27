-- Searchable institutional/department requirement history for future Finalyzed projects.
create table if not exists public.institution_guidelines(
 id uuid primary key default gen_random_uuid(),
 institution_id uuid not null references public.institutions(id) on delete cascade,
 department_id uuid references public.departments(id) on delete cascade,
 category text not null,
 requirement text not null,
 source_note text,
 verified boolean not null default false,
 observed_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_institution_guidelines_institution on public.institution_guidelines(institution_id);
create index if not exists idx_institution_guidelines_department on public.institution_guidelines(department_id);
alter table public.institution_guidelines enable row level security;
drop policy if exists institution_guidelines_public_read on public.institution_guidelines;
create policy institution_guidelines_public_read on public.institution_guidelines for select to anon,authenticated using(true);
