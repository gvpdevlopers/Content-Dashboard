const mongoose = require("mongoose");
const ContactSubmission = require("../models/ContactSubmission");

const CONTACT_SUBMISSION_STATUSES = [
  "new",
  "contacted",
  "in_progress",
  "converted",
  "closed",
];

const REQUIRED_LIMITS = {
  name: 120,
  email: 254,
  phone: 30,
  service: 100,
  message: 5000,
};

const OPTIONAL_LIMITS = {
  company: 160,
};

const getSubmissionInput = (body) => {
  const input = {};
  const values = { ...REQUIRED_LIMITS, ...OPTIONAL_LIMITS };

  for (const [field, maxLength] of Object.entries(values)) {
    const value = body[field];

    if (value === undefined && field === "company") {
      input.company = "";
      continue;
    }

    if (typeof value !== "string") {
      return {
        error: `${field} must be a string.`,
      };
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length > maxLength) {
      return {
        error: `${field} cannot exceed ${maxLength} characters.`,
      };
    }

    input[field] = trimmedValue;
  }

  for (const field of Object.keys(REQUIRED_LIMITS)) {
    if (!input[field]) {
      return {
        error: `${field} is required.`,
      };
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return {
      error: "Please provide a valid email address.",
    };
  }

  if (input.name.length < 2) {
    return {
      error: "name must be at least 2 characters.",
    };
  }

  if (!/^[+()\d\s-]{7,30}$/.test(input.phone)) {
    return {
      error: "Please provide a valid phone number.",
    };
  }

  if (input.message.length < 10) {
    return {
      error: "message must be at least 10 characters.",
    };
  }

  return { input };
};

const createContactSubmission = async (req, res) => {
  const { input, error } = getSubmissionInput(req.body || {});

  if (error) {
    return res.status(400).json({
      success: false,
      message: error,
    });
  }

  try {
    await ContactSubmission.create({
      ...input,
      status: "new",
    });

    return res.status(201).json({
      success: true,
      message: "Your enquiry has been submitted successfully.",
    });
  } catch (createError) {
    console.error("Create contact submission error:", createError);
    return res.status(500).json({
      success: false,
      message: "Unable to submit your enquiry.",
    });
  }
};

const getContactSubmissions = async (_req, res) => {
  try {
    const submissions = await ContactSubmission.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Get contact submissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch contact submissions.",
    });
  }
};

const getContactSubmissionById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid contact submission ID.",
    });
  }

  try {
    const submission = await ContactSubmission.findById(req.params.id).lean();

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found.",
      });
    }

    return res.status(200).json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error("Get contact submission error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch contact submission.",
    });
  }
};

const updateContactSubmissionStatus = async (req, res) => {
  const { status } = req.body || {};

  if (!CONTACT_SUBMISSION_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid contact submission status.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid contact submission ID.",
    });
  }

  try {
    const submission = await ContactSubmission.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact submission status updated.",
      submission,
    });
  } catch (error) {
    console.error("Update contact submission status error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update contact submission status.",
    });
  }
};

const deleteContactSubmission = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid contact submission ID.",
    });
  }

  try {
    const submission = await ContactSubmission.findByIdAndDelete(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact submission deleted.",
    });
  } catch (error) {
    console.error("Delete contact submission error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete contact submission.",
    });
  }
};

module.exports = {
  createContactSubmission,
  getContactSubmissions,
  getContactSubmissionById,
  updateContactSubmissionStatus,
  deleteContactSubmission,
};
