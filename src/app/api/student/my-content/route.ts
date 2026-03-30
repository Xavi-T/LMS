import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { supabaseEnv } from "@/lib/supabase/env";

const parseCourseSlugs = (value: string | null | undefined) => {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const resolveMediaUrl = async (
  value: string | null,
  supabase: ReturnType<typeof getSupabaseServiceClient>,
) => {
  const normalized = value?.trim();
  if (!normalized) return "";
  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  if (!supabase) return "";

  const { data } = await supabase.storage
    .from(supabaseEnv.bucketName)
    .createSignedUrl(normalized, 60 * 60);

  return data?.signedUrl ?? "";
};

export async function GET(request: NextRequest) {
  const role = request.cookies.get("lms_role")?.value;
  const studentEmail = request.cookies
    .get("lms_student_email")
    ?.value?.trim()
    .toLowerCase();

  if (role !== "student" || !studentEmail) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập học viên để truy cập nội dung này." },
      { status: 401 },
    );
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình." },
      { status: 500 },
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
  if (ownedSlugs.length === 0) {
    return NextResponse.json({ courses: [], resources: [] });
  }

  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, slug, title, short_description, price")
    .in("slug", ownedSlugs)
    .order("created_at", { ascending: false });

  if (coursesError) {
    return NextResponse.json(
      { error: formatSupabaseError(coursesError) },
      { status: 500 },
    );
  }

  const courseRows = courses ?? [];
  if (courseRows.length === 0) {
    return NextResponse.json({ courses: [], resources: [] });
  }

  const courseIds = courseRows.map((item) => item.id);

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("id, course_id, position")
    .in("course_id", courseIds)
    .order("position", { ascending: true });

  if (chaptersError) {
    return NextResponse.json(
      { error: formatSupabaseError(chaptersError) },
      { status: 500 },
    );
  }

  const chapterRows = chapters ?? [];
  const chapterIds = chapterRows.map((item) => item.id);

  const { data: lessons, error: lessonsError } = chapterIds.length
    ? await supabase
        .from("lessons")
        .select("id, chapter_id, position")
        .in("chapter_id", chapterIds)
        .order("position", { ascending: true })
    : {
        data: [] as Array<{ id: string; chapter_id: string; position: number }>,
        error: null,
      };

  if (lessonsError) {
    return NextResponse.json(
      { error: formatSupabaseError(lessonsError) },
      { status: 500 },
    );
  }

  const lessonRows = lessons ?? [];

  const { data: resources, error: resourcesError } = await supabase
    .from("course_resources")
    .select(
      "id, course_id, title, description, file_type, preview_image, storage_path",
    )
    .in("course_id", courseIds)
    .order("title", { ascending: true });

  if (resourcesError) {
    return NextResponse.json(
      { error: formatSupabaseError(resourcesError) },
      { status: 500 },
    );
  }

  const chapterByCourse = new Map<string, string[]>();
  for (const chapter of chapterRows) {
    const list = chapterByCourse.get(chapter.course_id) ?? [];
    chapterByCourse.set(chapter.course_id, [...list, chapter.id]);
  }

  const lessonByChapter = new Map<string, string[]>();
  for (const lesson of lessonRows) {
    const list = lessonByChapter.get(lesson.chapter_id) ?? [];
    lessonByChapter.set(lesson.chapter_id, [...list, lesson.id]);
  }

  const coursesResponse = courseRows.map((course) => {
    const chapterIdsOfCourse = chapterByCourse.get(course.id) ?? [];
    const allLessonIds = chapterIdsOfCourse.flatMap(
      (chapterId) => lessonByChapter.get(chapterId) ?? [],
    );

    return {
      slug: course.slug,
      title: course.title,
      shortDescription: course.short_description,
      price: course.price,
      totalLessons: allLessonIds.length,
      firstLessonId: allLessonIds[0] ?? null,
    };
  });

  const courseTitleMap = new Map(
    courseRows.map((item) => [item.id, item.title]),
  );
  const courseSlugMap = new Map(courseRows.map((item) => [item.id, item.slug]));

  const resourcesResponse = await Promise.all(
    (resources ?? []).map(async (resource) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      fileType: resource.file_type,
      previewImage: await resolveMediaUrl(resource.preview_image, supabase),
      storagePath: resource.storage_path,
      courseSlug: courseSlugMap.get(resource.course_id) ?? "",
      courseTitle: courseTitleMap.get(resource.course_id) ?? "Khóa học",
    })),
  );

  return NextResponse.json({
    courses: coursesResponse,
    resources: resourcesResponse,
  });
}
