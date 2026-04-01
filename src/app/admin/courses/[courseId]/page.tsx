"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppState } from "@/contexts/app-context";
import {
  deleteCourse,
  getCourseById,
  getMediaPreviewUrl,
  updateCourse,
  uploadMediaWithPreview,
} from "@/components/admin/course-manager/api";

export default function AdminCourseDetailPage() {
  const { user } = useAppState();
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = params.courseId;

  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");
  const [thumbnailFileName, setThumbnailFileName] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "in-an" as "in-an" | "thiet-ke" | "kinh-doanh",
    level: "Cơ bản" as "Cơ bản" | "Nâng cao",
    price: 0,
    thumbnail: "",
    instructorName: "",
    instructorTitle: "",
    outcomesText: "",
  });

  const ensureLoadingVisible = async (startedAt: number) => {
    const elapsed = Date.now() - startedAt;
    if (elapsed < 600) {
      await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
    }
  };

  const loadCourse = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError("");

    try {
      const course = await getCourseById(courseId);
      if (!course) {
        setError("Không tìm thấy khóa học.");
        return;
      }

      const nextForm = {
        title: course.title,
        description: course.detailed_description ?? course.short_description,
        category: course.category,
        level: course.level,
        price: course.price,
        thumbnail: course.thumbnail,
        instructorName: course.instructor_name ?? "",
        instructorTitle: course.instructor_title ?? "",
        outcomesText: (course.outcomes ?? []).join("\n"),
      };

      setForm(nextForm);

      const thumbnailUrl = nextForm.thumbnail
        ? await getMediaPreviewUrl(nextForm.thumbnail)
        : "";

      setThumbnailPreviewUrl(thumbnailUrl);
      setThumbnailFileName(nextForm.thumbnail ? "Đã có thumbnail" : "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được khóa học.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadCourse();
  }, [user?.role, loadCourse]);

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-accent">
              Course
            </p>
            <h1 className="text-2xl font-black md:text-4xl">
              Chi tiết khóa học
            </h1>
          </div>
          <Link
            href="/admin/courses"
            className="btn-secondary px-3 py-2 text-xs"
          >
            ← Danh sách khóa học
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
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <div className="space-y-3 rounded-xl border border-border p-3">
                <p className="text-sm font-semibold">Thông tin khóa học</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-border bg-black px-3 py-2"
                    placeholder="Tên khóa học"
                  />
                  <input
                    value={form.price}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        price: Number(event.target.value) || 0,
                      }))
                    }
                    className="rounded-lg border border-border bg-black px-3 py-2"
                    placeholder="Giá"
                    type="number"
                  />
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        category: event.target.value as
                          | "in-an"
                          | "thiet-ke"
                          | "kinh-doanh",
                      }))
                    }
                    className="rounded-lg border border-border bg-black px-3 py-2"
                  >
                    <option value="in-an">In ấn</option>
                    <option value="thiet-ke">Thiết kế</option>
                    <option value="kinh-doanh">Kinh doanh</option>
                  </select>
                  <select
                    value={form.level}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        level: event.target.value as "Cơ bản" | "Nâng cao",
                      }))
                    }
                    className="rounded-lg border border-border bg-black px-3 py-2"
                  >
                    <option value="Cơ bản">Cơ bản</option>
                    <option value="Nâng cao">Nâng cao</option>
                  </select>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={4}
                    className="rounded-lg border border-border bg-black px-3 py-2 md:col-span-2"
                    placeholder="Mô tả khóa học"
                  />
                  <input
                    value={form.instructorName}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        instructorName: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-border bg-black px-3 py-2"
                    placeholder="Tên giảng viên"
                  />
                  <input
                    value={form.instructorTitle}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        instructorTitle: event.target.value,
                      }))
                    }
                    className="rounded-lg border border-border bg-black px-3 py-2"
                    placeholder="Chức danh giảng viên"
                  />
                  <textarea
                    value={form.outcomesText}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        outcomesText: event.target.value,
                      }))
                    }
                    rows={5}
                    className="rounded-lg border border-border bg-black px-3 py-2 md:col-span-2"
                    placeholder={
                      "Bạn sẽ đạt được (mỗi dòng một ý)\nVí dụ:\nNắm quy trình in áo\nTự setup xưởng"
                    }
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border p-3">
                <p className="text-sm font-semibold">Media upload & preview</p>

                <div className="rounded-lg border border-border px-3 py-2 text-sm text-zinc-300">
                  <p>Upload thumbnail (ảnh)</p>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (event) => {
                      const inputElement = event.currentTarget;
                      const file = inputElement.files?.[0];
                      if (!file) return;

                      const startedAt = Date.now();
                      setUploadingThumbnail(true);
                      setError("");
                      setSuccess("Đang upload thumbnail...");
                      setThumbnailFileName(file.name);
                      try {
                        const { filePath, previewUrl } =
                          await uploadMediaWithPreview(file, "course-images");
                        setForm((prev) => ({ ...prev, thumbnail: filePath }));
                        setThumbnailPreviewUrl(
                          previewUrl || URL.createObjectURL(file),
                        );
                        setSuccess("Đã upload thumbnail.");
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Không upload được thumbnail.",
                        );
                      } finally {
                        await ensureLoadingVisible(startedAt);
                        setUploadingThumbnail(false);
                        inputElement.value = "";
                      }
                    }}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-secondary px-3 py-1 text-xs"
                      onClick={() => thumbnailInputRef.current?.click()}
                      disabled={submitting || uploadingThumbnail}
                    >
                      {uploadingThumbnail ? "Đang upload..." : "Chọn ảnh"}
                    </button>
                    <p className="truncate text-xs text-zinc-400">
                      {thumbnailFileName || "Chưa chọn file"}
                    </p>
                  </div>
                </div>

                {uploadingThumbnail && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-black/20 px-3 py-2 text-xs text-zinc-300">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
                    Đang upload ảnh thumbnail...
                  </div>
                )}

                {thumbnailPreviewUrl && (
                  <article className="rounded-lg border border-border bg-black/30 p-2">
                    <p className="mb-2 text-xs text-zinc-400">
                      Thumbnail preview
                    </p>
                    <img
                      src={thumbnailPreviewUrl}
                      alt="thumbnail preview"
                      className="h-40 w-full rounded-lg object-cover"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        className="btn-secondary px-3 py-1 text-xs"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, thumbnail: "" }));
                          setThumbnailPreviewUrl("");
                          setThumbnailFileName("");
                          setSuccess("Đã xóa thumbnail đã upload khỏi form.");
                        }}
                        disabled={submitting || uploadingThumbnail}
                      >
                        Xóa thumbnail
                      </button>
                    </div>
                  </article>
                )}
              </div>
            </div>

            {confirmDeleteCourse && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-200">
                  Xác nhận xóa khóa học? Toàn bộ chương, bài học và tài liệu
                  liên quan sẽ bị xóa.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="btn-secondary px-3 py-2 text-sm"
                    type="button"
                    disabled={submitting}
                    onClick={() => setConfirmDeleteCourse(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="btn-secondary px-3 py-2 text-sm"
                    type="button"
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      setError("");
                      setSuccess("");
                      try {
                        await deleteCourse(courseId);
                        router.push("/admin/courses");
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Không xóa được khóa học.",
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
                onClick={() => setConfirmDeleteCourse(true)}
              >
                Xóa khóa học
              </button>

              <div className="flex gap-2">
                <Link
                  href={`/admin/courses/${courseId}/chapters`}
                  className="btn-secondary px-3 py-2 text-sm"
                >
                  Danh sách chương học
                </Link>
                <button
                  className="btn-primary px-4 py-2 text-sm"
                  disabled={submitting || uploadingThumbnail}
                  onClick={async () => {
                    setSubmitting(true);
                    setError("");
                    setSuccess("");
                    try {
                      await updateCourse(courseId, {
                        title: form.title,
                        description: form.description,
                        category: form.category,
                        level: form.level,
                        price: form.price,
                        thumbnail: form.thumbnail,
                        instructorName: form.instructorName,
                        instructorTitle: form.instructorTitle,
                        outcomes: form.outcomesText
                          .split("\n")
                          .map((item) => item.trim().replace(/^[-•]\s*/, ""))
                          .filter(Boolean),
                      });
                      setSuccess("Đã cập nhật khóa học.");
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Không cập nhật được khóa học.",
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  Lưu khóa học
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
