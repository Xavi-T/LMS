"use client";

import { useMemo, useState } from "react";
import { courses } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { useAppState } from "@/contexts/app-context";

type Tab = "courses" | "students" | "orders" | "content" | "stats";

const tabs: { id: Tab; label: string }[] = [
  { id: "courses", label: "Khóa học" },
  { id: "students", label: "Học viên" },
  { id: "orders", label: "Đơn hàng" },
  { id: "content", label: "Banner/Nội dung" },
  { id: "stats", label: "Thống kê" },
];

export default function AdminPage() {
  const { user, orders, purchasedCourseSlugs } = useAppState();
  const [tab, setTab] = useState<Tab>("courses");

  const revenue = useMemo(
    () =>
      orders
        .filter((item) => item.status === "paid")
        .reduce((sum, item) => sum + item.amount, 0),
    [orders],
  );

  if (!user || user.role !== "admin") {
    return (
      <div className="container-app py-10">
        <div className="card p-5 text-center text-sm">
          Khu vực quản trị chỉ dành cho Admin. Hãy đăng nhập với vai trò admin
          để thao tác.
        </div>
      </div>
    );
  }

  return (
    <div className="container-app space-y-5 py-6 md:py-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-accent">
          Admin Panel
        </p>
        <h1 className="text-2xl font-black md:text-4xl">
          Quản trị LMS SportPrint
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-2 text-sm ${tab === item.id ? "bg-accent font-bold text-black" : "border border-border"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "courses" && (
        <section className="card p-4">
          <h2 className="text-lg font-bold">
            Quản lý khóa học / chương / bài học
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            {courses.map((course) => (
              <div
                key={course.slug}
                className="rounded-lg border border-border p-3"
              >
                <p className="font-semibold">{course.title}</p>
                <p className="text-xs text-zinc-400">
                  {course.chapters.length} chương ·{" "}
                  {course.chapters.flatMap((chapter) => chapter.lessons).length}{" "}
                  bài học
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Kéo-thả (mock): dùng nút ↑ ↓ để đổi thứ tự sau này tích hợp
                  DnD library.
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "students" && (
        <section className="card p-4 text-sm">
          <h2 className="text-lg font-bold">Quản lý học viên</h2>
          <p className="mt-2 text-zinc-300">
            Tổng số khóa đã kích hoạt: {purchasedCourseSlugs.length}
          </p>
          <p className="text-zinc-400">
            MVP mock: danh sách user sẽ lấy từ API/Auth service ở bản
            production.
          </p>
        </section>
      )}

      {tab === "orders" && (
        <section className="card p-4 text-sm">
          <h2 className="text-lg font-bold">Quản lý đơn hàng</h2>
          <div className="mt-3 space-y-2">
            {orders.length === 0 && (
              <p className="text-zinc-400">Chưa có đơn hàng.</p>
            )}
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-border p-2"
              >
                <p className="font-semibold">{order.id}</p>
                <p className="text-xs text-zinc-400">
                  Course: {order.courseSlug}
                </p>
                <p className="text-xs">
                  {formatCurrency(order.amount)} · {order.status}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "content" && (
        <section className="card p-4 text-sm">
          <h2 className="text-lg font-bold">
            Quản lý banner / nội dung website
          </h2>
          <p className="mt-2 text-zinc-300">
            MVP: cấu hình nội dung đang từ dữ liệu mock.
          </p>
          <p className="text-zinc-400">
            Production: tách CMS module + upload media.
          </p>
        </section>
      )}

      {tab === "stats" && (
        <section className="grid gap-4 md:grid-cols-3">
          <article className="card p-4">
            <p className="text-xs text-zinc-400">Doanh thu đã thanh toán</p>
            <p className="mt-1 text-2xl font-black text-accent">
              {formatCurrency(revenue)}
            </p>
          </article>
          <article className="card p-4">
            <p className="text-xs text-zinc-400">Số khóa học</p>
            <p className="mt-1 text-2xl font-black">{courses.length}</p>
          </article>
          <article className="card p-4">
            <p className="text-xs text-zinc-400">Số đơn hàng</p>
            <p className="mt-1 text-2xl font-black">{orders.length}</p>
          </article>
        </section>
      )}
    </div>
  );
}
