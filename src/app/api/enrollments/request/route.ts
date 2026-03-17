import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const fullName = body?.fullName as string | undefined;
  const email = body?.email as string | undefined;
  const phone = body?.phone as string | undefined;
  const packageName = body?.packageName as string | undefined;
  const courseSlug = body?.courseSlug as string | undefined;
  const orderRef = body?.orderRef as string | undefined;
  const transferNote = body?.transferNote as string | undefined;

  if (
    !fullName ||
    !email ||
    !email.includes("@") ||
    !courseSlug ||
    !orderRef ||
    !transferNote
  ) {
    return NextResponse.json(
      {
        error:
          "fullName, email hợp lệ, courseSlug, orderRef, transferNote là bắt buộc",
      },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServiceClient();
  const requestId = `req-${Date.now()}`;

  if (!supabase) {
    return NextResponse.json({
      requestId,
      status: "queued-local",
      message:
        "Supabase service role key chưa cấu hình, yêu cầu đang lưu local.",
    });
  }

  const { data, error } = await supabase
    .from("enrollment_requests")
    .upsert(
      {
        full_name: fullName,
        email: email.trim().toLowerCase(),
        phone,
        package_name: packageName,
        course_slug: courseSlug,
        order_ref: orderRef,
        transfer_note: transferNote,
        status: "new",
        raw_payload: body,
      },
      { onConflict: "order_ref" },
    )
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({ requestId: data.id, status: "saved" });
}
