import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import serviceService from "../../../services/serviceService";
import Section from "../Section";
import Reveal from "../Reveal";
import HeadingCursor from "../HeadingCursor";

const ServicesSection = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadServices = async () => {
      try {
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

  const visibleServices = services.slice(0, 5);

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
          <Link
            to="/services"
            className="group inline-flex w-fit items-center gap-2 pb-1 text-sm font-semibold text-zinc-800 transition-colors hover:text-zinc-500"
          >
            All services
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </Reveal>

        <div className="mt-12 border-t border-zinc-300 sm:mt-16">
          {loading &&
            [0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse border-b border-zinc-300"
                aria-hidden="true"
              />
            ))}

          {!loading &&
            visibleServices.map((service, index) => (
              <Reveal key={service._id || service.slug || service.name} y={16}>
                <Link
                  to="/services"
                  className="group grid min-w-0 grid-cols-[36px_minmax(0,1fr)_28px] gap-x-3 border-b border-zinc-300 py-6 sm:grid-cols-[64px_minmax(0,1fr)_minmax(180px,0.48fr)_32px] sm:items-center sm:gap-5 sm:py-8 lg:py-10"
                >
                  <span className="pt-1 text-[10px] font-semibold tracking-[0.16em] text-zinc-400 sm:text-xs">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 text-xl font-medium leading-tight tracking-[-0.05em] text-zinc-900 transition-transform duration-300 group-hover:translate-x-1 sm:text-2xl lg:text-3xl">
                    {service.name}
                  </span>
                  <span className="hidden text-sm leading-6 text-zinc-500 sm:block">
                    {service.category || "Glow Ventures"}
                  </span>
                  <ArrowUpRight
                    size={20}
                    className="justify-self-end text-zinc-400 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-zinc-950"
                    aria-hidden="true"
                  />
                </Link>
              </Reveal>
            ))}

          {!loading && visibleServices.length === 0 && (
            <p className="border-b border-zinc-300 py-8 text-sm text-zinc-500">
              Explore the full range of services and get in touch to discuss your goals.
            </p>
          )}
        </div>
      </div>
    </Section>
  );
};

export default ServicesSection;
