import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const tones = {
  error: [AlertCircle, "border-red-200 bg-red-50 text-red-700"],
  success: [CheckCircle2, "border-emerald-200 bg-emerald-50 text-emerald-800"],
  info: [Info, "border-blue-200 bg-blue-50 text-blue-800"],
};

export default function FormFeedback({ message, tone = "error", children }) {
  if (!message && !children) return null;
  const [Icon, style] = tones[tone] || tones.error;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`my-4 flex scroll-mt-28 items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-6 ${style}`}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 break-words [overflow-wrap:anywhere]">{message}{children}</div>
    </div>
  );
}
