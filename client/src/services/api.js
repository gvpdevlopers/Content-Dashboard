import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "content_dashboard_token"
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !String(error.config?.url || "").includes("/auth/login") &&
      !String(error.config?.url || "").includes("/auth/logout")
    ) {
      localStorage.removeItem("content_dashboard_token");
      window.dispatchEvent(new Event("content-dashboard:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export default api;