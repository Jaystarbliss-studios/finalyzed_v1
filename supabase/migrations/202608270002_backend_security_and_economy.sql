-- Finalyzed backend hardening and marketplace economy
-- Applies the Supabase production security boundary, atomic payment flows,
-- onboarding role locking, Finalyzed Points economy and wallet withdrawals.

-- RLS policies are deliberately scoped to authenticated users for private data.
-- Public reference/catalog data remains publicly readable.

drop policy if exists editor_application_create on public.editor_applications;
drop policy if exists editor_application_self_insert on public.editor_applications;
create policy editor_application_create on public.editor_applications for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending');

drop policy if exists writer_application_create on public.writer_applications;
drop policy if exists writer_application_self_insert on public.writer_applications;
create policy writer_application_create on public.writer_applications for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending');

drop policy if exists notifications_self on public.notifications;
create policy notifications_self on public.notifications for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists payments_student_read on public.payments;
create policy payments_student_read on public.payments for select to authenticated
  using ((select auth.uid()) = student_id);

drop policy if exists point_transactions_self on public.point_transactions;
create policy point_transactions_self on public.point_transactions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists profiles_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_self on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_self on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists assignments_participant_read on public.project_assignments;
create policy assignments_participant_read on public.project_assignments for select to authenticated using (
  (select auth.uid()) = writer_id or (select auth.uid()) = editor_id or
  exists(select 1 from public.projects p where p.id = project_assignments.project_id and p.student_id = (select auth.uid()))
);

drop policy if exists escrow_participant_read on public.project_escrow;
create policy escrow_participant_read on public.project_escrow for select to authenticated using (
  (select auth.uid()) = writer_id or
  exists(select 1 from public.projects p where p.id = project_escrow.project_id and p.student_id = (select auth.uid()))
);

drop policy if exists files_project_participant on public.project_files;
create policy files_project_participant on public.project_files for select to authenticated using (
  exists(select 1 from public.projects p where p.id = project_files.project_id
    and (p.student_id = (select auth.uid()) or p.writer_id = (select auth.uid()) or p.editor_id = (select auth.uid())))
);

drop policy if exists revisions_project_participant on public.project_revisions;
create policy revisions_project_participant on public.project_revisions for select to authenticated using (
  exists(select 1 from public.projects p where p.id = project_revisions.project_id
    and (p.student_id = (select auth.uid()) or p.writer_id = (select auth.uid()) or p.editor_id = (select auth.uid())))
);

drop policy if exists spec_versions_owner on public.project_specification_versions;
create policy spec_versions_owner on public.project_specification_versions for select to authenticated using (
  exists(select 1 from public.project_specifications s
    where s.id = project_specification_versions.specification_id and s.student_id = (select auth.uid()))
);

drop policy if exists specs_owner on public.project_specifications;
create policy specs_owner on public.project_specifications for all to authenticated
  using ((select auth.uid()) = student_id) with check ((select auth.uid()) = student_id);

drop policy if exists projects_editor on public.projects;
drop policy if exists projects_student on public.projects;
drop policy if exists projects_writer on public.projects;
create policy projects_editor on public.projects for select to authenticated using ((select auth.uid()) = editor_id);
create policy projects_student on public.projects for select to authenticated using ((select auth.uid()) = student_id);
create policy projects_writer on public.projects for select to authenticated using ((select auth.uid()) = writer_id);

drop policy if exists public_profiles_read on public.public_profiles;
create policy public_profiles_read on public.public_profiles for select to anon, authenticated using (true);

drop policy if exists qa_participant_read on public.qa_reviews;
create policy qa_participant_read on public.qa_reviews for select to authenticated using (
  (select auth.uid()) = editor_id or exists(select 1 from public.projects p where p.id = qa_reviews.project_id
    and (p.student_id = (select auth.uid()) or p.writer_id = (select auth.uid())))
);

drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews for select to anon, authenticated using (true);

drop policy if exists reviews_student_create on public.reviews;
create policy reviews_student_create on public.reviews for insert to authenticated with check ((select auth.uid()) = reviewer_id);

drop policy if exists student_profile_self on public.student_profiles;
create policy student_profile_self on public.student_profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists wallet_tx_self on public.wallet_transactions;
create policy wallet_tx_self on public.wallet_transactions for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists wallet_self on public.wallets;
create policy wallet_self on public.wallets for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists withdrawals_create_self on public.withdrawals;
create policy withdrawals_create_self on public.withdrawals for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists withdrawals_self on public.withdrawals;
create policy withdrawals_self on public.withdrawals for select to authenticated using ((select auth.uid()) = user_id);

-- Onboarding is a one-time role selection. Existing users cannot self-promote
-- from student/writer/editor to another role through the public RPC.
create or replace function public.complete_onboarding(
  p_role text,p_full_name text,p_avatar_url text,p_phone text,p_institution text,
  p_faculty text,p_department text,p_degree text,p_matric_number text,
  p_graduation_year text,p_bio text,p_specialties text[],p_portfolio_url text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid := auth.uid(); normalized_role public.user_role; existing public.profiles;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_role not in ('student','writer','editor') then raise exception 'INVALID_ROLE'; end if;
  select * into existing from public.profiles where id = uid for update;
  if existing.onboarding_complete then raise exception 'ONBOARDING_ALREADY_COMPLETE'; end if;
  normalized_role := p_role::public.user_role;

  update public.profiles set full_name=nullif(trim(p_full_name),''),avatar_url=nullif(trim(p_avatar_url),''),
    role=normalized_role,
    account_status=case when normalized_role='student' then 'approved'::public.application_status else 'pending'::public.application_status end,
    onboarding_complete=true,updated_at=now() where id=uid;
  if not found then
    insert into public.profiles(id,full_name,avatar_url,role,account_status,onboarding_complete)
    values(uid,nullif(trim(p_full_name),''),nullif(trim(p_avatar_url),''),normalized_role,
      case when normalized_role='student' then 'approved' else 'pending' end,true);
  end if;

  insert into public.wallets(user_id) values(uid) on conflict(user_id) do nothing;

  if normalized_role='student' then
    insert into public.student_profiles(user_id,phone,institution,faculty,department,degree,matric_number,graduation_year)
    values(uid,trim(p_phone),trim(p_institution),trim(p_faculty),trim(p_department),trim(p_degree),trim(p_matric_number),trim(p_graduation_year))
    on conflict(user_id) do update set phone=excluded.phone,institution=excluded.institution,faculty=excluded.faculty,
      department=excluded.department,degree=excluded.degree,matric_number=excluded.matric_number,
      graduation_year=excluded.graduation_year,updated_at=now();
  elsif normalized_role='writer' then
    insert into public.writer_applications(user_id,status,bio,specialties,academic_qualifications,portfolio_url)
    values(uid,'pending',nullif(trim(p_bio),''),coalesce(p_specialties,'{}'),nullif(trim(p_degree),''),nullif(trim(p_portfolio_url),''))
    on conflict do nothing;
  else
    insert into public.editor_applications(user_id,status,bio,specialties,qualifications)
    values(uid,'pending',nullif(trim(p_bio),''),coalesce(p_specialties,'{}'),nullif(trim(p_degree),''))
    on conflict do nothing;
  end if;
  return jsonb_build_object('user_id',uid,'role',normalized_role,
    'status',case when normalized_role='student' then 'approved' else 'pending' end,'onboarding_complete',true);
end; $$;
revoke execute on function public.complete_onboarding(text,text,text,text,text,text,text,text,text,text,text,text[],text) from public, anon;
grant execute on function public.complete_onboarding(text,text,text,text,text,text,text,text,text,text,text,text[],text) to authenticated;

-- Writer assignment is an administrative operation, not a student-callable RPC.
create or replace function public.assign_writer(p_project_id uuid,p_writer_id uuid,p_deadline_at timestamptz)
returns public.project_assignments language plpgsql security definer set search_path=public as $$
declare p public.projects; a public.project_assignments; actor public.profiles;
begin
  select * into actor from public.profiles where id=auth.uid();
  if actor.role<>'admin' or actor.account_status<>'approved' then raise exception 'ADMIN_REQUIRED'; end if;
  select * into p from public.projects where id=p_project_id and status='paid' for update;
  if not found then raise exception 'PROJECT_NOT_ASSIGNABLE'; end if;
  if not exists(select 1 from public.profiles where id=p_writer_id and role='writer' and account_status='approved')
    then raise exception 'WRITER_NOT_APPROVED'; end if;
  if p_deadline_at<=now() or p_deadline_at>now()+interval '14 days' then raise exception 'INVALID_DEADLINE'; end if;
  update public.projects set writer_id=p_writer_id,status='assigned',deadline_at=p_deadline_at,updated_at=now() where id=p.id;
  insert into public.project_assignments(project_id,writer_id,deadline_at) values(p.id,p_writer_id,p_deadline_at) returning * into a;
  insert into public.notifications(user_id,type,title,body,metadata)
    values(p_writer_id,'PROJECT_ASSIGNED','New Finalyzed project assigned',
      'A project is ready for your acceptance.',jsonb_build_object('project_id',p.id));
  return a;
end; $$;
revoke execute on function public.assign_writer(uuid,uuid,timestamptz) from public,anon,authenticated;

-- Only trusted server-side code may mutate arbitrary users' points.
revoke execute on function public.award_points(uuid,bigint,text,uuid,text) from public,anon,authenticated;
revoke execute on function public.credit_points(uuid,bigint,text,uuid) from public,anon,authenticated;
revoke execute on function public.spend_points(uuid,bigint,text,uuid,text) from public,anon,authenticated;

-- Verified Paystack project payment is atomic and idempotent at the database boundary.
create or replace function public.record_verified_project_payment(
  p_project_id uuid,p_student_id uuid,p_reference text,p_amount_ngn integer,p_metadata jsonb default '{}'::jsonb
) returns public.payments language plpgsql security definer set search_path=public as $$
declare p public.projects; pay public.payments;
begin
  if p_amount_ngn<=0 or p_reference is null then raise exception 'INVALID_PAYMENT'; end if;
  select * into p from public.projects where id=p_project_id and student_id=p_student_id for update;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
  if p.status not in ('draft','payment_pending') then raise exception 'PROJECT_NOT_AWAITING_PAYMENT'; end if;
  if p_amount_ngn<>p.price_ngn then raise exception 'PAYMENT_AMOUNT_MISMATCH'; end if;
  if exists(select 1 from public.payments where reference=p_reference) then raise exception 'PAYMENT_REFERENCE_ALREADY_USED'; end if;
  insert into public.payments(project_id,student_id,provider,reference,amount_ngn,status,paid_at,metadata)
  values(p.id,p_student_id,'paystack',p_reference,p_amount_ngn,'completed',now(),coalesce(p_metadata,'{}')) returning * into pay;
  update public.projects set status='paid',updated_at=now() where id=p.id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
    values(p_student_id,'PROJECT_PAYMENT_VERIFIED','project',p.id,
      jsonb_build_object('payment_id',pay.id,'reference',p_reference,'amount_ngn',p_amount_ngn));
  return pay;
end; $$;
revoke execute on function public.record_verified_project_payment(uuid,uuid,text,integer,jsonb) from public,anon,authenticated;

-- 1 point = ₦10. This RPC is server-only because it represents verified cash settlement.
create or replace function public.credit_purchased_points(p_user_id uuid,p_points bigint,p_amount_ngn bigint,p_reference text)
returns public.wallets language plpgsql security definer set search_path=public as $$
declare w public.wallets;
begin
  if p_points<=0 or p_amount_ngn<=0 or p_points*10<>p_amount_ngn then raise exception 'INVALID_POINT_PURCHASE'; end if;
  if p_reference is null or length(trim(p_reference))<6 then raise exception 'INVALID_REFERENCE'; end if;
  if exists(select 1 from public.point_transactions where reference=p_reference) then
    select * into w from public.wallets where user_id=p_user_id; return w;
  end if;
  insert into public.wallets(user_id,points_balance) values(p_user_id,p_points)
    on conflict(user_id) do update set points_balance=wallets.points_balance+p_points,updated_at=now() returning * into w;
  insert into public.point_transactions(user_id,direction,points,reason,reference)
    values(p_user_id,'credit',p_points,'Purchased Finalyzed Points',p_reference);
  insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,points,reference,metadata)
    values(p_user_id,'points_purchase',p_amount_ngn,p_points,p_reference,jsonb_build_object('rate','1 point = 10 NGN'));
  return w;
end; $$;
revoke execute on function public.credit_purchased_points(uuid,bigint,bigint,text) from public,anon,authenticated;

-- Editors alone can convert points into cash at ₦10/point.
create or replace function public.convert_editor_points_to_cash(p_points bigint) returns public.wallets
language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); prof public.profiles; w public.wallets; amount bigint; ref text:=gen_random_uuid()::text;
begin
  if uid is null or p_points<=0 then raise exception 'INVALID_CONVERSION'; end if;
  select * into prof from public.profiles where id=uid;
  if prof.role<>'editor' or prof.account_status<>'approved' then raise exception 'EDITOR_REQUIRED'; end if;
  amount:=p_points*10;
  select * into w from public.wallets where user_id=uid for update;
  if not found or w.points_balance<p_points then raise exception 'INSUFFICIENT_POINTS'; end if;
  update public.wallets set points_balance=points_balance-p_points,balance_ngn=balance_ngn+amount,updated_at=now()
    where user_id=uid returning * into w;
  insert into public.point_transactions(user_id,direction,points,reason,reference)
    values(uid,'debit',p_points,'Converted points to wallet cash',ref);
  insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,points,reference,metadata)
    values(uid,'points_to_cash',amount,p_points,ref,jsonb_build_object('rate','1 point = 10 NGN'));
  return w;
end; $$;
grant execute on function public.convert_editor_points_to_cash(bigint) to authenticated;

-- Writer/editor wallet withdrawals require an approved account and at least ₦5,000.
-- The transaction fee is deliberately supplied by the platform configuration/UI rather
-- than hard-coded here so the business can change it without changing the schema.
create or replace function public.request_wallet_withdrawal(
  p_amount_ngn bigint,p_transaction_fee_ngn bigint,p_bank_name text,p_account_name text,p_account_number_last4 text
) returns public.withdrawals language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); prof public.profiles; w public.wallets; total bigint; out public.withdrawals; ref text;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into prof from public.profiles where id=uid;
  if prof.role not in ('writer','editor') or prof.account_status<>'approved' then raise exception 'WITHDRAWAL_NOT_AVAILABLE'; end if;
  if p_amount_ngn<5000 or p_transaction_fee_ngn<0 or p_bank_name is null or p_account_name is null then raise exception 'INVALID_WITHDRAWAL'; end if;
  total:=p_amount_ngn+p_transaction_fee_ngn;
  select * into w from public.wallets where user_id=uid for update;
  if not found or w.balance_ngn<total then raise exception 'INSUFFICIENT_WALLET_BALANCE'; end if;
  update public.wallets set balance_ngn=balance_ngn-total,updated_at=now() where user_id=uid;
  ref:=gen_random_uuid()::text;
  insert into public.withdrawals(user_id,amount_ngn,transaction_fee_ngn,status,bank_name,account_name,account_number_last4)
    values(uid,p_amount_ngn,p_transaction_fee_ngn,'pending',trim(p_bank_name),trim(p_account_name),
      right(regexp_replace(coalesce(p_account_number_last4,''),'[^0-9]','','g'),4)) returning * into out;
  insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,reference,metadata)
    values(uid,'withdrawal_hold',total,ref,jsonb_build_object('fee_ngn',p_transaction_fee_ngn,'withdrawal_id',out.id));
  return out;
end; $$;
grant execute on function public.request_wallet_withdrawal(bigint,bigint,text,text,text) to authenticated;


-- Workspace chat is now a first-class Supabase resource.
create table if not exists public.project_messages(
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text,
  sender_role text,
  text text not null check (length(trim(text)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists project_messages_project_created_idx on public.project_messages(project_id,created_at);
alter table public.project_messages enable row level security;
drop policy if exists project_messages_read on public.project_messages;
drop policy if exists project_messages_insert on public.project_messages;
create policy project_messages_read on public.project_messages for select to authenticated using (
  exists(select 1 from public.projects p where p.id=project_messages.project_id and
    (p.student_id=(select auth.uid()) or p.writer_id=(select auth.uid()) or p.editor_id=(select auth.uid())))
);
create policy project_messages_insert on public.project_messages for insert to authenticated with check (
  (select auth.uid())=sender_id and exists(select 1 from public.projects p where p.id=project_messages.project_id and
    (p.student_id=(select auth.uid()) or p.writer_id=(select auth.uid()) or p.editor_id=(select auth.uid())))
);
do $$ begin
  alter publication supabase_realtime add table public.project_messages;
exception when duplicate_object then null; when undefined_object then null;
end $$;


-- Remove legacy duplicate permissive policies and add covering indexes for FK-heavy paths.
drop policy if exists editor_application_self_read on public.editor_applications;
drop policy if exists editor_application_self_insert on public.editor_applications;
drop policy if exists writer_application_self_read on public.writer_applications;
drop policy if exists writer_application_self_insert on public.writer_applications;
drop policy if exists points_tx_self on public.point_transactions;
drop policy if exists projects_editor on public.projects;
drop policy if exists projects_student on public.projects;
drop policy if exists projects_writer on public.projects;
create policy projects_participant on public.projects for select to authenticated using (
  (select auth.uid())=student_id or (select auth.uid())=writer_id or (select auth.uid())=editor_id
);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_editor_applications_user on public.editor_applications(user_id);
create index if not exists idx_editor_applications_reviewed_by on public.editor_applications(reviewed_by);
create index if not exists idx_payments_project on public.payments(project_id);
create index if not exists idx_payments_student on public.payments(student_id);
create index if not exists idx_point_transactions_project on public.point_transactions(project_id);
create index if not exists idx_project_assignments_project on public.project_assignments(project_id);
create index if not exists idx_project_escrow_writer on public.project_escrow(writer_id);
create index if not exists idx_project_files_project on public.project_files(project_id);
create index if not exists idx_project_files_uploaded_by on public.project_files(uploaded_by);
create index if not exists idx_project_revisions_project on public.project_revisions(project_id);
create index if not exists idx_project_revisions_requested_by on public.project_revisions(requested_by);
create index if not exists idx_project_revisions_accepted_by on public.project_revisions(accepted_by);
create index if not exists idx_project_specification_versions_created_by on public.project_specification_versions(created_by);
create index if not exists idx_project_specifications_institution on public.project_specifications(institution_id);
create index if not exists idx_project_specifications_department on public.project_specifications(department_id);
create index if not exists idx_projects_specification on public.projects(specification_id);
create index if not exists idx_qa_reviews_editor on public.qa_reviews(editor_id);
create index if not exists idx_qa_reviews_submission_file on public.qa_reviews(submission_file_id);
create index if not exists idx_reviews_reviewer on public.reviews(reviewer_id);
create index if not exists idx_reviews_writer on public.reviews(writer_id);
create index if not exists idx_wallet_transactions_project on public.wallet_transactions(project_id);
create index if not exists idx_withdrawals_user on public.withdrawals(user_id);
create index if not exists idx_project_messages_sender on public.project_messages(sender_id);
create index if not exists idx_writer_applications_user on public.writer_applications(user_id);


-- Explicit function execution boundary: no RPC below is executable anonymously.
revoke execute on function public.convert_editor_points_to_cash(bigint) from public;
grant execute on function public.convert_editor_points_to_cash(bigint) to authenticated;
revoke execute on function public.request_wallet_withdrawal(bigint,bigint,text,text,text) from public;
grant execute on function public.request_wallet_withdrawal(bigint,bigint,text,text,text) to authenticated;
revoke execute on function public.complete_onboarding(text,text,text,text,text,text,text,text,text,text,text,text[],text) from public;
grant execute on function public.complete_onboarding(text,text,text,text,text,text,text,text,text,text,text,text[],text) to authenticated;
revoke execute on function public.create_project_from_spec(uuid,plan_type,integer,uuid) from public;
grant execute on function public.create_project_from_spec(uuid,plan_type,integer,uuid) to authenticated;
revoke execute on function public.create_project_from_specification(uuid,plan_type,integer,uuid) from public;
grant execute on function public.create_project_from_specification(uuid,plan_type,integer,uuid) to authenticated;
revoke execute on function public.debit_points(bigint,text,uuid) from public;
grant execute on function public.debit_points(bigint,text,uuid) to authenticated;
revoke execute on function public.earn_editor_review_points(uuid,integer) from public;
grant execute on function public.earn_editor_review_points(uuid,integer) to authenticated;
revoke execute on function public.editor_decide_qa(uuid,qa_decision,text) from public;
grant execute on function public.editor_decide_qa(uuid,qa_decision,text) to authenticated;
revoke execute on function public.mark_project_delivered(uuid) from public;
grant execute on function public.mark_project_delivered(uuid) to authenticated;
revoke execute on function public.request_project_revision(uuid,text) from public;
grant execute on function public.request_project_revision(uuid,text) to authenticated;
revoke execute on function public.request_project_revision(uuid,text,integer) from public;
grant execute on function public.request_project_revision(uuid,text,integer) to authenticated;
revoke execute on function public.submit_project_for_editor(uuid,text,text) from public;
grant execute on function public.submit_project_for_editor(uuid,text,text) to authenticated;
revoke execute on function public.submit_project_review(uuid,integer,text) from public;
grant execute on function public.submit_project_review(uuid,integer,text) to authenticated;
revoke execute on function public.writer_accept_project(uuid) from public;
grant execute on function public.writer_accept_project(uuid) to authenticated;
revoke execute on function public.approve_project_delivery(uuid) from public;
grant execute on function public.approve_project_delivery(uuid) to authenticated;
