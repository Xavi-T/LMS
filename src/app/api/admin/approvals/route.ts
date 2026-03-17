import { NextRequest, NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/auth/admin";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { sendAccountEmailViaEmailJs } from "@/lib/email/emailjs";
import { formatSupabaseError } from "@/lib/supabase/errors";

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
    .from("enrollment_requests")
    .select(
      "id, full_name, email, phone, package_name, course_slug, order_ref, transfer_note, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ requests: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const requestId = body?.requestId as string | undefined;
  const status = body?.status as
    | "new"
    | "contacted"
    | "paid"
    | "closed"
    | undefined;

  if (!requestId || !status) {
    return NextResponse.json(
      { error: "requestId và status là bắt buộc." },
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
    .from("enrollment_requests")
    .update({ status })
    .eq("id", requestId)
    .select(
      "id, full_name, email, phone, package_name, course_slug, order_ref, transfer_note, status, created_at",
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ request: data });
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const body = await parseBody(request);
  const requestId = body?.requestId as string | undefined;

  if (!requestId) {
    return NextResponse.json(
      { error: "requestId là bắt buộc." },
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

  const { data: requestRow, error: requestError } = await supabase
    .from("enrollment_requests")
    .select(
      "id, full_name, email, phone, course_slug, order_ref, transfer_note, status",
    )
    .eq("id", requestId)
    .single();

  if (requestError) {
    return NextResponse.json(
      { error: formatSupabaseError(requestError) },
      { status: 500 },
    );
  }

  if (!requestRow.email || !requestRow.email.includes("@")) {
    return NextResponse.json(
      { error: "Yêu cầu chưa có email hợp lệ để cấp tài khoản." },
      { status: 400 },
    );
  }

  if (!requestRow.course_slug) {
    return NextResponse.json(
      { error: "Yêu cầu chưa có course_slug để cấp tài khoản." },
      { status: 400 },
    );
  }

  const generatedPassword = createPassword();
  const email = requestRow.email.trim().toLowerCase();

  const { error: accountError } = await supabase
    .from("customer_accounts")
    .upsert(
      {
        email,
        phone: requestRow.phone,
        full_name: requestRow.full_name,
        plain_password: generatedPassword,
        course_slug: requestRow.course_slug,
        order_ref: requestRow.order_ref || `APPROVE-${requestRow.id}`,
        status: "active",
      },
      { onConflict: "email" },
    );

  if (accountError) {
    return NextResponse.json(
      { error: formatSupabaseError(accountError) },
      { status: 500 },
    );
  }

  const { error: requestUpdateError } = await supabase
    .from("enrollment_requests")
    .update({ status: "paid" })
    .eq("id", requestRow.id);

  if (requestUpdateError) {
    return NextResponse.json(
      { error: formatSupabaseError(requestUpdateError) },
      { status: 500 },
    );
  }

  const emailSubject = "Tài khoản học tập SPORTPRINT LMS (Admin phê duyệt)";
  const emailBody =
    `Xin chào ${requestRow.full_name ?? "Học viên"}, tài khoản học tập của bạn đã được admin phê duyệt. ` +
    `Email: ${email} | Mật khẩu: ${generatedPassword} | Nguồn: admin approval`;

  await supabase.from("email_delivery_logs").insert({
    email,
    subject: emailSubject,
    body: emailBody,
    status: "queued",
  });

  const emailSendResult = await sendAccountEmailViaEmailJs({
    toEmail: email,
    studentName: requestRow.full_name ?? "Học viên",
    courseSlug: requestRow.course_slug,
    loginEmail: email,
    loginPassword: generatedPassword,
    orderRef: requestRow.order_ref || `APPROVE-${requestRow.id}`,
    transferNote: requestRow.transfer_note || undefined,
    source: "admin-approval",
  });

  if (emailSendResult.sent) {
    await supabase
      .from("email_delivery_logs")
      .update({ status: "sent" })
      .eq("email", email)
      .eq("subject", emailSubject)
      .eq("status", "queued");
  } else {
    await supabase
      .from("email_delivery_logs")
      .update({
        status: "failed",
        body: `${emailBody} | EmailJS error: ${emailSendResult.error}`,
      })
      .eq("email", email)
      .eq("subject", emailSubject)
      .eq("status", "queued");
  }

  return NextResponse.json({
    approved: true,
    credential: {
      email,
      password: generatedPassword,
      courseSlug: requestRow.course_slug,
    },
    emailStatus: emailSendResult.sent ? "sent" : "failed",
    emailError: emailSendResult.error,
  });
}
