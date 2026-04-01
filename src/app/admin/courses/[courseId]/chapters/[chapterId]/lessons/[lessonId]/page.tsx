"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "@/contexts/app-context";
import {
  createResource,
  deleteLesson,
  deleteResource,
  getMediaPreviewUrl,
  getLessonById,
  getResources,
  inferFileType,
  isImageFileType,
  updateLesson,
  uploadMedia,
} from "@/components/admin/course-manager/api";
import type { ManagedResource } from "@/components/admin/course-manager/types";

const ModernMarkdownEditor = dynamic(
  async () => (await import("@uiw/react-md-editor")).default,
  { ssr: false },
);

export default function AdminLessonDetailPage() {
  const { user, showToast } = useAppState();
  const params = useParams<{
    courseId: string;
    chapterId: string;
    lessonId: string;
  }>();
  const router = useRouter();

  const courseId = params.courseId;
  const chapterId = params.chapterId;
  const lessonId = params.lessonId;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [videoPath, setVideoPath] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState(false);
  const [isDragOverResource, setIsDragOverResource] = useState(false);
  const [insertingResourceId, setInsertingResourceId] = useState<string | null>(
    null,
  );
  const resourceFileInputRef = useRef<HTMLInputElement | null>(null);

  const [resources, setResources] = useState<ManagedResource[]>([]);

  const lessonResources = useMemo(
    () => resources.filter((item) => item.lesson_id === lessonId),
    [resources, lessonId],
  );

  const saveDisabledReason = useMemo(() => {
    if (savingLesson) return "Đang lưu bài học...";
    if (uploadingResource) return "Đang upload tài liệu, vui lòng chờ.";
    if (!title.trim()) return "Vui lòng nhập tên bài học.";
    return "";
  }, [savingLesson, title, uploadingResource]);

  const isBunnyPlayerUrl = (value: string) =>
    /^https:\/\/player\.mediadelivery\.net\/play\/\d+\/[a-z0-9-]+(?:\?.*)?$/i.test(
      value.trim(),
    );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [lesson, allResources] = await Promise.all([
        getLessonById(courseId, chapterId, lessonId),
        getResources({ lessonId }),
      ]);

      if (!lesson) {
        setError("Không tìm thấy bài học.");
        return;
      }

      setTitle(lesson.title);
      setSummary(lesson.summary ?? "");
      setContent(lesson.content ?? "");
      const nextVideoPath = lesson.video_url ?? "";
      setVideoPath(nextVideoPath);
      setVideoPreviewUrl(
        nextVideoPath ? await getMediaPreviewUrl(nextVideoPath) : "",
      );
      setResources(allResources);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được bài học.");
    } finally {
      setLoading(false);
    }
  }, [chapterId, courseId, lessonId]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadData();
  }, [user?.role, loadData]);

  const insertIntoEditor = (insertion: string) => {
    setContent((prev) => `${prev}\n${insertion}`.trim());
  };

  const ensureLoadingVisible = async (startedAt: number) => {
    const elapsed = Date.now() - startedAt;
    if (elapsed < 600) {
      await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
    }
  };

  const buildResourceTitle = (fileName: string) =>
    fileName.replace(/\.[^.]+$/, "").trim() || fileName;

  const uploadResourceFile = useCallback(
    async (file: File) => {
      const startedAt = Date.now();
      setUploadingResource(true);
      setError("");
      setSuccess("Đang upload tài liệu...");
      try {
        const filePath = await uploadMedia(file, "course-resource-files");
        const inferredFileType = inferFileType(file.name);
        const previewUrl = file.type.startsWith("image/")
          ? await getMediaPreviewUrl(filePath)
          : "";

        const resource = await createResource({
          lessonId,
          title: buildResourceTitle(file.name),
          fileType: inferredFileType,
          previewImage: previewUrl || undefined,
          storagePath: filePath,
        });

        setResources((prev) => [...prev, resource]);
        setSuccess("Đã upload và thêm tài liệu khóa học.");
        showToast({
          type: "success",
          message: "Đã upload và thêm tài liệu vào danh sách.",
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload tài liệu thất bại.";
        setError(message);
        showToast({ type: "error", message });
      } finally {
        await ensureLoadingVisible(startedAt);
        setUploadingResource(false);
      }
    },
    [lessonId, showToast],
  );

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
          <h1 className="text-2xl font-black md:text-4xl">Chi tiết bài học</h1>
          <Link
            href={`/admin/courses/${courseId}/chapters/${chapterId}/lessons`}
            className="btn-secondary px-3 py-2 text-xs"
          >
            ← Danh sách bài học
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
        <h2 className="text-lg font-bold">1) URL video Bunny (tuỳ chọn)</h2>
        <div className="space-y-2 rounded-lg border border-border p-3">
          <label className="text-sm text-zinc-300">URL Bunny player</label>
          <input
            value={videoPath}
            onChange={(event) => {
              const nextValue = event.target.value;
              setVideoPath(nextValue);
              setVideoPreviewUrl(nextValue.trim());
            }}
            className="w-full rounded-lg border border-border bg-black px-3 py-2 text-sm"
            placeholder="https://player.mediadelivery.net/play/628811/a585f839-e3d2-4ce6-b4b9-08d979b71440"
          />
          <p className="text-xs text-zinc-500">
            Chỉ lưu URL Bunny player, không upload file video lên hệ thống.
          </p>
        </div>

        {videoPath ? (
          <article className="space-y-2 rounded-xl border border-border bg-black/30 p-3">
            <p className="truncate text-xs text-zinc-500">Video: {videoPath}</p>
            {isBunnyPlayerUrl(videoPath) ? (
              <div className="overflow-hidden rounded-xl border border-border bg-black">
                <iframe
                  src={videoPreviewUrl || videoPath}
                  loading="lazy"
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              </div>
            ) : (
              <p className="text-xs text-amber-300">
                URL chưa đúng định dạng Bunny player.
              </p>
            )}
          </article>
        ) : (
          <p className="text-xs text-zinc-500">
            Chưa có video. Bạn vẫn có thể lưu bài học trước.
          </p>
        )}
      </section>

      <section className="card space-y-3 p-4 md:p-5">
        <h2 className="text-lg font-bold">
          2) Nội dung bài học (Markdown Editor)
        </h2>
        {loading ? (
          <p className="text-sm text-zinc-400">Đang tải...</p>
        ) : (
          <>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-border bg-black px-3 py-2"
              placeholder="Tên bài học"
            />

            <div
              className="rounded-lg border border-border p-2"
              data-color-mode="dark"
            >
              <ModernMarkdownEditor
                value={content}
                onChange={(value) => setContent(value ?? "")}
                preview="live"
                height={420}
                visibleDragbar={false}
                textareaProps={{
                  placeholder:
                    "Soạn nội dung bằng Markdown. Bạn có thể chèn HTML trực tiếp nếu muốn.",
                }}
              />
            </div>
            <p className="text-xs text-zinc-400">
              Editor dùng Markdown mặc định, vẫn hỗ trợ chèn HTML thủ công trong
              nội dung.
            </p>
            <p className="text-xs text-zinc-500">
              Khi insert ảnh từ mục tài liệu, hệ thống chèn dạng{" "}
              <span className="font-mono">
                &lt;img width=&quot;600&quot; /&gt;
              </span>
              . Bạn có thể đổi số width để chỉnh kích cỡ ảnh.
            </p>

            {confirmDeleteLesson && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-200">
                  Xác nhận xóa bài học này?
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="btn-secondary px-3 py-2 text-sm"
                    type="button"
                    disabled={submitting}
                    onClick={() => setConfirmDeleteLesson(false)}
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
                      try {
                        await deleteLesson(lessonId);
                        showToast({
                          type: "success",
                          message: "Đã xóa bài học.",
                        });
                        router.push(
                          `/admin/courses/${courseId}/chapters/${chapterId}/lessons`,
                        );
                      } catch (err) {
                        const message =
                          err instanceof Error
                            ? err.message
                            : "Không xóa được bài học.";
                        setError(message);
                        showToast({ type: "error", message });
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
                disabled={submitting || savingLesson}
                onClick={() => setConfirmDeleteLesson(true)}
                type="button"
              >
                Xóa bài học
              </button>

              <div className="space-y-2 text-right">
                <button
                  className="btn-primary px-4 py-2 text-sm"
                  disabled={Boolean(saveDisabledReason) || submitting}
                  onClick={async () => {
                    setSavingLesson(true);
                    setSubmitting(true);
                    setError("");
                    setSuccess("Đang lưu bài học...");
                    try {
                      const normalizedVideoUrl = videoPath.trim();
                      if (
                        normalizedVideoUrl &&
                        !isBunnyPlayerUrl(normalizedVideoUrl)
                      ) {
                        throw new Error(
                          "URL video không hợp lệ. Vui lòng dùng link Bunny dạng https://player.mediadelivery.net/play/{library}/{videoId}.",
                        );
                      }

                      await updateLesson(lessonId, {
                        title,
                        summary:
                          summary?.trim() || "Đang cập nhật mô tả bài học.",
                        content,
                        type: "video",
                        duration: "Đang cập nhật",
                        videoUrl: normalizedVideoUrl || null,
                      });
                      setSuccess("Đã lưu bài học.");
                      showToast({
                        type: "success",
                        message: "Đã lưu bài học.",
                      });
                    } catch (err) {
                      const message =
                        err instanceof Error
                          ? err.message
                          : "Không lưu được bài học.";
                      setError(message);
                      showToast({ type: "error", message });
                    } finally {
                      setSavingLesson(false);
                      setSubmitting(false);
                    }
                  }}
                >
                  {savingLesson ? "Đang lưu..." : "Lưu bài học"}
                </button>
                {saveDisabledReason && !savingLesson && (
                  <p className="text-xs text-zinc-400">{saveDisabledReason}</p>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="card space-y-3 p-4 md:p-5">
        <h2 className="text-lg font-bold">
          3) Tài liệu khóa học (insert vào editor)
        </h2>

        <div className="space-y-2">
          <input
            ref={resourceFileInputRef}
            type="file"
            className="hidden"
            disabled={uploadingResource || submitting}
            onChange={async (event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;
              await uploadResourceFile(file);
              event.currentTarget.value = "";
            }}
          />
          <div
            className={`rounded-lg border px-3 py-5 text-center text-sm ${
              isDragOverResource
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-zinc-300"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              if (!uploadingResource && !submitting) {
                setIsDragOverResource(true);
              }
            }}
            onDragLeave={() => setIsDragOverResource(false)}
            onDrop={async (event) => {
              event.preventDefault();
              setIsDragOverResource(false);
              if (uploadingResource || submitting) {
                return;
              }
              const file = event.dataTransfer.files?.[0];
              if (!file) return;
              await uploadResourceFile(file);
            }}
          >
            <p>
              {uploadingResource
                ? "Đang upload tài liệu..."
                : "Kéo & thả tài liệu vào đây"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Hỗ trợ ảnh, PDF, DOCX và các file phổ biến khác.
            </p>
            <button
              type="button"
              className="btn-secondary mt-3 px-3 py-1 text-xs"
              disabled={uploadingResource || submitting}
              onClick={() => resourceFileInputRef.current?.click()}
            >
              Chọn file từ máy
            </button>
          </div>

          {uploadingResource && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-black/20 px-3 py-2 text-xs text-zinc-300">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
              Đang upload tài liệu, vui lòng chờ...
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border">
          <ul className="divide-y divide-border">
            {lessonResources.map((resource) => (
              <li
                key={resource.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {resource.title}
                  </p>
                  <p className="text-xs text-zinc-400">{resource.file_type}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {resource.storage_path}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary px-3 py-1 text-xs"
                    onClick={async () => {
                      setInsertingResourceId(resource.id);
                      setError("");
                      try {
                        const insertUrl =
                          (await getMediaPreviewUrl(resource.storage_path)) ||
                          resource.storage_path;

                        if (isImageFileType(resource.file_type)) {
                          insertIntoEditor(
                            `<img src="${insertUrl}" alt="${resource.title}" width="600" style="max-width:100%;height:auto;" />`,
                          );
                        } else {
                          insertIntoEditor(`[${resource.title}](${insertUrl})`);
                        }

                        setSuccess("Đã chèn tài liệu vào editor.");
                        showToast({
                          type: "success",
                          message: "Đã chèn tài liệu vào editor.",
                        });
                      } catch (err) {
                        const message =
                          err instanceof Error
                            ? err.message
                            : "Không chèn được tài liệu vào editor.";
                        setError(message);
                        showToast({ type: "error", message });
                      } finally {
                        setInsertingResourceId(null);
                      }
                    }}
                    type="button"
                    disabled={insertingResourceId === resource.id}
                  >
                    {insertingResourceId === resource.id
                      ? "Đang chèn..."
                      : "Insert editor"}
                  </button>
                  <button
                    className="btn-secondary px-3 py-1 text-xs"
                    onClick={async () => {
                      setSubmitting(true);
                      setError("");
                      try {
                        await deleteResource(resource.id);
                        setResources((prev) =>
                          prev.filter((item) => item.id !== resource.id),
                        );
                        showToast({
                          type: "success",
                          message: "Đã xóa tài liệu.",
                        });
                      } catch (err) {
                        const message =
                          err instanceof Error
                            ? err.message
                            : "Không xóa được tài liệu.";
                        setError(message);
                        showToast({ type: "error", message });
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    type="button"
                  >
                    Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {lessonResources.length === 0 && (
            <p className="p-3 text-sm text-zinc-500">
              Chưa có tài liệu cho bài học này.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
