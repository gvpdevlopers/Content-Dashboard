const express = require("express");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsages,
  validateCheckoutCoupon,
} = require("../controllers/couponController");

const router = express.Router();

router.post("/validate", protect, validateCheckoutCoupon);

router.use("/admin", protect, adminOnly);
router.get("/admin", listCoupons);
router.post("/admin", createCoupon);
router.patch("/admin/:id", updateCoupon);
router.delete("/admin/:id", deleteCoupon);
router.get("/admin/:id/usages", getCouponUsages);

module.exports = router;
