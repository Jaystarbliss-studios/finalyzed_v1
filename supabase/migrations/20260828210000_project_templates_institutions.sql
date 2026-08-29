-- Finalyzed project specification persistence and reusable templates.
alter table public.institutions
  add column if not exists ownership text not null default 'other',
  add column if not exists state text,
  add column if not exists source text not null default 'user_submitted',
  add column if not exists verified boolean not null default false;

create unique index if not exists institutions_name_lower_unique on public.institutions (lower(trim(name)));

alter table public.institution_templates add column if not exists specification_schema jsonb not null default '[]'::jsonb;

create or replace function public.use_institution_template(p_template_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $function$
declare t public.institution_templates;
begin
 select * into t from public.institution_templates where id=p_template_id and verified=true;
 if t.id is null then raise exception 'TEMPLATE_NOT_FOUND'; end if;
 update public.institution_templates set usage_count=usage_count+1,updated_at=now() where id=t.id;
 return jsonb_build_object('templateId',t.id,'templateName',t.name,'institution_id',t.institution_id,'department_id',t.department_id,'schema',coalesce(t.specification_schema,'[]'::jsonb),'defaults',coalesce(t.specification_defaults,'{}'::jsonb));
end;$function$;

alter table public.project_specifications
 add column if not exists source_template_id uuid references public.institution_templates(id) on delete set null,
 add column if not exists source_template_name text,
 add column if not exists title text,
 add column if not exists specification_schema jsonb not null default '[]'::jsonb,
 add column if not exists answers jsonb not null default '{}'::jsonb,
 add column if not exists status text not null default 'draft',
 add column if not exists is_complete boolean not null default false,
 add column if not exists submitted_at timestamptz;

update public.project_specifications set title=coalesce(title,project_title),status=case when confirmed then 'confirmed' else coalesce(status,'draft') end,is_complete=case when confirmed then true else coalesce(is_complete,false) end,submitted_at=coalesce(submitted_at,confirmed_at) where title is null or confirmed=true;

alter table public.project_specifications drop constraint if exists project_specifications_status_check;
alter table public.project_specifications add constraint project_specifications_status_check check(status in ('draft','submitted','confirmed','archived'));

drop policy if exists "students manage own specifications" on public.project_specifications;
create policy "students manage own specifications" on public.project_specifications for all using(student_id=auth.uid() or public.is_finalyzed_admin()) with check(student_id=auth.uid() or public.is_finalyzed_admin());

alter table public.institution_templates add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.institution_templates add column if not exists is_student_derived boolean not null default false;
alter table public.institution_templates add column if not exists template_source_specification_id uuid references public.project_specifications(id) on delete set null;
alter table public.institution_templates add column if not exists created_at timestamptz not null default now();
alter table public.institution_templates add column if not exists updated_at timestamptz not null default now();

create or replace function public.create_template_from_completed_specification(p_specification_id uuid)
returns uuid language plpgsql security definer set search_path=public as $function$
declare s public.project_specifications; tid uuid; tname text;
begin
 select * into s from public.project_specifications where id=p_specification_id and student_id=auth.uid() and status='confirmed' and is_complete=true;
 if not found then raise exception 'SPECIFICATION_NOT_COMPLETE'; end if;
 tname:=coalesce(nullif(trim(s.source_template_name),''),'Template for '||coalesce((select name from public.institutions where id=s.institution_id),'institution'));
 insert into public.institution_templates(institution_id,name,description,specification_schema,specification_defaults,verified,created_by,is_student_derived,template_source_specification_id)
 values(s.institution_id,tname,'Student-confirmed reusable project specification template',s.specification_schema,s.answers,false,auth.uid(),true,s.id)
 returning id into tid;
 return tid;
end;$function$;
