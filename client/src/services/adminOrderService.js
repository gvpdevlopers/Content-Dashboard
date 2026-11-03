import api from "./api";

const getOrderRoot = (staffMode) =>
  staffMode ? "/orders/staff" : "/orders/admin";

const getAdminOrders = async (staffMode = false, archived = false) => {
  const response = await api.get(getOrderRoot(staffMode), { params: archived && !staffMode ? { archived: "true" } : {} });
  return response.data;
};

const getAdminOrderById = async (orderId, staffMode = false) => {
  const response = await api.get(
    `${getOrderRoot(staffMode)}/${orderId}`
  );

  return response.data;
};

const updateOrderStatus = async (orderId, status, staffMode = false) => {
  const response = await api.patch(
    `${getOrderRoot(staffMode)}/${orderId}/status`,
    {
      status,
    }
  );

  return response.data;
};

const updateServiceProgress = async (
  orderId,
  itemId,
  progressUpdate,
  staffMode = false,
) => {
  const response = await api.patch(
    `${getOrderRoot(staffMode)}/${orderId}/items/${itemId}/service-progress`,
    progressUpdate,
  );
  return response.data;
};

const updatePaymentStatus = async (
  orderId,
  paymentStatus,
  staffMode = false
) => {
  const response = await api.patch(
    `${getOrderRoot(staffMode)}/${orderId}/payment-status`,
    {
      paymentStatus,
    }
  );

  return response.data;
};

const updateDeliveryLink = async (orderId, deliveryLink, staffMode = false) => {
  const response = await api.patch(
    `${getOrderRoot(staffMode)}/${orderId}/delivery`,
    { deliveryLink },
  );
  return response.data;
};

const updateInvoice = async (orderId, invoice, staffMode = false) => {
  const response = await api.patch(
    `${getOrderRoot(staffMode)}/${orderId}/invoice`,
    invoice,
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

const updateServiceDelivery = async (orderId, itemId, url, staffMode = false) => {
  const response = await api.patch(`${getOrderRoot(staffMode)}/${orderId}/items/${itemId}/delivery`, { url });
  return response.data;
};

const adminOrderService = {
  updateDeliverable: async (orderId, itemId, key, changes, staffMode = false) =>
    (await api.patch(`${getOrderRoot(staffMode)}/${orderId}/items/${itemId}/deliverables/${encodeURIComponent(key)}`, changes)).data,
  archiveOrder: async (id, confirmation, confirmProtected) => (await api.delete(`/orders/admin/${id}`, { data: { confirmation, confirmProtected } })).data,
  restoreOrder: async id => (await api.post(`/orders/admin/${id}/restore`)).data,
  updateServiceDelivery,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  updateServiceProgress,
  updatePaymentStatus,
  updateDeliveryLink,
  updateInvoice,
  updateAdminNotes,
  getAdminCodOrders,
};

export default adminOrderService;