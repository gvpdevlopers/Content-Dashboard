const express = require("express");

const {
  getPaymentPricing,
  getCouponQuote,
  createOrder,
  getMyOrders,
  getLatestMyOrder,
  getOrderById,
  getAdminOrders,
  getAdminOrderById,
  getStaffOrders,
  getStaffOrderById,
  updateServiceProgress,
  updateOrderStatus,
  updatePaymentStatus,
  updateDeliveryLink,
  updateInvoice,
  updateAdminNotes,
  getAdminCodOrders,
} = require("../controllers/orderController");

const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const orderStaff = require("../middleware/orderStaff");

const router = express.Router();

router.get(
  "/payment-pricing",
  protect,
  getPaymentPricing
);

router.post(
  "/coupon-quote",
  protect,
  getCouponQuote,
);

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
  "/admin/:id/items/:itemId/service-progress",
  protect,
  adminOnly,
  updateServiceProgress
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
  "/admin/:id/delivery",
  protect,
  adminOnly,
  updateDeliveryLink
);

router.patch(
  "/admin/:id/invoice",
  protect,
  adminOnly,
  updateInvoice
);

router.patch(
  "/admin/:id/notes",
  protect,
  adminOnly,
  updateAdminNotes
);

/*
|--------------------------------------------------------------------------
| Employee order operations
|--------------------------------------------------------------------------
| Employees can process orders, but cannot access admin notes or COD tools.
|--------------------------------------------------------------------------
*/

router.get(
  "/staff",
  protect,
  orderStaff,
  getStaffOrders
);

router.get(
  "/staff/:id",
  protect,
  orderStaff,
  getStaffOrderById
);

router.patch(
  "/staff/:id/items/:itemId/service-progress",
  protect,
  orderStaff,
  updateServiceProgress
);

router.patch(
  "/staff/:id/status",
  protect,
  orderStaff,
  updateOrderStatus
);

router.patch(
  "/staff/:id/payment-status",
  protect,
  orderStaff,
  updatePaymentStatus
);

router.patch(
  "/staff/:id/delivery",
  protect,
  orderStaff,
  updateDeliveryLink
);

router.patch(
  "/staff/:id/invoice",
  protect,
  orderStaff,
  updateInvoice
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
  "/latest",
  protect,
  getLatestMyOrder
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