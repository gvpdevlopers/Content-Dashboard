const express = require("express");

const {
  generateCodPin,
  verifyCodPin,
} = require("../controllers/codController");

const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const router = express.Router();

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