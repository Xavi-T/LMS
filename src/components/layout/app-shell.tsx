"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLearning = pathname.startsWith("/learn/");

  return (
    <>
      {!isLearning && <SiteHeader />}
      <main
        className={isLearning ? "min-h-screen" : "min-h-[calc(100vh-64px)]"}
      >
        {children}
      </main>
      {!isLearning && <SiteFooter />}
    </>
  );
}
