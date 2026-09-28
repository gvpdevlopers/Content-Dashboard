const orderStaff = (req, res, next) => {
  if (!req.user || !["admin", "employee"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Order management access required.",
    });
  }

  next();
};

module.exports = orderStaff;
