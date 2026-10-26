import { useEffect, useState } from "react";
import adCreditService from "../services/adCreditService";
import AdCreditBreakdown from "./AdCreditBreakdown";

const platforms = { metaAds: "Meta Ads", googleAds: "Google Ads" };
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function OrderAdCredit({ order, staffMode }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [amounts, setAmounts] = useState({});
  const [notes, setNotes] = useState({});
  const [message, setMessage] = useState("");
  const orderId = order._id || order.id;
  const hasAds = (order.items?.length ? order.items : [order])
    .some((item) => item.serviceSnapshot?.slug === "ads");
  useEffect(() => {
    if (!hasAds) return;
    let active = true;
    adCreditService.getOrder(orderId, staffMode).then((result) => {
      if (active) { setData(result); setError(""); }
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || "Unable to load ad credit.");
    });
    return () => { active = false; };
  }, [orderId, staffMode, hasAds, order.paymentStatus]);
  if (!hasAds) return null;

  const issue = async (platform) => {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (!window.confirm(`Add ${money(amounts[platform])} of unused ${platforms[platform]} spend to this client's credit? This can be recorded once per platform for this order.`)) return;
      await adCreditService.issue(orderId, staffMode, {
        platform, amount: amounts[platform], note: notes[platform] || "",
      });
      setMessage("Unused spend added to the client's ad credit.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to record unused spend.");
    } finally {
      // Refresh even after an ambiguous network failure to show a committed credit.
      try { setData(await adCreditService.getOrder(orderId, staffMode)); }
      catch { /* Keep the error and permit a safe retry. */ }
      setBusy(false);
    }
  };
  return (
    <section className="mt-5 border-t border-zinc-200 pt-5">
      <h4 className="text-sm font-semibold text-zinc-900">Unused ad spend</h4>
      <AdCreditBreakdown order={order} />
      <p className="mt-1 text-sm text-zinc-500">Record the final unused campaign budget as credit for this client's next ads order. Service fees are separate.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      {message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}
      {!data && !error && <p className="mt-3 text-sm text-zinc-500">Loading ad spend...</p>}
      {data && Object.entries(platforms).filter(([key]) => data.budgets[key] > 0).map(([platform, label]) => (
        <div key={platform} className="mt-3 rounded-xl bg-zinc-50 p-4">
          <h5 className="text-sm font-medium">{label}</h5>
          <p className="mt-1 text-sm text-zinc-500">Order ad spend: {money(data.budgets[platform])} · Client's available credit: {money(data.available[platform])}</p>
          {data.issued?.[platform] !== undefined ? (
            <p className="mt-3 text-sm text-emerald-700">Unused spend already recorded: {money(data.issued[platform])}</p>
          ) : !data.settled ? (
            <p className="mt-3 text-sm text-amber-700">Payment must be settled before unused spend can be credited.</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Remaining ad spend (₹)
                <input type="number" min="0.01" step="0.01" max={data.budgets[platform]}
                  value={amounts[platform] || ""} disabled={busy}
                  onChange={(event) => setAmounts((current) => ({ ...current, [platform]: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 p-2" />
              </label>
              <label className="text-sm">Reason / campaign reference
                <input type="text" maxLength={1000} value={notes[platform] || ""} disabled={busy}
                  onChange={(event) => setNotes((current) => ({ ...current, [platform]: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 p-2" />
              </label>
              <button type="button" disabled={busy || !Number(amounts[platform]) || !notes[platform]?.trim()}
                onClick={() => issue(platform)} className="dashboard-action dashboard-action--primary rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-40">
                {busy ? "Saving..." : "Add unused spend as credit"}
              </button>
            </div>
          )}
        </div>
      ))}
      {data?.entries?.length > 0 && (
        <div className="mt-5 border-t border-zinc-200 pt-4">
          <h3 className="text-sm font-medium">Credit activity for this order</h3>
          {data.entries.map((entry) => (
            <p key={entry.id} className="mt-2 text-xs text-zinc-600">
              {platforms[entry.platform]} · {entry.kind} {money(entry.amount)} · {entry.actor?.name || "Staff"} · {new Date(entry.createdAt).toLocaleString()}
              {entry.note && <span className="block text-zinc-400">{entry.note}</span>}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
