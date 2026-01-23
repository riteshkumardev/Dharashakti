import React, { useState, useRef } from 'react';
import axios from 'axios';

const BackupManager = () => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // ✅ Fix: Backend URL detection logic
  // Agar Vite env variable nahi mil raha, toh yeh explicitly port 5000 hit karega
  const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl;
    
    // Agar local par hain toh localhost:5000, warna current origin
    return window.location.hostname === 'localhost' 
      ? "http://localhost:5000" 
      : window.location.origin;
  };

  const API_BASE_URL = getApiUrl();

  // --- 1. DOWNLOAD BACKUP LOGIC ---
  const downloadBackup = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/backup/export-all`, {
        responseType: 'blob',
        withCredentials: true
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Daharasakti_Backup_${date}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download Error:", error);
      // Detailed error message taaki pata chale request kahan gayi
      alert(`Backup fail! Request sent to: ${API_BASE_URL}/api/backup/export-all. Check if Backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. RESTORE BACKUP LOGIC ---
  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      "DHYAN DEIN: Purana data delete ho jayega. Kya aap aage badhna chahte hain?"
    );
    if (!confirmRestore) {
      event.target.value = null;
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        
        const response = await axios.post(
          `${API_BASE_URL}/api/backup/restore`,
          jsonData,
          { withCredentials: true }
        );

        if (response.data.success) {
          alert("Data successfully restore ho gaya! ✅");
          window.location.reload(); 
        }
      } catch (error) {
        console.error("Restore Error:", error);
        alert("Restore failed: " + (error.response?.data?.message || "JSON format invalid hai."));
      } finally {
        setLoading(false);
        event.target.value = null; 
      }
    };

    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', gap: '10px', padding: '5px' }}>
      <button onClick={downloadBackup} disabled={loading} style={buttonStyle("#28a745", loading)}>
        {loading ? "⌛ Processing..." : "📥 Export Backup"}
      </button>

      <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestore} style={{ display: 'none' }} />
      
      <button onClick={() => fileInputRef.current.click()} disabled={loading} style={buttonStyle("#007bff", loading)}>
        {loading ? "⌛ Processing..." : "📤 Import Backup"}
      </button>
    </div>
  );
};

const buttonStyle = (color, loading) => ({
  padding: "10px 18px",
  backgroundColor: loading ? "#ccc" : color,
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: loading ? "not-allowed" : "pointer",
  fontSize: "13px",
  fontWeight: "bold",
  transition: "0.3s"
});

export default BackupManager;