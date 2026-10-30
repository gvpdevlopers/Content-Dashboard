const express = require("express");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const { listAdminPackages, createPackage, updatePackage, deletePackage, listClientPackages, getClientPackage, eligibleClients, previewPackage } = require("../controllers/packageController");

const router = express.Router();
router.get("/", protect, (req, res, next) => req.user?.role === "client" ? listClientPackages(req, res, next) : res.status(403).json({ success: false, message: "Only clients can browse packages." }));
router.get("/admin", protect, adminOnly, listAdminPackages);
router.post("/admin/eligible-clients", protect, adminOnly, eligibleClients);
router.post("/admin/preview", protect, adminOnly, previewPackage);
router.post("/admin", protect, adminOnly, createPackage);
router.patch("/admin/:id", protect, adminOnly, updatePackage);
router.delete("/admin/:id", protect, adminOnly, deletePackage);
router.get("/:id", protect, (req, res, next) => req.user?.role === "client" ? getClientPackage(req, res, next) : res.status(403).json({ success: false, message: "Only clients can view packages." }));
module.exports = router;
