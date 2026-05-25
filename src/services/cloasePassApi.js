const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchGatePassesApi = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/visits`);
        const result = await response.json();
        
        if (response.ok) {
            return { data: { data: result.data } };
        }
        return { data: { data: [] } };
    } catch (error) {
        console.error("Error fetching gate passes:", error);
        return { data: { data: [] } };
    }
};

export const closeGatePassApi = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/visits/${id}/close`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        if (!response.ok) {
            throw new Error("Failed to close gate pass");
        }
        return { data: { success: true } };
    } catch (error) {
        console.error("Error closing gate pass:", error);
        throw error;
    }
};
