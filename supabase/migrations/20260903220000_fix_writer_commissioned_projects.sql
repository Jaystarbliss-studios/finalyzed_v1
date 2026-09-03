-- Finalyzed: make commissioned writer projects visible through a server-side participant query.
-- Some commissioned assignments can exist in project_assignments before/alongside the
-- projects.writer_id projection. The writer must be able to see either representation.

create or replace function public.get_my_writer_projects()
returns setof public.projects
language sql
security definer
set search_path = public
stable
as $$
  select p.*
  from public.projects p
  where p.writer_id = auth.uid()
     or exists (
       select 1
       from public.project_assignments pa
       where pa.project_id = p.id
         and pa.writer_id = auth.uid()
         and pa.status <> 'cancelled'
     )
  order by p.created_at desc;
$$;

revoke all on function public.get_my_writer_projects() from public, anon;
grant execute on function public.get_my_writer_projects() to authenticated;
