// Keep menus inside the viewport, including when their trigger is in a clipped card.
export const getSelectPlacement = (rect, viewportWidth, viewportHeight) => {
  const margin = 8;
  const gap = 6;
  const width = Math.min(rect.width, Math.max(0, viewportWidth - margin * 2));
  const below = viewportHeight - rect.bottom - margin - gap;
  const above = rect.top - margin - gap;
  const upwards = below < 240 && above > below;
  const maxHeight = Math.max(0, Math.min(288, upwards ? above : below));
  return {
    width,
    left: Math.max(margin, Math.min(rect.left, viewportWidth - width - margin)),
    top: upwards ? undefined : Math.max(margin, rect.bottom + gap),
    bottom: upwards ? Math.max(margin, viewportHeight - rect.top + gap) : undefined,
    maxHeight,
  };
};

export const findEnabledOption = (options, current, direction) => {
  for (let step = 1; step <= options.length; step++) {
    const index = ((current + step * direction) % options.length + options.length) % options.length;
    if (!options[index].disabled) return index;
  }
  return -1;
};

export const findTypeaheadOption = (options, current, query) => {
  for (let step = 1; step <= options.length; step++) {
    const index = (current + step + options.length) % options.length;
    if (!options[index].disabled && String(options[index].label).toLowerCase().startsWith(query.toLowerCase())) return index;
  }
  return -1;
};
