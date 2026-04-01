"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { useAppState } from "@/contexts/app-context";

const baseLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/courses", label: "Khóa học" },
  { href: "/contact", label: "Liên hệ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout } = useAppState();
  const visibleLinks =
    user?.role === "admin"
      ? [
          ...baseLinks,
          { href: "/admin", label: "Quản lý chung" },
          { href: "/admin/courses", label: "Quản lý khóa học" },
        ]
      : user?.role === "student"
        ? [...baseLinks, { href: "/my-courses", label: "Khóa học của tôi" }]
        : baseLinks;

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
    } finally {
      logout();
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const requestLogout = () => {
    if (isLoggingOut) {
      return;
    }
    setShowLogoutConfirm(true);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/80 bg-black/90 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-sportprint.svg"
              alt="SportPrint LMS"
              width={180}
              height={36}
              priority
              className="h-8 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            {visibleLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-zinc-200 hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <span className="text-xs text-zinc-300">
                  {user.name} · {user.role}
                </span>
                <button
                  onClick={requestLogout}
                  disabled={isLoggingOut}
                  className="btn-secondary px-3 py-2 text-sm"
                >
                  {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary px-3 py-2 text-sm">
                Đăng nhập
              </Link>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setOpen((prev) => !prev)}
          >
            <Menu size={20} />
          </button>
        </div>

        {open && (
          <div className="border-t border-border bg-black md:hidden">
            <div className="container-app space-y-2 py-3">
              {visibleLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-card"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-1">
                {user ? (
                  <button
                    onClick={() => {
                      if (!isLoggingOut) {
                        requestLogout();
                        setOpen(false);
                      }
                    }}
                    disabled={isLoggingOut}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <UserCircle2 size={16} />
                    {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="block rounded-lg bg-accent px-3 py-2 text-center text-sm font-bold text-black"
                    onClick={() => setOpen(false)}
                  >
                    Đăng nhập / Đăng ký
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-md space-y-4 p-5">
            <h3 className="text-lg font-bold">Xác nhận đăng xuất</h3>
            <p className="text-sm text-zinc-300">
              Bạn có chắc muốn đăng xuất khỏi hệ thống không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary px-3 py-2 text-sm"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary px-3 py-2 text-sm"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
