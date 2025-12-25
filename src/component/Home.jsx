import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from "firebase/database";

import { app } from "../redux/api/firebase/firebase";
import "../App.css";

const Home = ({ user }) => {
  const db = getDatabase(app);
  
  // 📊 Live stats state
  const [stats, setStats] = useState({
    sales: 0,
    stock: 0
  });

  useEffect(() => {
    // 1️⃣ Live Sales Counting
    const salesRef = ref(db, "sales");
    const unsubSales = onValue(salesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Object keys count karke total sales dikhana
        setStats(prev => ({ ...prev, sales: Object.keys(data).length }));
      } else {
        setStats(prev => ({ ...prev, sales: 0 }));
      }
    });

    // 2️⃣ Live Stock Counting
    const stockRef = ref(db, "stocks");
    const unsubStock = onValue(stockRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setStats(prev => ({ ...prev, stock: Object.keys(data).length }));
      } else {
        setStats(prev => ({ ...prev, stock: 0 }));
      }
    });

    // 🧹 Cleanup: Page change hone par listeners stop karna
    return () => {
      unsubSales();
      unsubStock();
    };
  }, [db]);

  return (
    <div className="home-container">
      
      {/* 🚀 Floating Profile Card (Right Side) */}
      <div className="floating-profile-card">
        <div className="mini-info">
          <h4>{user?.name || "User Name"}</h4>
          <p className="emp-id-tag">ID: {user?.employeeId || "--------"}</p>
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
          <p>Your business dashboard is now synced live with Firebase Realtime Database.</p>
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
          <h3>Total Stock</h3>
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