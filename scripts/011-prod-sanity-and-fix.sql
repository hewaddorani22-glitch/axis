-- Production sanity + auth-user backfill for Lomoura.
-- Safe to run multiple times against the real Supabase project.

create schema if not exists private;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, created_at)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@missing-email.local'),
    nullif(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        split_part(coalesce(new.email, ''), '@', 1)
      ),
      ''
    ),
    coalesce(new.created_at, now())
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(public.users.name, excluded.name);

  return new;
end;
$$;

-- Remove any auth trigger whose function still writes to the wrong profile table.
do $$
declare
  trigger_record record;
begin
  for trigger_record in
    select t.tgname
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'auth.users'::regclass
      and not t.tgisinternal
      and pg_get_functiondef(p.oid) ilike '%profiles%'
  loop
    execute format('drop trigger if exists %I on auth.users', trigger_record.tgname);
  end loop;
end $$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

drop function if exists public.handle_new_user();

insert into public.users (id, email, name, created_at)
select
  au.id,
  coalesce(au.email, au.id::text || '@missing-email.local') as email,
  nullif(
    coalesce(
      au.raw_user_meta_data ->> 'full_name',
      au.raw_user_meta_data ->> 'name',
      split_part(coalesce(au.email, ''), '@', 1)
    ),
    ''
  ) as name,
  coalesce(au.created_at, now()) as created_at
from auth.users au
on conflict (id) do update
  set email = excluded.email,
      name = coalesce(public.users.name, excluded.name);

create temp table if not exists prod_sanity_result (
  auth_users integer,
  lomoura_users integer,
  missing_lomoura_users integer,
  profiles_exists boolean,
  profiles_rows integer,
  auth_user_triggers jsonb,
  handle_new_user_writes_users boolean,
  handle_new_user_writes_profiles boolean
);

truncate table prod_sanity_result;

do $$
declare
  v_profiles_exists boolean := to_regclass('public.profiles') is not null;
  v_profiles_rows integer := 0;
  v_auth_user_triggers jsonb := '[]'::jsonb;
  v_function_body text := '';
begin
  if v_profiles_exists then
    execute 'select count(*)::integer from public.profiles' into v_profiles_rows;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'trigger', trigger_name,
        'function', function_name
      )
      order by trigger_name
    ),
    '[]'::jsonb
  )
  into v_auth_user_triggers
  from (
    select t.tgname as trigger_name, n.nspname || '.' || p.proname as function_name
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    join pg_namespace n on n.oid = p.pronamespace
    where t.tgrelid = 'auth.users'::regclass
      and not t.tgisinternal
  ) trigger_rows;

  select coalesce(string_agg(pg_get_functiondef(p.oid), E'\n'), '')
  into v_function_body
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where p.proname = 'handle_new_user'
    and n.nspname in ('private', 'public');

  insert into prod_sanity_result
  select
    (select count(*)::integer from auth.users) as auth_users,
    (select count(*)::integer from public.users) as lomoura_users,
    (
      select count(*)::integer
      from auth.users au
      left join public.users u on u.id = au.id
      where u.id is null
    ) as missing_lomoura_users,
    v_profiles_exists as profiles_exists,
    v_profiles_rows as profiles_rows,
    v_auth_user_triggers as auth_user_triggers,
    v_function_body ilike '%public.users%' as handle_new_user_writes_users,
    v_function_body ilike '%profiles%' as handle_new_user_writes_profiles;
end $$;

select * from prod_sanity_result;
