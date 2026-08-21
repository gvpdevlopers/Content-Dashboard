const Service = require("../models/Service");

const getActiveServices = async (req, res) => {
  try {
    const services = await Service.find({
      isActive: true,
    }).sort({
      name: 1,
    });

    return res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Get services error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch services.",
    });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Get service error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch service.",
    });
  }
};

module.exports = {
  getActiveServices,
  getServiceById,
};