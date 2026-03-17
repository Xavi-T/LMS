"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { useAppState } from "@/contexts/app-context";

type Tab =
  | "students"
  | "courses"
  | "resources"
  | "approvals"
  | "orders"
  | "stats";

const tabs: { id: Tab; label: string }[] = [
  { id: "students", label: "Học viên" },
  { id: "courses", label: "Khóa học" },
  { id: "resources", label: "Tài liệu" },
  { id: "approvals", label: "Phê duyệt" },
  { id: "orders", label: "Đơn hàng" },
  { id: "stats", label: "Thống kê" },
];

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
  created_at: string;
};

export default function AdminPage() {
  const { user, orders, purchasedCourseSlugs } = useAppState();
  const [tab, setTab] = useState<Tab>("students");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [coursesData, setCoursesData] = useState<AdminCourse[]>([]);
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);

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

  const courseMap = useMemo(() => {
    return new Map(coursesData.map((item) => [item.id, item]));
  }, [coursesData]);

  const courseSlugMap = useMemo(() => {
    return new Map(coursesData.map((item) => [item.slug, item.title]));
  }, [coursesData]);

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

    if (tab === "students") {
      loadUsers();
      loadCourses();
    }

    if (tab === "courses") {
      loadCourses();
    }

    if (tab === "resources") {
      loadCourses();
      loadResources();
    }

    if (tab === "approvals") {
      loadLeads();
      loadCourses();
    }
  }, [tab, user?.role]);

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
    } catch {
      setResourceError("Không thể kết nối API tài liệu.");
    } finally {
      setIsSubmittingResource(false);
    }
  };

  const updateLeadStatus = async (
    requestId: string,
    status: "new" | "contacted" | "paid" | "closed",
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
    } catch {
      setApprovalError("Không thể kết nối API phê duyệt.");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const approveLead = async (requestId: string) => {
    setIsSubmittingApproval(true);
    setApprovalError("");
    setApprovedCredential(null);
    try {
      const response = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const result = await response.json();
      if (!response.ok) {
        setApprovalError(result?.error ?? "Không phê duyệt được học viên.");
        return;
      }

      if (result?.credential) {
        setApprovedCredential(result.credential);
      }
      await Promise.all([loadLeads(), loadUsers()]);
    } catch {
      setApprovalError("Không thể kết nối API xử lý yêu cầu.");
    } finally {
      setIsSubmittingApproval(false);
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
    <div className="container-app space-y-5 py-6 md:py-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-accent">
          Admin Panel
        </p>
        <h1 className="text-2xl font-black md:text-4xl">
          Quản trị LMS SportPrint
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-2 text-sm ${tab === item.id ? "bg-accent font-bold text-black" : "border border-border"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "courses" && (
        <section className="card p-4">
          <h2 className="text-lg font-bold">Quản lý khóa học</h2>
          {courseError && (
            <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
              {courseError}
            </p>
          )}
          <div className="mt-3 space-y-2 text-sm">
            {isLoadingCourses && (
              <p className="text-zinc-400">Đang tải danh sách khóa học...</p>
            )}

            {!isLoadingCourses && coursesData.length === 0 && (
              <p className="text-zinc-400">Chưa có khóa học trong hệ thống.</p>
            )}

            {coursesData.map((course) => (
              <div
                key={course.id}
                className="rounded-lg border border-border p-3"
              >
                <p className="text-xs text-zinc-500">{course.slug}</p>
                <input
                  value={courseEdits[course.id]?.title ?? ""}
                  onChange={(event) =>
                    setCourseEdits((prev) => ({
                      ...prev,
                      [course.id]: {
                        ...(prev[course.id] ?? {
                          title: course.title,
                          shortDescription: course.short_description,
                          level: course.level,
                          price: course.price,
                          isBestSeller: course.is_best_seller,
                        }),
                        title: event.target.value,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-black px-3 py-2 font-semibold"
                />

                <textarea
                  value={courseEdits[course.id]?.shortDescription ?? ""}
                  onChange={(event) =>
                    setCourseEdits((prev) => ({
                      ...prev,
                      [course.id]: {
                        ...(prev[course.id] ?? {
                          title: course.title,
                          shortDescription: course.short_description,
                          level: course.level,
                          price: course.price,
                          isBestSeller: course.is_best_seller,
                        }),
                        shortDescription: event.target.value,
                      },
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-border bg-black px-3 py-2 text-xs"
                  rows={2}
                />

                <div className="mt-2 grid gap-2 md:grid-cols-4">
                  <input
                    type="number"
                    value={courseEdits[course.id]?.price ?? course.price}
                    onChange={(event) =>
                      setCourseEdits((prev) => ({
                        ...prev,
                        [course.id]: {
                          ...(prev[course.id] ?? {
                            title: course.title,
                            shortDescription: course.short_description,
                            level: course.level,
                            price: course.price,
                            isBestSeller: course.is_best_seller,
                          }),
                          price: Number(event.target.value) || 0,
                        },
                      }))
                    }
                    className="rounded-lg border border-border bg-black px-3 py-2"
                  />
                  <select
                    value={courseEdits[course.id]?.level ?? course.level}
                    onChange={(event) =>
                      setCourseEdits((prev) => ({
                        ...prev,
                        [course.id]: {
                          ...(prev[course.id] ?? {
                            title: course.title,
                            shortDescription: course.short_description,
                            level: course.level,
                            price: course.price,
                            isBestSeller: course.is_best_seller,
                          }),
                          level: event.target.value as "Cơ bản" | "Nâng cao",
                        },
                      }))
                    }
                    className="rounded-lg border border-border bg-black px-3 py-2"
                  >
                    <option value="Cơ bản">Cơ bản</option>
                    <option value="Nâng cao">Nâng cao</option>
                  </select>
                  <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                    <input
                      type="checkbox"
                      checked={
                        courseEdits[course.id]?.isBestSeller ??
                        course.is_best_seller
                      }
                      onChange={(event) =>
                        setCourseEdits((prev) => ({
                          ...prev,
                          [course.id]: {
                            ...(prev[course.id] ?? {
                              title: course.title,
                              shortDescription: course.short_description,
                              level: course.level,
                              price: course.price,
                              isBestSeller: course.is_best_seller,
                            }),
                            isBestSeller: event.target.checked,
                          },
                        }))
                      }
                    />
                    Best seller
                  </label>
                  <button
                    className="btn-secondary px-3 py-2"
                    disabled={isSubmittingCourse}
                    onClick={() => saveCourse(course.id)}
                  >
                    Lưu khóa học
                  </button>
                </div>

                <p className="mt-2 text-xs text-zinc-500">
                  Học viên: {course.students_count} · Đánh giá: {course.rating}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "students" && (
        <section className="card p-4 text-sm">
          <h2 className="text-lg font-bold">Quản lý học viên</h2>
          <p className="mt-2 text-zinc-300">Tổng số user: {users.length}</p>
          <p className="text-zinc-400">
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

          <div className="mt-4 space-y-2">
            {isLoadingUsers && (
              <p className="text-zinc-400">Đang tải danh sách user...</p>
            )}

            {!isLoadingUsers && users.length === 0 && (
              <p className="text-zinc-400">Chưa có user trong hệ thống.</p>
            )}

            {users.map((item) => (
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
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "orders" && (
        <section className="card p-4 text-sm">
          <h2 className="text-lg font-bold">Quản lý đơn hàng</h2>
          <div className="mt-3 space-y-2">
            {orders.length === 0 && (
              <p className="text-zinc-400">Chưa có đơn hàng.</p>
            )}
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-border p-2"
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

      {tab === "resources" && (
        <section className="card p-4 text-sm">
          <h2 className="text-lg font-bold">Quản lý tài liệu khóa học</h2>

          {resourceError && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
              {resourceError}
            </p>
          )}

          <div className="mt-4 grid gap-2 rounded-lg border border-border p-3 md:grid-cols-6">
            <select
              value={newResource.courseId}
              onChange={(event) =>
                setNewResource((prev) => ({
                  ...prev,
                  courseId: event.target.value,
                }))
              }
              className="rounded-lg border border-border bg-black px-3 py-2"
            >
              {coursesData.map((course) => (
                <option value={course.id} key={course.id}>
                  {course.slug}
                </option>
              ))}
            </select>
            <input
              value={newResource.title}
              onChange={(event) =>
                setNewResource((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
              placeholder="Tên tài liệu"
              className="rounded-lg border border-border bg-black px-3 py-2"
            />
            <select
              value={newResource.fileType}
              onChange={(event) =>
                setNewResource((prev) => ({
                  ...prev,
                  fileType: event.target.value as ".CDR" | ".AI" | ".PSD",
                }))
              }
              className="rounded-lg border border-border bg-black px-3 py-2"
            >
              <option value=".CDR">.CDR</option>
              <option value=".AI">.AI</option>
              <option value=".PSD">.PSD</option>
            </select>
            <input
              value={newResource.storagePath}
              onChange={(event) =>
                setNewResource((prev) => ({
                  ...prev,
                  storagePath: event.target.value,
                }))
              }
              placeholder="storage path"
              className="rounded-lg border border-border bg-black px-3 py-2"
            />
            <input
              value={newResource.description}
              onChange={(event) =>
                setNewResource((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="Mô tả"
              className="rounded-lg border border-border bg-black px-3 py-2"
            />
            <button
              className="btn-primary"
              disabled={isSubmittingResource}
              onClick={createResource}
            >
              Thêm tài liệu
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {isLoadingResources && (
              <p className="text-zinc-400">Đang tải tài liệu...</p>
            )}

            {!isLoadingResources && resources.length === 0 && (
              <p className="text-zinc-400">Chưa có tài liệu.</p>
            )}

            {resources.map((resource) => (
              <article
                key={resource.id}
                className="rounded-lg border border-border p-3"
              >
                <p className="text-xs text-zinc-500">
                  {courseMap.get(resource.course_id)?.slug ??
                    resource.course_id}
                </p>
                <div className="mt-2 grid gap-2 md:grid-cols-5">
                  <input
                    value={resourceEdits[resource.id]?.title ?? resource.title}
                    onChange={(event) =>
                      setResourceEdits((prev) => ({
                        ...prev,
                        [resource.id]: {
                          ...(prev[resource.id] ?? {
                            title: resource.title,
                            description: resource.description ?? "",
                            fileType: resource.file_type,
                            previewImage: resource.preview_image ?? "",
                            storagePath: resource.storage_path,
                          }),
                          title: event.target.value,
                        },
                      }))
                    }
                    className="rounded-lg border border-border bg-black px-3 py-2"
                  />
                  <select
                    value={
                      resourceEdits[resource.id]?.fileType ?? resource.file_type
                    }
                    onChange={(event) =>
                      setResourceEdits((prev) => ({
                        ...prev,
                        [resource.id]: {
                          ...(prev[resource.id] ?? {
                            title: resource.title,
                            description: resource.description ?? "",
                            fileType: resource.file_type,
                            previewImage: resource.preview_image ?? "",
                            storagePath: resource.storage_path,
                          }),
                          fileType: event.target.value as
                            | ".CDR"
                            | ".AI"
                            | ".PSD",
                        },
                      }))
                    }
                    className="rounded-lg border border-border bg-black px-3 py-2"
                  >
                    <option value=".CDR">.CDR</option>
                    <option value=".AI">.AI</option>
                    <option value=".PSD">.PSD</option>
                  </select>
                  <input
                    value={
                      resourceEdits[resource.id]?.storagePath ??
                      resource.storage_path
                    }
                    onChange={(event) =>
                      setResourceEdits((prev) => ({
                        ...prev,
                        [resource.id]: {
                          ...(prev[resource.id] ?? {
                            title: resource.title,
                            description: resource.description ?? "",
                            fileType: resource.file_type,
                            previewImage: resource.preview_image ?? "",
                            storagePath: resource.storage_path,
                          }),
                          storagePath: event.target.value,
                        },
                      }))
                    }
                    className="rounded-lg border border-border bg-black px-3 py-2"
                  />
                  <button
                    className="btn-secondary px-3 py-2"
                    disabled={isSubmittingResource}
                    onClick={() => saveResource(resource.id)}
                  >
                    Lưu
                  </button>
                  <button
                    className="btn-secondary px-3 py-2"
                    disabled={isSubmittingResource}
                    onClick={() => deleteResource(resource.id)}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "approvals" && (
        <section className="card p-4 text-sm">
          <h2 className="text-lg font-bold">Trạng thái yêu cầu & phê duyệt</h2>

          {approvalError && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
              {approvalError}
            </p>
          )}

          {approvedCredential && (
            <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-200">
              Đã cấp tài khoản: {approvedCredential.email} /{" "}
              {approvedCredential.password} ({approvedCredential.courseSlug})
            </p>
          )}

          <div className="mt-4 space-y-2">
            {isLoadingLeads && (
              <p className="text-zinc-400">
                Đang tải danh sách yêu cầu chờ...
              </p>
            )}

            {!isLoadingLeads && leads.length === 0 && (
              <p className="text-zinc-400">Chưa có yêu cầu cần phê duyệt.</p>
            )}

            {leads.map((lead) => (
              <article
                key={lead.id}
                className="rounded-lg border border-border p-3"
              >
                <p className="font-semibold">{lead.full_name}</p>
                <p className="text-xs text-zinc-400">
                  {lead.email || "(chưa có email)"} · {lead.phone || "--"}
                </p>
                <p className="text-xs text-zinc-500">
                  {lead.course_slug
                    ? courseSlugMap.get(lead.course_slug) || lead.course_slug
                    : "(chưa chọn khóa)"}{" "}
                  · Trạng thái: {lead.status}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className="btn-secondary px-3 py-2 text-xs"
                    disabled={isSubmittingApproval}
                    onClick={() => updateLeadStatus(lead.id, "contacted")}
                  >
                    Đánh dấu đã liên hệ
                  </button>
                  <button
                    className="btn-secondary px-3 py-2 text-xs"
                    disabled={isSubmittingApproval}
                    onClick={() => updateLeadStatus(lead.id, "closed")}
                  >
                    Từ chối yêu cầu
                  </button>
                  <button
                    className="btn-primary px-3 py-2 text-xs"
                    disabled={isSubmittingApproval || lead.status === "paid"}
                    onClick={() => approveLead(lead.id)}
                  >
                    Phê duyệt cấp tài khoản
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "stats" && (
        <section className="grid gap-4 md:grid-cols-3">
          <article className="card p-4">
            <p className="text-xs text-zinc-400">Doanh thu đã thanh toán</p>
            <p className="mt-1 text-2xl font-black text-accent">
              {formatCurrency(revenue)}
            </p>
          </article>
          <article className="card p-4">
            <p className="text-xs text-zinc-400">Số khóa học</p>
            <p className="mt-1 text-2xl font-black">{coursesData.length}</p>
          </article>
          <article className="card p-4">
            <p className="text-xs text-zinc-400">Số đơn hàng</p>
            <p className="mt-1 text-2xl font-black">{orders.length}</p>
          </article>
        </section>
      )}
    </div>
  );
}
