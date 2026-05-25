const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchAllVisitorsApi = async (personToMeet = "admin") => {
    try {
        const url = personToMeet && personToMeet !== "admin" 
            ? `${API_BASE_URL}/api/visits?personToMeet=${encodeURIComponent(personToMeet)}`
            : `${API_BASE_URL}/api/visits`;
            
        const response = await fetch(url);
        const result = await response.json();
        
        if (response.ok) {
            return { data: result.data };
        }
        return { data: [] };
    } catch (error) {
        console.error("Error fetching all visitors:", error);
        return { data: [] };
    }
};
