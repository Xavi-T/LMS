import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/supabase/env";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const filePath = body?.filePath as string | undefined;

  if (!filePath) {
    return NextResponse.json(
      { error: "filePath is required" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Supabase service role key is missing. Set SUPABASE_SERVICE_ROLE_KEY to enable signed URLs.",
      },
      { status: 500 },
    );
  }

  const { data, error } = await supabase.storage
    .from(supabaseEnv.bucketName)
    .createSignedUrl(filePath, 60 * 5);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      {
        error: error?.message ?? "Failed to generate signed url",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}
