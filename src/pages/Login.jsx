import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Form.css";
import PasswordInput from "../components/PasswordInput";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, formatAuthError } from "./Firebase";
import { FiMail, FiLock, FiLogIn, FiAlertCircle } from "react-icons/fi";
import api from "../api";

function Login() {
  let [username, setUsername] = useState("");
  let [password, setPassword] = useState("");
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

    if (!cleanEmail || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
      if (res.user) {
        await syncUserToBackend(res.user);
      }
      nav("/home");
    } catch (error) {
      setErrorMsg(formatAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-box">
        {/* ── Alert Box ── */}
        {errorMsg && (
          <div
            className="alert-box alert-error"
            style={{
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textAlign: "left"
            }}
          >
            <FiAlertCircle style={{ fontSize: "18px", flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── Logo ── */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            width: "56px", height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
            margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(193,53,132,0.4)",
          }}>
            <span style={{ fontSize: "26px" }}>💬</span>
          </div>
          <h2 style={{ marginBottom: "4px" }}>Welcome back</h2>
          <p style={{ color: "#555", fontSize: "13px", margin: 0 }}>Sign in to your NovaChat account</p>
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
              required
              disabled={loading}
              ariaLabel="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.6 : 1 }}
          >
            <FiLogIn /> {loading ? "Signing in..." : "Sign In"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0", color: "#333", fontSize: "12px" }}>
            <div style={{ flex: 1, height: "1px", background: "#1e1e1e" }} />
            OR
            <div style={{ flex: 1, height: "1px", background: "#1e1e1e" }} />
          </div>

          <div className="button-group">
            <button
              type="button"
              onClick={() => nav("/forgot")}
              style={{ background: "transparent", border: "1px solid #262626", color: "#fcb045" }}
            >
              Forgot Password?
            </button>

            <button
              type="button"
              onClick={() => nav("/")}
              style={{ background: "transparent", border: "1px solid #262626", color: "#4ade80" }}
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;