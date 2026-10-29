import { CheckCircle2, Clock3, Loader2, RotateCcw, XCircle } from "lucide-react";

const statuses = {
  paid: ["Payment Done", CheckCircle2, "border-emerald-200 bg-emerald-50 text-emerald-700"],
  collected: ["Payment Done", CheckCircle2, "border-emerald-200 bg-emerald-50 text-emerald-700"],
  pending: ["Pending", Clock3, "border-amber-200 bg-amber-50 text-amber-700"],
  processing: ["Processing", Loader2, "border-blue-200 bg-blue-50 text-blue-700"],
  failed: ["Failed", XCircle, "border-red-200 bg-red-50 text-red-700"],
  refunded: ["Refunded", RotateCcw, "border-blue-200 bg-blue-50 text-blue-700"],
};

export default function PaymentStatusBadge({ status }) {
  const normalized = String(status || "unknown").toLowerCase();
  const [label, Icon, style] = statuses[normalized] || [
    normalized.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    Clock3, "border-zinc-200 bg-zinc-50 text-zinc-600",
  ];
  return (
    <span aria-label={`Payment: ${label}`} className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${style}`}>
      <Icon size={12} className="shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
