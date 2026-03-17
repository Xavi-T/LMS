import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const createPassword = () => Math.random().toString(36).slice(-10) + "@2026";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const fullName = body?.fullName as string | undefined;
  const emailInput = body?.email as string | undefined;
  const phone = body?.phone as string | undefined;
  const courseSlug = body?.courseSlug as string | undefined;
  const orderId = body?.orderId as string | undefined;
  const transferNote = body?.transferNote as string | undefined;

  if (!courseSlug || !orderId || !transferNote) {
    return NextResponse.json(
      { error: "courseSlug, orderId, transferNote are required" },
      { status: 400 },
    );
  }

  const email =
    emailInput && emailInput.includes("@")
      ? emailInput
      : `${phone ?? "hocvien"}@sportprint.local`;
  const password = createPassword();

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({
      email,
      password,
      emailStatus: "queued-local",
      message:
        "SUPABASE_SERVICE_ROLE_KEY chưa cấu hình, tài khoản được cấp ở chế độ mock.",
    });
  }

  const { error: accountError } = await supabase
    .from("customer_accounts")
    .upsert(
      {
        email,
        phone,
        full_name: fullName,
        plain_password: password,
        course_slug: courseSlug,
        order_ref: orderId,
        status: "active",
      },
      { onConflict: "email" },
    );

  if (accountError) {
    return NextResponse.json({ error: accountError.message }, { status: 500 });
  }

  const { error: emailLogError } = await supabase
    .from("email_delivery_logs")
    .insert({
      email,
      subject: "Tài khoản học tập SPORTPRINT LMS",
      body:
        `Xin chào ${fullName ?? "Học viên"}, tài khoản học tập của bạn đã được kích hoạt. ` +
        `Email: ${email} | Mật khẩu: ${password} | Mã đơn: ${orderId} | Nội dung CK: ${transferNote}`,
      status: "queued",
    });

  if (emailLogError) {
    return NextResponse.json({ error: emailLogError.message }, { status: 500 });
  }

  await supabase
    .from("facebook_leads")
    .update({ status: "paid" })
    .or(`email.eq.${email},phone.eq.${phone ?? ""}`);

  return NextResponse.json({
    email,
    password,
    emailStatus: "queued",
    message: "Đã tạo tài khoản và đưa email vào hàng đợi gửi tự động.",
  });
}
