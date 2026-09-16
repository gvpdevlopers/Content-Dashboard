import {
  ArrowUpRight,
  Layers3,
} from "lucide-react";
import { Link } from "react-router-dom";

const pricingLabels = {
  fixed: "Fixed pricing",
  per_unit: "Per unit",
  starting_from: "Starting from",
  custom: "Custom pricing",
};

const ServiceCard = ({ service }) => {
  const pricingLabel =
    pricingLabels[service?.pricingType] ||
    "Service";

  const hasPricingOptions =
    Array.isArray(service?.pricingOptions) &&
    service.pricingOptions.length > 0;

  return (
    <article className="group relative flex min-h-[310px] flex-col overflow-hidden rounded-[26px] border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgba(24,24,27,0.025)] transition-all duration-300 hover:-translate-y-1.5 hover:border-zinc-300 hover:shadow-[0_25px_65px_rgba(24,24,27,0.09)] sm:p-7">
      {/* Decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      {/* Top */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 transition-all duration-300 group-hover:bg-zinc-950 group-hover:text-white">
          <Layers3 size={20} />
        </div>

        {service?.category && (
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            {service.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative mt-7">
        <h2 className="text-xl font-bold tracking-[-0.025em] text-zinc-950">
          {service?.name}
        </h2>

        {service?.description && (
          <p className="mt-3 line-clamp-4 text-sm leading-6 text-zinc-500">
            {service.description}
          </p>
        )}
      </div>

      {/* Bottom */}
      <div className="relative mt-auto pt-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
            {pricingLabel}
          </span>

          {hasPricingOptions && (
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
              {service.pricingOptions.length} options
            </span>
          )}
        </div>

        <Link
          to="/login"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-950"
        >
          Get started
          <ArrowUpRight
            size={16}
            className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
    </article>
  );
};

export default ServiceCard;