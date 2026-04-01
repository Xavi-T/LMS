"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/contexts/app-context";
import {
  createCourse,
  getCourses,
  normalizeCourseSlug,
} from "@/components/admin/course-manager/api";
import type { ManagedCourse } from "@/components/admin/course-manager/types";

export default function AdminCoursesPage() {
  const { user } = useAppState();
  const [courses, setCourses] = useState<ManagedCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newCourse, setNewCourse] = useState({
    title: "",
    slug: "",
    description: "",
    price: "",
  });

  const existingSlugs = useMemo(
    () => new Set(courses.map((course) => course.slug.trim().toLowerCase())),
    [courses],
  );

  const makeUniqueSlug = (title: string) => {
    const baseSlug = normalizeCourseSlug(title);
    if (!baseSlug) {
      return "";
    }

    if (!existingSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let index = 2;
    let nextSlug = `${baseSlug}-${index}`;
    while (existingSlugs.has(nextSlug)) {
      index += 1;
      nextSlug = `${baseSlug}-${index}`;
    }

    return nextSlug;
  };

  const isCreateDisabled = useMemo(
    () =>
      submitting ||
      !newCourse.title.trim() ||
      !newCourse.slug.trim() ||
      !newCourse.description.trim() ||
      !newCourse.price.trim(),
    [newCourse, submitting],
  );

  const loadCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await getCourses();
      setCourses(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được khóa học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadCourses();
  }, [user?.role]);

  if (!user || user.role !== "admin") {
    return (
      <div className="container-app py-10">
        <div className="card p-5 text-center text-sm">
          Khu vực quản trị chỉ dành cho Admin.
        </div>
      </div>
    );
  }

  return (
    <div className="container-app space-y-5 py-6 md:py-10">
      <div className="card p-4 md:p-5">
        <p className="text-xs uppercase tracking-wider text-accent">
          Course Manager
        </p>
        <h1 className="text-2xl font-black md:text-4xl">Danh sách khóa học</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Luồng quản lý mới: Khóa học → Chương học → Bài học.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {success}
        </p>
      )}

      <section className="card space-y-3 p-4 md:p-5">
        <h2 className="text-lg font-bold">Tạo khóa học</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            className="rounded-lg border border-border bg-black px-3 py-2"
            placeholder="Tên khóa học"
            value={newCourse.title}
            onChange={(event) => {
              const title = event.target.value;
              setNewCourse((prev) => ({
                ...prev,
                title,
                slug: makeUniqueSlug(title),
              }));
            }}
          />
          <input
            className="rounded-lg border border-border bg-black px-3 py-2"
            placeholder="Slug khóa học (tự sinh)"
            value={newCourse.slug}
            readOnly
          />
          <textarea
            className="rounded-lg border border-border bg-black px-3 py-2"
            placeholder="Mô tả khóa học"
            rows={3}
            value={newCourse.description}
            onChange={(event) =>
              setNewCourse((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
          />
          <input
            className="rounded-lg border border-border bg-black px-3 py-2"
            placeholder="Giá"
            inputMode="numeric"
            value={newCourse.price}
            onChange={(event) =>
              setNewCourse((prev) => ({
                ...prev,
                price: event.target.value.replace(/\D+/g, ""),
              }))
            }
          />
        </div>
        <div className="flex justify-end">
          <button
            className="btn-primary px-4 py-2 text-sm"
            disabled={isCreateDisabled}
            onClick={async () => {
              setSubmitting(true);
              setError("");
              setSuccess("");
              try {
                await createCourse({
                  title: newCourse.title,
                  slug: newCourse.slug,
                  description: newCourse.description,
                  price: Number(newCourse.price || "0"),
                });
                setSuccess("Đã tạo khóa học.");
                setNewCourse({
                  title: "",
                  slug: "",
                  description: "",
                  price: "",
                });
                await loadCourses();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Không tạo được khóa học.",
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Tạo khóa học
          </button>
        </div>
      </section>

      <section className="card space-y-3 p-4 md:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Khóa học hiện có</h2>
          <button
            className="btn-secondary px-3 py-1 text-xs"
            onClick={loadCourses}
            disabled={loading}
          >
            Tải lại
          </button>
        </div>

        {loading && <p className="text-sm text-zinc-400">Đang tải...</p>}

        <div className="space-y-2">
          {courses.map((course) => (
            <article
              key={course.id}
              className="rounded-lg border border-border p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {course.title}
                  </p>
                  <p className="text-xs text-zinc-400">/{course.slug}</p>
                </div>
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="btn-secondary px-3 py-2 text-xs"
                >
                  Chi tiết khóa học
                </Link>
              </div>
            </article>
          ))}

          {!loading && courses.length === 0 && (
            <p className="text-sm text-zinc-500">Chưa có khóa học.</p>
          )}
        </div>
      </section>
    </div>
  );
}
