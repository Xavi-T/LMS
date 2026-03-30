import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getCourseBySlug } from "@/lib/course";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { supabaseEnv } from "@/lib/supabase/env";

const parseCourseSlugs = (value: string | null | undefined) => {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const resolveVideoUrl = async (
  videoUrl: string | null,
  supabase: ReturnType<typeof getSupabaseServiceClient>,
) => {
  if (!videoUrl) {
    return undefined;
  }

  if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
    return videoUrl;
  }

  if (!supabase) {
    return undefined;
  }

  const { data } = await supabase.storage
    .from(supabaseEnv.bucketName)
    .createSignedUrl(videoUrl, 60 * 60);

  return data?.signedUrl;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

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
    if (!ownedSlugs.includes(slug)) {
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
    .eq("slug", slug)
    .maybeSingle();

  if (courseError) {
    return NextResponse.json(
      { error: formatSupabaseError(courseError) },
      { status: 500 },
    );
  }

  if (!course) {
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
    }>;

    for (const lesson of chapterLessons) {
      normalizedLessons.push({
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        summary: lesson.summary,
        content: lesson.content ?? undefined,
        videoUrl: await resolveVideoUrl(lesson.video_url, supabase),
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
