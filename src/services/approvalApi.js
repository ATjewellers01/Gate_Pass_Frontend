const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchVisitsForApprovalApi = async (personToMeet) => {
    try {
        const query = personToMeet && personToMeet.toLowerCase() !== 'admin' && personToMeet.toLowerCase() !== 'guard' && personToMeet.toLowerCase() !== 'aakash agrawal'
            ? `?personToMeet=${encodeURIComponent(personToMeet)}` 
            : '';
            
        const response = await fetch(`${API_BASE_URL}/api/visits${query}`);
        const result = await response.json();
        
        if (response.ok) {
            return { success: true, visits: result.data };
        }
        return { success: true, visits: [] };
    } catch (error) {
        console.error("Error fetching visits:", error);
        return { success: false, visits: [] };
    }
};

export const updateVisitApprovalApi = async ({ id, status, approvedBy }) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/visits/${id}/approve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: status.toLowerCase(), // "approved" or "rejected"
                approvedBy: approvedBy
            })
        });
        
        if (!response.ok) {
            throw new Error("Failed to update approval status");
        }
        return { success: true };
    } catch (error) {
        console.error("Error updating approval status:", error);
        throw error;
    }
};
