import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, update, push } from "firebase/database";
import { useNavigate } from "react-router-dom"; 
import { app } from "../../redux/api/firebase/firebase";
import Loader from "../Core_Component/Loader/Loader"; 
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar"; 
import './MasterPanel.css';

const MasterPanel = ({ user }) => { 
  const db = getDatabase(app);
  const navigate = useNavigate(); 
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  useEffect(() => {
    setLoading(true);
    const userRef = ref(db, "employees");
    const unsubUsers = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(Object.keys(data).map(k => ({ firebaseId: k, ...data[k] })));
      }
      setTimeout(() => setLoading(false), 800);
    });

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

  // --- 🛠️ Password Reset Function ---
  const handlePasswordReset = async (targetId, targetName) => {
    const newPass = window.prompt(`Enter new password for ${targetName}:`);
    
    if (!newPass) return; // Agar cancel kiya ya khali chhoda
    if (newPass.length < 4) return showMsg("Password too short (Min 4 chars)", "error");

    setActionLoading(true);
    try {
      await update(ref(db, `employees/${targetId}`), { password: newPass });

      // Log the activity
      await push(ref(db, 'activityLogs'), {
        adminName: user?.name || "Super Admin", 
        action: `PASSWORD RESET for ${targetName}`,
        time: new Date().toLocaleString(),
        timestamp: Date.now()
      });

      showMsg(`Password for ${targetName} changed successfully!`, "success");
    } catch (err) {
      showMsg("Reset Failed: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSystemUpdate = async (targetId, targetName, field, value) => {
    setActionLoading(true);
    try {
      await update(ref(db, `employees/${targetId}`), { [field]: value });

      await push(ref(db, 'activityLogs'), {
        adminName: user?.name || "Super Admin", 
        action: `${field.toUpperCase()} changed to ${value} for ${targetName}`,
        time: new Date().toLocaleString(),
        timestamp: Date.now()
      });

      showMsg(`System Updated: ${field.toUpperCase()} set to ${value}`, "success");
    } catch (err) {
      showMsg("System Error: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.employeeId?.toString().includes(search)
  );

  if (loading) return <Loader />;

  return (
    <div className="master-panel-page">
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
          />
          <button className="master-register-btn" onClick={() => navigate("/employee-add")}>
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

                <div className="button-actions-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* --- 🔑 New Reset Password Button --- */}
                    <button 
                      className="reset-pass-btn"
                      onClick={() => handlePasswordReset(userItem.firebaseId, userItem.name)}
                      style={{
                        padding: '10px',
                        backgroundColor: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      🔑 Reset Password
                    </button>

                    <button 
                      className={`access-toggle-btn ${userItem.isBlocked ? 'btn-enable' : 'btn-disable'}`}
                      onClick={() => handleSystemUpdate(userItem.firebaseId, userItem.name, 'isBlocked', !userItem.isBlocked)}
                      disabled={actionLoading}
                    >
                      {userItem.isBlocked ? '🔓 Restore Access' : '🚫 Terminate Access'}
                    </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="no-data-msg">No users found matching your search.</div>
          )}
        </div>

        <div className="activity-logs-sidebar">
          <h3>🕒 Recent Activity</h3>
          <div className="logs-list">
            {logs.length > 0 ? logs.slice(0, 15).map((log, i) => (
              <div key={i} className="log-entry">
                <strong>{log.adminName}</strong>
                <p>{log.action}</p>
                <small>{log.time}</small>
              </div>
            )) : <p>No logs available.</p>}
          </div>
        </div>
      </div>

      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </div>
  );
};

export default MasterPanel;