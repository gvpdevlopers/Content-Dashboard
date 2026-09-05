const express = require("express");

const {
  getActiveServices,
  getServiceById,
  getAdminServices,
  getAdminServiceById,
  createService,
  updateService,
  toggleServiceStatus,
} = require("../controllers/serviceController");

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
  getAdminServices
);

router.get(
  "/admin/:id",
  protect,
  adminOnly,
  getAdminServiceById
);

router.post(
  "/admin",
  protect,
  adminOnly,
  createService
);

router.patch(
  "/admin/:id",
  protect,
  adminOnly,
  updateService
);

router.patch(
  "/admin/:id/toggle",
  protect,
  adminOnly,
  toggleServiceStatus
);

/*
|--------------------------------------------------------------------------
| Client Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  protect,
  getActiveServices
);

router.get(
  "/:id",
  protect,
  getServiceById
);

module.exports = router;