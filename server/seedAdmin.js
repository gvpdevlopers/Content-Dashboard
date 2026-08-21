const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const User = require("./models/User");

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = await User.create({
      name: "Glow Ventures Admin",
      username: "admin",
      email: "admin@glowventures.com",
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("Admin created successfully.");
    console.log(`Username: ${admin.username}`);
    console.log("Password: Admin@123");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();