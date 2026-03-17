"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/contexts/app-context";
import { UserRole } from "@/types/lms";

export default function LoginPage() {
  const router = useRouter();
  const { loginAs, loginWithCredential } = useAppState();
  const [role, setRole] = useState<UserRole>("student");
  const [name, setName] = useState("Học viên Demo");
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") {
      return "demo@sportprint.vn";
    }
    const params = new URLSearchParams(window.location.search);
    return params.get("email") ?? "demo@sportprint.vn";
  });
  const [phone, setPhone] = useState("0900000000");
  const [password, setPassword] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    const params = new URLSearchParams(window.location.search);
    return params.get("password") ?? "";
  });
  const [credentialError, setCredentialError] = useState("");

  return (
    <div className="container-app py-8 md:py-14">
      <div className="mx-auto w-full max-w-lg card p-5 md:p-7">
        <p className="text-xs uppercase tracking-wider text-accent">
          Mock Authentication
        </p>
        <h1 className="mt-1 text-2xl font-black">
          Đăng nhập / Đăng ký thành viên
        </h1>

        <div className="mt-5 space-y-3 text-sm">
          <div>
            <p className="mb-1 text-zinc-400">Họ tên</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-black px-3 py-2"
            />
          </div>
          <div>
            <p className="mb-1 text-zinc-400">Email</p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-black px-3 py-2"
            />
          </div>
          <div>
            <p className="mb-1 text-zinc-400">Số điện thoại</p>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-black px-3 py-2"
            />
          </div>

          <div>
            <p className="mb-1 text-zinc-400">Mật khẩu tài khoản học viên</p>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Nhập mật khẩu đã nhận qua email"
              className="w-full rounded-lg border border-border bg-black px-3 py-2"
            />
          </div>

          <div>
            <p className="mb-1 text-zinc-400">Vai trò</p>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-border bg-black px-3 py-2"
            >
              <option value="student">Học viên</option>
              <option value="instructor">Giảng viên</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            className="btn-primary w-full py-3 text-sm"
            onClick={() => {
              setCredentialError("");
              loginAs(role, { name, email, phone });
              router.push("/dashboard");
            }}
          >
            Đăng nhập bằng Email / SĐT
          </button>

          <button
            className="btn-secondary w-full py-3 text-sm"
            onClick={() => {
              setCredentialError("");
              if (!email || !password) {
                setCredentialError("Vui lòng nhập email và mật khẩu.");
                return;
              }

              const success = loginWithCredential({ email, password });
              if (!success) {
                setCredentialError(
                  "Sai tài khoản/mật khẩu hoặc tài khoản chưa được cấp sau thanh toán.",
                );
                return;
              }

              router.push("/dashboard");
            }}
          >
            Đăng nhập bằng tài khoản đã cấp
          </button>

          {credentialError && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-200">
              {credentialError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-secondary py-2 text-xs"
              onClick={() => {
                loginAs("student", {
                  name: "Google User",
                  email: "google@sportprint.vn",
                });
                router.push("/dashboard");
              }}
            >
              Đăng nhập Google
            </button>
            <button
              className="btn-secondary py-2 text-xs"
              onClick={() => {
                loginAs("student", {
                  name: "Facebook User",
                  email: "facebook@sportprint.vn",
                });
                router.push("/dashboard");
              }}
            >
              Đăng nhập Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
