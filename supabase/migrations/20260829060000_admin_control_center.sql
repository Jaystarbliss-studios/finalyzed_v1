-- Finalyzed admin control center, moderation, analytics and bank-account administration.
alter table public.profiles
  add column if not exists access_state text not null default 'active';

alter table public.profiles drop constraint if exists profiles_access_state_check;
alter table public.profiles add constraint profiles_access_state_check check(access_state in ('active','suspended','banned'));

create index if not exists idx_profiles_role_access on public.profiles(role,access_state);

create or replace function public.admin_set_access_state(p_user_id uuid,p_state text)
returns public.profiles language plpgsql security definer set search_path=public as $$
declare actor public.profiles; target public.profiles;
begin
 select * into actor from public.profiles where id=auth.uid();
 if actor.role<>'admin' or actor.account_status<>'approved' then raise exception 'ADMIN_REQUIRED'; end if;
 if p_state not in ('active','suspended','banned') then raise exception 'INVALID_ACCESS_STATE'; end if;
 if p_user_id=auth.uid() then raise exception 'CANNOT_MODERATE_SELF'; end if;
 update public.profiles set access_state=p_state,account_status=case when p_state='active' then 'approved'::application_status when p_state in ('suspended','banned') then 'suspended'::application_status else account_status end,updated_at=now() where id=p_user_id returning * into target;
 if target.id is null then raise exception 'USER_NOT_FOUND'; end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'ACCOUNT_ACCESS_STATE_CHANGED','profile',target.id,jsonb_build_object('state',p_state,'role',target.role));
 return target;
end; $$;
grant execute on function public.admin_set_access_state(uuid,text) to authenticated;

create or replace function public.admin_people(p_role text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor public.profiles; out jsonb;
begin
 select * into actor from public.profiles where id=auth.uid();
 if actor.role<>'admin' or actor.account_status<>'approved' then raise exception 'ADMIN_REQUIRED'; end if;
 select coalesce(jsonb_agg(row_to_json(x) order by lower(coalesce(x.full_name,x.username,''))), '[]'::jsonb) into out
 from (
   select p.id,p.full_name,p.username,p.avatar_url,p.role,p.account_status,p.access_state,p.created_at,p.last_seen_at,
     coalesce(pp.completed_projects,0) completed_projects,coalesce(pp.rating,0) rating,coalesce(pp.review_count,0) review_count,
     coalesce(pp.ranking_score,0) ranking_score,coalesce(pp.average_delivery_days,0) average_delivery_days,
     coalesce((select count(*) from projects pr where (p.role='writer' and pr.writer_id=p.id or p.role='editor' and pr.editor_id=p.id) and pr.status not in ('completed','cancelled')),0) active_projects,
     coalesce((select count(*) from projects pr where (p.role='writer' and pr.writer_id=p.id or p.role='editor' and pr.editor_id=p.id) and pr.status='completed'),0) completed_count,
     coalesce((select jsonb_agg(jsonb_build_object('id',pr.id,'title',pr.title,'status',pr.status,'price_ngn',pr.price_ngn,'created_at',pr.created_at) order by pr.created_at desc) from projects pr where (p.role='writer' and pr.writer_id=p.id or p.role='editor' and pr.editor_id=p.id) and pr.status not in ('completed','cancelled') limit 5),'[]'::jsonb) current_projects,
     coalesce((select jsonb_build_object('bank_name',b.bank_name,'account_name',b.account_name,'account_number_last4',right(b.account_number,4),'verified',b.verified,'is_default',b.is_default) from bank_accounts b where b.user_id=p.id order by b.is_default desc,b.updated_at desc limit 1),'null'::jsonb) bank_account
   from profiles p left join public_profiles pp on pp.id=p.id
   where p.role=p_role::user_role
 ) x;
 return out;
end; $$;
grant execute on function public.admin_people(text) to authenticated;

create or replace function public.admin_applications()
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor public.profiles; out jsonb;
begin
 select * into actor from public.profiles where id=auth.uid();
 if actor.role<>'admin' or actor.account_status<>'approved' then raise exception 'ADMIN_REQUIRED'; end if;
 select coalesce(jsonb_agg(row_to_json(x) order by x.created_at desc),'[]'::jsonb) into out
 from (
   select a.id,a.user_id,'writer' role,a.status,a.bio,a.specialties,a.academic_qualifications qualifications,a.portfolio_url,a.availability_days,a.availability_hours,a.school_levels,a.created_at,
     p.full_name,p.username,p.avatar_url,p.account_status,p.access_state
   from writer_applications a join profiles p on p.id=a.user_id where a.status='pending'
   union all
   select a.id,a.user_id,'editor' role,a.status,a.bio,a.specialties,a.qualifications,a.qualifications portfolio_url,null availability_days,null availability_hours,null school_levels,a.created_at,
     p.full_name,p.username,p.avatar_url,p.account_status,p.access_state
   from editor_applications a join profiles p on p.id=a.user_id where a.status='pending'
 ) x;
 return out;
end; $$;
grant execute on function public.admin_applications() to authenticated;

create or replace function public.finalyzed_admin_analytics()
returns jsonb language sql security definer set search_path=public as $$
with cash as (
 select coalesce(sum(amount_ngn),0)::bigint revenue from public.payments where public.payments.status='completed'
), points as (
 select coalesce(sum(amount_ngn),0)::bigint revenue from wallet_transactions where transaction_type='points_purchase'
), fees as (
 select coalesce(sum(amount_ngn),0)::bigint revenue from platform_fees
), withdrawals as (
 select coalesce(sum(amount_ngn),0)::bigint paid from public.withdrawals where public.withdrawals.status in ('completed','processing')
), months as (
 select to_char(date_trunc('month',pay.created_at),'Mon') name, date_trunc('month',pay.created_at) bucket,
   coalesce(sum(case when pay.status='completed' then pay.amount_ngn else 0 end),0)::bigint revenue,
   count(*)::int transactions
 from public.payments pay group by 1,2 order by 2 desc limit 12
)
select jsonb_build_object(
 'cash_revenue_ngn',(select revenue from cash),
 'points_revenue_ngn',(select revenue from points),
 'platform_fees_ngn',(select revenue from fees),
 'withdrawals_ngn',(select paid from withdrawals),
 'total_revenue_ngn',(select revenue from cash)+(select revenue from points),
 'platform_margin_ngn',(select revenue from cash)+(select revenue from points)-(select paid from withdrawals),
 'monthly_revenue',(select coalesce(jsonb_agg(to_jsonb(m) order by m.bucket),'[]'::jsonb) from months m),
 'population',jsonb_build_object(
   'students',(select count(*) from profiles where role='student'),
   'writers',(select count(*) from profiles where role='writer'),
   'editors',(select count(*) from profiles where role='editor'),
   'admins',(select count(*) from profiles where role='admin')
 ),
 'withdrawal_requests',(select count(*) from public.withdrawals where public.withdrawals.status='pending'),
 'open_disputes',(select count(*) from public.project_disputes where public.project_disputes.status='open')
); $$;
grant execute on function public.finalyzed_admin_analytics() to authenticated;

drop policy if exists bank_accounts_admin_read on public.bank_accounts;
create policy bank_accounts_admin_read on public.bank_accounts for select to authenticated
using ((select auth.uid())=user_id or exists(select 1 from profiles p where p.id=auth.uid() and p.role='admin' and p.account_status='approved'));

create or replace function public.admin_withdrawals()
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor public.profiles; out jsonb;
begin
 select * into actor from public.profiles where id=auth.uid();
 if actor.role<>'admin' or actor.account_status<>'approved' then raise exception 'ADMIN_REQUIRED'; end if;
 select coalesce(jsonb_agg(row_to_json(x) order by x.created_at desc),'[]'::jsonb) into out from (
   select w.*,p.full_name,p.username,p.role,p.access_state
   from public.withdrawals w join public.profiles p on p.id=w.user_id
 ) x;
 return out;
end; $$;
grant execute on function public.admin_withdrawals() to authenticated;

create or replace function public.admin_disputes()
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor public.profiles; out jsonb;
begin
 select * into actor from public.profiles where id=auth.uid();
 if actor.role<>'admin' or actor.account_status<>'approved' then raise exception 'ADMIN_REQUIRED'; end if;
 select coalesce(jsonb_agg(row_to_json(x) order by x.created_at desc),'[]'::jsonb) into out from (
   select d.*,p.title,p.price_ngn,p.student_id,p.writer_id,p.editor_id,
     sp.full_name student_name,wp.full_name writer_name,ep.full_name editor_name
   from public.project_disputes d join public.projects p on p.id=d.project_id
   left join public.profiles sp on sp.id=p.student_id
   left join public.profiles wp on wp.id=p.writer_id
   left join public.profiles ep on ep.id=p.editor_id
   where d.status='open'
 ) x;
 return out;
end; $$;
grant execute on function public.admin_disputes() to authenticated;

create or replace function public.update_bank_account(p_id uuid,p_bank_code text,p_bank_name text,p_account_name text,p_account_number text)
returns public.bank_accounts language plpgsql security definer set search_path=public as $$
declare r public.bank_accounts;
begin
 if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
 if p_account_number !~ '^[0-9]{10}$' or length(trim(p_bank_name))<2 or length(trim(p_account_name))<2 then raise exception 'INVALID_BANK_ACCOUNT'; end if;
 update public.bank_accounts set bank_code=trim(p_bank_code),bank_name=trim(p_bank_name),account_name=trim(p_account_name),account_number=trim(p_account_number),paystack_recipient_code=null,verified=false,updated_at=now()
 where id=p_id and user_id=auth.uid() returning * into r;
 if r.id is null then raise exception 'BANK_ACCOUNT_NOT_FOUND'; end if;
 return r;
end; $$;
grant execute on function public.update_bank_account(uuid,text,text,text,text) to authenticated;


create or replace function public.finalyzed_admin_stats()
returns jsonb language sql security definer set search_path=public as $$
select jsonb_build_object(
 'students',(select count(*) from profiles where role='student'),
 'writers',(select count(*) from profiles where role='writer'),
 'managers',(select count(*) from profiles where role='editor'),
 'admins',(select count(*) from profiles where role='admin'),
 'approved_writers',(select count(*) from profiles where role='writer' and account_status='approved'),
 'approved_managers',(select count(*) from profiles where role='editor' and account_status='approved'),
 'pending_projects',(select count(*) from projects where status in ('paid','payment_pending','assigned','in_progress','submitted_for_review','editor_correction_required','revision_requested','revision_in_progress')),
 'completed_projects',(select count(*) from projects where status='completed'),
 'pending_revisions',(select count(*) from project_revisions where status in ('pending','accepted','in_progress')),
 'cash_revenue_ngn',(select coalesce(sum(amount_ngn),0) from payments where status='completed'),
 'points_revenue_ngn',(select coalesce(sum(amount_ngn),0) from wallet_transactions where transaction_type='points_purchase'),
 'total_revenue_ngn',(select coalesce(sum(amount_ngn),0) from payments where status='completed')+(select coalesce(sum(amount_ngn),0) from wallet_transactions where transaction_type='points_purchase')
); $$;