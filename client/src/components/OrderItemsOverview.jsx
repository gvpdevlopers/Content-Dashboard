const toPlainObject = (value) => {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }

  return value && typeof value === "object" ? value : {};
};

const formatLabel = (value) =>
  String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();

const formatValue = (value) => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
};

const progressStatusLabels = {
  pending_start: "Pending Start",
  in_progress: "In Progress",
  completed: "Completed",
  period_ended: "Period Ended",
  pending: "Pending",
};

const progressStatusStyles = {
  pending_start: "border-zinc-200 bg-zinc-100 text-zinc-600",
  pending: "border-zinc-200 bg-zinc-100 text-zinc-600",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  period_ended: "border-amber-200 bg-amber-50 text-amber-800",
};

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
}) => {
  const progress = item?.serviceProgress;

  if (!progress) {
    return null;
  }

  const status = progress.displayStatus || progress.status;
  const progressPercent = Math.min(
    100,
    Math.max(0, Number(progress.progressPercent) || 0),
  );

  return (
    <section className="mt-5 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-zinc-800">
          Service progress
        </h4>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
            progressStatusStyles[status] || progressStatusStyles.pending_start
          }`}
        >
          {progressStatusLabels[status] || "Pending"}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-zinc-800 transition-[width]"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-label="Service progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
        />
      </div>

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
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60"
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
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-wait disabled:opacity-60"
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
          <div className="mt-3 divide-y divide-zinc-100">
            {(progress.deliverables || []).map((deliverable) => (
              <div
                key={deliverable.key}
                className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="text-sm text-zinc-700">
                  {deliverable.name}
                </span>
                {canManage ? (
                  <select
                    aria-label={`${deliverable.name} status`}
                    value={deliverable.status}
                    disabled={
                      updatingKey === `${item._id}:${deliverable.key}`
                    }
                    onChange={(event) =>
                      onUpdate(item._id, {
                        action: "set_deliverable_status",
                        deliverableKey: deliverable.key,
                        status: event.target.value,
                      })
                    }
                    className="min-w-32 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-500 disabled:opacity-60"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                      progressStatusStyles[deliverable.status] ||
                      progressStatusStyles.pending
                    }`}
                  >
                    {progressStatusLabels[deliverable.status] || "Pending"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

const OrderItemsOverview = ({
  order,
  canManageProgress = false,
  updatingProgressKey = "",
  onProgressUpdate,
}) => {
  const items =
    Array.isArray(order?.items) && order.items.length
      ? order.items
      : [
          {
            serviceSnapshot: order?.serviceSnapshot,
            formData: order?.formData,
            serviceProgress: order?.serviceProgress,
            _id: "legacy",
            quantity: order?.quantity,
            amount: order?.subtotal ?? order?.amount,
          },
        ];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
          Services
        </p>
        <h2 className="mt-1 text-lg font-medium text-zinc-900">
          Order configuration
        </h2>
      </div>

      {items.map((item, itemIndex) => {
        const snapshot = item?.serviceSnapshot || {};
        const formData = toPlainObject(item?.formData);
        const repeatableGroups = Array.isArray(snapshot.repeatableGroups)
          ? snapshot.repeatableGroups
          : [];
        const repeatableNames = new Set(
          repeatableGroups.map((group) => group.name),
        );
        const fields = Object.entries(formData).filter(
          ([name, value]) =>
            !repeatableNames.has(name) &&
            name !== "pricingQuantities" &&
            value !== undefined &&
            value !== null &&
            value !== "",
        );
        const selectedOptions = [
          ...(snapshot.pricingOptions || []),
          ...(snapshot.selectedOptions || []),
          ...(snapshot.selectedOption ? [snapshot.selectedOption] : []),
        ].filter(
          (option, index, all) =>
            option?.name &&
            all.findIndex((candidate) => candidate?.name === option.name) ===
              index,
        );

        return (
          <article
            key={item?._id || `${snapshot.name || "service"}-${itemIndex}`}
            className="rounded-2xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">
                  {snapshot.name || item?.service?.name || "Service"}
                </h3>
                {snapshot.category && (
                  <p className="mt-1 text-xs text-zinc-400">
                    {snapshot.category}
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold text-zinc-900">
                ₹{Number(item?.amount || 0).toLocaleString("en-IN")}
              </p>
            </div>

            {selectedOptions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedOptions.map((option) => (
                  <span
                    key={`${option.group || "option"}-${option.name}`}
                    className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700"
                  >
                    {option.group ? `${formatLabel(option.group)}: ` : ""}
                    {option.name}
                  </span>
                ))}
              </div>
            )}

            {fields.length > 0 && (
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {fields.map(([name, value]) => (
                  <div key={name}>
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                      {formatLabel(name)}
                    </dt>
                    <dd className="mt-1 break-words text-sm text-zinc-700">
                      {formatValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {repeatableGroups.map((group) => {
              const savedItems = Array.isArray(group.items) ? group.items : [];
              const submittedItems = Array.isArray(formData[group.name])
                ? formData[group.name]
                : [];
              const configurations = submittedItems.length
                ? submittedItems
                : savedItems;

              if (!configurations.length) {
                return null;
              }

              return (
                <div key={group.name} className="mt-5 space-y-3">
                  <h4 className="text-sm font-semibold text-zinc-800">
                    {group.label || formatLabel(group.name)} configurations
                  </h4>
                  {configurations.map((configuration, index) => {
                    const saved = savedItems[index] || {};
                    const configurationFields = toPlainObject(
                      configuration?.fields || saved.fields,
                    );
                    const snapshots = toPlainObject(saved.pricingSnapshots);

                    return (
                      <div
                        key={`${group.name}-${index}`}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {group.label || "Item"} {index + 1}
                        </p>
                        {Object.keys(snapshots).length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(snapshots).map(([key, option]) => (
                              <span
                                key={key}
                                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700"
                              >
                                {formatLabel(key)}: {option?.name || "Selected"}
                              </span>
                            ))}
                          </div>
                        )}
                        {Object.keys(configurationFields).length > 0 && (
                          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                            {Object.entries(configurationFields)
                              .filter(
                                ([, value]) =>
                                  value !== undefined &&
                                  value !== null &&
                                  value !== "" &&
                                  !(Array.isArray(value) && !value.length),
                              )
                              .map(([name, value]) => (
                                <div key={name}>
                                  <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                                    {formatLabel(name)}
                                  </dt>
                                  <dd className="mt-1 break-words text-sm text-zinc-700">
                                    {formatValue(value)}
                                  </dd>
                                </div>
                              ))}
                          </dl>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <ServiceProgress
              item={item}
              canManage={canManageProgress}
              updatingKey={updatingProgressKey}
              onUpdate={onProgressUpdate}
            />
          </article>
        );
      })}
    </section>
  );
};

export default OrderItemsOverview;
