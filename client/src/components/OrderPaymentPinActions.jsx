import { useId, useRef, useState } from "react";
import { Eye, KeyRound, Loader2, X } from "lucide-react";
import Modal from "./Modal";
import PaymentPinDialog from "./PaymentPinDialog";
import codService from "../services/codService";
import { canUseOrderPaymentPin, canViewOrderPaymentPin } from "../utils/paymentPin";
import { toast } from "sonner";

function PaymentPinActionsContent({ order, user, onUpdated }) {
  const [entering, setEntering] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const id = useId();
  const requestVersion = useRef(0);
  const canEnter = canUseOrderPaymentPin(order, user);
  const canView = canViewOrderPaymentPin(order, user);
  const closeView = () => { requestVersion.current++; setViewing(false); setPin(""); setError(""); setLoading(false); };
  const viewPin = async () => {
    if (loading) return;
    const version = ++requestVersion.current;
    setViewing(true); setLoading(true); setPin(""); setError("");
    try {
      const response = await codService.getAssignedPins(order._id || order.id);
      if (version !== requestVersion.current) return;
      const assigned = response.orders?.find((item) => String(item._id) === String(order._id || order.id));
      if (!assigned?.codPin) setError("No active PIN is available to your account for this order. Refresh the order to check its status.");
      else setPin(assigned.codPin);
    } catch (failure) {
      if (version === requestVersion.current) setError(failure.response?.data?.message || "Unable to load this PIN.");
    } finally { if (version === requestVersion.current) setLoading(false); }
  };
  if (!canEnter && !canView) return null;
  return <div className="relative z-10 mt-2 flex flex-wrap gap-2">
    {canView && <button type="button" className="dashboard-action dashboard-action--secondary dashboard-action--compact" onClick={viewPin} title="View assigned payment PIN"><Eye size={14} />View PIN</button>}
    {canEnter && <button type="button" className="dashboard-action dashboard-action--secondary dashboard-action--compact" onClick={() => setEntering(true)} title="Enter and verify payment PIN"><KeyRound size={14} />Enter PIN</button>}
    {canEnter && entering && <PaymentPinDialog order={order} onClose={() => setEntering(false)} onVerified={(update) => {
      onUpdated?.(update); setEntering(false); setPin(""); setViewing(false);
      toast.success("Payment marked as Paid.");
    }} />}
    {viewing && <Modal titleId={`${id}-title`} onClose={closeView} className="max-w-sm">
      <div className="flex items-center justify-between gap-3"><h2 id={`${id}-title`} className="font-semibold">Payment PIN</h2><button type="button" className="dashboard-action dashboard-action--tertiary dashboard-action--icon" onClick={closeView} aria-label="Close PIN display"><X size={18} /></button></div>
      <p className="mt-2 text-sm text-zinc-500">Order {order.orderNumber || order._id}</p>
      {loading && <p role="status" className="mt-4 flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin" />Loading PIN...</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {pin && <><p className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center font-mono text-2xl tracking-[0.3em]">{pin}</p><p className="mt-3 text-xs text-zinc-500">No automatic expiry. This PIN is single use and can be disabled by an admin.</p></>}
    </Modal>}
  </div>;
}

export default function OrderPaymentPinActions(props) {
  const { order, user } = props;
  return <PaymentPinActionsContent key={`${order._id || order.id}:${order.codPinGeneratedAt}:${order.codPinStatus}:${order.codPinEmployee?._id || order.codPinEmployee}:${user?._id || user?.id}:${user?.role}`} {...props} />;
}
