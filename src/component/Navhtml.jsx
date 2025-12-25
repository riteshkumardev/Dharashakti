import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";
import dharasakti from "../component/dharasakti.png";
import DashboardSidebar from "./Dashboard/DashboardSidebar";

// ✅ Redux hata diya gaya hai, user props ke zariye aa raha hai
export default function Navbar({ user, setUser }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();

  // ✅ Manual Logout Logic (LocalStorage + State Clear)
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null); // App.js ki state ko null karega, jisse button turant badlega
    setShowSidebar(false);
    navigate("/login");
  };

  return (
    <>
      <nav className="navbar">
        {/* LEFT: Logo or Dashboard Trigger */}
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
            />
          )}
        </div>

        {/* CENTER: Navigation Links */}
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          
          {/* ⭐ Admin Only: Master Panel Link */}
          {user?.role === 'Admin' && (
            <li>
              <Link to="/master-panel" style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                🛡️ Master Control
              </Link>
            </li>
          )}
        </ul>

        {/* RIGHT: Auth Buttons (Desktop) */}
        <div className="nav-right desktop-only">
          {user ? (
            <div className="user-nav-box">
              
              <button className="nav-btn logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button className="nav-btn login" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>
      </nav>

      {/* SIDEBAR OVERLAY */}
      <div
        className={`sidebar-overlay ${showSidebar ? "active" : ""}`}
        onClick={() => setShowSidebar(false)}
      >
        <div
          className="sidebar-content"
          onClick={(e) => e.stopPropagation()}
        >
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