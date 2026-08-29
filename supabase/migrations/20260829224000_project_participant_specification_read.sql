-- Allow project participants to read the specification attached to their project.
-- Students remain the only non-admin role allowed to create/update specifications.

drop policy if exists project_specifications_participant_read on public.project_specifications;

create policy project_specifications_participant_read
on public.project_specifications
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.specification_id = project_specifications.id
      and (
        p.student_id = (select auth.uid())
        or p.writer_id = (select auth.uid())
        or p.editor_id = (select auth.uid())
      )
  )
);
