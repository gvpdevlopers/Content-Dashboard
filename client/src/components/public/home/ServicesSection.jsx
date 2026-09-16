import { useEffect, useState } from "react";
import { ArrowRight, Layers3 } from "lucide-react";
import { Link } from "react-router-dom";

import serviceService from "../../../services/serviceService";

import Section from "../Section";
import SectionHeading from "../SectionHeading";
import Reveal from "../Reveal";
import Stagger, { StaggerItem } from "../Stagger";

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
            serviceList.filter((service) => service?.isActive !== false)
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
    <Section className="bg-[var(--color-surface-soft)]">
      <Reveal>
        <SectionHeading
          eyebrow="What we offer"
          title="Services built around"
          highlight="your goals."
          description="Explore the services available through the Glow Ventures platform and choose the right option for your next project."
        />
      </Reveal>

      <div className="mt-12">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-[24px] border border-[var(--color-border)] bg-white"
              />
            ))}
          </div>
        ) : services.length > 0 ? (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((service) => (
              <StaggerItem key={service._id || service.id || service.slug}>
                <article className="group relative flex h-full min-h-[270px] flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_24px_60px_rgba(24,24,27,0.08)] sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 transition-colors duration-300 group-hover:bg-zinc-900 group-hover:text-white">
                      <Layers3 size={19} />
                    </div>

                    <span className="rounded-full border border-zinc-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                      {service.category || "Service"}
                    </span>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-xl font-bold tracking-[-0.025em] text-zinc-900">
                      {service.name}
                    </h3>

                    {service.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
                        {service.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-7">
                    <Link
                      to="/services"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900"
                    >
                      View service
                      <ArrowRight
                        size={15}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </Link>
                  </div>

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
                  />
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="rounded-[24px] border border-[var(--color-border)] bg-white p-8 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Services are currently being updated. Please check back soon.
            </p>
          </div>
        )}
      </div>

      {services.length > 6 && (
        <Reveal delay={0.1}>
          <div className="mt-8 text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              Explore all services
              <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      )}
    </Section>
  );
};

export default ServicesSection;