import api from "./api";

const getAdminOrders = async () => {
  const response = await api.get("/orders/admin");
  return response.data;
};

const getAdminOrderById = async (orderId) => {
  const response = await api.get(
    `/orders/admin/${orderId}`
  );

  return response.data;
};

const updateOrderStatus = async (orderId, status) => {
  const response = await api.patch(
    `/orders/admin/${orderId}/status`,
    {
      status,
    }
  );

  return response.data;
};

const updatePaymentStatus = async (
  orderId,
  paymentStatus
) => {
  const response = await api.patch(
    `/orders/admin/${orderId}/payment-status`,
    {
      paymentStatus,
    }
  );

  return response.data;
};

const updateAdminNotes = async (orderId, notes) => {
  const response = await api.patch(
    `/orders/admin/${orderId}/notes`,
    {
      notes,
    }
  );

  return response.data;
};

const getAdminCodOrders = async () => {
  const response = await api.get(
    "/orders/admin/cod"
  );

  return response.data;
};

const adminOrderService = {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateAdminNotes,
  getAdminCodOrders,
};

export default adminOrderService;