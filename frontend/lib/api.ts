import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    }
});

api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || "";
        const isPasswordChangeError = requestUrl.includes("/participants/change-password") && status === 400;

        if ((status === 401 || status === 403) && !isPasswordChangeError) {
            if (typeof window !== "undefined") {
                if (!window.location.pathname.startsWith("/auth/login")) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/auth/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;