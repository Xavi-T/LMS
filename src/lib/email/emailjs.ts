interface EmailJsAccountPayload {
  toEmail: string;
  studentName: string;
  courseSlug: string;
  loginEmail: string;
  loginPassword: string;
  orderRef: string;
  transferNote?: string;
  emailSubject?: string;
  emailBody?: string;
  source:
    | "checkout"
    | "admin-approval"
    | "admin-account-provision"
    | "admin-course-access";
}

interface EmailJsSendResult {
  sent: boolean;
  error?: string;
}

const hasEmailJsEnv = () => {
  return Boolean(
    process.env.EMAILJS_SERVICE_ID &&
    process.env.EMAILJS_TEMPLATE_ID_ACCOUNT &&
    process.env.EMAILJS_PUBLIC_KEY,
  );
};

const normalizeBodyForTemplate = (body: string) =>
  body.replace(/\n/g, "<br />");

const buildFallbackSubject = (payload: EmailJsAccountPayload) => {
  if (payload.source === "admin-course-access") {
    return "Kích hoạt quyền truy cập khóa học SPORTPRINT LMS";
  }

  if (payload.source === "admin-account-provision") {
    return "Tài khoản học tập SPORTPRINT LMS";
  }

  return "Thông báo từ SPORTPRINT LMS";
};

const buildFallbackBody = (payload: EmailJsAccountPayload) => {
  if (payload.source === "admin-course-access") {
    return normalizeBodyForTemplate(
      `Xin chào ${payload.studentName},\nBạn đã được cấp quyền truy cập khóa học ${payload.courseSlug}.\nĐăng nhập bằng email: ${payload.loginEmail}.`,
    );
  }

  return normalizeBodyForTemplate(
    `Xin chào ${payload.studentName},\nTài khoản học tập của bạn đã sẵn sàng.\nEmail: ${payload.loginEmail}\nMật khẩu: ${payload.loginPassword}`,
  );
};

export const sendAccountEmailViaEmailJs = async (
  payload: EmailJsAccountPayload,
): Promise<EmailJsSendResult> => {
  if (!hasEmailJsEnv) {
    return { sent: false, error: "Missing EmailJS environment variables" };
  }

  try {
    const resolvedSubject = payload.emailSubject?.trim()
      ? payload.emailSubject.trim()
      : buildFallbackSubject(payload);
    const resolvedBody = payload.emailBody?.trim()
      ? normalizeBodyForTemplate(payload.emailBody.trim())
      : buildFallbackBody(payload);

    const response = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_TEMPLATE_ID_ACCOUNT,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          accessToken: process.env.EMAILJS_PRIVATE_KEY || undefined,
          template_params: {
            to_email: payload.toEmail,
            student_name: payload.studentName,
            course_slug: payload.courseSlug,
            login_email: payload.loginEmail,
            login_password: payload.loginPassword,
            order_ref: payload.orderRef,
            transfer_note: payload.transferNote ?? "",
            email_subject: resolvedSubject,
            email_body: resolvedBody,
            source: payload.source,
          },
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return {
        sent: false,
        error: `EmailJS error ${response.status}: ${text}`,
      };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unknown EmailJS error",
    };
  }
};
