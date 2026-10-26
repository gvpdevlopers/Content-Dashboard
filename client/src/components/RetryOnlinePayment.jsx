import { useRef, useState } from "react";
import { toast } from "sonner";
import paymentService from "../services/paymentService";
import orderService from "../services/orderService";

export default function RetryOnlinePayment({ order, onPaid }) {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  if (order.paymentMethod !== "online" || order.paymentStatus === "paid" ||
      order.orderStatus === "cancelled") return null;

  const pay = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    const finish = () => { inFlight.current = false; setBusy(false); };
    const paid = async () => {
      orderService.clearPendingCheckout();
      const latest = await orderService.getOrderById(order._id || order.id);
      onPaid(latest.order);
      toast.success("Payment confirmed.");
    };
    try {
      const data = await paymentService.createRazorpayOrder(order._id || order.id);
      if (data.alreadyPaid) { await paid(); finish(); return; }
      if (!window.Razorpay) throw new Error("Payment checkout could not load. Please refresh and retry.");
      const checkout = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: data.razorpayOrder.id,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Glow Ventures",
        description: order.orderNumber,
        handler: async (result) => {
          try {
            await paymentService.verifyRazorpayPayment({ orderId: order._id || order.id, ...result });
            await paid();
          } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Payment confirmation failed. Please retry.");
          } finally { finish(); }
        },
        modal: { ondismiss: finish },
      });
      checkout.open();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to initialize payment.");
      finish();
    }
  };
  return (
    <button type="button" onClick={pay} disabled={busy}
      className="dashboard-action dashboard-action--primary mt-4 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">
      {busy ? "Processing payment..." : "Pay online / retry payment"}
    </button>
  );
}
