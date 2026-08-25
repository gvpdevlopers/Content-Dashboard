import { useEffect, useState } from "react";

import {
  ArrowUpRight,
  ClipboardList,
  Clock3,
  KeyRound,
  Loader2,
  Package,
  RefreshCw,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";

import adminOrderService from "../../services/adminOrderService";
import adminUserService from "../../services/adminUserService";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [ordersResponse, usersResponse] = await Promise.all([
        adminOrderService.getAdminOrders(),
        adminUserService.getUsers(),
      ]);

      setOrders(ordersResponse.orders || []);
      setUsers(usersResponse.users || []);
    } catch (error) {
      console.error("Load admin dashboard error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const totalClients = users.filter(
    (user) => user.role === "client"
  ).length;

  const totalOrders = orders.length;

  const inProgressOrders = orders.filter(
    (order) =>
      order.orderStatus === "processing" ||
      order.orderStatus === "in_progress"
  ).length;

  const pendingCodOrders = orders.filter(
    (order) =>
      order.paymentMethod === "cod" &&
      order.paymentStatus !== "collected"
  ).length;

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="mx-auto max-w-[1500px] animate-fade-up">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section
        className="
          group
          relative
          mb-6
          overflow-hidden
          rounded-[28px]
          border border-zinc-200
          bg-white
          p-6
          shadow-[0_20px_80px_rgba(0,0,0,0.06)]
          transition-all
          duration-300
          hover:border-zinc-300
          hover:shadow-[0_24px_90px_rgba(0,0,0,0.08)]
          sm:p-8
          lg:p-10
        "
      >
        {/* Background glow */}

        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-64
            w-64
            rounded-full
            bg-cyan-300/[0.035]
            blur-3xl
            transition
            duration-700
            group-hover:bg-cyan-300/[0.06]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-32
            -left-20
            h-56
            w-56
            rounded-full
            bg-blue-400/[0.025]
            blur-3xl
          "
        />

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

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  border border-zinc-200
                  bg-zinc-50
                  text-zinc-500
                  shadow-sm
                  transition-all
                  duration-200
                  group-hover:border-zinc-300
                  group-hover:bg-white
                  group-hover:text-zinc-800
                "
              >
                <Package
                  size={18}
                  strokeWidth={1.6}
                />
              </div>

              <p
                className="
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.2em]
                  text-zinc-400
                "
              >
                Administration
              </p>
            </div>

            <h1
              className="
                mt-4
                text-3xl
                font-medium
                tracking-tight
                text-zinc-900
                sm:text-4xl
              "
            >
              Overview
            </h1>

            <p
              className="
                mt-3
                max-w-xl
                text-sm
                leading-6
                text-zinc-500
                sm:text-base
              "
            >
              Manage your clients, orders and payment activity
              from one place.
            </p>
          </div>

          {/* Refresh */}

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="
              group/refresh
              inline-flex
              items-center
              justify-center
              gap-2
              self-start
              rounded-xl
              border border-zinc-200
              bg-white
              px-4
              py-3
              text-sm
              text-zinc-500
              shadow-sm
              transition-all
              duration-200
              hover:border-zinc-300
              hover:bg-zinc-50
              hover:text-zinc-900
              hover:shadow-md
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:self-auto
            "
          >
            <RefreshCw
              size={16}
              className={`
                transition-transform
                duration-500
                ${
                  loading
                    ? "animate-spin"
                    : "group-hover/refresh:rotate-180"
                }
              `}
            />

            Refresh
          </button>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="
            mb-6
            flex
            flex-col
            gap-3
            rounded-2xl
            border border-red-200
            bg-red-50
            px-5
            py-4
            shadow-[0_10px_30px_rgba(239,68,68,0.04)]
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <p className="text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={loadDashboard}
            className="
              self-start
              text-sm
              font-medium
              text-red-600
              underline
              underline-offset-4
              transition
              hover:text-red-800
              sm:self-auto
            "
          >
            Try again
          </button>
        </div>
      )}

      {/* =====================================================
          STATS
      ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          icon={Users}
          label="Total Clients"
          value={loading ? "—" : totalClients}
          description="Registered clients"
        />

        <StatCard
          icon={Package}
          label="Total Orders"
          value={loading ? "—" : totalOrders}
          description="All content orders"
        />

        <StatCard
          icon={Clock3}
          label="In Progress"
          value={loading ? "—" : inProgressOrders}
          description="Currently active orders"
        />

        <StatCard
          icon={KeyRound}
          label="COD Pending"
          value={loading ? "—" : pendingCodOrders}
          description="COD payments awaiting action"
        />

      </section>

     {/* =====================================================
    QUICK ACTIONS
====================================================== */}

<section className="mt-8">
  <div className="mb-4">
    <p
      className="
        text-[10px]
        font-medium
        uppercase
        tracking-[0.2em]
        text-zinc-400
      "
    >
      Quick Access
    </p>

    <h2 className="mt-1 text-xl font-medium text-zinc-900">
      Manage
    </h2>
  </div>

  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <QuickAction
      icon={ClipboardList}
      title="Orders"
      description="View and manage client orders."
      to="/admin/orders"
    />

    <QuickAction
      icon={Users}
      title="Users"
      description="Manage registered clients."
      to="/admin/users"
    />

    <QuickAction
      icon={KeyRound}
      title="COD Payments"
      description="Generate COD payment PINs."
      to="/admin/cod"
    />
  </div>
</section>

      {/* =====================================================
          RECENT ORDERS
      ====================================================== */}

      <section className="mt-8">

        <div className="mb-4 flex items-end justify-between gap-4">

          <div>

            <p
              className="
                text-[10px]
                font-medium
                uppercase
                tracking-[0.2em]
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
            to="/admin/orders"
            className="
              group
              inline-flex
              shrink-0
              items-center
              gap-1.5
              text-sm
              text-zinc-500
              transition
              duration-200
              hover:text-zinc-900
            "
          >
            View all

            <ArrowUpRight
              size={15}
              className="
                transition-transform
                duration-200
                group-hover:translate-x-0.5
                group-hover:-translate-y-0.5
              "
            />
          </Link>
        </div>

        {loading ? (
          <div
            className="
              relative
              flex
              min-h-[300px]
              items-center
              justify-center
              overflow-hidden
              rounded-[24px]
              border border-zinc-200
              bg-white
              shadow-[0_20px_60px_rgba(0,0,0,0.05)]
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                -right-20
                -top-20
                h-56
                w-56
                rounded-full
                bg-cyan-300/[0.025]
                blur-3xl
              "
            />

            <div className="relative flex items-center gap-3 text-sm text-zinc-500">

              <Loader2
                size={18}
                className="animate-spin"
              />

              Loading recent orders...
            </div>
          </div>
        ) : recentOrders.length === 0 ? (
          <EmptyRecentOrders />
        ) : (
          <>
            {/* =================================================
                DESKTOP
            ================================================== */}

            <div
              className="
                hidden
                overflow-hidden
                rounded-[24px]
                border border-zinc-200
                bg-white
                shadow-[0_20px_60px_rgba(0,0,0,0.05)]
                md:block
              "
            >
              <div
                className="
                  grid
                  grid-cols-[1.3fr_1.4fr_1.2fr_0.8fr_1fr_80px]
                  border-b
                  border-zinc-200
                  bg-zinc-50
                  px-6
                  py-4
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.16em]
                  text-zinc-400
                "
              >
                <span>Order</span>
                <span>Client</span>
                <span>Service</span>
                <span>Amount</span>
                <span>Status</span>
                <span />
              </div>

              {recentOrders.map((order) => (
                <RecentOrderRow
                  key={order._id}
                  order={order}
                />
              ))}
            </div>

            {/* =================================================
                MOBILE
            ================================================== */}

            <div className="space-y-3 md:hidden">

              {recentOrders.map((order) => (
                <RecentOrderCard
                  key={order._id}
                  order={order}
                />
              ))}

            </div>
          </>
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
        group
        relative
        overflow-hidden
        rounded-[22px]
        border border-zinc-200
        bg-white
        p-5
        shadow-[0_10px_35px_rgba(0,0,0,0.04)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-zinc-300
        hover:shadow-[0_16px_45px_rgba(0,0,0,0.07)]
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
          bg-cyan-300/[0.035]
          blur-2xl
          transition
          duration-500
          group-hover:bg-cyan-300/[0.06]
        "
      />

      <div className="relative flex items-start justify-between">

        <div
          className="
            flex h-10 w-10
            items-center justify-center
            rounded-xl
            border border-zinc-200
            bg-zinc-50
            text-zinc-500
            transition-all
            duration-300
            group-hover:border-zinc-300
            group-hover:bg-white
            group-hover:text-zinc-800
            group-hover:shadow-sm
          "
        >
          <Icon
            size={18}
            strokeWidth={1.6}
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

      <div className="relative mt-5">

        <p className="text-sm font-medium text-zinc-900">
          {label}
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          {description}
        </p>

      </div>
    </div>
  );
};

/* =========================================================
   QUICK ACTION
========================================================= */

const QuickAction = ({
  icon: Icon,
  title,
  description,
  to,
}) => {
  return (
    <Link
      to={to}
      className="
        group
        relative
        overflow-hidden
        rounded-[22px]
        border border-zinc-200
        bg-white
        p-5
        shadow-[0_10px_35px_rgba(0,0,0,0.04)]
        transition-[border-color,box-shadow,background-color]
        duration-300
        ease-out
        hover:border-zinc-300
        hover:bg-zinc-[50]
        hover:shadow-[0_14px_40px_rgba(0,0,0,0.06)]
      "
    >
      {/* Subtle background glow */}

      <div
        className="
          pointer-events-none
          absolute
          -right-12
          -top-12
          h-28
          w-28
          rounded-full
          bg-cyan-300/[0.025]
          blur-3xl
          opacity-0
          transition-opacity
          duration-500
          ease-out
          group-hover:opacity-100
        "
      />

      <div className="relative flex items-start justify-between">
        {/* Icon */}

        <div
          className="
            flex h-10 w-10
            items-center justify-center
            rounded-xl
            border border-zinc-200
            bg-zinc-50
            text-zinc-500
            transition-[border-color,background-color,color,box-shadow]
            duration-300
            ease-out
            group-hover:border-zinc-300
            group-hover:bg-zinc-100
            group-hover:text-zinc-800
            group-hover:shadow-sm
          "
        >
          <Icon
            size={18}
            strokeWidth={1.6}
          />
        </div>

        {/* Arrow */}

        <div
          className="
            flex h-8 w-8
            items-center justify-center
            rounded-lg
            border border-zinc-200
            bg-white
            text-zinc-400
            shadow-sm
            transition-[border-color,background-color,color,box-shadow]
            duration-300
            ease-out
            group-hover:border-zinc-800
            group-hover:bg-zinc-900
            group-hover:text-white
          "
        >
          <ArrowUpRight
            size={15}
            strokeWidth={1.7}
            className="
              transition-transform
              duration-300
              ease-out
              group-hover:translate-x-[2px]
              group-hover:-translate-y-[2px]
            "
          />
        </div>
      </div>

      <div className="relative mt-5">
        <h3 className="text-sm font-medium text-zinc-900">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-zinc-500">
          {description}
        </p>
      </div>
    </Link>
  );
};
/* =========================================================
   RECENT ORDER DESKTOP ROW
========================================================= */

const RecentOrderRow = ({ order }) => {
  const clientName =
    order.client?.name ||
    order.client?.username ||
    order.client?.email ||
    "Client";

  const serviceName =
    order.serviceSnapshot?.name ||
    order.service?.name ||
    "Service";

  return (
    <Link
      to={`/admin/orders/${order._id}`}
      className="
        group
        grid
        grid-cols-[1.3fr_1.4fr_1.2fr_0.8fr_1fr_80px]
        items-center
        border-b
        border-zinc-100
        px-6
        py-5
        last:border-b-0
        transition
        duration-200
        hover:bg-zinc-50
      "
    >
      {/* Order */}

      <div className="min-w-0">

        <p className="truncate text-sm font-medium text-zinc-900">
          {order.orderNumber}
        </p>

        <p className="mt-1 text-xs text-zinc-400">
          {formatDate(order.createdAt)}
        </p>

      </div>

      {/* Client */}

      <div className="min-w-0">

        <p className="truncate text-sm text-zinc-700">
          {clientName}
        </p>

        {order.client?.email && (
          <p className="mt-1 truncate text-xs text-zinc-400">
            {order.client.email}
          </p>
        )}

      </div>

      {/* Service */}

      <p className="truncate pr-4 text-sm text-zinc-600">
        {serviceName}
      </p>

      {/* Amount */}

      <p className="text-sm font-medium text-zinc-900">
        ₹
        {Number(order.amount || 0).toLocaleString("en-IN")}
      </p>

      {/* Status */}

      <div>
        <StatusBadge status={order.orderStatus} />
      </div>

      {/* View */}

      <div
        className="
          flex h-9 w-9
          items-center justify-center
          justify-self-end
          rounded-lg
          border border-zinc-200
          bg-white
          text-zinc-400
          shadow-sm
          transition-all
          duration-200
          group-hover:border-zinc-900
          group-hover:bg-zinc-900
          group-hover:text-white
        "
      >
        <ArrowUpRight
          size={15}
          className="
            transition-transform
            duration-200
            group-hover:translate-x-0.5
            group-hover:-translate-y-0.5
          "
        />
      </div>
    </Link>
  );
};

/* =========================================================
   RECENT ORDER MOBILE CARD
========================================================= */

const RecentOrderCard = ({ order }) => {
  const clientName =
    order.client?.name ||
    order.client?.username ||
    order.client?.email ||
    "Client";

  const serviceName =
    order.serviceSnapshot?.name ||
    order.service?.name ||
    "Service";

  return (
    <Link
      to={`/admin/orders/${order._id}`}
      className="
        group
        block
        rounded-[22px]
        border border-zinc-200
        bg-white
        p-5
        shadow-[0_10px_35px_rgba(0,0,0,0.04)]
        transition-all
        duration-300
        hover:border-zinc-300
        hover:bg-zinc-50
        hover:shadow-[0_15px_45px_rgba(0,0,0,0.06)]
      "
    >
      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <p className="truncate text-sm font-medium text-zinc-900">
            {order.orderNumber}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {formatDate(order.createdAt)}
          </p>

        </div>

        <StatusBadge
          status={order.orderStatus}
        />
      </div>

      <div
        className="
          mt-5
          grid
          grid-cols-2
          gap-4
          border-t
          border-zinc-100
          pt-4
        "
      >

        <div className="min-w-0">

          <p
            className="
              text-[10px]
              font-medium
              uppercase
              tracking-[0.15em]
              text-zinc-400
            "
          >
            Client
          </p>

          <p className="mt-1 truncate text-sm text-zinc-700">
            {clientName}
          </p>

        </div>

        <div className="min-w-0">

          <p
            className="
              text-[10px]
              font-medium
              uppercase
              tracking-[0.15em]
              text-zinc-400
            "
          >
            Service
          </p>

          <p className="mt-1 truncate text-sm text-zinc-700">
            {serviceName}
          </p>

        </div>

        <div>

          <p
            className="
              text-[10px]
              font-medium
              uppercase
              tracking-[0.15em]
              text-zinc-400
            "
          >
            Amount
          </p>

          <p className="mt-1 text-sm font-medium text-zinc-900">
            ₹
            {Number(order.amount || 0).toLocaleString("en-IN")}
          </p>

        </div>

        <div>

          <p
            className="
              text-[10px]
              font-medium
              uppercase
              tracking-[0.15em]
              text-zinc-400
            "
          >
            Payment
          </p>

          <p className="mt-1 text-sm text-zinc-600">
            {formatStatus(order.paymentStatus)}
          </p>

        </div>
      </div>

      <div
        className="
          mt-5
          flex
          items-center
          justify-between
          border-t
          border-zinc-100
          pt-4
          text-xs
          text-zinc-400
          transition
          duration-200
          group-hover:text-zinc-700
        "
      >
        <span>View order details</span>

        <ArrowUpRight
          size={15}
          className="
            transition-transform
            duration-300
            group-hover:-translate-y-0.5
            group-hover:translate-x-0.5
          "
        />
      </div>
    </Link>
  );
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ status }) => {
  const normalizedStatus = status || "unknown";

  const styles = {
    pending:
      "border-amber-200 bg-amber-50 text-amber-700",

    processing:
      "border-blue-200 bg-blue-50 text-blue-700",

    in_progress:
      "border-blue-200 bg-blue-50 text-blue-700",

    completed:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    delivered:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    cancelled:
      "border-red-200 bg-red-50 text-red-700",

    rejected:
      "border-red-200 bg-red-50 text-red-700",

    unknown:
      "border-zinc-200 bg-zinc-50 text-zinc-500",
  };

  return (
    <span
      className={`
        inline-flex
        whitespace-nowrap
        rounded-full
        border
        px-2.5
        py-1
        text-[10px]
        font-medium
        ${styles[normalizedStatus] || styles.unknown}
      `}
    >
      {formatStatus(normalizedStatus)}
    </span>
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyRecentOrders = () => {
  return (
    <div
      className="
        relative
        flex
        min-h-[300px]
        flex-col
        items-center
        justify-center
        overflow-hidden
        rounded-[24px]
        border border-zinc-200
        bg-white
        px-6
        text-center
        shadow-[0_20px_60px_rgba(0,0,0,0.05)]
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-48
          w-48
          rounded-full
          bg-cyan-300/[0.025]
          blur-3xl
        "
      />

      <div className="relative">

        <div
          className="
            mx-auto
            flex h-12 w-12
            items-center
            justify-center
            rounded-2xl
            border border-zinc-200
            bg-zinc-50
          "
        >
          <ClipboardList
            size={20}
            strokeWidth={1.6}
            className="text-zinc-400"
          />
        </div>

        <h3 className="mt-4 text-sm font-medium text-zinc-900">
          No recent orders
        </h3>

        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
          Client orders will appear here once they are created.
        </p>

        <Link
          to="/admin/orders"
          className="
            group
            mt-5
            inline-flex
            items-center
            gap-2
            rounded-xl
            border border-zinc-200
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-zinc-600
            shadow-sm
            transition-all
            duration-200
            hover:border-zinc-900
            hover:bg-zinc-900
            hover:text-white
            hover:shadow-md
          "
        >
          View Orders

          <ArrowUpRight
            size={15}
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
  );
};

/* =========================================================
   HELPERS
========================================================= */

const formatStatus = (status) => {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

export default AdminDashboard;