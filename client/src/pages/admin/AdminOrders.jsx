import { useEffect, useState } from "react";

import {
  ArrowRight,
  ClipboardList,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

import { Link } from "react-router-dom";

import adminOrderService from "../../services/adminOrderService";
import CustomSelect from "../../components/CustomSelect";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data =
        await adminOrderService.getAdminOrders();

      setOrders(data.orders || []);
    } catch (error) {
      console.error(
        "Get admin orders error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /* =====================================================
     FILTER ORDERS
  ====================================================== */

  const filteredOrders = orders.filter(
    (order) => {
      const searchValue =
        search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        order.orderNumber
          ?.toLowerCase()
          .includes(searchValue) ||
        order.client?.name
          ?.toLowerCase()
          .includes(searchValue) ||
        order.client?.email
          ?.toLowerCase()
          .includes(searchValue) ||
        order.serviceSnapshot?.name
          ?.toLowerCase()
          .includes(searchValue) ||
        order.service?.name
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        order.orderStatus ===
          statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );

  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== "all";

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

        <div className="relative">

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
              <ClipboardList
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
              Orders
            </p>

          </div>

          <div
            className="
              mt-5
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >

            <div>

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
                All Orders
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
                Manage client orders, payments and
                project status from one place.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                loadOrders(true)
              }
              disabled={
                loading || refreshing
              }
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
                    refreshing
                      ? "animate-spin"
                      : "group-hover/refresh:rotate-180"
                  }
                `}
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>
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
            p-5
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
            onClick={() =>
              loadOrders()
            }
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
          FILTERS
      ====================================================== */}

      <section
        className="
          mb-6
          rounded-2xl
          border border-zinc-200
          bg-white
          p-4
          shadow-[0_10px_35px_rgba(0,0,0,0.04)]
        "
      >
        <div
          className="
            flex
            flex-col
            gap-3
            lg:flex-row
            lg:items-center
          "
        >

          {/* Search */}

          <div className="relative flex-1">

            <Search
              size={17}
              className="
                pointer-events-none
                absolute
                left-4
                top-1/2
                z-10
                -translate-y-1/2
                text-zinc-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search orders, clients or services..."
              className="
                h-[50px]
                w-full
                rounded-xl
                border border-zinc-200
                bg-zinc-50
                pl-11
                pr-4
                text-sm
                text-zinc-900
                outline-none
                transition-all
                duration-200
                placeholder:text-zinc-400
                hover:border-zinc-300
                hover:bg-white
                focus:border-zinc-400
                focus:bg-white
                focus:ring-2
                focus:ring-zinc-900/5
              "
            />

          </div>

          {/* Status */}

          <div
            className="
              w-full
              lg:w-[220px]
              lg:shrink-0
            "
          >
            <CustomSelect
              value={statusFilter}
              onChange={
                setStatusFilter
              }
              options={[
                {
                  value: "all",
                  label: "All Statuses",
                },
                {
                  value: "pending",
                  label: "Pending",
                },
                {
                  value: "processing",
                  label: "Processing",
                },
                {
                  value: "in_progress",
                  label: "In Progress",
                },
                {
                  value: "completed",
                  label: "Completed",
                },
                {
                  value: "cancelled",
                  label: "Cancelled",
                },
              ]}
            />
          </div>

        </div>
      </section>

      {/* =====================================================
          RESULT COUNT
      ====================================================== */}

      {!loading && (
        <div
          className="
            mb-4
            flex
            items-center
            justify-between
          "
        >
          <p className="text-sm text-zinc-400">

            Showing{" "}

            <span className="font-medium text-zinc-700">
              {filteredOrders.length}
            </span>{" "}

            {filteredOrders.length === 1
              ? "order"
              : "orders"}

          </p>
        </div>
      )}

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div
          className="
            relative
            flex
            min-h-[350px]
            items-center
            justify-center
            overflow-hidden
            rounded-[24px]
            border border-zinc-200
            bg-white
            shadow-[0_15px_55px_rgba(0,0,0,0.05)]
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

          <div
            className="
              relative
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
                bg-zinc-50
              "
            >
              <Loader2
                size={19}
                className="animate-spin text-zinc-400"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-700">
                Loading orders
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                Fetching the latest order data...
              </p>
            </div>

          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyOrders
          hasFilters={hasFilters}
        />
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
              shadow-[0_15px_55px_rgba(0,0,0,0.05)]
              md:block
            "
          >
            <div
              className="
                grid
                grid-cols-[1.25fr_1.25fr_1.2fr_0.8fr_0.9fr_0.9fr_56px]
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
              <span>Payment</span>
              <span>Status</span>
              <span />
            </div>

            <div>
              {filteredOrders.map(
                (order) => (
                  <AdminOrderRow
                    key={order._id}
                    order={order}
                  />
                )
              )}
            </div>
          </div>

          {/* =================================================
              MOBILE
          ================================================== */}

          <div className="space-y-3 md:hidden">

            {filteredOrders.map(
              (order) => (
                <AdminOrderMobileCard
                  key={order._id}
                  order={order}
                />
              )
            )}

          </div>
        </>
      )}
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

  const clientName =
    order.client?.name ||
    order.client?.username ||
    "Unknown Client";

  return (
    <Link
      to={`/admin/orders/${order._id}`}
      className="
        group
        grid
        grid-cols-[1.25fr_1.25fr_1.2fr_0.8fr_0.9fr_0.9fr_56px]
        items-center
        border-b
        border-zinc-100
        px-6
        py-5
        last:border-b-0
        transition
        duration-300
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

        <p className="mt-1 truncate text-xs text-zinc-400">
          {order.client?.email || "—"}
        </p>

      </div>

      {/* Service */}

      <p className="truncate pr-4 text-sm text-zinc-600">
        {serviceName}
      </p>

      {/* Amount */}

      <p className="text-sm font-medium text-zinc-900">
        ₹
        {Number(
          order.amount || 0
        ).toLocaleString(
          "en-IN"
        )}
      </p>

      {/* Payment */}

      <div>
        <PaymentBadge
          method={
            order.paymentMethod
          }
          status={
            order.paymentStatus
          }
        />
      </div>

      {/* Status */}

      <div>
        <StatusBadge
          status={
            order.orderStatus
          }
        />
      </div>

      {/* Arrow */}

      <div className="flex justify-end">

        <span
          className="
            flex h-9 w-9
            items-center justify-center
            rounded-lg
            border border-zinc-200
            bg-white
            text-zinc-400
            shadow-sm
            transition-all
            duration-300
            group-hover:border-zinc-900
            group-hover:bg-zinc-900
            group-hover:text-white
            group-hover:shadow-md
          "
        >
          <ArrowRight
            size={16}
            className="
              transition-transform
              duration-300
              group-hover:translate-x-0.5
            "
          />
        </span>

      </div>
    </Link>
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

  const clientName =
    order.client?.name ||
    order.client?.username ||
    "Unknown Client";

  return (
    <Link
      to={`/admin/orders/${order._id}`}
      className="
        group
        block
        rounded-2xl
        border border-zinc-200
        bg-white
        p-5
        shadow-[0_8px_30px_rgba(0,0,0,0.035)]
        transition-all
        duration-300
        hover:border-zinc-300
        hover:bg-zinc-50
        hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]
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

        <div className="min-w-0">

          <p className="truncate text-sm font-medium text-zinc-900">
            {order.orderNumber}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {formatDate(order.createdAt)}
          </p>

        </div>

        <StatusBadge
          status={
            order.orderStatus
          }
        />

      </div>

      <div
        className="
          mt-5
          space-y-4
          border-t
          border-zinc-100
          pt-4
        "
      >

        {/* Client */}

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
            Client
          </p>

          <p className="mt-1 text-sm text-zinc-700">
            {clientName}
          </p>

          {order.client?.email && (
            <p className="mt-1 truncate text-xs text-zinc-400">
              {order.client.email}
            </p>
          )}

        </div>

        {/* Service */}

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

          <p className="mt-1 text-sm text-zinc-700">
            {serviceName}
          </p>

        </div>

        {/* Amount + Payment */}

        <div className="grid grid-cols-2 gap-4">

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

            <div className="mt-1">

              <PaymentBadge
                method={
                  order.paymentMethod
                }
                status={
                  order.paymentStatus
                }
              />

            </div>

          </div>

        </div>

      </div>

      {/* View Details */}

      <div
        className="
          mt-5
          flex
          items-center
          justify-between
          border-t
          border-zinc-100
          pt-4
        "
      >

        <span
          className="
            text-xs
            text-zinc-400
            transition
            group-hover:text-zinc-700
          "
        >
          View order details
        </span>

        <span
          className="
            flex h-9 w-9
            items-center justify-center
            rounded-lg
            border border-zinc-200
            bg-white
            text-zinc-400
            shadow-sm
            transition-all
            duration-300
            group-hover:border-zinc-900
            group-hover:bg-zinc-900
            group-hover:text-white
          "
        >
          <ArrowRight
            size={16}
            className="
              transition-transform
              duration-300
              group-hover:translate-x-0.5
            "
          />
        </span>

      </div>
    </Link>
  );
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({
  status,
}) => {
  const config = {
    pending: {
      label: "Pending",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    },

    processing: {
      label: "Processing",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    },

    in_progress: {
      label: "In Progress",
      className:
        "border-purple-200 bg-purple-50 text-purple-700",
    },

    completed: {
      label: "Completed",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    cancelled: {
      label: "Cancelled",
      className:
        "border-red-200 bg-red-50 text-red-700",
    },
  };

  const current =
    config[status] || {
      label: formatStatus(status),
      className:
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
        ${current.className}
      `}
    >
      {current.label}
    </span>
  );
};

/* =========================================================
   PAYMENT BADGE
========================================================= */

const PaymentBadge = ({
  method,
  status,
}) => {
  const methodLabel =
    method === "cod"
      ? "COD"
      : method === "online"
        ? "Online"
        : formatStatus(method);

  const statusLabel =
    formatStatus(status);

  const isSuccessful =
    status === "paid" ||
    status === "collected";

  return (
    <div>

      <p className="text-xs text-zinc-600">
        {methodLabel}
      </p>

      <p
        className={`
          mt-0.5
          text-[10px]
          ${
            isSuccessful
              ? "text-emerald-600"
              : "text-zinc-400"
          }
        `}
      >
        {statusLabel}
      </p>

    </div>
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyOrders = ({
  hasFilters,
}) => {
  return (
    <div
      className="
        relative
        flex
        min-h-[400px]
        flex-col
        items-center
        justify-center
        overflow-hidden
        rounded-[24px]
        border border-zinc-200
        bg-white
        px-6
        text-center
        shadow-[0_15px_55px_rgba(0,0,0,0.05)]
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
          bg-cyan-300/[0.03]
          blur-3xl
        "
      />

      <div className="relative">

        <div
          className="
            mx-auto
            flex h-14 w-14
            items-center justify-center
            rounded-2xl
            border border-zinc-200
            bg-zinc-50
            text-zinc-400
          "
        >
          <ClipboardList
            size={22}
            strokeWidth={1.6}
          />
        </div>

        <h2
          className="
            mt-5
            text-lg
            font-medium
            text-zinc-900
          "
        >
          {hasFilters
            ? "No matching orders"
            : "No orders yet"}
        </h2>

        <p
          className="
            mt-2
            max-w-sm
            text-sm
            leading-6
            text-zinc-500
          "
        >
          {hasFilters
            ? "Try changing your search or status filter."
            : "Orders placed by clients will appear here."}
        </p>

      </div>
    </div>
  );
};

/* =========================================================
   HELPERS
========================================================= */

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

export default AdminOrders;