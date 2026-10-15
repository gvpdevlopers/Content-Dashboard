import api from "./api";

const getPaymentPricing = async () => {
  const response = await api.get("/orders/payment-pricing");

  return response.data;
};

const createOrder = async (orderData) => {
  const response = await api.post("/orders", orderData);

  return response.data;
};

const getMyOrders = async () => {
  const response = await api.get("/orders");

  return response.data;
};

const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);

  return response.data;
};

const orderService = {
  getPaymentPricing,
  createOrder,
  getMyOrders,
  getOrderById,
};

export default orderService;
