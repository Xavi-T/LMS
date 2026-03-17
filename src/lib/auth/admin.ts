import { NextRequest, NextResponse } from "next/server";

const defaultAdminEmail = "admin@sportprint.vn";

export const ensureAdminRequest = (request: NextRequest) => {
  const role = request.cookies.get("lms_role")?.value;
  const adminEmailCookie = request.cookies.get("lms_admin_email")?.value;
  const adminEmail = (
    process.env.ADMIN_EMAIL || defaultAdminEmail
  ).toLowerCase();

  if (role !== "admin" || adminEmailCookie?.toLowerCase() !== adminEmail) {
    return NextResponse.json(
      { error: "Bạn không có quyền truy cập chức năng quản trị." },
      { status: 403 },
    );
  }

  return null;
};
