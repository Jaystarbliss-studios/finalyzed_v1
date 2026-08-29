alter table public.institutions add column if not exists institution_type text not null default 'university';
update public.institutions set institution_type='university' where institution_type is null or institution_type='';
alter table public.institutions drop constraint if exists institutions_institution_type_check;
alter table public.institutions add constraint institutions_institution_type_check check(institution_type in ('university','polytechnic','other'));

create or replace function public.add_institution(p_name text,p_state text default null,p_ownership text default 'other',p_institution_type text default 'university')
returns jsonb language plpgsql security definer set search_path=public as $function$
declare uid uuid:=auth.uid(); clean_name text:=regexp_replace(trim(coalesce(p_name,'')),'\s+',' ','g'); existing public.institutions; new_id uuid; clean_type text:=case when p_institution_type in ('university','polytechnic') then p_institution_type else 'other' end;
begin
 if uid is null then raise exception 'UNAUTHENTICATED'; end if;
 if length(clean_name)<3 then raise exception 'INVALID_INSTITUTION_NAME'; end if;
 select * into existing from public.institutions where lower(trim(name))=lower(clean_name) limit 1;
 if existing.id is not null then return jsonb_build_object('id',existing.id,'name',existing.name,'existing',true,'institution_type',existing.institution_type); end if;
 insert into public.institutions(name,country,state,ownership,institution_type,source,verified) values(clean_name,'Nigeria',nullif(trim(p_state),''),case when p_ownership in ('federal','state','private') then p_ownership else 'other' end,clean_type,'user_submitted',false) returning id into new_id;
 return jsonb_build_object('id',new_id,'name',clean_name,'existing',false,'institution_type',clean_type);
exception when unique_violation then
 select id,name,institution_type into new_id,clean_name,clean_type from public.institutions where lower(trim(name))=lower(clean_name) limit 1;
 return jsonb_build_object('id',new_id,'name',clean_name,'existing',true,'institution_type',clean_type);
end;$function$;
revoke execute on function public.add_institution(text,text,text,text) from anon;
grant execute on function public.add_institution(text,text,text,text) to authenticated;

create or replace function public.admin_import_institutions(p_institutions jsonb)
returns jsonb language plpgsql security definer set search_path=public as $function$
declare item jsonb; clean_name text; inserted_count integer:=0; updated_count integer:=0; clean_type text;
begin
 if not public.is_finalyzed_admin() then raise exception 'ADMIN_ONLY'; end if;
 if jsonb_typeof(p_institutions)<>'array' then raise exception 'INVALID_IMPORT'; end if;
 for item in select * from jsonb_array_elements(p_institutions) loop
  clean_name:=regexp_replace(trim(coalesce(item->>'name','')),'\s+',' ','g');
  clean_type:=case when item->>'institution_type' in ('university','polytechnic') then item->>'institution_type' else 'other' end;
  if length(clean_name)>=3 then
   if exists(select 1 from public.institutions where lower(trim(name))=lower(clean_name)) then
    update public.institutions set ownership=coalesce(nullif(item->>'ownership',''),'other'),institution_type=clean_type,country='Nigeria',source=coalesce(nullif(item->>'source',''),'national_registry'),verified=true where lower(trim(name))=lower(clean_name);
    updated_count:=updated_count+1;
   else
    insert into public.institutions(name,country,ownership,institution_type,source,verified) values(clean_name,'Nigeria',case when item->>'ownership' in ('federal','state','private') then item->>'ownership' else 'other' end,clean_type,coalesce(nullif(item->>'source',''),'national_registry'),true);
    inserted_count:=inserted_count+1;
   end if;
  end if;
 end loop;
 return jsonb_build_object('inserted',inserted_count,'updated',updated_count,'total',inserted_count+updated_count);
end;$function$;
