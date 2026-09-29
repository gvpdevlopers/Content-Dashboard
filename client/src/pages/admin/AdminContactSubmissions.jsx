import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Mail,
  MessageSquareText,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import ConfirmDialog from "../../components/ConfirmDialog";
import CustomSelect from "../../components/CustomSelect";
import contactSubmissionService from "../../services/contactSubmissionService";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In progress" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
];

const STATUS_STYLES = {
  new: "border-sky-200 bg-sky-50 text-sky-700",
  contacted: "border-violet-200 bg-violet-50 text-violet-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-800",
  converted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  closed: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

const formatDate = (value) => {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString();
};

const formatStatus = (status) =>
  STATUS_OPTIONS.find((option) => option.value === status)?.label || status;

const AdminContactSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadSubmissions = async () => {
    try {
      const data = await contactSubmissionService.getContactSubmissions();
      setSubmissions(data.submissions);
      setError("");
    } catch (loadError) {
      console.error("Get contact submissions error:", loadError);
      setError(
        loadError.response?.data?.message ||
          "Unable to load contact submissions.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    contactSubmissionService
      .getContactSubmissions()
      .then((data) => {
        if (isCurrent) {
          setSubmissions(data.submissions);
          setError("");
        }
      })
      .catch((loadError) => {
        if (isCurrent) {
          console.error("Get contact submissions error:", loadError);
          setError(
            loadError.response?.data?.message ||
              "Unable to load contact submissions.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const refreshSubmissions = () => {
    setLoading(true);
    setError("");
    loadSubmissions();
  };

  useEffect(() => {
    if (!detailsOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submissionToDelete) {
        setDetailsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailsOpen, submissionToDelete]);

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return submissions.filter((submission) => {
      const matchesSearch =
        !query ||
        [
          submission.name,
          submission.email,
          submission.phone,
          submission.company,
          submission.service,
          submission.message,
        ].some((value) => value?.toLowerCase().includes(query));

      return (
        matchesSearch &&
        (statusFilter === "all" || submission.status === statusFilter)
      );
    });
  }, [search, statusFilter, submissions]);

  const countByStatus = (status) =>
    submissions.filter((submission) => submission.status === status).length;

  const openDetails = async (submissionId) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError("");
    setSelectedSubmission(null);

    try {
      const data =
        await contactSubmissionService.getContactSubmissionById(submissionId);
      setSelectedSubmission(data.submission);
    } catch (loadError) {
      console.error("Get contact submission details error:", loadError);
      setDetailsError(
        loadError.response?.data?.message ||
          "Unable to load this contact submission.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateStatus = async (status) => {
    if (!selectedSubmission || status === selectedSubmission.status) {
      return;
    }

    try {
      setUpdatingStatus(true);
      const data =
        await contactSubmissionService.updateContactSubmissionStatus(
          selectedSubmission._id,
          status,
        );
      setSelectedSubmission(data.submission);
      setSubmissions((current) =>
        current.map((submission) =>
          submission._id === data.submission._id
            ? data.submission
            : submission,
        ),
      );
      toast.success("Contact submission status updated.");
    } catch (updateError) {
      console.error("Update contact submission status error:", updateError);
      toast.error(
        updateError.response?.data?.message ||
          "Unable to update contact submission status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteSubmission = async () => {
    if (!submissionToDelete) {
      return;
    }

    try {
      setDeleting(true);
      await contactSubmissionService.deleteContactSubmission(
        submissionToDelete._id,
      );
      setSubmissions((current) =>
        current.filter(
          (submission) => submission._id !== submissionToDelete._id,
        ),
      );
      setDetailsOpen(false);
      setSelectedSubmission(null);
      setSubmissionToDelete(null);
      toast.success("Contact submission deleted.");
    } catch (deleteError) {
      console.error("Delete contact submission error:", deleteError);
      toast.error(
        deleteError.response?.data?.message ||
          "Unable to delete contact submission.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] animate-fade-up">
      <section className="mb-6 flex flex-col gap-5 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_20px_80px_rgba(0,0,0,0.05)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
            <MessageSquareText size={14} aria-hidden="true" />
            Administration
          </div>
          <h1 className="mt-4 text-3xl font-medium tracking-tight text-zinc-900 sm:text-4xl">
            Contact submissions
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
            Review enquiries from the public contact form and keep their
            follow-up status up to date.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshSubmissions}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 lg:self-center"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
            aria-hidden="true"
          />
          Refresh
        </button>
      </section>

      <section
        aria-label="Submission totals"
        className="mb-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:grid-cols-3 lg:grid-cols-5"
      >
        <SummaryItem label="All enquiries" value={submissions.length} />
        {STATUS_OPTIONS.map((option) => (
          <SummaryItem
            key={option.value}
            label={option.label}
            value={countByStatus(option.value)}
          />
        ))}
      </section>

      {error && (
        <div
          className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={refreshSubmissions}
            className="self-start font-semibold underline underline-offset-4 sm:self-auto"
          >
            Try again
          </button>
        </div>
      )}

      <section className="mb-5 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_10px_35px_rgba(0,0,0,0.03)] sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
        <label className="relative block">
          <span className="sr-only">Search contact submissions</span>
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, service or message..."
            className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 hover:bg-white focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/5"
          />
        </label>
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All statuses" },
            ...STATUS_OPTIONS,
          ]}
        />
      </section>

      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-zinc-800">
          Enquiries
        </h2>
        <p className="text-xs text-zinc-400">
          {filteredSubmissions.length} shown
        </p>
      </div>

      {loading && submissions.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-sm text-zinc-500">
          <RefreshCw size={17} className="mr-2 animate-spin" aria-hidden="true" />
          Loading contact submissions...
        </div>
      ) : filteredSubmissions.length ? (
        <div className="space-y-3">
          {filteredSubmissions.map((submission) => (
            <article
              key={submission._id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.025)] transition hover:border-zinc-300 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="max-w-full truncate text-base font-semibold text-zinc-900">
                      {submission.name}
                    </h3>
                    <StatusBadge status={submission.status} />
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">
                    {submission.service}
                  </p>
                  <div className="mt-3 flex flex-col gap-x-5 gap-y-2 text-xs text-zinc-500 sm:flex-row sm:flex-wrap">
                    <a
                      href={`mailto:${submission.email}`}
                      className="inline-flex min-w-0 items-center gap-2 transition hover:text-zinc-900"
                    >
                      <Mail size={14} className="shrink-0" aria-hidden="true" />
                      <span className="truncate">{submission.email}</span>
                    </a>
                    <a
                      href={`tel:${submission.phone}`}
                      className="inline-flex items-center gap-2 transition hover:text-zinc-900"
                    >
                      <Phone size={14} aria-hidden="true" />
                      {submission.phone}
                    </a>
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={14} aria-hidden="true" />
                      {formatDate(submission.createdAt)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openDetails(submission._id)}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
                >
                  View details
                </button>
              </div>
              <p className="mt-4 line-clamp-2 whitespace-pre-line break-words text-sm leading-6 text-zinc-600">
                {submission.message}
              </p>
              {submission.company && (
                <p className="mt-3 inline-flex items-center gap-2 text-xs text-zinc-400">
                  <Building2 size={14} aria-hidden="true" />
                  {submission.company}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-14 text-center">
          <MessageSquareText
            size={22}
            className="mx-auto text-zinc-400"
            aria-hidden="true"
          />
          <h3 className="mt-4 text-sm font-semibold text-zinc-800">
            {error && submissions.length === 0
              ? "Unable to load enquiries"
              : submissions.length
              ? "No matching enquiries"
              : "No enquiries yet"}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {error && submissions.length === 0
              ? "Please try loading the contact submissions again."
              : submissions.length
              ? "Try a different search or status filter."
              : "New contact form submissions will appear here."}
          </p>
        </div>
      )}

      {detailsOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-zinc-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDetailsOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-submission-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-zinc-200 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  Contact enquiry
                </p>
                <h2
                  id="contact-submission-title"
                  className="mt-2 break-words text-2xl font-medium tracking-tight text-zinc-900"
                >
                  {selectedSubmission?.name || "Submission details"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
                aria-label="Close submission details"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex min-h-48 items-center justify-center text-sm text-zinc-500">
                <RefreshCw
                  size={17}
                  className="mr-2 animate-spin"
                  aria-hidden="true"
                />
                Loading submission...
              </div>
            ) : detailsError ? (
              <div
                className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                role="alert"
              >
                {detailsError}
              </div>
            ) : selectedSubmission ? (
              <>
                <div className="mt-6 grid gap-4 border-y border-zinc-100 py-5 sm:grid-cols-2">
                  <DetailValue
                    icon={Mail}
                    label="Email"
                    value={selectedSubmission.email}
                    href={`mailto:${selectedSubmission.email}`}
                  />
                  <DetailValue
                    icon={Phone}
                    label="Phone"
                    value={selectedSubmission.phone}
                    href={`tel:${selectedSubmission.phone}`}
                  />
                  {selectedSubmission.company && (
                    <DetailValue
                      icon={Building2}
                      label="Company"
                      value={selectedSubmission.company}
                    />
                  )}
                  <DetailValue
                    icon={CalendarDays}
                    label="Submitted"
                    value={formatDate(selectedSubmission.createdAt)}
                  />
                  <DetailValue
                    icon={MessageSquareText}
                    label="Service"
                    value={selectedSubmission.service}
                  />
                </div>

                <div className="mt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Project details
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-zinc-50 p-4 text-sm leading-7 text-zinc-700">
                    {selectedSubmission.message}
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                      Follow-up status
                    </p>
                    <CustomSelect
                      value={selectedSubmission.status}
                      onChange={updateStatus}
                      options={STATUS_OPTIONS}
                      disabled={updatingStatus}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setSubmissionToDelete(selectedSubmission)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Delete
                  </button>
                </div>
                {updatingStatus && (
                  <p className="mt-2 text-xs text-zinc-400" role="status">
                    Saving status...
                  </p>
                )}
              </>
            ) : null}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(submissionToDelete)}
        title="Delete this enquiry?"
        description="This permanently removes the contact submission. This action cannot be undone."
        confirmLabel="Delete enquiry"
        destructive
        loading={deleting}
        onConfirm={deleteSubmission}
        onCancel={() => setSubmissionToDelete(null)}
      />
    </div>
  );
};

const SummaryItem = ({ label, value }) => (
  <div className="border-b border-r border-zinc-100 px-4 py-4 last:border-r-0 sm:px-5">
    <p className="text-xs text-zinc-500">{label}</p>
    <p className="mt-1 text-2xl font-medium tracking-tight text-zinc-900">
      {value}
    </p>
  </div>
);

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
      STATUS_STYLES[status] || STATUS_STYLES.closed
    }`}
  >
    {status === "converted" && (
      <CheckCircle2 size={12} aria-hidden="true" />
    )}
    {formatStatus(status)}
  </span>
);

const DetailValue = ({ icon: Icon, label, value, href }) => (
  <div className="min-w-0">
    <p className="text-xs text-zinc-400">{label}</p>
    <div className="mt-1.5 flex min-w-0 items-center gap-2 text-sm text-zinc-800">
      <Icon size={15} className="shrink-0 text-zinc-400" aria-hidden="true" />
      {href ? (
        <a href={href} className="truncate hover:text-zinc-950 hover:underline">
          {value}
        </a>
      ) : (
        <span className="break-words">{value}</span>
      )}
    </div>
  </div>
);

export default AdminContactSubmissions;
