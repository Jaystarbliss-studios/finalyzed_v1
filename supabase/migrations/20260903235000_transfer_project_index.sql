-- Indexes for fast participant history queries.
create index if not exists writer_project_transfers_project on public.writer_project_transfers(project_id,created_at desc);
