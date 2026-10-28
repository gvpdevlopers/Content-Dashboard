import { useEffect, useState } from "react";
import CustomSelect from "./CustomSelect";
import ConfirmDialog from "./ConfirmDialog";
import FormFeedback from "./FormFeedback";
import serviceService from "../services/serviceService";

export default function ServiceTemplatePicker({ onApply, hasChanges, disabled }) {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    let cancelled = false;
    serviceService.getServiceTemplates().then((response) => {
      if (!cancelled) { setTemplates(response.templates || []); setError(""); }
    }).catch((failure) => {
      if (!cancelled) setError(failure.response?.data?.message || "Unable to load starter services.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);
  const template = templates.find((item) => item.slug === selected);
  const apply = () => {
    if (!template) return;
    onApply(structuredClone(template));
    setConfirming(false);
  };
  return <section className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 sm:p-6" aria-label="Starter service templates">
    <div><h2 className="text-base font-semibold text-zinc-900">Start with an SEO or Development service</h2>
      <p className="mt-1 text-sm leading-6 text-zinc-600">Load a starter, then edit the scope, price and client fields below. Templates start inactive and hidden from the public website. Loading a template does not save it.</p></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1"><CustomSelect label="Starter service" value={selected} onChange={setSelected}
        disabled={disabled || loading || Boolean(error)} placeholder={loading ? "Loading starters..." : "Choose a starter service"}
        options={templates.map((item) => ({ value: item.slug, label: `${item.serviceGroup === "seo" ? "SEO" : "Development"} - ${item.name}` }))} /></div>
      <button type="button" className="dashboard-action dashboard-action--secondary" disabled={disabled || !template || loading || Boolean(error)}
        onClick={() => hasChanges ? setConfirming(true) : apply()}>Use template</button>
    </div>
    <FormFeedback message={error} />
    {error && <button type="button" disabled={disabled || loading} className="text-sm underline" onClick={() => { setLoading(true); setAttempt((value) => value + 1); }}>Retry loading templates</button>}
    {template && <p className="text-xs leading-5 text-zinc-600">{template.description} Sample price: INR {template.basePrice.toLocaleString("en-IN")} per {template.unit}.</p>}
    <ConfirmDialog open={confirming} title="Replace this unsaved configuration?"
      description="The selected template will replace the service fields and pricing currently in this form. Existing saved services will not be changed."
      confirmLabel="Replace configuration" onConfirm={apply} onCancel={() => setConfirming(false)} />
  </section>;
}
