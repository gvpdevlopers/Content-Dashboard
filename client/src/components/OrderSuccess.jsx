import {
  CheckCircle2,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const OrderSuccess = ({ order }) => {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">

      <div className="w-full rounded-[28px] border border-white/10 bg-[#111111] p-6 text-center sm:p-10">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-black">
          <CheckCircle2 size={30} />
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/30">
          Order Created
        </p>

        <h1 className="mt-2 text-3xl font-medium tracking-tight">
          Order placed successfully
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/40">
          Your order has been submitted successfully. Our team will
          review the requirements and process your request.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">

          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <span className="text-sm text-white/40">
              Order Number
            </span>

            <span className="text-sm font-medium">
              {order.orderNumber}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-white/10 py-4">
            <span className="text-sm text-white/40">
              Service
            </span>

            <span className="text-sm font-medium">
              {order.service?.name}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-white/10 py-4">
            <span className="text-sm text-white/40">
              Amount
            </span>

            <span className="text-sm font-medium">
              ₹{Number(order.amount).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4">
            <span className="text-sm text-white/40">
              Payment
            </span>

            <span className="text-sm font-medium uppercase">
              {order.paymentMethod}
            </span>
          </div>

        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">

          <Link
            to={`/dashboard/orders/${order.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            View Order
            <ArrowRight size={16} />
          </Link>

          <Link
            to="/dashboard/orders"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
          >
            <ClipboardList size={16} />
            Order History
          </Link>

        </div>

      </div>

    </div>
  );
};

export default OrderSuccess;