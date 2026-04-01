import type {
  ChapterItem,
  LessonItem,
  ManagedCourse,
  ManagedResource,
} from "./types";

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error ?? "Có lỗi xảy ra khi gọi API.");
  }
  return result as T;
};

export const normalizeCourseSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getCourses = async (options?: { id?: string }) => {
  const params = new URLSearchParams();
  if (options?.id) {
    params.set("id", options.id);
  }

  const suffix = params.toString();
  const result = await requestJson<{ courses: ManagedCourse[] }>(
    `/api/admin/courses${suffix ? `?${suffix}` : ""}`,
    { cache: "no-store" },
  );
  return result.courses ?? [];
};

export const getCourseById = async (courseId: string) => {
  const courses = await getCourses({ id: courseId });
  return courses.find((item) => item.id === courseId) ?? null;
};

export const createCourse = async (payload: {
  slug: string;
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
  introVideoUrl?: string;
}) => {
  const result = await requestJson<{ course: ManagedCourse }>(
    "/api/admin/courses",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return result.course;
};

export const updateCourse = async (
  courseId: string,
  payload: Partial<{
    title: string;
    description: string;
    category: "in-an" | "thiet-ke" | "kinh-doanh";
    level: "Cơ bản" | "Nâng cao";
    price: number;
    thumbnail: string;
    introVideoUrl: string | null;
    instructorName: string;
    instructorTitle: string;
    outcomes: string[];
  }>,
) => {
  const result = await requestJson<{ course: ManagedCourse }>(
    "/api/admin/courses",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: courseId, ...payload }),
    },
  );
  return result.course;
};

export const deleteCourse = async (courseId: string) => {
  await requestJson<{ success: true }>(`/api/admin/courses?id=${courseId}`, {
    method: "DELETE",
  });
};

export const getStructure = async (
  courseId: string,
  options?: {
    chapterId?: string;
    lessonId?: string;
    includeResources?: boolean;
  },
) => {
  const params = new URLSearchParams({ courseId });
  if (options?.chapterId) {
    params.set("chapterId", options.chapterId);
  }
  if (options?.lessonId) {
    params.set("lessonId", options.lessonId);
  }
  if (options?.includeResources === false) {
    params.set("includeResources", "false");
  }

  const result = await requestJson<{ chapters: ChapterItem[] }>(
    `/api/admin/course-structure?${params.toString()}`,
    { cache: "no-store" },
  );
  return result.chapters ?? [];
};

export const getChapterById = async (courseId: string, chapterId: string) => {
  const chapters = await getStructure(courseId, {
    chapterId,
    includeResources: false,
  });
  return chapters.find((item) => item.id === chapterId) ?? null;
};

export const getLessonById = async (
  courseId: string,
  chapterId: string,
  lessonId: string,
) => {
  const chapters = await getStructure(courseId, {
    chapterId,
    lessonId,
    includeResources: false,
  });
  const chapter = chapters.find((item) => item.id === chapterId) ?? null;
  if (!chapter) return null;
  return chapter.lessons.find((item) => item.id === lessonId) ?? null;
};

export const createChapter = async (courseId: string, title: string) => {
  const result = await requestJson<{ chapter: ChapterItem }>(
    "/api/admin/course-structure",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "chapter", courseId, title }),
    },
  );
  return result.chapter;
};

export const updateChapter = async (chapterId: string, title: string) => {
  const result = await requestJson<{ chapter: ChapterItem }>(
    "/api/admin/course-structure",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "chapter", id: chapterId, title }),
    },
  );
  return result.chapter;
};

export const deleteChapter = async (chapterId: string) => {
  await requestJson<{ success: true }>(
    `/api/admin/course-structure?entity=chapter&id=${chapterId}`,
    {
      method: "DELETE",
    },
  );
};

export const createLesson = async (chapterId: string, title: string) => {
  const result = await requestJson<{ lesson: LessonItem }>(
    "/api/admin/course-structure",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "lesson", chapterId, title }),
    },
  );
  return result.lesson;
};

export const updateLesson = async (
  lessonId: string,
  payload: Partial<{
    title: string;
    type: "video" | "text";
    duration: string;
    summary: string;
    content: string | null;
    videoUrl: string | null;
  }>,
) => {
  const result = await requestJson<{ lesson: LessonItem }>(
    "/api/admin/course-structure",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "lesson",
        id: lessonId,
        ...payload,
      }),
    },
  );
  return result.lesson;
};

export const deleteLesson = async (lessonId: string) => {
  await requestJson<{ success: true }>(
    `/api/admin/course-structure?entity=lesson&id=${lessonId}`,
    {
      method: "DELETE",
    },
  );
};

export const getResources = async (options?: {
  lessonId?: string;
  courseId?: string;
}) => {
  const params = new URLSearchParams();
  if (options?.lessonId) {
    params.set("lessonId", options.lessonId);
  }
  if (options?.courseId) {
    params.set("courseId", options.courseId);
  }

  const suffix = params.toString();
  const result = await requestJson<{ resources: ManagedResource[] }>(
    `/api/admin/resources${suffix ? `?${suffix}` : ""}`,
    { cache: "no-store" },
  );
  return result.resources ?? [];
};

export const createResource = async (payload: {
  lessonId?: string;
  courseId?: string;
  title: string;
  description?: string;
  fileType: string;
  previewImage?: string;
  storagePath: string;
}) => {
  const result = await requestJson<{ resource: ManagedResource }>(
    "/api/admin/resources",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return result.resource;
};

export const deleteResource = async (resourceId: string) => {
  await requestJson<{ success: true }>(
    `/api/admin/resources?id=${resourceId}`,
    {
      method: "DELETE",
    },
  );
};

export const uploadMedia = async (file: File, folder: string) => {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const result = await requestJson<{ filePath: string }>(
    "/api/storage/upload",
    {
      method: "POST",
      body: form,
    },
  );

  return result.filePath;
};

export const uploadMediaWithPreview = async (file: File, folder: string) => {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const result = await requestJson<{
    filePath: string;
    signedUrl: string | null;
  }>("/api/storage/upload", {
    method: "POST",
    body: form,
  });

  const previewUrl =
    result.signedUrl ?? (await getMediaPreviewUrl(result.filePath));

  return {
    filePath: result.filePath,
    previewUrl,
  };
};

export const getMediaPreviewUrl = async (filePath: string) => {
  const normalized = filePath.trim();
  if (!normalized) return "";

  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  try {
    const result = await requestJson<{ signedUrl: string }>(
      "/api/storage/signed-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: normalized }),
      },
    );
    return result.signedUrl ?? normalized;
  } catch {
    return normalized;
  }
};

export const inferFileType = (value: string) => {
  const match = value
    .trim()
    .toUpperCase()
    .match(/\.([A-Z0-9]{1,12})$/);
  return match ? `.${match[1]}` : ".PDF";
};

export const isImageFileType = (fileType: string) =>
  [".JPG", ".JPEG", ".PNG", ".WEBP", ".GIF", ".SVG"].includes(
    fileType.toUpperCase(),
  );
