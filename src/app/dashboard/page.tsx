"use client";

import Link from "next/link";
import { courses, instructorNotices } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAppState } from "@/contexts/app-context";
import { ProgressBar } from "@/components/common/progress-bar";

export default function DashboardPage() {
  const { user, purchasedCourseSlugs, learningProgress, downloads, orders } =
    useAppState();

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

  const purchasedCourses = courses.filter((course) =>
    purchasedCourseSlugs.includes(course.slug),
  );

  return (
    <div className="container-app space-y-6 py-6 md:py-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-accent">
          Student Dashboard
        </p>
        <h1 className="text-2xl font-black md:text-4xl">
          Xin chào, {user.name}
        </h1>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-zinc-400">Khóa học đã mua</p>
          <p className="mt-1 text-2xl font-black">{purchasedCourses.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-zinc-400">Tài liệu đã tải</p>
          <p className="mt-1 text-2xl font-black">{downloads.length}</p>
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
              const done = learningProgress[course.slug]?.length ?? 0;
              const total = course.chapters.flatMap(
                (chapter) => chapter.lessons,
              ).length;
              const firstLesson = course.chapters[0]?.lessons[0]?.id;

              return (
                <div
                  key={course.slug}
                  className="rounded-xl border border-border p-3"
                >
                  <p className="font-semibold">{course.title}</p>
                  <ProgressBar value={done} total={total} className="mt-2" />
                  {firstLesson && (
                    <Link
                      href={`/learn/${course.slug}/${firstLesson}`}
                      className="mt-2 inline-block text-xs text-accent"
                    >
                      Tiếp tục học
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </article>

        <article className="card p-4">
          <h2 className="text-lg font-bold">Thông báo từ giảng viên</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {instructorNotices.map((notice) => (
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
          <h2 className="text-lg font-bold">Tài liệu đã tải</h2>
          <div className="mt-3 space-y-2 text-sm">
            {downloads.length === 0 && (
              <p className="text-zinc-400">Chưa tải tài liệu nào.</p>
            )}
            {downloads.map((item) => (
              <div
                key={`${item.id}-${item.downloadedAt}`}
                className="rounded-lg border border-border p-2"
              >
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-zinc-400">
                  {formatDate(item.downloadedAt)}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
