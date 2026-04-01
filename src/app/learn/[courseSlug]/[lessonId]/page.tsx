"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { use, useEffect, useMemo, useState } from "react";
import { VideoPlayer } from "@/components/learning/video-player";
import { ProgressBar } from "@/components/common/progress-bar";
import { getCourseBySlug } from "@/lib/course";
import { useAppState } from "@/contexts/app-context";

const MarkdownPreview = dynamic(
  async () => (await import("@uiw/react-md-editor")).default.Markdown,
  { ssr: false },
);

type LearningLesson = {
  id: string;
  title: string;
  type: "video" | "text";
  duration: string;
  summary: string;
  content?: string;
  videoUrl?: string;
  resources: Array<{
    id: string;
    title: string;
    description?: string;
    fileType: string;
    signedUrl?: string;
  }>;
};

type LearningChapter = {
  id: string;
  title: string;
  lessons: LearningLesson[];
};

type LearningCourse = {
  slug: string;
  title: string;
  chapters: LearningChapter[];
};

export default function LearningPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = use(params);
  const normalizedCourseSlug = courseSlug.trim().toLowerCase();
  const {
    user,
    markLessonComplete,
    markLessonInProgress,
    learningProgress,
    purchasedCourseSlugs,
    showToast,
  } = useAppState();
  const [remoteCourse, setRemoteCourse] = useState<LearningCourse | null>(null);
  const [curriculumForbidden, setCurriculumForbidden] = useState(false);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    let active = true;

    const loadCurriculum = async () => {
      setIsLoadingCurriculum(true);
      try {
        const response = await fetch(
          `/api/curriculum/${normalizedCourseSlug}`,
          {
            cache: "no-store",
          },
        );

        if (response.status === 403) {
          if (active) {
            setCurriculumForbidden(true);
          }
          return;
        }

        const result = await response.json();
        if (!response.ok || !result?.course) {
          return;
        }

        if (active) {
          setCurriculumForbidden(false);
          setRemoteCourse(result.course as LearningCourse);
        }
      } catch {
      } finally {
        if (active) {
          setIsLoadingCurriculum(false);
        }
      }
    };

    void loadCurriculum();

    return () => {
      active = false;
    };
  }, [normalizedCourseSlug]);

  const fallbackCourse = useMemo(
    () =>
      user?.role === "student" ? null : getCourseBySlug(normalizedCourseSlug),
    [normalizedCourseSlug, user?.role],
  );

  const course = useMemo(
    () =>
      remoteCourse ??
      (fallbackCourse
        ? {
            slug: fallbackCourse.slug,
            title: fallbackCourse.title,
            chapters: fallbackCourse.chapters.map((chapter) => ({
              id: chapter.id,
              title: chapter.title,
              lessons: chapter.lessons.map((item) => ({
                id: item.id,
                title: item.title,
                type: item.type,
                duration: item.duration,
                summary: item.summary,
                content: item.content,
                videoUrl: item.videoUrl,
                resources: [],
              })),
            })),
          }
        : null),
    [fallbackCourse, remoteCourse],
  );

  const lessons = useMemo(() => {
    if (!course) {
      return [] as Array<LearningLesson & { chapterTitle: string }>;
    }

    return course.chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({
        ...lesson,
        chapterTitle: chapter.title,
      })),
    );
  }, [course]);

  const lesson = lessons.find((item) => item.id === lessonId);

  if (isLoadingCurriculum && !course) {
    return (
      <div className="container-app space-y-4 py-6 md:py-10">
        <div className="card h-20 animate-pulse rounded-xl border border-border bg-black/30" />
        <div className="card h-64 animate-pulse rounded-xl border border-border bg-black/30" />
        <div className="card h-40 animate-pulse rounded-xl border border-border bg-black/30" />
      </div>
    );
  }

  if (curriculumForbidden) {
    return (
      <div className="container-app py-10 text-center text-sm">
        Bạn không có quyền truy cập khóa học này. Chỉ truy cập được khóa học đã
        đăng ký/mua.{" "}
        <Link href="/dashboard" className="text-accent">
          Về Khóa học của tôi
        </Link>
      </div>
    );
  }

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

  const completed = learningProgress[normalizedCourseSlug]?.length ?? 0;
  const hasPurchased =
    (user?.role === "student" &&
      remoteCourse?.slug?.trim().toLowerCase() === normalizedCourseSlug) ||
    purchasedCourseSlugs
      .map((item) => item.trim().toLowerCase())
      .includes(normalizedCourseSlug);
  const canViewLessonContent =
    user?.role === "admin" ||
    user?.role === "instructor" ||
    (user?.role === "student" && hasPurchased);
  const isLessonCompleted = learningProgress[normalizedCourseSlug]?.includes(
    lesson.id,
  );

  return (
    <div
      className={`min-h-screen overflow-x-hidden md:grid ${
        isSidebarOpen ? "md:grid-cols-[300px_1fr]" : "md:grid-cols-[0_1fr]"
      }`}
    >
      <aside
        className={`border-r border-border bg-black p-4 ${
          isSidebarOpen
            ? "block"
            : "hidden md:block md:w-0 md:overflow-hidden md:border-r-0 md:p-0"
        }`}
      >
        <div>
          <button
            type="button"
            className="btn-secondary px-3 py-1 text-xs"
            onClick={() => setIsSidebarOpen(false)}
          >
            Thu gọn tiến trình
          </button>
        </div>
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
                  const done = learningProgress[normalizedCourseSlug]?.includes(
                    item.id,
                  );
                  return (
                    <Link
                      key={item.id}
                      href={`/learn/${normalizedCourseSlug}/${item.id}`}
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

      <section className="min-w-0 space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <Link href="/courses" className="btn-secondary px-3 py-2 text-xs">
            ← Quay lại khóa học
          </Link>
          <button
            type="button"
            className="btn-secondary px-3 py-2 text-xs"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
          >
            {isSidebarOpen ? "Ẩn thanh tiến trình" : "Hiện thanh tiến trình"}
          </button>
        </div>

        {!canViewLessonContent && (
          <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-xs text-orange-200">
            Bạn đang ở chế độ xem trước. Chỉ xem được danh sách chương/bài học;
            video bài giảng và tài liệu sẽ mở sau khi mua khóa học.
          </div>
        )}

        <div>
          <p className="text-xs text-zinc-400">
            {lesson.type === "video" ? "Video bài giảng" : "Bài đọc"}
          </p>
          <h2 className="text-2xl font-black">{lesson.title}</h2>
          <p className="text-sm text-zinc-300">{lesson.summary}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-border px-2 py-1 text-zinc-300">
              Loại: {lesson.type === "video" ? "Video" : "Văn bản"}
            </span>
            <span className="rounded-full border border-border px-2 py-1 text-zinc-300">
              Thời lượng: {lesson.duration || "Đang cập nhật"}
            </span>
            <span className="rounded-full border border-border px-2 py-1 text-zinc-300">
              Tài liệu: {lesson.resources.length}
            </span>
          </div>
        </div>

        <article className="card space-y-3 p-4">
          <h3 className="text-lg font-bold">1) Video bài giảng</h3>
          {canViewLessonContent ? (
            <VideoPlayer lessonId={lesson.id} src={lesson.videoUrl} />
          ) : (
            <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-border bg-black/20 p-4 text-center text-sm text-zinc-400 md:h-96">
              Nội dung video đã khóa. Vui lòng mua khóa học để tiếp tục.
            </div>
          )}
        </article>

        <article className="card space-y-3 p-4">
          <h3 className="text-lg font-bold">2) Nội dung bài học</h3>
          {canViewLessonContent ? (
            lesson.content ? (
              <div
                className="wrap-break-word overflow-hidden rounded-lg border border-border bg-black/30 p-3"
                data-color-mode="dark"
              >
                <MarkdownPreview
                  source={lesson.content}
                  style={{
                    backgroundColor: "transparent",
                    color: "rgb(228 228 231)",
                    fontSize: "14px",
                    lineHeight: 1.75,
                  }}
                />
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                Bài học chưa có nội dung chi tiết.
              </p>
            )
          ) : (
            <p className="text-sm text-zinc-400">
              Nội dung bài học sẽ hiển thị sau khi bạn mua khóa học.
            </p>
          )}
        </article>

        <article className="card space-y-3 p-4">
          <h3 className="text-lg font-bold">3) Tài liệu bài học</h3>
          {!canViewLessonContent ? (
            <p className="text-sm text-zinc-400">
              Tài liệu chỉ mở khi bạn truy cập bài học thuộc khóa đã mua.
            </p>
          ) : lesson.resources.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Bài học này chưa có tài liệu đính kèm.
            </p>
          ) : (
            <div className="space-y-2">
              {lesson.resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-semibold text-zinc-100">
                      {resource.title}
                    </p>
                    {resource.description && (
                      <p className="text-xs text-zinc-400">
                        {resource.description}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500">{resource.fileType}</p>
                  </div>
                  {resource.signedUrl ? (
                    <a
                      href={resource.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary px-3 py-2 text-xs"
                    >
                      Mở tài liệu
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-500">
                      Không thể mở file
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </article>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn-primary px-4 py-2 text-sm"
            disabled={!canViewLessonContent}
            onClick={() => {
              if (isLessonCompleted) {
                markLessonInProgress(normalizedCourseSlug, lesson.id);
                showToast({
                  type: "info",
                  message: "Đã chuyển bài học về trạng thái đang học.",
                });
                return;
              }

              markLessonComplete(normalizedCourseSlug, lesson.id);
              showToast({
                type: "success",
                message: "Đã đánh dấu hoàn thành bài học.",
              });
            }}
          >
            {isLessonCompleted ? "Đánh dấu đang học" : "Hoàn thành bài học"}
          </button>
          {previous && (
            <Link
              href={`/learn/${normalizedCourseSlug}/${previous.id}`}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Bài trước
            </Link>
          )}
          {next && (
            <Link
              href={`/learn/${normalizedCourseSlug}/${next.id}`}
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
