"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAppState } from "@/contexts/app-context";
import {
  deleteChapter,
  getChapterById,
  updateChapter,
} from "@/components/admin/course-manager/api";

export default function AdminChapterDetailPage() {
  const { user } = useAppState();
  const params = useParams<{ courseId: string; chapterId: string }>();
  const router = useRouter();
  const courseId = params.courseId;
  const chapterId = params.chapterId;

  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteChapter, setConfirmDeleteChapter] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const chapter = await getChapterById(courseId, chapterId);
      if (!chapter) {
        setError("Không tìm thấy chương học.");
        return;
      }
      setTitle(chapter.title);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được chương học.",
      );
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
          <h1 className="text-2xl font-black md:text-4xl">
            Chi tiết chương học
          </h1>
          <Link
            href={`/admin/courses/${courseId}/chapters`}
            className="btn-secondary px-3 py-2 text-xs"
          >
            ← Danh sách chương học
          </Link>
        </div>
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
        {loading ? (
          <p className="text-sm text-zinc-400">Đang tải...</p>
        ) : (
          <>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-border bg-black px-3 py-2"
              placeholder="Tên chương học"
            />

            {confirmDeleteChapter && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-200">
                  Xác nhận xóa chương này? Toàn bộ bài học và tài liệu liên quan
                  sẽ bị xóa.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-sm"
                    onClick={() => setConfirmDeleteChapter(false)}
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-sm"
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      setError("");
                      setSuccess("");
                      try {
                        await deleteChapter(chapterId);
                        router.push(`/admin/courses/${courseId}/chapters`);
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Không xóa được chương.",
                        );
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  >
                    Xác nhận xóa
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-between gap-2">
              <button
                className="btn-secondary px-3 py-2 text-sm"
                disabled={submitting}
                onClick={() => setConfirmDeleteChapter(true)}
              >
                Xóa chương
              </button>

              <div className="flex gap-2">
                <Link
                  href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons`}
                  className="btn-secondary px-3 py-2 text-sm"
                >
                  Danh sách bài học
                </Link>
                <button
                  className="btn-primary px-4 py-2 text-sm"
                  disabled={submitting || !title.trim()}
                  onClick={async () => {
                    setSubmitting(true);
                    setError("");
                    setSuccess("");
                    try {
                      await updateChapter(chapterId, title);
                      setSuccess("Đã cập nhật chương học.");
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Không lưu được chương.",
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  Lưu chương
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
