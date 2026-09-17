import { ArrowUpRight, Layers3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const pricingLabels = {
  fixed: "Fixed pricing",
  per_unit: "Per unit",
  starting_from: "Starting from",
  custom: "Custom pricing",
};

const ServiceCard = ({ service, index = 0 }) => {
  const pricingLabel =
    pricingLabels[service?.pricingType] || "Service";

  const hasPricingOptions =
    Array.isArray(service?.pricingOptions) &&
    service.pricingOptions.length > 0;

  return (
    <article
      className="
        group
        relative
        flex
        min-h-[310px]
        flex-col
        overflow-hidden
        rounded-[26px]
        border
        border-zinc-200/90
        bg-white
        p-6
        shadow-[0_6px_24px_rgba(24,24,27,0.025)]
        transition-all
        duration-500
        ease-[cubic-bezier(0.22,1,0.36,1)]
        hover:-translate-y-2
        hover:border-zinc-300
        hover:shadow-[0_24px_60px_rgba(24,24,27,0.09)]
        sm:p-7
      "
    >
      {/* Ambient hover glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-48
          w-48
          rounded-full
          bg-zinc-200/60
          opacity-0
          blur-3xl
          transition-opacity
          duration-700
          group-hover:opacity-100
        "
      />

      {/* Bottom hover gradient */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          bottom-0
          h-28
          bg-gradient-to-t
          from-zinc-50
          to-transparent
          opacity-0
          transition-opacity
          duration-500
          group-hover:opacity-100
        "
      />

      {/* Top */}
      <div className="relative flex items-start justify-between gap-4">
        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            border
            border-zinc-200
            bg-zinc-50
            text-zinc-600
            shadow-[0_2px_8px_rgba(0,0,0,0.025)]
            transition-all
            duration-500
            ease-[cubic-bezier(0.22,1,0.36,1)]
            group-hover:border-zinc-950
            group-hover:bg-zinc-950
            group-hover:text-white
            group-hover:shadow-[0_10px_24px_rgba(24,24,27,0.15)]
          "
        >
          <Layers3
            size={20}
            strokeWidth={1.8}
          />
        </div>

        <div className="flex items-center gap-2">
          <span
            className="
              text-[10px]
              font-bold
              tracking-[0.16em]
              text-zinc-300
              transition-colors
              duration-300
              group-hover:text-zinc-500
            "
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          {service?.category && (
            <span
              className="
                rounded-full
                border
                border-zinc-200
                bg-zinc-50
                px-3
                py-1.5
                text-[10px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-zinc-500
                transition-colors
                duration-300
                group-hover:border-zinc-300
                group-hover:bg-white
              "
            >
              {service.category}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative mt-7">
        <div className="flex items-center gap-2">
          <h2
            className="
              text-xl
              font-bold
              tracking-[-0.03em]
              text-zinc-950
              transition-transform
              duration-500
              ease-[cubic-bezier(0.22,1,0.36,1)]
              group-hover:translate-x-0.5
            "
          >
            {service?.name}
          </h2>

          <Sparkles
            size={13}
            strokeWidth={1.7}
            className="
              text-zinc-300
              opacity-0
              transition-all
              duration-500
              group-hover:translate-x-0.5
              group-hover:text-zinc-500
              group-hover:opacity-100
            "
            aria-hidden="true"
          />
        </div>

        {service?.description && (
          <p
            className="
              mt-3
              line-clamp-4
              max-w-xl
              text-sm
              leading-6
              text-zinc-500
            "
          >
            {service.description}
          </p>
        )}
      </div>

      {/* Bottom */}
      <div className="relative mt-auto pt-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="
              rounded-full
              border
              border-zinc-200
              bg-zinc-50
              px-3
              py-1.5
              text-xs
              font-semibold
              text-zinc-600
              transition-colors
              duration-300
              group-hover:border-zinc-300
              group-hover:bg-white
            "
          >
            {pricingLabel}
          </span>

          {hasPricingOptions && (
            <span
              className="
                rounded-full
                border
                border-zinc-200
                bg-zinc-50
                px-3
                py-1.5
                text-xs
                font-semibold
                text-zinc-600
                transition-colors
                duration-300
                group-hover:border-zinc-300
                group-hover:bg-white
              "
            >
              {service.pricingOptions.length}{" "}
              {service.pricingOptions.length === 1
                ? "option"
                : "options"}
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          to="/login"
          className="
            group/link
            mt-5
            inline-flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-zinc-950
          "
        >
          <span>Get started</span>

          <span
            className="
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-full
              border
              border-zinc-200
              bg-white
              text-zinc-500
              transition-all
              duration-400
              ease-[cubic-bezier(0.22,1,0.36,1)]
              group-hover/link:border-zinc-950
              group-hover/link:bg-zinc-950
              group-hover/link:text-white
            "
          >
            <ArrowUpRight
              size={13}
              strokeWidth={1.9}
              className="
                transition-transform
                duration-300
                group-hover/link:translate-x-0.5
                group-hover/link:-translate-y-0.5
              "
            />
          </span>
        </Link>
      </div>

      {/* Bottom progress line */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-x-6
          bottom-0
          h-px
          origin-left
          scale-x-0
          bg-gradient-to-r
          from-zinc-900
          via-zinc-500
          to-transparent
          transition-transform
          duration-700
          ease-[cubic-bezier(0.22,1,0.36,1)]
          group-hover:scale-x-100
          sm:inset-x-7
        "
      />
    </article>
  );
};

export default ServiceCard;