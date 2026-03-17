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
    .select(
      "id, slug, title, short_description, level, price, students_count, rating, is_best_seller",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ courses: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const id = body?.id as string | undefined;
  const title = body?.title as string | undefined;
  const shortDescription = body?.shortDescription as string | undefined;
  const level = body?.level as "Cơ bản" | "Nâng cao" | undefined;
  const price = body?.price as number | undefined;
  const isBestSeller = body?.isBestSeller as boolean | undefined;

  if (!id) {
    return NextResponse.json({ error: "id là bắt buộc." }, { status: 400 });
  }

  const updatePayload: {
    title?: string;
    short_description?: string;
    level?: "Cơ bản" | "Nâng cao";
    price?: number;
    is_best_seller?: boolean;
  } = {};

  if (typeof title === "string" && title.trim()) {
    updatePayload.title = title.trim();
  }
  if (typeof shortDescription === "string") {
    updatePayload.short_description = shortDescription.trim();
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
    .select(
      "id, slug, title, short_description, level, price, students_count, rating, is_best_seller",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ course: data });
}
