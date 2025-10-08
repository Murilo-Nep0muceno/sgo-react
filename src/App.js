// src/App.js

import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import SecretaryDashboard from "./components/SecretaryDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['secretary']} />}>
            <Route path="/secretary-dashboard" element={<SecretaryDashboard />} />
        </Route>

        <Route path="/" element={<h2 style={{textAlign: 'center', marginTop: '20px'}}>Página Inicial</h2>} />
      </Routes>
    </>
  );
}

export default App;