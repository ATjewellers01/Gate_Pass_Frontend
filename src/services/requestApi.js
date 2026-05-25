const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const createVisitRequestApi = async (data) => {
  const base64Photo = await new Promise((resolve) => {
    if (!data.photoFile) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(data.photoFile);
  });

  const payload = {
    visitorName: data.visitorName,
    mobileNumber: data.mobileNumber,
    email: data.email || "",
    visitorAddress: data.visitorAddress || "",
    purposeOfVisit: data.purposeOfVisit,
    personToMeet: data.personToMeet,
    personToMeetContact: data.personToMeetContact || "",
    timeOfEntry: data.timeOfEntry,
    visitorPhoto: base64Photo 
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    if (response.ok) {
        return { data: { success: true, message: result.message || "Submitted successfully" } };
    }
    throw new Error(result.error || "Submission failed");
  } catch (error) {
    console.error("Submission error:", error);
    throw error;
  }
};

export const fetchVisitorByMobileApi = async (mobile) => {
  return { data: { success: false, found: false } };
};
