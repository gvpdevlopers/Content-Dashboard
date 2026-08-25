import {
  CheckCircle2,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

import { Link } from "react-router-dom";

const OrderSuccess = ({ order }) => {
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
              Amount
            </span>

            <span className="text-sm font-medium text-zinc-900">
              ₹{Number(order.amount).toLocaleString("en-IN")}
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
              {order.paymentMethod}
            </span>
          </div>
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
  to={`/dashboard/orders/${order.id}`}
  className="
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
    hover:scale-[1.01]
    active:scale-[0.99]
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
            className="
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
              active:scale-[0.98]
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

export default OrderSuccess;