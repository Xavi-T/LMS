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

export function CourseCard({
  course,
  cardHref,
  hideActions = false,
  isOwned = false,
}: {
  course: CourseCardData;
  cardHref?: string;
  hideActions?: boolean;
  isOwned?: boolean;
}) {
  const hasThumbnail = Boolean(course.thumbnail?.trim());
  const navigateHref = cardHref ?? `/courses/${course.slug}`;

  return (
    <article className="card group relative cursor-pointer overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_18px_48px_rgba(0,0,0,0.45)]">
      <Link
        href={navigateHref}
        className="absolute inset-0 z-10"
        aria-label={`Mở khóa học ${course.title}`}
      />
      <div className="relative z-0 block">
        <div
          className={`relative h-48 bg-center transition duration-300 group-hover:scale-[1.02] ${hasThumbnail ? "bg-cover" : "bg-linear-to-br from-zinc-800 to-zinc-900"}`}
          style={
            hasThumbnail
              ? { backgroundImage: `url(${course.thumbnail})` }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
        </div>
      </div>
      <div className="pointer-events-none relative z-20 space-y-3 p-4">
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
        <div className="flex items-end justify-between gap-3 pt-1">
          <p className="text-xl font-black text-accent">
            {formatCurrency(course.price)}
          </p>
          {!hideActions && (
            <div className="pointer-events-auto relative z-30 flex shrink-0 items-center gap-2">
              {isOwned ? (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">
                  Đã sở hữu
                </span>
              ) : (
                <Link
                  href={`/checkout?course=${course.slug}`}
                  className="btn-primary px-3 py-2 text-sm"
                >
                  Mua ngay
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
