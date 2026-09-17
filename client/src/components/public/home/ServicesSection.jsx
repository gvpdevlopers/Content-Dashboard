import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Layers3,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import serviceService from "../../../services/serviceService";

import Section from "../Section";
import Reveal from "../Reveal";
import Stagger, { StaggerItem } from "../Stagger";
import GradientText from "../GradientText";

const ServicesSection = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadServices = async () => {
      try {
        const response = await serviceService.getPublicServices();

        const serviceList = Array.isArray(response)
          ? response
          : Array.isArray(response?.services)
            ? response.services
            : Array.isArray(response?.data)
              ? response.data
              : [];

        if (mounted) {
          setServices(
            serviceList.filter(
              (service) => service?.isActive !== false
            )
          );
        }
      } catch (error) {
        console.error("Failed to load public services:", error);

        if (mounted) {
          setServices([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Section className="bg-[var(--color-surface-soft)] !py-14 sm:!py-16 lg:!py-20">
      {/* =====================================================
          SECTION INTRO
      ====================================================== */}
      <div className="grid items-end gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <Reveal>
          <div className="max-w-3xl">
            {/* Capsule */}
            <div
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-zinc-200/80
                bg-white/80
                px-3
                py-1.5
                text-[11px]
                font-semibold
                tracking-[0.11em]
                text-zinc-500
                shadow-[0_2px_8px_rgba(0,0,0,0.035)]
                backdrop-blur-md
                sm:gap-2
                sm:px-3.5
                sm:text-xs
              "
            >
              <Sparkles
                size={13}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <span>What we offer</span>
            </div>

            {/* Heading */}
            <h2
              className="
                mt-5
                max-w-3xl
                text-3xl
                font-bold
                leading-[1.02]
                tracking-[-0.045em]
                text-[var(--color-text-primary)]
                sm:mt-6
                sm:text-4xl
                lg:text-5xl
                xl:text-[3.5rem]
              "
            >
              Services built around{" "}
              <GradientText>your goals.</GradientText>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="max-w-xl lg:ml-auto">
            <p
              className="
                text-base
                leading-7
                text-[var(--color-text-muted)]
                sm:text-lg
                sm:leading-8
                lg:text-[1.05rem]
              "
            >
              From strategy and marketing to public relations and
              content production, choose the service that fits what
              you are building next.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs font-semibold tracking-[-0.01em] text-zinc-700 sm:text-sm">
              <span>
                One platform. Multiple ways to move forward.
              </span>

              <ArrowUpRight
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>
          </div>
        </Reveal>
      </div>

      {/* =====================================================
          SERVICES GRID
      ====================================================== */}
      <div className="mt-9 sm:mt-10 lg:mt-12">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="
                  h-[250px]
                  animate-pulse
                  rounded-[24px]
                  border
                  border-[var(--color-border)]
                  bg-white
                "
              />
            ))}
          </div>
        ) : services.length > 0 ? (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((service, index) => (
              <StaggerItem
                key={
                  service?._id ||
                  service?.id ||
                  service?.slug ||
                  index
                }
              >
                <article
                  className="
                    group
                    relative
                    flex
                    h-full
                    min-h-[250px]
                    flex-col
                    overflow-hidden
                    rounded-[24px]
                    border
                    border-zinc-200/90
                    bg-white
                    p-5
                    shadow-[0_4px_18px_rgba(24,24,27,0.025)]
                    transition-all
                    duration-500
                    ease-[cubic-bezier(0.22,1,0.36,1)]
                    hover:-translate-y-1.5
                    hover:border-zinc-300
                    hover:shadow-[0_24px_60px_rgba(24,24,27,0.09)]
                    sm:p-6
                  "
                >
                  {/* Subtle hover glow */}
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      -right-20
                      -top-20
                      h-44
                      w-44
                      rounded-full
                      bg-zinc-200/40
                      opacity-0
                      blur-3xl
                      transition-opacity
                      duration-500
                      group-hover:opacity-100
                    "
                  />

                  {/* Subtle bottom gradient */}
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      inset-x-0
                      bottom-0
                      h-24
                      bg-gradient-to-t
                      from-zinc-50/70
                      to-transparent
                      opacity-0
                      transition-opacity
                      duration-500
                      group-hover:opacity-100
                    "
                  />

                  {/* =================================================
                      TOP ROW
                  ================================================== */}
                  <div className="relative flex items-start justify-between gap-4">
                    {/* Icon */}
                    <div
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-zinc-200
                        bg-zinc-50
                        text-zinc-600
                        shadow-[0_2px_8px_rgba(0,0,0,0.025)]
                        transition-all
                        duration-400
                        group-hover:border-zinc-900
                        group-hover:bg-zinc-900
                        group-hover:text-white
                        group-hover:shadow-[0_8px_20px_rgba(24,24,27,0.14)]
                      "
                    >
                      <Layers3
                        size={18}
                        strokeWidth={1.8}
                      />
                    </div>

                    {/* Number */}
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
                  </div>

                  {/* =================================================
                      CONTENT
                  ================================================== */}
                  <div className="relative mt-7">
                    <div className="flex items-center gap-2">
                      <h3
                        className="
                          text-xl
                          font-bold
                          tracking-[-0.03em]
                          text-zinc-950
                          transition-colors
                          duration-300
                        "
                      >
                        {service.name}
                      </h3>

                    
                    </div>

                    {service.description && (
                      <p
                        className="
                          mt-2.5
                          line-clamp-3
                          max-w-md
                          text-sm
                          leading-6
                          text-zinc-500
                        "
                      >
                        {service.description}
                      </p>
                    )}
                  </div>

                  {/* =================================================
                      FOOTER
                  ================================================== */}
                  <div className="relative mt-auto pt-6">
                    <Link
                      to="/services"
                      className="
                        inline-flex
                        items-center
                        gap-2
                        text-sm
                        font-semibold
                        text-zinc-900
                        transition-colors
                        duration-300
                      "
                    >
                      <span>View service</span>

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
                          transition-all
                          duration-400
                          group-hover:border-zinc-900
                          group-hover:bg-zinc-900
                          group-hover:text-white
                          group-hover:translate-x-0.5
                        "
                      >
                        <ArrowUpRight
                          size={13}
                          strokeWidth={1.9}
                        />
                      </span>
                    </Link>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div
            className="
              rounded-[24px]
              border
              border-[var(--color-border)]
              bg-white
              px-6
              py-10
              text-center
              shadow-[0_4px_18px_rgba(24,24,27,0.025)]
            "
          >
            <div
              className="
                mx-auto
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-2xl
                bg-zinc-100
                text-zinc-500
              "
            >
              <Layers3 size={18} strokeWidth={1.8} />
            </div>

            <p className="mt-4 text-sm font-medium text-zinc-600">
              Services are currently being updated.
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Please check back soon.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          VIEW ALL
      ====================================================== */}
      {services.length > 6 && (
        <Reveal delay={0.1}>
          <div className="mt-7 flex justify-center sm:mt-8">
            <Link
              to="/services"
              className="
                group
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-zinc-300
                bg-white
                px-5
                py-2.5
                text-sm
                font-semibold
                text-zinc-900
                shadow-[0_2px_8px_rgba(0,0,0,0.025)]
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:border-zinc-900
                hover:shadow-[0_10px_25px_rgba(24,24,27,0.08)]
              "
            >
              <span>Explore all services</span>

              <ArrowRight
                size={15}
                strokeWidth={1.8}
                className="
                  transition-transform
                  duration-300
                  group-hover:translate-x-1
                "
              />
            </Link>
          </div>
        </Reveal>
      )}
    </Section>
  );
};

export default ServicesSection;