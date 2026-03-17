import { NextRequest, NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/auth/admin";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";

const selectFields =
  "id, slug, title, short_description, detailed_description, category, level, price, students_count, rating, is_best_seller, thumbnail, intro_video_url, created_at";

const parseBody = async (request: NextRequest) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
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
    .from("courses")
    .select(selectFields)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ courses: data ?? [] });
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const slug = body?.slug as string | undefined;
  const title = body?.title as string | undefined;
  const shortDescription = body?.shortDescription as string | undefined;
  const detailedDescription = body?.detailedDescription as string | undefined;
  const category = body?.category as
    | "in-an"
    | "thiet-ke"
    | "kinh-doanh"
    | undefined;
  const level = body?.level as "Cơ bản" | "Nâng cao" | undefined;
  const price = body?.price as number | undefined;
  const thumbnail = body?.thumbnail as string | undefined;
  const introVideoUrl = body?.introVideoUrl as string | undefined;

  if (
    !slug ||
    !title ||
    !shortDescription ||
    !level ||
    typeof price !== "number"
  ) {
    return NextResponse.json(
      {
        error:
          "slug, title, shortDescription, level, price là bắt buộc khi tạo khóa học.",
      },
      { status: 400 },
    );
  }

  if (!["in-an", "thiet-ke", "kinh-doanh"].includes(category ?? "")) {
    return NextResponse.json(
      { error: "category không hợp lệ." },
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

  const normalizedSlug = slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

  const { data, error } = await supabase
    .from("courses")
    .insert({
      slug: normalizedSlug,
      title: title.trim(),
      short_description: shortDescription.trim(),
      detailed_description:
        detailedDescription?.trim() || shortDescription.trim(),
      category,
      level,
      is_best_seller: false,
      students_count: 0,
      rating: 0,
      price: Math.max(0, Math.round(price)),
      thumbnail: thumbnail?.trim() || "/images/course-placeholder.jpg",
      intro_video_url: introVideoUrl?.trim() || null,
      instructor_name: "Đang cập nhật",
      instructor_title: "Giảng viên",
      instructor_avatar: null,
      instructor_bio: "Đang cập nhật thông tin giảng viên.",
    })
    .select(selectFields)
    .single();

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ course: data });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const id = body?.id as string | undefined;
  const title = body?.title as string | undefined;
  const shortDescription = body?.shortDescription as string | undefined;
  const detailedDescription = body?.detailedDescription as string | undefined;
  const category = body?.category as
    | "in-an"
    | "thiet-ke"
    | "kinh-doanh"
    | undefined;
  const level = body?.level as "Cơ bản" | "Nâng cao" | undefined;
  const price = body?.price as number | undefined;
  const isBestSeller = body?.isBestSeller as boolean | undefined;
  const thumbnail = body?.thumbnail as string | undefined;
  const introVideoUrl = body?.introVideoUrl as string | null | undefined;

  if (!id) {
    return NextResponse.json({ error: "id là bắt buộc." }, { status: 400 });
  }

  const updatePayload: {
    title?: string;
    short_description?: string;
    detailed_description?: string;
    category?: "in-an" | "thiet-ke" | "kinh-doanh";
    level?: "Cơ bản" | "Nâng cao";
    price?: number;
    is_best_seller?: boolean;
    thumbnail?: string;
    intro_video_url?: string | null;
  } = {};

  if (typeof title === "string" && title.trim()) {
    updatePayload.title = title.trim();
  }
  if (typeof shortDescription === "string") {
    updatePayload.short_description = shortDescription.trim();
  }
  if (typeof detailedDescription === "string") {
    updatePayload.detailed_description = detailedDescription.trim();
  }
  if (
    category === "in-an" ||
    category === "thiet-ke" ||
    category === "kinh-doanh"
  ) {
    updatePayload.category = category;
  }
  if (level === "Cơ bản" || level === "Nâng cao") {
    updatePayload.level = level;
  }
  if (typeof price === "number" && Number.isFinite(price) && price >= 0) {
    updatePayload.price = Math.round(price);
  }
  if (typeof isBestSeller === "boolean") {
    updatePayload.is_best_seller = isBestSeller;
  }
  if (typeof thumbnail === "string") {
    updatePayload.thumbnail = thumbnail.trim();
  }
  if (typeof introVideoUrl === "string") {
    updatePayload.intro_video_url = introVideoUrl.trim() || null;
  }
  if (introVideoUrl === null) {
    updatePayload.intro_video_url = null;
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
    .from("courses")
    .update(updatePayload)
    .eq("id", id)
    .select(selectFields)
    .single();

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ course: data });
}
