import { useId, useRef, useState } from "react";
import Modal from "./Modal";
import { KeyRound, X } from "lucide-react";
import PaymentPinForm from "./PaymentPinForm";

export default function PaymentPinDialog({ order, onClose, onVerified }) {
  const id = useId();
  const inputRef = useRef(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const close = () => { if (!busyRef.current) onClose(); };
  return <Modal titleId={id + "-title"} descriptionId={id + "-description"} onClose={close} busy={busy} initialFocusRef={inputRef} className="max-w-sm">
    <div className="flex items-start justify-between gap-3"><div>
      <KeyRound size={20} className="mb-3 text-zinc-500" aria-hidden="true" />
      <h2 id={id + "-title"} className="text-lg font-semibold">Enter PIN</h2>
      <p className="mt-1 break-words text-xs text-zinc-500">Order {order.orderNumber || order._id || order.id}</p>
    </div><button type="button" onClick={close} disabled={busy} aria-label="Close payment PIN dialog" className="dashboard-action dashboard-action--tertiary dashboard-action--icon"><X size={18} /></button></div>
    <p id={id + "-description"} className="mt-4 text-sm leading-6 text-zinc-500">Enter the PIN provided by the employee after collecting your {order.paymentMethod === "cheque" ? "cheque" : "cash payment"}. Successful verification marks the order as Paid.</p>
    <PaymentPinForm order={order} onVerified={onVerified} onCancel={close} inputRef={inputRef} onBusyChange={(value) => { busyRef.current = value; setBusy(value); }} />
  </Modal>;
}
