import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, update, push } from "firebase/database";
import { useNavigate } from "react-router-dom"; 
import { app } from "../../redux/api/firebase/firebase";
import Loader from "../Core_Component/Loader/Loader"; // ✅ Correct Import
import './MasterPanel.css';

const MasterPanel = ({ user }) => { 
  const db = getDatabase(app);
  const navigate = useNavigate(); 
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);
  
  // ⏳ Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // 1. Users loading logic
    const userRef = ref(db, "employees");
    const unsubUsers = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(Object.keys(data).map(k => ({ firebaseId: k, ...data[k] })));
      }
      // Fake delay for smooth UI feel
      setTimeout(() => setLoading(false), 800);
    });

    // 2. Activity Logs
    const logRef = ref(db, "activityLogs");
    const unsubLogs = onValue(logRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logList = Object.values(data).reverse(); 
        setLogs(logList);
      }
    });

    return () => {
      unsubUsers();
      unsubLogs();
    };
  }, [db]);

  const handleSystemUpdate = async (targetId, targetName, field, value) => {
    setActionLoading(true); // Action shuru
    try {
      await update(ref(db, `employees/${targetId}`), { [field]: value });

      const logPushRef = ref(db, 'activityLogs');
      await push(logPushRef, {
        adminName: user?.name || "Super Admin", 
        action: `${field.toUpperCase()} changed to ${value} for ${targetName}`,
        time: new Date().toLocaleString(),
        timestamp: Date.now()
      });

      // Role change ya block hone par alert
      console.log("System Updated");
    } catch (err) {
      alert("System Error: " + err.message);
    } finally {
      setActionLoading(false); // Action khatam
    }
  };

  const filtered = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.employeeId?.toString().includes(search)
  );

  // ✅ Global Loader (Pehli baar page khulne par)
  if (loading) return <Loader />;

  return (
    <div className="master-panel-page">
      {/* Action Loader Overlay (Jab block/role change ho raha ho) */}
      {actionLoading && (
        <div className="action-loader-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <Loader />
        </div>
      )}

      <div className="master-hero">
        <div className="hero-text">
          <h1>🛡️ Master Admin Control</h1>
          <p>Global system management and security logs</p>
        </div>

        <div className="admin-actions-area" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search System Users..." 
            className="master-search-bar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ margin: 0 }} 
          />
          
          <button 
            className="master-register-btn"
            onClick={() => navigate("/employee-add")} 
            style={{
              padding: '12px 20px',
              backgroundColor: '#fbbf24', 
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            + Add New Staff
          </button>
        </div>
      </div>

      <div className="master-main-layout">
        <div className="users-grid-section">
          {filtered.length > 0 ? filtered.map(userItem => (
            <div key={userItem.firebaseId} className={`user-control-card ${userItem.isBlocked ? 'is-blocked' : ''}`}>
              <div className="card-header">
                <div className="user-profile-img">
                   {userItem.photo ? <img src={userItem.photo} alt="p" /> : (userItem.name?.charAt(0) || "?")}
                </div>
                <div className="user-basic-info">
                   <h3>{userItem.name}</h3>
                   <span>Emp ID: {userItem.employeeId}</span>
                </div>
                <div className={`role-pill ${userItem.role?.toLowerCase()}`}>{userItem.role || 'Worker'}</div>
              </div>

              <div className="control-body">
                <div className="input-group">
                  <label>Assign Security Role</label>
                  <select 
                    value={userItem.role || 'Worker'} 
                    onChange={(e) => handleSystemUpdate(userItem.firebaseId, userItem.name, 'role', e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Worker">Worker</option>
                  </select>
                </div>

                <button 
                  className={`access-toggle-btn ${userItem.isBlocked ? 'btn-enable' : 'btn-disable'}`}
                  onClick={() => handleSystemUpdate(userItem.firebaseId, userItem.name, 'isBlocked', !userItem.isBlocked)}
                  disabled={actionLoading}
                >
                  {userItem.isBlocked ? '🔓 Restore Access' : '🚫 Terminate Access'}
                </button>
              </div>
            </div>
          )) : (
            <div className="no-data-msg">No users found matching your search.</div>
          )}
        </div>

        <div className="activity-logs-sidebar">
          <h3>🕒 Recent Activity</h3>
          <div className="logs-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {logs.length > 0 ? logs.slice(0, 15).map((log, i) => (
              <div key={i} className="log-entry" style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <strong style={{ fontSize: '13px' }}>{log.adminName}</strong>
                <p style={{ fontSize: '12px', margin: '4px 0', color: '#444' }}>{log.action}</p>
                <small style={{ fontSize: '10px', color: '#888' }}>{log.time}</small>
              </div>
            )) : <p style={{fontSize: '12px', color: '#999'}}>No logs available.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterPanel;