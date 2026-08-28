-- Finalyzed security hardening: privileged workflow RPCs must never be callable anonymously.
revoke execute on function public.raise_project_dispute(uuid,text) from public;
grant execute on function public.raise_project_dispute(uuid,text) to authenticated;
revoke execute on function public.writer_accept_revision(uuid) from public;
grant execute on function public.writer_accept_revision(uuid) to authenticated;
