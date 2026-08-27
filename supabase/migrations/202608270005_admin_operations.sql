-- Trusted admin read boundary for operational dashboards.
create or replace function public.is_finalyzed_admin()
returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and account_status='approved');
$$;
revoke execute on function public.is_finalyzed_admin() from public;
grant execute on function public.is_finalyzed_admin() to authenticated;
do $$ declare t text; begin
 foreach t in array array['projects','payments','project_assignments','project_escrow','project_files','project_revisions','qa_reviews','reviews','wallets','wallet_transactions','withdrawals','point_transactions','notifications','writer_applications','editor_applications','institutions','departments','institution_guidelines'] loop
   execute format('drop policy if exists admin_read_%I on public.%I',t,t);
   execute format('create policy admin_read_%I on public.%I for select to authenticated using(public.is_finalyzed_admin())',t,t);
 end loop;
end $$;
