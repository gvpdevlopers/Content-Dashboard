import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clipboard,
  CreditCard,
  FileText,
  KeyRound,
  Loader2,
  Package,
  RefreshCw,
  Save,
  User,
  XCircle,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import adminOrderService from "../../services/adminOrderService";
import codService from "../../services/codService";
import CustomSelect from "../../components/CustomSelect";

const AdminOrderDetails = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusLoading, setStatusLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [codLoading, setCodLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [copied, setCopied] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  /*
  |----------------------------------------------------------------------
  | Load order
  |----------------------------------------------------------------------
  */

  const loadOrder = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setMessage("");

      const data = await adminOrderService.getAdminOrderById(id);

      setOrder(data.order || null);
      setAdminNotes(data.order?.notes || "");
    } catch (error) {
      console.error("Get admin order details error:", error);

      setError(
        error.response?.data?.message || "Unable to load order details.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  /*
  |----------------------------------------------------------------------
  | Order status
  |----------------------------------------------------------------------
  */

  const handleStatusChange = async (value) => {
    if (!order || value === order.orderStatus) {
      return;
    }

    try {
      setStatusLoading(true);
      setError("");
      setMessage("");

      const data = await adminOrderService.updateOrderStatus(order._id, value);

      setOrder((currentOrder) => ({
        ...currentOrder,
        ...data.order,
      }));

      setMessage("Order status updated successfully.");
    } catch (error) {
      console.error("Update order status error:", error);

      setError(
        error.response?.data?.message || "Unable to update order status.",
      );
    } finally {
      setStatusLoading(false);
    }
  };

  /*
  |----------------------------------------------------------------------
  | Payment status
  |----------------------------------------------------------------------
  */

  const handlePaymentStatusChange = async (value) => {
    if (!order || value === order.paymentStatus) {
      return;
    }

    /*
     * COD collection must happen through
     * the COD PIN verification flow.
     */

    if (order.paymentMethod === "cod" && value === "collected") {
      setError("COD payment must be completed through COD PIN verification.");

      return;
    }

    try {
      setPaymentLoading(true);
      setError("");
      setMessage("");

      const data = await adminOrderService.updatePaymentStatus(
        order._id,
        value,
      );

      setOrder((currentOrder) => ({
        ...currentOrder,
        ...data.order,
      }));

      setMessage("Payment status updated successfully.");
    } catch (error) {
      console.error("Update payment status error:", error);

      setError(
        error.response?.data?.message || "Unable to update payment status.",
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  /*
  |----------------------------------------------------------------------
  | Admin notes
  |----------------------------------------------------------------------
  */

  const handleSaveNotes = async () => {
    if (!order) {
      return;
    }

    try {
      setNotesLoading(true);
      setError("");
      setMessage("");

      const data = await adminOrderService.updateAdminNotes(
        order._id,
        adminNotes,
      );

      const updatedNotes =
        data.order?.notes !== undefined ? data.order.notes : adminNotes;

      setOrder((currentOrder) => ({
        ...currentOrder,
        notes: updatedNotes,
      }));

      setAdminNotes(updatedNotes);

      setMessage("Admin notes updated successfully.");
    } catch (error) {
      console.error("Update admin notes error:", error);

      setError(
        error.response?.data?.message || "Unable to update admin notes.",
      );
    } finally {
      setNotesLoading(false);
    }
  };

  /*
  |----------------------------------------------------------------------
  | COD PIN
  |----------------------------------------------------------------------
  */

  const handleGenerateCodPin = async () => {
    if (!order) {
      return;
    }

    try {
      setCodLoading(true);
      setError("");
      setMessage("");
      setCopied(false);

      const data = await codService.generateCodPin(order._id);

      setOrder((currentOrder) => ({
        ...currentOrder,

        /*
         * The actual PIN is intentionally only placed
         * into local admin state after generation.
         */
        codPin: data.codPin,

        codPinStatus: data.order?.codPinStatus || "active",
      }));

      setMessage("COD PIN generated successfully.");
    } catch (error) {
      console.error("Generate COD PIN error:", error);

      setError(error.response?.data?.message || "Unable to generate COD PIN.");
    } finally {
      setCodLoading(false);
    }
  };

  const copyPin = async () => {
    if (!order?.codPin) {
      return;
    }

    try {
      await navigator.clipboard.writeText(order.codPin);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Copy PIN error:", error);
    }
  };

  /*
  |----------------------------------------------------------------------
  | Derived values
  |----------------------------------------------------------------------
  */

  const clientName =
    order?.client?.name ||
    order?.client?.username ||
    order?.client?.email ||
    "Unknown Client";

  const serviceSnapshot = order?.serviceSnapshot || {};

  const formDataEntries = useMemo(() => {
    if (!order?.formData) {
      return [];
    }

    let entries = [];

    if (order.formData instanceof Map) {
      entries = Array.from(order.formData.entries());
    } else if (typeof order.formData === "object") {
      entries = Object.entries(order.formData);
    }

    return entries.filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    );
  }, [order]);

  const hasAdditionalRequirements = Boolean(
    order?.additionalRequirements?.trim(),
  );

  const hasCodPin = Boolean(order?.codPin);

  /*
  |----------------------------------------------------------------------
  | Loading
  |----------------------------------------------------------------------
  */

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
        <div className="flex flex-col items-center text-center">
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
            <Loader2 size={20} className="animate-spin text-zinc-400" />
          </div>

          <p className="mt-4 text-sm font-medium text-zinc-700">
            Loading order
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            Fetching order details...
          </p>
        </div>
      </div>
    );
  }

  /*
  |----------------------------------------------------------------------
  | Main render
  |----------------------------------------------------------------------
  */

  return (
    <div className="mx-auto max-w-[1500px] animate-fade-up">
      {/* =====================================================
          BACK
      ====================================================== */}

      <Link
        to="/admin/orders"
        className="
          group
          mb-5
          inline-flex
          items-center
          gap-2
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
        Back to Orders
      </Link>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="
            mb-5
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
          <div className="flex items-start gap-3">
            <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />

            <p className="text-sm text-red-600">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => loadOrder()}
            className="
              self-start
              text-sm
              font-medium
              text-red-600
              underline
              underline-offset-4
              hover:text-red-800
              sm:self-auto
            "
          >
            Try again
          </button>
        </div>
      )}

      {/* =====================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {message && (
        <div
          className="
            mb-5
            flex
            items-center
            gap-3
            rounded-2xl
            border border-emerald-200
            bg-emerald-50
            px-5
            py-4
            text-sm
            text-emerald-700
          "
        >
          <Check size={17} className="shrink-0" />

          {message}
        </div>
      )}

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

        <div className="relative">
          <div
            className="
              flex
              flex-col
              gap-6
              lg:flex-row
              lg:items-start
              lg:justify-between
            "
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-10 w-10
                    shrink-0
                    items-center justify-center
                    rounded-xl
                    border border-zinc-200
                    bg-zinc-50
                    text-zinc-500
                  "
                >
                  <Package size={18} strokeWidth={1.6} />
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
                    Order Details
                  </p>

                  <h1
                    className="
                      mt-1
                      break-all
                      text-2xl
                      font-medium
                      tracking-tight
                      text-zinc-900
                      sm:text-3xl
                    "
                  >
                    {order?.orderNumber || "Order"}
                  </h1>
                </div>
              </div>

              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <StatusBadge status={order?.orderStatus} />

                <PaymentStatusBadge status={order?.paymentStatus} />

                <span
                  className="
                    inline-flex
                    items-center
                    rounded-full
                    border border-zinc-200
                    bg-zinc-50
                    px-2.5
                    py-1
                    text-[10px]
                    font-medium
                    text-zinc-500
                  "
                >
                  {formatPaymentMethod(order?.paymentMethod)}
                </span>
              </div>

              <p
                className="
                  mt-4
                  max-w-2xl
                  text-sm
                  leading-6
                  text-zinc-500
                "
              >
                Review the client's submitted information, payment details and
                order status.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadOrder(true)}
              disabled={
                refreshing ||
                statusLoading ||
                paymentLoading ||
                notesLoading ||
                codLoading
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
                lg:self-auto
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

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* Summary */}

          <div
            className="
              mt-7
              grid
              gap-3
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            <SummaryCard icon={User} label="Client" value={clientName} />

            <SummaryCard
              icon={Package}
              label="Service"
              value={serviceSnapshot.name || order?.service?.name || "Service"}
            />

            <SummaryCard
              icon={CreditCard}
              label="Order Amount"
              value={formatCurrency(order?.amount)}
            />

            <SummaryCard
              icon={CalendarDays}
              label="Placed"
              value={formatDateTime(order?.createdAt)}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div
        className="
          grid
          gap-6
          xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,0.85fr)]
        "
      >
        {/* ===================================================
            LEFT
        ==================================================== */}

        <div className="space-y-6">
          {/* =================================================
              CLIENT
          ================================================== */}

          <InfoCard icon={User} eyebrow="Client" title="Client Information">
            <div
              className="
                grid
                gap-x-8
                gap-y-5
                sm:grid-cols-2
              "
            >
              <DetailItem label="Name" value={clientName} />

              <DetailItem label="Email" value={order?.client?.email} />

              <DetailItem label="Username" value={order?.client?.username} />

              <DetailItem label="Client ID" value={order?.client?._id} mono />
            </div>
          </InfoCard>

          {/* =================================================
              SERVICE
          ================================================== */}

          <InfoCard
            icon={Package}
            eyebrow="Service"
            title="Order Configuration"
          >
            <div
              className="
                grid
                gap-x-8
                gap-y-5
                sm:grid-cols-2
              "
            >
              <DetailItem
                label="Service"
                value={serviceSnapshot.name || order?.service?.name}
              />

              <DetailItem
                label="Category"
                value={serviceSnapshot.category || order?.service?.category}
              />

              <DetailItem
                label="Pricing Type"
                value={formatStatus(serviceSnapshot.pricingType)}
              />

              <DetailItem label="Quantity" value={order?.quantity} />

              <DetailItem label="Unit" value={serviceSnapshot.unit} />

              <DetailItem
                label="Base Price"
                value={
                  serviceSnapshot.basePrice !== undefined
                    ? formatCurrency(serviceSnapshot.basePrice)
                    : "—"
                }
              />
            </div>

            {serviceSnapshot.description && (
              <div
                className="
                  mt-6
                  border-t
                  border-zinc-100
                  pt-5
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
                  Service Description
                </p>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-zinc-600
                  "
                >
                  {serviceSnapshot.description}
                </p>
              </div>
            )}

            {serviceSnapshot.selectedOption && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-zinc-50
                  p-5
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
                      Selected Service Option
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        font-medium
                        text-zinc-900
                      "
                    >
                      {serviceSnapshot.selectedOption.name}
                    </p>
                  </div>

                  <p
                    className="
                      shrink-0
                      text-sm
                      font-semibold
                      text-zinc-900
                    "
                  >
                    {formatCurrency(serviceSnapshot.selectedOption.price)}
                  </p>
                </div>

                {serviceSnapshot.selectedOption.description && (
                  <p
                    className="
                      mt-3
                      text-xs
                      leading-5
                      text-zinc-500
                    "
                  >
                    {serviceSnapshot.selectedOption.description}
                  </p>
                )}
              </div>
            )}
          </InfoCard>

          {/* =================================================
              CLIENT SUBMISSION
          ================================================== */}

          <InfoCard
            icon={Clipboard}
            eyebrow="Client Submission"
            title="Submitted Information"
          >
            <p
              className="
                mb-6
                text-xs
                leading-5
                text-zinc-400
              "
            >
              This is the information submitted by the client when placing the
              order.
            </p>

            {formDataEntries.length > 0 ? (
              <div
                className="
                  divide-y
                  divide-zinc-100
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-zinc-50
                "
              >
                {formDataEntries.map(([key, value]) => (
                  <SubmittedField key={key} name={key} value={value} />
                ))}
              </div>
            ) : (
              <EmptySubmittedData />
            )}
          </InfoCard>

          {/* =================================================
              ADDITIONAL REQUIREMENTS
          ================================================== */}

          {hasAdditionalRequirements && (
            <InfoCard
              icon={FileText}
              eyebrow="Client Submission"
              title="Additional Requirements"
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-zinc-50
                  p-5
                "
              >
                <p
                  className="
                    whitespace-pre-wrap
                    break-words
                    text-sm
                    leading-7
                    text-zinc-600
                  "
                >
                  {order.additionalRequirements}
                </p>
              </div>
            </InfoCard>
          )}
        </div>

        {/* ===================================================
            RIGHT
        ==================================================== */}

        <aside className="space-y-6">
          {/* =================================================
              ORDER STATUS
          ================================================== */}

          <InfoCard icon={Package} eyebrow="Management" title="Order Status">
            <p
              className="
                mb-4
                text-xs
                leading-5
                text-zinc-400
              "
            >
              Update the current processing status of this order.
            </p>

            <CustomSelect
              value={order?.orderStatus || "pending"}
              onChange={handleStatusChange}
              options={[
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

            {statusLoading && (
              <LoadingMessage text="Updating order status..." />
            )}
          </InfoCard>

          {/* =================================================
              PAYMENT
          ================================================== */}

          <InfoCard icon={CreditCard} eyebrow="Payment" title="Payment Status">
            <div
              className="
                mb-5
                grid
                grid-cols-2
                gap-3
              "
            >
              <SummaryCard
                icon={CreditCard}
                label="Method"
                value={formatPaymentMethod(order?.paymentMethod)}
              />

              <SummaryCard
                icon={CreditCard}
                label="Amount"
                value={formatCurrency(order?.amount)}
              />
            </div>

            <p
              className="
                mb-4
                text-xs
                leading-5
                text-zinc-400
              "
            >
              Online payment statuses can be updated here. COD collection is
              completed through PIN verification.
            </p>

            <CustomSelect
              value={order?.paymentStatus || "pending"}
              onChange={handlePaymentStatusChange}
              options={[
                {
                  value: "pending",
                  label: "Pending",
                },
                {
                  value: "processing",
                  label: "Processing",
                },
                {
                  value: "paid",
                  label: "Paid",
                },
                {
                  value: "failed",
                  label: "Failed",
                },
                {
                  value: "collected",
                  label: "Collected",
                },
              ]}
            />

            {paymentLoading && (
              <LoadingMessage text="Updating payment status..." />
            )}
          </InfoCard>

          {/* =================================================
              COD
          ================================================== */}

          {order?.paymentMethod === "cod" && (
            <InfoCard
              icon={KeyRound}
              eyebrow="Cash on Delivery"
              title="COD Payment"
            >
              <div
                className="
                  rounded-xl
                  border
                  border-zinc-200
                  bg-zinc-50
                  p-4
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
                      PIN Status
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        text-zinc-700
                      "
                    >
                      {formatCodPinStatus(order?.codPinStatus)}
                    </p>
                  </div>

                  <CodPinStatusBadge status={order?.codPinStatus} />
                </div>
              </div>

              {hasCodPin ? (
                <div className="mt-5">
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

                  <div className="flex gap-2">
                    <div
                      className="
                        flex
                        min-w-0
                        flex-1
                        items-center
                        rounded-xl
                        border
                        border-zinc-200
                        bg-zinc-50
                        px-5
                        py-3.5
                      "
                    >
                      <span
                        className="
                          font-mono
                          text-xl
                          tracking-[0.3em]
                          text-zinc-900
                        "
                      >
                        {order.codPin}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={copyPin}
                      className="
                        flex
                        h-[52px]
                        w-[52px]
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-zinc-200
                        bg-white
                        text-zinc-400
                        shadow-sm
                        transition-all
                        duration-200
                        hover:border-zinc-300
                        hover:bg-zinc-50
                        hover:text-zinc-900
                        hover:shadow-md
                      "
                      title="Copy PIN"
                    >
                      {copied ? <Check size={18} /> : <Clipboard size={18} />}
                    </button>
                  </div>

                  <p
                    className="
                      mt-3
                      text-xs
                      leading-5
                      text-zinc-400
                    "
                  >
                    Share this PIN with the payment collector. The client uses
                    the PIN to complete COD verification.
                  </p>
                </div>
              ) : (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleGenerateCodPin}
                    disabled={
                      codLoading || order?.paymentStatus === "collected"
                    }
                    className="
                      group
                      inline-flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-zinc-900
                      px-4
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
                    "
                  >
                    {codLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating PIN...
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        Generate COD PIN
                      </>
                    )}
                  </button>

                  <p
                    className="
                      mt-3
                      text-xs
                      leading-5
                      text-zinc-400
                    "
                  >
                    Generate a PIN when the COD payment needs to be verified.
                  </p>
                </div>
              )}

              {order?.paymentStatus === "collected" && (
                <div
                  className="
                    mt-4
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-emerald-200
                    bg-emerald-50
                    px-4
                    py-3
                    text-sm
                    text-emerald-700
                  "
                >
                  <Check size={16} />
                  COD payment has been collected.
                </div>
              )}
            </InfoCard>
          )}

          {/* =================================================
              ADMIN NOTES
          ================================================== */}

          <InfoCard icon={FileText} eyebrow="Internal" title="Admin Notes">
            <p
              className="
                mb-4
                text-xs
                leading-5
                text-zinc-400
              "
            >
              These notes are for internal admin use and are not visible to the
              client.
            </p>

            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              rows={7}
              placeholder="Add internal notes about this order..."
              className="
                w-full
                resize-y
                rounded-xl
                border
                border-zinc-200
                bg-zinc-50
                px-4
                py-3
                text-sm
                leading-6
                text-zinc-900
                outline-none
                placeholder:text-zinc-400
                transition
                duration-200
                hover:border-zinc-300
                hover:bg-white
                focus:border-zinc-400
                focus:bg-white
                focus:ring-2
                focus:ring-zinc-900/5
              "
            />

            <div
              className="
                mt-4
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <p className="text-xs text-zinc-400">
                {adminNotes.length} characters
              </p>

              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={notesLoading}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-zinc-900
                  px-4
                  py-2.5
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
                "
              >
                {notesLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Notes
                  </>
                )}
              </button>
            </div>
          </InfoCard>

          {/* =================================================
              ORDER TIMELINE / META
          ================================================== */}

          <InfoCard
            icon={CalendarDays}
            eyebrow="Metadata"
            title="Order Information"
          >
            <div className="space-y-5">
              <DetailItem
                label="Order Number"
                value={order?.orderNumber}
                mono
              />

              <DetailItem label="Order ID" value={order?._id} mono />

              <DetailItem
                label="Created"
                value={formatDateTime(order?.createdAt)}
              />

              <DetailItem
                label="Last Updated"
                value={formatDateTime(order?.updatedAt)}
              />
            </div>
          </InfoCard>
        </aside>
      </div>

      {/* =====================================================
          SAVED NOTES
      ====================================================== */}

      {order?.notes?.trim() && (
        <section
          className="
            mt-6
            rounded-[24px]
            border
            border-zinc-200
            bg-white
            p-6
            shadow-[0_12px_45px_rgba(0,0,0,0.04)]
            sm:p-7
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-10 w-10
                shrink-0
                items-center justify-center
                rounded-xl
                border
                border-zinc-200
                bg-zinc-50
              "
            >
              <FileText size={18} className="text-zinc-500" />
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
                Internal
              </p>

              <h2
                className="
                  mt-1
                  text-lg
                  font-medium
                  text-zinc-900
                "
              >
                Saved Notes
              </h2>
            </div>
          </div>

          <p
            className="
              mt-6
              whitespace-pre-wrap
              break-words
              text-sm
              leading-7
              text-zinc-600
            "
          >
            {order.notes}
          </p>
        </section>
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
        rounded-2xl
        border
        border-zinc-200
        bg-zinc-50
        p-4
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-zinc-300
        hover:bg-white
        hover:shadow-sm
      "
    >
      <div className="flex items-center gap-3">
        <div
          className="
            flex h-9 w-9
            shrink-0
            items-center justify-center
            rounded-xl
            border
            border-zinc-200
            bg-white
            text-zinc-400
            shadow-sm
            transition
            duration-200
            group-hover/card:border-zinc-300
            group-hover/card:text-zinc-700
          "
        >
          <Icon size={17} strokeWidth={1.6} />
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

          <p
            className="
              mt-1
              truncate
              text-sm
              font-medium
              text-zinc-800
            "
          >
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   INFO CARD
========================================================= */

const InfoCard = ({ icon: Icon, eyebrow, title, children }) => {
  return (
    <section
      className="
        group
        relative
        overflow-hidden
        rounded-[24px]
        border
        border-zinc-200
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
              border
              border-zinc-200
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

        <div className="relative mt-6">{children}</div>
      </div>
    </section>
  );
};

/* =========================================================
   DETAIL ITEM
========================================================= */

const DetailItem = ({ label, value, mono = false }) => {
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
          mt-1.5
          break-words
          text-sm
          text-zinc-700
          ${mono ? "font-mono text-xs" : ""}
        `}
      >
        {value === undefined || value === null || value === "" ? "—" : value}
      </p>
    </div>
  );
};

/* =========================================================
   SUBMITTED FIELD
========================================================= */

const SubmittedField = ({ name, value }) => {
  return (
    <div className="p-5 first:pt-5 last:pb-5">
      <p
        className="
          text-[10px]
          font-medium
          uppercase
          tracking-[0.15em]
          text-zinc-400
        "
      >
        {formatLabel(name)}
      </p>

      <div
        className="
          mt-2
          rounded-xl
          border
          border-zinc-200
          bg-white
          px-4
          py-3
        "
      >
        <FormattedValue value={value} />
      </div>
    </div>
  );
};

/* =========================================================
   FORMATTED VALUE
========================================================= */

const FormattedValue = ({ value }) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-sm text-zinc-400">—</span>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-1.5">
        {value.map((item, index) => (
          <p
            key={index}
            className="
                break-words
                text-sm
                leading-6
                text-zinc-700
              "
          >
            {formatValue(item)}
          </p>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <pre
        className="
          overflow-x-auto
          whitespace-pre-wrap
          break-words
          text-xs
          leading-6
          text-zinc-600
        "
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  const stringValue = String(value);

  const looksLikeUrl = /^https?:\/\//i.test(stringValue);

  if (looksLikeUrl) {
    return (
      <a
        href={stringValue}
        target="_blank"
        rel="noreferrer"
        className="
          break-all
          text-sm
          text-blue-600
          underline
          underline-offset-4
          hover:text-blue-800
        "
      >
        {stringValue}
      </a>
    );
  }

  return (
    <p
      className="
        whitespace-pre-wrap
        break-words
        text-sm
        leading-6
        text-zinc-700
      "
    >
      {stringValue}
    </p>
  );
};

/* =========================================================
   EMPTY SUBMITTED DATA
========================================================= */

const EmptySubmittedData = () => {
  return (
    <div
      className="
        rounded-2xl
        border
        border-dashed
        border-zinc-200
        bg-zinc-50
        px-5
        py-10
        text-center
      "
    >
      <div
        className="
          mx-auto
          flex h-12 w-12
          items-center
          justify-center
          rounded-2xl
          border
          border-zinc-200
          bg-white
        "
      >
        <Clipboard size={19} className="text-zinc-400" />
      </div>

      <p
        className="
          mt-4
          text-sm
          font-medium
          text-zinc-700
        "
      >
        No additional information
      </p>

      <p
        className="
          mt-1
          text-xs
          leading-5
          text-zinc-400
        "
      >
        This service did not require any additional client-submitted fields.
      </p>
    </div>
  );
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ status }) => {
  const config = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",

    processing: "border-blue-200 bg-blue-50 text-blue-700",

    in_progress: "border-purple-200 bg-purple-50 text-purple-700",

    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",

    delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",

    cancelled: "border-red-200 bg-red-50 text-red-700",

    rejected: "border-red-200 bg-red-50 text-red-700",
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
        ${config[status] || "border-zinc-200 bg-zinc-50 text-zinc-500"}
      `}
    >
      {formatStatus(status)}
    </span>
  );
};

/* =========================================================
   PAYMENT STATUS BADGE
========================================================= */

const PaymentStatusBadge = ({ status }) => {
  const config = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",

    processing: "border-blue-200 bg-blue-50 text-blue-700",

    paid: "border-emerald-200 bg-emerald-50 text-emerald-700",

    collected: "border-emerald-200 bg-emerald-50 text-emerald-700",

    failed: "border-red-200 bg-red-50 text-red-700",
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
        ${config[status] || "border-zinc-200 bg-zinc-50 text-zinc-500"}
      `}
    >
      Payment: {formatStatus(status)}
    </span>
  );
};

/* =========================================================
   COD PIN STATUS BADGE
========================================================= */

const CodPinStatusBadge = ({ status }) => {
  const config = {
    not_generated: {
      label: "Not Generated",
      className: "border-zinc-200 bg-zinc-50 text-zinc-500",
    },

    active: {
      label: "Active",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    },

    verified: {
      label: "Verified",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    used: {
      label: "Used",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    expired: {
      label: "Expired",
      className: "border-red-200 bg-red-50 text-red-700",
    },
  };

  const current = config[status] || {
    label: formatCodPinStatus(status),
    className: "border-zinc-200 bg-zinc-50 text-zinc-500",
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
   LOADING MESSAGE
========================================================= */

const LoadingMessage = ({ text }) => {
  return (
    <div
      className="
        mt-4
        flex
        items-center
        gap-2
        text-xs
        text-zinc-400
      "
    >
      <Loader2 size={14} className="animate-spin" />

      {text}
    </div>
  );
};

/* =========================================================
   HELPERS
========================================================= */

const formatLabel = (value) => {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
};

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
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

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatPaymentMethod = (method) => {
  if (method === "cod") {
    return "Cash on Delivery";
  }

  if (method === "online") {
    return "Online Payment";
  }

  return formatStatus(method);
};

const formatCodPinStatus = (status) => {
  if (!status) {
    return "Not Generated";
  }

  const labels = {
    not_generated: "Not Generated",

    active: "Active",

    verified: "Verified",

    used: "Used",

    expired: "Expired",
  };

  return labels[status] || formatStatus(status);
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return "₹0";
  }

  return `₹${Number(amount).toLocaleString("en-IN")}`;
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

export default AdminOrderDetails;
