import { useCallback, useEffect, useState } from "react";
import { authApi } from "../api/client";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }, []);

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem("refresh_token");
    if (!storedRefreshToken) return false;

    try {
      const data = await authApi.refresh(storedRefreshToken);
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      return true;
    } catch (err) {
      console.error("Token refresh failed:", err);
      logout();
      return false;
    }
  }, [logout]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await authApi.me(token);
        setUser(data.user || data);
      } catch (err) {
        const refreshed = await refreshToken();
        if (refreshed) {
          const nextToken = localStorage.getItem("access_token");
          if (nextToken) {
            try {
              const data = await authApi.me(nextToken);
              setUser(data.user || data);
            } catch (retryErr) {
              console.error("Auth retry failed:", retryErr);
              logout();
            }
          }
        } else {
          console.error("Auth check failed:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [logout, refreshToken]);

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authApi.login(email, password);
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      } else {
        localStorage.removeItem("refresh_token");
      }
      setUser(data.user || null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user,
  };
};

export default useAuth;
