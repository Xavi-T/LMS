import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/lib/course";
import { formatCurrency } from "@/lib/utils";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);

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
          <div
            className="h-56 rounded-2xl border border-border bg-cover bg-center md:h-80"
            style={{ backgroundImage: `url(${course.thumbnail})` }}
          />
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
          <Link
            href={`/learn/${course.slug}/${course.chapters[0].lessons[0].id}`}
            className="btn-secondary block px-4 py-3 text-center text-sm"
          >
            Đăng ký học thử
          </Link>
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
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {course.chapters.map((chapter) => (
              <li
                key={chapter.id}
                className="rounded-lg border border-border p-3"
              >
                <p className="font-semibold text-white">{chapter.title}</p>
                <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                  {chapter.lessons.map((lesson) => (
                    <li key={lesson.id}>• {lesson.title}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
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
          <div className="card p-4">
            <h2 className="text-lg font-bold">Đánh giá học viên</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              {course.reviews.map((review) => (
                <li key={review.id}>
                  <p className="font-semibold text-white">
                    {review.studentName}
                  </p>
                  <p className="text-xs text-zinc-400">{review.comment}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
