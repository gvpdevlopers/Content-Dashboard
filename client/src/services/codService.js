import api from "./api";

const getAdminCodOrders = async () => {
  const response = await api.get("/orders/admin/cod");

  return response.data;
};

const generateCodPin = async (orderId) => {
  const response = await api.post("/cod/generate", {
    orderId,
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
  getAdminCodOrders,
  generateCodPin,
  verifyCodPin,
};

export default codService;