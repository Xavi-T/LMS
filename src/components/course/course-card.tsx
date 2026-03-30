import Link from "next/link";
import { Course } from "@/types/lms";
import { formatCurrency } from "@/lib/utils";

export type CourseCardData = Pick<
  Course,
  | "slug"
  | "title"
  | "shortDescription"
  | "level"
  | "studentsCount"
  | "price"
  | "thumbnail"
>;

export function CourseCard({ course }: { course: CourseCardData }) {
  const hasThumbnail = Boolean(course.thumbnail?.trim());

  return (
    <article className="card overflow-hidden">
      <div
        className={`h-44 bg-center ${hasThumbnail ? "bg-cover" : "bg-gradient-to-br from-zinc-800 to-zinc-900"}`}
        style={
          hasThumbnail
            ? { backgroundImage: `url(${course.thumbnail})` }
            : undefined
        }
      />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="rounded-full border border-border px-2 py-1">
            {course.level}
          </span>
          <span>{course.studentsCount}+ học viên</span>
        </div>
        <h3 className="line-clamp-2 text-lg font-bold">{course.title}</h3>
        <p className="line-clamp-2 text-sm text-zinc-300">
          {course.shortDescription}
        </p>
        <div className="flex items-end justify-between">
          <p className="text-xl font-black text-accent">
            {formatCurrency(course.price)}
          </p>
          <div className="flex gap-2">
            <Link
              href={`/courses/${course.slug}`}
              className="btn-secondary px-3 py-2 text-sm"
            >
              Xem chi tiết
            </Link>
            <Link
              href={`/checkout?course=${course.slug}`}
              className="btn-primary px-3 py-2 text-sm"
            >
              Mua ngay
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
