import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
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

      const data = await adminOrderService.getAdminOrders();

      setOrders(data.orders || []);
    } catch (error) {
      console.error("Get admin orders error:", error);

      setError(error.response?.data?.message || "Unable to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const searchValue = search.trim().toLowerCase();

    const matchesSearch =
      !searchValue ||
      order.orderNumber?.toLowerCase().includes(searchValue) ||
      order.client?.name?.toLowerCase().includes(searchValue) ||
      order.client?.email?.toLowerCase().includes(searchValue) ||
      order.serviceSnapshot?.name?.toLowerCase().includes(searchValue) ||
      order.service?.name?.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "all" || order.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-[1500px]">
      {/* Page Header */}
      <div className="relative mb-8 overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/[0.035] blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 -left-20 h-56 w-56 rounded-full bg-white/[0.02] blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <ClipboardList
                size={18}
                strokeWidth={1.6}
                className="text-white/60"
              />
            </div>

            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">
              Orders
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
                All Orders
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/40 sm:text-base">
                Manage client orders, payments and project status from one
                place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadOrders(true)}
              disabled={loading || refreshing}
              className="group inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60 transition duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : "transition-transform duration-500 group-hover:rotate-180"
                }
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-300">{error}</p>

          <button
            type="button"
            onClick={() => loadOrders()}
            className="self-start text-sm text-red-200 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-[#111111] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
          text-white/30
        "
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search orders, clients or services..."
              className="
          h-[50px]
          w-full
          rounded-xl
          border
          border-white/10
          bg-white/[0.03]
          pl-11
          pr-4
          text-sm
          text-white
          outline-none
          transition
          placeholder:text-white/25
          focus:border-white/25
          focus:bg-white/[0.05]
        "
            />
          </div>

          {/* Status */}
          <div className="w-full lg:w-[220px] lg:shrink-0">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
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
      </div>

      {/* Result Count */}
      {!loading && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-white/35">
            Showing{" "}
            <span className="text-white/65">{filteredOrders.length}</span>{" "}
            {filteredOrders.length === 1 ? "order" : "orders"}
          </p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center rounded-[24px] border border-white/10 bg-[#111111]">
          <div className="flex items-center gap-3 text-sm text-white/40">
            <Loader2 size={18} className="animate-spin" />
            Loading orders...
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyOrders
          hasFilters={Boolean(search.trim()) || statusFilter !== "all"}
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-[24px] border border-white/10 bg-[#111111] md:block">
            <div className="grid grid-cols-[1.25fr_1.25fr_1.2fr_0.8fr_0.9fr_0.9fr_56px] border-b border-white/10 px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white/30">
              <span>Order</span>
              <span>Client</span>
              <span>Service</span>
              <span>Amount</span>
              <span>Payment</span>
              <span>Status</span>
              <span />
            </div>

            <div>
              {filteredOrders.map((order) => (
                <AdminOrderRow key={order._id} order={order} />
              ))}
            </div>
          </div>

          {/* Mobile */}
          <div className="space-y-3 md:hidden">
            {filteredOrders.map((order) => (
              <AdminOrderMobileCard key={order._id} order={order} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Desktop Order Row
|--------------------------------------------------------------------------
*/

const AdminOrderRow = ({ order }) => {
  const serviceName =
    order.serviceSnapshot?.name || order.service?.name || "Service";

  const clientName =
    order.client?.name || order.client?.username || "Unknown Client";

  return (
    <Link
      to={`/admin/orders/${order._id}`}
      className="grid grid-cols-[1.25fr_1.25fr_1.2fr_0.8fr_0.9fr_0.9fr_56px] items-center border-b border-white/[0.07] px-6 py-5 transition duration-300 last:border-b-0 hover:bg-white/[0.025]"
    >
      {/* Order */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {order.orderNumber}
        </p>

        <p className="mt-1 text-xs text-white/30">
          {formatDate(order.createdAt)}
        </p>
      </div>

      {/* Client */}
      <div className="min-w-0">
        <p className="truncate text-sm text-white/70">{clientName}</p>

        <p className="mt-1 truncate text-xs text-white/30">
          {order.client?.email || "—"}
        </p>
      </div>

      {/* Service */}
      <p className="truncate pr-4 text-sm text-white/60">{serviceName}</p>

      {/* Amount */}
      <p className="text-sm font-medium text-white">
        ₹{Number(order.amount || 0).toLocaleString("en-IN")}
      </p>

      {/* Payment */}
      <div>
        <PaymentBadge
          method={order.paymentMethod}
          status={order.paymentStatus}
        />
      </div>

      {/* Order Status */}
      <div>
        <StatusBadge status={order.orderStatus} />
      </div>

      {/* Arrow */}
      <div className="flex justify-end">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/35 transition duration-300 group-hover:border-white/20 group-hover:bg-white/[0.05] group-hover:text-white">
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
};

/*
|--------------------------------------------------------------------------
| Mobile Order Card
|--------------------------------------------------------------------------
*/

const AdminOrderMobileCard = ({ order }) => {
  const serviceName =
    order.serviceSnapshot?.name || order.service?.name || "Service";

  const clientName =
    order.client?.name || order.client?.username || "Unknown Client";

  return (
    <Link
      to={`/admin/orders/${order._id}`}
      className="group block rounded-2xl border border-white/10 bg-[#111111] p-5 transition duration-300 hover:border-white/20 hover:bg-[#141414]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{order.orderNumber}</p>

          <p className="mt-1 text-xs text-white/30">
            {formatDate(order.createdAt)}
          </p>
        </div>

        <StatusBadge status={order.orderStatus} />
      </div>

      <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
            Client
          </p>

          <p className="mt-1 text-sm text-white/70">{clientName}</p>

          {order.client?.email && (
            <p className="mt-1 truncate text-xs text-white/30">
              {order.client.email}
            </p>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
            Service
          </p>

          <p className="mt-1 text-sm text-white/70">{serviceName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
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

            <div className="mt-1">
              <PaymentBadge
                method={order.paymentMethod}
                status={order.paymentStatus}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-xs text-white/35">View order details</span>

        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 transition group-hover:border-white/20 group-hover:bg-white/[0.05] group-hover:text-white">
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
};

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

const StatusBadge = ({ status }) => {
  const config = {
    pending: {
      label: "Pending",
      className: "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
    },

    processing: {
      label: "Processing",
      className: "border-blue-400/20 bg-blue-400/[0.08] text-blue-300",
    },

    in_progress: {
      label: "In Progress",
      className: "border-purple-400/20 bg-purple-400/[0.08] text-purple-300",
    },

    completed: {
      label: "Completed",
      className: "border-green-400/20 bg-green-400/[0.08] text-green-300",
    },

    cancelled: {
      label: "Cancelled",
      className: "border-red-400/20 bg-red-400/[0.08] text-red-300",
    },
  };

  const current = config[status] || {
    label: formatStatus(status),
    className: "border-white/10 bg-white/[0.04] text-white/50",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium ${current.className}`}
    >
      {current.label}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| Payment Badge
|--------------------------------------------------------------------------
*/

const PaymentBadge = ({ method, status }) => {
  const methodLabel =
    method === "cod"
      ? "COD"
      : method === "online"
        ? "Online"
        : formatStatus(method);

  const statusLabel = formatStatus(status);

  return (
    <div>
      <p className="text-xs text-white/60">{methodLabel}</p>

      <p
        className={`mt-0.5 text-[10px] ${
          status === "paid" || status === "collected"
            ? "text-green-300/70"
            : "text-white/30"
        }`}
      >
        {statusLabel}
      </p>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

const EmptyOrders = ({ hasFilters }) => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[24px] border border-white/10 bg-[#111111] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
        <ClipboardList size={22} className="text-white/40" />
      </div>

      <h2 className="mt-5 text-lg font-medium">
        {hasFilters ? "No matching orders" : "No orders yet"}
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
        {hasFilters
          ? "Try changing your search or status filter."
          : "Orders placed by clients will appear here."}
      </p>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

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

const formatStatus = (status) => {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default AdminOrders;
