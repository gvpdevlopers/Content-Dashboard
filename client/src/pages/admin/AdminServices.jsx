import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Filter,
  Layers3,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ToggleLeft,
  ToggleRight,
  XCircle,
} from "lucide-react";

import serviceService from "../../services/serviceService";
import ConfirmDialog from "../../components/ConfirmDialog";
import { toast } from "sonner";

// ============================================================
// HELPERS
// ============================================================

const getErrorMessage = (error, fallback = "Something went wrong.") => {
  return error?.response?.data?.message || error?.message || fallback;
};

const formatPrice = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₹0";
  }

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const formatPricingType = (pricingType) => {
  switch (pricingType) {
    case "fixed":
      return "Fixed";

    case "per_unit":
      return "Per Unit";

    case "starting_from":
      return "Starting From";

    case "custom":
      return "Custom";

    default:
      return pricingType || "Fixed";
  }
};

// ============================================================
// CUSTOM STATUS BADGE
// ============================================================

const StatusBadge = ({ isActive }) => {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 size={13} />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
      <XCircle size={13} />
      Inactive
    </span>
  );
};

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  icon: Icon,
  label,
  value,
  description,
  iconClassName = "bg-zinc-100 text-zinc-500",
}) => {
  return (
    <div className="rounded-[22px] border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">{label}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-zinc-400">{description}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ADMIN SERVICES
// ============================================================

const AdminServices = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [serviceToToggle, setServiceToToggle] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [togglingServiceId, setTogglingServiceId] = useState(null);

  // ==========================================================
  // FETCH SERVICES
  // ==========================================================

  const fetchServices = useCallback(async (showRefreshLoader = false) => {
    try {
      setError("");

      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await serviceService.getAdminServices();

      setServices(Array.isArray(response?.services) ? response.services : []);
    } catch (err) {
      console.error("Failed to fetch admin services:", err);

      setError(
        getErrorMessage(err, "Unable to load services. Please try again."),
      );
      if (showRefreshLoader) {
        toast.error(
          getErrorMessage(err, "Unable to refresh services. Please try again."),
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // ==========================================================
  // FILTERED SERVICES
  // ==========================================================

  const filteredServices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        !normalizedSearch ||
        service.name?.toLowerCase().includes(normalizedSearch) ||
        service.category?.toLowerCase().includes(normalizedSearch) ||
        service.slug?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && service.isActive) ||
        (statusFilter === "inactive" && !service.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [services, searchTerm, statusFilter]);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalServices = services.length;

  const activeServices = services.filter((service) => service.isActive).length;

  const inactiveServices = services.filter(
    (service) => !service.isActive,
  ).length;

  // ==========================================================
  // TOGGLE SERVICE STATUS
  // ==========================================================

  const handleToggleStatus = (service) => {
    setServiceToToggle(service);
  };

  const confirmToggleStatus = async () => {
    if (!serviceToToggle) {
      return;
    }

    const service = serviceToToggle;
    try {
      setError("");
      setTogglingServiceId(service._id);

      const response = await serviceService.toggleServiceStatus(service._id);

      if (response?.service) {
        setServices((currentServices) =>
          currentServices.map((item) =>
            item._id === service._id ? response.service : item,
          ),
        );
      } else {
        await fetchServices();
      }
      toast.success(
        `Service ${service.isActive ? "deactivated" : "activated"} successfully.`,
      );
    } catch (err) {
      console.error("Failed to toggle service status:", err);

      const message = getErrorMessage(err, "Unable to update service status.");
      setError(message);
      toast.error(message);
    } finally {
      setTogglingServiceId(null);
      setServiceToToggle(null);
    }
  };

  // ==========================================================
  // RENDER LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1500px] animate-fade-up">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
              <RefreshCw size={20} className="animate-spin text-zinc-500" />
            </div>

            <div>
              <p className="font-semibold text-zinc-900">Loading services</p>

              <p className="mt-0.5 text-sm text-zinc-500">
                Fetching service configuration...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-[1500px] animate-fade-up space-y-6">
      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] sm:p-8">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-100/50 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
              <Layers3 size={23} />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                Services
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-[15px]">
                Manage services, pricing, fields, options and service
                availability from one place.
              </p>
            </div>
          </div>

          {/* <button
            type="button"
            onClick={() => navigate("/admin/services/new")}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98]"
          >
            <Plus size={18} />
            Create Service
          </button> */}
          <button
            type="button"
            disabled
            className="
    inline-flex
    h-11
    shrink-0
    cursor-not-allowed
    items-center
    justify-center
    gap-2
    rounded-xl
    border
    border-zinc-200
    bg-zinc-100
    px-5
    text-sm
    font-semibold
    text-zinc-400
    opacity-70
  "
          >
            <Plus size={18} />
            Create Service
          </button>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">Unable to complete request</p>

            <p className="mt-0.5 leading-5 text-red-600">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 text-red-500 transition hover:bg-red-100"
            aria-label="Close error"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* ======================================================
          STATISTICS
      ======================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Boxes}
          label="Total Services"
          value={totalServices}
          description="All configured services"
        />

        <StatCard
          icon={CheckCircle2}
          label="Active Services"
          value={activeServices}
          description="Currently available"
        />

        <StatCard
          icon={XCircle}
          label="Inactive Services"
          value={inactiveServices}
          description="Currently unavailable"
        />
      </div>

      {/* ======================================================
          SEARCH + FILTERS
      ======================================================= */}

      <div className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search services..."
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-10 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
                aria-label="Clear search"
              >
                <XCircle size={17} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Status Filter */}
            <div className="relative">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 w-full min-w-[170px] appearance-none rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-9 text-sm font-medium text-zinc-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              >
                <option value="all">All Services</option>

                <option value="active">Active</option>

                <option value="inactive">Inactive</option>
              </select>

              <ChevronRight
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-zinc-400"
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => fetchServices(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Result count */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4">
          <p className="text-xs font-medium text-zinc-500">
            Showing{" "}
            <span className="font-semibold text-zinc-800">
              {filteredServices.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-zinc-800">{totalServices}</span>{" "}
            services
          </p>

          {(searchTerm || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          EMPTY STATE
      ======================================================= */}

      {filteredServices.length === 0 && (
        <div className="rounded-[24px] border border-zinc-200 bg-white px-6 py-14 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
            <Settings2 size={25} />
          </div>

          <h2 className="mt-5 text-lg font-bold text-zinc-900">
            {services.length === 0
              ? "No services found"
              : "No matching services"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            {services.length === 0
              ? "Create your first service to start managing pricing and dynamic fields."
              : "Try changing your search or status filter."}
          </p>

          {services.length === 0 ? (
            // <button
            //   type="button"
            //   onClick={() => navigate("/admin/services/new")}
            //   className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
            // >
            //   <Plus size={17} />
            //   Create Service
            // </button>
            <button
              type="button"
              disabled
              className="
    inline-flex
    h-11
    shrink-0
    cursor-not-allowed
    items-center
    justify-center
    gap-2
    rounded-xl
    border
    border-zinc-200
    bg-zinc-100
    px-5
    text-sm
    font-semibold
    text-zinc-400
    opacity-70
  "
            >
              <Plus size={18} />
              Create Service
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* ======================================================
          DESKTOP TABLE
      ======================================================= */}

      {filteredServices.length > 0 && (
        <div className="hidden overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Service
                  </th>

                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Category
                  </th>

                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Pricing
                  </th>

                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Fields
                  </th>

                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Options
                  </th>

                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {filteredServices.map((service) => {
                  const fieldCount = Array.isArray(service.fields)
                    ? service.fields.length
                    : 0;

                  const optionCount = Array.isArray(service.pricingOptions)
                    ? service.pricingOptions.length
                    : 0;

                  const isToggling = togglingServiceId === service._id;

                  return (
                    <tr
                      key={service._id}
                      className="transition hover:bg-zinc-50/70"
                    >
                      {/* Service */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                            <Layers3 size={20} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-zinc-900">
                              {service.name}
                            </p>

                            <p className="mt-0.5 max-w-[240px] truncate text-xs text-zinc-400">
                              {service.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-5">
                        <span className="inline-flex rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-zinc-600">
                          {service.category || "—"}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="px-4 py-5">
                        <div>
                          <p className="text-sm font-bold text-zinc-900">
                            {formatPrice(service.basePrice)}
                          </p>

                          <p className="mt-0.5 text-xs text-zinc-500">
                            {formatPricingType(service.pricingType)}

                            {service.unit ? ` / ${service.unit}` : ""}
                          </p>
                        </div>
                      </td>

                      {/* Fields */}
                      <td className="px-4 py-5 text-center">
                        <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-bold text-zinc-700">
                          {fieldCount}
                        </span>
                      </td>

                      {/* Options */}
                      <td className="px-4 py-5 text-center">
                        <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-bold text-zinc-700">
                          {optionCount}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-5 text-center">
                        <StatusBadge isActive={service.isActive} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/services/${service._id}/edit`)
                            }
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Edit3 size={15} />
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handleToggleStatus(service)}
                            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              service.isActive
                                ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {isToggling ? (
                              <RefreshCw size={15} className="animate-spin" />
                            ) : service.isActive ? (
                              <ToggleRight size={16} />
                            ) : (
                              <ToggleLeft size={16} />
                            )}

                            {service.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================
          MOBILE / TABLET CARDS
      ======================================================= */}

      {filteredServices.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {filteredServices.map((service) => {
            const fieldCount = Array.isArray(service.fields)
              ? service.fields.length
              : 0;

            const optionCount = Array.isArray(service.pricingOptions)
              ? service.pricingOptions.length
              : 0;

            const isToggling = togglingServiceId === service._id;

            return (
              <div
                key={service._id}
                className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                      <Layers3 size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-zinc-900">
                        {service.name}
                      </h3>

                      <p className="mt-0.5 truncate text-xs text-zinc-400">
                        {service.slug}
                      </p>
                    </div>
                  </div>

                  <StatusBadge isActive={service.isActive} />
                </div>

                {/* Description */}
                {service.description && (
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-500">
                    {service.description}
                  </p>
                )}

                {/* Service Details */}
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      Category
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-zinc-800">
                      {service.category || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      Price
                    </p>

                    <p className="mt-1 text-sm font-semibold text-zinc-800">
                      {formatPrice(service.basePrice)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      Fields
                    </p>

                    <p className="mt-1 text-sm font-semibold text-zinc-800">
                      {fieldCount}
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      Options
                    </p>

                    <p className="mt-1 text-sm font-semibold text-zinc-800">
                      {optionCount}
                    </p>
                  </div>
                </div>

                {/* Pricing Info */}
                <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-3.5 py-3">
                  <div>
                    <p className="text-xs font-semibold text-zinc-500">
                      Pricing Type
                    </p>

                    <p className="mt-0.5 text-sm font-bold text-zinc-800">
                      {formatPricingType(service.pricingType)}
                    </p>
                  </div>

                  {service.unit && (
                    <div className="text-right">
                      <p className="text-xs font-semibold text-zinc-500">
                        Unit
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-zinc-800">
                        {service.unit}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/admin/services/${service._id}/edit`)
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleStatus(service)}
                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      service.isActive
                        ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {isToggling ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : service.isActive ? (
                      <ToggleRight size={17} />
                    ) : (
                      <ToggleLeft size={17} />
                    )}

                    {service.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(serviceToToggle)}
        title={`${serviceToToggle?.isActive ? "Deactivate" : "Activate"} this service?`}
        description={`This will ${serviceToToggle?.isActive ? "hide" : "make"} "${serviceToToggle?.name || "this service"}" ${serviceToToggle?.isActive ? "from" : "available in"} the client service list.`}
        confirmLabel={serviceToToggle?.isActive ? "Deactivate" : "Activate"}
        loading={Boolean(togglingServiceId)}
        onConfirm={confirmToggleStatus}
        onCancel={() => setServiceToToggle(null)}
      />
    </div>
  );
};

export default AdminServices;
