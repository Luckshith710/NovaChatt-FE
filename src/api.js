import axios from "axios";

// VITE_API_URL must be set in your deployment environment.
// Fallback to http://localhost:3000 for local development.
const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_BASE_URL = RAW_API_URL.replace(/\/+$/, "");

if (!import.meta.env.VITE_API_URL) {
  console.info("[api.js] VITE_API_URL is not defined in env. Defaulting API_BASE_URL to:", API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for cold starts / uploads
});

// Response interceptor to format and log error messages properly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ [API Request Error]:", {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      responseData: error.response?.data,
      message: error.message,
    });

    let message = "An unexpected error occurred. Please try again.";

    if (error.response) {
      if (error.response.status === 413) {
        message = "File size is too large. Maximum allowed upload size is 5MB.";
      } else if (typeof error.response.data === "string") {
        // Strip HTML tags if server returned an HTML error page
        let text = error.response.data.replace(/<[^>]*>?/gm, "").trim();
        message = text || `Server error (${error.response.status}).`;
      } else if (error.response.data && typeof error.response.data === "object") {
        message = error.response.data.error || error.response.data.message || message;
      }
    } else if (error.request) {
      message = `Cannot reach backend at ${API_BASE_URL}. If using Render free tier, please wait 30 seconds for cold start, or check your internet connection.`;
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
export { API_BASE_URL };
