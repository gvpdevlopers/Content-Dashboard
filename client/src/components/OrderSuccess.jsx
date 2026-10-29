import {
  CheckCircle2,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

import { Link } from "react-router-dom";
import AdCreditBreakdown from "./AdCreditBreakdown";

const OrderSuccess = ({ order }) => {
  const orderId = order?._id || order?.id;
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
      <div
        className="
          w-full
          rounded-[28px]
          border border-zinc-200
          bg-white
          p-6
          text-center
          shadow-[0_12px_40px_rgba(0,0,0,0.06)]
          animate-fade-up
          sm:p-10
        "
      >
        <div
          className="
            mx-auto
            flex h-16 w-16
            items-center justify-center
            rounded-full
            bg-zinc-900
            text-white
            shadow-[0_8px_25px_rgba(0,0,0,0.10)]
          "
        >
          <CheckCircle2 size={30} />
        </div>

        <p
          className="
            mt-6
            text-xs
            uppercase
            tracking-[0.2em]
            text-zinc-400
          "
        >
          Order Created
        </p>

        <h1 className="mt-2 text-3xl font-medium tracking-tight text-zinc-900">
          Order placed successfully
        </h1>

        <p
          className="
            mx-auto
            mt-3
            max-w-md
            text-sm
            leading-6
            text-zinc-500
          "
        >
          Your order has been submitted successfully. Our team will
          review the requirements and process your request.
        </p>

        {/* ORDER SUMMARY */}
        <AdCreditBreakdown order={order} />
        <div
          className="
            mt-8
            rounded-2xl
            border border-zinc-200
            bg-zinc-50
            p-5
            text-left
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              border-b border-zinc-200
              pb-4
            "
          >
            <span className="text-sm text-zinc-500">
              Order Number
            </span>

            <span className="text-sm font-medium text-zinc-900">
              {order.orderNumber}
            </span>
          </div>

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              border-b border-zinc-200
              py-4
            "
          >
            <span className="text-sm text-zinc-500">
              Service
            </span>

            <span className="text-right text-sm font-medium text-zinc-900">
              {order.service?.name}
            </span>
          </div>

          <div className="space-y-3 border-b border-zinc-200 py-4">
            <PriceRow label="Subtotal" value={order.subtotal ?? order.amount} />
            <PriceRow label={`GST (${order.gstRate ?? 0}%)`} value={order.gstAmount ?? 0} />
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-zinc-200 py-4">
            <span className="text-sm font-medium text-zinc-700">Final total</span>
            <span className="text-sm font-semibold text-zinc-900">
              ₹{Number(order.amount || 0).toLocaleString("en-IN")}
            </span>
          </div>

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              pt-4
            "
          >
            <span className="text-sm text-zinc-500">
              Payment
            </span>

            <span className="text-sm font-medium uppercase text-zinc-900">
              {order.paymentMethod === "month_end"
                ? "Pay on Month-End"
                : order.paymentMethod === "online"
                  ? "Pay Online"
                  : order.paymentMethod === "cheque"
                    ? "Cheque"
                    : "COD"}
            </span>
          </div>
          {order.paymentMethod === "month_end" && (
            <div className="pt-4 text-left text-xs leading-5 text-zinc-500">
              <p>Payment status: {order.paymentStatus === "paid" ? "Payment Done" : "Pending"}</p>
              {order.paymentStatus !== "paid" && <p>Payment is due at the end of the month.</p>}
            </div>
          )}
          {order.paymentMethod === "cheque" && (
            <div className="flex items-center justify-between gap-4 pt-4">
              <span className="text-sm text-zinc-500">Cheque type</span>
              <span className="text-sm font-medium text-zinc-900">
                {order.chequeType === "with_gst"
                  ? "With GST"
                  : "Direct Collection"}
              </span>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div
          className="
            mt-7
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:justify-center
          "
        >
         <Link
  to={orderId ? `/dashboard/orders/${orderId}` : "/dashboard/orders"}
  className="dashboard-action dashboard-action--primary
    group
    inline-flex
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
    !text-white
    shadow-sm
    transition-[transform,background-color,box-shadow]
    duration-300
    ease-out
    hover:bg-zinc-800
    hover:!text-white
    hover:shadow-md
  "
>
  <span className="!text-white">
    View Order
  </span>

  <ArrowRight
    size={16}
    className="
      !text-white
      transition-transform
      duration-300
      ease-out
      group-hover:translate-x-0.5
    "
  />
</Link>

          <Link
            to="/dashboard/orders"
            className="dashboard-action dashboard-action--secondary
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border border-zinc-200
              bg-white
              px-5
              py-3
              text-sm
              text-zinc-600
              transition-all
              duration-200
              hover:border-zinc-300
              hover:bg-zinc-50
              hover:text-zinc-900
              hover:shadow-sm
            "
          >
            <ClipboardList size={16} />
            Order History
          </Link>
        </div>
      </div>
    </div>
  );
};

const PriceRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-sm text-zinc-500">{label}</span>
    <span className="text-sm font-medium text-zinc-900">
      ₹{Number(value || 0).toLocaleString("en-IN")}
    </span>
  </div>
);

export default OrderSuccess;
