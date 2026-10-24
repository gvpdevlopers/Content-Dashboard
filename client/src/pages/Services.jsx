import { useEffect, useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import serviceService from "../services/serviceService";
import ServicesHero from "../components/public/services/ServicesHero";
import ServicesCTA from "../components/public/services/ServicesCTA";
import Section from "../components/public/Section";
import Reveal from "../components/public/Reveal";
import Stagger, { StaggerItem } from "../components/public/Stagger";
import HeadingCursor from "../components/public/HeadingCursor";
import {
  formatStartingPrice,
  getServiceStartingPrice,
} from "../components/public/services/servicePricing";

const getServiceId = (service, index) =>
  String(service?._id || service?.id || service?.slug || `service-${index + 1}`);

const getActiveOptions = (service) =>
  Array.isArray(service?.pricingOptions)
    ? service.pricingOptions.filter((option) => option?.isActive !== false)
    : [];

const ServiceOptions = ({ options }) => {
  if (!options.length) {
    return null;
  }

  return (
    <details className="group/options mt-5 text-left">
      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-2 border-b border-zinc-300 py-2 text-sm font-medium text-zinc-700 outline-none transition-colors hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-500">
        Explore available options
        <span
          className="transition-transform group-open/options:rotate-45"
          aria-hidden="true"
        >
          +
        </span>
      </summary>
      <ul className="mt-4 grid max-w-2xl gap-x-8 gap-y-2 border-l border-zinc-300 pl-4 sm:grid-cols-2">
        {options.map((option, index) => (
          <li
            key={option._id || `${option.name}-${index}`}
            className="flex min-w-0 items-baseline justify-between gap-3 py-1 text-sm"
          >
            <span className="truncate text-zinc-700">{option.name}</span>
            {Number.isFinite(Number(option.price)) && (
              <span className="shrink-0 text-xs text-zinc-500">
                {formatStartingPrice(Number(option.price))}
              </span>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadServices = async () => {
      try {
        setLoading(true);
        setError("");

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
            serviceList
              .filter((service) => service?.isActive !== false)
              .sort(
                (left, right) =>
                  (left?.displayOrder ?? 0) - (right?.displayOrder ?? 0),
              ),
          );
        }
      } catch (requestError) {
        console.error("Failed to load public services:", requestError);
        if (mounted) {
          setError("We couldn't load the services right now. Please try again.");
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
    <>
      <ServicesHero />

      <Section className="bg-white !pt-16 !pb-10 sm:!pt-24 sm:!pb-14 lg:!pt-32">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
            Good work, built around your goals
          </p>
          <HeadingCursor
            as="h2"
            className="mt-5 text-4xl font-medium leading-[1] tracking-[-0.065em] text-zinc-950 sm:text-6xl lg:text-7xl"
          >
            One ambition.
            <br />
            <span className="text-zinc-400">Many ways to move it forward.</span>
          </HeadingCursor>
          <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
            Internet marketing, public relations, and content production work
            best when they share a direction. Explore the services below, then
            shape the right combination for your goals.
          </p>
        </Reveal>

        {loading && (
          <div
            className="mx-auto mt-16 max-w-6xl border-t border-zinc-200"
            aria-label="Loading services"
          >
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse border-b border-zinc-200 bg-zinc-50/50"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            className="mx-auto mt-12 max-w-xl border-y border-red-200 py-6"
            role="alert"
          >
            <p className="text-sm text-red-800">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-zinc-900 underline underline-offset-4"
            >
              <RefreshCw size={15} aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && services.length > 0 && (
          <div className="mx-auto mt-14 max-w-6xl sm:mt-20">
            <nav
              aria-label="Browse services"
              className="-mx-4 flex gap-x-5 gap-y-3 overflow-x-auto border-y border-zinc-200 px-4 py-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
            >
              {visibleServices.map((service, index) => (
                <a
                  key={getServiceId(service, index)}
                  href={`#${getServiceId(service, index)}`}
                  className="public-service-nav-link inline-flex min-h-8 shrink-0 items-baseline gap-2 text-xs font-medium text-zinc-500 transition-colors duration-300 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                >
                  <span className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{service.name}</span>
                </a>
              ))}
            </nav>

            <Stagger className="mt-16">
              {services.map((service, index) => {
                const serviceId = getServiceId(service, index);
                const startingPrice = getServiceStartingPrice(service);
                const options = getActiveOptions(service);

                return (
                  <StaggerItem key={serviceId}>
                    <article
                      id={serviceId}
                      className="public-service-row relative scroll-mt-24 border-b border-zinc-200 py-7 transition-colors duration-500 sm:py-9"
                    >
                      <div className="grid min-w-0 gap-5 sm:grid-cols-[52px_minmax(0,1fr)_minmax(155px,0.38fr)] sm:items-start sm:gap-6 lg:grid-cols-[72px_minmax(0,1fr)_minmax(190px,0.42fr)] lg:gap-8">
                        <p className="pt-1 text-[10px] font-semibold tracking-[0.18em] text-zinc-400 sm:text-xs">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <div className="min-w-0">
                          <h3 className="public-service-row__title break-words text-2xl font-medium leading-tight tracking-[-0.05em] text-zinc-950 sm:text-3xl lg:text-4xl">
                            {service.name}
                          </h3>
                          {service.category && (
                            <p className="mt-2 text-xs font-medium text-zinc-500 sm:text-sm">
                              {service.category}
                            </p>
                          )}
                        </div>
                        <div className="sm:pt-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-zinc-400">
                            Investment
                          </p>
                          <p className="public-service-row__price mt-2 text-sm font-medium text-zinc-900 sm:text-base">
                            {startingPrice !== null
                              ? `Starting from ${formatStartingPrice(startingPrice)}`
                              : "Custom pricing"}
                          </p>
                          <Link
                            to="/login"
                            className="group mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-zinc-800 transition-colors duration-300 hover:text-zinc-500"
                          >
                            Configure service
                            <ArrowUpRight
                              size={15}
                              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                              aria-hidden="true"
                            />
                          </Link>
                        </div>
                      </div>
                      <div className="sm:ml-[76px] lg:ml-[104px]">
                        <ServiceOptions options={options} />
                      </div>
                    </article>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <p className="mt-12 text-center text-sm text-zinc-500">
            Service details are being refreshed. Please check back soon or
            contact our team.
          </p>
        )}
      </Section>

      <Section className="overflow-hidden bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 sm:text-xs">
              A clear path from idea to impact
            </p>
            <HeadingCursor
              as="h2"
              className="mt-5 text-4xl font-medium leading-[1] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl"
            >
              The work moves
              <br />
              <span className="text-zinc-500">with a plan.</span>
            </HeadingCursor>
          </Reveal>

          <Stagger className="mt-12 border-t border-white/20 sm:mt-16">
            {[
              {
                number: "01",
                title: "Strategize Plan",
                description:
                  "Start with your ambition, understand the opportunity, and agree on a clear direction for the work.",
              },
              {
                number: "02",
                title: "Spark Progress",
                description:
                  "Bring the right marketing, PR, and creative disciplines together to build momentum.",
              },
              {
                number: "03",
                title: "Drive Growth",
                description:
                  "Put the plan into action, learn from the work, and keep moving toward meaningful outcomes.",
              },
            ].map((step) => (
              <StaggerItem key={step.number}>
                <div className="public-process-row grid gap-3 border-b border-white/20 py-7 sm:grid-cols-[64px_minmax(0,0.9fr)_minmax(220px,0.65fr)] sm:items-center sm:gap-6 sm:py-9">
                  <span className="public-process-row__number text-[10px] font-semibold tracking-[0.18em] text-zinc-500 sm:text-xs">
                    {step.number}
                  </span>
                  <h3 className="public-process-row__title text-2xl font-medium tracking-[-0.05em] text-white sm:text-3xl lg:text-4xl">
                    {step.title}
                  </h3>
                  <p className="public-process-row__description max-w-md text-sm leading-6 text-zinc-400">
                    {step.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section className="bg-[#f7f7f5] !py-12 sm:!py-16 lg:!py-20">
        <Reveal className="mx-auto flex min-h-12 items-center justify-center sm:min-h-16 lg:min-h-20">
          <HeadingCursor
            as="h2"
            className="text-center text-[clamp(1.75rem,6vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.07em] text-zinc-950"
          >
            LET&apos;S MAKE IT MOVE.
          </HeadingCursor>
        </Reveal>
      </Section>

      <ServicesCTA />
    </>
  );
};

export default Services;
