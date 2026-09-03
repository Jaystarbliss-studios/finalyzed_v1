-- Preserve original project ownership/status/deadline for safe commission/transfer rollback.
alter table public.writer_commissions add column if not exists original_status text;
alter table public.writer_commissions add column if not exists original_writer_id uuid references public.profiles(id);
alter table public.writer_commissions add column if not exists original_deadline_at timestamptz;

-- Backfill existing commission rows from their sender relationship where possible.
update public.writer_commissions set original_writer_id=from_writer_id where original_writer_id is null;
update public.writer_commissions set original_deadline_at=deadline_at where original_deadline_at is null;
update public.writer_commissions set original_status='assigned' where original_status is null;

create or replace function public.respond_to_writer_commission(p_commission_id uuid,p_accept boolean)
returns public.writer_commissions language plpgsql security definer set search_path='' as $$
declare c public.writer_commissions;
begin
 select * into c from public.writer_commissions where id=p_commission_id for update;
 if not found then raise exception 'COMMISSION_NOT_FOUND'; end if;
 if c.to_writer_id<>auth.uid() then raise exception 'COMMISSION_RECIPIENT_REQUIRED'; end if;
 if c.status<>'pending' then raise exception 'COMMISSION_NOT_PENDING'; end if;
 if p_accept then
   update public.writer_commissions set status='accepted',accepted_at=now() where id=c.id returning * into c;
   update public.projects set status='in_progress',writer_id=c.to_writer_id,deadline_at=c.deadline_at,updated_at=now() where id=c.project_id;
   update public.wallets set points_balance=points_balance+c.points,updated_at=now() where user_id=c.to_writer_id;
   insert into public.point_transactions(user_id,direction,points,reason,project_id,reference) values(c.to_writer_id,'credit',c.points,'Writer commission earned',c.project_id,c.id::text);
   insert into public.notifications(user_id,type,title,body,metadata) values(c.from_writer_id,'WRITER_COMMISSION_ACCEPTED','Commission accepted','The selected writer accepted your commission and can now work on the project.',jsonb_build_object('project_id',c.project_id,'commission_id',c.id));
 else
   update public.writer_commissions set status='declined',declined_at=now() where id=c.id returning * into c;
   update public.projects set writer_id=coalesce(c.original_writer_id,c.from_writer_id),status=coalesce(c.original_status,'assigned'),deadline_at=c.original_deadline_at,updated_at=now() where id=c.project_id;
   update public.wallets set points_balance=points_balance+c.points,updated_at=now() where user_id=c.from_writer_id;
   insert into public.point_transactions(user_id,direction,points,reason,project_id,reference) values(c.from_writer_id,'credit',c.points,'Refunded declined writer commission',c.project_id,c.id::text);
   insert into public.notifications(user_id,type,title,body,metadata) values(c.from_writer_id,'WRITER_COMMISSION_DECLINED','Commission declined','The selected writer declined the commission and your Points were refunded.',jsonb_build_object('project_id',c.project_id,'commission_id',c.id));
 end if;
 return c;
end;$$;

create or replace function public.cancel_writer_commission(p_commission_id uuid)
returns public.writer_commissions language plpgsql security definer set search_path='' as $$
declare c public.writer_commissions;
begin
 select * into c from public.writer_commissions where id=p_commission_id for update;
 if not found then raise exception 'COMMISSION_NOT_FOUND'; end if;
 if c.from_writer_id<>auth.uid() then raise exception 'COMMISSION_SENDER_REQUIRED'; end if;
 if c.status<>'pending' then raise exception 'COMMISSION_NOT_CANCELLABLE'; end if;
 update public.writer_commissions set status='cancelled' where id=c.id returning * into c;
 update public.projects set writer_id=coalesce(c.original_writer_id,c.from_writer_id),status=coalesce(c.original_status,'assigned'),deadline_at=c.original_deadline_at,updated_at=now() where id=c.project_id;
 update public.wallets set points_balance=points_balance+c.points,updated_at=now() where user_id=c.from_writer_id;
 insert into public.point_transactions(user_id,direction,points,reason,project_id,reference) values(c.from_writer_id,'credit',c.points,'Refunded cancelled writer commission',c.project_id,c.id::text);
 return c;
end;$$;
