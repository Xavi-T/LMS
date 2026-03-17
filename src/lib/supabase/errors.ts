type SupabaseLikeError = {
  code?: string;
  message?: string;
};

export const formatSupabaseError = (error: SupabaseLikeError | null | undefined) => {
  if (!error) {
    return "Lỗi Supabase không xác định.";
  }

  const code = error.code?.toUpperCase();
  const message = (error.message ?? "").toLowerCase();

  if (
    code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("enrollment_requests")
  ) {
    return "Thiếu bảng enrollment_requests trong Supabase. Hãy chạy file supabase/migrations/20260317_create_enrollment_requests.sql trên SQL Editor rồi thử lại.";
  }

  return error.message ?? "Lỗi Supabase không xác định.";
};
