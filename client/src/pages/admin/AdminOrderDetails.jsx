import { useEffect, useState } from "react";
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

  const loadOrder = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setMessage("");

      const data =
        await adminOrderService.getAdminOrderById(id);

      setOrder(data.order);
      setAdminNotes(data.order?.notes || "");
    } catch (error) {
      console.error(
        "Get admin order details error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load order details."
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
  |--------------------------------------------------------------------------
  | Order Status
  |--------------------------------------------------------------------------
  */

  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;

    if (!order || newStatus === order.orderStatus) {
      return;
    }

    try {
      setStatusLoading(true);
      setError("");
      setMessage("");

      const data =
        await adminOrderService.updateOrderStatus(
          order._id,
          newStatus
        );

      setOrder((currentOrder) => ({
        ...currentOrder,
        ...data.order,
      }));

      setMessage(
        "Order status updated successfully."
      );
    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to update order status."
      );
    } finally {
      setStatusLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Payment Status
  |--------------------------------------------------------------------------
  */

  const handlePaymentStatusChange = async (
    event
  ) => {
    const newPaymentStatus = event.target.value;

    if (
      !order ||
      newPaymentStatus === order.paymentStatus
    ) {
      return;
    }

    /*
     * COD collected status should only happen
     * through the COD PIN verification flow.
     */
    if (
      order.paymentMethod === "cod" &&
      newPaymentStatus === "collected"
    ) {
      setError(
        "COD payment must be completed through COD PIN verification."
      );
      return;
    }

    try {
      setPaymentLoading(true);
      setError("");
      setMessage("");

      const data =
        await adminOrderService.updatePaymentStatus(
          order._id,
          newPaymentStatus
        );

      setOrder((currentOrder) => ({
        ...currentOrder,
        ...data.order,
      }));

      setMessage(
        "Payment status updated successfully."
      );
    } catch (error) {
      console.error(
        "Update payment status error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to update payment status."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Admin Notes
  |--------------------------------------------------------------------------
  */

  const handleSaveNotes = async () => {
    if (!order) {
      return;
    }

    try {
      setNotesLoading(true);
      setError("");
      setMessage("");

      const data =
        await adminOrderService.updateAdminNotes(
          order._id,
          adminNotes
        );

      setOrder((currentOrder) => ({
        ...currentOrder,
        notes:
          data.order?.notes !== undefined
            ? data.order.notes
            : adminNotes,
      }));

      setAdminNotes(
        data.order?.notes !== undefined
          ? data.order.notes
          : adminNotes
      );

      setMessage(
        "Admin notes updated successfully."
      );
    } catch (error) {
      console.error(
        "Update admin notes error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to update admin notes."
      );
    } finally {
      setNotesLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | COD PIN
  |--------------------------------------------------------------------------
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

      const data =
        await codService.generateCodPin(
          order._id
        );

      setOrder((currentOrder) => ({
        ...currentOrder,
        codPin: data.codPin,
        codPinStatus:
          data.order?.codPinStatus || "active",
      }));

      setMessage(
        "COD PIN generated successfully."
      );
    } catch (error) {
      console.error(
        "Generate COD PIN error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to generate COD PIN."
      );
    } finally {
      setCodLoading(false);
    }
  };

  const copyPin = async () => {
    if (!order?.codPin) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        order.codPin
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

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Loading order...
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error && !order) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-5 text-center">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <Package
              size={22}
              className="text-red-300"
            />
          </div>

          <h1 className="mt-5 text-xl font-medium">
            Unable to load order
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/40">
            {error}
          </p>

          <Link
            to="/admin/orders"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Derived Values
  |--------------------------------------------------------------------------
  */

  const serviceName =
    order.serviceSnapshot?.name ||
    order.service?.name ||
    "Service";

  const clientName =
    order.client?.name ||
    order.client?.username ||
    "Unknown Client";

  const formData = order.formData || {};

  const isCod =
    order.paymentMethod === "cod";

  const hasCodPin =
    Boolean(order.codPin);

  const isCancelled =
    order.orderStatus === "cancelled";

  const isCompleted =
    order.orderStatus === "completed";

  /*
   * Payment options depend on payment method.
   *
   * Online:
   * pending / processing / paid / failed
   *
   * COD:
   * pending / collected
   *
   * COD collected is intentionally handled
   * through PIN verification.
   */
  const paymentOptions = isCod
    ? ["pending", "collected"]
    : [
        "pending",
        "processing",
        "paid",
        "failed",
      ];

  const notesChanged =
    adminNotes !== (order.notes || "");

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* Back */}

      <Link
        to="/admin/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Orders
      </Link>

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/[0.035] blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 -left-20 h-56 w-56 rounded-full bg-white/[0.02] blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Package
                    size={18}
                    strokeWidth={1.6}
                    className="text-white/60"
                  />
                </div>

                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">
                  Order
                </p>
              </div>

              <h1 className="mt-5 break-all text-3xl font-medium tracking-tight sm:text-4xl">
                {order.orderNumber}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/40">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} />
                  {formatDateTime(order.createdAt)}
                </span>

                <span className="text-white/15">
                  /
                </span>

                <span>
                  {serviceName}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <StatusBadge
                status={order.orderStatus}
              />

              <button
                type="button"
                onClick={() => loadOrder(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Summary Cards */}

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon={User}
              label="Client"
              value={clientName}
            />

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
              icon={CreditCard}
              label="Amount"
              value={`₹${Number(
                order.amount || 0
              ).toLocaleString("en-IN")}`}
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          MESSAGES
      ====================================================== */}

      {message && (
        <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm text-green-300">
          {message}
        </div>
      )}

      {error && order && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          <XCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* =====================================================
            CLIENT INFORMATION
        ====================================================== */}

        <InfoCard
          icon={User}
          eyebrow="Client"
          title="Client Information"
        >
          <InfoRow
            label="Name"
            value={clientName}
          />

          <InfoRow
            label="Email"
            value={
              order.client?.email || "—"
            }
          />

          <InfoRow
            label="Username"
            value={
              order.client?.username || "—"
            }
          />
        </InfoCard>

        {/* =====================================================
            ORDER STATUS
        ====================================================== */}

        <InfoCard
          icon={Clipboard}
          eyebrow="Workflow"
          title="Order Status"
        >
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/30">
                  Current Status
                </p>

                <p className="mt-1 text-sm text-white/70">
                  {formatStatus(
                    order.orderStatus
                  )}
                </p>
              </div>

              <StatusBadge
                status={order.orderStatus}
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="order-status"
              className="mb-2 block text-[10px] font-medium uppercase tracking-[0.15em] text-white/30"
            >
              Update Status
            </label>

            <div className="relative">
              <select
                id="order-status"
                value={
                  order.orderStatus ||
                  "pending"
                }
                onChange={
                  handleStatusChange
                }
                disabled={statusLoading}
                className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-4 pr-10 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option
                  value="pending"
                  className="bg-[#111111] text-white"
                >
                  Pending
                </option>

                <option
                  value="processing"
                  className="bg-[#111111] text-white"
                >
                  Processing
                </option>

                <option
                  value="in_progress"
                  className="bg-[#111111] text-white"
                >
                  In Progress
                </option>

                <option
                  value="completed"
                  className="bg-[#111111] text-white"
                >
                  Completed
                </option>

                <option
                  value="cancelled"
                  className="bg-[#111111] text-white"
                >
                  Cancelled
                </option>
              </select>

              {statusLoading && (
                <Loader2
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-white/40"
                />
              )}
            </div>
          </div>

          {isCancelled && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs leading-5 text-red-300">
              This order has been cancelled.
            </div>
          )}

          {isCompleted && (
            <div className="mt-4 rounded-xl border border-green-400/20 bg-green-400/[0.06] px-4 py-3 text-xs leading-5 text-green-300">
              This order has been completed.
            </div>
          )}

          <div className="mt-5 border-t border-white/[0.07] pt-4">
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
          </div>
        </InfoCard>

        {/* =====================================================
            PAYMENT INFORMATION
        ====================================================== */}

        <InfoCard
          icon={CreditCard}
          eyebrow="Payment"
          title="Payment Information"
        >
          <InfoRow
            label="Method"
            value={formatStatus(
              order.paymentMethod
            )}
          />

          <InfoRow
            label="Current Payment Status"
            value={
              <PaymentStatusBadge
                status={
                  order.paymentStatus
                }
              />
            }
          />

          <InfoRow
            label="Amount"
            value={`₹${Number(
              order.amount || 0
            ).toLocaleString("en-IN")}`}
          />

          {/* Payment Status Control */}

          <div className="mt-5 border-t border-white/[0.07] pt-5">
            <label
              htmlFor="payment-status"
              className="mb-2 block text-[10px] font-medium uppercase tracking-[0.15em] text-white/30"
            >
              Update Payment Status
            </label>

            <div className="relative">
              <select
                id="payment-status"
                value={
                  order.paymentStatus ||
                  "pending"
                }
                onChange={
                  handlePaymentStatusChange
                }
                disabled={
                  paymentLoading ||
                  order.paymentStatus ===
                    "collected"
                }
                className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-4 pr-10 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paymentOptions.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                      className="bg-[#111111] text-white"
                    >
                      {formatStatus(status)}
                    </option>
                  )
                )}
              </select>

              {paymentLoading && (
                <Loader2
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-white/40"
                />
              )}
            </div>

            {isCod && (
              <p className="mt-3 text-xs leading-5 text-white/30">
                COD payment is marked as
                collected only after successful
                PIN verification.
              </p>
            )}
          </div>

          {order.razorpayOrderId && (
            <InfoRow
              label="Razorpay Order ID"
              value={
                order.razorpayOrderId
              }
            />
          )}

          {order.razorpayPaymentId && (
            <InfoRow
              label="Razorpay Payment ID"
              value={
                order.razorpayPaymentId
              }
            />
          )}

          {order.razorpaySignature && (
            <InfoRow
              label="Razorpay Signature"
              value={
                order.razorpaySignature
              }
            />
          )}
        </InfoCard>

        {/* =====================================================
            COD MANAGEMENT
        ====================================================== */}

        {isCod && (
          <InfoCard
            icon={KeyRound}
            eyebrow="Cash on Delivery"
            title="COD Payment"
          >
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/30">
                    PIN Status
                  </p>

                  <p className="mt-1 text-sm text-white/70">
                    {formatCodPinStatus(
                      order.codPinStatus
                    )}
                  </p>
                </div>

                <CodPinStatusBadge
                  status={
                    order.codPinStatus
                  }
                />
              </div>
            </div>

            {hasCodPin ? (
              <div className="mt-5">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white/30">
                  COD PIN
                </p>

                <div className="flex gap-2">
                  <div className="flex min-w-0 flex-1 items-center rounded-xl border border-white/10 bg-black px-5 py-3.5">
                    <span className="font-mono text-xl tracking-[0.3em] text-white">
                      {order.codPin}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={copyPin}
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                    title="Copy PIN"
                  >
                    {copied ? (
                      <Check size={18} />
                    ) : (
                      <Clipboard size={18} />
                    )}
                  </button>
                </div>

                <p className="mt-3 text-xs leading-5 text-white/30">
                  Share this PIN with the payment
                  collector. The client will enter
                  the PIN from their order page.
                </p>
              </div>
            ) : (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={
                    handleGenerateCodPin
                  }
                  disabled={codLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {codLoading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Generating...
                    </>
                  ) : (
                    <>
                      <KeyRound size={17} />
                      Generate COD PIN
                    </>
                  )}
                </button>
              </div>
            )}

            {order.codPinVerifiedAt && (
              <div className="mt-5 border-t border-white/[0.07] pt-4">
                <InfoRow
                  label="PIN Verified"
                  value={formatDateTime(
                    order.codPinVerifiedAt
                  )}
                />
              </div>
            )}

            {order.codCollectedAt && (
              <div className="border-t border-white/[0.07]">
                <InfoRow
                  label="Payment Collected"
                  value={formatDateTime(
                    order.codCollectedAt
                  )}
                />
              </div>
            )}

            {order.paymentStatus ===
              "collected" && (
              <div className="mt-4 rounded-xl border border-green-400/20 bg-green-400/[0.06] px-4 py-3 text-sm text-green-300">
                COD payment has been collected.
              </div>
            )}
          </InfoCard>
        )}

        {/* =====================================================
            ADMIN NOTES
        ====================================================== */}

        <InfoCard
          icon={FileText}
          eyebrow="Internal"
          title="Admin Notes"
        >
          <p className="mb-4 text-xs leading-5 text-white/30">
            These notes are for internal admin use
            and are not visible to the client.
          </p>

          <textarea
            value={adminNotes}
            onChange={(event) =>
              setAdminNotes(
                event.target.value
              )
            }
            rows={7}
            placeholder="Add internal notes about this order..."
            className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 transition focus:border-white/25 focus:bg-white/[0.05]"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/25">
              {adminNotes.length} characters
            </p>

            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={
                notesLoading ||
                !notesChanged
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {notesLoading ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
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
      </div>

      {/* =====================================================
          PROJECT REQUIREMENTS
      ====================================================== */}

      <div className="mt-6 rounded-[24px] border border-white/10 bg-[#111111] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
            <FileText
              size={18}
              className="text-white/50"
            />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
              Requirements
            </p>

            <h2 className="mt-1 text-lg font-medium">
              Project Details
            </h2>
          </div>
        </div>

        {Object.keys(formData).length ===
        0 ? (
          <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 text-sm text-white/35">
            No project requirements were
            provided.
          </div>
        ) : (
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
        )}
      </div>

      {/* =====================================================
          ORDER NOTES SUMMARY
      ====================================================== */}

      {order.notes && (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-[#111111] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <FileText
                size={18}
                className="text-white/50"
              />
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
                Internal
              </p>

              <h2 className="mt-1 text-lg font-medium">
                Saved Notes
              </h2>
            </div>
          </div>

          <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-7 text-white/60">
            {order.notes}
          </p>
        </div>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

const SummaryCard = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] transition duration-300 group-hover:border-white/20 group-hover:bg-white/[0.06]">
          <Icon
            size={17}
            strokeWidth={1.6}
            className="text-white/45 transition group-hover:text-white/70"
          />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/30">
            {label}
          </p>

          <p className="mt-1 truncate text-sm font-medium text-white/80">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Info Card
|--------------------------------------------------------------------------
*/

const InfoCard = ({
  icon: Icon,
  eyebrow,
  title,
  children,
}) => {
  return (
    <div className="group rounded-[24px] border border-white/10 bg-[#111111] p-6 transition duration-300 hover:border-white/[0.16] hover:shadow-[0_18px_60px_rgba(0,0,0,0.12)] sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] transition duration-300 group-hover:border-white/20 group-hover:bg-white/[0.055]">
          <Icon
            size={18}
            strokeWidth={1.6}
            className="text-white/50"
          />
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-lg font-medium">
            {title}
          </h2>
        </div>
      </div>

      <div className="mt-6">
        {children}
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Info Row
|--------------------------------------------------------------------------
*/

const InfoRow = ({
  label,
  value,
}) => {
  return (
    <div className="flex flex-col gap-1.5 border-b border-white/[0.07] py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <span className="text-sm text-white/40">
        {label}
      </span>

      <span className="break-all text-left text-sm text-white/70 sm:text-right">
        {value}
      </span>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Detail Field
|--------------------------------------------------------------------------
*/

const DetailField = ({
  label,
  value,
}) => {
  return (
    <div className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition duration-300 hover:border-white/[0.14] hover:bg-white/[0.035]">
      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/30">
        {label}
      </p>

      <div className="mt-2 break-words text-sm leading-6 text-white/70">
        {value || "—"}
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Order Status Badge
|--------------------------------------------------------------------------
*/

const StatusBadge = ({ status }) => {
  const config = {
    pending: {
      label: "Pending",
      className:
        "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
    },

    processing: {
      label: "Processing",
      className:
        "border-blue-400/20 bg-blue-400/[0.08] text-blue-300",
    },

    in_progress: {
      label: "In Progress",
      className:
        "border-purple-400/20 bg-purple-400/[0.08] text-purple-300",
    },

    completed: {
      label: "Completed",
      className:
        "border-green-400/20 bg-green-400/[0.08] text-green-300",
    },

    cancelled: {
      label: "Cancelled",
      className:
        "border-red-400/20 bg-red-400/[0.08] text-red-300",
    },
  };

  const current =
    config[status] || {
      label: formatStatus(status),
      className:
        "border-white/10 bg-white/[0.04] text-white/50",
    };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium ${current.className}`}
    >
      {current.label}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| Payment Status Badge
|--------------------------------------------------------------------------
*/

const PaymentStatusBadge = ({
  status,
}) => {
  const config = {
    paid: {
      label: "Paid",
      className:
        "border-green-400/20 bg-green-400/[0.08] text-green-300",
    },

    collected: {
      label: "Collected",
      className:
        "border-green-400/20 bg-green-400/[0.08] text-green-300",
    },

    processing: {
      label: "Processing",
      className:
        "border-blue-400/20 bg-blue-400/[0.08] text-blue-300",
    },

    failed: {
      label: "Failed",
      className:
        "border-red-400/20 bg-red-400/[0.08] text-red-300",
    },

    pending: {
      label: "Pending",
      className:
        "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
    },
  };

  const current =
    config[status] || {
      label: formatStatus(status),
      className:
        "border-white/10 bg-white/[0.04] text-white/60",
    };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${current.className}`}
    >
      {current.label}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| COD PIN Status Badge
|--------------------------------------------------------------------------
*/

const CodPinStatusBadge = ({
  status,
}) => {
  const config = {
    not_generated: {
      label: "Not Generated",
      className:
        "border-white/10 bg-white/[0.04] text-white/50",
    },

    active: {
      label: "Active",
      className:
        "border-blue-400/20 bg-blue-400/[0.08] text-blue-300",
    },

    verified: {
      label: "Verified",
      className:
        "border-green-400/20 bg-green-400/[0.08] text-green-300",
    },

    used: {
      label: "Used",
      className:
        "border-green-400/20 bg-green-400/[0.08] text-green-300",
    },

    expired: {
      label: "Expired",
      className:
        "border-red-400/20 bg-red-400/[0.08] text-red-300",
    },
  };

  const current =
    config[status] || {
      label: formatCodPinStatus(status),
      className:
        "border-white/10 bg-white/[0.04] text-white/50",
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
| Helpers
|--------------------------------------------------------------------------
*/

const formatLabel = (value) => {
  return String(value)
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
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
    if (Array.isArray(value)) {
      return value.join(", ");
    }

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
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const formatCodPinStatus = (
  status
) => {
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

  return (
    labels[status] ||
    formatStatus(status)
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

export default AdminOrderDetails;