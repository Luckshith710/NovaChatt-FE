import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FiPlus, FiImage, FiHome, FiX } from "react-icons/fi";
import api from "../api";
import "./Form.css";
import "./Photos.css";

function Photos(){
  let [files, setFiles] = useState([]);
  let [file, setFile] = useState(null);
  let [caption, setCaption] = useState("");
  let [uploading, setUploading] = useState(false);
  let [showForm, setShowForm] = useState(false);
  let [email, setEmail] = useState(null);
  let [photoURL, setPhotoURL] = useState(null);
  let [preview, setPreview] = useState(null);
  let endRef = useRef(null);

  let auth = getAuth();
  let nav = useNavigate();

  useEffect(()=>{
    let unsubscribe = onAuthStateChanged(auth,(user)=>{
      if(!user) {
        nav("/login");
      } else {
        setEmail(user.email);
        if (user.photoURL) {
          setPhotoURL(user.photoURL);
        } else if (user.email) {
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
    return ()=>unsubscribe();
  } , [auth, nav] );

  let loadFiles = () => {
    api.get("/files")
      .then((res)=>setFiles(Array.isArray(res.data) ? res.data : []))
      .catch((err)=>alert(err.message || "Failed to load files"));
  };

  useEffect(()=>{
    loadFiles();
  } , [] );

  useEffect(()=>{
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  } , [files] );

  let closeForm = () => {
    setShowForm(false);
    setFile(null);
    setCaption("");
    setPreview(null);
  };

  let handleFileChange = (e) => {
    let selected = e.target.files[0];
    setFile(selected);
    if(selected){
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  };

  let handleUpload = (event) => {
    event.preventDefault();

    if(!file){
      alert("Please choose an image");
      return;
    }
    if(caption === ""){
      alert("Caption cannot be empty");
      return;
    }

    let formData = new FormData();
    formData.append("file", file);
    formData.append("caption", caption);
    formData.append("username", email || "Anonymous");

    setUploading(true);
    api.post("/upload", formData)
      .then(()=>{
        closeForm();
        loadFiles();
      })
      .catch((err)=>alert(err.message || "Failed to upload snap"))
      .finally(()=>setUploading(false));
  };

  let handleDelete = (id) => {
    api.delete(`/delete/${id}`)
      .then(()=>loadFiles())
      .catch((err)=>alert(err.message || "Failed to delete snap"));
  };

  let getInitial = (email) => email ? email[0].toUpperCase() : "?";

  return (
    <div className="container">
      <div className="form-box" style={{ width: "480px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ margin: 0 }}>
            <FiImage style={{ marginRight: "8px", verticalAlign: "middle", color: "#c13584" }} />
            Snaps
          </h2>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#1a1a1a",
            border: "1px solid #262626",
            borderRadius: "20px",
            padding: "5px 12px 5px 6px",
          }}>
            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile"
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                  border: "1px solid #833ab4"
                }}
              />
            ) : (
              <div style={{
                width: "26px", height: "26px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: "700", color: "#fff",
              }}>
                {getInitial(email)}
              </div>
            )}
            <span style={{ fontSize: "12px", color: "#737373", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email}
            </span>
          </div>
        </div>

        {/* ── Nav Buttons ── */}
        <div className="button-group">
          <button
            onClick={()=>setShowForm(true)}
            style={{
              background: "linear-gradient(135deg, #833ab4, #c13584)",
              border: "none",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              boxShadow: "0 4px 14px rgba(193,53,132,0.35)",
            }}
          >
            <FiPlus style={{ strokeWidth: 2.5 }} /> New Snap
          </button>

          <button
            onClick={()=>nav("/home")}
            style={{ background: "transparent", border: "1px solid #262626", color: "#737373" }}
          >
            <FiHome style={{ marginRight: "5px", verticalAlign: "middle" }} />
            Chat
          </button>
        </div>

        {/* ── Post Feed ── */}
        <div className="post-feed">
          {files.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "10px" }}>
              <FiImage style={{ fontSize: "36px", color: "#222" }} />
              <p style={{ fontSize: "13px", color: "#333" }}>No snaps yet. Add your first one! 📸</p>
            </div>
          )}
          {files.map((item)=>{
            let mine = item.username === email;
            return (
              <div className={`post-row ${mine ? "sent" : "received"}`} key={item._id}>
                <div className="post-sender">
                  {mine && photoURL ? (
                    <img
                      src={photoURL}
                      alt="avatar"
                      style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: "20px", height: "20px",
                      borderRadius: "50%",
                      background: mine
                        ? "linear-gradient(135deg, #833ab4, #c13584)"
                        : "#2a2a2a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "9px", fontWeight: "700", color: "#fff",
                      flexShrink: 0,
                      border: mine ? "none" : "1px solid #333",
                    }}>
                      {getInitial(item.username)}
                    </div>
                  )}
                  <span>{mine ? "You" : item.username}</span>
                  {mine && (
                    <button
                      className="post-delete"
                      onClick={()=>handleDelete(item._id)}
                    >
                      <FiX style={{ verticalAlign: "middle", marginRight: "2px" }} />
                      Delete
                    </button>
                  )}
                </div>
                <div className="post-bubble">
                  <img className="post-image" src={item.file_url} alt={item.caption} />
                  <div className="post-caption">{item.caption}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      {/* ── Upload Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-box" onClick={(e)=>e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeForm}
              style={{
                position: "absolute", top: "14px", right: "14px",
                width: "28px", height: "28px",
                padding: "0",
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "50%",
                color: "#737373",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <FiX />
            </button>

            <h2>
              <FiImage style={{ marginRight: "8px", verticalAlign: "middle", fontSize: "20px", color: "#c13584" }} />
              New Snap
            </h2>

            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Choose Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {/* Image Preview */}
              {preview && (
                <div style={{
                  marginBottom: "16px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid #262626",
                  aspectRatio: "4/3",
                }}>
                  <img
                    src={preview}
                    alt="Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Caption</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e)=>setCaption(e.target.value)}
                  placeholder="Write a caption..."
                />
              </div>

              <div className="button-group">
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
                    border: "none",
                    opacity: uploading ? 0.6 : 1,
                    cursor: uploading ? "not-allowed" : "pointer",
                  }}
                >
                  {uploading ? "Uploading..." : "Post Snap"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  style={{ background: "transparent", border: "1px solid #262626", color: "#555" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Photos;
