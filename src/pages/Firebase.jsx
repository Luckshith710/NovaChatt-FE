import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// All Firebase config values must be provided via environment variables.
// For Netlify: set them in Site Settings → Environment Variables.
// For local dev: set them in Project1/.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Ensure Firebase App Singleton Initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const analytics = getAnalytics(app);
export const auth = getAuth(app);

/**
 * Clean, production-ready Firebase Auth error formatter.
 */
export function formatAuthError(error) {
  if (!error) return "An unexpected error occurred. Please try again.";

  const code = error.code || "auth/unknown-error";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/user-not-found":
      return "No account found with this email address. Please sign up or try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "An account with this email address already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many failed login attempts. Access temporarily disabled for security. Please try again later or reset your password.";
    case "auth/network-request-failed":
      return "Network connection error. Please check your internet connection and try again.";
    case "auth/operation-not-allowed":
      return "This authentication method is currently disabled.";
    default:
      return "Authentication failed. Please check your details and try again.";
  }
}

export default app;
