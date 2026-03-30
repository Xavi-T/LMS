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

type FileType = string;

const normalizeFileType = (value: string) => {
  const cleaned = value.trim().toUpperCase();
  if (!cleaned) return null;
  const withDot = cleaned.startsWith(".") ? cleaned : `.${cleaned}`;
  return /^\.[A-Z0-9]{1,12}$/.test(withDot) ? withDot : null;
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

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("course_resources")
    .select(
      "id, course_id, lesson_id, title, description, file_type, preview_image, storage_path",
    )
    .order("title", { ascending: true });

  if (hasMissingLessonIdColumn(error)) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("course_resources")
      .select(
        "id, course_id, title, description, file_type, preview_image, storage_path",
      )
      .order("title", { ascending: true });

    if (fallbackError) {
      return NextResponse.json(
        { error: formatSupabaseError(fallbackError) },
        { status: 500 },
      );
    }

    return NextResponse.json({
      resources: (fallbackData ?? []).map((item) => ({
        ...item,
        lesson_id: null,
      })),
    });
  }

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ resources: data ?? [] });
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const courseId = body?.courseId as string | undefined;
  const lessonId = body?.lessonId as string | undefined;
  const title = body?.title as string | undefined;
  const description = body?.description as string | undefined;
  const fileType = body?.fileType as FileType | undefined;
  const previewImage = body?.previewImage as string | undefined;
  const storagePath = body?.storagePath as string | undefined;

  if ((!courseId && !lessonId) || !title || !fileType || !storagePath) {
    return NextResponse.json(
      {
        error:
          "courseId hoặc lessonId, title, fileType, storagePath là bắt buộc.",
      },
      { status: 400 },
    );
  }

  const normalizedFileType = normalizeFileType(fileType);
  if (!normalizedFileType) {
    return NextResponse.json(
      { error: "fileType không hợp lệ." },
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

  let resolvedCourseId = courseId;

  if (lessonId) {
    const { data: lessonRow, error: lessonError } = await supabase
      .from("lessons")
      .select("chapter_id")
      .eq("id", lessonId)
      .maybeSingle();

    if (lessonError) {
      return NextResponse.json(
        { error: formatSupabaseError(lessonError) },
        { status: 500 },
      );
    }

    if (!lessonRow) {
      return NextResponse.json(
        { error: "lessonId không tồn tại." },
        { status: 400 },
      );
    }

    const { data: chapterRow, error: chapterError } = await supabase
      .from("chapters")
      .select("course_id")
      .eq("id", lessonRow.chapter_id)
      .maybeSingle();

    if (chapterError) {
      return NextResponse.json(
        { error: formatSupabaseError(chapterError) },
        { status: 500 },
      );
    }

    if (!chapterRow?.course_id) {
      return NextResponse.json(
        { error: "Không tìm được course cho lessonId đã chọn." },
        { status: 400 },
      );
    }

    resolvedCourseId = chapterRow.course_id;
  }

  if (!resolvedCourseId) {
    return NextResponse.json(
      { error: "Không xác định được courseId hợp lệ." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("course_resources")
    .insert({
      course_id: resolvedCourseId,
      lesson_id: lessonId ?? null,
      title: title.trim(),
      description: description?.trim() || null,
      file_type: normalizedFileType,
      preview_image: previewImage?.trim() || null,
      storage_path: storagePath.trim(),
    })
    .select(
      "id, course_id, lesson_id, title, description, file_type, preview_image, storage_path",
    )
    .single();

  if (hasMissingLessonIdColumn(error)) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("course_resources")
      .insert({
        course_id: resolvedCourseId,
        title: title.trim(),
        description: description?.trim() || null,
        file_type: normalizedFileType,
        preview_image: previewImage?.trim() || null,
        storage_path: storagePath.trim(),
      })
      .select(
        "id, course_id, title, description, file_type, preview_image, storage_path",
      )
      .single();

    if (fallbackError) {
      return NextResponse.json(
        { error: formatSupabaseError(fallbackError) },
        { status: 500 },
      );
    }

    return NextResponse.json({
      resource: {
        ...(fallbackData as {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          file_type: string;
          preview_image: string | null;
          storage_path: string;
        }),
        lesson_id: null,
      },
    });
  }

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ resource: data });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const id = body?.id as string | undefined;
  const lessonId = body?.lessonId as string | null | undefined;
  const title = body?.title as string | undefined;
  const description = body?.description as string | undefined;
  const fileType = body?.fileType as FileType | undefined;
  const previewImage = body?.previewImage as string | undefined;
  const storagePath = body?.storagePath as string | undefined;

  if (!id) {
    return NextResponse.json({ error: "id là bắt buộc." }, { status: 400 });
  }

  const updatePayload: {
    lesson_id?: string | null;
    title?: string;
    description?: string | null;
    file_type?: FileType;
    preview_image?: string | null;
    storage_path?: string;
  } = {};

  if (typeof title === "string" && title.trim()) {
    updatePayload.title = title.trim();
  }
  if (typeof lessonId === "string") {
    updatePayload.lesson_id = lessonId || null;
  }
  if (lessonId === null) {
    updatePayload.lesson_id = null;
  }
  if (typeof description === "string") {
    updatePayload.description = description.trim() || null;
  }
  if (fileType) {
    const normalizedFileType = normalizeFileType(fileType);
    if (!normalizedFileType) {
      return NextResponse.json(
        { error: "fileType không hợp lệ." },
        { status: 400 },
      );
    }
    updatePayload.file_type = normalizedFileType;
  }
  if (typeof previewImage === "string") {
    updatePayload.preview_image = previewImage.trim() || null;
  }
  if (typeof storagePath === "string" && storagePath.trim()) {
    updatePayload.storage_path = storagePath.trim();
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { error: "Không có dữ liệu cập nhật hợp lệ." },
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

  const { data, error } = await supabase
    .from("course_resources")
    .update(updatePayload)
    .eq("id", id)
    .select(
      "id, course_id, lesson_id, title, description, file_type, preview_image, storage_path",
    )
    .single();

  if (hasMissingLessonIdColumn(error)) {
    const fallbackPayload = { ...updatePayload };
    delete fallbackPayload.lesson_id;

    if (Object.keys(fallbackPayload).length === 0) {
      return NextResponse.json(
        { error: "Database chưa hỗ trợ lesson_id cho tài liệu." },
        { status: 400 },
      );
    }

    const { data: fallbackData, error: fallbackError } = await supabase
      .from("course_resources")
      .update(fallbackPayload)
      .eq("id", id)
      .select(
        "id, course_id, title, description, file_type, preview_image, storage_path",
      )
      .single();

    if (fallbackError) {
      return NextResponse.json(
        { error: formatSupabaseError(fallbackError) },
        { status: 500 },
      );
    }

    return NextResponse.json({
      resource: {
        ...(fallbackData as {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          file_type: string;
          preview_image: string | null;
          storage_path: string;
        }),
        lesson_id: null,
      },
    });
  }

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ resource: data });
}

export async function DELETE(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const resourceId = request.nextUrl.searchParams.get("id");
  if (!resourceId) {
    return NextResponse.json({ error: "id là bắt buộc." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình." },
      { status: 500 },
    );
  }

  const { error } = await supabase
    .from("course_resources")
    .delete()
    .eq("id", resourceId);

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
