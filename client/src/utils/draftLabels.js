export const formatDraftDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
    : "recently";
};

export const getDraftLabel = (draft) => {
  const title = String(draft.title || "").trim();
  const generated = /^Draft (\d{1,2})\/(\d{1,2})\/(\d{4})$/i.exec(title);
  if (title && !generated) return title;
  const date = draft.createdAt || (generated ? `${generated[3]}-${generated[2].padStart(2, "0")}-${generated[1].padStart(2, "0")}T00:00:00+05:30` : draft.updatedAt);
  const formatted = formatDraftDate(date);
  return formatted === "recently" ? "Saved draft" : `Draft ? ${formatted}`;
};
