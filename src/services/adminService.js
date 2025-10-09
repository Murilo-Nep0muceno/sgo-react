const API_URL = "http://localhost:3000/api/v1";

// ===================================================
// --- Funções para CRIAR Usuários (POST) ---
// ===================================================

const createUser = async (endpoint, userData, token) => {
    const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao criar ${endpoint}.`);
    }

    return response.json();
};

export const createAdmin = (userData, token) => {
    return createUser('admin', userData, token);
};

export const createSecretary = (userData, token) => {
    return createUser('secretary', userData, token);
};

export const createDoctor = (userData, token) => {
    return createUser('doctor', userData, token);
};

export const createClient = (userData, token) => {
    return createUser('client', userData, token);
};


// ===================================================
// --- Funções para BUSCAR Usuários (GET) - ADICIONADO ---
// ===================================================

// Função genérica para buscar listas de usuários por permissão
const getUsersByRole = async (endpoint, token) => {
    const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Falha ao buscar ${endpoint}.`);
    }

    return response.json();
};

// Funções específicas que reutilizam a função genérica
export const getAdmins = (token) => {
    return getUsersByRole('admins', token);
};

export const getSecretaries = (token) => {
    return getUsersByRole('secretaries', token);
};

export const getDoctors = (token) => {
    return getUsersByRole('doctors', token);
};