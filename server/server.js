const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const codRoutes = require("./routes/codRoutes");

const connectDB = require("./config/db");

connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Content Dashboard API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/cod", codRoutes);

console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
console.log(
  "Razorpay Secret Loaded:",
  process.env.RAZORPAY_KEY_SECRET ? "YES" : "NO"
);
console.log(
  "Razorpay Secret Length:",
  process.env.RAZORPAY_KEY_SECRET?.length
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});