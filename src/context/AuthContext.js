import React, { createContext, useState, useEffect } from "react";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null); // A exportação precisa estar aqui

export const AuthProvider = ({ children }) => { // E aqui também
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, [token]);

  const login = async (username, password) => {
    const data = await loginUser(username, password);
    const userWithRole = { ...data.user, role: 'admin' };
    
    setToken(data.token);
    setUser(userWithRole);
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("user", JSON.stringify(userWithRole));

    if (userWithRole.role === 'admin') {
        navigate("/admin-dashboard");
    } else if (userWithRole.role === 'secretary') {
        navigate("/secretary-dashboard");
    } else {
        navigate("/");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const value = { user, token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};