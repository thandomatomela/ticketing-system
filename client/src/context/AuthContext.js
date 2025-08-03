import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import api from "../api/api";

export const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setToken(storedToken);

          // Verify token is still valid by fetching profile
          try {
            const response = await api.get("/auth/profile");
            if (response.data.success) {
              setUser(response.data.data);
            }
          } catch (error) {
            // Token is invalid, clear auth state
            console.warn("Token validation failed:", error);
            clearAuth();
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/auth/login", { email, password });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data;

        setUser(userData);
        setToken(newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", newToken);

        return { success: true, data: userData };
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);

      // Call logout endpoint if user is authenticated
      if (token) {
        try {
          await api.post("/auth/logout");
        } catch (error) {
          console.warn("Logout API call failed:", error);
        }
      }

      clearAuth();
    } catch (error) {
      console.error("Error during logout:", error);
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [token, clearAuth]);

  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put("/auth/profile", profileData);

      if (response.data.success) {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return { success: true, data: updatedUser };
      } else {
        throw new Error(response.data.message || "Profile update failed");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Profile update failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        return { success: true };
      } else {
        throw new Error(response.data.message || "Password change failed");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Password change failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    updateProfile,
    changePassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
