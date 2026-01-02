import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom"; 
import axios from "axios"; // Firebase hata kar Axios use karenge
import Loader from "../Core_Component/Loader/Loader"; 
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar"; 
import './MasterPanel.css';

const MasterPanel = ({ user }) => { 
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

  // --- 🛠️ Fetch Users and Logs from MongoDB ---
  const fetchData = async () => {
    try {
      setLoading(true);
      // Backend routes jo aapne banaye hain
      const usersRes = await axios.get("http://localhost:5000/api/employees");
      const logsRes = await axios.get("http://localhost:5000/api/activity-logs"); // Ensure ye route backend me ho

      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (logsRes.data.success) setLogs(logsRes.data.data);
      
    } catch (err) {
      showMsg("Data Load Failed: " + err.message, "error");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 🔑 Password Reset Logic (MongoDB) ---
  const handlePasswordReset = async (employeeId, targetName) => {
    const newPass = window.prompt(`Enter new password for ${targetName}:`);
    
    if (!newPass) return;
    if (newPass.length < 4) return showMsg("Password too short (Min 4 chars)", "error");

    setActionLoading(true);
    try {
      // API call to profile.controller.js -> changePassword
      await axios.put("http://localhost:5000/api/profile/password", {
        employeeId: employeeId,
        password: newPass
      });

      showMsg(`Password for ${targetName} updated!`, "success");
      fetchData(); // Refresh list to show logs
    } catch (err) {
      showMsg("Reset Failed: " + err.response?.data?.message || err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- 🛡️ Role & Access Toggle Logic (MongoDB) ---
  const handleSystemUpdate = async (employeeId, targetName, field, value) => {
    setActionLoading(true);
    try {
      // Dynamic update route
      await axios.put(`http://localhost:5000/api/employees/${employeeId}`, {
        [field]: value,
        adminAction: true, // Backend logic ke liye flag
        adminName: user?.name
      });

      showMsg(`System Updated: ${field.toUpperCase()} set to ${value}`, "success");
      fetchData(); // UI refresh
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
        <div className="action-loader-overlay">
          <Loader />
        </div>
      )}

      <div className="master-hero">
        <div className="hero-text">
          <h1>🛡️ Master Admin Control</h1>
          <p>Global system management (MongoDB Engine)</p>
        </div>

        <div className="admin-actions-area">
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
            // MongoDB me '_id' ya 'employeeId' use hota hai firebaseId ki jagah
            <div key={userItem._id} className={`user-control-card ${userItem.isBlocked ? 'is-blocked' : ''}`}>
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
                    onChange={(e) => handleSystemUpdate(userItem.employeeId, userItem.name, 'role', e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Worker">Worker</option>
                  </select>
                </div>

                <div className="button-actions-group">
                    <button 
                      className="reset-pass-btn"
                      onClick={() => handlePasswordReset(userItem.employeeId, userItem.name)}
                    >
                      🔑 Reset Password
                    </button>

                    <button 
                      className={`access-toggle-btn ${userItem.isBlocked ? 'btn-enable' : 'btn-disable'}`}
                      onClick={() => handleSystemUpdate(userItem.employeeId, userItem.name, 'isBlocked', !userItem.isBlocked)}
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
                <small>{new Date(log.createdAt).toLocaleString()}</small>
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