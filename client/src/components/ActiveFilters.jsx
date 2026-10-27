import { X } from "lucide-react";

export default function ActiveFilters({ filters, onClear }) {
  const active = filters.filter((filter) => String(filter.value || "").trim());
  if (!active.length) return null;
  return (
    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2" role="group" aria-label="Active filters">
      <span className="text-xs font-medium text-zinc-500">Active filters:</span>
      {active.map(({ label, value }) => (
        <span key={label} title={`${label}: ${value}`} className="max-w-full break-words rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-600 [overflow-wrap:anywhere]">
          {label}: <span className="font-medium">{value}</span>
        </span>
      ))}
      <button type="button" onClick={onClear} aria-label="Clear all filters" className="dashboard-action dashboard-action--secondary dashboard-action--compact">
        <X size={16} aria-hidden="true" />Clear filters
      </button>
    </div>
  );
}
