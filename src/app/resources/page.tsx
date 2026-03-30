import Link from "next/link";

export default function ResourcesPage() {
  return (
    <div className="container-app py-10">
      <div className="card p-5 text-center">
        <h1 className="text-xl font-bold">Tài liệu được mở trong bài học</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Để xem video, nội dung và tài liệu liên quan, vui lòng vào “Khóa học
          của tôi” và mở từng bài học cụ thể.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary mt-4 inline-block px-4 py-2 text-sm"
        >
          Đi tới Khóa học của tôi
        </Link>
      </div>
    </div>
  );
}
