import api from "./api";

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
  createOrder,
  getMyOrders,
  getOrderById,
};

export default orderService;
