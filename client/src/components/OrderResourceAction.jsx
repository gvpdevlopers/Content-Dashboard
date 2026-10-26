import { Download, ExternalLink } from "lucide-react";
import { validResourceUrl } from "../utils/orderResources";

export default function OrderResourceAction({ url, label = "Open delivery", download = false, name, ariaLabel }) {
  const href = validResourceUrl(url);
  if (!href) return null;
  const Icon = download ? Download : ExternalLink;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" download={download ? name || true : undefined}
      aria-label={ariaLabel || label} onClick={(event) => event.stopPropagation()}
      className="dashboard-action dashboard-action--secondary dashboard-action--compact inline-flex max-w-full items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500">
      <Icon size={13} className="shrink-0" aria-hidden="true" /><span className="truncate">{label}</span>
    </a>
  );
}
