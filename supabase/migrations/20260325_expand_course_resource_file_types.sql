do $$
declare
  constraint_name text;
begin
  select c.conname
  into constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'course_resources'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%file_type%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.course_resources drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.course_resources
add constraint course_resources_file_type_check
check (file_type ~ '^\.[A-Z0-9]{1,12}$');
