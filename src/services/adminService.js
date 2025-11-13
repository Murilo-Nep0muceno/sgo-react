// src/services/adminService.js

const API_URL = "http://localhost:3000/api/v1";

// ===================================================
// --- Funções Auxiliares Genéricas ---
// ===================================================

const apiRequest = async (method, endpoint, token, data = null) => {
    // ... (existing apiRequest function - no changes needed here)
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };

    const config = {
        method,
        headers,
    };

    if (data && method !== 'GET') { // Don't send body for GET
        config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}/${endpoint}`, config);

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: `Erro ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || errorData.message || `Falha na operação ${method} em ${endpoint}.`);
    }

    if (response.status === 204 || (response.headers.get("content-length") === "0")) {
        return null;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return await response.text();
    }
};


export const createObservation = async (appointmentId, observationData, file, token) => {
    const formData = new FormData();

    // Adiciona os campos de texto do prontuário
    // O backend (ObservationController) espera os campos soltos no req.body
    if (observationData.diagnostic) formData.append('diagnostic', observationData.diagnostic);
    if (observationData.procedures) formData.append('procedures', observationData.procedures);
    if (observationData.recommendations) formData.append('recommendations', observationData.recommendations);
    
    // Adiciona o arquivo se existir
    if (file) {
        // 'image' é o nome que o middleware 'uploadImage.single("image")' espera no backend
        formData.append('image', file); 
    }

    // A rota '/appointmentsObservation/:id' vem do seu 'doctorRouter.js'
    const response = await fetch(`${API_URL}/appointmentsObservation/${appointmentId}`, {
        method: 'POST',
        headers: {
            // NÃO definimos 'Content-Type', o browser faz isso automaticamente para FormData
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: `Erro ${response.status}: ${response.statusText}` };
        }
        // O backend retorna { "error": "..." }, então usamos errorData.error
        throw new Error(errorData.error || errorData.message || `Falha ao criar observação.`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return null; 
    }
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
export const getMySchedules = (token) => apiRequest('GET', 'mySchedules', token); // Doctor
// ... (outras funções)
export const getAvailableSchedules = (token) => apiRequest('GET', 'schedules', token); // Secretary
export const getDoctorAppointments = (token) => apiRequest('GET', 'getMyAppointments', token); // <--- LINHA CORRIGIDA
export const getAllBookedAppointments = (token) => apiRequest('GET', 'allAppointments', token); // Secretary
// ...

export const getClientAppointments = (token) => apiRequest('GET', 'getAllMyAppointmentPatient', token); // Client

export const deleteUserById = (userId, token) => apiRequest('DELETE', `user/destroy/${userId}`, token); // Admin

export const updateUserById = (userId, userData, token) => apiRequest('PUT', `user/update/${userId}`, token, userData); // Admin
export const updateAppointment = (appointmentId, updatedData, token) => apiRequest('PUT', `appointments/update/${appointmentId}`, token, updatedData); // Secretary

export const cancelAppointmentById = (appointmentId, token) => {
    return apiRequest('PUT', `myAppointment/Cancel/${appointmentId}`, token, {});
};

export const getClientProfile = (token) => apiRequest('GET', 'client/profile', token);
export const updateClientProfile = (userData, token) => apiRequest('PUT', 'client/profile', token, userData);