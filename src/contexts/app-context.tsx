"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppUser, Order, UserRole } from "@/types/lms";

interface LearningProgress {
  [courseSlug: string]: string[];
}

interface DownloadItem {
  id: string;
  title: string;
  courseSlug: string;
  downloadedAt: string;
}

interface IssuedCredential {
  email: string;
  password: string;
  courseSlug: string;
  issuedAt: string;
}

export interface AppToast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface PersistedAppState {
  user: AppUser | null;
  purchasedCourseSlugs: string[];
  orders: Order[];
  learningProgress: LearningProgress;
  videoPositions: Record<string, number>;
  downloads: DownloadItem[];
  issuedCredentials: IssuedCredential[];
}

interface AppState {
  user: AppUser | null;
  purchasedCourseSlugs: string[];
  orders: Order[];
  learningProgress: LearningProgress;
  videoPositions: Record<string, number>;
  downloads: DownloadItem[];
  issuedCredentials: IssuedCredential[];
  toasts: AppToast[];
  loginAs: (
    role: UserRole,
    payload: {
      name: string;
      email?: string;
      phone?: string;
      purchasedCourseSlugs?: string[];
    },
  ) => void;
  loginWithCredential: (payload: {
    email: string;
    password: string;
  }) => boolean;
  logout: () => void;
  purchaseCourse: (params: {
    courseSlug: string;
    amount: number;
    couponCode?: string;
    transferNote: string;
  }) => string;
  markOrderPaid: (orderId: string) => void;
  markLessonComplete: (courseSlug: string, lessonId: string) => void;
  markLessonInProgress: (courseSlug: string, lessonId: string) => void;
  saveVideoPosition: (lessonId: string, time: number) => void;
  markDownloaded: (params: {
    id: string;
    title: string;
    courseSlug: string;
  }) => void;
  saveIssuedCredential: (payload: {
    email: string;
    password: string;
    courseSlug: string;
  }) => void;
  showToast: (payload: {
    type?: "success" | "error" | "info";
    message: string;
    durationMs?: number;
  }) => void;
  dismissToast: (toastId: string) => void;
}

const STORAGE_KEY = "sportprint-lms-app-state";

const emptyState = (): PersistedAppState => ({
  user: null,
  purchasedCourseSlugs: [],
  orders: [],
  learningProgress: {},
  videoPositions: {},
  downloads: [],
  issuedCredentials: [],
});

const getInitialState = (): PersistedAppState => {
  if (typeof window === "undefined") {
    return emptyState();
  }

  const savedRaw = localStorage.getItem(STORAGE_KEY);
  if (!savedRaw) {
    return emptyState();
  }

  try {
    const parsed = JSON.parse(savedRaw);
    return {
      user: parsed.user ?? null,
      purchasedCourseSlugs: parsed.purchasedCourseSlugs ?? [],
      orders: parsed.orders ?? [],
      learningProgress: parsed.learningProgress ?? {},
      videoPositions: parsed.videoPositions ?? {},
      downloads: parsed.downloads ?? [],
      issuedCredentials: parsed.issuedCredentials ?? [],
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return emptyState();
  }
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedAppState>(() => emptyState());
  const [isHydrated, setIsHydrated] = useState(false);
  const [toasts, setToasts] = useState<AppToast[]>([]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setState(getInitialState());
      setIsHydrated(true);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isHydrated, state]);

  const loginAs = useCallback(
    (
      role: UserRole,
      payload: {
        name: string;
        email?: string;
        phone?: string;
        purchasedCourseSlugs?: string[];
      },
    ) => {
      setState((prev) => ({
        ...prev,
        user: {
          id: `u-${Date.now()}`,
          role,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
        },
        purchasedCourseSlugs:
          role === "student"
            ? (payload.purchasedCourseSlugs ?? [])
            : prev.purchasedCourseSlugs,
      }));
    },
    [],
  );

  const loginWithCredential = useCallback(
    (payload: { email: string; password: string }) => {
      const found = state.issuedCredentials.find(
        (item) =>
          item.email.toLowerCase() === payload.email.toLowerCase() &&
          item.password === payload.password,
      );

      if (!found) {
        return false;
      }

      setState((prev) => ({
        ...prev,
        user: {
          id: `u-${Date.now()}`,
          role: "student",
          name: payload.email.split("@")[0] || "Học viên",
          email: payload.email,
        },
        purchasedCourseSlugs: prev.purchasedCourseSlugs.includes(
          found.courseSlug,
        )
          ? prev.purchasedCourseSlugs
          : [...prev.purchasedCourseSlugs, found.courseSlug],
      }));

      return true;
    },
    [state.issuedCredentials],
  );

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, user: null }));
  }, []);

  const purchaseCourse = useCallback(
    (params: {
      courseSlug: string;
      amount: number;
      couponCode?: string;
      transferNote: string;
    }) => {
      const orderId = `OD-${Math.floor(Date.now() / 1000)}`;
      const newOrder: Order = {
        id: orderId,
        createdAt: new Date().toISOString(),
        courseSlug: params.courseSlug,
        amount: params.amount,
        transferNote: params.transferNote,
        couponCode: params.couponCode,
        status: "pending",
      };

      setState((prev) => ({ ...prev, orders: [newOrder, ...prev.orders] }));
      return orderId;
    },
    [],
  );

  const markOrderPaid = useCallback((orderId: string) => {
    setState((prev) => {
      const targetOrder = prev.orders.find((item) => item.id === orderId);
      if (!targetOrder) {
        return prev;
      }

      const nextPurchased = prev.purchasedCourseSlugs.includes(
        targetOrder.courseSlug,
      )
        ? prev.purchasedCourseSlugs
        : [...prev.purchasedCourseSlugs, targetOrder.courseSlug];

      return {
        ...prev,
        purchasedCourseSlugs: nextPurchased,
        orders: prev.orders.map((order) =>
          order.id === orderId ? { ...order, status: "paid" as const } : order,
        ),
      };
    });
  }, []);

  const markLessonComplete = useCallback(
    (courseSlug: string, lessonId: string) => {
      setState((prev) => {
        const existing = prev.learningProgress[courseSlug] ?? [];
        if (existing.includes(lessonId)) {
          return prev;
        }

        return {
          ...prev,
          learningProgress: {
            ...prev.learningProgress,
            [courseSlug]: [...existing, lessonId],
          },
        };
      });
    },
    [],
  );

  const markLessonInProgress = useCallback(
    (courseSlug: string, lessonId: string) => {
      setState((prev) => {
        const existing = prev.learningProgress[courseSlug] ?? [];
        if (!existing.includes(lessonId)) {
          return prev;
        }

        return {
          ...prev,
          learningProgress: {
            ...prev.learningProgress,
            [courseSlug]: existing.filter((item) => item !== lessonId),
          },
        };
      });
    },
    [],
  );

  const saveVideoPosition = useCallback((lessonId: string, time: number) => {
    setState((prev) => ({
      ...prev,
      videoPositions: { ...prev.videoPositions, [lessonId]: time },
    }));
  }, []);

  const markDownloaded = useCallback(
    (params: { id: string; title: string; courseSlug: string }) => {
      setState((prev) => ({
        ...prev,
        downloads: [
          {
            id: params.id,
            title: params.title,
            courseSlug: params.courseSlug,
            downloadedAt: new Date().toISOString(),
          },
          ...prev.downloads,
        ],
      }));
    },
    [],
  );

  const saveIssuedCredential = useCallback(
    (payload: { email: string; password: string; courseSlug: string }) => {
      setState((prev) => {
        const next = prev.issuedCredentials.filter(
          (item) => item.email.toLowerCase() !== payload.email.toLowerCase(),
        );

        return {
          ...prev,
          issuedCredentials: [
            {
              email: payload.email,
              password: payload.password,
              courseSlug: payload.courseSlug,
              issuedAt: new Date().toISOString(),
            },
            ...next,
          ],
        };
      });
    },
    [],
  );

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== toastId));
  }, []);

  const showToast = useCallback(
    (payload: {
      type?: "success" | "error" | "info";
      message: string;
      durationMs?: number;
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const type = payload.type ?? "info";
      const duration = payload.durationMs ?? 3500;

      setToasts((prev) => [...prev, { id, type, message: payload.message }]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, duration);
    },
    [],
  );

  const value = useMemo(
    () => ({
      user: state.user,
      purchasedCourseSlugs: state.purchasedCourseSlugs,
      orders: state.orders,
      learningProgress: state.learningProgress,
      videoPositions: state.videoPositions,
      downloads: state.downloads,
      issuedCredentials: state.issuedCredentials,
      toasts,
      loginAs,
      loginWithCredential,
      logout,
      purchaseCourse,
      markOrderPaid,
      markLessonComplete,
      markLessonInProgress,
      saveVideoPosition,
      markDownloaded,
      saveIssuedCredential,
      showToast,
      dismissToast,
    }),
    [
      dismissToast,
      loginAs,
      loginWithCredential,
      logout,
      markDownloaded,
      markLessonComplete,
      markLessonInProgress,
      markOrderPaid,
      purchaseCourse,
      saveIssuedCredential,
      saveVideoPosition,
      state,
      showToast,
      toasts,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used within AppProvider");
  }

  return context;
};
