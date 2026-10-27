import { useId, useRef, useState } from "react";
import Modal from "./Modal";
import { KeyRound, Loader2, X } from "lucide-react";
import codService from "../services/codService";
import { getVerifiedPaymentUpdate } from "../utils/paymentPin";

export default function PaymentPinDialog({ order, onClose, onVerified }) {
  const inputRef = useRef(null);
  const inFlight = useRef(false);
  const id = useId();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const close = () => { if (!inFlight.current) onClose(); };

  const submit = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;
    if (!/^\d{6}$/.test(pin)) {
      setError("Please enter the 6-digit payment PIN.");
      inputRef.current?.focus();
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await codService.verifyCodPin(order._id || order.id, pin);
      onVerified(getVerifiedPaymentUpdate(order, response));
    } catch (verificationError) {
      setError(verificationError.response?.data?.message || "Unable to verify payment PIN. Please try again.");
      inputRef.current?.focus();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <Modal titleId={`${id}-title`} descriptionId={`${id}-description`} onClose={close} busy={busy} initialFocusRef={inputRef} className="max-w-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <KeyRound size={20} className="mb-3 text-blue-600" aria-hidden="true" />
          <h2 id={`${id}-title`} className="text-lg font-semibold">Enter Payment PIN</h2>
          <p className="mt-1 break-words text-xs text-zinc-500">Order {order.orderNumber || order._id || order.id}</p>
        </div>
        <button type="button" onClick={close} disabled={busy} aria-label="Close payment PIN dialog"
          className="dashboard-action dashboard-action--tertiary dashboard-action--icon"><X size={18} aria-hidden="true" /></button>
      </div>
      <p id={`${id}-description`} className="mt-4 text-sm leading-6 text-zinc-500">Enter the 6-digit PIN provided by the payment collector to verify your cash payment.</p>
      <form onSubmit={submit} className="mt-4" aria-busy={busy}>
        <label htmlFor={`${id}-pin`} className="text-sm font-medium">Payment PIN</label>
        <input ref={inputRef} id={`${id}-pin`} type="password" inputMode="numeric" autoComplete="one-time-code"
          maxLength={6} value={pin} readOnly={busy} aria-required="true" aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => { setPin(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          placeholder="Enter 6-digit PIN"
          className="mt-2 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-base tracking-widest outline-none focus:border-slate-500" />
        {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs leading-5 text-red-700">{error}</p>}
        <div className="modal-actions mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" disabled={busy} onClick={close} className="dashboard-action dashboard-action--secondary">Cancel</button>
          <button type="submit" disabled={busy || pin.length !== 6} className="dashboard-action dashboard-action--primary">
            {busy && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {busy ? "Verifying..." : "Verify PIN"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
