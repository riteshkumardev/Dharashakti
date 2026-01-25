import React, { useState } from 'react';
import axios from 'axios';

const BackupRestoreBot = () => {
  const [status, setStatus] = useState({ loading: false, currentTask: '', progress: 0 });
  const [logs, setLogs] = useState([]);
  const [backupData, setBackupData] = useState(null);
  
  // ✅ Selection State: Konsa data upload karna hai
  const [selectedTasks, setSelectedTasks] = useState({
    suppliers: true,
    employees: true,
    purchases: true,
    sales: true,
    attendances: true
  });

  const BASE_URL = "http://localhost:5000/api";

  const taskMap = [
    { key: 'suppliers', label: 'Suppliers/Parties', url: '/suppliers/add' },
    { key: 'employees', label: 'Employees List', url: '/employees' },
    { key: 'purchases', label: 'Purchase Records', url: '/purchases' },
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
          setLogs(["📁 File loaded. Select categories and click 'Start Sync'."]);
        }
      } catch (err) {
        alert("JSON file valid nahi hai!");
      }
    };
    reader.readAsText(file);
  };

  const toggleTask = (key) => {
    setSelectedTasks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const startRestoration = async () => {
    if (!backupData) return alert("Pehle file upload karein!");
    
    setStatus({ loading: true, currentTask: 'Initializing...', progress: 0 });
    setLogs(["🚀 Bot started..."]);

    for (const task of taskMap) {
      // ✅ Checkbox Permission Check
      if (!selectedTasks[task.key]) {
        setLogs(prev => [`⏭️ Skipped ${task.label} (User Choice)`, ...prev]);
        continue;
      }

      const items = backupData[task.key] || [];
      if (items.length === 0) continue;

      setStatus(prev => ({ ...prev, currentTask: `Uploading ${task.label}...` }));

      for (let i = 0; i < items.length; i++) {
        try {
          const { _id, __v, createdAt, updatedAt, ...cleanData } = items[i];
          await axios.post(`${BASE_URL}${task.url}`, cleanData);
          setLogs(prev => [`✅ [${task.key}] Success: ${cleanData.billNo || cleanData.name || i+1}`, ...prev].slice(0, 50));
        } catch (err) {
          setLogs(prev => [`❌ ${task.key} Error: ${err.response?.data?.message || err.message}`, ...prev]);
        }
        await new Promise(r => setTimeout(r, 400));
      }
    }

    setStatus({ loading: false, currentTask: 'Finished!', progress: 100 });
    alert("Data Sync Completed! ✅");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 mt-10 font-sans">
      <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2">
        Dharashakti Admin Bot <span className="text-sm font-normal bg-blue-100 text-blue-600 px-2 py-1 rounded">v2.0</span>
      </h2>

      {/* 1. File Upload Section */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">1. Backup File Upload</label>
        <input 
          type="file" accept=".json" onChange={handleFileUpload} disabled={status.loading}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
        />
      </div>

      {/* 2. Selection Section (Permissions) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-3">2. Select Categories to Sync</label>
        <div className="grid grid-cols-2 gap-3">
          {taskMap.map(task => (
            <label key={task.key} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedTasks[task.key] ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <input 
                type="checkbox" 
                checked={selectedTasks[task.key]} 
                onChange={() => toggleTask(task.key)}
                className="w-4 h-4 text-blue-600 mr-3"
              />
              <span className="text-sm font-medium text-gray-700">{task.label}</span>
              <span className="ml-auto text-xs text-gray-400">({backupData?.[task.key]?.length || 0})</span>
            </label>
          ))}
        </div>
        <button 
          onClick={startRestoration}
          disabled={status.loading || !backupData}
          className={`w-full mt-4 py-3 rounded-xl font-bold text-white transition-all ${status.loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 shadow-lg'}`}
        >
          {status.loading ? 'Syncing Data... Please wait' : '🚀 Start Smart Sync'}
        </button>
      </div>

      {/* 3. Progress & Logs */}
      <div className="space-y-3">
        {status.loading && (
          <div className="bg-blue-600 h-2 rounded-full overflow-hidden transition-all duration-500 shadow-inner">
            <div className="bg-white/30 h-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        )}
        <div className="h-48 overflow-y-auto bg-gray-900 text-blue-400 p-4 rounded-xl font-mono text-xs border-2 border-gray-800 shadow-inner">
          <div className="text-gray-500 mb-2 border-b border-gray-800 pb-1">// SYSTEM_LOGS</div>
          {logs.map((log, i) => <div key={i} className="mb-1 leading-relaxed animate-in fade-in">{`> ${log}`}</div>)}
        </div>
      </div>
    </div>
  );
};

export default BackupRestoreBot;