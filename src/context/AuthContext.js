// src/context/AuthContext.js (V51.3 - Limpo)
import React, { createContext, useState, useEffect } from "react"; // Removido useCallback
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext(null);

// Helper
const decodeAndSet = (token, setToken, setUser) => {
    try {
        const decodedPayload = jwtDecode(token);
        setUser(decodedPayload);
        setToken(token);
        localStorage.setItem("authToken", token);
    } catch (error) {
        console.error("Token inválido ou expirado:", error);
        setUser(null);
        setToken(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user"); 
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("authToken"));
    const navigate = useNavigate();

    // Efeito para carregar o usuário do token na inicialização
    useEffect(() => {
        const storedToken = localStorage.getItem("authToken");
        if (storedToken) {
            decodeAndSet(storedToken, setToken, setUser);
        }
    }, []); // Roda apenas uma vez

    const login = async (username, password) => {
        const data = await loginUser(username, password);
        decodeAndSet(data.token, setToken, setUser);
        
        const userRole = jwtDecode(data.token).role 
            ? jwtDecode(data.token).role.toLowerCase() 
            : '';

        // Redirecionamento
        if (userRole === 'admin') navigate("/admin-dashboard");
        else if (userRole === 'secretary') navigate("/secretary-dashboard");
        else if (userRole === 'doctor') navigate("/dentist-dashboard");
        else if (userRole === 'client') navigate("/client-dashboard");
        else navigate("/");
    };

    const logout = () => { // useCallback foi removido pois não era necessário
        setUser(null);
        setToken(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user"); 
        navigate("/login");
    };

    const value = { user, token, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};