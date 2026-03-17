import { NextRequest, NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/auth/admin";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/supabase/env";

const sanitizeName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.-]/g, "");

export async function POST(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request);
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const file = formData.get("file");
  const folderRaw = formData.get("folder");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file là bắt buộc." }, { status: 400 });
  }

  const folder =
    typeof folderRaw === "string" && folderRaw.trim()
      ? folderRaw.trim().replace(/^\/+|\/+$/g, "")
      : "media";

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình." },
      { status: 500 },
    );
  }

  const originalName = sanitizeName(file.name || "upload.bin");
  const filePath = `${folder}/${Date.now()}-${originalName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(supabaseEnv.bucketName)
    .upload(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(supabaseEnv.bucketName)
    .createSignedUrl(filePath, 60 * 60);

  return NextResponse.json({
    filePath,
    signedUrl: signedError ? null : (signed?.signedUrl ?? null),
  });
}
