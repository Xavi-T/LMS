"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CourseCard } from "@/components/course/course-card";
import { COURSE_CATEGORIES, courses } from "@/lib/mock-data";

type SortType = "new" | "hot" | "price";

export default function CoursesPage() {
  const [category, setCategory] =
    useState<(typeof COURSE_CATEGORIES)[number]["value"]>("all");
  const [sortBy, setSortBy] = useState<SortType>("new");

  const filtered = useMemo(() => {
    let list = courses.filter((course) =>
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
  }, [category, sortBy]);

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
        {filtered.map((course) => (
          <CourseCard key={course.slug} course={course} />
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
