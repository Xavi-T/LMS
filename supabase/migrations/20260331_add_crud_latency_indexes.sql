create index if not exists chapters_course_id_position_idx
on public.chapters(course_id, position);

create index if not exists lessons_chapter_id_position_idx
on public.lessons(chapter_id, position);

create index if not exists course_outcomes_course_id_position_idx
on public.course_outcomes(course_id, position);

create index if not exists course_resources_course_id_title_idx
on public.course_resources(course_id, title);

create index if not exists course_resources_lesson_id_title_idx
on public.course_resources(lesson_id, title);
