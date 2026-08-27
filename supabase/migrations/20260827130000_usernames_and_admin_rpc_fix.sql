alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_lower_uidx on public.profiles (lower(username)) where username is not null;

create or replace function public.admin_decide_application(p_application_id uuid, p_role text, p_decision text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  app_user uuid;
  app_status text;
  application_bio text;
  application_specialties text[];
  application_quals text;
  application_portfolio text;
  result jsonb;
begin
  if uid is null or not public.is_finalyzed_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if p_role not in ('writer','editor') or p_decision not in ('approved','rejected') then raise exception 'INVALID_APPLICATION_DECISION'; end if;
  if p_role = 'writer' then
    select wa.user_id, wa.status::text, wa.bio, wa.specialties, wa.academic_qualifications, wa.portfolio_url
      into app_user, app_status, application_bio, application_specialties, application_quals, application_portfolio
    from public.writer_applications wa where wa.id = p_application_id for update;
  else
    select ea.user_id, ea.status::text, ea.bio, ea.specialties, ea.qualifications, null::text
      into app_user, app_status, application_bio, application_specialties, application_quals, application_portfolio
    from public.editor_applications ea where ea.id = p_application_id for update;
  end if;
  if app_user is null then raise exception 'APPLICATION_NOT_FOUND'; end if;
  if app_status <> 'pending' then raise exception 'APPLICATION_ALREADY_DECIDED'; end if;
  if p_role = 'writer' then
    update public.writer_applications set status=p_decision::public.application_status, reviewed_at=now(), reviewed_by=uid where id=p_application_id;
  else
    update public.editor_applications set status=p_decision::public.application_status, reviewed_at=now(), reviewed_by=uid where id=p_application_id;
  end if;
  update public.profiles pr set account_status=case when p_decision='approved' then 'approved'::public.application_status else 'rejected'::public.application_status end, updated_at=now() where pr.id=app_user;
  if p_decision='approved' then
    insert into public.public_profiles(id,display_name,avatar_url,bio,specialties,verified,rating,review_count,completed_projects,average_delivery_days,accuracy_score)
    select pr.id,pr.full_name,pr.avatar_url,coalesce(application_bio,''),coalesce(application_specialties,'{}'),true,0,0,0,0,0
    from public.profiles pr where pr.id=app_user
    on conflict(id) do update set display_name=excluded.display_name,avatar_url=excluded.avatar_url,bio=excluded.bio,specialties=excluded.specialties,verified=true,updated_at=now();
  end if;
  result:=jsonb_build_object('user_id',app_user,'role',p_role,'decision',p_decision);
  return result;
end;
$$;

drop function if exists public.complete_onboarding(text,text,text,text,text,text,text,text,text,text,text,text[],text);

create or replace function public.complete_onboarding(
  p_role text,p_full_name text,p_username text,p_avatar_url text,p_phone text,p_institution text,p_faculty text,p_department text,p_degree text,p_matric_number text,p_graduation_year text,p_bio text,p_specialties text[],p_portfolio_url text
)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  uid uuid:=auth.uid(); normalized_role public.user_role; existing public.profiles; normalized_username text:=nullif(lower(trim(p_username)),'');
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
  insert into public.wallets(user_id) values(uid) on conflict(user_id) do nothing;
  if normalized_role='student' then
    insert into public.student_profiles(user_id,phone,institution,faculty,department,degree,matric_number,graduation_year) values(uid,trim(p_phone),trim(p_institution),trim(p_faculty),trim(p_department),trim(p_degree),trim(p_matric_number),trim(p_graduation_year)) on conflict(user_id) do update set phone=excluded.phone,institution=excluded.institution,faculty=excluded.faculty,department=excluded.department,degree=excluded.degree,matric_number=excluded.matric_number,graduation_year=excluded.graduation_year,updated_at=now();
  elsif normalized_role='writer' then
    insert into public.writer_applications(user_id,status,bio,specialties,academic_qualifications,portfolio_url) values(uid,'pending',nullif(trim(p_bio),''),coalesce(p_specialties,'{}'),nullif(trim(p_degree),''),nullif(trim(p_portfolio_url),'')) on conflict do nothing;
  else
    insert into public.editor_applications(user_id,status,bio,specialties,qualifications) values(uid,'pending',nullif(trim(p_bio),''),coalesce(p_specialties,'{}'),nullif(trim(p_degree),'')) on conflict do nothing;
  end if;
  return jsonb_build_object('user_id',uid,'role',normalized_role,'status',case when normalized_role='student' then 'approved' else 'pending' end,'onboarding_complete',true,'username',normalized_username);
end;
$$;
