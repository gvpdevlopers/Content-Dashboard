import { ShieldCheck } from "lucide-react";

const roles = {
  admin: { label: "Admin", style: "border-zinc-200 bg-zinc-50 text-zinc-700" },
  employee: { label: "Employee", style: "border-zinc-200 bg-zinc-50 text-zinc-600" },
  client: { label: "Client", style: "border-zinc-200 bg-zinc-50 text-zinc-500" },
};

export default function RoleBadge({ role }) {
  const key = String(role || "").trim().toLowerCase();
  const badge = roles[key] || { label: "Unknown", style: roles.client.style };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${badge.style}`}>
      {key === "admin" && <ShieldCheck size={12} strokeWidth={1.7} />}
      {badge.label}
    </span>
  );
}
