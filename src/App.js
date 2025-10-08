import React from "react";
import { Routes, Route } from "react-router-dom";
import DentistDashboard from "./components/DentistDashboard";
import Header from "./components/Header";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import SecretaryDashboard from "./components/SecretaryDashboard";
import ProtectedRoute from "./components/ProtectedRoute"; 
import Home from "./components/Home";

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

        <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route path="/dentist-dashboard" element={<DentistDashboard />} />
        </Route>

        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}
export default App;