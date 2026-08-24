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

  /* =====================================================
     ORDER STATUS
  ====================================================== */

  const handleStatusChange = async (value) => {
    const newStatus = value;

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

  /* =====================================================
     PAYMENT STATUS
  ====================================================== */

  const handlePaymentStatusChange = async (value) => {
    const newPaymentStatus = value;

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

  /* =====================================================
     ADMIN NOTES
  ====================================================== */

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

      const updatedNotes =
        data.order?.notes !== undefined
          ? data.order.notes
          : adminNotes;

      setOrder((currentOrder) => ({
        ...currentOrder,
        notes: updatedNotes,
      }));

      setAdminNotes(updatedNotes);

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

  /* =====================================================
     COD PIN
  ====================================================== */

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
          data.order?.codPinStatus ||
          "active",
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

  /* =====================================================
     LOADING
  ====================================================== */

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
        <div className="flex flex-col items-center gap-4 text-center">

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

  /* =====================================================
     ERROR
  ====================================================== */

  if (error && !order) {
    return (
      <div
        className="
          mx-auto
          flex
          min-h-[60vh]
          max-w-xl
          items-center
          justify-center
          px-5
          text-center
        "
      >
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

          <h1
            className="
              mt-5
              text-xl
              font-medium
              text-zinc-900
            "
          >
            Unable to load order
          </h1>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-zinc-500
            "
          >
            {error}
          </p>

          <Link
            to="/admin/orders"
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
              font-medium
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

  if (!order) {
    return null;
  }

  /* =====================================================
     DERIVED VALUES
  ====================================================== */

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
    <div className="mx-auto max-w-[1200px] animate-fade-up">

      {/* =====================================================
          BACK
      ====================================================== */}

      <Link
        to="/admin/orders"
        className="
          group
          mb-6
          inline-flex
          items-center
          gap-2
          rounded-lg
          py-1
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

        Back to Orders
      </Link>

      {/* =====================================================
          PAGE HEADER
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
                    shadow-sm
                    transition
                    duration-200
                    group-hover:border-zinc-300
                    group-hover:bg-white
                    group-hover:text-zinc-800
                  "
                >
                  <Package
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
                  Order
                </p>

              </div>

              <h1
                className="
                  mt-5
                  break-all
                  text-3xl
                  font-medium
                  tracking-tight
                  text-zinc-900
                  sm:text-4xl
                "
              >
                {order.orderNumber}
              </h1>

              <div
                className="
                  mt-3
                  flex
                  flex-wrap
                  items-center
                  gap-x-5
                  gap-y-2
                  text-sm
                  text-zinc-500
                "
              >
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} />
                  {formatDateTime(order.createdAt)}
                </span>

                <span className="text-zinc-300">
                  /
                </span>

                <span>
                  {serviceName}
                </span>
              </div>

            </div>

            <div
              className="
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
              "
            >
              <StatusBadge
                status={order.orderStatus}
              />

              <button
                type="button"
                onClick={() => loadOrder(true)}
                disabled={refreshing}
                className="
                  group/refresh
                  inline-flex
                  items-center
                  justify-center
                  gap-2
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
                "
              >
                <RefreshCw
                  size={15}
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

          </div>

          {/* Summary Cards */}

          <div
            className="
              mt-8
              grid
              gap-3
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >

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
        <div
          className="
            mt-6
            flex
            items-start
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
          <Check
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{message}</span>
        </div>
      )}

      {error && order && (
        <div
          className="
            mt-6
            flex
            items-start
            gap-3
            rounded-2xl
            border border-red-200
            bg-red-50
            px-5
            py-4
            text-sm
            text-red-600
          "
        >
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

        {/* ===================================================
            CLIENT INFORMATION
        ==================================================== */}

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
            value={order.client?.email || "—"}
          />

          <InfoRow
            label="Username"
            value={order.client?.username || "—"}
          />
        </InfoCard>

        {/* ===================================================
            ORDER STATUS
        ==================================================== */}

        <InfoCard
          icon={Clipboard}
          eyebrow="Workflow"
          title="Order Status"
        >
          <div
            className="
              rounded-xl
              border border-zinc-200
              bg-zinc-50
              p-4
            "
          >
            <div
              className="
                flex
                items-center
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
                  Current Status
                </p>

                <p className="mt-1 text-sm text-zinc-700">
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
              className="
                mb-2
                block
                text-[10px]
                font-medium
                uppercase
                tracking-[0.15em]
                text-zinc-400
              "
            >
              Update Status
            </label>

            <div className="relative">

              <CustomSelect
                value={
                  order.orderStatus ||
                  "pending"
                }
                onChange={handleStatusChange}
                disabled={statusLoading}
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
                <Loader2
                  size={16}
                  className="
                    pointer-events-none
                    absolute
                    right-4
                    top-1/2
                    z-20
                    -translate-y-1/2
                    animate-spin
                    text-zinc-400
                  "
                />
              )}

            </div>
          </div>

          {isCancelled && (
            <div
              className="
                mt-4
                rounded-xl
                border border-red-200
                bg-red-50
                px-4
                py-3
                text-xs
                leading-5
                text-red-600
              "
            >
              This order has been cancelled.
            </div>
          )}

          {isCompleted && (
            <div
              className="
                mt-4
                rounded-xl
                border border-emerald-200
                bg-emerald-50
                px-4
                py-3
                text-xs
                leading-5
                text-emerald-700
              "
            >
              This order has been completed.
            </div>
          )}

          <div
            className="
              mt-5
              border-t
              border-zinc-100
              pt-4
            "
          >
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

        {/* ===================================================
            PAYMENT INFORMATION
        ==================================================== */}

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

          {/* Payment Status */}

          <div
            className="
              mt-5
              border-t
              border-zinc-100
              pt-5
            "
          >
            <label
              className="
                mb-2
                block
                text-[10px]
                font-medium
                uppercase
                tracking-[0.15em]
                text-zinc-400
              "
            >
              Update Payment Status
            </label>

            <div className="relative">

              <select
                value={
                  order.paymentStatus ||
                  "pending"
                }
                onChange={(event) =>
                  handlePaymentStatusChange(
                    event.target.value
                  )
                }
                disabled={
                  paymentLoading ||
                  order.paymentStatus ===
                    "collected"
                }
                className="
                  h-12
                  w-full
                  appearance-none
                  rounded-xl
                  border border-zinc-200
                  bg-zinc-50
                  px-4
                  pr-10
                  text-sm
                  text-zinc-800
                  outline-none
                  transition
                  duration-200
                  hover:border-zinc-300
                  hover:bg-white
                  focus:border-zinc-400
                  focus:bg-white
                  focus:ring-2
                  focus:ring-zinc-900/5
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {paymentOptions.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatStatus(
                        status
                      )}
                    </option>
                  )
                )}
              </select>

              {paymentLoading && (
                <Loader2
                  size={16}
                  className="
                    pointer-events-none
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    animate-spin
                    text-zinc-400
                  "
                />
              )}

            </div>

            {isCod && (
              <p
                className="
                  mt-3
                  text-xs
                  leading-5
                  text-zinc-400
                "
              >
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

        {/* ===================================================
            COD MANAGEMENT
        ==================================================== */}

        {isCod && (
          <InfoCard
            icon={KeyRound}
            eyebrow="Cash on Delivery"
            title="COD Payment"
          >
            <div
              className="
                rounded-xl
                border border-zinc-200
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

                  <p className="mt-1 text-sm text-zinc-700">
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
                      border border-zinc-200
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
                      border border-zinc-200
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
                    {copied ? (
                      <Check size={18} />
                    ) : (
                      <Clipboard size={18} />
                    )}
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
                  Share this PIN with the
                  payment collector. The client
                  will enter the PIN from their
                  order page.
                </p>
              </div>
            ) : (
              <div className="mt-5">

                <button
                  type="button"
                  onClick={handleGenerateCodPin}
                  disabled={codLoading}
                  className="
                    group
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
                  "
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
                      <KeyRound
                        size={17}
                      />

                      Generate COD PIN
                    </>
                  )}
                </button>

              </div>
            )}

            {order.codPinVerifiedAt && (
              <div
                className="
                  mt-5
                  border-t
                  border-zinc-100
                  pt-4
                "
              >
                <InfoRow
                  label="PIN Verified"
                  value={formatDateTime(
                    order.codPinVerifiedAt
                  )}
                />
              </div>
            )}

            {order.codCollectedAt && (
              <div
                className="
                  border-t
                  border-zinc-100
                "
              >
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
              <div
                className="
                  mt-4
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  border border-emerald-200
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

        {/* ===================================================
            ADMIN NOTES
        ==================================================== */}

        <InfoCard
          icon={FileText}
          eyebrow="Internal"
          title="Admin Notes"
        >
          <p
            className="
              mb-4
              text-xs
              leading-5
              text-zinc-400
            "
          >
            These notes are for internal admin
            use and are not visible to the client.
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
            className="
              w-full
              resize-y
              rounded-xl
              border border-zinc-200
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
              disabled={
                notesLoading ||
                !notesChanged
              }
              className="
                group
                inline-flex
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
                disabled:opacity-40
              "
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

      <div
        className="
          group
          relative
          mt-6
          overflow-hidden
          rounded-[24px]
          border border-zinc-200
          bg-white
          p-6
          shadow-[0_15px_55px_rgba(0,0,0,0.05)]
          transition
          duration-300
          hover:border-zinc-300
          hover:shadow-[0_20px_65px_rgba(0,0,0,0.07)]
          sm:p-8
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

          <div className="flex items-center gap-3">

            <div
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-xl
                border border-zinc-200
                bg-zinc-50
              "
            >
              <FileText
                size={18}
                className="text-zinc-500"
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
                Requirements
              </p>

              <h2 className="mt-1 text-lg font-medium text-zinc-900">
                Project Details
              </h2>

            </div>
          </div>

          {Object.keys(formData).length ===
          0 ? (
            <div
              className="
                mt-6
                rounded-xl
                border border-zinc-200
                bg-zinc-50
                p-5
                text-sm
                text-zinc-400
              "
            >
              No project requirements were
              provided.
            </div>
          ) : (
            <div
              className="
                mt-7
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              {Object.entries(
                formData
              ).map(
                ([key, value]) => (
                  <DetailField
                    key={key}
                    label={formatLabel(key)}
                    value={formatValue(
                      value
                    )}
                  />
                )
              )}
            </div>
          )}

        </div>
      </div>

      {/* =====================================================
          SAVED NOTES
      ====================================================== */}

      {order.notes && (
        <div
          className="
            group
            relative
            mt-6
            overflow-hidden
            rounded-[24px]
            border border-zinc-200
            bg-white
            p-6
            shadow-[0_15px_55px_rgba(0,0,0,0.05)]
            transition
            duration-300
            hover:border-zinc-300
            sm:p-8
          "
        >
          <div className="relative">

            <div className="flex items-center gap-3">

              <div
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  border border-zinc-200
                  bg-zinc-50
                "
              >
                <FileText
                  size={18}
                  className="text-zinc-500"
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
                  Internal
                </p>

                <h2 className="mt-1 text-lg font-medium text-zinc-900">
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

          </div>
        </div>
      )}

    </div>
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div
      className="
        group/card
        rounded-2xl
        border border-zinc-200
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
            border border-zinc-200
            bg-white
            text-zinc-400
            shadow-sm
            transition
            duration-200
            group-hover/card:border-zinc-300
            group-hover/card:text-zinc-700
          "
        >
          <Icon
            size={17}
            strokeWidth={1.6}
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

          <p
            className="
              mt-1
              truncate
              text-sm
              font-medium
              text-zinc-800
            "
          >
            {value}
          </p>

        </div>
      </div>
    </div>
  );
};

/* =========================================================
   INFO CARD
========================================================= */

const InfoCard = ({
  icon: Icon,
  eyebrow,
  title,
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
              border border-zinc-200
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

            <h2 className="mt-1 text-lg font-medium text-zinc-900">
              {title}
            </h2>

          </div>
        </div>

        <div className="relative mt-6">
          {children}
        </div>

      </div>
    </div>
  );
};

/* =========================================================
   INFO ROW
========================================================= */

const InfoRow = ({
  label,
  value,
}) => {
  return (
    <div
      className="
        flex
        flex-col
        gap-1.5
        border-b
        border-zinc-100
        py-3.5
        last:border-b-0
        sm:flex-row
        sm:items-center
        sm:justify-between
        sm:gap-5
      "
    >
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <span
        className="
          break-all
          text-left
          text-sm
          text-zinc-700
          sm:text-right
        "
      >
        {value}
      </span>
    </div>
  );
};

/* =========================================================
   DETAIL FIELD
========================================================= */

const DetailField = ({
  label,
  value,
}) => {
  return (
    <div
      className="
        group/field
        rounded-xl
        border border-zinc-200
        bg-zinc-50
        p-4
        transition
        duration-200
        hover:border-zinc-300
        hover:bg-white
        hover:shadow-sm
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
        {label}
      </p>

      <div
        className="
          mt-2
          break-words
          text-sm
          leading-6
          text-zinc-600
        "
      >
        {value || "—"}
      </div>
    </div>
  );
};

/* =========================================================
   ORDER STATUS BADGE
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
        px-3
        py-1.5
        text-[11px]
        font-medium
        ${current.className}
      `}
    >
      {current.label}
    </span>
  );
};

/* =========================================================
   PAYMENT STATUS BADGE
========================================================= */

const PaymentStatusBadge = ({
  status,
}) => {
  const config = {
    paid: {
      label: "Paid",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    collected: {
      label: "Collected",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    processing: {
      label: "Processing",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    },

    failed: {
      label: "Failed",
      className:
        "border-red-200 bg-red-50 text-red-700",
    },

    pending: {
      label: "Pending",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
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
        rounded-full
        border
        px-2.5
        py-1
        text-[11px]
        font-medium
        ${current.className}
      `}
    >
      {current.label}
    </span>
  );
};

/* =========================================================
   COD PIN STATUS BADGE
========================================================= */

const CodPinStatusBadge = ({
  status,
}) => {
  const config = {
    not_generated: {
      label: "Not Generated",
      className:
        "border-zinc-200 bg-zinc-50 text-zinc-500",
    },

    active: {
      label: "Active",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    },

    verified: {
      label: "Verified",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    used: {
      label: "Used",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    expired: {
      label: "Expired",
      className:
        "border-red-200 bg-red-50 text-red-700",
    },
  };

  const current =
    config[status] || {
      label: formatCodPinStatus(status),
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
   HELPERS
========================================================= */

const formatLabel = (
  value
) => {
  return String(value)
    .replace(
      /([A-Z])/g,
      " $1"
    )
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    )
    .trim();
};

const formatValue = (
  value
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  if (
    typeof value ===
    "object"
  ) {
    if (
      Array.isArray(value)
    ) {
      return value.join(
        ", "
      );
    }

    return JSON.stringify(
      value
    );
  }

  return String(value);
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

const formatCodPinStatus = (
  status
) => {
  if (!status) {
    return "Not Generated";
  }

  const labels = {
    not_generated:
      "Not Generated",

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

const formatDateTime = (
  date
) => {
  if (!date) {
    return "—";
  }

  return new Date(
    date
  ).toLocaleString(
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