const API_URL = "http://localhost:3000/api/v1";

const apiRequest = async (method, endpoint, token, data = null) => {
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };

    const config = {
        method,
        headers,
    };

    if (data && method !== 'GET') { 
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

    if (observationData.diagnostic) formData.append('diagnostic', observationData.diagnostic);
    if (observationData.procedures) formData.append('procedures', observationData.procedures);
    if (observationData.recommendations) formData.append('recommendations', observationData.recommendations);
    
    if (file) {
        formData.append('image', file); 
    }

    const response = await fetch(`${API_URL}/appointmentsObservation/${appointmentId}`, {
        method: 'POST',
        headers: {
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
        throw new Error(errorData.error || errorData.message || `Falha ao criar observação.`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return null; 
    }
};

export const createAdmin = (userData, token) => apiRequest("POST", "admin", token, userData);
export const createSecretary = (userData, token) => apiRequest("POST", "secretary", token, userData);
export const createDoctor = (userData, token) => apiRequest("POST", "doctor", token, userData);
export const createClient = (userData, token) => apiRequest("POST", "client", token, userData);
export const createSchedule = (scheduleData, token) => apiRequest("POST", 'schedules', token, scheduleData);
export const createAppointment = (scheduleId, appointmentData, token) => apiRequest("POST", `appointments/${scheduleId}`, token, appointmentData);

export const getAllUsers = (token) => apiRequest('GET', 'users/getAll', token);
export const getMySchedules = (token) => apiRequest('GET', 'mySchedules', token);
export const getAvailableSchedules = (token) => apiRequest('GET', 'schedules', token);
export const getDoctorAppointments = (token) => apiRequest('GET', 'getMyAppointments', token);
export const getAllBookedAppointments = (token) => apiRequest('GET', 'allAppointments', token);
export const getDashboardStats = (token) => apiRequest('GET', 'admin/stats', token);

export const getClientAppointments = (token) => apiRequest('GET', 'getAllMyAppointmentPatient', token);

export const deleteUserById = (userId, token) => apiRequest('DELETE', `user/destroy/${userId}`, token);

export const updateUserById = (userId, userData, token) => apiRequest('PUT', `user/update/${userId}`, token, userData);
export const updateAppointment = (appointmentId, updatedData, token) => apiRequest('PUT', `appointments/update/${appointmentId}`, token, updatedData);

export const cancelAppointmentById = (appointmentId, token) => {
    return apiRequest('PUT', `myAppointment/Cancel/${appointmentId}`, token, {});
};

export const getClientProfile = (token) => apiRequest('GET', 'client/profile', token);
export const updateClientProfile = (userData, token) => apiRequest('PUT', 'client/profile', token, userData);