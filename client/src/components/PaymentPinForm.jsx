import { useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import codService from "../services/codService";
import { getVerifiedPaymentUpdate } from "../utils/paymentPin";

export default function PaymentPinForm({ order, onVerified, onCancel, onBusyChange, inputRef: suppliedRef }) {
  const localRef = useRef(null);
  const inputRef = suppliedRef || localRef;
  const inFlight = useRef(false);
  const id = useId();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;
    if (!/^\d{6}$/.test(pin)) { setError("Please enter the 6-digit payment PIN."); inputRef.current?.focus(); return; }
    inFlight.current = true; setBusy(true); setError(""); onBusyChange?.(true);
    try {
      const response = await codService.verifyCodPin(order._id || order.id, pin);
      onVerified(getVerifiedPaymentUpdate(order, response));
    } catch (failure) {
      setError(failure.response?.data?.message || failure.message || "Unable to verify payment PIN.");
      inputRef.current?.focus();
    } finally { inFlight.current = false; setBusy(false); onBusyChange?.(false); }
  };
  return <form onSubmit={submit} className="mt-4" aria-busy={busy}>
    <label htmlFor={`${id}-pin`} className="text-sm font-medium">Payment PIN</label>
    <input ref={inputRef} id={`${id}-pin`} type="password" inputMode="numeric" autoComplete="one-time-code"
      maxLength={6} value={pin} readOnly={busy} aria-required="true" aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      onChange={(event) => { setPin(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
      placeholder="Enter 6-digit PIN"
      className="mt-2 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-base tracking-widest outline-none focus:border-slate-500" />
    {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs leading-5 text-red-700">{error}</p>}
    <div className="modal-actions mt-5 flex flex-wrap justify-end gap-2">
      {onCancel && <button type="button" disabled={busy} onClick={onCancel} className="dashboard-action dashboard-action--secondary">Cancel</button>}
      <button type="submit" disabled={busy || pin.length !== 6} className="dashboard-action dashboard-action--primary">
        {busy && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}{busy ? "Verifying..." : "Verify PIN"}
      </button>
    </div>
  </form>;
}
