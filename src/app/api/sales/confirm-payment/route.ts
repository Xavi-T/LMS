import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { sendAccountEmailViaEmailJs } from "@/lib/email/emailjs";

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

  if (!emailInput || !emailInput.includes("@")) {
    return NextResponse.json(
      { error: "Email hợp lệ là bắt buộc để cấp tài khoản học viên." },
      { status: 400 },
    );
  }

  const email = emailInput.trim().toLowerCase();
  const password = createPassword();

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({
      email,
      password,
      emailStatus: "queued-local",
      message:
        "SUPABASE_SERVICE_ROLE_KEY chưa cấu hình, tài khoản được cấp ở chế độ local.",
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
    .from("enrollment_requests")
    .update({ status: "paid" })
    .eq("order_ref", orderId);

  const emailSendResult = await sendAccountEmailViaEmailJs({
    toEmail: email,
    studentName: fullName ?? "Học viên",
    courseSlug: courseSlug,
    loginEmail: email,
    loginPassword: password,
    orderRef: orderId,
    transferNote,
    source: "checkout",
  });

  if (emailSendResult.sent) {
    await supabase
      .from("email_delivery_logs")
      .update({ status: "sent" })
      .eq("email", email)
      .eq("subject", "Tài khoản học tập SPORTPRINT LMS")
      .eq("status", "queued");
  } else {
    await supabase
      .from("email_delivery_logs")
      .update({
        status: "failed",
        body:
          `Xin chào ${fullName ?? "Học viên"}, tài khoản học tập của bạn đã được kích hoạt. ` +
          `Email: ${email} | Mật khẩu: ${password} | Mã đơn: ${orderId} | Nội dung CK: ${transferNote} | EmailJS error: ${emailSendResult.error}`,
      })
      .eq("email", email)
      .eq("subject", "Tài khoản học tập SPORTPRINT LMS")
      .eq("status", "queued");
  }

  return NextResponse.json({
    email,
    password,
    emailStatus: emailSendResult.sent ? "sent" : "failed",
    message: emailSendResult.sent
      ? "Đã tạo tài khoản và gửi email thành công qua EmailJS."
      : "Đã tạo tài khoản nhưng gửi email thất bại, vui lòng kiểm tra cấu hình EmailJS.",
    emailError: emailSendResult.error,
  });
}
