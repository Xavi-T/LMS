import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("lms_role");
  response.cookies.delete("lms_admin_email");
  return response;
}
