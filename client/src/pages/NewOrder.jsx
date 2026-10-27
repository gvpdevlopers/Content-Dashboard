import { formatDraftDate, getDraftLabel } from "../utils/draftLabels";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  History,
  Info,
  Landmark,
  Loader2,
  Minus,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import OrderSuccess from "../components/OrderSuccess";
import AdCreditCheckout from "../components/AdCreditCheckout";
import adCreditService from "../services/adCreditService";
import orderService from "../services/orderService";
import draftService from "../services/draftService";
import serviceService from "../services/serviceService";
import paymentService from "../services/paymentService";
import CustomSelect from "../components/CustomSelect";
import OrderActionSection from "../components/OrderActionSection";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/*
|--------------------------------------------------------------------------
| Constants / Helpers
|--------------------------------------------------------------------------
*/

const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const isGridPostsService = (service) =>
  String(service?.slug || "").toLowerCase() === "social-media-grid-posts";

const getGridPricingMode = (service, key) =>
  (Array.isArray(service?.pricingModes) ? service.pricingModes : []).find(
    (mode) => mode.key === (key || "line"),
  ) || null;

const getSortedItems = (items = []) => {
  return [...items].sort(
    (a, b) => Number(a?.order || 0) - Number(b?.order || 0),
  );
};

const getPricingOptions = (service) => {
  if (!Array.isArray(service?.pricingOptions)) {
    return [];
  }

  return getSortedItems(
    service.pricingOptions.filter(
      (option) => option && option.isActive !== false,
    ),
  );
};

const getPricingGroups = (service) => {
  const options = getPricingOptions(service);

  const groups = [];
  const groupMap = new Map();

  options.forEach((option) => {
    const groupName = String(option.group || "").trim();
    const key = groupName || "__ungrouped__";

    if (!groupMap.has(key)) {
      const group = {
        key,
        name: groupName,
        options: [],
      };

      groupMap.set(key, group);
      groups.push(group);
    }

    groupMap.get(key).options.push(option);
  });

  return groups;
};

const isGroupedService = (service) => {
  return getPricingOptions(service).some(
    (option) => String(option?.group || "").trim() !== "",
  );
};

const getQuantityRules = (service, pricingOption) => {
  const minQuantity = Math.max(
    1,
    Number(pricingOption?.minQuantity ?? service?.minQuantity ?? 1),
  );

  const rawMax =
    pricingOption?.maxQuantity ?? service?.maxQuantity ?? undefined;

  const parsedMax =
    rawMax !== undefined && rawMax !== null && rawMax !== ""
      ? Number(rawMax)
      : undefined;

  return {
    minQuantity,
    maxQuantity:
      Number.isFinite(parsedMax) && parsedMax >= minQuantity
        ? parsedMax
        : undefined,
  };
};

const isEmptyValue = (value) => {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
};

const normalizeFieldType = (field) => {
  if (!field?.type) {
    return "text";
  }

  return String(field.type).toLowerCase();
};

const getRepeatableGroups = (service) => {
  if (!Array.isArray(service?.repeatableGroups)) {
    return [];
  }

  return getSortedItems(
    service.repeatableGroups.filter(
      (group) => group && group.isActive !== false,
    ),
  );
};

const getRepeatableGroupRules = (group) => {
  const rawMin = Number(group?.minItems ?? 1);
  const rawMax = Number(group?.maxItems ?? 10);

  const minItems = Number.isFinite(rawMin) ? Math.max(0, rawMin) : 1;

  const maxItems =
    Number.isFinite(rawMax) && rawMax >= Math.max(1, minItems)
      ? rawMax
      : Math.max(10, minItems);

  return {
    minItems,
    maxItems,
  };
};

/*
|--------------------------------------------------------------------------
| Repeatable Group Pricing Helpers
|--------------------------------------------------------------------------
|
| Repeatable groups (e.g. "reels") may declare their own pricingGroups
| (e.g. ["shoot", "drone", "host"]) which reference the same grouped
| pricing options already available on the service via `option.group`.
| Each repeatable entry keeps its own independent selection/quantity for
| every pricing group it exposes.
|
*/

const getRepeatableGroupPricingGroups = (service, group) => {
  const pricingGroupNames = Array.isArray(group?.pricingGroups)
    ? group.pricingGroups.map((name) => String(name))
    : [];

  if (!pricingGroupNames.length) {
    return [];
  }

  const allowedNames = new Set(pricingGroupNames);

  return getPricingGroups(service).filter((pricingGroup) =>
    allowedNames.has(String(pricingGroup.name)),
  );
};

const isRepeatableOnlyService = (service) => {
  const repeatableGroups = getRepeatableGroups(service);

  if (!repeatableGroups.length) {
    return false;
  }

  const serviceFields = Array.isArray(service?.fields) ? service.fields : [];
  const repeatablePricingGroupNames = new Set(
    repeatableGroups.flatMap((group) =>
      Array.isArray(group.pricingGroups) ? group.pricingGroups.map(String) : [],
    ),
  );

  return (
    serviceFields.length === 0 &&
    getPricingGroups(service).every((pricingGroup) =>
      repeatablePricingGroupNames.has(pricingGroup.name),
    )
  );
};

const normalizeRepeatableFieldLabel = (field) =>
  String(field?.label || field?.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getActiveFieldsForRepeatableEntry = (service, group, entry) => {
  const fieldMap = new Map();
  const seenLabels = new Set();

  // 1. Common fields defined on the repeatable group
  const groupFields = Array.isArray(group?.fields) ? group.fields : [];

  for (const field of groupFields) {
    const fieldName = String(field?.name || "").trim();

    if (fieldName) {
      fieldMap.set(fieldName, field);
      seenLabels.add(normalizeRepeatableFieldLabel(field));
    }
  }

  // 2. Fields from selected pricing options
  const selectedOptionIds = new Set(
    Object.values(entry?.pricingOptions || {})
      .filter(Boolean)
      .map((id) => String(id)),
  );

  if (selectedOptionIds.size > 0) {
    const pricingGroups = getRepeatableGroupPricingGroups(service, group);

    for (const pricingGroup of pricingGroups) {
      const options = Array.isArray(pricingGroup?.options)
        ? pricingGroup.options
        : [];

      for (const option of options) {
        if (!selectedOptionIds.has(String(option?._id))) {
          continue;
        }

        const optionFields = Array.isArray(option?.fields) ? option.fields : [];

        for (const field of optionFields) {
          const fieldName = String(field?.name || "").trim();
          const normalizedLabel = normalizeRepeatableFieldLabel(field);

          if (
            !fieldName ||
            fieldMap.has(fieldName) ||
            seenLabels.has(normalizedLabel)
          ) {
            continue;
          }

          fieldMap.set(fieldName, field);
          seenLabels.add(normalizedLabel);
        }
      }
    }
  }

  return getSortedItems(Array.from(fieldMap.values()));
};

const isRequiredRepeatablePricingGroup = (group, pricingGroupName) => {
  const requiredNames = Array.isArray(group?.requiredPricingGroups)
    ? group.requiredPricingGroups.map((name) => String(name))
    : [];

  return requiredNames.includes(String(pricingGroupName));
};

const getRepeatableEntryPricingTotal = (service, group, entry) => {
  const pricingGroups = getRepeatableGroupPricingGroups(service, group);

  if (!pricingGroups.length) {
    return 0;
  }

  let total = 0;

  for (const pricingGroup of pricingGroups) {
    const selectedOptionId = entry?.pricingOptions?.[pricingGroup.name];

    if (!selectedOptionId) {
      continue;
    }

    const option = pricingGroup.options.find(
      (candidate) => String(candidate._id) === String(selectedOptionId),
    );

    if (!option) {
      continue;
    }

    const rules = getQuantityRules(service, option);

    const rawQuantity = entry?.pricingQuantities?.[pricingGroup.name];

    const quantity =
      rawQuantity !== undefined && rawQuantity !== null
        ? Number(rawQuantity)
        : rules.minQuantity;

    total +=
      Number(option.price || 0) *
      (Number.isFinite(quantity) ? quantity : rules.minQuantity);
  }

  return total;
};

const createEmptyRepeatableItem = (group) => {
  const item = {
    pricingOptions: {},
    pricingQuantities: {},
    fields: {},
  };

  if (Array.isArray(group?.fields)) {
    group.fields.forEach((field) => {
      const fieldName = String(field?.name || "").trim();

      if (!fieldName) {
        return;
      }

      if (normalizeFieldType(field) === "checkbox") {
        item.fields[fieldName] = [];
      } else {
        item.fields[fieldName] = "";
      }
    });
  }

  return item;
};

const createInitialRepeatableData = (service) => {
  const data = {};

  getRepeatableGroups(service).forEach((group) => {
    const { minItems } = getRepeatableGroupRules(group);

    if (minItems > 0) {
      data[group.name] = Array.from({ length: minItems }, () =>
        createEmptyRepeatableItem(group),
      );
    }
  });

  return data;
};

const getActiveFieldsForItem = (item) => {
  if (!item?.service) {
    return [];
  }

  const serviceFields = Array.isArray(item.service.fields)
    ? item.service.fields
    : [];

  const selectedOptions = item.isGroupedPricing
    ? Object.values(item.selectedPricingOptions || {}).filter(Boolean)
    : item.selectedPricingOption
      ? [item.selectedPricingOption]
      : [];

  const fieldMap = new Map();

  for (const field of serviceFields) {
    const fieldName = String(field?.name || "").trim();

    if (fieldName) {
      fieldMap.set(fieldName, field);
    }
  }

  for (const pricingOption of selectedOptions) {
    if (!Array.isArray(pricingOption?.fields)) {
      continue;
    }

    for (const field of pricingOption.fields) {
      const fieldName = String(field?.name || "").trim();

      if (fieldName) {
        fieldMap.set(fieldName, field);
      }
    }
  }

  return getSortedItems(Array.from(fieldMap.values()));
};

const getFieldValuesPrice = (activeFields, values = {}) => {
  let total = 0;

  for (const field of activeFields) {
    const fieldValue = values?.[field.name];

    if (isEmptyValue(fieldValue)) {
      continue;
    }

    const selectedValues = Array.isArray(fieldValue)
      ? fieldValue
      : [fieldValue];

    for (const selectedValue of selectedValues) {
      const selectedOption = (field.options || []).find(
        (option) => String(option.value) === String(selectedValue),
      );

      if (selectedOption) {
        total += Number(selectedOption.price || 0);
      }
    }

    if (field.includeValueInPrice) {
      const numericValue = Number(fieldValue);

      if (Number.isFinite(numericValue)) {
        total += numericValue;
      }
    }
  }

  return total;
};

const getSelectedFieldsPrice = (item) =>
  getFieldValuesPrice(getActiveFieldsForItem(item), item.formData);

const getRepeatableGroupsPrice = (item) => {
  const groups = getRepeatableGroups(item?.service);

  if (!groups.length) {
    return 0;
  }

  let total = 0;

  for (const group of groups) {
    const entries = Array.isArray(item.formData?.[group.name])
      ? item.formData[group.name]
      : [];

    if (!entries.length) {
      continue;
    }

    for (const entry of entries) {
      const activeFields = getActiveFieldsForRepeatableEntry(
        item.service,
        group,
        entry,
      );
      total += getFieldValuesPrice(activeFields, entry?.fields || entry);

      total += getRepeatableEntryPricingTotal(item.service, group, entry);
    }
  }

  return total;
};

const getItemQuantity = (item) => {
  const quantityOption = item.isGroupedPricing
    ? null
    : item.selectedPricingOption;

  const rules = getQuantityRules(item.service, quantityOption);

  const rawQuantity = Number(item.formData?.quantity || rules.minQuantity);

  if (!Number.isFinite(rawQuantity)) {
    return rules.minQuantity;
  }

  let normalized = Math.floor(rawQuantity);

  normalized = Math.max(rules.minQuantity, normalized);

  if (rules.maxQuantity !== undefined) {
    normalized = Math.min(rules.maxQuantity, normalized);
  }

  return normalized;
};

const getGroupedOptionQuantity = (item, groupKey, option) => {
  const rules = getQuantityRules(item.service, option);
  const rawQuantity = item.pricingQuantities?.[groupKey];

  const quantity =
    rawQuantity !== undefined && rawQuantity !== null
      ? Number(rawQuantity)
      : rules.minQuantity;

  if (!Number.isFinite(quantity)) {
    return rules.minQuantity;
  }

  let normalized = Math.floor(quantity);

  normalized = Math.max(rules.minQuantity, normalized);

  if (rules.maxQuantity !== undefined) {
    normalized = Math.min(rules.maxQuantity, normalized);
  }

  return normalized;
};

const getItemEstimate = (item) => {
  if (!item?.service) {
    return 0;
  }

  const selectedFieldsPrice = getSelectedFieldsPrice(item);
  const repeatableGroupsPrice = getRepeatableGroupsPrice(item);

  const selectedOptions = Object.values(
    item.selectedPricingOptions || {},
  ).filter(Boolean);

  if (item.isGroupedPricing) {
    if (selectedOptions.length > 0) {
      return (
        selectedOptions.reduce((total, option) => {
          const groupKey = String(option.group || "").trim() || "__ungrouped__";

          const quantity = getGroupedOptionQuantity(item, groupKey, option);

          return total + Number(option.price || 0) * quantity;
        }, 0) +
        selectedFieldsPrice +
        repeatableGroupsPrice
      );
    }

    return selectedFieldsPrice + repeatableGroupsPrice;
  }

  const quantity = getItemQuantity(item);
  const gridPricingMode = getGridPricingMode(
    item.service,
    item.formData?.pricingMode,
  );

  let basePrice;

  if (item.selectedPricingOption) {
    basePrice = Number(item.selectedPricingOption.price || 0) * quantity;
  } else if (gridPricingMode) {
    basePrice = Number(gridPricingMode.unitPrice || 0) * quantity;
  } else {
    switch (item.service.pricingType) {
      case "fixed":
        basePrice = Number(item.service.basePrice || 0);
        break;

      case "per_unit":
      case "starting_from":
        basePrice = Number(item.service.basePrice || 0) * quantity;
        break;

      case "custom":
        basePrice = 0;
        break;

      default:
        basePrice = Number(item.service.basePrice || 0);
        break;
    }
  }

  return basePrice + selectedFieldsPrice + repeatableGroupsPrice;
};

const isCustomUnpricedItem = (item) => {
  if (!item?.service) {
    return false;
  }

  if (item.service.pricingType !== "custom") {
    return false;
  }

  if (item.isGroupedPricing) {
    if (isRepeatableOnlyService(item.service)) {
      return getItemEstimate(item) <= 0;
    }

    return (
      Object.values(item.selectedPricingOptions || {}).filter(Boolean)
        .length === 0
    );
  }

  return !item.selectedPricingOption;
};

const createOrderItem = (service) => {
  const grouped = isGroupedService(service);
  const pricingOptions = getPricingOptions(service);
  const quantityRules = getQuantityRules(service, null);
  const repeatableOnly = isRepeatableOnlyService(service);

  const shouldHaveQuantity =
    !repeatableOnly &&
    (service.pricingType === "per_unit" ||
      service.pricingType === "starting_from" ||
      pricingOptions.length > 0);

  return {
    service,
    isGroupedPricing: grouped,
    selectedPricingOption: null,
    selectedPricingOptions: {},
    pricingQuantities: {},
    formData: {
      ...(shouldHaveQuantity ? { quantity: quantityRules.minQuantity } : {}),
      ...(isGridPostsService(service) ? { pricingMode: "line" } : {}),
      ...createInitialRepeatableData(service),
    },
  };
};

const asPlainObject = (value) => {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }

  if (value && typeof value.toObject === "function") {
    return value.toObject();
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
};

const getSavedOrderItems = (order) => {
  if (Array.isArray(order?.items) && order.items.length > 0) {
    return order.items;
  }

  return order?.service || order?.serviceSnapshot
    ? [
        {
          service: order.service,
          serviceSnapshot: order.serviceSnapshot,
          quantity: order.quantity,
          formData: order.formData,
        },
      ]
    : [];
};

const getSavedOptionId = (option) =>
  option?.id || option?._id || option?.optionId || "";

const restoreOrderItems = (order, activeServices) => {
  const restoredItems = [];
  const issues = [];
  const savedItems = getSavedOrderItems(order);

  const findCurrentService = (savedItem) => {
    const snapshot = savedItem?.serviceSnapshot || {};
    const savedService = savedItem?.service;
    const savedId =
      savedService?._id || savedService || snapshot.serviceId || snapshot.id;
    const savedSlug = snapshot.slug || savedService?.slug;

    return (
      activeServices.find(
        (service) => savedId && String(service._id) === String(savedId),
      ) ||
      activeServices.find(
        (service) => savedSlug && service.slug === savedSlug,
      ) ||
      (() => {
        const savedName = snapshot.name || savedService?.name;
        const matches = activeServices.filter(
          (service) => savedName && service.name === savedName,
        );
        return matches.length === 1 ? matches[0] : null;
      })()
    );
  };

  for (const [itemIndex, savedItem] of savedItems.entries()) {
    const service = findCurrentService(savedItem);

    if (!service) {
      issues.push(
        `Service ${itemIndex + 1} from the previous order is no longer available and was skipped.`,
      );
      continue;
    }

    const snapshot = savedItem.serviceSnapshot || {};
    const savedFormData = asPlainObject(savedItem.formData);
    const savedSnapshotOptions = [
      ...(Array.isArray(snapshot.selectedOptions)
        ? snapshot.selectedOptions
        : []),
      ...(Array.isArray(snapshot.pricingOptions)
        ? snapshot.pricingOptions
        : []),
    ];
    const savedSingleOption =
      snapshot.selectedOption || savedSnapshotOptions[0] || null;
    const nextItem = createOrderItem(service);

    if (nextItem.isGroupedPricing) {
      const missingPricingGroups = [];
      const currentGroups = getPricingGroups(service);
      const currentGroupNames = new Set(
        currentGroups.map((group) => group.name),
      );

      const savedGroupNames = new Set([
        ...savedSnapshotOptions
          .map((option) => String(option.group || ""))
          .filter(Boolean),
        ...Object.keys(asPlainObject(savedFormData.pricingQuantities)),
      ]);

      for (const groupName of savedGroupNames) {
        if (!currentGroupNames.has(groupName)) {
          issues.push(
            `${service.name}: the previous ${groupName} option is no longer available and was not restored.`,
          );
        }
      }

      for (const group of currentGroups) {
        const savedOption = savedSnapshotOptions.find(
          (option) => String(option.group || "") === String(group.name),
        );
        const savedOptionId =
          savedFormData[group.name] || getSavedOptionId(savedOption);
        const currentOption = group.options.find(
          (option) => String(option._id) === String(savedOptionId),
        );

        if (currentOption) {
          nextItem.selectedPricingOptions[group.key] = currentOption;
          const rules = getQuantityRules(service, currentOption);
          const rawQuantity =
            asPlainObject(savedFormData.pricingQuantities)[group.name] ??
            savedOption?.quantity ??
            rules.minQuantity;
          const quantity = Number(rawQuantity);

          nextItem.pricingQuantities[group.key] =
            Number.isInteger(quantity) &&
            quantity >= rules.minQuantity &&
            (rules.maxQuantity === undefined || quantity <= rules.maxQuantity)
              ? quantity
              : rules.minQuantity;
          nextItem.formData[group.name] = String(currentOption._id);
        } else if (savedOptionId) {
          missingPricingGroups.push(group.name || group.key);
          issues.push(
            `${service.name}: the previous ${group.name || "pricing"} option is no longer available. Choose a replacement before submitting.`,
          );
        }
      }

      if (missingPricingGroups.length > 0) {
        nextItem._missingPricingGroups = missingPricingGroups;
      }
    } else if (getPricingOptions(service).length > 0) {
      const savedOptionId = getSavedOptionId(savedSingleOption);
      const currentOption = getPricingOptions(service).find(
        (option) => String(option._id) === String(savedOptionId),
      );

      if (currentOption) {
        nextItem.selectedPricingOption = currentOption;
        const rules = getQuantityRules(service, currentOption);
        const rawQuantity = Number(savedItem.quantity || rules.minQuantity);
        nextItem.formData.quantity =
          Number.isInteger(rawQuantity) &&
          rawQuantity >= rules.minQuantity &&
          (rules.maxQuantity === undefined || rawQuantity <= rules.maxQuantity)
            ? rawQuantity
            : rules.minQuantity;
      } else if (savedOptionId || savedItem.amount > 0) {
        nextItem._requiresPricingOption = true;
        issues.push(
          `${service.name}: its previous pricing option could not be restored. Choose a current option before submitting.`,
        );
      }
    } else if (
      service.pricingType === "per_unit" ||
      service.pricingType === "starting_from"
    ) {
      const rules = getQuantityRules(service, null);
      const rawQuantity = Number(savedItem.quantity || rules.minQuantity);
      nextItem.formData.quantity =
        Number.isInteger(rawQuantity) &&
        rawQuantity >= rules.minQuantity &&
        (rules.maxQuantity === undefined || rawQuantity <= rules.maxQuantity)
          ? rawQuantity
          : rules.minQuantity;
    } else if (savedSingleOption || savedSnapshotOptions.length > 0) {
      issues.push(
        `${service.name}: its previous pricing option is no longer available and was not restored.`,
      );
    }

    const savedRepeatableGroups = savedFormData;
    const snapshotRepeatableGroups = Array.isArray(snapshot.repeatableGroups)
      ? snapshot.repeatableGroups
      : [];

    for (const group of getRepeatableGroups(service)) {
      const savedGroupSnapshot = snapshotRepeatableGroups.find(
        (savedGroup) => savedGroup.name === group.name,
      );
      const savedEntries = Array.isArray(savedRepeatableGroups[group.name])
        ? savedRepeatableGroups[group.name]
        : Array.isArray(savedGroupSnapshot?.items)
          ? savedGroupSnapshot.items
          : [];

      if (savedEntries.length === 0) {
        continue;
      }

      const currentPricingGroups = getRepeatableGroupPricingGroups(
        service,
        group,
      );
      const restoredEntries = savedEntries.map((savedEntry, entryIndex) => {
        const savedPricingOptions = asPlainObject(savedEntry?.pricingOptions);
        const savedQuantities = asPlainObject(savedEntry?.pricingQuantities);
        const savedPricingSnapshots = asPlainObject(
          savedEntry?.pricingSnapshots,
        );
        const restoredEntry = createEmptyRepeatableItem(group);
        const missingPricingGroups = [];
        const currentPricingGroupNames = new Set(
          currentPricingGroups.map((pricingGroup) => pricingGroup.name),
        );
        const savedPricingGroupNames = new Set([
          ...Object.entries(savedPricingOptions)
            .filter(([, optionId]) => Boolean(optionId))
            .map(([name]) => name),
          ...Object.entries(savedPricingSnapshots)
            .filter(([, optionSnapshot]) =>
              Boolean(getSavedOptionId(optionSnapshot)),
            )
            .map(([name]) => name),
        ]);

        for (const pricingGroupName of savedPricingGroupNames) {
          if (!currentPricingGroupNames.has(pricingGroupName)) {
            issues.push(
              `${service.name}, ${group.label || group.name} ${entryIndex + 1}: the previous ${pricingGroupName} option is no longer available and was not restored.`,
            );
          }
        }

        for (const pricingGroup of currentPricingGroups) {
          const savedPricingSnapshot = savedPricingSnapshots[pricingGroup.name];
          const savedOptionId =
            savedPricingOptions[pricingGroup.name] ||
            getSavedOptionId(savedPricingSnapshot);
          const currentOption = pricingGroup.options.find(
            (option) => String(option._id) === String(savedOptionId),
          );

          if (currentOption) {
            restoredEntry.pricingOptions[pricingGroup.name] = String(
              currentOption._id,
            );
            const rules = getQuantityRules(service, currentOption);
            const quantity = Number(
              savedQuantities[pricingGroup.name] ??
                savedPricingSnapshot?.quantity ??
                rules.minQuantity,
            );
            restoredEntry.pricingQuantities[pricingGroup.name] =
              Number.isInteger(quantity) &&
              quantity >= rules.minQuantity &&
              (rules.maxQuantity === undefined || quantity <= rules.maxQuantity)
                ? quantity
                : rules.minQuantity;
          } else if (savedOptionId) {
            missingPricingGroups.push(pricingGroup.name);
            issues.push(
              `${service.name}, ${group.label || group.name} ${entryIndex + 1}: the previous ${pricingGroup.name} option is no longer available. Choose a replacement before submitting.`,
            );
          }
        }

        if (missingPricingGroups.length > 0) {
          restoredEntry._missingPricingGroups = missingPricingGroups;
        }

        const savedFields = asPlainObject(savedEntry?.fields);
        const activeFields = getActiveFieldsForRepeatableEntry(
          service,
          group,
          restoredEntry,
        );

        for (const field of activeFields) {
          if (savedFields[field.name] !== undefined) {
            restoredEntry.fields[field.name] = savedFields[field.name];
          }
        }

        return restoredEntry;
      });

      const { minItems, maxItems } = getRepeatableGroupRules(group);
      nextItem.formData[group.name] = restoredEntries
        .slice(0, maxItems)
        .concat(
          Array.from(
            { length: Math.max(0, minItems - restoredEntries.length) },
            () => createEmptyRepeatableItem(group),
          ),
        );

      if (restoredEntries.length > maxItems) {
        issues.push(
          `${service.name}: only the first ${maxItems} ${group.label || "items"} were restored because that is the current limit.`,
        );
      }
    }

    const activeFields = getActiveFieldsForItem(nextItem);
    if (isGridPostsService(service)) {
      nextItem.formData.pricingMode = savedFormData.pricingMode || "line";
    }

    for (const field of activeFields) {
      if (
        savedFormData[field.name] !== undefined &&
        field.name !== "quantity"
      ) {
        nextItem.formData[field.name] = savedFormData[field.name];
      }
    }

    restoredItems.push(nextItem);
  }

  return { items: restoredItems, issues };
};

/*
|--------------------------------------------------------------------------
| Selection Field
|--------------------------------------------------------------------------
*/

const SelectionField = ({ field, value, onChange, compact = false }) => {
  const type = normalizeFieldType(field);
  const options = Array.isArray(field.options) ? field.options : [];
  const isCheckbox = type === "checkbox";

  const selectedValues = isCheckbox
    ? Array.isArray(value)
      ? value
      : value
        ? [value]
        : []
    : value
      ? [value]
      : [];

  const toggleCheckbox = (optionValue) => {
    const currentValues = Array.isArray(value) ? value : value ? [value] : [];

    if (currentValues.includes(optionValue)) {
      onChange(
        field.name,
        currentValues.filter((item) => item !== optionValue),
      );
    } else {
      onChange(field.name, [...currentValues, optionValue]);
    }
  };

  return (
    <div
      role="group"
      aria-label={`${field.label}${field.required ? " (required)" : " (optional)"}`}
    >
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-zinc-900">
            {field.label}
            {field.required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </p>

          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            {field.required ? "Required" : "Optional"}
          </span>
        </div>

        <p className="mt-1 text-xs text-zinc-400">
          {isCheckbox ? "Select one or more" : "Select one"}
        </p>
      </div>

      <div
        className={`grid gap-3 ${
          compact ? "sm:grid-cols-1" : "sm:grid-cols-2"
        }`}
      >
        {options.map((option) => {
          const selected = selectedValues.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                if (isCheckbox) {
                  toggleCheckbox(option.value);
                } else {
                  onChange(field.name, option.value);
                }
              }}
              className={`
                relative flex min-h-[62px] items-center gap-3 rounded-2xl
                border px-4 py-3 text-left transition-all duration-200
                hover:-translate-y-0.5
                ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 shadow-[0_10px_25px_rgba(0,0,0,0.08)]"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                }
              `}
            >
              <span
                className={`
                  flex h-5 w-5 shrink-0 items-center justify-center border
                  ${isCheckbox ? "rounded-md" : "rounded-full"}
                  ${
                    selected
                      ? "border-white bg-white text-zinc-900"
                      : "border-zinc-300 bg-white"
                  }
                `}
              >
                {selected && <Check size={12} strokeWidth={2.5} />}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-medium ${
                    selected ? "text-white" : "text-zinc-900"
                  }`}
                >
                  {option.label}
                </span>

                {Number(option.price || 0) > 0 && (
                  <span
                    className={`mt-0.5 block text-xs ${
                      selected ? "text-white/50" : "text-zinc-400"
                    }`}
                  >
                    +{formatCurrency(option.price)}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {field.helpText && (
        <div className="mt-2.5 flex items-start gap-1.5 text-xs leading-5 text-zinc-400">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>{field.helpText}</span>
        </div>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Dynamic Field
|--------------------------------------------------------------------------
*/

const DynamicField = ({ field, value, onChange, compact = false }) => {
  const fieldId = useId();
  const helpId = field.helpText ? `${fieldId}-help` : undefined;
  const inputAccessibility = {
    id: fieldId,
    "aria-required": Boolean(field.required),
    "aria-describedby": helpId,
  };
  const type = normalizeFieldType(field);

  if (type === "radio" || type === "checkbox") {
    return (
      <SelectionField
        field={field}
        value={value}
        onChange={onChange}
        compact={compact}
      />
    );
  }

  if (type === "select") {
    const options = Array.isArray(field.options) ? field.options : [];

    return (
      <div>
        <div className="mb-3">
          <label
            htmlFor={fieldId}
            className="text-sm font-medium text-zinc-900"
          >
            {field.label}
            {field.required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>

          <p className="mt-1 text-xs text-zinc-400">
            {field.required ? "Required · Select one" : "Optional · Select one"}
          </p>
        </div>

        <CustomSelect
          {...inputAccessibility}
          aria-label={field.label}
          value={value || ""}
          onChange={(nextValue) => onChange(field.name, nextValue)}
          options={options}
          placeholder={field.placeholder || "Select an option"}
        />

        {field.helpText && (
          <div
            id={helpId}
            className="mt-2.5 flex items-start gap-1.5 text-xs leading-5 text-zinc-500"
          >
            <Info size={13} className="mt-0.5 shrink-0" />
            <span>{field.helpText}</span>
          </div>
        )}
      </div>
    );
  }

  const commonClassName = `
    w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5
    text-sm text-zinc-900 outline-none transition-all duration-200
    placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400
    focus:bg-white focus:ring-4 focus:ring-zinc-900/[0.04]
  `;

  const label = (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={fieldId} className="text-sm font-medium text-zinc-900">
          {field.label}
          {field.required && (
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          {field.required ? "Required" : "Optional"}
        </span>
      </div>
    </div>
  );

  const helpText = field.helpText ? (
    <div
      id={helpId}
      className="mt-2.5 flex items-start gap-1.5 text-xs leading-5 text-zinc-500"
    >
      <Info size={13} className="mt-0.5 shrink-0" />
      <span>{field.helpText}</span>
    </div>
  ) : null;

  if (type === "textarea") {
    return (
      <div>
        {label}

        <textarea
          {...inputAccessibility}
          value={value ?? ""}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder || ""}
          rows={4}
          className={`${commonClassName} resize-y leading-6`}
        />

        {helpText}
      </div>
    );
  }

  if (type === "number") {
    return (
      <div>
        {label}

        <input
          {...inputAccessibility}
          type="number"
          value={value ?? ""}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder || ""}
          min={field.min}
          max={field.max}
          step={field.step}
          className={commonClassName}
        />

        {helpText}
      </div>
    );
  }

  if (type === "date") {
    return (
      <div>
        {label}

        <div className="flex flex-wrap items-center gap-3">
          <input
            {...inputAccessibility}
            type="date"
            value={value ?? ""}
            onChange={(event) => onChange(field.name, event.target.value)}
            className={`${commonClassName} min-w-0 flex-1`}
          />

          {!field.required && (
            <button
              type="button"
              onClick={() => onChange(field.name, "")}
              className="shrink-0 text-xs font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-900"
            >
              Choose any
            </button>
          )}
        </div>

        {helpText}
      </div>
    );
  }

  if (type === "url") {
    return (
      <div>
        {label}

        <input
          {...inputAccessibility}
          type="url"
          value={value ?? ""}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder || ""}
          className={commonClassName}
        />

        {helpText}
      </div>
    );
  }

  return (
    <div>
      {label}

      <input
        {...inputAccessibility}
        type="text"
        value={value ?? ""}
        onChange={(event) => onChange(field.name, event.target.value)}
        placeholder={field.placeholder || ""}
        className={commonClassName}
      />

      {helpText}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Quantity Control
|--------------------------------------------------------------------------
*/

const QuantityControl = ({
  quantity,
  minQuantity,
  maxQuantity,
  unit,
  onChange,
  dark = false,
  className = "",
}) => {
  const canDecrease = quantity > minQuantity;
  const canIncrease = maxQuantity === undefined || quantity < maxQuantity;

  return (
    <div
      className={`${className}
        flex items-center rounded-xl border p-1
        ${dark ? "border-white/10 bg-white/5" : "border-zinc-200 bg-zinc-50"}
      `}
    >
      <button
        type="button"
        onClick={() => canDecrease && onChange(quantity - 1)}
        disabled={!canDecrease}
        className={`
          flex h-8 w-8 items-center justify-center rounded-lg
          transition-all
          ${
            dark
              ? "text-white/60 hover:bg-white/10 hover:text-white"
              : "text-zinc-500 hover:bg-white hover:text-zinc-900"
          }
          disabled:cursor-not-allowed disabled:opacity-30
        `}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>

      <div className="min-w-[52px] px-1 text-center">
        <p
          className={`text-sm font-semibold ${
            dark ? "text-white" : "text-zinc-900"
          }`}
        >
          {quantity}
        </p>

        {unit && (
          <p
            className={`text-[10px] ${
              dark ? "text-white/35" : "text-zinc-400"
            }`}
          >
            {unit}
            {quantity !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => canIncrease && onChange(quantity + 1)}
        disabled={!canIncrease}
        className={`
          flex h-8 w-8 items-center justify-center rounded-lg
          transition-all
          ${
            dark
              ? "text-white/60 hover:bg-white/10 hover:text-white"
              : "text-zinc-500 hover:bg-white hover:text-zinc-900"
          }
          disabled:cursor-not-allowed disabled:opacity-30
        `}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Payment Option
|--------------------------------------------------------------------------
*/

const PaymentOption = ({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`
        group relative flex min-h-[142px] w-full flex-col items-start gap-3 rounded-2xl border p-4
        text-left transition-all duration-300 sm:p-5
        ${
          selected
            ? "border-zinc-900 bg-zinc-900 shadow-[0_12px_35px_rgba(0,0,0,0.08)]"
            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
        }
        ${disabled ? "cursor-not-allowed opacity-45" : "hover:-translate-y-0.5"}
      `}
    >
      <div
        className={`
          flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
          ${
            selected
              ? "bg-white text-zinc-900"
              : "border border-zinc-200 bg-zinc-50 text-zinc-500"
          }
        `}
      >
        <Icon size={18} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 w-full flex-1">
        <p
          className={`pr-6 text-sm font-semibold tracking-[-0.01em] ${
            selected ? "text-white" : "text-zinc-900"
          }`}
        >
          {title}
        </p>

        <p
          className={`mt-1.5 max-w-[28ch] text-xs leading-[1.45] ${
            selected ? "text-white/50" : "text-zinc-500"
          }`}
        >
          {description}
        </p>
      </div>

      {selected && (
        <div className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-white text-zinc-900">
          <Check size={12} strokeWidth={2.5} />
        </div>
      )}
    </button>
  );
};

const PaymentMethodChip = ({
  selected,
  onClick,
  icon: Icon,
  label,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={selected}
    className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
      selected
        ? "border-white bg-white text-zinc-950"
        : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
    }`}
  >
    <Icon size={14} className="shrink-0" aria-hidden="true" />
    <span className="truncate">{label}</span>
  </button>
);

const ChequeOption = ({
  selected,
  onClick,
  title,
  description,
  compact = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`${compact ? "rounded-xl p-2.5" : "rounded-2xl p-4"} border text-left transition-colors ${
      selected
        ? compact
          ? "border-white bg-white/10"
          : "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
        : compact
          ? "border-white/10 bg-white/[0.03] hover:border-white/20"
          : "border-zinc-200 bg-white hover:border-zinc-400"
    }`}
  >
    <span className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          selected
            ? compact
              ? "border-white"
              : "border-zinc-900"
            : compact
              ? "border-white/30"
              : "border-zinc-300"
        }`}
        aria-hidden="true"
      >
        {selected && (
          <span
            className={`h-2 w-2 rounded-full ${
              compact ? "bg-white" : "bg-zinc-900"
            }`}
          />
        )}
      </span>
      <span className="min-w-0">
        <span
          className={`block text-xs font-semibold leading-4 ${
            compact ? "text-white" : "text-zinc-900"
          }`}
        >
          {title}
        </span>
        {description && (
          <span
            className={`mt-1 block text-[11px] leading-4 ${
              compact ? "text-white/50" : "text-zinc-500"
            }`}
          >
            {description}
          </span>
        )}
      </span>
    </span>
  </button>
);

/*
|--------------------------------------------------------------------------
| Repeatable Group
|--------------------------------------------------------------------------
*/

const RepeatableGroup = ({
  group,
  service,
  entries,
  onAdd,
  onRemove,
  onFieldChange,
  onPricingOptionChange,
  onPricingQuantityChange,
  openOptionalFields,
  toggleOptionalField,
  disabled = false,
}) => {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const { minItems, maxItems } = getRepeatableGroupRules(group);
  const lastEntryRef = useRef(null);
  const previousEntryCount = useRef(safeEntries.length);
  const [collapsedEntries, setCollapsedEntries] = useState(() => new Set());

  const pricingGroups = getRepeatableGroupPricingGroups(service, group);

  // Fields that are always part of the repeatable group
  // plus fields belonging to the pricing options selected
  // inside each individual entry.
  const getEntryFields = (entry) =>
    getActiveFieldsForRepeatableEntry(service, group, entry);

  const canRemove = safeEntries.length > minItems;
  const canAdd = safeEntries.length < maxItems;

  const toggleEntry = (entryIndex) => {
    setCollapsedEntries((current) => {
      const next = new Set(current);
      if (next.has(entryIndex)) {
        next.delete(entryIndex);
      } else {
        next.add(entryIndex);
      }
      return next;
    });
  };

  const removeEntry = (entryIndex) => {
    setCollapsedEntries((current) => {
      const next = new Set();
      current.forEach((index) => {
        if (index < entryIndex) {
          next.add(index);
        } else if (index > entryIndex) {
          next.add(index - 1);
        }
      });
      return next;
    });
    onRemove(entryIndex);
  };

  useEffect(() => {
    if (safeEntries.length > previousEntryCount.current) {
      lastEntryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }

    previousEntryCount.current = safeEntries.length;
  }, [safeEntries.length]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3 sm:px-3 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              {group.label || group.name}
            </h3>

            <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              {safeEntries.length} {safeEntries.length === 1 ? "item" : "items"}
            </span>
          </div>

          {group.description && (
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {group.description}
            </p>
          )}

          <p className="mt-1 text-[11px] text-zinc-400">
            Minimum {minItems} · Maximum {maxItems}
          </p>
        </div>

        {canAdd && (
          <button
            type="button"
            disabled={disabled}
            onClick={onAdd}
            className="dashboard-action dashboard-action--secondary inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />
            Add Another {group.label || "Item"}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {safeEntries.map((entry, entryIndex) => {
          const optionalOpenKey = `${group.name}:${entryIndex}`;

          const fields = getEntryFields(entry);

          const requiredFields = fields.filter((field) => field.required);

          const optionalFields = fields.filter((field) => !field.required);

          return (
            <div
              key={`${group.name}-${entryIndex}`}
              ref={
                entryIndex === safeEntries.length - 1 ? lastEntryRef : undefined
              }
              className="rounded-2xl border border-zinc-200 bg-white p-3 sm:px-3 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => toggleEntry(entryIndex)}
                  aria-expanded={!collapsedEntries.has(entryIndex)}
                  aria-controls={`repeatable-${group.name}-${entryIndex}`}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-left transition hover:text-zinc-700"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    {group.label || "Item"} {entryIndex + 1}
                  </span>
                  {collapsedEntries.has(entryIndex) ? (
                    <ChevronDown
                      size={15}
                      className="shrink-0 text-zinc-400"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronUp
                      size={15}
                      className="shrink-0 text-zinc-400"
                      aria-hidden="true"
                    />
                  )}
                </button>

                {canRemove && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeEntry(entryIndex)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Remove ${
                      group.label || "item"
                    } ${entryIndex + 1}`}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div
                id={`repeatable-${group.name}-${entryIndex}`}
                className={
                  collapsedEntries.has(entryIndex)
                    ? "hidden"
                    : "mt-4 border-t border-zinc-100 pt-1"
                }
              >
                {pricingGroups.length > 0 && (
                  <div className="space-y-4">
                    {pricingGroups.map((pricingGroup) => {
                      const title = pricingGroup.name
                        ? pricingGroup.name.charAt(0).toUpperCase() +
                          pricingGroup.name.slice(1)
                        : "Options";

                      const required = isRequiredRepeatablePricingGroup(
                        group,
                        pricingGroup.name,
                      );

                      const selectedOptionId =
                        entry?.pricingOptions?.[pricingGroup.name];

                      return (
                        <div key={pricingGroup.key}>
                          <div className="mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-zinc-900">
                                {title}
                              </p>

                              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                                {required ? "Required" : "Optional"}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-zinc-400">
                              Select one
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {pricingGroup.options.map((option) => {
                              const optionSelected =
                                String(selectedOptionId) === String(option._id);

                              const rules = getQuantityRules(service, option);

                              const optionQuantity = optionSelected
                                ? Number(
                                    entry?.pricingQuantities?.[
                                      pricingGroup.name
                                    ] ?? rules.minQuantity,
                                  )
                                : rules.minQuantity;

                              return (
                                <div
                                  key={option._id}
                                  className={`
                                  relative rounded-2xl border p-3 sm:p-4
                                  transition-all duration-200
                                  ${
                                    optionSelected
                                      ? "border-zinc-900 bg-zinc-900 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
                                      : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50"
                                  }
                                `}
                                >
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() =>
                                      onPricingOptionChange(
                                        entryIndex,
                                        pricingGroup.name,
                                        option,
                                      )
                                    }
                                    className="w-full text-left disabled:cursor-not-allowed"
                                  >
                                    <div className="flex items-start gap-3">
                                      <span
                                        className={`
                                        mt-0.5 flex h-5 w-5 shrink-0
                                        items-center justify-center
                                        rounded-full border
                                        ${
                                          optionSelected
                                            ? "border-white bg-white text-zinc-900"
                                            : "border-zinc-300 bg-white"
                                        }
                                      `}
                                      >
                                        {optionSelected && (
                                          <Check size={12} strokeWidth={2.5} />
                                        )}
                                      </span>

                                      <span className="min-w-0 flex-1">
                                        <span
                                          className={`block text-sm font-semibold ${
                                            optionSelected
                                              ? "text-white"
                                              : "text-zinc-900"
                                          }`}
                                        >
                                          {option.name}
                                        </span>

                                        {option.description && (
                                          <span
                                            className={`mt-1 block text-xs leading-5 ${
                                              optionSelected
                                                ? "text-white/50"
                                                : "text-zinc-500"
                                            }`}
                                          >
                                            {option.description}
                                          </span>
                                        )}

                                        <span
                                          className={`mt-1.5 block text-xs font-medium ${
                                            optionSelected
                                              ? "text-white/70"
                                              : "text-zinc-500"
                                          }`}
                                        >
                                          {formatCurrency(option.price)} /{" "}
                                          {option.unit || "unit"}
                                        </span>
                                      </span>
                                    </div>
                                  </button>

                                  {optionSelected && (
                                    <div className="mt-3 border-t border-white/10 pt-3">
                                      <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                                        <div className="min-w-0">
                                          <p className="text-[11px] font-medium text-white/50">
                                            Quantity
                                          </p>

                                          <p className="mt-0.5 text-[11px] text-white/35">
                                            Minimum: {rules.minQuantity}
                                          </p>
                                        </div>

                                        <QuantityControl
                                          className="self-start"
                                          quantity={optionQuantity}
                                          minQuantity={rules.minQuantity}
                                          maxQuantity={rules.maxQuantity}
                                          unit={option.unit || "unit"}
                                          dark
                                          onChange={(nextQuantity) =>
                                            onPricingQuantityChange(
                                              entryIndex,
                                              pricingGroup.name,
                                              nextQuantity,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {requiredFields.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {requiredFields.map((field) => (
                      <DynamicField
                        key={field.name}
                        field={field}
                        value={entry?.fields?.[field.name]}
                        onChange={(fieldName, value) =>
                          onFieldChange(entryIndex, fieldName, value)
                        }
                        compact
                      />
                    ))}
                  </div>
                )}

                {optionalFields.length > 0 && (
                  <div
                    className={`${
                      requiredFields.length > 0
                        ? "mt-6 border-t border-zinc-100 pt-5"
                        : "mt-5"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleOptionalField(optionalOpenKey)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:border-zinc-300 hover:bg-white"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-800">
                          Optional details
                        </p>

                        <p className="mt-0.5 text-xs text-zinc-400">
                          Add any additional information for this{" "}
                          {String(group.label || "item").toLowerCase()}.
                        </p>
                      </div>

                      {openOptionalFields[optionalOpenKey] ? (
                        <ChevronUp
                          size={16}
                          className="shrink-0 text-zinc-400"
                        />
                      ) : (
                        <ChevronDown
                          size={16}
                          className="shrink-0 text-zinc-400"
                        />
                      )}
                    </button>

                    {openOptionalFields[optionalOpenKey] && (
                      <div className="mt-4 space-y-4">
                        {optionalFields.map((field) => (
                          <DynamicField
                            key={field.name}
                            field={field}
                            value={entry?.fields?.[field.name]}
                            onChange={(fieldName, value) =>
                              onFieldChange(entryIndex, fieldName, value)
                            }
                            compact
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {canAdd && (
        <div className="mt-4 border-t border-zinc-200 pt-4">
          <button
            type="button"
            disabled={disabled}
            onClick={onAdd}
            className="dashboard-action dashboard-action--secondary inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={15} />
            Add Another {group.label || "Item"}
          </button>
        </div>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| New Order
|--------------------------------------------------------------------------
*/

const NewOrder = () => {
  const [services, setServices] = useState([]);
  const [adCreditData, setAdCreditData] = useState(null);
  const [adCreditError, setAdCreditError] = useState("");
  const [selectedAdCredit, setSelectedAdCredit] = useState({
    metaAds: false,
    googleAds: false,
  });
  const [adCreditRefresh, setAdCreditRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    adCreditService
      .getMine()
      .then((data) => {
        if (active) {
          setAdCreditData(data);
          setAdCreditError("");
        }
      })
      .catch((loadError) => {
        if (active)
          setAdCreditError(
            loadError.response?.data?.message || "Unable to load ad credit.",
          );
      });
    return () => {
      active = false;
    };
  }, [adCreditRefresh]);
  const [orderItems, setOrderItems] = useState([]);

  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const [expandedSummaryServices, setExpandedSummaryServices] = useState(
    () => new Set(),
  );
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponQuote, setCouponQuote] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponErrorRequestKey, setCouponErrorRequestKey] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [chequeType, setChequeType] = useState("");
  const [allowMonthEndPayment, setAllowMonthEndPayment] = useState(false);
  const [paymentPricing, setPaymentPricing] = useState(null);
  const [paymentPricingLoading, setPaymentPricingLoading] = useState(true);
  const [paymentPricingError, setPaymentPricingError] = useState("");

  const [additionalRequirements, setAdditionalRequirements] = useState("");

  const [loadingServices, setLoadingServices] = useState(true);
  const [latestPreviousOrder, setLatestPreviousOrder] = useState(null);
  const [loadingPreviousOrders, setLoadingPreviousOrders] = useState(true);
  const [previousOrdersError, setPreviousOrdersError] = useState("");
  const [repeatOrderIssues, setRepeatOrderIssues] = useState([]);
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [draftsError, setDraftsError] = useState("");
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftNotice, setDraftNotice] = useState("");
  const [editingDraftId, setEditingDraftId] = useState("");
  const [draftQuote, setDraftQuote] = useState(null);
  const [draftQuoteLoading, setDraftQuoteLoading] = useState(false);
  const [draftQuoteError, setDraftQuoteError] = useState("");
  const [draftQuoteErrorRequestKey, setDraftQuoteErrorRequestKey] =
    useState("");

  const [loadingServiceId, setLoadingServiceId] = useState("");

  const [error, setError] = useState("");
  const [validationServiceId, setValidationServiceId] = useState("");
  const errorRef = useRef(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const [submitting, setSubmitting] = useState(false);
  const submitInFlight = useRef(false);

  const [orderSuccess, setOrderSuccess] = useState(null);

  const [openOptionalFields, setOpenOptionalFields] = useState({});

  const [openServiceIds, setOpenServiceIds] = useState({});
  const draftOperationRef = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Load Services
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        setError("");

        const data = await serviceService.getServices();

        const activeServices = Array.isArray(data?.services)
          ? data.services.filter((service) => service?.isActive !== false)
          : [];

        const sortedServices = [...activeServices].sort(
          (a, b) => Number(a?.displayOrder || 0) - Number(b?.displayOrder || 0),
        );

        setServices(sortedServices);
      } catch (loadError) {
        console.error("Failed to load services:", loadError);

        setError(
          loadError.response?.data?.message || "Unable to load services.",
        );
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDrafts = async () => {
      try {
        const response = await draftService.listDrafts();
        if (mounted) {
          setSavedDrafts(
            Array.isArray(response?.drafts) ? response.drafts : [],
          );
          setDraftsError("");
        }
      } catch (loadError) {
        console.error("Failed to load saved drafts:", loadError);
        if (mounted) {
          setDraftsError(
            loadError.response?.data?.message ||
              "Saved drafts could not be loaded.",
          );
        }
      } finally {
        if (mounted) {
          setLoadingDrafts(false);
        }
      }
    };

    loadDrafts();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadPaymentPricing = async () => {
      try {
        const response = await orderService.getPaymentPricing();
        const rates = response?.gstRates;

        if (
          !rates ||
          ![
            "cod",
            "online",
            "chequeWithGst",
            "chequeDirectCollection",
            "month_end",
          ].every((key) => Number.isFinite(rates[key]) && rates[key] >= 0)
        ) {
          throw new Error("Payment tax configuration is unavailable.");
        }

        if (mounted) {
          setPaymentPricing(rates);
          setAllowMonthEndPayment(response.allowMonthEndPayment === true);
          setPaymentPricingError("");
        }
      } catch (loadError) {
        console.error("Failed to load payment pricing:", loadError);
        if (mounted) {
          setPaymentPricingError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Unable to load payment tax information.",
          );
        }
      } finally {
        if (mounted) {
          setPaymentPricingLoading(false);
        }
      }
    };

    loadPaymentPricing();
    window.addEventListener("focus", loadPaymentPricing);
    return () => {
      mounted = false;
      window.removeEventListener("focus", loadPaymentPricing);
    };
  }, []);

  useEffect(() => {
    if (!appliedCouponCode) {
      return undefined;
    }

    const requestKey = JSON.stringify({
      code: appliedCouponCode,
      orderItems,
      paymentMethod,
      chequeType,
    });
    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      setCouponLoading(true);
      setCouponError("");
      setCouponErrorRequestKey("");
      try {
        if (orderItems.length === 0) {
          throw new Error("Select at least one service to use a coupon.");
        }
        const response = await orderService.validateCoupon({
          code: appliedCouponCode,
          services: buildServicesPayload(),
          paymentMethod,
          ...(paymentMethod === "cheque" ? { chequeType } : {}),
        });
        if (!cancelled) {
          setCouponQuote({ ...response.quote, _requestKey: requestKey });
        }
      } catch (validationError) {
        if (!cancelled) {
          setCouponError(
            validationError.response?.data?.message ||
              "Unable to validate this coupon.",
          );
          setCouponErrorRequestKey(requestKey);
        }
      } finally {
        if (!cancelled) {
          setCouponLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [appliedCouponCode, orderItems, paymentMethod, chequeType]);

  useEffect(() => {
    let mounted = true;

    const loadPreviousOrders = async () => {
      try {
        const response = await orderService.getLatestMyOrder();

        if (mounted) {
          setLatestPreviousOrder(response?.order || null);
          setPreviousOrdersError("");
        }
      } catch (loadError) {
        console.error("Failed to load previous orders:", loadError);

        if (mounted) {
          setPreviousOrdersError(
            loadError.response?.data?.message ||
              "Previous orders could not be loaded.",
          );
        }
      } finally {
        if (mounted) {
          setLoadingPreviousOrders(false);
        }
      }
    };

    loadPreviousOrders();

    return () => {
      mounted = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Item Helpers
  |--------------------------------------------------------------------------
  */

  const updateItem = (index, updater) => {
    setOrderItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return typeof updater === "function"
          ? updater(item)
          : { ...item, ...updater };
      }),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Service Selection
  |--------------------------------------------------------------------------
  */

  const handleToggleService = async (serviceId) => {
    if (!serviceId || submitting || loadingServiceId) {
      return;
    }

    const existingIndex = orderItems.findIndex(
      (item) => String(item?.service?._id) === String(serviceId),
    );

    if (existingIndex >= 0) {
      setOrderItems((current) =>
        current.filter((_, index) => index !== existingIndex),
      );

      setActiveServiceIndex((current) => {
        if (current > existingIndex) {
          return current - 1;
        }

        if (current === existingIndex && current >= orderItems.length - 1) {
          return Math.max(0, current - 1);
        }

        return current;
      });

      setOpenServiceIds((current) => {
        const next = { ...current };
        delete next[serviceId];
        return next;
      });

      setError("");
      return;
    }

    try {
      setLoadingServiceId(serviceId);
      setError("");

      const data = await serviceService.getServiceById(serviceId);

      const service = data?.service;

      if (!service) {
        throw new Error("Selected service could not be loaded.");
      }

      const nextItem = createOrderItem(service);

      setOrderItems((current) => {
        const next = [...current, nextItem];

        setActiveServiceIndex(next.length - 1);

        return next;
      });

      setOpenServiceIds((current) => ({
        ...current,
        [serviceId]: true,
      }));
    } catch (loadError) {
      console.error("Failed to load service:", loadError);

      setError(
        loadError.response?.data?.message ||
          loadError.message ||
          "Unable to load selected service.",
      );
    } finally {
      setLoadingServiceId("");
    }
  };

  const handleServiceNameClick = (serviceId) => {
    const existingIndex = orderItems.findIndex(
      (item) => String(item?.service?._id) === String(serviceId),
    );

    if (existingIndex < 0) {
      return;
    }

    setOpenServiceIds((current) => ({
      ...current,
      [serviceId]: !current[serviceId],
    }));

    setActiveServiceIndex(existingIndex);
  };

  const handleRepeatPreviousOrder = (previousOrder) => {
    const restored = restoreOrderItems(previousOrder, services);

    if (restored.items.length === 0) {
      setRepeatOrderIssues(
        restored.issues.length > 0
          ? restored.issues
          : ["No active services from this order could be restored."],
      );
      return;
    }

    setOrderItems(restored.items);
    setActiveServiceIndex(0);
    setOpenServiceIds(
      Object.fromEntries(
        restored.items.map((item) => [String(item.service._id), true]),
      ),
    );
    setAdditionalRequirements(previousOrder.additionalRequirements || "");
    setRepeatOrderIssues(restored.issues);
    setEditingDraftId("");
    setDraftQuote(null);
    setError("");
  };

  const restoreDraft = (draft) => {
    const draftItems = (draft.services || []).map((savedItem) => {
      const service = services.find(
        (candidate) => String(candidate._id) === String(savedItem.serviceId),
      );
      const option = service
        ? getPricingOptions(service).find(
            (candidate) =>
              String(candidate._id) === String(savedItem.pricingOptionId || ""),
          )
        : null;
      const selectedOptionSnapshot = option
        ? {
            id: option._id,
            name: option.name,
            price: option.price,
            unit: option.unit,
            group: option.group || "",
            quantity: savedItem.quantity || 1,
          }
        : null;

      return {
        service: savedItem.serviceId,
        serviceSnapshot: {
          serviceId: savedItem.serviceId,
          slug: service?.slug || "",
          name: service?.name || "",
          selectedOption: selectedOptionSnapshot,
          selectedOptions: selectedOptionSnapshot
            ? [selectedOptionSnapshot]
            : [],
        },
        quantity: savedItem.quantity || 1,
        formData: asPlainObject(savedItem.formData),
      };
    });

    const restored = restoreOrderItems({ items: draftItems }, services);
    if (restored.items.length === 0) {
      setRepeatOrderIssues(
        restored.issues.length > 0
          ? restored.issues
          : ["No active services from this draft could be restored."],
      );
      return false;
    }

    setOrderItems(restored.items);
    setActiveServiceIndex(0);
    setOpenServiceIds(
      Object.fromEntries(
        restored.items.map((item) => [String(item.service._id), true]),
      ),
    );
    setAdditionalRequirements(draft.additionalRequirements || "");
    setCouponInput(draft.couponCode || "");
    setAppliedCouponCode(draft.couponCode || "");
    setPaymentMethod("cod");
    setChequeType("");
    setEditingDraftId(String(draft._id));
    setDraftQuote(null);
    setDraftQuoteError("");
    setRepeatOrderIssues(restored.issues);
    setDraftNotice("");
    setError("");
    return true;
  };

  const handleOpenDraft = async (draftId) => {
    if (draftBusy || loadingServices) {
      return;
    }

    setDraftBusy(true);
    setDraftsError("");
    try {
      const response = await draftService.getDraft(draftId);
      restoreDraft(response.draft);
    } catch (openError) {
      setDraftsError(
        openError.response?.data?.message || "Unable to open this draft.",
      );
    } finally {
      setDraftBusy(false);
    }
  };

  const handleDeleteDraft = async (draftId) => {
    if (draftBusy || !window.confirm("Delete this saved draft?")) {
      return;
    }

    setDraftBusy(true);
    setDraftsError("");
    try {
      await draftService.deleteDraft(draftId);
      setSavedDrafts((current) =>
        current.filter((draft) => String(draft._id) !== String(draftId)),
      );
      if (String(editingDraftId) === String(draftId)) {
        setEditingDraftId("");
        setDraftQuote(null);
      }
      setDraftNotice("Draft deleted.");
    } catch (deleteError) {
      setDraftsError(
        deleteError.response?.data?.message || "Unable to delete this draft.",
      );
    } finally {
      setDraftBusy(false);
    }
  };

  const handleSaveDraft = async () => {
    if (draftOperationRef.current || submitting || !orderItems.length) {
      return;
    }

    draftOperationRef.current = true;
    setDraftBusy(true);
    setDraftNotice("");
    setDraftsError("");
    try {
      const payload = {
        title: `Draft ${new Date().toLocaleDateString("en-IN")}`,
        services: buildServicesPayload(),
        additionalRequirements: additionalRequirements.trim(),
        couponCode: appliedCouponCode,
      };
      const response = editingDraftId
        ? await draftService.updateDraft(editingDraftId, payload)
        : await draftService.createDraft(payload);
      const updated = await draftService.listDrafts();
      setSavedDrafts(Array.isArray(updated?.drafts) ? updated.drafts : []);
      setEditingDraftId(String(response.draft._id));
      setDraftQuote(null);
      setDraftQuoteError("");
      setDraftNotice(response.message || "Draft saved.");
    } catch (saveError) {
      setDraftsError(
        saveError.response?.data?.message || "Unable to save this draft.",
      );
    } finally {
      draftOperationRef.current = false;
      setDraftBusy(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Pricing
  |--------------------------------------------------------------------------
  */

  const handlePricingOptionChange = (itemIndex, option) => {
    updateItem(itemIndex, (current) => {
      const rules = getQuantityRules(current.service, option);

      return {
        ...current,
        selectedPricingOption: option,
        _requiresPricingOption: false,
        formData: {
          ...(current.formData || {}),
          quantity: rules.minQuantity,
        },
      };
    });

    setError("");
  };

  const handleGroupedPricingOptionChange = (itemIndex, group, option) => {
    updateItem(itemIndex, (current) => {
      const currentSelected = current.selectedPricingOptions?.[group] || null;

      const isDeselecting = currentSelected?._id === option?._id;

      const nextSelected = isDeselecting ? null : option;

      const nextSelectedOptions = {
        ...(current.selectedPricingOptions || {}),
        [group]: nextSelected,
      };

      const nextQuantities = {
        ...(current.pricingQuantities || {}),
      };

      const nextFormData = {
        ...(current.formData || {}),
      };

      if (nextSelected) {
        const rules = getQuantityRules(current.service, nextSelected);

        nextQuantities[group] = rules.minQuantity;
        nextFormData[group] = String(nextSelected._id);
      } else {
        delete nextQuantities[group];
        delete nextFormData[group];
      }

      return {
        ...current,
        selectedPricingOptions: nextSelectedOptions,
        _missingPricingGroups: (current._missingPricingGroups || []).filter(
          (name) => name !== group,
        ),
        pricingQuantities: nextQuantities,
        formData: nextFormData,
      };
    });

    setError("");
  };

  const handleGroupedQuantityChange = (itemIndex, group, nextQuantity) => {
    updateItem(itemIndex, (current) => {
      const option = current.selectedPricingOptions?.[group];

      if (!option) {
        return current;
      }

      const rules = getQuantityRules(current.service, option);

      let normalized = Number(nextQuantity);

      if (!Number.isFinite(normalized)) {
        normalized = rules.minQuantity;
      }

      normalized = Math.floor(normalized);
      normalized = Math.max(rules.minQuantity, normalized);

      if (rules.maxQuantity !== undefined) {
        normalized = Math.min(rules.maxQuantity, normalized);
      }

      return {
        ...current,
        pricingQuantities: {
          ...(current.pricingQuantities || {}),
          [group]: normalized,
        },
      };
    });

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Normal Field Changes
  |--------------------------------------------------------------------------
  */

  const handleFieldChange = (itemIndex, fieldName, value) => {
    updateItem(itemIndex, (current) => ({
      ...current,
      formData: {
        ...(current.formData || {}),
        [fieldName]: value,
      },
    }));

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Repeatable Groups
  |--------------------------------------------------------------------------
  */

  const handleRepeatableAdd = (itemIndex, group) => {
    updateItem(itemIndex, (current) => {
      const currentEntries = Array.isArray(current.formData?.[group.name])
        ? current.formData[group.name]
        : [];

      const { maxItems } = getRepeatableGroupRules(group);

      if (currentEntries.length >= maxItems) {
        return current;
      }

      return {
        ...current,
        formData: {
          ...(current.formData || {}),
          [group.name]: [...currentEntries, createEmptyRepeatableItem(group)],
        },
      };
    });

    setError("");
  };

  const handleRepeatableRemove = (itemIndex, group, entryIndex) => {
    updateItem(itemIndex, (current) => {
      const currentEntries = Array.isArray(current.formData?.[group.name])
        ? current.formData[group.name]
        : [];

      const { minItems } = getRepeatableGroupRules(group);

      if (currentEntries.length <= minItems) {
        return current;
      }

      return {
        ...current,
        formData: {
          ...(current.formData || {}),
          [group.name]: currentEntries.filter(
            (_, index) => index !== entryIndex,
          ),
        },
      };
    });

    setError("");
  };

  const handleRepeatableFieldChange = (
    itemIndex,
    group,
    entryIndex,
    fieldName,
    value,
  ) => {
    updateItem(itemIndex, (current) => {
      const currentEntries = Array.isArray(current.formData?.[group.name])
        ? current.formData[group.name]
        : [];

      const nextEntries = currentEntries.map((entry, index) =>
        index === entryIndex
          ? {
              ...(entry || {}),
              fields: {
                ...(entry?.fields || {}),
                [fieldName]: value,
              },
            }
          : entry,
      );

      return {
        ...current,
        formData: {
          ...(current.formData || {}),
          [group.name]: nextEntries,
        },
      };
    });

    setError("");
  };

  const handleRepeatableEntryPricingOptionChange = (
    itemIndex,
    group,
    entryIndex,
    pricingGroupName,
    option,
  ) => {
    updateItem(itemIndex, (current) => {
      const currentEntries = Array.isArray(current.formData?.[group.name])
        ? current.formData[group.name]
        : [];

      const existingEntry =
        currentEntries[entryIndex] || createEmptyRepeatableItem(group);

      const currentSelectedId =
        existingEntry?.pricingOptions?.[pricingGroupName];

      const isDeselecting = String(currentSelectedId) === String(option?._id);

      const nextEntry = {
        ...existingEntry,
        _missingPricingGroups: (
          existingEntry._missingPricingGroups || []
        ).filter((name) => name !== pricingGroupName),

        pricingOptions: {
          ...(existingEntry.pricingOptions || {}),
        },

        pricingQuantities: {
          ...(existingEntry.pricingQuantities || {}),
        },

        fields: {
          ...(existingEntry.fields || {}),
        },
      };

      if (isDeselecting) {
        delete nextEntry.pricingOptions[pricingGroupName];
        delete nextEntry.pricingQuantities[pricingGroupName];
      } else {
        nextEntry.pricingOptions[pricingGroupName] = String(option._id);

        const rules = getQuantityRules(current.service, option);

        nextEntry.pricingQuantities[pricingGroupName] = rules.minQuantity;
      }

      const activeFields = getActiveFieldsForRepeatableEntry(
        current.service,
        group,
        nextEntry,
      );
      const activeFieldNames = new Set(
        activeFields.map((field) => String(field.name)),
      );

      Object.keys(nextEntry.fields).forEach((fieldName) => {
        if (!activeFieldNames.has(fieldName)) {
          delete nextEntry.fields[fieldName];
        }
      });

      activeFields.forEach((field) => {
        if (!(field.name in nextEntry.fields)) {
          nextEntry.fields[field.name] =
            normalizeFieldType(field) === "checkbox" ? [] : "";
        }
      });

      const nextEntries = currentEntries.map((entry, index) =>
        index === entryIndex ? nextEntry : entry,
      );

      return {
        ...current,
        formData: {
          ...(current.formData || {}),
          [group.name]: nextEntries,
        },
      };
    });

    setError("");
  };

  const handleRepeatableEntryPricingQuantityChange = (
    itemIndex,
    group,
    entryIndex,
    pricingGroupName,
    nextQuantity,
  ) => {
    updateItem(itemIndex, (current) => {
      const currentEntries = Array.isArray(current.formData?.[group.name])
        ? current.formData[group.name]
        : [];

      const existingEntry = currentEntries[entryIndex];

      if (!existingEntry) {
        return current;
      }

      const selectedOptionId =
        existingEntry?.pricingOptions?.[pricingGroupName];

      if (!selectedOptionId) {
        return current;
      }

      const pricingGroups = getRepeatableGroupPricingGroups(
        current.service,
        group,
      );

      const pricingGroup = pricingGroups.find(
        (candidate) => candidate.name === pricingGroupName,
      );

      const option = pricingGroup?.options.find(
        (candidate) => String(candidate._id) === String(selectedOptionId),
      );

      if (!option) {
        return current;
      }

      const rules = getQuantityRules(current.service, option);

      let normalized = Number(nextQuantity);

      if (!Number.isFinite(normalized)) {
        normalized = rules.minQuantity;
      }

      normalized = Math.floor(normalized);
      normalized = Math.max(rules.minQuantity, normalized);

      if (rules.maxQuantity !== undefined) {
        normalized = Math.min(rules.maxQuantity, normalized);
      }

      const nextEntry = {
        ...existingEntry,

        pricingOptions: {
          ...(existingEntry.pricingOptions || {}),
        },

        pricingQuantities: {
          ...(existingEntry.pricingQuantities || {}),
          [pricingGroupName]: normalized,
        },

        fields: {
          ...(existingEntry.fields || {}),
        },
      };

      const nextEntries = currentEntries.map((entry, index) =>
        index === entryIndex ? nextEntry : entry,
      );

      return {
        ...current,
        formData: {
          ...(current.formData || {}),
          [group.name]: nextEntries,
        },
      };
    });

    setError("");
  };

  const toggleOptionalField = (key) => {
    setOpenOptionalFields((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Quantity
  |--------------------------------------------------------------------------
  */

  const getQuantityInfo = (item) => {
    if (!item || item.isGroupedPricing) {
      return {
        hasQuantity: false,
        quantity: 1,
        rules: getQuantityRules(item?.service, null),
        unit: item?.service?.unit,
      };
    }

    const selectedPricingOption = item.selectedPricingOption || null;

    const rules = getQuantityRules(item.service, selectedPricingOption);

    const hasQuantity = Boolean(
      selectedPricingOption ||
      item.service?.pricingType === "per_unit" ||
      item.service?.pricingType === "starting_from",
    );

    return {
      hasQuantity,
      quantity: getItemQuantity(item),
      rules,
      unit:
        selectedPricingOption?.unit ||
        getGridPricingMode(item.service, item.formData?.pricingMode)?.unit ||
        item.service?.unit,
    };
  };

  /*
  |--------------------------------------------------------------------------
  | Active Fields / Cleanup
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!orderItems.length) {
      return;
    }

    setOrderItems((current) => {
      let changed = false;

      const nextItems = current.map((item) => {
        const configuredDynamicFieldNames = new Set();

        const collectFieldNames = (fields) => {
          if (!Array.isArray(fields)) {
            return;
          }

          fields.forEach((field) => {
            const fieldName = String(field?.name || "").trim();

            if (fieldName) {
              configuredDynamicFieldNames.add(fieldName);
            }
          });
        };

        collectFieldNames(item.service?.fields);

        getPricingOptions(item.service).forEach((pricingOption) => {
          collectFieldNames(pricingOption?.fields);
        });

        const activeFields = new Set(
          getActiveFieldsForItem(item)
            .map((field) => String(field?.name || "").trim())
            .filter(Boolean),
        );

        const nextFormData = {
          ...(item.formData || {}),
        };

        configuredDynamicFieldNames.forEach((fieldName) => {
          if (!activeFields.has(fieldName) && fieldName in nextFormData) {
            delete nextFormData[fieldName];
            changed = true;
          }
        });

        if (!changed) {
          return item;
        }

        return {
          ...item,
          formData: nextFormData,
        };
      });

      return changed ? nextItems : current;
    });
  }, [orderItems]);

  /*
  |--------------------------------------------------------------------------
  | Totals
  |--------------------------------------------------------------------------
  */

  const itemEstimates = useMemo(
    () => orderItems.map((item) => getItemEstimate(item)),
    [orderItems],
  );

  const subtotal = useMemo(
    () =>
      itemEstimates.reduce((total, amount) => total + Number(amount || 0), 0),
    [itemEstimates],
  );

  const hasCustomUnpricedService = useMemo(
    () => orderItems.some((item) => isCustomUnpricedItem(item)),
    [orderItems],
  );

  const gstRate = useMemo(() => {
    if (paymentMethod === "cod") {
      return paymentPricing?.cod ?? 0;
    }

    if (!paymentPricing) {
      return null;
    }

    if (paymentMethod === "month_end") return paymentPricing.month_end;

    if (paymentMethod === "online") {
      return paymentPricing.online;
    }

    if (paymentMethod === "cheque") {
      return chequeType === "with_gst"
        ? paymentPricing.chequeWithGst
        : chequeType === "direct_collection"
          ? paymentPricing.chequeDirectCollection
          : null;
    }

    return null;
  }, [paymentPricing, paymentMethod, chequeType]);

  const adSpendBudgets = useMemo(() => {
    const budgets = { metaAds: 0, googleAds: 0 };
    for (const item of orderItems) {
      if (item.service?.slug !== "ads") continue;
      const fields = getActiveFieldsForItem(item);
      for (const platform of ["metaAds", "googleAds"]) {
        const name = `${platform}AdSpendAmount`;
        if (!fields.some((field) => field.name === name)) continue;
        const value = Number(item.formData?.[name] || 0);
        if (Number.isFinite(value) && value > 0)
          budgets[platform] += Math.round(value * 100) / 100;
      }
    }
    return budgets;
  }, [orderItems]);
  const appliedAdCredit = Object.fromEntries(
    ["metaAds", "googleAds"].map((platform) => [
      platform,
      selectedAdCredit[platform] && !adCreditError
        ? Math.min(
            adSpendBudgets[platform],
            Number(adCreditData?.available?.[platform] || 0),
          )
        : 0,
    ]),
  );
  const adCreditTotal = Number(
    (appliedAdCredit.metaAds + appliedAdCredit.googleAds).toFixed(2),
  );

  const renderAdCreditForField = (field, service) => {
    if (service?.slug !== "ads") return null;
    const platform =
      field.name === "metaAdsAdSpendAmount"
        ? "metaAds"
        : field.name === "googleAdsAdSpendAmount"
          ? "googleAds"
          : null;
    if (!platform) return null;
    return (
      <AdCreditCheckout
        platform={platform}
        data={adCreditData}
        error={adCreditError}
        budgets={adSpendBudgets}
        selected={selectedAdCredit}
        onSelect={setSelectedAdCredit}
        disabled={submitting}
        onRefresh={() => setAdCreditRefresh((current) => current + 1)}
      />
    );
  };

  const currentCouponRequestKey = appliedCouponCode
    ? JSON.stringify({
        code: appliedCouponCode,
        orderItems,
        paymentMethod,
        chequeType,
      })
    : "";
  const currentCouponQuote =
    couponQuote?._requestKey === currentCouponRequestKey ? couponQuote : null;
  const currentCouponError =
    couponErrorRequestKey === currentCouponRequestKey ? couponError : "";
  const hasCurrentCouponQuote = Boolean(currentCouponQuote);
  const couponDiscountTotal = Number(currentCouponQuote?.discountTotal || 0);
  const subtotalBeforeAdCredit = currentCouponQuote
    ? Number(currentCouponQuote.taxableSubtotal || 0)
    : Math.max(0, subtotal - couponDiscountTotal);
  const taxableSubtotal = Math.max(
    0,
    Number((subtotalBeforeAdCredit - adCreditTotal).toFixed(2)),
  );
  const currentCouponLoading =
    couponLoading ||
    Boolean(appliedCouponCode && !currentCouponQuote && !currentCouponError);

  const gstAmount = useMemo(
    () =>
      hasCurrentCouponQuote && adCreditTotal === 0
        ? Number(currentCouponQuote.gstAmount || 0)
        : gstRate === null
          ? 0
          : Number(((taxableSubtotal * gstRate) / 100).toFixed(2)),
    [
      currentCouponQuote,
      gstRate,
      hasCurrentCouponQuote,
      taxableSubtotal,
      adCreditTotal,
    ],
  );

  const estimatedTotal =
    hasCurrentCouponQuote && adCreditTotal === 0
      ? Number(currentCouponQuote.finalTotal)
      : gstRate === null
        ? null
        : taxableSubtotal + gstAmount;

  const selectPaymentMethod = (method) => {
    if (
      !["cod", "online", "cheque", "month_end"].includes(method) ||
      (method === "month_end" && !allowMonthEndPayment)
    )
      return;
    setPaymentMethod(method);
    if (method !== "cheque") {
      setChequeType("");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  const validateFields = (item) => {
    const validationErrors = {};
    const fields = getActiveFieldsForItem(item);

    for (const field of fields) {
      const value = item.formData?.[field.name];
      const type = normalizeFieldType(field);

      if (field.required && isEmptyValue(value)) {
        validationErrors[field.name] = `${field.label} is required.`;
        continue;
      }

      if (isEmptyValue(value)) {
        continue;
      }

      if (type === "checkbox") {
        const selectedValues = Array.isArray(value) ? value : [value];

        const allowedValues = (field.options || []).map((option) =>
          String(option.value),
        );

        const invalidValue = selectedValues.some(
          (selectedValue) => !allowedValues.includes(String(selectedValue)),
        );

        if (invalidValue) {
          validationErrors[field.name] =
            `${field.label} has an invalid selection.`;
        }

        continue;
      }

      if (type === "radio" || type === "select") {
        const allowedValues = (field.options || []).map((option) =>
          String(option.value),
        );

        if (!allowedValues.includes(String(value))) {
          validationErrors[field.name] =
            `${field.label} has an invalid selection.`;
        }

        continue;
      }

      if (type === "number") {
        const numberValue = Number(value);

        if (!Number.isFinite(numberValue)) {
          validationErrors[field.name] =
            `${field.label} must be a valid number.`;
          continue;
        }

        if (
          field.min !== undefined &&
          field.min !== null &&
          numberValue < Number(field.min)
        ) {
          validationErrors[field.name] =
            `${field.label} must be at least ${field.min}.`;
        }

        if (
          field.max !== undefined &&
          field.max !== null &&
          numberValue > Number(field.max)
        ) {
          validationErrors[field.name] =
            `${field.label} must be at most ${field.max}.`;
        }

        if (field.step !== undefined && Number(field.step) > 0) {
          const remainder = numberValue % Number(field.step);

          if (Math.abs(remainder) > 0.000001) {
            validationErrors[field.name] =
              `${field.label} must use increments of ${field.step}.`;
          }
        }

        continue;
      }

      if (type === "url") {
        try {
          const url = new URL(String(value));

          if (!["http:", "https:"].includes(url.protocol)) {
            validationErrors[field.name] =
              `${field.label} must be a valid URL.`;
          }
        } catch {
          validationErrors[field.name] = `${field.label} must be a valid URL.`;
        }

        continue;
      }

      if (type === "date") {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
          validationErrors[field.name] = `${field.label} must be a valid date.`;
        }
      }
    }

    return validationErrors;
  };

  const validateRepeatableGroups = (item) => {
    const groups = getRepeatableGroups(item?.service);

    for (const group of groups) {
      const entries = Array.isArray(item.formData?.[group.name])
        ? item.formData[group.name]
        : [];

      const { minItems, maxItems } = getRepeatableGroupRules(group);

      if (entries.length < minItems) {
        return `${group.label || group.name} requires at least ${minItems} ${
          minItems === 1 ? "item" : "items"
        }.`;
      }

      if (entries.length > maxItems) {
        return `${group.label || group.name} allows a maximum of ${maxItems} ${
          maxItems === 1 ? "item" : "items"
        }.`;
      }

      const repeatablePricingGroups = getRepeatableGroupPricingGroups(
        item.service,
        group,
      );

      for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
        const entry = entries[entryIndex] || {};

        if (entry._missingPricingGroups?.length > 0) {
          return `${group.label || group.name} ${
            entryIndex + 1
          }: choose a current replacement for the unavailable ${entry._missingPricingGroups[0]} option.`;
        }

        for (const pricingGroup of repeatablePricingGroups) {
          const selectedOptionId = entry?.pricingOptions?.[pricingGroup.name];

          const required = isRequiredRepeatablePricingGroup(
            group,
            pricingGroup.name,
          );

          const pricingGroupLabel = pricingGroup.name
            ? pricingGroup.name.charAt(0).toUpperCase() +
              pricingGroup.name.slice(1)
            : "Option";

          if (required && !selectedOptionId) {
            return `${group.label || group.name} ${
              entryIndex + 1
            }: ${pricingGroupLabel} is required.`;
          }

          if (!selectedOptionId) {
            continue;
          }

          const option = pricingGroup.options.find(
            (candidate) => String(candidate._id) === String(selectedOptionId),
          );

          if (!option) {
            return `${group.label || group.name} ${
              entryIndex + 1
            }: ${pricingGroupLabel} has an invalid selection.`;
          }

          const rules = getQuantityRules(item.service, option);

          const rawQuantity = entry?.pricingQuantities?.[pricingGroup.name];

          const quantity = Number(rawQuantity ?? rules.minQuantity);

          if (!Number.isInteger(quantity)) {
            return `${group.label || group.name} ${
              entryIndex + 1
            }: ${pricingGroupLabel} quantity must be a whole number.`;
          }

          if (quantity < rules.minQuantity) {
            return `${group.label || group.name} ${
              entryIndex + 1
            }: ${pricingGroupLabel} requires a minimum quantity of ${
              rules.minQuantity
            }.`;
          }

          if (rules.maxQuantity !== undefined && quantity > rules.maxQuantity) {
            return `${group.label || group.name} ${
              entryIndex + 1
            }: ${pricingGroupLabel} allows a maximum quantity of ${
              rules.maxQuantity
            }.`;
          }
        }

        const activeFields = getActiveFieldsForRepeatableEntry(
          item.service,
          group,
          entry,
        );

        for (const field of activeFields) {
          const value = entry?.fields?.[field.name];
          const type = normalizeFieldType(field);

          if (field.required && isEmptyValue(value)) {
            return `${group.label || group.name} ${entryIndex + 1}: ${
              field.label
            } is required.`;
          }

          if (isEmptyValue(value)) {
            continue;
          }

          if (type === "checkbox") {
            const selectedValues = Array.isArray(value) ? value : [value];

            const allowedValues = (field.options || []).map((option) =>
              String(option.value),
            );

            const invalidValue = selectedValues.some(
              (selectedValue) => !allowedValues.includes(String(selectedValue)),
            );

            if (invalidValue) {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} has an invalid selection.`;
            }

            continue;
          }

          if (type === "radio" || type === "select") {
            const allowedValues = (field.options || []).map((option) =>
              String(option.value),
            );

            if (!allowedValues.includes(String(value))) {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} has an invalid selection.`;
            }

            continue;
          }

          if (type === "number") {
            const numberValue = Number(value);

            if (!Number.isFinite(numberValue)) {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} must be a valid number.`;
            }

            if (
              field.min !== undefined &&
              field.min !== null &&
              numberValue < Number(field.min)
            ) {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} must be at least ${field.min}.`;
            }

            if (
              field.max !== undefined &&
              field.max !== null &&
              numberValue > Number(field.max)
            ) {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} must be at most ${field.max}.`;
            }

            continue;
          }

          if (type === "url") {
            try {
              const url = new URL(String(value));

              if (!["http:", "https:"].includes(url.protocol)) {
                return `${group.label || group.name} ${
                  entryIndex + 1
                }: ${field.label} must be a valid URL.`;
              }
            } catch {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} must be a valid URL.`;
            }

            continue;
          }

          if (type === "date") {
            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} must be a valid date.`;
            }
          }
        }
      }
    }

    return "";
  };

  const validateGroupedPricing = (item) => {
    if (!item.isGroupedPricing) {
      return "";
    }

    if (item._missingPricingGroups?.length > 0) {
      return `Choose a current replacement for the unavailable ${item._missingPricingGroups[0]} option.`;
    }

    const groups = getPricingGroups(item.service);

    for (const group of groups) {
      const selectedOption = item.selectedPricingOptions?.[group.key];

      if (!selectedOption) {
        continue;
      }

      const rules = getQuantityRules(item.service, selectedOption);

      const rawQuantity = item.pricingQuantities?.[group.key];

      const selectedQuantity = Number(rawQuantity ?? rules.minQuantity);

      if (!Number.isInteger(selectedQuantity)) {
        return `${group.name || "Option"} quantity must be a whole number.`;
      }

      if (selectedQuantity < rules.minQuantity) {
        return `${selectedOption.name} requires a minimum quantity of ${rules.minQuantity}.`;
      }

      if (
        rules.maxQuantity !== undefined &&
        selectedQuantity > rules.maxQuantity
      ) {
        return `${selectedOption.name} allows a maximum quantity of ${rules.maxQuantity}.`;
      }
    }

    return "";
  };

  const validateOrderItem = (item) => {
    const itemPricingOptions = getPricingOptions(item.service);
    const repeatableOnly = isRepeatableOnlyService(item.service);

    if (item.isGroupedPricing && !repeatableOnly) {
      const groupedError = validateGroupedPricing(item);

      if (groupedError) {
        return groupedError;
      }
    } else if (
      !repeatableOnly &&
      itemPricingOptions.length > 0 &&
      (!item.selectedPricingOption || item._requiresPricingOption)
    ) {
      return "Please select a service option.";
    }

    if (!item.isGroupedPricing) {
      const shouldHaveQuantity = Boolean(
        item.selectedPricingOption ||
        item.service?.pricingType === "per_unit" ||
        item.service?.pricingType === "starting_from",
      );

      if (shouldHaveQuantity) {
        const itemQuantity = getItemQuantity(item);

        const rules = getQuantityRules(
          item.service,
          item.selectedPricingOption,
        );

        if (itemQuantity < rules.minQuantity) {
          return `Minimum quantity is ${rules.minQuantity}.`;
        }

        if (
          rules.maxQuantity !== undefined &&
          itemQuantity > rules.maxQuantity
        ) {
          return `Maximum quantity is ${rules.maxQuantity}.`;
        }
      }
    }

    const repeatableError = validateRepeatableGroups(item);

    if (repeatableError) {
      return repeatableError;
    }

    const validationErrors = validateFields(item);

    if (Object.keys(validationErrors).length > 0) {
      return Object.values(validationErrors)[0];
    }

    return "";
  };

  /*
  |--------------------------------------------------------------------------
  | Backend Payload
  |--------------------------------------------------------------------------
  */

  const buildCleanFormData = (item) => {
    const cleanFormData = {};
    const fields = getActiveFieldsForItem(item);

    if (isGridPostsService(item.service)) {
      cleanFormData.pricingMode = item.formData?.pricingMode || "line";
    }

    for (const field of fields) {
      const value = item.formData?.[field.name];

      if (value !== undefined && value !== null) {
        cleanFormData[field.name] = value;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Repeatable Groups
    |--------------------------------------------------------------------------
    */

    const repeatableGroups = getRepeatableGroups(item.service);

    for (const group of repeatableGroups) {
      const entries = Array.isArray(item.formData?.[group.name])
        ? item.formData[group.name]
        : [];

      if (entries.length > 0) {
        const repeatablePricingGroups = getRepeatableGroupPricingGroups(
          item.service,
          group,
        );

        cleanFormData[group.name] = entries.map((entry) => {
          const cleanEntry = {
            pricingOptions: {},
            pricingQuantities: {},
            fields: {},
          };

          /*
           * Repeatable fields
           */
          const activeFields = getActiveFieldsForRepeatableEntry(
            item.service,
            group,
            entry,
          );

          for (const field of activeFields) {
            const fieldName = String(field?.name || "").trim();

            if (!fieldName) {
              continue;
            }

            const value = entry?.fields?.[fieldName];

            if (value !== undefined && value !== null) {
              cleanEntry.fields[fieldName] = value;
            }
          }

          /*
           * Repeatable pricing selections + quantities
           */
          for (const pricingGroup of repeatablePricingGroups) {
            const selectedOptionId = entry?.pricingOptions?.[pricingGroup.name];

            if (!selectedOptionId) {
              continue;
            }

            cleanEntry.pricingOptions[pricingGroup.name] =
              String(selectedOptionId);

            const option = pricingGroup.options.find(
              (candidate) => String(candidate._id) === String(selectedOptionId),
            );

            const rules = getQuantityRules(item.service, option);

            const rawQuantity = entry?.pricingQuantities?.[pricingGroup.name];

            cleanEntry.pricingQuantities[pricingGroup.name] =
              rawQuantity !== undefined && rawQuantity !== null
                ? Number(rawQuantity)
                : rules.minQuantity;
          }

          return cleanEntry;
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Grouped Pricing
    |--------------------------------------------------------------------------
    */

    if (item.isGroupedPricing && !isRepeatableOnlyService(item.service)) {
      for (const [group, option] of Object.entries(
        item.selectedPricingOptions || {},
      )) {
        if (option) {
          cleanFormData[group] = String(option._id);
        }
      }

      const selectedQuantities = {};

      for (const [group, option] of Object.entries(
        item.selectedPricingOptions || {},
      )) {
        if (!option) {
          continue;
        }

        const rules = getQuantityRules(item.service, option);

        const rawQuantity = item.pricingQuantities?.[group];

        selectedQuantities[group] =
          rawQuantity !== undefined && rawQuantity !== null
            ? Number(rawQuantity)
            : rules.minQuantity;
      }

      cleanFormData.pricingQuantities = selectedQuantities;
    }

    return cleanFormData;
  };

  function buildServicesPayload() {
    return orderItems.map((item) => ({
      serviceId: item.service._id,
      ...(item.isGroupedPricing
        ? {}
        : {
            pricingOptionId: item.selectedPricingOption?._id || undefined,
          }),
      quantity: item.isGroupedPricing
        ? 1
        : item.selectedPricingOption ||
            item.service?.pricingType === "per_unit" ||
            item.service?.pricingType === "starting_from"
          ? getItemQuantity(item)
          : 1,
      formData: buildCleanFormData(item),
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const getDraftQuoteRequestKey = () =>
    JSON.stringify({
      services: buildServicesPayload(),
      additionalRequirements: additionalRequirements.trim(),
      paymentMethod,
      chequeType: paymentMethod === "cheque" ? chequeType : "",
      couponCode: appliedCouponCode,
      adCredit: appliedAdCredit,
    });

  const currentDraftQuoteRequestKey = editingDraftId
    ? getDraftQuoteRequestKey()
    : "";
  const currentDraftQuote =
    draftQuote?.requestKey === currentDraftQuoteRequestKey ? draftQuote : null;
  const currentDraftQuoteError =
    draftQuoteErrorRequestKey === currentDraftQuoteRequestKey
      ? draftQuoteError
      : "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitInFlight.current) return;
    setError("");
    setValidationServiceId("");

    if (
      !["cod", "online", "cheque", "month_end"].includes(paymentMethod) ||
      (paymentMethod === "month_end" && !allowMonthEndPayment)
    ) {
      setError(
        "Choose a permitted payment method. Pay on Month-End is not enabled for your account.",
      );
      return;
    }

    if (paymentMethod === "cheque" && !chequeType) {
      setError("Choose a cheque payment type before placing your order.");
      return;
    }

    if (["online", "month_end"].includes(paymentMethod) && !paymentPricing) {
      setError(
        paymentPricingError ||
          "Payment tax information is still loading. Please try again.",
      );
      return;
    }

    if (
      appliedCouponCode &&
      (currentCouponLoading || !currentCouponQuote || currentCouponError)
    ) {
      setError(
        "Wait for the coupon to finish validating before placing your order.",
      );
      return;
    }

    if (!orderItems.length) {
      setError("Please select at least one service.");
      return;
    }

    for (let index = 0; index < orderItems.length; index += 1) {
      const itemError = validateOrderItem(orderItems[index]);

      if (itemError) {
        setActiveServiceIndex(index);

        const erroredServiceId = orderItems[index]?.service?._id;
        setValidationServiceId(erroredServiceId || "");

        if (erroredServiceId) {
          setOpenServiceIds((current) => ({
            ...current,
            [erroredServiceId]: true,
          }));
        }

        setError(
          `${orderItems[index].service?.name || "Service"}: ${itemError}`,
        );
        return;
      }
    }

    if (
      paymentMethod === "online" &&
      estimatedTotal <= 0 &&
      adCreditTotal === 0
    ) {
      setError(
        "Online payment requires a payable order amount. Please select a priced service option or use Cash Payment.",
      );
      return;
    }

    const draftQuoteRequestKey = currentDraftQuoteRequestKey;
    const confirmedDraftQuote =
      draftQuote?.requestKey === draftQuoteRequestKey ? draftQuote : null;
    const hasConfirmedDraftQuote = Boolean(confirmedDraftQuote?.confirmed);

    if (editingDraftId && !hasConfirmedDraftQuote) {
      if (confirmedDraftQuote) {
        setError("Confirm the current draft price before placing the order.");
        return;
      }
      if (draftQuote) {
        setDraftQuote(null);
      }

      try {
        setDraftQuoteLoading(true);
        setDraftQuoteError("");
        const quoteResponse = await orderService.getOrderQuote({
          services: buildServicesPayload(),
          adCredit: appliedAdCredit,
          paymentMethod,
          ...(paymentMethod === "cheque" ? { chequeType } : {}),
          ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
        });
        setDraftQuote({
          ...quoteResponse.quote,
          confirmed: false,
          requestKey: draftQuoteRequestKey,
        });
      } catch (quoteError) {
        const message =
          quoteError.response?.data?.message ||
          "Unable to verify current draft pricing.";
        setDraftQuoteError(message);
        setDraftQuoteErrorRequestKey(draftQuoteRequestKey);
        setError(message);
      } finally {
        setDraftQuoteLoading(false);
      }
      return;
    }

    try {
      submitInFlight.current = true;
      setSubmitting(true);

      const servicesPayload = buildServicesPayload();

      const orderResponse = await orderService.createOrder({
        services: servicesPayload,
        ...(adCreditTotal > 0 ? { adCredit: appliedAdCredit } : {}),
        additionalRequirements: additionalRequirements.trim(),
        paymentMethod,
        ...(paymentMethod === "cheque" ? { chequeType } : {}),
        ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
        ...(editingDraftId
          ? {
              draftId: editingDraftId,
              confirmedAmount: confirmedDraftQuote.amount,
            }
          : {}),
      });

      const createdOrder = orderResponse?.order;

      if (!createdOrder) {
        throw new Error(
          "Order was created but no order details were returned.",
        );
      }

      /*
      |--------------------------------------------------------------------------
      | COD
      |--------------------------------------------------------------------------
      */

      if (["cod", "cheque", "month_end"].includes(paymentMethod)) {
        orderService.clearPendingCheckout();
        setOrderSuccess(createdOrder);
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Razorpay
      |--------------------------------------------------------------------------
      */

      if (paymentMethod === "online") {
        if (createdOrder.paymentStatus === "paid") {
          orderService.clearPendingCheckout();
          setOrderSuccess(createdOrder);
          return;
        }
        const razorpayResponse = await paymentService.createRazorpayOrder(
          createdOrder._id || createdOrder.id,
        );

        if (razorpayResponse.alreadyPaid) {
          orderService.clearPendingCheckout();
          setOrderSuccess(razorpayResponse.order);
          return;
        }

        const razorpayOrder = razorpayResponse?.razorpayOrder;

        if (!razorpayOrder) {
          throw new Error("Unable to initialize online payment.");
        }

        if (!window.Razorpay) {
          throw new Error("Razorpay Checkout failed to load.");
        }

        const serviceNames =
          Array.isArray(createdOrder.items) && createdOrder.items.length > 0
            ? createdOrder.items
                .map(
                  (item) =>
                    item?.serviceSnapshot?.name ||
                    item?.service?.name ||
                    "Content Service",
                )
                .filter(Boolean)
                .join(", ")
            : orderItems
                .map((item) => item.service?.name)
                .filter(Boolean)
                .join(", ");

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,

          amount: razorpayOrder.amount,

          currency: razorpayOrder.currency,

          name: "Glow Ventures",

          description:
            serviceNames.length > 90
              ? `${serviceNames.slice(0, 87)}...`
              : serviceNames || "Content Service Order",

          order_id: razorpayOrder.id,

          handler: async function (response) {
            try {
              setSubmitting(true);
              setError("");

              const verification = await paymentService.verifyRazorpayPayment({
                orderId: createdOrder._id || createdOrder.id,

                razorpay_order_id: response.razorpay_order_id,

                razorpay_payment_id: response.razorpay_payment_id,

                razorpay_signature: response.razorpay_signature,
              });

              if (verification?.success) {
                orderService.clearPendingCheckout();
                setOrderSuccess(verification.order);
                toast.success("Payment completed successfully.");
              } else {
                setError("Payment verification failed.");
                toast.error("Payment verification failed.");
              }
            } catch (verificationError) {
              console.error("Payment verification error:", verificationError);

              const message =
                verificationError.response?.data?.message ||
                "Payment verification failed.";
              setError(message);
              toast.error(message);
            } finally {
              setSubmitting(false);
            }
          },

          prefill: {
            name: "",
            email: "",
            contact: "",
          },

          theme: {
            color: "#18181b",
          },

          modal: {
            ondismiss: function () {
              setSubmitting(false);

              const message =
                "Payment was cancelled. You can try again from your order.";
              setError(message);
              toast.info(message);
            },
          },
        };

        const razorpay = new window.Razorpay(options);

        razorpay.open();
      }
    } catch (submitError) {
      console.error("Create order/payment error:", submitError);

      const responseData = submitError.response?.data;
      if (responseData?.code === "MONTH_END_NOT_ALLOWED") {
        setAllowMonthEndPayment(false);
      }
      if (
        String(responseData?.message || "")
          .toLowerCase()
          .includes("ad credit")
      ) {
        setAdCreditRefresh((current) => current + 1);
      }
      if (
        editingDraftId &&
        submitError.response?.status === 409 &&
        String(responseData?.message || "").includes("Pricing changed")
      ) {
        setDraftQuote(null);
        setDraftQuoteError(responseData.message);
        setDraftQuoteErrorRequestKey(draftQuoteRequestKey);
      }

      if (responseData?.errors) {
        const firstError = Object.values(responseData.errors)[0];

        const message =
          typeof firstError === "string"
            ? firstError
            : "Please check your order details.";
        setError(message);
        toast.error(message);
      } else {
        const message =
          responseData?.message ||
          submitError.message ||
          "Unable to process your order.";
        setError(message);
        toast.error(message);
      }
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Success
  |--------------------------------------------------------------------------
  */

  if (orderSuccess) {
    return <OrderSuccess order={orderSuccess} />;
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loadingServices) {
    return (
      <div
        role="status"
        className="mx-auto flex min-h-[60vh] w-full max-w-[1180px] items-center justify-center px-5"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={22} className="animate-spin text-zinc-400" />

          <p className="text-sm text-zinc-400">Loading services...</p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | No Services
  |--------------------------------------------------------------------------
  */

  if (!services.length) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1180px] items-center justify-center px-5">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400">
            <Info size={20} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-zinc-900">
            {error ? "Unable to load services" : "No services available"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {error
              ? "Your service list could not be loaded. Please try again."
              : "There are currently no active services available for ordering."}
          </p>

          {error ? (
            <>
              <p
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                className="mt-4 text-xs text-red-700"
              >
                {error}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="dashboard-action dashboard-action--primary mt-5"
              >
                Try again
              </button>
            </>
          ) : (
            <a
              href="/contact"
              className="dashboard-action dashboard-action--secondary mt-5"
            >
              Contact support
            </a>
          )}
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className={`mx-auto w-full max-w-[1180px] px-2 py-6 sm:px-5 sm:py-10 ${orderItems.length ? "new-order-has-shortcut" : ""}`}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ================================================================
              LEFT COLUMN
          ================================================================= */}

          <div className="min-w-0 space-y-6">
            <div className="order-actions-panel">
              <OrderActionSection
                title="Ordering Again?"
                icon={<History size={16} aria-hidden="true" />}
              >
                <p className="mb-3 text-xs leading-5 text-zinc-500">
                  Repeat a previous order and review its current pricing.
                </p>
                {loadingPreviousOrders ? (
                  <p className="text-xs text-zinc-500">
                    Checking your latest order…
                  </p>
                ) : previousOrdersError ? (
                  <p className="text-xs text-red-700">{previousOrdersError}</p>
                ) : latestPreviousOrder ? (
                  <button
                    type="button"
                    disabled={loadingServices}
                    onClick={() =>
                      handleRepeatPreviousOrder(latestPreviousOrder)
                    }
                    className="dashboard-action dashboard-action--primary inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Repeat Previous Order
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                ) : (
                  <p className="text-xs text-zinc-500">
                    You haven’t placed any orders yet.
                  </p>
                )}
              </OrderActionSection>
              <OrderActionSection
                title="Saved Drafts"
                icon={<Save size={16} aria-hidden="true" />}
                badge={
                  editingDraftId ? (
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
                      Editing draft
                    </span>
                  ) : savedDrafts.length > 0 ? (
                    <span className="text-xs text-zinc-500">
                      {savedDrafts.length}
                    </span>
                  ) : null
                }
              >
                {draftNotice && (
                  <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    {draftNotice}
                  </p>
                )}
                {draftsError && (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {draftsError}
                  </p>
                )}

                {loadingDrafts ? (
                  <p className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                    <Loader2 size={14} className="animate-spin" />
                    Loading saved drafts...
                  </p>
                ) : savedDrafts.length === 0 ? (
                  !draftsError && (
                    <p className="mt-3 text-xs text-zinc-500">
                      You don’t have any saved drafts yet.
                    </p>
                  )
                ) : (
                  <ul className="order-drafts-list space-y-2">
                    {savedDrafts.map((draft) => (
                      <li
                        key={draft._id}
                        className="draft-row flex min-w-0 flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3"
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium text-zinc-800">
                            {getDraftLabel(draft)}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            {(draft.services || []).length}{" "}
                            {(draft.services || []).length === 1
                              ? "service"
                              : "services"}{" "}
                            · Updated {formatDraftDate(draft.updatedAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={draftBusy || loadingServices}
                            onClick={() => handleOpenDraft(draft._id)}
                            className="dashboard-action dashboard-action--primary rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
                          >
                            Resume
                          </button>
                          <button
                            type="button"
                            disabled={draftBusy}
                            onClick={() => handleDeleteDraft(draft._id)}
                            aria-label={`Delete ${getDraftLabel(draft)}`}
                            className="dashboard-action dashboard-action--secondary text-red-600"
                          >
                            <Trash2
                              size={15}
                              className="icon-accent-red"
                              aria-hidden="true"
                            />
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </OrderActionSection>
            </div>

            {/* ==============================================================
                SERVICE CHECKLIST
            ============================================================== */}

            <section className="relative z-30 rounded-[24px] border border-zinc-200 bg-white px-2 py-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:px-5 sm:py-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                  Step 1
                </p>

                <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                      Build your order
                    </h1>

                    <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                      Select one or more services. Each selected service can be
                      configured independently.
                    </p>
                  </div>

                  <div className="shrink-0 self-start rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-500 sm:self-auto">
                    {orderItems.length} selected
                  </div>
                </div>
              </div>

              {repeatOrderIssues.length > 0 && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      {repeatOrderIssues.map((issue) => (
                        <p
                          key={issue}
                          className="text-xs leading-5 text-amber-900"
                        >
                          {issue}
                        </p>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setRepeatOrderIssues([])}
                      className="shrink-0 text-xs font-medium text-amber-800 underline underline-offset-2"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-4">
                {services.map((service) => {
                  const serviceId = String(service._id);

                  const selectedIndex = orderItems.findIndex(
                    (item) => String(item?.service?._id) === serviceId,
                  );

                  const selected = selectedIndex >= 0;

                  const item = selected ? orderItems[selectedIndex] : null;

                  const quantityInfo = item ? getQuantityInfo(item) : null;

                  const pricingOptions = item
                    ? getPricingOptions(item.service)
                    : [];

                  const pricingGroups = item
                    ? getPricingGroups(item.service)
                    : [];

                  const gridPricingModes =
                    item && isGridPostsService(item.service)
                      ? item.service.pricingModes || []
                      : [];
                  const selectedGridPricingMode = item
                    ? getGridPricingMode(
                        item.service,
                        item.formData?.pricingMode,
                      )
                    : null;

                  const isGroupedPricing = Boolean(item?.isGroupedPricing);
                  const hasServiceLevelPricing = Boolean(
                    item &&
                    pricingOptions.length > 0 &&
                    !isRepeatableOnlyService(item.service),
                  );

                  const activeFields = item ? getActiveFieldsForItem(item) : [];
                  const inlinePriceFieldNames = new Set(
                    isGroupedPricing
                      ? Object.values(item.selectedPricingOptions || {})
                          .filter(Boolean)
                          .flatMap((option) =>
                            (option.fields || [])
                              .filter((field) => field.includeValueInPrice)
                              .map((field) => field.name),
                          )
                      : [],
                  );
                  const visibleActiveFields = activeFields.filter(
                    (field) => !inlinePriceFieldNames.has(field.name),
                  );

                  const repeatableGroups = item
                    ? getRepeatableGroups(item.service)
                    : [];

                  const requiredFields = visibleActiveFields.filter(
                    (field) => field.required,
                  );

                  const optionalFields = visibleActiveFields.filter(
                    (field) => !field.required,
                  );

                  const itemAmount = selected
                    ? itemEstimates[selectedIndex] || 0
                    : 0;

                  return (
                    <div
                      key={serviceId}
                      id={`order-service-${serviceId}`}
                      tabIndex={-1}
                      className={`
                        scroll-mt-28 overflow-hidden rounded-[22px] border
                        transition-all duration-300
                        ${
                          selected
                            ? "border-zinc-900 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)]"
                            : "border-zinc-200 bg-white hover:border-zinc-300"
                        }
                      `}
                    >
                      {/* Service header */}

                      <div
                        className={`
                          flex flex-col gap-3 px-4 py-4
                          sm:flex-row sm:items-center sm:justify-between
                          sm:px-3 sm:py-4
                          ${selected ? "bg-zinc-50/70" : ""}
                        `}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <button
                            type="button"
                            disabled={submitting || Boolean(loadingServiceId)}
                            onClick={() => handleToggleService(serviceId)}
                            aria-label={
                              selected
                                ? `Remove ${service.name} from order`
                                : `Add ${service.name} to order`
                            }
                            className={`
                              flex h-6 w-6 shrink-0
                              items-center justify-center
                              rounded-md border
                              transition-all duration-200
                              ${
                                selected
                                  ? "border-zinc-900 bg-zinc-900 text-white"
                                  : "border-zinc-300 bg-white text-transparent"
                              }
                            `}
                          >
                            {loadingServiceId === serviceId ? (
                              <Loader2
                                size={14}
                                className="animate-spin text-zinc-400"
                              />
                            ) : (
                              <Check size={14} strokeWidth={2.5} />
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={!selected}
                            onClick={() => handleServiceNameClick(serviceId)}
                            className="flex min-w-0 flex-1 items-center text-left disabled:cursor-default"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-zinc-900 sm:text-[15px]">
                                {service.name}
                              </span>
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                          {selected && quantityInfo?.hasQuantity && (
                            <div className="flex items-center gap-2">
                              <span className="hidden text-[10px] font-medium uppercase tracking-wide text-zinc-400 sm:block">
                                Qty
                              </span>

                              <QuantityControl
                                quantity={quantityInfo.quantity}
                                minQuantity={quantityInfo.rules.minQuantity}
                                maxQuantity={quantityInfo.rules.maxQuantity}
                                unit={quantityInfo.unit}
                                onChange={(nextQuantity) =>
                                  updateItem(selectedIndex, (current) => ({
                                    ...current,
                                    formData: {
                                      ...(current.formData || {}),
                                      quantity: nextQuantity,
                                    },
                                  }))
                                }
                                dark={false}
                              />
                            </div>
                          )}

                          {selected && (
                            <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-right">
                              <p className="text-[9px] uppercase tracking-wide text-zinc-400">
                                Estimated
                              </p>

                              <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                                {isCustomUnpricedItem(item)
                                  ? "Custom"
                                  : itemAmount > 0
                                    ? formatCurrency(itemAmount)
                                    : "Configure"}
                              </p>
                            </div>
                          )}

                          {selected && (
                            <button
                              type="button"
                              onClick={() => handleServiceNameClick(serviceId)}
                              aria-label={`${
                                openServiceIds[serviceId]
                                  ? "Collapse"
                                  : "Expand"
                              } ${service.name} configuration`}
                              aria-expanded={Boolean(openServiceIds[serviceId])}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
                            >
                              {openServiceIds[serviceId] ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ======================================================
                          SELECTED SERVICE CONFIGURATION
                      ======================================================= */}

                      {selected && item && openServiceIds[serviceId] && (
                        <div className="border-t border-zinc-200 p-4 sm:px-4 py-6">
                          {gridPricingModes.length > 0 && (
                            <div className="mb-7">
                              <div>
                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                                  Pricing mode
                                </p>
                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                  One line includes 3 coordinated posts. Choose
                                  single-post pricing when you need an
                                  individual post.
                                </p>
                              </div>
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {gridPricingModes.map((mode) => {
                                  const isSelected =
                                    selectedGridPricingMode?.key === mode.key;
                                  const isLine = mode.key === "line";
                                  return (
                                    <button
                                      key={mode.key}
                                      type="button"
                                      disabled={submitting}
                                      onClick={() =>
                                        updateItem(
                                          selectedIndex,
                                          (current) => ({
                                            ...current,
                                            formData: {
                                              ...(current.formData || {}),
                                              pricingMode: mode.key,
                                              quantity:
                                                current.formData
                                                  ?.pricingMode === mode.key
                                                  ? getItemQuantity(current)
                                                  : getQuantityRules(
                                                      current.service,
                                                      null,
                                                    ).minQuantity,
                                            },
                                          }),
                                        )
                                      }
                                      aria-pressed={isSelected}
                                      className={`rounded-2xl border p-4 text-left transition ${
                                        isSelected
                                          ? "border-zinc-900 bg-zinc-900 text-white"
                                          : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400"
                                      }`}
                                    >
                                      <span className="block text-sm font-semibold">
                                        {mode.label}
                                      </span>
                                      <span
                                        className={`mt-1 block text-xs ${
                                          isSelected
                                            ? "text-white/65"
                                            : "text-zinc-500"
                                        }`}
                                      >
                                        {isLine
                                          ? "3 coordinated posts per line"
                                          : "Price each post separately"}
                                      </span>
                                      <span className="mt-3 block text-sm font-semibold">
                                        {formatCurrency(mode.unitPrice)} /{" "}
                                        {mode.unit}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              {selectedGridPricingMode && (
                                <p className="mt-3 text-xs text-zinc-500">
                                  {getItemQuantity(item)}{" "}
                                  {selectedGridPricingMode.unit}
                                  {getItemQuantity(item) === 1
                                    ? ""
                                    : "s"} ·{" "}
                                  {getItemQuantity(item) *
                                    selectedGridPricingMode.itemsPerUnit}{" "}
                                  total posts · Line total{" "}
                                  {formatCurrency(itemAmount)}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Pricing */}

                          {hasServiceLevelPricing && (
                            <div>
                              <div>
                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                                  Service options
                                </p>

                                <h3 className="mt-1 text-base font-semibold text-zinc-900">
                                  {isGroupedPricing
                                    ? "Configure your content"
                                    : "Choose an option"}
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                  {isGroupedPricing
                                    ? "Choose the options you need for this service."
                                    : "Select the service package that best fits your project."}
                                </p>
                              </div>

                              {isGroupedPricing ? (
                                <div className="mt-5 space-y-6">
                                  {pricingGroups.map((group) => {
                                    const selectedOption =
                                      item.selectedPricingOptions?.[group.key];
                                    const inlineFields = (
                                      selectedOption?.fields || []
                                    ).filter(
                                      (field) => field.includeValueInPrice,
                                    );

                                    const title = group.name
                                      ? group.name.charAt(0).toUpperCase() +
                                        group.name.slice(1)
                                      : "Options";

                                    return (
                                      <div key={group.key}>
                                        <div className="mb-3">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-medium text-zinc-900">
                                              {title}
                                            </p>

                                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                                              Optional
                                            </span>
                                          </div>

                                          <p className="mt-1 text-xs text-zinc-400">
                                            Optional · Select ONE
                                          </p>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                          {group.options.map((option) => {
                                            const optionSelected =
                                              selectedOption?._id ===
                                              option._id;

                                            const rules = getQuantityRules(
                                              service,
                                              option,
                                            );

                                            const optionQuantity =
                                              optionSelected
                                                ? getGroupedOptionQuantity(
                                                    item,
                                                    group.key,
                                                    option,
                                                  )
                                                : rules.minQuantity;

                                            return (
                                              <div
                                                key={option._id}
                                                className={`
                                                      relative rounded-2xl border p-4
                                                      transition-all duration-200
                                                      ${
                                                        optionSelected
                                                          ? "border-zinc-900 bg-zinc-900 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
                                                          : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50"
                                                      }
                                                    `}
                                              >
                                                <button
                                                  type="button"
                                                  disabled={submitting}
                                                  onClick={() =>
                                                    handleGroupedPricingOptionChange(
                                                      selectedIndex,
                                                      group.key,
                                                      option,
                                                    )
                                                  }
                                                  className="w-full text-left disabled:cursor-not-allowed"
                                                >
                                                  <div className="flex items-start gap-3">
                                                    <span
                                                      className={`
                                                            mt-0.5 flex h-5 w-5 shrink-0
                                                            items-center justify-center
                                                            rounded-full border
                                                            ${
                                                              optionSelected
                                                                ? "border-white bg-white text-zinc-900"
                                                                : "border-zinc-300 bg-white"
                                                            }
                                                          `}
                                                    >
                                                      {optionSelected && (
                                                        <Check
                                                          size={12}
                                                          strokeWidth={2.5}
                                                        />
                                                      )}
                                                    </span>

                                                    <span className="min-w-0 flex-1">
                                                      <span
                                                        className={`block text-sm font-semibold ${
                                                          optionSelected
                                                            ? "text-white"
                                                            : "text-zinc-900"
                                                        }`}
                                                      >
                                                        {option.name}
                                                      </span>

                                                      {option.description && (
                                                        <span
                                                          className={`mt-1 block text-xs leading-5 ${
                                                            optionSelected
                                                              ? "text-white/50"
                                                              : "text-zinc-500"
                                                          }`}
                                                        >
                                                          {option.description}
                                                        </span>
                                                      )}

                                                      <span
                                                        className={`mt-1.5 block text-xs font-medium ${
                                                          optionSelected
                                                            ? "text-white/70"
                                                            : "text-zinc-500"
                                                        }`}
                                                      >
                                                        {formatCurrency(
                                                          option.price,
                                                        )}{" "}
                                                        /{" "}
                                                        {option.unit || "unit"}
                                                      </span>
                                                    </span>
                                                  </div>
                                                </button>

                                                {optionSelected && (
                                                  <div className="mt-4 border-t border-white/10 pt-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <div>
                                                        <p className="text-[11px] font-medium text-white/50">
                                                          Quantity
                                                        </p>

                                                        <p className="mt-0.5 text-[11px] text-white/35">
                                                          Minimum:{" "}
                                                          {rules.minQuantity}
                                                        </p>
                                                      </div>

                                                      <QuantityControl
                                                        quantity={
                                                          optionQuantity
                                                        }
                                                        minQuantity={
                                                          rules.minQuantity
                                                        }
                                                        maxQuantity={
                                                          rules.maxQuantity
                                                        }
                                                        unit={
                                                          option.unit || "unit"
                                                        }
                                                        dark
                                                        onChange={(
                                                          nextQuantity,
                                                        ) =>
                                                          handleGroupedQuantityChange(
                                                            selectedIndex,
                                                            group.key,
                                                            nextQuantity,
                                                          )
                                                        }
                                                      />
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {inlineFields.map((field) => (
                                          <div
                                            key={field.name}
                                            className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4"
                                          >
                                            <DynamicField
                                              field={field}
                                              value={
                                                item.formData?.[field.name]
                                              }
                                              onChange={(fieldName, value) =>
                                                handleFieldChange(
                                                  selectedIndex,
                                                  fieldName,
                                                  value,
                                                )
                                              }
                                            />
                                            {renderAdCreditForField(
                                              field,
                                              service,
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="mt-5 space-y-3">
                                  {pricingOptions.map((option) => {
                                    const optionSelected =
                                      item.selectedPricingOption?._id ===
                                      option._id;

                                    return (
                                      <button
                                        key={option._id}
                                        type="button"
                                        disabled={submitting}
                                        onClick={() =>
                                          handlePricingOptionChange(
                                            selectedIndex,
                                            option,
                                          )
                                        }
                                        className={`
                                            relative flex w-full items-start gap-4 rounded-2xl
                                            border p-4 text-left transition-all duration-200
                                            sm:p-5
                                            ${
                                              optionSelected
                                                ? "border-zinc-900 bg-zinc-900 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
                                                : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50"
                                            }
                                          `}
                                      >
                                        <div
                                          className={`
                                              mt-0.5 flex h-5 w-5 shrink-0
                                              items-center justify-center rounded-full border
                                              ${
                                                optionSelected
                                                  ? "border-white bg-white text-zinc-900"
                                                  : "border-zinc-300 bg-white"
                                              }
                                            `}
                                        >
                                          {optionSelected && (
                                            <Check
                                              size={12}
                                              strokeWidth={2.5}
                                            />
                                          )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <p
                                              className={`text-sm font-semibold ${
                                                optionSelected
                                                  ? "text-white"
                                                  : "text-zinc-900"
                                              }`}
                                            >
                                              {option.name}
                                            </p>

                                            <p
                                              className={`shrink-0 text-sm font-semibold ${
                                                optionSelected
                                                  ? "text-white"
                                                  : "text-zinc-900"
                                              }`}
                                            >
                                              {formatCurrency(option.price)}
                                              {option.unit
                                                ? ` / ${option.unit}`
                                                : ""}
                                            </p>
                                          </div>

                                          {option.description && (
                                            <p
                                              className={`mt-1.5 text-xs leading-5 ${
                                                optionSelected
                                                  ? "text-white/50"
                                                  : "text-zinc-500"
                                              }`}
                                            >
                                              {option.description}
                                            </p>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* ==================================================
                              REQUIRED FIELDS
                          =================================================== */}

                          {requiredFields.length > 0 && (
                            <div
                              className={`${
                                hasServiceLevelPricing
                                  ? "mt-7 border-t border-zinc-100 pt-7"
                                  : ""
                              }`}
                            >
                              <div>
                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                                  Required details
                                </p>

                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                  Complete these fields before placing the
                                  order.
                                </p>
                              </div>

                              <div className="mt-6 space-y-6">
                                {requiredFields.map((field) => (
                                  <div key={field.name}>
                                    <DynamicField
                                      field={field}
                                      value={item.formData?.[field.name]}
                                      onChange={(fieldName, value) =>
                                        handleFieldChange(
                                          selectedIndex,
                                          fieldName,
                                          value,
                                        )
                                      }
                                    />
                                    {renderAdCreditForField(field, service)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ==================================================
                              OPTIONAL FIELDS
                          =================================================== */}

                          {optionalFields.length > 0 && (
                            <div
                              className={`${
                                hasServiceLevelPricing ||
                                requiredFields.length > 0
                                  ? "mt-7 border-t border-zinc-100 pt-7"
                                  : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  toggleOptionalField(`service:${serviceId}`)
                                }
                                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-left transition hover:border-zinc-300 hover:bg-white"
                              >
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-zinc-900">
                                      Optional details
                                    </p>

                                    <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                                      {optionalFields.length} fields
                                    </span>
                                  </div>

                                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                                    These fields are optional and closed by
                                    default.
                                  </p>
                                </div>

                                {openOptionalFields[`service:${serviceId}`] ? (
                                  <ChevronUp
                                    size={17}
                                    className="shrink-0 text-zinc-400"
                                  />
                                ) : (
                                  <ChevronDown
                                    size={17}
                                    className="shrink-0 text-zinc-400"
                                  />
                                )}
                              </button>

                              {openOptionalFields[`service:${serviceId}`] && (
                                <div className="mt-6 space-y-6 rounded-2xl border border-zinc-100 bg-zinc-50/40 p-4 sm:p-5">
                                  {optionalFields.map((field) => (
                                    <div key={field.name}>
                                      <DynamicField
                                        field={field}
                                        value={item.formData?.[field.name]}
                                        onChange={(fieldName, value) =>
                                          handleFieldChange(
                                            selectedIndex,
                                            fieldName,
                                            value,
                                          )
                                        }
                                      />
                                      {renderAdCreditForField(field, service)}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* ==================================================
                              REPEATABLE GROUPS
                          =================================================== */}

                          {repeatableGroups.length > 0 && (
                            <div
                              className={`${
                                hasServiceLevelPricing ||
                                requiredFields.length > 0 ||
                                optionalFields.length > 0
                                  ? "mt-7 border-t border-zinc-100 pt-7"
                                  : ""
                              }`}
                            >
                              {!isRepeatableOnlyService(item.service) && (
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                                    Repeated configurations
                                  </p>

                                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    Add multiple independent configurations
                                    where required.
                                  </p>
                                </div>
                              )}

                              <div className="mt-5 space-y-5">
                                {repeatableGroups.map((group) => (
                                  <RepeatableGroup
                                    key={group.name}
                                    group={group}
                                    service={item.service}
                                    entries={item.formData?.[group.name]}
                                    disabled={submitting}
                                    onAdd={() =>
                                      handleRepeatableAdd(selectedIndex, group)
                                    }
                                    onRemove={(entryIndex) =>
                                      handleRepeatableRemove(
                                        selectedIndex,
                                        group,
                                        entryIndex,
                                      )
                                    }
                                    onFieldChange={(
                                      entryIndex,
                                      fieldName,
                                      value,
                                    ) =>
                                      handleRepeatableFieldChange(
                                        selectedIndex,
                                        group,
                                        entryIndex,
                                        fieldName,
                                        value,
                                      )
                                    }
                                    onPricingOptionChange={(
                                      entryIndex,
                                      pricingGroupName,
                                      option,
                                    ) =>
                                      handleRepeatableEntryPricingOptionChange(
                                        selectedIndex,
                                        group,
                                        entryIndex,
                                        pricingGroupName,
                                        option,
                                      )
                                    }
                                    onPricingQuantityChange={(
                                      entryIndex,
                                      pricingGroupName,
                                      nextQuantity,
                                    ) =>
                                      handleRepeatableEntryPricingQuantityChange(
                                        selectedIndex,
                                        group,
                                        entryIndex,
                                        pricingGroupName,
                                        nextQuantity,
                                      )
                                    }
                                    openOptionalFields={openOptionalFields}
                                    toggleOptionalField={toggleOptionalField}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* No configuration */}

                          {!pricingOptions.length &&
                            !requiredFields.length &&
                            !optionalFields.length &&
                            !repeatableGroups.length && (
                              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-8 text-center">
                                <p className="text-sm text-zinc-500">
                                  No additional configuration is required for
                                  this service.
                                </p>
                              </div>
                            )}

                          {/* Selected service amount */}

                          <div className="mt-7 flex items-center justify-between gap-4 border-t border-zinc-100 pt-5">
                            <div>
                              <p className="text-xs text-zinc-400">
                                Service estimate
                              </p>

                              <p className="mt-1 text-sm text-zinc-500">
                                {isCustomUnpricedItem(item)
                                  ? "Final pricing will be confirmed."
                                  : "Based on your current selections."}
                              </p>
                            </div>

                            <p className="shrink-0 text-lg font-semibold text-zinc-900">
                              {isCustomUnpricedItem(item)
                                ? "Custom"
                                : formatCurrency(itemAmount)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {loadingServiceId && (
                <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                  <Loader2 size={13} className="animate-spin" />
                  Loading service configuration...
                </div>
              )}
            </section>

            {/* ==============================================================
                GLOBAL ADDITIONAL REQUIREMENTS
            ============================================================== */}

            {orderItems.length > 0 && (
              <>
                <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-7">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                    Step 2
                  </p>

                  <h2
                    id="new-order-requirements-label"
                    className="mt-1.5 text-lg font-semibold text-zinc-900"
                  >
                    Additional requirements
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                    Optional instructions that apply to the complete order.
                  </p>

                  <textarea
                    aria-labelledby="new-order-requirements-label"
                    value={additionalRequirements}
                    onChange={(event) =>
                      setAdditionalRequirements(event.target.value)
                    }
                    rows={5}
                    placeholder="Is there anything else you'd like us to know?"
                    className="mt-5 w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm leading-6 text-zinc-900 outline-none transition-all duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-900/[0.04]"
                  />

                  <p className="mt-2 text-xs text-zinc-400">
                    Mention special instructions, references, deadlines,
                    preferences or anything else relevant to your order.
                  </p>
                </section>

                {/* ==========================================================
                    PAYMENT
                =========================================================== */}

                <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-7">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                    Step 3
                  </p>

                  <h2 className="mt-1.5 text-lg font-semibold text-zinc-900">
                    Payment method
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                    Choose how you'd like to complete the payment.
                  </p>

                  <div
                    className={`mt-5 grid gap-3 ${allowMonthEndPayment ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
                  >
                    <PaymentOption
                      selected={paymentMethod === "cod"}
                      onClick={() => selectPaymentMethod("cod")}
                      icon={Banknote}
                      title="Cash Payment"
                      description="Pay after your order is processed."
                    />

                    <PaymentOption
                      selected={paymentMethod === "online"}
                      onClick={() => selectPaymentMethod("online")}
                      icon={CreditCard}
                      title="Pay Online"
                      description={
                        hasCustomUnpricedService
                          ? "Available when the order has a payable amount."
                          : `Secure Razorpay payment · ${paymentPricing?.online ?? "Loading"}% GST`
                      }
                      disabled={hasCustomUnpricedService && subtotal <= 0}
                    />

                    <PaymentOption
                      selected={paymentMethod === "cheque"}
                      onClick={() => selectPaymentMethod("cheque")}
                      icon={Landmark}
                      title="Cheque"
                      description="Choose how the cheque will be collected."
                    />
                    {allowMonthEndPayment && (
                      <PaymentOption
                        selected={paymentMethod === "month_end"}
                        onClick={() => selectPaymentMethod("month_end")}
                        icon={CalendarDays}
                        title="Pay on Month-End"
                        description="Payment is due at the end of the month."
                      />
                    )}
                  </div>
                  {allowMonthEndPayment && (
                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      Your account is eligible for Pay on Month-End. Place your
                      order now and pay at the end of the month.
                    </p>
                  )}
                  {paymentMethod === "month_end" && !allowMonthEndPayment && (
                    <p
                      role="alert"
                      className="mt-3 text-xs leading-5 text-red-600"
                    >
                      Pay on Month-End is no longer enabled. Choose another
                      payment method.
                    </p>
                  )}

                  {paymentMethod === "cheque" && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <ChequeOption
                        selected={chequeType === "with_gst"}
                        onClick={() => setChequeType("with_gst")}
                        title="Cheque — With GST"
                        description={`Bank-deposited cheque with ${paymentPricing?.chequeWithGst ?? "Loading"}% GST.`}
                      />
                      <ChequeOption
                        selected={chequeType === "direct_collection"}
                        onClick={() => setChequeType("direct_collection")}
                        title="Self Cash Cheque"
                        description={`${paymentPricing?.chequeDirectCollection ?? "Loading"}% GST for self cash cheque.`}
                      />
                    </div>
                  )}

                  {editingDraftId && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-semibold text-amber-900">
                        Confirm order total
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-800">
                        Review the updated total before placing your order.
                      </p>
                      {draftQuoteLoading && (
                        <p className="mt-3 flex items-center gap-2 text-xs text-amber-800">
                          <Loader2 size={14} className="animate-spin" />
                          Verifying current prices...
                        </p>
                      )}
                      {currentDraftQuoteError && (
                        <p className="mt-3 text-xs text-red-700">
                          {currentDraftQuoteError}
                        </p>
                      )}
                      {currentDraftQuote && (
                        <div className="mt-3 space-y-2 border-t border-amber-200 pt-3">
                          {currentDraftQuote.serviceBreakdown.map((line) => (
                            <div
                              key={line.serviceId}
                              className="flex justify-between gap-3 text-xs text-amber-900"
                            >
                              <span className="min-w-0 truncate">
                                {line.serviceName}
                                {line.discountAmount > 0 &&
                                  ` · −${formatCurrency(line.discountAmount)}`}
                              </span>
                              <span className="shrink-0">
                                {formatCurrency(line.amount)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-amber-200 pt-2 text-xs text-amber-900">
                            <span>
                              Taxable subtotal · GST (
                              {currentDraftQuote.gstRate}%)
                            </span>
                            <span>
                              {formatCurrency(
                                currentDraftQuote.taxableSubtotal,
                              )}{" "}
                              · {formatCurrency(currentDraftQuote.gstAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 pt-1">
                            <span className="text-sm font-semibold text-amber-950">
                              Current payable total
                            </span>
                            <span className="text-base font-bold text-amber-950">
                              {formatCurrency(currentDraftQuote.amount)}
                            </span>
                          </div>
                          {currentDraftQuote.confirmed ? (
                            <p className="pt-1 text-xs font-medium text-emerald-800">
                              Current total confirmed.
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setDraftQuote((current) =>
                                  current
                                    ? {
                                        ...current,
                                        confirmed:
                                          current.requestKey ===
                                          currentDraftQuoteRequestKey,
                                      }
                                    : current,
                                )
                              }
                              className="mt-2 w-full rounded-xl bg-amber-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-800"
                            >
                              Confirm total of{" "}
                              {formatCurrency(currentDraftQuote.amount)}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {(error ||
                    (["online", "month_end"].includes(paymentMethod) &&
                      paymentPricingError)) && (
                    <div
                      ref={errorRef}
                      tabIndex={-1}
                      role="alert"
                      className="mt-4 scroll-mt-28 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    >
                      <p className="text-sm font-medium text-red-800">
                        Your order needs attention
                      </p>
                      <p className="mt-1 text-xs leading-5 text-red-700">
                        {error ||
                          (["online", "month_end"].includes(paymentMethod) &&
                            paymentPricingError)}
                      </p>
                      {validationServiceId &&
                        orderItems.some(
                          (item) => item.service._id === validationServiceId,
                        ) && (
                          <a
                            href={`#order-service-${validationServiceId}`}
                            className="mt-2 inline-flex min-h-11 items-center text-xs font-medium text-red-800 underline underline-offset-4"
                          >
                            Review service configuration
                          </a>
                        )}
                    </div>
                  )}

                  <div className="mt-5 grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={
                        draftBusy ||
                        submitting ||
                        !orderItems.length ||
                        Boolean(loadingServiceId)
                      }
                      className="dashboard-action dashboard-action--secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {draftBusy ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      {editingDraftId ? "Update Draft" : "Save as Draft"}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        draftQuoteLoading ||
                        draftBusy ||
                        Boolean(
                          editingDraftId &&
                          currentDraftQuote &&
                          !currentDraftQuote.confirmed,
                        ) ||
                        currentCouponLoading ||
                        Boolean(
                          appliedCouponCode &&
                          (!hasCurrentCouponQuote || currentCouponError),
                        ) ||
                        (["online", "month_end"].includes(paymentMethod) &&
                          (paymentPricingLoading || !paymentPricing)) ||
                        (paymentMethod === "month_end" &&
                          !allowMonthEndPayment) ||
                        Boolean(loadingServiceId) ||
                        !orderItems.length ||
                        (paymentMethod === "online" &&
                          estimatedTotal <= 0 &&
                          adCreditTotal === 0)
                      }
                      className="dashboard-action dashboard-action--primary group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_25px_rgba(24,24,27,0.12)] transition-all duration-300 ease-out hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting || draftQuoteLoading ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          {submitting ? "Processing..." : "Checking price..."}
                        </>
                      ) : (
                        <>
                          <span>
                            {editingDraftId && !currentDraftQuote
                              ? "Review current total"
                              : paymentMethod === "online"
                                ? "Continue to payment"
                                : "Place order"}
                          </span>

                          <ArrowRight
                            size={17}
                            className="transition-transform duration-200 group-hover:translate-x-0.5"
                          />
                        </>
                      )}
                    </button>
                  </div>

                  {(paymentMethod === "online" ||
                    (paymentMethod === "cheque" && chequeType)) && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3.5">
                      <Info
                        size={15}
                        className="mt-0.5 shrink-0 text-zinc-400"
                      />

                      <p className="text-xs leading-5 text-zinc-500">
                        {paymentMethod === "online"
                          ? `Online payments include ${gstRate}% GST on the order subtotal.`
                          : chequeType === "with_gst"
                            ? `This cheque option includes ${gstRate}% GST on the order subtotal.`
                            : `Self Cash Cheque currently uses ${gstRate}% GST. Confirm this treatment with your accountant.`}
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          {/* ================================================================
              RIGHT SUMMARY
          ================================================================= */}

          <aside
            id="new-order-summary"
            tabIndex={-1}
            aria-label="Order summary"
            className="scroll-mt-28 order-summary-scroll min-w-0 self-start lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
          >
            {orderItems.length === 0 ? (
              <section className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-6 sm:p-7">
                <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-300">
                    <CreditCard size={20} />
                  </div>

                  <h2 className="mt-4 text-base font-semibold text-zinc-800">
                    Your order summary
                  </h2>

                  <p className="mt-2 max-w-[260px] text-sm leading-6 text-zinc-400">
                    Select one or more services to see your configuration and
                    pricing summary here.
                  </p>
                </div>
              </section>
            ) : (
              <section className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">
                        Order summary
                      </p>

                      <h2 className="mt-1.5 text-lg font-semibold text-white">
                        {orderItems.length}{" "}
                        {orderItems.length === 1 ? "service" : "services"}
                      </h2>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60">
                      <CreditCard size={16} />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {orderItems.map((item, index) => {
                      const itemAmount = itemEstimates[index] || 0;
                      const serviceId = String(item.service._id);
                      const expanded = expandedSummaryServices.has(serviceId);
                      const serviceCouponLine =
                        currentCouponQuote?.serviceBreakdown?.find(
                          (line) => String(line.serviceId) === serviceId,
                        );
                      const discountedItemAmount = serviceCouponLine
                        ? Number(serviceCouponLine.discountedAmount)
                        : itemAmount;

                      const selectedOptions = item.isGroupedPricing
                        ? Object.values(
                            item.selectedPricingOptions || {},
                          ).filter(Boolean)
                        : item.selectedPricingOption
                          ? [item.selectedPricingOption]
                          : [];

                      const quantityInfo = getQuantityInfo(item);
                      const gridPricingMode = getGridPricingMode(
                        item.service,
                        item.formData?.pricingMode,
                      );
                      const repeatableGroups = getRepeatableGroups(
                        item.service,
                      );
                      const hasBasePriceLine =
                        selectedOptions.length === 0 &&
                        Number(item.service.basePrice || 0) > 0 &&
                        item.service.pricingType !== "custom";

                      return (
                        <article
                          key={serviceId}
                          className={`
                              w-full rounded-2xl border p-3.5
                              transition-all duration-200
                              ${
                                index === activeServiceIndex
                                  ? "border-white/20 bg-white/10"
                                  : "border-white/5 bg-white/[0.03]"
                              }
                            `}
                        >
                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveServiceIndex(index)}
                              className="min-w-0 flex-1 rounded-lg text-left"
                            >
                              <p className="text-[10px] uppercase tracking-wide text-white/35">
                                Service {index + 1}
                              </p>

                              <p className="mt-1 truncate text-sm font-medium text-white">
                                {item.service.name}
                              </p>

                              {quantityInfo.hasQuantity && (
                                <p className="mt-1 text-[10px] text-white/30">
                                  Qty {quantityInfo.quantity}{" "}
                                  {quantityInfo.unit || ""}
                                  {gridPricingMode &&
                                    ` · ${quantityInfo.quantity * gridPricingMode.itemsPerUnit} posts`}
                                </p>
                              )}
                            </button>

                            <div className="shrink-0 pt-3 text-right">
                              {serviceCouponLine?.discountAmount > 0 && (
                                <p className="text-[10px] text-white/35 line-through">
                                  {formatCurrency(itemAmount)}
                                </p>
                              )}
                              <p className="text-sm font-medium text-white">
                                {isCustomUnpricedItem(item)
                                  ? "Custom"
                                  : formatCurrency(discountedItemAmount)}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={submitting || Boolean(loadingServiceId)}
                              onClick={() => handleToggleService(serviceId)}
                              aria-label={`Remove ${item.service.name} from order`}
                              title={`Remove ${item.service.name} from order`}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/50 transition hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>

                            <button
                              type="button"
                              aria-expanded={expanded}
                              aria-label={`${expanded ? "Hide" : "Show"} ${item.service.name} pricing details`}
                              onClick={() =>
                                setExpandedSummaryServices((current) => {
                                  const next = new Set(current);
                                  if (next.has(serviceId)) {
                                    next.delete(serviceId);
                                  } else {
                                    next.add(serviceId);
                                  }
                                  return next;
                                })
                              }
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
                            >
                              {expanded ? (
                                <ChevronUp size={16} aria-hidden="true" />
                              ) : (
                                <ChevronDown size={16} aria-hidden="true" />
                              )}
                            </button>
                          </div>

                          {expanded && (
                            <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                              {selectedOptions.length > 0 &&
                                selectedOptions.map((option) => {
                                  const groupKey =
                                    String(option.group || "").trim() ||
                                    "__ungrouped__";
                                  const optionQuantity = item.isGroupedPricing
                                    ? getGroupedOptionQuantity(
                                        item,
                                        groupKey,
                                        option,
                                      )
                                    : getItemQuantity(item);
                                  const lineTotal =
                                    Number(option.price || 0) * optionQuantity;

                                  return (
                                    <div
                                      key={option._id}
                                      className="flex items-start justify-between gap-3"
                                    >
                                      <div className="min-w-0">
                                        <p className="truncate text-xs text-white/75">
                                          {option.name}
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-white/35">
                                          {optionQuantity} ×{" "}
                                          {formatCurrency(option.price)} /{" "}
                                          {option.unit || "unit"}
                                        </p>
                                      </div>
                                      <p className="shrink-0 text-xs text-white/70">
                                        {formatCurrency(lineTotal)}
                                      </p>
                                    </div>
                                  );
                                })}

                              {hasBasePriceLine && (
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs text-white/75">
                                      {item.service.pricingType === "fixed"
                                        ? "Service price"
                                        : item.service.name}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-white/35">
                                      {quantityInfo.quantity} ×{" "}
                                      {formatCurrency(
                                        gridPricingMode?.unitPrice ??
                                          item.service.basePrice,
                                      )}{" "}
                                      /{" "}
                                      {gridPricingMode?.unit ||
                                        item.service.unit ||
                                        "unit"}
                                      {gridPricingMode &&
                                        ` · ${gridPricingMode.label} · ${gridPricingMode.itemsPerUnit} posts per unit`}
                                    </p>
                                  </div>
                                  <p className="shrink-0 text-xs text-white/70">
                                    {formatCurrency(
                                      Number(
                                        gridPricingMode?.unitPrice ??
                                          item.service.basePrice ??
                                          0,
                                      ) *
                                        (item.service.pricingType === "fixed"
                                          ? 1
                                          : quantityInfo.quantity),
                                    )}
                                  </p>
                                </div>
                              )}

                              {repeatableGroups.map((group) => {
                                const entries = Array.isArray(
                                  item.formData?.[group.name],
                                )
                                  ? item.formData[group.name]
                                  : [];
                                const pricingGroups =
                                  getRepeatableGroupPricingGroups(
                                    item.service,
                                    group,
                                  );

                                return entries.map((entry, entryIndex) => {
                                  const selectedEntryOptions =
                                    pricingGroups.flatMap((pricingGroup) => {
                                      const selectedId =
                                        entry?.pricingOptions?.[
                                          pricingGroup.name
                                        ];
                                      const option = pricingGroup.options.find(
                                        (candidate) =>
                                          String(candidate._id) ===
                                          String(selectedId),
                                      );

                                      if (!option) {
                                        return [];
                                      }

                                      const rules = getQuantityRules(
                                        item.service,
                                        option,
                                      );
                                      const rawQuantity =
                                        entry?.pricingQuantities?.[
                                          pricingGroup.name
                                        ];
                                      const optionQuantity =
                                        rawQuantity !== undefined &&
                                        rawQuantity !== null
                                          ? Number(rawQuantity)
                                          : rules.minQuantity;

                                      return [
                                        {
                                          option,
                                          quantity: optionQuantity,
                                          lineTotal:
                                            Number(option.price || 0) *
                                            optionQuantity,
                                        },
                                      ];
                                    });
                                  const entryFieldPrice = getFieldValuesPrice(
                                    getActiveFieldsForRepeatableEntry(
                                      item.service,
                                      group,
                                      entry,
                                    ),
                                    entry?.fields || entry,
                                  );
                                  const entryPricingTotal =
                                    getRepeatableEntryPricingTotal(
                                      item.service,
                                      group,
                                      entry,
                                    ) + entryFieldPrice;

                                  return (
                                    <div
                                      key={`${group.name}-${entryIndex}`}
                                      className="rounded-xl border border-white/10 bg-black/10 p-3"
                                    >
                                      <div className="mb-2 flex items-center justify-between gap-3">
                                        <p className="text-[11px] font-semibold text-white/75">
                                          {group.label || "Item"}{" "}
                                          {entryIndex + 1}
                                        </p>
                                        <p className="text-[10px] text-white/35">
                                          Reel subtotal{" "}
                                          {formatCurrency(entryPricingTotal)}
                                        </p>
                                      </div>

                                      {selectedEntryOptions.map(
                                        ({ option, quantity, lineTotal }) => (
                                          <div
                                            key={option._id}
                                            className="flex items-start justify-between gap-3 py-1"
                                          >
                                            <div className="min-w-0">
                                              <p className="truncate text-xs text-white/65">
                                                {option.name}
                                              </p>
                                              <p className="mt-0.5 text-[10px] text-white/35">
                                                {quantity} ×{" "}
                                                {formatCurrency(option.price)} /{" "}
                                                {option.unit || "unit"}
                                              </p>
                                            </div>
                                            <p className="shrink-0 text-xs text-white/55">
                                              {formatCurrency(lineTotal)}
                                            </p>
                                          </div>
                                        ),
                                      )}

                                      {entryFieldPrice > 0 && (
                                        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                                          <p className="text-[10px] text-white/40">
                                            Applicable charges
                                          </p>
                                          <p className="text-xs text-white/55">
                                            {formatCurrency(entryFieldPrice)}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                });
                              })}

                              {getSelectedFieldsPrice(item) > 0 && (
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-xs text-white/45">
                                    Applicable charges
                                  </p>
                                  <p className="text-xs text-white/65">
                                    {formatCurrency(
                                      getSelectedFieldsPrice(item),
                                    )}
                                  </p>
                                </div>
                              )}

                              {serviceCouponLine && (
                                <div className="flex items-start justify-between gap-3 rounded-lg bg-white/[0.04] px-2.5 py-2">
                                  <div>
                                    <p className="text-xs text-emerald-200/80">
                                      Coupon discount (
                                      {serviceCouponLine.discountPercent}%)
                                    </p>
                                    {serviceCouponLine.eligibleAmount <
                                      serviceCouponLine.originalAmount && (
                                      <p className="mt-0.5 text-[10px] text-white/35">
                                        Applied to{" "}
                                        {formatCurrency(
                                          serviceCouponLine.eligibleAmount,
                                        )}{" "}
                                        eligible charges
                                      </p>
                                    )}
                                  </div>
                                  <p className="shrink-0 text-xs font-medium text-emerald-200">
                                    −
                                    {formatCurrency(
                                      serviceCouponLine.discountAmount,
                                    )}
                                  </p>
                                </div>
                              )}

                              {itemAmount > 0 && (
                                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                                  <p className="text-[10px] uppercase tracking-wide text-white/35">
                                    {serviceCouponLine
                                      ? "After discount"
                                      : "Service subtotal"}
                                  </p>
                                  <p className="text-xs font-medium text-white/75">
                                    {formatCurrency(discountedItemAmount)}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-4">
                    <label
                      htmlFor="order-coupon-code"
                      className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/35"
                    >
                      Discount coupon
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        id="order-coupon-code"
                        value={couponInput}
                        disabled={Boolean(appliedCouponCode) || submitting}
                        onChange={(event) =>
                          setCouponInput(event.target.value.toUpperCase())
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            if (couponInput.trim()) {
                              setCouponError("");
                              setAppliedCouponCode(
                                couponInput.trim().toUpperCase(),
                              );
                            }
                          }
                        }}
                        placeholder="Enter coupon code"
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm uppercase !text-white caret-white outline-none placeholder:normal-case placeholder:text-white/25 focus:border-white/25 disabled:opacity-60"
                      />
                      {appliedCouponCode ? (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => {
                            setAppliedCouponCode("");
                            setCouponInput("");
                            setCouponQuote(null);
                            setCouponError("");
                            setCouponErrorRequestKey("");
                            setCouponLoading(false);
                          }}
                          className="dashboard-action dashboard-action--tertiary dashboard-action--inverse shrink-0 rounded-xl border border-white/15 px-3 py-2.5 text-xs font-medium text-white/70 hover:bg-white/10"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            !couponInput.trim() ||
                            !orderItems.length ||
                            currentCouponLoading ||
                            submitting
                          }
                          onClick={() => {
                            setCouponError("");
                            setAppliedCouponCode(
                              couponInput.trim().toUpperCase(),
                            );
                          }}
                          className="dashboard-action dashboard-action--primary dashboard-action--inverse shrink-0 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    {currentCouponLoading && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-white/45">
                        <Loader2 size={13} className="animate-spin" />
                        Checking coupon against your order...
                      </p>
                    )}
                    {currentCouponError && !currentCouponLoading && (
                      <p className="mt-2 text-xs text-red-300">
                        {currentCouponError}
                      </p>
                    )}
                    {hasCurrentCouponQuote && !currentCouponLoading && (
                      <p className="mt-2 text-xs text-emerald-200">
                        {currentCouponQuote.code} applied successfully.
                      </p>
                    )}
                  </div>

                  <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs text-white/40">
                        {hasCurrentCouponQuote
                          ? "Original subtotal"
                          : "Subtotal"}
                      </p>

                      <p className="text-sm font-medium text-white">
                        {formatCurrency(subtotal)}
                      </p>
                    </div>

                    {hasCurrentCouponQuote && (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs text-emerald-200/80">
                              Coupon {currentCouponQuote.code}
                            </p>
                            <p className="mt-0.5 text-[10px] text-white/30">
                              Service-specific discounts
                            </p>
                          </div>
                          <p className="text-sm font-medium text-emerald-200">
                            −{formatCurrency(couponDiscountTotal)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xs text-white/40">
                            {adCreditTotal > 0
                              ? "Subtotal after coupon"
                              : "Taxable subtotal"}
                          </p>
                          <p className="text-sm font-medium text-white">
                            {formatCurrency(subtotalBeforeAdCredit)}
                          </p>
                        </div>
                        <div className="space-y-1 border-l border-white/10 pl-3">
                          {currentCouponQuote.serviceBreakdown
                            .filter((line) => line.discountAmount > 0)
                            .map((line) => (
                              <div
                                key={line.serviceId}
                                className="flex justify-between gap-3 text-[10px] text-white/40"
                              >
                                <span className="truncate">
                                  {line.serviceName} ({line.discountPercent}%)
                                </span>
                                <span className="shrink-0">
                                  −{formatCurrency(line.discountAmount)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </>
                    )}

                    {adCreditTotal > 0 && (
                      <div className="flex items-center justify-between text-sm text-emerald-300">
                        <span>Ad credit applied</span>
                        <span>-{formatCurrency(adCreditTotal)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-white/40">
                          GST
                          {hasCurrentCouponQuote ? " on taxable subtotal" : ""}
                        </p>

                        <p className="mt-0.5 text-[10px] text-white/25">
                          {gstRate === null
                            ? paymentMethod === "cheque" && chequeType
                              ? "Loading tax rate"
                              : paymentMethod === "cheque"
                                ? "Choose a cheque type"
                                : "Loading tax rate"
                            : paymentMethod === "cod"
                              ? `${gstRate}% for Cash Payment`
                              : paymentMethod === "cheque" &&
                                  chequeType === "direct_collection"
                                ? `${gstRate}% for Self Cash Cheque`
                                : `${gstRate}% on subtotal`}
                        </p>
                      </div>

                      <p className="text-sm font-medium text-white">
                        {gstRate === null ? "—" : formatCurrency(gstAmount)}
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                      <div>
                        <p className="text-xs text-white/40">Estimated total</p>

                        {hasCustomUnpricedService && (
                          <p className="mt-1 text-[11px] leading-4 text-white/30">
                            Final pricing will be confirmed by our team.
                          </p>
                        )}
                      </div>

                      <p className="shrink-0 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        {hasCustomUnpricedService
                          ? "Custom"
                          : estimatedTotal === null
                            ? "Loading"
                            : formatCurrency(estimatedTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
                      Payment method
                    </p>

                    <div
                      className={`grid gap-2 ${allowMonthEndPayment ? "grid-cols-2" : "grid-cols-3"}`}
                    >
                      <PaymentMethodChip
                        selected={paymentMethod === "cod"}
                        onClick={() => selectPaymentMethod("cod")}
                        icon={Banknote}
                        label="Cash Payment"
                      />
                      <PaymentMethodChip
                        selected={paymentMethod === "online"}
                        onClick={() => selectPaymentMethod("online")}
                        icon={CreditCard}
                        label="Pay Online"
                        disabled={hasCustomUnpricedService && subtotal <= 0}
                      />
                      <PaymentMethodChip
                        selected={paymentMethod === "cheque"}
                        onClick={() => selectPaymentMethod("cheque")}
                        icon={Landmark}
                        label="Cheque"
                      />
                      {allowMonthEndPayment && (
                        <PaymentMethodChip
                          selected={paymentMethod === "month_end"}
                          onClick={() => selectPaymentMethod("month_end")}
                          icon={CalendarDays}
                          label="Pay on Month-End"
                        />
                      )}
                    </div>
                    {allowMonthEndPayment && (
                      <p className="mt-2 text-[11px] leading-4 text-white/50">
                        Eligible for month-end payment. Payment is due at the
                        end of the month.
                      </p>
                    )}

                    {paymentMethod === "cheque" && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <ChequeOption
                          compact
                          selected={chequeType === "with_gst"}
                          onClick={() => setChequeType("with_gst")}
                          title="With GST"
                        />
                        <ChequeOption
                          compact
                          selected={chequeType === "direct_collection"}
                          onClick={() => setChequeType("direct_collection")}
                          title="Self Cash Cheque"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={
                        draftBusy ||
                        submitting ||
                        !orderItems.length ||
                        Boolean(loadingServiceId)
                      }
                      className="dashboard-action dashboard-action--secondary dashboard-action--inverse mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {draftBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      {editingDraftId ? "Update Draft" : "Save as Draft"}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        draftQuoteLoading ||
                        draftBusy ||
                        Boolean(
                          editingDraftId &&
                          currentDraftQuote &&
                          !currentDraftQuote.confirmed,
                        ) ||
                        currentCouponLoading ||
                        Boolean(
                          appliedCouponCode &&
                          (!hasCurrentCouponQuote || currentCouponError),
                        ) ||
                        (["online", "month_end"].includes(paymentMethod) &&
                          (paymentPricingLoading || !paymentPricing)) ||
                        (paymentMethod === "month_end" &&
                          !allowMonthEndPayment) ||
                        Boolean(loadingServiceId) ||
                        !orderItems.length ||
                        (paymentMethod === "online" &&
                          estimatedTotal !== null &&
                          estimatedTotal <= 0 &&
                          adCreditTotal === 0)
                      }
                      className="dashboard-action dashboard-action--primary dashboard-action--inverse mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting || draftQuoteLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          {submitting ? "Processing..." : "Checking price..."}
                        </>
                      ) : (
                        <>
                          {editingDraftId && !currentDraftQuote
                            ? "Review current total"
                            : paymentMethod === "online"
                              ? "Continue to payment"
                              : "Place Order"}
                          <ArrowRight size={14} aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>
      </form>
      {orderItems.length > 0 && (
        <nav className="mobile-order-review" aria-label="Order review shortcut">
          <div className="min-w-0">
            <p className="text-[11px] text-zinc-500">Estimated total</p>
            <p className="text-base font-semibold text-zinc-900">
              {hasCustomUnpricedService
                ? "Custom pricing"
                : estimatedTotal === null
                  ? "Loading..."
                  : formatCurrency(estimatedTotal)}
            </p>
          </div>
          <a
            href="#new-order-summary"
            className="dashboard-action dashboard-action--primary shrink-0"
          >
            Review order <ArrowRight size={15} aria-hidden="true" />
          </a>
        </nav>
      )}
    </div>
  );
};

export default NewOrder;
