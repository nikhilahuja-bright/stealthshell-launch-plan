-- StealthShell board schema
create schema if not exists private;

create table public.board_settings (
  id smallint primary key default 1 check (id = 1),
  title text not null,
  subtitle text not null default '',
  target_date date not null,
  updated_at timestamptz not null default now()
);

create table public.workstreams (
  name text primary key check (length(trim(name)) > 0),
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id text primary key,
  title text not null check (length(trim(title)) > 0),
  workstream text not null references public.workstreams(name) on update cascade on delete cascade,
  owner text not null default 'Unassigned',
  start_date date not null,
  end_date date not null,
  status text not null default 'todo' check (status in ('done','progress','risk','todo')),
  milestone boolean not null default false,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  description text not null default '',
  notes text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index tasks_workstream_idx on public.tasks (workstream);

create table public.flows (
  id text primary key,
  title text not null default '',
  sub text not null default '',
  steps jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('owner','editor','viewer')),
  invited_by text,
  created_at timestamptz not null default now(),
  constraint members_email_lower check (email = lower(trim(email))),
  constraint members_email_key unique (email)
);

-- helpers (private schema = not exposed through the Data API)
create or replace function private.member_role()
returns text language sql stable security definer set search_path = ''
as $$
  select m.role from public.members m
  where m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1
$$;
create or replace function private.can_edit()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(private.member_role() in ('owner','editor'), false) $$;
create or replace function private.is_owner()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(private.member_role() = 'owner', false) $$;

revoke all on function private.member_role(), private.can_edit(), private.is_owner() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.member_role(), private.can_edit(), private.is_owner() to anon, authenticated;

-- keep at least one owner
create or replace function private.keep_an_owner()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if (select count(*) from public.members where role = 'owner' and id <> old.id) = 0 then
      raise exception 'The board needs at least one owner';
    end if;
  end if;
  return coalesce(new, old);
end $$;
create trigger members_keep_owner before update or delete on public.members
  for each row execute function private.keep_an_owner();

-- stamp invited_by / normalise email
create or replace function private.members_before_insert()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.email := lower(trim(new.email));
  if new.invited_by is null then new.invited_by := auth.jwt() ->> 'email'; end if;
  return new;
end $$;
create trigger members_before_insert before insert on public.members
  for each row execute function private.members_before_insert();

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); return new; end $$;
create trigger t_touch before update on public.tasks for each row execute function private.touch_updated_at();
create trigger w_touch before update on public.workstreams for each row execute function private.touch_updated_at();
create trigger f_touch before update on public.flows for each row execute function private.touch_updated_at();
create trigger s_touch before update on public.board_settings for each row execute function private.touch_updated_at();

-- RLS
alter table public.board_settings enable row level security;
alter table public.workstreams enable row level security;
alter table public.tasks enable row level security;
alter table public.flows enable row level security;
alter table public.members enable row level security;

-- board tables: anyone can read; members with editor/owner can write
do $$
declare t text;
begin
  foreach t in array array['board_settings','workstreams','tasks','flows'] loop
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_read_all', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.can_edit()))', t || '_insert_editors', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.can_edit())) with check ((select private.can_edit()))', t || '_update_editors', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.can_edit()))', t || '_delete_editors', t);
  end loop;
end $$;

-- members: a signed-in user sees their own row; owners see and manage all
create policy members_read_self_or_owner on public.members for select to authenticated
  using (email = lower(coalesce((select auth.jwt()) ->> 'email', '')) or (select private.is_owner()));
create policy members_insert_owner on public.members for insert to authenticated with check ((select private.is_owner()));
create policy members_update_owner on public.members for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy members_delete_owner on public.members for delete to authenticated using ((select private.is_owner()));

revoke all on public.members from anon;

-- realtime
alter publication supabase_realtime add table public.board_settings, public.workstreams, public.tasks, public.flows;
