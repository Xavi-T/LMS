import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getCourseBySlug } from "@/lib/course";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { supabaseEnv } from "@/lib/supabase/env";

const parseCourseSlugs = (value: string | null | undefined) => {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const normalizeStoragePath = (value: string) => {
  const normalized = value.trim();
  const bucketPrefix = `${supabaseEnv.bucketName}/`;
  if (normalized.startsWith(bucketPrefix)) {
    return normalized.slice(bucketPrefix.length);
  }
  return normalized;
};

const extractStoragePathFromSupabaseUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const signPrefix = `/storage/v1/object/sign/${supabaseEnv.bucketName}/`;
    const publicPrefix = `/storage/v1/object/public/${supabaseEnv.bucketName}/`;

    if (parsed.pathname.startsWith(signPrefix)) {
      return decodeURIComponent(parsed.pathname.slice(signPrefix.length));
    }

    if (parsed.pathname.startsWith(publicPrefix)) {
      return decodeURIComponent(parsed.pathname.slice(publicPrefix.length));
    }
  } catch {}

  return null;
};

const resolveVideoUrl = async (
  videoUrl: string | null,
  supabase: ReturnType<typeof getSupabaseServiceClient>,
) => {
  if (!videoUrl) {
    return undefined;
  }

  if (!supabase) {
    return undefined;
  }

  if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
    const extractedPath = extractStoragePathFromSupabaseUrl(videoUrl);
    if (!extractedPath) {
      return videoUrl;
    }

    const { data } = await supabase.storage
      .from(supabaseEnv.bucketName)
      .createSignedUrl(normalizeStoragePath(extractedPath), 60 * 60);

    return data?.signedUrl ?? videoUrl;
  }

  const { data } = await supabase.storage
    .from(supabaseEnv.bucketName)
    .createSignedUrl(normalizeStoragePath(videoUrl), 60 * 60);

  return data?.signedUrl;
};

const resolveResourceUrl = async (
  storagePath: string | null,
  supabase: ReturnType<typeof getSupabaseServiceClient>,
) => {
  if (!storagePath) {
    return undefined;
  }

  if (!supabase) {
    return undefined;
  }

  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    const extractedPath = extractStoragePathFromSupabaseUrl(storagePath);
    if (!extractedPath) {
      return storagePath;
    }

    const { data } = await supabase.storage
      .from(supabaseEnv.bucketName)
      .createSignedUrl(normalizeStoragePath(extractedPath), 60 * 60);

    return data?.signedUrl ?? storagePath;
  }

  const { data } = await supabase.storage
    .from(supabaseEnv.bucketName)
    .createSignedUrl(normalizeStoragePath(storagePath), 60 * 60);

  return data?.signedUrl;
};

const resolveContentMediaUrls = async (
  content: string | null,
  supabase: ReturnType<typeof getSupabaseServiceClient>,
) => {
  if (!content) {
    return undefined;
  }

  const srcRegex = /src\s*=\s*"([^"]+)"/gi;
  const matches = Array.from(content.matchAll(srcRegex));

  if (matches.length === 0) {
    return content;
  }

  let nextContent = content;

  for (const match of matches) {
    const rawUrl = match[1];
    if (!rawUrl) continue;

    const refreshedUrl = await resolveResourceUrl(rawUrl, supabase);
    if (!refreshedUrl || refreshedUrl === rawUrl) {
      continue;
    }

    nextContent = nextContent.replace(
      `src="${rawUrl}"`,
      `src="${refreshedUrl}"`,
    );
  }

  return nextContent;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const normalizedSlug = slug.trim().toLowerCase();

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    const fallback = getCourseBySlug(slug);
    if (!fallback) {
      return NextResponse.json(
        { error: "Không tìm thấy khóa học." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      course: {
        slug: fallback.slug,
        title: fallback.title,
        chapters: fallback.chapters,
      },
    });
  }

  const role = request.cookies.get("lms_role")?.value;
  if (role === "student") {
    const studentEmail = request.cookies
      .get("lms_student_email")
      ?.value?.trim()
      .toLowerCase();

    if (!studentEmail) {
      return NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." },
        { status: 401 },
      );
    }

    const { data: account, error: accountError } = await supabase
      .from("customer_accounts")
      .select("status, course_slug")
      .ilike("email", studentEmail)
      .maybeSingle();

    if (accountError) {
      return NextResponse.json(
        { error: formatSupabaseError(accountError) },
        { status: 500 },
      );
    }

    if (!account || account.status !== "active") {
      return NextResponse.json(
        { error: "Tài khoản không khả dụng hoặc đã bị khóa." },
        { status: 403 },
      );
    }

    const ownedSlugs = parseCourseSlugs(account.course_slug);
    if (!ownedSlugs.includes(normalizedSlug)) {
      return NextResponse.json(
        {
          error:
            "Bạn không có quyền truy cập khóa học này. Chỉ truy cập được khóa học đã đăng ký/mua.",
        },
        { status: 403 },
      );
    }
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, slug, title")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (courseError) {
    return NextResponse.json(
      { error: formatSupabaseError(courseError) },
      { status: 500 },
    );
  }

  if (!course) {
    const fallback = getCourseBySlug(normalizedSlug);
    if (!fallback) {
      return NextResponse.json(
        { error: "Không tìm thấy khóa học." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      course: {
        slug: fallback.slug,
        title: fallback.title,
        chapters: fallback.chapters,
      },
    });
  }

  const { data: chapters, error: chapterError } = await supabase
    .from("chapters")
    .select("id, title, position")
    .eq("course_id", course.id)
    .order("position", { ascending: true });

  if (chapterError) {
    return NextResponse.json(
      { error: formatSupabaseError(chapterError) },
      { status: 500 },
    );
  }

  const chapterIds = (chapters ?? []).map((item) => item.id);
  let lessons: Array<{
    id: string;
    chapter_id: string;
    title: string;
    type: "video" | "text";
    duration: string;
    summary: string;
    content: string | null;
    video_url: string | null;
    position: number;
  }> = [];

  if (chapterIds.length > 0) {
    const { data: lessonRows, error: lessonError } = await supabase
      .from("lessons")
      .select(
        "id, chapter_id, title, type, duration, summary, content, video_url, position",
      )
      .in("chapter_id", chapterIds)
      .order("position", { ascending: true });

    if (lessonError) {
      return NextResponse.json(
        { error: formatSupabaseError(lessonError) },
        { status: 500 },
      );
    }

    lessons = lessonRows ?? [];
  }

  const lessonIds = lessons.map((item) => item.id);
  let resources: Array<{
    id: string;
    lesson_id: string | null;
    title: string;
    description: string | null;
    file_type: string;
    storage_path: string;
  }> = [];

  if (lessonIds.length > 0) {
    const { data: resourceRows, error: resourceError } = await supabase
      .from("course_resources")
      .select("id, lesson_id, title, description, file_type, storage_path")
      .in("lesson_id", lessonIds)
      .order("title", { ascending: true });

    if (resourceError) {
      return NextResponse.json(
        { error: formatSupabaseError(resourceError) },
        { status: 500 },
      );
    }

    resources = resourceRows ?? [];
  }

  const responseChapters = [] as Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
      type: "video" | "text";
      duration: string;
      summary: string;
      content?: string;
      videoUrl?: string;
    }>;
  }>;

  for (const chapter of chapters ?? []) {
    const chapterLessons = lessons
      .filter((lesson) => lesson.chapter_id === chapter.id)
      .sort((a, b) => a.position - b.position);

    const normalizedLessons = [] as Array<{
      id: string;
      title: string;
      type: "video" | "text";
      duration: string;
      summary: string;
      content?: string;
      videoUrl?: string;
      resources: Array<{
        id: string;
        title: string;
        description?: string;
        fileType: string;
        signedUrl?: string;
      }>;
    }>;

    for (const lesson of chapterLessons) {
      const lessonResources = resources.filter(
        (resource) => resource.lesson_id === lesson.id,
      );

      normalizedLessons.push({
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        summary: lesson.summary,
        content: await resolveContentMediaUrls(lesson.content, supabase),
        videoUrl: await resolveVideoUrl(lesson.video_url, supabase),
        resources: await Promise.all(
          lessonResources.map(async (resource) => ({
            id: resource.id,
            title: resource.title,
            description: resource.description ?? undefined,
            fileType: resource.file_type,
            signedUrl: await resolveResourceUrl(
              resource.storage_path,
              supabase,
            ),
          })),
        ),
      });
    }

    responseChapters.push({
      id: chapter.id,
      title: chapter.title,
      lessons: normalizedLessons,
    });
  }

  return NextResponse.json({
    course: {
      slug: course.slug,
      title: course.title,
      chapters: responseChapters,
    },
  });
}
