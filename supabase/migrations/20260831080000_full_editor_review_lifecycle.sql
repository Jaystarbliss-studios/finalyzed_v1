-- Finalyzed: full writer -> editor -> QA -> student delivery lifecycle
-- This migration mirrors the production workflow implemented for the editor marketplace.

alter table public.projects add column if not exists queue_position integer not null default 0;
alter table public.projects add column if not exists estimated_start_at timestamptz;
alter table public.projects add column if not exists queue_note text;

alter table public.public_profiles add column if not exists role text;
update public.public_profiles pp set role=p.role::text from public.profiles p where p.id=pp.id and (pp.role is null or pp.role<>p.role::text);
create index if not exists public_profiles_role_verified_idx on public.public_profiles(role,verified);

create table if not exists public.project_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists project_activity_project_created_idx on public.project_activity(project_id,created_at desc);
alter table public.project_activity enable row level security;
drop policy if exists "project participants read activity" on public.project_activity;
create policy "project participants read activity" on public.project_activity for select using (
  exists(select 1 from public.projects p where p.id=project_id and (p.student_id=auth.uid() or p.writer_id=auth.uid() or p.editor_id=auth.uid()))
  or exists(select 1 from public.profiles pr where pr.id=auth.uid() and pr.role='admin')
);

create or replace function public.sync_public_profile_role() returns trigger language plpgsql security definer set search_path=public as $$
begin update public.public_profiles set role=new.role::text,updated_at=now() where id=new.id; return new; end $$;
drop trigger if exists trg_sync_public_profile_role on public.profiles;
create trigger trg_sync_public_profile_role after insert or update of role on public.profiles for each row execute function public.sync_public_profile_role();

create or replace function public.record_project_activity(p_project_id uuid,p_actor_id uuid,p_event_type text,p_title text,p_body text default null,p_metadata jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare aid uuid;
begin insert into public.project_activity(project_id,actor_id,event_type,title,body,metadata) values(p_project_id,p_actor_id,p_event_type,p_title,p_body,coalesce(p_metadata,'{}'::jsonb)) returning id into aid; return aid; end $$;

create or replace function public.queue_project_email(p_user_id uuid,p_subject text,p_body text)
returns uuid language plpgsql security definer set search_path=public as $$
declare eid uuid; email_addr text;
begin select email into email_addr from auth.users where id=p_user_id; insert into public.email_outbox(user_id,email,subject,body) values(p_user_id,email_addr,p_subject,p_body) returning id into eid; return eid; end $$;

create or replace function public.writer_assign_editor(p_project_id uuid,p_editor_id uuid)
returns public.project_assignments language plpgsql security definer set search_path=public as $$
declare p public.projects; a public.project_assignments; editor public.profiles;
begin
 select * into p from public.projects where id=p_project_id and writer_id=auth.uid() for update;
 if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
 if p.status not in ('in_progress','editor_correction_required','revision_in_progress','submitted_for_review') then raise exception 'PROJECT_NOT_READY_FOR_EDITOR'; end if;
 select * into editor from public.profiles where id=p_editor_id and role='editor' and account_status='approved' and access_state='active';
 if not found then raise exception 'EDITOR_NOT_APPROVED'; end if;
 update public.project_assignments set status='cancelled',response_at=now() where project_id=p.id and editor_id is not null and status in ('pending','accepted');
 update public.projects set editor_id=p_editor_id,updated_at=now() where id=p.id;
 insert into public.project_assignments(project_id,writer_id,editor_id,status,assigned_at,notes) values(p.id,auth.uid(),p_editor_id,'pending',now(),'Requested by project writer') returning * into a;
 perform public.record_project_activity(p.id,auth.uid(),'editor_assigned','Editor requested',coalesce(editor.full_name,'An editor')||' was selected for this project.',jsonb_build_object('editor_id',p_editor_id));
 insert into public.notifications(user_id,type,title,body,metadata) values(p_editor_id,'EDITOR_ASSIGNMENT_REQUEST','New project review request','A project writer selected you for editorial QA. Review the full project specification before accepting.',jsonb_build_object('project_id',p.id,'assignment_id',a.id));
 return a;
end $$;

create or replace function public.editor_respond_assignment(p_assignment_id uuid,p_decision text,p_note text default null)
returns public.project_assignments language plpgsql security definer set search_path=public as $$
declare a public.project_assignments; p public.projects;
begin
 select * into a from public.project_assignments where id=p_assignment_id and editor_id=auth.uid() and status='pending' for update;
 if not found then raise exception 'ASSIGNMENT_NOT_FOUND'; end if;
 if p_decision not in ('accepted','declined') then raise exception 'INVALID_ASSIGNMENT_DECISION'; end if;
 update public.project_assignments set status=p_decision::assignment_status,response_at=now(),notes=coalesce(p_note,notes) where id=a.id returning * into a;
 select * into p from public.projects where id=a.project_id;
 if p_decision='accepted' then
   perform public.record_project_activity(p.id,auth.uid(),'editor_accepted','Editor accepted review','The assigned editor accepted the review request.',jsonb_build_object('assignment_id',a.id));
   insert into public.notifications(user_id,type,title,body,metadata) values(p.writer_id,'EDITOR_ASSIGNMENT_ACCEPTED','Editor accepted your request','Your selected editor accepted the project review request.',jsonb_build_object('project_id',p.id,'editor_id',auth.uid()));
 else
   update public.projects set editor_id=null,updated_at=now() where id=p.id and editor_id=auth.uid();
   perform public.record_project_activity(p.id,auth.uid(),'editor_declined','Editor declined review','The selected editor declined the review request.',jsonb_build_object('assignment_id',a.id,'note',p_note));
   insert into public.notifications(user_id,type,title,body,metadata) values(p.writer_id,'EDITOR_ASSIGNMENT_DECLINED','Editor declined your request','The selected editor declined. Choose another editor from the marketplace.',jsonb_build_object('project_id',p.id));
 end if;
 return a;
end $$;

create or replace function public.writer_set_project_queue(p_project_id uuid,p_queue_position integer,p_estimated_start timestamptz,p_note text default null)
returns public.projects language plpgsql security definer set search_path=public as $$
declare p public.projects;
begin
 if p_queue_position<0 then raise exception 'INVALID_QUEUE_POSITION'; end if;
 update public.projects set queue_position=p_queue_position,estimated_start_at=p_estimated_start,queue_note=nullif(trim(p_note),''),updated_at=now() where id=p_project_id and writer_id=auth.uid() and status in ('assigned','in_progress') returning * into p;
 if not found then raise exception 'PROJECT_NOT_AVAILABLE'; end if;
 perform public.record_project_activity(p.id,auth.uid(),'queue_updated',case when p_queue_position>0 then 'Project placed in queue' else 'Project moved to active work' end,coalesce(p.queue_note,'Queue status updated.'),jsonb_build_object('queue_position',p_queue_position,'estimated_start_at',p_estimated_start));
 insert into public.notifications(user_id,type,title,body,metadata) values(p.student_id,'PROJECT_QUEUE_UPDATED',case when p_queue_position>0 then 'Project is in the writer queue' else 'Project work is starting' end,case when p_queue_position>0 then 'There are '||p_queue_position||' project(s) ahead of yours. Estimated start: '||coalesce(to_char(p_estimated_start,'DD Mon YYYY HH24:MI'),'to be confirmed')||'.' else 'Your writer has moved your project into active work.' end,jsonb_build_object('project_id',p.id,'queue_position',p_queue_position,'estimated_start_at',p_estimated_start));
 perform public.queue_project_email(p.student_id,case when p_queue_position>0 then 'Finalyzed project queue update' else 'Finalyzed project is now in progress' end,case when p_queue_position>0 then 'Your project is currently in the writer queue with '||p_queue_position||' project(s) ahead of yours.' else 'Your writer has started work on your project.' end);
 return p;
end $$;

create or replace function public.writer_forward_approved_delivery(p_project_id uuid)
returns public.project_files language plpgsql security definer set search_path=public as $$
declare p public.projects; f public.project_files;
begin
 select * into p from public.projects where id=p_project_id and writer_id=auth.uid() and status='editor_approved' for update;
 if not found then raise exception 'PROJECT_NOT_EDITOR_APPROVED'; end if;
 select * into f from public.project_files where project_id=p.id order by version desc limit 1 for update;
 if f.id is null then raise exception 'SUBMISSION_FILE_REQUIRED'; end if;
 update public.project_files set is_customer_visible=true where id=f.id returning * into f;
 perform public.record_project_activity(p.id,auth.uid(),'delivery_forwarded','Final document forwarded to student','The writer forwarded the editor-approved document to the student.',jsonb_build_object('file_id',f.id,'version',f.version));
 insert into public.notifications(user_id,type,title,body,metadata) values(p.student_id,'PROJECT_DELIVERY_FORWARDED','Your approved project is ready','Your writer has forwarded the editor-approved document. You can now open it from My Projects.',jsonb_build_object('project_id',p.id,'file_id',f.id));
 perform public.queue_project_email(p.student_id,'Your Finalyzed project is ready','Your editor-approved project has been forwarded by the writer and is ready to review.');
 return f;
end $$;

create or replace function public.submit_project_for_editor(p_project_id uuid,p_drive_url text,p_file_type text)
returns public.project_files language plpgsql security definer set search_path='' as $$
declare p public.projects; f public.project_files; next_version integer;
begin
 select * into p from public.projects where id=p_project_id and writer_id=auth.uid() for update;
 if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
 if p.editor_id is null then raise exception 'EDITOR_REQUIRED_BEFORE_QA'; end if;
 if p.status not in ('in_progress','revision_in_progress','editor_correction_required') then raise exception 'PROJECT_NOT_SUBMITTABLE'; end if;
 if p_drive_url !~ '^https://(drive[.]google[.]com|docs[.]google[.]com)/' then raise exception 'INVALID_DRIVE_LINK'; end if;
 if p_file_type not in ('pdf','docx','other') then raise exception 'INVALID_FILE_TYPE'; end if;
 select coalesce(max(version),0)+1 into next_version from public.project_files where project_id=p.id;
 insert into public.project_files(project_id,uploaded_by,file_type,drive_url,version,is_customer_visible) values(p.id,auth.uid(),p_file_type,p_drive_url,next_version,false) returning * into f;
 update public.projects set status='submitted_for_review',submitted_at=now(),updated_at=now() where id=p.id;
 insert into public.notifications(user_id,type,title,body,metadata) values(p.editor_id,'EDITOR_QA_READY','Submission ready for QA','A new project version is ready. The full student specification is attached to the project workspace.',jsonb_build_object('project_id',p.id,'file_id',f.id));
 perform public.record_project_activity(p.id,auth.uid(),'submitted_for_review','Project submitted for editorial QA','The writer submitted a new document version for the assigned editor.',jsonb_build_object('file_id',f.id,'version',f.version));
 perform public.queue_project_email(p.editor_id,'Finalyzed project ready for editorial QA','A project assigned to you has a new document ready for QA. Review the full confirmed student specification before deciding.');
 return f;
end $$;

create or replace function public.editor_decide_qa(p_project_id uuid,p_decision qa_decision,p_feedback text default null)
returns public.qa_reviews language plpgsql security definer set search_path='' as $$
declare p public.projects; f public.project_files; q public.qa_reviews; rate integer; writer_wallet public.wallets;
begin
 select * into p from public.projects where id=p_project_id and status='submitted_for_review' and editor_id=auth.uid() for update;
 if not found then raise exception 'PROJECT_NOT_IN_QA'; end if;
 if not exists(select 1 from public.project_assignments where project_id=p.id and editor_id=auth.uid() and status='accepted') then raise exception 'EDITOR_ASSIGNMENT_NOT_ACCEPTED'; end if;
 select * into f from public.project_files where project_id=p.id order by version desc limit 1;
 if f.id is null then raise exception 'SUBMISSION_FILE_REQUIRED'; end if;
 if p_decision='correction_required' and length(trim(coalesce(p_feedback,'')))<5 then raise exception 'QA_FEEDBACK_REQUIRED'; end if;
 insert into public.qa_reviews(project_id,editor_id,submission_file_id,decision,feedback,decided_at) values(p.id,auth.uid(),f.id,p_decision,nullif(trim(p_feedback),''),now()) returning * into q;
 select case p.plan when 'basic' then coalesce(er.basic_points,100) when 'standard' then coalesce(er.standard_points,100) when 'premium' then coalesce(er.premium_points,100) end into rate from public.editor_rates er where er.editor_id=auth.uid(); rate:=coalesce(rate,100);
 select * into writer_wallet from public.wallets where user_id=p.writer_id for update;
 if writer_wallet.points_balance<rate then raise exception 'WRITER_INSUFFICIENT_POINTS_FOR_EDITOR_QA'; end if;
 update public.wallets set points_balance=points_balance-rate,updated_at=now() where user_id=p.writer_id;
 insert into public.point_transactions(user_id,direction,points,reason,project_id,reference) values(p.writer_id,'debit',rate,'Editor QA service',p.id,q.id::text);
 insert into public.wallets(user_id,points_balance) values(auth.uid(),rate) on conflict(user_id) do update set points_balance=public.wallets.points_balance+rate,updated_at=now();
 insert into public.point_transactions(user_id,direction,points,reason,project_id,reference) values(auth.uid(),'credit',rate,'Editor QA service earned',p.id,q.id::text);
 update public.projects set status=case when p_decision='approved' then 'editor_approved' else 'editor_correction_required' end,approved_at=case when p_decision='approved' then now() else approved_at end,updated_at=now() where id=p.id;
 update public.project_files set is_customer_visible=false where project_id=p.id;
 if p_decision='approved' then
   update public.project_revisions set status='completed',completed_at=now() where project_id=p.id and status in ('accepted','in_progress');
   perform public.record_project_activity(p.id,auth.uid(),'qa_approved','Editor approved project','The submitted document passed editorial QA. The writer must forward it to the student.',jsonb_build_object('qa_id',q.id,'editor_points',rate));
   insert into public.notifications(user_id,type,title,body,metadata) values(p.writer_id,'PROJECT_QA_APPROVED','Editor approved your project','The editor approved the document. Forward the approved document to the student.',jsonb_build_object('project_id',p.id,'file_id',f.id));
 else
   perform public.record_project_activity(p.id,auth.uid(),'qa_correction_required','Editor requested corrections',coalesce(trim(p_feedback),'Please correct the submitted document and resubmit it.'),jsonb_build_object('qa_id',q.id,'editor_points',rate));
   insert into public.notifications(user_id,type,title,body,metadata) values(p.writer_id,'QA_CORRECTION_REQUIRED','Editor requested corrections',coalesce(trim(p_feedback),'Please correct the submitted document and resubmit it.'),jsonb_build_object('project_id',p.id,'editor_points',rate));
 end if;
 return q;
end $$;

create or replace function public.log_project_status_activity() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op='INSERT' then perform public.record_project_activity(new.id,new.student_id,'project_created','Project created','Your project workspace was created.',jsonb_build_object('status',new.status));
 elsif old.status is distinct from new.status then
   perform public.record_project_activity(new.id,auth.uid(),'status_changed','Project status updated','Project status changed to '||replace(new.status::text,'_',' ')||'.',jsonb_build_object('status',new.status::text));
   insert into public.notifications(user_id,type,title,body,metadata) values(new.student_id,'PROJECT_STATUS_CHANGED','Project status updated','Your project is now '||replace(new.status::text,'_',' ')||'.',jsonb_build_object('project_id',new.id,'status',new.status::text));
 end if;
 return new;
end $$;
drop trigger if exists trg_project_status_activity on public.projects;
create trigger trg_project_status_activity after insert or update of status on public.projects for each row execute function public.log_project_status_activity();

revoke all on function public.writer_assign_editor(uuid,uuid) from public;
grant execute on function public.writer_assign_editor(uuid,uuid) to authenticated;
revoke all on function public.editor_respond_assignment(uuid,text,text) from public;
grant execute on function public.editor_respond_assignment(uuid,text,text) to authenticated;
revoke all on function public.writer_set_project_queue(uuid,integer,timestamptz,text) from public;
grant execute on function public.writer_set_project_queue(uuid,integer,timestamptz,text) to authenticated;
revoke all on function public.writer_forward_approved_delivery(uuid) from public;
grant execute on function public.writer_forward_approved_delivery(uuid) to authenticated;
revoke all on function public.record_project_activity(uuid,uuid,text,text,text,jsonb) from public;
grant execute on function public.record_project_activity(uuid,uuid,text,text,text,jsonb) to authenticated;
revoke all on function public.queue_project_email(uuid,text,text) from public;
grant execute on function public.queue_project_email(uuid,text,text) to authenticated;
