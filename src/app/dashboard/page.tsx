"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { courses, instructorNotices } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAppState } from "@/contexts/app-context";
import { ProgressBar } from "@/components/common/progress-bar";

type OwnedCourse = {
  slug: string;
  title: string;
  shortDescription: string;
  price: number;
  totalLessons: number;
  firstLessonId: string | null;
};

type OwnedResource = {
  id: string;
  title: string;
  fileType: string;
  courseSlug: string;
};

export default function DashboardPage() {
  const { user, purchasedCourseSlugs, learningProgress, downloads, orders } =
    useAppState();
  const [ownedCourses, setOwnedCourses] = useState<OwnedCourse[]>([]);
  const [ownedResources, setOwnedResources] = useState<OwnedResource[]>([]);

  useEffect(() => {
    if (!user || user.role !== "student") {
      return;
    }

    let active = true;

    const loadOwnedContent = async () => {
      try {
        const response = await fetch("/api/student/my-content", {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) {
          return;
        }

        if (!active) return;
        setOwnedCourses((result?.courses ?? []) as OwnedCourse[]);
        setOwnedResources((result?.resources ?? []) as OwnedResource[]);
      } catch {}
    };

    void loadOwnedContent();

    return () => {
      active = false;
    };
  }, [user]);

  const purchasedCoursesFromMock = useMemo(
    () =>
      courses
        .filter((course) => purchasedCourseSlugs.includes(course.slug))
        .map((course) => ({
          slug: course.slug,
          title: course.title,
          shortDescription: course.shortDescription,
          price: course.price,
          totalLessons: course.chapters.flatMap((chapter) => chapter.lessons)
            .length,
          firstLessonId: course.chapters[0]?.lessons[0]?.id ?? null,
        })),
    [purchasedCourseSlugs],
  );

  const purchasedCourses =
    user?.role === "student" && ownedCourses.length > 0
      ? ownedCourses
      : purchasedCoursesFromMock;

  const instructorNoticeList =
    user?.role === "student"
      ? [
          "Bạn đã đăng nhập thành công. Ưu tiên học theo thứ tự bài để theo dõi tiến độ chính xác.",
          "Các tài liệu liên quan khóa học đã mua có thể mở tại mục Tài liệu của tôi.",
        ]
      : instructorNotices;

  if (!user) {
    return (
      <div className="container-app py-10">
        <div className="card p-5 text-center">
          <h1 className="text-xl font-bold">Dashboard học viên</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Vui lòng đăng nhập để xem khóa học đã mua, tiến độ và giao dịch.
          </p>
          <Link
            href="/login"
            className="btn-primary mt-4 inline-block px-4 py-2 text-sm"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app space-y-6 py-6 md:py-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-accent">
          KHÓA HỌC CỦA TÔI
        </p>
        <h1 className="text-2xl font-black md:text-4xl">
          Xin chào, {user.name}
        </h1>
        {user.role === "student" && (
          <p className="mt-2 text-sm text-zinc-400">
            Truy cập nhanh khóa học đã mua, mở video bài giảng và tài liệu liên
            quan ngay trong từng bài học.
          </p>
        )}
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-zinc-400">Khóa học đã mua</p>
          <p className="mt-1 text-2xl font-black">{purchasedCourses.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-zinc-400">Tài liệu đã tải</p>
          <p className="mt-1 text-2xl font-black">
            {user.role === "student" ? ownedResources.length : downloads.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-zinc-400">Giao dịch</p>
          <p className="mt-1 text-2xl font-black">{orders.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-zinc-400">Vai trò</p>
          <p className="mt-1 text-2xl font-black uppercase">{user.role}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card p-4">
          <h2 className="text-lg font-bold">Tiến độ học tập</h2>
          <div className="mt-3 space-y-3">
            {purchasedCourses.length === 0 && (
              <p className="text-sm text-zinc-400">Chưa có khóa học nào.</p>
            )}
            {purchasedCourses.map((course) => {
              const done =
                learningProgress[course.slug.trim().toLowerCase()]?.length ?? 0;
              const total = course.totalLessons;
              const firstLesson = course.firstLessonId;

              return (
                <div
                  key={course.slug}
                  className="rounded-xl border border-border p-3"
                >
                  <p className="font-semibold">{course.title}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {course.shortDescription}
                  </p>
                  <ProgressBar value={done} total={total} className="mt-2" />
                  <div className="mt-2 flex flex-wrap gap-3">
                    {firstLesson && (
                      <Link
                        href={`/learn/${course.slug}/${firstLesson}`}
                        className="inline-block text-xs text-accent"
                      >
                        Vào khóa học
                      </Link>
                    )}
                    {firstLesson && (
                      <Link
                        href={`/learn/${course.slug}/${firstLesson}`}
                        className="inline-block text-xs text-zinc-300 hover:text-accent"
                      >
                        Xem tài liệu trong bài học
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-bold">Thông báo từ giảng viên</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {instructorNoticeList.map((notice) => (
              <li key={notice} className="rounded-lg border border-border p-2">
                • {notice}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card p-4">
          <h2 className="text-lg font-bold">Lịch sử giao dịch</h2>
          <div className="mt-3 space-y-2 text-sm">
            {orders.length === 0 && (
              <p className="text-zinc-400">Chưa có giao dịch.</p>
            )}
            {orders.map((order) => {
              const course = courses.find(
                (item) => item.slug === order.courseSlug,
              );
              return (
                <div
                  key={order.id}
                  className="rounded-lg border border-border p-2"
                >
                  <p className="font-semibold">
                    {course?.title ?? order.courseSlug}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {formatDate(order.createdAt)}
                  </p>
                  <p className="text-xs">
                    {formatCurrency(order.amount)} · {order.status}
                  </p>
                </div>
              );
            })}
          </div>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-bold">Tài liệu của tôi</h2>
          <div className="mt-3 space-y-2 text-sm">
            {user.role === "student" && ownedResources.length === 0 && (
              <p className="text-zinc-400">Chưa có tài liệu cho khóa đã mua.</p>
            )}
            {user.role !== "student" && downloads.length === 0 && (
              <p className="text-zinc-400">Chưa tải tài liệu nào.</p>
            )}
            {(user.role === "student" ? ownedResources : downloads).map(
              (item) => (
                <div
                  key={
                    "downloadedAt" in item
                      ? `${item.id}-${item.downloadedAt}`
                      : item.id
                  }
                  className="rounded-lg border border-border p-2"
                >
                  <p className="font-semibold">{item.title}</p>
                  {"downloadedAt" in item ? (
                    <p className="text-xs text-zinc-400">
                      {formatDate(item.downloadedAt)}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400">
                      {item.courseSlug} · {item.fileType}
                    </p>
                  )}
                </div>
              ),
            )}
            {user.role === "student" && ownedResources.length > 0 && (
              <p className="text-xs text-zinc-500">
                Tài liệu được mở trực tiếp trong từng bài học thuộc khóa đã mua.
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
