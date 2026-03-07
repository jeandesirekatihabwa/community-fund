import axios from 'axios';

// Use environment variable or fallback for local development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create a configured axios instance
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Optional: add timeout to prevent hanging requests
    timeout: 10000, 
});

// Request interceptor to automatically attach the Auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for centralized error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle common errors (e.g., 401 Unauthorized)
        if (error.response?.status === 401) {
            // Optional: trigger logout or token refresh logic here
            console.error("Unauthorized access - token may be expired.");
            // Example: localStorage.removeItem('token'); window.location.href = '/login';
        }
        
        // Format error nicely for the UI components to consume
        const uiError = new Error(error.response?.data?.error || error.message || "An unexpected error occurred");
        uiError.status = error.response?.status;
        return Promise.reject(uiError);
    }
);

export default api;
