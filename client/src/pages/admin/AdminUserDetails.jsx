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

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await adminUserService.getUserById(id);

      setUser(response.user);
    } catch (error) {
      console.error(
        "Get admin user details error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load user details."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError("");

      const response =
        await adminUserService.getUserOrders(id);

      setOrders(response.orders || []);
    } catch (error) {
      console.error(
        "Get user orders error:",
        error
      );

      setOrdersError(
        error.response?.data?.message ||
          "Unable to load user orders."
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    loadUser();
    loadOrders();
  }, [id]);

  /* =====================================================
     USER STATUS
  ====================================================== */

  const toggleUserStatus = async () => {
    if (!user || user.role === "admin") {
      return;
    }

    const nextStatus = !user.isActive;

    try {
      setUpdatingStatus(true);
      setError("");

      const response =
        await adminUserService.updateUserStatus(
          user._id,
          nextStatus
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
      console.error(
        "Update user status error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to update user status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  /* =====================================================
     ORDER STATS
  ====================================================== */

  const orderStats = useMemo(() => {
    const total = orders.length;

    const completed = orders.filter(
      (order) =>
        order.orderStatus === "completed"
    ).length;

    const pending = orders.filter(
      (order) =>
        order.orderStatus === "pending"
    ).length;

    const processing = orders.filter(
      (order) =>
        order.orderStatus === "processing" ||
        order.orderStatus === "in_progress"
    ).length;

    const cancelled = orders.filter(
      (order) =>
        order.orderStatus === "cancelled"
    ).length;

    const totalSpent = orders
      .filter(
        (order) =>
          order.paymentStatus === "paid" ||
          order.paymentStatus === "collected"
      )
      .reduce(
        (total, order) =>
          total + Number(order.amount || 0),
        0
      );

    return {
      total,
      completed,
      pending,
      processing,
      cancelled,
      totalSpent,
    };
  }, [orders]);

  /* =====================================================
     LOADING
  ====================================================== */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[60vh]
          items-center
          justify-center
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-4
            text-center
          "
        >
          <div
            className="
              flex h-12 w-12
              items-center justify-center
              rounded-2xl
              border border-zinc-200
              bg-white
              shadow-sm
            "
          >
            <Loader2
              size={19}
              className="animate-spin text-zinc-400"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700">
              Loading user
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Fetching account details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     USER ERROR
  ====================================================== */

  if (error && !user) {
    return (
      <div
        className="
          mx-auto
          flex
          min-h-[60vh]
          max-w-xl
          items-center
          justify-center
          text-center
        "
      >
        <div>

          <div
            className="
              mx-auto
              flex h-14 w-14
              items-center justify-center
              rounded-2xl
              border border-red-200
              bg-red-50
            "
          >
            <UserX
              size={22}
              className="text-red-500"
            />
          </div>

          <h1
            className="
              mt-5
              text-xl
              font-medium
              text-zinc-900
            "
          >
            Unable to load user
          </h1>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-zinc-500
            "
          >
            {error || "User not found."}
          </p>

          <Link
            to="/admin/users"
            className="
              group
              mt-6
              inline-flex
              items-center
              gap-2
              rounded-xl
              border border-zinc-200
              bg-white
              px-5
              py-3
              text-sm
              font-medium
              text-zinc-600
              shadow-sm
              transition-all
              duration-200
              hover:border-zinc-300
              hover:bg-zinc-50
              hover:text-zinc-900
              hover:shadow-md
            "
          >
            <ArrowLeft
              size={16}
              className="
                transition-transform
                duration-200
                group-hover:-translate-x-1
              "
            />

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
    <div
      className="
        mx-auto
        max-w-[1500px]
        animate-fade-up
      "
    >

      {/* =====================================================
          BACK
      ====================================================== */}

      <Link
        to="/admin/users"
        className="
          group
          mb-6
          inline-flex
          items-center
          gap-2
          rounded-lg
          py-1
          pr-3
          text-sm
          text-zinc-500
          transition
          duration-200
          hover:text-zinc-900
        "
      >
        <ArrowLeft
          size={16}
          className="
            transition-transform
            duration-200
            group-hover:-translate-x-1
          "
        />

        Back to Users
      </Link>

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
            onClick={loadUser}
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
          USER HEADER
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
          shadow-[0_20px_80px_rgba(0,0,0,0.06)]
          transition-all
          duration-300
          hover:border-zinc-300
          hover:shadow-[0_24px_90px_rgba(0,0,0,0.08)]
          sm:p-8
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

        <div
          className="
            relative
            flex
            flex-col
            gap-6
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >

          {/* User */}

          <div
            className="
              flex
              min-w-0
              items-center
              gap-4
              sm:gap-5
            "
          >

            <div
              className="
                flex h-16 w-16
                shrink-0
                items-center justify-center
                rounded-2xl
                border border-zinc-200
                bg-zinc-50
                text-xl
                font-semibold
                text-zinc-500
                shadow-sm
                sm:h-20
                sm:w-20
                sm:text-2xl
              "
            >
              {user.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0">

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <h1
                  className="
                    text-3xl
                    font-medium
                    tracking-tight
                    text-zinc-900
                    sm:text-4xl
                  "
                >
                  {user.name ||
                    "Unnamed User"}
                </h1>

                <RoleBadge
                  role={user.role}
                />
              </div>

              <p
                className="
                  mt-1
                  truncate
                  text-sm
                  text-zinc-400
                "
              >
                @{user.username || "—"}
              </p>

              <div
                className="
                  mt-3
                  flex
                  flex-wrap
                  items-center
                  gap-3
                "
              >
                <StatusBadge
                  isActive={
                    user.isActive
                  }
                />

                <span className="text-xs text-zinc-400">
                  Joined{" "}
                  {formatDate(
                    user.createdAt
                  )}
                </span>
              </div>

            </div>
          </div>

          {/* Status Action */}

          {user.role !== "admin" && (
            <button
              type="button"
              onClick={
                toggleUserStatus
              }
              disabled={
                updatingStatus
              }
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
                shadow-sm
                transition-all
                duration-200
                disabled:cursor-not-allowed
                disabled:opacity-50
                ${
                  user.isActive
                    ? `
                      border-red-200
                      bg-red-50
                      text-red-600
                      hover:border-red-300
                      hover:bg-red-100
                      hover:text-red-700
                    `
                    : `
                      border-emerald-200
                      bg-emerald-50
                      text-emerald-600
                      hover:border-emerald-300
                      hover:bg-emerald-100
                      hover:text-emerald-700
                    `
                }
              `}
            >
              {updatingStatus ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : user.isActive ? (
                <XCircle size={16} />
              ) : (
                <CheckCircle2
                  size={16}
                />
              )}

              {updatingStatus
                ? "Updating..."
                : user.isActive
                  ? "Deactivate User"
                  : "Activate User"}
            </button>
          )}

        </div>
      </section>

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
          value={
            orderStats.total
          }
        />

        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={
            orderStats.completed
          }
        />

        <StatCard
          icon={CreditCard}
          label="Total Spent"
          value={`₹${orderStats.totalSpent.toLocaleString(
            "en-IN"
          )}`}
        />

        <StatCard
          icon={CalendarDays}
          label="Pending Orders"
          value={
            orderStats.pending
          }
        />
      </section>

      {/* =====================================================
          MAIN INFORMATION
      ====================================================== */}

      <section
        className="
          mt-6
          grid
          gap-6
          xl:grid-cols-[0.8fr_1.2fr]
        "
      >

        {/* Account Information */}

        <InfoCard
          icon={UserRound}
          eyebrow="Account"
          title="User Information"
        >
          <div className="space-y-1">

            <InfoRow
              icon={UserRound}
              label="Name"
              value={
                user.name || "—"
              }
            />

            <InfoRow
              icon={Mail}
              label="Email"
              value={
                user.email || "—"
              }
            />

            <InfoRow
              icon={UserRound}
              label="Username"
              value={
                user.username
                  ? `@${user.username}`
                  : "—"
              }
            />

            <InfoRow
              icon={ShieldCheck}
              label="Role"
              value={
                <RoleBadge
                  role={user.role}
                />
              }
            />

            <InfoRow
              icon={
                user.isActive
                  ? CheckCircle2
                  : XCircle
              }
              label="Account Status"
              value={
                <StatusBadge
                  isActive={
                    user.isActive
                  }
                />
              }
            />

            <InfoRow
              icon={CalendarDays}
              label="Joined"
              value={formatDateTime(
                user.createdAt
              )}
            />

            <InfoRow
              icon={CalendarDays}
              label="Last Updated"
              value={formatDateTime(
                user.updatedAt
              )}
            />

          </div>
        </InfoCard>

        {/* Order Overview */}

        <InfoCard
          icon={Package}
          eyebrow="Activity"
          title="Order Overview"
        >
          <div
            className="
              grid
              gap-3
              sm:grid-cols-2
            "
          >
            <MiniStat
              label="Total"
              value={
                orderStats.total
              }
            />

            <MiniStat
              label="Completed"
              value={
                orderStats.completed
              }
            />

            <MiniStat
              label="Processing"
              value={
                orderStats.processing
              }
            />

            <MiniStat
              label="Cancelled"
              value={
                orderStats.cancelled
              }
            />
          </div>
        </InfoCard>

      </section>

      {/* =====================================================
          ORDERS
      ====================================================== */}

      <section
        className="
          mt-6
          rounded-[24px]
          border border-zinc-200
          bg-white
          p-6
          shadow-[0_15px_55px_rgba(0,0,0,0.05)]
          sm:p-7
        "
      >

        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-xl
                border border-zinc-200
                bg-zinc-50
              "
            >
              <Package
                size={18}
                className="text-zinc-500"
                strokeWidth={1.6}
              />
            </div>

            <div>

              <p
                className="
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.18em]
                  text-zinc-400
                "
              >
                Orders
              </p>

              <h2
                className="
                  mt-1
                  text-lg
                  font-medium
                  text-zinc-900
                "
              >
                Recent Orders
              </h2>

            </div>
          </div>

          <span className="text-xs text-zinc-400">
            {orders.length}{" "}
            {orders.length === 1
              ? "order"
              : "orders"}
          </span>

        </div>

        {/* Orders Loading */}

        {ordersLoading ? (
          <div
            className="
              flex
              min-h-[220px]
              items-center
              justify-center
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
                text-sm
                text-zinc-400
              "
            >
              <Loader2
                size={18}
                className="animate-spin"
              />

              Loading orders...
            </div>
          </div>
        ) : ordersError ? (
          <div
            className="
              mt-6
              rounded-2xl
              border border-red-200
              bg-red-50
              p-5
            "
          >
            <p className="text-sm text-red-600">
              {ordersError}
            </p>

            <button
              type="button"
              onClick={
                loadOrders
              }
              className="
                mt-3
                text-sm
                font-medium
                text-red-600
                underline
                underline-offset-4
              "
            >
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div
            className="
              mt-6
              overflow-hidden
              rounded-2xl
              border border-zinc-200
            "
          >

            {/* Desktop */}

            <div className="hidden md:block">

              <div
                className="
                  grid
                  grid-cols-[1.4fr_1.5fr_0.9fr_0.9fr_70px]
                  border-b
                  border-zinc-200
                  bg-zinc-50
                  px-5
                  py-3
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.15em]
                  text-zinc-400
                "
              >
                <span>Order</span>
                <span>Service</span>
                <span>Amount</span>
                <span>Status</span>
                <span />
              </div>

              {orders.map(
                (order) => (
                  <AdminOrderRow
                    key={order._id}
                    order={order}
                  />
                )
              )}

            </div>

            {/* Mobile */}

            <div
              className="
                divide-y
                divide-zinc-100
                md:hidden
              "
            >
              {orders.map(
                (order) => (
                  <AdminOrderMobileCard
                    key={order._id}
                    order={order}
                  />
                )
              )}
            </div>

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
}) => {
  return (
    <div
      className="
        group
        rounded-2xl
        border border-zinc-200
        bg-white
        p-5
        shadow-[0_10px_35px_rgba(0,0,0,0.04)]
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-zinc-300
        hover:shadow-[0_15px_45px_rgba(0,0,0,0.07)]
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >

        <div
          className="
            flex h-10 w-10
            items-center justify-center
            rounded-xl
            border border-zinc-200
            bg-zinc-50
            text-zinc-500
            transition
            duration-300
            group-hover:border-zinc-300
            group-hover:bg-white
            group-hover:text-zinc-800
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
            font-medium
            tracking-tight
            text-zinc-900
          "
        >
          {value}
        </span>

      </div>

      <p
        className="
          mt-5
          text-sm
          font-medium
          text-zinc-800
        "
      >
        {label}
      </p>

    </div>
  );
};

/* =========================================================
   MINI STAT
========================================================= */

const MiniStat = ({
  label,
  value,
}) => {
  return (
    <div
      className="
        rounded-xl
        border border-zinc-200
        bg-zinc-50
        p-4
        transition
        duration-200
        hover:border-zinc-300
        hover:bg-white
        hover:shadow-sm
      "
    >
      <p
        className="
          text-[10px]
          font-medium
          uppercase
          tracking-[0.15em]
          text-zinc-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-2
          text-xl
          font-medium
          text-zinc-900
        "
      >
        {value}
      </p>
    </div>
  );
};

/* =========================================================
   INFO CARD
========================================================= */

const InfoCard = ({
  icon: Icon,
  eyebrow,
  title,
  children,
}) => {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-[24px]
        border border-zinc-200
        bg-white
        p-6
        shadow-[0_12px_45px_rgba(0,0,0,0.04)]
        transition
        duration-300
        hover:border-zinc-300
        hover:shadow-[0_18px_60px_rgba(0,0,0,0.06)]
        sm:p-7
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-16
          -top-16
          h-40
          w-40
          rounded-full
          bg-cyan-300/[0.025]
          blur-3xl
          opacity-0
          transition
          duration-500
          group-hover:opacity-100
        "
      />

      <div className="relative">

        <div className="flex items-center gap-3">

          <div
            className="
              flex h-10 w-10
              shrink-0
              items-center justify-center
              rounded-xl
              border border-zinc-200
              bg-zinc-50
              transition
              duration-300
              group-hover:border-zinc-300
              group-hover:bg-white
              group-hover:shadow-sm
            "
          >
            <Icon
              size={18}
              strokeWidth={1.6}
              className="
                text-zinc-400
                transition
                duration-300
                group-hover:text-zinc-700
              "
            />
          </div>

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
              {eyebrow}
            </p>

            <h2
              className="
                mt-1
                text-lg
                font-medium
                text-zinc-900
              "
            >
              {title}
            </h2>

          </div>

        </div>

        <div className="relative mt-6">
          {children}
        </div>

      </div>
    </div>
  );
};

/* =========================================================
   INFO ROW
========================================================= */

const InfoRow = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-5
        border-b
        border-zinc-100
        py-3.5
        last:border-b-0
      "
    >
      <div
        className="
          flex
          min-w-0
          items-center
          gap-3
        "
      >
        <Icon
          size={15}
          strokeWidth={1.6}
          className="
            shrink-0
            text-zinc-400
          "
        />

        <span className="text-sm text-zinc-500">
          {label}
        </span>
      </div>

      <span
        className="
          max-w-[60%]
          truncate
          text-right
          text-sm
          text-zinc-700
        "
      >
        {value}
      </span>
    </div>
  );
};

/* =========================================================
   DESKTOP ORDER ROW
========================================================= */

const AdminOrderRow = ({
  order,
}) => {
  const serviceName =
    order.serviceSnapshot?.name ||
    order.service?.name ||
    "Service";

  return (
    <div
      className="
        group
        grid
        grid-cols-[1.4fr_1.5fr_0.9fr_0.9fr_70px]
        items-center
        border-b
        border-zinc-100
        px-5
        py-4
        last:border-b-0
        transition
        duration-200
        hover:bg-zinc-50
      "
    >

      <div>

        <p
          className="
            text-sm
            font-medium
            text-zinc-900
          "
        >
          {order.orderNumber}
        </p>

        <p className="mt-1 text-xs text-zinc-400">
          {formatDate(
            order.createdAt
          )}
        </p>

      </div>

      <p
        className="
          truncate
          pr-4
          text-sm
          text-zinc-600
        "
      >
        {serviceName}
      </p>

      <p
        className="
          text-sm
          font-medium
          text-zinc-900
        "
      >
        ₹
        {Number(
          order.amount || 0
        ).toLocaleString(
          "en-IN"
        )}
      </p>

      <div>
        <OrderStatusBadge
          status={
            order.orderStatus
          }
        />
      </div>

      <Link
        to={`/admin/orders/${order._id}`}
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
          hover:border-zinc-900
          hover:bg-zinc-900
          hover:text-white
        "
        aria-label={`View ${order.orderNumber}`}
      >
        <ChevronRight size={16} />
      </Link>

    </div>
  );
};

/* =========================================================
   MOBILE ORDER CARD
========================================================= */

const AdminOrderMobileCard = ({
  order,
}) => {
  const serviceName =
    order.serviceSnapshot?.name ||
    order.service?.name ||
    "Service";

  return (
    <div className="p-5">

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >

        <div>

          <p
            className="
              text-sm
              font-medium
              text-zinc-900
            "
          >
            {order.orderNumber}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {formatDate(
              order.createdAt
            )}
          </p>

        </div>

        <OrderStatusBadge
          status={
            order.orderStatus
          }
        />

      </div>

      <div
        className="
          mt-4
          grid
          grid-cols-2
          gap-4
          border-t
          border-zinc-100
          pt-4
        "
      >

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
            Service
          </p>

          <p
            className="
              mt-1
              truncate
              text-sm
              text-zinc-600
            "
          >
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

          <p
            className="
              mt-1
              text-sm
              font-medium
              text-zinc-900
            "
          >
            ₹
            {Number(
              order.amount || 0
            ).toLocaleString(
              "en-IN"
            )}
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
            {formatStatus(
              order.paymentMethod
            )}
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
            Payment Status
          </p>

          <p className="mt-1 text-sm text-zinc-600">
            {formatStatus(
              order.paymentStatus
            )}
          </p>

        </div>

      </div>

      <Link
        to={`/admin/orders/${order._id}`}
        className="
          group
          mt-5
          flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          border border-zinc-200
          bg-white
          py-3
          text-sm
          font-medium
          text-zinc-600
          shadow-sm
          transition-all
          duration-200
          hover:border-zinc-900
          hover:bg-zinc-900
          hover:text-white
        "
      >
        View Order

        <ChevronRight
          size={16}
          className="
            transition-transform
            duration-200
            group-hover:translate-x-0.5
          "
        />
      </Link>

    </div>
  );
};

/* =========================================================
   ROLE BADGE
========================================================= */

const RoleBadge = ({
  role,
}) => {
  const isAdmin =
    role === "admin";

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-[11px]
        font-medium
        ${
          isAdmin
            ? `
              border-purple-200
              bg-purple-50
              text-purple-700
            `
            : `
              border-zinc-200
              bg-zinc-50
              text-zinc-500
            `
        }
      `}
    >
      {isAdmin && (
        <ShieldCheck
          size={12}
          strokeWidth={1.7}
        />
      )}

      {isAdmin
        ? "Admin"
        : "Client"}
    </span>
  );
};

/* =========================================================
   USER STATUS BADGE
========================================================= */

const StatusBadge = ({
  isActive,
}) => {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-[11px]
        font-medium
        ${
          isActive
            ? `
              border-emerald-200
              bg-emerald-50
              text-emerald-700
            `
            : `
              border-red-200
              bg-red-50
              text-red-600
            `
        }
      `}
    >
      <span
        className={`
          h-1.5
          w-1.5
          rounded-full
          ${
            isActive
              ? "bg-emerald-500"
              : "bg-red-500"
          }
        `}
      />

      {isActive
        ? "Active"
        : "Inactive"}
    </span>
  );
};

/* =========================================================
   ORDER STATUS BADGE
========================================================= */

const OrderStatusBadge = ({
  status,
}) => {
  const normalizedStatus =
    status?.toLowerCase();

  let classes =
    "border-zinc-200 bg-zinc-50 text-zinc-500";

  if (
    normalizedStatus ===
    "completed"
  ) {
    classes =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (
    normalizedStatus ===
    "cancelled"
  ) {
    classes =
      "border-red-200 bg-red-50 text-red-600";
  } else if (
    normalizedStatus ===
      "processing" ||
    normalizedStatus ===
      "in_progress"
  ) {
    classes =
      "border-blue-200 bg-blue-50 text-blue-700";
  } else if (
    normalizedStatus ===
    "pending"
  ) {
    classes =
      "border-amber-200 bg-amber-50 text-amber-700";
  }

  return (
    <span
      className={`
        inline-flex
        whitespace-nowrap
        rounded-full
        border
        px-2.5
        py-1
        text-[11px]
        font-medium
        ${classes}
      `}
    >
      {formatStatus(
        status
      )}
    </span>
  );
};

/* =========================================================
   EMPTY ORDERS
========================================================= */

const EmptyOrders = () => {
  return (
    <div
      className="
        mt-6
        flex
        min-h-[220px]
        flex-col
        items-center
        justify-center
        rounded-2xl
        border border-zinc-200
        bg-zinc-50
        px-6
        text-center
      "
    >
      <div
        className="
          flex h-12 w-12
          items-center justify-center
          rounded-2xl
          border border-zinc-200
          bg-white
          text-zinc-400
          shadow-sm
        "
      >
        <Package
          size={22}
          strokeWidth={1.6}
        />
      </div>

      <p
        className="
          mt-4
          text-sm
          font-medium
          text-zinc-800
        "
      >
        No orders yet
      </p>

      <p
        className="
          mt-1
          text-sm
          text-zinc-400
        "
      >
        Orders placed by this user
        will appear here.
      </p>
    </div>
  );
};

/* =========================================================
   HELPERS
========================================================= */

const formatStatus = (
  status
) => {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

const formatDate = (
  date
) => {
  if (!date) {
    return "—";
  }

  return new Date(
    date
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatDateTime = (
  date
) => {
  if (!date) {
    return "—";
  }

  return new Date(
    date
  ).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

export default AdminUserDetails;