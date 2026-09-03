-- Fix notification lookup compatibility by keeping transfer actions server-side and participant scoped.
create index if not exists writer_project_transfers_recipient_status on public.writer_project_transfers(to_writer_id,status,created_at desc);
create index if not exists writer_project_transfers_sender_status on public.writer_project_transfers(from_writer_id,status,created_at desc);
