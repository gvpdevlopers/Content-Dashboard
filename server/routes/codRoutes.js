const express = require("express");

const {
  generateCodPin,
  verifyCodPin,
  getPinEmployees,
  getAssignedPins,
  disableCodPin,
} = require("../controllers/codController");

const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const orderStaff = require("../middleware/orderStaff");

const router = express.Router();
router.get("/employees", protect, adminOnly, getPinEmployees);
router.get("/assigned", protect, orderStaff, getAssignedPins);
router.post("/disable", protect, adminOnly, disableCodPin);

router.post(
  "/generate",
  protect,
  adminOnly,
  generateCodPin
);

router.post(
  "/verify",
  protect,
  verifyCodPin
);

module.exports = router;
