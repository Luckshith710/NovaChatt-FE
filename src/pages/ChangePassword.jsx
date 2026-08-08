import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  updatePassword,
  onAuthStateChanged,
  confirmPasswordReset,
  verifyPasswordResetCode
} from "firebase/auth";
import { auth } from "./Firebase";
import api from "../api";
import PasswordInput from "../components/PasswordInput";
import "./Form.css";
import {
  FiLock,
  FiCheckCircle,
  FiArrowLeft,
  FiAlertCircle,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiLogIn,
  FiShield
} from "react-icons/fi";
import { RiSparklingFill } from "react-icons/ri";

function ChangePassword() {
  let [newPassword, setNewPassword] = useState("");
  let [confirmPassword, setConfirmPassword] = useState("");
  let [loading, setLoading] = useState(false);
  let [verifying, setVerifying] = useState(true);
  let [tokenValid, setTokenValid] = useState(null);
  let [isSuccess, setIsSuccess] = useState(false);
  let [errorMsg, setErrorMsg] = useState("");
  let [token, setToken] = useState(null);
  let [oobCode, setOobCode] = useState(null);
  let [resetEmail, setResetEmail] = useState(null);

  let nav = useNavigate();

  // ── Password Validation Rules ──
  const rules = useMemo(() => {
    return {
      hasMinLength: newPassword.length >= 6,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
      passwordsMatch: newPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  // ── Password Strength Calculator ──
  const strengthInfo = useMemo(() => {
    if (!newPassword) return { label: "", percent: 0, color: "#262626" };

    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (rules.hasUpper && rules.hasLower) score += 1;
    if (rules.hasNumber) score += 1;
    if (rules.hasSpecial) score += 1;

    switch (score) {
      case 1:
      case 2:
        return { label: "Weak", percent: 30, color: "#f87171" };
      case 3:
        return { label: "Fair", percent: 55, color: "#fcb045" };
      case 4:
        return { label: "Good", percent: 80, color: "#38bdf8" };
      case 5:
        return { label: "Strong", percent: 100, color: "#4ade80" };
      default:
        return { label: "Weak", percent: 20, color: "#f87171" };
    }
  }, [newPassword, rules]);

  // ── Friendly Error Formatter ──
  const formatUserFriendlyError = (err) => {
    if (!err) return "Unable to complete request. Please try again.";

    const raw = (err.code || err.message || String(err)).toLowerCase();

    if (raw.includes("expired") || raw.includes("auth/expired-action-code")) {
      return "This password reset link has expired. Reset links are single-use and expire after 15 minutes.";
    }
    if (raw.includes("invalid-action-code") || raw.includes("invalid_oob_code") || raw.includes("invalid token")) {
      return "This password reset link is invalid or has already been used. Please request a new link.";
    }
    if (raw.includes("network") || raw.includes("failed to fetch")) {
      return "Network connection error. Please check your internet connection and try again.";
    }
    if (raw.includes("weak-password")) {
      return "Password is too weak. Please use at least 6 characters with letters and numbers.";
    }
    return "Failed to reset password. Please try again or request a new link.";
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const resetToken = searchParams.get("token");
    const code = searchParams.get("oobCode") || (searchParams.get("apiKey") && searchParams.get("oobCode"));

    if (code) {
      setOobCode(code);
      setVerifying(true);
      verifyPasswordResetCode(auth, code)
        .then((email) => {
          console.log(`[Firebase Auth Code Verified] Valid reset code for: ${email}`);
          setTokenValid(true);
          setResetEmail(email);
        })
        .catch((err) => {
          console.error("[Firebase Auth Code Verification Error]:", err);
          setTokenValid(false);
          setErrorMsg(formatUserFriendlyError(err));
        })
        .finally(() => setVerifying(false));
    } else if (resetToken) {
      setToken(resetToken);
      setVerifying(true);
      api.get(`/api/verify-reset-token?token=${resetToken}`)
        .then((res) => {
          if (res.data?.valid) {
            setTokenValid(true);
            setResetEmail(res.data.email);
          } else {
            setTokenValid(false);
            setErrorMsg(formatUserFriendlyError(res.data?.error));
          }
        })
        .catch((err) => {
          setTokenValid(false);
          setErrorMsg(formatUserFriendlyError(err));
        })
        .finally(() => setVerifying(false));
    } else {
      let unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          nav("/login");
        } else {
          setTokenValid(true);
          setResetEmail(user.email);
        }
        setVerifying(false);
      });
      return () => unsubscribe();
    }
  }, [nav]);

  let handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    if (!rules.hasMinLength) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      if (oobCode) {
        console.log(`[Firebase Auth Reset] Updating password in Firebase Auth...`);
        await confirmPasswordReset(auth, oobCode, newPassword);
        console.log(`[Firebase Auth Reset Success] Password updated for: ${resetEmail || "user"}`);
        setIsSuccess(true);
      } else if (token) {
        console.log(`[Backend Token Reset] Submitting password reset to backend...`);
        await api.post("/api/reset-password", { token, newPassword });
        setIsSuccess(true);
      } else {
        if (!auth.currentUser) {
          throw new Error("User session expired. Please sign in again.");
        }
        console.log(`[Profile Update] Updating password for logged-in user...`);
        await updatePassword(auth.currentUser, newPassword);
        setIsSuccess(true);
      }
    } catch (err) {
      console.error("[Password Reset Failed]:", err);
      setErrorMsg(formatUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-box animated-card" style={{ maxWidth: "440px", width: "100%" }}>
        
        {/* ── NovaChat Header ── */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img
            src="/logo-icon.png"
            alt="NovaChat Logo"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              margin: "0 auto 16px",
              display: "block",
              boxShadow: "0 8px 24px rgba(71, 191, 255, 0.35)",
            }}
          />

          <h2 style={{ fontSize: "24px", margin: "0 0 4px", fontWeight: "700" }}>
            NovaChat <RiSparklingFill style={{ color: "#c13584", fontSize: "20px" }} />
          </h2>
          <p style={{ color: "#737373", fontSize: "13px", margin: 0 }}>
            Modern Real-Time Messenger
          </p>
        </div>

        {/* ── Verifying Token State ── */}
        {verifying && (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <FiRefreshCw
              style={{
                fontSize: "32px",
                animation: "spin 1s linear infinite",
                color: "#c13584",
                marginBottom: "14px",
              }}
            />
            <p style={{ fontSize: "14px", color: "#a8a8a8", margin: 0, fontWeight: "500" }}>
              Verifying your reset link...
            </p>
          </div>
        )}

        {/* ── Invalid / Expired Reset Link View ── */}
        {!verifying && tokenValid === false && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiAlertCircle style={{ fontSize: "28px", color: "#f87171" }} />
            </div>

            <h3 style={{ color: "#ffffff", fontSize: "18px", marginBottom: "8px", fontWeight: "700" }}>
              Reset Link Invalid or Expired
            </h3>
            <p style={{ color: "#a8a8a8", fontSize: "13px", lineHeight: "1.6", marginBottom: "24px" }}>
              {errorMsg || "Password reset links are single-use and expire after 15 minutes. Please request a new link."}
            </p>

            <button
              onClick={() => nav("/forgot")}
              style={{
                background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
                border: "none",
                fontWeight: "600",
                padding: "13px",
                borderRadius: "10px",
                color: "#ffffff",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Request New Reset Link
            </button>
          </div>
        )}

        {/* ── Success State View ── */}
        {!verifying && tokenValid !== false && isSuccess && (
          <div style={{ textAlign: "center", padding: "12px 0" }} className="animated-card">
            <div
              className="animated-checkmark"
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.3))",
                border: "2px solid #22c55e",
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 30px rgba(34, 197, 94, 0.35)",
              }}
            >
              <FiCheckCircle style={{ fontSize: "36px", color: "#4ade80" }} />
            </div>

            <h3 style={{ color: "#ffffff", fontSize: "20px", marginBottom: "10px", fontWeight: "700" }}>
              Password Reset Complete! 🎉
            </h3>
            <p style={{ color: "#a8a8a8", fontSize: "14px", lineHeight: "1.6", marginBottom: "28px" }}>
              Your password has been updated successfully. You can now log in to NovaChat using your new password.
            </p>

            <button
              onClick={() => nav("/login")}
              style={{
                background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
                border: "none",
                fontWeight: "600",
                padding: "14px",
                borderRadius: "10px",
                color: "#ffffff",
                cursor: "pointer",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "15px",
                boxShadow: "0 8px 24px rgba(193, 53, 132, 0.35)",
              }}
            >
              <FiLogIn style={{ fontSize: "18px" }} /> Go to Login
            </button>
          </div>
        )}

        {/* ── Active Password Reset Form ── */}
        {!verifying && tokenValid !== false && !isSuccess && (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  background: "rgba(131, 58, 180, 0.12)",
                  border: "1px solid rgba(131, 58, 180, 0.3)",
                  borderRadius: "20px",
                  fontSize: "12px",
                  color: "#c13584",
                  marginBottom: "12px",
                  fontWeight: "600",
                }}
              >
                <FiShield style={{ fontSize: "13px" }} /> Secure Password Reset
              </div>

              <h3 style={{ margin: "0 0 6px", fontSize: "18px", color: "#ffffff", fontWeight: "700" }}>
                {(token || oobCode) ? "Reset Your Password" : "Change Your Password"}
              </h3>
              
              {resetEmail && (
                <p style={{ color: "#a8a8a8", fontSize: "12px", margin: 0 }}>
                  Creating a new password for <strong style={{ color: "#fcb045" }}>{resetEmail}</strong>
                </p>
              )}
            </div>

            {/* ── Alert Error Message ── */}
            {errorMsg && (
              <div className="alert-box alert-error">
                <FiAlertCircle style={{ fontSize: "16px", flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              
              {/* ── New Password Field ── */}
              <div className="form-group">
                <label>
                  <FiLock style={{ marginRight: "5px", verticalAlign: "middle", color: "#737373" }} />
                  New Password
                </label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErrorMsg(""); }}
                  required
                  placeholder="Enter new password"
                  disabled={loading}
                  ariaLabel="New Password"
                />

                {/* Password Strength Meter */}
                {newPassword && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                      <span style={{ color: "#737373" }}>Password Strength:</span>
                      <span style={{ color: strengthInfo.color, fontWeight: "700" }}>
                        {strengthInfo.label}
                      </span>
                    </div>
                    <div className="strength-bar-bg">
                      <div
                        className="strength-bar-fill"
                        style={{
                          width: `${strengthInfo.percent}%`,
                          backgroundColor: strengthInfo.color,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Confirm Password Field ── */}
              <div className="form-group">
                <label>
                  <FiLock style={{ marginRight: "5px", verticalAlign: "middle", color: "#737373" }} />
                  Confirm Password
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(""); }}
                  required
                  placeholder="Repeat new password"
                  disabled={loading}
                  ariaLabel="Confirm Password"
                />
              </div>

              {/* ── Real-Time Validation Checklist ── */}
              <div
                style={{
                  background: "#161616",
                  border: "1px solid #262626",
                  borderRadius: "10px",
                  padding: "12px",
                  marginBottom: "20px",
                }}
              >
                <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: "600", color: "#737373", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Password Requirements:
                </p>
                <div className="validation-checklist">
                  <div className={`checklist-item ${rules.hasMinLength ? "valid" : "invalid"}`}>
                    {rules.hasMinLength ? <FiCheck style={{ fontSize: "13px" }} /> : <FiX style={{ fontSize: "13px" }} />}
                    <span>Min. 6 characters</span>
                  </div>

                  <div className={`checklist-item ${rules.hasUpper ? "valid" : "invalid"}`}>
                    {rules.hasUpper ? <FiCheck style={{ fontSize: "13px" }} /> : <FiX style={{ fontSize: "13px" }} />}
                    <span>Uppercase letter</span>
                  </div>

                  <div className={`checklist-item ${rules.hasLower ? "valid" : "invalid"}`}>
                    {rules.hasLower ? <FiCheck style={{ fontSize: "13px" }} /> : <FiX style={{ fontSize: "13px" }} />}
                    <span>Lowercase letter</span>
                  </div>

                  <div className={`checklist-item ${rules.hasNumber ? "valid" : "invalid"}`}>
                    {rules.hasNumber ? <FiCheck style={{ fontSize: "13px" }} /> : <FiX style={{ fontSize: "13px" }} />}
                    <span>Number (0-9)</span>
                  </div>

                  <div className={`checklist-item ${rules.hasSpecial ? "valid" : "invalid"}`}>
                    {rules.hasSpecial ? <FiCheck style={{ fontSize: "13px" }} /> : <FiX style={{ fontSize: "13px" }} />}
                    <span>Special character</span>
                  </div>

                  <div className={`checklist-item ${rules.passwordsMatch ? "valid" : "invalid"}`}>
                    {rules.passwordsMatch ? <FiCheck style={{ fontSize: "13px" }} /> : <FiX style={{ fontSize: "13px" }} />}
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              {/* ── Submit Button ── */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                {loading ? (
                  <>
                    <FiRefreshCw style={{ animation: "spin 1s linear infinite", fontSize: "16px" }} />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <FiCheckCircle style={{ fontSize: "16px" }} /> Reset Password
                  </>
                )}
              </button>

              {/* ── Back to Sign In ── */}
              <button
                type="button"
                onClick={() => nav((token || oobCode) ? "/login" : "/home")}
                disabled={loading}
                style={{
                  marginTop: "12px",
                  background: "transparent",
                  border: "1px solid #262626",
                  color: "#737373",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "13px",
                }}
              >
                <FiArrowLeft /> {(token || oobCode) ? "Back to Sign In" : "Back to Chat"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ChangePassword;