const express = require("express");

const {
  createAdminUser,
  getAdminUsers,
  getAdminUserById,
  updateUserStatus,
  getAdminUserOrders,
} = require("../controllers/adminUserController");

const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const router = express.Router();

router.use(protect, adminOnly);

// Create user
router.post("/", createAdminUser);

// Get all users
router.get("/", getAdminUsers);

// Get single user
router.get("/:id", getAdminUserById);

// Update user status
router.patch("/:id/status", updateUserStatus);

// Get user's orders
router.get("/:id/orders", getAdminUserOrders);

module.exports = router;