import api from "./api";

// ============================================
// PUBLIC / CLIENT SERVICE APIs
// ============================================

/**
 * Get active services available to authenticated users.
 */
const getServices = async () => {
  const response = await api.get("/services");
  return response.data;
};

/**
 * Get public services.
 */
const getPublicServices = async () => {
  const response = await api.get("/services/public");
  return response.data;
};

/**
 * Get a single service by ID.
 */
const getServiceById = async (serviceId) => {
  const response = await api.get(`/services/${serviceId}`);
  return response.data;
};


// ============================================
// ADMIN SERVICE APIs
// ============================================

/**
 * Get all services for admin management.
 *
 * Includes active and inactive services.
 */
const getAdminServices = async () => {
  const response = await api.get("/services/admin");
  return response.data;
};

/**
 * Get a single service by ID for admin management.
 *
 * Includes the complete service configuration:
 * - Basic information
 * - Pricing
 * - Service fields
 * - Pricing options
 * - Pricing option fields
 */
const getAdminServiceById = async (serviceId) => {
  const response = await api.get(`/services/admin/${serviceId}`);
  return response.data;
};

/**
 * Create a new service.
 */
const createService = async (serviceData) => {
  const response = await api.post("/services/admin", serviceData);
  return response.data;
};

/**
 * Update an existing service.
 */
const updateService = async (serviceId, serviceData) => {
  const response = await api.patch(
    `/services/admin/${serviceId}`,
    serviceData
  );

  return response.data;
};

/**
 * Toggle service active/inactive status.
 */
const toggleServiceStatus = async (serviceId) => {
  const response = await api.patch(
    `/services/admin/${serviceId}/toggle`
  );

  return response.data;
};


// ============================================
// SERVICE
// ============================================

const serviceService = {
  // Existing client/public methods
  getServices,
  getPublicServices,
  getServiceById,

  // Admin methods
  getAdminServices,
  getAdminServiceById,
  createService,
  updateService,
  toggleServiceStatus,
};

export default serviceService;