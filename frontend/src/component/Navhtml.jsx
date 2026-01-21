import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";
// ✅ Import ko ensure karein ki file name folder mein exact 'dharasakti.png' hi ho
import dharasakti from "./dharasakti.png"; 
import DashboardSidebar from "./Dashboard/DashboardSidebar";

export default function Navbar({ user, setUser }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();

  const forceLogout = (reason) => {
    if (reason) alert(reason);
    localStorage.removeItem("user");
    setUser(null);
    setShowSidebar(false);
    navigate("/login");
  };

  // ✅ Profile Image Fix for Production (Vercel)
  const getProfileImage = () => {
    if (user?.photo && user.photo.startsWith("http")) {
      return user.photo;
    }
    // Default placeholder agar user photo missing ho
    return "https://i.imgur.com/6VBx3io.png"; 
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          {user ? (
            <div
              className="sidebar-trigger"
              onClick={() => setShowSidebar(true)}
              style={{ cursor: "pointer" }}
            >
              ☰ <span className="dash-text">Dashboard</span>
            </div>
          ) : (
            <img
              src={dharasakti}
              alt="Logo"
              className="logo"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
              // ✅ Fallback logic agar image path production mein na mile
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
          )}
        </div>

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          {user?.role === "Admin" && (
            <li>
              <Link to="/master-panel" style={{ color: "#fbbf24", fontWeight: "bold" }}>
                🛡️ Master Control
              </Link>
            </li>
          )}
        </ul>

        <div className="nav-right">
          {user ? (
            <div
              className="nav-profile"
              onClick={() => navigate("/profile")}
              title="My Profile"
              style={{ cursor: "pointer" }}
            >
              <img
                src={getProfileImage()}
                alt="profile"
                // ✅ Error handling: agar DB ka image URL break ho jaye
                onError={(e) => { e.target.src = "https://i.imgur.com/6VBx3io.png"; }}
              />
            </div>
          ) : (
            <button className="nav-btn login" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>
      </nav>

      <div
        className={`sidebar-overlay ${showSidebar ? "active" : ""}`}
        onClick={() => setShowSidebar(false)}
      >
        <div className="sidebar-content" onClick={(e) => e.stopPropagation()}>
          <div className="sidebar-header">
            <h3 className="DharashaktiH3">Dharashakti</h3>
            <button className="close-btn" onClick={() => setShowSidebar(false)}>✖</button>
          </div>
          <DashboardSidebar closeSidebar={() => setShowSidebar(false)} />
        </div>
      </div>
    </>
  );
}