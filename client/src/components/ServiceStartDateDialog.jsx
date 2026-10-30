import { useMemo, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import Modal from "./Modal";

const kolkataDate = (value = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(value));

export default function ServiceStartDateDialog({ progress, onClose, onSubmit, busy }) {
  const initialDate = useMemo(
    () => (progress?.scheduledStartAt || progress?.startAt ? kolkataDate(progress.scheduledStartAt || progress.startAt) : kolkataDate()),
    [progress],
  );
  const [date, setDate] = useState(initialDate);
  const [error, setError] = useState("");
  const today = kolkataDate();
  const isFuture = date > today;

  const submit = (event) => {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Select a valid start date.");
      return;
    }
    setError("");
    onSubmit(date);
  };

  return (
    <Modal open titleId="service-start-date-title" descriptionId="service-start-date-description" onClose={onClose} busy={busy} className="max-w-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">Service timing</p>
          <h2 id="service-start-date-title" className="mt-1 text-lg font-semibold text-zinc-900">Choose start date</h2>
        </div>
        <button type="button" onClick={onClose} disabled={busy} className="dashboard-action dashboard-action--tertiary dashboard-action--icon" aria-label="Close date picker">
          <X size={18} />
        </button>
      </div>
      <p id="service-start-date-description" className="mt-3 text-sm leading-6 text-zinc-500">
        Select the date work actually began, or a future date to schedule the service. Dates use India Standard Time.
      </p>
      <form onSubmit={submit} className="mt-5">
        <label className="block text-sm font-medium text-zinc-700" htmlFor="service-start-date">Start date</label>
        <div className="relative mt-2">
          <CalendarDays size={16} className="pointer-events-none absolute left-3 top-3.5 text-zinc-400" aria-hidden="true" />
          <input id="service-start-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={busy} className="min-h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
        </div>
        <p className="mt-3 rounded-xl bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
          {isFuture ? `This service will be scheduled for ${date} and remain pending until then.` : `This service will be marked in progress from ${date}.`}
        </p>
        {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="dashboard-action dashboard-action--secondary rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600">Cancel</button>
          <button type="submit" disabled={busy || !date} className="dashboard-action dashboard-action--primary rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">
            {busy ? "Saving..." : isFuture ? "Schedule Service" : "Start Service"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
