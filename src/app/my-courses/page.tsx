"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProgressBar } from "@/components/common/progress-bar";
import { useAppState } from "@/contexts/app-context";

type OwnedCourse = {
  slug: string;
  title: string;
  shortDescription: string;
  thumbnail: string;
  totalLessons: number;
  firstLessonId: string | null;
};

export default function MyCoursesPage() {
  const { user, learningProgress } = useAppState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ownedCourses, setOwnedCourses] = useState<OwnedCourse[]>([]);

  useEffect(() => {
    if (user?.role !== "student") {
      setLoading(false);
      return;
    }

    let active = true;

    const loadOwnedCourses = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/student/my-content", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          if (active) {
            setError(result?.error ?? "Không tải được khóa học của bạn.");
          }
          return;
        }

        if (!active) return;

        setOwnedCourses((result?.courses ?? []) as OwnedCourse[]);
      } catch {
        if (active) {
          setError("Không thể kết nối API nội dung học viên.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadOwnedCourses();

    return () => {
      active = false;
    };
  }, [user?.role]);

  const coursesWithProgress = useMemo(
    () =>
      ownedCourses.map((course) => {
        const done =
          learningProgress[course.slug.trim().toLowerCase()]?.length ?? 0;
        return {
          ...course,
          done,
        };
      }),
    [learningProgress, ownedCourses],
  );

  if (!user) {
    return (
      <div className="container-app py-10">
        <div className="card p-5 text-center text-sm">
          Vui lòng đăng nhập để xem danh sách khóa học của bạn.{" "}
          <Link href="/login" className="text-accent">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "student") {
    return (
      <div className="container-app py-10">
        <div className="card p-5 text-center text-sm">
          Trang này chỉ dành cho học viên.
        </div>
      </div>
    );
  }

  return (
    <div className="container-app space-y-6 py-6 md:py-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-accent">
          My Courses
        </p>
        <h1 className="text-2xl font-black md:text-4xl">Khóa học của tôi</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Danh sách khóa học bạn đã sở hữu và tiến trình học tập tổng quan.
        </p>
      </div>

      {loading && <p className="text-sm text-zinc-400">Đang tải khóa học...</p>}

      {!loading && error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {!loading && !error && coursesWithProgress.length === 0 && (
        <div className="card p-5 text-sm text-zinc-400">
          Bạn chưa sở hữu khóa học nào.{" "}
          <Link href="/courses" className="text-accent">
            Xem khóa học
          </Link>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {coursesWithProgress.map((course) => {
          const canNavigate = Boolean(course.firstLessonId);
          const learnHref = canNavigate
            ? `/learn/${course.slug}/${course.firstLessonId}`
            : null;

          return (
            <article
              key={course.slug}
              className={`card relative overflow-hidden transition ${canNavigate ? "group cursor-pointer hover:-translate-y-1 hover:border-accent/50" : ""}`}
            >
              {learnHref && (
                <Link
                  href={learnHref}
                  className="absolute inset-0 z-10"
                  aria-label={`Vào học khóa ${course.title}`}
                />
              )}
              <div
                className={`aspect-video bg-center ${course.thumbnail?.trim() ? "bg-cover" : "bg-linear-to-br from-zinc-800 to-zinc-900"}`}
                style={
                  course.thumbnail?.trim()
                    ? { backgroundImage: `url(${course.thumbnail})` }
                    : undefined
                }
              />

              <div className="relative z-20 space-y-3 p-4">
                <div>
                  <h2 className="text-lg font-bold">{course.title}</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {course.shortDescription}
                  </p>
                </div>

                <ProgressBar value={course.done} total={course.totalLessons} />

                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    Hoàn thành: {course.done}/{course.totalLessons} bài học
                  </span>
                  {learnHref ? (
                    <Link
                      href={learnHref}
                      className="relative z-30 text-accent"
                    >
                      Vào học
                    </Link>
                  ) : (
                    <span>Chưa có bài học</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
