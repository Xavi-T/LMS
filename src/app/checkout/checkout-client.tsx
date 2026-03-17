"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCourseBySlug } from "@/lib/course";
import { formatCurrency } from "@/lib/utils";
import { useAppState } from "@/contexts/app-context";

const coupons = {
  SPORT10: { type: "percent", value: 10 },
  PRINT200: { type: "fixed", value: 200000 },
} as const;

export default function CheckoutClient({
  courseSlug,
  packageName,
  packagePrice,
}: {
  courseSlug: string;
  packageName?: string;
  packagePrice?: number;
}) {
  const course = getCourseBySlug(courseSlug);
  const { user, purchaseCourse, markOrderPaid, orders, saveIssuedCredential } =
    useAppState();
  const [couponInput, setCouponInput] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<keyof typeof coupons | null>(
    null,
  );
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [transferNoteSeed] = useState(() => Date.now().toString().slice(-5));
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [leadStatus, setLeadStatus] = useState("");
  const [credential, setCredential] = useState<{
    email: string;
    password: string;
    emailStatus: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const discount = useMemo(() => {
    if (!course || !activeCoupon) return 0;
    const basePrice = packagePrice ?? course.price;
    const item = coupons[activeCoupon];
    if (item.type === "percent") {
      return Math.round((basePrice * item.value) / 100);
    }

    return item.value;
  }, [activeCoupon, course, packagePrice]);

  if (!course) {
    return (
      <div className="container-app py-10 text-center">
        <p>Không tìm thấy khóa học trong giỏ hàng.</p>
        <Link href="/courses" className="text-accent">
          Chọn khóa học
        </Link>
      </div>
    );
  }

  const basePrice = packagePrice ?? course.price;
  const finalPrice = Math.max(0, basePrice - discount);
  const transferNote = `SP-${course.slug.slice(0, 6).toUpperCase()}-${transferNoteSeed}`;
  const activeOrder = orders.find((item) => item.id === activeOrderId);

  return (
    <div className="container-app grid gap-6 py-6 md:grid-cols-[1.1fr_0.9fr] md:py-10">
      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-accent">
            Checkout
          </p>
          <h1 className="text-2xl font-black md:text-4xl">
            Thanh toán khóa học qua VietQR
          </h1>
        </div>

        <article className="card p-4">
          <p className="text-sm text-zinc-400">Giỏ hàng</p>
          <h2 className="mt-1 text-lg font-bold">{course.title}</h2>
          {packageName && (
            <p className="text-xs text-accent">Gói đã chọn: {packageName}</p>
          )}
          <p className="mt-1 text-sm text-zinc-300">
            {course.shortDescription}
          </p>
          <p className="mt-3 text-xl font-black text-accent">
            {formatCurrency(basePrice)}
          </p>
        </article>

        <article className="card space-y-3 p-4 text-sm">
          <p className="font-semibold">Thông tin khách mua hàng</p>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Họ tên"
            className="w-full rounded-lg border border-border bg-black px-3 py-2"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-border bg-black px-3 py-2"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Số điện thoại"
            className="w-full rounded-lg border border-border bg-black px-3 py-2"
          />
          <button
            className="btn-secondary w-full py-2"
            onClick={async () => {
              setLeadStatus("");
              const response = await fetch("/api/facebook/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fullName,
                  email,
                  phone,
                  packageName,
                  courseSlug: course.slug,
                }),
              });

              const payload = await response.json();
              if (!response.ok) {
                setLeadStatus(payload.error ?? "Không lưu được lead Facebook");
                return;
              }

              setLeadStatus(`Đã nhận lead Facebook: ${payload.leadId}`);
            }}
          >
            Kéo lead Facebook sang CRM
          </button>
          {leadStatus && <p className="text-xs text-zinc-400">{leadStatus}</p>}
        </article>

        <article className="card space-y-3 p-4 text-sm">
          <p className="font-semibold">Mã giảm giá</p>
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Ví dụ: SPORT10"
              className="flex-1 rounded-lg border border-border bg-black px-3 py-2"
            />
            <button
              className="btn-secondary px-3 py-2"
              onClick={() => {
                const isValid = couponInput in coupons;
                setActiveCoupon(
                  isValid ? (couponInput as keyof typeof coupons) : null,
                );
              }}
            >
              Áp dụng
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Mã demo: SPORT10 (10%), PRINT200 (-200.000đ)
          </p>
        </article>
      </section>

      <aside className="card h-fit space-y-4 p-4 md:sticky md:top-20">
        <h2 className="text-lg font-bold">Thông tin thanh toán</h2>
        {!user && (
          <p className="rounded-lg border border-accent/50 bg-accent/10 p-2 text-xs text-orange-100">
            Bạn chưa đăng nhập. Vẫn có thể tạo đơn demo, nhưng nên đăng nhập để
            quản lý lịch sử giao dịch.
          </p>
        )}
        <div className="space-y-1 text-sm text-zinc-300">
          <p>Tạm tính: {formatCurrency(course.price)}</p>
          <p>Gói chọn: {packageName ?? "Khóa mặc định"}</p>
          <p>Giá gói: {formatCurrency(basePrice)}</p>
          <p>Giảm giá: -{formatCurrency(discount)}</p>
          <p className="text-lg font-bold text-white">
            Thanh toán: {formatCurrency(finalPrice)}
          </p>
        </div>
        <button
          className="btn-primary w-full py-3 text-sm"
          onClick={() => {
            const orderId = purchaseCourse({
              courseSlug: course.slug,
              amount: finalPrice,
              couponCode: activeCoupon ?? undefined,
              transferNote,
            });
            setActiveOrderId(orderId);
          }}
        >
          Tạo đơn hàng
        </button>

        {activeOrderId && (
          <div className="space-y-3 rounded-xl border border-border p-3 text-sm">
            <p>
              Đơn hàng: <span className="font-bold">{activeOrderId}</span>
            </p>
            <p>
              Nội dung chuyển khoản:{" "}
              <span className="font-bold text-accent">{transferNote}</span>
            </p>
            <Image
              src={`https://img.vietqr.io/image/970422-0988888888-compact2.png?amount=${finalPrice}&addInfo=${encodeURIComponent(transferNote)}`}
              alt="VietQR"
              width={208}
              height={208}
              className="mx-auto h-52 w-52 rounded-lg border border-border bg-white p-2"
            />
            <p className="text-xs text-zinc-400">
              Ngân hàng: MBBank · STK: 0988888888 · Chủ TK: SPORTPRINT CO
            </p>
            <button
              className="btn-secondary w-full py-2"
              onClick={async () => {
                if (!activeOrderId || isProcessing) {
                  return;
                }

                setIsProcessing(true);
                markOrderPaid(activeOrderId);

                const response = await fetch("/api/sales/confirm-payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId: activeOrderId,
                    transferNote,
                    courseSlug: course.slug,
                    fullName,
                    email,
                    phone,
                    amount: finalPrice,
                  }),
                });

                const payload = await response.json();
                setIsProcessing(false);

                if (!response.ok) {
                  setLeadStatus(
                    payload.error ?? "Không cấp được tài khoản học",
                  );
                  return;
                }

                setCredential({
                  email: payload.email,
                  password: payload.password,
                  emailStatus: payload.emailStatus,
                });
                saveIssuedCredential({
                  email: payload.email,
                  password: payload.password,
                  courseSlug: course.slug,
                });
              }}
            >
              {isProcessing
                ? "Đang cấp tài khoản..."
                : "Tôi đã chuyển khoản (cấp tài khoản)"}
            </button>
            {activeOrder?.status === "paid" && (
              <p className="rounded-lg bg-green-500/20 p-2 text-center text-xs text-green-300">
                Thanh toán thành công (mock). Khóa học đã được kích hoạt.
              </p>
            )}
            {credential && (
              <div className="space-y-2 rounded-lg border border-accent/40 bg-accent/10 p-2 text-xs text-orange-100">
                <p className="font-semibold">Tài khoản học đã tạo tự động</p>
                <p>Email: {credential.email}</p>
                <p>Mật khẩu: {credential.password}</p>
                <p>Trạng thái email: {credential.emailStatus}</p>
                <Link
                  href={`/login?email=${encodeURIComponent(credential.email)}&password=${encodeURIComponent(credential.password)}`}
                  className="inline-block rounded-md bg-accent px-2 py-1 font-bold text-black"
                >
                  Đăng nhập vào khóa học
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
