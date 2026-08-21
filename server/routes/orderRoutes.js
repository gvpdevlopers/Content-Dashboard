const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAdminCodOrders,
} = require("../controllers/orderController");

const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const router = express.Router();

router.get("/", protect, getMyOrders);

router.get(
  "/admin/cod",
  protect,
  adminOnly,
  getAdminCodOrders
);

router.get("/:id", protect, getOrderById);

router.post("/", protect, createOrder);

module.exports = router;