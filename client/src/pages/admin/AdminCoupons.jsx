import useAsyncResource from "../../hooks/useAsyncResource";
import ConfirmDialog from "../../components/ConfirmDialog";
import ActiveFilters from "../../components/ActiveFilters";
import FormFeedback from "../../components/FormFeedback";
import CustomSelect from "../../components/CustomSelect";
import { useCallback, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  RefreshCw,
  TicketPercent,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import couponService from "../../services/couponService";
import serviceService from "../../services/serviceService";

const emptyForm = {
  code: "",
  serviceDiscounts: [],
  expiresAt: "",
  totalUsageLimit: "",
  perClientUsageLimit: "",
  minimumOrderAmount: "0",
  isActive: true,
};

const errorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const AdminCoupons = () => {
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState("");
  const [togglingId, setTogglingId] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [expandedUsageId, setExpandedUsageId] = useState("");
  const [usagesByCoupon, setUsagesByCoupon] = useState({});
  const [loadingUsageId, setLoadingUsageId] = useState("");
  const [form, setForm] = useState(emptyForm);

  const readData = useCallback(async () => {
    const [couponResponse, serviceResponse] = await Promise.all([
      couponService.listCoupons(), serviceService.getAdminServices(),
    ]);
    return { coupons: couponResponse.coupons || [], services: serviceResponse.services || [] };
  }, []);
  const configureDiscounts = useCallback(({ services }) => {
    setForm((current) => ({ ...current, serviceDiscounts: services.map((service) => ({
      serviceId: String(service._id),
      discountPercent: current.serviceDiscounts.find((entry) => String(entry.serviceId) === String(service._id))?.discountPercent ?? "0",
    })) }));
  }, []);
  const notifyLoadError = useCallback((error) => toast.error(errorMessage(error)), []);
  const { data: { coupons, services }, loading, error: loadError, reload: loadData } = useAsyncResource(readData,
    { initialData: { coupons: [], services: [] }, errorMessage: "Unable to load coupons and services.", onSuccess: configureDiscounts, onError: notifyLoadError });

  const sortedServices = useMemo(
    () =>
      [...services].sort(
        (left, right) =>
          Number(left.displayOrder || 0) - Number(right.displayOrder || 0),
      ),
    [services],
  );

  const filteredCoupons = useMemo(() => coupons.filter((coupon) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || String(coupon.code || "").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? coupon.isActive : !coupon.isActive);
    return matchesSearch && matchesStatus;
  }), [coupons, search, statusFilter]);

  const resetForm = () => {
    setFormError("");
    setFormSuccess("");
    setForm({
      ...emptyForm,
      serviceDiscounts: sortedServices.map((service) => ({
        serviceId: String(service._id),
        discountPercent: "0",
      })),
    });
    setEditingId("");
  };

  const changeDiscount = (serviceId, value) => {
    setForm((current) => ({
      ...current,
      serviceDiscounts: current.serviceDiscounts.map((entry) =>
        entry.serviceId === serviceId
          ? { ...entry, discountPercent: value }
          : entry,
      ),
    }));
  };

  const startEditing = (coupon) => {
    setEditingId(coupon._id);
    setFormError("");
    setFormSuccess("");
    setForm({
      code: coupon.code,
      serviceDiscounts: sortedServices.map((service) => {
        const saved = coupon.serviceDiscounts?.find(
          (entry) => String(entry.serviceId) === String(service._id),
        );
        return {
          serviceId: service._id,
          discountPercent: String(saved?.discountPercent ?? 0),
        };
      }),
      expiresAt: toDateInputValue(coupon.expiresAt),
      totalUsageLimit: coupon.totalUsageLimit ?? "",
      perClientUsageLimit: coupon.perClientUsageLimit ?? "",
      minimumOrderAmount: String(coupon.minimumOrderAmount ?? 0),
      isActive: coupon.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError("");
    setFormSuccess("");
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        serviceDiscounts: form.serviceDiscounts.map((entry) => ({
          serviceId: entry.serviceId,
          discountPercent: Number(entry.discountPercent || 0),
        })),
        totalUsageLimit:
          form.totalUsageLimit === "" ? null : Number(form.totalUsageLimit),
        perClientUsageLimit:
          form.perClientUsageLimit === ""
            ? null
            : Number(form.perClientUsageLimit),
        minimumOrderAmount: Number(form.minimumOrderAmount || 0),
        expiresAt: form.expiresAt || null,
      };
      const response = editingId
        ? await couponService.updateCoupon(editingId, payload)
        : await couponService.createCoupon(payload);
      toast.success(response.message || "Coupon saved.");
      resetForm();
      setFormSuccess(response.message || "Coupon saved successfully.");
      await loadData();
    } catch (error) {
      setFormError(errorMessage(error));
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleCoupon = async (coupon) => {
    if (togglingId) return;
    setTogglingId(coupon._id);
    try {
      const payload = {
        code: coupon.code,
        serviceDiscounts: (coupon.serviceDiscounts || []).map((entry) => ({
          serviceId: entry.serviceId,
          discountPercent: entry.discountPercent,
        })),
        expiresAt: coupon.expiresAt || null,
        totalUsageLimit: coupon.totalUsageLimit ?? null,
        perClientUsageLimit: coupon.perClientUsageLimit ?? null,
        minimumOrderAmount: coupon.minimumOrderAmount ?? 0,
        isActive: !coupon.isActive,
      };
      const response = await couponService.updateCoupon(coupon._id, payload);
      toast.success(response.message);
      await loadData();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setTogglingId("");
    }
  };

  const removeCoupon = async (coupon) => {
    if (!coupon || deletingId) return;
    setDeletingId(coupon._id);
    setDeleteError("");
    try {
      const response = await couponService.deleteCoupon(coupon._id);
      toast.success(response.message);
      setCouponToDelete(null);
      await loadData();
    } catch (error) {
      setDeleteError(errorMessage(error));
      toast.error(errorMessage(error));
    } finally {
      setDeletingId("");
    }
  };

  const toggleUsage = async (couponId) => {
    if (expandedUsageId === couponId) {
      setExpandedUsageId("");
      return;
    }

    setExpandedUsageId(couponId);
    if (usagesByCoupon[couponId]) return;

    try {
      setLoadingUsageId(couponId);
      const response = await couponService.getCouponUsages(couponId);
      setUsagesByCoupon((current) => ({
        ...current,
        [couponId]: response.usages || [],
      }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoadingUsageId("");
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500";

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-zinc-900">
            Coupons
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Create service-specific discounts and review successful coupon
            redemptions.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="dashboard-action dashboard-action--secondary inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <form
        onSubmit={saveCoupon}
        aria-busy={saving}
        onInvalid={() => setFormError("Please complete the highlighted fields before saving.")}
        className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-7"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {editingId ? "Edit coupon" : "Create a coupon"}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Set a percentage for each eligible service. Leave a service at 0%
              to exclude it.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="dashboard-action--icon dashboard-action dashboard-action--tertiary rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"
              aria-label="Cancel editing"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-zinc-600">
            Coupon code
            <input
              required
              maxLength={40}
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  code: event.target.value.toUpperCase(),
                }))
              }
              placeholder="e.g. SOHAM"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-zinc-600">
            Expiry date (optional)
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  expiresAt: event.target.value,
                }))
              }
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-zinc-600">
            Total uses (optional)
            <input
              type="number"
              min="1"
              step="1"
              value={form.totalUsageLimit}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  totalUsageLimit: event.target.value,
                }))
              }
              placeholder="Unlimited"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-zinc-600">
            Uses per client (optional)
            <input
              type="number"
              min="1"
              step="1"
              value={form.perClientUsageLimit}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  perClientUsageLimit: event.target.value,
                }))
              }
              placeholder="Unlimited"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-medium text-zinc-600 sm:col-span-2">
            Minimum order amount (optional)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.minimumOrderAmount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  minimumOrderAmount: event.target.value,
                }))
              }
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-2 self-end rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-zinc-900"
            />
            Coupon is active
          </label>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-zinc-800">
            Service discounts
          </legend>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {sortedServices.map((service) => {
              const discount = form.serviceDiscounts.find(
                (entry) => String(entry.serviceId) === String(service._id),
              );
              return (
                <label
                  key={service._id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 py-3"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-zinc-800">
                      {service.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-zinc-400">
                      {service.category || "Service"}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      required
                      aria-label={`${service.name} discount percentage`}
                      value={discount?.discountPercent ?? "0"}
                      onChange={(event) =>
                        changeDiscount(
                          String(service._id),
                          event.target.value,
                        )
                      }
                      className="w-24 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-right text-sm outline-none focus:border-zinc-500"
                    />
                    <span className="text-sm text-zinc-400">%</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <FormFeedback message={formError} />
        <FormFeedback message={formSuccess} tone="success" />
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-5">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="dashboard-action dashboard-action--secondary rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving || loading || sortedServices.length === 0}
            className="dashboard-action dashboard-action--primary inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : editingId ? (
              <Check size={15} />
            ) : (
              <Plus size={15} />
            )}
            {saving ? "Saving..." : editingId ? "Save changes" : "Create coupon"}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-zinc-900">Existing coupons</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Used coupons are retained for order history and cannot be deleted.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search coupons by code</span>
              <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 text-zinc-400" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search coupon codes..."
                className="min-h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-3 text-sm" />
            </label>
            <div className="w-full sm:w-48">
              <CustomSelect aria-label="Filter coupons by status" value={statusFilter} onChange={setStatusFilter}
                options={[{ value: "all", label: "All statuses" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
            </div>
          </div>
          <ActiveFilters filters={[{ label: "Search", value: search.trim() }, { label: "Status", value: statusFilter === "all" ? "" : statusFilter }]} onClear={() => { setSearch(""); setStatusFilter("all"); }} />
          {!loading && !loadError && <p role="status" className="mt-3 text-xs text-zinc-500">Showing {filteredCoupons.length} of {coupons.length} coupons</p>}
          <FormFeedback message={loadError} />
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-zinc-400">
            <Loader2 size={17} className="animate-spin" /> Loading coupons...
          </div>
        ) : loadError && coupons.length === 0 ? null : filteredCoupons.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <TicketPercent size={24} className="text-zinc-300" />
            <p className="mt-3 text-sm font-medium text-zinc-700">
              {coupons.length ? "No matching coupons" : "No coupons yet"}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {coupons.length ? "Change your search or clear the active filters." : "Create your first coupon using the form above."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredCoupons.map((coupon) => {
              const expanded = expandedUsageId === coupon._id;
              const usage = usagesByCoupon[coupon._id] || [];
              return (
                <article key={coupon._id}>
                  <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold tracking-wide text-zinc-900">
                          {coupon.code}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            coupon.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {(coupon.serviceDiscounts || [])
                          .filter((entry) => entry.discountPercent > 0)
                          .map(
                            (entry) =>
                              `${entry.serviceName}: ${entry.discountPercent}%`,
                          )
                          .join(" · ") || "No service discounts"}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        Uses: {coupon.usageCount || 0}
                        {coupon.totalUsageLimit
                          ? ` / ${coupon.totalUsageLimit}`
                          : " · Unlimited"}
                        {" · "}Minimum {formatCurrency(coupon.minimumOrderAmount)}
                        {coupon.expiresAt
                          ? ` · Expires ${formatDate(coupon.expiresAt)}`
                          : ""}
                      </p>
                    </div>
                    <div className="table-actions">
                      <button
                        type="button"
                        onClick={() => toggleUsage(coupon._id)}
                        title="View coupon usage" aria-expanded={expanded} aria-controls={`coupon-usage-${coupon._id}`}
                        className="dashboard-action dashboard-action--secondary"
                      >
                        {loadingUsageId === coupon._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : expanded ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                        Usage ({coupon.usageCount || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditing(coupon)}
                        disabled={saving || loading}
                        title="Edit coupon" aria-label={`Edit ${coupon.code}`}
                        className="dashboard-action dashboard-action--secondary dashboard-action--icon"
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCoupon(coupon)}
                        disabled={saving || loading || Boolean(togglingId)}
                        title={`${coupon.isActive ? "Deactivate" : "Activate"} coupon`} aria-label={`${coupon.isActive ? "Deactivate" : "Activate"} ${coupon.code}`}
                        className="dashboard-action dashboard-action--secondary dashboard-action--icon"
                      >
                        {togglingId === coupon._id ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Power size={16} aria-hidden="true" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDeleteError(""); setCouponToDelete(coupon); }}
                        disabled={saving || loading || Boolean(deletingId)}
                        title="Delete coupon"
                        className="dashboard-action--icon dashboard-action dashboard-action--destructive rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                        aria-label={`Delete ${coupon.code}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div id={`coupon-usage-${coupon._id}`} className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-4 sm:px-6">
                      {usage.length === 0 ? (
                        <p className="text-xs text-zinc-500">
                          No successful redemptions recorded.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[720px] text-left text-xs">
                            <thead className="text-[10px] uppercase tracking-wide text-zinc-400">
                              <tr>
                                <th className="pb-2 pr-4 font-medium">Client</th>
                                <th className="pb-2 pr-4 font-medium">Order</th>
                                <th className="pb-2 pr-4 font-medium">Discount</th>
                                <th className="pb-2 pr-4 font-medium">
                                  Order total
                                </th>
                                <th className="pb-2 font-medium">Used on</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                              {usage.map((entry) => (
                                <tr key={entry._id}>
                                  <td className="py-2.5 pr-4 text-zinc-700">
                                    {entry.client?.name ||
                                      entry.client?.email ||
                                      "Client"}
                                  </td>
                                  <td className="py-2.5 pr-4 font-medium text-zinc-700">
                                    <span className="block">
                                      {entry.order?.orderNumber || "—"}
                                    </span>
                                    <span className="mt-0.5 block font-normal text-zinc-400">
                                      ID: {entry.order?._id || "—"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 pr-4 text-zinc-700">
                                    {formatCurrency(entry.discountTotal)}
                                  </td>
                                  <td className="py-2.5 pr-4 text-zinc-700">
                                    {formatCurrency(entry.finalTotal)}
                                  </td>
                                  <td className="py-2.5 text-zinc-500">
                                    {formatDate(entry.redeemedAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      <ConfirmDialog open={Boolean(couponToDelete)} title="Delete this coupon?"
        description={`Delete coupon ${couponToDelete?.code || ""}? Coupons with redemptions cannot be deleted.`}
        confirmLabel="Delete coupon" destructive loading={Boolean(deletingId)} error={deleteError}
        onConfirm={() => removeCoupon(couponToDelete)} onCancel={() => { setCouponToDelete(null); setDeleteError(""); }} />
    </div>
  );
};

export default AdminCoupons;
