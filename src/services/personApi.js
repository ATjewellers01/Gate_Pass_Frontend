const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchPersonsApi = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/data`);
        const result = await response.json();
        
        if (response.ok && result.data) {
            return { data: result.data }; // Array of { id, person_to_meet, phone, status }
        }
        return { data: [] };
    } catch (error) {
        console.error("Error fetching persons:", error);
        return { data: [] };
    }
};

export const createPersonApi = async (payload) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (response.ok) return { data: result.data };
        return { error: result.error || "Failed to create person" };
    } catch (error) {
        console.error("Create person error:", error);
        return { error: "Network error" };
    }
};

export const updatePersonApi = async (id, payload) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/data/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (response.ok) return { data: result.data };
        return { error: result.error || "Failed to update person" };
    } catch (error) {
        console.error("Update person error:", error);
        return { error: "Network error" };
    }
};

export const deletePersonApi = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/data/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (response.ok) return { data: { success: true } };
        return { error: result.error || "Failed to delete person" };
    } catch (error) {
        console.error("Delete person error:", error);
        return { error: "Network error" };
    }
};
