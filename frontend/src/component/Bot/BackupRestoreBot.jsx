import React, { useState, useCallback } from 'react';
import axios from 'axios';
import './Bot.css';

const BackupRestoreBot = () => {
  const [status, setStatus] = useState({ loading: false, currentTask: '', progress: 0 });
  const [logs, setLogs] = useState([]);
  const [backupData, setBackupData] = useState(null);
  
  const [selectedTasks, setSelectedTasks] = useState({
    suppliers: true, employees: true, purchases: true, sales: true, attendances: true
  });

  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const taskMap = [
    { key: 'suppliers', label: 'Suppliers/Parties', url: '/suppliers/add' },
    { key: 'employees', label: 'Employees List', url: '/employees' },
    { key: 'purchases', label: '/purchases' }, // Ensure this matches your purchase route
    { key: 'sales', label: 'Sales Records', url: '/sales' },
    { key: 'attendances', label: 'Attendance', url: '/attendance' }
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.collections) {
          setBackupData(data.collections);
          setLogs(["📁 File loaded successfully. Ready for 3D Sync."]);
        }
      } catch (err) {
        alert("Invalid JSON format!");
      }
    };
    reader.readAsText(file);
  };

  const startRestoration = async () => {
    if (!backupData) return alert("Pehle file upload karein!");
    
    setStatus({ loading: true, currentTask: 'Initializing...', progress: 0 });
    setLogs(["🚀 Bot started... Navigating through dimensions"]);

    for (const task of taskMap) {
      if (!selectedTasks[task.key]) {
        setLogs(prev => [`⏭️ Skipped ${task.label}`, ...prev]);
        continue;
      }

      const items = backupData[task.key] || [];
      if (items.length === 0) continue;

      setLogs(prev => [`📡 Syncing ${task.label}...`, ...prev]);

      for (let i = 0; i < items.length; i++) {
        try {
          const { _id, __v, createdAt, updatedAt, ...cleanData } = items[i];
          await axios.post(`${BASE_URL}${task.url}`, cleanData);
          setLogs(prev => [`✅ SUCCESS: ${cleanData.billNo || cleanData.name || i+1}`, ...prev].slice(0, 30));
        } catch (err) {
          setLogs(prev => [`❌ ERROR: ${err.response?.data?.message || err.message}`, ...prev]);
        }
        // Small delay for smooth animation look
        await new Promise(r => setTimeout(r, 200));
      }
    }

    setStatus({ loading: false, currentTask: 'Finished!', progress: 100 });
    alert("Full System Data Restored! ✅");
  };

  return (
    <div className="bot-container">
      <div className="bot-3d-card">
        <h2 className="bot-title">
          Dharashakti Admin Bot <span className="version-tag">v2.0</span>
        </h2>

        {/* 1. 3D Upload Box */}
        <div className="bot-section-3d">
          <label className="section-label">1. Upload Backup (.json)</label>
          <div className="neo-input-wrapper">
            <input type="file" accept=".json" onChange={handleFileUpload} className="neo-file-input" />
          </div>
        </div>

        {/* 2. Neumorphic Category Selection */}
        <div className="bot-section-3d">
          <label className="section-label">2. Select Entities to Sync</label>
          <div className="neo-grid">
            {taskMap.map(task => (
              <div 
                key={task.key} 
                className={`neo-checkbox-card ${selectedTasks[task.key] ? 'active' : ''}`}
                onClick={() => setSelectedTasks(p => ({...p, [task.key]: !p[task.key]}))}
              >
                <div className="neo-check-indicator"></div>
                <span className="neo-label">{task.label}</span>
                <span className="neo-count">[{backupData?.[task.key]?.length || 0}]</span>
              </div>
            ))}
          </div>
          
          <button 
            onClick={startRestoration}
            disabled={status.loading || !backupData}
            className={`bot-3d-btn ${status.loading ? 'btn-loading' : ''}`}
          >
            {status.loading ? 'CORE SYNCING...' : 'START SMART SYNC'}
          </button>
        </div>

        {/* 3. Matrix Style Logs */}
        <div className="bot-logs-container">
          <div className="logs-header">// SYSTEM_REALTIME_LOGS</div>
          <div className="logs-screen">
            {logs.map((log, i) => (
              <div key={i} className="log-line animate-log">{`> ${log}`}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestoreBot;