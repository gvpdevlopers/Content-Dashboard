import { useEffect } from "react";

// Watch pending collections too, so a newly generated PIN appears without reload.
export default function useCollectionPaymentRefresh(orders, reload) {
  const watching = orders.some((order) => ["cod", "cheque"].includes(order?.paymentMethod) &&
    !["paid", "collected"].includes(order.paymentStatus) && order.orderStatus !== "cancelled");
  useEffect(() => {
    if (!watching) return;
    const refresh = () => { if (document.visibilityState === "visible") reload(true); };
    const interval = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [watching, reload]);
}
