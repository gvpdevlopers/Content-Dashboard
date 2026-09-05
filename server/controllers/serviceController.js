const Service = require("../models/Service");

/*
|--------------------------------------------------------------------------
| Client - Get Active Services
|--------------------------------------------------------------------------
*/

const getActiveServices = async (req, res) => {
  try {
    const services = await Service.find({
      isActive: true,
    }).sort({
      displayOrder: 1,
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

/*
|--------------------------------------------------------------------------
| Client - Get Active Service By ID
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Admin - Get All Services
|--------------------------------------------------------------------------
*/

const getAdminServices = async (req, res) => {
  try {
    const services = await Service.find({})
      .sort({
        displayOrder: 1,
        name: 1,
      });

    return res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Get admin services error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch services.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Get Service By ID
|--------------------------------------------------------------------------
*/

const getAdminServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

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
    console.error("Get admin service error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch service.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Create Service
|--------------------------------------------------------------------------
*/

const createService = async (req, res) => {
  try {
    const {
      name,
      slug,
      category,
      description,
      pricingType,
      basePrice,
      unit,
      minQuantity,
      maxQuantity,
      pricingOptions,
      fields,
      isActive,
      displayOrder,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Basic validation
    |--------------------------------------------------------------------------
    */

    if (!name || !slug || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, slug and category are required.",
      });
    }

    if (
      basePrice === undefined ||
      basePrice === null ||
      Number.isNaN(Number(basePrice))
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid base price is required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check duplicate slug
    |--------------------------------------------------------------------------
    */

    const existingService = await Service.findOne({
      slug: String(slug).trim().toLowerCase(),
    });

    if (existingService) {
      return res.status(409).json({
        success: false,
        message: "A service with this slug already exists.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create service
    |--------------------------------------------------------------------------
    */

    const service = await Service.create({
      name: String(name).trim(),
      slug: String(slug).trim().toLowerCase(),
      category: String(category).trim(),
      description: description || "",
      pricingType: pricingType || "fixed",
      basePrice: Number(basePrice),
      unit: unit || "",
      minQuantity:
        minQuantity !== undefined
          ? Number(minQuantity)
          : 1,
      maxQuantity:
        maxQuantity !== undefined &&
        maxQuantity !== null &&
        maxQuantity !== ""
          ? Number(maxQuantity)
          : undefined,
      pricingOptions: Array.isArray(pricingOptions)
        ? pricingOptions
        : [],
      fields: Array.isArray(fields) ? fields : [],
      isActive:
        isActive !== undefined
          ? Boolean(isActive)
          : true,
      displayOrder:
        displayOrder !== undefined
          ? Number(displayOrder)
          : 0,
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully.",
      service,
    });
  } catch (error) {
    console.error("Create service error:", error);

    /*
     * Handle Mongo duplicate key error.
     */
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A service with this slug already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create service.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Update Service
|--------------------------------------------------------------------------
*/

const updateService = async (req, res) => {
  try {
    const {
      name,
      slug,
      category,
      description,
      pricingType,
      basePrice,
      unit,
      minQuantity,
      maxQuantity,
      pricingOptions,
      fields,
      isActive,
      displayOrder,
    } = req.body;

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check slug uniqueness
    |--------------------------------------------------------------------------
    */

    if (slug !== undefined) {
      const normalizedSlug = String(slug)
        .trim()
        .toLowerCase();

      const existingService = await Service.findOne({
        slug: normalizedSlug,
        _id: {
          $ne: service._id,
        },
      });

      if (existingService) {
        return res.status(409).json({
          success: false,
          message: "A service with this slug already exists.",
        });
      }

      service.slug = normalizedSlug;
    }

    /*
    |--------------------------------------------------------------------------
    | Update basic information
    |--------------------------------------------------------------------------
    */

    if (name !== undefined) {
      service.name = String(name).trim();
    }

    if (category !== undefined) {
      service.category = String(category).trim();
    }

    if (description !== undefined) {
      service.description = description;
    }

    /*
    |--------------------------------------------------------------------------
    | Update pricing
    |--------------------------------------------------------------------------
    */

    if (pricingType !== undefined) {
      service.pricingType = pricingType;
    }

    if (basePrice !== undefined) {
      const parsedBasePrice = Number(basePrice);

      if (
        Number.isNaN(parsedBasePrice) ||
        parsedBasePrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Base price must be a valid positive number.",
        });
      }

      service.basePrice = parsedBasePrice;
    }

    if (unit !== undefined) {
      service.unit = unit;
    }

    if (minQuantity !== undefined) {
      service.minQuantity = Number(minQuantity);
    }

    if (maxQuantity !== undefined) {
      service.maxQuantity =
        maxQuantity === null || maxQuantity === ""
          ? undefined
          : Number(maxQuantity);
    }

    /*
    |--------------------------------------------------------------------------
    | Update pricing options
    |--------------------------------------------------------------------------
    */

    if (pricingOptions !== undefined) {
      if (!Array.isArray(pricingOptions)) {
        return res.status(400).json({
          success: false,
          message: "Pricing options must be an array.",
        });
      }

      service.pricingOptions = pricingOptions;
    }

    /*
    |--------------------------------------------------------------------------
    | Update dynamic fields
    |--------------------------------------------------------------------------
    */

    if (fields !== undefined) {
      if (!Array.isArray(fields)) {
        return res.status(400).json({
          success: false,
          message: "Service fields must be an array.",
        });
      }

      service.fields = fields;
    }

    /*
    |--------------------------------------------------------------------------
    | Update status/order
    |--------------------------------------------------------------------------
    */

    if (isActive !== undefined) {
      service.isActive = Boolean(isActive);
    }

    if (displayOrder !== undefined) {
      service.displayOrder = Number(displayOrder);
    }

    await service.save();

    return res.status(200).json({
      success: true,
      message: "Service updated successfully.",
      service,
    });
  } catch (error) {
    console.error("Update service error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A service with this slug already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update service.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Toggle Service Status
|--------------------------------------------------------------------------
*/

const toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    service.isActive = !service.isActive;

    await service.save();

    return res.status(200).json({
      success: true,
      message: service.isActive
        ? "Service activated successfully."
        : "Service deactivated successfully.",
      service,
    });
  } catch (error) {
    console.error("Toggle service status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update service status.",
    });
  }
};

module.exports = {
  getActiveServices,
  getServiceById,

  getAdminServices,
  getAdminServiceById,
  createService,
  updateService,
  toggleServiceStatus,
};