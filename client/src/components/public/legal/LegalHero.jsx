import { FileText } from "lucide-react";

import PublicHero from "../PublicHero";

const LegalHero = ({
  eyebrow,
  title,
  description,
  lastUpdated = "September 2026",
  policyType = "Website & Client Platform",
}) => (
  <PublicHero
    className="border-b border-zinc-100 bg-[var(--color-surface-soft)]"
    eyebrow={eyebrow}
    eyebrowIcon={FileText}
    title={title}
    highlight="Glow Ventures."
    description={description}
    meta={
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-zinc-500 sm:text-sm">
        <span>
          <span className="text-zinc-400">Last updated</span>{" "}
          <span className="font-semibold text-zinc-700">{lastUpdated}</span>
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:block" />
        <span>
          <span className="text-zinc-400">Applies to</span>{" "}
          <span className="font-semibold text-zinc-700">{policyType}</span>
        </span>
      </div>
    }
  />
);

export default LegalHero;
