const AUTH_COOKIE_NAME = "content_dashboard_session";
const AUTH_SESSION_MAX_AGE = 15 * 24 * 60 * 60 * 1000;

const getClientOrigins = () =>
  String(process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => new URL(value).origin);

const getAuthCookieOptions = () => {
  const configuredSameSite = String(
    process.env.AUTH_COOKIE_SAME_SITE || "lax",
  ).toLowerCase();
  const sameSite = ["strict", "lax", "none"].includes(configuredSameSite)
    ? configuredSameSite
    : "lax";

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    sameSite,
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE,
  };
};

module.exports = {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE,
  getAuthCookieOptions,
  getClientOrigins,
};
