-- Writer-to-writer project transfer without payment.
create table if not exists public.writer_project_transfers (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
 from_writer_id uuid not null references public.profiles(id), to_writer_id uuid not null references public.profiles(id),
 original_status text not null, original_deadline_at timestamptz, deadline_at timestamptz not null, note text,
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
 created_at timestamptz not null default now(), responded_at timestamptz,
 constraint transfer_different_writers check(from_writer_id<>to_writer_id)
);
create unique index if not exists writer_project_transfers_one_open on public.writer_project_transfers(project_id) where status='pending';
alter table public.writer_project_transfers enable row level security;
drop policy if exists writer_project_transfers_participants on public.writer_project_transfers;
create policy writer_project_transfers_participants on public.writer_project_transfers for select to authenticated using(from_writer_id=auth.uid() or to_writer_id=auth.uid());

create or replace function public.transfer_project_to_writer(p_project_id uuid,p_to_writer_id uuid,p_deadline_at timestamptz,p_note text default null)
returns public.writer_project_transfers language plpgsql security definer set search_path='' as $$
declare p public.projects; target public.profiles; t public.writer_project_transfers;
begin
 if p_to_writer_id=auth.uid() then raise exception 'CANNOT_TRANSFER_TO_SELF'; end if;
 select * into p from public.projects where id=p_project_id for update;
 if not found or p.writer_id<>auth.uid() then raise exception 'WRITER_REQUIRED'; end if;
 if p.status not in ('assigned','in_progress','revision_in_progress','editor_correction_required') then raise exception 'PROJECT_NOT_TRANSFERABLE'; end if;
 if p_deadline_at<=now() or (p.deadline_at is not null and p_deadline_at>p.deadline_at) then raise exception 'INVALID_TRANSFER_DEADLINE'; end if;
 select * into target from public.profiles where id=p_to_writer_id and role='writer' and account_status='approved';
 if not found then raise exception 'WRITER_NOT_APPROVED'; end if;
 if exists(select 1 from public.writer_project_transfers where project_id=p.id and status='pending') then raise exception 'PROJECT_TRANSFER_ALREADY_PENDING'; end if;
 insert into public.writer_project_transfers(project_id,from_writer_id,to_writer_id,original_status,original_deadline_at,deadline_at,note)
 values(p.id,auth.uid(),p_to_writer_id,p.status,p.deadline_at,p_deadline_at,nullif(trim(p_note),'')) returning * into t;
 insert into public.notifications(user_id,type,title,body,metadata) values(p_to_writer_id,'WRITER_TRANSFER_RECEIVED','Project transfer request','Another writer wants to transfer an active project to you. Review and accept it to begin.',jsonb_build_object('project_id',p.id,'transfer_id',t.id,'deadline_at',p_deadline_at));
 return t;
end;$$;

create or replace function public.respond_to_writer_transfer(p_transfer_id uuid,p_accept boolean)
returns public.writer_project_transfers language plpgsql security definer set search_path='' as $$
declare t public.writer_project_transfers;
begin
 select * into t from public.writer_project_transfers where id=p_transfer_id for update;
 if not found then raise exception 'TRANSFER_NOT_FOUND'; end if;
 if t.to_writer_id<>auth.uid() then raise exception 'TRANSFER_RECIPIENT_REQUIRED'; end if;
 if t.status<>'pending' then raise exception 'TRANSFER_NOT_PENDING'; end if;
 if p_accept then
   update public.writer_project_transfers set status='accepted',responded_at=now() where id=t.id returning * into t;
   update public.projects set writer_id=t.to_writer_id,deadline_at=t.deadline_at,status='in_progress',updated_at=now() where id=t.project_id;
   insert into public.notifications(user_id,type,title,body,metadata) values(t.from_writer_id,'WRITER_TRANSFER_ACCEPTED','Project transfer accepted','The receiving writer accepted your project transfer.',jsonb_build_object('project_id',t.project_id,'transfer_id',t.id));
 else
   update public.writer_project_transfers set status='declined',responded_at=now() where id=t.id returning * into t;
   insert into public.notifications(user_id,type,title,body,metadata) values(t.from_writer_id,'WRITER_TRANSFER_DECLINED','Project transfer declined','The receiving writer declined your project transfer. The project remains assigned to you.',jsonb_build_object('project_id',t.project_id,'transfer_id',t.id));
 end if;
 return t;
end;$$;

create or replace function public.cancel_writer_transfer(p_transfer_id uuid)
returns public.writer_project_transfers language plpgsql security definer set search_path='' as $$
declare t public.writer_project_transfers;
begin
 select * into t from public.writer_project_transfers where id=p_transfer_id for update;
 if not found then raise exception 'TRANSFER_NOT_FOUND'; end if;
 if t.from_writer_id<>auth.uid() then raise exception 'TRANSFER_SENDER_REQUIRED'; end if;
 if t.status<>'pending' then raise exception 'TRANSFER_NOT_CANCELLABLE'; end if;
 update public.writer_project_transfers set status='cancelled',responded_at=now() where id=t.id returning * into t;
 return t;
end;$$;

create or replace function public.get_my_writer_transfers()
returns setof public.writer_project_transfers language sql security definer set search_path='' stable as $$
 select * from public.writer_project_transfers where from_writer_id=auth.uid() or to_writer_id=auth.uid() order by created_at desc;
$$;
revoke all on function public.transfer_project_to_writer(uuid,uuid,timestamptz,text) from public,anon;
revoke all on function public.respond_to_writer_transfer(uuid,boolean) from public,anon;
revoke all on function public.cancel_writer_transfer(uuid) from public,anon;
revoke all on function public.get_my_writer_transfers() from public,anon;
grant execute on function public.transfer_project_to_writer(uuid,uuid,timestamptz,text) to authenticated;
grant execute on function public.respond_to_writer_transfer(uuid,boolean) to authenticated;
grant execute on function public.cancel_writer_transfer(uuid) to authenticated;
grant execute on function public.get_my_writer_transfers() to authenticated;
