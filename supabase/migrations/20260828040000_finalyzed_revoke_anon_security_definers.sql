-- Finalyzed security hardening: privileged workflow RPCs must never be callable anonymously.
revoke execute on function public.raise_project_dispute(uuid,text) from anon;
revoke execute on function public.writer_accept_revision(uuid) from anon;
