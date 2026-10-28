import PaymentStatusBadge from "../components/PaymentStatusBadge";
import ClientPaymentPinSection from "../components/ClientPaymentPinSection";
import { useAuth } from "../context/authSessionContext";
import StatusBadge from "../components/OrderStatusBadge";
import { hasProjectDetails } from "../utils/orderResources";
import { useCallback } from "react";

import useAsyncResource from "../hooks/useAsyncResource";
import useCollectionPaymentRefresh from "../hooks/useCollectionPaymentRefresh";

import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  Package,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import orderService from "../services/orderService";

import OrderItemsOverview from "../components/OrderItemsOverview";
import RetryOnlinePayment from "../components/RetryOnlinePayment";
import AdCreditBreakdown from "../components/AdCreditBreakdown";
import { toast } from "sonner";

const OrderDetails = () => {
  const { id } = useParams();
  return <OrderDetailsContent key={id} id={id} />;
};

const OrderDetailsContent = ({ id }) => {
  const { user } = useAuth();



  const readOrder = useCallback(async () => (await orderService.getOrderById(id)).order || null, [id]);
  const { data: order, setData: setOrder, loading, error, reload } = useAsyncResource(readOrder, { errorMessage: "Unable to load order details." });
  useCollectionPaymentRefresh(order ? [order] : [], reload);

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

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
            <Loader2 size={19} className="animate-spin text-zinc-500" />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700">Loading order</p>

            <p className="mt-1 text-xs text-zinc-400">
              Fetching order details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Error
  // ---------------------------------------------------------

  if (error || !order) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 text-center">
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
            <Package size={22} className="text-red-500" />
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
            className="dashboard-action dashboard-action--secondary
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

  // ---------------------------------------------------------
  // Order Data
  // ---------------------------------------------------------

  /*
   * IMPORTANT:
   * Historical order information should come from
   * serviceSnapshot rather than the current Service document.
   */
  const service = order.serviceSnapshot || {};

  const serviceName = service.name || "Service";
  const serviceCategory = service.category || "";

  const formData =
    order.formData instanceof Map
      ? Object.fromEntries(order.formData)
      : order.formData || {};

  const selectedOption = service.selectedOption || null;

  const quantity = Number(order.quantity || 1);

  const quantityUnit = selectedOption?.unit || service.unit || "";

  // ---------------------------------------------------------
  // Dynamic form fields
  // ---------------------------------------------------------

  const dynamicFields = order.items?.length
    ? []
    : Object.entries(formData).filter(
        ([key, value]) =>
          value !== null &&
          value !== undefined &&
          !(typeof value === "string" && !value.trim()) &&
          !(Array.isArray(value) && value.length === 0) &&
          !service.repeatableGroups?.some((group) => group.name === key),
      );

  // ---------------------------------------------------------
  // COD State
  // ---------------------------------------------------------

  const isCodOrder = order.paymentMethod === "cod";
  const isChequeOrder = order.paymentMethod === "cheque";
  const hasPinVerification = isCodOrder || isChequeOrder;

  return (
    <div className="mx-auto max-w-[1100px] animate-fade-up">
      {/* =====================================================
          BACK NAVIGATION
      ====================================================== */}

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

      {/* =====================================================
          MAIN ORDER HEADER
      ====================================================== */}

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

          <div
            className="
              flex
              flex-col
              gap-6
              sm:flex-row
              sm:items-start
              sm:justify-between
            "
          >
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
                Placed on {formatDateTime(order.createdAt)}
              </p>
            </div>

            <StatusBadge status={order.orderStatus} />
          </div>
        </div>
      </div>

      {/* =====================================================
          SERVICE INFORMATION
      ====================================================== */}

      {!order.items?.length && (
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
            <div className="flex items-start gap-3">
              <div
                className="
                flex h-10 w-10
                shrink-0
                items-center justify-center
                rounded-xl
                border border-zinc-200
                bg-zinc-50
              "
              >
                <Package
                  size={18}
                  strokeWidth={1.6}
                  className="icon-accent-blue text-zinc-500"
                />
              </div>

              <div className="min-w-0">
                <p
                  className="
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.18em]
                  text-zinc-400
                "
                >
                  Service Information
                </p>

                <h2 className="mt-1 text-lg font-medium text-zinc-900">
                  {serviceName}
                </h2>

                {serviceCategory && (
                  <p className="mt-1 text-xs text-zinc-400">
                    {serviceCategory}
                  </p>
                )}
              </div>
            </div>


            {/* Order pricing information */}

            <div
              className="
              mt-6
              grid
              gap-3
              sm:grid-cols-2
              lg:grid-cols-3
            "
            >
              <SummaryCard
                icon={Package}
                label="Quantity"
                value={`${quantity}${quantityUnit ? ` ${quantityUnit}` : ""}`}
              />

              {selectedOption?.name && (
                <SummaryCard
                  icon={FileText}
                  label="Selected Option"
                  value={selectedOption.name}
                />
              )}
            </div>

            {/* Pricing option details */}

            {selectedOption?.description && (
              <div
                className="
                mt-4
                rounded-2xl
                border border-zinc-200
                bg-zinc-50
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
                  Selected Option
                </p>

                <p className="mt-1 text-sm text-zinc-600">
                  {selectedOption.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <ClientPaymentPinSection order={order} user={user} onVerified={(update) => { setOrder((current) => ({ ...current, ...update })); toast.success("Payment marked as Paid."); }} />
      {(order.items?.length > 0 || order.serviceProgress) && (
        <div className="mt-6">
          <OrderItemsOverview order={order} />
        </div>
      )}

      {/* =====================================================
          STATUS + PAYMENT
      ====================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <InfoCard
          icon={CheckCircle2}
          title="Order Status"
          description="Current progress of your order."
        >
          <InfoRow
            label="Current Status"
            value={<StatusBadge status={order.orderStatus} />}
          />

          <InfoRow label="Created" value={formatDateTime(order.createdAt)} />

          <InfoRow
            label="Last Updated"
            value={formatDateTime(order.updatedAt)}
          />
        </InfoCard>

        <InfoCard
          icon={CreditCard}
          title="Payment Information"
          description="Payment details for this order."
        >
          <RetryOnlinePayment order={order} onPaid={setOrder} />
          <AdCreditBreakdown order={order} />
          {order.paymentMethod === "month_end" && !["paid", "collected"].includes(order.paymentStatus) && (
            <p className="mb-4 text-xs leading-5 text-zinc-500">Payment is due at the end of the month and remains pending until receipt is confirmed.</p>
          )}
          <InfoRow
            label="Method"
            value={
              order.paymentMethod === "month_end"
                ? "Pay on Month-End"
                : order.paymentMethod === "online"
                  ? "Pay Online"
                  : order.paymentMethod === "cheque"
                    ? "Cheque"
                    : "Cash on Delivery"
            }
          />

          {isChequeOrder && (
            <InfoRow
              label="Cheque Type"
              value={
                order.chequeType === "with_gst"
                  ? "With GST"
                  : "Direct Collection"
              }
            />
          )}

          {order.couponSnapshot && (
            <>
              <InfoRow
                label="Original subtotal"
                value={formatCurrency(order.originalSubtotal)}
              />
              <InfoRow
                label={`Coupon (${order.couponSnapshot.code})`}
                value={`−${formatCurrency(order.discountTotal)}`}
              />
            </>
          )}

          <InfoRow
            label={order.couponSnapshot ? "Taxable subtotal" : "Subtotal"}
            value={formatCurrency(order.subtotal)}
          />

          <InfoRow
            label={`GST (${Number(order.gstRate || 0)}%)`}
            value={formatCurrency(order.gstAmount)}
          />

          <InfoRow
            label="Payment Status"
            value={
              <PaymentStatus
                status={order.paymentStatus}
                codPinStatus={order.codPinStatus}
                paymentMethod={order.paymentMethod}
              />
            }
          />

          <InfoRow
            label="Final Total"
            value={
              <span className="font-medium text-zinc-900">
                ₹{Number(order.amount || 0).toLocaleString("en-IN")}
              </span>
            }
          />

          {hasPinVerification && (
            <InfoRow
              label="PIN Verification"
              value={formatStatus(order.codPinStatus || "not_generated")}
            />
          )}

          {hasPinVerification && order.codCollectedAt && (
            <InfoRow
              label="Collected On"
              value={formatDateTime(order.codCollectedAt)}
            />
          )}
        </InfoCard>
      </div>

      {order.orderStatus === "completed" && (
        <section className="mt-6 rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
            Completed order
          </p>

          <h2 className="mt-1 text-lg font-medium text-zinc-900">
            Delivery & invoice
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <ClientOrderResource
              title="Delivery"
              name="View delivery"
              url={order.deliveryLink}
            />

            <ClientOrderResource
              title="Invoice"
              name={order.invoice?.name || "View invoice"}
              url={order.invoice?.url}
            />
          </div>
        </section>
      )}

      {/* =====================================================
          REQUIREMENTS / DYNAMIC FORM DATA
      ====================================================== */}

      {(dynamicFields.length > 0 || hasProjectDetails(order.additionalRequirements) ||
        (!order.items?.length && (service.repeatableGroups || []).some((group) =>
          (formData[group.name] || group.items || []).length > 0))) && (
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
          {/* Header */}

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

          {/* Dynamic Fields */}

          {dynamicFields.length > 0 && (
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {dynamicFields.map(([key, value]) => (
                <DetailField
                  key={key}
                  label={formatLabel(key)}
                  value={formatDynamicValue(value)}
                />
              ))}
            </div>
          )}

          {!order.items?.length &&
            (service.repeatableGroups || []).map((group) => {
              const entries = formData[group.name] || group.items || [];

              if (!Array.isArray(entries) || entries.length === 0) {
                return null;
              }

              return (
                <RepeatableConfigurationDetails
                  key={group.name}
                  group={group}
                  entries={entries}
                />
              );
            })}

          {/* Additional Requirements */}

          {hasProjectDetails(order.additionalRequirements) && (
            <div className="mt-4">
              <DetailField
                label="Additional Requirements"
                value={order.additionalRequirements}
                fullWidth
              />
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({ icon: Icon, label, value }) => {
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

const ClientOrderResource = ({ title, name, url }) => (
  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
    <p className="text-sm font-medium text-zinc-800">{title}</p>

    {url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="dashboard-action dashboard-action--primary
          mt-3
          inline-flex
          cursor-pointer
          items-center
          gap-2
          rounded-xl
          bg-zinc-900
          px-4
          py-2.5
          text-sm
          font-medium
          !text-white
          transition-all
          duration-200
          hover:bg-zinc-700
          hover:!text-white
        "
      >
        <span className="!text-white">{name}</span>

        <ExternalLink size={14} strokeWidth={1.8} className="!text-white" />
      </a>
    ) : (
      <p className="mt-2 text-sm text-zinc-500">
        {title === "Delivery"
          ? "Delivery is pending."
          : "Invoice is not available yet."}
      </p>
    )}
  </div>
);

const RepeatableConfigurationDetails = ({ group, entries }) => (
  <section className="mt-7 space-y-4">
    <h3 className="text-sm font-semibold text-zinc-900">
      {group.label || group.name} configurations
    </h3>
    {entries.map((entry, index) => {
      const snapshotItem = group.items?.[index] || {};
      const pricingSnapshots =
        snapshotItem.pricingSnapshots instanceof Map
          ? Object.fromEntries(snapshotItem.pricingSnapshots)
          : snapshotItem.pricingSnapshots || {};
      const fields =
        entry?.fields && typeof entry.fields === "object"
          ? entry.fields
          : entry || {};
      const displayFields = Object.entries(fields)
        .map(([fieldName, value]) => ({
          label: formatLabel(fieldName),
          value,
        }))
        .filter(
          ({ value }) =>
            value !== undefined &&
            value !== null &&
            value !== "" &&
            !(Array.isArray(value) && value.length === 0),
        );

      return (
        <article
          key={`${group.name}-${index}`}
          className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
        >
          <h4 className="text-sm font-medium text-zinc-800">
            {group.label || "Item"} {index + 1}
          </h4>
          {Object.entries(pricingSnapshots).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(pricingSnapshots).map(([name, option]) => (
                <span
                  key={name}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600"
                >
                  {formatLabel(name)}: {option?.name || "Selected"}
                </span>
              ))}
            </div>
          )}
          {displayFields.length > 0 && (
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {displayFields.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    {label}
                  </dt>
                  <dd className="mt-1 break-words text-sm text-zinc-700">
                    {formatDynamicValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </article>
      );
    })}
  </section>
);

/* =========================================================
   INFORMATION CARD
========================================================= */

const InfoCard = ({ icon: Icon, title, description, children }) => {
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
            <h2 className="text-lg font-medium text-zinc-900">{title}</h2>

            <p className="mt-0.5 text-xs text-zinc-400">{description}</p>
          </div>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
};

/* =========================================================
   INFORMATION ROW
========================================================= */

const InfoRow = ({ label, value }) => {
  return (
    <div
      className="
        group/row
        flex
        flex-col
        gap-2
        border-b
        border-zinc-100
        py-3.5
        sm:flex-row
        sm:items-center
        sm:justify-between
        sm:gap-5
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

      <span className="text-left text-sm text-zinc-700 sm:text-right">
        {value}
      </span>
    </div>
  );
};

/* =========================================================
   DETAIL FIELD
========================================================= */

const DetailField = ({ label, value, fullWidth = false }) => {
  return (
    <div
      className={`
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
        ${fullWidth ? "sm:col-span-2" : ""}
      `}
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

/* =========================================================
   STATUS BADGE
========================================================= */

/* =========================================================
   PAYMENT STATUS
========================================================= */

const PaymentStatus = ({ status }) => {
  const normalizedStatus = status || "unknown";

  const successful =
    ["paid", "collected", "completed", "success", "successful"].includes(
      normalizedStatus,
    );

  return <PaymentStatusBadge status={successful ? "paid" : normalizedStatus} />;
};

/* =========================================================
   DYNAMIC VALUE FORMATTER
========================================================= */

const formatDynamicValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  // Arrays
  if (Array.isArray(value)) {
    return value.map((item) => formatDynamicValue(item)).join(", ");
  }

  // Objects
  if (typeof value === "object") {
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-zinc-600">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  const stringValue = String(value);

  // URL
  if (/^https?:\/\//i.test(stringValue)) {
    return (
      <a
        href={stringValue}
        target="_blank"
        rel="noopener noreferrer"
        className="
          inline-flex
          max-w-full
          items-start
          gap-1.5
          break-all
          text-zinc-700
          underline
          decoration-zinc-300
          underline-offset-4
          transition
          hover:text-zinc-900
          hover:decoration-zinc-500
        "
      >
        <span>{stringValue}</span>

        <ExternalLink size={13} className="mt-1 shrink-0" />
      </a>
    );
  }

  return formatDisplayValue(stringValue);
};

/* =========================================================
   DISPLAY VALUE
========================================================= */

const formatDisplayValue = (value) => {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/* =========================================================
   LABEL FORMATTER
========================================================= */

const formatLabel = (value) => {
  if (!value) return "";

  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
};

/* =========================================================
   STATUS FORMATTER
========================================================= */

const formatStatus = (status) => {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/* =========================================================
   DATE
========================================================= */

/* =========================================================
   DATE + TIME
========================================================= */

const formatDateTime = (date) => {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

export default OrderDetails;
