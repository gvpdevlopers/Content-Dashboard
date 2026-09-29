const express = require("express");

const {
  createContactSubmission,
  getContactSubmissions,
  getContactSubmissionById,
  updateContactSubmissionStatus,
  deleteContactSubmission,
} = require("../controllers/contactSubmissionController");

const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const router = express.Router();

router.post("/", createContactSubmission);

router.use(protect, adminOnly);

router.get("/", getContactSubmissions);
router.get("/:id", getContactSubmissionById);
router.patch("/:id/status", updateContactSubmissionStatus);
router.delete("/:id", deleteContactSubmission);

module.exports = router;
