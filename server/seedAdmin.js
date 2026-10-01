const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const User = require("./models/User");

dotenv.config();

const createOrUpdateAdmin = async () => {
  try {
    await connectDB();

    // Admin details from .env
    const name = process.env.ADMIN_NAME;
    const username = process.env.ADMIN_USERNAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !username || !email || !password) {
      throw new Error(
        "ADMIN_NAME, ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD are required in .env"
      );
    }

    const existingAdmin = await User.findOne({
      role: "admin",
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingAdmin) {
      existingAdmin.name = name;
      existingAdmin.username = username;
      existingAdmin.email = email;
      existingAdmin.password = hashedPassword;
      existingAdmin.isActive = true;

      await existingAdmin.save();

      console.log("Admin updated successfully.");
      console.log(`Name: ${existingAdmin.name}`);
      console.log(`Username: ${existingAdmin.username}`);
      console.log(`Email: ${existingAdmin.email}`);
    } else {
      const admin = await User.create({
        name,
        username,
        email,
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });

      console.log("Admin created successfully.");
      console.log(`Name: ${admin.name}`);
      console.log(`Username: ${admin.username}`);
      console.log(`Email: ${admin.email}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error creating/updating admin:", error.message);
    process.exit(1);
  }
};

createOrUpdateAdmin();