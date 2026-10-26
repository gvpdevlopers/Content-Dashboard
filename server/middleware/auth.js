const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AUTH_COOKIE_NAME, getClientOrigins } = require("../utils/authSession");

const getCookieToken = (req) => {
  const cookies = String(req.headers.cookie || "").split(";");
  const sessionCookie = cookies.find((cookie) =>
    cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`),
  );

  if (!sessionCookie) {
    return "";
  }

  return decodeURIComponent(
    sessionCookie.trim().slice(AUTH_COOKIE_NAME.length + 1),
  );
};

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : "";
    const cookieToken = getCookieToken(req);
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Session required.",
      });
    }

    if (!bearerToken && cookieToken && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const allowedOrigins = getClientOrigins();
      if (!req.get("origin") || !allowedOrigins.includes(req.get("origin"))) {
        return res.status(403).json({
          success: false,
          message: "Request origin is not allowed.",
        });
      }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || typeof decoded !== "object") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    const userId = decoded.userId || decoded._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User identity missing from token.",
      });
    }

    const user = await User.findById(userId).select(
      "_id role isActive tokenVersion allowMonthEndPayment",
    );

    if (
      !user ||
      !user.isActive ||
      Number(decoded.tokenVersion || 0) !== Number(user.tokenVersion || 0)
    ) {
      return res.status(401).json({
        success: false,
        message: "Session is invalid or the account is unavailable.",
      });
    }

    req.user = {
      ...decoded,
      _id: user._id,
      role: user.role,
      allowMonthEndPayment: user.role === "client" && user.allowMonthEndPayment === true,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = protect;