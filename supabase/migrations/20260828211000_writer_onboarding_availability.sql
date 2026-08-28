-- Writer onboarding structured availability and school-level preferences.
alter table public.writer_applications
  add column if not exists availability_days text[] not null default '{}'::text[],
  add column if not exists availability_hours text,
  add column if not exists school_levels text[] not null default '{}'::text[];

create or replace function public.complete_onboarding(
  p_role text,p_full_name text,p_username text,p_avatar_url text,p_phone text,p_institution text,p_faculty text,p_department text,p_degree text,p_matric_number text,p_graduation_year text,p_bio text,p_specialties text[],p_portfolio_url text,
  p_availability_days text[] default '{}'::text[],p_availability_hours text default null,p_school_levels text[] default '{}'::text[]
) returns jsonb language plpgsql security definer set search_path=public as $function$
declare uid uuid:=auth.uid(); normalized_role public.user_role; existing public.profiles; normalized_username text:=nullif(lower(trim(p_username)),''); starter_reference text:='WRITER_STARTER_300_'||uid::text;
begin
 if uid is null then raise exception 'UNAUTHENTICATED'; end if;
 if p_role not in ('student','writer','editor') then raise exception 'INVALID_ROLE'; end if;
 if p_role in ('writer','editor') and (normalized_username is null or normalized_username !~ '^[a-z0-9_][a-z0-9_.-]{2,29}$') then raise exception 'INVALID_USERNAME'; end if;
 select * into existing from public.profiles where id=uid for update;
 if existing.onboarding_complete and existing.role::text<>p_role then raise exception 'ROLE_ALREADY_SELECTED'; end if;
 if existing.onboarding_complete and existing.role::text=p_role then raise exception 'ONBOARDING_ALREADY_COMPLETE'; end if;
 if normalized_username is not null and exists(select 1 from public.profiles pr where lower(pr.username)=normalized_username and pr.id<>uid) then raise exception 'USERNAME_TAKEN'; end if;
 normalized_role:=p_role::public.user_role;
 update public.profiles pr set full_name=nullif(trim(p_full_name),''),username=normalized_username,avatar_url=nullif(trim(p_avatar_url),''),role=normalized_role,account_status=case when normalized_role='student' then 'approved'::public.application_status else 'pending'::public.application_status end,onboarding_complete=true,updated_at=now() where pr.id=uid;
 if not found then insert into public.profiles(id,full_name,username,avatar_url,role,account_status,onboarding_complete) values(uid,nullif(trim(p_full_name),''),normalized_username,nullif(trim(p_avatar_url),''),normalized_role,case when normalized_role='student' then 'approved' else 'pending' end,true); end if;
 insert into public.wallets(user_id,points_balance) values(uid,case when normalized_role='writer' then 300 else 0 end) on conflict(user_id) do update set points_balance=case when normalized_role='writer' and public.wallets.points_balance=0 then 300 else public.wallets.points_balance end,updated_at=now();
 if normalized_role='writer' then insert into public.point_transactions(user_id,direction,points,reason,reference) select uid,'credit',300,'New writer starter grant',starter_reference where not exists(select 1 from public.point_transactions pt where pt.user_id=uid and pt.reference=starter_reference); end if;
 if normalized_role='student' then
  insert into public.student_profiles(user_id,phone,institution,faculty,department,degree,matric_number,graduation_year) values(uid,trim(p_phone),trim(p_institution),trim(p_faculty),trim(p_department),trim(p_degree),trim(p_matric_number),trim(p_graduation_year)) on conflict(user_id) do update set phone=excluded.phone,institution=excluded.institution,faculty=excluded.faculty,department=excluded.department,degree=excluded.degree,matric_number=excluded.matric_number,graduation_year=excluded.graduation_year,updated_at=now();
 elsif normalized_role='writer' then
  insert into public.writer_applications(user_id,status,bio,specialties,academic_qualifications,portfolio_url,availability_days,availability_hours,school_levels) values(uid,'pending',nullif(trim(p_bio),''),coalesce(p_specialties,'{}'),nullif(trim(p_degree),''),nullif(trim(p_portfolio_url),''),coalesce(p_availability_days,'{}'),nullif(trim(p_availability_hours),''),coalesce(p_school_levels,'{}')) on conflict do nothing;
 else
  insert into public.editor_applications(user_id,status,bio,specialties,qualifications) values(uid,'pending',nullif(trim(p_bio),''),coalesce(p_specialties,'{}'),nullif(trim(p_degree),'')) on conflict do nothing;
 end if;
 return jsonb_build_object('user_id',uid,'role',normalized_role,'status',case when normalized_role='student' then 'approved' else 'pending' end,'onboarding_complete',true,'username',normalized_username);
end;$function$;
