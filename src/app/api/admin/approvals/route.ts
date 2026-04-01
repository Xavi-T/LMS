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

  const currentOwnedCourses = parseCourseSlugs(existingAccount?.course_slug);
  const requestedCourse = requestRow.course_slug.trim().toLowerCase();
  const alreadyGranted = currentOwnedCourses.includes(requestedCourse);

  let resolvedAction: "provision-account" | "grant-course-access";

  if (!existingAccount) {
    resolvedAction = "provision-account";
  } else if (alreadyGranted) {
    resolvedAction = "grant-course-access";
  } else {
    resolvedAction = "grant-course-access";
  }

  if (
    action &&
    action !== resolvedAction &&
    !(alreadyGranted && action === "grant-course-access")
  ) {
    return NextResponse.json(
      {
        error:
          resolvedAction === "provision-account"
            ? "Yêu cầu này cần cấp tài khoản lần đầu."
            : "Yêu cầu này cần cấp quyền truy cập khóa học.",
      },
      { status: 400 },
    );
  }

  const mergedCourseSlug = serializeCourseSlugs([
    ...currentOwnedCourses,
    requestedCourse,
  ]);

  let accountPassword = existingAccount?.plain_password ?? "";

  if (resolvedAction === "provision-account") {
    accountPassword = createPassword();
    const { error: accountError } = await supabase
      .from("customer_accounts")
      .insert({
        email,
        phone: requestRow.phone,
        full_name: requestRow.full_name,
        plain_password: accountPassword,
        course_slug: mergedCourseSlug,
        order_ref: requestRow.order_ref || `APPROVE-${requestRow.id}`,
        status: "active",
      });

    if (accountError) {
      return NextResponse.json(
        { error: formatSupabaseError(accountError) },
        { status: 500 },
      );
    }
  } else if (!alreadyGranted) {
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

  const emailResults: Array<{ sent: boolean; error?: string }> = [];
  const studentName = requestRow.full_name ?? "Học viên";
  const orderRef = requestRow.order_ref || `APPROVE-${requestRow.id}`;
  const transferNote = requestRow.transfer_note || undefined;

  if (!alreadyGranted) {
    if (resolvedAction === "provision-account") {
      const accountSubject =
        "Tài khoản học tập SPORTPRINT LMS (Admin phê duyệt)";
      const accountBody = `Xin chào ${studentName}, tài khoản học tập của bạn đã được tạo thành công. Email: ${email} | Mật khẩu: ${accountPassword}.`;

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
    }

    const accessSubject = "Kích hoạt quyền truy cập khóa học SPORTPRINT LMS";
    const accessBody = `Xin chào ${studentName}, bạn đã được cấp quyền truy cập khóa học ${requestedCourse} trên tài khoản ${email}.`;

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
    action: alreadyGranted ? "already-granted" : resolvedAction,
    credential: {
      email,
      password: accountPassword,
      courseSlug: requestRow.course_slug,
    },
    message: alreadyGranted
      ? "Học viên đã có quyền truy cập khóa học này trước đó."
      : resolvedAction === "provision-account"
        ? "Đã cấp tài khoản lần đầu và gửi 2 email (tài khoản + quyền truy cập khóa học)."
        : "Đã cấp quyền truy cập khóa học cho tài khoản hiện có.",
    emailStatus,
    emailError: emailError || undefined,
  });
}
