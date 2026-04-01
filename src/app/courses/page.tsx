"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CourseCard,
  type CourseCardData,
} from "@/components/course/course-card";
import { useAppState } from "@/contexts/app-context";
import { COURSE_CATEGORIES } from "@/lib/mock-data";

type SortType = "new" | "hot" | "price";
type PublicCourseItem = CourseCardData & {
  category: "in-an" | "thiet-ke" | "kinh-doanh";
  createdAt: string;
};

export default function CoursesPage() {
  const { user } = useAppState();
  const [category, setCategory] =
    useState<(typeof COURSE_CATEGORIES)[number]["value"]>("all");
  const [sortBy, setSortBy] = useState<SortType>("new");
  const [courseItems, setCourseItems] = useState<PublicCourseItem[]>([]);
  const [ownedCourseSlugs, setOwnedCourseSlugs] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/courses", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          setError(result?.error ?? "Không tải được danh sách khóa học.");
          return;
        }

        setCourseItems((result?.courses ?? []) as PublicCourseItem[]);
      } catch {
        setError("Không thể kết nối API khóa học.");
      } finally {
        setLoading(false);
      }
    };

    void loadCourses();
  }, []);

  useEffect(() => {
    if (user?.role !== "student") {
      setOwnedCourseSlugs(new Set());
      return;
    }

    let active = true;

    const loadOwnedCourseSlugs = async () => {
      try {
        const response = await fetch("/api/student/my-content", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok || !active) {
          return;
        }

        const nextOwned = new Set<string>(
          (result?.courses ?? [])
            .map((course: { slug?: string }) =>
              course.slug?.trim().toLowerCase(),
            )
            .filter((slug: string | undefined): slug is string =>
              Boolean(slug),
            ),
        );

        if (active) {
          setOwnedCourseSlugs(nextOwned);
        }
      } catch {
        if (active) {
          setOwnedCourseSlugs(new Set());
        }
      }
    };

    void loadOwnedCourseSlugs();

    return () => {
      active = false;
    };
  }, [user?.role]);

  const filtered = useMemo(() => {
    let list = courseItems.filter((course) =>
      category === "all" ? true : course.category === category,
    );

    if (sortBy === "new") {
      list = [...list].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    }

    if (sortBy === "hot") {
      list = [...list].sort((a, b) => b.studentsCount - a.studentsCount);
    }

    if (sortBy === "price") {
      list = [...list].sort((a, b) => a.price - b.price);
    }

    return list;
  }, [courseItems, category, sortBy]);

  return (
    <div className="container-app space-y-6 py-6 md:py-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-accent">
          Danh mục khóa học
        </p>
        <h1 className="text-2xl font-black md:text-4xl">
          Khóa học Kỹ thuật in ấn & Kinh doanh thể thao
        </h1>
      </div>

      <section className="card space-y-4 p-4">
        <div>
          <p className="mb-2 text-xs text-zinc-400">Lọc theo chủ đề</p>
          <div className="flex flex-wrap gap-2">
            {COURSE_CATEGORIES.map((item) => (
              <button
                key={item.value}
                onClick={() => setCategory(item.value)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  category === item.value
                    ? "bg-accent font-bold text-black"
                    : "border border-border"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs text-zinc-400">Sắp xếp</p>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("new")}
              className={`rounded-lg px-3 py-2 text-sm ${sortBy === "new" ? "bg-accent text-black" : "border border-border"}`}
            >
              Mới nhất
            </button>
            <button
              onClick={() => setSortBy("hot")}
              className={`rounded-lg px-3 py-2 text-sm ${sortBy === "hot" ? "bg-accent text-black" : "border border-border"}`}
            >
              Bán chạy
            </button>
            <button
              onClick={() => setSortBy("price")}
              className={`rounded-lg px-3 py-2 text-sm ${sortBy === "price" ? "bg-accent text-black" : "border border-border"}`}
            >
              Giá
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {loading && (
          <p className="col-span-full text-sm text-zinc-400">
            Đang tải khóa học...
          </p>
        )}
        {!loading && error && (
          <p className="col-span-full rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </p>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p className="col-span-full text-sm text-zinc-500">
            Chưa có khóa học phù hợp với bộ lọc.
          </p>
        )}
        {filtered.map((course) => (
          <CourseCard
            key={course.slug}
            course={course}
            cardHref={`/courses/${course.slug}`}
            isOwned={ownedCourseSlugs.has(course.slug.trim().toLowerCase())}
          />
        ))}
      </section>

      <p className="text-center text-sm text-zinc-400">
        Cần tư vấn chọn lộ trình?{" "}
        <Link href="/contact" className="text-accent">
          Liên hệ đội ngũ
        </Link>
      </p>
    </div>
  );
}
