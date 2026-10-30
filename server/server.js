const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const codRoutes = require("./routes/codRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const contactSubmissionRoutes = require("./routes/contactSubmissionRoutes");
const couponRoutes = require("./routes/couponRoutes");
const draftRoutes = require("./routes/draftRoutes");
const packageRoutes = require("./routes/packageRoutes");
const { getClientOrigins } = require("./utils/authSession");
const { activateDueScheduledServices } = require("./controllers/orderController");

const connectDB = require("./config/db");

connectDB();

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || getClientOrigins().includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
  })
);

// Signature verification must receive the exact bytes sent by Razorpay.
app.post("/api/payments/razorpay/webhook", express.raw({ type: "application/json" }),
  require("./controllers/paymentController").razorpayWebhook);
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
app.use("/api/users", adminUserRoutes);
app.use("/api/contact-submissions", contactSubmissionRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/drafts", draftRoutes);
app.use("/api/packages", packageRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  const activateScheduled = () => activateDueScheduledServices().catch((error) => {
    console.error("Scheduled service activation failed:", error.message);
  });
  activateScheduled();
  setInterval(activateScheduled, 60 * 1000).unref();
});
