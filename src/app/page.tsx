import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { CourseCard } from "@/components/course/course-card";
import { courses, feedbacks } from "@/lib/mock-data";

export default async function Home() {
  const featured = courses.slice(0, 3);

  return (
    <div className="space-y-14 pb-14">
      <section className="border-b border-border">
        <div className="container-app grid gap-8 py-8 md:grid-cols-2 md:items-center md:py-14">
          <div>
            <p className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold text-black">
              LMS ngành In ấn & Thể thao
            </p>
            <h1 className="text-3xl font-black leading-tight md:text-5xl">
              Học kỹ thuật in áo thể thao
              <span className="text-accent"> theo chuẩn xưởng thực chiến</span>
            </h1>
            <p className="mt-4 text-sm text-zinc-300 md:text-base">
              Bán khóa học, học online trên mobile, tải file thiết kế và thanh
              toán VietQR trong một hệ thống.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/courses" className="btn-primary px-4 py-3 text-sm">
                Xem khóa học
              </Link>
              <Link
                href="/checkout?course=xuong-in-the-thao-thuc-chien"
                className="btn-secondary px-4 py-3 text-sm"
              >
                Mua ngay
              </Link>
            </div>
          </div>
          <div className="card overflow-hidden p-2">
            <div
              className="h-64 rounded-xl bg-cover bg-center md:h-80"
              style={{
                backgroundImage: `url(${featured[0]?.thumbnail ?? ""})`,
              }}
            />
          </div>
        </div>

        <div className="container-app mt-6 grid gap-3 pb-6 md:grid-cols-3">
          <div className="card p-4">
            <Smartphone className="text-accent" size={18} />
            <p className="mt-2 text-sm font-semibold">Mobile-first Learning</p>
            <p className="text-xs text-zinc-400">
              80% học viên học trên điện thoại, UI tối ưu thao tác 1 tay.
            </p>
          </div>
          <div className="card p-4">
            <ShieldCheck className="text-accent" size={18} />
            <p className="mt-2 text-sm font-semibold">Bảo vệ nội dung học</p>
            <p className="text-xs text-zinc-400">
              Kiến trúc sẵn sàng nâng cấp Bunny/S3 CDN chống lộ video.
            </p>
          </div>
          <div className="card p-4">
            <CheckCircle2 className="text-accent" size={18} />
            <p className="mt-2 text-sm font-semibold">Tối ưu chuyển đổi bán</p>
            <p className="text-xs text-zinc-400">
              CTA rõ ràng: xem khóa học, mua ngay, bắt đầu học.
            </p>
          </div>
        </div>
      </section>

      <section className="container-app">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold md:text-2xl">Khóa học nổi bật</h2>
          <Link href="/courses" className="text-sm text-accent">
            Xem tất cả <ArrowRight className="inline" size={14} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      </section>

      <section className="container-app">
        <h2 className="mb-4 text-xl font-bold md:text-2xl">
          Feedback học viên
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {feedbacks.map((item) => (
            <blockquote
              key={item.name}
              className="card p-4 text-sm text-zinc-200"
            >
              “{item.quote}”
              <footer className="mt-3 text-xs text-zinc-400">
                — {item.name}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="container-app">
        <div className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-accent">
              Bắt đầu ngay
            </p>
            <h3 className="text-xl font-black md:text-3xl">
              Nâng cấp kỹ năng in ấn & kinh doanh thể thao
            </h3>
          </div>
          <Link
            href="/courses"
            className="btn-primary inline-flex items-center justify-center px-4 py-3 text-sm"
          >
            Bắt đầu học
          </Link>
        </div>
      </section>
    </div>
  );
}
