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
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState("all");

  const loadOrders = async (
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await codService.getAdminCodOrders();

      setOrders(
        response.orders || []
      );
    } catch (error) {
      console.error(
        "Load COD orders error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load COD orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return orders.filter((order) => {
      const clientName =
        order.client?.name?.toLowerCase() ||
        "";

      const clientEmail =
        order.client?.email?.toLowerCase() ||
        "";

      const username =
        order.client?.username?.toLowerCase() ||
        "";

      const orderNumber =
        order.orderNumber?.toLowerCase() ||
        "";

      const matchesSearch =
        !query ||
        orderNumber.includes(query) ||
        clientName.includes(query) ||
        clientEmail.includes(query) ||
        username.includes(query);

      let matchesFilter = true;

      switch (filter) {
        case "pending":
          matchesFilter =
            order.paymentStatus !==
            "collected";
          break;

        case "active":
          matchesFilter =
            order.codPinStatus ===
            "active";
          break;

        case "collected":
          matchesFilter =
            order.paymentStatus ===
            "collected";
          break;

        default:
          matchesFilter = true;
      }

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [
    orders,
    search,
    filter,
  ]);

  const stats = useMemo(() => {
    return {
      total: orders.length,

      pending: orders.filter(
        (order) =>
          order.paymentStatus !==
          "collected"
      ).length,

      active: orders.filter(
        (order) =>
          order.codPinStatus ===
          "active"
      ).length,

      collected: orders.filter(
        (order) =>
          order.paymentStatus ===
          "collected"
      ).length,
    };
  }, [orders]);

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[300px]
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
              Loading COD orders
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Fetching payment information...
            </p>
          </div>
        </div>
      </div>
    );
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
          HEADER
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
                  transition
                  duration-200
                  group-hover:border-zinc-300
                  group-hover:bg-white
                  group-hover:text-zinc-800
                "
              >
                <KeyRound
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
                Payments
              </p>
            </div>

            <h1
              className="
                mt-5
                text-3xl
                font-medium
                tracking-tight
                text-zinc-900
                sm:text-4xl
              "
            >
              COD Payments
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
              Generate COD payment PINs,
              monitor verification status
              and track completed cash
              payments.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadOrders(true)
            }
            disabled={refreshing}
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
              font-medium
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
              lg:self-center
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
              loadOrders(true)
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
          STATS
      ====================================================== */}

      <div
        className="
          mb-6
          grid
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <StatCard
          icon={KeyRound}
          label="Total COD Orders"
          value={stats.total}
        />

        <StatCard
          icon={Clock3}
          label="Payment Pending"
          value={stats.pending}
        />

        <StatCard
          icon={ShieldCheck}
          label="PIN Active"
          value={stats.active}
        />

        <StatCard
          icon={CheckCircle2}
          label="Payment Done"
          value={stats.collected}
        />
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <section
        className="
          mb-5
          rounded-2xl
          border border-zinc-200
          bg-white
          p-4
          shadow-[0_10px_35px_rgba(0,0,0,0.04)]
          sm:p-5
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
              strokeWidth={1.7}
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
              placeholder="Search order, name, email or username..."
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

          {/* Filter */}

          <div
            className="
              w-full
              lg:w-[208px]
              lg:shrink-0
            "
          >
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

        <div
          className="
            mt-4
            flex
            items-center
            justify-between
            border-t
            border-zinc-100
            pt-4
          "
        >
          <p className="text-xs text-zinc-400">
            Showing{" "}
            <span className="font-medium text-zinc-700">
              {filteredOrders.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-zinc-700">
              {orders.length}
            </span>{" "}
            COD orders
          </p>

          {(search ||
            filter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
              className="
                text-xs
                font-medium
                text-zinc-400
                transition
                hover:text-zinc-900
              "
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* =====================================================
          ORDERS
      ====================================================== */}

      {filteredOrders.length ===
      0 ? (
        <div
          className="
            relative
            overflow-hidden
            rounded-[24px]
            border border-zinc-200
            bg-white
            p-10
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
              <KeyRound
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
              No COD orders found
            </h2>

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
              {search ||
              filter !== "all"
                ? "Try changing your search or filter."
                : "COD orders will appear here."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(
            (order) => (
              <CodOrderCard
                key={
                  order._id ||
                  order.id
                }
                order={order}
                onUpdated={
                  loadOrders
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   COD ORDER CARD
========================================================= */

const CodOrderCard = ({
  order,
  onUpdated,
}) => {
  const [pin, setPin] =
    useState(
      order.codPin || ""
    );

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const isCollected =
    order.paymentStatus ===
    "collected";

  const isPinActive =
    order.codPinStatus ===
    "active";

  const canGenerate =
    !isCollected &&
    !isPinActive;

  const generatePin =
    async () => {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const response =
          await codService.generateCodPin(
            order._id ||
              order.id
          );

        setPin(
          response.codPin
        );

        setMessage(
          "COD PIN generated successfully. Share this PIN with the payment collector."
        );

        if (onUpdated) {
          setTimeout(() => {
            onUpdated();
          }, 500);
        }
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Unable to generate PIN."
        );
      } finally {
        setLoading(false);
      }
    };

  const copyPin =
    async () => {
      if (!pin) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          pin
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 1500);
      } catch (error) {
        console.error(
          "Copy PIN error:",
          error
        );
      }
    };

  return (
    <section
      className="
        group
        relative
        overflow-hidden
        rounded-[24px]
        border border-zinc-200
        bg-white
        p-5
        shadow-[0_12px_45px_rgba(0,0,0,0.04)]
        transition-all
        duration-300
        hover:border-zinc-300
        hover:shadow-[0_18px_60px_rgba(0,0,0,0.06)]
        sm:p-6
      "
    >
      {/* Decorative glow */}

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
          opacity-0
          transition
          duration-500
          group-hover:opacity-100
        "
      />

      {/* =====================================================
          TOP
      ====================================================== */}

      <div
        className="
          relative
          flex
          flex-col
          gap-6
          xl:flex-row
          xl:items-start
          xl:justify-between
        "
      >
        {/* Order */}

        <div className="min-w-0">
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
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
              Order
            </p>

            <PaymentBadge
              status={
                order.paymentStatus
              }
            />

            <PinStatusBadge
              status={
                order.codPinStatus
              }
            />
          </div>

          <p
            className="
              mt-2
              text-lg
              font-medium
              text-zinc-900
            "
          >
            {order.orderNumber}
          </p>

          <div
            className="
              mt-3
              flex
              flex-wrap
              gap-x-5
              gap-y-2
              text-sm
              text-zinc-400
            "
          >
            <span>
              Amount: ₹
              {Number(
                order.amount || 0
              ).toLocaleString(
                "en-IN"
              )}
            </span>

            <span>
              Created:{" "}
              {formatDateTime(
                order.createdAt
              )}
            </span>
          </div>
        </div>

        {/* Generate / PIN */}

        <div className="w-full xl:w-auto">
          {isCollected ? (
            <div
              className="
                flex
                items-center
                gap-2
                rounded-xl
                border border-emerald-200
                bg-emerald-50
                px-4
                py-3
                text-sm
                font-medium
                text-emerald-700
              "
            >
              <CheckCircle2
                size={17}
              />

              Payment Done
            </div>
          ) : pin ? (
            <PinDisplay
              pin={pin}
              copied={copied}
              onCopy={copyPin}
            />
          ) : isPinActive ? (
            <div
              className="
                rounded-xl
                border border-amber-200
                bg-amber-50
                px-4
                py-3
                text-sm
                font-medium
                text-amber-700
              "
            >
              PIN Active
            </div>
          ) : canGenerate ? (
            <button
              type="button"
              onClick={
                generatePin
              }
              disabled={loading}
              className="
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-zinc-900
                px-5
                py-3
                text-sm
                font-medium
                text-white
                shadow-sm
                transition-all
                duration-200
                hover:bg-zinc-800
                hover:shadow-md
                disabled:cursor-not-allowed
                disabled:opacity-50
                xl:w-auto
              "
            >
              <KeyRound
                size={17}
              />

              {loading
                ? "Generating..."
                : "Generate PIN"}
            </button>
          ) : null}
        </div>
      </div>

      {/* =====================================================
          CLIENT
      ====================================================== */}

      {order.client && (
        <div
          className="
            relative
            mt-6
            border-t
            border-zinc-100
            pt-5
          "
        >
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-3
            "
          >
            <div
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-lg
                border border-zinc-200
                bg-zinc-50
              "
            >
              <UserRound
                size={16}
                className="text-zinc-400"
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-zinc-400">
                Client
              </p>

              <p
                className="
                  mt-0.5
                  truncate
                  text-sm
                  font-medium
                  text-zinc-800
                "
              >
                {order.client.name ||
                  order.client.username ||
                  "Unknown Client"}
              </p>
            </div>

            {order.client.email && (
              <span
                className="
                  hidden
                  truncate
                  text-xs
                  text-zinc-400
                  sm:block
                "
              >
                {order.client.email}
              </span>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          TIMESTAMPS
      ====================================================== */}

      <div
        className="
          relative
          mt-5
          grid
          gap-3
          border-t
          border-zinc-100
          pt-5
          sm:grid-cols-2
          lg:grid-cols-3
        "
      >
        <InfoItem
          label="PIN Generated"
          value={
            order.codPinStatus !==
              "not_generated" &&
            order.codPinStatus
              ? formatDateTime(
                  order.updatedAt
                )
              : "Not generated"
          }
        />

        <InfoItem
          label="PIN Verified"
          value={
            order.codPinVerifiedAt
              ? formatDateTime(
                  order.codPinVerifiedAt
                )
              : "Not verified"
          }
        />

        <InfoItem
          label="Payment Collected"
          value={
            order.codCollectedAt
              ? formatDateTime(
                  order.codCollectedAt
                )
              : "Not collected"
          }
        />
      </div>

      {/* =====================================================
          STATUS SUMMARY
      ====================================================== */}

      <div
        className="
          relative
          mt-5
          rounded-xl
          border border-zinc-100
          bg-zinc-50
          p-4
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
          <div>
            <p className="text-xs text-zinc-400">
              COD Payment Status
            </p>

            <p
              className="
                mt-1
                text-sm
                font-medium
                text-zinc-800
              "
            >
              {isCollected
                ? "Payment Done"
                : "Payment Pending"}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-zinc-400">
              PIN Status
            </p>

            <p
              className="
                mt-1
                text-sm
                font-medium
                text-zinc-800
              "
            >
              {formatPinStatus(
                order.codPinStatus
              )}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          MESSAGES
      ====================================================== */}

      {message && (
        <div
          className="
            relative
            mt-5
            rounded-xl
            border border-emerald-200
            bg-emerald-50
            px-4
            py-3
            text-sm
            text-emerald-700
          "
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="
            relative
            mt-5
            rounded-xl
            border border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-600
          "
        >
          {error}
        </div>
      )}
    </section>
  );
};

/* =========================================================
   PIN DISPLAY
========================================================= */

const PinDisplay = ({
  pin,
  copied,
  onCopy,
}) => {
  return (
    <div>
      <p
        className="
          mb-2
          text-[10px]
          font-medium
          uppercase
          tracking-[0.15em]
          text-zinc-400
        "
      >
        COD PIN
      </p>

      <div className="flex items-center gap-2">
        <div
          className="
            rounded-xl
            border border-zinc-200
            bg-zinc-50
            px-5
            py-3
            font-mono
            text-lg
            tracking-[0.25em]
            text-zinc-900
          "
        >
          {pin}
        </div>

        <button
          type="button"
          onClick={onCopy}
          className="
            flex h-11 w-11
            items-center justify-center
            rounded-xl
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
          title="Copy PIN"
          aria-label="Copy COD PIN"
        >
          {copied ? (
            <Check size={17} />
          ) : (
            <Copy size={17} />
          )}
        </button>
      </div>
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
   PAYMENT BADGE
========================================================= */

const PaymentBadge = ({
  status,
}) => {
  const collected =
    status === "collected";

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
        text-[10px]
        font-medium
        ${
          collected
            ? `
              border-emerald-200
              bg-emerald-50
              text-emerald-700
            `
            : `
              border-amber-200
              bg-amber-50
              text-amber-700
            `
        }
      `}
    >
      {collected ? (
        <CheckCircle2 size={11} />
      ) : (
        <Clock3 size={11} />
      )}

      {collected
        ? "Payment Done"
        : "Payment Pending"}
    </span>
  );
};

/* =========================================================
   PIN STATUS BADGE
========================================================= */

const PinStatusBadge = ({
  status,
}) => {
  const config = {
    not_generated: {
      label: "PIN Not Generated",
      className:
        "border-zinc-200 bg-zinc-50 text-zinc-400",
      icon: XCircle,
    },

    active: {
      label: "PIN Active",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
      icon: KeyRound,
    },

    verified: {
      label: "PIN Verified",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
      icon: ShieldCheck,
    },

    used: {
      label: "PIN Used",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    },

    expired: {
      label: "PIN Expired",
      className:
        "border-red-200 bg-red-50 text-red-600",
      icon: XCircle,
    },
  };

  const current =
    config[status] ||
    config.not_generated;

  const Icon =
    current.icon;

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
        text-[10px]
        font-medium
        ${current.className}
      `}
    >
      <Icon size={11} />

      {current.label}
    </span>
  );
};

/* =========================================================
   INFO ITEM
========================================================= */

const InfoItem = ({
  label,
  value,
}) => {
  return (
    <div
      className="
        rounded-xl
        border border-zinc-200
        bg-white
        p-3.5
        transition
        duration-200
        hover:border-zinc-300
        hover:shadow-sm
      "
    >
      <p
        className="
          text-[10px]
          font-medium
          uppercase
          tracking-[0.14em]
          text-zinc-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1.5
          text-xs
          text-zinc-500
        "
      >
        {value}
      </p>
    </div>
  );
};

/* =========================================================
   HELPERS
========================================================= */

const formatPinStatus = (
  status
) => {
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

const formatDateTime = (
  date
) => {
  if (!date) {
    return "—";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "—";
  }

  return parsedDate.toLocaleString(
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

export default CodManagement;