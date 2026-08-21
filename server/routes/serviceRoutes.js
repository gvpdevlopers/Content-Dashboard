const express = require("express");

const {
  getActiveServices,
  getServiceById,
} = require("../controllers/serviceController");

const protect = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getActiveServices);

router.get("/:id", protect, getServiceById);

module.exports = router;