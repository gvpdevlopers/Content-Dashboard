import api from "./api";

const adCreditService = {
  async apply(orderId, staffMode, adCredit) {
    return (await api.post(`/orders/${staffMode ? "staff" : "admin"}/${orderId}/ad-credit/apply`, { adCredit: Object.fromEntries(Object.entries(adCredit).map(([platform, amount]) => [platform, amount === "" ? 0 : amount])), confirmed: true })).data;
  },
  async getMine(page = 1) { return (await api.get("/orders/ad-credit", { params: { page } })).data; },
  async getOrder(orderId, staffMode) {
    return (await api.get(`/orders/${staffMode ? "staff" : "admin"}/${orderId}/ad-credit`)).data;
  },
  async issue(orderId, staffMode, data) {
    return (await api.post(`/orders/${staffMode ? "staff" : "admin"}/${orderId}/ad-credit`, data)).data;
  },
};
export default adCreditService;
