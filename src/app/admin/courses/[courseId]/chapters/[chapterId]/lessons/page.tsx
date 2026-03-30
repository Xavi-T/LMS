"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAppState } from "@/contexts/app-context";
import {
  createLesson,
  deleteLesson,
  getChapterById,
} from "@/components/admin/course-manager/api";
import type { LessonItem } from "@/components/admin/course-manager/types";

export default function AdminLessonListPage() {
  const { user } = useAppState();
  const params = useParams<{ courseId: string; chapterId: string }>();
  const courseId = params.courseId;
  const chapterId = params.chapterId;

  const [chapterTitle, setChapterTitle] = useState("");
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteLessonId, setConfirmDeleteLessonId] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const chapter = await getChapterById(courseId, chapterId);
      if (!chapter) {
        setError("Không tìm thấy chương học.");
        return;
      }
      setChapterTitle(chapter.title);
      setLessons(chapter.lessons);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được bài học.");
    } finally {
      setLoading(false);
    }
  }, [chapterId, courseId]);

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
            <h1 className="text-2xl font-black md:text-4xl">
              Danh sách bài học
            </h1>
            <p className="mt-1 text-sm text-zinc-400">{chapterTitle}</p>
          </div>
          <Link
            href={`/admin/courses/${courseId}/chapters/${chapterId}`}
            className="btn-secondary px-3 py-2 text-xs"
          >
            ← Chi tiết chương học
          </Link>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <section className="card space-y-3 p-4 md:p-5">
        <h2 className="text-lg font-bold">Tạo bài học mới</h2>
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            className="rounded-lg border border-border bg-black px-3 py-2"
            value={newLessonTitle}
            onChange={(event) => setNewLessonTitle(event.target.value)}
            placeholder="Tên bài học"
          />
          <button
            className="btn-primary px-4 py-2 text-sm"
            disabled={submitting || !newLessonTitle.trim()}
            onClick={async () => {
              setSubmitting(true);
              setError("");
              try {
                await createLesson(chapterId, newLessonTitle);
                setNewLessonTitle("");
                await loadData();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Không tạo được bài học.",
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Thêm bài học
          </button>
        </div>
      </section>

      <section className="card space-y-3 p-4 md:p-5">
        <h2 className="text-lg font-bold">Bài học hiện có</h2>
        {loading && <p className="text-sm text-zinc-400">Đang tải...</p>}

        <div className="space-y-2">
          {lessons.map((lesson) => (
            <article
              key={lesson.id}
              className="rounded-lg border border-border p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {lesson.title}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {lesson.summary || "Chưa có mô tả"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`}
                    className="btn-secondary px-3 py-2 text-xs"
                  >
                    Chi tiết bài học
                  </Link>
                  {confirmDeleteLessonId === lesson.id ? (
                    <>
                      <button
                        className="btn-secondary px-3 py-2 text-xs"
                        disabled={submitting}
                        type="button"
                        onClick={() => setConfirmDeleteLessonId("")}
                      >
                        Hủy
                      </button>
                      <button
                        className="btn-secondary px-3 py-2 text-xs"
                        disabled={submitting}
                        type="button"
                        onClick={async () => {
                          setSubmitting(true);
                          setError("");
                          try {
                            await deleteLesson(lesson.id);
                            setConfirmDeleteLessonId("");
                            await loadData();
                          } catch (err) {
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Không xóa được bài học.",
                            );
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        Xác nhận
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-secondary px-3 py-2 text-xs"
                      disabled={submitting}
                      type="button"
                      onClick={() => setConfirmDeleteLessonId(lesson.id)}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {!loading && lessons.length === 0 && (
            <p className="text-sm text-zinc-500">Chưa có bài học.</p>
          )}
        </div>
      </section>
    </div>
  );
}
