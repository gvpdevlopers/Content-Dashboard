import { useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { KeyRound, RefreshCw } from "lucide-react";
import codService from "../services/codService";
import useAsyncResource from "../hooks/useAsyncResource";

export default function AssignedPaymentPins() {
  const load = useCallback(async () => (await codService.getAssignedPins()).orders || [], []);
  const { data: orders, loading, refreshing, error, reload } = useAsyncResource(load, { initialData: [], errorMessage: "Unable to load your assigned PINs." });
  // Clear consumed/disabled PINs and discover new assignments without a page reload.
  useEffect(() => {
    const interval = setInterval(() => { if (document.visibilityState === "visible") reload(true); }, 15000);
    const onFocus = () => reload(true);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, [reload]);
  return <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6" aria-label="Assigned payment PINs">
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-medium text-zinc-900"><KeyRound size={18} className="text-zinc-500" />Your assigned payment PINs</h2>
      <button type="button" className="dashboard-action dashboard-action--secondary dashboard-action--icon" aria-label="Refresh assigned PINs" title="Refresh assigned PINs" disabled={loading || refreshing} onClick={() => reload(true)}><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /></button>
    </div>
    <p className="mt-2 text-xs leading-5 text-zinc-500">Share the PIN with the client after collecting cash or a cheque. Only the client can verify it, which marks the order as Paid.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {loading ? <p role="status" className="mt-4 text-sm text-zinc-500">Loading assigned PINs...</p> : !error && !orders.length ? <p className="mt-4 text-sm text-zinc-500">No active payment PINs assigned to you.</p> : !error && <div className="mt-4 divide-y divide-zinc-100">{orders.map((order) => <div key={order._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0"><Link className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline" to={`/staff/orders/${order._id}`}>{order.orderNumber}</Link><p className="text-xs text-zinc-500">{order.client?.name || order.client?.username || "Client"} · {order.paymentMethod === "cheque" ? "Cheque collection" : "Cash payment"} · INR {Number(order.amount || 0).toLocaleString("en-IN")}</p></div>
      <div className="text-right"><p className="font-mono text-xl tracking-[0.2em] text-zinc-900" aria-label={`PIN for ${order.orderNumber}`}>{order.codPin}</p><p className="text-xs text-zinc-500">Active until used or disabled by admin</p></div>
    </div>)}</div>}
  </section>;
}
