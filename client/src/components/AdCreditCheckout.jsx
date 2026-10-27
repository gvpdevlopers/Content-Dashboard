import { RefreshCw } from "lucide-react";

const labels = { metaAds: "Meta Ads", googleAds: "Google Ads" };
const money = (value) => `\u20b9${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function AdCreditCheckout({ platform, data, error, budgets, selected, onSelect, disabled, onRefresh }) {
  const label = labels[platform];
  const available = Number(data?.available?.[platform] || 0);
  const applicable = Math.min(available, budgets[platform] || 0);
  const entries = data?.entries?.filter((entry) => entry.platform === platform) || [];
  const applied = Boolean(selected[platform] && applicable > 0 && !error);
  return (
    <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-zinc-700">
          {label} credit: {data ? `${money(available)} available` : "Loading..."}
        </p>
        <button type="button" onClick={onRefresh} disabled={disabled}
          aria-label={`Refresh ${label} credit balance`} title="Refresh balance"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40">
          <RefreshCw size={13} aria-hidden="true" className="motion-safe:transition-transform motion-safe:duration-500" />
        </button>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-amber-700">{error} You can still order without credit.</p> : (
        <label className="mt-2 flex items-start gap-2 text-xs text-zinc-600">
          <input type="checkbox" checked={applied} disabled={disabled || applicable <= 0 || !data}
            onChange={(event) => onSelect((current) => ({ ...current, [platform]: event.target.checked }))}
            className="mt-0.5" />
          <span>{applicable > 0 ? `Use ${money(applicable)} toward this ad spend.` : "Available credit can cover this platform's ad spend only."}
            {applied && <span className="mt-1 block font-medium text-emerald-700">Ad credit applied: {money(applicable)}</span>}
          </span>
        </label>
      )}
      {entries.length > 0 && (
        <details className="mt-2 text-[11px] text-zinc-500">
          <summary className="cursor-pointer">Recent {label} credit activity</summary>
          {entries.slice(0, 5).map((entry) => (
            <p key={entry.id} className="mt-1.5">{entry.kind} {money(entry.amount)} ? {entry.order?.orderNumber || "Order"} ? {new Date(entry.createdAt).toLocaleDateString()}</p>
          ))}
        </details>
      )}
    </div>
  );
}
