const mongoose = require("mongoose");

const CONTACT_SUBMISSION_STATUSES = [
  "new",
  "contacted",
  "in_progress",
  "converted",
  "closed",
];

const contactSubmissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    company: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },
    service: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: CONTACT_SUBMISSION_STATUSES,
      default: "new",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "ContactSubmission",
  contactSubmissionSchema,
);
