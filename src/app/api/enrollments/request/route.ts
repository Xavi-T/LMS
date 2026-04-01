import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";

const normalizeEmail = (value: string | undefined) =>
  (value ?? "").trim().toLowerCase();

const normalizePhone = (value: string | undefined) =>
  (value ?? "").replace(/\s+/g, "").replace(/\D/g, "");

const findPendingRequest = async (
  supabase: NonNullable<ReturnType<typeof getSupabaseServiceClient>>,
  params: {
    email: string;
    phone: string;
    courseSlug: string;
  },
) => {
  let query = supabase
    .from("enrollment_requests")
    .select(
      "id, full_name, email, phone, course_slug, order_ref, status, created_at",
    )
    .eq("course_slug", params.courseSlug)
    .in("status", ["new", "contacted"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (params.email && params.phone) {
    query = query.or(`email.eq.${params.email},phone.eq.${params.phone}`);
  } else if (params.email) {
    query = query.eq("email", params.email);
  } else if (params.phone) {
    query = query.eq("phone", params.phone);
  }

  return query.maybeSingle();
};

export async function GET(request: NextRequest) {
  const email = normalizeEmail(request.nextUrl.searchParams.get("email") ?? "");
  const phone = normalizePhone(request.nextUrl.searchParams.get("phone") ?? "");
  const courseSlug = (request.nextUrl.searchParams.get("courseSlug") ?? "")
    .trim()
    .toLowerCase();

  if (!courseSlug || (!email && !phone)) {
    return NextResponse.json({ hasPending: false, request: null });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ hasPending: false, request: null });
  }

  const { data, error } = await findPendingRequest(supabase, {
    email,
    phone,
    courseSlug,
  });

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    hasPending: Boolean(data),
    request: data ?? null,
    message: data ? "Yêu cầu truy cập khóa học đang chờ phê duyệt." : undefined,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const fullName = body?.fullName as string | undefined;
  const email = normalizeEmail(body?.email as string | undefined);
  const phone = body?.phone as string | undefined;
  const packageName = body?.packageName as string | undefined;
  const courseSlug = (body?.courseSlug as string | undefined)
    ?.trim()
    .toLowerCase();
  const orderRef = body?.orderRef as string | undefined;
  const transferNote = body?.transferNote as string | undefined;
  const normalizedPhone = normalizePhone(phone);

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

  const { data: pendingRequest, error: pendingError } =
    await findPendingRequest(supabase, {
      email,
      phone: normalizedPhone,
      courseSlug,
    });

  if (pendingError) {
    return NextResponse.json(
      { error: formatSupabaseError(pendingError) },
      { status: 500 },
    );
  }

  if (pendingRequest) {
    return NextResponse.json(
      {
        pending: true,
        requestId: pendingRequest.id,
        status: pendingRequest.status,
        message:
          "Bạn đã có yêu cầu truy cập khóa học đang chờ phê duyệt. Vui lòng chờ admin xử lý.",
      },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("enrollment_requests")
    .upsert(
      {
        full_name: fullName,
        email,
        phone: normalizedPhone || phone,
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
