import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const defaultAdminEmail = "admin@sportprint.vn";
const defaultAdminPassword = "Admin@123456";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const emailRaw = body?.email as string | undefined;
  const password = body?.password as string | undefined;

  if (!emailRaw || !password) {
    return NextResponse.json(
      { error: "Email và mật khẩu là bắt buộc." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(emailRaw);
  const adminEmail = (
    process.env.ADMIN_EMAIL || defaultAdminEmail
  ).toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || defaultAdminPassword;

  if (email === adminEmail) {
    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "Sai tài khoản hoặc mật khẩu." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      user: {
        id: `admin-${email}`,
        name: "Admin SportPrint",
        email,
        role: "admin",
      },
    });

    response.cookies.set("lms_role", "admin", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set("lms_admin_email", email, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình." },
      { status: 500 },
    );
  }

  const { data: account, error } = await supabase
    .from("customer_accounts")
    .select("id, full_name, email, phone, plain_password, status")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!account || account.plain_password !== password) {
    return NextResponse.json(
      { error: "Sai tài khoản hoặc mật khẩu." },
      { status: 401 },
    );
  }

  if (account.status !== "active") {
    return NextResponse.json(
      { error: "Tài khoản đang bị khóa, vui lòng liên hệ hỗ trợ." },
      { status: 403 },
    );
  }

  const response = NextResponse.json({
    user: {
      id: account.id,
      name: account.full_name || account.email.split("@")[0] || "Học viên",
      email: account.email,
      phone: account.phone,
      role: "student",
    },
  });

  response.cookies.set("lms_role", "student", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.delete("lms_admin_email");

  return response;
}
