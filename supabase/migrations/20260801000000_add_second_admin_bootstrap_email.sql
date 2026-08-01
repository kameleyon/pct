-- ============================================================
--  Add a second bootstrap admin email. Whoever signs up with either
--  josinsidevoice@gmail.com or jedaiknight2024@gmail.com becomes admin
--  automatically at signup; everyone else still gets 'member'. Also
--  promotes the account retroactively if it already exists.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (
    id, full_name, role, phone, company, address_line1, address_line2,
    city, state_region, postal_code, country, job_title, how_heard, marketing_opt_in
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when lower(new.email) in ('josinsidevoice@gmail.com', 'jedaiknight2024@gmail.com') then 'admin' else 'member' end,
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'company', ''),
    nullif(new.raw_user_meta_data->>'address_line1', ''),
    nullif(new.raw_user_meta_data->>'address_line2', ''),
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'state_region', ''),
    nullif(new.raw_user_meta_data->>'postal_code', ''),
    nullif(new.raw_user_meta_data->>'country', ''),
    nullif(new.raw_user_meta_data->>'job_title', ''),
    nullif(new.raw_user_meta_data->>'how_heard', ''),
    coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- Retroactively promote the account if it already signed up before this migration.
update public.profiles
set role = 'admin'
where role <> 'admin'
  and id in (select id from auth.users where lower(email) = 'jedaiknight2024@gmail.com');
