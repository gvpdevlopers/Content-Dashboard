import api from "./api";

const createRazorpayOrder = async (orderId) => {
  const response = await api.post(
    "/payments/razorpay/create-order",
    {
      orderId,
    }
  );

  return response.data;
};

const verifyRazorpayPayment = async (paymentData) => {
  const response = await api.post(
    "/payments/razorpay/verify",
    paymentData
  );

  return response.data;
};

const paymentService = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};

export default paymentService;