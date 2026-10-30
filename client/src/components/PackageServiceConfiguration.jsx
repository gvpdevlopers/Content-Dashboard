import { useId } from "react";
import CustomSelect from "./CustomSelect";
import { Plus, X } from "lucide-react";

const input = "min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100";
const activeOptions = (service) => (service.pricingOptions || []).filter((option) => option.isActive !== false);
const fieldsFor = (base, options) => [...new Map([...base, ...options.flatMap((option) => option?.fields || [])].map((field) => [field.name, field])).values()].sort((a, b) => (a.order || 0) - (b.order || 0));

function Field({ field, value, onChange }) {
  const fieldId = useId();
  return <div className="space-y-2"><label htmlFor={fieldId} className="block text-sm font-medium text-zinc-700">{field.label}{field.required && <span className="ml-1 text-zinc-400">*</span>}</label>
    {["select", "radio", "checkbox"].includes(field.type) && field.options?.length ? <CustomSelect id={fieldId} searchable multiple={field.type === "checkbox"} value={value ?? (field.type === "checkbox" ? [] : "")} onChange={onChange} placeholder="Client completes at checkout" options={(field.type === "checkbox" ? [] : [{ value: "", label: "Client completes at checkout" }]).concat(field.options.map((option) => ({ value: option.value, label: option.label })))} />
      : field.type === "checkbox" ? <input id={fieldId} type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />
      : field.type === "textarea" ? <textarea id={fieldId} value={value ?? ""} onChange={(event) => onChange(event.target.value)} rows={2} className={input} placeholder={field.placeholder || "Client completes at checkout"} />
      : <input id={fieldId} type={field.type || "text"} value={value ?? ""} onChange={(event) => onChange(event.target.value)} min={field.min} max={field.max} step={field.step ?? "any"} className={input} placeholder={field.placeholder || "Client completes at checkout"} />}
    {field.helpText && <p className="text-xs text-zinc-500">{field.helpText}</p>}
  </div>;
}

function PricingGroups({ service, groups, selections, quantities, onChange }) {
  return groups.map((group) => {
    const options = activeOptions(service).filter((option) => option.group === group);
    const selected = options.find((option) => String(option._id) === String(selections[group]));
    return <div key={group} className="grid gap-3 sm:grid-cols-[1fr_120px]"><CustomSelect label={group} searchable value={selections[group] || ""} onChange={(value) => onChange({ ...selections, [group]: value }, { ...quantities, [group]: options.find((option) => String(option._id) === value)?.minQuantity || 1 })} placeholder="Client chooses at checkout" options={[{ value: "", label: "Client chooses at checkout" }, ...options.map((option) => ({ value: String(option._id), label: `${option.name} | INR ${option.price}` }))]} />
      {selected && <label className="text-sm text-zinc-600">Quantity<input type="number" min={selected.minQuantity || 1} max={selected.maxQuantity || 100} step="1" className={`${input} mt-2`} value={quantities[group] ?? selected.minQuantity ?? 1} onChange={(event) => onChange(selections, { ...quantities, [group]: event.target.value })} /></label>}</div>;
  });
}

export default function PackageServiceConfiguration({ service, entry, onChange }) {
  const data = entry.formData || {};
  const setData = (next) => onChange({ ...entry, formData: next });
  const setField = (name, value) => { const next = { ...data }; if (value === "" || Array.isArray(value) && !value.length) delete next[name]; else next[name] = value; setData(next); };
  const options = activeOptions(service);
  const repeatables = (service.repeatableGroups || []).filter((group) => group.isActive !== false);
  const repeatedPricing = new Set(repeatables.flatMap((group) => group.pricingGroups || []));
  const groups = [...new Set(options.map((option) => option.group).filter((group) => group && !repeatedPricing.has(group)))];
  const selected = options.filter((option) => String(option._id) === entry.pricingOptionId || option.group && String(data[option.group]) === String(option._id));
  const changePricing = (selections, quantities) => {
    const next = { ...data, ...selections, pricingQuantities: quantities };
    const nextOptions = options.filter((option) => option.group && String(selections[option.group]) === String(option._id));
    const validFields = new Set(fieldsFor(service.fields || [], nextOptions).map((field) => field.name));
    for (const field of options.flatMap((option) => option.fields || [])) if (!validFields.has(field.name)) delete next[field.name];
    for (const group of groups) if (!next[group]) delete next[group];
    setData(next);
  };
  return <div className="space-y-4 border-t border-zinc-100 pt-4">
    <p className="text-xs leading-5 text-zinc-500">Set shared defaults here. Leave client-specific fields blank for checkout. Required details are checked before an order can be placed.</p>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-zinc-700">Quantity<input type="number" min={selected[0]?.minQuantity ?? service.minQuantity ?? 1} max={selected[0]?.maxQuantity ?? service.maxQuantity ?? 100} step="1" value={entry.quantity} onChange={(event) => onChange({ ...entry, quantity: event.target.value })} className={`${input} mt-2`} /></label>
      {options.some((option) => !option.group) && <CustomSelect label="Pricing option" searchable value={entry.pricingOptionId || ""} onChange={(value) => {
        const nextData = { ...data }; const valid = new Set(fieldsFor(service.fields || [], options.filter((option) => String(option._id) === value)).map((field) => field.name));
        for (const field of options.flatMap((option) => option.fields || [])) if (!valid.has(field.name)) delete nextData[field.name];
        onChange({ ...entry, pricingOptionId: value, quantity: options.find((option) => String(option._id) === value)?.minQuantity || service.minQuantity || 1, formData: nextData });
      }} options={[{ value: "", label: "Client chooses at checkout" }, ...options.filter((option) => !option.group).map((option) => ({ value: String(option._id), label: `${option.name} | INR ${option.price}` }))]} />}
      {service.pricingModes?.length > 0 && <CustomSelect label="Service pricing mode" value={data.pricingMode || ""} onChange={(value) => setField("pricingMode", value)} options={[{ value: "", label: "Client chooses at checkout" }, ...service.pricingModes.map((mode) => ({ value: mode.key, label: mode.label || mode.key }))]} />}
    </div>
    <PricingGroups service={service} groups={groups} selections={data} quantities={data.pricingQuantities || {}} onChange={changePricing} />
    <div className="grid gap-4 sm:grid-cols-2">{fieldsFor(service.fields || [], selected).map((field) => <Field key={field.name} field={field} value={data[field.name]} onChange={(value) => setField(field.name, value)} />)}</div>
    {repeatables.map((group) => <div key={group.name} className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium text-zinc-700">{group.label}</p><p className="text-xs text-zinc-500">{group.description || "Leave unconfigured for the client to complete at checkout."}</p></div><button type="button" disabled={(data[group.name]?.length || 0) >= (group.maxItems || 10)} className="dashboard-action dashboard-action--secondary dashboard-action--compact" onClick={() => setField(group.name, [...(data[group.name] || []), ...Array.from({ length: data[group.name]?.length ? 1 : Math.max(1, group.minItems || 1) }, () => ({ fields: {}, pricingOptions: {}, pricingQuantities: {} }))])}><Plus size={14} />Add {group.label}</button></div>
      {(data[group.name] || []).map((item, index) => {
        const patch = (next) => setField(group.name, data[group.name].map((current, position) => position === index ? next : current));
        const chosen = options.filter((option) => String(item.pricingOptions?.[option.group]) === String(option._id));
        return <div key={index} className="space-y-3 rounded-xl border border-zinc-200 p-3"><div className="flex justify-between"><span className="text-xs font-medium text-zinc-500">{group.label} {index + 1}</span><button type="button" aria-label={`Remove ${group.label} ${index + 1}`} className="dashboard-action dashboard-action--destructive dashboard-action--compact" onClick={() => setField(group.name, data[group.name].length <= (group.minItems || 1) ? [] : data[group.name].filter((_, position) => position !== index))}><X size={14} /></button></div>
          <PricingGroups service={service} groups={group.pricingGroups || []} selections={item.pricingOptions || {}} quantities={item.pricingQuantities || {}} onChange={(pricingOptions, pricingQuantities) => patch({ ...item, pricingOptions, pricingQuantities })} />
          <div className="grid gap-3 sm:grid-cols-2">{fieldsFor(group.fields || [], chosen).map((field) => <Field key={field.name} field={field} value={item.fields?.[field.name]} onChange={(value) => patch({ ...item, fields: { ...item.fields, [field.name]: value } })} />)}</div>
        </div>;
      })}
    </div>)}
  </div>;
}
