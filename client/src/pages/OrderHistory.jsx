import { useEffect, useState } from "react";

import {
  ArrowRight,
  ClipboardList,
  Loader2,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

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

      setOrders(data.orders || []);
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
    <div className="mx-auto max-w-[1500px]">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="
        flex h-9 w-9
        items-center justify-center
        rounded-xl
        border border-white/10
        bg-white/[0.04]
        text-white/60
      "
          >
            <ArrowRight size={17} strokeWidth={1.7} />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
              Orders
            </p>

            <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
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
      border border-white/10
      bg-white/[0.03]
      px-4
      py-2.5
      text-sm
      text-white/60
      transition
      duration-300
      hover:border-white/20
      hover:bg-white/[0.07]
      hover:text-white
      disabled:cursor-not-allowed
      disabled:opacity-50
      sm:self-auto
    "
        >
          <RefreshCw
            size={16}
            className={`transition-transform duration-500 ${
              loading ? "animate-spin" : "group-hover:rotate-180"
            }`}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-red-200">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-300/70">{error}</p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="self-start text-sm text-red-200 underline underline-offset-4 transition hover:text-white"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="relative flex min-h-[400px] items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-[#111111]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/[0.025] blur-3xl" />

          <div className="relative flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <Loader2 size={19} className="animate-spin text-white/60" />
            </div>

            <div>
              <p className="text-sm font-medium text-white/70">
                Loading orders
              </p>

              <p className="mt-1 text-xs text-white/30">
                Fetching your latest orders...
              </p>
            </div>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] shadow-[0_20px_80px_rgba(0,0,0,0.18)] md:block">
            {/* Table Header */}
            <div className="grid grid-cols-[1.4fr_1.2fr_1fr_1fr_1fr_70px] border-b border-white/10 bg-white/[0.015] px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white/30">
              <span>Order</span>
              <span>Service</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Order Status</span>
              <span />
            </div>

            {/* Table Rows */}
            <div>
              {orders.map((order) => (
                <OrderTableRow key={order._id} order={order} />
              ))}
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 md:hidden">
            {orders.map((order) => (
              <OrderMobileCard key={order._id} order={order} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* -------------------------------- */
/* Desktop Order Row */
/* -------------------------------- */

const OrderTableRow = ({ order }) => {
  const serviceName =
    order.serviceSnapshot?.name || order.service?.name || "Service";

  return (
    <div className="group grid grid-cols-[1.4fr_1.2fr_1fr_1fr_1fr_70px] items-center border-b border-white/[0.07] px-6 py-5 transition duration-300 last:border-b-0 hover:bg-white/[0.025]">
      {/* Order */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {order.orderNumber}
        </p>

        <p className="mt-1 text-xs text-white/30">
          {formatDate(order.createdAt)}
        </p>
      </div>

      {/* Service */}
      <p className="truncate text-sm text-white/65">{serviceName}</p>

      {/* Date */}
      <p className="text-sm text-white/50">{formatDate(order.createdAt)}</p>

      {/* Amount */}
      <p className="text-sm font-medium text-white/85">
        ₹{Number(order.amount || 0).toLocaleString("en-IN")}
      </p>

      {/* Status */}
      <div>
        <StatusBadge status={order.orderStatus} />
      </div>

      {/* View */}
      <Link
        to={`/dashboard/orders/${order._id}`}
        className="group/button flex h-9 w-9 items-center justify-center justify-self-end rounded-xl border border-white/10 bg-white/[0.02] text-white/40 transition duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
        aria-label={`View ${order.orderNumber}`}
      >
        <ArrowRight
          size={16}
          className="transition-transform duration-300 group-hover/button:translate-x-0.5"
        />
      </Link>
    </div>
  );
};

/* -------------------------------- */
/* Mobile Order Card */
/* -------------------------------- */

const OrderMobileCard = ({ order }) => {
  const serviceName =
    order.serviceSnapshot?.name || order.service?.name || "Service";

  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[#111111] p-5 transition duration-300 hover:border-white/[0.18] hover:bg-[#121212]">
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/[0.025] blur-3xl" />

      <div className="relative">
        {/* Top */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{order.orderNumber}</p>

            <p className="mt-1 text-xs text-white/35">
              {formatDate(order.createdAt)}
            </p>
          </div>

          <StatusBadge status={order.orderStatus} />
        </div>

        {/* Details */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
          <MobileDetail label="Service" value={serviceName} />

          <MobileDetail
            label="Amount"
            value={`₹${Number(order.amount || 0).toLocaleString("en-IN")}`}
          />

          <MobileDetail
            label="Payment"
            value={formatStatus(order.paymentMethod)}
          />

          <MobileDetail
            label="Payment Status"
            value={formatStatus(order.paymentStatus)}
          />
        </div>

        {/* View */}
        <Link
          to={`/dashboard/orders/${order._id}`}
          className="group/button mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-3 text-sm text-white/65 transition duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          View Order
          <ArrowRight
            size={16}
            className="transition-transform duration-300 group-hover/button:translate-x-1"
          />
        </Link>
      </div>
    </div>
  );
};

/* -------------------------------- */
/* Mobile Detail */
/* -------------------------------- */

const MobileDetail = ({ label, value }) => {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/30">
        {label}
      </p>

      <p className="mt-1 truncate text-sm text-white/70">{value || "—"}</p>
    </div>
  );
};

/* -------------------------------- */
/* Status Badge */
/* -------------------------------- */

const StatusBadge = ({ status }) => {
  const normalizedStatus = status || "unknown";

  const statusStyles = {
    pending: "border-amber-400/20 bg-amber-400/[0.07] text-amber-200",

    in_progress: "border-blue-400/20 bg-blue-400/[0.07] text-blue-200",

    completed: "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200",

    cancelled: "border-red-400/20 bg-red-400/[0.07] text-red-200",

    rejected: "border-red-400/20 bg-red-400/[0.07] text-red-200",
  };

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium ${
        statusStyles[normalizedStatus] ||
        "border-white/10 bg-white/[0.04] text-white/60"
      }`}
    >
      {formatStatus(normalizedStatus)}
    </span>
  );
};

/* -------------------------------- */
/* Empty State */
/* -------------------------------- */

const EmptyOrders = () => {
  return (
    <div className="relative flex min-h-[430px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] px-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
      {/* Background glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/[0.025] blur-3xl" />

      <div className="relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
          <ClipboardList
            size={22}
            strokeWidth={1.5}
            className="text-white/40"
          />
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-white/30">
          Nothing here yet
        </p>

        <h2 className="mt-2 text-xl font-medium">No orders yet</h2>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/40">
          Once you place your first content order, it will appear here.
        </p>

        <Link
          to="/dashboard/new-order"
          className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_8px_30px_rgba(255,255,255,0.08)]"
        >
          Create New Order
          <ArrowRight
            size={16}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>
    </div>
  );
};

/* -------------------------------- */
/* Helpers */
/* -------------------------------- */

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default OrderHistory;
