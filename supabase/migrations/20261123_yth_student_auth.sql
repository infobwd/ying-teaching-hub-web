-- Ying Teaching Hub student identity, private login alias and rate limits.
-- No student data is inserted by this migration.
begin;
create table if not exists public.yth_student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  student_id text not null unique check (student_id ~ '^[0-9]{3,16}$'),
  given_name text not null check (char_length(btrim(given_name)) between 1 and 100),
  family_name text not null check (char_length(btrim(family_name)) between 1 and 100),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.yth_student_profiles enable row level security;
revoke all on table public.yth_student_profiles from public, anon, authenticated;
grant select on table public.yth_student_profiles to authenticated;
drop policy if exists yth_student_profiles_self_read on public.yth_student_profiles;
create policy yth_student_profiles_self_read on public.yth_student_profiles
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists yth_student_profiles_teacher_read on public.yth_student_profiles;
create policy yth_student_profiles_teacher_read on public.yth_student_profiles
for select to authenticated using (
  exists (
    select 1 from public.yth_class_memberships m
    join public.yth_classes c on c.id = m.class_id
    where m.learner_uid = yth_student_profiles.user_id
      and c.teacher_uid = (select auth.uid())
  )
);
create table if not exists yth_internal.student_login_aliases (
  student_id text primary key references public.yth_student_profiles(student_id) on delete cascade,
  login_email text not null unique,
  created_at timestamptz not null default now()
);
alter table yth_internal.student_login_aliases enable row level security;
revoke all on table yth_internal.student_login_aliases from public, anon, authenticated;
create table if not exists yth_internal.student_login_windows (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0)
);
alter table yth_internal.student_login_windows enable row level security;
revoke all on table yth_internal.student_login_windows from public, anon, authenticated;
create or replace function public.yth_student_login_guard(
  p_student_hash text, p_network_hash text
) returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  id_tries integer; network_tries integer;
begin
  if p_student_hash !~ '^[a-f0-9]{64}$'
    or p_network_hash !~ '^[a-f0-9]{64}$' then return false; end if;
  insert into yth_internal.student_login_windows as r (key_hash, started_at, attempts)
  values (p_student_hash, now(), 1)
  on conflict (key_hash) do update set
    attempts = case when r.started_at < now() - interval '15 minutes' then 1 else r.attempts + 1 end,
    started_at = case when r.started_at < now() - interval '15 minutes' then now() else r.started_at end
  returning attempts into id_tries;
  insert into yth_internal.student_login_windows as r (key_hash, started_at, attempts)
  values (p_network_hash, now(), 1)
  on conflict (key_hash) do update set
    attempts = case when r.started_at < now() - interval '15 minutes' then 1 else r.attempts + 1 end,
    started_at = case when r.started_at < now() - interval '15 minutes' then now() else r.started_at end
  returning attempts into network_tries;
  return id_tries <= 5 and network_tries <= 60;
end
$$;
revoke all on function public.yth_student_login_guard(text,text) from public, anon, authenticated;
grant execute on function public.yth_student_login_guard(text,text) to service_role;
create or replace function public.yth_student_login_lookup(p_student_id text)
returns text language sql security definer set search_path = ''
as $$
  select a.login_email from yth_internal.student_login_aliases a
  where a.student_id = p_student_id limit 1
$$;
revoke all on function public.yth_student_login_lookup(text) from public, anon, authenticated;
grant execute on function public.yth_student_login_lookup(text) to service_role;
commit;
