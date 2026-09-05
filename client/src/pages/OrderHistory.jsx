import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import orderService from "../services/orderService";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await orderService.getMyOrders();

      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (error) {
      console.error("Get orders error:", error);

      setError(error.response?.data?.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="mx-auto max-w-[1500px] animate-fade-up">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-9 w-9
              shrink-0
              items-center justify-center
              rounded-xl
              border border-zinc-200
              bg-white
              text-zinc-500
              shadow-sm
            "
          >
            <ClipboardList size={17} strokeWidth={1.7} />
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
              Orders
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
              Your Orders
            </h1>
          </div>
        </div>

        {/* Refresh */}

        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="
            group
            inline-flex
            items-center
            justify-center
            gap-2
            self-start
            rounded-xl
            border border-zinc-200
            bg-white
            px-4
            py-2.5
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
              ${loading ? "animate-spin" : "group-hover:rotate-180"}
            `}
          />
          Refresh
        </button>
      </div>

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
          <div>
            <p className="text-sm font-medium text-red-700">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-600/70">{error}</p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="
              self-start
              text-sm
              text-red-600
              underline
              underline-offset-4
              transition
              hover:text-red-800
            "
          >
            Try again
          </button>
        </div>
      )}

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <LoadingOrders />
      ) : orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <>
          {/* =================================================
              DESKTOP TABLE
          ================================================== */}

          <div
            className="
              hidden
              overflow-hidden
              rounded-[28px]
              border border-zinc-200
              bg-white
              shadow-[0_20px_80px_rgba(0,0,0,0.05)]
              md:block
            "
          >
            {/* Table Header */}

            <div
              className="
                grid
                grid-cols-[1.25fr_1.5fr_0.7fr_1fr_1.1fr_1.1fr_1fr_60px]
                items-center
                gap-4
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
              <span>Service</span>
              <span>Qty.</span>
              <span>Amount</span>
              <span>Payment</span>
              <span>Status</span>
              <span>Date</span>
              <span />
            </div>

            {/* Table Rows */}

            <div>
              {orders.map((order) => (
                <OrderTableRow key={order._id || order.id} order={order} />
              ))}
            </div>
          </div>

          {/* =================================================
              MOBILE CARDS
          ================================================== */}

          <div className="space-y-4 md:hidden">
            {orders.map((order) => (
              <OrderMobileCard key={order._id || order.id} order={order} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ============================================================
   LOADING
============================================================ */

const LoadingOrders = () => {
  return (
    <div
      className="
        relative
        flex
        min-h-[400px]
        items-center
        justify-center
        overflow-hidden
        rounded-[28px]
        border border-zinc-200
        bg-white
        shadow-[0_20px_80px_rgba(0,0,0,0.05)]
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

      <div className="relative flex flex-col items-center gap-4 text-center">
        <div
          className="
            flex h-12 w-12
            items-center justify-center
            rounded-2xl
            border border-zinc-200
            bg-zinc-50
          "
        >
          <Loader2 size={19} className="animate-spin text-zinc-500" />
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-700">Loading orders</p>

          <p className="mt-1 text-xs text-zinc-400">
            Fetching your latest orders...
          </p>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   DESKTOP ORDER ROW
============================================================ */

const OrderTableRow = ({ order }) => {
  const serviceName = getServiceName(order);

  const paymentDone = isPaymentCompleted(order);

  return (
    <div
      className="
        group
        grid
        grid-cols-[1.25fr_1.5fr_0.7fr_1fr_1.1fr_1.1fr_1fr_60px]
        items-center
        gap-4
        border-b
        border-zinc-100
        px-6
        py-5
        transition
        duration-200
        last:border-b-0
        hover:bg-zinc-50
      "
    >
      {/* Order */}

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900">
          {order.orderNumber || "—"}
        </p>
      </div>

      {/* Service */}

      <div className="min-w-0">
        <p className="truncate text-sm text-zinc-600">{serviceName}</p>

        {order.service?.category && (
          <p className="mt-1 truncate text-xs text-zinc-400">
            {order.service.category}
          </p>
        )}
      </div>

      {/* Quantity */}

      <p className="text-sm text-zinc-600">{formatQuantity(order.quantity)}</p>

      {/* Amount */}

      <p className="text-sm font-medium text-zinc-800">
        {formatCurrency(order.amount)}
      </p>

      {/* Payment */}

      <div>
        {paymentDone ? (
          <PaymentStatusBadge status="paid" />
        ) : (
          <PaymentStatusBadge status={order.paymentStatus} />
        )}

        <p className="mt-1 text-[11px] text-zinc-400">
          {formatStatus(order.paymentMethod)}
        </p>
      </div>

      {/* Order Status */}

      <div>
        <StatusBadge status={order.orderStatus} />
      </div>

      {/* Date */}

      <p className="text-sm text-zinc-500">{formatDate(order.createdAt)}</p>

      {/* View */}

      <Link
        to={`/dashboard/orders/${order._id || order.id}`}
        className="
          group/button
          flex h-9 w-9
          items-center justify-center
          justify-self-end
          rounded-xl
          border border-zinc-200
          bg-white
          text-zinc-400
          shadow-sm
          transition
          duration-200
          hover:border-zinc-300
          hover:bg-zinc-50
          hover:text-zinc-900
          hover:shadow-md
        "
        aria-label={`View ${order.orderNumber || "order"}`}
      >
        <ArrowRight
          size={16}
          className="
            transition-transform
            duration-200
            group-hover/button:translate-x-0.5
          "
        />
      </Link>
    </div>
  );
};

/* ============================================================
   MOBILE ORDER CARD
============================================================ */

const OrderMobileCard = ({ order }) => {
  const serviceName = getServiceName(order);
  const paymentDone = isPaymentCompleted(order);

  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-[24px]
        border border-zinc-200
        bg-white
        p-5
        shadow-[0_10px_35px_rgba(0,0,0,0.04)]
        transition
        duration-200
        hover:border-zinc-300
        hover:shadow-[0_15px_45px_rgba(0,0,0,0.06)]
      "
    >
      {/* Background decoration */}

      <div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-40
          w-40
          rounded-full
          bg-cyan-300/[0.025]
          blur-3xl
        "
      />

      <div className="relative">
        {/* Top */}

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900">
              {order.orderNumber || "—"}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              {formatDate(order.createdAt)}
            </p>
          </div>

          <StatusBadge status={order.orderStatus} />
        </div>

        {/* Service */}

        <div
          className="
            mt-5
            rounded-2xl
            border
            border-zinc-100
            bg-zinc-50/70
            p-4
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
            Service
          </p>

          <p className="mt-1 text-sm font-medium text-zinc-800">
            {serviceName}
          </p>

          {order.service?.category && (
            <p className="mt-1 text-xs text-zinc-400">
              {order.service.category}
            </p>
          )}
        </div>

        {/* Details */}

        <div
          className="
            mt-5
            grid
            grid-cols-2
            gap-x-5
            gap-y-5
            border-t
            border-zinc-100
            pt-5
          "
        >
          <MobileDetail
            label="Quantity"
            value={formatQuantity(order.quantity)}
          />

          <MobileDetail label="Amount" value={formatCurrency(order.amount)} />

          <MobileDetail
            label="Payment"
            value={formatStatus(order.paymentMethod)}
          />

          <MobileDetail
            label="Payment Status"
            value={paymentDone ? "Paid" : formatStatus(order.paymentStatus)}
            paymentDone={paymentDone}
          />

          <MobileDetail
            label="Order Status"
            value={formatStatus(order.orderStatus)}
          />

          <MobileDetail label="Date" value={formatDate(order.createdAt)} />
        </div>

        {/* View Order */}

        <Link
          to={`/dashboard/orders/${order._id || order.id}`}
          className="
            group/button
            mt-6
            inline-flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-zinc-900
            bg-zinc-900
            px-5
            py-3
            text-sm
            font-medium
            text-white
            shadow-sm
            transition-[transform,background-color,box-shadow]
            duration-300
            ease-out
            hover:scale-[1.01]
            hover:bg-zinc-800
            hover:text-white
            hover:shadow-md
            active:scale-[0.99]
          "
        >
          View Order
          <ArrowRight
            size={16}
            className="
              text-white
              transition-transform
              duration-300
              ease-out
              group-hover/button:translate-x-0.5
            "
          />
        </Link>
      </div>
    </div>
  );
};

/* ============================================================
   MOBILE DETAIL
============================================================ */

const MobileDetail = ({ label, value, paymentDone = false }) => {
  return (
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
        {label}
      </p>

      <p
        className={`
          mt-1
          truncate
          text-sm
          ${paymentDone ? "font-medium text-emerald-600" : "text-zinc-600"}
        `}
      >
        {value || "—"}
      </p>
    </div>
  );
};

/* ============================================================
   ORDER STATUS BADGE
============================================================ */

const StatusBadge = ({ status }) => {
  const normalizedStatus = status || "unknown";

  const statusStyles = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",

    processing: "border-blue-200 bg-blue-50 text-blue-700",

    in_progress: "border-blue-200 bg-blue-50 text-blue-700",

    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",

    cancelled: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`
        inline-flex
        shrink-0
        rounded-full
        border
        px-3
        py-1.5
        text-[11px]
        font-medium
        ${
          statusStyles[normalizedStatus] ||
          "border-zinc-200 bg-zinc-50 text-zinc-600"
        }
      `}
    >
      {formatStatus(normalizedStatus)}
    </span>
  );
};

/* ============================================================
   PAYMENT STATUS BADGE
============================================================ */

const PaymentStatusBadge = ({ status }) => {
  const normalizedStatus = status || "unknown";

  const statusStyles = {
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700",

    collected: "border-emerald-200 bg-emerald-50 text-emerald-700",

    pending: "border-amber-200 bg-amber-50 text-amber-700",

    processing: "border-blue-200 bg-blue-50 text-blue-700",

    failed: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`
        inline-flex
        rounded-full
        border
        px-3
        py-1.5
        text-[11px]
        font-medium
        ${
          statusStyles[normalizedStatus] ||
          "border-zinc-200 bg-zinc-50 text-zinc-600"
        }
      `}
    >
      {formatStatus(normalizedStatus)}
    </span>
  );
};

/* ============================================================
   EMPTY STATE
============================================================ */

const EmptyOrders = () => {
  return (
    <div
      className="
        relative
        flex
        min-h-[430px]
        flex-col
        items-center
        justify-center
        overflow-hidden
        rounded-[28px]
        border border-zinc-200
        bg-white
        px-6
        text-center
        shadow-[0_20px_80px_rgba(0,0,0,0.05)]
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-24
          -top-24
          h-64
          w-64
          rounded-full
          bg-cyan-300/[0.025]
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
          "
        >
          <ClipboardList
            size={22}
            strokeWidth={1.5}
            className="text-zinc-400"
          />
        </div>

        <p
          className="
            mt-6
            text-xs
            font-medium
            uppercase
            tracking-[0.2em]
            text-zinc-400
          "
        >
          Nothing here yet
        </p>

        <h2 className="mt-2 text-xl font-medium text-zinc-900">
          No orders yet
        </h2>

        <p
          className="
            mx-auto
            mt-3
            max-w-sm
            text-sm
            leading-6
            text-zinc-500
          "
        >
          Once you place your first service order, it will appear here.
        </p>

        <Link
          to="/dashboard/new-order"
          className="
            group
            mt-7
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-zinc-900
            px-5
            py-3
            text-sm
            font-medium
            text-white
            shadow-sm
            transition
            duration-200
            hover:-translate-y-0.5
            hover:bg-zinc-800
            hover:shadow-md
          "
        >
          Create New Order
          <ArrowRight
            size={16}
            className="
              transition-transform
              duration-200
              group-hover:translate-x-1
            "
          />
        </Link>
      </div>
    </div>
  );
};

/* ============================================================
   HELPERS
============================================================ */

const getServiceName = (order) => {
  return order?.service?.name || order?.serviceSnapshot?.name || "Service";
};

const formatCurrency = (amount) => {
  const value = Number(amount || 0);

  return `₹${value.toLocaleString("en-IN")}`;
};

const formatQuantity = (quantity) => {
  const value = Number(quantity);

  if (!Number.isFinite(value) || value < 1) {
    return "—";
  }

  return value.toLocaleString("en-IN");
};

const isPaymentCompleted = (order) => {
  return (
    order?.paymentStatus === "paid" ||
    order?.paymentStatus === "collected" ||
    order?.codPinStatus === "verified" ||
    order?.codPinStatus === "used"
  );
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default OrderHistory;
