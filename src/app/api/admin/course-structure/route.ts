import { NextRequest, NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/auth/admin";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";

const parseBody = async (request: NextRequest) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const hasMissingLessonIdColumn = (
  error: {
    code?: string;
    message?: string;
  } | null,
) => {
  if (!error) return false;
  if (error.code === "42703") return true;
  return (error.message ?? "").toLowerCase().includes("lesson_id");
};

export async function GET(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const courseId = request.nextUrl.searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json(
      { error: "courseId là bắt buộc." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình." },
      { status: 500 },
    );
  }

  const { data: chapters, error: chapterError } = await supabase
    .from("chapters")
    .select("id, course_id, title, position")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  if (chapterError) {
    return NextResponse.json(
      { error: formatSupabaseError(chapterError) },
      { status: 500 },
    );
  }

  const chapterIds = (chapters ?? []).map((item) => item.id);
  if (chapterIds.length === 0) {
    return NextResponse.json({ chapters: [] });
  }

  const { data: lessons, error: lessonError } = await supabase
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

  const lessonMap = new Map<string, typeof lessons>();
  for (const lesson of lessons ?? []) {
    const existing = lessonMap.get(lesson.chapter_id) ?? [];
    lessonMap.set(lesson.chapter_id, [...existing, lesson]);
  }

  const lessonIds = (lessons ?? []).map((lesson) => lesson.id);
  let lessonResources: Array<{
    id: string;
    course_id: string;
    lesson_id: string | null;
    title: string;
    description: string | null;
    file_type: string;
    preview_image: string | null;
    storage_path: string;
  }> = [];

  if (lessonIds.length > 0) {
    const { data: resourceRows, error: resourceError } = await supabase
      .from("course_resources")
      .select(
        "id, course_id, lesson_id, title, description, file_type, preview_image, storage_path",
      )
      .in("lesson_id", lessonIds)
      .order("title", { ascending: true });

    if (resourceError) {
      if (hasMissingLessonIdColumn(resourceError)) {
        lessonResources = [];
      } else {
        return NextResponse.json(
          { error: formatSupabaseError(resourceError) },
          { status: 500 },
        );
      }
    }

    if (!hasMissingLessonIdColumn(resourceError)) {
      lessonResources = resourceRows ?? [];
    }
  }

  const lessonResourceMap = new Map<string, typeof lessonResources>();
  for (const resource of lessonResources) {
    if (!resource.lesson_id) continue;
    const existing = lessonResourceMap.get(resource.lesson_id) ?? [];
    lessonResourceMap.set(resource.lesson_id, [...existing, resource]);
  }

  return NextResponse.json({
    chapters: (chapters ?? []).map((chapter) => ({
      ...chapter,
      lessons: (lessonMap.get(chapter.id) ?? []).map((lesson) => ({
        ...lesson,
        resources: lessonResourceMap.get(lesson.id) ?? [],
      })),
    })),
  });
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const entity = body?.entity as "chapter" | "lesson" | undefined;

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình." },
      { status: 500 },
    );
  }

  if (entity === "chapter") {
    const courseId = body?.courseId as string | undefined;
    const title = body?.title as string | undefined;

    if (!courseId || !title) {
      return NextResponse.json(
        { error: "courseId và title là bắt buộc để tạo chương." },
        { status: 400 },
      );
    }

    const { data: lastChapter } = await supabase
      .from("chapters")
      .select("position")
      .eq("course_id", courseId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = (lastChapter?.position ?? 0) + 1;

    const { data, error } = await supabase
      .from("chapters")
      .insert({
        course_id: courseId,
        title: title.trim(),
        position: nextPosition,
      })
      .select("id, course_id, title, position")
      .single();

    if (error) {
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: 500 },
      );
    }

    return NextResponse.json({ chapter: data });
  }

  if (entity === "lesson") {
    const chapterId = body?.chapterId as string | undefined;
    const title = body?.title as string | undefined;
    const summary = body?.summary as string | undefined;
    const videoUrl = body?.videoUrl as string | undefined;

    if (!chapterId || !title) {
      return NextResponse.json(
        {
          error: "chapterId và title là bắt buộc để tạo bài học.",
        },
        { status: 400 },
      );
    }

    const { data: lastLesson } = await supabase
      .from("lessons")
      .select("position")
      .eq("chapter_id", chapterId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = (lastLesson?.position ?? 0) + 1;

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        chapter_id: chapterId,
        title: title.trim(),
        type: "video",
        duration: "Đang cập nhật",
        summary: summary?.trim() || "Đang cập nhật mô tả bài học.",
        content: null,
        video_url: videoUrl?.trim() || null,
        position: nextPosition,
      })
      .select(
        "id, chapter_id, title, type, duration, summary, content, video_url, position",
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: 500 },
      );
    }

    return NextResponse.json({ lesson: data });
  }

  return NextResponse.json(
    { error: "entity phải là chapter hoặc lesson." },
    { status: 400 },
  );
}

export async function PATCH(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const entity = body?.entity as "chapter" | "lesson" | undefined;

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình." },
      { status: 500 },
    );
  }

  if (entity === "chapter") {
    const id = body?.id as string | undefined;
    const title = body?.title as string | undefined;

    if (!id || typeof title !== "string") {
      return NextResponse.json(
        { error: "id và title là bắt buộc để cập nhật chương." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("chapters")
      .update({ title: title.trim() })
      .eq("id", id)
      .select("id, course_id, title, position")
      .single();

    if (error) {
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: 500 },
      );
    }

    return NextResponse.json({ chapter: data });
  }

  if (entity === "lesson") {
    const id = body?.id as string | undefined;
    const title = body?.title as string | undefined;
    const type = body?.type as "video" | "text" | undefined;
    const duration = body?.duration as string | undefined;
    const summary = body?.summary as string | undefined;
    const content = body?.content as string | undefined;
    const videoUrl = body?.videoUrl as string | undefined;

    if (!id) {
      return NextResponse.json(
        { error: "id là bắt buộc để cập nhật bài học." },
        { status: 400 },
      );
    }

    const payload: {
      title?: string;
      type?: "video" | "text";
      duration?: string;
      summary?: string;
      content?: string | null;
      video_url?: string | null;
    } = {};

    if (typeof title === "string") payload.title = title.trim();
    if (type === "video" || type === "text") payload.type = type;
    if (typeof duration === "string") payload.duration = duration.trim();
    if (typeof summary === "string") payload.summary = summary.trim();
    if (typeof content === "string") payload.content = content.trim() || null;
    if (typeof videoUrl === "string")
      payload.video_url = videoUrl.trim() || null;

    if (payload.type === "text") {
      payload.video_url = null;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "Không có dữ liệu cập nhật hợp lệ." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("lessons")
      .update(payload)
      .eq("id", id)
      .select(
        "id, chapter_id, title, type, duration, summary, content, video_url, position",
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: formatSupabaseError(error) },
        { status: 500 },
      );
    }

    return NextResponse.json({ lesson: data });
  }

  return NextResponse.json(
    { error: "entity phải là chapter hoặc lesson." },
    { status: 400 },
  );
}

export async function DELETE(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const entity = request.nextUrl.searchParams.get("entity");
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id là bắt buộc." }, { status: 400 });
  }

  if (entity !== "chapter" && entity !== "lesson") {
    return NextResponse.json(
      { error: "entity phải là chapter hoặc lesson." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình." },
      { status: 500 },
    );
  }

  const tableName = entity === "chapter" ? "chapters" : "lessons";
  const { error } = await supabase.from(tableName).delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
