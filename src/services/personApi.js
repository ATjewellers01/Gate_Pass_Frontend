const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

export const fetchPersonsApi = async () => {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getMasters`);
        const result = await response.json();

        if (result.status === "success" && Array.isArray(result.data)) {
            const mastersData = result.data;
            const persons = [];
            
            // Row 0 is header, so loop from index 1
            for (let i = 1; i < mastersData.length; i++) {
                const row = mastersData[i];
                // Column G (Index 6) is Name, Column H (Index 7) is Phone
                const name = row[6];
                const phone = row[7];
                
                if (name && name.trim() !== '') {
                    persons.push({
                        id: i,
                        person_to_meet: name.trim(),
                        phone: phone ? phone.toString().trim() : "N/A",
                        status: "Available" // Default status as live availability is not yet in sheet
                    });
                }
            }
            return { data: persons };
        }
        return { data: [] };
    } catch (error) {
        console.error("Error fetching persons:", error);
        return { data: [] };
    }
};

export const createPersonApi = async (payload) => {
    return new Promise(resolve => {
        setTimeout(() => {
            // Mapping from personToMeet -> person_to_meet for consistency
            const newPerson = savePerson({
                person_to_meet: payload.personToMeet,
                phone: payload.phone,
                password: payload.password || ""
            });
            resolve({ data: newPerson });
        }, 300);
    });
};

export const updatePersonApi = async (id, payload) => {
    return new Promise(resolve => {
        setTimeout(() => {
            const updated = updatePerson(id, {
                person_to_meet: payload.personToMeet,
                phone: payload.phone,
                password: payload.password || ""
            });
            resolve({ data: updated });
        }, 300);
    });
};

export const deletePersonApi = async (id) => {
    return new Promise(resolve => {
        setTimeout(() => {
            deletePerson(id);
            resolve({ data: { success: true } });
        }, 300);
    });
};
