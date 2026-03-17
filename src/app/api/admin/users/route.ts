import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ensureAdminRequest } from "@/lib/auth/admin";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const createPassword = () => Math.random().toString(36).slice(-10) + "@2026";

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
    .from("customer_accounts")
    .select(
      "id, full_name, email, phone, course_slug, plain_password, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const emailRaw = body?.email as string | undefined;
  const fullName = body?.fullName as string | undefined;
  const phone = body?.phone as string | undefined;
  const courseSlug = body?.courseSlug as string | undefined;
  const password = (body?.password as string | undefined) || createPassword();

  if (!emailRaw || !courseSlug) {
    return NextResponse.json(
      { error: "Email và courseSlug là bắt buộc." },
      { status: 400 },
    );
  }

  if (!emailRaw.includes("@")) {
    return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình." },
      { status: 500 },
    );
  }

  const payload = {
    email: normalizeEmail(emailRaw),
    full_name: fullName || null,
    phone: phone || null,
    course_slug: courseSlug,
    plain_password: password,
    status: "active",
  };

  const { data, error } = await supabase
    .from("customer_accounts")
    .upsert(payload, { onConflict: "email" })
    .select("id, full_name, email, phone, course_slug, status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data, generatedPassword: password });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const id = body?.id as string | undefined;
  const status = body?.status as "active" | "blocked" | undefined;
  const fullName = body?.fullName as string | undefined;
  const phone = body?.phone as string | undefined;
  const courseSlug = body?.courseSlug as string | undefined;
  const resetPassword = body?.resetPassword as boolean | undefined;

  if (!id) {
    return NextResponse.json({ error: "id là bắt buộc." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình." },
      { status: 500 },
    );
  }

  const updatePayload: {
    status?: "active" | "blocked";
    full_name?: string | null;
    phone?: string | null;
    course_slug?: string;
    plain_password?: string;
  } = {};

  if (status) updatePayload.status = status;
  if (typeof fullName === "string") updatePayload.full_name = fullName || null;
  if (typeof phone === "string") updatePayload.phone = phone || null;
  if (typeof courseSlug === "string" && courseSlug) {
    updatePayload.course_slug = courseSlug;
  }

  let generatedPassword: string | undefined;
  if (resetPassword) {
    generatedPassword = createPassword();
    updatePayload.plain_password = generatedPassword;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { error: "Không có dữ liệu cập nhật hợp lệ." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("customer_accounts")
    .update(updatePayload)
    .eq("id", id)
    .select(
      "id, full_name, email, phone, course_slug, plain_password, status, created_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data, generatedPassword });
}
