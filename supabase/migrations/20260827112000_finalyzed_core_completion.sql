-- Finalyzed production workflow completion.
-- This migration is the source-controlled counterpart of the production changes applied
-- during the Finalyzed backend completion pass.

alter table public.public_profiles add column if not exists ranking_score numeric not null default 0;

create or replace function public.record_verified_project_payment(p_project_id uuid,p_student_id uuid,p_reference text,p_amount_ngn integer,p_metadata jsonb default '{}'::jsonb)
returns public.payments language plpgsql security definer set search_path=''
as $$
declare p public.projects; pay public.payments;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'SERVER_PAYMENT_VERIFICATION_REQUIRED'; end if;
 if p_amount_ngn<=0 or nullif(trim(p_reference),'') is null then raise exception 'INVALID_PAYMENT'; end if;
 select * into p from public.projects where id=p_project_id and student_id=p_student_id for update;
 if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
 if p.status not in ('draft','payment_pending') then raise exception 'PROJECT_NOT_AWAITING_PAYMENT'; end if;
 if p_amount_ngn<>p.price_ngn then raise exception 'PAYMENT_AMOUNT_MISMATCH'; end if;
 if exists(select 1 from public.payments where reference=p_reference) then raise exception 'PAYMENT_REFERENCE_ALREADY_USED'; end if;
 insert into public.payments(project_id,student_id,provider,reference,amount_ngn,status,paid_at,metadata)
 values(p.id,p_student_id,'paystack',trim(p_reference),p_amount_ngn,'completed',now(),coalesce(p_metadata,'{}'::jsonb)) returning * into pay;
 insert into public.project_escrow(project_id,amount_ngn,status,held_at,writer_id)
 values(p.id,p_amount_ngn,'held',now(),p.writer_id)
 on conflict(project_id) do update set amount_ngn=excluded.amount_ngn,status='held',held_at=now(),released_at=null,writer_id=excluded.writer_id;
 update public.projects set status='paid',updated_at=now() where id=p.id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
 values(p_student_id,'PROJECT_PAYMENT_VERIFIED','project',p.id,jsonb_build_object('payment_id',pay.id,'reference',p_reference,'amount_ngn',p_amount_ngn));
 return pay;
end;
$$;

create or replace function public.record_webhook_project_payment(p_project_id uuid,p_student_id uuid,p_reference text,p_amount_ngn integer,p_metadata jsonb default '{}'::jsonb)
returns public.payments language plpgsql security definer set search_path=''
as $$
declare p public.projects; pay public.payments;
begin
 if p_amount_ngn<=0 or nullif(trim(p_reference),'') is null then raise exception 'INVALID_PAYMENT'; end if;
 select * into p from public.projects where id=p_project_id and student_id=p_student_id for update;
 if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
 if p_amount_ngn<>p.price_ngn then raise exception 'PAYMENT_AMOUNT_MISMATCH'; end if;
 if exists(select 1 from public.payments where reference=p_reference) then select * into pay from public.payments where reference=p_reference limit 1; return pay; end if;
 if p.status not in ('draft','payment_pending','paid') then raise exception 'PROJECT_NOT_AWAITING_PAYMENT'; end if;
 insert into public.payments(project_id,student_id,provider,reference,amount_ngn,status,paid_at,metadata)
 values(p.id,p_student_id,'paystack',trim(p_reference),p_amount_ngn,'completed',now(),coalesce(p_metadata,'{}'::jsonb)) returning * into pay;
 insert into public.project_escrow(project_id,amount_ngn,status,held_at,writer_id)
 values(p.id,p_amount_ngn,'held',now(),p.writer_id)
 on conflict(project_id) do update set amount_ngn=excluded.amount_ngn,status='held',held_at=now(),released_at=null,writer_id=excluded.writer_id;
 update public.projects set status='paid',updated_at=now() where id=p.id and status in ('draft','payment_pending');
 return pay;
end;
$$;

create or replace function public.create_project_from_spec(p_specification_id uuid,p_plan public.plan_type,p_price_ngn integer,p_writer_id uuid default null)
returns public.projects language plpgsql security definer set search_path=''
as $$
declare s public.project_specifications; p public.projects; expected_price integer;
begin
 select * into s from public.project_specifications where id=p_specification_id and student_id=auth.uid() and confirmed=true for update;
 if not found then raise exception 'CONFIRMED_SPEC_REQUIRED'; end if;
 expected_price:=case p_plan when 'basic' then 35000 when 'standard' then 55000 when 'premium' then 85000 end;
 if p_price_ngn<>expected_price then raise exception 'PLAN_PRICE_MISMATCH'; end if;
 if p_writer_id is not null and not exists(select 1 from public.public_profiles pp where pp.id=p_writer_id and pp.verified=true) then raise exception 'WRITER_NOT_AVAILABLE'; end if;
 insert into public.projects(student_id,writer_id,specification_id,title,plan,status,price_ngn,revision_limit)
 values(auth.uid(),p_writer_id,s.id,s.project_title,p_plan,'payment_pending',p_price_ngn,case p_plan when 'basic' then 3 when 'standard' then 5 when 'premium' then 10 end)
 returning * into p;
 return p;
end;
$$;

create or replace function public.assign_writer(p_project_id uuid,p_writer_id uuid,p_deadline_at timestamptz)
returns public.project_assignments language plpgsql security definer set search_path=''
as $$
declare p public.projects; a public.project_assignments; actor public.profiles;
begin
 select * into actor from public.profiles where id=auth.uid();
 if actor.role<>'admin' or actor.account_status<>'approved' then raise exception 'ADMIN_REQUIRED'; end if;
 select * into p from public.projects where id=p_project_id and status='paid' for update;
 if not found then raise exception 'PROJECT_NOT_ASSIGNABLE'; end if;
 if not exists(select 1 from public.profiles where id=p_writer_id and role='writer' and account_status='approved') then raise exception 'WRITER_NOT_APPROVED'; end if;
 if p_deadline_at<=now() or p_deadline_at>now()+interval '14 days' then raise exception 'INVALID_DEADLINE'; end if;
 update public.projects set writer_id=p_writer_id,status='assigned',deadline_at=p_deadline_at,updated_at=now() where id=p.id;
 insert into public.project_assignments(project_id,writer_id,deadline_at) values(p.id,p_writer_id,p_deadline_at) returning * into a;
 update public.project_escrow set writer_id=p_writer_id where project_id=p.id and status='held';
 insert into public.notifications(user_id,type,title,body,metadata) values(p_writer_id,'PROJECT_ASSIGNED','New Finalyzed project assigned','A project is ready for your acceptance.',jsonb_build_object('project_id',p.id,'deadline_at',p_deadline_at));
 return a;
end;
$$;

create or replace function public.assign_editor(p_project_id uuid,p_editor_id uuid)
returns public.project_assignments language plpgsql security definer set search_path=''
as $$
declare p public.projects; a public.project_assignments; actor public.profiles;
begin
 select * into actor from public.profiles where id=auth.uid();
 if actor.role<>'admin' or actor.account_status<>'approved' then raise exception 'ADMIN_REQUIRED'; end if;
 select * into p from public.projects where id=p_project_id and status='submitted_for_review' for update;
 if not found then raise exception 'PROJECT_NOT_AWAITING_EDITOR'; end if;
 if not exists(select 1 from public.profiles where id=p_editor_id and role='editor' and account_status='approved') then raise exception 'EDITOR_NOT_APPROVED'; end if;
 update public.projects set editor_id=p_editor_id,updated_at=now() where id=p.id;
 insert into public.project_assignments(project_id,editor_id,status,assigned_at) values(p.id,p_editor_id,'pending',now()) returning * into a;
 insert into public.notifications(user_id,type,title,body,metadata) values(p_editor_id,'EDITOR_QA_ASSIGNED','Project awaiting quality assurance','A writer has submitted a project for independent QA review.',jsonb_build_object('project_id',p.id));
 return a;
end;
$$;

create or replace function public.writer_accept_revision(p_revision_id uuid)
returns public.project_revisions language plpgsql security definer set search_path=''
as $$
declare r public.project_revisions; p public.projects;
begin
 select * into r from public.project_revisions where id=p_revision_id for update;
 if not found then raise exception 'REVISION_NOT_FOUND'; end if;
 select * into p from public.projects where id=r.project_id for update;
 if p.writer_id<>auth.uid() then raise exception 'WRITER_REQUIRED'; end if;
 if r.status<>'pending' or p.status<>'revision_requested' then raise exception 'REVISION_NOT_AVAILABLE'; end if;
 update public.project_revisions set status='accepted',accepted_by=auth.uid(),accepted_at=now() where id=r.id returning * into r;
 update public.projects set status='revision_in_progress',updated_at=now() where id=p.id;
 insert into public.notifications(user_id,type,title,body,metadata) values(p.student_id,'REVISION_ACCEPTED','Revision accepted by writer','Your requested revision is now in progress.',jsonb_build_object('project_id',p.id,'revision_id',r.id));
 return r;
end;
$$;

drop function if exists public.request_project_revision(uuid,text);
create or replace function public.request_project_revision(p_project_id uuid,p_request_text text,p_points_cost integer default 0)
returns uuid language plpgsql security definer set search_path=''
as $$
declare p public.projects; r public.project_revisions; cost integer;
begin
 select * into p from public.projects where id=p_project_id and student_id=auth.uid() for update;
 if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
 if p.status not in ('delivered','editor_approved') then raise exception 'PROJECT_NOT_REVISIONABLE'; end if;
 if length(trim(coalesce(p_request_text,'')))<5 then raise exception 'REVISION_DETAILS_REQUIRED'; end if;
 if p.revisions_used<p.revision_limit then cost:=0;
 else
   cost:=100;
   if p_points_cost>0 and p_points_cost<>cost then raise exception 'INVALID_ADDITIONAL_REVISION_PRICE'; end if;
   update public.wallets set points_balance=points_balance-cost,updated_at=now() where user_id=auth.uid() and points_balance>=cost;
   if not found then raise exception 'INSUFFICIENT_POINTS'; end if;
   insert into public.point_transactions(user_id,direction,points,reason,project_id) values(auth.uid(),'debit',cost,'Additional project revision',p.id);
 end if;
 insert into public.project_revisions(project_id,requested_by,status,request_text,points_cost)
 values(p.id,auth.uid(),'pending',trim(p_request_text),cost) returning * into r;
 update public.projects set revisions_used=revisions_used+1,status='revision_requested',updated_at=now() where id=p.id;
 insert into public.notifications(user_id,type,title,body,metadata) values(p.writer_id,'REVISION_REQUESTED','Student requested a revision','A student revision request is waiting for your acceptance.',jsonb_build_object('project_id',p.id,'revision_id',r.id,'points_cost',cost));
 return r.id;
end;
$$;

create or replace function public.submit_project_for_editor(p_project_id uuid,p_drive_url text,p_file_type text)
returns public.project_files language plpgsql security definer set search_path=''
as $$
declare p public.projects; f public.project_files; next_version integer;
begin
 select * into p from public.projects where id=p_project_id and writer_id=auth.uid() for update;
 if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
 if p.status not in ('in_progress','revision_in_progress','editor_correction_required') then raise exception 'PROJECT_NOT_SUBMITTABLE'; end if;
 if p_drive_url !~ '^https://(drive[.]google[.]com|docs[.]google[.]com)/' then raise exception 'INVALID_DRIVE_LINK'; end if;
 if p_file_type not in ('pdf','docx','other') then raise exception 'INVALID_FILE_TYPE'; end if;
 select coalesce(max(version),0)+1 into next_version from public.project_files where project_id=p.id;
 insert into public.project_files(project_id,uploaded_by,file_type,drive_url,version,is_customer_visible)
 values(p.id,auth.uid(),p_file_type,p_drive_url,next_version,false) returning * into f;
 update public.projects set status='submitted_for_review',submitted_at=now(),updated_at=now() where id=p.id;
 if p.editor_id is not null then insert into public.notifications(user_id,type,title,body,metadata) values(p.editor_id,'EDITOR_QA_READY','Submission ready for QA','A new project version is ready for quality review.',jsonb_build_object('project_id',p.id,'file_id',f.id)); end if;
 return f;
end;
$$;

create or replace function public.editor_decide_qa(p_project_id uuid,p_decision public.qa_decision,p_feedback text default null)
returns public.qa_reviews language plpgsql security definer set search_path=''
as $$
declare p public.projects; f public.project_files; q public.qa_reviews; rate integer; writer_wallet public.wallets;
begin
 select * into p from public.projects where id=p_project_id and status='submitted_for_review' and editor_id=auth.uid() for update;
 if not found then raise exception 'PROJECT_NOT_IN_QA'; end if;
 select * into f from public.project_files where project_id=p.id order by version desc limit 1;
 if f.id is null then raise exception 'SUBMISSION_FILE_REQUIRED'; end if;
 if p_decision='correction_required' and length(trim(coalesce(p_feedback,'')))<5 then raise exception 'QA_FEEDBACK_REQUIRED'; end if;
 insert into public.qa_reviews(project_id,editor_id,submission_file_id,decision,feedback,decided_at) values(p.id,auth.uid(),f.id,p_decision,nullif(trim(p_feedback),''),now()) returning * into q;
 select case p.plan when 'basic' then coalesce(er.basic_points,100) when 'standard' then coalesce(er.standard_points,100) when 'premium' then coalesce(er.premium_points,100) end into rate from public.editor_rates er where er.editor_id=auth.uid();
 rate:=coalesce(rate,100);
 select * into writer_wallet from public.wallets where user_id=p.writer_id for update;
 if writer_wallet.points_balance<rate then raise exception 'WRITER_INSUFFICIENT_POINTS_FOR_EDITOR_QA'; end if;
 update public.wallets set points_balance=points_balance-rate,updated_at=now() where user_id=p.writer_id;
 insert into public.point_transactions(user_id,direction,points,reason,project_id,reference) values(p.writer_id,'debit',rate,'Editor QA service',p.id,q.id::text);
 insert into public.wallets(user_id,points_balance) values(auth.uid(),rate) on conflict(user_id) do update set points_balance=public.wallets.points_balance+rate,updated_at=now();
 insert into public.point_transactions(user_id,direction,points,reason,project_id,reference) values(auth.uid(),'credit',rate,'Editor QA service earned',p.id,q.id::text);
 update public.project_assignments set status='accepted',response_at=coalesce(response_at,now()) where project_id=p.id and editor_id=auth.uid() and status='pending';
 update public.projects set status=case when p_decision='approved' then 'editor_approved' else 'editor_correction_required' end,approved_at=case when p_decision='approved' then now() else approved_at end,updated_at=now() where id=p.id;
 if p_decision='approved' then
   update public.project_revisions set status='completed',completed_at=now() where project_id=p.id and status in ('accepted','in_progress');
   update public.project_files set is_customer_visible=false where project_id=p.id;
   update public.project_files set is_customer_visible=true where id=f.id;
   insert into public.notifications(user_id,type,title,body,metadata) values(p.student_id,'PROJECT_QA_APPROVED','Project approved for delivery','Your project passed editorial QA and is ready for review.',jsonb_build_object('project_id',p.id,'file_id',f.id));
 else
   insert into public.notifications(user_id,type,title,body,metadata) values(p.writer_id,'QA_CORRECTION_REQUIRED','Editor requested corrections',coalesce(trim(p_feedback),'Please correct and resubmit the document.'),jsonb_build_object('project_id',p.id,'editor_points',rate));
 end if;
 return q;
end;
$$;

create or replace function public.approve_project_delivery(p_project_id uuid)
returns public.projects language plpgsql security definer set search_path=''
as $$
declare p public.projects; escrow public.project_escrow;
begin
 update public.projects set status='completed',completed_at=now(),updated_at=now()
 where id=p_project_id and student_id=auth.uid() and status in ('delivered','editor_approved') returning * into p;
 if not found then raise exception 'DELIVERY_NOT_READY'; end if;
 select * into escrow from public.project_escrow where project_id=p.id for update;
 if escrow.project_id is null or escrow.status<>'held' then raise exception 'ESCROW_NOT_HELD'; end if;
 if p.writer_id is not null then
   update public.wallets set balance_ngn=balance_ngn+p.price_ngn,updated_at=now() where user_id=p.writer_id;
   insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,project_id,metadata) values(p.writer_id,'project_earnings',p.price_ngn,p.id,jsonb_build_object('status','released'));
   update public.project_escrow set status='released',released_at=now(),writer_id=p.writer_id where project_id=p.id;
   insert into public.notifications(user_id,type,title,body,metadata) values(p.writer_id,'PROJECT_PAYMENT_RELEASED','Project payment released','The student approved delivery and your project earnings are now in your wallet.',jsonb_build_object('project_id',p.id,'amount_ngn',p.price_ngn));
 end if;
 return p;
end;
$$;

create or replace function public.credit_purchased_points(p_user_id uuid,p_points bigint,p_amount_ngn bigint,p_reference text)
returns public.wallets language plpgsql security definer set search_path=''
as $$
declare w public.wallets;
begin
 if auth.role() is distinct from 'service_role' and auth.uid() is distinct from p_user_id then raise exception 'USER_AUTH_REQUIRED'; end if;
 if p_points<=0 or p_amount_ngn<=0 or p_points*10<>p_amount_ngn then raise exception 'INVALID_POINT_PURCHASE'; end if;
 if p_reference is null or length(trim(p_reference))<6 then raise exception 'INVALID_REFERENCE'; end if;
 if exists(select 1 from public.point_transactions where reference=p_reference) then select * into w from public.wallets where user_id=p_user_id; return w; end if;
 insert into public.wallets(user_id,points_balance) values(p_user_id,p_points) on conflict(user_id) do update set points_balance=public.wallets.points_balance+p_points,updated_at=now() returning * into w;
 insert into public.point_transactions(user_id,direction,points,reason,reference) values(p_user_id,'credit',p_points,'Purchased Finalyzed Points',trim(p_reference));
 insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,points,reference,metadata) values(p_user_id,'points_purchase',p_amount_ngn,p_points,trim(p_reference),jsonb_build_object('rate','1 point = 10 NGN'));
 return w;
end;
$$;

create or replace function public.admin_process_withdrawal(p_withdrawal_id uuid)
returns public.withdrawals language plpgsql security definer set search_path=''
as $$
declare actor public.profiles; w public.withdrawals;
begin
 select * into actor from public.profiles where id=auth.uid();
 if actor.role<>'admin' or actor.account_status<>'approved' then raise exception 'ADMIN_REQUIRED'; end if;
 update public.withdrawals set status='completed',processed_at=now() where id=p_withdrawal_id and status='pending' returning * into w;
 if not found then raise exception 'WITHDRAWAL_NOT_PENDING'; end if;
 insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,reference,metadata) values(w.user_id,'withdrawal_paid',-w.amount_ngn,w.id::text,jsonb_build_object('fee_ngn',w.transaction_fee_ngn));
 insert into public.notifications(user_id,type,title,body,metadata) values(w.user_id,'WITHDRAWAL_COMPLETED','Withdrawal completed','Your withdrawal has been marked as paid by Finalyzed.',jsonb_build_object('withdrawal_id',w.id,'amount_ngn',w.amount_ngn));
 return w;
end;
$$;

create or replace function public.admin_reject_withdrawal(p_withdrawal_id uuid,p_reason text)
returns public.withdrawals language plpgsql security definer set search_path=''
as $$
declare actor public.profiles; w public.withdrawals; refund bigint;
begin
 select * into actor from public.profiles where id=auth.uid();
 if actor.role<>'admin' or actor.account_status<>'approved' then raise exception 'ADMIN_REQUIRED'; end if;
 update public.withdrawals set status='rejected',processed_at=now() where id=p_withdrawal_id and status='pending' returning * into w;
 if not found then raise exception 'WITHDRAWAL_NOT_PENDING'; end if;
 refund:=w.amount_ngn+w.transaction_fee_ngn;
 update public.wallets set balance_ngn=balance_ngn+refund,updated_at=now() where user_id=w.user_id;
 insert into public.wallet_transactions(user_id,transaction_type,amount_ngn,reference,metadata) values(w.user_id,'withdrawal_refund',refund,w.id::text,jsonb_build_object('reason',coalesce(trim(p_reason),'Rejected by administrator')));
 insert into public.notifications(user_id,type,title,body,metadata) values(w.user_id,'WITHDRAWAL_REJECTED','Withdrawal rejected',coalesce(trim(p_reason),'Your withdrawal was rejected and the held balance was returned.'),jsonb_build_object('withdrawal_id',w.id,'refund_ngn',refund));
 return w;
end;
$$;

create or replace function public.refresh_writer_ranking(p_writer_id uuid)
returns public.public_profiles language plpgsql security definer set search_path=''
as $$
declare r public.public_profiles;
begin
 update public.public_profiles pp set ranking_score=round((
   least(greatest(coalesce(pp.rating,0)/5,0),1)*30
   +least(coalesce(pp.review_count,0)/25.0,1)*10
   +least(coalesce(pp.completed_projects,0)/50.0,1)*15
   +(case when coalesce(pp.average_delivery_days,0)>0 then least(5.0/greatest(pp.average_delivery_days,1),1)*20 else 0 end)
   +least(greatest(coalesce(pp.accuracy_score,0)/100,0),1)*25
 )::numeric,2),updated_at=now() where pp.id=p_writer_id returning * into r;
 return r;
end;
$$;

create or replace function public.refresh_writer_metrics(p_writer_id uuid)
returns public.public_profiles language plpgsql security definer set search_path=''
as $$
declare r public.public_profiles;
begin
 update public.public_profiles pp set
 completed_projects=coalesce((select count(*)::int from public.projects p where p.writer_id=pp.id and p.status='completed'),0),
 review_count=coalesce((select count(*)::int from public.reviews rv where rv.writer_id=pp.id),0),
 rating=coalesce((select round(avg(rv.rating)::numeric,2) from public.reviews rv where rv.writer_id=pp.id),0),
 average_delivery_days=(select round(avg(extract(epoch from (p.submitted_at-pa.response_at))/86400.0)::numeric,2) from public.projects p join public.project_assignments pa on pa.project_id=p.id and pa.writer_id=pp.id where p.writer_id=pp.id and p.submitted_at is not null and pa.response_at is not null),
 accuracy_score=(select round(case when count(q.id)=0 then 0 else (count(*) filter(where q.decision='approved')::numeric/count(*)::numeric)*100 end,2) from public.qa_reviews q join public.projects p on p.id=q.project_id where p.writer_id=pp.id),
 updated_at=now()
 where pp.id=p_writer_id returning * into r;
 perform public.refresh_writer_ranking(p_writer_id);
 return r;
end;
$$;

create or replace function public.trg_projects_refresh_writer_metrics()
returns trigger language plpgsql security definer set search_path=''
as $$ begin if new.writer_id is not null then perform public.refresh_writer_metrics(new.writer_id); end if; return new; end; $$;
create or replace function public.trg_qa_refresh_writer_metrics()
returns trigger language plpgsql security definer set search_path=''
as $$ declare wid uuid; begin select writer_id into wid from public.projects where id=new.project_id; if wid is not null then perform public.refresh_writer_metrics(wid); end if; return new; end; $$;
create or replace function public.trg_reviews_refresh_writer_metrics()
returns trigger language plpgsql security definer set search_path=''
as $$ begin if new.writer_id is not null then perform public.refresh_writer_metrics(new.writer_id); end if; return new; end; $$;

drop trigger if exists trg_projects_refresh_writer_metrics on public.projects;
drop trigger if exists trg_qa_refresh_writer_metrics on public.qa_reviews;
drop trigger if exists trg_reviews_refresh_writer_metrics on public.reviews;
create trigger trg_projects_refresh_writer_metrics after insert or update of status,writer_id,submitted_at,completed_at on public.projects for each row execute function public.trg_projects_refresh_writer_metrics();
create trigger trg_qa_refresh_writer_metrics after insert or update of decision on public.qa_reviews for each row execute function public.trg_qa_refresh_writer_metrics();
create trigger trg_reviews_refresh_writer_metrics after insert or update of rating on public.reviews for each row execute function public.trg_reviews_refresh_writer_metrics();

revoke execute on function public.record_verified_project_payment(uuid,uuid,text,integer,jsonb) from anon,authenticated,public;
grant execute on function public.record_verified_project_payment(uuid,uuid,text,integer,jsonb) to service_role;
revoke execute on function public.record_webhook_project_payment(uuid,uuid,text,integer,jsonb) from anon,authenticated,public;
grant execute on function public.record_webhook_project_payment(uuid,uuid,text,integer,jsonb) to service_role;
revoke execute on function public.credit_purchased_points(uuid,bigint,bigint,text) from anon,authenticated,public;
grant execute on function public.credit_purchased_points(uuid,bigint,bigint,text) to service_role;
revoke execute on function public.refresh_writer_ranking(uuid) from anon,authenticated,public;
revoke execute on function public.refresh_writer_metrics(uuid) from anon,authenticated,public;
revoke execute on function public.trg_projects_refresh_writer_metrics() from anon,authenticated,public;
revoke execute on function public.trg_qa_refresh_writer_metrics() from anon,authenticated,public;
revoke execute on function public.trg_reviews_refresh_writer_metrics() from anon,authenticated,public;
revoke execute on function public.is_finalyzed_admin() from anon,public;
grant execute on function public.is_finalyzed_admin() to authenticated;

create index if not exists idx_projects_status_created on public.projects(status,created_at desc);
create index if not exists idx_projects_editor_status on public.projects(editor_id,status);
create index if not exists idx_projects_writer_status on public.projects(writer_id,status);
create index if not exists idx_project_assignments_editor_status on public.project_assignments(editor_id,status);
create index if not exists idx_project_revisions_project_status on public.project_revisions(project_id,status);
create index if not exists idx_withdrawals_status_created on public.withdrawals(status,created_at desc);
