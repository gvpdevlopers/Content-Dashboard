import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

import serviceService from "../services/serviceService";

import ServicesHero from "../components/public/services/ServicesHero";
import ServiceCard from "../components/public/services/ServiceCard";
import ServicesCTA from "../components/public/services/ServicesCTA";

import Section from "../components/public/Section";
import Reveal from "../components/public/Reveal";
import Stagger, { StaggerItem } from "../components/public/Stagger";
import GradientText from "../components/public/GradientText";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        if (!mounted) return;

        const activeServices = serviceList
          .filter((service) => service?.isActive !== false)
          .sort(
            (a, b) =>
              (a?.displayOrder ?? 0) -
              (b?.displayOrder ?? 0),
          );

        setServices(activeServices);
      } catch (err) {
        console.error("Failed to load public services:", err);

        if (mounted) {
          setError(
            "We couldn't load the services right now. Please try again.",
          );
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
    <>
      <ServicesHero />

      {/* =====================================================
          SERVICES INTRO + GRID
      ====================================================== */}
      <Section className="bg-white !py-14 sm:!py-16 lg:!py-20">
        {/* Heading */}
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
                  bg-zinc-50/80
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
                From strategy and marketing to public relations
                and content production, choose the service that
                fits what you are building next.
              </p>

              <div
                className="
                  mt-5
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-semibold
                  tracking-[-0.01em]
                  text-zinc-700
                  sm:text-sm
                "
              >
                <span>
                  One connected experience from strategy to execution.
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
          {loading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="
                    h-[310px]
                    animate-pulse
                    rounded-[26px]
                    border
                    border-zinc-200
                    bg-zinc-50
                  "
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div
              className="
                rounded-[26px]
                border
                border-red-200
                bg-red-50
                px-6
                py-12
                text-center
              "
            >
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="
                  mt-5
                  rounded-full
                  bg-zinc-950
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:shadow-lg
                "
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && services.length > 0 && (
            <Stagger
              className="
                grid
                gap-5
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              {services.map((service, index) => (
                <StaggerItem
                  key={
                    service?._id ||
                    service?.id ||
                    service?.slug ||
                    index
                  }
                >
                  <ServiceCard
                    service={service}
                    index={index}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          )}

          {!loading && !error && services.length === 0 && (
            <div
              className="
                rounded-[26px]
                border
                border-zinc-200
                bg-zinc-50
                px-6
                py-16
                text-center
              "
            >
              <div className="mx-auto max-w-md">
                <div
                  className="
                    mx-auto
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-zinc-200
                    bg-white
                    text-zinc-500
                    shadow-[0_4px_15px_rgba(0,0,0,0.03)]
                  "
                >
                  <Sparkles
                    size={18}
                    strokeWidth={1.7}
                  />
                </div>

                <h3
                  className="
                    mt-5
                    text-xl
                    font-bold
                    tracking-[-0.025em]
                    text-zinc-900
                  "
                >
                  Services are currently being updated.
                </h3>

                <p
                  className="
                    mt-3
                    text-sm
                    leading-6
                    text-zinc-500
                  "
                >
                  Please check back soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </Section>

      <ServicesCTA />
    </>
  );
};

export default Services;