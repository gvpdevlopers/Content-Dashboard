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

const OrderItemsOverview = ({ order }) => {
  const items =
    Array.isArray(order?.items) && order.items.length
      ? order.items
      : [
          {
            serviceSnapshot: order?.serviceSnapshot,
            formData: order?.formData,
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
          </article>
        );
      })}
    </section>
  );
};

export default OrderItemsOverview;
