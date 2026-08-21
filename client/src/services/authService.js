import api from "./api";

const login = async (identifier, password) => {
  const response = await api.post("/auth/login", {
    identifier,
    password,
  });

  return response.data;
};

const getMe = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};

const authService = {
  login,
  getMe,
};

export default authService;