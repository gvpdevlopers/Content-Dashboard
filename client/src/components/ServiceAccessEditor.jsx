import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CustomSelect from "./CustomSelect";
import serviceService from "../services/serviceService";

import { defaultServiceAccess, getEditableServiceAccess } from "../utils/serviceAccess";
const groups = [["content", "Content"], ["seo", "SEO"], ["development", "Development"]];

export default function ServiceAccessEditor({ value = defaultServiceAccess, onChange, disabled = false }) {
  const access = getEditableServiceAccess(value);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  useEffect(() => {
    let cancelled = false;
    serviceService.getAdminServices().then((response) => {
      if (!cancelled) { setServices(Array.isArray(response.services) ? response.services : []); setError(""); }
    }).catch(() => { if (!cancelled) setError("Unable to load services. Retry before changing custom access."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);
  const toggle = (key, item) => onChange({ ...access, [key]: access[key].includes(item)
    ? access[key].filter((entry) => entry !== item) : [...access[key], item] });
  const activeCount = (group) => services.filter((service) => (service.serviceGroup ?? "content") === group && service.isActive === true).length;
  const emptyGroups = groups.filter(([id]) => access.groups.includes(id) && activeCount(id) === 0);
  return <fieldset disabled={disabled} className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
    <legend className="px-1 text-sm font-semibold">Client service access</legend>
    <CustomSelect label="Access type" value={access.mode} disabled={disabled}
      onChange={(mode) => onChange({ mode, groups: [], serviceIds: [] })}
      options={[{ value: "groups", label: "Service groups" }, { value: "selected", label: "Custom - selected services only" }]} />
    {access.mode === "groups" ? <div className="flex flex-wrap gap-4">{groups.map(([id, name]) =>
      <label key={id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={access.groups.includes(id)} onChange={() => toggle("groups", id)} />{name}{!loading && !error && <span className="text-xs text-zinc-500">({activeCount(id)} active)</span>}</label>)}</div>
      : <div className="max-h-64 space-y-2 overflow-y-auto">
        {loading && <p role="status" className="text-sm">Loading services...</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error} <button type="button" className="underline" onClick={() => { setLoading(true); setAttempt((n) => n + 1); }}>Retry</button></p>}
        <label className="block text-sm">Find a service<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search service names" disabled={loading || Boolean(error)} className="mt-2 w-full rounded-lg border border-zinc-200 p-2" /></label>
        {!loading && !error && !services.length && <p className="text-sm text-zinc-500">No services have been created yet.</p>}
        {services.length > 0 && !services.some((service) => service.name.toLowerCase().includes(search.trim().toLowerCase())) && <p role="status" className="text-sm text-zinc-500">No matching services. Your existing selections are retained.</p>}
        <CustomSelect label="Add a service" value="" onChange={(id) => toggle("serviceIds", id)}
          disabled={disabled || loading || Boolean(error) || !services.length}
          placeholder="Choose services to grant access"
          options={services.filter((service) => service.name.toLowerCase().includes(search.trim().toLowerCase())).map((service) => ({
            value: String(service._id), label: `${service.name} (${service.serviceGroup || "content"}${service.isActive ? "" : " - inactive"})`,
            disabled: access.serviceIds.includes(String(service._id)),
          }))} />
        {access.serviceIds.length > 0 && <p className="pt-2 text-xs font-medium text-zinc-600">Selected services (uncheck to remove)</p>}
        {services.filter((service) => access.serviceIds.includes(String(service._id))).map((service) => <label key={service._id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled={loading || Boolean(error)} checked onChange={() => toggle("serviceIds", String(service._id))} />
          {service.name} <span className="text-xs text-zinc-500">({service.serviceGroup || "content"}{service.isActive ? "" : " - inactive"})</span>
        </label>)}
        {!loading && !error && access.serviceIds.filter((id) => !services.some((service) => String(service._id) === id)).map((id) =>
          <label key={id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked onChange={() => toggle("serviceIds", id)} />Unavailable service: {id}</label>)}
      </div>}
    {access.mode === "groups" && loading && <p role="status" className="text-sm text-zinc-500">Checking available services...</p>}
    {access.mode === "groups" && error && <p role="alert" className="text-sm text-red-700">Unable to check available services. <button type="button" className="underline" onClick={() => { setLoading(true); setAttempt((n) => n + 1); }}>Retry</button></p>}
    {access.mode === "groups" && !loading && !error && emptyGroups.length > 0 && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
      <p>{emptyGroups.map(([, name]) => name).join(" and ")} currently has no active services. Assigning access does not create services. The client can order from these groups once services are saved and activated.</p>
      <Link to="/admin/services" target="_blank" rel="noopener noreferrer" className="font-medium underline">Open service management</Link>
      <p className="mt-1 text-xs">For SEO and Development, use a starter in Create Service, review its price and fields, then save and activate it. Public website visibility is optional and separate.</p>
    </div>}
    <p className="text-xs leading-5 text-zinc-500">Groups include future services in those groups. Custom access grants only selected services. Inactive assignments are retained, but cannot be ordered. No selection means no new orders. Existing orders remain accessible.</p>
  </fieldset>;
}
