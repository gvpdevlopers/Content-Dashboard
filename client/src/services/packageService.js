import api from "./api";

const packageService = {
  eligibleClients: async (services) => (await api.post("/packages/admin/eligible-clients", { services })).data,
  preview: async (services) => (await api.post("/packages/admin/preview", { services })).data,
  list: async () => (await api.get("/packages")).data,
  get: async (id) => (await api.get(`/packages/${id}`)).data,
  listAdmin: async () => (await api.get("/packages/admin")).data,
  create: async (payload) => (await api.post("/packages/admin", payload)).data,
  update: async (id, payload) => (await api.patch(`/packages/admin/${id}`, payload)).data,
  remove: async (id) => (await api.delete(`/packages/admin/${id}`)).data,
};

export default packageService;
