import { useEffect, useState } from "react";
import authService from "../services/authService";

import { AuthContext } from "./authSessionContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("content_dashboard_token")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clearSession = () => {
      localStorage.removeItem("content_dashboard_token");
      setToken(null);
      setUser(null);
    };

    window.addEventListener("content-dashboard:unauthorized", clearSession);

    const loadUser = async () => {
      try {
        const data = await authService.getMe();

        setUser(data.user);
      } catch (error) {
        console.error("Unable to restore the authenticated session:", error);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    return () =>
      window.removeEventListener(
        "content-dashboard:unauthorized",
        clearSession,
      );
  }, []);

  const login = async (identifier, password) => {
    const data = await authService.login(identifier, password);

    localStorage.removeItem("content_dashboard_token");

    setToken(null);
    setUser(data.user);

    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      if (error.response?.status !== 401) {
        throw error;
      }
    }

    localStorage.removeItem("content_dashboard_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
