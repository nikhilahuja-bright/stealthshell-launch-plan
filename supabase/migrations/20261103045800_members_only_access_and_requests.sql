-- Members-only board: plan data is readable only by signed-in members (owner/editor/viewer),
-- signed-in non-members can request access, owners approve or decline.
-- Writes are unchanged (owner/editor via private.can_edit()).

-- 1. helper: is the caller (JWT email) any kind of member?
create or replace function private.is_member()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(private.member_role() in ('owner','editor','viewer'), false) $$;
revoke all on function private.is_member() from public;
grant execute on function private.is_member() to authenticated;

-- 2. board tables: replace the public read policy with a members-only one
do $$
declare t text;
begin
  foreach t in array array['board_settings','workstreams','tasks','flows'] loop
    execute format('drop policy if exists %I on public.%I', t || '_read_all', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select private.is_member()))', t || '_read_members', t);
    -- anon needs nothing on plan tables any more; authenticated keeps only what the app uses (RLS still applies)
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate, references, trigger on public.%I from authenticated', t);
  end loop;
end $$;
revoke truncate, references, trigger on public.members from authenticated;

-- 3. snapshot of the original plan for "Reset to original data" (kept out of the public repo)
create table if not exists public.board_seed (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.board_seed enable row level security;
create policy board_seed_read_owner on public.board_seed for select to authenticated using ((select private.is_owner()));
revoke all on public.board_seed from anon, authenticated;
grant select on public.board_seed to authenticated;
-- (the seed row itself is inserted separately, not from this file, so the plan never lands in the repo)

-- 4. access requests
create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  requested_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','declined')),
  decided_at timestamptz,
  decided_by text,
  constraint access_requests_email_lower check (email = lower(trim(email)) and length(email) > 0)
);
create unique index if not exists access_requests_one_pending_idx on public.access_requests (email) where status = 'pending';
create index if not exists access_requests_email_idx on public.access_requests (email);

create or replace function private.access_requests_before_write()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.email := lower(trim(new.email));
    new.requested_at := now();
    new.status := 'pending';
    new.decided_at := null;
    new.decided_by := null;
  elsif new.status is distinct from old.status and new.status <> 'pending' then
    new.decided_at := now();
    new.decided_by := coalesce(auth.jwt() ->> 'email', new.decided_by);
  end if;
  return new;
end $$;
create trigger access_requests_before_write before insert or update on public.access_requests
  for each row execute function private.access_requests_before_write();

alter table public.access_requests enable row level security;
create policy access_requests_read_own_or_owner on public.access_requests for select to authenticated
  using (email = lower(coalesce((select auth.jwt()) ->> 'email', '')) or (select private.is_owner()));
create policy access_requests_insert_own on public.access_requests for insert to authenticated
  with check (email = lower(coalesce((select auth.jwt()) ->> 'email', '')) and status = 'pending');
create policy access_requests_update_owner on public.access_requests for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
create policy access_requests_delete_owner on public.access_requests for delete to authenticated
  using ((select private.is_owner()));
revoke all on public.access_requests from anon, authenticated;
grant select, insert, update, delete on public.access_requests to authenticated;

-- adding someone to members (Approve or the existing Invite) marks their pending request approved
create or replace function private.members_after_insert()
returns trigger language plpgsql set search_path = ''
as $$
begin
  update public.access_requests set status = 'approved'
   where email = new.email and status = 'pending';
  return new;
end $$;
create trigger members_after_insert after insert on public.members
  for each row execute function private.members_after_insert();

-- realtime: postgres_changes is filtered by these RLS policies per subscriber
alter publication supabase_realtime add table public.access_requests;
