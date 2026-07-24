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
    let message = "An unexpected error occurred. Please try again.";

    if (error.response) {
      if (error.response.status === 413) {
        message = "File size is too large. Maximum allowed upload size is 5MB.";
      } else if (typeof error.response.data === "string") {
        // Handle plain text or HTML error strings from backend
        message = error.response.data.replace(/<[^>]*>?/gm, "").trim() || "Server returned an error.";
      } else if (error.response.data && typeof error.response.data === "object") {
        message = error.response.data.error || error.response.data.message || message;
      }
    } else if (error.request) {
      message = "Unable to reach the server. Please verify your connection or backend status.";
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
export { API_BASE_URL };
