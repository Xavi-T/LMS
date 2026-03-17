import { courses } from "@/lib/mock-data";

export const getCourseBySlug = (slug: string) =>
  courses.find((course) => course.slug === slug);

export const getLessonById = (courseSlug: string, lessonId: string) => {
  const course = getCourseBySlug(courseSlug);
  if (!course) {
    return undefined;
  }

  for (const chapter of course.chapters) {
    const lesson = chapter.lessons.find((item) => item.id === lessonId);
    if (lesson) {
      return lesson;
    }
  }

  return undefined;
};

export const flattenLessons = (courseSlug: string) => {
  const course = getCourseBySlug(courseSlug);
  if (!course) {
    return [];
  }

  return course.chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => ({
      ...lesson,
      chapterTitle: chapter.title,
    })),
  );
};
