import { useEffect, useMemo, useState } from "react";

import {
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import codService from "../../services/codService";
import CustomSelect from "../../components/CustomSelect";

const CodManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await codService.getAdminCodOrders();

      setOrders(response.orders || []);
    } catch (error) {
      console.error("Load COD orders error:", error);

      setError(error.response?.data?.message || "Unable to load COD orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const clientName = order.client?.name?.toLowerCase() || "";

      const clientEmail = order.client?.email?.toLowerCase() || "";

      const username = order.client?.username?.toLowerCase() || "";

      const orderNumber = order.orderNumber?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        orderNumber.includes(query) ||
        clientName.includes(query) ||
        clientEmail.includes(query) ||
        username.includes(query);

      let matchesFilter = true;

      switch (filter) {
        case "pending":
          matchesFilter = order.paymentStatus !== "collected";
          break;

        case "active":
          matchesFilter = order.codPinStatus === "active";
          break;

        case "collected":
          matchesFilter = order.paymentStatus === "collected";
          break;

        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter]);

  const stats = useMemo(() => {
    return {
      total: orders.length,

      pending: orders.filter((order) => order.paymentStatus !== "collected")
        .length,

      active: orders.filter((order) => order.codPinStatus === "active").length,

      collected: orders.filter((order) => order.paymentStatus === "collected")
        .length,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <Loader2 size={18} className="animate-spin" />
          Loading COD orders...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/[0.035] blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <KeyRound size={18} className="text-white/60" />
              </div>

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">
                Payments
              </p>
            </div>

            <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
              COD Payments
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/40">
              Generate COD payment PINs, monitor verification status and track
              completed cash payments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 lg:self-center"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-300">{error}</p>

          <button
            type="button"
            onClick={() => loadOrders(true)}
            className="self-start text-sm text-red-200 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {/* =====================================================
          STATS
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={KeyRound}
          label="Total COD Orders"
          value={stats.total}
        />

        <StatCard icon={Clock3} label="Payment Pending" value={stats.pending} />

        <StatCard icon={ShieldCheck} label="PIN Active" value={stats.active} />

        <StatCard
          icon={CheckCircle2}
          label="Payment Done"
          value={stats.collected}
        />
      </div>

      {/* =====================================================
    FILTERS
====================================================== */}
      <div className="rounded-2xl border border-white/10 bg-[#111111] p-4 sm:p-5">
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
          text-white/25
        "
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, name, email or username..."
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

          {/* Filter */}
          <div className="w-full lg:w-[208px] lg:shrink-0">
            <CustomSelect
              value={filter}
              onChange={setFilter}
              options={[
                {
                  value: "all",
                  label: "All COD Orders",
                },
                {
                  value: "pending",
                  label: "Payment Pending",
                },
                {
                  value: "active",
                  label: "PIN Active",
                },
                {
                  value: "collected",
                  label: "Payment Done",
                },
              ]}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4">
          <p className="text-xs text-white/35">
            Showing{" "}
            <span className="text-white/60">{filteredOrders.length}</span> of{" "}
            <span className="text-white/60">{orders.length}</span> COD orders
          </p>

          {(search || filter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
              className="text-xs text-white/40 transition hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          ORDERS
      ====================================================== */}

      {filteredOrders.length === 0 ? (
        <div className="rounded-[24px] border border-white/10 bg-[#111111] p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
            <KeyRound size={22} className="text-white/35" />
          </div>

          <h2 className="mt-5 text-lg font-medium">No COD orders found</h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/35">
            {search || filter !== "all"
              ? "Try changing your search or filter."
              : "COD orders will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <CodOrderCard
              key={order._id || order.id}
              order={order}
              onUpdated={loadOrders}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   COD ORDER CARD
========================================================= */

const CodOrderCard = ({ order, onUpdated }) => {
  const [pin, setPin] = useState(order.codPin || "");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [copied, setCopied] = useState(false);

  const isCollected = order.paymentStatus === "collected";

  const isPinActive = order.codPinStatus === "active";

  const canGenerate = !isCollected && !isPinActive;

  const generatePin = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await codService.generateCodPin(order._id || order.id);

      setPin(response.codPin);

      setMessage(
        "COD PIN generated successfully. Share this PIN with the payment collector.",
      );

      if (onUpdated) {
        setTimeout(() => {
          onUpdated();
        }, 500);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Unable to generate PIN.");
    } finally {
      setLoading(false);
    }
  };

  const copyPin = async () => {
    if (!pin) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pin);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Copy PIN error:", error);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-6">
      {/* =====================================================
          TOP
      ====================================================== */}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        {/* Order */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.15em] text-white/30">
              Order
            </p>

            <PaymentBadge status={order.paymentStatus} />

            <PinStatusBadge status={order.codPinStatus} />
          </div>

          <p className="mt-2 text-lg font-medium">{order.orderNumber}</p>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/40">
            <span>
              Amount: ₹{Number(order.amount || 0).toLocaleString("en-IN")}
            </span>

            <span>Created: {formatDateTime(order.createdAt)}</span>
          </div>
        </div>

        {/* Generate / PIN */}
        <div className="w-full xl:w-auto">
          {isCollected ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm font-medium text-emerald-300">
              <CheckCircle2 size={17} />
              Payment Done
            </div>
          ) : pin ? (
            <PinDisplay pin={pin} copied={copied} onCopy={copyPin} />
          ) : isPinActive ? (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-300">
              PIN Active
            </div>
          ) : canGenerate ? (
            <button
              type="button"
              onClick={generatePin}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
            >
              <KeyRound size={17} />

              {loading ? "Generating..." : "Generate PIN"}
            </button>
          ) : null}
        </div>
      </div>

      {/* =====================================================
          CLIENT
      ====================================================== */}

      {order.client && (
        <div className="mt-6 border-t border-white/[0.07] pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
              <UserRound size={16} className="text-white/45" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-white/30">Client</p>

              <p className="mt-0.5 truncate text-sm font-medium text-white/75">
                {order.client.name || order.client.username || "Unknown Client"}
              </p>
            </div>

            {order.client.email && (
              <span className="hidden truncate text-xs text-white/30 sm:block">
                {order.client.email}
              </span>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          TIMESTAMPS
      ====================================================== */}

      <div className="mt-5 grid gap-3 border-t border-white/[0.07] pt-5 sm:grid-cols-2 lg:grid-cols-3">
        <InfoItem
          label="PIN Generated"
          value={
            order.codPinStatus !== "not_generated" && order.codPinStatus
              ? formatDateTime(order.updatedAt)
              : "Not generated"
          }
        />

        <InfoItem
          label="PIN Verified"
          value={
            order.codPinVerifiedAt
              ? formatDateTime(order.codPinVerifiedAt)
              : "Not verified"
          }
        />

        <InfoItem
          label="Payment Collected"
          value={
            order.codCollectedAt
              ? formatDateTime(order.codCollectedAt)
              : "Not collected"
          }
        />
      </div>

      {/* =====================================================
          STATUS SUMMARY
      ====================================================== */}

      <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-white/30">COD Payment Status</p>

            <p className="mt-1 text-sm font-medium">
              {isCollected ? "Payment Done" : "Payment Pending"}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-white/30">PIN Status</p>

            <p className="mt-1 text-sm font-medium">
              {formatPinStatus(order.codPinStatus)}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          MESSAGES
      ====================================================== */}

      {message && (
        <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   PIN DISPLAY
========================================================= */

const PinDisplay = ({ pin, copied, onCopy }) => {
  return (
    <div>
      <p className="mb-2 text-xs text-white/40">COD PIN</p>

      <div className="flex items-center gap-2">
        <div className="rounded-xl border border-white/10 bg-black px-5 py-3 font-mono text-lg tracking-[0.25em]">
          {pin}
        </div>

        <button
          type="button"
          onClick={onCopy}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:bg-white/10 hover:text-white"
          title="Copy PIN"
          aria-label="Copy COD PIN"
        >
          {copied ? <Check size={17} /> : <Copy size={17} />}
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({ icon: Icon, label, value }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <Icon size={18} className="text-white/50" />
        </div>

        <span className="text-2xl font-medium">{value}</span>
      </div>

      <p className="mt-5 text-sm text-white/55">{label}</p>
    </div>
  );
};

/* =========================================================
   PAYMENT BADGE
========================================================= */

const PaymentBadge = ({ status }) => {
  const collected = status === "collected";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
        collected
          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
          : "border-amber-400/20 bg-amber-400/[0.08] text-amber-300"
      }`}
    >
      {collected ? <CheckCircle2 size={11} /> : <Clock3 size={11} />}

      {collected ? "Payment Done" : "Payment Pending"}
    </span>
  );
};

/* =========================================================
   PIN STATUS BADGE
========================================================= */

const PinStatusBadge = ({ status }) => {
  const config = {
    not_generated: {
      label: "PIN Not Generated",
      className: "border-white/10 bg-white/[0.04] text-white/40",
      icon: XCircle,
    },

    active: {
      label: "PIN Active",
      className: "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
      icon: KeyRound,
    },

    verified: {
      label: "PIN Verified",
      className: "border-blue-400/20 bg-blue-400/[0.08] text-blue-300",
      icon: ShieldCheck,
    },

    used: {
      label: "PIN Used",
      className: "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300",
      icon: CheckCircle2,
    },

    expired: {
      label: "PIN Expired",
      className: "border-red-400/20 bg-red-400/[0.08] text-red-300",
      icon: XCircle,
    },
  };

  const current = config[status] || config.not_generated;

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${current.className}`}
    >
      <Icon size={11} />

      {current.label}
    </span>
  );
};

/* =========================================================
   INFO ITEM
========================================================= */

const InfoItem = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/25">
        {label}
      </p>

      <p className="mt-1.5 text-xs text-white/55">{value}</p>
    </div>
  );
};

/* =========================================================
   HELPERS
========================================================= */

const formatPinStatus = (status) => {
  switch (status) {
    case "not_generated":
      return "Not Generated";

    case "active":
      return "Active";

    case "verified":
      return "Verified";

    case "used":
      return "Used";

    case "expired":
      return "Expired";

    default:
      return "Unknown";
  }
};

const formatDateTime = (date) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default CodManagement;
