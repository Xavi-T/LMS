"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { useAppState } from "@/contexts/app-context";

type AdminUser = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  course_slug: string;
  plain_password: string;
  status: "active" | "blocked";
  created_at: string;
};

type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  level: "Cơ bản" | "Nâng cao";
  price: number;
  students_count: number;
  rating: number;
  is_best_seller: boolean;
};

type AdminResource = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  file_type: ".CDR" | ".AI" | ".PSD";
  preview_image: string | null;
  storage_path: string;
};

type LeadItem = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  package_name: string | null;
  course_slug: string | null;
  status: "new" | "contacted" | "paid" | "closed";
  approval_flow:
    | "provision-account"
    | "grant-course-access"
    | "already-granted"
    | "invalid";
  has_account: boolean;
  created_at: string;
};

type AdminTab = "overview" | "approvals" | "users" | "orders";

export default function AdminPage() {
  const { user, orders, purchasedCourseSlugs, showToast } = useAppState();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [coursesData, setCoursesData] = useState<AdminCourse[]>([]);
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>("approvals");

  const [userKeyword, setUserKeyword] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState<
    "all" | "new" | "paid" | "closed"
  >("all");

  const [userError, setUserError] = useState("");
  const [courseError, setCourseError] = useState("");
  const [resourceError, setResourceError] = useState("");
  const [approvalError, setApprovalError] = useState("");

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [isSubmittingResource, setIsSubmittingResource] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [actionNotice, setActionNotice] = useState("");

  const [generatedPassword, setGeneratedPassword] = useState("");
  const [approvedCredential, setApprovedCredential] = useState<{
    email: string;
    password: string;
    courseSlug: string;
  } | null>(null);

  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    courseSlug: "",
    password: "",
  });

  const [courseEdits, setCourseEdits] = useState<
    Record<
      string,
      {
        title: string;
        shortDescription: string;
        level: "Cơ bản" | "Nâng cao";
        price: number;
        isBestSeller: boolean;
      }
    >
  >({});

  const [resourceEdits, setResourceEdits] = useState<
    Record<
      string,
      {
        title: string;
        description: string;
        fileType: ".CDR" | ".AI" | ".PSD";
        previewImage: string;
        storagePath: string;
      }
    >
  >({});

  const [newResource, setNewResource] = useState({
    courseId: "",
    title: "",
    description: "",
    fileType: ".CDR" as ".CDR" | ".AI" | ".PSD",
    previewImage: "",
    storagePath: "",
  });

  const revenue = useMemo(
    () =>
      orders
        .filter((item) => item.status === "paid")
        .reduce((sum, item) => sum + item.amount, 0),
    [orders],
  );

  const activeUsers = users.filter((item) => item.status === "active").length;
  const blockedUsers = users.filter((item) => item.status === "blocked").length;
  const pendingApprovals = leads.filter((item) => item.status === "new").length;

  const courseMap = useMemo(() => {
    return new Map(coursesData.map((item) => [item.id, item]));
  }, [coursesData]);

  const courseSlugMap = useMemo(() => {
    return new Map(coursesData.map((item) => [item.slug, item.title]));
  }, [coursesData]);

  const filteredUsers = useMemo(() => {
    const keyword = userKeyword.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((item) => {
      const fullName = item.full_name?.toLowerCase() ?? "";
      const email = item.email.toLowerCase();
      const phone = item.phone?.toLowerCase() ?? "";
      const course = item.course_slug.toLowerCase();
      return (
        fullName.includes(keyword) ||
        email.includes(keyword) ||
        phone.includes(keyword) ||
        course.includes(keyword)
      );
    });
  }, [userKeyword, users]);

  const filteredLeads = useMemo(() => {
    if (leadStatusFilter === "all") return leads;
    return leads.filter((item) => item.status === leadStatusFilter);
  }, [leadStatusFilter, leads]);

  const isRefreshing =
    isLoadingUsers || isLoadingCourses || isLoadingResources || isLoadingLeads;

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setUserError("");
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        setUserError(result?.error ?? "Không tải được danh sách user.");
        return;
      }

      setUsers(result?.users ?? []);
    } catch {
      setUserError("Không thể kết nối API quản lý user.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    setCourseError("");
    try {
      const response = await fetch("/api/admin/courses", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        setCourseError(result?.error ?? "Không tải được danh sách khóa học.");
        return;
      }

      const nextCourses = (result?.courses ?? []) as AdminCourse[];
      setCoursesData(nextCourses);
      setCourseEdits(
        nextCourses.reduce(
          (acc, course) => ({
            ...acc,
            [course.id]: {
              title: course.title,
              shortDescription: course.short_description,
              level: course.level,
              price: course.price,
              isBestSeller: course.is_best_seller,
            },
          }),
          {},
        ),
      );

      if (!newUser.courseSlug && nextCourses.length > 0) {
        setNewUser((prev) => ({ ...prev, courseSlug: nextCourses[0].slug }));
      }
      if (!newResource.courseId && nextCourses.length > 0) {
        setNewResource((prev) => ({ ...prev, courseId: nextCourses[0].id }));
      }
    } catch {
      setCourseError("Không thể kết nối API khóa học.");
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadResources = async () => {
    setIsLoadingResources(true);
    setResourceError("");
    try {
      const response = await fetch("/api/admin/resources", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        setResourceError(result?.error ?? "Không tải được danh sách tài liệu.");
        return;
      }

      const nextResources = (result?.resources ?? []) as AdminResource[];
      setResources(nextResources);
      setResourceEdits(
        nextResources.reduce(
          (acc, resource) => ({
            ...acc,
            [resource.id]: {
              title: resource.title,
              description: resource.description ?? "",
              fileType: resource.file_type,
              previewImage: resource.preview_image ?? "",
              storagePath: resource.storage_path,
            },
          }),
          {},
        ),
      );
    } catch {
      setResourceError("Không thể kết nối API tài liệu.");
    } finally {
      setIsLoadingResources(false);
    }
  };

  const loadLeads = async () => {
    setIsLoadingLeads(true);
    setApprovalError("");
    try {
      const response = await fetch("/api/admin/approvals", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        setApprovalError(
          result?.error ?? "Không tải được danh sách phê duyệt.",
        );
        return;
      }
      setLeads((result?.requests ?? []) as LeadItem[]);
    } catch {
      setApprovalError("Không thể kết nối API phê duyệt.");
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      return;
    }

    loadUsers();
    loadCourses();
    loadResources();
    loadLeads();
  }, [user?.role]);

  useEffect(() => {
    if (userError) {
      showToast({ type: "error", message: userError });
    }
  }, [showToast, userError]);

  useEffect(() => {
    if (courseError) {
      showToast({ type: "error", message: courseError });
    }
  }, [courseError, showToast]);

  useEffect(() => {
    if (resourceError) {
      showToast({ type: "error", message: resourceError });
    }
  }, [resourceError, showToast]);

  useEffect(() => {
    if (approvalError) {
      showToast({ type: "error", message: approvalError });
    }
  }, [approvalError, showToast]);

  useEffect(() => {
    if (!actionNotice) return;
    showToast({ type: "success", message: actionNotice });
    setActionNotice("");
  }, [actionNotice, showToast]);

  const createUser = async () => {
    setIsSubmittingUser(true);
    setUserError("");
    setGeneratedPassword("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const result = await response.json();
      if (!response.ok) {
        setUserError(result?.error ?? "Không tạo được user.");
        return;
      }

      setGeneratedPassword(result?.generatedPassword ?? "");
      setActionNotice(
        result?.generatedPassword
          ? "Tạo user thành công và đã cấp mật khẩu mới."
          : "Tạo/Cập nhật user thành công.",
      );
      setNewUser((prev) => ({
        ...prev,
        fullName: "",
        email: "",
        phone: "",
        password: "",
      }));
      await loadUsers();
    } catch {
      setUserError("Không thể kết nối API tạo user.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const saveCourse = async (courseId: string) => {
    const current = courseEdits[courseId];
    if (!current) return;

    setIsSubmittingCourse(true);
    setCourseError("");
    try {
      const response = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: courseId,
          title: current.title,
          shortDescription: current.shortDescription,
          level: current.level,
          price: Number(current.price),
          isBestSeller: current.isBestSeller,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setCourseError(result?.error ?? "Không cập nhật được khóa học.");
        return;
      }

      await loadCourses();
      setActionNotice("Đã lưu cập nhật khóa học.");
    } catch {
      setCourseError("Không thể kết nối API khóa học.");
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const createResource = async () => {
    setIsSubmittingResource(true);
    setResourceError("");
    try {
      const response = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResource),
      });
      const result = await response.json();
      if (!response.ok) {
        setResourceError(result?.error ?? "Không tạo được tài liệu.");
        return;
      }

      setNewResource((prev) => ({
        ...prev,
        title: "",
        description: "",
        previewImage: "",
        storagePath: "",
      }));
      await loadResources();
      setActionNotice("Đã tạo tài liệu mới.");
    } catch {
      setResourceError("Không thể kết nối API tài liệu.");
    } finally {
      setIsSubmittingResource(false);
    }
  };

  const saveResource = async (resourceId: string) => {
    const current = resourceEdits[resourceId];
    if (!current) return;

    setIsSubmittingResource(true);
    setResourceError("");
    try {
      const response = await fetch("/api/admin/resources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resourceId,
          title: current.title,
          description: current.description,
          fileType: current.fileType,
          previewImage: current.previewImage,
          storagePath: current.storagePath,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setResourceError(result?.error ?? "Không cập nhật được tài liệu.");
        return;
      }

      await loadResources();
      setActionNotice("Đã lưu thay đổi tài liệu.");
    } catch {
      setResourceError("Không thể kết nối API tài liệu.");
    } finally {
      setIsSubmittingResource(false);
    }
  };

  const deleteResource = async (resourceId: string) => {
    setIsSubmittingResource(true);
    setResourceError("");
    try {
      const response = await fetch(`/api/admin/resources?id=${resourceId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        setResourceError(result?.error ?? "Không xóa được tài liệu.");
        return;
      }
      await loadResources();
      setActionNotice("Đã xóa tài liệu.");
    } catch {
      setResourceError("Không thể kết nối API tài liệu.");
    } finally {
      setIsSubmittingResource(false);
    }
  };

  const updateLeadStatus = async (
    requestId: string,
    status: "new" | "paid" | "closed",
  ) => {
    setIsSubmittingApproval(true);
    setApprovalError("");
    try {
      const response = await fetch("/api/admin/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      const result = await response.json();
      if (!response.ok) {
        setApprovalError(result?.error ?? "Không cập nhật được trạng thái.");
        return;
      }
      await loadLeads();
      setActionNotice("Đã cập nhật trạng thái yêu cầu.");
    } catch {
      setApprovalError("Không thể kết nối API phê duyệt.");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const approveLead = async (
    requestId: string,
    action: "provision-account" | "grant-course-access",
  ) => {
    setIsSubmittingApproval(true);
    setApprovalError("");
    setApprovedCredential(null);
    try {
      const response = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const result = await response.json();
      if (!response.ok) {
        setApprovalError(result?.error ?? "Không phê duyệt được học viên.");
        return;
      }

      if (result?.credential) {
        setApprovedCredential(result.credential);
        setActionNotice(
          result?.message ??
            (action === "provision-account"
              ? "Đã cấp tài khoản học viên lần đầu."
              : "Đã cấp quyền truy cập khóa học cho học viên."),
        );
      }

      if (result?.emailStatus === "failed") {
        showToast({
          type: "error",
          message:
            result?.emailError ||
            "Đã cấp tài khoản nhưng gửi email cho học viên thất bại.",
        });
      }

      await Promise.all([loadLeads(), loadUsers()]);
    } catch {
      setApprovalError("Không thể kết nối API xử lý yêu cầu.");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const deleteUserAccount = async (targetUser: AdminUser) => {
    setIsSubmittingUser(true);
    setUserError("");
    setGeneratedPassword("");

    try {
      const response = await fetch(
        `/api/admin/users?id=${encodeURIComponent(targetUser.id)}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();

      if (!response.ok) {
        setUserError(result?.error ?? "Không xóa được tài khoản học viên.");
        return;
      }

      if (result?.warning) {
        showToast({ type: "error", message: result.warning });
      }

      const closedRequestCount = Number(result?.closedRequestCount ?? 0);
      setActionNotice(
        closedRequestCount > 0
          ? `Đã xóa tài khoản học viên và đóng ${closedRequestCount} yêu cầu liên quan.`
          : "Đã xóa tài khoản học viên.",
      );
      await Promise.all([loadUsers(), loadLeads()]);
    } catch {
      setUserError("Không thể kết nối API xóa tài khoản.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const updateUser = async (
    id: string,
    payload: {
      status?: "active" | "blocked";
      resetPassword?: boolean;
    },
  ) => {
    setUserError("");
    setGeneratedPassword("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const result = await response.json();

      if (!response.ok) {
        setUserError(result?.error ?? "Không cập nhật được user.");
        return;
      }

      if (result?.generatedPassword) {
        setGeneratedPassword(result.generatedPassword);
        setActionNotice("Đã reset mật khẩu user.");
      } else {
        setActionNotice("Đã cập nhật trạng thái user.");
      }
      await loadUsers();
    } catch {
      setUserError("Không thể kết nối API cập nhật user.");
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="container-app py-10">
        <div className="card p-5 text-center text-sm">
          Khu vực quản trị chỉ dành cho Admin. Hãy đăng nhập với vai trò admin
          để thao tác.
        </div>
      </div>
    );
  }

  return (
    <div className="container-app space-y-5 py-6 md:space-y-6 md:py-10">
      <div className="card p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-accent">
              Admin Panel
            </p>
            <h1 className="text-2xl font-black md:text-4xl">
              Quản trị LMS SportPrint
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Một trang quản lý tập trung: duyệt học viên, quản lý học viên,
              khóa học và tài liệu.
            </p>
          </div>
          <button
            className="btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              loadUsers();
              loadCourses();
              loadResources();
              loadLeads();
            }}
            disabled={isRefreshing}
          >
            Tải lại dữ liệu
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="card p-4">
          <p className="text-xs text-zinc-400">Yêu cầu chờ duyệt</p>
          <p className="mt-1 text-2xl font-black text-accent">
            {pendingApprovals}
          </p>
        </article>
        <article className="card p-4">
          <p className="text-xs text-zinc-400">Tổng học viên</p>
          <p className="mt-1 text-2xl font-black">{users.length}</p>
        </article>
        <article className="card p-4">
          <p className="text-xs text-zinc-400">Khóa học</p>
          <p className="mt-1 text-2xl font-black">{coursesData.length}</p>
        </article>
        <article className="card p-4">
          <p className="text-xs text-zinc-400">Đơn hàng</p>
          <p className="mt-1 text-2xl font-black">{orders.length}</p>
        </article>
        <article className="card p-4">
          <p className="text-xs text-zinc-400">Doanh thu đã thanh toán</p>
          <p className="mt-1 text-2xl font-black text-accent">
            {formatCurrency(revenue)}
          </p>
        </article>
      </section>

      <section className="card p-2">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["overview", "Tổng quan"],
              ["approvals", `Phê duyệt (${pendingApprovals})`],
              ["users", "Học viên"],
              ["orders", "Đơn hàng"],
            ] as Array<[AdminTab, string]>
          ).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                activeTab === tab
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-zinc-300 hover:border-accent/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "overview" && (
        <section className="grid gap-3 md:grid-cols-2">
          <article className="card p-4">
            <h2 className="text-lg font-bold">Trọng tâm hôm nay</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li>- Yêu cầu chờ duyệt: {pendingApprovals}</li>
              <li>- Học viên active: {activeUsers}</li>
              <li>- Học viên blocked: {blockedUsers}</li>
              <li>- Tài liệu đã tạo: {resources.length}</li>
            </ul>
          </article>
          <article className="card p-4">
            <h2 className="text-lg font-bold">Gợi ý thao tác</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li>
                - Vào tab Phê duyệt để tách luồng cấp tài khoản và cấp quyền
                khóa học.
              </li>
              <li>- Vào tab Học viên để khóa/mở khóa hoặc reset mật khẩu.</li>
              <li>
                - Vào trang /admin/courses để quản lý khóa học, bài giảng và tài
                liệu.
              </li>
            </ul>
          </article>
        </section>
      )}

      {activeTab === "users" && (
        <section className="card p-4 text-sm md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Quản lý học viên</h2>
            <p className="text-xs text-zinc-500">{users.length} học viên</p>
          </div>
          <p className="mt-2 text-zinc-400">
            Active: {activeUsers} · Blocked: {blockedUsers} · Khóa đã kích hoạt
            local: {purchasedCourseSlugs.length}
          </p>

          <div className="mt-4 grid gap-3 rounded-lg border border-border p-3 md:grid-cols-5">
            <input
              value={newUser.fullName}
              onChange={(e) =>
                setNewUser((prev) => ({ ...prev, fullName: e.target.value }))
              }
              placeholder="Họ tên"
              className="rounded-lg border border-border bg-black px-3 py-2"
            />
            <input
              value={newUser.email}
              onChange={(e) =>
                setNewUser((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="Email"
              className="rounded-lg border border-border bg-black px-3 py-2"
            />
            <input
              value={newUser.phone}
              onChange={(e) =>
                setNewUser((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="Số điện thoại"
              className="rounded-lg border border-border bg-black px-3 py-2"
            />
            <select
              value={newUser.courseSlug}
              onChange={(e) =>
                setNewUser((prev) => ({ ...prev, courseSlug: e.target.value }))
              }
              className="rounded-lg border border-border bg-black px-3 py-2"
            >
              {coursesData.map((course) => (
                <option value={course.slug} key={course.slug}>
                  {course.slug}
                </option>
              ))}
            </select>
            <input
              value={newUser.password}
              onChange={(e) =>
                setNewUser((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Mật khẩu (trống = auto)"
              className="rounded-lg border border-border bg-black px-3 py-2"
            />
            <button
              className="btn-primary md:col-span-5"
              disabled={isSubmittingUser}
              onClick={createUser}
            >
              {isSubmittingUser ? "Đang tạo..." : "Tạo / Cập nhật user"}
            </button>
          </div>

          {generatedPassword && (
            <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-200">
              Mật khẩu vừa tạo/reset:{" "}
              <span className="font-semibold">{generatedPassword}</span>
            </p>
          )}

          {userError && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
              {userError}
            </p>
          )}

          <div className="mt-4 grid gap-2 md:grid-cols-3">
            <input
              value={userKeyword}
              onChange={(event) => setUserKeyword(event.target.value)}
              placeholder="Tìm theo tên, email, điện thoại hoặc khóa học"
              className="rounded-lg border border-border bg-black px-3 py-2 md:col-span-2"
            />
            <div className="rounded-lg border border-border bg-black px-3 py-2 text-xs text-zinc-400">
              Hiển thị: {filteredUsers.length} / {users.length}
            </div>
          </div>

          <div className="mt-4 max-h-105 space-y-2 overflow-y-auto pr-1">
            {isLoadingUsers && (
              <p className="text-zinc-400">Đang tải danh sách user...</p>
            )}

            {!isLoadingUsers && filteredUsers.length === 0 && (
              <p className="text-zinc-400">Chưa có user trong hệ thống.</p>
            )}

            {filteredUsers.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {item.full_name || "(Chưa có tên)"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {item.email} · {item.phone || "--"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {item.course_slug} · trạng thái: {item.status}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Mật khẩu hiện tại: {item.plain_password}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn-secondary px-3 py-2 text-xs"
                      onClick={() =>
                        updateUser(item.id, {
                          status:
                            item.status === "active" ? "blocked" : "active",
                        })
                      }
                    >
                      {item.status === "active" ? "Khóa" : "Mở khóa"}
                    </button>
                    <button
                      className="btn-secondary px-3 py-2 text-xs"
                      onClick={() =>
                        updateUser(item.id, { resetPassword: true })
                      }
                    >
                      Reset mật khẩu
                    </button>
                    <button
                      className="btn-secondary px-3 py-2 text-xs"
                      disabled={isSubmittingUser}
                      onClick={() => deleteUserAccount(item)}
                    >
                      Xóa tài khoản
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "orders" && (
        <section className="card p-4 text-sm md:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Quản lý đơn hàng</h2>
            <p className="text-xs text-zinc-500">{orders.length} đơn hàng</p>
          </div>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
            {orders.length === 0 && (
              <p className="text-zinc-400">Chưa có đơn hàng.</p>
            )}
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-border p-3"
              >
                <p className="font-semibold">{order.id}</p>
                <p className="text-xs text-zinc-400">
                  Course: {order.courseSlug}
                </p>
                <p className="text-xs">
                  {formatCurrency(order.amount)} · {order.status}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "approvals" && (
        <section className="card p-4 text-sm md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">
              Trạng thái yêu cầu & phê duyệt
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">Lọc trạng thái</span>
              <select
                value={leadStatusFilter}
                onChange={(event) =>
                  setLeadStatusFilter(
                    event.target.value as "all" | "new" | "paid" | "closed",
                  )
                }
                className="rounded-lg border border-border bg-black px-3 py-2"
              >
                <option value="all">Tất cả</option>
                <option value="new">Mới</option>
                <option value="paid">Đã duyệt</option>
                <option value="closed">Đã từ chối</option>
              </select>
            </div>
          </div>

          {approvalError && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
              {approvalError}
            </p>
          )}

          {approvedCredential && (
            <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-200">
              Đã xử lý yêu cầu cho: {approvedCredential.email}
              {approvedCredential.password
                ? ` / ${approvedCredential.password}`
                : ""}{" "}
              ({approvedCredential.courseSlug})
            </p>
          )}

          <div className="mt-4 max-h-105 space-y-2 overflow-y-auto pr-1">
            {isLoadingLeads && (
              <p className="text-zinc-400">Đang tải danh sách yêu cầu chờ...</p>
            )}

            {!isLoadingLeads && filteredLeads.length === 0 && (
              <p className="text-zinc-400">Chưa có yêu cầu cần phê duyệt.</p>
            )}

            {filteredLeads.map((lead) => (
              <article
                key={lead.id}
                className="rounded-lg border border-border p-3"
              >
                {(() => {
                  const flowLabel =
                    lead.approval_flow === "provision-account"
                      ? "Cần cấp tài khoản lần đầu"
                      : lead.approval_flow === "grant-course-access"
                        ? "Cần cấp quyền truy cập khóa học"
                        : lead.approval_flow === "already-granted"
                          ? "Đã có quyền truy cập khóa học"
                          : "Thiếu dữ liệu để xử lý";

                  return (
                    <p className="mb-1 text-xs text-accent">{flowLabel}</p>
                  );
                })()}
                <p className="font-semibold">{lead.full_name}</p>
                <p className="text-xs text-zinc-400">
                  {lead.email || "(chưa có email)"} · {lead.phone || "--"}
                </p>
                <p className="text-xs text-zinc-500">
                  {lead.course_slug
                    ? courseSlugMap.get(lead.course_slug) || lead.course_slug
                    : "(chưa chọn khóa)"}{" "}
                  · Trạng thái:{" "}
                  {lead.status === "new"
                    ? "Mới"
                    : lead.status === "paid"
                      ? "Đã duyệt"
                      : "Đã từ chối"}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {lead.status !== "paid" ? (
                    <>
                      <button
                        className="btn-secondary px-3 py-2 text-xs"
                        disabled={isSubmittingApproval}
                        onClick={() => updateLeadStatus(lead.id, "closed")}
                      >
                        Từ chối yêu cầu
                      </button>

                      {lead.approval_flow === "provision-account" && (
                        <button
                          className="btn-primary px-3 py-2 text-xs"
                          disabled={isSubmittingApproval}
                          onClick={() =>
                            approveLead(lead.id, "provision-account")
                          }
                        >
                          Cấp tài khoản lần đầu
                        </button>
                      )}

                      {lead.approval_flow === "grant-course-access" && (
                        <button
                          className="btn-primary px-3 py-2 text-xs"
                          disabled={isSubmittingApproval}
                          onClick={() =>
                            approveLead(lead.id, "grant-course-access")
                          }
                        >
                          Cấp quyền truy cập khóa học
                        </button>
                      )}

                      {lead.approval_flow === "already-granted" && (
                        <button
                          className="btn-secondary px-3 py-2 text-xs"
                          disabled={isSubmittingApproval}
                          onClick={() => updateLeadStatus(lead.id, "paid")}
                        >
                          Đánh dấu đã duyệt
                        </button>
                      )}

                      {lead.approval_flow === "invalid" && (
                        <button
                          className="btn-secondary px-3 py-2 text-xs opacity-60"
                          disabled
                        >
                          Không đủ dữ liệu để xử lý
                        </button>
                      )}
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
