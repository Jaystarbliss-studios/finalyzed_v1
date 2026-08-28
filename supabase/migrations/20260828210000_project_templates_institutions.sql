-- Finalyzed project templates, institution catalog, and institution self-service.
alter table public.institutions
  add column if not exists ownership text not null default 'other',
  add column if not exists state text,
  add column if not exists source text not null default 'user_submitted',
  add column if not exists verified boolean not null default false;

create unique index if not exists institutions_name_lower_unique on public.institutions (lower(trim(name)));

alter table public.institution_templates
  add column if not exists specification_schema jsonb not null default '[]'::jsonb;

create or replace function public.add_institution(p_name text, p_state text default null, p_ownership text default 'other')
returns jsonb
language plpgsql
security definer
set search_path=public
as $function$
declare
  uid uuid := auth.uid();
  clean_name text := regexp_replace(trim(coalesce(p_name,'')), '\s+', ' ', 'g');
  existing public.institutions;
  new_id uuid;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if length(clean_name) < 3 then raise exception 'INVALID_INSTITUTION_NAME'; end if;
  select * into existing from public.institutions where lower(trim(name))=lower(clean_name) limit 1;
  if existing.id is not null then
    return jsonb_build_object('id',existing.id,'name',existing.name,'existing',true);
  end if;
  insert into public.institutions(name,country,state,ownership,source,verified)
  values(clean_name,'Nigeria',nullif(trim(p_state),''),case when p_ownership in ('federal','state','private') then p_ownership else 'other' end,'user_submitted',false)
  returning id into new_id;
  return jsonb_build_object('id',new_id,'name',clean_name,'existing',false);
exception when unique_violation then
  select id,name into new_id,clean_name from public.institutions where lower(trim(name))=lower(clean_name) limit 1;
  return jsonb_build_object('id',new_id,'name',clean_name,'existing',true);
end;
$function$;

create or replace function public.use_institution_template(p_template_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $function$
declare t public.institution_templates;
begin
  select * into t from public.institution_templates where id=p_template_id and verified=true;
  if t.id is null then raise exception 'TEMPLATE_NOT_FOUND'; end if;
  update public.institution_templates set usage_count=usage_count+1,updated_at=now() where id=t.id;
  return jsonb_build_object(
    'templateId',t.id,
    'templateName',t.name,
    'institution_id',t.institution_id,
    'department_id',t.department_id,
    'schema',coalesce(t.specification_schema,'[]'::jsonb),
    'defaults',coalesce(t.specification_defaults,'{}'::jsonb)
  );
end;
$function$;

revoke execute on function public.add_institution(text,text,text) from anon;
grant execute on function public.add_institution(text,text,text) to authenticated;
