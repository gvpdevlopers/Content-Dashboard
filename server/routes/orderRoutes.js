const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateAdminNotes,
  getAdminCodOrders,
} = require("../controllers/orderController");

const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
| Keep these BEFORE /:id
|--------------------------------------------------------------------------
*/

router.get(
  "/admin",
  protect,
  adminOnly,
  getAdminOrders
);

router.get(
  "/admin/cod",
  protect,
  adminOnly,
  getAdminCodOrders
);

router.get(
  "/admin/:id",
  protect,
  adminOnly,
  getAdminOrderById
);

router.patch(
  "/admin/:id/status",
  protect,
  adminOnly,
  updateOrderStatus
);

router.patch(
  "/admin/:id/payment-status",
  protect,
  adminOnly,
  updatePaymentStatus
);

router.patch(
  "/admin/:id/notes",
  protect,
  adminOnly,
  updateAdminNotes
);

/*
|--------------------------------------------------------------------------
| Client Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  protect,
  getMyOrders
);

router.get(
  "/:id",
  protect,
  getOrderById
);

router.post(
  "/",
  protect,
  createOrder
);

module.exports = router;