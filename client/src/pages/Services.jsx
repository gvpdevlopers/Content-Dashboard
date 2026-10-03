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

const pricingLabels = {
  fixed: "Fixed pricing",
  per_unit: "Per unit",
  starting_from: "Starting from",
  custom: "Custom pricing",
};

const getServiceId = (service, index) =>
  String(service?._id || service?.id || service?.slug || `service-${index + 1}`);

const ServiceOptions = ({ options, dark }) => {
  if (!options.length) {
    return null;
  }

  return (
    <details className="group/options mt-6 text-left">
      <summary
        className={`inline-flex cursor-pointer list-none items-center gap-2 border-b py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-500 ${
          dark
            ? "border-white/30 text-zinc-200 hover:text-white"
            : "border-zinc-300 text-zinc-700 hover:text-zinc-950"
        }`}
      >
        Explore available options
        <span className="transition-transform group-open/options:rotate-45" aria-hidden="true">
          +
        </span>
      </summary>
      <ul className={`mt-4 grid max-w-2xl gap-x-8 gap-y-2 border-l pl-4 sm:grid-cols-2 ${
        dark ? "border-white/30" : "border-zinc-300"
      }`}>
        {options.map((option, index) => (
          <li
            key={option._id || `${option.name}-${index}`}
            className="flex min-w-0 items-baseline justify-between gap-3 py-1 text-sm"
          >
            <span className={`truncate ${dark ? "text-zinc-200" : "text-zinc-700"}`}>
              {option.name}
            </span>
            {Number.isFinite(Number(option.price)) && (
              <span className={`shrink-0 text-xs ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
                ₹{Number(option.price).toLocaleString("en-IN")}
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

  return (
    <>
      <ServicesHero />

      <Section className="bg-white !py-20 sm:!py-28 lg:!py-36">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-4xl text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
              Made around your goals
            </p>
            <HeadingCursor as="h2" className="mt-5 text-4xl font-medium leading-[1] tracking-[-0.065em] text-zinc-950 sm:text-6xl lg:text-7xl">
              One ambition.
              <br />
              <span className="text-zinc-400">Many ways to move it forward.</span>
            </HeadingCursor>
            <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
              Explore the work we do across marketing, public relations, and
              content. Choose a starting point and tailor the details to your project.
            </p>
          </Reveal>

          {loading && (
            <div className="mt-16 border-t border-zinc-200" aria-label="Loading services">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-36 animate-pulse border-b border-zinc-200 bg-zinc-50/50" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="mx-auto mt-12 max-w-xl border-y border-red-200 py-6" role="alert">
              <p className="text-sm text-red-800">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((current) => current + 1)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 underline underline-offset-4"
              >
                <RefreshCw size={15} aria-hidden="true" />
                Try again
              </button>
            </div>
          )}

          {!loading && !error && services.length > 0 && (
            <>
              <nav
                aria-label="Browse services"
                className="-mx-4 mt-12 flex gap-5 overflow-x-auto border-y border-zinc-200 px-4 py-4 sm:mx-0 sm:mt-16 sm:flex-wrap sm:overflow-visible sm:px-0"
              >
                {services.map((service, index) => (
                  <a
                    key={getServiceId(service, index)}
                    href={`#${getServiceId(service, index)}`}
                    className="shrink-0 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                  >
                    {String(index + 1).padStart(2, "0")} / {service.name}
                  </a>
                ))}
              </nav>

              <Stagger className="mt-2">
                {services.map((service, index) => {
                  const serviceId = getServiceId(service, index);
                  const options = Array.isArray(service.pricingOptions)
                    ? service.pricingOptions
                    : [];
                  const pricingLabel =
                    pricingLabels[service.pricingType] || "Service";
                  const presentation = index % 3;

                  if (presentation === 1) {
                    return (
                      <StaggerItem key={serviceId}>
                        <article
                          id={serviceId}
                          className="relative isolate -mx-4 scroll-mt-24 overflow-hidden bg-zinc-950 px-5 py-14 text-center text-white sm:-mx-6 sm:px-10 sm:py-20 lg:-mx-8 lg:py-24"
                        >
                          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                            <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.11),transparent_68%)]" />
                            <svg className="absolute left-1/2 top-1/2 h-[min(90vw,650px)] w-[min(90vw,650px)] -translate-x-1/2 -translate-y-1/2 text-white/[0.14]" viewBox="0 0 600 600" fill="none">
                              <circle cx="300" cy="300" r="180" stroke="currentColor" />
                              <circle cx="300" cy="300" r="240" stroke="currentColor" strokeDasharray="2 10" />
                            </svg>
                          </div>
                          <div className="relative mx-auto max-w-4xl">
                            <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-400 sm:text-xs">
                              {String(index + 1).padStart(2, "0")} / {service.category || "Glow Ventures"} / {pricingLabel}
                            </p>
                            <h3 className="mt-6 text-4xl font-medium leading-[0.98] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8">
                                {service.description}
                              </p>
                            )}
                            <div className="mx-auto w-fit">
                              <ServiceOptions options={options} dark />
                            </div>
                            <Link
                              to="/login"
                              className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white"
                            >
                              Configure this service
                              <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                            </Link>
                          </div>
                        </article>
                      </StaggerItem>
                    );
                  }

                  if (presentation === 0) {
                    return (
                      <StaggerItem key={serviceId}>
                        <article
                          id={serviceId}
                          className="scroll-mt-24 border-b border-zinc-200 py-14 text-center sm:py-20 lg:py-24"
                        >
                          <p className="text-xs font-medium tracking-[0.18em] text-zinc-400">
                            {String(index + 1).padStart(2, "0")} / {service.category || "Glow Ventures"}
                          </p>
                          <h3 className="mx-auto mt-5 max-w-5xl text-4xl font-medium leading-[1.02] tracking-[-0.065em] text-zinc-950 sm:text-6xl lg:text-7xl">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
                              {service.description}
                            </p>
                          )}
                          <div className="mx-auto w-fit">
                            <ServiceOptions options={options} dark={false} />
                          </div>
                          <Link
                            to="/login"
                            className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 transition-colors hover:text-zinc-500"
                          >
                            Configure this service
                            <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                          </Link>
                        </article>
                      </StaggerItem>
                    );
                  }

                  return (
                    <StaggerItem key={serviceId}>
                      <article
                        id={serviceId}
                        className="scroll-mt-24 grid gap-6 border-b border-zinc-200 py-10 sm:grid-cols-[90px_minmax(0,1fr)_minmax(190px,0.65fr)] sm:items-start sm:gap-8 sm:py-14 lg:gap-12"
                      >
                        <p className="pt-1 text-xs font-semibold tracking-[0.18em] text-zinc-400">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {service.category || "Glow Ventures"} / {pricingLabel}
                          </p>
                          <h3 className="mt-3 text-3xl font-medium leading-tight tracking-[-0.055em] text-zinc-950 sm:text-4xl lg:text-5xl">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <div className="sm:pt-1">
                          <ServiceOptions options={options} dark={false} />
                          <Link
                            to="/login"
                            className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 transition-colors hover:text-zinc-500"
                          >
                            Configure service
                            <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </article>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            </>
          )}

          {!loading && !error && services.length === 0 && (
            <p className="mt-12 border-y border-zinc-200 py-12 text-center text-sm text-zinc-500">
              Services are currently being updated. Please check back soon.
            </p>
          )}
        </div>
      </Section>

      <ServicesCTA />
    </>
  );
};

export default Services;
