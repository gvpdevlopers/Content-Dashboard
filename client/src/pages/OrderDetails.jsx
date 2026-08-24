import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  KeyRound,
  Loader2,
  Package,
  ShieldCheck,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import orderService from "../services/orderService";
import codService from "../services/codService";

const OrderDetails = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* COD */
  const [codPin, setCodPin] = useState("");
  const [codLoading, setCodLoading] = useState(false);
  const [codError, setCodError] = useState("");
  const [codMessage, setCodMessage] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await orderService.getOrderById(id);

        setOrder(data.order);
      } catch (error) {
        console.error("Get order details error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load order details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadOrder();
    }
  }, [id]);

  /* -------------------------------- */
  /* COD Verification */
  /* -------------------------------- */

  const handleCodVerification = async () => {
    if (codPin.length !== 6) {
      setCodError("Please enter the 6-digit COD PIN.");
      return;
    }

    try {
      setCodLoading(true);
      setCodError("");
      setCodMessage("");

      const response = await codService.verifyCodPin(
        id,
        codPin
      );

      setCodPin("");

      /*
       * Update the order immediately in local React state.
       *
       * This supports both:
       * 1. Final backend response:
       *    paymentStatus: "collected"
       *    codPinStatus: "used"
       *
       * 2. Current temporary backend response:
       *    paymentStatus: "pending"
       *    codPinStatus: "verified"
       */

      if (response.order) {
        setOrder((currentOrder) => ({
          ...currentOrder,

          paymentStatus:
            response.order.paymentStatus ||
            "collected",

          codPinStatus:
            response.order.codPinStatus ||
            "used",

          codCollectedAt:
            response.order.codCollectedAt ||
            null,

          codPinVerifiedAt:
            response.order.codPinVerifiedAt ||
            new Date().toISOString(),
        }));
      } else {
        setOrder((currentOrder) => ({
          ...currentOrder,
          paymentStatus: "collected",
          codPinStatus: "used",
          codCollectedAt:
            new Date().toISOString(),
        }));
      }

      setCodMessage("Payment Done");
    } catch (error) {
      console.error(
        "COD verification error:",
        error
      );

      setCodError(
        error.response?.data?.message ||
          "Unable to verify COD PIN."
      );
    } finally {
      setCodLoading(false);
    }
  };

  /* -------------------------------- */
  /* Loading */
  /* -------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="
              flex h-12 w-12
              items-center justify-center
              rounded-2xl
              border border-zinc-200
              bg-white
              shadow-[0_10px_40px_rgba(0,0,0,0.06)]
            "
          >
            <Loader2
              size={19}
              className="animate-spin text-zinc-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700">
              Loading order
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Fetching order details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------- */
  /* Error */
  /* -------------------------------- */

  if (error || !order) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center text-center">
        <div>
          <div
            className="
              mx-auto
              flex h-14 w-14
              items-center
              justify-center
              rounded-2xl
              border border-red-200
              bg-red-50
            "
          >
            <Package
              size={22}
              className="text-red-500"
            />
          </div>

          <p
            className="
              mt-6
              text-xs
              font-medium
              uppercase
              tracking-[0.2em]
              text-red-400
            "
          >
            Order unavailable
          </p>

          <h1 className="mt-2 text-xl font-medium text-zinc-900">
            Unable to load order
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {error || "Order not found."}
          </p>

          <Link
            to="/dashboard/orders"
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

            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  /* -------------------------------- */
  /* Order Data */
  /* -------------------------------- */

  const serviceName =
    order.serviceSnapshot?.name ||
    order.service?.name ||
    "Service";

  const formData = order.formData || {};

  /* -------------------------------- */
  /* COD State */
  /* -------------------------------- */

  const isCodOrder =
    order.paymentMethod === "cod";

  /*
   * Treat all successful COD states as completed.
   *
   * "verified" supports your current backend.
   * "used" is the final intended backend state.
   * "collected" is the final payment state.
   */
  const isCodPaymentDone =
    order.paymentStatus === "collected" ||
    order.codPinStatus === "used" ||
    order.codPinStatus === "verified";

  const isCodPinActive =
    order.codPinStatus === "active";

  const isCodPinPending =
    order.codPinStatus === "not_generated" ||
    !order.codPinStatus;

  /*
   * If payment is already done/verified,
   * completely hide the COD verification card.
   */
  const showCodVerification =
    isCodOrder && !isCodPaymentDone;

  return (
    <div className="mx-auto max-w-[1100px] animate-fade-up">

      {/* -------------------------------- */}
      {/* Back Navigation */}
      {/* -------------------------------- */}

      <Link
        to="/dashboard/orders"
        className="
          group
          mb-6
          inline-flex
          items-center
          gap-2
          rounded-lg
          py-2
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

        Back to Order History
      </Link>

      {/* -------------------------------- */}
      {/* Main Header Card */}
      {/* -------------------------------- */}

      <div
        className="
          group
          relative
          overflow-hidden
          rounded-[28px]
          border border-zinc-200
          bg-white
          p-6
          shadow-[0_20px_80px_rgba(0,0,0,0.06)]
          transition
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
            h-72
            w-72
            rounded-full
            bg-cyan-300/[0.025]
            blur-3xl
            transition
            duration-700
            group-hover:bg-cyan-300/[0.045]
          "
        />

        <div className="relative">

          {/* Header */}

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />

                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-[0.2em]
                    text-zinc-400
                  "
                >
                  Order Details
                </p>

              </div>

              <h1
                className="
                  mt-4
                  break-all
                  text-2xl
                  font-medium
                  tracking-tight
                  text-zinc-900
                  sm:text-3xl
                "
              >
                {order.orderNumber}
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                Placed on{" "}
                {formatDateTime(order.createdAt)}
              </p>
            </div>

            <StatusBadge
              status={order.orderStatus}
            />
          </div>

          {/* Summary Cards */}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">

            <SummaryCard
              icon={Package}
              label="Service"
              value={serviceName}
            />

            <SummaryCard
              icon={CreditCard}
              label="Payment"
              value={formatStatus(
                order.paymentMethod
              )}
            />

            <SummaryCard
              icon={CalendarDays}
              label="Amount"
              value={`₹${Number(
                order.amount || 0
              ).toLocaleString("en-IN")}`}
            />

          </div>
        </div>
      </div>

      {/* -------------------------------- */}
      {/* COD Verification */}
      {/* -------------------------------- */}

      {showCodVerification && (
        <div
          className="
            group
            relative
            mt-6
            overflow-hidden
            rounded-[24px]
            border border-amber-200
            bg-white
            p-6
            shadow-[0_12px_45px_rgba(0,0,0,0.04)]
            transition
            duration-300
            hover:border-amber-300
            sm:p-7
          "
        >
          {/* Glow */}

          <div
            className="
              pointer-events-none
              absolute
              -right-16
              -top-16
              h-44
              w-44
              rounded-full
              bg-amber-200/[0.25]
              blur-3xl
              transition
              duration-700
              group-hover:bg-amber-200/[0.4]
            "
          />

          <div className="relative">

            {/* Section Header */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div className="flex items-start gap-3">

                <div
                  className="
                    flex h-10 w-10
                    shrink-0
                    items-center justify-center
                    rounded-xl
                    border border-amber-200
                    bg-amber-50
                  "
                >
                  <KeyRound
                    size={19}
                    className="text-amber-600"
                    strokeWidth={1.7}
                  />
                </div>

                <div>

                  <p
                    className="
                      text-[10px]
                      font-medium
                      uppercase
                      tracking-[0.2em]
                      text-amber-600/70
                    "
                  >
                    Cash on Delivery
                  </p>

                  <h2 className="mt-1 text-lg font-medium text-zinc-900">
                    Verify COD Payment
                  </h2>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-500">
                    Enter the 6-digit PIN provided
                    by the payment collector to
                    complete your payment.
                  </p>

                </div>
              </div>
            </div>

            {/* -------------------------------- */}
            {/* PIN Not Generated */}
            {/* -------------------------------- */}

            {isCodPinPending && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border border-zinc-200
                  bg-zinc-50
                  p-4
                "
              >
                <div className="flex items-start gap-3">

                  <div
                    className="
                      mt-0.5
                      flex h-8 w-8
                      shrink-0
                      items-center justify-center
                      rounded-lg
                      border border-zinc-200
                      bg-white
                    "
                  >
                    <KeyRound
                      size={16}
                      className="text-zinc-400"
                    />
                  </div>

                  <div>

                    <p className="text-sm font-medium text-zinc-700">
                      PIN not available yet
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      The payment collector will
                      provide you with a COD PIN
                      once it has been generated.
                    </p>

                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------- */}
            {/* Active PIN */}
            {/* -------------------------------- */}

            {isCodPinActive && (
              <div className="mt-6">

                <div
                  className="
                    rounded-2xl
                    border border-zinc-200
                    bg-zinc-50
                    p-4
                    sm:p-5
                  "
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end">

                    <div className="flex-1">

                      <label
                        htmlFor="cod-pin"
                        className="
                          mb-2
                          block
                          text-[10px]
                          font-medium
                          uppercase
                          tracking-[0.18em]
                          text-zinc-400
                        "
                      >
                        COD PIN
                      </label>

                      <div className="relative">

                        <input
                          id="cod-pin"
                          type="password"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={codPin}
                          onChange={(event) => {
                            setCodError("");
                            setCodMessage("");

                            setCodPin(
                              event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6)
                            );
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" &&
                              codPin.length === 6 &&
                              !codLoading
                            ) {
                              handleCodVerification();
                            }
                          }}
                          placeholder="Enter 6-digit PIN"
                          className="
                            h-12
                            w-full
                            rounded-xl
                            border border-zinc-200
                            bg-white
                            px-4
                            pr-12
                            font-mono
                            text-base
                            tracking-[0.2em]
                            text-zinc-900
                            outline-none
                            transition
                            duration-200
                            placeholder:font-sans
                            placeholder:tracking-normal
                            placeholder:text-zinc-400
                            hover:border-zinc-300
                            focus:border-zinc-400
                            focus:shadow-[0_0_0_4px_rgba(24,24,27,0.04)]
                          "
                        />

                        <KeyRound
                          size={17}
                          className="
                            pointer-events-none
                            absolute
                            right-4
                            top-1/2
                            -translate-y-1/2
                            text-zinc-300
                          "
                        />

                      </div>

                      <p className="mt-2 text-[11px] text-zinc-400">
                        Enter the PIN provided by the
                        payment collector.
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={handleCodVerification}
                      disabled={
                        codLoading ||
                        codPin.length !== 6
                      }
                      className="
                        group
                        inline-flex
                        h-12
                        shrink-0
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-zinc-900
                        px-5
                        text-sm
                        font-medium
                        text-white
                        shadow-sm
                        transition
                        duration-200
                        hover:bg-zinc-800
                        hover:shadow-md
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >

                      {codLoading ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />

                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck
                            size={16}
                            className="
                              transition-transform
                              duration-200
                              group-hover:scale-105
                            "
                          />

                          Verify PIN
                        </>
                      )}

                    </button>

                  </div>
                </div>

                {/* Success */}

                {codMessage && (
                  <div
                    className="
                      mt-4
                      flex
                      items-start
                      gap-3
                      rounded-xl
                      border border-emerald-200
                      bg-emerald-50
                      px-4
                      py-3.5
                    "
                  >
                    <CheckCircle2
                      size={17}
                      className="
                        mt-0.5
                        shrink-0
                        text-emerald-600
                      "
                    />

                    <p className="text-sm leading-5 text-emerald-700">
                      {codMessage}
                    </p>
                  </div>
                )}

                {/* Error */}

                {codError && (
                  <div
                    className="
                      mt-4
                      rounded-xl
                      border border-red-200
                      bg-red-50
                      px-4
                      py-3.5
                    "
                  >
                    <p className="text-sm leading-5 text-red-600">
                      {codError}
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* -------------------------------- */}
      {/* Status + Payment */}
      {/* -------------------------------- */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">

        <InfoCard
          icon={CheckCircle2}
          title="Order Status"
          description="Current progress of your order."
        >

          <InfoRow
            label="Current Status"
            value={
              <StatusBadge
                status={order.orderStatus}
              />
            }
          />

          <InfoRow
            label="Created"
            value={formatDateTime(
              order.createdAt
            )}
          />

          <InfoRow
            label="Last Updated"
            value={formatDateTime(
              order.updatedAt
            )}
          />

        </InfoCard>

        <InfoCard
          icon={CreditCard}
          title="Payment Information"
          description="Payment details for this order."
        >

          <InfoRow
            label="Method"
            value={formatStatus(
              order.paymentMethod
            )}
          />

          <InfoRow
            label="Payment Status"
            value={
              <PaymentStatus
                status={order.paymentStatus}
                codPinStatus={order.codPinStatus}
              />
            }
          />

          <InfoRow
            label="Amount"
            value={
              <span className="font-medium text-zinc-900">
                ₹{Number(
                  order.amount || 0
                ).toLocaleString("en-IN")}
              </span>
            }
          />

          {isCodOrder &&
            order.codCollectedAt && (
              <InfoRow
                label="Collected On"
                value={formatDateTime(
                  order.codCollectedAt
                )}
              />
            )}

        </InfoCard>

      </div>

      {/* -------------------------------- */}
      {/* Project Details */}
      {/* -------------------------------- */}

      <div
        className="
          group
          relative
          mt-6
          overflow-hidden
          rounded-[28px]
          border border-zinc-200
          bg-white
          p-6
          shadow-[0_20px_80px_rgba(0,0,0,0.05)]
          transition
          duration-300
          hover:border-zinc-300
          hover:shadow-[0_22px_85px_rgba(0,0,0,0.07)]
          sm:p-8
        "
      >

        {/* Glow */}

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
            transition
            duration-700
            group-hover:bg-cyan-300/[0.045]
          "
        />

        <div className="relative">

          {/* Section Header */}

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
                duration-200
                group-hover:border-zinc-300
                group-hover:bg-white
              "
            >
              <FileText
                size={18}
                strokeWidth={1.6}
                className="
                  text-zinc-400
                  transition
                  duration-200
                  group-hover:text-zinc-700
                "
              />
            </div>

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
                Requirements
              </p>

              <h2 className="mt-1 text-lg font-medium text-zinc-900">
                Project Details
              </h2>

            </div>
          </div>

          {/* Fields */}

          <div className="mt-7 grid gap-4 sm:grid-cols-2">

            {Object.entries(formData).map(
              ([key, value]) => (
                <DetailField
                  key={key}
                  label={formatLabel(key)}
                  value={formatValue(value)}
                />
              )
            )}

          </div>

        </div>
      </div>

    </div>
  );
};

/* -------------------------------- */
/* Summary Card */
/* -------------------------------- */

const SummaryCard = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div
      className="
        group/card
        relative
        overflow-hidden
        rounded-2xl
        border border-zinc-200
        bg-zinc-50
        p-4
        transition
        duration-200
        hover:-translate-y-0.5
        hover:border-zinc-300
        hover:bg-white
        hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-8
          -top-8
          h-20
          w-20
          rounded-full
          bg-cyan-300/[0.04]
          blur-2xl
          opacity-0
          transition
          duration-500
          group-hover/card:opacity-100
        "
      />

      <div className="relative flex items-center gap-3">

        <div
          className="
            flex h-10 w-10
            shrink-0
            items-center justify-center
            rounded-xl
            border border-zinc-200
            bg-white
            transition
            duration-200
            group-hover/card:border-zinc-300
            group-hover/card:shadow-sm
          "
        >
          <Icon
            size={17}
            strokeWidth={1.6}
            className="
              text-zinc-400
              transition
              duration-200
              group-hover/card:scale-105
              group-hover/card:text-zinc-700
            "
          />
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
            {label}
          </p>

          <p className="mt-1 truncate text-sm font-medium text-zinc-800">
            {value}
          </p>

        </div>
      </div>
    </div>
  );
};

/* -------------------------------- */
/* Information Card */
/* -------------------------------- */

const InfoCard = ({
  icon: Icon,
  title,
  description,
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
              flex h-9 w-9
              items-center justify-center
              rounded-xl
              border border-zinc-200
              bg-zinc-50
              transition
              duration-200
              group-hover:border-zinc-300
              group-hover:bg-white
            "
          >
            <Icon
              size={17}
              strokeWidth={1.6}
              className="
                text-zinc-400
                transition
                duration-200
                group-hover:text-zinc-700
              "
            />
          </div>

          <div>

            <h2 className="text-lg font-medium text-zinc-900">
              {title}
            </h2>

            <p className="mt-0.5 text-xs text-zinc-400">
              {description}
            </p>

          </div>
        </div>

        <div className="mt-5">
          {children}
        </div>

      </div>
    </div>
  );
};

/* -------------------------------- */
/* Information Row */
/* -------------------------------- */

const InfoRow = ({ label, value }) => {
  return (
    <div
      className="
        group/row
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
      <span
        className="
          text-sm
          text-zinc-500
          transition
          duration-200
          group-hover/row:text-zinc-700
        "
      >
        {label}
      </span>

      <span className="text-right text-sm text-zinc-700">
        {value}
      </span>
    </div>
  );
};

/* -------------------------------- */
/* Detail Field */
/* -------------------------------- */

const DetailField = ({ label, value }) => {
  return (
    <div
      className="
        group/field
        relative
        overflow-hidden
        rounded-2xl
        border border-zinc-200
        bg-zinc-50
        p-4
        transition
        duration-200
        hover:-translate-y-0.5
        hover:border-zinc-300
        hover:bg-white
        hover:shadow-sm
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-10
          -top-10
          h-20
          w-20
          rounded-full
          bg-cyan-300/[0.035]
          blur-2xl
          opacity-0
          transition
          duration-500
          group-hover/field:opacity-100
        "
      />

      <div className="relative">

        <p
          className="
            text-[10px]
            font-medium
            uppercase
            tracking-[0.15em]
            text-zinc-400
            transition
            group-hover/field:text-zinc-500
          "
        >
          {label}
        </p>

        <div className="mt-2 break-words text-sm leading-6 text-zinc-600">
          {value || "—"}
        </div>

      </div>
    </div>
  );
};

/* -------------------------------- */
/* Status Badge */
/* -------------------------------- */

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

    cancelled:
      "border-red-200 bg-red-50 text-red-700",

    rejected:
      "border-red-200 bg-red-50 text-red-700",

    delivered:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`
        inline-flex
        shrink-0
        items-center
        gap-1.5
        rounded-full
        border
        px-3
        py-1.5
        text-[11px]
        font-medium
        transition
        duration-200
        ${
          styles[normalizedStatus] ||
          "border-zinc-200 bg-zinc-50 text-zinc-600"
        }
      `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />

      {formatStatus(normalizedStatus)}
    </span>
  );
};

/* -------------------------------- */
/* Payment Status */
/* -------------------------------- */

const PaymentStatus = ({
  status,
  codPinStatus,
}) => {
  const normalizedStatus = status || "unknown";

  /*
   * COD can be considered successfully completed
   * when either the payment itself is collected OR
   * the current temporary backend marks the PIN verified.
   */
  const successful =
    [
      "paid",
      "collected",
      "completed",
      "success",
      "successful",
    ].includes(normalizedStatus) ||
    codPinStatus === "verified" ||
    codPinStatus === "used";

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        ${
          successful
            ? "font-medium text-emerald-600"
            : "text-zinc-500"
        }
      `}
    >
      {successful && (
        <CheckCircle2
          size={14}
          strokeWidth={1.8}
        />
      )}

      {successful
        ? "Payment Done"
        : formatStatus(normalizedStatus)}
    </span>
  );
};

/* -------------------------------- */
/* Helpers */
/* -------------------------------- */

const formatLabel = (value) => {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/\_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    )
    .trim();
};

const formatValue = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const formatStatus = (status) => {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/\_/g, " ")
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

const formatDateTime = (date) => {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString(
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

export default OrderDetails;