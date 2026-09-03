-- Preserve the sender's project state so a pending commission can be declined/cancelled safely.
alter table public.writer_commissions add column if not exists original_deadline_at timestamptz;
alter table public.writer_commissions add column if not exists original_status text;

create or replace function public.commission_project_to_writer(
  p_project_id uuid,
  p_to_writer_id uuid,
  p_points integer,
  p_deadline_at timestamptz,
  p_note text default null
)
returns public.writer_commissions
language plpgsql security definer set search_path=''
as $$
declare p public.projects; target public.profiles; c public.writer_commissions;
begin
  if p_points < 10 then raise exception 'MINIMUM_COMMISSION_POINTS_IS_10'; end if;
  if p_to_writer_id = auth.uid() then raise exception 'CANNOT_COMMISSION_TO_SELF'; end if;
  select * into p from public.projects where id=p_project_id for update;
  if not found or p.writer_id <> auth.uid() then raise exception 'WRITER_REQUIRED'; end if;
  if p.status not in ('assigned','in_progress','revision_in_progress','editor_correction_required') then raise exception 'PROJECT_NOT_COMMISSIONABLE'; end if;
  if p_deadline_at <= now() or (p.deadline_at is not null and p_deadline_at > p.deadline_at) then raise exception 'INVALID_COMMISSION_DEADLINE'; end if;
  select * into target from public.profiles where id=p_to_writer_id and role='writer' and account_status='approved';
  if not found then raise exception 'WRITER_NOT_APPROVED'; end if;
  if exists(select 1 from public.writer_commissions where project_id=p.id and status in ('pending','accepted')) then raise exception 'PROJECT_ALREADY_COMMISSIONED'; end if;
  update public.wallets set points_balance=points_balance-p_points,updated_at=now() where user_id=auth.uid() and points_balance>=p_points;
  if not found then raise exception 'INSUFFICIENT_POINTS'; end if;
  insert into public.point_transactions(user_id,direction,points,reason,project_id) values(auth.uid(),'debit',p_points,'Writer-to-writer commission',p.id);
  insert into public.writer_commissions(project_id,from_writer_id,to_writer_id,points,deadline_at,note,original_deadline_at,original_status)
    values(p.id,auth.uid(),p_to_writer_id,p_points,p_deadline_at,nullif(trim(p_note),''),p.deadline_at,p.status) returning * into c;
  update public.projects set writer_id=p_to_writer_id,deadline_at=p_deadline_at,updated_at=now() where id=p.id;
  insert into public.notifications(user_id,type,title,body,metadata) values(p_to_writer_id,'WRITER_COMMISSION_RECEIVED','New writer commission','A writer has commissioned a project to you. Review the project and accept it to begin.',jsonb_build_object('project_id',p.id,'commission_id',c.id,'points',p_points,'deadline_at',p_deadline_at));
  insert into public.notifications(user_id,type,title,body,metadata) values(auth.uid(),'WRITER_COMMISSION_SENT','Commission sent','Your commission request is waiting for the selected writer to accept.',jsonb_build_object('project_id',p.id,'commission_id',c.id,'points',p_points));
  return c;
end;
$$;

create or replace function public.respond_to_writer_commission(p_commission_id uuid,p_accept boolean)
returns public.writer_commissions
language plpgsql security definer set search_path=''
as $$
declare c public.writer_commissions;
begin
  select * into c from public.writer_commissions where id=p_commission_id for update;
  if not found then raise exception 'COMMISSION_NOT_FOUND'; end if;
  if c.to_writer_id <> auth.uid() then raise exception 'COMMISSION_RECIPIENT_REQUIRED'; end if;
  if c.status <> 'pending' then raise exception 'COMMISSION_NOT_PENDING'; end if;
  if p_accept then
    update public.writer_commissions set status='accepted',accepted_at=now() where id=c.id returning * into c;
    update public.projects set status='in_progress',writer_id=c.to_writer_id,deadline_at=c.deadline_at,updated_at=now() where id=c.project_id;
    update public.wallets set points_balance=points_balance+c.points,updated_at=now() where user_id=c.to_writer_id;
    insert into public.point_transactions(user_id,direction,points,reason,project_id,reference) values(c.to_writer_id,'credit',c.points,'Writer commission earned',c.project_id,c.id::text);
    insert into public.notifications(user_id,type,title,body,metadata) values(c.from_writer_id,'WRITER_COMMISSION_ACCEPTED','Commission accepted','The selected writer accepted your commission and can now work on the project.',jsonb_build_object('project_id',c.project_id,'commission_id',c.id));
  else
    update public.writer_commissions set status='declined',declined_at=now() where id=c.id returning * into c;
    update public.projects set writer_id=c.from_writer_id,status=coalesce(c.original_status,'assigned'),deadline_at=c.original_deadline_at,updated_at=now() where id=c.project_id;
    update public.wallets set points_balance=points_balance+c.points,updated_at=now() where user_id=c.from_writer_id;
    insert into public.point_transactions(user_id,direction,points,reason,project_id,reference) values(c.from_writer_id,'credit',c.points,'Refunded declined writer commission',c.project_id,c.id::text);
    insert into public.notifications(user_id,type,title,body,metadata) values(c.from_writer_id,'WRITER_COMMISSION_DECLINED','Commission declined','The selected writer declined the commission and your Points were refunded.',jsonb_build_object('project_id',c.project_id,'commission_id',c.id));
  end if;
  return c;
end;
$$;

create or replace function public.cancel_writer_commission(p_commission_id uuid)
returns public.writer_commissions
language plpgsql security definer set search_path=''
as $$
declare c public.writer_commissions;
begin
  select * into c from public.writer_commissions where id=p_commission_id for update;
  if not found then raise exception 'COMMISSION_NOT_FOUND'; end if;
  if c.from_writer_id <> auth.uid() then raise exception 'COMMISSION_SENDER_REQUIRED'; end if;
  if c.status <> 'pending' then raise exception 'COMMISSION_NOT_CANCELLABLE'; end if;
  update public.writer_commissions set status='cancelled' where id=c.id returning * into c;
  update public.projects set writer_id=c.from_writer_id,status=coalesce(c.original_status,'assigned'),deadline_at=c.original_deadline_at,updated_at=now() where id=c.project_id;
  update public.wallets set points_balance=points_balance+c.points,updated_at=now() where user_id=c.from_writer_id;
  insert into public.point_transactions(user_id,direction,points,reason,project_id,reference) values(c.from_writer_id,'credit',c.points,'Refunded cancelled writer commission',c.project_id,c.id::text);
  return c;
end;
$$;
