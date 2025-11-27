import React from "react";
import { Routes, Route } from "react-router-dom";
import DentistDashboard from "./components/DentistDashboard";
import Header from "./components/Header";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import SecretaryDashboard from "./components/SecretaryDashboard";
import ProtectedRoute from "./components/ProtectedRoute"; 
import Home from "./components/Home";
import ClientDashboard from "./components/ClientDashboard";
import Footer from "./components/Footer";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

function App() {
  return (
     <div className="app-container">
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['secretary']} />}>
            <Route path="/secretary-dashboard" element={<SecretaryDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route path="/dentist-dashboard" element={<DentistDashboard />} />
        </Route>
    <Route element={<ProtectedRoute allowedRoles={['client']} />}>
        <Route path="/client-dashboard" element={<ClientDashboard />} />
    </Route>


        <Route path="/" element={<Home />} />
      </Routes>
      <Footer/>
    </div>
  );
}
export default App;