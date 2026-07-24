import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Form.css";
import "./Home.css";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { FiSend, FiCamera, FiUser, FiLogOut } from "react-icons/fi";
import { RiSparklingFill } from "react-icons/ri";
import { io } from "socket.io-client";
import api, { API_BASE_URL } from "../api";

let socket = io(API_BASE_URL);

function Home(){

  let [chat, setChat] = useState([]);
  let [message, setMessage] = useState("");
  let [username, setUsername] = useState(null);
  let [photoURL, setPhotoURL] = useState(null);
  let endRef = useRef(null);

  let auth = getAuth();
  let nav = useNavigate();

  useEffect(() => {
    function checkUser(user) {
      if (!user) {
        nav("/login");
      } else {
        setUsername(user.email);
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
    }

    let stopWatching = onAuthStateChanged(auth, checkUser);
    return () => stopWatching();
  }, [auth, nav]);

  useEffect(() => {
    socket.on("history", (data) => setChat(data));
    socket.emit("getHistory");

    socket.on("message", (data) => setChat((prev) => [...prev, data]));
    
    return () => {
      socket.off("history");
      socket.off("message");
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("[Logout] signOut error:", err);
    }
    // Clear all stored state so the next user starts fresh
    localStorage.clear();
    sessionStorage.clear();
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    nav("/login");
  }

  function sendMessage() {
    if (username && message.trim()) {
      socket.emit("message", { username, message, photoURL });
      setMessage("");
    }
  }

  function getInitial(email) {
    return email ? email[0].toUpperCase() : "?";
  }

  return (
    <div className="container">
      <div className="form-box" style={{ width: "480px" }}>
        
        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "22px" }}>
            NovaChat <RiSparklingFill />
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
                flexShrink: 0,
              }}>
                {getInitial(username)}
              </div>
            )}
            <span style={{ fontSize: "12px", color: "#737373", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {username}
            </span>
          </div>
        </div>

        {/* ── Nav Buttons ── */}
        <div className="button-group">
          <button onClick={() => nav("/profile")} style={{ background: "transparent" }}>
            <FiUser style={{ marginRight: "5px", verticalAlign: "middle" }} />
            Profile
          </button>

          <button onClick={() => nav("/photos")} style={{ background: "transparent" }}>
            <FiCamera style={{ marginRight: "5px", verticalAlign: "middle" }} />
            Snaps
          </button>

          <button onClick={handleLogout} style={{ background: "transparent" }}>
            <FiLogOut style={{ marginRight: "5px", verticalAlign: "middle" }} />
            Logout
          </button>
        </div>

        {/* ── Chat Box ── */}
        <div className="chat-box">
          <div className="chat-messages">
            {chat.length === 0 && (
              <div className="chat-empty">
                <RiSparklingFill style={{ fontSize: "32px", opacity: 0.3, color: "#c13584" }} />
                <p style={{ fontSize: "13px", color: "#333", marginTop: "8px" }}>No messages yet. Say something! 👋</p>
              </div>
            )}
            {chat.map((data, index) => {
              let isSelf = data.username === username;
              let msgPhoto = isSelf ? (photoURL || data.photoURL) : data.photoURL;

              return (
                <div
                  key={index}
                  className={`chat-row ${isSelf ? "sent" : "received"}`}
                >
                  <div className="chat-sender" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {msgPhoto ? (
                      <img
                        src={msgPhoto}
                        alt="avatar"
                        style={{ width: "16px", height: "16px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : null}
                    <span>{isSelf ? "You" : data.username}</span>
                  </div>
                  <span className={`chat-bubble ${isSelf ? "sent" : "received"}`}>
                    {data.message}
                  </span>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div className="chat-input-area">
            <div className="chat-input-row">
              <input
                type="text"
                className="chat-input"
                placeholder="Message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              />
              <button className="send-btn" onClick={sendMessage}>
                <FiSend style={{ color: 'inherit' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
