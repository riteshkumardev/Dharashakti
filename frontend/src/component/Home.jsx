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
  const [allSales, setAllSales] = useState([]); // Sales alerts ke liye
  const [allPurchases, setAllPurchases] = useState([]); // Purchase alerts ke liye
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
        
        // Sales, Purchases aur Stocks teeno ka data parallel fetch ho raha hai
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
        console.error("Dashboard data load error:", err);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };

    fetchDashboardData();
  }, [API_URL]);

  // Alert click par sahi page par bhejne ka logic
  const handleAlertAction = (item, type) => {
    if (type === 'SALE') {
      navigate("/invoices"); 
    } else {
      navigate("/purchase-list"); // Ya aapka purchase history route
    }
  };

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
          <p>Dhara Shakti Agro dashboard is synced live.</p>
        </div>
      </section>

      {/* 🚩 Payment Alerts Section (Sales & Purchase Integrated) */}
      <section style={{ padding: "0 20px" }}>
        <OverdueAlerts 
          salesData={allSales} 
          purchaseData={allPurchases} // Purchase data pass kiya
          daysLimit={10} 
          onViewDetails={handleAlertAction} 
        />
      </section>

      {/* Stats Cards Section */}
      <section className="features">
        <div className="feature-card" onClick={() => navigate("/invoices")} style={{cursor: 'pointer'}}>
          <div className="card-icon">📈</div>
          <h3>Total Sales</h3>
          <p className="stat-number">{stats.salesCount}</p>
          <small>Total Invoices</small>
        </div>
        
        <div className="feature-card" onClick={() => navigate("/purchase-list")} style={{cursor: 'pointer'}}>
          <div className="card-icon">🛒</div>
          <h3>Total Purchases</h3>
          <p className="stat-number">{stats.purchaseCount}</p>
          <small>Stock Inward Entries</small>
        </div>

        <div className="feature-card" onClick={() => navigate("/stocks")} style={{cursor: 'pointer'}}>
          <div className="card-icon">📦</div>
          <h3>Stock Items</h3>
          <p className="stat-number">{stats.stockCount}</p>
          <small>Live Inventory</small>
        </div>

        <div className="feature-card">
          <div className="card-icon">👤</div>
          <h3>Role</h3>
          <p className="stat-number" style={{ fontSize: '20px' }}>{user?.role}</p>
          <small>Access: {user?.role === 'Admin' ? 'Full' : 'Limited'}</small>
        </div>
      </section>
  
    </div>
  );
};

export default Home;