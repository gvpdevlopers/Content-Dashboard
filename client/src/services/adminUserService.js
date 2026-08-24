import api from "./api";

const createUser = async (userData) => {
  const response = await api.post("/users", userData);
  return response.data;
};

const getUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

const getUserById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

const updateUserStatus = async (userId, isActive) => {
  const response = await api.patch(`/users/${userId}/status`, {
    isActive,
  });

  return response.data;
};

const getUserOrders = async (userId) => {
  const response = await api.get(`/users/${userId}/orders`);
  return response.data;
};

const adminUserService = {
  createUser,
  getUsers,
  getUserById,
  updateUserStatus,
  getUserOrders,
};

export default adminUserService;