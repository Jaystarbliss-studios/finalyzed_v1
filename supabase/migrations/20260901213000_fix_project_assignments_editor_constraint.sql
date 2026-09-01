-- An editor review assignment belongs to both a project writer and the selected editor.
-- The previous XOR constraint rejected valid writer -> editor assignments.
alter table public.project_assignments drop constraint if exists project_assignments_check;
alter table public.project_assignments add constraint project_assignments_check check (writer_id is not null and editor_id is not null);
