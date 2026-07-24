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
  timeout: 45000, // 45 seconds timeout to allow for Render cold boot
});

// Automatic retry mechanism for Render cold starts (sleep mode)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (config && typeof config._retryCount === "undefined") {
      config._retryCount = 0;
    }

    const isNetworkOrTimeout =
      !error.response ||
      error.code === "ECONNABORTED" ||
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      error.response?.status === 504;

    // Retry up to 3 times automatically while Render wakes up
    if (config && isNetworkOrTimeout && config._retryCount < 3) {
      config._retryCount += 1;
      const delayMs = config._retryCount * 3000;
      console.warn(
        `[Backend Cold-Start Retry] Attempt ${config._retryCount}/3 for ${config.url}. Waiting ${delayMs / 1000}s for server wake-up...`
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return api(config);
    }

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
        let text = error.response.data.replace(/<[^>]*>?/gm, "").trim();
        message = text || `Server error (${error.response.status}).`;
      } else if (error.response.data && typeof error.response.data === "object") {
        message = error.response.data.error || error.response.data.message || message;
      }
    } else if (error.request) {
      message = `Unable to connect to backend server at ${API_BASE_URL}. Server may be starting up, please try again in a moment.`;
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
export { API_BASE_URL };
