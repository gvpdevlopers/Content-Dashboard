import { useId } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import FormFeedback from "./FormFeedback";

export default function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", destructive = false, loading = false, onConfirm, onCancel, error }) {
  const id = useId();
  return (
    <Modal open={open} alert busy={loading} onClose={onCancel} titleId={`${id}-title`} descriptionId={`${id}-description`} className="max-w-md">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <AlertTriangle size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="text-lg font-semibold text-zinc-950">
              {title}
            </h2>
            <p id={`${id}-description`} className="mt-2 text-sm leading-6 text-zinc-600">
              {description}
            </p>
          </div>
        </div>

        <FormFeedback message={error} />
        <div className="modal-actions mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            data-modal-initial-focus
            onClick={onCancel}
            className="dashboard-action dashboard-action--secondary rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`dashboard-action ${destructive ? "dashboard-action--destructive" : "dashboard-action--primary"} rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              destructive
                ? "bg-red-700 hover:bg-red-800"
                : "bg-zinc-950 hover:bg-zinc-800"
            }`}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
    </Modal>
  );
}
