-- Keep transfer and commission workflows mutually exclusive.
create or replace function public.commission_project_to_writer(p_project_id uuid,p_to_writer_id uuid,p_points integer,p_deadline_at timestamptz,p_note text default null)
returns public.writer_commissions language plpgsql security definer set search_path='' as $$
declare p public.projects; target public.profiles; c public.writer_commissions;
begin
 if p_points<10 then raise exception 'MINIMUM_COMMISSION_POINTS_IS_10'; end if;
 if p_to_writer_id=auth.uid() then raise exception 'CANNOT_COMMISSION_TO_SELF'; end if;
 select * into p from public.projects where id=p_project_id for update;
 if not found or p.writer_id<>auth.uid() then raise exception 'WRITER_REQUIRED'; end if;
 if p.status not in ('assigned','in_progress','revision_in_progress','editor_correction_required') then raise exception 'PROJECT_NOT_COMMISSIONABLE'; end if;
 if p_deadline_at<=now() or (p.deadline_at is not null and p_deadline_at>p.deadline_at) then raise exception 'INVALID_COMMISSION_DEADLINE'; end if;
 if exists(select 1 from public.writer_project_transfers where project_id=p.id and status='pending') then raise exception 'PROJECT_TRANSFER_ALREADY_PENDING'; end if;
 select * into target from public.profiles where id=p_to_writer_id and role='writer' and account_status='approved';
 if not found then raise exception 'WRITER_NOT_APPROVED'; end if;
 if exists(select 1 from public.writer_commissions where project_id=p.id and status in ('pending','accepted')) then raise exception 'PROJECT_ALREADY_COMMISSIONED'; end if;
 update public.wallets set points_balance=points_balance-p_points,updated_at=now() where user_id=auth.uid() and points_balance>=p_points;
 if not found then raise exception 'INSUFFICIENT_POINTS'; end if;
 insert into public.point_transactions(user_id,direction,points,reason,project_id) values(auth.uid(),'debit',p_points,'Writer-to-writer commission',p.id);
 insert into public.writer_commissions(project_id,from_writer_id,to_writer_id,points,deadline_at,note,original_status,original_writer_id,original_deadline_at)
 values(p.id,auth.uid(),p_to_writer_id,p_points,p_deadline_at,nullif(trim(p_note),''),p.status,p.writer_id,p.deadline_at) returning * into c;
 update public.projects set writer_id=p_to_writer_id,deadline_at=p_deadline_at,updated_at=now() where id=p.id;
 insert into public.notifications(user_id,type,title,body,metadata) values(p_to_writer_id,'WRITER_COMMISSION_RECEIVED','New writer commission','Another writer commissioned a project to you. Review and accept it to begin.',jsonb_build_object('project_id',p.id,'commission_id',c.id,'points',p_points,'deadline_at',p_deadline_at));
 insert into public.notifications(user_id,type,title,body,metadata) values(auth.uid(),'WRITER_COMMISSION_SENT','Commission sent','Your commission request is waiting for the selected writer to accept.',jsonb_build_object('project_id',p.id,'commission_id',c.id,'points',p_points));
 return c;
end;$$;

create or replace function public.transfer_project_to_writer(p_project_id uuid,p_to_writer_id uuid,p_deadline_at timestamptz,p_note text default null)
returns public.writer_project_transfers language plpgsql security definer set search_path='' as $$
declare p public.projects; target public.profiles; t public.writer_project_transfers;
begin
 if p_to_writer_id=auth.uid() then raise exception 'CANNOT_TRANSFER_TO_SELF'; end if;
 select * into p from public.projects where id=p_project_id for update;
 if not found or p.writer_id<>auth.uid() then raise exception 'WRITER_REQUIRED'; end if;
 if p.status not in ('assigned','in_progress','revision_in_progress','editor_correction_required') then raise exception 'PROJECT_NOT_TRANSFERABLE'; end if;
 if p_deadline_at<=now() or (p.deadline_at is not null and p_deadline_at>p.deadline_at) then raise exception 'INVALID_TRANSFER_DEADLINE'; end if;
 if exists(select 1 from public.writer_commissions where project_id=p.id and status in ('pending','accepted')) then raise exception 'PROJECT_ALREADY_COMMISSIONED'; end if;
 select * into target from public.profiles where id=p_to_writer_id and role='writer' and account_status='approved';
 if not found then raise exception 'WRITER_NOT_APPROVED'; end if;
 if exists(select 1 from public.writer_project_transfers where project_id=p.id and status='pending') then raise exception 'PROJECT_TRANSFER_ALREADY_PENDING'; end if;
 insert into public.writer_project_transfers(project_id,from_writer_id,to_writer_id,original_status,original_deadline_at,deadline_at,note) values(p.id,auth.uid(),p_to_writer_id,p.status,p.deadline_at,p_deadline_at,nullif(trim(p_note),'')) returning * into t;
 insert into public.notifications(user_id,type,title,body,metadata) values(p_to_writer_id,'WRITER_TRANSFER_RECEIVED','Project transfer request','Another writer wants to transfer an active project to you. Review and accept it to begin.',jsonb_build_object('project_id',p.id,'transfer_id',t.id,'deadline_at',p_deadline_at));
 return t;
end;$$;
