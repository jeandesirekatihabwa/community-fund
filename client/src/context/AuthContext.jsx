import { createContext, useState, useEffect, useContext } from "react";
import { googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import api from "../lib/api";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
          setLoading(false);
          return;
        }

        const decoded = jwtDecode(token);

        // Check token expiration
        if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
          console.warn("Session expired");
          logoutLocal();
        } else {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        logoutLocal();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Save authentication data
  const saveAuth = (userData, token) => {
    setUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Local logout helper
  const logoutLocal = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Google login (Social Link)
  const login = async (credential) => {
    try {
      const res = await api.post("/auth/google", { token: credential });
      const { user, token } = res.data;
      saveAuth(user, token);
      return { success: true, isNewUser: !user.name };
    } catch (error) {
      console.error("Google login failed:", error);
      return {
        success: false,
        error: error.message || "Google secure link failed",
      };
    }
  };

  // Professional Step 1: Initiate Identity Discovery
  const initiateAuth = async (email) => {
    try {
      const res = await api.post("/auth/init", { email });
      return { 
        success: true, 
        message: res.data.message,
        isNewUser: res.data.isNewUser
      };
    } catch (error) {
      console.error("Auth Init failed:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Identity discovery failed",
      };
    }
  };

  // Professional Step 2: Verify Security Code
  const verify = async (email, code) => {
    try {
      const res = await api.post("/auth/verify", { email, code });
      const { user, token, isNewUser } = res.data;
      saveAuth(user, token);
      return { success: true, isNewUser };
    } catch (error) {
      console.error("Verification failed:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Invalid security code",
      };
    }
  };

  // Professional Step 3: Global Onboarding
  const onboard = async (name) => {
    try {
      const res = await api.post("/auth/onboard", { name });
      const { user } = res.data;
      
      // Update local state and storage
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      
      return { success: true };
    } catch (error) {
      console.error("Onboarding failed:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Profile creation failed",
      };
    }
  };

  // Resend code (Unified)
  const resendCode = async (email) => {
    try {
      const res = await api.post("/auth/resend-code", { email });
      return { success: true, message: res.data.message };
    } catch (error) {
      console.error("Resend code failed:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to resend code",
      };
    }
  };

  // Logout
  const logout = () => {
    try {
      googleLogout();
    } catch (error) {
      console.warn("Google logout warning:", error);
    }
    logoutLocal();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initiateAuth,
        verify,
        onboard,
        login, // google login
        resendCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};