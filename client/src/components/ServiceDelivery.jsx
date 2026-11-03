import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { validResourceUrl } from "../utils/orderResources";
import CustomSelect from "./CustomSelect";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderResourceAction from "./OrderResourceAction";

const inputClass = "min-h-11 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60";
const statusOptions = [{ value: "pending", label: "Pending" }, { value: "in_progress", label: "In Progress" }, { value: "completed", label: "Completed" }];

function DeliverableRow({ itemId, deliverable, onSave, inactive }) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canEdit = Boolean(onSave) && !inactive;
  const startEdit = () => {
    setDraft({ status: deliverable.status, notes: deliverable.notes || "", updatedAt: deliverable.updatedAt || null,
      links: (deliverable.links || []).map(link => ({ label: link.label || "", url: link.url, localId: crypto.randomUUID() })) });
    setError(""); setMessage(""); setEditing(true);
  };
  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (draft.links.some(link => !validResourceUrl(link.url))) { setError("Enter a valid HTTP or HTTPS URL for every link, or remove empty rows."); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      await onSave(itemId, deliverable.key, { ...draft, links: draft.links.map(link => ({ label: link.label.trim(), url: link.url.trim() })) });
      setEditing(false); setMessage("Deliverable saved.");
    } catch (saveError) { setError(saveError.response?.data?.message || "Unable to save this deliverable. Your changes are still here."); }
    finally { setSaving(false); }
  };
  return <article aria-label={deliverable.name} className="min-w-0 py-4 first:pt-0 last:pb-0">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h5 className="break-words text-sm font-semibold text-zinc-800">{deliverable.name}</h5>
        <OrderStatusBadge status={deliverable.status} />
      </div>
      {canEdit && !editing && <button type="button" onClick={startEdit} aria-label={`Edit ${deliverable.name}`}
        className="dashboard-action dashboard-action--secondary min-h-11">Edit deliverable</button>}
    </div>
    {editing ? <form onSubmit={save} className="mt-3 space-y-3">
      <fieldset disabled={saving} className="min-w-0 space-y-3">
        <legend className="sr-only">Edit {deliverable.name}</legend>
        <div className="max-w-xs">
          <label htmlFor={`${id}-status`} className="mb-1 block text-xs font-medium text-zinc-700">Progress status</label>
          <CustomSelect id={`${id}-status`} aria-label="Progress status" value={draft.status} options={statusOptions} disabled={saving}
            onChange={status => setDraft(current => ({ ...current, status }))} />
        </div>
        <div className="space-y-3">
          {draft.links.map((link, index) => <div key={link.localId} className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
            <div><label htmlFor={`${id}-${link.localId}-label`} className="mb-1 block text-xs font-medium text-zinc-700">Link {index + 1} label (optional)</label>
              <input id={`${id}-${link.localId}-label`} value={link.label} maxLength={120} placeholder="e.g. Final video" className={inputClass}
                onChange={event => setDraft(current => ({ ...current, links: current.links.map(entry => entry.localId === link.localId ? { ...entry, label: event.target.value } : entry) }))} /></div>
            <div><label htmlFor={`${id}-${link.localId}-url`} className="mb-1 block text-xs font-medium text-zinc-700">Link {index + 1} URL</label>
              <input id={`${id}-${link.localId}-url`} type="url" required value={link.url} maxLength={2048} placeholder="https://" className={inputClass}
                onChange={event => setDraft(current => ({ ...current, links: current.links.map(entry => entry.localId === link.localId ? { ...entry, url: event.target.value } : entry) }))} /></div>
            <button type="button" aria-label={`Remove link ${index + 1} from ${deliverable.name}`} className="dashboard-action dashboard-action--destructive min-h-11 min-w-11 justify-self-end"
              onClick={() => setDraft(current => ({ ...current, links: current.links.filter(entry => entry.localId !== link.localId) }))}><Trash2 size={16} aria-hidden="true" /></button>
          </div>)}
          <button type="button" disabled={draft.links.length >= 20} className="dashboard-action dashboard-action--secondary min-h-11"
            onClick={() => setDraft(current => ({ ...current, links: [...current.links, { label: "", url: "", localId: crypto.randomUUID() }] }))}>
            <Plus size={15} aria-hidden="true" />Add link</button>
        </div>
        <div><label htmlFor={`${id}-notes`} className="mb-1 block text-xs font-medium text-zinc-700">Notes (visible to the client)</label>
          <textarea id={`${id}-notes`} rows={2} maxLength={4000} className={inputClass} value={draft.notes}
            onChange={event => setDraft(current => ({ ...current, notes: event.target.value }))} /></div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" disabled={saving} onClick={() => { setEditing(false); setError(""); }} className="dashboard-action dashboard-action--secondary min-h-11">Cancel</button>
        <button type="submit" disabled={saving} className="dashboard-action dashboard-action--primary min-h-11">{saving ? "Saving?" : "Save deliverable"}</button>
      </div>
    </form> : <>
      {deliverable.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-600">{deliverable.notes}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {(deliverable.links || []).map((link, index) => <OrderResourceAction key={`${link.url}-${index}`} url={link.url}
          label={link.label || `Open delivery ${index + 1}`} ariaLabel={`Open ${link.label || `delivery ${index + 1}`} for ${deliverable.name}`} />)}
      </div>
      {!deliverable.links?.length && <p className="mt-2 text-xs text-zinc-500">No delivery links yet.</p>}
    </>}
    {message && <p role="status" className="mt-2 text-xs text-emerald-700">{message}</p>}
  </article>;
}

export default function ServiceDelivery({ item, onSave, inactive = false }) {
  const deliverables = item.serviceProgress?.deliverables || [];
  if (!deliverables.length) {
    // Read-only fallback for responses from an older server during rollout.
    return validResourceUrl(item.delivery?.url) ? <div className="mt-4"><OrderResourceAction url={item.delivery.url} /></div> : null;
  }
  return <section className="mt-4 min-w-0 border-t border-zinc-100 pt-4" aria-label="Service deliverables">
    <h4 className="mb-4 text-sm font-semibold text-zinc-800">Service deliverables</h4>
    <div className="divide-y divide-zinc-100">
      {deliverables.map(deliverable => <DeliverableRow key={deliverable.key} itemId={item._id} deliverable={deliverable}
        onSave={onSave} inactive={inactive} />)}
    </div>
  </section>;
}
