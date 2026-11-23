# Ying Classroom — teacher login MVP

Project: Supabase ying-teaching-hub, Sydney (zutekwbsqdhcnvcppvjx).

## Implemented
- Public GitHub Pages content remains available without login.
- Teacher email/password login uses Supabase Auth endpoints (token, user, logout, password update).
- Authorization checks the existing public.yth_user_roles table, which already has self-only SELECT RLS. Only the teacher role grants entry.
- Login tokens live in sessionStorage in the current tab, not in URLs or public JSON. The frontend publishable key is public; no service-role key is committed.
- Classroom status reports the teacher login for the current browser only. It is NOT realtime global presence.
- Student number sign-in is NOT enabled. No student IDs, rosters, passwords or grades are published.
- On 23 Nov 2026 the backend had zero Auth users. Do not claim real login tested before onboarding a verified teacher account.

## Existing database schema (do not duplicate)
public.yth_user_roles: user_id UUID primary key, role TEXT (admin/teacher/learner), provisioned_at timestamp.
Policy yth_roles_self_read allows authenticated users to SELECT only their own role, not create/change roles. Anonymous SELECT: false. Authenticated INSERT: false. Authenticated UPDATE: false.

## Teacher account onboarding (authorized admin only)
1. In Supabase Auth Users page, invite or add the verified teacher email; use email verification and private delivery of the account's temporary password. Never commit or transmit passwords in GitHub.
   https://supabase.com/dashboard/project/zutekwbsqdhcnvcppvjx/auth/users
2. Once the account exists, use SQL editor as a trusted admin to add the teacher's verified UUID:
   insert into public.yth_user_roles (user_id, role)
   values ('<verified-user-uuid>'::uuid, 'teacher')
   on conflict (user_id) do update set role = excluded.role;
3. Test login with teacher account at /classroom/login/ and verify the RLS-backed role in /classroom/world/.
4. Negative test: incorrect credentials, valid Auth user without teacher role, logout, password change, iPhone Safari.
5. Check RLS advisors before enabling any real student data.

## Future student number login (not implemented yet)
Student IDs as usernames require a private server-side lookup and rate limits to resist account enumeration. Issue random one-time starting passwords per learner, require change at first sign-in, support secure reset. The roster and ID-to-Auth mapping must not appear on GitHub Pages. Enforce ownership and class access via RLS for assignments, attempts, and released scores.
