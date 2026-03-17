"use client";

import { useMemo } from "react";
import Link from "next/link";
import { courses } from "@/lib/mock-data";
import { useAppState } from "@/contexts/app-context";

export default function ResourcesPage() {
  const { user, purchasedCourseSlugs, markDownloaded } = useAppState();

  const handleDownload = async (resource: {
    id: string;
    title: string;
    courseSlug: string;
    storagePath?: string;
  }) => {
    if (!resource.storagePath) {
      markDownloaded({
        id: resource.id,
        title: resource.title,
        courseSlug: resource.courseSlug,
      });
      return;
    }

    const response = await fetch("/api/storage/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath: resource.storagePath }),
    });

    const payload = await response.json();
    if (response.ok && payload.signedUrl) {
      markDownloaded({
        id: resource.id,
        title: resource.title,
        courseSlug: resource.courseSlug,
      });
      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }

    alert(payload.error ?? "Không thể tạo link tải từ Supabase Storage");
  };

  const ownedResources = useMemo(
    () =>
      courses
        .filter((course) => purchasedCourseSlugs.includes(course.slug))
        .flatMap((course) =>
          course.resources.map((resource) => ({
            ...resource,
            courseTitle: course.title,
            courseSlug: course.slug,
          })),
        ),
    [purchasedCourseSlugs],
  );

  if (!user) {
    return (
      <div className="container-app py-10">
        <div className="card p-5 text-center">
          <h1 className="text-xl font-bold">
            Kho tài liệu chỉ dành cho học viên
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Vui lòng đăng nhập và mua khóa học để tải file .CDR / .AI / .PSD.
          </p>
          <Link
            href="/login"
            className="btn-primary mt-4 inline-block px-4 py-2 text-sm"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app space-y-4 py-6 md:py-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-accent">
          Document Library
        </p>
        <h1 className="text-2xl font-black md:text-4xl">
          Kho tài liệu thiết kế & sản xuất
        </h1>
      </div>

      {ownedResources.length === 0 ? (
        <div className="card p-5 text-sm text-zinc-300">
          Bạn chưa có quyền tải tài liệu nào. Hãy mua khóa học để mở quyền truy
          cập.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {ownedResources.map((resource) => (
            <article key={resource.id} className="card overflow-hidden">
              <div
                className="h-36 bg-cover bg-center"
                style={{ backgroundImage: `url(${resource.previewImage})` }}
              />
              <div className="space-y-2 p-4">
                <p className="text-xs text-zinc-500">{resource.courseTitle}</p>
                <h2 className="font-bold">{resource.title}</h2>
                <p className="text-sm text-zinc-300">{resource.description}</p>
                <button
                  className="btn-primary w-full py-2 text-sm"
                  onClick={() => handleDownload(resource)}
                >
                  Tải xuống {resource.fileType}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
