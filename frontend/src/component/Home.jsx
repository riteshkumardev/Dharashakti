import React, { useState, useEffect } from "react";
import axios from "axios"; // 🛠️ Firebase ki jagah Axios
import Loader from "./Core_Component/Loader/Loader";
import "../App.css";

const Home = ({ user }) => {
  // 📊 States
  const [stats, setStats] = useState({ sales: 0, stock: 0 });
  const [loading, setLoading] = useState(true);

  // 🛡️ Helper: ID Masking
  const maskID = (id) => {
    if (!id) return "--------";
    const strID = id.toString();
    return strID.length > 4 ? "XXXX" + strID.slice(-4) : strID;
  };

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        
        // 1️⃣ Backend se Sales aur Stock ka data ek sath fetch karna
        // Aapne jo pehle endpoints banaye hain wahi use honge
        const salesRes = await axios.get("http://localhost:5000/api/sales");
        const stockRes = await axios.get("http://localhost:5000/api/stocks");

        setStats({
          sales: salesRes.data.data?.length || 0,
          stock: stockRes.data.data?.length || 0
        });

      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        // Smooth UI feel ke liye 800ms ka delay
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchDashboardStats();
  }, []);

  // ✅ Global Loader check
  if (loading) return <Loader />;

  return (
    <div className="home-container">
      
      {/* 🚀 Floating Profile Card */}
      <div className="floating-profile-card">
        <div className="mini-info">
          <h4>{user?.name || "User Name"}</h4>
          <p className="emp-id-tag">ID: {maskID(user?.employeeId)}</p>
          <span className="badge">{user?.role || 'Staff'}</span>
        </div>
        <div className="avatar-box">
          {user?.photo ? (
            <img src={user.photo} alt="User" />
          ) : (
            <div className="letter-avatar">{user?.name?.charAt(0) || "U"}</div>
          )}
        </div>
      </div>

      {/* Hero Welcome Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome, <span className="highlight">{user?.name || "Guest"}</span></h1>
          <p>Your business dashboard is now synced live with <strong>MongoDB Engine</strong>.</p>
        </div>
      </section>

      {/* Stats Cards Section */}
      <section className="features">
        <div className="feature-card">
          <div className="card-icon">📈</div>
          <h3>Total Sales</h3>
          <p className="stat-number">{stats.sales}</p>
          <small>Updated just now</small>
        </div>
        
        <div className="feature-card">
          <div className="card-icon">📦</div>
          <h3>Total Stock Items</h3>
          <p className="stat-number">{stats.stock}</p>
          <small>Live Inventory</small>
        </div>

        <div className="feature-card">
          <div className="card-icon">👤</div>
          <h3>Access Level</h3>
          <p className="stat-number" style={{ fontSize: '20px' }}>{user?.role}</p>
          <small>System Role</small>
        </div>
      </section>
  
    </div>
  );
};

export default Home;