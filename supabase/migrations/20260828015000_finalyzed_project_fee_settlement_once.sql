-- Follow-up to finalyzed_fees_starter_points_disputes.
-- The project-payment 2% fee is charged once at writer settlement (approve_project_delivery),
-- not when Paystack payment is merely placed into escrow. This prevents double charging.
create or replace function public.record_verified_project_payment(
  p_project_id uuid,p_student_id uuid,p_reference text,p_amount_ngn integer,p_metadata jsonb default '{}'::jsonb
) returns public.payments
language plpgsql security definer set search_path=''
as $function$
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
$function$;
