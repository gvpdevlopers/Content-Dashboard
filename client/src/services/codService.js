import api from "./api";

const getAdminCodOrders = async () => {
  const response = await api.get("/orders/admin/cod");

  return response.data;
};

const generateCodPin = async (orderId, employeeId) => {
  const response = await api.post("/cod/generate", {
    orderId,
    employeeId,
  });

  return response.data;
};

const verifyCodPin = async (orderId, pin) => {
  const response = await api.post("/cod/verify", {
    orderId,
    pin,
  });

  return response.data;
};

const codService = {
  disableCodPin: async (orderId) => (await api.post("/cod/disable", { orderId })).data,
  getEligibleEmployees: async () => (await api.get("/cod/employees")).data,
  getAssignedPins: async (orderId) => (await api.get("/cod/assigned", { params: orderId ? { orderId } : undefined })).data,
  getAdminCodOrders,
  generateCodPin,
  verifyCodPin,
};

export default codService;
