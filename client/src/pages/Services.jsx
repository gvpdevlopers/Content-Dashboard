import { useEffect, useMemo, useState } from "react";

import serviceService from "../services/serviceService";

import ServicesHero from "../components/public/services/ServicesHero";
import ServiceCard from "../components/public/services/ServiceCard";
import ServiceFilters from "../components/public/services/ServiceFilters";
import ServicesCTA from "../components/public/services/ServicesCTA";

import Section from "../components/public/Section";
import Reveal from "../components/public/Reveal";
import Stagger, { StaggerItem } from "../components/public/Stagger";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

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
          .sort((a, b) => (a?.displayOrder ?? 0) - (b?.displayOrder ?? 0));

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

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        services.map((service) => service?.category?.trim()).filter(Boolean),
      ),
    ];

    return ["All", ...uniqueCategories];
  }, [services]);

  const filteredServices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesCategory =
        category === "All" || service?.category?.trim() === category;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        service?.name,
        service?.description,
        service?.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [services, search, category]);

  return (
    <>
      <ServicesHero />

      <Section className="bg-white pt-10 sm:pt-14 lg:pt-16">
        {/* <Reveal>
          <ServiceFilters
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            categories={categories}
            resultCount={filteredServices.length}
          />
        </Reveal> */}

        <div className="mt-10">
          {loading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[310px] animate-pulse rounded-[26px] border border-zinc-200 bg-zinc-50"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-[26px] border border-red-200 bg-red-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-red-700">{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredServices.length > 0 && (
            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <StaggerItem key={service?._id || service?.id || service?.slug}>
                  <ServiceCard service={service} />
                </StaggerItem>
              ))}
            </Stagger>
          )}

          {!loading && !error && filteredServices.length === 0 && (
            <div className="rounded-[26px] border border-zinc-200 bg-zinc-50 px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-xl font-bold tracking-tight text-zinc-900">
                  No services found
                </h3>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Try changing your search or selecting a different category.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                  className="mt-6 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  Clear filters
                </button>
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
