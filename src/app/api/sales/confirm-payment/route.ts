import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";

const normalizePhone = (value: string | undefined) =>
  (value ?? "").replace(/\s+/g, "").replace(/\D/g, "");

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
  const normalizedPhone = normalizePhone(phone);

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({
      emailStatus: "pending-admin",
      message:
        "SUPABASE_SERVICE_ROLE_KEY chưa cấu hình, chưa thể gửi yêu cầu phê duyệt.",
    });
  }

  let duplicateQuery = supabase
    .from("enrollment_requests")
    .select("id, order_ref")
    .eq("course_slug", courseSlug)
    .in("status", ["new", "contacted"])
    .neq("order_ref", orderId)
    .limit(1);

  if (normalizedPhone) {
    duplicateQuery = duplicateQuery.or(
      `email.eq.${email},phone.eq.${normalizedPhone}`,
    );
  } else {
    duplicateQuery = duplicateQuery.eq("email", email);
  }

  const { data: duplicate, error: duplicateError } =
    await duplicateQuery.maybeSingle();

  if (duplicateError) {
    return NextResponse.json(
      { error: formatSupabaseError(duplicateError) },
      { status: 500 },
    );
  }

  if (duplicate) {
    return NextResponse.json(
      {
        pending: true,
        requestId: duplicate.id,
        message:
          "Bạn đã có yêu cầu truy cập khóa học đang chờ phê duyệt. Vui lòng chờ admin xử lý.",
      },
      { status: 409 },
    );
  }

  const { error: requestError } = await supabase
    .from("enrollment_requests")
    .upsert(
      {
        full_name: fullName,
        email,
        phone: normalizedPhone || phone,
        package_name: null,
        course_slug: courseSlug,
        order_ref: orderId,
        transfer_note: transferNote,
        status: "contacted",
        raw_payload: body,
      },
      { onConflict: "order_ref" },
    );

  if (requestError) {
    return NextResponse.json(
      { error: formatSupabaseError(requestError) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    email,
    emailStatus: "pending-admin",
    message:
      "Đã ghi nhận thanh toán. Yêu cầu đang chờ admin phê duyệt trước khi cấp tài khoản và gửi email.",
  });
}
