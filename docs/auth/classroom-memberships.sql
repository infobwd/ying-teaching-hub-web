-- Ying Classroom Auth authorization roles (apply via Supabase SQL editor / migration review)
-- Login credentials live ONLY in auth.users; teacher records are granted by an admin.
-- This file has no roster and no secret, and does not grant teacher to signed-up users.
begin;
create table if not exists public.classroom_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher','student')),
  display_name text not null check (char_length(display_name) between 1 and 120),
  created_at timestamptz not null default now()
);
alter table public.classroom_memberships enable row level security;
revoke all on table public.classroom_memberships from anon;
revoke all on table public.classroom_memberships from authenticated;
grant select on table public.classroom_memberships to authenticated;
drop policy if exists "Members can read only their own role" on public.classroom_memberships;
create policy "Members can read only their own role"
on public.classroom_memberships for select to authenticated
using (user_id = (select auth.uid()));
commit;
-- DO NOT create a self-registration INSERT or UPDATE policy.
-- Teacher enrollment requires dashboard/privileged admin verification of identity:
-- insert into public.classroom_memberships (user_id, role, display_name)
-- values ('<existing-auth-user-uuid>', 'teacher', '<verified-teacher-display-name>');
