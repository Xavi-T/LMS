import { NextRequest, NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/auth/admin";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { sendAccountEmailViaEmailJs } from "@/lib/email/emailjs";
import { formatSupabaseError } from "@/lib/supabase/errors";

const createPassword = () => Math.random().toString(36).slice(-10) + "@2026";
const parseCourseSlugs = (value: string | null | undefined) => {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const serializeCourseSlugs = (items: string[]) =>
  Array.from(
    new Set(items.map((item) => item.trim().toLowerCase()).filter(Boolean)),
  ).join(",");

const normalizeEmail = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

type ApprovalFlow =
  | "provision-account"
  | "grant-course-access"
  | "already-granted"
  | "invalid";

const sendAndTrackEmail = async (
  supabase: NonNullable<ReturnType<typeof getSupabaseServiceClient>>,
  params: {
    email: string;
    subject: string;
    body: string;
    studentName: string;
    courseSlug: string;
    loginEmail: string;
    loginPassword: string;
    orderRef: string;
    transferNote?: string;
    source:
      | "admin-approval"
      | "admin-account-provision"
      | "admin-course-access";
  },
) => {
  const { data: logRow, error: logInsertError } = await supabase
    .from("email_delivery_logs")
    .insert({
      email: params.email,
      subject: params.subject,
      body: params.body,
      status: "queued",
    })
    .select("id")
    .single();

  if (logInsertError) {
    return {
      sent: false,
      error: formatSupabaseError(logInsertError),
    };
  }

  const sendResult = await sendAccountEmailViaEmailJs({
    toEmail: params.email,
    studentName: params.studentName,
    courseSlug: params.courseSlug,
    loginEmail: params.loginEmail,
    loginPassword: params.loginPassword,
    orderRef: params.orderRef,
    transferNote: params.transferNote,
    emailSubject: params.subject,
    emailBody: params.body,
    source: params.source,
  });

  if (sendResult.sent) {
    await supabase
      .from("email_delivery_logs")
      .update({ status: "sent" })
      .eq("id", logRow.id);
  } else {
    await supabase
      .from("email_delivery_logs")
      .update({
        status: "failed",
        body: `${params.body} | EmailJS error: ${sendResult.error}`,
      })
      .eq("id", logRow.id);
  }

  return {
    sent: sendResult.sent,
    error: sendResult.error,
  };
};

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

  const requests = data ?? [];
  const requestEmails = Array.from(
    new Set(
      requests
        .map((item) => normalizeEmail(item.email))
        .filter((item) => item.includes("@")),
    ),
  );

  const accountMap = new Map<string, { course_slug: string }>();
  if (requestEmails.length > 0) {
    const { data: accounts, error: accountError } = await supabase
      .from("customer_accounts")
      .select("email, course_slug")
      .in("email", requestEmails);

    if (accountError) {
      return NextResponse.json(
        { error: formatSupabaseError(accountError) },
        { status: 500 },
      );
    }

    for (const account of accounts ?? []) {
      const accountEmail = normalizeEmail(account.email);
      if (!accountEmail) continue;
      accountMap.set(accountEmail, { course_slug: account.course_slug });
    }
  }

  const requestsWithFlow = requests.map((item) => {
    const email = normalizeEmail(item.email);
    const courseSlug = (item.course_slug ?? "").trim().toLowerCase();
    const account = accountMap.get(email);

    let flow: ApprovalFlow = "invalid";
    if (email.includes("@") && courseSlug) {
      if (!account) {
        flow = "provision-account";
      } else {
        const ownedCourses = parseCourseSlugs(account.course_slug);
        flow = ownedCourses.includes(courseSlug)
          ? "already-granted"
          : "grant-course-access";
      }
    }

    return {
      ...item,
      approval_flow: flow,
      has_account: Boolean(account),
    };
  });

  return NextResponse.json({ requests: requestsWithFlow });
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
  const action = body?.action as
    | "provision-account"
    | "grant-course-access"
    | undefined;

  if (!requestId) {
    return NextResponse.json(
      { error: "requestId là bắt buộc." },
      { status: 400 },
    );
  }

  if (!action) {
    return NextResponse.json(
      {
        error:
          "action là bắt buộc và phải là provision-account hoặc grant-course-access.",
      },
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

  const email = normalizeEmail(requestRow.email);

  const { data: existingAccount, error: existingAccountError } = await supabase
    .from("customer_accounts")
    .select("id, plain_password, course_slug")
    .ilike("email", email)
    .maybeSingle();

  if (existingAccountError) {
    return NextResponse.json(
      { error: formatSupabaseError(existingAccountError) },
      { status: 500 },
    );
  }

  const requestedCourse = requestRow.course_slug.trim().toLowerCase();
  const currentOwnedCourses = parseCourseSlugs(existingAccount?.course_slug);
  const alreadyGranted = requestedCourse
    ? currentOwnedCourses.includes(requestedCourse)
    : false;

  let accountPassword = existingAccount?.plain_password ?? "";
  const emailResults: Array<{ sent: boolean; error?: string }> = [];
  const studentName = requestRow.full_name ?? "Học viên";
  const orderRef = requestRow.order_ref || `APPROVE-${requestRow.id}`;
  const transferNote = requestRow.transfer_note || undefined;

  if (action === "provision-account") {
    if (existingAccount) {
      return NextResponse.json(
        {
          error:
            "Email này đã có tài khoản. Hãy dùng hành động cấp quyền truy cập khóa học.",
        },
        { status: 400 },
      );
    }

    accountPassword = createPassword();
    const { error: accountError } = await supabase
      .from("customer_accounts")
      .insert({
        email,
        phone: requestRow.phone,
        full_name: requestRow.full_name,
        plain_password: accountPassword,
        course_slug: "",
        order_ref: requestRow.order_ref || `APPROVE-${requestRow.id}`,
        status: "active",
      });

    if (accountError) {
      return NextResponse.json(
        { error: formatSupabaseError(accountError) },
        { status: 500 },
      );
    }

    const accountSubject = "Tài khoản học tập SPORTPRINT LMS đã được tạo";
    const accountBody = [
      `Xin chào ${studentName},`,
      "",
      "Admin đã phê duyệt và tạo tài khoản học tập cho bạn.",
      `Email đăng nhập: ${email}`,
      `Mật khẩu tạm thời: ${accountPassword}`,
      "",
      "Bạn có thể đăng nhập ngay để kiểm tra tài khoản.",
      "Quyền truy cập khóa học sẽ được cấp ở bước phê duyệt tiếp theo.",
      "",
      `Mã tham chiếu: ${orderRef}`,
    ].join("\n");

    emailResults.push(
      await sendAndTrackEmail(supabase, {
        email,
        subject: accountSubject,
        body: accountBody,
        studentName,
        courseSlug: requestedCourse,
        loginEmail: email,
        loginPassword: accountPassword,
        orderRef,
        transferNote,
        source: "admin-account-provision",
      }),
    );

    const emailStatus = emailResults.every((item) => item.sent)
      ? "sent"
      : "failed";
    const emailError = emailResults
      .filter((item) => !item.sent)
      .map((item) => item.error)
      .filter(Boolean)
      .join(" | ");

    return NextResponse.json({
      approved: true,
      action: "provision-account",
      credential: {
        email,
        password: accountPassword,
        courseSlug: requestRow.course_slug,
      },
      message:
        "Đã cấp tài khoản học viên. Bạn có thể phê duyệt truy cập khóa học ở bước riêng.",
      emailStatus,
      emailError: emailError || undefined,
    });
  }

  if (!requestedCourse) {
    return NextResponse.json(
      { error: "Yêu cầu chưa có course_slug để cấp quyền truy cập khóa học." },
      { status: 400 },
    );
  }

  if (!existingAccount) {
    return NextResponse.json(
      {
        error:
          "Học viên chưa có tài khoản. Hãy cấp tài khoản trước khi cấp quyền truy cập khóa học.",
      },
      { status: 400 },
    );
  }

  if (!alreadyGranted) {
    const mergedCourseSlug = serializeCourseSlugs([
      ...currentOwnedCourses,
      requestedCourse,
    ]);

    const { error: accountError } = await supabase
      .from("customer_accounts")
      .update({
        course_slug: mergedCourseSlug,
        full_name: requestRow.full_name || undefined,
        phone: requestRow.phone || undefined,
        status: "active",
      })
      .ilike("email", email);

    if (accountError) {
      return NextResponse.json(
        { error: formatSupabaseError(accountError) },
        { status: 500 },
      );
    }

    const accessSubject = "Quyền truy cập khóa học đã được kích hoạt";
    const accessBody = [
      `Xin chào ${studentName},`,
      "",
      "Admin đã phê duyệt quyền học cho tài khoản của bạn.",
      `Khóa học đã mở: ${requestedCourse}`,
      `Tài khoản truy cập: ${email}`,
      "",
      "Bạn có thể vào mục Khóa học của tôi để bắt đầu học ngay.",
      "",
      `Mã tham chiếu: ${orderRef}`,
    ].join("\n");

    emailResults.push(
      await sendAndTrackEmail(supabase, {
        email,
        subject: accessSubject,
        body: accessBody,
        studentName,
        courseSlug: requestedCourse,
        loginEmail: email,
        loginPassword: accountPassword,
        orderRef,
        transferNote,
        source: "admin-course-access",
      }),
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

  const emailStatus = emailResults.every((item) => item.sent)
    ? "sent"
    : "failed";
  const emailError = emailResults
    .filter((item) => !item.sent)
    .map((item) => item.error)
    .filter(Boolean)
    .join(" | ");

  return NextResponse.json({
    approved: true,
    action: alreadyGranted ? "already-granted" : "grant-course-access",
    credential: {
      email,
      password: accountPassword,
      courseSlug: requestRow.course_slug,
    },
    message: alreadyGranted
      ? "Học viên đã có quyền truy cập khóa học này trước đó."
      : "Đã cấp quyền truy cập khóa học cho tài khoản hiện có.",
    emailStatus,
    emailError: emailError || undefined,
  });
}
