alter table public.course_resources
add column if not exists lesson_id uuid references public.lessons(id) on delete cascade;

create index if not exists course_resources_lesson_id_idx
on public.course_resources(lesson_id);
