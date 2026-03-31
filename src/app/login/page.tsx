"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/contexts/app-context";

export default function LoginPage() {
  const router = useRouter();
  const { loginAs } = useAppState();
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    const params = new URLSearchParams(window.location.search);
    return params.get("email") ?? "";
  });
  const [password, setPassword] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    const params = new URLSearchParams(window.location.search);
    return params.get("password") ?? "";
  });
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setLoginError("");

    if (!email || !password) {
      setLoginError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (!response.ok) {
        setLoginError(result?.error ?? "Đăng nhập thất bại.");
        return;
      }

      const apiRole = result?.user?.role ?? "student";
      loginAs(apiRole, {
        name: result?.user?.name ?? email.split("@")[0] ?? "Học viên",
        email: result?.user?.email ?? email,
        phone: result?.user?.phone,
        purchasedCourseSlugs: Array.isArray(result?.purchasedCourseSlugs)
          ? result.purchasedCourseSlugs
          : [],
      });

      router.push("/dashboard");
    } catch {
      setLoginError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-app py-8 md:py-14">
      <div className="mx-auto w-full max-w-lg card p-5 md:p-7">
        <p className="text-xs uppercase tracking-wider text-accent">Auth</p>
        <h1 className="mt-1 text-2xl font-black">Đăng nhập hệ thống LMS</h1>

        <div className="mt-5 space-y-3 text-sm">
          <div>
            <p className="mb-1 text-zinc-400">Email</p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-black px-3 py-2"
            />
          </div>

          <div>
            <p className="mb-1 text-zinc-400">Mật khẩu</p>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu đã nhận qua email"
              className="w-full rounded-lg border border-border bg-black px-3 py-2"
            />
          </div>

          <button
            className="btn-primary w-full py-3 text-sm"
            disabled={isSubmitting}
            onClick={handleLogin}
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          {loginError && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-200">
              {loginError}
            </p>
          )}

          <p className="text-xs text-zinc-400">
            Chỉ hỗ trợ đăng nhập bằng email và mật khẩu. Admin mặc định:
            admin@sportprint.vn / Admin@123456 (có thể đổi bằng
            ADMIN_EMAIL/ADMIN_PASSWORD).
          </p>
        </div>
      </div>
    </div>
  );
}
