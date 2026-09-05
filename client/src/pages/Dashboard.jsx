import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  ArrowUpRight,
  FileCheck2,
  Clock3,
  Package,
  WalletCards,
  RefreshCw,
  IndianRupee,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import orderService from "../services/orderService";

const Dashboard = () => {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD ORDERS
  ========================================================= */

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await orderService.getMyOrders();

      const data = response?.orders || response?.data?.orders || [];

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load dashboard orders error:", error);

      setError(
        error.response?.data?.message || "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /* =========================================================
     ORDER STATISTICS
  ========================================================= */

  const stats = useMemo(() => {
    const total = orders.length;

    const inProgress = orders.filter((order) => {
      const status = String(order.orderStatus || "").toLowerCase();

      return ["in_progress", "processing", "confirmed"].includes(status);
    }).length;

    const completed = orders.filter((order) => {
      const status = String(order.orderStatus || "").toLowerCase();

      return ["completed", "delivered"].includes(status);
    }).length;

    const pendingPayment = orders.filter((order) => {
      const paymentStatus = String(
        order.paymentStatus || "pending",
      ).toLowerCase();

      const codPinStatus = String(order.codPinStatus || "").toLowerCase();

      const isCodPaymentDone =
        codPinStatus === "verified" ||
        codPinStatus === "used" ||
        paymentStatus === "collected";

      return paymentStatus === "pending" && !isCodPaymentDone;
    }).length;

    const totalAmount = orders.reduce(
      (total, order) => total + Number(order.amount || 0),
      0,
    );

    return {
      total,
      inProgress,
      completed,
      pendingPayment,
      totalAmount,
    };
  }, [orders]);

  /* =========================================================
     RECENT ORDERS
  ========================================================= */

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [orders]);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="relative mx-auto max-w-[1500px]">
      {/* =====================================================
          BACKGROUND EFFECTS
      ====================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -left-32
          -top-32
          h-80
          w-80
          rounded-full
          bg-cyan-400/[0.025]
          blur-[100px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          right-0
          top-40
          h-72
          w-72
          rounded-full
          bg-blue-500/[0.02]
          blur-[100px]
        "
      />

      {/* =====================================================
          WELCOME / HERO
      ====================================================== */}

      <section
        className="
          group
          relative
          overflow-hidden
          rounded-[28px]
          border border-zinc-200
          bg-white
          p-6
          shadow-[0_20px_60px_rgba(0,0,0,0.06)]
          animate-fade-up
          sm:p-8
          lg:p-10
        "
      >
        {/* Top highlight */}

        <div
          className="
            pointer-events-none
            absolute
            inset-x-10
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-zinc-300
            to-transparent
          "
        />

        {/* Ambient glow */}

        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-72
            w-72
            rounded-full
            bg-cyan-300/[0.035]
            blur-3xl
            transition
            duration-700
            group-hover:bg-cyan-300/[0.06]
          "
        />

        <div className="relative max-w-3xl">
          <p
            className="
              text-xs
              font-medium
              uppercase
              tracking-[0.2em]
              text-cyan-600/70
            "
          >
            Welcome back
          </p>

          <h1
            className="
              mt-1
              text-3xl
              font-medium
              tracking-tight
              text-zinc-900
              sm:text-4xl
            "
          >
            Hello, {firstName}.
          </h1>

          <p
            className="
              mt-4
              max-w-xl
              text-sm
              leading-6
              text-zinc-500
              sm:text-base
            "
          >
            Manage your projects, place new orders and keep track of everything
            from one place.
          </p>

          <Link
            to="/dashboard/new-order"
            className="
              group/button
              relative
              mt-7
              inline-flex
              items-center
              gap-2
              overflow-hidden
              rounded-2xl
              border
              border-zinc-900
              bg-zinc-900
              px-5
              py-3.5
              text-sm
              font-medium
              text-white
              shadow-[0_10px_30px_rgba(0,0,0,0.08)]
              transition-[transform,background-color,box-shadow]
              duration-300
              ease-out
              hover:bg-zinc-800
              hover:text-white
              hover:shadow-[0_12px_34px_rgba(0,0,0,0.10)]
              active:scale-[0.99]
            "
          >
            <span
              className="
                absolute
                inset-0
                bg-gradient-to-r
                from-zinc-800
                via-zinc-900
                to-zinc-800
                opacity-0
                transition-opacity
                duration-300
                ease-out
                group-hover/button:opacity-100
              "
            />

            <span
              className="
                relative
                flex
                items-center
                gap-2
                text-white
              "
            >
              <span className="text-white">Start a new order</span>

              <ArrowUpRight
                size={17}
                className="
                  text-white
                  transition-transform
                  duration-300
                  ease-out
                  group-hover/button:translate-x-0.5
                  group-hover/button:-translate-y-0.5
                "
              />
            </span>
          </Link>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="
            mt-5
            flex
            items-center
            justify-between
            gap-4
            rounded-2xl
            border border-red-200
            bg-red-50
            px-4
            py-3.5
            text-sm
            text-red-600
            animate-fade-up
          "
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={loadOrders}
            className="
              inline-flex
              shrink-0
              items-center
              gap-2
              rounded-xl
              border border-red-200
              px-3
              py-2
              text-xs
              text-red-600
              transition-all
              duration-200
              hover:bg-red-100
              active:scale-[0.98]
            "
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          STATS
      ====================================================== */}

      <section
        className="
          mt-6
          grid
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
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
          TOTAL AMOUNT
      ====================================================== */}

      <section className="mt-4">
        <div
          className="
            group
            relative
            overflow-hidden
            rounded-[22px]
            border border-zinc-200
            bg-white
            p-5
            shadow-[0_10px_35px_rgba(0,0,0,0.04)]
            transition-all
            duration-200
            hover:border-zinc-300
            hover:shadow-[0_15px_45px_rgba(0,0,0,0.07)]
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-10
              -top-10
              h-24
              w-24
              rounded-full
              bg-cyan-300/[0.04]
              blur-2xl
              opacity-0
              transition
              duration-500
              group-hover:opacity-100
            "
          />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  border border-zinc-200
                  bg-zinc-50
                  transition
                  duration-200
                  group-hover:border-zinc-300
                "
              >
                <IndianRupee
                  size={18}
                  strokeWidth={1.6}
                  className="
                    text-zinc-500
                    transition-colors
                    duration-200
                    group-hover:text-zinc-800
                  "
                />
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-900">
                  Total Amount
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Total value of your orders
                </p>
              </div>
            </div>

            <span
              className="
                text-xl
                font-semibold
                tracking-tight
                text-zinc-900
                sm:text-2xl
              "
            >
              {loading ? "—" : `₹${stats.totalAmount.toLocaleString("en-IN")}`}
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          RECENT ORDERS
      ====================================================== */}

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p
              className="
                text-xs
                font-medium
                uppercase
                tracking-[0.18em]
                text-zinc-400
              "
            >
              Activity
            </p>

            <h2 className="mt-1 text-xl font-medium text-zinc-900">
              Recent Orders
            </h2>
          </div>

          <Link
            to="/dashboard/orders"
            className="
              group
              flex
              items-center
              gap-1.5
              text-sm
              text-zinc-500
              transition-colors
              duration-200
              hover:text-zinc-900
            "
          >
            View all
            <ArrowRight
              size={15}
              className="
                transition-transform
                duration-200
                group-hover:translate-x-0.5
              "
            />
          </Link>
        </div>

        {/* Loading */}

        {loading && (
          <div
            className="
              overflow-hidden
              rounded-[24px]
              border border-zinc-200
              bg-white
              shadow-[0_10px_35px_rgba(0,0,0,0.04)]
            "
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="
                  flex
                  animate-pulse
                  items-center
                  justify-between
                  border-b
                  border-zinc-100
                  px-5
                  py-5
                  last:border-b-0
                  sm:px-6
                "
              >
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded bg-zinc-200" />
                  <div className="h-3 w-40 rounded bg-zinc-100" />
                </div>

                <div className="h-7 w-20 rounded-full bg-zinc-100" />
              </div>
            ))}
          </div>
        )}

        {/* No Orders */}

        {!loading && recentOrders.length === 0 && (
          <div
            className="
                relative
                overflow-hidden
                rounded-[24px]
                border border-zinc-200
                bg-white
                p-10
                text-center
                shadow-[0_10px_35px_rgba(0,0,0,0.04)]
              "
          >
            <div
              className="
                  pointer-events-none
                  absolute
                  left-1/2
                  top-0
                  h-40
                  w-40
                  -translate-x-1/2
                  rounded-full
                  bg-cyan-300/[0.04]
                  blur-3xl
                "
            />

            <div className="relative">
              <div
                className="
                    mx-auto
                    flex h-14 w-14
                    items-center
                    justify-center
                    rounded-2xl
                    border border-zinc-200
                    bg-zinc-50
                  "
              >
                <Package
                  size={21}
                  strokeWidth={1.5}
                  className="text-zinc-400"
                />
              </div>

              <h3 className="mt-5 text-sm font-medium text-zinc-900">
                No orders yet
              </h3>

              <p
                className="
                    mx-auto
                    mt-2
                    max-w-sm
                    text-sm
                    leading-6
                    text-zinc-500
                  "
              >
                Your recent content orders will appear here once you place your
                first order.
              </p>

              <Link
                to="/dashboard/new-order"
                className="
                    group
                    mt-5
                    inline-flex
                    items-center
                    gap-2
                    text-sm
                    font-medium
                    text-zinc-900
                    transition-colors
                    duration-200
                    hover:text-zinc-500
                  "
              >
                Create your first order
                <ArrowUpRight
                  size={16}
                  className="
                      transition-transform
                      duration-200
                      group-hover:translate-x-0.5
                      group-hover:-translate-y-0.5
                    "
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
                border border-zinc-200
                bg-white
                shadow-[0_10px_35px_rgba(0,0,0,0.04)]
              "
          >
            {recentOrders.map((order) => (
              <RecentOrder key={order._id || order.id} order={order} />
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

const StatCard = ({ icon: Icon, label, value, description }) => {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-[22px]
        border border-zinc-200
        bg-white
        p-5
        shadow-[0_10px_35px_rgba(0,0,0,0.04)]
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-zinc-300
        hover:shadow-[0_15px_45px_rgba(0,0,0,0.07)]
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-10
          -top-10
          h-24
          w-24
          rounded-full
          bg-cyan-300/[0.04]
          blur-2xl
          opacity-0
          transition
          duration-500
          group-hover:opacity-100
        "
      />

      <div className="relative flex items-start justify-between">
        <div
          className="
            flex h-10 w-10
            items-center
            justify-center
            rounded-xl
            border border-zinc-200
            bg-zinc-50
            transition
            duration-200
            group-hover:border-zinc-300
          "
        >
          <Icon
            size={18}
            strokeWidth={1.6}
            className="
              text-zinc-500
              transition-colors
              duration-200
              group-hover:text-zinc-800
            "
          />
        </div>

        <span
          className="
            text-2xl
            font-semibold
            tracking-tight
            text-zinc-900
          "
        >
          {value}
        </span>
      </div>

      <p className="relative mt-5 text-sm font-medium text-zinc-900">{label}</p>

      <p className="relative mt-1 text-xs text-zinc-500">{description}</p>
    </div>
  );
};

/* =========================================================
   RECENT ORDER
========================================================= */

const RecentOrder = ({ order }) => {
  /*
   * Service name comes from the snapshot first so that
   * historical orders continue showing the service name
   * that existed when the order was created.
   */

  const serviceName =
    order.serviceSnapshot?.name || order.service?.name || "Content Service";

  const status = String(order.orderStatus || "pending").toLowerCase();

  const paymentStatus = String(order.paymentStatus || "pending").toLowerCase();

  const codPinStatus = String(order.codPinStatus || "").toLowerCase();

  /*
   * COD PIN verification is considered Payment Done.
   *
   * Supports:
   * - verified
   * - used
   * - collected
   */

  const isCodPaymentDone =
    codPinStatus === "verified" ||
    codPinStatus === "used" ||
    paymentStatus === "collected";

  const statusLabel = formatStatus(status);

  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const orderId = order._id || order.id;

  return (
    <Link
      to={`/dashboard/orders/${orderId}`}
      className="
        group
        flex
        flex-col
        gap-4
        border-b
        border-zinc-100
        px-5
        py-5
        transition-all
        duration-200
        last:border-b-0
        hover:bg-zinc-50
        sm:flex-row
        sm:items-center
        sm:justify-between
        sm:px-6
      "
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className="
            flex h-11 w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            border border-zinc-200
            bg-zinc-50
            transition
            duration-200
            group-hover:border-zinc-300
            group-hover:bg-white
          "
        >
          <Package
            size={18}
            strokeWidth={1.5}
            className="
              text-zinc-400
              transition-colors
              duration-200
              group-hover:text-zinc-700
            "
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="
                truncate
                text-sm
                font-medium
                text-zinc-900
              "
            >
              {serviceName}
            </p>

            <span className="text-zinc-300">•</span>

            <p className="text-xs text-zinc-500">{order.orderNumber}</p>
          </div>

          <div
            className="
              mt-1
              flex
              flex-wrap
              items-center
              gap-2
              text-xs
              text-zinc-400
            "
          >
            <span>{date}</span>

            <span className="text-zinc-300">•</span>

            <span>₹{Number(order.amount || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          sm:justify-end
        "
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={statusLabel} type={status} />

          <PaymentBadge
            paymentStatus={paymentStatus}
            isCodPaymentDone={isCodPaymentDone}
          />
        </div>

        <ArrowRight
          size={16}
          className="
            shrink-0
            text-zinc-300
            transition-all
            duration-200
            group-hover:translate-x-1
            group-hover:text-zinc-600
          "
        />
      </div>
    </Link>
  );
};

/* =========================================================
   PAYMENT BADGE
========================================================= */

const PaymentBadge = ({ paymentStatus, isCodPaymentDone }) => {
  if (
    isCodPaymentDone ||
    ["paid", "completed", "success", "successful"].includes(paymentStatus)
  ) {
    return (
      <span
        className="
          rounded-full
          border border-emerald-200
          bg-emerald-50
          px-3
          py-1.5
          text-[11px]
          font-medium
          text-emerald-700
        "
      >
        Payment Done
      </span>
    );
  }

  if (paymentStatus === "pending") {
    return (
      <span
        className="
          rounded-full
          border border-amber-200
          bg-amber-50
          px-3
          py-1.5
          text-[11px]
          font-medium
          text-amber-700
        "
      >
        Payment Pending
      </span>
    );
  }

  return (
    <span
      className="
        rounded-full
        border border-zinc-200
        bg-zinc-50
        px-3
        py-1.5
        text-[11px]
        font-medium
        text-zinc-600
      "
    >
      {formatStatus(paymentStatus)}
    </span>
  );
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ label, type }) => {
  const styles = {
    pending: "border-zinc-200 bg-zinc-50 text-zinc-600",

    confirmed: "border-blue-200 bg-blue-50 text-blue-700",

    in_progress: "border-cyan-200 bg-cyan-50 text-cyan-700",

    processing: "border-cyan-200 bg-cyan-50 text-cyan-700",

    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",

    delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",

    cancelled: "border-red-200 bg-red-50 text-red-700",

    rejected: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`
        rounded-full
        border
        px-3
        py-1.5
        text-[11px]
        font-medium
        ${styles[type] || styles.pending}
      `}
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
    delivered: "Delivered",
    cancelled: "Cancelled",
    rejected: "Rejected",
    paid: "Paid",
    collected: "Collected",
    successful: "Successful",
    success: "Success",
  };

  return (
    labels[status] ||
    status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
};

export default Dashboard;
