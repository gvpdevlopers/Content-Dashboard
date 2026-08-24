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

    user.isActive = isActive;

    await user.save();

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
    } = req.body;

    // Validate required fields
    if (!name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, username and password are required.",
      });
    }

    // Validate role
    if (!["client", "admin"].includes(role)) {
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      username: normalizedUsername,
      password: hashedPassword,
      role,
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
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Create admin user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create user.",
    });
  }
};

module.exports = {
  getAdminUsers,
  getAdminUserById,
  updateUserStatus,
  getAdminUserOrders,
  createAdminUser,
};