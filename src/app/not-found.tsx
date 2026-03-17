import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-app py-20 text-center">
      <h1 className="text-3xl font-black">404</h1>
      <p className="mt-2 text-zinc-400">Trang bạn tìm không tồn tại.</p>
      <Link href="/" className="mt-4 inline-block text-accent">
        Quay về trang chủ
      </Link>
    </div>
  );
}
