const { normalizeServiceId } = require("../utils/serviceIdentity");
const Service = require("../models/Service");
const { canClientOrderService } = require("../utils/serviceAccess");
const mongoose = require("mongoose");
const OrderDraft = require("../models/OrderDraft");

const requestError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

const normalizeDraftInput = (body = {}) => {
  if (!Array.isArray(body.services) || body.services.length < 1 ||
      body.services.length > 50) {
    throw requestError("Select between 1 and 50 services to save a draft.");
  }

  const seenServices = new Set();
  const services = body.services.map((service) => {
    if (
      !service ||
      !normalizeServiceId(service.serviceId) ||
      !Number.isInteger(Number(service.quantity)) ||
      Number(service.quantity) < 1 ||
      !isPlainObject(service.formData || {})
    ) {
      throw requestError("A draft contains invalid service configuration.");
    }

    const serviceId = normalizeServiceId(service.serviceId);
    if (seenServices.has(serviceId)) {
      throw requestError("A service can only be included once in a draft.");
    }
    seenServices.add(serviceId);

    if (
      service.pricingOptionId &&
      !mongoose.Types.ObjectId.isValid(service.pricingOptionId)
    ) {
      throw requestError("A draft contains an invalid pricing option.");
    }

    return {
      serviceId,
      ...(service.pricingOptionId
        ? { pricingOptionId: String(service.pricingOptionId) }
        : {}),
      quantity: Number(service.quantity),
      formData: JSON.parse(JSON.stringify(service.formData || {})),
    };
  });

  const additionalRequirements = body.additionalRequirements || "";
  if (
    typeof additionalRequirements !== "string" ||
    additionalRequirements.length > 5000
  ) {
    throw requestError("Additional requirements must be 5000 characters or fewer.");
  }

  const couponCode = String(body.couponCode || "").trim().toUpperCase();
  if (couponCode && !/^[A-Z0-9_-]{2,40}$/.test(couponCode)) {
    throw requestError("Coupon code is invalid.");
  }

  return {
    title: String(body.title || "").trim().slice(0, 80),
    services,
    additionalRequirements,
    couponCode,
  };
};

const getDraftAccessIssues = async (services, user) => {
  const records = await Service.find({ _id: { $in: services.map((item) => item.serviceId) } });
  return services.flatMap((item) => {
    const service = records.find((record) => String(record._id) === String(item.serviceId));
    return canClientOrderService(user, service) ? [] : [{
      serviceId: String(item.serviceId), name: service?.name || String(item.serviceId),
      message: `${service?.name || item.serviceId} is unavailable for ordering. Review this draft before submitting.`,
    }];
  });
};
const validateDraftAccess = async (input, user) => {
  const issues = await getDraftAccessIssues(input.services, user);
  if (issues.length) throw requestError(issues.map((issue) => issue.message).join(" "));
  return input;
};

const handleDraftError = (res, error, logMessage) => {
  if (error.statusCode || error.name === "ValidationError" ||
      error.name === "CastError") {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }

  console.error(logMessage, error);
  return res.status(500).json({
    success: false,
    message: "Unable to process saved draft.",
  });
};

const listDrafts = async (req, res) => {
  try {
    const drafts = await OrderDraft.find({
      client: req.user._id,
      status: "active",
    }).sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, drafts });
  } catch (error) {
    return handleDraftError(res, error, "List drafts error:");
  }
};

const getDraft = async (req, res) => {
  try {
    const draft = await OrderDraft.findOne({
      _id: req.params.id,
      client: req.user._id,
      status: "active",
    });
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Saved draft not found.",
      });
    }

    return res.status(200).json({ success: true, draft, accessIssues: await getDraftAccessIssues(draft.services, req.user) });
  } catch (error) {
    return handleDraftError(res, error, "Get draft error:");
  }
};

const createDraft = async (req, res) => {
  try {
    const draft = await OrderDraft.create({
      client: req.user._id,
      ...await validateDraftAccess(normalizeDraftInput(req.body), req.user),
    });

    return res.status(201).json({
      success: true,
      message: "Draft saved.",
      draft,
    });
  } catch (error) {
    return handleDraftError(res, error, "Create draft error:");
  }
};

const updateDraft = async (req, res) => {
  try {
    const draft = await OrderDraft.findOneAndUpdate(
      {
        _id: req.params.id,
        client: req.user._id,
        status: "active",
      },
      { $set: await validateDraftAccess(normalizeDraftInput(req.body), req.user) },
      { returnDocument: "after", runValidators: true },
    );
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Saved draft not found or is no longer editable.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Draft updated.",
      draft,
    });
  } catch (error) {
    return handleDraftError(res, error, "Update draft error:");
  }
};

const deleteDraft = async (req, res) => {
  try {
    const draft = await OrderDraft.findOneAndDelete({
      _id: req.params.id,
      client: req.user._id,
      status: "active",
    });
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Saved draft not found or is no longer editable.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Draft deleted.",
    });
  } catch (error) {
    return handleDraftError(res, error, "Delete draft error:");
  }
};

module.exports = {
  listDrafts,
  getDraft,
  createDraft,
  updateDraft,
  deleteDraft,
};
