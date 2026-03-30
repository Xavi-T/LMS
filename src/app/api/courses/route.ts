import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { courses as mockCourses } from "@/lib/mock-data";
import { supabaseEnv } from "@/lib/supabase/env";

type PublicCourseItem = {
  slug: string;
  title: string;
  shortDescription: string;
  category: "in-an" | "thiet-ke" | "kinh-doanh";
  level: "Cơ bản" | "Nâng cao";
  createdAt: string;
  studentsCount: number;
  price: number;
  thumbnail: string;
};

const mapMockCourses = (): PublicCourseItem[] =>
  mockCourses.map((course) => ({
    slug: course.slug,
    title: course.title,
    shortDescription: course.shortDescription,
    category: course.category,
    level: course.level,
    createdAt: course.createdAt,
    studentsCount: course.studentsCount,
    price: course.price,
    thumbnail: course.thumbnail,
  }));

const resolveThumbnailUrl = async (
  thumbnail: string | null,
  supabase: ReturnType<typeof getSupabaseServiceClient>,
) => {
  const normalized = (thumbnail ?? "").trim();
  if (!normalized) return "";
  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  if (!supabase) {
    return "";
  }

  const { data, error } = await supabase.storage
    .from(supabaseEnv.bucketName)
    .createSignedUrl(normalized, 60 * 60);

  if (error || !data?.signedUrl) {
    return "";
  }

  return data.signedUrl;
};

export async function GET() {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ courses: mapMockCourses() });
  }

  const { data, error } = await supabase
    .from("courses")
    .select(
      "slug, title, short_description, category, level, created_at, students_count, price, thumbnail",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }

  const normalized = await Promise.all(
    (data ?? []).map(async (item) => ({
      slug: item.slug,
      title: item.title,
      shortDescription: item.short_description,
      category: item.category as "in-an" | "thiet-ke" | "kinh-doanh",
      level: item.level as "Cơ bản" | "Nâng cao",
      createdAt: item.created_at,
      studentsCount: item.students_count,
      price: item.price,
      thumbnail: await resolveThumbnailUrl(item.thumbnail, supabase),
    })),
  );

  return NextResponse.json({ courses: normalized });
}
