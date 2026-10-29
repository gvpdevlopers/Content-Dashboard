const { validateServiceAccess } = require("../utils/validateServiceAccess");
const User = require("../models/User");
const Order = require("../models/Order");
const bcrypt = require("bcryptjs");

// GET /api/users/admin
const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users.",
    });
  }
};

// GET /api/users/admin/:id
const getAdminUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get admin user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user.",
    });
  }
};

// PATCH /api/users/admin/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent accidentally deactivating an admin account
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin accounts cannot be deactivated here.",
      });
    }

    await User.updateOne({ _id: user._id }, {
      $set: { isActive },
      ...(!isActive ? { $inc: { tokenVersion: 1 } } : {}),
    });
    user.isActive = isActive;

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully."
        : "User deactivated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        allowMonthEndPayment: user.allowMonthEndPayment === true,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user status.",
    });
  }
};

// DELETE /api/users/admin/:id
const deleteAdminUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (String(user._id) === String(req.user?._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin accounts cannot be deleted here.",
      });
    }

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
      userId: String(user._id),
    });
  } catch (error) {
    console.error("Delete admin user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete user.",
    });
  }
};

// PATCH /api/users/admin/:id/password
const resetAdminUserPassword = async (req, res) => {
  try {
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.updateOne({ _id: user._id }, {
      $set: { password: passwordHash },
      $inc: { tokenVersion: 1 },
    });

    return res.status(200).json({
      success: true,
      message: "User password reset successfully.",
    });
  } catch (error) {
    console.error("Reset admin user password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset user password.",
    });
  }
};

// GET /api/users/admin/:id/orders
const getAdminUserOrders = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("_id name email username role isActive");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const orders = await Order.find({
      client: user._id,
    })
      .select("-codPin")
      .populate("service", "name category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get admin user orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user orders.",
    });
  }
};

// POST /api/users
const createAdminUser = async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      password,
      role = "client",
      allowMonthEndPayment = false,
    } = req.body;

    if (typeof allowMonthEndPayment !== "boolean" ||
        (allowMonthEndPayment && role !== "client")) {
      return res.status(400).json({ success: false,
        message: "Pay on Month-End must be a boolean and can only be enabled for clients." });
    }

    // Validate required fields
    if (!name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, username and password are required.",
      });
    }

    // Validate role
    if (!["client", "employee", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role.",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Normalize values
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    // Check duplicate email
    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    // Check duplicate username
    const existingUsername = await User.findOne({
      username: normalizedUsername,
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken.",
      });
    }

    if (req.body.serviceAccess !== undefined && role !== "client") {
      return res.status(400).json({ success: false, message: "Service access applies only to clients." });
    }
    const serviceAccess = role === "client" ? await validateServiceAccess(req.body.serviceAccess === undefined ? { mode: "groups", groups: ["content"], serviceIds: [] } : req.body.serviceAccess) : undefined;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      username: normalizedUsername,
      password: hashedPassword,
      role,
      allowMonthEndPayment,
      ...(serviceAccess ? { serviceAccess } : {}),
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        allowMonthEndPayment: user.allowMonthEndPayment === true,
        ...(user.role === "client" ? { serviceAccess: user.serviceAccess } : {}),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error("Create admin user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create user.",
    });
  }
};

const updateMonthEndPermission = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }
    const { allowMonthEndPayment } = req.body || {};
    if (typeof allowMonthEndPayment !== "boolean") {
      return res.status(400).json({ success: false, message: "allowMonthEndPayment must be a boolean." });
    }
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "client" },
      { $set: { allowMonthEndPayment } },
      { returnDocument: "after", runValidators: true },
    ).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }
    return res.json({ success: true, message: "Payment permission updated.", user });
  } catch (error) {
    console.error("Update month-end permission error:", error);
    return res.status(500).json({ success: false, message: "Unable to update payment permission." });
  }
};

const updateServiceAccess = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required." });
    const serviceAccess = await validateServiceAccess(req.body?.serviceAccess);
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "client" },
      { $set: { serviceAccess } },
      { returnDocument: "after", runValidators: true },
    ).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "Client not found." });
    return res.json({ success: true, message: "Service access updated.", user });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false,
      message: error.statusCode ? error.message : "Unable to update service access." });
  }
};

module.exports = {
  updateServiceAccess,
  updateMonthEndPermission,
  getAdminUsers,
  getAdminUserById,
  updateUserStatus,
  deleteAdminUser,
  resetAdminUserPassword,
  getAdminUserOrders,
  createAdminUser,
};
