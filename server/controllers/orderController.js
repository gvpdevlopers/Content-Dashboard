const Order = require("../models/Order");
const Service = require("../models/Service");
const generateOrderNumber = require("../utils/generateOrderNumber");

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Check whether a value should be treated as empty.
 */
const isEmptyValue = (value) => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
};

/**
 * Validate one dynamic service field.
 */
const validateFieldValue = (field, value) => {
  /*
   * Checkbox fields can legitimately be false.
   * Therefore false must NOT be treated as empty.
   */
  if (field.type === "checkbox") {
    if (field.required && value !== true) {
      return `${field.label} is required.`;
    }

    if (value !== true && value !== false) {
      return `${field.label} must be selected or deselected.`;
    }

    return null;
  }

  if (field.required && isEmptyValue(value)) {
    return `${field.label} is required.`;
  }

  // Optional empty field is valid.
  if (isEmptyValue(value)) {
    return null;
  }

  switch (field.type) {
    case "number": {
      const numberValue = Number(value);

      if (!Number.isFinite(numberValue)) {
        return `${field.label} must be a valid number.`;
      }

      if (
        field.min !== undefined &&
        field.min !== null &&
        numberValue < field.min
      ) {
        return `${field.label} must be at least ${field.min}.`;
      }

      if (
        field.max !== undefined &&
        field.max !== null &&
        numberValue > field.max
      ) {
        return `${field.label} must not exceed ${field.max}.`;
      }

      if (
        field.step !== undefined &&
        field.step !== null &&
        field.step > 0
      ) {
        const remainder = numberValue % field.step;

        if (Math.abs(remainder) > 0.000001) {
          return `${field.label} must use increments of ${field.step}.`;
        }
      }

      break;
    }

    case "select":
    case "radio": {
      const allowedValues = (field.options || []).map(
        (option) => option.value
      );

      if (!allowedValues.includes(String(value))) {
        return `${field.label} has an invalid selection.`;
      }

      break;
    }

    case "url": {
      try {
        const url = new URL(String(value));

        if (!["http:", "https:"].includes(url.protocol)) {
          return `${field.label} must be a valid URL.`;
        }
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

/**
 * Validate dynamic fields.
 */
const validateFormData = (serviceFields = [], formData = {}) => {
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

/**
 * Keep only fields configured by the service/pricing option.
 */
const cleanFormData = (serviceFields = [], formData = {}) => {
  const cleaned = {};

  for (const field of serviceFields) {
    if (
      formData[field.name] !== undefined &&
      formData[field.name] !== null
    ) {
      cleaned[field.name] = formData[field.name];
    }
  }

  return cleaned;
};

/**
 * Merge service fields + pricing-option fields.
 *
 * If the same field name exists in both places,
 * the pricing-option field takes precedence.
 */
const getApplicableFields = (service, pricingOption = null) => {
  const fields = new Map();

  for (const field of service.fields || []) {
    fields.set(field.name, field);
  }

  for (const field of pricingOption?.fields || []) {
    fields.set(field.name, field);
  }

  return Array.from(fields.values()).sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );
};

/**
 * Validate and normalize quantity.
 */
const validateQuantity = (quantity) => {
  const parsedQuantity = Number(quantity);

  if (
    !Number.isFinite(parsedQuantity) ||
    !Number.isInteger(parsedQuantity) ||
    parsedQuantity < 1
  ) {
    return null;
  }

  return parsedQuantity;
};

/*
|--------------------------------------------------------------------------
| Visual Content Pricing
|--------------------------------------------------------------------------
*/

/**
 * Find Visual Content pricing option by group/value.
 *
 * The seed file will define pricing options using groups such as:
 *
 * group: "shoot"
 * group: "drone"
 * group: "host"
 *
 * and names/values that correspond to the selected formData.
 */
const findVisualContentOption = (
  service,
  group,
  value
) => {
  if (!value) {
    return null;
  }

  if (!Array.isArray(service.pricingOptions)) {
    return null;
  }

  return (
    service.pricingOptions.find(
      (option) =>
        option.isActive &&
        option.group === group &&
        (
          option.value === value ||
          option.name.toLowerCase() ===
            String(value).toLowerCase()
        )
    ) || null
  );
};

/**
 * Find a Visual Content pricing option by group.
 *
 * Used for boolean selections such as Drone.
 */
const findVisualContentBooleanOption = (
  service,
  group
) => {
  if (!Array.isArray(service.pricingOptions)) {
    return null;
  }

  return (
    service.pricingOptions.find(
      (option) =>
        option.isActive &&
        option.group === group
    ) || null
  );
};

/**
 * Resolve all selected Visual Content pricing options.
 *
 * Expected formData:
 *
 * {
 *   shoot: "iphone",
 *   drone: true,
 *   host: "exclusive"
 * }
 */
const getVisualContentSelections = (
  service,
  formData
) => {
  const errors = [];
  const selectedOptions = [];

  /*
   * ------------------------------------------------------
   * Shoot - REQUIRED - exactly ONE
   * ------------------------------------------------------
   */

  const shoot = formData.shoot;

  if (isEmptyValue(shoot)) {
    errors.push("Shoot selection is required.");
  } else {
    const shootOption = findVisualContentOption(
      service,
      "shoot",
      shoot
    );

    if (!shootOption) {
      errors.push("Invalid shoot selection.");
    } else {
      selectedOptions.push(shootOption);
    }
  }

  /*
   * ------------------------------------------------------
   * Drone - OPTIONAL
   * ------------------------------------------------------
   */

  const drone = formData.drone;

  if (drone !== undefined && drone !== null) {
    if (typeof drone !== "boolean") {
      errors.push(
        "Drone selection must be true or false."
      );
    } else if (drone === true) {
      const droneOption =
        findVisualContentBooleanOption(
          service,
          "drone"
        );

      if (!droneOption) {
        errors.push(
          "Drone pricing option is not available."
        );
      } else {
        selectedOptions.push(droneOption);
      }
    }
  }

  /*
   * ------------------------------------------------------
   * Host - OPTIONAL - exactly ONE if selected
   * ------------------------------------------------------
   */

  const host = formData.host;

  if (!isEmptyValue(host)) {
    const hostOption = findVisualContentOption(
      service,
      "host",
      host
    );

    if (!hostOption) {
      errors.push("Invalid host selection.");
    } else {
      selectedOptions.push(hostOption);
    }
  }

  return {
    errors,
    selectedOptions,
  };
};

/**
 * Calculate Visual Content amount.
 *
 * Each selected component contributes its own price.
 *
 * Example:
 *
 * Camera     = 3000
 * Drone      = 3500
 * Local Host = 2800
 *
 * Total per reel = 9300
 *
 * 5 reels = 46500
 */
const calculateVisualContentAmount = ({
  selectedOptions,
  quantity,
}) => {
  const pricePerUnit = selectedOptions.reduce(
    (total, option) => {
      return total + Number(option.price || 0);
    },
    0
  );

  return pricePerUnit * quantity;
};

/*
|--------------------------------------------------------------------------
| Existing Pricing Helpers
|--------------------------------------------------------------------------
*/

/**
 * Find an active pricing option.
 *
 * Kept for existing/non-Visual-Content services.
 */
const findPricingOption = (
  service,
  pricingOptionId
) => {
  if (!pricingOptionId) {
    return null;
  }

  if (!Array.isArray(service.pricingOptions)) {
    return null;
  }

  return (
    service.pricingOptions.find(
      (option) =>
        option._id.toString() ===
          pricingOptionId.toString() &&
        option.isActive
    ) || null
  );
};

/**
 * Validate service/pricing option quantity rules.
 */
const validateQuantityRules = ({
  service,
  pricingOption,
  quantity,
}) => {
  const errors = [];

  const serviceMinQuantity =
    service.minQuantity || 1;

  if (quantity < serviceMinQuantity) {
    errors.push(
      `Minimum quantity for this service is ${serviceMinQuantity}.`
    );
  }

  if (
    service.maxQuantity !== undefined &&
    service.maxQuantity !== null &&
    quantity > service.maxQuantity
  ) {
    errors.push(
      `Maximum quantity for this service is ${service.maxQuantity}.`
    );
  }

  if (pricingOption) {
    const optionMinQuantity =
      pricingOption.minQuantity || 1;

    if (quantity < optionMinQuantity) {
      errors.push(
        `Minimum quantity for ${pricingOption.name} is ${optionMinQuantity}.`
      );
    }

    if (
      pricingOption.maxQuantity !== undefined &&
      pricingOption.maxQuantity !== null &&
      quantity > pricingOption.maxQuantity
    ) {
      errors.push(
        `Maximum quantity for ${pricingOption.name} is ${pricingOption.maxQuantity}.`
      );
    }
  }

  return errors;
};

/**
 * Calculate the order amount on the SERVER.
 *
 * The frontend amount must never be trusted.
 */
const calculateOrderAmount = ({
  service,
  pricingOption,
  quantity,
}) => {
  /*
   * Visual Content uses multiple independent
   * pricing components.
   */
  if (
    service.slug === "visual-content-reels"
  ) {
    return service.basePrice;
  }

  /*
   * Existing pricing-option behaviour.
   */
  if (pricingOption) {
    return pricingOption.price * quantity;
  }

  switch (service.pricingType) {
    case "fixed":
      return service.basePrice;

    case "per_unit":
      return service.basePrice * quantity;

    case "starting_from":
      return service.basePrice * quantity;

    case "custom":
      return service.basePrice;

    default:
      return service.basePrice;
  }
};

/**
 * Create immutable service snapshot.
 */
const createServiceSnapshot = ({
  service,
  pricingOption,
  selectedOptions = [],
}) => {
  const snapshot = {
    name: service.name,
    category: service.category,
    description: service.description || "",
    pricingType: service.pricingType,
    basePrice: service.basePrice,
    unit: service.unit || "",
  };

  /*
   * Existing single pricing-option snapshot.
   */
  if (pricingOption) {
    snapshot.selectedOption = {
      id: pricingOption._id,
      name: pricingOption.name,
      description:
        pricingOption.description || "",
      price: pricingOption.price,
      unit: pricingOption.unit,
      minQuantity:
        pricingOption.minQuantity || 1,
    };
  }

  /*
   * New Visual Content snapshot.
   *
   * We intentionally keep the selected component
   * details inside the snapshot so historical orders
   * remain accurate even if admin pricing changes later.
   */
  if (selectedOptions.length > 0) {
    snapshot.selectedOptions =
      selectedOptions.map((option) => ({
        id: option._id,
        name: option.name,
        description:
          option.description || "",
        price: option.price,
        unit: option.unit,
        group: option.group || "",
      }));
  }

  return snapshot;
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
      pricingOptionId,
      quantity = 1,
      formData = {},
      additionalRequirements = "",
      paymentMethod,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | 1. Basic request validation
    |--------------------------------------------------------------------------
    */

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "Service is required.",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "Payment method is required.",
      });
    }

    if (
      !["cod", "online"].includes(paymentMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    if (
      formData === null ||
      typeof formData !== "object" ||
      Array.isArray(formData)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid form data.",
      });
    }

    if (
      additionalRequirements !== undefined &&
      additionalRequirements !== null &&
      typeof additionalRequirements !==
        "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Additional requirements must be a string.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Validate quantity
    |--------------------------------------------------------------------------
    */

    const parsedQuantity =
      validateQuantity(quantity);

    if (!parsedQuantity) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be a valid positive whole number.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Find active service
    |--------------------------------------------------------------------------
    */

    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message:
          "Selected service is not available.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Visual Content handling
    |--------------------------------------------------------------------------
    */

    const isVisualContent =
      service.slug ===
      "visual-content-reels";

    let pricingOption = null;
    let selectedOptions = [];

    if (isVisualContent) {
      /*
       * New Visual Content pricing model:
       *
       * Shoot  -> required, one selection
       * Drone  -> optional
       * Host   -> optional, one selection
       */

      const {
        errors,
        selectedOptions:
          resolvedOptions,
      } = getVisualContentSelections(
        service,
        formData
      );

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Please correct the visual content selections.",
          errors,
        });
      }

      selectedOptions = resolvedOptions;

      if (selectedOptions.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "At least one visual content option is required.",
        });
      }
    } else {
      /*
       * Existing pricing-option flow for all
       * other services.
       */

      if (pricingOptionId) {
        pricingOption =
          findPricingOption(
            service,
            pricingOptionId
          );

        if (!pricingOption) {
          return res.status(400).json({
            success: false,
            message:
              "Selected pricing option is not available.",
          });
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Validate quantity rules
    |--------------------------------------------------------------------------
    */

    let quantityErrors = [];

    if (isVisualContent) {
      /*
       * Visual Content component prices are all
       * calculated per reel.
       *
       * The service itself controls the minimum.
       */
      quantityErrors =
        validateQuantityRules({
          service,
          pricingOption: null,
          quantity: parsedQuantity,
        });
    } else {
      quantityErrors =
        validateQuantityRules({
          service,
          pricingOption,
          quantity: parsedQuantity,
        });
    }

    if (quantityErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: quantityErrors[0],
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Determine applicable fields
    |--------------------------------------------------------------------------
    */

    /*
     * For Visual Content, the fields are defined
     * directly on the service.
     */
    const serviceFields =
      service.fields || [];

    const optionFields =
      pricingOption?.fields || [];

    /*
     * For Visual Content we do not merge fields from
     * selected pricing components because the new
     * pricing components are selections, not separate
     * form configurations.
     */
    const applicableFields =
      isVisualContent
        ? serviceFields
        : getApplicableFields(
            service,
            pricingOption
          );

    /*
    |--------------------------------------------------------------------------
    | 7. Validate dynamic fields
    |--------------------------------------------------------------------------
    */

    const validationErrors =
      validateFormData(
        applicableFields,
        formData
      );

    if (
      Object.keys(validationErrors).length > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please correct the form fields.",
        errors: validationErrors,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 8. Clean form data
    |--------------------------------------------------------------------------
    */

    const cleanServiceFormData =
      cleanFormData(
        serviceFields,
        formData
      );

    const cleanOptionFormData =
      isVisualContent
        ? {}
        : cleanFormData(
            optionFields,
            formData
          );

    const cleanFormDataResult = {
      ...cleanServiceFormData,
      ...cleanOptionFormData,
    };

    /*
    |--------------------------------------------------------------------------
    | 9. Calculate amount server-side
    |--------------------------------------------------------------------------
    */

    let amount;

    if (isVisualContent) {
      amount =
        calculateVisualContentAmount({
          selectedOptions,
          quantity: parsedQuantity,
        });
    } else {
      amount =
        calculateOrderAmount({
          service,
          pricingOption,
          quantity: parsedQuantity,
        });
    }

    /*
    |--------------------------------------------------------------------------
    | 10. Generate unique order number
    |--------------------------------------------------------------------------
    */

    let orderNumber;
    let orderNumberExists = true;

    while (orderNumberExists) {
      orderNumber =
        generateOrderNumber();

      const existingOrder =
        await Order.findOne({
          orderNumber,
        });

      orderNumberExists =
        !!existingOrder;
    }

    /*
    |--------------------------------------------------------------------------
    | 11. Create service snapshot
    |--------------------------------------------------------------------------
    */

    const serviceSnapshot =
      createServiceSnapshot({
        service,
        pricingOption,
        selectedOptions,
      });

    /*
    |--------------------------------------------------------------------------
    | 12. Create order
    |--------------------------------------------------------------------------
    */

    const order = await Order.create({
      orderNumber,

      // Client comes from authenticated JWT.
      client: req.user.userId,

      service: service._id,

      serviceSnapshot,

      quantity: parsedQuantity,

      formData: cleanFormDataResult,

      additionalRequirements:
        typeof additionalRequirements ===
        "string"
          ? additionalRequirements.trim()
          : "",

      amount,

      paymentMethod,

      paymentStatus: "pending",

      orderStatus: "pending",
    });

    /*
    |--------------------------------------------------------------------------
    | 13. Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,
      message:
        "Order created successfully.",

      order: {
        id: order._id,
        orderNumber:
          order.orderNumber,
        service:
          order.serviceSnapshot,
        quantity:
          order.quantity,
        amount:
          order.amount,
        paymentMethod:
          order.paymentMethod,
        paymentStatus:
          order.paymentStatus,
        orderStatus:
          order.orderStatus,
        formData:
          Object.fromEntries(
            order.formData
          ),
        additionalRequirements:
          order.additionalRequirements,
        createdAt:
          order.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create order.",
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
      .select("-codPin")
      .populate(
        "service",
        "name category"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Get orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch orders.",
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
    const order =
      await Order.findOne({
        _id: req.params.id,
        client: req.user.userId,
      })
        .select("-codPin")
        .populate(
          "service",
          "name category"
        );

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
    console.error(
      "Get order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch order.",
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
      .select("-codPin")
      .populate(
        "client",
        "name email username"
      )
      .populate(
        "service",
        "name category"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Get admin orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch orders.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Get Single Order
|--------------------------------------------------------------------------
*/

const getAdminOrderById = async (
  req,
  res
) => {
  try {
    const order =
      await Order.findById(
        req.params.id
      )
        .select("-codPin")
        .populate(
          "client",
          "name email username"
        )
        .populate(
          "service",
          "name category"
        );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get admin order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch order.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Update Order Status
|--------------------------------------------------------------------------
*/

const updateOrderStatus = async (
  req,
  res
) => {
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
        message:
          "Order status is required.",
      });
    }

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status.",
      });
    }

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    order.orderStatus = status;

    await order.save();

    const updatedOrder =
      await Order.findById(
        order._id
      )
        .select("-codPin")
        .populate(
          "client",
          "name email username"
        )
        .populate(
          "service",
          "name category"
        );

    return res.status(200).json({
      success: true,
      message:
        "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update order status.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Update Payment Status
|--------------------------------------------------------------------------
*/

const updatePaymentStatus = async (
  req,
  res
) => {
  try {
    const { paymentStatus } =
      req.body;

    const allowedStatuses = [
      "pending",
      "processing",
      "paid",
      "failed",
      "collected",
    ];

    if (
      !paymentStatus ||
      !allowedStatuses.includes(
        paymentStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment status.",
      });
    }

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    /*
     * COD payment must go through
     * the COD verification flow.
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
     * Prevent changing an already
     * collected COD payment.
     */
    if (
      order.paymentMethod === "cod" &&
      order.paymentStatus ===
        "collected"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "COD payment has already been collected.",
      });
    }

    order.paymentStatus =
      paymentStatus;

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Payment status updated successfully.",
      order: {
        id: order._id,
        orderNumber:
          order.orderNumber,
        paymentMethod:
          order.paymentMethod,
        paymentStatus:
          order.paymentStatus,
        orderStatus:
          order.orderStatus,
      },
    });
  } catch (error) {
    console.error(
      "Update payment status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update payment status.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Update Notes
|--------------------------------------------------------------------------
*/

const updateAdminNotes = async (
  req,
  res
) => {
  try {
    const { notes } = req.body;

    if (
      notes !== undefined &&
      typeof notes !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Notes must be a string.",
      });
    }

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    order.notes =
      typeof notes === "string"
        ? notes.trim()
        : "";

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Admin notes updated successfully.",
      order: {
        id: order._id,
        orderNumber:
          order.orderNumber,
        notes: order.notes,
      },
    });
  } catch (error) {
    console.error(
      "Update admin notes error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update admin notes.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Get All COD Orders
|--------------------------------------------------------------------------
*/

const getAdminCodOrders = async (
  req,
  res
) => {
  try {
    const orders =
      await Order.find({
        paymentMethod: "cod",
      })
        .select("-codPin")
        .populate(
          "client",
          "name email username"
        )
        .populate(
          "service",
          "name category"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Get admin COD orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch COD orders.",
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