-- Finalyzed Points economy completion: writer cash->points and configurable editor QA rates.
create table if not exists public.editor_rates(
  editor_id uuid primary key references auth.users(id) on delete cascade,
  basic_points integer not null default 100 check (basic_points between 100 and 500),
  standard_points integer not null default 100 check (standard_points between 100 and 1000),
  premium_points integer not null default 100 check (premium_points between 100 and 5000),
  updated_at timestamptz not null default now()
);
alter table public.editor_rates enable row level security;
drop policy if exists editor_rates_self_read on public.editor_rates;
drop policy if exists editor_rates_public_read on public.editor_rates;
create policy editor_rates_self_read on public.editor_rates for select to authenticated using (editor_id=(select auth.uid()));
create policy editor_rates_public_read on public.editor_rates for select to authenticated using (
  exists(select 1 from public.profiles p where p.id=editor_rates.editor_id and p.role='editor' and p.account_status='approved')
);

create or replace function public.set_editor_review_rates(p_basic integer,p_standard integer,p_premium integer)
returns public.editor_rates language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); r public.editor_rates;
begin
 if uid is null then raise exception 'UNAUTHENTICATED'; end if;
 if not exists(select 1 from public.profiles where id=uid and role='editor' and account_status='approved') then raise exception 'EDITOR_REQUIRED'; end if;
 if p_basic<100 or p_basic>500 or p_standard<100 or p_standard>1000 or p_premium<100 or p_premium>5000 then raise exception 'RATE_EXCEEDS_PLAN_CAP'; end if;
 insert into public.editor_rates(editor_id,basic_points,standard_points,premium_points,updated_at)
 values(uid,p_basic,p_standard,p_premium,now())
 on conflict(editor_id) do update set basic_points=excluded.basic_points,standard_points=excluded.standard_points,premium_points=excluded.premium_points,updated_at=now()
 returning * into r;
 return r;
end; $$;

create or replace function public.convert_writer_cash_to_points(p_amount_ngn bigint)
returns public.wallets language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); prof public.profiles; w public.wallets; pts bigint;
begin
 if uid is null or p_amount_ngn<=0 or p_amount_ngn%10<>0 then raise exception 'INVALID_POINT_CONVERSION'; end if;
 select * into prof from public.profiles where id=uid;
 if prof.role<>'writer' or prof.account_status<>'approved' then raise exception 'WRITER_REQUIRED'; end if;
 pts:=p_amount_ngn/10;
 select * into w from public.wallets where user_id=uid for update;
 if not found or w.balance_ngn<p_amount_ngn then raise exception 'INSUFFICIENT_WALLET_BALANCE'; end if;
 update public.wallets set balance_ngn=balance_ngn-p_amount_ngn,points_balance=points_balance+pts,updated_at=now() where user_id=uid returning * into w;
 insert into public.point_transactions(user_id,direction,points,reason,reference) values(uid,'credit',pts,'Converted wallet cash to Finalyzed Points',gen_random_uuid()::text);
 insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,points,reference,metadata) values(uid,'cash_to_points',p_amount_ngn,pts,gen_random_uuid()::text,jsonb_build_object('rate','1 point = 10 NGN'));
 return w;
end; $$;

create or replace function public.editor_decide_qa(p_project_id uuid,p_decision qa_decision,p_feedback text default null)
returns public.qa_reviews language plpgsql security definer set search_path=public as $$
declare p public.projects; f public.project_files; q public.qa_reviews; rate integer; writer_wallet public.wallets; editor_wallet public.wallets;
begin
 select * into p from public.projects where id=p_project_id and status='submitted_for_review' and editor_id=auth.uid() for update;
 if not found then raise exception 'PROJECT_NOT_IN_QA'; end if;
 select * into f from public.project_files where project_id=p.id order by version desc limit 1;
 if f.id is null then raise exception 'SUBMISSION_FILE_REQUIRED'; end if;
 if p_decision='correction_required' and length(trim(coalesce(p_feedback,'')))<5 then raise exception 'QA_FEEDBACK_REQUIRED'; end if;
 insert into public.qa_reviews(project_id,editor_id,submission_file_id,decision,feedback,decided_at) values(p.id,auth.uid(),f.id,p_decision,trim(p_feedback),now()) returning * into q;
 select case p.plan when 'basic' then coalesce(er.basic_points,100) when 'standard' then coalesce(er.standard_points,100) when 'premium' then coalesce(er.premium_points,100) end into rate from public.editor_rates er where er.editor_id=auth.uid();
 select * into writer_wallet from public.wallets where user_id=p.writer_id for update;
 if writer_wallet.points_balance < rate then raise exception 'WRITER_INSUFFICIENT_POINTS_FOR_EDITOR_QA'; end if;
 update public.wallets set points_balance=points_balance-rate,updated_at=now() where user_id=p.writer_id;
 insert into public.point_transactions(user_id,direction,points,reason,project_id,reference) values(p.writer_id,'debit',rate,'Editor QA service',p.id,q.id::text);
 insert into public.wallets(user_id,points_balance) values(auth.uid(),rate) on conflict(user_id) do update set points_balance=wallets.points_balance+rate,updated_at=now() returning * into editor_wallet;
 insert into public.point_transactions(user_id,direction,points,reason,project_id,reference) values(auth.uid(),'credit',rate,'Editor QA service earned',p.id,q.id::text);
 update public.projects set status=case when p_decision='approved' then 'editor_approved' else 'editor_correction_required' end,updated_at=now() where id=p.id;
 insert into public.notifications(user_id,type,title,body,metadata) values(p.writer_id,'QA_DECISION',case when p_decision='approved' then 'Project approved by editor' else 'Editor requested corrections' end,coalesce(trim(p_feedback),'Your submission passed QA.'),jsonb_build_object('project_id',p.id,'editor_points',rate));
 return q;
end; $$;

revoke execute on function public.set_editor_review_rates(integer,integer,integer) from public;
grant execute on function public.set_editor_review_rates(integer,integer,integer) to authenticated;
revoke execute on function public.convert_writer_cash_to_points(bigint) from public;
grant execute on function public.convert_writer_cash_to_points(bigint) to authenticated;
revoke execute on function public.editor_decide_qa(uuid,qa_decision,text) from public;
grant execute on function public.editor_decide_qa(uuid,qa_decision,text) to authenticated;
