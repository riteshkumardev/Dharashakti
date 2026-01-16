import React, { useState, useEffect } from "react";
import axios from "axios"; 
import Loader from "./Core_Component/Loader/Loader";
import { useNavigate } from "react-router-dom";
import "../App.css";
import OverdueAlerts from "./Core_Component/Alert/OverdueAlerts";

const Home = ({ user }) => {
  const navigate = useNavigate();
  
  // 📊 States
  const [stats, setStats] = useState({ salesCount: 0, purchaseCount: 0, stockCount: 0 });
  const [allSales, setAllSales] = useState([]); 
  const [allPurchases, setAllPurchases] = useState([]); 
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // 🛡️ Helper: ID Masking
  const maskID = (id) => {
    if (!id) return "--------";
    const strID = id.toString();
    return strID.length > 4 ? "XXXX" + strID.slice(-4) : strID;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // parallel fetch for speed
        const [salesRes, purchaseRes, stockRes] = await Promise.all([
          axios.get(`${API_URL}/api/sales`),
          axios.get(`${API_URL}/api/purchases`),
          axios.get(`${API_URL}/api/stocks`)
        ]);

        const salesData = salesRes.data.data || [];
        const purchaseData = purchaseRes.data.data || [];
        
        setAllSales(salesData);
        setAllPurchases(purchaseData);

        setStats({
          salesCount: salesData.length,
          purchaseCount: purchaseData.length,
          stockCount: stockRes.data.data?.length || 0
        });

      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };

    fetchDashboardData();
  }, [API_URL]);

  // Navigation Logic
  const handleNavigate = (path) => {
    navigate(path);
  };

  if (loading) return <Loader />;

  return (
    <div className="home-container">
      
      {/* 🚀 Profile Section */}
      <div className="floating-profile-card">
        <div className="mini-info">
          <h4>{user?.name || "User"}</h4>
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

      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome, <span className="highlight">{user?.name || "Guest"}</span></h1>
          <p>Dhara Shakti Agro live control panel.</p>
        </div>
      </section>

      {/* 🚩 Payment Alerts */}
      <section style={{ padding: "0 20px" }}>
        <OverdueAlerts 
          salesData={allSales} 
          purchaseData={allPurchases} 
          daysLimit={10} 
          onViewDetails={(item, type) => handleNavigate(type === 'SALE' ? "/invoices" : "/purchase-list")} 
        />
      </section>

      {/* 📈 Stats Cards (Clickable to Tables) */}
      <section className="features">
        
        <div className="feature-card clickable-card" onClick={() => handleNavigate("/sales-table")}>
          <div className="card-icon">📈</div>
          <h3>Total Sales</h3>
          <p className="stat-number">{stats.salesCount}</p>
          <small>Click to view Sales Table</small>
        </div>
        
        <div className="feature-card clickable-card" onClick={() => handleNavigate("/purchase-table")}>
          <div className="card-icon">🛒</div>
          <h3>Total Purchases</h3>
          <p className="stat-number">{stats.purchaseCount}</p>
          <small>Click to view Purchase Table</small>
        </div>

        <div className="feature-card clickable-card" onClick={() => handleNavigate("/stock-management")}>
          <div className="card-icon">📦</div>
          <h3>Stock Items</h3>
          <p className="stat-number">{stats.stockCount}</p>
          <small>Click to view Inventory</small>
        </div>

        <div className="feature-card">
          <div className="card-icon">👤</div>
          <h3>User Authority</h3>
          <p className="stat-number" style={{ fontSize: '20px' }}>{user?.role}</p>
          <small>{user?.role === 'Admin' ? 'Full System Access' : 'View Only Access'}</small>
        </div>

      </section>
  
    </div>
  );
};

export default Home;