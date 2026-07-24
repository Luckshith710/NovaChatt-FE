import axios from "axios";

// VITE_API_URL must be set in your deployment environment.
// For Netlify: set it in Site Settings → Environment Variables.
// For local dev: set it in Project1/.env
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.error(
    "[api.js] VITE_API_URL is not set. " +
    "Create a .env file with VITE_API_URL=http://localhost:3000 for local development, " +
    "or set it in your Netlify environment variables for production."
  );
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Response interceptor to format error messages properly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // axios sets error.response only when the server actually replied.
    // Its absence means the request never got a response (server down,
    // unreachable, CORS block, etc.) — give users an actionable message
    // instead of axios's raw "Network Error" string.
    const message = error.response
      ? error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred"
      : "Unable to reach the server. It may be temporarily unavailable — please try again in a moment.";
    return Promise.reject(new Error(message));
  }
);

export default api;
export { API_BASE_URL };
