"use client";

import { useAppState } from "@/contexts/app-context";

export function AppToasts() {
  const { toasts, dismissToast } = useAppState();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-lg backdrop-blur ${
            toast.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100"
              : toast.type === "error"
                ? "border-red-500/40 bg-red-500/15 text-red-100"
                : "border-zinc-500/40 bg-zinc-900/90 text-zinc-100"
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="leading-5">{toast.message}</p>
            <button
              type="button"
              className="rounded border border-current/30 px-2 py-0.5 text-xs opacity-80 hover:opacity-100"
              onClick={() => dismissToast(toast.id)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
