import { useEffect, useState } from "react";
import { Save, X, Plus, Loader2, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import packageService from "../../services/packageService";
import serviceService from "../../services/serviceService";
import CustomSelect from "../../components/CustomSelect";
import ConfirmDialog from "../../components/ConfirmDialog";
import PackageServiceConfiguration from "../../components/PackageServiceConfiguration";

const blank = () => ({ name: "", slug: "", description: "", price: "", pricingMode: "fixed", visibility: "all", clients: [], services: [], isActive: true });
const input = "mt-2 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-zinc-50";
const groups = [{ value: "content", label: "Content & Ads" }, { value: "seo", label: "SEO" }, { value: "development", label: "Development" }];
const groupName = (service) => groups.find((group) => group.value === (service?.serviceGroup || "content"))?.label || "Unavailable";
const currency = (value) => `\u20b9${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [errors, setErrors] = useState({});
  const [category, setCategory] = useState("content");
  const [serviceId, setServiceId] = useState("");
  const [expanded, setExpanded] = useState({});
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setErrors({});
      const results = await Promise.allSettled([packageService.listAdmin(), serviceService.getAdminServices()]);
      if (!active) return;
      const nextErrors = {};
      if (results[0].status === "fulfilled") setPackages(results[0].value.packages || []);
      else nextErrors.packages = results[0].reason.response?.data?.message || "Unable to load packages.";
      if (results[1].status === "fulfilled") setServices(results[1].value.services || []);
      else nextErrors.services = results[1].reason.response?.data?.message || "Unable to load services.";
      setErrors(nextErrors); setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [retry]);
  const serviceKey = form.services.map((entry) => entry.serviceId).sort().join(",");
  useEffect(() => {
    let active = true;
    // Reset the dependent remote resource before fetching its new permissions.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClients([]); setClientError("");
    if (!serviceKey || form.visibility !== "selected") { setClientLoading(false); return; }
    setClientLoading(true);
    packageService.eligibleClients(serviceKey.split(",").map((id) => ({ serviceId: id })))
      .then((data) => { if (active) setClients(data.clients || []); })
      .catch((error) => { if (active) setClientError(error.response?.data?.message || "Unable to load eligible clients."); })
      .finally(() => { if (active) setClientLoading(false); });
    return () => { active = false; };
  }, [serviceKey, form.visibility, retry]);
  useEffect(() => {
    let active = true;
    // Debounced synchronization with the server pricing resource.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(null); setPreviewError("");
    if (!form.services.length) { setPreviewLoading(false); return; }
    setPreviewLoading(true);
    const timer = setTimeout(() => packageService.preview(form.services)
      .then((data) => { if (active) setPreview(data.price); })
      .catch((error) => { if (active) setPreviewError(error.response?.data?.message || "Unable to calculate price."); })
      .finally(() => { if (active) setPreviewLoading(false); }), 350);
    return () => { active = false; clearTimeout(timer); };
  }, [form.services]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const reset = () => { setEditing(null); setForm(blank()); setExpanded({}); setServiceId(""); };
  const add = () => {
    const service = services.find((item) => String(item._id) === serviceId);
    if (!service || service.isActive !== true || form.services.some((entry) => entry.serviceId === serviceId)) return;
    update("services", [...form.services, { serviceId, quantity: service.minQuantity || 1, pricingOptionId: "", formData: {} }]);
    setExpanded((current) => ({ ...current, [serviceId]: true })); setServiceId("");
  };
  const save = async (event) => {
    event.preventDefault();
    if (!form.services.length) return toast.error("Add at least one service.");
    if (form.visibility === "selected" && (!form.clients.length || form.clients.some((id) => !clients.some((client) => client._id === id)))) return toast.error("Select eligible clients and remove unavailable assignments.");
    setSaving(true);
    try {
      const data = editing ? await packageService.update(editing, form) : await packageService.create(form);
      toast.success(data.message); reset(); setRetry((value) => value + 1);
    } catch (error) { toast.error(error.response?.data?.message || "Unable to save package."); }
    finally { setSaving(false); }
  };
  const edit = (item) => {
    setEditing(item._id);
    setForm({ ...blank(), ...item, services: item.services.map((entry) => ({ serviceId: String(entry.service?._id || entry.service), quantity: entry.quantity, pricingOptionId: entry.pricingOptionId || "", formData: entry.formData || {} })), clients: item.clients?.map((client) => String(client._id || client)) || [] });
    setExpanded({}); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleActive = async (item) => {
    setSaving(true);
    try {
      const data = await packageService.update(item._id, { isActive: !item.isActive });
      toast.success(data.message);
      if (editing === item._id) update("isActive", !item.isActive);
      setRetry((value) => value + 1);
    } catch (error) { toast.error(error.response?.data?.message || "Unable to change package status."); }
    finally { setSaving(false); }
  };
  const available = services.filter((service) => service.isActive === true && (service.serviceGroup || "content") === category && !form.services.some((entry) => entry.serviceId === String(service._id)));
  const removePackage = async () => {
    if (!deleteTarget || saving) return;
    setSaving(true); setDeleteError("");
    try {
      const data = await packageService.remove(deleteTarget._id);
      setPackages((current) => current.filter((item) => item._id !== deleteTarget._id));
      if (editing === deleteTarget._id) reset();
      setDeleteTarget(null); toast.success(data.message);
    } catch (error) { setDeleteError(error.response?.data?.message || "Unable to delete package. Please try again."); }
    finally { setSaving(false); }
  };
  return <div className="mx-auto w-full max-w-[1180px]">
    <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">Administration</p>
    <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Packages</h1>
    <p className="mt-2 text-sm text-zinc-500">Create reusable service packages for eligible clients.</p>
    {Object.values(errors).length > 0 && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{Object.values(errors).map((message) => <p key={message}>{message}</p>)}<button type="button" className="dashboard-action dashboard-action--secondary mt-3" onClick={() => setRetry((value) => value + 1)}>Retry loading</button></div>}
    <form onSubmit={save} className="mt-6 space-y-6 [&_.custom-select-trigger]:min-h-11 [&_.custom-select-trigger]:py-2.5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
      <fieldset disabled={saving} className="space-y-6 disabled:opacity-70">
        <section aria-labelledby="package-basic"><h2 id="package-basic" className="text-base font-semibold text-zinc-900">1. Basic information</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-zinc-700">Package name<input required maxLength={120} value={form.name} onChange={(event) => { const name = event.target.value; setForm((current) => ({ ...current, name, slug: !editing && (!current.slug || current.slug === slugify(current.name)) ? slugify(name) : current.slug })); }} className={input} /></label>
          <label className="text-sm font-medium text-zinc-700">Slug<input required maxLength={160} pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Lowercase letters, numbers and hyphens" value={form.slug} onChange={(event) => update("slug", event.target.value)} className={input} /></label>
          <label className="text-sm font-medium text-zinc-700 sm:col-span-2">Description<textarea maxLength={1000} value={form.description} onChange={(event) => update("description", event.target.value)} className={input} rows={2} /></label>
        </div></section>
        <section aria-labelledby="package-pricing" className="border-t border-zinc-100 pt-5"><h2 id="package-pricing" className="text-base font-semibold text-zinc-900">2. Pricing</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CustomSelect label="Pricing mode" value={form.pricingMode} onChange={(value) => update("pricingMode", value)} options={[{ value: "fixed", label: "Fixed package price" }, { value: "calculated", label: "Calculated from included services" }]} />
          {form.pricingMode === "fixed" && <label className="text-sm font-medium text-zinc-700">Package price (INR, before GST)<input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => update("price", event.target.value)} className={input} /></label>}
        </div><p role="status" className="mt-3 text-xs leading-5 text-zinc-500">{previewLoading ? "Calculating service price..." : preview !== null ? `Configured services: ${currency(preview)} before GST and coupons. Client choices may change calculated pricing.` : "Add services to preview calculated pricing."}</p>{previewError && <p role="alert" className="mt-2 text-sm text-red-600">{previewError}</p>}</section>
        <section aria-labelledby="package-services" className="border-t border-zinc-100 pt-5"><h2 id="package-services" className="text-base font-semibold text-zinc-900">3. Included services</h2>
          <div className="mt-4 grid items-end gap-3 sm:grid-cols-[160px_1fr_auto]"><CustomSelect label="Category" value={category} onChange={(value) => { setCategory(value); setServiceId(""); }} options={groups} />
            <CustomSelect label="Service" searchable disabled={loading || Boolean(errors.services)} value={serviceId} onChange={setServiceId} placeholder={loading ? "Loading services..." : available.length ? "Search or select a service" : "No available services in this category"} options={available.map((service) => ({ value: String(service._id), label: service.name }))} />
            <button type="button" disabled={!serviceId || loading || form.services.length >= 50} onClick={add} className="dashboard-action dashboard-action--secondary"><Plus size={16} />Add service</button>
          </div>
          {!loading && !errors.services && !available.length && <p role="status" className="mt-3 text-xs text-zinc-500">No additional active services in {groups.find((group) => group.value === category)?.label}. Check service status in Services or choose another category.</p>}
          <div className="mt-4 space-y-3">{form.services.map((entry) => {
            const service = services.find((item) => String(item._id) === entry.serviceId);
            return <article key={entry.serviceId} className="space-y-4 rounded-xl border border-zinc-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-zinc-900">{service?.name || "Unavailable service"}</h3><p className="mt-1 text-xs text-zinc-500">{groupName(service)} &middot; Quantity {entry.quantity}</p>{(!service || !service.isActive) && <p className="mt-1 text-xs text-red-600">This service is inactive or unavailable. Remove it before saving.</p>}</div><div className="flex gap-2"><button type="button" disabled={!service} aria-expanded={Boolean(expanded[entry.serviceId])} aria-controls={`configure-${entry.serviceId}`} className="dashboard-action dashboard-action--secondary dashboard-action--compact" onClick={() => setExpanded((current) => ({ ...current, [entry.serviceId]: !current[entry.serviceId] }))}><Settings2 size={14} />{expanded[entry.serviceId] ? "Done" : "Configure"}</button><button type="button" aria-label={`Remove ${service?.name || "service"}`} className="dashboard-action dashboard-action--destructive dashboard-action--compact" onClick={() => update("services", form.services.filter((item) => item.serviceId !== entry.serviceId))}><Trash2 size={14} /></button></div></div>
              {expanded[entry.serviceId] && service && <div id={`configure-${entry.serviceId}`}><PackageServiceConfiguration service={service} entry={entry} onChange={(next) => update("services", form.services.map((item) => item.serviceId === entry.serviceId ? next : item))} /></div>}
            </article>;
          })}{!form.services.length && <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">Add your first service using the selector above.</p>}</div>
        </section>
        <section aria-labelledby="package-visibility" className="border-t border-zinc-100 pt-5"><h2 id="package-visibility" className="text-base font-semibold text-zinc-900">4. Visibility</h2><div role="group" aria-label="Package visibility" className="mt-4 flex flex-wrap gap-2">{[{ value: "all", label: "All eligible clients" }, { value: "selected", label: "Selected clients" }].map((option) => <button key={option.value} type="button" aria-pressed={form.visibility === option.value} onClick={() => update("visibility", option.value)} className={`dashboard-action ${form.visibility === option.value ? "dashboard-action--primary" : "dashboard-action--secondary"}`}>{option.label}</button>)}</div>
          <p className="mt-3 text-xs leading-5 text-zinc-500">Clients must have permission to order every included service, regardless of visibility.</p>
          {form.visibility === "selected" && <div className="mt-4 space-y-3"><CustomSelect label="Eligible clients" aria-required="true" searchable multiple value={form.clients} disabled={clientLoading || !form.services.length || Boolean(clientError)} onChange={(value) => update("clients", value)} placeholder={!form.services.length ? "Add services first" : clientLoading ? "Loading eligible clients..." : "Search clients by name or email"} options={clients.map((client) => ({ value: client._id, label: `${client.name} | ${client.email || "No email"}` }))} />
            {clientError && <p role="alert" className="text-sm text-red-600">{clientError} <button type="button" className="underline" onClick={() => setRetry((value) => value + 1)}>Retry</button></p>}
            {!clientLoading && !clientError && form.services.length > 0 && !clients.length && <p role="status" className="text-sm text-zinc-500">No active clients have access to all included services. Update client permissions in Users or revise the included services.</p>}
            <div className="flex flex-wrap gap-2">{form.clients.map((id) => { const client = clients.find((item) => item._id === id); const assigned = packages.find((item) => item._id === editing)?.clients?.find((item) => String(item._id || item) === id); return <span key={id} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs ${!client && !clientLoading ? "border-red-200 bg-red-50 text-red-700" : "border-zinc-200 bg-zinc-50 text-zinc-700"}`}>{client?.name || assigned?.name || id}{!client && !clientLoading ? " (not eligible)" : ""}<button type="button" aria-label={`Remove client ${client?.name || id}`} onClick={() => update("clients", form.clients.filter((value) => value !== id))} className="rounded p-1 hover:bg-zinc-200"><X size={14} /></button></span>; })}</div>
            {form.clients.length > 0 && <button type="button" className="dashboard-action dashboard-action--tertiary dashboard-action--compact" onClick={() => update("clients", [])}>Clear selection</button>}
            {!form.clients.length && <p className="text-xs text-zinc-500">Select at least one eligible client to save.</p>}
          </div>}
          <label className="mt-4 flex items-center gap-2 text-sm text-zinc-700"><input type="checkbox" checked={form.isActive} onChange={(event) => update("isActive", event.target.checked)} />Active: available in the client package catalogue</label>
        </section>
        <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-5"><button type="button" onClick={reset} className="dashboard-action dashboard-action--secondary">{editing ? "Cancel" : "Reset"}</button><button type="submit" disabled={saving || loading || Boolean(errors.services) || !form.services.length || previewLoading || Boolean(previewError) || form.visibility === "selected" && (clientLoading || Boolean(clientError) || !form.clients.length)} className="dashboard-action dashboard-action--primary">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{saving ? "Saving..." : editing ? "Save changes" : "Create package"}</button></div>
      </fieldset>
    </form>
    <section aria-label="Existing packages" className="mt-8 space-y-3">{loading && <p role="status" className="text-sm text-zinc-500">Loading packages and services...</p>}{packages.map((item) => <article key={item._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5"><div><div className="flex items-center gap-2"><h2 className="font-semibold text-zinc-900">{item.name}</h2><span className={`rounded-full border px-2 py-1 text-[11px] ${item.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-100 text-zinc-500"}`}>{item.isActive ? "Active" : "Inactive"}</span></div><p className="mt-1 text-sm text-zinc-500">{item.services?.length || 0} services &middot; {currency(item.price)}{item.pricingMode === "calculated" ? " estimated" : ""} &middot; {item.visibility === "selected" ? `${item.clients?.length || 0} selected clients` : "All eligible clients"}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={saving || loading} onClick={() => edit(item)} className="dashboard-action dashboard-action--secondary">Edit</button><button type="button" disabled={saving || loading} onClick={() => toggleActive(item)} className={`dashboard-action ${item.isActive ? "dashboard-action--destructive" : "dashboard-action--secondary"}`}>{item.isActive ? "Deactivate" : "Activate"}</button><button type="button" disabled={saving || loading} aria-label={`Delete ${item.name}`} title="Delete package" onClick={() => { setDeleteError(""); setDeleteTarget(item); }} className="dashboard-action dashboard-action--destructive dashboard-action--icon"><Trash2 size={16} aria-hidden="true" /></button></div></article>)}{!loading && !errors.packages && !packages.length && <p className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">No packages yet.</p>}</section>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete package?" description={`Permanently delete "${deleteTarget?.name || "this package"}"? It will no longer be available for new orders. Existing orders are preserved. This cannot be undone.`} confirmLabel="Delete package" destructive loading={saving} error={deleteError} onConfirm={removePackage} onCancel={() => { if (!saving) { setDeleteTarget(null); setDeleteError(""); } }} />
  </div>;
}
