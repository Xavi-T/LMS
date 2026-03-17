export default function ContactPage() {
  return (
    <div className="container-app space-y-6 py-6 md:py-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-accent">Contact</p>
        <h1 className="text-2xl font-black md:text-4xl">
          Liên hệ tư vấn khóa học & giải pháp xưởng in
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-3 p-4">
          <h2 className="text-lg font-bold">Form liên hệ</h2>
          <input
            placeholder="Họ tên"
            className="w-full rounded-lg border border-border bg-black px-3 py-2 text-sm"
          />
          <input
            placeholder="Số điện thoại"
            className="w-full rounded-lg border border-border bg-black px-3 py-2 text-sm"
          />
          <input
            placeholder="Email"
            className="w-full rounded-lg border border-border bg-black px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Nội dung cần tư vấn"
            className="h-28 w-full rounded-lg border border-border bg-black px-3 py-2 text-sm"
          />
          <button className="btn-primary w-full py-3 text-sm">
            Gửi liên hệ
          </button>
        </section>

        <section className="space-y-4">
          <article className="card p-4 text-sm text-zinc-300">
            <h2 className="font-bold text-white">Thông tin doanh nghiệp</h2>
            <p className="mt-2">SPORTPRINT CO., LTD</p>
            <p>Địa chỉ: KCN Tân Bình, TP.HCM</p>
            <p>Hotline: 0988 888 888</p>
            <p>Email: support@sportprint.vn</p>
          </article>

          <article className="card overflow-hidden p-2">
            <iframe
              title="Google map"
              src="https://maps.google.com/maps?q=10.8017,106.6522&z=14&output=embed"
              className="h-56 w-full rounded-xl"
              loading="lazy"
            />
          </article>

          <article className="grid grid-cols-2 gap-2">
            <a
              href="https://zalo.me/"
              target="_blank"
              className="btn-secondary px-3 py-3 text-center text-sm"
              rel="noreferrer"
            >
              Chat Zalo
            </a>
            <a
              href="https://m.me/"
              target="_blank"
              className="btn-secondary px-3 py-3 text-center text-sm"
              rel="noreferrer"
            >
              Chat Messenger
            </a>
          </article>
        </section>
      </div>
    </div>
  );
}
