import api from "./api";

const adCreditService = {
  async getMine() { return (await api.get("/orders/ad-credit")).data; },
  async getOrder(orderId, staffMode) {
    return (await api.get(`/orders/${staffMode ? "staff" : "admin"}/${orderId}/ad-credit`)).data;
  },
  async issue(orderId, staffMode, data) {
    return (await api.post(`/orders/${staffMode ? "staff" : "admin"}/${orderId}/ad-credit`, data)).data;
  },
};
export default adCreditService;
