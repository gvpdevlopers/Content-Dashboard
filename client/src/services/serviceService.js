import api from "./api";

const getServices = async () => {
  const response = await api.get("/services");
  return response.data;
};

const getPublicServices = async () => {
  const response = await api.get("/services/public");
  return response.data;
};

const getServiceById = async (serviceId) => {
  const response = await api.get(`/services/${serviceId}`);
  return response.data;
};

const serviceService = {
  getServices,
  getPublicServices,
  getServiceById,
};

export default serviceService;