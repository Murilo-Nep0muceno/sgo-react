
const API_URL = "http://localhost:3000/api/v1";

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
    // Usamos 'client' porque a rota no seu backend é /api/v1/client
    return createUser('client', userData, token);
};
