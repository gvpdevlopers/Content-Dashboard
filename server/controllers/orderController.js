const Order = require("../models/Order");
const Service = require("../models/Service");
const generateOrderNumber = require("../utils/generateOrderNumber");

const validateFieldValue = (field, value) => {
  // Required field
  if (
    field.required &&
    (value === undefined ||
      value === null ||
      String(value).trim() === "")
  ) {
    return `${field.label} is required.`;
  }

  // Optional empty field
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  switch (field.type) {
    case "number": {
      const numberValue = Number(value);

      if (Number.isNaN(numberValue)) {
        return `${field.label} must be a valid number.`;
      }

      if (
        field.min !== undefined &&
        numberValue < field.min
      ) {
        return `${field.label} must be at least ${field.min}.`;
      }

      if (
        field.max !== undefined &&
        numberValue > field.max
      ) {
        return `${field.label} must not exceed ${field.max}.`;
      }

      break;
    }

    case "select":
    case "radio": {
      const allowedValues = (field.options || []).map(
        (option) => option.value
      );

      if (!allowedValues.includes(value)) {
        return `${field.label} has an invalid selection.`;
      }

      break;
    }

    case "url": {
      try {
        new URL(value);
      } catch {
        return `${field.label} must be a valid URL.`;
      }

      break;
    }

    case "date": {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return `${field.label} must be a valid date.`;
      }

      break;
    }

    default:
      break;
  }

  return null;
};

const validateFormData = (serviceFields, formData) => {
  const errors = {};

  for (const field of serviceFields) {
    const value = formData[field.name];
    const error = validateFieldValue(field, value);

    if (error) {
      errors[field.name] = error;
    }
  }

  return errors;
};

const calculateOrderAmount = (service, formData) => {
  const quantity = Number(formData.quantity || 1);

  if (service.pricingType === "fixed") {
    return service.basePrice;
  }

  if (service.pricingType === "starting_from") {
    return service.basePrice * quantity;
  }

  // Custom pricing will be handled by admin later.
  return service.basePrice;
};

/*
|--------------------------------------------------------------------------
| Create Order
|--------------------------------------------------------------------------
*/

const createOrder = async (req, res) => {
  try {
    const {
      serviceId,
      formData = {},
      paymentMethod,
    } = req.body;

    // 1. Basic request validation
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "Service is required.",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required.",
      });
    }

    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    // 2. Find active service
    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Selected service is not available.",
      });
    }

    // 3. Validate dynamic fields
    const validationErrors = validateFormData(
      service.fields,
      formData
    );

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please correct the form fields.",
        errors: validationErrors,
      });
    }

    // 4. Keep only known fields
    const cleanFormData = {};

    for (const field of service.fields) {
      if (
        formData[field.name] !== undefined &&
        formData[field.name] !== null
      ) {
        cleanFormData[field.name] = formData[field.name];
      }
    }

    // 5. Calculate amount
    const amount = calculateOrderAmount(
      service,
      cleanFormData
    );

    // 6. Generate unique order number
    let orderNumber;
    let orderNumberExists = true;

    while (orderNumberExists) {
      orderNumber = generateOrderNumber();

      const existingOrder = await Order.findOne({
        orderNumber,
      });

      orderNumberExists = !!existingOrder;
    }

    // 7. Create order
    const order = await Order.create({
      orderNumber,

      // Client comes from authenticated JWT.
      client: req.user.userId,

      service: service._id,

      serviceSnapshot: {
        name: service.name,
        category: service.category,
      },

      formData: cleanFormData,

      amount,

      paymentMethod,

      paymentStatus: "pending",

      orderStatus: "pending",
    });

    // 8. Response
    return res.status(201).json({
      success: true,
      message: "Order created successfully.",

      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        service: order.serviceSnapshot,
        amount: order.amount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        formData: Object.fromEntries(order.formData),
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create order.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Client - Get My Orders
|--------------------------------------------------------------------------
*/

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      client: req.user.userId,
    })
      // Never expose COD PIN to client order listings.
      .select("-codPin")
      .populate("service", "name category")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Client - Get Single Order
|--------------------------------------------------------------------------
*/

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      client: req.user.userId,
    })
      // Never expose COD PIN to client.
      .select("-codPin")
      .populate("service", "name category");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Get All Orders
|--------------------------------------------------------------------------
*/

const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      // Security: never expose the actual COD PIN.
      .select("-codPin")
      .populate("client", "name email username")
      .populate("service", "name category")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get admin orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Get Single Order
|--------------------------------------------------------------------------
*/

const getAdminOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      // Security: never expose the actual COD PIN.
      .select("-codPin")
      .populate("client", "name email username")
      .populate("service", "name category");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get admin order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Update Order Status
|--------------------------------------------------------------------------
*/

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "processing",
      "in_progress",
      "completed",
      "cancelled",
    ];

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Order status is required.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.orderStatus = status;

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .select("-codPin")
      .populate("client", "name email username")
      .populate("service", "name category");

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update order status.",
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const allowedStatuses = [
      "pending",
      "processing",
      "paid",
      "failed",
      "collected",
    ];

    if (!paymentStatus || !allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    /*
     * COD protection:
     * COD payment must be completed through the COD PIN flow.
     * Admin should not manually mark a COD order as collected.
     */
    if (
      order.paymentMethod === "cod" &&
      paymentStatus === "collected"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "COD payment must be completed through COD PIN verification.",
      });
    }

    /*
     * Prevent manually changing a successfully collected COD payment.
     */
    if (
      order.paymentMethod === "cod" &&
      order.paymentStatus === "collected"
    ) {
      return res.status(400).json({
        success: false,
        message: "COD payment has already been collected.",
      });
    }

    order.paymentStatus = paymentStatus;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error("Update payment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update payment status.",
    });
  }
};

const updateAdminNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    if (notes !== undefined && typeof notes !== "string") {
      return res.status(400).json({
        success: false,
        message: "Notes must be a string.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.notes = typeof notes === "string" ? notes.trim() : "";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Admin notes updated successfully.",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        notes: order.notes,
      },
    });
  } catch (error) {
    console.error("Update admin notes error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update admin notes.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Get All COD Orders
|--------------------------------------------------------------------------
*/

const getAdminCodOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      paymentMethod: "cod",
    })
      // Never expose the actual COD PIN.
      .select("-codPin")
      .populate("client", "name email username")
      .populate("service", "name category")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get admin COD orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch COD orders.",
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateAdminNotes,
  getAdminCodOrders,
};