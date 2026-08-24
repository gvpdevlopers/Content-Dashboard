import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Package,
  WalletCards,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import orderService from "../services/orderService";

const Dashboard = () => {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await orderService.getMyOrders();

      const data =
        response?.orders ||
        response?.data?.orders ||
        [];

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load dashboard orders error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /*
   * ---------------------------------------------------------
   * ORDER STATISTICS
   * ---------------------------------------------------------
   */

  const stats = useMemo(() => {
    const total = orders.length;

    const inProgress = orders.filter((order) =>
      ["in_progress", "processing", "confirmed"].includes(
        String(order.orderStatus || "").toLowerCase()
      )
    ).length;

    const completed = orders.filter(
      (order) =>
        String(order.orderStatus || "").toLowerCase() ===
        "completed"
    ).length;

    const pendingPayment = orders.filter((order) => {
      const paymentStatus = String(
        order.paymentStatus || "pending"
      ).toLowerCase();

      const codPinStatus = String(
        order.codPinStatus || ""
      ).toLowerCase();

      const isCodPaymentDone =
        codPinStatus === "verified" ||
        codPinStatus === "used" ||
        paymentStatus === "collected";

      return paymentStatus === "pending" && !isCodPaymentDone;
    }).length;

    return {
      total,
      inProgress,
      completed,
      pendingPayment,
    };
  }, [orders]);

  /*
   * ---------------------------------------------------------
   * RECENT ORDERS
   * ---------------------------------------------------------
   */

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )
      .slice(0, 5);
  }, [orders]);

  const firstName =
    user?.name?.split(" ")[0] || "there";

  return (
    <div className="relative mx-auto max-w-[1500px]">

      {/* =====================================================
          BACKGROUND EFFECTS
      ====================================================== */}

      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-cyan-400/[0.035] blur-[100px]" />

      <div className="pointer-events-none absolute right-0 top-40 h-72 w-72 rounded-full bg-blue-500/[0.025] blur-[100px]" />

      {/* =====================================================
          WELCOME / HERO
      ====================================================== */}

      <section
        className="
          group relative overflow-hidden
          rounded-[28px]
          border border-white/[0.11]
          bg-white/[0.035]
          p-6
          shadow-[0_25px_80px_rgba(0,0,0,0.25)]
          backdrop-blur-2xl
          sm:p-8
          lg:p-10
        "
      >

        {/* Top glass highlight */}
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/[0.035] blur-3xl transition duration-700 group-hover:bg-cyan-300/[0.06]" />

        <div className="relative max-w-3xl">         

          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-200/40">
            Welcome back
          </p>
            <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">

            Hello, {firstName}.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/45 sm:text-base">
            Manage your projects, place new orders and
            keep track of everything from one place.
          </p>

          <Link
            to="/dashboard/new-order"
            className="
              group/button relative mt-7
              inline-flex items-center gap-2
              overflow-hidden
              rounded-2xl
              border border-white
              bg-white
              px-5 py-3.5
              text-sm font-medium
              text-black
              shadow-[0_10px_30px_rgba(255,255,255,0.05)]
              transition-all duration-300
              hover:-translate-y-0.5
              hover:shadow-[0_14px_40px_rgba(34,211,238,0.12)]
              active:translate-y-0
            "
          >

            <span className="absolute inset-0 bg-gradient-to-r from-cyan-100 via-white to-blue-100 opacity-0 transition-opacity duration-300 group-hover/button:opacity-100" />

            <span className="relative flex items-center gap-2">
              Start a new order

              <ArrowUpRight
                size={17}
                className="transition-transform duration-300 group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5"
              />
            </span>

          </Link>

        </div>
      </section>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3.5 text-sm text-red-300">

          <span>{error}</span>

          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-400/20 px-3 py-2 text-xs text-red-200 transition hover:bg-red-400/10"
          >
            <RefreshCw size={14} />
            Retry
          </button>

        </div>
      )}

      {/* =====================================================
          STATS
      ====================================================== */}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          icon={Package}
          label="Total Orders"
          value={loading ? "—" : stats.total}
          description="All your orders"
        />

        <StatCard
          icon={Clock3}
          label="In Progress"
          value={loading ? "—" : stats.inProgress}
          description="Currently being worked on"
        />

        <StatCard
          icon={FileCheck2}
          label="Completed"
          value={loading ? "—" : stats.completed}
          description="Successfully delivered"
        />

        <StatCard
          icon={WalletCards}
          label="Pending Payment"
          value={loading ? "—" : stats.pendingPayment}
          description="Orders awaiting payment"
        />

      </section>

      {/* =====================================================
          RECENT ORDERS
      ====================================================== */}

      <section className="mt-10">

        <div className="mb-5 flex items-end justify-between">

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/30">
              Activity
            </p>

            <h2 className="mt-1 text-xl font-medium">
              Recent Orders
            </h2>
          </div>

          <Link
            to="/dashboard/orders"
            className="
              group flex items-center gap-1.5
              text-sm text-white/45
              transition-colors
              hover:text-white
            "
          >
            View all

            <ArrowRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </Link>

        </div>

        {/* Loading */}
        {loading && (
          <div className="overflow-hidden rounded-[24px] border border-white/[0.10] bg-white/[0.025] backdrop-blur-xl">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex animate-pulse items-center justify-between border-b border-white/[0.07] px-5 py-5 last:border-b-0 sm:px-6"
              >
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded bg-white/10" />
                  <div className="h-3 w-40 rounded bg-white/5" />
                </div>

                <div className="h-7 w-20 rounded-full bg-white/5" />
              </div>
            ))}

          </div>
        )}

        {/* No orders */}
        {!loading && recentOrders.length === 0 && (
          <div
            className="
              relative overflow-hidden
              rounded-[24px]
              border border-white/[0.10]
              bg-white/[0.025]
              p-10
              text-center
              backdrop-blur-xl
            "
          >

            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-300/[0.035] blur-3xl" />

            <div className="relative">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]">
                <Package
                  size={21}
                  strokeWidth={1.5}
                  className="text-white/45"
                />
              </div>

              <h3 className="mt-5 text-sm font-medium">
                No orders yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/35">
                Your recent content orders will
                appear here once you place your
                first order.
              </p>

              <Link
                to="/dashboard/new-order"
                className="
                  group mt-5
                  inline-flex items-center gap-2
                  text-sm text-white
                  transition-colors
                  hover:text-white/65
                "
              >
                Create your first order

                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>

            </div>
          </div>
        )}

        {/* Orders */}
        {!loading && recentOrders.length > 0 && (
          <div
            className="
              overflow-hidden
              rounded-[24px]
              border border-white/[0.10]
              bg-white/[0.025]
              backdrop-blur-xl
            "
          >

            {recentOrders.map((order) => (
              <RecentOrder
                key={order._id || order.id}
                order={order}
              />
            ))}

          </div>
        )}

      </section>

    </div>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  icon: Icon,
  label,
  value,
  description,
}) => {
  return (
    <div
      className="
        group relative overflow-hidden
        rounded-[22px]
        border border-white/[0.10]
        bg-white/[0.025]
        p-5
        backdrop-blur-xl
        transition-all duration-300
        hover:-translate-y-0.5
        hover:border-white/[0.18]
        hover:bg-white/[0.04]
        hover:shadow-[0_15px_45px_rgba(0,0,0,0.22)]
      "
    >

      {/* Hover glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-300/[0.04] blur-2xl opacity-0 transition duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] transition duration-300 group-hover:border-white/20">
          <Icon
            size={18}
            strokeWidth={1.6}
            className="text-white/55 transition-colors group-hover:text-white/80"
          />
        </div>

        <span className="text-2xl font-semibold tracking-tight">
          {value}
        </span>

      </div>

      <p className="relative mt-5 text-sm font-medium">
        {label}
      </p>

      <p className="relative mt-1 text-xs text-white/35">
        {description}
      </p>

    </div>
  );
};

/* =========================================================
   RECENT ORDER
========================================================= */

const RecentOrder = ({ order }) => {
  const serviceName =
    order.serviceSnapshot?.name ||
    order.service?.name ||
    "Content Service";

  const status = String(
    order.orderStatus || "pending"
  ).toLowerCase();

  const paymentStatus = String(
    order.paymentStatus || "pending"
  ).toLowerCase();

  const codPinStatus = String(
    order.codPinStatus || ""
  ).toLowerCase();

  /*
   * COD PIN verification is considered Payment Done
   * in the client dashboard.
   *
   * This supports both the current temporary backend
   * state ("verified") and the final backend state
   * ("used" / "collected").
   */
  const isCodPaymentDone =
    codPinStatus === "verified" ||
    codPinStatus === "used" ||
    paymentStatus === "collected";

  const statusLabel = formatStatus(status);

  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      )
    : "—";

  return (
    <Link
      to={`/dashboard/orders/${order._id || order.id}`}
      className="
        group flex flex-col gap-4
        border-b border-white/[0.07]
        px-5 py-5
        transition-all duration-300
        last:border-b-0
        hover:bg-white/[0.025]
        sm:flex-row
        sm:items-center
        sm:justify-between
        sm:px-6
      "
    >

      <div className="flex min-w-0 items-center gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] transition duration-300 group-hover:border-white/20 group-hover:bg-white/[0.05]">
          <Package
            size={18}
            strokeWidth={1.5}
            className="text-white/50 group-hover:text-white/75"
          />
        </div>

        <div className="min-w-0">

          <div className="flex flex-wrap items-center gap-2">

            <p className="truncate text-sm font-medium text-white">
              {serviceName}
            </p>

            <span className="text-white/20">
              •
            </span>

            <p className="text-xs text-white/35">
              {order.orderNumber}
            </p>

          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/35">

            <span>{date}</span>

            <span className="text-white/15">
              •
            </span>

            <span>
              ₹{Number(order.amount || 0).toLocaleString("en-IN")}
            </span>

          </div>

        </div>

      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">

        <div className="flex flex-wrap items-center gap-2">

          <StatusBadge
            label={statusLabel}
            type={status}
          />

          {isCodPaymentDone ? (
            <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] font-medium text-emerald-200/70">
              Payment Done
            </span>
          ) : paymentStatus === "pending" ? (
            <span className="rounded-full border border-amber-400/15 bg-amber-400/[0.06] px-3 py-1.5 text-[11px] font-medium text-amber-200/70">
              Payment Pending
            </span>
          ) : paymentStatus === "paid" ? (
            <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] font-medium text-emerald-200/70">
              Payment Done
            </span>
          ) : null}

        </div>

        <ArrowRight
          size={16}
          className="shrink-0 text-white/20 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/60"
        />

      </div>

    </Link>
  );
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ label, type }) => {
  const styles = {
    pending:
      "border-white/10 bg-white/[0.04] text-white/55",

    confirmed:
      "border-blue-400/15 bg-blue-400/[0.06] text-blue-200/70",

    in_progress:
      "border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-200/70",

    processing:
      "border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-200/70",

    completed:
      "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-200/70",

    cancelled:
      "border-red-400/15 bg-red-400/[0.06] text-red-200/70",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
        styles[type] || styles.pending
      }`}
    >
      {label}
    </span>
  );
};

/* =========================================================
   STATUS FORMATTER
========================================================= */

const formatStatus = (status) => {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    in_progress: "In Progress",
    processing: "Processing",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    labels[status] ||
    status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      )
  );
};

export default Dashboard;