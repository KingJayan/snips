-- code snippet library - database schema
-- run this in the supabase sql editor to bootstrap the project

-- enable uuid generation
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────
-- workspaces
-- ────────────────────────────────────────────
create table if not exists public.workspaces (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(owner_id, name)
);

-- ────────────────────────────────────────────
-- snippets
-- ────────────────────────────────────────────
create table if not exists public.snippets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title       text not null,
  language    text not null default 'plaintext',
  description text default '',
  code        text not null,
  pinned      boolean not null default false,
  public      boolean not null default false,
  view_count integer not null default 0,
  copy_count integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- index for user lookups + pinned sorting
create index if not exists snippets_user_id_idx on public.snippets(user_id);
create index if not exists snippets_workspace_id_idx on public.snippets(workspace_id);
create index if not exists snippets_user_pinned_idx on public.snippets(user_id, pinned desc, updated_at desc);
create index if not exists snippets_public_idx on public.snippets(public, created_at desc) where public = true;

-- auto-update updated_at on row change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_name = 'snippets_updated_at' and event_object_table = 'snippets'
  ) then
    create trigger snippets_updated_at
      before update on public.snippets
      for each row execute function public.handle_updated_at();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_name = 'workspaces_updated_at' and event_object_table = 'workspaces'
  ) then
    create trigger workspaces_updated_at
      before update on public.workspaces
      for each row execute function public.handle_updated_at();
  end if;
end
$$;

-- ────────────────────────────────────────────
-- tags
-- ────────────────────────────────────────────
create table if not exists public.tags (
  id   uuid primary key default uuid_generate_v4(),
  name text not null unique
);

create index if not exists tags_name_idx on public.tags(name);

-- ────────────────────────────────────────────
-- snippet ↔ tag (many-to-many)
-- ────────────────────────────────────────────
create table if not exists public.snippet_tags (
  snippet_id uuid not null references public.snippets(id) on delete cascade,
  tag_id     uuid not null references public.tags(id) on delete cascade,
  primary key (snippet_id, tag_id)
);

create index if not exists snippet_tags_snippet_idx on public.snippet_tags(snippet_id);
create index if not exists snippet_tags_tag_idx on public.snippet_tags(tag_id);

-- ────────────────────────────────────────────
-- legacy cleanup
-- ────────────────────────────────────────────
drop index if exists public.snippets_search_idx;
alter table public.snippets drop column if exists benchmark_chars;
alter table public.snippets drop column if exists benchmark_bytes;
alter table public.snippets drop column if exists benchmark_bits;
alter table public.snippets drop column if exists benchmark_lines;
drop function if exists public.can_manage_workspace(uuid) cascade;
drop function if exists public.is_configured_owner_or_admin() cascade;
drop function if exists public.current_auth_email() cascade;
drop table if exists public.app_access_config cascade;
drop table if exists public.workspace_members cascade;
drop function if exists public.increment_snippet_view(uuid, boolean);
drop function if exists public.increment_snippet_copy(uuid, boolean);

-- ────────────────────────────────────────────
-- row level security
-- ────────────────────────────────────────────
alter table public.workspaces enable row level security;
alter table public.snippets enable row level security;
alter table public.tags enable row level security;
alter table public.snippet_tags enable row level security;

create or replace function public.owns_workspace(p_workspace_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = p_workspace_id and w.owner_id = auth.uid()
  )
$$;

do $$
declare
  p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('workspaces', 'snippets', 'tags', 'snippet_tags')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end
$$;

create policy "workspaces select" on public.workspaces for select
  using (owner_id = auth.uid() or is_public = true);
create policy "workspaces insert" on public.workspaces for insert
  with check (owner_id = auth.uid());
create policy "workspaces update" on public.workspaces for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "workspaces delete" on public.workspaces for delete
  using (owner_id = auth.uid());

create policy "snippets select" on public.snippets for select
  using (
    user_id = auth.uid()
    or public = true
    or exists (
      select 1 from public.workspaces w
      where w.id = snippets.workspace_id and w.is_public = true
    )
  );
create policy "snippets insert" on public.snippets for insert
  with check (user_id = auth.uid() and public.owns_workspace(workspace_id));
create policy "snippets update" on public.snippets for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.owns_workspace(workspace_id));
create policy "snippets delete" on public.snippets for delete
  using (user_id = auth.uid());

create policy "tags select" on public.tags for select
  using (true);
create policy "tags insert" on public.tags for insert
  with check (auth.role() = 'authenticated');

create policy "snippet_tags select" on public.snippet_tags for select
  using (exists (select 1 from public.snippets s where s.id = snippet_tags.snippet_id));
create policy "snippet_tags insert" on public.snippet_tags for insert
  with check (exists (select 1 from public.snippets s where s.id = snippet_tags.snippet_id and s.user_id = auth.uid()));
create policy "snippet_tags delete" on public.snippet_tags for delete
  using (exists (select 1 from public.snippets s where s.id = snippet_tags.snippet_id and s.user_id = auth.uid()));

-- ────────────────────────────────────────────
-- atomic snippet save
-- ────────────────────────────────────────────
drop function if exists public.save_snippet(uuid, uuid, text, text, text, text, integer, integer, integer, integer, text[]);

create or replace function public.save_snippet(
  p_id uuid,
  p_workspace_id uuid,
  p_title text,
  p_language text,
  p_description text,
  p_code text,
  p_tags text[]
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
  v_tags text[];
begin
  select coalesce(array_agg(distinct lower(trim(t))), '{}')
  into v_tags
  from unnest(coalesce(p_tags, '{}')) t
  where trim(t) <> '';

  if p_id is null then
    insert into public.snippets (
      user_id, workspace_id, title, language, description, code
    )
    values (
      auth.uid(), p_workspace_id, p_title, p_language, p_description, p_code
    )
    returning id into v_id;
  else
    update public.snippets
    set title = p_title,
        language = p_language,
        description = p_description,
        code = p_code
    where id = p_id and user_id = auth.uid()
    returning id into v_id;

    if v_id is null then
      raise exception 'snippet not found';
    end if;

    delete from public.snippet_tags where snippet_id = v_id;
  end if;

  insert into public.tags (name)
  select unnest(v_tags)
  on conflict (name) do nothing;

  insert into public.snippet_tags (snippet_id, tag_id)
  select v_id, t.id from public.tags t where t.name = any(v_tags);

  return v_id;
end;
$$;

revoke all on function public.save_snippet(uuid, uuid, text, text, text, text, text[]) from public, anon;
grant execute on function public.save_snippet(uuid, uuid, text, text, text, text, text[]) to authenticated;

-- ────────────────────────────────────────────
-- view / copy counters (one per user per snippet)
-- ────────────────────────────────────────────
create table if not exists public.snippet_counter_events (
  snippet_id uuid not null references public.snippets(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('view', 'copy')),
  created_at timestamptz not null default now(),
  primary key (snippet_id, user_id, kind)
);

alter table public.snippet_counter_events enable row level security;

create or replace function public.increment_snippet_counter(p_snippet_id uuid, p_kind text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_rows integer;
begin
  if auth.uid() is null or p_kind not in ('view', 'copy') then
    return false;
  end if;

  if not exists (
    select 1 from public.snippets s
    where s.id = p_snippet_id
      and (
        s.user_id = auth.uid()
        or s.public = true
        or exists (select 1 from public.workspaces w where w.id = s.workspace_id and w.is_public = true)
      )
  ) then
    return false;
  end if;

  insert into public.snippet_counter_events (snippet_id, user_id, kind)
  values (p_snippet_id, auth.uid(), p_kind)
  on conflict do nothing;

  get diagnostics changed_rows = row_count;
  if changed_rows = 0 then
    return false;
  end if;

  if p_kind = 'view' then
    update public.snippets set view_count = view_count + 1 where id = p_snippet_id;
  else
    update public.snippets set copy_count = copy_count + 1 where id = p_snippet_id;
  end if;

  return true;
end;
$$;

revoke all on function public.increment_snippet_counter(uuid, text) from public, anon;
grant execute on function public.increment_snippet_counter(uuid, text) to authenticated;

-- ────────────────────────────────────────────
-- ai chat rate limit
-- ────────────────────────────────────────────
create table if not exists public.ai_rate_limits (
  user_id      uuid not null references auth.users(id) on delete cascade,
  bucket       text not null default 'minute',
  window_start timestamptz not null default now(),
  count        integer not null default 0
);

alter table public.ai_rate_limits enable row level security;
alter table public.ai_rate_limits add column if not exists bucket text not null default 'minute';
alter table public.ai_rate_limits drop constraint if exists ai_rate_limits_pkey;
alter table public.ai_rate_limits add primary key (user_id, bucket);

drop function if exists public.consume_ai_rate_limit(integer, integer);

create or replace function public.consume_ai_rate_limit(p_bucket text, p_window_seconds integer, p_max integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.ai_rate_limits;
  v_window interval := make_interval(secs => p_window_seconds);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.ai_rate_limits as r (user_id, bucket, window_start, count)
  values (auth.uid(), p_bucket, now(), 1)
  on conflict (user_id, bucket) do update set
    window_start = case when r.window_start <= now() - v_window then now() else r.window_start end,
    count = case when r.window_start <= now() - v_window then 1 else r.count + 1 end
  returning * into v_row;

  if v_row.count > p_max then
    return greatest(1, ceil(extract(epoch from v_row.window_start + v_window - now()))::integer);
  end if;

  return 0;
end;
$$;

revoke all on function public.consume_ai_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.consume_ai_rate_limit(text, integer, integer) to authenticated;

-- ────────────────────────────────────────────
-- migration: add missing columns to existing snippets table
-- ────────────────────────────────────────────

alter table public.snippets add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.snippets add column if not exists pinned boolean not null default false;
alter table public.snippets add column if not exists public boolean not null default false;
alter table public.snippets add column if not exists view_count integer not null default 0;
alter table public.snippets add column if not exists copy_count integer not null default 0;
