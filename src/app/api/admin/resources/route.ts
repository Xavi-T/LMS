import { NextRequest, NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/auth/admin";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const parseBody = async (request: NextRequest) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const validFileTypes = [".CDR", ".AI", ".PSD"] as const;
type FileType = (typeof validFileTypes)[number];

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
      "id, course_id, title, description, file_type, preview_image, storage_path",
    )
    .order("title", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resources: data ?? [] });
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const courseId = body?.courseId as string | undefined;
  const title = body?.title as string | undefined;
  const description = body?.description as string | undefined;
  const fileType = body?.fileType as FileType | undefined;
  const previewImage = body?.previewImage as string | undefined;
  const storagePath = body?.storagePath as string | undefined;

  if (!courseId || !title || !fileType || !storagePath) {
    return NextResponse.json(
      { error: "courseId, title, fileType, storagePath là bắt buộc." },
      { status: 400 },
    );
  }

  if (!validFileTypes.includes(fileType)) {
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

  const { data, error } = await supabase
    .from("course_resources")
    .insert({
      course_id: courseId,
      title: title.trim(),
      description: description?.trim() || null,
      file_type: fileType,
      preview_image: previewImage?.trim() || null,
      storage_path: storagePath.trim(),
    })
    .select(
      "id, course_id, title, description, file_type, preview_image, storage_path",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resource: data });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const id = body?.id as string | undefined;
  const title = body?.title as string | undefined;
  const description = body?.description as string | undefined;
  const fileType = body?.fileType as FileType | undefined;
  const previewImage = body?.previewImage as string | undefined;
  const storagePath = body?.storagePath as string | undefined;

  if (!id) {
    return NextResponse.json({ error: "id là bắt buộc." }, { status: 400 });
  }

  const updatePayload: {
    title?: string;
    description?: string | null;
    file_type?: FileType;
    preview_image?: string | null;
    storage_path?: string;
  } = {};

  if (typeof title === "string" && title.trim()) {
    updatePayload.title = title.trim();
  }
  if (typeof description === "string") {
    updatePayload.description = description.trim() || null;
  }
  if (fileType) {
    if (!validFileTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "fileType không hợp lệ." },
        { status: 400 },
      );
    }
    updatePayload.file_type = fileType;
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
      "id, course_id, title, description, file_type, preview_image, storage_path",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
