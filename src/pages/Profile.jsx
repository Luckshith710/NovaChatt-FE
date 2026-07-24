import { useNavigate } from "react-router-dom";
import "./Form.css";
import { getAuth, deleteUser, onAuthStateChanged, updatePassword, updateProfile } from "firebase/auth";
import { useState, useEffect } from "react";
import { FiLock, FiTrash2, FiHome, FiUser, FiShield, FiCamera, FiUploadCloud, FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";
import api from "../api";
import PasswordInput from "../components/PasswordInput";

function Profile(){

  let auth = getAuth();
  let nav = useNavigate();

  let [activeTab, setActiveTab] = useState(null);
  let [userEmail, setUserEmail] = useState("");
  let [photoURL, setPhotoURL] = useState(null);

  // Profile Picture Upload states
  let [selectedFile, setSelectedFile] = useState(null);
  let [preview, setPreview] = useState(null);
  let [uploading, setUploading] = useState(false);
  let [successMsg, setSuccessMsg] = useState("");
  let [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        nav("/login");
      } else {
        setUserEmail(user.email || "");
        if (user.photoURL) {
          setPhotoURL(user.photoURL);
        } else if (user.email) {
          // Fetch photoURL from backend if available
          api.get(`/users/${user.email}`)
            .then((res) => {
              if (res.data?.user?.photoURL) {
                setPhotoURL(res.data.user.photoURL);
              }
            })
            .catch(() => {});
        }
      }
    });
    return () => unsubscribe();
  }, [auth, nav]);

  let handleDeleteDetails = () => {
    setActiveTab("delete");
    setErrorMsg("");
    setSuccessMsg("");
  };

  let handleChangePassword = () => {
    setActiveTab("changePassword");
    setErrorMsg("");
    setSuccessMsg("");
  };

  let handleAvatarTab = () => {
    setActiveTab("avatar");
    setErrorMsg("");
    setSuccessMsg("");
  };

  let handleFileChange = (e) => {
    setErrorMsg("");
    setSuccessMsg("");
    let file = e.target.files[0];
    if (!file) return;

    // Validate format
    let allowedFormats = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedFormats.includes(file.type.toLowerCase())) {
      setErrorMsg("Invalid file format. Only JPG, JPEG, PNG, and WebP images are allowed.");
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File size exceeds 5MB limit. Please choose a smaller image.");
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  let handleUploadAvatar = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please select an image file to upload.");
      return;
    }

    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("email", userEmail);

      let res = await api.post("/users/profile-picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data && res.data.photoURL) {
        let newPhotoURL = res.data.photoURL;

        // Update Firebase Auth current user profile if available
        if (auth.currentUser) {
          try {
            await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
          } catch (fbErr) {
            console.warn("[Firebase Profile Sync Warning]:", fbErr);
          }
        }

        // Update UI state immediately
        setPhotoURL(newPhotoURL);
        setSuccessMsg("Profile picture updated successfully! ✨");
        setSelectedFile(null);
        setPreview(null);
        setActiveTab(null);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to upload profile picture. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  let handleSubmit = async (event) => {
    event.preventDefault();

    if(activeTab === "changePassword")
    {
      let newPassword = event.target.newPassword.value;
      let confirmPassword = event.target.confirmPassword.value;

      if(newPassword !== confirmPassword)
      {
        alert("Passwords don't match!");
        return;
      }

      updatePassword(auth.currentUser, newPassword)
      .then(()=>{
        alert("Password updated successfully ✅");
        setActiveTab(null);
      })
      .catch((error)=>alert(error.message || error))
      return;
    }

    if(activeTab === "delete")
    {
      if(event.target.confirmText.value !== "CONFIRM")
      {
        alert("Type CONFIRM to delete");
        return;
      }
      deleteUser(auth.currentUser)
      .then(()=>{
        alert("Account deleted.");
        nav("/login");
      })
      .catch((error)=>alert(error.message || error))
    }
  };

  let handleBackToHome = () => {
    nav("/home");
  };

  let initial = userEmail ? userEmail[0].toUpperCase() : "?";

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

        {/* ── Profile Header & Interactive Avatar ── */}
        <div style={{ marginBottom: "24px" }}>
          <div className="avatar-wrapper">
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">{initial}</div>
            )}
            <button
              type="button"
              className="avatar-edit-badge"
              title="Change Profile Picture"
              onClick={handleAvatarTab}
            >
              <FiCamera style={{ fontSize: "14px" }} />
            </button>
          </div>

          <h2 style={{ marginBottom: "4px" }}>
            <FiUser style={{ marginRight: "6px", verticalAlign: "middle", fontSize: "20px" }} />
            My Profile
          </h2>
          <p style={{
            color: "#555",
            fontSize: "12px",
            margin: 0,
            fontWeight: "500",
            letterSpacing: "0.2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {userEmail}
          </p>
        </div>

        {/* ── Action Buttons ── */}
        <div className="button-group" style={{ flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleAvatarTab}
              style={{
                background: activeTab === "avatar" ? "rgba(193,53,132,0.18)" : "transparent",
                border: "1px solid rgba(193,53,132,0.4)",
                color: "#c13584",
              }}
            >
              <FiCamera style={{ marginRight: "5px", verticalAlign: "middle" }} />
              Change Picture
            </button>

            <button
              onClick={handleChangePassword}
              style={{
                background: activeTab === "changePassword" ? "rgba(252,176,69,0.15)" : "transparent",
                border: "1px solid rgba(252,176,69,0.4)",
                color: "#fcb045",
              }}
            >
              <FiShield style={{ marginRight: "5px", verticalAlign: "middle" }} />
              Password
            </button>
          </div>

          <button
            onClick={handleDeleteDetails}
            style={{
              background: activeTab === "delete" ? "rgba(220,53,69,0.12)" : "transparent",
              border: "1px solid rgba(220,53,69,0.35)",
              color: "#f87171",
            }}
          >
            <FiTrash2 style={{ marginRight: "5px", verticalAlign: "middle" }} />
            Delete Account
          </button>
        </div>

        {/* ── Upload Profile Picture Form ── */}
        {activeTab === "avatar" && (
          <form onSubmit={handleUploadAvatar} style={{ marginTop: "22px", textAlign: "left" }}>
            <div style={{
              marginBottom: "14px",
              padding: "12px 14px",
              background: "rgba(193,53,132,0.08)",
              border: "1px solid rgba(193,53,132,0.25)",
              borderRadius: "10px"
            }}>
              <p style={{ fontSize: "12px", color: "#a8a8a8", margin: 0, lineHeight: "1.5" }}>
                Upload a JPG, PNG, or WebP profile image (max 5MB).
              </p>
            </div>

            <div className="form-group">
              <label>Select New Image</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileChange}
                style={{ cursor: "pointer" }}
              />
            </div>

            {/* Preview Box */}
            {preview && (
              <div style={{
                marginBottom: "16px",
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid #333",
                background: "#0c0c0c",
                padding: "10px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#fff" }}>
                    Image Preview
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#737373" }}>
                    Ready to upload
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setPreview(null); }}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "24px",
                    height: "24px",
                    padding: 0,
                    background: "transparent",
                    border: "none",
                    color: "#737373",
                    cursor: "pointer"
                  }}
                >
                  <FiX />
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {uploading && (
              <div style={{ margin: "12px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#c13584", marginBottom: "4px" }}>
                  <span>Uploading profile picture...</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: "100%", animation: "pulse 1.5s infinite" }} />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              style={{
                background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
                border: "none",
                opacity: (uploading || !selectedFile) ? 0.5 : 1,
                cursor: (uploading || !selectedFile) ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <FiUploadCloud /> {uploading ? "Uploading..." : "Save Profile Picture"}
            </button>
          </form>
        )}

        {/* ── Change Password Form ── */}
        {activeTab === "changePassword" && (
          <form onSubmit={handleSubmit} style={{ marginTop: "22px", textAlign: "left" }}>
            <div style={{ marginBottom: "12px", padding: "12px 14px", background: "rgba(252,176,69,0.06)", border: "1px solid rgba(252,176,69,0.15)", borderRadius: "10px" }}>
              <p style={{ fontSize: "12px", color: "#737373", margin: 0, lineHeight: "1.5" }}>
                <FiLock style={{ marginRight: "5px", verticalAlign: "middle", color: "#fcb045" }} />
                Choose a strong password with at least 6 characters.
              </p>
            </div>
            <div className="form-group">
              <label>New Password</label>
              <PasswordInput
                name="newPassword"
                placeholder="Enter new password"
                required
                ariaLabel="New Password"
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <PasswordInput
                name="confirmPassword"
                placeholder="Repeat new password"
                required
                ariaLabel="Confirm Password"
              />
            </div>
            <button type="submit" style={{
              background: "linear-gradient(135deg, rgba(252,176,69,0.8), rgba(253,29,29,0.6))",
              border: "none",
            }}>
              Update Password
            </button>
          </form>
        )}

        {/* ── Delete Account Form ── */}
        {activeTab === "delete" && (
          <form onSubmit={handleSubmit} style={{ marginTop: "22px", textAlign: "left" }}>
            <div style={{ marginBottom: "14px", padding: "14px", background: "rgba(220,53,69,0.07)", border: "1px solid rgba(220,53,69,0.2)", borderRadius: "10px" }}>
              <p style={{ color: "#f87171", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>
                ⚠️ This action is irreversible
              </p>
              <p style={{ color: "#555", fontSize: "12px", margin: 0, lineHeight: "1.6" }}>
                Deleting your account will permanently remove all your data. Type <strong style={{ color: "#f87171" }}>CONFIRM</strong> to proceed.
              </p>
            </div>
            <div className="form-group">
              <label>Confirm Deletion</label>
              <input
                type="text"
                name="confirmText"
                placeholder="Type CONFIRM"
                required
              />
            </div>
            <button type="submit" style={{
              background: "linear-gradient(135deg, rgba(220,53,69,0.85), rgba(185,28,28,0.9))",
              border: "none",
              boxShadow: "0 4px 16px rgba(220,53,69,0.3)",
            }}>
              Delete My Account
            </button>
          </form>
        )}

        {/* ── Back Button ── */}
        <button
          onClick={handleBackToHome}
          style={{
            marginTop: "20px",
            background: "transparent",
            border: "1px solid #262626",
            color: "#555",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <FiHome /> Back to Chat
        </button>
      </div>
    </div>
  );
}

export default Profile;
