-- Admin approval workflow for Writer/Editor applications.
create or replace function public.admin_decide_application(p_application_id uuid,p_role text,p_decision text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); app_user uuid; app_status text; bio text; specialties text[]; quals text; portfolio text; result jsonb;
begin
 if uid is null or not public.is_finalyzed_admin() then raise exception 'ADMIN_REQUIRED'; end if;
 if p_role not in ('writer','editor') or p_decision not in ('approved','rejected') then raise exception 'INVALID_APPLICATION_DECISION'; end if;
 if p_role='writer' then
   select user_id,status,bio,specialties,academic_qualifications,portfolio_url into app_user,app_status,bio,specialties,quals,portfolio from public.writer_applications where id=p_application_id for update;
 else
   select user_id,status,bio,specialties,qualifications,null into app_user,app_status,bio,specialties,quals,portfolio from public.editor_applications where id=p_application_id for update;
 end if;
 if app_user is null then raise exception 'APPLICATION_NOT_FOUND'; end if;
 if app_status<>'pending' then raise exception 'APPLICATION_ALREADY_DECIDED'; end if;
 if p_role='writer' then update public.writer_applications set status=p_decision::public.application_status,reviewed_at=now(),reviewed_by=uid where id=p_application_id;
 else update public.editor_applications set status=p_decision::public.application_status,reviewed_at=now(),reviewed_by=uid where id=p_application_id;
 end if;
 update public.profiles set account_status=case when p_decision='approved' then 'approved'::public.application_status else 'rejected'::public.application_status end,updated_at=now() where id=app_user;
 if p_decision='approved' then
   insert into public.public_profiles(id,display_name,bio,specialties,verified,rating,review_count,completed_projects,average_delivery_days,accuracy_score)
   select app_user,p.full_name,coalesce(bio,''),coalesce(specialties,'{}'),true,0,0,0,0,0 from public.profiles p where p.id=app_user
   on conflict(id) do update set display_name=excluded.display_name,bio=excluded.bio,specialties=excluded.specialties,verified=true,updated_at=now();
 end if;
 result:=jsonb_build_object('user_id',app_user,'role',p_role,'decision',p_decision);
 return result;
end; $$;
revoke execute on function public.admin_decide_application(uuid,text,text) from public;
grant execute on function public.admin_decide_application(uuid,text,text) to authenticated;
