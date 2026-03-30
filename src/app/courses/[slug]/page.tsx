import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/lib/course";
import { formatCurrency } from "@/lib/utils";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/supabase/env";

type CourseDetailView = {
  slug: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  price: number;
  thumbnail: string;
  instructor: {
    name: string;
    title: string;
  };
  chapters: Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
    }>;
  }>;
  outcomes: string[];
};

const resolveMediaUrl = async (
  value: string,
  supabase: ReturnType<typeof getSupabaseServiceClient>,
) => {
  const normalized = value.trim();
  if (!normalized) return "";
  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  if (!supabase) return "";

  const { data } = await supabase.storage
    .from(supabaseEnv.bucketName)
    .createSignedUrl(normalized, 60 * 60);

  return data?.signedUrl ?? "";
};

const getCourseDetailBySlug = async (
  slug: string,
): Promise<CourseDetailView | null> => {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    const fallback = getCourseBySlug(slug);
    if (!fallback) return null;
    return {
      slug: fallback.slug,
      title: fallback.title,
      shortDescription: fallback.shortDescription,
      detailedDescription: fallback.detailedDescription,
      price: fallback.price,
      thumbnail: fallback.thumbnail,
      instructor: {
        name: fallback.instructor.name,
        title: fallback.instructor.title,
      },
      chapters: fallback.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        lessons: chapter.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
        })),
      })),
      outcomes: fallback.outcomes,
    };
  }

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, slug, title, short_description, detailed_description, price, thumbnail, instructor_name, instructor_title",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!course) {
    const fallback = getCourseBySlug(slug);
    if (!fallback) return null;
    return {
      slug: fallback.slug,
      title: fallback.title,
      shortDescription: fallback.shortDescription,
      detailedDescription: fallback.detailedDescription,
      price: fallback.price,
      thumbnail: fallback.thumbnail,
      instructor: {
        name: fallback.instructor.name,
        title: fallback.instructor.title,
      },
      chapters: fallback.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        lessons: chapter.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
        })),
      })),
      outcomes: fallback.outcomes,
      reviews: fallback.reviews.map((review) => ({
        id: review.id,
        studentName: review.studentName,
        comment: review.comment,
      })),
    };
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title, position")
    .eq("course_id", course.id)
    .order("position", { ascending: true });

  const chapterIds = (chapters ?? []).map((chapter) => chapter.id);
  const { data: lessons } = chapterIds.length
    ? await supabase
        .from("lessons")
        .select("id, chapter_id, title, position")
        .in("chapter_id", chapterIds)
        .order("position", { ascending: true })
    : { data: [] as Array<{ id: string; chapter_id: string; title: string }> };

  const { data: outcomes } = await supabase
    .from("course_outcomes")
    .select("id, content, position")
    .eq("course_id", course.id)
    .order("position", { ascending: true });

  const thumbnailUrl = await resolveMediaUrl(course.thumbnail, supabase);

  return {
    slug: course.slug,
    title: course.title,
    shortDescription: course.short_description,
    detailedDescription: course.detailed_description,
    price: course.price,
    thumbnail: thumbnailUrl,
    instructor: {
      name: course.instructor_name || "Đang cập nhật",
      title: course.instructor_title || "Giảng viên",
    },
    chapters: (chapters ?? []).map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      lessons: (lessons ?? [])
        .filter((lesson) => lesson.chapter_id === chapter.id)
        .map((lesson) => ({ id: lesson.id, title: lesson.title })),
    })),
    outcomes:
      (outcomes ?? [])
        .map((item) => item.content)
        .filter((item): item is string => Boolean(item)) || [],
  };
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseDetailBySlug(slug);
  const firstLessonId = course?.chapters[0]?.lessons[0]?.id;

  if (!course) {
    notFound();
  }

  return (
    <div className="container-app space-y-6 py-6 md:py-10">
      <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wider text-accent">
            Chi tiết khóa học
          </p>
          <h1 className="text-2xl font-black md:text-4xl">{course.title}</h1>
          <p className="text-zinc-300">{course.shortDescription}</p>
          {course.thumbnail ? (
            <div
              className="h-56 rounded-2xl border border-border bg-cover bg-center md:h-80"
              style={{ backgroundImage: `url(${course.thumbnail})` }}
            />
          ) : (
            <div className="h-56 rounded-2xl border border-border bg-zinc-900 md:h-80" />
          )}
          <p className="text-sm text-zinc-300">{course.detailedDescription}</p>
        </div>

        <aside className="card h-fit space-y-4 p-4 md:sticky md:top-20">
          <p className="text-2xl font-black text-accent">
            {formatCurrency(course.price)}
          </p>
          <Link
            href={`/checkout?course=${course.slug}`}
            className="btn-primary block px-4 py-3 text-center text-sm"
          >
            Mua ngay
          </Link>
          {firstLessonId ? (
            <Link
              href={`/learn/${course.slug}/${firstLessonId}`}
              className="btn-secondary block px-4 py-3 text-center text-sm"
            >
              Đăng ký học thử
            </Link>
          ) : (
            <button
              className="btn-secondary block w-full cursor-not-allowed px-4 py-3 text-center text-sm opacity-70"
              disabled
            >
              Chưa có bài học thử
            </button>
          )}
          <div className="text-sm text-zinc-300">
            <p className="font-semibold text-white">Giảng viên</p>
            <p>{course.instructor.name}</p>
            <p className="text-xs text-zinc-400">{course.instructor.title}</p>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-lg font-bold">Lộ trình học</h2>
          <p className="mt-2 text-xs text-zinc-500">
            Khách chưa mua khóa học vẫn xem được danh sách chương/bài. Video bài
            giảng và tài liệu sẽ được mở sau khi mua.
          </p>
          <div className="mt-3 space-y-2 text-sm text-zinc-300">
            {course.chapters.map((chapter) => (
              <details
                key={chapter.id}
                className="group rounded-lg border border-border p-3"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-white marker:content-none">
                  <span>{chapter.title}</span>
                  <span className="text-xs text-zinc-400 transition-transform duration-200 group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                  {chapter.lessons.map((lesson) => (
                    <li key={lesson.id}>• {lesson.title}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-lg font-bold">Bạn sẽ đạt được</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              {course.outcomes.map((outcome) => (
                <li key={outcome}>• {outcome}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
