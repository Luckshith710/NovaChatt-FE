import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Form.css";
import PasswordInput from "../components/PasswordInput";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, formatAuthError } from "./Firebase";
import { FiMail, FiLock, FiUserPlus, FiAlertCircle } from "react-icons/fi";
import api from "../api";

function Signup() {
  let [username, setUsername] = useState("");
  let [password, setPassword] = useState("");
  let [confirmPassword, setConfirmPassword] = useState("");
  let [loading, setLoading] = useState(false);
  let [errorMsg, setErrorMsg] = useState("");

  let nav = useNavigate();

  useEffect(() => {
    let unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        nav("/home");
      }
    });
    return () => unsubscribe();
  }, [nav]);

  const syncUserToBackend = async (user) => {
    try {
      await api.post("/users", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    } catch (err) {
      console.error("[Auth Sync] Backend user sync failed:", err.message || err);
    }
  };

  let handleSubmit = async (event) => {
    event.preventDefault();
    const cleanEmail = (username || "").trim().toLowerCase();

    if (!cleanEmail || !password || !confirmPassword) {
      setErrorMsg("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (res.user) {
        await syncUserToBackend(res.user);
      }
      nav("/home");
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-box">
        {/* ── Alert Box ── */}
        {errorMsg && (
          <div className="alert-box alert-error" style={{ marginBottom: "20px" }}>
            <FiAlertCircle style={{ fontSize: "18px", flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── Logo ── */}
        <div style={{ marginBottom: "28px" }}>
          <img
            src="/logo-icon.png"
            alt="NovaChat Logo"
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              margin: "0 auto 16px",
              display: "block",
              boxShadow: "0 8px 24px rgba(71, 191, 255, 0.35)",
            }}
          />
          <h2 style={{ marginBottom: "4px" }}>Create account</h2>
          <p style={{ color: "#555", fontSize: "13px", margin: 0 }}>Join NovaChat — it&apos;s free</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <FiMail style={{ marginRight: "5px", verticalAlign: "middle", color: "#555" }} />
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setErrorMsg(""); }}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>
              <FiLock style={{ marginRight: "5px", verticalAlign: "middle", color: "#555" }} />
              Password
            </label>
            <PasswordInput
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
              required
              disabled={loading}
              ariaLabel="Password"
            />
          </div>

          <div className="form-group">
            <label>
              <FiLock style={{ marginRight: "5px", verticalAlign: "middle", color: "#555" }} />
              Confirm Password
            </label>
            <PasswordInput
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(""); }}
              required
              disabled={loading}
              ariaLabel="Confirm Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.6 : 1 }}
          >
            <FiUserPlus /> {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0", color: "#333", fontSize: "12px" }}>
            <div style={{ flex: 1, height: "1px", background: "#1e1e1e" }} />
            Already have an account?
            <div style={{ flex: 1, height: "1px", background: "#1e1e1e" }} />
          </div>

          <button
            type="button"
            onClick={() => nav("/login")}
            style={{ background: "transparent", border: "1px solid #262626", color: "#a8a8a8" }}
          >
            Sign In Instead
          </button>
        </form>
      </div>
    </div>
  );
}

export default Signup;