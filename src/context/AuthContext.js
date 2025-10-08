import React, { createContext, useState, useEffect } from "react";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
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

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    
    // Pega o 'role' e converte para minúsculas
    const userRole = data.user.role ? data.user.role.toLowerCase() : '';

    // Agora, todas as comparações usam letras minúsculas
    if (userRole === 'admin') {
        navigate("/admin-dashboard");
    } else if (userRole === 'secretary') {
        navigate("/secretary-dashboard");
    } else if (userRole === 'doctor') {
        navigate("/dentist-dashboard");
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