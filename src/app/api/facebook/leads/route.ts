import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const fullName = body?.fullName as string | undefined;
  const email = body?.email as string | undefined;
  const phone = body?.phone as string | undefined;
  const packageName = body?.packageName as string | undefined;
  const courseSlug = body?.courseSlug as string | undefined;

  if (!fullName || (!email && !phone)) {
    return NextResponse.json(
      { error: "fullName and (email or phone) are required" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServiceClient();
  const leadId = `lead-${Date.now()}`;

  if (!supabase) {
    return NextResponse.json({
      leadId,
      status: "queued-local",
      message:
        "Supabase service role key chưa cấu hình, lead đang chạy mock local.",
    });
  }

  const { data, error } = await supabase
    .from("facebook_leads")
    .insert({
      full_name: fullName,
      email,
      phone,
      package_name: packageName,
      course_slug: courseSlug,
      source: "facebook",
      status: "new",
      raw_payload: body,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ leadId: data.id, status: "saved" });
}
