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

type CheckoutCourse = {
  slug: string;
  title: string;
  shortDescription: string;
  price: number;
};

export default function CheckoutClient({
  courseSlug,
  course,
  packageName,
  packagePrice,
}: {
  courseSlug: string;
  course: CheckoutCourse | null;
  packageName?: string;
  packagePrice?: number;
}) {
  const fallbackCourse = getCourseBySlug(courseSlug);
  const selectedCourse = useMemo(
    () =>
      course ??
      (fallbackCourse
        ? {
            slug: fallbackCourse.slug,
            title: fallbackCourse.title,
            shortDescription: fallbackCourse.shortDescription,
            price: fallbackCourse.price,
          }
        : null),
    [course, fallbackCourse],
  );
  const { user, purchaseCourse, markOrderPaid, orders, showToast } =
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
  const [requestStatus, setRequestStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [hasSubmittedApproval, setHasSubmittedApproval] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const validateBuyerInfo = () => {
    if (!fullName.trim()) {
      return "Vui lòng nhập họ tên.";
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return "Vui lòng nhập email hợp lệ.";
    }

    const normalizedPhone = phone.replace(/\s+/g, "").replace(/\D/g, "");
    if (
      !normalizedPhone ||
      normalizedPhone.length < 9 ||
      normalizedPhone.length > 11
    ) {
      return "Vui lòng nhập số điện thoại hợp lệ (9-11 số).";
    }

    return "";
  };

  const discount = useMemo(() => {
    if (!selectedCourse || !activeCoupon) return 0;
    const basePrice = packagePrice ?? selectedCourse.price;
    const item = coupons[activeCoupon];
    if (item.type === "percent") {
      return Math.round((basePrice * item.value) / 100);
    }

    return item.value;
  }, [activeCoupon, packagePrice, selectedCourse]);

  if (!selectedCourse) {
    return (
      <div className="container-app py-10 text-center">
        <p>Không tìm thấy khóa học trong giỏ hàng.</p>
        <Link href="/courses" className="text-accent">
          Chọn khóa học
        </Link>
      </div>
    );
  }

  const basePrice = packagePrice ?? selectedCourse.price;
  const finalPrice = Math.max(0, basePrice - discount);
  const transferNote = `SP-${selectedCourse.slug.slice(0, 6).toUpperCase()}-${transferNoteSeed}`;
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
          <h2 className="mt-1 text-lg font-bold">{selectedCourse.title}</h2>
          {packageName && (
            <p className="text-xs text-accent">Gói đã chọn: {packageName}</p>
          )}
          <p className="mt-1 text-sm text-zinc-300">
            {selectedCourse.shortDescription}
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
          {requestStatus && (
            <p className="text-xs text-zinc-400">{requestStatus}</p>
          )}
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
            Mã đang hỗ trợ: SPORT10 (10%), PRINT200 (-200.000đ)
          </p>
        </article>
      </section>

      <aside className="card h-fit space-y-4 p-4 md:sticky md:top-20">
        <h2 className="text-lg font-bold">Thông tin thanh toán</h2>
        {!user && (
          <p className="rounded-lg border border-accent/50 bg-accent/10 p-2 text-xs text-orange-100">
            Bạn chưa đăng nhập. Vẫn có thể tạo đơn hàng, nhưng nên đăng nhập để
            quản lý lịch sử giao dịch.
          </p>
        )}
        <div className="space-y-1 text-sm text-zinc-300">
          <p>Tạm tính: {formatCurrency(selectedCourse.price)}</p>
          <p>Gói chọn: {packageName ?? "Khóa mặc định"}</p>
          <p>Giá gói: {formatCurrency(basePrice)}</p>
          <p>Giảm giá: -{formatCurrency(discount)}</p>
          <p className="text-lg font-bold text-white">
            Thanh toán: {formatCurrency(finalPrice)}
          </p>
        </div>
        <button
          className="btn-primary w-full py-3 text-sm"
          disabled={isCreatingOrder || Boolean(activeOrderId)}
          onClick={async () => {
            if (isCreatingOrder) {
              return;
            }

            if (activeOrderId) {
              const message =
                "Đơn hàng đã được tạo. Vui lòng dùng nội dung chuyển khoản hiện tại để hoàn tất thanh toán.";
              setCheckoutError(message);
              showToast({ type: "info", message });
              return;
            }

            const validationError = validateBuyerInfo();
            if (validationError) {
              setCheckoutError(validationError);
              return;
            }

            setIsCreatingOrder(true);
            setCheckoutError("");
            setRequestStatus("");
            setHasSubmittedApproval(false);
            const orderId = purchaseCourse({
              courseSlug: selectedCourse.slug,
              amount: finalPrice,
              couponCode: activeCoupon ?? undefined,
              transferNote,
            });
            setActiveOrderId(orderId);

            try {
              const response = await fetch("/api/enrollments/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fullName: fullName.trim(),
                  email: email.trim().toLowerCase(),
                  phone: phone.trim(),
                  packageName,
                  courseSlug: selectedCourse.slug,
                  orderRef: orderId,
                  transferNote,
                }),
              });

              const payload = await response.json();
              if (!response.ok) {
                const message =
                  payload.error ?? "Không ghi nhận được yêu cầu trên hệ thống.";
                setRequestStatus(message);
                showToast({ type: "error", message });
                return;
              }

              const message =
                "Đã tạo đơn hàng thành công. Vui lòng chuyển khoản.";
              setRequestStatus(message);
              showToast({ type: "success", message });
            } catch {
              const message = "Không thể kết nối API ghi nhận yêu cầu.";
              setRequestStatus(message);
              showToast({ type: "error", message });
            } finally {
              setIsCreatingOrder(false);
            }
          }}
        >
          {isCreatingOrder
            ? "Đang tạo đơn hàng..."
            : activeOrderId
              ? "Đơn hàng đã tạo"
              : "Tạo đơn hàng"}
        </button>

        {checkoutError && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-200">
            {checkoutError}
          </p>
        )}

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
                if (!activeOrderId || isProcessing || hasSubmittedApproval) {
                  return;
                }

                const validationError = validateBuyerInfo();
                if (validationError) {
                  setCheckoutError(validationError);
                  return;
                }

                setIsProcessing(true);
                setCheckoutError("");
                markOrderPaid(activeOrderId);

                const response = await fetch("/api/sales/confirm-payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId: activeOrderId,
                    transferNote,
                    courseSlug: selectedCourse.slug,
                    fullName: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    phone: phone.trim(),
                    amount: finalPrice,
                  }),
                });

                const payload = await response.json();
                setIsProcessing(false);

                if (!response.ok) {
                  setRequestStatus(
                    payload.error ?? "Không ghi nhận được yêu cầu phê duyệt",
                  );
                  showToast({
                    type: "error",
                    message:
                      payload.error ?? "Không ghi nhận được yêu cầu phê duyệt",
                  });
                  return;
                }

                const message =
                  payload.message ??
                  "Đã gửi yêu cầu, vui lòng chờ admin phê duyệt để nhận tài khoản qua email.";
                setRequestStatus(message);
                setHasSubmittedApproval(true);
                setFullName("");
                setEmail("");
                setPhone("");
                setCouponInput("");
                setActiveCoupon(null);
                showToast({ type: "success", message });
              }}
              disabled={!activeOrderId || isProcessing || hasSubmittedApproval}
            >
              {hasSubmittedApproval
                ? "Đã gửi yêu cầu phê duyệt"
                : isProcessing
                  ? "Đang gửi yêu cầu phê duyệt..."
                  : "Tôi đã chuyển khoản (gửi admin duyệt)"}
            </button>
            {activeOrder?.status === "paid" && (
              <p className="rounded-lg bg-green-500/20 p-2 text-center text-xs text-green-300">
                Thanh toán đã ghi nhận. Vui lòng chờ admin phê duyệt để kích
                hoạt tài khoản học tập.
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
