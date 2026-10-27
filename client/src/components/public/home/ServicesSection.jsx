import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import serviceService from "../../../services/serviceService";
import Section from "../Section";
import Reveal from "../Reveal";
import HeadingCursor from "../HeadingCursor";
import {
  formatStartingPrice,
  getServiceStartingPrice,
} from "../services/servicePricing";

const ServicesSection = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadServices = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await serviceService.getPublicServices();
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.services)
            ? response.services
            : Array.isArray(response?.data)
              ? response.data
              : [];

        if (mounted) {
          setServices(
            list
              .filter((service) => service?.isActive !== false)
              .sort((left, right) => (left?.displayOrder ?? 0) - (right?.displayOrder ?? 0)),
          );
        }
      } catch (error) {
        console.error("Failed to load public services:", error);
        if (mounted) {
          setError(true);
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
  }, [reloadKey]);

  const visibleServices = services.slice(0, 6);

  return (
    <Section className="bg-[#f2f2f0] !py-20 sm:!py-28 lg:!py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
              A closer look
            </p>
            <HeadingCursor as="h2" className="mt-5 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.065em] text-zinc-950 sm:text-6xl lg:text-7xl">
              The work, made
              <br className="hidden sm:block" />{" "}
              <span className="text-zinc-400">for what’s next.</span>
            </HeadingCursor>
          </div>
          <span className="inline-flex max-w-full">
            <Link
              to="/services"
              className="button-action button-action--ghost group inline-flex w-fit items-center gap-2 pb-1 text-sm font-semibold text-zinc-800 transition-colors hover:text-zinc-500"
            >
              All services
              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </span>
        </Reveal>

        <div className="mt-12 border-t border-zinc-300 sm:mt-16">
          {loading &&
            [0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse border-b border-zinc-300"
                aria-hidden="true"
              />
            ))}

          {!loading &&
            visibleServices.map((service, index) => {
              const startingPrice = getServiceStartingPrice(service);

              return (
                <Reveal
                  key={service._id || service.slug || service.name}
                  y={16}
                >
                  <Link
                    to="/services"
                    className="group grid min-w-0 grid-cols-[32px_minmax(0,1fr)_24px] gap-x-3 border-b border-zinc-300 py-6 transition-colors duration-300 hover:bg-zinc-900/[0.025] sm:grid-cols-[54px_minmax(0,1fr)_minmax(120px,0.42fr)_minmax(140px,0.5fr)_28px] sm:items-center sm:gap-4 sm:py-8 lg:grid-cols-[70px_minmax(0,1.1fr)_minmax(130px,0.45fr)_minmax(170px,0.5fr)_32px] lg:gap-6 lg:py-9"
                  >
                    <span className="row-span-4 pt-1 text-[10px] font-semibold tracking-[0.16em] text-zinc-400 sm:row-span-1 sm:text-xs">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xl font-medium leading-tight tracking-[-0.05em] text-zinc-900 transition-transform duration-300 group-hover:translate-x-1 sm:text-2xl lg:text-3xl">
                        {service.name}
                      </span>
                    </span>
                    <span className="col-start-2 row-start-2 mt-3 text-xs font-medium text-zinc-500 sm:col-start-auto sm:row-start-auto sm:mt-0 sm:text-sm">
                      {service.category || "Glow Ventures"}
                    </span>
                    <span className="col-start-2 row-start-3 mt-1 text-xs font-medium text-zinc-700 sm:col-start-auto sm:row-start-auto sm:mt-0 sm:text-sm">
                      {startingPrice !== null
                        ? `Starting from ${formatStartingPrice(startingPrice)}`
                        : "Custom pricing"}
                    </span>
                    <ArrowUpRight
                      size={20}
                      className="col-start-3 row-start-1 justify-self-end self-start text-zinc-400 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-zinc-950 sm:col-start-auto sm:row-start-auto sm:self-center"
                      aria-hidden="true"
                    />
                  </Link>
                </Reveal>
              );
            })}

          {!loading && visibleServices.length === 0 && (
            <div className="border-b border-zinc-300 py-8">
              <p className="text-sm text-zinc-500" role={error ? "alert" : undefined}>
                {error
                  ? "Services are temporarily unavailable."
                  : "Explore the full range of services and get in touch to discuss your goals."}
              </p>
              {error && (
                <button
                  type="button"
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="mt-3 text-sm font-semibold text-zinc-900 underline underline-offset-4"
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
};

export default ServicesSection;
