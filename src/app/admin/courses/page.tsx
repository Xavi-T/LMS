"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/contexts/app-context";

type ManagedCourse = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  detailed_description: string;
  category: "in-an" | "thiet-ke" | "kinh-doanh";
  level: "Cơ bản" | "Nâng cao";
  price: number;
  thumbnail: string;
  intro_video_url: string | null;
};

type LessonItem = {
  id: string;
  chapter_id: string;
  title: string;
  type: "video" | "text";
  duration: string;
  summary: string;
  content: string | null;
  video_url: string | null;
};

type ChapterItem = {
  id: string;
  course_id: string;
  title: string;
  position: number;
  lessons: LessonItem[];
};

type ManagedResource = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  file_type: ".CDR" | ".AI" | ".PSD";
  preview_image: string | null;
  storage_path: string;
};

const normalizeCourseSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const CREATE_COURSE_DRAFT_KEY = "lms_admin_create_course_draft";

export default function AdminCourseModulePage() {
  const { user } = useAppState();

  const [courses, setCourses] = useState<ManagedCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [resources, setResources] = useState<ManagedResource[]>([]);

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLabel, setUploadingLabel] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newCourse, setNewCourse] = useState({
    slug: "",
    title: "",
    shortDescription: "",
    detailedDescription: "",
    category: "in-an" as "in-an" | "thiet-ke" | "kinh-doanh",
    level: "Cơ bản" as "Cơ bản" | "Nâng cao",
    price: "",
    thumbnail: "",
    introVideoUrl: "",
  });

  const [courseEdit, setCourseEdit] = useState({
    title: "",
    shortDescription: "",
    detailedDescription: "",
    category: "in-an" as "in-an" | "thiet-ke" | "kinh-doanh",
    level: "Cơ bản" as "Cơ bản" | "Nâng cao",
    price: 0,
    thumbnail: "",
    introVideoUrl: "",
  });

  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    fileType: ".CDR" as ".CDR" | ".AI" | ".PSD",
    previewImage: "",
    storagePath: "",
  });
  const [resourceEdits, setResourceEdits] = useState<
    Record<
      string,
      {
        title: string;
        description: string;
        fileType: ".CDR" | ".AI" | ".PSD";
        previewImage: string;
        storagePath: string;
      }
    >
  >({});
  const [newLessonByChapter, setNewLessonByChapter] = useState<
    Record<
      string,
      {
        title: string;
        type: "video" | "text";
        duration: string;
        summary: string;
        content: string;
        videoUrl: string;
      }
    >
  >({});

  const formFieldClass =
    "w-full rounded-lg border border-border bg-black px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";
  const labelClass = "text-xs font-medium tracking-wide text-zinc-400";

  const handleNewCourseTitleChange = (title: string) => {
    const nextSlug = normalizeCourseSlug(title);
    setNewCourse((prev) => ({
      ...prev,
      title,
      slug: isSlugManuallyEdited ? prev.slug : nextSlug,
    }));
  };

  const handleNewCourseSlugChange = (slug: string) => {
    setIsSlugManuallyEdited(true);
    setNewCourse((prev) => ({ ...prev, slug: normalizeCourseSlug(slug) }));
  };

  const normalizePriceInput = (value: string) => {
    const digits = value.replace(/\D+/g, "");
    if (!digits) return "";
    return digits.replace(/^0+(?=\d)/, "");
  };

  const saveCreateSectionDraft = (sectionName: string) => {
    try {
      window.localStorage.setItem(
        CREATE_COURSE_DRAFT_KEY,
        JSON.stringify(newCourse),
      );
      setSuccess(`Đã lưu nháp section: ${sectionName}.`);
      setError("");
    } catch {
      setError("Không thể lưu nháp tại trình duyệt.");
    }
  };

  const selectedCourse = useMemo(
    () => courses.find((item) => item.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  const selectedCourseResources = useMemo(
    () => resources.filter((item) => item.course_id === selectedCourseId),
    [resources, selectedCourseId],
  );

  const loadCourses = async () => {
    setLoadingCourses(true);
    setError("");
    try {
      const response = await fetch("/api/admin/courses", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error ?? "Không tải được danh sách khóa học.");
        return;
      }

      const nextCourses = (result?.courses ?? []) as ManagedCourse[];
      setCourses(nextCourses);
      if (!selectedCourseId && nextCourses.length > 0) {
        setSelectedCourseId(nextCourses[0].id);
      }
    } catch {
      setError("Không thể kết nối API khóa học.");
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadStructure = async (courseId: string) => {
    if (!courseId) {
      setChapters([]);
      return;
    }

    setLoadingStructure(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/course-structure?courseId=${courseId}`,
        { cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error ?? "Không tải được cấu trúc khóa học.");
        return;
      }

      setChapters((result?.chapters ?? []) as ChapterItem[]);
    } catch {
      setError("Không thể kết nối API cấu trúc khóa học.");
    } finally {
      setLoadingStructure(false);
    }
  };

  const loadResources = async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/resources", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error ?? "Không tải được tài liệu khóa học.");
        return;
      }

      const nextResources = (result?.resources ?? []) as ManagedResource[];
      setResources(nextResources);
      setResourceEdits(
        nextResources.reduce(
          (acc, resource) => ({
            ...acc,
            [resource.id]: {
              title: resource.title,
              description: resource.description ?? "",
              fileType: resource.file_type,
              previewImage: resource.preview_image ?? "",
              storagePath: resource.storage_path,
            },
          }),
          {},
        ),
      );
    } catch {
      setError("Không thể kết nối API tài liệu khóa học.");
    }
  };

  const uploadMedia = async (
    file: File,
    folder:
      | "course-images"
      | "course-videos"
      | "lesson-videos"
      | "course-resource-files"
      | "course-resource-previews",
  ) => {
    setError("");
    setSuccess("");
    setUploadingLabel(`Đang tải ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result?.error ?? "Không thể upload media.");
        return null;
      }

      setSuccess("Upload media thành công.");
      return result?.filePath as string;
    } catch {
      setError("Không thể kết nối API upload media.");
      return null;
    } finally {
      setUploadingLabel("");
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadCourses();
    loadResources();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "admin") return;

    try {
      const rawDraft = window.localStorage.getItem(CREATE_COURSE_DRAFT_KEY);
      if (!rawDraft) return;

      const parsedDraft = JSON.parse(rawDraft) as Partial<typeof newCourse>;
      setNewCourse((prev) => ({
        ...prev,
        ...parsedDraft,
        price:
          typeof parsedDraft.price === "string"
            ? parsedDraft.price
            : prev.price,
      }));
      setIsSlugManuallyEdited(Boolean(parsedDraft.slug));
    } catch {
      setError("Không thể đọc nháp tạo khóa học đã lưu.");
    }
  }, [user?.role]);

  useEffect(() => {
    if (!selectedCourseId) return;

    const current = courses.find((item) => item.id === selectedCourseId);
    if (current) {
      setCourseEdit({
        title: current.title,
        shortDescription: current.short_description,
        detailedDescription: current.detailed_description,
        category: current.category,
        level: current.level,
        price: current.price,
        thumbnail: current.thumbnail,
        introVideoUrl: current.intro_video_url ?? "",
      });
    }

    loadStructure(selectedCourseId);
  }, [selectedCourseId, courses]);

  const createCourse = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    const createPayload = {
      ...newCourse,
      price: Number(newCourse.price || "0"),
    };

    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error ?? "Không tạo được khóa học.");
        return;
      }

      setSuccess("Đã tạo khóa học mới.");
      setIsSlugManuallyEdited(false);
      window.localStorage.removeItem(CREATE_COURSE_DRAFT_KEY);
      setNewCourse({
        slug: "",
        title: "",
        shortDescription: "",
        detailedDescription: "",
        category: "in-an",
        level: "Cơ bản",
        price: "",
        thumbnail: "",
        introVideoUrl: "",
      });
      await loadCourses();
      if (result?.course?.id) {
        setSelectedCourseId(result.course.id);
      }
    } catch {
      setError("Không thể kết nối API tạo khóa học.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateCourse = async () => {
    if (!selectedCourseId) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCourseId, ...courseEdit }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error ?? "Không cập nhật được khóa học.");
        return;
      }

      setSuccess("Đã cập nhật thông tin khóa học.");
      await loadCourses();
    } catch {
      setError("Không thể kết nối API cập nhật khóa học.");
    } finally {
      setSubmitting(false);
    }
  };

  const createChapter = async () => {
    if (!selectedCourseId || !newChapterTitle.trim()) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/course-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "chapter",
          courseId: selectedCourseId,
          title: newChapterTitle,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error ?? "Không tạo được chương.");
        return;
      }

      setSuccess("Đã tạo chương mới.");
      setNewChapterTitle("");
      await loadStructure(selectedCourseId);
    } catch {
      setError("Không thể kết nối API tạo chương.");
    } finally {
      setSubmitting(false);
    }
  };

  const createLesson = async (chapterId: string) => {
    const form = newLessonByChapter[chapterId];
    if (!form?.title || !form.duration || !form.summary) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/course-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "lesson",
          chapterId,
          title: form.title,
          type: form.type,
          duration: form.duration,
          summary: form.summary,
          content: form.content,
          videoUrl: form.videoUrl,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error ?? "Không tạo được bài học.");
        return;
      }

      setSuccess("Đã tạo bài học mới.");
      setNewLessonByChapter((prev) => ({
        ...prev,
        [chapterId]: {
          title: "",
          type: "video",
          duration: "",
          summary: "",
          content: "",
          videoUrl: "",
        },
      }));
      await loadStructure(selectedCourseId);
    } catch {
      setError("Không thể kết nối API tạo bài học.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateChapter = async (chapterId: string, title: string) => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/course-structure", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "chapter", id: chapterId, title }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error ?? "Không cập nhật được chương.");
        return;
      }

      setSuccess("Đã cập nhật chương.");
      await loadStructure(selectedCourseId);
    } catch {
      setError("Không thể kết nối API cập nhật chương.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateLesson = async (lesson: LessonItem) => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/course-structure", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "lesson",
          id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          duration: lesson.duration,
          summary: lesson.summary,
          content: lesson.content,
          videoUrl: lesson.video_url,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error ?? "Không cập nhật được bài học.");
        return;
      }

      setSuccess("Đã cập nhật bài học.");
      await loadStructure(selectedCourseId);
    } catch {
      setError("Không thể kết nối API cập nhật bài học.");
    } finally {
      setSubmitting(false);
    }
  };

  const createResource = async () => {
    if (!selectedCourseId || !newResource.title || !newResource.storagePath) {
      setError("Hãy nhập đủ tiêu đề và file tài liệu cho tài liệu mới.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          title: newResource.title,
          description: newResource.description,
          fileType: newResource.fileType,
          previewImage: newResource.previewImage,
          storagePath: newResource.storagePath,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error ?? "Không tạo được tài liệu.");
        return;
      }

      setSuccess("Đã thêm tài liệu khóa học.");
      setNewResource({
        title: "",
        description: "",
        fileType: ".CDR",
        previewImage: "",
        storagePath: "",
      });
      await loadResources();
    } catch {
      setError("Không thể kết nối API tạo tài liệu.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveResource = async (resourceId: string) => {
    const current = resourceEdits[resourceId];
    if (!current) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/resources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resourceId,
          title: current.title,
          description: current.description,
          fileType: current.fileType,
          previewImage: current.previewImage,
          storagePath: current.storagePath,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error ?? "Không cập nhật được tài liệu.");
        return;
      }

      setSuccess("Đã cập nhật tài liệu.");
      await loadResources();
    } catch {
      setError("Không thể kết nối API cập nhật tài liệu.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteResource = async (resourceId: string) => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/resources?id=${resourceId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error ?? "Không xóa được tài liệu.");
        return;
      }

      setSuccess("Đã xóa tài liệu.");
      await loadResources();
    } catch {
      setError("Không thể kết nối API xóa tài liệu.");
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-accent">
              Course Manager
            </p>
            <h1 className="text-2xl font-black md:text-4xl">
              Module quản lý khóa học
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Tạo cấu trúc khóa học, upload video/ảnh bài giảng và quản lý tài
              liệu trong cùng một module.
            </p>
          </div>
          <Link href="/admin" className="btn-secondary px-4 py-2 text-sm">
            ← Quay lại Admin
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
      {uploadingLabel && (
        <p className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">
          {uploadingLabel}
        </p>
      )}

      <details open className="card p-4 md:p-5">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <div>
            <h2 className="text-lg font-bold">Tạo khóa học mới</h2>
            <p className="text-xs text-zinc-400">
              Điền theo từng nhóm thông tin để thao tác nhanh và ít lỗi hơn.
            </p>
          </div>
          <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent">
            Slug tự tạo theo tên
          </span>
        </summary>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-border p-3">
            <p className="text-sm font-semibold">Thông tin chính</p>
            <label className="space-y-1">
              <span className={labelClass}>Tên khóa học</span>
              <input
                value={newCourse.title}
                onChange={(event) =>
                  handleNewCourseTitleChange(event.target.value)
                }
                placeholder="Ví dụ: In áo thun từ A-Z"
                className={formFieldClass}
              />
            </label>

            <label className="space-y-1">
              <span className={labelClass}>Slug</span>
              <div className="flex gap-2">
                <input
                  value={newCourse.slug}
                  onChange={(event) =>
                    handleNewCourseSlugChange(event.target.value)
                  }
                  placeholder="in-ao-thun-tu-a-z"
                  className={formFieldClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSlugManuallyEdited(false);
                    setNewCourse((prev) => ({
                      ...prev,
                      slug: normalizeCourseSlug(prev.title),
                    }));
                  }}
                  className="btn-secondary shrink-0 px-3 py-2 text-xs"
                >
                  Tạo lại
                </button>
              </div>
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1 md:col-span-1">
                <span className={labelClass}>Giá</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newCourse.price}
                  onChange={(event) =>
                    setNewCourse((prev) => ({
                      ...prev,
                      price: normalizePriceInput(event.target.value),
                    }))
                  }
                  placeholder="Nhập giá"
                  className={formFieldClass}
                />
              </label>
              <label className="space-y-1">
                <span className={labelClass}>Danh mục</span>
                <select
                  value={newCourse.category}
                  onChange={(event) =>
                    setNewCourse((prev) => ({
                      ...prev,
                      category: event.target.value as
                        | "in-an"
                        | "thiet-ke"
                        | "kinh-doanh",
                    }))
                  }
                  className={formFieldClass}
                >
                  <option value="in-an">In ấn</option>
                  <option value="thiet-ke">Thiết kế</option>
                  <option value="kinh-doanh">Kinh doanh</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className={labelClass}>Trình độ</span>
                <select
                  value={newCourse.level}
                  onChange={(event) =>
                    setNewCourse((prev) => ({
                      ...prev,
                      level: event.target.value as "Cơ bản" | "Nâng cao",
                    }))
                  }
                  className={formFieldClass}
                >
                  <option value="Cơ bản">Cơ bản</option>
                  <option value="Nâng cao">Nâng cao</option>
                </select>
              </label>
            </div>

            <label className="space-y-1">
              <span className={labelClass}>Mô tả ngắn</span>
              <textarea
                value={newCourse.shortDescription}
                onChange={(event) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    shortDescription: event.target.value,
                  }))
                }
                placeholder="Mô tả ngắn"
                rows={2}
                className={formFieldClass}
              />
            </label>

            <label className="space-y-1">
              <span className={labelClass}>Mô tả chi tiết</span>
              <textarea
                value={newCourse.detailedDescription}
                onChange={(event) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    detailedDescription: event.target.value,
                  }))
                }
                placeholder="Mô tả chi tiết"
                rows={3}
                className={formFieldClass}
              />
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                className="btn-secondary px-3 py-2 text-xs"
                onClick={() => saveCreateSectionDraft("Thông tin chính")}
              >
                Lưu section này
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border p-3">
            <p className="text-sm font-semibold">Media & upload</p>
            <label className="space-y-1">
              <span className={labelClass}>URL ảnh thumbnail</span>
              <input
                value={newCourse.thumbnail}
                onChange={(event) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    thumbnail: event.target.value,
                  }))
                }
                placeholder="https://..."
                className={formFieldClass}
              />
            </label>

            <label className="space-y-1">
              <span className={labelClass}>
                URL video giới thiệu (tuỳ chọn)
              </span>
              <input
                value={newCourse.introVideoUrl}
                onChange={(event) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    introVideoUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
                className={formFieldClass}
              />
            </label>

            <div className="grid gap-2 md:grid-cols-2">
              <label className="rounded-lg border border-border bg-black/40 px-3 py-2 text-sm text-zinc-300">
                Upload ảnh thumbnail
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 block w-full text-xs"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const filePath = await uploadMedia(file, "course-images");
                    if (filePath) {
                      setNewCourse((prev) => ({
                        ...prev,
                        thumbnail: filePath,
                      }));
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <label className="rounded-lg border border-border bg-black/40 px-3 py-2 text-sm text-zinc-300">
                Upload video giới thiệu
                <input
                  type="file"
                  accept="video/*"
                  className="mt-2 block w-full text-xs"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const filePath = await uploadMedia(file, "course-videos");
                    if (filePath) {
                      setNewCourse((prev) => ({
                        ...prev,
                        introVideoUrl: filePath,
                      }));
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            <div className="rounded-lg border border-border bg-black/30 p-3 text-xs text-zinc-300">
              <p className="font-semibold text-white">
                {newCourse.title || "Chưa nhập tên khóa học"}
              </p>
              <p className="mt-1 text-zinc-500">/{newCourse.slug || "slug"}</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="btn-secondary px-3 py-2 text-xs"
                onClick={() => saveCreateSectionDraft("Media & upload")}
              >
                Lưu section này
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="btn-primary px-5 py-2 text-sm"
            onClick={createCourse}
            disabled={submitting}
          >
            Tạo khóa học
          </button>
        </div>
      </details>

      <section className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Danh sách khóa học</h2>
            <button
              className="text-xs text-accent"
              onClick={loadCourses}
              disabled={loadingCourses}
            >
              Tải lại
            </button>
          </div>
          <div className="space-y-2">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`w-full rounded-lg border p-3 text-left ${
                  selectedCourseId === course.id
                    ? "border-accent bg-accent/10"
                    : "border-border"
                }`}
              >
                <p className="text-sm font-semibold">{course.title}</p>
                <p className="text-xs text-zinc-400">{course.slug}</p>
              </button>
            ))}
            {courses.length === 0 && !loadingCourses && (
              <p className="text-xs text-zinc-500">Chưa có khóa học.</p>
            )}
          </div>
        </aside>

        <div className="space-y-4">
          {selectedCourse && (
            <details open className="card p-4 md:p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <div>
                  <h2 className="text-lg font-bold">Thông tin khóa học</h2>
                  <p className="text-xs text-zinc-400">
                    {selectedCourse.title}
                  </p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-zinc-300">
                  {selectedCourse.slug}
                </span>
              </summary>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-border p-3">
                  <p className="text-sm font-semibold">Thông tin chính</p>
                  <div className="grid gap-2 md:grid-cols-3">
                    <input
                      value={courseEdit.title}
                      onChange={(event) =>
                        setCourseEdit((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                      className="rounded-lg border border-border bg-black px-3 py-2"
                    />
                    <select
                      value={courseEdit.category}
                      onChange={(event) =>
                        setCourseEdit((prev) => ({
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
                      value={courseEdit.level}
                      onChange={(event) =>
                        setCourseEdit((prev) => ({
                          ...prev,
                          level: event.target.value as "Cơ bản" | "Nâng cao",
                        }))
                      }
                      className="rounded-lg border border-border bg-black px-3 py-2"
                    >
                      <option value="Cơ bản">Cơ bản</option>
                      <option value="Nâng cao">Nâng cao</option>
                    </select>
                    <input
                      type="number"
                      value={courseEdit.price}
                      onChange={(event) =>
                        setCourseEdit((prev) => ({
                          ...prev,
                          price: Number(event.target.value) || 0,
                        }))
                      }
                      className="rounded-lg border border-border bg-black px-3 py-2"
                    />
                    <input
                      value={courseEdit.thumbnail}
                      onChange={(event) =>
                        setCourseEdit((prev) => ({
                          ...prev,
                          thumbnail: event.target.value,
                        }))
                      }
                      placeholder="URL ảnh khóa học"
                      className="rounded-lg border border-border bg-black px-3 py-2 md:col-span-2"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      className="btn-secondary px-3 py-2 text-xs"
                      onClick={updateCourse}
                      disabled={submitting}
                    >
                      Lưu section này
                    </button>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-border p-3">
                  <p className="text-sm font-semibold">Mô tả & media</p>
                  <textarea
                    value={courseEdit.shortDescription}
                    onChange={(event) =>
                      setCourseEdit((prev) => ({
                        ...prev,
                        shortDescription: event.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full rounded-lg border border-border bg-black px-3 py-2"
                  />
                  <textarea
                    value={courseEdit.detailedDescription}
                    onChange={(event) =>
                      setCourseEdit((prev) => ({
                        ...prev,
                        detailedDescription: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full rounded-lg border border-border bg-black px-3 py-2"
                  />
                  <input
                    value={courseEdit.introVideoUrl}
                    onChange={(event) =>
                      setCourseEdit((prev) => ({
                        ...prev,
                        introVideoUrl: event.target.value,
                      }))
                    }
                    placeholder="URL video giới thiệu"
                    className="w-full rounded-lg border border-border bg-black px-3 py-2"
                  />

                  <div className="flex justify-end">
                    <button
                      className="btn-secondary px-3 py-2 text-xs"
                      onClick={updateCourse}
                      disabled={submitting}
                    >
                      Lưu section này
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <label className="rounded-lg border border-border px-3 py-2 text-sm text-zinc-300">
                  Upload ảnh khóa học
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 block w-full text-xs"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const filePath = await uploadMedia(file, "course-images");
                      if (filePath) {
                        setCourseEdit((prev) => ({
                          ...prev,
                          thumbnail: filePath,
                        }));
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <label className="rounded-lg border border-border px-3 py-2 text-sm text-zinc-300">
                  Upload video giới thiệu
                  <input
                    type="file"
                    accept="video/*"
                    className="mt-2 block w-full text-xs"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const filePath = await uploadMedia(file, "course-videos");
                      if (filePath) {
                        setCourseEdit((prev) => ({
                          ...prev,
                          introVideoUrl: filePath,
                        }));
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </details>
          )}

          {selectedCourse && (
            <section className="card space-y-3 p-4 md:p-5">
              <h2 className="text-lg font-bold">Cấu trúc chương / bài học</h2>
              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <input
                  value={newChapterTitle}
                  onChange={(event) => setNewChapterTitle(event.target.value)}
                  placeholder="Tên chương mới"
                  className="rounded-lg border border-border bg-black px-3 py-2"
                />
                <button
                  className="btn-primary px-4 py-2 text-sm"
                  onClick={createChapter}
                  disabled={submitting || !newChapterTitle.trim()}
                >
                  Thêm chương
                </button>
              </div>

              {loadingStructure && (
                <p className="text-sm text-zinc-400">
                  Đang tải cấu trúc khóa học...
                </p>
              )}

              <div className="space-y-3">
                {chapters.map((chapter) => {
                  const lessonDraft = newLessonByChapter[chapter.id] ?? {
                    title: "",
                    type: "video" as const,
                    duration: "",
                    summary: "",
                    content: "",
                    videoUrl: "",
                  };

                  return (
                    <article
                      key={chapter.id}
                      className="rounded-xl border border-border p-3"
                    >
                      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                        <input
                          value={chapter.title}
                          onChange={(event) =>
                            setChapters((prev) =>
                              prev.map((item) =>
                                item.id === chapter.id
                                  ? { ...item, title: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="rounded-lg border border-border bg-black px-3 py-2 font-semibold"
                        />
                        <button
                          className="btn-secondary px-3 py-2 text-xs"
                          onClick={() =>
                            updateChapter(chapter.id, chapter.title)
                          }
                          disabled={submitting}
                        >
                          Lưu chương
                        </button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {chapter.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="rounded-lg border border-border p-3"
                          >
                            <div className="grid gap-2 md:grid-cols-4">
                              <input
                                value={lesson.title}
                                onChange={(event) =>
                                  setChapters((prev) =>
                                    prev.map((item) =>
                                      item.id !== chapter.id
                                        ? item
                                        : {
                                            ...item,
                                            lessons: item.lessons.map(
                                              (itemLesson) =>
                                                itemLesson.id === lesson.id
                                                  ? {
                                                      ...itemLesson,
                                                      title: event.target.value,
                                                    }
                                                  : itemLesson,
                                            ),
                                          },
                                    ),
                                  )
                                }
                                className="rounded-lg border border-border bg-black px-3 py-2"
                              />
                              <select
                                value={lesson.type}
                                onChange={(event) =>
                                  setChapters((prev) =>
                                    prev.map((item) =>
                                      item.id !== chapter.id
                                        ? item
                                        : {
                                            ...item,
                                            lessons: item.lessons.map(
                                              (itemLesson) =>
                                                itemLesson.id === lesson.id
                                                  ? {
                                                      ...itemLesson,
                                                      type: event.target
                                                        .value as
                                                        | "video"
                                                        | "text",
                                                    }
                                                  : itemLesson,
                                            ),
                                          },
                                    ),
                                  )
                                }
                                className="rounded-lg border border-border bg-black px-3 py-2"
                              >
                                <option value="video">Video</option>
                                <option value="text">Text</option>
                              </select>
                              <input
                                value={lesson.duration}
                                onChange={(event) =>
                                  setChapters((prev) =>
                                    prev.map((item) =>
                                      item.id !== chapter.id
                                        ? item
                                        : {
                                            ...item,
                                            lessons: item.lessons.map(
                                              (itemLesson) =>
                                                itemLesson.id === lesson.id
                                                  ? {
                                                      ...itemLesson,
                                                      duration:
                                                        event.target.value,
                                                    }
                                                  : itemLesson,
                                            ),
                                          },
                                    ),
                                  )
                                }
                                placeholder="Thời lượng"
                                className="rounded-lg border border-border bg-black px-3 py-2"
                              />
                              <button
                                className="btn-secondary px-3 py-2 text-xs"
                                onClick={() => updateLesson(lesson)}
                                disabled={submitting}
                              >
                                Lưu bài học
                              </button>
                            </div>
                            <textarea
                              value={lesson.summary}
                              onChange={(event) =>
                                setChapters((prev) =>
                                  prev.map((item) =>
                                    item.id !== chapter.id
                                      ? item
                                      : {
                                          ...item,
                                          lessons: item.lessons.map(
                                            (itemLesson) =>
                                              itemLesson.id === lesson.id
                                                ? {
                                                    ...itemLesson,
                                                    summary: event.target.value,
                                                  }
                                                : itemLesson,
                                          ),
                                        },
                                  ),
                                )
                              }
                              placeholder="Tóm tắt bài học"
                              className="mt-2 w-full rounded-lg border border-border bg-black px-3 py-2"
                              rows={2}
                            />
                            <input
                              value={lesson.video_url ?? ""}
                              onChange={(event) =>
                                setChapters((prev) =>
                                  prev.map((item) =>
                                    item.id !== chapter.id
                                      ? item
                                      : {
                                          ...item,
                                          lessons: item.lessons.map(
                                            (itemLesson) =>
                                              itemLesson.id === lesson.id
                                                ? {
                                                    ...itemLesson,
                                                    video_url:
                                                      event.target.value,
                                                  }
                                                : itemLesson,
                                          ),
                                        },
                                  ),
                                )
                              }
                              placeholder="URL video bài học"
                              className="mt-2 w-full rounded-lg border border-border bg-black px-3 py-2"
                            />
                            <label className="mt-2 block rounded-lg border border-border px-3 py-2 text-xs text-zinc-300">
                              Upload video bài học
                              <input
                                type="file"
                                accept="video/*"
                                className="mt-2 block w-full"
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  const filePath = await uploadMedia(
                                    file,
                                    "lesson-videos",
                                  );
                                  if (filePath) {
                                    setChapters((prev) =>
                                      prev.map((item) =>
                                        item.id !== chapter.id
                                          ? item
                                          : {
                                              ...item,
                                              lessons: item.lessons.map(
                                                (itemLesson) =>
                                                  itemLesson.id === lesson.id
                                                    ? {
                                                        ...itemLesson,
                                                        video_url: filePath,
                                                      }
                                                    : itemLesson,
                                              ),
                                            },
                                      ),
                                    );
                                  }
                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 grid gap-2 rounded-lg border border-border p-3 md:grid-cols-3">
                        <input
                          value={lessonDraft.title}
                          onChange={(event) =>
                            setNewLessonByChapter((prev) => ({
                              ...prev,
                              [chapter.id]: {
                                ...lessonDraft,
                                title: event.target.value,
                              },
                            }))
                          }
                          placeholder="Tên bài học mới"
                          className="rounded-lg border border-border bg-black px-3 py-2"
                        />
                        <select
                          value={lessonDraft.type}
                          onChange={(event) =>
                            setNewLessonByChapter((prev) => ({
                              ...prev,
                              [chapter.id]: {
                                ...lessonDraft,
                                type: event.target.value as "video" | "text",
                              },
                            }))
                          }
                          className="rounded-lg border border-border bg-black px-3 py-2"
                        >
                          <option value="video">Video</option>
                          <option value="text">Text</option>
                        </select>
                        <input
                          value={lessonDraft.duration}
                          onChange={(event) =>
                            setNewLessonByChapter((prev) => ({
                              ...prev,
                              [chapter.id]: {
                                ...lessonDraft,
                                duration: event.target.value,
                              },
                            }))
                          }
                          placeholder="Thời lượng"
                          className="rounded-lg border border-border bg-black px-3 py-2"
                        />
                        <textarea
                          value={lessonDraft.summary}
                          onChange={(event) =>
                            setNewLessonByChapter((prev) => ({
                              ...prev,
                              [chapter.id]: {
                                ...lessonDraft,
                                summary: event.target.value,
                              },
                            }))
                          }
                          placeholder="Tóm tắt"
                          rows={2}
                          className="rounded-lg border border-border bg-black px-3 py-2 md:col-span-2"
                        />
                        <input
                          value={lessonDraft.videoUrl}
                          onChange={(event) =>
                            setNewLessonByChapter((prev) => ({
                              ...prev,
                              [chapter.id]: {
                                ...lessonDraft,
                                videoUrl: event.target.value,
                              },
                            }))
                          }
                          placeholder="URL video"
                          className="rounded-lg border border-border bg-black px-3 py-2"
                        />
                        <label className="rounded-lg border border-border px-3 py-2 text-xs text-zinc-300">
                          Upload video bài học mới
                          <input
                            type="file"
                            accept="video/*"
                            className="mt-2 block w-full"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              const filePath = await uploadMedia(
                                file,
                                "lesson-videos",
                              );
                              if (filePath) {
                                setNewLessonByChapter((prev) => ({
                                  ...prev,
                                  [chapter.id]: {
                                    ...lessonDraft,
                                    videoUrl: filePath,
                                  },
                                }));
                              }
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                        <textarea
                          value={lessonDraft.content}
                          onChange={(event) =>
                            setNewLessonByChapter((prev) => ({
                              ...prev,
                              [chapter.id]: {
                                ...lessonDraft,
                                content: event.target.value,
                              },
                            }))
                          }
                          placeholder="Nội dung text (nếu type=text)"
                          rows={2}
                          className="rounded-lg border border-border bg-black px-3 py-2 md:col-span-2"
                        />
                        <button
                          className="btn-primary px-4 py-2 text-sm"
                          onClick={() => createLesson(chapter.id)}
                          disabled={submitting}
                        >
                          Thêm bài học
                        </button>
                      </div>
                    </article>
                  );
                })}

                {!loadingStructure && chapters.length === 0 && (
                  <p className="text-sm text-zinc-500">
                    Chưa có chương nào. Hãy thêm chương đầu tiên cho khóa học.
                  </p>
                )}
              </div>
            </section>
          )}

          {selectedCourse && (
            <section className="card space-y-3 p-4 md:p-5">
              <h2 className="text-lg font-bold">Tài liệu của khóa học</h2>
              <div className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-6">
                <input
                  value={newResource.title}
                  onChange={(event) =>
                    setNewResource((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Tên tài liệu"
                  className="rounded-lg border border-border bg-black px-3 py-2"
                />
                <select
                  value={newResource.fileType}
                  onChange={(event) =>
                    setNewResource((prev) => ({
                      ...prev,
                      fileType: event.target.value as ".CDR" | ".AI" | ".PSD",
                    }))
                  }
                  className="rounded-lg border border-border bg-black px-3 py-2"
                >
                  <option value=".CDR">.CDR</option>
                  <option value=".AI">.AI</option>
                  <option value=".PSD">.PSD</option>
                </select>
                <input
                  value={newResource.storagePath}
                  onChange={(event) =>
                    setNewResource((prev) => ({
                      ...prev,
                      storagePath: event.target.value,
                    }))
                  }
                  placeholder="Storage path file"
                  className="rounded-lg border border-border bg-black px-3 py-2"
                />
                <input
                  value={newResource.previewImage}
                  onChange={(event) =>
                    setNewResource((prev) => ({
                      ...prev,
                      previewImage: event.target.value,
                    }))
                  }
                  placeholder="URL preview image"
                  className="rounded-lg border border-border bg-black px-3 py-2"
                />
                <input
                  value={newResource.description}
                  onChange={(event) =>
                    setNewResource((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Mô tả"
                  className="rounded-lg border border-border bg-black px-3 py-2"
                />
                <button
                  className="btn-primary"
                  disabled={submitting}
                  onClick={createResource}
                >
                  Thêm tài liệu
                </button>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <label className="rounded-lg border border-border px-3 py-2 text-sm text-zinc-300">
                  Upload file tài liệu
                  <input
                    type="file"
                    className="mt-2 block w-full text-xs"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const filePath = await uploadMedia(
                        file,
                        "course-resource-files",
                      );
                      if (filePath) {
                        setNewResource((prev) => ({
                          ...prev,
                          storagePath: filePath,
                        }));
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <label className="rounded-lg border border-border px-3 py-2 text-sm text-zinc-300">
                  Upload ảnh preview tài liệu
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 block w-full text-xs"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const filePath = await uploadMedia(
                        file,
                        "course-resource-previews",
                      );
                      if (filePath) {
                        setNewResource((prev) => ({
                          ...prev,
                          previewImage: filePath,
                        }));
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="space-y-2">
                {selectedCourseResources.length === 0 && (
                  <p className="text-sm text-zinc-500">
                    Chưa có tài liệu cho khóa học này.
                  </p>
                )}

                {selectedCourseResources.map((resource) => (
                  <article
                    key={resource.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="grid gap-2 md:grid-cols-5">
                      <input
                        value={
                          resourceEdits[resource.id]?.title ?? resource.title
                        }
                        onChange={(event) =>
                          setResourceEdits((prev) => ({
                            ...prev,
                            [resource.id]: {
                              ...(prev[resource.id] ?? {
                                title: resource.title,
                                description: resource.description ?? "",
                                fileType: resource.file_type,
                                previewImage: resource.preview_image ?? "",
                                storagePath: resource.storage_path,
                              }),
                              title: event.target.value,
                            },
                          }))
                        }
                        className="rounded-lg border border-border bg-black px-3 py-2"
                      />
                      <select
                        value={
                          resourceEdits[resource.id]?.fileType ??
                          resource.file_type
                        }
                        onChange={(event) =>
                          setResourceEdits((prev) => ({
                            ...prev,
                            [resource.id]: {
                              ...(prev[resource.id] ?? {
                                title: resource.title,
                                description: resource.description ?? "",
                                fileType: resource.file_type,
                                previewImage: resource.preview_image ?? "",
                                storagePath: resource.storage_path,
                              }),
                              fileType: event.target.value as
                                | ".CDR"
                                | ".AI"
                                | ".PSD",
                            },
                          }))
                        }
                        className="rounded-lg border border-border bg-black px-3 py-2"
                      >
                        <option value=".CDR">.CDR</option>
                        <option value=".AI">.AI</option>
                        <option value=".PSD">.PSD</option>
                      </select>
                      <input
                        value={
                          resourceEdits[resource.id]?.storagePath ??
                          resource.storage_path
                        }
                        onChange={(event) =>
                          setResourceEdits((prev) => ({
                            ...prev,
                            [resource.id]: {
                              ...(prev[resource.id] ?? {
                                title: resource.title,
                                description: resource.description ?? "",
                                fileType: resource.file_type,
                                previewImage: resource.preview_image ?? "",
                                storagePath: resource.storage_path,
                              }),
                              storagePath: event.target.value,
                            },
                          }))
                        }
                        className="rounded-lg border border-border bg-black px-3 py-2"
                      />
                      <button
                        className="btn-secondary px-3 py-2"
                        disabled={submitting}
                        onClick={() => saveResource(resource.id)}
                      >
                        Lưu
                      </button>
                      <button
                        className="btn-secondary px-3 py-2"
                        disabled={submitting}
                        onClick={() => deleteResource(resource.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
