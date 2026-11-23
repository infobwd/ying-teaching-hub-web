-- Store approved onboarding targets without granting any authentication rights.
-- Do not insert personal contact addresses into GitHub source control.
begin;
create table if not exists yth_internal.teacher_onboarding (
  email text primary key check (
    email = lower(btrim(email))
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  ),
  state text not null default 'pending_invite'
    check (state in ('pending_invite','invited','verified','active')),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  activated_at timestamptz,
  check (state <> 'active' or (auth_user_id is not null and activated_at is not null))
);
alter table yth_internal.teacher_onboarding enable row level security;
revoke all on yth_internal.teacher_onboarding from public, anon, authenticated;
comment on table yth_internal.teacher_onboarding is
  'Private teacher onboarding targets. Pending entries never grant any privileges.';
commit;
