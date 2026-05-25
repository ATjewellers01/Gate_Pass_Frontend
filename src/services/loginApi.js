const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const LoginCredentialsApi = async (formData) => {
    try {
        const username = (formData.username || "").trim();
        const password = (formData.password || "").trim();

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: username,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.data) {
            return { data: result.data }; // Returns user details (user_name, userId, role, page_access)
        } else {
            return { error: result.error || "Invalid username or password" };
        }
    } catch (e) {
        console.error("Login lookup error:", e);
        return { error: "Network error during login." };
    }
};