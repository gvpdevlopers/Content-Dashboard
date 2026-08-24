import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  Mail,
  Package,
  ShieldCheck,
  UserRound,
  UserX,
  XCircle,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import adminUserService from "../../services/adminUserService";

const AdminUserDetails = () => {
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [error, setError] = useState("");
  const [ordersError, setOrdersError] = useState("");

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminUserService.getUserById(id);

      setUser(response.user);
    } catch (error) {
      console.error("Get admin user details error:", error);

      setError(error.response?.data?.message || "Unable to load user details.");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError("");

      const response = await adminUserService.getUserOrders(id);

      setOrders(response.orders || []);
    } catch (error) {
      console.error("Get user orders error:", error);

      setOrdersError(
        error.response?.data?.message || "Unable to load user orders.",
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    loadUser();
    loadOrders();
  }, [id]);

  const toggleUserStatus = async () => {
    if (!user || user.role === "admin") {
      return;
    }

    const nextStatus = !user.isActive;

    try {
      setUpdatingStatus(true);
      setError("");

      const response = await adminUserService.updateUserStatus(
        user._id,
        nextStatus,
      );

      if (response.user) {
        setUser(response.user);
      } else {
        setUser((currentUser) => ({
          ...currentUser,
          isActive: nextStatus,
        }));
      }
    } catch (error) {
      console.error("Update user status error:", error);

      setError(
        error.response?.data?.message || "Unable to update user status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const orderStats = useMemo(() => {
    const total = orders.length;

    const completed = orders.filter(
      (order) => order.orderStatus === "completed",
    ).length;

    const pending = orders.filter(
      (order) => order.orderStatus === "pending",
    ).length;

    const processing = orders.filter(
      (order) =>
        order.orderStatus === "processing" ||
        order.orderStatus === "in_progress",
    ).length;

    const cancelled = orders.filter(
      (order) => order.orderStatus === "cancelled",
    ).length;

    const totalSpent = orders
      .filter(
        (order) =>
          order.paymentStatus === "paid" || order.paymentStatus === "collected",
      )
      .reduce((total, order) => total + Number(order.amount || 0), 0);

    return {
      total,
      completed,
      pending,
      processing,
      cancelled,
      totalSpent,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <Loader2 size={18} className="animate-spin" />
          Loading user...
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center text-center">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <UserX size={22} className="text-red-300" />
          </div>

          <h1 className="mt-5 text-xl font-medium">Unable to load user</h1>

          <p className="mt-2 text-sm text-white/40">
            {error || "User not found."}
          </p>

          <Link
            to="/admin/users"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      {/* Back */}
      <Link
        to="/admin/users"
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Users
      </Link>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">
          <p className="text-sm text-red-300">{error}</p>

          <button
            type="button"
            onClick={loadUser}
            className="shrink-0 text-sm text-red-200 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {/* User Header */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] sm:p-8">
        {/* Background glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/[0.035] blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 -left-20 h-56 w-56 rounded-full bg-white/[0.02] blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xl font-semibold text-white/70 sm:h-20 sm:w-20 sm:text-2xl">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
                  {user.name || "Unnamed User"}
                </h1>

                <RoleBadge role={user.role} />
              </div>

              <p className="mt-1 truncate text-sm text-white/40">
                @{user.username || "—"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatusBadge isActive={user.isActive} />

                <span className="text-xs text-white/30">
                  Joined {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Action */}
          {user.role !== "admin" && (
            <button
              type="button"
              onClick={toggleUserStatus}
              disabled={updatingStatus}
              className={`
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                px-5
                py-3
                text-sm
                font-medium
                transition
                disabled:cursor-not-allowed
                disabled:opacity-50
                ${
                  user.isActive
                    ? "border-red-400/20 bg-red-400/[0.06] text-red-300 hover:bg-red-400/[0.1]"
                    : "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300 hover:bg-emerald-400/[0.1]"
                }
              `}
            >
              {updatingStatus ? (
                <Loader2 size={16} className="animate-spin" />
              ) : user.isActive ? (
                <XCircle size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}

              {updatingStatus
                ? "Updating..."
                : user.isActive
                  ? "Deactivate User"
                  : "Activate User"}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Package}
          label="Total Orders"
          value={orderStats.total}
        />

        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={orderStats.completed}
        />

        <StatCard
          icon={CreditCard}
          label="Total Spent"
          value={`₹${orderStats.totalSpent.toLocaleString("en-IN")}`}
        />

        <StatCard
          icon={CalendarDays}
          label="Pending Orders"
          value={orderStats.pending}
        />
      </div>

      {/* Main Content */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        {/* Account Information */}
        <div className="rounded-[24px] border border-white/10 bg-[#111111] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
              <UserRound
                size={18}
                className="text-white/50"
                strokeWidth={1.6}
              />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                Account
              </p>

              <h2 className="mt-1 text-lg font-medium">User Information</h2>
            </div>
          </div>

          <div className="mt-7 space-y-1">
            <InfoRow icon={UserRound} label="Name" value={user.name || "—"} />

            <InfoRow icon={Mail} label="Email" value={user.email || "—"} />

            <InfoRow
              icon={UserRound}
              label="Username"
              value={user.username ? `@${user.username}` : "—"}
            />

            <InfoRow
              icon={ShieldCheck}
              label="Role"
              value={<RoleBadge role={user.role} />}
            />

            <InfoRow
              icon={user.isActive ? CheckCircle2 : XCircle}
              label="Account Status"
              value={<StatusBadge isActive={user.isActive} />}
            />

            <InfoRow
              icon={CalendarDays}
              label="Joined"
              value={formatDateTime(user.createdAt)}
            />

            <InfoRow
              icon={CalendarDays}
              label="Last Updated"
              value={formatDateTime(user.updatedAt)}
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-[24px] border border-white/10 bg-[#111111] p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                <Package
                  size={18}
                  className="text-white/50"
                  strokeWidth={1.6}
                />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                  Activity
                </p>

                <h2 className="mt-1 text-lg font-medium">Order Overview</h2>
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <MiniStat label="Total" value={orderStats.total} />

            <MiniStat label="Completed" value={orderStats.completed} />

            <MiniStat label="Processing" value={orderStats.processing} />

            <MiniStat label="Cancelled" value={orderStats.cancelled} />
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="mt-6 rounded-[24px] border border-white/10 bg-[#111111] p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
              <Package size={18} className="text-white/50" strokeWidth={1.6} />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                Orders
              </p>

              <h2 className="mt-1 text-lg font-medium">Recent Orders</h2>
            </div>
          </div>

          <span className="text-xs text-white/30">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </span>
        </div>

        {ordersLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-white/40">
              <Loader2 size={18} className="animate-spin" />
              Loading orders...
            </div>
          </div>
        ) : ordersError ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
            <p className="text-sm text-red-300">{ordersError}</p>

            <button
              type="button"
              onClick={loadOrders}
              className="mt-3 text-sm text-red-200 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-6 flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.015] px-6 text-center">
            <Package size={22} className="text-white/30" />

            <p className="mt-4 text-sm font-medium">No orders yet</p>

            <p className="mt-1 text-sm text-white/35">
              Orders placed by this user will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07]">
            {/* Desktop */}
            <div className="hidden md:block">
              <div className="grid grid-cols-[1.4fr_1.5fr_0.9fr_0.9fr_70px] border-b border-white/[0.07] bg-white/[0.015] px-5 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white/30">
                <span>Order</span>
                <span>Service</span>
                <span>Amount</span>
                <span>Status</span>
                <span />
              </div>

              {orders.map((order) => (
                <AdminOrderRow key={order._id} order={order} />
              ))}
            </div>

            {/* Mobile */}
            <div className="divide-y divide-white/[0.07] md:hidden">
              {orders.map((order) => (
                <AdminOrderMobileCard key={order._id} order={order} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => {
  return (
    <div className="group rounded-2xl border border-white/10 bg-[#111111] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#141414]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <Icon
            size={18}
            strokeWidth={1.6}
            className="text-white/50 transition group-hover:text-white/75"
          />
        </div>

        <span className="text-2xl font-medium">{value}</span>
      </div>

      <p className="mt-5 text-sm font-medium">{label}</p>
    </div>
  );
};

const MiniStat = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.035]">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
        {label}
      </p>

      <p className="mt-2 text-xl font-medium">{value}</p>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-white/[0.07] py-3.5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <Icon size={15} strokeWidth={1.6} className="shrink-0 text-white/30" />

        <span className="text-sm text-white/40">{label}</span>
      </div>

      <span className="max-w-[60%] truncate text-right text-sm text-white/70">
        {value}
      </span>
    </div>
  );
};

const AdminOrderRow = ({ order }) => {
  const serviceName =
    order.serviceSnapshot?.name || order.service?.name || "Service";

  return (
    <div className="grid grid-cols-[1.4fr_1.5fr_0.9fr_0.9fr_70px] items-center border-b border-white/[0.07] px-5 py-4 last:border-b-0 transition hover:bg-white/[0.02]">
      <div>
        <p className="text-sm font-medium">{order.orderNumber}</p>

        <p className="mt-1 text-xs text-white/30">
          {formatDate(order.createdAt)}
        </p>
      </div>

      <p className="truncate pr-4 text-sm text-white/60">{serviceName}</p>

      <p className="text-sm font-medium">
        ₹{Number(order.amount || 0).toLocaleString("en-IN")}
      </p>

      <div>
        <OrderStatusBadge status={order.orderStatus} />
      </div>

      <Link
        to={`/admin/orders/${order._id}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        aria-label={`View ${order.orderNumber}`}
      >
        <ChevronRight size={16} />
      </Link>
    </div>
  );
};

const AdminOrderMobileCard = ({ order }) => {
  const serviceName =
    order.serviceSnapshot?.name || order.service?.name || "Service";

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{order.orderNumber}</p>

          <p className="mt-1 text-xs text-white/30">
            {formatDate(order.createdAt)}
          </p>
        </div>

        <OrderStatusBadge status={order.orderStatus} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/[0.07] pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
            Service
          </p>

          <p className="mt-1 truncate text-sm text-white/65">{serviceName}</p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
            Amount
          </p>

          <p className="mt-1 text-sm font-medium">
            ₹{Number(order.amount || 0).toLocaleString("en-IN")}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
            Payment
          </p>

          <p className="mt-1 text-sm text-white/60">
            {formatStatus(order.paymentMethod)}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
            Payment Status
          </p>

          <p className="mt-1 text-sm text-white/60">
            {formatStatus(order.paymentStatus)}
          </p>
        </div>
      </div>

      <Link
        to={`/admin/orders/${order._id}`}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white"
      >
        View Order
        <ChevronRight size={16} />
      </Link>
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const isAdmin = role === "admin";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        border
        px-2.5 py-1
        text-[11px]
        font-medium
        ${
          isAdmin
            ? "border-purple-400/20 bg-purple-400/[0.08] text-purple-300"
            : "border-white/10 bg-white/[0.04] text-white/55"
        }
      `}
    >
      {isAdmin && <ShieldCheck size={12} strokeWidth={1.7} />}

      {isAdmin ? "Admin" : "Client"}
    </span>
  );
};

const StatusBadge = ({ isActive }) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        border
        px-2.5 py-1
        text-[11px]
        font-medium
        ${
          isActive
            ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
            : "border-red-400/20 bg-red-400/[0.08] text-red-300"
        }
      `}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-400" : "bg-red-400"
        }`}
      />

      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

const OrderStatusBadge = ({ status }) => {
  const normalizedStatus = status?.toLowerCase();

  let classes = "border-white/10 bg-white/[0.04] text-white/55";

  if (normalizedStatus === "completed") {
    classes = "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300";
  } else if (normalizedStatus === "cancelled") {
    classes = "border-red-400/20 bg-red-400/[0.08] text-red-300";
  } else if (
    normalizedStatus === "processing" ||
    normalizedStatus === "in_progress"
  ) {
    classes = "border-blue-400/20 bg-blue-400/[0.08] text-blue-300";
  } else if (normalizedStatus === "pending") {
    classes = "border-amber-400/20 bg-amber-400/[0.08] text-amber-300";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes}`}
    >
      {formatStatus(status)}
    </span>
  );
};

const formatStatus = (status) => {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default AdminUserDetails;
