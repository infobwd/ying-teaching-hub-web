begin;
create or replace function public.yth_student_register_login_alias(
  p_student_id text, p_login_email text
) returns void language plpgsql security definer set search_path = ''
as $$
begin
  if p_student_id !~ '^[0-9]{3,16}$' or char_length(p_login_email) > 254 then
    raise exception 'Invalid student account';
  end if;
  insert into yth_internal.student_login_aliases (student_id, login_email)
  values (p_student_id, p_login_email);
end
$$;
revoke all on function public.yth_student_register_login_alias(text,text) from public, anon, authenticated;
grant execute on function public.yth_student_register_login_alias(text,text) to service_role;
commit;
