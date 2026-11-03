const { getCouponTargets } = require("../utils/couponTargets");
const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const Service = require("../models/Service");
const { getCouponQuote } = require("./orderController");

const normalizeCouponCode = (code) =>
  String(code || "")
    .trim()
    .toUpperCase();

const inputError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const validateCouponInput = async (body) => {
  const code = normalizeCouponCode(body.code);
  if (!/^[A-Z0-9_-]{2,40}$/.test(code)) {
    throw inputError(
      "Coupon code must be 2–40 characters using letters, numbers, hyphens, or underscores.",
    );
  }

  const scope = body.scope || "service";
  if (!["all", "service", "options"].includes(scope)) throw inputError("Invalid discount scope.");
  const parseDiscount = (entry) => {
    const discountType = entry.discountType || "percentage";
    const discountValue = Number(entry.discountValue ?? entry.discountPercent ?? 0);
    if (!["percentage", "fixed"].includes(discountType) || !Number.isFinite(discountValue) || discountValue < 0 || (discountType === "percentage" && discountValue > 100)) throw inputError("Enter a valid discount (percentage must be between 0 and 100).");
    return { discountType, discountValue };
  };
  const globalDiscount = parseDiscount(body);
  if (scope === "all" && globalDiscount.discountValue <= 0) throw inputError("Enter a discount greater than zero.");
  const rawDiscounts = scope === "all" ? [] : body.serviceDiscounts;
  if (!Array.isArray(rawDiscounts) || (scope !== "all" && rawDiscounts.length === 0)) {
    throw inputError("Configure at least one service discount.");
  }

  const seenServiceIds = new Set();
  const serviceDiscounts = [];
  for (const entry of rawDiscounts) {
    const serviceId = String(entry?.serviceId || "");
    const discount = parseDiscount(entry || {});
    const discountPercent = discount.discountType === "percentage" ? discount.discountValue : 0;
    if (!serviceId || !Number.isFinite(discountPercent) ||
        discountPercent < 0 || discountPercent > 100) {
      throw inputError("Each service discount must be between 0% and 100%.");
    }
    if (seenServiceIds.has(serviceId)) {
      throw inputError("A service can only be configured once.");
    }
    seenServiceIds.add(serviceId);
    const targets = scope === "options" ? entry.targets : [];
    if (!Array.isArray(targets) || (scope === "options" && targets.length === 0) || targets.some(t => typeof t !== "string") || new Set(targets).size !== targets.length) throw inputError("Select unique service options for each configured service.");
    serviceDiscounts.push({ serviceId, discountPercent, ...discount, targets });
  }

  const services = await Service.find({
    _id: { $in: serviceDiscounts.map((entry) => entry.serviceId) },
  }).select("_id name slug fields pricingOptions repeatableGroups isActive");
  const servicesById = new Map(
    services.map((service) => [String(service._id), service]),
  );
  if (servicesById.size !== serviceDiscounts.length) {
    throw inputError("One or more selected services could not be found.");
  }

  for (const entry of serviceDiscounts) {
    const service = servicesById.get(entry.serviceId);
    const valid = new Set(getCouponTargets(service).map(t => t.key));
    if (entry.targets.some(target => !valid.has(target))) throw inputError("A selected option is inactive, deleted, or does not belong to this service. Review the coupon targets.");
  }

  const parseOptionalLimit = (value, label) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw inputError(`${label} must be a positive whole number.`);
    }
    return parsed;
  };

  const minimumOrderAmount = Number(body.minimumOrderAmount ?? 0);
  if (!Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0) {
    throw inputError("Minimum order amount must be zero or greater.");
  }

  let expiresAt = null;
  if (body.expiresAt) {
    expiresAt = new Date(body.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      throw inputError("Expiry date is invalid.");
    }
  }

  return {
    code,
    scope,
    ...globalDiscount,
    serviceDiscounts: serviceDiscounts.map((entry) => ({
      ...entry,
      serviceName: servicesById.get(entry.serviceId).name,
    })),
    expiresAt,
    totalUsageLimit: parseOptionalLimit(body.totalUsageLimit, "Total usage limit"),
    perClientUsageLimit: parseOptionalLimit(
      body.perClientUsageLimit,
      "Per-client usage limit",
    ),
    minimumOrderAmount,
    isActive: body.isActive !== false,
  };
};

const handleAdminError = (res, error, message) => {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A coupon with this code already exists.",
    });
  }
  if (
    error.statusCode ||
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || message,
    });
  }
  console.error(message, error);
  return res.status(500).json({ success: false, message });
};

const listCoupons = async (_req, res) => {
  try {
    const coupons = await Coupon.find({})
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error("List coupons error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load coupons.",
    });
  }
};

const createCoupon = async (req, res) => {
  try {
    const couponData = await validateCouponInput(req.body || {});
    const coupon = await Coupon.create(couponData);
    return res.status(201).json({
      success: true,
      message: "Coupon created.",
      coupon,
    });
  } catch (error) {
    return handleAdminError(res, error, "Unable to create coupon.");
  }
};

const updateCoupon = async (req, res) => {
  try {
    const couponData = await validateCouponInput(req.body || {});
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: couponData },
      { returnDocument: "after", runValidators: true },
    );
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Coupon updated.",
      coupon,
    });
  } catch (error) {
    return handleAdminError(res, error, "Unable to update coupon.");
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    const hasRedemptions =
      coupon.usageCount > 0 ||
      (await CouponUsage.exists({ coupon: coupon._id }));
    if (hasRedemptions) {
      return res.status(409).json({
        success: false,
        message:
          "This coupon has been used and cannot be deleted. Deactivate it instead.",
      });
    }

    await coupon.deleteOne();
    return res.status(200).json({
      success: true,
      message: "Coupon deleted.",
    });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete coupon.",
    });
  }
};

const getCouponUsages = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id).select("_id code");
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    const usages = await CouponUsage.find({ coupon: coupon._id })
      .populate("client", "name email username")
      .populate("order", "orderNumber amount createdAt")
      .sort({ redeemedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      usages: usages.filter((usage) => usage.order),
    });
  } catch (error) {
    console.error("Get coupon usages error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load coupon usage.",
    });
  }
};

const validateCheckoutCoupon = (req, res) => getCouponQuote(req, res);

const listCouponTargets = async (_req, res) => {
  try {
    const services = await Service.find({}).lean();
    return res.json({ success: true, services: services.map(service => ({ ...service, couponTargets: getCouponTargets(service) })) });
  } catch (error) { return handleAdminError(res, error, "Unable to load coupon options."); }
};

module.exports = {
  validateCouponInput,
  listCouponTargets,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsages,
  validateCheckoutCoupon,
};
