// src/services/adminService.js

const API_URL = "http://localhost:3000/api/v1";

// ===================================================
// --- Funções Auxiliares Genéricas ---
// ===================================================

const apiRequest = async (method, endpoint, token, data = null) => {
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };

    const config = {
        method,
        headers,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}/${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `Falha na operação ${method} em ${endpoint}.`);
    }

    // DELETE pode não retornar um corpo JSON, então tratamos esse caso
    if (method === 'DELETE' && response.status === 200) {
        return response.json();
    }
    
    return response.json();
};

// ===================================================
// --- Exports (Funções de Serviço Específicas) ---
// ===================================================

// Funções de Criação (POST)
export const createAdmin = (userData, token) => apiRequest("POST", "admin", token, userData);
export const createSecretary = (userData, token) => apiRequest("POST", "secretary", token, userData);
export const createDoctor = (userData, token) => apiRequest("POST", "doctor", token, userData);
export const createClient = (userData, token) => apiRequest("POST", "client", token, userData);
export const createSchedule = (scheduleData, token) => apiRequest("POST", 'schedules', token, scheduleData);
export const createAppointment = (scheduleId, appointmentData, token) => apiRequest("POST", `appointments/${scheduleId}`, token, appointmentData);

// Funções de Leitura (GET)
export const getAllUsers = (token) => apiRequest('GET', 'users/getAll', token);
export const getMySchedules = (token) => apiRequest('GET', 'mySchedules', token);
export const getAvailableSchedules = (token) => apiRequest('GET', 'schedules', token);
export const getDoctorAppointments = (token) => apiRequest('GET', 'doctor/appointments', token);
// Funções de Deleção (DELETE)
export const deleteUserById = (userId, token) => apiRequest('DELETE', `user/destroy/${userId}`, token);

// Funções de Atualização (PUT) - NOVO!
export const updateUserById = (userId, userData, token) => apiRequest('PUT', `user/update/${userId}`, token, userData);