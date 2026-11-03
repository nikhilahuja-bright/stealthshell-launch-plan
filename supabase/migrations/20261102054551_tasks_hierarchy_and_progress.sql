-- Hierarchy + progress for tasks. Additive only: no drops/renames.
alter table public.tasks
  add column if not exists parent_id text null references public.tasks(id) on delete cascade,
  add column if not exists progress smallint null;

alter table public.tasks
  add constraint tasks_progress_range check (progress is null or (progress between 0 and 100)),
  add constraint tasks_parent_not_self check (parent_id is null or parent_id <> id);

create index if not exists tasks_parent_id_idx on public.tasks (parent_id);

comment on column public.tasks.parent_id is 'Parent task (null = top-level item directly under its workstream/Area). Deleting a parent cascades to its sub-items.';
comment on column public.tasks.progress is 'Leaf progress 0-100 (null = derived from status). Parents are rolled up client-side.';
-- Existing rows keep parent_id = null: every existing task sits directly under its workstream (the Area level).
-- RLS policies on public.tasks are row-level (private.can_edit()) and therefore already cover the new columns.
