import { createContext, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ✅ Safely parse user from localStorage
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
      return null;
    }
  });

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/login`,
        { email, password }
      );

      const { user: userData, token } = res.data;
      const fullUser = { ...userData, token };

      // Save in context and localStorage
      setUser(fullUser);
      localStorage.setItem("user", JSON.stringify(fullUser));

      return { success: true };
    } catch (err) {
      console.error(err.response?.data || err.message);
      return {
        success: false,
        message: err.response?.data?.message || "Login failed"
      };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
