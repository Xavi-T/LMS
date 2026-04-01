interface EmailJsAccountPayload {
  toEmail: string;
  studentName: string;
  courseSlug: string;
  loginEmail: string;
  loginPassword: string;
  orderRef: string;
  transferNote?: string;
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

export const sendAccountEmailViaEmailJs = async (
  payload: EmailJsAccountPayload,
): Promise<EmailJsSendResult> => {
  if (!hasEmailJsEnv) {
    return { sent: false, error: "Missing EmailJS environment variables" };
  }

  try {
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
