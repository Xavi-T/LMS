import { NextRequest, NextResponse } from "next/server";

const defaultAdminEmail = "admin@sportprint.vn";
const normalize = (value: string | undefined) =>
  (value ?? "").trim().toLowerCase();

export const ensureAdminRequest = (request: NextRequest) => {
  const role = normalize(request.cookies.get("lms_role")?.value);
  const adminEmailCookie = normalize(
    request.cookies.get("lms_admin_email")?.value,
  );
  const adminEmail = normalize(process.env.ADMIN_EMAIL || defaultAdminEmail);

  if (role !== "admin") {
    return NextResponse.json(
      { error: "Bạn không có quyền truy cập chức năng quản trị." },
      { status: 403 },
    );
  }

  if (adminEmailCookie && adminEmailCookie !== adminEmail) {
    return NextResponse.json(
      { error: "Bạn không có quyền truy cập chức năng quản trị." },
      { status: 403 },
    );
  }

  return null;
};
