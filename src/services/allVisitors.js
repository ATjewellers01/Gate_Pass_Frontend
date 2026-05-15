import { fetchVisitsForApprovalApi } from "./approvalApi";

export const fetchAllVisitorsApi = async () => {
    try {
        const res = await fetchVisitsForApprovalApi("admin");
        if (res.success) {
            // descending sort to show newest first
            const sorted = res.visits.sort((a, b) => {
                const dateA = new Date(a.timestamp || a.date_of_visit || 0);
                const dateB = new Date(b.timestamp || b.date_of_visit || 0);
                
                // If invalid date, move to bottom
                if (isNaN(dateA.getTime())) return 1;
                if (isNaN(dateB.getTime())) return -1;
                
                return dateB - dateA;
            });
            return { data: sorted };
        }
        return { data: [] };
    } catch (error) {
        console.error("Error fetching live visitors:", error);
        return { data: [] };
    }
};
