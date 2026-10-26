export const validResourceUrl = (value) => {
  if (typeof value !== "string" || !value.trim() || /\s/.test(value.trim())) return "";
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
};
export const hasProjectDetails = (value) => typeof value === "string" && Boolean(value.trim());
