-- Finalyzed: starter points, 2% real-money boundary fees, dispute ledger.
-- Applied to the production Supabase project as migration finalyzed_fees_starter_points_and_disputes.
-- This file is the source-of-truth record for the database change.

create table if not exists public.platform_fees (
  id uuid primary key default gen_random_uuid(),
  fee_type text not null,
  amount_ngn bigint not null check (amount_ngn >= 0),
  gross_amount_ngn bigint not null check (gross_amount_ngn >= 0),
  net_amount_ngn bigint not null check (net_amount_ngn >= 0),
  user_id uuid references auth.users(id),
  project_id uuid references public.projects(id),
  reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.platform_fees enable row level security;
drop policy if exists "admins can view platform fees" on public.platform_fees;
create policy "admins can view platform fees" on public.platform_fees
for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin' and p.account_status='approved'));

create table if not exists public.project_disputes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  raised_by uuid not null references auth.users(id),
  reason text not null,
  status text not null default 'open',
  resolution text,
  refund_pct integer check (refund_pct between 0 and 100),
  admin_id uuid references auth.users(id),
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.project_disputes enable row level security;
drop policy if exists "participants can view disputes" on public.project_disputes;
create policy "participants can view disputes" on public.project_disputes
for select to authenticated
using (
  raised_by=(select auth.uid())
  or exists(select 1 from public.projects p where p.id=project_disputes.project_id and (p.student_id=(select auth.uid()) or p.writer_id=(select auth.uid()) or p.editor_id=(select auth.uid())))
  or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin' and p.account_status='approved')
);

-- The complete function bodies are maintained in the production migration history.
-- Keep this repository migration aligned with the applied Supabase migration before
-- replaying from a clean database.
