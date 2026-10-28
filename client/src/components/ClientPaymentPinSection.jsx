import { KeyRound } from "lucide-react";
import PaymentPinForm from "./PaymentPinForm";
import PaymentStatusBadge from "./PaymentStatusBadge";
import { canUseOrderPaymentPin } from "../utils/paymentPin";

export default function ClientPaymentPinSection({ order, user, onVerified }) {
  if (user?.role !== "client" || !["cod", "cheque"].includes(order?.paymentMethod)) return null;
  const paid = ["paid", "collected"].includes(order.paymentStatus);
  const active = canUseOrderPaymentPin(order, user);
  return <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6" aria-label="Payment collection confirmation">
    <h2 className="flex items-center gap-2 text-lg font-medium text-zinc-900"><KeyRound size={18} className="text-zinc-500" />Payment confirmation</h2>
    {paid ? <div role="status" className="mt-4 space-y-2"><PaymentStatusBadge status="paid" /><p className="text-sm text-zinc-600">Payment has been completed. Thank you.</p></div>
      : active ? <><p className="mt-2 text-sm leading-6 text-zinc-500">After the employee collects your {order.paymentMethod === "cheque" ? "cheque" : "cash payment"}, enter the PIN they provide. Successful verification marks this order as Paid.</p>
        <PaymentPinForm key={`${order._id}:${order.codPinGeneratedAt}`} order={order} onVerified={onVerified} /></>
        : <p className="mt-3 text-sm text-zinc-500">{order.orderStatus === "cancelled" ? "PIN verification is unavailable for a cancelled order." : ["disabled", "locked", "expired"].includes(order.codPinStatus) ? "This PIN is unavailable. Contact your administrator for a new PIN." : ["used", "verified"].includes(order.codPinStatus) ? "This PIN has already been used. Contact your administrator to review the saved payment status." : "A PIN is not available yet. The assigned employee will provide it when collecting payment."}</p>}
  </section>;
}
