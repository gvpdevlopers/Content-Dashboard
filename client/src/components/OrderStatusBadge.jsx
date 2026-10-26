import { Activity, CheckCircle2, Clock3, Settings2, XCircle } from "lucide-react";

const statuses = {
  pending: ["Pending", Clock3, "border-amber-200 bg-amber-50 text-amber-700"],
  pending_start: ["Pending Start", Clock3, "border-amber-200 bg-amber-50 text-amber-700"],
  processing: ["Processing", Settings2, "border-blue-200 bg-blue-50 text-blue-700"],
  in_progress: ["In Progress", Activity, "border-blue-200 bg-blue-50 text-blue-700"],
  completed: ["Completed", CheckCircle2, "border-emerald-200 bg-emerald-50 text-emerald-700"],
  delivered: ["Delivered", CheckCircle2, "border-emerald-200 bg-emerald-50 text-emerald-700"],
  cancelled: ["Cancelled", XCircle, "border-red-200 bg-red-50 text-red-700"],
  rejected: ["Rejected", XCircle, "border-red-200 bg-red-50 text-red-700"],
  failed: ["Failed", XCircle, "border-red-200 bg-red-50 text-red-700"],
  period_ended: ["Period Ended", Clock3, "border-amber-200 bg-amber-50 text-amber-700"],
};

export default function OrderStatusBadge({ status }) {
  const [label, Icon, style] = statuses[status] || [
    String(status || "Unknown").replace(/_/g, " "), Clock3, "border-zinc-200 bg-zinc-50 text-zinc-600",
  ];
  return (
    <span className={`inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${style}`}>
      <Icon size={12} className="shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
