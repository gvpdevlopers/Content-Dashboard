import CustomSelect from "./CustomSelect";
import OrderStatusBadge from "./OrderStatusBadge";

const formatKolkataDate = (value) => {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
};

const ServiceProgress = ({
  item,
  canManage,
  updatingKey,
  onUpdate,
  compact = false,
  inactive = false,
}) => {
  const progress = item?.serviceProgress;

  if (!progress) {
    return null;
  }

  const status = progress.displayStatus || progress.status;
  const hasProgress = typeof progress.progressPercent === "number" && Number.isFinite(progress.progressPercent) &&
    ((progress.type === "quantity_based" && progress.totalCount > 0) ||
     (progress.type === "time_based" && Boolean(progress.startAt)));
  const progressPercent = hasProgress ? Math.min(100, Math.max(0, progress.progressPercent)) : null;


  return (
    <section className="mt-5 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-zinc-800">
          Service progress
        </h4>
        <div className="flex items-center gap-2">
          {status === "in_progress" && !inactive && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" aria-label="Active delivery" />
          )}
          <OrderStatusBadge status={status} />
        </div>
      </div>

      {hasProgress && <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full motion-safe:transition-[width] ${status === "completed" ? "bg-emerald-500" : "bg-blue-500"}`}
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-label="Service progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
        />
      </div>}

      {progress.type === "time_based" ? (
        <>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
            <span>
              {progress.startAt
                ? `Day ${progress.dayNumber} of ${progress.durationDays}`
                : "30-day service period starts when staff activates the service."}
            </span>
            {progress.startAt && (
              <span>
                {progress.remainingDays}{" "}
                {progress.remainingDays === 1 ? "day" : "days"} remaining
              </span>
            )}
            {progress.startAt && (
              <span>Started {formatKolkataDate(progress.startAt)} IST</span>
            )}
          </div>
          {canManage && (
            <div className="mt-4 flex justify-end">
              {status === "pending_start" ? (
                <button
                  type="button"
                  onClick={() => onUpdate(item._id, { action: "start" })}
                  disabled={updatingKey === `${item._id}:start`}
                  className="dashboard-action dashboard-action--primary rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {updatingKey === `${item._id}:start`
                    ? "Starting..."
                    : "Start Service"}
                </button>
              ) : status !== "completed" ? (
                <button
                  type="button"
                  onClick={() => onUpdate(item._id, { action: "complete" })}
                  disabled={updatingKey === `${item._id}:complete`}
                  className="dashboard-action dashboard-action--secondary rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-wait disabled:opacity-60"
                >
                  {updatingKey === `${item._id}:complete`
                    ? "Updating..."
                    : "Mark Completed"}
                </button>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mt-3 text-xs text-zinc-600">
            {progress.completedCount} of {progress.totalCount} completed
          </p>
          {!compact && <div className="mt-3 divide-y divide-zinc-100">
            {(progress.deliverables || []).map((deliverable) => (
              <div
                key={deliverable.key}
                className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="text-sm text-zinc-700">
                  {deliverable.name}
                </span>
                {canManage ? (
                  <div className="w-full min-w-0 sm:w-40">
                    <CustomSelect compact
                      aria-label={`${deliverable.name} status`}
                      value={deliverable.status}
                      disabled={updatingKey === `${item._id}:${deliverable.key}`}
                      options={[
                        { value: "pending", label: "Pending" },
                        { value: "in_progress", label: "In Progress" },
                        { value: "completed", label: "Completed" },
                      ]}
                      onChange={(status) => onUpdate(item._id, {
                        action: "set_deliverable_status", deliverableKey: deliverable.key, status,
                      })}
                    />
                  </div>
                ) : (
                  <OrderStatusBadge status={deliverable.status} />
                )}
              </div>
            ))}
          </div>}
        </>
      )}
    </section>
  );
};


export default ServiceProgress;
