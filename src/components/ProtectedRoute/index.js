// src/components/ProtectedRoute/index.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, token } = useAuth();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const userRole = user?.role ? user.role.toLowerCase() : '';

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />; 
    }

    return <Outlet />;
};

export default ProtectedRoute;