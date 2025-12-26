import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { app } from "../redux/api/firebase/firebase";
import "../App.css";
import dharasakti from "../component/dharasakti.png";
import DashboardSidebar from "./Dashboard/DashboardSidebar";

export default function Navbar({ user, setUser }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();
  const db = getDatabase(app);

  // 🔓 FORCE LOGOUT (SESSION HIJACK / BLOCK CASE)
  const forceLogout = (reason) => {
    if (reason) alert(reason);
    localStorage.removeItem("user");
    setUser(null);
    setShowSidebar(false);
    navigate("/login");
  };

  // 🔐 SESSION LISTENER (ONE ID → ONE LOGIN)
  useEffect(() => {
    if (!user?.firebaseId || !user?.currentSessionId) return;

    const sessionRef = ref(
      db,
      `employees/${user.firebaseId}/currentSessionId`
    );

    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const activeSessionId = snapshot.val();

      if (
        activeSessionId &&
        activeSessionId !== user.currentSessionId
      ) {
        forceLogout("⚠️ This ID was logged in on another device.");
      }
    });

    return () => off(sessionRef);
  }, [user?.firebaseId, user?.currentSessionId]);

  return (
    <>
      {/* 🔷 NAVBAR */}
      <nav className="navbar">
        {/* LEFT */}
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

        {/* CENTER */}
        <ul className="nav-links">
          <li>
            <Link to="/">Home</Link>
          </li>

          {user?.role === "Admin" && (
            <li>
              <Link
                to="/master-panel"
                style={{ color: "#fbbf24", fontWeight: "bold" }}
              >
                🛡️ Master Control
              </Link>
            </li>
          )}
        </ul>

        {/* RIGHT */}
        <div className="nav-right">
          {user ? (
            <div
              className="nav-profile"
              onClick={() => navigate("/profile")}
              title="My Profile"
              style={{ cursor: "pointer" }}
            >
              <img
                src={
                  user.photoURL ||
                  "https://i.imgur.com/6VBx3io.png"
                }
                alt="profile"
              />
            </div>
          ) : (
            <button
              className="nav-btn login"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {/* 🔷 SIDEBAR OVERLAY */}
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
            <button
              className="close-btn"
              onClick={() => setShowSidebar(false)}
            >
              ✖
            </button>
          </div>

          <DashboardSidebar
            closeSidebar={() => setShowSidebar(false)}
          />
        </div>
      </div>
    </>
  );
}
