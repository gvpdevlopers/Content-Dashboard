import { validResourceUrl } from "../utils/orderResources";
import { useState } from "react";
import OrderResourceAction from "./OrderResourceAction";

export default function ServiceDelivery({ item, onSave }) {
  const [url, setUrl] = useState(item.delivery?.url || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canEdit = Boolean(onSave) && item.supportsDelivery === true && item._id !== "legacy";
  if (!canEdit && !validResourceUrl(item.delivery?.url)) return null;
  return (
    <section className="mt-4 min-w-0 border-t border-zinc-100 pt-4">
      {canEdit && <>
        <label htmlFor={`delivery-${item._id}`} className="block text-xs font-medium text-zinc-700">Service delivery link</label>
        <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
          <input id={`delivery-${item._id}`} type="url" value={url} maxLength={2048} disabled={saving}
            placeholder="https://" onChange={(event) => { setUrl(event.target.value); setMessage(""); setError(""); }}
            className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400 disabled:opacity-60" />
          <button type="button" disabled={saving || url.trim() === (item.delivery?.url || "")}
            onClick={async () => {
              setSaving(true); setError(""); setMessage("");
              try { await onSave(item._id, url.trim()); setMessage("Delivery link saved."); }
              catch (saveError) { setError(saveError.response?.data?.message || "Unable to save delivery link."); }
              finally { setSaving(false); }
            }}
            className="dashboard-action dashboard-action--primary shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving..." : "Save link"}
          </button>
        </div>
        {message && <p role="status" className="mt-2 text-xs text-emerald-700">{message}</p>}
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      </>}
      {item.delivery?.url && <div className={canEdit ? "mt-2" : ""}><OrderResourceAction url={item.delivery.url} ariaLabel={`Open delivery for ${item.serviceSnapshot?.name || "service"}`} /></div>}
    </section>
  );
}
