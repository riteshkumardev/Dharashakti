import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

// 1. Image import fix: Case check karein (kya file ka naam Dharasakti.png toh nahi?)
import dharasakti from "./dharasakti.png"; 
import DashboardSidebar from "./Dashboard/DashboardSidebar";

export default function Navbar({ user, setUser }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();

  // 2. Profile Image logic update: Null check aur fallback image
  const getProfileImage = () => {
    // Agar user logged in hai aur uski photo exist karti hai
    if (user && user.photo) {
      return user.photo;
    }
    // Default system placeholder
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
              // 3. Logo Error Handling: Agar vercel par import fail ho
              onError={(e) => {
                console.log("Logo load failed on Vercel");
                e.target.style.display = 'none';
              }} 
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
                // 4. Image Fallback: Agar URL break ho jaye
                onError={(e) => {
                  e.target.src = "https://i.imgur.com/6VBx3io.png";
                }}
              />
            </div>
          ) : (
            <button className="nav-btn login" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Sidebar logic... */}
      <div className={`sidebar-overlay ${showSidebar ? "active" : ""}`} onClick={() => setShowSidebar(false)}>
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