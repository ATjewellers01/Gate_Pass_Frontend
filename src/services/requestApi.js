const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

export const createVisitRequestApi = async (data) => {


     console.log("FOLDER ID:", import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID); // ← add karo
  console.log("SCRIPT URL:", import.meta.env.VITE_GOOGLE_SCRIPT_URL);
  
  // ✅ Clean async/await approach — no nested Promise hack
  const base64Photo = await new Promise((resolve) => {
    if (!data.photoFile) {
      resolve(null); // No photo → null safely
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(data.photoFile);
  });

  const values = [
    new Date().toLocaleString(), // A: Timestamp
    "",                          // B: Serial No (Auto-filled by Script)
    data.visitorName,            // C: Visitor Name
    data.mobileNumber,           // D: Mobile Number
    data.email || "",            // E: Email Address
    base64Photo,                 // F: Visitor Photo (Base64 or null)
    data.personToMeet,           // G: Person To Meet
    data.purposeOfVisit,         // H: Purpose of Visit
    data.timeOfEntry,            // I: Time of Entry
    data.visitorAddress,         // J: Visitor Address
    "", "", "", "", "", "", "", "", // K, L, M, N, O, P, Q, R (Empty padding)
    data.personToMeetContact || "" // S: Person To Meet Contact (Index 18)
  ];

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        values: values,
        folderId: import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID,
      }),
    });

    return { data: { success: true, message: "Submitted successfully" } };
  } catch (error) {
    console.error("Submission error:", error);
    throw error;
  }
};

export const fetchVisitorByMobileApi = async (mobile) => {
  return { data: { success: false, found: false } };
};
