import api from "./api";

const listCoupons = async () => {
  const response = await api.get("/coupons/admin");
  return response.data;
};

const createCoupon = async (coupon) => {
  const response = await api.post("/coupons/admin", coupon);
  return response.data;
};

const updateCoupon = async (couponId, coupon) => {
  const response = await api.patch(`/coupons/admin/${couponId}`, coupon);
  return response.data;
};

const deleteCoupon = async (couponId) => {
  const response = await api.delete(`/coupons/admin/${couponId}`);
  return response.data;
};

const getCouponUsages = async (couponId) => {
  const response = await api.get(`/coupons/admin/${couponId}/usages`);
  return response.data;
};

const couponService = {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsages,
};

export default couponService;
