"use client";

import Link from "next/link";
import { useMemo } from "react";
import { VideoPlayer } from "@/components/learning/video-player";
import { ProgressBar } from "@/components/common/progress-bar";
import { flattenLessons, getCourseBySlug, getLessonById } from "@/lib/course";
import { useAppState } from "@/contexts/app-context";

export default function LearningPage({
  params,
}: {
  params: { courseSlug: string; lessonId: string };
}) {
  const { courseSlug, lessonId } = params;
  const { markLessonComplete, learningProgress, purchasedCourseSlugs } =
    useAppState();

  const course = getCourseBySlug(courseSlug);
  const lesson = getLessonById(courseSlug, lessonId);
  const lessons = useMemo(() => flattenLessons(courseSlug), [courseSlug]);

  if (!course || !lesson) {
    return (
      <div className="container-app py-10 text-center text-sm">
        Không tìm thấy nội dung bài học.{" "}
        <Link href="/courses" className="text-accent">
          Quay lại danh sách khóa học
        </Link>
      </div>
    );
  }

  const currentIndex = lessons.findIndex((item) => item.id === lessonId);
  const previous = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const next =
    currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const completed = learningProgress[courseSlug]?.length ?? 0;
  const hasPurchased = purchasedCourseSlugs.includes(courseSlug);

  return (
    <div className="grid min-h-screen md:grid-cols-[300px_1fr]">
      <aside className="border-r border-border bg-black p-4">
        <Link href="/courses" className="text-xs text-accent">
          ← Quay lại khóa học
        </Link>
        <h1 className="mt-2 text-lg font-bold">{course.title}</h1>

        <ProgressBar
          value={completed}
          total={lessons.length}
          className="mt-4"
        />

        <div className="mt-4 space-y-3 overflow-y-auto md:h-[calc(100vh-210px)]">
          {course.chapters.map((chapter) => (
            <div key={chapter.id}>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                {chapter.title}
              </p>
              <div className="mt-1 space-y-1">
                {chapter.lessons.map((item) => {
                  const done = learningProgress[courseSlug]?.includes(item.id);
                  return (
                    <Link
                      key={item.id}
                      href={`/learn/${courseSlug}/${item.id}`}
                      className={`block rounded-lg px-3 py-2 text-sm ${
                        item.id === lessonId
                          ? "bg-accent font-bold text-black"
                          : "border border-border text-zinc-200"
                      }`}
                    >
                      {item.title}
                      {done && <span className="ml-1 text-xs">✓</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="space-y-4 p-4 md:p-6">
        {!hasPurchased && (
          <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-xs text-orange-200">
            Bạn đang ở chế độ học thử. Mua khóa học để mở kho tài liệu và đầy đủ
            quyền học tập.
          </div>
        )}

        <div>
          <p className="text-xs text-zinc-400">
            {lesson.type === "video" ? "Video bài giảng" : "Bài đọc"}
          </p>
          <h2 className="text-2xl font-black">{lesson.title}</h2>
          <p className="text-sm text-zinc-300">{lesson.summary}</p>
        </div>

        <VideoPlayer lessonId={lesson.id} src={lesson.videoUrl} />

        {lesson.type === "text" && lesson.content && (
          <article className="card p-4 text-sm leading-7 text-zinc-200">
            {lesson.content}
          </article>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            className="btn-primary px-4 py-2 text-sm"
            onClick={() => markLessonComplete(courseSlug, lesson.id)}
          >
            Hoàn thành bài học
          </button>
          {previous && (
            <Link
              href={`/learn/${courseSlug}/${previous.id}`}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Bài trước
            </Link>
          )}
          {next && (
            <Link
              href={`/learn/${courseSlug}/${next.id}`}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Bài tiếp theo
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
