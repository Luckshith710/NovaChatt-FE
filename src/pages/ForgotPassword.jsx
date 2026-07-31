import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Form.css";
import { FiMail, FiSend, FiArrowLeft, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

function ForgotPassword() {
  let [email, setEmail] = useState("");
  let [loading, setLoading] = useState(false);
  let [successMsg, setSuccessMsg] = useState("");
  let [errorMsg, setErrorMsg] = useState("");

  let nav = useNavigate();

  let handleSubmit = async (event) => {
    event.preventDefault();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, cleanEmail);
      console.log("[Password Reset] Firebase sent reset email to:", cleanEmail);
      setSuccessMsg("A password reset link has been sent to your email.");
      setEmail("");
    } catch (err) {
      console.error("[Password Reset Error]", err.code, err.message);

      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
        setErrorMsg("No account found with this email address.");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMsg("Too many requests. Please wait a moment and try again.");
      } else {
        setErrorMsg("Unable to send the password reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-box">

        {/* ── Alerts ── */}
        {successMsg && (
          <div className="alert-box alert-success">
            <FiCheckCircle style={{ fontSize: "16px", flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert-box alert-error">
            <FiAlertCircle style={{ fontSize: "16px", flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            width: "56px", height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
            margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(193,53,132,0.4)",
          }}>
            <FiMail style={{ fontSize: "24px", color: "#fff" }} />
          </div>
          <h2 style={{ marginBottom: "4px" }}>Forgot Password?</h2>
          <p style={{ color: "#555", fontSize: "13px", margin: 0, lineHeight: "1.6" }}>
            Enter your registered email address to receive a secure password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <FiMail style={{ marginRight: "5px", verticalAlign: "middle", color: "#555" }} />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
              required
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            <FiSend /> {loading ? "Sending link..." : "Send Reset Link"}
          </button>

          <button
            type="button"
            onClick={() => nav("/login")}
            style={{
              marginTop: "12px",
              background: "transparent",
              border: "1px solid #262626",
              color: "#555",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <FiArrowLeft /> Back to Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;