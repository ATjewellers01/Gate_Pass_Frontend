const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

/**
 * GET visits for approval (by personToMeet)
 * @param {string} personToMeet
 */
export const fetchVisitsForApprovalApi = async (personToMeet) => {
    try {
        const response = await fetch(SCRIPT_URL);
        const result = await response.json();
        console.log("Raw Sheets Data Result:", result);
        
        if (result.status === "success" && result.data.length > 6) {
            const headers = result.data[5]; // Row 6 (Index 5)
            console.log("Mapped Headers from Sheet Row 6:", headers);

            // Filter out blank rows
            const dataRows = result.data.slice(6).filter(row => row[0] !== "" || row[1] !== ""); 

            const mappedData = dataRows.map((row, index) => {
                let obj = { id: index };
                headers.forEach((header, i) => {
                    // Trim header and clean it for key mapping
                    const key = (header || "").toString().trim().toLowerCase().replace(/\s+/g, '_').replace(/\./g, '');
                    if (key) obj[key] = row[i];
                    
                    // Force the first column to also be available as 'timestamp'
                    if (i === 0) obj['timestamp'] = row[i];
                });
                return obj;
            });

            console.log("Total Mapped Rows:", mappedData.length);
            if (mappedData.length > 0) console.log("First row example object:", mappedData[0]);

            const lowerUser = (personToMeet || "").trim().toLowerCase();
            let visits;
            
            if (lowerUser === "admin" || lowerUser === "guard" || lowerUser === "aakash agrawal") {
                visits = mappedData;
            } else {
                visits = mappedData.filter(v => (v.person_to_meet || "").trim().toLowerCase() === lowerUser);
            }
            
            return { success: true, visits };
        }
        return { success: true, visits: [] };
    } catch (error) {
        console.error("Error fetching from Google Sheets:", error);
        return { success: false, visits: [] };
    }
};

/**
 * POST approve / reject visit to Google Sheets
 */
export const updateVisitApprovalApi = async ({ id, status, approvedBy, serialNo }) => {
    try {
        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                action: "approveVisit", 
                id: id,
                serial_no: serialNo, // Using serial_no to identify the row in sheet
                status: status,      // "Approved" or "Rejected"
                actual_1: new Date().toLocaleString('en-IN'), // Goes to Column L (Date + Time)
                approved_by: approvedBy
            }),
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating approval status:", error);
        throw error;
    }
};
