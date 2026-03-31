"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAppState } from "@/contexts/app-context";
import {
  createChapter,
  getCourseById,
  getStructure,
} from "@/components/admin/course-manager/api";
import type { ChapterItem } from "@/components/admin/course-manager/types";

export default function AdminChapterListPage() {
  const { user } = useAppState();
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const [courseTitle, setCourseTitle] = useState("");
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError("");
    try {
      const [course, chapterRows] = await Promise.all([
        getCourseById(courseId),
        getStructure(courseId, { includeResources: false }),
      ]);
      setCourseTitle(course?.title ?? "Không xác định");
      setChapters(chapterRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadData();
  }, [user?.role, loadData]);

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
    <div className="container-app space-y-4 py-6 md:py-10">
      <div className="card p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-accent">
              Chapters
            </p>
            <h1 className="text-2xl font-black md:text-4xl">
              Danh sách chương học
            </h1>
            <p className="mt-1 text-sm text-zinc-400">{courseTitle}</p>
          </div>
          <Link
            href={`/admin/courses/${courseId}`}
            className="btn-secondary px-3 py-2 text-xs"
          >
            ← Chi tiết khóa học
          </Link>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <section className="card space-y-3 p-4 md:p-5">
        <h2 className="text-lg font-bold">Tạo chương mới</h2>
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            className="rounded-lg border border-border bg-black px-3 py-2"
            placeholder="Tên chương"
            value={newChapterTitle}
            onChange={(event) => setNewChapterTitle(event.target.value)}
          />
          <button
            className="btn-primary px-4 py-2 text-sm"
            disabled={submitting || !newChapterTitle.trim()}
            onClick={async () => {
              setSubmitting(true);
              setError("");
              try {
                await createChapter(courseId, newChapterTitle);
                setNewChapterTitle("");
                await loadData();
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Không tạo được chương.",
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Thêm chương
          </button>
        </div>
      </section>

      <section className="card space-y-3 p-4 md:p-5">
        <h2 className="text-lg font-bold">Các chương hiện có</h2>
        {loading && <p className="text-sm text-zinc-400">Đang tải...</p>}
        <div className="space-y-2">
          {chapters.map((chapter) => (
            <article
              key={chapter.id}
              className="rounded-lg border border-border p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {chapter.title}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {chapter.lessons.length} bài học
                  </p>
                </div>
                <Link
                  href={`/admin/courses/${courseId}/chapters/${chapter.id}`}
                  className="btn-secondary px-3 py-2 text-xs"
                >
                  Chi tiết chương học
                </Link>
              </div>
            </article>
          ))}

          {!loading && chapters.length === 0 && (
            <p className="text-sm text-zinc-500">Chưa có chương học.</p>
          )}
        </div>
      </section>
    </div>
  );
}
