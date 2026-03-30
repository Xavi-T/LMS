"use client";

import Link from "next/link";
import { Menu, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { useAppState } from "@/contexts/app-context";

const links = [
  { href: "/", label: "Trang chủ" },
  { href: "/chuong-trinh-thuc-chien", label: "Chương trình" },
  { href: "/courses", label: "Khóa học" },
  { href: "/dashboard", label: "Khóa học của tôi" },
  { href: "/contact", label: "Liên hệ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAppState();
  const visibleLinks =
    user?.role === "admin"
      ? [
          { href: "/admin", label: "Quản lý" },
          { href: "/admin/courses", label: "QL Khóa học" },
        ]
      : links;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
    } finally {
      logout();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-black/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="font-black tracking-wide">
          SPORT<span className="text-accent">PRINT</span> LMS
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
                onClick={handleLogout}
                className="btn-secondary px-3 py-2 text-sm"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary px-3 py-2 text-sm">
              Đăng nhập
            </Link>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((prev) => !prev)}>
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
                    handleLogout();
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <UserCircle2 size={16} /> Đăng xuất
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
  );
}
